/**
 * Centralized localStorage persistence layer.
 * Seeds initial data from mockData on first launch, then all reads/writes go through here.
 */
import type { UserProfile, Team, Chat, Message, NewsPost, BusinessCanvasVersion } from '@/types';
import { mockUsers, mockTeams, mockChats, mockMessages, mockNewsFeed } from '@/data/mockData';

const STORAGE_KEYS = {
    USERS: 'bm_users',
    TEAMS: 'bm_teams',
    CHATS: 'bm_chats',
    MESSAGES: 'bm_messages',
    NEWS: 'bm_news',
    SEEDED: 'bm_seeded',
    SAVED_PROFILES: 'bm_saved_profiles',
    PASSWORDS: 'bm_passwords', // email -> hashed password mapping
    BUSINESS_CANVASES: 'bm_business_canvases',
} as const;

// ============ Helpers ============

function getItem<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

// ============ Seed ============

/** Seed default data on first launch */
export function seedIfNeeded(): void {
    if (localStorage.getItem(STORAGE_KEYS.SEEDED)) return;

    setItem(STORAGE_KEYS.USERS, mockUsers);
    setItem(STORAGE_KEYS.TEAMS, mockTeams);
    setItem(STORAGE_KEYS.CHATS, mockChats);
    setItem(STORAGE_KEYS.MESSAGES, mockMessages);
    setItem(STORAGE_KEYS.NEWS, mockNewsFeed);
    setItem(STORAGE_KEYS.SAVED_PROFILES, {} as Record<string, string[]>);

    // Set demo passwords for mock users
    const passwords: Record<string, string> = {};
    mockUsers.forEach((u) => {
        passwords[u.email] = 'password123'; // simple demo password
    });
    setItem(STORAGE_KEYS.PASSWORDS, passwords);

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
}

// ============ Users ============

export function getAllUsers(): UserProfile[] {
    return getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
}

export function getUserById(id: string): UserProfile | undefined {
    return getAllUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): UserProfile | undefined {
    return getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function saveUser(user: UserProfile): void {
    const users = getAllUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
        users[idx] = user;
    } else {
        users.push(user);
    }
    setItem(STORAGE_KEYS.USERS, users);
}

export function validatePassword(email: string, password: string): boolean {
    const passwords = getItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    return passwords[email.toLowerCase()] === password;
}

export function setPassword(email: string, password: string): void {
    const passwords = getItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    passwords[email.toLowerCase()] = password;
    setItem(STORAGE_KEYS.PASSWORDS, passwords);
}

// ============ Teams ============

export function getAllTeams(): Team[] {
    return getItem<Team[]>(STORAGE_KEYS.TEAMS, []);
}

export function getTeamById(id: string): Team | undefined {
    return getAllTeams().find((t) => t.id === id);
}

export function saveTeam(team: Team): void {
    const teams = getAllTeams();
    const idx = teams.findIndex((t) => t.id === team.id);
    if (idx >= 0) {
        teams[idx] = team;
    } else {
        teams.push(team);
    }
    setItem(STORAGE_KEYS.TEAMS, teams);
}

export function deleteTeam(id: string): void {
    const teams = getAllTeams().filter((t) => t.id !== id);
    setItem(STORAGE_KEYS.TEAMS, teams);
}

// ============ Chats ============

export function getAllChats(): Chat[] {
    return getItem<Chat[]>(STORAGE_KEYS.CHATS, []);
}

export function getChatById(id: string): Chat | undefined {
    return getAllChats().find((c) => c.id === id);
}

export function saveChat(chat: Chat): void {
    const chats = getAllChats();
    const idx = chats.findIndex((c) => c.id === chat.id);
    if (idx >= 0) {
        chats[idx] = chat;
    } else {
        chats.push(chat);
    }
    setItem(STORAGE_KEYS.CHATS, chats);
}

// ============ Messages ============

export function getAllMessages(): Message[] {
    return getItem<Message[]>(STORAGE_KEYS.MESSAGES, []);
}

export function getMessagesByChatId(chatId: string): Message[] {
    return getAllMessages().filter((m) => m.chatId === chatId);
}

export function saveMessage(message: Message): void {
    const messages = getAllMessages();
    messages.push(message);
    setItem(STORAGE_KEYS.MESSAGES, messages);
}

export function saveAllMessages(msgs: Message[]): void {
    setItem(STORAGE_KEYS.MESSAGES, msgs);
}

// ============ News ============

export function getAllNews(): NewsPost[] {
    return getItem<NewsPost[]>(STORAGE_KEYS.NEWS, []);
}

export function saveNewsPost(post: NewsPost): void {
    const news = getAllNews();
    const idx = news.findIndex((n) => n.id === post.id);
    if (idx >= 0) {
        news[idx] = post;
    } else {
        news.unshift(post); // newest first
    }
    setItem(STORAGE_KEYS.NEWS, news);
}

export function saveAllNews(news: NewsPost[]): void {
    setItem(STORAGE_KEYS.NEWS, news);
}

// ============ Saved Profiles ============

export function getSavedProfiles(userId: string): string[] {
    const all = getItem<Record<string, string[]>>(STORAGE_KEYS.SAVED_PROFILES, {});
    return all[userId] || [];
}

export function setSavedProfiles(userId: string, saved: string[]): void {
    const all = getItem<Record<string, string[]>>(STORAGE_KEYS.SAVED_PROFILES, {});
    all[userId] = saved;
    setItem(STORAGE_KEYS.SAVED_PROFILES, all);
}

// ============ Business Canvases ============

export function getCanvasesByTeamId(teamId: string): BusinessCanvasVersion[] {
    const all = getItem<BusinessCanvasVersion[]>(STORAGE_KEYS.BUSINESS_CANVASES, []);
    return all
        .filter((c) => c.teamId === teamId)
        .sort((a, b) => b.version - a.version); // newest first
}

export function getCanvasById(id: string): BusinessCanvasVersion | undefined {
    const all = getItem<BusinessCanvasVersion[]>(STORAGE_KEYS.BUSINESS_CANVASES, []);
    return all.find((c) => c.id === id);
}

export function saveCanvas(canvas: BusinessCanvasVersion): void {
    const all = getItem<BusinessCanvasVersion[]>(STORAGE_KEYS.BUSINESS_CANVASES, []);
    const idx = all.findIndex((c) => c.id === canvas.id);
    if (idx >= 0) {
        all[idx] = canvas;
    } else {
        all.push(canvas);
    }
    setItem(STORAGE_KEYS.BUSINESS_CANVASES, all);
}

export function deleteCanvas(id: string): void {
    const all = getItem<BusinessCanvasVersion[]>(STORAGE_KEYS.BUSINESS_CANVASES, []);
    setItem(STORAGE_KEYS.BUSINESS_CANVASES, all.filter((c) => c.id !== id));
}

export function getNextCanvasVersion(teamId: string): number {
    const canvases = getCanvasesByTeamId(teamId);
    if (canvases.length === 0) return 1;
    return Math.max(...canvases.map((c) => c.version)) + 1;
}

// ============ Reset ============

export function resetAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    seedIfNeeded();
}
