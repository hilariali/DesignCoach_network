
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { useTeamStore } from '@/store/teamStore';
import { useAuthStore } from '@/store/authStore';
import { getInitials, formatDate } from '@/lib/utils';
import { generateBusinessCanvas } from '@/lib/grokApi';
import * as api from '@/lib/api';
import type { TeamInvitation, UserProfile, ChatbotRoom, Milestone } from '@/types';
import {
  ArrowLeft, Users, MessageSquare, Bot, Trophy,
  Target, Calendar, CheckCircle, Circle, Briefcase,
  TrendingUp, Lightbulb, Sparkles, Trash2, Eye,
  Loader2, FileText, UserPlus, Crown, Shield,
  ShieldCheck, Plus, Hash, Edit2, X
} from 'lucide-react';

export default function TeamProfile() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { getTeamById } = useTeamStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [, setRefresh] = useState(0);
  const [team, setTeam] = useState<import('@/types').Team | null>(null);
  const [canvases, setCanvases] = useState<import('@/types').BusinessCanvasVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Member management state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [inviteRole, setInviteRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);

  // Role editing state
  const [editingRoleMember, setEditingRoleMember] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editIsManagement, setEditIsManagement] = useState(false);

  // New chatbot room state
  const [newRoomDialogOpen, setNewRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Milestone state
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  const reloadTeam = async () => {
    if (!teamId) return;
    const t = await getTeamById(teamId);
    setTeam(t || null);
  };

  useEffect(() => {
    if (teamId) {
      Promise.all([
        getTeamById(teamId),
        api.getCanvasesByTeamId(teamId),
        api.getInvitationsForTeam(teamId),
      ]).then(([t, c, invs]) => {
        setTeam(t || null);
        setCanvases(c || []);
        setTeamInvitations(invs || []);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [teamId]);

  // Reload canvases when refresh counter changes
  useEffect(() => {
    if (teamId) {
      api.getCanvasesByTeamId(teamId).then((c) => setCanvases(c || []));
    }
  }, [teamId]);

  // Pre-load user names for canvas generators
  const [userCache, setUserCache] = useState<Record<string, import('@/types').UserProfile>>({});
  useEffect(() => {
    canvases.forEach((c) => {
      if (c.generatedBy && !userCache[c.generatedBy]) {
        api.getUserById(c.generatedBy).then((u) => {
          if (u) setUserCache((prev) => ({ ...prev, [c.generatedBy]: u }));
        });
      }
    });
  }, [canvases]);

  // Permission helpers
  const isFounder = currentUser?.id === team?.founderId;
  const currentMember = team?.members.find(m => m.userId === currentUser?.id);
  const isManagementUser = isFounder || (currentMember?.isManagement ?? false);
  const isFounderOrManagement = isManagementUser;

  // Search users for invite
  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const allUsers = await api.getAllUsers();
    const teamMemberIds = team?.members.map(m => m.userId) || [];
    const results = allUsers.filter(
      u => !teamMemberIds.includes(u.id) &&
        (u.fullName.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(results.slice(0, 8));
  };

  // Send invitation
  const handleInvite = async () => {
    if (!selectedUserId || !inviteRole || !team || !currentUser) return;
    const invitedUser = await api.getUserById(selectedUserId);
    if (!invitedUser) return;

    const invitation: TeamInvitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      teamId: team.id,
      teamName: team.name,
      invitedUserId: selectedUserId,
      invitedBy: currentUser.id,
      invitedByName: currentUser.fullName,
      role: inviteRole,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
    };

    try {
      await api.createInvitation(invitation);
      setTeamInvitations(prev => [...prev, invitation]);
      toast({ title: 'Invitation sent!', description: `Invited ${invitedUser.fullName} as ${inviteRole}` });
      setInviteDialogOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUserId('');
      setInviteRole('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  // Update member role
  const handleUpdateRole = async (userId: string) => {
    if (!team || !editRoleName) return;
    await api.updateMemberRole(team.id, userId, editRoleName, editIsManagement);
    await reloadTeam();
    setEditingRoleMember(null);
    toast({ title: 'Role updated', description: `Updated role to ${editRoleName}` });
  };

  // Remove member
  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!team) return;
    await api.removeTeamMember(team.id, userId);
    await reloadTeam();
    toast({ title: 'Member removed', description: `${memberName} has been removed from the team` });
  };

  // Create new chatbot room
  const handleCreateChatbotRoom = async () => {
    if (!team || !currentUser || !newRoomName.trim()) return;

    const roomChatId = `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newRoom: ChatbotRoom = {
      id: `room_${Date.now()}`,
      chatId: roomChatId,
      name: newRoomName.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
    };

    // Save the chat for this room
    await api.saveChat({
      id: roomChatId,
      name: `${team.name} — ${newRoom.name}`,
      type: 'bot',
      participants: [...team.members.map(m => m.userId), 'bot'],
      teamId: team.id,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    });

    // Add welcome message
    await api.saveMessage({
      id: `msg_bot_${Date.now()}`,
      chatId: roomChatId,
      senderId: 'bot',
      senderType: 'bot',
      content: `Welcome to the "${newRoom.name}" discussion room! I'm your AI business coach. How can I help your team today?`,
      type: 'text',
      timestamp: new Date().toISOString(),
    });

    // Update team with new room
    const updatedRooms = [...(team.chatbotRooms || []), newRoom];
    await api.saveTeam({ ...team, chatbotRooms: updatedRooms });
    setTeam(prev => prev ? { ...prev, chatbotRooms: updatedRooms } : null);
    setNewRoomDialogOpen(false);
    setNewRoomName('');
    toast({ title: 'Room created!', description: `AI room "${newRoom.name}" is ready` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">Team not found</h2>
          <p className="text-gray-500 mt-2">The team you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/teams')} className="mt-4">
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  const completedMilestones = team.milestones.filter(m => m.completed).length;
  const milestoneProgress = team.milestones.length > 0
    ? (completedMilestones / team.milestones.length) * 100
    : 0;

  // Resolve chatbot rooms (fallback for legacy teams)
  const chatbotRooms: ChatbotRoom[] = team.chatbotRooms?.length
    ? team.chatbotRooms
    : [{ id: 'legacy', chatId: team.chatbotChatId, name: 'General', createdAt: team.createdAt, createdBy: team.founderId || '' }];

  const handleGenerateCanvas = async () => {
    if (!currentUser || !team) return;

    setIsGenerating(true);
    toast({
      title: '✨ Generating Canvas...',
      description: 'The AI is analyzing your conversations and building a Business Model Canvas. This may take a moment.',
    });

    try {
      // Gather team chat messages
      const teamChatMsgs = await api.getMessagesByChatId(team.chatId);
      const teamChatMessages = teamChatMsgs
        .filter((m) => m.senderType === 'user' || m.senderType === 'bot')
        .map((m) => ({
          role: (m.senderType === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content,
        }));

      // Gather AI coach chat messages
      const aiChatMsgs = await api.getMessagesByChatId(team.chatbotChatId);
      const aiChatMessages = aiChatMsgs
        .filter((m) => m.senderType === 'user' || m.senderType === 'bot')
        .map((m) => ({
          role: (m.senderType === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content,
        }));

      const { html, summary } = await generateBusinessCanvas(
        teamChatMessages,
        aiChatMessages,
        team.name
      );

      const version = await api.getNextCanvasVersion(team.id);
      const newCanvas = {
        id: `canvas_${team.id}_${Date.now()}`,
        teamId: team.id,
        version,
        htmlContent: html,
        summary,
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser.id,
      };

      await api.saveCanvas(newCanvas);
      setRefresh((prev) => prev + 1);

      toast({
        title: '🎉 Canvas Generated!',
        description: `Version ${version} of your Business Model Canvas is ready.`,
      });

      // Navigate to the new canvas
      navigate(`/canvas/${newCanvas.id}`);
    } catch (error) {
      console.error('Canvas generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCanvas = async (canvasId: string, version: number) => {
    if (window.confirm(`Delete Business Canvas v${version}? This cannot be undone.`)) {
      await api.deleteCanvas(canvasId);
      // Reload canvases
      const updated = await api.getCanvasesByTeamId(team.id);
      setCanvases(updated);
      toast({
        title: 'Canvas Deleted',
        description: `Version ${version} has been removed.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{team.name}</h1>
                <p className="text-sm text-gray-500">
                  Created {formatDate(team.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/chat/${team.chatId}`)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Team Chat
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/chatbot/${chatbotRooms[0]?.chatId || team.chatbotChatId}`)}
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Coach
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="ai-rooms" className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              AI Rooms
              <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0 ml-0.5">
                {chatbotRooms.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="canvas" className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Canvas
              {canvases.length > 0 && (
                <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 ml-1">
                  {canvases.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="business-model">Legacy</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{team.description || 'No description provided.'}</p>
              </CardContent>
            </Card>

            {/* Combined Expertise & Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Combined Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {team.combinedExpertise.map((exp, idx) => (
                      <Badge key={idx} variant="outline">{exp}</Badge>
                    ))}
                    {team.combinedExpertise.length === 0 && (
                      <span className="text-gray-400 text-sm">No expertise listed</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Combined Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {team.combinedResources.map((resource, idx) => (
                      <Badge key={idx} variant="outline" className="bg-green-50">{resource}</Badge>
                    ))}
                    {team.combinedResources.length === 0 && (
                      <span className="text-gray-400 text-sm">No resources listed</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Team Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <span className="text-xs text-gray-400 mt-1">
                          {formatDate(achievement.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {team.achievements.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No achievements yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Milestone Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Milestone Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {completedMilestones} of {team.milestones.length} completed
                  </span>
                  <span className="text-sm font-medium">{Math.round(milestoneProgress)}%</span>
                </div>
                <Progress value={milestoneProgress} className="h-2" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {/* Invite Button */}
            {isManagementUser && (
              <div className="flex justify-end">
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Invite a Team Member</DialogTitle>
                      <DialogDescription>
                        Search for a user to invite. The invitation expires in 24 hours.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                      />
                      {searchResults.length > 0 && (
                        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                          {searchResults.map(u => (
                            <div
                              key={u.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selectedUserId === u.id ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-50'
                                }`}
                              onClick={() => setSelectedUserId(u.id)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={u.profilePicture} />
                                <AvatarFallback className="bg-blue-100 text-xs">{getInitials(u.fullName)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{u.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              </div>
                              {selectedUserId === u.id && <CheckCircle className="w-4 h-4 text-blue-600" />}
                            </div>
                          ))}
                        </div>
                      )}
                      <Input
                        placeholder="Role name (e.g. Developer, Designer, Advisor)"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleInvite} disabled={!selectedUserId || !inviteRole}>
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Team Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({team.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.map((member) => {
                    const isMemberFounder = member.userId === team.founderId;
                    const canEditThisMember = isFounder || (isManagementUser && !isMemberFounder && !member.isManagement);
                    const isEditingThis = editingRoleMember === member.userId;

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <Avatar
                          className="w-12 h-12 cursor-pointer"
                          onClick={() => navigate(`/profile/${member.userId}`)}
                        >
                          <AvatarImage src={member.user?.profilePicture} />
                          <AvatarFallback className="bg-blue-100">
                            {getInitials(member.user?.fullName || 'U')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className="font-medium cursor-pointer hover:text-blue-600"
                              onClick={() => navigate(`/profile/${member.userId}`)}
                            >
                              {member.user?.fullName}
                            </h4>
                            {isMemberFounder && (
                              <Badge className="bg-amber-100 text-amber-700 text-xs gap-1">
                                <Crown className="w-3 h-3" /> Founder
                              </Badge>
                            )}
                            {member.isManagement && !isMemberFounder && (
                              <Badge className="bg-indigo-100 text-indigo-700 text-xs gap-1">
                                <ShieldCheck className="w-3 h-3" /> Management
                              </Badge>
                            )}
                            {member.user?.userType === 'expert' && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">Expert</Badge>
                            )}
                          </div>

                          {/* Role display or editing */}
                          {isEditingThis ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                className="h-8 text-sm w-40"
                                value={editRoleName}
                                onChange={(e) => setEditRoleName(e.target.value)}
                                placeholder="Role name"
                              />
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editIsManagement}
                                  onChange={(e) => setEditIsManagement(e.target.checked)}
                                  className="rounded"
                                />
                                <Shield className="w-3 h-3" /> Management
                              </label>
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleUpdateRole(member.userId)}>
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingRoleMember(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">{member.role}</p>
                          )}

                          <p className="text-xs text-gray-400">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        {canEditThisMember && !isMemberFounder && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Edit role"
                              onClick={() => {
                                setEditingRoleMember(member.userId);
                                setEditRoleName(member.role);
                                setEditIsManagement(member.isManagement || false);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            {isFounder && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Remove member"
                                onClick={() => handleRemoveMember(member.userId, member.user?.fullName || 'Member')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {isManagementUser && teamInvitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Pending Invitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamInvitations.map((inv) => {
                      const isExpired = new Date(inv.expiresAt) < new Date() || inv.status === 'expired';
                      const isAccepted = inv.status === 'accepted';
                      return (
                        <div
                          key={inv.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isExpired ? 'bg-gray-100 opacity-60' : isAccepted ? 'bg-green-50' : 'bg-blue-50'
                            }`}
                        >
                          <div>
                            <p className="text-sm font-medium">
                              Invited user <span className="text-gray-500">(as {inv.role})</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Sent by {inv.invitedByName} · {formatDate(inv.createdAt)}
                            </p>
                          </div>
                          <Badge className={`text-xs ${isExpired ? 'bg-gray-200 text-gray-600' :
                            isAccepted ? 'bg-green-100 text-green-700' :
                              inv.status === 'declined' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {isExpired ? 'Expired' : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Rooms Tab */}
          <TabsContent value="ai-rooms" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  AI Chat Rooms
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Create separate rooms for different discussion topics
                </p>
              </div>
              <Dialog open={newRoomDialogOpen} onOpenChange={setNewRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create AI Chat Room</DialogTitle>
                    <DialogDescription>
                      Create a new AI coach discussion room for a specific topic.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="Room name (e.g. Growth Strategy, Marketing Plan)"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewRoomDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={handleCreateChatbotRoom}
                      disabled={!newRoomName.trim()}
                      className="bg-gradient-to-r from-purple-500 to-blue-600"
                    >
                      Create Room
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chatbotRooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-purple-400 hover:border-l-purple-600"
                  onClick={() => navigate(`/chatbot/${room.chatId}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base">{room.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Created {formatDate(room.createdAt)}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Milestones
                  </CardTitle>
                  {isFounderOrManagement && (
                    <Dialog open={milestoneDialogOpen} onOpenChange={(open) => {
                      setMilestoneDialogOpen(open);
                      if (!open) { setEditingMilestone(null); setMilestoneTitle(''); setMilestoneDescription(''); setMilestoneDate(''); }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Milestone
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}</DialogTitle>
                          <DialogDescription>
                            {editingMilestone ? 'Update this milestone' : 'Set a new goal for your team'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                          <Input
                            placeholder="Milestone title"
                            value={milestoneTitle}
                            onChange={(e) => setMilestoneTitle(e.target.value)}
                          />
                          <textarea
                            placeholder="Description (optional)"
                            value={milestoneDescription}
                            onChange={(e) => setMilestoneDescription(e.target.value)}
                            className="w-full border rounded-lg p-3 min-h-[60px] text-sm resize-none focus:ring-2 focus:ring-green-200 focus:outline-none"
                          />
                          <Input
                            type="date"
                            value={milestoneDate}
                            onChange={(e) => setMilestoneDate(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => { setMilestoneDialogOpen(false); setEditingMilestone(null); }}>Cancel</Button>
                          <Button
                            onClick={async () => {
                              if (!team || !milestoneTitle.trim()) return;
                              let updatedMilestones;
                              if (editingMilestone) {
                                updatedMilestones = team.milestones.map((m) =>
                                  m.id === editingMilestone.id
                                    ? { ...m, title: milestoneTitle.trim(), description: milestoneDescription.trim(), date: milestoneDate || m.date }
                                    : m
                                );
                              } else {
                                const newMs: Milestone = {
                                  id: `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                                  title: milestoneTitle.trim(),
                                  description: milestoneDescription.trim(),
                                  date: milestoneDate || new Date().toISOString(),
                                  completed: false,
                                };
                                updatedMilestones = [...team.milestones, newMs];
                              }
                              const updated = { ...team, milestones: updatedMilestones };
                              await api.saveTeam(updated);
                              setTeam(updated);
                              setMilestoneDialogOpen(false);
                              setEditingMilestone(null);
                              setMilestoneTitle('');
                              setMilestoneDescription('');
                              setMilestoneDate('');
                              toast({ title: editingMilestone ? 'Milestone updated' : 'Milestone added!' });
                            }}
                            disabled={!milestoneTitle.trim()}
                            className="bg-gradient-to-r from-green-500 to-emerald-600"
                          >
                            {editingMilestone ? 'Save Changes' : 'Add Milestone'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex gap-4 p-4 rounded-lg ${milestone.completed ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                    >
                      <button
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${milestone.completed ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        onClick={async () => {
                          if (!isFounderOrManagement) return;
                          const updatedMilestones = team.milestones.map((m) =>
                            m.id === milestone.id ? { ...m, completed: !m.completed } : m
                          );
                          const updated = { ...team, milestones: updatedMilestones };
                          await api.saveTeam(updated);
                          setTeam(updated);
                        }}
                        title={isFounderOrManagement ? 'Toggle completion' : undefined}
                      >
                        {milestone.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${milestone.completed ? 'line-through text-gray-500' : ''}`}>
                            {milestone.title}
                          </h4>
                          {milestone.completed && (
                            <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        <span className="text-xs text-gray-400 mt-1">
                          Target: {formatDate(milestone.date)}
                        </span>
                      </div>
                      {isFounderOrManagement && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingMilestone(milestone);
                              setMilestoneTitle(milestone.title);
                              setMilestoneDescription(milestone.description);
                              setMilestoneDate(milestone.date?.split('T')[0] || '');
                              setMilestoneDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={async () => {
                              const updatedMilestones = team.milestones.filter((m) => m.id !== milestone.id);
                              const updated = { ...team, milestones: updatedMilestones };
                              await api.saveTeam(updated);
                              setTeam(updated);
                              toast({ title: 'Milestone deleted' });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {team.milestones.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No milestones set yet</p>
                      {isFounderOrManagement && <p className="text-sm mt-1">Click "Add Milestone" to create your first goal</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== Business Canvas Tab (NEW) ====== */}
          <TabsContent value="canvas" className="space-y-6">
            {/* Generate Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Business Model Canvas
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {canvases.length > 0
                    ? `${canvases.length} version${canvases.length > 1 ? 's' : ''} generated`
                    : 'No canvases generated yet'}
                </p>
              </div>
              <Button
                onClick={handleGenerateCanvas}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate New Canvas
                  </>
                )}
              </Button>
            </div>

            {/* Canvas List */}
            {canvases.length === 0 ? (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Business Canvas Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Chat with your AI Coach first to discuss your business ideas, then generate a
                      Business Model Canvas from the conversation context.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/chatbot/${team.chatbotChatId}`)}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Chat with AI Coach
                      </Button>
                      <Button
                        onClick={handleGenerateCanvas}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Anyway
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {canvases.map((canvas) => {
                  const generatedBy = userCache[canvas.generatedBy];
                  return (
                    <Card
                      key={canvas.id}
                      className="hover:shadow-md transition-shadow border-l-4 border-l-purple-400"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-purple-100 text-purple-700 text-xs font-semibold">
                                v{canvas.version}
                              </Badge>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(canvas.generatedAt)}
                              </span>
                              {generatedBy && (
                                <span className="text-xs text-gray-400">
                                  by {generatedBy.fullName}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {canvas.summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/canvas/${canvas.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteCanvas(canvas.id, canvas.version)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Generation info */}
            {isGenerating && (
              <Card className="border-dashed border-purple-300 bg-purple-50/50">
                <CardContent className="py-8">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-3" />
                    <p className="text-purple-700 font-medium">Generating your Business Model Canvas...</p>
                    <p className="text-sm text-purple-500 mt-1">
                      Analyzing team chat and AI coach conversations...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Legacy Business Model Tab */}
          <TabsContent value="business-model">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Business Model Canvas (Legacy)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {team.businessModel ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(team.businessModel).map(([key, values]) => {
                      const label = {
                        keyPartners: 'Key Partners',
                        keyActivities: 'Key Activities',
                        keyResources: 'Key Resources',
                        valuePropositions: 'Value Propositions',
                        customerRelationships: 'Customer Relationships',
                        channels: 'Channels',
                        customerSegments: 'Customer Segments',
                        costStructure: 'Cost Structure',
                        revenueStreams: 'Revenue Streams'
                      }[key] || key;
                      return (
                        <div key={key} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                            <h4 className="font-medium text-sm">{label}</h4>
                          </div>
                          <ul className="space-y-2">
                            {(values as string[]).map((value: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                {value}
                              </li>
                            ))}
                            {values.length === 0 && (
                              <li className="text-sm text-gray-400 italic">Not defined yet</li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-700">No Business Model Yet</h3>
                    <p className="mt-1">Use the AI-generated Canvas tab instead</p>
                    <Button
                      onClick={() => navigate(`/chatbot/${team.chatbotChatId}`)}
                      className="mt-4"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Generate with AI Coach
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
