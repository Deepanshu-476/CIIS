import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  List,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Clock,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { exportToExcel, handlePrintReport } from './reportExportUtils';
import './FollowUpReports.css';

const initialFollowUpData = [
  { id: 1, department: 'Marketing', type: 'Visit', leadId: '#LD-476', leadInstitute: 'Aman Test 1', assignedTo: 'Marketing Exec3', scheduledAt: '26-08-2026 12:00 PM', status: 'Overdue', outcome: 'Interested' },
  { id: 2, department: 'Marketing', type: 'Lead', leadId: '#LD-476', leadInstitute: 'Aman Test 1', assignedTo: 'Marketing Exec3', scheduledAt: '26-08-2026 12:00 PM', status: 'Overdue', outcome: '-' },
];

export default function FollowUpReports() {
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
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
    setDeptFilter('All Departments');
    setTypeFilter('All Types');
    setStatusFilter('All Status');
    setAssignedFilter('All Users');
    setFromDate('');
    setToDate('01-09-2026');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredFollowUps = useMemo(() => {
    return initialFollowUpData.filter((item) => {
      const matchDept = deptFilter === 'All Departments' || item.department === deptFilter;
      const matchType = typeFilter === 'All Types' || item.type === typeFilter;
      const matchStatus = statusFilter === 'All Status' || item.status === statusFilter;
      const matchAssigned = assignedFilter === 'All Users' || item.assignedTo === assignedFilter;
      const matchSearch =
        item.leadInstitute.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());

      return matchDept && matchType && matchStatus && matchAssigned && matchSearch;
    });
  }, [deptFilter, typeFilter, statusFilter, assignedFilter, searchTerm]);

  const totalPages = Math.ceil(filteredFollowUps.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredFollowUps.slice(start, start + entriesPerPage);
  }, [filteredFollowUps, currentPage, entriesPerPage]);

  const handleExportExcel = () => {
    exportToExcel(filteredFollowUps, 'FollowUp_Reports', 'FollowUps');
  };

  return (
    <div className="fur-page-wrapper">
      {/* Header & Breadcrumb */}
      <div className="fur-header">
        <h1 className="fur-title">Follow-Up Report</h1>
        <div className="fur-breadcrumb">
          <Link to="/ciisUser/crm/reports/overview">Reports</Link>
          <span className="fur-bc-sep">&gt;</span>
          <span className="fur-bc-active">Follow-Ups</span>
        </div>
      </div>

      {/* 5 KPI Stat Cards (Top) */}
      <div className="fur-kpi-grid">
        <div className="fur-kpi-card">
          <div className="fur-kpi-left">
            <span className="fur-kpi-label">Total</span>
            <div className="fur-kpi-value">2</div>
          </div>
          <div className="fur-kpi-icon-box fur-icon-purple">
            <List size={20} />
          </div>
        </div>

        <div className="fur-kpi-card">
          <div className="fur-kpi-left">
            <span className="fur-kpi-label">Completed</span>
            <div className="fur-kpi-value">0</div>
          </div>
          <div className="fur-kpi-icon-box fur-icon-green">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="fur-kpi-card">
          <div className="fur-kpi-left">
            <span className="fur-kpi-label">Today</span>
            <div className="fur-kpi-value">0</div>
          </div>
          <div className="fur-kpi-icon-box fur-icon-cyan">
            <Calendar size={20} />
          </div>
        </div>

        <div className="fur-kpi-card">
          <div className="fur-kpi-left">
            <span className="fur-kpi-label">Overdue</span>
            <div className="fur-kpi-value">2</div>
          </div>
          <div className="fur-kpi-icon-box fur-icon-red">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="fur-kpi-card">
          <div className="fur-kpi-left">
            <span className="fur-kpi-label">Upcoming</span>
            <div className="fur-kpi-value">0</div>
          </div>
          <div className="fur-kpi-icon-box fur-icon-orange">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="fur-filter-card">
        <div className="fur-filter-inputs-grid">
          <div className="fur-filter-col">
            <label>Department</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="All Departments">All Departments</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Support">Support</option>
            </select>
          </div>

          <div className="fur-filter-col">
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All Types">All Types</option>
              <option value="Visit">Visit</option>
              <option value="Lead">Lead</option>
              <option value="Call">Call</option>
            </select>
          </div>

          <div className="fur-filter-col">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All Status">All Status</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
              <option value="Today">Today</option>
            </select>
          </div>

          <div className="fur-filter-col">
            <label>Assigned To</label>
            <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}>
              <option value="All Users">All Users</option>
              <option value="Marketing Exec3">Marketing Exec3</option>
            </select>
          </div>

          <div className="fur-filter-col">
            <label>From</label>
            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="fur-filter-col">
            <label>To</label>
            <input
              type="text"
              placeholder="01-09-2026"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div className="fur-filter-actions-row">
          <button className="fur-btn-apply" onClick={handleApplyFilter}>
            <Filter size={13} /> Apply
          </button>
          <button className="fur-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Follow-Up Details Table Card */}
      <div className="fur-table-card">
        <div className="fur-table-header-row">
          <h3 className="fur-table-title">Follow-Up Details</h3>
          <div className="fur-table-actions">
            <button className="fur-btn-print" onClick={handlePrintReport}>
              <Printer size={12} /> Print
            </button>
            <button className="fur-btn-excel" onClick={handleExportExcel}>
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>

        {/* Dashed controls line */}
        <div className="fur-table-controls">
          <div className="fur-entries-wrap">
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

          <div className="fur-search-wrap">
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

        <div className="fur-table-responsive">
          <table className="fur-custom-table">
            <thead>
              <tr>
                <th style={{ width: '38px' }} className="fur-th-sort">
                  # <span className="fur-sort-icon">&#8645;</span>
                </th>
                <th>Department</th>
                <th>Type</th>
                <th>Lead ID</th>
                <th>Lead / Institute</th>
                <th>Assigned To</th>
                <th>Scheduled At</th>
                <th>Status</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <tr key={row.id}>
                    <td className="fur-index-cell">{row.id}</td>
                    <td>
                      <span className="fur-dept-badge">{row.department}</span>
                    </td>
                    <td>{row.type}</td>
                    <td className="fur-lead-id">{row.leadId}</td>
                    <td>{row.leadInstitute}</td>
                    <td>{row.assignedTo}</td>
                    <td>{row.scheduledAt}</td>
                    <td>
                      <span className={`fur-status-badge fur-status-${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.outcome}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No matching follow-up records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="fur-table-footer">
          <div className="fur-footer-info">
            Showing 1 to {Math.min(currentData.length, 10)} of {filteredFollowUps.length} entries
          </div>

          <div className="fur-pagination-bar">
            <button
              className="fur-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              className="fur-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &lsaquo;
            </button>
            <button className="fur-pg-btn active" onClick={() => setCurrentPage(1)}>1</button>
            <button
              className="fur-pg-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &rsaquo;
            </button>
            <button
              className="fur-pg-btn"
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
