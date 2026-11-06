import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    BellRing, Building2, CalendarClock, Eye, Film, Globe2, ImagePlus, Megaphone, Pause, Pencil, Play,
    Plus, Search, Send, Trash2, Upload, Users, X,
} from "lucide-react";
import { toast } from "react-toastify";
import { slidesFromPromos } from "./PromoCarousel";
import PromoLightbox from "./PromoLightbox";
import {
    deletePromo, errorMessage, fetchManagedPromos, fetchPromoCompanies, notifyPromo, promoMediaUrl,
    savePromo, sendStandaloneNotification, setPromoActive,
} from "./promoApi";
import "./promotions.css";

// Manage promotions. scope "platform" = Super Admin page (all companies),
// scope "company" = company admin page (own company only, after login).
const MAX_FILES = 10;
const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const defaultEnd = () => {
    const d = new Date(Date.now() + 7 * 864e5);
    d.setHours(23, 59, 0, 0);
    return toLocalInput(d);
};
const formatDate = (value) => (value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");
const formatSize = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`);
const STATUS = {
    live: "Live",
    scheduled: "Scheduled",
    paused: "Paused",
    expired: "Expired",
};
const FILTERS = [["all", "All"], ["live", "Live"], ["scheduled", "Scheduled"], ["paused", "Paused"], ["expired", "Expired"]];

const emptyForm = () => ({
    id: null,
    title: "",
    message: "",
    audience: "public",
    allCompanies: false,
    companyIds: [],
    endAt: defaultEnd(),
    notify: false,
    existingMedia: [],
    removeMediaIds: [],
    newFiles: [],
});

const audienceOf = (promo, scope) => {
    if (scope === "company") return { icon: Users, text: "Your company · after login" };
    if (promo.audience === "public") return { icon: Globe2, text: "Everyone · before login" };
    if (promo.allCompanies) return { icon: Building2, text: "All companies · after login" };
    const names = (promo.companyIds || []).map((c) => c?.companyName || c?.companyCode).filter(Boolean);
    return {
        icon: Building2,
        text: names.length === 1 ? `${names[0]} · after login` : `${names.length} companies · after login`,
        title: names.join(", "),
    };
};

const notifyText = (result) => {
    if (!result) return "";
    if (!result.users) return "No users found for this audience";
    if (result.reason === "firebase-admin-not-ready") return `Notifications are not set up on the server (${result.users} users)`;
    return `Notification sent to ${result.sent} device${result.sent === 1 ? "" : "s"} (${result.users} users)`;
};

// ---------- company picker (platform only) ----------
const CompanyPicker = ({ companies, allCompanies, selected, onAll, onToggle, disabled }) => {
    const [query, setQuery] = useState("");
    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? companies.filter((c) => `${c.companyName} ${c.companyCode}`.toLowerCase().includes(q)) : companies;
    }, [companies, query]);
    const selectedSet = new Set(selected);
    const selectedCompanies = companies.filter((c) => selectedSet.has(c._id));
    return (
        <div className="pm-picker">
            <label className="pm-switch">
                <input type="checkbox" checked={allCompanies} onChange={(e) => onAll(e.target.checked)} disabled={disabled} />
                <span className="pm-switch-track" aria-hidden="true" />
                <span>All companies</span>
            </label>
            {!allCompanies && (
                <>
                    {selectedCompanies.length > 0 && (
                        <div className="pm-chips" aria-label="Selected companies">
                            {selectedCompanies.map((c) => (
                                <span key={c._id} className="pm-chip">
                                    {c.companyName || c.companyCode}
                                    <button type="button" onClick={() => onToggle(c._id)} aria-label={`Remove ${c.companyName || c.companyCode}`}><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="pm-search">
                        <Search size={16} aria-hidden="true" />
                        <input type="search" placeholder="Search company name or code" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search companies" />
                    </div>
                    <div className="pm-company-list" role="group" aria-label="Companies">
                        {list.map((company) => (
                            <label key={company._id} className={`pm-company ${selectedSet.has(company._id) ? "is-on" : ""}`}>
                                <input type="checkbox" checked={selectedSet.has(company._id)} onChange={() => onToggle(company._id)} disabled={disabled} />
                                <span className="pm-company-avatar" aria-hidden="true">{String(company.companyName || company.companyCode || "?").charAt(0)}</span>
                                <span className="pm-company-name">{company.companyName || company.companyCode}</span>
                                <span className="pm-company-code">{company.companyCode}{company.isActive ? "" : " · inactive"}</span>
                            </label>
                        ))}
                        {!list.length && <p className="pm-muted pm-pad">{companies.length ? `No company matches “${query}”.` : "No companies found."}</p>}
                    </div>
                    <p className="pm-muted">{selected.length} selected</p>
                </>
            )}
        </div>
    );
};

const PromoManager = ({ scope = "company" }) => {
    const isPlatform = scope === "platform";
    const [tab, setTab] = useState("promotions");
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [filter, setFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState(null);
    const [formPreview, setFormPreview] = useState(false);
    const [busyId, setBusyId] = useState("");
    const [notice, setNotice] = useState({ title: "", body: "", allCompanies: false, companyIds: [], sending: false });
    const fileInputRef = useRef(null);
    const drawerRef = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setPromos(await fetchManagedPromos(scope));
        } catch (error) {
            toast.error(errorMessage(error, "Could not load promotions"));
        } finally {
            setLoading(false);
        }
    }, [scope]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (isPlatform) fetchPromoCompanies().then(setCompanies).catch((error) => toast.error(errorMessage(error, "Could not load companies")));
    }, [isPlatform]);

    // Object URLs for picked files, released when the list changes.
    const newPreviews = useMemo(() => (form?.newFiles || []).map((file) => ({ file, url: URL.createObjectURL(file) })), [form?.newFiles]);
    useEffect(() => () => newPreviews.forEach((item) => URL.revokeObjectURL(item.url)), [newPreviews]);

    // Drawer: Escape closes it, focus moves into it.
    useEffect(() => {
        if (!form) return undefined;
        drawerRef.current?.focus();
        const onKey = (event) => { if (event.key === "Escape" && !saving && !document.querySelector(".pl-backdrop")) setForm(null); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [form?.id, Boolean(form), saving]);

    // What people will see, built from the form before anything is uploaded.
    const formSlides = form ? [
        ...form.existingMedia.filter((m) => !form.removeMediaIds.includes(m._id)).map((m) => ({ key: m._id, url: promoMediaUrl(m.url), type: m.type, name: m.name })),
        ...newPreviews.map(({ file, url }, i) => ({ key: `new-${i}`, url, type: file.type.startsWith("video/") ? "video" : "image", name: file.name })),
    ].map((slide) => ({ ...slide, title: form.title.trim(), message: form.message.trim() })) : [];

    const counts = useMemo(() => promos.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }), {}), [promos]);
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return promos.filter((p) => (filter === "all" || p.status === filter) && (!q || `${p.title} ${p.message}`.toLowerCase().includes(q)));
    }, [promos, filter, query]);

    const openCreate = () => setForm(emptyForm());
    const openEdit = (promo) => setForm({
        ...emptyForm(),
        id: promo._id,
        title: promo.title || "",
        message: promo.message || "",
        audience: promo.audience,
        allCompanies: Boolean(promo.allCompanies),
        companyIds: (promo.companyIds || []).map((c) => String(c?._id || c)),
        endAt: toLocalInput(promo.endAt),
        existingMedia: promo.media || [],
    });
    const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

    const keptMediaCount = form ? form.existingMedia.filter((m) => !form.removeMediaIds.includes(m._id)).length : 0;
    const addFiles = (fileList) => {
        const picked = Array.from(fileList || []).filter((file) => /^(image|video)\//.test(file.type));
        const skipped = (fileList?.length || 0) - picked.length;
        if (skipped) toast.warn(`${skipped} file${skipped === 1 ? " is" : "s are"} not an image or video and ${skipped === 1 ? "was" : "were"} skipped`);
        const room = MAX_FILES - form.newFiles.length;
        if (picked.length > room) toast.warn(`Up to ${MAX_FILES} new files at a time`);
        update({ newFiles: [...form.newFiles, ...picked.slice(0, Math.max(0, room))] });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!form) return;
        if (!keptMediaCount && !form.newFiles.length) return toast.error("Add at least one image or video");
        if (!form.endAt) return toast.error("Choose the date until which it shows");
        if (new Date(form.endAt) <= new Date()) return toast.error("The end date must be in the future");
        if (isPlatform && form.audience === "companies" && !form.allCompanies && !form.companyIds.length) return toast.error("Select at least one company");

        const data = new FormData();
        data.append("title", form.title.trim());
        data.append("message", form.message.trim());
        data.append("endAt", new Date(form.endAt).toISOString());
        if (isPlatform) {
            data.append("audience", form.audience);
            data.append("allCompanies", String(form.allCompanies));
            data.append("companyIds", JSON.stringify(form.companyIds));
        }
        if (form.id) data.append("removeMediaIds", JSON.stringify(form.removeMediaIds));
        else if (form.notify) data.append("notify", "true");
        form.newFiles.forEach((file) => data.append("media", file, file.name));

        setSaving(true);
        setProgress(0);
        try {
            const result = await savePromo(scope, data, {
                id: form.id,
                onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
            });
            toast.success(form.id ? "Promotion updated" : "Promotion published");
            if (result?.notify) toast.info(notifyText(result.notify));
            setForm(null);
            load();
        } catch (error) {
            toast.error(errorMessage(error, "Could not save the promotion"));
        } finally {
            setSaving(false);
        }
    };

    const runAction = async (promo, fn, success) => {
        setBusyId(promo._id);
        try {
            const result = await fn();
            if (success) toast.success(typeof success === "function" ? success(result) : success);
            load();
        } catch (error) {
            toast.error(errorMessage(error, "Something went wrong"));
        } finally {
            setBusyId("");
        }
    };
    const togglePause = (promo) => runAction(promo, () => setPromoActive(scope, promo._id, !promo.isActive), promo.isActive ? "Paused — hidden until resumed" : "Resumed");
    const sendNotify = (promo) => {
        if (!window.confirm(`Send a push notification for “${promo.title || "this promotion"}” to ${audienceOf(promo, scope).text}?`)) return;
        runAction(promo, () => notifyPromo(scope, promo._id), (r) => notifyText(r.notify));
    };
    const remove = (promo) => {
        if (!window.confirm(`Delete “${promo.title || "this promotion"}”? Its images and videos are removed too.`)) return;
        if (form?.id === promo._id) setForm(null);
        runAction(promo, () => deletePromo(scope, promo._id), "Promotion deleted");
    };

    const sendNotice = async (event) => {
        event.preventDefault();
        if (!notice.title.trim() || !notice.body.trim()) return toast.error("Write a title and a message");
        if (isPlatform && !notice.allCompanies && !notice.companyIds.length) return toast.error("Select at least one company");
        setNotice((prev) => ({ ...prev, sending: true }));
        try {
            const result = await sendStandaloneNotification(scope, {
                title: notice.title.trim(),
                body: notice.body.trim(),
                ...(isPlatform ? { allCompanies: notice.allCompanies, companyIds: notice.companyIds } : {}),
            });
            toast.success(notifyText(result.notify));
            setNotice({ title: "", body: "", allCompanies: false, companyIds: [], sending: false });
        } catch (error) {
            toast.error(errorMessage(error, "Could not send the notification"));
            setNotice((prev) => ({ ...prev, sending: false }));
        }
    };

    const stats = [
        { key: "total", label: "Total", value: promos.length, icon: Megaphone },
        { key: "live", label: "Live now", value: counts.live || 0, icon: Play },
        { key: "scheduled", label: "Scheduled", value: counts.scheduled || 0, icon: CalendarClock },
        { key: "inactive", label: "Paused / expired", value: (counts.paused || 0) + (counts.expired || 0), icon: Pause },
    ];

    return (
        <div className="pm-page">
            <header className="pm-header">
                <div>
                    <h1><span className="pm-header-icon" aria-hidden="true"><Megaphone size={20} /></span>Promotions</h1>
                    <p>
                        {isPlatform
                            ? "Image and video carousels for the login screens and after-login popups, plus push notifications to the companies you choose."
                            : "Image and video carousels shown to your company's employees after they log in, plus push notifications."}
                    </p>
                </div>
                <button type="button" className="pm-btn pm-btn-primary" onClick={openCreate}>
                    <Plus size={18} /> New promotion
                </button>
            </header>

            <section className="pm-stats" aria-label="Summary">
                {stats.map(({ key, label, value, icon: Icon }) => (
                    <div key={key} className={`pm-stat pm-stat-${key}`}>
                        <span className="pm-stat-icon" aria-hidden="true"><Icon size={20} /></span>
                        <span>
                            <strong>{value}</strong>
                            <small>{label}</small>
                        </span>
                    </div>
                ))}
            </section>

            <div className="pm-tabs" role="tablist" aria-label="Promotions sections">
                <button type="button" role="tab" aria-selected={tab === "promotions"} className={tab === "promotions" ? "is-on" : ""} onClick={() => setTab("promotions")}>
                    <ImagePlus size={16} /> Promotions
                </button>
                <button type="button" role="tab" aria-selected={tab === "notify"} className={tab === "notify" ? "is-on" : ""} onClick={() => setTab("notify")}>
                    <BellRing size={16} /> Send notification
                </button>
            </div>

            {tab === "promotions" ? (
                <section className="pm-card" aria-label="Your promotions">
                    <div className="pm-toolbar">
                        <div className="pm-filters" role="group" aria-label="Filter by status">
                            {FILTERS.map(([key, label]) => (
                                <button key={key} type="button" className={filter === key ? "is-on" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                                    {label}{key !== "all" && counts[key] ? <span>{counts[key]}</span> : null}
                                </button>
                            ))}
                        </div>
                        <div className="pm-search pm-search-sm">
                            <Search size={16} aria-hidden="true" />
                            <input type="search" placeholder="Search promotions" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search promotions" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="pm-grid" aria-busy="true">
                            {[0, 1, 2].map((i) => <div key={i} className="pm-item pm-skeleton" />)}
                        </div>
                    ) : !promos.length ? (
                        <div className="pm-empty">
                            <span className="pm-empty-icon" aria-hidden="true"><ImagePlus size={28} /></span>
                            <h2>No promotions yet</h2>
                            <p>Upload images or videos — several files become a carousel.</p>
                            <button type="button" className="pm-btn pm-btn-primary" onClick={openCreate}><Plus size={18} /> New promotion</button>
                        </div>
                    ) : !visible.length ? (
                        <div className="pm-empty pm-empty-sm"><p>No promotions match this filter.</p></div>
                    ) : (
                        <ul className="pm-grid">
                            {visible.map((promo) => {
                                const first = promo.media?.[0];
                                const busy = busyId === promo._id;
                                const audience = audienceOf(promo, scope);
                                const AudienceIcon = audience.icon;
                                return (
                                    <li key={promo._id} className="pm-item">
                                        <button type="button" className="pm-thumb" onClick={() => setPreview(promo)} aria-label={`Preview ${promo.title || "promotion"}`}>
                                            {first?.type === "video"
                                                ? <video src={promoMediaUrl(first.url)} muted preload="metadata" />
                                                : first ? <img src={promoMediaUrl(first.url)} alt="" loading="lazy" /> : null}
                                            <span className={`pm-status pm-status-${promo.status}`}>{STATUS[promo.status] || promo.status}</span>
                                            <span className="pm-count"><Eye size={12} /> {promo.media?.length || 0}</span>
                                        </button>
                                        <div className="pm-item-body">
                                            <h3 title={promo.title || "Untitled"}>{promo.title || "Untitled"}</h3>
                                            <p className="pm-meta" title={audience.title}><AudienceIcon size={14} aria-hidden="true" /> {audience.text}</p>
                                            <p className="pm-meta"><CalendarClock size={14} aria-hidden="true" /> Until {formatDate(promo.endAt)}</p>
                                            {promo.lastNotifiedAt && <p className="pm-meta"><BellRing size={14} aria-hidden="true" /> Notified {formatDate(promo.lastNotifiedAt)}</p>}
                                        </div>
                                        <div className="pm-item-actions">
                                            <button type="button" className="pm-icon-btn" onClick={() => openEdit(promo)} disabled={busy} title="Edit" aria-label="Edit"><Pencil size={16} /></button>
                                            <button type="button" className="pm-icon-btn" onClick={() => togglePause(promo)} disabled={busy} title={promo.isActive ? "Pause" : "Resume"} aria-label={promo.isActive ? "Pause" : "Resume"}>
                                                {promo.isActive ? <Pause size={16} /> : <Play size={16} />}
                                            </button>
                                            <button type="button" className="pm-icon-btn" onClick={() => sendNotify(promo)} disabled={busy} title="Send notification" aria-label="Send notification"><Send size={16} /></button>
                                            <button type="button" className="pm-icon-btn pm-icon-danger" onClick={() => remove(promo)} disabled={busy} title="Delete" aria-label="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            ) : (
                <section className="pm-card pm-notify" aria-labelledby="pm-notify-title">
                    <h2 id="pm-notify-title">Send a push notification</h2>
                    <p className="pm-muted">{isPlatform ? "Goes to every employee of the companies you choose. No promotion is created." : "Goes to everyone in your company. No promotion is created."}</p>
                    <form onSubmit={sendNotice} noValidate>
                        <label className="pm-field">
                            <span>Title <em>*</em></span>
                            <input className="pm-input" value={notice.title} maxLength={120} onChange={(e) => setNotice((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Office closed on Monday" />
                        </label>
                        <label className="pm-field">
                            <span>Message <em>*</em></span>
                            <textarea className="pm-input" rows={3} value={notice.body} maxLength={500} onChange={(e) => setNotice((p) => ({ ...p, body: e.target.value }))} placeholder="What should people know?" />
                        </label>
                        {isPlatform && (
                            <div className="pm-field">
                                <span>Send to <em>*</em></span>
                                <CompanyPicker
                                    companies={companies}
                                    allCompanies={notice.allCompanies}
                                    selected={notice.companyIds}
                                    onAll={(value) => setNotice((p) => ({ ...p, allCompanies: value }))}
                                    onToggle={(id) => setNotice((p) => ({ ...p, companyIds: p.companyIds.includes(id) ? p.companyIds.filter((x) => x !== id) : [...p.companyIds, id] }))}
                                    disabled={notice.sending}
                                />
                            </div>
                        )}
                        <div className="pm-form-actions">
                            <button type="submit" className="pm-btn pm-btn-primary" disabled={notice.sending}>
                                <Send size={16} /> {notice.sending ? "Sending…" : "Send notification"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {form && (
                <div className="pm-drawer-backdrop" onClick={() => !saving && setForm(null)}>
                    <form
                        ref={drawerRef}
                        tabIndex={-1}
                        className="pm-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pm-drawer-title"
                        onSubmit={submit}
                        onClick={(e) => e.stopPropagation()}
                        noValidate
                    >
                        <div className="pm-drawer-head">
                            <h2 id="pm-drawer-title">{form.id ? "Edit promotion" : "New promotion"}</h2>
                            <button type="button" className="pm-icon-btn" onClick={() => setForm(null)} aria-label="Close" disabled={saving}><X size={18} /></button>
                        </div>

                        <div className="pm-drawer-body">
                            <section className="pm-section">
                                <h3><span>1</span> Images and videos</h3>
                                <div
                                    className="pm-drop"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                                >
                                    <Upload size={22} aria-hidden="true" />
                                    <p>Drag files here or <button type="button" className="pm-link" onClick={() => fileInputRef.current?.click()}>browse</button></p>
                                    <small>Several files become a carousel · up to {MAX_FILES} at a time · 200 MB each</small>
                                    <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                                </div>
                                {(form.existingMedia.length > 0 || newPreviews.length > 0) && (
                                    <ul className="pm-thumbs">
                                        {form.existingMedia.map((item) => {
                                            const removed = form.removeMediaIds.includes(item._id);
                                            return (
                                                <li key={item._id} className={removed ? "is-removed" : ""}>
                                                    {item.type === "video" ? <video src={promoMediaUrl(item.url)} muted preload="metadata" /> : <img src={promoMediaUrl(item.url)} alt={item.name || ""} />}
                                                    {item.type === "video" && <span className="pm-thumb-badge"><Film size={11} /> Video</span>}
                                                    <button type="button" className="pm-thumb-remove" onClick={() => update({ removeMediaIds: removed ? form.removeMediaIds.filter((id) => id !== item._id) : [...form.removeMediaIds, item._id] })} aria-label={removed ? `Keep ${item.name || "file"}` : `Remove ${item.name || "file"}`}>
                                                        {removed ? "Undo" : <X size={13} />}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        {newPreviews.map(({ file, url }, i) => (
                                            <li key={`${file.name}-${i}`} className="is-new">
                                                {file.type.startsWith("video/") ? <video src={url} muted preload="metadata" /> : <img src={url} alt={file.name} />}
                                                <span className="pm-thumb-badge">{file.type.startsWith("video/") ? <Film size={11} /> : <ImagePlus size={11} />} {formatSize(file.size)}</span>
                                                <button type="button" className="pm-thumb-remove" onClick={() => update({ newFiles: form.newFiles.filter((_, idx) => idx !== i) })} aria-label={`Remove ${file.name}`}><X size={13} /></button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>

                            <section className="pm-section">
                                <h3><span>2</span> Details</h3>
                                <label className="pm-field">
                                    <span>Title</span>
                                    <input className="pm-input" value={form.title} maxLength={120} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Diwali greetings" />
                                </label>
                                <label className="pm-field">
                                    <span>Message</span>
                                    <textarea className="pm-input" rows={3} value={form.message} maxLength={1000} onChange={(e) => update({ message: e.target.value })} placeholder="Shown under the carousel and used as the notification text" />
                                </label>
                            </section>

                            {isPlatform && (
                                <section className="pm-section">
                                    <h3><span>3</span> Who sees it</h3>
                                    <div className="pm-options" role="radiogroup" aria-label="Who sees it">
                                        <label className={`pm-option ${form.audience === "public" ? "is-on" : ""}`}>
                                            <input type="radio" name="audience" checked={form.audience === "public"} onChange={() => update({ audience: "public" })} />
                                            <Globe2 size={20} aria-hidden="true" />
                                            <span><strong>Before login</strong><small>Everyone, on the login screens of the website and app</small></span>
                                        </label>
                                        <label className={`pm-option ${form.audience === "companies" ? "is-on" : ""}`}>
                                            <input type="radio" name="audience" checked={form.audience === "companies"} onChange={() => update({ audience: "companies" })} />
                                            <Building2 size={20} aria-hidden="true" />
                                            <span><strong>After login</strong><small>A popup for employees of the companies you pick</small></span>
                                        </label>
                                    </div>
                                    {form.audience === "companies" && (
                                        <CompanyPicker
                                            companies={companies}
                                            allCompanies={form.allCompanies}
                                            selected={form.companyIds}
                                            onAll={(value) => update({ allCompanies: value })}
                                            onToggle={(id) => update({ companyIds: form.companyIds.includes(id) ? form.companyIds.filter((x) => x !== id) : [...form.companyIds, id] })}
                                            disabled={saving}
                                        />
                                    )}
                                </section>
                            )}

                            <section className="pm-section">
                                <h3><span>{isPlatform ? 4 : 3}</span> Schedule</h3>
                                <label className="pm-field">
                                    <span>Show until <em>*</em></span>
                                    <input className="pm-input" type="datetime-local" value={form.endAt} min={toLocalInput(new Date())} onChange={(e) => update({ endAt: e.target.value })} required />
                                </label>
                                {!form.id && (
                                    <label className="pm-switch pm-switch-block">
                                        <input type="checkbox" checked={form.notify} onChange={(e) => update({ notify: e.target.checked })} />
                                        <span className="pm-switch-track" aria-hidden="true" />
                                        <span>
                                            <strong>Also send a push notification</strong>
                                            <small>{isPlatform && form.audience === "public" ? "Goes to employees of every company" : isPlatform ? "Goes to the companies selected above" : "Goes to everyone in your company"}</small>
                                        </span>
                                    </label>
                                )}
                            </section>
                        </div>

                        <div className="pm-drawer-foot">
                            {saving && (
                                <div className="pm-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                                    <span style={{ width: `${progress}%` }} />
                                    <small>{progress < 100 ? `Uploading ${progress}%` : "Saving…"}</small>
                                </div>
                            )}
                            <button type="button" className="pm-btn pm-btn-ghost" onClick={() => setFormPreview(true)} disabled={!formSlides.length} title={formSlides.length ? "See it the way people will" : "Add an image or video first"}>
                                <Eye size={16} /> Preview
                            </button>
                            <span className="pm-spacer" />
                            <button type="button" className="pm-btn" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
                            <button type="submit" className="pm-btn pm-btn-primary" disabled={saving}>
                                {saving ? "Saving…" : form.id ? "Save changes" : "Publish"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {preview && <PromoLightbox slides={slidesFromPromos([preview])} onClose={() => setPreview(null)} label="Preview" />}
            {formPreview && formSlides.length > 0 && <PromoLightbox slides={formSlides} onClose={() => setFormPreview(false)} label="Preview" />}
        </div>
    );
};

export default PromoManager;
