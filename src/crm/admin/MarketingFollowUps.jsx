import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiSearch,
  FiCalendar
} from 'react-icons/fi';
import './MarketingFollowUps.css';

const INITIAL_FOLLOWUPS = [
  {
    id: 1,
    slNo: 1,
    leadId: '#LD-476',
    leadName: 'Aman Test 1',
    source: 'Self',
    sourceTone: 'purple',
    type: 'Marketing',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    followUpType: 'Visit, Lead',
    status: 'Pending',
    statusTone: 'pending',
    scheduled: '26 Aug, 2026 12:00 PM'
  }
];

const MarketingFollowUps = () => {
  const [followUpsData] = useState(INITIAL_FOLLOWUPS);

  // Filters State
  const [selectedAgent, setSelectedAgent] = useState('All Agents');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [selectedType, setSelectedType] = useState('All Types');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('2026-09-01');

  // Applied Filters State
  const [appliedAgent, setAppliedAgent] = useState('All Agents');
  const [appliedStatus, setAppliedStatus] = useState('All Status');
  const [appliedSource, setAppliedSource] = useState('All Sources');
  const [appliedType, setAppliedType] = useState('All Types');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-09-01');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyFilter = () => {
    setAppliedAgent(selectedAgent);
    setAppliedStatus(selectedStatus);
    setAppliedSource(selectedSource);
    setAppliedType(selectedType);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSelectedAgent('All Agents');
    setSelectedStatus('All Status');
    setSelectedSource('All Sources');
    setSelectedType('All Types');
    setDateFrom('');
    setDateTo('2026-09-01');

    setAppliedAgent('All Agents');
    setAppliedStatus('All Status');
    setAppliedSource('All Sources');
    setAppliedType('All Types');
    setAppliedDateFrom('');
    setAppliedDateTo('2026-09-01');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return followUpsData.filter(item => {
      if (appliedAgent !== 'All Agents' && item.agent !== appliedAgent) return false;
      if (appliedStatus !== 'All Status' && item.status !== appliedStatus) return false;
      if (appliedSource !== 'All Sources' && item.source !== appliedSource) return false;
      if (appliedType !== 'All Types' && item.type !== appliedType) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchLeadId = item.leadId.toLowerCase().includes(query);
        const matchName = item.leadName.toLowerCase().includes(query);
        const matchAgent = item.agent.toLowerCase().includes(query);
        if (!matchLeadId && !matchName && !matchAgent) return false;
      }
      return true;
    });
  }, [followUpsData, appliedAgent, appliedStatus, appliedSource, appliedType, searchQuery]);

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = filteredData.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="mfu-root">
      {/* Top Header & Breadcrumb */}
      <div className="mfu-header">
        <div className="mfu-title-area">
          <h1>Marketing Follow-Ups</h1>
        </div>
        <nav className="mfu-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <FiChevronRight className="crumb-arrow" />
          <Link to="/ciisUser/crm/marketing/overview">Marketing Management</Link>
          <FiChevronRight className="crumb-arrow" />
          <span className="crumb-active">Marketing Follow-Ups</span>
        </nav>
      </div>

      {/* Filter Card */}
      <div className="mfu-card mfu-filter-card">
        <div className="mfu-filter-grid">
          <div className="mfu-field">
            <label>Marketing Agent</label>
            <select
              className="mfu-select"
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
            >
              <option value="All Agents">All Agents</option>
              <option value="Marketing Exec1">Marketing Exec1</option>
              <option value="Marketing Exec2">Marketing Exec2</option>
              <option value="Marketing Exec3">Marketing Exec3</option>
            </select>
          </div>

          <div className="mfu-field">
            <label>Status</label>
            <select
              className="mfu-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="mfu-field">
            <label>Lead Source</label>
            <select
              className="mfu-select"
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
            >
              <option value="All Sources">All Sources</option>
              <option value="Self">Self</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Facebook">Facebook</option>
              <option value="School Visit">School Visit</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>

          <div className="mfu-field">
            <label>Lead Type</label>
            <select
              className="mfu-select"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="Marketing">Marketing</option>
              <option value="CUET">CUET</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="Foundation">Foundation</option>
            </select>
          </div>

          <div className="mfu-field">
            <label>Date From</label>
            <input
              type="date"
              className="mfu-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>

          <div className="mfu-field">
            <label>Date To</label>
            <input
              type="date"
              className="mfu-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="mfu-filter-actions">
          <button className="mfu-btn-filter" onClick={handleApplyFilter} title="Apply Filters">
            <FiFilter />
          </button>
          <button className="mfu-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <FiRotateCcw />
          </button>
        </div>
      </div>

      {/* Follow-Ups Table Card */}
      <div className="mfu-card">
        <div className="mfu-card-header flex-between">
          <h2 className="mfu-section-title">Marketing Follow-Ups</h2>
          <span className="mfu-pill-badge pill-purple">{filteredData.length} Records</span>
        </div>

        {/* Controls Row */}
        <div className="mfu-controls-row">
          <div className="mfu-entries-select">
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

          <div className="mfu-search-box">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search lead or agent..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mfu-table-responsive">
          <table className="mfu-table">
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>LEAD ID</th>
                <th>LEAD</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>AGENT</th>
                <th>FOLLOW-UP TYPE</th>
                <th>STATUS</th>
                <th>SCHEDULED</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.length > 0 ? (
                currentEntries.map((item, index) => (
                  <tr key={item.id}>
                    <td>{startIndex + index + 1}</td>
                    <td className="mfu-lead-id">{item.leadId}</td>
                    <td className="mfu-font-medium">{item.leadName}</td>
                    <td>
                      <span className={`mfu-chip chip-${item.sourceTone}`}>{item.source}</span>
                    </td>
                    <td>
                      <span className={`mfu-chip chip-${item.typeTone}`}>{item.type}</span>
                    </td>
                    <td>{item.agent}</td>
                    <td>{item.followUpType}</td>
                    <td>
                      <span className={`mfu-status-chip status-${item.statusTone}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="mfu-date-cell">{item.scheduled}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="mfu-empty-cell">
                    No Marketing follow-ups found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Row */}
        <div className="mfu-pagination-row">
          <div className="mfu-showing-text">
            {totalEntries > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + entriesPerPage, totalEntries)} of ${totalEntries} entry`
              : 'Showing 0 to 0 of 0 entries'}
          </div>
          <div className="mfu-pagination">
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

export default MarketingFollowUps;
