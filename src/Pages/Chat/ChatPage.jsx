import React, { useEffect, useState } from "react";
import "./chat.css";
import ChatSidebar from "../../chat/ChatSidebar";
import ChatBox from "../../chat/ChatBox";
import { getCompanyGroups, getCompanyUsers, getConversations } from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";

const getEntityId = value => {
  if (!value) return "";
  if (typeof value === "object") {
    return (value._id || value.id || value.userId || value.user?._id || value.user?.id || "").toString();
  }
  return value.toString();
};

const normalizeOnlineUserIds = value => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(value?.users)
      ? value.users
      : Array.isArray(value?.onlineUsers)
        ? value.onlineUsers
        : Array.isArray(value?.data)
          ? value.data
          : [];

  return source.map(getEntityId).filter(Boolean);
};

const isTruthyOnline = value => (
  value === true ||
  value === 1 ||
  String(value || "").toLowerCase() === "true" ||
  String(value || "").toLowerCase() === "online"
);

const ChatPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);

  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const isSocketConnected = socketContext?.isConnected;
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

  const getUnreadOverride = (...keys) => {
    for (const key of keys) {
      if (key && Object.prototype.hasOwnProperty.call(unreadCounts, key)) {
        return unreadCounts[key];
      }
    }

    return undefined;
  };

  const enrichedUsers = sortByConversation(users.map(user => {
    const conversation = findDirectConversation(user);
    const userId = (user._id || user.id || "").toString();
    const conversationId = conversation?._id?.toString();
    const unreadOverride = getUnreadOverride(conversationId, userId);
    return {
      ...user,
      conversation,
      unreadCount: unreadOverride ?? conversation?.unreadCount ?? 0,
      lastMessage: conversation?.lastMessage,
    };
  }), user => user.conversation);

  const enrichedGroups = sortByConversation(groups.map(group => {
    const conversation = findGroupConversation(group);
    const conversationId = conversation?._id?.toString();
    const groupId = (group._id || group.id || "").toString();
    const unreadOverride = getUnreadOverride(conversationId, groupId);
    return {
      ...group,
      isGroup: true,
      conversation,
      unreadCount: unreadOverride ?? conversation?.unreadCount ?? 0,
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
      const nextUsers = res.data.users || [];
      setUsers(nextUsers.map(user => {
        const userId = getEntityId(user);
        return {
          ...user,
          isOnline: isTruthyOnline(user.isOnline || user.online || user.status) || onlineUsers.includes(userId),
        };
      }));
      setSelectedUser(prev => {
        if (!prev || prev.isGroup) return prev;
        const previousId = (prev._id || prev.id || "").toString();
        const freshUser = nextUsers.find(user => (user._id || user.id || "").toString() === previousId);
        if (!freshUser) return prev;

        const nextIsOnline = isTruthyOnline(freshUser.isOnline || freshUser.online || freshUser.status) || onlineUsers.includes(previousId);
        if (Boolean(prev.isOnline) === nextIsOnline && prev.lastSeen === freshUser.lastSeen) {
          return prev;
        }

        return {
          ...prev,
          isOnline: nextIsOnline,
          lastSeen: freshUser.lastSeen,
        };
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    fetchConversations();

    const userRefreshTimer = window.setInterval(fetchUsers, 60000);

    return () => {
      window.clearInterval(userRefreshTimer);
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const selectedUserId = (selectedUser?._id || selectedUser?.id || "").toString();
    const selectedConversationId = selectedUser?.conversation?._id?.toString();

    const handleOnline = nextUsers => {
      const onlineIds = normalizeOnlineUserIds(nextUsers);
      setOnlineUsers(onlineIds);
      setUsers(prev => prev.map(user => {
        const userId = getEntityId(user);
        return {...user, isOnline: Boolean(userId && onlineIds.includes(userId))};
      }));
      setSelectedUser(prev => {
        if (!prev || prev.isGroup) return prev;
        const selectedId = (prev._id || prev.id || "").toString();
        const nextIsOnline = Boolean(selectedId && onlineIds.includes(selectedId));
        return Boolean(prev.isOnline) === nextIsOnline ? prev : {...prev, isOnline: nextIsOnline};
      });
    };

    const setSingleUserPresence = (payload, nextIsOnline) => {
      const userId = getEntityId(payload?.user || payload?.userId || payload);
      if (!userId) return;

      setOnlineUsers(prev => {
        const withoutUser = prev.filter(id => id?.toString() !== userId);
        return nextIsOnline ? [...withoutUser, userId] : withoutUser;
      });
      setUsers(prev => prev.map(user => (
        getEntityId(user) === userId ? { ...user, isOnline: nextIsOnline } : user
      )));
      setSelectedUser(prev => (
        prev && !prev.isGroup && getEntityId(prev) === userId
          ? { ...prev, isOnline: nextIsOnline }
          : prev
      ));
    };

    const handleDisconnect = () => handleOnline([]);
    const handleChatUserOnline = data => setSingleUserPresence(data, true);
    const handleChatUserOffline = data => setSingleUserPresence(data, false);

    const refreshOnlineUsers = () => {
      if (!socket.connected) {
        handleOnline([]);
        return;
      }
      socket.emit("chat:get-online-users", users => {
        handleOnline(users);
      });
    };

    const handleUnread = data => {
      const conversationId = data.conversationId?.toString();
      const senderId = data.senderId?.toString();
      const nextCount = conversationId === selectedConversationId || senderId === selectedUserId
        ? 0
        : data.count || 0;

      setUnreadCounts(prev => ({
        ...prev,
        ...(conversationId ? {[conversationId]: nextCount} : {}),
        ...(senderId ? {[senderId]: nextCount} : {}),
      }));
      fetchConversations();
    };

    socket.on("chat:online-users", handleOnline);
    socket.on("chat:user-online", handleChatUserOnline);
    socket.on("chat:user-offline", handleChatUserOffline);
    socket.on("user:online", handleChatUserOnline);
    socket.on("user:offline", handleChatUserOffline);
    socket.on("chat:unread-update", handleUnread);
    socket.on("connect", refreshOnlineUsers);
    socket.on("disconnect", handleDisconnect);
    socket.io?.on("reconnect", refreshOnlineUsers);
    refreshOnlineUsers();
    const refreshTimer = window.setInterval(refreshOnlineUsers, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOnlineUsers();
        fetchUsers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.off("chat:online-users", handleOnline);
      socket.off("chat:user-online", handleChatUserOnline);
      socket.off("chat:user-offline", handleChatUserOffline);
      socket.off("user:online", handleChatUserOnline);
      socket.off("user:offline", handleChatUserOffline);
      socket.off("chat:unread-update", handleUnread);
      socket.off("connect", refreshOnlineUsers);
      socket.off("disconnect", handleDisconnect);
      socket.io?.off("reconnect", refreshOnlineUsers);
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    socket,
    selectedUser?._id,
    selectedUser?.id,
    selectedUser?.conversation?._id,
    isSocketConnected,
  ]);

  useEffect(() => {
    if (!selectedUser) return;

    const selectedUserId = (selectedUser._id || selectedUser.id || "").toString();
    const conversationId = selectedUser.conversation?._id?.toString();

    setUnreadCounts(prev => ({
      ...prev,
      ...(selectedUserId ? {[selectedUserId]: 0} : {}),
      ...(conversationId ? {[conversationId]: 0} : {}),
    }));
  }, [selectedUser]);

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
        onlineUsers={onlineUsers}
        onConversationChange={fetchConversations}
      />
    </div>
  );
};

export default ChatPage;
