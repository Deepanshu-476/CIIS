import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import axios from "../../../utils/axiosConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TaskDetailsModal from "../../components/TaskDetailsModal";
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
import "./CompanyAllTaskTasks.css";

const cleanActivityDescription = (desc, action) => {
  if (!desc) {
    if (!action) return "Activity logged";
    const formattedAction = String(action).replace(/_/g, " ").replace(/-/g, " ");
    return formattedAction.charAt(0).toUpperCase() + formattedAction.slice(1);
  }

  let text = String(desc);

  // Format messy Date strings like "Sun Oct 25 2026 00:00:00 GMT+0000 (Coordinated Universal Time)"
  text = text.replace(/"[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}\s+[\d:]+\s+GMT[^\"]*"/g, (match) => {
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
  if (task?.source === "assigned" || task?.source === "client") return "assigned";
  if (task?.taskType === "assigned" || task?.taskType === "client") return "assigned";
  if (task?.clientId || task?.isClientTask || task?.assignedBy) return "assigned";
  if (task?.userStatus && !task?.status) return "assigned";
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
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
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

  taskList.forEach((t) => {
    const s = getDisplayStatus(t);
    if (s === "completed") {
      completed++;
    } else if (s === "in-progress") {
      if (isOverdue(t)) overdue++;
      else inProgress++;
    } else if (isOverdue(t)) {
      overdue++;
    } else {
      pending++;
    }
  });

  return {
    total: taskList.length,
    pending,
    inProgress,
    completed,
    overdue,
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

const buildCompanyTaskCacheKey = ({ userId, page, limit, startDate, endDate, search, status, priority }) => {
  const query = new URLSearchParams({
    page: String(page || 1),
    limit: String(limit || 10),
    startDate: startDate || "",
    endDate: endDate || "",
    search: search || "",
    status: status || "all",
    priority: priority || "all",
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
  const initialStartDate = searchParams.get("startDate") || todayStr;
  const initialEndDate = searchParams.get("endDate") || todayStr;
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
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Attendance Calendar State & View Controls
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);
  const [attViewMode, setAttViewMode] = useState("calendar"); // "calendar" | "table"
  const [attFilter, setAttFilter] = useState("all");

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
    submitting: false,
    error: "",
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

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    employeeRef.current = employee;
  }, [employee]);

  useEffect(() => {
    taskDetailsByIdRef.current = taskDetailsById;
  }, [taskDetailsById]);

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

        const isSuperRole = currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.isSuperAdmin;
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
      };

      const response = await axios.get(`/task/user/${effectiveUserId}/all-tasks`, { params });
      if (fetchRequestIdRef.current !== requestId) return;

      const data = response.data || {};
      const fetchedTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const apiStats = data.stats || data.statusCounts;
      const computedStats = apiStats ? {
        total: Number(apiStats.total) || 0,
        pending: Number(apiStats.pending?.count ?? apiStats.pending) || 0,
        inProgress: Number(apiStats.inProgress?.count ?? apiStats.inProgress) || 0,
        completed: Number(apiStats.completed?.count ?? apiStats.completed) || 0,
        overdue: Number(apiStats.overdue?.count ?? apiStats.overdue) || 0,
        onhold: Number(apiStats.onhold?.count ?? apiStats.onhold) || 0,
      } : countStats(fetchedTasks);

      setTasks(fetchedTasks);
      setStats(computedStats);
      setWorkSummary(data.workSummary || null);
      setPerformanceMetrics(data.performance || null);
      setTotal(data.pagination?.total || data.total || fetchedTasks.length);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);

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
  }, [effectiveUserId, endDate, limit, page, priority, search, startDate, status]);

  // Fetch Attendance for Attendance Tab
  const fetchAttendance = useCallback(async (targetDate) => {
    if (!effectiveUserId) return;
    setAttendanceLoading(true);
    setAttendanceError("");
    try {
      const d = targetDate instanceof Date ? targetDate : calDate;
      const res = await axios.get(`/attendance/user/${effectiveUserId}`, {
        params: {
          month: d.getMonth(),
          year: d.getFullYear(),
        }
      });
      const records = res.data?.data || [];
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
    if ((activeTab === "attendance" || activeTab === "performance") && attendanceRecords.length === 0) {
      fetchAttendance();
    }
  }, [activeTab, attendanceRecords.length, fetchAttendance]);

  const fetchTaskDetails = useCallback(async (task) => {
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

    // Universal Activity Logs endpoint works for all task types
    endpoints.push({ key: "activityLogs", url: `/task/${task._id}/activity-logs` });

    const fallbackLogs = Array.isArray(task.activityLogs) && task.activityLogs.length > 0
      ? task.activityLogs
      : (Array.isArray(task.statusHistory) ? task.statusHistory : []);

    const details = {
      remarks: Array.isArray(task.remarks) ? [...task.remarks] : [],
      activityLogs: [...fallbackLogs],
    };

    await Promise.all(
      endpoints.map(async ({ key, url }) => {
        try {
          const res = await axios.get(url);
          const data = res.data?.logs || res.data?.activityLogs || res.data?.remarks || res.data?.data || res.data;
          if (Array.isArray(data) && data.length > 0) {
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

  const openAssignModal = () => {
    setAssignModal({
      open: true,
      title: "",
      description: "",
      priority: "medium",
      dueDateTime: getDefaultToday7PM(),
      checkpoints: [],
      newCheckpointText: "",
      submitting: false,
      error: "",
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
    if (!effectiveUserId) {
      setAssignModal((prev) => ({ ...prev, error: "Target employee not found" }));
      return;
    }

    setAssignModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const payload = {
        title: assignModal.title.trim(),
        description: assignModal.description.trim() || undefined,
        assignedTo: [effectiveUserId],
        priority: assignModal.priority || "medium",
        dueDateTime: assignModal.dueDateTime ? new Date(assignModal.dueDateTime).toISOString() : undefined,
        checkpoints: assignModal.checkpoints.map((c) => ({ title: c.title })),
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
  };

  const handleSetAllDatesFilter = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
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
        ? `/tasks/client-tasks/${task._id}`
        : source === "project"
          ? `/tasks/project/${task.projectId}/tasks/${task._id}/status`
          : source === "self"
            ? `/tasks/self/${task._id}/status`
            : `/task/${task._id}/status`;
    const payload =
      source === "client"
        ? { status: nextStatus, completed: nextStatus === "completed", allowCompanyAllTaskEdit: true }
        : { status: nextStatus, remarks: "Status updated from Company All Task", allowCompanyAllTaskEdit: true };

    // Optimistic UI update
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        String(t._id || "") === String(task._id || "")
          ? { ...t, status: nextStatus, overallStatus: nextStatus, completed: nextStatus === "completed" }
          : t
      )
    );
    setTaskDetailsById((prev) => ({
      ...prev,
      [task._id]: {
        ...(prev[task._id] || {}),
        status: nextStatus,
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

  const handleCheckpointToggle = async (task, checkpoint) => {
    if (!task?._id || !checkpoint?._id) return;

    const source = getTaskSource(task);
    const endpoint =
      source === "client"
        ? `/tasks/client-tasks/${task._id}/checkpoints/${checkpoint._id}`
        : source === "project"
          ? `/tasks/project/${task.projectId}/tasks/${task._id}/checkpoints/${checkpoint._id}`
          : source === "self"
            ? `/tasks/self/${task._id}/checkpoints/${checkpoint._id}`
            : `/tasks/assigned/${task._id}/checkpoints/${checkpoint._id}`;

    const nextCompleted = !checkpoint.completed;

    // Optimistic UI update
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (String(t._id || "") === String(task._id || "")) {
          const updatedCps = (t.checkpoints || []).map((cp) =>
            String(cp._id || "") === String(checkpoint._id || "")
              ? { ...cp, completed: nextCompleted }
              : cp
          );
          return { ...t, checkpoints: updatedCps };
        }
        return t;
      })
    );

    setError("");
    try {
      await axios.patch(endpoint, { completed: nextCompleted });
    } catch (err) {
      console.error("Failed to update checkpoint:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to update checkpoint.");
      fetchTasks();
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
        overallStatus: updatedStatus,
        completed: updatedStatus === "completed",
        checkpoints: cleanCheckpoints,
        loading: false,
      },
    }));

    // 2. CLOSE MODAL IMMEDIATELY
    closeEditModal();
    setError("");

    // 3. BACKGROUND PERSISTENCE: Single fast request
    try {
      if (source === "client") {
        await axios.put(`/tasks/client-tasks/${task._id}`, {
          name: updatedTitle,
          description: updatedDesc,
          dueDate: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          completed: updatedStatus === "completed",
          checkpoints: cleanCheckpoints,
          allowCompanyAllTaskEdit: true,
        });
      } else if (source === "project") {
        await axios.put(`/tasks/project/${task.projectId}/tasks/${task._id}`, {
          title: updatedTitle,
          description: updatedDesc,
          dueDateTime: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          checkpoints: cleanCheckpoints,
          allowCompanyAllTaskEdit: true,
        });
      } else if (source === "self") {
        await axios.put(`/tasks/self/${task._id}`, {
          title: updatedTitle,
          description: updatedDesc,
          dueDateTime: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          checkpoints: cleanCheckpoints,
          allowCompanyAllTaskEdit: true,
        });
      } else {
        await axios.put(`/task/${task._id}`, {
          title: updatedTitle,
          description: updatedDesc,
          dueDateTime: dueDateIso,
          priority: updatedPriority,
          status: updatedStatus,
          checkpoints: cleanCheckpoints,
          allowCompanyAllTaskEdit: true,
        });
      }
    } catch (err) {
      console.error("Failed to save task update to server:", err);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to update task.");
      fetchTasks();
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

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
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
          cleanDesc.length > 80 ? `${cleanDesc.substring(0, 77)}...` : cleanDesc,
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
          fontSize: 8,
          textColor: [30, 41, 59],
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: 26, halign: "center" },
          1: { cellWidth: 140 },
          2: { cellWidth: 230 },
          3: { cellWidth: 55, halign: "center" },
          4: { cellWidth: 65, halign: "center" },
          5: { cellWidth: 55, halign: "center" },
          6: { cellWidth: 70, halign: "center" },
          7: { cellWidth: 55, halign: "center" },
        },
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

  // Weekly Productivity (Mon - Sun): Dynamic calculation for current week only
  const weeklyProductivity = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const distanceToMonday = (dayOfWeek + 6) % 7; // 0 = Mon, 1 = Tue, ..., 6 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  const productivityScore = useMemo(() => {
    const inputs = [
      { value: completionRate, weight: 50 },
      ...(Number.isFinite(onTimeRate) ? [{ value: onTimeRate, weight: 30 }] : []),
      ...(Number.isFinite(attendanceReliability) ? [{ value: attendanceReliability, weight: 20 }] : []),
    ];
    const totalWeight = inputs.reduce((sum, input) => sum + input.weight, 0);
    return totalWeight ? Math.round(inputs.reduce((sum, input) => sum + input.value * input.weight, 0) / totalWeight) : 0;
  }, [attendanceReliability, completionRate, onTimeRate]);

  const personalTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      const type = getTaskType(t);
      return type === "self" || type === "personal";
    }).length;
  }, [tasks]);

  const workTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      const type = getTaskType(t);
      return type === "assigned" || type === "project" || type === "client";
    }).length;
  }, [tasks]);

  const projectOptions = useMemo(() => {
    const values = tasks.map((task) => task.project?.name || task.projectName || task.project?.title || task.project).filter((value) => typeof value === "string" && value.trim());
    return [...new Set(values.map((value) => value.trim()))];
  }, [tasks]);

  const clientOptions = useMemo(() => {
    const values = tasks.map((task) => task.client?.name || task.clientName || task.client?.companyName || task.client).filter((value) => typeof value === "string" && value.trim());
    return [...new Set(values.map((value) => value.trim()))];
  }, [tasks]);

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
          { key: "overdue", label: "Overdue", color: "#dc2626", matches: (task) => isOverdue(task) },
          { key: "other", label: "Other Statuses", color: "#64748b", matches: (task) => !["in-progress", "pending", "completed"].includes(getDisplayStatus(task)) && !isOverdue(task) },
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

      const recordStatus = String(record?.status || "").toUpperCase();
      const hasAttendanceRecord = Boolean(record) && !["", "NO RECORD", "UPCOMING"].includes(recordStatus);
      let status = "NO RECORD";
      if (hasAttendanceRecord) {
        status = recordStatus;
      } else if (isWeekend) {
        status = "WEEKEND";
      } else if (dateKey < todayStr) {
        // A past working day with no attendance record and no leave/holiday
        // record is an absence. Keep today as "No Log" until the day ends.
        status = "ABSENT";
      } else if (dateKey > todayStr) {
        status = "UPCOMING";
      }

      days.push({
        day: d,
        dateKey,
        record,
        status,
        isToday: dateKey === todayStr,
      });
    }
    return days;
  }, [attendanceRecords, calDate, todayStr]);

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

  // Monthly Attendance Metrics
  const monthStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let halfday = 0;
    let absent = 0;
    let leave = 0;

    attendanceRecords.forEach((r) => {
      const s = String(r.status || "").toUpperCase();
      if (s === "PRESENT") present++;
      else if (s === "LATE") late++;
      else if (s === "HALF DAY" || s === "HALFDAY") halfday++;
      else if (s === "ABSENT") absent++;
      else if (s === "LEAVE" || s === "HOLIDAY") leave++;
    });

    const workingDays = present + late + halfday + absent;
    const rate = workingDays > 0
      ? Math.round(((present + late + (halfday * 0.5)) / workingDays) * 100)
      : (attendanceRecords.length > 0 ? 100 : 0);

    return {
      present,
      late,
      halfday,
      absent,
      leave,
      totalWorking: workingDays,
      attendanceRate: rate,
    };
  }, [attendanceRecords]);

  // Filtered History Log for Table View
  const filteredAttendanceLogs = useMemo(() => {
    if (attFilter === "all") return attendanceRecords;
    if (attFilter === "present") return attendanceRecords.filter((r) => String(r.status || "").toUpperCase() === "PRESENT");
    if (attFilter === "late") return attendanceRecords.filter((r) => String(r.status || "").toUpperCase() === "LATE");
    if (attFilter === "halfday") return attendanceRecords.filter((r) => ["HALF DAY", "HALFDAY"].includes(String(r.status || "").toUpperCase()));
    if (attFilter === "absent") return attendanceRecords.filter((r) => String(r.status || "").toUpperCase() === "ABSENT");
    if (attFilter === "leave") return attendanceRecords.filter((r) => ["LEAVE", "HOLIDAY"].includes(String(r.status || "").toUpperCase()));
    return attendanceRecords;
  }, [attendanceRecords, attFilter]);

  const employeeName = employee?.name || "—";
  const isRawObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || "").trim());
  const employeeRoleValue = [employee?.role, employee?.jobRole, employee?.companyRole]
    .find((value) => value && !isRawObjectId(value));
  const employeeDeptValue = employee?.department?.name || employee?.department;
  const employeeRole = !isRawObjectId(employeeRoleValue) && employeeRoleValue ? employeeRoleValue : "—";
  const employeeDept = !isRawObjectId(employeeDeptValue) && employeeDeptValue ? employeeDeptValue : "—";
  const employeeEmail = employee?.email || "";
  const employeePhone = employee?.phone || employee?.mobile || "";

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
                {employeeDept && <><span className="bullet">&bull;</span><span>{employeeDept}</span></>}
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
              <FiDownload size={14} /> Export
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
                      <strong>{workSummary?.totalClockedLabel || "4h 38m"}</strong>
                    </div>
                  </div>

                  <div className="summary-pill-card">
                    <div className="summary-icon blue"><FiBarChart2 size={18} /></div>
                    <div className="summary-info">
                      <span>Task Tracked</span>
                      <strong>{workSummary?.trackedTaskLabel || "3h 15m"}</strong>
                    </div>
                  </div>

                  <div className="summary-pill-card">
                    <div className="summary-icon orange"><FiClock size={18} /></div>
                    <div className="summary-info">
                      <div className="untracked-label-with-alert">
                        <span>Untracked</span>
                        <FiAlertTriangle size={13} className="untracked-warning-icon" />
                      </div>
                      <strong>{workSummary?.untrackedLabel || "1h 23m"}</strong>
                    </div>
                  </div>

                  <div className="summary-pill-card">
                    <div className="summary-icon purple"><FiZap size={18} /></div>
                    <div className="summary-info">
                      <span>Productivity</span>
                      <strong>{completionRate > 0 ? `${completionRate}%` : "70%"}</strong>
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
                  className={`task-pill work ${taskTypeFilter === "work" ? "active" : ""}`}
                  onClick={() => { setTaskTypeFilter(taskTypeFilter === "work" ? "all" : "work"); setStatus("all"); setPage(1); }}
                >
                  Work <span className="pill-badge">{workTasksCount || 0}</span>
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

                        // Dynamic calculation of time spent (from task.workTime, task.timeSpent, or task.timeTracking)
                        const rawSeconds = Number(task.workTime?.seconds || task.timeSpent || task.timeTracking?.totalSeconds || 0);
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
                                      <span className="badge-pill source">
                                        <FiUser size={11} /> {getTaskType(task) === "assigned" ? "Assigned" : "Personal"}
                                      </span>
                                      <span className="badge-pill date">
                                        <FiCalendar size={11} /> {getDueDate(task) ? formatDate(getDueDate(task)) : "No due date"}
                                      </span>
                                      <span className="badge-pill duration">
                                        <FiClock size={11} /> {timeEstimateBadge}
                                      </span>
                                      <span className={`badge-pill priority ${task.priority || "medium"}`}>
                                        <span className="pri-dot" /> {(task.priority || "Medium")}
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
                                    <button
                                      type="button"
                                      className="btn-edit-task-action"
                                      onClick={() => openEditModal(task)}
                                      title="Edit Task"
                                    >
                                      <FiEdit2 size={13} /> Edit
                                    </button>
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
                                  <div className="cp-checklist">
                                    {checkpoints.map((cp, idx) => (
                                      <label className={`cp-item ${cp.completed ? "completed" : ""}`} key={cp._id || idx}>
                                        <input
                                          type="checkbox"
                                          checked={Boolean(cp.completed)}
                                          disabled={!isTaskEditable || savingTaskId === task._id}
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
            {totalPages > 1 && (
              <div className="company-task-pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
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
                            <span className="badge-pill source">{getTaskType(t) === "assigned" ? "Assigned" : "Personal"}</span>
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
              </div>

              <div className="att-kpi-card att-kpi-late">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap amber">
                    <FiClock size={20} />
                  </div>
                  {monthStats.late > 0 && <span className="att-kpi-badge amber">{monthStats.late} Flags</span>}
                </div>
                <div className="att-kpi-value">{monthStats.late}</div>
                <div className="att-kpi-title">Late Arrivals</div>
                <span className="att-kpi-hint">Punched after shift start</span>
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
                <span className="att-kpi-hint">No punch or leave applied</span>
              </div>

              <div className="att-kpi-card att-kpi-leave">
                <div className="att-kpi-top">
                  <div className="att-kpi-icon-wrap violet">
                    <FiCalendar size={20} />
                  </div>
                  <span className="att-kpi-badge violet">Approved</span>
                </div>
                <div className="att-kpi-value">{monthStats.leave}</div>
                <div className="att-kpi-title">Leaves & Holidays</div>
                <span className="att-kpi-hint">Official approved off days</span>
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
                    <div className="legend-chip leave"><span className="dot" /> Leave / Holiday</div>
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
                      const isLev = s === "LEAVE" || s === "HOLIDAY";
                      const isWknd = s === "WEEKEND";
                      const isUpc = s === "UPCOMING";
                      const isSelected = selectedDayRecord && getDateInputValue(new Date(selectedDayRecord.date)) === cell.dateKey;

                      const statusClass = isPres ? "status-present" :
                        isLate ? "status-late" :
                          isHalf ? "status-halfday" :
                            isAbs ? "status-absent" :
                              isLev ? "status-leave" :
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
                                        isWknd ? "Weekend" :
                                          isUpc ? "Upcoming" : "No Log"}
                            </span>
                          </div>

                          {(cell.record?.inTime || cell.record?.totalTime) && (
                            <div className="att-cell-timing-preview">
                              {cell.record?.inTime ? formatTimeOnly(cell.record.inTime) : ""}
                              {cell.record?.outTime ? ` - ${formatTimeOnly(cell.record.outTime)}` : ""}
                              {!cell.record?.outTime && cell.record?.isClockedIn ? " · Clocked In" : ""}
                              {!cell.record?.outTime && cell.record?.totalTime ? ` (${cell.record.totalTime})` : ""}
                            </div>
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
                      <span className={`inspector-status-badge ${String(selectedDayRecord.status).toUpperCase() === "PRESENT" ? "present" :
                          String(selectedDayRecord.status).toUpperCase() === "LATE" ? "late" :
                            ["HALF DAY", "HALFDAY"].includes(String(selectedDayRecord.status).toUpperCase()) ? "halfday" :
                              ["LEAVE", "HOLIDAY"].includes(String(selectedDayRecord.status).toUpperCase()) ? "leave" :
                                String(selectedDayRecord.status).toUpperCase() === "WEEKEND" ? "weekend" : "absent"
                        }`}>
                        <span className="pulsing-circle" />
                        {String(selectedDayRecord.status || "ABSENT").toUpperCase()}
                      </span>
                    )}
                  </div>

                  {selectedDayRecord ? (
                    <div className="att-inspector-body">
                      {/* Shift & Policy Banner */}
                      <div className="inspector-shift-banner">
                        <FiClock size={15} />
                        <span>Schedule: <strong>{selectedDayRecord.shiftName || employee?.shiftName || "General Shift (09:30 AM - 06:30 PM)"}</strong></span>
                      </div>

                      {/* 2x2 Punch Timing Metrics */}
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
                              : "No punch recorded"}
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
                              : (selectedDayRecord.inTime ? "Currently Clocked In" : "No punch recorded")}
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
                  </div>
                  <span className="log-count-text">Showing {filteredAttendanceLogs.length} entries</span>
                </div>

                <div className="timetrack-table-wrapper">
                  <table className="modern-data-table att-table">
                    <thead>
                      <tr>
                        <th>Date & Day</th>
                        <th>Status</th>
                        <th>Punch In</th>
                        <th>Punch Out</th>
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
                          const isLeave = s === "LEAVE" || s === "HOLIDAY";
                          const isWknd = s === "WEEKEND";

                          const statusClass = isPres ? "present" :
                            isLate ? "late" :
                              isHalf ? "halfday" :
                                isLeave ? "leave" :
                                  isWknd ? "weekend" : "absent";

                          return (
                            <tr key={rec._id || rec.date}>
                              <td>
                                <strong>{formatDate(rec.date)}</strong>
                              </td>
                              <td>
                                <span className={`status-badge-att ${statusClass}`}>
                                  ● {s}
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
                                {rec.lateBy ? (
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
            <div className="performance-kpi-grid">
              <div className="kpi-card">
                <div className="kpi-top">
                  <FiAward size={20} className="kpi-icon gold" />
                  <span className="kpi-title">Productivity Score</span>
                </div>
                <div className="kpi-value">{productivityScore}%</div>
                <span className="kpi-note">{productivityScore >= 80 ? "Excellent Performer" : productivityScore >= 60 ? "Good Performance" : "Needs Improvement"}</span>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <FiCheckCircle size={20} className="kpi-icon green" />
                  <span className="kpi-title">Completion Rate</span>
                </div>
                <div className="kpi-value">{completionRate}%</div>
                <span className="kpi-note">{stats.completed} of {stats.total || tasks.length} tasks completed</span>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <FiClock size={20} className="kpi-icon blue" />
                  <span className="kpi-title">On-Time Delivery</span>
                </div>
                <div className="kpi-value">{Number.isFinite(onTimeRate) ? `${onTimeRate}%` : "—"}</div>
                <span className="kpi-note">{performanceMetrics?.completedWithDueDate || 0} completed tasks with a deadline</span>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <FiAlertTriangle size={20} className="kpi-icon red" />
                  <span className="kpi-title">Overdue Rate</span>
                </div>
                <div className="kpi-value">
                  {stats.total ? Math.round((stats.overdue / stats.total) * 100) : 0}%
                </div>
                <span className="kpi-note">{stats.overdue} tasks past due</span>
              </div>
            </div>

            <div className="overview-grid-top">
              {/* Task Breakdown Progress Bars */}
              <div className="overview-card">
                <div className="card-header-line">
                  <h3><FiBarChart2 size={16} /> Task Status Distribution</h3>
                </div>
                <div className="perf-distribution-list">
                  <div className="perf-bar-group">
                    <div className="bar-label-row">
                      <span>Completed</span>
                      <strong>{stats.completed} ({completionRate}%)</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${completionRate}%`, backgroundColor: "#10b981" }} />
                    </div>
                  </div>

                  <div className="perf-bar-group">
                    <div className="bar-label-row">
                      <span>In Progress</span>
                      <strong>{stats.inProgress} ({stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}%`, backgroundColor: "#0ea5e9" }} />
                    </div>
                  </div>

                  <div className="perf-bar-group">
                    <div className="bar-label-row">
                      <span>Pending</span>
                      <strong>{stats.pending} ({stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%)</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%`, backgroundColor: "#f59e0b" }} />
                    </div>
                  </div>

                  <div className="perf-bar-group">
                    <div className="bar-label-row">
                      <span>Overdue</span>
                      <strong>{stats.overdue} ({stats.total ? Math.round((stats.overdue / stats.total) * 100) : 0}%)</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${stats.total ? Math.round((stats.overdue / stats.total) * 100) : 0}%`, backgroundColor: "#dc2626" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Efficiency Summary */}
              <div className="overview-card">
                <div className="card-header-line">
                  <h3><FiTrendingUp size={16} /> Workload & Efficiency</h3>
                </div>
                <div className="efficiency-details-list">
                  <div className="eff-item">
                    <span className="eff-label">Total Assigned Tasks</span>
                    <strong className="eff-val">{stats.total || tasks.length}</strong>
                  </div>
                  <div className="eff-item">
                    <span className="eff-label">Tracked Task Hours</span>
                    <strong className="eff-val text-blue">{workSummary?.trackedTaskLabel || "0m"}</strong>
                  </div>
                  <div className="eff-item">
                    <span className="eff-label">Total Clocked Time</span>
                    <strong className="eff-val text-green">{workSummary?.totalClockedLabel || "0m"}</strong>
                  </div>
                  <div className="eff-item">
                    <span className="eff-label">Untracked Ratio</span>
                    <strong className="eff-val text-orange">{workSummary?.untrackedLabel || "0m"}</strong>
                  </div>
                  <div className="eff-item">
                    <span className="eff-label">Attendance Reliability</span>
                    <strong className="eff-val text-purple">
                      {Number.isFinite(attendanceReliability) ? `${attendanceReliability}%` : "—"}
                    </strong>
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
                    <label>Due Date & Time</label>
                    <input
                      type="datetime-local"
                      value={assignModal.dueDateTime}
                      onChange={(e) => setAssignModal((prev) => ({ ...prev, dueDateTime: e.target.value }))}
                    />
                  </div>
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
                        <span className="modern-cp-num">{idx + 1}</span>
                        <input
                          type="text"
                          className="modern-cp-input"
                          value={cp.title}
                          placeholder="e.g. Design review with client"
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
            onCheckpointToggle={async (task, cp) => {
              await handleCheckpointToggle(task, cp);
              setTaskDetailsModal((prev) => {
                if (!prev.open || !prev.task) return prev;
                const updatedCps = Array.isArray(prev.task.checkpoints)
                  ? prev.task.checkpoints.map((c) => (String(c._id || c.id) === String(cp._id || cp.id) ? { ...c, completed: !c.completed } : c))
                  : [];
                return { ...prev, task: { ...prev.task, checkpoints: updatedCps } };
              });
            }}
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

export default CompanyAllTaskTasks;
