import React from 'react';
import './TaskPreviewCard.css';

export default function ClientTaskPreviewCard({
    preview,
    busy = false,
    onConfirm,
    onEdit,
    onCancel,
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
        <div className="ai-preview ai-client-task-preview">
            <div className="ai-preview-top">
                <h4>{taskTitle}</h4>
                <span className={`ai-prio ${priority.toLowerCase()}`}>{priority}</span>
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

