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

        </div>

    </div>
);
};

export default MessageBubble;