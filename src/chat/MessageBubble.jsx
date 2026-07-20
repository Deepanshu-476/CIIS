import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCheck, Copy, Download, FileText, Forward, Mic, MoreVertical, Pause, Play, Reply, Trash2, X } from "lucide-react";
import { API_URL_IMG } from "../config";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|webm|ogg|m4a|aac)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i;
const DOCUMENT_EXTENSIONS = /\.(pdf|docx?|xlsx?|csv|pptx?|txt|rtf|odt|ods|odp|zip|rar|7z)$/i;

const getBackendUrl = (path) => `${API_URL_IMG.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

const safeEncodeUrl = (url) => {
    try {
        return encodeURI(url);
    } catch {
        return url;
    }
};

const uniqueUrls = (urls) => Array.from(new Set(urls.filter(Boolean).map(safeEncodeUrl)));

const MessageBubble = ({
    message,
    currentUser,
    users,
    onDeleteForMe,
    onDeleteForEveryone,
    onForward,
    onReply,
    onReplyJump,
    onReact,
    isStarredMessage
}) => {





    const [showMenu, setShowMenu] = useState(false);
    const [menuPlacement, setMenuPlacement] = useState("above");
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [selectedTargets, setSelectedTargets] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);
    const getCurrentUserReaction = () => (
        (message.reactions || []).find((reaction) => (
            String(reaction.user?._id || reaction.user || "") === String(currentUser?._id || currentUser?.id || "")
        ))?.emoji || message.reaction || ""
    );
    const [selectedReaction, setSelectedReaction] = useState(getCurrentUserReaction);
    const [isStarred, setIsStarred] = useState(Boolean(message.starred || isStarredMessage));
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [mediaUrlIndex, setMediaUrlIndex] = useState(0);
    const audioRef = useRef(null);
    const bubbleRef = useRef(null);
    const menuButtonRef = useRef(null);
    const menuInstanceIdRef = useRef(`message-menu-${message._id || message.createdAt || Math.random()}`);
    const reactionSummary = Object.entries((message.reactions || []).reduce((summary, reaction) => {
        if (reaction?.emoji) summary[reaction.emoji] = (summary[reaction.emoji] || 0) + 1;
        return summary;
    }, {}));

    useEffect(() => {
        setIsStarred(Boolean(message.starred || isStarredMessage));
    }, [message.starred, isStarredMessage]);

    useEffect(() => {
        setSelectedReaction(getCurrentUserReaction());
    }, [message.reactions, message.reaction, currentUser?._id, currentUser?.id]);

    useEffect(() => {
        const closeOtherMenu = event => {
            if (event.detail !== menuInstanceIdRef.current) setShowMenu(false);
        };
        window.addEventListener("chat:message-menu-open", closeOtherMenu);
        return () => window.removeEventListener("chat:message-menu-open", closeOtherMenu);
    }, []);

    useEffect(() => {
        if (!showMenu) return undefined;

        const closeOnOutsideClick = event => {
            if (!bubbleRef.current?.contains(event.target)) setShowMenu(false);
        };
        const closeOnEscape = event => {
            if (event.key === "Escape") setShowMenu(false);
        };

        document.addEventListener("pointerdown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [showMenu]);

    const toggleMessageMenu = () => {
        setShowMenu(current => {
            const next = !current;
            if (next) {
                const buttonRect = menuButtonRef.current?.getBoundingClientRect();
                const estimatedMenuHeight = mediaUrl ? 350 : 310;
                const spaceAbove = buttonRect?.top || 0;
                const spaceBelow = window.innerHeight - (buttonRect?.bottom || 0);
                setMenuPlacement(spaceAbove >= estimatedMenuHeight || spaceAbove > spaceBelow ? "above" : "below");
                window.dispatchEvent(new CustomEvent("chat:message-menu-open", { detail: menuInstanceIdRef.current }));
            }
            return next;
        });
    };

    const currentUserId = (currentUser?._id || currentUser?.id || "").toString();
    const senderId = (message.sender?._id || message.sender || "").toString();
    const isOwn = senderId === currentUserId;
    const senderName = message.sender?.name || "Unknown";
    const formattedTime = new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
    const rawMessageText = String(message.text || "");
    const encodedReplyMatch = rawMessageText.match(/^\[\[ciis-reply:([^\]]+)\]\]/);
    const legacyReplyMeta = (() => {
        if (!encodedReplyMatch) return null;
        try {
            return JSON.parse(decodeURIComponent(encodedReplyMatch[1]));
        } catch {
            return null;
        }
    })();
    const replyMeta = message.replyTo
        ? {
            id: message.replyTo._id,
            sender: message.replyTo.sender?.name || "User",
            text: message.replyTo.deletedForEveryone
                ? "This message was deleted"
                : message.replyTo.text || message.replyTo.file?.split(/[\\/]/).pop() || "Attachment",
        }
        : legacyReplyMeta;
    const displayMessageText = (encodedReplyMatch
        ? rawMessageText.slice(encodedReplyMatch[0].length)
        : rawMessageText
    ).replace(/\[\[ciis-expire:\d+\]\]/g, "").trim();

    const isDeletedForEveryone = Boolean(message.deletedForEveryone);
    const mediaType = message.mediaType || message.type || message.fileType;
    const getRawMediaUrl = () => {
        const raw = message.mediaUrl
            || message.fileUrl
            || message.attachmentUrl
            || message.file
            || message.url
            || message.path
            || message.filename
            || message.fileName
            || message.name;
        if (!raw) return "";
        if (typeof raw === "string") return raw;
        if (typeof raw === "object") {
            return raw.url
                || raw.path
                || raw.fileUrl
                || raw.attachmentUrl
                || raw.filename
                || raw.fileName
                || raw.name
                || "";
        }
        return "";
    };
    const rawMediaUrl = getRawMediaUrl();
    const getMediaUrlCandidates = (url) => {
        if (!url) return [];

        const normalizedRaw = String(url).trim().replace(/\\/g, "/");
        const withoutQuery = normalizedRaw.split("?")[0];
        const fileName = withoutQuery.split("/").pop();
        const looksLikeChatFile = fileName && (IMAGE_EXTENSIONS.test(fileName) || AUDIO_EXTENSIONS.test(fileName) || VIDEO_EXTENSIONS.test(fileName) || DOCUMENT_EXTENSIONS.test(fileName));

        if (/^https?:\/\//i.test(normalizedRaw)) {
            const candidates = [normalizedRaw];

            try {
                const parsed = new URL(normalizedRaw);
                candidates.push(getBackendUrl(parsed.pathname + parsed.search));
                if (looksLikeChatFile) {
                    candidates.push(getBackendUrl(`/api/uploads/chat/${fileName}`));
                    candidates.push(getBackendUrl(`/uploads/chat/${fileName}`));
                }
            } catch {
                void 0;
            }

            return uniqueUrls(candidates);
        }

        const trimmedPath = normalizedRaw.replace(/^\/+/, "");
        const candidates = [];

        if (trimmedPath.startsWith("api/uploads/") || trimmedPath.startsWith("uploads/")) {
            candidates.push(getBackendUrl(`/${trimmedPath}`));
        }

        if (trimmedPath.startsWith("uploads/chat/")) {
            candidates.push(getBackendUrl(`/api/${trimmedPath}`));
        }

        if (trimmedPath.startsWith("chat/")) {
            candidates.push(getBackendUrl(`/api/uploads/${trimmedPath}`));
            candidates.push(getBackendUrl(`/uploads/${trimmedPath}`));
        }

        if (looksLikeChatFile) {
            candidates.push(getBackendUrl(`/api/uploads/chat/${fileName}`));
            candidates.push(getBackendUrl(`/uploads/chat/${fileName}`));
        }

        candidates.push(getBackendUrl(`/${trimmedPath}`));

        return uniqueUrls(candidates);
    };
    const mediaUrlCandidates = useMemo(() => getMediaUrlCandidates(rawMediaUrl), [rawMediaUrl]);
    const mediaUrl = mediaUrlCandidates[mediaUrlIndex] || mediaUrlCandidates[0] || "";
    const normalizedMediaType = (mediaType || "").toLowerCase();
    const mediaPath = (mediaUrl || "").split("?")[0].toLowerCase();
    const rawMediaPath = String(rawMediaUrl || "").split("?")[0].toLowerCase();
    const isImageMedia = normalizedMediaType.startsWith("image") || IMAGE_EXTENSIONS.test(mediaPath) || IMAGE_EXTENSIONS.test(rawMediaPath);
    const isAudioMedia = normalizedMediaType.startsWith("audio")
        || mediaPath.includes("audio-recording")
        || rawMediaPath.includes("audio-recording")
        || AUDIO_EXTENSIONS.test(mediaPath)
        || AUDIO_EXTENSIONS.test(rawMediaPath);
    const isVideoMedia = !isAudioMedia && (
        normalizedMediaType.startsWith("video") || VIDEO_EXTENSIONS.test(mediaPath) || VIDEO_EXTENSIONS.test(rawMediaPath)
    );
    const isPdfMedia = normalizedMediaType === "application/pdf" || /\.pdf$/i.test(mediaPath) || /\.pdf$/i.test(rawMediaPath);
    const getAttachmentName = () => {
        const pathName = rawMediaUrl.split(/[\\/]/).pop() || "Attachment";
        try {
            return decodeURIComponent(pathName).replace(/^\d+-/, "") || "Attachment";
        } catch {
            return pathName.replace(/^\d+-/, "") || "Attachment";
        }
    };
    const attachmentName = getAttachmentName();
    const isAudioOnly = Boolean(isAudioMedia && mediaUrl && !displayMessageText && !isDeletedForEveryone);
    const tryNextMediaUrl = () => {
        setMediaUrlIndex((currentIndex) => (
            currentIndex + 1 < mediaUrlCandidates.length ? currentIndex + 1 : currentIndex
        ));
    };

    useEffect(() => {
        setMediaUrlIndex(0);
        setIsAudioPlaying(false);
        setAudioCurrentTime(0);
        setAudioDuration(0);
    }, [rawMediaUrl]);

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

    const getCopyText = () => {
        if (displayMessageText) return displayMessageText;
        if (attachmentName && mediaUrl) return attachmentName;
        return "";
    };

    const copyMessage = async () => {
        const copyText = getCopyText();
        if (!copyText) return;

        try {
            await navigator.clipboard.writeText(copyText);
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = copyText;
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        }
    };

    const closeMenu = () => setShowMenu(false);

    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    const menuActions = [
        {
            key: "reply",
            label: "Reply",
            icon: Reply,
            run: () => onReply?.(message)
        },
        {
            key: "copy",
            label: "Copy",
            icon: Copy,
            run: copyMessage
        },
        {
            key: "forward",
            label: "Forward",
            icon: Forward,
            run: () => setShowForwardModal(true)
        },
        {
            key: "delete",
            label: "Delete",
            icon: Trash2,
            run: () => onDeleteForMe(message),
            danger: true
        },
        ...(isOwn ? [{
            key: "delete-everyone",
            label: "Delete for everyone",
            icon: Trash2,
            run: () => onDeleteForEveryone(message),
            danger: true
        }] : []),
        ...(mediaUrl ? [{
            key: "download",
            label: "Download",
            icon: Download,
            run: () => downloadAttachment()
        }] : [])
    ];

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

    const downloadAttachment = async () => {
        if (!mediaUrl) return;

        const downloadUrls = mediaUrlCandidates.length ? mediaUrlCandidates : [mediaUrl];
        try {
            let blob = null;
            for (const url of downloadUrls) {
                try {
                    const response = await fetch(url, { credentials: "include" });
                    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
                    blob = await response.blob();
                    break;
                } catch (error) {
                    if (url === downloadUrls[downloadUrls.length - 1]) throw error;
                }
            }
            if (!blob) throw new Error("No downloadable attachment found");

            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = attachmentName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Attachment download failed", error);
        }
    };

    const formatAudioTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    };

    const toggleAudioPlayback = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            audio.play().catch((error) => {
                console.warn("Voice note playback failed", error);
                setIsAudioPlaying(false);
            });
        } else {
            audio.pause();
        }
    };

    const renderAudioWaveform = () => {
        const bars = [8, 13, 17, 11, 22, 26, 18, 30, 34, 21, 28, 37, 32, 24, 18, 31, 36, 26, 20, 29, 35, 24, 16, 12];
        const progress = audioDuration ? audioCurrentTime / audioDuration : 0;

        return (
            <div className="voice-waveform" aria-hidden="true">
                {bars.map((height, index) => (
                    <span
                        key={`${height}-${index}`}
                        className={index / bars.length <= progress ? "played" : ""}
                        style={{ height: `${height}px` }}
                    />
                ))}
            </div>
        );
    };

    const renderVoiceNote = () => (
        <div className="voice-note-player">
            <audio
                ref={audioRef}
                src={mediaUrl}
                preload="metadata"
                controls
                onLoadedMetadata={(event) => setAudioDuration(event.currentTarget.duration || 0)}
                onTimeUpdate={(event) => setAudioCurrentTime(event.currentTarget.currentTime || 0)}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={() => {
                    setIsAudioPlaying(false);
                    setAudioCurrentTime(0);
                }}
                onError={(event) => {
                    console.warn("Voice note load error", event);
                    tryNextMediaUrl();
                }}
            />
            <div className="voice-avatar">
                <span>{message.sender?.name?.charAt(0).toUpperCase() || "U"}</span>
                <Mic size={16} />
            </div>
            <button
                type="button"
                className="voice-play-btn"
                onClick={toggleAudioPlayback}
                aria-label={isAudioPlaying ? "Pause voice recording" : "Play voice recording"}
            >
                {isAudioPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            </button>
            <div className="voice-note-body">
                {renderAudioWaveform()}
                <div className="voice-note-meta">
                    <span>{formatAudioTime(audioDuration || audioCurrentTime)}</span>
                    <span>
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {isOwn && (
                            message.seen ? <CheckCheck size={14} /> : <Check size={14} />
                        )}
                    </span>
                </div>
            </div>
        </div>
    );

    const renderMedia = () => {
        if (!mediaUrl) {
            return null;
        }

        if (isImageMedia) {
            return (
                <button
                    type="button"
                    className="chat-media-open"
                    onClick={() => openMediaPreview("image")}
                    aria-label="Open image attachment"
                >
                    <img src={mediaUrl} alt="attachment" className="chat-media chat-media-image" onError={tryNextMediaUrl} />
                </button>
            );
        }

        if (isAudioMedia) {
            return renderVoiceNote();
        }

        if (isVideoMedia) {
            return (
                <button
                    type="button"
                    className="chat-media-open"
                    onClick={() => openMediaPreview("video")}
                    aria-label="Open video attachment"
                >
                    <video src={mediaUrl} className="chat-media chat-media-video" muted playsInline onError={tryNextMediaUrl} />
                    <span className="chat-video-open-label">Open video</span>
                </button>
            );
        }

        return (
            <div className="chat-media-file-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <a
                    className="chat-media-file"
                    href={mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open ${attachmentName}`}
                    style={{ marginTop: 0, flex: 1 }}
                >
                    <FileText size={16} />
                    <span>{attachmentName}</span>
                    <small>{isPdfMedia ? "PDF Document" : "Document"}</small>
                </a>
                <a
                    href={mediaUrl}
                    download={attachmentName}
                    className="chat-media-download-btn"
                    title="Download File"
                >
                    <Download size={16} />
                </a>
            </div>
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

        <div ref={bubbleRef} className={`${isAudioOnly ? "message-bubble voice-message-bubble" : "message-bubble"} ${isStarred ? "is-starred" : ""}`}>

            {!isAudioOnly && (
                <div className="message-top-row">
                    <span className="message-sender">{senderName}</span>
                    <button ref={menuButtonRef} className="message-menu-btn" onClick={toggleMessageMenu} title="Message options">
                        <MoreVertical size={16} />
                    </button>
                </div>
            )}

            {message.isForwarded && <div className="forwarded-label">Forwarded</div>}
            {!!reactionSummary.length && (
                <div className="message-reaction-badge">
                    {reactionSummary.map(([emoji, count]) => (
                        <span key={emoji}>{emoji}{count > 1 ? count : ""}</span>
                    ))}
                </div>
            )}
            {replyMeta && (
                <button
                    type="button"
                    className="whatsapp-quoted-message"
                    onClick={() => onReplyJump?.(replyMeta.id)}
                    title="Go to replied message"
                >
                    <strong>{replyMeta.sender || "User"}</strong>
                    <span>{replyMeta.text || "Message"}</span>
                </button>
            )}

            {isDeletedForEveryone ? (
                <div className="message-content-row">
                    <span className="deleted-text">This message was deleted</span>
                    <span className="whatsapp-message-meta">
                        <time>{formattedTime}</time>
                        {isOwn && (message.seen ? <CheckCheck size={14} /> : <Check size={14} />)}
                    </span>
                </div>
            ) : (
                <div className="message-content-row">
                    {displayMessageText && <span className="message-text-content">{displayMessageText}</span>}
                    {renderMedia()}
                    {!isAudioOnly && (
                        <span className={message.seen ? "whatsapp-message-meta seen" : "whatsapp-message-meta"}>
                            <time>{formattedTime}</time>
                            {isOwn && (message.seen ? <CheckCheck size={14} /> : <Check size={14} />)}
                        </span>
                    )}
                </div>
            )}

            {isAudioOnly && (
                <button ref={menuButtonRef} className="message-menu-btn voice-message-menu-btn" onClick={toggleMessageMenu} title="Message options">
                    <MoreVertical size={16} />
                </button>
            )}

            {showMenu && !isDeletedForEveryone && (
                <div className={`message-menu whatsapp-message-menu opens-${menuPlacement}`}>
                    <div className="message-reaction-strip" aria-label="Message reactions">
                        {quickReactions.map((emoji) => (
                            <button
                                type="button"
                                key={emoji}
                                className={selectedReaction === emoji ? "active" : ""}
                                onClick={() => {
                                    const nextReaction = selectedReaction === emoji ? "" : emoji;
                                    setSelectedReaction(nextReaction);
                                    onReact?.(message, nextReaction);
                                    closeMenu();
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    <div className="message-menu-list">
                        {menuActions.map(({ key, label, icon, run, danger }) => (
                            <button
                                type="button"
                                key={key}
                                className={danger ? "danger" : ""}
                                onClick={() => {
                                    run?.();
                                    closeMenu();
                                }}
                            >
                                {React.createElement(icon, { size: 17 })}
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
                    <a
                        href={previewMedia.url}
                        download={attachmentName}
                        className="chat-media-preview-download"
                        title="Download"
                        onClick={(event) => {
                            event.preventDefault();
                            downloadAttachment();
                        }}
                    >
                        <Download size={20} />
                    </a>
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
