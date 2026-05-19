import React, {
    useEffect,
    useState
} from "react";

import "./chat.css";

import ChatSidebar
from "../../chat/ChatSidebar";

import ChatBox
from "../../chat/ChatBox";

import {
    getCompanyUsers
} from "../../services/chatService";

import { useSocket }
from "../../context/SocketContext";

const ChatPage = () => {

    const [users, setUsers] =
        useState([]);

    const [selectedUser,
    setSelectedUser] =
        useState(null);

const [onlineUsers,
setOnlineUsers] =
useState([]);

const [unreadCounts,
setUnreadCounts] =
useState({});

const socket =
useSocket()?.socket;

    const currentUser =
        JSON.parse(
            localStorage.getItem("user")
        ) || {};



    useEffect(() => {

        fetchUsers();

    }, []);

useEffect(() => {

    if (!socket) {

        console.log(
            "❌ SOCKET NOT READY"
        );

        return;
    }

    console.log(
        "✅ ONLINE SOCKET READY"
    );

    socket.on(
        "chat:unread-update",
        (data) => {
            setUnreadCounts((prev) => ({
                ...prev,
                [data.senderId]: data.count
            }));
        }
    );

    socket.on(
        "chat:online-users",
        (users) => {

            console.log(
                "🟢 ONLINE USERS:",
                users
            );

            setOnlineUsers(users);
        }
    );

    return () => {

        socket.off(
            "chat:online-users"
        );
        socket.off(
            "chat:unread-update"
        );
    };

}, [socket]);

    const fetchUsers =
    async () => {

        try {

            const res =
                await getCompanyUsers();

            setUsers(
                res.data.users
            );

        } catch (error) {

            console.log(error);
        }
    };



    return (

        <div className="chat-page">

            <ChatSidebar
                users={users}
                onlineUsers={onlineUsers}
                unreadCounts={unreadCounts}
                selectedUser={selectedUser}
                setSelectedUser={
                    setSelectedUser
                }
            />

            <ChatBox
                selectedUser={selectedUser}
                currentUser={currentUser}
                users={users}
            />

        </div>
    );
};

export default ChatPage;
