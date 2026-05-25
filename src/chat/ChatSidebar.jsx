import React, { useMemo, useState } from "react";
import { MessageSquarePlus, Search, Users } from "lucide-react";
import { API_URL_IMG } from "../config";

const ChatSidebar = ({
    groups,
    users,
    onlineUsers,
    unreadCounts,
    selectedUser,
    setSelectedUser
}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const getAvatarSrc = (avatar) => {
        if (!avatar) return null;
        return avatar.startsWith("http")
            ? avatar
            : `${API_URL_IMG.replace(/\/$/, "")}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
    };

    const getLastMessageText = item => {
        const message = item?.lastMessage;
        if (!message) return item?.isGroup ? "Group chat" : (item?.companyRole || "Direct message");
        if (message.deletedForEveryone) return "This message was deleted";
        if (message.text) return message.text;
        if (message.file) return "Attachment";
        return "New message";
    };

    const getGroupName = (group) => {
        if (!group) return "";
        return group.name || group.groupName || group.group_name || group.title || "Unnamed Group";
    };

    const getGroupMemberCount = (group) => {
        if (!group) return 0;
        const members = group.members || group.users || group.memberIds || group.membersIds;
        if (Array.isArray(members)) return members.length;
        return group.memberCount || group.count || 0;
    };

    
    const filteredGroups = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return groups || [];
        return (groups || []).filter(group => [
            getGroupName(group),
            getLastMessageText(group),
        ].some(value => String(value || "").toLowerCase().includes(query)));
    }, [groups, searchTerm]);

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return users || [];
        return (users || []).filter(user => [
            user.name,
            user.email,
            user.companyRole,
            getLastMessageText(user),
        ].some(value => String(value || "").toLowerCase().includes(query)));
    }, [users, searchTerm]);

    return (
        <div className="chat-sidebar">

            <div className="sidebar-top">
                <div>
                    <div className="sidebar-title">Chats</div>
                    <div className="sidebar-subtitle">{(groups?.length || 0) + (users?.length || 0)} conversations</div>
                </div>
                <button className="sidebar-icon" title="New chat" type="button">
                    <MessageSquarePlus size={19} />
                </button>
            </div>

            <div className="chat-search-wrap">
                <Search className="chat-search-icon" size={17} />
                <input
                    type="text"
                    className="chat-search"
                    placeholder="Search or start new chat"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                />
            </div>

            <div className="chat-sidebar-section">
                <div className="sidebar-section-title">Groups</div>
                {filteredGroups?.length === 0 ? (
                    <div className="chat-sidebar-empty">No groups yet</div>
                ) : (
                    filteredGroups.map((group) => (
                        <div
                            key={group._id || group.id}
                            className={
                                selectedUser?._id === (group._id || group.id)
                                    ? "chat-user active"
                                    : "chat-user"
                            }
                            onClick={() =>
                                setSelectedUser({ ...group, isGroup: true })
                            }
                        >
                            <div className="chat-user-avatar">
                                <Users size={20} />
                            </div>

                            <div className="chat-user-body">
                                <div className="chat-user-row">
                                    <div className="chat-user-name">
                                        {getGroupName(group)}
                                    </div>
                                    {
                                        group.unreadCount > 0 && (
                                            <div className="chat-user-badge">
                                                {group.unreadCount}
                                            </div>
                                        )
                                    }
                                </div>
                                <div className="chat-user-role">
                                    <span className="status-dot group" />
                                    <span className="chat-last-message">{getLastMessageText(group)}</span>
                                    {getGroupMemberCount(group) > 0 && (
                                        <span className="chat-member-count">{getGroupMemberCount(group)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-sidebar-list">
                {
                    filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            className={
                                selectedUser?._id === user._id
                                    ? "chat-user active"
                                    : "chat-user"
                            }
                            onClick={() =>
                                setSelectedUser(user)
                            }
                        >
                            <div className="chat-user-avatar">
                                {
                                    getAvatarSrc(user.avatar || user.profileImage || user.image)
                                        ? (
                                            <img
                                                src={getAvatarSrc(user.avatar || user.profileImage || user.image)}
                                                alt={user.name}
                                            />
                                        )
                                        : user.name?.charAt(0).toUpperCase()
                                }
                            </div>

                            <div className="chat-user-body">
                                <div className="chat-user-row">
                                    <div className="chat-user-name">
                                        {user.name}
                                    </div>

                                    {
                                        (user.unreadCount || unreadCounts[user._id]) > 0 && (
                                            <div className="chat-user-badge">
                                                {user.unreadCount || unreadCounts[user._id]}
                                            </div>
                                        )
                                    }
                                </div>

                                <div className="chat-user-role">
                                    <span className={
                                        onlineUsers.includes(user._id.toString())
                                            ? "status-dot"
                                            : "status-dot offline"
                                    } />
                                    {
                                        onlineUsers.includes(user._id.toString())
                                            ? "Online"
                                            : "Offline"
                                    }
                                    <span className="role-text">
                                        {getLastMessageText(user)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default ChatSidebar;
