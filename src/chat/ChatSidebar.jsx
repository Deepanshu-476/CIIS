import React from "react";

const ChatSidebar = ({
    groups,
    users,
    onlineUsers,
    unreadCounts,
    selectedUser,
    setSelectedUser
}) => {

    const getAvatarSrc = (avatar) => {
        if (!avatar) return null;
        return avatar.startsWith("http")
            ? avatar
            : `http://localhost:3000${avatar}`;
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

    return (
        <div className="chat-sidebar">

            <div className="sidebar-top">
                <div className="sidebar-title">Chats</div>
                <button className="sidebar-icon">+</button>
            </div>

            <div className="chat-search-wrap">
                <input
                    type="text"
                    className="chat-search"
                    placeholder="Search or start new chat"
                />
            </div>

            <div className="chat-sidebar-section">
                <div className="sidebar-section-title">Groups</div>
                {groups?.length === 0 ? (
                    <div className="chat-sidebar-empty">No groups yet</div>
                ) : (
                    groups.map((group) => (
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
                                <span>👥</span>
                            </div>

                            <div className="chat-user-body">
                                <div className="chat-user-row">
                                    <div className="chat-user-name">
                                        {getGroupName(group)}
                                    </div>
                                </div>
                                <div className="chat-user-role">
                                    <span className="status-dot group" />
                                    {getGroupMemberCount(group)} member{getGroupMemberCount(group) === 1 ? '' : 's'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-sidebar-list">
                {
                    users.map((user) => (
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
                                        unreadCounts[user._id] > 0 && (
                                            <div className="chat-user-badge">
                                                {unreadCounts[user._id]}
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
                                        {user.companyRole}
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