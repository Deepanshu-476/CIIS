import React from "react";
import { Clock, FileText, RotateCcw, X } from "lucide-react";
import { cancelUpload, retryUpload } from "./uploadQueue";

const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

// A file the user sent that is still uploading (or failed). Looks like their own
// message bubble, with progress, cancel and retry.
const PendingUploadBubble = ({ upload }) => {
    const { id, fileName, fileType, fileSize, previewUrl, text, replyTo, createdAt, progress, status, error } = upload;
    const failed = status === "failed";
    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");
    const time = new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const statusText = failed
        ? error || "Not sent"
        : status === "processing"
            ? "Finishing…"
            : `Uploading ${progress}%${fileSize ? ` of ${formatSize(fileSize)}` : ""}`;

    return (
        <div className="message-row own chat-pending-upload" data-upload-id={id}>
            <div className="message-bubble">
                {replyTo?.text && (
                    <div className="whatsapp-quoted-message"><strong>Reply</strong><span>{replyTo.text}</span></div>
                )}
                <div className="chat-pending-media">
                    {isImage && previewUrl ? (
                        <img src={previewUrl} alt={fileName} />
                    ) : isVideo && previewUrl ? (
                        <video src={previewUrl} muted playsInline preload="metadata" />
                    ) : (
                        <div className="chat-pending-file"><FileText size={22} /><span>{fileName}</span></div>
                    )}
                    <div className={`chat-pending-overlay ${failed ? "is-failed" : ""}`}>
                        {failed ? (
                            <button type="button" className="chat-pending-action" onClick={() => retryUpload(id)} title="Retry" aria-label="Retry upload">
                                <RotateCcw size={20} />
                            </button>
                        ) : status === "processing" ? (
                            // Every byte is sent and the server is saving it: it can no longer be cancelled.
                            <span className="chat-pending-action" role="status" aria-label="Finishing upload">
                                <svg className="chat-pending-ring" viewBox="0 0 44 44" aria-hidden="true">
                                    <circle cx="22" cy="22" r="19" className="track" />
                                    <circle cx="22" cy="22" r="19" className="bar spin" style={{ strokeDashoffset: 90 }} />
                                </svg>
                            </span>
                        ) : (
                            <button type="button" className="chat-pending-action" onClick={() => cancelUpload(id)} title="Cancel upload" aria-label="Cancel upload">
                                <svg className="chat-pending-ring" viewBox="0 0 44 44" aria-hidden="true">
                                    <circle cx="22" cy="22" r="19" className="track" />
                                    <circle cx="22" cy="22" r="19" className="bar"
                                        style={{ strokeDashoffset: 119.4 * (1 - progress / 100) }} />
                                </svg>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
                {(isImage || isVideo) && <div className="chat-pending-name" title={fileName}>{fileName}</div>}
                {text?.trim() && <span className="message-text-content has-media-caption">{text}</span>}
                <div className={`chat-pending-status ${failed ? "is-failed" : ""}`}>
                    <span>{statusText}</span>
                    {failed && (
                        <button type="button" onClick={() => cancelUpload(id)}>Remove</button>
                    )}
                    <span className="whatsapp-message-meta"><time>{time}</time><Clock size={12} aria-label="Sending" /></span>
                </div>
            </div>
        </div>
    );
};

export default PendingUploadBubble;
