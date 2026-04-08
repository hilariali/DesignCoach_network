import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { getInitials, getRatingColor } from '@/lib/utils';
import type { UserProfile } from '@/types';
import {
    MessageSquare, Star, Trash2,
    ArrowLeft, Loader2, Bookmark
} from 'lucide-react';

export default function SavedProfiles() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useAuthStore();
    const { getUserById, unsaveProfile, sendChatRequest } = useProfileStore();

    const [savedUsers, setSavedUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved profiles
    useEffect(() => {
        const loadSaved = async () => {
            if (!currentUser) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const { getSavedProfiles } = await import('@/lib/api');
            const savedIds = await getSavedProfiles(currentUser.id);
            const users: UserProfile[] = [];
            for (const id of savedIds) {
                const user = await getUserById(id);
                if (user) users.push(user);
            }
            setSavedUsers(users);
            setIsLoading(false);
        };
        loadSaved();
    }, [currentUser]);

    const handleRemove = async (userId: string) => {
        if (!currentUser) return;
        await unsaveProfile(currentUser.id, userId);
        setSavedUsers((prev) => prev.filter((u) => u.id !== userId));
        toast({ title: 'Profile removed from saved list' });
    };

    const handleChatRequest = async (userId: string) => {
        if (!currentUser) return;
        const success = await sendChatRequest(userId);
        if (success) {
            toast({ title: 'Chat started!', description: 'Opening your conversation...' });
            const chatId = [currentUser.id, userId].sort().join('_dm_');
            navigate(`/chat/${chatId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Saved Profiles</h1>
                            <p className="text-sm text-gray-500">
                                {savedUsers.length} saved profile{savedUsers.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : savedUsers.length === 0 ? (
                    <div className="text-center py-16">
                        <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">No saved profiles</h3>
                        <p className="text-gray-500 mt-1 mb-4">
                            Browse and save profiles from the Find People page
                        </p>
                        <Button onClick={() => navigate('/search')}>
                            Find People
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedUsers.map((user) => (
                            <Card
                                key={user.id}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar
                                            className="w-14 h-14 cursor-pointer"
                                            onClick={() => navigate(`/profile/${user.id}`)}
                                        >
                                            <AvatarImage src={user.profilePicture} />
                                            <AvatarFallback className="bg-blue-100">
                                                {getInitials(user.fullName)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => navigate(`/profile/${user.id}`)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold truncate">{user.fullName}</h3>
                                                {user.userType === 'expert' && (
                                                    <Badge className="bg-purple-100 text-purple-700 text-xs">Expert</Badge>
                                                )}
                                                <span className={`text-sm flex items-center gap-0.5 ${getRatingColor(user.rating.overall)}`}>
                                                    <Star className="w-3 h-3" />
                                                    {user.rating.overall.toFixed(1)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {user.bio || 'No bio provided.'}
                                            </p>

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {user.expertiseDomains.slice(0, 3).map((exp, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">{exp}</Badge>
                                                ))}
                                                {user.expertiseDomains.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{user.expertiseDomains.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => handleChatRequest(user.id)}
                                                title="Send message"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleRemove(user.id)}
                                                title="Remove from saved"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
