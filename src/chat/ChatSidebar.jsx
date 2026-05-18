import React from "react";

const ChatSidebar = ({
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