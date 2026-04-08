import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import * as api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';
import {
  Heart, MessageCircle, Share2, Trophy, Calendar,
  TrendingUp, Megaphone, Filter, PenSquare, Send,
  AlertTriangle, Ban, Flag, MoreHorizontal
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { NewsPost, NewsComment, UserProfile, Chat } from '@/types';

const getPostIcon = (type: string) => {
  switch (type) {
    case 'achievement':
      return Trophy;
    case 'milestone':
      return TrendingUp;
    case 'announcement':
      return Megaphone;
    default:
      return Calendar;
  }
};

const getPostColor = (type: string) => {
  switch (type) {
    case 'achievement':
      return 'bg-yellow-100 text-yellow-700';
    case 'milestone':
      return 'bg-green-100 text-green-700';
    case 'announcement':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function NewsFeed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [authorCache, setAuthorCache] = useState<Record<string, UserProfile>>({});
  const [connectedUserIds, setConnectedUserIds] = useState<string[]>([]);

  // New post form
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<string>('general');

  // Comments
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  // Share dialog
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [dmChats, setDmChats] = useState<Chat[]>([]);
  const [dmUserCache, setDmUserCache] = useState<Record<string, UserProfile>>({});

  // Block/Report dialog
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Load connections, news, and authors
  useEffect(() => {
    if (!currentUser) return;

    // Load connections
    api.getConnectedUserIds(currentUser.id).then((ids) => {
      setConnectedUserIds(ids);
    });

    // Load news posts
    api.getAllNews().then((posts) => {
      setNewsPosts(posts);
      // Pre-load all authors
      const authorIds = [...new Set(posts.map((p) => p.authorId))];
      authorIds.forEach((id) => {
        api.getUserById(id).then((u) => {
          if (u) setAuthorCache((prev) => ({ ...prev, [id]: u }));
        });
      });
    });

    // Load DM chats for share feature
    api.getAllChats().then((chats) => {
      const myDMs = chats.filter(
        (c) => c.type === 'dm' && c.participants.includes(currentUser.id)
      );
      setDmChats(myDMs);
      myDMs.forEach((c) => {
        const otherId = c.participants.find((p) => p !== currentUser.id);
        if (otherId) {
          api.getUserById(otherId).then((u) => {
            if (u) setDmUserCache((prev) => ({ ...prev, [otherId]: u }));
          });
        }
      });
    });
  }, [currentUser]);

  // Filter posts to only show connected users' posts (plus own posts)
  const filteredByConnection = newsPosts.filter((post) => {
    if (!currentUser) return true;
    if (post.authorId === currentUser.id) return true;
    return connectedUserIds.includes(post.authorId);
  });

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    const updated = await api.likeNewsPost(postId, currentUser.id);
    setNewsPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  const handleComment = async (postId: string) => {
    if (!currentUser) return;
    const content = commentInput[postId]?.trim();
    if (!content) return;

    const comment: NewsComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId,
      authorId: currentUser.id,
      content,
      timestamp: new Date().toISOString(),
    };

    const updated = await api.addNewsComment(postId, comment);
    setNewsPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    setCommentInput((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleShareToDM = async (postId: string, chatId: string) => {
    if (!currentUser) return;
    const post = newsPosts.find((p) => p.id === postId);
    const author = post ? authorCache[post.authorId] : null;
    const shareContent = `📢 Shared a post from ${author?.fullName || 'someone'}:\n\n"${post?.content?.substring(0, 200) || ''}${(post?.content?.length || 0) > 200 ? '...' : ''}"`;

    await api.saveMessage({
      id: `msg_share_${Date.now()}`,
      chatId,
      senderId: currentUser.id,
      senderType: 'user',
      content: shareContent,
      type: 'text',
      timestamp: new Date().toISOString(),
    });

    // Update chat
    const chat = await api.getChatById(chatId);
    if (chat) {
      await api.saveChat({
        ...chat,
        lastMessage: {
          id: `msg_share_${Date.now()}`,
          chatId,
          senderId: currentUser.id,
          senderType: 'user',
          content: shareContent,
          type: 'text',
          timestamp: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      });
    }

    setSharePostId(null);
    toast({ title: 'Post shared!', description: 'Sent to DM successfully' });
  };

  const handleCreatePost = async () => {
    if (!currentUser || !newPostContent.trim()) return;

    const post: NewsPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: currentUser.id,
      content: newPostContent.trim(),
      likes: 0,
      likedBy: [],
      comments: 0,
      commentsList: [],
      timestamp: new Date().toISOString(),
      type: newPostType as NewsPost['type'],
    };

    await api.saveNewsPost(post);
    setNewsPosts((prev) => [post, ...prev]);
    setAuthorCache((prev) => ({ ...prev, [currentUser.id]: currentUser }));
    setNewPostContent('');
    setNewPostType('general');
    setShowNewPost(false);
    toast({ title: 'Post published!' });
  };

  const handleBlock = async (targetUserId: string) => {
    if (!currentUser) return;
    await api.blockUser(currentUser.id, targetUserId);
    // Remove from connections
    setConnectedUserIds((prev) => prev.filter((id) => id !== targetUserId));
    toast({ title: 'User blocked', description: 'They will no longer appear in your feed.' });
  };

  const handleReport = async () => {
    if (!currentUser || !reportUserId || !reportReason.trim()) return;
    await api.reportUser(currentUser.id, reportUserId, reportReason.trim());
    setReportUserId(null);
    setReportReason('');
    toast({ title: 'Report submitted', description: 'Thank you. We will review this.' });
  };

  const getAuthor = (authorId: string) => {
    return authorCache[authorId];
  };

  const filteredPosts = {
    all: filteredByConnection,
    achievements: filteredByConnection.filter(p => p.type === 'achievement'),
    milestones: filteredByConnection.filter(p => p.type === 'milestone'),
    announcements: filteredByConnection.filter(p => p.type === 'announcement'),
    my_posts: filteredByConnection.filter(p => p.authorId === currentUser?.id),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">News Feed</h1>
              <p className="text-sm text-gray-500">Updates from your connections</p>
            </div>
            <Button onClick={() => setShowNewPost(true)} className="bg-blue-600 hover:bg-blue-700">
              <PenSquare className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentUser?.profilePicture} />
                  <AvatarFallback className="bg-blue-100">
                    {getInitials(currentUser?.fullName || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <textarea
                    placeholder="What's on your mind? Share an update, achievement, or announcement..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px] text-sm resize-none focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Select value={newPostType} onValueChange={setNewPostType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">📝 General</SelectItem>
                    <SelectItem value="achievement">🏆 Achievement</SelectItem>
                    <SelectItem value="milestone">📈 Milestone</SelectItem>
                    <SelectItem value="announcement">📢 Announcement</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setShowNewPost(false); setNewPostContent(''); }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Publish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feed Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="my_posts">My Posts</TabsTrigger>
          </TabsList>

          {Object.entries(filteredPosts).map(([key, posts]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              {posts.map((post) => {
                const author = getAuthor(post.authorId);
                const PostIcon = getPostIcon(post.type);
                const postColor = getPostColor(post.type);
                const isLiked = post.likedBy?.includes(currentUser?.id || '') || false;
                const isCommentsExpanded = expandedComments.has(post.id);
                const isOwnPost = post.authorId === currentUser?.id;

                return (
                  <Card key={post.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Avatar
                          className="w-10 h-10 cursor-pointer"
                          onClick={() => navigate(`/profile/${post.authorId}`)}
                        >
                          <AvatarImage src={author?.profilePicture} />
                          <AvatarFallback className="bg-blue-100">
                            {getInitials(author?.fullName || 'U')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-semibold cursor-pointer hover:text-blue-600"
                              onClick={() => navigate(`/profile/${post.authorId}`)}
                            >
                              {author?.fullName}
                            </span>
                            <Badge className={`text-xs ${postColor}`}>
                              <PostIcon className="w-3 h-3 mr-1" />
                              {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(post.timestamp)}
                          </span>
                        </div>

                        {/* More menu (Block/Report) */}
                        {!isOwnPost && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1">
                              <button
                                onClick={() => handleBlock(post.authorId)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-left"
                              >
                                <Ban className="w-4 h-4" /> Block User
                              </button>
                              <button
                                onClick={() => { setReportUserId(post.authorId); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-left text-red-600"
                              >
                                <Flag className="w-4 h-4" /> Report
                              </button>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

                      {/* Engagement */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                              }`}
                          >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                            <span>{post.likes}</span>
                          </button>

                          <button
                            onClick={() => {
                              setExpandedComments((prev) => {
                                const next = new Set(prev);
                                if (next.has(post.id)) next.delete(post.id);
                                else next.add(post.id);
                                return next;
                              });
                            }}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span>{post.comments || 0}</span>
                          </button>

                          <button
                            onClick={() => setSharePostId(post.id)}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Share2 className="w-5 h-5" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {isCommentsExpanded && (
                        <div className="mt-4 space-y-3">
                          {/* Existing comments */}
                          {(post.commentsList || []).map((comment) => {
                            const commentAuthor = authorCache[comment.authorId];
                            // Lazy load comment author if not cached
                            if (!commentAuthor) {
                              api.getUserById(comment.authorId).then((u) => {
                                if (u) setAuthorCache((prev) => ({ ...prev, [comment.authorId]: u }));
                              });
                            }
                            return (
                              <div key={comment.id} className="flex gap-2 pl-2 border-l-2 border-gray-200">
                                <Avatar className="w-7 h-7 flex-shrink-0">
                                  <AvatarImage src={commentAuthor?.profilePicture} />
                                  <AvatarFallback className="text-xs bg-gray-100">
                                    {getInitials(commentAuthor?.fullName || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{commentAuthor?.fullName || 'User'}</span>
                                    <span className="text-xs text-gray-400">{formatDate(comment.timestamp)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                              </div>
                            );
                          })}

                          {/* Comment input */}
                          <div className="flex gap-2 mt-2">
                            <Avatar className="w-7 h-7 flex-shrink-0">
                              <AvatarImage src={currentUser?.profilePicture} />
                              <AvatarFallback className="text-xs bg-blue-100">
                                {getInitials(currentUser?.fullName || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Input
                                placeholder="Write a comment..."
                                value={commentInput[post.id] || ''}
                                onChange={(e) => setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleComment(post.id);
                                }}
                                className="h-8 text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleComment(post.id)}
                                disabled={!commentInput[post.id]?.trim()}
                                className="h-8"
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {posts.length === 0 && (
                <div className="text-center py-12">
                  <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
                  <p className="text-gray-500 mt-1">
                    {key === 'my_posts' ? 'Create your first post to share with your connections!' : 'Check back later for updates from your connections'}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Share Dialog */}
      <Dialog open={!!sharePostId} onOpenChange={() => setSharePostId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share to Direct Message</DialogTitle>
            <DialogDescription>
              Choose a conversation to share this post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dmChats.map((chat) => {
              const otherId = chat.participants.find((p) => p !== currentUser?.id);
              const otherUser = otherId ? dmUserCache[otherId] : null;
              return (
                <button
                  key={chat.id}
                  onClick={() => sharePostId && handleShareToDM(sharePostId, chat.id)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={otherUser?.profilePicture} />
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                      {getInitials(otherUser?.fullName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{otherUser?.fullName || 'User'}</span>
                </button>
              );
            })}
            {dmChats.length === 0 && (
              <p className="text-center py-4 text-gray-500 text-sm">No conversations to share to yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={!!reportUserId} onOpenChange={() => { setReportUserId(null); setReportReason(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Report User
            </DialogTitle>
            <DialogDescription>
              Please describe why you are reporting this user
            </DialogDescription>
          </DialogHeader>
          <textarea
            placeholder="Describe the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full border rounded-lg p-3 min-h-[80px] text-sm resize-none focus:ring-2 focus:ring-red-200 focus:outline-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReportUserId(null); setReportReason(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Flag className="w-4 h-4 mr-1" />
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
