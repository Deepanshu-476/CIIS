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
  FiChevronRight as FiArrowRight,
  FiUserPlus,
  FiX
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

  // Modal state
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/crm/assignments/overview', {
        params: {
          page: currentPage,
          limit: entriesPerPage,
          search: searchTerm.trim()
        },
        _skipErrorNotify: true
      });
      setData(res.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment overview data load nahi ho saka.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
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

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.put(
        `/crm/leads/${assignModalLead._id}/assign`,
        { userId: selectedAgent },
        { _skipErrorNotify: true }
      );
      setSuccess(`Lead ${assignModalLead.name || ''} successfully assigned.`);
      setAssignModalLead(null);
      setSelectedAgent('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lead assign karne me error aaya.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'LD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Pagination pages helper
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
    <div className="aso-root">
      {/* Header */}
      <div className="aso-header">
        <div>
          <h1>Assignments Overview</h1>
          <div className="aso-breadcrumb">
            <Link to="/ciisUser/crm/admin/dashboard">CRM</Link>
            <span className="aso-crumb-arrow"><FiChevronRight /></span>
            <span>Lead Assignment</span>
            <span className="aso-crumb-arrow"><FiChevronRight /></span>
            <span>Overview</span>
          </div>
        </div>
      </div>

      {error && <div className="aso-alert-error">{error}</div>}
      {success && <div className="aso-alert-success">{success}</div>}

      {/* Stats Cards */}
      <div className="aso-stats-grid">
        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Unassigned Leads</span>
            <span className="aso-stat-value">{metrics.unassigned ?? 0}</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-red">
            <FiUserX className="aso-icon-red" />
          </div>
        </div>

        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Assigned Leads</span>
            <span className="aso-stat-value">{metrics.assigned ?? 0}</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-green">
            <FiUserCheck className="aso-icon-green" />
          </div>
        </div>

        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Active Telecallers</span>
            <span className="aso-stat-value">{metrics.activeAgents ?? 0}</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-purple">
            <FiUsers className="aso-icon-purple" />
          </div>
        </div>

        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Total Inquiries</span>
            <span className="aso-stat-value">{metrics.total ?? 0}</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-blue">
            <FiBarChart2 className="aso-icon-blue" />
          </div>
        </div>
      </div>

      {/* 2 Column Section: Quick Actions & Recent Assignments */}
      <div className="aso-top-grid">
        {/* Quick Actions Card */}
        <div className="aso-card aso-quick-card">
          <div className="aso-card-title-wrap">
            <h2>Quick Actions</h2>
            <span className="aso-card-sub">Bulk assignment, rules & logs</span>
          </div>

          <div className="aso-action-list">
            <div
              className="aso-action-item"
              onClick={() => navigate('/ciisUser/crm/admin/assignment-bulk')}
            >
              <div className="aso-action-icon-box aso-box-blue">
                <FiUploadCloud />
              </div>
              <div className="aso-action-text">
                <h3>Bulk Assign Leads</h3>
                <p>Assign unassigned leads in batches or round-robin</p>
              </div>
              <FiArrowRight className="aso-action-arrow" />
            </div>

            <div
              className="aso-action-item"
              onClick={() => navigate('/ciisUser/crm/admin/workload')}
            >
              <div className="aso-action-icon-box aso-box-purple">
                <FiPieChart />
              </div>
              <div className="aso-action-text">
                <h3>Workload View</h3>
                <p>See team workload distribution</p>
              </div>
              <FiArrowRight className="aso-action-arrow" />
            </div>

            <div
              className="aso-action-item"
              onClick={() => navigate('/ciisUser/crm/admin/assignment-history')}
            >
              <div className="aso-action-icon-box aso-box-orange">
                <FiClock />
              </div>
              <div className="aso-action-text">
                <h3>Assignment History</h3>
                <p>View assignment audit log history</p>
              </div>
              <FiArrowRight className="aso-action-arrow" />
            </div>
          </div>
        </div>

        {/* Recent Assignments Card */}
        <div className="aso-card aso-recent-card">
          <div className="aso-card-title-wrap">
            <h2>
              <FiClock className="aso-recent-clock-icon" /> Recent Assignments
            </h2>
          </div>

          <div className="aso-recent-list">
            {!recentList.length ? (
              <div className="aso-table-empty">No recent assignment activity.</div>
            ) : (
              recentList.slice(0, 5).map((item) => {
                const leadName = item.lead?.name || 'Lead';
                const code = leadCode(item.lead?._id || item._id);
                const agentName = item.toUser?.name || 'Agent';
                const performer = item.performedBy?.name || 'System / Admin';
                return (
                  <div key={item._id} className="aso-recent-item">
                    <div className="aso-recent-avatar">{getInitials(leadName)}</div>
                    <div className="aso-recent-details">
                      <div className="aso-recent-main">
                        <span>Lead </span>
                        <span className="aso-lead-tag">{code}</span>
                        <span> assigned to </span>
                        <span className="aso-agent-link">{agentName}</span>
                      </div>
                      <div className="aso-recent-sub">Performed by {performer}</div>
                    </div>
                    <div className="aso-recent-time">{formatTimeAgo(item.createdAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Unassigned Leads Table Card */}
      <div className="aso-card">
        <div className="aso-table-header">
          <h2>Unassigned Leads</h2>
          <button
            className="aso-btn-bulk"
            onClick={() => navigate('/ciisUser/crm/admin/assignment-bulk')}
          >
            <FiUploadCloud /> Bulk Assign
          </button>
        </div>

        {/* Controls */}
        <div className="aso-table-controls">
          <div className="aso-entries-control">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="aso-select-small"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="aso-search-control">
            <span>Search:</span>
            <input
              type="text"
              className="aso-input-search"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="aso-table-wrapper">
          <table className="aso-table">
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>LEAD ID</th>
                <th>LEAD SOURCE</th>
                <th>LEAD TYPE</th>
                <th>NAME</th>
                <th>GENDER</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>ADDRESS</th>
                <th>CREATED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="aso-table-loading">Loading unassigned leads...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="11" className="aso-table-empty">No unassigned leads found.</td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const sourceName = row.leadSource?.name || row.source || 'Direct';
                  const typeName = row.leadType?.name || row.type || 'General';
                  const code = leadCode(row._id);
                  const address = row.address || row.city || row.state || '—';
                  const remarks = row.remarks || row.notes || '—';

                  return (
                    <tr key={row._id}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td className="aso-lead-id">{code}</td>
                      <td>
                        <span className="aso-pill-source">{sourceName}</span>
                      </td>
                      <td>
                        <span className="aso-pill-type">{typeName}</span>
                      </td>
                      <td>
                        <div>
                          <div className="aso-name">{row.name || 'Unnamed'}</div>
                          {remarks !== '—' && <div className="aso-sub">{remarks}</div>}
                        </div>
                      </td>
                      <td>{row.gender || '—'}</td>
                      <td>{row.email || '—'}</td>
                      <td>{row.phone || '—'}</td>
                      <td>{address}</td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td>
                        <button
                          className="aso-btn-assign"
                          title="Assign Lead"
                          onClick={() => {
                            setAssignModalLead(row);
                            setSelectedAgent('');
                          }}
                        >
                          <FiUserPlus />
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
        <div className="aso-table-footer">
          <div className="aso-showing-info">
            Showing {rows.length === 0 ? 0 : indexOfFirst + 1} to {indexOfFirst + rows.length} of {pagination.total || rows.length} entries
          </div>
          <div className="aso-pagination">
            <button
              className="aso-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              &laquo;
            </button>
            <button
              className="aso-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              &lt;
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                className={`aso-page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              className="aso-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              &gt;
            </button>
            <button
              className="aso-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Assign Single Lead Modal */}
      {assignModalLead && (
        <div className="aso-modal-overlay">
          <div className="aso-modal-card">
            <div className="aso-modal-header">
              <h3>Assign Lead ({leadCode(assignModalLead._id)})</h3>
              <button
                className="aso-modal-close"
                onClick={() => setAssignModalLead(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="aso-modal-body">
              <p className="aso-modal-lead-name">
                Assign <strong>{assignModalLead.name}</strong> ({assignModalLead.phone || 'No phone'}) to an agent:
              </p>
              <div className="aso-field">
                <label>Select Telecaller / Agent</label>
                <select
                  className="aso-select"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <option value="">Choose Agent...</option>
                  {teamList.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} — {agent.jobRole || agent.role || 'Telecaller'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="aso-modal-footer">
              <button
                type="button"
                className="aso-btn-cancel"
                onClick={() => setAssignModalLead(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="aso-btn-confirm"
                disabled={!selectedAgent || submitting}
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
