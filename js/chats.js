const ChatsStorage = {
    // ===== USERS =====
    getUsers: () => JSON.parse(localStorage.getItem('msgx_users') || '[]'),
    saveUsers: (u) => localStorage.setItem('msgx_users', JSON.stringify(u)),
    
    registerUser: (username, email, password) => {
        const users = ChatsStorage.getUsers();
        if (users.find(u => u.email === email)) return { success: false, message: 'Email already exists!' };
        if (users.find(u => u.username === username)) return { success: false, message: 'Username already taken!' };
        const user = { id: Date.now(), username, email, password, name: username, createdAt: new Date().toISOString() };
        users.push(user);
        ChatsStorage.saveUsers(users);
        
        // AUTO LOGIN after signup
        localStorage.setItem('msgx_current_user', JSON.stringify(user));
        
        return { success: true, user };
    },
    
    loginUser: (email, password) => {
        const users = ChatsStorage.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('msgx_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid email or password!' };
    },
    
    logoutUser: () => {
        localStorage.removeItem('msgx_current_user');
    },
    
    getCurrentUser: () => JSON.parse(localStorage.getItem('msgx_current_user') || 'null'),
    
    isLoggedIn: () => {
        // Test mode: ?test=1 තියෙනවා නම් login page එකට යන්න
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === '1') return false;
        
        return !!localStorage.getItem('msgx_current_user');
    },

    // ===== CONTACTS =====
    getContacts: () => JSON.parse(localStorage.getItem('msgx_contacts') || '[]'),
    saveContacts: (c) => localStorage.setItem('msgx_contacts', JSON.stringify(c)),
    addContact: (name, phone, isGroup = false, members = []) => {
        const contacts = ChatsStorage.getContacts();
        const contact = { id: Date.now(), name, phone: phone || '', about: 'Hey there! I am using MsGX.', isGroup, members, createdAt: new Date().toISOString() };
        contacts.push(contact);
        ChatsStorage.saveContacts(contacts);
        return contact;
    },
    getContact: (id) => ChatsStorage.getContacts().find(c => c.id == id),
    deleteContact: (id) => {
        let contacts = ChatsStorage.getContacts();
        contacts = contacts.filter(c => c.id != id);
        ChatsStorage.saveContacts(contacts);
        localStorage.removeItem('msgx_msgs_' + id);
        localStorage.removeItem('msgx_photo_' + id);
        localStorage.removeItem('msgx_group_photo_' + id);
    },

    // ===== PROFILE PHOTOS =====
    getContactPhoto: (contactId) => localStorage.getItem('msgx_photo_' + contactId),
    saveContactPhoto: (contactId, base64) => localStorage.setItem('msgx_photo_' + contactId, base64),
    removeContactPhoto: (contactId) => localStorage.removeItem('msgx_photo_' + contactId),

    // ===== MESSAGES =====
    getMessages: (contactId) => JSON.parse(localStorage.getItem('msgx_msgs_' + contactId) || '[]'),
    saveMessages: (contactId, msgs) => localStorage.setItem('msgx_msgs_' + contactId, JSON.stringify(msgs)),
    addMessage: (contactId, text, sent, sender = 'Me', type = 'text', extra = {}) => {
        const msgs = ChatsStorage.getMessages(contactId);
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const msg = { id: Date.now() + Math.floor(Math.random() * 1000), text, sent, time, sender, type, extra, read: sent, starred: false, date: now.toISOString() };
        msgs.push(msg);
        ChatsStorage.saveMessages(contactId, msgs);
        return msg;
    },
    deleteMessage: (contactId, msgId) => {
        let msgs = ChatsStorage.getMessages(contactId);
        msgs = msgs.filter(m => m.id !== msgId);
        ChatsStorage.saveMessages(contactId, msgs);
    },
    toggleStar: (contactId, msgId) => {
        const msgs = ChatsStorage.getMessages(contactId);
        const msg = msgs.find(m => m.id === msgId);
        if (msg) { msg.starred = !msg.starred; ChatsStorage.saveMessages(contactId, msgs); }
        return msg;
    },
    getStarredMessages: () => {
        const contacts = ChatsStorage.getContacts();
        const starred = [];
        contacts.forEach(c => {
            const msgs = ChatsStorage.getMessages(c.id);
            msgs.forEach(m => { if (m.starred) starred.push({ ...m, contactName: c.name, contactId: c.id }); });
        });
        return starred.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    getLastMessage: (contactId) => {
        const msgs = ChatsStorage.getMessages(contactId);
        return msgs.length > 0 ? msgs[msgs.length - 1].text : null;
    },
    getLastTime: (contactId) => {
        const msgs = ChatsStorage.getMessages(contactId);
        return msgs.length > 0 ? msgs[msgs.length - 1].time : '';
    },
    clearMessages: (contactId) => localStorage.removeItem('msgx_msgs_' + contactId),

    // ===== CHAT STATE =====
    getChatState: (contactId) => {
        const states = JSON.parse(localStorage.getItem('msgx_chat_states') || '{}');
        return states[contactId] || { pinned: false, muted: false, archived: false };
    },
    setChatState: (contactId, state) => {
        const states = JSON.parse(localStorage.getItem('msgx_chat_states') || '{}');
        states[contactId] = { ...states[contactId], ...state };
        localStorage.setItem('msgx_chat_states', JSON.stringify(states));
    },
    togglePin: (contactId) => {
        const s = ChatsStorage.getChatState(contactId);
        ChatsStorage.setChatState(contactId, { pinned: !s.pinned });
    },
    toggleMute: (contactId) => {
        const s = ChatsStorage.getChatState(contactId);
        ChatsStorage.setChatState(contactId, { muted: !s.muted });
    },
    toggleArchive: (contactId) => {
        const s = ChatsStorage.getChatState(contactId);
        ChatsStorage.setChatState(contactId, { archived: !s.archived });
    },

    // ===== BLOCK CONTACTS =====
    isBlocked: (contactId) => {
        const blocked = JSON.parse(localStorage.getItem('msgx_blocked_contacts') || '[]');
        return blocked.includes(String(contactId));
    },
    blockContact: (contactId, name) => {
        const blocked = JSON.parse(localStorage.getItem('msgx_blocked_contacts') || '[]');
        if (!blocked.includes(String(contactId))) blocked.push(String(contactId));
        localStorage.setItem('msgx_blocked_contacts', JSON.stringify(blocked));
        const names = JSON.parse(localStorage.getItem('msgx_blocked_names') || '{}');
        names[contactId] = name;
        localStorage.setItem('msgx_blocked_names', JSON.stringify(names));
    },
    unblockContact: (contactId) => {
        let blocked = JSON.parse(localStorage.getItem('msgx_blocked_contacts') || '[]');
        blocked = blocked.filter(id => id !== String(contactId));
        localStorage.setItem('msgx_blocked_contacts', JSON.stringify(blocked));
    },

    // ===== THEME =====
    getTheme: () => localStorage.getItem('msgx_theme') || 'dark',
    setTheme: (theme) => localStorage.setItem('msgx_theme', theme),

    // ===== SCHEDULED MESSAGES =====
    getScheduledMessages: () => JSON.parse(localStorage.getItem('msgx_scheduled') || '[]'),
    saveScheduledMessages: (msgs) => localStorage.setItem('msgx_scheduled', JSON.stringify(msgs)),
    addScheduledMessage: (contactId, text, sendAt, type = 'text', extra = {}) => {
        const scheduled = ChatsStorage.getScheduledMessages();
        const msg = { id: Date.now(), contactId, text, sendAt, type, extra, createdAt: new Date().toISOString() };
        scheduled.push(msg);
        ChatsStorage.saveScheduledMessages(scheduled);
        return msg;
    },
    removeScheduledMessage: (id) => {
        let scheduled = ChatsStorage.getScheduledMessages();
        scheduled = scheduled.filter(m => m.id !== id);
        ChatsStorage.saveScheduledMessages(scheduled);
    },
    getScheduledForContact: (contactId) => {
        return ChatsStorage.getScheduledMessages().filter(m => String(m.contactId) === String(contactId));
    },
    processScheduledMessages: () => {
        const now = Date.now();
        const scheduled = ChatsStorage.getScheduledMessages();
        const pending = [];
        let sent = 0;
        scheduled.forEach(m => {
            if (m.sendAt <= now) {
                ChatsStorage.addMessage(m.contactId, m.text, true, 'Me', m.type, m.extra);
                sent++;
            } else {
                pending.push(m);
            }
        });
        if (sent > 0) ChatsStorage.saveScheduledMessages(pending);
        return sent;
    },

    // ===== BROADCAST =====
    getBroadcasts: () => JSON.parse(localStorage.getItem('msgx_broadcasts') || '[]'),
    saveBroadcasts: (b) => localStorage.setItem('msgx_broadcasts', JSON.stringify(b)),
    addBroadcast: (name, members) => {
        const broadcasts = ChatsStorage.getBroadcasts();
        const b = { id: Date.now(), name, members, createdAt: new Date().toISOString() };
        broadcasts.push(b);
        ChatsStorage.saveBroadcasts(broadcasts);
        return b;
    },

    // ===== LINKED DEVICES =====
    getLinkedDevices: () => JSON.parse(localStorage.getItem('msgx_devices') || '[]'),
    saveLinkedDevices: (d) => localStorage.setItem('msgx_devices', JSON.stringify(d)),
    linkDevice: (name) => {
        const devices = ChatsStorage.getLinkedDevices();
        const device = { id: Date.now(), name, linkedAt: new Date().toISOString() };
        devices.push(device);
        ChatsStorage.saveLinkedDevices(devices);
        return device;
    },
    unlinkDevice: (id) => {
        let devices = ChatsStorage.getLinkedDevices();
        devices = devices.filter(d => d.id != id);
        ChatsStorage.saveLinkedDevices(devices);
    },

    // ===== STATUS =====
    getStatuses: () => JSON.parse(localStorage.getItem('msgx_statuses') || '[]'),
    saveStatuses: (s) => localStorage.setItem('msgx_statuses', JSON.stringify(s)),
    addStatus: (type, content, bgColor = '') => {
        const statuses = ChatsStorage.getStatuses();
        const status = { id: Date.now(), type, content, bgColor, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
        statuses.unshift(status);
        ChatsStorage.saveStatuses(statuses);
        return status;
    },
    deleteStatus: (id) => {
        let statuses = ChatsStorage.getStatuses();
        statuses = statuses.filter(s => s.id != id);
        ChatsStorage.saveStatuses(statuses);
    },
    getActiveStatuses: () => {
        const now = new Date();
        return ChatsStorage.getStatuses().filter(s => new Date(s.expiresAt) > now);
    },
    cleanExpiredStatuses: () => {
        const now = new Date();
        const active = ChatsStorage.getStatuses().filter(s => new Date(s.expiresAt) > now);
        ChatsStorage.saveStatuses(active);
    },

    // ===== CHANNELS =====
    getChannels: () => JSON.parse(localStorage.getItem('msgx_channels') || '[]'),
    saveChannels: (c) => localStorage.setItem('msgx_channels', JSON.stringify(c)),
    createChannel: (name, description, isVerified = false) => {
        const channels = ChatsStorage.getChannels();
        const user = ChatsStorage.getCurrentUser();
        const channel = {
            id: Date.now(),
            name,
            description: description || '',
            isVerified,
            ownerId: user ? user.id : null,
            ownerName: user ? (user.name || user.username) : 'Me',
            admins: user ? [user.id] : [],
            followers: [],
            muted: false,
            createdAt: new Date().toISOString()
        };
        channels.push(channel);
        ChatsStorage.saveChannels(channels);
        return channel;
    },
    getChannel: (id) => ChatsStorage.getChannels().find(c => c.id == id),
    updateChannel: (id, updates) => {
        const channels = ChatsStorage.getChannels();
        const idx = channels.findIndex(c => c.id == id);
        if (idx >= 0) {
            channels[idx] = { ...channels[idx], ...updates };
            ChatsStorage.saveChannels(channels);
        }
    },
    deleteChannel: (id) => {
        let channels = ChatsStorage.getChannels();
        channels = channels.filter(c => c.id != id);
        ChatsStorage.saveChannels(channels);
        localStorage.removeItem('msgx_channel_posts_' + id);
    },
    toggleFollowChannel: (id) => {
        const channels = ChatsStorage.getChannels();
        const idx = channels.findIndex(c => c.id == id);
        if (idx < 0) return false;
        const user = ChatsStorage.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const followers = channels[idx].followers || [];
        if (followers.includes(userId)) {
            channels[idx].followers = followers.filter(f => f !== userId);
        } else {
            channels[idx].followers = [...followers, userId];
        }
        ChatsStorage.saveChannels(channels);
        return channels[idx].followers.includes(userId);
    },
    isFollowing: (id) => {
        const user = ChatsStorage.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const channel = ChatsStorage.getChannel(id);
        return channel ? (channel.followers || []).includes(userId) : false;
    },
    isChannelAdmin: (id) => {
        const user = ChatsStorage.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const channel = ChatsStorage.getChannel(id);
        return channel ? (channel.admins || []).includes(userId) : false;
    },
    addChannelAdmin: (channelId, userId) => {
        const channels = ChatsStorage.getChannels();
        const idx = channels.findIndex(c => c.id == channelId);
        if (idx < 0) return;
        if (!channels[idx].admins) channels[idx].admins = [];
        if (!channels[idx].admins.includes(userId)) channels[idx].admins.push(userId);
        ChatsStorage.saveChannels(channels);
    },
    removeChannelAdmin: (channelId, userId) => {
        const channels = ChatsStorage.getChannels();
        const idx = channels.findIndex(c => c.id == channelId);
        if (idx < 0) return;
        channels[idx].admins = (channels[idx].admins || []).filter(a => a !== userId);
        ChatsStorage.saveChannels(channels);
    },
    getChannelPosts: (channelId) => JSON.parse(localStorage.getItem('msgx_channel_posts_' + channelId) || '[]'),
    saveChannelPosts: (channelId, posts) => localStorage.setItem('msgx_channel_posts_' + channelId, JSON.stringify(posts)),
    addChannelPost: (channelId, text, type = 'text', extra = {}) => {
        const posts = ChatsStorage.getChannelPosts(channelId);
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const date = now.toLocaleDateString([], { day: '2-digit', month: 'short' });
        const user = ChatsStorage.getCurrentUser();
        const post = {
            id: Date.now(),
            text, type, extra, time, date,
            authorId: user ? user.id : null,
            authorName: user ? (user.name || user.username) : 'Me',
            reactions: {},
            createdAt: now.toISOString()
        };
        posts.unshift(post);
        ChatsStorage.saveChannelPosts(channelId, posts);
        return post;
    },
    deleteChannelPost: (channelId, postId) => {
        let posts = ChatsStorage.getChannelPosts(channelId);
        posts = posts.filter(p => p.id !== postId);
        ChatsStorage.saveChannelPosts(channelId, posts);
    },
    reactToPost: (channelId, postId, emoji) => {
        const posts = ChatsStorage.getChannelPosts(channelId);
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        const user = ChatsStorage.getCurrentUser();
        const userId = user ? String(user.id) : 'guest';
        if (!post.reactions) post.reactions = {};
        if (!post.reactions[emoji]) post.reactions[emoji] = [];
        if (post.reactions[emoji].includes(userId)) {
            post.reactions[emoji] = post.reactions[emoji].filter(u => u !== userId);
            if (post.reactions[emoji].length === 0) delete post.reactions[emoji];
        } else {
            post.reactions[emoji].push(userId);
        }
        ChatsStorage.saveChannelPosts(channelId, posts);
        return post;
    },
    getChannelPhoto: (channelId) => localStorage.getItem('msgx_channel_photo_' + channelId),
    saveChannelPhoto: (channelId, base64) => localStorage.setItem('msgx_channel_photo_' + channelId, base64),

    // ===== WALLPAPER =====
    getWallpaper: () => localStorage.getItem('msgx_wallpaper'),
    getWallpaperType: () => localStorage.getItem('msgx_wallpaper_type') || 'image',
    saveWallpaper: (base64, type = 'image') => {
        localStorage.setItem('msgx_wallpaper', base64);
        localStorage.setItem('msgx_wallpaper_type', type);
    },
    resetWallpaper: () => {
        localStorage.removeItem('msgx_wallpaper');
        localStorage.removeItem('msgx_wallpaper_type');
    }
};

// ===== GLOBAL WALLPAPER LOADER =====
function loadGlobalWallpaper() {
    const wpType = localStorage.getItem('msgx_wallpaper_type');
    const wpData = localStorage.getItem('msgx_wallpaper');
    const existingVideo = document.querySelector('.global-video-bg');
    if (existingVideo) existingVideo.remove();
    document.body.style.backgroundImage = '';
    if (!wpData) return;
    if (wpType === 'video') {
        const videoBg = document.createElement('video');
        videoBg.src = wpData;
        videoBg.autoplay = true;
        videoBg.loop = true;
        videoBg.muted = true;
        videoBg.playsInline = true;
        videoBg.className = 'global-video-bg';
        document.body.insertBefore(videoBg, document.body.firstChild);
    } else {
        document.body.style.backgroundImage = `url(${wpData})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
    }
}

// ===== THEME APPLIER =====
function applyTheme() {
    const theme = localStorage.getItem('msgx_theme') || 'dark';
    document.body.classList.remove('light-theme');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.classList.add('light-theme');
        }
    }
}
applyTheme();

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (localStorage.getItem('msgx_theme') === 'system') applyTheme();
    });
}

// ===== AUTO-PROCESS SCHEDULED MESSAGES =====
setInterval(() => {
    if (typeof ChatsStorage !== 'undefined' && ChatsStorage.processScheduledMessages) {
        const sent = ChatsStorage.processScheduledMessages();
        if (sent > 0) console.log(sent + ' scheduled message(s) sent');
    }
}, 10000);

setTimeout(() => {
    if (typeof ChatsStorage !== 'undefined' && ChatsStorage.processScheduledMessages) {
        ChatsStorage.processScheduledMessages();
    }
}, 1000);