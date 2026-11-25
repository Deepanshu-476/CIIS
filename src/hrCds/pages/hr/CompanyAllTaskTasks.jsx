import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import axios from "../../../utils/axiosConfig";
import TaskReminderControl, { buildReminderPayload, createDefaultReminderSettings } from '../../components/TaskReminderControl';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadBackendReport } from "../../../utils/exportUtils";
import TaskDetailsModal from "../../components/TaskDetailsModal";
import { useSocket } from '../../../context/SocketContext';
import {
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiPlus,
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiCalendar,
  FiUser,
  FiHome,
  FiMoreVertical,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiActivity,
  FiPercent,
  FiExternalLink,
  FiMail,
  FiPhone,
  FiTrendingUp,
  FiFolder,
  FiBarChart2,
  FiCheckSquare,
  FiZap,
  FiList,
  FiEye,
  FiFileText,
  FiAward,
  FiPieChart,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiGrid,
  FiPlay,
  FiPause,
  FiEdit2
} from "react-icons/fi";
import {
  getCurrentUserId,
  getStoredUser,
  getPageAccessUserIds,
  loadPagePermission,
} from "../../../utils/pageAccess";
import { API_URL_IMG } from "../../../config";
import "./CompanyAllTaskTasks.css";

// Remark images: project/personal remarks keep `image` ("remarks/x.jpg"), client remarks keep `images[].url`.
const getRemarkImageUrls = remark => [remark?.image, ...(remark?.images || []).map(image => image?.url || image)]
  .filter(value => typeof value === "string" && value.trim())
  .map(value => {
    if (/^(https?:|blob:|data:)/i.test(value)) return value;
    const path = value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^api\//, "");
    return `${API_URL_IMG.replace(/\/+$/, "")}/${path.startsWith("uploads/") ? path : `uploads/${path}`}`;
  });

const isRawObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || "").trim());

const RECURRING_REPEAT_DAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
];

const formatDateInputValue = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getEndOfLocalDayIso = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const getMaxRepeatEndDate = (dueDate) => {
  const max = new Date(dueDate);
  max.setDate(max.getDate() + 365);
  max.setHours(23, 59, 59, 999);
  return max;
};

const resolveDisplayString = (value, fallback = "—") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || isRawObjectId(trimmed)) return fallback;
    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const candidate =
      value.name ||
      value.title ||
      value.roleName ||
      value.departmentName ||
      value.companyName ||
      value.client ||
      value.label ||
      "";
    if (typeof candidate === "string" && candidate.trim() && !isRawObjectId(candidate)) {
      return candidate.trim();
    }
    if (typeof candidate === "object" && candidate !== null) {
      return resolveDisplayString(candidate, fallback);
    }
  }
  return fallback;
};

const cleanActivityDescription = (desc, action) => {
  if (!desc) {
    if (!action) return "Activity logged";
    const formattedAction = String(action).replace(/_/g, " ").replace(/-/g, " ");
    return formattedAction.charAt(0).toUpperCase() + formattedAction.slice(1);
  }

  let text = String(desc);

  // Format messy Date strings like "Sun Oct 25 2026 00:00:00 GMT+0000 (Coordinated Universal Time)"
  text = text.replace(/"[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}\s+[\d:]+\s+GMT[^"]*"/g, (match) => {
    try {
      const cleanStr = match.replace(/"/g, "");
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) {
        return `"${d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}"`;
      }
    } catch {
      // fallback
    }
    return match;
  });

  text = text.replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, (match) => {
    try {
      const d = new Date(match);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
      }
    } catch {
      // fallback
    }
    return match;
  });

  // Clean common raw status strings in quotes
  text = text.replace(/"in_progress"/gi, '"In Progress"');
  text = text.replace(/"in-progress"/gi, '"In Progress"');
  text = text.replace(/"onhold"/gi, '"On Hold"');
  text = text.replace(/"completed"/gi, '"Completed"');
  text = text.replace(/"pending"/gi, '"Pending"');
  text = text.replace(/"reopen"/gi, '"Reopen"');
  text = text.replace(/"cancelled"/gi, '"Cancelled"');

  return text;
};

const getActivityMeta = (log) => {
  const action = String(log.action || log.type || "").toLowerCase();
  if (action === 'task_break') {
    return { label: 'Break', badgeClass: 'badge-onhold', icon: <FiPause size={13} />, color: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe' };
  }
  const desc = String(log.description || log.text || log.message || log.details || "").toLowerCase();
  const newS = String(log.newValues?.status || "").toLowerCase();

  if (newS === "completed" || desc.includes("to completed") || action.includes("complete") || (desc.includes("completed") && !desc.includes("from completed"))) {
    return {
      type: "completed",
      label: "Completed",
      badgeClass: "badge-completed",
      icon: <FiCheckCircle size={14} />,
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#86efac"
    };
  }

  if (newS === "onhold" || newS === "on-hold" || desc.includes("to on hold") || desc.includes("to onhold") || desc.includes("to on-hold") || (action.includes("hold") && !action.includes("resumed"))) {
    return {
      type: "onhold",
      label: "On Hold",
      badgeClass: "badge-onhold",
      icon: <FiPause size={13} />,
      color: "#9333ea",
      bg: "#f3e8ff",
      border: "#d8b4fe"
    };
  }

  if (newS === "in-progress" || newS === "inprogress" || desc.includes("to in progress") || desc.includes("to in-progress") || desc.includes("to inprogress") || action.includes("start") || action.includes("progress") || action.includes("resumed")) {
    return {
      type: "progress",
      label: "In Progress",
      badgeClass: "badge-progress",
      icon: <FiPlay size={13} />,
      color: "#0284c7",
      bg: "#e0f2fe",
      border: "#7dd3fc"
    };
  }

  if (action.includes("create") || desc.includes("was created") || desc.includes("task created") || action === "creation") {
    return {
      type: "created",
      label: "Created",
      badgeClass: "badge-created",
      icon: <FiPlus size={14} />,
      color: "#059669",
      bg: "#ecfdf5",
      border: "#a7f3d0"
    };
  }

  if (action.includes("timer") || desc.includes("timer stopped") || desc.includes("session duration") || desc.includes("time spent")) {
    return {
      type: "timer",
      label: "Timer Session",
      badgeClass: "badge-timer",
      icon: <FiClock size={13} />,
      color: "#d97706",
      bg: "#fef3c7",
      border: "#fde68a"
    };
  }
  if (action.includes("assign") || desc.includes("assigned")) {
    return {
      type: "assign",
      label: "Assignment",
      badgeClass: "badge-assign",
      icon: <FiUser size={13} />,
      color: "#4f46e5",
      bg: "#e0e7ff",
      border: "#c7d2fe"
    };
  }
  if (action.includes("due") || desc.includes("due date") || desc.includes("deadline")) {
    return {
      type: "dueDate",
      label: "Due Date",
      badgeClass: "badge-due",
      icon: <FiCalendar size={13} />,
      color: "#ea580c",
      bg: "#ffedd5",
      border: "#fed7aa"
    };
  }
  if (action.includes("create") || desc.includes("created")) {
    return {
      type: "created",
      label: "Created",
      badgeClass: "badge-created",
      icon: <FiPlus size={14} />,
      color: "#059669",
      bg: "#ecfdf5",
      border: "#a7f3d0"
    };
  }
  if (action.includes("remark") || action.includes("comment") || desc.includes("remark")) {
    return {
      type: "remark",
      label: "Remark",
      badgeClass: "badge-remark",
      icon: <FiMessageSquare size={13} />,
      color: "#0891b2",
      bg: "#ecfeff",
      border: "#a5f3fc"
    };
  }
  if (action.includes("status") || desc.includes("status changed")) {
    return {
      type: "status",
      label: "Status Change",
      badgeClass: "badge-status",
      icon: <FiActivity size={13} />,
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe"
    };
  }

  return {
    type: "update",
    label: action ? action.replace(/_/g, " ").toUpperCase() : "UPDATE",
    badgeClass: "badge-update",
    icon: <FiZap size={13} />,
    color: "#475569",
    bg: "#f1f5f9",
    border: "#cbd5e1"
  };
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status", color: "#475569" },
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "in-progress", label: "In Progress", color: "#0ea5e9" },
  { value: "completed", label: "Completed", color: "#16a34a" },
  { value: "overdue", label: "Overdue", color: "#dc2626" },
  { value: "onhold", label: "On Hold", color: "#7c3aed" },
  { value: "reopen", label: "Reopen", color: "#db2777" },
  { value: "rejected", label: "Rejected", color: "#ef4444" },
  { value: "cancelled", label: "Cancelled", color: "#64748b" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const normalizeStatus = (status) => {
  if (!status) return "pending";
  const lower = String(status).toLowerCase().trim();
  const mapping = {
    "in progress": "in-progress",
    inprogress: "in-progress",
    "in-progress": "in-progress",
    in_progress: "in-progress",
    "on hold": "onhold",
    onhold: "onhold",
    "re-open": "reopen",
    "re open": "reopen",
    canceled: "cancelled",
    cancelled: "cancelled",
  };
  return mapping[lower] || lower;
};

const getDueDate = (task) => task?.dueDateTime || task?.dueDate;

const isOverdue = (task) => {
  const dueDate = getDueDate(task);
  if (!dueDate) return false;
  const status = normalizeStatus(task.userStatus || task.status || task.overallStatus);
  if (status === "completed" || status === "cancelled") return false;

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const getDisplayStatus = (task) => {
  const status = normalizeStatus(task?.userStatus || task?.status || task?.overallStatus);
  return status;
};

const getTaskType = (task) => {
  if (!task) return "personal";
  const source = String(task?.__taskSource || task?.taskSource || task?.source || "").toLowerCase();
  if (source === "project" || task?.projectId || task?.projectTaskId || task?.projectName || task?.project) {
    return "project";
  }
  if (source === "client" || task?.clientId || task?.isClientTask || task?.clientName || task?.client) {
    return "client";
  }
  if (source === "self" || source === "personal" || task?.taskType === "personal" || task?.taskType === "self") {
    return "personal";
  }
  if (source === "assigned" || task?.taskType === "assigned" || task?.assignedBy) {
    return "assigned";
  }
  return "personal";
};

const getTaskSource = (task) => {
  const source = String(task?.__taskSource || task?.taskSource || task?.source || "").toLowerCase();
  if (["client", "project", "self", "personal", "assigned"].includes(source)) {
    return source === "personal" ? "self" : source;
  }
  if (task?.projectId) return "project";
  if (task?.clientId) return "client";
  return "assigned";
};

const getProjectName = (task) => {
  const candidate = task?.projectName || task?.project?.name || task?.project?.title || (typeof task?.project === "string" ? task.project : "");
  return resolveDisplayString(candidate, "");
};

const getClientName = (task) => {
  const candidate = task?.clientName || task?.client?.name || task?.client?.companyName || task?.clientId?.client || task?.clientId?.name || task?.clientId?.company || (typeof task?.client === "string" ? task.client : "");
  return resolveDisplayString(candidate, "");
};

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case "completed":
      return { label: "Completed", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
    case "in-progress":
      return { label: "In Progress", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" };
    case "onhold":
      return { label: "On Hold", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" };
    case "reopen":
      return { label: "Reopen", color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" };
    case "rejected":
      return { label: "Rejected", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };
    case "cancelled":
      return { label: "Cancelled", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
    case "overdue":
      return { label: "Overdue", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    case "pending":
    default:
      return { label: "Pending", color: "#f59e0b", bg: "#fffbeb", border: "#fef3c7" };
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getDateInputValue = (date = new Date()) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  // Attendance is stored at the start of an India calendar day. Using the
  // browser's local timezone here can place a record in the previous/next day
  // and make the Performance discipline score incorrectly read 0%.
  const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${istDate.getUTCFullYear()}-${month}-${day}`;
};

const getPerformanceAttendanceRange = (timeframe, customStart = "", customEnd = "") => {
  const now = new Date();
  const today = getDateInputValue(now);
  if (timeframe === "custom") return { startDate: customStart || "", endDate: customEnd || "" };
  if (timeframe === "today") return { startDate: today, endDate: today };
  if (timeframe === "week") {
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    return { startDate: getDateInputValue(monday), endDate: today };
  }
  if (timeframe === "month") {
    return { startDate: getDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: today };
  }
  if (timeframe === "sixMonths") {
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    return { startDate: getDateInputValue(sixMonthsAgo), endDate: today };
  }
  return { startDate: "", endDate: "" }; // Overall: entire employment record
};

const getDateTimeInputValue = (date = new Date()) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultToday7PM = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T19:00`;
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (name) => {
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#4f46e5", "#0284c7"];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const countStats = (taskList = []) => {
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;
  let onhold = 0;
  let personal = 0;
  let project = 0;
  let client = 0;
  let work = 0;

  taskList.forEach((t) => {
    const s = getDisplayStatus(t);
    if (s === "completed") {
      completed++;
    } else if (s === "onhold") {
      onhold++;
    } else if (s === "in-progress") {
      if (isOverdue(t)) overdue++;
      else inProgress++;
    } else if (isOverdue(t)) {
      overdue++;
    } else {
      pending++;
    }
    const taskType = getTaskType(t);
    if (taskType === "self" || taskType === "personal") {
      personal++;
    } else if (taskType === "project") {
      project++;
      work++;
    } else if (taskType === "client") {
      client++;
      work++;
    } else {
      work++;
    }
  });

  return {
    total: taskList.length,
    pending,
    inProgress,
    completed,
    overdue,
    onhold,
    personal,
    project,
    client,
    work,
  };
};

const extractUsers = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data?.users)) return response.data.users;
  return [];
};

const getCleanCheckpoints = (checkpoints) => {
  if (!Array.isArray(checkpoints)) return [];
  return checkpoints
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          title: item.trim(),
          completed: false,
          position: index,
        };
      }
      return {
        _id: item?._id || item?.id,
        title: String(item?.title || item?.name || item?.checkpoint || "").trim(),
        completed: Boolean(item?.completed || item?.isCompleted || item?.status === "completed"),
        position: item?.position ?? index,
      };
    })
    .filter((c) => c.title.length > 0);
};

const buildCompanyTaskCacheKey = ({ userId, page, limit, startDate, endDate, search, status, priority, project, client, taskType }) => {
  const query = new URLSearchParams({
    page: String(page || 1),
    limit: String(limit || 10),
    startDate: startDate || "",
    endDate: endDate || "",
    search: search || "",
    status: status || "all",
    priority: priority || "all",
    project: project || "all",
    client: client || "all",
    taskType: taskType || "all",
  }).toString();
  return `ciis_company_all_task_tasks_${userId || "unknown"}?${query}`;
};

const readCompanyTaskCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > 45000) return null;
    return parsed.data || null;
  } catch {
    return null;
  }
};

const writeCompanyTaskCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // Ignore
  }
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CompanyAllTaskTasks = () => {
  const socket = useSocket()?.socket;
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = useMemo(() => getStoredUser(), []);
  const locationStateEmployee = location.state?.employee || null;
  // This is an employee-detail page. Never fall back to the signed-in user:
  // doing so can display a client's profile (for example Amit Sharma) when
  // the page was opened without an employee id.
  const effectiveUserId = userId || searchParams.get("userId") || locationStateEmployee?._id || locationStateEmployee?.id || "";

  const todayStr = useMemo(() => getDateInputValue(), []);
  const initialStartDate = searchParams.get("startDate") || "";
  const initialEndDate = searchParams.get("endDate") || "";
  const locationStateSnapshot = location.state?.taskSnapshot || null;

  const initialCacheKey = buildCompanyTaskCacheKey({
    userId: effectiveUserId,
    page: 1,
    limit: 10,
    startDate: initialStartDate,
    endDate: initialEndDate,
    search: "",
    status: "all",
    priority: "all",
  });
  const initialTaskSnapshot = locationStateSnapshot || readCompanyTaskCache(initialCacheKey);
  const initialStats = countStats(initialTaskSnapshot?.tasks || []);

  const [employee, setEmployee] = useState(
    locationStateEmployee
      ? { ...locationStateEmployee, _id: locationStateEmployee._id || locationStateEmployee.id }
      : null
  );
  const [tasks, setTasks] = useState(initialTaskSnapshot?.tasks || []);
  const [stats, setStats] = useState(initialTaskSnapshot?.stats || initialStats);
  const [workSummary, setWorkSummary] = useState(initialTaskSnapshot?.workSummary || null);
  const [taskDetailsById, setTaskDetailsById] = useState(initialTaskSnapshot?.taskDetailsById || {});
  const [loading, setLoading] = useState(!initialTaskSnapshot);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [filterOptions, setFilterOptions] = useState(initialTaskSnapshot?.filterOptions || { projects: [], clients: [] });
  const [taskViewLayout, setTaskViewLayout] = useState("list");
  const [groupBy, setGroupBy] = useState("status");
  const [sortBy, setSortBy] = useState("priority");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("tasks");

  // Additional Tabs State: Attendance
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Attendance Calendar State & View Controls
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);
  const [attViewMode, setAttViewMode] = useState("calendar"); // "calendar" | "table"
  const [attFilter, setAttFilter] = useState("all");
  // A date range supplied by the Company All Task page opens Performance in
  // its matching custom window. Once a reviewer selects a timeframe button,
  // that explicit choice must win over the URL range.
  const [perfTimeframe, setPerfTimeframe] = useState(() => {
    if (!initialStartDate && !initialEndDate) return "today";
    if (initialStartDate === todayStr && initialEndDate === todayStr) return "today";
    return "custom";
  }); // "custom" | "today" | "week" | "month" | "sixMonths"
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfData, setPerfData] = useState({
    tasks: [],
    stats: null,
    workSummary: null,
    performanceMetrics: null,
  });
  const [perfAttendance, setPerfAttendance] = useState({ records: [], loaded: false });

  // This detail page stays mounted when the Company All Task list changes only
  // its query string. Keep the local date range in sync with the URL so the
  // task list and the Performance tab never keep showing the previous range.
  const dateRangeQueryKey = `${searchParams.get("startDate") || ""}|${searchParams.get("endDate") || ""}`;
  useEffect(() => {
    const nextStartDate = searchParams.get("startDate") || "";
    const nextEndDate = searchParams.get("endDate") || "";

    setStartDate((current) => (current === nextStartDate ? current : nextStartDate));
    setEndDate((current) => (current === nextEndDate ? current : nextEndDate));
    setPerfTimeframe((current) => {
      if (nextStartDate === todayStr && nextEndDate === todayStr) return "today";
      if (!nextStartDate && !nextEndDate) return "today";
      if (nextStartDate || nextEndDate) return "custom";
      return current === "custom" ? "today" : current;
    });
    setPage(1);
  }, [dateRangeQueryKey, searchParams, todayStr]);

  const activeTimeframe = useMemo(() => {
    if (perfTimeframe === "today") return "today";
    if (perfTimeframe === "week") return "week";
    if (perfTimeframe === "month") return "month";
    if (perfTimeframe === "sixMonths") return "sixMonths";
    if (startDate === todayStr && endDate === todayStr) return "today";
    if (!startDate && !endDate) return "today";
    return perfTimeframe || "today";
  }, [perfTimeframe, startDate, endDate, todayStr]);

  // Retained only for safe cleanup of old document-preview state. The Documents
  // tab is intentionally not exposed on the Company All Task page.
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [documentPreview, setDocumentPreview] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);

  const [activityModal, setActivityModal] = useState({ open: false, task: null, logs: [] });
  const [remarksModal, setRemarksModal] = useState({ open: false, task: null, remarks: [] });
  const [remarkImagePreview, setRemarkImagePreview] = useState("");
  const [editModal, setEditModal] = useState({ open: false, task: null });
  const [taskDetailsModal, setTaskDetailsModal] = useState({ open: false, task: null });
  const [expandedCheckpoints, setExpandedCheckpoints] = useState({});
  const [pageAccessReady, setPageAccessReady] = useState(false);
  const [canViewCompanyTasks, setCanViewCompanyTasks] = useState(true);
  const [canEditCompanyTasks, setCanEditCompanyTasks] = useState(true);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDateTime: "",
    priority: "medium",
    status: "pending",
    checkpoints: [],
  });
  const [savingTaskId, setSavingTaskId] = useState(null);

  // In-place Assign Task Modal state with default today 7:00 PM
  const [assignModal, setAssignModal] = useState({
    open: false,
    title: "",
    description: "",
    priority: "medium",
    dueDateTime: getDefaultToday7PM(),
    checkpoints: [],
    newCheckpointText: "",
    repeatPattern: "none",
    repeatDays: [],
    recurrenceEndDate: "",
    submitting: false,
    error: "",
    reminderSettings: createDefaultReminderSettings(),
  });

  // Live Timer Interactive State
  const [liveTimerSeconds, setLiveTimerSeconds] = useState(0);
  const [isLiveTimerRunning, setIsLiveTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isLiveTimerRunning) {
      interval = setInterval(() => {
        setLiveTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isLiveTimerRunning && liveTimerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLiveTimerRunning, liveTimerSeconds]);

  const formatLiveTimerDigits = (totalSec) => {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSec % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  // Toast Notification state
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ open: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast({ open: false, message: "", type: "success" });
    }, 3500);
  }, []);

  const fetchRequestIdRef = useRef(0);
  const tasksRef = useRef(tasks);
  const employeeRef = useRef(employee);
  const taskDetailsByIdRef = useRef(taskDetailsById);
  const perfCacheRef = useRef({});

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    employeeRef.current = employee;
  }, [employee]);

  useEffect(() => {
    taskDetailsByIdRef.current = taskDetailsById;
  }, [taskDetailsById]);

  const employeeName = resolveDisplayString(employee?.name, "—");
  const employeeRoleCandidates = [
    employee?.jobRoleName,
    employee?.jobRole,
    employee?.role,
    employee?.companyRole,
  ];
  let employeeRole = "—";
  for (const candidate of employeeRoleCandidates) {
    const resolved = resolveDisplayString(candidate, "");
    if (resolved && resolved !== "—") {
      employeeRole = resolved;
      break;
    }
  }

  const employeeDeptCandidates = [
    employee?.departmentName,
    employee?.department?.name,
    employee?.department?.departmentName,
    employee?.department,
  ];
  let employeeDept = "—";
  for (const candidate of employeeDeptCandidates) {
    const resolved = resolveDisplayString(candidate, "");
    if (resolved && resolved !== "—") {
      employeeDept = resolved;
      break;
    }
  }
  const employeeEmail = typeof employee?.email === "string" ? employee.email : "";
  const employeePhone = typeof employee?.phone === "string" ? employee.phone : (typeof employee?.mobile === "string" ? employee.mobile : "");


  useEffect(() => {
    if (effectiveUserId) return;
    setLoading(false);
    setError("Please select an employee from Company All Task.");
  }, [effectiveUserId]);

  useEffect(() => {
    let active = true;

    const loadTaskPermissions = async () => {
      try {
        const page = await loadPagePermission("/ciisUser/company-all-task");
        if (!active) return;

        const currentUserIdValue = getCurrentUserId();
        const currentUser = getStoredUser();
        const viewUserIds = getPageAccessUserIds(page, 'view');
        const editUserIds = getPageAccessUserIds(page, 'edit');
        const configuredIds = [
          ...getPageAccessUserIds(page, 'approve'),
          ...viewUserIds,
          ...editUserIds,
          ...getPageAccessUserIds(page, 'delete')
        ];

        const roleTokens = [
          currentUser?.companyRole,
          currentUser?.role,
          currentUser?.jobRole,
          currentUser?.userType,
        ]
          .filter(Boolean)
          .map((role) => String(role).toLowerCase().replace(/[\s_-]+/g, ''));
        const isSuperRole = Boolean(currentUser?.isSuperAdmin || currentUser?.superAdmin || currentUser?.isCompanyOwner) ||
          roleTokens.some((role) => ['owner', 'companyowner', 'admin', 'companyadmin', 'superadmin'].includes(role));
        const isSelf = String(effectiveUserId || '') === String(currentUserIdValue || '');
        const hasDirectAccess = configuredIds.includes(currentUserIdValue);
        const hasAccess = isSuperRole || isSelf || hasDirectAccess;

        setCanViewCompanyTasks(hasAccess);
        setCanEditCompanyTasks(isSuperRole || editUserIds.includes(currentUserIdValue));
      } catch (err) {
        console.error("Error loading task permissions:", err);
      } finally {
        if (active) setPageAccessReady(true);
      }
    };

    loadTaskPermissions();
    return () => {
      active = false;
    };
  }, [effectiveUserId]);

  const fetchEmployee = useCallback(async () => {
    if (!effectiveUserId) return;
    if (locationStateEmployee && String(locationStateEmployee._id || locationStateEmployee.id || "") === String(effectiveUserId)) {
      return;
    }

    const companyId = currentUser?.company?._id || currentUser?.company;
    const departmentId = currentUser?.department?._id || currentUser?.department;
    const urls = [];

    if (companyId) urls.push(`/users/company-users?companyId=${companyId}`);
    if (departmentId) urls.push(`/users/department-users?department=${departmentId}`);
    urls.push("/users/company-users");

    for (const url of urls) {
      try {
        const response = await axios.get(url);
        const found = extractUsers(response).find((user) => (user._id || user.id) === effectiveUserId);
        if (found) {
          setEmployee({ ...found, _id: found._id || found.id });
          return;
        }
      } catch {
        // Continue
      }
    }
    if (currentUser && String(currentUser._id || currentUser.id || "") === String(effectiveUserId)) {
      setEmployee({ ...currentUser, _id: currentUser._id || currentUser.id });
    }
  }, [currentUser, effectiveUserId, locationStateEmployee]);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!effectiveUserId) return;

    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;
    const cacheKey = buildCompanyTaskCacheKey({
      userId: effectiveUserId,
      page,
      limit,
      startDate,
      endDate,
      search,
      status,
      priority,
      project: projectFilter,
      client: clientFilter,
      taskType: taskTypeFilter,
    });

    if (!silent && !tasksRef.current.length) {
      setLoading(true);
    }
    setError("");

    try {
      const params = {
        page,
        limit,
        period: (startDate === todayStr && endDate === todayStr) ? "today" : (startDate || endDate ? "custom" : "all"),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
        search: search.trim() || undefined,
        status: status !== "all" ? status : undefined,
        priority: priority !== "all" ? priority : undefined,
        project: projectFilter !== "all" ? projectFilter : undefined,
        client: clientFilter !== "all" ? clientFilter : undefined,
        taskType: taskTypeFilter !== "all" ? taskTypeFilter : undefined,
      };

      const response = await axios.get(`/task/user/${effectiveUserId}/all-tasks`, { params });
      if (fetchRequestIdRef.current !== requestId) return;

      const data = response.data || {};
      const fetchedTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const apiStats = data.stats || data.statusCounts;
      const computedStats = apiStats ? {
        total: Number(apiStats.total?.count ?? apiStats.total) || 0,
        pending: Number(apiStats.pending?.count ?? apiStats.pending) || 0,
        inProgress: Number(apiStats.inProgress?.count ?? apiStats.inProgress) || 0,
        completed: Number(apiStats.completed?.count ?? apiStats.completed) || 0,
        overdue: Number(apiStats.overdue?.count ?? apiStats.overdue) || 0,
        onhold: Number(apiStats.onhold?.count ?? apiStats.onhold ?? apiStats.onHold?.count ?? apiStats.onHold) || 0,
        personal: Number(apiStats.personal?.count ?? apiStats.personal ?? data.typeCounts?.personal ?? -1),
        project: Number(apiStats.project?.count ?? apiStats.project ?? -1),
        client: Number(apiStats.client?.count ?? apiStats.client ?? -1),
        work: Number(apiStats.work?.count ?? apiStats.work ?? data.typeCounts?.work ?? -1),
      } : countStats(fetchedTasks);

      if (computedStats.personal < 0) {
        computedStats.personal = fetchedTasks.filter((t) => ['self', 'personal'].includes(getTaskType(t))).length;
      }
      if (computedStats.project < 0) {
        computedStats.project = fetchedTasks.filter((t) => getTaskType(t) === 'project').length;
      }
      if (computedStats.client < 0) {
        computedStats.client = fetchedTasks.filter((t) => getTaskType(t) === 'client').length;
      }
      if (computedStats.work < 0) {
        computedStats.work = fetchedTasks.filter((t) => ['assigned', 'project', 'client'].includes(getTaskType(t))).length;
      }

      setTasks(fetchedTasks);
      setFilterOptions(data.filterOptions || { projects: [], clients: [] });
      setStats(computedStats);
      setWorkSummary(data.workSummary || null);
      setPerformanceMetrics(data.performance || null);
      setTotal(data.pagination?.total || data.total || fetchedTasks.length);
      setTotalPages(data.pagination?.totalPages || data.pagination?.pages || data.totalPages || 1);

      const apiEmployee = data.employee || data.user;
      if (apiEmployee) {
        setEmployee((prev) => ({
          ...(prev || {}),
          ...apiEmployee,
          _id: apiEmployee._id || apiEmployee.id || prev?._id || prev?.id || effectiveUserId,
        }));
      }

      writeCompanyTaskCache(cacheKey, {
        tasks: fetchedTasks,
        stats: computedStats,
        workSummary: data.workSummary || null,
        taskDetailsById: taskDetailsByIdRef.current,
        pagination: data.pagination || null,
        filterOptions: data.filterOptions || { projects: [], clients: [] },
      });
    } catch (err) {
      if (fetchRequestIdRef.current !== requestId) return;
      console.error("Failed to fetch tasks:", err);
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to load tasks. Please try again.");
    } finally {
      if (fetchRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [clientFilter, effectiveUserId, endDate, limit, page, priority, projectFilter, search, startDate, status, taskTypeFilter]);

  // Fetch Attendance for Attendance Tab
  const fetchAttendance = useCallback(async (targetDate) => {
    if (!effectiveUserId) return;
    setAttendanceLoading(true);
    setAttendanceError("");
    try {
      const d = targetDate instanceof Date ? targetDate : calDate;
      const [res, holRes] = await Promise.allSettled([
        axios.get(`/attendance/user/${effectiveUserId}`, {
          params: {
            month: d.getMonth(),
            year: d.getFullYear(),
          }
        }),
        axios.get("/holidays")
      ]);

      const records = res.status === "fulfilled" ? (res.value.data?.data || []) : [];
      const fetchedHolidays = holRes.status === "fulfilled" ? (holRes.value.data?.holidays || []) : [];
      if (fetchedHolidays.length > 0) {
        setHolidaysList(fetchedHolidays);
      }
      setAttendanceRecords(records);

      // Select today's record by default if available in this month
      const todayKey = getDateInputValue();
      const todayRec = records.find(r => {
        if (!r.date) return false;
        const rd = new Date(r.date);
        return getDateInputValue(rd) === todayKey;
      });
      setSelectedDayRecord(todayRec || records[records.length - 1] || records[0] || null);
    } catch (err) {
      setAttendanceError(err?.response?.data?.message || "Failed to load attendance records");
    } finally {
      setAttendanceLoading(false);
    }
  }, [effectiveUserId, calDate]);

  // Fetch Performance Dataset for Selected Timeframe (Today, Week, Month, 6 Months, Overall)
  const fetchPerfDataset = useCallback(async (tf, selectedRange = {}) => {
    if (!effectiveUserId) return;
    const rangeStart = selectedRange.startDate || "";
    const rangeEnd = selectedRange.endDate || "";
    // A performance cache must be scoped by the actual evaluation window.
    // Otherwise a previously opened monthly view can be shown for a custom URL range.
    const cacheKey = `${tf}:${rangeStart}:${rangeEnd}`;
    // Instant switch from local cache if previously loaded
    if (perfCacheRef.current[cacheKey]) {
      setPerfData(perfCacheRef.current[cacheKey]);
    }
    setPerfLoading(true);
    try {
      const now = new Date();
      const todayDateStr = getDateInputValue();
      let sDate = undefined;
      let eDate = undefined;

      if (tf === "custom") {
        sDate = rangeStart || undefined;
        eDate = rangeEnd || undefined;
      } else if (tf === "today") {
        sDate = todayDateStr;
        eDate = todayDateStr;
      } else if (tf === "week") {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        sDate = monday.toISOString().split("T")[0];
        eDate = todayDateStr;
      } else if (tf === "month") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        sDate = firstDay.toISOString().split("T")[0];
        eDate = todayDateStr;
      } else if (tf === "sixMonths") {
        const sixM = new Date(now);
        sixM.setMonth(now.getMonth() - 6);
        sDate = sixM.toISOString().split("T")[0];
        eDate = todayDateStr;
      }

      const params = {
        all: "true",
        export: "true",
        limit: 2500,
        period: tf === "today" ? "today" : (sDate || eDate ? "custom" : "all"),
        startDate: sDate,
        endDate: eDate,
        fromDate: sDate,
        toDate: eDate,
      };

      const res = await axios.get(`/task/user/${effectiveUserId}/all-tasks`, { params });
      const data = res.data || {};
      const apiTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const apiStats = data.stats || data.statusCounts;

      const newDataset = {
        tasks: apiTasks,
        stats: apiStats ? {
          total: Number(apiStats.total?.count ?? apiStats.total ?? apiTasks.length),
          completed: Number(apiStats.completed?.count ?? apiStats.completed ?? 0),
          inProgress: Number(apiStats.inProgress?.count ?? apiStats.inProgress ?? apiStats['in-progress']?.count ?? apiStats['in-progress'] ?? 0),
          pending: Number(apiStats.pending?.count ?? apiStats.pending ?? 0),
          overdue: Number(apiStats.overdue?.count ?? apiStats.overdue ?? 0),
          onhold: Number(apiStats.onhold?.count ?? apiStats.onhold ?? apiStats.onHold?.count ?? apiStats.onHold ?? 0),
        } : countStats(apiTasks),
        workSummary: data.workSummary || null,
        performanceMetrics: data.performance || null,
      };

      perfCacheRef.current[cacheKey] = newDataset;
      setPerfData(newDataset);
    } catch (err) {
      console.error("Failed to fetch performance dataset for timeframe:", tf, err);
    } finally {
      setPerfLoading(false);
    }
  }, [effectiveUserId]);

  const fetchPerfAttendance = useCallback(async (tf, selectedRange = {}) => {
    if (!effectiveUserId) return;
    const range = getPerformanceAttendanceRange(tf, selectedRange.startDate, selectedRange.endDate);
    setPerfAttendance({ records: [], loaded: false });
    try {
      const response = await axios.get(`/attendance/user/${effectiveUserId}`, {
        params: {
          ...(range.startDate ? { startDate: range.startDate } : {}),
          ...(range.endDate ? { endDate: range.endDate } : {}),
        },
      });
      setPerfAttendance({ records: response.data?.data || [], loaded: true });
    } catch (err) {
      console.error("Failed to fetch performance attendance:", err);
      setPerfAttendance({ records: [], loaded: true });
    }
  }, [effectiveUserId]);

  // Fetch User's Uploaded Documents (Read-only view)
  const fetchDocuments = useCallback(async () => {
    if (!effectiveUserId) return;
    setDocumentsLoading(true);
    setDocumentsError("");
    try {
      const res = await axios.get(`/users/${effectiveUserId}/documents`);
      const apiDocs = Array.isArray(res.data?.documents) ? res.data.documents : [];

      const isFileString = (val) => typeof val === "string" && (val.startsWith("http") || /\.(pdf|jpg|jpeg|png|webp|jfif|doc|docx)$/i.test(val));

      const extraDocs = [];
      if (isFileString(employee?.aadharCard)) {
        extraDocs.push({
          _id: "aadhar-proof",
          name: "Aadhaar Card",
          type: "Identity Document",
          uploadedAt: employee.createdAt,
          viewUrl: `/users/${effectiveUserId}/documents/aadhar-proof/view`,
          downloadUrl: `/users/${effectiveUserId}/documents/aadhar-proof/download`,
          externalUrl: employee.aadharCard.startsWith("http") ? employee.aadharCard : undefined,
        });
      }
      if (isFileString(employee?.panCard)) {
        extraDocs.push({
          _id: "pan-proof",
          name: "PAN Card",
          type: "Tax Identity",
          uploadedAt: employee.createdAt,
          viewUrl: `/users/${effectiveUserId}/documents/pan-proof/view`,
          downloadUrl: `/users/${effectiveUserId}/documents/pan-proof/download`,
          externalUrl: employee.panCard.startsWith("http") ? employee.panCard : undefined,
        });
      }

      setDocuments([...apiDocs, ...extraDocs]);
    } catch (err) {
      const fallbackDocs = [];
      if (Array.isArray(employee?.documents)) {
        fallbackDocs.push(...employee.documents.map(d => ({
          _id: d._id || d.id,
          name: d.name || "Document",
          type: d.type || "File",
          uploadedAt: d.uploadedAt,
          viewUrl: `/users/${effectiveUserId}/documents/${d._id || d.id}/view`,
          downloadUrl: `/users/${effectiveUserId}/documents/${d._id || d.id}/download`,
        })));
      }
      setDocuments(fallbackDocs);
      if (fallbackDocs.length === 0) {
        setDocumentsError(err?.response?.data?.message || "");
      }
    } finally {
      setDocumentsLoading(false);
    }
  }, [effectiveUserId, employee]);

  // In-Page Document View Handler (Opens directly on this page without new tab!)
  const handleViewDocument = useCallback(async (doc) => {
    if (!doc) return;
    setPreviewLoadingId(doc._id);
    try {
      if (doc.externalUrl || (typeof doc.url === "string" && /^https?:\/\//i.test(doc.url))) {
        const external = doc.externalUrl || doc.url;
        setDocumentPreview({
          url: external,
          name: doc.name || "Document Preview",
          type: doc.type || (/\.pdf$/i.test(external) ? "application/pdf" : "image/jpeg"),
          doc,
        });
        return;
      }

      const targetEndpoint = doc.viewUrl || `/users/${effectiveUserId}/documents/${doc._id}/view`;
      const response = await axios.get(targetEndpoint, {
        responseType: "blob",
        cache: false,
        _skipErrorNotify: true,
      });

      const blobUrl = URL.createObjectURL(response.data);
      const detectedType = response.data.type || doc.type || (doc.name?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");

      setDocumentPreview((current) => {
        if (current?.url && current.url.startsWith("blob:")) {
          URL.revokeObjectURL(current.url);
        }
        return {
          url: blobUrl,
          name: doc.name || "Document Preview",
          type: detectedType,
          doc,
        };
      });
    } catch (err) {
      console.error("Failed to view document:", err);
      let errMsg = "Failed to open document preview. You can try downloading it.";
      if (err?.response?.data instanceof Blob) {
        try {
          const parsed = JSON.parse(await err.response.data.text());
          errMsg = parsed.message || errMsg;
        } catch {
          // Keep the generic document error message when the response is not JSON.
        }
      } else if (err?.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      alert(errMsg);
    } finally {
      setPreviewLoadingId(null);
    }
  }, [effectiveUserId]);

  // In-Page Document Download Handler
  const handleDownloadDocument = useCallback(async (doc) => {
    if (!doc) return;
    setDownloadLoadingId(doc._id);
    try {
      if (doc.externalUrl || (typeof doc.url === "string" && /^https?:\/\//i.test(doc.url))) {
        const external = doc.externalUrl || doc.url;
        const link = document.createElement("a");
        link.href = external;
        link.target = "_blank";
        link.download = doc.name || "document";
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const targetEndpoint = doc.downloadUrl || `/users/${effectiveUserId}/documents/${doc._id}/download`;
      const response = await axios.get(targetEndpoint, {
        responseType: "blob",
        cache: false,
        _skipErrorNotify: true,
      });

      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      const contentDisposition = response.headers?.["content-disposition"] || "";
      const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) || contentDisposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] ? decodeURIComponent(match[1]) : (doc.name || "document");
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("Failed to download document:", err);
      let errMsg = "Failed to download document.";
      if (err?.response?.data instanceof Blob) {
        try {
          const parsed = JSON.parse(await err.response.data.text());
          errMsg = parsed.message || errMsg;
        } catch {
          // Keep the generic document error message when the response is not JSON.
        }
      } else if (err?.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      alert(errMsg);
    } finally {
      setDownloadLoadingId(null);
    }
  }, [effectiveUserId]);

  const closeDocumentPreview = useCallback(() => {
    setDocumentPreview((current) => {
      if (current?.url && current.url.startsWith("blob:")) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (documentPreview?.url && documentPreview.url.startsWith("blob:")) {
        URL.revokeObjectURL(documentPreview.url);
      }
    };
  }, [documentPreview]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    // The weekly productivity card also needs attendance history. Loading it
    // only on the Attendance/Performance tabs left Monday and prior days at 0.
    if (attendanceRecords.length === 0) {
      fetchAttendance();
    }
  }, [attendanceRecords.length, fetchAttendance]);

  useEffect(() => {
    if (activeTab === "performance") {
      // Keep performance aligned with the date range that opened/filters this employee page.
      // The task list already honours these values, so using a separate monthly window here
      // produced conflicting totals and scores.
      fetchPerfDataset(
        activeTimeframe,
        { startDate, endDate }
      );
      fetchPerfAttendance(
        activeTimeframe,
        { startDate, endDate }
      );
    }
  }, [activeTab, activeTimeframe, startDate, endDate, fetchPerfDataset, fetchPerfAttendance]);

  const fetchTaskDetails = useCallback(async (task, activityOnly = false) => {
    if (!task?._id) return { remarks: [], activityLogs: [] };
    const source = getTaskSource(task);
    const endpoints = [];

    // Remarks endpoints by source with universal fallback
    if (source === "client") {
      endpoints.push({ key: "remarks", url: `/tasks/client-tasks/${task._id}/remarks` });
    } else if (source === "project" && task.projectId) {
      endpoints.push({ key: "remarks", url: `/tasks/project/${task.projectId}/tasks/${task._id}/remarks` });
    } else if (source === "self") {
      endpoints.push({ key: "remarks", url: `/tasks/self/${task._id}/remarks` });
    } else {
      endpoints.push({ key: "remarks", url: `/task/${task._id}/remarks` });
    }

    // Activity Logs endpoint by task source with project route support
    if (source === "project" && task.projectId) {
      endpoints.push({ key: "activityLogs", url: `/tasks/project/${task.projectId}/tasks/${task._id}/activity` });
    } else if (source === "client") {
      endpoints.push({ key: "activityLogs", url: `/tasks/client-tasks/${task._id}/client-activity-logs` });
    } else if (source === "self") {
      endpoints.push({ key: "activityLogs", url: `/tasks/self/${task._id}/activity-logs` });
    } else {
      endpoints.push({ key: "activityLogs", url: `/task/${task._id}/activity-logs` });
    }

    const fallbackLogs = Array.isArray(task.activityLogs) && task.activityLogs.length > 0
      ? task.activityLogs
      : (Array.isArray(task.statusHistory) ? task.statusHistory : []);

    const details = {
      remarks: Array.isArray(task.remarks) ? [...task.remarks] : [],
      activityLogs: activityOnly ? null : [...fallbackLogs],
    };

    await Promise.all(
      endpoints.filter(({ key }) => !activityOnly || key === 'activityLogs').map(async ({ key, url }) => {
        try {
          const res = await axios.get(url, { noCache: key === 'activityLogs', _skipErrorNotify: activityOnly });
          const data = res.data?.logs || res.data?.activityLogs || res.data?.remarks || res.data?.data || res.data;
          if (Array.isArray(data) && (key === 'activityLogs' || data.length > 0)) {
            details[key] = data;
          }
        } catch (err) {
          // If a specific remarks endpoint fails, try universal /task/:id/remarks
          if (key === "remarks" && url !== `/task/${task._id}/remarks`) {
            try {
              const fallbackRes = await axios.get(`/task/${task._id}/remarks`);
              const fbData = fallbackRes.data?.remarks || fallbackRes.data?.data || fallbackRes.data;
              if (Array.isArray(fbData) && fbData.length > 0) details.remarks = fbData;
            } catch {
              // keep existing fallback remarks
            }
          }
        }
      })
    );
    return details;
  }, []);

  const openLogTask = taskDetailsModal.open ? taskDetailsModal.task : activityModal.open ? activityModal.task : null;
  useEffect(() => {
    if (!openLogTask?._id) return undefined;
    let cancelled = false;
    const taskId = String(openLogTask._id);
    const refreshActivity = async () => {
      const { activityLogs } = await fetchTaskDetails(openLogTask, true);
      if (cancelled || !activityLogs) return;
      setTaskDetailsModal(current => current.open && String(current.task?._id) === taskId
        ? { ...current, task: { ...current.task, activityLogs } }
        : current);
      setActivityModal(current => current.open && String(current.task?._id) === taskId
        ? { ...current, logs: activityLogs }
        : current);
    };
    socket?.on('presence:break', refreshActivity);
    const timer = setInterval(refreshActivity, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      socket?.off('presence:break', refreshActivity);
    };
  }, [openLogTask?._id, fetchTaskDetails, socket]);

  const openAssignModal = () => {
    setAssignModal({
      open: true,
      title: "",
      description: "",
      priority: "medium",
      dueDateTime: getDefaultToday7PM(),
      checkpoints: [],
      newCheckpointText: "",
      repeatPattern: "none",
      repeatDays: [],
      recurrenceEndDate: "",
      submitting: false,
      error: "",
      reminderSettings: createDefaultReminderSettings(),
    });
  };

  const closeAssignModal = () => {
    if (assignModal.submitting) return;
    setAssignModal((prev) => ({ ...prev, open: false, error: "" }));
  };

  const handleAddCheckpointToAssign = () => {
    const text = assignModal.newCheckpointText.trim();
    if (!text) return;
    setAssignModal((prev) => ({
      ...prev,
      checkpoints: [...prev.checkpoints, { title: text, completed: false }],
      newCheckpointText: "",
    }));
  };

  const handleRemoveCheckpointFromAssign = (index) => {
    setAssignModal((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== index),
    }));
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.title.trim()) {
      setAssignModal((prev) => ({ ...prev, error: "Task title is required" }));
      return;
    }
    if (!assignModal.dueDateTime) {
      setAssignModal((prev) => ({ ...prev, error: "Due date & time is required" }));
      return;
    }
    if (!effectiveUserId) {
      setAssignModal((prev) => ({ ...prev, error: "Target employee not found" }));
      return;
    }

    const parsedDue = assignModal.dueDateTime ? new Date(assignModal.dueDateTime) : null;
    if (!parsedDue || isNaN(parsedDue.getTime())) {
      setAssignModal((prev) => ({ ...prev, error: "Invalid due date format" }));
      return;
    }

    const isRepeat = assignModal.repeatPattern && assignModal.repeatPattern !== 'none';
    const recurrenceEndDate = isRepeat ? getEndOfLocalDayIso(assignModal.recurrenceEndDate) : '';

    if (isRepeat) {
      if (!recurrenceEndDate) {
        setAssignModal((prev) => ({ ...prev, error: "Please select repeat end date." }));
        return;
      }
      if (new Date(recurrenceEndDate) < parsedDue) {
        setAssignModal((prev) => ({ ...prev, error: "Repeat end date cannot be before due date." }));
        return;
      }
      if (new Date(recurrenceEndDate) > getMaxRepeatEndDate(parsedDue)) {
        setAssignModal((prev) => ({ ...prev, error: "Repeat end date can be at most 1 year after due date." }));
        return;
      }
    }

    setAssignModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const payload = {
        title: assignModal.title.trim(),
        description: assignModal.description.trim() || undefined,
        assignedTo: [effectiveUserId],
        assignedUsers: [effectiveUserId],
        priority: assignModal.priority || "medium",
        dueDateTime: parsedDue.toISOString(),
        checkpoints: assignModal.checkpoints.map((c) => ({ title: c.title })),
        reminderSettings: buildReminderPayload(assignModal.reminderSettings),
        repeatPattern: isRepeat ? assignModal.repeatPattern : 'none',
        repeatDays: isRepeat ? (assignModal.repeatDays || []) : [],
        recurrenceEndDate: isRepeat ? recurrenceEndDate : undefined,
      };

      await axios.post("/task/create-for-others", payload);
      closeAssignModal();
      await fetchTasks(true);
    } catch (err) {
      setAssignModal((prev) => ({
        ...prev,
        submitting: false,
        error: err?.response?.data?.message || err?.response?.data?.error || "Failed to assign task.",
      }));
    }
  };

  const handleSetTodayFilter = () => {
    const today = getDateInputValue();
    setStartDate(today);
    setEndDate(today);
    setPage(1);
    navigate({
      pathname: location.pathname,
      search: `?startDate=${today}&endDate=${today}`
    }, { replace: true });
  };

  const handleSetAllDatesFilter = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
    navigate({
      pathname: location.pathname,
      search: ""
    }, { replace: true });
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setProjectFilter("all");
    setClientFilter("all");
    setTaskTypeFilter("all");
    handleSetTodayFilter();
  };

  const isTodayFilterActive = startDate === todayStr && endDate === todayStr;
  const isAllDatesFilterActive = !startDate && !endDate;

  const openRemarksModal = async (task, initialRemarks = []) => {
    const defaultRemarks = Array.isArray(initialRemarks) && initialRemarks.length > 0
      ? initialRemarks
      : (Array.isArray(task?.remarks) ? task.remarks : []);
    setRemarksModal({ open: true, task, remarks: defaultRemarks });

    if (task?._id) {
      try {
        const details = await fetchTaskDetails(task);
        if (details.remarks && Array.isArray(details.remarks)) {
          setRemarksModal((prev) => {
            if (!prev.open || String(prev.task?._id || "") !== String(task._id || "")) return prev;
            return { ...prev, remarks: details.remarks };
          });
          setTaskDetailsById((prev) => ({
            ...prev,
            [task._id]: { ...(prev[task._id] || {}), ...details, loading: false }
          }));
        }
      } catch (err) {
        console.error("Failed to load remarks:", err);
      }
    }
  };

  const openActivityModal = async (task, initialLogs = []) => {
    const defaultLogs = Array.isArray(initialLogs) && initialLogs.length > 0
      ? initialLogs
      : (Array.isArray(task?.activityLogs) && task.activityLogs.length > 0
          ? task.activityLogs
          : (Array.isArray(task?.statusHistory) ? task.statusHistory : []));
    setActivityModal({ open: true, task, logs: defaultLogs });

    if (task?._id) {
      try {
        const details = await fetchTaskDetails(task);
        if (details.activityLogs && Array.isArray(details.activityLogs)) {
          setActivityModal((prev) => {
            if (!prev.open || String(prev.task?._id || "") !== String(task._id || "")) return prev;
            return { ...prev, logs: details.activityLogs };
          });
          setTaskDetailsById((prev) => ({
            ...prev,
            [task._id]: { ...(prev[task._id] || {}), ...details, loading: false }
          }));
        }
      } catch (err) {
        console.error("Failed to load activity logs:", err);
      }
    }
  };

  const canEditTask = (task) => canEditCompanyTasks && ["self", "assigned", "client", "project"].includes(getTaskSource(task));

  const openEditModal = (task) => {
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      dueDateTime: getDateTimeInputValue(getDueDate(task)),
      priority: String(task.priority || "medium").toLowerCase(),
      status: getDisplayStatus(task),
      checkpoints: getCleanCheckpoints(task.checkpoints),
    });
    setEditModal({ open: true, task });
  };

  const closeEditModal = () => {
    if (savingTaskId) return;
    setEditModal({ open: false, task: null });
  };

  const updateEditCheckpoint = (index, title) => {
    setEditForm((previous) => ({
      ...previous,
      checkpoints: previous.checkpoints.map((checkpoint, itemIndex) =>
        itemIndex === index ? { ...checkpoint, title } : checkpoint
      ),
    }));
  };

  const toggleEditCheckpoint = (index) => {
    setEditForm((previous) => ({
      ...previous,
      checkpoints: previous.checkpoints.map((checkpoint, itemIndex) =>
        itemIndex === index ? { ...checkpoint, completed: !checkpoint.completed } : checkpoint
      ),
    }));
  };

  const addEditCheckpoint = () => {
    setEditForm((previous) => ({
      ...previous,
      checkpoints: [...previous.checkpoints, { title: "", completed: false }],
    }));
  };

  const removeEditCheckpoint = (index) => {
    setEditForm((previous) => ({
      ...previous,
      checkpoints: previous.checkpoints.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const refreshTaskAfterChange = async (task) => {
    await fetchTasks();
    if (!task?._id) return;

    const details = await fetchTaskDetails(task);
    setTaskDetailsById((previous) => ({
      ...previous,
      [task._id]: { ...details, loading: false },
    }));
  };

  const handleTaskStatusChange = async (task, nextStatus) => {
    if (!canEditTask(task) || !nextStatus) return;
    const source = getTaskSource(task);
    const endpoint =
      source === "client"
        ? `/tasks/all/company/client/${task._id}`
        : source === "project"
          ? `/tasks/all/company/project/${task.projectId}/tasks/${task._id}/status`
          : source === "self"
            ? `/tasks/all/company/self/${task._id}/status`
            : `/tasks/all/company/assigned/${task._id}/status`;
    const payload =
      source === "client"
        ? { status: nextStatus, completed: nextStatus === "completed" }
        : { status: nextStatus, remarks: "Status updated from Company All Task" };

    // Optimistic UI update. getDisplayStatus reads userStatus first, so it must change too
    // or the row keeps the old status until the page is refreshed.
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        String(t._id || "") === String(task._id || "")
          ? { ...t, status: nextStatus, userStatus: nextStatus, overallStatus: nextStatus, completed: nextStatus === "completed" }
          : t
      )
    );
    setTaskDetailsById((prev) => ({
      ...prev,
      [task._id]: {
        ...(prev[task._id] || {}),
        status: nextStatus,
        userStatus: nextStatus,
        overallStatus: nextStatus,
        completed: nextStatus === "completed",
        loading: false,
      },
    }));

    setError("");
    try {
      if (source === "client") {
        await axios.put(endpoint, payload);
      } else {
        await axios.patch(endpoint, payload);
      }
      // Reload quietly so the status counts, tabs and grouping match the saved status.
      fetchTasks(true);
    } catch (err) {
      console.error("Failed to update task status:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to update task status.");
      fetchTasks();
    }
  };

  const handleOpenTaskDetails = useCallback(async (task) => {
    if (!task) return;
    const taskObj = { ...task };
    setTaskDetailsModal({ open: true, task: taskObj });
    try {
      const details = await fetchTaskDetails(task);
      setTaskDetailsModal((prev) => {
        if (!prev.open || !prev.task || String(prev.task._id || '') !== String(task._id || '')) return prev;
        return {
          ...prev,
          task: {
            ...prev.task,
            remarks: details.remarks || prev.task.remarks || [],
            activityLogs: details.activityLogs || prev.task.activityLogs || []
          }
        };
      });
    } catch (err) {
      console.error("Failed to fetch full task details:", err);
    }
  }, [fetchTaskDetails]);

  const handleAddRemarkFromModal = useCallback(async (task, text, files = []) => {
    if (!task?._id || !text) return;
    const source = getTaskSource(task);
    const endpoint =
      source === "client"
        ? `/tasks/client-tasks/${task._id}/remarks`
        : source === "project"
          ? `/tasks/project/${task.projectId}/tasks/${task._id}/remarks`
          : source === "self"
            ? `/tasks/self/${task._id}/remarks`
            : `/task/${task._id}/remarks`;

    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("remark", text);
      files.forEach((f) => formData.append("image", f));
      await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } else {
      await axios.post(endpoint, { text, remark: text, comment: text });
    }

    const updatedDetails = await fetchTaskDetails(task);
    setTaskDetailsModal((prev) => {
      if (!prev.open || !prev.task) return prev;
      return {
        ...prev,
        task: { ...prev.task, ...updatedDetails, remarks: updatedDetails.remarks }
      };
    });
  }, [fetchTaskDetails]);

  const handleStatusChangeFromModal = useCallback(async (task, newStatus) => {
    await handleTaskStatusChange(task, newStatus);
    const updatedDetails = await fetchTaskDetails(task);
    setTaskDetailsModal((prev) => {
      if (!prev.open || !prev.task) return prev;
      return {
        ...prev,
        task: { ...prev.task, ...updatedDetails, status: newStatus, overallStatus: newStatus }
      };
    });
  }, [fetchTaskDetails, handleTaskStatusChange]);

  const canToggleCheckpoint = (task) => canEditTask(task) &&
    getDisplayStatus(task) === "in-progress" &&
    (!task.overallStatus || normalizeStatus(task.overallStatus) === "in-progress");

  const handleCheckpointToggle = async (task, checkpoint) => {
    const checkpointId = checkpoint?._id || checkpoint?.id;
    if (!task?._id || !checkpointId || savingTaskId || !canToggleCheckpoint(task)) return;

    const source = getTaskSource(task);
    const endpoint =
      source === "client"
        ? `/tasks/client-tasks/${task._id}/checkpoints/${checkpointId}`
        : source === "project"
          ? `/tasks/project/${task.projectId}/tasks/${task._id}/checkpoints/${checkpointId}`
          : source === "self"
            ? `/tasks/self/${task._id}/checkpoints/${checkpointId}`
            : `/tasks/assigned/${task._id}/checkpoints/${checkpointId}`;

    setSavingTaskId(task._id);
    setError("");
    try {
      const { data } = await axios.patch(endpoint, { completed: !checkpoint.completed });
      const savedTask = data.task || data.data;
      const updateTask = (item) => {
        const status = savedTask.overallStatus || savedTask.status;
        return {
          ...item,
          checkpoints: savedTask.checkpoints,
          ...(normalizeStatus(status) === "completed"
            ? { status, overallStatus: status, userStatus: status, completed: true }
            : {}),
        };
      };
      setTasks((items) => items.map((item) => String(item._id) === String(task._id) ? updateTask(item) : item));
      setTaskDetailsModal((current) => current.open && String(current.task?._id) === String(task._id)
        ? { ...current, task: updateTask(current.task) }
        : current);
      void fetchTasks(true);
    } catch (err) {
      console.error("Failed to update checkpoint:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to update checkpoint.");
      void fetchTasks(true);
    } finally {
      setSavingTaskId(null);
    }
  };

  const toggleCheckpoints = (taskId) => {
    setExpandedCheckpoints((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const task = editModal.task;
    if (!task?._id || !canEditTask(task)) return;

    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.dueDateTime) {
      setError("Title, description and due date are required.");
      return;
    }

    const source = getTaskSource(task);
    const dueDateIso = new Date(editForm.dueDateTime).toISOString();
    const cleanCheckpoints = getCleanCheckpoints(editForm.checkpoints);
    const updatedTitle = editForm.title.trim();
    const updatedDesc = editForm.description.trim();
    const updatedPriority = editForm.priority;
    const updatedStatus = editForm.status;

    // 1. INSTANT OPTIMISTIC UPDATE: Update UI instantly with zero lag!
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (String(t._id || "") === String(task._id || "")) {
          return {
            ...t,
            title: updatedTitle,
            name: updatedTitle,
            description: updatedDesc,
            dueDateTime: dueDateIso,
            dueDate: dueDateIso,
            priority: updatedPriority,
            status: updatedStatus,
            userStatus: updatedStatus,
            overallStatus: updatedStatus,
            completed: updatedStatus === "completed",
            checkpoints: cleanCheckpoints,
          };
        }
        return t;
      })
    );

    setTaskDetailsById((prev) => ({
      ...prev,
      [task._id]: {
        ...(prev[task._id] || {}),
        title: updatedTitle,
        name: updatedTitle,
        description: updatedDesc,
        dueDateTime: dueDateIso,
        dueDate: dueDateIso,
        priority: updatedPriority,
        status: updatedStatus,
        userStatus: updatedStatus,
        overallStatus: updatedStatus,
        completed: updatedStatus === "completed",
        checkpoints: cleanCheckpoints,
        loading: false,
      },
    }));

    setError("");
    // The edit is already reflected optimistically, so keep the modal responsive
    // and close it as soon as Save is clicked.
    closeEditModal();
    setSavingTaskId(task._id);

    // Persist in the background. Any failure is surfaced on the page and the
    // task list is refreshed from the server to restore the saved state.
    try {
      if (source === "client") {
        await axios.put(`/tasks/all/company/client/${task._id}`, {
          name: updatedTitle,
          description: updatedDesc,
          dueDate: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          completed: updatedStatus === "completed",
          checkpoints: cleanCheckpoints,
        });
      } else if (source === "project") {
        await axios.put(`/tasks/all/company/project/${task.projectId}/tasks/${task._id}`, {
          title: updatedTitle,
          description: updatedDesc,
          // Project tasks store this field as dueDate, unlike assigned/self tasks.
          dueDate: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          checkpoints: cleanCheckpoints,
        });
      } else if (source === "self") {
        await axios.put(`/tasks/all/company/self/${task._id}`, {
          title: updatedTitle,
          description: updatedDesc,
          dueDateTime: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          checkpoints: cleanCheckpoints,
        });
      } else {
        await axios.put(`/tasks/all/company/assigned/${task._id}`, {
          title: updatedTitle,
          description: updatedDesc,
          dueDateTime: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          checkpoints: cleanCheckpoints,
        });
      }
      fetchTasks(true);
    } catch (err) {
      console.error("Failed to save task update to server:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to update task.");
      fetchTasks();
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (!effectiveUserId) return;
    setExportingPdf(true);
    try {
      const response = await axios.get(`/task/user/${effectiveUserId}/all-tasks`, {
        params: {
          page: 1,
          limit: 1000,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          fromDate: startDate || undefined,
          toDate: endDate || undefined,
          search: search.trim() || undefined,
          status: status !== "all" ? status : undefined,
          priority: priority !== "all" ? priority : undefined,
        },
      });

      const allExportTasks = response.data?.tasks || [];
      if (!allExportTasks.length) {
        showToast("No tasks available to export for the selected filters.", "error");
        return;
      }

      showToast("Generating PDF report...", "info");

      // Eight task columns cannot fit on an A4 portrait page. Landscape keeps
      // every field inside the printable area and autoTable carries rows over
      // to subsequent pages instead of clipping the right-side values.
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 54, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("CIIS NETWORK - EMPLOYEE TASK REPORT", 30, 34);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(220, 230, 255);
      doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, pageWidth - 30, 34, { align: "right" });

      const empName = employee?.name || "Employee";
      const empRole = employee?.jobRole || employee?.role || "Team Member";
      const empDept = employee?.department?.name || employee?.department || "Department";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Employee: ${empName} (${empRole} - ${empDept})`, 30, 72);

      const rows = allExportTasks.map((t, index) => {
        const dispStatus = getDisplayStatus(t);
        const tType = getTaskType(t) === "assigned" ? "Assigned" : "Personal";
        const dueDate = formatDate(getDueDate(t));
        const workTime = Number(t.workTime?.seconds) > 0 ? t.workTime.label : "No time logged";
        const cleanTitle = String(t.title || "Untitled").replace(/[\r\n]+/g, " ");
        const cleanDesc = String(t.description || "No description").replace(/[\r\n]+/g, " ");

        return [
          index + 1,
          cleanTitle,
          cleanDesc,
          (t.priority || "medium").toUpperCase(),
          dispStatus.toUpperCase(),
          tType,
          dueDate,
          workTime,
        ];
      });

      autoTable(doc, {
        startY: 88,
        head: [["#", "Title", "Description", "Priority", "Status", "Type", "Due Date", "Task Time"]],
        body: rows,
        theme: "grid",
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "left",
        },
        bodyStyles: {
          fontSize: 7.2,
          textColor: [30, 41, 59],
          valign: "middle",
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          1: { cellWidth: 145 },
          2: { cellWidth: 260 },
          3: { cellWidth: 60, halign: "center" },
          4: { cellWidth: 70, halign: "center" },
          5: { cellWidth: 55, halign: "center" },
          6: { cellWidth: 75, halign: "center" },
          7: { cellWidth: 65, halign: "center" },
        },
        margin: { left: 30, right: 30, bottom: 30 },
        didDrawPage: () => {
          const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(pageStr, pageWidth - 60, pageHeight - 14);
          doc.text("CIIS Network - Confidential", 30, pageHeight - 14);
        },
      });

      const fileStart = startDate || "all";
      const fileEnd = endDate || "all";
      const sanitizedName = String(empName).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      doc.save(`company-tasks-${sanitizedName}-${fileStart}-to-${fileEnd}.pdf`);
      showToast("Task report PDF exported successfully!", "success");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      showToast("Failed to export PDF. Please try again.", "error");
    } finally {
      setExportingPdf(false);
    }
  }, [effectiveUserId, employee, endDate, priority, search, showToast, startDate, status]);

  const completionRate = useMemo(() => {
    const totalCount = stats.total || tasks.length;
    if (!totalCount) return 0;
    return Math.round(((stats.completed || 0) / totalCount) * 100);
  }, [stats.completed, stats.total, tasks.length]);

  // Weekly Productivity (Mon - Sat): reset automatically with each new Monday.
  const weeklyProductivity = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const distanceToMonday = (dayOfWeek + 6) % 7; // 0 = Mon, 1 = Tue, ..., 6 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    // Sunday is a weekly rest day. On Sunday, keep the completed Mon-Sat
    // chart visible; a fresh week begins next Monday.
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return dayLabels.map((label, idx) => {
      // Future days in current week must strictly be 0%
      if (idx > distanceToMonday) {
        return { day: label, pct: 0 };
      }

      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);
      targetDate.setHours(0, 0, 0, 0);
      const dateKey = getDateInputValue(targetDate);
      const isToday = idx === distanceToMonday;

      // 1. Check if specific tasks exist for this date
      const dayTasks = tasks.filter((t) => {
        const taskDate = t.completedAt || t.dueDateTime || t.dueDate || t.createdAt;
        if (!taskDate) return false;
        const taskDateKey = getDateInputValue(new Date(taskDate));
        return taskDateKey === dateKey;
      });

      if (dayTasks.length > 0) {
        const completed = dayTasks.filter((t) => {
          const s = String(t.userStatus || t.status || "").toLowerCase().trim();
          return s === "completed";
        }).length;
        const rate = Math.round((completed / dayTasks.length) * 100);
        return { day: label, pct: rate };
      }

      // 2. For today: if workSummary has productivity percentage, use that
      if (isToday && workSummary?.productivity) {
        const parsedProd = parseInt(String(workSummary.productivity).replace('%', ''), 10);
        if (!isNaN(parsedProd)) {
          return { day: label, pct: parsedProd };
        }
      }

      // 3. Check attendance record for this date
      const attRecord = attendanceRecords.find((r) => {
        if (!r.date) return false;
        return getDateInputValue(new Date(r.date)) === dateKey;
      });

      if (attRecord) {
        const attStatus = String(attRecord.status || "").toUpperCase();
        if (attStatus === "PRESENT") {
          return { day: label, pct: isToday && stats.total > 0 ? completionRate : (attRecord.totalHours ? Math.min(100, Math.round((attRecord.totalHours / 8) * 100)) : 100) };
        }
        if (attStatus === "LATE") return { day: label, pct: 75 };
        if (attStatus === "HALF DAY" || attStatus === "HALFDAY") return { day: label, pct: 50 };
        if (["LEAVE", "HOLIDAY", "WEEKEND", "ABSENT"].includes(attStatus)) return { day: label, pct: 0 };
      }

      // 4. If today, use completionRate if tasks exist, otherwise 0
      if (isToday && completionRate > 0) {
        return { day: label, pct: completionRate };
      }

      // Any other past day with no recorded tasks/attendance is 0%
      return { day: label, pct: 0 };
    });
  }, [tasks, attendanceRecords, completionRate, workSummary?.productivity, stats.total]);

  const onTimeRate = useMemo(() => {
    return Number.isFinite(performanceMetrics?.onTimeRate) ? performanceMetrics.onTimeRate : null;
  }, [performanceMetrics]);

  const attendanceReliability = useMemo(() => {
    const pointsByStatus = { PRESENT: 100, LATE: 75, "SHORT LEAVE": 75, "HALF DAY": 50, HALFDAY: 50, ABSENT: 0, "UNINFORMED LEAVE": 0, UNINFORMEDLEAVE: 0 };
    const points = attendanceRecords
      .map((record) => pointsByStatus[String(record.status || "").trim().toUpperCase()])
      .filter((value) => Number.isFinite(value));
    return points.length ? Math.round(points.reduce((sum, value) => sum + value, 0) / points.length) : null;
  }, [attendanceRecords]);

  const personalTasksCount = useMemo(() => {
    if (typeof stats.personal === "number" && stats.personal >= 0) return stats.personal;
    return tasks.filter((t) => {
      const type = getTaskType(t);
      return type === "self" || type === "personal";
    }).length;
  }, [stats.personal, tasks]);

  const projectTasksCount = useMemo(() => {
    if (typeof stats.project === "number" && stats.project >= 0) return stats.project;
    return tasks.filter((t) => {
      const type = getTaskType(t);
      return type === "project";
    }).length;
  }, [stats.project, tasks]);

  const clientTasksCount = useMemo(() => {
    if (typeof stats.client === "number" && stats.client >= 0) return stats.client;
    return tasks.filter((t) => {
      const type = getTaskType(t);
      return type === "client";
    }).length;
  }, [stats.client, tasks]);

  const workTasksCount = useMemo(() => {
    if (typeof stats.work === "number" && stats.work >= 0) return stats.work;
    return tasks.filter((t) => {
      const type = getTaskType(t);
      return type === "assigned" || type === "project" || type === "client";
    }).length;
  }, [stats.work, tasks]);

  const projectOptions = useMemo(() => {
    const values = tasks.map((task) => task.project?.name || task.projectName || task.project?.title || task.project).filter((value) => typeof value === "string" && value.trim());
    return [...new Set([...(filterOptions.projects || []), ...values.map((value) => value.trim())])];
  }, [filterOptions.projects, tasks]);

  const clientOptions = useMemo(() => {
    const values = tasks.map((task) => task.client?.name || task.clientName || task.client?.companyName || task.client).filter((value) => typeof value === "string" && value.trim());
    return [...new Set([...(filterOptions.clients || []), ...values.map((value) => value.trim())])];
  }, [filterOptions.clients, tasks]);

  const taskGroups = useMemo(() => {
    let filtered = tasks;
    const normalizedSearch = search.trim().toLowerCase();

    // Keep the visible list faithful to the selected controls even when an
    // endpoint returns an unfiltered page of tasks.
    if (normalizedSearch) {
      filtered = filtered.filter((task) => [task.title, task.name, task.description]
        .some((value) => String(value || "").toLowerCase().includes(normalizedSearch)));
    }
    if (priority !== "all") {
      filtered = filtered.filter((task) => String(task.priority || "").toLowerCase() === priority);
    }
    if (status !== "all") {
      filtered = filtered.filter((task) => {
        const taskStatus = getDisplayStatus(task);
        const taskIsOverdue = isOverdue(task);
        if (status === "overdue") return taskStatus === "overdue" || taskIsOverdue;
        if (status === "onhold") return taskStatus === "onhold";
        // Overdue work is intentionally reserved for the Overdue filter.
        if (taskIsOverdue && ["pending", "in-progress"].includes(status)) return false;
        return taskStatus === status;
      });
    }
    if (projectFilter !== "all") {
      filtered = filtered.filter((task) => (task.project?.name || task.projectName || task.project?.title || task.project) === projectFilter);
    }
    if (clientFilter !== "all") {
      filtered = filtered.filter((task) => (task.client?.name || task.clientName || task.client?.companyName || task.client) === clientFilter);
    }
    if (taskTypeFilter === "personal") {
      filtered = filtered.filter((t) => {
        const type = getTaskType(t);
        return type === "self" || type === "personal";
      });
    } else if (taskTypeFilter === "project") {
      filtered = filtered.filter((t) => {
        const type = getTaskType(t);
        return type === "project";
      });
    } else if (taskTypeFilter === "client") {
      filtered = filtered.filter((t) => {
        const type = getTaskType(t);
        return type === "client";
      });
    } else if (taskTypeFilter === "work") {
      filtered = filtered.filter((t) => {
        const type = getTaskType(t);
        return type === "assigned" || type === "project" || type === "client";
      });
    }

    const priorityRank = { high: 0, medium: 1, low: 2 };
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "title") {
        return String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""));
      }
      if (sortBy === "date") {
        return new Date(getDueDate(a) || 0).getTime() - new Date(getDueDate(b) || 0).getTime();
      }
      return (priorityRank[String(a.priority || "medium").toLowerCase()] ?? 3)
        - (priorityRank[String(b.priority || "medium").toLowerCase()] ?? 3);
    });

    const groupDefinitions = groupBy === "priority"
      ? [
          { key: "high", label: "High Priority", color: "#dc2626", matches: (task) => String(task.priority || "").toLowerCase() === "high" },
          { key: "medium", label: "Medium Priority", color: "#d97706", matches: (task) => String(task.priority || "medium").toLowerCase() === "medium" },
          { key: "low", label: "Low Priority", color: "#16a34a", matches: (task) => String(task.priority || "").toLowerCase() === "low" },
          { key: "other-priority", label: "Other Priority", color: "#64748b", matches: (task) => !["high", "medium", "low"].includes(String(task.priority || "").toLowerCase()) },
        ]
      : [
          { key: "in-progress", label: "In Progress", color: "#0ea5e9", matches: (task) => getDisplayStatus(task) === "in-progress" && !isOverdue(task) },
          { key: "pending", label: "Pending", color: "#f59e0b", matches: (task) => getDisplayStatus(task) === "pending" && !isOverdue(task) },
          { key: "completed", label: "Completed", color: "#16a34a", matches: (task) => getDisplayStatus(task) === "completed" },
          { key: "onhold", label: "On Hold", color: "#7c3aed", matches: (task) => getDisplayStatus(task) === "onhold" },
          { key: "overdue", label: "Overdue", color: "#dc2626", matches: (task) => isOverdue(task) },
          { key: "other", label: "Other Statuses", color: "#64748b", matches: (task) => !["in-progress", "pending", "completed", "onhold"].includes(getDisplayStatus(task)) && !isOverdue(task) },
        ];

    if (groupBy === "date") {
      const groupsByDate = new Map();
      sorted.forEach((task) => {
        const dueDate = getDueDate(task);
        const parsedDueDate = dueDate ? new Date(dueDate) : null;
        const hasValidDueDate = parsedDueDate && !Number.isNaN(parsedDueDate.getTime());
        const key = hasValidDueDate ? parsedDueDate.toISOString().slice(0, 10) : "no-due-date";
        if (!groupsByDate.has(key)) {
          groupsByDate.set(key, { key, label: hasValidDueDate ? formatDate(dueDate) : "No Due Date", color: "#64748b", tasks: [] });
        }
        groupsByDate.get(key).tasks.push(task);
      });
      return [...groupsByDate.values()].sort((a, b) => a.key.localeCompare(b.key));
    }

    return groupDefinitions
      .map((group) => ({ ...group, tasks: sorted.filter(group.matches) }))
      .filter((group) => group.tasks.length > 0);
  }, [clientFilter, groupBy, priority, projectFilter, search, sortBy, status, taskTypeFilter, tasks]);

  // Calendar Helpers for Attendance
  const calendarDays = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const record = attendanceRecords.find((r) => {
        if (!r.date) return false;
        return getDateInputValue(new Date(r.date)) === dateKey;
      });
      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Check if this date is a company holiday
      const holidayFromList = holidaysList.find((h) => {
        if (!h.date) return false;
        const hKey = getDateInputValue(new Date(h.date));
        return hKey === dateKey;
      });

      const recordStatus = String(record?.status || "").toUpperCase();
      const hasAttendanceRecord = Boolean(record) && !["", "NO RECORD", "UPCOMING"].includes(recordStatus);
      const isLateArrival = Boolean(record?.lateBy && !["00:00:00", "00:00", "0", "--", ""].includes(String(record.lateBy).trim()));
      let status = "NO RECORD";
      if (hasAttendanceRecord) {
        if (recordStatus === "PRESENT" && isLateArrival) {
          status = "LATE";
        } else {
          status = recordStatus;
        }
      } else if (holidayFromList) {
        status = "HOLIDAY";
      } else if (isWeekend) {
        status = "WEEKEND";
      } else if (dateKey < todayStr) {
        // A past working day with no attendance record and no leave/holiday
        // record is an absence. Keep today as "No Log" until the day ends.
        status = "ABSENT";
      } else if (dateKey > todayStr) {
        status = "UPCOMING";
      }

      // If a holiday is registered on this date and user has no clock punch, ensure status is HOLIDAY
      if (holidayFromList && !record?.inTime && !record?.outTime) {
        status = "HOLIDAY";
      }

      const holidayName = record?.holidayName || holidayFromList?.title || (status === "HOLIDAY" ? (record?.notes || "Company Holiday") : null);

      const resolvedRecord = record ? {
        ...record,
        status: (String(record.status).toUpperCase() === "PRESENT" && isLateArrival) ? "LATE" : record.status,
        holidayName
      } : (status === "HOLIDAY" ? { date: dateKey, status: "HOLIDAY", holidayName, isGenerated: true } : null);

      days.push({
        day: d,
        dateKey,
        record: resolvedRecord,
        status,
        holidayName,
        isToday: dateKey === todayStr,
      });
    }
    return days;
  }, [attendanceRecords, calDate, todayStr, holidaysList]);

  const handlePrevMonth = () => {
    const nextDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1);
    setCalDate(nextDate);
    fetchAttendance(nextDate);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1);
    setCalDate(nextDate);
    fetchAttendance(nextDate);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCalDate(today);
    fetchAttendance(today);
  };

  // Monthly Attendance Metrics (Derived dynamically from calendar days so no past unpunched day is missed)
  const monthStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let halfday = 0;
    let absent = 0;
    let leave = 0;
    let holiday = 0;
    let weekend = 0;

    const validDays = calendarDays.filter((c) => c.day !== null);

    validDays.forEach((c) => {
      const s = String(c.status || "").toUpperCase();
      if (s === "PRESENT") present++;
      else if (s === "LATE") late++;
      else if (s === "HALF DAY" || s === "HALFDAY") halfday++;
      else if (s === "ABSENT") absent++;
      else if (s === "LEAVE" || (s.includes("LEAVE") && s !== "EARLY LEAVE")) leave++;
      else if (s === "HOLIDAY") holiday++;
      else if (s === "WEEKEND") weekend++;
    });

    const workingDays = present + late + halfday + absent;
    const rawRate = workingDays > 0
      ? Math.round(((present + late + (halfday * 0.5)) / workingDays) * 100)
      : (validDays.some((c) => c.dateKey && c.dateKey <= todayStr && c.status !== "WEEKEND" && c.status !== "HOLIDAY") ? 0 : 100);

    // Discipline & Punctuality Score:
    // Present = 100%, Late = 70% (30% penalty for late check-in), HalfDay = 50%, Absent = 0%
    const disciplineScore = workingDays > 0
      ? Math.round(((present * 1.0 + late * 0.70 + (halfday * 0.5)) / workingDays) * 100)
      : (validDays.some((c) => c.dateKey && c.dateKey <= todayStr && c.status !== "WEEKEND" && c.status !== "HOLIDAY") ? 0 : 100);

    return {
      present,
      late,
      halfday,
      absent,
      leave,
      holiday,
      weekend,
      totalWorking: workingDays,
      attendanceRate: Math.min(100, Math.max(0, rawRate)),
      disciplineScore: Math.min(100, Math.max(0, disciplineScore)),
    };
  }, [calendarDays, todayStr]);

  // Multi-Timeframe Comprehensive Performance Evaluation Engine
  const detailedPerformance = useMemo(() => {
    const now = new Date();
    const effectivePerfTimeframe = activeTimeframe;

    // Use timeframe dataset if available (even when 0 tasks), otherwise fallback to general tasks
    const isPerfLoaded = perfData.stats !== null || (Array.isArray(perfData.tasks) && perfData.tasks.length > 0);
    const activeTaskList = isPerfLoaded ? (perfData.tasks || []) : tasks;
    const activeStats = isPerfLoaded && perfData.stats ? perfData.stats : (isPerfLoaded ? countStats(perfData.tasks) : stats);
    const activeMetrics = perfData.performanceMetrics || performanceMetrics;
    // Do not mix a selected-period score with work hours from the general task view.
    const activeWorkSummary = isPerfLoaded ? perfData.workSummary : workSummary;

    const totalTasks = activeStats?.total !== undefined ? Number(activeStats.total) : activeTaskList.length;
    const completedTasks = activeStats?.completed !== undefined ? Number(activeStats.completed) : activeTaskList.filter((t) => String(t.status || "").toLowerCase() === "completed").length;
    const inProgressTasks = activeStats?.inProgress !== undefined ? Number(activeStats.inProgress) : activeTaskList.filter((t) => String(t.status || "").toLowerCase().includes("progress")).length;
    const overdueTasks = activeStats?.overdue !== undefined ? Number(activeStats.overdue) : activeTaskList.filter((t) => String(t.status || "").toLowerCase() === "overdue").length;
    const onHoldTasks = activeStats?.onhold !== undefined ? Number(activeStats.onhold) : activeTaskList.filter((t) => ["onhold", "on hold", "on-hold"].includes(String(t.status || "").toLowerCase())).length;
    const pendingTasks = activeStats?.pending !== undefined ? Number(activeStats.pending) : Math.max(0, totalTasks - completedTasks - inProgressTasks - overdueTasks);

    // 1. Task Completion Rate (0-100)
    const taskCompRate = totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;
    const taskCompPts = Number((taskCompRate * 0.40).toFixed(1));

    // 2. On-Time Delivery Rate (0-100)
    let onTimeVal = 0;
    if (totalTasks === 0) {
      onTimeVal = 0;
    } else if (Number.isFinite(activeMetrics?.onTimeRate)) {
      onTimeVal = activeMetrics.onTimeRate;
    } else if (overdueTasks > 0) {
      onTimeVal = Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 100));
    } else {
      const completedWithDueDate = activeTaskList.filter((t) => String(t.status || "").toLowerCase() === "completed" && (t.dueDate || t.dueDateTime));
      if (completedWithDueDate.length > 0) {
        const completedOnTime = completedWithDueDate.filter((t) => {
          const due = new Date(t.dueDate || t.dueDateTime);
          const comp = new Date(t.completionDate || t.updatedAt || t.createdAt);
          return !isNaN(due.getTime()) && !isNaN(comp.getTime()) && comp <= due;
        });
        onTimeVal = Math.round((completedOnTime.length / completedWithDueDate.length) * 100);
      } else {
        // There is no due-date evidence for this window, so do not award a perfect SLA score.
        onTimeVal = 0;
      }
    }
    const onTimePts = Number((onTimeVal * 0.25).toFixed(1));

    // 3. Attendance Slicing based on timeframe
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let halfdayCount = 0;
    let totalWorkingDays = 0;

    // Attendance is fetched independently for the selected Performance range.
    // This prevents 6-month/overall reports from accidentally using the calendar's
    // current-month records (or showing a hard-coded 0%).
    const periodAttendance = perfAttendance.loaded ? perfAttendance.records : [];
    periodAttendance.forEach((record) => {
      const status = String(record?.status || "").trim().toUpperCase();
      const lateBy = String(record?.lateBy || "").trim();
      const hasLatePunch = lateBy && lateBy !== "00:00:00" && lateBy !== "0:00:00";

      if (status === "PRESENT") {
        if (hasLatePunch) lateCount++;
        else presentCount++;
      } else if (status === "LATE" || status === "SHORT LEAVE") {
        lateCount++;
      } else if (status === "HALF DAY" || status === "HALFDAY") {
        halfdayCount++;
      } else if (status === "ABSENT" || status === "UNINFORMED LEAVE" || status === "UNINFORMEDLEAVE") {
        absentCount++;
      }
    });
    totalWorkingDays = presentCount + lateCount + halfdayCount + absentCount;

    const disciplineRate = totalWorkingDays > 0
      ? Math.round(((presentCount * 1.0 + lateCount * 0.70 + halfdayCount * 0.50) / totalWorkingDays) * 100)
      : 0;
    const attPts = Number((disciplineRate * 0.20).toFixed(1));

    // 4. Time Tracking / Utilization Rate (0-100)
    let timeUtilRate = 0;
    if (activeWorkSummary?.productivity) {
      const p = parseInt(String(activeWorkSummary.productivity).replace('%', ''), 10);
      if (!isNaN(p)) timeUtilRate = Math.min(100, Math.max(0, p));
    } else if (activeWorkSummary?.trackedTaskSeconds && activeWorkSummary?.totalClockedSeconds && activeWorkSummary.totalClockedSeconds > 0) {
      timeUtilRate = Math.min(100, Math.round((activeWorkSummary.trackedTaskSeconds / activeWorkSummary.totalClockedSeconds) * 100));
    } else if (totalTasks > 0) {
      timeUtilRate = taskCompRate;
    } else {
      timeUtilRate = 0;
    }
    const timeUtilPts = Number((timeUtilRate * 0.15).toFixed(1));

    // 5. Overdue Penalty
    const overdueRatio = totalTasks > 0 ? (overdueTasks / totalTasks) : 0;
    const overduePenalty = overdueRatio > 0 ? Math.min(10, Math.round(overdueRatio * 20)) : 0;

    // Final Aggregate Score (0 to 100)
    const rawTotal = taskCompPts + onTimePts + attPts + timeUtilPts - overduePenalty;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    // Rating tier and grade
    let tier = "Needs Improvement";
    let grade = "C";
    let tierColor = "red";
    if (finalScore >= 90) {
      tier = "Top Performer";
      grade = "A+";
      tierColor = "purple";
    } else if (finalScore >= 75) {
      tier = "Strong Performer";
      grade = "A";
      tierColor = "emerald";
    } else if (finalScore >= 60) {
      tier = "Satisfactory";
      grade = "B";
      tierColor = "amber";
    }

    // Trajectory Status
    let trajectory = "Consistent Delivery";
    if (finalScore >= 85) trajectory = "High & Upward Trajectory 🚀";
    else if (finalScore >= 70) trajectory = "Consistent Output 📈";
    else if (finalScore >= 50) trajectory = "Moderate / Attention Needed ⚠️";
    else trajectory = "Immediate Support Required 🛑";

    // Dynamic Strengths
    const strengths = [];
    if (onTimeVal >= 80) strengths.push({ title: "High Deadline Reliability", desc: `${onTimeVal}% on-time completion on assigned deliverables.` });
    if (taskCompRate >= 70) strengths.push({ title: "Strong Task Throughput", desc: `${completedTasks} tasks resolved successfully in this window.` });
    if (absentCount === 0 && lateCount === 0 && presentCount > 0) {
      strengths.push({ title: "100% Punctuality & Zero Absents", desc: `Perfect attendance with 0 late arrivals and 0 unexcused absences.` });
    } else if (absentCount === 0 && presentCount > 0) {
      strengths.push({ title: "Full Attendance Consistency", desc: `100% attendance recorded across all scheduled working days.` });
    }
    if (strengths.length === 0) {
      strengths.push({ title: "Steady Work Output", desc: `Active task progression and logged time updates recorded.` });
    }

    // Dynamic Improvements & Focus Areas
    const improvements = [];
    if (overdueTasks > 0) {
      improvements.push({ title: "Resolve Overdue Tasks", desc: `${overdueTasks} overdue task(s) past deadline causing -${overduePenalty} pts deduction. Priority resolution required.`, isWarning: true });
    }
    if (lateCount > 0) {
      improvements.push({ title: "Punctuality Improvement", desc: `${lateCount} late arrival(s) incurred -30% penalty per incident. Timely Clock In advised.`, isWarning: true });
    }
    if (absentCount > 0) {
      improvements.push({ title: "Unexcused Absence Alert", desc: `${absentCount} day(s) without Clock In logged. Reduces discipline reliability score to ${disciplineRate}%.`, isWarning: true });
    }
    if (halfdayCount > 0) {
      improvements.push({ title: "Half-Day Shifts Tracked", desc: `${halfdayCount} half-day session(s) logged (50% discipline credit). Ensure full shift coverage when possible.`, isWarning: false });
    }
    if (inProgressTasks > 3) {
      improvements.push({ title: "Active WIP Overload", desc: `${inProgressTasks} tasks simultaneously in-progress. Focus on finishing active tasks first.`, isWarning: false });
    }
    if (improvements.length === 0) {
      improvements.push({ title: "Optimal Execution Standards", desc: `All key performance indicators within benchmark SLA thresholds.`, isWarning: false });
    }

    // Dynamic Performance Narrative Synthesis
    const empDisplay = employeeName || "The employee";
    let velocityText = "";
    if (taskCompRate >= 85) {
      velocityText = `${empDisplay} demonstrated outstanding execution velocity with a ${taskCompRate}% completion rate (${completedTasks} out of ${totalTasks} tasks resolved). Work streams are delivered promptly with minimal backlog.`;
    } else if (taskCompRate >= 60) {
      velocityText = `${empDisplay} maintains a steady productivity output at ${taskCompRate}% completion (${completedTasks} of ${totalTasks} tasks completed), with ${pendingTasks + inProgressTasks} active deliverables progressing in the pipeline.`;
    } else {
      velocityText = `${empDisplay}'s task completion is at ${taskCompRate}% (${completedTasks} of ${totalTasks} tasks), indicating that workflow support or task prioritization may be beneficial.`;
    }

    let qualityText = "";
    if (onTimeVal >= 85) {
      qualityText = `Deliverable timeliness is exemplary at ${onTimeVal}%, showing robust deadline discipline and dependable delivery.`;
    } else if (onTimeVal >= 70) {
      qualityText = `Adherence to milestone deadlines is acceptable at ${onTimeVal}%, with room for tighter delivery scheduling.`;
    } else {
      qualityText = `On-time delivery rate is ${onTimeVal}%, highlighting deadline slippage that requires closer calendar monitoring.`;
    }

    let attText = "";
    const halfdayNote = halfdayCount > 0 ? `, ${halfdayCount} half-day session(s)` : "";
    if (disciplineRate >= 90) {
      attText = `Attendance discipline is stellar at ${disciplineRate}% (${presentCount} Clock In shifts${halfdayNote}, ${lateCount} late arrivals, ${absentCount} absences), demonstrating high dependability.`;
    } else if (disciplineRate >= 75) {
      attText = `Attendance discipline is healthy at ${disciplineRate}% (${presentCount} Clock In shifts${halfdayNote}, ${lateCount} late arrivals, ${absentCount} absences). Consistency during morning shift starts is recommended.`;
    } else {
      attText = `Attendance discipline is flagged at ${disciplineRate}% (${absentCount} unclocked absences, ${lateCount} late arrivals${halfdayNote}), which impacts team operational continuity.`;
    }

    const overdueNote = overdueTasks > 0
      ? ` Immediate management action is recommended to resolve ${overdueTasks} overdue deliverable(s) past SLA deadline.`
      : ` Zero overdue deliverables recorded, maintaining pristine SLA compliance.`;

    const executiveSummary = `${empDisplay} is evaluated at a composite performance score of ${finalScore}/100, ranking in the "${tier}" tier with a "${trajectory}". ${velocityText} ${qualityText} ${attText}${overdueNote}`;

    const timeframeLabels = {
      today: "Today (Daily Report)",
      week: "This Week (Weekly Report)",
      month: "This Month (Monthly Report)",
      sixMonths: "Last 6 Months (Macro Trend)",
      overall: "Overall (Tenure Career)",
      custom: startDate || endDate
        ? `Selected Range (${startDate || "Start"} to ${endDate || "Today"})`
        : "Selected Date Range",
    };

    return {
      timeframe: effectivePerfTimeframe,
      timeframeLabel: timeframeLabels[effectivePerfTimeframe] || "Monthly Report",
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      onHold: onHoldTasks,
      completionRate: taskCompRate,
      onTimeRate: onTimeVal,
      attendance: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        halfday: halfdayCount,
        totalWorking: totalWorkingDays,
        disciplineRate,
      },
      timeUtilRate,
      trackedHoursLabel: activeWorkSummary?.trackedTaskLabel || "0m",
      finalScore,
      tier,
      grade,
      tierColor,
      trajectory,
      strengths,
      improvements,
      narrative: {
        executiveSummary,
        velocityText,
        qualityText,
        attText,
        overdueNote,
      },
      pillars: {
        taskCompletion: { rate: taskCompRate, weight: 40, points: taskCompPts, maxPoints: 40 },
        onTimeDelivery: { rate: onTimeVal, weight: 25, points: onTimePts, maxPoints: 25 },
        attendance: {
          rate: disciplineRate,
          weight: 20,
          points: attPts,
          maxPoints: 20,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          halfday: halfdayCount,
          workingDays: totalWorkingDays,
        },
        timeUtilization: { rate: timeUtilRate, weight: 15, points: timeUtilPts, maxPoints: 15 },
        overduePenalty: { points: overduePenalty },
      },
    };
  }, [activeTimeframe, perfData, perfAttendance, tasks, stats, performanceMetrics, workSummary, onTimeRate, employeeName, startDate, endDate]);

  // Download Official Performance Evaluation Dossier (Executive Multi-Pillar Assessment)
  const handleDownloadPerformanceReport = () => {
    try {
      // One-page executive report. Keep this separate from the legacy export below so
      // the download always produces a concise, printable employee assessment.
      {
        const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 34;
        const contentWidth = pageWidth - (margin * 2);
        const todayFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const employeeDisplayName = employeeName || employee?.name || "Employee";
        const employeeRole = employee?.designation || employee?.role || "Employee";
        const employeeDept = employee?.department || "Not specified";
        const score = detailedPerformance.finalScore;
        const scoreColor = score >= 75 ? [5, 150, 105] : score >= 60 ? [217, 119, 6] : [220, 38, 38];
        const softScoreColor = score >= 75 ? [236, 253, 245] : score >= 60 ? [255, 251, 235] : [254, 242, 242];
        const safeText = (value, fallback = "Not available") => String(value || fallback)
          .replace(/[\u2013\u2014]/g, "-")
          .replace(/[^\x20-\x7E]/g, "");
        const fitSingleLine = (value, maxWidth, fallback = "Not available") => {
          const raw = safeText(value, fallback);
          if (!maxWidth || doc.getTextWidth(raw) <= maxWidth) return raw;
          let trimmed = raw;
          while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}...`) > maxWidth) {
            trimmed = trimmed.slice(0, -1);
          }
          return `${trimmed}...`;
        };
        const drawLabel = (text, x, y) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(text.toUpperCase(), x, y);
        };
        const drawMetric = (x, y, width, label, value, accent) => {
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(x, y, width, 48, 6, 6, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.roundedRect(x, y, 4, 48, 2, 2, "F");
          drawLabel(label, x + 13, y + 17);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(15.5);
          doc.setTextColor(15, 23, 42);
          doc.text(fitSingleLine(value, width - 22, "0"), x + 13, y + 36);
        };
        const drawPillar = (x, y, label, rate, points, maximum, color, barWidth) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(fitSingleLine(label, barWidth - 40, label), x, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`${rate}%`, x + barWidth, y, { align: "right" });
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(x, y + 8, barWidth, 6, 3, 3, "F");
          doc.setFillColor(color[0], color[1], color[2]);
          doc.roundedRect(x, y + 8, Math.max(0, Math.min(barWidth, (rate / 100) * barWidth)), 6, 3, 3, "F");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`${points}/${maximum} points`, x, y + 27);
        };

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 100, "F");
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 96, pageWidth, 4, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.setTextColor(255, 255, 255);
        doc.text("EMPLOYEE PERFORMANCE REPORT", margin, 43);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(191, 219, 254);
        doc.text("CIIS Network - Operational Performance Intelligence", margin, 61);
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(8);
        doc.text(fitSingleLine(`REPORTING WINDOW: ${safeText(detailedPerformance.timeframeLabel)}`, 210), pageWidth - margin, 39, { align: "right" });
        doc.text(`GENERATED: ${todayFormatted}`, pageWidth - margin, 57, { align: "right" });

        const profileY = 122;
        const scoreBoxW = 124;
        const scoreBoxX = pageWidth - margin - 16 - scoreBoxW;
        const profileTextX = margin + 62;
        const profileTextMaxW = scoreBoxX - profileTextX - 14;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, profileY, contentWidth, 91, 8, 8, "F");
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, profileY, contentWidth, 91, 8, 8, "S");
        doc.setFillColor(37, 99, 235);
        doc.circle(margin + 30, profileY + 32, 20, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(255, 255, 255);
        doc.text(employeeDisplayName.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase() || "E", margin + 30, profileY + 37, { align: "center" });
        doc.setFontSize(15);
        doc.setTextColor(15, 23, 42);
        doc.text(fitSingleLine(employeeDisplayName, profileTextMaxW), profileTextX, profileY + 29);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(fitSingleLine(`${safeText(employeeRole)}  |  ${safeText(employeeDept)}`, profileTextMaxW), profileTextX, profileY + 46);
        doc.text(fitSingleLine(`Evaluation window: ${safeText(detailedPerformance.timeframeLabel)}`, profileTextMaxW), profileTextX, profileY + 65);
        doc.setFillColor(softScoreColor[0], softScoreColor[1], softScoreColor[2]);
        doc.roundedRect(scoreBoxX, profileY + 13, scoreBoxW, 64, 8, 8, "F");
        doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.roundedRect(scoreBoxX, profileY + 13, scoreBoxW, 64, 8, 8, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.text(`${score}/100`, scoreBoxX + (scoreBoxW / 2), profileY + 41, { align: "center" });
        doc.setFontSize(7.8);
        doc.text(`Grade ${detailedPerformance.grade} - ${safeText(detailedPerformance.tier)}`, scoreBoxX + (scoreBoxW / 2), profileY + 58, { align: "center", maxWidth: scoreBoxW - 12 });

        const metricY = 231;
        const metricGap = 9;
        const metricWidth = (contentWidth - (metricGap * 3)) / 4;
        drawMetric(margin, metricY, metricWidth, "Tasks evaluated", detailedPerformance.total, [37, 99, 235]);
        drawMetric(margin + metricWidth + metricGap, metricY, metricWidth, "Completion", `${detailedPerformance.completionRate}%`, [16, 185, 129]);
        drawMetric(margin + (metricWidth + metricGap) * 2, metricY, metricWidth, "On-time SLA", `${detailedPerformance.onTimeRate}%`, [14, 165, 233]);
        drawMetric(margin + (metricWidth + metricGap) * 3, metricY, metricWidth, "Tracked time", detailedPerformance.trackedHoursLabel, [139, 92, 246]);

        const lowerY = 302;
        const leftWidth = 238;
        const pillarBarWidth = leftWidth - 32;
        const rightX = margin + leftWidth + 16;
        const rightWidth = contentWidth - leftWidth - 16;
        const rightInnerWidth = rightWidth - 32;

        const primaryFocus = detailedPerformance.overdue > 0
          ? `${detailedPerformance.overdue} overdue task(s) require immediate resolution.`
          : detailedPerformance.pending > 0
            ? `${detailedPerformance.pending} pending task(s) should be prioritized to improve throughput.`
            : "No overdue tasks are recorded in this evaluation window.";
        const executiveAssessment = `${employeeDisplayName} is rated ${safeText(detailedPerformance.tier)} with a score of ${score}/100. `
          + `The employee completed ${detailedPerformance.completed} of ${detailedPerformance.total} tasks (${detailedPerformance.completionRate}%) and achieved ${detailedPerformance.onTimeRate}% on-time delivery. `
          + primaryFocus;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.2);
        const narrativeLines = doc.splitTextToSize(executiveAssessment, rightInnerWidth).slice(0, 5);
        const statusY = lowerY + 45 + (Math.max(4, narrativeLines.length) * 12.5) + 14;
        const statusBottomY = statusY + 20 + (4 * 16);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        const disclaimerLines = doc.splitTextToSize(
          "This assessment reflects available task, delivery, attendance and time-tracking evidence.",
          rightInnerWidth
        );
        const lowerCardHeight = Math.max(275, (statusBottomY - lowerY) + 46);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, lowerY, leftWidth, lowerCardHeight, 8, 8, "FD");
        doc.roundedRect(rightX, lowerY, rightWidth, lowerCardHeight, 8, 8, "FD");
        drawLabel("Weighted performance pillars", margin + 16, lowerY + 23);
        drawPillar(margin + 16, lowerY + 48, "Task completion", detailedPerformance.completionRate, detailedPerformance.pillars.taskCompletion.points, 40, [16, 185, 129], pillarBarWidth);
        drawPillar(margin + 16, lowerY + 89, "On-time delivery", detailedPerformance.onTimeRate, detailedPerformance.pillars.onTimeDelivery.points, 25, [37, 99, 235], pillarBarWidth);
        drawPillar(margin + 16, lowerY + 130, "Attendance discipline", detailedPerformance.attendance.disciplineRate, detailedPerformance.pillars.attendance.points, 20, [139, 92, 246], pillarBarWidth);
        drawPillar(margin + 16, lowerY + 171, "Time utilization", detailedPerformance.timeUtilRate, detailedPerformance.pillars.timeUtilization.points, 15, [217, 119, 6], pillarBarWidth);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        if (detailedPerformance.pillars.overduePenalty.points > 0) {
          const slaLines = doc.splitTextToSize(
            `SLA deduction: -${detailedPerformance.pillars.overduePenalty.points} pts for ${detailedPerformance.overdue} overdue task(s)`,
            pillarBarWidth - 18
          );
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(margin + 16, lowerY + 213, pillarBarWidth, 36, 5, 5, "F");
          doc.setTextColor(185, 28, 28);
          doc.text(slaLines, margin + 25, slaLines.length > 1 ? lowerY + 227 : lowerY + 234, { lineHeightFactor: 1.25 });
        } else {
          const slaLines = doc.splitTextToSize("SLA standing: no overdue task penalty in this window", pillarBarWidth - 18);
          doc.setFillColor(240, 253, 244);
          doc.roundedRect(margin + 16, lowerY + 213, pillarBarWidth, 36, 5, 5, "F");
          doc.setTextColor(21, 128, 61);
          doc.text(slaLines, margin + 25, slaLines.length > 1 ? lowerY + 227 : lowerY + 234, { lineHeightFactor: 1.25 });
        }

        drawLabel("Executive assessment", rightX + 16, lowerY + 23);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.2);
        doc.setTextColor(51, 65, 85);
        doc.text(narrativeLines, rightX + 16, lowerY + 45, { lineHeightFactor: 1.3 });
        drawLabel("Task status", rightX + 16, statusY);
        const statusEntries = [
          ["Completed", detailedPerformance.completed, [16, 185, 129]],
          ["In progress", detailedPerformance.inProgress, [37, 99, 235]],
          ["Pending", detailedPerformance.pending, [217, 119, 6]],
          ["Overdue", detailedPerformance.overdue, [220, 38, 38]],
          ["On hold", detailedPerformance.onHold, [100, 116, 139]],
        ];
        statusEntries.forEach(([label, value, color], index) => {
          const y = statusY + 20 + (index * 16);
          doc.setFillColor(color[0], color[1], color[2]);
          doc.circle(rightX + 20, y - 3, 3, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.4);
          doc.setTextColor(71, 85, 105);
          doc.text(label, rightX + 30, y);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(String(value), rightX + rightWidth - 16, y, { align: "right" });
        });
        const disclaimerY = lowerY + lowerCardHeight - 26;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(rightX + 16, disclaimerY - 10, rightInnerWidth, 1, 0, 0, "F");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(disclaimerLines, rightX + 16, disclaimerY, { lineHeightFactor: 1.25 });

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 38, pageWidth - margin, pageHeight - 38);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("CONFIDENTIAL - CIIS Network employee performance assessment", margin, pageHeight - 23);
        doc.text("One-page executive summary", pageWidth - margin, pageHeight - 23, { align: "right" });
        const sanitizedName = String(employeeDisplayName).replace(/[^a-zA-Z0-9]/g, "_");
        doc.save(`Performance_Report_${sanitizedName}_${todayStr}.pdf`);
        showToast("One-page performance report downloaded.", "success");
        return;
      }
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = pageWidth - 64; // 32pt margins
      const leftMargin = 32;
      const todayFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const currentYear = new Date().getFullYear();

      // =========================================================================
      // PAGE 1: EXECUTIVE PERFORMANCE DASHBOARD & WEIGHTED SCORECARD
      // =========================================================================

      // 1. Top Header Banner (Corporate Dark Slate #0f172a with Royal Accent #2563eb)
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 68, "F");

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 68, pageWidth, 3.5, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("CIIS NETWORK · EXECUTIVE PERFORMANCE DOSSIER", leftMargin, 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("CONFIDENTIAL & OFFICIAL PERFORMANCE AUDIT · ENTERPRISE WORKFORCE INTELLIGENCE", leftMargin, 46);

      // Header Metadata (Right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text(`Window: ${detailedPerformance.timeframeLabel}`, pageWidth - leftMargin, 28, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${todayFormatted}`, pageWidth - leftMargin, 42, { align: "right" });
      doc.text(`Ref: CIIS-PERF-${currentYear}`, pageWidth - leftMargin, 55, { align: "right" });

      // 2. Employee Profile & Composite Score Panel
      const cardY = 82;
      const cardHeight = 72;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(leftMargin, cardY, usableWidth, cardHeight, 6, 6, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(leftMargin, cardY, usableWidth, cardHeight, 6, 6, "S");

      // Profile details on left (strictly constrained width to avoid score overlap)
      const maxTextW = usableWidth - 165;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(String(employeeName || "Employee"), leftMargin + 14, cardY + 22, { maxWidth: maxTextW });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Role: ${employeeRole}   ·   Department: ${employeeDept}`, leftMargin + 14, cardY + 38, { maxWidth: maxTextW });
      doc.text(`Email: ${employeeEmail || "—"}   ·   Code: ${employee?.companyCode || "CIIS"}`, leftMargin + 14, cardY + 52, { maxWidth: maxTextW });
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Evaluation Model: Weighted Multi-Pillar Quantitative Performance Index", leftMargin + 14, cardY + 64, { maxWidth: maxTextW });

      // Right Score Badge
      const isHigh = detailedPerformance.finalScore >= 75;
      const isMid = detailedPerformance.finalScore >= 60;
      const scoreBg = isHigh ? [236, 253, 245] : isMid ? [254, 249, 195] : [254, 242, 242];
      const scoreColor = isHigh ? [5, 150, 105] : isMid ? [217, 119, 6] : [220, 38, 38];
      const scoreBorder = isHigh ? [167, 243, 208] : isMid ? [253, 230, 138] : [254, 202, 202];

      const scoreBoxW = 135;
      const scoreBoxX = pageWidth - leftMargin - scoreBoxW - 8;
      doc.setFillColor(scoreBg[0], scoreBg[1], scoreBg[2]);
      doc.roundedRect(scoreBoxX, cardY + 7, scoreBoxW, cardHeight - 14, 6, 6, "F");
      doc.setDrawColor(scoreBorder[0], scoreBorder[1], scoreBorder[2]);
      doc.roundedRect(scoreBoxX, cardY + 7, scoreBoxW, cardHeight - 14, 6, 6, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${detailedPerformance.finalScore}/100`, scoreBoxX + (scoreBoxW / 2), cardY + 32, { align: "center" });

      doc.setFontSize(8);
      doc.text(`Grade ${detailedPerformance.grade} · ${detailedPerformance.tier}`, scoreBoxX + (scoreBoxW / 2), cardY + 48, { align: "center", maxWidth: scoreBoxW - 10 });

      // 3. Section 1: Executive Diagnostic Synthesis & Narrative Box
      let currentY = 166;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("1. EXECUTIVE DIAGNOSTIC SYNTHESIS & OPERATIONAL NARRATIVE", leftMargin, currentY);

      currentY += 8;
      const narrativeText = detailedPerformance.narrative?.executiveSummary || "Performance evaluation calculated across benchmarked SLA metrics.";
      const narrativeLines = doc.splitTextToSize(narrativeText, usableWidth - 28);
      const lineHeight = 11;
      const narrativeBoxHeight = Math.max(40, narrativeLines.length * lineHeight + 16);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(leftMargin, currentY, usableWidth, narrativeBoxHeight, 6, 6, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(leftMargin, currentY, usableWidth, narrativeBoxHeight, 6, 6, "S");

      // Left blue vertical accent strip
      doc.setFillColor(37, 99, 235);
      doc.rect(leftMargin, currentY + 3, 3.5, narrativeBoxHeight - 6, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      let textY = currentY + 13;
      narrativeLines.forEach((line) => {
        doc.text(line, leftMargin + 14, textY);
        textY += lineHeight;
      });

      currentY += narrativeBoxHeight + 14;

      // 4. Section 2: Weighted Core Pillars Evaluation Scorecard (Table)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("2. WEIGHTED 4-PILLAR CORE PERFORMANCE SCORECARD", leftMargin, currentY);

      currentY += 6;

      const pillarRows = [
        [
          "1. Task Completion Rate",
          "40%",
          `${detailedPerformance.completionRate}% (${detailedPerformance.completed} of ${detailedPerformance.total} tasks resolved)`,
          `+${detailedPerformance.pillars.taskCompletion.points} / 40`,
          detailedPerformance.completionRate >= 80 ? "EXCELLENT" : (detailedPerformance.completionRate >= 60 ? "ACCEPTABLE" : "NEEDS FOCUS"),
        ],
        [
          "2. On-Time Delivery Discipline",
          "25%",
          `${detailedPerformance.onTimeRate}% deliverable timeliness SLA`,
          `+${detailedPerformance.pillars.onTimeDelivery.points} / 25`,
          detailedPerformance.onTimeRate >= 80 ? "EXCELLENT" : (detailedPerformance.onTimeRate >= 65 ? "ACCEPTABLE" : "NEEDS FOCUS"),
        ],
        [
          "3. Shift Attendance & Punctuality",
          "20%",
          `${detailedPerformance.attendance.disciplineRate}% discipline index (${detailedPerformance.attendance.present} Present, ${detailedPerformance.attendance.halfday} Half, ${detailedPerformance.attendance.late} Late, ${detailedPerformance.attendance.absent} Absent)`,
          `+${detailedPerformance.pillars.attendance.points} / 20`,
          detailedPerformance.attendance.disciplineRate >= 85 ? "EXCELLENT" : (detailedPerformance.attendance.disciplineRate >= 70 ? "ACCEPTABLE" : "NEEDS FOCUS"),
        ],
        [
          "4. Time Tracking / Utilization",
          "15%",
          `${detailedPerformance.timeUtilRate}% (${detailedPerformance.trackedHoursLabel} logged execution)`,
          `+${detailedPerformance.pillars.timeUtilization.points} / 15`,
          detailedPerformance.timeUtilRate >= 75 ? "EXCELLENT" : "ACCEPTABLE",
        ],
      ];

      if (detailedPerformance.pillars.overduePenalty.points > 0) {
        pillarRows.push([
          "Overdue Deliverable Deductions",
          "Penalty",
          `${detailedPerformance.overdue} task(s) past SLA deadline`,
          `-${detailedPerformance.pillars.overduePenalty.points} pts`,
          "CRITICAL PENALTY",
        ]);
      }

      autoTable(doc, {
        startY: currentY,
        head: [["Performance Pillar & Scope", "Weight", "Measured Operational Metric", "Points Earned", "Benchmark Status"]],
        body: pillarRows,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          halign: "left",
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 135 },
          1: { halign: "center", cellWidth: 45 },
          2: { cellWidth: 185 },
          3: { fontStyle: "bold", halign: "center", cellWidth: 70 },
          4: { halign: "center", cellWidth: 96 },
        },
        margin: { left: leftMargin, right: leftMargin },
      });

      currentY = doc.lastAutoTable.finalY + 14;

      // 5. Section 3: Operational Deliverables & Task Status Distribution (4 Metric Cards)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`3. OPERATIONAL DELIVERABLES DISTRIBUTION (${detailedPerformance.timeframeLabel.toUpperCase()})`, leftMargin, currentY);

      currentY += 8;
      const statusCardW = (usableWidth - 30) / 4;
      const statusCardH = 46;
      const statusItems = [
        { label: "Completed", count: detailedPerformance.completed, pct: detailedPerformance.completionRate, bg: [240, 253, 244], border: [187, 247, 208], color: [21, 128, 61] },
        { label: "In Progress", count: detailedPerformance.inProgress, pct: detailedPerformance.total ? Math.round((detailedPerformance.inProgress / detailedPerformance.total) * 100) : 0, bg: [240, 249, 255], border: [186, 230, 253], color: [3, 105, 161] },
        { label: "Pending", count: detailedPerformance.pending, pct: detailedPerformance.total ? Math.round((detailedPerformance.pending / detailedPerformance.total) * 100) : 0, bg: [255, 251, 235], border: [253, 230, 138], color: [180, 83, 9] },
        { label: "Overdue", count: detailedPerformance.overdue, pct: detailedPerformance.total ? Math.round((detailedPerformance.overdue / detailedPerformance.total) * 100) : 0, bg: [254, 242, 242], border: [254, 202, 202], color: [185, 28, 28] },
      ];

      statusItems.forEach((st, idx) => {
        const x = leftMargin + (idx * (statusCardW + 10));
        doc.setFillColor(st.bg[0], st.bg[1], st.bg[2]);
        doc.roundedRect(x, currentY, statusCardW, statusCardH, 6, 6, "F");
        doc.setDrawColor(st.border[0], st.border[1], st.border[2]);
        doc.roundedRect(x, currentY, statusCardW, statusCardH, 6, 6, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(st.color[0], st.color[1], st.color[2]);
        doc.text(st.label, x + 8, currentY + 14);

        doc.setFontSize(14);
        doc.text(String(st.count), x + 8, currentY + 32);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${st.pct}% share`, x + statusCardW - 8, currentY + 32, { align: "right" });
      });

      currentY += statusCardH + 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`*Evaluated Total: ${detailedPerformance.total} deliverables. Timeliness SLA compliance is currently at ${detailedPerformance.onTimeRate}%.`, leftMargin, currentY + 4);

      // =========================================================================
      // PAGE 2: ATTENDANCE AUDIT, 360 DIAGNOSTICS & FORMAL GOVERNANCE
      // =========================================================================
      doc.addPage();

      // Running Header (Page 2)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("CIIS NETWORK · PERFORMANCE AUDIT & DIAGNOSTIC DOSSIER", leftMargin, 26);
      doc.setFont("helvetica", "normal");
      doc.text(`Employee: ${employeeName || "Employee"}  ·  Ref: CIIS-PERF-${currentYear}`, pageWidth - leftMargin, 26, { align: "right" });

      doc.setDrawColor(226, 232, 240);
      doc.line(leftMargin, 32, pageWidth - leftMargin, 32);

      currentY = 46;

      // 6. Section 4: Shift Attendance & Operational Discipline Audit
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("4. SHIFT ATTENDANCE, PUNCTUALITY & DISCIPLINE AUDIT", leftMargin, currentY);

      currentY += 6;
      const attRows = [
        [
          `Total Working Shifts: ${detailedPerformance.attendance.totalWorking}`,
          `Full Clock-In (Present): ${detailedPerformance.attendance.present}`,
          `Half-Day Sessions: ${detailedPerformance.attendance.halfday} (50% credit)`,
        ],
        [
          `Late Clock-Ins: ${detailedPerformance.attendance.late} (-30% SLA penalty)`,
          `Unexcused Absences: ${detailedPerformance.attendance.absent} (0 credit)`,
          `Discipline Reliability Score: ${detailedPerformance.attendance.disciplineRate}%`,
        ],
      ];

      autoTable(doc, {
        startY: currentY,
        body: attRows,
        theme: "grid",
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
          fillColor: [248, 250, 252],
          cellPadding: 5.5,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 177 },
          1: { cellWidth: 177 },
          2: { cellWidth: 177 },
        },
        margin: { left: leftMargin, right: leftMargin },
      });

      currentY = doc.lastAutoTable.finalY + 14;

      // 7. Section 5: Key Demonstrated Strengths & Technical Competencies
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(5, 150, 105);
      doc.text("5. DEMONSTRATED STRENGTHS & CORE COMPETENCIES", leftMargin, currentY);

      currentY += 8;
      const strCardStartY = currentY;
      const strLines = [];
      detailedPerformance.strengths.forEach((s) => {
        const itemText = `• ${s.title}: ${s.desc}`;
        const lines = doc.splitTextToSize(itemText, usableWidth - 28);
        strLines.push(...lines);
      });

      const strBoxHeight = Math.max(38, strLines.length * 11 + 14);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(leftMargin, currentY, usableWidth, strBoxHeight, 6, 6, "F");
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(leftMargin, currentY, usableWidth, strBoxHeight, 6, 6, "S");

      // Left green vertical accent strip
      doc.setFillColor(16, 185, 129);
      doc.rect(leftMargin, currentY + 3, 3.5, strBoxHeight - 6, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61);
      let strY = currentY + 12;
      strLines.forEach((line) => {
        doc.text(line, leftMargin + 14, strY);
        strY += 10.5;
      });

      currentY += strBoxHeight + 14;

      // 8. Section 6: Strategic Growth Focus & Actionable Development Areas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(217, 119, 6);
      doc.text("6. STRATEGIC GROWTH FOCUS & ACTIONABLE DEVELOPMENT AREAS", leftMargin, currentY);

      currentY += 8;
      const impLines = [];
      detailedPerformance.improvements.forEach((imp) => {
        const itemText = `• ${imp.title}: ${imp.desc}`;
        const lines = doc.splitTextToSize(itemText, usableWidth - 28);
        impLines.push(...lines);
      });

      const impBoxHeight = Math.max(38, impLines.length * 11 + 14);
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(leftMargin, currentY, usableWidth, impBoxHeight, 6, 6, "F");
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(leftMargin, currentY, usableWidth, impBoxHeight, 6, 6, "S");

      // Left amber vertical accent strip
      doc.setFillColor(245, 158, 11);
      doc.rect(leftMargin, currentY + 3, 3.5, impBoxHeight - 6, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9);
      let impY = currentY + 12;
      impLines.forEach((line) => {
        doc.text(line, leftMargin + 14, impY);
        impY += 10.5;
      });

      currentY += impBoxHeight + 18;

      // 9. Section 7: Formal Governance, Acknowledgment & Sign-Off Authorization
      doc.setDrawColor(226, 232, 240);
      doc.line(leftMargin, currentY, pageWidth - leftMargin, currentY);
      currentY += 14;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("7. FORMAL GOVERNANCE & SIGN-OFF AUTHORIZATION", leftMargin, currentY);

      currentY += 10;
      const sigBoxW = (usableWidth - 14) / 2;
      const sigBoxH = 78;

      // Employee signature card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(leftMargin, currentY, sigBoxW, sigBoxH, 6, 6, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(leftMargin, currentY, sigBoxW, sigBoxH, 6, 6, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("EMPLOYEE ACKNOWLEDGMENT", leftMargin + 10, currentY + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("I acknowledge receipt and review of this performance assessment.", leftMargin + 10, currentY + 25);
      doc.text("Signature: _________________________________", leftMargin + 10, currentY + 48);
      doc.text(`Employee Name: ${employeeName || "Employee"}   |   Date: ________`, leftMargin + 10, currentY + 64);

      // Management signature card
      const rightSigX = leftMargin + sigBoxW + 14;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(rightSigX, currentY, sigBoxW, sigBoxH, 6, 6, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(rightSigX, currentY, sigBoxW, sigBoxH, 6, 6, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("AUTHORIZED HR & MANAGEMENT ATTESTATION", rightSigX + 10, currentY + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("Validated, calibrated, and recorded in CIIS Enterprise Talent Ledger.", rightSigX + 10, currentY + 25);
      doc.text("Signature: _________________________________", rightSigX + 10, currentY + 48);
      doc.text("Authorized Signatory   |   Designation: ____________   |   Date: ________", rightSigX + 10, currentY + 64);

      // 10. Running Footers on Both Pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.line(leftMargin, pageHeight - 32, pageWidth - leftMargin, pageHeight - 32);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("CIIS Network Enterprise CDS · Official & Confidential Performance Evaluation Dossier · For Authorized Internal Review Only", leftMargin, pageHeight - 20);
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - leftMargin, pageHeight - 20, { align: "right" });
      }

      const sanitizedName = String(employeeName || "Employee").replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`Performance_Evaluation_${sanitizedName}_${perfTimeframe}_${todayStr}.pdf`);
      showToast(`Performance evaluation dossier downloaded (${detailedPerformance.timeframeLabel})!`, "success");
    } catch (err) {
      console.error("Failed to generate PDF performance report:", err);
      showToast("Failed to generate PDF report.", "error");
    }
  };

  const productivityScore = detailedPerformance.finalScore;

  // Comprehensive Month Attendance Logs for Table View
  const allMonthAttendanceLogs = useMemo(() => {
    return calendarDays
      .filter((c) => c.day !== null && c.status !== "UPCOMING" && c.status !== "NO RECORD")
      .map((c) => {
        if (c.record) {
          return {
            ...c.record,
            status: c.status || c.record.status,
            date: c.record.date || c.dateKey,
          };
        }
        return {
          _id: c.dateKey,
          date: c.dateKey,
          status: c.status,
          isGenerated: true,
          shiftName: employee?.shiftName || "General Shift",
          notes: c.status === "ABSENT" ? "Absent (No Clock In recorded)" : c.status === "WEEKEND" ? "Weekly Off" : c.status === "HOLIDAY" ? "Official Holiday" : "--",
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [calendarDays, employee?.shiftName]);

  // Filtered History Log for Table View
  const filteredAttendanceLogs = useMemo(() => {
    if (attFilter === "all") return allMonthAttendanceLogs;
    if (attFilter === "present") return allMonthAttendanceLogs.filter((r) => String(r.status || "").toUpperCase() === "PRESENT");
    if (attFilter === "late") return allMonthAttendanceLogs.filter((r) => String(r.status || "").toUpperCase() === "LATE");
    if (attFilter === "halfday") return allMonthAttendanceLogs.filter((r) => ["HALF DAY", "HALFDAY"].includes(String(r.status || "").toUpperCase()));
    if (attFilter === "absent") return allMonthAttendanceLogs.filter((r) => String(r.status || "").toUpperCase() === "ABSENT");
    if (attFilter === "leave") return allMonthAttendanceLogs.filter((r) => {
      const s = String(r.status || "").toUpperCase();
      return s === "LEAVE" || (s.includes("LEAVE") && s !== "EARLY LEAVE");
    });
    if (attFilter === "holiday") return allMonthAttendanceLogs.filter((r) => String(r.status || "").toUpperCase() === "HOLIDAY");
    return allMonthAttendanceLogs;
  }, [allMonthAttendanceLogs, attFilter]);

  return (
    <div className="company-task-page">
      <div className="company-task-container">
        {/* Breadcrumb Navigation */}
        <nav className="company-task-breadcrumb">
          <span className="breadcrumb-link" onClick={() => navigate("/ciisUser/company-all-task")}>
            <FiHome size={13} /> Employees
          </span>
          <span className="sep">&gt;</span>
          <span className="breadcrumb-link" onClick={() => navigate("/ciisUser/company-all-task")}>{employeeName}</span>
          <span className="sep">&gt;</span>
          <span className="current active">Tasks</span>
        </nav>

        {/* Hero Profile Strip */}
        <section className="company-task-hero">
          <div className="company-task-identity">
            <div className="company-task-avatar" style={{ backgroundColor: getAvatarBg(employeeName) }}>
              {getInitials(employeeName)}
            </div>
            <div className="company-task-id-info">
              <div className="company-task-name-row">
                <h1>{employeeName}</h1>
                <span className="status-pill online"><span className="dot" /> Online</span>
              </div>
              <div className="company-task-role-dept">
                <span>{employeeRole}</span>
                {employeeDept && employeeDept !== "—" && <><span className="bullet">&bull;</span><span>{employeeDept}</span></>}
              </div>
              <div className="company-task-meta">
                {employeeEmail && (
                  <span className="meta-item"><FiMail size={13} /> {employeeEmail}</span>
                )}
                {employeePhone && <span className="meta-item"><FiPhone size={13} /> {employeePhone}</span>}
              </div>
            </div>
          </div>

          <div className="company-task-hero-actions">
            <button
              type="button"
              className="hero-btn-primary"
              onClick={openAssignModal}
            >
              <FiPlus size={15} /> Assign Task
            </button>
            <button
              type="button"
              className="hero-btn-outline"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              title="Export tasks as PDF"
            >
              <FiDownload size={14} /> Export PDF
            </button>
            <button
              type="button"
              className="hero-btn-outline"
              onClick={() => {
                const endpoint = effectiveUserId
                  ? `/export-reports/tasks?userId=${effectiveUserId}&format=xlsx`
                  : '/export-reports/tasks?type=all&format=xlsx';
                const empName = employee?.name || 'Employee';
                const filename = effectiveUserId
                  ? `${empName.replace(/\s+/g, '_')}_Tasks_${new Date().toISOString().slice(0, 10)}.xlsx`
                  : `Company_All_Tasks_${new Date().toISOString().slice(0, 10)}.xlsx`;
                downloadBackendReport(endpoint, filename);
              }}
              title="Export tasks as Excel (.xlsx)"
              style={{ color: '#059669', borderColor: '#10B981' }}
            >
              <FiDownload size={14} /> Export Excel
            </button>
            <button
              type="button"
              className="hero-btn-outline"
              onClick={() => navigate("/ciisUser/company-all-task")}
              title="Back to all employees"
            >
              <FiArrowLeft size={14} /> Back
            </button>
            <button
              type="button"
              className="hero-btn-more"
              onClick={() => navigate("/ciisUser/company-all-task")}
              title="Back to all employees"
            >
              <FiMoreVertical size={16} />
            </button>
          </div>
        </section>

        {/* Sub-Navigation Tabs Strip: Fully Working */}
        <div className="company-task-subnav">
          <button
            type="button"
            className={`subnav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FiBarChart2 size={15} /> Overview
          </button>
          <button
            type="button"
            className={`subnav-item ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <FiCheckSquare size={15} /> Tasks
          </button>
          <button
            type="button"
            className={`subnav-item ${activeTab === "timetracking" ? "active" : ""}`}
            onClick={() => setActiveTab("timetracking")}
          >
            <FiClock size={15} /> Time Tracking
          </button>
          <button
            type="button"
            className={`subnav-item ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            <FiCalendar size={15} /> Attendance
          </button>
          <button
            type="button"
            className={`subnav-item ${activeTab === "performance" ? "active" : ""}`}
            onClick={() => setActiveTab("performance")}
          >
            <FiFolder size={15} /> Performance
          </button>
        </div>

        {error && (
          <div className="company-task-error">
            <FiAlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* ========================================================
            TAB 1: OVERVIEW TAB
            ======================================================== */}
        {activeTab === "overview" && (
          <div className="tab-pane-overview">
            <div className="overview-grid-top">
              {/* Profile Details Card */}
              <div className="overview-card profile-details-card">
                <div className="card-header-line">
                  <h3><FiUser size={16} /> Employee Information</h3>
                  <span className="badge-pill role">{employeeRole}</span>
                </div>
                <div className="info-fields-grid">
                  <div className="field-group">
                    <span className="label">Full Name</span>
                    <strong className="val">{employeeName}</strong>
                  </div>
                  <div className="field-group">
                    <span className="label">Employee ID</span>
                    <strong className="val">{employee?.employeeId || "CIIS-EMP-" + (effectiveUserId ? effectiveUserId.slice(-4) : "001")}</strong>
                  </div>
                  <div className="field-group">
                    <span className="label">Department</span>
                    <strong className="val">{employeeDept}</strong>
                  </div>
                  <div className="field-group">
                    <span className="label">Designation / Role</span>
                    <strong className="val">{employeeRole}</strong>
                  </div>
                  <div className="field-group">
                    <span className="label">Work Email</span>
                    <strong className="val">{employeeEmail || "--"}</strong>
                  </div>
                  <div className="field-group">
                    <span className="label">Contact Phone</span>
                    <strong className="val">{employeePhone || "--"}</strong>
                  </div>
                  <div className="field-group">
                    <span className="label">Joining Date</span>
                    <strong className="val">{formatDate(employee?.dateOfJoining || employee?.createdAt)}</strong>
                  </div>
                  <div className="field-group">
                    <span className="label">Shift</span>
                    <strong className="val">{employee?.shiftName || "Standard General Shift"}</strong>
                  </div>
                </div>
              </div>

              {/* Work Health & Attendance Status */}
              <div className="overview-card work-status-card">
                <div className="card-header-line">
                  <h3><FiZap size={16} /> Work Health & Productivity</h3>
                  <span className={`status-pill ${workSummary?.isClockedIn ? "online" : "offline"}`}>
                    <span className="dot" />
                    {workSummary?.isClockedIn ? "Clocked In" : "Clocked Out"}
                  </span>
                </div>
                <div className="productivity-stat-box">
                  <div className="prod-score-ring">
                    <span className="score-num">{completionRate}%</span>
                    <span className="score-label">Completion</span>
                  </div>
                  <div className="prod-metrics-col">
                    <div className="metric-row">
                      <span>Total Assigned Tasks</span>
                      <strong>{stats.total || tasks.length}</strong>
                    </div>
                    <div className="metric-row">
                      <span>Completed Tasks</span>
                      <strong className="text-green">{stats.completed}</strong>
                    </div>
                    <div className="metric-row">
                      <span>In-Progress Tasks</span>
                      <strong className="text-blue">{stats.inProgress}</strong>
                    </div>
                    <div className="metric-row">
                      <span>Overdue Tasks</span>
                      <strong className="text-red">{stats.overdue}</strong>
                    </div>
                  </div>
                </div>
                <div className="work-hours-strip">
                  <div className="hours-item">
                    <span>Worked Today</span>
                    <strong>{workSummary?.totalClockedLabel || "0m"}</strong>
                  </div>
                  <div className="hours-item">
                    <span>Task Tracked</span>
                    <strong>{workSummary?.trackedTaskLabel || "0m"}</strong>
                  </div>
                  <div className="hours-item">
                    <span>Untracked</span>
                    <strong>{workSummary?.untrackedLabel || "0m"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Task Summary in Overview */}
            <div className="overview-card recent-tasks-card">
              <div className="card-header-line">
                <h3><FiCheckSquare size={16} /> Recent Tasks Snapshot</h3>
                <button type="button" className="btn-link-action" onClick={() => setActiveTab("tasks")}>
                  View All Tasks ({tasks.length}) &rarr;
                </button>
              </div>
              <div className="recent-tasks-list">
                {tasks.slice(0, 5).map((t) => {
                  const s = getDisplayStatus(t);
                  const meta = getStatusMeta(s);
                  return (
                    <div className="recent-task-row" key={t._id}>
                      <span className="task-status-dot" style={{ backgroundColor: meta.color }} />
                      <div className="task-title-group">
                        <span className="rt-title">{t.title || "Untitled Task"}</span>
                        <span className="rt-date">Due: {formatDate(getDueDate(t))}</span>
                      </div>
                      <span className="badge-pill status" style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <p className="empty-subtext">No tasks recorded yet for this employee.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: TASKS TAB (MAIN TASKS MANAGER)
            ======================================================== */}
        {activeTab === "tasks" && (
          <>
            {/* Dashboard metric cards and work summary */}
            <section className="company-dashboard-metrics-clean">
              {/* Row 1: 6 task metric cards + Productivity (This Week) widget */}
              <div className="task-stats-row-with-chart">
                <div className="task-stats-grid-6">
                  <div
                    className={`modern-stat-card ${status === "all" ? "active" : ""}`}
                    onClick={() => { setStatus("all"); setTaskTypeFilter("all"); setPage(1); }}
                  >
                    <div className="stat-icon-box purple"><FiList size={18} /></div>
                    <div className="stat-text">
                      <h3>{stats.total || tasks.length}</h3>
                      <span>Total Tasks</span>
                    </div>
                  </div>

                  <div
                    className={`modern-stat-card ${status === "pending" ? "active" : ""}`}
                    onClick={() => { setStatus(status === "pending" ? "all" : "pending"); setPage(1); }}
                  >
                    <div className="stat-icon-box orange"><FiClock size={18} /></div>
                    <div className="stat-text">
                      <h3>{stats.pending}</h3>
                      <span>Pending</span>
                    </div>
                  </div>

                  <div
                    className={`modern-stat-card ${status === "in-progress" ? "active" : ""}`}
                    onClick={() => { setStatus(status === "in-progress" ? "all" : "in-progress"); setPage(1); }}
                  >
                    <div className="stat-icon-box cyan"><FiActivity size={18} /></div>
                    <div className="stat-text">
                      <h3>{stats.inProgress}</h3>
                      <span>In Progress</span>
                    </div>
                  </div>

                  <div
                    className={`modern-stat-card ${status === "completed" ? "active" : ""}`}
                    onClick={() => { setStatus(status === "completed" ? "all" : "completed"); setPage(1); }}
                  >
                    <div className="stat-icon-box green"><FiCheckCircle size={18} /></div>
                    <div className="stat-text">
                      <h3>{stats.completed}</h3>
                      <span>Completed</span>
                    </div>
                  </div>

                  <div
                    className={`modern-stat-card ${status === "onhold" ? "active" : ""}`}
                    onClick={() => { setStatus(status === "onhold" ? "all" : "onhold"); setPage(1); }}
                  >
                    <div className="stat-icon-box purple"><FiPause size={18} /></div>
                    <div className="stat-text">
                      <h3>{stats.onhold || 0}</h3>
                      <span>On Hold</span>
                    </div>
                  </div>

                  <div
                    className={`modern-stat-card ${status === "overdue" ? "active" : ""}`}
                    onClick={() => { setStatus(status === "overdue" ? "all" : "overdue"); setPage(1); }}
                  >
                    <div className="stat-icon-box red"><FiAlertTriangle size={18} /></div>
                    <div className="stat-text">
                      <h3>{stats.overdue}</h3>
                      <span>Overdue</span>
                    </div>
                  </div>

                  <div className="modern-stat-card">
                    <div className="stat-icon-box purple"><FiPieChart size={18} /></div>
                    <div className="stat-text">
                      <h3>{completionRate}%</h3>
                      <span>Completion Rate</span>
                    </div>
                  </div>
                </div>

                {/* Productivity (This Week) Widget */}
                <div className="modern-productivity-card">
                  <div className="prod-chart-header">
                    <span className="prod-title">Productivity <span className="prod-subtitle">(This Week)</span></span>
                  </div>
                  <div className="prod-chart-bars-wrap">
                    {weeklyProductivity.map((item, idx) => (
                      <div className="prod-chart-col" key={item.day || idx}>
                        <span className="prod-bar-pct">{item.pct}%</span>
                        <div className="prod-bar-rail">
                          <div
                            className={`prod-bar-fill ${item.pct >= 80 ? "high" : item.pct > 0 ? "mid" : "zero"}`}
                            style={{ height: `${item.pct}%` }}
                          />
                        </div>
                        <span className="prod-bar-day">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: 4 summary cards */}
              <div className="work-summary-row-with-timer">
                <div className="work-summary-grid-4">
                  <div className="summary-pill-card">
                    <div className="summary-icon green"><FiClock size={18} /></div>
                    <div className="summary-info">
                      <span>Worked Today</span>
                      <strong>{workSummary?.totalClockedLabel || "0m"}</strong>
                    </div>
                  </div>

                  <div className="summary-pill-card">
                    <div className="summary-icon blue"><FiBarChart2 size={18} /></div>
                    <div className="summary-info">
                      <span>Task Tracked</span>
                      <strong>{workSummary?.trackedTaskLabel || "0m"}</strong>
                    </div>
                  </div>

                  <div className="summary-pill-card">
                    <div className="summary-icon orange"><FiClock size={18} /></div>
                    <div className="summary-info">
                      <div className="untracked-label-with-alert">
                        <span>Untracked</span>
                        <FiAlertTriangle size={13} className="untracked-warning-icon" />
                      </div>
                      <strong>{workSummary?.untrackedLabel || "0m"}</strong>
                    </div>
                  </div>

                  <div className="summary-pill-card">
                    <div className="summary-icon purple"><FiZap size={18} /></div>
                    <div className="summary-info">
                      <span>Productivity</span>
                      <strong>{completionRate > 0 ? `${completionRate}%` : "0%"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Search & Filter Toolbar: Exact Match */}
            <section className="company-task-filter-bar">
              <div className="company-task-search-box">
                <FiSearch size={15} />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search tasks by title, description..."
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                    <FiX size={14} />
                  </button>
                )}
              </div>

              <div className="company-task-filter-group">
                {/* Date range picker */}
                <div className="quick-date-toggle-group">
                  <button
                    type="button"
                    className={`btn-date-toggle ${isAllDatesFilterActive ? "active" : ""}`}
                    onClick={handleSetAllDatesFilter}
                  >
                    All Dates
                  </button>
                  <button
                    type="button"
                    className={`btn-date-toggle ${isTodayFilterActive ? "active" : ""}`}
                    onClick={handleSetTodayFilter}
                  >
                    Today
                  </button>
                </div>

                <div className="company-task-date-inputs">
                  <FiCalendar size={13} className="date-icon" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    title="Start Date"
                  />
                  <span className="date-sep">–</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    title="End Date"
                  />
                  <FiChevronDown size={12} className="dropdown-caret-icon" />
                </div>

                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="filter-select"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                  className="filter-select"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <select
                  value={projectFilter}
                  onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
                  className="filter-select"
                >
                  <option value="all">All Projects</option>
                  {projectOptions.map((project) => <option key={project} value={project}>{project}</option>)}
                </select>

                <select
                  value={clientFilter}
                  onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
                  className="filter-select"
                >
                  <option value="all">All Clients</option>
                  {clientOptions.map((client) => <option key={client} value={client}>{client}</option>)}
                </select>

                <button type="button" className="company-task-more-filters-btn" onClick={handleReset}>
                  <FiFilter size={13} /> More Filters
                </button>
              </div>
            </section>

            {/* Status Filter Pills Bar */}
            <div className="company-task-pills-bar">
              <div className="pills-scroll">
                <button
                  type="button"
                  className={`task-pill ${status === "all" && taskTypeFilter === "all" ? "active" : ""}`}
                  onClick={() => { setStatus("all"); setTaskTypeFilter("all"); setPage(1); }}
                >
                  All <span className="pill-badge">{stats.total || tasks.length}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill pending ${status === "pending" ? "active" : ""}`}
                  onClick={() => { setStatus(status === "pending" ? "all" : "pending"); setTaskTypeFilter("all"); setPage(1); }}
                >
                  Pending <span className="pill-badge">{stats.pending}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill in-progress ${status === "in-progress" ? "active" : ""}`}
                  onClick={() => { setStatus(status === "in-progress" ? "all" : "in-progress"); setTaskTypeFilter("all"); setPage(1); }}
                >
                  In Progress <span className="pill-badge">{stats.inProgress}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill completed ${status === "completed" ? "active" : ""}`}
                  onClick={() => { setStatus(status === "completed" ? "all" : "completed"); setTaskTypeFilter("all"); setPage(1); }}
                >
                  Completed <span className="pill-badge">{stats.completed}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill onhold ${status === "onhold" ? "active" : ""}`}
                  onClick={() => { setStatus(status === "onhold" ? "all" : "onhold"); setTaskTypeFilter("all"); setPage(1); }}
                >
                  On Hold <span className="pill-badge">{stats.onhold || 0}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill overdue ${status === "overdue" ? "active" : ""}`}
                  onClick={() => { setStatus(status === "overdue" ? "all" : "overdue"); setTaskTypeFilter("all"); setPage(1); }}
                >
                  Overdue <span className="pill-badge">{stats.overdue}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill personal ${taskTypeFilter === "personal" ? "active" : ""}`}
                  onClick={() => { setTaskTypeFilter(taskTypeFilter === "personal" ? "all" : "personal"); setStatus("all"); setPage(1); }}
                >
                  Personal <span className="pill-badge">{personalTasksCount || 0}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill project ${taskTypeFilter === "project" ? "active" : ""}`}
                  onClick={() => { setTaskTypeFilter(taskTypeFilter === "project" ? "all" : "project"); setStatus("all"); setPage(1); }}
                >
                  Project <span className="pill-badge">{projectTasksCount || 0}</span>
                </button>
                <button
                  type="button"
                  className={`task-pill client ${taskTypeFilter === "client" ? "active" : ""}`}
                  onClick={() => { setTaskTypeFilter(taskTypeFilter === "client" ? "all" : "client"); setStatus("all"); setPage(1); }}
                >
                  Client <span className="pill-badge">{clientTasksCount || 0}</span>
                </button>
              </div>

              <div className="pills-right">
                <div className="pills-dropdown-pair">
                  <span className="group-label">Group by:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="pills-select-inline"
                  >
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="date">Due Date</option>
                  </select>
                </div>

                <div className="pills-dropdown-pair">
                  <span className="group-label">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pills-select-inline"
                  >
                    <option value="priority">Priority</option>
                    <option value="date">Due Date</option>
                    <option value="title">Title</option>
                  </select>
                </div>

                <div className="layout-view-toggle">
                  <button
                    type="button"
                    className={`btn-view-toggle ${taskViewLayout === "list" ? "active" : ""}`}
                    onClick={() => setTaskViewLayout("list")}
                    title="List View"
                  >
                    <FiList size={14} />
                  </button>
                  <button
                    type="button"
                    className={`btn-view-toggle ${taskViewLayout === "grid" ? "active" : ""}`}
                    onClick={() => setTaskViewLayout("grid")}
                    title="Grid View"
                  >
                    <FiGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grouped Task Sections */}
            <section className="company-task-sections">
              {loading && tasks.length === 0 ? (
                <div className="company-task-loading">Loading tasks...</div>
              ) : taskGroups.length === 0 ? (
                <div className="company-task-empty">
                  <FiList size={34} />
                  <h3>No tasks found</h3>
                  <p>There are no tasks matching your selected filters for this day.</p>
                  <button type="button" className="btn-outline-sm" onClick={handleSetAllDatesFilter}>
                    View All Dates
                  </button>
                </div>
              ) : (
                taskGroups.map((group) => (
                  <div className="task-group-section" key={group.key}>
                    <div className="task-group-header">
                      <span className="group-dot" style={{ backgroundColor: group.color }} />
                      <h3>{group.label} ({group.tasks.length})</h3>
                    </div>

                    <div className="task-items-list">
                      {group.tasks.map((task) => {
                        const dispStatus = getDisplayStatus(task);
                        const meta = getStatusMeta(dispStatus);
                        const isTaskEditable = canEditTask(task);
                        const details = taskDetailsById[task._id] || {
                          remarks: Array.isArray(task.remarks) ? task.remarks : [],
                          activityLogs: Array.isArray(task.activityLogs) ? task.activityLogs : [],
                          loading: false,
                        };
                        const checkpoints = Array.isArray(task.checkpoints) ? task.checkpoints : [];
                        const completedCP = checkpoints.filter((c) => c.completed).length;
                        const totalCP = checkpoints.length;
                        const progressPct =
                          totalCP > 0
                            ? Math.round((completedCP / totalCP) * 100)
                            : dispStatus === "completed"
                              ? 100
                              : dispStatus === "in-progress"
                                ? 30
                                : 0;
                        const isCPExpanded = Boolean(expandedCheckpoints[task._id]);

                        // Dynamic calculation of time spent (from task.workTime, task.timeSpent, task.timeTracking, or activityLogs/completionDate)
                        let rawSeconds = Number(task.workTime?.seconds ?? (task.timeSpent || task.timeTracking?.totalSeconds || 0));
                        if (task.workTime?.seconds == null && rawSeconds === 0 && (dispStatus === 'completed' || task.status === 'completed' || task.completionDate)) {
                          const compDate = task.completionDate ? new Date(task.completionDate) : (task.completedAt ? new Date(task.completedAt) : null);
                          if (compDate && !isNaN(compDate.getTime())) {
                            const logs = Array.isArray(task.activityLogs) ? task.activityLogs : [];
                            const startLog = logs.find(l => {
                              const desc = String(l.description || l.details || l.remark || l.remarks || '').toLowerCase();
                              return desc.includes('start') || desc.includes('working') || desc.includes('progress');
                            });
                            const startDate = (startLog ? new Date(startLog.performedAt || startLog.createdAt || startLog.changedAt || startLog.timestamp || 0) : null) || (task.createdAt ? new Date(task.createdAt) : null);
                            if (startDate && !isNaN(startDate.getTime()) && compDate.getTime() > startDate.getTime()) {
                              rawSeconds = Math.max(0, Math.floor((compDate.getTime() - startDate.getTime()) / 1000));
                            }
                          }
                        }
                        const timeSpentStr = rawSeconds > 0
                          ? `${String(Math.floor(rawSeconds / 3600)).padStart(2, "0")}:${String(Math.floor((rawSeconds % 3600) / 60)).padStart(2, "0")}:${String(rawSeconds % 60).padStart(2, "0")}`
                          : (task.workTime?.label || "00:00:00");

                        // Dynamic duration badge (from task duration, tracking, or start-to-due range)
                        const getTimeEstimateBadge = () => {
                          if (task.estimatedDuration) return String(task.estimatedDuration);
                          if (task.estimatedTime) return String(task.estimatedTime);
                          if (task.duration) return String(task.duration);
                          if (rawSeconds > 0) {
                            const hrs = Math.floor(rawSeconds / 3600);
                            const mins = Math.floor((rawSeconds % 3600) / 60);
                            if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
                            if (hrs > 0) return `${hrs}h`;
                            if (mins > 0) return `${mins}m`;
                            return `${rawSeconds}s`;
                          }
                          if (task.dueDateTime && (task.createdAt || task.startDate)) {
                            const start = new Date(task.startDate || task.createdAt).getTime();
                            const end = new Date(task.dueDateTime).getTime();
                            const diffMins = Math.round((end - start) / (1000 * 60));
                            if (diffMins > 0 && diffMins < 60 * 24 * 30) {
                              const hrs = Math.floor(diffMins / 60);
                              const mins = diffMins % 60;
                              if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
                              if (hrs > 0) return `${hrs}h`;
                              if (mins > 0) return `${mins}m`;
                            }
                          }
                          return "--";
                        };
                        const timeEstimateBadge = getTimeEstimateBadge();

                        return (
                          <div
                            className={`task-row-card ${dispStatus}`}
                            key={task._id}
                            style={{ "--status-accent": meta.color }}
                          >
                            <div className="task-status-bar" />

                            <div className="task-row-body">
                              <div className="task-row-top">
                                <div className="task-row-left-area">
                                  <label className="task-checkbox-wrap">
                                    <input
                                      type="checkbox"
                                      checked={dispStatus === "completed"}
                                      onChange={() =>
                                        handleTaskStatusChange(task, dispStatus === "completed" ? "pending" : "completed")
                                      }
                                    />
                                    <span className="task-checkbox-custom" />
                                  </label>

                                  <div className="task-title-wrap">
                                    <div className="title-line">
                                      <h4 className="task-title" onClick={() => handleOpenTaskDetails(task)}>
                                        {task.title || "Untitled Task"}
                                      </h4>
                                      <FiExternalLink size={12} className="link-icon" onClick={() => handleOpenTaskDetails(task)} />
                                    </div>

                                    <div className="task-row-badges">
                                      <span className="badge-pill status" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                                        <span className="pri-dot" style={{ backgroundColor: meta.color }} /> {meta.label}
                                      </span>
                                      {getProjectName(task) ? (
                                        <span className="badge-pill project" title={`Project: ${getProjectName(task)}`}>
                                          <FiFolder size={11} /> Project: {getProjectName(task)}
                                        </span>
                                      ) : getClientName(task) ? (
                                        <span className="badge-pill client" title={`Client: ${getClientName(task)}${task.service ? ` (${task.service})` : ""}`}>
                                          <FiUser size={11} /> Client: {getClientName(task)}
                                        </span>
                                      ) : (
                                        <span className="badge-pill source">
                                          <FiUser size={11} /> {getTaskType(task) === "assigned" ? "Assigned" : "Personal"}
                                        </span>
                                      )}
                                      <span className="badge-pill date">
                                        <FiCalendar size={11} /> {getDueDate(task) ? formatDate(getDueDate(task)) : "No due date"}
                                      </span>
                                      <span className="badge-pill duration">
                                        <FiClock size={11} /> {timeEstimateBadge}
                                      </span>
                                      <span className={`badge-pill priority ${typeof task.priority === "string" ? task.priority.toLowerCase() : "medium"}`}>
                                        <span className="pri-dot" /> {resolveDisplayString(task.priority, "Medium")}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Center Area: Assignee Chip & Progress Bar */}
                                <div className="task-row-center-area">
                                  {/* Assignee */}
                                  <div className="task-assignee-chip">
                                    <div className="chip-avatar" style={{ backgroundColor: getAvatarBg(employeeName) }}>
                                      {getInitials(employeeName)}
                                    </div>
                                    <div className="chip-info">
                                      <span className="chip-name">{employeeName}</span>
                                      <span className="chip-role">{employeeRole}</span>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="task-progress-block">
                                    <div className="progress-labels">
                                      <span>Task Progress</span>
                                      <strong>{progressPct}%</strong>
                                    </div>
                                    <div className="progress-track">
                                      <div
                                        className="progress-fill"
                                        style={{
                                          width: `${progressPct}%`,
                                          backgroundColor: progressPct >= 80 ? "#10b981" : progressPct > 0 ? "#0284c7" : "#e2e8f0",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Right Area: Time Spent & Actions */}
                                <div className="task-row-right-area">
                                  {/* Time spent */}
                                  <div className="task-time-spent-block">
                                    <span className="time-label">Time Spent</span>
                                    <div className="time-val">
                                      <FiClock size={12} />
                                      <span>{timeSpentStr}</span>
                                    </div>
                                  </div>

                                  {/* Right action buttons */}
                                  <div className="task-right-actions">
                                    {isTaskEditable && (
                                      <button
                                        type="button"
                                        className="btn-edit-task-action"
                                        onClick={() => openEditModal(task)}
                                        title="Edit Task"
                                      >
                                        <FiEdit2 size={13} /> Edit
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Split Row: Description on Left, Meta Links on Right */}
                              <div className="task-row-bottom-split">
                                <div className="task-row-bottom-left">
                                  <p className="task-desc">{task.description || task.title || "—"}</p>
                                </div>

                                <div className="task-row-bottom-right">
                                  <button
                                    type="button"
                                    className="meta-tag-btn"
                                    onClick={() => openRemarksModal(task, details.remarks)}
                                  >
                                    <FiMessageSquare size={13} /> {details.remarks?.length || 0} {(details.remarks?.length || 0) === 1 ? "Remark" : "Remarks"}
                                  </button>

                                  <button
                                    type="button"
                                    className="meta-tag-btn"
                                    onClick={() => openActivityModal(task, details.activityLogs)}
                                  >
                                    <FiClock size={13} /> {details.activityLogs?.length || 0} Activities
                                  </button>

                                  {totalCP > 0 && (
                                    <button
                                      type="button"
                                      className="meta-tag-btn toggle-cp"
                                      onClick={() => toggleCheckpoints(task._id)}
                                      title="Toggle Subtasks Checklist"
                                    >
                                      <FiCheckSquare size={13} />
                                      <span>{completedCP}/{totalCP} Subtasks</span>
                                      {isCPExpanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn-view-details-pill"
                                    onClick={() => handleOpenTaskDetails(task)}
                                    title="View full task details"
                                  >
                                    <FiEye size={13} />
                                    <span>View Details</span>
                                  </button>

                                  {isTaskEditable && (
                                    <select
                                      className="quick-status-changer"
                                      value={dispStatus}
                                      disabled={savingTaskId === task._id}
                                      onChange={(e) => handleTaskStatusChange(task, e.target.value)}
                                    >
                                      {STATUS_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>

                              {/* Expandable Checkpoints Panel */}
                              {isCPExpanded && totalCP > 0 && (
                                <div className="task-checkpoints-panel">
                                  <div className="cp-panel-head">
                                    <h5>Checkpoints & Deliverables</h5>
                                    <span>{completedCP} of {totalCP} completed</span>
                                  </div>
                                  {isTaskEditable && !canToggleCheckpoint(task) && <small>Checkpoints can be updated while the task is In Progress.</small>}
                                  <div className="cp-checklist">
                                    {checkpoints.map((cp, idx) => (
                                      <label className={`cp-item ${cp.completed ? "completed" : ""}`} key={cp._id || idx}>
                                        <input
                                          type="checkbox"
                                          checked={Boolean(cp.completed)}
                                          disabled={!canToggleCheckpoint(task) || Boolean(savingTaskId) || !(cp._id || cp.id)}
                                          onChange={() => handleCheckpointToggle(task, cp)}
                                        />
                                        <span>{cp.title || "Deliverable"}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Pagination */}
            {total > 0 && (
              <div className="company-task-pagination-wrap" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: '#ffffff', padding: '12px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span>
                    Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> tasks
                  </span>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', color: '#1e293b', cursor: 'pointer' }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="company-task-pagination" style={{ margin: 0 }}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FiChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    Page {page} of {Math.max(1, totalPages)}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Next <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================
            TAB 3: TIME TRACKING TAB
            ======================================================== */}
        {activeTab === "timetracking" && (
          <div className="tab-pane-timetracking">
            <div className="timetrack-metrics-strip">
              <div className="time-stat-box green">
                <FiClock size={20} />
                <div>
                  <span className="lbl">Total Worked Today</span>
                  <h3>{workSummary?.totalClockedLabel || "0m"}</h3>
                </div>
              </div>
              <div className="time-stat-box blue">
                <FiBarChart2 size={20} />
                <div>
                  <span className="lbl">Task Tracked Hours</span>
                  <h3>{workSummary?.trackedTaskLabel || "0m"}</h3>
                </div>
              </div>
              <div className="time-stat-box orange">
                <FiAlertTriangle size={20} />
                <div>
                  <span className="lbl">Untracked Hours</span>
                  <h3>{workSummary?.untrackedLabel || "0m"}</h3>
                </div>
              </div>
              <div className="time-stat-box purple">
                <FiZap size={20} />
                <div>
                  <span className="lbl">Current Clock Status</span>
                  <h3>{workSummary?.isClockedIn ? "Clocked In" : "Clocked Out"}</h3>
                </div>
              </div>
            </div>

            <div className="overview-card time-table-card">
              <div className="card-header-line">
                <h3><FiClock size={16} /> Task Time Log Breakdown</h3>
                <span className="badge-pill source">Today's Summary</span>
              </div>
              <div className="timetrack-table-wrapper">
                <table className="modern-data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Task Title</th>
                      <th>Source</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Time Logged</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t, idx) => {
                      const s = getDisplayStatus(t);
                      const meta = getStatusMeta(s);
                      const hasTime = Number(t.workTime?.seconds) > 0;
                      return (
                        <tr key={t._id}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{t.title || "Untitled"}</strong>
                          </td>
                          <td>
                            {getProjectName(t) ? (
                              <span className="badge-pill project" title={`Project: ${getProjectName(t)}`}>
                                <FiFolder size={11} /> {getProjectName(t)}
                              </span>
                            ) : getClientName(t) ? (
                              <span className="badge-pill client" title={`Client: ${getClientName(t)}`}>
                                <FiUser size={11} /> {getClientName(t)}
                              </span>
                            ) : (
                              <span className="badge-pill source">{getTaskType(t) === "assigned" ? "Assigned" : "Personal"}</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge-pill priority ${t.priority || "medium"}`}>
                              {(t.priority || "medium").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="badge-pill status" style={{ backgroundColor: meta.bg, color: meta.color }}>
                              {meta.label}
                            </span>
                          </td>
                          <td>
                            <strong className={hasTime ? "text-blue" : "text-muted"}>
                              {hasTime ? t.workTime.label : "No time logged"}
                            </strong>
                          </td>
                          <td>{formatDate(getDueDate(t))}</td>
                        </tr>
                      );
                    })}
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">No task time entries found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: ATTENDANCE TAB (Interactive Calendar View + Details)
            ======================================================== */}
        {activeTab === "attendance" && (
          <div className="tab-pane-attendance">
            {/* Top Attendance Month Stats KPI Cards */}
            <div className="att-kpi-summary-strip">
              <div className="att-kpi-card att-kpi-present">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap emerald">
                    <FiCheckCircle size={20} />
                  </div>
                  <span className="att-kpi-badge emerald">{monthStats.attendanceRate}% Rate</span>
                </div>
                <div className="att-kpi-value">{monthStats.present}</div>
                <div className="att-kpi-title">Present Days</div>
                <span className="att-kpi-hint">Full working days attended</span>
                <div className="att-kpi-progress-bar" title={`Attendance rate: ${monthStats.attendanceRate}%`}>
                  <div
                    className="att-kpi-progress-fill emerald"
                    style={{ width: `${Math.min(100, Math.max(0, monthStats.attendanceRate))}%` }}
                  />
                </div>
              </div>

              <div className="att-kpi-card att-kpi-late">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap amber">
                    <FiClock size={20} />
                  </div>
                  {monthStats.late > 0 && <span className="att-kpi-badge amber">{monthStats.late} Flags</span>}
                </div>
                <div className="att-kpi-value">{monthStats.late}</div>
                <div className="att-kpi-title">Late</div>
                <span className="att-kpi-hint">Clocked in after shift start</span>
              </div>

              <div className="att-kpi-card att-kpi-halfday">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap gold">
                    <FiPieChart size={20} />
                  </div>
                  <span className="att-kpi-badge gold">0.5 Day</span>
                </div>
                <div className="att-kpi-value">{monthStats.halfday}</div>
                <div className="att-kpi-title">Half Days</div>
                <span className="att-kpi-hint">Partial shifts recorded</span>
              </div>

              <div className="att-kpi-card att-kpi-absent">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap rose">
                    <FiXCircle size={20} />
                  </div>
                  {monthStats.absent > 0 && <span className="att-kpi-badge rose">{monthStats.absent} Days</span>}
                </div>
                <div className="att-kpi-value">{monthStats.absent}</div>
                <div className="att-kpi-title">Absent Days</div>
                <span className="att-kpi-hint">No Clock In or leave applied</span>
              </div>

              <div className="att-kpi-card att-kpi-leave">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap violet">
                    <FiCalendar size={20} />
                  </div>
                  <span className="att-kpi-badge violet">Approved</span>
                </div>
                <div className="att-kpi-value">{monthStats.leave}</div>
                <div className="att-kpi-title">Approved Leaves</div>
                <span className="att-kpi-hint">Leave applications sanctioned</span>
              </div>

              <div className="att-kpi-card att-kpi-holiday">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap blue">
                    <FiAward size={20} />
                  </div>
                  <span className="att-kpi-badge blue">Company Off</span>
                </div>
                <div className="att-kpi-value">{monthStats.holiday}</div>
                <div className="att-kpi-title">Holidays</div>
                <span className="att-kpi-hint">Official company holidays</span>
              </div>
            </div>

            {/* Attendance Navigation & Controls Bar */}
            <div className="att-control-toolbar">
              <div className="att-month-navigator">
                <button
                  type="button"
                  className="att-nav-arrow-btn"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  disabled={attendanceLoading}
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className="att-current-month-display">
                  <FiCalendar size={17} className="text-primary" />
                  <span>{MONTH_NAMES[calDate.getMonth()]} {calDate.getFullYear()}</span>
                </div>
                <button
                  type="button"
                  className="att-nav-arrow-btn"
                  onClick={handleNextMonth}
                  title="Next Month"
                  disabled={attendanceLoading}
                >
                  <FiChevronRight size={18} />
                </button>
                <button
                  type="button"
                  className="att-today-pill-btn"
                  onClick={handleJumpToToday}
                  disabled={attendanceLoading}
                >
                  Jump to Today
                </button>
              </div>

              {/* View Switch & Actions */}
              <div className="att-toolbar-right">
                <div className="att-view-mode-toggle">
                  <button
                    type="button"
                    className={`att-mode-btn ${attViewMode === "calendar" ? "active" : ""}`}
                    onClick={() => setAttViewMode("calendar")}
                  >
                    <FiGrid size={15} /> Calendar View
                  </button>
                  <button
                    type="button"
                    className={`att-mode-btn ${attViewMode === "table" ? "active" : ""}`}
                    onClick={() => setAttViewMode("table")}
                  >
                    <FiList size={15} /> History Log
                  </button>
                </div>

                <button
                  type="button"
                  className="att-refresh-btn"
                  onClick={() => fetchAttendance(calDate)}
                  disabled={attendanceLoading}
                  title="Reload Attendance"
                >
                  <FiRefreshCw size={14} className={attendanceLoading ? "spin-icon" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {attendanceLoading ? (
              <div className="company-task-loading">
                <FiRefreshCw className="spin-icon" size={24} />
                <span>Loading employee attendance records...</span>
              </div>
            ) : attendanceError ? (
              <div className="company-task-error">{attendanceError}</div>
            ) : attViewMode === "calendar" ? (
              /* CALENDAR + INSPECTOR SPLIT VIEW */
              <div className="attendance-split-layout">
                {/* Left: Modern High-Impact Calendar */}
                <div className="att-calendar-panel">
                  {/* Legend Ribbon */}
                  <div className="att-legend-ribbon">
                    <div className="legend-chip present"><span className="dot" /> Present</div>
                    <div className="legend-chip late"><span className="dot" /> Late</div>
                    <div className="legend-chip halfday"><span className="dot" /> Half-Day</div>
                    <div className="legend-chip absent"><span className="dot" /> Absent</div>
                    <div className="legend-chip leave"><span className="dot" /> Leave</div>
                    <div className="legend-chip holiday"><span className="dot" /> Holiday</div>
                    <div className="legend-chip weekend"><span className="dot" /> Weekend</div>
                  </div>

                  {/* Calendar Grid Container */}
                  <div className="att-modern-calendar-grid">
                    <div className="cal-col-header weekend">Sun</div>
                    <div className="cal-col-header">Mon</div>
                    <div className="cal-col-header">Tue</div>
                    <div className="cal-col-header">Wed</div>
                    <div className="cal-col-header">Thu</div>
                    <div className="cal-col-header">Fri</div>
                    <div className="cal-col-header weekend">Sat</div>

                    {calendarDays.map((cell, idx) => {
                      if (!cell.day) {
                        return <div className="att-cell-placeholder" key={`empty-${idx}`} />;
                      }

                      const s = String(cell.status || "NO RECORD").toUpperCase();
                      const isPres = s === "PRESENT";
                      const isLate = s === "LATE";
                      const isHalf = s === "HALF DAY" || s === "HALFDAY";
                      const isAbs = s === "ABSENT";
                      const isLev = s === "LEAVE" || (s.includes("LEAVE") && s !== "EARLY LEAVE");
                      const isHol = s === "HOLIDAY";
                      const isWknd = s === "WEEKEND";
                      const isUpc = s === "UPCOMING";
                      const isSelected = selectedDayRecord && getDateInputValue(new Date(selectedDayRecord.date)) === cell.dateKey;

                      const statusClass = isPres ? "status-present" :
                        isLate ? "status-late" :
                          isHalf ? "status-halfday" :
                            isAbs ? "status-absent" :
                              isLev ? "status-leave" :
                                isHol ? "status-holiday" :
                                  isWknd ? "status-weekend" :
                                    isUpc ? "status-upcoming" : "status-none";

                      return (
                        <div
                          key={cell.dateKey || idx}
                          className={`att-day-cell ${cell.isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${statusClass}`}
                          onClick={() => {
                            if (cell.record) {
                              setSelectedDayRecord(cell.record);
                            } else {
                              setSelectedDayRecord({
                                date: cell.dateKey,
                                status: cell.status,
                                holidayName: cell.holidayName,
                                isGenerated: true,
                              });
                            }
                          }}
                        >
                          <div className="att-cell-header">
                            <span className="att-cell-day-num">{String(cell.day).padStart(2, "0")}</span>
                            {cell.isToday && <span className="att-today-badge">TODAY</span>}
                          </div>

                          <div className="att-cell-status-container">
                            <span className={`att-cell-status-pill ${statusClass}`}>
                              <span className="att-status-dot" />
                              {isPres ? "Present" :
                                isLate ? "Late" :
                                  isHalf ? "Half Day" :
                                    isAbs ? "Absent" :
                                      isLev ? "Leave" :
                                        isHol ? "Holiday" :
                                          isWknd ? "Weekend" :
                                            isUpc ? "Upcoming" : "No Log"}
                            </span>
                          </div>

                          {isHol ? (
                            <div className="att-cell-holiday-title" title={`Official Holiday: ${cell.holidayName || "Company Holiday"}`}>
                              🎉 {cell.holidayName || "Holiday"}
                            </div>
                          ) : (cell.record?.inTime || cell.record?.totalTime) ? (
                            <div className="att-cell-timing-preview">
                              {cell.record?.inTime ? formatTimeOnly(cell.record.inTime) : ""}
                              {cell.record?.outTime ? ` - ${formatTimeOnly(cell.record.outTime)}` : ""}
                              {!cell.record?.outTime && cell.record?.isClockedIn ? " · Clocked In" : ""}
                              {!cell.record?.outTime && cell.record?.totalTime ? ` (${cell.record.totalTime})` : ""}
                            </div>
                          ) : (
                            <div style={{ height: "18px" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Selected Day Inspector & Punch Timeline */}
                <div className="att-inspector-panel">
                  <div className="att-inspector-header">
                    <div>
                      <span className="inspector-eyebrow">Date Inspection</span>
                      <h3 className="inspector-day-title">
                        {selectedDayRecord?.date ? formatDate(selectedDayRecord.date) : "Select a Day"}
                      </h3>
                    </div>

                    {selectedDayRecord && (
                      <span className={`inspector-status-badge ${
                          String(selectedDayRecord.status).toUpperCase() === "PRESENT" ? "present" :
                          String(selectedDayRecord.status).toUpperCase() === "LATE" ? "late" :
                          ["HALF DAY", "HALFDAY"].includes(String(selectedDayRecord.status).toUpperCase()) ? "halfday" :
                          String(selectedDayRecord.status).toUpperCase() === "HOLIDAY" ? "holiday" :
                          (String(selectedDayRecord.status).toUpperCase() === "LEAVE" || String(selectedDayRecord.status).toUpperCase().includes("LEAVE")) ? "leave" :
                          String(selectedDayRecord.status).toUpperCase() === "WEEKEND" ? "weekend" : "absent"
                        }`}>
                        <span className="pulsing-circle" />
                        {String(selectedDayRecord.status).toUpperCase() === "HOLIDAY" && selectedDayRecord.holidayName
                          ? `🎉 ${String(selectedDayRecord.holidayName).toUpperCase()}`
                          : String(selectedDayRecord.status || "ABSENT").toUpperCase()}
                      </span>
                    )}
                  </div>

                  {selectedDayRecord ? (
                    <div className="att-inspector-body">
                      {String(selectedDayRecord.status).toUpperCase() === "HOLIDAY" && (
                        <div className="inspector-holiday-card">
                          <div className="holiday-card-icon">🎉</div>
                          <div className="holiday-card-info">
                            <h4>{selectedDayRecord.holidayName || "Official Company Holiday"}</h4>
                            <p>Official company holiday on this date. Shift timings and check-in requirements are waived.</p>
                          </div>
                        </div>
                      )}

                      {/* Shift & Policy Banner */}
                      <div className="inspector-shift-banner">
                        <FiClock size={15} />
                        <span>Schedule: <strong>{selectedDayRecord.shiftName || employee?.shiftName || "General Shift (09:30 AM - 06:30 PM)"}</strong></span>
                      </div>

                      {/* Visual Clock In/Out Timeline Stepper */}
                      <div className="inspector-flow-timeline">
                        <div className={`flow-step ${selectedDayRecord.inTime ? "completed" : "pending"}`}>
                          <div className="flow-step-circle">
                            <FiCheckCircle size={13} />
                          </div>
                          <div className="flow-step-info">
                            <span className="flow-step-title">Clock In</span>
                            <span className="flow-step-time">{selectedDayRecord.inTime ? formatTimeOnly(selectedDayRecord.inTime) : "No Clock In"}</span>
                          </div>
                        </div>

                        <div className="flow-step-divider">
                          <div className={`flow-divider-line ${selectedDayRecord.outTime ? "completed" : selectedDayRecord.inTime ? "active" : ""}`} />
                          <span className="flow-duration-pill">{selectedDayRecord.totalHours || selectedDayRecord.totalTime || (selectedDayRecord.inTime ? "In progress" : "--")}</span>
                        </div>

                        <div className={`flow-step ${selectedDayRecord.outTime ? "completed" : selectedDayRecord.inTime ? "active" : "pending"}`}>
                          <div className="flow-step-circle">
                            <FiClock size={13} />
                          </div>
                          <div className="flow-step-info">
                            <span className="flow-step-title">Clock Out</span>
                            <span className="flow-step-time">{selectedDayRecord.outTime ? formatTimeOnly(selectedDayRecord.outTime) : (selectedDayRecord.inTime ? "Active Shift" : "--")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Exceptions / Warnings Alert */}
                      {(selectedDayRecord.lateBy || selectedDayRecord.earlyLeave) && (
                        <div className="inspector-exceptions-alert">
                          <FiAlertTriangle size={15} className="text-amber" />
                          <div className="exceptions-alert-content">
                            {selectedDayRecord.lateBy && (
                              <span className="exception-item">Late Arrival: <strong>{selectedDayRecord.lateBy}</strong></span>
                            )}
                            {selectedDayRecord.earlyLeave && (
                              <span className="exception-item">Early Departure: <strong>{selectedDayRecord.earlyLeave}</strong></span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2x2 Clock Timing Metrics */}
                      <div className="inspector-metrics-grid">
                        <div className="inspector-metric-card in">
                          <div className="m-card-top">
                            <span className="m-icon in"><FiCheckCircle size={14} /></span>
                            <span className="m-title">Clock In</span>
                          </div>
                          <div className="m-main-val text-emerald">
                            {selectedDayRecord.inTime ? formatTimeOnly(selectedDayRecord.inTime) : "--"}
                          </div>
                          <span className="m-sub-text">
                            {selectedDayRecord.inTime
                              ? (selectedDayRecord.lateBy ? `Late by ${selectedDayRecord.lateBy}` : "On-Time Arrival")
                              : "No Clock In recorded"}
                          </span>
                        </div>

                        <div className="inspector-metric-card out">
                          <div className="m-card-top">
                            <span className="m-icon out"><FiClock size={14} /></span>
                            <span className="m-title">Clock Out</span>
                          </div>
                          <div className="m-main-val text-blue">
                            {selectedDayRecord.outTime ? formatTimeOnly(selectedDayRecord.outTime) : (selectedDayRecord.inTime ? "Active" : "--")}
                          </div>
                          <span className="m-sub-text">
                            {selectedDayRecord.outTime
                              ? (selectedDayRecord.earlyLeave ? `Early: ${selectedDayRecord.earlyLeave}` : "Standard Out")
                              : (selectedDayRecord.inTime ? "Currently Clocked In" : "No Clock Out recorded")}
                          </span>
                        </div>

                        <div className="inspector-metric-card total">
                          <div className="m-card-top">
                            <span className="m-icon total"><FiActivity size={14} /></span>
                            <span className="m-title">Total Hours</span>
                          </div>
                          <div className="m-main-val text-primary">
                            {selectedDayRecord.totalHours || selectedDayRecord.totalTime || (selectedDayRecord.inTime && selectedDayRecord.outTime ? "Completed" : "--")}
                          </div>
                          <span className="m-sub-text">Effective working duration</span>
                        </div>

                        <div className="inspector-metric-card score">
                          <div className="m-card-top">
                            <span className="m-icon score"><FiAward size={14} /></span>
                            <span className="m-title">Compliance</span>
                          </div>
                          <div className="m-main-val text-purple">
                            {String(selectedDayRecord.status).toUpperCase() === "PRESENT" ? "100%" :
                              String(selectedDayRecord.status).toUpperCase() === "LATE" ? "85%" :
                                ["HALF DAY", "HALFDAY"].includes(String(selectedDayRecord.status).toUpperCase()) ? "50%" :
                                  ["LEAVE", "HOLIDAY", "WEEKEND"].includes(String(selectedDayRecord.status).toUpperCase()) ? "N/A" : "0%"}
                          </div>
                          <span className="m-sub-text">Shift adherence score</span>
                        </div>
                      </div>

                      {/* Notes / Special remarks */}
                      <div className="inspector-notes-section">
                        <div className="notes-header-row">
                          <FiMessageSquare size={14} />
                          <strong>Manager / System Notes</strong>
                        </div>
                        <div className="notes-content-box">
                          {selectedDayRecord.notes ? (
                            <p>{selectedDayRecord.notes}</p>
                          ) : (
                            <p className="empty-notes-hint">No special remarks or exception notes logged for this date.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="inspector-empty-state">
                      <FiCalendar size={40} />
                      <h4>Select Any Date</h4>
                      <p>Click on any date in the calendar to inspect in-time, out-time, shift duration, and exception notes.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TABLE / HISTORY LOG VIEW */
              <div className="att-history-log-panel">
                <div className="att-log-filter-bar">
                  <div className="att-filter-chips">
                    <button
                      type="button"
                      className={`filter-chip ${attFilter === "all" ? "active" : ""}`}
                      onClick={() => setAttFilter("all")}
                    >
                      All ({attendanceRecords.length})
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${attFilter === "present" ? "active" : ""}`}
                      onClick={() => setAttFilter("present")}
                    >
                      Present ({monthStats.present})
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${attFilter === "late" ? "active" : ""}`}
                      onClick={() => setAttFilter("late")}
                    >
                      Late ({monthStats.late})
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${attFilter === "halfday" ? "active" : ""}`}
                      onClick={() => setAttFilter("halfday")}
                    >
                      Half Day ({monthStats.halfday})
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${attFilter === "absent" ? "active" : ""}`}
                      onClick={() => setAttFilter("absent")}
                    >
                      Absent ({monthStats.absent})
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${attFilter === "leave" ? "active" : ""}`}
                      onClick={() => setAttFilter("leave")}
                    >
                      Leaves ({monthStats.leave})
                    </button>
                    <button
                      type="button"
                      className={`filter-chip ${attFilter === "holiday" ? "active" : ""}`}
                      onClick={() => setAttFilter("holiday")}
                    >
                      Holidays ({monthStats.holiday})
                    </button>
                  </div>
                  <span className="log-count-text">Showing {filteredAttendanceLogs.length} entries</span>
                </div>

                <div className="timetrack-table-wrapper">
                  <table className="modern-data-table att-table">
                    <thead>
                      <tr>
                        <th>Date & Day</th>
                        <th>Status</th>
                        <th>Clock In</th>
                        <th>Clock Out</th>
                        <th>Total Duration</th>
                        <th>Shift & Exceptions</th>
                        <th>Notes / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendanceLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted">
                            No attendance records match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredAttendanceLogs.map((rec) => {
                          const s = String(rec.status || "ABSENT").toUpperCase();
                          const isPres = s === "PRESENT";
                          const isLate = s === "LATE";
                          const isHalf = s === "HALF DAY" || s === "HALFDAY";
                          const isLeave = s === "LEAVE" || (s.includes("LEAVE") && s !== "EARLY LEAVE");
                          const isHoliday = s === "HOLIDAY";
                          const isWknd = s === "WEEKEND";

                          const statusClass = isPres ? "present" :
                            isLate ? "late" :
                              isHalf ? "halfday" :
                                isLeave ? "leave" :
                                  isHoliday ? "holiday" :
                                    isWknd ? "weekend" : "absent";

                          return (
                            <tr key={rec._id || rec.date}>
                              <td>
                                <strong>{formatDate(rec.date)}</strong>
                              </td>
                              <td>
                                <span className={`status-badge-att ${statusClass}`}>
                                  ● {isHoliday ? `HOLIDAY${rec.holidayName ? ` · ${rec.holidayName}` : ""}` : s}
                                </span>
                              </td>
                              <td>
                                {rec.inTime ? (
                                  <span className="punch-text in">{formatTimeOnly(rec.inTime)}</span>
                                ) : "--"}
                              </td>
                              <td>
                                {rec.outTime ? (
                                  <span className="punch-text out">{formatTimeOnly(rec.outTime)}</span>
                                ) : "--"}
                              </td>
                              <td>
                                <strong>{rec.totalHours || rec.totalTime || "--"}</strong>
                              </td>
                              <td>
                                {isHoliday ? (
                                  <span
                                    title={rec.holidayName || "Official Holiday"}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      color: "#1d4ed8",
                                      background: "#eff6ff",
                                      border: "1px solid #bfdbfe",
                                      padding: "1px 6px",
                                      borderRadius: "4px",
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                      maxWidth: "150px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap"
                                    }}
                                  >
                                    🎉 {rec.holidayName || "Official Holiday"}
                                  </span>
                                ) : rec.lateBy ? (
                                  <span className="exception-badge late">Late by {rec.lateBy}</span>
                                ) : rec.earlyLeave ? (
                                  <span className="exception-badge early">Early: {rec.earlyLeave}</span>
                                ) : (
                                  <span className="text-muted">{rec.shiftName || "General Shift"}</span>
                                )}
                              </td>
                              <td>
                                <span className="notes-snippet">{rec.notes || "--"}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 5: PERFORMANCE TAB
            ======================================================== */}
        {activeTab === "performance" && (
          <div className="tab-pane-performance">
            {/* Smooth Top Hairline Progress Bar (No Layout Shift) */}
            <div className={`perf-smooth-loader ${perfLoading ? "active" : ""}`} />

            {/* Top Toolbar: Timeframe Filter Switcher & Download Report Button */}
            <div className="perf-toolbar-bar">
              <div className="perf-timeframe-segmented">
                <button
                  type="button"
                  className={`perf-tf-btn ${activeTimeframe === "today" ? "active" : ""}`}
                  onClick={() => setPerfTimeframe("today")}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`perf-tf-btn ${activeTimeframe === "week" ? "active" : ""}`}
                  onClick={() => setPerfTimeframe("week")}
                >
                  This Week
                </button>
                <button
                  type="button"
                  className={`perf-tf-btn ${activeTimeframe === "month" ? "active" : ""}`}
                  onClick={() => setPerfTimeframe("month")}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={`perf-tf-btn ${activeTimeframe === "sixMonths" ? "active" : ""}`}
                  onClick={() => setPerfTimeframe("sixMonths")}
                >
                  Last 6 Months
                </button>
              </div>

              <div className="perf-toolbar-actions">
                <button
                  type="button"
                  className="btn-download-perf-report"
                  onClick={handleDownloadPerformanceReport}
                  title="Download Executive Performance PDF Report"
                  disabled={perfLoading}
                >
                  <FiDownload size={14} />
                  <span>
                    Download Report ({activeTimeframe === "today" ? "Today" : activeTimeframe === "week" ? "Weekly" : activeTimeframe === "month" ? "Monthly" : activeTimeframe === "sixMonths" ? "6-Month" : "Custom"})
                  </span>
                </button>
              </div>
            </div>

            {/* Executive Hero Performance Scorecard */}
            <div className="perf-hero-card">
              <div className="perf-hero-left">
                <div className="perf-gauge-wrap">
                  <svg className="perf-gauge-svg" viewBox="0 0 120 120">
                    <circle
                      className="perf-gauge-bg"
                      cx="60"
                      cy="60"
                      r="50"
                    />
                    <circle
                      className={`perf-gauge-fill ${detailedPerformance.tierColor}`}
                      cx="60"
                      cy="60"
                      r="50"
                      style={{
                        strokeDasharray: 314.16,
                        strokeDashoffset: 314.16 - (314.16 * Math.min(100, Math.max(0, detailedPerformance.finalScore))) / 100,
                      }}
                    />
                  </svg>
                  <div className="perf-gauge-center">
                    <span className="perf-gauge-val">{detailedPerformance.finalScore}</span>
                    <span className="perf-gauge-max">/ 100</span>
                    <span className={`perf-gauge-badge ${detailedPerformance.tierColor}`}>
                      Grade {detailedPerformance.grade}
                    </span>
                  </div>
                </div>
              </div>

              <div className="perf-hero-content">
                <div className="perf-hero-top-row">
                  <div>
                    <span className="perf-hero-eyebrow">Executive Index · {detailedPerformance.timeframeLabel}</span>
                    <h2 className="perf-hero-title">Performance Rating: {detailedPerformance.tier}</h2>
                  </div>
                  <div className="perf-hero-tier-group">
                    <span className={`perf-hero-tier-chip ${detailedPerformance.tierColor}`}>
                      <FiAward size={15} /> Grade {detailedPerformance.grade} · {detailedPerformance.tier}
                    </span>
                    <span className="perf-trajectory-chip">
                      {detailedPerformance.trajectory}
                    </span>
                  </div>
                </div>

                <p className="perf-hero-summary">
                  {detailedPerformance.finalScore >= 85
                    ? "Exceptional delivery cadence with strong punctuality and reliable throughput across assigned deliverables."
                    : detailedPerformance.finalScore >= 70
                    ? "Solid operational execution with consistent delivery. Minor scope for optimization in task turnaround and deadline adherence."
                    : detailedPerformance.finalScore >= 50
                    ? "Moderate delivery pace. Deadline slippage or attendance gaps require proactive tracking to meet benchmark standards."
                    : "Immediate managerial alignment recommended to resolve overdue bottlenecks and improve work attendance consistency."}
                </p>

                {/* Quick Snapshot Metrics Strip */}
                <div className="perf-hero-metrics-strip">
                  <div className="perf-hero-metric-item">
                    <span className="phm-label">Task Completion</span>
                    <strong className="phm-val text-emerald">{detailedPerformance.completionRate}%</strong>
                    <span className="phm-sub">{detailedPerformance.completed} of {detailedPerformance.total} done</span>
                  </div>
                  <div className="perf-hero-metric-item">
                    <span className="phm-label">On-Time Rate</span>
                    <strong className="phm-val text-blue">{Number.isFinite(detailedPerformance.onTimeRate) ? `${detailedPerformance.onTimeRate}%` : "—"}</strong>
                    <span className="phm-sub">Deadline discipline</span>
                  </div>
                  <div className="perf-hero-metric-item">
                    <span className="phm-label">Attendance & Discipline</span>
                    <strong className="phm-val text-purple">{detailedPerformance.attendance.disciplineRate}%</strong>
                    <div className="phm-sub-tags">
                      <span className="phm-badge green">{detailedPerformance.attendance.present} Clock In</span>
                      <span className="phm-badge orange">{detailedPerformance.attendance.halfday} Half Day</span>
                      <span className="phm-badge amber">{detailedPerformance.attendance.late} Late</span>
                      <span className="phm-badge red">{detailedPerformance.attendance.absent} Absent</span>
                    </div>
                  </div>
                  <div className="perf-hero-metric-item">
                    <span className="phm-label">Time Utilization</span>
                    <strong className="phm-val text-amber">{detailedPerformance.timeUtilRate}%</strong>
                    <span className="phm-sub">{detailedPerformance.trackedHoursLabel} logged</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Growth Areas Insights */}
            <div className="perf-insights-grid">
              <div className="perf-insight-card strengths">
                <div className="perf-insight-header">
                  <span className="perf-insight-icon-bubble green">
                    <FiCheckCircle size={16} />
                  </span>
                  <div>
                    <h4>Demonstrated Strengths</h4>
                    <span className="perf-insight-sub">What is working well in this period</span>
                  </div>
                </div>
                <ul className="perf-insight-list">
                  {detailedPerformance.strengths.map((s, idx) => (
                    <li key={`str-${idx}`}>
                      <FiCheck size={14} className="text-emerald" />
                      <span><strong>{s.title}:</strong> {s.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="perf-insight-card focus">
                <div className="perf-insight-header">
                  <span className="perf-insight-icon-bubble amber">
                    <FiZap size={16} />
                  </span>
                  <div>
                    <h4>Critical Focus & Growth Areas</h4>
                    <span className="perf-insight-sub">Targeted areas needing improvement</span>
                  </div>
                </div>
                <ul className="perf-insight-list">
                  {detailedPerformance.improvements.map((imp, idx) => (
                    <li key={`imp-${idx}`} className={imp.isWarning ? "warning-item" : ""}>
                      {imp.isWarning ? (
                        <FiAlertTriangle size={14} className="text-red" />
                      ) : (
                        <FiClock size={14} className="text-blue" />
                      )}
                      <span><strong>{imp.title}:</strong> {imp.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Performance Evaluation & Formula Breakdown Card */}
            <div className="overview-card perf-engine-card">
              <div className="card-header-line">
                <div>
                  <div className="perf-header-eyebrow">Evaluation Engine · 4-Pillar Model</div>
                  <h3><FiAward size={18} className="text-primary" /> Performance Calculation Breakdown</h3>
                </div>
                <div className="perf-grade-pill-group">
                  <span className={`perf-grade-badge ${detailedPerformance.tierColor}`}>
                    Grade {detailedPerformance.grade} · {detailedPerformance.tier}
                  </span>
                  <span className="perf-final-score-pill">
                    {detailedPerformance.finalScore} / 100 Pts
                  </span>
                </div>
              </div>

              {/* Dynamic Formula Banner */}
              <div className="perf-formula-banner">
                <span className="formula-tag">Formula</span>
                <span className="formula-text">
                  Score = (Tasks × 40%) + (On-Time × 25%) + (Attendance × 20%) + (Hours × 15%){detailedPerformance.pillars.overduePenalty.points > 0 ? ` - (Overdue Penalty: -${detailedPerformance.pillars.overduePenalty.points} pts)` : ""}
                </span>
              </div>

              {/* 4 Pillars Grid */}
              <div className="perf-pillars-grid">
                {/* Pillar 1: Task Completion */}
                <div className="perf-pillar-card">
                  <div className="pillar-top">
                    <span className="pillar-name">1. Task Completion</span>
                    <span className="pillar-weight-badge">Weight 40%</span>
                  </div>
                  <div className="pillar-score-row">
                    <div className="pillar-points text-emerald">+{detailedPerformance.pillars.taskCompletion.points} <span className="pts-max">/ 40 pts</span></div>
                    <span className="pillar-rate">{detailedPerformance.pillars.taskCompletion.rate}%</span>
                  </div>
                  <div className="progress-track sm">
                    <div className="progress-fill" style={{ width: `${detailedPerformance.pillars.taskCompletion.rate}%`, backgroundColor: '#10b981' }} />
                  </div>
                  <span className="pillar-desc">{detailedPerformance.completed} of {detailedPerformance.total} assigned tasks completed</span>
                </div>

                {/* Pillar 2: On-Time Delivery */}
                <div className="perf-pillar-card">
                  <div className="pillar-top">
                    <span className="pillar-name">2. On-Time Delivery</span>
                    <span className="pillar-weight-badge">Weight 25%</span>
                  </div>
                  <div className="pillar-score-row">
                    <div className="pillar-points text-blue">+{detailedPerformance.pillars.onTimeDelivery.points} <span className="pts-max">/ 25 pts</span></div>
                    <span className="pillar-rate">{detailedPerformance.pillars.onTimeDelivery.rate}%</span>
                  </div>
                  <div className="progress-track sm">
                    <div className="progress-fill" style={{ width: `${detailedPerformance.pillars.onTimeDelivery.rate}%`, backgroundColor: '#2563eb' }} />
                  </div>
                  <span className="pillar-desc">Completed on or before deadline</span>
                </div>

                {/* Pillar 3: Attendance & Punctuality */}
                <div className="perf-pillar-card">
                  <div className="pillar-top">
                    <span className="pillar-name">3. Attendance & Discipline</span>
                    <span className="pillar-weight-badge">Weight 20%</span>
                  </div>
                  <div className="pillar-score-row">
                    <div className="pillar-points text-purple">+{detailedPerformance.pillars.attendance.points} <span className="pts-max">/ 20 pts</span></div>
                    <span className="pillar-rate">{detailedPerformance.attendance.disciplineRate}%</span>
                  </div>
                  <div className="progress-track sm">
                    <div className="progress-fill" style={{ width: `${detailedPerformance.attendance.disciplineRate}%`, backgroundColor: '#8b5cf6' }} />
                  </div>
                  <div className="pillar-att-chips">
                    <span className="att-mini-chip present">
                      <strong>{detailedPerformance.attendance.present}</strong> Present
                    </span>
                    <span className="att-mini-chip late" title="Late arrival incurs 30% punctuality deduction">
                      <strong>{detailedPerformance.attendance.late}</strong> Late
                    </span>
                    <span className="att-mini-chip absent" title="Unclocked working days give 0 credit">
                      <strong>{detailedPerformance.attendance.absent}</strong> Absent
                    </span>
                    {detailedPerformance.attendance.halfday > 0 && (
                      <span className="att-mini-chip halfday">
                        <strong>{detailedPerformance.attendance.halfday}</strong> Half Day
                      </span>
                    )}
                  </div>
                  <span className="pillar-desc">
                    {detailedPerformance.attendance.late > 0 ? `${detailedPerformance.attendance.late} late arrival(s) penalized (-30% each). ` : ""}
                    {detailedPerformance.attendance.absent > 0 ? `${detailedPerformance.attendance.absent} unclocked absence(s) counted. ` : ""}
                    {detailedPerformance.attendance.late === 0 && detailedPerformance.attendance.absent === 0 ? "Flawless on-time attendance recorded." : ""}
                  </span>
                </div>

                {/* Pillar 4: Time Tracking / Utilization */}
                <div className="perf-pillar-card">
                  <div className="pillar-top">
                    <span className="pillar-name">4. Time Utilization</span>
                    <span className="pillar-weight-badge">Weight 15%</span>
                  </div>
                  <div className="pillar-score-row">
                    <div className="pillar-points text-amber">+{detailedPerformance.pillars.timeUtilization.points} <span className="pts-max">/ 15 pts</span></div>
                    <span className="pillar-rate">{detailedPerformance.pillars.timeUtilization.rate}%</span>
                  </div>
                  <div className="progress-track sm">
                    <div className="progress-fill" style={{ width: `${detailedPerformance.pillars.timeUtilization.rate}%`, backgroundColor: '#f59e0b' }} />
                  </div>
                  <span className="pillar-desc">{detailedPerformance.trackedHoursLabel} task hours logged</span>
                </div>
              </div>

              {/* Overdue Penalty Notice */}
              {detailedPerformance.pillars.overduePenalty.points > 0 && (
                <div className="perf-penalty-notice">
                  <FiAlertTriangle size={15} className="text-red" />
                  <span>
                    <strong>Overdue Tasks Penalty:</strong> -{detailedPerformance.pillars.overduePenalty.points} points deducted due to {detailedPerformance.overdue} tasks past deadline.
                  </span>
                </div>
              )}
            </div>

            <div className="overview-grid-top perf-overview-grid-top">
              {/* Task Status Distribution Card */}
              <div className="overview-card perf-card-visual">
                <div className="card-header-line">
                  <div className="card-header-left">
                    <h3><FiPieChart size={16} /> Task Status Distribution</h3>
                    <span className="card-header-sub">{detailedPerformance.timeframeLabel}</span>
                  </div>
                  <span className="perf-volume-chip">{detailedPerformance.total} Total Tasks</span>
                </div>

                {/* Proportional Segmented Stream Ribbon */}
                <div className="perf-stream-bar-container">
                  <div className="perf-stream-bar">
                    {detailedPerformance.completed > 0 && (
                      <div
                        className="stream-segment completed"
                        style={{ width: `${detailedPerformance.total ? (detailedPerformance.completed / detailedPerformance.total) * 100 : 0}%` }}
                        title={`Completed: ${detailedPerformance.completed} (${detailedPerformance.completionRate}%)`}
                      />
                    )}
                    {detailedPerformance.inProgress > 0 && (
                      <div
                        className="stream-segment in-progress"
                        style={{ width: `${detailedPerformance.total ? (detailedPerformance.inProgress / detailedPerformance.total) * 100 : 0}%` }}
                        title={`In Progress: ${detailedPerformance.inProgress}`}
                      />
                    )}
                    {detailedPerformance.pending > 0 && (
                      <div
                        className="stream-segment pending"
                        style={{ width: `${detailedPerformance.total ? (detailedPerformance.pending / detailedPerformance.total) * 100 : 0}%` }}
                        title={`Pending: ${detailedPerformance.pending}`}
                      />
                    )}
                    {detailedPerformance.overdue > 0 && (
                      <div
                        className="stream-segment overdue"
                        style={{ width: `${detailedPerformance.total ? (detailedPerformance.overdue / detailedPerformance.total) * 100 : 0}%` }}
                        title={`Overdue: ${detailedPerformance.overdue}`}
                      />
                    )}
                    {detailedPerformance.onHold > 0 && (
                      <div
                        className="stream-segment"
                        style={{ width: `${detailedPerformance.total ? (detailedPerformance.onHold / detailedPerformance.total) * 100 : 0}%`, backgroundColor: "#64748b" }}
                        title={`On Hold: ${detailedPerformance.onHold}`}
                      />
                    )}
                  </div>
                  <div className="perf-stream-legend">
                    <span className="legend-item"><span className="legend-dot green" /> Completed ({detailedPerformance.completionRate}%)</span>
                    <span className="legend-item"><span className="legend-dot blue" /> In Progress ({detailedPerformance.total ? Math.round((detailedPerformance.inProgress / detailedPerformance.total) * 100) : 0}%)</span>
                    <span className="legend-item"><span className="legend-dot amber" /> Pending ({detailedPerformance.total ? Math.round((detailedPerformance.pending / detailedPerformance.total) * 100) : 0}%)</span>
                    <span className="legend-item"><span className="legend-dot red" /> Overdue ({detailedPerformance.total ? Math.round((detailedPerformance.overdue / detailedPerformance.total) * 100) : 0}%)</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: "#64748b" }} /> On Hold ({detailedPerformance.total ? Math.round((detailedPerformance.onHold / detailedPerformance.total) * 100) : 0}%)</span>
                  </div>
                </div>

                {/* 4 Status KPI Tiles Grid */}
                <div className="perf-status-cards-grid">
                  <div className="perf-status-card completed">
                    <div className="psc-top">
                      <span className="psc-title"><span className="status-indicator-dot green" /> Completed</span>
                      <span className="psc-pct-badge green">{detailedPerformance.completionRate}%</span>
                    </div>
                    <div className="psc-middle">
                      <strong className="psc-count text-green">{detailedPerformance.completed}</strong>
                      <span className="psc-sub">of {detailedPerformance.total} tasks</span>
                    </div>
                    <div className="progress-track psc-track">
                      <div className="progress-fill" style={{ width: `${detailedPerformance.completionRate}%`, backgroundColor: "#10b981" }} />
                    </div>
                  </div>

                  <div className="perf-status-card in-progress">
                    <div className="psc-top">
                      <span className="psc-title"><span className="status-indicator-dot blue" /> In Progress</span>
                      <span className="psc-pct-badge blue">{detailedPerformance.total ? Math.round((detailedPerformance.inProgress / detailedPerformance.total) * 100) : 0}%</span>
                    </div>
                    <div className="psc-middle">
                      <strong className="psc-count text-blue">{detailedPerformance.inProgress}</strong>
                      <span className="psc-sub">actively moving</span>
                    </div>
                    <div className="progress-track psc-track">
                      <div className="progress-fill" style={{ width: `${detailedPerformance.total ? Math.round((detailedPerformance.inProgress / detailedPerformance.total) * 100) : 0}%`, backgroundColor: "#0284c7" }} />
                    </div>
                  </div>

                  <div className="perf-status-card pending">
                    <div className="psc-top">
                      <span className="psc-title"><span className="status-indicator-dot amber" /> Pending</span>
                      <span className="psc-pct-badge amber">{detailedPerformance.total ? Math.round((detailedPerformance.pending / detailedPerformance.total) * 100) : 0}%</span>
                    </div>
                    <div className="psc-middle">
                      <strong className="psc-count text-amber">{detailedPerformance.pending}</strong>
                      <span className="psc-sub">queued for work</span>
                    </div>
                    <div className="progress-track psc-track">
                      <div className="progress-fill" style={{ width: `${detailedPerformance.total ? Math.round((detailedPerformance.pending / detailedPerformance.total) * 100) : 0}%`, backgroundColor: "#d97706" }} />
                    </div>
                  </div>

                  <div className="perf-status-card overdue">
                    <div className="psc-top">
                      <span className="psc-title"><span className="status-indicator-dot red" /> Overdue</span>
                      <span className="psc-pct-badge red">{detailedPerformance.total ? Math.round((detailedPerformance.overdue / detailedPerformance.total) * 100) : 0}%</span>
                    </div>
                    <div className="psc-middle">
                      <strong className="psc-count text-red">{detailedPerformance.overdue}</strong>
                      <span className="psc-sub">{detailedPerformance.overdue > 0 ? "requires resolution" : "zero breach"}</span>
                    </div>
                    <div className="progress-track psc-track">
                      <div className="progress-fill" style={{ width: `${detailedPerformance.total ? Math.round((detailedPerformance.overdue / detailedPerformance.total) * 100) : 0}%`, backgroundColor: "#dc2626" }} />
                    </div>
                  </div>
                </div>

                {/* Bottom Operational SLA Strip */}
                <div className="perf-status-bottom-strip">
                  <div className="psbs-item">
                    <span className="psbs-label">Timeliness Adherence:</span>
                    <strong className="psbs-val text-green">{detailedPerformance.onTimeRate}% on-time delivery</strong>
                  </div>
                  <div className="psbs-item">
                    <span className="psbs-label">SLA Deductions:</span>
                    <strong className={`psbs-val ${detailedPerformance.pillars.overduePenalty.points > 0 ? "text-red" : "text-slate"}`}>
                      {detailedPerformance.pillars.overduePenalty.points > 0 ? `-${detailedPerformance.pillars.overduePenalty.points} pts overdue penalty` : "0 penalty (clean SLA)"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Work Efficiency Summary */}
              <div className="overview-card perf-card-visual">
                <div className="card-header-line">
                  <div className="card-header-left">
                    <h3><FiTrendingUp size={16} /> Workload & Efficiency</h3>
                    <span className="card-header-sub">Operational output & shift discipline</span>
                  </div>
                  <span className="perf-trajectory-chip">
                    {detailedPerformance.trajectory}
                  </span>
                </div>

                {/* 3 Metric Summary Tiles */}
                <div className="perf-efficiency-tiles">
                  <div className="perf-eff-tile">
                    <span className="eff-tile-label">Evaluated Tasks</span>
                    <strong className="eff-tile-val text-dark">{detailedPerformance.total}</strong>
                    <span className="eff-tile-sub">Total deliverables evaluated</span>
                  </div>
                  <div className="perf-eff-tile">
                    <span className="eff-tile-label">Tracked Hours</span>
                    <strong className="eff-tile-val text-blue">{detailedPerformance.trackedHoursLabel}</strong>
                    <span className="eff-tile-sub">Total logged execution time</span>
                  </div>
                  <div className="perf-eff-tile">
                    <span className="eff-tile-label">Discipline Index</span>
                    <strong className="eff-tile-val text-purple">{detailedPerformance.attendance.disciplineRate}%</strong>
                    <span className="eff-tile-sub">Composite punctuality & shift SLA</span>
                  </div>
                </div>

                {/* Attendance Discipline Visual Progress Meter */}
                <div className="perf-eff-attendance-section">
                  <div className="eff-att-header-row">
                    <span className="eff-att-title">Shift Attendance & Punctuality Breakdown</span>
                    <span className="eff-att-badge">{detailedPerformance.attendance.disciplineRate}% Discipline</span>
                  </div>
                  <div className="progress-track att-discipline-track">
                    <div
                      className="progress-fill att-discipline-fill"
                      style={{
                        width: `${detailedPerformance.attendance.disciplineRate}%`,
                        backgroundColor: detailedPerformance.attendance.disciplineRate >= 85 ? "#10b981" : detailedPerformance.attendance.disciplineRate >= 70 ? "#3b82f6" : "#f59e0b"
                      }}
                    />
                  </div>

                  {/* 4 Punctuality Chips with Half Day */}
                  <div className="eff-punctuality-chips">
                    <div className="eff-p-chip clockin">
                      <span className="chip-indicator" />
                      <span className="chip-count">{detailedPerformance.attendance.present}</span>
                      <span className="chip-label">Clock In</span>
                    </div>
                    <div className="eff-p-chip halfday">
                      <span className="chip-indicator" />
                      <span className="chip-count">{detailedPerformance.attendance.halfday}</span>
                      <span className="chip-label">Half Day</span>
                    </div>
                    <div className="eff-p-chip late">
                      <span className="chip-indicator" />
                      <span className="chip-count">{detailedPerformance.attendance.late}</span>
                      <span className="chip-label">Late</span>
                    </div>
                    <div className="eff-p-chip absent">
                      <span className="chip-indicator" />
                      <span className="chip-count">{detailedPerformance.attendance.absent}</span>
                      <span className="chip-label">Absent</span>
                    </div>
                  </div>
                  <p className="eff-att-footnote">
                    *Attendance Score balances: 100% full Clock In, 50% Half Day, 30% late deduction, and 0% for unclocked absence across scheduled working days.
                  </p>
                </div>

                {/* Evaluation Trajectory Card */}
                <div className="perf-trajectory-box">
                  <div className="ptb-left">
                    <span className="ptb-label">Performance Assessment Verdict</span>
                    <p className="ptb-text">{detailedPerformance.narrative?.executiveSummary}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In-Place Assign Task Modal (With Today 7:00 PM default due date) */}
        {assignModal.open && (
          <div className="company-task-modal-backdrop" onClick={closeAssignModal}>
            <div className="company-task-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Assign Task to {employeeName}</h3>
                <button type="button" className="btn-close-modal" onClick={closeAssignModal}>
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="company-task-modal-form">
                {assignModal.error && (
                  <div className="company-task-error">{assignModal.error}</div>
                )}

                <div className="form-group">
                  <label>Task Title <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Enter task title"
                    value={assignModal.title}
                    onChange={(e) => setAssignModal((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Add details, instructions or expectations..."
                    value={assignModal.description}
                    onChange={(e) => setAssignModal((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={assignModal.priority}
                      onChange={(e) => setAssignModal((prev) => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Due Date & Time <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="datetime-local"
                      value={assignModal.dueDateTime}
                      required
                      onChange={(e) => setAssignModal((prev) => ({ ...prev, dueDateTime: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Repeat Task Section */}
                <div className="form-group" style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>Repeat Task</label>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 600,
                      background: assignModal.repeatPattern !== 'none' ? "#dcfce7" : "#f1f5f9",
                      color: assignModal.repeatPattern !== 'none' ? "#15803d" : "#64748b"
                    }}>
                      {assignModal.repeatPattern === 'daily' ? 'Repeat Task' : 'No Repeat'}
                    </span>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Pattern</label>
                      <select
                        value={assignModal.repeatPattern}
                        onChange={(e) => setAssignModal((prev) => ({
                          ...prev,
                          repeatPattern: e.target.value,
                          repeatDays: e.target.value === 'daily' ? prev.repeatDays : [],
                          recurrenceEndDate: e.target.value !== 'none' ? prev.recurrenceEndDate : '',
                        }))}
                      >
                        <option value="none">No Repeat</option>
                        <option value="daily">Repeat Task</option>
                      </select>
                    </div>

                    {assignModal.repeatPattern !== 'none' && (
                      <div className="form-group">
                        <label>Repeat End Date <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          type="date"
                          value={formatDateInputValue(assignModal.recurrenceEndDate)}
                          min={formatDateInputValue(assignModal.dueDateTime ? new Date(assignModal.dueDateTime) : new Date())}
                          max={formatDateInputValue(getMaxRepeatEndDate(assignModal.dueDateTime ? new Date(assignModal.dueDateTime) : new Date()))}
                          onChange={(e) => setAssignModal((prev) => ({ ...prev, recurrenceEndDate: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>

                  {assignModal.repeatPattern === 'daily' && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>Select Days (leave blank to run every day)</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {RECURRING_REPEAT_DAYS.map(day => {
                          const isSelected = (assignModal.repeatDays || []).includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => setAssignModal((prev) => {
                                const current = prev.repeatDays || [];
                                return {
                                  ...prev,
                                  repeatDays: isSelected
                                    ? current.filter(d => d !== day.value)
                                    : [...current, day.value]
                                };
                              })}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: isSelected ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                background: isSelected ? "#2563eb" : "#ffffff",
                                color: isSelected ? "#ffffff" : "#334155",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer"
                              }}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Checkpoints builder */}
                <div className="form-checkpoints-section">
                  <div className="section-title-row">
                    <label>Subtasks / Checkpoints</label>
                  </div>
                  <div className="cp-inputs-list">
                    {assignModal.checkpoints.map((cp, idx) => (
                      <div className="cp-input-row" key={idx}>
                        <input type="text" readOnly value={cp.title} />
                        <button
                          type="button"
                          className="btn-remove-cp"
                          onClick={() => handleRemoveCheckpointFromAssign(idx)}
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="cp-input-row">
                      <input
                        type="text"
                        placeholder="Add a deliverable or checkpoint..."
                        value={assignModal.newCheckpointText}
                        onChange={(e) => setAssignModal((prev) => ({ ...prev, newCheckpointText: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCheckpointToAssign();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-add-cp"
                        onClick={handleAddCheckpointToAssign}
                      >
                        <FiPlus size={14} /> Add
                      </button>
                    </div>
                  </div>
                </div>

                <TaskReminderControl
                  settings={assignModal.reminderSettings}
                  dueDateTime={assignModal.dueDateTime}
                  onChange={(nextSettings) => setAssignModal((prev) => ({ ...prev, reminderSettings: nextSettings }))}
                  taskTitle={assignModal.title || 'Task'}
                />

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    disabled={assignModal.submitting}
                    onClick={closeAssignModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-submit"
                    disabled={assignModal.submitting}
                  >
                    {assignModal.submitting ? "Assigning..." : "Assign Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editModal.open && editModal.task && (
          <div className="company-task-modal-backdrop" onClick={closeEditModal}>
            <div className="modern-edit-task-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modern-edit-modal-header">
                <div className="modern-edit-header-left">
                  <div className="modern-edit-icon-bubble">
                    <FiEdit2 size={18} />
                  </div>
                  <div>
                    <div className="modern-edit-title-row">
                      <h3 className="modern-edit-title">Edit Task</h3>
                      <span className="modern-edit-type-badge">
                        {editModal.task.projectName ? editModal.task.projectName : (editModal.task.clientName ? editModal.task.clientName : "Task")}
                      </span>
                    </div>
                    {editModal.task.lastEditedByName && (
                      <p className="modern-edit-subtitle" style={{ color: "#b45309", fontWeight: 500, fontSize: "11.5px" }}>
                        Last edited by <strong>{editModal.task.lastEditedByName}</strong>{editModal.task.lastEditedAt && ` on ${formatDateTime(editModal.task.lastEditedAt)}`}
                      </p>
                    )}
                    <p className="modern-edit-subtitle">
                      Update task details, schedule, priority & checkpoints
                    </p>
                  </div>
                </div>
                <button type="button" className="modern-edit-close-btn" onClick={closeEditModal} title="Close">
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="modern-edit-modal-form">
                {editModal.task?.lastEditedByName && (
                  <div className="modal-edit-audit-banner">
                    <FiEdit2 size={16} className="audit-icon" />
                    <div className="audit-content">
                      <div className="audit-title">
                        Last edited by <strong>{resolveDisplayString(editModal.task.lastEditedByName, 'User')}</strong>
                        {editModal.task.lastEditedAt && ` on ${formatDateTime(editModal.task.lastEditedAt)}`}
                      </div>
                      {editModal.task.lastEditChanges && (
                        <div className="audit-changes">{editModal.task.lastEditChanges}</div>
                      )}
                    </div>
                  </div>
                )}
                {/* Task Title */}
                <div className="modern-form-field">
                  <label className="modern-form-label">
                    Task Title <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="modern-form-input"
                    placeholder="e.g. Implement user authentication flow"
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div className="modern-form-field">
                  <label className="modern-form-label">
                    Description <span className="req-star">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    className="modern-form-textarea"
                    placeholder="Provide detailed description, requirements or notes..."
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                {/* Priority & Due Date Row */}
                <div className="modern-form-row-2">
                  <div className="modern-form-field">
                    <label className="modern-form-label">Priority</label>
                    <div className="priority-pill-selector">
                      {[
                        { val: "low", label: "Low", color: "green" },
                        { val: "medium", label: "Medium", color: "amber" },
                        { val: "high", label: "High", color: "rose" }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          className={`priority-pill-btn ${p.color} ${editForm.priority === p.val ? "active" : ""}`}
                          onClick={() => setEditForm((prev) => ({ ...prev, priority: p.val }))}
                        >
                          <span className="priority-pill-dot" />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="modern-form-field">
                    <label className="modern-form-label">
                      Due Date & Time <span className="req-star">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="modern-form-input datetime"
                      value={editForm.dueDateTime}
                      onChange={(e) => setEditForm((p) => ({ ...p, dueDateTime: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div className="modern-form-field">
                  <label className="modern-form-label">Status</label>
                  <div className="status-pill-selector">
                    {[
                      { val: "pending", label: "Pending", cls: "pending" },
                      { val: "in-progress", label: "In Progress", cls: "in-progress" },
                      { val: "completed", label: "Completed", cls: "completed" },
                      { val: "onhold", label: "On Hold", cls: "onhold" },
                    ].map((st) => (
                      <button
                        key={st.val}
                        type="button"
                        className={`status-pill-btn ${st.cls} ${editForm.status === st.val ? "active" : ""}`}
                        onClick={() => setEditForm((prev) => ({ ...prev, status: st.val }))}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Checkpoints */}
                <div className="modern-cp-section">
                  <div className="modern-cp-header">
                    <div className="modern-cp-title">
                      <FiCheckSquare size={14} />
                      <span>Subtasks / Checkpoints</span>
                      <span className="modern-cp-count">({editForm.checkpoints.length})</span>
                    </div>
                    <button type="button" className="modern-btn-add-cp" onClick={addEditCheckpoint}>
                      <FiPlus size={13} /> Add Subtask
                    </button>
                  </div>

                  <div className="modern-cp-list">
                    {editForm.checkpoints.map((cp, idx) => (
                      <div className="modern-cp-item" key={idx}>
                        <input
                          type="checkbox"
                          checked={Boolean(cp.completed)}
                          onChange={() => toggleEditCheckpoint(idx)}
                          title={cp.completed ? "Mark incomplete" : "Mark completed"}
                          style={{ width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer", flexShrink: 0 }}
                        />
                        <span className="modern-cp-num">{idx + 1}</span>
                        <input
                          type="text"
                          className="modern-cp-input"
                          value={cp.title}
                          placeholder="e.g. Design review with client"
                          style={cp.completed ? { textDecoration: "line-through", color: "#64748b" } : undefined}
                          onChange={(e) => updateEditCheckpoint(idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="modern-cp-remove-btn"
                          title="Remove Checkpoint"
                          onClick={() => removeEditCheckpoint(idx)}
                        >
                          <FiX size={15} />
                        </button>
                      </div>
                    ))}
                    {editForm.checkpoints.length === 0 && (
                      <div className="modern-cp-empty">
                        No subtasks added yet. Click &quot;Add Subtask&quot; to break down this task.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="modern-edit-modal-footer">
                  <button
                    type="button"
                    className="btn-modal-ghost"
                    disabled={savingTaskId === editModal.task._id}
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-primary"
                    disabled={savingTaskId === editModal.task._id}
                  >
                    {savingTaskId === editModal.task._id ? (
                      <>
                        <FiRefreshCw size={14} className="spin-icon" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <FiCheck size={16} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remarks Modal */}
        {remarksModal.open && (
          <div className="company-task-modal-backdrop" onClick={() => setRemarksModal({ open: false, task: null, remarks: [] })}>
            <div className="task-activity-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="task-activity-modal-header">
                <div className="task-activity-header-left">
                  <div className="task-activity-icon-bubble remarks-bubble">
                    <FiMessageSquare size={18} />
                  </div>
                  <div>
                    <div className="task-activity-title-row">
                      <h3 className="task-activity-modal-title">Task Remarks</h3>
                      <span className="task-activity-count-chip remarks-chip">
                        {remarksModal.remarks?.length || 0} {remarksModal.remarks?.length === 1 ? "Remark" : "Remarks"}
                      </span>
                    </div>
                    {remarksModal.task?.title && (
                      <p className="task-activity-task-subtitle">
                        Task: <span className="task-title-highlight">{remarksModal.task.title}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="task-activity-close-btn"
                  onClick={() => setRemarksModal({ open: false, task: null, remarks: [] })}
                  title="Close Modal"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="task-activity-modal-body">
                {remarksModal.remarks?.length ? (
                  <div className="task-activity-timeline">
                    {remarksModal.remarks.map((r, i) => {
                      const resolveRemarkUser = (item, taskObj) => {
                        if (item.userName && typeof item.userName === "string" && item.userName.trim() && !/^[0-9a-fA-F]{24}$/.test(item.userName.trim())) {
                          return item.userName.trim();
                        }
                        if (item.name && typeof item.name === "string" && item.name.trim() && !/^[0-9a-fA-F]{24}$/.test(item.name.trim())) {
                          return item.name.trim();
                        }
                        if (item.user?.name && typeof item.user.name === "string" && item.user.name.trim()) {
                          return item.user.name.trim();
                        }
                        if (item.author?.name && typeof item.author.name === "string" && item.author.name.trim()) {
                          return item.author.name.trim();
                        }
                        const rawId = String(item.user?._id || item.user?.id || (typeof item.user === "string" ? item.user : "") || item.userId || "");
                        const curId = String(currentUser?._id || currentUser?.id || "");
                        const empId = String(employee?._id || employee?.id || effectiveUserId || "");
                        if (rawId && curId && rawId === curId) {
                          return currentUser?.name || "You";
                        }
                        if (rawId && empId && rawId === empId) {
                          return employee?.name || "Employee";
                        }
                        if (rawId && Array.isArray(taskObj?.assignedUsers)) {
                          const matched = taskObj.assignedUsers.find((u) => String(u?._id || u?.id || u) === rawId);
                          if (matched?.name) return matched.name;
                        }
                        if (typeof item.user === "string" && item.user.trim() && !/^[0-9a-fA-F]{24}$/.test(item.user.trim())) {
                          return item.user.trim();
                        }
                        return employee?.name || currentUser?.name || "Admin";
                      };

                      const userName = resolveRemarkUser(r, remarksModal.task);
                      const initials = getInitials(userName);
                      const isSystem = userName.toLowerCase() === "system";
                      const dateStr = formatDateTime(r.createdAt || r.date || r.timestamp);
                      const text = r.remark || r.text || r.message || r.comment || "No comment content";

                      return (
                        <div className="task-activity-item" key={r._id || i}>
                          <div className="task-activity-node-col">
                            <div className="task-activity-node-icon" style={{ color: "#0891b2", backgroundColor: "#ecfeff", borderColor: "#a5f3fc" }}>
                              <FiMessageSquare size={13} />
                            </div>
                            {i < remarksModal.remarks.length - 1 && <div className="task-activity-node-line" />}
                          </div>

                          <div className="task-activity-card">
                            <div className="task-activity-card-header">
                              <div className="task-activity-user-info">
                                <div
                                  className={`task-activity-avatar ${isSystem ? "system-avatar" : ""}`}
                                  style={{ background: isSystem ? undefined : getAvatarBg(userName) }}
                                >
                                  {isSystem ? <FiZap size={12} /> : initials}
                                </div>
                                <div className="task-activity-user-names">
                                  <span className="task-activity-user-name">{userName}</span>
                                  <span className="task-activity-action-tag badge-remark" style={{ color: "#0891b2", backgroundColor: "#ecfeff", borderColor: "#a5f3fc" }}>
                                    Remark
                                  </span>
                                </div>
                              </div>
                              <div className="task-activity-timestamp" title={dateStr}>
                                <FiClock size={12} />
                                <span>{dateStr}</span>
                              </div>
                            </div>

                            <div className="task-activity-card-content">
                              <p className="task-activity-text">{text}</p>
                              {getRemarkImageUrls(r).length > 0 && (
                                <div className="task-remark-images">
                                  {getRemarkImageUrls(r).map(url => (
                                    <button type="button" key={url} className="task-remark-image-thumb" onClick={() => setRemarkImagePreview(url)} title="View image">
                                      <img src={url} alt="Remark attachment" loading="lazy" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="task-activity-empty-state">
                    <div className="task-activity-empty-icon">
                      <FiMessageSquare size={30} />
                    </div>
                    <h4>No Remarks Logged</h4>
                    <p>No remarks or notes have been added for this task yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Opened from the remarks modal, so it stacks above that modal's backdrop (z-index 99999). */}
        {remarkImagePreview && (
          <div className="task-remark-image-preview" role="dialog" aria-modal="true" onClick={() => setRemarkImagePreview("")}>
            <button type="button" className="task-remark-image-preview-close" aria-label="Close image" onClick={() => setRemarkImagePreview("")}>
              <FiX size={20} />
            </button>
            <img src={remarkImagePreview} alt="Remark attachment" onClick={event => event.stopPropagation()} />
          </div>
        )}

        {/* Activity Logs Modal */}
        {activityModal.open && (
          <div className="company-task-modal-backdrop" onClick={() => setActivityModal({ open: false, task: null, logs: [] })}>
            <div className="task-activity-modal-container" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="task-activity-modal-header">
                <div className="task-activity-header-left">
                  <div className="task-activity-icon-bubble">
                    <FiActivity size={18} />
                  </div>
                  <div>
                    <div className="task-activity-title-row">
                      <h3 className="task-activity-modal-title">Task Activities</h3>
                      <span className="task-activity-count-chip">
                        {activityModal.logs?.length || 0} {activityModal.logs?.length === 1 ? "Event" : "Events"}
                      </span>
                    </div>
                    {activityModal.task?.title && (
                      <p className="task-activity-task-subtitle">
                        Task: <span className="task-title-highlight">{activityModal.task.title}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="task-activity-close-btn"
                  onClick={() => setActivityModal({ open: false, task: null, logs: [] })}
                  title="Close Modal"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Timeline Body */}
              <div className="task-activity-modal-body">
                {activityModal.logs?.length ? (
                  <div className="task-activity-timeline">
                    {activityModal.logs.map((log, i) => {
                      const resolveActivityUser = (item, taskObj) => {
                        if (item.userName && typeof item.userName === "string" && item.userName.trim() && !/^[0-9a-fA-F]{24}$/.test(item.userName.trim())) {
                          return item.userName.trim();
                        }
                        if (item.user?.name && typeof item.user.name === "string" && item.user.name.trim()) {
                          return item.user.name.trim();
                        }
                        if (item.performedBy?.name && typeof item.performedBy.name === "string" && item.performedBy.name.trim()) {
                          return item.performedBy.name.trim();
                        }
                        if (item.action?.toLowerCase().includes("system")) return "System";
                        const rawId = String(item.user?._id || item.user?.id || item.performedBy?._id || (typeof item.performedBy === "string" ? item.performedBy : "") || "");
                        const curId = String(currentUser?._id || currentUser?.id || "");
                        const empId = String(employee?._id || employee?.id || effectiveUserId || "");
                        if (rawId && curId && rawId === curId) return currentUser?.name || "You";
                        if (rawId && empId && rawId === empId) return employee?.name || "Employee";
                        if (rawId && Array.isArray(taskObj?.assignedUsers)) {
                          const matched = taskObj.assignedUsers.find((u) => String(u?._id || u?.id || u) === rawId);
                          if (matched?.name) return matched.name;
                        }
                        if (typeof item.performedBy === "string" && item.performedBy.trim() && !/^[0-9a-fA-F]{24}$/.test(item.performedBy.trim())) {
                          return item.performedBy.trim();
                        }
                        return employee?.name || currentUser?.name || "Admin";
                      };

                      const userName = resolveActivityUser(log, activityModal.task);
                      const initials = getInitials(userName);
                      const isSystem = userName.toLowerCase() === "system";
                      const dateStr = formatDateTime(log.createdAt || log.timestamp || log.date || log.updatedAt);
                      const description = cleanActivityDescription(log.description || log.details || log.comment || log.text || log.message, log.action || log.type);
                      const meta = getActivityMeta(log);

                      return (
                        <div className="task-activity-item" key={log._id || i}>
                          {/* Left node */}
                          <div className="task-activity-node-col">
                            <div
                              className="task-activity-node-icon"
                              style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}
                            >
                              {meta.icon}
                            </div>
                            {i < activityModal.logs.length - 1 && <div className="task-activity-node-line" />}
                          </div>

                          {/* Right Card */}
                          <div className="task-activity-card">
                            <div className="task-activity-card-header">
                              <div className="task-activity-user-info">
                                <div
                                  className={`task-activity-avatar ${isSystem ? "system-avatar" : ""}`}
                                  style={{ background: isSystem ? undefined : getAvatarBg(userName) }}
                                >
                                  {isSystem ? <FiZap size={12} /> : initials}
                                </div>
                                <div className="task-activity-user-names">
                                  <span className="task-activity-user-name">{userName}</span>
                                  <span
                                    className={`task-activity-action-tag ${meta.badgeClass}`}
                                    style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                              </div>
                              <div className="task-activity-timestamp" title={dateStr}>
                                <FiClock size={12} />
                                <span>{dateStr}</span>
                              </div>
                            </div>

                            <div className="task-activity-card-content">
                              <p className="task-activity-text">{description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="task-activity-empty-state">
                    <div className="task-activity-empty-icon">
                      <FiActivity size={30} />
                    </div>
                    <h4>No Activities Recorded</h4>
                    <p>There are no logged updates, timer sessions, or status changes for this task yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Rich Task Details Modal */}
        {taskDetailsModal.open && (
          <TaskDetailsModal
            open={taskDetailsModal.open}
            task={taskDetailsModal.task}
            employeeInfo={employee}
            onClose={() => setTaskDetailsModal({ open: false, task: null })}
            onStatusChange={handleStatusChangeFromModal}
            onRemarkAdded={handleAddRemarkFromModal}
            onCheckpointToggle={handleCheckpointToggle}
            canEdit={canEditCompanyTasks}
          />
        )}

        {/* Floating Toast Notification */}
        {toast.open && (
          <div className={`company-task-toast ${toast.type}`}>
            {toast.type === "success" && <FiCheckCircle size={18} />}
            {toast.type === "error" && <FiAlertTriangle size={18} />}
            {toast.type === "info" && <FiRefreshCw size={18} className="spin-icon" />}
            <span>{toast.message}</span>
            <button type="button" className="btn-close-toast" onClick={() => setToast({ open: false, message: "", type: "success" })}>
              <FiX size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

class CompanyTaskErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("CompanyAllTaskTasks ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "12px", margin: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "12px" }}>Unable to load task page</h2>
          <p style={{ color: "#64748b", marginBottom: "20px" }}>{this.state.error?.message || "An unexpected error occurred while displaying employee tasks."}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/ciisUser/company-all-task"}
              style={{ padding: "10px 20px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
            >
              Back to Employees
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const SafeCompanyAllTaskTasks = (props) => (
  <CompanyTaskErrorBoundary>
    <CompanyAllTaskTasks {...props} />
  </CompanyTaskErrorBoundary>
);

export default SafeCompanyAllTaskTasks;
