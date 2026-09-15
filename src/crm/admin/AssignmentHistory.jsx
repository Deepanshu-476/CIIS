import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiDownload
} from 'react-icons/fi';
import './AssignmentHistory.css';

const INITIAL_AUDIT_LOGS = [
  {
    id: 1,
    dateTime: '22 Aug 2026, 12:07 PM',
    leadId: '#LD-010',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 2',
    performedBy: 'Admin'
  },
  {
    id: 2,
    dateTime: '22 Aug 2026, 12:07 PM',
    leadId: '#LD-011',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 2',
    performedBy: 'Admin'
  },
  {
    id: 3,
    dateTime: '22 Aug 2026, 12:07 PM',
    leadId: '#LD-012',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 2',
    performedBy: 'Admin'
  },
  {
    id: 4,
    dateTime: '22 Aug 2026, 12:07 PM',
    leadId: '#LD-013',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 2',
    performedBy: 'Admin'
  },
  {
    id: 5,
    dateTime: '22 Aug 2026, 12:07 PM',
    leadId: '#LD-007',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 1',
    performedBy: 'Admin'
  },
  {
    id: 6,
    dateTime: '22 Aug 2026, 12:07 PM',
    leadId: '#LD-008',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 1',
    performedBy: 'Admin'
  },
  {
    id: 7,
    dateTime: '22 Aug 2026, 12:07 PM',
    leadId: '#LD-009',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 1',
    performedBy: 'Admin'
  },
  {
    id: 8,
    dateTime: '22 Aug 2026, 12:08 PM',
    leadId: '#LD-039',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 2',
    performedBy: 'Admin'
  },
  {
    id: 9,
    dateTime: '22 Aug 2026, 12:08 PM',
    leadId: '#LD-040',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 2',
    performedBy: 'Admin'
  },
  {
    id: 10,
    dateTime: '22 Aug 2026, 12:08 PM',
    leadId: '#LD-041',
    action: 'Assigned',
    fromUser: 'New Lead',
    toUser: 'Telecaller 2',
    performedBy: 'Admin'
  }
];

export default function AssignmentHistory() {
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);

  // Filters State
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [fromFilter, setFromFilter] = useState('All Users');
  const [toFilter, setToFilter] = useState('All Users');
  const [performedFilter, setPerformedFilter] = useState('All Users');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('2026-09-01');

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setActionFilter('All Actions');
    setFromFilter('All Users');
    setToFilter('All Users');
    setPerformedFilter('All Users');
    setDateFrom('');
    setDateTo('2026-09-01');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== 'All Actions' && log.action !== actionFilter) return false;
      if (fromFilter !== 'All Users' && log.fromUser !== fromFilter) return false;
      if (toFilter !== 'All Users' && log.toUser !== toFilter) return false;
      if (performedFilter !== 'All Users' && log.performedBy !== performedFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          log.leadId.toLowerCase().includes(query) ||
          log.fromUser.toLowerCase().includes(query) ||
          log.toUser.toLowerCase().includes(query) ||
          log.performedBy.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, actionFilter, fromFilter, toFilter, performedFilter, searchTerm]);

  const totalEntries = 49; // Matching screenshot total count
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filteredLogs.slice(0, entriesPerPage);

  const handleExportLog = () => {
    // Generate CSV export
    const headers = ['DATE/TIME', 'LEAD', 'ACTION', 'FROM', 'TO', 'PERFORMED BY'];
    const rows = filteredLogs.map(l => [
      l.dateTime,
      l.leadId,
      l.action,
      l.fromUser,
      l.toUser,
      l.performedBy
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'assignment_audit_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ash-root">
      {/* Top Header */}
      <div className="ash-header">
        <div>
          <h1>Assignment History</h1>
        </div>
        <nav className="ash-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight className="ash-crumb-arrow" />
          <Link to="/ciisUser/crm/admin/assignments">Assignments</Link>
          <FiChevronRight className="ash-crumb-arrow" />
          <span>Assignment History</span>
        </nav>
      </div>

      {/* Filter Grid Card */}
      <div className="ash-card ash-filter-card">
        <div className="ash-filter-grid">
          <div className="ash-field">
            <label>Action</label>
            <select
              className="ash-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="All Actions">All Actions</option>
              <option value="Assigned">Assigned</option>
              <option value="Reassigned">Reassigned</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          <div className="ash-field">
            <label>From User</label>
            <select
              className="ash-select"
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
            >
              <option value="All Users">All Users</option>
              <option value="New Lead">New Lead</option>
              <option value="Telecaller 1">Telecaller 1</option>
              <option value="Telecaller 2">Telecaller 2</option>
            </select>
          </div>

          <div className="ash-field">
            <label>To User</label>
            <select
              className="ash-select"
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
            >
              <option value="All Users">All Users</option>
              <option value="Telecaller 1">Telecaller 1</option>
              <option value="Telecaller 2">Telecaller 2</option>
              <option value="Marketing Exec3">Marketing Exec3</option>
            </select>
          </div>

          <div className="ash-field">
            <label>Performed By</label>
            <select
              className="ash-select"
              value={performedFilter}
              onChange={(e) => setPerformedFilter(e.target.value)}
            >
              <option value="All Users">All Users</option>
              <option value="Admin">Admin</option>
              <option value="Marketing Exec3">Marketing Exec3</option>
            </select>
          </div>

          <div className="ash-field">
            <label>Date From</label>
            <input
              type="date"
              className="ash-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="ash-field">
            <label>Date To</label>
            <input
              type="date"
              className="ash-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="ash-filter-actions">
            <button className="ash-btn-apply" onClick={handleApplyFilter}>
              <FiFilter /> Apply
            </button>
            <button className="ash-btn-reset" title="Reset Filters" onClick={handleResetFilter}>
              <FiRotateCcw />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card: Assignment Audit Log */}
      <div className="ash-card">
        <div className="ash-table-header">
          <h2>Assignment Audit Log</h2>
          <button className="ash-btn-export" onClick={handleExportLog}>
            <FiDownload /> Export Log
          </button>
        </div>

        {/* Datatable Controls */}
        <div className="ash-table-controls">
          <div className="ash-entries-control">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ash-select-small"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="ash-search-control">
            <span>Search:</span>
            <input
              type="text"
              className="ash-input-search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="ash-table-wrapper">
          <table className="ash-table">
            <thead>
              <tr>
                <th>DATE/TIME</th>
                <th>LEAD</th>
                <th>ACTION</th>
                <th>FROM</th>
                <th>TO</th>
                <th>PERFORMED BY</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((row) => (
                <tr key={row.id}>
                  <td>{row.dateTime}</td>
                  <td className="ash-lead-id">{row.leadId}</td>
                  <td>
                    <span className="ash-action-pill">{row.action}</span>
                  </td>
                  <td>{row.fromUser}</td>
                  <td>{row.toUser}</td>
                  <td>{row.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="ash-table-footer">
          <div className="ash-showing-info">
            Showing 1 to {currentEntries.length} of 49 entries
          </div>

          <div className="ash-pagination">
            <button className="ash-page-btn">&laquo;</button>
            <button className="ash-page-btn">&lt;</button>
            <button className="ash-page-btn active">1</button>
            <button className="ash-page-btn">2</button>
            <button className="ash-page-btn">3</button>
            <button className="ash-page-btn">4</button>
            <button className="ash-page-btn">5</button>
            <button className="ash-page-btn">&gt;</button>
            <button className="ash-page-btn">&raquo;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
