/**
 * API client layer — replaces direct localStorage calls with HTTP requests
 * to the backend server at localhost:3001.
 * 
 * Every function mirrors the signature from the old storage.ts but now
 * calls the Express backend, which persists data to JSON files on disk.
 */
import type { UserProfile, Team, Chat, Message, NewsPost, NewsComment, BusinessCanvasVersion, TeamInvitation } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? '/api'  // Production: Firebase Hosting rewrites /api/** to the Cloud Function
        : 'http://localhost:3001/api');  // Local dev: Express server

// ============ Helpers ============

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });
    if (!res.ok) {
        // For 404s, return null/undefined rather than crashing
        if (res.status === 404) return undefined as unknown as T;
        throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
    return fetchJSON<T>(url, { method: 'POST', body: JSON.stringify(body) });
}

async function putJSON<T>(url: string, body: unknown): Promise<T> {
    return fetchJSON<T>(url, { method: 'PUT', body: JSON.stringify(body) });
}

async function deleteJSON<T>(url: string): Promise<T> {
    return fetchJSON<T>(url, { method: 'DELETE' });
}

// ============ Users ============

export async function getAllUsers(): Promise<UserProfile[]> {
    return fetchJSON<UserProfile[]>('/users');
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
    return fetchJSON<UserProfile | undefined>(`/users/${id}`);
}

export async function getUserByEmail(email: string): Promise<UserProfile | undefined> {
    return fetchJSON<UserProfile | undefined>(`/users/by-email/${encodeURIComponent(email)}`);
}

export async function saveUser(user: UserProfile): Promise<UserProfile> {
    return postJSON<UserProfile>('/users', user);
}

// ============ Auth / Passwords ============

export async function validatePassword(email: string, password: string): Promise<boolean> {
    const result = await postJSON<{ valid: boolean }>('/auth/validate-password', { email, password });
    return result.valid;
}

export async function setPassword(email: string, password: string): Promise<void> {
    await postJSON('/auth/set-password', { email, password });
}

// ============ Teams ============

export async function getAllTeams(): Promise<Team[]> {
    return fetchJSON<Team[]>('/teams');
}

export async function getTeamById(id: string): Promise<Team | undefined> {
    return fetchJSON<Team | undefined>(`/teams/${id}`);
}

export async function saveTeam(team: Team): Promise<Team> {
    return postJSON<Team>('/teams', team);
}

export async function deleteTeam(id: string): Promise<void> {
    await deleteJSON(`/teams/${id}`);
}

export async function updateMemberRole(
    teamId: string,
    userId: string,
    role: string,
    isManagement: boolean
): Promise<void> {
    await putJSON(`/teams/${teamId}/members/${userId}/role`, { role, isManagement });
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
    await deleteJSON(`/teams/${teamId}/members/${userId}`);
}

// ============ Invitations ============

export async function getInvitationsForUser(userId: string): Promise<TeamInvitation[]> {
    return fetchJSON<TeamInvitation[]>(`/invitations/${encodeURIComponent(userId)}`);
}

export async function getInvitationsForTeam(teamId: string): Promise<TeamInvitation[]> {
    return fetchJSON<TeamInvitation[]>(`/invitations/team/${encodeURIComponent(teamId)}`);
}

export async function createInvitation(invitation: TeamInvitation): Promise<TeamInvitation> {
    return postJSON<TeamInvitation>('/invitations', invitation);
}

export async function acceptInvitation(invitationId: string): Promise<TeamInvitation> {
    return postJSON<TeamInvitation>(`/invitations/${encodeURIComponent(invitationId)}/accept`, {});
}

export async function declineInvitation(invitationId: string): Promise<TeamInvitation> {
    return postJSON<TeamInvitation>(`/invitations/${encodeURIComponent(invitationId)}/decline`, {});
}

// ============ Chats ============

export async function getAllChats(): Promise<Chat[]> {
    return fetchJSON<Chat[]>('/chats');
}

export async function getChatById(id: string): Promise<Chat | undefined> {
    return fetchJSON<Chat | undefined>(`/chats/${id}`);
}

export async function saveChat(chat: Chat): Promise<Chat> {
    return postJSON<Chat>('/chats', chat);
}

export async function createOrGetDMChat(userId1: string, userId2: string): Promise<Chat> {
    return postJSON<Chat>('/chats/dm', { userId1, userId2 });
}

// ============ Messages ============

export async function getAllMessages(): Promise<Message[]> {
    return fetchJSON<Message[]>('/messages');
}

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
    return fetchJSON<Message[]>(`/messages?chatId=${encodeURIComponent(chatId)}`);
}

export async function saveMessage(message: Message): Promise<Message> {
    return postJSON<Message>('/messages', message);
}

export async function saveAllMessages(msgs: Message[]): Promise<void> {
    await putJSON('/messages', msgs);
}

// ============ News ============

export async function getAllNews(): Promise<NewsPost[]> {
    return fetchJSON<NewsPost[]>('/news');
}

export async function saveNewsPost(post: NewsPost): Promise<NewsPost> {
    return postJSON<NewsPost>('/news', post);
}

export async function saveAllNews(news: NewsPost[]): Promise<void> {
    await putJSON('/news', news);
}

export async function likeNewsPost(postId: string, userId: string): Promise<NewsPost> {
    return postJSON<NewsPost>(`/news/${encodeURIComponent(postId)}/like`, { userId });
}

export async function addNewsComment(postId: string, comment: NewsComment): Promise<NewsPost> {
    return postJSON<NewsPost>(`/news/${encodeURIComponent(postId)}/comments`, comment);
}

// ============ Connections ============

export async function getConnectedUserIds(userId: string): Promise<string[]> {
    return fetchJSON<string[]>(`/connections/${encodeURIComponent(userId)}`);
}

// ============ Block / Report ============

export async function blockUser(currentUserId: string, targetUserId: string): Promise<void> {
    await postJSON(`/users/${encodeURIComponent(currentUserId)}/block`, { targetUserId });
}

export async function unblockUser(currentUserId: string, targetUserId: string): Promise<void> {
    await postJSON(`/users/${encodeURIComponent(currentUserId)}/unblock`, { targetUserId });
}

export async function reportUser(currentUserId: string, targetUserId: string, reason: string): Promise<void> {
    await postJSON('/reports', { reporterId: currentUserId, reportedUserId: targetUserId, reason });
}

export async function getAllReports(): Promise<any[]> {
    return fetchJSON<any[]>('/reports');
}

export async function resolveReport(reportId: string): Promise<void> {
    await putJSON(`/reports/${encodeURIComponent(reportId)}`, { resolved: true });
}

// ============ Terminates ============

export async function terminateUser(userId: string): Promise<void> {
    await putJSON(`/users/${encodeURIComponent(userId)}`, { isTerminated: true });
}

export async function restoreUser(userId: string): Promise<void> {
    await putJSON(`/users/${encodeURIComponent(userId)}`, { isTerminated: false });
}

export async function terminateTeam(teamId: string): Promise<void> {
    await putJSON(`/teams/${encodeURIComponent(teamId)}`, { isTerminated: true });
}

export async function restoreTeam(teamId: string): Promise<void> {
    await putJSON(`/teams/${encodeURIComponent(teamId)}`, { isTerminated: false });
}

// ============ Saved Profiles ============

export async function getSavedProfiles(userId: string): Promise<string[]> {
    return fetchJSON<string[]>(`/saved-profiles/${encodeURIComponent(userId)}`);
}

export async function setSavedProfiles(userId: string, saved: string[]): Promise<void> {
    await postJSON(`/saved-profiles/${encodeURIComponent(userId)}`, { profiles: saved });
}

// ============ Business Canvases ============

export async function getCanvasesByTeamId(teamId: string): Promise<BusinessCanvasVersion[]> {
    return fetchJSON<BusinessCanvasVersion[]>(`/canvases?teamId=${encodeURIComponent(teamId)}`);
}

export async function getCanvasById(id: string): Promise<BusinessCanvasVersion | undefined> {
    return fetchJSON<BusinessCanvasVersion | undefined>(`/canvases/${id}`);
}

export async function saveCanvas(canvas: BusinessCanvasVersion): Promise<BusinessCanvasVersion> {
    return postJSON<BusinessCanvasVersion>('/canvases', canvas);
}

export async function deleteCanvas(id: string): Promise<void> {
    await deleteJSON(`/canvases/${id}`);
}

export async function getNextCanvasVersion(teamId: string): Promise<number> {
    const canvases = await getCanvasesByTeamId(teamId);
    if (canvases.length === 0) return 1;
    return Math.max(...canvases.map((c) => c.version)) + 1;
}

// ============ Reset ============

export async function resetAllData(): Promise<void> {
    await postJSON('/reset', {});
}

// ============ Seed (no-op for API mode) ============

export function seedIfNeeded(): void {
    // No-op — seeding is done by the server.
    // This function exists for backward compatibility with main.tsx
}
