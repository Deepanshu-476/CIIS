import React, {
    useEffect,
    useRef,
    useState
} from "react";
import "../Pages/Chat/chat.css";
import { Mic, MoreHorizontal, Paperclip, Phone, SendHorizontal, Smile, Square, Video } from "lucide-react";

import { createConversation, createGroupConversation, deleteMessageForEveryone, deleteMessageForMe, forwardMessage, getMessages, markMessageSeen, sendMessage } from "../services/chatService";

import MessageBubble from "./MessageBubble";
import { API_URL_IMG } from "../config";
import { useCall } from "../context/CallContext";

const ChatBox = ({
    selectedUser,
    currentUser,
    users,
    socket,
    onlineUsers = [],
    onConversationChange
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
    const { startCall } = useCall();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

    useEffect(() => {
        if (!selectedUser) {
            return;
        }

        if (currentConversationId) {
            socket?.emit(
                "chat:leave-conversation",
                {
                    conversationId:
                        currentConversationId
                }
            );
            setCurrentConversationId(null);
        }

        setConversation(null);
        setMessages([]);
        startConversation();
    }, [selectedUser]);

    useEffect(() => {
        return () => {
            if (currentConversationId) {
                socket?.emit(
                    "chat:leave-conversation",
                    {
                        conversationId:
                            currentConversationId
                    }
                );
            }
        };
    }, [currentConversationId]);

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

    socket.on(
        "chat:receive-message",
        (message) => {
            const senderId = (message.sender?._id || message.sender || "").toString();
            const currentUserId = (currentUser?._id || currentUser?.id || "").toString();
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
        }
    );

    socket.on(
        "chat:typing",
        (data) => {
            if (data?.conversationId === currentConversationId) {
                setTypingUserId(data.senderId);
            }
        }
    );

    socket.on(
        "chat:stop-typing",
        (data) => {
            if (data?.conversationId === currentConversationId) {
                setTypingUserId(null);
            }
        }
    );

    socket.on(
        "chat:message-deleted-for-me",
        ({ messageId }) => {
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        }
    );

    socket.on(
        "chat:message-deleted-for-everyone",
        ({ messageId }) => {
            setMessages((prev) => prev.map((msg) => (
                msg._id === messageId
                    ? { ...msg, deletedForEveryone: true, text: "" }
                    : msg
            )));
        }
    );

    socket.on(
        "chat:message-forwarded",
        (message) => {
            if (message?.conversationId !== currentConversationId) return;
            setMessages((prev) => (
                prev.some(item => item._id === message._id)
                    ? prev
                    : [...prev, message]
            ));
        }
    );

    socket.on(
    "chat:message-seen",
    (data) => {

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
    }
);

    return () => {

    socket.off(
        "chat:receive-message"
    );

    socket.off(
        "chat:message-seen"
    );
    socket.off("chat:typing");
    socket.off("chat:stop-typing");
    socket.off("chat:message-deleted-for-me");
    socket.off("chat:message-deleted-for-everyone");
    socket.off("chat:message-forwarded");
};

}, [socket, currentConversationId, currentUser?._id, currentUser?.id]);

    const joinConversationRoom =
    (conversationId) => {
        if (!conversationId) return;

        socket?.emit(
            "chat:join-conversation",
            {
                conversationId
            }
        );

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
                    selectedUser._id
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
                joinConversationRoom(
                    conversationData._id
                );
            }
        } catch (error) {
            console.log(error);
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

            console.log(error);
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
                    console.log(error);
                    setRecordingError("Recording send nahi ho paayi. Please try again.");
                }
            };

            recorder.start();
            setRecorderMode(mode);
            setRecordingSeconds(0);
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.log(error);
            stopRecordingTracks();
            setRecorderMode(null);
            setRecordingError("Mic/camera permission allow karke phir try karein.");
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
            socket?.emit("chat:stop-typing", { conversationId: conversation._id });
            onConversationChange?.();

        } catch (error) {
            console.log(error);
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
            console.log(error);
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
            console.log(error);
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
            console.log(error);
        } finally {
            setIsSendingAction(false);
        }
    };

    const handleEmojiSelect = (emoji) => {
        setText((prev) => `${prev}${emoji}`);
        chatInputRef.current?.focus();
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

    const selectedUserId = (selectedUser?._id || selectedUser?.id || "").toString();
    const isSelectedUserOnline = selectedUser?.isGroup ? false : onlineUsers.includes(selectedUserId);

    const startDirectCall = (callType) => {
        if (!isSelectedUserOnline) return;
        startCall(callType, selectedUser);
    };

    return (

        <div className="chat-box">
            <div className="chat-header">
                <div className="chat-header-left">
                    <div className="chat-avatar">
                        {
                            selectedUser.isGroup
                                ? selectedUser.name?.charAt(0).toUpperCase() || "G"
                                : getAvatarSrc(selectedUser.avatar || selectedUser.profileImage || selectedUser.image)
                                ? (
                                    <img
                                        src={getAvatarSrc(selectedUser.avatar || selectedUser.profileImage || selectedUser.image)}
                                        alt={selectedUser.name}
                                    />
                                )
                                : selectedUser.name?.charAt(0).toUpperCase()
                        }
                    </div>
                    <div className="chat-user-meta">
                        <div className="chat-user-name">
                                {selectedUser.isGroup ? getGroupName(selectedUser) : selectedUser.name}
                            </div>
                            <div className="chat-user-status">
                                {typingUserId 
                                    ? "Typing..." 
                                    : selectedUser.isGroup 
                                    ? "Group Chat" 
                                    : (isSelectedUserOnline ? "Online" : "Offline")}
                            </div>
                    </div>
                </div>
                <div className="chat-header-actions">
                    <button
                        type="button"
                        title={selectedUser.isGroup ? "Group calling coming soon" : isSelectedUserOnline ? "Start voice call" : "User is offline"}
                        onClick={() => startDirectCall("audio")}
                        disabled={selectedUser.isGroup || !isSelectedUserOnline}
                    >
                        <Phone size={18} />
                    </button>
                    <button
                        type="button"
                        title={selectedUser.isGroup ? "Group calling coming soon" : isSelectedUserOnline ? "Start video call" : "User is offline"}
                        onClick={() => startDirectCall("video")}
                        disabled={selectedUser.isGroup || !isSelectedUserOnline}
                    >
                        <Video size={18} />
                    </button>
                    <button type="button" className="chat-more-btn" title="More options">
                        <span>More</span>
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="chat-topic-bar">
                <strong>Chat Topic: {getCurrentTopic()}</strong>
                <button type="button">Change Topic</button>
            </div>

            <div className="chat-messages">
                {messages.length > 0 && (
                    <div className="chat-date-separator">
                        <span>
                            {new Date(messages[0]?.createdAt || Date.now()).toLocaleDateString([], {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                            })}
                        </span>
                    </div>
                )}

                {
                    messages.map((message) => (

                        <MessageBubble
                            key={message._id}
                            message={message}
                            currentUser={currentUser}
                            users={users}
                            onDeleteForMe={handleDeleteForMe}
                            onDeleteForEveryone={handleDeleteForEveryone}
                            onForward={handleForward}
                        />
                    ))
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
                            type="file"
                            accept="image/*,video/*,audio/*"
                            multiple
                            onChange={(e) =>
                                setFiles(
                                    Array.from(e.target.files || [])
                                )
                            }
                        />
                        <Paperclip size={19} />
                    </label>

                    <div className="chat-input-wrapper">
                        {files.length > 0 && (
                            <div className="selected-file-info">
                                {files.length === 1 ? files[0].name : `${files.length} files selected`}
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
                                if (e.key === "Enter") {
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
                        disabled={isSendingAction || Boolean(recorderMode && recorderMode !== "audio")}
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
    );
};

export default ChatBox;
