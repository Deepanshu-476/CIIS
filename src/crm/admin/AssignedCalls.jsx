import React, { useEffect, useState, useCallback } from 'react';
import { FiCalendar, FiEye, FiFilter, FiRefreshCw, FiSearch } from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './AssignedCalls.css';

const AssignedCalls = () => {
  const [options, setOptions] = useState({ telecallers: [], sources: [], leadTypes: [] });
  const [filters, setFilters] = useState({ assignedTo: '', source: '', type: '', from: '', to: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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

  // Fetch assigned calls from API
  const fetchAssignedCalls = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      assignedTo: appliedFilters.assignedTo || undefined,
      source: appliedFilters.source || undefined,
      type: appliedFilters.type || undefined,
      from: appliedFilters.from || undefined,
      to: appliedFilters.to || undefined
    };

    api.get('/crm/admin/calls/assigned', { params, cache: false })
      .then(res => {
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load assigned calls:', err);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [page, pageSize, appliedFilters, search]);

  useEffect(() => {
    fetchAssignedCalls();
  }, [fetchAssignedCalls]);

  const updateFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const applyFilters = () => { setAppliedFilters(filters); setPage(1); };
  const resetFilters = () => {
    const next = { assignedTo: '', source: '', type: '', from: '', to: '' };
    setFilters(next);
    setAppliedFilters(next);
    setSearch('');
    setPage(1);
  };

  return (
    <main className="assigned-calls-page">
      <div className="assigned-calls-heading">
        <div><span>CRM / Call Management</span><h1>Assigned Calls</h1></div>
        <nav>Dashboard <b>›</b> Call Management <b>›</b> Assigned Calls</nav>
      </div>

      <section className="assigned-calls-filters">
        <label>
          Assigned To
          <select value={filters.assignedTo} onChange={event => updateFilter('assignedTo', event.target.value)}>
            <option value="">All Users</option>
            {options.telecallers.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select value={filters.source} onChange={event => updateFilter('source', event.target.value)}>
            <option value="">Select Lead Source</option>
            {options.sources.map(s => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          Lead Type
          <select value={filters.type} onChange={event => updateFilter('type', event.target.value)}>
            <option value="">Select Lead Type</option>
            {options.leadTypes.map(t => (
              <option key={t._id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </label>
        <label>
          Date From
          <div className="assigned-date-input">
            <input type="date" value={filters.from} onChange={event => updateFilter('from', event.target.value)} />
            <FiCalendar />
          </div>
        </label>
        <label>
          Date To
          <div className="assigned-date-input">
            <input type="date" value={filters.to} onChange={event => updateFilter('to', event.target.value)} />
            <FiCalendar />
          </div>
        </label>
        <div className="assigned-filter-actions">
          <button type="button" className="apply" onClick={applyFilters}><FiFilter /> Apply</button>
          <button type="button" className="reset" onClick={resetFilters} aria-label="Reset filters"><FiRefreshCw /></button>
        </div>
      </section>

      <section className="assigned-calls-card">
        <header><h2>Assigned Calls</h2></header>
        <div className="assigned-table-tools">
          <span>
            <select
              aria-label="Entries per page"
              value={pageSize}
              onChange={event => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select> entries per page
          </span>
          <label>
            Search:
            <div>
              <FiSearch />
              <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search leads..." />
            </div>
          </label>
        </div>
        <div className="assigned-table-wrap">
          <table>
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>LEAD ID</th>
                <th>LEAD</th>
                <th>PHONE</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>ASSIGNED TO</th>
                <th>ASSIGNED DATE</th>
                <th>ASSIGNED AGE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="assigned-no-data">Loading assigned calls...</td></tr>
              ) : items.length > 0 ? (
                items.map((call, index) => (
                  <tr key={call.leadMongoId || index}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{call.leadId}</td>
                    <td><strong>{call.lead}</strong><small>{call.note}</small></td>
                    <td>{call.phone}</td>
                    <td><span className="assigned-badge source">{call.source}</span></td>
                    <td><span className="assigned-badge type">{call.type}</span></td>
                    <td><span className="assigned-badge status">{call.status}</span></td>
                    <td><span className="assigned-badge person">♙ {call.assignedTo} <small>(Telecaller)</small></span></td>
                    <td><span className="assigned-badge date"><FiCalendar /> {call.assignedDate}</span></td>
                    <td className="assigned-age">{call.age}</td>
                    <td>
                      <button type="button" className="assigned-view" aria-label={`View ${call.lead}`}>
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={11} className="assigned-no-data">No assigned calls found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer>
          <span>Showing {total ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} entries</span>
          <div>
            <button type="button" onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.max(1, totalPages) }, (_, index) => index + 1)
              .filter(p => totalPages <= 7 || Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && p - arr[idx - 1] > 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                  <button
                    type="button"
                    className={page === p ? 'active' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button type="button" onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page === totalPages}>›</button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default AssignedCalls;
