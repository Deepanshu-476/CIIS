import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiLayers,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiEye,
  FiX
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './WorkloadDistribution.css';

export default function WorkloadDistribution() {
  const [data, setData] = useState({ agents: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table controls
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected agent modal
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

  const agents = data.agents || [];
  const totals = data.totals || {};

  // Maximum assigned count for relative bar width calculation
  const maxAssigned = useMemo(() => {
    return Math.max(...agents.map((a) => a.assigned || 0), 1);
  }, [agents]);

  // Client search filter on agents
  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return agents;
    const q = searchTerm.toLowerCase();
    return agents.filter((a) => {
      const name = (a.name || '').toLowerCase();
      const role = (a.jobRole || a.role || '').toLowerCase();
      const email = (a.email || '').toLowerCase();
      return name.includes(q) || role.includes(q) || email.includes(q);
    });
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
      {/* Header */}
      <div className="wld-header">
        <div>
          <h1>Workload Distribution</h1>
        </div>
        <nav className="wld-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">CRM</Link>
          <FiChevronRight className="wld-crumb-arrow" />
          <Link to="/ciisUser/crm/admin/assignments">Lead Assignment</Link>
          <FiChevronRight className="wld-crumb-arrow" />
          <span>Workload Distribution</span>
        </nav>
      </div>

      {error && <div className="wld-alert-error">{error}</div>}

      {/* Stats Cards */}
      <div className="wld-stats-grid">
        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Total Assigned</span>
            <span className="wld-stat-value">{totals.assigned ?? 0}</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-purple">
            <FiLayers className="wld-icon-purple" />
          </div>
        </div>

        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Active Telecallers</span>
            <span className="wld-stat-value">{agents.length}</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-cyan">
            <FiUsers className="wld-icon-cyan" />
          </div>
        </div>

        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Completed Leads</span>
            <span className="wld-stat-value">{totals.completed ?? 0}</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-green">
            <FiUserCheck className="wld-icon-green" />
          </div>
        </div>

        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Pending Leads</span>
            <span className="wld-stat-value">{totals.pending ?? 0}</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-red">
            <FiClock className="wld-icon-red" />
          </div>
        </div>
      </div>

      {/* Workload Distribution Bars Card */}
      <div className="wld-card">
        <div className="wld-card-header">
          <h2>
            <FiLayers className="wld-header-icon" /> Workload Distribution
          </h2>
        </div>

        <div className="wld-bars-container">
          {loading ? (
            <div className="wld-table-loading">Loading workload distribution...</div>
          ) : agents.length === 0 ? (
            <div className="wld-table-empty">No active telecallers found.</div>
          ) : (
            agents.map((agent, index) => {
              const assigned = agent.assigned || 0;
              const pct = maxAssigned > 0 ? Math.round((assigned / maxAssigned) * 100) : 0;
              // Cycle bar colors: cyan, orange, red
              const colorClass =
                pct > 70 ? 'wld-bar-red' : pct > 35 ? 'wld-bar-orange' : 'wld-bar-cyan';

              return (
                <div key={agent._id || index} className="wld-bar-row">
                  <div className="wld-bar-label-wrap">
                    <span className="wld-agent-name">{agent.name}</span>
                    <span className="wld-bar-count">
                      {assigned} leads ({agent.conversion || 0}% conv)
                    </span>
                  </div>
                  <div className="wld-bar-track">
                    <div
                      className={`wld-bar-fill ${colorClass}`}
                      style={{ width: `${Math.max(pct, assigned > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Team Breakdown Table Card */}
      <div className="wld-card">
        <div className="wld-card-header">
          <h2>Team Breakdown</h2>
        </div>

        {/* Controls */}
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

          <div className="wld-search-control">
            <span>Search:</span>
            <input
              type="text"
              className="wld-input-search"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="wld-table-wrapper">
          <table className="wld-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>ROLE</th>
                <th>ASSIGNED</th>
                <th>COMPLETED</th>
                <th>PENDING</th>
                <th>FOLLOW-UPS</th>
                <th>CONVERSION</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="wld-table-loading">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="wld-table-empty">
                    No matching employees found.
                  </td>
                </tr>
              ) : (
                currentEntries.map((row) => {
                  const roleName = row.jobRole || row.companyRole || row.role || 'Telecaller';
                  const conversionVal = row.conversion ?? 0;

                  return (
                    <tr key={row._id}>
                      <td>
                        <div className="wld-user-cell">
                          <div className="wld-avatar">{getInitials(row.name)}</div>
                          <span className="wld-name">{row.name}</span>
                        </div>
                      </td>
                      <td>{roleName}</td>
                      <td>
                        <strong>{row.assigned ?? 0}</strong>
                      </td>
                      <td>{row.completed ?? 0}</td>
                      <td>{row.pending ?? 0}</td>
                      <td>{row.followUps ?? 0}</td>
                      <td>
                        <span
                          className={`wld-conversion-pill ${
                            conversionVal === 0 ? 'wld-conv-zero' : 'wld-conv-positive'
                          }`}
                        >
                          {conversionVal}%
                        </span>
                      </td>
                      <td>
                        <span className="wld-status-pill">Active</span>
                      </td>
                      <td>
                        <button
                          className="wld-action-btn"
                          title="View Details"
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
            Showing {filteredAgents.length === 0 ? 0 : indexOfFirst + 1} to{' '}
            {Math.min(indexOfLast, filteredAgents.length)} of {filteredAgents.length} entries
          </div>

          <div className="wld-pagination">
            <button
              className="wld-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              &laquo;
            </button>
            <button
              className="wld-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
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
              title="Next Page"
            >
              &gt;
            </button>
            <button
              className="wld-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="wld-modal-overlay">
          <div className="wld-modal-card">
            <div className="wld-modal-header">
              <h3>Agent Details - {selectedAgent.name}</h3>
              <button
                className="wld-modal-close"
                onClick={() => setSelectedAgent(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="wld-modal-body">
              <div className="wld-modal-grid">
                <div>
                  <strong>Role:</strong> {selectedAgent.jobRole || selectedAgent.role || 'Telecaller'}
                </div>
                <div>
                  <strong>Email:</strong> {selectedAgent.email || '—'}
                </div>
                <div>
                  <strong>Assigned Leads:</strong> {selectedAgent.assigned ?? 0}
                </div>
                <div>
                  <strong>Completed Leads:</strong> {selectedAgent.completed ?? 0}
                </div>
                <div>
                  <strong>Pending Leads:</strong> {selectedAgent.pending ?? 0}
                </div>
                <div>
                  <strong>Follow-ups Pending:</strong> {selectedAgent.followUps ?? 0}
                </div>
                <div>
                  <strong>Conversion Rate:</strong> {selectedAgent.conversion ?? 0}%
                </div>
                <div>
                  <strong>Status:</strong> Active
                </div>
              </div>
            </div>
            <div className="wld-modal-footer">
              <button
                className="wld-btn-sec"
                onClick={() => setSelectedAgent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
