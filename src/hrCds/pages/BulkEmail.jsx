import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "../../utils/axiosConfig";
import "./BulkEmail.css";

const EMPTY_CONTENT = {
  mode: "simple",
  subject: "",
  heading: "",
  subheading: "",
  body: "",
  buttonText: "",
  buttonUrl: "",
  footer: "",
  html: "",
};
const CONTENT_FIELDS = Object.keys(EMPTY_CONTENT);
const SAMPLE_RECIPIENT = { name: "Anil Kumar", email: "anil@example.com" };
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const STARTER_HTML = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
  <h1 style="color:#1e3a8a">Hello {{name}}</h1>
  <p>Write your message here.</p>
</div>`;

const errorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
const pickContent = (source = {}) => CONTENT_FIELDS.reduce((acc, key) => ({ ...acc, [key]: source[key] ?? EMPTY_CONTENT[key] }), {});

// Splits pasted text ("Name <a@b.com>, c@d.com") into addresses.
const parseAddresses = (text) => String(text || "")
  .split(/[\n,;]+/)
  .map((part) => {
    const match = part.match(/<([^>]+)>/);
    return (match ? match[1] : part).trim().toLowerCase();
  })
  .filter(Boolean);

/* ---------- Shared pieces ---------- */

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`be-toast be-toast-${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
}

function UsageMeter({ label, used, limit }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const tone = percent >= 100 ? "full" : percent >= 80 ? "high" : "ok";
  return (
    <div className="be-usage">
      <div className="be-usage-top">
        <span>{label}</span>
        <strong>{used} / {limit}</strong>
      </div>
      <div className="be-usage-bar"><span className={`be-usage-fill be-usage-${tone}`} style={{ width: `${percent}%` }} /></div>
      <small>{Math.max(0, limit - used)} left</small>
    </div>
  );
}

const escapeHtml = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Renders exactly what will be sent (the server builds simple-mode HTML), filled in for one recipient.
function EmailPreview({ content, sample }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (content.mode === "html") {
      setHtml(content.html || "");
      return undefined;
    }
    const timer = setTimeout(() => {
      axios.post("/bulk-email/preview", content).then((res) => setHtml(res.data.html || "")).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [content]);
  const fill = (text, asHtml) => String(text || "")
    .replace(/{{\s*name\s*}}/gi, asHtml ? escapeHtml(sample?.name || "") : (sample?.name || ""))
    .replace(/{{\s*email\s*}}/gi, sample?.email || "");
  return (
    <div className="be-preview">
      <div className="be-preview-head">
        <span>{sample ? `Preview for ${sample.name || sample.email}` : "Preview"}</span>
        <small>{fill(content.subject, false) || "(no subject)"}</small>
      </div>
      <iframe title="Email preview" sandbox="" srcDoc={html ? fill(html, true) : "<p style='font-family:Arial;color:#94a3b8;padding:24px'>Start writing to see the email here.</p>"} />
    </div>
  );
}

function ContentEditor({ value, onChange }) {
  const set = (field) => (event) => onChange({ ...value, [field]: event.target.value });
  const setMode = (mode) => onChange({ ...value, mode, html: mode === "html" && !value.html ? STARTER_HTML : value.html });
  return (
    <div className="be-editor">
      <div className="be-mode" role="tablist" aria-label="Email format">
        <button type="button" role="tab" aria-selected={value.mode === "simple"} className={value.mode === "simple" ? "active" : ""} onClick={() => setMode("simple")}>Simple</button>
        <button type="button" role="tab" aria-selected={value.mode === "html"} className={value.mode === "html" ? "active" : ""} onClick={() => setMode("html")}>HTML</button>
      </div>
      <label className="be-field">
        <span>Subject *</span>
        <input value={value.subject} onChange={set("subject")} maxLength={250} placeholder="e.g. Diwali offer for {{name}}" />
      </label>
      {value.mode === "simple" ? (
        <>
          <label className="be-field">
            <span>Heading</span>
            <input value={value.heading} onChange={set("heading")} maxLength={250} placeholder="Big title at the top of the email" />
          </label>
          <label className="be-field">
            <span>Sub-heading</span>
            <input value={value.subheading} onChange={set("subheading")} maxLength={500} placeholder="Short line under the heading" />
          </label>
          <label className="be-field">
            <span>Message</span>
            <textarea rows={7} value={value.body} onChange={set("body")} placeholder={"Hi {{name}},\n\nWrite your message. Leave a blank line between paragraphs."} />
          </label>
          <div className="be-row">
            <label className="be-field">
              <span>Button text</span>
              <input value={value.buttonText} onChange={set("buttonText")} maxLength={80} placeholder="e.g. Visit website" />
            </label>
            <label className="be-field">
              <span>Button link</span>
              <input value={value.buttonUrl} onChange={set("buttonUrl")} placeholder="https://..." />
            </label>
          </div>
          <label className="be-field">
            <span>Footer</span>
            <textarea rows={2} value={value.footer} onChange={set("footer")} placeholder="Address, contact details, unsubscribe note" />
          </label>
        </>
      ) : (
        <label className="be-field">
          <span>HTML</span>
          <textarea className="be-code" rows={16} value={value.html} onChange={set("html")} spellCheck={false} />
        </label>
      )}
      <p className="be-hint">Use <code>{"{{name}}"}</code> and <code>{"{{email}}"}</code> to personalise each email.</p>
    </div>
  );
}

/* ---------- Compose ---------- */

function RecipientPicker({ recipients, setRecipients, notify }) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => {
      axios.get("/bulk-email/contacts", { params: { search, limit: 100 } })
        .then((res) => setContacts(res.data.contacts || []))
        .catch((error) => notify("error", errorMessage(error, "Could not load contacts")));
    }, 250);
    return () => clearTimeout(timer);
  }, [open, search, notify]);

  const has = (email) => recipients.some((item) => item.email === email);
  const addText = (text) => {
    const addresses = parseAddresses(text);
    if (!addresses.length) return;
    const bad = addresses.filter((email) => !EMAIL_PATTERN.test(email));
    if (bad.length) {
      notify("error", `Not a valid email: ${bad.slice(0, 3).join(", ")}`);
      setDraft(text);
      return;
    }
    setRecipients((prev) => [...prev, ...addresses.filter((email) => !prev.some((item) => item.email === email)).map((email) => ({ email, name: "" }))]);
    setDraft("");
  };
  const toggle = (contact) => setRecipients((prev) => (has(contact.email)
    ? prev.filter((item) => item.email !== contact.email)
    : [...prev, { email: contact.email, name: contact.name || "" }]));
  const allShown = contacts.length > 0 && contacts.every((contact) => has(contact.email));
  const toggleAll = () => setRecipients((prev) => (allShown
    ? prev.filter((item) => !contacts.some((contact) => contact.email === item.email))
    : [...prev, ...contacts.filter((contact) => !prev.some((item) => item.email === contact.email)).map((contact) => ({ email: contact.email, name: contact.name || "" }))]));

  return (
    <div className="be-recipients">
      <div className="be-recipients-head">
        <span>To * <small>({recipients.length} selected)</small></span>
        <div className="be-inline-actions">
          <button type="button" className="be-link" onClick={() => setOpen((prev) => !prev)}>{open ? "Hide contacts" : "Choose from contacts"}</button>
          {recipients.length > 0 && <button type="button" className="be-link be-danger" onClick={() => setRecipients([])}>Clear all</button>}
        </div>
      </div>
      <div className="be-chips">
        {recipients.map((item) => (
          <span key={item.email} className="be-chip">
            {item.name ? `${item.name} · ` : ""}{item.email}
            <button type="button" onClick={() => setRecipients((prev) => prev.filter((x) => x.email !== item.email))} aria-label={`Remove ${item.email}`}>×</button>
          </span>
        ))}
        <input
          className="be-chip-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addText(draft); } }}
          onBlur={() => addText(draft)}
          onPaste={(event) => { const text = event.clipboardData.getData("text"); if (/[\n,;]/.test(text)) { event.preventDefault(); addText(text); } }}
          placeholder={recipients.length ? "Add more…" : "Type an email and press Enter, or paste a list"}
        />
      </div>
      {open && (
        <div className="be-contact-picker">
          <div className="be-picker-bar">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts" />
            <button type="button" className="be-link" onClick={toggleAll} disabled={!contacts.length}>{allShown ? "Unselect shown" : "Select all shown"}</button>
          </div>
          <div className="be-picker-list">
            {contacts.length ? contacts.map((contact) => (
              <label key={contact._id} className="be-picker-item">
                <input type="checkbox" checked={has(contact.email)} onChange={() => toggle(contact)} />
                <span><strong>{contact.name || contact.email}</strong>{contact.name && <small>{contact.email}</small>}</span>
              </label>
            )) : <p className="be-empty">No contacts found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ComposeTab({ initialTemplate, templates, refreshTemplates, usage, refreshUsage, notify, onSent }) {
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [recipients, setRecipients] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const appliedTemplate = useRef("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearTimeout(pollRef.current), []);

  const chooseTemplate = useCallback((id) => {
    setTemplateId(id);
    const template = templates.find((item) => item._id === id);
    if (template) setContent(pickContent(template));
  }, [templates]);

  // "Use" on the Templates tab remounts Compose with that template.
  useEffect(() => {
    if (!initialTemplate || appliedTemplate.current === initialTemplate) return;
    if (!templates.some((item) => item._id === initialTemplate)) return;
    appliedTemplate.current = initialTemplate;
    chooseTemplate(initialTemplate);
  }, [chooseTemplate, initialTemplate, templates]);

  const poll = useCallback((campaignId) => {
    axios.get(`/bulk-email/campaigns/${campaignId}`).then((res) => {
      const campaign = res.data.campaign;
      setResult(campaign);
      if (campaign.status === "completed") {
        setSending(false);
        refreshUsage();
        onSent();
        notify(campaign.failedCount ? "warning" : "success", `Sent ${campaign.sentCount} of ${campaign.recipients.length}${campaign.failedCount ? ` · ${campaign.failedCount} failed` : ""}`);
      } else {
        pollRef.current = setTimeout(() => poll(campaignId), 1200);
      }
    }).catch(() => { pollRef.current = setTimeout(() => poll(campaignId), 2500); });
  }, [notify, onSent, refreshUsage]);

  const send = async () => {
    if (!recipients.length) return notify("error", "Add at least one recipient");
    if (!content.subject.trim()) return notify("error", "Subject is required");
    if (content.mode === "html" ? !content.html.trim() : !content.body.trim() && !content.heading.trim()) {
      return notify("error", content.mode === "html" ? "HTML content is required" : "Write a heading or message");
    }
    if (usage && recipients.length > Math.min(usage.remaining.daily, usage.remaining.monthly)) {
      return notify("error", `Only ${Math.min(usage.remaining.daily, usage.remaining.monthly)} emails left in your limit`);
    }
    if (!window.confirm(`Send "${content.subject}" to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}?`)) return undefined;
    setSending(true);
    setResult(null);
    try {
      const template = templates.find((item) => item._id === templateId);
      const res = await axios.post("/bulk-email/send", { ...content, recipients, templateId: templateId || undefined, templateName: template?.name || "" });
      poll(res.data.campaignId);
    } catch (error) {
      setSending(false);
      notify("error", errorMessage(error, "Could not send"));
    }
    return undefined;
  };

  const saveAsTemplate = async () => {
    const name = window.prompt("Template name", templates.find((item) => item._id === templateId)?.name || "");
    if (!name || !name.trim()) return;
    try {
      const res = await axios.post("/bulk-email/templates", { ...content, name: name.trim() });
      await refreshTemplates();
      setTemplateId(res.data.template._id);
      notify("success", "Template saved");
    } catch (error) {
      notify("error", errorMessage(error, "Could not save template"));
    }
  };

  const reset = () => { setContent(EMPTY_CONTENT); setRecipients([]); setTemplateId(""); setResult(null); };

  return (
    <div className="be-compose">
      <div className="be-panel">
        <label className="be-field">
          <span>Template</span>
          <select value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>
            <option value="">Start from scratch</option>
            {templates.map((template) => <option key={template._id} value={template._id}>{template.name}</option>)}
          </select>
        </label>
        <RecipientPicker recipients={recipients} setRecipients={setRecipients} notify={notify} />
        <ContentEditor value={content} onChange={setContent} />
        <div className="be-actions">
          <button type="button" className="be-btn be-btn-primary" onClick={send} disabled={sending}>
            {sending ? "Sending…" : `Send${recipients.length ? ` to ${recipients.length}` : ""}`}
          </button>
          <button type="button" className="be-btn" onClick={saveAsTemplate} disabled={sending}>Save as template</button>
          <button type="button" className="be-btn be-btn-ghost" onClick={reset} disabled={sending}>Clear</button>
        </div>
        {result && (
          <div className={`be-result ${result.status === "completed" ? "done" : ""}`}>
            <strong>{result.status === "completed" ? "Finished" : "Sending…"}</strong>
            <span>{result.recipients.filter((item) => item.status === "sent").length} sent · {result.recipients.filter((item) => item.status === "failed").length} failed · {result.recipients.filter((item) => item.status === "pending").length} waiting</span>
            {result.recipients.filter((item) => item.status === "failed").map((item) => (
              <small key={item.email} className="be-failed-line">{item.email}: {item.error}</small>
            ))}
          </div>
        )}
      </div>
      <EmailPreview content={content} sample={recipients[0] || SAMPLE_RECIPIENT} />
    </div>
  );
}

/* ---------- Contacts ---------- */

function ContactsTab({ notify, onShowHistory }) {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [bulk, setBulk] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (nextPage = page) => {
    setLoading(true);
    try {
      const res = await axios.get("/bulk-email/contacts", { params: { search, page: nextPage, limit: 20 } });
      setContacts(res.data.contacts || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setPage(res.data.page || nextPage);
    } catch (error) {
      notify("error", errorMessage(error, "Could not load contacts"));
    } finally {
      setLoading(false);
    }
  }, [notify, page, search]);

  useEffect(() => { const timer = setTimeout(() => load(1), 250); return () => clearTimeout(timer); }, [search]);

  const add = async (payload, after) => {
    try {
      const res = await axios.post("/bulk-email/contacts", payload);
      notify("success", `${res.data.message}${res.data.skipped ? ` · ${res.data.skipped} already saved` : ""}`);
      after();
      load(1);
    } catch (error) {
      notify("error", errorMessage(error, "Could not add contact"));
    }
  };

  const saveEdit = async () => {
    try {
      await axios.put(`/bulk-email/contacts/${editing._id}`, { name: editing.name, email: editing.email });
      setEditing(null);
      load(page);
    } catch (error) {
      notify("error", errorMessage(error, "Could not save contact"));
    }
  };

  const remove = async (contact) => {
    if (!window.confirm(`Delete ${contact.email} from contacts?`)) return;
    try {
      await axios.delete(`/bulk-email/contacts/${contact._id}`);
      load(page);
    } catch (error) {
      notify("error", errorMessage(error, "Could not delete contact"));
    }
  };

  return (
    <div className="be-two-col">
      <div className="be-panel">
        <h3>Add contact</h3>
        <form className="be-stack" onSubmit={(event) => { event.preventDefault(); add({ name: form.name, email: form.email }, () => setForm({ name: "", email: "" })); }}>
          <label className="be-field"><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="be-field"><span>Email *</span><input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <button type="submit" className="be-btn be-btn-primary">Add</button>
        </form>
        <h3>Add many at once</h3>
        <form className="be-stack" onSubmit={(event) => { event.preventDefault(); add({ emails: bulk }, () => setBulk("")); }}>
          <label className="be-field">
            <span>Paste emails (comma or new line)</span>
            <textarea rows={5} value={bulk} onChange={(event) => setBulk(event.target.value)} placeholder={"anil@example.com\nBina Rao <bina@example.com>"} />
          </label>
          <button type="submit" className="be-btn" disabled={!bulk.trim()}>Add all</button>
        </form>
      </div>
      <div className="be-panel">
        <div className="be-list-head">
          <h3>Contacts <small>({total})</small></h3>
          <input className="be-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" />
        </div>
        {loading && !contacts.length ? <p className="be-empty">Loading…</p> : null}
        {!loading && !contacts.length ? <p className="be-empty">No contacts yet. Add one, or they are saved automatically when you send.</p> : null}
        <ul className="be-list">
          {contacts.map((contact) => (
            <li key={contact._id} className="be-list-item">
              {editing?._id === contact._id ? (
                <div className="be-edit-row">
                  <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="Name" />
                  <input value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} />
                  <button type="button" className="be-btn be-btn-primary be-btn-sm" onClick={saveEdit}>Save</button>
                  <button type="button" className="be-btn be-btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="be-list-main">
                    <strong>{contact.name || "—"}</strong>
                    <span>{contact.email}</span>
                  </div>
                  <div className="be-inline-actions">
                    <button type="button" className="be-link" onClick={() => onShowHistory(contact.email)}>History</button>
                    <button type="button" className="be-link" onClick={() => setEditing({ _id: contact._id, name: contact.name || "", email: contact.email })}>Edit</button>
                    <button type="button" className="be-link be-danger" onClick={() => remove(contact)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {pages > 1 && (
          <div className="be-pager">
            <button type="button" className="be-btn be-btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button type="button" className="be-btn be-btn-sm" disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Templates ---------- */

function TemplatesTab({ templates, refreshTemplates, notify, onUse }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!editing.name.trim()) return notify("error", "Template name is required");
    setSaving(true);
    try {
      const payload = { ...pickContent(editing), name: editing.name.trim() };
      if (editing._id) await axios.put(`/bulk-email/templates/${editing._id}`, payload);
      else await axios.post("/bulk-email/templates", payload);
      await refreshTemplates();
      setEditing(null);
      notify("success", "Template saved");
    } catch (error) {
      notify("error", errorMessage(error, "Could not save template"));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const remove = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    try {
      await axios.delete(`/bulk-email/templates/${template._id}`);
      await refreshTemplates();
    } catch (error) {
      notify("error", errorMessage(error, "Could not delete template"));
    }
  };

  if (editing) {
    return (
      <div className="be-compose">
        <div className="be-panel">
          <label className="be-field">
            <span>Template name *</span>
            <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} maxLength={120} />
          </label>
          <ContentEditor value={editing} onChange={(next) => setEditing({ ...editing, ...next })} />
          <div className="be-actions">
            <button type="button" className="be-btn be-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save template"}</button>
            <button type="button" className="be-btn be-btn-ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
          </div>
        </div>
        <EmailPreview content={editing} sample={SAMPLE_RECIPIENT} />
      </div>
    );
  }

  return (
    <div className="be-panel">
      <div className="be-list-head">
        <h3>Templates <small>({templates.length})</small></h3>
        <button type="button" className="be-btn be-btn-primary" onClick={() => setEditing({ ...EMPTY_CONTENT, name: "" })}>New template</button>
      </div>
      {!templates.length && <p className="be-empty">No templates yet. Create one here, or use “Save as template” while composing.</p>}
      <div className="be-template-grid">
        {templates.map((template) => (
          <div key={template._id} className="be-template-card">
            <div className="be-template-top">
              <strong>{template.name}</strong>
              <span className={`be-badge ${template.mode === "html" ? "be-badge-html" : ""}`}>{template.mode === "html" ? "HTML" : "Simple"}</span>
            </div>
            <p>{template.subject || "(no subject)"}</p>
            <small>Updated {formatDateTime(template.updatedAt)}</small>
            <div className="be-inline-actions">
              <button type="button" className="be-link" onClick={() => onUse(template._id)}>Use</button>
              <button type="button" className="be-link" onClick={() => setEditing({ ...pickContent(template), _id: template._id, name: template.name })}>Edit</button>
              <button type="button" className="be-link be-danger" onClick={() => remove(template)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- History ---------- */

const STATUS_LABEL = { sent: "Sent", failed: "Failed", pending: "Waiting" };

function CampaignDetail({ id, onClose, onShowRecipient }) {
  const [campaign, setCampaign] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    axios.get(`/bulk-email/campaigns/${id}`).then((res) => setCampaign(res.data.campaign)).catch(() => setCampaign(false));
  }, [id]);
  if (campaign === false) return <div className="be-panel"><p className="be-empty">Could not load this email.</p><button type="button" className="be-btn" onClick={onClose}>Back</button></div>;
  if (!campaign) return <div className="be-panel"><p className="be-empty">Loading…</p></div>;
  const rows = campaign.recipients.filter((item) => filter === "all" || item.status === filter);
  return (
    <div className="be-compose">
      <div className="be-panel">
        <button type="button" className="be-link" onClick={onClose}>← All sent emails</button>
        <h3>{campaign.subject}</h3>
        <p className="be-meta">Sent by {campaign.sentByName || "—"} · {formatDateTime(campaign.createdAt)}{campaign.templateName ? ` · Template: ${campaign.templateName}` : ""}</p>
        <div className="be-filter">
          {["all", "sent", "failed"].map((key) => (
            <button key={key} type="button" className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
              {key === "all" ? `All (${campaign.recipients.length})` : `${STATUS_LABEL[key]} (${campaign.recipients.filter((item) => item.status === key).length})`}
            </button>
          ))}
        </div>
        <ul className="be-list">
          {rows.map((item) => (
            <li key={item.email} className="be-list-item">
              <div className="be-list-main">
                <strong>{item.name || item.email}</strong>
                {item.name && <span>{item.email}</span>}
                {item.error && <span className="be-error-text">{item.error}</span>}
              </div>
              <div className="be-inline-actions">
                <span className={`be-status be-status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                <button type="button" className="be-link" onClick={() => onShowRecipient(item.email)}>All mails</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="be-preview">
        <div className="be-preview-head"><span>What was sent</span></div>
        <iframe title="Sent email" sandbox="" srcDoc={campaign.html} />
      </div>
    </div>
  );
}

function HistoryTab({ notify, recipientQuery, setRecipientQuery, refreshKey }) {
  const [view, setView] = useState(recipientQuery ? "recipient" : "campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [emailInput, setEmailInput] = useState(recipientQuery || "");
  const [recipientMails, setRecipientMails] = useState(null);

  const load = useCallback(async (nextPage = 1) => {
    try {
      const res = await axios.get("/bulk-email/campaigns", { params: { page: nextPage, limit: 20, search } });
      setCampaigns(res.data.campaigns || []);
      setPages(res.data.pages || 1);
      setPage(res.data.page || nextPage);
    } catch (error) {
      notify("error", errorMessage(error, "Could not load history"));
    }
  }, [notify, search]);

  useEffect(() => { const timer = setTimeout(() => load(1), 250); return () => clearTimeout(timer); }, [load, refreshKey]);

  const lookup = useCallback(async (email) => {
    const value = String(email || "").trim();
    if (!value) return;
    try {
      const res = await axios.get("/bulk-email/recipients/history", { params: { email: value } });
      setRecipientMails(res.data);
    } catch (error) {
      notify("error", errorMessage(error, "Could not load history for this email"));
    }
  }, [notify]);

  useEffect(() => {
    if (!recipientQuery) return;
    setView("recipient");
    setOpenId(null);
    setEmailInput(recipientQuery);
    lookup(recipientQuery);
    setRecipientQuery("");
  }, [lookup, recipientQuery, setRecipientQuery]);

  const showRecipient = (email) => { setOpenId(null); setView("recipient"); setEmailInput(email); lookup(email); };

  if (openId) return <CampaignDetail id={openId} onClose={() => setOpenId(null)} onShowRecipient={showRecipient} />;

  return (
    <div className="be-panel">
      <div className="be-filter">
        <button type="button" className={view === "campaigns" ? "active" : ""} onClick={() => setView("campaigns")}>Sent emails</button>
        <button type="button" className={view === "recipient" ? "active" : ""} onClick={() => setView("recipient")}>By email address</button>
      </div>
      {view === "campaigns" ? (
        <>
          <input className="be-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by subject" />
          {!campaigns.length && <p className="be-empty">Nothing sent yet.</p>}
          <ul className="be-list">
            {campaigns.map((campaign) => (
              <li key={campaign._id} className="be-list-item be-clickable" onClick={() => setOpenId(campaign._id)} onKeyDown={(event) => { if (event.key === "Enter") setOpenId(campaign._id); }} tabIndex={0} role="button">
                <div className="be-list-main">
                  <strong>{campaign.subject}</strong>
                  <span>{formatDateTime(campaign.createdAt)} · by {campaign.sentByName || "—"}{campaign.templateName ? ` · ${campaign.templateName}` : ""}</span>
                </div>
                <div className="be-inline-actions">
                  <span className="be-count">{campaign.recipientCount} to</span>
                  <span className="be-status be-status-sent">{campaign.sentCount} sent</span>
                  {campaign.failedCount > 0 && <span className="be-status be-status-failed">{campaign.failedCount} failed</span>}
                  {campaign.status === "sending" && <span className="be-status be-status-pending">Sending…</span>}
                </div>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="be-pager">
              <button type="button" className="be-btn be-btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</button>
              <span>Page {page} of {pages}</span>
              <button type="button" className="be-btn be-btn-sm" disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
            </div>
          )}
        </>
      ) : (
        <>
          <form className="be-picker-bar" onSubmit={(event) => { event.preventDefault(); lookup(emailInput); }}>
            <input value={emailInput} onChange={(event) => setEmailInput(event.target.value)} placeholder="Enter an email address" type="email" />
            <button type="submit" className="be-btn be-btn-primary be-btn-sm">Show mails</button>
          </form>
          {recipientMails && (
            <>
              <p className="be-meta">{recipientMails.emails.length} email{recipientMails.emails.length === 1 ? "" : "s"} sent to <strong>{recipientMails.email}</strong></p>
              <ul className="be-list">
                {recipientMails.emails.map((mail) => (
                  <li key={mail._id} className="be-list-item be-clickable" onClick={() => setOpenId(mail._id)} onKeyDown={(event) => { if (event.key === "Enter") setOpenId(mail._id); }} tabIndex={0} role="button">
                    <div className="be-list-main">
                      <strong>{mail.subject}</strong>
                      <span>{formatDateTime(mail.createdAt)} · by {mail.sentByName || "—"}</span>
                      {mail.delivery?.error && <span className="be-error-text">{mail.delivery.error}</span>}
                    </div>
                    <span className={`be-status be-status-${mail.delivery?.status || "pending"}`}>{STATUS_LABEL[mail.delivery?.status] || "—"}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

const TABS = [
  { key: "compose", label: "Compose" },
  { key: "contacts", label: "Contacts" },
  { key: "templates", label: "Templates" },
  { key: "history", label: "History" },
];

export default function BulkEmail() {
  const [tab, setTab] = useState("compose");
  const [usage, setUsage] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [toast, setToast] = useState(null);
  const [blocked, setBlocked] = useState("");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [historyKey, setHistoryKey] = useState(0);
  const [composeKey, setComposeKey] = useState(0);
  const [pendingTemplate, setPendingTemplate] = useState("");
  const toastTimer = useRef(null);

  const notify = useCallback((type, message) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const refreshUsage = useCallback(() => axios.get("/bulk-email/usage")
    .then((res) => { setUsage(res.data); setBlocked(""); })
    .catch((error) => { if (error?.response?.status === 403) setBlocked(errorMessage(error, "Bulk Email is not enabled for your company")); }), []);
  const refreshTemplates = useCallback(() => axios.get("/bulk-email/templates")
    .then((res) => setTemplates(res.data.templates || []))
    .catch(() => {}), []);

  useEffect(() => { refreshUsage(); refreshTemplates(); }, [refreshUsage, refreshTemplates]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const useTemplate = (id) => { setPendingTemplate(id); setComposeKey((key) => key + 1); setTab("compose"); };
  const showHistory = (email) => { setRecipientQuery(email); setTab("history"); };

  if (blocked) {
    return (
      <div className="be-page">
        <div className="be-panel be-blocked"><h2>Bulk Email</h2><p>{blocked}</p></div>
      </div>
    );
  }

  return (
    <div className="be-page">
      <header className="be-header">
        <div>
          <h1>Bulk Email</h1>
          <p>Write an email once and send it to many people. Every send is kept in History.</p>
        </div>
        {usage && (
          <div className="be-usage-row">
            <UsageMeter label="Today" used={usage.usage.daily} limit={usage.limits.daily} />
            <UsageMeter label="This month" used={usage.usage.monthly} limit={usage.limits.monthly} />
          </div>
        )}
      </header>
      <nav className="be-tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>
      {/* Compose stays mounted so switching tabs does not lose a draft. */}
      <div hidden={tab !== "compose"}>
        <ComposeTab
          key={composeKey}
          initialTemplate={pendingTemplate}
          templates={templates}
          refreshTemplates={refreshTemplates}
          usage={usage}
          refreshUsage={refreshUsage}
          notify={notify}
          onSent={() => setHistoryKey((key) => key + 1)}
        />
      </div>
      {tab === "contacts" && <ContactsTab notify={notify} onShowHistory={showHistory} />}
      {tab === "templates" && <TemplatesTab templates={templates} refreshTemplates={refreshTemplates} notify={notify} onUse={useTemplate} />}
      {tab === "history" && <HistoryTab notify={notify} recipientQuery={recipientQuery} setRecipientQuery={setRecipientQuery} refreshKey={historyKey} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
