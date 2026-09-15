import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiCheckCircle,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiClock,
  FiPlus,
  FiFilePlus,
  FiPhoneCall,
  FiChevronRight,
  FiArrowDown,
  FiArrowUp
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './LeadOverview.css';

const metrics = [
  {
    label: 'Total Leads',
    value: '295',
    change: '99.7%',
    isUp: false,
    isGood: false,
    icon: FiUsers,
    tone: 'purple'
  },
  {
    label: 'New Leads',
    value: '277',
    change: '100%',
    isUp: false,
    isGood: false,
    icon: FiCheckCircle,
    tone: 'teal'
  },
  {
    label: 'Assigned Leads',
    value: '18',
    change: '94.1%',
    isUp: false,
    isGood: false,
    icon: FiUserCheck,
    tone: 'orange'
  },
  {
    label: 'Unassigned Leads',
    value: '277',
    change: '100%',
    isUp: false,
    isGood: false,
    icon: FiUserX,
    tone: 'pink'
  },
  {
    label: 'Conversion Rate',
    value: '0.3%',
    change: '0.3%',
    isUp: true,
    isGood: true,
    icon: FiTrendingUp,
    tone: 'cyan'
  },
  {
    label: 'Avg. Close Time',
    value: '2 days',
    change: '2 days',
    isUp: false,
    isGood: true,
    icon: FiClock,
    tone: 'blue'
  },
];

const actions = [
  {
    title: 'Add New Lead',
    description: 'Create a new lead record',
    icon: FiPlus,
    color: '#2860ef',
    path: '/ciisUser/crm/admin/add-lead'
  },
  {
    title: 'Import Leads',
    description: 'Import leads from CSV files',
    icon: FiFilePlus,
    color: '#19c55b',
    path: '/ciisUser/crm/admin/import-export-leads'
  },
  {
    title: 'Manage Leads',
    description: 'View, edit, and organize leads',
    icon: FiUsers,
    color: '#942ef1',
    path: '/ciisUser/crm/admin/all-leads'
  },
  {
    title: 'Manage Calls',
    description: 'View and manage call records',
    icon: FiPhoneCall,
    color: '#ff7910',
    path: null
  },
];

const trends = [
  { month: 'Mar', leads: 0, converted: 0 },
  { month: 'Apr', leads: 0, converted: 0 },
  { month: 'May', leads: 0, converted: 0 },
  { month: 'Jun', leads: 0, converted: 0 },
  { month: 'Jul', leads: 0, converted: 0 },
  { month: 'Aug', leads: 280, converted: 1 },
  { month: 'Sep', leads: 0, converted: 0 }
];

const funnel = [
  { name: 'New Leads', value: 277, color: '#2563eb' },
  { name: 'Assigned', value: 18, color: '#f97316' },
  { name: 'Unassigned', value: 277, color: '#8b5cf6' },
  { name: 'Contacted', value: 2, color: '#10b981' },
];

const totalLeadsFunnel = funnel.reduce((sum, entry) => sum + entry.value, 0);

export default function LeadOverview() {
  return (
    <div className="lo-root">
      {/* Page Header */}
      <header className="lo-page-header">
        <h1>Lead Overview</h1>
        <nav aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={10} />
          <span>Lead Overview</span>
        </nav>
      </header>

      {/* Top Grid: Stat Metrics & Quick Actions */}
      <div className="lo-top-grid">
        {/* 6 Stat Cards Grid */}
        <section className="lo-metrics" aria-label="Lead statistics">
          {metrics.map(({ label, value, change, isUp, isGood, icon: Icon, tone }) => (
            <article className="lo-stat" key={label}>
              <div className="lo-stat-main">
                <span className={`lo-stat-icon lo-tone-${tone}`}>
                  <Icon size={18} />
                </span>
                <div className="lo-stat-info">
                  <strong>{value}</strong>
                  <span className="lo-stat-label">{label}</span>
                </div>
              </div>
              <div className="lo-change">
                <span className={isGood ? 'lo-pill-good' : 'lo-pill-bad'}>
                  {isUp ? <FiArrowUp size={8} /> : <FiArrowDown size={8} />}
                  {change}
                </span>
                <span className="lo-change-txt">from last week</span>
              </div>
            </article>
          ))}
        </section>

        {/* Quick Actions Panel */}
        <section className="lo-panel lo-actions">
          <header className="lo-panel-header">
            <h2>Quick Actions</h2>
            <p>Perform common tasks quickly</p>
          </header>
          <div className="lo-action-list">
            {actions.map(({ title, description, icon: Icon, color, path }) => {
              const content = (
                <>
                  <span className="lo-action-icon" style={{ backgroundColor: color }}>
                    <Icon size={16} />
                  </span>
                  <span className="lo-action-copy">
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </span>
                  <FiChevronRight className="lo-action-arrow" />
                </>
              );

              return path ? (
                <Link className="lo-action" key={title} to={path}>
                  {content}
                </Link>
              ) : (
                <div className="lo-action lo-action-disabled" key={title}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Charts Grid */}
      <div className="lo-charts">
        {/* Lead Trends Area Chart Panel */}
        <section className="lo-panel lo-chart-panel">
          <header className="lo-panel-header lo-dashed-header flex-between">
            <div className="lo-header-left">
              <h2>Lead Trends</h2>
            </div>
            <div className="lo-trend-legend">
              <span className="lo-legend-pill lo-pill-purple">
                <i className="lo-dot-purple" /> New Leads
              </span>
              <span className="lo-legend-pill lo-pill-teal">
                <i className="lo-dot-teal" /> Converted
              </span>
            </div>
          </header>
          <div className="lo-trend-body">
            <div className="lo-trend-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 15, right: 15, bottom: 0, left: -15 }}>
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  />
                  <YAxis
                    domain={[0, 300]}
                    ticks={[0, 100, 200, 300]}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="New Leads"
                    stroke="#7c3aed"
                    fill="url(#purpleGrad)"
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#7c3aed' }}
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    name="Converted"
                    stroke="#10b981"
                    fill="transparent"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2, fill: '#ffffff', stroke: '#10b981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Lead Funnel Donut Chart Panel */}
        <section className="lo-panel lo-chart-panel">
          <header className="lo-panel-header lo-dashed-header">
            <h2>Lead Funnel</h2>
          </header>
          <div className="lo-funnel-body">
            <div className="lo-donut" role="img" aria-label={`Lead funnel: ${totalLeadsFunnel} total`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnel}
                    dataKey="value"
                    innerRadius="62%"
                    outerRadius="96%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    paddingAngle={3}
                    cornerRadius={4}
                  >
                    {funnel.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="lo-donut-label">
                <strong>{totalLeadsFunnel}</strong>
                <span>TOTAL</span>
              </div>
            </div>
            <ul className="lo-funnel-legend">
              {funnel.map((entry) => (
                <li key={entry.name}>
                  <span className="lo-funnel-item">
                    <i style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="lo-funnel-stat">
                    <strong>{entry.value}</strong>
                    <small>({(entry.value / totalLeadsFunnel * 100).toFixed(1)}%)</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

    </div>
  );
}
