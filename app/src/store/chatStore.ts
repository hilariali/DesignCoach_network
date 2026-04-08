import { create } from 'zustand';
import type { Chat, Message, Attachment } from '@/types';
import * as api from '@/lib/api';
import { getCoachResponse, type GrokMessage } from '@/lib/grokApi';

interface ChatState {
  activeChat: Chat | null;
  isTyping: boolean;
  getChats: () => Promise<Chat[]>;
  getMessages: (chatId: string) => Promise<Message[]>;
  setActiveChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, senderId: string, attachments?: Attachment[]) => Promise<void>;
  sendBotMessage: (chatId: string, content: string) => Promise<void>;
  addReaction: (messageId: string, userId: string, emoji: string) => Promise<void>;
  searchMessages: (chatId: string, query: string) => Promise<Message[]>;
  markAsRead: (chatId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeChat: null,
  isTyping: false,

  getChats: async () => {
    return api.getAllChats();
  },

  getMessages: async (chatId: string) => {
    return api.getMessagesByChatId(chatId);
  },

  setActiveChat: async (chatId: string) => {
    const chat = await api.getChatById(chatId);
    if (chat) {
      set({ activeChat: chat });
      await get().markAsRead(chatId);
    }
  },

  sendMessage: async (chatId: string, content: string, senderId: string, attachments?: Attachment[]) => {
    const newMessage: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      chatId,
      senderId,
      senderType: 'user',
      content,
      type: attachments && attachments.length > 0 ? 'file' : 'text',
      timestamp: new Date().toISOString(),
      attachments,
    };

    await api.saveMessage(newMessage);

    // Update chat's lastMessage and updatedAt
    const chat = await api.getChatById(chatId);
    if (chat) {
      await api.saveChat({ ...chat, lastMessage: newMessage, updatedAt: new Date().toISOString() });
    }

    // Force a re-render by toggling a state reference
    set({ activeChat: chat ? { ...chat, updatedAt: new Date().toISOString() } : null });

    // If this is a bot chat, call the Grok API for a real AI response
    if (chat?.type === 'bot') {
      set({ isTyping: true });

      // Build conversation history from stored messages for context
      const existingMessages = await api.getMessagesByChatId(chatId);
      const conversationHistory: GrokMessage[] = existingMessages
        .filter((m) => m.senderType === 'user' || m.senderType === 'bot')
        .map((m) => ({
          role: (m.senderType === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content,
        }));

      // Remove the last entry since it's the message we just sent (we pass it separately)
      conversationHistory.pop();

      getCoachResponse(conversationHistory, content)
        .then((responseContent) => {
          get().sendBotMessage(chatId, responseContent);
        })
        .catch((error) => {
          console.error('Grok API error:', error);
          get().sendBotMessage(
            chatId,
            `I'm sorry, I'm having trouble connecting right now. ${error.message || 'Please try again in a moment.'}`
          );
        })
        .finally(() => {
          set({ isTyping: false });
        });
    }
  },

  sendBotMessage: async (chatId: string, content: string) => {
    const botMessage: Message = {
      id: 'msg_bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      chatId,
      senderId: 'bot',
      senderType: 'bot',
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    await api.saveMessage(botMessage);

    const chat = await api.getChatById(chatId);
    if (chat) {
      await api.saveChat({ ...chat, lastMessage: botMessage, updatedAt: new Date().toISOString() });
      set({ activeChat: { ...chat, updatedAt: new Date().toISOString() } });
    }
  },

  addReaction: async (messageId: string, userId: string, emoji: string) => {
    const allMessages = await api.getAllMessages();
    const updated = allMessages.map((msg) =>
      msg.id === messageId
        ? {
          ...msg,
          reactions: [...(msg.reactions || []), { userId, emoji }],
        }
        : msg
    );
    await api.saveAllMessages(updated);
    // Trigger re-render
    set((state) => ({ activeChat: state.activeChat ? { ...state.activeChat } : null }));
  },

  searchMessages: async (chatId: string, query: string) => {
    const messages = await api.getMessagesByChatId(chatId);
    return messages.filter(
      (msg) => msg.content.toLowerCase().includes(query.toLowerCase())
    );
  },

  markAsRead: async (chatId: string) => {
    const chat = await api.getChatById(chatId);
    if (chat) {
      await api.saveChat({ ...chat, unreadCount: 0 });
    }
  },
}));
