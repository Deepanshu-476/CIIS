import React from 'react';
import './TaskPreviewCard.css';
import ClientPreviewCard from './ClientPreviewCard';

const assigneeText = (a, taskFor) => {
    if (!a) {
        return taskFor === 'project' ? 'Bina assignee ke' : 'Khud ke liye (self)';
    }
    if (typeof a === 'object' && (a.id || a._id)) {
        return a.label || a.name || String(a.id || a._id);
    }
    if (a === 'self') {
        return 'Khud ke liye (self)';
    }
    return taskFor === 'project' ? 'Bina assignee ke' : 'Khud ke liye (self)';
};

const formatDateOnlyCard = (d) => {
    if (!d || typeof d !== 'string') return '—';
    const cleaned = d.replace(/,\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/g, '').trim();
    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const year = isoMatch[1];
        const monthNum = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = months[monthNum - 1] || isoMatch[2];
        return `${day} ${monthName} ${year}`;
    }
    return cleaned;
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
    if (preview.intent === 'create_client' || preview.entity === 'client') {
        return (
            <ClientPreviewCard
                preview={preview}
                busy={busy}
                onConfirm={onConfirm}
                onEdit={onEdit}
                onCancel={onCancel}
            />
        );
    }
    const isProject = preview.intent === 'create_project' || preview.entity === 'project';
    const priority = String(preview.priority || 'Medium').toLowerCase();
    const who = assigneeText(preview.assignee, preview.taskFor);
    const totalFilesCount = files.length > 0 ? files.length : preview.attachmentsCount || 0;

    return (
        <div className="ai-preview">
            <div className="ai-preview-top">
                <h4>{isProject ? (preview.name || preview.projectName || preview.title || '—') : (preview.title || '—')}</h4>
                <span className={`ai-prio ${priority}`}>{priority}</span>
            </div>

            <div className="ai-preview-desc-box">
                <span className="ai-preview-label">Description:</span>
                <p className="ai-preview-desc">{preview.description ? preview.description : '—'}</p>
            </div>

            {isProject ? (
                <dl className="ai-meta">
                    <dt>Start Date</dt>
                    <dd>{formatDateOnlyCard(preview.startDateFormatted || preview.startDate)}</dd>

                    <dt>End Date</dt>
                    <dd>{formatDateOnlyCard(preview.endDateFormatted || preview.endDate)}</dd>

                    <dt>Status</dt>
                    <dd>{preview.status || 'Active'}</dd>

                    <dt>Team Members</dt>
                    <dd>
                        {Array.isArray(preview.members) && preview.members.length > 0 ? (
                            <div className="ai-assignee-chips">
                                {preview.members.map((member, idx) => {
                                    const name = typeof member === 'object' ? member.name || member.label : member;
                                    const dept = typeof member === 'object' && member.department ? member.department : null;
                                    return (
                                        <span key={member?.id || idx} className="ai-assignee-chip">
                                            <span className="ai-assignee-chip-name">{name}</span>
                                            {dept ? (
                                                <span className="ai-assignee-chip-dept">({dept})</span>
                                            ) : null}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            '—'
                        )}
                    </dd>

                    {(preview.hasPdf || preview.documentPdf || totalFilesCount > 0) && (
                        <>
                            <dt>Document</dt>
                            <dd>{preview.documentPdf?.name ? `📄 ${preview.documentPdf.name}` : (totalFilesCount > 0 ? `📄 ${totalFilesCount} file(s)` : '📄 Attached PDF')}</dd>
                        </>
                    )}
                </dl>
            ) : (
                <dl className="ai-meta">
                    {(preview.projectName || preview.project) && (
                        <>
                            <dt>Project</dt>
                            <dd>{preview.projectName || preview.project}</dd>
                        </>
                    )}

                    <dt>Due</dt>
                    <dd>{preview.dueLabel || preview.dueDate || preview.dueDateTime || '—'}</dd>

                    <dt>Status</dt>
                    <dd>{preview.statusLabel || preview.status || 'Pending'}</dd>

                    <dt>Kiske liye</dt>
                    <dd>
                        {preview.taskFor === 'self' ? (
                            'Khud ke liye (self)'
                        ) : Array.isArray(preview.assignees) && preview.assignees.length > 0 ? (
                            <div className="ai-assignee-chips">
                                {preview.assignees.map((assignee, idx) => (
                                    <span key={assignee.id || assignee._id || idx} className="ai-assignee-chip">
                                        <span className="ai-assignee-chip-name">{assignee.name || assignee.label}</span>
                                        {assignee.department ? (
                                            <span className="ai-assignee-chip-dept">({assignee.department})</span>
                                        ) : null}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            who
                        )}
                    </dd>

                    {preview.taskFor !== 'project' && preview.priorityDays !== undefined && preview.priorityDays !== null && (
                        <>
                            <dt>Priority Days</dt>
                            <dd>{`${preview.priorityDays} din`}</dd>
                        </>
                    )}

                    <dt>Reminder</dt>
                    <dd>
                        {preview.reminder && preview.reminder !== 'Nahi (No)' && preview.reminder !== 'Nahi' && preview.reminder !== 'No' && preview.reminder !== false
                            ? (typeof preview.reminder === 'string' && !['Yes', 'Haan', 'true'].includes(preview.reminder)
                                ? preview.reminder
                                : `Haan (${preview.repeatIntervalMinutes ? `Every ${preview.repeatIntervalMinutes} min` : preview.minutesBeforeDue ? `${preview.minutesBeforeDue} min before due` : preview.reminderOption === 'halfHourly' ? 'Every 30 min' : preview.reminderOption === 'hourly' ? 'Every 1 hour' : '1 hour before'})`)
                            : 'Nahi (No)'}
                    </dd>

                    {preview.taskFor !== 'project' && preview.repeatPattern && (
                        <>
                            <dt>Repeat</dt>
                            <dd>{preview.repeatPattern !== 'none' ? preview.repeatPattern : 'No repeat'}</dd>
                        </>
                    )}

                    <dt>Attachments</dt>
                    <dd>{totalFilesCount > 0 ? `${totalFilesCount} file(s)` : '—'}</dd>
                </dl>
            )}

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