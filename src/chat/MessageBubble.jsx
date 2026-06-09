import React, { useEffect, useMemo, useState } from "react";
import { Check, CheckCheck, FileText, Forward, MoreVertical, Trash2, X } from "lucide-react";
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
    const [previewMedia, setPreviewMedia] = useState(null);

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
    const normalizedMediaType = (mediaType || "").toLowerCase();
    const mediaPath = (mediaUrl || "").split("?")[0].toLowerCase();
    const isImageMedia = normalizedMediaType.startsWith("image") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(mediaPath);
    const isVideoMedia = normalizedMediaType.startsWith("video") || /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(mediaPath);
    const isAudioMedia = normalizedMediaType.startsWith("audio") || /\.(mp3|wav|webm|ogg|m4a|aac)$/i.test(mediaPath);

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

    useEffect(() => {
        if (!previewMedia) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setPreviewMedia(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previewMedia]);

    const openMediaPreview = (kind) => {
        setPreviewMedia({ kind, url: mediaUrl });
    };

    const renderMedia = () => {
        if (!mediaUrl) return null;

        if (isImageMedia) {
            return (
                <button
                    type="button"
                    className="chat-media-open"
                    onClick={() => openMediaPreview("image")}
                    aria-label="Open image attachment"
                >
                    <img src={mediaUrl} alt="attachment" className="chat-media chat-media-image" />
                </button>
            );
        }

        if (isVideoMedia) {
            return (
                <button
                    type="button"
                    className="chat-media-open"
                    onClick={() => openMediaPreview("video")}
                    aria-label="Open video attachment"
                >
                    <video src={mediaUrl} className="chat-media chat-media-video" muted playsInline />
                    <span className="chat-video-open-label">Open video</span>
                </button>
            );
        }

        if (isAudioMedia) {
            return (
                <audio
                    src={mediaUrl}
                    controls
                    className="chat-media-audio"
                />
            );
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

        {previewMedia && (
            <div className="chat-media-preview-overlay" onClick={() => setPreviewMedia(null)}>
                <div className="chat-media-preview" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        className="chat-media-preview-close"
                        onClick={() => setPreviewMedia(null)}
                        aria-label="Close media preview"
                    >
                        <X size={22} />
                    </button>
                    {previewMedia.kind === "image" ? (
                        <img src={previewMedia.url} alt="attachment preview" />
                    ) : (
                        <video src={previewMedia.url} controls autoPlay className="chat-media-preview-video" />
                    )}
                </div>
            </div>
        )}

        </div>

    </div>
);
};

export default MessageBubble;
