import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "../../../utils/axiosConfig";
import API_URL from "../../../config";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./EmpAllTask.css";
import { getCurrentUserId, getStoredUser, loadPagePermission, getUserPageScope } from "../../../utils/pageAccess";

const getRecordId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || value.branchId || value.value || '').trim();
  }
  return String(value).trim();
};
import {
  FiUsers, FiUser, FiCalendar, FiCheckCircle, FiClock,
  FiAlertCircle, FiXCircle, FiTrendingUp, FiList,
  FiArrowRight, FiX, FiBarChart2, FiPieChart, FiSearch,
  FiMail, FiBriefcase, FiMessageSquare, FiPlus, FiImage,
  FiCamera, FiZoomIn, FiSend, FiTrash2, FiFilter,
  FiCalendar as FiCal, FiChevronRight, FiChevronLeft,
  FiDownload, FiRefreshCw, FiEye, FiEyeOff, FiGrid,
  FiCheckSquare, FiArchive, FiTarget, FiPercent,
  FiAlertTriangle, FiActivity, FiTrendingDown, FiTrendingUp as FiTrendUp,
  FiChevronDown, FiChevronUp, FiStar, FiAward, FiBarChart,
  FiEdit3, FiExternalLink, FiMoreVertical, FiShare2, FiInfo, FiHash,
  FiPlay, FiPause, FiStopCircle, FiUserCheck, FiUserX, FiClock as FiTime, FiLogIn,
   FiClipboard, FiMonitor,
  FiPaperclip, FiMic, FiFileText
} from "react-icons/fi";


const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', color: '#6c757d', icon: FiGrid, bgColor: '#e9ecef' },
  { value: 'pending', label: 'Pending', color: '#ffc107', icon: FiClock, bgColor: '#fff3cd' },
  { value: 'in-progress', label: 'In Progress', color: '#17a2b8', icon: FiAlertCircle, bgColor: '#d1ecf1' },
  { value: 'completed', label: 'Completed', color: '#28a745', icon: FiCheckCircle, bgColor: '#d4edda' },
  { value: 'rejected', label: 'Rejected', color: '#dc3545', icon: FiXCircle, bgColor: '#f8d7da' },
  { value: 'overdue', label: 'Overdue', color: '#fd7e14', icon: FiAlertTriangle, bgColor: '#ffe5d0' },
  { value: 'onhold', label: 'On Hold', color: '#6f42c1', icon: FiAlertCircle, bgColor: '#e9d8fd' },
  { value: 'reopen', label: 'Reopen', color: '#e83e8c', icon: FiRefreshCw, bgColor: '#fcdce8' },
  { value: 'cancelled', label: 'Cancelled', color: '#6c757d', icon: FiX, bgColor: '#f8f9fa' },
];


const normalizeStatus = (status) => {
  if (!status) return 'pending';
  const lower = status.toLowerCase().trim();
  const mapping = {
    'in progress': 'in-progress',
    'inprogress': 'in-progress',
    'in-progress': 'in-progress',
    'on hold': 'onhold',
    'onhold': 'onhold',
    're open': 'reopen',
    're-open': 'reopen',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'pending': 'pending',
    'completed': 'completed',
    'rejected': 'rejected',
    'overdue': 'overdue',
  };
  return mapping[lower] || lower;
};

const getLocalDateStart = (value = new Date()) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const mapStatusCountsToTaskStats = (statusCounts = {}) => {
  const completed = statusCounts.completed?.count || 0;
  const total = statusCounts.total || 0;
  return {
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    pending: statusCounts.pending?.count || 0,
    inProgress: statusCounts.inProgress?.count || statusCounts['in-progress']?.count || 0,
    rejected: statusCounts.rejected?.count || 0,
    overdue: statusCounts.overdue?.count || 0,
    onhold: statusCounts.onhold?.count || statusCounts.onHold?.count || 0,
    reopen: statusCounts.reopen?.count || 0,
    cancelled: statusCounts.cancelled?.count || 0
  };
};

const emptyTaskStats = {
  total: 0,
  completed: 0,
  completionRate: 0,
  pending: 0,
  inProgress: 0,
  rejected: 0,
  overdue: 0,
  onhold: 0,
  reopen: 0,
  cancelled: 0
};

const getUserTaskStats = (user) => {
  return user?.taskStats || emptyTaskStats;
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const taskStatsRequests = new Map();

const fetchTaskStats = (payload, config) => {
  const requestKey = JSON.stringify(payload);
  const existingRequest = taskStatsRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = axios.post('/tasks/all/users/stats', payload, config)
    .finally(() => taskStatsRequests.delete(requestKey));
  taskStatsRequests.set(requestKey, request);
  return request;
};

const EMP_USERS_CACHE_TTL = 10 * 60 * 1000;
const EMP_USERS_CACHE_KEY_PREFIX = "ciis-emp-all-task-users-cache-v1";

const buildEmpUsersCacheKey = ({
  branchId = "",
  fromDate = "",
  toDate = "",
}) => [
  EMP_USERS_CACHE_KEY_PREFIX,
  String(branchId || ""),
  String(fromDate || ""),
  String(toDate || ""),
].join("|");

const readEmpUsersCache = (cacheKey) => {
  if (!cacheKey || typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > EMP_USERS_CACHE_TTL) return null;
    if (!Array.isArray(parsed.users) || parsed.users.length === 0) return null;

    return parsed;
  } catch {
    return null;
  }
};

const writeEmpUsersCache = (cacheKey, snapshot) => {
  if (!cacheKey || typeof window === "undefined") return;
  if (!Array.isArray(snapshot?.users) || snapshot.users.length === 0) return;

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      ...snapshot,
      savedAt: Date.now(),
    }));
  } catch {
    // Ignore storage quota and private-mode failures.
  }
};

const TASK_STAT_KEYS = ['pending', 'inProgress', 'completed', 'rejected', 'overdue', 'onhold', 'reopen', 'cancelled'];

const isObjectIdLike = value => /^[a-f\d]{24}$/i.test(String(value || '').trim());

const getUserBranchIds = (user = {}) => {
  const branchValues = [
    user.branch,
    user.branchId,
    user.branchDetails,
    ...(Array.isArray(user.assignedBranches) ? user.assignedBranches : []),
    ...(Array.isArray(user.branchIds) ? user.branchIds : [])
  ];

  return [...new Set(branchValues.map(getRecordId).filter(Boolean))];
};

const isUserInBranch = (user, branchId) => {
  if (!branchId) return true;
  return getUserBranchIds(user).includes(String(branchId));
};

const getRoleText = value => {
  if (!value) return '';
  if (typeof value === 'string') {
    const text = value.trim();
    return isObjectIdLike(text) ? '' : text;
  }
  return String(
    value.roleName ||
    value.name ||
    value.title ||
    value.jobRole ||
    value.companyRole ||
    ''
  ).trim();
};

const getMappedRoleText = (value, roleMap = {}) => {
  if (!value) return '';
  const roleId = typeof value === 'object' ? value._id || value.id || value.roleId || value.roleNumber : value;
  const mapped = roleMap[String(roleId || '')];
  return mapped || getRoleText(value);
};

const getUserDisplayRole = (user, roleMap = {}) => {
  const jobRole =
    getMappedRoleText(user?.jobRole, roleMap) ||
    getMappedRoleText(user?.roleId, roleMap);

  return (
    getRoleText(user?.roleName) ||
    getRoleText(user?.jobRoleName) ||
    jobRole ||
    getRoleText(user?.role) ||
    getRoleText(user?.designation) ||
    getRoleText(user?.position) ||
    getRoleText(user?.employeeRole) ||
    getRoleText(user?.companyRole) ||
    'Employee'
  );
};

const isTaskOverdueByDate = (dueDate, status) => {
  if (!dueDate) return false;
  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus === 'completed' || normalizedStatus === 'cancelled') return false;

  const today = getLocalDateStart();
  const dueDateStart = getLocalDateStart(dueDate);
  return Boolean(today && dueDateStart && dueDateStart < today);
};

const getTaskDueDate = task => task?.dueDateTime || task?.dueDate;

const getLogTimestamp = (log) => {
  const candidates = [
    log?.createdAt,
    log?.created_at,
    log?.timestamp,
    log?.updatedAt
  ];

  for (const value of candidates) {
    const date = value ? new Date(value) : null;
    if (date && !Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

const getTaskCompletionDate = (task, logs = []) => {
  const status = normalizeStatus(task?.userStatus || task?.status || task?.overallStatus);
  if (status !== 'completed') return null;

  const sortedLogs = Array.isArray(logs) ? [...logs].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0)) : [];

  for (let index = sortedLogs.length - 1; index >= 0; index -= 1) {
    const log = sortedLogs[index];
    if (!log) continue;

    const logAction = String(log.action || '').toLowerCase();
    const logStatus = normalizeStatus(log.newValues?.status || log.newValues?.taskStatus || log.newStatus);
    const logDescription = String(log.description || '').toLowerCase();

    if (
      logAction === 'status_updated' ||
      logAction === 'status_changed' ||
      logStatus === 'completed' ||
      logDescription.includes('completed')
    ) {
      const timestamp = getLogTimestamp(log);
      if (timestamp) return timestamp;
    }
  }

  const fallbackDates = [task?.completedAt, task?.completedOn, task?.updatedAt];
  for (const value of fallbackDates) {
    const date = value ? new Date(value) : null;
    if (date && !Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

const getTaskRelevantDate = (task, logs = []) => {
  const completionDate = getTaskCompletionDate(task, logs);
  if (completionDate) return completionDate;

  const source = String(task?.__taskSource || task?.taskSource || task?.source || '').toLowerCase();
  if (source === 'client') return task?.dueDate || task?.dueDateTime || task?.createdAt;
  if (source === 'project') return task?.createdAt;
  return getTaskDueDate(task) || task?.createdAt;
};

const getSourceAwareTaskDate = (task, logs = []) => getTaskRelevantDate(task, logs);


const getStatusObject = (status) => {
  const normalized = normalizeStatus(status);
  
  
  const found = STATUS_OPTIONS.find(s => s.value === normalized);
  if (found) return found;
  
  
  const defaultStatus = {
    'pending': { value: 'pending', label: 'Pending', color: '#ffc107', bgColor: '#fff3cd' },
    'in-progress': { value: 'in-progress', label: 'In Progress', color: '#17a2b8', bgColor: '#d1ecf1' },
    'completed': { value: 'completed', label: 'Completed', color: '#28a745', bgColor: '#d4edda' },
    'rejected': { value: 'rejected', label: 'Rejected', color: '#dc3545', bgColor: '#f8d7da' },
    'overdue': { value: 'overdue', label: 'Overdue', color: '#fd7e14', bgColor: '#ffe5d0' },
    'onhold': { value: 'onhold', label: 'On Hold', color: '#6f42c1', bgColor: '#e9d8fd' },
    'reopen': { value: 'reopen', label: 'Reopen', color: '#e83e8c', bgColor: '#fcdce8' },
    'cancelled': { value: 'cancelled', label: 'Cancelled', color: '#6c757d', bgColor: '#f8f9fa' }
  };
  
  return defaultStatus[normalized] || defaultStatus.pending;
};


const getTaskType = (task) => {
  
  if (task.source === 'assigned') return 'assigned';
  if (task.source === 'personal') return 'personal';
  if (task.source === 'client') return 'assigned'; 
  
  
  if (task.taskType === 'assigned' || task.taskType === 'client') return 'assigned';
  if (task.taskType === 'personal') return 'personal';
  
  
  if (task.clientId || task.isClientTask === true) return 'assigned';
  
  
  if (task.assignedBy) return 'assigned';
  
  
  if (task.userStatus && !task.status) return 'assigned';
  
  
  return 'personal';
};


const getImageUrl = (imagePath) => {
  if (!imagePath) return '';

  void 0;

  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  const baseUrl = API_URL;
  const baseUrlWithoutApi = baseUrl.replace(/\/api$/, ''); 

  
  let cleanPath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  
  if (cleanPath.startsWith('uploads/')) {
    
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('client-remarks/')) {
    
    return `${baseUrlWithoutApi}/uploads/${cleanPath}`;
  }
  
  
  const filename = cleanPath.split('/').pop();
  return `${baseUrlWithoutApi}/uploads/client-remarks/${filename}`;
};

const TaskDetails = () => {
  const navigate = useNavigate();
  const [pageAccessReady, setPageAccessReady] = useState(false);
  const [pageScope, setPageScope] = useState(null);
  const { userId: routeUserId } = useParams();
  const isTaskPageMode = Boolean(routeUserId);

  useEffect(() => {
    let active = true;

    const loadTaskPermissions = async () => {
      try {
        const [pageMain, pageTasks] = await Promise.all([
          loadPagePermission('/ciisUser/company-all-task'),
          loadPagePermission('/ciisUser/company-all-task/tasks')
        ]);
        if (!active) return;

        const currentUserIdValue = getCurrentUserId();
        const scopeMain = getUserPageScope(pageMain, currentUserIdValue);
        const scopeTasks = getUserPageScope(pageTasks, currentUserIdValue);
        const scope = {
          canView: Boolean(scopeMain?.canView || scopeTasks?.canView),
          canEdit: Boolean(scopeMain?.canEdit || scopeTasks?.canEdit),
          canDelete: Boolean(scopeMain?.canDelete || scopeTasks?.canDelete),
          canApprove: Boolean(scopeMain?.canApprove || scopeTasks?.canApprove),
          allowedUserIds: Array.from(new Set([...(scopeMain?.allowedUserIds || []), ...(scopeTasks?.allowedUserIds || [])]))
        };
        setPageScope(scope);
      } catch (err) {
        console.error('Failed to load company-all-task permissions:', err);
      } finally {
        if (active) setPageAccessReady(true);
      }
    };

    loadTaskPermissions();
    return () => {
      active = false;
    };
  }, []);

  
  const isMounted = useRef(true);
  const hasFetchedUsers = useRef(false);
  const fetchUsersTimeoutRef = useRef(null);
  const fetchingTasksForUser = useRef(null);
  const snackbarTimerRef = useRef(null);
  const skipNextTaskFetchRef = useRef(false);
  const usersFetchRequestRef = useRef(0);
  const usersRef = useRef([]);

  
  const [users, setUsers] = useState([]);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState("");

  
  const [departmentMap, setDepartmentMap] = useState({});
  const [jobRoleMap, setJobRoleMap] = useState({});

  
  const [activityLogs, setActivityLogs] = useState([]);
  const [allTaskLogs, setAllTaskLogs] = useState({});
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [selectedTaskForActivity, setSelectedTaskForActivity] = useState(null);

  
  const [remarksDialog, setRemarksDialog] = useState({ open: false, taskId: null, remarks: [] });
  const [zoomImage, setZoomImage] = useState(null);
  const [loadingRemarks, setLoadingRemarks] = useState(false);

  
  const [taskTimeTracking, setTaskTimeTracking] = useState({});
  const [todayTotalTime, setTodayTotalTime] = useState({
    totalSeconds: 0,
    displayText: '0s'
  });

  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserCompanyRole, setCurrentUserCompanyRole] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilters, setActiveStatusFilters] = useState(['all']);
  const [showStatusFilters, setShowStatusFilters] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [globalFromDate, setGlobalFromDate] = useState("");
  const [globalToDate, setGlobalToDate] = useState("");
  const [clockedInTodayOnly, setClockedInTodayOnly] = useState(false);
  const [todayClockedInUserIds, setTodayClockedInUserIds] = useState(new Set());
  const [todayClockedInLoading, setTodayClockedInLoading] = useState(false);
  const [taskPage, setTaskPage] = useState(1);
  const [taskLimit, setTaskLimit] = useState(10);
  const [taskTotal, setTaskTotal] = useState(0);
  const [taskTotalPages, setTaskTotalPages] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // New UI Filters and View state matching reference design
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedPerfFilter, setSelectedPerfFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('grid');
  const [activeDeptTab, setActiveDeptTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDepts, setExpandedDepts] = useState({});
  const pageSize = 24;

  const today = new Date();

  const openUserTasksPage = useCallback((userId) => {
    if (!userId) return;
    const selectedUser = users.find((user) => String(user._id || user.id) === String(userId));
    const params = new URLSearchParams();
    const todayStr = getDateInputValue();
    params.set('startDate', globalFromDate || todayStr);
    params.set('endDate', globalToDate || todayStr);
    const query = params.toString() ? `?${params.toString()}` : '';
    navigate(`/ciisUser/company-all-task/tasks/${userId}${query}`, {
      state: {
        employee: selectedUser ? { ...selectedUser, _id: selectedUser._id || selectedUser.id } : null,
        taskStats: selectedUser?.taskStats || null,
      },
    });
  }, [globalFromDate, globalToDate, navigate, users]);

  
  useEffect(() => {
    isMounted.current = true;

    
    return () => {
      isMounted.current = false;
      if (fetchUsersTimeoutRef.current) {
        clearTimeout(fetchUsersTimeoutRef.current);
      }
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
    };
  }, []);

  
  const showSnackbar = useCallback((message, severity = 'info') => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
    }

    setSnackbar({
      open: true,
      message,
      severity
    });

    snackbarTimerRef.current = setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 3000);
  }, []);

  

  const isOwner = useCallback(() => {
    const role = String(currentUserRole || '').trim().toLowerCase();
    const compRole = String(currentUserCompanyRole || '').trim().toLowerCase();
    const adminRoles = [
      'owner', 'company_owner', 'companyowner', 'super_admin', 'superadmin',
      'admin', 'hr', 'manager', 'career infowis admin', 'super admin'
    ];
    return adminRoles.includes(role) || adminRoles.includes(compRole);
  }, [currentUserCompanyRole, currentUserRole]);

  const getCompanyName = (company) => {
    if (!company) return 'N/A';
    if (typeof company === 'object') {
      return company.companyName || company.name || company._id || 'N/A';
    }
    return company;
  };

  const getDepartmentName = (department) => {
    if (!department) return 'Unassigned';

    let raw = '';
    if (typeof department === 'object') {
      raw = department.name || department.departmentName || department.title || department._id || 'Unassigned';
    } else if (typeof department === 'string') {
      if (departmentMap[department]) {
        raw = departmentMap[department];
      } else if (department.startsWith('Dept-')) {
        raw = department.replace('Dept-', '');
      } else {
        raw = department;
      }
    } else {
      raw = String(department);
    }

    const clean = String(raw).trim();
    const lower = clean.toLowerCase();
    if (lower === 'it_team' || lower === 'it team' || lower === 'it' || lower === 'itteam' || lower.includes('software') || lower.includes('tech')) return 'IT Team';
    if (clean.startsWith('Dept-Manage') || lower.includes('manage') || lower.includes('admin') || lower === 'leadership') return 'Management';
    if (lower === 'sales-test' || lower === 'sales test' || lower === 'sales' || lower.includes('sale') || lower.includes('market')) return 'Sales';
    if (lower === 'hr test' || lower === 'hr-test' || lower === 'test') return 'HR Test';
    if (lower === 'hr' || lower.includes('human')) return 'HR';
    return clean.replace(/[_-]/g, ' ');
  };

  // Defense in depth for the Company All Task employee workspace. Older
  // cached responses or fallback endpoints can still contain client accounts.
  const isClientAccount = (user) => {
    const normalize = (value) => String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
    const roleValues = [
      user?.companyRole,
      user?.role,
      user?.userRole,
      user?.userType,
      user?.accountType,
      user?.employeeType,
    ];
    const departmentName = normalize(getDepartmentName(user?.department));
    return roleValues.some((value) => normalize(value) === 'client') || departmentName === 'client';
  };

  
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get('/departments', config);

      if (response.data && response.data.departments) {
        const map = {};
        response.data.departments.forEach(dept => {
          map[dept._id] = dept.name;
        });
        setDepartmentMap(map);
        void 0;
      }
    } catch (err) {
      console.error("❌ Error fetching departments:", err);
    }
  };

  const fetchJobRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get('/job-roles', config);
      const roles = response.data?.jobRoles || response.data?.data || response.data?.roles || [];

      if (Array.isArray(roles)) {
        const map = {};
        roles.forEach(role => {
          const roleName = getRoleText(role);
          if (!roleName) return;

          [role._id, role.id, role.roleId, role.roleNumber, role.roleNo, role.code, role.name, role.roleName]
            .filter(Boolean)
            .forEach(key => {
              map[String(key)] = roleName;
            });
        });
        setJobRoleMap(map);
      }
    } catch (err) {
      console.error("❌ Error fetching job roles:", err);
    }
  };

  const isSameDay = (d1, d2) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  };

  const isThisWeek = (date) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const checkDate = new Date(date);
    return checkDate >= start && checkDate <= end;
  };

  

  const formatTimeFromSeconds = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const calculateTaskActiveTime = useCallback((logs) => {
    if (!logs || logs.length === 0) return {
      totalSeconds: 0,
      displayText: '0s',
      currentStatus: 'pending',
      statusHistory: []
    };

    const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let totalActiveSeconds = 0;
    let lastStartTime = null;
    let currentStatus = 'pending';
    const statusHistory = [];

    sortedLogs.forEach((log) => {
      const logTime = new Date(log.createdAt);

      if (log.action === 'status_updated' || log.action === 'status_changed') {
        let newStatus = null;

        if (log.newValues?.status) {
          newStatus = log.newValues.status;
        } else if (log.description) {
          if (log.description.includes('in-progress')) newStatus = 'in-progress';
          else if (log.description.includes('onhold')) newStatus = 'onhold';
          else if (log.description.includes('completed')) newStatus = 'completed';
          else if (log.description.includes('pending')) newStatus = 'pending';
        }

        if (newStatus && newStatus !== currentStatus) {
          statusHistory.push({
            from: currentStatus,
            to: newStatus,
            time: logTime,
            description: log.description
          });

          if (newStatus === 'in-progress' && currentStatus !== 'in-progress') {
            lastStartTime = logTime;
          }
          else if (currentStatus === 'in-progress' && (newStatus === 'onhold' || newStatus === 'completed' || newStatus === 'pending')) {
            if (lastStartTime) {
              const activeSeconds = Math.floor((logTime - lastStartTime) / 1000);
              totalActiveSeconds += activeSeconds;
              lastStartTime = null;
            }
          }

          currentStatus = newStatus;
        }
      }
    });

    if (currentStatus === 'in-progress' && lastStartTime) {
      const now = new Date();
      const activeSeconds = Math.floor((now - lastStartTime) / 1000);
      totalActiveSeconds += activeSeconds;
    }

    return {
      totalSeconds: totalActiveSeconds,
      displayText: formatTimeFromSeconds(totalActiveSeconds),
      currentStatus,
      statusHistory
    };
  }, []);

  const calculateTodayTotalTime = useCallback((tasksList, logsMap) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalTodaySeconds = 0;
    let todayTasksCount = 0;

    tasksList.forEach(task => {
      const taskDate = new Date(getSourceAwareTaskDate(task, logsMap?.[task._id] || []));
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() === today.getTime()) {
        todayTasksCount++;
        const taskLogs = logsMap[task._id] || [];
        const timeData = calculateTaskActiveTime(taskLogs);
        totalTodaySeconds += timeData.totalSeconds;
      }
    });

    return {
      totalSeconds: totalTodaySeconds,
      displayText: formatTimeFromSeconds(totalTodaySeconds),
      taskCount: todayTasksCount
    };
  }, [calculateTaskActiveTime]);

  
  
  
  const fetchTaskLogsByType = useCallback(async (task) => {
    const source = task.__taskSource || task.taskSource || task.source || getTaskType(task);
    const taskId = task._id;
    
    try {
      let response;
      
      if (source === 'client') {
        void 0;
        response = await axios.get(`/tasks/client-tasks/${taskId}/client-activity-logs`);
      } else if (source === 'project') {
        void 0;
        response = await axios.get(`/tasks/project/${task.projectId}/tasks/${taskId}/activity`);
      } else {
        void 0;
        response = await axios.get(`/task/${taskId}/activity-logs`);
      }
      
      if (response.data.success && isMounted.current) {
        return response.data.logs || [];
      }
      return [];
    } catch (error) {
      console.error(`❌ Failed to fetch logs for task ${taskId} (${source}):`, error);
      return [];
    }
  }, []);

  
  const fetchAllTaskLogs = useCallback(async (tasksList) => {
    if (!tasksList || tasksList.length === 0) return;

    const logsMap = { ...allTaskLogs };
    const tasksNeedingLogs = tasksList.filter(task => !logsMap[task._id]);

    if (tasksNeedingLogs.length === 0) return;

    
    for (const task of tasksNeedingLogs) {
      const logs = await fetchTaskLogsByType(task);
      if (isMounted.current) {
        logsMap[task._id] = logs;
      }
    }

    if (isMounted.current) {
      setAllTaskLogs(prevLogs => {
        const newLogs = { ...prevLogs, ...logsMap };

        
        const todayTotal = calculateTodayTotalTime(tasksList, newLogs);
        setTodayTotalTime(todayTotal);

        return newLogs;
      });
    }
  }, [allTaskLogs, calculateTodayTotalTime, fetchTaskLogsByType]);

  

  const [assignModal, setAssignModal] = useState({
    open: false,
    user: null,
    title: '',
    description: '',
    priority: 'medium',
    dueDateTime: '',
    checkpoints: [],
    newCheckpointText: '',
    submitting: false,
    error: '',
  });

  const openAssignModal = (targetUser) => {
    const today = new Date();
    today.setHours(19, 0, 0, 0); // Default to today at 7:00 PM
    // YYYY-MM-DDTHH:mm format in local time
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, 16);

    setAssignModal({
      open: true,
      user: targetUser,
      title: '',
      description: '',
      priority: 'medium',
      dueDateTime: localISOTime,
      checkpoints: [],
      newCheckpointText: '',
      submitting: false,
      error: '',
    });
  };

  const closeAssignModal = () => {
    if (assignModal.submitting) return;
    setAssignModal(prev => ({ ...prev, open: false, user: null, error: '' }));
  };

  const handleAddCheckpoint = () => {
    const text = assignModal.newCheckpointText?.trim();
    if (!text) return;
    setAssignModal(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, { title: text, completed: false }],
      newCheckpointText: ''
    }));
  };

  const handleRemoveCheckpoint = (index) => {
    setAssignModal(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== index)
    }));
  };

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.title.trim()) {
      setAssignModal(prev => ({ ...prev, error: 'Task title is required.' }));
      return;
    }
    if (!assignModal.dueDateTime) {
      setAssignModal(prev => ({ ...prev, error: 'Due date & time is required.' }));
      return;
    }

    const targetUserId = assignModal.user?._id || assignModal.user?.id;
    if (!targetUserId) {
      setAssignModal(prev => ({ ...prev, error: 'No employee selected.' }));
      return;
    }

    setAssignModal(prev => ({ ...prev, submitting: true, error: '' }));

    try {
      const formData = new FormData();
      formData.append('title', assignModal.title.trim());
      formData.append('description', assignModal.description.trim());
      formData.append('dueDateTime', new Date(assignModal.dueDateTime).toISOString());
      formData.append('priority', assignModal.priority || 'medium');
      formData.append('priorityDays', '1');
      formData.append('assignedUsers', JSON.stringify([targetUserId]));
      formData.append('assignedGroups', JSON.stringify([]));

      const cleanCheckpoints = assignModal.checkpoints
        .map(cp => ({ title: String(cp.title || '').trim(), completed: false }))
        .filter(cp => cp.title);
      formData.append('checkpoints', JSON.stringify(cleanCheckpoints));

      const branchId = assignModal.user?.branch?._id || assignModal.user?.branch || assignModal.user?.branchId;
      if (branchId) {
        formData.append('branchId', String(branchId));
        formData.append('branch', String(branchId));
      }

      await axios.post('/task/create-for-others', formData);

      showSnackbar(`Task "${assignModal.title.trim()}" assigned to ${assignModal.user?.name || 'employee'} successfully!`, 'success');

      // Update employee stats dynamically in state
      setUsers(prevUsers => prevUsers.map(u => {
        const uId = u._id || u.id;
        if (String(uId) === String(targetUserId)) {
          const curStats = u.taskStats || emptyTaskStats;
          const newTotal = (curStats.total || 0) + 1;
          const newPending = (curStats.pending || 0) + 1;
          const completed = curStats.completed || 0;
          return {
            ...u,
            taskStats: {
              ...curStats,
              total: newTotal,
              pending: newPending,
              completionRate: newTotal > 0 ? Math.round((completed / newTotal) * 100) : 0,
            }
          };
        }
        return u;
      }));

      // Update overall stats dynamically
      setOverallStats(prev => ({
        ...prev,
        total: (prev.total || 0) + 1,
        pending: (prev.pending || 0) + 1,
      }));

      setAssignModal({
        open: false,
        user: null,
        title: '',
        description: '',
        priority: 'medium',
        dueDateTime: '',
        checkpoints: [],
        newCheckpointText: '',
        submitting: false,
        error: '',
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to create task';
      setAssignModal(prev => ({ ...prev, submitting: false, error: errorMsg }));
    }
  };

  const renderAssignTaskModal = () => {
    if (!assignModal.open || !assignModal.user) return null;

    const targetUser = assignModal.user;
    const targetDept = getDepartmentName(targetUser.department);
    const targetRole = getUserDisplayRole(targetUser, jobRoleMap);

    return (
      <div className="new-modal-overlay" onClick={closeAssignModal}>
        <div className="new-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="new-modal-header">
            <div>
              <h3>Assign Task</h3>
              <p>Create and assign a new task directly to this team member.</p>
            </div>
            <button
              type="button"
              className="new-modal-close"
              onClick={closeAssignModal}
              disabled={assignModal.submitting}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="new-modal-user-card">
            <div className="modal-user-avatar" style={{ backgroundColor: getAvatarBg(targetUser.name) }}>
              {getInitials(targetUser.name)}
            </div>
            <div className="modal-user-details">
              <div className="modal-user-name">{targetUser.name || 'Unknown'}</div>
              <div className="modal-user-meta">
                <span className="modal-user-pill role"><FiUser size={12} /> {targetRole}</span>
                {targetDept && targetDept !== 'Unassigned' && (
                  <span className="modal-user-pill dept"><FiBriefcase size={12} /> {targetDept}</span>
                )}
                {targetUser.email && (
                  <span className="modal-user-pill email"><FiMail size={12} /> {targetUser.email}</span>
                )}
              </div>
            </div>
          </div>

          {assignModal.error && (
            <div className="new-modal-error">
              <FiAlertCircle size={16} />
              <span>{assignModal.error}</span>
            </div>
          )}

          <form onSubmit={handleAssignTaskSubmit} className="new-modal-form">
            <div className="modal-form-group">
              <label>Task Title <span className="req">*</span></label>
              <input
                type="text"
                value={assignModal.title}
                onChange={(e) => setAssignModal(prev => ({ ...prev, title: e.target.value, error: '' }))}
                placeholder="e.g. Complete client pitch presentation..."
                required
                autoFocus
              />
            </div>

            <div className="modal-form-group">
              <label>Description</label>
              <textarea
                value={assignModal.description}
                onChange={(e) => setAssignModal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add instructions, context or deliverables for this task..."
                rows={3}
              />
            </div>

            <div className="modal-form-row">
              <div className="modal-form-group">
                <label>Priority</label>
                <select
                  value={assignModal.priority}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label>Due Date & Time <span className="req">*</span></label>
                <input
                  type="datetime-local"
                  value={assignModal.dueDateTime}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, dueDateTime: e.target.value, error: '' }))}
                  required
                />
              </div>
            </div>

            <div className="modal-form-group checkpoints-section">
              <label>Checkpoints / Subtasks (Optional)</label>
              <div className="checkpoint-input-row">
                <input
                  type="text"
                  value={assignModal.newCheckpointText}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, newCheckpointText: e.target.value }))}
                  placeholder="Add a milestone or subtask..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCheckpoint();
                    }
                  }}
                />
                <button type="button" className="btn-add-cp" onClick={handleAddCheckpoint}>
                  <FiPlus size={14} /> Add
                </button>
              </div>

              {assignModal.checkpoints.length > 0 && (
                <div className="checkpoints-list">
                  {assignModal.checkpoints.map((cp, idx) => (
                    <div key={idx} className="checkpoint-item">
                      <FiCheckSquare size={14} className="cp-icon" />
                      <span className="cp-title">{cp.title}</span>
                      <button
                        type="button"
                        className="cp-remove"
                        onClick={() => handleRemoveCheckpoint(idx)}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="new-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={closeAssignModal}
                disabled={assignModal.submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-modal-submit"
                disabled={assignModal.submitting}
              >
                {assignModal.submitting ? (
                  <>
                    <FiRefreshCw size={14} className="spin" /> Assigning...
                  </>
                ) : (
                  <>
                    <FiPlus size={15} /> Assign Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const [overallStats, setOverallStats] = useState({
    total: 0,
    pending: 0,
    'in-progress': 0,
    completed: 0,
    rejected: 0,
    overdue: 0,
    onhold: 0,
    reopen: 0,
    cancelled: 0
  });

  
  const [filteredTaskStats, setFilteredTaskStats] = useState({
    total: 0,
    pending: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    completed: { count: 0, percentage: 0 },
    rejected: { count: 0, percentage: 0 },
    overdue: { count: 0, percentage: 0 },
    onhold: { count: 0, percentage: 0 },
    reopen: { count: 0, percentage: 0 },
    cancelled: { count: 0, percentage: 0 }
  });

  const [userTaskStats, setUserTaskStats] = useState({
    total: 0,
    pending: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    completed: { count: 0, percentage: 0 },
    rejected: { count: 0, percentage: 0 },
    overdue: { count: 0, percentage: 0 },
    onhold: { count: 0, percentage: 0 },
    reopen: { count: 0, percentage: 0 },
    cancelled: { count: 0, percentage: 0 }
  });

  const [systemStats, setSystemStats] = useState({
    totalEmployees: 0,
    totalTasks: 0,
    avgCompletion: 0,
    pendingTasks: 0,
    activeEmployees: 0
  });

  const calculateOverallStats = useCallback((usersData) => {
    if (!usersData || usersData.length === 0) {
      setOverallStats({
        total: 0,
        pending: 0,
        'in-progress': 0,
        completed: 0,
        rejected: 0,
        overdue: 0,
        onhold: 0,
        reopen: 0,
        cancelled: 0
      });

      setSystemStats({
        totalEmployees: 0,
        totalTasks: 0,
        avgCompletion: 0,
        pendingTasks: 0,
        activeEmployees: 0
      });

      return;
    }

    let totalTasks = 0;
    let totalCompleted = 0;
    let totalPending = 0;
    const statusTotals = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0,
      overdue: 0,
      onhold: 0,
      reopen: 0,
      cancelled: 0
    };

    usersData.forEach(user => {
      const stats = user.taskStats || {};
      totalTasks += stats.total || 0;
      totalCompleted += stats.completed || 0;
      totalPending += stats.pending || 0;
      TASK_STAT_KEYS.forEach(key => {
        statusTotals[key] += Number(stats[key] || 0);
      });
    });

    const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    setOverallStats({
      total: totalTasks,
      completed: totalCompleted,
      pending: totalPending,
      'in-progress': statusTotals.inProgress,
      rejected: statusTotals.rejected,
      overdue: statusTotals.overdue,
      onhold: statusTotals.onhold,
      reopen: statusTotals.reopen,
      cancelled: statusTotals.cancelled
    });

    setSystemStats({
      totalEmployees: usersData.length,
      totalTasks,
      avgCompletion: overallRate,
      pendingTasks: totalPending,
      activeEmployees: usersData.filter(u => (u.taskStats?.total || 0) > 0).length
    });
  }, []);

  const fetchTodayClockedInUsers = useCallback(async () => {
    setTodayClockedInLoading(true);

    try {
      const res = await axios.get('/attendance/all', {
        params: {
          date: getDateInputValue(),
          limit: 10000
        },
        _skipErrorNotify: true,
      });

      const attendanceRows = Array.isArray(res.data?.data) ? res.data.data : [];
      const clockedInIds = attendanceRows
        .filter(record => {
          const status = String(record?.status || '').trim().toLowerCase();
          return record?.inTime && status !== 'absent';
        })
        .map(record => {
          const user = record.user;
          return String(user?._id || user?.id || user || '');
        })
        .filter(Boolean);

      const uniqueIds = new Set(clockedInIds);
      if (isMounted.current) {
        setTodayClockedInUserIds(uniqueIds);
      }

      return uniqueIds;
    } catch (error) {
      console.error('Failed to load today clocked-in users:', error);
      if (isMounted.current) {
        setTodayClockedInUserIds(new Set());
      }
      showSnackbar('Unable to load today clock-in users.', 'error');
      return new Set();
    } finally {
      if (isMounted.current) {
        setTodayClockedInLoading(false);
      }
    }
  }, [showSnackbar]);

  const handleTodayClockInToggle = useCallback(async () => {
    if (clockedInTodayOnly) {
      setClockedInTodayOnly(false);
      return;
    }

    await fetchTodayClockedInUsers();
    if (isMounted.current) {
      setClockedInTodayOnly(true);
    }
  }, [clockedInTodayOnly, fetchTodayClockedInUsers]);

  useEffect(() => {
    const fetchUserData = () => {
      try {
        const stored = getStoredUser();
        const userStr = localStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("superAdmin");
        const parsed = stored || (userStr ? JSON.parse(userStr) : null);
        if (!parsed) {
          setError("Please log in to access this page");
          return;
        }

        const user = parsed.user || parsed.data || parsed;

        let foundUser = user;
        let userRole = user.role || 'user';
        let companyRole = user.companyRole || user.role || 'employee';
        let userName = user.name || (user.email ? user.email.split('@')[0] : 'Unknown User');

        if (isMounted.current) {
          setCurrentUser(foundUser);
          setCurrentUserRole(userRole);
          setCurrentUserCompanyRole(companyRole);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setError("Error loading user data");
      }
    };

    fetchUserData();
    fetchDepartments();
    fetchJobRoles();
  }, []);

  

  const fetchUsersWithTasks = useCallback(async () => {
    if (fetchUsersTimeoutRef.current) {
      clearTimeout(fetchUsersTimeoutRef.current);
    }

    // This loader is invoked again when permissions and role metadata finish
    // loading. Mark this invocation immediately so an older in-flight request
    // can never replace the visible employee list after a newer one starts.
    const requestId = usersFetchRequestRef.current + 1;
    usersFetchRequestRef.current = requestId;

    fetchUsersTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current || usersFetchRequestRef.current !== requestId) return;

      const todayStr = getDateInputValue();
      const cacheKey = buildEmpUsersCacheKey({
        fromDate: todayStr,
        toDate: todayStr,
      });
      const cachedUsersSnapshot = readEmpUsersCache(cacheKey);
      const shouldShowLoading = !cachedUsersSnapshot;

      if (cachedUsersSnapshot) {
        if (Array.isArray(cachedUsersSnapshot.users) && cachedUsersSnapshot.users.length > 0) {
          const employeeUsers = cachedUsersSnapshot.users.filter((user) => !isClientAccount(user));
          if (usersFetchRequestRef.current === requestId) {
            setUsers(employeeUsers);
            calculateOverallStats(employeeUsers);
          }
        }
        if (cachedUsersSnapshot.overallStats && usersFetchRequestRef.current === requestId) {
          setOverallStats(cachedUsersSnapshot.overallStats);
        }
        if (cachedUsersSnapshot.systemStats && usersFetchRequestRef.current === requestId) {
          setSystemStats(cachedUsersSnapshot.systemStats);
        }
        if (usersFetchRequestRef.current === requestId) setUsersLoading(false);
      } else {
        setUsersLoading(true);
      }

      setError("");

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Please log in to access this page");
          setUsersLoading(false);
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        let response = null;
        let usersData = [];

        try {
          response = await axios.get('/tasks/all/company-overview', {
            ...config,
            params: { includeStats: 'false' }
          });
        } catch (apiError) {
          try {
            response = await axios.get('/users/company-users', {
              ...config,
              params: {
                noPagination: 'true',
                view: 'task-overview'
              }
            });
          } catch (err2) {
            try {
              response = await axios.get('/users/department-users', { ...config });
            } catch (err3) {
              response = await axios.get('/users/all', { ...config });
            }
          }
        }

        if (Array.isArray(response?.data?.users)) {
          usersData = response.data.users;
        } else if (Array.isArray(response?.data?.data?.users)) {
          usersData = response.data.data.users;
        } else if (Array.isArray(response?.data?.data)) {
          usersData = response.data.data;
        } else if (Array.isArray(response?.data?.message?.users)) {
          usersData = response.data.message.users;
        } else if (Array.isArray(response?.data?.message)) {
          usersData = response.data.message;
        } else if (Array.isArray(response?.data)) {
          usersData = response.data;
        }

        const existingStatsMap = new Map((usersRef.current || []).map(u => [String(u._id || u.id), u.taskStats]));
        if (cachedUsersSnapshot?.users) {
          cachedUsersSnapshot.users.forEach(u => {
            const id = String(u._id || u.id);
            if (u.taskStats && (!existingStatsMap.has(id) || !existingStatsMap.get(id)?.total)) {
              existingStatsMap.set(id, u.taskStats);
            }
          });
        }

        let filteredUsers = usersData
          .filter(user => {
            const statusText = String(user?.status || '').trim().toLowerCase();
            return user?.isActive !== false && statusText !== 'inactive';
          })
          .filter(user => !isClientAccount(user))
          .filter(user => {
            if (isOwner()) return true;
            if (!pageScope) return true;

            // Branch restriction from Page Management scope
            if (pageScope.branchIds && !pageScope.branchIds.includes('all') && pageScope.branchIds.length > 0) {
              const userBranchIds = getUserBranchIds(user);
              if (userBranchIds.length > 0) {
                const hasBranchMatch = userBranchIds.some(bId => pageScope.branchIds.includes(bId));
                if (!hasBranchMatch) return false;
              }
            }

            // Department restriction from Page Management scope
            if (pageScope.departmentIds && !pageScope.departmentIds.includes('all') && pageScope.departmentIds.length > 0) {
              const userDeptId = String(user.department?._id || user.department?.id || user.department || '');
              if (userDeptId && !pageScope.departmentIds.includes(userDeptId)) return false;
            }

            return true;
          })
          .map(user => {
            const id = String(user._id || user.id);
            return {
              ...user,
              _id: user._id || user.id,
              role: getUserDisplayRole(user, jobRoleMap),
              taskStats: existingStatsMap.get(id) || emptyTaskStats
            };
          });

        if (isMounted.current && usersFetchRequestRef.current === requestId && filteredUsers.length > 0) {
          setUsers(filteredUsers);
          const hasAnyStats = filteredUsers.some(u => (u.taskStats?.total || 0) > 0);
          if (hasAnyStats) {
            calculateOverallStats(filteredUsers);
          }
        }

        const fromDateParam = globalFromDate || undefined;
        const toDateParam = globalToDate || undefined;
        const isDateFiltered = fromDateParam || toDateParam;

        const userIds = filteredUsers.map(user => user._id || user.id).filter(Boolean);
        if (userIds.length === 0) return;

        try {
          const effectivePeriod = isDateFiltered
            ? (fromDateParam && toDateParam && fromDateParam === toDateParam ? 'today' : 'custom')
            : (dateFilter || 'all');
          const statsPayload = {
            userIds,
            filters: {
              period: effectivePeriod,
              fromDate: fromDateParam,
              toDate: toDateParam,
              status: 'all',
              priority: 'all',
            },
          };
          const statsRes = await fetchTaskStats(statsPayload, {
            _skipErrorNotify: true,
          });

          const statsByUser = statsRes.data?.statsByUser || {};
          const usersWithStats = filteredUsers.map(user => ({
            ...user,
            taskStats: mapStatusCountsToTaskStats(statsByUser[user._id || user.id])
          }));

          if (isMounted.current && usersFetchRequestRef.current === requestId) {
            setUsers(usersWithStats);
            calculateOverallStats(usersWithStats);
            const totalTasks = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.total || 0), 0);
            const totalCompleted = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.completed || 0), 0);
            const totalPending = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.pending || 0), 0);
            const totalInProgress = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.inProgress || 0), 0);
            const totalRejected = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.rejected || 0), 0);
            const totalOverdue = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.overdue || 0), 0);
            const totalOnHold = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.onhold || 0), 0);
            const totalReopen = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.reopen || 0), 0);
            const totalCancelled = usersWithStats.reduce((sum, user) => sum + (user?.taskStats?.cancelled || 0), 0);

            writeEmpUsersCache(cacheKey, {
              users: usersWithStats,
              overallStats: {
                total: totalTasks,
                pending: totalPending,
                "in-progress": totalInProgress,
                completed: totalCompleted,
                rejected: totalRejected,
                overdue: totalOverdue,
                onhold: totalOnHold,
                reopen: totalReopen,
                cancelled: totalCancelled,
              },
              systemStats: {
                totalEmployees: usersWithStats.length,
                totalTasks,
                avgCompletion: usersWithStats.length > 0
                  ? Math.round(
                      totalCompleted /
                      Math.max(totalTasks, 1) * 100
                    )
                  : 0,
                pendingTasks: totalPending,
                activeEmployees: usersWithStats.reduce((sum, user) => sum + ((user?.taskStats?.total || 0) > 0 ? 1 : 0), 0),
              },
            });
          }
        } catch (err) {
          void 0;
        }

      } catch (err) {
        console.error("❌ Error fetching users with tasks:", err);

        if (!cachedUsersSnapshot && usersFetchRequestRef.current === requestId) {
          if (err.response?.status === 401) {
            setError("You are not authorized to load this data.");
          } else if (err.response?.status === 403) {
            setError("You don't have permission to access this page.");
          } else {
            setError(
              err?.response?.data?.error ||
              err?.response?.data?.message ||
              "Unable to load employee data. Please try again."
            );
          }

          if (isMounted.current) {
            setUsers([]);
            calculateOverallStats([]);
          }
        }
      } finally {
        if (isMounted.current && shouldShowLoading && usersFetchRequestRef.current === requestId) {
          setUsersLoading(false);
        }
      }
    }, 300); 

  }, [currentUser, isOwner, calculateOverallStats, globalFromDate, globalToDate, jobRoleMap, pageScope]);

  
  useEffect(() => {
    if (currentUser && isMounted.current && pageAccessReady) {
      hasFetchedUsers.current = true;
      fetchUsersWithTasks();
    }

    return () => {
      if (fetchUsersTimeoutRef.current) {
        clearTimeout(fetchUsersTimeoutRef.current);
      }
    };
  }, [currentUser, fetchUsersWithTasks, pageAccessReady]);

  

  const departmentOptions = useMemo(() => {
    const set = new Set();
    users.forEach(u => {
      const d = getDepartmentName(u.department);
      if (d && d !== 'N/A' && !d.startsWith('Dept-')) set.add(d);
    });
    return Array.from(set).sort();
  }, [users, departmentMap]);

  const roleOptions = useMemo(() => {
    const set = new Set();
    users.forEach(u => {
      const r = getUserDisplayRole(u, jobRoleMap);
      if (r && r !== 'N/A') set.add(r);
    });
    return Array.from(set).sort();
  }, [users, jobRoleMap]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (clockedInTodayOnly) {
      filtered = filtered.filter(user => todayClockedInUserIds.has(String(user._id || user.id)));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.name?.toLowerCase().includes(query)) ||
        (user.email?.toLowerCase().includes(query)) ||
        (user.employeeId?.toLowerCase().includes(query))
      );
    }

    // Unified Department Filter (Dropdown or Pill Tab)
    const activeDept = selectedDeptFilter !== 'all' ? selectedDeptFilter : activeDeptTab !== 'all' ? activeDeptTab : null;
    if (activeDept) {
      filtered = filtered.filter(user => {
        const dName = getDepartmentName(user.department);
        const normKey = dName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return dName.toLowerCase() === activeDept.toLowerCase() || normKey === activeDept.toLowerCase();
      });
    }

    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const r = getUserDisplayRole(user, jobRoleMap);
        return r === selectedRoleFilter;
      });
    }

    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(user => {
        const stats = getUserTaskStats(user);
        if (selectedStatusFilter === 'pending') return (stats.pending || 0) > 0;
        if (selectedStatusFilter === 'in-progress') return (stats.inProgress || 0) > 0;
        if (selectedStatusFilter === 'completed') return (stats.completed || 0) > 0;
        if (selectedStatusFilter === 'onhold') return (stats.onhold || 0) > 0;
        if (selectedStatusFilter === 'overdue') return (stats.overdue || 0) > 0;
        return true;
      });
    }

    if (selectedPerfFilter !== 'all') {
      filtered = filtered.filter(user => {
        const stats = getUserTaskStats(user);
        const rate = stats.completionRate || 0;
        if (selectedPerfFilter === 'top') return rate >= 80;
        if (selectedPerfFilter === 'medium') return rate >= 50 && rate < 80;
        if (selectedPerfFilter === 'low') return rate < 50 && (stats.total || 0) > 0;
        if (selectedPerfFilter === 'zero') return (stats.total || 0) === 0;
        if (selectedPerfFilter === 'completed') return stats.total > 0 && stats.total === stats.completed;
        return true;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      const aStats = getUserTaskStats(a);
      const bStats = getUserTaskStats(b);
      if (sortBy === 'tasks-desc') return (bStats.total || 0) - (aStats.total || 0);
      if (sortBy === 'tasks-asc') return (aStats.total || 0) - (bStats.total || 0);
      if (sortBy === 'rate-desc') return (bStats.completionRate || 0) - (aStats.completionRate || 0);
      return 0;
    });

    return filtered;
  }, [
    users,
    clockedInTodayOnly,
    todayClockedInUserIds,
    searchQuery,
    activeDeptTab,
    selectedDeptFilter,
    selectedRoleFilter,
    selectedStatusFilter,
    selectedPerfFilter,
    sortBy,
    jobRoleMap,
    departmentMap
  ]);

  const getDeptSortPriority = (deptName) => {
    const lower = String(deptName || '').toLowerCase();
    if (lower.includes('it team') || lower.includes('it_team')) return 1;
    if (lower === 'hr') return 2;
    if (lower.includes('manage')) return 3;
    if (lower.includes('sales')) return 4;
    if (lower.includes('hr test')) return 5;
    return 10;
  };

  const allDepartmentGroups = useMemo(() => {
    const groups = new Map();

    users.forEach(user => {
      const departmentName = getDepartmentName(user.department);
      const departmentKey = departmentName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      if (!groups.has(departmentKey)) {
        groups.set(departmentKey, {
          key: departmentKey,
          name: departmentName,
          count: 0
        });
      }

      groups.get(departmentKey).count += 1;
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === 'unassigned') return 1;
      if (b.key === 'unassigned') return -1;
      const orderDiff = getDeptSortPriority(a.name) - getDeptSortPriority(b.name);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  }, [users, departmentMap]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const departmentUserGroups = useMemo(() => {
    const groups = new Map();

    // If activeDeptTab is selected (not 'all'), seed that department, otherwise seed all company departments
    const deptsToSeed = activeDeptTab === 'all'
      ? allDepartmentGroups
      : allDepartmentGroups.filter(d => d.key === activeDeptTab);

    // Always seed departments so HR, Management, Sales, etc. never disappear when filtering by clock-in/search/status
    if (deptsToSeed && deptsToSeed.length > 0) {
      deptsToSeed.forEach(dept => {
        groups.set(dept.key, {
          key: dept.key,
          name: dept.name,
          users: []
        });
      });
    }

    // Group filtered users into their respective department
    filteredUsers.forEach(user => {
      const departmentName = getDepartmentName(user.department);
      const departmentKey = departmentName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      if (groups.has(departmentKey)) {
        groups.get(departmentKey).users.push(user);
      } else if (activeDeptTab === 'all' || activeDeptTab === departmentKey) {
        groups.set(departmentKey, {
          key: departmentKey,
          name: departmentName,
          users: [user]
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === 'unassigned') return 1;
      if (b.key === 'unassigned') return -1;
      const orderDiff = getDeptSortPriority(a.name) - getDeptSortPriority(b.name);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  }, [allDepartmentGroups, filteredUsers, activeDeptTab, departmentMap]);

  useEffect(() => {
    if (departmentUserGroups.length > 0) {
      setExpandedDepts(prev => {
        if (Object.keys(prev).length === 0) {
          return { [departmentUserGroups[0].key]: true };
        }
        return prev;
      });
    }
  }, [departmentUserGroups]);

  const toggleDeptAccordion = (deptKey) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptKey]: !prev[deptKey]
    }));
  };

  const topPerformer = useMemo(() => {
    let best = null;
    users.forEach(user => {
      const stats = getUserTaskStats(user);
      const rate = stats.completionRate || 0;
      const total = stats.total || 0;
      const completed = stats.completed || 0;
      if (total > 0) {
        if (!best) {
          best = { name: user.name || 'Team Member', rate, completed, total };
        } else if (completed > 0 && best.completed === 0) {
          best = { name: user.name || 'Team Member', rate, completed, total };
        } else if (rate > best.rate) {
          best = { name: user.name || 'Team Member', rate, completed, total };
        } else if (rate === best.rate && completed > best.completed) {
          best = { name: user.name || 'Team Member', rate, completed, total };
        } else if (best.completed === 0 && total > best.total) {
          best = { name: user.name || 'Team Member', rate, completed, total };
        }
      }
    });
    return best;
  }, [users]);

  const noTaskCount = useMemo(() => {
    return users.filter(u => (getUserTaskStats(u).total || 0) === 0).length;
  }, [users]);

  const allCompletedCount = useMemo(() => {
    return users.filter(u => {
      const stats = getUserTaskStats(u);
      return (stats.total || 0) > 0 && stats.total === stats.completed;
    }).length;
  }, [users]);

  const handleExportPDF = useCallback(async () => {
    try {
      let targetUsers = filteredUsers && filteredUsers.length > 0 ? filteredUsers : users;

      // The employee list is populated asynchronously. If Export is clicked
      // while that request is still settling (or the overview endpoint timed
      // out), load the same company employee list directly instead of showing
      // a false "no data" message.
      if (!targetUsers || targetUsers.length === 0) {
        const token = localStorage.getItem('token');
        const response = await axios.get('/users/company-users', {
          params: { noPagination: 'true', view: 'task-overview' },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          _skipErrorNotify: true,
        });
        const exportUsers = response.data?.users || response.data?.data?.users || response.data?.data || response.data || [];

        if (Array.isArray(exportUsers)) {
          targetUsers = exportUsers
            .filter((user) => {
              const statusText = String(user?.status || '').trim().toLowerCase();
              return user?.isActive !== false && statusText !== 'inactive' && !isClientAccount(user);
            })
            .map((user) => ({
              ...user,
              _id: user._id || user.id,
              role: getUserDisplayRole(user, jobRoleMap),
              taskStats: user.taskStats || emptyTaskStats,
            }));
        }
      }

      if (!targetUsers || targetUsers.length === 0) {
        showSnackbar("No employees are available to export.", "warning");
        return;
      }

      const doc = new jsPDF("landscape", "mm", "a4");
      const generatedDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      // Header Banner
      doc.setFillColor(30, 58, 138); // #1e3a8a
      doc.rect(0, 0, 297, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CIIS NETWORK - ALL EMPLOYEE TASKS REPORT", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${generatedDate}`, 240, 15);

      // KPI Summary Box
      doc.setFillColor(241, 245, 249); // #f1f5f9
      doc.roundedRect(14, 28, 269, 18, 3, 3, "F");

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);

      const totalT = systemStats.totalTasks || overallStats.total || 0;
      doc.text(`Total Employees: ${targetUsers.length}`, 20, 39);
      doc.text(`Total Tasks: ${totalT}`, 80, 39);
      doc.text(`Completed: ${overallStats.completed || 0}`, 135, 39);
      doc.text(`Pending: ${overallStats.pending || 0}`, 185, 39);
      doc.text(`Overdue: ${overallStats.overdue || 0}`, 235, 39);

      // Table columns & rows
      const tableColumns = [
        { header: "Emp ID", dataKey: "empId" },
        { header: "Employee Name", dataKey: "name" },
        { header: "Email Address", dataKey: "email" },
        { header: "Department", dataKey: "department" },
        { header: "Role", dataKey: "role" },
        { header: "Assigned", dataKey: "assigned" },
        { header: "Completed", dataKey: "completed" },
        { header: "Pending", dataKey: "pending" },
        { header: "Completion %", dataKey: "rate" }
      ];

      const tableRows = targetUsers.map((user, index) => {
        const stats = getUserTaskStats(user);
        return {
          empId: user.employeeId || `EMP-${index + 1}`,
          name: user.name || "Unknown",
          email: user.email || "N/A",
          department: getDepartmentName(user.department),
          role: getUserDisplayRole(user, jobRoleMap),
          assigned: String(stats.total || 0),
          completed: String(stats.completed || 0),
          pending: String(Math.max(0, (stats.total || 0) - (stats.completed || 0))),
          rate: `${stats.completionRate || 0}%`
        };
      });

      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: 50,
        theme: "striped",
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          halign: "left"
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [30, 41, 59],
          rowHeight: 8
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          empId: { cellWidth: 25 },
          name: { cellWidth: 42, fontStyle: "bold" },
          email: { cellWidth: 52 },
          department: { cellWidth: 35 },
          role: { cellWidth: 35 },
          assigned: { cellWidth: 20, halign: "center" },
          completed: { cellWidth: 20, halign: "center" },
          pending: { cellWidth: 20, halign: "center" },
          rate: { cellWidth: 20, halign: "center", fontStyle: "bold" }
        },
        margin: { top: 50, left: 14, right: 14, bottom: 15 },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            280,
            200,
            { align: "right" }
          );
        }
      });

      doc.save(`Company_All_Tasks_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      showSnackbar("Tasks PDF downloaded successfully", "success");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      showSnackbar("Failed to generate PDF report", "error");
    }
  }, [filteredUsers, users, systemStats, overallStats, jobRoleMap, departmentMap, showSnackbar]);

  const handleExport = handleExportPDF;

  const renderDeptHeaderIcon = (name) => {
    const lower = String(name || '').toLowerCase();
    if (lower.includes('it') || lower.includes('tech') || lower.includes('software')) {
      return <FiMonitor size={17} color="#2563eb" />;
    }
    if (lower.includes('hr') || lower.includes('human')) {
      return <FiUser size={17} color="#1e293b" />;
    }
    if (lower.includes('management') || lower.includes('lead') || lower.includes('admin')) {
      return <FiBriefcase size={17} color="#1e293b" />;
    }
    if (lower.includes('sales') || lower.includes('market') || lower.includes('business')) {
      return <FiTrendingUp size={17} color="#1e293b" />;
    }
    return <FiUsers size={17} color="#1e293b" />;
  };

  const getDeptDescription = (name) => {
    const lower = String(name || '').toLowerCase();
    if (lower.includes('it') || lower.includes('tech') || lower.includes('software')) {
      return 'Development, design, and technology team';
    }
    if (lower.includes('test')) {
      return 'Test department';
    }
    if (lower.includes('hr') || lower.includes('human')) {
      return 'Human resources and people operations';
    }
    if (lower.includes('management') || lower.includes('lead') || lower.includes('admin')) {
      return 'Company management and leadership';
    }
    if (lower.includes('sales') || lower.includes('market') || lower.includes('business')) {
      return 'Sales and business development';
    }
    return `${name} operations and tasks`;
  };

  const getAvatarBg = (name) => {
    // Cohesive royal blue and indigo tones matching reference design
    const colors = ['#3b82f6', '#4f46e5', '#2563eb', '#4338ca', '#1d4ed8'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getNonZeroStatuses = useMemo(() => {
    return STATUS_OPTIONS.filter(status => {
      if (status.value === 'all') return true;
      return overallStats[status.value] > 0;
    });
  }, [overallStats]);

  
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return [...tasks].sort((a, b) => {
      const aDateValue = getSourceAwareTaskDate(a, allTaskLogs[a._id] || []);
      const bDateValue = getSourceAwareTaskDate(b, allTaskLogs[b._id] || []);
      const aDate = aDateValue ? new Date(aDateValue) : new Date(0);
      const bDate = bDateValue ? new Date(bDateValue) : new Date(0);
      return bDate - aDate;
    });
  }, [allTaskLogs, tasks]);

  
  useEffect(() => {
    if (!filteredTasks || filteredTasks.length === 0) {
      setFilteredTaskStats({
        total: 0,
        pending: { count: 0, percentage: 0 },
        inProgress: { count: 0, percentage: 0 },
        completed: { count: 0, percentage: 0 },
        rejected: { count: 0, percentage: 0 },
        overdue: { count: 0, percentage: 0 },
        onhold: { count: 0, percentage: 0 },
        reopen: { count: 0, percentage: 0 },
        cancelled: { count: 0, percentage: 0 }
      });
      return;
    }

    const statusCounts = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      rejected: 0,
      overdue: 0,
      onhold: 0,
      reopen: 0,
      cancelled: 0
    };

    filteredTasks.forEach(task => {
      let status = task.userStatus || task.status || task.overallStatus;

      if (isTaskOverdueByDate(getTaskDueDate(task), status)) {
        status = 'overdue';
      }

      if (status && statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    const total = filteredTasks.length;
    setFilteredTaskStats({
      total,
      pending: {
        count: statusCounts.pending,
        percentage: total > 0 ? Math.round((statusCounts.pending / total) * 100) : 0
      },
      inProgress: {
        count: statusCounts['in-progress'],
        percentage: total > 0 ? Math.round((statusCounts['in-progress'] / total) * 100) : 0
      },
      completed: {
        count: statusCounts.completed,
        percentage: total > 0 ? Math.round((statusCounts.completed / total) * 100) : 0
      },
      rejected: {
        count: statusCounts.rejected,
        percentage: total > 0 ? Math.round((statusCounts.rejected / total) * 100) : 0
      },
      overdue: {
        count: statusCounts.overdue,
        percentage: total > 0 ? Math.round((statusCounts.overdue / total) * 100) : 0
      },
      onhold: {
        count: statusCounts.onhold,
        percentage: total > 0 ? Math.round((statusCounts.onhold / total) * 100) : 0
      },
      reopen: {
        count: statusCounts.reopen,
        percentage: total > 0 ? Math.round((statusCounts.reopen / total) * 100) : 0
      },
      cancelled: {
        count: statusCounts.cancelled,
        percentage: total > 0 ? Math.round((statusCounts.cancelled / total) * 100) : 0
      }
    });
  }, [filteredTasks]);

  useEffect(() => {
    if (fromDate || toDate) setDateFilter("all");
  }, [fromDate, toDate]);

  

  const fetchTaskStatusCounts = useCallback(async (userId) => {
    try {
      if (!userId) {
        console.error("❌ No userId provided to fetchTaskStatusCounts");
        return;
      }

      let statusParam = activeStatusFilters.includes('all') ? 'all' : activeStatusFilters.join(',');
      if (dateFilter === 'overdue') {
        statusParam = statusParam === 'all' ? 'overdue' : `${statusParam},overdue`;
      }

      const response = await axios.get(`/tasks/all/user/${userId}/stats`, {
        params: {
          period: fromDate || toDate || dateFilter === 'overdue' ? 'all' : dateFilter,
          fromDate,
          toDate,
          search: searchQuery,
          status: statusParam,
          priority: priorityFilter,
        },
      });

      if (response.data.success && response.data.statusCounts && isMounted.current) {
        const statusCounts = response.data.statusCounts;

        setUserTaskStats({
          total: statusCounts.total || 0,
          pending: statusCounts.pending || { count: 0, percentage: 0 },
          inProgress: statusCounts.inProgress || { count: 0, percentage: 0 },
          completed: statusCounts.completed || { count: 0, percentage: 0 },
          rejected: statusCounts.rejected || { count: 0, percentage: 0 },
          overdue: statusCounts.overdue || { count: 0, percentage: 0 },
          onhold: statusCounts.onHold || { count: 0, percentage: 0 },
          reopen: statusCounts.reopen || { count: 0, percentage: 0 },
          cancelled: statusCounts.cancelled || { count: 0, percentage: 0 }
        });
      }
    } catch (err) {
      console.error('❌ Error fetching task status counts:', err);
      if (isMounted.current) {
        calculateStatsFromTasks();
      }
    }
  }, [activeStatusFilters, dateFilter, fromDate, priorityFilter, searchQuery, toDate]);

  
  const calculateStatsFromTasks = useCallback(() => {
    if (!tasks || tasks.length === 0) {
      setUserTaskStats({
        total: 0,
        pending: { count: 0, percentage: 0 },
        inProgress: { count: 0, percentage: 0 },
        completed: { count: 0, percentage: 0 },
        rejected: { count: 0, percentage: 0 },
        overdue: { count: 0, percentage: 0 },
        onhold: { count: 0, percentage: 0 },
        reopen: { count: 0, percentage: 0 },
        cancelled: { count: 0, percentage: 0 }
      });
      return;
    }

    const statusCounts = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      rejected: 0,
      overdue: 0,
      onhold: 0,
      reopen: 0,
      cancelled: 0
    };

    tasks.forEach(task => {
      let status = task.userStatus || task.status || task.overallStatus;

      if (isTaskOverdueByDate(getTaskDueDate(task), status)) {
        status = 'overdue';
      }

      if (status && statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    const total = tasks.length;
    setUserTaskStats({
      total,
      pending: {
        count: statusCounts.pending,
        percentage: total > 0 ? Math.round((statusCounts.pending / total) * 100) : 0
      },
      inProgress: {
        count: statusCounts['in-progress'],
        percentage: total > 0 ? Math.round((statusCounts['in-progress'] / total) * 100) : 0
      },
      completed: {
        count: statusCounts.completed,
        percentage: total > 0 ? Math.round((statusCounts.completed / total) * 100) : 0
      },
      rejected: {
        count: statusCounts.rejected,
        percentage: total > 0 ? Math.round((statusCounts.rejected / total) * 100) : 0
      },
      overdue: {
        count: statusCounts.overdue,
        percentage: total > 0 ? Math.round((statusCounts.overdue / total) * 100) : 0
      },
      onhold: {
        count: statusCounts.onhold,
        percentage: total > 0 ? Math.round((statusCounts.onhold / total) * 100) : 0
      },
      reopen: {
        count: statusCounts.reopen,
        percentage: total > 0 ? Math.round((statusCounts.reopen / total) * 100) : 0
      },
      cancelled: {
        count: statusCounts.cancelled,
        percentage: total > 0 ? Math.round((statusCounts.cancelled / total) * 100) : 0
      }
    });
  }, [tasks]);

  const handleStatusFilterToggle = (status) => {
    setActiveStatusFilters(prev => {
      if (status === 'all') {
        return ['all'];
      }

      const newFilters = prev.filter(f => f !== 'all');

      if (newFilters.includes(status)) {
        const updated = newFilters.filter(f => f !== status);
        return updated.length === 0 ? ['all'] : updated;
      } else {
        return [...newFilters, status];
      }
    }); 
  };

  
  const fetchUserTasks = useCallback(async (userId, page = taskPage, options = {}) => {
    if (fetchingTasksForUser.current === `${userId}-${page}`) {
      return;
    }

    if (!userId) {
      setError("Invalid user ID");
      return;
    }

    fetchingTasksForUser.current = `${userId}-${page}`;

    let user = users.find((x) => x._id === userId || x.id === userId);
    if (!user) {
      user = { _id: userId, id: userId, name: "Employee" };
    }

    if (isMounted.current) {
      setSelectedUser(user);
      setSelectedUserId(userId);
      setOpenDialog(isTaskPageMode);
      if (options.reset) {
        setTasks([]); 
        setTaskTotal(0);
        setTaskTotalPages(1);
        setTaskPage(1);
        setDateFilter("today");
        setFromDate("");
        setToDate("");
      }
    }

    setLoading(true); 
    setError("");

    try {
      const nextDateFilter = options.dateFilter ?? dateFilter;
      const nextFromDate = options.fromDate ?? fromDate;
      const nextToDate = options.toDate ?? toDate;
      let statusParam = activeStatusFilters.includes('all') ? 'all' : activeStatusFilters.join(',');
      if (nextDateFilter === 'overdue') {
        statusParam = statusParam === 'all' ? 'overdue' : `${statusParam},overdue`;
      }

      const response = await axios.get(`/tasks/all/user/${userId}`, {
        params: {
          page,
          limit: taskLimit,
          period: nextFromDate || nextToDate || nextDateFilter === 'overdue' ? 'all' : nextDateFilter,
          fromDate: nextFromDate,
          toDate: nextToDate,
          search: searchQuery,
          status: statusParam,
          priority: priorityFilter,
        }
      });

      if (isMounted.current) {
        const nextTasks = response.data?.tasks || response.data?.data || [];
        setTasks(nextTasks);
        setTaskTotal(response.data?.pagination?.total || response.data?.total || nextTasks.length);
        setTaskTotalPages(response.data?.pagination?.pages || 1);
        setTaskPage(page);

        const statusCounts = response.data?.statusCounts;
        if (statusCounts) {
          setUserTaskStats({
            total: statusCounts.total || 0,
            pending: statusCounts.pending || { count: 0, percentage: 0 },
            inProgress: statusCounts.inProgress || { count: 0, percentage: 0 },
            completed: statusCounts.completed || { count: 0, percentage: 0 },
            rejected: statusCounts.rejected || { count: 0, percentage: 0 },
            overdue: statusCounts.overdue || { count: 0, percentage: 0 },
            onhold: statusCounts.onhold || statusCounts.onHold || { count: 0, percentage: 0 },
            reopen: statusCounts.reopen || { count: 0, percentage: 0 },
            cancelled: statusCounts.cancelled || { count: 0, percentage: 0 }
          });
        }

        if (nextTasks.length === 0) {
          showSnackbar(`No tasks found for ${user.name}`, 'info');
        }
      }

      return;
      
    } catch (err) {
      console.error("❌ Error fetching user tasks:", err);
      console.error("Error details:", err.response?.data);
      
      
      if (err.response?.status === 404 || err.code === 'ECONNABORTED' || err.response?.status === 500) {
        
        void 0;
        
        try {
          
          let personalTasks = [];
          try {
            const personalRes = await axios.get(`/task/user/${userId}/tasks`);
            void 0;
            
            if (personalRes.data) {
              if (personalRes.data.success && personalRes.data.tasks) {
                personalTasks = personalRes.data.tasks;
              } else if (personalRes.data.tasks) {
                personalTasks = personalRes.data.tasks;
              } else if (Array.isArray(personalRes.data)) {
                personalTasks = personalRes.data;
              } else if (personalRes.data.data && Array.isArray(personalRes.data.data)) {
                personalTasks = personalRes.data.data;
              }
            }
            
            personalTasks = personalTasks.map(task => ({ ...task, source: 'personal' }));
          } catch (personalErr) {
            void 0;
          }
          
          
          let assignedTasks = [];
          try {
            
            const assignedRes = await axios.get(`/tasks/user/${userId}/assigned-tasks`);
            void 0;
            
            if (assignedRes.data) {
              if (assignedRes.data.success && assignedRes.data.tasks) {
                assignedTasks = assignedRes.data.tasks;
              } else if (assignedRes.data.tasks) {
                assignedTasks = assignedRes.data.tasks;
              } else if (Array.isArray(assignedRes.data)) {
                assignedTasks = assignedRes.data;
              } else if (assignedRes.data.data && Array.isArray(assignedRes.data.data)) {
                assignedTasks = assignedRes.data.data;
              }
            }
            
            assignedTasks = assignedTasks.map(task => ({ ...task, source: 'assigned' }));
          } catch (assignedErr) {
            void 0;
          }
          
          void 0;
          void 0;
          
          
          const mergedTasksMap = new Map();
          personalTasks.forEach(task => {
            if (task._id) mergedTasksMap.set(task._id, task);
          });
          assignedTasks.forEach(task => {
            if (task._id && !mergedTasksMap.has(task._id)) {
              mergedTasksMap.set(task._id, task);
            }
          });
          
          let mergedTasks = Array.from(mergedTasksMap.values());
          
          
          mergedTasks.sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return bDate - aDate;
          });
          
          if (isMounted.current && mergedTasks.length > 0) {
            setTasks(mergedTasks);
            await fetchAllTaskLogs(mergedTasks);
            await fetchTaskStatusCounts(userId);
            
            
            showSnackbar(`Loaded ${mergedTasks.length} tasks (some APIs may be unavailable)`, 'warning');
          } else if (isMounted.current && mergedTasks.length === 0) {
            setTasks([]);
            showSnackbar(`No tasks found for ${user.name}`, 'info');
          }
          
        } catch (fallbackErr) {
          console.error("❌ Fallback also failed:", fallbackErr);
          if (isMounted.current) {
            setTasks([]);
            setError(
              err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.message ||
              "Error fetching tasks. Please try again."
            );
          }
        }
      } else {
        if (isMounted.current) {
          setTasks([]);
          setError(
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Error fetching tasks. Please try again."
          );
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      fetchingTasksForUser.current = null;
    }
  }, [
    activeStatusFilters,
    dateFilter,
    fetchAllTaskLogs,
    fetchTaskStatusCounts,
    fromDate,
    isTaskPageMode,
    priorityFilter,
    searchQuery,
    showSnackbar,
    taskLimit,
    taskPage,
    toDate,
    users,
  ]);

  
  

  
  useEffect(() => {
    if (!isTaskPageMode || !selectedUserId) return;
    if (skipNextTaskFetchRef.current) {
      skipNextTaskFetchRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setTaskPage(1);
      fetchUserTasks(selectedUserId, 1, { dateFilter, fromDate, toDate });
    }, 350);

    return () => clearTimeout(timer);
  }, [activeStatusFilters, dateFilter, fromDate, isTaskPageMode, priorityFilter, searchQuery, selectedUserId, taskLimit, toDate, fetchUserTasks]);

  useEffect(() => {
    if (!isTaskPageMode || !routeUserId || users.length === 0) return;
    if (selectedUserId === routeUserId) return;

    skipNextTaskFetchRef.current = true;
    fetchUserTasks(routeUserId, 1, {
      reset: true,
      dateFilter: 'today',
      fromDate: '',
      toDate: ''
    });
  }, [fetchUserTasks, isTaskPageMode, routeUserId, selectedUserId, users.length]);

  
  useEffect(() => {
    if (tasks.length > 0) {
      void 0;
      void 0;
    } else {
      void 0;
    }
  }, [tasks]);

  
  
  
  const fetchTaskRemarks = useCallback(async (taskId) => {
    if (!taskId) return;

    
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
      console.error("❌ Task not found for remarks:", taskId);
      showSnackbar('Task not found', 'error');
      return;
    }

    const taskType = getTaskType(task);
    setLoadingRemarks(true);
    
    try {
      let response;
      
      const source = task.__taskSource || task.taskSource || task.source || getTaskType(task);
      if (source === 'client') {
        void 0;
        response = await axios.get(`/tasks/client-tasks/${taskId}/client-remarks`);
      } else if (source === 'project') {
        void 0;
        response = await axios.get(`/tasks/project/${task.projectId}/tasks/${taskId}/remarks`);
      } else if (source === 'self' || source === 'personal') {
        void 0;
        response = await axios.get(`/tasks/self/${taskId}/remarks`);
      } else if (source === 'assigned') {
        void 0;
        response = await axios.get(`/tasks/assigned/${taskId}/remarks`);
      } else {
        void 0;
        response = await axios.get(`/task/${taskId}/remarks`);
      }
      
      void 0;
      
      
      const remarks = response.data.data || response.data.remarks || [];
      remarks.forEach((remark, index) => {
        if (remark.image) {
          void 0;
          void 0;
        }
      });
      
      setRemarksDialog({ 
        open: true, 
        taskId, 
        remarks: remarks
      });
    } catch (error) {
      console.error(`Error fetching remarks for task ${taskId} (${taskType}):`, error);
      showSnackbar('Failed to load remarks', 'error');
      setRemarksDialog({ 
        open: true, 
        taskId, 
        remarks: [] 
      });
    } finally {
      setLoadingRemarks(false);
    }
  }, [tasks, showSnackbar]);

  const handleViewRemarks = (task, e) => {
    e.stopPropagation();
    fetchTaskRemarks(task._id);
  };

  const handleCloseRemarksDialog = useCallback(() => {
    setRemarksDialog({ open: false, taskId: null, remarks: [] });
  }, []);

  
  
  
  const fetchActivityLogs = useCallback(async (taskId) => {
    if (!taskId) return;

    
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
      console.error("❌ Task not found for activity logs:", taskId);
      showSnackbar('Task not found', 'error');
      return;
    }

    const taskType = getTaskType(task);
    const source = task.__taskSource || task.taskSource || task.source || getTaskType(task);
    setLoadingActivity(true);
    
    try {
      let response;
      
      if (source === 'client') {
        void 0;
        response = await axios.get(`/tasks/client-tasks/${taskId}/client-activity-logs`);
      } else if (source === 'project') {
        void 0;
        response = await axios.get(`/tasks/project/${task.projectId}/tasks/${taskId}/activity`);
      } else {
        void 0;
        response = await axios.get(`/task/${taskId}/activity-logs`);
      }

      if (response.data.success && isMounted.current) {
        const logs = response.data.data || response.data.logs || [];
        setActivityLogs(logs);

        setAllTaskLogs(prev => ({
          ...prev,
          [taskId]: logs
        }));
      } else {
        setActivityLogs([]);
      }
    } catch (err) {
      console.error(`Error fetching activity logs for task ${taskId} (${taskType}):`, err);
      setActivityLogs([]);
    } finally {
      if (isMounted.current) {
        setLoadingActivity(false);
      }
    }
  }, [tasks, showSnackbar]);

  const handleViewActivityLogs = (task, e) => {
    e.stopPropagation();
    setSelectedTaskForActivity(task);
    fetchActivityLogs(task._id);
    setShowActivityLog(true);
  };

  const handleCloseActivityLog = useCallback(() => {
    setShowActivityLog(false);
    setSelectedTaskForActivity(null);
    setActivityLogs([]);
  }, []);

  
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setActiveStatusFilters(['all']);
    setDateFilter('today');
    setPriorityFilter('all');
    setFromDate('');
    setToDate('');
    setClockedInTodayOnly(false);
    setTaskPage(1);
    setShowStatusFilters(true);
    setSelectedDeptFilter('all');
    setSelectedRoleFilter('all');
    setSelectedStatusFilter('all');
    setSelectedPerfFilter('all');
    setSortBy('name-asc');
    setActiveDeptTab('all');
    setCurrentPage(1);

    try {
      const todayStr = getDateInputValue();
      sessionStorage.removeItem(buildEmpUsersCacheKey({ fromDate: todayStr, toDate: todayStr }));
    } catch {
      // ignore
    }
    fetchUsersWithTasks();
  }, [fetchUsersWithTasks]);

  
  const refreshContent = useCallback(() => {
    
    setSelectedUserId(null);
    setSelectedUser(null);
    setTasks([]);
    setTaskTotal(0);
    setTaskTotalPages(1);
    setAllTaskLogs({});
    setTodayTotalTime({ totalSeconds: 0, displayText: '0s' });
    setSelectedTaskForActivity(null);
    setShowActivityLog(false);
    setActivityLogs([]);
    setRemarksDialog({ open: false, taskId: null, remarks: [] });
    
    
    resetFilters();
    
    
    setError("");
    
    
    setShowStatusFilters(true);
    
    
    if (currentUser) {
      hasFetchedUsers.current = false;
      fetchUsersWithTasks();
    }
  }, [resetFilters, currentUser, fetchUsersWithTasks]);

  
  const handleCloseDialog = useCallback(() => {
    if (isTaskPageMode) {
      navigate('/ciisUser/company-all-task');
      return;
    }

    setOpenDialog(false);
    refreshContent();
  }, [isTaskPageMode, navigate, refreshContent]);

  
  useEffect(() => {
    if (isTaskPageMode) return;
    if (!openDialog) {
      
      setTasks([]);
      setTaskTotal(0);
      setTaskTotalPages(1);
      setAllTaskLogs({});
      setTodayTotalTime({ totalSeconds: 0, displayText: '0s' });
      setSelectedTaskForActivity(null);
      setShowActivityLog(false);
      setActivityLogs([]);
      setRemarksDialog({ open: false, taskId: null, remarks: [] });
      
      
      setError("");
    }
  }, [isTaskPageMode, openDialog]);

  

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not set";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  
  const getStatusCount = (status) => {
    switch (status) {
      case 'total': return filteredTaskStats.total || 0;
      case 'pending': return filteredTaskStats.pending?.count || 0;
      case 'in-progress': return filteredTaskStats.inProgress?.count || 0;
      case 'completed': return filteredTaskStats.completed?.count || 0;
      case 'rejected': return filteredTaskStats.rejected?.count || 0;
      case 'overdue': return filteredTaskStats.overdue?.count || 0;
      case 'onhold': return filteredTaskStats.onhold?.count || 0;
      case 'reopen': return filteredTaskStats.reopen?.count || 0;
      case 'cancelled': return filteredTaskStats.cancelled?.count || 0;
      default: return 0;
    }
  };

  // getInitials and getUserTaskStats are defined at module level above to prevent TDZ ReferenceError

  const getActivityIcon = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('create')) return <FiPlus size={14} />;
    if (actionLower.includes('update') || actionLower.includes('edit')) return <FiEdit3 size={14} />;
    if (actionLower.includes('status')) return <FiRefreshCw size={14} />;
    if (actionLower.includes('complete')) return <FiCheckCircle size={14} />;
    if (actionLower.includes('pending')) return <FiClock size={14} />;
    if (actionLower.includes('progress')) return <FiPlay size={14} />;
    if (actionLower.includes('hold')) return <FiPause size={14} />;
    if (actionLower.includes('cancel')) return <FiStopCircle size={14} />;
    if (actionLower.includes('reject')) return <FiXCircle size={14} />;
    if (actionLower.includes('assign')) return <FiUserCheck size={14} />;
    if (actionLower.includes('unassign')) return <FiUserX size={14} />;
    return <FiActivity size={14} />;
  };

  const getActivityColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('create')) return '#10b981';
    if (actionLower.includes('complete')) return '#059669';
    if (actionLower.includes('pending')) return '#f59e0b';
    if (actionLower.includes('progress')) return '#0ea5e9';
    if (actionLower.includes('hold')) return '#8b5cf6';
    if (actionLower.includes('cancel')) return '#dc2626';
    if (actionLower.includes('reject')) return '#dc2626';
    return '#6b7280';
  };

  

  const renderOverallStats = () => {
    const statusGradients = {
      'pending': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'in-progress': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      'completed': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'rejected': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      'onhold': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'overdue': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      'reopen': 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      'cancelled': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    };

    const getStatusGradient = (status) => statusGradients[status] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    return (
      <div className="TaskDetails-overall-stats">
        <div className="TaskDetails-overall-stats-header">
          <div className="TaskDetails-overall-stats-icon">
            <FiBarChart />
          </div>
          <h4>Today's Task Statistics</h4>
          {!isOwner() && (
            <span className="TaskDetails-role-badge" style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
              (Your Department Only)
            </span>
          )}
        </div>

        <div className="TaskDetails-overall-stats-grid">
          <div className="TaskDetails-overall-stat-card" key="total-stat">
            <div className="TaskDetails-overall-stat-content">
              <div
                className="TaskDetails-overall-stat-icon"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <FiList color="white" />
              </div>
              <div className="TaskDetails-overall-stat-number">
                {overallStats.total}
              </div>
              <div className="TaskDetails-overall-stat-label">
                Today's Tasks
              </div>
            </div>
          </div>

          {getNonZeroStatuses
            .filter((status) => status.value !== "all" && overallStats[status.value] > 0)
            .map((status) => {
              const percentage = Math.round(
                (overallStats[status.value] / overallStats.total) * 100
              ) || 0;

              return (
                <div
                  key={status.value}
                  className="TaskDetails-overall-stat-card"
                  style={{
                    borderColor: `${status.color}30`,
                    background: overallStats[status.value] > 0 ?
                      `linear-gradient(135deg, ${status.color}15 0%, ${status.color}08 100%)` :
                      'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <div className="TaskDetails-overall-stat-content">
                    <div
                      className="TaskDetails-overall-stat-icon"
                      style={{
                        background: getStatusGradient(status.value)
                      }}
                    >
                      {React.createElement(status.icon, {
                        color: "white",
                      })}
                    </div>
                    <div
                      className="TaskDetails-overall-stat-number"
                    >
                      {overallStats[status.value]}
                    </div>
                    <div className="TaskDetails-overall-stat-label">
                      {status.label}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  
  const renderStatusCards = () => {
    const statusGradients = {
      'pending': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'in-progress': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      'completed': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'rejected': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      'onhold': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'overdue': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      'reopen': 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      'cancelled': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      'all': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

    
    const allStatuses = STATUS_OPTIONS;

    return (
      <div className="TaskDetails-status-cards">
        <div className="TaskDetails-status-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="TaskDetails-status-icon">
              <FiActivity />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Task Status Distribution</h4>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280' }}>
                {selectedUser ? `${selectedUser.name}'s tasks` : 'All tasks'}
                {dateFilter !== 'all' && ` • Filtered by ${dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'overdue' ? 'Overdue' : 'Custom Range'}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowStatusFilters(!showStatusFilters)}
            style={{
              background: 'none',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {showStatusFilters ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
            {showStatusFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {showStatusFilters && (
          <div className="TaskDetails-status-grid">
            {allStatuses.map((status) => {
              const count = status.value === 'all' ? filteredTaskStats.total : getStatusCount(status.value);
              const isActive = activeStatusFilters.includes(status.value);
              const percentage = status.value !== 'all' ? filteredTaskStats[status.value]?.percentage || 0 : 0;
              const gradient = statusGradients[status.value] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

              
              const isZeroCount = count === 0;
              const cardOpacity = isZeroCount ? 0.5 : 1;

              return (
                <div
                  key={status.value}
                  className={`TaskDetails-status-card ${isActive ? 'TaskDetails-status-card-active' : ''} ${isZeroCount ? 'TaskDetails-status-card-zero' : ''}`}
                  onClick={() => handleStatusFilterToggle(status.value)}
                  style={{
                    borderColor: isActive ? status.color : 'rgba(102, 126, 234, 0.15)',
                    background: isActive ? `${status.color}15` : 'rgba(255, 255, 255, 0.7)',
                    opacity: cardOpacity,
                    cursor: isZeroCount && !isActive ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div className="TaskDetails-status-content">
                    <div
                      className="TaskDetails-status-card-icon"
                      style={{
                        background: gradient,
                        opacity: isZeroCount ? 0.5 : 1
                      }}
                    >
                      {React.createElement(status.icon, {
                        color: "white"
                      })}
                    </div>
                    <div
                      className="TaskDetails-status-card-number"
                      style={{
                        background: gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: isZeroCount ? '#999' : 'transparent',
                        color: isZeroCount ? '#999' : 'inherit'
                      }}
                    >
                      {count}
                    </div>
                    <div className="TaskDetails-status-card-label">
                      {status.label}
                    </div>

                    {status.value !== 'all' && (
                      <div style={{ width: '100%', marginTop: '0.25rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.125rem'
                        }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            background: gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: isZeroCount ? '#999' : 'transparent',
                            color: isZeroCount ? '#999' : 'inherit'
                          }}>
                            {percentage}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            borderRadius: 2,
                            background: gradient,
                            opacity: isZeroCount ? 0.3 : 1
                          }} />
                        </div>
                      </div>
                    )}

                    {isActive && (
                      <div style={{
                        marginTop: '0.25rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}>
                        <span style={{
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          color: '#667eea'
                        }}>
                          ✓ Active
                        </span>
                      </div>
                    )}

                    {isZeroCount && !isActive && (
                      <div style={{
                        marginTop: '0.25rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        fontSize: '0.6rem',
                        color: '#999'
                      }}>
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  
  const renderEnhancedUserCard = (user) => {
    const isSelected = selectedUserId === (user._id || user.id);
    const isLoading = loading && fetchingTasksForUser.current?.startsWith(`${user._id || user.id}-`);
    const userStats = getUserTaskStats(user);
    const completionRate = userStats.completionRate || 0;
    const badgeClass = completionRate >= 80 ? 'TaskDetails-user-avatar-badge-high' :
      completionRate >= 50 ? 'TaskDetails-user-avatar-badge-medium' :
        'TaskDetails-user-avatar-badge-low';
    const progressClass = completionRate >= 80 ? 'TaskDetails-progress-fill-high' :
      completionRate >= 50 ? 'TaskDetails-progress-fill-medium' :
        'TaskDetails-progress-fill-low';

    const userId = user._id || user.id;

    return (
      <div
        key={userId}
        className={`TaskDetails-user-card ${isSelected ? 'TaskDetails-user-card-selected' : ''} ${isLoading ? 'TaskDetails-user-card-loading' : ''}`}
        onClick={() => {
          if (userId && !isLoading) {
            openUserTasksPage(userId);
          }
        }}
      >
        <div className="TaskDetails-user-card-content">
          <div className="TaskDetails-user-header">
            <div className="TaskDetails-user-avatar">
              {getInitials(user.name)}
              <div className={`TaskDetails-user-avatar-badge ${badgeClass}`}></div>
            </div>
            <div className="TaskDetails-user-info">
              <div className="TaskDetails-user-name">
                {user.name || "Unknown"}
              </div>
              <div className="TaskDetails-user-role">
                <FiBriefcase size={12} />
                {getUserDisplayRole(user, jobRoleMap)}
              </div>
              <div className="TaskDetails-user-email">
                {user.email || "No Email"}
              </div>
              {user.department && (
                <div className="TaskDetails-user-department" style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.2rem', display: 'flex', gap: '4px' }}>
                  <FiUsers size={10} /> Dept: {getDepartmentName(user.department)}
                </div>
              )}
            </div>
          </div>

          <div className="TaskDetails-stats-box">
            <div className="TaskDetails-stats-row">
              <div className="TaskDetails-stat-item">
                <div className="TaskDetails-stat-number TaskDetails-total-stat">
                  {userStats.total || 0}
                </div>
                <div className="TaskDetails-stat-label">TOTAL</div>
              </div>
              <div className="TaskDetails-stat-item">
                <div className="TaskDetails-stat-number TaskDetails-completed-stat">
                  {userStats.completed || 0}
                </div>
                <div className="TaskDetails-stat-label">DONE</div>
              </div>
              <div className="TaskDetails-stat-item">
                <div
                  className="TaskDetails-stat-number TaskDetails-rate-stat"
                  style={{
                    color: completionRate >= 80 ? "#28a745" :
                      completionRate >= 50 ? "#FFC107" : "#F44336"
                  }}
                >
                  {completionRate}%
                </div>
                <div className="TaskDetails-stat-label">RATE</div>
              </div>
            </div>

            <div className="TaskDetails-progress-container">
              <div className="TaskDetails-progress-header">
                <div className="TaskDetails-progress-label">Progress</div>
                <div className="TaskDetails-progress-percentage">{completionRate}%</div>
              </div>
              <div className="TaskDetails-progress-bar">
                <div
                  className={`TaskDetails-progress-fill ${progressClass}`}
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <button
            className={`TaskDetails-action-button ${isSelected ? 'TaskDetails-action-button-primary' : 'TaskDetails-action-button-outlined'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (userId && !isLoading) {
                openUserTasksPage(userId);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="TaskDetails-button-spinner" />
                Loading...
              </>
            ) : (
              <>
                View Tasks
                <FiArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderTodayTotalTime = () => {
    if (todayTotalTime.taskCount === 0) return null;

    return (
      <div >
      </div>
    );
  };

  
    const renderActivityLogModal = () => {
    if (!showActivityLog || !selectedTaskForActivity) return null;

    return (
      <div className="company-task-modal-backdrop" onClick={handleCloseActivityLog}>
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
                    {activityLogs?.length || 0} {activityLogs?.length === 1 ? "Event" : "Events"}
                  </span>
                </div>
                {selectedTaskForActivity?.title && (
                  <p className="task-activity-task-subtitle">
                    Task: <span className="task-title-highlight">{selectedTaskForActivity.title}</span>
                    {selectedTaskForActivity.serialNo && ` (#${selectedTaskForActivity.serialNo})`}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="task-activity-close-btn"
              onClick={handleCloseActivityLog}
              title="Close Modal"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Timeline Body */}
          <div className="task-activity-modal-body">
            {loadingActivity ? (
              <div className="task-activity-empty-state">
                <div className="task-activity-spinner" />
                <p>Loading activity logs...</p>
              </div>
            ) : activityLogs?.length ? (
              <div className="task-activity-timeline">
                {activityLogs.map((log, i) => {
                  const meta = getActivityMeta(log);
                  const userName = log.userName || log.user?.name || log.performedBy?.name || (typeof log.performedBy === "string" && log.performedBy.length > 5 ? log.performedBy : null) || (log.action?.toLowerCase().includes("system") ? "System" : "Team Member");
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
                        {i < activityLogs.length - 1 && <div className="task-activity-node-line" />}
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
    );
  };

  
    const renderRemarksDialog = () => {
    if (!remarksDialog.open) return null;

    const task = tasks.find(t => t._id === remarksDialog.taskId);

    return (
      <div className="company-task-modal-backdrop" onClick={handleCloseRemarksDialog}>
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
                    {remarksDialog.remarks?.length || 0} {remarksDialog.remarks?.length === 1 ? "Remark" : "Remarks"}
                  </span>
                </div>
                {task?.title && (
                  <p className="task-activity-task-subtitle">
                    Task: <span className="task-title-highlight">{task.title}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="task-activity-close-btn"
              onClick={handleCloseRemarksDialog}
              title="Close Modal"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="task-activity-modal-body">
            {loadingRemarks ? (
              <div className="task-activity-empty-state">
                <div className="task-activity-spinner" />
                <p>Loading remarks...</p>
              </div>
            ) : remarksDialog.remarks?.length ? (
              <div className="task-activity-timeline">
                {remarksDialog.remarks.map((r, i) => {
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
                    if (rawId && curId && rawId === curId) return currentUser?.name || "You";
                    if (rawId && Array.isArray(taskObj?.assignedUsers)) {
                      const matched = taskObj.assignedUsers.find((u) => String(u?._id || u?.id || u) === rawId);
                      if (matched?.name) return matched.name;
                    }
                    if (typeof item.user === "string" && item.user.trim() && !/^[0-9a-fA-F]{24}$/.test(item.user.trim())) {
                      return item.user.trim();
                    }
                    return currentUser?.name || "User";
                  };

                  const userName = resolveRemarkUser(r, remarksDialog.task);
                  const initials = getInitials(userName);
                  const isSystem = userName.toLowerCase() === "system";
                  const dateStr = formatDateTime(r.createdAt || r.date || r.timestamp);
                  const text = r.remark || r.text || r.message || r.comment || "No comment content";

                  return (
                    <div className="task-activity-item" key={r._id || i}>
                      <div className="task-activity-node-col">
                        <div className="task-activity-node-icon" style={{ color: "#5925dc", backgroundColor: "#f4f3ff", borderColor: "#d9d6fe" }}>
                          <FiMessageSquare size={13} />
                        </div>
                        {i < remarksDialog.remarks.length - 1 && <div className="task-activity-node-line" />}
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
                              <span className="task-activity-action-tag badge-remark" style={{ color: "#5925dc", backgroundColor: "#f4f3ff", borderColor: "#d9d6fe" }}>
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
                          {r.image && (
                            <div style={{ marginTop: '8px' }}>
                              <img
                                src={getImageUrl(r.image)}
                                alt="Remark attachment"
                                style={{ maxWidth: '200px', maxHeight: '180px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #eaecf0' }}
                                onClick={() => setZoomImage(getImageUrl(r.image))}
                              />
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
    );
  };

  // NEW: Render image zoom modal
  const renderImageZoomModal = () => {
    if (!zoomImage) return null;

    return (
      <div className="TaskDetails-activity-modal-overlay" onClick={() => setZoomImage(null)}>
        <div style={{ 
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
        }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setZoomImage(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiX size={20} />
          </button>
          <img
            src={zoomImage}
            alt="Zoomed view"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
      </div>
    );
  };

  // NEW: Render snackbar
  const renderSnackbar = () => {
    if (!snackbar.open) return null;

    const ToastIcon = snackbar.severity === 'success'
      ? FiCheckCircle
      : snackbar.severity === 'error'
        ? FiXCircle
        : snackbar.severity === 'warning'
          ? FiAlertTriangle
          : FiInfo;

    return (
      <div className="emp-task-toast-region" role="status" aria-live="polite">
        <div className={`emp-task-toast emp-task-toast--${snackbar.severity}`}>
          <div className="emp-task-toast__icon" aria-hidden="true">
            <ToastIcon size={21} />
          </div>
          <div className="emp-task-toast__copy">
            <strong>{snackbar.severity === 'success' ? 'Success' : snackbar.severity === 'error' ? 'Something went wrong' : 'Notice'}</strong>
            <span>{snackbar.message}</span>
          </div>
          <button
            type="button"
            className="emp-task-toast__close"
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            aria-label="Dismiss notification"
          >
            <FiX size={17} />
          </button>
        </div>
      </div>
    );
  };

  // UPDATED: renderEnhancedDialog with task type display in each task card
  const renderEnhancedDialog = () => {
    if (!isTaskPageMode) return null;

    const content = (
      <div className={`TaskDetails-modal ${isTaskPageMode ? 'TaskDetails-page-panel' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="TaskDetails-modal-header">
          <div className="TaskDetails-modal-header-content">
            <div className="TaskDetails-modal-user-badge">
              <div className="TaskDetails-modal-avatar-wrapper">
                <div className="TaskDetails-modal-avatar">
                  {getInitials(selectedUser?.name)}
                </div>
                <div className={`TaskDetails-modal-status-badge ${selectedUser?.isActive ? 'active' : 'inactive'
                  }`} />
              </div>
              <div className="TaskDetails-modal-user-details">
                <h2 className="TaskDetails-modal-user-name">
                  {selectedUser?.name}
                </h2>
                <div className="TaskDetails-modal-user-meta">
                  <span className="TaskDetails-modal-user-role">
                    <FiBriefcase size={14} />
                    {getUserDisplayRole(selectedUser, jobRoleMap)}
                  </span>
                  <span className="TaskDetails-modal-user-email">
                    <FiMail size={14} />
                    {selectedUser?.email}
                  </span>
                  {selectedUser?.department && (
                    <span className="TaskDetails-modal-user-department">
                      <FiUsers size={14} />
                      {getDepartmentName(selectedUser.department)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              className="TaskDetails-modal-close-btn"
              onClick={handleCloseDialog}
              aria-label={isTaskPageMode ? 'Back to employees' : 'Close modal'}
            >
              {isTaskPageMode ? <FiChevronLeft size={20} /> : <FiX size={20} />}
            </button>
          </div>

          <div className="TaskDetails-modal-quick-stats">
            <div className="TaskDetails-modal-stat-pill">
              <FiList size={14} />
              <span>Total: {filteredTaskStats.total}</span>
            </div>
            <div className="TaskDetails-modal-stat-pill">
              <FiCheckCircle size={14} />
              <span>Completed: {filteredTaskStats.completed?.count || 0}</span>
            </div>
            <div className="TaskDetails-modal-stat-pill">
              <FiClock size={14} />
              <span>Pending: {filteredTaskStats.pending?.count || 0}</span>
            </div>
          </div>
        </div>

        <div className="TaskDetails-modal-body">
          {renderTodayTotalTime()}

          <div className="TaskDetails-modal-section">
            <div className="TaskDetails-modal-section-header">
              <div className="TaskDetails-modal-section-title">
                <FiPieChart size={18} />
                <h3>Task Status Overview</h3>
              </div>
              <button
                className="TaskDetails-modal-toggle-filters"
                onClick={() => setShowStatusFilters(!showStatusFilters)}
              >
                {showStatusFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                <span>{showStatusFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>

            {showStatusFilters && (
              <div className="TaskDetails-modal-status-grid">
                {STATUS_OPTIONS.filter(s => s.value !== 'all').map((status) => {
                  const count = getStatusCount(status.value);
                  // Show all statuses based on filtered tasks

                  const isActive = activeStatusFilters.includes(status.value);
                  const percentage = filteredTaskStats[status.value]?.percentage || 0;
                  const isZeroCount = count === 0;

                  return (
                    <button
                      key={status.value}
                      className={`TaskDetails-modal-status-chip ${isActive ? 'active' : ''
                        } ${isZeroCount ? 'zero' : ''}`}
                      onClick={() => !isZeroCount && handleStatusFilterToggle(status.value)}
                      disabled={isZeroCount && !isActive}
                      style={{
                        '--status-color': status.color,
                        '--status-bg': status.bgColor,
                        opacity: isZeroCount && !isActive ? 0.5 : 1,
                        cursor: isZeroCount && !isActive ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <div className="TaskDetails-modal-status-chip-content">
                        <div className="TaskDetails-modal-status-chip-icon">
                          {React.createElement(status.icon, { size: 14 })}
                        </div>
                        <div className="TaskDetails-modal-status-chip-info">
                          <span className="TaskDetails-modal-status-chip-label">
                            {status.label}
                          </span>
                          <span className="TaskDetails-modal-status-chip-count">
                            {count}
                          </span>
                        </div>
                        <div className="TaskDetails-modal-status-chip-progress">
                          <div
                            className="TaskDetails-modal-status-chip-progress-bar"
                            style={{
                              width: `${percentage}%`,
                              opacity: isZeroCount ? 0.3 : 1
                            }}
                          />
                        </div>
                      </div>
                      {isActive && (
                        <div className="TaskDetails-modal-status-chip-check">
                          <FiCheckCircle size={12} />
                        </div>
                      )}
                      {isZeroCount && !isActive && (
                        <div className="TaskDetails-modal-status-chip-zero-label">
                          No tasks
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="TaskDetails-modal-section">
            <div className="TaskDetails-modal-search-filters">
              <div className="TaskDetails-modal-search-wrapper">
                <FiSearch size={16} className="TaskDetails-modal-search-icon" />
                <input
                  type="text"
                  className="TaskDetails-modal-search-input"
                  placeholder="Search tasks by title, description, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="TaskDetails-modal-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              <div className="TaskDetails-modal-filter-group">
                <select
                  className="TaskDetails-modal-filter-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select
                  className="TaskDetails-modal-filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="TaskDetails-modal-date-range">
                <div className="TaskDetails-modal-date-input">
                  <FiCalendar size={14} />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setToDate(e.target.value);
                    }}
                    placeholder="Select Date"
                  />
                </div>
                {(fromDate || toDate) && (
                  <button
                    className="TaskDetails-modal-date-clear"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {(activeStatusFilters.length > 0 && !activeStatusFilters.includes('all')) && (
                <div className="TaskDetails-modal-active-filters">
                  <span className="TaskDetails-modal-active-filters-label">
                    Active filters:
                  </span>
                  {activeStatusFilters.map(status => {
                    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
                    return (
                      <span
                        key={status}
                        className="TaskDetails-modal-active-filter-tag"
                        style={{ backgroundColor: statusOption?.bgColor }}
                      >
                        {statusOption?.label}
                        <button onClick={() => handleStatusFilterToggle(status)}>
                          <FiX size={12} />
                        </button>
                      </span>
                    );
                  })}
                  <button
                    className="TaskDetails-modal-clear-filters"
                    onClick={resetFilters}
                  >
                    <FiRefreshCw size={12} />
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="TaskDetails-modal-section TaskDetails-modal-tasks-section">
            <div className="TaskDetails-modal-tasks-header">
              <div className="TaskDetails-modal-tasks-title">
                <FiList size={18} />
                <h3>Tasks</h3>
                <span className="TaskDetails-modal-tasks-count">
                  {filteredTasks.length} of {taskTotal}
                </span>
              </div>
              <div className="TaskDetails-modal-tasks-sort">
                <span>Sort by: Latest</span>
                <FiChevronDown size={14} />
              </div>
            </div>

            {loading ? (
              <div className="TaskDetails-modal-loading">
                <div className="TaskDetails-modal-loading-spinner" />
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="TaskDetails-modal-empty">
                <div className="TaskDetails-modal-empty-icon">
                  <FiArchive size={32} />
                </div>
                <h4>No tasks found</h4>
                <p>
                  {tasks.length === 0 
                    ? 'No personal or assigned tasks available for this employee' 
                    : 'Try adjusting your search or filters'}
                </p>
                {tasks.length === 0 && (
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    <p>📌 This employee has no tasks assigned yet</p>
                    <p>💡 You can assign tasks from the task creation section</p>
                  </div>
                )}
                <button
                  className="TaskDetails-modal-empty-reset"
                  onClick={resetFilters}
                >
                  <FiRefreshCw size={14} />
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="TaskDetails-modal-tasks-list">
                {filteredTasks.map((task) => {
                  let status = task.userStatus || task.status || task.overallStatus;

                  const dueDate = getTaskDueDate(task);
                  if (isTaskOverdueByDate(dueDate, status)) {
                    status = 'overdue';
                  }

                  // Get complete status object with color and bgColor
                  const statusObject = getStatusObject(status);
                  
                  const isToday = isSameDay(getSourceAwareTaskDate(task, allTaskLogs[task._id] || []), today);
                  const isOverdue = isTaskOverdueByDate(dueDate, status);

                  const taskLogs = allTaskLogs[task._id] || [];
                  const timeData = calculateTaskActiveTime(taskLogs);
                  const taskType = getTaskType(task);

                  return (
                    <div
                      key={task._id}
                      className={`TaskDetails-modal-task-card ${isToday ? 'today' : ''
                        } ${isOverdue ? 'overdue' : ''}`}
                      style={{ 
                        '--status-color': statusObject.color,
                        backgroundColor: statusObject.bgColor,
                        borderLeft: `3px solid ${statusObject.color}`
                      }}
                    >
                      <div className="TaskDetails-modal-task-card-header">
                        <div className="TaskDetails-modal-task-title-section">
                          <h4 className="TaskDetails-modal-task-title">
                            {task.title || 'Untitled Task'}
                          </h4>
                          <span
                            className="TaskDetails-modal-task-status"
                            style={{
                              backgroundColor: statusObject.bgColor,
                              color: statusObject.color,
                              border: `1px solid ${statusObject.color}`
                            }}
                          >
                            {statusObject.label}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '0.25rem',
                            backgroundColor: taskType === 'assigned' ? '#e3f2fd' : '#fff3e0',
                            color: taskType === 'assigned' ? '#1976d2' : '#f57c00',
                            marginLeft: '0.5rem'
                          }}>
                            {taskType === 'assigned' ? '📋 Assigned' : '👤 Personal'}
                          </span>
                        </div>
                        <span className={`TaskDetails-modal-task-priority ${task.priority || 'medium'}`}>
                          {task.priority || 'medium'}
                        </span>
                      </div>

                      {task.description && (
                        <p className="TaskDetails-modal-task-description">
                          {task.description}
                        </p>
                      )}

                      <div className="TaskDetails-modal-task-time-info">
                        <div className="TaskDetails-modal-task-time-item">
                          <FiClock size={12} />
                          <span className="TaskDetails-modal-task-time-label">Created:</span>
                          <span className="TaskDetails-modal-task-time-value">
                            {formatDateTime(task.createdAt)}
                          </span>
                        </div>

                        {/* UPDATED: Time tracking display for both personal and assigned tasks */}
                        <div className="TaskDetails-modal-task-time-item">
                          {timeData.currentStatus === 'in-progress' ? (
                            <FiPlay size={12} color="#10b981" />
                          ) : timeData.currentStatus === 'onhold' ? (
                            <FiPause size={12} color="#f59e0b" />
                          ) : (
                            <FiCheckCircle size={12} color="#6b7280" />
                          )}
                          <span className="TaskDetails-modal-task-time-label">Active:</span>
                          <span className="TaskDetails-modal-task-time-value" style={{
                            color: timeData.currentStatus === 'in-progress' ? '#10b981' :
                              timeData.currentStatus === 'onhold' ? '#f59e0b' : '#6b7280',
                            fontWeight: 600
                          }}>
                            {timeData.displayText}
                          </span>
                        </div>

                        {task.updatedAt && task.updatedAt !== task.createdAt && (
                          <div className="TaskDetails-modal-task-time-item">
                            <FiRefreshCw size={12} />
                            <span className="TaskDetails-modal-task-time-label">Updated:</span>
                            <span className="TaskDetails-modal-task-time-value">
                              {formatDateTime(task.updatedAt)}
                            </span>
                          </div>
                        )}
                        {task.dueDateTime && (
                          <div className="TaskDetails-modal-task-time-item">
                            <FiCalendar size={12} />
                            <span className="TaskDetails-modal-task-time-label">Due:</span>
                            <span className="TaskDetails-modal-task-time-value">
                              {formatDateTime(task.dueDateTime)}
                              {isToday && <span className="TaskDetails-modal-task-time-badge today">Today</span>}
                              {isOverdue && <span className="TaskDetails-modal-task-time-badge overdue">Overdue</span>}
                            </span>
                          </div>
                        )}

                        {task.lastEditedByName && (
                          <div className="TaskDetails-modal-task-time-item task-edited-info" style={{ gridColumn: '1 / -1' }}>
                            <FiEdit3 size={12} color="#d97706" />
                            <span className="TaskDetails-modal-task-time-label" style={{ color: '#b45309' }}>Edited:</span>
                            <span className="TaskDetails-modal-task-time-value" style={{ color: '#92400e' }}>
                              by <strong>{task.lastEditedByName}</strong> {task.lastEditedAt && `(${formatDateTime(task.lastEditedAt)})`}
                              {task.lastEditChanges && <span style={{ display: 'block', fontSize: '0.75rem', color: '#78350f', marginTop: '2px' }}>{task.lastEditChanges}</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="TaskDetails-modal-task-actions">
                        {/* Remarks Button */}
                        <button
                          className="TaskDetails-modal-task-activity-btn"
                          onClick={(e) => handleViewRemarks(task, e)}
                          style={{ marginRight: '8px' }}
                        >
                          <FiMessageSquare size={14} />
                          <span>View Remarks</span>
                        </button>

                        <button
                          className="TaskDetails-modal-task-activity-btn"
                          onClick={(e) => handleViewActivityLogs(task, e)}
                        >
                          <FiActivity size={14} />
                          <span>View Activity Log</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="TaskDetails-modal-pagination">
                  <div className="TaskDetails-modal-page-size">
                    {[10, 25, 50].map(size => (
                      <button
                        key={size}
                        className={`TaskDetails-modal-page-size-btn ${taskLimit === size ? 'active' : ''}`}
                        onClick={() => {
                          setTaskLimit(size);
                          setTaskPage(1);
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <div className="TaskDetails-modal-page-info">
                    Showing {taskTotal === 0 ? 0 : ((taskPage - 1) * taskLimit) + 1}
                    -{Math.min(taskPage * taskLimit, taskTotal)} of {taskTotal}
                  </div>
                  <div className="TaskDetails-modal-page-controls">
                    <button
                      className="TaskDetails-modal-page-btn"
                      disabled={taskPage <= 1 || loading}
                      onClick={() => fetchUserTasks(selectedUserId, Math.max(1, taskPage - 1))}
                    >
                      Previous
                    </button>
                    <span className="TaskDetails-modal-page-current">
                      Page {taskPage} of {taskTotalPages}
                    </span>
                    <button
                      className="TaskDetails-modal-page-btn"
                      disabled={taskPage >= taskTotalPages || loading}
                      onClick={() => fetchUserTasks(selectedUserId, Math.min(taskTotalPages, taskPage + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="TaskDetails-modal-footer">
          <div className="TaskDetails-modal-footer-stats">
            <span>Total: {taskTotal} tasks</span>
            <span>•</span>
            <span>Completed: {filteredTasks.filter(t =>
              (t.userStatus || t.status) === 'completed'
            ).length}</span>
            <span>•</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              Today: {todayTotalTime.displayText}
            </span>
          </div>
          <button
            className="TaskDetails-modal-close-footer-btn"
            onClick={handleCloseDialog}
          >
            {isTaskPageMode ? 'Back' : 'Close'}
          </button>
        </div>
      </div>
    );

    if (isTaskPageMode) {
      return (
        <div className="TaskDetails-page-container">
          <div className="TaskDetails-page-header">
            <button
              type="button"
              className="TaskDetails-page-back"
              onClick={handleCloseDialog}
            >
              <FiChevronLeft size={18} />
              <span>Back to employees</span>
            </button>
            <div className="TaskDetails-page-title">
              <h1>{selectedUser?.name ? `${selectedUser.name}'s Tasks` : 'Employee Tasks'}</h1>
              <p>Personal and assigned task details with filters, remarks, and activity logs.</p>
            </div>
          </div>
          {content}
        </div>
      );
    }

    return (
      <div className="TaskDetails-modal-overlay" onClick={handleCloseDialog}>
        {content}
        {/* Legacy modal markup removed in page mode; content is reused above. */}
        <div style={{ display: 'none' }} className="TaskDetails-modal" onClick={(e) => e.stopPropagation()}>
          <div className="TaskDetails-modal-header">
            <div className="TaskDetails-modal-header-content">
              <div className="TaskDetails-modal-user-badge">
                <div className="TaskDetails-modal-avatar-wrapper">
                  <div className="TaskDetails-modal-avatar">
                    {getInitials(selectedUser?.name)}
                  </div>
                  <div className={`TaskDetails-modal-status-badge ${selectedUser?.isActive ? 'active' : 'inactive'
                    }`} />
                </div>
                <div className="TaskDetails-modal-user-details">
                  <h2 className="TaskDetails-modal-user-name">
                    {selectedUser?.name}
                  </h2>
                  <div className="TaskDetails-modal-user-meta">
                    <span className="TaskDetails-modal-user-role">
                      <FiBriefcase size={14} />
                      {getUserDisplayRole(selectedUser, jobRoleMap)}
                    </span>
                    <span className="TaskDetails-modal-user-email">
                      <FiMail size={14} />
                      {selectedUser?.email}
                    </span>
                    {selectedUser?.department && (
                      <span className="TaskDetails-modal-user-department">
                        <FiUsers size={14} />
                        {getDepartmentName(selectedUser.department)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="TaskDetails-modal-close-btn"
                onClick={handleCloseDialog}
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="TaskDetails-modal-quick-stats">
              <div className="TaskDetails-modal-stat-pill">
                <FiList size={14} />
                <span>Total: {filteredTaskStats.total}</span>
              </div>
              <div className="TaskDetails-modal-stat-pill">
                <FiCheckCircle size={14} />
                <span>Completed: {filteredTaskStats.completed?.count || 0}</span>
              </div>
              <div className="TaskDetails-modal-stat-pill">
                <FiClock size={14} />
                <span>Pending: {filteredTaskStats.pending?.count || 0}</span>
              </div>
            </div>
          </div>

          <div className="TaskDetails-modal-body">
            {renderTodayTotalTime()}

            <div className="TaskDetails-modal-section">
              <div className="TaskDetails-modal-section-header">
                <div className="TaskDetails-modal-section-title">
                  <FiPieChart size={18} />
                  <h3>Task Status Overview</h3>
                </div>
                <button
                  className="TaskDetails-modal-toggle-filters"
                  onClick={() => setShowStatusFilters(!showStatusFilters)}
                >
                  {showStatusFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  <span>{showStatusFilters ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
              </div>

              {showStatusFilters && (
                <div className="TaskDetails-modal-status-grid">
                  {STATUS_OPTIONS.filter(s => s.value !== 'all').map((status) => {
                    const count = getStatusCount(status.value);
                    // Show all statuses based on filtered tasks

                    const isActive = activeStatusFilters.includes(status.value);
                    const percentage = filteredTaskStats[status.value]?.percentage || 0;
                    const isZeroCount = count === 0;

                    return (
                      <button
                        key={status.value}
                        className={`TaskDetails-modal-status-chip ${isActive ? 'active' : ''
                          } ${isZeroCount ? 'zero' : ''}`}
                        onClick={() => !isZeroCount && handleStatusFilterToggle(status.value)}
                        disabled={isZeroCount && !isActive}
                        style={{
                          '--status-color': status.color,
                          '--status-bg': status.bgColor,
                          opacity: isZeroCount && !isActive ? 0.5 : 1,
                          cursor: isZeroCount && !isActive ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <div className="TaskDetails-modal-status-chip-content">
                          <div className="TaskDetails-modal-status-chip-icon">
                            {React.createElement(status.icon, { size: 14 })}
                          </div>
                          <div className="TaskDetails-modal-status-chip-info">
                            <span className="TaskDetails-modal-status-chip-label">
                              {status.label}
                            </span>
                            <span className="TaskDetails-modal-status-chip-count">
                              {count}
                            </span>
                          </div>
                          <div className="TaskDetails-modal-status-chip-progress">
                            <div
                              className="TaskDetails-modal-status-chip-progress-bar"
                              style={{
                                width: `${percentage}%`,
                                opacity: isZeroCount ? 0.3 : 1
                              }}
                            />
                          </div>
                        </div>
                        {isActive && (
                          <div className="TaskDetails-modal-status-chip-check">
                            <FiCheckCircle size={12} />
                          </div>
                        )}
                        {isZeroCount && !isActive && (
                          <div className="TaskDetails-modal-status-chip-zero-label">
                            No tasks
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="TaskDetails-modal-section">
              <div className="TaskDetails-modal-search-filters">
                <div className="TaskDetails-modal-search-wrapper">
                  <FiSearch size={16} className="TaskDetails-modal-search-icon" />
                  <input
                    type="text"
                    className="TaskDetails-modal-search-input"
                    placeholder="Search tasks by title, description, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="TaskDetails-modal-search-clear"
                      onClick={() => setSearchQuery('')}
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>

                <div className="TaskDetails-modal-filter-group">
                  <select
                    className="TaskDetails-modal-filter-select"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="overdue">Overdue</option>
                  </select>

                  <select
                    className="TaskDetails-modal-filter-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div className="TaskDetails-modal-date-range">
                  <div className="TaskDetails-modal-date-input">
                    <FiCalendar size={14} />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setToDate(e.target.value);
                      }}
                      placeholder="Select Date"
                    />
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      className="TaskDetails-modal-date-clear"
                      onClick={() => {
                        setFromDate('');
                        setToDate('');
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {(activeStatusFilters.length > 0 && !activeStatusFilters.includes('all')) && (
                  <div className="TaskDetails-modal-active-filters">
                    <span className="TaskDetails-modal-active-filters-label">
                      Active filters:
                    </span>
                    {activeStatusFilters.map(status => {
                      const statusOption = STATUS_OPTIONS.find(s => s.value === status);
                      return (
                        <span
                          key={status}
                          className="TaskDetails-modal-active-filter-tag"
                          style={{ backgroundColor: statusOption?.bgColor }}
                        >
                          {statusOption?.label}
                          <button onClick={() => handleStatusFilterToggle(status)}>
                            <FiX size={12} />
                          </button>
                        </span>
                      );
                    })}
                    <button
                      className="TaskDetails-modal-clear-filters"
                      onClick={resetFilters}
                    >
                      <FiRefreshCw size={12} />
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="TaskDetails-modal-section TaskDetails-modal-tasks-section">
              <div className="TaskDetails-modal-tasks-header">
                <div className="TaskDetails-modal-tasks-title">
                  <FiList size={18} />
                  <h3>Tasks</h3>
                  <span className="TaskDetails-modal-tasks-count">
                    {filteredTasks.length} of {taskTotal}
                  </span>
                </div>
                <div className="TaskDetails-modal-tasks-sort">
                  <span>Sort by: Latest</span>
                  <FiChevronDown size={14} />
                </div>
              </div>

              {loading ? (
                <div className="TaskDetails-modal-loading">
                  <div className="TaskDetails-modal-loading-spinner" />
                  <p>Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="TaskDetails-modal-empty">
                  <div className="TaskDetails-modal-empty-icon">
                    <FiArchive size={32} />
                  </div>
                  <h4>No tasks found</h4>
                  <p>
                    {tasks.length === 0 
                      ? 'No personal or assigned tasks available for this employee' 
                      : 'Try adjusting your search or filters'}
                  </p>
                  {tasks.length === 0 && (
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                      <p>📌 This employee has no tasks assigned yet</p>
                      <p>💡 You can assign tasks from the task creation section</p>
                    </div>
                  )}
                  <button
                    className="TaskDetails-modal-empty-reset"
                    onClick={resetFilters}
                  >
                    <FiRefreshCw size={14} />
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="TaskDetails-modal-tasks-list">
                  {filteredTasks.map((task) => {
                    let status = task.userStatus || task.status || task.overallStatus;

                    const dueDate = getTaskDueDate(task);
                    if (isTaskOverdueByDate(dueDate, status)) {
                      status = 'overdue';
                    }

                    // Get complete status object with color and bgColor
                    const statusObject = getStatusObject(status);
                    
                    const isToday = isSameDay(getSourceAwareTaskDate(task, allTaskLogs[task._id] || []), today);
                    const isOverdue = isTaskOverdueByDate(dueDate, status);

                    const taskLogs = allTaskLogs[task._id] || [];
                    const timeData = calculateTaskActiveTime(taskLogs);
                    const taskType = getTaskType(task);

                    return (
                      <div
                        key={task._id}
                        className={`TaskDetails-modal-task-card ${isToday ? 'today' : ''
                          } ${isOverdue ? 'overdue' : ''}`}
                        style={{ 
                          '--status-color': statusObject.color,
                          backgroundColor: statusObject.bgColor,
                          borderLeft: `3px solid ${statusObject.color}`
                        }}
                      >
                        <div className="TaskDetails-modal-task-card-header">
                          <div className="TaskDetails-modal-task-title-section">
                            <h4 className="TaskDetails-modal-task-title">
                              {task.title || 'Untitled Task'}
                            </h4>
                            <span
                              className="TaskDetails-modal-task-status"
                              style={{
                                backgroundColor: statusObject.bgColor,
                                color: statusObject.color,
                                border: `1px solid ${statusObject.color}`
                              }}
                            >
                              {statusObject.label}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '0.25rem',
                              backgroundColor: taskType === 'assigned' ? '#e3f2fd' : '#fff3e0',
                              color: taskType === 'assigned' ? '#1976d2' : '#f57c00',
                              marginLeft: '0.5rem'
                            }}>
                              {taskType === 'assigned' ? '📋 Assigned' : '👤 Personal'}
                            </span>
                          </div>
                          <span className={`TaskDetails-modal-task-priority ${task.priority || 'medium'}`}>
                            {task.priority || 'medium'}
                          </span>
                        </div>

                        {task.description && (
                          <p className="TaskDetails-modal-task-description">
                            {task.description}
                          </p>
                        )}

                        <div className="TaskDetails-modal-task-time-info">
                          <div className="TaskDetails-modal-task-time-item">
                            <FiClock size={12} />
                            <span className="TaskDetails-modal-task-time-label">Created:</span>
                            <span className="TaskDetails-modal-task-time-value">
                              {formatDateTime(task.createdAt)}
                            </span>
                          </div>

                          {/* UPDATED: Time tracking display for both personal and assigned tasks */}
                          <div className="TaskDetails-modal-task-time-item">
                            {timeData.currentStatus === 'in-progress' ? (
                              <FiPlay size={12} color="#10b981" />
                            ) : timeData.currentStatus === 'onhold' ? (
                              <FiPause size={12} color="#f59e0b" />
                            ) : (
                              <FiCheckCircle size={12} color="#6b7280" />
                            )}
                            <span className="TaskDetails-modal-task-time-label">Active:</span>
                            <span className="TaskDetails-modal-task-time-value" style={{
                              color: timeData.currentStatus === 'in-progress' ? '#10b981' :
                                timeData.currentStatus === 'onhold' ? '#f59e0b' : '#6b7280',
                              fontWeight: 600
                            }}>
                              {timeData.displayText}
                            </span>
                          </div>

                          {task.updatedAt && task.updatedAt !== task.createdAt && (
                            <div className="TaskDetails-modal-task-time-item">
                              <FiRefreshCw size={12} />
                              <span className="TaskDetails-modal-task-time-label">Updated:</span>
                              <span className="TaskDetails-modal-task-time-value">
                                {formatDateTime(task.updatedAt)}
                              </span>
                            </div>
                          )}
                          {task.dueDateTime && (
                            <div className="TaskDetails-modal-task-time-item">
                              <FiCalendar size={12} />
                              <span className="TaskDetails-modal-task-time-label">Due:</span>
                              <span className="TaskDetails-modal-task-time-value">
                                {formatDateTime(task.dueDateTime)}
                                {isToday && <span className="TaskDetails-modal-task-time-badge today">Today</span>}
                                {isOverdue && <span className="TaskDetails-modal-task-time-badge overdue">Overdue</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="TaskDetails-modal-task-actions">
                          {/* Remarks Button */}
                          <button
                            className="TaskDetails-modal-task-activity-btn"
                            onClick={(e) => handleViewRemarks(task, e)}
                            style={{ marginRight: '8px' }}
                          >
                            <FiMessageSquare size={14} />
                            <span>View Remarks</span>
                          </button>

                          <button
                            className="TaskDetails-modal-task-activity-btn"
                            onClick={(e) => handleViewActivityLogs(task, e)}
                          >
                            <FiActivity size={14} />
                            <span>View Activity Log</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="TaskDetails-modal-pagination">
                    <div className="TaskDetails-modal-page-size">
                      {[10, 25, 50].map(size => (
                        <button
                          key={size}
                          className={`TaskDetails-modal-page-size-btn ${taskLimit === size ? 'active' : ''}`}
                          onClick={() => {
                            setTaskLimit(size);
                            setTaskPage(1);
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <div className="TaskDetails-modal-page-info">
                      Showing {taskTotal === 0 ? 0 : ((taskPage - 1) * taskLimit) + 1}
                      -{Math.min(taskPage * taskLimit, taskTotal)} of {taskTotal}
                    </div>
                    <div className="TaskDetails-modal-page-controls">
                      <button
                        className="TaskDetails-modal-page-btn"
                        disabled={taskPage <= 1 || loading}
                        onClick={() => fetchUserTasks(selectedUserId, Math.max(1, taskPage - 1))}
                      >
                        Previous
                      </button>
                      <span className="TaskDetails-modal-page-current">
                        Page {taskPage} of {taskTotalPages}
                      </span>
                      <button
                        className="TaskDetails-modal-page-btn"
                        disabled={taskPage >= taskTotalPages || loading}
                        onClick={() => fetchUserTasks(selectedUserId, Math.min(taskTotalPages, taskPage + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="TaskDetails-modal-footer">
            <div className="TaskDetails-modal-footer-stats">
              <span>Total: {taskTotal} tasks</span>
              <span>•</span>
              <span>Completed: {filteredTasks.filter(t =>
                (t.userStatus || t.status) === 'completed'
              ).length}</span>
              <span>•</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>
                Today: {todayTotalTime.displayText}
              </span>
            </div>
            <button
              className="TaskDetails-modal-close-footer-btn"
              onClick={handleCloseDialog}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="TaskDetails-error-alert">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.5rem',
          margin: '1rem 0'
        }}>
          <FiAlertTriangle color="#dc2626" size={24} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#dc2626' }}>Error:</strong>
            <p style={{ margin: '0.25rem 0', color: '#dc2626' }}>{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '1.5rem'
            }}
          >
            &times;
          </button>
        </div>
      </div>
    );
  };

  
  // ==================== MAIN RENDER ====================

  if (isTaskPageMode) {
    return (
      <div className="TaskDetails-section">
        {renderSnackbar()}
        {renderError()}
        {renderEnhancedDialog()}
        {renderActivityLogModal()}
        {renderRemarksDialog()}
        {renderImageZoomModal()}
      {renderAssignTaskModal()}
      </div>
    );
  }

  const dynamicStats = (() => {
    const totalT = systemStats.totalTasks || overallStats.total || 0;
    const activeEmp = users.filter(u => (getUserTaskStats(u).total || 0) > 0).length;
    const activeRate = users.length > 0 ? Math.round((activeEmp / users.length) * 100) : 0;
    const doneRate = totalT > 0 ? Math.round(((overallStats.completed || 0) / totalT) * 100) : 0;
    const pendingR = totalT > 0 ? Math.round(((overallStats.pending || 0) / totalT) * 100) : 0;
    const inProgR = totalT > 0 ? Math.round((((overallStats['in-progress'] || overallStats.inProgress) || 0) / totalT) * 100) : 0;
    const completedR = totalT > 0 ? Math.round(((overallStats.completed || 0) / totalT) * 100) : 0;
    const onHoldR = totalT > 0 ? Math.round(((overallStats.onhold || 0) / totalT) * 100) : 0;
    return { activeRate, doneRate, pendingR, inProgR, completedR, onHoldR };
  })();

  return (
    <div className="TaskDetails-section new-ui">
      {renderSnackbar()}
      {renderError()}

      {/* Breadcrumb matching screenshot */}
      <div className="new-breadcrumb">
        <span>Home</span>
        <FiChevronRight size={13} className="breadcrumb-separator" />
        <span>Company</span>
        <FiChevronRight size={13} className="breadcrumb-separator" />
        <span className="current">Employee Task Management</span>
      </div>

      {/* Top Header */}
      <div className="new-header">
        <div className="new-header-left">
          <div className="new-header-icon"><FiClipboard size={22} /></div>
          <div>
            <h1>Company Employee Task Management</h1>
            <p>Manage team workload, tasks, and performance efficiently.</p>
          </div>
        </div>
        <div className="new-header-right">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/ciisUser/admin-task-create')}
          >
            <FiPlus size={16} /> Create Task
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={handleExportPDF}
            disabled={usersLoading}
            title={usersLoading ? "Employee data is loading..." : "Export all tasks to PDF report"}
          >
            <FiDownload size={16} /> {usersLoading ? "Loading..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="new-stats-grid">
        <div className="new-stat-card card-blue">
          <div className="new-stat-top">
            <div className="new-stat-icon blue"><FiUsers size={20} /></div>
            <div className="new-stat-val">
              <h3>{systemStats.totalEmployees || users.length || 0}</h3>
              <span>Employees</span>
            </div>
            <div className="new-stat-trend green">↑ 12%</div>
          </div>
          <p>Total team members</p>
        </div>
        <div className="new-stat-card card-purple">
          <div className="new-stat-top">
            <div className="new-stat-icon purple"><FiClipboard size={20} /></div>
            <div className="new-stat-val">
              <h3>{systemStats.totalTasks || overallStats.total || 0}</h3>
              <span>Tasks Today</span>
            </div>
            <div className="new-stat-trend green">↑ 8%</div>
          </div>
          <p>Tasks assigned today</p>
        </div>
        <div className="new-stat-card card-orange">
          <div className="new-stat-top">
            <div className="new-stat-icon orange"><FiClock size={20} /></div>
            <div className="new-stat-val">
              <h3>{overallStats.pending || 0}</h3>
              <span>Pending</span>
            </div>
            <div className="new-stat-trend red">↑ 25%</div>
          </div>
          <p>Awaiting completion</p>
        </div>
        <div className="new-stat-card card-cyan">
          <div className="new-stat-top">
            <div className="new-stat-icon cyan"><FiRefreshCw size={20} /></div>
            <div className="new-stat-val">
              <h3>{overallStats['in-progress'] || overallStats.inProgress || 0}</h3>
              <span>In Progress</span>
            </div>
            <div className="new-stat-trend cyan">↓ 20%</div>
          </div>
          <p>Currently in progress</p>
        </div>
        <div className="new-stat-card card-green">
          <div className="new-stat-top">
            <div className="new-stat-icon green"><FiCheckCircle size={20} /></div>
            <div className="new-stat-val">
              <h3>{overallStats.completed || 0}</h3>
              <span>Completed</span>
            </div>
            <div className="new-stat-trend green">↑ 18%</div>
          </div>
          <p>Successfully completed</p>
        </div>
        <div className="new-stat-card card-red">
          <div className="new-stat-top">
            <div className="new-stat-icon red"><FiPause size={20} /></div>
            <div className="new-stat-val">
              <h3>{overallStats.onhold || 0}</h3>
              <span>On Hold</span>
            </div>
            <div className="new-stat-trend red">↓ 50%</div>
          </div>
          <p>Temporarily on hold</p>
        </div>
      </div>

      {/* Team Insights */}
      <div className="new-insights">
        <div className="new-insights-left">
          <div className="new-insights-title">
            <div className="new-insights-icon"><FiBarChart2 size={20} /></div>
            <span>Team Insights</span>
          </div>
          <p>Key insights to help you manage your team better.</p>
        </div>
        <div className="new-insights-cards">
          <div
            className={`new-insight-card red ${selectedStatusFilter === 'overdue' ? 'active' : ''}`}
            onClick={() => {
              if (selectedStatusFilter === 'overdue') {
                setSelectedStatusFilter('all');
              } else {
                setSelectedStatusFilter('overdue');
                setSelectedPerfFilter('all');
              }
              setCurrentPage(1);
            }}
          >
            <div className="icon"><FiAlertCircle size={18} /></div>
            <div className="insight-content">
              <div className="insight-val red">{overallStats.overdue || 0}</div>
              <div className="insight-desc">overdue tasks<br />need attention</div>
            </div>
            <FiChevronRight className="arrow" size={16} />
          </div>
          <div
            className={`new-insight-card green ${selectedPerfFilter === 'top' ? 'active' : ''}`}
            onClick={() => {
              if (selectedPerfFilter === 'top') {
                setSelectedPerfFilter('all');
              } else {
                setSelectedPerfFilter('top');
                setSelectedStatusFilter('all');
              }
              setCurrentPage(1);
            }}
          >
            <div className="icon"><FiAward size={18} /></div>
            <div className="insight-content">
              <div className="insight-val dark">
                {topPerformer ? topPerformer.name : 'No active tasks'}
              </div>
              <div className="insight-desc">
                {topPerformer && topPerformer.completed > 0 ? (
                  <>is top performer at<br /><strong>{topPerformer.rate}%</strong> completion rate</>
                ) : topPerformer && topPerformer.total > 0 ? (
                  <>leads with<br /><strong>{topPerformer.total}</strong> assigned tasks</>
                ) : (
                  <>assigned yet</>
                )}
              </div>
            </div>
            <FiChevronRight className="arrow" size={16} />
          </div>
          <div
            className={`new-insight-card orange ${selectedPerfFilter === 'zero' ? 'active' : ''}`}
            onClick={() => {
              if (selectedPerfFilter === 'zero') {
                setSelectedPerfFilter('all');
              } else {
                setSelectedPerfFilter('zero');
                setSelectedStatusFilter('all');
              }
              setCurrentPage(1);
            }}
          >
            <div className="icon"><FiUsers size={18} /></div>
            <div className="insight-content">
              <div className="insight-val orange">{noTaskCount}</div>
              <div className="insight-desc">employees have<br />no assigned tasks</div>
            </div>
            <FiChevronRight className="arrow" size={16} />
          </div>
          <div
            className={`new-insight-card blue ${selectedPerfFilter === 'completed' ? 'active' : ''}`}
            onClick={() => {
              if (selectedPerfFilter === 'completed') {
                setSelectedPerfFilter('all');
              } else {
                setSelectedPerfFilter('completed');
                setSelectedStatusFilter('all');
              }
              setCurrentPage(1);
            }}
          >
            <div className="icon"><FiCheckCircle size={18} /></div>
            <div className="insight-content">
              <div className="insight-val blue">{allCompletedCount}</div>
              <div className="insight-desc">employees completed<br />all assigned tasks</div>
            </div>
            <FiChevronRight className="arrow" size={16} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="new-filters-bar">
        <div className="new-search-box">
          <FiSearch size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search employee by name, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="new-filter-group">
          <div className={`new-filter-item ${selectedDeptFilter !== 'all' ? 'active' : ''}`}>
            <label>Department</label>
            <select
              value={selectedDeptFilter}
              onChange={(e) => {
                setSelectedDeptFilter(e.target.value);
                setActiveDeptTab('all');
                setCurrentPage(1);
              }}
            >
              <option value="all">All Departments</option>
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className={`new-filter-item ${selectedRoleFilter !== 'all' ? 'active' : ''}`}>
            <label>Role</label>
            <select
              value={selectedRoleFilter}
              onChange={(e) => {
                setSelectedRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Roles</option>
              {roleOptions.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className={`new-filter-item ${selectedStatusFilter !== 'all' ? 'active' : ''}`}>
            <label>Task Status</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="onhold">On Hold</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className={`new-filter-item ${selectedPerfFilter !== 'all' ? 'active' : ''}`}>
            <label>Performance</label>
            <select
              value={selectedPerfFilter}
              onChange={(e) => {
                setSelectedPerfFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Performance</option>
              <option value="top">Top (80%+)</option>
              <option value="medium">Average (50-79%)</option>
              <option value="low">Needs Attention (&lt;50%)</option>
            </select>
          </div>
          <div className={`new-filter-item ${sortBy !== 'name-asc' ? 'active' : ''}`}>
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="tasks-desc">Highest Tasks</option>
              <option value="tasks-asc">Lowest Tasks</option>
              <option value="rate-desc">Highest Completion</option>
            </select>
          </div>
        </div>

        <div className="new-filter-actions">
          <button type="button" className="new-reset-btn" onClick={resetFilters} title="Reset all filters">
            <FiRefreshCw size={14} /> Reset
          </button>
          <button
            type="button"
            className={`new-clockin-btn ${clockedInTodayOnly ? 'active' : ''}`}
            onClick={() => {
              handleTodayClockInToggle();
              setCurrentPage(1);
            }}
          >
            <FiTime size={14} /> Today Clock In
          </button>
          <div className="new-view-toggle">
            <button
              type="button"
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid size={13} /> Grid
            </button>
            <button
              type="button"
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              <FiList size={13} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Department Tabs / Pills */}
      <div className="new-dept-pills">
        <button
          type="button"
          className={`new-pill ${activeDeptTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveDeptTab('all');
            setCurrentPage(1);
          }}
        >
          All <span className="badge">{users.length || systemStats.totalEmployees || 0}</span>
        </button>
        {allDepartmentGroups.map(group => (
          <button
            key={group.key}
            type="button"
            className={`new-pill ${activeDeptTab === group.key ? 'active' : ''}`}
            onClick={() => {
              setActiveDeptTab(activeDeptTab === group.key ? 'all' : group.key);
              setSelectedDeptFilter('all');
              setCurrentPage(1);
            }}
          >
            {group.name} <span className="badge">{group.count}</span>
          </button>
        ))}
      </div>

      {/* Main Content: Department Groups */}
      {usersLoading ? (
        <div className="TaskDetails-loading-container">
          <div className="TaskDetails-loading-spinner"></div>
          <h4>Loading Employee Data...</h4>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="TaskDetails-empty-state emp-task-empty-state">
          <div className="emp-task-empty-state__icon" aria-hidden="true">
            <FiUsers size={28} />
          </div>
          <h3>No Employees Found</h3>
          <p>No employees match the filters you selected. Reset them to see your full team.</p>
          <button type="button" className="emp-task-empty-state__button" onClick={resetFilters}>
            <FiRefreshCw size={14} /> Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="new-table-container">
          <table className="new-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Pending</th>
                <th>Completion</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => {
                const userStats = getUserTaskStats(user);
                const completionRate = userStats.completionRate || 0;
                const hasTasks = (userStats.total || 0) > 0;
                const rateColor = !hasTasks ? '#64748b' : completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444';
                const progressColor = completionRate >= 80 ? '#10b981' : '#f59e0b';
                return (
                  <tr key={user._id || user.id} onClick={() => openUserTasksPage(user._id || user.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar" style={{ backgroundColor: getAvatarBg(user.name) }}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="table-user-name">{user.name || 'Unknown'}</div>
                          <div className="table-user-email">{user.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getDepartmentName(user.department)}</td>
                    <td>{getUserDisplayRole(user, jobRoleMap)}</td>
                    <td><span className="table-badge assigned">{userStats.total || 0}</span></td>
                    <td><span className="table-badge completed">{userStats.completed || 0}</span></td>
                    <td><span className="table-badge pending">{Math.max(0, (userStats.total || 0) - (userStats.completed || 0))}</span></td>
                    <td><span style={{ color: rateColor, fontWeight: 600 }}>{completionRate}%</span></td>
                    <td>
                      <div className="table-progress-track">
                        {hasTasks && completionRate > 0 ? (
                          <div className="table-progress-fill" style={{ width: `${Math.min(100, Math.max(0, completionRate))}%`, backgroundColor: progressColor }} />
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-view-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserTasksPage(user._id || user.id);
                          }}
                        >
                          View Tasks
                        </button>
                        <button
                          type="button"
                          className="btn-assign-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAssignModal(user);
                          }}
                        >
                          <FiPlus size={12} /> Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="new-dept-sections">
          {departmentUserGroups.map((group) => {
            const isExpanded = Boolean(expandedDepts[group.key]);
            return (
              <div className="new-dept-section" key={group.key}>
                <div className="new-dept-header" onClick={() => toggleDeptAccordion(group.key)}>
                  <div className="new-dept-header-left">
                    <div className="icon-box">{renderDeptHeaderIcon(group.name)}</div>
                    <h3>{group.name}</h3>
                    <span className="emp-count">{group.users.length} employee{group.users.length !== 1 ? 's' : ''}</span>
                    <span className="dept-desc">{getDeptDescription(group.name)}</span>
                  </div>
                  <div className="new-dept-header-right">
                    <div className="count-badge">{group.users.length}</div>
                    {isExpanded ? <FiChevronUp size={18} className="chevron" /> : <FiChevronDown size={18} className="chevron" />}
                  </div>
                </div>
                
                {isExpanded && (
                  group.users.length === 0 ? (
                    <div
                      className="new-dept-empty"
                      style={{
                        padding: '24px 20px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '0.875rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        margin: '12px 16px 16px 16px',
                        border: '1px dashed #cbd5e1'
                      }}
                    >
                      No employees {clockedInTodayOnly ? 'clocked in today' : 'found'} in {group.name} department.
                    </div>
                  ) : (
                    <div className="new-users-grid">
                      {group.users.map(user => {
                        const userStats = getUserTaskStats(user);
                        const completionRate = userStats.completionRate || 0;
                        const hasTasks = (userStats.total || 0) > 0;
                        const rateColor = !hasTasks ? '#ea580c'
                          : completionRate >= 80
                          ? '#16a34a'
                          : completionRate >= 50
                          ? '#f59e0b'
                          : '#ea580c';
                        const progressColor = completionRate >= 80 ? '#10b981' : '#f59e0b';
                        
                        return (
                          <div
                            className="new-user-card"
                            key={user._id || user.id}
                            onClick={() => openUserTasksPage(user._id || user.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="new-user-card-top">
                              <div className="new-user-avatar" style={{ backgroundColor: getAvatarBg(user.name) }}>
                                {getInitials(user.name)}
                              </div>
                              <div className="new-user-info">
                                <h4>{user.name || "Unknown"}</h4>
                                <span className="role"><FiUser size={12} /> {getUserDisplayRole(user, jobRoleMap)}</span>
                                <span className="email"><FiMail size={12} /> {user.email || "No Email"}</span>
                              </div>
                              <button
                                type="button"
                                className="more-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUserTasksPage(user._id || user.id);
                                }}
                              >
                                <FiMoreVertical size={16} />
                              </button>
                            </div>
                            
                            <div className="new-user-stats">
                              <div className="stat stat-assigned">
                                <h5 className="val-blue">{userStats.total || 0}</h5>
                                <span>Assigned</span>
                              </div>
                              <div className="stat stat-completed">
                                <h5 className="val-green">{userStats.completed || 0}</h5>
                                <span>Completed</span>
                              </div>
                              <div className="stat stat-pending">
                                <h5 className="val-orange">{Math.max(0, (userStats.total || 0) - (userStats.completed || 0))}</h5>
                                <span>Pending</span>
                              </div>
                              <div className="stat stat-completion">
                                <h5 style={{ color: rateColor }}>{completionRate}%</h5>
                                <span>Completion</span>
                              </div>
                            </div>
                            
                            <div className="new-user-progress">
                              <div className="progress-track">
                                {hasTasks && completionRate > 0 ? (
                                  <div
                                    className="progress-fill"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, completionRate))}%`,
                                      backgroundColor: progressColor
                                    }}
                                  />
                                ) : null}
                              </div>
                            </div>
                            
                            <div className="new-user-actions">
                              <button
                                type="button"
                                className="btn-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUserTasksPage(user._id || user.id);
                                }}
                              >
                                View Tasks
                              </button>
                              <button
                                type="button"
                                className="btn-assign"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAssignModal(user);
                                }}
                              >
                                <FiPlus size={13} /> Assign
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="new-pagination">
        <div className="page-info">
          Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} employees
        </div>
        <div className="page-controls">
          <button
            type="button"
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            <FiChevronLeft size={14} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(num => (
            <button
              key={num}
              type="button"
              className={`page-num ${currentPage === num ? 'active' : ''}`}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      {renderEnhancedDialog()}
      {renderActivityLogModal()}
      {renderRemarksDialog()}
      {renderImageZoomModal()}
      {renderAssignTaskModal()}
    </div>
  );
};

export default TaskDetails;
