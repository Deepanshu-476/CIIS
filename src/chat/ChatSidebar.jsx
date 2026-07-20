import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BellOff, Check, Edit, Lock, MoreVertical, Search, SlidersHorizontal, Users, X } from "lucide-react";
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
    onCreateGroup,
    className = ""
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [newChatUserId, setNewChatUserId] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupStep, setGroupStep] = useState("members");
    const [groupSearch, setGroupSearch] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState([]);
    const [groupError, setGroupError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

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
        if (message.messageType === "system" && message.systemEvent?.type === "disappearing_messages_changed") {
            const actorId = message.systemEvent.actor?._id || message.systemEvent.actor || message.sender?._id || message.sender;
            const actor = String(actorId || "") === String(currentUserId || "")
                ? "You"
                : message.systemEvent.actor?.name || message.sender?.name || "A participant";
            const mode = message.systemEvent.mode;
            if (mode === "off") return `${actor} turned off disappearing messages`;
            const duration = mode === "24h" ? "24 hours" : mode === "7d" ? "7 days" : "90 days";
            return `${actor} enabled disappearing messages · ${duration}`;
        }
        if (message.text) {
            const rawText = String(message.text);
            const disappearingNoticeMatch = rawText.match(/^\[\[ciis-system-disappearing:([^\]]+)\]\]$/);
            if (disappearingNoticeMatch) {
                try {
                    const notice = JSON.parse(decodeURIComponent(disappearingNoticeMatch[1]));
                    const actor = String(notice.actorId || "") === String(currentUserId || "")
                        ? "You"
                        : notice.actorName || "A participant";
                    if (notice.mode === "off") return `${actor} turned off disappearing messages`;
                    const duration = notice.mode === "24h" ? "24 hours" : notice.mode === "7d" ? "7 days" : "90 days";
                    return `${actor} enabled disappearing messages · ${duration}`;
                } catch {
                    return "Disappearing messages updated";
                }
            }

            const visibleText = rawText
                .replace(/^\[\[ciis-reply:[^\]]+\]\]/, "")
                .replace(/\[\[ciis-expire:\d+\]\]/g, "")
                .trim();
            if (visibleText) return visibleText;
        }
        if (message.file || message.mediaUrl || message.fileUrl || message.attachmentUrl) return "Attachment";
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

    const isConversationMuted = item => Boolean(
        item?.notificationPreference?.muted
        || item?.conversation?.notificationPreference?.muted
    );

    const hasStartedConversation = item => Boolean(
        item?.lastMessage ||
        item?.conversation?.lastMessage
    );

    const filteredGroups = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return (groups || []).filter(group => {
            if (!hasStartedConversation(group)) return false;
            if (activeFilter === "unread" && getBadgeCount(group) <= 0) return false;
            if (activeFilter === "favourites" && !(group.isFavourite || group.isFavorite || group.favorite)) return false;
            return ["groups", "all", "unread", "favourites"].includes(activeFilter) && [
                getGroupName(group),
                getLastMessageText(group),
            ].some(value => !query || String(value || "").toLowerCase().includes(query));
        });
    }, [groups, searchTerm, activeFilter, unreadCounts]);

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return (users || []).filter(user => {
            if (!hasStartedConversation(user)) return false;
            if (activeFilter === "groups") return false;
            if (activeFilter === "unread" && getBadgeCount(user) <= 0) return false;
            if (activeFilter === "favourites" && !(user.isFavourite || user.isFavorite || user.favorite)) return false;
            return [
                user.name,
                user.email,
                user.companyRole,
                getLastMessageText(user),
            ].some(value => !query || String(value || "").toLowerCase().includes(query));
        });
    }, [users, searchTerm, activeFilter, unreadCounts]);

    const sortedCompanyUsers = useMemo(() => (
        [...companyUsers].sort((first, second) => (
            String(first?.name || "").localeCompare(String(second?.name || ""))
        ))
    ), [companyUsers]);

    const selectableCompanyUsers = useMemo(() => (
        sortedCompanyUsers.filter(user => getItemId(user) !== currentUserId)
    ), [sortedCompanyUsers, currentUserId]);

    const filteredNewChatUsers = useMemo(() => {
        const query = newChatUserId.trim().toLowerCase();
        return selectableCompanyUsers.filter(user => [
            user.name,
            user.email,
            user.phone,
            getItemId(user),
        ].some(value => !query || String(value || "").toLowerCase().includes(query)));
    }, [selectableCompanyUsers, newChatUserId]);

    const filteredGroupUsers = useMemo(() => {
        const query = groupSearch.trim().toLowerCase();
        return selectableCompanyUsers.filter(user => [
            user.name,
            user.email,
            user.phone,
            getItemId(user),
        ].some(value => !query || String(value || "").toLowerCase().includes(query)));
    }, [selectableCompanyUsers, groupSearch]);

    const selectedGroupUsers = useMemo(() => (
        selectableCompanyUsers.filter(user => selectedGroupMemberIds.includes(getItemId(user)))
    ), [selectableCompanyUsers, selectedGroupMemberIds]);

    const conversationStats = useMemo(() => {
        const startedUsers = (users || []).filter(hasStartedConversation);
        const startedGroups = (groups || []).filter(hasStartedConversation);
        const allItems = [...startedUsers, ...startedGroups];

        return {
            all: allItems.length,
            unread: allItems.filter(item => getBadgeCount(item) > 0).length,
            groups: startedGroups.length,
            favourites: allItems.filter(item => item.isFavourite || item.isFavorite || item.favorite).length,
        };
    }, [users, groups, unreadCounts]);

    const toggleGroupMember = user => {
        const userId = getItemId(user);
        if (!userId) return;
        setSelectedGroupMemberIds(prev => (
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        ));
    };

    const closeGroupPanel = () => {
        setShowCreateGroup(false);
        setGroupStep("members");
        setGroupSearch("");
        setGroupName("");
        setSelectedGroupMemberIds([]);
        setGroupError("");
    };

    const openNewChatPanel = () => {
        closeGroupPanel();
        setShowNewChat(true);
    };

    useEffect(() => {
        const handleOpenNewChat = () => openNewChatPanel();
        window.addEventListener("chat:open-new-chat", handleOpenNewChat);
        return () => window.removeEventListener("chat:open-new-chat", handleOpenNewChat);
    }, []);

    const closeNewChatPanel = () => {
        setShowNewChat(false);
        setNewChatUserId("");
    };

    const openGroupPanel = () => {
        closeNewChatPanel();
        setShowCreateGroup(true);
    };

    const startNewChat = user => {
        const typedId = newChatUserId.trim();
        const selectedChatUser = user || selectableCompanyUsers.find(item => getItemId(item) === typedId);
        if (!selectedChatUser && !typedId) return;

        setSelectedUser(selectedChatUser || { _id: typedId, name: typedId });
        closeNewChatPanel();
    };

    const createGroup = async () => {
        const name = groupName.trim();
        const members = selectedGroupMemberIds;

        if (!name) {
            setGroupError("Group name required");
            return;
        }

        if (members.length === 0) {
            setGroupError("Add at least one user ID");
            return;
        }

        try {
            setGroupError("");
            await onCreateGroup?.({ name, members });
            closeGroupPanel();
        } catch (error) {
            setGroupError(error?.response?.data?.error || error?.response?.data?.message || "Group create failed");
        }
    };

    return (
        <aside className={`chat-sidebar ${showCreateGroup || showNewChat ? "group-panel-open" : ""} ${className}`.trim()}>
            <section className="chat-sidebar-card conversations-card">
                <div className="sidebar-top">
                    <div>
                        <div className="sidebar-title">Chats</div>
                        <div className="sidebar-subtitle">{conversationStats.all} conversations</div>
                    </div>
                    <div className="sidebar-actions">
                        <button className="sidebar-icon" title="New chat" type="button" onClick={openNewChatPanel}>
                            <Edit size={18} />
                        </button>
                        <button className="sidebar-icon" title="Create group" type="button" onClick={openGroupPanel}>
                            <Users size={18} />
                        </button>
                        <button className="sidebar-icon" title="Show unread" type="button" onClick={() => setActiveFilter(prev => prev === "unread" ? "all" : "unread")}>
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
                        placeholder="Search conversations"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                    />
                </div>
                <div className="chat-filter-tabs">
                    <button type="button" className={activeFilter === "all" ? "active" : ""} onClick={() => setActiveFilter("all")}>All <span>{conversationStats.all}</span></button>
                    <button type="button" className={activeFilter === "unread" ? "active" : ""} onClick={() => setActiveFilter("unread")}>Unread <span>{conversationStats.unread}</span></button>
                    <button type="button" className={activeFilter === "groups" ? "active" : ""} onClick={() => setActiveFilter("groups")}>Groups <span>{conversationStats.groups}</span></button>
                    <button type="button" className={activeFilter === "favourites" ? "active" : ""} onClick={() => setActiveFilter("favourites")}>Favourites <span>{conversationStats.favourites}</span></button>
                </div>

                <div className="chat-list-heading">
                    <span>Recent</span>
                    <SlidersHorizontal size={14} />
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
                            onClick={() => setSelectedUser(user)}
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
                                    <span className="chat-user-time">{getLastMessageTime(user)}</span>
                                    {isConversationMuted(user) && (
                                        <span className="chat-user-muted" title="Notifications muted" aria-label="Notifications muted">
                                            <BellOff size={13} />
                                        </span>
                                    )}

                                    {getBadgeCount(user) > 0 && (
                                        <div className="chat-user-badge">
                                            {getBadgeCount(user)}
                                        </div>
                                    )}
                                </div>

                                <div className="chat-user-department">
                                    {user.companyRole || user.department || ""}
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
                            onClick={() => setSelectedUser({ ...group, isGroup: true })}
                        >
                            <div className="chat-user-avatar">
                                <Users size={20} />
                            </div>

                            <div className="chat-user-body">
                                <div className="chat-user-row">
                                    <div className="chat-user-name">
                                        {getGroupName(group)}
                                    </div>
                                    <span className="chat-user-time">{getLastMessageTime(group)}</span>
                                    {isConversationMuted(group) && (
                                        <span className="chat-user-muted" title="Notifications muted" aria-label="Notifications muted">
                                            <BellOff size={13} />
                                        </span>
                                    )}
                                    {getBadgeCount(group) > 0 && (
                                        <div className="chat-user-badge">
                                            {getBadgeCount(group)}
                                        </div>
                                    )}
                                </div>
                                <div className="chat-user-department">
                                    {group.department || ""}
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

            {showNewChat && (
                <section className="chat-group-slide-panel chat-new-slide-panel">
                    <div className="chat-group-slide-head">
                        <button type="button" onClick={closeNewChatPanel} title="Back">
                            <X size={20} />
                        </button>
                        <div>
                            <strong>New chat</strong>
                            <small>Select contact or paste user ID</small>
                        </div>
                    </div>

                    <div className="chat-group-search">
                        <Search size={17} />
                        <input
                            value={newChatUserId}
                            onChange={event => setNewChatUserId(event.target.value)}
                            placeholder="Search name or user ID"
                            autoFocus
                        />
                    </div>

                    <div className="chat-group-user-list">
                        {filteredNewChatUsers.map(user => {
                            const userId = getItemId(user);
                            return (
                                <button
                                    type="button"
                                    key={userId}
                                    className="chat-group-user"
                                    onClick={() => startNewChat(user)}
                                >
                                    <span className="chat-user-avatar">
                                        {getAvatarSrc(user.avatar || user.profileImage || user.image)
                                            ? <img src={getAvatarSrc(user.avatar || user.profileImage || user.image)} alt={user.name} />
                                            : user.name?.charAt(0).toUpperCase() || "U"}
                                    </span>
                                    <span>
                                        <strong>{user.name || user.email || userId}</strong>
                                        <small>{user.companyRole || user.email || userId}</small>
                                    </span>
                                </button>
                            );
                        })}

                        {filteredNewChatUsers.length === 0 && (
                            <div className="chat-sidebar-empty">No user found</div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="chat-group-next"
                        onClick={() => startNewChat()}
                        disabled={!newChatUserId.trim()}
                    >
                        Start
                    </button>
                </section>
            )}

            {showCreateGroup && (
                <section className="chat-group-slide-panel">
                    <div className="chat-group-slide-head">
                        <button type="button" onClick={groupStep === "details" ? () => setGroupStep("members") : closeGroupPanel} title="Back">
                            {groupStep === "details" ? <ArrowLeft size={20} /> : <X size={20} />}
                        </button>
                        <div>
                            <strong>{groupStep === "details" ? "New group" : "Add group members"}</strong>
                            <small>{selectedGroupMemberIds.length ? `${selectedGroupMemberIds.length} selected` : "Select contacts"}</small>
                        </div>
                    </div>

                    {groupStep === "members" ? (
                        <>
                            <div className="chat-group-search">
                                <Search size={17} />
                                <input
                                    value={groupSearch}
                                    onChange={event => setGroupSearch(event.target.value)}
                                    placeholder="Search name or user ID"
                                />
                            </div>

                            {selectedGroupUsers.length > 0 && (
                                <div className="chat-selected-members">
                                    {selectedGroupUsers.map(user => (
                                        <button type="button" key={getItemId(user)} onClick={() => toggleGroupMember(user)}>
                                            <span>{user.name?.charAt(0).toUpperCase() || "U"}</span>
                                            {user.name || user.email || getItemId(user)}
                                            <X size={12} />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="chat-group-user-list">
                                {filteredGroupUsers.map(user => {
                                    const userId = getItemId(user);
                                    const isSelected = selectedGroupMemberIds.includes(userId);
                                    return (
                                        <button
                                            type="button"
                                            key={userId}
                                            className={isSelected ? "chat-group-user selected" : "chat-group-user"}
                                            onClick={() => toggleGroupMember(user)}
                                        >
                                            <span className="chat-user-avatar">
                                                {getAvatarSrc(user.avatar || user.profileImage || user.image)
                                                    ? <img src={getAvatarSrc(user.avatar || user.profileImage || user.image)} alt={user.name} />
                                                    : user.name?.charAt(0).toUpperCase() || "U"}
                                            </span>
                                            <span>
                                                <strong>{user.name || user.email || userId}</strong>
                                                <small>{user.companyRole || user.email || userId}</small>
                                            </span>
                                            {isSelected && <span className="chat-group-check"><Check size={14} /></span>}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                className="chat-group-next"
                                onClick={() => setGroupStep("details")}
                                disabled={selectedGroupMemberIds.length === 0}
                            >
                                Next
                            </button>
                        </>
                    ) : (
                        <div className="chat-group-details">
                            <div className="chat-group-avatar-preview">
                                <Users size={30} />
                            </div>
                            <input
                                type="text"
                                value={groupName}
                                onChange={event => setGroupName(event.target.value)}
                                placeholder="Group name"
                                autoFocus
                            />
                            <small>{selectedGroupMemberIds.length} members selected</small>
                            {groupError && <small className="chat-form-error">{groupError}</small>}
                            <button
                                type="button"
                                onClick={createGroup}
                                disabled={!groupName.trim() || selectedGroupMemberIds.length === 0}
                            >
                                Create Group
                            </button>
                        </div>
                    )}
                </section>
            )}

        </aside>
    );
};

export default ChatSidebar;
