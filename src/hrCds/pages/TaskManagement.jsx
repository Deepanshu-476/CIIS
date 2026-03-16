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
  FiGlobe, FiSun, FiRotateCcw, FiAlertTriangle, FiBriefcase, FiServer
} from 'react-icons/fi';

import "../Css/TaskManagement.css";
import API_URL from '../../config';
import CIISLoader from '../../Loader/CIISLoader';

// Helper function to get correct image URL - COMPLETELY FIXED VERSION
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';

  console.log('🔍 Original image path:', imagePath);

  // अगर already full URL है
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  const baseUrl = API_URL || 'http://localhost:3000';
  const baseUrlWithoutApi = baseUrl.replace(/\/api$/, ''); // Remove /api if present

  // Clean the path - replace backslashes and remove leading slashes
  let cleanPath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Check if the path already has the correct structure
  if (cleanPath.startsWith('uploads/')) {
    // Path already has uploads/ prefix
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('remarks/')) {
    // Path starts with remarks/ - need to add uploads/
    return `${baseUrlWithoutApi}/uploads/${cleanPath}`;
  }
  
  // If it's just a filename, assume it's in uploads/remarks/
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

const statusColors = {
  pending: 'warning',
  'in-progress': 'info',
  completed: 'success',
  rejected: 'error',
  onhold: 'secondary',
  reopen: 'secondary',
  cancelled: 'grey',
  overdue: 'error',
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

  // Add new state for clients and services
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [companyCode, setCompanyCode] = useState('');

  // New state for client services
  const [clientServices, setClientServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);

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

  // Update newTask state to include client and service
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDateTime: '',
    priority: 'medium',
    priorityDays: '1',
    files: null,
    voiceNote: null,
    clientId: '', // Add client ID field
    clientName: '', // Add client name field
    serviceId: '', // Add service ID field
    serviceName: '' // Add service name field
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

  // Debug state
  const [debugInfo, setDebugInfo] = useState(null);

  // Refs for filter values to prevent infinite loops
  const statusFilterRef = useRef(statusFilter);
  const searchTermRef = useRef(searchTerm);
  const timeFilterRef = useRef(timeFilter);

  // Update refs when filter values change
  useEffect(() => {
    statusFilterRef.current = statusFilter;
    searchTermRef.current = searchTerm;
    timeFilterRef.current = timeFilter;
  }, [statusFilter, searchTerm, timeFilter]);

  // Fetch company code and clients on mount
  useEffect(() => {
    const fetchCompanyInfo = () => {
      try {
        const companyCodeFromStorage = localStorage.getItem('companyCode') || 
                                      localStorage.getItem('company') || '';
        console.log('🔍 Company code from storage:', companyCodeFromStorage);
        setCompanyCode(companyCodeFromStorage);
      } catch (error) {
        console.error('❌ Error fetching company info:', error);
      }
    };

    fetchCompanyInfo();
  }, []);

  // Fetch clients based on company code
  const fetchClients = useCallback(async () => {
    if (!companyCode) {
      console.log('⚠️ No company code available');
      return;
    }

    setLoadingClients(true);
    try {
      console.log('🔍 Fetching clients for company:', companyCode);
      
      // Create axios instance with proper headers
      const clientsApi = axios.create({
        baseURL: `${API_URL}/clientsservice`,
        timeout: 10000,
      });

      // Add auth token
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      const response = await clientsApi.get('/', {
        params: { companyCode },
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Clients response:', response.data);

      let clientsList = [];
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        clientsList = response.data.data;
      } else if (Array.isArray(response.data)) {
        clientsList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        clientsList = response.data.data;
      }

      // Filter clients by company code to be safe
      const filteredClients = clientsList.filter(client => 
        client.companyCode === companyCode || 
        client.companyIdentifier === companyCode
      );

      console.log('✅ Filtered clients:', filteredClients.length);
      setClients(filteredClients);

    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      
      // Log detailed error for debugging
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      showSnackbar('Failed to load clients', 'error');
    } finally {
      setLoadingClients(false);
    }
  }, [companyCode]);

  // Fetch client services when client is selected
  const fetchClientServices = useCallback(async (clientId) => {
    if (!clientId) {
      setClientServices([]);
      return;
    }

    setLoadingServices(true);
    try {
      console.log('🔍 Fetching services for client:', clientId);
      
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      // First, get the client details to see their services
      const client = clients.find(c => c._id === clientId);
      
      if (client && client.services && Array.isArray(client.services)) {
        console.log('✅ Client services from client object:', client.services);
        setClientServices(client.services);
      } else {
        // If services not in client object, try to fetch from API
        const servicesApi = axios.create({
          baseURL: `${API_URL}/clientsservice`,
          timeout: 10000,
        });

        const response = await servicesApi.get(`/${clientId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Client details response:', response.data);
        
        if (response.data?.success && response.data.data) {
          const clientData = response.data.data;
          if (clientData.services && Array.isArray(clientData.services)) {
            setClientServices(clientData.services);
          } else {
            setClientServices([]);
          }
        } else {
          setClientServices([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching client services:', error);
      setClientServices([]);
      showSnackbar('Failed to load client services', 'error');
    } finally {
      setLoadingServices(false);
    }
  }, [clients]);

  // Fetch clients when component mounts or companyCode changes
  useEffect(() => {
    if (companyCode && !authError) {
      fetchClients();
    }
  }, [companyCode, authError, fetchClients]);

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
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      
      const userId = user.id || user._id;
      const userRole = user.role || user.jobRole;
      const userName = user.name;
      
      if (!userId || !userRole || !userName) {
        setAuthError(true);
        showSnackbar('Invalid user data. Please log in again.', 'error');
        setLoading(false);
        return;
      }

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
  const isOverdue = useCallback((dueDateTime, status) => {
    if (!dueDateTime) return false;
    
    if (status === 'overdue') return true;
    
    const now = new Date();
    const dueDate = new Date(dueDateTime);
    
    const isPastDue = dueDate < now;
    const canBeOverdue = ['pending', 'in-progress', 'reopen', 'onhold'];
    
    return isPastDue && canBeOverdue.includes(status);
  }, []);

  // Get overdue count - Memoized
  const getOverdueCount = useMemo(() => {
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
  }, [myTasksGrouped, userId, getUserStatusForTask, isOverdue]);

  // Calculate stats from tasks
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

  // Manual overdue check
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

  // Fetch user's tasks - FIXED: Using refs for filter values
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
      console.log('📥 Remarks data:', res.data);
      
      // Check image paths
      if (res.data.remarks) {
        res.data.remarks.forEach((remark, index) => {
          if (remark.image) {
            console.log(`📸 Remark ${index} image path:`, remark.image);
            console.log(`🔗 Full URL:`, getImageUrl(remark.image));
          }
        });
      }
      
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

    // Clean up previous previews
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
      
      // Check response for image path
      if (response.data.remark && response.data.remark.image) {
        console.log('📸 Image saved at path:', response.data.remark.image);
      }

      setNewRemark('');
      
      // Clean up previews
      remarkImages.forEach(image => URL.revokeObjectURL(image.preview));
      setRemarkImages([]);
      
      showSnackbar(
        `Remark added successfully${remarkImages.length > 0 ? ' with image' : ''}`, 
        'success'
      );

      // Refresh remarks after adding
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
        
        // Stop all tracks to release microphone
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

  // Handle client selection
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    const client = clients.find(c => c._id === clientId);
    
    setSelectedClient(clientId);
    setSelectedClientData(client);
    setSelectedService(''); // Reset service selection
    
    setNewTask({
      ...newTask,
      clientId: clientId,
      clientName: client ? client.client : '',
      serviceId: '', // Reset service ID
      serviceName: '' // Reset service name
    });
    
    console.log('🔍 Selected client:', client);
    
    // Fetch client services
    if (clientId) {
      fetchClientServices(clientId);
    } else {
      setClientServices([]);
    }
  };

  // Handle service selection
  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    let serviceName = '';
    
    // Find service name from clientServices
    if (clientServices.length > 0) {
      // If serviceId is a string (service name directly)
      if (typeof clientServices[0] === 'string') {
        serviceName = serviceId;
      } else {
        // If serviceId is an object with servicename property
        const service = clientServices.find(s => s._id === serviceId || s.servicename === serviceId);
        serviceName = service ? (service.servicename || service.name || serviceId) : serviceId;
      }
    }
    
    setSelectedService(serviceId);
    setNewTask({
      ...newTask,
      serviceId: serviceId,
      serviceName: serviceName || serviceId
    });
    
    console.log('🔍 Selected service:', serviceId, serviceName);
  };

  // Test function to check backend fields
  const testBackendFields = async () => {
    try {
      console.log('🧪 Testing backend connection...');
      
      // Test 1: Check if we can reach the server
      const testResponse = await axios.get('/task/test', { timeout: 5000 }).catch(() => null);
      console.log('Test endpoint response:', testResponse?.data);
      
      // Test 2: Try to create a minimal task
      const testFormData = new FormData();
      testFormData.append('title', 'Test Task');
      testFormData.append('description', 'Test Description');
      testFormData.append('dueDateTime', new Date().toISOString());
      testFormData.append('priority', 'medium');
      
      console.log('🧪 Testing with minimal fields...');
      const response = await axios.post('/task/create-self', testFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      console.log('✅ Test successful! Backend accepts minimal fields:', response.data);
      showSnackbar('Backend test successful!', 'success');
    } catch (err) {
      console.error('❌ Test failed:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      
      let errorMsg = 'Backend test failed';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setDebugInfo({
        error: errorMsg,
        details: err.response?.data,
        status: err.response?.status
      });
      
      showSnackbar(`Test failed: ${errorMsg}`, 'error');
    }
  };

  // Update handleCreateTask to include client and service data with flexible field names
  const handleCreateTask = async () => {
    if (authError || !userId) {
      showSnackbar('Please log in to create tasks', 'error');
      return;
    }

    // Validate required fields including client and service
    if (!newTask.title || !newTask.description || !newTask.dueDateTime || !newTask.clientId || !newTask.serviceId) {
      showSnackbar('Please fill all required fields (Title, Description, Due Date, Client, Service)', 'error');
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
      } else {
        showSnackbar('Invalid date format', 'error');
        setIsCreatingTask(false);
        return;
      }

      if (isNaN(dueDate.getTime())) {
        console.error('Invalid date:', newTask.dueDateTime);
        showSnackbar('Invalid date format. Please select a valid date and time.', 'error');
        setIsCreatingTask(false);
        return;
      }

      const now = new Date();
      const buffer = 5 * 60 * 1000;
      
      if (dueDate < new Date(now.getTime() - buffer)) {
        showSnackbar('Due date cannot be in the past. Please select a future date and time.', 'error');
        setIsCreatingTask(false);
        return;
      }

      const formData = new FormData();
      
      // Try different field name variations that your backend might expect
      // Title fields
      formData.append('title', newTask.title);
      formData.append('taskTitle', newTask.title);
      formData.append('task_name', newTask.title);
      
      // Description fields
      formData.append('description', newTask.description);
      formData.append('taskDescription', newTask.description);
      formData.append('task_description', newTask.description);
      formData.append('details', newTask.description);
      
      // Due date fields - try multiple formats
      formData.append('dueDateTime', dueDate.toISOString());
      formData.append('dueDate', dueDate.toISOString());
      formData.append('deadline', dueDate.toISOString());
      formData.append('endDate', dueDate.toISOString());
      
      // Also try formatted date string
      const formattedDate = dueDate.toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      formData.append('due_date_string', formattedDate);
      
      // Priority fields
      formData.append('priority', newTask.priority);
      formData.append('priorityLevel', newTask.priority);
      formData.append('priorityDays', newTask.priorityDays || '1');
      formData.append('priority_days', newTask.priorityDays || '1');
      
      // Client fields - try multiple variations
      formData.append('clientId', newTask.clientId);
      formData.append('client', newTask.clientId);
      formData.append('clientID', newTask.clientId);
      formData.append('customerId', newTask.clientId);
      
      formData.append('clientName', newTask.clientName);
      formData.append('customerName', newTask.clientName);
      
      // Service fields - try multiple variations
      formData.append('serviceId', newTask.serviceId);
      formData.append('service', newTask.serviceId);
      formData.append('serviceID', newTask.serviceId);
      formData.append('serviceName', newTask.serviceName);
      
      // Also try sending as JSON in a field
      formData.append('clientData', JSON.stringify({
        id: newTask.clientId,
        name: newTask.clientName
      }));
      
      formData.append('serviceData', JSON.stringify({
        id: newTask.serviceId,
        name: newTask.serviceName
      }));
      
      // Add company code
      if (companyCode) {
        formData.append('companyCode', companyCode);
        formData.append('company', companyCode);
      }

      if (newTask.files) {
        for (let i = 0; i < newTask.files.length; i++) {
          formData.append('files', newTask.files[i]);
          formData.append('attachments', newTask.files[i]);
          formData.append('file', newTask.files[i]);
        }
      }

      if (newTask.voiceNote) {
        formData.append('voiceNote', newTask.voiceNote);
        formData.append('audio', newTask.voiceNote);
        formData.append('voice_note', newTask.voiceNote);
      }

      // Log all form data for debugging
      console.log('📤 FormData contents:');
      const formDataEntries = [];
      for (let pair of formData.entries()) {
        if (pair[0].includes('file') || pair[0].includes('File') || pair[0].includes('audio')) {
          formDataEntries.push({ field: pair[0], value: '[File object]' });
          console.log(pair[0] + ': [File object]');
        } else {
          formDataEntries.push({ field: pair[0], value: pair[1] });
          console.log(pair[0] + ': ' + pair[1]);
        }
      }
      
      setDebugInfo({
        action: 'Creating task',
        formData: formDataEntries,
        timestamp: new Date().toISOString()
      });

      console.log('📤 Sending request to /task/create-self');
      const response = await axios.post('/task/create-self', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('✅ Task created successfully:', response.data);
      
      setDebugInfo(prev => ({
        ...prev,
        response: response.data,
        success: true
      }));

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
        clientId: '',
        clientName: '',
        serviceId: '',
        serviceName: ''
      });
      setSelectedClient('');
      setSelectedClientData(null);
      setSelectedService('');
      setClientServices([]);

      fetchMyTasks();

    } catch (err) {
      console.error('❌ Full error creating task:', err);
      console.error('❌ Error response:', err.response?.data);
      
      // Show more detailed error message
      let errorMessage = 'Task creation failed';
      let errorDetails = '';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
          errorDetails = err.response.data.message || '';
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.errors) {
          errorMessage = Object.values(err.response.data.errors).join(', ');
        }
      }
      
      setDebugInfo({
        error: errorMessage,
        details: err.response?.data,
        status: err.response?.status,
        timestamp: new Date().toISOString()
      });
      
      if (err.response?.status === 401) {
        setAuthError(true);
        showSnackbar('Session expired. Please log in again.', 'error');
      } else if (err.response?.status === 400) {
        showSnackbar(errorMessage, 'error');
      } else {
        showSnackbar(errorMessage, 'error');
      }
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

  // Load initial data with page loader - Run once on mount
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
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []); // Empty dependency array - run only once

  // FIXED: Single useEffect for filter changes
  useEffect(() => {
    if (!authError && userId) {
      fetchMyTasks();
    }
  }, [statusFilter, searchTerm, timeFilter, authError, userId]);

  // FIXED: Single useEffect for user authentication
  useEffect(() => {
    if (!authError && userId) {
      fetchMyTasks();
      fetchOverdueTasks();
    }
  }, [authError, userId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
      
      // Clean up any object URLs
      remarkImages.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [remarkImages]);

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

  // Render create task dialog with client and service selection
  const renderCreateTaskDialog = () => (
    <div className="user-create-task-dialog-overlay" style={{ display: openDialog ? 'flex' : 'none' }}>
      <div className={`user-create-task-dialog ${isMobile ? 'mobile-dialog' : ''}`} style={{ 
        maxWidth: isMobile ? '95%' : isTablet ? '650px' : '700px',
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
          {companyCode && (
            <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#1976d2', marginTop: '2px' }}>
              Company: {companyCode}
            </div>
          )}
        </div>
        
        <div className="user-create-task-dialog-content">
          <div className="user-create-task-flex user-create-task-flex-column user-create-task-gap-3">
            <div className="user-create-task-alert info" style={{ padding: isMobile ? '12px' : '16px' }}>
              This task will be automatically assigned to you ({userName})
            </div>

            {/* Debug Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                className="user-create-task-button user-create-task-button-outlined"
                onClick={testBackendFields}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                <FiRefreshCw size={12} /> Test Backend
              </button>
            </div>

            {/* Client Selection Field */}
            <div className="user-create-task-form-control">
              <label>Select Client *</label>
              <select
                className="user-create-task-select"
                value={selectedClient}
                onChange={handleClientChange}
                required
                disabled={loadingClients || clients.length === 0}
              >
                <option value="">
                  {loadingClients ? 'Loading clients...' : 
                   clients.length === 0 ? 'No clients available' : 
                   'Select a client'}
                </option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.client} {client.company ? `- ${client.company}` : ''} {client.city ? `(${client.city})` : ''}
                  </option>
                ))}
              </select>
              {clients.length === 0 && !loadingClients && companyCode && (
                <small style={{ color: '#f44336', marginTop: '4px', display: 'block' }}>
                  No clients found for this company. Please add clients first.
                </small>
              )}
              {!companyCode && (
                <small style={{ color: '#f44336', marginTop: '4px', display: 'block' }}>
                  Company code not found. Please refresh the page.
                </small>
              )}
            </div>

            {/* Client Info Display - Show when client is selected */}
            {selectedClientData && (
              <div className="user-create-task-paper" style={{ padding: isMobile ? '8px' : '12px', backgroundColor: '#f0f7ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FiBriefcase color="#1976d2" />
                  <strong>Client Details:</strong>
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  <div><strong>Name:</strong> {selectedClientData.client}</div>
                  {selectedClientData.company && <div><strong>Company:</strong> {selectedClientData.company}</div>}
                  {selectedClientData.city && <div><strong>City:</strong> {selectedClientData.city}</div>}
                  {selectedClientData.email && <div><strong>Email:</strong> {selectedClientData.email}</div>}
                  {selectedClientData.phone && <div><strong>Phone:</strong> {selectedClientData.phone}</div>}
                </div>
              </div>
            )}

            {/* Service Selection Field - Show only after client is selected */}
            {selectedClient && (
              <div className="user-create-task-form-control">
                <label>Select Service *</label>
                <select
                  className="user-create-task-select"
                  value={selectedService}
                  onChange={handleServiceChange}
                  required
                  disabled={loadingServices || clientServices.length === 0}
                >
                  <option value="">
                    {loadingServices ? 'Loading services...' : 
                     clientServices.length === 0 ? 'No services available for this client' : 
                     'Select a service'}
                  </option>
                  {clientServices.map((service, index) => {
                    // Handle both string and object formats
                    const serviceId = typeof service === 'string' ? service : (service._id || service.servicename || index);
                    const serviceName = typeof service === 'string' ? service : (service.servicename || service.name || 'Service');
                    
                    return (
                      <option key={serviceId} value={serviceId}>
                        {serviceName}
                      </option>
                    );
                  })}
                </select>
                {clientServices.length === 0 && !loadingServices && (
                  <small style={{ color: '#f44336', marginTop: '4px', display: 'block' }}>
                    No services found for this client. Please add services to the client first.
                  </small>
                )}
              </div>
            )}

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

            {/* Show selected client and service summary */}
            {selectedClient && selectedService && (
              <div className="user-create-task-alert success" style={{ padding: isMobile ? '8px' : '12px' }}>
                <div><strong>Selected Client:</strong> {newTask.clientName}</div>
                <div><strong>Selected Service:</strong> {newTask.serviceName}</div>
              </div>
            )}

    
          </div>
        </div>

        <div className="user-create-task-dialog-actions">
          <button
            className="user-create-task-button user-create-task-button-outlined"
            onClick={() => {
              setOpenDialog(false);
              setSelectedClient('');
              setSelectedClientData(null);
              setSelectedService('');
              setClientServices([]);
              setNewTask({
                title: '', 
                description: '', 
                dueDateTime: '',
                priority: 'medium', 
                priorityDays: '1', 
                files: null, 
                voiceNote: null,
                clientId: '',
                clientName: '',
                serviceId: '',
                serviceName: ''
              });
              setDebugInfo(null);
            }}
            style={{ padding: isMobile ? '8px 12px' : '10px 16px' }}
          >
            Cancel
          </button>

          <button
            className="user-create-task-button user-create-task-button-contained"
            onClick={handleCreateTask}
            disabled={!newTask.title || !newTask.description || !newTask.dueDateTime || !newTask.clientId || !newTask.serviceId || isCreatingTask}
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

  // Render remarks dialog - FIXED VERSION with improved image error handling
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

                          {/* FIXED: Image display section with proper error handling */}
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
                                    
                                    // Get the base URL without /api
                                    const baseUrl = (API_URL || 'http://localhost:3000').replace(/\/api$/, '');
                                    
                                    // Get the filename from the original path
                                    const originalPath = remark.image;
                                    const filename = originalPath.split(/[\\/]/).pop();
                                    
                                    // Try different path combinations
                                    const pathsToTry = [
                                      // Most likely correct paths
                                      `${baseUrl}/uploads/remarks/${filename}`,
                                      `${baseUrl}/uploads/${filename}`,
                                      `${baseUrl}/remarks/${filename}`,
                                      
                                      // With /api prefix
                                      `${baseUrl}/api/uploads/remarks/${filename}`,
                                      `${baseUrl}/api/uploads/${filename}`,
                                      `${baseUrl}/api/remarks/${filename}`,
                                      
                                      // With original path structure
                                      `${baseUrl}/${originalPath.replace(/\\/g, '/')}`,
                                      `${baseUrl}/uploads/${originalPath.replace(/\\/g, '/')}`,
                                    ];
                                    
                                    // Remove duplicates
                                    const uniquePaths = [...new Set(pathsToTry)];
                                    
                                    console.log('🔄 Trying alternative paths:', uniquePaths);
                                    
                                    let triedIndex = 0;
                                    const tryNextPath = () => {
                                      if (triedIndex < uniquePaths.length) {
                                        console.log(`🔄 Trying path ${triedIndex + 1}:`, uniquePaths[triedIndex]);
                                        e.target.src = uniquePaths[triedIndex];
                                        triedIndex++;
                                      } else {
                                        // Show fallback if all paths fail
                                        e.target.style.display = 'none';
                                        const parent = e.target.parentElement;
                                        
                                        // Remove any existing fallback
                                        const existingFallback = parent.querySelector('.image-error-fallback');
                                        if (existingFallback) {
                                          existingFallback.remove();
                                        }
                                        
                                        // Create fallback UI
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
                    await handleStatusChange(
                      pendingStatusChange.taskId,
                      pendingStatusChange.status,
                      newRemark || "Status changed"
                    );
                    setPendingStatusChange({ taskId: null, status: "" });
                  }

                  // Refresh remarks after adding
                  await fetchTaskRemarks(remarksDialog.taskId);
                  setNewRemark("");
                  fetchMyTasks();

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
                      {task.serviceName && (
                        <div style={{ fontSize: '11px', color: '#1976d2', marginTop: '2px' }}>
                          Service: {task.serviceName}
                        </div>
                      )}
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
                        {task.serviceName && (
                          <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '4px' }}>
                            Service: {task.serviceName}
                          </div>
                        )}
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
                        {task.serviceName && (
                          <div style={{ fontSize: '11px', color: '#1976d2', marginTop: '2px' }}>
                            Service: {task.serviceName}
                          </div>
                        )}
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
                            {task.serviceName && (
                              <div style={{ fontSize: '11px', color: '#1976d2', marginTop: '2px' }}>
                                Service: {task.serviceName}
                              </div>
                            )}
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

          {/* RIGHT: Create Task */}
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