import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiSearch,
  FiCalendar,
  FiPhoneCall,
  FiClock,
  FiUser
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './CallHistory.css';

const CallHistory = () => {
  const [options, setOptions] = useState({ sources: [], leadTypes: [], outcomes: [] });
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    outboundCalls: 0,
    inboundCalls: 0,
    avgDuration: '00m 00s'
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    searchLead: '',
    outcome: '',
    callType: '',
    source: '',
    leadType: '',
    from: '',
    to: ''
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
          sources: res.data?.sources || [],
          leadTypes: res.data?.leadTypes || [],
          outcomes: res.data?.outcomes || []
        });
      })
      .catch(err => console.error('Failed to load filter options:', err));
    return () => { active = false; };
  }, []);

  // Fetch call history from API
  const fetchCallHistory = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: entriesPerPage,
      search: searchTerm.trim() || undefined,
      searchLead: appliedFilters.searchLead.trim() || undefined,
      outcome: appliedFilters.outcome || undefined,
      callType: appliedFilters.callType || undefined,
      source: appliedFilters.source || undefined,
      leadType: appliedFilters.leadType || undefined,
      from: appliedFilters.from || undefined,
      to: appliedFilters.to || undefined
    };

    api.get('/crm/admin/calls/history', { params, cache: false })
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
        console.error('Failed to load call history:', err);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, entriesPerPage, appliedFilters, searchTerm]);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initial = {
      searchLead: '',
      outcome: '',
      callType: '',
      source: '',
      leadType: '',
      from: '',
      to: ''
    };
    setFilters(initial);
    setAppliedFilters(initial);
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="his-root">
      {/* Header */}
      <header className="his-page-header">
        <div>
          <span className="his-sub-title">CRM / Call Management</span>
          <h1 className="his-page-title">Call History</h1>
        </div>
        <nav aria-label="Breadcrumb" className="his-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight size={12} />
          <span className="active">Call History</span>
        </nav>
      </header>

      {/* Stats Row */}
      <section className="his-stats-grid">
        <div className="his-stat-card">
          <div className="his-stat-left">
            <span className="his-stat-label">Total Calls</span>
            <span className="his-stat-value">{loading ? '...' : stats.totalCalls}</span>
            <span className="his-stat-badge purple">All-Time</span>
          </div>
          <div className="his-stat-icon purple">
            <FiPhoneCall size={20} />
          </div>
        </div>

        <div className="his-stat-card">
          <div className="his-stat-left">
            <span className="his-stat-label">Outbound Calls</span>
            <span className="his-stat-value">{loading ? '...' : stats.outboundCalls}</span>
            <span className="his-stat-badge blue">Outbound</span>
          </div>
          <div className="his-stat-icon blue">
            <FiPhoneCall size={20} />
          </div>
        </div>

        <div className="his-stat-card">
          <div className="his-stat-left">
            <span className="his-stat-label">Inbound Calls</span>
            <span className="his-stat-value">{loading ? '...' : stats.inboundCalls}</span>
            <span className="his-stat-badge emerald">Inbound</span>
          </div>
          <div className="his-stat-icon emerald">
            <FiPhoneCall size={20} />
          </div>
        </div>

        <div className="his-stat-card">
          <div className="his-stat-left">
            <span className="his-stat-label">Avg Duration</span>
            <span className="his-stat-value">{loading ? '...' : stats.avgDuration}</span>
            <span className="his-stat-badge amber">Minutes</span>
          </div>
          <div className="his-stat-icon amber">
            <FiClock size={20} />
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      <section className="his-filter-panel">
        <div className="his-filter-grid">
          <div className="his-field">
            <label>Search Lead</label>
            <input
              type="text"
              placeholder="Search by ID, Name or Phone"
              value={filters.searchLead}
              onChange={e => handleFilterChange('searchLead', e.target.value)}
            />
          </div>

          <div className="his-field">
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

          <div className="his-field">
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

          <div className="his-field">
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

          <div className="his-field">
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

          <div className="his-field">
            <label>Date From</label>
            <div className="his-date-input-wrap">
              <input
                type="date"
                value={filters.from}
                onChange={e => handleFilterChange('from', e.target.value)}
              />
              <FiCalendar className="his-date-icon" />
            </div>
          </div>

          <div className="his-field">
            <label>Date To</label>
            <div className="his-date-input-wrap">
              <input
                type="date"
                value={filters.to}
                onChange={e => handleFilterChange('to', e.target.value)}
              />
              <FiCalendar className="his-date-icon" />
            </div>
          </div>

          <div className="his-filter-actions">
            <button type="button" className="his-btn-apply" onClick={handleApply}>
              <FiFilter size={14} /> Apply
            </button>
            <button type="button" className="his-btn-reset" onClick={handleReset} title="Reset filters">
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="his-log-card">
        <header className="his-log-header">
          <h2>Call History Log</h2>
        </header>

        <div className="his-toolbar">
          <div className="his-entries-selector">
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

          <div className="his-search-box">
            <span>Search:</span>
            <div className="his-search-input-wrap">
              <FiSearch size={14} className="his-search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search history..."
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="his-table-wrapper">
          {loading ? (
            <div className="his-no-data">
              <p>Loading call history...</p>
            </div>
          ) : items.length > 0 ? (
            <table className="his-table">
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>LEAD ID</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>LEAD TYPE</th>
                  <th>OUTCOME</th>
                  <th>CALL TYPE</th>
                  <th>REMARKS</th>
                  <th>DURATION</th>
                  <th>CALL TIME</th>
                  <th>ASSIGNED TO</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {items.map((call, idx) => (
                  <tr key={call.leadMongoId || idx}>
                    <td>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                    <td className="his-lead-id">{call.leadId}</td>
                    <td className="his-lead-name">
                      <strong>{call.name}</strong>
                    </td>
                    <td className="his-phone">{call.phone}</td>
                    <td><span className="his-badge his-badge-source">{call.source}</span></td>
                    <td><span className="his-badge his-badge-type">{call.leadType}</span></td>
                    <td><span className={`his-badge his-badge-outcome ${String(call.outcome).toLowerCase().replace(/\s+/g, '-')}`}>{call.outcome}</span></td>
                    <td><span className={`his-badge his-badge-calltype ${String(call.callType).toLowerCase()}`}>{call.callType}</span></td>
                    <td className="his-remarks" title={call.remarks}>{call.remarks}</td>
                    <td className="his-duration">{call.duration}</td>
                    <td className="his-calltime">{call.callTime}</td>
                    <td>
                      <span className="his-telecaller">
                        <FiUser size={13} /> {call.assignedTo}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="his-action-btn"
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
            <div className="his-no-data">
              <h3>No Call History Found</h3>
              <p>Completed and logged call records will appear here.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="his-pagination-footer">
          <div className="his-info">
            Showing {total ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, total)} of {total} entries
          </div>

          <div className="his-pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="his-page-btn"
            >
              &laquo;
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="his-page-btn"
            >
              &lsaquo;
            </button>

            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
              .filter(pageNum => totalPages <= 7 || Math.abs(pageNum - currentPage) <= 2 || pageNum === 1 || pageNum === totalPages)
              .map((pageNum, idx, arr) => (
                <React.Fragment key={pageNum}>
                  {idx > 0 && pageNum - arr[idx - 1] > 1 && <span className="his-page-ellipsis">...</span>}
                  <button
                    onClick={() => setCurrentPage(pageNum)}
                    className={`his-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="his-page-btn"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="his-page-btn"
            >
              &raquo;
            </button>
          </div>
        </div>
      </section>

      {/* Modal for Call Details */}
      {selectedCall && (
        <div className="his-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="his-modal-content" onClick={e => e.stopPropagation()}>
            <div className="his-modal-header">
              <h3>Call History Details</h3>
              <button type="button" className="his-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="his-modal-body">
              <div className="his-modal-grid">
                <div><strong>Lead ID:</strong> <span>{selectedCall.leadId}</span></div>
                <div><strong>Lead Name:</strong> <span>{selectedCall.name}</span></div>
                <div><strong>Phone Number:</strong> <span>{selectedCall.phone}</span></div>
                <div><strong>Lead Source:</strong> <span>{selectedCall.source}</span></div>
                <div><strong>Lead Type:</strong> <span>{selectedCall.leadType}</span></div>
                <div><strong>Call Outcome:</strong> <span>{selectedCall.outcome}</span></div>
                <div><strong>Call Type:</strong> <span>{selectedCall.callType}</span></div>
                <div><strong>Call Duration:</strong> <span>{selectedCall.duration}</span></div>
                <div><strong>Call Timestamp:</strong> <span>{selectedCall.callTime}</span></div>
                <div><strong>Telecaller:</strong> <span>{selectedCall.assignedTo}</span></div>
              </div>
              <div className="his-modal-remarks">
                <strong>Remarks / Notes:</strong>
                <p>{selectedCall.remarks || 'No remarks logged for this call.'}</p>
              </div>
              <div className="his-modal-actions">
                <button
                  type="button"
                  className="his-modal-btn his-modal-btn-secondary"
                  onClick={() => setSelectedCall(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
