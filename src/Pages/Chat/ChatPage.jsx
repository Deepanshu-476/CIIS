import React, { useEffect, useState } from "react";
import "./chat.css";
import ChatSidebar from "../../chat/ChatSidebar";
import ChatBox from "../../chat/ChatBox";
import { getCompanyGroups, getCompanyUsers } from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";

const ChatPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groups, setGroups] = useState([]);

  const socket = useSocket()?.socket;
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const fetchGroups = async () => {
    try {
      const res = await getCompanyGroups();
      const fetchedGroups = res.data.groups || res.data.data || res.data || [];
      setGroups(Array.isArray(fetchedGroups) ? fetchedGroups : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getCompanyUsers();
      setUsers(res.data.users || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleOnline = nextUsers => {
      setOnlineUsers(nextUsers);
    };

    const handleUnread = data => {
      setUnreadCounts(prev => ({
        ...prev,
        [data.senderId]: data.count,
      }));
    };

    socket.on("chat:online-users", handleOnline);
    socket.on("chat:unread-update", handleUnread);

    return () => {
      socket.off("chat:online-users", handleOnline);
      socket.off("chat:unread-update", handleUnread);
    };
  }, [socket]);

  return (
    <div className="chat-page">
      <ChatSidebar
        groups={groups}
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
