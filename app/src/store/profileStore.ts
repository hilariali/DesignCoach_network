import { create } from 'zustand';
import type { UserProfile, SearchFilters } from '@/types';
import * as api from '@/lib/api';

interface ProfileState {
  searchResults: UserProfile[];
  isLoading: boolean;
  searchUsers: (filters: SearchFilters) => Promise<void>;
  saveProfile: (currentUserId: string, targetUserId: string) => Promise<void>;
  unsaveProfile: (currentUserId: string, targetUserId: string) => Promise<void>;
  isProfileSaved: (currentUserId: string, targetUserId: string) => Promise<boolean>;
  getUserById: (userId: string) => Promise<UserProfile | undefined>;
  sendChatRequest: (userId: string) => Promise<boolean>;
  reportUser: (userId: string, reason: string) => Promise<boolean>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  searchResults: [],
  isLoading: false,

  searchUsers: async (filters: SearchFilters) => {
    set({ isLoading: true });

    let results = await api.getAllUsers();

    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      results = results.filter((user) =>
        user.fullName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.expertise && filters.expertise.length > 0) {
      results = results.filter((user) =>
        filters.expertise!.some((exp) => user.expertiseDomains.includes(exp))
      );
    }

    if (filters.targetCustomers && filters.targetCustomers.length > 0) {
      results = results.filter((user) =>
        filters.targetCustomers!.some((tc) => user.targetCustomers.includes(tc))
      );
    }

    if (filters.expectation && filters.expectation.length > 0) {
      results = results.filter((user) => {
        const userExp = (user as any).expectation || 'team_up';
        return filters.expectation!.includes(userExp);
      });
    }

    set({ searchResults: results, isLoading: false });
  },

  saveProfile: async (currentUserId: string, targetUserId: string) => {
    const saved = await api.getSavedProfiles(currentUserId);
    if (!saved.includes(targetUserId)) {
      await api.setSavedProfiles(currentUserId, [...saved, targetUserId]);
    }
  },

  unsaveProfile: async (currentUserId: string, targetUserId: string) => {
    const saved = await api.getSavedProfiles(currentUserId);
    await api.setSavedProfiles(currentUserId, saved.filter((id) => id !== targetUserId));
  },

  isProfileSaved: async (currentUserId: string, targetUserId: string) => {
    const saved = await api.getSavedProfiles(currentUserId);
    return saved.includes(targetUserId);
  },

  getUserById: async (userId: string) => {
    return api.getUserById(userId);
  },

  sendChatRequest: async (userId: string) => {
    // Get the current user from authStore
    const { useAuthStore } = await import('@/store/authStore');
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return false;

    try {
      // Create or find existing DM chat between the two users
      await api.createOrGetDMChat(currentUser.id, userId);
      return true;
    } catch (err) {
      console.error('Failed to create DM chat:', err);
      return false;
    }
  },

  reportUser: async (userId: string, reason: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`User ${userId} reported for: ${reason}`);
    return true;
  },
}));
