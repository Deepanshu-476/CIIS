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



    useEffect(() => {

        if (selectedUser) {

            startConversation();
        }

    }, [selectedUser]);

useEffect(() => {

    socket.on(
        "chat:receive-message",
        (message) => {

            setMessages((prev) => [

                ...prev,

                message
            ]);
        }
    );

    return () => {

        socket.off(
            "chat:receive-message"
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
                res.data.message
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
                >
                    Send
                </button>

            </div>

        </div>
    );
};

export default ChatBox;