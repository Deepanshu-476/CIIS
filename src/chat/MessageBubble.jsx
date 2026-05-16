import React from "react";

const MessageBubble = ({
    message,
    currentUser
}) => {

    const isOwn =
        message.sender._id === currentUser._id;

    return (

    <div
        className={
            isOwn
            ? "message-row own"
            : "message-row other"
        }
    >

        <div className="message-bubble">

            {message.text}

            {
    message.sender?._id ===
    currentUser?._id && (

        <div
            style={{
                fontSize: "11px",
                marginTop: "4px",
                textAlign: "right",
                color:
                    message.seen
                    ? "#22c55e"
                    : "#999"
            }}
        >
            {
                message.seen
                ? "✔✔ Seen"
                : "✔ Sent"
            }
        </div>
    )
}

        </div>

    </div>
);
};

export default MessageBubble;