import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiPhone,
  FiCopy,
  FiCheck,
  FiUsers,
  FiClock,
  FiChevronRight,
  FiPhoneCall,
  FiUserCheck
} from 'react-icons/fi';
import axiosInstance from '../../utils/axiosConfig';
import './AssignedCalls.css';

const formatName = (str = '') => {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const calculateAge = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const diffDays = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const AssignedCalls = () => {
  const [callsList, setCallsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamUsers, setTeamUsers] = useState([]);
  const [filters, setFilters] = useState({ assignedTo: '', source: '', type: '', from: '', to: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchAssigned = async () => {
    setLoading(true);
    setError('');
    try {
      const [res, teamRes] = await Promise.allSettled([
        axiosInstance.get('/crm/admin/calls/assigned', { _skipErrorNotify: true }),
        axiosInstance.get('/crm/leads/team', { _skipErrorNotify: true })
      ]);

      if (res.status === 'fulfilled' && Array.isArray(res.value?.data?.items)) {
        const items = res.value.data.items.map((lead, idx) => ({
          id: lead._id || idx + 1,
          rawId: lead._id,
          leadId: lead._id ? `#LD-${String(lead._id).slice(-4).toUpperCase()}` : `#LD-00${idx + 1}`,
          lead: lead.name || 'Lead',
          email: lead.email || '',
          note: lead.remarks || lead.customField1 || '—',
          phone: lead.phone || '—',
          source: lead.leadSource?.name || lead.source || 'Direct',
          type: lead.leadType?.name || 'General',
          status: lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'Assigned',
          assignedTo: lead.assignedTo?.name || 'Unassigned',
          assignedRole: lead.assignedTo?.jobRole || lead.assignedTo?.role || 'Telecaller',
          assignedRawDate: lead.assignedAt || lead.createdAt,
          createdRawDate: lead.createdAt,
          assignedDate: lead.assignedAt
            ? new Date(lead.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          age: lead.createdAt ? calculateAge(lead.createdAt) : '—'
        }));
        setCallsList(items);
      } else if (res.status === 'rejected') {
        setError(res.reason?.response?.data?.message || 'Unable to load assigned calls.');
      }

      if (teamRes.status === 'fulfilled' && Array.isArray(teamRes.value?.data?.users)) {
        setTeamUsers(teamRes.value.data.users);
      }
    } catch (err) {
      setError('An error occurred while loading calls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  // Compute top KPI cards
  const stats = useMemo(() => {
    const total = callsList.length;
    const uniqueTelecallers = new Set(
      callsList.map(c => c.assignedTo).filter(a => a && a !== 'Unassigned')
    ).size;
    const todayStr = new Date().toISOString().slice(0, 10);
    const assignedToday = callsList.filter(c => {
      if (!c.assignedRawDate) return false;
      const d = new Date(c.assignedRawDate);
      return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === todayStr;
    }).length;
    const activeFollowUps = callsList.filter(c =>
      ['follow-up', 'in progress', 'interested', 'new', 'assigned'].includes(
        String(c.status || '').toLowerCase()
      )
    ).length;

    return {
      total,
      uniqueTelecallers,
      assignedToday,
      activeFollowUps
    };
  }, [callsList]);

  // Dynamic filter options derived from actual data
  const availableSources = useMemo(() => {
    const set = new Set(callsList.map(c => c.source).filter(Boolean));
    ['Facebook', 'Instagram', 'Referral', 'Website', 'Google Ads', 'Walk-in'].forEach(s => set.add(s));
    return Array.from(set);
  }, [callsList]);

  const availableTypes = useMemo(() => {
    const set = new Set(callsList.map(c => c.type).filter(Boolean));
    ['NEET', 'JEE', 'CAT', 'Crash Course', 'General'].forEach(t => set.add(t));
    return Array.from(set);
  }, [callsList]);

  // Filtered Leads
  const filteredCalls = useMemo(() => {
    return callsList.filter(call => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || [call.leadId, call.lead, call.phone, call.source, call.type, call.assignedTo, call.note]
        .some(value => String(value || '').toLowerCase().includes(query));

      // Date range filtering
      let matchesDate = true;
      if (appliedFilters.from || appliedFilters.to) {
        const rawDate = call.assignedRawDate ? new Date(call.assignedRawDate) : (call.createdRawDate ? new Date(call.createdRawDate) : null);
        if (rawDate && !isNaN(rawDate.getTime())) {
          const dateStr = rawDate.toISOString().slice(0, 10);
          if (appliedFilters.from && dateStr < appliedFilters.from) matchesDate = false;
          if (appliedFilters.to && dateStr > appliedFilters.to) matchesDate = false;
        }
      }

      return matchesSearch
        && matchesDate
        && (!appliedFilters.assignedTo || call.assignedTo === appliedFilters.assignedTo)
        && (!appliedFilters.source || call.source === appliedFilters.source)
        && (!appliedFilters.type || call.type === appliedFilters.type);
    });
  }, [appliedFilters, search, callsList]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(appliedFilters).filter(Boolean).length;
  }, [appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / pageSize));
  const visibleCalls = filteredCalls.slice((page - 1) * pageSize, page * pageSize);

  const updateFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const applyFilters = () => { setAppliedFilters(filters); setPage(1); };
  const resetFilters = () => {
    const next = { assignedTo: '', source: '', type: '', from: '', to: '' };
    setFilters(next); setAppliedFilters(next); setSearch(''); setPage(1);
  };

  const copyPhone = (phone, id) => {
    if (!phone || phone === '—') return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <main className="assigned-calls-page">
      {/* Page Header & Breadcrumbs */}
      <div className="assigned-calls-heading">
        <div className="assigned-heading-left">
          <div className="assigned-title-row">
            <h1>Assigned Calls</h1>
            <span className="assigned-title-badge">{callsList.length} Total Leads</span>
          </div>
          <p className="assigned-subtitle">
            Monitor and track leads assigned across telecallers, counselors, and executives.
          </p>
        </div>
        <nav className="assigned-breadcrumb" aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight className="assigned-crumb-sep" />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight className="assigned-crumb-sep" />
          <span>Assigned Calls</span>
        </nav>
      </div>

      {/* KPI Stats Row */}
      <section className="assigned-stats-grid">
        <div className="assigned-stat-card">
          <div className="assigned-stat-info">
            <span className="assigned-stat-lbl">Total Assigned</span>
            <span className="assigned-stat-val">{stats.total}</span>
          </div>
          <div className="assigned-stat-icon indigo">
            <FiPhoneCall size={22} />
          </div>
        </div>

        <div className="assigned-stat-card">
          <div className="assigned-stat-info">
            <span className="assigned-stat-lbl">Active Telecallers</span>
            <span className="assigned-stat-val">{stats.uniqueTelecallers}</span>
          </div>
          <div className="assigned-stat-icon emerald">
            <FiUsers size={22} />
          </div>
        </div>

        <div className="assigned-stat-card">
          <div className="assigned-stat-info">
            <span className="assigned-stat-lbl">Assigned Today</span>
            <span className="assigned-stat-val">{stats.assignedToday}</span>
          </div>
          <div className="assigned-stat-icon amber">
            <FiCalendar size={22} />
          </div>
        </div>

        <div className="assigned-stat-card">
          <div className="assigned-stat-info">
            <span className="assigned-stat-lbl">Active / In Progress</span>
            <span className="assigned-stat-val">{stats.activeFollowUps}</span>
          </div>
          <div className="assigned-stat-icon sky">
            <FiClock size={22} />
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="assigned-filter-card">
        <div className="assigned-filter-top">
          <div className="assigned-filter-title">
            <FiFilter size={16} />
            <span>Filter Assigned Leads</span>
            {activeFiltersCount > 0 && (
              <span className="assigned-active-filter-badge">{activeFiltersCount} Active</span>
            )}
          </div>
        </div>

        <div className="assigned-filter-grid">
          <div className="assigned-filter-field">
            <label htmlFor="filter-assigned-to">Assigned Telecaller</label>
            <select
              id="filter-assigned-to"
              value={filters.assignedTo}
              onChange={event => updateFilter('assignedTo', event.target.value)}
            >
              <option value="">All Telecallers</option>
              {teamUsers.map(u => (
                <option key={u._id} value={u.name}>{formatName(u.name)}</option>
              ))}
            </select>
          </div>

          <div className="assigned-filter-field">
            <label htmlFor="filter-source">Lead Source</label>
            <select
              id="filter-source"
              value={filters.source}
              onChange={event => updateFilter('source', event.target.value)}
            >
              <option value="">All Sources</option>
              {availableSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="assigned-filter-field">
            <label htmlFor="filter-type">Lead Type</label>
            <select
              id="filter-type"
              value={filters.type}
              onChange={event => updateFilter('type', event.target.value)}
            >
              <option value="">All Types</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="assigned-filter-field">
            <label htmlFor="filter-from">Date From</label>
            <input
              id="filter-from"
              type="date"
              value={filters.from}
              onChange={event => updateFilter('from', event.target.value)}
            />
          </div>

          <div className="assigned-filter-field">
            <label htmlFor="filter-to">Date To</label>
            <input
              id="filter-to"
              type="date"
              value={filters.to}
              onChange={event => updateFilter('to', event.target.value)}
            />
          </div>

          <div className="assigned-filter-actions">
            <button
              type="button"
              className="assigned-btn-apply"
              onClick={applyFilters}
            >
              <FiFilter size={14} /> Apply
            </button>
            <button
              type="button"
              className="assigned-btn-reset"
              onClick={resetFilters}
              aria-label="Reset filters"
              title="Reset all filters"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="assigned-table-card">
        <header className="assigned-table-card-header">
          <div className="assigned-table-header-left">
            <h2 className="assigned-table-title">Lead Assignment Directory</h2>
            <span className="assigned-counter-pill">
              {filteredCalls.length} {filteredCalls.length === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>

          <div className="assigned-table-header-right">
            <div className="assigned-page-size-wrap">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}
                aria-label="Entries per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="assigned-search-box">
              <FiSearch size={14} className="assigned-search-icon" />
              <input
                value={search}
                placeholder="Search lead, phone, caller..."
                onChange={event => { setSearch(event.target.value); setPage(1); }}
              />
              {search && (
                <button
                  type="button"
                  className="assigned-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="assigned-btn-refresh"
              onClick={fetchAssigned}
              disabled={loading}
              title="Refresh list"
            >
              <FiRefreshCw size={13} className={loading ? 'assigned-spinner' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <div className="assigned-table-scroll">
          <table className="assigned-main-table">
            <thead>
              <tr>
                <th className="assigned-td-sl">#</th>
                <th>Lead ID</th>
                <th>Lead Name</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Type</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Assigned Date</th>
                <th>Age</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleCalls.map((call, index) => {
                const isUrgent = call.age.includes('month') || (call.age.includes('days') && parseInt(call.age, 10) > 14);
                return (
                  <tr key={call.leadId || index}>
                    <td className="assigned-td-sl">{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      <span className="assigned-lead-badge">{call.leadId}</span>
                    </td>
                    <td>
                      <div className="assigned-lead-info">
                        <span className="assigned-lead-name" title={call.lead}>
                          {formatName(call.lead)}
                        </span>
                        {call.note && call.note !== '—' && (
                          <span className="assigned-lead-note" title={call.note}>
                            {call.note}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="assigned-phone-wrapper">
                        <span>{call.phone}</span>
                        {call.phone && call.phone !== '—' && (
                          <button
                            type="button"
                            className={`assigned-copy-btn ${copiedId === call.id ? 'copied' : ''}`}
                            onClick={() => copyPhone(call.phone, call.id)}
                            title="Copy phone number"
                          >
                            {copiedId === call.id ? <FiCheck size={13} /> : <FiCopy size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="assigned-pill source">{call.source}</span>
                    </td>
                    <td>
                      <span className="assigned-pill type">{call.type}</span>
                    </td>
                    <td>
                      <span className={`assigned-pill status ${call.status?.toLowerCase().includes('follow') ? 'followup' : ''}`}>
                        {call.status}
                      </span>
                    </td>
                    <td>
                      <div className="assigned-telecaller-box">
                        <span className="assigned-telecaller-avatar">
                          {getInitials(call.assignedTo)}
                        </span>
                        <div className="assigned-telecaller-meta">
                          <span className="assigned-telecaller-name">
                            {formatName(call.assignedTo)}
                          </span>
                          <span className="assigned-telecaller-role">
                            {call.assignedRole || 'Telecaller'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="assigned-date-box">
                        <FiCalendar size={13} />
                        {call.assignedDate}
                      </span>
                    </td>
                    <td>
                      <span className={`assigned-age-badge ${isUrgent ? 'urgent' : ''}`}>
                        {call.age}
                      </span>
                    </td>
                    <td>
                      <div className="assigned-actions-cell">
                        <button
                          type="button"
                          className="assigned-btn-view"
                          title={`View details of ${call.lead}`}
                          aria-label={`View ${call.lead}`}
                          onClick={() => setSelectedLead(call)}
                        >
                          <FiEye size={14} />
                        </button>
                        {call.phone && call.phone !== '—' && (
                          <a
                            href={`tel:${call.phone}`}
                            className="assigned-btn-call"
                            title={`Direct call ${call.phone}`}
                            aria-label={`Call ${call.phone}`}
                          >
                            <FiPhone size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <div className="assigned-state-box">
              <FiRefreshCw size={26} className="assigned-spinner" />
              <h3>Loading Assigned Calls...</h3>
              <p>Fetching the latest lead assignments and caller metrics.</p>
            </div>
          )}

          {!loading && error && (
            <div className="assigned-state-box" style={{ color: '#ef4444' }}>
              <FiX size={26} />
              <h3>Could Not Load Calls</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && !visibleCalls.length && (
            <div className="assigned-state-box">
              <FiPhoneCall size={32} style={{ color: '#94a3b8' }} />
              <h3>No Assigned Calls Found</h3>
              <p>No leads match your current search or filter criteria. Try resetting filters.</p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="assigned-btn-apply"
                  style={{ marginTop: 8 }}
                  onClick={resetFilters}
                >
                  <FiRefreshCw size={13} /> Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table Pagination Footer */}
        <footer className="assigned-table-footer">
          <span className="assigned-showing-txt">
            Showing {filteredCalls.length ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, filteredCalls.length)} of {filteredCalls.length} entries
          </span>
          <div className="assigned-pagination-btns">
            <button
              type="button"
              className="assigned-pg-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First page"
            >
              «
            </button>
            <button
              type="button"
              className="assigned-pg-btn"
              onClick={() => setPage(v => Math.max(1, v - 1))}
              disabled={page === 1}
              title="Previous page"
            >
              ‹
            </button>
            {(() => {
              const pageNumbers = [];
              const delta = 2;
              const rangeLeft = Math.max(2, page - delta);
              const rangeRight = Math.min(totalPages - 1, page + delta);

              pageNumbers.push(1);
              if (rangeLeft > 2) pageNumbers.push('...');
              for (let i = rangeLeft; i <= rangeRight; i++) {
                pageNumbers.push(i);
              }
              if (rangeRight < totalPages - 1) pageNumbers.push('...');
              if (totalPages > 1) pageNumbers.push(totalPages);

              return pageNumbers.map((p, idx) =>
                p === '...' ? (
                  <span key={`ellip-${idx}`} className="assigned-pg-ellipsis">...</span>
                ) : (
                  <button
                    type="button"
                    className={`assigned-pg-btn ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                    key={p}
                  >
                    {p}
                  </button>
                )
              );
            })()}
            <button
              type="button"
              className="assigned-pg-btn"
              onClick={() => setPage(v => Math.min(totalPages, v + 1))}
              disabled={page === totalPages}
              title="Next page"
            >
              ›
            </button>
            <button
              type="button"
              className="assigned-pg-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              title="Last page"
            >
              »
            </button>
          </div>
        </footer>
      </section>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="assigned-modal-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="assigned-modal" onClick={e => e.stopPropagation()}>
            <div className="assigned-modal-header">
              <div className="assigned-modal-title-wrap">
                <span className="assigned-lead-badge">{selectedLead.leadId}</span>
                <h3>Lead Details</h3>
              </div>
              <button
                type="button"
                className="assigned-modal-close"
                onClick={() => setSelectedLead(null)}
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="assigned-modal-body">
              <div className="assigned-modal-grid">
                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Lead Name</span>
                  <span className="assigned-modal-val">
                    <strong>{formatName(selectedLead.lead)}</strong>
                  </span>
                </div>

                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Status</span>
                  <span className="assigned-modal-val">
                    <span className="assigned-pill status">{selectedLead.status}</span>
                  </span>
                </div>

                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Phone Number</span>
                  <span className="assigned-modal-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selectedLead.phone}
                    {selectedLead.phone && selectedLead.phone !== '—' && (
                      <button
                        type="button"
                        className={`assigned-copy-btn ${copiedId === 'modal' ? 'copied' : ''}`}
                        onClick={() => copyPhone(selectedLead.phone, 'modal')}
                        title="Copy phone"
                      >
                        {copiedId === 'modal' ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      </button>
                    )}
                  </span>
                </div>

                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Email Address</span>
                  <span className="assigned-modal-val">{selectedLead.email || '—'}</span>
                </div>

                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Assigned Telecaller</span>
                  <span className="assigned-modal-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="assigned-telecaller-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                      {getInitials(selectedLead.assignedTo)}
                    </span>
                    {formatName(selectedLead.assignedTo)}
                  </span>
                </div>

                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Lead Source</span>
                  <span className="assigned-modal-val">
                    <span className="assigned-pill source">{selectedLead.source}</span>
                  </span>
                </div>

                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Lead Type</span>
                  <span className="assigned-modal-val">
                    <span className="assigned-pill type">{selectedLead.type}</span>
                  </span>
                </div>

                <div className="assigned-modal-field">
                  <span className="assigned-modal-label">Assigned Date</span>
                  <span className="assigned-modal-val">{selectedLead.assignedDate}</span>
                </div>

                <div className="assigned-modal-field full-width">
                  <span className="assigned-modal-label">Remarks & Notes</span>
                  <div className="assigned-modal-remarks">
                    {selectedLead.note && selectedLead.note !== '—'
                      ? selectedLead.note
                      : 'No notes or remarks provided for this lead.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="assigned-modal-footer">
              <button
                type="button"
                className="assigned-modal-btn"
                onClick={() => setSelectedLead(null)}
              >
                Close
              </button>
              {selectedLead.phone && selectedLead.phone !== '—' && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="assigned-modal-btn primary"
                >
                  <FiPhone size={13} /> Call Now
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AssignedCalls;
