import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiPhoneCall,
  FiTrendingUp,
  FiClock,
  FiUserCheck,
  FiCalendar,
  FiUserPlus,
  FiChevronRight,
  FiActivity,
  FiPieChart,
  FiAward
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axiosInstance from '../../utils/axiosConfig';
import './AdminCrmDashboard.css';

// 6 Stat Cards matching reference image
const initialStatCardsData = [
  {
    title: "Total Leads",
    value: "—",
    badge: "Live data",
    badgeType: "purple",
    icon: FiUsers,
    iconBg: "bg-purple-100 text-purple-600"
  },
  {
    title: "Total Calls",
    value: "—",
    badge: "Live data",
    badgeType: "green",
    icon: FiPhoneCall,
    iconBg: "bg-emerald-100 text-emerald-600"
  },
  {
    title: "Today's Follow-Ups",
    value: "—",
    badge: "Live data",
    badgeType: "yellow",
    icon: FiCalendar,
    iconBg: "bg-amber-100 text-amber-600"
  },
  {
    title: "Conversion Rate",
    value: "—",
    badge: "Live data",
    badgeType: "cyan",
    icon: FiTrendingUp,
    iconBg: "bg-cyan-100 text-cyan-600"
  },
  {
    title: "Pending Follow-Ups",
    value: "—",
    badge: "Live data",
    badgeType: "pink",
    icon: FiClock,
    iconBg: "bg-rose-100 text-rose-600"
  },
  {
    title: "Active Users",
    value: "—",
    badge: "Live data",
    badgeType: "blue",
    icon: FiUserCheck,
    iconBg: "bg-blue-100 text-blue-600"
  }
];

// SVG Curve Generator
const generateSvgPath = (data, key, chartMax) => {
  const points = data.map((d, i) => {
    const x = 45 + (i / Math.max(data.length - 1, 1)) * 685;
    const y = 175 - ((Number(d[key]) || 0) / chartMax) * 150;
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

const getChartScale = data => {
  const highest = Math.max(0, ...data.flatMap(item => [item.leads, item.calls, item.followUps].map(Number)));
  if (highest <= 0) return { max: 6, ticks: [6, 5, 4, 3, 2, 1, 0] };
  const targetStep = highest / 6;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const step = [1, 2, 5, 10].map(value => value * magnitude).find(value => value >= targetStep) || magnitude * 10;
  const max = step * 6;
  return { max, ticks: Array.from({ length: 7 }, (_, index) => max - (index * step)) };
};

// Quick Access Links
const quickAccessItems = [
  {
    title: "Lead Overview",
    sub: "View the live lead pipeline",
    icon: FiUsers,
    colorClass: "bg-blue-600",
    path: "/ciisUser/crm/admin/lead-overview"
  },
  {
    title: "Call Management",
    sub: "Manage assigned calls",
    icon: FiPhoneCall,
    colorClass: "bg-emerald-500",
    path: "/ciisUser/crm/admin/call-overview"
  },
  {
    title: "Follow-Up Center",
    sub: "Review scheduled follow-ups",
    icon: FiCalendar,
    colorClass: "bg-orange-500",
    path: "/ciisUser/crm/admin/follow-ups"
  },
  {
    title: "Assignment Center",
    sub: "Assign leads to telecallers",
    icon: FiUserPlus,
    colorClass: "bg-indigo-600",
    path: "/ciisUser/crm/admin/assignments"
  }
];

export default function AdminCrmDashboard() {
  const navigate = useNavigate();
  const [statCards, setStatCards] = useState(() => initialStatCardsData.map(card => ({ ...card, badge: 'Loading…' })));
  const [trendData, setTrendData] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);
  const [teamPerformanceData, setTeamPerformanceData] = useState([]);
  const [recentActivitiesList, setRecentActivitiesList] = useState([]);
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCrmData = async () => {
      try {
        const res = await axiosInstance.get('/crm/admin/dashboard', { _skipErrorNotify: true });
        if (isMounted && res.data) {
          if (res.data.metrics) {
            setStatCards([
              { title: "Total Leads", value: String(res.data.metrics.totalLeads ?? 0), badge: "Active Leads", badgeType: "purple", icon: FiUsers, iconBg: "bg-purple-100 text-purple-600" },
              { title: "Total Calls", value: String(res.data.metrics.totalCalls ?? 0), badge: `${res.data.metrics.todaysCalls ?? 0} today`, badgeType: "green", icon: FiPhoneCall, iconBg: "bg-emerald-100 text-emerald-600" },
              { title: "Today's Follow-Ups", value: String(res.data.metrics.todaysFollowUps ?? 0), badge: "Due Today", badgeType: "yellow", icon: FiCalendar, iconBg: "bg-amber-100 text-amber-600" },
              { title: "Conversion Rate", value: res.data.metrics.conversionRate || "0%", badge: "Overall", badgeType: "cyan", icon: FiTrendingUp, iconBg: "bg-cyan-100 text-cyan-600" },
              { title: "Pending Follow-Ups", value: String(res.data.metrics.pendingFollowUps ?? 0), badge: "Needs Attention", badgeType: "pink", icon: FiClock, iconBg: "bg-rose-100 text-rose-600" },
              { title: "Active Users", value: String(res.data.metrics.activeUsers ?? 0), badge: `${res.data.metrics.unassignedLeads ?? 0} unassigned`, badgeType: "blue", icon: FiUserCheck, iconBg: "bg-blue-100 text-blue-600" }
            ]);
          }
          setTrendData(Array.isArray(res.data.trendData) ? res.data.trendData : []);
          setPipelineData(Array.isArray(res.data.pipelineData) ? res.data.pipelineData : []);
          setTeamPerformanceData(Array.isArray(res.data.teamPerformance) ? res.data.teamPerformance : []);
          setRecentActivitiesList(Array.isArray(res.data.recentActivities) ? res.data.recentActivities : []);
          setTodaysSchedule(Array.isArray(res.data.todaysSchedule) ? res.data.todaysSchedule : []);
        }
      } catch {
        if (isMounted) {
          setStatCards(initialStatCardsData.map(card => ({ ...card, badge: 'No data', value: '0' })));
          setTrendData([]); setPipelineData([]); setTeamPerformanceData([]); setRecentActivitiesList([]); setTodaysSchedule([]);
        }
      }
    };
    fetchCrmData();
    return () => { isMounted = false; };
  }, []);

  const chartScale = useMemo(() => getChartScale(trendData), [trendData]);
  const yTicks = chartScale.ticks;
  const maxLeadValue = useMemo(() => Math.max(0, ...trendData.map(item => Number(item.leads) || 0)), [trendData]);
  const activePoint = hoverIndex !== null ? trendData[hoverIndex] : null;

  return (
    <div className="crm-admin-root">
      {/* Page Header */}
      <header className="crm-page-header">
        <h1 className="crm-page-title">Admin Dashboard</h1>
      </header>

      {/* Top 6 Stat Cards Grid */}
      <div className="crm-stats-grid">
        {statCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div key={idx} className="crm-stat-card">
              <div className="crm-stat-left">
                <span className="crm-stat-label">{card.title}</span>
                <div className="crm-stat-value">{card.value}</div>
                <div className={`crm-stat-badge badge-${card.badgeType}`}>
                  {card.badge}
                </div>
              </div>
              <div className={`crm-stat-icon-wrapper ${card.iconBg}`}>
                <IconComp size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Trend Chart & Lead Pipeline */}
      <div className="crm-dashboard-row row-charts">
        {/* Left: live 30-Day Lead, Call & Follow-Up Trends */}
        <div className="crm-card chart-card flex-grow-1">
          <div className="crm-card-header">
            <div className="crm-card-title">
              <FiTrendingUp className="header-icon text-indigo" />
              <span>30-Day Lead, Call & Follow-Up Trends</span>
            </div>
          </div>
          <div className="crm-card-body">
            {/* Custom Chart Legend Header matching image */}
            <div className="trend-legend-header">
              <span className="legend-item">
                <span className="legend-box bg-purple" /> New Leads
              </span>
              <span className="legend-item">
                <span className="legend-box bg-teal" /> Calls Made
              </span>
              <span className="legend-item">
                <span className="legend-box bg-yellow" /> Follow-Ups
              </span>
            </div>

            {/* Bulletproof Custom Vector SVG Chart */}
            <div className="svg-chart-container">
              <svg viewBox="0 0 750 230" className="svg-trend-chart">
                {/* Horizontal Grid Ticks & Labels */}
                {yTicks.map((val, idx) => {
                  const y = 25 + (idx * 25);
                  return (
                    <g key={val}>
                      <line x1="45" y1={y} x2="730" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                      <text x="38" y={y + 3} textAnchor="end" fontSize="10" fill="#64748b" fontWeight="500">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Dates Labels */}
                {trendData.map((d, idx) => {
                  const x = 45 + (idx / Math.max(trendData.length - 1, 1)) * 685;
                  if (idx % 3 !== 0 && idx !== trendData.length - 1) return null;
                  return (
                    <text
                      key={d.date + idx}
                      x={x}
                      y="205"
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="end"
                      transform={`rotate(-40 ${x} 205)`}
                    >
                      {d.date}
                    </text>
                  );
                })}

                {/* Yellow Line: Follow-Ups */}
                <path
                  d={generateSvgPath(trendData, 'followUps', chartScale.max)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Teal Line: Calls Made */}
                <path
                  d={generateSvgPath(trendData, 'calls', chartScale.max)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Purple Line: New Leads */}
                <path
                  d={generateSvgPath(trendData, 'leads', chartScale.max)}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* Interactive Points & Peak Markers */}
                {trendData.map((d, i) => {
                  const x = 45 + (i / Math.max(trendData.length - 1, 1)) * 685;
                  const yLeads = 175 - ((Number(d.leads) || 0) / chartScale.max) * 150;
                  const isPeak = maxLeadValue > 0 && Number(d.leads) === maxLeadValue;
                  return (
                    <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                      <circle
                        cx={x}
                        cy={yLeads}
                        r={isPeak ? 5 : 3}
                        fill="#6366f1"
                        stroke="#ffffff"
                        strokeWidth={isPeak ? 2 : 1.5}
                        className="chart-dot"
                      />
                      {/* Transparent Hover Target Area */}
                      <rect x={x - 10} y="15" width="20" height="180" fill="transparent" style={{ cursor: 'pointer' }} />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Card on Hover */}
              {activePoint && (
                <div
                  className="svg-chart-tooltip"
                  style={{
                    left: `${45 + (hoverIndex / Math.max(trendData.length - 1, 1)) * 88}%`,
                    top: '30px'
                  }}
                >
                  <strong>{activePoint.date}</strong>
                  <div><span className="dot bg-purple" /> Leads: {activePoint.leads}</div>
                  <div><span className="dot bg-teal" /> Calls: {activePoint.calls}</div>
                  <div><span className="dot bg-yellow" /> Follow-Ups: {activePoint.followUps}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Lead Pipeline Donut */}
        <div className="crm-card pipeline-card">
          <div className="crm-card-header">
            <div className="crm-card-title">
              <FiPieChart className="header-icon text-cyan" />
              <span>Lead Pipeline</span>
            </div>
          </div>
          <div className="crm-card-body pipeline-body">
            <div className="donut-container">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pipeline-legend-list">
              {pipelineData.map((item, idx) => (
                <div className="pipeline-legend-row" key={idx}>
                  <span className="pipeline-name">{item.name}</span>
                  <span className="pipeline-val">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Quick Access & Recent Activity */}
      <div className="crm-dashboard-row row-middle">
        {/* Quick Access */}
        <div className="crm-card quick-access-card">
          <div className="crm-card-header">
            <div className="crm-card-title">
              <FiActivity className="header-icon text-amber" />
              <span>Quick Access</span>
            </div>
          </div>
          <div className="crm-card-body quick-access-body">
            <div className="quick-access-grid">
              {quickAccessItems.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    className="quick-access-btn" 
                    key={idx}
                    onClick={() => item.path && navigate(item.path)}
                  >
                    <div className={`quick-icon-box ${item.colorClass}`}>
                      <IconComponent size={16} color="#ffffff" />
                    </div>
                    <div className="quick-btn-info">
                      <span className="quick-title">{item.title}</span>
                      <span className="quick-sub">{item.sub}</span>
                    </div>
                    <FiChevronRight className="quick-arrow" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="crm-card activity-card">
          <div className="crm-card-header">
            <div className="crm-card-title">
              <FiActivity className="header-icon text-blue" />
              <span>Recent Activity</span>
            </div>
            <button className="crm-header-btn-subtle" onClick={() => navigate('/ciisUser/crm/reports/user-activity')}>
              <FiClock size={12} style={{ marginRight: 4 }} /> Recent
            </button>
          </div>
          <div className="crm-card-body activity-body">
            <div className="activity-timeline">
              {recentActivitiesList.map((act) => (
                <div className="activity-item" key={act.id}>
                  <div className={`activity-icon-badge ${act.type === 'call' ? 'badge-green' : 'badge-amber'}`}>
                    {act.type === 'call' ? <FiPhoneCall size={12} /> : <FiUsers size={12} />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-top-line">
                      <span className="activity-title">{act.title}</span>
                      <span className={`role-tag ${act.roleType === 'telecaller' ? 'tag-teal' : 'tag-amber'}`}>
                        {act.role}
                      </span>
                    </div>
                    <div className="activity-sub">{act.action}</div>
                  </div>
                  <div className="activity-time-tag">
                    {act.time}
                  </div>
                </div>
              ))}
              {recentActivitiesList.length === 0 && (
                <div className="crm-data-empty">No recent CRM activity found.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Team Performance & Today's Schedule */}
      <div className="crm-dashboard-row row-bottom">
        {/* Team Performance */}
        <div className="crm-card team-perf-card">
          <div className="crm-card-header">
            <div className="crm-card-title">
              <FiAward className="header-icon text-purple" />
              <span>Team Performance</span>
            </div>
            <button className="crm-header-btn-outlined" onClick={() => navigate('/ciisUser/crm/reports/team-performance')}>View All</button>
          </div>
          <div className="crm-card-body p-0">
            <div className="table-responsive">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Team Member</th>
                    <th>Role</th>
                    <th>Calls</th>
                    <th>Follow-Ups</th>
                    <th>Leads</th>
                    <th>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformanceData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-slate-800">{row.member}</td>
                      <td>
                        <span className={`table-role-badge badge-role-${row.roleBadge}`}>
                          {row.role}
                        </span>
                      </td>
                      <td>{row.calls}</td>
                      <td>{row.followUps}</td>
                      <td>{row.leads}</td>
                      <td className={row.conversionHigh ? "text-emerald-600 font-bold" : "text-emerald-500 font-semibold"}>
                        {row.conversion}
                      </td>
                    </tr>
                  ))}
                  {teamPerformanceData.length === 0 && (
                    <tr><td colSpan="6" className="crm-table-empty">No team performance data found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="crm-card schedule-card">
          <div className="crm-card-header">
            <div className="crm-card-title">
              <FiCalendar className="header-icon text-amber" />
              <span>Today's Schedule</span>
            </div>
            <button className="crm-header-btn-outlined" onClick={() => navigate('/ciisUser/crm/admin/follow-ups')}>View All</button>
          </div>
          <div className={`crm-card-body ${todaysSchedule.length ? 'schedule-list-body' : 'schedule-empty-body'}`}>
            {todaysSchedule.length ? (
              <div className="schedule-list">
                {todaysSchedule.map(item => (
                  <button
                    type="button"
                    className="schedule-item"
                    key={item.id}
                    onClick={() => navigate('/ciisUser/crm/admin/follow-ups')}
                  >
                    <div className="schedule-time">{item.time}</div>
                    <div className="schedule-details">
                      <strong>{item.lead}</strong>
                      <span>{item.agent}{item.phone ? ` · ${item.phone}` : ''}</span>
                      {item.note && <span className="schedule-note">{item.note}</span>}
                    </div>
                    <span className={`schedule-priority priority-${item.priority}`}>{item.priority}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="schedule-empty-content">
                <div className="schedule-empty-icon">
                  <FiCalendar size={28} />
                </div>
                <p className="schedule-empty-title">No follow-ups due today.</p>
                <p className="schedule-empty-sub">New scheduled follow-ups will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
