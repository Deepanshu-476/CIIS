import React, { useMemo, useState } from "react";
import { Edit, Lock, MoreVertical, Search, SlidersHorizontal, Users } from "lucide-react";
import { API_URL_IMG } from "../config";

const ChatSidebar = ({
    groups,
    users,
    onlineUsers,
    unreadCounts,
    selectedUser,
    setSelectedUser,
    currentUserId,
    companyUsers = [],
    className = ""
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [newChatUserId, setNewChatUserId] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);

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

    const getItemId = item => (
        item?._id ||
        item?.id ||
        item?.userId ||
        item?.user?._id ||
        item?.user?.id || 
        ""
    ).toString();

    const getMemberId = member => {
        if (!member) return "";
        if (typeof member === "object") {
            return (member._id || member.id || member.userId || member.user?._id || member.user?.id || "").toString();
        }

        return member.toString();
    };

    const isIdOnline = id => {
        const value = (id || "").toString();
        return Boolean(value && onlineUsers.some(userId => userId?.toString() === value));
    };

    const isUserOnline = user => {
        const userId = getItemId(user);
        return Boolean(user?.isOnline) || isIdOnline(userId);
    };

    const getLastMessageTime = item => {
        const dateValue = item?.lastMessage?.createdAt || item?.conversation?.updatedAt || item?.updatedAt;
        if (!dateValue) return "";

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "";

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString([], { month: "short", day: "numeric" });
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

    const getGroupOnlineCount = (group) => {
        const members = group?.members || group?.users || group?.memberIds || group?.membersIds;
        if (!Array.isArray(members)) return 0;

        return members.filter(member => {
            const memberId = getMemberId(member);
            return memberId && memberId !== currentUserId && isIdOnline(memberId);
        }).length;
    };

    const getBadgeCount = (item) => {
        const conversationId = item?.conversation?._id?.toString();
        const itemId = (item?._id || item?.id || "").toString();

        if (conversationId && Object.prototype.hasOwnProperty.call(unreadCounts, conversationId)) {
            return Number(unreadCounts[conversationId]) || 0;
        }

        if (itemId && Object.prototype.hasOwnProperty.call(unreadCounts, itemId)) {
            return Number(unreadCounts[itemId]) || 0;
        }

        return Number(item?.unreadCount) || 0;
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

    const sortedCompanyUsers = useMemo(() => (
        [...companyUsers].sort((first, second) => (
            String(first?.name || "").localeCompare(String(second?.name || ""))
        ))
    ), [companyUsers]);

    const startNewChat = () => {
        const user = sortedCompanyUsers.find(item => getItemId(item) === newChatUserId);
        if (!user) return;
        setSelectedUser(user);
    };

    return (
        <aside className={`chat-sidebar ${className}`.trim()}>
            <section className="chat-sidebar-card conversations-card">
                <div className="sidebar-top">
                    <div className="sidebar-title">Chats</div>
                    <div className="sidebar-actions">
                        <button className="sidebar-icon" title="New chat" type="button" onClick={() => setShowNewChat(prev => !prev)}>
                            <Edit size={18} />
                        </button>
                        <button className="sidebar-icon" title="Filter conversations" type="button">
                            <SlidersHorizontal size={18} />
                        </button>
                        <button className="sidebar-icon" title="More" type="button">
                            <MoreVertical size={18} />
                        </button>
                    </div>
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
                <div className="chat-filter-tabs">
                    <button type="button" className="active">All</button>
                    <button type="button">Unread</button>
                    <button type="button">Groups</button>
                    <button type="button">Favourites</button>
                </div>

                <div className="chat-sidebar-list">
                    {filteredUsers.map((user, index) => (
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
                                    <span className="chat-user-time">{getLastMessageTime(user) || (index === 0 ? "10:30 AM" : "May 10")}</span>

                                    {getBadgeCount(user) > 0 && (
                                        <div className="chat-user-badge">
                                            {getBadgeCount(user)}
                                        </div>
                                    )}
                                </div>

                                <div className="chat-user-department">
                                    {user.companyRole || "Account Manager"}
                                </div>
                                <div className="chat-user-role">
                                    <span className={
                                        isUserOnline(user)
                                            ? "status-dot"
                                            : "status-dot offline"
                                    } />
                                    <span className="role-text">
                                        {isUserOnline(user) ? "Online" : "Offline"} - {getLastMessageText(user)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredGroups.map((group, index) => (
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
                                    <span className="chat-user-time">{getLastMessageTime(group) || (index === 0 ? "09:15 AM" : "May 12")}</span>
                                    {getBadgeCount(group) > 0 && (
                                        <div className="chat-user-badge">
                                            {getBadgeCount(group)}
                                        </div>
                                    )}
                                </div>
                                <div className="chat-user-department">
                                    {group.department || "SEO Department"}
                                </div>
                                <div className="chat-user-role">
                                    <span className={getGroupOnlineCount(group) > 0 ? "status-dot" : "status-dot offline"} />
                                    <span className="chat-last-message">
                                        {getGroupOnlineCount(group) > 0
                                            ? `${getGroupOnlineCount(group)} online`
                                            : "Offline"}
                                        {" - "}
                                        {getLastMessageText(group)}
                                    </span>
                                    {getGroupMemberCount(group) > 0 && (
                                        <span className="chat-member-count">{getGroupMemberCount(group)} members</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredGroups.length === 0 && filteredUsers.length === 0 && (
                        <div className="chat-sidebar-empty">No conversations found</div>
                    )}
                </div>

                <div className="chat-encryption-note">
                    <Lock size={13} />
                    <span>Your personal messages are <strong>end-to-end encrypted</strong></span>
                </div>
            </section>

            <section className={showNewChat ? "chat-sidebar-card start-chat-card open" : "chat-sidebar-card start-chat-card"}>
                <h3>Start a New Chat</h3>
                <p>Select a company user to start conversation</p>
                <select
                    value={newChatUserId}
                    onChange={event => setNewChatUserId(event.target.value)}
                >
                    <option value="">Select User</option>
                    {sortedCompanyUsers.map(user => (
                        <option key={getItemId(user)} value={getItemId(user)}>
                            {user.name || user.email || "Unnamed User"}
                            {user.department?.name ? ` - ${user.department.name}` : ""}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={startNewChat}
                    disabled={!newChatUserId}
                >
                    Start Chat
                </button>
            </section>

        </aside>
    );
};

export default ChatSidebar;
