import React, { useCallback, useEffect, useState } from "react";
import { CheckCheck, Check, Clock, X } from "lucide-react";
import { getMessageInfo } from "../services/chatService";
import { resolveAvatarUrl } from "./messageUtils";
import "./MessageInfoModal.css";

const formatReceiptTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
    return `${date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}, ${time}`;
};

const ReceiptRow = ({ user, time }) => {
    const name = user?.name || user?.email || "User";
    const avatar = resolveAvatarUrl(user);
    return (
        <li className="message-info-row">
            <span className="message-info-avatar">
                {avatar ? <img src={avatar} alt="" /> : name.charAt(0).toUpperCase()}
            </span>
            <span className="message-info-name">{name}</span>
            {time ? <span className="message-info-time">{formatReceiptTime(time)}</span> : null}
        </li>
    );
};

// WhatsApp-style "Message info" for one of your own messages: who read it, who has only
// received it, and who has not received it yet. Refreshes when a read or delivery arrives.
const MessageInfoModal = ({ messageId, socket, onClose }) => {
    const [info, setInfo] = useState(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const response = await getMessageInfo(messageId);
            setInfo(response.data);
            setError("");
        } catch (requestError) {
            setError(requestError?.response?.data?.message || "Unable to load message info.");
        }
    }, [messageId]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!socket) return undefined;
        const refreshIfThisMessage = (data = {}) => {
            if (String(data.messageId || "") === String(messageId)) load();
        };
        socket.on("chat:message-seen", refreshIfThisMessage);
        socket.on("chat:message-delivered", refreshIfThisMessage);
        return () => {
            socket.off("chat:message-seen", refreshIfThisMessage);
            socket.off("chat:message-delivered", refreshIfThisMessage);
        };
    }, [socket, messageId, load]);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    const preview = info?.message?.text
        || (info?.message?.fileName ? `📎 ${info.message.fileName}` : info?.message?.fileType ? "📎 Attachment" : "");

    return (
        <div className="message-info-overlay" onClick={onClose}>
            <div className="message-info-modal" role="dialog" aria-label="Message info" onClick={(event) => event.stopPropagation()}>
                <div className="message-info-header">
                    <h4>Message info</h4>
                    <button type="button" className="message-info-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="message-info-body">
                    {info ? (
                        <>
                            <div className="message-info-preview">
                                {preview ? <p>{preview}</p> : null}
                                <span>Sent {formatReceiptTime(info.message?.createdAt)}</span>
                            </div>
                            <section>
                                <h5><CheckCheck size={16} className="message-info-read-icon" /> Read by</h5>
                                {info.readBy?.length ? (
                                    <ul>{info.readBy.map(item => <ReceiptRow key={item.user?._id} user={item.user} time={item.readAt} />)}</ul>
                                ) : <p className="message-info-empty">No one yet</p>}
                            </section>
                            <section>
                                <h5><CheckCheck size={16} /> Delivered to</h5>
                                {info.deliveredTo?.length ? (
                                    <ul>{info.deliveredTo.map(item => <ReceiptRow key={item.user?._id} user={item.user} time={item.deliveredAt} />)}</ul>
                                ) : <p className="message-info-empty">{info.readBy?.length ? "Everyone who received it has read it" : "No one yet"}</p>}
                            </section>
                            {info.pending?.length ? (
                                <section>
                                    <h5><Check size={16} /> Not delivered yet</h5>
                                    <ul>{info.pending.map(item => <ReceiptRow key={item.user?._id} user={item.user} />)}</ul>
                                </section>
                            ) : null}
                        </>
                    ) : error ? (
                        <p className="message-info-empty">{error}</p>
                    ) : (
                        <p className="message-info-empty"><Clock size={14} /> Loading…</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageInfoModal;
