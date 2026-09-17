import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Layers,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { exportToExcel, handlePrintReport } from './reportExportUtils';
import './LeadReports.css';

const sourceChartData = [
  { name: 'Phone Call', count: 109, fill: '#6366f1' },
  { name: 'Google Ads', count: 100, fill: '#10b981' },
  { name: 'School Visit', count: 37, fill: '#f59e0b' },
  { name: 'Instagram', count: 21, fill: '#06b6d4' },
  { name: 'WhatsApp', count: 20, fill: '#ec4899' },
  { name: 'Facebook', count: 7, fill: '#64748b' },
  { name: 'Self', count: 1, fill: '#8b5cf6' },
];

const statusChartData = [
  { name: 'New', value: 93.9, count: 277, fill: '#06b6d4' },
  { name: 'Assigned', value: 5.1, count: 15, fill: '#6366f1' },
  { name: 'Converted', value: 0.3, count: 1, fill: '#10b981' },
  { name: 'In Progress', value: 0.3, count: 1, fill: '#f59e0b' },
  { name: 'Interested', value: 0.3, count: 1, fill: '#14b8a6' },
];

const initialLeadData = [
  { id: 1, leadId: '#LD-476', leadName: 'Aman Test 1', status: 'Interested', source: 'Self', type: 'Marketing', assignedTo: 'Marketing Exec3', created: '26 Aug 2026' },
  { id: 2, leadId: '#LD-454', leadName: 'Geeta Patel', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 3, leadId: '#LD-455', leadName: 'Kiran Singh', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 4, leadId: '#LD-456', leadName: 'Siddharth Yadav', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 5, leadId: '#LD-457', leadName: 'Mahesh Nambiar', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 6, leadId: '#LD-458', leadName: 'Pooja Nambiar', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 7, leadId: '#LD-459', leadName: 'Rekha Uppal', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 8, leadId: '#LD-423', leadName: 'Rishabh Jha', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 9, leadId: '#LD-424', leadName: 'Pallavi Lal', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
  { id: 10, leadId: '#LD-425', leadName: 'Varun Uppal', status: 'New', source: 'School Visit', type: 'Counselling', assignedTo: 'Unassigned', created: '22 Aug 2026' },
];

// Helper to generate SVG Donut Arc Paths
function getDonutPath(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const rad = Math.PI / 180;
  const x1 = cx + rOuter * Math.cos(startAngle * rad);
  const y1 = cy + rOuter * Math.sin(startAngle * rad);
  const x2 = cx + rOuter * Math.cos(endAngle * rad);
  const y2 = cy + rOuter * Math.sin(endAngle * rad);
  const x3 = cx + rInner * Math.cos(endAngle * rad);
  const y3 = cy + rInner * Math.sin(endAngle * rad);
  const x4 = cx + rInner * Math.cos(startAngle * rad);
  const y4 = cy + rInner * Math.sin(startAngle * rad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

export default function LeadReports() {
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('01-09-2026');

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredPie, setHoveredPie] = useState(null);

  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setStatusFilter('All Status');
    setSourceFilter('All Sources');
    setTypeFilter('All Types');
    setFromDate('');
    setToDate('01-09-2026');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredLeads = useMemo(() => {
    return initialLeadData.filter((item) => {
      const matchStatus = statusFilter === 'All Status' || item.status === statusFilter;
      const matchSource = sourceFilter === 'All Sources' || item.source === sourceFilter;
      const matchType = typeFilter === 'All Types' || item.type === typeFilter;
      const matchSearch =
        item.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStatus && matchSource && matchType && matchSearch;
    });
  }, [statusFilter, sourceFilter, typeFilter, searchTerm]);

  const totalPages = Math.ceil(filteredLeads.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredLeads.slice(start, start + entriesPerPage);
  }, [filteredLeads, currentPage, entriesPerPage]);

  const handleExportExcel = () => {
    exportToExcel(filteredLeads, 'Lead_Reports', 'Leads');
  };

  // Donut Arc calculation
  const donutSlices = useMemo(() => {
    let currentAngle = -90;
    return statusChartData.map((item) => {
      const angleSpan = Math.max(item.value * 3.56, 3.2);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan - 0.8;
      currentAngle += angleSpan;
      const path = getDonutPath(100, 100, 54, 82, startAngle, endAngle);
      return {
        ...item,
        path,
        startAngle,
        endAngle
      };
    });
  }, []);

  return (
    <div className="lr-page-wrapper">
      {/* Header & Breadcrumb */}
      <div className="lr-header">
        <h1 className="lr-title">Lead Reports</h1>
        <div className="lr-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <span className="lr-bc-sep">&gt;</span>
          <Link to="/ciisUser/crm/reports/overview">Reports</Link>
          <span className="lr-bc-sep">&gt;</span>
          <span className="lr-bc-active">Lead Reports</span>
        </div>
      </div>

      {/* Filter Toolbar (Top) */}
      <div className="lr-filter-card">
        <div className="lr-filter-col">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="Converted">Converted</option>
            <option value="In Progress">In Progress</option>
            <option value="Interested">Interested</option>
          </select>
        </div>

        <div className="lr-filter-col">
          <label>Lead Source</label>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="All Sources">All Sources</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Google Ads">Google Ads</option>
            <option value="School Visit">School Visit</option>
            <option value="Instagram">Instagram</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Facebook">Facebook</option>
            <option value="Self">Self</option>
          </select>
        </div>

        <div className="lr-filter-col">
          <label>Lead Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All Types">All Types</option>
            <option value="Marketing">Marketing</option>
            <option value="Counselling">Counselling</option>
          </select>
        </div>

        <div className="lr-filter-col">
          <label>From</label>
          <input
            type="text"
            placeholder="DD-MM-YYYY"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="lr-filter-col">
          <label>To</label>
          <input
            type="text"
            placeholder="01-09-2026"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="lr-filter-actions">
          <button className="lr-btn-apply" onClick={handleApplyFilter}>
            <Filter size={13} /> Apply
          </button>
          <button className="lr-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="lr-kpi-grid">
        <div className="lr-kpi-card">
          <div className="lr-kpi-icon-box lr-icon-purple">
            <Users size={20} />
          </div>
          <div className="lr-kpi-content">
            <div className="lr-kpi-value">295</div>
            <span className="lr-kpi-label">Total Leads</span>
          </div>
        </div>

        <div className="lr-kpi-card">
          <div className="lr-kpi-icon-box lr-icon-orange">
            <UserCheck size={20} />
          </div>
          <div className="lr-kpi-content">
            <div className="lr-kpi-value">1</div>
            <span className="lr-kpi-label">Converted Leads</span>
          </div>
        </div>

        <div className="lr-kpi-card">
          <div className="lr-kpi-icon-box lr-icon-red">
            <UserX size={20} />
          </div>
          <div className="lr-kpi-content">
            <div className="lr-kpi-value">0</div>
            <span className="lr-kpi-label">Lost Leads</span>
          </div>
        </div>

        <div className="lr-kpi-card">
          <div className="lr-kpi-icon-box lr-icon-cyan">
            <TrendingUp size={20} />
          </div>
          <div className="lr-kpi-content">
            <div className="lr-kpi-value">0.3%</div>
            <span className="lr-kpi-label">Conversion Rate</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="lr-charts-grid">
        {/* Left Chart: Lead by Source */}
        <div className="lr-chart-card">
          <div className="lr-chart-header">
            <div className="lr-chart-icon-wrap" style={{ color: '#6366f1' }}>
              <BarChart3 size={16} />
            </div>
            <h3 className="lr-chart-title">Lead by Source</h3>
          </div>

          <div className="lr-svg-chart-container">
            <svg
              viewBox="0 0 520 195"
              className="lr-responsive-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y-Axis Grid Lines & Labels */}
              {[
                { val: 120, y: 15 },
                { val: 100, y: 42 },
                { val: 80, y: 69 },
                { val: 60, y: 96 },
                { val: 40, y: 123 },
                { val: 20, y: 150 },
                { val: 0, y: 172 }
              ].map((tick) => (
                <g key={tick.val}>
                  <line
                    x1="40"
                    y1={tick.y}
                    x2="505"
                    y2={tick.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x="32"
                    y={tick.y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10.5"
                    fontFamily="inherit"
                  >
                    {tick.val}
                  </text>
                </g>
              ))}

              {/* Bottom Baseline */}
              <line x1="40" y1="172" x2="505" y2="172" stroke="#e2e8f0" strokeWidth="1" />

              {/* Bars */}
              {sourceChartData.map((item, index) => {
                const totalWidth = 465;
                const slotWidth = totalWidth / sourceChartData.length;
                const barWidth = 34;
                const barX = 40 + index * slotWidth + (slotWidth - barWidth) / 2;
                const height = Math.max((item.count / 120) * 157, 4);
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

                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={barX - 16}
                          y={Math.max(barY - 26, 2)}
                          width={66}
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
                          {item.count} Leads
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Chart: Lead by Status */}
        <div className="lr-chart-card">
          <div className="lr-chart-header">
            <div className="lr-chart-icon-wrap" style={{ color: '#06b6d4' }}>
              <PieIcon size={16} />
            </div>
            <h3 className="lr-chart-title">Lead by Status</h3>
          </div>

          <div className="lr-donut-chart-container">
            {/* SVG Donut */}
            <div className="lr-donut-svg-box">
              <svg
                viewBox="0 0 200 200"
                className="lr-responsive-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                {donutSlices.map((slice, index) => {
                  const isHovered = hoveredPie === index;
                  return (
                    <path
                      key={slice.name}
                      d={slice.path}
                      fill={slice.fill}
                      opacity={hoveredPie === null || isHovered ? 1 : 0.75}
                      style={{
                        cursor: 'pointer',
                        transition: 'transform 0.15s, opacity 0.15s',
                        transformOrigin: '100px 100px',
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)'
                      }}
                      onMouseEnter={() => setHoveredPie(index)}
                      onMouseLeave={() => setHoveredPie(null)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Custom Legend */}
            <div className="lr-donut-legend">
              {statusChartData.map((item, idx) => (
                <div
                  key={idx}
                  className={`lr-donut-legend-item ${hoveredPie === idx ? 'highlight' : ''}`}
                  onMouseEnter={() => setHoveredPie(idx)}
                  onMouseLeave={() => setHoveredPie(null)}
                >
                  <div className="lr-legend-item-left">
                    <span className="lr-legend-dot" style={{ backgroundColor: item.fill }}></span>
                    <span className="lr-legend-label">{item.name}</span>
                  </div>
                  <span className="lr-legend-percent">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Details Table Card */}
      <div className="lr-table-card">
        <div className="lr-table-header-row">
          <div className="lr-table-title-wrap">
            <div className="lr-table-icon-box">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="lr-table-title">Lead Details</h3>
              <p className="lr-table-subtitle">Showing latest 10 records</p>
            </div>
          </div>
          <div className="lr-table-actions">
            <button className="lr-btn-print" onClick={handlePrintReport}>
              <Printer size={12} /> Print
            </button>
            <button className="lr-btn-excel" onClick={handleExportExcel}>
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>

        {/* Dashed controls line */}
        <div className="lr-table-controls">
          <div className="lr-entries-wrap">
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

          <div className="lr-search-wrap">
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

        <div className="lr-table-responsive">
          <table className="lr-custom-table">
            <thead>
              <tr>
                <th style={{ width: '38px' }} className="lr-th-sort">
                  # <span className="lr-sort-icon">&#8645;</span>
                </th>
                <th style={{ width: '90px' }}>Lead ID</th>
                <th>Lead Name</th>
                <th>Status</th>
                <th>Lead Source</th>
                <th>Lead Type</th>
                <th>Assigned To</th>
                <th style={{ width: '110px' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <tr key={row.id}>
                    <td className="lr-index-cell">{row.id}</td>
                    <td>
                      <span className="lr-link-lead">{row.leadId}</span>
                    </td>
                    <td>
                      <span className="lr-link-name">{row.leadName}</span>
                    </td>
                    <td>
                      <span className={`lr-status-badge lr-badge-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.source}</td>
                    <td>{row.type}</td>
                    <td>{row.assignedTo}</td>
                    <td>{row.created}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    No matching leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lr-table-footer">
          <div className="lr-footer-info">
            Showing 1 to {Math.min(currentData.length, 10)} of 295 entries
          </div>

          <div className="lr-pagination-bar">
            <button
              className="lr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              className="lr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &lsaquo;
            </button>
            <button className="lr-pg-btn active" onClick={() => setCurrentPage(1)}>1</button>
            <button className="lr-pg-btn" onClick={() => setCurrentPage(2)}>2</button>
            <button className="lr-pg-btn" onClick={() => setCurrentPage(3)}>3</button>
            <button className="lr-pg-btn" onClick={() => setCurrentPage(4)}>4</button>
            <button className="lr-pg-btn" onClick={() => setCurrentPage(5)}>5</button>
            <span className="lr-pg-dots">...</span>
            <button className="lr-pg-btn" onClick={() => setCurrentPage(30)}>30</button>
            <button
              className="lr-pg-btn"
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &rsaquo;
            </button>
            <button
              className="lr-pg-btn"
              onClick={() => setCurrentPage(30)}
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
