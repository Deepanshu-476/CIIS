import React, { useEffect, useState } from 'react';

export default function FilePreviewModal({ file, onClose }) {
    const [objectUrl, setObjectUrl] = useState(null);

    useEffect(() => {
        if (!file) return;
        if (file.url || file.fileUrl) {
            setObjectUrl(file.url || file.fileUrl);
            return;
        }
        if (file instanceof File || file instanceof Blob) {
            try {
                const url = URL.createObjectURL(file);
                setObjectUrl(url);
                return () => URL.revokeObjectURL(url);
            } catch (err) {
                console.warn('Could not create ObjectURL for file preview:', err);
            }
        }
    }, [file]);

    if (!file) return null;

    const fileName = file.name || 'Attached File';
    const isImg = file.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName);
    const fileSizeKb = file.size ? Math.round(file.size / 1024) : null;

    return (
        <div className="ai-file-preview-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="ai-file-preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ai-file-preview-header">
                    <span className="ai-file-preview-title" title={fileName}>
                        {isImg ? '🖼️' : '📄'} {fileName}
                    </span>
                    <button
                        type="button"
                        className="ai-file-preview-close"
                        onClick={onClose}
                        title="Close preview"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="ai-file-preview-body">
                    {isImg && objectUrl ? (
                        <div className="ai-file-preview-img-wrap">
                            <img src={objectUrl} alt={fileName} className="ai-file-preview-img" />
                        </div>
                    ) : (
                        <div className="ai-file-preview-doc">
                            <span className="ai-file-preview-doc-icon">📄</span>
                            <p className="ai-file-preview-doc-name">{fileName}</p>
                            {fileSizeKb && (
                                <p className="ai-file-preview-doc-size">Size: {fileSizeKb} KB</p>
                            )}
                            {objectUrl && (
                                <a
                                    href={objectUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ai-file-preview-doc-link"
                                >
                                    Open File in New Tab ↗
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
