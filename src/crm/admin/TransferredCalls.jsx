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
  FiCornerUpRight,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './TransferredCalls.css';

const TransferredCalls = () => {
  const [options, setOptions] = useState({ telecallers: [] });
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalTransferred: 0,
    acceptedCount: 0,
    pendingCount: 0
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    dateFrom: '',
    dateTo: ''
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
          telecallers: res.data?.telecallers || []
        });
      })
      .catch(err => console.error('Failed to load filter options:', err));
    return () => { active = false; };
  }, []);

  // Fetch transferred calls from API
  const fetchTransferredCalls = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: entriesPerPage,
      search: searchTerm.trim() || undefined,
      from: appliedFilters.from || undefined,
      to: appliedFilters.to || undefined,
      dateFrom: appliedFilters.dateFrom || undefined,
      dateTo: appliedFilters.dateTo || undefined
    };

    api.get('/crm/admin/calls/transferred', { params, cache: false })
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
        console.error('Failed to load transferred calls:', err);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, entriesPerPage, appliedFilters, searchTerm]);

  useEffect(() => {
    fetchTransferredCalls();
  }, [fetchTransferredCalls]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initial = {
      from: '',
      to: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(initial);
    setAppliedFilters(initial);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleAcceptTransfer = async (transferId) => {
    try {
      await api.put(`/crm/admin/calls/transferred/${transferId}/accept`);
      fetchTransferredCalls();
      if (selectedCall && selectedCall.transferId === transferId) {
        setSelectedCall(prev => ({ ...prev, status: 'Accepted' }));
      }
    } catch (err) {
      console.error('Failed to accept transfer:', err);
      alert(err.response?.data?.message || 'Failed to accept transfer');
    }
  };

  return (
    <div className="trf-root">
      {/* Header */}
      <header className="trf-page-header">
        <div>
          <span className="trf-sub-title">CRM / Call Management</span>
          <h1 className="trf-page-title">Transferred Calls</h1>
        </div>
        <nav aria-label="Breadcrumb" className="trf-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight size={12} />
          <span className="active">Transferred Calls</span>
        </nav>
      </header>

      {/* Stats Row */}
      <section className="trf-stats-grid">
        <div className="trf-stat-card">
          <div className="trf-stat-left">
            <span className="trf-stat-label">Total Transferred</span>
            <span className="trf-stat-value">{loading ? '...' : stats.totalTransferred}</span>
            <span className="trf-stat-badge purple">Transfers</span>
          </div>
          <div className="trf-stat-icon purple">
            <FiCornerUpRight size={20} />
          </div>
        </div>

        <div className="trf-stat-card">
          <div className="trf-stat-left">
            <span className="trf-stat-label">Accepted</span>
            <span className="trf-stat-value">{loading ? '...' : stats.acceptedCount}</span>
            <span className="trf-stat-badge emerald">Handled</span>
          </div>
          <div className="trf-stat-icon emerald">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="trf-stat-card">
          <div className="trf-stat-left">
            <span className="trf-stat-label">Pending Acceptance</span>
            <span className="trf-stat-value">{loading ? '...' : stats.pendingCount}</span>
            <span className="trf-stat-badge amber">In Transit</span>
          </div>
          <div className="trf-stat-icon amber">
            <FiClock size={20} />
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      <section className="trf-filter-panel">
        <div className="trf-filter-grid">
          <div className="trf-field">
            <label>Transferred From</label>
            <select
              value={filters.from}
              onChange={e => handleFilterChange('from', e.target.value)}
            >
              <option value="">All Users</option>
              {options.telecallers.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="trf-field">
            <label>Transferred To</label>
            <select
              value={filters.to}
              onChange={e => handleFilterChange('to', e.target.value)}
            >
              <option value="">All Users</option>
              {options.telecallers.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="trf-field">
            <label>Date From</label>
            <div className="trf-date-input-wrap">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => handleFilterChange('dateFrom', e.target.value)}
              />
              <FiCalendar className="trf-date-icon" />
            </div>
          </div>

          <div className="trf-field">
            <label>Date To</label>
            <div className="trf-date-input-wrap">
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => handleFilterChange('dateTo', e.target.value)}
              />
              <FiCalendar className="trf-date-icon" />
            </div>
          </div>

          <div className="trf-filter-actions">
            <button type="button" className="trf-btn-apply" onClick={handleApply}>
              <FiFilter size={14} /> Apply
            </button>
            <button type="button" className="trf-btn-reset" onClick={handleReset} title="Reset filters">
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="trf-log-card">
        <header className="trf-log-header">
          <h2>Transferred Call Log</h2>
        </header>

        <div className="trf-toolbar">
          <div className="trf-entries-selector">
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

          <div className="trf-search-box">
            <span>Search:</span>
            <div className="trf-search-input-wrap">
              <FiSearch size={14} className="trf-search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search transferred calls..."
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="trf-table-wrapper">
          {loading ? (
            <div className="trf-empty-state">
              <p>Loading transferred calls...</p>
            </div>
          ) : items.length > 0 ? (
            <table className="trf-table">
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>LEAD ID</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>TRANSFERRED FROM</th>
                  <th>TRANSFERRED TO</th>
                  <th>REASON</th>
                  <th>DATE/TIME</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {items.map((call, idx) => (
                  <tr key={call.transferId || idx}>
                    <td>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                    <td className="trf-lead-id">{call.leadId}</td>
                    <td className="trf-name font-medium">{call.name}</td>
                    <td className="trf-phone">{call.phone}</td>
                    <td><span className="trf-badge user from">{call.transferredFrom}</span></td>
                    <td><span className="trf-badge user to">{call.transferredTo}</span></td>
                    <td className="trf-reason">{call.reason}</td>
                    <td className="trf-datetime">{call.dateTime}</td>
                    <td>
                      <span className={`trf-badge status ${String(call.status).toLowerCase()}`}>
                        {call.status}
                      </span>
                    </td>
                    <td>
                      <div className="trf-actions-cell">
                        <button
                          type="button"
                          className="trf-action-btn"
                          onClick={() => setSelectedCall(call)}
                          title="View Details"
                        >
                          <FiEye size={14} />
                        </button>
                        {call.status !== 'Accepted' && (
                          <button
                            type="button"
                            className="trf-accept-btn"
                            onClick={() => handleAcceptTransfer(call.transferId)}
                            title="Accept Lead"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="trf-empty-state">
              <div className="trf-empty-icon">
                <FiCornerUpRight size={24} />
              </div>
              <h3>No Transferred Calls Found</h3>
              <p>Transferred and handed-off calls will appear here.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="trf-table-footer">
          <div className="trf-entries-info">
            Showing {total ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, total)} of {total} entries
          </div>

          <div className="trf-pagination">
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

      {/* Modal for Details */}
      {selectedCall && (
        <div className="trf-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="trf-modal-content" onClick={e => e.stopPropagation()}>
            <div className="trf-modal-header">
              <h3>Transfer Details</h3>
              <button type="button" className="trf-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="trf-modal-body">
              <div className="trf-modal-grid">
                <div><strong>Lead ID:</strong> {selectedCall.leadId}</div>
                <div><strong>Lead Name:</strong> {selectedCall.name}</div>
                <div><strong>Phone Number:</strong> {selectedCall.phone}</div>
                <div><strong>Transferred From:</strong> {selectedCall.transferredFrom}</div>
                <div><strong>Transferred To:</strong> {selectedCall.transferredTo}</div>
                <div><strong>Transferred By:</strong> {selectedCall.transferredBy}</div>
                <div><strong>Date & Time:</strong> {selectedCall.dateTime}</div>
                <div><strong>Status:</strong> {selectedCall.status}</div>
              </div>
              <div className="trf-modal-reason">
                <strong>Reason for Transfer:</strong>
                <p>{selectedCall.reason || 'General reassignment'}</p>
              </div>
              {selectedCall.notes && (
                <div className="trf-modal-notes">
                  <strong>Notes:</strong>
                  <p>{selectedCall.notes}</p>
                </div>
              )}
              {selectedCall.status !== 'Accepted' && (
                <div className="trf-modal-actions">
                  <button
                    type="button"
                    className="trf-btn-modal-accept"
                    onClick={() => handleAcceptTransfer(selectedCall.transferId)}
                  >
                    Accept Lead Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferredCalls;
