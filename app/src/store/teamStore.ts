import { create } from 'zustand';
import type { Team, BusinessModelCanvas } from '@/types';
import * as api from '@/lib/api';

interface TeamState {
  isLoading: boolean;
  getTeams: () => Promise<Team[]>;
  getTeamById: (teamId: string) => Promise<Team | undefined>;
  createTeam: (teamData: Partial<Team>) => Promise<Team | null>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  addMember: (teamId: string, userId: string, role: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  addMilestone: (teamId: string, milestone: { title: string; description: string; date: string }) => Promise<void>;
  completeMilestone: (teamId: string, milestoneId: string) => Promise<void>;
  addAchievement: (teamId: string, achievement: { title: string; description: string }) => Promise<void>;
  updateBusinessModel: (teamId: string, canvas: Partial<BusinessModelCanvas>) => Promise<void>;
  getUserTeams: (userId: string) => Promise<Team[]>;
}

export const useTeamStore = create<TeamState>((set) => ({
  isLoading: false,

  getTeams: async () => {
    return api.getAllTeams();
  },

  getTeamById: async (teamId: string) => {
    const team = await api.getTeamById(teamId);
    if (team) {
      // Enrich members with user data
      const enrichedMembers = await Promise.all(
        team.members.map(async (member) => ({
          ...member,
          user: await api.getUserById(member.userId),
        }))
      );
      return {
        ...team,
        members: enrichedMembers,
      };
    }
    return undefined;
  },

  createTeam: async (teamData) => {
    set({ isLoading: true });

    const teamId = 'team_' + Date.now();
    const chatId = 'chat_' + Date.now();
    const chatbotChatId = 'chatbot_' + Date.now();

    // Determine founder (first member)
    const founderId = teamData.members?.[0]?.userId || '';

    const newTeam: Team = {
      id: teamId,
      name: teamData.name || 'New Team',
      description: teamData.description || '',
      members: (teamData.members || []).map((m, idx) => ({
        ...m,
        isManagement: idx === 0, // founder is management by default
      })),
      founderId,
      combinedExpertise: teamData.combinedExpertise || [],
      combinedResources: teamData.combinedResources || [],
      achievements: [],
      milestones: [],
      chatId,
      chatbotChatId,
      chatbotRooms: [{
        id: 'room_' + Date.now(),
        chatId: chatbotChatId,
        name: 'General',
        createdAt: new Date().toISOString(),
        createdBy: founderId,
      }],
      createdAt: new Date().toISOString(),
    };

    // Auto-populate combined expertise/resources from founding members
    const memberUserIds = newTeam.members.map((m) => m.userId);
    for (const uid of memberUserIds) {
      const user = await api.getUserById(uid);
      if (user) {
        user.expertiseDomains.forEach((e) => {
          if (!newTeam.combinedExpertise.includes(e)) {
            newTeam.combinedExpertise.push(e);
          }
        });
        user.resourcesAssets.forEach((r) => {
          if (!newTeam.combinedResources.includes(r)) {
            newTeam.combinedResources.push(r);
          }
        });
      }
    }

    await api.saveTeam(newTeam);

    // Create team chat
    await api.saveChat({
      id: chatId,
      name: newTeam.name,
      type: 'team',
      participants: memberUserIds,
      teamId,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    });

    // Create chatbot chat
    await api.saveChat({
      id: chatbotChatId,
      name: `${newTeam.name} AI Coach`,
      type: 'bot',
      participants: [...memberUserIds, 'bot'],
      teamId,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    });

    // Add welcome bot message
    await api.saveMessage({
      id: 'msg_bot_' + Date.now(),
      chatId: chatbotChatId,
      senderId: 'bot',
      senderType: 'bot',
      content: `Hello ${newTeam.name} team! I'm your AI business coach. I can help you refine your business model, generate a lean canvas, or provide strategic recommendations. What would you like to work on today?`,
      type: 'text',
      timestamp: new Date().toISOString(),
    });

    // Update member team counts
    for (const uid of memberUserIds) {
      const user = await api.getUserById(uid);
      if (user) {
        await api.saveUser({ ...user, teamsJoined: (user.teamsJoined || 0) + 1 });
      }
    }

    set({ isLoading: false });
    return newTeam;
  },

  updateTeam: async (teamId: string, teamData: Partial<Team>) => {
    const team = await api.getTeamById(teamId);
    if (team) {
      await api.saveTeam({ ...team, ...teamData });
    }
  },

  addMember: async (teamId: string, userId: string, role: string) => {
    const team = await api.getTeamById(teamId);
    if (!team) return;

    // Avoid duplicates
    if (team.members.some((m) => m.userId === userId)) return;

    const user = await api.getUserById(userId);
    const updatedTeam = {
      ...team,
      members: [...team.members, { userId, role, isManagement: false, joinedAt: new Date().toISOString() }],
      combinedExpertise: user
        ? [...new Set([...team.combinedExpertise, ...user.expertiseDomains])]
        : team.combinedExpertise,
      combinedResources: user
        ? [...new Set([...team.combinedResources, ...user.resourcesAssets])]
        : team.combinedResources,
    };
    await api.saveTeam(updatedTeam);

    // Update team chat participants
    const chat = await api.getChatById(team.chatId);
    if (chat && !chat.participants.includes(userId)) {
      await api.saveChat({ ...chat, participants: [...chat.participants, userId] });
    }

    // Update user's team count
    if (user) {
      await api.saveUser({ ...user, teamsJoined: (user.teamsJoined || 0) + 1 });
    }
  },

  removeMember: async (teamId: string, userId: string) => {
    const team = await api.getTeamById(teamId);
    if (!team) return;

    await api.saveTeam({
      ...team,
      members: team.members.filter((m) => m.userId !== userId),
    });
  },

  addMilestone: async (teamId: string, milestone) => {
    const team = await api.getTeamById(teamId);
    if (!team) return;

    await api.saveTeam({
      ...team,
      milestones: [
        ...team.milestones,
        {
          id: 'milestone_' + Date.now(),
          ...milestone,
          completed: false,
        },
      ],
    });
  },

  completeMilestone: async (teamId: string, milestoneId: string) => {
    const team = await api.getTeamById(teamId);
    if (!team) return;

    await api.saveTeam({
      ...team,
      milestones: team.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: true } : m
      ),
    });
  },

  addAchievement: async (teamId: string, achievement: { title: string; description: string }) => {
    const team = await api.getTeamById(teamId);
    if (!team) return;

    await api.saveTeam({
      ...team,
      achievements: [
        ...team.achievements,
        {
          id: 'achievement_' + Date.now(),
          title: achievement.title,
          description: achievement.description,
          date: new Date().toISOString(),
        },
      ],
    });
  },

  updateBusinessModel: async (teamId: string, canvas: Partial<BusinessModelCanvas>) => {
    const team = await api.getTeamById(teamId);
    if (!team) return;

    await api.saveTeam({
      ...team,
      businessModel: { ...team.businessModel, ...canvas } as BusinessModelCanvas,
    });
  },

  getUserTeams: async (userId: string) => {
    const teams = await api.getAllTeams();
    return teams.filter((team) =>
      team.members.some((member) => member.userId === userId)
    );
  },
}));
