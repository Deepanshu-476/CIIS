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
  FiAward,
  FiPhoneIncoming,
  FiPhoneOutgoing,
  FiCalendar
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './ConvertedCalls.css';

const ConvertedCalls = () => {
  const [options, setOptions] = useState({ telecallers: [], sources: [], leadTypes: [] });
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalConverted: 0,
    inboundCount: 0,
    convertedToday: 0,
    outboundCount: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    assignedTo: '',
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
          leadTypes: res.data?.leadTypes || []
        });
      })
      .catch(err => console.error('Failed to load filter options:', err));
    return () => { active = false; };
  }, []);

  // Fetch converted calls from API
  const fetchConvertedCalls = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: entriesPerPage,
      search: searchTerm.trim() || undefined,
      assignedTo: appliedFilters.assignedTo || undefined,
      callType: appliedFilters.callType || undefined,
      source: appliedFilters.source || undefined,
      leadType: appliedFilters.leadType || undefined,
      completedDate: appliedFilters.completedDate || undefined
    };

    api.get('/crm/admin/calls/converted', { params, cache: false })
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
        console.error('Failed to load converted calls:', err);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, entriesPerPage, appliedFilters, searchTerm]);

  useEffect(() => {
    fetchConvertedCalls();
  }, [fetchConvertedCalls]);

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
    <div className="cnv-root">
      {/* Header */}
      <header className="cnv-page-header">
        <div>
          <span className="cnv-sub-title">CRM / Call Management</span>
          <h1 className="cnv-page-title">Converted Calls</h1>
        </div>
        <nav aria-label="Breadcrumb" className="cnv-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight size={12} />
          <span className="active">Converted Calls</span>
        </nav>
      </header>

      {/* Stats Row */}
      <section className="cnv-stats-grid">
        <div className="cnv-stat-card">
          <div className="cnv-stat-left">
            <span className="cnv-stat-label">Total Converted</span>
            <span className="cnv-stat-value">{loading ? '...' : stats.totalConverted}</span>
            <span className="cnv-stat-badge emerald">Conversions</span>
          </div>
          <div className="cnv-stat-icon emerald">
            <FiAward size={20} />
          </div>
        </div>

        <div className="cnv-stat-card">
          <div className="cnv-stat-left">
            <span className="cnv-stat-label">Inbound</span>
            <span className="cnv-stat-value">{loading ? '...' : stats.inboundCount}</span>
            <span className="cnv-stat-badge blue">Inbound Calls</span>
          </div>
          <div className="cnv-stat-icon blue">
            <FiPhoneIncoming size={20} />
          </div>
        </div>

        <div className="cnv-stat-card">
          <div className="cnv-stat-left">
            <span className="cnv-stat-label">Converted Today</span>
            <span className="cnv-stat-value">{loading ? '...' : stats.convertedToday}</span>
            <span className="cnv-stat-badge amber">Today</span>
          </div>
          <div className="cnv-stat-icon amber">
            <FiCalendar size={20} />
          </div>
        </div>

        <div className="cnv-stat-card">
          <div className="cnv-stat-left">
            <span className="cnv-stat-label">Outbound</span>
            <span className="cnv-stat-value">{loading ? '...' : stats.outboundCount}</span>
            <span className="cnv-stat-badge purple">Outbound Calls</span>
          </div>
          <div className="cnv-stat-icon purple">
            <FiPhoneOutgoing size={20} />
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      <section className="cnv-filter-panel">
        <div className="cnv-filter-grid">
          <div className="cnv-field">
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

          <div className="cnv-field">
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

          <div className="cnv-field">
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

          <div className="cnv-field">
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

          <div className="cnv-field">
            <label>Completed Date</label>
            <div className="cnv-date-input-wrap">
              <input
                type="date"
                value={filters.completedDate}
                onChange={e => handleFilterChange('completedDate', e.target.value)}
              />
              <FiCalendar className="cnv-date-icon" />
            </div>
          </div>

          <div className="cnv-filter-actions">
            <button type="button" className="cnv-btn-apply" onClick={handleApply}>
              <FiFilter size={14} /> Apply
            </button>
            <button type="button" className="cnv-btn-reset" onClick={handleReset} title="Reset filters">
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="cnv-log-card">
        <header className="cnv-log-header">
          <h2>Converted Call Log</h2>
        </header>

        <div className="cnv-toolbar">
          <div className="cnv-entries-selector">
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

          <div className="cnv-search-box">
            <span>Search:</span>
            <div className="cnv-search-input-wrap">
              <FiSearch size={14} className="cnv-search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search converted leads..."
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="cnv-table-wrapper">
          {loading ? (
            <div className="cnv-empty-state">
              <p>Loading converted calls...</p>
            </div>
          ) : items.length > 0 ? (
            <table className="cnv-table">
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>LEAD</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>LEAD TYPE</th>
                  <th>LEAD STATUS</th>
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
                    <td className="cnv-lead-id">{call.leadId}</td>
                    <td className="cnv-lead-name">
                      <strong>{call.name}</strong>
                      {call.note && <small>{call.note}</small>}
                    </td>
                    <td className="cnv-phone">{call.phone}</td>
                    <td><span className="cnv-badge source">{call.source}</span></td>
                    <td><span className="cnv-badge type">{call.leadType}</span></td>
                    <td><span className="cnv-badge status-converted">{call.leadStatus}</span></td>
                    <td><span className="cnv-badge outcome-converted">{call.outcome}</span></td>
                    <td><span className={`cnv-badge calltype ${String(call.callType).toLowerCase()}`}>{call.callType}</span></td>
                    <td className="cnv-completed-time">{call.completedAt}</td>
                    <td className="cnv-attempts">{call.attempts}</td>
                    <td>
                      <span className="cnv-telecaller">
                        <FiUser size={13} /> {call.assignedTo}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="cnv-action-btn"
                        onClick={() => setSelectedCall(call)}
                        title="View Conversion Details"
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="cnv-empty-state">
              <div className="cnv-empty-icon">
                <FiAward size={24} />
              </div>
              <h3>No Converted Calls Found</h3>
              <p>Converted leads and enrollment calls will appear here.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="cnv-table-footer">
          <div className="cnv-entries-info">
            Showing {total ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, total)} of {total} entries
          </div>

          <div className="cnv-pagination">
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
        <div className="cnv-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="cnv-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cnv-modal-header">
              <h3>Conversion Details</h3>
              <button type="button" className="cnv-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="cnv-modal-body">
              <div className="cnv-modal-grid">
                <div><strong>Lead ID:</strong> {selectedCall.leadId}</div>
                <div><strong>Name:</strong> {selectedCall.name}</div>
                <div><strong>Phone Number:</strong> {selectedCall.phone}</div>
                <div><strong>Lead Source:</strong> {selectedCall.source}</div>
                <div><strong>Lead Type:</strong> {selectedCall.leadType}</div>
                <div><strong>Enrolled Course:</strong> {selectedCall.enrolledCourse}</div>
                <div><strong>Conversion Value:</strong> <span className="text-emerald-600 font-semibold">{selectedCall.conversionValue}</span></div>
                <div><strong>Payment Status:</strong> {selectedCall.paymentStatus}</div>
                <div><strong>Call Type:</strong> {selectedCall.callType}</div>
                <div><strong>Converted At:</strong> {selectedCall.completedAt}</div>
                <div><strong>Total Attempts:</strong> {selectedCall.attempts}</div>
                <div><strong>Closed By:</strong> {selectedCall.assignedTo}</div>
              </div>
              <div className="cnv-modal-notes">
                <strong>Remarks / Notes:</strong>
                <p>{selectedCall.remarks || 'No additional remarks.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvertedCalls;
