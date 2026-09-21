import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiChevronRight, FiFilter, FiRefreshCw } from 'react-icons/fi';
import axiosInstance from '../../utils/axiosConfig';
import './ScheduledCalls.css';

const EMPTY_CALLS = [];
const defaultFilters = () => {
  return { assignedTo: '', date: '', status: '', source: '', leadType: '' };
};
const columns = ['Sl No.', 'Lead', 'Name', 'Phone', 'Source', 'Lead Type', 'Status', 'Last Call', 'Scheduled Date', 'Assigned Age', 'Attempts', 'Assigned To', 'Action'];

export default function ScheduledCalls({ calls = EMPTY_CALLS }) {
  const [fetchedCalls, setFetchedCalls] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    let isMounted = true;
    const fetchScheduled = async () => {
      try {
        const res = await axiosInstance.get('/crm/admin/calls/scheduled', { _skipErrorNotify: true });
        if (isMounted && res.data && Array.isArray(res.data.items)) {
          const items = res.data.items.map((lead, idx) => ({
            id: lead._id || idx + 1,
            lead: `#LD-${String(lead._id).slice(-3)}`,
            name: lead.name || 'Lead',
            phone: lead.phone || '—',
            source: lead.leadSource?.name || lead.source || 'Direct',
            leadType: lead.leadType?.name || 'General',
            status: lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'Scheduled',
            lastCall: 'Never Called',
            scheduledDate: lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().slice(0, 10) : '—',
            assignedAge: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—',
            attempts: 0,
            assignedTo: lead.assignedTo?.name || 'Unassigned'
          }));
          setFetchedCalls(items);
        }
      } catch {
        // Keep the supplied/empty call list when the live request is unavailable.
      }
    };
    fetchScheduled();
    return () => { isMounted = false; };
  }, []);

  const allCalls = calls.length ? calls : fetchedCalls;
  const updateFilter = event => setFilters(current => ({ ...current, [event.target.name]: event.target.value }));
  const visibleCalls = useMemo(() => allCalls.filter(call => (
    (!appliedFilters.assignedTo || call.assignedTo === appliedFilters.assignedTo) &&
    (!appliedFilters.date || String(call.scheduledDate || '').slice(0, 10) === appliedFilters.date) &&
    (!appliedFilters.status || call.status === appliedFilters.status) &&
    (!appliedFilters.source || call.source === appliedFilters.source) &&
    (!appliedFilters.leadType || call.leadType === appliedFilters.leadType)
  )), [allCalls, appliedFilters]);
  const optionsFor = key => [...new Set(allCalls.map(call => call[key]).filter(Boolean))];
  const resetFilters = () => {
    const next = defaultFilters();
    setFilters(next);
    setAppliedFilters(next);
  };

  return (
    <main className="scheduled-calls-page">
      <header className="scheduled-calls-header">
        <h1>Scheduled Calls</h1>
        <nav aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight aria-hidden="true" />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight aria-hidden="true" />
          <span aria-current="page">Scheduled Calls</span>
        </nav>
      </header>
      <form className="scheduled-calls-filters" aria-label="Filter scheduled calls" onSubmit={event => {
        event.preventDefault();
        setAppliedFilters({ ...filters });
      }}>
        <label className="scheduled-calls-field">
          <span>Assigned To</span>
          <select name="assignedTo" value={filters.assignedTo} onChange={updateFilter}>
            <option value="">All Users</option>
            {optionsFor('assignedTo').map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="scheduled-calls-field">
          <span>Schedule Date</span>
          <input type="date" name="date" value={filters.date} onChange={updateFilter} />
        </label>
        <label className="scheduled-calls-field">
          <span>Schedule Status</span>
          <select name="status" value={filters.status} onChange={updateFilter}>
            <option value="">All</option>
            {[...new Set(['Scheduled', 'Pending', 'Completed', ...optionsFor('status')])].map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="scheduled-calls-field">
          <span>Lead Source</span>
          <select name="source" value={filters.source} onChange={updateFilter}>
            <option value="">All Sources</option>
            {optionsFor('source').map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="scheduled-calls-field">
          <span>Lead Type</span>
          <select name="leadType" value={filters.leadType} onChange={updateFilter}>
            <option value="">All Types</option>
            {optionsFor('leadType').map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
        <div className="scheduled-calls-filter-actions">
          <button className="scheduled-calls-apply" type="submit"><FiFilter aria-hidden="true" /> Apply</button>
          <button className="scheduled-calls-reset" type="button" onClick={resetFilters} title="Reset filters" aria-label="Reset filters"><FiRefreshCw aria-hidden="true" /></button>
        </div>
      </form>
      <section className="scheduled-calls-card" aria-labelledby="scheduled-callbacks-title">
        <h2 id="scheduled-callbacks-title">Scheduled Callbacks</h2>
        <div className="scheduled-calls-table-scroll">
          <table className="scheduled-calls-table">
            <thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {visibleCalls.map((call, index) => (
                <tr key={call.id || call._id || index}>
                  <td>{index + 1}</td><td>{call.lead || '—'}</td><td>{call.name || '—'}</td>
                  <td>{call.phone || '—'}</td><td>{call.source || '—'}</td><td>{call.leadType || '—'}</td>
                  <td>{call.status || '—'}</td><td>{call.lastCall || '—'}</td><td>{call.scheduledDate || '—'}</td>
                  <td>{call.assignedAge || '—'}</td><td>{call.attempts ?? 0}</td><td>{call.assignedTo || '—'}</td>
                  <td><Link to="/ciisUser/crm/admin/follow-ups">Follow up</Link></td>
                </tr>
              ))}
              {!visibleCalls.length && (
                <tr><td colSpan={columns.length} className="scheduled-calls-empty">
                  <div role="status">
                    <FiCalendar aria-hidden="true" />
                    <strong>No Scheduled Calls</strong>
                    <p>No upcoming follow-up calls are scheduled.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
