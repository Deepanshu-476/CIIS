import React, { useState } from 'react';
import './TaskPreviewCard.css';
import FilePreviewModal from './FilePreviewModal';

export default function ClientTaskPreviewCard({
    preview,
    files = [],
    busy = false,
    onConfirm,
    onEdit,
    onCancel,
    isPast = false,
}) {
    if (!preview) return null;

    const [activePreviewFile, setActivePreviewFile] = useState(null);

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

            {/* Attached file thumbnails if any */}
            {files && files.length > 0 ? (
                <div className="ai-preview-section">
                    <p className="ai-cp-title">Attached Files:</p>
                    <div className="ai-attach-previews">
                        {files.map((f, i) => {
                            const isImg = f.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(f.name || '');
                            return (
                                <div key={i} className="ai-attach-badge">
                                    <span>{isImg ? '🖼️' : '📄'}</span>
                                    <span className="ai-attach-name" title={f.name}>{f.name}</span>
                                    <button
                                        type="button"
                                        className="ai-attach-preview-btn"
                                        onClick={() => setActivePreviewFile(f)}
                                        title="Preview file"
                                    >
                                        👁️ Preview
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}

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

            {activePreviewFile && (
                <FilePreviewModal
                    file={activePreviewFile}
                    onClose={() => setActivePreviewFile(null)}
                />
            )}
        </div>
    );
}

