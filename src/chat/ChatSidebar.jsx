import React, { useMemo, useState } from "react";
import { Calendar, ClipboardList, Headphones, Search, SlidersHorizontal, Upload, Users } from "lucide-react";
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

    const quickActions = [
        { label: "Raise Ticket", icon: Headphones },
        { label: "Book Meeting", icon: Calendar },
        { label: "Upload File", icon: Upload },
        { label: "Request Update", icon: ClipboardList },
    ];

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

    return (
        <aside className="chat-sidebar">
            <section className="chat-sidebar-card conversations-card">
                <div className="sidebar-top">
                    <div className="sidebar-title">Conversations</div>
                    <button className="sidebar-icon" title="Filter conversations" type="button">
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                <div className="chat-search-wrap">
                    <Search className="chat-search-icon" size={17} />
                    <input
                        type="text"
                        className="chat-search"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                    />
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
                                        onlineUsers.includes(user._id.toString())
                                            ? "status-dot"
                                            : "status-dot offline"
                                    } />
                                    <span className="role-text">
                                        {getLastMessageText(user)}
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
                                    <span className="chat-last-message">{getLastMessageText(group)}</span>
                                    {getGroupMemberCount(group) > 0 && (
                                        <span className="chat-member-count">{getGroupMemberCount(group)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredGroups.length === 0 && filteredUsers.length === 0 && (
                        <div className="chat-sidebar-empty">No conversations found</div>
                    )}
                </div>

                <button className="view-conversations-btn" type="button">View All Conversations</button>
            </section>

            <section className="chat-sidebar-card start-chat-card">
                <h3>Start a New Chat</h3>
                <p>Select a topic to start conversation</p>
                <select defaultValue="">
                    <option value="" disabled>Select Topic</option>
                    <option>SEO Project</option>
                    <option>Support</option>
                    <option>Billing</option>
                </select>
                <button type="button">Start Chat</button>
            </section>

            <section className="chat-sidebar-card quick-actions-card">
                <h3>Quick Actions</h3>
                <div className="quick-actions-grid">
                    {quickActions.map(({ label, icon: Icon }) => (
                        <button type="button" key={label} title={label}>
                            <Icon size={18} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </section>
        </aside>
    );
};

export default ChatSidebar;
