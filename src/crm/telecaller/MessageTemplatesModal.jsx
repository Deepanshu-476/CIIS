import React, { useCallback, useEffect, useState } from "react";
import api from "../../utils/axiosConfig";
import { getStoredUser } from "../../utils/pageAccess";
import "./MessageTemplatesModal.css";

const CHANNELS = [
  { value: "both", label: "WhatsApp & SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
];
const EMPTY_FORM = { id: "", title: "", body: "", channel: "both" };

const getCompanyName = () => {
  try {
    const company = JSON.parse(localStorage.getItem("companyDetails") || "{}");
    return company.companyName || company.name || "";
  } catch {
    return "";
  }
};

const fillTemplate = (body, lead) =>
  String(body || "")
    .replace(/\{name\}/gi, lead?.name || "")
    .replace(/\{phone\}/gi, lead?.phone || "")
    .replace(/\{agent\}/gi, getStoredUser()?.name || "")
    .replace(/\{company\}/gi, getCompanyName());

// wa.me needs the country code; 10-digit Indian numbers get 91.
const whatsappLink = (phone, message) => {
  const digits = String(phone || "").replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
};

// Company WhatsApp/SMS templates for one lead; admins can also add, edit and delete them here.
export default function MessageTemplatesModal({ open, lead, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/crm/telecaller/templates", { noCache: true });
      setTemplates(Array.isArray(data?.items) ? data.items : []);
      setCanManage(Boolean(data?.canManage));
    } catch (err) {
      setTemplates([]);
      setError(err.response?.data?.message || "Failed to load message templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setForm(null);
      load();
    }
  }, [open, load]);

  if (!open) return null;

  const saveTemplate = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Enter a template name and message.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { title: form.title.trim(), body: form.body.trim(), channel: form.channel };
      if (form.id) await api.put(`/crm/telecaller/templates/${form.id}`, payload);
      else await api.post("/crm/telecaller/templates", payload);
      setForm(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save the template.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (template) => {
    if (!window.confirm(`Delete "${template.title}"?`)) return;
    try {
      await api.delete(`/crm/telecaller/templates/${template.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete the template.");
    }
  };

  const copy = async (template, message) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(""), 1500);
    } catch {
      setError("Could not copy the message.");
    }
  };

  return (
    <div className="mtm-overlay" role="dialog" aria-modal="true" aria-labelledby="mtm-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mtm-modal">
        <div className="mtm-header">
          <div>
            <h3 id="mtm-title">{form ? (form.id ? "Edit template" : "New template") : "Send a message"}</h3>
            {!form && lead && <p>{lead.name} • {lead.phone}</p>}
          </div>
          <button type="button" className="mtm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className="mtm-error" role="alert">{error}</div>}

        {form ? (
          <form className="mtm-form" onSubmit={saveTemplate}>
            <label>
              Template name
              <input value={form.title} maxLength={60} placeholder="e.g. Brochure" onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Message
              <textarea rows={5} value={form.body} maxLength={1000} placeholder="Hello {name}, ..." onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </label>
            <small>You can use {"{name}"}, {"{phone}"}, {"{agent}"} and {"{company}"}.</small>
            <div className="mtm-channels">
              {CHANNELS.map((channel) => (
                <button
                  type="button"
                  key={channel.value}
                  className={form.channel === channel.value ? "active" : ""}
                  onClick={() => setForm({ ...form, channel: channel.value })}
                >
                  {channel.label}
                </button>
              ))}
            </div>
            <div className="mtm-actions">
              <button type="button" className="mtm-secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="mtm-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        ) : (
          <div className="mtm-list">
            {loading && <p className="mtm-empty">Loading templates...</p>}
            {!loading && templates.length === 0 && (
              <p className="mtm-empty">
                {canManage ? "No templates yet. Add one for messages you send often." : "No templates yet. Ask your admin to add some."}
              </p>
            )}
            {!loading && templates.map((template) => {
              const message = fillTemplate(template.body, lead);
              return (
                <div key={template.id} className="mtm-card">
                  <div className="mtm-card-head">
                    <strong>{template.title}</strong>
                    {canManage && (
                      <span className="mtm-manage">
                        <button type="button" onClick={() => setForm({ ...template })}>Edit</button>
                        <button type="button" className="danger" onClick={() => deleteTemplate(template)}>Delete</button>
                      </span>
                    )}
                  </div>
                  <p>{message}</p>
                  <div className="mtm-send">
                    {template.channel !== "sms" && (
                      <a className="mtm-whatsapp" href={whatsappLink(lead?.phone, message)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    )}
                    {template.channel !== "whatsapp" && (
                      <a className="mtm-sms" href={`sms:${String(lead?.phone || "").replace(/\D/g, "").slice(-10)}?body=${encodeURIComponent(message)}`}>SMS</a>
                    )}
                    <button type="button" className="mtm-copy" onClick={() => copy(template, message)}>
                      {copiedId === template.id ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="mtm-footer">
              <a className="mtm-plain" href={whatsappLink(lead?.phone, "")} target="_blank" rel="noopener noreferrer">Open WhatsApp without a template</a>
              {canManage && <button type="button" className="mtm-primary" onClick={() => setForm({ ...EMPTY_FORM })}>+ New template</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
