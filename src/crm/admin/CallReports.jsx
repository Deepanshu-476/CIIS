import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Clock,
  CheckCircle,
  UserCheck,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Layers,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { exportToExcel, handlePrintReport } from './reportExportUtils';
import './CallReports.css';

const outcomeChartData = [
  { name: 'Converted', count: 1.0, fill: '#14b8a6' },
  { name: 'Follow-up', count: 1.0, fill: '#f59e0b' },
];

const trendChartData = [
  { date: '26 Aug', calls: 0 },
  { date: '27 Aug', calls: 0 },
  { date: '28 Aug', calls: 0 },
  { date: '29 Aug', calls: 0 },
  { date: '30 Aug', calls: 0 },
  { date: '31 Aug', calls: 0 },
  { date: '01 Sep', calls: 0 },
];

const initialCallData = [
  { id: 1, leadId: '#LD-008', leadName: 'Ashok Pillai', source: 'Facebook', type: 'NEET', caller: 'Telecaller 1', outcome: 'Follow-up', date: '24 Aug 2026' },
  { id: 2, leadId: '#LD-007', leadName: 'Zara Nair', source: 'Facebook', type: 'NEET', caller: 'Telecaller 1', outcome: 'Converted', date: '24 Aug 2026' },
];

export default function CallReports() {
  const [outcomeFilter, setOutcomeFilter] = useState('All Outcomes');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [callerFilter, setCallerFilter] = useState('All Callers');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('01-09-2026');

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setOutcomeFilter('All Outcomes');
    setSourceFilter('All Sources');
    setTypeFilter('All Types');
    setCallerFilter('All Callers');
    setFromDate('');
    setToDate('01-09-2026');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredCalls = useMemo(() => {
    return initialCallData.filter((item) => {
      const matchOutcome = outcomeFilter === 'All Outcomes' || item.outcome === outcomeFilter;
      const matchSource = sourceFilter === 'All Sources' || item.source === sourceFilter;
      const matchType = typeFilter === 'All Types' || item.type === typeFilter;
      const matchCaller = callerFilter === 'All Callers' || item.caller === callerFilter;
      const matchSearch =
        item.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());

      return matchOutcome && matchSource && matchType && matchCaller && matchSearch;
    });
  }, [outcomeFilter, sourceFilter, typeFilter, callerFilter, searchTerm]);

  const totalPages = Math.ceil(filteredCalls.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredCalls.slice(start, start + entriesPerPage);
  }, [filteredCalls, currentPage, entriesPerPage]);

  const handleExportExcel = () => {
    exportToExcel(filteredCalls, 'Call_Reports', 'CallLogs');
  };

  return (
    <div className="cr-page-wrapper">
      {/* Header & Breadcrumb */}
      <div className="cr-header">
        <h1 className="cr-title">Call Reports</h1>
        <div className="cr-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <span className="cr-bc-sep">&gt;</span>
          <Link to="/ciisUser/crm/reports/overview">Reports</Link>
          <span className="cr-bc-sep">&gt;</span>
          <span className="cr-bc-active">Call Reports</span>
        </div>
      </div>

      {/* Filter Card (Top) */}
      <div className="cr-filter-card">
        <div className="cr-filter-inputs-grid">
          <div className="cr-filter-col">
            <label>Outcome</label>
            <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)}>
              <option value="All Outcomes">All Outcomes</option>
              <option value="Converted">Converted</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>

          <div className="cr-filter-col">
            <label>Lead Source</label>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="All Sources">All Sources</option>
              <option value="Facebook">Facebook</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Phone Call">Phone Call</option>
              <option value="School Visit">School Visit</option>
            </select>
          </div>

          <div className="cr-filter-col">
            <label>Lead Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All Types">All Types</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="Marketing">Marketing</option>
              <option value="Counselling">Counselling</option>
            </select>
          </div>

          <div className="cr-filter-col">
            <label>Caller</label>
            <select value={callerFilter} onChange={(e) => setCallerFilter(e.target.value)}>
              <option value="All Callers">All Callers</option>
              <option value="Telecaller 1">Telecaller 1</option>
              <option value="Telecaller 2">Telecaller 2</option>
            </select>
          </div>

          <div className="cr-filter-col">
            <label>From</label>
            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="cr-filter-col">
            <label>To</label>
            <input
              type="text"
              placeholder="01-09-2026"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div className="cr-filter-actions-row">
          <button className="cr-btn-apply" onClick={handleApplyFilter}>
            <Filter size={13} /> Apply
          </button>
          <button className="cr-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="cr-kpi-grid">
        <div className="cr-kpi-card">
          <div className="cr-kpi-icon-box cr-icon-purple">
            <Phone size={20} />
          </div>
          <div className="cr-kpi-content">
            <div className="cr-kpi-value">2</div>
            <span className="cr-kpi-label">Total Calls</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-icon-box cr-icon-orange">
            <Clock size={20} />
          </div>
          <div className="cr-kpi-content">
            <div className="cr-kpi-value">0</div>
            <span className="cr-kpi-label">Pending</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-icon-box cr-icon-green">
            <CheckCircle size={20} />
          </div>
          <div className="cr-kpi-content">
            <div className="cr-kpi-value">2</div>
            <span className="cr-kpi-label">Completed</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-icon-box cr-icon-cyan">
            <UserCheck size={20} />
          </div>
          <div className="cr-kpi-content">
            <div className="cr-kpi-value">1</div>
            <span className="cr-kpi-label">Converted</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="cr-charts-grid">
        {/* Left Chart: Call Outcomes */}
        <div className="cr-chart-card">
          <div className="cr-chart-header">
            <div className="cr-chart-title-wrap">
              <div className="cr-chart-icon-wrap" style={{ color: '#6366f1' }}>
                <BarChart3 size={16} />
              </div>
              <h3 className="cr-chart-title">Call Outcomes</h3>
            </div>
          </div>

          <div className="cr-svg-chart-container">
            <svg
              viewBox="0 0 500 195"
              className="cr-responsive-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y-Axis Grid Lines & Labels (0 to 1.0) */}
              {[
                { val: '1.0', y: 15 },
                { val: '0.9', y: 31 },
                { val: '0.8', y: 47 },
                { val: '0.7', y: 63 },
                { val: '0.6', y: 79 },
                { val: '0.5', y: 95 },
                { val: '0.4', y: 111 },
                { val: '0.3', y: 127 },
                { val: '0.2', y: 143 },
                { val: '0.1', y: 159 },
                { val: '0', y: 172 }
              ].map((tick) => (
                <g key={tick.val}>
                  <line
                    x1="40"
                    y1={tick.y}
                    x2="480"
                    y2={tick.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x="32"
                    y={tick.y + 3.5}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="inherit"
                  >
                    {tick.val}
                  </text>
                </g>
              ))}

              {/* Bottom Baseline */}
              <line x1="40" y1="172" x2="480" y2="172" stroke="#e2e8f0" strokeWidth="1" />

              {/* 2 Outcome Bars */}
              {outcomeChartData.map((item, index) => {
                const barWidth = 110;
                const barX = index === 0 ? 80 : 250;
                const height = 157; // Full height for 1.0
                const barY = 172 - height;
                const isHovered = hoveredBar === index;

                return (
                  <g
                    key={item.name}
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={height}
                      fill={item.fill}
                      rx="3"
                      ry="3"
                      opacity={hoveredBar === null || isHovered ? 1 : 0.75}
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={barX + barWidth / 2}
                      y="188"
                      textAnchor="middle"
                      fill={isHovered ? '#0f172a' : '#64748b'}
                      fontSize="10"
                      fontWeight={isHovered ? '600' : '400'}
                    >
                      {item.name}
                    </text>

                    {/* Tooltip */}
                    {isHovered && (
                      <g>
                        <rect
                          x={barX + barWidth / 2 - 35}
                          y={Math.max(barY - 26, 2)}
                          width={70}
                          height={20}
                          rx="3"
                          fill="#0f172a"
                        />
                        <text
                          x={barX + barWidth / 2}
                          y={Math.max(barY - 12, 16)}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {item.count} Call
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Chart: Call Volume Trend */}
        <div className="cr-chart-card">
          <div className="cr-chart-header">
            <div className="cr-chart-title-wrap">
              <div className="cr-chart-icon-wrap" style={{ color: '#14b8a6' }}>
                <TrendingUp size={16} />
              </div>
              <h3 className="cr-chart-title">Call Volume Trend</h3>
            </div>
            <div className="cr-chart-legend">
              <span className="cr-legend-line-box"></span>
              <span>Calls Made</span>
            </div>
          </div>

          <div className="cr-svg-chart-container">
            <svg
              viewBox="0 0 500 195"
              className="cr-responsive-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y-Axis Grid Lines & Labels (0 to 1.0) */}
              {[
                { val: '1.0', y: 15 },
                { val: '0.9', y: 31 },
                { val: '0.8', y: 47 },
                { val: '0.7', y: 63 },
                { val: '0.6', y: 79 },
                { val: '0.5', y: 95 },
                { val: '0.4', y: 111 },
                { val: '0.3', y: 127 },
                { val: '0.2', y: 143 },
                { val: '0.1', y: 159 },
                { val: '0', y: 172 }
              ].map((tick) => (
                <g key={tick.val}>
                  <line
                    x1="40"
                    y1={tick.y}
                    x2="480"
                    y2={tick.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x="32"
                    y={tick.y + 3.5}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="inherit"
                  >
                    {tick.val}
                  </text>
                </g>
              ))}

              {/* Bottom Baseline */}
              <line x1="40" y1="172" x2="480" y2="172" stroke="#e2e8f0" strokeWidth="1" />

              {/* Trend Line (teal) across dates */}
              {(() => {
                const startX = 50;
                const endX = 470;
                const stepX = (endX - startX) / (trendChartData.length - 1);
                const points = trendChartData.map((d, i) => {
                  const x = startX + i * stepX;
                  const y = 172 - d.calls * 157;
                  return { x, y, ...d };
                });

                const pathData = points.reduce((acc, p, idx) => {
                  return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, '');

                return (
                  <g>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2"
                    />
                    {points.map((p, i) => (
                      <g
                        key={p.date}
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={hoveredPoint === i ? 4.5 : 3}
                          fill="#14b8a6"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={p.x}
                          y="188"
                          textAnchor="middle"
                          fill={hoveredPoint === i ? '#0f172a' : '#64748b'}
                          fontSize="10"
                          fontWeight={hoveredPoint === i ? '600' : '400'}
                        >
                          {p.date}
                        </text>

                        {/* Tooltip on hover */}
                        {hoveredPoint === i && (
                          <g>
                            <rect
                              x={p.x - 30}
                              y={p.y - 26}
                              width={60}
                              height={20}
                              rx="3"
                              fill="#0f172a"
                            />
                            <text
                              x={p.x}
                              y={p.y - 12}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="10"
                              fontWeight="600"
                            >
                              {p.calls} Calls
                            </text>
                          </g>
                        )}
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Call Log Table Card */}
      <div className="cr-table-card">
        <div className="cr-table-header-row">
          <div className="cr-table-title-wrap">
            <div className="cr-table-icon-box">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="cr-table-title">Call Log</h3>
              <p className="cr-table-subtitle">Showing latest 10 records</p>
            </div>
          </div>
          <div className="cr-table-actions">
            <button className="cr-btn-print" onClick={handlePrintReport}>
              <Printer size={12} /> Print
            </button>
            <button className="cr-btn-excel" onClick={handleExportExcel}>
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>

        {/* Dashed controls line */}
        <div className="cr-table-controls">
          <div className="cr-entries-wrap">
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

          <div className="cr-search-wrap">
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

        <div className="cr-table-responsive">
          <table className="cr-custom-table">
            <thead>
              <tr>
                <th style={{ width: '38px' }} className="cr-th-sort">
                  # <span className="cr-sort-icon">&#8645;</span>
                </th>
                <th style={{ width: '90px' }}>Lead ID</th>
                <th>Lead</th>
                <th>Lead Source</th>
                <th>Lead Type</th>
                <th>Caller</th>
                <th>Outcome</th>
                <th style={{ width: '110px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <tr key={row.id}>
                    <td className="cr-index-cell">{row.id}</td>
                    <td>
                      <span className="cr-link-lead">{row.leadId}</span>
                    </td>
                    <td>
                      <span className="cr-link-name">{row.leadName}</span>
                    </td>
                    <td>{row.source}</td>
                    <td>{row.type}</td>
                    <td>{row.caller}</td>
                    <td>
                      <span className={`cr-status-badge cr-badge-${row.outcome.toLowerCase().replace(/\s+/g, '-')}`}>
                        {row.outcome}
                      </span>
                    </td>
                    <td>{row.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    No matching call logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="cr-table-footer">
          <div className="cr-footer-info">
            Showing 1 to {Math.min(currentData.length, 10)} of {filteredCalls.length} entries
          </div>

          <div className="cr-pagination-bar">
            <button
              className="cr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              className="cr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &lsaquo;
            </button>
            <button className="cr-pg-btn active" onClick={() => setCurrentPage(1)}>1</button>
            <button
              className="cr-pg-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &rsaquo;
            </button>
            <button
              className="cr-pg-btn"
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
