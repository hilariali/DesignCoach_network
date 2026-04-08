import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/store/chatStore';
import { useTeamStore } from '@/store/teamStore';
import { useAuthStore } from '@/store/authStore';
import { formatMessageDate, formatTime, groupMessagesByDate } from '@/lib/utils';
import { generateBusinessCanvas } from '@/lib/grokApi';
import * as api from '@/lib/api';
import {
  ArrowLeft, Send, Sparkles, Lightbulb, Users,
  TrendingUp, Target, FileText, Bot, Zap, Loader2
} from 'lucide-react';

const quickActions = [
  { icon: Lightbulb, label: 'Generate Business Canvas', prompt: 'Can you help me create a Lean Business Model Canvas?' },
  { icon: Users, label: 'Find Team Members', prompt: 'What type of team members should I look for?' },
  { icon: TrendingUp, label: 'Growth Strategy', prompt: 'Help me develop a go-to-market strategy' },
  { icon: Target, label: 'Competitive Analysis', prompt: 'Can you analyze my competition?' },
  { icon: FileText, label: 'Pitch Preparation', prompt: 'Help me prepare my investor pitch' },
  { icon: Zap, label: 'Quick Recommendations', prompt: 'Give me some quick business recommendations' }
];

export default function ChatbotRoom() {
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { activeChat, setActiveChat, sendMessage, isTyping, getMessages } = useChatStore();
  const { getTeamById } = useTeamStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);
  const [chat, setChat] = useState<import('@/types').Chat | null>(null);
  const [team, setTeam] = useState<import('@/types').Team | null>(null);
  const [chatMessages, setChatMessages] = useState<import('@/types').Message[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatbotId) {
      setActiveChat(chatbotId);
      // Load chat and find team
      api.getChatById(chatbotId).then((c) => {
        setChat(c || null);
        if (c?.teamId) {
          getTeamById(c.teamId).then((t) => setTeam(t || null));
        } else {
          // Fallback: search all teams for matching chatbotChatId
          api.getAllTeams().then((teams) => {
            const found = teams.find((t) => t.chatbotChatId === chatbotId);
            if (found) setTeam(found);
          });
        }
      });
    }
  }, [chatbotId]);

  // Load messages (re-fetch when activeChat changes)
  useEffect(() => {
    if (chatbotId) {
      getMessages(chatbotId).then((msgs) => setChatMessages(msgs));
    }
  }, [chatbotId, activeChat]);

  const groupedMessages = groupMessagesByDate(chatMessages);

  // Resolve sender names for user messages
  useEffect(() => {
    const unknownSenders = chatMessages
      .filter(m => m.senderType === 'user' && m.senderId !== 'bot' && !senderNames[m.senderId])
      .map(m => m.senderId);
    const uniqueSenders = [...new Set(unknownSenders)];
    uniqueSenders.forEach(senderId => {
      api.getUserById(senderId).then(u => {
        if (u) setSenderNames(prev => ({ ...prev, [senderId]: u.fullName }));
      });
    });
  }, [chatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, activeChat, isTyping]);

  const handleSend = () => {
    if (inputMessage.trim() && chatbotId && currentUser) {
      sendMessage(chatbotId, inputMessage.trim(), currentUser.id);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (chatbotId && currentUser) {
      sendMessage(chatbotId, prompt, currentUser.id);
    }
  };

  const handleGenerateCanvas = async () => {
    if (!team || !currentUser) {
      toast({
        title: 'No team found',
        description: 'This chatbot is not linked to a team.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingCanvas(true);
    toast({
      title: '✨ Generating Business Canvas...',
      description: 'Analyzing team chat and AI coach conversations. This may take 15-30 seconds.',
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

      toast({
        title: '🎉 Canvas Generated!',
        description: `Version ${version} is ready. Opening preview...`,
      });

      // Navigate to the canvas preview
      navigate(`/canvas/${newCanvas.id}`);
    } catch (error) {
      console.error('Canvas generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCanvas(false);
    }
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{chat.name}</h2>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    Grok AI
                  </Badge>
                </div>
                {team && (
                  <p
                    className="text-xs text-gray-500 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    For {team.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Generate Canvas Button */}
            <Button
              size="sm"
              onClick={handleGenerateCanvas}
              disabled={isGeneratingCanvas}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            >
              {isGeneratingCanvas ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-1.5" />
                  Generate Canvas
                </>
              )}
            </Button>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden md:block">
              Turn-based conversation
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome Message */}
          {chatMessages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to your AI Business Coach!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                I'm here to help you build a successful startup. I can assist with business model generation,
                team recommendations, competitive analysis, and more.
              </p>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex flex-col items-center gap-2 p-4 bg-white border rounded-xl hover:shadow-md hover:border-purple-300 transition-all text-left"
                  >
                    <action.icon className="w-6 h-6 text-purple-600" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                {msgs.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.senderType === 'user' ? 'flex-row-reverse' : ''
                      }`}>
                      {message.senderType === 'bot' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`space-y-1 ${message.senderType === 'user' ? 'items-end' : 'items-start'
                        }`}>
                        {message.senderType === 'bot' ? (
                          <span className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Business Coach
                          </span>
                        ) : (
                          <span className="text-xs text-blue-400 mr-1 text-right">
                            {senderNames[message.senderId] || 'You'}
                          </span>
                        )}

                        <div className={`relative ${message.senderType === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-purple-200'
                          } rounded-2xl px-4 py-3`}>
                          {/* Message Content */}
                          <div
                            className={`text-sm whitespace-pre-wrap prose prose-sm max-w-none ${message.senderType === 'user' ? 'prose-invert' : ''
                              }`}
                            dangerouslySetInnerHTML={{
                              __html: message.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>')
                                .replace(/\|(.*?)\|/g, (match) => {
                                  if (match.includes('---')) return '';
                                  return match.replace(/\|/g, ' ');
                                })
                            }}
                          />

                          {/* Timestamp */}
                          <span className={`text-xs mt-2 block ${message.senderType === 'user' ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-purple-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Generation Indicator */}
          {isGeneratingCanvas && (
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl px-6 py-4 text-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-700">Generating Business Model Canvas...</p>
                <p className="text-xs text-purple-500 mt-1">Analyzing all conversations...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions Bar (when chat has started) */}
      {chatMessages.length > 0 && (
        <div className="bg-white border-t px-4 py-2">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-2">
            {/* Generate Canvas Quick Action */}
            <button
              onClick={handleGenerateCanvas}
              disabled={isGeneratingCanvas}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 rounded-full text-sm whitespace-nowrap transition-colors border border-purple-200 font-medium text-purple-700"
            >
              {isGeneratingCanvas ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Generate Business Canvas
            </button>
            {quickActions.slice(1, 4).map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.prompt)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm whitespace-nowrap transition-colors"
              >
                <action.icon className="w-4 h-4 text-purple-600" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask your AI coach anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isTyping}
              size="icon"
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Powered by Grok AI ✨
          </p>
        </div>
      </div>
    </div>
  );
}
