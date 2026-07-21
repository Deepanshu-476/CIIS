import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "../../../utils/axiosConfig";
import API_URL from "../../../config";
import { useNavigate, useParams } from "react-router-dom";
import "./EmpAllTask.css";
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
   FiClipboard,
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

const TASK_STAT_KEYS = ['pending', 'inProgress', 'completed', 'rejected', 'overdue', 'onhold', 'reopen', 'cancelled'];

const isTaskOverdueByDate = (dueDate, status) => {
  if (!dueDate) return false;
  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus === 'completed' || normalizedStatus === 'cancelled') return false;

  const today = getLocalDateStart();
  const dueDateStart = getLocalDateStart(dueDate);
  return Boolean(today && dueDateStart && dueDateStart < today);
};

const getTaskDueDate = task => task?.dueDateTime || task?.dueDate;

const getSourceAwareTaskDate = task => {
  const source = String(task?.__taskSource || task?.taskSource || task?.source || '').toLowerCase();
  if (source === 'client') return task?.dueDate || task?.dueDateTime || task?.createdAt;
  if (source === 'project') return task?.createdAt;
  return getTaskDueDate(task) || task?.createdAt;
};


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
  const { userId: routeUserId } = useParams();
  const isTaskPageMode = Boolean(routeUserId);

  
  const isMounted = useRef(true);
  const hasFetchedUsers = useRef(false);
  const fetchUsersTimeoutRef = useRef(null);
  const fetchingTasksForUser = useRef(null);
  const snackbarTimerRef = useRef(null);
  const skipNextTaskFetchRef = useRef(false);
  const usersFetchRequestRef = useRef(0);

  
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState("");

  
  const [departmentMap, setDepartmentMap] = useState({});

  
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
  const [globalFromDate, setGlobalFromDate] = useState(getDateInputValue());
  const [globalToDate, setGlobalToDate] = useState(getDateInputValue());
  const [loggedInTodayOnly, setLoggedInTodayOnly] = useState(false);
  const [todayLoggedInUserIds, setTodayLoggedInUserIds] = useState(new Set());
  const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(false);
  const [taskPage, setTaskPage] = useState(1);
  const [taskLimit, setTaskLimit] = useState(10);
  const [taskTotal, setTaskTotal] = useState(0);
  const [taskTotalPages, setTaskTotalPages] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const today = new Date();

  const openUserTasksPage = useCallback((userId) => {
    if (!userId) return;
    const selectedDate = globalFromDate || globalToDate;
    const query = selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : '';
    navigate(`/ciisUser/company-all-task/tasks/${userId}${query}`);
  }, [globalFromDate, globalToDate, navigate]);

  
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
    return currentUserCompanyRole === 'Owner' || currentUserRole === 'Owner' || currentUserRole === 'CAREER INFOWIS Admin';
  }, [currentUserCompanyRole, currentUserRole]);

  const getCompanyName = (company) => {
    if (!company) return 'N/A';
    if (typeof company === 'object') {
      return company.companyName || company.name || company._id || 'N/A';
    }
    return company;
  };

  const getDepartmentName = (department) => {
    if (!department) return 'N/A';

    
    if (typeof department === 'object') {
      return department.name || department.departmentName || department._id || 'N/A';
    }

    
    if (typeof department === 'string') {
      
      if (departmentMap[department]) {
        return departmentMap[department];
      }

      
      return `Dept-${department.substring(0, 6)}`;
    }

    return String(department);
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
      const taskDate = new Date(getSourceAwareTaskDate(task));
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

  const fetchTodayLoggedInUsers = useCallback(async () => {
    setTodayAttendanceLoading(true);

    try {
      const res = await axios.get('/attendance/all', {
        params: {
          date: getDateInputValue(),
          limit: 1000
        },
        _skipErrorNotify: true,
      });

      const attendanceRows = Array.isArray(res.data?.data) ? res.data.data : [];
      const loggedInIds = attendanceRows
        .filter(record => {
          const status = String(record?.status || '').trim().toLowerCase();
          return record?.inTime && status !== 'absent';
        })
        .map(record => {
          const user = record.user;
          return String(user?._id || user?.id || user || '');
        })
        .filter(Boolean);

      const uniqueIds = new Set(loggedInIds);
      if (isMounted.current) {
        setTodayLoggedInUserIds(uniqueIds);
      }

      return uniqueIds;
    } catch (error) {
      console.error('Failed to load today logged-in users:', error);
      if (isMounted.current) {
        setTodayLoggedInUserIds(new Set());
      }
      return new Set();
    } finally {
      if (isMounted.current) {
        setTodayAttendanceLoading(false);
      }
    }
  }, []);

  

  useEffect(() => {
    const fetchUserData = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          setError("Please log in to access this page");
          return;
        }

        const user = JSON.parse(userStr);
        void 0;

        let foundUser = null;
        let userRole = 'user';
        let companyRole = 'employee';
        let userName = '';
        let userCompany = null;
        let userDepartment = null;

        if (user.id && typeof user.id === 'string') {
          foundUser = user;
          userRole = user.role || 'user';
          companyRole = user.companyRole || user.role || 'employee';
          userName = user.name || 'Unknown User';
          userCompany = user.company || null;
          userDepartment = user.department || null;
        }
        else if (user.user && user.user.id) {
          foundUser = user.user;
          userRole = user.user.role || 'user';
          companyRole = user.user.companyRole || user.user.role || 'employee';
          userName = user.user.name || 'Unknown User';
          userCompany = user.user.company || null;
          userDepartment = user.user.department || null;
        }
        else if (user._id) {
          foundUser = user;
          userRole = user.role || 'user';
          companyRole = user.companyRole || user.role || 'employee';
          userName = user.name || 'Unknown User';
          userCompany = user.company || null;
          userDepartment = user.department || null;
        }

        if (!userName && user.email) {
          userName = user.email.split('@')[0];
        }

        if (isMounted.current) {
          setCurrentUser(foundUser || user);
          setCurrentUserRole(userRole);
          setCurrentUserCompanyRole(companyRole);
        }

        void 0;

      } catch (error) {
        console.error("Error parsing user data:", error);
        setError("Error loading user data");
      }
    };

    fetchUserData();
    fetchDepartments(); 
  }, []);

  

  const fetchUsersWithTasks = useCallback(async () => {
    
    if (fetchUsersTimeoutRef.current) {
      clearTimeout(fetchUsersTimeoutRef.current);
    }

    fetchUsersTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current) return;

      setUsersLoading(true);
      setError("");

      try {
        void 0;

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
        fetchTodayLoggedInUsers();

        try {
          const overviewRes = await axios.get('/tasks/all/company-overview', {
            ...config,
            params: {
              period: globalFromDate || globalToDate ? 'all' : 'today',
              fromDate: globalFromDate || undefined,
              toDate: globalToDate || undefined,
              status: 'all',
              priority: 'all',
            },
            _skipErrorNotify: true,
          });

          const overviewUsers = overviewRes.data?.users || overviewRes.data?.data || [];
          if (overviewRes.data?.success && Array.isArray(overviewUsers)) {
            usersData = overviewUsers;
          }
        } catch (overviewError) {
          void 0;
        }

        if (usersData.length === 0 && currentUser) {
          let apiUrl = '';

          if (isOwner()) {
            const companyId = currentUser?.company?._id || currentUser?.company;
            if (companyId) {
              apiUrl = `/users/company-users?companyId=${companyId}`;
            } else {
              apiUrl = '/users/company-users';
            }
          } else {
            const deptId = currentUser?.department?._id || currentUser?.department;
            if (deptId) {
              apiUrl = `/users/department-users?department=${deptId}`;
            } else {
              const companyId = currentUser?.company?._id || currentUser?.company;
              if (companyId) {
                apiUrl = `/users/company-users?companyId=${companyId}`;
              } else {
                apiUrl = '/users/company-users';
              }
            }
          }

          try {
            response = await axios.get(apiUrl, config);
          } catch (apiError) {
            void 0;
            throw apiError;
          }
        } else if (usersData.length === 0) {
          try {
            response = await axios.get('/task/users-with-counts', config);
          } catch (generalError) {
            void 0;
            const usersResponse = await axios.get('/users/company-users', config);
            if (usersResponse.data?.users) {
              usersData = usersResponse.data.users;
            }
          }
        }

        if (response?.data?.users && Array.isArray(response.data.users)) {
          usersData = response.data.users;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response?.data?.message?.users && Array.isArray(response.data.message.users)) {
          usersData = response.data.message.users;
        }

        void 0;

        let filteredUsers = usersData.map(user => ({
          ...user,
          _id: user._id || user.id,
          taskStats: emptyTaskStats
        }));

        if (currentUser?.company) {
          const currentCompanyId = currentUser.company._id || currentUser.company;
          filteredUsers = filteredUsers.filter(user => {
            const userCompanyId = user.company?._id || user.company;
            return userCompanyId?.toString() === currentCompanyId?.toString();
          });
        }

        if (!isOwner() && currentUser?.department) {
          const currentDeptId = currentUser.department._id || currentUser.department;
          filteredUsers = filteredUsers.filter(user => {
            const userDeptId = user.department?._id || user.department;
            return userDeptId?.toString() === currentDeptId?.toString();
          });
        }

        if (isMounted.current) {
          setUsers(filteredUsers);
          calculateOverallStats(filteredUsers);
          setUsersLoading(false);
        }

        const requestId = usersFetchRequestRef.current + 1;
        usersFetchRequestRef.current = requestId;
        const fromDateParam = globalFromDate || undefined;
        const toDateParam = globalToDate || undefined;
        const isDateFiltered = fromDateParam || toDateParam;

        const userIds = filteredUsers.map(user => user._id || user.id).filter(Boolean);
        if (userIds.length === 0) return;

        try {
          const statsRes = await axios.post(
            '/tasks/all/users/stats',
            {
              userIds,
              filters: {
                period: isDateFiltered ? 'all' : 'today',
                fromDate: fromDateParam,
                toDate: toDateParam,
                status: 'all',
                priority: 'all',
              },
            },
            {
              _skipErrorNotify: true,
            }
          );

          const statsByUser = statsRes.data?.statsByUser || {};
          const usersWithStats = filteredUsers.map(user => ({
            ...user,
            taskStats: mapStatusCountsToTaskStats(statsByUser[user._id || user.id])
          }));

          if (isMounted.current && usersFetchRequestRef.current === requestId) {
            setUsers(usersWithStats);
            calculateOverallStats(usersWithStats);
          }
        } catch (err) {
          void 0;
        }

      } catch (err) {
        console.error("❌ Error fetching users with tasks:", err);

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
      } finally {
        if (isMounted.current) {
          setUsersLoading(false);
        }
      }
    }, 300); 

  }, [currentUser, isOwner, calculateOverallStats, globalFromDate, globalToDate, fetchTodayLoggedInUsers]);

  useEffect(() => {
    if (!currentUser || isTaskPageMode) return;
    fetchTodayLoggedInUsers();
  }, [currentUser, isTaskPageMode, fetchTodayLoggedInUsers]);

  
  useEffect(() => {
    if (currentUser && isMounted.current) {
      hasFetchedUsers.current = true;
      fetchUsersWithTasks();
    }

    return () => {
      if (fetchUsersTimeoutRef.current) {
        clearTimeout(fetchUsersTimeoutRef.current);
      }
    };
  }, [currentUser, fetchUsersWithTasks]);

  

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (loggedInTodayOnly) {
      filtered = filtered.filter(user => todayLoggedInUserIds.has(String(user._id || user.id)));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.name?.toLowerCase().includes(query)) ||
        (user.email?.toLowerCase().includes(query)) ||
        (user.employeeId?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [users, searchQuery, loggedInTodayOnly, todayLoggedInUserIds]);

  const getNonZeroStatuses = useMemo(() => {
    return STATUS_OPTIONS.filter(status => {
      if (status.value === 'all') return true;
      return overallStats[status.value] > 0;
    });
  }, [overallStats]);

  
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return [...tasks].sort((a, b) => {
      const aDateValue = getSourceAwareTaskDate(a);
      const bDateValue = getSourceAwareTaskDate(b);
      const aDate = aDateValue ? new Date(aDateValue) : new Date(0);
      const bDate = bDateValue ? new Date(bDateValue) : new Date(0);
      return bDate - aDate;
    });
  }, [tasks]);

  
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

    
    const user = users.find((x) => x._id === userId || x.id === userId);
    if (!user) {
      setError("User not found");
      setLoading(false);
      fetchingTasksForUser.current = null;
      return;
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
        await fetchAllTaskLogs(nextTasks.slice(0, taskLimit));
        await fetchTaskStatusCounts(userId);

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
    setLoggedInTodayOnly(false);
    setTaskPage(1);
    setShowStatusFilters(true);
  }, []);

  
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

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserTaskStats = (user) => {
    return user.taskStats || {
      total: 0,
      pending: 0,
      completed: 0,
      completionRate: 0,
      inProgress: 0,
      rejected: 0,
      overdue: 0,
      onhold: 0,
      reopen: 0,
      cancelled: 0
    };
  };

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
          <h4>System-wide Task Statistics</h4>
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
                Total Tasks
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
                {user.role || "No Role"}
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

    const timeData = calculateTaskActiveTime(activityLogs);
    const taskType = getTaskType(selectedTaskForActivity);

    const getStatusIcon = () => {
      switch (timeData.currentStatus) {
        case 'in-progress': return <FiPlay size={16} color="#10b981" />;
        case 'onhold': return <FiPause size={16} color="#f59e0b" />;
        case 'completed': return <FiCheckCircle size={16} color="#10b981" />;
        default: return <FiClock size={16} color="#6b7280" />;
      }
    };

    return (
      <div className="TaskDetails-activity-modal-overlay" onClick={handleCloseActivityLog}>
        <div className="TaskDetails-activity-modal" onClick={(e) => e.stopPropagation()}>
          <div className="TaskDetails-activity-modal-header">
            <div className="TaskDetails-activity-modal-header-content">
              <div className="TaskDetails-activity-modal-title">
                <div className="TaskDetails-activity-modal-icon">
                  <FiActivity size={20} />
                </div>
                <div>
                  <h3>Activity Log</h3>
                  <p className="TaskDetails-activity-modal-task-title">
                    {selectedTaskForActivity.title || 'Untitled Task'}
                    {selectedTaskForActivity.serialNo && ` (#${selectedTaskForActivity.serialNo})`}
                  </p>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: taskType === 'assigned' ? '#e3f2fd' : '#fff3e0',
                    color: taskType === 'assigned' ? '#1976d2' : '#f57c00',
                    display: 'inline-block',
                    marginTop: '0.25rem'
                  }}>
                    {taskType === 'assigned' ? '📋 Assigned Task' : '👤 Personal Task'}
                  </span>
                </div>
              </div>
              <button
                className="TaskDetails-activity-modal-close"
                onClick={handleCloseActivityLog}
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div className="TaskDetails-activity-modal-body">
            {loadingActivity ? (
              <div className="TaskDetails-activity-loading">
                <div className="TaskDetails-activity-spinner" />
                <p>Loading activity logs...</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="TaskDetails-activity-empty">
                <div className="TaskDetails-activity-empty-icon">
                  <FiClock size={32} />
                </div>
                <h4>No Activity Logs</h4>
                <p>No activity recorded for this task yet</p>
              </div>
            ) : (
              <>
                <div className="TaskDetails-time-summary-card" style={{
                  margin: '0 0 1rem 0',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    background: timeData.currentStatus === 'completed' ? '#10b981' :
                      timeData.currentStatus === 'in-progress' ? '#3b82f6' :
                        timeData.currentStatus === 'onhold' ? '#f59e0b' : '#6b7280'
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: timeData.currentStatus === 'completed' ? '#10b98115' :
                        timeData.currentStatus === 'in-progress' ? '#3b82f615' :
                          timeData.currentStatus === 'onhold' ? '#f59e0b15' : '#6b728015',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getStatusIcon()}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Total Active Time
                        </span>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          background: timeData.currentStatus === 'completed' ? '#10b98115' :
                            timeData.currentStatus === 'in-progress' ? '#3b82f615' :
                              timeData.currentStatus === 'onhold' ? '#f59e0b15' : '#6b728015',
                          color: timeData.currentStatus === 'completed' ? '#10b981' :
                            timeData.currentStatus === 'in-progress' ? '#3b82f6' :
                              timeData.currentStatus === 'onhold' ? '#f59e0b' : '#6b7280',
                          borderRadius: '1rem',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          {timeData.currentStatus === 'completed' ? '✅ Completed' :
                            timeData.currentStatus === 'in-progress' ? '▶️ In Progress' :
                              timeData.currentStatus === 'onhold' ? '⏸️ On Hold' : '⏳ Pending'}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>
                          {timeData.displayText}
                        </span>
                      </div>

                      {timeData.statusHistory.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                            Status Timeline:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {timeData.statusHistory.map((status, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                background: '#f8fafc',
                                borderRadius: '0.4rem',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{
                                  width: '70px',
                                  color: status.from === 'in-progress' ? '#3b82f6' :
                                    status.from === 'onhold' ? '#f59e0b' : '#6b7280'
                                }}>
                                  {status.from}
                                </span>
                                <FiArrowRight size={12} color="#94a3b8" />
                                <span style={{
                                  width: '70px',
                                  color: status.to === 'in-progress' ? '#3b82f6' :
                                    status.to === 'onhold' ? '#f59e0b' :
                                      status.to === 'completed' ? '#10b981' : '#6b7280'
                                }}>
                                  {status.to}
                                </span>
                                <span style={{ color: '#64748b' }}>
                                  {status.time.toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="TaskDetails-activity-timeline">
                  {activityLogs.map((log, index) => (
                    <div key={log._id || index} className="TaskDetails-activity-item">
                      <div className="TaskDetails-activity-timeline-line">
                        <div
                          className="TaskDetails-activity-dot"
                          style={{ backgroundColor: getActivityColor(log.action) }}
                        >
                          {getActivityIcon(log.action)}
                        </div>
                        {index < activityLogs.length - 1 && (
                          <div className="TaskDetails-activity-line" />
                        )}
                      </div>
                      <div className="TaskDetails-activity-content">
                        <div className="TaskDetails-activity-header">
                          <span
                            className="TaskDetails-activity-action"
                            style={{ color: getActivityColor(log.action) }}
                          >
                            {log.action || 'Action'}
                          </span>
                          <span className="TaskDetails-activity-time">
                            <FiTime size={12} />
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                        {log.description && (
                          <p className="TaskDetails-activity-description">
                            {log.description}
                          </p>
                        )}
                        {log.user && (
                          <div className="TaskDetails-activity-user">
                            <FiUser size={10} />
                            <span>by {log.user.name || log.user.email || 'Unknown User'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="TaskDetails-activity-modal-footer">
            <button
              className="TaskDetails-activity-modal-close-btn"
              onClick={handleCloseActivityLog}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  
  const renderRemarksDialog = () => {
    if (!remarksDialog.open) return null;

    
    const task = tasks.find(t => t._id === remarksDialog.taskId);
    const taskType = task ? getTaskType(task) : 'personal';

    return (
      <div className="TaskDetails-activity-modal-overlay" onClick={handleCloseRemarksDialog}>
        <div className="TaskDetails-activity-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
          <div className="TaskDetails-activity-modal-header">
            <div className="TaskDetails-activity-modal-header-content">
              <div className="TaskDetails-activity-modal-title">
                <div className="TaskDetails-activity-modal-icon">
                  <FiMessageSquare size={20} />
                </div>
                <div>
                  <h3>Task Remarks</h3>
                  <p className="TaskDetails-activity-modal-task-title">
                    {selectedUser?.name || 'User'}'s Task
                  </p>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: taskType === 'assigned' ? '#e3f2fd' : '#fff3e0',
                    color: taskType === 'assigned' ? '#1976d2' : '#f57c00',
                    display: 'inline-block',
                    marginTop: '0.25rem'
                  }}>
                    {taskType === 'assigned' ? '📋 Assigned Task' : '👤 Personal Task'}
                  </span>
                </div>
              </div>
              <button
                className="TaskDetails-activity-modal-close"
                onClick={handleCloseRemarksDialog}
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div className="TaskDetails-activity-modal-body">
            {loadingRemarks ? (
              <div className="TaskDetails-activity-loading">
                <div className="TaskDetails-activity-spinner" />
                <p>Loading remarks...</p>
              </div>
            ) : remarksDialog.remarks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {remarksDialog.remarks.map((remark, index) => (
                  <div key={remark._id || index} style={{
                    padding: '15px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600
                      }}>
                        {remark.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{remark.user?.name || 'Unknown User'}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {formatDateTime(remark.createdAt)}
                        </div>
                      </div>
                    </div>

                    {remark.text && (
                      <p style={{ marginLeft: '42px', color: '#333' }}>{remark.text}</p>
                    )}

                    {remark.image && (
                      <div style={{ marginTop: '10px', marginLeft: '42px' }}>
                        <img
                          src={getImageUrl(remark.image)}
                          alt="Remark attachment"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setZoomImage(getImageUrl(remark.image))}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', e.target.src);
                            
                            // Get the base URL without /api
                            const baseUrl = API_URL.replace(/\/api$/, '');
                            
                            // Get the filename from the original path
                            const originalPath = remark.image;
                            const filename = originalPath.split(/[\\/]/).pop();
                            
                            // Try different path combinations
                            const pathsToTry = [
                              `${baseUrl}/uploads/client-remarks/${filename}`,
                              `${baseUrl}/uploads/${filename}`,
                              `${baseUrl}/client-remarks/${filename}`,
                              `${baseUrl}/api/uploads/client-remarks/${filename}`,
                              `${baseUrl}/api/uploads/${filename}`,
                              `${baseUrl}/api/client-remarks/${filename}`,
                              `${baseUrl}/${originalPath.replace(/\\/g, '/')}`,
                              `${baseUrl}/uploads/${originalPath.replace(/\\/g, '/')}`,
                            ];
                            
                            // Remove duplicates
                            const uniquePaths = [...new Set(pathsToTry)];
                            
                            void 0;
                            
                            let triedIndex = 0;
                            const tryNextPath = () => {
                              if (triedIndex < uniquePaths.length) {
                                void 0;
                                e.target.src = uniquePaths[triedIndex];
                                triedIndex++;
                              } else {
                                // Show fallback if all paths fail
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                
                                // Create fallback UI
                                const fallback = document.createElement('div');
                                fallback.style.cssText = `
                                  padding: 20px;
                                  background: #fff3f3;
                                  border: 1px solid #ffcdd2;
                                  border-radius: 8px;
                                  text-align: center;
                                  color: #d32f2f;
                                  font-size: 14px;
                                `;
                                fallback.innerHTML = 'Image not available';
                                parent.appendChild(fallback);
                              }
                            };
                            
                            e.target.onerror = tryNextPath;
                            tryNextPath();
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <FiMessageSquare size={32} color="#ccc" />
                <p style={{ marginTop: '10px' }}>No remarks yet</p>
              </div>
            )}
          </div>

          <div className="TaskDetails-activity-modal-footer">
            <button
              className="TaskDetails-activity-modal-close-btn"
              onClick={handleCloseRemarksDialog}
            >
              Close
            </button>
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

    return (
      <div className="user-create-task-snackbar-top" style={{ zIndex: 9999 }}>
        <div className={`user-create-task-snackbar-content user-create-task-snackbar-${snackbar.severity}`}>
          <div className="user-create-task-snackbar-message">
            {snackbar.message}
          </div>
          <button
            className="user-create-task-snackbar-close"
            onClick={() => setSnackbar({ ...snackbar, open: false })}
          >
            <FiX size={18} />
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
                    {selectedUser?.role || 'Employee'}
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
                  
                  const isToday = isSameDay(getSourceAwareTaskDate(task), today);
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
                      {selectedUser?.role || 'Employee'}
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
                    
                    const isToday = isSameDay(getSourceAwareTaskDate(task), today);
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
      </div>
    );
  }

  return (
    <div className="TaskDetails-section">
      {renderSnackbar()}
      {renderError()}

      <div className="TaskDetails-header">
        <div className="TaskDetails-header-content">
          <div className="TaskDetails-header-top">
            <div className="TaskDetails-header-title">
              <h1>📊 Company Employee Task Management</h1>
              <p className="TaskDetails-header-subtitle">
                Comprehensive dashboard with advanced filtering and analytics
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Logged in as: {currentUser?.name}
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: isOwner() ? '#e3f2fd' : '#fff3e0',
                    color: isOwner() ? '#1976d2' : '#f57c00',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    {isOwner() ? '👑 Owner' : '👤 Employee'}
                  </span>
                </p>
                {!isOwner() && currentUser?.department && (
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', display: 'flex', gap: '3px' }}>
                    <FiUsers size={14} /> Department: {getDepartmentName(currentUser.department)}
                  </p>
                )}
              </div>
            </div>
            <div className="TaskDetails-header-stats">
              <div className="TaskDetails-stats-icon">
                <FiUsers />
              </div>
              <div className="TaskDetails-stats-text">
                <h2>{filteredUsers.length}</h2>
                <p>
                  {isOwner() ? 'COMPANY EMPLOYEES' : 'DEPARTMENT EMPLOYEES'}
                </p>
              </div>
            </div>
          </div>

          {renderOverallStats()}

          <div className="TaskDetails-modal-date-range" style={{ marginTop: '1rem' }}>
            <div className="TaskDetails-modal-date-input">
              <FiCalendar size={14} />
              <input
                type="date"
                value={globalFromDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalFromDate(val);
                  setGlobalToDate(val);
                }}
                placeholder="Select Date"
              />
            </div>
            {(globalFromDate || globalToDate) && (
              <button
                className="TaskDetails-modal-date-clear"
                onClick={() => {
                  const todayValue = getDateInputValue();
                  setGlobalFromDate(todayValue);
                  setGlobalToDate(todayValue);
                }}
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="TaskDetails-card">
        <div className="TaskDetails-card-content">
          <div className="TaskDetails-card-header">
            <div className="TaskDetails-card-title-section">
              <div className="TaskDetails-card-icon">
                <FiUsers />
              </div>
              <div>
                <h3 className="TaskDetails-card-title">
                  {isOwner() ? 'Company Employee Directory' : 'Department Employee Directory'}
                </h3>
                <p className="TaskDetails-card-subtitle">
                  <FiInfo size={14} />
                  {isOwner()
                    ? 'Viewing all employees across the company'
                    : `Viewing employees in your department only`}
                </p>
              </div>
            </div>

            <div className="TaskDetails-filter-section">
              <input
                type="text"
                className="TaskDetails-search-input"
                placeholder={`Search ${isOwner() ? 'company' : 'department'} employees by name, email or ID...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="TaskDetails-reset-filter-button"
                onClick={resetFilters}
                disabled={!searchQuery && !loggedInTodayOnly && activeStatusFilters.length === 1 && activeStatusFilters[0] === 'all'}
              >
                <FiRefreshCw size={16} />
                Reset
              </button>
              <button
                type="button"
                className={`TaskDetails-login-filter-button ${loggedInTodayOnly ? 'active' : ''}`}
                onClick={() => setLoggedInTodayOnly(prev => !prev)}
                disabled={todayAttendanceLoading}
                title="Show only employees who logged in today"
              >
                <FiLogIn size={16} />
                {todayAttendanceLoading
                  ? 'Checking...'
                  : loggedInTodayOnly
                    ? `Logged In Today (${todayLoggedInUserIds.size})`
                    : 'Today Logged In'}
              </button>
            </div>
          </div>

          <div className="TaskDetails-stats-grid">
            <div className="TaskDetails-stat-item">
              <div className="TaskDetails-stat-content">
                <div className="TaskDetails-stat-icon-box">
                  <FiUsers />
                </div>
                <div className="TaskDetails-stat-text">
                  <h4>{systemStats.totalEmployees}</h4>
                  <p>{isOwner() ? 'Total Employees' : 'Dept Employees'}</p>
                </div>
              </div>
            </div>
            <div className="TaskDetails-stat-item">
              <div className="TaskDetails-stat-content">
                <div className="TaskDetails-stat-icon-box" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                  <FiList style={{ color: '#0ea5e9' }} />
                </div>
                <div className="TaskDetails-stat-text">
                  <h4>{systemStats.totalTasks}</h4>
                  <p>Total Tasks</p>
                </div>
              </div>
            </div>
            <div className="TaskDetails-stat-item">
              <div className="TaskDetails-stat-content">
                <div className="TaskDetails-stat-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <FiCheckCircle style={{ color: '#10b981' }} />
                </div>
                <div className="TaskDetails-stat-text">
                  <h4>{systemStats.avgCompletion}%</h4>
                  <p>Avg Completion</p>
                </div>
              </div>
            </div>
            <div className="TaskDetails-stat-item">
              <div className="TaskDetails-stat-content">
                <div className="TaskDetails-stat-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <FiUsers style={{ color: '#8b5cf6' }} />
                </div>
                <div className="TaskDetails-stat-text">
                  <h4>{systemStats.activeEmployees}</h4>
                  <p>Active Employees</p>
                </div>
              </div>
            </div>
          </div>

          {usersLoading ? (
            <div className="TaskDetails-loading-container">
              <div className="TaskDetails-loading-spinner"></div>
              <div className="TaskDetails-loading-text">
                <h4>Loading Employee Data...</h4>
                <p>Please wait while we fetch the latest information</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="TaskDetails-empty-state">
              <div className="TaskDetails-empty-icon">
                <FiUsers />
              </div>
              <h3>No Employees Found</h3>
              <p>
                {loggedInTodayOnly
                  ? 'No employees have logged in today for the current view'
                  : isOwner()
                    ? 'No employees found in your company'
                    : 'No employees found in your department'}
              </p>
              <button
                className="TaskDetails-reset-button"
                onClick={resetFilters}
              >
                <FiRefreshCw size={16} />
                Reset Search
              </button>
            </div>
          ) : (
            <div className="TaskDetails-users-grid">
              {filteredUsers.map((user) => renderEnhancedUserCard(user))}
            </div>
          )}
        </div>
      </div>

      {renderEnhancedDialog()}
      {renderActivityLogModal()}
      {renderRemarksDialog()}
      {renderImageZoomModal()}
    </div>
  );
};

export default TaskDetails;
