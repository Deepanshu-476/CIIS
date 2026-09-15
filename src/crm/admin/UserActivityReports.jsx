import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  LogIn,
  Activity,
  UserX,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Calendar,
  Search,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { exportToExcel, handlePrintReport } from './reportExportUtils';
import './UserActivityReports.css';

const dailyActiveData = [
  { date: '26 Aug', users: 2 },
  { date: '27 Aug', users: 1 },
  { date: '28 Aug', users: 0 },
  { date: '29 Aug', users: 0 },
  { date: '30 Aug', users: 0 },
  { date: '31 Aug', users: 1 },
  { date: '01 Sep', users: 1 },
];

const activityByUserChart = [
  { name: 'Admin', count: 5, fill: '#6366f1' },
  { name: 'Marketing Exec3', count: 1, fill: '#14b8a6' },
];

const initialAuditLogs = [
  { id: 1, dateTime: '01-09-2026 02:24 PM', user: 'Admin', role: 'Admin', activity: 'Login', description: 'User logged in', ip: '127.0.0.1' },
  { id: 2, dateTime: '31-08-2026 02:11 PM', user: 'Admin', role: 'Admin', activity: 'Login', description: 'User logged in', ip: '127.0.0.1' },
  { id: 3, dateTime: '27-08-2026 10:24 AM', user: 'Admin', role: 'Admin', activity: 'Login', description: 'User logged in', ip: '127.0.0.1' },
  { id: 4, dateTime: '26-08-2026 02:52 PM', user: 'Admin', role: 'Admin', activity: 'Login', description: 'User logged in', ip: '127.0.0.1' },
  { id: 5, dateTime: '26-08-2026 09:39 AM', user: 'Marketing Exec3', role: 'Marketing Exec', activity: 'Login', description: 'User logged in', ip: '127.0.0.1' },
  { id: 6, dateTime: '26-08-2026 09:35 AM', user: 'Admin', role: 'Admin', activity: 'Login', description: 'User logged in', ip: '127.0.0.1' },
];

export default function UserActivityReports() {
  const [userFilter, setUserFilter] = useState('All Users');
  const [activityFilter, setActivityFilter] = useState('All Activities');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('01-09-2026');

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setUserFilter('All Users');
    setActivityFilter('All Activities');
    setFromDate('');
    setToDate('01-09-2026');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredLogs = useMemo(() => {
    return initialAuditLogs.filter(item => {
      const matchUser = userFilter === 'All Users' || item.user === userFilter;
      const matchActivity = activityFilter === 'All Activities' || item.activity === activityFilter;
      const matchSearch =
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ip.toLowerCase().includes(searchTerm.toLowerCase());

      return matchUser && matchActivity && matchSearch;
    });
  }, [userFilter, activityFilter, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredLogs.slice(start, start + entriesPerPage);
  }, [filteredLogs, currentPage, entriesPerPage]);

  const handleExportExcel = () => {
    exportToExcel(filteredLogs, 'User_Activity_Report', 'ActivityLogs');
  };

  // Standalone Line Chart Math
  const lineSvgWidth = 500;
  const lineSvgHeight = 220;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 35;
  const chartW = lineSvgWidth - padLeft - padRight;
  const chartH = lineSvgHeight - padTop - padBottom;
  const maxUsers = 3;

  const linePoints = dailyActiveData.map((d, i) => {
    const x = padLeft + (i / (dailyActiveData.length - 1)) * chartW;
    const y = padTop + chartH - (d.users / maxUsers) * chartH;
    return { x, y, ...d };
  });

  const pathD = linePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${linePoints[linePoints.length - 1].x},${padTop + chartH} L ${linePoints[0].x},${padTop + chartH} Z`;

  // Standalone Bar Chart Math
  const barSvgWidth = 500;
  const barSvgHeight = 220;
  const barMaxVal = 6;
  const barChartH = barSvgHeight - padTop - padBottom;

  return (
    <div className="cr-reports-container">
      {/* Header & Breadcrumb */}
      <div className="cr-header-row">
        <div>
          <h1 className="cr-page-title">User Activity Report</h1>
          <p className="cr-page-sub">Audit trail of logins, CRM operations, and system events</p>
        </div>
        <div className="cr-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <span className="cr-bc-sep">&gt;</span>
          <Link to="/ciisUser/crm/reports/overview">Reports</Link>
          <span className="cr-bc-sep">&gt;</span>
          <span className="cr-bc-active">User Activity</span>
        </div>
      </div>

      {/* Stats Row (4 KPI Cards) */}
      <div className="cr-kpi-grid cr-kpi-grid-4">
        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-icon cr-icon-green">
              <UserCheck size={22} />
            </div>
            <div className="cr-kpi-text-right">
              <div className="cr-kpi-value">1</div>
              <span className="cr-kpi-label">Active Today</span>
            </div>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-icon cr-icon-purple">
              <LogIn size={22} />
            </div>
            <div className="cr-kpi-text-right">
              <div className="cr-kpi-value">6</div>
              <span className="cr-kpi-label">Logins in Range</span>
            </div>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-icon cr-icon-cyan">
              <Activity size={22} />
            </div>
            <div className="cr-kpi-text-right">
              <div className="cr-kpi-value">6</div>
              <span className="cr-kpi-label">Actions in Range</span>
            </div>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-icon cr-icon-red">
              <UserX size={22} />
            </div>
            <div className="cr-kpi-text-right">
              <div className="cr-kpi-value">5</div>
              <span className="cr-kpi-label">Inactive 7+ Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="cr-filter-box">
        <div className="cr-filter-item">
          <label>User</label>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="All Users">All Users</option>
            <option value="Admin">Admin</option>
            <option value="Marketing Exec3">Marketing Exec3</option>
          </select>
        </div>

        <div className="cr-filter-item">
          <label>Activity</label>
          <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
            <option value="All Activities">All Activities</option>
            <option value="Login">Login</option>
          </select>
        </div>

        <div className="cr-filter-item">
          <label>Date From</label>
          <div className="cr-input-with-icon">
            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Calendar size={14} className="cr-field-icon" />
          </div>
        </div>

        <div className="cr-filter-item">
          <label>Date To</label>
          <div className="cr-input-with-icon">
            <input
              type="text"
              placeholder="01-09-2026"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <Calendar size={14} className="cr-field-icon" />
          </div>
        </div>

        <div className="cr-filter-actions">
          <button className="cr-btn-apply" onClick={handleApplyFilter}>
            <Filter size={14} /> Apply
          </button>
          <button className="cr-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="cr-charts-grid">
        <div className="cr-chart-card">
          <div className="cr-chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="cr-kpi-icon cr-icon-cyan" style={{ width: '32px', height: '32px' }}>
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Daily Active Users</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Trend of logged-in staff members over past 7 days</p>
              </div>
            </div>
          </div>
          <div className="cr-standalone-chart-container" style={{ position: 'relative', width: '100%', height: '240px' }}>
            <svg viewBox={`0 0 ${lineSvgWidth} ${lineSvgHeight}`} className="cr-vector-svg" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="userActivityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines & Y-Axis values */}
              {[0, 1, 2, 3].map((val) => {
                const y = padTop + chartH - (val / maxUsers) * chartH;
                return (
                  <g key={val}>
                    <line x1={padLeft} y1={y} x2={lineSvgWidth - padRight} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{val}</text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <path d={areaD} fill="url(#userActivityGrad)" />

              {/* Line */}
              <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Points & X-Labels */}
              {linePoints.map((pt, idx) => (
                <g key={idx} onMouseEnter={() => setHoveredLineIndex(idx)} onMouseLeave={() => setHoveredLineIndex(null)} style={{ cursor: 'pointer' }}>
                  <line x1={pt.x} y1={padTop + chartH} x2={pt.x} y2={padTop + chartH + 4} stroke="#cbd5e1" strokeWidth="1" />
                  <text x={pt.x} y={padTop + chartH + 18} textAnchor="middle" fontSize="11" fill="#64748b">{pt.date}</text>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredLineIndex === idx ? 6 : 4}
                    fill="#ffffff"
                    stroke="#06b6d4"
                    strokeWidth={hoveredLineIndex === idx ? 3 : 2}
                  />
                  {hoveredLineIndex === idx && (
                    <g>
                      <rect
                        x={pt.x - 40}
                        y={pt.y - 32}
                        width="80"
                        height="24"
                        rx="4"
                        fill="#0f172a"
                        opacity="0.9"
                      />
                      <text x={pt.x} y={pt.y - 16} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
                        {pt.users} {pt.users === 1 ? 'user' : 'users'}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="cr-chart-card">
          <div className="cr-chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="cr-kpi-icon cr-icon-purple" style={{ width: '32px', height: '32px' }}>
                <BarChart3 size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Activity by User</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Total recorded actions broken down by user account</p>
              </div>
            </div>
          </div>
          <div className="cr-standalone-chart-container" style={{ position: 'relative', width: '100%', height: '240px' }}>
            <svg viewBox={`0 0 ${barSvgWidth} ${barSvgHeight}`} className="cr-vector-svg" style={{ width: '100%', height: '100%' }}>
              {/* Gridlines */}
              {[0, 2, 4, 6].map((val) => {
                const y = padTop + barChartH - (val / barMaxVal) * barChartH;
                return (
                  <g key={val}>
                    <line x1={padLeft} y1={y} x2={barSvgWidth - padRight} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{val}</text>
                  </g>
                );
              })}

              {/* Bars */}
              {activityByUserChart.map((bar, idx) => {
                const barWidth = 48;
                const slotWidth = chartW / activityByUserChart.length;
                const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
                const h = (bar.count / barMaxVal) * barChartH;
                const y = padTop + barChartH - h;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      rx="6"
                      fill={bar.fill}
                      opacity={hoveredBarIndex === idx ? 0.85 : 1}
                    />
                    <text x={x + barWidth / 2} y={padTop + barChartH + 18} textAnchor="middle" fontSize="11" fill="#64748b">
                      {bar.name}
                    </text>
                    <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">
                      {bar.count}
                    </text>
                    {hoveredBarIndex === idx && (
                      <g>
                        <rect
                          x={x + barWidth / 2 - 45}
                          y={y - 38}
                          width="90"
                          height="24"
                          rx="4"
                          fill="#0f172a"
                          opacity="0.9"
                        />
                        <text x={x + barWidth / 2} y={y - 22} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
                          {bar.count} actions
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="cr-card-box">
        <div className="cr-card-header">
          <div>
            <h3 className="cr-table-title">Audit Logs</h3>
            <p className="cr-table-sub">Detailed chronological feed of system events and operations</p>
          </div>
          <div className="cr-export-btns">
            <button className="cr-btn-print" onClick={handlePrintReport}>
              <Printer size={14} /> Print
            </button>
            <button className="cr-btn-excel" onClick={handleExportExcel}>
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          </div>
        </div>

        <div className="cr-table-controls">
          <div className="cr-entries-select">
            <span>Show</span>
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
            <span>entries</span>
          </div>
          <div className="cr-search-box">
            <input
              type="text"
              placeholder="Search user, role, description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="cr-table-responsive">
          <table className="cr-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>Date & Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Activity</th>
                <th>Description</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.dateTime}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{row.user}</td>
                    <td>
                      <span className="cr-badge-role">{row.role}</span>
                    </td>
                    <td>
                      <span className="cr-badge-act-cyan">{row.activity}</span>
                    </td>
                    <td>{row.description}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{row.ip}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No audit logs found matching current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="cr-table-footer">
          <div className="cr-info-text">
            Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, filteredLogs.length)} of {filteredLogs.length} entries
          </div>
          <div className="cr-pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} title="First Page">
              <ChevronsLeft size={14} />
            </button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} title="Previous Page">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={currentPage === page ? 'cr-page-active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} title="Next Page">
              <ChevronRight size={14} />
            </button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} title="Last Page">
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
