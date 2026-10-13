const ChatsStorage = {
    // ===== USERS =====
    getUsers: () => JSON.parse(localStorage.getItem('msgx_users') || '[]'),
    saveUsers: (u) => localStorage.setItem('msgx_users', JSON.stringify(u)),
    registerUser: (username, email, password) => {
        const users = ChatsStorage.getUsers();
        if (users.find(u => u.email === email)) return { success: false, message: 'Email already exists!' };
        if (users.find(u => u.username === username)) return { success: false, message: 'Username already taken!' };
        const user = { id: Date.now(), username, email, password, createdAt: new Date().toISOString() };
        users.push(user);
        ChatsStorage.saveUsers(users);
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
    logoutUser: () => localStorage.removeItem('msgx_current_user'),
    getCurrentUser: () => JSON.parse(localStorage.getItem('msgx_current_user') || 'null'),
    isLoggedIn: () => !!localStorage.getItem('msgx_current_user'),

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
    },

    // ===== MESSAGES =====
    getMessages: (contactId) => JSON.parse(localStorage.getItem('msgx_msgs_' + contactId) || '[]'),
    saveMessages: (contactId, msgs) => localStorage.setItem('msgx_msgs_' + contactId, JSON.stringify(msgs)),
    addMessage: (contactId, text, sent, sender = 'Me', type = 'text', extra = {}) => {
        const msgs = ChatsStorage.getMessages(contactId);
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const msg = { id: Date.now(), text, sent, time, sender, type, extra, read: sent, starred: false, date: now.toISOString() };
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

    // ===== CHAT STATE (Pin/Mute/Archive) =====
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