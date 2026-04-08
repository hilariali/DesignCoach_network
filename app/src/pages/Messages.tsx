import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import * as api from '@/lib/api';
import { getInitials, formatTime } from '@/lib/utils';
import type { Chat, UserProfile } from '@/types';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function Messages() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [dmChats, setDmChats] = useState<Chat[]>([]);
    const [userCache, setUserCache] = useState<Record<string, UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load all DM chats for this user
    useEffect(() => {
        const loadChats = async () => {
            if (!currentUser) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const allChats = await api.getAllChats();
            const myDMs = allChats.filter(
                (c) => c.type === 'dm' && c.participants.includes(currentUser.id)
            );
            setDmChats(myDMs);

            // Load other users' profiles
            for (const chat of myDMs) {
                const otherId = chat.participants.find((p) => p !== currentUser.id);
                if (otherId && !userCache[otherId]) {
                    const user = await api.getUserById(otherId);
                    if (user) {
                        setUserCache((prev) => ({ ...prev, [otherId]: user }));
                    }
                }
            }
            setIsLoading(false);
        };
        loadChats();
    }, [currentUser]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">Messages</h1>
                    <p className="text-sm text-gray-500">
                        {dmChats.length} conversation{dmChats.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : dmChats.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                        <p className="text-gray-500 mt-1">
                            Start a conversation by messaging someone from the Find People page
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {dmChats.map((chat) => {
                            const otherId = chat.participants.find((p) => p !== currentUser?.id);
                            const otherUser = otherId ? userCache[otherId] : null;

                            return (
                                <Card
                                    key={chat.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-12 h-12">
                                                <AvatarImage src={otherUser?.profilePicture} />
                                                <AvatarFallback className="bg-purple-100 text-purple-600">
                                                    {getInitials(otherUser?.fullName || 'U')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold truncate">
                                                        {otherUser?.fullName || 'User'}
                                                    </h3>
                                                    <span className="text-xs text-gray-400">
                                                        {formatTime(chat.updatedAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                                    {chat.lastMessage?.content || 'Start chatting...'}
                                                </p>
                                            </div>
                                            {chat.unreadCount > 0 && (
                                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">{chat.unreadCount}</span>
                                                </div>
                                            )}
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
