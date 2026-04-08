import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { formatDate } from '@/lib/utils';
import type { Team } from '@/types';
import {
  Plus, Search, Users, Trophy, Target,
  MessageSquare, Bot, Loader2
} from 'lucide-react';

export default function TeamList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { getUserTeams, createTeam } = useTeamStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load teams asynchronously
  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      getUserTeams(currentUser.id).then((teams) => {
        setUserTeams(teams);
        setIsLoading(false);
      });
    } else {
      setUserTeams([]);
      setIsLoading(false);
    }
  }, [currentUser]);

  const filteredTeams = userTeams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast({ title: 'Team name required', variant: 'destructive' });
      return;
    }

    if (!currentUser) return;

    setIsCreating(true);
    const team = await createTeam({
      name: newTeam.name.trim(),
      description: newTeam.description.trim(),
      members: [{ userId: currentUser.id, role: 'Founder', joinedAt: new Date().toISOString(), isManagement: true }],
    });

    if (team) {
      toast({ title: 'Team created!', description: `${team.name} is ready to go.` });
      setIsCreateDialogOpen(false);
      setNewTeam({ name: '', description: '' });
      navigate(`/teams/${team.id}`);
    } else {
      toast({ title: 'Failed to create team', variant: 'destructive' });
    }
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">My Teams</h1>
              <p className="text-sm text-gray-500">
                {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Team</DialogTitle>
                  <DialogDescription>
                    Start a new startup team with a name and description.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      placeholder="e.g., TechVenture Alpha"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamDescription">Description</Label>
                    <Textarea
                      id="teamDescription"
                      placeholder="What is this team about?"
                      value={newTeam.description}
                      onChange={(e) => setNewTeam((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Team'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          {userTeams.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </div>

      {/* Team List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredTeams.length === 0 && userTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No teams yet</h3>
            <p className="text-gray-500 mt-1 mb-4">
              Create your first team to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No matching teams</h3>
            <p className="text-gray-500 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTeams.map((team) => {
              const completedMilestones = team.milestones.filter((m) => m.completed).length;
              return (
                <Card
                  key={team.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="font-semibold text-blue-600 text-lg">
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                            {team.description || 'No description'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                            </Badge>
                            {team.achievements.length > 0 && (
                              <Badge variant="outline" className="text-xs bg-yellow-50">
                                <Trophy className="w-3 h-3 mr-1" />
                                {team.achievements.length} achievement{team.achievements.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {team.milestones.length > 0 && (
                              <Badge variant="outline" className="text-xs bg-green-50">
                                <Target className="w-3 h-3 mr-1" />
                                {completedMilestones}/{team.milestones.length} milestones
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/chat/${team.chatId}`)}
                          title="Team Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/chatbot/${team.chatbotChatId}`)}
                          title="AI Coach"
                        >
                          <Bot className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 mt-3">
                      Created {formatDate(team.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
