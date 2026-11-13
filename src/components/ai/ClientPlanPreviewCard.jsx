import React from 'react';
import './TaskPreviewCard.css';

export default function ClientPlanPreviewCard({
    preview,
    busy = false,
    onConfirm,
    onEdit,
    onCancel,
}) {
    if (!preview) return null;

    const planName = preview.name || preview.planName || '—';
    const priceFormatted = preview.price !== undefined && preview.price !== null
        ? `₹${Number(preview.price).toLocaleString('en-IN')}`
        : '₹0';
    const duration = `${preview.months || 1} Month${(preview.months || 1) > 1 ? 's' : ''}`;
    const status = preview.status || 'Active';
    const description = preview.description || '—';
    const services = Array.isArray(preview.services) ? preview.services : [];

    return (
        <div className="ai-preview ai-client-plan-preview">
            <div className="ai-preview-top">
                <h4>{planName}</h4>
                <span className={`ai-prio ${status.toLowerCase() === 'active' ? 'active' : 'low'}`}>{status}</span>
            </div>

            <div className="ai-preview-desc-box">
                <span className="ai-preview-label">Description:</span>
                <p className="ai-preview-desc">{description}</p>
            </div>

            <dl className="ai-meta">
                <dt>Price (₹)</dt>
                <dd>{priceFormatted}</dd>

                <dt>Plan Duration</dt>
                <dd>{duration}</dd>

                <dt>Status</dt>
                <dd>{status}</dd>

                <dt>Selected Services & Tasks</dt>
                <dd>
                    {services.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {services.map((s, idx) => {
                                const sName = typeof s === 'string' ? s : (s.service || s.name || '');
                                const sTasks = Array.isArray(s?.tasks) ? s.tasks : [];
                                return (
                                    <div key={idx} style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{sName}</span>
                                            {sTasks.length > 0 && (
                                                <span style={{ fontSize: '11px', color: '#6366f1', background: '#e0e7ff', padding: '1px 6px', borderRadius: '4px' }}>
                                                    {sTasks.length} task{sTasks.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        {sTasks.length > 0 && (
                                            <ul style={{ margin: '4px 0 0 14px', padding: 0, fontSize: '12px', color: '#475569' }}>
                                                {sTasks.map((t, tidx) => (
                                                    <li key={tidx}>📌 {t.name || t.title} <span style={{ color: '#94a3b8' }}>({t.priority || 'Medium'}, {t.dueInDays || 30}d)</span></li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        '—'
                    )}
                </dd>
            </dl>

            <div className="ai-actions">
                <button type="button" className="ai-btn-primary" disabled={busy} onClick={onConfirm}>
                    {busy ? 'Saving…' : '✅ Create'}
                </button>
                <button type="button" className="ai-btn-ghost" disabled={busy} onClick={onEdit}>
                    ✏️ Edit
                </button>
                <button type="button" className="ai-btn-ghost" disabled={busy} onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

