import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiChevronRight, FiFilter, FiRefreshCw } from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './ScheduledCalls.css';

const defaultFilters = () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return { assignedTo: '', date, status: '', source: '', leadType: '' };
};

const columns = ['Sl No.', 'Lead', 'Name', 'Phone', 'Source', 'Lead Type', 'Status', 'Last Call', 'Scheduled Date', 'Assigned Age', 'Attempts', 'Assigned To', 'Action'];

export default function ScheduledCalls() {
  const [options, setOptions] = useState({ telecallers: [], sources: [], leadTypes: [] });
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
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

  // Fetch scheduled calls from API
  const fetchScheduledCalls = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: entriesPerPage,
      date: appliedFilters.date || undefined,
      assignedTo: appliedFilters.assignedTo || undefined,
      status: appliedFilters.status || undefined,
      source: appliedFilters.source || undefined,
      leadType: appliedFilters.leadType || undefined
    };

    api.get('/crm/admin/calls/scheduled', { params, cache: false })
      .then(res => {
        setCalls(res.data?.calls || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load scheduled calls:', err);
        setCalls([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [currentPage, entriesPerPage, appliedFilters]);

  useEffect(() => {
    fetchScheduledCalls();
  }, [fetchScheduledCalls]);

  const updateFilter = event => {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    const next = defaultFilters();
    setFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
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

      <form
        className="scheduled-calls-filters"
        aria-label="Filter scheduled calls"
        onSubmit={event => {
          event.preventDefault();
          setAppliedFilters({ ...filters });
          setCurrentPage(1);
        }}
      >
        <label className="scheduled-calls-field">
          <span>Assigned To</span>
          <select name="assignedTo" value={filters.assignedTo} onChange={updateFilter}>
            <option value="">All Users</option>
            {options.telecallers.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
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
            <option value="Scheduled">Scheduled</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </label>

        <label className="scheduled-calls-field">
          <span>Lead Source</span>
          <select name="source" value={filters.source} onChange={updateFilter}>
            <option value="">All Sources</option>
            {options.sources.map(s => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="scheduled-calls-field">
          <span>Lead Type</span>
          <select name="leadType" value={filters.leadType} onChange={updateFilter}>
            <option value="">All Types</option>
            {options.leadTypes.map(t => (
              <option key={t._id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </label>

        <div className="scheduled-calls-filter-actions">
          <button className="scheduled-calls-apply" type="submit">
            <FiFilter aria-hidden="true" /> Apply
          </button>
          <button
            className="scheduled-calls-reset"
            type="button"
            onClick={resetFilters}
            title="Reset filters"
            aria-label="Reset filters"
          >
            <FiRefreshCw aria-hidden="true" />
          </button>
        </div>
      </form>

      <section className="scheduled-calls-card" aria-labelledby="scheduled-callbacks-title">
        <div className="scheduled-calls-card-header">
          <h2 id="scheduled-callbacks-title">Scheduled Callbacks</h2>
          <div className="scheduled-calls-tools">
            <select
              aria-label="Entries per page"
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
        <div className="scheduled-calls-table-scroll">
          <table className="scheduled-calls-table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th scope="col" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="scheduled-calls-empty">
                    <p>Loading scheduled calls...</p>
                  </td>
                </tr>
              ) : calls.length > 0 ? (
                calls.map((call, index) => (
                  <tr key={call.leadMongoId || call.id || index}>
                    <td>{(currentPage - 1) * entriesPerPage + index + 1}</td>
                    <td>{call.lead || '—'}</td>
                    <td>{call.name || '—'}</td>
                    <td>{call.phone || '—'}</td>
                    <td>{call.source || '—'}</td>
                    <td>{call.leadType || '—'}</td>
                    <td>{call.status || '—'}</td>
                    <td>{call.lastCall || '—'}</td>
                    <td>{call.scheduledDate || '—'}</td>
                    <td>{call.assignedAge || '—'}</td>
                    <td>{call.attempts ?? 0}</td>
                    <td>{call.assignedTo || '—'}</td>
                    <td>
                      <Link to="/ciisUser/crm/admin/follow-ups">Follow up</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="scheduled-calls-empty">
                    <div role="status">
                      <FiCalendar aria-hidden="true" />
                      <strong>No Scheduled Calls</strong>
                      <p>No upcoming follow-up calls are scheduled for this date.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="scheduled-calls-footer">
          <span>Showing {total ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, total)} of {total} entries</span>
          <div className="scheduled-calls-pagination">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="scheduled-calls-page-btn"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(value => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="scheduled-calls-page-btn"
            >
              ‹
            </button>
            {Array.from({ length: Math.max(1, totalPages) }, (_, index) => index + 1)
              .filter(p => totalPages <= 7 || Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && p - arr[idx - 1] > 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                  <button
                    type="button"
                    className={`scheduled-calls-page-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              type="button"
              onClick={() => setCurrentPage(value => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="scheduled-calls-page-btn"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="scheduled-calls-page-btn"
            >
              »
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
