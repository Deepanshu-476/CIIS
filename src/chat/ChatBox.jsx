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



    useEffect(() => {

        if (selectedUser) {

            startConversation();
        }

    }, [selectedUser]);

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

            setMessages((prev) => [

                ...prev,

                {
                    ...message,
                    seen: false
                }
            ]);
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

    const startConversation =
    async () => {

        try {

            const res =
                await createConversation(
                    selectedUser._id
                );

            setConversation(
                res.data.conversation
            );

            fetchMessages(
                res.data.conversation._id
            );

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

        if (!text.trim()) return;

        try {

            const payload = {

                conversationId:
                    conversation._id,

                text
            };

            const res =
                await sendMessage(payload);

            setMessages((prev) => [

                ...prev,

                {
                    ...res.data.message,
                    seen: false
                }
            ]);

            socket.emit(
                    "chat:send-message",
                    {

                        ...res.data.message,

                        receiverId:
                            selectedUser._id
                    }
                );

            setText("");

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

    return (

        <div className="chat-box">

            <div className="chat-header">

                {selectedUser.name}

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

                <input
                    type="text"
                    className="chat-input"
                    value={text}
                    onChange={(e) =>
                        setText(
                            e.target.value
                        )
                    }
                    placeholder="Type message..."
                />

                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={isSendingAction}
                >
                    Send
                </button>

            </div>

        </div>
    );
};

export default ChatBox;
