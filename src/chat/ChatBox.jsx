import React, {
    useEffect,
    useRef,
    useState
} from "react";
import "../Pages/Chat/chat.css";
import { ArrowLeft, Bell, ChevronRight, Mic, MessageCircle, MoreVertical, Paperclip, Phone, Search, SendHorizontal, Smile, Square, Star, TimerReset, Video, Wallpaper, X } from "lucide-react";

import { createConversation, createGroupConversation, deleteMessageForEveryone, deleteMessageForMe, forwardMessage, getMessages, markMessageSeen, sendMessage } from "../services/chatService";

import MessageBubble from "./MessageBubble";
import { API_URL_IMG } from "../config";
import { useCall } from "../context/CallContext";
import { useNotification } from "../context/NotificationContext";

const CHAT_FILE_ACCEPT = [
    "image/*", "video/*", "audio/*",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv",
    ".ppt", ".pptx", ".txt", ".rtf",
    ".odt", ".ods", ".odp",
    ".zip", ".rar", ".7z"
].join(",");

const getMessageDate = (value) => {
    const date = new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getMessageDateKey = (value) => {
    const date = getMessageDate(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatMessageDateSeparator = (value) => {
    const date = getMessageDate(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (getMessageDateKey(date) === getMessageDateKey(today)) return "Today";
    if (getMessageDateKey(date) === getMessageDateKey(yesterday)) return "Yesterday";

    return date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
};

const ChatBox = ({
    selectedUser,
    currentUser,
    users,
    socket,
    onlineUsers = [],
    onConversationChange,
    onBack,
    chatSettings = {}
}) => {

    const [conversation, setConversation] =
        useState(null);

    const [messages, setMessages] =
        useState([]);

    const [text, setText] =
        useState("");

    const [files, setFiles] =
        useState([]);

    const [isSendingAction, setIsSendingAction] = useState(false);
    const [typingUserId, setTypingUserId] = useState(null);
    const [recorderMode, setRecorderMode] = useState(null);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [recordingError, setRecordingError] = useState("");
    const typingTimerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingChunksRef = useRef([]);
    const recordingStreamRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const recordingPreviewRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const chatInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeConversationIdRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const { startCall } = useCall();
    const { showToast } = useNotification();
    const [activeChatDateLabel, setActiveChatDateLabel] = useState("");
    const [showActiveChatDate, setShowActiveChatDate] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [contactPanelView, setContactPanelView] = useState("info");
    const [isMuted, setIsMuted] = useState(false);
    const [disappearingMode, setDisappearingMode] = useState("off");
    const [contactWallpaper, setContactWallpaper] = useState("");
    const [contactSound, setContactSound] = useState("default");
    const [starredMessageIds, setStarredMessageIds] = useState([]);
    const [isContactSearchOpen, setIsContactSearchOpen] = useState(false);
    const [contactSearchTerm, setContactSearchTerm] = useState("");
    const effectiveChatSettings = {
        chats: { enterToSend: true, mediaAutoDownload: true, wallpaper: "", ...(chatSettings.chats || {}) },
        videoVoice: { cameraEnabled: true, microphoneEnabled: true, speakerEnabled: true, ...(chatSettings.videoVoice || {}) },
        keyboard: { enabled: true, sendMessage: "Enter", newLine: "Shift+Enter", ...(chatSettings.keyboard || {}) },
    };
    const quickReplies = [
        "Please share the report",
        "What's the next plan?",
        "Any keyword updates?",
        "Thank you!"
    ];
    const emojiGroups = [
        {
            label: "Smileys",
            emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😍", "🥰", "😘", "😗", "😋", "😜", "🤪", "😎", "🤩", "🥳", "😏", "😒", "😔", "😢", "😭", "😤", "😡", "🤯", "😳", "🥺", "😴", "🤒", "🤕", "🤐", "🤫", "🤔", "🫡"]
        },
        {
            label: "Gestures",
            emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👋", "🤚", "🖐️", "✋", "👏", "🙌", "🫶", "🙏", "🤝", "💪", "👀", "🧠", "🗣️", "👑"]
        },
        {
            label: "Hearts",
            emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💯", "🔥", "✨", "⭐"]
        },
        {
            label: "Work",
            emojis: ["✅", "❌", "⚠️", "📌", "📍", "📎", "📄", "📁", "📊", "📈", "📉", "📝", "💼", "💻", "⌨️", "🖥️", "📱", "☎️", "📧", "📅", "⏰", "⏳", "🚀", "🎯"]
        },
        {
            label: "Objects",
            emojis: ["🎉", "🎊", "🎁", "🏆", "🥇", "🔔", "🔒", "🔓", "🔑", "💡", "🔎", "📢", "📣", "💰", "💳", "🧾", "🛠️", "⚙️", "🔧", "🧰", "🧲", "🪄"]
        },
        {
            label: "Food",
            emojis: ["☕", "🍵", "🥤", "🍰", "🍫", "🍪", "🍕", "🍔", "🍟", "🌮", "🍜", "🍱", "🍎", "🍌", "🍇", "🍓", "🥭", "🍉"]
        },
        {
            label: "Travel",
            emojis: ["🚗", "🚕", "🚌", "🚆", "✈️", "🚁", "🚲", "🏢", "🏠", "🏥", "🏦", "🗺️", "🌍", "🌙", "☀️", "⛅", "🌧️", "🌈"]
        },
        {
            label: "Flags",
            emojis: ["🇮🇳", "🇺🇸", "🇬🇧", "🇦🇪", "🇨🇦", "🇦🇺", "🇸🇬", "🇯🇵", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸"]
        }
    ];


    const [currentConversationId, setCurrentConversationId] =
        useState(null);
    const selectedUserKey = selectedUser
        ? `${selectedUser?.isGroup ? "group" : "user"}:${selectedUser?._id || selectedUser?.id || selectedUser?.userId || ""}`
        : "";
    const contactPrefsKey = `ciis-contact-info-${currentUser?._id || currentUser?.id || "user"}-${selectedUserKey || "none"}`;

    const getEntityId = (value) => {
        if (!value) return "";
        if (typeof value === "object") {
            return (value._id || value.id || value.userId || value.user?._id || value.user?.id || "").toString();
        }
        return value.toString();
    };

    const getSenderName = (sender) => {
        if (!sender) return "New message";
        if (typeof sender === "object") {
            return sender.name || sender.fullName || sender.username || sender.email || "New message";
        }
        return selectedUser?.name || "New message";
    };

    const getMessagePreview = (message) => {
        if (message?.text) return message.text;
        if (message?.file) return "Sent an attachment";
        return "Sent a message";
    };

    const updateActiveChatDate = () => {
        const container = chatMessagesRef.current;
        if (!container) return;

        const anchors = Array.from(container.querySelectorAll(".chat-message-date-anchor"));
        if (!anchors.length) {
            setActiveChatDateLabel("");
            setShowActiveChatDate(false);
            return;
        }

        const scrollTop = container.scrollTop;
        let activeLabel = anchors[0].dataset.dateLabel || "";

        for (const anchor of anchors) {
            if (anchor.offsetTop - scrollTop <= 48) {
                activeLabel = anchor.dataset.dateLabel || activeLabel;
            } else {
                break;
            }
        }

        const containerRect = container.getBoundingClientRect();
        const visibleMatchingSeparator = Array.from(container.querySelectorAll(".chat-date-separator"))
            .some((separator) => {
                if (separator.dataset.dateLabel !== activeLabel) return false;
                const rect = separator.getBoundingClientRect();
                const relativeTop = rect.top - containerRect.top;
                return relativeTop >= 0 && relativeTop <= 42;
            });

        setActiveChatDateLabel(activeLabel);
        setShowActiveChatDate(scrollTop > 8 && !visibleMatchingSeparator);
    };

    const notifyIncomingMessage = (message) => {
        const senderName = getSenderName(message.sender);
        const preview = getMessagePreview(message);
        const title = selectedUser?.isGroup ? `${senderName} in ${selectedUser.name || "Group"}` : senderName;

        showToast(
            {
                title,
                message: preview,
            },
            "info",
            5000
        );

        window.electronAPI?.showNotification?.({
            title,
            body: preview,
            type: "chat",
            targetPath: "/ciisUser/chat",
        });

        if ("Notification" in window && document.visibilityState !== "visible") {
            if (Notification.permission === "granted") {
                new Notification(title, {
                    body: preview,
                    icon: "/logoo.png",
                    tag: `ciis-chat-${message._id || message.conversationId || Date.now()}`,
                });
            } else if (Notification.permission === "default") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(title, {
                            body: preview,
                            icon: "/logoo.png",
                            tag: `ciis-chat-${message._id || message.conversationId || Date.now()}`,
                        });
                    }
                });
            }
        }
    };

    useEffect(() => {
        if (!selectedUser) {
            return;
        }

        if (activeConversationIdRef.current) {
            socket?.emit(
                "chat:leave-conversation",
                {
                    conversationId:
                        activeConversationIdRef.current
                }
            );
            activeConversationIdRef.current = null;
            setCurrentConversationId(null);
        }

        setConversation(null);
        setMessages([]);
        setShowContactInfo(false);
        startConversation();  
    }, [selectedUserKey]);

    useEffect(() => {
        setContactPanelView("info");
        setIsContactSearchOpen(false);
        setContactSearchTerm("");
        try {
            const savedPrefs = JSON.parse(localStorage.getItem(contactPrefsKey) || "{}");
            setIsMuted(Boolean(savedPrefs.isMuted));
            setDisappearingMode(savedPrefs.disappearingMode || "off");
            setContactWallpaper(savedPrefs.wallpaper || "");
            setContactSound(savedPrefs.sound || "default");
            setStarredMessageIds(Array.isArray(savedPrefs.starredMessageIds) ? savedPrefs.starredMessageIds : []);
        } catch {
            setIsMuted(false);
            setDisappearingMode("off");
            setContactWallpaper("");
            setContactSound("default");
            setStarredMessageIds([]);
        }
    }, [contactPrefsKey]);

    const saveContactPrefs = (patch) => {
        try {
            const existing = JSON.parse(localStorage.getItem(contactPrefsKey) || "{}");
            localStorage.setItem(contactPrefsKey, JSON.stringify({ ...existing, ...patch }));
        } catch {
            void 0;
        }
    };

    useEffect(() => {
        const frameId = requestAnimationFrame(updateActiveChatDate);
        return () => cancelAnimationFrame(frameId);
    }, [messages]);

    useEffect(() => {
        return () => {
            if (activeConversationIdRef.current) {
                socket?.emit(
                    "chat:leave-conversation",
                    {
                        conversationId:
                            activeConversationIdRef.current
                    }
                );
                activeConversationIdRef.current = null;
            }
        };
    }, [socket]);

    useEffect(() => {
        if (recorderMode === "video" && recordingPreviewRef.current && recordingStreamRef.current) {
            recordingPreviewRef.current.srcObject = recordingStreamRef.current;
        }
    }, [recorderMode]);

    useEffect(() => {
        return () => {
            stopRecordingTracks();
            window.clearInterval(recordingTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (socket && conversation?._id) {
            joinConversationRoom(conversation._id);
        }
    }, [socket, conversation?._id]);

useEffect(() => {
    if (!socket) return undefined;

    const handleReceiveMessage = (message) => {
            const senderId = getEntityId(message.sender);
            const currentUserId = getEntityId(currentUser);
            if (message?._id && senderId && senderId !== currentUserId) {
                markMessageSeen(message._id).catch(() => {});
                socket.emit(
                    "chat:seen",
                    {
                        messageId:
                            message._id,

                        senderId:
                        senderId
                    }
                );

                const incomingConversationId = (message.conversationId || message.conversation?._id || "").toString();
                if (incomingConversationId !== currentConversationId || document.visibilityState !== "visible") {
                    notifyIncomingMessage(message);
                }
            }

            setMessages((prev) => {
                if (
                    prev.some(
                        (msg) =>
                            msg._id ===
                            message._id
                    )
                ) {
                    return prev;
                }

                return [
                    ...prev,
                    {
                        ...message,
                        seen: false
                    }
                ];
            });
        };

    const handleTyping = (data) => {
            if (data?.conversationId === currentConversationId) {
                setTypingUserId(data.senderId);
            }
        };

    const handleStopTyping = (data) => {
            if (data?.conversationId === currentConversationId) {
                setTypingUserId(null);
            }
        };

    const handleDeletedForMe = ({ messageId }) => {
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        };

    const handleDeletedForEveryone = ({ messageId }) => {
            setMessages((prev) => prev.map((msg) => (
                msg._id === messageId
                    ? { ...msg, deletedForEveryone: true, text: "" }
                    : msg
            )));
        };

    const handleForwarded = (message) => {
            if (message?.conversationId !== currentConversationId) return;
            setMessages((prev) => (
                prev.some(item => item._id === message._id)
                    ? prev
                    : [...prev, message]
            ));
        };

    const handleMessageSeen = (data) => {

        setMessages((prev) =>

            prev.map((msg) =>

                msg._id ===
                data.messageId

                ? {
                    ...msg,
                    seen: true
                }

                : msg
            )
        );
    };

    socket.on("chat:receive-message", handleReceiveMessage);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:stop-typing", handleStopTyping);
    socket.on("chat:message-deleted-for-me", handleDeletedForMe);
    socket.on("chat:message-deleted-for-everyone", handleDeletedForEveryone);
    socket.on("chat:message-forwarded", handleForwarded);
    socket.on("chat:message-seen", handleMessageSeen);

    return () => {

    socket.off("chat:receive-message", handleReceiveMessage);
    socket.off("chat:message-seen", handleMessageSeen);
    socket.off("chat:typing", handleTyping);
    socket.off("chat:stop-typing", handleStopTyping);
    socket.off("chat:message-deleted-for-me", handleDeletedForMe);
    socket.off("chat:message-deleted-for-everyone", handleDeletedForEveryone);
    socket.off("chat:message-forwarded", handleForwarded);
};

}, [socket, currentConversationId, currentUser?._id, currentUser?.id, selectedUser?._id, selectedUser?.id, showToast]);

    const joinConversationRoom =
    (conversationId) => {
        if (!conversationId) return;
        if (activeConversationIdRef.current === conversationId) return;

        if (activeConversationIdRef.current) {
            socket?.emit(
                "chat:leave-conversation",
                {
                    conversationId:
                        activeConversationIdRef.current
                }
            );
        }

        socket?.emit(
            "chat:join-conversation",
            {
                conversationId
            }
        );

        activeConversationIdRef.current = conversationId;
        setCurrentConversationId(
            conversationId
        );
    };

    const startConversation =
    async () => {
        if (!selectedUser) return;

        try {
            let res;

            if (selectedUser?.isGroup) {
                res = await createGroupConversation(
                    selectedUser._id || selectedUser.id
                );
            } else {
                res = await createConversation(
                    selectedUser._id || selectedUser.id || selectedUser.userId
                );
            }

            const conversationData =
                res.data.conversation;

            setConversation(
                conversationData
            );

            if (conversationData?._id) {
                fetchMessages(
                    conversationData._id
                );
            }
        } catch (error) {
            void 0;
        }
    };



    const fetchMessages =
    async (conversationId) => {

        try {

            const res =
                await getMessages(
                    conversationId
                );

            setMessages(
                res.data.messages
            );
            onConversationChange?.();

        } catch (error) {

            void 0;
        }
    };

    const appendSentMessages = (messagesToAppend) => {
        setMessages((prev) => {
            const combined = [...prev];

            messagesToAppend.forEach((message) => {
                if (!combined.some((msg) => msg._id === message._id)) {
                    combined.push({ ...message, seen: false });
                }
            });

            return combined;
        });
    };

    const emitSentMessage = (newMessage) => {
        socket?.emit(
            "chat:send-message",
            {
                ...newMessage,
                conversationId:
                    conversation._id
            }
        );
    };

    const stopRecordingTracks = () => {
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;

        if (recordingPreviewRef.current) {
            recordingPreviewRef.current.srcObject = null;
        }
    };

    const getSupportedMimeType = (mode) => {
        const candidates = mode === "video"
            ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
            : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];

        return candidates.find((type) => window.MediaRecorder?.isTypeSupported(type)) || "";
    };

    const getRecordingExtension = (mimeType, mode) => {
        if (mimeType.includes("mp4")) return "mp4";
        if (mimeType.includes("mpeg")) return "mp3";
        if (mimeType.includes("wav")) return "wav";
        if (mimeType.includes("ogg")) return "ogg";
        return mode === "video" ? "webm" : "webm";
    };

    const formatRecordingTime = (seconds) => {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
        const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    };

    const sendRecordedFile = async (blob, mode, mimeType) => {
        if (!conversation || !blob?.size) return;

        const extension = getRecordingExtension(mimeType, mode);
        const fileName = `${mode}-recording-${Date.now()}.${extension}`;
        const file = new File([blob], fileName, { type: mimeType || blob.type || `${mode}/webm` });
        const formData = new FormData();

        formData.append(
            "conversationId",
            conversation._id
        );

        formData.append(
            "file",
            file
        );

        const res =
            await sendMessage(formData);

        const newMessage =
            res.data.message;

        emitSentMessage(newMessage);
        appendSentMessages([newMessage]);
        onConversationChange?.();
    };

    const startRecording = async (mode) => {
        if (!conversation || recorderMode) return;

        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            setRecordingError("Recording is not supported in this browser.");
            return;
        }

        try {
            setRecordingError("");

            const stream = await navigator.mediaDevices.getUserMedia(
                mode === "video"
                    ? { audio: true, video: true }
                    : { audio: true }
            );

            const mimeType = getSupportedMimeType(mode);
            const recorder = new MediaRecorder(
                stream,
                mimeType ? { mimeType } : undefined
            );

            recordingChunksRef.current = [];
            recordingStreamRef.current = stream;
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data?.size) {
                    recordingChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(recordingChunksRef.current, {
                    type: recorder.mimeType || mimeType || `${mode}/webm`
                });

                recordingChunksRef.current = [];
                mediaRecorderRef.current = null;
                window.clearInterval(recordingTimerRef.current);
                setRecordingSeconds(0);
                setRecorderMode(null);
                stopRecordingTracks();

                try {
                    await sendRecordedFile(blob, mode, recorder.mimeType || mimeType);
                } catch (error) {
                    void 0;
                    setRecordingError("Unable to send the recording. Please try again.");
                }
            };

            recorder.start();
            setRecorderMode(mode);
            setRecordingSeconds(0);
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            void 0;
            stopRecordingTracks();
            setRecorderMode(null);
            setRecordingError("Allow microphone/camera permission, then try again.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };



    const handleSend =
    async () => {

        if (
            !text.trim()
            && files.length === 0
        ) return;

        if (!conversation) {
            return;
        }

        try {
            const messagesToAppend = [];

            if (files.length > 0) {
                for (let index = 0; index < files.length; index += 1) {
                    const fileItem = files[index];
                    const formData = new FormData();

                    formData.append(
                        "conversationId",
                        conversation._id
                    );

                    if (index === 0 && text.trim()) {
                        formData.append(
                            "text",
                            text
                        );
                    }

                    formData.append(
                        "file",
                        fileItem
                    );

                    const res =
                        await sendMessage(formData);

                    const newMessage =
                        res.data.message;

                    messagesToAppend.push(newMessage);

                    emitSentMessage(newMessage);
                }
            } else {
                const formData = new FormData();

                formData.append(
                    "conversationId",
                    conversation._id
                );

                formData.append(
                    "text",
                    text
                );

                const res = await sendMessage(formData);
                messagesToAppend.push(res.data.message);

                emitSentMessage(res.data.message);
            }

            appendSentMessages(messagesToAppend);

            setText("");
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            socket?.emit("chat:stop-typing", { conversationId: conversation._id });
            onConversationChange?.();

        } catch (error) {
            void 0;
        }
    };

    const handleDeleteForMe = async (message) => {
        try {
            setIsSendingAction(true);
            await deleteMessageForMe(message._id);
            setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
            socket?.emit("chat:delete-for-me", { messageId: message._id, conversationId: conversation?._id });
            onConversationChange?.();
        } catch (error) {
            void 0;
        } finally {
            setIsSendingAction(false);
        }
    };

    const handleDeleteForEveryone = async (message) => {
        try {
            setIsSendingAction(true);
            await deleteMessageForEveryone(message._id);
            setMessages((prev) => prev.map((msg) => (
                msg._id === message._id ? { ...msg, deletedForEveryone: true, text: "" } : msg
            )));
            socket?.emit("chat:delete-for-everyone", { messageId: message._id, conversationId: conversation?._id });
            onConversationChange?.();
        } catch (error) {
            void 0;
        } finally {
            setIsSendingAction(false);
        }
    };

    const handleForward = async (message, targetUserIds) => {
        try {
            setIsSendingAction(true);
            const res = await forwardMessage({ messageId: message._id, targetUserIds });
            (res.data.messages || []).forEach(forwarded => {
                socket?.emit("chat:forward-message", { message: forwarded });
            });
            onConversationChange?.();
        } catch (error) {
            void 0;
        } finally {
            setIsSendingAction(false);
        }
    };

    const handleMessageReply = (message) => {
        const senderName = message.sender?.name || "User";
        const replyText = message.text || message.fileName || message.name || "Attachment";
        setText((prev) => `${prev ? `${prev}\n` : ""}> ${senderName}: ${replyText}\n`);
        setTimeout(() => chatInputRef.current?.focus(), 0);
    };

    const handleEmojiSelect = (emoji) => {
        setText((prev) => `${prev}${emoji}`);
        chatInputRef.current?.focus();
    };

    const clearSelectedFiles = () => {
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getMessageText = (message) => String(message?.text || message?.caption || "").trim();

    const getMessageAttachmentUrl = (message) => {
        const raw = message?.mediaUrl
            || message?.fileUrl
            || message?.attachmentUrl
            || message?.file
            || message?.url
            || message?.path
            || message?.filename
            || message?.fileName
            || message?.name
            || "";

        if (typeof raw === "object" && raw) {
            return raw.url || raw.path || raw.fileUrl || raw.attachmentUrl || raw.filename || raw.fileName || raw.name || "";
        }

        return String(raw || "");
    };

    const getAttachmentName = (message) => {
        const raw = getMessageAttachmentUrl(message);
        const fallback = getMessageText(message) || "Attachment";
        if (!raw) return fallback;
        const fileName = raw.split(/[\\/]/).pop()?.split("?")[0] || fallback;
        try {
            return decodeURIComponent(fileName).replace(/^\d+-/, "") || fallback;
        } catch {
            return fileName.replace(/^\d+-/, "") || fallback;
        }
    };

    const getAttachmentKind = (message) => {
        const mediaType = String(message?.mediaType || message?.type || message?.fileType || "").toLowerCase();
        const path = getMessageAttachmentUrl(message).split("?")[0].toLowerCase();
        if (mediaType.startsWith("image") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(path)) return "image";
        if (mediaType.startsWith("video") || /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(path)) return "video";
        if (mediaType.startsWith("audio") || /\.(mp3|wav|webm|ogg|m4a|aac)$/i.test(path)) return "audio";
        if (path || mediaType) return "doc";
        return "";
    };

    const contactMediaItems = messages
        .filter((message) => getMessageAttachmentUrl(message) && !message.deletedForEveryone)
        .map((message) => ({
            id: message._id || message.createdAt || getAttachmentName(message),
            message,
            kind: getAttachmentKind(message),
            name: getAttachmentName(message),
            url: getMessageAttachmentUrl(message),
        }));

    const linkMessages = messages.filter((message) => /https?:\/\/\S+/i.test(getMessageText(message)));
    const starredMessages = messages.filter((message) => starredMessageIds.includes(String(message._id || "")) || message.starred || message.isStarred);
    const normalizedSearchTerm = contactSearchTerm.trim().toLowerCase();
    const displayedMessages = normalizedSearchTerm
        ? messages.filter((message) => {
            const haystack = [
                getMessageText(message),
                getAttachmentName(message),
                message.sender?.name,
            ].join(" ").toLowerCase();
            return haystack.includes(normalizedSearchTerm);
        })
        : messages;

    const toggleStarredMessage = (message, shouldStar) => {
        const messageId = String(message?._id || "");
        if (!messageId) return;
        const nextIds = shouldStar
            ? Array.from(new Set([...starredMessageIds, messageId]))
            : starredMessageIds.filter((id) => id !== messageId);
        setStarredMessageIds(nextIds);
        saveContactPrefs({ starredMessageIds: nextIds });
    };

    const openContactSearch = () => {
        setShowContactInfo(false);
        setIsContactSearchOpen(true);
        setContactSearchTerm("");
        requestAnimationFrame(() => chatInputRef.current?.focus());
    };

    const setMuteState = (value) => {
        setIsMuted(value);
        saveContactPrefs({ isMuted: value });
    };

    const setDisappearingState = (value) => {
        setDisappearingMode(value);
        saveContactPrefs({ disappearingMode: value });
    };

    const saveWallpaperAndSound = () => {
        saveContactPrefs({ wallpaper: contactWallpaper, sound: contactSound });
    };

    const renderMediaTile = (item) => {
        const canPreviewImage = item.kind === "image" && item.url;
        return (
            <a
                key={item.id}
                className="chat-contact-media-tile"
                href={item.url || "#"}
                target="_blank"
                rel="noreferrer"
                title={item.name}
            >
                {canPreviewImage ? (
                    <img src={item.url} alt={item.name} />
                ) : item.kind === "video" ? (
                    <Video size={22} />
                ) : item.kind === "audio" ? (
                    <Mic size={22} />
                ) : (
                    <Paperclip size={22} />
                )}
                <small>{item.name}</small>
            </a>
        );
    };

    const renderStarredMessages = () => (
        <div className="chat-contact-subpanel">
            <button type="button" className="chat-contact-back-row" onClick={() => setContactPanelView("info")}>
                <ArrowLeft size={17} /> Starred messages
            </button>
            {starredMessages.length ? (
                starredMessages.map((message) => (
                    <button type="button" className="chat-contact-message-row" key={message._id || message.createdAt}>
                        <strong>{message.sender?.name || (message.sender === currentUserId ? "You" : selectedName)}</strong>
                        <span>{getMessageText(message) || getAttachmentName(message)}</span>
                        <small>{new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                    </button>
                ))
            ) : (
                <p className="chat-contact-empty">No starred messages yet</p>
            )}
        </div>
    );

    const renderMediaPanel = () => (
        <div className="chat-contact-subpanel">
            <button type="button" className="chat-contact-back-row" onClick={() => setContactPanelView("info")}>
                <ArrowLeft size={17} /> Media, links and docs
            </button>
            <div className="chat-contact-media-grid expanded">
                {contactMediaItems.length ? contactMediaItems.map(renderMediaTile) : <p className="chat-contact-empty">No media, links or docs</p>}
            </div>
            {!!linkMessages.length && (
                <div className="chat-contact-links">
                    <strong>Links</strong>
                    {linkMessages.slice(0, 10).map((message) => (
                        <a key={message._id || message.createdAt} href={getMessageText(message).match(/https?:\/\/\S+/i)?.[0]} target="_blank" rel="noreferrer">
                            {getMessageText(message).match(/https?:\/\/\S+/i)?.[0]}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );

    const renderWallpaperPanel = () => (
        <div className="chat-contact-subpanel">
            <button type="button" className="chat-contact-back-row" onClick={() => setContactPanelView("info")}>
                <ArrowLeft size={17} /> Wallpaper & sound
            </button>
            <label className="chat-contact-field">
                Wallpaper URL
                <input value={contactWallpaper} onChange={(event) => setContactWallpaper(event.target.value)} placeholder="Paste image URL" />
            </label>
            <label className="chat-contact-field">
                Message sound
                <select value={contactSound} onChange={(event) => setContactSound(event.target.value)}>
                    <option value="default">Default</option>
                    <option value="soft">Soft</option>
                    <option value="silent">Silent</option>
                    <option value="bright">Bright</option>
                </select>
            </label>
            <button type="button" className="chat-contact-save-btn" onClick={saveWallpaperAndSound}>Save</button>
        </div>
    );

    const renderDisappearingPanel = () => (
        <div className="chat-contact-subpanel">
            <button type="button" className="chat-contact-back-row" onClick={() => setContactPanelView("info")}>
                <ArrowLeft size={17} /> Disappearing messages
            </button>
            {[
                ["off", "Off"],
                ["24h", "24 hours"],
                ["7d", "7 days"],
                ["90d", "90 days"],
            ].map(([value, label]) => (
                <button type="button" className="chat-contact-choice" key={value} onClick={() => setDisappearingState(value)}>
                    <span>{label}</span>
                    <i className={disappearingMode === value ? "active" : ""} />
                </button>
            ))}
        </div>
    );

    const renderContactInfoBody = () => {
        if (contactPanelView === "media") return renderMediaPanel();
        if (contactPanelView === "starred") return renderStarredMessages();
        if (contactPanelView === "wallpaper") return renderWallpaperPanel();
        if (contactPanelView === "disappearing") return renderDisappearingPanel();

        return (
            <>
                <div className="chat-contact-profile">
                    <div className="chat-contact-avatar">
                        {selectedAvatar ? (
                            <img src={selectedAvatar} alt={selectedName} />
                        ) : (
                            selectedName?.charAt(0).toUpperCase() || "U"
                        )}
                    </div>
                    <h2>{selectedName}</h2>
                    <span>{selectedUser.isGroup ? groupStatusLabel : (isSelectedUserOnline ? "online" : "offline")}</span>
                </div>
                <div className="chat-contact-actions">
                    <button
                        type="button"
                        onClick={() => {
                            setShowContactInfo(false);
                            requestAnimationFrame(() => chatInputRef.current?.focus());
                        }}
                        title="Message"
                    >
                        <MessageCircle size={20} />
                        <span>Message</span>
                    </button>
                    <button type="button" onClick={() => startDirectCall("audio")} disabled={!canStartCall || !effectiveChatSettings.videoVoice.microphoneEnabled} title="Voice call">
                        <Phone size={20} />
                        <span>Voice call</span>
                    </button>
                    <button type="button" onClick={() => startDirectCall("video")} disabled={!canStartCall || !effectiveChatSettings.videoVoice.cameraEnabled} title="Video call">
                        <Video size={20} />
                        <span>Video call</span>
                    </button>
                    <button type="button" title="Search" onClick={openContactSearch}>
                        <Search size={20} />
                        <span>Search</span>
                    </button>
                </div>
                <div className="chat-contact-section">
                    <h3>About</h3>
                    <p>{selectedUser?.bio || selectedUser?.about || selectedUser?.companyRole || "Work hard in silence, let success make the noise."}</p>
                </div>
                <div className="chat-contact-section">
                    <div className="chat-contact-section-head">
                        <span>Media, links and docs</span>
                        <button type="button" onClick={() => setContactPanelView("media")}>See all <ChevronRight size={15} /></button>
                    </div>
                    <div className="chat-media-thumbs">
                        {contactMediaItems.slice(0, 3).map(renderMediaTile)}
                        <button type="button" onClick={() => setContactPanelView("media")}>
                            +{Math.max(contactMediaItems.length - 3, 0)}
                        </button>
                    </div>
                </div>
                <div className="chat-contact-list">
                    <button type="button" onClick={() => setContactPanelView("starred")}><Star size={19} /><span>Starred messages<small>{starredMessages.length} saved</small></span><ChevronRight size={18} /></button>
                    <button type="button" onClick={() => setMuteState(!isMuted)}><Bell size={19} /><span>Mute notifications<small>{isMuted ? "On" : "Off"}</small></span><i className={isMuted ? "active" : ""} /></button>
                    <button type="button" onClick={() => setContactPanelView("wallpaper")}><Wallpaper size={19} /><span>Wallpaper & sound<small>{contactSound}</small></span><ChevronRight size={18} /></button>
                    <button type="button" onClick={() => setContactPanelView("disappearing")}><TimerReset size={19} /><span>Disappearing messages<small>{disappearingMode === "off" ? "Off" : disappearingMode}</small></span><ChevronRight size={18} /></button>
                </div>
            </>
        );
    };



    if (!selectedUser) {

        return (
            <>
                <div
                    className="chat-empty"
                >
                    <div className="chat-empty-card">
                        <div className="chat-empty-icon">C</div>
                        <h2>Choose a conversation</h2>
                        <p>Messages, files, and group chats will appear here.</p>
                    </div>
                </div>
            </>
        );
    }

    const getAvatarSrc = (avatar) => {
        if (!avatar) return null;
        return avatar.startsWith("http")
            ? avatar
            : `${API_URL_IMG.replace(/\/$/, "")}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
    };

    const getGroupName = (group) => {
        if (!group) return "";
        return group.name || group.groupName || group.group_name || group.title || "Unnamed Group";
    };

    const getCurrentTopic = () => (
        selectedUser?.isGroup ? getGroupName(selectedUser) : selectedUser?.companyRole || "SEO Project"
    );

    const getMemberId = member => {
        if (!member) return "";
        if (typeof member === "object") {
            return (member._id || member.id || member.userId || member.user?._id || member.user?.id || "").toString();
        }

        return member.toString();
    };

    const groupMembers = selectedUser?.isGroup
        ? selectedUser.members || selectedUser.users || selectedUser.memberIds || selectedUser.membersIds || []
        : [];
    const currentUserId = (currentUser?._id || currentUser?.id || "").toString();
    const isIdOnline = id => {
        const value = (id || "").toString();
        return Boolean(value && onlineUsers.some(userId => userId?.toString() === value));
    };
    const onlineGroupCount = Array.isArray(groupMembers)
        ? groupMembers.filter(member => {
            const memberId = getMemberId(member);
            return memberId && memberId !== currentUserId && isIdOnline(memberId);
        }).length
        : 0;
    const groupMemberCount = Array.isArray(groupMembers)
        ? groupMembers.length
        : Number(selectedUser?.memberCount || selectedUser?.count || 0);
    const groupStatusLabel = groupMemberCount > 0
        ? `${onlineGroupCount} online - ${groupMemberCount} members`
        : "Group Chat";
    const selectedUserId = (selectedUser?._id || selectedUser?.id || "").toString();
    const isSelectedUserOnline = selectedUser?.isGroup
        ? onlineGroupCount > 0
        : Boolean(selectedUser?.isOnline) || isIdOnline(selectedUserId);
    const canStartCall = selectedUser?.isGroup
        ? onlineGroupCount > 0 || groupMemberCount === 0
        : isSelectedUserOnline;

    const startDirectCall = (callType) => {
        if (!canStartCall) return;
        startCall(callType, selectedUser);
    };
    const selectedAvatar = selectedUser?.isGroup
        ? null
        : getAvatarSrc(selectedUser.avatar || selectedUser.profileImage || selectedUser.image);
    const selectedName = selectedUser?.isGroup ? getGroupName(selectedUser) : selectedUser?.name;

    return (

        <div className={showContactInfo ? "chat-box contact-info-open" : "chat-box"}>
            <div className="chat-conversation">
            <div className="chat-header">
                <div className="chat-header-left">
                    <button
                        type="button"
                        className="chat-mobile-back"
                        title="Back to conversations"
                        onClick={onBack}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className="chat-header-profile"
                        onClick={() => setShowContactInfo(true)}
                        title="Open contact info"
                    >
                        <span className="chat-avatar">
                            {
                                selectedUser.isGroup
                                    ? selectedName?.charAt(0).toUpperCase() || "G"
                                    : selectedAvatar
                                    ? (
                                        <img
                                            src={selectedAvatar}
                                            alt={selectedName}
                                        />
                                    )
                                    : selectedName?.charAt(0).toUpperCase()
                            }
                        </span>
                        <span className="chat-user-meta">
                            <span className="chat-user-name">
                                    {selectedName}
                                </span>
                                <span className={`chat-user-status ${selectedUser.isGroup || isSelectedUserOnline ? "" : "offline"}`}>
                                    {typingUserId 
                                        ? "Typing..." 
                                        : selectedUser.isGroup 
                                        ? groupStatusLabel
                                        : (isSelectedUserOnline ? "Online" : "Offline")}
                                </span>
                        </span>
                    </button>
                </div>
                <div className="chat-header-actions">
                    <button
                        type="button"
                        title={!effectiveChatSettings.videoVoice.cameraEnabled ? "Camera disabled in settings" : selectedUser.isGroup ? (canStartCall ? "Start group video call" : "No group member online") : isSelectedUserOnline ? "Start video call" : "User is offline"}
                        onClick={() => startDirectCall("video")}
                        disabled={!canStartCall || !effectiveChatSettings.videoVoice.cameraEnabled}
                    >
                        <Video size={18} />
                    </button>
                    <button
                        type="button"
                        title={!effectiveChatSettings.videoVoice.microphoneEnabled ? "Microphone disabled in settings" : selectedUser.isGroup ? (canStartCall ? "Start group voice call" : "No group member online") : isSelectedUserOnline ? "Start voice call" : "User is offline"}
                        onClick={() => startDirectCall("audio")}
                        disabled={!canStartCall || !effectiveChatSettings.videoVoice.microphoneEnabled}
                    >
                        <Phone size={18} />
                    </button>
                    <button
                        type="button"
                        title="Search"
                    >
                        <Search size={18} />
                    </button>
                    <button type="button" title="More">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            <div className="chat-topic-bar">
                <strong>Chat Topic: {getCurrentTopic()}</strong>
                <button type="button">Change Topic</button>
            </div>

            <div
                className="chat-messages"
                ref={chatMessagesRef}
                onScroll={updateActiveChatDate}
                style={(contactWallpaper || effectiveChatSettings.chats.wallpaper) ? { backgroundImage: `linear-gradient(rgba(255,255,255,0.76), rgba(255,255,255,0.76)), url("${contactWallpaper || effectiveChatSettings.chats.wallpaper}")` } : undefined}
            >
                {isContactSearchOpen && (
                    <div className="chat-message-search-bar">
                        <Search size={16} />
                        <input
                            value={contactSearchTerm}
                            onChange={(event) => setContactSearchTerm(event.target.value)}
                            placeholder="Search messages"
                            autoFocus
                        />
                        <button type="button" onClick={() => { setIsContactSearchOpen(false); setContactSearchTerm(""); }}>
                            <X size={16} />
                        </button>
                    </div>
                )}
                {showActiveChatDate && activeChatDateLabel && (
                    <div className="chat-active-date">
                        <span>{activeChatDateLabel}</span>
                    </div>
                )}

                {
                    displayedMessages.map((message, index) => {
                        const previousMessage = displayedMessages[index - 1];
                        const shouldShowDateSeparator = !previousMessage
                            || getMessageDateKey(previousMessage.createdAt) !== getMessageDateKey(message.createdAt);
                        const messageDateLabel = formatMessageDateSeparator(message.createdAt);

                        return (
                            <React.Fragment key={message._id || `${message.createdAt}-${index}`}>
                                {shouldShowDateSeparator && (
                                    <div className="chat-date-separator" data-date-label={messageDateLabel}>
                                        <span>{messageDateLabel}</span>
                                    </div>
                                )}

                                <div className="chat-message-date-anchor" data-date-label={messageDateLabel}>
                                    <MessageBubble
                                        message={message}
                                        currentUser={currentUser}
                                        users={users}
                                        onDeleteForMe={handleDeleteForMe}
                                        onDeleteForEveryone={handleDeleteForEveryone}
                                        onForward={handleForward}
                                        onReply={handleMessageReply}
                                        isStarredMessage={starredMessageIds.includes(String(message._id || ""))}
                                        onToggleStar={toggleStarredMessage}
                                    />
                                </div>
                            </React.Fragment>
                        );
                    })
                }

            </div>

            <div className="chat-input-area">
                <div className="chat-quick-replies">
                    {quickReplies.map(reply => (
                        <button type="button" key={reply} onClick={() => setText(reply)}>
                            {reply}
                        </button>
                    ))}
                </div>

                <div className="chat-composer">
                    <label className="file-upload-btn" title="Attach file">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={(e) => {
                                setFiles(
                                    Array.from(e.target.files || [])
                                );
                                e.target.value = "";
                            }}
                        />
                        <Paperclip size={19} />
                    </label>

                    <div className="chat-input-wrapper">
                        {files.length > 0 && (
                            <div className="selected-files-wrap">
                                <div className="selected-files-list">
                                    {files.map((file, index) => (
                                        <div
                                            className="selected-file-info"
                                            key={`${file.name}-${file.lastModified}-${index}`}
                                            title={file.name}
                                        >
                                            <span>{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index))}
                                                aria-label={`Deselect ${file.name}`}
                                                title="Deselect file"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {files.length > 1 && (
                                    <button
                                        type="button"
                                        className="selected-files-clear"
                                        onClick={() => setFiles([])}
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}
                        {recorderMode && (
                            <div className="recording-panel">
                                {recorderMode === "video" && (
                                    <video
                                        ref={recordingPreviewRef}
                                        className="recording-preview"
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                )}
                                <div className="recording-status">
                                    <span className="recording-dot" />
                                    {recorderMode === "video" ? "Video recording" : "Voice recording"}
                                    <strong>{formatRecordingTime(recordingSeconds)}</strong>
                                </div>
                            </div>
                        )}
                        {recordingError && (
                            <div className="recording-error">{recordingError}</div>
                        )}
                        <input
                            ref={chatInputRef}
                            type="text"
                            className="chat-input"
                            value={text}
                            onChange={(e) =>
                                {
                                    setText(e.target.value);
                                    if (conversation?._id) {
                                        socket?.emit("chat:typing", { conversationId: conversation._id });
                                        clearTimeout(typingTimerRef.current);
                                        typingTimerRef.current = setTimeout(() => {
                                            socket?.emit("chat:stop-typing", { conversationId: conversation._id });
                                        }, 900);
                                    }
                                }
                            }
                            placeholder="Type your message..."
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter"
                                    && effectiveChatSettings.chats.enterToSend
                                    && (!effectiveChatSettings.keyboard.enabled || !e.shiftKey)
                                ) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                    </div>

                    <div className="emoji-picker-wrap" ref={emojiPickerRef}>
                        <button
                            type="button"
                            className="emoji-btn"
                            title="Emoji"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                        >
                            <Smile size={20} />
                        </button>
                        {showEmojiPicker && (
                            <div className="emoji-picker-panel">
                                {emojiGroups.map((group) => (
                                    <div className="emoji-picker-section" key={group.label}>
                                        <div className="emoji-picker-title">{group.label}</div>
                                        <div className="emoji-picker-grid">
                                            {group.emojis.map((emoji) => (
                                                <button
                                                    type="button"
                                                    key={`${group.label}-${emoji}`}
                                                    className="emoji-picker-item"
                                                    onClick={() => handleEmojiSelect(emoji)}
                                                    aria-label={`Add ${emoji}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        className={recorderMode === "audio" ? "recording-btn active" : "recording-btn"}
                        onClick={() => recorderMode === "audio" ? stopRecording() : startRecording("audio")}
                        disabled={isSendingAction || !effectiveChatSettings.videoVoice.microphoneEnabled || Boolean(recorderMode && recorderMode !== "audio")}
                        title={recorderMode === "audio" ? "Stop voice recording" : "Start voice recording"}
                        type="button"
                    >
                        {recorderMode === "audio" ? <Square size={17} /> : <Mic size={18} />}
                    </button>

                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={isSendingAction}
                        title="Send message"
                        type="button"
                    >
                        <SendHorizontal size={20} />
                    </button>
                </div>
            </div>
            </div>

            {showContactInfo && (
            <aside className="chat-contact-info">
                <div className="chat-contact-top">
                    <button type="button" title="Back" onClick={() => contactPanelView === "info" ? setShowContactInfo(false) : setContactPanelView("info")}>
                        <ArrowLeft size={20} />
                    </button>
                    <strong>{contactPanelView === "info" ? "Contact info" : contactPanelView === "media" ? "Media, links and docs" : contactPanelView === "starred" ? "Starred messages" : contactPanelView === "wallpaper" ? "Wallpaper & sound" : "Disappearing messages"}</strong>
                    <button type="button" title="Close" onClick={() => setShowContactInfo(false)}>
                        <X size={22} />
                    </button>
                </div>
                {renderContactInfoBody()}
            </aside>
            )}

        </div>
    );
};

export default ChatBox;
