import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiCalendar, FiInfo, FiPaperclip, FiMic, FiFileText,
  FiCheck, FiX, FiAlertCircle, FiUser, FiBell, FiRefreshCw,
  FiMessageSquare, FiActivity, FiDownload, FiClock, FiCheckCircle,
  FiXCircle, FiFilter, FiSearch, FiLogOut, FiMessageCircle,
  FiBarChart2, FiTrendingUp, FiList, FiPause, FiTarget, FiUsers,
  FiSlash, FiImage, FiCamera, FiTrash2, FiZoomIn, FiCheckSquare,
  FiGlobe, FiSun, FiRotateCcw, FiAlertTriangle
} from 'react-icons/fi';

import "../Css/TaskManagement.css";
import API_URL from '../../config';
import CIISLoader from '../../Loader/CIISLoader';

// Helper function to get correct image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const baseUrl = API_URL || 'http://localhost:3000';
  const baseUrlWithoutApi = baseUrl.replace(/\/api$/, '');

  let cleanPath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  if (cleanPath.startsWith('uploads/client-remarks/')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('client-remarks/')) {
    return `${baseUrlWithoutApi}/uploads/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('uploads/remarks/')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('remarks/')) {
    return `${baseUrlWithoutApi}/uploads/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('uploads/')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  
  if (cleanPath.includes('client-remarks')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  
  const filename = cleanPath.split('/').pop();
  
  const possiblePaths = [
    `${baseUrlWithoutApi}/uploads/client-remarks/${filename}`,
    `${baseUrlWithoutApi}/uploads/remarks/client-remarks/${filename}`,
    `${baseUrlWithoutApi}/client-remarks/${filename}`,
    `${baseUrlWithoutApi}/uploads/${filename}`
  ];
  
  return possiblePaths[0];
};

// Helper function to get client name from task object
const getClientNameFromTask = (task) => {
  if (task.clientName && task.clientName !== 'Unknown Client') {
    return task.clientName;
  }
  
  if (task.clientId && typeof task.clientId === 'object') {
    if (task.clientId.company) {
      return task.clientId.company;
    }
    if (task.clientId.email) {
      return task.clientId.email.split('@')[0];
    }
  }
  
  if (task.clientCompany) {
    return task.clientCompany;
  }
  
  return 'N/A';
};

// Helper function to normalize status
const normalizeStatus = (status) => {
  if (!status) return 'pending';
  
  const statusMap = {
    'In Progress': 'in-progress',
    'In-Progress': 'in-progress',
    'inprogress': 'in-progress',
    'Pending': 'pending',
    'Completed': 'completed',
    'Overdue': 'overdue',
    'Rejected': 'rejected',
    'On Hold': 'onhold',
    'OnHold': 'onhold',
    'Reopen': 'reopen',
    'Cancelled': 'cancelled'
  };
  
  return statusMap[status] || status.toLowerCase();
};

const StatCard = ({ color = 'primary', clickable = true, active = false, children, onClick }) => {
  return (
    <div 
      className={`user-create-task-stat-card ${active ? 'active' : ''}`}
      style={{ borderLeftColor: getColorValue(color) }}
      onClick={clickable ? onClick : undefined}
    >
      {children}
    </div>
  );
};

const StatusChip = ({ status, label }) => {
  const normalizedStatus = normalizeStatus(status);
  const statusLabel = label || normalizedStatus;
  return (
    <div className={`user-create-task-status-chip ${normalizedStatus}`}>
      {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1).replace('-', ' ')}
    </div>
  );
};

const PriorityChip = ({ priority }) => {
  const priorityLabel = priority || 'medium';
  return (
    <div className={`user-create-task-priority-chip ${priorityLabel}`}>
      {priorityLabel.charAt(0).toUpperCase() + priorityLabel.slice(1)}
    </div>
  );
};

const getColorValue = (color) => {
  const colors = {
    primary: '#1976d2',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    error: '#f44336',
    secondary: '#9c27b0',
    grey: '#9e9e9e',
    orange: '#ff9800'
  };
  return colors[color] || '#1976d2';
};

const emptyExternalStats = () => ({
  total: 0,
  pending: { count: 0, percentage: 0 },
  inProgress: { count: 0, percentage: 0 },
  completed: { count: 0, percentage: 0 },
  overdue: { count: 0, percentage: 0 }
});

const UserCreateTask = () => {
  // State declarations
  const [openDialog, setOpenDialog] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [authError, setAuthError] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [loadingClientTasks, setLoadingClientTasks] = useState(false);

  // Self tasks state
  const [myTasksGrouped, setMyTasksGrouped] = useState({});
  
  // Client tasks assigned to me
  const [assignedToMeTasksGrouped, setAssignedToMeTasksGrouped] = useState({});
  const [clientTasksGrouped, setClientTasksGrouped] = useState({});
  
  // Task view mode
  const [taskViewMode, setTaskViewMode] = useState('self');

  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Self task stats
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    completed: { count: 0, percentage: 0 },
    rejected: { count: 0, percentage: 0 },
    onHold: { count: 0, percentage: 0 },
    reopen: { count: 0, percentage: 0 },
    cancelled: { count: 0, percentage: 0 },
    overdue: { count: 0, percentage: 0 }
  });

  // Assigned tasks stats
  const [assignedTaskStats, setAssignedTaskStats] = useState({
    total: 0,
    pending: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    completed: { count: 0, percentage: 0 },
    overdue: { count: 0, percentage: 0 }
  });

  const [clientTaskStats, setClientTaskStats] = useState({
    total: 0,
    pending: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    completed: { count: 0, percentage: 0 },
    overdue: { count: 0, percentage: 0 }
  });

  const [timeFilter, setTimeFilter] = useState("today");
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [remarksDialog, setRemarksDialog] = useState({ open: false, taskId: null, remarks: [] });
  const [newRemark, setNewRemark] = useState('');
  const [remarkImages, setRemarkImages] = useState([]);
  const [isUploadingRemark, setIsUploadingRemark] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityDialog, setActivityDialog] = useState({ open: false, taskId: null });
  
  const [zoomImage, setZoomImage] = useState(null);

  const [calendarFilterOpen, setCalendarFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateFilterType, setDateFilterType] = useState('dueDate');
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDateTime: '',
    priority: 'medium',
    priorityDays: '1',
    files: null,
    voiceNote: null,
  });

  const [pendingStatusChange, setPendingStatusChange] = useState({ taskId: null, status: '' });
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);

  const [overdueTasks, setOverdueTasks] = useState([]);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [loadingOverdue, setLoadingOverdue] = useState(false);

  const navigate = useNavigate();
  const snackbarTimerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  // Refs for filter values
  const statusFilterRef = useRef(statusFilter);
  const searchTermRef = useRef(searchTerm);
  const timeFilterRef = useRef(timeFilter);

  // Update refs
  useEffect(() => {
    statusFilterRef.current = statusFilter;
    searchTermRef.current = searchTerm;
    timeFilterRef.current = timeFilter;
  }, [statusFilter, searchTerm, timeFilter]);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Snackbar utility
  const showSnackbar = (message, severity = 'info') => {
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
  };

  // Fetch user data
  const fetchUserData = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setAuthError(true);
        showSnackbar('Please log in to access tasks', 'error');
        return;
      }

      const user = JSON.parse(userStr);
      
      const userId = user.id || user._id;
      const userRole = user.role || user.jobRole;
      const userName = user.name;
      
      if (!userId || !userRole || !userName) {
        setAuthError(true);
        showSnackbar('Invalid user data. Please log in again.', 'error');
        return;
      }

      setUserRole(userRole);
      setUserId(userId);
      setUserName(userName);
      setAuthError(false);
      
      console.log('✅ User data loaded:', { userId, userRole, userName });
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      setAuthError(true);
      showSnackbar('Error loading user data. Please log in again.', 'error');
    }
  }, []);

  // Get user status for a task (for self tasks)
  const getUserStatusForTask = useCallback((task, userId) => {
    if (!task || !userId) return 'pending';
    
    const userStatus = task.statusByUser?.find(s => {
      if (typeof s.user === 'string') return s.user === userId;
      if (s.user && typeof s.user === 'object') return s.user._id === userId;
      return false;
    });
    
    if (userStatus) return normalizeStatus(userStatus.status);
    
    const statusInfo = task.statusInfo?.find(s => s.userId === userId);
    if (statusInfo) return normalizeStatus(statusInfo.status);
    
    return 'pending';
  }, []);

  // Get status for assigned tasks - FIXED: properly normalize status
  const getAssignedTaskStatus = useCallback((task) => {
    if (!task) return 'pending';
    
    // Check for completed flag
    if (task.completed === true) return 'completed';
    
    // Check for status field
    if (task.status) {
      return normalizeStatus(task.status);
    }
    
    return 'pending';
  }, []);

  // Check if task is overdue
  const isOverdue = useCallback((dueDateTime, status) => {
    if (!dueDateTime) return false;
    if (status === 'overdue') return true;
    
    const now = new Date();
    const dueDate = new Date(dueDateTime);
    
    const isPastDue = dueDate < now;
    const canBeOverdue = ['pending', 'in-progress', 'reopen', 'onhold'];
    
    return isPastDue && canBeOverdue.includes(status);
  }, []);

  // Helper function to group tasks by date
  const groupTasksByDate = useCallback((tasks) => {
    const grouped = {};
    
    tasks.forEach(task => {
      const dateToUse = task.dueDate || task.dueDateTime || task.createdAt;
      
      if (dateToUse) {
        const dateKey = new Date(dateToUse).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      } else {
        const fallbackKey = 'No Date';
        if (!grouped[fallbackKey]) {
          grouped[fallbackKey] = [];
        }
        grouped[fallbackKey].push(task);
      }
    });
    
    const sortedGrouped = {};
    Object.keys(grouped)
      .sort((a, b) => {
        if (a === 'No Date') return 1;
        if (b === 'No Date') return -1;
        return new Date(a) - new Date(b);
      })
      .forEach(key => {
        sortedGrouped[key] = grouped[key];
      });
    
    return sortedGrouped;
  }, []);

  // Get overdue count
  const getOverdueCount = useMemo(() => {
    const tasksToCheck = taskViewMode === 'self'
      ? myTasksGrouped
      : taskViewMode === 'client'
        ? clientTasksGrouped
        : assignedToMeTasksGrouped;
    let count = 0;
    
    Object.values(tasksToCheck).forEach(tasks => {
      tasks.forEach(task => {
        if (taskViewMode === 'self') {
          const myStatus = getUserStatusForTask(task, userId);
          const taskIsOverdue = isOverdue(task.dueDateTime, myStatus);
          if (taskIsOverdue || myStatus === 'overdue') {
            count++;
          }
        } else {
          const status = getAssignedTaskStatus(task);
          const dueDate = task.dueDate || task.dueDateTime;
          const taskIsOverdue = isOverdue(dueDate, status);
          if (taskIsOverdue || status === 'overdue') {
            count++;
          }
        }
      });
    });
    return count;
  }, [myTasksGrouped, assignedToMeTasksGrouped, clientTasksGrouped, taskViewMode, userId, getUserStatusForTask, getAssignedTaskStatus, isOverdue]);

  // Calculate stats from self tasks
  const calculateStatsFromTasks = useCallback((tasks) => {
    if (!tasks || Object.keys(tasks).length === 0) {
      setTaskStats({
        total: 0,
        pending: { count: 0, percentage: 0 },
        inProgress: { count: 0, percentage: 0 },
        completed: { count: 0, percentage: 0 },
        rejected: { count: 0, percentage: 0 },
        onHold: { count: 0, percentage: 0 },
        reopen: { count: 0, percentage: 0 },
        cancelled: { count: 0, percentage: 0 },
        overdue: { count: 0, percentage: 0 }
      });
      return;
    }
    
    let total = 0;
    const statusCounts = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      rejected: 0,
      onhold: 0,
      reopen: 0,
      cancelled: 0,
      overdue: 0
    };

    Object.values(tasks).forEach(dateTasks => {
      dateTasks.forEach(task => {
        total++;
        const myStatus = getUserStatusForTask(task, userId);

        if (statusCounts[myStatus] !== undefined) {
          statusCounts[myStatus]++;
        }

        if (isOverdue(task.dueDateTime, myStatus) && myStatus !== 'overdue') {
          statusCounts.overdue++;
        }
      });
    });

    const calculatePercentage = (count) => total > 0 ? Math.round((count / total) * 100) : 0;

    setTaskStats({
      total,
      pending: { count: statusCounts.pending, percentage: calculatePercentage(statusCounts.pending) },
      inProgress: { count: statusCounts['in-progress'], percentage: calculatePercentage(statusCounts['in-progress']) },
      completed: { count: statusCounts.completed, percentage: calculatePercentage(statusCounts.completed) },
      rejected: { count: statusCounts.rejected, percentage: calculatePercentage(statusCounts.rejected) },
      onHold: { count: statusCounts.onhold, percentage: calculatePercentage(statusCounts.onhold) },
      reopen: { count: statusCounts.reopen, percentage: calculatePercentage(statusCounts.reopen) },
      cancelled: { count: statusCounts.cancelled, percentage: calculatePercentage(statusCounts.cancelled) },
      overdue: { count: statusCounts.overdue, percentage: calculatePercentage(statusCounts.overdue) }
    });
  }, [userId, getUserStatusForTask, isOverdue]);

  // Calculate stats from assigned/client tasks - FIXED: properly handle status counts
  const calculateExternalStatsFromTasks = useCallback((tasks) => {
    if (!tasks || Object.keys(tasks).length === 0) {
      return emptyExternalStats();
    }
    
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    Object.values(tasks).forEach(dateTasks => {
      dateTasks.forEach(task => {
        total++;
        
        // Get normalized status
        let status = getAssignedTaskStatus(task);
        
        // Count by status
        if (status === 'completed') {
          completed++;
        } else if (status === 'in-progress') {
          inProgress++;
        } else if (status === 'pending') {
          pending++;
        } else if (status === 'overdue') {
          overdue++;
        }
        
        // Also check if task is overdue based on due date
        const dueDate = task.dueDate || task.dueDateTime;
        if (dueDate && status !== 'completed') {
          const isTaskOverdue = isOverdue(dueDate, status);
          if (isTaskOverdue && status !== 'overdue') {
            overdue++;
            // Don't double count - if it's overdue, it shouldn't be in pending/in-progress for stats
            if (status === 'pending') pending--;
            if (status === 'in-progress') inProgress--;
          }
        }
      });
    });

    const calculatePercentage = (count) => total > 0 ? Math.round((count / total) * 100) : 0;

    return {
      total,
      pending: { count: pending, percentage: calculatePercentage(pending) },
      inProgress: { count: inProgress, percentage: calculatePercentage(inProgress) },
      completed: { count: completed, percentage: calculatePercentage(completed) },
      overdue: { count: overdue, percentage: calculatePercentage(overdue) }
    };
  }, [getAssignedTaskStatus, isOverdue]);

  const calculateAssignedStatsFromTasks = useCallback((tasks) => {
    setAssignedTaskStats(calculateExternalStatsFromTasks(tasks));
  }, [calculateExternalStatsFromTasks]);

  const calculateClientStatsFromTasks = useCallback((tasks) => {
    setClientTaskStats(calculateExternalStatsFromTasks(tasks));
  }, [calculateExternalStatsFromTasks]);

  // Function to enrich tasks with proper client names and normalize status
  const enrichAssignedTasks = useCallback((tasks) => {
    return tasks.map(task => {
      let clientDisplayName = 'Unknown Client';
      
      if (task.clientId && typeof task.clientId === 'object') {
        if (task.clientId.company) {
          clientDisplayName = task.clientId.company;
        } else if (task.clientId.email) {
          clientDisplayName = task.clientId.email.split('@')[0];
        }
      }
      
      // Normalize the status
      let normalizedStatus = normalizeStatus(task.status);
      
      // If task is completed, ensure status reflects that
      if (task.completed === true && normalizedStatus !== 'completed') {
        normalizedStatus = 'completed';
      }
      
      return {
        ...task,
        clientName: clientDisplayName,
        clientCompany: task.clientId?.company || task.clientCompany,
        clientEmail: task.clientId?.email || task.clientEmail,
        status: normalizedStatus
      };
    });
  }, []);

  const extractTasksFromResponse = useCallback((data) => {
    if (data?.groupedTasks) return Object.values(data.groupedTasks).flat();
    if (Array.isArray(data?.tasks)) return data.tasks;
    if (Array.isArray(data)) return data;
    return [];
  }, []);

  // Fetch assigned to me tasks
  const fetchAssignedToMeTasks = useCallback(async () => {
    if (authError || !userId) {
      console.log('⛔ Cannot fetch assigned tasks: authError or no userId', { authError, userId });
      return;
    }

    console.log('🚀 Starting fetchAssignedToMeTasks...');
    setLoadingAssigned(true);
    
    try {
      const params = new URLSearchParams();
      
      if (statusFilterRef.current && statusFilterRef.current !== 'all') {
        params.append('status', statusFilterRef.current);
      }
      
      if (searchTermRef.current) {
        params.append('search', searchTermRef.current);
      }
      
      if (timeFilterRef.current && timeFilterRef.current !== 'all') {
        params.append('period', timeFilterRef.current);
      }

      const url = `/task/my${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log('📡 Fetching assigned tasks from:', url);
      
      const res = await axios.get(url);
      
      console.log('✅ API Response status:', res.status);
      console.log('📦 Response data:', res.data);

      if (res.data && (res.data.success || res.data.groupedTasks || Array.isArray(res.data))) {
        let tasksArray = extractTasksFromResponse(res.data)
          .filter(task => {
            const createdBy = typeof task.createdBy === 'object' ? task.createdBy?._id || task.createdBy?.id : task.createdBy;
            return !createdBy || createdBy.toString() !== userId.toString();
          });
        tasksArray = enrichAssignedTasks(tasksArray);
        const groupedTasks = groupTasksByDate(tasksArray);
        setAssignedToMeTasksGrouped(groupedTasks);
        calculateAssignedStatsFromTasks(groupedTasks);
        
        const totalTasks = tasksArray.length;
        console.log(`✅ Total assigned tasks loaded: ${totalTasks}`);
        
        if (totalTasks > 0) {
          console.log('📊 Sample task statuses:', tasksArray.slice(0, 3).map(t => ({ title: t.title, status: t.status })));
          showSnackbar(`✅ Loaded ${totalTasks} assigned tasks`, 'success');
        } else {
          console.log('ℹ️ No assigned tasks found');
        }
        
      } else {
        console.log('⚠️ No data in response');
        setAssignedToMeTasksGrouped({});
        calculateAssignedStatsFromTasks({});
      }

    } catch (err) {
      console.error('❌ Error in fetchAssignedToMeTasks:', err);
      
      if (err.response) {
        console.error('❌ Error response:', {
          status: err.response.status,
          data: err.response.data,
        });
        
        if (err.response.status === 401) {
          setAuthError(true);
          showSnackbar('Session expired. Please log in again.', 'error');
        } else if (err.response.status === 404) {
          console.warn('⚠️ Assigned tasks API endpoint not found (404)');
          showSnackbar('Assigned tasks feature is not available', 'warning');
          setAssignedToMeTasksGrouped({});
          calculateAssignedStatsFromTasks({});
        } else {
          showSnackbar(`Failed to load assigned tasks: ${err.response.data?.message || err.response.status}`, 'error');
        }
      } else if (err.request) {
        console.error('❌ No response received:', err.request);
        showSnackbar('Network error - server not responding', 'error');
      } else {
        console.error('❌ Error setting up request:', err.message);
        showSnackbar('Failed to load assigned tasks', 'error');
      }
      
      setAssignedToMeTasksGrouped({});
      calculateAssignedStatsFromTasks({});
      
    } finally {
      setLoadingAssigned(false);
      console.log('🏁 fetchAssignedToMeTasks completed');
    }
  }, [authError, userId, enrichAssignedTasks, extractTasksFromResponse, groupTasksByDate, calculateAssignedStatsFromTasks]);

  const fetchClientTasks = useCallback(async () => {
    if (authError || !userId) return;

    setLoadingClientTasks(true);
    try {
      const params = new URLSearchParams();
      if (statusFilterRef.current && statusFilterRef.current !== 'all') params.append('status', statusFilterRef.current);
      if (searchTermRef.current) params.append('search', searchTermRef.current);
      if (timeFilterRef.current && timeFilterRef.current !== 'all') params.append('period', timeFilterRef.current);

      const url = `/tasks/assigned-to-me${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await axios.get(url);
      const tasksArray = enrichAssignedTasks(extractTasksFromResponse(res.data));
      const groupedTasks = groupTasksByDate(tasksArray);
      setClientTasksGrouped(groupedTasks);
      calculateClientStatsFromTasks(groupedTasks);
    } catch (err) {
      console.error('❌ Error in fetchClientTasks:', err);
      setClientTasksGrouped({});
      calculateClientStatsFromTasks({});
      if (err.response?.status !== 404) {
        showSnackbar('Failed to load client tasks', 'error');
      }
    } finally {
      setLoadingClientTasks(false);
    }
  }, [authError, userId, enrichAssignedTasks, extractTasksFromResponse, groupTasksByDate, calculateClientStatsFromTasks]);

  // Fetch self tasks
  const fetchMyTasks = useCallback(async () => {
    if (authError || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (statusFilterRef.current && statusFilterRef.current !== 'all') params.append('status', statusFilterRef.current);
      if (searchTermRef.current) params.append('search', searchTermRef.current);
      if (timeFilterRef.current && timeFilterRef.current !== 'all') params.append('period', timeFilterRef.current);

      const url = `/task/my?${params.toString()}`;
      console.log('📡 Fetching my tasks from:', url);
      
      const res = await axios.get(url);
      const tasks = res.data.groupedTasks || {};
      
      console.log('✅ My tasks received:', Object.keys(tasks).length, 'groups');
      
      setMyTasksGrouped(tasks);
      calculateStatsFromTasks(tasks);

    } catch (err) {
      console.error('Error fetching my tasks:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        showSnackbar('Session expired. Please log in again.', 'error');
      } else {
        showSnackbar('Failed to load tasks', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [authError, userId, calculateStatsFromTasks]);

  // Fetch overdue tasks
  const fetchOverdueTasks = useCallback(async () => {
    if (authError || !userId) {
      return;
    }

    setLoadingOverdue(true);
    try {
      const res = await axios.get('/task/overdue');
      setOverdueTasks(res.data.overdueTasks || {});
    } catch (err) {
      console.error('Error fetching overdue tasks:', err);
    } finally {
      setLoadingOverdue(false);
    }
  }, [authError, userId]);

  // Handle time filter change
  const handleTimeFilterChange = (period) => {
    setTimeFilter(period);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setTaskViewMode(mode);
    setStatusFilter('');
  };

  // Handle stats card click
  const handleStatsCardClick = (status) => {
    if (status) {
      const newStatusFilter = statusFilter === status ? '' : status;
      setStatusFilter(newStatusFilter);
      
      showSnackbar(
        newStatusFilter 
          ? `Filtering ${taskViewMode === 'self' ? 'personal' : taskViewMode === 'client' ? 'client' : 'assigned'} tasks by: ${status.replace('-', ' ')}` 
          : 'Cleared status filter',
        'info'
      );
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('');
    setTimeFilter('all');
    setSelectedDate(null);
    setDateRange({ start: null, end: null });
    setSearchTerm('');
    setShowOverdueOnly(false);
    showSnackbar('All filters cleared', 'info');
  };

  // Fetch task remarks
  const fetchTaskRemarks = async (taskId) => {
    try {
      const isClientTask = taskViewMode === 'client';
      const endpoint = isClientTask 
        ? `/tasks/${taskId}/client-remarks`
        : `/task/${taskId}/remarks`;
      
      console.log('📡 Fetching remarks from endpoint:', endpoint);
      
      const res = await axios.get(endpoint);
      console.log('📥 Remarks data:', res.data);
      
      let remarks = [];
      if (res.data.success && res.data.data) {
        if (Array.isArray(res.data.data)) {
          remarks = res.data.data;
        } else if (res.data.data.remarks) {
          remarks = res.data.data.remarks;
        } else if (res.data.data.data && Array.isArray(res.data.data.data)) {
          remarks = res.data.data.data;
        }
      } else if (res.data.remarks) {
        remarks = res.data.remarks;
      } else if (Array.isArray(res.data)) {
        remarks = res.data;
      }
      
      remarks = remarks.map(remark => {
        if (remark.image && !remark.images) {
          remark.images = [{
            url: remark.image,
            filename: remark.image.split('/').pop(),
            originalName: remark.image.split('/').pop(),
            size: 0,
            mimeType: 'image/jpeg'
          }];
        }
        
        if (!remark.images) {
          remark.images = [];
        }
        
        return remark;
      });
      
      console.log('📊 Processed remarks count:', remarks.length);
      
      setRemarksDialog({ 
        open: true, 
        taskId, 
        remarks: remarks 
      });
      
    } catch (error) {
      console.error('Error fetching remarks:', error);
      showSnackbar('Failed to load remarks', 'error');
    }
  };

  // Handle remark image upload
  const handleRemarkImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showSnackbar('Please select valid image files', 'warning');
      return;
    }

    remarkImages.forEach(image => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });

    const filesToUse = taskViewMode === 'client' ? imageFiles : imageFiles.slice(0, 1);
    const newImages = filesToUse.map(file => ({
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setRemarkImages(newImages);
  };

  // Handle remove remark image
  const handleRemoveRemarkImage = (index) => {
    setRemarkImages(prev => {
      const newImages = [...prev];
      if (newImages[index].preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Handle drag over
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Handle drop
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const inputEvent = {
        target: {
          files: event.dataTransfer.files
        }
      };
      handleRemarkImageUpload(inputEvent);
    }
  };

  // Add remark
  const addRemark = async (taskId) => {
    if (!newRemark.trim() && remarkImages.length === 0) {
      showSnackbar('Please enter a remark or upload an image', 'warning');
      return false;
    }
    
    setIsUploadingRemark(true);
    
    try {
      const isAssignedTask = taskViewMode === 'client';
      
      let endpoint;
      let formData = new FormData();
      
      if (isAssignedTask) {
        if (remarkImages.length > 0) {
          endpoint = `/tasks/${taskId}/client-remarks/upload-images`;
          formData.append('text', newRemark.trim());
          
          remarkImages.forEach((image) => {
            console.log('📤 Uploading image for assigned task:', image.file.name);
            formData.append('images', image.file);
          });
          
          const response = await axios.post(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          
          console.log('✅ Remark with images added successfully:', response.data);
          
          setNewRemark('');
          remarkImages.forEach(image => {
            if (image.preview) URL.revokeObjectURL(image.preview);
          });
          setRemarkImages([]);
          
          showSnackbar('Remark added successfully with images', 'success');
          return true;
        } else {
          endpoint = `/tasks/${taskId}/client-remarks`;
          console.log('📡 Adding remark to endpoint:', endpoint);
          console.log('📝 Remark text:', newRemark.trim());
          
          const response = await axios.post(endpoint, { text: newRemark.trim() }, {
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          console.log('✅ Remark added successfully:', response.data);
          
          setNewRemark('');
          remarkImages.forEach(image => {
            if (image.preview) URL.revokeObjectURL(image.preview);
          });
          setRemarkImages([]);
          
          showSnackbar('Remark added successfully', 'success');
          return true;
        }
      } else {
        endpoint = `/task/${taskId}/remarks`;
        formData.append('text', newRemark.trim());
        
        if (remarkImages.length > 0) {
          formData.append('image', remarkImages[0].file);
        }
        
        console.log('📡 Adding remark to endpoint:', endpoint);
        console.log('📸 Images count:', remarkImages.length);
        
        const response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });

        console.log('✅ Remark added successfully:', response.data);
        
        setNewRemark('');
        remarkImages.forEach(image => {
          if (image.preview) URL.revokeObjectURL(image.preview);
        });
        setRemarkImages([]);
        
        showSnackbar(
          `Remark added successfully${remarkImages.length > 0 ? ' with image' : ''}`, 
          'success'
        );

        return true;
      }

    } catch (error) {
      console.error('❌ Error adding remark:', error);
      console.error('❌ Error details:', error.response?.data);
      showSnackbar('Failed to add remark: ' + (error.response?.data?.message || error.message), 'error');
      return false;
      
    } finally {
      setIsUploadingRemark(false);
    }
  };

  // Handle save remark with status
  const handleSaveRemarkWithStatus = async () => {
    try {
      const remarkAdded = await addRemark(remarksDialog.taskId);
      
      if (!remarkAdded && newRemark.trim() === '' && remarkImages.length === 0) {
        if (!pendingStatusChange.status) {
          setRemarksDialog({ open: false, taskId: null, remarks: [] });
          return;
        }
      }

      if (pendingStatusChange.status) {
        console.log('📝 Applying pending status change:', pendingStatusChange);
        
        if (taskViewMode === 'self') {
          await handleStatusChange(
            pendingStatusChange.taskId,
            pendingStatusChange.status,
            newRemark.trim() || "Status changed"
          );
        } else if (taskViewMode === 'client') {
          await handleClientTaskStatusChange(
            pendingStatusChange.taskId,
            pendingStatusChange.status,
            newRemark.trim() || "Status changed"
          );
        } else {
          await handleAssignedTaskStatusChange(
            pendingStatusChange.taskId,
            pendingStatusChange.status,
            newRemark.trim() || "Status changed"
          );
        }
        setPendingStatusChange({ taskId: null, status: "" });
      }

      await fetchTaskRemarks(remarksDialog.taskId);
      
      setNewRemark("");
      remarkImages.forEach(image => {
        if (image.preview) URL.revokeObjectURL(image.preview);
      });
      setRemarkImages([]);
      
      if (taskViewMode === 'self') {
        fetchMyTasks();
      } else if (taskViewMode === 'client') {
        await fetchClientTasks();
      } else {
        await fetchAssignedToMeTasks();
      }
      
      if (pendingStatusChange.status) {
        showSnackbar('Status updated and remark added successfully', 'success');
      } else if (newRemark.trim() || remarkImages.length > 0) {
        showSnackbar('Remark added successfully', 'success');
      }
      
      if (!pendingStatusChange.status) {
        setRemarksDialog({ open: false, taskId: null, remarks: [] });
      }
      
    } catch (error) {
      console.error("Error saving remark:", error);
      showSnackbar('Failed to save remark', 'error');
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async (taskId) => {
    try {
      const isClientTask = taskViewMode === 'client';
      const endpoint = isClientTask 
        ? `/tasks/${taskId}/client-activity-logs`
        : `/task/${taskId}/activity-logs`;
      
      console.log('📡 Fetching activity logs from endpoint:', endpoint);
      
      const res = await axios.get(endpoint);
      console.log('📥 Activity logs data:', res.data);
      
      let logs = [];
      if (res.data.success && res.data.data) {
        if (Array.isArray(res.data.data)) {
          logs = res.data.data;
        } else if (res.data.data.logs) {
          logs = res.data.data.logs;
        } else if (res.data.data.data && Array.isArray(res.data.data.data)) {
          logs = res.data.data.data;
        }
      } else if (res.data.logs) {
        logs = res.data.logs;
      } else if (Array.isArray(res.data)) {
        logs = res.data;
      }
      
      console.log('📊 Processed activity logs count:', logs.length);
      
      setActivityLogs(logs);
      setActivityDialog({ open: true, taskId });
      
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      showSnackbar('Failed to load activity logs', 'error');
    }
  };

  // Apply date filter
  const applyDateFilter = useCallback((tasks) => {
    if (!selectedDate && !dateRange.start && !dateRange.end) {
      return tasks;
    }

    const filteredTasks = {};

    Object.entries(tasks).forEach(([dateKey, dateTasks]) => {
      const filteredDateTasks = dateTasks.filter(task => {
        let taskDate;
        
        if (dateFilterType === 'dueDate') {
          taskDate = task.dueDateTime ? new Date(task.dueDateTime) : (task.dueDate ? new Date(task.dueDate) : null);
        } else {
          taskDate = task.createdAt ? new Date(task.createdAt) : null;
        }

        if (!taskDate) return false;

        if (selectedDate && !dateRange.start && !dateRange.end) {
          const selected = new Date(selectedDate);
          return (
            taskDate.getDate() === selected.getDate() &&
            taskDate.getMonth() === selected.getMonth() &&
            taskDate.getFullYear() === selected.getFullYear()
          );
        }

        if (dateRange.start && dateRange.end) {
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59, 999);

          return taskDate >= start && taskDate <= end;
        }

        return true;
      });

      if (filteredDateTasks.length > 0) {
        filteredTasks[dateKey] = filteredDateTasks;
      }
    });

    return filteredTasks;
  }, [selectedDate, dateRange, dateFilterType]);

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate(null);
    setDateRange({ start: null, end: null });
    setCalendarFilterOpen(false);
  };

  // Get date filter summary
  const getDateFilterSummary = () => {
    if (selectedDate) {
      return `Date: ${new Date(selectedDate).toLocaleDateString('en-IN')}`;
    }
    if (dateRange.start && dateRange.end) {
      return `Range: ${new Date(dateRange.start).toLocaleDateString('en-IN')} - ${new Date(dateRange.end).toLocaleDateString('en-IN')}`;
    }
    return null;
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    const tasksToFilter = taskViewMode === 'self'
      ? myTasksGrouped
      : taskViewMode === 'client'
        ? clientTasksGrouped
        : assignedToMeTasksGrouped;
    return applyDateFilter(tasksToFilter);
  }, [myTasksGrouped, assignedToMeTasksGrouped, clientTasksGrouped, taskViewMode, applyDateFilter]);

  // Handle status change for self tasks
  const handleStatusChange = async (taskId, newStatus, remarks = '') => {
    if (authError || !userId) {
      showSnackbar('Please log in to update task status', 'error');
      return;
    }

    try {
      await axios.patch(`/task/${taskId}/status`, { 
        status: newStatus, 
        remarks: remarks || `Status changed to ${newStatus}`
      });

      fetchMyTasks();
      fetchOverdueTasks();
      
      showSnackbar('Status updated successfully', 'success');

    } catch (err) {
      console.error("Error in handleStatusChange:", err.response || err);
      if (err.response?.status === 401) {
        setAuthError(true);
        showSnackbar('Session expired. Please log in again.', 'error');
      } else {
        showSnackbar(err?.response?.data?.error || 'Failed to update status', 'error');
      }
    }
  };

  // Handle status change for assigned tasks
  const handleAssignedTaskStatusChange = async (taskId, newStatus, remarks = '') => {
    if (authError || !userId) {
      showSnackbar('Please log in to update task status', 'error');
      return;
    }

    try {
      const normalizedStatus = normalizeStatus(newStatus);
      console.log(`🔄 Updating assigned task ${taskId} status to: ${normalizedStatus}`);
      
      // Normal assigned tasks use the standard task status endpoint.
      const response = await axios.patch(`/task/${taskId}/status`, {
        status: normalizedStatus,
        remarks: remarks || `Status changed to ${normalizedStatus}`
      });
      
      console.log('✅ Assigned task status updated:', response.data);
      
      await fetchAssignedToMeTasks();
      await fetchOverdueTasks();
      
      showSnackbar(`Task status changed to ${normalizedStatus} successfully`, 'success');

    } catch (err) {
      console.error("❌ Error updating assigned task:", err);
      console.error("Error details:", err.response?.data);
      
      let errorMessage = 'Failed to update task status';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleClientTaskStatusChange = async (taskId, newStatus, remarks = '') => {
    if (authError || !userId) {
      showSnackbar('Please log in to update task status', 'error');
      return;
    }

    try {
      const normalizedStatus = normalizeStatus(newStatus);
      if (remarks && remarks.trim()) {
        await axios.post(`/tasks/${taskId}/client-remarks`, { text: remarks });
      }

      let statusPayload = { status: normalizedStatus };
      if (normalizedStatus === 'completed') {
        statusPayload.completed = true;
      }

      await axios.patch(`/tasks/assigned/${taskId}/status`, statusPayload);
      await fetchClientTasks();
      await fetchOverdueTasks();
      showSnackbar(`Task status changed to ${normalizedStatus} successfully`, 'success');
    } catch (err) {
      console.error("❌ Error updating client task:", err);
      showSnackbar(err.response?.data?.message || err.response?.data?.error || 'Failed to update client task status', 'error');
    }
  };

  // Mark task as overdue
  const markTaskAsOverdue = async (taskId, remarks = '') => {
    if (authError || !userId) {
      showSnackbar('Please log in to mark task as overdue', 'error');
      return;
    }

    try {
      if (taskViewMode === 'client') {
        await axios.patch(`/tasks/assigned/${taskId}/status`, { 
          status: 'overdue',
          remarks: remarks || 'Manually marked as overdue'
        });
      } else {
        await axios.patch(`/task/${taskId}/overdue`, { 
          remarks: remarks || 'Manually marked as overdue'
        });
      }

      if (taskViewMode === 'self') {
        fetchMyTasks();
      } else if (taskViewMode === 'client') {
        fetchClientTasks();
      } else {
        fetchAssignedToMeTasks();
      }
      fetchOverdueTasks();
      
      showSnackbar('Task marked as overdue', 'warning');

    } catch (err) {
      console.error("Error marking task as overdue:", err.response || err);
      if (err.response?.status === 401) {
        setAuthError(true);
        showSnackbar('Session expired. Please log in again.', 'error');
      } else {
        showSnackbar(err?.response?.data?.error || 'Failed to mark task as overdue', 'error');
      }
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        chunks.current = [];

        const file = new File([blob], "voice-note.webm", { type: "audio/webm" });
        setNewTask({ ...newTask, voiceNote: file });
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error:", err);
      showSnackbar('Microphone access denied', 'error');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Create task
  const handleCreateTask = async () => {
    if (authError || !userId) {
      showSnackbar('Please log in to create tasks', 'error');
      return;
    }

    if (!newTask.title || !newTask.description || !newTask.dueDateTime) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    setIsCreatingTask(true);

    try {
      let dueDate;
      
      if (newTask.dueDateTime instanceof Date) {
        dueDate = newTask.dueDateTime;
      } else if (typeof newTask.dueDateTime === 'string') {
        if (newTask.dueDateTime.includes('T')) {
          const dateStr = newTask.dueDateTime.includes(':') && newTask.dueDateTime.split(':').length === 2 
            ? `${newTask.dueDateTime}:00` 
            : newTask.dueDateTime;
          dueDate = new Date(dateStr);
        } else {
          dueDate = new Date(newTask.dueDateTime);
        }
      }

      if (isNaN(dueDate.getTime())) {
        showSnackbar('Invalid date format', 'error');
        setIsCreatingTask(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('dueDateTime', dueDate.toISOString());
      formData.append('priorityDays', newTask.priorityDays || '1');
      formData.append('priority', newTask.priority);

      if (newTask.files) {
        for (let i = 0; i < newTask.files.length; i++) {
          formData.append('files', newTask.files[i]);
        }
      }

      if (newTask.voiceNote) {
        formData.append('voiceNote', newTask.voiceNote);
      }

      const response = await axios.post('/task/create-self', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('✅ Task created successfully:', response.data);

      setOpenDialog(false);
      showSnackbar('Task created successfully', 'success');
      
      setNewTask({
        title: '', 
        description: '', 
        dueDateTime: '',
        priority: 'medium', 
        priorityDays: '1', 
        files: null, 
        voiceNote: null,
      });

      fetchMyTasks();

    } catch (err) {
      console.error('❌ Error creating task:', err);
      showSnackbar(err?.response?.data?.error || 'Task creation failed', 'error');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // LOAD INITIAL DATA
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      console.log('🚀 Loading initial data...');
      
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userIdFromStorage = user.id || user._id;
          const userRoleFromStorage = user.role || user.jobRole;
          const userNameFromStorage = user.name;
          
          if (userIdFromStorage && userRoleFromStorage && userNameFromStorage) {
            console.log('👤 User found in localStorage:', { 
              userId: userIdFromStorage, 
              role: userRoleFromStorage,
              name: userNameFromStorage 
            });
            
            setUserRole(userRoleFromStorage);
            setUserId(userIdFromStorage);
            setUserName(userNameFromStorage);
            setAuthError(false);
            
            console.log('📡 Fetching tasks for user:', userIdFromStorage);
            
            await Promise.all([
              fetchMyTasks(),
              fetchAssignedToMeTasks(),
              fetchClientTasks(),
              fetchOverdueTasks()
            ]);
          } else {
            console.error('❌ Invalid user data in localStorage');
            setAuthError(true);
          }
        } else {
          console.error('❌ No user data in localStorage');
          setAuthError(true);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setAuthError(true);
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  // Fetch when user ID becomes available
  useEffect(() => {
    if (userId && !authError && !pageLoading) {
      console.log('👤 User ID available, fetching assigned tasks...');
      fetchAssignedToMeTasks();
      fetchClientTasks();
    }
  }, [userId, authError, pageLoading]);

  // Fetch when filters change
  useEffect(() => {
    if (!authError && userId && !pageLoading) {
      const timer = setTimeout(() => {
        console.log('🔄 Filters changed, refetching data');
        if (taskViewMode === 'self') {
          fetchMyTasks();
        } else if (taskViewMode === 'client') {
          fetchClientTasks();
        } else {
          fetchAssignedToMeTasks();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [statusFilter, searchTerm, timeFilter, authError, userId, taskViewMode, pageLoading]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
      
      remarkImages.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [remarkImages]);

  // AUTH ERROR SCREEN
  if (authError) {
    return (
      <div className="user-create-task-error-container">
        <div className="user-create-task-error-card">
          <FiAlertCircle size={isMobile ? 36 : 48} color="#f44336" />
          <div style={{ marginTop: '16px', color: '#f44336', fontWeight: 600, fontSize: isMobile ? '18px' : '20px' }}>
            Authentication Required
          </div>
          <div style={{ marginTop: '8px', color: '#666', marginBottom: '24px', fontSize: isMobile ? '14px' : '16px' }}>
            Please log in to access tasks.
          </div>
          <button
            className="user-create-task-button user-create-task-button-contained"
            onClick={handleLogout}
            style={{ width: '100%', padding: isMobile ? '10px' : '12px' }}
          >
            <FiUser />
            {isMobile ? 'Login' : 'Go to Login'}
          </button>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return <CIISLoader />;
  }

  // MAIN RENDER
  return (
    <div className="user-create-task-container">
      {/* Snackbar */}
      {snackbar.open && (
        <div className="user-create-task-snackbar-top">
          <div className={`user-create-task-snackbar-content user-create-task-snackbar-${snackbar.severity}`}>
            <div className="user-create-task-snackbar-message">
              {snackbar.message}
            </div>
            <button
              className="user-create-task-snackbar-close"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
            >
              <FiX size={isMobile ? 16 : 18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="user-create-task-header">
        <div className={`user-create-task-header-row ${isMobile ? 'user-create-task-flex-column' : ''}`}>
          
          {/* LEFT: Title + subtitle + stats */}
          <div className="user-create-task-header-left" style={isMobile ? { marginBottom: '16px' } : {}}>
            <div className="user-create-task-title" style={{ fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px' }}>
              Task Management
            </div>

            <div className="user-create-task-subtitle" style={{ fontSize: isMobile ? '14px' : '16px' }}>
              Manage your personal tasks and tasks assigned to you
            </div>

            <div className="user-create-task-stats-indicators">
              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#4caf50' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskViewMode === 'self' ? taskStats.completed.count : taskViewMode === 'client' ? clientTaskStats.completed.count : assignedTaskStats.completed.count} Completed
                </div>
              </div>

              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#2196f3' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskViewMode === 'self' ? taskStats.inProgress.count : taskViewMode === 'client' ? clientTaskStats.inProgress.count : assignedTaskStats.inProgress.count} In Progress
                </div>
              </div>

              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#f44336' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskViewMode === 'self' ? taskStats.overdue.count : taskViewMode === 'client' ? clientTaskStats.overdue.count : assignedTaskStats.overdue.count} Overdue
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Create Task - only show in self mode */}
          {taskViewMode === 'self' && (
            <div className={`user-create-task-header-actions ${isMobile ? 'user-create-task-flex-row user-create-task-justify-between' : ''}`}>
              <button
                className="user-create-task-button user-create-task-button-contained"
                onClick={() => setOpenDialog(true)}
                style={{ padding: isMobile ? '10px 14px' : '12px 20px' }}
              >
                <FiPlus size={isMobile ? 16 : 18} />
                {isMobile ? 'Create Task' : 'Create Task'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="user-create-task-paper" style={{ marginBottom: '16px' }}>
        <div className="user-create-task-paper-content">
          <div className="user-create-task-view-toggle">
            <button
              className={`user-create-task-view-toggle-btn ${taskViewMode === 'self' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('self')}
            >
              <FiUser size={16} />
              My Personal Tasks
              {taskViewMode === 'self' && Object.keys(myTasksGrouped).length > 0 && (
                <span className="view-toggle-count">{Object.values(myTasksGrouped).flat().length}</span>
              )}
            </button>
            <button
              className={`user-create-task-view-toggle-btn ${taskViewMode === 'assigned' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('assigned')}
            >
              <FiUsers size={16} />
              Assigned to Me
              {taskViewMode === 'assigned' && Object.keys(assignedToMeTasksGrouped).length > 0 && (
                <span className="view-toggle-count">{Object.values(assignedToMeTasksGrouped).flat().length}</span>
              )}
            </button>
            <button
              className={`user-create-task-view-toggle-btn ${taskViewMode === 'client' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('client')}
            >
              <FiUsers size={16} />
              Client Tasks
              {taskViewMode === 'client' && Object.keys(clientTasksGrouped).length > 0 && (
                <span className="view-toggle-count">{Object.values(clientTasksGrouped).flat().length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="user-create-task-paper">
        <div className="user-create-task-paper-content">
          <div style={{ marginBottom: '16px', fontWeight: 600, fontSize: isMobile ? '16px' : '18px' }}>
            {taskViewMode === 'self' ? 'Personal Task Statistics' : taskViewMode === 'client' ? 'Client Task Statistics' : 'Assigned Task Statistics'}
          </div>
          
          <div className="user-create-task-time-filter">
            <div className="user-create-task-time-filter-header">
              <div>
                <div className="user-create-task-time-filter-title">Filter by Time Period</div>
                <div className="user-create-task-time-filter-subtitle">Select a timeframe to view task statistics</div>
              </div>
              {timeFilter !== 'today' && (
                <button
                  className="user-create-task-button user-create-task-button-text"
                  onClick={() => handleTimeFilterChange('all')}
                >
                  <FiRotateCcw size={14} />
                  {!isMobile && "Reset"}
                </button>
              )}
            </div>

            <div className="user-create-task-time-filter-buttons">
              {[
                { value: "all", label: "All Time", icon: FiGlobe },
                { value: "today", label: "Today", icon: FiSun },
                { value: "yesterday", label: "Yesterday", icon: FiCalendar },
                { value: "this-week", label: "This Week", icon: FiClock },
                { value: "last-week", label: "Last Week", icon: FiCalendar },
                { value: "this-month", label: "This Month", icon: FiCalendar },
                { value: "last-month", label: "Last Month", icon: FiCalendar },
              ].map((period) => {
                const isActive = timeFilter === period.value;
                
                return (
                  <button
                    key={period.value}
                    className={`user-create-task-time-filter-button ${isActive ? 'active' : ''}`}
                    onClick={() => handleTimeFilterChange(period.value)}
                  >
                    {React.createElement(period.icon, { size: isMobile ? 12 : 14 })}
                    {isMobile ? period.label.split(' ')[0] : period.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="user-create-task-grid-container">
            {(() => {
              const statsToShow = taskViewMode === 'self' ? taskStats : taskViewMode === 'client' ? clientTaskStats : assignedTaskStats;
              const statsData = taskViewMode === 'self' 
                ? [
                    { title: 'Total Tasks', value: statsToShow.total, icon: FiList, color: 'primary', description: `All tasks (${timeFilter})`, clickable: false, status: null },
                    { title: 'Completed', value: statsToShow.completed.count, percentage: statsToShow.completed.percentage, icon: FiCheckCircle, color: 'success', description: `${statsToShow.completed.percentage}% of total`, status: 'completed', clickable: true },
                    { title: 'In Progress', value: statsToShow.inProgress.count, percentage: statsToShow.inProgress.percentage, icon: FiTrendingUp, color: 'info', description: `${statsToShow.inProgress.percentage}% of total`, status: 'in-progress', clickable: true },
                    { title: 'Pending', value: statsToShow.pending.count, percentage: statsToShow.pending.percentage, icon: FiClock, color: 'warning', description: `${statsToShow.pending.percentage}% of total`, status: 'pending', clickable: true },
                    { title: 'Overdue', value: statsToShow.overdue.count, percentage: statsToShow.overdue.percentage, icon: FiAlertCircle, color: 'error', description: `${statsToShow.overdue.percentage}% of total`, status: 'overdue', clickable: true }
                  ]
                : [
                    { title: 'Total Tasks', value: statsToShow.total, icon: FiList, color: 'primary', description: `${taskViewMode === 'client' ? 'All client tasks' : 'All assigned tasks'} (${timeFilter})`, clickable: false, status: null },
                    { title: 'Completed', value: statsToShow.completed.count, percentage: statsToShow.completed.percentage, icon: FiCheckCircle, color: 'success', description: `${statsToShow.completed.percentage}% of total`, status: 'completed', clickable: true },
                    { title: 'In Progress', value: statsToShow.inProgress.count, percentage: statsToShow.inProgress.percentage, icon: FiTrendingUp, color: 'info', description: `${statsToShow.inProgress.percentage}% of total`, status: 'in-progress', clickable: true },
                    { title: 'Pending', value: statsToShow.pending.count, percentage: statsToShow.pending.percentage, icon: FiClock, color: 'warning', description: `${statsToShow.pending.percentage}% of total`, status: 'pending', clickable: true },
                    { title: 'Overdue', value: statsToShow.overdue.count, percentage: statsToShow.overdue.percentage, icon: FiAlertCircle, color: 'error', description: `${statsToShow.overdue.percentage}% of total`, status: 'overdue', clickable: true }
                  ];

              return statsData
                .filter(stat => stat.value > 0 || stat.title === 'Total Tasks')
                .map((stat, index) => {
                  const isActive = stat.status === statusFilter;
                  
                  return (
                    <StatCard
                      key={index}
                      color={stat.color}
                      clickable={stat.clickable}
                      active={isActive}
                      onClick={() => stat.clickable && handleStatsCardClick(stat.status)}
                    >
                      <div className="user-create-task-stat-card-content">
                        <div className="user-create-task-stat-card-header">
                          <div>
                            <div className="user-create-task-stat-card-title">{stat.title}</div>
                            <div className="user-create-task-stat-card-value">{stat.value}</div>
                          </div>
                          <div 
                            className="user-create-task-stat-card-icon"
                            style={{
                              backgroundColor: `${getColorValue(stat.color)}15`,
                              color: getColorValue(stat.color)
                            }}
                          >
                            {React.createElement(stat.icon, { size: isMobile ? 16 : 18 })}
                          </div>
                        </div>

                        {stat.percentage !== undefined && (
                          <div className="user-create-task-progress-container">
                            <div className="user-create-task-progress-header">
                              <div className="user-create-task-progress-label">Progress</div>
                              <div className="user-create-task-progress-percentage">{stat.percentage}%</div>
                            </div>
                            <div className="user-create-task-progress-bar">
                              <div 
                                className="user-create-task-progress-fill"
                                style={{
                                  width: `${stat.percentage}%`,
                                  backgroundColor: getColorValue(stat.color)
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="user-create-task-stat-card-description">{stat.description}</div>
                      </div>
                    </StatCard>
                  );
                });
            })()}
          </div>

          {(statusFilter || timeFilter !== 'all' || showOverdueOnly) && (
            <div className="user-create-task-alert info" style={{ marginTop: '16px', padding: isMobile ? '12px' : '16px' }}>
              <div style={{ fontSize: isMobile ? '13px' : '14px' }}>
                Active Filters:
                {statusFilter && (
                  <div className="user-create-task-status-chip" style={{ display: 'inline-flex', margin: '0 4px', padding: '2px 8px' }}>
                    {statusFilter.replace('-', ' ')}
                    <button
                      onClick={() => setStatusFilter('')}
                      style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {timeFilter !== 'all' && (
                  <div className="user-create-task-priority-chip" style={{ display: 'inline-flex', margin: '0 4px', padding: '2px 8px' }}>
                    Time: {timeFilter}
                    <button
                      onClick={() => setTimeFilter('all')}
                      style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {showOverdueOnly && (
                  <div className="user-create-task-priority-chip" style={{ 
                    display: 'inline-flex', 
                    margin: '0 4px', 
                    padding: '2px 8px',
                    backgroundColor: '#f44336',
                    color: 'white'
                  }}>
                    Overdue Only
                    <button
                      onClick={() => setShowOverdueOnly(false)}
                      style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overdue Tasks Section */}
      {getOverdueCount > 0 && (
        <div className="user-create-task-paper" style={{ 
          marginTop: '16px',
          borderLeft: '4px solid #f44336'
        }}>
          <div style={{ 
            padding: isMobile ? '12px 16px' : '16px 24px', 
            borderBottom: '1px solid #ffcdd2',
            backgroundColor: '#fff5f5'
          }}>
            <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1.5">
              <FiAlertTriangle size={isMobile ? 18 : 20} color="#f44336" />
              <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: '#f44336' }}>
                ⚠️ Overdue Tasks ({getOverdueCount})
              </div>
            </div>
            <div style={{ fontSize: isMobile ? '13px' : '14px', color: '#d32f2f', marginTop: '4px' }}>
              Tasks past their due date requiring immediate attention
            </div>
          </div>

          <div className="user-create-task-paper-content">
            {Object.keys(taskViewMode === 'self' ? myTasksGrouped : taskViewMode === 'client' ? clientTasksGrouped : assignedToMeTasksGrouped).map(dateKey => {
              const tasksToCheck = taskViewMode === 'self' ? myTasksGrouped : taskViewMode === 'client' ? clientTasksGrouped : assignedToMeTasksGrouped;
              
              const overdueTasksForDate = tasksToCheck[dateKey]?.filter(task => {
                if (taskViewMode === 'self') {
                  const myStatus = getUserStatusForTask(task, userId);
                  return isOverdue(task.dueDateTime, myStatus);
                } else {
                  const status = getAssignedTaskStatus(task);
                  const dueDate = task.dueDate || task.dueDateTime;
                  return isOverdue(dueDate, status);
                }
              }) || [];

              if (overdueTasksForDate.length === 0) return null;

              return (
                <div key={dateKey} style={{ marginTop: '16px' }}>
                  <div style={{ 
                    padding: isMobile ? '10px 12px' : '12px 16px',
                    backgroundColor: '#ffebee',
                    borderRadius: '4px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    color: '#c62828'
                  }}>
                    📅 {dateKey} - {overdueTasksForDate.length} overdue task(s)
                  </div>
                  <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-2" style={{ marginTop: '8px' }}>
                    {overdueTasksForDate.map(task => {
                      const status = taskViewMode === 'self' 
                        ? getUserStatusForTask(task, userId)
                        : getAssignedTaskStatus(task);
                      
                      const dueDate = taskViewMode === 'self' 
                        ? task.dueDateTime 
                        : (task.dueDate || task.dueDateTime);
                      
                      return (
                        <div 
                          key={task._id} 
                          className="user-create-task-overdue-item"
                          style={{
                            borderLeft: '3px solid #f44336',
                            backgroundColor: '#fff5f5',
                            padding: isMobile ? '12px' : '16px',
                            borderRadius: '4px'
                          }}
                        >
                          <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-start">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: isMobile ? '14px' : '15px', color: '#333' }}>
                                {task.title || task.name}
                              </div>
                              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#666', marginTop: '4px' }}>
                                {(task.description || '').length > 80 
                                  ? (task.description || '').substring(0, 80) + '...' 
                                  : task.description || ''}
                              </div>
                              {taskViewMode === 'client' && getClientNameFromTask(task) !== 'N/A' && (
                                <div style={{ 
                                  fontSize: isMobile ? '11px' : '12px', 
                                  color: '#1976d2', 
                                  marginTop: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <FiUsers size={10} />
                                  Client: {getClientNameFromTask(task)}
                                </div>
                              )}
                            </div>
                            <div className="user-create-task-flex user-create-task-gap-1">
                              <button
                                className="user-create-task-button user-create-task-button-contained"
                                onClick={() => {
                                  if (taskViewMode === 'self') {
                                    handleStatusChange(task._id, 'in-progress', 'Working on overdue task');
                                  } else if (taskViewMode === 'client') {
                                    handleClientTaskStatusChange(task._id, 'in-progress', 'Working on overdue task');
                                  } else {
                                    handleAssignedTaskStatusChange(task._id, 'in-progress', 'Working on overdue task');
                                  }
                                }}
                                style={{
                                  padding: isMobile ? '6px 8px' : '8px 12px',
                                  backgroundColor: '#1976d2',
                                  fontSize: isMobile ? '11px' : '12px'
                                }}
                              >
                                Start
                              </button>
                              <button
                                className="user-create-task-button user-create-task-button-outlined"
                                onClick={() => markTaskAsOverdue(task._id, 'Manual overdue marking')}
                                style={{
                                  padding: isMobile ? '6px 8px' : '8px 12px',
                                  borderColor: '#f44336',
                                  color: '#f44336',
                                  fontSize: isMobile ? '11px' : '12px'
                                }}
                              >
                                Mark
                              </button>
                            </div>
                          </div>
                          <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-center" style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                              Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'No date'}
                            </div>
                            <StatusChip status={status} label={status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="user-create-task-paper">
        <div style={{ 
          padding: isMobile ? '12px 16px' : '16px 24px', 
          borderBottom: '1px solid #e0e0e0' 
        }}>
          <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-2">
            <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1.5">
              {taskViewMode === 'self' ? <FiUser size={isMobile ? 18 : 20} /> : <FiUsers size={isMobile ? 18 : 20} />}
              <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700 }}>
                {taskViewMode === 'self' ? 'My Personal Tasks' : taskViewMode === 'client' ? 'Client Tasks' : 'Tasks Assigned to Me'}
              </div>
              {getOverdueCount > 0 && (
                <div style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {getOverdueCount} Overdue
                </div>
              )}
            </div>
            
            <div className={`user-create-task-flex ${isMobile ? 'user-create-task-flex-column user-create-task-gap-2' : 'user-create-task-justify-between user-create-task-align-center'}`}>
              <div className="user-create-task-flex user-create-task-gap-1.5 user-create-task-align-center user-create-task-flex-wrap">
                <button
                  className="user-create-task-button user-create-task-button-outlined"
                  onClick={() => setCalendarFilterOpen(true)}
                  style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
                >
                  <FiCalendar size={isMobile ? 14 : 16} />
                  {getDateFilterSummary() || 'Date Filter'}
                </button>

                <select
                  className="user-create-task-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ minWidth: isMobile ? '100px' : '120px' }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  {taskViewMode === 'self' && (
                    <>
                      <option value="rejected">Rejected</option>
                      <option value="onhold">On Hold</option>
                      <option value="reopen">Reopen</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>

                <button
                  className={`user-create-task-button ${showOverdueOnly ? 'user-create-task-button-contained' : 'user-create-task-button-outlined'}`}
                  onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    backgroundColor: showOverdueOnly ? '#f44336' : undefined,
                    borderColor: showOverdueOnly ? '#f44336' : undefined,
                    color: showOverdueOnly ? 'white' : undefined
                  }}
                >
                  <FiAlertTriangle size={isMobile ? 12 : 14} />
                  {isMobile ? 'Overdue' : 'Overdue Only'}
                </button>

                <button
                  className="user-create-task-action-button"
                  onClick={taskViewMode === 'self' ? fetchMyTasks : taskViewMode === 'client' ? fetchClientTasks : fetchAssignedToMeTasks}
                >
                  <FiRefreshCw size={isMobile ? 14 : 16} />
                </button>
              </div>

              {(statusFilter || selectedDate || dateRange.start || dateRange.end || showOverdueOnly) && (
                <button
                  className="user-create-task-button user-create-task-button-outlined"
                  onClick={clearAllFilters}
                  style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
                >
                  <FiRotateCcw size={isMobile ? 12 : 14} />
                  {isMobile ? 'Clear All' : 'Clear All Filters'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="user-create-task-paper-content">
          {((taskViewMode === 'self' && loading) || (taskViewMode === 'assigned' && loadingAssigned) || (taskViewMode === 'client' && loadingClientTasks)) ? (
            <div className="user-create-task-loading">
              <div className="spinner"></div>
              <p>Loading {taskViewMode === 'self' ? 'personal' : taskViewMode === 'client' ? 'client' : 'assigned'} tasks...</p>
            </div>
          ) : (
            (() => {
              let tasksToDisplay = taskViewMode === 'self' ? myTasksGrouped : taskViewMode === 'client' ? clientTasksGrouped : assignedToMeTasksGrouped;
              
              if (showOverdueOnly) {
                const filtered = {};
                Object.entries(tasksToDisplay).forEach(([dateKey, tasks]) => {
                  const overdueTasks = tasks.filter(task => {
                    if (taskViewMode === 'self') {
                      const myStatus = getUserStatusForTask(task, userId);
                      return isOverdue(task.dueDateTime, myStatus);
                    } else {
                      const status = getAssignedTaskStatus(task);
                      const dueDate = task.dueDate || task.dueDateTime;
                      return isOverdue(dueDate, status);
                    }
                  });
                  if (overdueTasks.length > 0) {
                    filtered[dateKey] = overdueTasks;
                  }
                });
                tasksToDisplay = filtered;
              }
              
              tasksToDisplay = applyDateFilter(tasksToDisplay);
              
              const hasData = tasksToDisplay && Object.keys(tasksToDisplay).length > 0;
              
              if (!hasData) {
                return (
                  <div className="user-create-task-empty-state">
                    <div className="user-create-task-empty-state-icon">
                      {taskViewMode === 'self' ? <FiUser size={48} /> : <FiUsers size={48} />}
                    </div>
                    <div className="user-create-task-empty-state-title">
                      {taskViewMode === 'self' 
                        ? 'No personal tasks found' 
                        : showOverdueOnly 
                          ? 'No overdue tasks found'
                          : taskViewMode === 'client'
                            ? 'No client tasks found'
                            : 'No tasks assigned to you'}
                    </div>
                    <div className="user-create-task-empty-state-subtitle">
                      {taskViewMode === 'self'
                        ? 'Create a personal task to get started'
                        : showOverdueOnly
                          ? 'Great job! You have no overdue tasks.'
                          : taskViewMode === 'client'
                            ? 'You have no tasks assigned from clients'
                            : 'You have no assigned tasks right now'}
                    </div>
                  </div>
                );
              }

              // Mobile view
              if (isMobile) {
                return Object.entries(tasksToDisplay).map(([dateKey, tasks]) => (
                  <div key={dateKey} style={{ marginTop: '16px' }}>
                    <div style={{ 
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      📅 {dateKey} ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
                    </div>
                    <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-2">
                      {tasks.map((task) => {
                        const status = taskViewMode === 'self'
                          ? getUserStatusForTask(task, userId)
                          : getAssignedTaskStatus(task);
                        
                        const dueDate = taskViewMode === 'self'
                          ? task.dueDateTime
                          : (task.dueDate || task.dueDateTime);
                        
                        const taskIsOverdue = isOverdue(dueDate, status);
                        const priority = task.priority || 'medium';
                        const clientName = getClientNameFromTask(task);

                        return (
                          <div 
                            key={task._id} 
                            className={`user-create-task-mobile-card ${taskIsOverdue ? 'overdue-task' : ''}`}
                            style={taskIsOverdue ? { 
                              borderLeft: '4px solid #f44336',
                              backgroundColor: '#fff5f5'
                            } : {}}
                          >
                            <div className="user-create-task-mobile-card-content">
                              <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-2">
                                <div className="user-create-task-mobile-card-header">
                                  <div style={{ flex: 1 }}>
                                    <div className="user-create-task-mobile-card-title">
                                      {task.title || task.name || 'Untitled'}
                                    </div>
                                    <div className="user-create-task-mobile-card-description">
                                      {task.description || ''}
                                    </div>
                                    {taskViewMode === 'client' && clientName !== 'N/A' && (
                                      <div className="user-create-task-mobile-card-client" style={{ 
                                        fontSize: '12px', 
                                        color: '#1976d2', 
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        <FiUsers size={10} />
                                        Client: {clientName}
                                      </div>
                                    )}
                                  </div>
                                  <StatusChip status={status} label={status} />
                                </div>

                                <div className="user-create-task-mobile-card-details">
                                  <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1">
                                    <FiCalendar size={12} />
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: taskIsOverdue ? '#f44336' : '#333',
                                      fontWeight: taskIsOverdue ? '600' : '400'
                                    }}>
                                      {dueDate ? new Date(dueDate).toLocaleDateString() : 'No date'}
                                    </div>
                                    {taskIsOverdue && (
                                      <div 
                                        style={{
                                          backgroundColor: '#f44336',
                                          color: 'white',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '10px',
                                          fontWeight: '600',
                                          marginLeft: '4px'
                                        }}
                                      >
                                        OVERDUE
                                      </div>
                                    )}
                                  </div>
                                  <PriorityChip priority={priority} />
                                </div>

                                <div className="user-create-task-mobile-card-actions">
                                  <div className="user-create-task-flex user-create-task-gap-1">
                                    <button 
                                      className="user-create-task-action-button"
                                      onClick={() => fetchTaskRemarks(task._id)}
                                      title="View Remarks"
                                    >
                                      <FiMessageSquare size={14} />
                                    </button>

                                    <button 
                                      className="user-create-task-action-button"
                                      onClick={() => fetchActivityLogs(task._id)}
                                      title="Activity Logs"
                                    >
                                      <FiActivity size={14} />
                                    </button>

                                    {task.files?.length > 0 && (
                                      <a
                                        className="user-create-task-action-button"
                                        href={getImageUrl(task.files[0].path || task.files[0])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Download Files"
                                      >
                                        <FiDownload size={14} />
                                      </a>
                                    )}
                                  </div>
                                  <div style={{ minWidth: '90px' }}>
                                    <select
                                      value={status}
                                      onChange={(e) => {
                                        const selectedStatus = e.target.value;
                                        const currentTaskId = task._id;
                                        
                                        if (selectedStatus === 'in-progress') {
                                          // Direct status update (NO POPUP)
                                          if (taskViewMode === 'self') {
                                            handleStatusChange(currentTaskId, 'in-progress', 'Started working');
                                          } else if (taskViewMode === 'client') {
                                            handleClientTaskStatusChange(currentTaskId, 'in-progress', 'Started working');
                                          } else {
                                            handleAssignedTaskStatusChange(currentTaskId, 'in-progress', 'Started working');
                                          }
                                        } else {
                                          // Other statuses will open popup
                                          setPendingStatusChange({ taskId: currentTaskId, status: selectedStatus });
                                          setRemarksDialog({ open: true, taskId: currentTaskId, remarks: [] });
                                        }
                                      }}
                                      className="user-create-task-select"
                                      style={{ 
                                        minWidth: '90px',
                                        borderColor: taskIsOverdue ? '#f44336' : undefined,
                                        color: taskIsOverdue ? '#f44336' : undefined,
                                        fontWeight: taskIsOverdue ? '600' : undefined
                                      }}
                                    >
                                      {taskViewMode !== 'self' ? (
                                        <>
                                          <option value="pending">Pending</option>
                                          <option value="in-progress">In Progress</option>
                                          <option value="completed">Completed</option>
                                          <option value="overdue">Overdue</option>
                                        </>
                                      ) : (
                                        <>
                                          <option value="pending">Pending</option>
                                          <option value="in-progress">In Progress</option>
                                          <option value="completed">Completed</option>
                                          <option value="overdue">Overdue</option>
                                          <option value="rejected">Rejected</option>
                                          <option value="onhold">On Hold</option>
                                          <option value="reopen">Reopen</option>
                                          <option value="cancelled">Cancelled</option>
                                        </>
                                      )}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              }
              
              // Desktop view
              return Object.entries(tasksToDisplay).map(([dateKey, tasks]) => (
                <div key={dateKey} style={{ marginTop: '24px' }}>
                  <div style={{ 
                    padding: isMobile ? '12px' : '16px',
                    borderRadius: isMobile ? '6px' : '8px',
                    backgroundColor: '#f5f5f5',
                    marginBottom: '16px',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold'
                  }}>
                    📅 {dateKey} ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
                  </div>
                  <div className="user-create-task-table-container">
                    <table className="user-create-task-table">
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: isMobile ? '8px' : '12px' }}>Title</th>
                          {!isMobile && <th style={{ padding: isMobile ? '8px' : '12px' }}>Description</th>}
                          <th style={{ padding: isMobile ? '8px' : '12px' }}>Due Date</th>
                          <th style={{ padding: isMobile ? '8px' : '12px' }}>Priority</th>
                          <th style={{ padding: isMobile ? '8px' : '12px' }}>Status</th>
                          {taskViewMode === 'client' && <th style={{ padding: isMobile ? '8px' : '12px' }}>Client</th>}
                          <th style={{ padding: isMobile ? '8px' : '12px' }}>Files</th>
                          <th style={{ padding: isMobile ? '8px' : '12px' }}>Actions</th>
                          <th style={{ padding: isMobile ? '8px' : '12px' }}>Change Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => {
                          const status = taskViewMode === 'self'
                            ? getUserStatusForTask(task, userId)
                            : getAssignedTaskStatus(task);
                          
                          const dueDate = taskViewMode === 'self'
                            ? task.dueDateTime
                            : (task.dueDate || task.dueDateTime);
                          
                          const taskIsOverdue = isOverdue(dueDate, status);
                          const priority = task.priority || 'medium';
                          const clientName = getClientNameFromTask(task);

                          return (
                            <tr 
                              key={task._id} 
                              className={`user-create-task-table-row ${taskIsOverdue ? 'overdue-task' : ''}`}
                              style={taskIsOverdue ? { 
                                borderLeft: '4px solid #f44336',
                                backgroundColor: '#fff5f5'
                              } : {}}
                            >
                              <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                <div style={{ fontWeight: 600, fontSize: isMobile ? '13px' : '14px' }}>
                                  {task.title || task.name || 'Untitled'}
                                </div>
                                {isMobile && (
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    {(task.description || '').length > 50 
                                      ? (task.description || '').substring(0, 50) + '...' 
                                      : task.description || ''}
                                  </div>
                                )}
                              </td>
                              {!isMobile && (
                                <td style={{ padding: '12px', maxWidth: '200px' }}>
                                  <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {task.description || task.name || '-'}
                                  </div>
                                </td>
                              )}
                              <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1">
                                  <FiCalendar size={isMobile ? 12 : 14} />
                                  <div style={{
                                    fontSize: isMobile ? '13px' : '14px',
                                    color: taskIsOverdue ? '#f44336' : '#333',
                                    fontWeight: taskIsOverdue ? '600' : '500'
                                  }}>
                                    {dueDate
                                      ? new Date(dueDate).toLocaleDateString()
                                      : '—'}
                                  </div>
                                  {taskIsOverdue && (
                                    <div 
                                      className="user-create-task-overdue-badge"
                                      style={{
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                      }}
                                    >
                                      OVERDUE
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                <PriorityChip priority={priority} />
                              </td>
                              <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                <StatusChip status={status} label={status} />
                              </td>
                              
                              {taskViewMode === 'client' && (
                                <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    color: '#1976d2'
                                  }}>
                                    <FiUsers size={12} />
                                    {clientName}
                                  </div>
                                </td>
                              )}
                              
                              <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                {task.files?.length > 0 && (
                                  <a
                                    className="user-create-task-action-button"
                                    href={getImageUrl(task.files[0].path || task.files[0])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`${task.files.length} file(s)`}
                                  >
                                    <FiDownload size={isMobile ? 14 : 16} />
                                  </a>
                                )}
                              </td>

                              <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                <div className="user-create-task-action-buttons">
                                  <button 
                                    className="user-create-task-action-button"
                                    onClick={() => fetchTaskRemarks(task._id)}
                                    title="View Remarks"
                                  >
                                    <FiMessageSquare size={isMobile ? 14 : 16} />
                                  </button>

                                  <button 
                                    className="user-create-task-action-button"
                                    onClick={() => fetchActivityLogs(task._id)}
                                    title="Activity Logs"
                                  >
                                    <FiActivity size={isMobile ? 14 : 16} />
                                  </button>

                                  {task.files?.length > 0 && (
                                    <a
                                      className="user-create-task-action-button"
                                      href={getImageUrl(task.files[0].path || task.files[0])}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Download Files"
                                    >
                                      <FiDownload size={isMobile ? 14 : 16} />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: isMobile ? '8px' : '12px' }}>
                                <select
                                  value={status}
                                  onChange={(e) => {
                                    const selectedStatus = e.target.value;
                                    const currentTaskId = task._id;
                                    
                                    if (selectedStatus === 'completed' || selectedStatus === 'pending') {
                                      // Open remarks dialog for status change
                                      setPendingStatusChange({ taskId: currentTaskId, status: selectedStatus });
                                      setRemarksDialog({ open: true, taskId: currentTaskId, remarks: [] });
                                    } 
                                    else if (selectedStatus === 'in-progress') {
                                      // Direct status update for in-progress (no popup needed)
                                      if (taskViewMode === 'self') {
                                        handleStatusChange(currentTaskId, 'in-progress', 'Started working on task');
                                      } else if (taskViewMode === 'client') {
                                        handleClientTaskStatusChange(currentTaskId, 'in-progress', 'Started working on task');
                                      } else {
                                        handleAssignedTaskStatusChange(currentTaskId, 'in-progress', 'Started working on task');
                                      }
                                    }
                                    else {
                                      // For other statuses (overdue, rejected, onhold, reopen, cancelled)
                                      // Open remarks dialog with pending status change
                                      setPendingStatusChange({ taskId: currentTaskId, status: selectedStatus });
                                      setRemarksDialog({ open: true, taskId: currentTaskId, remarks: [] });
                                    }
                                  }}
                                  className="user-create-task-select"
                                  style={{ 
                                    minWidth: isMobile ? '90px' : '100px',
                                    borderColor: taskIsOverdue ? '#f44336' : undefined,
                                    color: taskIsOverdue ? '#f44336' : undefined,
                                    fontWeight: taskIsOverdue ? '600' : undefined
                                  }}
                                >
                                  {taskViewMode !== 'self' ? (
                                    <>
                                      <option value="pending">Pending</option>
                                      <option value="in-progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                      <option value="overdue">Overdue</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="pending">Pending</option>
                                      <option value="in-progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                      <option value="overdue">Overdue</option>
                                      <option value="rejected">Rejected</option>
                                      <option value="onhold">On Hold</option>
                                      <option value="reopen">Reopen</option>
                                      <option value="cancelled">Cancelled</option>
                                    </>
                                  )}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </div>

      {/* CREATE TASK DIALOG */}
      <div className="user-create-task-dialog-overlay" style={{ display: openDialog ? 'flex' : 'none' }}>
        <div className={`user-create-task-dialog ${isMobile ? 'mobile-dialog' : ''}`} style={{ 
          maxWidth: isMobile ? '95%' : isTablet ? '550px' : '600px',
          width: isMobile ? '95%' : 'auto'
        }}>
          <div className="user-create-task-dialog-title">
            <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-2">
              <FiPlus size={isMobile ? 18 : 24} />
              <div style={{ fontSize: isMobile ? '18px' : '24px' }}>Create Personal Task</div>
            </div>
            <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#666', marginTop: '4px' }}>
              This task will be automatically assigned to you ({userName})
            </div>
          </div>
          
          <div className="user-create-task-dialog-content">
            <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-3">
              <div className="user-create-task-alert info" style={{ padding: isMobile ? '12px' : '16px' }}>
                This task will be automatically assigned to you ({userName})
              </div>

              <div className="user-create-task-form-control">
                <label>Task Title *</label>
                <input
                  type="text"
                  className="user-create-task-input"
                  placeholder="Enter a descriptive task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div className="user-create-task-form-control">
                <label>Description *</label>
                <textarea
                  className="user-create-task-input"
                  rows={isMobile ? 3 : 4}
                  placeholder="Provide detailed description of the task..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div className={`user-create-task-flex ${isMobile ? 'user-create-task-flex-column' : 'user-create-task-gap-2'}`}>
                <div className="user-create-task-form-control" style={{ flex: 1 }}>
                  <label>Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="user-create-task-input"
                    value={newTask.dueDateTime || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      let formattedValue = value;
                      if (value && value.includes('T') && value.split(':').length === 2) {
                        formattedValue = `${value}:00`;
                      }
                      setNewTask({ ...newTask, dueDateTime: formattedValue });
                    }}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="user-create-task-form-control" style={{ flex: 1 }}>
                  <label>Priority</label>
                  <select
                    className="user-create-task-select"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="user-create-task-form-control">
                <label>Priority Days</label>
                <input
                  type="number"
                  className="user-create-task-input"
                  placeholder="Enter priority days"
                  value={newTask.priorityDays}
                  onChange={(e) => setNewTask({ ...newTask, priorityDays: e.target.value })}
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>Attachments (Optional)</div>
                
                <div className={`user-create-task-flex ${isMobile ? 'user-create-task-flex-column user-create-task-gap-2' : 'user-create-task-gap-2'}`}>
                  <button 
                    className="user-create-task-button user-create-task-button-outlined"
                    onClick={() => document.getElementById('file-upload').click()}
                    style={{ flex: 1, padding: isMobile ? '10px' : '12px' }}
                  >
                    <FiFileText />
                    {isMobile ? 'Upload' : 'Upload Files'}
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => setNewTask({ ...newTask, files: e.target.files })}
                    />
                  </button>

                  <button
                    className={`user-create-task-button ${isRecording ? 'user-create-task-button-contained' : 'user-create-task-button-outlined'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{ 
                      flex: 1,
                      padding: isMobile ? '10px' : '12px',
                      backgroundColor: isRecording ? '#f44336' : undefined,
                      borderColor: isRecording ? '#f44336' : undefined
                    }}
                  >
                    <FiMic />
                    {isRecording ? "Stop" : (isMobile ? "Record" : "Record Voice")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="user-create-task-dialog-actions">
            <button
              className="user-create-task-button user-create-task-button-outlined"
              onClick={() => setOpenDialog(false)}
              style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
            >
              Cancel
            </button>

            <button
              className="user-create-task-button user-create-task-button-contained"
              onClick={handleCreateTask}
              disabled={!newTask.title || !newTask.description || !newTask.dueDateTime || isCreatingTask}
              style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
            >
              {isCreatingTask ? (
                'Creating...'
              ) : (
                <>
                  <FiCheck size={isMobile ? 14 : 16} />
                  {isMobile ? 'Create' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CALENDAR FILTER DIALOG */}
      <div className="user-create-task-dialog-overlay" style={{ display: calendarFilterOpen ? 'flex' : 'none' }}>
        <div className={`user-create-task-dialog ${isMobile ? 'mobile-dialog' : ''}`} style={{ 
          maxWidth: isMobile ? '95%' : isTablet ? '450px' : '500px',
          width: isMobile ? '95%' : 'auto'
        }}>
          <div className="user-create-task-dialog-title">
            <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1">
              <FiCalendar />
              <div>Filter by Date</div>
            </div>
          </div>

          <div className="user-create-task-dialog-content">
            <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-3">
              <div className="user-create-task-form-control">
                <label>Filter By</label>
                <select
                  className="user-create-task-select"
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value)}
                >
                  <option value="createdDate">Created Date</option>
                  <option value="dueDate">Due Date</option>
                </select>
              </div>

              <div>
                <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>Select Specific Date</div>
                <input
                  type="date"
                  className="user-create-task-input"
                  value={selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setDateRange({ start: null, end: null });
                  }}
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>Or Select Date Range</div>
                <div className="user-create-task-flex user-create-task-gap-2">
                  <div style={{ flex: 1 }}>
                    <input
                      type="date"
                      className="user-create-task-input"
                      placeholder="Start Date"
                      value={dateRange.start ? new Date(dateRange.start).toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="date"
                      className="user-create-task-input"
                      placeholder="End Date"
                      value={dateRange.end ? new Date(dateRange.end).toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>Quick Filters</div>
                <div className="user-create-task-flex user-create-task-gap-1 user-create-task-flex-wrap">
                  <button
                    className="user-create-task-button user-create-task-button-outlined"
                    onClick={() => {
                      const today = new Date();
                      setSelectedDate(today.toISOString().split('T')[0]);
                      setDateRange({ start: null, end: null });
                    }}
                    style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
                  >
                    Today
                  </button>
                  <button
                    className="user-create-task-button user-create-task-button-outlined"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setSelectedDate(tomorrow.toISOString().split('T')[0]);
                      setDateRange({ start: null, end: null });
                    }}
                    style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
                  >
                    Tomorrow
                  </button>
                  <button
                    className="user-create-task-button user-create-task-button-outlined"
                    onClick={() => {
                      const start = new Date();
                      const end = new Date();
                      end.setDate(end.getDate() + 7);
                      setSelectedDate(null);
                      setDateRange({ 
                        start: start.toISOString().split('T')[0], 
                        end: end.toISOString().split('T')[0] 
                      });
                    }}
                    style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
                  >
                    Next 7 Days
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="user-create-task-dialog-actions">
            <button
              className="user-create-task-button user-create-task-button-outlined"
              onClick={clearDateFilter}
              style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
            >
              Clear Filter
            </button>
            <button
              className="user-create-task-button user-create-task-button-contained"
              onClick={() => setCalendarFilterOpen(false)}
              style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* REMARKS DIALOG */}
      <div className="user-create-task-dialog-overlay" style={{ display: remarksDialog.open ? 'flex' : 'none' }}>
        <div className={`user-create-task-dialog ${isMobile ? 'mobile-dialog' : ''}`} style={{ maxWidth: isMobile ? '95%' : isTablet ? '700px' : '800px', width: isMobile ? '95%' : 'auto' }}>
          <div className="user-create-task-dialog-title">
            <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1">
              <FiMessageSquare />
              <div>Task Remarks</div>
            </div>
          </div>
          
          <div className="user-create-task-dialog-content">
            <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-3">
              {/* Add New Remark Section */}
              <div className="user-create-task-paper">
                <div className="user-create-task-paper-content">
                  <div style={{ marginBottom: isMobile ? '12px' : '16px', fontWeight: 600 }}>Add New Remark</div>
                  
                  <textarea
                    className="user-create-task-input"
                    rows={isMobile ? 2 : 3}
                    placeholder="Enter your remark here..."
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    style={{ marginBottom: isMobile ? '12px' : '16px', width: '100%' }}
                  />

                  {/* Image Upload Section */}
                  <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                    <div style={{ marginBottom: isMobile ? '6px' : '8px', fontWeight: 600 }}>
                      Attach Images (Optional)
                      {taskViewMode === 'client' && (
                        <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#666', marginLeft: '8px' }}>
                          (Multiple images supported)
                        </span>
                      )}
                    </div>
                    
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('remark-image-upload').click()}
                      style={{
                        border: '2px dashed #ccc',
                        borderRadius: isMobile ? '6px' : '8px',
                        padding: isMobile ? '16px' : '24px',
                        textAlign: 'center',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div className="user-create-task-flex user-create-task-flex-column user-create-task-align-center user-create-task-gap-1">
                        <FiImage size={isMobile ? 24 : 32} color="#666" />
                        <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#666' }}>
                          Drag and drop images here, or click to select
                        </div>
                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#999' }}>
                          {taskViewMode === 'client' 
                            ? 'Supports JPG, PNG, GIF (up to 5MB each)'
                            : 'Supports JPG, PNG, GIF (single image)'}
                        </div>
                        <button
                          className="user-create-task-button user-create-task-button-outlined"
                          style={{ marginTop: '8px', padding: isMobile ? '8px 12px' : '10px 16px' }}
                        >
                          <FiCamera />
                          {!isMobile && "Choose Images"}
                        </button>
                      </div>
                      
                      <input
                        id="remark-image-upload"
                        type="file"
                        accept="image/*"
                        multiple={taskViewMode === 'client'}
                        onChange={handleRemarkImageUpload}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {/* Image Previews */}
                    {remarkImages.length > 0 && (
                      <div style={{ marginTop: isMobile ? '12px' : '16px' }}>
                        <div style={{ marginBottom: isMobile ? '6px' : '8px', fontWeight: 600 }}>
                          Selected Images ({remarkImages.length})
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                          gap: isMobile ? '6px' : '8px' 
                        }}>
                          {remarkImages.map((image, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                              <img
                                src={image.preview}
                                alt={`Preview ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: isMobile ? '60px' : '80px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid #eee'
                                }}
                                onClick={() => setZoomImage(image.preview)}
                              />
                              <button
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: isMobile ? '20px' : '24px',
                                  height: isMobile ? '20px' : '24px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: isMobile ? '12px' : '14px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveRemarkImage(index);
                                }}
                              >
                                <FiX size={isMobile ? 12 : 14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remarks History */}
              <div>
                <div style={{ marginBottom: isMobile ? '12px' : '16px', fontWeight: 600 }}>Remarks History</div>
                
                {remarksDialog.remarks.length > 0 ? (
                  <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-2">
                    {remarksDialog.remarks.map((remark, index) => (
                      <div key={index} className="user-create-task-paper">
                        <div className="user-create-task-paper-content">
                          <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-1.5">
                            <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-center user-create-task-gap-1">
                              <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1.5">
                                <div style={{
                                  width: isMobile ? '32px' : '36px',
                                  height: isMobile ? '32px' : '36px',
                                  borderRadius: '50%',
                                  backgroundColor: '#f0f0f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 600,
                                  fontSize: isMobile ? '14px' : '16px'
                                }}>
                                  {remark.userName?.charAt(0)?.toUpperCase() || remark.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>
                                    {remark.userName || remark.user?.name || 'Unknown User'}
                                  </div>
                                  <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                                    {new Date(remark.createdAt).toLocaleDateString()} at {' '}
                                    {new Date(remark.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {remark.text && (
                              <div style={{ 
                                padding: isMobile ? '8px' : '12px',
                                backgroundColor: '#fafafa',
                                borderRadius: '4px',
                                fontSize: isMobile ? '13px' : '14px'
                              }}>
                                {remark.text}
                              </div>
                            )}

                            {/* Handle images array */}
                            {remark.images && remark.images.length > 0 && (
                              <div style={{ marginTop: isMobile ? '6px' : '8px' }}>
                                <div style={{ fontSize: isMobile ? '11px' : '12px', marginBottom: '4px' }}>
                                  Attached Images ({remark.images.length}):
                                </div>
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                                  gap: isMobile ? '6px' : '8px' 
                                }}>
                                  {remark.images.map((image, imgIndex) => {
                                    let imageUrl = '';
                                    if (image.url) {
                                      imageUrl = getImageUrl(image.url);
                                    } else if (image.path) {
                                      imageUrl = getImageUrl(image.path);
                                    } else if (typeof image === 'string') {
                                      imageUrl = getImageUrl(image);
                                    }
                                    
                                    return (
                                      <div 
                                        key={imgIndex}
                                        onClick={() => setZoomImage(imageUrl)}
                                        style={{ cursor: 'pointer', position: 'relative' }}
                                      >
                                        <img
                                          src={imageUrl}
                                          alt={`Remark image ${imgIndex + 1}`}
                                          style={{
                                            width: '100%',
                                            height: '100px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            border: '1px solid #eee'
                                          }}
                                          onError={(e) => {
                                            const filename = imageUrl.split('/').pop();
                                            const baseUrl = API_URL?.replace(/\/api$/, '') || 'http://localhost:3000';
                                            const alternativeUrls = [
                                              `${baseUrl}/uploads/client-remarks/${filename}`,
                                              `${baseUrl}/uploads/remarks/client-remarks/${filename}`,
                                              `${baseUrl}/uploads/${filename}`,
                                              `${baseUrl}/${filename}`
                                            ];
                                            
                                            let currentIndex = 0;
                                            const tryNextUrl = () => {
                                              if (currentIndex < alternativeUrls.length && e.target.src !== alternativeUrls[currentIndex]) {
                                                e.target.src = alternativeUrls[currentIndex];
                                                currentIndex++;
                                              } else {
                                                e.target.style.display = 'none';
                                                const parent = e.target.parentElement;
                                                if (parent && !parent.querySelector('.image-error-fallback')) {
                                                  const fallback = document.createElement('div');
                                                  fallback.className = 'image-error-fallback';
                                                  fallback.style.cssText = `
                                                    width: 100%;
                                                    height: 100px;
                                                    background: #fff3f3;
                                                    border: 1px solid #ffcdd2;
                                                    border-radius: 4px;
                                                    text-align: center;
                                                    color: #d32f2f;
                                                    font-size: 12px;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    flex-direction: column;
                                                    gap: 4px;
                                                  `;
                                                  fallback.innerHTML = `
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                      <circle cx="12" cy="12" r="10"></circle>
                                                      <line x1="12" y1="8" x2="12" y2="12"></line>
                                                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                    </svg>
                                                    <span>Image not available</span>
                                                  `;
                                                  parent.appendChild(fallback);
                                                }
                                              }
                                            };
                                            
                                            tryNextUrl();
                                          }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Handle old format (single image) */}
                            {remark.image && !remark.images && (
                              <div style={{ marginTop: isMobile ? '6px' : '8px' }}>
                                <div style={{ fontSize: isMobile ? '11px' : '12px', marginBottom: '4px' }}>
                                  Attached Image:
                                </div>
                                <div 
                                  onClick={() => setZoomImage(getImageUrl(remark.image))}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <img
                                    src={getImageUrl(remark.image)}
                                    alt="Remark attachment"
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      borderRadius: '4px',
                                      maxHeight: '300px',
                                      objectFit: 'contain',
                                      border: '1px solid #eee'
                                    }}
                                    onError={(e) => {
                                      const filename = remark.image.split('/').pop();
                                      const baseUrl = API_URL?.replace(/\/api$/, '') || 'http://localhost:3000';
                                      const alternativeUrls = [
                                        `${baseUrl}/uploads/client-remarks/${filename}`,
                                        `${baseUrl}/uploads/${filename}`,
                                        `${baseUrl}/${filename}`
                                      ];
                                      
                                      let currentIndex = 0;
                                      const tryNextUrl = () => {
                                        if (currentIndex < alternativeUrls.length && e.target.src !== alternativeUrls[currentIndex]) {
                                          e.target.src = alternativeUrls[currentIndex];
                                          currentIndex++;
                                        } else {
                                          e.target.style.display = 'none';
                                          const parent = e.target.parentElement;
                                          if (parent && !parent.querySelector('.image-error-fallback')) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'image-error-fallback';
                                            fallback.style.cssText = `
                                              padding: 20px;
                                              background: #fff3f3;
                                              border: 1px solid #ffcdd2;
                                              border-radius: 8px;
                                              text-align: center;
                                              color: #d32f2f;
                                              font-size: 14px;
                                              display: flex;
                                              flex-direction: column;
                                              align-items: center;
                                              gap: 8px;
                                            `;
                                            fallback.innerHTML = `
                                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                              </svg>
                                              <span>Image not available</span>
                                            `;
                                            parent.appendChild(fallback);
                                          }
                                        }
                                      };
                                      
                                      tryNextUrl();
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="user-create-task-paper" style={{ textAlign: 'center', padding: isMobile ? '24px' : '32px' }}>
                    <div style={{ marginTop: isMobile ? '12px' : '16px', color: '#666', fontWeight: 600 }}>
                      No remarks yet
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Dialog Actions */}
          <div className="user-create-task-dialog-actions">
            <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-center" style={{ width: '100%' }}>
              <button
                className="user-create-task-button user-create-task-button-contained"
                onClick={handleSaveRemarkWithStatus}
                disabled={isUploadingRemark}
                style={{ 
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  minWidth: isMobile ? '120px' : '160px',
                  marginRight: 'auto'
                }}
              >
                {isUploadingRemark ? (
                  "Uploading..."
                ) : pendingStatusChange.status ? (
                  isMobile ? "Save & Update" : "Save Remark & Update Status"
                ) : (
                  <>
                    <FiMessageSquare />
                    {isMobile ? "Add Remark" : "Add Remark"}
                  </>
                )}
              </button>

              <button
                className="user-create-task-button user-create-task-button-outlined"
                onClick={() => {
                  setRemarksDialog({ open: false, taskId: null, remarks: [] });
                  remarkImages.forEach(image => {
                    if (image.preview) URL.revokeObjectURL(image.preview);
                  });
                  setRemarkImages([]);
                  setNewRemark('');
                  setPendingStatusChange({ taskId: null, status: "" });
                }}
                style={{ 
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  marginLeft: 'auto'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVITY LOGS DIALOG */}
      <div className="user-create-task-dialog-overlay" style={{ display: activityDialog.open ? 'flex' : 'none' }}>
        <div className={`user-create-task-dialog ${isMobile ? 'mobile-dialog' : ''}`} style={{ 
          maxWidth: isMobile ? '95%' : isTablet ? '700px' : '800px',
          width: isMobile ? '95%' : 'auto'
        }}>
          <div className="user-create-task-dialog-title">
            <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1">
              <FiActivity />
              <div>Activity Logs</div>
            </div>
          </div>
          <div className="user-create-task-dialog-content">
            {activityLogs.length > 0 ? (
              <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-1">
                {activityLogs.map((log, index) => (
                  <div key={index} className="user-create-task-paper">
                    <div className="user-create-task-paper-content">
                      <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-1">
                        <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-center user-create-task-gap-1">
                          <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1.5">
                            <div style={{
                              width: isMobile ? '28px' : '32px',
                              height: isMobile ? '28px' : '32px',
                              borderRadius: '50%',
                              backgroundColor: '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: isMobile ? '12px' : '14px'
                            }}>
                              {log.userName?.charAt(0)?.toUpperCase() || log.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: isMobile ? '13px' : '14px' }}>
                                {log.userName || log.user?.name || 'Unknown User'}
                              </div>
                              <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                                {log.action || 'Update'}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                            {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div style={{ fontSize: isMobile ? '13px' : '14px' }}>
                          {log.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#666', textAlign: 'center', padding: isMobile ? '20px' : '24px' }}>
                No activity logs found for this task
              </div>
            )}
          </div>
          
          <div className="user-create-task-dialog-actions">
            <button
              className="user-create-task-button user-create-task-button-outlined"
              onClick={() => setActivityDialog({ open: false, taskId: null })}
              style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* IMAGE ZOOM MODAL */}
      <div className="user-create-task-dialog-overlay" style={{ display: zoomImage ? 'flex' : 'none' }}>
        <div style={{ 
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
        }}>
          <button
            onClick={() => setZoomImage(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '13px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              cursor: 'pointer',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiX size={isMobile ? 16 : 20} />
          </button>
          <img
            src={zoomImage}
            alt="Zoomed view"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '77vh',
              objectFit: 'contain',
            }}
            onError={(e) => {
              console.error('Zoom image failed to load:', e.target.src);
            }}
          />
        </div>
      </div>
    </div>
  );
};
  
export default UserCreateTask;
