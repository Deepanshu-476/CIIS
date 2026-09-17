import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiClipboard,
  FiUsers,
  FiBarChart2,
  FiUserX,
  FiLayers,
  FiEye,
  FiX
} from 'react-icons/fi';
import './WorkloadDistribution.css';

const INITIAL_TEAM_BREAKDOWN = [
  {
    id: 1,
    initials: 'MA',
    name: 'Marketing Exec1',
    role: 'Marketing Exec',
    assigned: 0,
    completed: 0,
    pending: 0,
    conversion: '0%',
    status: 'Active'
  },
  {
    id: 2,
    initials: 'MA',
    name: 'Marketing Exec2',
    role: 'Marketing Exec',
    assigned: 0,
    completed: 0,
    pending: 0,
    conversion: '0%',
    status: 'Active'
  },
  {
    id: 3,
    initials: 'MA',
    name: 'Marketing Exec3',
    role: 'Marketing Exec',
    assigned: 6,
    completed: 0,
    pending: 6,
    conversion: '0%',
    status: 'Active'
  },
  {
    id: 4,
    initials: 'TE',
    name: 'Telecaller 1',
    role: 'Telecaller',
    assigned: 3,
    completed: 1,
    pending: 2,
    conversion: '33.3%',
    status: 'Active'
  },
  {
    id: 5,
    initials: 'TE',
    name: 'Telecaller 2',
    role: 'Telecaller',
    assigned: 9,
    completed: 0,
    pending: 9,
    conversion: '0%',
    status: 'Active'
  },
  {
    id: 6,
    initials: 'TE',
    name: 'Telecaller 3',
    role: 'Telecaller',
    assigned: 0,
    completed: 0,
    pending: 0,
    conversion: '0%',
    status: 'Active'
  }
];

const WORKLOAD_BARS = [
  { name: 'Telecaller 2', leads: 9, percentage: 50, colorClass: 'wld-bar-red' },
  { name: 'Marketing Exec3', leads: 6, percentage: 33, colorClass: 'wld-bar-orange' },
  { name: 'Telecaller 1', leads: 3, percentage: 17, colorClass: 'wld-bar-cyan' },
  { name: 'Telecaller 3', leads: 0, percentage: 0, colorClass: 'wld-bar-grey' },
  { name: 'Marketing Exec1', leads: 0, percentage: 0, colorClass: 'wld-bar-grey' }
];

export default function WorkloadDistribution() {
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM_BREAKDOWN);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedAgent, setSelectedAgent] = useState(null);

  const filteredTeam = useMemo(() => {
    if (!searchTerm.trim()) return teamMembers;
    const query = searchTerm.toLowerCase();
    return teamMembers.filter(
      m =>
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query)
    );
  }, [teamMembers, searchTerm]);

  return (
    <div className="wld-root">
      {/* Page Header */}
      <div className="wld-header">
        <div>
          <h1>Workload View</h1>
        </div>
        <nav className="wld-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight className="wld-crumb-arrow" />
          <Link to="/ciisUser/crm/admin/assignments">Assignments</Link>
          <FiChevronRight className="wld-crumb-arrow" />
          <span>Workload Distribution</span>
        </nav>
      </div>

      {/* Stat Cards Row */}
      <div className="wld-stats-grid">
        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Total Leads</span>
            <span className="wld-stat-value">295</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-purple">
            <FiClipboard className="wld-icon-purple" />
          </div>
        </div>

        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Active Agents</span>
            <span className="wld-stat-value">6</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-green">
            <FiUsers className="wld-icon-green" />
          </div>
        </div>

        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Avg. Load</span>
            <span className="wld-stat-value">3</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-cyan">
            <FiBarChart2 className="wld-icon-cyan" />
          </div>
        </div>

        <div className="wld-stat-card">
          <div className="wld-stat-info">
            <span className="wld-stat-label">Unassigned</span>
            <span className="wld-stat-value">277</span>
          </div>
          <div className="wld-stat-icon-wrap wld-bg-red">
            <FiUserX className="wld-icon-red" />
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
          {WORKLOAD_BARS.map((bar, index) => (
            <div key={index} className="wld-bar-row">
              <div className="wld-bar-label-wrap">
                <span className="wld-agent-name">{bar.name}</span>
                <span className="wld-bar-count">
                  {bar.leads} leads ({bar.percentage}%)
                </span>
              </div>
              <div className="wld-bar-track">
                <div
                  className={`wld-bar-fill ${bar.colorClass}`}
                  style={{ width: `${bar.percentage}%` }}
                />
              </div>
            </div>
          ))}
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
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <th>CONVERSION</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="wld-user-cell">
                      <div className="wld-avatar">{row.initials}</div>
                      <span className="wld-name">{row.name}</span>
                    </div>
                  </td>
                  <td>{row.role}</td>
                  <td>{row.assigned}</td>
                  <td>{row.completed}</td>
                  <td>{row.pending}</td>
                  <td>
                    <span
                      className={`wld-conversion-pill ${
                        row.conversion === '0%' ? 'wld-conv-zero' : 'wld-conv-positive'
                      }`}
                    >
                      {row.conversion}
                    </span>
                  </td>
                  <td>
                    <span className="wld-status-pill">{row.status}</span>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="wld-table-footer">
          <div className="wld-showing-info">
            Showing 1 to {filteredTeam.length} of {teamMembers.length} entries
          </div>

          <div className="wld-pagination">
            <button className="wld-page-btn">&laquo;</button>
            <button className="wld-page-btn">&lt;</button>
            <button className="wld-page-btn active">1</button>
            <button className="wld-page-btn">&gt;</button>
            <button className="wld-page-btn">&raquo;</button>
          </div>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="wld-modal-overlay">
          <div className="wld-modal-card">
            <div className="wld-modal-header">
              <h3>Agent Details - {selectedAgent.name}</h3>
              <button className="wld-modal-close" onClick={() => setSelectedAgent(null)}>
                <FiX />
              </button>
            </div>
            <div className="wld-modal-body">
              <div className="wld-modal-grid">
                <div>
                  <strong>Role:</strong> {selectedAgent.role}
                </div>
                <div>
                  <strong>Assigned Leads:</strong> {selectedAgent.assigned}
                </div>
                <div>
                  <strong>Completed Leads:</strong> {selectedAgent.completed}
                </div>
                <div>
                  <strong>Pending Leads:</strong> {selectedAgent.pending}
                </div>
                <div>
                  <strong>Conversion Rate:</strong> {selectedAgent.conversion}
                </div>
                <div>
                  <strong>Status:</strong> {selectedAgent.status}
                </div>
              </div>
            </div>
            <div className="wld-modal-footer">
              <button className="wld-btn-sec" onClick={() => setSelectedAgent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
