// Background chat uploads (WhatsApp style): a file shows in the chat as soon as it
// is sent and keeps uploading while the person types more messages or opens other
// chats. It lives outside ChatBox so switching conversations does not stop it.
import { sendMessage } from "../services/chatService";

let items = [];
const listeners = new Set();
const sentListeners = new Set();
const controllers = new Map();
const files = new Map();
let counter = 0;

const emit = () => listeners.forEach((listener) => listener());
const update = (id, patch) => {
    items = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
    emit();
};
const drop = (id) => {
    const item = items.find((entry) => entry.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    items = items.filter((entry) => entry.id !== id);
    controllers.delete(id);
    files.delete(id);
    emit();
};

export const subscribeUploads = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
export const getUploads = () => items;

// Called with (message, conversationId) after the server saved an uploaded message.
export const onUploadSent = (listener) => {
    sentListeners.add(listener);
    return () => sentListeners.delete(listener);
};

export const hasActiveUploads = () => items.some((item) => item.status !== "failed");

const run = async (id) => {
    const job = files.get(id);
    if (!job) return;
    const controller = new AbortController();
    controllers.set(id, controller);
    update(id, { status: "uploading", progress: 0, error: "" });

    const formData = new FormData();
    formData.append("conversationId", job.conversationId);
    if (job.text?.trim()) formData.append("text", job.text);
    if (job.mentions) formData.append("mentions", JSON.stringify(job.mentions));
    if (job.replyToMessageId) formData.append("replyToMessageId", job.replyToMessageId);
    formData.append("file", job.file);
    if (job.file.type) formData.append("fileType", job.file.type);
    if (job.file.name) formData.append("fileName", job.file.name);
    formData.append("compressionMode", job.compressionMode || "normal");

    try {
        const res = await sendMessage(formData, {
            signal: controller.signal,
            onUploadProgress: (event) => {
                const total = event.total || job.file.size || 0;
                const progress = total ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
                // After the last byte the server still saves (and may convert) the file.
                update(id, { progress, status: progress >= 100 ? "processing" : "uploading" });
            },
        });
        const message = res?.data?.message;
        drop(id);
        if (message) sentListeners.forEach((listener) => listener(message, job.conversationId));
    } catch (error) {
        if (controller.signal.aborted) return;
        const status = error?.response?.status;
        const reason = error?.response?.data?.message
            || (status === 413 ? "File is too large for the server" : !error?.response ? "Network problem — check your connection" : "Could not send");
        update(id, { status: "failed", error: reason });
    }
};

// Shows the file in the chat right away and uploads it in the background.
export const enqueueUpload = ({ conversationId, file, text = "", mentions, replyToMessageId, compressionMode, replyTo, sender }) => {
    counter += 1;
    const id = `upload-${Date.now()}-${counter}`;
    const type = String(file.type || "");
    const item = {
        id,
        conversationId: String(conversationId),
        fileName: file.name || "file",
        fileType: type,
        fileSize: file.size || 0,
        previewUrl: type.startsWith("image/") || type.startsWith("video/") ? URL.createObjectURL(file) : "",
        text,
        replyTo,
        sender,
        createdAt: new Date().toISOString(),
        progress: 0,
        status: "uploading",
        error: "",
    };
    files.set(id, { conversationId: String(conversationId), file, text, mentions, replyToMessageId, compressionMode });
    items = [...items, item];
    emit();
    run(id);
    return id;
};

export const retryUpload = (id) => {
    if (files.has(id)) run(id);
};

export const cancelUpload = (id) => {
    controllers.get(id)?.abort();
    drop(id);
};

if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", (event) => {
        if (!hasActiveUploads()) return;
        event.preventDefault();
        event.returnValue = "";
    });
}
