import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, CalendarClock, Eye, Film, ImagePlus, Pause, Pencil, Play, Plus, Search, Send, Trash2, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import PromoCarousel, { slidesFromPromos } from "./PromoCarousel";
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
const STATUS_LABEL = { live: "Live", scheduled: "Scheduled", expired: "Expired", paused: "Paused" };

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

const audienceText = (promo, scope) => {
    if (scope === "company") return "Your company · after login";
    if (promo.audience === "public") return "Everyone · before login";
    if (promo.allCompanies) return "All companies · after login";
    const names = (promo.companyIds || []).map((c) => c?.companyName || c?.companyCode).filter(Boolean);
    return `${names.length} compan${names.length === 1 ? "y" : "ies"} · after login${names.length ? ` (${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""})` : ""}`;
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
    return (
        <div className="promo-company-picker">
            <label className="promo-check">
                <input type="checkbox" checked={allCompanies} onChange={(e) => onAll(e.target.checked)} disabled={disabled} />
                <span>All companies</span>
            </label>
            {!allCompanies && (
                <>
                    <div className="promo-search">
                        <Search size={16} aria-hidden="true" />
                        <input type="search" placeholder="Search company name or code" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search companies" />
                    </div>
                    <div className="promo-company-list" role="group" aria-label="Companies">
                        {list.map((company) => (
                            <label key={company._id} className="promo-check">
                                <input type="checkbox" checked={selectedSet.has(company._id)} onChange={() => onToggle(company._id)} disabled={disabled} />
                                <span>{company.companyName || company.companyCode}</span>
                                <small>{company.companyCode}{company.isActive ? "" : " · inactive"}</small>
                            </label>
                        ))}
                        {!list.length && <p className="promo-muted">No company matches “{query}”.</p>}
                    </div>
                    <p className="promo-muted">{selected.length} selected</p>
                </>
            )}
        </div>
    );
};

const PromoManager = ({ scope = "company" }) => {
    const isPlatform = scope === "platform";
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState(null);
    const [busyId, setBusyId] = useState("");
    const [notice, setNotice] = useState({ title: "", body: "", allCompanies: false, companyIds: [], sending: false });
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

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
        if (isPlatform) fetchPromoCompanies().then(setCompanies).catch(() => toast.error("Could not load companies"));
    }, [isPlatform]);

    // Object URLs for picked files, released when the list changes.
    const newPreviews = useMemo(() => (form?.newFiles || []).map((file) => ({ file, url: URL.createObjectURL(file) })), [form?.newFiles]);
    useEffect(() => () => newPreviews.forEach((item) => URL.revokeObjectURL(item.url)), [newPreviews]);

    const openCreate = () => {
        setForm(emptyForm());
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    const openEdit = (promo) => {
        setForm({
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
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
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

    const togglePause = async (promo) => {
        setBusyId(promo._id);
        try {
            await setPromoActive(scope, promo._id, !promo.isActive);
            toast.success(promo.isActive ? "Paused — hidden until resumed" : "Resumed");
            load();
        } catch (error) {
            toast.error(errorMessage(error, "Could not update"));
        } finally {
            setBusyId("");
        }
    };
    const sendNotify = async (promo) => {
        if (!window.confirm(`Send a push notification for “${promo.title || "this promotion"}” to ${audienceText(promo, scope)}?`)) return;
        setBusyId(promo._id);
        try {
            const result = await notifyPromo(scope, promo._id);
            toast.success(notifyText(result.notify));
            load();
        } catch (error) {
            toast.error(errorMessage(error, "Could not send the notification"));
        } finally {
            setBusyId("");
        }
    };
    const remove = async (promo) => {
        if (!window.confirm(`Delete “${promo.title || "this promotion"}”? Its images and videos are removed too.`)) return;
        setBusyId(promo._id);
        try {
            await deletePromo(scope, promo._id);
            toast.success("Promotion deleted");
            if (form?.id === promo._id) setForm(null);
            load();
        } catch (error) {
            toast.error(errorMessage(error, "Could not delete"));
        } finally {
            setBusyId("");
        }
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

    return (
        <div className="promo-manager">
            <header className="promo-head">
                <div>
                    <h1>Promotions</h1>
                    <p className="promo-muted">
                        {isPlatform
                            ? "Images and videos shown as a carousel — before login to everyone, or after login to the companies you choose."
                            : "Images and videos shown as a popup to your company's employees after they log in."}
                    </p>
                </div>
                {!form && (
                    <button type="button" className="promo-btn promo-btn--primary" onClick={openCreate}>
                        <Plus size={18} /> New promotion
                    </button>
                )}
            </header>

            {form && (
                <form ref={formRef} className="promo-card promo-form" onSubmit={submit} noValidate>
                    <div className="promo-form-head">
                        <h2>{form.id ? "Edit promotion" : "New promotion"}</h2>
                        <button type="button" className="promo-icon-btn" onClick={() => setForm(null)} aria-label="Close form" disabled={saving}><X size={18} /></button>
                    </div>

                    <div className="promo-field">
                        <span className="promo-label">Images and videos <em>*</em></span>
                        <div
                            className="promo-drop"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                        >
                            <Upload size={22} aria-hidden="true" />
                            <p>Drag files here or <button type="button" className="promo-link" onClick={() => fileInputRef.current?.click()}>choose files</button></p>
                            <p className="promo-muted">Several files become a carousel · up to {MAX_FILES} at a time · 200 MB each</p>
                            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                        </div>
                        {(form.existingMedia.length > 0 || newPreviews.length > 0) && (
                            <ul className="promo-thumbs">
                                {form.existingMedia.map((item) => {
                                    const removed = form.removeMediaIds.includes(item._id);
                                    return (
                                        <li key={item._id} className={removed ? "is-removed" : ""}>
                                            {item.type === "video" ? <video src={promoMediaUrl(item.url)} muted preload="metadata" /> : <img src={promoMediaUrl(item.url)} alt={item.name || ""} />}
                                            {item.type === "video" && <span className="promo-thumb-badge"><Film size={12} /> Video</span>}
                                            <button type="button" className="promo-thumb-remove" onClick={() => update({ removeMediaIds: removed ? form.removeMediaIds.filter((id) => id !== item._id) : [...form.removeMediaIds, item._id] })} aria-label={removed ? `Keep ${item.name || "file"}` : `Remove ${item.name || "file"}`}>
                                                {removed ? "Undo" : <X size={14} />}
                                            </button>
                                        </li>
                                    );
                                })}
                                {newPreviews.map(({ file, url }, i) => (
                                    <li key={`${file.name}-${i}`} className="is-new">
                                        {file.type.startsWith("video/") ? <video src={url} muted preload="metadata" /> : <img src={url} alt={file.name} />}
                                        <span className="promo-thumb-badge">{file.type.startsWith("video/") ? <><Film size={12} /> Video</> : <><ImagePlus size={12} /> New</>} · {formatSize(file.size)}</span>
                                        <button type="button" className="promo-thumb-remove" onClick={() => update({ newFiles: form.newFiles.filter((_, idx) => idx !== i) })} aria-label={`Remove ${file.name}`}><X size={14} /></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="promo-grid">
                        <label className="promo-field">
                            <span className="promo-label">Title</span>
                            <input className="promo-input" value={form.title} maxLength={120} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Diwali greetings" />
                        </label>
                        <label className="promo-field">
                            <span className="promo-label">Show until <em>*</em></span>
                            <input className="promo-input" type="datetime-local" value={form.endAt} min={toLocalInput(new Date())} onChange={(e) => update({ endAt: e.target.value })} required />
                        </label>
                    </div>
                    <label className="promo-field">
                        <span className="promo-label">Message</span>
                        <textarea className="promo-input" rows={3} value={form.message} maxLength={1000} onChange={(e) => update({ message: e.target.value })} placeholder="Shown under the carousel and used as the notification text" />
                    </label>

                    {isPlatform && (
                        <fieldset className="promo-field promo-fieldset">
                            <legend className="promo-label">Who sees it <em>*</em></legend>
                            <label className="promo-radio">
                                <input type="radio" name="audience" checked={form.audience === "public"} onChange={() => update({ audience: "public" })} />
                                <span><strong>Before login — everyone</strong><small>On the login screens of the website and the app</small></span>
                            </label>
                            <label className="promo-radio">
                                <input type="radio" name="audience" checked={form.audience === "companies"} onChange={() => update({ audience: "companies" })} />
                                <span><strong>After login — selected companies</strong><small>A popup for employees of the companies you pick</small></span>
                            </label>
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
                        </fieldset>
                    )}

                    {!form.id && (
                        <label className="promo-check promo-check--notify">
                            <input type="checkbox" checked={form.notify} onChange={(e) => update({ notify: e.target.checked })} />
                            <span>
                                <strong>Also send a push notification</strong>
                                <small>{isPlatform && form.audience === "public" ? "Goes to employees of every company" : isPlatform ? "Goes to the companies selected above" : "Goes to everyone in your company"}</small>
                            </span>
                        </label>
                    )}

                    {saving && (
                        <div className="promo-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                            <span style={{ width: `${progress}%` }} />
                            <small>{progress < 100 ? `Uploading ${progress}%` : "Saving…"}</small>
                        </div>
                    )}
                    <div className="promo-actions">
                        <button type="button" className="promo-btn" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
                        <button type="submit" className="promo-btn promo-btn--primary" disabled={saving}>
                            {saving ? "Saving…" : form.id ? "Save changes" : "Publish"}
                        </button>
                    </div>
                </form>
            )}

            <section aria-labelledby="promo-list-title">
                <h2 id="promo-list-title" className="promo-section-title">Your promotions</h2>
                {loading ? (
                    <p className="promo-muted">Loading…</p>
                ) : !promos.length ? (
                    <div className="promo-card promo-empty">
                        <ImagePlus size={28} aria-hidden="true" />
                        <p>No promotions yet.</p>
                        {!form && <button type="button" className="promo-btn promo-btn--primary" onClick={openCreate}><Plus size={18} /> New promotion</button>}
                    </div>
                ) : (
                    <ul className="promo-list">
                        {promos.map((promo) => {
                            const first = promo.media?.[0];
                            const busy = busyId === promo._id;
                            return (
                                <li key={promo._id} className="promo-card promo-item">
                                    <button type="button" className="promo-item-thumb" onClick={() => setPreview(promo)} aria-label={`Preview ${promo.title || "promotion"}`}>
                                        {first?.type === "video" ? <video src={promoMediaUrl(first.url)} muted preload="metadata" /> : first ? <img src={promoMediaUrl(first.url)} alt="" /> : null}
                                        <span className="promo-item-count">{promo.media?.length || 0} <Eye size={12} /></span>
                                    </button>
                                    <div className="promo-item-body">
                                        <div className="promo-item-top">
                                            <strong>{promo.title || "Untitled"}</strong>
                                            <span className={`promo-status promo-status--${promo.status}`}>{STATUS_LABEL[promo.status] || promo.status}</span>
                                        </div>
                                        <p className="promo-muted">{audienceText(promo, scope)}</p>
                                        <p className="promo-muted"><CalendarClock size={14} aria-hidden="true" /> Until {formatDate(promo.endAt)}</p>
                                        {promo.lastNotifiedAt && <p className="promo-muted"><BellRing size={14} aria-hidden="true" /> Notified {formatDate(promo.lastNotifiedAt)}</p>}
                                    </div>
                                    <div className="promo-item-actions">
                                        <button type="button" className="promo-btn promo-btn--sm" onClick={() => openEdit(promo)} disabled={busy}><Pencil size={15} /> Edit</button>
                                        <button type="button" className="promo-btn promo-btn--sm" onClick={() => togglePause(promo)} disabled={busy}>
                                            {promo.isActive ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Resume</>}
                                        </button>
                                        <button type="button" className="promo-btn promo-btn--sm" onClick={() => sendNotify(promo)} disabled={busy}><Send size={15} /> Notify</button>
                                        <button type="button" className="promo-btn promo-btn--sm promo-btn--danger" onClick={() => remove(promo)} disabled={busy}><Trash2 size={15} /> Delete</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="promo-card promo-form" aria-labelledby="promo-notify-title">
                <h2 id="promo-notify-title"><BellRing size={18} aria-hidden="true" /> Send a notification only</h2>
                <p className="promo-muted">{isPlatform ? "A push notification to the companies you choose, without a promotion." : "A push notification to everyone in your company."}</p>
                <form onSubmit={sendNotice} noValidate>
                    <div className="promo-grid">
                        <label className="promo-field">
                            <span className="promo-label">Title <em>*</em></span>
                            <input className="promo-input" value={notice.title} maxLength={120} onChange={(e) => setNotice((p) => ({ ...p, title: e.target.value }))} />
                        </label>
                        <label className="promo-field">
                            <span className="promo-label">Message <em>*</em></span>
                            <input className="promo-input" value={notice.body} maxLength={500} onChange={(e) => setNotice((p) => ({ ...p, body: e.target.value }))} />
                        </label>
                    </div>
                    {isPlatform && (
                        <CompanyPicker
                            companies={companies}
                            allCompanies={notice.allCompanies}
                            selected={notice.companyIds}
                            onAll={(value) => setNotice((p) => ({ ...p, allCompanies: value }))}
                            onToggle={(id) => setNotice((p) => ({ ...p, companyIds: p.companyIds.includes(id) ? p.companyIds.filter((x) => x !== id) : [...p.companyIds, id] }))}
                            disabled={notice.sending}
                        />
                    )}
                    <div className="promo-actions">
                        <button type="submit" className="promo-btn promo-btn--primary" disabled={notice.sending}>
                            <Send size={16} /> {notice.sending ? "Sending…" : "Send notification"}
                        </button>
                    </div>
                </form>
            </section>

            {preview && (
                <div className="promo-popup-backdrop" onClick={() => setPreview(null)}>
                    <div className="promo-popup" role="dialog" aria-modal="true" aria-label="Preview" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="promo-popup-close" onClick={() => setPreview(null)} aria-label="Close preview"><X size={20} /></button>
                        <PromoCarousel slides={slidesFromPromos([preview])} variant="popup" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromoManager;
