import React, { useState, useMemo, useEffect } from 'react';
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
import axiosInstance from '../../utils/axiosConfig';
import './ConvertedCalls.css';

const getLocalDateString = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  if (Number.isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ConvertedCalls = () => {
  const [calls, setCalls] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchConverted = async () => {
      try {
        const [res, teamRes] = await Promise.allSettled([
          axiosInstance.get('/crm/admin/calls/converted', { _skipErrorNotify: true }),
          axiosInstance.get('/crm/leads/team', { _skipErrorNotify: true })
        ]);
        if (isMounted && res.status === 'fulfilled' && Array.isArray(res.value?.data?.items)) {
          const items = res.value.data.items.map((lead, idx) => ({
            id: lead._id || idx + 1,
            leadId: `#LD-${String(lead._id).slice(-3)}`,
            name: lead.name || 'Lead',
            note: lead.remarks || lead.customField1 || '—',
            phone: lead.phone || '—',
            source: lead.leadSource?.name || lead.source || 'Direct',
            leadType: lead.leadType?.name || 'General',
            leadStatus: 'Converted',
            outcome: 'Converted',
            callType: 'Outbound',
            completedAt: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            rawCompletedDate: lead.updatedAt ? getLocalDateString(lead.updatedAt) : '',
            attempts: lead.callHistory?.length || 0,
            assignedTo: lead.assignedTo?.name || 'Unassigned',
            conversionValue: lead.expectedValue ? `₹${lead.expectedValue.toLocaleString('en-IN')}` : '—',
            enrolledCourse: lead.course || lead.leadType?.name || '—',
            paymentStatus: lead.paymentStatus || '—',
            remarks: lead.remarks || '—'
          }));
          setCalls(items);
        }
        if (isMounted && teamRes.status === 'fulfilled' && Array.isArray(teamRes.value?.data?.users)) {
          setTeamUsers(teamRes.value.data.users);
        }
      } catch (err) { if (isMounted) setCalls([]); }
    };
    fetchConverted();
    return () => { isMounted = false; };
  }, []);
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

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      if (appliedFilters.assignedTo && call.assignedTo !== appliedFilters.assignedTo) return false;
      if (appliedFilters.callType && call.callType !== appliedFilters.callType) return false;
      if (appliedFilters.source && call.source !== appliedFilters.source) return false;
      if (appliedFilters.leadType && call.leadType !== appliedFilters.leadType) return false;
      if (appliedFilters.completedDate && call.rawCompletedDate !== appliedFilters.completedDate) return false;

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

  const totalEntries = filteredCalls.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedCalls = filteredCalls.slice(startIndex, startIndex + entriesPerPage);

  const totalConverted = calls.length;
  const inboundCount = calls.filter(c => c.callType === 'Inbound').length;
  const todayStr = getLocalDateString(new Date());
  const convertedToday = calls.filter(c => c.rawCompletedDate === todayStr).length;
  const outboundCount = calls.filter(c => c.callType === 'Outbound').length;

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
            <span className="cnv-stat-value">{totalConverted}</span>
            <span className="cnv-stat-badge emerald">Conversions</span>
          </div>
          <div className="cnv-stat-icon emerald">
            <FiAward size={20} />
          </div>
        </div>

        <div className="cnv-stat-card">
          <div className="cnv-stat-left">
            <span className="cnv-stat-label">Inbound</span>
            <span className="cnv-stat-value">{inboundCount}</span>
            <span className="cnv-stat-badge blue">Inbound Calls</span>
          </div>
          <div className="cnv-stat-icon blue">
            <FiPhoneIncoming size={20} />
          </div>
        </div>

        <div className="cnv-stat-card">
          <div className="cnv-stat-left">
            <span className="cnv-stat-label">Converted Today</span>
            <span className="cnv-stat-value">{convertedToday}</span>
            <span className="cnv-stat-badge amber">Today</span>
          </div>
          <div className="cnv-stat-icon amber">
            <FiCalendar size={20} />
          </div>
        </div>

        <div className="cnv-stat-card">
          <div className="cnv-stat-left">
            <span className="cnv-stat-label">Outbound</span>
            <span className="cnv-stat-value">{outboundCount}</span>
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
              {Array.from(new Set([
                ...(teamUsers.map(u => u.name).filter(Boolean)),
                ...(calls.map(c => c.assignedTo).filter(Boolean))
              ])).map(name => (
                <option key={name} value={name}>{name}</option>
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
              {Array.from(new Set([
                'Facebook', 'Instagram', 'Referral', 'Website',
                ...(calls.map(c => c.source).filter(Boolean))
              ])).map(s => (
                <option key={s} value={s}>{s}</option>
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
              {Array.from(new Set([
                'NEET', 'JEE', 'CAT',
                ...(calls.map(c => c.leadType).filter(Boolean))
              ])).map(t => (
                <option key={t} value={t}>{t}</option>
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
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="cnv-table-wrapper">
          {paginatedCalls.length > 0 ? (
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
                {paginatedCalls.map((call, idx) => (
                  <tr key={call.id}>
                    <td>{startIndex + idx + 1}</td>
                    <td className="cnv-lead-id">{call.leadId}</td>
                    <td className="cnv-lead-name">
                      <strong>{call.name}</strong>
                      {call.note && <small>{call.note}</small>}
                    </td>
                    <td className="cnv-phone">{call.phone}</td>
                    <td>
                      <span className="cnv-badge cnv-badge-source">{call.source}</span>
                    </td>
                    <td>
                      <span className="cnv-badge cnv-badge-type">{call.leadType}</span>
                    </td>
                    <td>
                      <span className="cnv-badge cnv-badge-status converted">{call.leadStatus}</span>
                    </td>
                    <td>
                      <span className="cnv-badge cnv-badge-outcome converted">{call.outcome}</span>
                    </td>
                    <td>
                      <span className="cnv-badge cnv-badge-calltype">{call.callType}</span>
                    </td>
                    <td className="cnv-completed-at">
                      <FiCalendar size={11} style={{ marginRight: 4 }} />
                      {call.completedAt}
                    </td>
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
                        title="View Converted Details"
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="cnv-no-data">No converted calls found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="cnv-pagination-footer">
          <div className="cnv-info">
            Showing {totalEntries ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>
          <div className="cnv-pagination">
            <button
              className="cnv-page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button
              className="cnv-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`cnv-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="cnv-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
            <button
              className="cnv-page-btn"
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
        <div className="cnv-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="cnv-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cnv-modal-header">
              <h3>Converted Call & Enrollment Details</h3>
              <button type="button" className="cnv-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="cnv-modal-body">
              <div className="cnv-modal-grid">
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
                  <strong>Enrolled Course:</strong>
                  <span>{selectedCall.enrolledCourse}</span>
                </div>
                <div>
                  <strong>Conversion Value:</strong>
                  <span>{selectedCall.conversionValue}</span>
                </div>
                <div>
                  <strong>Payment Status:</strong>
                  <span>{selectedCall.paymentStatus}</span>
                </div>
                <div>
                  <strong>Completed At:</strong>
                  <span>{selectedCall.completedAt}</span>
                </div>
                <div>
                  <strong>Assigned To:</strong>
                  <span>{selectedCall.assignedTo}</span>
                </div>
              </div>
              {selectedCall.remarks && (
                <div className="cnv-modal-remarks">
                  <strong>Conversion Notes:</strong>
                  <p>{selectedCall.remarks}</p>
                </div>
              )}
              <div className="cnv-modal-actions">
                <button
                  type="button"
                  className="cnv-modal-btn cnv-modal-btn-secondary"
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

export default ConvertedCalls;
