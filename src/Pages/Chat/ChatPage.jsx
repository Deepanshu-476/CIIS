import React, { useEffect, useState } from "react";
import "./chat.css";
import ChatSidebar from "../../chat/ChatSidebar";
import ChatBox from "../../chat/ChatBox";
import { getCompanyGroups, getCompanyUsers, getConversations } from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";

const ChatPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);

  const socket = useSocket()?.socket;
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const currentUserId = (currentUser._id || currentUser.id || "").toString();

  const findDirectConversation = user => conversations.find(conversation => {
    if (conversation.isGroup) return false;
    const memberIds = (conversation.members || []).map(member => (member?._id || member?.id || member).toString());
    return memberIds.includes((user._id || user.id).toString());
  });

  const findGroupConversation = group => conversations.find(conversation => (
    conversation.isGroup && (conversation.groupId?._id || conversation.groupId || "").toString() === (group._id || group.id).toString()
  ));

  const sortByConversation = (items, resolver) => [...items].sort((first, second) => {
    const firstConversation = resolver(first);
    const secondConversation = resolver(second);
    const firstTime = new Date(firstConversation?.lastMessage?.createdAt || firstConversation?.updatedAt || 0).getTime();
    const secondTime = new Date(secondConversation?.lastMessage?.createdAt || secondConversation?.updatedAt || 0).getTime();
    return secondTime - firstTime;
  });

  const enrichedUsers = sortByConversation(users.map(user => {
    const conversation = findDirectConversation(user);
    return {
      ...user,
      conversation,
      unreadCount: conversation?.unreadCount || unreadCounts[conversation?._id] || unreadCounts[user._id] || 0,
      lastMessage: conversation?.lastMessage,
    };
  }), user => user.conversation);

  const enrichedGroups = sortByConversation(groups.map(group => {
    const conversation = findGroupConversation(group);
    return {
      ...group,
      isGroup: true,
      conversation,
      unreadCount: conversation?.unreadCount || unreadCounts[conversation?._id] || 0,
      lastMessage: conversation?.lastMessage,
    };
  }), group => group.conversation);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data.conversations || []);
    } catch (error) {
      console.log(error);
    }
  };

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
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleOnline = nextUsers => {
      setOnlineUsers(nextUsers);
    };

    const handleUnread = data => {
      setUnreadCounts(prev => ({
        ...prev,
        [data.conversationId || data.senderId]: data.count || 0,
      }));
      fetchConversations();
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
        users={enrichedUsers}
        groups={enrichedGroups}
        onlineUsers={onlineUsers}
        unreadCounts={unreadCounts}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        currentUserId={currentUserId}
      />

      <ChatBox
        selectedUser={selectedUser}
        currentUser={currentUser}
        users={users}
        socket={socket}
        onConversationChange={fetchConversations}
      />
    </div>
  );
};

export default ChatPage;
