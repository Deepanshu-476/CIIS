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
    message.file && (

        message.fileType
        ?.startsWith("image")

        ? (

            <img
                src={
                    `http://localhost:3000${message.file}`
                }
                alt=""
                style={{
                    width: "200px",
                    borderRadius: "10px",
                    marginTop: "8px"
                }}
            />
        )

        : (

            <video
                controls
                style={{
                    width: "220px",
                    borderRadius: "10px",
                    marginTop: "8px"
                }}
            >
                <source
                    src={
                        `http://localhost:3000${message.file}`
                    }
                />
            </video>
        )
    )
}

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