import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronRight,
  FiUserX,
  FiUserCheck,
  FiUsers,
  FiBarChart2,
  FiUploadCloud,
  FiPieChart,
  FiClock,
  FiUserPlus,
  FiX,
  FiSearch,
  FiRefreshCw,
  FiArrowRight,
  FiPhone,
  FiMail,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './AssignmentsOverview.css';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

const formatTimeAgo = (value) => {
  if (!value) return '';
  try {
    const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return '';
  }
};

const leadCode = (id) => `#LD-${String(id || '').slice(-4).toUpperCase()}`;

const getInitials = (name) => {
  if (!name) return 'LD';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function AssignmentsOverview() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    metrics: { total: 0, assigned: 0, unassigned: 0, activeAgents: 0 },
    unassigned: [],
    recent: [],
    team: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 1 }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' | 'assigned' | 'all'

  // Modal state
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/crm/assignments/overview', {
        params: {
          page: currentPage,
          limit: entriesPerPage,
          search: searchTerm.trim(),
          filter: activeTab
        },
        _skipErrorNotify: true
      });
      setData(res.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignment overview data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, searchTerm, activeTab]);

  useEffect(() => {
    const timer = setTimeout(loadData, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const rows = data.unassigned || [];
  const pagination = data.pagination || { page: 1, limit: entriesPerPage, total: rows.length, pages: 1 };
  const metrics = data.metrics || {};
  const recentList = data.recent || [];
  const teamList = data.team || [];

  const handleConfirmAssign = async (e) => {
    e?.preventDefault();
    if (!selectedAgent || !assignModalLead) return;
    const previousAgentId = String(assignModalLead.assignedTo?._id || assignModalLead.assignedTo || '');
    const isTransfer = Boolean(previousAgentId) && previousAgentId !== selectedAgent;
    if (isTransfer && !transferReason.trim()) {
      setError('Enter a transfer reason before reassigning this lead.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.put(
        `/crm/leads/${assignModalLead._id}/assign`,
        { userId: selectedAgent, reason: isTransfer ? transferReason.trim() : '' },
        { _skipErrorNotify: true }
      );
      setSuccess(`Lead ${assignModalLead.name || ''} successfully assigned.`);
      setAssignModalLead(null);
      setSelectedAgent('');
      setTransferReason('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign lead.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination helper
  const totalPages = pagination.pages || 1;
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

  const indexOfFirst = (pagination.page - 1) * (pagination.limit || entriesPerPage);

  return (
    <div className="aso-page">
      {/* 1. Breadcrumb Bar */}
      <div className="aso-breadcrumb-bar">
        <Link to="/ciisUser/user-dashboard">Dashboard</Link>
        <span className="aso-bc-sep">/</span>
        <Link to="/ciisUser/crm/admin/dashboard">CRM</Link>
        <span className="aso-bc-sep">/</span>
        <span>Lead Assignment</span>
        <span className="aso-bc-sep">/</span>
        <span className="aso-bc-active">Overview</span>
      </div>

      {/* 2. Header Card */}
      <div className="aso-header-card">
        <div className="aso-header-main">
          <div className="aso-header-icon-box">
            <FiUploadCloud />
          </div>
          <div>
            <div className="aso-header-title-wrap">
              <h1 className="aso-page-title">Assignments Overview</h1>
              <span className="aso-live-badge">
                <span className="aso-pulse-dot"></span> Live
              </span>
            </div>
            <p className="aso-page-subtitle">
              Distribute incoming leads, balance telecaller workloads, and monitor real-time assignments
            </p>
          </div>
        </div>

        <div className="aso-header-actions">
          <button
            className="aso-btn aso-btn-secondary"
            onClick={loadData}
            title="Refresh Data"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            className="aso-btn aso-btn-secondary"
            onClick={() => navigate('/ciisUser/crm/admin/workload')}
            title="View Team Workload"
          >
            <FiPieChart />
            <span>Workload View</span>
          </button>
          <button
            className="aso-btn aso-btn-primary"
            onClick={() => navigate('/ciisUser/crm/admin/assignment-bulk')}
            title="Bulk Assign Leads"
          >
            <FiUploadCloud />
            <span>Bulk Assign</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="aso-alert-box error">
          <FiAlertCircle size={16} />
          <span>{error}</span>
          <button className="aso-alert-close" onClick={() => setError('')}>
            <FiX size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="aso-alert-box success">
          <FiCheckCircle size={16} />
          <span>{success}</span>
          <button className="aso-alert-close" onClick={() => setSuccess('')}>
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* 3. Top KPI Metric Cards */}
      <div className="aso-kpi-grid">
        <div className="aso-kpi-card" onClick={() => { setActiveTab('unassigned'); setCurrentPage(1); }}>
          <div className="aso-kpi-top">
            <div className="aso-kpi-icon-wrap amber">
              <FiUserX />
            </div>
            <span className="aso-kpi-label">Unassigned Leads</span>
          </div>
          <div className="aso-kpi-bottom">
            <span className="aso-kpi-val">{metrics.unassigned ?? 0}</span>
            <span className="aso-kpi-sub">Awaiting assignment</span>
          </div>
        </div>

        <div className="aso-kpi-card" onClick={() => { setActiveTab('assigned'); setCurrentPage(1); }}>
          <div className="aso-kpi-top">
            <div className="aso-kpi-icon-wrap emerald">
              <FiUserCheck />
            </div>
            <span className="aso-kpi-label">Assigned Leads</span>
          </div>
          <div className="aso-kpi-bottom">
            <span className="aso-kpi-val">{metrics.assigned ?? 0}</span>
            <span className="aso-kpi-sub">In telecaller pipeline</span>
          </div>
        </div>

        <div className="aso-kpi-card">
          <div className="aso-kpi-top">
            <div className="aso-kpi-icon-wrap purple">
              <FiUsers />
            </div>
            <span className="aso-kpi-label">Active Telecallers</span>
          </div>
          <div className="aso-kpi-bottom">
            <span className="aso-kpi-val">{metrics.activeAgents ?? 0}</span>
            <span className="aso-kpi-sub">Eligible for leads</span>
          </div>
        </div>

        <div className="aso-kpi-card" onClick={() => { setActiveTab('all'); setCurrentPage(1); }}>
          <div className="aso-kpi-top">
            <div className="aso-kpi-icon-wrap blue">
              <FiBarChart2 />
            </div>
            <span className="aso-kpi-label">Total Inquiries</span>
          </div>
          <div className="aso-kpi-bottom">
            <span className="aso-kpi-val">{metrics.total ?? 0}</span>
            <span className="aso-kpi-sub">All CRM inquiries</span>
          </div>
        </div>
      </div>

      {/* 4. Middle 2-Column Section */}
      <div className="aso-middle-grid">
        {/* Quick Actions Card */}
        <div className="aso-card aso-hub-card">
          <div className="aso-card-head">
            <h3 className="aso-card-title">Quick Actions & Workflows</h3>
            <p className="aso-card-desc">Streamlined routing tools and distribution logs</p>
          </div>

          <div className="aso-hub-list">
            <div
              className="aso-hub-item"
              onClick={() => navigate('/ciisUser/crm/admin/assignment-bulk')}
            >
              <div className="aso-hub-item-icon blue">
                <FiUploadCloud />
              </div>
              <div className="aso-hub-item-text">
                <h4>Bulk Assign Leads</h4>
                <p>Select a role and distribute leads equally across chosen users</p>
              </div>
              <FiArrowRight className="aso-hub-item-arrow" />
            </div>

            <div
              className="aso-hub-item"
              onClick={() => navigate('/ciisUser/crm/admin/workload')}
            >
              <div className="aso-hub-item-icon purple">
                <FiPieChart />
              </div>
              <div className="aso-hub-item-text">
                <h4>Workload Distribution</h4>
                <p>Monitor active lead balance across each telecaller</p>
              </div>
              <FiArrowRight className="aso-hub-item-arrow" />
            </div>

            <div
              className="aso-hub-item"
              onClick={() => navigate('/ciisUser/crm/admin/assignment-history')}
            >
              <div className="aso-hub-item-icon amber">
                <FiClock />
              </div>
              <div className="aso-hub-item-text">
                <h4>Assignment History</h4>
                <p>View timestamped audit logs of all past assignment actions</p>
              </div>
              <FiArrowRight className="aso-hub-item-arrow" />
            </div>
          </div>
        </div>

        {/* Recent Assignment Activity Feed */}
        <div className="aso-card aso-recent-card">
          <div className="aso-card-head">
            <h3 className="aso-card-title">Recent Assignment Activity</h3>
            <p className="aso-card-desc">Latest distribution events performed in CRM</p>
          </div>

          <div className="aso-recent-feed">
            {!recentList.length ? (
              <div className="aso-feed-empty">
                <FiClock size={24} />
                <p>No recent assignment activity recorded.</p>
              </div>
            ) : (
              recentList.slice(0, 5).map((item) => {
                const leadName = item.lead?.name || 'Lead';
                const code = leadCode(item.lead?._id || item._id);
                const agentName = item.toUser?.name || 'Agent';
                const performer = item.performedBy?.name || 'System / Admin';
                return (
                  <div key={item._id} className="aso-feed-item">
                    <div className="aso-feed-avatar">{getInitials(leadName)}</div>
                    <div className="aso-feed-content">
                      <div className="aso-feed-lead-line">
                        <span className="aso-feed-lead-name">{leadName}</span>
                        <span className="aso-feed-lead-code">{code}</span>
                      </div>
                      <div className="aso-feed-target-line">
                        <span>Assigned to</span>
                        <strong className="aso-feed-agent">{agentName}</strong>
                        <span className="aso-feed-by">by {performer}</span>
                      </div>
                    </div>
                    <span className="aso-feed-time">{formatTimeAgo(item.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Assignment Workspace Table Card */}
      <div className="aso-card aso-table-card">
        <div className="aso-table-topbar">
          {/* Filter Tabs */}
          <div className="aso-filter-tabs">
            <button
              className={`aso-tab-pill ${activeTab === 'unassigned' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('unassigned');
                setCurrentPage(1);
              }}
            >
              Unassigned Leads
              <span className="aso-pill-count">{metrics.unassigned ?? 0}</span>
            </button>
            <button
              className={`aso-tab-pill ${activeTab === 'assigned' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('assigned');
                setCurrentPage(1);
              }}
            >
              Assigned Leads
              <span className="aso-pill-count">{metrics.assigned ?? 0}</span>
            </button>
            <button
              className={`aso-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
            >
              All Inquiries
              <span className="aso-pill-count">{metrics.total ?? 0}</span>
            </button>
          </div>

          <div className="aso-table-top-actions">
            {activeTab === 'unassigned' && (
              <button
                className="aso-btn aso-btn-primary"
                onClick={() => navigate('/ciisUser/crm/admin/assignment-bulk')}
              >
                <FiUploadCloud />
                <span>Bulk Assign</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="aso-toolbar">
          <div className="aso-search-wrap">
            <FiSearch className="aso-search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button className="aso-search-clear" onClick={() => setSearchTerm('')}>
                <FiX size={13} />
              </button>
            )}
          </div>

          <div className="aso-page-size-picker">
            <span>Show:</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="aso-table-scroll">
          <table className="aso-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>#</th>
                <th>Lead ID</th>
                <th>Contact Details</th>
                <th>Source</th>
                <th>Type / Course</th>
                <th>Status</th>
                <th>Assigned Telecaller</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'center', width: 110 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="aso-state-row">
                    <div className="aso-loading-wrap">
                      <div className="aso-spinner"></div>
                      <span>Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="aso-state-row">
                    <div className="aso-empty-wrap">
                      <FiSearch size={28} />
                      <h4>No {activeTab} leads found</h4>
                      <p>
                        {searchTerm
                          ? `No leads matched your search "${searchTerm}".`
                          : activeTab === 'unassigned'
                          ? 'Great job! All incoming leads are currently assigned to telecallers.'
                          : 'There are currently no records in this view.'}
                      </p>
                      {searchTerm && (
                        <button className="aso-btn aso-btn-secondary" onClick={() => setSearchTerm('')}>
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const code = leadCode(row._id);
                  const sourceName = row.leadSource?.name || row.source || 'Direct';
                  const typeName = row.leadType?.name || row.type || 'General';
                  const assignedAgent = row.assignedTo?.name || null;
                  const status = String(row.status || 'New');
                  const statusLower = status.toLowerCase();

                  let statusClass = 'neutral';
                  if (['converted', 'enrolled'].some((s) => statusLower.includes(s))) statusClass = 'success';
                  else if (['interested', 'qualified'].some((s) => statusLower.includes(s))) statusClass = 'info';
                  else if (['pending', 'follow-up', 'in-progress'].some((s) => statusLower.includes(s))) statusClass = 'warning';
                  else if (['lost', 'not interested', 'wrong number'].some((s) => statusLower.includes(s))) statusClass = 'danger';

                  return (
                    <tr key={row._id}>
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                        {indexOfFirst + index + 1}
                      </td>
                      <td>
                        <span className="aso-lead-code-tag">{code}</span>
                      </td>
                      <td>
                        <div className="aso-contact-cell">
                          <span className="aso-contact-name">{row.name || 'Unnamed Lead'}</span>
                          <div className="aso-contact-meta">
                            {row.phone && (
                              <span className="aso-contact-item">
                                <FiPhone size={11} /> {row.phone}
                              </span>
                            )}
                            {row.email && (
                              <span className="aso-contact-item">
                                <FiMail size={11} /> {row.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="aso-badge-source">{sourceName}</span>
                      </td>
                      <td>
                        <span className="aso-badge-type">{typeName}</span>
                      </td>
                      <td>
                        <span className={`aso-status-pill ${statusClass}`}>{status}</span>
                      </td>
                      <td>
                        {assignedAgent ? (
                          <div className="aso-agent-cell">
                            <span className="aso-agent-bubble">{getInitials(assignedAgent)}</span>
                            <span className="aso-agent-name">{assignedAgent}</span>
                          </div>
                        ) : (
                          <span className="aso-unassigned-tag">Unassigned</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>
                        {formatDate(row.createdAt)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="aso-assign-action-btn"
                          title={assignedAgent ? 'Reassign Lead' : 'Assign to Telecaller'}
                          onClick={() => {
                            setAssignModalLead(row);
                            setSelectedAgent(row.assignedTo?._id || '');
                            setTransferReason('');
                          }}
                        >
                          <FiUserPlus size={13} />
                          <span>{assignedAgent ? 'Reassign' : 'Assign'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {rows.length > 0 && (
          <div className="aso-table-footer">
            <div className="aso-showing-info">
              Showing {rows.length === 0 ? 0 : indexOfFirst + 1} to {indexOfFirst + rows.length} of{' '}
              {pagination.total || rows.length} entries
            </div>

            <div className="aso-pagination-nav">
              <button
                className="aso-pg-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
              >
                &laquo;
              </button>
              <button
                className="aso-pg-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                Prev
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  className={`aso-pg-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="aso-pg-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                Next
              </button>
              <button
                className="aso-pg-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Assign Single Lead Modal */}
      {assignModalLead && (
        <div className="aso-modal-backdrop" onClick={() => setAssignModalLead(null)}>
          <div className="aso-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="aso-modal-head">
              <div className="aso-modal-title-wrap">
                <FiUserPlus className="aso-modal-icon" />
                <div>
                  <h3>Assign Lead to Telecaller</h3>
                  <span className="aso-modal-subtitle">{leadCode(assignModalLead._id)}</span>
                </div>
              </div>
              <button
                className="aso-modal-close"
                onClick={() => setAssignModalLead(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="aso-modal-body">
              {/* Lead Preview Card */}
              <div className="aso-modal-lead-summary">
                <div className="aso-modal-lead-avatar">{getInitials(assignModalLead.name)}</div>
                <div className="aso-modal-lead-info">
                  <strong>{assignModalLead.name || 'Unnamed Lead'}</strong>
                  <span>{assignModalLead.phone || 'No phone number'}</span>
                </div>
                <span className="aso-badge-source" style={{ marginLeft: 'auto' }}>
                  {assignModalLead.leadSource?.name || assignModalLead.source || 'Direct'}
                </span>
              </div>

              <div className="aso-modal-form-group">
                <label>Select Telecaller / Agent</label>
                <select
                  className="aso-modal-select"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <option value="">Choose an eligible agent...</option>
                  {teamList.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} ({agent.jobRole || agent.role || 'Telecaller'})
                    </option>
                  ))}
                </select>
              </div>
              {assignModalLead.assignedTo && String(assignModalLead.assignedTo?._id || assignModalLead.assignedTo) !== selectedAgent && (
                <div className="aso-modal-form-group">
                  <label htmlFor="aso-transfer-reason">Transfer Reason *</label>
                  <textarea
                    id="aso-transfer-reason"
                    className="aso-modal-select"
                    value={transferReason}
                    onChange={event => setTransferReason(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Why is this lead being transferred?"
                  />
                </div>
              )}
            </div>

            <div className="aso-modal-footer">
              <button
                type="button"
                className="aso-btn aso-btn-secondary"
                onClick={() => setAssignModalLead(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="aso-btn aso-btn-primary"
                disabled={!selectedAgent || submitting || (Boolean(assignModalLead.assignedTo) && String(assignModalLead.assignedTo?._id || assignModalLead.assignedTo) !== selectedAgent && !transferReason.trim())}
                onClick={handleConfirmAssign}
              >
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
