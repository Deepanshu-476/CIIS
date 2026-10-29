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
  FiCheckCircle,
  FiSmile,
  FiClock,
  FiAward,
  FiCalendar,
  FiPhoneCall
} from 'react-icons/fi';
import axiosInstance from '../../utils/axiosConfig';
import useCrmPagedList, { optionNames, pageWindow, leadAttempts } from '../hooks/useCrmPagedList';
import './CompletedCalls.css';

const getLocalDateString = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  if (Number.isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mapCompletedLead = (lead, idx) => ({
  id: lead._id || idx + 1,
  leadId: `#LD-${String(lead._id).slice(-3)}`,
  name: lead.name || 'Lead',
  note: lead.remarks || lead.customField1 || '—',
  phone: lead.phone || '—',
  source: lead.leadSourceName || lead.leadSource?.name || lead.source || 'Direct',
  leadType: lead.leadTypeName || lead.leadType?.name || 'General',
  leadStatus: lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'Converted',
  outcome: lead.status === 'converted' ? 'Converted' : 'Interested',
  callType: 'Outbound',
  completedAt: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
  rawCompletedDate: lead.updatedAt ? getLocalDateString(lead.updatedAt) : '',
  attempts: leadAttempts(lead),
  assignedTo: lead.assignedToName || lead.assignedTo?.name || 'Unassigned',
  remarks: lead.remarks || '—'
});

// "Outcome" in this page is derived from the lead status; every completed call is shown as Outbound.
const OUTCOME_STATUS = { Converted: 'converted', Interested: 'closed' };

const CompletedCalls = () => {
  const [teamUsers, setTeamUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    axiosInstance.get('/crm/leads/team', { _skipErrorNotify: true })
      .then(res => { if (isMounted && Array.isArray(res.data?.users)) setTeamUsers(res.data.users); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);
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

  const noMatch = appliedFilters.callType && appliedFilters.callType !== 'Outbound';
  const { items, total, pages, stats, options } = useCrmPagedList('/crm/admin/calls/completed', {
    page: currentPage,
    limit: entriesPerPage,
    search: searchTerm,
    filters: {
      assignedTo: appliedFilters.assignedTo,
      source: appliedFilters.source,
      leadType: appliedFilters.leadType,
      status: noMatch ? 'none' : (OUTCOME_STATUS[appliedFilters.outcome] || ''),
      from: appliedFilters.completedDate,
      to: appliedFilters.completedDate,
      dateField: 'updatedAt'
    }
  });
  const paginatedCalls = useMemo(() => items.map(mapCompletedLead), [items]);
  const totalEntries = total;
  const totalPages = pages;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const optionAssignees = useMemo(() => optionNames(options?.assignees), [options]);
  const optionSources = useMemo(() => optionNames(options?.sources), [options]);
  const optionTypes = useMemo(() => optionNames(options?.types), [options]);

  const totalCompletedCount = stats?.total || 0;
  const interestedCount = stats?.byStatus?.closed || 0;
  const todayCompletedCount = stats?.updatedToday || 0;
  const convertedCount = stats?.byStatus?.converted || 0;
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
            <span className="cc-stat-value">{totalCompletedCount}</span>
            <span className="cc-stat-badge purple">Call Logs</span>
          </div>
          <div className="cc-stat-icon purple">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-left">
            <span className="cc-stat-label">Interested</span>
            <span className="cc-stat-value">{interestedCount}</span>
            <span className="cc-stat-badge emerald">Prospects</span>
          </div>
          <div className="cc-stat-icon emerald">
            <FiSmile size={20} />
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-left">
            <span className="cc-stat-label">Today Completed</span>
            <span className="cc-stat-value">{todayCompletedCount}</span>
            <span className="cc-stat-badge amber">Today</span>
          </div>
          <div className="cc-stat-icon amber">
            <FiClock size={20} />
          </div>
        </div>

        <div className="cc-stat-card">
          <div className="cc-stat-left">
            <span className="cc-stat-label">Converted</span>
            <span className="cc-stat-value">{convertedCount}</span>
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
              {Array.from(new Set([
                ...(teamUsers.map(u => u.name).filter(Boolean)),
                ...optionAssignees
              ])).map(name => (
                <option key={name} value={name}>{name}</option>
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
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Call Back">Call Back</option>
              <option value="Not Interested">Not Interested</option>
              <option value="No Answer">No Answer</option>
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
              {Array.from(new Set([
                'Facebook', 'Instagram', 'Referral', 'Website',
                ...optionSources
              ])).map(s => (
                <option key={s} value={s}>{s}</option>
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
              {Array.from(new Set([
                'NEET', 'JEE', 'CAT',
                ...optionTypes
              ])).map(t => (
                <option key={t} value={t}>{t}</option>
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
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="cc-table-wrapper">
          {paginatedCalls.length > 0 ? (
            <table className="cc-table">
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
                    <td className="cc-lead-id">{call.leadId}</td>
                    <td className="cc-lead-name">
                      <strong>{call.name}</strong>
                      {call.note && <small>{call.note}</small>}
                    </td>
                    <td className="cc-phone">{call.phone}</td>
                    <td>
                      <span className="cc-badge cc-badge-source">{call.source}</span>
                    </td>
                    <td>
                      <span className="cc-badge cc-badge-type">{call.leadType}</span>
                    </td>
                    <td>
                      <span className={`cc-badge cc-badge-status ${call.leadStatus.toLowerCase()}`}>
                        {call.leadStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`cc-badge cc-badge-outcome ${call.outcome.toLowerCase().replace(/\s+/g, '-')}`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td>
                      <span className="cc-badge cc-badge-calltype">{call.callType}</span>
                    </td>
                    <td className="cc-completed-at">
                      <FiCalendar size={11} style={{ marginRight: 4 }} />
                      {call.completedAt}
                    </td>
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
                        title="View Completed Call Details"
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="cc-no-data">No completed calls found matching your filters.</div>
          )}
        </div>

        {/* Footer */}
        <div className="cc-pagination-footer">
          <div className="cc-info">
            Showing {totalEntries ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>
          <div className="cc-pagination">
            <button
              className="cc-page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button
              className="cc-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {pageWindow(currentPage, totalPages).map((p, _x, _y, i = p - 1) => (
              <button
                key={i + 1}
                className={`cc-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="cc-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
            <button
              className="cc-page-btn"
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
                  <strong>Lead Status:</strong>
                  <span>{selectedCall.leadStatus}</span>
                </div>
                <div>
                  <strong>Outcome:</strong>
                  <span>{selectedCall.outcome}</span>
                </div>
                <div>
                  <strong>Call Type:</strong>
                  <span>{selectedCall.callType}</span>
                </div>
                <div>
                  <strong>Completed At:</strong>
                  <span>{selectedCall.completedAt}</span>
                </div>
                <div>
                  <strong>Attempts:</strong>
                  <span>{selectedCall.attempts}</span>
                </div>
                <div>
                  <strong>Assigned To:</strong>
                  <span>{selectedCall.assignedTo}</span>
                </div>
              </div>
              {selectedCall.remarks && (
                <div className="cc-modal-remarks">
                  <strong>Remarks / Call Notes:</strong>
                  <p>{selectedCall.remarks}</p>
                </div>
              )}
              <div className="cc-modal-actions">
                <button
                  type="button"
                  className="cc-modal-btn cc-modal-btn-secondary"
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

export default CompletedCalls;
