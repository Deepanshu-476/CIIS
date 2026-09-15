import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Phone,
  ThumbsUp,
  Target,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { exportToExcel, handlePrintReport } from './reportExportUtils';
import './ConversionFunnelReports.css';

const funnelChartData = [
  { stage: 'Total Leads', count: 295, fill: '#6366f1' },
  { stage: 'Contacted', count: 18, fill: '#10b981' },
  { stage: 'Interested', count: 2, fill: '#06b6d4' },
  { stage: 'Converted', count: 1, fill: '#f59e0b' },
  { stage: 'This Month', count: 0, fill: '#ef4444' },
];

const initialFunnelTableData = [
  { id: 1, source: 'Phone Call', type: 'Admission Enquiry', totalLeads: 109, contacted: 0, interested: 0, converted: 0, convRate: 0 },
  { id: 2, source: 'Google Ads', type: 'CUET', totalLeads: 59, contacted: 4, interested: 0, converted: 0, convRate: 0 },
  { id: 3, source: 'Google Ads', type: 'NDA', totalLeads: 41, contacted: 0, interested: 0, converted: 0, convRate: 0 },
  { id: 4, source: 'School Visit', type: 'Counselling', totalLeads: 37, contacted: 0, interested: 0, converted: 0, convRate: 0 },
  { id: 5, source: 'Instagram', type: 'JEE', totalLeads: 21, contacted: 6, interested: 0, converted: 0, convRate: 0 },
  { id: 6, source: 'WhatsApp', type: 'Foundation', totalLeads: 20, contacted: 0, interested: 0, converted: 0, convRate: 0 },
  { id: 7, source: 'Facebook', type: 'NEET', totalLeads: 7, contacted: 7, interested: 1, converted: 1, convRate: 14.3 },
  { id: 8, source: 'Self', type: 'Marketing', totalLeads: 1, contacted: 1, interested: 1, converted: 0, convRate: 0 },
];

export default function ConversionFunnelReports() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('01-09-2026');

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredBar, setHoveredBar] = useState(null);

  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('01-09-2026');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return initialFunnelTableData.filter((item) =>
      item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredData.slice(start, start + entriesPerPage);
  }, [filteredData, currentPage, entriesPerPage]);

  const handleExportExcel = () => {
    exportToExcel(filteredData, 'Conversion_Funnel_Report', 'ConversionFunnel');
  };

  return (
    <div className="cfr-page-wrapper">
      {/* Header & Breadcrumb */}
      <div className="cfr-header">
        <h1 className="cfr-title">Conversion Funnel</h1>
        <div className="cfr-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <span className="cfr-bc-sep">&gt;</span>
          <Link to="/ciisUser/crm/reports/overview">Reports</Link>
          <span className="cfr-bc-sep">&gt;</span>
          <span className="cfr-bc-active">Conversion Funnel</span>
        </div>
      </div>

      {/* Filter Card */}
      <div className="cfr-filter-card">
        <div className="cfr-filter-col">
          <label>From</label>
          <input
            type="text"
            placeholder="DD-MM-YYYY"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="cfr-filter-col">
          <label>To</label>
          <input
            type="text"
            placeholder="01-09-2026"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="cfr-filter-actions">
          <button className="cfr-btn-apply" onClick={handleApplyFilter}>
            <Filter size={13} /> Apply
          </button>
          <button className="cfr-btn-reset" onClick={handleResetFilter} title="Reset Filters">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="cfr-kpi-grid">
        <div className="cfr-kpi-card">
          <div className="cfr-kpi-left">
            <span className="cfr-kpi-label">Overall Conversion</span>
            <div className="cfr-kpi-value">0.3%</div>
          </div>
          <div className="cfr-kpi-icon-box cfr-icon-purple">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="cfr-kpi-card">
          <div className="cfr-kpi-left">
            <span className="cfr-kpi-label">Lead to Contact</span>
            <div className="cfr-kpi-value">6.1%</div>
          </div>
          <div className="cfr-kpi-icon-box cfr-icon-green">
            <Phone size={20} />
          </div>
        </div>

        <div className="cfr-kpi-card">
          <div className="cfr-kpi-left">
            <span className="cfr-kpi-label">Contact to Interest</span>
            <div className="cfr-kpi-value">11.1%</div>
          </div>
          <div className="cfr-kpi-icon-box cfr-icon-cyan">
            <ThumbsUp size={20} />
          </div>
        </div>

        <div className="cfr-kpi-card">
          <div className="cfr-kpi-left">
            <span className="cfr-kpi-label">Interest to Convert</span>
            <div className="cfr-kpi-value">50%</div>
          </div>
          <div className="cfr-kpi-icon-box cfr-icon-orange">
            <Target size={20} />
          </div>
        </div>
      </div>

      {/* Lead Conversion Funnel Main Section */}
      <div className="cfr-funnel-card">
        <div className="cfr-funnel-header">
          <h3 className="cfr-funnel-title">Lead Conversion Funnel</h3>
        </div>

        <div className="cfr-funnel-grid">
          {/* Left Standalone SVG Bar Chart */}
          <div className="cfr-chart-container">
            <svg
              viewBox="0 0 540 220"
              className="cfr-responsive-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y-Axis Grid Lines & Labels */}
              {[
                { val: 300, y: 15 },
                { val: 250, y: 44 },
                { val: 200, y: 73 },
                { val: 150, y: 102 },
                { val: 100, y: 131 },
                { val: 50, y: 160 },
                { val: 0, y: 188 }
              ].map((tick) => (
                <g key={tick.val}>
                  <line
                    x1="45"
                    y1={tick.y}
                    x2="520"
                    y2={tick.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x="35"
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
              <line x1="45" y1="188" x2="520" y2="188" stroke="#e2e8f0" strokeWidth="1" />

              {/* 5 Funnel Bars */}
              {funnelChartData.map((item, index) => {
                const totalWidth = 475;
                const slotWidth = totalWidth / funnelChartData.length;
                const barWidth = 48;
                const barX = 45 + index * slotWidth + (slotWidth - barWidth) / 2;
                const height = Math.max((item.count / 300) * 173, item.count > 0 ? 4 : 0);
                const barY = 188 - height;
                const isHovered = hoveredBar === index;

                return (
                  <g
                    key={item.stage}
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {height > 0 && (
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={height}
                        fill={item.fill}
                        rx="4"
                        ry="4"
                        opacity={hoveredBar === null || isHovered ? 1 : 0.75}
                        style={{ transition: 'all 0.15s' }}
                      />
                    )}
                    <text
                      x={barX + barWidth / 2}
                      y="206"
                      textAnchor="middle"
                      fill={isHovered ? '#0f172a' : '#64748b'}
                      fontSize="10.5"
                      fontWeight={isHovered ? '600' : '400'}
                    >
                      {item.stage}
                    </text>

                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={barX + barWidth / 2 - 36}
                          y={Math.max(barY - 26, 4)}
                          width={72}
                          height={20}
                          rx="3"
                          fill="#0f172a"
                        />
                        <text
                          x={barX + barWidth / 2}
                          y={Math.max(barY - 12, 18)}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10.5"
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

          {/* Right 5 Funnel Stages */}
          <div className="cfr-stages-list">
            {funnelChartData.map((stage) => {
              const maxVal = 295;
              const pct = maxVal > 0 ? Math.max((stage.count / maxVal) * 100, stage.count > 0 ? 2 : 0) : 0;
              return (
                <div key={stage.stage} className="cfr-stage-item">
                  <div className="cfr-stage-top">
                    <span className="cfr-stage-val" style={{ color: stage.fill }}>
                      {stage.count}
                    </span>
                    <span className="cfr-stage-lbl">{stage.stage}</span>
                  </div>
                  <div className="cfr-stage-bar-bg">
                    <div
                      className="cfr-stage-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: stage.fill
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conversion Rate by Source Table Card */}
      <div className="cfr-table-card">
        <div className="cfr-table-header-row">
          <div className="cfr-table-title-wrap">
            <div className="cfr-table-icon-box">
              <Layers size={16} />
            </div>
            <h3 className="cfr-table-title">Conversion Rate by Source</h3>
          </div>
          <div className="cfr-table-actions">
            <button className="cfr-btn-print" onClick={handlePrintReport}>
              <Printer size={12} /> Print
            </button>
            <button className="cfr-btn-excel" onClick={handleExportExcel}>
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>

        {/* Dashed controls line */}
        <div className="cfr-table-controls">
          <div className="cfr-entries-wrap">
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

          <div className="cfr-search-wrap">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search source or type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="cfr-table-responsive">
          <table className="cfr-custom-table">
            <thead>
              <tr>
                <th style={{ width: '38px' }} className="cfr-th-sort">
                  # <span className="cfr-sort-icon">&#8645;</span>
                </th>
                <th>Lead Source</th>
                <th>Lead Type</th>
                <th style={{ textAlign: 'center' }}>Total Leads</th>
                <th style={{ textAlign: 'center' }}>Contacted</th>
                <th style={{ textAlign: 'center' }}>Interested</th>
                <th style={{ textAlign: 'center' }}>Converted</th>
                <th style={{ width: '220px' }}>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((row) => (
                  <tr key={row.id}>
                    <td className="cfr-index-cell">{row.id}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{row.source}</td>
                    <td>{row.type}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.totalLeads}</td>
                    <td style={{ textAlign: 'center' }}>{row.contacted}</td>
                    <td style={{ textAlign: 'center' }}>{row.interested}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.converted}</td>
                    <td>
                      <div className="cfr-table-rate-wrap">
                        <div className="cfr-table-progress-bg">
                          <div
                            className="cfr-table-progress-fill"
                            style={{
                              width: `${Math.min(row.convRate, 100)}%`,
                              backgroundColor: row.convRate > 0 ? '#f59e0b' : '#cbd5e1'
                            }}
                          ></div>
                        </div>
                        <span className="cfr-rate-text">{row.convRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No funnel records found matching current search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="cfr-table-footer">
          <div className="cfr-footer-info">
            Showing 1 to {Math.min(currentData.length, 10)} of {filteredData.length} entries
          </div>

          <div className="cfr-pagination-bar">
            <button
              className="cfr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              className="cfr-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &lsaquo;
            </button>
            <button className="cfr-pg-btn active" onClick={() => setCurrentPage(1)}>1</button>
            <button
              className="cfr-pg-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &rsaquo;
            </button>
            <button
              className="cfr-pg-btn"
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
