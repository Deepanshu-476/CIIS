import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Phone,
  MapPin,
  Trophy,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { exportToExcel, handlePrintReport } from './reportExportUtils';
import './TeamPerformanceReports.css';

const initialTeamPerfData = [
  { rank: '#1', member: 'Telecaller 1', role: 'Telecaller', calls: 2, visits: 0, assignedLeads: 3, converted: 1, convRate: '33.3%' },
  { rank: '#2', member: 'Telecaller 2', role: 'Telecaller', calls: 0, visits: 0, assignedLeads: 9, converted: 0, convRate: '0%' },
  { rank: '#3', member: 'Telecaller 3', role: 'Telecaller', calls: 0, visits: 0, assignedLeads: 0, converted: 0, convRate: '0%' },
  { rank: '#4', member: 'Marketing Exec1', role: 'Marketing Exec', calls: 0, visits: 0, assignedLeads: 0, converted: 0, convRate: '0%' },
  { rank: '#5', member: 'Marketing Exec2', role: 'Marketing Exec', calls: 0, visits: 0, assignedLeads: 0, converted: 0, convRate: '0%' },
  { rank: '#6', member: 'Marketing Exec3', role: 'Marketing Exec', calls: 0, visits: 2, assignedLeads: 6, converted: 0, convRate: '0%' },
];

export default function TeamPerformanceReports() {
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('01-09-2026');

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setRoleFilter('All Roles');
    setFromDate('');
    setToDate('01-09-2026');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredTeamPerf = useMemo(() => {
    return initialTeamPerfData.filter((item) => {
      const matchRole = roleFilter === 'All Roles' || item.role === roleFilter;
      const matchSearch =
        item.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase());

      return matchRole && matchSearch;
    });
  }, [roleFilter, searchTerm]);

  const totalPages = Math.ceil(filteredTeamPerf.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredTeamPerf.slice(start, start + entriesPerPage);
  }, [filteredTeamPerf, currentPage, entriesPerPage]);

  const handleExportExcel = () => {
    exportToExcel(filteredTeamPerf, 'Team_Performance_Report', 'TeamPerformance');
  };

  return (
    <div className="tpr-page-wrapper">
      {/* Header & Breadcrumb */}
      <div className="tpr-header">
        <h1 className="tpr-title">Team Performance Report</h1>
        <div className="tpr-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <span className="tpr-bc-sep">&gt;</span>
          <Link to="/ciisUser/crm/reports/overview">Reports</Link>
          <span className="tpr-bc-sep">&gt;</span>
          <span className="tpr-bc-active">Team Performance</span>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="tpr-kpi-grid">
        <div className="tpr-kpi-card">
          <div className="tpr-kpi-left">
            <span className="tpr-kpi-label">Active Members</span>
            <div className="tpr-kpi-value">6</div>
          </div>
          <div className="tpr-kpi-icon-box tpr-icon-purple">
            <Users size={20} />
          </div>
        </div>

        <div className="tpr-kpi-card">
          <div className="tpr-kpi-left">
            <span className="tpr-kpi-label">Calls Made</span>
            <div className="tpr-kpi-value">2</div>
          </div>
          <div className="tpr-kpi-icon-box tpr-icon-green">
            <Phone size={20} />
          </div>
        </div>

        <div className="tpr-kpi-card">
          <div className="tpr-kpi-left">
            <span className="tpr-kpi-label">Visits Done</span>
            <div className="tpr-kpi-value">2</div>
          </div>
          <div className="tpr-kpi-icon-box tpr-icon-orange">
            <MapPin size={20} />
          </div>
        </div>

        <div className="tpr-kpi-card">
          <div className="tpr-kpi-left">
            <span className="tpr-kpi-label">Converted Leads</span>
            <div className="tpr-kpi-value">1</div>
          </div>
          <div className="tpr-kpi-icon-box tpr-icon-cyan">
            <Trophy size={20} />
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="tpr-filter-card">
        <div className="tpr-filter-col">
          <label>Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All Roles">All Roles</option>
            <option value="Telecaller">Telecaller</option>
            <option value="Marketing Exec">Marketing Exec</option>
          </select>
        </div>

        <div className="tpr-filter-col">
          <label>Date From</label>
          <input
            type="text"
            placeholder="DD-MM-YYYY"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="tpr-filter-col">
          <label>Date To</label>
          <input
            type="text"
            placeholder="01-09-2026"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="tpr-filter-actions">
          <button className="tpr-btn-apply" onClick={handleApplyFilter}>
            <Filter size={13} /> Apply
          </button>
          <button className="tpr-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Performance Details Table Card */}
      <div className="tpr-table-card">
        <div className="tpr-table-header-row">
          <h3 className="tpr-table-title">Performance Details</h3>
          <div className="tpr-table-actions">
            <button className="tpr-btn-print" onClick={handlePrintReport}>
              <Printer size={12} /> Print
            </button>
            <button className="tpr-btn-excel" onClick={handleExportExcel}>
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>

        {/* Dashed controls line */}
        <div className="tpr-table-controls">
          <div className="tpr-entries-wrap">
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

          <div className="tpr-search-wrap">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search member or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="tpr-table-responsive">
          <table className="tpr-custom-table">
            <thead>
              <tr>
                <th style={{ width: '65px' }} className="tpr-th-sort">
                  Rank <span className="tpr-sort-icon">&#8645;</span>
                </th>
                <th>Team Member</th>
                <th>Role</th>
                <th style={{ textAlign: 'center' }}>Calls</th>
                <th style={{ textAlign: 'center' }}>Visits</th>
                <th style={{ textAlign: 'center' }}>Assigned Leads</th>
                <th style={{ textAlign: 'center' }}>Converted</th>
                <th style={{ textAlign: 'center' }}>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row, index) => {
                  const initials = row.member
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();

                  const isGold = row.rank === '#1';
                  const isSilver = row.rank === '#2';
                  const isBronze = row.rank === '#3';
                  const rankClass = isGold
                    ? 'tpr-rank-1'
                    : isSilver
                    ? 'tpr-rank-2'
                    : isBronze
                    ? 'tpr-rank-3'
                    : 'tpr-rank-other';

                  const convNum = parseFloat(row.convRate) || 0;

                  return (
                    <tr key={index}>
                      <td>
                        <span className={`tpr-rank-tag ${rankClass}`}>
                          {isGold && <Award size={11} />}
                          {row.rank}
                        </span>
                      </td>
                      <td>
                        <div className="tpr-member-cell">
                          <div className="tpr-avatar">{initials}</div>
                          <span className="tpr-member-name">{row.member}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`tpr-role-badge ${
                            row.role === 'Telecaller'
                              ? 'tpr-role-telecaller'
                              : 'tpr-role-marketing'
                          }`}
                        >
                          {row.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.calls}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.visits}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.assignedLeads}</td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: '700',
                          color: row.converted > 0 ? '#059669' : '#64748b'
                        }}
                      >
                        {row.converted}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`tpr-conv-badge ${
                            convNum > 0 ? 'tpr-conv-high' : 'tpr-conv-zero'
                          }`}
                        >
                          {row.convRate}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No team members found matching current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="tpr-table-footer">
          <div className="tpr-footer-info">
            Showing 1 to {Math.min(currentData.length, 10)} of {filteredTeamPerf.length} entries
          </div>

          <div className="tpr-pagination-bar">
            <button
              className="tpr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              className="tpr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &lsaquo;
            </button>
            <button className="tpr-pg-btn active" onClick={() => setCurrentPage(1)}>1</button>
            <button
              className="tpr-pg-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &rsaquo;
            </button>
            <button
              className="tpr-pg-btn"
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
