import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import * as api from '@/lib/api';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSSO: (provider: 'google' | 'linkedin' | 'github') => Promise<boolean>;
  register: (userData: Partial<UserProfile> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string) => {
        // Validate against stored accounts
        const user = await api.getUserByEmail(email);
        if (!user) return false;

        const validPassword = await api.validatePassword(email, password);
        if (!validPassword) return false;

        set({ user, isAuthenticated: true, token: 'token_' + Date.now() });
        return true;
      },

      loginWithSSO: async (_provider: 'google' | 'linkedin' | 'github') => {
        // For demo: SSO logs the user in as the first mock user
        const users = await api.getAllUsers();
        if (users.length === 0) return false;
        const user = users[0];
        set({ user, isAuthenticated: true, token: 'sso_token_' + Date.now() });
        return true;
      },

      register: async (userData) => {
        // Check if email already exists
        const existing = await api.getUserByEmail(userData.email || '');
        if (existing) {
          return { success: false, error: 'An account with this email already exists.' };
        }

        const newUser: UserProfile = {
          id: 'user_' + Date.now(),
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone,
          profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.fullName || 'user')}`,
          bio: userData.bio || '',
          expectation: userData.expectation || 'team_up',
          trackRecords: [],
          expertiseDomains: userData.expertiseDomains || [],
          targetCustomers: userData.targetCustomers || [],
          resourcesAssets: userData.resourcesAssets || [],
          userType: 'regular',
          rating: { overall: 0, membershipScore: 0, teamScore: 0, projectScore: 0, trainingScore: 0 },
          profileCompleteness: 30,
          membershipDate: new Date().toISOString(),
          teamsJoined: 0,
          successfulProjects: 0,
          offlineTrainings: 0,
        };

        // Save user & password to backend
        await api.saveUser(newUser);
        await api.setPassword(newUser.email, userData.password);

        // Calculate initial profile completeness
        newUser.profileCompleteness = calculateProfileCompleteness(newUser);
        await api.saveUser(newUser);

        set({ user: newUser, isAuthenticated: true, token: 'token_' + Date.now() });
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, token: null });
      },

      updateUser: async (userData) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...userData };
        updatedUser.profileCompleteness = calculateProfileCompleteness(updatedUser);

        // Persist to backend
        await api.saveUser(updatedUser);

        set({ user: updatedUser });
      },

      /** Re-read the user from backend (useful after external changes) */
      refreshUser: async () => {
        const currentUser = get().user;
        if (!currentUser) return;
        const freshUser = await api.getUserById(currentUser.id);
        if (freshUser) {
          set({ user: freshUser });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

function calculateProfileCompleteness(user: UserProfile): number {
  let score = 0;
  if (user.profilePicture) score += 15;
  if (user.bio && user.bio.length > 50) score += 15;
  if (user.expertiseDomains.length > 0) score += 15;
  if (user.targetCustomers.length > 0) score += 15;
  if (user.resourcesAssets.length > 0) score += 15;
  if (user.trackRecords.length > 0) score += 15;
  if (user.phone) score += 10;
  return Math.min(100, score);
}
