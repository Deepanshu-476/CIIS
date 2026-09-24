import React, { useEffect, useState } from 'react';
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
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../utils/axiosConfig';
import './LeadOverview.css';

const ACTIONS = [
  {
    title: 'Add New Lead',
    description: 'Create a new lead record',
    icon: FiPlus,
    color: '#3b82f6',
    path: '/ciisUser/crm/admin/add-lead'
  },
  {
    title: 'Import Leads',
    description: 'Import leads from CSV / Excel',
    icon: FiFilePlus,
    color: '#10b981',
    path: '/ciisUser/crm/admin/import-export-leads'
  },
  {
    title: 'Manage Leads',
    description: 'View, assign & filter leads',
    icon: FiUsers,
    color: '#8b5cf6',
    path: '/ciisUser/crm/admin/all-leads'
  },
  {
    title: 'Call Overview',
    description: 'View and manage telecaller records',
    icon: FiPhoneCall,
    color: '#f59e0b',
    path: '/ciisUser/crm/admin/call-overview'
  }
];

export default function LeadOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [trendRange, setTrendRange] = useState('6M');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/crm/leads/overview', { cache: false })
      .then(({ data: result }) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError('Could not load lead statistics. Please retry.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const total = data?.metrics?.total ?? 0;
  const newLeads = data?.metrics?.new ?? 0;
  const assigned = data?.metrics?.assigned ?? 0;
  const unassigned = data?.metrics?.unassigned ?? 0;
  const conversionRate = data?.metrics?.conversionRate ?? 0;
  const interested = data?.metrics?.interested ?? 0;

  const newPct = total > 0 ? ((newLeads / total) * 100).toFixed(1) : '0.0';
  const assignedPct = total > 0 ? ((assigned / total) * 100).toFixed(1) : '0.0';

  const metrics = [
    {
      label: 'Total Leads',
      value: loading && !data ? '—' : total.toLocaleString(),
      change: `+${total}`,
      isUp: true,
      isGood: true,
      tone: 'purple',
      icon: FiUsers,
      changeTxt: 'total in pipeline'
    },
    {
      label: 'New Leads',
      value: loading && !data ? '—' : newLeads.toLocaleString(),
      change: `${newPct}%`,
      isUp: true,
      isGood: true,
      tone: 'teal',
      icon: FiCheckCircle,
      changeTxt: 'of all leads'
    },
    {
      label: 'Assigned Leads',
      value: loading && !data ? '—' : assigned.toLocaleString(),
      change: `${assignedPct}%`,
      isUp: true,
      isGood: true,
      tone: 'orange',
      icon: FiUserCheck,
      changeTxt: 'allocated to team'
    },
    {
      label: 'Unassigned Leads',
      value: loading && !data ? '—' : unassigned.toLocaleString(),
      change: `${unassigned}`,
      isUp: unassigned > 0,
      isGood: unassigned === 0,
      tone: 'pink',
      icon: FiUserX,
      changeTxt: unassigned > 0 ? 'awaiting allocation' : 'all assigned'
    },
    {
      label: 'Conversion Rate',
      value: loading && !data ? '—' : `${conversionRate}%`,
      change: `${conversionRate}%`,
      isUp: true,
      isGood: true,
      tone: 'cyan',
      icon: FiTrendingUp,
      changeTxt: 'leads won'
    },
    {
      label: 'Interested Leads',
      value: loading && !data ? '—' : interested.toLocaleString(),
      change: 'Active',
      isUp: true,
      isGood: true,
      tone: 'blue',
      icon: FiClock,
      changeTxt: 'in active discussion'
    }
  ];

  const colors = ['#6366f1', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#06b6d4'];
  const funnel = (data?.funnel || []).map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }));
  const totalLeadsFunnel = funnel.reduce((sum, entry) => sum + entry.value, 0);

  const trends = (data?.trendsByRange?.[trendRange] || data?.trends || []).map(item => ({
    ...item,
    label: item.label || item.month || ''
  }));
  const trendMax = Math.max(1, ...trends.flatMap(item => [Number(item.leads) || 0, Number(item.converted) || 0]));
  const hasTrendActivity = trends.some(item => (Number(item.leads) || 0) > 0 || (Number(item.converted) || 0) > 0);

  return (
    <div className="lo-root">
      {/* Page Header */}
      <header className="lo-page-header">
        <div className="lo-page-title-wrap">
          <h1>Lead Overview</h1>
          <button
            type="button"
            className="lo-refresh-icon-btn"
            title="Refresh statistics"
            disabled={loading}
            onClick={() => setReload(v => v + 1)}
          >
            <FiRefreshCw size={13} className={loading ? 'lo-spin' : ''} />
          </button>
        </div>
        <nav aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={11} className="lo-crumb-arrow" />
          <span>Lead Overview</span>
        </nav>
      </header>

      {/* Error Alert Bar */}
      {error && (
        <div className="lo-alert-bar" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReload(v => v + 1)}>Retry</button>
        </div>
      )}

      {/* Top Grid: Stat Metrics & Quick Actions */}
      <div className="lo-top-grid">
        {/* 6 Stat Cards Grid */}
        <section className="lo-metrics" aria-label="Lead statistics">
          {metrics.map(({ label, value, change, isUp, isGood, icon: Icon, tone, changeTxt }) => (
            <article className="lo-stat" key={label}>
              <div className="lo-stat-main">
                <span className={`lo-stat-icon lo-tone-${tone}`}>
                  {React.createElement(Icon, { size: 18 })}
                </span>
                <div className="lo-stat-info">
                  <strong>{value}</strong>
                  <span className="lo-stat-label">{label}</span>
                </div>
              </div>
              <div className="lo-change">
                <span className={isGood ? 'lo-pill-good' : 'lo-pill-bad'}>
                  {isUp ? <FiArrowUp size={9} /> : <FiArrowDown size={9} />}
                  {change}
                </span>
                <span className="lo-change-txt">{changeTxt}</span>
              </div>
            </article>
          ))}
        </section>

        {/* Quick Actions Panel */}
        <section className="lo-panel lo-actions">
          <header className="lo-panel-header lo-dashed-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Perform common tasks quickly</p>
            </div>
          </header>
          <div className="lo-action-list">
            {ACTIONS.map(({ title, description, icon: Icon, color, path }) => (
              <Link className="lo-action" key={title} to={path}>
                <span className="lo-action-icon" style={{ backgroundColor: color }}>
                  {React.createElement(Icon, { size: 16 })}
                </span>
                <span className="lo-action-copy">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </span>
                <FiChevronRight className="lo-action-arrow" />
              </Link>
            ))}
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
            <div className="lo-trend-controls">
              <div className="lo-trend-ranges" aria-label="Lead trend period">
                {['7D', '30D', '6M'].map(range => (
                  <button
                    type="button"
                    key={range}
                    className={trendRange === range ? 'active' : ''}
                    aria-pressed={trendRange === range}
                    onClick={() => setTrendRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </header>
          <div className="lo-trend-body">
            <div className="lo-trend-legend">
              <span><i className="lo-dot-purple" /> New Leads</span>
              <span><i className="lo-dot-teal" /> Converted</span>
            </div>
            <div className="lo-trend-chart">
              {loading && !data ? (
                <div className="lo-loading-placeholder">
                  <FiRefreshCw size={18} className="lo-spin" />
                  <span>Loading trends...</span>
                </div>
              ) : (
                <div className={`lo-native-trend ${trendRange === '30D' ? 'is-30d' : ''}`}>
                  <div className="lo-trend-y-axis" aria-hidden="true">
                    <span>{trendMax}</span>
                    <span>{Math.round(trendMax / 2)}</span>
                    <span>0</span>
                  </div>
                  <div className="lo-trend-plot">
                    <i className="lo-grid-line top" aria-hidden="true" />
                    <i className="lo-grid-line middle" aria-hidden="true" />
                    <i className="lo-grid-line bottom" aria-hidden="true" />
                    {trends.map((item, index) => {
                      const leads = Number(item.leads) || 0;
                      const converted = Number(item.converted) || 0;
                      const showLabel = trendRange !== '30D' || index % 5 === 0 || index === trends.length - 1;
                      return (
                        <div
                          className="lo-trend-column"
                          key={`${item.label}-${index}`}
                          tabIndex={0}
                          aria-label={`${item.label}: ${leads} new leads, ${converted} converted`}
                        >
                          <div className="lo-trend-tooltip" aria-hidden="true">
                            <strong>{item.label}</strong>
                            <span><i className="purple" />{leads} New Leads</span>
                            <span><i className="teal" />{converted} Converted</span>
                          </div>
                          <div className="lo-trend-bars">
                            <i className="purple" style={{ height: leads ? `${Math.max(5, leads / trendMax * 100)}%` : 2 }} />
                            <i className="teal" style={{ height: converted ? `${Math.max(5, converted / trendMax * 100)}%` : 2 }} />
                          </div>
                          <span>{showLabel ? item.label : ''}</span>
                        </div>
                      );
                    })}
                    {!hasTrendActivity && (
                      <div className="lo-trend-empty">No lead activity in this period</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Lead Funnel Donut Chart Panel */}
        <section className="lo-panel lo-chart-panel">
          <header className="lo-panel-header lo-dashed-header">
            <h2>Lead Funnel</h2>
          </header>
          <div className="lo-funnel-body">
            {loading && !data ? (
              <div className="lo-loading-placeholder">
                <FiRefreshCw size={18} className="lo-spin" />
                <span>Loading funnel...</span>
              </div>
            ) : (
              <>
                <div className="lo-donut" role="img" aria-label={`Lead funnel: ${totalLeadsFunnel} total`}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={funnel}
                        dataKey="value"
                        innerRadius="62%"
                        outerRadius="95%"
                        startAngle={90}
                        endAngle={-270}
                        stroke="#ffffff"
                        strokeWidth={2}
                        paddingAngle={totalLeadsFunnel > 0 ? 3 : 0}
                        cornerRadius={3}
                      >
                        {funnel.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          color: '#0f172a',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 8px 20px -3px rgba(0, 0, 0, 0.08)',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                        formatter={val => [`${val} leads`, 'Total']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="lo-donut-label">
                    <strong>{totalLeadsFunnel}</strong>
                    <span>TOTAL</span>
                  </div>
                </div>

                <ul className="lo-funnel-legend">
                  {funnel.map((entry) => {
                    const pct = totalLeadsFunnel ? ((entry.value / totalLeadsFunnel) * 100).toFixed(1) : '0.0';
                    return (
                      <li key={entry.name}>
                        <span className="lo-funnel-item">
                          <i style={{ backgroundColor: entry.color }} />
                          {entry.name}
                        </span>
                        <span className="lo-funnel-stat">
                          <strong>{entry.value.toLocaleString()}</strong>
                          <small>({pct}%)</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
