'use strict';
/**
 * Express server using Firestore for persistence.
 * All routes mirror the original server/index.js API surface.
 */
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// ============ Firestore Helpers ============

async function getAll(col) {
    const snap = await db.collection(col).get();
    return snap.docs.map(d => d.data());
}

async function getOne(col, id) {
    const doc = await db.collection(col).doc(String(id)).get();
    return doc.exists ? doc.data() : null;
}

async function setOne(col, id, data) {
    await db.collection(col).doc(String(id)).set(data);
    return data;
}

async function delOne(col, id) {
    await db.collection(col).doc(String(id)).delete();
}

async function queryWhere(col, field, op, value) {
    const snap = await db.collection(col).where(field, op, value).get();
    return snap.docs.map(d => d.data());
}

async function batchSet(col, items, idFn) {
    if (!items || !items.length) return;
    const LIMIT = 499;
    for (let i = 0; i < items.length; i += LIMIT) {
        const chunk = items.slice(i, i + LIMIT);
        try {
            const batch = db.batch();
            for (const item of chunk) {
                const id = typeof idFn === 'function' ? idFn(item) : item[idFn];
                batch.set(db.collection(col).doc(String(id)), item);
            }
            await batch.commit();
        } catch (batchErr) {
            // Batch failed — fall back to individual writes so one bad doc doesn't block others
            console.warn(`  batch write to ${col} failed (${batchErr.message}), falling back to individual writes...`);
            for (const item of chunk) {
                const id = typeof idFn === 'function' ? idFn(item) : item[idFn];
                try {
                    await db.collection(col).doc(String(id)).set(item);
                } catch (docErr) {
                    console.warn(`    – skip ${col}/${id}: ${docErr.message}`);
                }
            }
        }
    }
}

function sanitizeForFirestore(item) {
    // Replace base64 data URIs (which can exceed Firestore's 1MB document limit) with a dicebear avatar URL
    const out = { ...item };
    if (typeof out.profilePicture === 'string' && out.profilePicture.startsWith('data:')) {
        const seed = encodeURIComponent(out.fullName || out.id || 'user');
        out.profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    }
    return out;
}

// ============ Auto-seed from bundled JSON data ============

let seeded = false;

async function ensureSeeded() {
    if (seeded) return;
    try {
        const usersSnap = await db.collection('users').limit(1).get();
        if (!usersSnap.empty) { seeded = true; return; }

        console.log('Seeding Firestore from bundled data...');

        // Simple collections keyed by .id
        const simpleCollections = [
            { col: 'users',       file: 'users' },
            { col: 'teams',       file: 'teams' },
            { col: 'chats',       file: 'chats' },
            { col: 'messages',    file: 'messages' },
            { col: 'news',        file: 'news' },
            { col: 'reports',     file: 'reports' },
            { col: 'invitations', file: 'invitations' },
            { col: 'canvases',    file: 'business_canvases' },
        ];

        for (const { col, file } of simpleCollections) {
            try {
                let data = require(`./data/${file}.json`);
                if (Array.isArray(data) && data.length) {
                    // Sanitize all docs (e.g. replace base64 profilePictures)
                    data = data.map(sanitizeForFirestore);
                    await batchSet(col, data, 'id');
                    console.log(`  → seeded ${col} (${data.length} docs)`);
                }
            } catch (e) {
                console.warn(`  – skip ${col}: ${e.message}`);
            }
        }

        // Passwords: { "email": "plaintext_or_hash" }
        try {
            const passwords = require('./data/passwords.json');
            const batch = db.batch();
            for (const [email, pw] of Object.entries(passwords)) {
                const hash = String(pw).startsWith('$2') ? pw : await bcrypt.hash(pw, 10);
                batch.set(db.collection('passwords').doc(email.toLowerCase()), { email, hash });
            }
            await batch.commit();
            console.log('  → seeded passwords');
        } catch (e) {
            console.warn('  – skip passwords:', e.message);
        }

        // Saved profiles: { "userId": [...profileIds] }
        try {
            const saved = require('./data/saved_profiles.json');
            const batch = db.batch();
            for (const [userId, profiles] of Object.entries(saved)) {
                batch.set(db.collection('savedProfiles').doc(userId), { profiles: profiles || [] });
            }
            await batch.commit();
            console.log('  → seeded savedProfiles');
        } catch (e) {
            console.warn('  – skip savedProfiles:', e.message);
        }

        seeded = true;
        console.log('Firestore seeded successfully.');
    } catch (err) {
        console.error('Seeding error:', err.message);
    }
}

// Run auto-seed check on every request (no-op after seeded)
app.use((req, res, next) => {
    ensureSeeded().then(next).catch(next);
});

// ============ Health ============

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ Users ============

app.get('/api/users', async (req, res) => {
    try { res.json(await getAll('users')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// IMPORTANT: specific routes must come before parameterized :id routes
app.get('/api/users/by-email/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase();
        const results = await queryWhere('users', 'email', '==', email);
        if (!results.length) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await getOne('users', req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    try {
        const user = req.body;
        await setOne('users', user.id, user);
        res.json(user);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const existing = await getOne('users', req.params.id);
        if (!existing) return res.status(404).json({ error: 'User not found' });
        const updated = { ...existing, ...req.body };
        await setOne('users', req.params.id, updated);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users/:userId/block', async (req, res) => {
    try {
        const user = await getOne('users', req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.blockedUsers) user.blockedUsers = [];
        if (!user.blockedUsers.includes(req.body.targetUserId)) {
            user.blockedUsers.push(req.body.targetUserId);
        }
        await setOne('users', user.id, user);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users/:userId/unblock', async (req, res) => {
    try {
        const user = await getOne('users', req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.blockedUsers = (user.blockedUsers || []).filter(id => id !== req.body.targetUserId);
        await setOne('users', user.id, user);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Auth / Passwords ============

app.post('/api/auth/validate-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ valid: false });
        const doc = await getOne('passwords', email.toLowerCase());
        if (!doc) return res.json({ valid: false });
        const stored = doc.hash;
        let valid = false;
        if (String(stored).startsWith('$2')) {
            valid = await bcrypt.compare(password, stored);
        } else {
            // Legacy plaintext – compare and upgrade
            valid = stored === password;
            if (valid) {
                await setOne('passwords', email.toLowerCase(), {
                    email,
                    hash: await bcrypt.hash(password, 10),
                });
            }
        }
        res.json({ valid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/set-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password required' });
        await setOne('passwords', email.toLowerCase(), {
            email,
            hash: await bcrypt.hash(password, 10),
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Teams ============

app.get('/api/teams', async (req, res) => {
    try { res.json(await getAll('teams')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/teams/:id', async (req, res) => {
    try {
        const team = await getOne('teams', req.params.id);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        res.json(team);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/teams', async (req, res) => {
    try {
        const team = req.body;
        await setOne('teams', team.id, team);
        res.json(team);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/teams/:id', async (req, res) => {
    try {
        const existing = await getOne('teams', req.params.id);
        if (!existing) return res.status(404).json({ error: 'Team not found' });
        const updated = { ...existing, ...req.body };
        await setOne('teams', req.params.id, updated);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/teams/:id', async (req, res) => {
    try {
        await delOne('teams', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/teams/:teamId/members/:userId/role', async (req, res) => {
    try {
        const team = await getOne('teams', req.params.teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        const member = (team.members || []).find(m => m.userId === req.params.userId);
        if (!member) return res.status(404).json({ error: 'Member not found' });
        member.role = req.body.role;
        member.isManagement = !!req.body.isManagement;
        await setOne('teams', team.id, team);
        res.json(member);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/teams/:teamId/members/:userId', async (req, res) => {
    try {
        const { teamId, userId } = req.params;
        const team = await getOne('teams', teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        team.members = (team.members || []).filter(m => m.userId !== userId);
        await setOne('teams', teamId, team);
        if (team.chatId) {
            const chat = await getOne('chats', team.chatId);
            if (chat) {
                chat.participants = (chat.participants || []).filter(p => p !== userId);
                await setOne('chats', team.chatId, chat);
            }
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Invitations ============

// IMPORTANT: team/:teamId must be registered before :userId
app.get('/api/invitations/team/:teamId', async (req, res) => {
    try {
        const now = new Date().toISOString();
        const invites = await queryWhere('invitations', 'teamId', '==', req.params.teamId);
        const result = [];
        for (const inv of invites) {
            if (inv.status === 'pending' && inv.expiresAt < now) {
                inv.status = 'expired';
                await setOne('invitations', inv.id, inv);
            }
            result.push(inv);
        }
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/invitations/:userId', async (req, res) => {
    try {
        const now = new Date().toISOString();
        const invites = await queryWhere('invitations', 'invitedUserId', '==', req.params.userId);
        const result = [];
        for (const inv of invites) {
            if (inv.status === 'pending' && inv.expiresAt < now) {
                inv.status = 'expired';
                await setOne('invitations', inv.id, inv);
            }
            result.push(inv);
        }
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/invitations', async (req, res) => {
    try {
        const invitation = req.body;
        const now = new Date().toISOString();
        const existing = await queryWhere('invitations', 'teamId', '==', invitation.teamId);
        const dup = existing.find(inv =>
            inv.invitedUserId === invitation.invitedUserId &&
            inv.status === 'pending' &&
            inv.expiresAt > now
        );
        if (dup) return res.status(409).json({ error: 'Invitation already pending', invitation: dup });

        await setOne('invitations', invitation.id, invitation);

        // Create/update DM chat
        const chatId = [invitation.invitedBy, invitation.invitedUserId].sort().join('_dm_');
        let dmChat = await getOne('chats', chatId);
        if (!dmChat) {
            const sender = await getOne('users', invitation.invitedBy);
            const recipient = await getOne('users', invitation.invitedUserId);
            dmChat = {
                id: chatId,
                name: `${sender?.fullName || 'User'} & ${recipient?.fullName || 'User'}`,
                type: 'dm',
                participants: [invitation.invitedBy, invitation.invitedUserId],
                unreadCount: 1,
                updatedAt: now,
            };
        } else {
            dmChat.unreadCount = (dmChat.unreadCount || 0) + 1;
            dmChat.updatedAt = now;
        }
        await setOne('chats', chatId, dmChat);

        const msgId = `msg_inv_${Date.now()}`;
        await setOne('messages', msgId, {
            id: msgId, chatId,
            senderId: invitation.invitedBy, senderType: 'user',
            content: JSON.stringify({
                type: 'invitation',
                invitationId: invitation.id,
                teamId: invitation.teamId,
                teamName: invitation.teamName,
                role: invitation.role,
                expiresAt: invitation.expiresAt,
            }),
            type: 'invitation',
            timestamp: now,
        });

        res.json(invitation);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/invitations/:invitationId/accept', async (req, res) => {
    try {
        const inv = await getOne('invitations', req.params.invitationId);
        if (!inv) return res.status(404).json({ error: 'Invitation not found' });
        const now = new Date().toISOString();
        if (inv.expiresAt < now) {
            inv.status = 'expired';
            await setOne('invitations', inv.id, inv);
            return res.status(410).json({ error: 'Invitation has expired' });
        }
        if (inv.status !== 'pending') return res.status(400).json({ error: `Invitation already ${inv.status}` });

        inv.status = 'accepted';
        await setOne('invitations', inv.id, inv);

        const team = await getOne('teams', inv.teamId);
        if (team) {
            if (!(team.members || []).some(m => m.userId === inv.invitedUserId)) {
                team.members = team.members || [];
                team.members.push({ userId: inv.invitedUserId, role: inv.role, isManagement: false, joinedAt: now });
                await setOne('teams', team.id, team);
            }
            if (team.chatId) {
                const teamChat = await getOne('chats', team.chatId);
                if (teamChat && !(teamChat.participants || []).includes(inv.invitedUserId)) {
                    teamChat.participants = teamChat.participants || [];
                    teamChat.participants.push(inv.invitedUserId);
                    await setOne('chats', team.chatId, teamChat);
                }
            }
            const user = await getOne('users', inv.invitedUserId);
            if (user) {
                user.teamsJoined = (user.teamsJoined || 0) + 1;
                await setOne('users', user.id, user);
            }
        }
        res.json(inv);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/invitations/:invitationId/decline', async (req, res) => {
    try {
        const inv = await getOne('invitations', req.params.invitationId);
        if (!inv) return res.status(404).json({ error: 'Invitation not found' });
        inv.status = 'declined';
        await setOne('invitations', inv.id, inv);
        res.json(inv);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Chats ============

app.get('/api/chats', async (req, res) => {
    try { res.json(await getAll('chats')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// IMPORTANT: /dm must come before /:id
app.post('/api/chats/dm', async (req, res) => {
    try {
        const { userId1, userId2 } = req.body;
        if (!userId1 || !userId2) return res.status(400).json({ error: 'userId1 and userId2 are required' });
        const chatId = [userId1, userId2].sort().join('_dm_');
        const existing = await getOne('chats', chatId);
        if (existing) return res.json(existing);

        const [user1, user2] = await Promise.all([getOne('users', userId1), getOne('users', userId2)]);
        const newChat = {
            id: chatId,
            name: `${user1?.fullName || 'User'} & ${user2?.fullName || 'User'}`,
            type: 'dm',
            participants: [userId1, userId2],
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
        };
        await setOne('chats', chatId, newChat);
        const msgId = `msg_dm_${Date.now()}`;
        await setOne('messages', msgId, {
            id: msgId, chatId, senderId: 'system', senderType: 'user',
            content: `Conversation started between ${user1?.fullName || 'User'} and ${user2?.fullName || 'User'}`,
            type: 'system', timestamp: new Date().toISOString(),
        });
        res.json(newChat);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/chats/:id', async (req, res) => {
    try {
        const chat = await getOne('chats', req.params.id);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        res.json(chat);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chats', async (req, res) => {
    try {
        const chat = req.body;
        await setOne('chats', chat.id, chat);
        res.json(chat);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/chats/:id', async (req, res) => {
    try {
        const existing = await getOne('chats', req.params.id);
        if (!existing) return res.status(404).json({ error: 'Chat not found' });
        const updated = { ...existing, ...req.body };
        await setOne('chats', req.params.id, updated);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Messages ============

app.get('/api/messages', async (req, res) => {
    try {
        if (req.query.chatId) {
            const msgs = await queryWhere('messages', 'chatId', '==', req.query.chatId);
            return res.json(msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        }
        res.json(await getAll('messages'));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/messages', async (req, res) => {
    try {
        const msg = req.body;
        await setOne('messages', msg.id, msg);
        res.json(msg);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/messages', async (req, res) => {
    // Used by addReaction — batch-upsert updated messages
    try {
        await batchSet('messages', req.body, 'id');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ News ============

app.get('/api/news', async (req, res) => {
    try { res.json(await getAll('news')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/news', async (req, res) => {
    try {
        const post = req.body;
        await setOne('news', post.id, post);
        res.json(post);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/news', async (req, res) => {
    try {
        await batchSet('news', req.body, 'id');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/news/:postId/like', async (req, res) => {
    try {
        const post = await getOne('news', req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const { userId } = req.body;
        if (!post.likedBy) post.likedBy = [];
        if (post.likedBy.includes(userId)) {
            post.likedBy = post.likedBy.filter(id => id !== userId);
            post.likes = Math.max(0, (post.likes || 0) - 1);
        } else {
            post.likedBy.push(userId);
            post.likes = (post.likes || 0) + 1;
        }
        await setOne('news', post.id, post);
        res.json(post);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/news/:postId/comments', async (req, res) => {
    try {
        const post = await getOne('news', req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (!post.commentsList) post.commentsList = [];
        post.commentsList.push(req.body);
        post.comments = post.commentsList.length;
        await setOne('news', post.id, post);
        res.json(post);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Saved Profiles ============

app.get('/api/saved-profiles/:userId', async (req, res) => {
    try {
        const doc = await getOne('savedProfiles', req.params.userId);
        res.json(doc?.profiles || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/saved-profiles/:userId', async (req, res) => {
    try {
        await setOne('savedProfiles', req.params.userId, { profiles: req.body.profiles || [] });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Business Canvases ============

app.get('/api/canvases', async (req, res) => {
    try {
        let canvases = await getAll('canvases');
        if (req.query.teamId) {
            canvases = canvases
                .filter(c => c.teamId === req.query.teamId)
                .sort((a, b) => b.version - a.version);
        }
        res.json(canvases);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/canvases/:id', async (req, res) => {
    try {
        const canvas = await getOne('canvases', req.params.id);
        if (!canvas) return res.status(404).json({ error: 'Canvas not found' });
        res.json(canvas);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/canvases', async (req, res) => {
    try {
        const canvas = req.body;
        await setOne('canvases', canvas.id, canvas);
        res.json(canvas);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/canvases/:id', async (req, res) => {
    try {
        await delOne('canvases', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Connections ============

app.get('/api/connections/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const connectedIds = new Set();

        const teams = await getAll('teams');
        for (const team of teams) {
            if ((team.members || []).some(m => m.userId === userId)) {
                for (const m of team.members) {
                    if (m.userId !== userId) connectedIds.add(m.userId);
                }
            }
        }

        const chats = await getAll('chats');
        const dmChats = chats.filter(c => c.type === 'dm' && (c.participants || []).includes(userId));
        await Promise.all(dmChats.map(async chat => {
            const otherId = (chat.participants || []).find(p => p !== userId);
            if (!otherId) return;
            const chatMsgs = await queryWhere('messages', 'chatId', '==', chat.id);
            const nonSystem = chatMsgs.filter(m => m.type !== 'system');
            const userSent = nonSystem.some(m => m.senderId === userId);
            const otherSent = nonSystem.some(m => m.senderId === otherId);
            if (userSent && otherSent) connectedIds.add(otherId);
        }));

        const currentUser = await getOne('users', userId);
        for (const blocked of (currentUser?.blockedUsers || [])) {
            connectedIds.delete(blocked);
        }

        res.json([...connectedIds]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ Reports ============

app.get('/api/reports', async (req, res) => {
    try { res.json(await getAll('reports')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reports', async (req, res) => {
    try {
        const report = { id: `report_${Date.now()}`, ...req.body, timestamp: new Date().toISOString() };
        await setOne('reports', report.id, report);
        res.json({ success: true, report });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/reports/:id', async (req, res) => {
    try {
        const existing = await getOne('reports', req.params.id);
        if (!existing) return res.status(404).json({ error: 'Report not found' });
        const updated = { ...existing, ...req.body };
        await setOne('reports', req.params.id, updated);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ AI / Grok Proxy ============

const GROK_API_KEY = process.env.XAI_API_KEY || '';

const COACH_SYSTEM_PROMPT = `You are an AI Business Coach embedded in BusinessMatch — a startup matchmaking and team-building platform.

Your role is to help aspiring entrepreneurs and startup teams with:
- Building and refining their Business Model Canvas
- Developing go-to-market strategies
- Preparing investor pitches
- Conducting competitive analysis
- Finding the right team members and skillsets
- Setting milestones and tracking progress
- Growth strategies and market validation

Guidelines:
- Be supportive, encouraging, and actionable in your advice.
- Keep responses concise but thorough — aim for 150-300 words.
- Use bullet points, numbered lists, and bold text for clarity when helpful.
- Ask follow-up questions to understand context better before giving advice.
- Reference startup best practices, lean methodology, and design thinking.
- Be specific with your recommendations — avoid generic advice.
- Use emojis sparingly to keep the tone friendly and approachable.`;

app.post('/api/ai/coach', async (req, res) => {
    if (!GROK_API_KEY) return res.status(503).json({ error: 'AI service not configured. Set XAI_API_KEY in Cloud Function environment.' });
    const { conversationHistory = [], userMessage } = req.body;
    if (!userMessage) return res.status(400).json({ error: 'userMessage is required' });
    const messages = [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: userMessage },
    ];
    try {
        const response = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            { model: 'grok-3-mini', messages, stream: false, temperature: 0.7 },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROK_API_KEY}` } }
        );
        res.json({ content: response.data.choices[0].message.content });
    } catch (err) {
        if (err?.response?.status === 401) return res.status(502).json({ error: 'AI authentication failed.' });
        if (err?.response?.status === 429) return res.status(429).json({ error: 'Rate limit exceeded.' });
        res.status(502).json({ error: 'AI service unavailable. Please try again.' });
    }
});

const CANVAS_GENERATION_PROMPT = `You are a Business Model Canvas generator. Based on the conversation history provided, generate a comprehensive Lean Business Model Canvas.

You MUST respond with ONLY valid HTML — no markdown, no explanation, no code fences. Your response will be rendered directly in an iframe.

The HTML must be a complete, self-contained document with all styles inline or in a <style> tag. Do NOT use external CSS or JavaScript libraries.

Requirements:
- Use a clean, professional 3-column grid layout resembling a real Business Model Canvas
- Include these 9 sections: Key Partners, Key Activities, Value Propositions, Customer Relationships, Customer Segments, Key Resources, Channels, Cost Structure, Revenue Streams
- Each section should have a title with an icon/emoji and bullet points
- Make it responsive and print-friendly; use the Google Font "Inter" via @import
- Add a header with the team/project name; use subtle borders, rounded corners, and shadows
- Add a footer with "Generated by AI Business Coach" and today's date

CRITICAL: Return ONLY the HTML. Nothing before <!DOCTYPE html> and nothing after </html>.`;

app.post('/api/ai/canvas', async (req, res) => {
    if (!GROK_API_KEY) return res.status(503).json({ error: 'AI service not configured.' });
    const { teamChatMessages = [], coachMessages = [], teamName } = req.body;
    const contextSummary = [
        teamName ? `Team/Project: ${teamName}` : '',
        teamChatMessages.length ? `Team Chat:\n${teamChatMessages.map(m => `${m.senderName || m.senderId}: ${m.content}`).join('\n')}` : '',
        coachMessages.length ? `Coaching Session:\n${coachMessages.map(m => `${m.role}: ${m.content}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n');
    const messages = [
        { role: 'system', content: CANVAS_GENERATION_PROMPT },
        { role: 'user', content: contextSummary || 'Generate a generic startup business model canvas.' },
    ];
    try {
        const response = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            { model: 'grok-3', messages, stream: false, temperature: 0.3, max_tokens: 4096 },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROK_API_KEY}` } }
        );
        res.json({ html: response.data.choices[0].message.content });
    } catch (err) {
        res.status(502).json({ error: 'Failed to generate canvas. Please try again.' });
    }
});

// ============ Reset (re-seed) ============

app.post('/api/reset', (req, res) => {
    seeded = false;
    res.json({ success: true, message: 'Seed flag cleared. Firestore will be re-seeded from bundled data on next request if empty.' });
});

module.exports = app;
// Thu Apr  9 08:56:01 HKT 2026
