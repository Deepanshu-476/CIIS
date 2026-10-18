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
  { key: "projects", label: "Projects", icon: "folder" },
  { key: "attendance", label: "Attendance", icon: "schedule" },
  { key: "leaves", label: "Leaves", icon: "event_busy" },
  { key: "meetings", label: "Meetings", icon: "video_call" },
  { key: "clients", label: "Clients", icon: "business_center" },
  { key: "client-tasks", label: "Client Tasks", icon: "assignment" },
  { key: "client-meetings", label: "Client Meetings", icon: "groups_2" },
  { key: "services", label: "Services", icon: "design_services" },
  { key: "leads", label: "Leads", icon: "person_search" },
  { key: "calls", label: "CRM Calls", icon: "call" },
  { key: "follow-ups", label: "Follow-ups", icon: "pending_actions" },
  { key: "assignments", label: "Lead Assignments", icon: "swap_horiz" },
  { key: "support-tickets", label: "Support Tickets", icon: "support_agent" },
  { key: "assets", label: "Assets", icon: "inventory_2" },
  { key: "asset-requests", label: "Asset Requests", icon: "assignment_return" },
  { key: "alerts", label: "Alerts", icon: "notifications" },
  { key: "groups", label: "Groups", icon: "diversity_3" },
  { key: "departments", label: "Departments", icon: "apartment" },
  { key: "branches", label: "Branches", icon: "store" },
  { key: "job-roles", label: "Job Roles", icon: "work" },
  { key: "holidays", label: "Holidays", icon: "celebration" },
  { key: "payroll", label: "Payroll", icon: "payments" },
];

const pill = value => <span className="CAD-pill CAD-pill-blue">{pretty(value)}</span>;
const activePill = active => <span className={`CAD-pill ${active === false ? "CAD-pill-red" : "CAD-pill-green"}`}>{active === false ? "Inactive" : "Active"}</span>;
const names = list => (list || []).map(item => item?.name).filter(Boolean).join(", ") || "—";

const LISTS = {
  projects: {
    search: "Search project",
    statuses: ["all", "active", "planning", "on hold", "completed", "cancelled"],
    columns: [
      ["Project", x => <><strong>{x.projectName}</strong><div className="CDV-sub">{x.description || ""}</div></>],
      ["Team", x => names(x.users)],
      ["Tasks", x => `${x.completedTasks || 0} / ${x.taskCount || 0} done`],
      ["Status", x => pill(x.status)],
      ["Priority", x => pretty(x.priority)],
      ["Start", x => fmtDate(x.startDate)],
      ["End", x => fmtDate(x.endDate)],
    ],
  },
  meetings: {
    search: "Search meeting",
    columns: [
      ["Meeting", x => <><strong>{x.title}</strong><div className="CDV-sub">{x.description || ""}</div></>],
      ["Date", x => `${fmtDate(x.date)} ${x.time || ""}`],
      ["Attendees", x => names(x.attendees)],
      ["Created by", x => x.createdBy?.name || "—"],
    ],
  },
  "client-tasks": {
    search: "Search task, service, assignee",
    statuses: ["all", "pending", "in-progress", "onhold", "completed", "overdue", "reopen"],
    columns: [
      ["Task", x => <><strong>{x.name}</strong><div className="CDV-sub">{x.service || ""}</div></>],
      ["Client", x => x.clientId?.client || "—"],
      ["Assignee", x => x.assignee || "—"],
      ["Plan", x => x.planName || "—"],
      ["Priority", x => pretty(x.priority)],
      ["Status", x => pill(x.completed ? "completed" : x.status)],
      ["Due", x => fmtDate(x.dueDate)],
    ],
  },
  "client-meetings": {
    search: "Search title or client",
    statuses: ["all", "scheduled", "completed", "cancelled", "rescheduled"],
    columns: [
      ["Meeting", x => <><strong>{x.title}</strong><div className="CDV-sub">{x.clientName}</div></>],
      ["Type", x => pretty(x.meetingType)],
      ["When", x => `${fmtDate(x.meetingDate)} ${x.meetingTime || ""}`],
      ["Status", x => pill(x.status)],
      ["Priority", x => pretty(x.priority)],
      ["Created by", x => x.createdBy?.name || "—"],
    ],
  },
  services: {
    search: "Search service",
    columns: [["Service", x => <strong>{x.servicename}</strong>], ["Added", x => fmtDate(x.createdAt)]],
  },
  leads: {
    search: "Search name, phone, email, telecaller",
    statuses: ["all", "new", "follow-up", "interested", "not interested", "converted", "closed"],
    columns: [
      ["Lead", x => <><strong>{x.name}</strong><div className="CDV-sub">{x.phone} {x.email ? `· ${x.email}` : ""}</div></>],
      ["Source", x => x.leadSourceName || "—"],
      ["Type", x => x.leadTypeName || "—"],
      ["Status", x => pill(x.status)],
      ["Assigned to", x => x.assignedToName || "Unassigned"],
      ["Next follow-up", x => fmtDate(x.nextFollowUp, true)],
      ["Created", x => fmtDate(x.createdAt)],
    ],
  },
  "follow-ups": {
    search: "Search lead or telecaller",
    statuses: ["all", "pending", "done"],
    columns: [
      ["Lead", x => <><strong>{x.leadName}</strong><div className="CDV-sub">{x.leadPhone}</div></>],
      ["Telecaller", x => x.agentName || "—"],
      ["Due", x => fmtDate(x.date, true)],
      ["Priority", x => pretty(x.priority)],
      ["Status", x => pill(x.status)],
      ["Note", x => x.note || "—"],
    ],
  },
  assignments: {
    search: "Search lead or telecaller",
    statuses: ["all", "assigned", "reassigned", "unassigned"],
    columns: [
      ["Lead", x => <><strong>{x.leadName}</strong><div className="CDV-sub">{x.leadPhone}</div></>],
      ["From", x => x.fromUserName || "—"],
      ["To", x => x.toUserName || "—"],
      ["By", x => x.performedByName || "—"],
      ["Action", x => pill(x.action)],
      ["Reason", x => x.reason || "—"],
      ["When", x => fmtDate(x.createdAt, true)],
    ],
  },
  "support-tickets": {
    search: "Search ticket, subject, requester",
    statuses: ["all", "open", "in progress", "waiting", "escalated", "resolved", "closed"],
    columns: [
      ["Ticket", x => <><strong>{x.ticketNumber}</strong><div className="CDV-sub">{x.subject}</div></>],
      ["Requester", x => x.requesterName || "—"],
      ["Category", x => pretty(x.category)],
      ["Priority", x => pretty(x.priority)],
      ["Status", x => pill(x.status)],
      ["Assigned to", x => x.assignedToName || "—"],
      ["Created", x => fmtDate(x.createdAt, true)],
    ],
  },
  assets: {
    search: "Search asset or holder",
    statuses: ["all", "available", "assigned", "maintenance"],
    columns: [
      ["Asset", x => <><strong>{x.name}</strong><div className="CDV-sub">{x.description || ""}</div></>],
      ["Qty", x => x.quantity ?? "—"],
      ["Status", x => pill(x.status)],
      ["Branch", x => x.branchName || "—"],
      ["Assigned to", x => x.assignedToName || "—"],
      ["Since", x => fmtDate(x.assignedDate)],
    ],
  },
  "asset-requests": {
    search: "Search asset",
    statuses: ["all", "pending", "approved", "rejected", "return_requested", "pending_verification", "deposited", "completed", "cancelled"],
    columns: [
      ["Employee", x => <><strong>{x.user?.name || "—"}</strong><div className="CDV-sub">{x.user?.employeeId || ""}</div></>],
      ["Asset", x => x.assetName || "—"],
      ["Type", x => pretty(x.requestType)],
      ["Status", x => pill(x.status)],
      ["Reason", x => x.reason || "—"],
      ["Requested", x => fmtDate(x.requestDate || x.createdAt)],
    ],
  },
  alerts: {
    search: "Search alert",
    statuses: ["all", "info", "warning", "error"],
    columns: [
      ["Alert", x => <><strong>{x.title || pretty(x.type)}</strong><div className="CDV-sub">{x.message}</div></>],
      ["Type", x => pill(x.type)],
      ["Sent to", x => x.audience],
      ["Read by", x => x.readCount],
      ["By", x => x.createdByName || "—"],
      ["When", x => fmtDate(x.createdAt, true)],
    ],
  },
  groups: {
    search: "Search group",
    columns: [
      ["Group", x => <><strong>{x.name}</strong><div className="CDV-sub">{x.description || ""}</div></>],
      ["Members", x => x.memberCount],
      ["Created by", x => x.createdBy?.name || "—"],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  departments: {
    search: "Search department",
    columns: [
      ["Department", x => <strong>{x.name}</strong>],
      ["Branch", x => x.branchName || "—"],
      ["Support head", x => x.supportHeadName || "—"],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  branches: {
    search: "Search branch",
    columns: [
      ["Branch", x => <><strong>{x.name}</strong>{x.isDefault ? <div className="CDV-sub">Default</div> : null}</>],
      ["Code", x => x.branchCode || "—"],
      ["Phone", x => x.phone || "—"],
      ["Address", x => x.address || "—"],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  "job-roles": {
    search: "Search job role",
    columns: [
      ["Job role", x => <strong>{x.name}</strong>],
      ["Department", x => x.departmentName || "—"],
      ["Shifts", x => x.shiftCount],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  holidays: {
    search: "Search holiday",
    columns: [
      ["Holiday", x => <><strong>{x.title}</strong><div className="CDV-sub">{x.description || ""}</div></>],
      ["Date", x => fmtDate(x.date)],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  payroll: {
    statuses: ["all", "draft", "calculated", "reviewed", "approved", "locked"],
    columns: [
      ["Month", x => <strong>{x.month}</strong>],
      ["Status", x => pill(x.status)],
      ["Employees", x => x.employeeCount],
      ["Calculated", x => fmtDate(x.calculatedAt, true)],
      ["Approved", x => fmtDate(x.approvedAt, true)],
      ["Locked", x => fmtDate(x.lockedAt, true)],
    ],
  },
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
    statuses: ["all", "present", "late", "half day", "absent", "short leave", "holiday", "weekend"],
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
    search: "Search lead, phone, telecaller",
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
                <Stat icon="folder" label="Projects" value={s?.projects} />
                <Stat icon="support_agent" label="Open support tickets" value={s?.openTickets} />
                <Stat icon="assignment_return" label="Pending asset requests" value={s?.pendingAssetRequests} />
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
