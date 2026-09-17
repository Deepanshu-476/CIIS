import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiUser,
  FiSearch,
  FiCalendar,
  FiCornerUpRight,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import './TransferredCalls.css';

const initialTransferredCalls = [
  {
    id: 1,
    leadId: '#LD-005',
    name: 'Rohan Sharma',
    phone: '9123456780',
    transferredFrom: 'Telecaller 1',
    transferredTo: 'Telecaller 2',
    reason: 'Language preference (Hindi required)',
    dateTime: '24 Aug 2026 02:15 PM',
    status: 'Transferred',
    transferredBy: 'Manager - R. Smith',
    notes: 'Lead requested communication in Hindi for course details.'
  },
  {
    id: 2,
    leadId: '#LD-014',
    name: 'Kavita Menon',
    phone: '9811223344',
    transferredFrom: 'Telecaller 2',
    transferredTo: 'Senior Counselor',
    reason: 'Requested senior course counselor consultation',
    dateTime: '25 Aug 2026 10:30 AM',
    status: 'Accepted',
    transferredBy: 'Telecaller 2',
    notes: 'Lead has complex scholarship and installment questions.'
  }
];

const TransferredCalls = () => {
  const [calls] = useState(initialTransferredCalls);
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

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      if (appliedFilters.from && call.transferredFrom !== appliedFilters.from) return false;
      if (appliedFilters.to && call.transferredTo !== appliedFilters.to) return false;
      if (appliedFilters.dateFrom && !call.dateTime.includes(appliedFilters.dateFrom)) return false;
      if (appliedFilters.dateTo && !call.dateTime.includes(appliedFilters.dateTo)) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match =
          call.leadId.toLowerCase().includes(query) ||
          call.name.toLowerCase().includes(query) ||
          call.phone.includes(query) ||
          call.transferredFrom.toLowerCase().includes(query) ||
          call.transferredTo.toLowerCase().includes(query) ||
          call.reason.toLowerCase().includes(query) ||
          call.transferredBy.toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [calls, appliedFilters, searchTerm]);

  const totalEntries = filteredCalls.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedCalls = filteredCalls.slice(startIndex, startIndex + entriesPerPage);

  const totalTransferred = calls.length;
  const acceptedCount = calls.filter(c => c.status === 'Accepted').length;
  const pendingCount = calls.filter(c => c.status === 'Transferred' || c.status === 'Pending').length;

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
            <span className="trf-stat-value">{totalTransferred}</span>
            <span className="trf-stat-badge purple">Transfers</span>
          </div>
          <div className="trf-stat-icon purple">
            <FiCornerUpRight size={20} />
          </div>
        </div>

        <div className="trf-stat-card">
          <div className="trf-stat-left">
            <span className="trf-stat-label">Accepted</span>
            <span className="trf-stat-value">{acceptedCount}</span>
            <span className="trf-stat-badge emerald">Handled</span>
          </div>
          <div className="trf-stat-icon emerald">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="trf-stat-card">
          <div className="trf-stat-left">
            <span className="trf-stat-label">Pending Acceptance</span>
            <span className="trf-stat-value">{pendingCount}</span>
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
              <option value="Telecaller 1">Telecaller 1</option>
              <option value="Telecaller 2">Telecaller 2</option>
            </select>
          </div>

          <div className="trf-field">
            <label>Transferred To</label>
            <select
              value={filters.to}
              onChange={e => handleFilterChange('to', e.target.value)}
            >
              <option value="">All Users</option>
              <option value="Telecaller 1">Telecaller 1</option>
              <option value="Telecaller 2">Telecaller 2</option>
              <option value="Senior Counselor">Senior Counselor</option>
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
          <h2>Transfer History</h2>
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
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="trf-table-wrapper">
          {paginatedCalls.length > 0 ? (
            <table className="trf-table">
              <thead>
                <tr>
                  <th>LEAD</th>
                  <th>PHONE</th>
                  <th>TRANSFERRED FROM</th>
                  <th>TRANSFERRED TO</th>
                  <th>REASON</th>
                  <th>DATE/TIME</th>
                  <th>STATUS</th>
                  <th>TRANSFERRED BY</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCalls.map(call => (
                  <tr key={call.id}>
                    <td className="trf-lead-col">
                      <span className="trf-lead-id">{call.leadId}</span>
                      <strong className="trf-lead-name">{call.name}</strong>
                    </td>
                    <td className="trf-phone">{call.phone}</td>
                    <td>
                      <span className="trf-telecaller from">
                        <FiUser size={13} /> {call.transferredFrom}
                      </span>
                    </td>
                    <td>
                      <span className="trf-telecaller to">
                        <FiUser size={13} /> {call.transferredTo}
                      </span>
                    </td>
                    <td className="trf-reason">{call.reason}</td>
                    <td className="trf-datetime">
                      <FiCalendar size={11} style={{ marginRight: 4 }} />
                      {call.dateTime}
                    </td>
                    <td>
                      <span className={`trf-badge status-${call.status.toLowerCase()}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="trf-by">{call.transferredBy}</td>
                    <td>
                      <button
                        type="button"
                        className="trf-action-btn"
                        onClick={() => setSelectedCall(call)}
                        title="View Transfer Details"
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="trf-no-data">No transferred call records found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="trf-pagination-footer">
          <div className="trf-info">
            Showing {totalEntries ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>
          <div className="trf-pagination">
            <button
              className="trf-page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button
              className="trf-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`trf-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="trf-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
            <button
              className="trf-page-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedCall && (
        <div className="trf-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="trf-modal-content" onClick={e => e.stopPropagation()}>
            <div className="trf-modal-header">
              <h3>Call Transfer Details</h3>
              <button type="button" className="trf-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="trf-modal-body">
              <div className="trf-modal-grid">
                <div>
                  <strong>Lead ID:</strong>
                  <span>{selectedCall.leadId}</span>
                </div>
                <div>
                  <strong>Lead Name:</strong>
                  <span>{selectedCall.name}</span>
                </div>
                <div>
                  <strong>Phone:</strong>
                  <span>{selectedCall.phone}</span>
                </div>
                <div>
                  <strong>Status:</strong>
                  <span>{selectedCall.status}</span>
                </div>
                <div>
                  <strong>Transferred From:</strong>
                  <span>{selectedCall.transferredFrom}</span>
                </div>
                <div>
                  <strong>Transferred To:</strong>
                  <span>{selectedCall.transferredTo}</span>
                </div>
                <div>
                  <strong>Date & Time:</strong>
                  <span>{selectedCall.dateTime}</span>
                </div>
                <div>
                  <strong>Transferred By:</strong>
                  <span>{selectedCall.transferredBy}</span>
                </div>
              </div>
              <div className="trf-modal-remarks">
                <strong>Transfer Reason:</strong>
                <p>{selectedCall.reason}</p>
              </div>
              {selectedCall.notes && (
                <div className="trf-modal-remarks" style={{ marginTop: 8 }}>
                  <strong>Notes:</strong>
                  <p>{selectedCall.notes}</p>
                </div>
              )}
              <div className="trf-modal-actions">
                <button
                  type="button"
                  className="trf-modal-btn trf-modal-btn-secondary"
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

export default TransferredCalls;
