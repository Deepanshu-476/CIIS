import React from 'react';
import { FiDownload, FiMic } from 'react-icons/fi';
import { API_URL_IMG } from '../../config';

// Call recordings are uploaded by the mobile app (POST /crm/telecaller/:id/recording) and saved on
// the call as "/uploads/recordings/<file>". Every backend serves every backend's uploads, so the
// web plays them from its own backend origin.
export const recordingHref = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith('/uploads/')) return ''; // a phone-local path cannot be played
  return `${String(API_URL_IMG).replace(/\/+$/, '')}/${value.replace(/^\/+/, '')}`;
};

export const hasRecording = (url) => Boolean(recordingHref(url));

const styles = {
  wrap: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' },
  audio: { height: 36, maxWidth: '100%', minWidth: 0, flex: '1 1 220px' },
  link: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap' },
  none: { fontSize: 13, color: '#94a3b8' },
};

// Player + download link. `compact` shows only a small "Recording" badge (for table cells).
export default function CallRecording({ url, compact = false, emptyText = 'No recording' }) {
  const href = recordingHref(url);
  if (!href) return emptyText ? <span style={styles.none}>{emptyText}</span> : null;
  if (compact) {
    return (
      <span title="This call has a recording" style={{ ...styles.link, color: '#16a34a' }}>
        <FiMic size={13} /> Rec
      </span>
    );
  }
  return (
    <div style={styles.wrap}>
      <audio controls preload="none" src={href} style={styles.audio}>
        <a href={href}>Play recording</a>
      </audio>
      <a href={href} target="_blank" rel="noopener noreferrer" download style={styles.link}>
        <FiDownload size={13} /> Download
      </a>
    </div>
  );
}
