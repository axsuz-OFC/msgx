const ChatsStorage = {
    // ===== CONTACTS =====
    getContacts: () => JSON.parse(localStorage.getItem('msgx_contacts') || '[]'),
    saveContacts: (c) => localStorage.setItem('msgx_contacts', JSON.stringify(c)),
    
    addContact: (name, phone, isGroup = false, members = []) => {
        const contacts = ChatsStorage.getContacts();
        const contact = {
            id: Date.now(),
            name,
            phone: phone || '',
            isGroup,
            members,
            createdAt: new Date().toISOString()
        };
        contacts.push(contact);
        ChatsStorage.saveContacts(contacts);
        return contact;
    },
    
    getContact: (id) => {
        const contacts = ChatsStorage.getContacts();
        return contacts.find(c => c.id == id);
    },
    
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
        const msg = { 
            id: Date.now(), 
            text, 
            sent, 
            time, 
            sender,
            type: type,
            extra: extra,
            read: sent, 
            starred: false,
            date: now.toISOString() 
        };
        msgs.push(msg);
        ChatsStorage.saveMessages(contactId, msgs);
        return msg;
    },
    
    deleteMessage: (contactId, msgId) => {
        let msgs = ChatsStorage.getMessages(contactId);
        msgs = msgs.filter(m => m.id !== msgId);
        ChatsStorage.saveMessages(contactId, msgs);
        return true;
    },
    
    toggleStar: (contactId, msgId) => {
        const msgs = ChatsStorage.getMessages(contactId);
        const msg = msgs.find(m => m.id === msgId);
        if (msg) {
            msg.starred = !msg.starred;
            ChatsStorage.saveMessages(contactId, msgs);
        }
        return msg;
    },
    
    getStarredMessages: () => {
        const contacts = ChatsStorage.getContacts();
        const starred = [];
        contacts.forEach(c => {
            const msgs = ChatsStorage.getMessages(c.id);
            msgs.forEach(m => {
                if (m.starred) {
                    starred.push({ ...m, contactName: c.name, contactId: c.id });
                }
            });
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
        const status = {
            id: Date.now(),
            type: type,
            content: content,
            bgColor: bgColor,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
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
    
    // ===== WALLPAPER (Image + Video) =====
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