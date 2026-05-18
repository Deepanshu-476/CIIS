import React, {
    useEffect,
    useState
} from "react";
import "../Pages/Chat/chat.css";

import { createConversation, getMessages, sendMessage } from "../services/chatService";

import MessageBubble from "./MessageBubble";
import socket from "../socket/socket";

const ChatBox = ({
    selectedUser,
    currentUser
}) => {

    const [conversation, setConversation] =
        useState(null);

    const [messages, setMessages] =
        useState([]);

    const [text, setText] =
        useState("");

    const [file, setFile] =
    useState(null);

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

       if (
            !text.trim()
            && !file
        ) return;

        try {

            const formData =
new FormData();

formData.append(
    "conversationId",
    conversation._id
);

formData.append(
                    "text",
                    text
                );

                if (file) {

                    formData.append(
                        "file",
                        file
                    );
                }

            const res =
                await sendMessage(formData);

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
            setFile(null);

        } catch (error) {

            console.log(error);
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
                            {selectedUser.name}
                        </div>
                        <div className="chat-user-status">
                            {selectedUser.status || "Online"}
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
                        />
                    ))
                }

            </div>

            <div className="chat-input-area">
                <label className="file-upload-btn">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            setFile(
                                e.target.files[0]
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

                    {file && (
                        <div className="selected-file-info">
                            Selected: {file.name}
                        </div>
                    )}
                </div>

                <button
                    className="send-btn"
                    onClick={handleSend}
                >
                    Send
                </button>

            </div>

        </div>
    );
};

export default ChatBox;