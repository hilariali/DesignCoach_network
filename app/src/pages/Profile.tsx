import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { getInitials, formatDate, getRatingColor, getProfileCompletenessColor } from '@/lib/utils';
import type { UserProfile } from '@/types';
import {
  Edit, Star, Bookmark, BookmarkCheck, MessageSquare,
  Flag, Share2, Mail, Calendar,
  Award, Briefcase, Users, TrendingUp, Trophy, Loader2
} from 'lucide-react';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { getUserById, saveProfile, unsaveProfile, isProfileSaved, sendChatRequest, reportUser } = useProfileStore();

  const [reportReason, setReportReason] = useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no userId in URL, show current user's profile
  const isOwnProfile = !userId || userId === currentUser?.id;

  // Load profile data asynchronously
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      if (isOwnProfile) {
        setProfileUser(currentUser);
      } else if (userId) {
        const user = await getUserById(userId);
        setProfileUser(user || null);
      }
      setIsLoading(false);
    };
    loadProfile();
  }, [userId, currentUser, isOwnProfile]);

  // Load saved status asynchronously
  useEffect(() => {
    const checkSaved = async () => {
      if (currentUser && profileUser && !isOwnProfile) {
        const saved = await isProfileSaved(currentUser.id, profileUser.id);
        setIsSaved(saved);
      }
    };
    checkSaved();
  }, [currentUser, profileUser, isOwnProfile]);

  const handleSaveToggle = async () => {
    if (!currentUser || !profileUser) return;
    if (isSaved) {
      await unsaveProfile(currentUser.id, profileUser.id);
      setIsSaved(false);
      toast({ title: 'Profile removed from saved' });
    } else {
      await saveProfile(currentUser.id, profileUser.id);
      setIsSaved(true);
      toast({ title: 'Profile saved!' });
    }
  };

  const handleChatRequest = async () => {
    if (!profileUser || !currentUser) return;
    const success = await sendChatRequest(profileUser.id);
    if (success) {
      toast({ title: 'Chat started!', description: 'Opening your conversation...' });
      // Navigate to the DM chat — sendChatRequest now returns the chatId via store
      // We need to find the chat. Let's navigate to it after a brief delay
      // The chat ID is constructed from the two user IDs
      const chatId = [currentUser.id, profileUser.id].sort().join('_dm_');
      navigate(`/chat/${chatId}`);
    }
  };

  const handleReport = async () => {
    if (!profileUser) return;
    const success = await reportUser(profileUser.id, reportReason);
    if (success) {
      toast({ title: 'Report submitted', description: 'Thank you for helping keep our community safe.' });
      setReportReason('');
      setIsReportDialogOpen(false);
    }
  };

  const handleShare = () => {
    if (!profileUser) return;
    navigator.clipboard.writeText(`${window.location.origin}/profile/${profileUser.id}`);
    toast({ title: 'Profile link copied to clipboard!' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">User not found</h2>
          <p className="text-gray-500 mt-2">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/search')} className="mt-4">
            Search Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileUser.profilePicture} />
                <AvatarFallback className="text-2xl bg-blue-100">
                  {getInitials(profileUser.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{profileUser.fullName}</h1>
                  {profileUser.userType === 'expert' && (
                    <Badge className="bg-purple-100 text-purple-700">Expert</Badge>
                  )}
                </div>
                <p className="text-gray-500">
                  {profileUser.expectation === 'team_up'
                    ? 'Looking to team up'
                    : 'Available for hire'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(profileUser.membershipDate)}
                  </span>
                  {profileUser.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {profileUser.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 md:ml-auto">
              {isOwnProfile ? (
                <Button onClick={() => navigate('/profile/edit')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={handleChatRequest}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" onClick={handleSaveToggle}>
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4 mr-2 text-blue-600" />
                    ) : (
                      <Bookmark className="w-4 h-4 mr-2" />
                    )}
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Flag className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report User</DialogTitle>
                        <DialogDescription>
                          Please describe why you are reporting this user.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Reason for report..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleReport} disabled={!reportReason.trim()}>
                          Submit Report
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Completeness (own profile only) */}
        {isOwnProfile && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completeness</span>
                <span className="text-sm text-gray-500">{profileUser.profileCompleteness}%</span>
              </div>
              <Progress
                value={profileUser.profileCompleteness}
                className={`h-2 ${getProfileCompletenessColor(profileUser.profileCompleteness)}`}
              />
              {profileUser.profileCompleteness < 80 && (
                <p className="text-xs text-gray-500 mt-2">
                  Complete your profile to improve visibility and matchmaking quality.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bio */}
        {profileUser.bio && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 whitespace-pre-wrap">{profileUser.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Expertise & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileUser.expertiseDomains.map((exp, idx) => (
                  <Badge key={idx} variant="outline">{exp}</Badge>
                ))}
                {profileUser.expertiseDomains.length === 0 && (
                  <span className="text-gray-400 text-sm">No expertise listed</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Resources & Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileUser.resourcesAssets.map((resource, idx) => (
                  <Badge key={idx} variant="outline" className="bg-green-50">{resource}</Badge>
                ))}
                {profileUser.resourcesAssets.length === 0 && (
                  <span className="text-gray-400 text-sm">No resources listed</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Target Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Target Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profileUser.targetCustomers.map((tc, idx) => (
                <Badge key={idx} className="bg-blue-50 text-blue-700">{tc}</Badge>
              ))}
              {profileUser.targetCustomers.length === 0 && (
                <span className="text-gray-400 text-sm">No target customers specified</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Track Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Track Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileUser.trackRecords.map((record, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{record.title}</h4>
                    <p className="text-sm text-gray-600">{record.description}</p>
                    {record.date && (
                      <span className="text-xs text-gray-400 mt-1">{record.date}</span>
                    )}
                  </div>
                </div>
              ))}
              {profileUser.trackRecords.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No track records yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5" />
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getRatingColor(profileUser.rating.overall)}`}>
                  {profileUser.rating.overall.toFixed(1)}
                </div>
                <p className="text-sm text-gray-500">Overall</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Membership</span>
                  <span className="font-medium">{profileUser.rating.membershipScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Teams</span>
                  <span className="font-medium">{profileUser.rating.teamScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Projects</span>
                  <span className="font-medium">{profileUser.rating.projectScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Training</span>
                  <span className="font-medium">{profileUser.rating.trainingScore.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold">{profileUser.teamsJoined}</div>
                <div className="text-gray-500 text-xs">Teams Joined</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold">{profileUser.successfulProjects}</div>
                <div className="text-gray-500 text-xs">Projects</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold">{profileUser.offlineTrainings}</div>
                <div className="text-gray-500 text-xs">Trainings</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold">{profileUser.profileCompleteness}%</div>
                <div className="text-gray-500 text-xs">Profile</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
