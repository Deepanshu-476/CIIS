import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  FiLayers,
  FiCalendar
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

const CHART_COLOR_MAP = {
  calls: '#3b82f6',
  totalCalls: '#3b82f6',
  assignments: '#8b5cf6',
  followups: '#10b981',
  completed: '#10b981',
  pending: '#f59e0b',
  connected: '#10b981',
  leads: '#6366f1',
  qualified: '#10b981',
  conversions: '#10b981',
};

// Sleek Floating Modern Tooltip for Report Charts
function ModernChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const numValues = payload
    .map((p) => (typeof p.value === 'number' ? p.value : null))
    .filter((v) => v !== null);
  const total = numValues.reduce((a, b) => a + b, 0);

  return (
    <div className="crm-modern-chart-tooltip">
      {label && (
        <div className="crm-tooltip-header">
          <FiCalendar size={12} className="crm-tooltip-header-icon" />
          <span className="crm-tooltip-title">{label}</span>
          {payload.length > 1 && total > 0 && (
            <span className="crm-tooltip-total-tag">{total.toLocaleString()} total</span>
          )}
        </div>
      )}
      <div className="crm-tooltip-body">
        {payload.map((entry, idx) => {
          const rawColor =
            entry.color && !entry.color.startsWith('url')
              ? entry.color
              : entry.stroke && !entry.stroke.startsWith('url')
              ? entry.stroke
              : CHART_COLOR_MAP[entry.dataKey] || '#6366f1';
          const val = typeof entry.value === 'number' ? entry.value : Number(entry.value) || 0;
          const pct = total > 0 && payload.length > 1 ? Math.round((val / total) * 100) : null;
          return (
            <div key={idx} className="crm-tooltip-row">
              <span
                className="crm-tooltip-dot"
                style={{ backgroundColor: rawColor, boxShadow: `0 0 6px ${rawColor}80` }}
              />
              <span className="crm-tooltip-label">{entry.name || entry.dataKey}:</span>
              <span className="crm-tooltip-value">
                {val.toLocaleString()}
                {pct !== null && <span className="crm-tooltip-pct-badge">({pct}%)</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Resilient Auto-Sizing Chart Container that guarantees non-zero rendering & responsiveness
function ChartAutoContainer({ height = 310, children }) {
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(320, window.innerWidth - 300);
    }
    return 700;
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const clientW = el.clientWidth;
      const rectW = el.getBoundingClientRect().width;
      const w = Math.floor(clientW || rectW || 0);
      if (w > 20) {
        setChartWidth(w);
      }
    };

    measure();
    const rafId = requestAnimationFrame(measure);
    const tId = setTimeout(measure, 50);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.floor(entry.contentRect?.width || el.clientWidth || 0);
          if (w > 20) {
            setChartWidth(w);
          }
        }
      });
      ro.observe(el);
    }

    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="crm-chart-canvas-wrap"
      style={{ width: '100%', minWidth: 0, height, position: 'relative' }}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          key: child.key || `${chartWidth}-${height}`,
          width: chartWidth,
          height: height
        });
      })}
    </div>
  );
}

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
  const [activityFilter, setActivityFilter] = useState('all');

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
    userStats: [],
    breakdown: [],
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reset tab-specific filters on report type change
  useEffect(() => {
    setActivityFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  }, [type]);

  // Chart view modes per tab: 'bar' | 'area'
  const [chartViewModes, setChartViewModes] = useState({
    'user-activity': 'bar',
    'calls': 'area',
    'leads': 'bar',
    'follow-ups': 'bar',
    'team-performance': 'bar'
  });

  const currentViewMode = chartViewModes[type] || (type === 'calls' ? 'area' : 'bar');
  const setTabChartMode = (mode) => {
    setChartViewModes((prev) => ({ ...prev, [type]: mode }));
  };

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
      const rawChart = Array.isArray(resData.chartData) ? resData.chartData : [];
      const normalizedChart = rawChart.map((item) => {
        const dateVal = item.day || item.date || item.name || '';
        return {
          ...item,
          day: dateVal,
          date: dateVal,
          name: item.name || dateVal,
          totalCalls: Number(item.totalCalls) || 0,
          connected: Number(item.connected) || 0,
          calls: Number(item.calls != null ? item.calls : item.totalCalls) || 0,
          assignments: Number(item.assignments) || 0,
          followups: Number(item.followups) || 0,
          completed: Number(item.completed) || 0,
          pending: Number(item.pending) || 0,
          leads: Number(item.leads) || 0,
          qualified: Number(item.qualified) || 0,
          conversions: Number(item.conversions) || 0,
        };
      });

      setData({
        summary: Array.isArray(resData.summary) ? resData.summary : [],
        columns: Array.isArray(resData.columns) ? resData.columns : [],
        rows: Array.isArray(resData.rows) ? resData.rows : [],
        chartData: normalizedChart,
        funnelStages: Array.isArray(resData.funnelStages) ? resData.funnelStages : [],
        userStats: Array.isArray(resData.userStats) ? resData.userStats : [],
        breakdown: Array.isArray(resData.breakdown) ? resData.breakdown : [],
        message: resData?.message || ''
      });
    } catch (requestError) {
      setData({ summary: [], columns: [], rows: [], chartData: [], funnelStages: [], userStats: [], breakdown: [], message: '' });
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

    // Filter by Activity Type (for user-activity)
    if (type === 'user-activity' && activityFilter !== 'all') {
      rows = rows.filter((row) => {
        const act = String(row.Activity || '').toLowerCase();
        if (activityFilter === 'calls') return act.includes('call');
        if (activityFilter === 'assignments') return act.includes('assign');
        if (activityFilter === 'follow-ups') return act.includes('follow');
        return true;
      });
    }

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
  }, [data.rows, type, activityFilter, searchTerm, sortConfig]);

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

    if (type === 'user-activity') {
      const total = processedRows.length;
      const calls = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('call')).length;
      const assignments = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('assign')).length;
      const followups = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('follow')).length;
      const uniqueUsers = new Set(processedRows.map((r) => r.User).filter((u) => u && u !== '—')).size;

      return [
        { label: 'Total Activities', value: total, icon: FiActivity, color: 'purple' },
        { label: 'Calls Logged', value: calls, icon: FiPhoneCall, color: 'blue' },
        { label: 'Lead Assignments', value: assignments, icon: FiUserCheck, color: 'indigo' },
        { label: 'Follow-ups Tracked', value: followups, icon: FiClock, color: 'emerald' },
        { label: 'Active Team Members', value: uniqueUsers, icon: FiUsers, color: 'cyan' }
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

  // Chart-specific summary metrics for instant in-card telemetry insight
  const chartHighlights = useMemo(() => {
    const chartList = data.chartData || [];

    if (type === 'user-activity') {
      const total = processedRows.length;
      const calls = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('call')).length;
      const assigns = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('assign')).length;
      const followups = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('follow')).length;
      const uniqueUsers = new Set(processedRows.map((r) => r.User).filter((u) => u && u !== '—')).size;
      return [
        { label: 'Total Events', value: total, color: 'purple', icon: FiActivity },
        { label: 'Calls Logged', value: calls, color: 'blue', icon: FiPhoneCall },
        { label: 'Assignments', value: assigns, color: 'indigo', icon: FiUserCheck },
        { label: 'Follow-ups', value: followups, color: 'emerald', icon: FiClock },
        { label: 'Active Users', value: uniqueUsers, color: 'cyan', icon: FiUsers },
      ];
    }

    if (type === 'calls') {
      const totalCalls = chartList.reduce((sum, r) => sum + (Number(r.totalCalls) || 0), 0) || processedRows.length;
      const connected = chartList.reduce((sum, r) => sum + (Number(r.connected) || 0), 0) || processedRows.filter((r) => String(r.Outcome || '').toLowerCase().includes('answered')).length;
      const missed = Math.max(0, totalCalls - connected);
      const rate = totalCalls > 0 ? `${Math.round((connected / totalCalls) * 100)}%` : '0%';
      return [
        { label: 'Total Calls Logged', value: totalCalls, color: 'blue', icon: FiPhoneCall },
        { label: 'Answered / Connected', value: connected, color: 'emerald', icon: FiCheckCircle },
        { label: 'Missed / Rejected', value: missed, color: 'rose', icon: FiAlertCircle },
        { label: 'Connectivity Rate', value: rate, color: 'cyan', icon: FiTrendingUp },
      ];
    }

    if (type === 'leads') {
      const totalLeads = chartList.reduce((sum, r) => sum + (Number(r.leads) || 0), 0) || processedRows.length;
      const qualified = chartList.reduce((sum, r) => sum + (Number(r.qualified) || 0), 0) || processedRows.filter((r) => ['qualified', 'interested', 'converted'].some((k) => String(r.Status || '').toLowerCase().includes(k))).length;
      const rate = totalLeads > 0 ? `${Math.round((qualified / totalLeads) * 100)}%` : '0%';
      let topSource = '—';
      if (chartList.length > 0) {
        const sorted = [...chartList].sort((a, b) => (Number(b.leads) || 0) - (Number(a.leads) || 0));
        if (sorted[0]?.name) topSource = `${sorted[0].name} (${sorted[0].leads})`;
      }
      return [
        { label: 'Total Leads in Scope', value: totalLeads, color: 'indigo', icon: FiUsers },
        { label: 'Qualified / Interested', value: qualified, color: 'emerald', icon: FiCheckCircle },
        { label: 'Qualification Rate', value: rate, color: 'cyan', icon: FiTrendingUp },
        { label: 'Top Acquisition Channel', value: topSource, color: 'purple', icon: FiLayers },
      ];
    }

    if (type === 'follow-ups') {
      const total = chartList.reduce((sum, r) => sum + ((Number(r.completed) || 0) + (Number(r.pending) || 0)), 0) || processedRows.length;
      const completed = chartList.reduce((sum, r) => sum + (Number(r.completed) || 0), 0) || processedRows.filter((r) => ['done', 'completed'].some((k) => String(r.Status || '').toLowerCase().includes(k))).length;
      const pending = chartList.reduce((sum, r) => sum + (Number(r.pending) || 0), 0) || processedRows.filter((r) => String(r.Status || '').toLowerCase().includes('pending')).length;
      const rate = total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
      return [
        { label: 'Total Follow-ups', value: total, color: 'purple', icon: FiClock },
        { label: 'Completed Action', value: completed, color: 'emerald', icon: FiCheckCircle },
        { label: 'Pending Action', value: pending, color: 'amber', icon: FiAlertCircle },
        { label: 'Completion Rate', value: rate, color: 'cyan', icon: FiTrendingUp },
      ];
    }

    if (type === 'team-performance') {
      const agents = chartList.length || processedRows.length;
      const calls = chartList.reduce((sum, r) => sum + (Number(r.calls) || 0), 0) || processedRows.reduce((s, r) => s + (Number(r.Calls) || 0), 0);
      const conversions = chartList.reduce((sum, r) => sum + (Number(r.conversions) || 0), 0) || processedRows.reduce((s, r) => s + (Number(r.Converted) || 0), 0);
      const rate = calls > 0 ? `${((conversions / calls) * 100).toFixed(1)}%` : '0%';
      let topAgent = '—';
      if (chartList.length > 0) {
        const sorted = [...chartList].sort((a, b) => (Number(b.conversions) || 0) - (Number(a.conversions) || 0));
        if (sorted[0]?.agent) topAgent = `${sorted[0].agent} (${sorted[0].conversions})`;
      }
      return [
        { label: 'Active Telecallers', value: agents, color: 'purple', icon: FiUsers },
        { label: 'Team Calls Made', value: calls, color: 'blue', icon: FiPhoneCall },
        { label: 'Total Conversions', value: conversions, color: 'emerald', icon: FiAward },
        { label: 'Top Closer', value: topAgent, color: 'cyan', icon: FiTrendingUp },
      ];
    }

    return [];
  }, [type, data.chartData, processedRows]);

  // Clean cell badge renderer
  const renderCellContent = (column, value) => {
    const str = String(value ?? '');
    const lower = str.toLowerCase();

    // Activity Badge (for User Activity report)
    if (column.toLowerCase() === 'activity') {
      let icon = <FiActivity size={13} />;
      let badgeClass = 'crm-act-pill-default';
      if (lower.includes('call')) {
        icon = <FiPhoneCall size={13} />;
        badgeClass = 'crm-act-pill-call';
      } else if (lower.includes('reassigned')) {
        icon = <FiRefreshCw size={13} />;
        badgeClass = 'crm-act-pill-reassign';
      } else if (lower.includes('assigned')) {
        icon = <FiUserCheck size={13} />;
        badgeClass = 'crm-act-pill-assign';
      } else if (lower.includes('follow')) {
        icon = <FiClock size={13} />;
        badgeClass = 'crm-act-pill-follow';
      }
      return (
        <span className={`crm-activity-cell-badge ${badgeClass}`}>
          {icon}
          <span>{str}</span>
        </span>
      );
    }

    // Status Badges
    if (['status', 'outcome', 'stage'].some((k) => column.toLowerCase().includes(k))) {
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
      ) : type === 'user-activity' ? (
        <div className="crm-user-activity-analytics-grid">
          {/* Main Visual: Daily Activity Volume & Velocity Trend */}
          <div className="crm-visual-card crm-activity-trend-card">
            <div className="crm-card-header">
              <div>
                <h3 className="crm-card-title">User Activity Velocity Trend</h3>
                <p className="crm-card-desc">Daily progression of calls logged, assignments, and follow-ups</p>
              </div>
              <div className="crm-header-right-group">
                <div className="crm-view-mode-toggle">
                  <button
                    type="button"
                    className={`crm-toggle-btn ${currentViewMode === 'bar' ? 'active' : ''}`}
                    onClick={() => setTabChartMode('bar')}
                  >
                    Bars
                  </button>
                  <button
                    type="button"
                    className={`crm-toggle-btn ${currentViewMode === 'area' ? 'active' : ''}`}
                    onClick={() => setTabChartMode('area')}
                  >
                    Area
                  </button>
                </div>
                <span className="crm-activity-total-pill">
                  {processedRows.length} {processedRows.length === 1 ? 'event' : 'events'}
                </span>
              </div>
            </div>

            {/* In-Card Quick KPI Summary Strip */}
            {chartHighlights.length > 0 && (
              <div className="crm-chart-stat-strip">
                {chartHighlights.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className={`crm-chart-stat-pill ${stat.color}`}>
                      <div className="crm-chart-stat-icon">
                        <Icon size={14} />
                      </div>
                      <div className="crm-chart-stat-info">
                        <span className="crm-chart-stat-val">
                          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </span>
                        <span className="crm-chart-stat-lbl">{stat.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {data.chartData && data.chartData.length > 0 ? (
              <ChartAutoContainer height={310}>
                {currentViewMode === 'bar' ? (
                  <BarChart
                    data={data.chartData}
                    margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                    barGap={4}
                  >
                    <defs>
                      <linearGradient id="barCallsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barAssignGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barFollowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Bar dataKey="calls" name="Calls Logged" fill="url(#barCallsGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="assignments" name="Lead Assignments" fill="url(#barAssignGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="followups" name="Follow-ups" fill="url(#barFollowGrad)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={data.chartData}
                    margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="actCallsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="actAssignGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="actFollowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Area type="monotone" dataKey="calls" name="Calls Logged" stroke="#3b82f6" strokeWidth={2.8} fill="url(#actCallsGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#3b82f6' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                    <Area type="monotone" dataKey="assignments" name="Lead Assignments" stroke="#8b5cf6" strokeWidth={2.8} fill="url(#actAssignGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#8b5cf6' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                    <Area type="monotone" dataKey="followups" name="Follow-ups" stroke="#10b981" strokeWidth={2.8} fill="url(#actFollowGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                  </AreaChart>
                )}
              </ChartAutoContainer>
            ) : (
              <div className="crm-chart-empty-state">
                <FiActivity size={32} color="#94a3b8" />
                <p>No activity records found for the selected observation window.</p>
              </div>
            )}
          </div>

          {/* Side Visual: Activity Type Distribution & Telecaller Leaderboard */}
          <div className="crm-visual-card crm-activity-breakdown-card">
            <div className="crm-card-header">
              <div>
                <h3 className="crm-card-title">Activity Breakdown & Team</h3>
                <p className="crm-card-desc">Type share & active telecallers</p>
              </div>
            </div>

            {/* Multi-Segment Proportion Bar */}
            {(() => {
              const total = processedRows.length || 1;
              const callsCount = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('call')).length;
              const assignsCount = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('assign')).length;
              const followCount = processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('follow')).length;
              const callsPct = Math.round((callsCount / total) * 100);
              const assignsPct = Math.round((assignsCount / total) * 100);
              const followPct = Math.max(0, 100 - callsPct - assignsPct);

              return (
                <div className="crm-multi-progress-track">
                  <div className="crm-multi-bar calls" style={{ width: `${callsPct}%` }} title={`Calls: ${callsPct}%`} />
                  <div className="crm-multi-bar assigns" style={{ width: `${assignsPct}%` }} title={`Assignments: ${assignsPct}%`} />
                  <div className="crm-multi-bar followups" style={{ width: `${followPct}%` }} title={`Follow-ups: ${followPct}%`} />
                </div>
              );
            })()}

            {/* Distribution Progress Bars */}
            <div className="crm-activity-share-list">
              {(data.breakdown?.length
                ? data.breakdown
                : [
                    {
                      name: 'Calls Logged',
                      count: processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('call')).length,
                      color: '#3b82f6'
                    },
                    {
                      name: 'Lead Assignments',
                      count: processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('assign')).length,
                      color: '#8b5cf6'
                    },
                    {
                      name: 'Follow-ups Logged',
                      count: processedRows.filter((r) => String(r.Activity || '').toLowerCase().includes('follow')).length,
                      color: '#10b981'
                    }
                  ]
              ).map((item) => {
                const total = processedRows.length || 1;
                const pct = Math.round((item.count / total) * 100) || 0;
                return (
                  <div key={item.name} className="crm-activity-share-row">
                    <div className="crm-activity-share-header">
                      <span className="crm-activity-share-name">{item.name}</span>
                      <span className="crm-activity-share-val">
                        <strong>{item.count}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="crm-progress-track">
                      <div
                        className="crm-progress-fill"
                        style={{ width: `${pct}%`, backgroundColor: item.color || '#4f46e5' }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Telecallers Ranking */}
            <div className="crm-telecaller-ranking-box">
              <h4 className="crm-sub-section-title">Active Team Members</h4>
              {(data.userStats?.length ? data.userStats : []).slice(0, 5).map((user, idx) => {
                const medalClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
                const initials = (user.user || 'U')
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div key={user.user || idx} className="crm-telecaller-rank-row">
                    <div className="crm-rank-left">
                      <span className={`crm-rank-badge ${medalClass}`}>{idx + 1}</span>
                      <span className="crm-rank-avatar">{initials}</span>
                      <span className="crm-rank-name">{user.user}</span>
                    </div>
                    <div className="crm-rank-right">
                      <span className="crm-rank-count">{user.total} actions</span>
                      <span className="crm-rank-pill">{user.calls} calls · {user.assignments} assigns · {user.followups} flws</span>
                    </div>
                  </div>
                );
              })}
              {(!data.userStats || !data.userStats.length) && (
                <div className="crm-rank-empty">No active user telemetry for this range.</div>
              )}
            </div>
          </div>
        </div>
      ) : type !== 'overview' ? (
        <div className="crm-visual-card">
          <div className="crm-card-header">
            <div>
              <h3 className="crm-card-title">
                {type === 'calls'
                  ? 'Call Reports Analytics Trend'
                  : type === 'leads'
                  ? 'Lead Reports Analytics Trend'
                  : type === 'follow-ups'
                  ? 'Follow-Up Reports Analytics Trend'
                  : type === 'team-performance'
                  ? 'Team Performance Analytics Trend'
                  : `${title} Analytics Trend`}
              </h3>
              <p className="crm-card-desc">
                {type === 'calls'
                  ? 'Telemetry metrics and connectivity over observation period'
                  : type === 'leads'
                  ? 'Channel-wise acquisition volume and qualification conversion'
                  : type === 'follow-ups'
                  ? 'Completion velocity vs pending tasks over observation period'
                  : type === 'team-performance'
                  ? 'Telecaller call volume, conversions, and quota achievement'
                  : 'Telemetry metrics over observation period'}
              </p>
            </div>
            <div className="crm-header-right-group">
              <div className="crm-view-mode-toggle">
                <button
                  type="button"
                  className={`crm-toggle-btn ${currentViewMode === 'bar' ? 'active' : ''}`}
                  onClick={() => setTabChartMode('bar')}
                >
                  Bars
                </button>
                <button
                  type="button"
                  className={`crm-toggle-btn ${currentViewMode === 'area' ? 'active' : ''}`}
                  onClick={() => setTabChartMode('area')}
                >
                  Area
                </button>
              </div>
              <span className="crm-activity-total-pill">
                {data.chartData?.length || 0}{' '}
                {type === 'team-performance' ? 'members' : type === 'leads' ? 'sources' : 'intervals'}
              </span>
            </div>
          </div>

          {/* In-Card Quick KPI Summary Strip */}
          {chartHighlights.length > 0 && (
            <div className="crm-chart-stat-strip">
              {chartHighlights.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className={`crm-chart-stat-pill ${stat.color}`}>
                    <div className="crm-chart-stat-icon">
                      <Icon size={14} />
                    </div>
                    <div className="crm-chart-stat-info">
                      <span className="crm-chart-stat-val">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </span>
                      <span className="crm-chart-stat-lbl">{stat.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data.chartData && data.chartData.length > 0 ? (
            <ChartAutoContainer height={310}>
              {type === 'calls' ? (
                currentViewMode === 'bar' ? (
                  <BarChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }} barGap={4}>
                    <defs>
                      <linearGradient id="callsConnBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="callsTotalBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Bar dataKey="totalCalls" name="Total Calls" fill="url(#callsTotalBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="connected" name="Connected Calls" fill="url(#callsConnBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                ) : (
                  <AreaChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="callsTotalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="callsConnAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Area type="monotone" dataKey="totalCalls" name="Total Calls" stroke="#3b82f6" strokeWidth={2.8} fill="url(#callsTotalAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#3b82f6' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                    <Area type="monotone" dataKey="connected" name="Connected Calls" stroke="#10b981" strokeWidth={2.8} fill="url(#callsConnAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                  </AreaChart>
                )
              ) : type === 'leads' ? (
                currentViewMode === 'bar' ? (
                  <BarChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }} barGap={4}>
                    <defs>
                      <linearGradient id="leadTotalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="leadQualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Bar dataKey="leads" name="Total Inquiries" fill="url(#leadTotalGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="qualified" name="Qualified / Interested" fill="url(#leadQualGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                ) : (
                  <AreaChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="leadTotalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="leadQualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Area type="monotone" dataKey="leads" name="Total Inquiries" stroke="#6366f1" strokeWidth={2.8} fill="url(#leadTotalAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#6366f1' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                    <Area type="monotone" dataKey="qualified" name="Qualified / Interested" stroke="#10b981" strokeWidth={2.8} fill="url(#leadQualAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                  </AreaChart>
                )
              ) : type === 'follow-ups' ? (
                currentViewMode === 'bar' ? (
                  <BarChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }} barGap={4}>
                    <defs>
                      <linearGradient id="followDoneBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="followPendingBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Bar dataKey="completed" name="Completed Follow-ups" fill="url(#followDoneBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="pending" name="Pending Follow-ups" fill="url(#followPendingBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                ) : (
                  <AreaChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="followDoneAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="followPendingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Area type="monotone" dataKey="completed" name="Completed Follow-ups" stroke="#10b981" strokeWidth={2.8} fill="url(#followDoneAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                    <Area type="monotone" dataKey="pending" name="Pending Follow-ups" stroke="#f59e0b" strokeWidth={2.8} fill="url(#followPendingAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#f59e0b' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                  </AreaChart>
                )
              ) : type === 'team-performance' ? (
                currentViewMode === 'bar' ? (
                  <BarChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }} barGap={4}>
                    <defs>
                      <linearGradient id="teamCallsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="teamConvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="agent" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Bar dataKey="calls" name="Calls Made" fill="url(#teamCallsGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="conversions" name="Conversions" fill="url(#teamConvGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                ) : (
                  <AreaChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="teamCallsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="teamConvAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="agent" tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                    <Tooltip content={<ModernChartTooltip />} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                    <Area type="monotone" dataKey="calls" name="Calls Made" stroke="#6366f1" strokeWidth={2.8} fill="url(#teamCallsAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#6366f1' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                    <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#10b981" strokeWidth={2.8} fill="url(#teamConvAreaGrad)" dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2.5 }} />
                  </AreaChart>
                )
              ) : (
                <BarChart data={data.chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey={Object.keys(data.chartData[0] || {})[0]} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                  <Tooltip content={<ModernChartTooltip />} />
                  <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 14, fontSize: 12, fontWeight: 500 }} iconType="circle" />
                  {Object.keys(data.chartData[0] || {})
                    .filter((k) => k !== Object.keys(data.chartData[0])[0])
                    .map((k, i) => (
                      <Bar
                        key={k}
                        dataKey={k}
                        fill={['#6366f1', '#10b981', '#f59e0b', '#06b6d4'][i % 4]}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                    ))}
                </BarChart>
              )}
            </ChartAutoContainer>
          ) : (
            <div className="crm-chart-empty-state">
              <FiBarChart2 size={32} color="#94a3b8" />
              <p>No telemetry data found for the selected observation window.</p>
            </div>
          )}
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

          {/* Activity Type Filter (Specific to User Activity) */}
          {type === 'user-activity' && (
            <div className="crm-toolbar-activity-filters">
              <span className="crm-toolbar-label">Activity:</span>
              {[
                { id: 'all', label: 'All Events' },
                { id: 'calls', label: 'Calls' },
                { id: 'assignments', label: 'Assignments' },
                { id: 'follow-ups', label: 'Follow-ups' }
              ].map((act) => (
                <button
                  key={act.id}
                  className={`crm-preset-pill ${activityFilter === act.id ? 'active' : ''}`}
                  onClick={() => {
                    setActivityFilter(act.id);
                    setCurrentPage(1);
                  }}
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}

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
