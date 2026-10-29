import React from 'react';
import './TaskPreviewCard.css';

export default function ClientPreviewCard({
    preview,
    busy = false,
    onConfirm,
    onEdit,
    onCancel,
}) {
    if (!preview) return null;

    const clientName = preview.client || preview.clientName || '—';
    const companyName = preview.company || preview.companyName || '—';
    const city = preview.city || '—';
    const status = preview.status || 'Active';
    const team = Array.isArray(preview.team) && preview.team.length > 0
        ? preview.team
        : (Array.isArray(preview.members) ? preview.members : []);

    const emailNotice = preview.loginNotice || (preview.email
        ? `Create karne par client ko login details ka email jayega: ${preview.email}`
        : 'Email nahi diya gaya, system auto-generated login banayega');

    return (
        <div className="ai-preview ai-client-preview">
            <div className="ai-preview-top">
                <h4>{clientName}</h4>
                <span className="ai-prio active">{status}</span>
            </div>

            <div className="ai-preview-desc-box" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                <span className="ai-preview-label" style={{ color: '#0f766e', fontWeight: 600 }}>ℹ️ Login Information:</span>
                <p className="ai-preview-desc" style={{ color: '#334155', fontWeight: 500 }}>{emailNotice}</p>
            </div>

            <dl className="ai-meta">
                <dt>Company</dt>
                <dd>{companyName}</dd>

                <dt>City</dt>
                <dd>{city}</dd>

                <dt>Status</dt>
                <dd>{status}</dd>

                <dt>Team</dt>
                <dd>
                    {team.length > 0 ? (
                        <div className="ai-assignee-chips">
                            {team.map((member, idx) => {
                                const name = typeof member === 'object' ? (member.name || member.label || '') : String(member);
                                return (
                                    <span key={member?.id || idx} className="ai-assignee-chip">
                                        <span className="ai-assignee-chip-name">{name}</span>
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        '—'
                    )}
                </dd>

                {preview.email && (
                    <>
                        <dt>Email</dt>
                        <dd>{preview.email}</dd>
                    </>
                )}

                {preview.phone && (
                    <>
                        <dt>Phone</dt>
                        <dd>{preview.phone}</dd>
                    </>
                )}

                {preview.industry && (
                    <>
                        <dt>Industry</dt>
                        <dd>{preview.industry}</dd>
                    </>
                )}

                {preview.gst && (
                    <>
                        <dt>GST</dt>
                        <dd>{preview.gst}</dd>
                    </>
                )}

                {preview.pan && (
                    <>
                        <dt>PAN</dt>
                        <dd>{preview.pan}</dd>
                    </>
                )}

                {preview.website && (
                    <>
                        <dt>Website</dt>
                        <dd>{preview.website}</dd>
                    </>
                )}

                {preview.address && (
                    <>
                        <dt>Address</dt>
                        <dd>{preview.address}</dd>
                    </>
                )}

                {preview.pincode && (
                    <>
                        <dt>Pincode</dt>
                        <dd>{preview.pincode}</dd>
                    </>
                )}

                {preview.description && (
                    <>
                        <dt>Description</dt>
                        <dd>{preview.description}</dd>
                    </>
                )}

                {preview.notes && (
                    <>
                        <dt>Notes</dt>
                        <dd>{preview.notes}</dd>
                    </>
                )}
            </dl>

            <div className="ai-actions">
                <button type="button" className="ai-btn-primary" disabled={busy} onClick={onConfirm}>
                    {busy ? 'Create ho raha hai…' : '✅ Create karo'}
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

