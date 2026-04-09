/**
 * Grok API integration for AI Business Coach.
 * All calls are proxied through the backend server so the API key
 * is never exposed in the browser bundle.
 */

const API_BASE = import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? '/api'
        : 'http://localhost:3001/api');

export interface GrokMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Send a conversation to the backend AI proxy and get a coach response.
 *
 * @param conversationHistory - Array of previous messages (without the system prompt)
 * @param userMessage - The new user message to send
 * @returns The assistant's response text
 */
export async function getCoachResponse(
    conversationHistory: GrokMessage[],
    userMessage: string
): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationHistory, userMessage }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 502) throw new Error(err.error || 'API authentication failed.');
        if (res.status === 429) throw new Error(err.error || 'Rate limit exceeded. Please wait a moment and try again.');
        if (res.status === 503) throw new Error(err.error || 'The AI service is not configured on this server.');
        throw new Error(err.error || 'Failed to get a response from the AI coach. Please try again.');
    }

    const data = await res.json();
    return data.content;
}

/**
 * Generate a full Business Model Canvas as HTML from conversation context.
 *
 * @param teamChatMessages - Messages from the team's group chat
 * @param aiChatMessages - Messages from the AI coach chat
 * @param teamName - Name of the team
 * @returns Object with { html, summary }
 */
export async function generateBusinessCanvas(
    teamChatMessages: { role: 'user' | 'assistant'; content: string; senderName?: string; senderId?: string }[],
    aiChatMessages: { role: 'user' | 'assistant'; content: string }[],
    teamName: string
): Promise<{ html: string; summary: string }> {
    const res = await fetch(`${API_BASE}/ai/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            teamChatMessages: teamChatMessages.slice(-30),
            coachMessages: aiChatMessages.slice(-40),
            teamName,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 503) throw new Error(err.error || 'The AI service is not configured on this server.');
        throw new Error(err.error || 'Failed to generate the Business Model Canvas. Please try again.');
    }

    const data = await res.json();
    let html = data.html as string;

    // Clean up any accidental markdown fencing
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();

    const summary = `Business Model Canvas for ${teamName}`;
    return { html, summary };
}

