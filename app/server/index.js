/**
 * Express.js Backend Server
 * Stores all data in JSON files under server/data/
 * This replaces the localStorage approach with real file-based persistence.
 * 
 * Run: node server/index.js
 * (Make sure to run `node server/generate-seed.js` first if server/data/ is empty)
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// ============ Middleware ============
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============ File Helpers ============

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    try {
        if (!fs.existsSync(filepath)) return null;
        const raw = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error(`Error reading ${filename}:`, err.message);
        return null;
    }
}

function writeJSON(filename, data) {
    ensureDataDir();
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============ Check seed ============

function checkSeed() {
    ensureDataDir();
    const seededFile = path.join(DATA_DIR, '.seeded');
    if (!fs.existsSync(seededFile)) {
        console.error('❌ Data not seeded yet! Run: node server/generate-seed.js');
        process.exit(1);
    }
    console.log('✓ Seed data found');
}

// ============ API Routes ============

// --- Health check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Users ---
app.get('/api/users', (req, res) => {
    const users = readJSON('users.json') || [];
    res.json(users);
});

app.get('/api/users/:id', (req, res) => {
    const users = readJSON('users.json') || [];
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

app.get('/api/users/by-email/:email', (req, res) => {
    const users = readJSON('users.json') || [];
    const user = users.find(
        (u) => u.email.toLowerCase() === decodeURIComponent(req.params.email).toLowerCase()
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

app.post('/api/users', (req, res) => {
    const users = readJSON('users.json') || [];
    const newUser = req.body;
    const idx = users.findIndex((u) => u.id === newUser.id);
    if (idx >= 0) {
        users[idx] = newUser;
    } else {
        users.push(newUser);
    }
    writeJSON('users.json', users);
    res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
    const users = readJSON('users.json') || [];
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'User not found' });
    users[idx] = { ...users[idx], ...req.body };
    writeJSON('users.json', users);
    res.json(users[idx]);
});

// --- Auth / Passwords ---
app.post('/api/auth/validate-password', (req, res) => {
    const { email, password } = req.body;
    const passwords = readJSON('passwords.json') || {};
    const valid = passwords[email.toLowerCase()] === password;
    res.json({ valid });
});

app.post('/api/auth/set-password', (req, res) => {
    const { email, password } = req.body;
    const passwords = readJSON('passwords.json') || {};
    passwords[email.toLowerCase()] = password;
    writeJSON('passwords.json', passwords);
    res.json({ success: true });
});

// --- Teams ---
app.get('/api/teams', (req, res) => {
    const teams = readJSON('teams.json') || [];
    res.json(teams);
});

app.get('/api/teams/:id', (req, res) => {
    const teams = readJSON('teams.json') || [];
    const team = teams.find((t) => t.id === req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
});

app.post('/api/teams', (req, res) => {
    const teams = readJSON('teams.json') || [];
    const newTeam = req.body;
    const idx = teams.findIndex((t) => t.id === newTeam.id);
    if (idx >= 0) {
        teams[idx] = newTeam;
    } else {
        teams.push(newTeam);
    }
    writeJSON('teams.json', teams);
    res.json(newTeam);
});

app.put('/api/teams/:id', (req, res) => {
    const teams = readJSON('teams.json') || [];
    const idx = teams.findIndex((t) => t.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Team not found' });
    teams[idx] = { ...teams[idx], ...req.body };
    writeJSON('teams.json', teams);
    res.json(teams[idx]);
});

app.delete('/api/teams/:id', (req, res) => {
    let teams = readJSON('teams.json') || [];
    teams = teams.filter((t) => t.id !== req.params.id);
    writeJSON('teams.json', teams);
    res.json({ success: true });
});

// --- Team Member Management ---

// Update a team member's role
app.put('/api/teams/:teamId/members/:userId/role', (req, res) => {
    const { teamId, userId } = req.params;
    const { role, isManagement } = req.body;
    const teams = readJSON('teams.json') || [];
    const team = teams.find((t) => t.id === teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const member = team.members.find((m) => m.userId === userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.role = role;
    member.isManagement = !!isManagement;
    writeJSON('teams.json', teams);
    res.json(member);
});

// Remove a team member
app.delete('/api/teams/:teamId/members/:userId', (req, res) => {
    const { teamId, userId } = req.params;
    const teams = readJSON('teams.json') || [];
    const team = teams.find((t) => t.id === teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    team.members = team.members.filter((m) => m.userId !== userId);
    writeJSON('teams.json', teams);

    // Also remove from team chat participants
    const chats = readJSON('chats.json') || [];
    const teamChat = chats.find((c) => c.id === team.chatId);
    if (teamChat) {
        teamChat.participants = teamChat.participants.filter((p) => p !== userId);
        writeJSON('chats.json', chats);
    }

    res.json({ success: true });
});

// --- Invitations ---

// Get all invitations for a user
app.get('/api/invitations/:userId', (req, res) => {
    const all = readJSON('invitations.json') || [];
    const now = new Date().toISOString();
    // Auto-expire old invitations
    const userInvites = all
        .filter((inv) => inv.invitedUserId === req.params.userId)
        .map((inv) => {
            if (inv.status === 'pending' && inv.expiresAt < now) {
                inv.status = 'expired';
            }
            return inv;
        });
    // Save back any status changes
    writeJSON('invitations.json', all);
    res.json(userInvites);
});

// Get invitations sent by a user (for a specific team)
app.get('/api/invitations/team/:teamId', (req, res) => {
    const all = readJSON('invitations.json') || [];
    const now = new Date().toISOString();
    const teamInvites = all
        .filter((inv) => inv.teamId === req.params.teamId)
        .map((inv) => {
            if (inv.status === 'pending' && inv.expiresAt < now) {
                inv.status = 'expired';
            }
            return inv;
        });
    writeJSON('invitations.json', all);
    res.json(teamInvites);
});

// Create an invitation
app.post('/api/invitations', (req, res) => {
    const all = readJSON('invitations.json') || [];
    const invitation = req.body;

    // Check if there's already a pending invite for this user+team
    const existing = all.find(
        (inv) => inv.teamId === invitation.teamId &&
            inv.invitedUserId === invitation.invitedUserId &&
            inv.status === 'pending' &&
            inv.expiresAt > new Date().toISOString()
    );
    if (existing) {
        return res.status(409).json({ error: 'Invitation already pending', invitation: existing });
    }

    all.push(invitation);
    writeJSON('invitations.json', all);

    // Also create a DM message to notify the invited user
    const chats = readJSON('chats.json') || [];
    const chatId = [invitation.invitedBy, invitation.invitedUserId].sort().join('_dm_');
    let dmChat = chats.find((c) => c.id === chatId);
    if (!dmChat) {
        const users = readJSON('users.json') || [];
        const sender = users.find((u) => u.id === invitation.invitedBy);
        const recipient = users.find((u) => u.id === invitation.invitedUserId);
        dmChat = {
            id: chatId,
            name: `${sender?.fullName || 'User'} & ${recipient?.fullName || 'User'}`,
            type: 'dm',
            participants: [invitation.invitedBy, invitation.invitedUserId],
            unreadCount: 1,
            updatedAt: new Date().toISOString(),
        };
        chats.push(dmChat);
    } else {
        dmChat.unreadCount = (dmChat.unreadCount || 0) + 1;
        dmChat.updatedAt = new Date().toISOString();
    }
    writeJSON('chats.json', chats);

    // Save invitation message in the DM
    const messages = readJSON('messages.json') || [];
    messages.push({
        id: `msg_inv_${Date.now()}`,
        chatId,
        senderId: invitation.invitedBy,
        senderType: 'user',
        content: JSON.stringify({
            type: 'invitation',
            invitationId: invitation.id,
            teamId: invitation.teamId,
            teamName: invitation.teamName,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
        }),
        type: 'invitation',
        timestamp: new Date().toISOString(),
    });
    writeJSON('messages.json', messages);

    res.json(invitation);
});

// Accept an invitation
app.post('/api/invitations/:invitationId/accept', (req, res) => {
    const all = readJSON('invitations.json') || [];
    const inv = all.find((i) => i.id === req.params.invitationId);
    if (!inv) return res.status(404).json({ error: 'Invitation not found' });

    const now = new Date().toISOString();
    if (inv.expiresAt < now) {
        inv.status = 'expired';
        writeJSON('invitations.json', all);
        return res.status(410).json({ error: 'Invitation has expired' });
    }
    if (inv.status !== 'pending') {
        return res.status(400).json({ error: `Invitation already ${inv.status}` });
    }

    inv.status = 'accepted';
    writeJSON('invitations.json', all);

    // Add user to the team
    const teams = readJSON('teams.json') || [];
    const team = teams.find((t) => t.id === inv.teamId);
    if (team) {
        if (!team.members.some((m) => m.userId === inv.invitedUserId)) {
            team.members.push({
                userId: inv.invitedUserId,
                role: inv.role,
                isManagement: false,
                joinedAt: now,
            });
            writeJSON('teams.json', teams);
        }

        // Add to team chat participants
        const chats = readJSON('chats.json') || [];
        const teamChat = chats.find((c) => c.id === team.chatId);
        if (teamChat && !teamChat.participants.includes(inv.invitedUserId)) {
            teamChat.participants.push(inv.invitedUserId);
            writeJSON('chats.json', chats);
        }

        // Update user's teamsJoined count
        const users = readJSON('users.json') || [];
        const user = users.find((u) => u.id === inv.invitedUserId);
        if (user) {
            user.teamsJoined = (user.teamsJoined || 0) + 1;
            writeJSON('users.json', users);
        }
    }

    res.json(inv);
});

// Decline an invitation
app.post('/api/invitations/:invitationId/decline', (req, res) => {
    const all = readJSON('invitations.json') || [];
    const inv = all.find((i) => i.id === req.params.invitationId);
    if (!inv) return res.status(404).json({ error: 'Invitation not found' });
    inv.status = 'declined';
    writeJSON('invitations.json', all);
    res.json(inv);
});

// --- Chats ---
app.get('/api/chats', (req, res) => {
    const chats = readJSON('chats.json') || [];
    res.json(chats);
});

app.get('/api/chats/:id', (req, res) => {
    const chats = readJSON('chats.json') || [];
    const chat = chats.find((c) => c.id === req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
});

app.post('/api/chats', (req, res) => {
    const chats = readJSON('chats.json') || [];
    const newChat = req.body;
    const idx = chats.findIndex((c) => c.id === newChat.id);
    if (idx >= 0) {
        chats[idx] = newChat;
    } else {
        chats.push(newChat);
    }
    writeJSON('chats.json', chats);
    res.json(newChat);
});

// Create or get a DM chat between two users
app.post('/api/chats/dm', (req, res) => {
    const { userId1, userId2 } = req.body;
    if (!userId1 || !userId2) {
        return res.status(400).json({ error: 'userId1 and userId2 are required' });
    }

    const chats = readJSON('chats.json') || [];
    const chatId = [userId1, userId2].sort().join('_dm_');

    // Check if DM chat already exists
    let existing = chats.find((c) => c.id === chatId);
    if (existing) {
        return res.json(existing);
    }

    // Look up user names for the chat name
    const users = readJSON('users.json') || [];
    const user1 = users.find((u) => u.id === userId1);
    const user2 = users.find((u) => u.id === userId2);
    const chatName = `${user1?.fullName || 'User'} & ${user2?.fullName || 'User'}`;

    const newChat = {
        id: chatId,
        name: chatName,
        type: 'dm',
        participants: [userId1, userId2],
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
    };

    chats.push(newChat);
    writeJSON('chats.json', chats);

    // Save a system message to signal the start of the conversation
    const messages = readJSON('messages.json') || [];
    messages.push({
        id: `msg_dm_${Date.now()}`,
        chatId,
        senderId: 'system',
        senderType: 'user',
        content: `Conversation started between ${user1?.fullName || 'User'} and ${user2?.fullName || 'User'}`,
        type: 'system',
        timestamp: new Date().toISOString(),
    });
    writeJSON('messages.json', messages);

    res.json(newChat);
});

// --- Messages ---
app.get('/api/messages', (req, res) => {
    const messages = readJSON('messages.json') || [];
    if (req.query.chatId) {
        const filtered = messages.filter((m) => m.chatId === req.query.chatId);
        return res.json(filtered);
    }
    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const messages = readJSON('messages.json') || [];
    const newMessage = req.body;
    messages.push(newMessage);
    writeJSON('messages.json', messages);
    res.json(newMessage);
});

app.put('/api/messages', (req, res) => {
    // Replace ALL messages (used by addReaction)
    writeJSON('messages.json', req.body);
    res.json({ success: true });
});

// --- News ---
app.get('/api/news', (req, res) => {
    const news = readJSON('news.json') || [];
    res.json(news);
});

app.post('/api/news', (req, res) => {
    const news = readJSON('news.json') || [];
    const newPost = req.body;
    const idx = news.findIndex((n) => n.id === newPost.id);
    if (idx >= 0) {
        news[idx] = newPost;
    } else {
        news.unshift(newPost); // newest first
    }
    writeJSON('news.json', news);
    res.json(newPost);
});

app.put('/api/news', (req, res) => {
    writeJSON('news.json', req.body);
    res.json({ success: true });
});

// --- Saved Profiles ---
app.get('/api/saved-profiles/:userId', (req, res) => {
    const all = readJSON('saved_profiles.json') || {};
    res.json(all[req.params.userId] || []);
});

app.post('/api/saved-profiles/:userId', (req, res) => {
    const all = readJSON('saved_profiles.json') || {};
    all[req.params.userId] = req.body.profiles;
    writeJSON('saved_profiles.json', all);
    res.json({ success: true });
});

// --- Business Canvases ---
app.get('/api/canvases', (req, res) => {
    const all = readJSON('business_canvases.json') || [];
    if (req.query.teamId) {
        const filtered = all
            .filter((c) => c.teamId === req.query.teamId)
            .sort((a, b) => b.version - a.version);
        return res.json(filtered);
    }
    res.json(all);
});

app.get('/api/canvases/:id', (req, res) => {
    const all = readJSON('business_canvases.json') || [];
    const canvas = all.find((c) => c.id === req.params.id);
    if (!canvas) return res.status(404).json({ error: 'Canvas not found' });
    res.json(canvas);
});

app.post('/api/canvases', (req, res) => {
    const all = readJSON('business_canvases.json') || [];
    const newCanvas = req.body;
    const idx = all.findIndex((c) => c.id === newCanvas.id);
    if (idx >= 0) {
        all[idx] = newCanvas;
    } else {
        all.push(newCanvas);
    }
    writeJSON('business_canvases.json', all);
    res.json(newCanvas);
});

app.delete('/api/canvases/:id', (req, res) => {
    let all = readJSON('business_canvases.json') || [];
    all = all.filter((c) => c.id !== req.params.id);
    writeJSON('business_canvases.json', all);
    res.json({ success: true });
});

// --- News Like ---
app.post('/api/news/:postId/like', (req, res) => {
    const news = readJSON('news.json') || [];
    const post = news.find((n) => n.id === req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { userId } = req.body;
    if (!post.likedBy) post.likedBy = [];

    if (post.likedBy.includes(userId)) {
        // Unlike
        post.likedBy = post.likedBy.filter((id) => id !== userId);
        post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
        // Like
        post.likedBy.push(userId);
        post.likes = (post.likes || 0) + 1;
    }

    writeJSON('news.json', news);
    res.json(post);
});

// --- News Comment ---
app.post('/api/news/:postId/comments', (req, res) => {
    const news = readJSON('news.json') || [];
    const post = news.find((n) => n.id === req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = req.body;
    if (!post.commentsList) post.commentsList = [];
    post.commentsList.push(comment);
    post.comments = post.commentsList.length;

    writeJSON('news.json', news);
    res.json(post);
});

// --- Connections ---
// A user is "connected" to another if:
// 1. They are on the same team, OR
// 2. They have a DM chat where BOTH users have sent at least one message
app.get('/api/connections/:userId', (req, res) => {
    const userId = req.params.userId;
    const connectedIds = new Set();

    // 1. Same team
    const teams = readJSON('teams.json') || [];
    for (const team of teams) {
        const isMember = team.members.some((m) => m.userId === userId);
        if (isMember) {
            for (const m of team.members) {
                if (m.userId !== userId) connectedIds.add(m.userId);
            }
        }
    }

    // 2. DM chats with mutual messages
    const chats = readJSON('chats.json') || [];
    const messages = readJSON('messages.json') || [];
    const dmChats = chats.filter(
        (c) => c.type === 'dm' && c.participants.includes(userId)
    );
    for (const chat of dmChats) {
        const otherId = chat.participants.find((p) => p !== userId);
        if (!otherId) continue;
        const chatMsgs = messages.filter((m) => m.chatId === chat.id && m.type !== 'system');
        const userSent = chatMsgs.some((m) => m.senderId === userId);
        const otherSent = chatMsgs.some((m) => m.senderId === otherId);
        if (userSent && otherSent) {
            connectedIds.add(otherId);
        }
    }

    // Remove blocked users
    const users = readJSON('users.json') || [];
    const currentUser = users.find((u) => u.id === userId);
    const blockedUsers = currentUser?.blockedUsers || [];
    for (const blocked of blockedUsers) {
        connectedIds.delete(blocked);
    }

    res.json([...connectedIds]);
});

// --- Block / Unblock ---
app.post('/api/users/:userId/block', (req, res) => {
    const users = readJSON('users.json') || [];
    const user = users.find((u) => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { targetUserId } = req.body;
    if (!user.blockedUsers) user.blockedUsers = [];
    if (!user.blockedUsers.includes(targetUserId)) {
        user.blockedUsers.push(targetUserId);
    }
    writeJSON('users.json', users);
    res.json({ success: true });
});

app.post('/api/users/:userId/unblock', (req, res) => {
    const users = readJSON('users.json') || [];
    const user = users.find((u) => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { targetUserId } = req.body;
    user.blockedUsers = (user.blockedUsers || []).filter((id) => id !== targetUserId);
    writeJSON('users.json', users);
    res.json({ success: true });
});

app.get('/api/reports', (req, res) => {
    const reports = readJSON('reports.json') || [];
    res.json(reports);
});

app.post('/api/reports', (req, res) => {
    const reports = readJSON('reports.json') || [];
    const report = {
        id: `report_${Date.now()}`,
        ...req.body,
        timestamp: new Date().toISOString(),
    };
    reports.push(report);
    writeJSON('reports.json', reports);
    res.json({ success: true, report });
});

app.put('/api/reports/:id', (req, res) => {
    const reports = readJSON('reports.json') || [];
    const idx = reports.findIndex((r) => r.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Report not found' });
    reports[idx] = { ...reports[idx], ...req.body };
    writeJSON('reports.json', reports);
    res.json(reports[idx]);
});

// --- Reset (re-seed) ---
app.post('/api/reset', (req, res) => {
    const seededFile = path.join(DATA_DIR, '.seeded');
    if (fs.existsSync(seededFile)) {
        fs.unlinkSync(seededFile);
    }
    res.json({ success: true, message: 'Data cleared. Re-run generate-seed.js to re-seed.' });
});

// ============ Start Server ============

checkSeed();

app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running at http://localhost:${PORT}`);
    console.log(`📁 Data stored in: ${DATA_DIR}`);
    console.log(`💡 API health check: http://localhost:${PORT}/api/health\n`);
});
