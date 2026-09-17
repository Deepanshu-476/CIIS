import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPhoneCall,
  FiPhoneIncoming,
  FiUserCheck,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiChevronRight,
  FiClock,
  FiEye,
  FiX,
  FiPercent
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './TodaysCalls.css';

export default function TodaysCalls() {
  const [options, setOptions] = useState({ telecallers: [], sources: [], leadTypes: [] });
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    connectedToday: 0,
    interestedToday: 0,
    followupsToday: 0
  });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    assignedTo: '',
    source: '',
    leadType: '',
    callType: '',
    timeFrom: '',
    timeTo: ''
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [selectedCall, setSelectedCall] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  // Fetch today's calls from API
  const fetchTodaysCalls = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: entriesPerPage,
      assignedTo: appliedFilters.assignedTo || undefined,
      source: appliedFilters.source || undefined,
      leadType: appliedFilters.leadType || undefined,
      callType: appliedFilters.callType || undefined,
      timeFrom: appliedFilters.timeFrom || undefined,
      timeTo: appliedFilters.timeTo || undefined
    };

    api.get('/crm/admin/calls/today', { params, cache: false })
      .then(res => {
        setCalls(res.data?.calls || []);
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load today\'s calls:', err);
        setCalls([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, entriesPerPage, appliedFilters]);

  useEffect(() => {
    fetchTodaysCalls();
  }, [fetchTodaysCalls]);

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
      source: '',
      leadType: '',
      callType: '',
      timeFrom: '',
      timeTo: ''
    };
    setFilters(initial);
    setAppliedFilters(initial);
    setCurrentPage(1);
  };

  return (
    <div className="tc-root">
      {/* Page Header */}
      <header className="tc-page-header">
        <h1>Today's Calls</h1>
        <nav aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight size={12} />
          <span>Today's Calls</span>
        </nav>
      </header>

      {/* Top 4 Stat Cards Row */}
      <div className="tc-stats-row">
        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Total Calls Today</span>
            <strong className="tc-stat-value">{loading ? '...' : stats.totalToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-purple">
            <FiPhoneCall size={20} />
          </div>
        </div>

        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Connected Calls</span>
            <strong className="tc-stat-value">{loading ? '...' : stats.connectedToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-green">
            <FiPhoneIncoming size={20} />
          </div>
        </div>

        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Interested Leads</span>
            <strong className="tc-stat-value">{loading ? '...' : stats.interestedToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-blue">
            <FiUserCheck size={20} />
          </div>
        </div>

        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Follow Ups Today</span>
            <strong className="tc-stat-value">{loading ? '...' : stats.followupsToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-orange">
            <FiCalendar size={20} />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <section className="tc-filter-panel">
        <div className="tc-filter-grid">
          <div className="tc-field">
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

          <div className="tc-field">
            <label>Source</label>
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

          <div className="tc-field">
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

          <div className="tc-field">
            <label>Call Type</label>
            <select
              value={filters.callType}
              onChange={e => handleFilterChange('callType', e.target.value)}
            >
              <option value="">All Calls</option>
              <option value="Outbound">Outbound</option>
              <option value="Inbound">Inbound</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>

          <div className="tc-field">
            <label>Time From</label>
            <div className="tc-input-with-icon">
              <input
                type="time"
                value={filters.timeFrom}
                onChange={e => handleFilterChange('timeFrom', e.target.value)}
              />
              <FiClock className="tc-field-icon" />
            </div>
          </div>

          <div className="tc-field">
            <label>Time To</label>
            <div className="tc-input-with-icon">
              <input
                type="time"
                value={filters.timeTo}
                onChange={e => handleFilterChange('timeTo', e.target.value)}
              />
              <FiClock className="tc-field-icon" />
            </div>
          </div>
        </div>

        <div className="tc-filter-actions">
          <button type="button" className="tc-btn-apply" onClick={handleApply}>
            <FiFilter size={14} /> Apply
          </button>
          <button type="button" className="tc-btn-reset" onClick={handleReset} title="Reset filters">
            <FiRefreshCw size={14} />
          </button>
        </div>
      </section>

      {/* Main Card: Today's Call Log */}
      <section className="tc-log-card">
        <header className="tc-log-header">
          <h2>Today's Call Log</h2>
        </header>

        <div className="tc-toolbar">
          <div className="tc-entries-selector">
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
        </div>

        <div className="tc-table-wrapper">
          {loading ? (
            <div className="tc-empty-state">
              <p>Loading today's calls...</p>
            </div>
          ) : calls.length > 0 ? (
            <table className="tc-table">
              <thead>
                <tr>
                  <th>SL NO.</th>
                  <th>LEAD</th>
                  <th>TIME</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>LEAD TYPE</th>
                  <th>CALL TYPE</th>
                  <th>OUTCOME</th>
                  <th>NOTES</th>
                  <th>ASSIGNED TO</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, idx) => (
                  <tr key={call.callId || idx}>
                    <td>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                    <td><strong>{call.lead}</strong></td>
                    <td>{call.time}</td>
                    <td>{call.phone}</td>
                    <td><span className="tc-badge tc-badge-source">{call.source}</span></td>
                    <td><span className="tc-badge tc-badge-type">{call.leadType}</span></td>
                    <td><span className="tc-badge tc-badge-call">{call.callType}</span></td>
                    <td><span className="tc-badge tc-badge-outcome">{call.outcome}</span></td>
                    <td className="tc-notes">{call.notes}</td>
                    <td>{call.assignedTo}</td>
                    <td>
                      <button
                        type="button"
                        className="tc-action-btn"
                        onClick={() => setSelectedCall(call)}
                        title="View Call Details"
                      >
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="tc-empty-state">
              <div className="tc-empty-icon">
                <FiPercent size={24} />
              </div>
              <h3>No Calls Made Today</h3>
              <p>Your completed calls for today will appear here.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="tc-table-footer">
          <div className="tc-entries-info">
            Showing {total ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, total)} of {total} entries
          </div>

          <div className="tc-pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="tc-page-btn"
            >
              &laquo;
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="tc-page-btn"
            >
              &lsaquo;
            </button>

            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
              .filter(pageNum => totalPages <= 7 || Math.abs(pageNum - currentPage) <= 2 || pageNum === 1 || pageNum === totalPages)
              .map((pageNum, idx, arr) => (
                <React.Fragment key={pageNum}>
                  {idx > 0 && pageNum - arr[idx - 1] > 1 && <span className="tc-page-ellipsis">...</span>}
                  <button
                    onClick={() => setCurrentPage(pageNum)}
                    className={`tc-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="tc-page-btn"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="tc-page-btn"
            >
              &raquo;
            </button>
          </div>
        </div>
      </section>

      {/* Modal for Call Details */}
      {selectedCall && (
        <div className="tc-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="tc-modal-content" onClick={e => e.stopPropagation()}>
            <div className="tc-modal-header">
              <h3>Call Details</h3>
              <button type="button" className="tc-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="tc-modal-body">
              <div className="tc-modal-grid">
                <div><strong>Lead Name:</strong> {selectedCall.lead}</div>
                <div><strong>Phone Number:</strong> {selectedCall.phone}</div>
                <div><strong>Call Time:</strong> {selectedCall.time}</div>
                <div><strong>Call Type:</strong> {selectedCall.callType}</div>
                <div><strong>Lead Source:</strong> {selectedCall.source}</div>
                <div><strong>Lead Type:</strong> {selectedCall.leadType}</div>
                <div><strong>Outcome:</strong> {selectedCall.outcome}</div>
                <div><strong>Assigned To:</strong> {selectedCall.assignedTo}</div>
              </div>
              <div className="tc-modal-notes">
                <strong>Notes:</strong>
                <p>{selectedCall.notes || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}