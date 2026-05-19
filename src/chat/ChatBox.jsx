import React, {
    useEffect,
    useState
} from "react";
import "../Pages/Chat/chat.css";

import { createConversation, deleteMessageForEveryone, deleteMessageForMe, forwardMessage, getMessages, sendMessage } from "../services/chatService";

import MessageBubble from "./MessageBubble";
import socket from "../socket/socket";

const ChatBox = ({
    selectedUser,
    currentUser,
    users
}) => {

    const [conversation, setConversation] =
        useState(null);

    const [messages, setMessages] =
        useState([]);

    const [text, setText] =
        useState("");

    const [isSendingAction, setIsSendingAction] = useState(false);


    const [currentConversationId, setCurrentConversationId] =
        useState(null);

    useEffect(() => {
        if (!selectedUser) {
            return;
        }

        if (currentConversationId) {
            socket.emit(
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
                socket.emit(
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

    socket.on(
        "chat:receive-message",
        (message) => {
            socket.emit(
                "chat:seen",
                {
                    messageId:
                        message._id,

                    senderId:
                        message.sender._id
                }
            );

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
            setMessages((prev) => [...prev, message]);
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
    socket.off("chat:message-deleted-for-me");
    socket.off("chat:message-deleted-for-everyone");
    socket.off("chat:message-forwarded");
};

}, []);

    const joinConversationRoom =
    (conversationId) => {
        if (!conversationId) return;

        socket.emit(
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

        } catch (error) {

            console.log(error);
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

                    socket.emit(
                        "chat:send-message",
                        {
                            ...newMessage,
                            conversationId:
                                conversation._id
                        }
                    );
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

                socket.emit(
                    "chat:send-message",
                    {
                        ...res.data.message,
                        conversationId:
                            conversation._id
                    }
                );
            }

            setMessages((prev) => {
                const combined = [...prev];

                messagesToAppend.forEach((message) => {
                    if (!combined.some((msg) => msg._id === message._id)) {
                        combined.push({ ...message, seen: false });
                    }
                });

                return combined;
            });

            setText("");
            setFiles([]);

        } catch (error) {
            console.log(error);
        }
    };

    const handleDeleteForMe = async (message) => {
        try {
            setIsSendingAction(true);
            await deleteMessageForMe(message._id);
            setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
            socket.emit("chat:delete-for-me", { messageId: message._id, conversationId: conversation?._id });
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
            socket.emit("chat:delete-for-everyone", { messageId: message._id, conversationId: conversation?._id });
        } catch (error) {
            console.log(error);
        } finally {
            setIsSendingAction(false);
        }
    };

    const handleForward = async (message, targetUserIds) => {
        try {
            setIsSendingAction(true);
            await forwardMessage({ messageId: message._id, targetUserIds });
            socket.emit("chat:forward-message", { messageId: message._id, targetUserIds });
        } catch (error) {
            console.log(error);
        } finally {
            setIsSendingAction(false);
        }
    };



    if (!selectedUser) {

        return (
            <div
                className="chat-empty"
            >
                Select User
            </div>
        );
    }

    const getAvatarSrc = (avatar) => {
        if (!avatar) return null;
        return avatar.startsWith("http")
            ? avatar
            : `http://localhost:3000${avatar}`;
    };

    const getGroupName = (group) => {
        if (!group) return "";
        return group.name || group.groupName || group.group_name || group.title || "Unnamed Group";
    };

    return (

        <div className="chat-box">

            <div className="chat-header">
                <div className="chat-header-left">
                    <div className="chat-avatar">
                        {
                            getAvatarSrc(selectedUser.avatar || selectedUser.profileImage || selectedUser.image)
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
                                {selectedUser.isGroup ? "Group Chat" : selectedUser.status || "Online"}
                            </div>
                    </div>
                </div>
            </div>

            <div className="chat-messages">

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
                <>
                    <label className="file-upload-btn">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) =>
                                setFiles(
                                    Array.from(e.target.files || [])
                                )
                            }
                        />
                        <span>📎</span>
                    </label>

                    <div className="chat-input-wrapper">
                        <input
                            type="text"
                            className="chat-input"
                            value={text}
                            onChange={(e) =>
                                setText(
                                    e.target.value
                                )
                            }
                            placeholder="Type a message"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSend();
                                }
                            }}
                        />

                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={isSendingAction}
                >
                    Send
                </button>

                    <button
                        className="send-btn"
                        onClick={handleSend}
                    >
                        Send
                    </button>
                </>
            </div>

        </div>
    );
};

export default ChatBox;
