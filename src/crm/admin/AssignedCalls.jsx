import React, { useMemo, useState } from 'react';
import { FiCalendar, FiEye, FiFilter, FiRefreshCw, FiSearch } from 'react-icons/fi';
import './AssignedCalls.css';

const calls = [
  ['#LD-008', 'Ashok Pillai', 'Student inquiry', '8016315999', 'Facebook', 'NEET'],
  ['#LD-009', 'Komal Wadhwa', 'Student inquiry', '9598564205', 'Facebook', 'NEET'],
  ['#LD-010', 'Rekha Kapoor', 'Ready to enroll', '9887676772', 'Facebook', 'NEET'],
  ['#LD-011', 'Sanjay Chauhan', 'WhatsApp inquiry', '7164334722', 'Facebook', 'NEET'],
  ['#LD-012', 'Meena Rajan', 'Student inquiry', '8936899809', 'Facebook', 'NEET'],
  ['#LD-013', 'Priya Gandhi', 'WhatsApp inquiry', '7350488899', 'Facebook', 'NEET'],
  ['#LD-039', 'Divya Qureshi', 'WhatsApp inquiry', '8026542351', 'Instagram', 'JEE'],
  ['#LD-040', 'Sneha Hegde', 'Needs study material', '9662702895', 'Instagram', 'JEE'],
  ['#LD-041', 'Queenie Bansal', 'Interested in CAT', '7149587020', 'Instagram', 'JEE'],
  ['#LD-042', 'Manoj Saxena', 'Interested in JEE', '6937452991', 'Instagram', 'JEE'],
  ['#LD-043', 'Nisha Sharma', 'Requested callback', '9876543210', 'Referral', 'CAT'],
].map((row, index) => ({
  id: index + 1, leadId: row[0], lead: row[1], note: row[2], phone: row[3], source: row[4], type: row[5],
  status: 'Assigned', assignedTo: 'Telecaller 1', assignedDate: '22 Aug 2026', age: '1 week ago',
}));

const AssignedCalls = () => {
  const [filters, setFilters] = useState({ assignedTo: '', source: '', type: '', from: '', to: '2026-09-01' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredCalls = useMemo(() => calls.filter(call => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [call.leadId, call.lead, call.phone, call.source, call.type, call.assignedTo].some(value => String(value).toLowerCase().includes(query));
    return matchesSearch
      && (!appliedFilters.assignedTo || call.assignedTo === appliedFilters.assignedTo)
      && (!appliedFilters.source || call.source === appliedFilters.source)
      && (!appliedFilters.type || call.type === appliedFilters.type);
  }), [appliedFilters, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / pageSize));
  const visibleCalls = filteredCalls.slice((page - 1) * pageSize, page * pageSize);
  const updateFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const applyFilters = () => { setAppliedFilters(filters); setPage(1); };
  const resetFilters = () => {
    const next = { assignedTo: '', source: '', type: '', from: '', to: '2026-09-01' };
    setFilters(next); setAppliedFilters(next); setSearch(''); setPage(1);
  };

  return (
    <main className="assigned-calls-page">
      <div className="assigned-calls-heading">
        <div><span>CRM / Call Management</span><h1>Assigned Calls</h1></div>
        <nav>Dashboard <b>›</b> Call Management <b>›</b> Assigned Calls</nav>
      </div>

      <section className="assigned-calls-filters">
        <label>Assigned To<select value={filters.assignedTo} onChange={event => updateFilter('assignedTo', event.target.value)}><option value="">All Users</option><option>Telecaller 1</option></select></label>
        <label>Source<select value={filters.source} onChange={event => updateFilter('source', event.target.value)}><option value="">Select Lead Source</option><option>Facebook</option><option>Instagram</option><option>Referral</option></select></label>
        <label>Lead Type<select value={filters.type} onChange={event => updateFilter('type', event.target.value)}><option value="">Select Lead Type</option><option>NEET</option><option>JEE</option><option>CAT</option></select></label>
        <label>Date From<div className="assigned-date-input"><input type="date" value={filters.from} onChange={event => updateFilter('from', event.target.value)} /><FiCalendar /></div></label>
        <label>Date To<div className="assigned-date-input"><input type="date" value={filters.to} onChange={event => updateFilter('to', event.target.value)} /><FiCalendar /></div></label>
        <div className="assigned-filter-actions"><button type="button" className="apply" onClick={applyFilters}><FiFilter /> Apply</button><button type="button" className="reset" onClick={resetFilters} aria-label="Reset filters"><FiRefreshCw /></button></div>
      </section>

      <section className="assigned-calls-card">
        <header><h2>Assigned Calls</h2></header>
        <div className="assigned-table-tools"><span><select aria-label="Entries per page"><option>10</option></select> entries per page</span><label>Search:<div><FiSearch /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div></label></div>
        <div className="assigned-table-wrap">
          <table>
            <thead><tr><th>SL NO.</th><th>LEAD ID</th><th>LEAD</th><th>PHONE</th><th>SOURCE</th><th>TYPE</th><th>STATUS</th><th>ASSIGNED TO</th><th>ASSIGNED DATE</th><th>ASSIGNED AGE</th><th>ACTION</th></tr></thead>
            <tbody>{visibleCalls.map((call, index) => <tr key={call.leadId}>
              <td>{(page - 1) * pageSize + index + 1}</td><td>{call.leadId}</td><td><strong>{call.lead}</strong><small>{call.note}</small></td><td>{call.phone}</td>
              <td><span className="assigned-badge source">{call.source}</span></td><td><span className="assigned-badge type">{call.type}</span></td><td><span className="assigned-badge status">{call.status}</span></td>
              <td><span className="assigned-badge person">♙ {call.assignedTo} <small>(Telecaller)</small></span></td><td><span className="assigned-badge date"><FiCalendar /> {call.assignedDate}</span></td><td className="assigned-age">{call.age}</td><td><button type="button" className="assigned-view" aria-label={`View ${call.lead}`}><FiEye /></button></td>
            </tr>)}</tbody>
          </table>
          {!visibleCalls.length && <div className="assigned-no-data">No assigned calls found.</div>}
        </div>
        <footer><span>Showing {filteredCalls.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredCalls.length)} of {filteredCalls.length} entries</span><div><button type="button" onClick={() => setPage(1)} disabled={page === 1}>«</button><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1}>‹</button>{Array.from({ length: totalPages }, (_, index) => <button type="button" className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)} key={index + 1}>{index + 1}</button>)}<button type="button" onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page === totalPages}>›</button><button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button></div></footer>
      </section>
    </main>
  );
};

export default AssignedCalls;
