import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../../utils/axiosConfig';
import CIISLoader from '../../Loader/CIISLoader';
import { pageName, describeAction, getModuleInfo } from '../../utils/pageNames';
import './UserActivity.css';
import './UserActivityDrawer.css';
import {
  Users,
  Activity,
  LogIn,
  Eye,
  FileEdit,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Smartphone,
  Globe,
  X,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Award,
  Download,
  Zap,
  Radio,
  ExternalLink,
  ShieldCheck,
  Building2
} from 'lucide-react';

const RANGES = [
  { value: 1, label: 'Today' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const fmtDateTime = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ago = value => {
  if (!value) return 'Never';
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return '—';
  const min = Math.round(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
};

const fmtDuration = ms => {
  const total = Math.round((Number(ms) || 0) / 1000);
  if (!total) return '—';
  if (total < 60) return `${total}s`;
  const min = Math.floor(total / 60);
  if (min < 60) return `${min}m ${total % 60}s`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

const errorText = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

// Consistent pastel avatar color palettes
const AVATAR_PALETTES = [
  { bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', text: '#3730a3' },
  { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', text: '#9d174d' },
  { bg: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)', text: '#115e59' },
  { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', text: '#92400e' },
  { bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', text: '#5b21b6' },
  { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', text: '#075985' },
];

function getAvatarStyle(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function UserAvatar({ name = '', size = 32, fontSize = '0.78rem' }) {
  const palette = getAvatarStyle(name);
  const initials = getInitials(name);
  return (
    <div
      className="ua-avatar-circle"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: palette.bg,
        color: palette.text,
        fontSize,
      }}
    >
      {initials}
    </div>
  );
}

// Sleek reusable Empty State component
function EmptyState({ icon: Icon = Search, title, description, actionText, onAction }) {
  return (
    <div className="ua-empty-state">
      <div className="ua-empty-icon-wrap">
        <Icon size={22} />
      </div>
      <h4 className="ua-empty-title">{title}</h4>
      <p className="ua-empty-desc">{description}</p>
      {actionText && onAction && (
        <button className="ua-empty-btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}

// Helper to determine work productivity engagement badge
function getEngagementBadge(views = 0, actions = 0) {
  if (actions >= 8 || (views > 0 && actions / views >= 0.25)) {
    return { label: 'High Activity', cls: 'engagement-high', icon: Zap };
  }
  if (actions >= 2 || (views > 0 && actions / views >= 0.1)) {
    return { label: 'Productive', cls: 'engagement-balanced', icon: Activity };
  }
  return { label: 'Browsing', cls: 'engagement-browsing', icon: Eye };
}

// Slide-Over Employee Details Drawer
function UserDrawer({ user, isOpen, onClose, onViewFullFeed }) {
  const [feedItems, setFeedItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Close on Escape key & Lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!user?._id || !isOpen) return;
    setLoadingFeed(true);
    axios.get('/activity/feed', {
      params: { userId: user._id, limit: 12 },
      _skipErrorNotify: true
    }).then(({ data }) => {
      setFeedItems(data?.items || []);
    }).catch(() => {
      setFeedItems([]);
    }).finally(() => {
      setLoadingFeed(false);
    });
  }, [user?._id, isOpen]);

  if (!isOpen || !user) return null;

  const engagement = getEngagementBadge(user.views, user.actions);
  const BadgeIcon = engagement.icon;

  const isOnlineToday = (() => {
    const loginTime = user.lastLogin ? new Date(user.lastLogin).getTime() : 0;
    const activeTime = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
    const mostRecent = Math.max(loginTime, activeTime);
    return mostRecent > 0 && (Date.now() - mostRecent < 24 * 60 * 60 * 1000);
  })();

  return (
    <div className="ua-drawer-backdrop" onClick={onClose}>
      <div className="ua-drawer" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="ua-drawer-header">
          <div className="ua-drawer-title-row">
            <UserAvatar name={user.name} size={42} fontSize="0.95rem" />
            <div>
              <h2 className="ua-drawer-name">{user.name}</h2>
              <div className="ua-drawer-meta">
                {[user.role, user.department].filter(Boolean).join(' • ') || user.email}
              </div>
            </div>
          </div>
          <button className="ua-drawer-close" onClick={onClose} title="Close drawer (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="ua-drawer-body">
          {/* Quick Stats Grid */}
          <div className="ua-drawer-kpis">
            <div className="ua-drawer-kpi-card">
              <div className="ua-drawer-kpi-val">{user.views || 0}</div>
              <div className="ua-drawer-kpi-label">Pages Viewed</div>
            </div>
            <div className="ua-drawer-kpi-card">
              <div className="ua-drawer-kpi-val" style={{ color: '#ea580c' }}>{user.actions || 0}</div>
              <div className="ua-drawer-kpi-label">Data Updates</div>
            </div>
            <div className="ua-drawer-kpi-card">
              <div className="ua-drawer-kpi-val" style={{ fontSize: '1.1rem' }}>{fmtDuration(user.timeMs)}</div>
              <div className="ua-drawer-kpi-label">Active Time</div>
            </div>
          </div>

          {/* Status & Work Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
              <span className={`ua-status-badge-dot ${isOnlineToday ? 'dot-online' : 'dot-offline'}`} style={{ position: 'static' }} />
              <span style={{ fontWeight: 500 }}>{isOnlineToday ? 'Active in System Today' : 'Offline Today'}</span>
            </div>
            <div className={`ua-engagement-badge ${engagement.cls}`}>
              <BadgeIcon size={12} />
              <span>{engagement.label}</span>
            </div>
          </div>

          {/* Session Details */}
          <div className="ua-drawer-section">
            <div className="ua-drawer-section-title">Session & Access Details</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 8, background: '#ffffff', border: '1px solid #f1f5f9', padding: '12px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Branch:</span>
                <span style={{ fontWeight: 500 }}>{(user.branches || []).join(', ') || 'Head Office'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Last Login:</span>
                <span>{fmtDateTime(user.lastLogin)} ({ago(user.lastLogin)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Last Active:</span>
                <span>{user.lastActiveAt ? `${fmtDateTime(user.lastActiveAt)} (${ago(user.lastActiveAt)})` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Top Visited Page:</span>
                <span style={{ color: '#2563eb', fontWeight: 500 }}>{user.topPage ? pageName(user.topPage) : '—'}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="ua-drawer-section">
            <div className="ua-drawer-section-title">
              <span>Recent Activity Stream</span>
              {loadingFeed && <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Loading...</span>}
            </div>

            {feedItems.length > 0 ? (
              <div className="ua-drawer-timeline">
                {feedItems.map(item => {
                  const mod = getModuleInfo(item.path, item.endpoint, item.module);
                  return (
                    <div key={item._id} className="ua-drawer-timeline-item">
                      <div className="ua-drawer-timeline-dot" style={{ background: item.type === 'action' ? '#ea580c' : item.type === 'login' ? '#10b981' : '#3b82f6' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                            {item.type === 'login'
                              ? 'Logged in to system'
                              : item.type === 'view'
                              ? `Opened ${pageName(item.path || '(unknown)')}`
                              : describeAction(item.method, item.endpoint, item.summary)}
                          </span>
                          <span className="ua-module-badge" style={{ color: mod.color, background: mod.bg, borderColor: mod.border }}>
                            {mod.name}
                          </span>
                        </div>
                        {item.summary && (
                          <div className="ua-timeline-summary-card" style={{ marginTop: 4, marginBottom: 4 }}>
                            <span className="ua-summary-tag">Detail:</span>
                            <span className="ua-summary-val">{item.summary}</span>
                          </div>
                        )}
                        {item.type === 'view' && item.durationMs > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                            ⏱️ Active time: <strong>{fmtDuration(item.durationMs)}</strong>
                          </div>
                        )}
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: 2 }}>
                          {ago(item.at)} • {fmtDateTime(item.at)} ({item.source || 'web'})
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
                {loadingFeed ? 'Loading activity...' : 'No recent activities recorded for this user.'}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="ua-drawer-footer">
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{user.email}</span>
          <button
            className="ua-btn-page"
            style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => {
              onViewFullFeed(user._id);
              onClose();
            }}
          >
            Open in Feed <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal popup showing users list
function UsersModal({ isOpen, onClose, title, users, onSelectUser }) {
  const [modalSearch, setModalSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = users.filter(u => {
    if (!modalSearch.trim()) return true;
    const term = modalSearch.toLowerCase();
    return [u.name, u.email, u.role, u.department, ...(u.branches || [])]
      .some(val => String(val || '').toLowerCase().includes(term));
  });

  return (
    <div className="ua-modal-backdrop" onClick={onClose}>
      <div className="ua-modal-box" onClick={e => e.stopPropagation()}>
        <div className="ua-modal-header">
          <div className="ua-modal-title">
            <Users size={18} color="#2563eb" />
            <span>{title} ({users.length})</span>
          </div>
          <button className="ua-modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '12px 20px 0' }}>
          <div className="ua-search-input">
            <Search size={15} className="ua-search-icon" />
            <input
              type="text"
              placeholder="Search people in this list..."
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="ua-modal-body">
          <div className="ua-table-responsive">
            <table className="ua-modern-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Branch</th>
                  <th>Last Login</th>
                  <th>Last Active</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr
                    key={user._id}
                    className="clickable"
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    title="Click to view employee drawer profile"
                  >
                    <td>
                      <div className="ua-user-cell">
                        <UserAvatar name={user.name} size={32} />
                        <div>
                          <div className="ua-user-name">{user.name}</div>
                          <div className="ua-user-meta">
                            {[user.role, user.department].filter(Boolean).join(' • ') || user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{(user.branches || []).join(', ') || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{ago(user.lastLogin)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{user.lastActiveAt ? ago(user.lastActiveAt) : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="ua-btn-page"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(user);
                          onClose();
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={Users}
                        title="No matching people"
                        description={`No employees match "${modalSearch}".`}
                        actionText="Clear Search"
                        onAction={() => setModalSearch('')}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ua-modal-footer">
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Showing {filtered.length} of {users.length} active people
          </span>
          <button className="ua-btn-page" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PagesTab({ pages, onOpenPage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const max = Math.max(1, ...pages.map(p => (p.views || 0) + (p.actions || 0)));

  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    const term = searchTerm.toLowerCase();
    return pages.filter(p => pageName(p.path).toLowerCase().includes(term) || p.path.toLowerCase().includes(term));
  }, [pages, searchTerm]);

  if (!pages.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <Layers size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>No page activity recorded in this period yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="ua-filter-bar">
        <div className="ua-search-input">
          <Search size={15} className="ua-search-icon" />
          <input
            type="text"
            placeholder="Search pages by name or path..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="ua-table-responsive">
        <table className="ua-modern-table">
          <thead>
            <tr>
              <th>Page / Module</th>
              <th style={{ textAlign: 'right' }}>Opened (Views)</th>
              <th style={{ textAlign: 'right' }}>Changes Made</th>
              <th style={{ textAlign: 'right' }}>Unique People</th>
              <th style={{ textAlign: 'right' }}>Avg Time Spent</th>
              <th>Last Accessed</th>
            </tr>
          </thead>
          <tbody>
            {filteredPages.map(page => {
              const totalHits = (page.views || 0) + (page.actions || 0);
              const percentage = Math.max(3, (totalHits / max) * 100);
              return (
                <tr
                  key={page.path}
                  className="clickable"
                  onClick={() => onOpenPage(page.path)}
                  title="Click to view detailed activity logs for this page"
                >
                  <td style={{ minWidth: 230 }}>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>{pageName(page.path)}</div>
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: '#2563eb', borderRadius: 4 }} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{page.views}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500, color: page.actions > 0 ? '#ea580c' : 'inherit' }}>
                    {page.actions}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {page.uniqueUsers}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{fmtDuration(page.avgDurationMs)}</td>
                  <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{fmtDateTime(page.lastAt)}</td>
                </tr>
              );
            })}
            {!filteredPages.length ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Layers}
                    title="No matching pages"
                    description={searchTerm ? `No page activities match "${searchTerm}".` : 'No page activity recorded in this period.'}
                    actionText={searchTerm ? 'Clear Search' : undefined}
                    onAction={() => setSearchTerm('')}
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab({ users, onOpenUser }) {
  const [search, setSearch] = useState('');
  const [show, setShow] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Extract unique branches
  const availableBranches = useMemo(() => {
    const set = new Set();
    users.forEach(u => {
      (u.branches || []).forEach(b => { if (b) set.add(b); });
    });
    return Array.from(set);
  }, [users]);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(user => {
      if (user.isActive === false) return false;

      // Branch filter
      if (selectedBranch !== 'all') {
        const userBranches = user.branches || [];
        if (!userBranches.includes(selectedBranch)) return false;
      }

      const totalActivities = (user.views || 0) + (user.actions || 0) + (user.logins || 0);
      if (show === 'active' && !totalActivities) return false;
      if (show === 'inactive' && totalActivities) return false;
      if (show === 'never' && user.lastLogin) return false;
      if (!term) return true;
      return [user.name, user.email, user.department, user.role, ...(user.branches || [])]
        .some(value => String(value || '').toLowerCase().includes(term));
    });
  }, [users, search, show, selectedBranch]);

  return (
    <div>
      <div className="ua-filter-bar">
        <div className="ua-search-input">
          <Search size={15} className="ua-search-icon" />
          <input
            type="text"
            placeholder="Search staff by name, role, department or branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Multi-Branch Filter Dropdown */}
        {availableBranches.length > 0 && (
          <select
            className="ua-select-custom"
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
          >
            <option value="all">All Branches</option>
            {availableBranches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}

        <select
          className="ua-select-custom"
          value={show}
          onChange={e => setShow(e.target.value)}
        >
          <option value="all">All Usage Types</option>
          <option value="active">Active in this period</option>
          <option value="inactive">Inactive in this period</option>
          <option value="never">Never logged in</option>
        </select>
      </div>

      <div className="ua-table-responsive">
        <table className="ua-modern-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Productivity</th>
              <th>Last Active</th>
              <th style={{ textAlign: 'right' }}>Pages Viewed</th>
              <th style={{ textAlign: 'right' }}>Changes Made</th>
              <th>Top Used Page</th>
            </tr>
          </thead>
          <tbody>
            {list.map(user => {
              const loginTime = user.lastLogin ? new Date(user.lastLogin).getTime() : 0;
              const activeTime = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
              const mostRecentTime = Math.max(loginTime, activeTime);
              const isOnlineToday = mostRecentTime > 0 && (Date.now() - mostRecentTime < 24 * 60 * 60 * 1000);
              const engagement = getEngagementBadge(user.views, user.actions);
              const BadgeIcon = engagement.icon;

              return (
                <tr
                  key={user._id}
                  className="clickable"
                  onClick={() => onOpenUser(user)}
                  title="Click to open employee detail drawer"
                >
                  <td style={{ minWidth: 190 }}>
                    <div className="ua-user-cell">
                      <div className="ua-avatar-wrap">
                        <UserAvatar name={user.name} size={32} />
                        <div className={`ua-status-badge-dot ${isOnlineToday ? 'dot-online' : 'dot-offline'}`} />
                      </div>
                      <div>
                        <div className="ua-user-name">{user.name}</div>
                        <div className="ua-user-meta">
                          {[user.role, user.department].filter(Boolean).join(' • ') || user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ minWidth: 120 }}>{(user.branches || []).join(', ') || '—'}</td>
                  <td>
                    {isOnlineToday ? (
                      <span className="ua-badge ua-badge-type-login">Active Today</span>
                    ) : (
                      <span className="ua-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Offline</span>
                    )}
                  </td>
                  <td>
                    <span className={`ua-engagement-badge ${engagement.cls}`}>
                      <BadgeIcon size={11} /> {engagement.label}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }} title={fmtDateTime(user.lastActiveAt)}>
                    {user.lastActiveAt ? ago(user.lastActiveAt) : (user.lastLogin ? ago(user.lastLogin) : '—')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{user.views}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500, color: user.actions > 0 ? '#ea580c' : 'inherit' }}>
                    {user.actions}
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <span className="ua-truncate-cell" title={user.topPage ? pageName(user.topPage) : ''} style={{ color: '#2563eb', fontWeight: 500 }}>
                      {user.topPage ? pageName(user.topPage) : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!list.length ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon={Users}
                    title="No staff members found"
                    description="Try adjusting your search keywords, branch selection, or usage filter."
                    actionText="Reset All Filters"
                    onAction={() => {
                      setSearch('');
                      setSelectedBranch('all');
                      setShow('all');
                    }}
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedTab({ days, users, pages, filters, setFilters, onOpenUser }) {
  const [state, setState] = useState({ loading: true, items: [], page: 1, pages: 1, total: 0, error: '' });
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const load = useCallback(async (pageNo = 1, searchQuery = searchTerm) => {
    setState(s => ({ ...s, loading: true, error: '' }));
    try {
      const { data } = await axios.get('/activity/feed', {
        params: {
          days,
          page: pageNo,
          limit: 30,
          userId: filters.userId || undefined,
          path: filters.path || undefined,
          type: filters.type || undefined,
          search: searchQuery ? searchQuery.trim() : undefined,
        },
        _skipErrorNotify: true,
      });
      setState({
        loading: false,
        items: data.items || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
        error: ''
      });
    } catch (error) {
      setState(s => ({ ...s, loading: false, error: errorText(error, 'Could not load the activity log') }));
    }
  }, [days, filters, searchTerm]);

  useEffect(() => { load(1, searchTerm); }, [load, searchTerm]);

  const getItemVisuals = item => {
    const mod = getModuleInfo(item.path, item.endpoint, item.module);
    if (item.type === 'login') {
      return {
        icon: <LogIn size={15} color="#059669" />,
        bg: '#ecfdf5',
        title: 'Logged in to system',
        color: '#059669',
        badgeClass: 'ua-badge-type-login',
        typeLabel: 'Login',
        mod
      };
    }
    if (item.type === 'view') {
      const timeSpent = item.durationMs > 0 ? ` · ${fmtDuration(item.durationMs)} active` : '';
      return {
        icon: <Eye size={15} color="#2563eb" />,
        bg: '#eff6ff',
        title: `Viewed ${pageName(item.path || '(unknown)')}${timeSpent}`,
        color: '#1d4ed8',
        badgeClass: 'ua-badge-type-view',
        typeLabel: 'Page View',
        mod
      };
    }
    return {
      icon: <FileEdit size={15} color="#ea580c" />,
      bg: '#fff7ed',
      title: describeAction(item.method, item.endpoint, item.summary),
      color: '#c2410c',
      badgeClass: 'ua-badge-type-action',
      typeLabel: item.method === 'DELETE' ? 'Deleted' : item.method === 'POST' ? 'Created' : 'Updated',
      mod
    };
  };

  return (
    <div>
      {/* Category Pills & Quick Filter Bar */}
      <div className="ua-feed-header-bar">
        <div className="ua-feed-categories">
          <button
            className={`ua-feed-cat-chip ${!filters.type ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, type: '' }))}
          >
            All Activities {state.total ? `(${state.total})` : ''}
          </button>
          <button
            className={`ua-feed-cat-chip ${filters.type === 'action' ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, type: 'action' }))}
          >
            <FileEdit size={12} /> Changes & Updates
          </button>
          <button
            className={`ua-feed-cat-chip ${filters.type === 'view' ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, type: 'view' }))}
          >
            <Eye size={12} /> Page Views
          </button>
          <button
            className={`ua-feed-cat-chip ${filters.type === 'login' ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, type: 'login' }))}
          >
            <LogIn size={12} /> Logins
          </button>
        </div>

        {/* Search input */}
        <div className="ua-search-box" style={{ maxWidth: 280 }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search action, task, lead..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="ua-search-clear" onClick={() => setSearchTerm('')}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="ua-filter-bar">
        <select
          className="ua-select-custom"
          value={filters.userId}
          onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
        >
          <option value="">All Employees</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>

        <select
          className="ua-select-custom"
          value={filters.path}
          onChange={e => setFilters(f => ({ ...f, path: e.target.value }))}
        >
          <option value="">All Pages / Modules</option>
          {pages.map(p => <option key={p.path} value={p.path}>{pageName(p.path)}</option>)}
        </select>

        {filters.userId || filters.path || filters.type || searchTerm ? (
          <button
            className="ua-btn-page"
            onClick={() => {
              setSearchTerm('');
              setFilters({ userId: '', path: '', type: '' });
            }}
          >
            Reset Filters
          </button>
        ) : null}
      </div>

      {state.error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.8rem' }}>
          {state.error}
        </div>
      ) : null}

      <div className="ua-timeline-list">
        {state.items.map(item => {
          const vis = getItemVisuals(item);
          return (
            <div key={item._id} className="ua-timeline-item">
              <div className="ua-timeline-icon" style={{ background: vis.bg }}>
                {vis.icon}
              </div>
              <div className="ua-timeline-content">
                <div className="ua-timeline-top">
                  <div className="ua-timeline-actor-row">
                    <span
                      className="ua-timeline-user clickable"
                      title="Click to view employee drawer"
                      onClick={() => {
                        const targetUser = users.find(u => u._id === item.user?._id);
                        if (targetUser && onOpenUser) onOpenUser(targetUser);
                      }}
                    >
                      {item.user?.name || 'Unknown User'}
                    </span>
                    <span className="ua-module-badge" style={{ color: vis.mod.color, background: vis.mod.bg, borderColor: vis.mod.border }}>
                      {vis.mod.name}
                    </span>
                    <span className={`ua-badge ${vis.badgeClass}`}>
                      {vis.typeLabel}
                    </span>
                  </div>
                  <span className="ua-timeline-time">
                    <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {ago(item.at)} • {fmtDateTime(item.at)}
                  </span>
                </div>

                <div className="ua-timeline-desc">
                  <span style={{ fontWeight: 600, color: vis.color }}>{vis.title}</span>
                  {item.path && item.type === 'action' && (
                    <span style={{ color: '#64748b' }}> on <strong>{pageName(item.path)}</strong></span>
                  )}
                </div>

                {/* Contextual Action Summary Pill */}
                {item.summary && (
                  <div className="ua-timeline-summary-card">
                    <span className="ua-summary-tag">Details:</span>
                    <span className="ua-summary-val">{item.summary}</span>
                  </div>
                )}

                {/* Active View Duration Bar */}
                {item.type === 'view' && item.durationMs > 0 && (
                  <div className="ua-view-duration-bar">
                    <Clock size={11} color="#475569" />
                    <span>Active time spent: <strong>{fmtDuration(item.durationMs)}</strong></span>
                  </div>
                )}

                <div className="ua-timeline-badge-row">
                  {item.source === 'app' ? (
                    <span className="ua-badge ua-badge-source-app"><Smartphone size={10} /> Mobile App</span>
                  ) : item.source === 'web' ? (
                    <span className="ua-badge ua-badge-source-web"><Globe size={10} /> Web App</span>
                  ) : null}
                  {item.method && (
                    <span className="ua-api-pill">
                      {item.method} {item.endpoint} {item.status ? `· ${item.status}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!state.loading && !state.items.length ? (
          <EmptyState
            icon={Activity}
            title="No activity events found"
            description={searchTerm ? `No activity records match "${searchTerm}".` : 'No activity records match the selected criteria.'}
            actionText="Reset All Filters"
            onAction={() => {
              setSearchTerm('');
              setFilters({ userId: '', path: '', type: '' });
            }}
          />
        ) : null}
      </div>

      <div className="ua-pagination">
        <div className="ua-page-info">
          Showing <strong>{state.items.length}</strong> of <strong>{state.total}</strong> entries • Page {state.page} of {state.pages}
        </div>
        <div className="ua-page-actions">
          <button
            className="ua-btn-page"
            disabled={state.loading || state.page <= 1}
            onClick={() => load(state.page - 1)}
          >
            <ChevronLeft size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> Prev
          </button>
          <button
            className="ua-btn-page"
            disabled={state.loading || state.page >= state.pages}
            onClick={() => load(state.page + 1)}
          >
            Next <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 2 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserActivity() {
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState('pages');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ userId: '', path: '', type: '' });

  // Auto-refresh state (every 30s)
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected User for Slide-over Drawer
  const [selectedDrawerUser, setSelectedDrawerUser] = useState(null);

  // Modal State for generic list clicks
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    users: []
  });

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);
    setError('');
    try {
      const { data } = await axios.get('/activity/summary', { params: { days }, _skipErrorNotify: true });
      setSummary(data);
    } catch (err) {
      setError(errorText(err, 'Could not load employee activity'));
    } finally {
      if (!isSilent) setLoading(false);
      else setIsRefreshing(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // 30-Second Auto Refresh Timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      load(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const t = summary?.totals || {};
  const allUsers = useMemo(() => {
    return (summary?.users || []).filter(u => u.isActive !== false);
  }, [summary]);

  const rangeLabel = RANGES.find(r => r.value === days)?.label.toLowerCase() || '';

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const loggedInTodayUsers = useMemo(() => {
    return allUsers.filter(u => {
      const loginTime = u.lastLogin ? new Date(u.lastLogin) : null;
      const activeTime = u.lastActiveAt ? new Date(u.lastActiveAt) : null;
      return (loginTime && loginTime >= todayStart) || (activeTime && activeTime >= todayStart);
    });
  }, [allUsers, todayStart]);

  const notLoggedInTodayUsers = useMemo(() => {
    return allUsers.filter(u => {
      const loginTime = u.lastLogin ? new Date(u.lastLogin) : null;
      const activeTime = u.lastActiveAt ? new Date(u.lastActiveAt) : null;
      const wasHereToday = (loginTime && loginTime >= todayStart) || (activeTime && activeTime >= todayStart);
      return !wasHereToday;
    });
  }, [allUsers, todayStart]);

  const activeInRangeUsers = useMemo(() => {
    return allUsers.filter(u => (u.views || 0) + (u.actions || 0) + (u.logins || 0) > 0);
  }, [allUsers]);

  const topActivePeople = useMemo(() => {
    return [...allUsers]
      .sort((a, b) => (b.views + b.actions) - (a.views + a.actions))
      .slice(0, 5);
  }, [allUsers]);

  const topPagesList = useMemo(() => {
    return (summary?.pages || []).slice(0, 5);
  }, [summary]);

  // Hourly Activity Bars (9 AM to 6 PM IST)
  const hourlyData = useMemo(() => {
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const map = new Map((summary?.hourly || []).map(h => [h.hour, h.count]));
    const max = Math.max(1, ...Array.from(map.values()));
    return hours.map(hr => {
      const count = map.get(hr) || 0;
      const label = hr > 12 ? `${hr - 12} PM` : hr === 12 ? '12 PM' : `${hr} AM`;
      const height = Math.max(4, Math.round((count / max) * 100));
      return { hr, label, count, height };
    });
  }, [summary]);

  // Device Source distribution
  const deviceStats = useMemo(() => {
    const s = summary?.sources || { web: 0, app: 0 };
    const total = (s.web || 0) + (s.app || 0) || 1;
    return {
      webCount: s.web || 0,
      webPct: Math.round(((s.web || 0) / total) * 100),
      appCount: s.app || 0,
      appPct: Math.round(((s.app || 0) / total) * 100),
    };
  }, [summary]);

  const openUsersModal = (title, userList) => {
    setModalState({
      isOpen: true,
      title,
      users: userList
    });
  };

  const handleOpenUserDrawer = userObj => {
    setSelectedDrawerUser(userObj);
  };

  const handleSelectUserFromModal = user => {
    setSelectedDrawerUser(user);
  };

  const handleViewUserFullFeed = userId => {
    setFilters({ userId, path: '', type: '' });
    setTab('feed');
  };

  const engagementPercent = allUsers.length > 0
    ? Math.round((loggedInTodayUsers.length / allUsers.length) * 100)
    : 0;

  // Simple CSV export function
  const handleExportCSV = () => {
    if (!allUsers.length) return;
    const headers = ['Name', 'Email', 'Role', 'Department', 'Branch', 'Last Login', 'Last Active', 'Views', 'Changes'];
    const rows = allUsers.map(u => [
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.role || ''}"`,
      `"${u.department || ''}"`,
      `"${(u.branches || []).join(', ')}"`,
      `"${fmtDateTime(u.lastLogin)}"`,
      `"${fmtDateTime(u.lastActiveAt)}"`,
      u.views || 0,
      u.actions || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `user-activity-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="user-activity-container">
      {/* Slide-over User Detail Drawer */}
      <UserDrawer
        user={selectedDrawerUser}
        isOpen={Boolean(selectedDrawerUser)}
        onClose={() => setSelectedDrawerUser(null)}
        onViewFullFeed={handleViewUserFullFeed}
      />

      {/* People Modal Popup */}
      <UsersModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
        title={modalState.title}
        users={modalState.users}
        onSelectUser={handleSelectUserFromModal}
      />

      {/* Header */}
      <div className="ua-header">
        <div className="ua-title-wrapper">
          <div className="ua-icon-badge">
            <Activity size={22} />
          </div>
          <div className="ua-title-text">
            <h1>
              Employee & System Analytics
              <span className="ua-version-tag">Intelligence</span>
            </h1>
            <p>Live attendance, hourly peak traffic, module adoption and staff operations.</p>
          </div>
        </div>

        <div className="ua-controls">
          {/* Live Auto-Refresh Toggle Pill */}
          <button
            className={`ua-refresh-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(v => !v)}
            title="Auto-refresh activity every 30 seconds"
          >
            <div className="ua-pulse-dot" />
            <span>{autoRefresh ? (isRefreshing ? 'Refreshing...' : 'Live (30s)') : 'Auto-Refresh Off'}</span>
            {isRefreshing && <RotateCcw size={11} className="ua-spin" />}
          </button>

          <select
            className="ua-select-custom"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
          >
            {RANGES.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          <button
            className="ua-btn-action"
            onClick={handleExportCSV}
            title="Download CSV report"
          >
            <Download size={13} />
            Export
          </button>
          <button
            className="ua-btn-action"
            onClick={() => load(false)}
            disabled={loading}
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="ua-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
          <button className="ua-btn-page" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => load()}>
            <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} /> Retry
          </button>
        </div>
      ) : null}

      {loading && !summary ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '70px 0' }}>
          <CIISLoader />
        </div>
      ) : null}

      {summary ? (
        <>
          {/* Quick Presence Status Bar */}
          <div className="ua-presence-bar">
            <div className="ua-presence-left">
              <div className="ua-dot-live" />
              <span>Today's Staff Status:</span>
            </div>
            <div className="ua-presence-items">
              <div
                className="ua-presence-pill pill-green"
                onClick={() => openUsersModal('Employees Logged In Today', loggedInTodayUsers)}
                title="Click to view list of present employees"
              >
                <CheckCircle2 size={13} />
                <span>{loggedInTodayUsers.length} Logged In Today</span>
              </div>

              <div
                className="ua-presence-pill pill-amber"
                onClick={() => openUsersModal('Employees Not Logged In Today', notLoggedInTodayUsers)}
                title="Click to view who hasn't logged in yet today"
              >
                <AlertCircle size={13} />
                <span>{notLoggedInTodayUsers.length} Not Logged In</span>
              </div>

              <div
                className="ua-presence-pill pill-blue"
                onClick={() => openUsersModal(`Active Staff in ${rangeLabel}`, activeInRangeUsers)}
                title="Click to see active system users"
              >
                <TrendingUp size={13} />
                <span>{t.activeInRange} Active in Period</span>
              </div>

              <div
                className="ua-presence-pill pill-slate"
                onClick={() => openUsersModal('All Active Employees', allUsers)}
                title="Click to see total directory"
              >
                <Users size={13} />
                <span>{allUsers.length} Total Staff</span>
              </div>
            </div>
          </div>

          {/* 3 Executive High-Impact Cards */}
          <div className="ua-exec-grid">
            {/* Card 1: Attendance */}
            <div
              className="ua-exec-card"
              onClick={() => openUsersModal('Staff Logged In Today', loggedInTodayUsers)}
            >
              <div className="ua-exec-card-header">
                <div className="ua-exec-title-row">
                  <div className="ua-exec-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Users size={17} />
                  </div>
                  <span className="ua-exec-tag">Today's Attendance</span>
                </div>
                <span className="ua-exec-card-action">View staff <ArrowRight size={12} /></span>
              </div>
              <div className="ua-exec-main">
                <span className="ua-exec-big-num">{engagementPercent}%</span>
                <span className="ua-exec-subtitle">present today</span>
              </div>
              <div className="ua-progress-container">
                <div className="ua-progress-bar-thin">
                  <div className="ua-progress-bar-fill" style={{ width: `${engagementPercent}%`, background: '#10b981' }} />
                </div>
              </div>
              <div className="ua-exec-desc-text">
                <strong>{loggedInTodayUsers.length}</strong> of <strong>{allUsers.length}</strong> staff have logged in today.
              </div>
            </div>

            {/* Card 2: Page Visits */}
            <div className="ua-exec-card" onClick={() => setTab('pages')}>
              <div className="ua-exec-card-header">
                <div className="ua-exec-title-row">
                  <div className="ua-exec-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <Eye size={17} />
                  </div>
                  <span className="ua-exec-tag">Page Visits ({rangeLabel})</span>
                </div>
                <span className="ua-exec-card-action">Breakdown <ArrowRight size={12} /></span>
              </div>
              <div className="ua-exec-main">
                <span className="ua-exec-big-num">{t.views?.toLocaleString()}</span>
                <span className="ua-exec-subtitle">total visits</span>
              </div>
              <div className="ua-progress-container">
                <div className="ua-progress-bar-thin">
                  <div className="ua-progress-bar-fill" style={{ width: '85%', background: '#3b82f6' }} />
                </div>
              </div>
              <div className="ua-exec-desc-text">
                Staff accessed <strong>{summary.pages?.length || 0}</strong> different sections in the system.
              </div>
            </div>

            {/* Card 3: Work / Updates Made */}
            <div
              className="ua-exec-card"
              onClick={() => {
                setFilters({ userId: '', path: '', type: 'action' });
                setTab('feed');
              }}
            >
              <div className="ua-exec-card-header">
                <div className="ua-exec-title-row">
                  <div className="ua-exec-icon-wrap" style={{ background: '#faf5ff', color: '#9333ea' }}>
                    <FileEdit size={17} />
                  </div>
                  <span className="ua-exec-tag">Work Done & Changes ({rangeLabel})</span>
                </div>
                <span className="ua-exec-card-action">View feed <ArrowRight size={12} /></span>
              </div>
              <div className="ua-exec-main">
                <span className="ua-exec-big-num">{t.actions?.toLocaleString()}</span>
                <span className="ua-exec-subtitle">updates & saves</span>
              </div>
              <div className="ua-progress-container">
                <div className="ua-progress-bar-thin">
                  <div className="ua-progress-bar-fill" style={{ width: '65%', background: '#a855f7' }} />
                </div>
              </div>
              <div className="ua-exec-desc-text">
                Real actions taken (leads created, tasks updated, forms saved).
              </div>
            </div>
          </div>

          {/* Clean Analytics Row: Peak Hourly Activity + Platform Split */}
          <div className="ua-analytics-row">
            {/* Peak Activity Hours Widget */}
            <div className="ua-sub-card">
              <div className="ua-sub-card-header">
                <div className="ua-sub-card-title">
                  <Clock size={16} color="#2563eb" />
                  <span>Peak Working Hours (IST)</span>
                </div>
                <span className="ua-sub-card-hint">Hourly system load</span>
              </div>
              <div className="ua-hourly-chart">
                {hourlyData.map(h => (
                  <div key={h.hr} className="ua-hour-col">
                    <div className="ua-hour-tooltip">
                      <strong>{h.label}</strong>: {h.count} actions
                    </div>
                    <div className="ua-hour-bar" style={{ height: `${h.height}%` }} />
                    <span className="ua-hour-label">{h.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Device / Platform Split Widget */}
            <div className="ua-sub-card">
              <div className="ua-sub-card-header">
                <div className="ua-sub-card-title">
                  <Smartphone size={16} color="#8b5cf6" />
                  <span>Platform Usage</span>
                </div>
                <span className="ua-sub-card-hint">Web vs App</span>
              </div>
              <div className="ua-device-list">
                <div className="ua-device-item">
                  <div className="ua-device-row">
                    <span className="ua-device-label"><Globe size={14} color="#2563eb" /> Web Desktop</span>
                    <span><strong>{deviceStats.webPct}%</strong> ({deviceStats.webCount})</span>
                  </div>
                  <div className="ua-progress-bar-thin">
                    <div className="ua-progress-bar-fill" style={{ width: `${deviceStats.webPct}%`, background: '#2563eb' }} />
                  </div>
                </div>

                <div className="ua-device-item">
                  <div className="ua-device-row">
                    <span className="ua-device-label"><Smartphone size={14} color="#8b5cf6" /> Mobile App</span>
                    <span><strong>{deviceStats.appPct}%</strong> ({deviceStats.appCount})</span>
                  </div>
                  <div className="ua-progress-bar-thin">
                    <div className="ua-progress-bar-fill" style={{ width: `${deviceStats.appPct}%`, background: '#8b5cf6' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights 2-Widgets Grid (People & Top Modules) */}
          <div className="ua-insights-grid">
            {/* Top 5 Active People */}
            <div className="ua-insight-card">
              <div className="ua-insight-head">
                <div className="ua-insight-title">
                  <Award size={17} color="#f59e0b" />
                  <span>Most Active Staff ({rangeLabel})</span>
                </div>
                <button
                  className="ua-btn-page"
                  onClick={() => setTab('users')}
                >
                  View All
                </button>
              </div>
              <div className="ua-insight-list">
                {topActivePeople.map((person, idx) => (
                  <div
                    key={person._id}
                    className="ua-insight-row clickable"
                    onClick={() => handleOpenUserDrawer(person)}
                    title="Click to view employee drawer"
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className={`ua-rank-badge ua-rank-${idx + 1}`}>{idx + 1}</span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#0f172a' }}>{person.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{person.role || person.department || 'Staff'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#2563eb' }}>
                        {person.views + person.actions} hits
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {person.actions} changes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Visited Modules */}
            <div className="ua-insight-card">
              <div className="ua-insight-head">
                <div className="ua-insight-title">
                  <TrendingUp size={17} color="#2563eb" />
                  <span>Top Visited Sections ({rangeLabel})</span>
                </div>
                <button
                  className="ua-btn-page"
                  onClick={() => setTab('pages')}
                >
                  View All
                </button>
              </div>
              <div className="ua-insight-list">
                {topPagesList.map((pg, idx) => (
                  <div
                    key={pg.path}
                    className="ua-insight-row clickable"
                    onClick={() => {
                      setFilters({ userId: '', path: pg.path, type: '' });
                      setTab('feed');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className={`ua-rank-badge ua-rank-${idx + 1}`}>{idx + 1}</span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#0f172a' }}>{pageName(pg.path)}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{pg.uniqueUsers} staff engaged</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a' }}>
                        {pg.views} views
                      </div>
                      <div style={{ fontSize: '0.7rem', color: pg.actions > 0 ? '#ea580c' : '#94a3b8' }}>
                        {pg.actions} changes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs and Content */}
          <div className="ua-tabs-card">
            <div className="ua-tabs-header">
              <button
                className={`ua-tab-btn ${tab === 'pages' ? 'active' : ''}`}
                onClick={() => setTab('pages')}
              >
                <Layers size={15} /> Pages Breakdown ({summary.pages?.length || 0})
              </button>
              <button
                className={`ua-tab-btn ${tab === 'users' ? 'active' : ''}`}
                onClick={() => setTab('users')}
              >
                <Users size={15} /> Active Staff ({allUsers.length})
              </button>
              <button
                className={`ua-tab-btn ${tab === 'feed' ? 'active' : ''}`}
                onClick={() => setTab('feed')}
              >
                <Activity size={15} /> Live Activity Log
              </button>
            </div>

            <div className="ua-tab-content">
              {tab === 'pages' && (
                <PagesTab
                  pages={summary.pages || []}
                  onOpenPage={path => {
                    setFilters({ userId: '', path, type: '' });
                    setTab('feed');
                  }}
                />
              )}
              {tab === 'users' && (
                <UsersTab
                  users={allUsers}
                  onOpenUser={handleOpenUserDrawer}
                />
              )}
              {tab === 'feed' && (
                <FeedTab
                  days={days}
                  users={allUsers}
                  pages={summary.pages || []}
                  filters={filters}
                  setFilters={setFilters}
                  onOpenUser={handleOpenUserDrawer}
                />
              )}
            </div>
          </div>

          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center', margin: '16px 0' }}>
            Activity recorded automatically across Web Desktop & Mobile App. Retention policy: 180 days.
          </div>
        </>
      ) : null}
    </div>
  );
}
