import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../config";
import CIISLoader from "../Loader/CIISLoader";
import "./AllCompany.css";
import "./CompanyAdminDetails.css";
import "./CompanyDataView.css";

// Read-only view of one company's data for the platform owner, opened in a new tab from All Company.
// Data: /superAdmin/company/:id/view/* (platform owner only; nothing here can change data).

const api = (path, params) => axios.get(`${API_URL}${path}`, {
  params,
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const fmtDate = (value, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};
const fmtTime = value => (value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—");
const pretty = value => String(value || "—").replace(/[_-]+/g, " ").replace(/\b\w/g, ch => ch.toUpperCase());
const duration = seconds => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
};
const todayKey = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

const TABS = [
  { key: "overview", label: "Overview", icon: "dashboard" },
  { key: "users", label: "Users", icon: "groups" },
  { key: "tasks", label: "Tasks", icon: "task_alt" },
  { key: "attendance", label: "Attendance", icon: "schedule" },
  { key: "leaves", label: "Leaves", icon: "event_busy" },
  { key: "clients", label: "Clients", icon: "business_center" },
  { key: "calls", label: "CRM Calls", icon: "call" },
];

const LISTS = {
  users: {
    search: "Search name, email, phone, ID",
    statuses: ["all", "active", "inactive"],
    columns: [
      ["Name", u => <><strong>{u.name}</strong><div className="CDV-sub">{u.email}</div></>],
      ["Phone", u => u.phone || "—"],
      ["Employee ID", u => u.employeeId || "—"],
      ["Role", u => pretty(u.companyRole || u.jobRoleName || u.jobRole)],
      ["Department", u => u.departmentName || (/^[0-9a-f]{24}$/i.test(String(u.department || "")) ? "—" : u.department) || "—"],
      ["Branch", u => u.branch?.name || u.branchName || "—"],
      ["Status", u => <span className={`CAD-pill ${u.isActive === false ? "CAD-pill-red" : "CAD-pill-green"}`}>{u.isActive === false ? "Inactive" : "Active"}</span>],
      ["Last login", u => fmtDate(u.lastLogin, true)],
    ],
  },
  tasks: {
    search: "Search task title",
    statuses: ["all", "pending", "in-progress", "onhold", "completed", "approved", "rejected", "overdue", "reopen"],
    columns: [
      ["Task", t => <><strong>{t.title}</strong><div className="CDV-sub">{t.taskFor === "self" ? "Personal" : "Assigned"}</div></>],
      ["Assigned to", t => (t.assignedUsers || []).map(u => u.name).filter(Boolean).join(", ") || "—"],
      ["Created by", t => t.createdBy?.name || "—"],
      ["Priority", t => pretty(t.priority)],
      ["Status", t => <span className="CAD-pill CAD-pill-blue">{pretty(t.overallStatus)}</span>],
      ["Due", t => fmtDate(t.dueDateTime, true)],
      ["Created", t => fmtDate(t.createdAt)],
    ],
  },
  attendance: {
    date: true,
    statuses: ["all", "present", "late", "half-day", "absent", "leave"],
    columns: [
      ["Employee", a => <><strong>{a.user?.name || "—"}</strong><div className="CDV-sub">{a.user?.employeeId || ""}</div></>],
      ["Status", a => <span className="CAD-pill CAD-pill-blue">{pretty(a.status)}</span>],
      ["In", a => fmtTime(a.inTime)],
      ["Out", a => (a.isClockedIn ? "Working" : fmtTime(a.outTime))],
      ["Total", a => a.totalTime || "—"],
      ["Late by", a => a.lateBy || "—"],
      ["Shift", a => a.shiftName || "—"],
    ],
  },
  leaves: {
    statuses: ["all", "pending", "approved", "rejected", "cancelled"],
    columns: [
      ["Employee", l => <><strong>{l.user?.name || "—"}</strong><div className="CDV-sub">{l.user?.employeeId || ""}</div></>],
      ["Type", l => pretty(l.type)],
      ["From", l => fmtDate(l.startDate)],
      ["To", l => fmtDate(l.endDate)],
      ["Days", l => l.days ?? "—"],
      ["Status", l => <span className="CAD-pill CAD-pill-blue">{pretty(l.status)}</span>],
      ["Reason", l => l.reason || "—"],
    ],
  },
  clients: {
    search: "Search client, company, email, phone",
    columns: [
      ["Client", c => <><strong>{c.client}</strong><div className="CDV-sub">{c.company}</div></>],
      ["Email", c => c.email || "—"],
      ["Phone", c => c.phone || "—"],
      ["City", c => c.city || "—"],
      ["Services", c => (c.services || []).join(", ") || "—"],
      ["Status", c => <span className="CAD-pill CAD-pill-blue">{c.status || "—"}</span>],
      ["Added", c => fmtDate(c.createdAt)],
    ],
  },
  calls: {
    statuses: ["all", "answered", "missed", "not reachable", "rejected"],
    columns: [
      ["Lead", c => <><strong>{c.leadName || "—"}</strong><div className="CDV-sub">{c.leadPhone}</div></>],
      ["Telecaller", c => c.agentName || "—"],
      ["Type", c => pretty(c.callType)],
      ["Outcome", c => <span className="CAD-pill CAD-pill-blue">{pretty(c.status)}</span>],
      ["Duration", c => duration(c.duration)],
      ["Time", c => fmtDate(c.createdAt, true)],
      ["Notes", c => c.notes || "—"],
    ],
  },
};

const Stat = ({ icon, label, value, sub }) => (
  <div className="CAD-card CDV-stat">
    <span className="material-icons">{icon}</span>
    <div>
      <div className="CDV-stat-value">{value ?? "—"}</div>
      <div className="CDV-stat-label">{label}</div>
      {sub ? <div className="CDV-sub">{sub}</div> : null}
    </div>
  </div>
);

const breakdown = map => Object.entries(map || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${pretty(k)} ${v}`).join(" · ");

function ListTab({ companyId, tab }) {
  const config = LISTS[tab];
  const [query, setQuery] = useState({ page: 1, search: "", status: "all", date: todayKey() });
  const [search, setSearch] = useState("");
  const [state, setState] = useState({ loading: true, items: [], total: 0, pages: 1, error: "" });

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q => (q.search === search ? q : { ...q, search, page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setState(s => ({ ...s, loading: true, error: "" }));
    const params = { page: query.page, limit: 20 };
    if (query.search) params.search = query.search;
    if (query.status !== "all") params.status = query.status;
    if (config.date) params.date = query.date;
    api(`/superAdmin/company/${companyId}/view/${tab}`, params)
      .then(({ data }) => active && setState({ loading: false, items: data.items || [], total: data.total || 0, pages: data.pages || 1, error: "" }))
      .catch(err => active && setState({ loading: false, items: [], total: 0, pages: 1, error: err.response?.data?.message || "Could not load data." }));
    return () => { active = false; };
  }, [companyId, tab, query, config.date]);

  return (
    <div className="CAD-card CDV-list">
      <div className="CDV-toolbar">
        {config.search ? (
          <input className="AllCompany-input" placeholder={config.search} value={search} onChange={e => setSearch(e.target.value)} />
        ) : null}
        {config.statuses ? (
          <select className="AllCompany-input" value={query.status} onChange={e => setQuery(q => ({ ...q, status: e.target.value, page: 1 }))}>
            {config.statuses.map(s => <option key={s} value={s}>{s === "all" ? "All status" : pretty(s)}</option>)}
          </select>
        ) : null}
        {config.date ? (
          <input className="AllCompany-input" type="date" value={query.date} onChange={e => setQuery(q => ({ ...q, date: e.target.value, page: 1 }))} />
        ) : null}
        <span className="CDV-count">{state.total} records</span>
      </div>
      {state.error ? <div className="CDV-empty CDV-error">{state.error}</div> : null}
      <div className="CDV-table-wrap">
        <table className="CDV-table">
          <thead><tr>{config.columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>
            {state.loading ? (
              <tr><td colSpan={config.columns.length} className="CDV-empty">Loading…</td></tr>
            ) : state.items.length === 0 ? (
              <tr><td colSpan={config.columns.length} className="CDV-empty">No records.</td></tr>
            ) : state.items.map(item => (
              <tr key={item._id}>{config.columns.map(([label, render]) => <td key={label}>{render(item)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="CDV-pager">
        <button type="button" className="AllCompany-btn AllCompany-btn-outline" disabled={query.page <= 1} onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}>Previous</button>
        <span>Page {query.page} of {state.pages}</span>
        <button type="button" className="AllCompany-btn AllCompany-btn-outline" disabled={query.page >= state.pages} onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}>Next</button>
      </div>
    </div>
  );
}

export default function CompanyDataView() {
  const { companyId } = useParams();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api(`/superAdmin/company/${companyId}/view/summary`);
      setOverview(data);
      if (data?.company?.companyName) document.title = `${data.company.companyName} · Company data`;
    } catch (err) {
      setError(err.response?.data?.message || "Could not load company data.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  if (loading) return <CIISLoader />;
  const company = overview?.company || {};
  const s = overview?.summary;

  return (
    <div className="AllCompany-page">
      <div className="AllCompany-page-inner CAD-inner">
        {error ? (
          <div className="CAD-card CAD-error">
            <span className="material-icons">error_outline</span>
            <div>
              <strong>{error}</strong>
              <button type="button" className="AllCompany-btn AllCompany-btn-outline" onClick={loadOverview}>Retry</button>
            </div>
          </div>
        ) : (
          <>
            <section className="CAD-card CDV-head">
              <div>
                <div className="CAD-eyebrow">Company data · read only</div>
                <h1>{company.companyName}</h1>
                <div className="CAD-company-meta">
                  <span>{company.companyCode}</span>
                  <span className={`CAD-pill ${company.isActive === false ? "CAD-pill-red" : "CAD-pill-green"}`}>{company.isActive === false ? "Inactive" : "Active"}</span>
                  <span className="CAD-pill CAD-pill-blue">{company.subscriptionPlan || "No plan"} · Exp {fmtDate(company.subscriptionExpiry)}</span>
                </div>
              </div>
              <a className="AllCompany-btn AllCompany-btn-outline" href={`/Ciis-network/all-company/${companyId}/admins`} target="_blank" rel="noopener noreferrer">
                <span className="material-icons">admin_panel_settings</span> Admin details
              </a>
            </section>

            <nav className="CDV-tabs">
              {TABS.map(t => (
                <button key={t.key} type="button" className={`CDV-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                  <span className="material-icons">{t.icon}</span>{t.label}
                </button>
              ))}
            </nav>

            {tab === "overview" ? (
              <div className="CDV-stats">
                <Stat icon="groups" label="Users" value={s?.users.total} sub={`${s?.users.active} active`} />
                <Stat icon="task_alt" label="Tasks" value={s?.tasks.total} sub={breakdown(s?.tasks.byStatus)} />
                <Stat icon="schedule" label="Attendance today" value={s?.attendanceToday.total} sub={`${breakdown(s?.attendanceToday.byStatus) || "None marked"} · ${s?.attendanceToday.notMarked} not marked`} />
                <Stat icon="event_busy" label="Pending leaves" value={s?.leaves.pending} />
                <Stat icon="person_search" label="Leads" value={s?.crm.leads} sub={breakdown(s?.crm.leadsByStatus)} />
                <Stat icon="call" label="Calls today" value={s?.crm.callsToday} sub={`${s?.crm.totalCalls} total calls`} />
                <Stat icon="pending_actions" label="Pending follow-ups" value={s?.crm.pendingFollowUps} />
                <Stat icon="business_center" label="Clients" value={s?.clients} />
                <Stat icon="video_call" label="Upcoming meetings" value={s?.upcomingMeetings} />
              </div>
            ) : (
              <ListTab key={tab} companyId={companyId} tab={tab} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
