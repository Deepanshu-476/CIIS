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
  FiPhoneCall
} from 'react-icons/fi';
import './PendingCalls.css';

const initialPendingCalls = [
  {
    id: 1,
    leadId: '#LD-009',
    name: 'Komal Wadhwa',
    phone: '9598564205',
    source: 'Facebook',
    leadType: 'NEET',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 1',
    attempts: 0
  },
  {
    id: 2,
    leadId: '#LD-010',
    name: 'Rekha Kapoor',
    phone: '9887676772',
    source: 'Facebook',
    leadType: 'NEET',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 3,
    leadId: '#LD-011',
    name: 'Sanjay Chauhan',
    phone: '7164334722',
    source: 'Facebook',
    leadType: 'NEET',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 4,
    leadId: '#LD-012',
    name: 'Meena Rajan',
    phone: '8936899809',
    source: 'Facebook',
    leadType: 'NEET',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 5,
    leadId: '#LD-013',
    name: 'Priya Gandhi',
    phone: '7350488899',
    source: 'Facebook',
    leadType: 'NEET',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 6,
    leadId: '#LD-039',
    name: 'Divya Qureshi',
    phone: '8026542351',
    source: 'Instagram',
    leadType: 'JEE',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 7,
    leadId: '#LD-040',
    name: 'Sneha Hegde',
    phone: '9662702895',
    source: 'Instagram',
    leadType: 'JEE',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 8,
    leadId: '#LD-041',
    name: 'Queenie Bansal',
    phone: '7149587020',
    source: 'Instagram',
    leadType: 'JEE',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 9,
    leadId: '#LD-042',
    name: 'Manoj Saxena',
    phone: '6937452991',
    source: 'Instagram',
    leadType: 'JEE',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  },
  {
    id: 10,
    leadId: '#LD-043',
    name: 'Anjali Malhotra',
    phone: '8026811775',
    source: 'Instagram',
    leadType: 'JEE',
    status: 'Assigned',
    lastCall: 'Never Called',
    nextFollowup: 'Not Scheduled',
    assignedDate: '22 Aug 2026',
    assignedAgo: '1 week ago',
    priority: 'High',
    assignedTo: 'Telecaller 2',
    attempts: 0
  }
];

export default function PendingCalls() {
  const [calls] = useState(initialPendingCalls);
  
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

  // Filtered & searched calls
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Dropdown filters
      if (appliedFilters.assignedTo && call.assignedTo !== appliedFilters.assignedTo) return false;
      if (appliedFilters.source && call.source !== appliedFilters.source) return false;
      if (appliedFilters.leadType && call.leadType !== appliedFilters.leadType) return false;
      if (appliedFilters.status && call.status !== appliedFilters.status) return false;
      if (appliedFilters.attempts !== '') {
        const attVal = Number(appliedFilters.attempts);
        if (!isNaN(attVal) && call.attempts !== attVal) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match =
          call.leadId.toLowerCase().includes(query) ||
          call.name.toLowerCase().includes(query) ||
          call.phone.includes(query) ||
          call.source.toLowerCase().includes(query) ||
          call.leadType.toLowerCase().includes(query) ||
          call.assignedTo.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [calls, appliedFilters, searchTerm]);

  // Pagination logic
  const totalEntries = filteredCalls.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedCalls = filteredCalls.slice(startIndex, startIndex + entriesPerPage);

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
              <option value="Telecaller 1">Telecaller 1</option>
              <option value="Telecaller 2">Telecaller 2</option>
            </select>
          </div>

          <div className="pc-field">
            <label>Lead Source</label>
            <select
              value={filters.source}
              onChange={e => handleFilterChange('source', e.target.value)}
            >
              <option value="">All Sources</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
            </select>
          </div>

          <div className="pc-field">
            <label>Lead Type</label>
            <select
              value={filters.leadType}
              onChange={e => handleFilterChange('leadType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="CAT">CAT</option>
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
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="pc-field">
            <label>Attempts</label>
            <select
              value={filters.attempts}
              onChange={e => handleFilterChange('attempts', e.target.value)}
            >
              <option value="">Any</option>
              <option value="0">0 Attempts</option>
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
              placeholder=""
            />
          </div>
        </div>

        {/* Table */}
        <div className="pc-table-wrapper">
          {paginatedCalls.length > 0 ? (
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
                {paginatedCalls.map((call, idx) => (
                  <tr key={call.id}>
                    <td>{startIndex + idx + 1}</td>
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
                      <span className="pc-badge pc-badge-priority">{call.priority}</span>
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

        {/* Footer / Pagination */}
        <div className="pc-table-footer">
          <div className="pc-footer-info">
            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div className="pc-pagination">
            <button
              className="pc-page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First Page"
            >
              «
            </button>
            <button
              className="pc-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`pc-page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="pc-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              ›
            </button>
            <button
              className="pc-page-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      </section>

      {/* Modal for Pending Call Details */}
      {selectedCall && (
        <div className="pc-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="pc-modal-content" onClick={e => e.stopPropagation()}>
            <div className="pc-modal-header">
              <h3>Pending Call Details</h3>
              <button type="button" className="pc-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="pc-modal-body">
              <div className="pc-modal-grid">
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
                  <strong>Status:</strong>
                  <span>{selectedCall.status}</span>
                </div>
                <div>
                  <strong>Last Call:</strong>
                  <span>{selectedCall.lastCall}</span>
                </div>
                <div>
                  <strong>Next Follow Up:</strong>
                  <span>{selectedCall.nextFollowup}</span>
                </div>
                <div>
                  <strong>Assigned Age:</strong>
                  <span>{selectedCall.assignedDate} ({selectedCall.assignedAgo})</span>
                </div>
                <div>
                  <strong>Priority:</strong>
                  <span>{selectedCall.priority}</span>
                </div>
                <div>
                  <strong>Assigned To:</strong>
                  <span>{selectedCall.assignedTo}</span>
                </div>
                <div>
                  <strong>Attempts:</strong>
                  <span>{selectedCall.attempts}</span>
                </div>
              </div>

              <div className="pc-modal-actions">
                <button
                  type="button"
                  className="pc-modal-btn pc-modal-btn-secondary"
                  onClick={() => setSelectedCall(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="pc-modal-btn pc-modal-btn-primary"
                  onClick={() => {
                    alert(`Initiating call to ${selectedCall.name} (${selectedCall.phone})...`);
                    setSelectedCall(null);
                  }}
                >
                  Start Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
