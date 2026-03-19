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

  console.log('🔍 Original image path:', imagePath);

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  const baseUrl = API_URL || 'http://localhost:3000';
  const baseUrlWithoutApi = baseUrl.replace(/\/api$/, '');

  let cleanPath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  if (cleanPath.startsWith('uploads/')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('remarks/')) {
    return `${baseUrlWithoutApi}/uploads/${cleanPath}`;
  }
  
  const filename = cleanPath.split('/').pop();
  return `${baseUrlWithoutApi}/uploads/remarks/${filename}`;
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
  const statusLabel = label || status;
  return (
    <div className={`user-create-task-status-chip ${status}`}>
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

  // Self tasks state
  const [myTasksGrouped, setMyTasksGrouped] = useState({});
  
  // Client tasks assigned to me
  const [assignedToMeTasksGrouped, setAssignedToMeTasksGrouped] = useState({});
  
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
    
    if (userStatus) return userStatus.status || 'pending';
    
    const statusInfo = task.statusInfo?.find(s => s.userId === userId);
    if (statusInfo) return statusInfo.status || 'pending';
    
    return 'pending';
  }, []);

  // Get status for assigned tasks
  const getAssignedTaskStatus = useCallback((task) => {
    if (!task) return 'pending';
    
    if (task.completed === true) return 'completed';
    if (task.completed === false) return 'pending';
    if (task.status) return task.status;
    
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

  // Get overdue count
  const getOverdueCount = useMemo(() => {
    const tasksToCheck = taskViewMode === 'self' ? myTasksGrouped : assignedToMeTasksGrouped;
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
          const taskIsOverdue = isOverdue(task.dueDate || task.dueDateTime, status);
          if (taskIsOverdue || status === 'overdue') {
            count++;
          }
        }
      });
    });
    return count;
  }, [myTasksGrouped, assignedToMeTasksGrouped, taskViewMode, userId, getUserStatusForTask, getAssignedTaskStatus, isOverdue]);

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

  // Calculate stats from assigned tasks
  const calculateAssignedStatsFromTasks = useCallback((tasks) => {
    if (!tasks || Object.keys(tasks).length === 0) {
      setAssignedTaskStats({
        total: 0,
        pending: { count: 0, percentage: 0 },
        inProgress: { count: 0, percentage: 0 },
        completed: { count: 0, percentage: 0 },
        overdue: { count: 0, percentage: 0 }
      });
      return;
    }
    
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    Object.values(tasks).forEach(dateTasks => {
      dateTasks.forEach(task => {
        total++;
        
        let status = 'pending';
        if (task.completed === true) {
          status = 'completed';
          completed++;
        } else if (task.status === 'in-progress') {
          status = 'in-progress';
          inProgress++;
        } else {
          status = 'pending';
          pending++;
        }
        
        const dueDate = task.dueDate || task.dueDateTime;
        if (dueDate && !task.completed) {
          if (isOverdue(dueDate, status)) {
            overdue++;
          }
        }
      });
    });

    const calculatePercentage = (count) => total > 0 ? Math.round((count / total) * 100) : 0;

    setAssignedTaskStats({
      total,
      pending: { count: pending, percentage: calculatePercentage(pending) },
      inProgress: { count: inProgress, percentage: calculatePercentage(inProgress) },
      completed: { count: completed, percentage: calculatePercentage(completed) },
      overdue: { count: overdue, percentage: calculatePercentage(overdue) }
    });
  }, [isOverdue]);

  // ===== FIXED: Fetch assigned to me tasks =====
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

      // ✅ CORRECT URL - /api/tasks/assigned-to-me
      const url = `/tasks/assigned-to-me?${params.toString()}`;
      
      console.log('📡 Fetching assigned tasks from:', url);
      console.log('🔑 Using userId for filter:', userId);
      
      const res = await axios.get(url);
      
      console.log('✅ API Response received:', res.status);
      console.log('📦 Response data:', res.data);

      if (res.data && res.data.success) {
        // 🔥 Get grouped tasks from backend
        let tasksFromBackend = res.data.groupedTasks || {};
        
        console.log('📊 Grouped tasks from backend:', tasksFromBackend);
        console.log('📊 Keys in grouped tasks:', Object.keys(tasksFromBackend));
        
        // Count total tasks
        const totalTasks = Object.values(tasksFromBackend).flat().length;
        console.log(`✅ Total tasks received: ${totalTasks}`);
        
        // Log first task if exists
        if (totalTasks > 0) {
          const firstKey = Object.keys(tasksFromBackend)[0];
          console.log('📝 Sample task:', tasksFromBackend[firstKey][0]);
        }

        // 🔥 Update state
        setAssignedToMeTasksGrouped(tasksFromBackend);
        
        // Update stats
        if (res.data.stats) {
          console.log('📊 Using stats from backend:', res.data.stats);
          setAssignedTaskStats(res.data.stats);
        } else {
          calculateAssignedStatsFromTasks(tasksFromBackend);
        }
        
        // Show success message
        if (totalTasks > 0) {
          showSnackbar(`✅ Loaded ${totalTasks} assigned tasks`, 'success');
        } else {
          console.log('ℹ️ No assigned tasks found');
        }
        
      } else {
        console.log('⚠️ API returned success: false or invalid data');
        setAssignedToMeTasksGrouped({});
        calculateAssignedStatsFromTasks({});
      }

    } catch (err) {
      console.error('❌ Error in fetchAssignedToMeTasks:', err);
      
      if (err.response) {
        console.error('❌ Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        
        if (err.response.status === 401) {
          setAuthError(true);
          showSnackbar('Session expired. Please log in again.', 'error');
        } else if (err.response.status === 404) {
          console.warn('⚠️ Assigned tasks API endpoint not found (404)');
          showSnackbar('Assigned tasks feature is not available', 'warning');
        } else {
          showSnackbar(`Failed to load assigned tasks (${err.response.status})`, 'error');
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
  }, [authError, userId, calculateAssignedStatsFromTasks]);

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

  // Manual overdue check
  const manualCheckOverdue = async () => {
    try {
      const res = await axios.get('/task/check-overdue');
      showSnackbar(res.data.message, 'success');
      fetchMyTasks();
      fetchAssignedToMeTasks();
      fetchOverdueTasks();
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
      showSnackbar('Failed to check overdue tasks', 'error');
    }
  };

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
          ? `Filtering ${taskViewMode === 'self' ? 'personal' : 'assigned'} tasks by: ${status.replace('-', ' ')}` 
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
      const res = await axios.get(`/task/${taskId}/remarks`);
      console.log('📥 Remarks data:', res.data);
      
      setRemarksDialog({ 
        open: true, 
        taskId, 
        remarks: res.data.remarks || [] 
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

    remarkImages.forEach(image => URL.revokeObjectURL(image.preview));

    const newImage = {
      file: imageFiles[0],
      preview: URL.createObjectURL(imageFiles[0]),
      name: imageFiles[0].name,
      size: imageFiles[0].size
    };

    setRemarkImages([newImage]);
  };

  // Handle remove remark image
  const handleRemoveRemarkImage = (index) => {
    setRemarkImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
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
      return;
    }
    
    setIsUploadingRemark(true);
    
    try {
      const formData = new FormData();
      formData.append('text', newRemark.trim());

      remarkImages.forEach((image) => {
        console.log('📤 Uploading image:', image.file.name);
        formData.append('image', image.file);
      });

      const response = await axios.post(`/task/${taskId}/remarks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('✅ Remark added response:', response.data);
      
      setNewRemark('');
      
      remarkImages.forEach(image => URL.revokeObjectURL(image.preview));
      setRemarkImages([]);
      
      showSnackbar(
        `Remark added successfully${remarkImages.length > 0 ? ' with image' : ''}`, 
        'success'
      );

      await fetchTaskRemarks(taskId);

    } catch (error) {
      console.error('Error adding remark:', error);
      showSnackbar('Failed to add remark', 'error');
    } finally {
      setIsUploadingRemark(false);
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async (taskId) => {
    try {
      const res = await axios.get(`/task/${taskId}/activity-logs`);
      setActivityLogs(res.data.logs || []);
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
    const tasksToFilter = taskViewMode === 'self' ? myTasksGrouped : assignedToMeTasksGrouped;
    return applyDateFilter(tasksToFilter);
  }, [myTasksGrouped, assignedToMeTasksGrouped, taskViewMode, applyDateFilter]);

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
      await axios.patch(`/tasks/assigned/${taskId}/status`, { 
        status: newStatus,
        completed: newStatus === 'completed',
        remarks: remarks || `Status changed to ${newStatus}`
      });

      fetchAssignedToMeTasks();
      fetchOverdueTasks();
      
      showSnackbar('Task status updated successfully', 'success');

    } catch (err) {
      console.error("Error updating assigned task:", err);
      try {
        await axios.patch(`/task/${taskId}/status`, { 
          status: newStatus, 
          remarks: remarks || `Status changed to ${newStatus}`
        });
        
        fetchAssignedToMeTasks();
        fetchOverdueTasks();
        showSnackbar('Status updated successfully', 'success');
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        showSnackbar('Failed to update task status', 'error');
      }
    }
  };

  // Mark task as overdue
  const markTaskAsOverdue = async (taskId, remarks = '') => {
    if (authError || !userId) {
      showSnackbar('Please log in to mark task as overdue', 'error');
      return;
    }

    try {
      await axios.patch(`/task/${taskId}/overdue`, { 
        remarks: remarks || 'Manually marked as overdue'
      });

      if (taskViewMode === 'self') {
        fetchMyTasks();
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

  // ===== LOAD INITIAL DATA =====
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      console.log('🚀 Loading initial data...');
      
      try {
        // First get user data
        fetchUserData();
        
        // Small delay to ensure user data is set
        setTimeout(() => {
          if (!authError && userId) {
            console.log('👤 User authenticated, fetching tasks...');
            fetchMyTasks();
            fetchAssignedToMeTasks();
            fetchOverdueTasks();
          } else {
            console.log('⚠️ User not authenticated yet, waiting...');
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 2000);
      }
    };
    
    loadData();
  }, []); // Run once on mount

  // Fetch when user ID becomes available
  useEffect(() => {
    if (userId && !authError) {
      console.log('👤 User ID available, fetching assigned tasks...');
      fetchAssignedToMeTasks();
    }
  }, [userId, authError]);

  // Fetch when filters change
  useEffect(() => {
    if (!authError && userId) {
      const timer = setTimeout(() => {
        console.log('🔄 Filters changed, refetching data');
        if (taskViewMode === 'self') {
          fetchMyTasks();
        } else {
          fetchAssignedToMeTasks();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [statusFilter, searchTerm, timeFilter, authError, userId, taskViewMode]);

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

  // ===== RENDER VIEW MODE TOGGLE =====
  const renderViewModeToggle = () => (
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
    </div>
  );

  // ===== RENDER STATISTICS CARDS =====
  const renderStatisticsCards = () => {
    const statsToShow = taskViewMode === 'self' ? taskStats : assignedTaskStats;
    
    const statsData = taskViewMode === 'self' 
      ? [
          { title: 'Total Tasks', value: statsToShow.total, icon: FiList, color: 'primary', description: `All tasks (${timeFilter})`, clickable: false, status: null },
          { title: 'Completed', value: statsToShow.completed.count, percentage: statsToShow.completed.percentage, icon: FiCheckCircle, color: 'success', description: `${statsToShow.completed.percentage}% of total`, status: 'completed', clickable: true },
          { title: 'In Progress', value: statsToShow.inProgress.count, percentage: statsToShow.inProgress.percentage, icon: FiTrendingUp, color: 'info', description: `${statsToShow.inProgress.percentage}% of total`, status: 'in-progress', clickable: true },
          { title: 'Pending', value: statsToShow.pending.count, percentage: statsToShow.pending.percentage, icon: FiClock, color: 'warning', description: `${statsToShow.pending.percentage}% of total`, status: 'pending', clickable: true },
          { title: 'Overdue', value: statsToShow.overdue.count, percentage: statsToShow.overdue.percentage, icon: FiAlertCircle, color: 'error', description: `${statsToShow.overdue.percentage}% of total`, status: 'overdue', clickable: true }
        ]
      : [
          { title: 'Total Tasks', value: statsToShow.total, icon: FiList, color: 'primary', description: `All assigned tasks (${timeFilter})`, clickable: false, status: null },
          { title: 'Completed', value: statsToShow.completed.count, percentage: statsToShow.completed.percentage, icon: FiCheckCircle, color: 'success', description: `${statsToShow.completed.percentage}% of total`, status: 'completed', clickable: true },
          { title: 'In Progress', value: statsToShow.inProgress.count, percentage: statsToShow.inProgress.percentage, icon: FiTrendingUp, color: 'info', description: `${statsToShow.inProgress.percentage}% of total`, status: 'in-progress', clickable: true },
          { title: 'Pending', value: statsToShow.pending.count, percentage: statsToShow.pending.percentage, icon: FiClock, color: 'warning', description: `${statsToShow.pending.percentage}% of total`, status: 'pending', clickable: true },
          { title: 'Overdue', value: statsToShow.overdue.count, percentage: statsToShow.overdue.percentage, icon: FiAlertCircle, color: 'error', description: `${statsToShow.overdue.percentage}% of total`, status: 'overdue', clickable: true }
        ];

    return (
      <div className="user-create-task-grid-container">
        {statsData
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
          })}
      </div>
    );
  };

  // ===== RENDER TIME FILTER =====
  const renderTimeFilter = () => (
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
  );

  // ===== RENDER ACTION BUTTONS =====
  const renderActionButtons = (task, isAssignedTask = false) => {
    const myStatus = isAssignedTask 
      ? getAssignedTaskStatus(task)
      : getUserStatusForTask(task, userId);
    
    const dueDate = isAssignedTask ? (task.dueDate || task.dueDateTime) : task.dueDateTime;
    const taskIsOverdue = isOverdue(dueDate, myStatus);
    
    return (
      <div className="user-create-task-action-buttons">
        {taskIsOverdue && (
          <button 
            className="user-create-task-action-button overdue-mark"
            onClick={() => markTaskAsOverdue(task._id, 'Manual overdue marking')}
            title="Mark as Overdue"
            style={{ backgroundColor: '#f44336', color: 'white' }}
          >
            <FiAlertTriangle size={isMobile ? 14 : 16} />
          </button>
        )}

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
    );
  };

  // ===== RENDER STATUS SELECT =====
  const renderStatusSelect = (task, isAssignedTask = false) => {
    if (isAssignedTask) {
      const status = getAssignedTaskStatus(task);
      const dueDate = task.dueDate || task.dueDateTime;
      const taskIsOverdue = isOverdue(dueDate, status);
      
      return (
        <select
          value={status}
          onChange={(e) => {
            const selectedStatus = e.target.value;
            if (selectedStatus === 'completed' || selectedStatus === 'in-progress' || selectedStatus === 'pending') {
              setPendingStatusChange({ taskId: task._id, status: selectedStatus });
              setRemarksDialog({ open: true, taskId: task._id, remarks: [] });
            } else {
              handleAssignedTaskStatusChange(task._id, selectedStatus);
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
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      );
    } else {
      const myStatus = getUserStatusForTask(task, userId);
      const taskIsOverdue = isOverdue(task.dueDateTime, myStatus);
      
      return (
        <select
          value={myStatus}
          onChange={(e) => {
            const selectedStatus = e.target.value;
            if (["completed", "onhold", "reopen", "cancelled", "rejected", "overdue"].includes(selectedStatus)) {
              setPendingStatusChange({ taskId: task._id, status: selectedStatus });
              setRemarksDialog({ open: true, taskId: task._id, remarks: [] });
            } else {
              handleStatusChange(task._id, selectedStatus);
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
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="rejected">Rejected</option>
          <option value="onhold">On Hold</option>
          <option value="reopen">Reopen</option>
          <option value="cancelled">Cancelled</option>
        </select>
      );
    }
  };

  // ===== RENDER DESKTOP TABLE =====
  const renderDesktopTable = (tasksData, isAssignedView = false) => {
    console.log('🎨 Rendering desktop table with data:', tasksData);
    
    if (!tasksData || Object.keys(tasksData).length === 0) {
      return <div className="user-create-task-empty-state">No tasks to display</div>;
    }
    
    return Object.entries(tasksData).map(([dateKey, tasks]) => (
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
                {isAssignedView && <th style={{ padding: isMobile ? '8px' : '12px' }}>Client</th>}
                <th style={{ padding: isMobile ? '8px' : '12px' }}>Files</th>
                <th style={{ padding: isMobile ? '8px' : '12px' }}>Actions</th>
                <th style={{ padding: isMobile ? '8px' : '12px' }}>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const status = isAssignedView 
                  ? getAssignedTaskStatus(task)
                  : getUserStatusForTask(task, userId);
                
                const dueDate = isAssignedView 
                  ? (task.dueDate || task.dueDateTime)
                  : task.dueDateTime;
                
                const taskIsOverdue = isOverdue(dueDate, status);
                const priority = task.priority || 'medium';

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
                    
                    {isAssignedView && (
                      <td style={{ padding: isMobile ? '8px' : '12px' }}>
                        {task.clientName || task.clientId?.name || 'N/A'}
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
                      {renderActionButtons(task, isAssignedView)}
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '12px' }}>
                      {renderStatusSelect(task, isAssignedView)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  // ===== RENDER MOBILE CARDS =====
  const renderMobileCards = (tasksData, isAssignedView = false) => {
    return Object.entries(tasksData).map(([dateKey, tasks]) => (
      <div key={dateKey} style={{ marginTop: isMobile ? '16px' : '20px' }}>
        <div style={{ 
          padding: isMobile ? '12px' : '16px',
          backgroundColor: '#f5f5f5',
          marginBottom: isMobile ? '8px' : '12px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 'bold'
        }}>
          📅 {dateKey} ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
        </div>
        <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-2">
          {tasks.map((task) => {
            const status = isAssignedView 
              ? getAssignedTaskStatus(task)
              : getUserStatusForTask(task, userId);
            
            const dueDate = isAssignedView 
              ? (task.dueDate || task.dueDateTime)
              : task.dueDateTime;
            
            const taskIsOverdue = isOverdue(dueDate, status);
            const priority = task.priority || 'medium';

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
                        {isAssignedView && task.clientName && (
                          <div className="user-create-task-mobile-card-client" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Client: {task.clientName}
                          </div>
                        )}
                      </div>
                      <StatusChip status={status} label={status} />
                    </div>

                    <div className="user-create-task-mobile-card-details">
                      <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1">
                        <FiCalendar size={isMobile ? 12 : 14} />
                        <div style={{ 
                          fontSize: isMobile ? '13px' : '14px', 
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
                        {renderActionButtons(task, isAssignedView)}
                      </div>
                      <div style={{ minWidth: isMobile ? '90px' : '100px' }}>
                        {renderStatusSelect(task, isAssignedView)}
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
  };

  // ===== RENDER GROUPED TASKS (FIXED) =====
  const renderGroupedTasks = () => {
    console.log('🔍 renderGroupedTasks - Current view:', taskViewMode);
    console.log('📦 myTasksGrouped:', myTasksGrouped);
    console.log('📦 assignedToMeTasksGrouped:', assignedToMeTasksGrouped);
    
    const tasksToDisplay = taskViewMode === 'self' ? myTasksGrouped : assignedToMeTasksGrouped;
    
    console.log('📊 tasksToDisplay keys:', Object.keys(tasksToDisplay));
    console.log('📊 tasksToDisplay has data?', Object.keys(tasksToDisplay).length > 0);
    
    // 🔥 IMPORTANT: Directly check if we have data
    const hasData = tasksToDisplay && Object.keys(tasksToDisplay).length > 0;
    
    if (!hasData) {
      console.log('⚠️ No data to display, showing empty state');
      return (
        <div className="user-create-task-empty-state">
          <div className="user-create-task-empty-state-icon">
            {taskViewMode === 'self' ? <FiUser size={48} /> : <FiUsers size={48} />}
          </div>
          <div className="user-create-task-empty-state-title">
            {taskViewMode === 'self' 
              ? 'No personal tasks found' 
              : 'No tasks assigned to you'}
          </div>
          <div className="user-create-task-empty-state-subtitle">
            {taskViewMode === 'self'
              ? 'Create a personal task to get started'
              : 'You have no tasks assigned from clients'}
          </div>
        </div>
      );
    }

    // 🔥 We have data, render it!
    console.log('✅ Data found, rendering now!');
    return isMobile 
      ? renderMobileCards(tasksToDisplay, taskViewMode === 'assigned') 
      : renderDesktopTable(tasksToDisplay, taskViewMode === 'assigned');
  };

  // ===== RENDER OVERDUE TASKS SECTION =====
  const renderOverdueTasksSection = () => {
    if (getOverdueCount === 0) return null;

    return (
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
          {Object.keys(taskViewMode === 'self' ? myTasksGrouped : assignedToMeTasksGrouped).map(dateKey => {
            const tasksToCheck = taskViewMode === 'self' ? myTasksGrouped : assignedToMeTasksGrouped;
            
            const overdueTasksForDate = tasksToCheck[dateKey].filter(task => {
              if (taskViewMode === 'self') {
                const myStatus = getUserStatusForTask(task, userId);
                return isOverdue(task.dueDateTime, myStatus);
              } else {
                const status = getAssignedTaskStatus(task);
                const dueDate = task.dueDate || task.dueDateTime;
                return isOverdue(dueDate, status);
              }
            });

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
                          </div>
                          <div className="user-create-task-flex user-create-task-gap-1">
                            <button
                              className="user-create-task-button user-create-task-button-contained"
                              onClick={() => {
                                if (taskViewMode === 'self') {
                                  handleStatusChange(task._id, 'in-progress', 'Working on overdue task');
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
    );
  };

  // ===== RENDER REMARKS DIALOG =====
  const renderRemarksDialog = () => (
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
                  <div style={{ marginBottom: isMobile ? '6px' : '8px', fontWeight: 600 }}>Attach Images (Optional)</div>
                  
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
                      onChange={handleRemarkImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Image Previews */}
                  {remarkImages.length > 0 && (
                    <div style={{ marginTop: isMobile ? '12px' : '16px' }}>
                      <div style={{ marginBottom: isMobile ? '6px' : '8px', fontWeight: 600 }}>Selected Image</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: isMobile ? '6px' : '8px' }}>
                        {remarkImages.map((image, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: '100%',
                                height: isMobile ? '60px' : '80px',
                                objectFit: 'cover',
                                borderRadius: '4px'
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
                                {remark.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>
                                  {remark.user?.name || 'Unknown User'}
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

                          {remark.image && (
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
                                    console.error('❌ Image failed to load:', e.target.src);
                                    
                                    const baseUrl = (API_URL || 'http://localhost:3000').replace(/\/api$/, '');
                                    const originalPath = remark.image;
                                    const filename = originalPath.split(/[\\/]/).pop();
                                    
                                    const pathsToTry = [
                                      `${baseUrl}/uploads/remarks/${filename}`,
                                      `${baseUrl}/uploads/${filename}`,
                                      `${baseUrl}/remarks/${filename}`,
                                      `${baseUrl}/api/uploads/remarks/${filename}`,
                                      `${baseUrl}/api/uploads/${filename}`,
                                      `${baseUrl}/api/remarks/${filename}`,
                                    ];
                                    
                                    const uniquePaths = [...new Set(pathsToTry)];
                                    
                                    console.log('🔄 Trying alternative paths:', uniquePaths);
                                    
                                    let triedIndex = 0;
                                    const tryNextPath = () => {
                                      if (triedIndex < uniquePaths.length) {
                                        console.log(`🔄 Trying path ${triedIndex + 1}:`, uniquePaths[triedIndex]);
                                        e.target.src = uniquePaths[triedIndex];
                                        triedIndex++;
                                      } else {
                                        e.target.style.display = 'none';
                                        const parent = e.target.parentElement;
                                        
                                        const existingFallback = parent.querySelector('.image-error-fallback');
                                        if (existingFallback) {
                                          existingFallback.remove();
                                        }
                                        
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
                                    };
                                    
                                    e.target.onerror = tryNextPath;
                                    tryNextPath();
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
              onClick={async () => {
                try {
                  await addRemark(remarksDialog.taskId);

                  if (pendingStatusChange.status) {
                    if (taskViewMode === 'self') {
                      await handleStatusChange(
                        pendingStatusChange.taskId,
                        pendingStatusChange.status,
                        newRemark || "Status changed"
                      );
                    } else {
                      await handleAssignedTaskStatusChange(
                        pendingStatusChange.taskId,
                        pendingStatusChange.status,
                        newRemark || "Status changed"
                      );
                    }
                    setPendingStatusChange({ taskId: null, status: "" });
                  }

                  await fetchTaskRemarks(remarksDialog.taskId);
                  setNewRemark("");
                  
                  if (taskViewMode === 'self') {
                    fetchMyTasks();
                  } else {
                    fetchAssignedToMeTasks();
                  }

                } catch (error) {
                  console.error("Error saving remark:", error);
                }
              }}
              disabled={isUploadingRemark || (!newRemark.trim() && remarkImages.length === 0)}
              style={{ 
                padding: isMobile ? '8px 12px' : '10px 16px',
                minWidth: isMobile ? '120px' : '160px',
                marginRight: 'auto'
              }}
            >
              {isUploadingRemark ? (
                "Uploading..."
              ) : pendingStatusChange.status ? (
                isMobile ? "Save & Update" : "Save Remark "
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
                setRemarkImages([]);
                setNewRemark('');
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
  );

  // ===== RENDER IMAGE ZOOM MODAL =====
  const renderImageZoomModal = () => (
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
  );

  // ===== RENDER ACTIVITY LOGS DIALOG =====
  const renderActivityLogsDialog = () => (
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
                            {log.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: isMobile ? '13px' : '14px' }}>
                              {log.user?.name || 'Unknown User'}
                            </div>
                            <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                              {log.user?.role || 'User'}
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
  );

  // ===== RENDER CALENDAR FILTER DIALOG =====
  const renderCalendarFilterDialog = () => (
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
  );

  // ===== RENDER CREATE TASK DIALOG =====
  const renderCreateTaskDialog = () => (
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
                    console.log('📅 Selected datetime-local value:', value);
                    
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
  );

  // ===== AUTH ERROR SCREEN =====
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

  // ===== MAIN RENDER =====
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
                  {taskViewMode === 'self' ? taskStats.completed.count : assignedTaskStats.completed.count} Completed
                </div>
              </div>

              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#2196f3' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskViewMode === 'self' ? taskStats.inProgress.count : assignedTaskStats.inProgress.count} In Progress
                </div>
              </div>

              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#f44336' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskViewMode === 'self' ? taskStats.overdue.count : assignedTaskStats.overdue.count} Overdue
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
          {renderViewModeToggle()}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="user-create-task-paper">
        <div className="user-create-task-paper-content">
          <div style={{ marginBottom: '16px', fontWeight: 600, fontSize: isMobile ? '16px' : '18px' }}>
            {taskViewMode === 'self' ? 'Personal Task Statistics' : 'Assigned Task Statistics'}
          </div>
          
          {renderTimeFilter()}
          {renderStatisticsCards()}

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
      {renderOverdueTasksSection()}

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
                {taskViewMode === 'self' ? 'My Personal Tasks' : 'Tasks Assigned to Me'}
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
                  onClick={taskViewMode === 'self' ? fetchMyTasks : fetchAssignedToMeTasks}
                >
                  <FiRefreshCw size={isMobile ? 14 : 16} />
                </button>
              </div>

              {/* Clear All Filters button */}
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
          {taskViewMode === 'assigned' && loadingAssigned ? (
            <div className="user-create-task-loading">
              <div className="spinner"></div>
              <p>Loading assigned tasks...</p>
            </div>
          ) : (
            renderGroupedTasks()
          )}
        </div>
      </div>

      {/* DIALOGS */}
      {renderCreateTaskDialog()}
      {renderCalendarFilterDialog()}
      {renderRemarksDialog()}
      {renderActivityLogsDialog()}
      {renderImageZoomModal()}
    </div>
  );
};

export default UserCreateTask;