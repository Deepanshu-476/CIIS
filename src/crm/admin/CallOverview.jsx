import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiPhoneCall,
  FiClock,
  FiAward,
  FiUserCheck,
  FiRepeat,
  FiCheckCircle,
  FiRotateCcw,
  FiChevronRight,
  FiEye,
  FiCalendar
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../utils/axiosConfig';
import './CallOverview.css';

// 8 Quick Access Items matching layout
const quickAccessItems = [
  {
    title: "Assigned Calls",
    sub: "View calls assigned",
    icon: FiUserCheck,
    colorClass: "bg-blue-600",
    path: "/ciisUser/crm/admin/assigned-calls"
  },
  {
    title: "Today's Calls",
    sub: "Calls made today",
    icon: FiPhoneCall,
    colorClass: "bg-purple-600",
    path: "/ciisUser/crm/admin/todays-calls"
  },
  {
    title: "Pending Calls",
    sub: "Calls awaiting action",
    icon: FiClock,
    colorClass: "bg-orange-500",
    path: "/ciisUser/crm/admin/pending-calls"
  },
  {
    title: "Scheduled Calls",
    sub: "Scheduled callbacks",
    icon: FiCalendar, 
    colorClass: "bg-indigo-600",
    path: "/ciisUser/crm/admin/scheduled-calls"
  },
  {
    title: "Transferred Calls",
    sub: "Calls transferred to others",
    icon: FiRepeat,
    colorClass: "bg-emerald-600",
    path: "/ciisUser/crm/admin/transferred-calls"
  },
  {
    title: "Completed Calls",
    sub: "Successfully completed calls",
    icon: FiCheckCircle,
    colorClass: "bg-violet-600",
    path: "/ciisUser/crm/admin/completed-calls"
  },
  {
    title: "Converted Calls",
    sub: "Calls converted successfully",
    icon: FiAward,
    colorClass: "bg-teal-600",
    path: "/ciisUser/crm/admin/converted-calls"
  },
  {
    title: "Call History",
    sub: "Complete call log",
    icon: FiRotateCcw,
    colorClass: "bg-amber-600",
    path: "/ciisUser/crm/admin/call-history"
  }
];

// SVG Curve Generator for Call Trends
const generateCallSvgPath = (data, key) => {
  if (!data || data.length === 0) return '';
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.calls || 0, d.connected || 0)));
  const points = data.map((d, i) => {
    const x = 40 + (i / Math.max(1, data.length - 1)) * 490;
    const y = 185 - ((d[key] || 0) / (maxVal * 1.2 || 1)) * 160;
    return { x, y };
  });

  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const prev = a[i - 1];
    const cx1 = (prev.x + (point.x - prev.x) / 2).toFixed(1);
    const cy1 = prev.y.toFixed(1);
    const cx2 = (prev.x + (point.x - prev.x) / 2).toFixed(1);
    const cy2 = point.y.toFixed(1);
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }, '');
};

export default function CallOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedLeads: 0,
    todaysCalls: 0,
    pendingFollowUps: 0,
    convertedCalls: 0
  });
  const [todaysFollowUps, setTodaysFollowUps] = useState([]);
  const [upcomingScheduledCalls, setUpcomingScheduledCalls] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [outcomeData, setOutcomeData] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [callHoverIndex, setCallHoverIndex] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/crm/admin/calls/overview', { cache: false })
      .then(res => {
        if (!active) return;
        const d = res.data || {};
        if (d.stats) setStats(d.stats);
        if (Array.isArray(d.todaysFollowUps)) setTodaysFollowUps(d.todaysFollowUps);
        if (Array.isArray(d.upcomingScheduledCalls)) setUpcomingScheduledCalls(d.upcomingScheduledCalls);
        if (Array.isArray(d.trends)) setTrendData(d.trends);
        if (Array.isArray(d.outcomes)) setOutcomeData(d.outcomes);
        if (Array.isArray(d.recentCalls)) setRecentCalls(d.recentCalls);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load call overview data:', err);
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const statCardsData = [
    {
      title: "Assigned Leads",
      value: stats.assignedLeads ?? 0,
      badge: "Active Leads",
      badgeType: "purple",
      icon: FiUsers,
      iconBg: "bg-purple-100 text-purple-600"
    },
    {
      title: "Today's Calls",
      value: stats.todaysCalls ?? 0,
      badge: "Completed Today",
      badgeType: "teal",
      icon: FiPhoneCall,
      iconBg: "bg-teal-100 text-teal-600"
    },
    {
      title: "Pending Follow Ups",
      value: stats.pendingFollowUps ?? 0,
      badge: "Needs Attention",
      badgeType: "amber",
      icon: FiCalendar,
      iconBg: "bg-amber-100 text-amber-600"
    },
    {
      title: "Converted Calls",
      value: stats.convertedCalls ?? 0,
      badge: "Successful Conversions",
      badgeType: "emerald",
      icon: FiAward,
      iconBg: "bg-emerald-100 text-emerald-600"
    }
  ];

  const activeCallPoint = callHoverIndex !== null && trendData[callHoverIndex] ? trendData[callHoverIndex] : null;

  const filteredCalls = recentCalls.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.lead || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.source || '').toLowerCase().includes(q)
    );
  });

  const displayedCalls = filteredCalls.slice(0, entriesPerPage);

  return (
    <div className="co-root">
      {/* Page Header & Breadcrumbs */}
      <div className="co-page-header">
        <h1 className="co-page-title">Call Management</h1>
        <div className="co-breadcrumb">
          <span>Dashboard</span>
          <span className="separator">&gt;</span>
          <span className="active">Call Management</span>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="co-stats-grid">
        {statCardsData.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div key={idx} className="co-stat-card">
              <div className="co-stat-left">
                <span className="co-stat-label">{card.title}</span>
                <div className="co-stat-value">{loading ? '...' : card.value}</div>
                <div className={`co-stat-badge badge-${card.badgeType}`}>
                  {card.badge}
                </div>
              </div>
              <div className={`co-stat-icon-wrapper ${card.iconBg}`}>
                <IconComp size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Card */}
      <div className="co-card co-quick-access-card">
        <div className="co-card-header">
          <div>
            <h2 className="co-card-title">Quick Access</h2>
            <p className="co-card-sub">Navigate to call sections</p>
          </div>
        </div>
        <div className="co-card-body">
          <div className="co-quick-grid">
            {quickAccessItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  className="co-quick-btn"
                  key={idx}
                  onClick={() => item.path && navigate(item.path)}
                >
                  <div className={`co-quick-icon-box ${item.colorClass}`}>
                    <IconComponent size={16} color="#ffffff" />
                  </div>
                  <div className="co-quick-info">
                    <span className="co-quick-title">{item.title}</span>
                    <span className="co-quick-sub">{item.sub}</span>
                  </div>
                  <FiChevronRight className="co-quick-arrow" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Today's Follow-ups & Upcoming Scheduled Calls */}
      <div className="co-row-two-col">
        {/* Today's Follow-ups */}
        <div className="co-card mini-table-card">
          <div className="co-card-header flex-between">
            <h2 className="co-card-title">Today's Follow-ups</h2>
            <span className="co-header-badge bg-amber-badge">{todaysFollowUps.length} Due</span>
          </div>
          <div className="co-card-body p-0">
            <div className="co-mini-table-header">
              <span>Customer</span>
              <span>Time</span>
              <span>Status</span>
            </div>
            {todaysFollowUps.length > 0 ? (
              <div className="co-mini-table-list">
                {todaysFollowUps.map(item => (
                  <div key={item.id} className="co-mini-table-row">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="text-slate-600">{item.time}</span>
                    <span className="co-outcome-pill outcome-followup">{item.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="co-empty-state">
                <div className="empty-icon-box">
                  <FiCalendar size={20} />
                </div>
                <span>No follow-ups scheduled today</span>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Scheduled Calls */}
        <div className="co-card mini-table-card">
          <div className="co-card-header flex-between">
            <h2 className="co-card-title">Upcoming Scheduled Calls</h2>
            <span className="co-header-badge bg-purple-badge">{upcomingScheduledCalls.length} Today</span>
          </div>
          <div className="co-card-body p-0">
            <div className="co-mini-table-header">
              <span>Customer</span>
              <span>Time</span>
              <span>Purpose</span>
            </div>
            {upcomingScheduledCalls.length > 0 ? (
              <div className="co-mini-table-list">
                {upcomingScheduledCalls.map(item => (
                  <div key={item.id} className="co-mini-table-row">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="text-slate-600">{item.time}</span>
                    <span className="text-slate-600 truncate">{item.purpose}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="co-empty-state">
                <div className="empty-icon-box">
                  <FiCalendar size={20} />
                </div>
                <span>No upcoming scheduled calls</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Call Trends & Call Outcomes */}
      <div className="co-row-two-col charts-row">
        {/* Call Trends */}
        <div className="co-card chart-card">
          <div className="co-card-header">
            <h2 className="co-card-title">Call Trends</h2>
          </div>
          <div className="co-card-body">
            <div className="co-trend-legend-header">
              <span className="legend-item">
                <span className="legend-box bg-purple" /> Calls Made
              </span>
              <span className="legend-item">
                <span className="legend-box bg-teal" /> Connected
              </span>
            </div>

            <div className="co-svg-chart-container">
              {trendData.length > 0 ? (
                <svg viewBox="0 0 550 220" className="co-svg-trend-chart">
                  {[40, 30, 20, 10, 0].map((val, idx) => {
                    const y = 25 + idx * 40;
                    return (
                      <g key={val}>
                        <line x1="40" y1={y} x2="530" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                        <text x="32" y={y + 3} textAnchor="end" fontSize="10" fill="#64748b" fontWeight="500">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {trendData.map((d, i) => {
                    const x = 40 + (i / Math.max(1, trendData.length - 1)) * 490;
                    return (
                      <text key={d.day || i} x={x} y="210" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="500">
                        {d.day}
                      </text>
                    );
                  })}

                  <path
                    d={generateCallSvgPath(trendData, 'connected')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  <path
                    d={generateCallSvgPath(trendData, 'calls')}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {trendData.map((d, i) => {
                    const maxVal = Math.max(1, ...trendData.map(t => Math.max(t.calls || 0, t.connected || 0)));
                    const x = 40 + (i / Math.max(1, trendData.length - 1)) * 490;
                    const yCalls = 185 - ((d.calls || 0) / (maxVal * 1.2 || 1)) * 160;
                    const yConn = 185 - ((d.connected || 0) / (maxVal * 1.2 || 1)) * 160;
                    return (
                      <g key={i} onMouseEnter={() => setCallHoverIndex(i)} onMouseLeave={() => setCallHoverIndex(null)}>
                        <circle cx={x} cy={yCalls} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="2" className="chart-dot" />
                        <circle cx={x} cy={yConn} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" className="chart-dot" />
                        <rect x={x - 15} y="15" width="30" height="180" fill="transparent" style={{ cursor: 'pointer' }} />
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="co-empty-state">
                  <span>No trend data available yet</span>
                </div>
              )}

              {activeCallPoint && (
                <div
                  className="co-svg-chart-tooltip"
                  style={{
                    left: `${40 + (callHoverIndex / Math.max(1, trendData.length - 1)) * 85}%`,
                    top: '25px'
                  }}
                >
                  <strong>{activeCallPoint.day}</strong>
                  <div><span className="dot bg-purple" /> Calls Made: {activeCallPoint.calls}</div>
                  <div><span className="dot bg-teal" /> Connected: {activeCallPoint.connected}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call Outcomes */}
        <div className="co-card chart-card">
          <div className="co-card-header">
            <h2 className="co-card-title">Call Outcomes</h2>
          </div>
          <div className="co-card-body">
            {outcomeData.length > 0 ? (
              <div className="co-outcome-wrapper">
                <div className="co-donut-container">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie
                        data={outcomeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {outcomeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="co-outcome-legend-list">
                  {outcomeData.map((item, idx) => (
                    <div className="co-outcome-legend-item" key={idx}>
                      <span className="dot" style={{ backgroundColor: item.color }} />
                      <div className="info">
                        <span className="name">{item.name}</span>
                        <span className="sub">{item.percent}</span>
                      </div>
                      <span className="val">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="co-empty-state">
                <span>No call outcome records yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Calls Table */}
      <div className="co-card co-recent-calls-card">
        <div className="co-card-header flex-between">
          <h2 className="co-card-title">Recent Calls</h2>
          <button className="co-view-all-btn" onClick={() => navigate('/ciisUser/crm/admin/call-history')}>
            <FiClock size={12} style={{ marginRight: 4 }} /> View All
          </button>
        </div>

        {/* Controls Bar */}
        <div className="co-table-controls">
          <div className="co-entries-selector">
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="co-search-box">
            <label>Search:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
            />
          </div>
        </div>

        {/* Table View */}
        <div className="co-table-responsive">
          <table className="co-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>SL</th>
                <th>LEAD</th>
                <th>NAME</th>
                <th>PHONE</th>
                <th>SOURCE</th>
                <th>LEAD TYPE</th>
                <th>CALL TYPE</th>
                <th>OUTCOME</th>
                <th>REMARKS</th>
                <th>CALL TIME</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {displayedCalls.length > 0 ? (
                displayedCalls.map((item, idx) => (
                  <tr key={item.callId || idx}>
                    <td>{idx + 1}</td>
                    <td className="font-semibold text-slate-700">{item.lead}</td>
                    <td className="font-medium text-slate-900">{item.name}</td>
                    <td className="text-slate-600">{item.phone}</td>
                    <td>
                      <span className={`co-source-pill source-${item.sourceType}`}>
                        {item.source}
                      </span>
                    </td>
                    <td>
                      <span className={`co-type-pill type-${item.leadTypeClass}`}>
                        {item.leadType}
                      </span>
                    </td>
                    <td>
                      <span className="co-calltype-pill">
                        {item.callType}
                      </span>
                    </td>
                    <td>
                      <span className={`co-outcome-pill outcome-${item.outcomeClass}`}>
                        {item.outcome}
                      </span>
                    </td>
                    <td className="co-remark-cell">{item.remarks}</td>
                    <td>
                      <div className="co-time-cell">
                        <span className="main-time">{item.callTime}</span>
                        <span className="ago-time">{item.ago}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="co-action-btn"
                        title="View Call Details"
                        onClick={() => navigate('/ciisUser/crm/admin/call-history')}
                      >
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="co-empty-row">
                    {loading ? 'Loading recent calls...' : 'No recent calls found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="co-table-footer">
          <div className="co-entries-info">
            Showing {displayedCalls.length > 0 ? 1 : 0} to {displayedCalls.length} of {filteredCalls.length} entries
          </div>

          <div className="co-pagination">
            <button disabled className="page-btn">&laquo;</button>
            <button disabled className="page-btn">&lsaquo;</button>
            <button className="page-btn active">1</button>
            <button disabled className="page-btn">&rsaquo;</button>
            <button disabled className="page-btn">&raquo;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
