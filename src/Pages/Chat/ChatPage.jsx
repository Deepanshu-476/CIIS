import React, { useEffect, useState } from "react";
import "./chat.css";
import ChatSidebar from "../../chat/ChatSidebar";
import ChatBox from "../../chat/ChatBox";
import { getCompanyUsers } from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";

const ChatPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});

    const socket = useSocket()?.socket;

    const currentUser = JSON.parse(localStorage.getItem("user")) || {};

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await getCompanyUsers();
                setUsers(res.data.users);
            } catch (error) {
                console.log(error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleUnreadUpdate = (data) => {
            setUnreadCounts((prev) => ({
                ...prev,
                [data.senderId]: data.count
            }));
        };

        const handleOnlineUsers = (online) => {
            setOnlineUsers(online);
        };

        socket.on("chat:unread-update", handleUnreadUpdate);
        socket.on("chat:online-users", handleOnlineUsers);

        return () => {
            socket.off("chat:unread-update", handleUnreadUpdate);
            socket.off("chat:online-users", handleOnlineUsers);
        };
    }, [socket]);

    return (
        <div className="chat-page">
            <ChatSidebar
                users={users}
                onlineUsers={onlineUsers}
                unreadCounts={unreadCounts}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
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
