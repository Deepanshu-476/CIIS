import React from 'react';

const assigneeText = (a) => {
    if (!a) return 'Khud ke liye (self)';
    if (typeof a === 'string') return a === 'self' ? 'Khud ke liye (self)' : a;
    return a.label || a.name || 'Khud ke liye (self)';
};

export default function TaskPreviewCard({
    preview,
    files = [],
    busy = false,
    uploadProgress = null,
    onConfirm,
    onEdit,
    onCancel,
}) {
    if (!preview) return null;
    const priority = String(preview.priority || 'Medium').toLowerCase();
    const who = assigneeText(preview.assignee);
    const totalFilesCount = files.length > 0 ? files.length : preview.attachmentsCount || 0;

    return (
        <div className="ai-preview">
            <div className="ai-preview-top">
                <h4>{preview.title || '—'}</h4>
                <span className={`ai-prio ${priority}`}>{priority}</span>
            </div>

            <div className="ai-preview-desc-box">
                <span className="ai-preview-label">Description:</span>
                <p className="ai-preview-desc">{preview.description ? preview.description : '—'}</p>
            </div>

            <dl className="ai-meta">
                <dt>Due</dt>
                <dd>{preview.dueLabel || preview.dueDateTime || '—'}</dd>

                <dt>Status</dt>
                <dd>{preview.statusLabel || preview.status || 'Pending'}</dd>

                <dt>Kiske liye</dt>
                <dd>{preview.taskFor === 'self' ? 'Khud ke liye (self)' : who}</dd>

                <dt>Priority Days</dt>
                <dd>{preview.priorityDays !== undefined && preview.priorityDays !== null ? `${preview.priorityDays} din` : '1 din'}</dd>

                <dt>Reminder</dt>
                <dd>
                    {preview.reminder && preview.reminder !== 'Nahi (No)' && preview.reminder !== 'Nahi' && preview.reminder !== 'No' && preview.reminder !== false
                        ? (typeof preview.reminder === 'string' && !['Yes', 'Haan', 'true'].includes(preview.reminder)
                            ? preview.reminder
                            : `Haan (${preview.repeatIntervalMinutes ? `Every ${preview.repeatIntervalMinutes} min` : preview.minutesBeforeDue ? `${preview.minutesBeforeDue} min before due` : preview.reminderOption === 'halfHourly' ? 'Every 30 min' : preview.reminderOption === 'hourly' ? 'Every 1 hour' : '1 hour before'})`)
                        : 'Nahi (No)'}
                </dd>

                <dt>Repeat</dt>
                <dd>{preview.repeatPattern && preview.repeatPattern !== 'none' ? preview.repeatPattern : 'No repeat'}</dd>

                <dt>Attachments</dt>
                <dd>{totalFilesCount > 0 ? `${totalFilesCount} file(s)` : '—'}</dd>
            </dl>

            {/* Checkpoints list */}
            {Array.isArray(preview.checkpoints) && preview.checkpoints.length > 0 ? (
                <div className="ai-preview-section">
                    <p className="ai-cp-title">Checkpoints ({preview.checkpoints.length}):</p>
                    <ul className="ai-cp-list">
                        {preview.checkpoints.map((c, i) => (
                            <li key={i}>
                                <span aria-hidden="true">☐</span>
                                <span>{typeof c === 'string' ? c : c?.title || c?.text || ''}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Attached file thumbnails if any */}
            {files && files.length > 0 ? (
                <div className="ai-preview-section">
                    <p className="ai-cp-title">Attached Files:</p>
                    <div className="ai-attach-previews">
                        {files.map((f, i) => {
                            const isImg = f.type?.startsWith('image/');
                            return (
                                <div key={i} className="ai-attach-badge">
                                    {isImg ? '🖼️' : '📄'} <span className="ai-attach-name">{f.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {busy && uploadProgress !== null ? (
                <div className="ai-progress-bar-container">
                    <div className="ai-progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                    <span className="ai-progress-text">{uploadProgress}% Upload ho raha hai…</span>
                </div>
            ) : null}

            <div className="ai-actions">
                <button type="button" className="ai-btn-primary" disabled={busy} onClick={onConfirm}>
                    {busy ? (uploadProgress !== null ? `Uploading ${uploadProgress}%…` : 'Create ho raha hai…') : '✅ Create karo'}
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