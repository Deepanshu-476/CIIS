import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiLayers,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiEye,
  FiX,
  FiSearch,
  FiTrendingUp,
  FiCalendar,
  FiAward,
  FiArrowUpRight
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './WorkloadDistribution.css';

// Rich pastel palettes for telecaller avatars
const AVATAR_PALETTES = [
  { bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', color: '#6d28d9', border: '#c4b5fd' }, // Violet
  { bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', color: '#0369a1', border: '#7dd3fc' }, // Sky
  { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#047857', border: '#6ee7b7' }, // Emerald
  { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309', border: '#fcd34d' }, // Amber
  { bg: 'linear-gradient(135deg, #ffe4e6, #fecdd3)', color: '#be123c', border: '#fda4af' }, // Rose
  { bg: 'linear-gradient(135deg, #fae8ff, #f5d0fe)', color: '#86198f', border: '#f0abfc' }  // Fuchsia
];

const getAvatarStyle = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

const formatTimeAgo = (value) => {
  if (!value) return 'No activity recorded';
  try {
    const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recent';
  }
};

export default function WorkloadDistribution() {
  const [data, setData] = useState({ agents: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table controls
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected agent for slide-over drawer
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/crm/assignments/workload', { _skipErrorNotify: true })
      .then((res) => {
        setData(res.data || { agents: [], totals: {} });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Workload distribution report load nahi ho saki.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const agents = useMemo(
    () => (Array.isArray(data.agents) ? data.agents : []).filter((agent) => Number(agent.assigned) > 0),
    [data.agents]
  );
  const totals = data.totals || {};

  // Maximum assigned count for relative bar width
  const maxAssigned = useMemo(() => {
    return Math.max(...agents.map((a) => a.assigned || 0), 1);
  }, [agents]);

  // Overall calculations for KPI cards
  const totalAssigned = totals.assigned || 0;
  const completedRate = totalAssigned > 0 ? Math.round(((totals.completed || 0) / totalAssigned) * 100) : 0;
  const pendingRate = totalAssigned > 0 ? Math.round(((totals.pending || 0) / totalAssigned) * 100) : 0;
  const avgLeadsPerAgent = agents.length > 0 ? Math.round(totalAssigned / agents.length) : 0;

  // Search filter on agents (default sorted by highest assigned leads)
  const filteredAgents = useMemo(() => {
    let result = agents;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((a) => {
        const name = (a.name || '').toLowerCase();
        const role = (a.displayRole || a.jobRole || a.role || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        return name.includes(q) || role.includes(q) || email.includes(q);
      });
    }

    return [...result].sort((a, b) => (b.assigned || 0) - (a.assigned || 0));
  }, [agents, searchTerm]);

  // Pagination
  const totalPages = Math.max(Math.ceil(filteredAgents.length / entriesPerPage), 1);
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filteredAgents.slice(indexOfFirst, indexOfLast);

  const getInitials = (name) => {
    if (!name) return 'TC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxDisplayed = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxDisplayed - 1);
    if (end - start < maxDisplayed - 1) {
      start = Math.max(1, end - maxDisplayed + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="wld-root">
      {/* Header & Breadcrumb */}
      <div className="wld-header">
        <div className="wld-header-text">
          <h1 className="wld-title">Workload Distribution</h1>
          <span className="wld-subtitle-badge">
            <span className="wld-dot-live" /> Real-time Monitoring
          </span>
        </div>
        <nav className="wld-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">CRM</Link>
          <FiChevronRight className="wld-crumb-arrow" />
          <Link to="/ciisUser/crm/admin/assignments">Assignments</Link>
          <FiChevronRight className="wld-crumb-arrow" />
          <span className="wld-crumb-active">Workload</span>
        </nav>
      </div>

      {error && <div className="wld-alert-error">{error}</div>}

      {/* Top 4 Attractive Stat Cards */}
      <div className="wld-stats-grid">
        {/* Card 1: Total Assigned */}
        <div className="wld-stat-card card-accent-purple">
          <div className="wld-stat-glow-bg glow-purple" />
          <div className="wld-stat-left">
            <span className="wld-stat-label">Total Assigned</span>
            <span className="wld-stat-value">{totals.assigned ?? 0}</span>
            <div className="wld-stat-foot">
              <span className="wld-stat-badge badge-purple">Active Pool</span>
              <span className="wld-foot-sub">{agents.length} members</span>
            </div>
          </div>
          <div className="wld-stat-icon-wrapper bg-purple">
            <FiLayers />
          </div>
        </div>

        {/* Card 2: Assigned Telecallers */}
        <div className="wld-stat-card card-accent-cyan">
          <div className="wld-stat-glow-bg glow-cyan" />
          <div className="wld-stat-left">
            <span className="wld-stat-label">Assigned Telecallers</span>
            <span className="wld-stat-value">{agents.length}</span>
            <div className="wld-stat-foot">
              <span className="wld-stat-badge badge-cyan">Team Size</span>
              <span className="wld-foot-sub">~{avgLeadsPerAgent} avg / agent</span>
            </div>
          </div>
          <div className="wld-stat-icon-wrapper bg-cyan">
            <FiUsers />
          </div>
        </div>

        {/* Card 3: Completed Leads */}
        <div className="wld-stat-card card-accent-green">
          <div className="wld-stat-glow-bg glow-green" />
          <div className="wld-stat-left">
            <span className="wld-stat-label">Completed Leads</span>
            <span className="wld-stat-value">{totals.completed ?? 0}</span>
            <div className="wld-stat-foot">
              <span className="wld-stat-badge badge-green">
                <FiArrowUpRight style={{ marginRight: 2 }} /> {completedRate}% Rate
              </span>
              <span className="wld-foot-sub">Won & Closed</span>
            </div>
          </div>
          <div className="wld-stat-icon-wrapper bg-green">
            <FiUserCheck />
          </div>
        </div>

        {/* Card 4: Pending Leads */}
        <div className="wld-stat-card card-accent-amber">
          <div className="wld-stat-glow-bg glow-amber" />
          <div className="wld-stat-left">
            <span className="wld-stat-label">Pending Leads</span>
            <span className="wld-stat-value">{totals.pending ?? 0}</span>
            <div className="wld-stat-foot">
              <span className="wld-stat-badge badge-amber">{pendingRate}% Pipeline</span>
              <span className="wld-foot-sub">In progress</span>
            </div>
          </div>
          <div className="wld-stat-icon-wrapper bg-amber">
            <FiClock />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="wld-card">
        {/* Controls Bar */}
        <div className="wld-table-controls">
          <div className="wld-entries-control">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="wld-select-small"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="wld-search-wrap">
            <FiSearch className="wld-search-icon" />
            <input
              type="text"
              className="wld-input-search"
              placeholder="Search telecaller by name or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                className="wld-search-clear"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* Clean Static Table Headers - Zero Arrows or Dropdown-like elements */}
        <div className="wld-table-wrapper">
          <table className="wld-table">
            <thead>
              <tr>
                <th>TELECALLER</th>
                <th>ROLE</th>
                <th>ASSIGNED</th>
                <th>COMPLETED</th>
                <th>PENDING</th>
                <th>FOLLOW-UPS</th>
                <th>CONVERSION</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="wld-table-loading">
                    <div className="wld-spinner-wrap">
                      <div className="wld-spinner" />
                      <span>Loading workload distribution...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="wld-table-empty">
                    <FiUsers className="wld-empty-ico" />
                    <p>No matching telecallers found.</p>
                  </td>
                </tr>
              ) : (
                currentEntries.map((row) => {
                  const roleName = row.displayRole || row.jobRole || row.companyRole || row.role || 'Telecaller';
                  const conversionVal = row.conversion ?? 0;
                  const assignedVal = row.assigned ?? 0;
                  const barPct = maxAssigned > 0 ? Math.round((assignedVal / maxAssigned) * 100) : 0;
                  const avStyle = getAvatarStyle(row.name);

                  // Gradient selection based on workload volume
                  const isHighLoad = barPct > 70;
                  const isModerateLoad = barPct > 35;
                  const barGradientClass = isHighLoad
                    ? 'bar-gradient-rose'
                    : isModerateLoad
                    ? 'bar-gradient-purple'
                    : 'bar-gradient-cyan';

                  return (
                    <tr key={row._id} className="wld-table-row">
                      <td>
                        <div className="wld-user-cell">
                          <div
                            className="wld-avatar"
                            style={{
                              background: avStyle.bg,
                              color: avStyle.color,
                              borderColor: avStyle.border
                            }}
                          >
                            {getInitials(row.name)}
                            <span className="wld-avatar-dot" />
                          </div>
                          <div className="wld-user-meta">
                            <span className="wld-name">{row.name}</span>
                            <span className="wld-email">{row.email || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="wld-role-tag">{roleName}</span>
                      </td>
                      <td>
                        <div className="wld-workload-cell" title={`${assignedVal} leads assigned (${barPct}% of max load)`}>
                          <div className="wld-workload-top">
                            <span className="wld-assigned-num">{assignedVal}</span>
                            <span className="wld-workload-pct">{barPct}%</span>
                          </div>
                          <div className="wld-mini-track">
                            <div
                              className={`wld-mini-bar ${barGradientClass}`}
                              style={{ width: `${Math.max(barPct, 8)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="wld-completed-num">{row.completed ?? 0}</span>
                      </td>
                      <td>
                        <span className="wld-pending-num">{row.pending ?? 0}</span>
                      </td>
                      <td>
                        <span className="wld-followups-num">{row.followUps ?? 0}</span>
                      </td>
                      <td>
                        <span
                          className={`wld-conversion-pill ${
                            conversionVal >= 15
                              ? 'conv-high'
                              : conversionVal > 0
                              ? 'conv-positive'
                              : 'conv-zero'
                          }`}
                        >
                          {conversionVal >= 15 && <FiAward style={{ marginRight: 3 }} />}
                          {conversionVal > 0 && conversionVal < 15 && <FiTrendingUp style={{ marginRight: 3 }} />}
                          {conversionVal}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="wld-action-btn"
                          title="View Telecaller Profile & Breakdown"
                          onClick={() => setSelectedAgent(row)}
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="wld-table-footer">
          <div className="wld-showing-info">
            Showing <strong>{filteredAgents.length === 0 ? 0 : indexOfFirst + 1}</strong> to{' '}
            <strong>{Math.min(indexOfLast, filteredAgents.length)}</strong> of{' '}
            <strong>{filteredAgents.length}</strong> telecallers
          </div>

          <div className="wld-pagination">
            <button
              className="wld-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First"
            >
              &laquo;
            </button>
            <button
              className="wld-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous"
            >
              &lt;
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                className={`wld-page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              className="wld-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next"
            >
              &gt;
            </button>
            <button
              className="wld-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Modern Slide-Over Drawer */}
      {selectedAgent && (
        <div className="wld-drawer-backdrop" onClick={() => setSelectedAgent(null)}>
          <div className="wld-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header with Glass Effect */}
            <div className="wld-drawer-header">
              <div className="wld-drawer-user">
                <div
                  className="wld-drawer-avatar"
                  style={{
                    background: getAvatarStyle(selectedAgent.name).bg,
                    color: getAvatarStyle(selectedAgent.name).color,
                    borderColor: getAvatarStyle(selectedAgent.name).border
                  }}
                >
                  {getInitials(selectedAgent.name)}
                </div>
                <div>
                  <h3 className="wld-drawer-name">{selectedAgent.name}</h3>
                  <span className="wld-drawer-role">
                    {selectedAgent.displayRole || selectedAgent.jobRole || selectedAgent.role || 'Telecaller'}
                  </span>
                </div>
              </div>
              <button
                className="wld-drawer-close"
                onClick={() => setSelectedAgent(null)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="wld-drawer-body">
              {/* 4 Mini Stat Tiles with Soft Aura */}
              <div className="wld-drawer-tiles">
                <div className="wld-tile tile-purple">
                  <span className="wld-tile-lbl">Assigned</span>
                  <span className="wld-tile-num">{selectedAgent.assigned ?? 0}</span>
                </div>
                <div className="wld-tile tile-green">
                  <span className="wld-tile-lbl">Completed</span>
                  <span className="wld-tile-num">{selectedAgent.completed ?? 0}</span>
                </div>
                <div className="wld-tile tile-amber">
                  <span className="wld-tile-lbl">Pending</span>
                  <span className="wld-tile-num">{selectedAgent.pending ?? 0}</span>
                </div>
                <div className="wld-tile tile-cyan">
                  <span className="wld-tile-lbl">Follow-ups</span>
                  <span className="wld-tile-num">{selectedAgent.followUps ?? 0}</span>
                </div>
              </div>

              {/* Progress Split */}
              <div className="wld-drawer-section">
                <div className="wld-drawer-section-header">
                  <span>Workload Breakdown</span>
                  <span className="wld-conv-badge">
                    <FiTrendingUp style={{ marginRight: 3 }} /> {selectedAgent.conversion ?? 0}% Conversion
                  </span>
                </div>
                <div className="wld-split-bar-track">
                  {selectedAgent.assigned > 0 ? (
                    <>
                      <div
                        className="wld-split-part part-completed"
                        style={{ width: `${Math.round(((selectedAgent.completed || 0) / selectedAgent.assigned) * 100)}%` }}
                        title={`Completed: ${selectedAgent.completed}`}
                      />
                      <div
                        className="wld-split-part part-pending"
                        style={{ width: `${Math.round(((selectedAgent.pending || 0) / selectedAgent.assigned) * 100)}%` }}
                        title={`Pending: ${selectedAgent.pending}`}
                      />
                    </>
                  ) : (
                    <div className="wld-split-empty" />
                  )}
                </div>
                <div className="wld-split-legend">
                  <span className="wld-leg-item">
                    <span className="wld-dot dot-green" /> Completed ({selectedAgent.completed ?? 0})
                  </span>
                  <span className="wld-leg-item">
                    <span className="wld-dot dot-amber" /> In Progress ({selectedAgent.pending ?? 0})
                  </span>
                </div>
              </div>

              {/* Detailed Info List */}
              <div className="wld-drawer-info-list">
                <div className="wld-info-row">
                  <span className="wld-info-k">Email Address</span>
                  <span className="wld-info-v">{selectedAgent.email || '—'}</span>
                </div>
                <div className="wld-info-row">
                  <span className="wld-info-k">Account Status</span>
                  <span className="wld-info-v">
                    <span className="wld-status-pill-active">
                      <span className="wld-dot-live-sm" /> Active
                    </span>
                  </span>
                </div>
                <div className="wld-info-row">
                  <span className="wld-info-k">Last Lead Activity</span>
                  <span className="wld-info-v">
                    <FiCalendar style={{ marginRight: 5, color: '#94a3b8' }} />
                    {formatTimeAgo(selectedAgent.lastActivity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="wld-drawer-footer">
              <button
                className="wld-btn-drawer-close"
                onClick={() => setSelectedAgent(null)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
