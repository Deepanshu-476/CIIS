import { API_URL_IMG } from "../config";

export const entityId = value => String(value?._id || value?.id || value || "");

export const attachmentSource = message => {
    const raw = message?.mediaUrl || message?.fileUrl || message?.attachmentUrl || message?.file || message?.url || message?.path || message?.filename || message?.fileName || "";
    return typeof raw === "object"
        ? String(raw.url || raw.path || raw.fileUrl || raw.filename || raw.name || "")
        : String(raw);
};

// Encode each path segment once; encodeURI double-encodes existing % escapes.
const encodePath = path => path.split("/").map(segment => {
    try { return encodeURIComponent(decodeURIComponent(segment)); }
    catch { return encodeURIComponent(segment); }
}).join("/");

export const attachmentUrls = (source, backendUrl) => {
    if (!source) return [];
    const raw = String(source).trim().replace(/\\/g, "/");
    if (/^(blob:|data:)/i.test(raw)) return [raw];
    const base = backendUrl.replace(/\/+$/, "");
    let path = raw;
    const urls = [];
    if (/^https?:\/\//i.test(raw)) {
        try {
            const parsed = new URL(raw);
            path = parsed.pathname;
            urls.push(`${parsed.origin}${encodePath(path)}${parsed.search}`);
        } catch { return []; }
    } else if (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^[a-z]:\//i.test(raw)) {
        return [];
    }
    const uploadOffset = path.indexOf("/uploads/");
    if (/^[a-z]:\//i.test(path) && uploadOffset >= 0) path = path.slice(uploadOffset);
    const clean = path.replace(/^\/+/, "");
    const filename = clean.split("/").pop();
    if (/^(api\/)?uploads\//.test(clean)) urls.push(`${base}/${encodePath(clean)}`);
    if (clean.startsWith("chat/")) urls.push(`${base}/api/uploads/${encodePath(clean)}`);
    if (filename) {
        urls.push(`${base}/api/uploads/chat/${encodePath(filename)}`);
        urls.push(`${base}/uploads/chat/${encodePath(filename)}`);
    }
    return [...new Set(urls)];
};

export const attachmentKind = message => {
    const type = String(message?.mediaType || message?.fileType || message?.type || "").toLowerCase();
    // A container such as WebM can contain audio OR video. MIME takes precedence.
    if (type.startsWith("image")) return "image";
    if (type.startsWith("audio")) return "audio";
    if (type.startsWith("video")) return "video";
    const path = attachmentSource(message).split(/[?#]/)[0];
    if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(path)) return "image";
    if (/(audio-recording|chat-voice)/i.test(path) || /\.(mp3|wav|ogg|oga|m4a|aac|flac)$/i.test(path)) return "audio";
    if (/\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/i.test(path)) return "video";
    return "document";
};

export const deliveryState = (message, currentUserId, members = []) => {
    const recipients = members.map(entityId).filter(id => id && id !== currentUserId);
    const seenBy = (message.seenBy || []).map(entityId);
    const deliveredTo = (message.deliveredTo || []).map(entityId);
    if (recipients.length) {
        if (recipients.every(id => seenBy.includes(id))) return "seen";
        if (recipients.every(id => deliveredTo.includes(id) || seenBy.includes(id))) return "delivered";
        return "sent";
    }
    if (message.seen || seenBy.some(id => id !== currentUserId)) return "seen";
    if (message.delivered || deliveredTo.some(id => id !== currentUserId)) return "delivered";
    return "sent";
};

export const resolveAvatarUrl = (userOrAvatar, backendUrl = API_URL_IMG) => {
    if (!userOrAvatar) return null;
    let raw = userOrAvatar;
    if (typeof userOrAvatar === "object") {
        raw = userOrAvatar.avatar
            || userOrAvatar.profileImage
            || userOrAvatar.profilePicture
            || userOrAvatar.photo
            || userOrAvatar.image
            || "";
        if (typeof raw === "object" && raw) {
            raw = raw.url || raw.path || raw.src || "";
        }
    }
    if (!raw || typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (/^(data:|blob:)/i.test(trimmed)) {
        return trimmed;
    }

    if (trimmed.startsWith("/9j/")) {
        return `data:image/jpeg;base64,${trimmed}`;
    }
    if (trimmed.startsWith("iVBORw0KGgo")) {
        return `data:image/png;base64,${trimmed}`;
    }
    if (trimmed.startsWith("R0lGOD")) {
        return `data:image/gif;base64,${trimmed}`;
    }
    if (trimmed.startsWith("UklGR")) {
        return `data:image/webp;base64,${trimmed}`;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    const normalized = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");
    const base = (backendUrl || "").replace(/\/+$/, "");
    return base ? `${base}/${normalized}` : `/${normalized}`;
};

