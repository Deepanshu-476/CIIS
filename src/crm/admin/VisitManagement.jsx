import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw
} from 'react-icons/fi';
import './VisitManagement.css';

const INITIAL_VISITS = [
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
    visitDate: '26 Aug, 2026 06:29 PM',
    status: 'In Progress',
    statusTone: 'in-progress',
    outcome: 'Interested',
    outcomeTone: 'interested'
  },
  {
    id: 2,
    slNo: 2,
    leadId: '#LD-183',
    leadName: 'Parth Gupta',
    source: 'Google Ads',
    sourceTone: 'purple',
    type: 'CUET',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    visitDate: '26 Aug, 2026 06:01 PM',
    status: 'Planned',
    statusTone: 'planned',
    outcome: '-',
    outcomeTone: 'none'
  }
];

const VisitManagement = () => {
  const [visitsData] = useState(INITIAL_VISITS);

  // Filters State
  const [selectedAgent, setSelectedAgent] = useState('All Agents');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedOutcome, setSelectedOutcome] = useState('All Outcomes');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('2026-09-01');

  // Applied Filters State
  const [appliedAgent, setAppliedAgent] = useState('All Agents');
  const [appliedStatus, setAppliedStatus] = useState('All Status');
  const [appliedOutcome, setAppliedOutcome] = useState('All Outcomes');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-09-01');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyFilter = () => {
    setAppliedAgent(selectedAgent);
    setAppliedStatus(selectedStatus);
    setAppliedOutcome(selectedOutcome);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSelectedAgent('All Agents');
    setSelectedStatus('All Status');
    setSelectedOutcome('All Outcomes');
    setDateFrom('');
    setDateTo('2026-09-01');

    setAppliedAgent('All Agents');
    setAppliedStatus('All Status');
    setAppliedOutcome('All Outcomes');
    setAppliedDateFrom('');
    setAppliedDateTo('2026-09-01');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return visitsData.filter(item => {
      if (appliedAgent !== 'All Agents' && item.agent !== appliedAgent) return false;
      if (appliedStatus !== 'All Status' && item.status !== appliedStatus) return false;
      if (appliedOutcome !== 'All Outcomes' && item.outcome !== appliedOutcome) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchLeadId = item.leadId.toLowerCase().includes(query);
        const matchName = item.leadName.toLowerCase().includes(query);
        const matchAgent = item.agent.toLowerCase().includes(query);
        if (!matchLeadId && !matchName && !matchAgent) return false;
      }
      return true;
    });
  }, [visitsData, appliedAgent, appliedStatus, appliedOutcome, searchQuery]);

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = filteredData.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="vm-root">
      {/* Top Header & Breadcrumb */}
      <div className="vm-header">
        <div className="vm-title-area">
          <h1>Visit Management</h1>
        </div>
        <nav className="vm-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <FiChevronRight className="crumb-arrow" />
          <Link to="/ciisUser/crm/marketing/overview">Marketing Management</Link>
          <FiChevronRight className="crumb-arrow" />
          <span className="crumb-active">Visit Management</span>
        </nav>
      </div>

      {/* Filter Card */}
      <div className="vm-card vm-filter-card">
        <div className="vm-filter-grid">
          <div className="vm-field">
            <label>Marketing Agent</label>
            <select
              className="vm-select"
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
            >
              <option value="All Agents">All Agents</option>
              <option value="Marketing Exec1">Marketing Exec1</option>
              <option value="Marketing Exec2">Marketing Exec2</option>
              <option value="Marketing Exec3">Marketing Exec3</option>
            </select>
          </div>

          <div className="vm-field">
            <label>Status</label>
            <select
              className="vm-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="vm-field">
            <label>Outcome</label>
            <select
              className="vm-select"
              value={selectedOutcome}
              onChange={e => setSelectedOutcome(e.target.value)}
            >
              <option value="All Outcomes">All Outcomes</option>
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Follow-up Required">Follow-up Required</option>
            </select>
          </div>

          <div className="vm-field">
            <label>Date From</label>
            <input
              type="date"
              className="vm-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>

          <div className="vm-field">
            <label>Date To</label>
            <input
              type="date"
              className="vm-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>

          <div className="vm-filter-actions">
            <button className="vm-btn-filter" onClick={handleApplyFilter} title="Apply Filters">
              <FiFilter />
            </button>
            <button className="vm-btn-reset" onClick={handleResetFilter} title="Reset Filters">
              <FiRotateCcw />
            </button>
          </div>
        </div>
      </div>

      {/* Visit Management Table Card */}
      <div className="vm-card">
        <div className="vm-card-header flex-between">
          <h2 className="vm-section-title">Visit Management</h2>
          <span className="vm-pill-badge pill-purple">{filteredData.length} Records</span>
        </div>

        {/* Controls Row */}
        <div className="vm-controls-row">
          <div className="vm-entries-select">
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

          <div className="vm-search-box">
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
        <div className="vm-table-responsive">
          <table className="vm-table">
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>LEAD ID</th>
                <th>LEAD</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>AGENT</th>
                <th>VISIT DATE</th>
                <th>STATUS</th>
                <th>OUTCOME</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.length > 0 ? (
                currentEntries.map((item, index) => (
                  <tr key={item.id}>
                    <td>{startIndex + index + 1}</td>
                    <td className="vm-lead-id">{item.leadId}</td>
                    <td className="vm-font-medium">{item.leadName}</td>
                    <td>
                      <span className={`vm-chip chip-${item.sourceTone}`}>{item.source}</span>
                    </td>
                    <td>
                      <span className={`vm-chip chip-${item.typeTone}`}>{item.type}</span>
                    </td>
                    <td>{item.agent}</td>
                    <td className="vm-date-cell">{item.visitDate}</td>
                    <td>
                      <span className={`vm-status-chip status-${item.statusTone}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.outcome === '-' ? (
                        <span className="vm-dash-text">-</span>
                      ) : (
                        <span className={`vm-outcome-chip outcome-${item.outcomeTone}`}>
                          {item.outcome}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="vm-empty-cell">
                    No visit records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Row */}
        <div className="vm-pagination-row">
          <div className="vm-showing-text">
            {totalEntries > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + entriesPerPage, totalEntries)} of ${totalEntries} entries`
              : 'Showing 0 to 0 of 0 entries'}
          </div>
          <div className="vm-pagination">
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

export default VisitManagement;
