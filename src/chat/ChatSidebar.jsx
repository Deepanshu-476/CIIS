import React from "react";

const ChatSidebar = ({
    users,
    onlineUsers,
    selectedUser,
    setSelectedUser
}) => {

    return (
    <div className="chat-sidebar">

        <div className="chat-sidebar-header">
            Company Users
        </div>

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

                    <div className="chat-user-name">
                        {user.name}
                    </div>

                    <div className="chat-user-role">
                        {
    onlineUsers.includes(
    user._id.toString()
    )

    ? (

        <div
            style={{
                color: "green",
                fontSize: "12px",
                marginTop: "4px"
            }}
        >
            ● Online
        </div>

    )

    : (

        <div
            style={{
                color: "gray",
                fontSize: "12px",
                marginTop: "4px"
            }}
        >
            ● Offline
        </div>
    )
}
                        {user.companyRole}
                    </div>

                </div>
            ))
        }

    </div>
);
};

export default ChatSidebar;