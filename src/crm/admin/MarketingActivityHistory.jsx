import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw
} from 'react-icons/fi';
import './MarketingActivityHistory.css';

const INITIAL_ACTIVITIES = [
  {
    id: 1,
    slNo: 1,
    leadId: '#LD-183',
    leadName: 'Parth Gupta',
    source: 'Google Ads',
    sourceTone: 'purple',
    type: 'CUET',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    activity: 'Visit Scheduled',
    outcome: 'Visit Scheduled',
    outcomeTone: 'blue',
    date: '26 Aug, 2026 04:01 PM'
  },
  {
    id: 2,
    slNo: 2,
    leadId: '#LD-476',
    leadName: 'Aman Test 1',
    source: 'Self',
    sourceTone: 'purple',
    type: 'Marketing',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    activity: 'Visit Outcome',
    outcome: 'Interested',
    outcomeTone: 'cyan',
    date: '26 Aug, 2026 03:30 PM'
  },
  {
    id: 3,
    slNo: 3,
    leadId: '#LD-476',
    leadName: 'Aman Test 1',
    source: 'Self',
    sourceTone: 'purple',
    type: 'Marketing',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    activity: 'Visit Scheduled',
    outcome: 'Visit Scheduled',
    outcomeTone: 'blue',
    date: '26 Aug, 2026 03:29 PM'
  }
];

const MarketingActivityHistory = () => {
  const [activitiesData] = useState(INITIAL_ACTIVITIES);

  // Filters State
  const [selectedAgent, setSelectedAgent] = useState('All Agents');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('2026-09-01');

  // Applied Filters State
  const [appliedAgent, setAppliedAgent] = useState('All Agents');
  const [appliedOutcome, setAppliedOutcome] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-09-01');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyFilter = () => {
    setAppliedAgent(selectedAgent);
    setAppliedOutcome(outcomeFilter);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSelectedAgent('All Agents');
    setOutcomeFilter('');
    setDateFrom('');
    setDateTo('2026-09-01');

    setAppliedAgent('All Agents');
    setAppliedOutcome('');
    setAppliedDateFrom('');
    setAppliedDateTo('2026-09-01');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return activitiesData.filter(item => {
      if (appliedAgent !== 'All Agents' && item.agent !== appliedAgent) return false;
      if (appliedOutcome.trim() !== '' && !item.outcome.toLowerCase().includes(appliedOutcome.toLowerCase())) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchLeadId = item.leadId.toLowerCase().includes(query);
        const matchName = item.leadName.toLowerCase().includes(query);
        const matchActivity = item.activity.toLowerCase().includes(query);
        const matchAgent = item.agent.toLowerCase().includes(query);
        if (!matchLeadId && !matchName && !matchActivity && !matchAgent) return false;
      }
      return true;
    });
  }, [activitiesData, appliedAgent, appliedOutcome, searchQuery]);

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = filteredData.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="mah-root">
      {/* Top Header & Breadcrumb */}
      <div className="mah-header">
        <div className="mah-title-area">
          <h1>Marketing Activity History</h1>
        </div>
        <nav className="mah-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <FiChevronRight className="crumb-arrow" />
          <Link to="/ciisUser/crm/marketing/overview">Marketing Management</Link>
          <FiChevronRight className="crumb-arrow" />
          <span className="crumb-active">Marketing Activity History</span>
        </nav>
      </div>

      {/* Filter Card */}
      <div className="mah-card mah-filter-card">
        <div className="mah-filter-grid">
          <div className="mah-field">
            <label>Marketing Agent</label>
            <select
              className="mah-select"
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
            >
              <option value="All Agents">All Agents</option>
              <option value="Marketing Exec1">Marketing Exec1</option>
              <option value="Marketing Exec2">Marketing Exec2</option>
              <option value="Marketing Exec3">Marketing Exec3</option>
            </select>
          </div>

          <div className="mah-field">
            <label>Outcome</label>
            <input
              type="text"
              placeholder="Search outcome"
              className="mah-input"
              value={outcomeFilter}
              onChange={e => setOutcomeFilter(e.target.value)}
            />
          </div>

          <div className="mah-field">
            <label>Date From</label>
            <input
              type="date"
              className="mah-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>

          <div className="mah-field">
            <label>Date To</label>
            <input
              type="date"
              className="mah-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>

          <div className="mah-filter-actions">
            <button className="mah-btn-filter" onClick={handleApplyFilter} title="Apply Filters">
              <FiFilter />
            </button>
            <button className="mah-btn-reset" onClick={handleResetFilter} title="Reset Filters">
              <FiRotateCcw />
            </button>
          </div>
        </div>
      </div>

      {/* Marketing Activity History Table Card */}
      <div className="mah-card">
        <div className="mah-card-header flex-between">
          <h2 className="mah-section-title">Marketing Activity History</h2>
          <span className="mah-pill-badge pill-purple">{filteredData.length} Records</span>
        </div>

        {/* Controls Row */}
        <div className="mah-controls-row">
          <div className="mah-entries-select">
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

          <div className="mah-search-box">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mah-table-responsive">
          <table className="mah-table">
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>LEAD ID</th>
                <th>LEAD</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>AGENT</th>
                <th>ACTIVITY</th>
                <th>OUTCOME</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.length > 0 ? (
                currentEntries.map((item, index) => (
                  <tr key={item.id}>
                    <td>{startIndex + index + 1}</td>
                    <td className="mah-lead-id">{item.leadId}</td>
                    <td className="mah-font-medium">{item.leadName}</td>
                    <td>
                      <span className={`mah-chip chip-${item.sourceTone}`}>{item.source}</span>
                    </td>
                    <td>
                      <span className={`mah-chip chip-${item.typeTone}`}>{item.type}</span>
                    </td>
                    <td>{item.agent}</td>
                    <td>{item.activity}</td>
                    <td>
                      <span className={`mah-outcome-badge outcome-${item.outcomeTone}`}>
                        {item.outcome}
                      </span>
                    </td>
                    <td className="mah-date-cell">{item.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="mah-empty-cell">
                    No Marketing activity history records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Row */}
        <div className="mah-pagination-row">
          <div className="mah-showing-text">
            {totalEntries > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + entriesPerPage, totalEntries)} of ${totalEntries} entries`
              : 'Showing 0 to 0 of 0 entries'}
          </div>
          <div className="mah-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              &lt;
            </button>
            <button className="active">{currentPage}</button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              &gt;
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingActivityHistory;
