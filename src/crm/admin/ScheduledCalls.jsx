import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiPhone,
  FiCopy,
  FiCheck,
  FiEye,
  FiSearch,
  FiX,
  FiClock,
  FiAlertCircle,
  FiArrowUpRight,
  FiCheckCircle
} from 'react-icons/fi';
import axiosInstance from '../../utils/axiosConfig';
import './ScheduledCalls.css';

const EMPTY_CALLS = [];

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

const uniqueSorted = (values = []) => {
  const unique = new Map();
  values.forEach(value => {
    const label = String(value || '').trim();
    if (label) unique.set(label.toLowerCase(), label);
  });
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
};

const getRelativeSchedule = (dateStr) => {
  if (!dateStr || dateStr === '—') return { tag: '—', type: 'none', label: '—' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { tag: '—', type: 'none', label: '—' };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((targetDateOnly - todayStart) / (1000 * 60 * 60 * 24));

  const timeFormatted = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      tag: overdueDays === 1 ? 'Overdue 1d' : `Overdue ${overdueDays}d`,
      type: 'overdue',
      label: `${dateFormatted}, ${timeFormatted}`,
      time: timeFormatted
    };
  } else if (diffDays === 0) {
    return {
      tag: 'Today',
      type: 'today',
      label: `Today, ${timeFormatted}`,
      time: timeFormatted
    };
  } else if (diffDays === 1) {
    return {
      tag: 'Tomorrow',
      type: 'tomorrow',
      label: `Tomorrow, ${timeFormatted}`,
      time: timeFormatted
    };
  } else {
    return {
      tag: `In ${diffDays} days`,
      type: 'future',
      label: `${dateFormatted}, ${timeFormatted}`,
      time: timeFormatted
    };
  }
};

const getLocalDateString = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function ScheduledCalls({ calls = EMPTY_CALLS }) {
  const [fetchedCalls, setFetchedCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  // Filters & Search
  const [filters, setFilters] = useState({
    assignedTo: '',
    status: '',
    source: '',
    leadType: '',
    from: '',
    to: ''
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchScheduled = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/crm/admin/calls/scheduled', { _skipErrorNotify: true });
      if (Array.isArray(res.data?.items)) {
        const items = res.data.items.map((lead, idx) => ({
          id: lead._id || idx + 1,
          rawId: lead._id,
          leadId: lead._id ? `#LD-${String(lead._id).slice(-4).toUpperCase()}` : `#LD-${String(idx + 1).padStart(3, '0')}`,
          name: lead.name || 'Lead',
          phone: lead.phone || '—',
          email: lead.email || '',
          source: lead.leadSource?.name || lead.source || 'Direct',
          leadType: lead.leadType?.name || 'General',
          status: lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'Scheduled',
          scheduledRaw: lead.nextFollowUp,
          scheduledDate: lead.nextFollowUp ? getLocalDateString(lead.nextFollowUp) : '—',
          scheduleMeta: getRelativeSchedule(lead.nextFollowUp),
          assignedAge: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          createdRawDate: lead.createdAt,
          note: lead.remarks || lead.customField1 || lead.notes || '—',
          assignedTo: lead.assignedTo?.name || 'Unassigned',
          assignedRole: lead.assignedTo?.jobRole || lead.assignedTo?.role || 'Telecaller'
        }));
        setFetchedCalls(items);
      } else {
        setFetchedCalls([]);
      }
    } catch (err) {
      setFetchedCalls([]);
      setError(err.response?.data?.message || 'Failed to load scheduled calls.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const allCalls = useMemo(() => {
    return calls.length ? calls : fetchedCalls;
  }, [calls, fetchedCalls]);

  // Overall statistics for KPI cards
  const stats = useMemo(() => {
    const total = allCalls.length;
    let scheduledToday = 0;
    let upcoming = 0;
    let overdue = 0;

    allCalls.forEach(call => {
      const type = call.scheduleMeta?.type;
      if (type === 'today') scheduledToday++;
      else if (type === 'tomorrow' || type === 'future') upcoming++;
      else if (type === 'overdue') overdue++;
    });

    return { total, scheduledToday, upcoming, overdue };
  }, [allCalls]);

  // Dynamic filter dropdown options
  const availableAssignees = useMemo(
    () => uniqueSorted(allCalls.map(c => c.assignedTo).filter(v => v && v !== 'Unassigned')),
    [allCalls]
  );
  const availableSources = useMemo(() => uniqueSorted(allCalls.map(c => c.source).filter(Boolean)), [allCalls]);
  const availableTypes = useMemo(() => uniqueSorted(allCalls.map(c => c.leadType).filter(Boolean)), [allCalls]);
  const availableStatuses = useMemo(() => {
    const timingStatuses = ['Today', 'Upcoming', 'Overdue'];
    const leadStatuses = uniqueSorted(allCalls.map(c => c.status).filter(Boolean));
    return [...timingStatuses, ...leadStatuses.filter(s => !timingStatuses.some(t => t.toLowerCase() === s.toLowerCase()))];
  }, [allCalls]);

  // Apply filters and search
  const filteredCalls = useMemo(() => {
    return allCalls.filter(call => {
      // 1. Search Query
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [
        call.leadId,
        call.name,
        call.phone,
        call.email,
        call.source,
        call.leadType,
        call.assignedTo,
        call.note
      ].some(val => String(val || '').toLowerCase().includes(q));

      // 2. Form Filters
      const matchesAssignee = !appliedFilters.assignedTo || 
        String(call.assignedTo || '').trim().toLowerCase() === appliedFilters.assignedTo.trim().toLowerCase();

      // Date range filtering (by Scheduled Callback Date)
      let matchesDate = true;
      if (appliedFilters.from || appliedFilters.to) {
        const callLocalDate = call.scheduledDate && call.scheduledDate !== '—'
          ? call.scheduledDate
          : getLocalDateString(call.scheduledRaw);
        if (callLocalDate) {
          if (appliedFilters.from && callLocalDate < appliedFilters.from) matchesDate = false;
          if (appliedFilters.to && callLocalDate > appliedFilters.to) matchesDate = false;
        } else {
          matchesDate = false;
        }
      }

      // Schedule status match (Today, Upcoming, Overdue, Scheduled, or lead status)
      let matchesStatus = true;
      if (appliedFilters.status) {
        const filterVal = appliedFilters.status.trim().toLowerCase();
        const metaType = call.scheduleMeta?.type;
        if (filterVal === 'today') {
          matchesStatus = metaType === 'today';
        } else if (filterVal === 'upcoming') {
          matchesStatus = metaType === 'tomorrow' || metaType === 'future';
        } else if (filterVal === 'overdue') {
          matchesStatus = metaType === 'overdue';
        } else if (filterVal === 'scheduled') {
          matchesStatus = true;
        } else {
          matchesStatus = String(call.status || '').trim().toLowerCase() === filterVal;
        }
      }

      const matchesSource = !appliedFilters.source || 
        String(call.source || '').trim().toLowerCase() === appliedFilters.source.trim().toLowerCase();

      const matchesType = !appliedFilters.leadType || 
        String(call.leadType || '').trim().toLowerCase() === appliedFilters.leadType.trim().toLowerCase();

      return matchesSearch && matchesAssignee && matchesDate && matchesStatus && matchesSource && matchesType;
    });
  }, [allCalls, search, appliedFilters]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    return Object.values(appliedFilters).filter(Boolean).length;
  }, [appliedFilters]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / pageSize));
  const visibleCalls = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCalls.slice(start, start + pageSize);
  }, [filteredCalls, page, pageSize]);

  // Instant real-time filter update on select/input change
  const updateFilter = (key, value) => {
    setFilters(cur => {
      const next = { ...cur, [key]: value };
      setAppliedFilters(next);
      return next;
    });
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const resetFilters = () => {
    const blank = { assignedTo: '', status: '', source: '', leadType: '', from: '', to: '' };
    setFilters(blank);
    setAppliedFilters(blank);
    setSearch('');
    setPage(1);
  };

  const copyPhone = (phone, id) => {
    if (!phone || phone === '—') return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <main className="scheduled-calls-page">
      {/* Header & Breadcrumbs */}
      <header className="scheduled-calls-heading">
        <div className="scheduled-heading-left">
          <div className="scheduled-title-row">
            <h1>Scheduled Calls</h1>
            <span className="scheduled-title-badge">{allCalls.length} Callbacks</span>
          </div>
          <p className="scheduled-subtitle">
            Track and manage scheduled callbacks, upcoming follow-ups, and overdue client contacts.
          </p>
        </div>
        <nav className="scheduled-breadcrumb" aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight className="scheduled-crumb-sep" />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight className="scheduled-crumb-sep" />
          <span>Scheduled Calls</span>
        </nav>
      </header>

      {/* KPI Stats Row */}
      <section className="scheduled-stats-grid">
        <div className="scheduled-stat-card">
          <div className="scheduled-stat-info">
            <span className="scheduled-stat-lbl">Total Scheduled</span>
            <span className="scheduled-stat-val">{stats.total}</span>
          </div>
          <div className="scheduled-stat-icon indigo">
            <FiCalendar size={22} />
          </div>
        </div>

        <div className="scheduled-stat-card">
          <div className="scheduled-stat-info">
            <span className="scheduled-stat-lbl">Scheduled Today</span>
            <span className="scheduled-stat-val">{stats.scheduledToday}</span>
          </div>
          <div className="scheduled-stat-icon amber">
            <FiClock size={22} />
          </div>
        </div>

        <div className="scheduled-stat-card">
          <div className="scheduled-stat-info">
            <span className="scheduled-stat-lbl">Upcoming / Future</span>
            <span className="scheduled-stat-val">{stats.upcoming}</span>
          </div>
          <div className="scheduled-stat-icon emerald">
            <FiCheckCircle size={22} />
          </div>
        </div>

        <div className="scheduled-stat-card">
          <div className="scheduled-stat-info">
            <span className="scheduled-stat-lbl">Overdue Callbacks</span>
            <span className="scheduled-stat-val">{stats.overdue}</span>
          </div>
          <div className="scheduled-stat-icon rose">
            <FiAlertCircle size={22} />
          </div>
        </div>
      </section>

      {/* Filters Toolbar */}
      <section className="scheduled-filter-card">
        <div className="scheduled-filter-top">
          <div className="scheduled-filter-title">
            <FiFilter size={16} />
            <span>Filter Scheduled Callbacks</span>
            {activeFiltersCount > 0 && (
              <span className="scheduled-active-filter-badge">{activeFiltersCount} Active</span>
            )}
          </div>
        </div>

        <form
          className="scheduled-filter-grid"
          onSubmit={e => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <div className="scheduled-filter-field">
            <label htmlFor="filter-assigned-to">Assigned Telecaller</label>
            <select
              id="filter-assigned-to"
              value={filters.assignedTo}
              onChange={e => updateFilter('assignedTo', e.target.value)}
            >
              <option value="">All Telecallers</option>
              {availableAssignees.map(name => (
                <option key={name} value={name}>{formatName(name)}</option>
              ))}
            </select>
          </div>

          <div className="scheduled-filter-field">
            <label htmlFor="filter-status">Schedule Status</label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={e => updateFilter('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {availableStatuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="scheduled-filter-field">
            <label htmlFor="filter-source">Lead Source</label>
            <select
              id="filter-source"
              value={filters.source}
              onChange={e => updateFilter('source', e.target.value)}
            >
              <option value="">All Sources</option>
              {availableSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="scheduled-filter-field">
            <label htmlFor="filter-type">Lead Type</label>
            <select
              id="filter-type"
              value={filters.leadType}
              onChange={e => updateFilter('leadType', e.target.value)}
            >
              <option value="">All Types</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="scheduled-filter-field">
            <label htmlFor="filter-from">Date From</label>
            <input
              id="filter-from"
              type="date"
              value={filters.from}
              onChange={e => updateFilter('from', e.target.value)}
            />
          </div>

          <div className="scheduled-filter-field">
            <label htmlFor="filter-to">Date To</label>
            <input
              id="filter-to"
              type="date"
              value={filters.to}
              onChange={e => updateFilter('to', e.target.value)}
            />
          </div>

          <div className="scheduled-filter-actions">
            <button type="submit" className="scheduled-btn-apply">
              <FiFilter size={14} /> Apply
            </button>
            <button
              type="button"
              className="scheduled-btn-reset"
              onClick={resetFilters}
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>
        </form>
      </section>

      {/* Main Table Card */}
      <section className="scheduled-table-card">
        <header className="scheduled-table-card-header">
          <div className="scheduled-table-header-left">
            <h2 className="scheduled-table-title">Scheduled Callbacks Directory</h2>
            <span className="scheduled-counter-pill">
              {filteredCalls.length} {filteredCalls.length === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>

          <div className="scheduled-table-header-right">
            <div className="scheduled-page-size-wrap">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                aria-label="Entries per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="scheduled-search-box">
              <FiSearch size={14} className="scheduled-search-icon" />
              <input
                value={search}
                placeholder="Search lead, phone, caller..."
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button
                  type="button"
                  className="scheduled-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="scheduled-btn-refresh"
              onClick={fetchScheduled}
              disabled={loading}
              title="Refresh list"
            >
              <FiRefreshCw size={13} className={loading ? 'scheduled-spinner' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <div className="scheduled-table-scroll">
          <table className="scheduled-main-table">
            <thead>
              <tr>
                <th className="scheduled-td-sl">#</th>
                <th>Lead ID</th>
                <th>Lead Name</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Lead Type</th>
                <th>Status</th>
                <th>Scheduled For</th>
                <th>Created Date</th>
                <th>Assigned To</th>
                <th style={{ textAlign: 'center', width: '70px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleCalls.map((call, index) => {
                const meta = call.scheduleMeta || {};
                return (
                  <tr key={call.rawId || call.id || index}>
                    <td className="scheduled-td-sl">{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      <span className="scheduled-lead-badge">{call.leadId}</span>
                    </td>
                    <td>
                      <div className="scheduled-lead-info">
                        <span className="scheduled-lead-name" title={call.name}>
                          {formatName(call.name)}
                        </span>
                        {call.note && call.note !== '—' && (
                          <span className="scheduled-lead-note" title={call.note}>
                            {call.note}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="scheduled-phone-wrapper">
                        <span>{call.phone}</span>
                        {call.phone && call.phone !== '—' && (
                          <button
                            type="button"
                            className={`scheduled-copy-btn ${copiedId === call.id ? 'copied' : ''}`}
                            onClick={() => copyPhone(call.phone, call.id)}
                            title="Copy phone number"
                          >
                            {copiedId === call.id ? <FiCheck size={13} /> : <FiCopy size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="scheduled-pill source">{call.source || '—'}</span>
                    </td>
                    <td>
                      <span className="scheduled-pill type">{call.leadType || '—'}</span>
                    </td>
                    <td>
                      <span className={`scheduled-pill status ${meta.type || ''}`}>
                        {call.status}
                      </span>
                    </td>
                    <td>
                      <div className="scheduled-time-box">
                        <span className="scheduled-date-primary">
                          <FiCalendar size={13} />
                          {meta.label || call.scheduledDate}
                        </span>
                        {meta.tag && meta.tag !== '—' && (
                          <span className={`scheduled-relative-tag ${meta.type}`}>
                            {meta.tag}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {call.assignedAge}
                      </span>
                    </td>
                    <td>
                      <div className="scheduled-telecaller-box">
                        <span className="scheduled-telecaller-avatar">
                          {getInitials(call.assignedTo)}
                        </span>
                        <div className="scheduled-telecaller-meta">
                          <span className="scheduled-telecaller-name">
                            {formatName(call.assignedTo)}
                          </span>
                          <span className="scheduled-telecaller-role">
                            {call.assignedRole || 'Telecaller'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="scheduled-actions-cell">
                        <button
                          type="button"
                          className="scheduled-btn-view"
                          title={`View details of ${call.name}`}
                          aria-label={`View ${call.name}`}
                          onClick={() => setSelectedLead(call)}
                        >
                          <FiEye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <div className="scheduled-state-box">
              <FiRefreshCw size={26} className="scheduled-spinner" />
              <h3>Loading Scheduled Calls...</h3>
              <p>Fetching scheduled callbacks and upcoming reminders.</p>
            </div>
          )}

          {!loading && error && (
            <div className="scheduled-state-box" style={{ color: '#ef4444' }}>
              <FiAlertCircle size={26} />
              <h3>Could Not Load Calls</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && !visibleCalls.length && (
            <div className="scheduled-state-box">
              <FiCalendar size={32} style={{ color: '#94a3b8' }} />
              <h3>No Scheduled Calls Found</h3>
              <p>No upcoming callback reminders match your current search or filter criteria.</p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="scheduled-btn-apply"
                  style={{ marginTop: 12 }}
                  onClick={resetFilters}
                >
                  <FiRefreshCw size={13} /> Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <footer className="scheduled-table-footer">
          <span className="scheduled-showing-txt">
            Showing {filteredCalls.length ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, filteredCalls.length)} of {filteredCalls.length} entries
          </span>
          <div className="scheduled-pagination-btns">
            <button
              type="button"
              className="scheduled-pg-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First page"
            >
              «
            </button>
            <button
              type="button"
              className="scheduled-pg-btn"
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
                  <span key={`ellip-${idx}`} className="scheduled-pg-ellipsis">...</span>
                ) : (
                  <button
                    type="button"
                    className={`scheduled-pg-btn ${page === p ? 'active' : ''}`}
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
              className="scheduled-pg-btn"
              onClick={() => setPage(v => Math.min(totalPages, v + 1))}
              disabled={page === totalPages}
              title="Next page"
            >
              ›
            </button>
            <button
              type="button"
              className="scheduled-pg-btn"
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
        <div className="scheduled-modal-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="scheduled-modal" onClick={e => e.stopPropagation()}>
            <div className="scheduled-modal-header">
              <div className="scheduled-modal-title-wrap">
                <span className="scheduled-lead-badge">{selectedLead.leadId}</span>
                <h3>Scheduled Callback Details</h3>
              </div>
              <button
                type="button"
                className="scheduled-modal-close"
                onClick={() => setSelectedLead(null)}
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="scheduled-modal-body">
              <div className="scheduled-modal-grid">
                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Lead Name</span>
                  <span className="scheduled-modal-val">
                    <strong>{formatName(selectedLead.name)}</strong>
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Status</span>
                  <span className="scheduled-modal-val">
                    <span className={`scheduled-pill status ${selectedLead.scheduleMeta?.type || ''}`}>
                      {selectedLead.status}
                    </span>
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Phone Number</span>
                  <span className="scheduled-modal-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selectedLead.phone}
                    {selectedLead.phone && selectedLead.phone !== '—' && (
                      <button
                        type="button"
                        className={`scheduled-copy-btn ${copiedId === 'modal' ? 'copied' : ''}`}
                        onClick={() => copyPhone(selectedLead.phone, 'modal')}
                        title="Copy phone"
                      >
                        {copiedId === 'modal' ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      </button>
                    )}
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Email Address</span>
                  <span className="scheduled-modal-val">{selectedLead.email || '—'}</span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Scheduled Date & Time</span>
                  <span className="scheduled-modal-val" style={{ fontWeight: 600 }}>
                    {selectedLead.scheduleMeta?.label || selectedLead.scheduledDate}
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Schedule Indicator</span>
                  <span className="scheduled-modal-val">
                    <span className={`scheduled-relative-tag ${selectedLead.scheduleMeta?.type || 'future'}`}>
                      {selectedLead.scheduleMeta?.tag || 'Scheduled'}
                    </span>
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Assigned Telecaller</span>
                  <span className="scheduled-modal-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="scheduled-telecaller-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                      {getInitials(selectedLead.assignedTo)}
                    </span>
                    {formatName(selectedLead.assignedTo)}
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Lead Source</span>
                  <span className="scheduled-modal-val">
                    <span className="scheduled-pill source">{selectedLead.source || '—'}</span>
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Lead Type</span>
                  <span className="scheduled-modal-val">
                    <span className="scheduled-pill type">{selectedLead.leadType || '—'}</span>
                  </span>
                </div>

                <div className="scheduled-modal-field">
                  <span className="scheduled-modal-label">Lead Created</span>
                  <span className="scheduled-modal-val">{selectedLead.assignedAge}</span>
                </div>

                <div className="scheduled-modal-field full-width">
                  <span className="scheduled-modal-label">Remarks & Notes</span>
                  <div className="scheduled-modal-remarks">
                    {selectedLead.note && selectedLead.note !== '—'
                      ? selectedLead.note
                      : 'No specific notes recorded for this scheduled callback.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="scheduled-modal-footer">
              <button
                type="button"
                className="scheduled-modal-btn"
                onClick={() => setSelectedLead(null)}
              >
                Close
              </button>
              <Link
                to="/ciisUser/crm/admin/follow-ups"
                className="scheduled-modal-btn"
              >
                Follow-up Center <FiArrowUpRight size={13} />
              </Link>
              {selectedLead.phone && selectedLead.phone !== '—' && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="scheduled-modal-btn primary"
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
}
