import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config";
import CIISLoader from "../Loader/CIISLoader";
import "./AllCompany.css";
import "./CompanyAdminDetails.css";
import "./CompanyDataView.css";
import { pageName } from "../utils/pageNames";
import {
  LayoutDashboard,
  LineChart,
  Users,
  CheckSquare,
  FolderGit2,
  Clock,
  CalendarOff,
  Video,
  Building2,
  FileCheck,
  Calendar,
  Layers,
  UserCheck,
  PhoneCall,
  Clock3,
  ArrowRightLeft,
  LifeBuoy,
  Box,
  RotateCcw,
  Bell,
  MessageSquare,
  Building,
  Store,
  Award,
  Sun,
  CreditCard,
  Search,
  X,
  ShieldCheck,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  FileEdit,
  Activity
} from "lucide-react";

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

// Pastel avatar palettes
const AVATAR_PALETTES = [
  { bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', text: '#3730a3' },
  { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', text: '#9d174d' },
  { bg: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)', text: '#115e59' },
  { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', text: '#92400e' },
  { bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', text: '#5b21b6' },
  { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', text: '#075985' },
];

function getAvatarStyle(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function CompanyAvatar({ name = '', size = 46, fontSize = '1.05rem' }) {
  const palette = getAvatarStyle(name);
  const initials = getInitials(name);
  return (
    <div
      className="CDV-avatar-circle"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: palette.bg,
        color: palette.text,
        fontSize,
      }}
    >
      {initials}
    </div>
  );
}

// 1-Click Copyable Code Pill Component
function CopyCodePill({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      className={`CDV-code-pill ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      title="Click to copy company code"
    >
      <span className="CDV-code-label">CODE:</span>
      <span className="CDV-code-text">{code}</span>
      {copied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
      {copied && <span className="CDV-copied-tooltip">Copied!</span>}
    </button>
  );
}

const getSubscriptionMeta = (expiryDate) => {
  if (!expiryDate) return { label: 'No expiry set', isExpired: false, daysLeft: null };
  const exp = new Date(expiryDate).getTime();
  const diffDays = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', isExpired: true, daysLeft: 0 };
  if (diffDays === 0) return { label: 'Expires today', isExpired: false, daysLeft: 0 };
  return { label: `${diffDays}d left`, isExpired: false, daysLeft: diffDays };
};

const TAB_ICONS = {
  overview: LayoutDashboard,
  usage: LineChart,
  users: Users,
  tasks: CheckSquare,
  projects: FolderGit2,
  attendance: Clock,
  leaves: CalendarOff,
  meetings: Video,
  clients: Building2,
  "client-tasks": FileCheck,
  "client-meetings": Calendar,
  services: Layers,
  leads: UserCheck,
  calls: PhoneCall,
  "follow-ups": Clock3,
  assignments: ArrowRightLeft,
  "support-tickets": LifeBuoy,
  assets: Box,
  "asset-requests": RotateCcw,
  alerts: Bell,
  groups: MessageSquare,
  departments: Building,
  branches: Store,
  "job-roles": Award,
  holidays: Sun,
  payroll: CreditCard,
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "usage", label: "Usage & Logins" },
  { key: "users", label: "Users" },
  { key: "tasks", label: "Tasks" },
  { key: "projects", label: "Projects" },
  { key: "attendance", label: "Attendance" },
  { key: "leaves", label: "Leaves" },
  { key: "meetings", label: "Meetings" },
  { key: "clients", label: "Clients" },
  { key: "client-tasks", label: "Client Tasks" },
  { key: "client-meetings", label: "Client Meetings" },
  { key: "services", label: "Services" },
  { key: "leads", label: "Leads" },
  { key: "calls", label: "CRM Calls" },
  { key: "follow-ups", label: "Follow-ups" },
  { key: "assignments", label: "Lead Assignments" },
  { key: "support-tickets", label: "Support Tickets" },
  { key: "assets", label: "Assets" },
  { key: "asset-requests", label: "Asset Requests" },
  { key: "alerts", label: "Alerts" },
  { key: "groups", label: "Groups" },
  { key: "departments", label: "Departments" },
  { key: "branches", label: "Branches" },
  { key: "job-roles", label: "Job Roles" },
  { key: "holidays", label: "Holidays" },
  { key: "payroll", label: "Payroll" },
];

const SECTIONS = [
  { label: "Main", tabs: ["overview", "usage", "users"] },
  { label: "Work & Operations", tabs: ["tasks", "projects", "attendance", "leaves", "meetings"] },
  { label: "Clients & Services", tabs: ["clients", "client-tasks", "client-meetings", "services"] },
  { label: "CRM & Leads", tabs: ["leads", "calls", "follow-ups", "assignments"] },
  { label: "Communication", tabs: ["support-tickets", "alerts", "groups"] },
  { label: "Administration", tabs: ["departments", "branches", "job-roles", "holidays", "assets", "asset-requests"] },
  { label: "Payroll", tabs: ["payroll"] },
];

const ALWAYS_SHOWN = new Set(["overview", "usage", "users", "branches", "holidays"]);
const TAB_PAGES = {
  tasks: ["task-management", "company-all-task", "admin-task-create"],
  projects: ["adminproject", "project"],
  attendance: ["emp-attendance", "attendance"],
  leaves: ["emp-leaves", "my-leaves", "leave-policy"],
  meetings: ["admin-meeting", "employee-meeting"],
  clients: ["emp-client", "active-clients"],
  "client-tasks": ["emp-client", "active-clients"],
  "client-meetings": ["client-meeting"],
  services: ["emp-client"],
  leads: ["admin-crm-"],
  calls: ["admin-crm-", "admin-telecaller-"],
  "follow-ups": ["admin-crm-", "admin-telecaller-"],
  assignments: ["admin-crm-"],
  "support-tickets": ["support-desk", "support-operations"],
  alerts: ["alert", "create-alert"],
  groups: ["manage-groups", "chat"],
  departments: ["department"],
  "job-roles": ["JobRoleManagement"],
  assets: ["emp-assets", "my-assets", "company-assets"],
  "asset-requests": ["emp-assets", "my-assets"],
  payroll: ["payroll-process", "salary-component", "salary-structure", "salary-assignment", "assign-salary", "payslip", "payroll-reports"],
};

const normalizePage = value => String(value || "").trim().replace(/^\/+/, "").replace(/^ciisuser\//i, "").toLowerCase();
const isTabInPlan = (tabKey, allowedPages) => {
  if (ALWAYS_SHOWN.has(tabKey) || !allowedPages.length) return true;
  return (TAB_PAGES[tabKey] || []).some(page => {
    const key = page.toLowerCase();
    return key.endsWith("-") ? allowedPages.some(p => p.startsWith(key)) : allowedPages.includes(key);
  });
};

const pill = value => {
  const norm = String(value || '').toLowerCase().trim();
  let cls = 'CDV-pill-blue';
  if (['completed', 'approved', 'active', 'converted', 'available', 'deposited', 'calculated', 'locked', 'done', 'answered'].includes(norm)) {
    cls = 'CDV-pill-green';
  } else if (['pending', 'follow-up', 'in-progress', 'in progress', 'waiting', 'planning', 'scheduled', 'reviewed'].includes(norm)) {
    cls = 'CDV-pill-yellow';
  } else if (['rejected', 'inactive', 'cancelled', 'overdue', 'closed', 'missed', 'escalated'].includes(norm)) {
    cls = 'CDV-pill-red';
  } else if (['on hold', 'onhold', 'not reachable'].includes(norm)) {
    cls = 'CDV-pill-gray';
  }
  return <span className={`CDV-pill ${cls}`}>{pretty(value)}</span>;
};

const activePill = active => (
  <span className={`CDV-pill ${active === false ? "CDV-pill-red" : "CDV-pill-green"}`}>
    {active === false ? "Inactive" : "Active"}
  </span>
);

const names = list => (list || []).map(item => item?.name).filter(Boolean).join(", ") || "—";

const LISTS = {
  projects: {
    search: "Search project...",
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
    search: "Search meeting...",
    columns: [
      ["Meeting", x => <><strong>{x.title}</strong><div className="CDV-sub">{x.description || ""}</div></>],
      ["Date", x => `${fmtDate(x.date)} ${x.time || ""}`],
      ["Attendees", x => names(x.attendees)],
      ["Created by", x => x.createdBy?.name || "—"],
    ],
  },
  "client-tasks": {
    search: "Search task, service, assignee...",
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
    search: "Search title or client...",
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
    search: "Search service...",
    columns: [["Service", x => <strong>{x.servicename}</strong>], ["Added", x => fmtDate(x.createdAt)]],
  },
  leads: {
    search: "Search name, phone, email, telecaller...",
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
    search: "Search lead or telecaller...",
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
    search: "Search lead or telecaller...",
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
    search: "Search ticket, subject, requester...",
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
    search: "Search asset or holder...",
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
    search: "Search asset...",
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
    search: "Search alert...",
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
    search: "Search group...",
    columns: [
      ["Group", x => <><strong>{x.name}</strong><div className="CDV-sub">{x.description || ""}</div></>],
      ["Members", x => x.memberCount],
      ["Created by", x => x.createdBy?.name || "—"],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  departments: {
    search: "Search department...",
    columns: [
      ["Department", x => <strong>{x.name}</strong>],
      ["Branch", x => x.branchName || "—"],
      ["Support head", x => x.supportHeadName || "—"],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  branches: {
    search: "Search branch...",
    columns: [
      ["Branch", x => <><strong>{x.name}</strong>{x.isDefault ? <div className="CDV-sub">Default</div> : null}</>],
      ["Code", x => x.branchCode || "—"],
      ["Phone", x => x.phone || "—"],
      ["Address", x => x.address || "—"],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  "job-roles": {
    search: "Search job role...",
    columns: [
      ["Job role", x => <strong>{x.name}</strong>],
      ["Department", x => x.departmentName || "—"],
      ["Shifts", x => x.shiftCount],
      ["Status", x => activePill(x.isActive)],
    ],
  },
  holidays: {
    search: "Search holiday...",
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
    search: "Search name, email, phone, ID...",
    statuses: ["all", "active", "inactive"],
    columns: [
      ["Name", u => <><strong>{u.name}</strong><div className="CDV-sub">{u.email}</div></>],
      ["Phone", u => u.phone || "—"],
      ["Employee ID", u => u.employeeId || "—"],
      ["Role", u => pretty(u.companyRole || u.jobRoleName || u.jobRole)],
      ["Department", u => u.departmentName || (/^[0-9a-f]{24}$/i.test(String(u.department || "")) ? "—" : u.department) || "—"],
      ["Branch", u => u.branch?.name || u.branchName || "—"],
      ["Status", u => <span className={`CDV-pill ${u.isActive === false ? "CDV-pill-red" : "CDV-pill-green"}`}>{u.isActive === false ? "Inactive" : "Active"}</span>],
      ["Last login", u => fmtDate(u.lastLogin, true)],
    ],
  },
  tasks: {
    search: "Search task title...",
    statuses: ["all", "pending", "in-progress", "onhold", "completed", "approved", "rejected", "overdue", "reopen"],
    columns: [
      ["Task", t => <><strong>{t.title}</strong><div className="CDV-sub">{t.taskFor === "self" ? "Personal" : "Assigned"}</div></>],
      ["Assigned to", t => (t.assignedUsers || []).map(u => u.name).filter(Boolean).join(", ") || "—"],
      ["Created by", t => t.createdBy?.name || "—"],
      ["Priority", t => pretty(t.priority)],
      ["Status", t => pill(t.overallStatus)],
      ["Due", t => fmtDate(t.dueDateTime, true)],
      ["Created", t => fmtDate(t.createdAt)],
    ],
  },
  attendance: {
    date: true,
    statuses: ["all", "present", "late", "half day", "absent", "short leave", "holiday", "weekend"],
    columns: [
      ["Employee", a => <><strong>{a.user?.name || "—"}</strong><div className="CDV-sub">{a.user?.employeeId || ""}</div></>],
      ["Status", a => pill(a.status)],
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
      ["Status", l => pill(l.status)],
      ["Reason", l => l.reason || "—"],
    ],
  },
  clients: {
    search: "Search client, company, email, phone...",
    columns: [
      ["Client", c => <><strong>{c.client}</strong><div className="CDV-sub">{c.company}</div></>],
      ["Email", c => c.email || "—"],
      ["Phone", c => c.phone || "—"],
      ["City", c => c.city || "—"],
      ["Services", c => (c.services || []).join(", ") || "—"],
      ["Status", c => pill(c.status || "active")],
      ["Added", c => fmtDate(c.createdAt)],
    ],
  },
  calls: {
    search: "Search lead, phone, telecaller...",
    statuses: ["all", "answered", "missed", "not reachable", "rejected"],
    columns: [
      ["Lead", c => <><strong>{c.leadName || "—"}</strong><div className="CDV-sub">{c.leadPhone}</div></>],
      ["Telecaller", c => c.agentName || "—"],
      ["Type", c => pretty(c.callType)],
      ["Outcome", c => pill(c.status)],
      ["Duration", c => duration(c.duration)],
      ["Time", c => fmtDate(c.createdAt, true)],
      ["Notes", c => c.notes || "—"],
    ],
  },
};

const STAT_CONFIG = {
  groups: { icon: Users, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', tab: 'users' },
  task_alt: { icon: CheckSquare, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', tab: 'tasks' },
  schedule: { icon: Clock, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', tab: 'attendance' },
  event_busy: { icon: CalendarOff, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', tab: 'leaves' },
  person_search: { icon: UserCheck, color: '#d97706', bg: '#fffbeb', border: '#fde68a', tab: 'leads' },
  call: { icon: PhoneCall, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', tab: 'calls' },
  pending_actions: { icon: Clock3, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', tab: 'follow-ups' },
  business_center: { icon: Building2, color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', tab: 'clients' },
  video_call: { icon: Video, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', tab: 'meetings' },
  folder: { icon: FolderGit2, color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', tab: 'projects' },
  support_agent: { icon: LifeBuoy, color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', tab: 'support-tickets' },
  assignment_return: { icon: RotateCcw, color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', tab: 'asset-requests' },
  login: { icon: ShieldCheck, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', tab: 'usage' },
  how_to_reg: { icon: UserCheck, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', tab: 'usage' },
  person_check: { icon: Activity, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', tab: 'usage' },
  visibility: { icon: Eye, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', tab: 'usage' },
  edit_note: { icon: FileEdit, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', tab: 'usage' },
};

const Stat = ({ icon, label, value, sub, onSelectTab }) => {
  const cfg = STAT_CONFIG[icon] || { icon: LayoutDashboard, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
  const IconComponent = cfg.icon;
  const isClickable = Boolean(cfg.tab && onSelectTab);

  return (
    <div
      className={`CDV-stat-card ${isClickable ? 'clickable' : ''}`}
      onClick={() => isClickable && onSelectTab(cfg.tab)}
      title={isClickable ? `Click to view ${label}` : undefined}
    >
      <div className="CDV-stat-header">
        <span className="CDV-stat-label" title={label}>{label}</span>
        <div className="CDV-stat-icon" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
          <IconComponent size={14} />
        </div>
      </div>
      <div className="CDV-stat-value">{value ?? "—"}</div>
      {sub ? <div className="CDV-stat-sub" title={sub}>{sub}</div> : null}
    </div>
  );
};

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
    <div className="CDV-card CDV-list-card">
      <div className="CDV-toolbar">
        {config.search ? (
          <div className="CDV-search-box">
            <Search size={14} className="CDV-search-icon" />
            <input
              className="CDV-input"
              placeholder={config.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="CDV-clear-btn" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>
        ) : null}
        {config.statuses ? (
          <select
            className="CDV-select"
            value={query.status}
            onChange={e => setQuery(q => ({ ...q, status: e.target.value, page: 1 }))}
          >
            {config.statuses.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : pretty(s)}</option>)}
          </select>
        ) : null}
        {config.date ? (
          <input
            className="CDV-input CDV-date-input"
            type="date"
            value={query.date}
            onChange={e => setQuery(q => ({ ...q, date: e.target.value, page: 1 }))}
          />
        ) : null}
        <div className="CDV-toolbar-meta">
          <span className="CDV-count-badge">{state.total} records</span>
        </div>
      </div>

      {state.error ? (
        <div className="CDV-error-banner">
          <AlertCircle size={16} />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="CDV-table-wrap">
        <table className="CDV-table">
          <thead>
            <tr>
              {config.columns.map(([label]) => <th key={label}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {state.loading ? (
              <tr>
                <td colSpan={config.columns.length} className="CDV-empty">
                  <div className="CDV-spinner-wrap">
                    <div className="CDV-spinner" />
                    <span>Loading {pretty(tab)}...</span>
                  </div>
                </td>
              </tr>
            ) : state.items.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length} className="CDV-empty">
                  <div className="CDV-empty-box">
                    <Layers size={28} opacity={0.4} />
                    <p style={{ fontWeight: 600, margin: "8px 0 4px", color: "#0f172a" }}>No records found</p>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                      {search || query.status !== "all" ? "Try adjusting your search query or filters." : "No data recorded for this module yet."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              state.items.map(item => (
                <tr key={item._id}>
                  {config.columns.map(([label, render]) => <td key={label}>{render(item)}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="CDV-pager">
        <span className="CDV-pager-info">
          Page <strong>{query.page}</strong> of <strong>{state.pages || 1}</strong> ({state.total} total)
        </span>
        <div className="CDV-pager-actions">
          <button
            type="button"
            className="CDV-btn-page"
            disabled={query.page <= 1}
            onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <button
            type="button"
            className="CDV-btn-page"
            disabled={query.page >= state.pages}
            onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

const USAGE_RANGES = [
  { value: 1, label: "Today" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

function getStaffEngagement(views = 0, actions = 0) {
  if (actions >= 8 || (views > 0 && actions / views >= 0.25)) {
    return { label: 'High Activity', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
  }
  if (actions >= 2 || (views > 0 && actions / views >= 0.1)) {
    return { label: 'Productive', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' };
  }
  return { label: 'Browsing', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
}

function UsageTab({ companyId, allowedPages }) {
  const [days, setDays] = useState(1);
  const [pageSearch, setPageSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    let active = true;
    setState(s => ({ ...s, loading: true, error: "" }));
    api(`/superAdmin/company/${companyId}/view/usage`, { days })
      .then(({ data }) => active && setState({ loading: false, data, error: "" }))
      .catch(err => active && setState({ loading: false, data: null, error: err.response?.data?.message || "Could not load usage." }));
    return () => { active = false; };
  }, [companyId, days]);

  const data = state.data;
  const t = data?.totals || {};
  const allPages = (data?.pages || []).filter(p => p.path !== "(unknown)");
  const maxPageHits = Math.max(1, ...allPages.map(p => (p.views || 0) + (p.actions || 0)));

  const filteredPages = useMemo(() => {
    if (!pageSearch.trim()) return allPages.slice(0, 15);
    const term = pageSearch.toLowerCase();
    return allPages.filter(p => pageName(p.path).toLowerCase().includes(term) || p.path.toLowerCase().includes(term));
  }, [allPages, pageSearch]);

  const allUsers = data?.users || [];
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers;
    const term = userSearch.toLowerCase();
    return allUsers.filter(u => [u.name, u.role, u.department, u.email].some(v => String(v || '').toLowerCase().includes(term)));
  }, [allUsers, userSearch]);

  const used = new Set(allPages.map(p => normalizePage(p.path)));
  const unusedPlanPages = allowedPages.filter(key => !used.has(key) && !key.includes("/") && !key.startsWith("client"));

  // Hourly Activity Bars (9 AM to 6 PM IST)
  const hourlyData = useMemo(() => {
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const map = new Map((data?.hourly || []).map(h => [h.hour, h.count]));
    const max = Math.max(1, ...Array.from(map.values()));
    return hours.map(hr => {
      const count = map.get(hr) || 0;
      const label = hr > 12 ? `${hr - 12} PM` : hr === 12 ? '12 PM' : `${hr} AM`;
      const height = Math.max(4, Math.round((count / max) * 100));
      return { hr, label, count, height };
    });
  }, [data?.hourly]);

  // Source Stats
  const sourceStats = useMemo(() => {
    const s = data?.sources || { web: 0, app: 0 };
    const total = (s.web || 0) + (s.app || 0) || 1;
    return {
      web: s.web || 0,
      webPct: Math.round(((s.web || 0) / total) * 100),
      app: s.app || 0,
      appPct: Math.round(((s.app || 0) / total) * 100),
    };
  }, [data?.sources]);

  const activeRate = t.activeAccounts > 0 ? Math.round(((t.activeInRange || 0) / t.activeAccounts) * 100) : 0;
  const attendanceRate = t.activeAccounts > 0 ? Math.round(((t.loggedInToday || 0) / t.activeAccounts) * 100) : 0;

  return (
    <div className="CDV-usage">
      {/* Timeframe Toolbar */}
      <div className="CDV-toolbar" style={{ justifyContent: 'space-between' }}>
        <div className="CDV-period-chips">
          {USAGE_RANGES.map(r => (
            <button
              key={r.value}
              type="button"
              className={`CDV-period-chip ${days === r.value ? 'active' : ''}`}
              onClick={() => setDays(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="CDV-toolbar-meta">
          <span className="CDV-count-badge">System User Activity Tracking</span>
        </div>
      </div>

      {state.error ? (
        <div className="CDV-error-banner">
          <AlertCircle size={16} />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.loading && !data ? (
        <div className="CDV-spinner-wrap">
          <div className="CDV-spinner" />
          <span>Loading activity intelligence...</span>
        </div>
      ) : null}

      {data ? (
        <>
          {/* Executive KPI Cards */}
          <div className="CDV-stats CDV-usage-stats">
            <Stat icon="groups" label="Total Staff Accounts" value={t.users} sub={`${t.activeAccounts} active accounts`} />
            <Stat icon="login" label="Logged In Today" value={t.loggedInToday} sub={`${attendanceRate}% of workforce present today`} />
            <Stat icon="person_check" label="Engaged Staff" value={t.activeInRange} sub={`${activeRate}% adoption in this period`} />
            <Stat icon="visibility" label="Pages Opened (Views)" value={t.views} sub="Total module navigation" />
            <Stat icon="edit_note" label="Data Changes" value={t.actions} sub="Writes, creates & updates" />
            <Stat icon="how_to_reg" label="Period Logins" value={t.loggedInInRange} sub={`${t.neverLoggedIn} staff never logged in`} />
          </div>

          {/* Analytics Grid: Hourly Traffic & Device Breakdown */}
          <div className="CDV-analytics-grid">
            {/* Peak Hours Chart */}
            <div className="CDV-analytics-card">
              <div className="CDV-card-title-row">
                <span className="CDV-card-title">
                  <Clock size={16} color="#2563eb" /> Peak Business Traffic (9 AM - 6 PM IST)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Hourly Distribution</span>
              </div>
              <div className="CDV-hourly-chart">
                {hourlyData.map(h => (
                  <div key={h.hr} className="CDV-hour-bar-col" title={`${h.label}: ${h.count} activities`}>
                    <div className="CDV-hour-bar-wrap">
                      <div className="CDV-hour-bar-fill" style={{ height: `${h.height}%` }} />
                    </div>
                    <span className="CDV-hour-label">{h.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Usage Distribution */}
            <div className="CDV-analytics-card">
              <div className="CDV-card-title-row">
                <span className="CDV-card-title">
                  <Layers size={16} color="#7c3aed" /> Platform Device Split
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Client Apps</span>
              </div>
              <div className="CDV-source-rows">
                <div className="CDV-source-item">
                  <div className="CDV-source-info">
                    <span style={{ color: '#0f172a' }}>Web Portal Desktop</span>
                    <span style={{ color: '#2563eb' }}>{sourceStats.web} hits ({sourceStats.webPct}%)</span>
                  </div>
                  <div className="CDV-source-bar">
                    <div className="CDV-source-fill" style={{ width: `${sourceStats.webPct}%`, background: '#2563eb' }} />
                  </div>
                </div>

                <div className="CDV-source-item" style={{ marginTop: 6 }}>
                  <div className="CDV-source-info">
                    <span style={{ color: '#0f172a' }}>Mobile Application</span>
                    <span style={{ color: '#7c3aed' }}>{sourceStats.app} hits ({sourceStats.appPct}%)</span>
                  </div>
                  <div className="CDV-source-bar">
                    <div className="CDV-source-fill" style={{ width: `${sourceStats.appPct}%`, background: '#7c3aed' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unused Plan Features Alert */}
          {unusedPlanPages.length > 0 && (
            <div className="CDV-unused-alert">
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Unutilized Subscription Features</strong>
                <div style={{ marginTop: 2, fontSize: '0.76rem' }}>
                  These modules are included in this company's subscription plan, but recorded 0 page visits in this period:
                </div>
                <div className="CDV-unused-pills">
                  {unusedPlanPages.map(key => (
                    <span key={key} className="CDV-unused-pill">{pageName(`/ciisUser/${key}`)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Module & Pages Adoption Table */}
          <div className="CDV-section-heading-row">
            <h3>Most Used Modules & Pages</h3>
            <div className="CDV-search-box" style={{ maxWidth: 240, height: 32 }}>
              <Search size={13} className="CDV-search-icon" />
              <input
                className="CDV-input"
                placeholder="Filter pages..."
                value={pageSearch}
                onChange={e => setPageSearch(e.target.value)}
              />
              {pageSearch && (
                <button type="button" className="CDV-clear-btn" onClick={() => setPageSearch('')}>
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="CDV-card CDV-table-wrap">
            <table className="CDV-table">
              <thead>
                <tr>
                  <th>Page / Module</th>
                  <th style={{ textAlign: "right" }}>Opened (Views)</th>
                  <th style={{ textAlign: "right" }}>Changes Made</th>
                  <th style={{ textAlign: "right" }}>Staff Count</th>
                  <th style={{ textAlign: "right" }}>Avg Duration</th>
                  <th>Last Accessed</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map(p => {
                  const total = (p.views || 0) + (p.actions || 0);
                  const pct = Math.max(4, Math.round((total / maxPageHits) * 100));
                  return (
                    <tr key={p.path}>
                      <td style={{ minWidth: 220 }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{pageName(p.path)}</div>
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: 4 }} />
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>{p.views}</td>
                      <td style={{ textAlign: "right", fontWeight: 500, color: p.actions > 0 ? '#ea580c' : 'inherit' }}>
                        {p.actions}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="CDV-pill CDV-pill-blue">{p.uniqueUsers}</span>
                      </td>
                      <td style={{ textAlign: "right", color: '#64748b', fontSize: '0.76rem' }}>
                        {p.avgDurationMs ? duration(p.avgDurationMs / 1000) : '—'}
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "#64748b" }}>{fmtDate(p.lastAt, true)}</td>
                    </tr>
                  );
                })}
                {!filteredPages.length ? (
                  <tr>
                    <td colSpan={6} className="CDV-empty">No page activity matches "{pageSearch}".</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Staff Logins & Operational Engagement Table */}
          <div className="CDV-section-heading-row">
            <h3>Staff Logins & Operational Engagement</h3>
            <div className="CDV-search-box" style={{ maxWidth: 240, height: 32 }}>
              <Search size={13} className="CDV-search-icon" />
              <input
                className="CDV-input"
                placeholder="Search staff..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              {userSearch && (
                <button type="button" className="CDV-clear-btn" onClick={() => setUserSearch('')}>
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="CDV-card CDV-table-wrap">
            <table className="CDV-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role & Dept</th>
                  <th>Status</th>
                  <th>Productivity</th>
                  <th>Top Page</th>
                  <th>Last Login</th>
                  <th>Last Active</th>
                  <th style={{ textAlign: "right" }}>Pages Opened</th>
                  <th style={{ textAlign: "right" }}>Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const engagement = getStaffEngagement(u.views, u.actions);
                  const isPresentToday = (() => {
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const startMs = todayStart.getTime();
                    const l = u.lastLogin ? new Date(u.lastLogin).getTime() : 0;
                    const a = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
                    return l >= startMs || a >= startMs;
                  })();

                  return (
                    <tr key={u._id}>
                      <td style={{ minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <CompanyAvatar name={u.name} size={30} fontSize="0.75rem" />
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{pretty(u.role)}</div>
                        {u.department && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{u.department}</div>}
                      </td>
                      <td>
                        {isPresentToday ? (
                          <span className="CDV-pill CDV-pill-green">Active Today</span>
                        ) : (
                          <span className="CDV-pill CDV-pill-gray">Offline</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="CDV-engagement-badge"
                          style={{ color: engagement.color, background: engagement.bg, borderColor: engagement.border }}
                        >
                          {engagement.label}
                        </span>
                      </td>
                      <td style={{ minWidth: 140, color: '#2563eb', fontWeight: 500 }}>
                        {u.topPage ? (
                          <span title={u.topPage}>{pageName(u.topPage)}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 400 }} title="No page activity recorded in this period">—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {u.lastLogin ? (
                          fmtDate(u.lastLogin, true)
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }} title="Never logged in">Never</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {u.lastActiveAt ? (
                          fmtDate(u.lastActiveAt, true)
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }} title="No in-app page actions in this period">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>{u.views}</td>
                      <td style={{ textAlign: "right", fontWeight: 500, color: u.actions > 0 ? '#ea580c' : 'inherit' }}>
                        {u.actions}
                      </td>
                    </tr>
                  );
                })}
                {!filteredUsers.length ? (
                  <tr>
                    <td colSpan={9} className="CDV-empty">No employees match "{userSearch}".</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function CompanyDataView() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [allowedPages, setAllowedPages] = useState([]);
  const [showAllModules, setShowAllModules] = useState(false);

  const loadOverview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError("");
    try {
      const [{ data }, companyRes] = await Promise.all([
        api(`/superAdmin/company/${companyId}/view/summary`),
        api(`/company/${companyId}`).catch(() => null),
      ]);
      const companyRecord = companyRes?.data?.company || companyRes?.data?.data || companyRes?.data || {};
      setAllowedPages(Array.isArray(companyRecord.allowedPages) ? companyRecord.allowedPages.map(normalizePage).filter(Boolean) : []);
      setOverview(data);
      if (data?.company?.companyName) document.title = `${data.company.companyName} · Company Operations`;
    } catch (err) {
      setError(err.response?.data?.message || "Could not load company data.");
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  }, [companyId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const sections = useMemo(() => SECTIONS
    .map(section => ({
      ...section,
      items: section.tabs
        .filter(key => showAllModules || isTabInPlan(key, allowedPages))
        .map(key => TABS.find(t => t.key === key))
        .filter(Boolean),
    }))
    .filter(section => section.items.length), [allowedPages, showAllModules]);

  const hiddenCount = TABS.length - sections.reduce((n, section) => n + section.items.length, 0);

  useEffect(() => {
    if (!sections.some(section => section.items.some(item => item.key === tab))) setTab("overview");
  }, [sections, tab]);

  if (loading) return <CIISLoader />;
  const company = overview?.company || {};
  const s = overview?.summary;
  const subMeta = getSubscriptionMeta(company.subscriptionExpiry);

  return (
    <div className="CDV-page">
      <div className="CDV-inner">
        {error ? (
          <div className="CDV-error-banner" style={{ padding: 16 }}>
            <AlertCircle size={20} />
            <div style={{ flex: 1 }}>
              <strong>{error}</strong>
            </div>
            <button type="button" className="CDV-btn-outline" onClick={() => loadOverview(false)}>
              <RotateCcw size={13} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Header Hero */}
            <section className="CDV-head">
              <div className="CDV-head-left">
                <CompanyAvatar name={company.companyName} size={46} fontSize="1.05rem" />
                <div className="CDV-head-info">
                  <div className="CDV-eyebrow-row">
                    <span className="CDV-eyebrow">Tenant Intelligence · SuperAdmin</span>
                  </div>
                  <div className="CDV-head-title-row">
                    <h1>{company.companyName}</h1>
                  </div>
                  <div className="CDV-company-meta">
                    {company.companyCode && <CopyCodePill code={company.companyCode} />}
                    {activePill(company.isActive)}
                    <span className={`CDV-pill ${subMeta.isExpired ? 'CDV-pill-red' : 'CDV-pill-blue'}`}>
                      {company.subscriptionPlan || "No plan"} · {subMeta.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="CDV-head-actions">
                <button
                  type="button"
                  className="CDV-btn-back"
                  onClick={() => navigate("/Ciis-network/all-company")}
                  title="Return to companies directory"
                >
                  <ArrowLeft size={13} /> Companies
                </button>
                <a
                  className="CDV-btn-primary"
                  href={`/Ciis-network/all-company/${companyId}/admins`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShieldCheck size={14} /> Admin Controls
                </a>
                <button
                  type="button"
                  className="CDV-btn-outline"
                  onClick={() => loadOverview(true)}
                  disabled={isRefreshing}
                  title="Reload company summary"
                >
                  <RotateCcw size={13} className={isRefreshing ? 'CDV-spinner' : ''} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </section>

            {/* Body */}
            <div className="CDV-body">
              {/* Left Navigation */}
              <aside className="CDV-sidebar" aria-label={`${company.companyName || "Company"} modules`}>
                {sections.map(section => (
                  <div key={section.label} className="CDV-side-section">
                    <div className="CDV-side-title">{section.label}</div>
                    {section.items.map(t => {
                      const IconComponent = TAB_ICONS[t.key] || LayoutDashboard;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          className={`CDV-side-item ${tab === t.key ? "active" : ""}`}
                          onClick={() => setTab(t.key)}
                        >
                          <IconComponent size={15} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {(hiddenCount > 0 || showAllModules) && allowedPages.length > 0 ? (
                  <button type="button" className="CDV-side-toggle" onClick={() => setShowAllModules(v => !v)}>
                    {showAllModules ? "Show only plan modules" : `Show all modules (${hiddenCount} not in plan)`}
                  </button>
                ) : null}
              </aside>

              {/* Main Content Area */}
              <div className="CDV-main">
                {tab === "overview" ? (
                  <div className="CDV-stats">
                    <Stat icon="groups" label="Users" value={s?.users.total} sub={`${s?.users.active} active accounts`} onSelectTab={setTab} />
                    <Stat icon="task_alt" label="Tasks" value={s?.tasks.total} sub={breakdown(s?.tasks.byStatus)} onSelectTab={setTab} />
                    <Stat icon="schedule" label="Attendance today" value={s?.attendanceToday.total} sub={`${breakdown(s?.attendanceToday.byStatus) || "None marked"} · ${s?.attendanceToday.notMarked} not marked`} onSelectTab={setTab} />
                    <Stat icon="event_busy" label="Pending leaves" value={s?.leaves.pending} onSelectTab={setTab} />
                    <Stat icon="person_search" label="Leads" value={s?.crm.leads} sub={breakdown(s?.crm.leadsByStatus)} onSelectTab={setTab} />
                    <Stat icon="call" label="Calls today" value={s?.crm.callsToday} sub={`${s?.crm.totalCalls} total calls`} onSelectTab={setTab} />
                    <Stat icon="pending_actions" label="Pending follow-ups" value={s?.crm.pendingFollowUps} onSelectTab={setTab} />
                    <Stat icon="business_center" label="Clients" value={s?.clients} onSelectTab={setTab} />
                    <Stat icon="video_call" label="Upcoming meetings" value={s?.upcomingMeetings} onSelectTab={setTab} />
                    <Stat icon="folder" label="Projects" value={s?.projects} onSelectTab={setTab} />
                    <Stat icon="support_agent" label="Open support tickets" value={s?.openTickets} onSelectTab={setTab} />
                    <Stat icon="assignment_return" label="Pending asset requests" value={s?.pendingAssetRequests} onSelectTab={setTab} />
                  </div>
                ) : tab === "usage" ? (
                  <UsageTab companyId={companyId} allowedPages={allowedPages} />
                ) : (
                  <ListTab key={tab} companyId={companyId} tab={tab} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
