import React from 'react';
import './TaskPreviewCard.css';

export default function ClientTaskPreviewCard({
    preview,
    busy = false,
    onConfirm,
    onEdit,
    onCancel,
    isPast = false,
}) {
    if (!preview) return null;

    const taskTitle = preview.title || preview.name || '—';
    const clientName = preview.client || '—';
    const serviceName = preview.service || '—';
    const priority = String(preview.priority || 'Medium');
    const description = preview.description || '—';
    const dueDateTime = preview.dueDateTime || preview.dueDate || '—';
    const assignee = preview.assignee || preview.assigneeName || 'Unassigned';

    return (
        <div className={`ai-preview ai-client-task-preview ${isPast ? 'ai-preview-past' : ''}`} style={isPast ? { opacity: 0.88, border: '1px dashed #cbd5e1' } : undefined}>
            <div className="ai-preview-top">
                <h4>{taskTitle}</h4>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {isPast && <span style={{ fontSize: '11px', background: '#e5e7eb', color: '#4b5563', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>Pehle ka version</span>}
                    <span className={`ai-prio ${priority.toLowerCase()}`}>{priority}</span>
                </div>
            </div>

            <div className="ai-preview-desc-box">
                <span className="ai-preview-label">Description:</span>
                <p className="ai-preview-desc">{description}</p>
            </div>

            <dl className="ai-meta">
                <dt>Client</dt>
                <dd>🏢 {clientName}</dd>

                <dt>Service</dt>
                <dd>💼 {serviceName}</dd>

                <dt>Due Date & Time</dt>
                <dd>📅 {dueDateTime}</dd>

                <dt>Assign To</dt>
                <dd>👤 {assignee}</dd>

                <dt>Priority</dt>
                <dd>{priority}</dd>

                {preview.checkpoints && preview.checkpoints !== 'None' && (
                    <>
                        <dt>Checkpoints</dt>
                        <dd>☑️ {preview.checkpoints}</dd>
                    </>
                )}

                {preview.reminder && preview.reminder !== 'OFF' && (
                    <>
                        <dt>Reminder</dt>
                        <dd>⏰ {preview.reminder}</dd>
                    </>
                )}
            </dl>

            <div className="ai-actions">
                <button type="button" className="ai-btn-primary" disabled={busy} onClick={onConfirm}>
                    {busy ? 'Save ho raha hai…' : '✅ Add Task'}
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

