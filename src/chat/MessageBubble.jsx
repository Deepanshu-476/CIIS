import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCheck, Download, FileText, Forward, Mic, MoreVertical, Pause, Play, Trash2, X } from "lucide-react";
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
    onForward
}) => {





    const [showMenu, setShowMenu] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [selectedTargets, setSelectedTargets] = useState([]);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [mediaUrlIndex, setMediaUrlIndex] = useState(0);
    const audioRef = useRef(null);

    const currentUserId = (currentUser?._id || currentUser?.id || "").toString();
    const senderId = (message.sender?._id || message.sender || "").toString();
    const isOwn = senderId === currentUserId;

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
    const isAudioOnly = Boolean(isAudioMedia && mediaUrl && !message.text && !isDeletedForEveryone);
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

        <div className={isAudioOnly ? "message-bubble voice-message-bubble" : "message-bubble"}>

            {!isAudioOnly && (
                <div className="message-top-row">
                    <span className="message-sender">{message.sender?.name || "Unknown"}</span>
                    <span className="message-time">{new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <button className="message-menu-btn" onClick={() => setShowMenu((prev) => !prev)} title="Message options">
                        <MoreVertical size={16} />
                    </button>
                </div>
            )}

            {message.isForwarded && <div className="forwarded-label">Forwarded</div>}

            {isDeletedForEveryone ? (
                <div className="deleted-text">This message was deleted</div>
            ) : (
                <>
                    {message.text}
                    {renderMedia()}
                </>
            )}

            {isAudioOnly && (
                <button className="message-menu-btn voice-message-menu-btn" onClick={() => setShowMenu((prev) => !prev)} title="Message options">
                    <MoreVertical size={16} />
                </button>
            )}

            {showMenu && !isDeletedForEveryone && (
                <div className="message-menu">
                    {mediaUrl && <button onClick={() => { downloadAttachment(); setShowMenu(false); }}><Download size={13} />Download</button>}
                    <button onClick={() => { onDeleteForMe(message); setShowMenu(false); }}><Trash2 size={13} />Delete For Me</button>
                    {isOwn && <button onClick={() => { onDeleteForEveryone(message); setShowMenu(false); }}><Trash2 size={13} />Delete For Everyone</button>}
                    <button onClick={() => { setShowForwardModal(true); setShowMenu(false); }}><Forward size={13} />Forward</button>
                </div>
            )}

            {
    isOwn && !isAudioOnly && (

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
