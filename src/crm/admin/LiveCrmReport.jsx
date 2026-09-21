import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiUsers,
  FiPhoneCall,
  FiClock,
  FiAward,
  FiTrendingUp,
  FiActivity,
  FiFilter,
  FiDownload,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiArrowUpRight,
  FiUserCheck,
  FiPieChart,
  FiArrowRight,
  FiLayers
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../../utils/axiosConfig';
import './LiveCrmReport.css';

// 7 Active High-Value Report Types
const REPORT_TABS = [
  {
    type: 'overview',
    title: 'Reports Overview',
    path: '/ciisUser/crm/reports/overview',
    icon: FiPieChart,
    desc: 'Executive performance summary, pipeline health, and key conversion metrics'
  },
  {
    type: 'leads',
    title: 'Lead Reports',
    path: '/ciisUser/crm/reports/leads',
    icon: FiUsers,
    desc: 'Lead acquisition velocity, channel sources, and qualification status'
  },
  {
    type: 'calls',
    title: 'Call Reports',
    path: '/ciisUser/crm/reports/calls',
    icon: FiPhoneCall,
    desc: 'Telecalling activity, connectivity rates, call duration, and outcomes'
  },
  {
    type: 'follow-ups',
    title: 'Follow-Up Reports',
    path: '/ciisUser/crm/reports/follow-ups',
    icon: FiClock,
    desc: 'Pending callbacks, scheduled pipelines, overdue tracking, and reminders'
  },
  {
    type: 'team-performance',
    title: 'Team Performance',
    path: '/ciisUser/crm/reports/team-performance',
    icon: FiAward,
    desc: 'Telecaller productivity, quota achievement, leaderboard, and conversion ratios'
  },
  {
    type: 'conversion-funnel',
    title: 'Conversion Funnel',
    path: '/ciisUser/crm/reports/conversion-funnel',
    icon: FiTrendingUp,
    desc: 'End-to-end stage progression rates and bottleneck drop-offs'
  },
  {
    type: 'user-activity',
    title: 'User Activity',
    path: '/ciisUser/crm/reports/user-activity',
    icon: FiActivity,
    desc: 'Audit trail of telecaller calls logged, manual updates, and lead assignments'
  }
];

// Helper to calculate date ranges for presets
const getPresetRange = (preset) => {
  const now = new Date();
  const format = (d) => d.toISOString().slice(0, 10);

  if (preset === 'today') {
    return { from: format(now), to: format(now) };
  }
  if (preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { from: format(y), to: format(y) };
  }
  if (preset === '7d') {
    const past = new Date(now);
    past.setDate(past.getDate() - 7);
    return { from: format(past), to: format(now) };
  }
  if (preset === '30d') {
    const past = new Date(now);
    past.setDate(past.getDate() - 30);
    return { from: format(past), to: format(now) };
  }
  if (preset === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: format(firstDay), to: format(now) };
  }
  return { from: '', to: '' };
};

export default function LiveCrmReport({ type = 'overview', title = 'Reports Overview' }) {
  const navigate = useNavigate();

  // Active current tab metadata
  const currentTab = useMemo(() => {
    return REPORT_TABS.find((t) => t.type === type) || REPORT_TABS[0];
  }, [type]);

  // Filters state
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [applied, setApplied] = useState({ from: '', to: '' });
  const [activePreset, setActivePreset] = useState('all');

  // Search & Pagination & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  // Data & Request state
  const [data, setData] = useState({
    summary: [],
    columns: [],
    rows: [],
    chartData: [],
    funnelStages: [],
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch report data
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/crm/reports/${type}`, {
        params: applied,
        _skipErrorNotify: true
      });

      const resData = response.data || {};
      setData({
        summary: Array.isArray(resData.summary) ? resData.summary : [],
        columns: Array.isArray(resData.columns) ? resData.columns : [],
        rows: Array.isArray(resData.rows) ? resData.rows : [],
        chartData: Array.isArray(resData.chartData) ? resData.chartData : [],
        funnelStages: Array.isArray(resData.funnelStages) ? resData.funnelStages : [],
        message: resData?.message || ''
      });
    } catch (requestError) {
      setData({ summary: [], columns: [], rows: [], chartData: [], funnelStages: [], message: '' });
      setError(requestError?.response?.data?.message || 'Report data could not be loaded. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [type, applied]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle Preset Clicks
  const handlePresetSelect = (preset) => {
    setActivePreset(preset);
    const range = getPresetRange(preset);
    setFilters(range);
    setApplied(range);
    setCurrentPage(1);
  };

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    let rows = [...(data.rows || [])];

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortConfig.key) {
      rows.sort((a, b) => {
        const valA = a[sortConfig.key] ?? '';
        const valB = b[sortConfig.key] ?? '';
        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }
        return sortConfig.direction === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [data.rows, searchTerm, sortConfig]);

  // Paginated Rows
  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  // Sort Handler
  const handleSort = (column) => {
    setSortConfig((prev) => {
      if (prev.key === column) {
        return { key: column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: column, direction: 'asc' };
    });
  };

  // Export to clean CSV
  const exportCsv = () => {
    if (!processedRows.length && type !== 'overview') return;
    const exportColumns = data.columns.length ? data.columns : Object.keys(processedRows[0] || {});
    if (!exportColumns.length) return;

    const header = exportColumns.join(',');
    const rows = processedRows.map((r) =>
      exportColumns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRM_${type}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Smart computed stats for Overview
  const overviewMetrics = useMemo(() => {
    if (type !== 'overview') return null;

    const findVal = (lbl) => {
      const item = data.summary.find((s) => s.label?.toLowerCase() === lbl.toLowerCase());
      return item ? Number(item.value) || 0 : 0;
    };

    const totalLeads = findVal('Total Leads');
    const assignedLeads = findVal('Assigned Leads');
    const callsLogged = findVal('Calls Logged');
    const converted = findVal('Converted');
    const pendingFollowUps = findVal('Pending Follow-ups');
    const unassigned = Math.max(0, totalLeads - assignedLeads);
    const convRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) + '%' : '0%';
    const assignedRate = totalLeads > 0 ? Math.round((assignedLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      assignedLeads,
      unassigned,
      callsLogged,
      converted,
      pendingFollowUps,
      convRate,
      assignedRate
    };
  }, [type, data.summary]);

  // Derived KPI Cards for each specific report
  const displaySummaryCards = useMemo(() => {
    if (type === 'overview' && overviewMetrics) {
      return [
        { label: 'Total Inquiries', value: overviewMetrics.totalLeads, icon: FiUsers, color: 'purple' },
        { label: 'Assigned Leads', value: overviewMetrics.assignedLeads, icon: FiUserCheck, color: 'blue' },
        { label: 'Unassigned Leads', value: overviewMetrics.unassigned, icon: FiAlertCircle, color: 'amber' },
        { label: 'Calls Logged', value: overviewMetrics.callsLogged, icon: FiPhoneCall, color: 'cyan' },
        { label: 'Converted Clients', value: overviewMetrics.converted, icon: FiAward, color: 'emerald' },
        { label: 'Pending Follow-ups', value: overviewMetrics.pendingFollowUps, icon: FiClock, color: 'rose' },
        { label: 'Conversion Rate', value: overviewMetrics.convRate, icon: FiTrendingUp, color: 'indigo' }
      ];
    }

    // For other tabs, enrich with available summary or processed rows
    if (type === 'leads') {
      const total = processedRows.length;
      const converted = processedRows.filter((r) => String(r.Status).toLowerCase().includes('converted')).length;
      const qualified = processedRows.filter((r) =>
        ['qualified', 'interested'].some((k) => String(r.Status).toLowerCase().includes(k))
      ).length;
      const assigned = processedRows.filter(
        (r) => r['Assigned To'] && r['Assigned To'] !== '—' && r['Assigned To'] !== ''
      ).length;

      return [
        { label: 'Total Leads in Scope', value: total, icon: FiUsers, color: 'purple' },
        { label: 'Assigned to Team', value: assigned, icon: FiUserCheck, color: 'blue' },
        { label: 'Interested / Qualified', value: qualified, icon: FiCheckCircle, color: 'cyan' },
        { label: 'Converted', value: converted, icon: FiAward, color: 'emerald' }
      ];
    }

    if (type === 'calls') {
      const total = processedRows.length;
      const answered = processedRows.filter((r) => String(r.Outcome).toLowerCase().includes('answered')).length;
      const connectedRate = total > 0 ? `${Math.round((answered / total) * 100)}%` : '0%';

      return [
        { label: 'Total Calls Logged', value: total, icon: FiPhoneCall, color: 'blue' },
        { label: 'Answered / Connected', value: answered, icon: FiCheckCircle, color: 'emerald' },
        { label: 'Connectivity Rate', value: connectedRate, icon: FiTrendingUp, color: 'cyan' }
      ];
    }

    if (type === 'follow-ups') {
      const total = processedRows.length;
      const pending = processedRows.filter((r) => String(r.Status).toLowerCase().includes('pending')).length;
      const done = processedRows.filter((r) =>
        ['done', 'completed'].some((k) => String(r.Status).toLowerCase().includes(k))
      ).length;

      return [
        { label: 'Total Follow-Ups', value: total, icon: FiClock, color: 'purple' },
        { label: 'Pending Action', value: pending, icon: FiAlertCircle, color: 'amber' },
        { label: 'Completed', value: done, icon: FiCheckCircle, color: 'emerald' }
      ];
    }

    if (type === 'team-performance') {
      const agentsCount = processedRows.length;
      const totalCalls = processedRows.reduce((sum, r) => sum + (Number(r.Calls) || 0), 0);
      const totalConv = processedRows.reduce((sum, r) => sum + (Number(r.Converted) || 0), 0);

      return [
        { label: 'Active Telecallers', value: agentsCount, icon: FiUsers, color: 'purple' },
        { label: 'Team Calls Made', value: totalCalls, icon: FiPhoneCall, color: 'blue' },
        { label: 'Total Conversions', value: totalConv, icon: FiAward, color: 'emerald' }
      ];
    }

    // Default to API summary if available
    if (data.summary?.length) {
      return data.summary.map((item, idx) => ({
        label: item.label,
        value: item.value,
        icon: [FiUsers, FiPhoneCall, FiAward, FiClock, FiActivity][idx % 5],
        color: ['purple', 'blue', 'emerald', 'amber', 'cyan'][idx % 5]
      }));
    }

    return [];
  }, [type, overviewMetrics, processedRows, data.summary]);

  // Clean cell badge renderer
  const renderCellContent = (column, value) => {
    const str = String(value ?? '');
    const lower = str.toLowerCase();

    // Status Badges
    if (['status', 'outcome', 'activity', 'stage'].some((k) => column.toLowerCase().includes(k))) {
      let badgeClass = 'crm-badge-neutral';
      if (['converted', 'answered', 'done', 'completed', 'enrolled'].some((k) => lower.includes(k))) {
        badgeClass = 'crm-badge-success';
      } else if (['interested', 'qualified', 'scheduled', 'assigned'].some((k) => lower.includes(k))) {
        badgeClass = 'crm-badge-info';
      } else if (['pending', 'follow-up', 'in-progress', 'callback', 'need callback'].some((k) => lower.includes(k))) {
        badgeClass = 'crm-badge-warning';
      } else if (['lost', 'cancelled', 'overdue', 'busy', 'not interested', 'wrong number', 'unanswered'].some((k) => lower.includes(k))) {
        badgeClass = 'crm-badge-danger';
      }
      return <span className={`crm-status-pill ${badgeClass}`}>{str}</span>;
    }

    // User / Agent Avatar Cell
    if (
      ['user', 'telecaller', 'agent', 'assigned to', 'executive'].some((k) =>
        column.toLowerCase().includes(k)
      ) && str !== '—'
    ) {
      const initials = str
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      return (
        <div className="crm-user-profile-cell">
          <span className="crm-avatar-bubble">{initials || 'U'}</span>
          <span className="crm-user-name">{str}</span>
        </div>
      );
    }

    // Conversion rate highlight
    if (column.toLowerCase().includes('conversion') && str.includes('%')) {
      const num = parseFloat(str);
      const isGood = num >= 15;
      return (
        <span className={`crm-rate-badge ${isGood ? 'high' : 'normal'}`}>
          {str}
        </span>
      );
    }

    // ID styling
    if (column.toLowerCase().includes('id') && str.startsWith('#')) {
      return <span className="crm-id-tag">{str}</span>;
    }

    return str;
  };

  const TabIcon = currentTab.icon || FiBarChart2;

  return (
    <div className="crm-report-page">
      {/* 1. Subtle Breadcrumb */}
      <div className="crm-breadcrumb-bar">
        <Link to="/ciisUser/user-dashboard">Dashboard</Link>
        <span className="crm-bc-sep">/</span>
        <Link to="/ciisUser/crm/admin/dashboard">CRM</Link>
        <span className="crm-bc-sep">/</span>
        <span className="crm-bc-current">{title}</span>
      </div>

      {/* 2. Sleek Header Area */}
      <div className="crm-header-card">
        <div className="crm-header-main">
          <div className="crm-header-icon-box">
            <TabIcon />
          </div>
          <div>
            <div className="crm-header-title-wrap">
              <h1 className="crm-page-title">{title}</h1>
              <span className="crm-live-indicator">
                <span className="crm-pulse-dot"></span> Live
              </span>
            </div>
            <p className="crm-page-subtitle">{currentTab.desc}</p>
          </div>
        </div>

        <div className="crm-header-actions">
          <button
            className="crm-action-btn secondary"
            onClick={load}
            title="Refresh Data"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {type !== 'overview' && (
            <button
              className="crm-action-btn primary"
              onClick={exportCsv}
              disabled={!processedRows.length}
              title="Download Filtered CSV"
            >
              <FiDownload />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Modern Report Switcher Tabs */}
      <nav className="crm-tabs-nav" aria-label="CRM Reports">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.type === type;
          return (
            <button
              key={tab.type}
              className={`crm-tab-button ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (!isActive) {
                  navigate(tab.path);
                }
              }}
            >
              <Icon className="crm-tab-icon" />
              <span>{tab.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Error Alert */}
      {error && (
        <div className="crm-alert-box error">
          <FiAlertCircle size={18} />
          <span>{error}</span>
          <button className="crm-alert-retry" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* 4. KPI Stat Summary Cards */}
      {displaySummaryCards.length > 0 && (
        <div className="crm-kpi-grid">
          {displaySummaryCards.map((card, idx) => {
            const CardIcon = card.icon || FiLayers;
            return (
              <div key={card.label || idx} className="crm-kpi-card">
                <div className="crm-kpi-top">
                  <div className={`crm-kpi-icon-wrap ${card.color || 'purple'}`}>
                    <CardIcon />
                  </div>
                  <span className="crm-kpi-label">{card.label}</span>
                </div>
                <div className="crm-kpi-bottom">
                  <span className="crm-kpi-val">{card.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. OVERVIEW SPECIFIC SECTIONS */}
      {type === 'overview' && overviewMetrics && (
        <div className="crm-overview-sections">
          {/* Pipeline & Conversion Highlights */}
          <div className="crm-overview-highlight-grid">
            <div className="crm-highlight-card">
              <div className="crm-highlight-header">
                <div>
                  <h3 className="crm-card-title">Lead Assignment Ratio</h3>
                  <p className="crm-card-desc">Proportion of incoming leads distributed to telecallers</p>
                </div>
                <span className="crm-highlight-badge purple">
                  {overviewMetrics.assignedRate}% Assigned
                </span>
              </div>
              <div className="crm-progress-track">
                <div
                  className="crm-progress-fill purple"
                  style={{ width: `${overviewMetrics.assignedRate}%` }}
                ></div>
              </div>
              <div className="crm-highlight-stats">
                <div className="crm-substat">
                  <span className="crm-substat-dot assigned"></span>
                  <span>Assigned: <strong>{overviewMetrics.assignedLeads}</strong></span>
                </div>
                <div className="crm-substat">
                  <span className="crm-substat-dot unassigned"></span>
                  <span>Unassigned: <strong>{overviewMetrics.unassigned}</strong></span>
                </div>
              </div>
            </div>

            <div className="crm-highlight-card">
              <div className="crm-highlight-header">
                <div>
                  <h3 className="crm-card-title">Overall Conversion Health</h3>
                  <p className="crm-card-desc">Inquiries successfully enrolled or converted</p>
                </div>
                <span className="crm-highlight-badge emerald">
                  {overviewMetrics.convRate} Converted
                </span>
              </div>
              <div className="crm-progress-track">
                <div
                  className="crm-progress-fill emerald"
                  style={{
                    width: `${Math.min(100, Math.max(0, parseFloat(overviewMetrics.convRate) || 0))}%`
                  }}
                ></div>
              </div>
              <div className="crm-highlight-stats">
                <div className="crm-substat">
                  <span className="crm-substat-dot converted"></span>
                  <span>Converted: <strong>{overviewMetrics.converted}</strong></span>
                </div>
                <div className="crm-substat">
                  <span className="crm-substat-dot pending"></span>
                  <span>Pending Callbacks: <strong>{overviewMetrics.pendingFollowUps}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Report Hub */}
          <div className="crm-report-hub">
            <div className="crm-hub-header">
              <h3 className="crm-card-title">Detailed Reports Hub</h3>
              <p className="crm-card-desc">Jump straight to granular telemetry, individual logs, and team rankings</p>
            </div>

            <div className="crm-hub-grid">
              {REPORT_TABS.filter((t) => t.type !== 'overview').map((tab) => {
                const Icon = tab.icon;
                return (
                  <div
                    key={tab.type}
                    className="crm-hub-card"
                    onClick={() => navigate(tab.path)}
                  >
                    <div className="crm-hub-card-top">
                      <div className="crm-hub-icon-wrap">
                        <Icon />
                      </div>
                      <span className="crm-hub-link">
                        View <FiArrowRight />
                      </span>
                    </div>
                    <h4 className="crm-hub-card-title">{tab.title}</h4>
                    <p className="crm-hub-card-desc">{tab.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. CHARTS & VISUALIZATIONS (Non-Overview) */}
      {type === 'conversion-funnel' && data.funnelStages?.length ? (
        <div className="crm-visual-card">
          <div className="crm-card-header">
            <div>
              <h3 className="crm-card-title">Lead Conversion Stages</h3>
              <p className="crm-card-desc">Stage-by-stage progression from lead entry to enrolled student</p>
            </div>
          </div>

          <div className="crm-funnel-container">
            {data.funnelStages.map((stage) => (
              <div key={stage.step} className="crm-funnel-step-row">
                <div className="crm-funnel-step-name">
                  <span className="crm-funnel-badge">{stage.step}</span>
                  <span className="crm-funnel-label">{stage.name}</span>
                </div>
                <div className="crm-funnel-bar-track">
                  <div
                    className="crm-funnel-bar-fill"
                    style={{
                      width: stage.pct,
                      backgroundColor: stage.color || '#4f46e5'
                    }}
                  ></div>
                </div>
                <div className="crm-funnel-counts">
                  <strong>{stage.count.toLocaleString()}</strong> leads
                </div>
                <div className="crm-funnel-share-badge">{stage.pct}</div>
              </div>
            ))}
          </div>
        </div>
      ) : type !== 'overview' && data.chartData?.length ? (
        <div className="crm-visual-card">
          <div className="crm-card-header">
            <div>
              <h3 className="crm-card-title">{title} Analytics Trend</h3>
              <p className="crm-card-desc">Telemetry metrics over observation period</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {type === 'leads' ? (
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: 8, border: 'none', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  <Bar dataKey="leads" name="Total Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qualified" name="Qualified / Interested" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : type === 'calls' ? (
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: 8, border: 'none', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="totalCalls" name="Total Calls" stroke="#3b82f6" strokeWidth={2} fill="url(#callsGrad)" />
                  <Area type="monotone" dataKey="connected" name="Connected Calls" stroke="#10b981" strokeWidth={2} fill="url(#connGrad)" />
                </AreaChart>
              ) : type === 'team-performance' ? (
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="agent" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: 8, border: 'none', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  <Bar dataKey="calls" name="Calls Made" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversions" name="Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey={Object.keys(data.chartData[0] || {})[0]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: 8, border: 'none', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  {Object.keys(data.chartData[0] || {})
                    .filter((k) => k !== Object.keys(data.chartData[0])[0])
                    .map((k, i) => (
                      <Bar
                        key={k}
                        dataKey={k}
                        fill={['#6366f1', '#10b981', '#f59e0b', '#06b6d4'][i % 4]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* 7. FILTER & SEARCH TOOLBAR (For Tabular Reports) */}
      {type !== 'overview' && (
        <div className="crm-toolbar-card">
          <div className="crm-toolbar-presets">
            <span className="crm-toolbar-label">Period:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' }
            ].map((p) => (
              <button
                key={p.id}
                className={`crm-preset-pill ${activePreset === p.id ? 'active' : ''}`}
                onClick={() => handlePresetSelect(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="crm-toolbar-right">
            {/* Date Pickers */}
            <div className="crm-date-group">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, from: e.target.value }));
                  setActivePreset('custom');
                }}
                className="crm-date-input"
                title="From Date"
              />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, to: e.target.value }));
                  setActivePreset('custom');
                }}
                className="crm-date-input"
                title="To Date"
              />
              <button
                className="crm-apply-btn"
                onClick={() => {
                  setApplied(filters);
                  setCurrentPage(1);
                }}
              >
                <FiFilter size={12} /> Apply
              </button>
              {(filters.from || filters.to) && (
                <button
                  className="crm-reset-btn"
                  onClick={() => handlePresetSelect('all')}
                  title="Reset date filter"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Instant Search Box */}
            <div className="crm-search-wrap">
              <FiSearch className="crm-search-icon" />
              <input
                type="text"
                placeholder={`Search in ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button className="crm-search-clear" onClick={() => setSearchTerm('')}>
                  <FiX size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. DATA TABLE (For Tabular Reports) */}
      {type !== 'overview' && (
        <div className="crm-table-card">
          <div className="crm-table-topbar">
            <div className="crm-table-info">
              <h3 className="crm-table-title">{title} Records</h3>
              <span className="crm-table-count-badge">
                {processedRows.length} {processedRows.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            <div className="crm-page-size-picker">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="crm-state-wrap loading">
              <div className="crm-spinner"></div>
              <p>Loading live report records...</p>
            </div>
          ) : !processedRows.length ? (
            <div className="crm-state-wrap empty">
              <div className="crm-empty-icon-box">
                <FiSearch />
              </div>
              <h4>No records found</h4>
              <p>
                {data.message ||
                  (searchTerm
                    ? `No results matched "${searchTerm}".`
                    : 'There are no records for this date range.')}
              </p>
              {(searchTerm || activePreset !== 'all') && (
                <button
                  className="crm-action-btn secondary"
                  onClick={() => {
                    setSearchTerm('');
                    handlePresetSelect('all');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="crm-table-scroll">
              <table className="crm-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>#</th>
                    {data.columns.map((column) => (
                      <th
                        key={column}
                        onClick={() => handleSort(column)}
                        className="sortable-header"
                      >
                        <div className="th-content">
                          <span>{column}</span>
                          {sortConfig.key === column ? (
                            sortConfig.direction === 'asc' ? (
                              <FiChevronUp size={13} color="#4f46e5" />
                            ) : (
                              <FiChevronDown size={13} color="#4f46e5" />
                            )
                          ) : (
                            <span className="sort-hint">↕</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, index) => {
                    const serialNumber = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={index}>
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                          {serialNumber}
                        </td>
                        {data.columns.map((column) => (
                          <td key={column}>{renderCellContent(column, row[column])}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {processedRows.length > 0 && (
            <div className="crm-pagination-bar">
              <div className="crm-pagination-count">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, processedRows.length)} of {processedRows.length} entries
              </div>

              <div className="crm-pagination-nav">
                <button
                  className="crm-pg-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 3), currentPage + 2)
                  .map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`crm-pg-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                <button
                  className="crm-pg-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
