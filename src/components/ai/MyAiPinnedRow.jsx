import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * MyAiPinnedRow: Pinned entry at the very top of MessengerDropdown chat list.
 * Excluded from unread counts and Socket.IO messages.
 */
export default function MyAiPinnedRow({ onSelect, searchQuery = '', activeTab = 'all' }) {
  // Only show on "all" tab, or when searching for AI keywords
  if (activeTab !== 'all') {
    return null;
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    const matches = ['ciis', 'ai', 'ciis ai', 'assistant', 'task', 'voice', 'bot'].some((k) =>
      k.includes(query) || query.includes(k)
    );
    if (!matches) {
      return null;
    }
  }

  return (
    <button
      type="button"
      className="fb-messenger-item my-ai-pinned-row"
      onClick={onSelect}
      aria-label="Open CIIS AI Assistant"
      style={{
        background: 'linear-gradient(90deg, rgba(239, 246, 255, 0.95) 0%, rgba(240, 253, 250, 0.95) 100%)',
        borderBottom: '1px solid #e0e7ff',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <div className="fb-messenger-avatar-wrap">
        <div
          className="fb-messenger-avatar"
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
          }}
        >
          <Sparkles size={18} className="my-ai-sparkle-spin" />
        </div>
        <span
          className="fb-messenger-online-badge"
          style={{
            backgroundColor: '#06b6d4',
            boxShadow: '0 0 6px #06b6d4',
          }}
        />
      </div>

      <div className="fb-messenger-info" style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong className="fb-messenger-name" style={{ color: '#0f172a', fontWeight: 700 }}>
            CIIS AI
          </strong>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              color: '#ffffff',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Assistant
          </span>
        </div>
        <div className="fb-messenger-preview">
          <span className="fb-messenger-snippet" style={{ color: '#475569' }}>
            Assistant • Voice enabled
          </span>
        </div>
      </div>
    </button>
  );
}
