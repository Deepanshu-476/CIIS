import React, { useMemo, useState } from "react";

const MessageBubble = ({
    message,
    currentUser,
    users,
    onDeleteForMe,
    onDeleteForEveryone,
    onForward
}) => {

    const [showMenu, setShowMenu] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [selectedTargets, setSelectedTargets] = useState([]);

    const isOwn =
        message.sender._id === currentUser._id;

    const isDeletedForEveryone = Boolean(message.deletedForEveryone);
    const mediaType = message.mediaType || message.type;
    const mediaUrl = message.mediaUrl || message.fileUrl || message.attachmentUrl;

    const forwardCandidates = useMemo(() => (
        users.filter((user) => user._id !== currentUser?._id)
    ), [users, currentUser?._id]);

    const toggleTarget = (userId) => {
        setSelectedTargets((prev) => (
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        ));
    };

    const handleForward = () => {
        if (!selectedTargets.length) return;
        onForward(message, selectedTargets);
        setShowForwardModal(false);
        setSelectedTargets([]);
    };

    const renderMedia = () => {
        if (!mediaUrl) return null;

        if (mediaType === "image") {
            return <img src={mediaUrl} alt="attachment" className="chat-media chat-media-image" />;
        }

        if (mediaType === "video") {
            return <video src={mediaUrl} controls className="chat-media chat-media-video" />;
        }

        const labelMap = {
            pdf: "📄 PDF",
            document: "📝 Document",
            file: "📎 File"
        };

        return (
            <a className="chat-media-file" href={mediaUrl} target="_blank" rel="noreferrer">
                {labelMap[mediaType] || "📎 File"}
            </a>
        );
    };

    return (

    <div
        className={
            isOwn
            ? "message-row own"
            : "message-row other"
        }
    >

        <div className="message-bubble">

            <div className="message-top-row">
                <span className="message-sender">{message.sender?.name || "Unknown"}</span>
                <span className="message-time">{new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <button className="message-menu-btn" onClick={() => setShowMenu((prev) => !prev)}>⋮</button>
            </div>

            {message.isForwarded && <div className="forwarded-label">Forwarded</div>}

            {isDeletedForEveryone ? (
                <div className="deleted-text">This message was deleted</div>
            ) : (
                <>
                    {message.text}
                    {renderMedia()}
                </>
            )}

            {showMenu && !isDeletedForEveryone && (
                <div className="message-menu">
                    <button onClick={() => { onDeleteForMe(message); setShowMenu(false); }}>Delete For Me</button>
                    {isOwn && <button onClick={() => { onDeleteForEveryone(message); setShowMenu(false); }}>Delete For Everyone</button>}
                    <button onClick={() => { setShowForwardModal(true); setShowMenu(false); }}>Forward</button>
                </div>
            )}

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

        {showForwardModal && (
            <div className="forward-modal-overlay" onClick={() => setShowForwardModal(false)}>
                <div className="forward-modal" onClick={(e) => e.stopPropagation()}>
                    <h4>Select users to forward</h4>
                    <div className="forward-user-list">
                        {forwardCandidates.map((user) => (
                            <label key={user._id} className="forward-user-item">
                                <input
                                    type="checkbox"
                                    checked={selectedTargets.includes(user._id)}
                                    onChange={() => toggleTarget(user._id)}
                                />
                                {user.name}
                            </label>
                        ))}
                    </div>
                    <button className="forward-confirm-btn" onClick={handleForward}>Forward</button>
                </div>
            </div>
        )}

        </div>

    </div>
);
};

export default MessageBubble;
