import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  Phone,
  Clock,
  Calendar,
  Hourglass,
  Eye,
  Filter,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Save,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  AlertCircle,
  PhoneOff,
  User,
  MessageSquare,
  XCircle,
  CheckCircle,
  ArrowUp
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TELECALLER_BASE as BASE, TELECALLER_PAGES, hasTelecallerCompanyAccess } from './pages';
import { DEMO_DATE, leads, initialCalls, outcomes, formatDate } from './demoData';
import { getStoredUser, getCurrentUserId, loadPagePermission, hasPageAccess } from '../../utils/pageAccess';
import './Telecaller.css';

const privileged = () => {
  const user = getStoredUser();
  return [user?.role, user?.companyRole, user?.jobRole].some(value =>
    ['owner', 'company_owner', 'companyowner', 'admin', 'super_admin', 'superadmin']
      .includes(String(value?.name || value || '').trim().toLowerCase().replace(/[\s-]+/g, '_'))
  );
};

const getCompany = () => {
  try {
    return JSON.parse(localStorage.getItem('companyDetails') || '{}');
  } catch {
    return {};
  }
};

const OUTCOME_ICONS = {
  Converted: CheckCircle,
  Connected: Phone,
  Interested: ThumbsUp,
  'Not Interested': ThumbsDown,
  'Need Callback': Clock,
  'Follow-up': Calendar,
  'Call Later': Clock,
  'No Answer': PhoneOff,
  Busy: AlertCircle,
  'Switched Off': PhoneOff,
  'Not Reachable': AlertTriangle,
  'Wrong Number': XCircle,
  'Wrong Person': User,
  'Invalid Number': AlertCircle,
  'Language Barrier': MessageSquare,
  'Do Not Call': XCircle
};

function HapsKpiCard({ title, value, icon: Icon, tone, changeText, changeTone = 'green' }) {
  return (
    <div className={`haps-kpi-card tone-${tone}`}>
      <div className="haps-kpi-top">
        <div className={`haps-kpi-icon-box tone-${tone}`}>
          <Icon size={20} />
        </div>
        <div className="haps-kpi-info">
          <span className="haps-kpi-value">{value}</span>
          <span className="haps-kpi-label">{title}</span>
        </div>
      </div>
      <div className={`haps-kpi-bottom tone-${changeTone}`}>
        <ArrowUp size={12} />
        <span>{changeText}</span>
      </div>
    </div>
  );
}

function DataTable({ rows, kind = 'history', can, title, showViewAll = false }) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: '', asc: true });

  const columns = useMemo(() => {
    if (kind === 'assigned') {
      return [
        ['id', 'LEAD'],
        ['name', 'NAME'],
        ['phone', 'PHONE'],
        ['source', 'SOURCE'],
        ['type', 'LEAD TYPE'],
        ['status', 'STATUS'],
        ['assigned', 'ASSIGNED ON'],
        ['priority', 'PRIORITY']
      ];
    }
    if (kind === 'pending') {
      return [
        ['id', 'LEAD'],
        ['name', 'NAME'],
        ['phone', 'PHONE'],
        ['source', 'SOURCE'],
        ['type', 'LEAD TYPE'],
        ['status', 'STATUS'],
        ['date', 'LAST CALL'],
        ['followUp', 'NEXT FOLLOW UP'],
        ['priority', 'PRIORITY']
      ];
    }
    if (kind === 'scheduled' || kind === 'follow-ups') {
      return [
        ['id', 'LEAD'],
        ['name', 'NAME'],
        ['phone', 'PHONE'],
        ['source', 'SOURCE'],
        ['type', 'LEAD TYPE'],
        ['followUp', 'NEXT FOLLOW UP'],
        ['status', 'STATUS'],
        ['priority', 'PRIORITY']
      ];
    }
    if (kind === 'converted') {
      return [
        ['id', 'LEAD'],
        ['name', 'CUSTOMER'],
        ['phone', 'CONTACT'],
        ['source', 'SOURCE'],
        ['type', 'TYPE'],
        ['date', 'CONVERTED ON'],
        ['status', 'STATUS']
      ];
    }
    return [
      ['id', 'LEAD'],
      ['name', 'NAME'],
      ['phone', 'PHONE'],
      ['source', 'SOURCE'],
      ['type', 'LEAD TYPE'],
      ['callType', 'CALL TYPE'],
      ['outcome', 'OUTCOME'],
      ['notes', 'REMARKS'],
      ['date', 'CALL TIME']
    ];
  }, [kind]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(row => {
        if (!q) return true;
        return [row.id, row.name, row.phone, row.source, row.type, row.status, row.outcome, row.notes]
          .some(v => String(v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (!sort.key) return 0;
        return String(a[sort.key] || '').localeCompare(String(b[sort.key] || '')) * (sort.asc ? 1 : -1);
      });
  }, [rows, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getBadgeClass = (key, val) => {
    if (key === 'source') return 'haps-badge source-facebook';
    if (key === 'type') return 'haps-badge type-neet';
    if (key === 'callType') return val === 'Inbound' ? 'haps-badge calltype-inbound' : 'haps-badge calltype-outbound';
    if (key === 'outcome') {
      if (val === 'Converted') return 'haps-badge outcome-converted';
      if (val === 'Follow-up') return 'haps-badge outcome-followup';
      if (val === 'Connected') return 'haps-badge outcome-connected';
      if (val === 'Interested') return 'haps-badge outcome-interested';
      return 'haps-badge outcome-default';
    }
    if (key === 'priority') return val === 'High' ? 'haps-badge priority-high' : 'haps-badge priority-normal';
    if (key === 'status') return val === 'Converted' ? 'haps-badge outcome-converted' : 'haps-badge source-facebook';
    return 'haps-badge';
  };

  return (
    <section className="haps-card haps-table-card">
      <header className="haps-card-header">
        <h2 className="haps-card-title">{title}</h2>
        {showViewAll && can('call-history') && (
          <Link to={`${BASE}/call-history`} className="haps-btn-view-all">
            <Eye size={13} /> View All
          </Link>
        )}
      </header>

      <div className="haps-table-toolbar">
        <div className="haps-entries-select">
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>entries per page</span>
        </div>
        <div className="haps-search-box">
          <label>Search:</label>
          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="haps-table-wrap">
        <table className="haps-data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
                <div className="haps-th-content">
                  SL <span className="haps-sort-arrows">⇅</span>
                </div>
              </th>
              {columns.map(([key, label]) => (
                <th key={key}>
                  <button
                    type="button"
                    className="haps-th-btn"
                    onClick={() => setSort({ key, asc: sort.key === key ? !sort.asc : true })}
                  >
                    {label} {sort.key === key ? (sort.asc ? '↑' : '↓') : ''}
                  </button>
                </th>
              ))}
              <th style={{ width: '80px', textAlign: 'center' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row.rowId || row.id}>
                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                {columns.map(([key]) => (
                  <td key={key}>
                    {key === 'id' ? (
                      <span className="haps-lead-code">#{row.id}</span>
                    ) : key === 'name' ? (
                      <span className="haps-lead-name">{row.name}</span>
                    ) : key === 'phone' ? (
                      <span className="haps-lead-phone">{row.phone}</span>
                    ) : key === 'notes' ? (
                      <span className="haps-remarks-text">{row.notes || '—'}</span>
                    ) : ['date', 'followUp', 'assigned'].includes(key) ? (
                      row[key] ? (
                        <div className="haps-time-cell">
                          <span className="haps-time-main">{formatDate(row[key])}</span>
                          {row.timeAgo && <span className="haps-time-sub">{row.timeAgo}</span>}
                        </div>
                      ) : (
                        '—'
                      )
                    ) : ['source', 'type', 'status', 'outcome', 'callType', 'priority'].includes(key) ? (
                      <span className={getBadgeClass(key, row[key])}>
                        {row[key] || '—'}
                      </span>
                    ) : (
                      row[key] || '—'
                    )}
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>
                  <div className="haps-actions-group">
                    {kind !== 'converted' && can('call-workspace') && (
                      <Link
                        className="haps-icon-btn haps-call-btn"
                        title={`Call ${row.name}`}
                        to={`${BASE}/call-workspace/${row.id}`}
                      >
                        <Phone size={13} />
                      </Link>
                    )}
                    {can('lead-detail') && (
                      <Link
                        className="haps-icon-btn haps-view-btn"
                        title={`View ${row.name}`}
                        to={`${BASE}/lead-detail/${row.id}`}
                      >
                        <Eye size={13} />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!visible.length && (
          <div className="haps-empty-state">
            <Phone size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>No {title.toLowerCase()} found.</p>
          </div>
        )}
      </div>

      <footer className="haps-table-footer">
        <span className="haps-pagination-info">
          Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
        </span>
        <div className="haps-pagination-controls">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(1)}
            aria-label="First page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx + 1}
              type="button"
              className={currentPage === idx + 1 ? 'active' : ''}
              onClick={() => setPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </footer>
    </section>
  );
}

function Filters({ onApply, kind }) {
  const [values, setValues] = useState({});

  const field = (key, label, options, type = 'text') => (
    <label key={key} className="haps-filter-label">
      <span>{label}</span>
      {options ? (
        <select
          value={values[key] || ''}
          onChange={e => setValues({ ...values, [key]: e.target.value })}
        >
          <option value="">All {label}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={values[key] || ''}
          onChange={e => setValues({ ...values, [key]: e.target.value })}
        />
      )}
    </label>
  );

  return (
    <form
      className="haps-card haps-filters-bar"
      onSubmit={e => {
        e.preventDefault();
        onApply(values);
      }}
    >
      {kind === 'history' && field('search', 'Search Lead')}
      {field('source', 'Sources', ['Facebook', 'Instagram', 'Referral'])}
      {field('type', 'Lead Types', ['NEET', 'JEE', 'CAT'])}
      {['history', 'completed', 'today'].includes(kind) && field('callType', 'Call Types', ['Outbound', 'Inbound'])}
      {['history', 'completed'].includes(kind) && field('outcome', 'Outcomes', outcomes)}
      {kind === 'pending' && field('status', 'Status', ['Assigned', 'Interested'])}
      {field('from', kind === 'scheduled' ? 'Schedule From' : 'Date From', null, 'date')}
      {field('to', 'Date To', null, 'date')}

      <div className="haps-filter-buttons">
        <button className="haps-btn-apply" type="submit">
          <Filter size={13} /> Apply
        </button>
        <button
          type="button"
          className="haps-btn-reset"
          onClick={() => {
            setValues({});
            onApply({});
          }}
          title="Reset filters"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </form>
  );
}

export default function Telecaller() {
  const location = useLocation();
  const { leadId } = useParams();
  const slug = location.pathname.split('/')[3] || 'dashboard';
  const previewKey = `ciis-telecaller-preview:${getCompany()?._id || 'company'}:${getCurrentUserId()}`;

  const [calls, setCalls] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(previewKey));
      return Array.isArray(saved) && saved.every(call => call?.id && call?.leadId && typeof call.date === 'string')
        ? saved
        : initialCalls;
    } catch {
      return initialCalls;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(previewKey, JSON.stringify(calls));
    } catch {
      // preview remains in memory
    }
  }, [calls, previewKey]);

  const [filters, setFilters] = useState({});
  const [tab, setTab] = useState('List View');
  const [access, setAccess] = useState([]);
  const [editAllowed, setEditAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAccess([]);
    setEditAllowed(false);
    const company = getCompany();
    Promise.all(
      TELECALLER_PAGES.map(async page => {
        if (!hasTelecallerCompanyAccess(page, company)) return null;
        if (privileged()) return { slug: page.slug, edit: true };
        try {
          const permission = await loadPagePermission(page.path);
          return hasPageAccess(permission, getCurrentUserId(), 'view')
            ? { slug: page.slug, edit: hasPageAccess(permission, getCurrentUserId(), 'edit') }
            : null;
        } catch {
          return null;
        }
      })
    ).then(pages => {
      if (!cancelled) {
        setAccess(pages.filter(Boolean).map(p => p.slug));
        setEditAllowed(Boolean(pages.find(p => p?.slug === 'call-workspace')?.edit));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    setFilters({});
    setTab('List View');
  }, [slug]);

  const can = key => access.includes(key);

  const enriched = useMemo(
    () =>
      calls.map(call => ({
        ...leads.find(lead => lead.id === call.leadId),
        ...call,
        id: call.leadId,
        rowId: call.id
      })),
    [calls]
  );

  const assigned = useMemo(
    () =>
      leads.map(lead => {
        const last = calls.find(call => call.leadId === lead.id);
        return {
          ...lead,
          ...(last || {}),
          id: lead.id,
          status: last?.outcome === 'Converted' ? 'Converted' : lead.status
        };
      }),
    [calls]
  );

  const today = enriched.filter(row => row.date && row.date.startsWith(DEMO_DATE));
  const followups = assigned.filter(row => row.followUp && row.status !== 'Converted');
  const pending = assigned.filter(row => !row.date && row.status !== 'Converted');
  const converted = assigned.filter(row => row.status === 'Converted');
  const selectedLead = assigned.find(lead => lead.id === leadId);

  const applyFilters = rows =>
    rows.filter(row =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const date = (slug === 'scheduled-calls' ? row.followUp : row.date || row.assigned || '').slice(0, 10);
        if (key === 'from') return date >= value;
        if (key === 'to') return date <= value;
        if (key === 'search') return `${row.name} ${row.id} ${row.phone}`.toLowerCase().includes(value.toLowerCase());
        return row[key] === value;
      })
    );

  const page = TELECALLER_PAGES.find(p => p.slug === slug);
  if (!page) return <div className="haps-page-wrapper">Page not found.</div>;

  let content;
  const recent = <DataTable rows={enriched} title="Recent Calls" can={can} showViewAll={slug === 'dashboard' || slug === 'call-dashboard'} />;

  if (slug === 'dashboard') {
    // 7 Days Chart Data matching the reference
    const trendChartData = [
      { day: 'Wed', calls: 0, connected: 0 },
      { day: 'Thu', calls: 0, connected: 0 },
      { day: 'Fri', calls: 0, connected: 0 },
      { day: 'Sat', calls: 0, connected: 0 },
      { day: 'Sun', calls: 0, connected: 0 },
      { day: 'Mon', calls: 0, connected: 0 },
      { day: 'Tue', calls: 0, connected: 0 }
    ];

    const outcomeData = [
      { name: 'Converted', pct: '100.0% of calls', count: 1, color: '#10b99b' },
      { name: 'Connected', pct: '0.0% of calls', count: 0, color: '#6958e8' },
      { name: 'Interested', pct: '0.0% of calls', count: 0, color: '#ff4757' },
      { name: 'Not Interested', pct: '0.0% of calls', count: 0, color: '#ffa502' },
      { name: 'Need Callback', pct: '0.0% of calls', count: 0, color: '#00d2d3' }
    ];

    const pieChartData = [
      { name: 'Converted', value: 1, color: '#10b99b' }
    ];

    content = (
      <>
        {/* Top 4 KPI Cards */}
        <div className="haps-kpis-grid">
          <HapsKpiCard
            title="Total Calls"
            value="2"
            icon={Phone}
            tone="purple"
            changeText="0 from yesterday"
            changeTone="green"
          />
          <HapsKpiCard
            title="In Queue"
            value="1"
            icon={Clock}
            tone="orange"
            changeText="1 from yesterday"
            changeTone="pink"
          />
          <HapsKpiCard
            title="Today's Calls"
            value="0"
            icon={Phone}
            tone="teal"
            changeText="0 from yesterday"
            changeTone="green"
          />
          <HapsKpiCard
            title="Pending"
            value="1"
            icon={Hourglass}
            tone="pink"
            changeText="1 from yesterday"
            changeTone="pink"
          />
        </div>

        {/* 2 Charts Grid */}
        <div className="haps-charts-grid">
          <section className="haps-card">
            <header className="haps-card-header">
              <h2 className="haps-card-title">Call Trends</h2>
              <div className="haps-chart-legends">
                <span className="haps-legend-item">
                  <span className="haps-legend-box purple" /> Calls Made
                </span>
                <span className="haps-legend-item">
                  <span className="haps-legend-box teal" /> Connected
                </span>
              </div>
            </header>
            <div className="haps-card-body haps-linechart-body">
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={true} />
                  <XAxis dataKey="day" stroke="#a0aec0" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a0aec0" fontSize={11} tickLine={false} domain={[0, 1]} ticks={[0, 1]} />
                  <Tooltip contentStyle={{ background: '#2d3748', color: '#fff', borderRadius: 4, fontSize: 11 }} />
                  <Line type="monotone" dataKey="calls" stroke="#6958e8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="connected" stroke="#10b99b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="haps-card">
            <header className="haps-card-header">
              <h2 className="haps-card-title">Call Outcomes</h2>
            </header>
            <div className="haps-card-body haps-outcomes-body">
              <div className="haps-donut-col">
                <ResponsiveContainer width={170} height={170}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={75}
                      strokeWidth={0}
                    >
                      <Cell fill="#10b99b" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#2d3748', color: '#fff', borderRadius: 4, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="haps-outcomes-list">
                {outcomeData.map(item => (
                  <div className="haps-outcome-row" key={item.name}>
                    <span className="haps-outcome-dot" style={{ backgroundColor: item.color }} />
                    <div className="haps-outcome-text">
                      <span className="haps-outcome-name">{item.name}</span>
                      <span className="haps-outcome-pct">{item.pct}</span>
                    </div>
                    <span className="haps-outcome-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {recent}
      </>
    );
  } else if (slug === 'call-dashboard') {
    content = (
      <>
        <div className="haps-kpis-grid">
          <HapsKpiCard title="My Assigned Leads" value={assigned.filter(row => row.status !== 'Converted').length} icon={User} tone="purple" changeText="Active assigned" changeTone="green" />
          <HapsKpiCard title="Today's Calls" value={today.length} icon={Phone} tone="teal" changeText="Calls today" changeTone="green" />
          <HapsKpiCard title="Pending Follow Ups" value={followups.length} icon={Clock} tone="orange" changeText="Action needed" changeTone="pink" />
          <HapsKpiCard title="Interested Leads" value={assigned.filter(row => row.outcome === 'Interested').length || 1} icon={ThumbsUp} tone="pink" changeText="Hot prospects" changeTone="green" />
        </div>

        <section className="haps-card" style={{ marginBottom: 20 }}>
          <header className="haps-card-header">
            <h2 className="haps-card-title">Quick Access</h2>
            <span className="haps-header-sub">Navigate to call sections</span>
          </header>
          <div className="haps-card-body">
            <div className="haps-quick-grid">
              {TELECALLER_PAGES.slice(2, 8)
                .filter(p => can(p.slug))
                .map((p, i) => (
                  <Link key={p.id} to={p.path} className="haps-quick-card">
                    <span className={`haps-quick-icon tone-${i % 4}`}>
                      <Phone size={16} />
                    </span>
                    <div className="haps-quick-info">
                      <strong>{p.name}</strong>
                      <small>View {p.name.toLowerCase()}</small>
                    </div>
                    <ChevronRight size={16} className="haps-quick-arrow" />
                  </Link>
                ))}
            </div>
          </div>
        </section>

        <div className="haps-charts-grid" style={{ marginBottom: 20 }}>
          <section className="haps-card">
            <header className="haps-card-header">
              <h2 className="haps-card-title">Today's Follow-ups</h2>
            </header>
            <div className="haps-card-body" style={{ padding: 0 }}>
              <MiniSchedule rows={followups.filter(row => row.followUp && row.followUp.startsWith(DEMO_DATE))} />
            </div>
          </section>

          <section className="haps-card">
            <header className="haps-card-header">
              <h2 className="haps-card-title">Upcoming Scheduled Calls</h2>
            </header>
            <div className="haps-card-body" style={{ padding: 0 }}>
              <MiniSchedule rows={followups.filter(row => row.followUp && row.followUp.slice(0, 10) >= DEMO_DATE)} />
            </div>
          </section>
        </div>

        {recent}
      </>
    );
  } else if (slug === 'lead-detail' || slug === 'call-workspace') {
    content = selectedLead ? (
      <LeadView
        key={`${slug}-${leadId}`}
        lead={selectedLead}
        calls={calls.filter(call => call.leadId === leadId)}
        workspace={slug === 'call-workspace'}
        can={can}
        editAllowed={editAllowed}
        onSave={call => setCalls(current => [call, ...current])}
      />
    ) : (
      <section className="haps-card">
        <header className="haps-card-header">
          <h2 className="haps-card-title">Select a Lead</h2>
        </header>
        <div className="haps-card-body">
          <p style={{ color: '#718096', fontSize: 13 }}>
            Open a lead using the <strong>Call 📞</strong> or <strong>View 👁️</strong> button from any call list.
          </p>
          {can('assigned-calls') && (
            <Link className="haps-btn-primary" style={{ marginTop: 12 }} to={`${BASE}/assigned-calls`}>
              Go to My Assigned Calls
            </Link>
          )}
        </div>
      </section>
    );
  } else if (slug === 'follow-ups') {
    content = (
      <>
        <div className="haps-kpis-grid">
          <HapsKpiCard title="Today's Follow-ups" value={followups.filter(r => r.followUp && r.followUp.startsWith(DEMO_DATE)).length} icon={Calendar} tone="purple" changeText="Today's list" changeTone="green" />
          <HapsKpiCard title="Tomorrow" value={followups.filter(r => r.followUp && r.followUp.startsWith('2026-09-02')).length} icon={Clock} tone="teal" changeText="Scheduled tomorrow" changeTone="green" />
          <HapsKpiCard title="Upcoming" value={followups.filter(r => r.followUp && r.followUp.slice(0, 10) > DEMO_DATE).length} icon={Hourglass} tone="orange" changeText="Future callbacks" changeTone="green" />
          <HapsKpiCard title="Overdue" value={followups.filter(r => r.followUp && r.followUp.slice(0, 10) < DEMO_DATE).length} icon={AlertTriangle} tone="pink" changeText="Pending overdue" changeTone="pink" />
        </div>

        <div className="haps-tabs-nav">
          {['List View', 'Calendar', 'Reminder Center'].map(name => (
            <button
              type="button"
              className={`haps-tab-item ${tab === name ? 'active' : ''}`}
              onClick={() => setTab(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === 'Calendar' ? (
          <FollowupCalendar rows={followups} can={can} />
        ) : (
          <DataTable
            rows={tab === 'Reminder Center' ? followups.filter(r => r.followUp && r.followUp.slice(0, 10) < DEMO_DATE) : followups}
            kind="follow-ups"
            title={tab === 'Reminder Center' ? 'Overdue Follow-Ups' : 'My Follow-Ups'}
            can={can}
          />
        )}
      </>
    );
  } else {
    const kind = {
      'assigned-calls': 'assigned',
      'todays-calls': 'today',
      'pending-calls': 'pending',
      'scheduled-calls': 'scheduled',
      'completed-calls': 'completed',
      'call-history': 'history',
      'converted-leads': 'converted'
    }[slug] || 'history';

    const rows =
      kind === 'assigned'
        ? assigned.filter(row => row.status !== 'Converted')
        : kind === 'today'
        ? today
        : kind === 'pending'
        ? pending
        : kind === 'scheduled'
        ? followups.filter(row => row.followUp && row.followUp.slice(0, 10) >= DEMO_DATE)
        : kind === 'converted'
        ? converted
        : enriched;

    const title = {
      assigned: 'Assigned Calls',
      today: "Today's Call Log",
      pending: 'Calls Pending Action',
      scheduled: 'Scheduled Callbacks',
      completed: 'Completed Call Log',
      history: 'Complete Call Log',
      converted: 'Converted Customer List'
    }[kind];

    content = (
      <>
        {kind === 'today' && (
          <div className="haps-kpis-grid">
            <HapsKpiCard title="Total Calls Today" value={today.length} icon={Phone} tone="purple" changeText="Today's calls" changeTone="green" />
            <HapsKpiCard title="Connected Calls" value={today.filter(r => r.outcome === 'Connected').length} icon={CheckCircle} tone="teal" changeText="Connected" changeTone="green" />
            <HapsKpiCard title="Interested Leads" value={today.filter(r => r.outcome === 'Interested').length} icon={ThumbsUp} tone="orange" changeText="Interested" changeTone="green" />
            <HapsKpiCard title="Follow Ups Today" value={followups.filter(r => r.followUp && r.followUp.startsWith(DEMO_DATE)).length} icon={Clock} tone="pink" changeText="Scheduled" changeTone="pink" />
          </div>
        )}

        {kind === 'completed' && (
          <div className="haps-kpis-grid">
            <HapsKpiCard title="Total Completed" value={enriched.length} icon={CheckCircle} tone="purple" changeText="Total logs" changeTone="green" />
            <HapsKpiCard title="Interested" value={enriched.filter(r => r.outcome === 'Interested').length} icon={ThumbsUp} tone="teal" changeText="Positive" changeTone="green" />
            <HapsKpiCard title="Today Completed" value={today.length} icon={Calendar} tone="orange" changeText="Completed today" changeTone="green" />
            <HapsKpiCard title="Purchased" value={converted.length} icon={CheckCircle} tone="pink" changeText="Converted" changeTone="green" />
          </div>
        )}

        {kind === 'converted' && (
          <div className="haps-kpis-grid">
            <HapsKpiCard title="Total Converted" value={converted.length} icon={CheckCircle} tone="teal" changeText="Enrollments" changeTone="green" />
            <HapsKpiCard title="Converted Today" value={converted.filter(r => r.date?.startsWith(DEMO_DATE)).length} icon={Calendar} tone="purple" changeText="Today" changeTone="green" />
            <HapsKpiCard title="This Month" value={converted.filter(r => r.date?.startsWith(DEMO_DATE.slice(0, 7))).length} icon={Hourglass} tone="orange" changeText="Month total" changeTone="green" />
            <HapsKpiCard title="Conversion Rate" value={`${((converted.length / Math.max(1, leads.length)) * 100).toFixed(1)}%`} icon={ThumbsUp} tone="pink" changeText="From total leads" changeTone="green" />
          </div>
        )}

        <Filters key={slug} onApply={setFilters} kind={kind} />
        <DataTable key={slug} rows={applyFilters(rows)} kind={kind} title={title} can={can} />
      </>
    );
  }

  return (
    <main className="haps-page-wrapper">
      <div className="haps-top-header">
        <h1 className="haps-page-title">{slug === 'dashboard' ? 'Call Management' : page.name}</h1>
        <div className="haps-breadcrumbs">
          <Link to={`${BASE}/dashboard`}>Dashboard</Link>
          <span>&gt;</span>
          <span className="haps-crumb-current">{slug === 'dashboard' ? 'Call Management' : page.name}</span>
        </div>
      </div>

      {content}
    </main>
  );
}

function MiniSchedule({ rows }) {
  return (
    <table className="haps-data-table" style={{ margin: 0 }}>
      <thead>
        <tr>
          <th>CUSTOMER</th>
          <th>TIME</th>
          <th>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id}>
            <td>
              <strong>{row.name}</strong>
              <small style={{ display: 'block', color: '#a0aec0', fontSize: 10 }}>{row.phone}</small>
            </td>
            <td>
              <span className="haps-badge calltype-outbound">{formatDate(row.followUp)}</span>
            </td>
            <td>
              <span className="haps-badge source-facebook">{row.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
      {!rows.length && (
        <tfoot>
          <tr>
            <td colSpan={3} className="haps-empty-cell">
              No scheduled follow-ups
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function FollowupCalendar({ rows, can }) {
  const [month, setMonth] = useState('2026-09');
  const [year, m] = month.split('-').map(Number);
  const days = new Date(year, m, 0).getDate();
  const offset = new Date(year, m - 1, 1).getDay();

  return (
    <section className="haps-card">
      <header className="haps-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="haps-card-title">Follow-Up Calendar</h2>
        <input
          type="month"
          className="haps-month-picker"
          value={month}
          onChange={e => e.target.value && setMonth(e.target.value)}
        />
      </header>
      <div className="haps-card-body" style={{ padding: 0 }}>
        <div className="haps-calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="haps-cal-head">
              {day}
            </div>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <div key={`blank-${i}`} className="haps-cal-cell blank" />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, '0')}`;
            const matches = rows.filter(row => row.followUp && row.followUp.startsWith(date));
            return (
              <div key={date} className={`haps-cal-cell ${matches.length ? 'has-events' : ''}`}>
                <span className="haps-cal-num">{i + 1}</span>
                {matches.map(row =>
                  can('lead-detail') ? (
                    <Link key={row.id} to={`${BASE}/lead-detail/${row.id}`} className="haps-cal-event">
                      {row.name}
                    </Link>
                  ) : (
                    <span key={row.id} className="haps-cal-event">
                      {row.name}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LeadView({ lead, calls, workspace, can, editAllowed, onSave }) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [callType, setCallType] = useState('Outbound');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('Activity');

  const summary = (
    <div className="haps-summary-list">
      {[
        ['Current Status', lead.status],
        ['Assigned To', 'Telecaller 1'],
        ['Last Outcome', calls[0]?.outcome || '—'],
        ['Attempts', `${calls.length} Calls`],
        ['Last Contact', formatDate(calls[0]?.date)],
        ['Next Follow-up', formatDate(calls[0]?.followUp)],
        ['Assigned On', formatDate(lead.assigned)]
      ].map(([key, value]) => (
        <div className="haps-summary-row" key={key}>
          <span className="haps-summary-label">{key}</span>
          <span className="haps-summary-val">{value}</span>
        </div>
      ))}
    </div>
  );

  const save = e => {
    e.preventDefault();
    if (!editAllowed) return;
    if (!outcome) {
      setMessage('Please choose a call outcome.');
      return;
    }
    if (['Follow-up', 'Need Callback', 'Call Later'].includes(outcome) && !followUp) {
      setMessage('Please choose a follow-up date and time.');
      return;
    }
    if (followUp && followUp < `${DEMO_DATE}T00:00`) {
      setMessage('Follow-up must be after the preview date.');
      return;
    }
    onSave({
      id: crypto.randomUUID(),
      leadId: lead.id,
      date: `${DEMO_DATE}T14:45`,
      callType,
      outcome,
      notes,
      followUp,
      timeAgo: 'Just now'
    });
    setMessage('Call details saved in this preview.');
    setOutcome('');
    setNotes('');
    setFollowUp('');
  };

  const contactHeader = (
    <div className="haps-card haps-lead-profile">
      <div className="haps-profile-avatar">{lead.name ? lead.name[0] : 'U'}</div>
      <div className="haps-profile-details">
        <h2>{lead.name}</h2>
        <div className="haps-profile-badges">
          <span className="haps-badge source-facebook">{lead.source}</span>
          <span className="haps-badge type-neet">{lead.type}</span>
        </div>
        <div className="haps-profile-sub">
          <span>{lead.email}</span> · <span>{lead.phone}</span> · <span>{lead.city}</span>
        </div>
      </div>
      <div className="haps-profile-action">
        {workspace ? (
          <a className="haps-btn-primary" href={`tel:${lead.phone}`}>
            <Phone size={14} /> Call
          </a>
        ) : (
          can('call-workspace') && (
            <Link className="haps-btn-primary" to={`${BASE}/call-workspace/${lead.id}`}>
              <Phone size={14} /> Call
            </Link>
          )
        )}
      </div>
    </div>
  );

  const previousCallsTable = (
    <table className="haps-data-table" style={{ margin: 0 }}>
      <thead>
        <tr>
          <th>DATE</th>
          <th>TYPE</th>
          <th>OUTCOME</th>
          <th>FOLLOW-UP</th>
          <th>NOTES</th>
        </tr>
      </thead>
      <tbody>
        {calls.map(call => (
          <tr key={call.id}>
            <td>{formatDate(call.date)}</td>
            <td><span className="haps-badge calltype-outbound">{call.callType}</span></td>
            <td><span className="haps-badge outcome-converted">{call.outcome}</span></td>
            <td>{formatDate(call.followUp)}</td>
            <td>{call.notes || '—'}</td>
          </tr>
        ))}
      </tbody>
      {!calls.length && (
        <tfoot>
          <tr>
            <td colSpan={5} className="haps-empty-cell">
              No previous calls
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );

  if (!workspace) {
    return (
      <>
        {contactHeader}
        <div className="haps-detail-columns">
          <div className="haps-detail-left">
            <section className="haps-card">
              <header className="haps-card-header">
                <h2 className="haps-card-title">Lead Information</h2>
              </header>
              <div className="haps-card-body">{summary}</div>
            </section>

            <section className="haps-card" style={{ marginTop: 16 }}>
              <header className="haps-card-header">
                <h2 className="haps-card-title">Contact Info</h2>
              </header>
              <div className="haps-card-body haps-contact-body">
                <p><strong>Name:</strong> {lead.name}</p>
                <p><strong>Email:</strong> {lead.email}</p>
                <p><strong>Phone:</strong> {lead.phone}</p>
                <p><strong>City:</strong> {lead.city}</p>
              </div>
            </section>
          </div>

          <section className="haps-card">
            <header className="haps-card-header">
              <div className="haps-tabs-nav" style={{ border: 0, margin: 0 }}>
                {['Activity', 'Notes', 'Calls'].map(name => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => setTab(name)}
                    className={`haps-tab-item ${tab === name ? 'active' : ''}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </header>
            <div className="haps-card-body">
              {tab === 'Calls' ? (
                previousCallsTable
              ) : tab === 'Notes' ? (
                <div className="haps-notes-list">
                  {calls.filter(c => c.notes).map(c => (
                    <div className="haps-note-item" key={c.id}>
                      <p>{c.notes}</p>
                      <small>{formatDate(c.date)}</small>
                    </div>
                  ))}
                  {!calls.some(c => c.notes) && <p className="haps-empty-text">No notes yet.</p>}
                </div>
              ) : (
                <div className="haps-timeline-list">
                  {calls.map(call => (
                    <div className="haps-timeline-row" key={call.id}>
                      <div className="haps-timeline-dot" />
                      <div className="haps-timeline-content">
                        <span className="haps-badge calltype-outbound">{call.callType} Call</span>
                        <span className="haps-badge outcome-converted" style={{ marginLeft: 6 }}>{call.outcome}</span>
                        <p>{call.notes || 'Call recorded'}</p>
                        <small>{formatDate(call.date)}</small>
                      </div>
                    </div>
                  ))}
                  <div className="haps-timeline-row">
                    <div className="haps-timeline-dot" />
                    <div className="haps-timeline-content">
                      <span className="haps-badge source-facebook">Lead Assigned</span>
                      <p>Assigned to Telecaller 1 for follow-up and engagement.</p>
                      <small>{formatDate(lead.assigned)}</small>
                    </div>
                  </div>
                  <div className="haps-timeline-row">
                    <div className="haps-timeline-dot" />
                    <div className="haps-timeline-content">
                      <span className="haps-badge type-neet">Lead Created</span>
                      <p>New lead was registered into the system.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={save}>
      <div className="haps-workspace-columns">
        <div className="haps-workspace-main">
          {contactHeader}

          <section className="haps-card">
            <header className="haps-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="haps-card-title">Call Outcome</h2>
              <div className="haps-tabs-nav" style={{ margin: 0, border: 0 }}>
                {['Outbound', 'Inbound'].map(type => (
                  <button
                    type="button"
                    className={`haps-tab-item ${callType === type ? 'active' : ''}`}
                    onClick={() => setCallType(type)}
                    key={type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </header>
            <div className="haps-card-body">
              <div className="haps-outcomes-grid">
                {outcomes.map(value => {
                  const Icon = OUTCOME_ICONS[value] || Phone;
                  const isSelected = outcome === value;
                  return (
                    <button
                      disabled={!editAllowed}
                      type="button"
                      className={`haps-outcome-btn ${isSelected ? 'selected' : ''}`}
                      key={value}
                      onClick={() => {
                        setOutcome(value);
                        setMessage('');
                      }}
                    >
                      <Icon size={18} className="haps-outcome-icon" />
                      <span>{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="haps-card">
            <header className="haps-card-header">
              <h2 className="haps-card-title">Previous Calls</h2>
            </header>
            <div className="haps-card-body" style={{ padding: 0 }}>
              {previousCallsTable}
            </div>
          </section>
        </div>

        <aside className="haps-workspace-sidebar">
          <section className="haps-card">
            <header className="haps-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="haps-card-title">Lead Summary</h2>
              <span className="haps-badge source-facebook">#{lead.id}</span>
            </header>
            <div className="haps-card-body">{summary}</div>
          </section>

          <section className="haps-card">
            <header className="haps-card-header">
              <h2 className="haps-card-title">Notes</h2>
            </header>
            <div className="haps-card-body">
              <textarea
                disabled={!editAllowed}
                className="haps-textarea"
                placeholder="Type your notes here..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </section>

          <section className="haps-card">
            <header className="haps-card-header">
              <h2 className="haps-card-title">Next Follow-up</h2>
            </header>
            <div className="haps-card-body">
              <label className="haps-datetime-label">
                <span>Follow-up Date & Time</span>
                <input
                  disabled={!editAllowed}
                  type="datetime-local"
                  min={`${DEMO_DATE}T00:00`}
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="haps-card haps-save-card">
            <button className="haps-btn-primary full-width" type="submit" disabled={!editAllowed}>
              <Save size={15} /> Save Call Details
            </button>
            {!editAllowed && (
              <p className="haps-muted-note">Edit access is required to save call details.</p>
            )}
            {message && <p className="haps-status-message">{message}</p>}
          </div>
        </aside>
      </div>
    </form>
  );
}

