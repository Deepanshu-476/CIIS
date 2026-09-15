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
  FiPhoneCall,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import './CallHistory.css';

const initialCallHistory = [
  {
    id: 1,
    leadId: '#LD-001',
    name: 'Rohan Gupta',
    phone: '9876543210',
    source: 'Facebook',
    leadType: 'NEET',
    callType: 'Outbound',
    outcome: 'Interested',
    remarks: 'Discussed fee structure & hostel facility',
    callTime: '26 Aug 2026 03:45 PM',
    assignedTo: 'Telecaller 1',
    duration: '04m 12s'
  },
  {
    id: 2,
    leadId: '#LD-002',
    name: 'Anita Roy',
    phone: '9123456780',
    source: 'Website',
    leadType: 'JEE',
    callType: 'Inbound',
    outcome: 'Call Back',
    remarks: 'Asked to call back after 5:00 PM today',
    callTime: '26 Aug 2026 05:10 PM',
    assignedTo: 'Telecaller 2',
    duration: '02m 45s'
  },
  {
    id: 3,
    leadId: '#LD-007',
    name: 'Zara Nair',
    phone: '9876543210',
    source: 'Instagram',
    leadType: 'JEE',
    callType: 'Outbound',
    outcome: 'Converted',
    remarks: 'Enrolled in 1-Year JEE Intensive Program',
    callTime: '23 Aug 2026 11:15 AM',
    assignedTo: 'Telecaller 2',
    duration: '08m 30s'
  },
  {
    id: 4,
    leadId: '#LD-008',
    name: 'Ashok Pillai',
    phone: '8016315999',
    source: 'Facebook',
    leadType: 'NEET',
    callType: 'Outbound',
    outcome: 'Interested',
    remarks: 'Interested in repeater batch online demo',
    callTime: '22 Aug 2026 04:30 PM',
    assignedTo: 'Telecaller 1',
    duration: '05m 50s'
  }
];

const CallHistory = () => {
  const [calls] = useState(initialCallHistory);
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

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      if (appliedFilters.outcome && call.outcome !== appliedFilters.outcome) return false;
      if (appliedFilters.callType && call.callType !== appliedFilters.callType) return false;
      if (appliedFilters.source && call.source !== appliedFilters.source) return false;
      if (appliedFilters.leadType && call.leadType !== appliedFilters.leadType) return false;
      if (appliedFilters.from && !call.callTime.includes(appliedFilters.from)) return false;
      if (appliedFilters.to && !call.callTime.includes(appliedFilters.to)) return false;

      if (appliedFilters.searchLead.trim()) {
        const leadQ = appliedFilters.searchLead.toLowerCase();
        const leadMatch =
          call.leadId.toLowerCase().includes(leadQ) ||
          call.name.toLowerCase().includes(leadQ) ||
          call.phone.includes(leadQ);
        if (!leadMatch) return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match =
          call.leadId.toLowerCase().includes(query) ||
          call.name.toLowerCase().includes(query) ||
          call.phone.includes(query) ||
          call.source.toLowerCase().includes(query) ||
          call.leadType.toLowerCase().includes(query) ||
          call.outcome.toLowerCase().includes(query) ||
          call.assignedTo.toLowerCase().includes(query) ||
          call.remarks.toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [calls, appliedFilters, searchTerm]);

  const totalEntries = filteredCalls.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedCalls = filteredCalls.slice(startIndex, startIndex + entriesPerPage);

  const totalCallsCount = calls.length;
  const outboundCallsCount = calls.filter(c => c.callType === 'Outbound').length;
  const inboundCallsCount = calls.filter(c => c.callType === 'Inbound').length;

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
            <span className="his-stat-label">Total Calls Logged</span>
            <span className="his-stat-value">{totalCallsCount}</span>
            <span className="his-stat-badge purple">Full Audit</span>
          </div>
          <div className="his-stat-icon purple">
            <FiPhoneCall size={20} />
          </div>
        </div>

        <div className="his-stat-card">
          <div className="his-stat-left">
            <span className="his-stat-label">Outbound Calls</span>
            <span className="his-stat-value">{outboundCallsCount}</span>
            <span className="his-stat-badge emerald">Telecaller Initiated</span>
          </div>
          <div className="his-stat-icon emerald">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="his-stat-card">
          <div className="his-stat-label">Inbound Calls</div>
          <div className="his-stat-left">
            <span className="his-stat-value">{inboundCallsCount}</span>
            <span className="his-stat-badge blue">Customer Initiated</span>
          </div>
          <div className="his-stat-icon blue">
            <FiClock size={20} />
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      <section className="his-filter-panel">
        <div className="his-filter-grid">
          <div className="his-field">
            <label>Search Lead</label>
            <div className="his-search-field-wrap">
              <input
                type="text"
                placeholder="ID, Name or Phone"
                value={filters.searchLead}
                onChange={e => handleFilterChange('searchLead', e.target.value)}
              />
            </div>
          </div>

          <div className="his-field">
            <label>Outcome</label>
            <select
              value={filters.outcome}
              onChange={e => handleFilterChange('outcome', e.target.value)}
            >
              <option value="">All Outcomes</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Call Back">Call Back</option>
              <option value="Not Interested">Not Interested</option>
              <option value="No Answer">No Answer</option>
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
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
            </select>
          </div>

          <div className="his-field">
            <label>Lead Type</label>
            <select
              value={filters.leadType}
              onChange={e => handleFilterChange('leadType', e.target.value)}
            >
              <option value="">Select Lead Type</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="CAT">CAT</option>
            </select>
          </div>

          <div className="his-field">
            <label>From</label>
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
            <label>To</label>
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
          <h2>Complete Call Log</h2>
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
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="his-table-wrapper">
          {paginatedCalls.length > 0 ? (
            <table className="his-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>LEAD</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>LEAD TYPE</th>
                  <th>CALL TYPE</th>
                  <th>OUTCOME</th>
                  <th>REMARKS</th>
                  <th>CALL TIME</th>
                  <th>ASSIGNED TO</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCalls.map((call, idx) => (
                  <tr key={call.id}>
                    <td>{startIndex + idx + 1}</td>
                    <td className="his-lead-id">{call.leadId}</td>
                    <td className="his-lead-name">
                      <strong>{call.name}</strong>
                    </td>
                    <td className="his-phone">{call.phone}</td>
                    <td>
                      <span className="his-badge his-badge-source">{call.source}</span>
                    </td>
                    <td>
                      <span className="his-badge his-badge-type">{call.leadType}</span>
                    </td>
                    <td>
                      <span className="his-badge his-badge-calltype">{call.callType}</span>
                    </td>
                    <td>
                      <span className={`his-badge his-badge-outcome ${call.outcome.toLowerCase().replace(/\s+/g, '-')}`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td className="his-remarks">{call.remarks}</td>
                    <td className="his-calltime">
                      <FiCalendar size={11} style={{ marginRight: 4 }} />
                      {call.callTime}
                    </td>
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
                        title="View Full Call Record"
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="his-no-data">No call history records found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="his-pagination-footer">
          <div className="his-info">
            Showing {totalEntries ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>
          <div className="his-pagination">
            <button
              className="his-page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button
              className="his-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`his-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="his-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
            <button
              className="his-page-btn"
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
        <div className="his-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="his-modal-content" onClick={e => e.stopPropagation()}>
            <div className="his-modal-header">
              <h3>Call History Detail Record</h3>
              <button type="button" className="his-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="his-modal-body">
              <div className="his-modal-grid">
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
                  <strong>Lead Source:</strong>
                  <span>{selectedCall.source}</span>
                </div>
                <div>
                  <strong>Lead Type:</strong>
                  <span>{selectedCall.leadType}</span>
                </div>
                <div>
                  <strong>Call Type:</strong>
                  <span>{selectedCall.callType}</span>
                </div>
                <div>
                  <strong>Outcome:</strong>
                  <span>{selectedCall.outcome}</span>
                </div>
                <div>
                  <strong>Call Time:</strong>
                  <span>{selectedCall.callTime}</span>
                </div>
                <div>
                  <strong>Call Duration:</strong>
                  <span>{selectedCall.duration}</span>
                </div>
                <div>
                  <strong>Assigned To:</strong>
                  <span>{selectedCall.assignedTo}</span>
                </div>
              </div>
              <div className="his-modal-remarks">
                <strong>Remarks / Conversation Notes:</strong>
                <p>{selectedCall.remarks}</p>
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
