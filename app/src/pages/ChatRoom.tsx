import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useTeamStore } from '@/store/teamStore';
import * as api from '@/lib/api';
import { getInitials, formatMessageDate, formatTime, formatFileSize, groupMessagesByDate } from '@/lib/utils';
import {
  ArrowLeft, Send, Search, Phone, Video, Paperclip,
  Info, Smile, FileText, Image as ImageIcon,
  Download, Users, CheckCircle, XCircle, Clock,
  ChevronUp, ChevronDown, X
} from 'lucide-react';


const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export default function ChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { activeChat, setActiveChat, sendMessage, addReaction, isTyping, getMessages } = useChatStore();
  const { getTeamById } = useTeamStore();

  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [respondedInvitations, setRespondedInvitations] = useState<Record<string, string>>({});
  const [showSearch, setShowSearch] = useState(false);
  const [chat, setChat] = useState<import('@/types').Chat | null>(null);
  const [team, setTeam] = useState<import('@/types').Team | null>(null);
  const [chatMessages, setChatMessages] = useState<import('@/types').Message[]>([]);
  const [userCache, setUserCache] = useState<Record<string, string>>({});
  const [userPicCache, setUserPicCache] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dmUser, setDmUser] = useState<import('@/types').UserProfile | null>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<string[]>([]); // array of message IDs
  const [searchIndex, setSearchIndex] = useState(0);

  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
      // Load chat data
      api.getChatById(chatId).then((c) => {
        setChat(c || null);
        if (c?.teamId) {
          getTeamById(c.teamId).then((t) => setTeam(t || null));
        }
        // For DM chats, load the other participant's profile
        if (c?.type === 'dm' && currentUser) {
          const otherUserId = c.participants.find((p) => p !== currentUser.id);
          if (otherUserId) {
            api.getUserById(otherUserId).then((u) => setDmUser(u || null));
          }
        }
      });
    }
  }, [chatId]);

  // Load messages (re-fetch when activeChat changes)
  useEffect(() => {
    if (chatId) {
      getMessages(chatId).then((msgs) => setChatMessages(msgs));
    }
  }, [chatId, activeChat]);

  const groupedMessages = groupMessagesByDate(chatMessages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, activeChat, isTyping]);

  const handleSend = () => {
    if (inputMessage.trim() && chatId && currentUser) {
      sendMessage(chatId, inputMessage.trim(), currentUser.id);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && chatId && currentUser) {
      sendMessage(chatId, `Shared a file: ${file.name}`, currentUser.id, [{
        id: 'att_' + Date.now(),
        name: file.name,
        url: '#',
        type: file.type,
        size: file.size
      }]);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (currentUser) {
      addReaction(messageId, currentUser.id, emoji);
    }
  };

  // Pre-load sender names AND profile pictures
  useEffect(() => {
    const senderIds = new Set(chatMessages.map((m) => m.senderId));
    senderIds.forEach((id) => {
      if (id !== currentUser?.id && id !== 'bot' && id !== 'system' && !userCache[id]) {
        api.getUserById(id).then((u) => {
          if (u) {
            setUserCache((prev) => ({ ...prev, [id]: u.fullName }));
            if (u.profilePicture) {
              setUserPicCache((prev) => ({ ...prev, [id]: u.profilePicture! }));
            }
          }
        });
      }
    });
  }, [chatMessages, currentUser?.id]);

  // Get sender display name
  const getSenderName = (senderId: string): string => {
    if (senderId === currentUser?.id) return 'You';
    if (senderId === 'bot') return 'AI Coach';
    if (senderId === 'system') return 'System';
    return userCache[senderId] || 'Team Member';
  };

  // Get sender profile picture
  const getSenderPic = (senderId: string): string | undefined => {
    if (senderId === currentUser?.id) return currentUser?.profilePicture;
    return userPicCache[senderId];
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = chatMessages
        .filter((m) => m.content.toLowerCase().includes(q) && m.type !== 'system')
        .map((m) => m.id);
      setSearchResults(matches);
      setSearchIndex(matches.length > 0 ? matches.length - 1 : 0);
      // Scroll to first match
      if (matches.length > 0) {
        const el = document.getElementById(`msg-${matches[matches.length - 1]}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setSearchResults([]);
      setSearchIndex(0);
    }
  }, [searchQuery, chatMessages]);

  const navigateSearch = (direction: 'up' | 'down') => {
    if (searchResults.length === 0) return;
    let newIdx = direction === 'up' ? searchIndex - 1 : searchIndex + 1;
    if (newIdx < 0) newIdx = searchResults.length - 1;
    if (newIdx >= searchResults.length) newIdx = 0;
    setSearchIndex(newIdx);
    const el = document.getElementById(`msg-${searchResults[newIdx]}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">Chat not found</h2>
          <Button onClick={() => navigate('/teams')} className="mt-4">
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {team ? (
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold">{team.name}</h2>
                  <p className="text-xs text-gray-500">
                    {team.members.length} members
                  </p>
                </div>
              </div>
            ) : dmUser ? (
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/profile/${dmUser.id}`)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={dmUser.profilePicture} />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {getInitials(dmUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{dmUser.fullName}</h2>
                  <p className="text-xs text-gray-500">Direct Message</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold">{chat.name}</h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]); }}>
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-5 h-5" />
            </Button>
            {team && (
              <Button variant="ghost" size="icon" onClick={() => navigate(`/teams/${team.id}`)}>
                <Info className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {showSearch && (
          <div className="max-w-5xl mx-auto mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-8"
              autoFocus
            />
            {searchResults.length > 0 && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {searchIndex + 1} / {searchResults.length}
              </span>
            )}
            {searchResults.length > 0 && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateSearch('up')}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateSearch('down')}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {Array.from(groupedMessages.entries()).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center justify-center mb-4">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {formatMessageDate(msgs[0].timestamp)}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {msgs.map((message) => {
                  const isOwn = message.senderId === currentUser?.id;
                  const isHighlighted = searchResults.includes(message.id);
                  const isCurrentMatch = searchResults[searchIndex] === message.id;
                  return (
                    <div
                      key={message.id}
                      id={`msg-${message.id}`}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'relative' : ''
                        }`}
                    >
                      {/* Search highlight ring */}
                      {isHighlighted && (
                        <div className={`absolute inset-0 rounded-2xl pointer-events-none ${isCurrentMatch ? 'ring-2 ring-blue-400 bg-blue-50/30' : 'ring-1 ring-yellow-300 bg-yellow-50/20'
                          }`} />
                      )}
                      <div className={`flex gap-3 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={getSenderPic(message.senderId)} />
                            <AvatarFallback className="text-xs bg-blue-100">
                              {getInitials(getSenderName(message.senderId))}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && (
                            <span className="text-xs text-gray-500 ml-1">
                              {getSenderName(message.senderId)}
                            </span>
                          )}

                          <div className={`relative group ${isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border'
                            } rounded-2xl px-4 py-2`}>
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mb-2">
                                {message.attachments.map((att) => (
                                  <div
                                    key={att.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-blue-700' : 'bg-gray-100'
                                      }`}
                                  >
                                    {att.type.startsWith('image/') ? (
                                      <ImageIcon className="w-5 h-5" />
                                    ) : (
                                      <FileText className="w-5 h-5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm truncate">{att.name}</p>
                                      <p className="text-xs opacity-70">{formatFileSize(att.size)}</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-6 w-6">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Invitation Card */}
                            {message.type === 'invitation' ? (() => {
                              try {
                                const invData = JSON.parse(message.content);
                                const isExpired = new Date(invData.expiresAt) < new Date();
                                const responded = respondedInvitations[invData.invitationId];
                                return (
                                  <div className={`p-3 rounded-xl border-2 ${isExpired ? 'border-gray-200 bg-gray-50 opacity-60' :
                                    responded === 'accepted' ? 'border-green-300 bg-green-50' :
                                      responded === 'declined' ? 'border-red-200 bg-red-50' :
                                        isOwn ? 'border-blue-400 bg-blue-700/30' : 'border-blue-300 bg-blue-50'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Users className={`w-4 h-4 ${isOwn ? 'text-blue-200' : 'text-blue-600'}`} />
                                      <span className={`text-sm font-semibold ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                                        Team Invitation
                                      </span>
                                    </div>
                                    <p className={`text-sm ${isOwn ? 'text-blue-100' : 'text-gray-700'}`}>
                                      Join <strong>{invData.teamName}</strong> as <Badge variant="outline" className="text-xs">{invData.role}</Badge>
                                    </p>
                                    {isExpired && (
                                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" /> Expired
                                      </p>
                                    )}
                                    {responded && (
                                      <p className={`text-xs mt-1 font-medium ${responded === 'accepted' ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                        {responded === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                                      </p>
                                    )}
                                    {!isOwn && !isExpired && !responded && (
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await api.acceptInvitation(invData.invitationId);
                                            setRespondedInvitations(prev => ({ ...prev, [invData.invitationId]: 'accepted' }));
                                          }}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" /> Accept
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await api.declineInvitation(invData.invitationId);
                                            setRespondedInvitations(prev => ({ ...prev, [invData.invitationId]: 'declined' }));
                                          }}
                                        >
                                          <XCircle className="w-3 h-3 mr-1" /> Decline
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              } catch {
                                return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
                              }
                            })() : (
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            )}

                            {/* Timestamp */}
                            <span className={`text-xs mt-1 block ${isOwn ? 'text-blue-200' : 'text-gray-400'
                              }`}>
                              {formatTime(message.timestamp)}
                            </span>

                            {/* Reaction Button */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`absolute -top-2 ${isOwn ? '-left-8' : '-right-8'
                                    } opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6`}
                                >
                                  <Smile className="w-4 h-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2">
                                <div className="flex gap-1">
                                  {emojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(message.id, emoji)}
                                      className="text-xl hover:bg-gray-100 p-1 rounded"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {message.reactions.map((reaction, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 px-2 py-0.5 rounded-full"
                                >
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/bot-avatar.png" />
                  <AvatarFallback className="text-xs bg-purple-100">AI</AvatarFallback>
                </Avatar>
                <div className="bg-white border rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="ghost" size="icon" onClick={handleFileUpload}>
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
