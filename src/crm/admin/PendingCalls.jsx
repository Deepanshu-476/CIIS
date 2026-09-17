import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiUser,
  FiPhoneCall
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './PendingCalls.css';

export default function PendingCalls() {
  const [options, setOptions] = useState({ telecallers: [], sources: [], leadTypes: [] });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({
    assignedTo: '',
    source: '',
    leadType: '',
    status: '',
    attempts: ''
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState(null);

  // Fetch filter options
  useEffect(() => {
    let active = true;
    api.get('/crm/admin/calls/options', { cache: false })
      .then(res => {
        if (!active) return;
        setOptions({
          telecallers: res.data?.telecallers || [],
          sources: res.data?.sources || [],
          leadTypes: res.data?.leadTypes || []
        });
      })
      .catch(err => console.error('Failed to load filter options:', err));
    return () => { active = false; };
  }, []);

  // Fetch pending calls from API
  const fetchPendingCalls = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: entriesPerPage,
      search: searchTerm.trim() || undefined,
      assignedTo: appliedFilters.assignedTo || undefined,
      source: appliedFilters.source || undefined,
      leadType: appliedFilters.leadType || undefined,
      status: appliedFilters.status || undefined,
      attempts: appliedFilters.attempts !== '' ? appliedFilters.attempts : undefined
    };

    api.get('/crm/admin/calls/pending', { params, cache: false })
      .then(res => {
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load pending calls:', err);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, entriesPerPage, appliedFilters, searchTerm]);

  useEffect(() => {
    fetchPendingCalls();
  }, [fetchPendingCalls]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initial = {
      assignedTo: '',
      source: '',
      leadType: '',
      status: '',
      attempts: ''
    };
    setFilters(initial);
    setAppliedFilters(initial);
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="pc-root">
      {/* Page Header */}
      <header className="pc-page-header">
        <h1>Pending Calls</h1>
        <nav aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight size={12} />
          <span>Pending Calls</span>
        </nav>
      </header>

      {/* Top Filter Bar */}
      <section className="pc-filter-panel">
        <div className="pc-filter-grid">
          <div className="pc-field">
            <label>Assigned To</label>
            <select
              value={filters.assignedTo}
              onChange={e => handleFilterChange('assignedTo', e.target.value)}
            >
              <option value="">All Users</option>
              {options.telecallers.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="pc-field">
            <label>Lead Source</label>
            <select
              value={filters.source}
              onChange={e => handleFilterChange('source', e.target.value)}
            >
              <option value="">All Sources</option>
              {options.sources.map(s => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="pc-field">
            <label>Lead Type</label>
            <select
              value={filters.leadType}
              onChange={e => handleFilterChange('leadType', e.target.value)}
            >
              <option value="">All Types</option>
              {options.leadTypes.map(t => (
                <option key={t._id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="pc-field">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Assigned">Assigned</option>
              <option value="New">New</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Interested">Interested</option>
            </select>
          </div>

          <div className="pc-field">
            <label>Attempts</label>
            <select
              value={filters.attempts}
              onChange={e => handleFilterChange('attempts', e.target.value)}
            >
              <option value="">Any</option>
              <option value="0">0 Attempts (Never Called)</option>
              <option value="1">1 Attempt</option>
              <option value="2">2 Attempts</option>
              <option value="3">3+ Attempts</option>
            </select>
          </div>

          <div className="pc-filter-actions">
            <button type="button" className="pc-btn-apply" onClick={handleApply}>
              <FiFilter size={14} /> Apply
            </button>
            <button type="button" className="pc-btn-reset" onClick={handleReset} title="Reset filters">
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Card: Calls Pending Action */}
      <section className="pc-log-card">
        <header className="pc-log-header">
          <h2>Calls Pending Action</h2>
        </header>

        {/* Entries & Search Toolbar */}
        <div className="pc-toolbar">
          <div className="pc-entries-selector">
            <select
              value={entriesPerPage}
              onChange={e => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="pc-search-box">
            <span>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search leads..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="pc-table-wrapper">
          {loading ? (
            <div className="pc-empty-state">
              <p>Loading pending calls...</p>
            </div>
          ) : items.length > 0 ? (
            <table className="pc-table">
              <thead>
                <tr>
                  <th>SL NO.</th>
                  <th>LEAD</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>LEAD TYPE</th>
                  <th>STATUS</th>
                  <th>LAST CALL</th>
                  <th>NEXT FOLLOW UP</th>
                  <th>ASSIGNED AGE</th>
                  <th>PRIORITY</th>
                  <th>ASSIGNED TO</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {items.map((call, idx) => (
                  <tr key={call.leadMongoId || idx}>
                    <td>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                    <td className="pc-lead-id">{call.leadId}</td>
                    <td className="pc-lead-name">{call.name}</td>
                    <td className="pc-phone">{call.phone}</td>
                    <td>
                      <span className="pc-badge pc-badge-source">{call.source}</span>
                    </td>
                    <td>
                      <span className="pc-badge pc-badge-type">{call.leadType}</span>
                    </td>
                    <td>
                      <span className="pc-badge pc-badge-status">{call.status}</span>
                    </td>
                    <td>
                      <span className="pc-badge pc-badge-lastcall">{call.lastCall}</span>
                    </td>
                    <td>
                      <span className="pc-badge pc-badge-followup">{call.nextFollowup}</span>
                    </td>
                    <td className="pc-assigned-age">
                      <span className="pc-assigned-date">{call.assignedDate}</span>
                      <span className="pc-assigned-ago">{call.assignedAgo}</span>
                    </td>
                    <td>
                      <span className={`pc-badge pc-badge-priority priority-${String(call.priority).toLowerCase()}`}>
                        {call.priority}
                      </span>
                    </td>
                    <td>
                      <span className="pc-telecaller">
                        <FiUser size={13} /> {call.assignedTo}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pc-action-btn"
                        onClick={() => setSelectedCall(call)}
                        title="View Call Details"
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="pc-empty-state">
              <div className="pc-empty-icon">
                <FiPhoneCall size={24} />
              </div>
              <h3>No Pending Calls Found</h3>
              <p>There are no calls matching your filter criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="pc-table-footer">
          <div className="pc-entries-info">
            Showing {total ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, total)} of {total} entries
          </div>

          <div className="pc-pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="page-btn"
            >
              &laquo;
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="page-btn"
            >
              &lsaquo;
            </button>

            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
              .filter(pageNum => totalPages <= 7 || Math.abs(pageNum - currentPage) <= 2 || pageNum === 1 || pageNum === totalPages)
              .map((pageNum, idx, arr) => (
                <React.Fragment key={pageNum}>
                  {idx > 0 && pageNum - arr[idx - 1] > 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                  <button
                    onClick={() => setCurrentPage(pageNum)}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              &raquo;
            </button>
          </div>
        </div>
      </section>

      {/* Modal for Call Details */}
      {selectedCall && (
        <div className="pc-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="pc-modal-content" onClick={e => e.stopPropagation()}>
            <div className="pc-modal-header">
              <h3>Pending Lead Details</h3>
              <button type="button" className="pc-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="pc-modal-body">
              <div className="pc-modal-grid">
                <div><strong>Lead ID:</strong> {selectedCall.leadId}</div>
                <div><strong>Name:</strong> {selectedCall.name}</div>
                <div><strong>Phone Number:</strong> {selectedCall.phone}</div>
                <div><strong>Source:</strong> {selectedCall.source}</div>
                <div><strong>Lead Type:</strong> {selectedCall.leadType}</div>
                <div><strong>Current Status:</strong> {selectedCall.status}</div>
                <div><strong>Call Attempts:</strong> {selectedCall.attempts}</div>
                <div><strong>Last Call:</strong> {selectedCall.lastCall}</div>
                <div><strong>Next Follow Up:</strong> {selectedCall.nextFollowup}</div>
                <div><strong>Priority:</strong> {selectedCall.priority}</div>
                <div><strong>Assigned To:</strong> {selectedCall.assignedTo}</div>
                <div><strong>Assigned Age:</strong> {selectedCall.assignedAgo}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
