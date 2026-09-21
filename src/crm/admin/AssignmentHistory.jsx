import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiDownload
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './AssignmentHistory.css';

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
};

const leadCode = (id) => `#LD-${String(id || '').slice(-4).toUpperCase()}`;

export default function AssignmentHistory() {
  const [items, setItems] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter controls
  const [actionFilter, setActionFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: entriesPerPage
      };
      if (actionFilter !== 'All') {
        params.action = actionFilter.toLowerCase();
      }
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await api.get('/crm/assignments/history', {
        params,
        _skipErrorNotify: true
      });
      const data = res.data || {};
      setItems(data.items || []);
      setTotalEntries(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment history load nahi hui.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleApplyFilter = () => {
    setCurrentPage(1);
    loadHistory();
  };

  const handleResetFilter = () => {
    setActionFilter('All');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Client search within current page items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((item) => {
      const lName = item.lead?.name?.toLowerCase() || '';
      const lPhone = item.lead?.phone?.toLowerCase() || '';
      const fromName = item.fromUser?.name?.toLowerCase() || '';
      const toName = item.toUser?.name?.toLowerCase() || '';
      const performer = item.performedBy?.name?.toLowerCase() || '';
      const code = leadCode(item.lead?._id).toLowerCase();
      return (
        lName.includes(q) ||
        lPhone.includes(q) ||
        fromName.includes(q) ||
        toName.includes(q) ||
        performer.includes(q) ||
        code.includes(q)
      );
    });
  }, [items, searchTerm]);

  // Export to CSV
  const handleExportLog = () => {
    if (!items.length) return;
    const headers = ['DATE/TIME', 'LEAD CODE', 'LEAD NAME', 'ACTION', 'FROM', 'TO', 'PERFORMED BY'];
    const rows = filteredItems.map((item) => [
      formatDateTime(item.createdAt),
      leadCode(item.lead?._id),
      item.lead?.name || 'Deleted lead',
      item.action,
      item.fromUser?.name || 'New Lead',
      item.toUser?.name || '—',
      item.performedBy?.name || 'System'
    ]);

    const escapeCsv = (val) => `"${String(val ?? '').replaceAll('"', '""')}"`;
    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assignment_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const indexOfFirst = (currentPage - 1) * entriesPerPage;

  // Pagination buttons
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

      {error && <div className="ash-alert-error">{error}</div>}

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
              <option value="All">All Actions</option>
              <option value="Assigned">Assigned</option>
              <option value="Reassigned">Reassigned</option>
              <option value="Unassigned">Unassigned</option>
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
          <button
            className="ash-btn-export"
            disabled={!items.length}
            onClick={handleExportLog}
          >
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
              placeholder="Search current logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              {loading ? (
                <tr>
                  <td colSpan="6" className="ash-table-loading">
                    Loading assignment logs...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="ash-table-empty">
                    No assignment audit history found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((row) => {
                  const lName = row.lead?.name || 'Deleted lead';
                  const code = leadCode(row.lead?._id || row._id);
                  const actionName = (row.action || 'assigned').toUpperCase();

                  return (
                    <tr key={row._id}>
                      <td>{formatDateTime(row.createdAt)}</td>
                      <td>
                        <span className="ash-lead-id">{code}</span>
                        <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{lName}</div>
                      </td>
                      <td>
                        <span className="ash-action-pill">{actionName}</span>
                      </td>
                      <td>{row.fromUser?.name || 'New Lead'}</td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{row.toUser?.name || '—'}</strong>
                      </td>
                      <td>{row.performedBy?.name || 'System / Admin'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="ash-table-footer">
          <div className="ash-showing-info">
            Showing {filteredItems.length === 0 ? 0 : indexOfFirst + 1} to{' '}
            {indexOfFirst + filteredItems.length} of {totalEntries} entries
          </div>

          <div className="ash-pagination">
            <button
              className="ash-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              &laquo;
            </button>
            <button
              className="ash-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              &lt;
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                className={`ash-page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              className="ash-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              &gt;
            </button>
            <button
              className="ash-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
