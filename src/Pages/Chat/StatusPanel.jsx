import React, { useEffect, useMemo, useRef, useState } from "react";
import { resolveAvatarUrl } from "../../chat/messageUtils";
import {
  Camera, Film, Filter, Image, MoreVertical, Plus, Search,
  Send, Settings, Type, X,
} from "lucide-react";

const initials = name => String(name || "User").trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
const statusTime = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const StatusAvatar = ({ status, own = false }) => {
  const user = status?.user || {};
  const avatarUrl = resolveAvatarUrl(user.avatar || user.profileImage || user);
  return (
    <span className={`status-ref-avatar ${status?.viewed ? "viewed" : ""}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "inline";
          }}
        />
      ) : null}
      <span style={{ display: avatarUrl ? "none" : "inline" }}>
        {initials(user.name)}
      </span>
      {own && <i><Plus size={11} strokeWidth={3} /></i>}
    </span>
  );
};

export default function StatusPanel({
  statuses = [],
  currentUser,
  onCreate,
  onDelete,
  onViewed,
  loading = false,
  error = "",
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState(null);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const fileRef = useRef(null);
  const currentId = String(currentUser?._id || currentUser?.id || "");

  useEffect(() => {
    if (!showOptionsMenu) return undefined;
    const closeOptions = e => {
      if (!e.target.closest(".status-ref-header-actions") && !e.target.closest(".status-ref-options-menu")) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener("pointerdown", closeOptions);
    return () => document.removeEventListener("pointerdown", closeOptions);
  }, [showOptionsMenu]);

  const ownStatuses = statuses.filter(item => item.isOwn || String(item.user?.id || "") === currentId);
  const latestByUser = useMemo(() => {
    const users = new Map();
    statuses.filter(item => !item.isOwn && String(item.user?.id || "") !== currentId).forEach(item => {
      const id = String(item.user?.id || item.id);
      if (!users.has(id)) users.set(id, item);
    });
    return [...users.values()].filter(item => {
      const matches = item.user?.name?.toLowerCase().includes(query.trim().toLowerCase());
      return matches && (filter === "all" || (filter === "unviewed" ? !item.viewed : item.viewed));
    });
  }, [statuses, currentId, query, filter]);

  const openComposer = type => {
    setComposer(type);
    setCaption("");
    setFile(null);
    setPreview("");
    if (type === "image" || type === "video") {
      window.setTimeout(() => fileRef.current?.click(), 0);
    }
  };

  const selectFile = event => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) return;
    const expected = composer === "video" ? "video/" : "image/";
    if (!next.type.startsWith(expected)) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const submit = async event => {
    event.preventDefault();
    if (!caption.trim() && !file) return;
    setSubmitting(true);
    try {
      await onCreate({ text: caption.trim(), file });
      setComposer(null);
    } finally {
      setSubmitting(false);
    }
  };

  const openStatus = status => {
    setSelected(status);
    if (!status.isOwn && !status.viewed) onViewed?.(status.id);
  };

  useEffect(() => {
    const keyboard = event => {
      if (event.key === "Escape") setSelected(null);
      if (!selected || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const list = statuses;
      const index = list.findIndex(item => item.id === selected.id);
      const next = event.key === "ArrowRight" ? index + 1 : index - 1;
      if (list[next]) openStatus(list[next]);
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [selected, statuses]);

  return (
    <aside className="chat-sidebar chat-view-panel chat-status-panel status-ref-panel">
      <section className="chat-sidebar-card conversations-card">
        <header className="status-ref-header">
          <div className="status-ref-title-group">
            <h1>Status</h1>
            <p>Share updates with your team</p>
          </div>
          <div className="status-ref-header-actions">
            <button type="button" aria-label="Add status" title="Add status" onClick={() => openComposer("text")}><Plus size={19} /></button>
            <button
              type="button"
              aria-label="Status options"
              title="Status options"
              onClick={() => setShowOptionsMenu(prev => !prev)}
            >
              <MoreVertical size={18} />
            </button>
          </div>
          {showOptionsMenu && (
            <div className="status-ref-options-menu">
              <button type="button" onClick={() => { setShowOptionsMenu(false); openComposer("text"); }}>
                <Type size={16} />
                <span>Text status</span>
              </button>
              <button type="button" onClick={() => { setShowOptionsMenu(false); openComposer("image"); }}>
                <Image size={16} />
                <span>Photo status</span>
              </button>
              <button type="button" onClick={() => { setShowOptionsMenu(false); openComposer("video"); }}>
                <Camera size={16} />
                <span>Video status</span>
              </button>
            </div>
          )}
        </header>

        <div className="status-ref-tools">
          <label><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search status updates" /></label>
          <button type="button" aria-label="Filter statuses" onClick={() => setFilter(value => value === "all" ? "unviewed" : value === "unviewed" ? "viewed" : "all")} className={filter !== "all" ? "active" : ""}><Filter size={17} /></button>
        </div>

        <section className="status-ref-own">
          <button type="button" className="status-ref-own-row" onClick={() => ownStatuses[0] ? openStatus(ownStatuses[0]) : openComposer("text")}>
            <StatusAvatar status={ownStatuses[0] || { user: { name: currentUser?.name, profileImage: currentUser?.profileImage || currentUser?.avatar } }} own />
            <span><strong>My status</strong><small>{ownStatuses.length ? statusTime(ownStatuses[0].createdAt) : "Add status update"}</small></span>
          </button>
          <div className="status-ref-create-grid">
            <button type="button" onClick={() => openComposer("image")}><Image size={22} /><span>Photo</span></button>
            <button type="button" onClick={() => openComposer("video")}><Camera size={22} /><span>Video</span></button>
            <button type="button" onClick={() => openComposer("text")}><Type size={22} /><span>Text</span></button>
          </div>
        </section>

        <div className="status-ref-section-title">Recent updates</div>
        <div className="status-ref-list">
          {loading && <div className="status-ref-message">Loading statuses…</div>}
          {!loading && error && <div className="status-ref-message error">{error}</div>}
          {!loading && !error && latestByUser.length === 0 && <div className="status-ref-message">No status updates</div>}
          {latestByUser.map(status => (
            <button type="button" className="status-ref-item" key={status.id} onClick={() => openStatus(status)}>
              <StatusAvatar status={status} />
              <span><strong>{status.user?.name || "User"}</strong><small>{statusTime(status.createdAt)}</small></span>
              <i className={status.viewed ? "muted" : ""} />
              <MoreVertical size={17} />
            </button>
          ))}
        </div>
        <button type="button" className="status-ref-settings" aria-label="Status settings" onClick={() => openComposer("text")}><Settings size={19} /></button>
      </section>

      {composer && (
        <div className="status-ref-modal" role="dialog" aria-modal="true" aria-label="Create status" onClick={() => setComposer(null)}>
          <form onSubmit={submit} onClick={e => e.stopPropagation()}>
            <header><strong>Create {composer === "text" ? "text" : composer} status</strong><button type="button" aria-label="Close" onClick={() => setComposer(null)}><X size={19} /></button></header>
            <input ref={fileRef} hidden type="file" accept={composer === "video" ? "video/*" : "image/*"} onChange={selectFile} />
            {preview && (composer === "video" ? <video src={preview} controls /> : <img src={preview} alt="Status preview" />)}
            {(composer === "image" || composer === "video") && !preview && <button className="status-ref-pick" type="button" onClick={() => fileRef.current?.click()}><Film size={25} />Choose {composer}</button>}
            <textarea value={caption} onChange={event => setCaption(event.target.value)} maxLength={500} autoFocus={composer === "text"} placeholder={composer === "text" ? "Type a status update…" : "Add a caption…"} />
            <button className="status-ref-submit" type="submit" disabled={submitting || (!caption.trim() && !file)}>{submitting ? "Posting…" : "Post status"}<Send size={16} /></button>
          </form>
        </div>
      )}

      {selected && (
        <div className="status-ref-viewer" onClick={() => setSelected(null)}>
          <div className="status-ref-story" onClick={e => e.stopPropagation()}>
            <div className="status-ref-progress"><span /></div>
            <header><StatusAvatar status={selected} /><span><strong>{selected.isOwn ? "My status" : selected.user?.name}</strong><small>{statusTime(selected.createdAt)}</small></span><button type="button" aria-label="Close viewer" onClick={() => setSelected(null)}><X size={20} /></button></header>
            <main className={selected.type === "text" ? "text" : ""}>
              {selected.type === "video" && <video src={selected.mediaUrl} controls autoPlay />}
              {selected.type === "image" && <img src={selected.mediaUrl} alt={selected.text || "Status"} />}
              {selected.type === "text" && <p>{selected.text}</p>}
              {selected.type !== "text" && selected.text && <p className="caption">{selected.text}</p>}
            </main>
            {selected.isOwn ? (
              <button type="button" className="status-ref-delete" onClick={async () => { await onDelete(selected.id); setSelected(null); }}>Delete status</button>
            ) : <div className="status-ref-reply"><input placeholder={`Reply to ${selected.user?.name || "status"}…`} /><button type="button" aria-label="Send reply"><Send size={18} /></button></div>}
          </div>
        </div>
      )}
    </aside>
  );
}
