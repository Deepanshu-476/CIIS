import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
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
  FiCalendar,
  FiFilter
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './CallOverview.css';

// 4 Top Stat Cards Data matching screenshot
const statCardsData = [
  {
    title: "Assigned Leads",
    value: "11",
    badge: "Active Leads",
    badgeType: "purple",
    icon: FiUsers,
    iconBg: "bg-purple-100 text-purple-600"
  },
  {
    title: "Today's Calls",
    value: "0",
    badge: "Completed Today",
    badgeType: "teal",
    icon: FiPhoneCall,
    iconBg: "bg-teal-100 text-teal-600"
  },
  {
    title: "Pending Follow Ups",
    value: "0",
    badge: "Needs Attention",
    badgeType: "amber",
    icon: FiCalendar,
    iconBg: "bg-amber-100 text-amber-600"
  },
  {
    title: "Converted Calls",
    value: "1",
    badge: "Successful Conversions",
    badgeType: "emerald",
    icon: FiAward,
    iconBg: "bg-emerald-100 text-emerald-600"
  }
];

// 8 Quick Access Items matching screenshot layout
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

  // Call Trends Data with rich, visible curves
  const trendData = [
    { day: 'Wed', calls: 12, connected: 8 },
  { day: 'Thu', calls: 18, connected: 14 },
  { day: 'Fri', calls: 28, connected: 22 },
  { day: 'Sat', calls: 16, connected: 11 },
  { day: 'Sun', calls: 6,  connected: 4 },
  { day: 'Mon', calls: 35, connected: 26 },
  { day: 'Tue', calls: 24, connected: 18 }
];

// Call Outcomes Donut Data
const outcomeData = [
  { name: 'Converted', value: 1, percent: '100.0% of calls', color: '#10b981' },
  { name: 'Connected', value: 0, percent: '0.0% of calls', color: '#6366f1' },
  { name: 'Interested', value: 0, percent: '0.0% of calls', color: '#f59e0b' },
  { name: 'Not Interested', value: 0, percent: '0.0% of calls', color: '#94a3b8' },
  { name: 'Need Callback', value: 0, percent: '0.0% of calls', color: '#06b6d4' }
];

// Recent Calls List
const recentCallsData = [
  {
    sl: 1,
    lead: '#LD-008',
    name: 'Ashok Pillai',
    phone: '8016315999',
    source: 'Facebook',
    sourceType: 'facebook',
    leadType: 'NEET',
    leadTypeClass: 'neet',
    callType: 'Outbound',
    outcome: 'Follow-up',
    outcomeClass: 'followup',
    remarks: 'required next followup for this',
    callTime: '24 Aug 2026 02:45 PM',
    ago: '1 week ago'
  },
  {
    sl: 2,
    lead: '#LD-007',
    name: 'Zara Nair',
    phone: '8879968460',
    source: 'Facebook',
    sourceType: 'facebook',
    leadType: 'NEET',
    leadTypeClass: 'neet',
    callType: 'Outbound',
    outcome: 'Converted',
    outcomeClass: 'converted',
    remarks: 'converted in first call the lead id = Ld..',
    callTime: '24 Aug 2026 02:28 PM',
    ago: '1 week ago'
  }
];

// Helper to format outcome name nicely
const formatOutcomeName = (name) => {
  if (!name) return 'Other';
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Custom Floating Tooltip for Call Outcomes DonutChart
const CustomOutcomeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="co-outcome-custom-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-dot" style={{ backgroundColor: item.payload?.color || '#6366f1' }} />
          <span className="tooltip-name">{formatOutcomeName(item.name)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Calls:</span>
          <span className="tooltip-val">{item.value}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Share:</span>
          <span className="tooltip-pct">{item.payload?.percent || '—'}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function CallOverview() {
  const navigate = useNavigate();
  const [statCards, setStatCards] = useState(statCardsData);
  const [trendRange, setTrendRange] = useState('7d');
  const [trendList7d, setTrendList7d] = useState(trendData);
  const [trendList30d, setTrendList30d] = useState([]);
  const [outcomeList, setOutcomeList] = useState(outcomeData);
  const [recentCalls, setRecentCalls] = useState(recentCallsData);
  const [selectedCall, setSelectedCall] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      try {
        const res = await axiosInstance.get('/crm/admin/calls/overview', { _skipErrorNotify: true });
        if (isMounted && res.data) {
          if (Array.isArray(res.data.statCards)) {
            setStatCards(res.data.statCards.map((c, i) => ({
              ...c,
              icon: statCardsData[i]?.icon || FiPhoneCall,
              iconBg: statCardsData[i]?.iconBg || 'bg-purple-100 text-purple-600'
            })));
          }
          if (Array.isArray(res.data.trendData) && res.data.trendData.length > 0) {
            setTrendList7d(res.data.trendData);
          }
          if (Array.isArray(res.data.trendData30d) && res.data.trendData30d.length > 0) {
            setTrendList30d(res.data.trendData30d);
          }
          if (Array.isArray(res.data.outcomeData) && res.data.outcomeData.length > 0) {
            setOutcomeList(res.data.outcomeData);
          }
          if (Array.isArray(res.data.recentCalls)) {
            setRecentCalls(res.data.recentCalls);
          }
        }
      } catch {
        // Keep the dashboard's empty/default state when live metrics are unavailable.
      }
    };
    fetchOverview();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCall) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedCall(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedCall]);

  const activeTrendData = trendRange === '30d' && trendList30d.length > 0 ? trendList30d : trendList7d;
  const totalCallsInPeriod = activeTrendData.reduce((acc, curr) => acc + (Number(curr.calls) || 0), 0);
  const totalConnectedInPeriod = activeTrendData.reduce((acc, curr) => acc + (Number(curr.connected) || 0), 0);
  const connectRateInPeriod = totalCallsInPeriod > 0 ? Math.round((totalConnectedInPeriod / totalCallsInPeriod) * 100) : 0;
  const trendMax = Math.max(1, ...activeTrendData.flatMap(item => [Number(item.calls) || 0, Number(item.connected) || 0]));
  const standardOutcomeCategories = [
    { key: 'answered', name: 'Answered', color: '#10b981' },
    { key: 'missed', name: 'Missed Calls', color: '#f59e0b' },
    { key: 'not reachable', name: 'Not Reachable', color: '#06b6d4' },
    { key: 'rejected', name: 'Rejected / Busy', color: '#ef4444' }
  ];

  const totalOutcomeCalls = outcomeList.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  const outcomeValueMap = {};
  (outcomeList || []).forEach(item => {
    const k = String(item.name || '').toLowerCase().trim();
    outcomeValueMap[k] = Number(item.value) || 0;
  });

  const displayOutcomes = standardOutcomeCategories.map(cat => {
    const val = outcomeValueMap[cat.key] || outcomeValueMap[cat.name.toLowerCase()] || 0;
    const pct = totalOutcomeCalls > 0 ? ((val / totalOutcomeCalls) * 100).toFixed(1) : '0.0';
    return {
      ...cat,
      value: val,
      percent: pct
    };
  });

  // Include any extra statuses returned from API
  (outcomeList || []).forEach(item => {
    const k = String(item.name || '').toLowerCase().trim();
    const isStandard = standardOutcomeCategories.some(c => c.key === k || c.name.toLowerCase() === k);
    if (!isStandard && (Number(item.value) || 0) > 0) {
      const val = Number(item.value) || 0;
      const pct = totalOutcomeCalls > 0 ? ((val / totalOutcomeCalls) * 100).toFixed(1) : '0.0';
      displayOutcomes.push({
        key: k,
        name: formatOutcomeName(item.name),
        color: item.color || '#8b5cf6',
        value: val,
        percent: pct
      });
    }
  });

  const donutData = totalOutcomeCalls > 0
    ? displayOutcomes.filter(d => d.value > 0)
    : [{ name: 'No Calls', value: 1, color: '#e2e8f0', percent: '0' }];

  const filteredCalls = recentCalls.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.lead && c.lead.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.source && c.source.toLowerCase().includes(q))
    );
  });

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
        {statCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div key={idx} className="co-stat-card">
              <div className="co-stat-left">
                <span className="co-stat-label">{card.title}</span>
                <div className="co-stat-value">{card.value}</div>
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
            <span className="co-header-badge bg-amber-badge">0 Due</span>
          </div>
          <div className="co-card-body p-0">
            <div className="co-mini-table-header">
              <span>Customer</span>
              <span>Time</span>
              <span>Status</span>
            </div>
            <div className="co-empty-state">
              <div className="empty-icon-box">
                <FiCalendar size={20} />
              </div>
              <span>No follow-ups scheduled today</span>
            </div>
          </div>
        </div>

        {/* Upcoming Scheduled Calls */}
        <div className="co-card mini-table-card">
          <div className="co-card-header flex-between">
            <h2 className="co-card-title">Upcoming Scheduled Calls</h2>
            <span className="co-header-badge bg-purple-badge">0 Today</span>
          </div>
          <div className="co-card-body p-0">
            <div className="co-mini-table-header">
              <span>Customer</span>
              <span>Time</span>
              <span>Purpose</span>
            </div>
            <div className="co-empty-state">
              <div className="empty-icon-box">
                <FiCalendar size={20} />
              </div>
              <span>No upcoming scheduled calls</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Call Trends & Call Outcomes */}
      {/* Row 4: Call Trends & Call Outcomes */}
      <div className="co-row-two-col charts-row">
        {/* Call Trends */}
        <div className="co-card chart-card co-trend-card">
          <div className="co-card-header flex-between">
            <div>
              <h2 className="co-card-title">Call Trends & Analytics</h2>
              <p className="co-card-sub">Daily outbound calls vs connected conversations</p>
            </div>
            <div className="co-trend-range-selector">
              <button
                type="button"
                className={`co-range-btn ${trendRange === '7d' ? 'active' : ''}`}
                aria-pressed={trendRange === '7d'}
                onClick={() => setTrendRange('7d')}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`co-range-btn ${trendRange === '30d' ? 'active' : ''}`}
                aria-pressed={trendRange === '30d'}
                onClick={() => setTrendRange('30d')}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="co-card-body co-normal-chart-body">
            {/* Compact summary metrics & legend */}
            <div className="co-normal-summary-strip">
              <div className="co-normal-stats">
                <div className="co-normal-stat-item calls">
                  <span className="co-normal-stat-value">{totalCallsInPeriod}</span>
                  <span className="co-normal-stat-label">Total Calls</span>
                </div>
                <div className="co-normal-stat-item connected">
                  <span className="co-normal-stat-value">{totalConnectedInPeriod}</span>
                  <span className="co-normal-stat-label">Connected</span>
                </div>
                <div className="co-normal-stat-item success">
                  <span className="co-normal-stat-value">{connectRateInPeriod}%</span>
                  <span className="co-normal-stat-label">Success Rate</span>
                </div>
              </div>
              <div className="co-normal-legend">
                <span className="co-legend-item">
                  <span className="co-legend-color bg-indigo" /> Calls Made
                </span>
                <span className="co-legend-item">
                  <span className="co-legend-color bg-emerald" /> Connected
                </span>
              </div>
            </div>

            {/* Native daily bar graph stays visible without SVG sizing dependencies. */}
            <div
              className={`co-trend-chart-wrapper ${trendRange === '30d' ? 'is-30-days' : ''}`}
              role="img"
              aria-label={`${trendRange === '30d' ? '30' : '7'} day calls and connected conversations graph`}
            >
              <div className="co-trend-y-axis" aria-hidden="true">
                <span>{trendMax}</span>
                <span>{Math.round(trendMax / 2)}</span>
                <span>0</span>
              </div>
              <div className="co-trend-plot">
                <span className="co-trend-grid-line top" aria-hidden="true" />
                <span className="co-trend-grid-line middle" aria-hidden="true" />
                <span className="co-trend-grid-line bottom" aria-hidden="true" />
                {activeTrendData.map((item, index) => {
                  const calls = Number(item.calls) || 0;
                  const connected = Number(item.connected) || 0;
                  const showLabel = trendRange === '7d' || index % 5 === 0 || index === activeTrendData.length - 1;
                  return (
                    <div
                      className="co-trend-day"
                      key={`${item.date || item.day}-${index}`}
                      aria-label={`${item.date || item.day}: ${calls} calls, ${connected} connected`}
                      tabIndex={0}
                    >
                      <div className="co-trend-hover-card" aria-hidden="true">
                        <strong>{item.date || item.day}</strong>
                        <span><i className="calls" />{calls} Calls</span>
                        <span><i className="connected" />{connected} Connected</span>
                      </div>
                      <div className="co-trend-bars">
                        <span
                          className="co-trend-bar calls"
                          style={{ height: calls ? `${Math.max(5, (calls / trendMax) * 100)}%` : 2 }}
                        />
                        <span
                          className="co-trend-bar connected"
                          style={{ height: connected ? `${Math.max(5, (connected / trendMax) * 100)}%` : 2 }}
                        />
                      </div>
                      <span className={`co-trend-day-label ${showLabel ? '' : 'visually-hidden-label'}`}>
                        {showLabel ? item.day : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Call Outcomes */}
        <div className="co-card chart-card co-outcomes-card">
          <div className="co-card-header flex-between">
            <div>
              <h2 className="co-card-title">Call Outcomes</h2>
              <p className="co-card-sub">Distribution by call status</p>
            </div>
            <span className="co-header-badge bg-purple-badge">
              {totalOutcomeCalls} Total Calls
            </span>
          </div>

          <div className="co-card-body co-normal-outcomes-body">
            <div className="co-outcome-wrapper">
              <div className="co-donut-container" style={{ width: 130, height: 130, minWidth: 130 }}>
                <ResponsiveContainer width={130} height={130} minWidth={0}>
                  <PieChart>
                    <Tooltip content={<CustomOutcomeTooltip />} />
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={58}
                      paddingAngle={totalOutcomeCalls > 0 ? 3 : 0}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={totalOutcomeCalls === 0 ? '#e2e8f0' : entry.color}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="co-donut-center-stat">
                  <span className="co-donut-center-num">{totalOutcomeCalls}</span>
                  <span className="co-donut-center-lbl">Total</span>
                </div>
              </div>

              <div className="co-outcome-breakdown-list">
                {displayOutcomes.map((item, idx) => (
                  <div className="co-normal-outcome-item" key={idx}>
                    <div className="co-normal-outcome-top">
                      <div className="co-normal-outcome-left">
                        <span className="co-outcome-dot" style={{ backgroundColor: item.color }} />
                        <span className="co-outcome-name">{item.name}</span>
                      </div>
                      <div className="co-normal-outcome-right">
                        <span className="co-outcome-val">{item.value}</span>
                        <span className="co-outcome-pct">({item.percent}%)</span>
                      </div>
                    </div>
                    <div className="co-outcome-bar">
                      <div
                        className="co-outcome-bar-fill"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Recent Calls Table */}
      <div className="co-card co-recent-calls-card">
        <div className="co-card-header flex-between">
          <h2 className="co-card-title">Recent Calls</h2>
          <button
            type="button"
            className="co-view-all-btn"
            onClick={() => navigate('/ciisUser/crm/admin/call-history')}
          >
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
              {filteredCalls.length > 0 ? (
                filteredCalls.map((item) => (
                  <tr key={item.sl}>
                    <td>{item.sl}</td>
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
                        aria-label={`View call details for ${item.name}`}
                        onClick={() => setSelectedCall(item)}
                      >
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="co-empty-row">
                    No recent calls found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="co-table-footer">
          <div className="co-entries-info">
            Showing 1 to {filteredCalls.length} of {filteredCalls.length} entries
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

      {selectedCall && (
        <div
          className="co-detail-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCall(null);
          }}
        >
          <section
            className="co-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="co-detail-title"
          >
            <header className="co-detail-header">
              <div>
                <span className="co-detail-eyebrow">Call record</span>
                <h2 id="co-detail-title">{selectedCall.name}</h2>
                <p>{selectedCall.lead}</p>
              </div>
              <button
                type="button"
                className="co-detail-close"
                aria-label="Close call details"
                onClick={() => setSelectedCall(null)}
              >
                &times;
              </button>
            </header>

            <div className="co-detail-body">
              <div className="co-detail-grid">
                <div><span>Phone</span><strong>{selectedCall.phone || '—'}</strong></div>
                <div><span>Call type</span><strong>{selectedCall.callType || '—'}</strong></div>
                <div><span>Outcome</span><strong>{selectedCall.outcome || '—'}</strong></div>
                <div><span>Call time</span><strong>{selectedCall.callTime || '—'}</strong></div>
                <div><span>Source</span><strong>{selectedCall.source || '—'}</strong></div>
                <div><span>Lead type</span><strong>{selectedCall.leadType || '—'}</strong></div>
                <div><span>Caller</span><strong>{selectedCall.caller || '—'}</strong></div>
                <div><span>Duration</span><strong>{selectedCall.duration || '—'}</strong></div>
              </div>
              <div className="co-detail-remarks">
                <span>Remarks</span>
                <p>{selectedCall.remarks || 'No remarks added.'}</p>
              </div>
            </div>

            <footer className="co-detail-footer">
              <button type="button" onClick={() => setSelectedCall(null)}>Close</button>
            </footer>
          </section>
        </div>
      )}

    </div>
  );
}
