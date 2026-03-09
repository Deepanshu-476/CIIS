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
import CIISLoader from '../../Loader/CIISLoader'; // ✅ Import CIISLoader

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

const statusColors = {
  pending: 'warning',
  'in-progress': 'info',
  completed: 'success',
  rejected: 'error',
  onhold: 'secondary',
  reopen: 'secondary',
  cancelled: 'grey',
  overdue: 'error',
  approved: 'success'
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
  const [pageLoading, setPageLoading] = useState(true); // ✅ Page loading state
  const [loading, setLoading] = useState(false);

  const [myTasksGrouped, setMyTasksGrouped] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user data
 const fetchUserData = useCallback(() => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setAuthError(true);
      showSnackbar('Please log in to access tasks', 'error');
      setLoading(false);
      return;
    }

    const user = JSON.parse(userStr);
    
    // ✅ FIX: 'role' की जगह 'jobRole' check करें
    // और 'id' की जगह '_id' भी check करें
    const userId = user.id || user._id;
    const userRole = user.role || user.jobRole;  // दोनों check करें
    const userName = user.name;
    
    if (!userId || !userRole || !userName) {
      setAuthError(true);
      showSnackbar('Invalid user data. Please log in again.', 'error');
      setLoading(false);
      return;
    }

    // ✅ State set करें
    setUserRole(userRole);
    setUserId(userId);
    setUserName(userName);
    setAuthError(false);
    
  } catch (error) {
    console.error('Error parsing user data:', error);
    setAuthError(true);
    showSnackbar('Error loading user data. Please log in again.', 'error');
    setLoading(false);
  }
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

  // Get user status for a task
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

  // Check if task is overdue
// 🔴 REPLACE the isOverdue function with this:
const isOverdue = useCallback((dueDateTime, status) => {
  if (!dueDateTime) return false;
  
  // If status is already marked as overdue
  if (status === 'overdue') return true;
  
  const now = new Date();
  const dueDate = new Date(dueDateTime);
  
  // Check if due date has passed
  const isPastDue = dueDate < now;
  
  // Statuses that can be considered for overdue
  const canBeOverdue = ['pending', 'in-progress', 'reopen', 'onhold'];
  
  return isPastDue && canBeOverdue.includes(status);
}, []);

// 🔴 REPLACE the getOverdueCount function with this:
const getOverdueCount = () => {
  let count = 0;
  Object.values(myTasksGrouped).forEach(tasks => {
    tasks.forEach(task => {
      const myStatus = getUserStatusForTask(task, userId);
      const taskIsOverdue = isOverdue(task.dueDateTime, myStatus);
      
      if (taskIsOverdue || myStatus === 'overdue') {
        count++;
      }
    });
  });
  return count;
};

// 🔴 REPLACE the calculateStatsFromTasks function with this:
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

      // Check if task is overdue
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

// 🔴 ADD this new function for manual overdue check:
const manualCheckOverdue = async () => {
  try {
    const res = await axios.get('/task/check-overdue');
    showSnackbar(res.data.message, 'success');
    fetchMyTasks();
    fetchOverdueTasks();
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
    showSnackbar('Failed to check overdue tasks', 'error');
  }
};

  // Fetch user's tasks
  const fetchMyTasks = useCallback(async () => {
    if (authError || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (timeFilter && timeFilter !== 'all') params.append('period', timeFilter);

      const url = `/task/my?${params.toString()}`;
      const res = await axios.get(url);
      const tasks = res.data.groupedTasks || {};
      
      setMyTasksGrouped(tasks);
      calculateStatsFromTasks(tasks);

    } catch (err) {
      console.error('Error fetching tasks:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        showSnackbar('Session expired. Please log in again.', 'error');
      } else {
        showSnackbar('Failed to load tasks', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [authError, userId, statusFilter, searchTerm, timeFilter, calculateStatsFromTasks]);

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

  // Handle stats card click
  const handleStatsCardClick = (status) => {
    if (status) {
      const newStatusFilter = statusFilter === status ? '' : status;
      setStatusFilter(newStatusFilter);
      
      showSnackbar(
        newStatusFilter 
          ? `Filtering tasks by: ${status.replace('-', ' ')}` 
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

    const newImage = {
      file: imageFiles[0],
      preview: URL.createObjectURL(imageFiles[0]),
      name: imageFiles[0].name,
      size: imageFiles[0].size
    };

    remarkImages.forEach(image => URL.revokeObjectURL(image.preview));
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
        formData.append('image', image.file);
      });

      await axios.post(`/task/${taskId}/remarks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setNewRemark('');
      setRemarkImages([]);
      
      
      showSnackbar(
        `Remark added successfully${remarkImages.length > 0 ? ' with image' : ''}`, 
        'success'
      );

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
          taskDate = task.dueDateTime ? new Date(task.dueDateTime) : null;
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
    return applyDateFilter(myTasksGrouped);
  }, [myTasksGrouped, applyDateFilter]);

  // Handle status change
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

      fetchMyTasks();
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

const handleCreateTask = async () => {
  if (authError || !userId) {
    showSnackbar('Please log in to create tasks', 'error');
    return;
  }

  if (!newTask.title || !newTask.description || !newTask.dueDateTime) {
    showSnackbar('Please fill all required fields (Title, Description, Due Date)', 'error');
    return;
  }

  setIsCreatingTask(true);

  try {
    let dueDate;
    
    // Handle date parsing
    if (newTask.dueDateTime instanceof Date) {
      dueDate = newTask.dueDateTime;
    } else if (typeof newTask.dueDateTime === 'string') {
      // Parse the datetime-local input (format: YYYY-MM-DDTHH:mm)
      if (newTask.dueDateTime.includes('T')) {
        // Add seconds if missing
        const dateStr = newTask.dueDateTime.includes(':') && newTask.dueDateTime.split(':').length === 2 
          ? `${newTask.dueDateTime}:00` 
          : newTask.dueDateTime;
        
        dueDate = new Date(dateStr);
      } else {
        dueDate = new Date(newTask.dueDateTime);
      }
    } else {
      showSnackbar('Invalid date format', 'error');
      setIsCreatingTask(false);
      return;
    }

    // Check if date is valid
    if (isNaN(dueDate.getTime())) {
      console.error('Invalid date:', newTask.dueDateTime);
      showSnackbar('Invalid date format. Please select a valid date and time.', 'error');
      setIsCreatingTask(false);
      return;
    }

    // Check if dueDateTime is in the past (with 5 minutes buffer for timezone)
    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5 minutes buffer
    
    if (dueDate < new Date(now.getTime() - buffer)) {
      showSnackbar('Due date cannot be in the past. Please select a future date and time.', 'error');
      setIsCreatingTask(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', newTask.title);
    formData.append('description', newTask.description);
    
    // Send as ISO string
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

    console.log('📤 Creating task with data:', {
      title: newTask.title,
      description: newTask.description,
      dueDateTime: dueDate.toISOString(),
      dueDateTimeLocal: newTask.dueDateTime,
      priority: newTask.priority,
      priorityDays: newTask.priorityDays
    });

    const response = await axios.post('/task/create-self', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    console.log('✅ Task created successfully:', response.data);

    setOpenDialog(false);
    showSnackbar('Task created successfully', 'success');
    
    // Reset form
    setNewTask({
      title: '', 
      description: '', 
      dueDateTime: '',
      priority: 'medium', 
      priorityDays: '1', 
      files: null, 
      voiceNote: null,
    });

    // Refresh tasks
    fetchMyTasks();


  } catch (err) {
    console.error('❌ Full error creating task:', err);
    console.error('❌ Error response:', err.response?.data);
    
    if (err.response?.status === 401) {
      setAuthError(true);
      showSnackbar('Session expired. Please log in again.', 'error');
    } else if (err.response?.status === 400) {
      const errorMsg = err.response?.data?.error || 'Invalid input. Please check your data.';
      showSnackbar(errorMsg, 'error');
    } else {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Task creation failed';
      showSnackbar(errorMsg, 'error');
    }
  } finally {
    setIsCreatingTask(false);
  }
};

// Helper function to format date to required backend format
// You can add this as a standalone function or use useCallback
const formatDateForBackend = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  
  // Format: DD/MM/YYYY
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  // Format: HH:MM AM/PM
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');
  
  // Return format: DD/MM/YYYY, HH:MM AM/PM
  return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
};

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // ✅ Load initial data with page loader
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        fetchUserData();
        if (!authError && userId) {
          await fetchMyTasks();
          await fetchOverdueTasks();
          
        }
      } catch (error) {
        console.error('Error loading task data:', error);
      } finally {
        // Minimum 500ms loader show karega
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  // Fetch tasks on filter change
  useEffect(() => {
    fetchMyTasks();
  }, [statusFilter, searchTerm, timeFilter, fetchMyTasks]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (!authError && userId) {
      fetchMyTasks();
      fetchOverdueTasks();
     
    }
  }, [authError, userId, fetchMyTasks, fetchOverdueTasks]);

  const renderStatisticsCards = () => {
    const statsData = [
      {
        title: 'Total Tasks',
        value: taskStats.total,
        icon: FiList,
        color: 'primary',
        description: `All tasks (${timeFilter})`,
        clickable: false,
        status: null
      },
      {
        title: 'Completed',
        value: taskStats.completed.count,
        percentage: taskStats.completed.percentage,
        icon: FiCheckCircle,
        color: 'success',
        description: `${taskStats.completed.percentage}% of total`,
        status: 'completed',
        clickable: true
      },
      {
        title: 'In Progress',
        value: taskStats.inProgress.count,
        percentage: taskStats.inProgress.percentage,
        icon: FiTrendingUp,
        color: 'info',
        description: `${taskStats.inProgress.percentage}% of total`,
        status: 'in-progress',
        clickable: true
      },
      {
        title: 'Pending',
        value: taskStats.pending.count,
        percentage: taskStats.pending.percentage,
        icon: FiClock,
        color: 'warning',
        description: `${taskStats.pending.percentage}% of total`,
        status: 'pending',
        clickable: true
      },
      {
        title: 'On Hold',
        value: taskStats.onHold.count,
        percentage: taskStats.onHold.percentage,
        icon: FiPause,
        color: 'secondary',
        description: `${taskStats.onHold.percentage}% of total`,
        status: 'onhold',
        clickable: true
      },
      {
        title: 'Cancelled',
        value: taskStats.cancelled.count,
        percentage: taskStats.cancelled.percentage,
        icon: FiSlash,
        color: 'grey',
        description: `${taskStats.cancelled.percentage}% of total`,
        status: 'cancelled',
        clickable: true
      },
      {
        title: 'Overdue',
        value: taskStats.overdue.count,
        percentage: taskStats.overdue.percentage,
        icon: FiAlertCircle,
        color: 'error',
        description: `${taskStats.overdue.percentage}% of total`,
        status: 'overdue',
        clickable: true
      },
      {
        title: 'Rejected',
        value: taskStats.rejected.count,
        percentage: taskStats.rejected.percentage,
        icon: FiXCircle,
        color: 'error',
        description: `${taskStats.rejected.percentage}% of total`,
        status: 'rejected',
        clickable: true
      }
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
                      <div className="user-create-task-stat-card-title">
                        {stat.title}
                      </div>
                      <div className="user-create-task-stat-card-value">
                        {stat.value}
                      </div>
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
                        <div className="user-create-task-progress-label">
                          Progress
                        </div>
                        <div className="user-create-task-progress-percentage">
                          {stat.percentage}%
                        </div>
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

                  <div className="user-create-task-stat-card-description">
                    {stat.description}
                  </div>
                </div>
              </StatCard>
            );
          })}
      </div>
    );
  };

  // Render time filter
  const renderTimeFilter = () => (
    <div className="user-create-task-time-filter">
      <div className="user-create-task-time-filter-header">
        <div>
          <div className="user-create-task-time-filter-title">
            Filter by Time Period
          </div>
          <div className="user-create-task-time-filter-subtitle">
            Select a timeframe to view task statistics
          </div>
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

  // Render action buttons
  const renderActionButtons = (task) => {
    const myStatus = getUserStatusForTask(task, userId);
    const taskIsOverdue = isOverdue(task.dueDateTime, myStatus);
    
    return (
      <div className="user-create-task-action-buttons">
        {taskIsOverdue && (
          <button 
            className="user-create-task-action-button overdue-mark"
            onClick={() => markTaskAsOverdue(task._id, 'Manual overdue marking')}
            title="Mark as Overdue"
            style={{
              backgroundColor: '#f44336',
              color: 'white'
            }}
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
            // eslint-disable-next-line no-undef
            href={`${API_URL || 'http://localhost:3000'||'https://backendcds.ciisnetwork.in'}/${task.files[0].path || task.files[0]}`}
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

  // Render status select
  const renderStatusSelect = (task) => {
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
  };

  // Render remarks dialog
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
                      <FiImage size={isMobile ? 24 : 32} color="#1976d2" />
                      <div style={{ fontSize: isMobile ? '14px' : '16px' }}>Click to upload or drag & drop</div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                        Supports JPG, PNG, GIF
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

                {/* Submit Button - This is now moved to dialog-actions */}
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
                                onClick={() => setZoomImage(`${API_URL || 'http://localhost:3000'||'https://backendcds.ciisnetwork.in'}/${remark.image}`)}
                                style={{ cursor: 'pointer' }}
                              >
                                <img
                                  src={`${API_URL || 'http://localhost:3000'||'https://backendcds.ciisnetwork.in'}/${remark.image}`}
                                  alt="Remark attachment"
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '4px',
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
                  <FiMessageSquare size={isMobile ? 32 : 48} color="#666" />
                  <div style={{ marginTop: isMobile ? '12px' : '16px', color: '#666', fontWeight: 600 }}>
                    No remarks yet
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Updated Dialog Actions - Save button on LEFT, Close button on RIGHT */}
        <div className="user-create-task-dialog-actions">
          <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-center" style={{ width: '100%' }}>
            {/* Save/Add Remark Button - Left side */}
            <button
              className="user-create-task-button user-create-task-button-contained"
              onClick={async () => {
                try {
                  await addRemark(remarksDialog.taskId);

                  if (pendingStatusChange.status) {
                    await handleStatusChange(
                      pendingStatusChange.taskId,
                      pendingStatusChange.status,
                      newRemark || "Status changed"
                    );
                    setPendingStatusChange({ taskId: null, status: "" });
                  }

                  setRemarksDialog({ open: false, taskId: null, remarks: [] });
                  setNewRemark("");
                  setRemarkImages([]);
                  fetchMyTasks();

                } catch (error) {
                  console.error("Error saving remark:", error);
                }
              }}
              disabled={isUploadingRemark || (!newRemark.trim() && remarkImages.length === 0)}
              style={{ 
                padding: isMobile ? '8px 12px' : '10px 16px',
                minWidth: isMobile ? '120px' : '160px',
                marginRight: 'auto' /* Ensures it stays on left */
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

            {/* Close Button - Right side */}
            <button
              className="user-create-task-button user-create-task-button-outlined"
              onClick={() => {
                setRemarksDialog({ open: false, taskId: null, remarks: [] });
                setRemarkImages([]);
                setNewRemark('');
              }}
              style={{ 
                padding: isMobile ? '8px 12px' : '10px 16px',
                marginLeft: 'auto' /* Ensures it stays on right */
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render image zoom modal
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
            right: '16px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            cursor: 'pointer',
            zIndex: 1,
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
            maxHeight: '90vh',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );

  // Render desktop table
  const renderDesktopTable = (tasksData) => {
    return Object.entries(tasksData).map(([dateKey, tasks]) => (
      <div key={dateKey} style={{ marginTop: '24px' }}>
        <div style={{ 
          padding: isMobile ? '12px' : '16px',
          borderRadius: isMobile ? '6px' : '8px',
          backgroundColor: 'white',
          marginBottom: '16px',
          fontSize: isMobile ? '14px' : '16px'
        }}>
          📅 {dateKey}
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
                <th style={{ padding: isMobile ? '8px' : '12px' }}>Files</th>
                <th style={{ padding: isMobile ? '8px' : '12px' }}>Actions</th>
                <th style={{ padding: isMobile ? '8px' : '12px' }}>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const myStatus = getUserStatusForTask(task, userId);
                const taskIsOverdue = isOverdue(task.dueDateTime, myStatus);

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
                        {task.title}
                      </div>
                      {isMobile && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}
                        </div>
                      )}
                    </td>
                    {!isMobile && (
                      <td style={{ padding: '12px', maxWidth: '200px' }}>
                        <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.description}
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
                          {task.dueDateTime
                            ? new Date(task.dueDateTime).toLocaleDateString()
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
                      <PriorityChip priority={task.priority || 'medium'} />
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '12px' }}>
                      <StatusChip status={myStatus} label={myStatus} />
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '12px' }}>
                      {task.files?.length > 0 && (
                        <a
                          className="user-create-task-action-button"
                          href={`${API_URL || 'http://localhost:3000'||'https://backendcds.ciisnetwork.in'}/${task.files[0].path || task.files[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${task.files.length} file(s)`}
                        >
                          <FiDownload size={isMobile ? 14 : 16} />
                        </a>
                      )}
                    </td>

                    <td style={{ padding: isMobile ? '8px' : '12px' }}>
                      {renderActionButtons(task)}
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '12px' }}>
                      {renderStatusSelect(task)}
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

  // Render mobile cards
  const renderMobileCards = (tasksData) => {
    return Object.entries(tasksData).map(([dateKey, tasks]) => (
      <div key={dateKey} style={{ marginTop: isMobile ? '16px' : '20px' }}>
        <div style={{ 
          padding: isMobile ? '12px' : '16px',
          backgroundColor: 'white',
          marginBottom: isMobile ? '8px' : '12px',
          fontSize: isMobile ? '14px' : '16px'
        }}>
          📅 {dateKey}
        </div>
        <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-2">
          {tasks.map((task) => {
            const myStatus = getUserStatusForTask(task, userId);
            const taskIsOverdue = isOverdue(task.dueDateTime, myStatus);

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
                          {task.title}
                        </div>
                        <div className="user-create-task-mobile-card-description">
                          {task.description}
                        </div>
                      </div>
                      <StatusChip status={myStatus} label={myStatus} />
                    </div>

                    <div className="user-create-task-mobile-card-details">
                      <div className="user-create-task-flex user-create-task-align-center user-create-task-gap-1">
                        <FiCalendar size={isMobile ? 12 : 14} />
                        <div style={{ 
                          fontSize: isMobile ? '13px' : '14px', 
                          color: taskIsOverdue ? '#f44336' : '#333',
                          fontWeight: taskIsOverdue ? '600' : '400'
                        }}>
                          {task.dueDateTime ? new Date(task.dueDateTime).toLocaleDateString() : 'No date'}
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
                      <PriorityChip priority={task.priority || 'medium'} />
                    </div>

                    <div className="user-create-task-mobile-card-actions">
                      <div className="user-create-task-flex user-create-task-gap-1">
                        {renderActionButtons(task)}
                      </div>
                      <div style={{ minWidth: isMobile ? '90px' : '100px' }}>
                        {renderStatusSelect(task)}
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

  // Render grouped tasks
  const renderGroupedTasks = () => {
    // If showing overdue only, filter tasks
    let tasksToRender = showOverdueOnly 
      ? Object.entries(myTasksGrouped).reduce((acc, [dateKey, tasks]) => {
          const overdueTasks = tasks.filter(task => {
            const myStatus = getUserStatusForTask(task, userId);
            return isOverdue(task.dueDateTime, myStatus);
          });
          if (overdueTasks.length > 0) {
            acc[dateKey] = overdueTasks;
          }
          return acc;
        }, {})
      : myTasksGrouped;

    // Apply date filter
    tasksToRender = applyDateFilter(tasksToRender);
    
    if (Object.keys(tasksToRender).length === 0) {
      return (
        <div className="user-create-task-empty-state">
          <div className="user-create-task-empty-state-icon">
            <FiCalendar size={isMobile ? 36 : 48} color="#666" />
          </div>

          <div className="user-create-task-empty-state-title">
            {showOverdueOnly ? 'No overdue tasks found' : statusFilter ? `No ${statusFilter} tasks found` : 'No tasks found'}
          </div>

          <div className="user-create-task-empty-state-subtitle">
            {showOverdueOnly
              ? 'Great job! You have no overdue tasks.'
              : statusFilter
              ? 'Try changing your status filter'
              : 'You have no tasks assigned yet'}
          </div>
        </div>
      );
    }

    return isMobile ? renderMobileCards(tasksToRender) : renderDesktopTable(tasksToRender);
  };

  // Render overdue tasks section
  const renderOverdueTasksSection = () => {
    if (getOverdueCount() === 0) return null;

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
              ⚠️ Overdue Tasks ({getOverdueCount()})
            </div>
          </div>
          <div style={{ fontSize: isMobile ? '13px' : '14px', color: '#d32f2f', marginTop: '4px' }}>
            Tasks past their due date requiring immediate attention
          </div>
        </div>

        <div className="user-create-task-paper-content">
          {Object.keys(myTasksGrouped).map(dateKey => {
            const overdueTasksForDate = myTasksGrouped[dateKey].filter(task => {
              const myStatus = getUserStatusForTask(task, userId);
              return isOverdue(task.dueDateTime, myStatus);
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
                    const myStatus = getUserStatusForTask(task, userId);
                    
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
                              {task.title}
                            </div>
                            <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#666', marginTop: '4px' }}>
                              {task.description.length > 80 ? task.description.substring(0, 80) + '...' : task.description}
                            </div>
                          </div>
                          <div className="user-create-task-flex user-create-task-gap-1">
                            <button
                              className="user-create-task-button user-create-task-button-contained"
                              onClick={() => handleStatusChange(task._id, 'in-progress', 'Working on overdue task')}
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
                            Due: {task.dueDateTime ? new Date(task.dueDateTime).toLocaleDateString() : 'No date'}
                          </div>
                          <StatusChip status={myStatus} label={myStatus} />
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

  // Render notifications panel
  // const renderNotificationsPanel = () => (
  //   <div className="user-create-task-dialog-overlay" style={{ display: notificationsOpen ? 'flex' : 'none' }}>
  //     <div className={`user-create-task-dialog ${isMobile ? 'mobile-dialog' : ''}`} style={{ 
  //       width: isMobile ? '90%' : isTablet ? '400px' : '400px',
  //       maxHeight: isMobile ? '80vh' : '70vh'
  //     }}>
  //       {/* <div style={{ 
  //         padding: isMobile ? '12px 16px' : '16px 20px', 
  //         borderBottom: '1px solid #e0e0e0' 
  //       }}>
  //         <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-center">
  //           <div style={{ fontWeight: 600, fontSize: isMobile ? '16px' : '18px' }}>Notifications</div>
  //           <button 
  //             className="user-create-task-button user-create-task-button-text"
  //             onClick={markAllNotificationsAsRead} 
  //             disabled={unreadNotificationCount === 0}
  //             style={{ padding: isMobile ? '6px 8px' : '8px 12px' }}
  //           >
  //             {isMobile ? 'Mark All' : 'Mark all as read'}
  //           </button>
  //         </div>
  //       </div> */}
  //       <div style={{ 
  //         maxHeight: isMobile ? 'calc(80vh - 120px)' : 'calc(70vh - 120px)', 
  //         overflow: 'auto', 
  //         padding: isMobile ? '8px' : '12px' 
  //       }}>
  //         {notifications.length > 0 ? (
  //           <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-1">
  //             {notifications.map((notification) => (
  //               <div 
  //                 key={notification._id} 
  //                 className="user-create-task-paper"
  //                 style={{ 
  //                   backgroundColor: notification.isRead ? '#fafafa' : '#f5f5f5',
  //                   padding: isMobile ? '12px' : '16px'
  //                 }}
  //               >
  //                 <div className="user-create-task-paper-content">
  //                   <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-1">
  //                     <div style={{ fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>
  //                       {notification.title}
  //                     </div>
  //                     <div style={{ fontSize: isMobile ? '13px' : '14px' }}>
  //                       {notification.message}
  //                     </div>
  //                     <div className="user-create-task-flex user-create-task-justify-between user-create-task-align-center">
  //                       <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
  //                         {new Date(notification.createdAt).toLocaleDateString()}
  //                       </div>
  //                       {/* {!notification.isRead && (
  //                         <button 
  //                           className="user-create-task-button user-create-task-button-text"
  //                           onClick={() => markNotificationAsRead(notification._id)}
  //                           style={{ padding: isMobile ? '4px 6px' : '6px 8px' }}
  //                         >
  //                           {isMobile ? 'Read' : 'Mark read'}
  //                         </button>
  //                       )} */}
  //                     </div>
  //                   </div>
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         ) : (
  //           <div style={{ textAlign: 'center', padding: isMobile ? '24px' : '32px' }}>
  //             <FiBell size={isMobile ? 24 : 32} color="#666" />
  //             <div style={{ marginTop: isMobile ? '8px' : '12px', color: '#666', fontSize: isMobile ? '14px' : '16px' }}>
  //               No notifications
  //             </div>
  //           </div>
  //         )}
  //       </div>
        
  //       <div className="user-create-task-dialog-actions">
  //         <button
  //           className="user-create-task-button user-create-task-button-outlined"
  //           onClick={() => setNotificationsOpen(false)}
  //           style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
  //         >
  //           Close
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );

  // Render activity logs dialog
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

  // Render calendar filter dialog
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

  // Render create task dialog
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
    
    // Ensure proper format
    let formattedValue = value;
    if (value && value.includes('T') && value.split(':').length === 2) {
      // Add seconds if missing
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
    };
  }, []);

  // Fetch tasks on filter change
  useEffect(() => {
    fetchMyTasks();
  }, [statusFilter, searchTerm, timeFilter, fetchMyTasks]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (!authError && userId) {
      fetchMyTasks();
      fetchOverdueTasks();
      
    }
  }, [authError, userId, fetchMyTasks, fetchOverdueTasks]);

  // Auth error screen
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

  // ✅ Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  // Main render
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
              My Task Management
            </div>

            <div className="user-create-task-subtitle" style={{ fontSize: isMobile ? '14px' : '16px' }}>
              Manage and track your personal tasks efficiently
            </div>

            <div className="user-create-task-stats-indicators">
              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#4caf50' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskStats.completed.count} Completed
                </div>
              </div>

              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#2196f3' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskStats.inProgress.count} In Progress
                </div>
              </div>

              <div className="user-create-task-stat-indicator">
                <div className="user-create-task-stat-dot" style={{ backgroundColor: '#f44336' }}></div>
                <div className="user-create-task-stat-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {taskStats.overdue.count} Overdue
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Notification + Create Task */}
          <div className={`user-create-task-header-actions ${isMobile ? 'user-create-task-flex-row user-create-task-justify-between' : ''}`}>
            {/* <button
              className="user-create-task-action-button"
              onClick={() => setNotificationsOpen(true)}
              style={{ position: 'relative' }}
            >
              <FiBell size={isMobile ? 18 : 20} />
              {unreadNotificationCount > 0 && (
                <span className="user-create-task-notification-badge">
                  {unreadNotificationCount}
                </span>
              )}
            </button> */}

            <button
              className="user-create-task-button user-create-task-button-contained"
              onClick={() => setOpenDialog(true)}
              style={{ padding: isMobile ? '10px 14px' : '12px 20px' }}
            >
              <FiPlus size={isMobile ? 16 : 18} />
              {isMobile ? 'Create Task' : 'Create Task'}
            </button>
          </div>

        </div>
      </div>

      {/* Statistics Section */}
      <div className="user-create-task-paper">
        <div className="user-create-task-paper-content">
          <div style={{ marginBottom: '16px', fontWeight: 600, fontSize: isMobile ? '16px' : '18px' }}>
            Task Statistics
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
              <FiCheckSquare size={isMobile ? 18 : 20} />
              <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700 }}>
                My Tasks
              </div>
              {getOverdueCount() > 0 && (
                <div style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {getOverdueCount()} Overdue
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
                  <option value="rejected">Rejected</option>
                  <option value="onhold">On Hold</option>
                  <option value="reopen">Reopen</option>
                  <option value="cancelled">Cancelled</option>
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
                  onClick={fetchMyTasks}
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
          {renderGroupedTasks()}
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