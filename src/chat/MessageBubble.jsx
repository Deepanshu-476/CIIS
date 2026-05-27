import React, { useMemo, useState } from "react";
import { Check, CheckCheck, FileText, Forward, MoreVertical, Trash2 } from "lucide-react";
import { API_URL_IMG } from "../config";

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

    const currentUserId = (currentUser?._id || currentUser?.id || "").toString();
    const senderId = (message.sender?._id || message.sender || "").toString();
    const isOwn = senderId === currentUserId;

    const isDeletedForEveryone = Boolean(message.deletedForEveryone);
    const mediaType = message.mediaType || message.type || message.fileType;
    const rawMediaUrl = message.mediaUrl || message.fileUrl || message.attachmentUrl || message.file;
    const mediaUrl = rawMediaUrl
        ? rawMediaUrl.startsWith("http")
            ? rawMediaUrl
            : `${API_URL_IMG.replace(/\/$/, "")}${rawMediaUrl.startsWith("/") ? rawMediaUrl : `/${rawMediaUrl}`}`
        : "";

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

        if (mediaType?.startsWith("image")) {
            return <img src={mediaUrl} alt="attachment" className="chat-media chat-media-image" />;
        }

        if (mediaType?.startsWith("video")) {
            return <video src={mediaUrl} controls className="chat-media chat-media-video" />;
        }

        const labelMap = {
            pdf: "PDF",
            document: "Document",
            file: "File"
        };

        return (
            <a className="chat-media-file" href={mediaUrl} target="_blank" rel="noreferrer">
                <FileText size={16} />
                {labelMap[mediaType] || "File"}
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
                <button className="message-menu-btn" onClick={() => setShowMenu((prev) => !prev)} title="Message options">
                    <MoreVertical size={16} />
                </button>
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
                    <button onClick={() => { onDeleteForMe(message); setShowMenu(false); }}><Trash2 size={13} />Delete For Me</button>
                    {isOwn && <button onClick={() => { onDeleteForEveryone(message); setShowMenu(false); }}><Trash2 size={13} />Delete For Everyone</button>}
                    <button onClick={() => { setShowForwardModal(true); setShowMenu(false); }}><Forward size={13} />Forward</button>
                </div>
            )}

            {
    isOwn && (

        <div
            className={message.seen ? "message-status seen" : "message-status"}
        >
            {
                message.seen
                ? <><CheckCheck size={13} /> Seen</>
                : <><Check size={13} /> Sent</>
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
