import React from "react";

const ChatSidebar = ({
    users,
    onlineUsers,
    unreadCounts,
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

                    <div
    style={{
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center"
    }}
>

    <div className="chat-user-name">
        {user.name}
    </div>

    {
        unreadCounts[user._id] > 0 && (

            <div
                style={{
                    minWidth: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    color: "#fff",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        "center",
                    fontWeight: "600"
                }}
            >
                {
                    unreadCounts[user._id]
                }
            </div>
        )
    }

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