import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  CheckCircle,
  Trophy,
  Calendar,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { exportToExcel, handlePrintReport } from './reportExportUtils';
import './VisitReports.css';

const initialVisitData = [
  { id: 1, leadId: 'LD-476', institute: 'Aman Test 1', agent: 'Marketing Exec3', visitDate: '26-08-2026', time: '18:29:00', status: 'In Progress', outcome: 'Interested', purpose: 'Initial' },
  { id: 2, leadId: 'LD-183', institute: 'Parth Gupta', agent: 'Marketing Exec3', visitDate: '26-08-2026', time: '18:01:00', status: 'Planned', outcome: '-', purpose: 'Initial' },
];

export default function VisitReports() {
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [outcomeFilter, setOutcomeFilter] = useState('All Outcomes');
  const [assignedFilter, setAssignedFilter] = useState('All Users');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('01-09-2026');

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setStatusFilter('All Status');
    setOutcomeFilter('All Outcomes');
    setAssignedFilter('All Users');
    setFromDate('');
    setToDate('01-09-2026');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredVisits = useMemo(() => {
    return initialVisitData.filter((item) => {
      const matchStatus = statusFilter === 'All Status' || item.status === statusFilter;
      const matchOutcome = outcomeFilter === 'All Outcomes' || item.outcome === outcomeFilter;
      const matchAssigned = assignedFilter === 'All Users' || item.agent === assignedFilter;
      const matchSearch =
        item.institute.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStatus && matchOutcome && matchAssigned && matchSearch;
    });
  }, [statusFilter, outcomeFilter, assignedFilter, searchTerm]);

  const totalPages = Math.ceil(filteredVisits.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredVisits.slice(start, start + entriesPerPage);
  }, [filteredVisits, currentPage, entriesPerPage]);

  const handleExportExcel = () => {
    exportToExcel(filteredVisits, 'Visit_Reports', 'Visits');
  };

  return (
    <div className="vr-page-wrapper">
      {/* Header & Breadcrumb */}
      <div className="vr-header">
        <h1 className="vr-title">Visit Reports</h1>
        <div className="vr-breadcrumb">
          <Link to="/ciisUser/crm/reports/overview">Reports</Link>
          <span className="vr-bc-sep">&gt;</span>
          <span className="vr-bc-active">Visits</span>
        </div>
      </div>

      {/* 4 KPI Stat Cards (Top) */}
      <div className="vr-kpi-grid">
        <div className="vr-kpi-card">
          <div className="vr-kpi-left">
            <span className="vr-kpi-label">Total Visits</span>
            <div className="vr-kpi-value">2</div>
          </div>
          <div className="vr-kpi-icon-box vr-icon-purple">
            <MapPin size={20} />
          </div>
        </div>

        <div className="vr-kpi-card">
          <div className="vr-kpi-left">
            <span className="vr-kpi-label">Completed</span>
            <div className="vr-kpi-value">0</div>
          </div>
          <div className="vr-kpi-icon-box vr-icon-green">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="vr-kpi-card">
          <div className="vr-kpi-left">
            <span className="vr-kpi-label">Converted</span>
            <div className="vr-kpi-value">0</div>
          </div>
          <div className="vr-kpi-icon-box vr-icon-cyan">
            <Trophy size={20} />
          </div>
        </div>

        <div className="vr-kpi-card">
          <div className="vr-kpi-left">
            <span className="vr-kpi-label">Planned</span>
            <div className="vr-kpi-value">1</div>
          </div>
          <div className="vr-kpi-icon-box vr-icon-orange">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Filter Card (Below KPI Cards) */}
      <div className="vr-filter-card">
        <div className="vr-filter-col">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="vr-filter-col">
          <label>Outcome</label>
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)}>
            <option value="All Outcomes">All Outcomes</option>
            <option value="Interested">Interested</option>
            <option value="-">-</option>
          </select>
        </div>

        <div className="vr-filter-col">
          <label>Assigned To</label>
          <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}>
            <option value="All Users">All Users</option>
            <option value="Marketing Exec3">Marketing Exec3</option>
          </select>
        </div>

        <div className="vr-filter-col">
          <label>Date From</label>
          <input
            type="text"
            placeholder="DD-MM-YYYY"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="vr-filter-col">
          <label>Date To</label>
          <input
            type="text"
            placeholder="01-09-2026"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="vr-filter-actions">
          <button className="vr-btn-apply" onClick={handleApplyFilter}>
            <Filter size={13} /> Apply
          </button>
          <button className="vr-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Visit Details Table Card */}
      <div className="vr-table-card">
        <div className="vr-table-header-row">
          <h3 className="vr-table-title">Visit Details</h3>
          <div className="vr-table-actions">
            <button className="vr-btn-print" onClick={handlePrintReport}>
              <Printer size={12} /> Print
            </button>
            <button className="vr-btn-excel" onClick={handleExportExcel}>
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>

        {/* Dashed controls line */}
        <div className="vr-table-controls">
          <div className="vr-entries-wrap">
            <select
              value={entriesPerPage}
              onChange={(e) => {
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

          <div className="vr-search-wrap">
            <label>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="vr-table-responsive">
          <table className="vr-custom-table">
            <thead>
              <tr>
                <th style={{ width: '38px' }} className="vr-th-sort">
                  # <span className="vr-sort-icon">&#8645;</span>
                </th>
                <th style={{ width: '90px' }}>Lead ID</th>
                <th>Institute</th>
                <th>Agent</th>
                <th>Visit Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Outcome</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <tr key={row.id}>
                    <td className="vr-index-cell">{row.id}</td>
                    <td className="vr-lead-id-cell">{row.leadId}</td>
                    <td>{row.institute}</td>
                    <td>{row.agent}</td>
                    <td>{row.visitDate}</td>
                    <td>{row.time}</td>
                    <td>
                      <span className={`vr-status-badge vr-badge-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      {row.outcome === '-' ? (
                        <span className="vr-outcome-dash">-</span>
                      ) : (
                        <span className="vr-outcome-badge vr-outcome-interested">
                          {row.outcome}
                        </span>
                      )}
                    </td>
                    <td>{row.purpose}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No matching visit records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="vr-table-footer">
          <div className="vr-footer-info">
            Showing 1 to {Math.min(currentData.length, 10)} of {filteredVisits.length} entries
          </div>

          <div className="vr-pagination-bar">
            <button
              className="vr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              className="vr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &lsaquo;
            </button>
            <button className="vr-pg-btn active" onClick={() => setCurrentPage(1)}>1</button>
            <button
              className="vr-pg-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &rsaquo;
            </button>
            <button
              className="vr-pg-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(totalPages)}
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
