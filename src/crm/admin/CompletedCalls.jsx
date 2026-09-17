import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiUser,
  FiSearch,
  FiCheckCircle,
  FiSmile,
  FiClock,
  FiAward,
  FiCalendar,
  FiPhoneCall
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './CompletedCalls.css';

const CompletedCalls = () => {
  const [options, setOptions] = useState({ telecallers: [], sources: [], leadTypes: [], outcomes: [] });
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalCompletedCount: 0,
    interestedCount: 0,
    todayCompletedCount: 0,
    convertedCount: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    assignedTo: '',
    outcome: '',
    callType: '',
    source: '',
    leadType: '',
    completedDate: ''
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
          leadTypes: res.data?.leadTypes || [],
          outcomes: res.data?.outcomes || []
        });
      })
      .catch(err => console.error('Failed to load filter options:', err));
    return () => { active = false; };
  }, []);

  // Fetch completed calls from API
  const fetchCompletedCalls = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: entriesPerPage,
      search: searchTerm.trim() || undefined,
      assignedTo: appliedFilters.assignedTo || undefined,
      outcome: appliedFilters.outcome || undefined,
      callType: appliedFilters.callType || undefined,
      source: appliedFilters.source || undefined,
      leadType: appliedFilters.leadType || undefined,
      completedDate: appliedFilters.completedDate || undefined
    };

    api.get('/crm/admin/calls/completed', { params, cache: false })
      .then(res => {
        setItems(res.data?.items || []);
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load completed calls:', err);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, entriesPerPage, appliedFilters, searchTerm]);

  useEffect(() => {
    fetchCompletedCalls();
  }, [fetchCompletedCalls]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initial = {
      assignedTo: '',
      outcome: '',
      callType: '',
      source: '',
      leadType: '',
      completedDate: ''
    };
    setFilters(initial);
    setAppliedFilters(initial);
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="cc-root">
      {/* Header */}
      <header className="cc-page-header">
        <div>
          <span className="cc-sub-title">CRM / Call Management</span>
          <h1 className="cc-page-title">Completed Calls</h1>
        </div>
        <nav aria-label="Breadcrumb" className="cc-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight size={12} />
          <span className="active">Completed Calls</span>
        </nav>
      </header>

      {/* Stats Row */}
      <section className="cc-stats-grid">
        <div className="cc-stat-card">
          <div className="cc-stat-left">
            <span className="cc-stat-label">Total Completed</span>
            <span className="cc-stat-value">{loading ? '...' : stats.totalCompletedCount}</span>
            <span className="cc-stat-badge purple">Call Logs</span>
          </div>
          <div className="cc-stat-icon purple">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-left">
            <span className="cc-stat-label">Interested</span>
            <span className="cc-stat-value">{loading ? '...' : stats.interestedCount}</span>
            <span className="cc-stat-badge emerald">Prospects</span>
          </div>
          <div className="cc-stat-icon emerald">
            <FiSmile size={20} />
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-left">
            <span className="cc-stat-label">Today Completed</span>
            <span className="cc-stat-value">{loading ? '...' : stats.todayCompletedCount}</span>
            <span className="cc-stat-badge amber">Today</span>
          </div>
          <div className="cc-stat-icon amber">
            <FiClock size={20} />
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-left">
            <span className="cc-stat-label">Converted</span>
            <span className="cc-stat-value">{loading ? '...' : stats.convertedCount}</span>
            <span className="cc-stat-badge teal">Closed Leads</span>
          </div>
          <div className="cc-stat-icon teal">
            <FiAward size={20} />
          </div>
        </div>
      </section>

      {/* Filter Grid */}
      <section className="cc-filter-panel">
        <div className="cc-filter-grid">
          <div className="cc-field">
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

          <div className="cc-field">
            <label>Outcome</label>
            <select
              value={filters.outcome}
              onChange={e => handleFilterChange('outcome', e.target.value)}
            >
              <option value="">All Outcomes</option>
              {options.outcomes.map(out => (
                <option key={out} value={out}>{out}</option>
              ))}
            </select>
          </div>

          <div className="cc-field">
            <label>Call Type</label>
            <select
              value={filters.callType}
              onChange={e => handleFilterChange('callType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Outbound">Outbound</option>
              <option value="Inbound">Inbound</option>
            </select>
          </div>

          <div className="cc-field">
            <label>Lead Source</label>
            <select
              value={filters.source}
              onChange={e => handleFilterChange('source', e.target.value)}
            >
              <option value="">Select Lead Source</option>
              {options.sources.map(s => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="cc-field">
            <label>Lead Type</label>
            <select
              value={filters.leadType}
              onChange={e => handleFilterChange('leadType', e.target.value)}
            >
              <option value="">Select Lead Type</option>
              {options.leadTypes.map(t => (
                <option key={t._id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="cc-field">
            <label>Completed Date</label>
            <div className="cc-date-input-wrap">
              <input
                type="date"
                value={filters.completedDate}
                onChange={e => handleFilterChange('completedDate', e.target.value)}
              />
              <FiCalendar className="cc-date-icon" />
            </div>
          </div>

          <div className="cc-filter-actions">
            <button type="button" className="cc-btn-apply" onClick={handleApply}>
              <FiFilter size={14} /> Apply
            </button>
            <button type="button" className="cc-btn-reset" onClick={handleReset} title="Reset filters">
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="cc-log-card">
        <header className="cc-log-header">
          <h2>Completed Call Log</h2>
        </header>

        <div className="cc-toolbar">
          <div className="cc-entries-selector">
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

          <div className="cc-search-box">
            <span>Search:</span>
            <div className="cc-search-input-wrap">
              <FiSearch size={14} className="cc-search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search calls..."
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="cc-table-wrapper">
          {loading ? (
            <div className="cc-empty-state">
              <p>Loading completed calls...</p>
            </div>
          ) : items.length > 0 ? (
            <table className="cc-table">
              <thead>
                <tr>
                  <th>SL NO.</th>
                  <th>LEAD ID</th>
                  <th>LEAD</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>LEAD TYPE</th>
                  <th>OUTCOME</th>
                  <th>CALL TYPE</th>
                  <th>COMPLETED AT</th>
                  <th>ATTEMPTS</th>
                  <th>ASSIGNED TO</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {items.map((call, idx) => (
                  <tr key={call.leadMongoId || idx}>
                    <td>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                    <td className="cc-lead-id">{call.leadId}</td>
                    <td className="cc-lead-name">
                      <strong>{call.name}</strong>
                      {call.note && <small>{call.note}</small>}
                    </td>
                    <td className="cc-phone">{call.phone}</td>
                    <td><span className="cc-badge source">{call.source}</span></td>
                    <td><span className="cc-badge type">{call.leadType}</span></td>
                    <td><span className={`cc-badge outcome ${String(call.outcome).toLowerCase().replace(/\s+/g, '-')}`}>{call.outcome}</span></td>
                    <td><span className={`cc-badge calltype ${String(call.callType).toLowerCase()}`}>{call.callType}</span></td>
                    <td className="cc-completed-time">{call.completedAt}</td>
                    <td className="cc-attempts">{call.attempts}</td>
                    <td>
                      <span className="cc-telecaller">
                        <FiUser size={13} /> {call.assignedTo}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="cc-action-btn"
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
            <div className="cc-empty-state">
              <div className="cc-empty-icon">
                <FiPhoneCall size={24} />
              </div>
              <h3>No Completed Calls Found</h3>
              <p>Completed calls matching your criteria will appear here.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="cc-table-footer">
          <div className="cc-entries-info">
            Showing {total ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, total)} of {total} entries
          </div>

          <div className="cc-pagination">
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

      {/* Details Modal */}
      {selectedCall && (
        <div className="cc-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="cc-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cc-modal-header">
              <h3>Completed Call Details</h3>
              <button type="button" className="cc-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="cc-modal-body">
              <div className="cc-modal-grid">
                <div><strong>Lead ID:</strong> {selectedCall.leadId}</div>
                <div><strong>Name:</strong> {selectedCall.name}</div>
                <div><strong>Phone Number:</strong> {selectedCall.phone}</div>
                <div><strong>Lead Source:</strong> {selectedCall.source}</div>
                <div><strong>Lead Type:</strong> {selectedCall.leadType}</div>
                <div><strong>Call Outcome:</strong> {selectedCall.outcome}</div>
                <div><strong>Call Type:</strong> {selectedCall.callType}</div>
                <div><strong>Completed Time:</strong> {selectedCall.completedAt}</div>
                <div><strong>Total Attempts:</strong> {selectedCall.attempts}</div>
                <div><strong>Telecaller:</strong> {selectedCall.assignedTo}</div>
              </div>
              <div className="cc-modal-notes">
                <strong>Remarks / Notes:</strong>
                <p>{selectedCall.remarks || selectedCall.note || 'No remarks provided.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedCalls;
