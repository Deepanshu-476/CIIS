import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axiosConfig';
import { API_URL_IMG } from '../../../config';
import { useNavigate } from 'react-router-dom';
import './AdminTaskManagement.css';
import CIISLoader from '../../../Loader/CIISLoader';


import {
  FiPlus, FiCalendar, FiInfo, FiPaperclip, FiMic, FiFileText,
  FiCheck, FiX, FiAlertCircle, FiUser, FiUsers, FiFolder,
  FiBell, FiEdit, FiTrash2, FiSave, FiSearch,
  FiFilter, FiDownload, FiMessageSquare, FiActivity,
  FiEye, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiMoreVertical, FiRefreshCw, FiUserCheck, FiUserX,
  FiLogOut, FiEdit3, FiTrash, FiMessageCircle,
  FiZoomIn, FiImage, FiCamera, FiBriefcase
} from 'react-icons/fi';

const AdminTaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [userId, setUserId] = useState('');
  const [authError, setAuthError] = useState(false);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  
  
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    company: null,
    department: null,
    role: '',
    companyRole: ''
  });
  
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);
  
  
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  
  const [filteredStats, setFilteredStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    overdue: 0
  });

  
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRemarksDialog, setOpenRemarksDialog] = useState(false);
  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openUserStatusDialog, setOpenUserStatusDialog] = useState(false);
  
  
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  const [remarkImages, setRemarkImages] = useState([]);
  const [isUploadingRemark, setIsUploadingRemark] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  
  const [selectedTask, setSelectedTask] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [taskUserStatuses, setTaskUserStatuses] = useState([]);
  
  
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueFilter, setOverdueFilter] = useState('');
  
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDateTime: '',
    assignedUsers: [],
    assignedGroups: [],
    priorityDays: '1',
    priority: 'medium',
    files: null,
    voiceNote: null
  });

  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    dueDateTime: '',
    assignedUsers: [],
    assignedGroups: [],
    priorityDays: '1',
    priority: 'medium'
  });

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    members: []
  });

  const [statusChange, setStatusChange] = useState({
    taskId: '',
    userId: '',
    status: '',
    remarks: ''
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

  
  const [createDueDateTime, setCreateDueDateTime] = useState('');

  const navigate = useNavigate();

  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
    
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 3000);
  };

  
  const isOwner = () => {
    return companyRole === 'Owner' || userRole === 'Owner' || userRole === 'CAREER INFOWIS Admin';
  };

  
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
      return department.name || department._id || 'N/A';
    }
    return department;
  };

  
  const getUserCompanyDisplay = (user) => {
    if (!user?.company) return 'No Company';
    if (typeof user.company === 'object') {
      return user.company.companyName || user.company.name || 'N/A';
    }
    return user.company;
  };

  
  const getUserDepartmentDisplay = (user) => {
    if (!user?.department) return 'No Department';
    if (typeof user.department === 'object') {
      return user.department.name || 'N/A';
    }
    return user.department;
  };

  
  const checkSameCompanyDepartment = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    
    const currentCompany = currentUser.company?._id || currentUser.company;
    const targetCompany = targetUser.company?._id || targetUser.company;
    
    if (currentCompany?.toString() !== targetCompany?.toString()) {
      return false;
    }
    
    
    const currentDept = currentUser.department?._id || currentUser.department;
    const targetDept = targetUser.department?._id || targetUser.department;
    
    if (currentDept?.toString() !== targetDept?.toString()) {
      return false;
    }
    
    return true;
  };

  
  const checkSameCompany = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    const currentCompany = currentUser.company?._id || currentUser.company;
    const targetCompany = targetUser.company?._id || targetUser.company;
    
    return currentCompany?.toString() === targetCompany?.toString();
  };

  
  const filteredUsers = users.filter(user => {
    
    const isSameCompany = checkSameCompany(user);
    const isSelf = (user.id || user._id) === currentUser.id;
    
    if (!isSameCompany || isSelf) return false;
    
    
    if (!isOwner()) {
      const userDept = user.department?._id || user.department;
      const currentDept = currentUser.department?._id || currentUser.department;
      
      if (userDept?.toString() !== currentDept?.toString()) {
        return false;
      }
    }
    
    
    return user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
           user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
           user.role?.toLowerCase().includes(userSearch.toLowerCase());
  });

  
  const filteredGroups = groups.filter(group => 
    group.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
    group.description?.toLowerCase().includes(groupSearch.toLowerCase())
  );

  
  const fetchUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userStr || !token) {
        setAuthError(true);
        setInitialAuthCheck(true);
        showSnackbar('Please login to continue', 'error');
        return;
      }

      let user;
      try {
        user = JSON.parse(userStr);
      } catch (parseError) {
        setAuthError(true);
        setInitialAuthCheck(true);
        showSnackbar('Invalid user data format', 'error');
        return;
      }
      
      
      let foundUserId = null;
      let userRole = 'user';
      let companyRole = 'employee';
      let userName = '';
      let userJobRole = '';
      let userCompany = null;
      let userDepartment = null;
      
      
      if (user.id && typeof user.id === 'string') {
        foundUserId = user.id;
        userRole = user.role || 'user';
        companyRole = user.companyRole || user.role || 'employee';
        userName = user.name || 'Unknown User';
        userJobRole = user.jobRole || '';
        
        if (user.company && typeof user.company === 'object') {
          userCompany = user.company;
        } else {
          userCompany = user.company || null;
        }
        
        if (user.department && typeof user.department === 'object') {
          userDepartment = user.department;
        } else {
          userDepartment = user.department || null;
        }
      }
      else if (user.user && user.user.id) {
        foundUserId = user.user.id;
        userRole = user.user.role || 'user';
        companyRole = user.user.companyRole || user.user.role || 'employee';
        userName = user.user.name || 'Unknown User';
        userJobRole = user.user.jobRole || '';
        
        if (user.user.company && typeof user.user.company === 'object') {
          userCompany = user.user.company;
        } else {
          userCompany = user.user.company || null;
        }
        
        if (user.user.department && typeof user.user.department === 'object') {
          userDepartment = user.user.department;
        } else {
          userDepartment = user.user.department || null;
        }
      }
      else if (user._id) {
        foundUserId = user._id;
        userRole = user.role || 'user';
        companyRole = user.companyRole || user.role || 'employee';
        userName = user.name || 'Unknown User';
        userJobRole = user.jobRole || '';
        
        if (user.company && typeof user.company === 'object') {
          userCompany = user.company;
        } else {
          userCompany = user.company || null;
        }
        
        if (user.department && typeof user.department === 'object') {
          userDepartment = user.department;
        } else {
          userDepartment = user.department || null;
        }
      }
      else if (user.userId) {
        foundUserId = user.userId;
        userRole = user.role || 'user';
        companyRole = user.companyRole || user.role || 'employee';
        userName = user.name || 'Unknown User';
        userJobRole = user.jobRole || '';
        
        if (user.company && typeof user.company === 'object') {
          userCompany = user.company;
        } else {
          userCompany = user.company || null;
        }
        
        if (user.department && typeof user.department === 'object') {
          userDepartment = user.department;
        } else {
          userDepartment = user.department || null;
        }
      }
      else if (typeof user === 'string') {
        foundUserId = user;
        userRole = 'user';
        companyRole = 'employee';
      }
      
      if (!foundUserId) {
        setAuthError(true);
        setInitialAuthCheck(true);
        showSnackbar('Invalid user data. Please login again.', 'error');
        return;
      }

      setUserRole(userRole);
      setCompanyRole(companyRole);
      setJobRole(userJobRole);
      setUserId(foundUserId);
      
      setCurrentUser({
        id: foundUserId,
        name: userName,
        company: userCompany,
        department: userDepartment,
        role: userRole,
        companyRole: companyRole
      });
      
      setAuthError(false);
      setInitialAuthCheck(true);
        
    } catch (error) {
      setAuthError(true);
      setInitialAuthCheck(true);
      showSnackbar('Error loading user data', 'error');
    }
  };

  
  const apiCall = async (method, url, data = null, config = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthError(true);
        throw new Error('No authentication token found');
      }

      const defaultConfig = {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...config.headers
        }
      };

      if (!(data instanceof FormData) && !config.headers?.['Content-Type']) {
        defaultConfig.headers['Content-Type'] = 'application/json';
      }

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await axios.get(url, defaultConfig);
          break;
        case 'post':
          response = await axios.post(url, data, defaultConfig);
          break;
        case 'put':
          response = await axios.put(url, data, defaultConfig);
          break;
        case 'patch':
          response = await axios.patch(url, data, defaultConfig);
          break;
        case 'delete':
          response = await axios.delete(url, defaultConfig);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        setAuthError(true);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showSnackbar('Session expired. Please login again.', 'error');
      } else if (error.response?.status === 403) {
        showSnackbar('Access denied. You do not have permission to perform this action.', 'error');
      } else if (error.response?.status === 404) {
        showSnackbar('Resource not found.', 'error');
      } else if (!error.response) {
        showSnackbar('Network error. Please check your connection.', 'error');
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'An error occurred';
        showSnackbar(errorMessage, 'error');
      }
      
      throw error;
    }
  };

  
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  
  const parseDateTimeInput = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    if (dateTimeString.includes('T')) {
      const dateStr = dateTimeString.includes(':') && dateTimeString.split(':').length === 2 
        ? `${dateTimeString}:00` 
        : dateTimeString;
      
      return new Date(dateStr);
    } else {
      return new Date(dateTimeString);
    }
  };

  
  const fetchTasks = async (page = 0, limit = rowsPerPage, filters = {}) => {
    if (authError || !userId) {
      return;
    }

    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: limit,
        createdBy: userId
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (assignedToFilter) params.assignedTo = assignedToFilter;
      if (overdueFilter) params.overdue = overdueFilter;
      
      if (dateRange.startDate) {
        params.startDate = new Date(dateRange.startDate).toISOString();
      }
      if (dateRange.endDate) {
        params.endDate = new Date(dateRange.endDate).toISOString();
      }
      
      const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const url = queryString ? `/task/assigned?${queryString}` : '/task/assigned';
      const tasksResult = await apiCall('get', url);
      
      let tasksArray = [];
      if (tasksResult.groupedTasks) {
        tasksArray = Object.values(tasksResult.groupedTasks).flat();
      } else if (tasksResult.tasks) {
        tasksArray = tasksResult.tasks;
      } else if (tasksResult.data) {
        tasksArray = tasksResult.data;
      } else if (Array.isArray(tasksResult)) {
        tasksArray = tasksResult;
      }
      
      setTasks(tasksArray);
      setTotalTasks(tasksResult.total || tasksResult.totalCount || tasksArray.length);
      calculateFilteredStats(tasksArray);

    } catch (error) {
      setTasks([]);
      setTotalTasks(0);
      setFilteredStats({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        overdue: 0
      });
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        showSnackbar('Failed to load tasks', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  
  const calculateFilteredStats = (tasksArray) => {
    const stats = {
      total: tasksArray.length,
      pending: tasksArray.filter(t => getTaskStatus(t) === 'pending').length,
      inProgress: tasksArray.filter(t => getTaskStatus(t) === 'in-progress').length,
      completed: tasksArray.filter(t => getTaskStatus(t) === 'completed').length,
      rejected: tasksArray.filter(t => getTaskStatus(t) === 'rejected').length,
      overdue: tasksArray.filter(t => isOverdue(t)).length
    };
    setFilteredStats(stats);
  };

  
  const fetchSupportingData = async () => {
    try {
      const companyId = currentUser.company?._id || currentUser.company;
      
      
      try {
        let deptUrl = '/departments';
        if (companyId) {
          deptUrl = `/departments?company=${companyId}`;
        }
        const deptRes = await apiCall('get', deptUrl);
        
        let departmentsData = [];
        if (deptRes.data && deptRes.data.success) {
          if (deptRes.data.data && Array.isArray(deptRes.data.data)) {
            departmentsData = deptRes.data.data;
          } else if (deptRes.data.departments && Array.isArray(deptRes.data.departments)) {
            departmentsData = deptRes.data.departments;
          } else if (Array.isArray(deptRes.data)) {
            departmentsData = deptRes.data;
          }
        } else if (Array.isArray(deptRes)) {
          departmentsData = deptRes;
        }
        setDepartments(departmentsData);
      } catch (deptErr) {
        console.error('Failed to load departments', deptErr);
      }
      
      
      let usersUrl;
      
      if (isOwner()) {
        usersUrl = `/users/company-users?companyId=${companyId}`;
      } else {
        const deptId = currentUser.department?._id || currentUser.department;
        if (deptId) {
          usersUrl = `/users/department-users?department=${deptId}`;
        } else {
          usersUrl = '/users/company-users';
        }
      }
      
      const usersResult = await apiCall('get', usersUrl);
      
      let usersArray = [];
      
      if (usersResult.message && usersResult.message.users && Array.isArray(usersResult.message.users)) {
        usersArray = usersResult.message.users;
      }
      else if (usersResult.users && Array.isArray(usersResult.users)) {
        usersArray = usersResult.users;
      }
      else if (usersResult.data && Array.isArray(usersResult.data)) {
        usersArray = usersResult.data;
      }
      else if (Array.isArray(usersResult)) {
        usersArray = usersResult;
      }
      
      
      if (currentUser.company) {
        usersArray = usersArray.filter(user => {
          const userCompany = user.company?._id || user.company;
          const sameCompany = userCompany?.toString() === (currentUser.company?._id || currentUser.company)?.toString();
          return sameCompany;
        });
      }
      
      setUsers(usersArray);

      
      const groupsResult = await apiCall('get', '/groups');
      setGroups(groupsResult.groups || groupsResult.data || []);

      
      const notificationsResult = await apiCall('get', '/task/notifications/all');
      setNotifications(notificationsResult.notifications || []);
      setUnreadNotificationCount(notificationsResult.unreadCount || 0);

    } catch (error) {
      console.error('Error fetching supporting data:', error);
    }
  };

  
  const fetchAllData = async (page = 0, limit = rowsPerPage) => {
    await Promise.all([
      fetchTasks(page, limit, getCurrentFilters()),
      fetchSupportingData()
    ]);
  };

  
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.dueDateTime) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    if (newTask.assignedUsers.length === 0 && newTask.assignedGroups.length === 0) {
      showSnackbar('Please assign to at least one user or group', 'error');
      return;
    }

    
    if (!isOwner() && newTask.assignedUsers.length > 0) {
      const currentDept = currentUser.department?._id || currentUser.department;
      
      for (const assignedUserId of newTask.assignedUsers) {
        const assignedUser = users.find(u => (u.id || u._id) === assignedUserId);
        if (assignedUser) {
          const userDept = assignedUser.department?._id || assignedUser.department;
          
          if (userDept?.toString() !== currentDept?.toString()) {
            showSnackbar(`Cannot assign task to ${assignedUser.name} - they are in a different department.`, 'error');
            return;
          }
        }
      }
    }

    setIsCreatingTask(true);
    try {
      const parsedDueDateTime = parseDateTimeInput(newTask.dueDateTime);
      
      if (!parsedDueDateTime || isNaN(parsedDueDateTime.getTime())) {
        showSnackbar('Invalid date format. Please select a valid date and time.', 'error');
        setIsCreatingTask(false);
        return;
      }

      const now = new Date();
      const buffer = 5 * 60 * 1000;
      if (parsedDueDateTime < new Date(now.getTime() - buffer)) {
        showSnackbar('Due date cannot be in the past. Please select a future date and time.', 'error');
        setIsCreatingTask(false);
        return;
      }

      const formData = new FormData();
      
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('dueDateTime', parsedDueDateTime.toISOString());
      formData.append('priorityDays', newTask.priorityDays || '1');
      formData.append('priority', newTask.priority);
      formData.append('assignedUsers', JSON.stringify(newTask.assignedUsers));
      formData.append('assignedGroups', JSON.stringify(newTask.assignedGroups));

      if (newTask.files) {
        for (let i = 0; i < newTask.files.length; i++) {
          formData.append('files', newTask.files[i]);
        }
      }

      if (newTask.voiceNote) {
        formData.append('voiceNote', newTask.voiceNote);
      }

      await apiCall('post', '/task/create-for-others', formData);

      setOpenCreateDialog(false);
      showSnackbar('Task created successfully', 'success');
      resetNewTaskForm();
      fetchAllData(page, rowsPerPage);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  
  const handleEditTask = async () => {
    if (!editTask.title || !editTask.description || !editTask.dueDateTime) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    setIsUpdatingTask(true);
    try {
      const parsedDueDateTime = parseDateTimeInput(editTask.dueDateTime);
      
      if (!parsedDueDateTime || isNaN(parsedDueDateTime.getTime())) {
        showSnackbar('Invalid date format', 'error');
        setIsUpdatingTask(false);
        return;
      }

      const formData = new FormData();
      
      formData.append('title', editTask.title);
      formData.append('description', editTask.description);
      formData.append('dueDateTime', parsedDueDateTime.toISOString());
      formData.append('priorityDays', editTask.priorityDays || '1');
      formData.append('priority', editTask.priority);
      formData.append('assignedUsers', JSON.stringify(editTask.assignedUsers));
      formData.append('assignedGroups', JSON.stringify(editTask.assignedGroups));

      await apiCall('put', `/task/${selectedTask._id}`, formData);
      
      setOpenEditDialog(false);
      showSnackbar('Task updated successfully', 'success');
      fetchAllData(page, rowsPerPage);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await apiCall('delete', `/task/${taskId}`);
      showSnackbar('Task deleted successfully', 'success');
      fetchAllData(page, rowsPerPage);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  
  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.description) {
      showSnackbar('Please fill group name and description', 'error');
      return;
    }

    if (newGroup.members.length === 0) {
      showSnackbar('Please select at least one member', 'error');
      return;
    }

    
    const invalidMembers = newGroup.members.filter(memberId => {
      const user = users.find(u => (u.id || u._id) === memberId);
      return !checkSameCompany(user);
    });

    if (invalidMembers.length > 0) {
      showSnackbar('Cannot add users from different company to group', 'error');
      return;
    }

    setIsCreatingGroup(true);
    try {
      if (editingGroup) {
        await apiCall('put', `/groups/${editingGroup._id}`, newGroup);
        showSnackbar('Group updated successfully', 'success');
      } else {
        await apiCall('post', '/groups', newGroup);
        showSnackbar('Group created successfully', 'success');
      }
      setOpenGroupDialog(false);
      resetGroupForm();
      fetchSupportingData();
    } catch (error) {
      console.error('Error in group operation:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;

    try {
      await apiCall('delete', `/groups/${groupId}`);
      showSnackbar('Group deleted successfully', 'success');
      fetchSupportingData();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  
  const handleStatusChange = async () => {
    if (!statusChange.status) {
      showSnackbar('Please select status', 'error');
      return;
    }

    try {
      await apiCall('patch', `/task/${statusChange.taskId}/status`, {
        status: statusChange.status,
        remarks: statusChange.remarks,
        userId: statusChange.userId || userId
      });

      setOpenStatusDialog(false);
      showSnackbar('Status updated successfully', 'success');
      resetStatusForm();
      fetchAllData(page, rowsPerPage);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  
  const fetchUserStatuses = async (task) => {
    try {
      setSelectedTask(task);
      
      if (task.statusInfo && Array.isArray(task.statusInfo)) {
        setTaskUserStatuses(task.statusInfo);
      } else if (task.statusByUser && Array.isArray(task.statusByUser)) {
        const enrichedStatuses = task.statusByUser.map(status => {
          const user = users.find(u => 
            u.id === status.user || 
            u._id === status.user ||
            (status.user?._id && (u.id === status.user._id || u._id === status.user._id))
          );
          return {
            userId: status.user,
            name: user?.name || 'Unknown User',
            role: user?.role || 'N/A',
            email: user?.email || 'N/A',
            status: status.status,
            updatedAt: status.updatedAt
          };
        });
        setTaskUserStatuses(enrichedStatuses);
      } else {
        setTaskUserStatuses([]);
      }
      
      setOpenUserStatusDialog(true);
    } catch (error) {
      console.error('Error fetching user statuses:', error);
      showSnackbar('Failed to load user statuses', 'error');
    }
  };

  
  const fetchRemarks = async (taskId) => {
    try {
      const data = await apiCall('get', `/task/${taskId}/remarks`);
      setRemarks(data.remarks || data.data || []);
      setSelectedTask(tasks.find(task => task._id === taskId));
      setOpenRemarksDialog(true);
    } catch (error) {
      console.error('Error fetching remarks:', error);
      showSnackbar('Failed to load remarks', 'error');
    }
  };

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

  const handleRemoveRemarkImage = (index) => {
    setRemarkImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

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

  const addRemark = async () => {
    if (!newRemark.trim() && remarkImages.length === 0) {
      showSnackbar('Please enter a remark or upload an image', 'warning');
      return;
    }
    
    setIsUploadingRemark(true);
    
    try {
      const formData = new FormData();
      formData.append('text', newRemark.trim());

      if (remarkImages.length > 0) {
        formData.append('image', remarkImages[0].file);
      }

      await apiCall('post', `/task/${selectedTask._id}/remarks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setNewRemark('');
      setRemarkImages([]);
      fetchRemarks(selectedTask._id);
      
      showSnackbar(`Remark added successfully${remarkImages.length > 0 ? ' with image' : ''}`, 'success');

    } catch (error) {
      console.error('Error adding remark:', error);
    } finally {
      setIsUploadingRemark(false);
    }
  };

  
  const fetchActivityLogs = async (taskId) => {
    try {
      const data = await apiCall('get', `/task/${taskId}/activity-logs`);
      setActivityLogs(data.logs || data.data || []);
      setSelectedTask(tasks.find(task => task._id === taskId));
      setOpenActivityDialog(true);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      showSnackbar('Failed to load activity logs', 'error');
    }
  };

  
  const markNotificationAsRead = async (notificationId) => {
    try {
      await apiCall('patch', `/task/notifications/${notificationId}/read`);
      fetchSupportingData();
      showSnackbar('Notification marked as read', 'success');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiCall('patch', '/task/notifications/read-all');
      fetchSupportingData();
      showSnackbar('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  
  const getCurrentFilters = () => {
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = statusFilter;
    if (priorityFilter) filters.priority = priorityFilter;
    if (assignedToFilter) filters.assignedTo = assignedToFilter;
    if (overdueFilter) filters.overdue = overdueFilter;
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    return filters;
  };

  const applyFilters = () => {
    setPage(0);
    fetchAllData(0, rowsPerPage);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssignedToFilter('');
    setOverdueFilter('');
    setDateRange({
      startDate: null,
      endDate: null
    });
    setPage(0);
    fetchAllData(0, rowsPerPage);
  };

  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchTasks(newPage, rowsPerPage, getCurrentFilters());
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchTasks(0, newRowsPerPage, getCurrentFilters());
  };

  
  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      dueDateTime: '',
      assignedUsers: [],
      assignedGroups: [],
      priorityDays: '1',
      priority: 'medium',
      files: null,
      voiceNote: null
    });
    setUserSearch('');
    setGroupSearch('');
    setCreateDueDateTime('');
  };

  const resetStatusForm = () => {
    setStatusChange({
      taskId: '',
      userId: '',
      status: '',
      remarks: ''
    });
  };

  const resetGroupForm = () => {
    setNewGroup({
      name: '',
      description: '',
      members: []
    });
    setEditingGroup(null);
  };

  
  const openEditTaskDialog = (task) => {
    setSelectedTask(task);
    
    const formattedDueDateTime = formatDateForInput(task.dueDateTime);
    
    const assignedUserIds = task.assignedUsers?.map(user => 
      user.id || user._id || user
    ) || [];
    
    const assignedGroupIds = task.assignedGroups?.map(group => 
      group._id || group.id || group
    ) || [];
    
    setEditTask({
      title: task.title || '',
      description: task.description || '',
      dueDateTime: formattedDueDateTime,
      assignedUsers: assignedUserIds,
      assignedGroups: assignedGroupIds,
      priorityDays: task.priorityDays || '1',
      priority: task.priority || 'medium'
    });
    setOpenEditDialog(true);
  };

  const openStatusChangeDialog = (task, userId = '') => {
    setSelectedTask(task);
    setStatusChange({
      taskId: task._id,
      userId: userId,
      status: task.overallStatus || '',
      remarks: ''
    });
    setOpenStatusDialog(true);
  };

  const openGroupEditDialog = (group) => {
    setEditingGroup(group);
    setNewGroup({
      name: group.name,
      description: group.description,
      members: group.members?.map(m => m.id || m._id || m) || []
    });
    setOpenGroupDialog(true);
  };

  
  const getUserName = (userId) => {
    if (typeof userId === 'object') {
      return userId.name || userId.Name || 'Unknown User';
    }
    const user = users.find(u => u.id === userId || u._id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g._id === groupId || g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const isOverdue = (task) => {
    const dueDate = task.dueDateTime || task.dueDate;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && getTaskStatus(task) !== 'completed';
  };

  const getAssignedUsersCount = (task) => {
    let count = task.assignedUsers?.length || 0;
    task.assignedGroups?.forEach(groupId => {
      const group = groups.find(g => g._id === groupId || g.id === groupId);
      if (group) count += group.members?.length || 0;
    });
    return count;
  };

  const getTaskStatus = (task) => {
    return task.overallStatus || 'pending';
  };

  
  const getUserStatusForTask = (task, userId) => {
    if (task.statusInfo && Array.isArray(task.statusInfo)) {
      const userStatus = task.statusInfo.find(s => 
        s.userId === userId || s.userId?._id === userId || s.userId?.id === userId
      );
      return userStatus?.status || 'pending';
    }
    
    if (task.statusByUser && Array.isArray(task.statusByUser)) {
      const userStatus = task.statusByUser.find(s => 
        s.user === userId || s.user?._id === userId || s.user?.id === userId
      );
      return userStatus?.status || 'pending';
    }
    
    return 'pending';
  };

  
  const getAllAssignedUsersWithStatus = (task) => {
    const assignedUsers = [];
    
    if (task.assignedUsers && Array.isArray(task.assignedUsers)) {
      task.assignedUsers.forEach(user => {
        const userId = user.id || user._id || user;
        const userObj = users.find(u => u.id === userId || u._id === userId);
        if (userObj) {
          assignedUsers.push({
            user: userObj,
            status: getUserStatusForTask(task, userId),
            type: 'direct'
          });
        }
      });
    }
    
    if (task.assignedGroups && Array.isArray(task.assignedGroups)) {
      task.assignedGroups.forEach(groupId => {
        const group = groups.find(g => g._id === groupId || g.id === groupId);
        if (group && group.members) {
          group.members.forEach(memberId => {
            const userObj = users.find(u => u.id === memberId || u._id === memberId);
            if (userObj && !assignedUsers.some(u => 
              (u.user.id === userObj.id || u.user._id === userObj._id)
            )) {
              assignedUsers.push({
                user: userObj,
                status: getUserStatusForTask(task, memberId),
                type: 'group'
              });
            }
          });
        }
      });
    }
    
    return assignedUsers;
  };

  
  const AssignedUsersDisplay = ({ task }) => {
    const [showAllUsers, setShowAllUsers] = useState(false);
    const assignedUsers = getAllAssignedUsersWithStatus(task);
    const totalCount = assignedUsers.length;
    
    if (totalCount === 0) {
      return <span className="AdminTaskManagement-no-users">No users assigned</span>;
    }
    
    
    const displayUsers = showAllUsers ? assignedUsers : assignedUsers.slice(0, 2);
    const remainingCount = totalCount - 2;
    
    return (
      <div className="AdminTaskManagement-assigned-users-container">
        <div className="AdminTaskManagement-assigned-users-list">
          {displayUsers.map((assignedUser, index) => (
            <div key={index} className="AdminTaskManagement-user-badge">
              <span className="AdminTaskManagement-user-initial">
                {assignedUser.user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              <span className="AdminTaskManagement-user-info">
                <span className="AdminTaskManagement-user-name">{assignedUser.user.name}</span>
                
              </span>
            </div>
          ))}
          
          {!showAllUsers && remainingCount > 0 && (
            <button 
              className="AdminTaskManagement-see-more-btn"
              
              title={`Show all ${totalCount} users`}
            >
              +{remainingCount} more
            </button>
          )}
          
          {showAllUsers && (
            <button 
              className="AdminTaskManagement-see-less-btn"
              onClick={() => setShowAllUsers(false)}
            >
              Show less
            </button>
          )}
        </div>
        
        <div className="AdminTaskManagement-assigned-count">
          Total: {totalCount} assigned
        </div>
      </div>
    );
  };

  
  const AdminTaskManagementStatusChip = ({ status }) => {
    const getStatusColor = () => {
      switch(status) {
        case 'pending': return 'warning';
        case 'in-progress': return 'info';
        case 'completed': return 'success';
        case 'rejected': return 'error';
        default: return 'default';
      }
    };

    const getStatusText = () => {
      switch(status) {
        case 'pending': return 'Pending';
        case 'in-progress': return 'In Progress';
        case 'completed': return 'Completed';
        case 'rejected': return 'Rejected';
        default: return status;
      }
    };

    return (
      <span className={`AdminTaskManagement-status-chip AdminTaskManagement-status-${getStatusColor()}`}>
        {getStatusText()}
      </span>
    );
  };

  
  const AdminTaskManagementPriorityChip = ({ priority }) => {
    const safePriority = typeof priority === 'string' ? priority : 'medium';

    const getPriorityColor = () => {
      switch (safePriority) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'default';
      }
    };

    return (
      <span
        className={`AdminTaskManagement-priority-chip AdminTaskManagement-priority-${getPriorityColor()}`}
      >
        {safePriority.charAt(0).toUpperCase() + safePriority.slice(1)}
      </span>
    );
  };

  
  const AdminTaskManagementUserInfoChip = ({ user }) => {
    return (
      <div className="AdminTaskManagement-user-info-chip">
        <div className="AdminTaskManagement-user-info-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="AdminTaskManagement-user-info-details">
          <div className="AdminTaskManagement-user-info-name">{user?.name || 'Unknown'}</div>
          <div className="AdminTaskManagement-user-info-meta">
            <span>Company: {getUserCompanyDisplay(user)}</span>
            <span>Dept: {getUserDepartmentDisplay(user)}</span>
          </div>
        </div>
      </div>
    );
  };

  
  const AdminTaskManagementStatCard = ({ label, value, color, icon: Icon }) => {
    const colors = {
      primary: '#3f51b5',
      warning: '#ff9800',
      info: '#2196f3',
      success: '#4caf50',
      error: '#f44336'
    };

    return (
      <div className="AdminTaskManagement-stat-card" style={{ borderLeftColor: colors[color] || colors.primary }}>
        <div className="AdminTaskManagement-stat-card-content">
          <div className="AdminTaskManagement-stat-icon" style={{ backgroundColor: `${colors[color]}20`, color: colors[color] }}>
            <Icon size={18} />
          </div>
          <div className="AdminTaskManagement-stat-text">
            <div className="AdminTaskManagement-stat-label">{label}</div>
            <div className="AdminTaskManagement-stat-value">{value}</div>
          </div>
        </div>
      </div>
    );
  };

  
  const renderStatusChangeDialog = () => (
    <div className={`AdminTaskManagement-modal ${openStatusDialog ? 'AdminTaskManagement-modal-open' : ''}`}>
      <div className="AdminTaskManagement-modal-content AdminTaskManagement-modal-medium">
        <div className="AdminTaskManagement-modal-header">
          <div className="AdminTaskManagement-modal-title-row">
            <div className="AdminTaskManagement-modal-title-icon">
              <FiUserCheck />
              <h3>Change Task Status</h3>
            </div>
            <button 
              className="AdminTaskManagement-icon-btn"
              onClick={() => setOpenStatusDialog(false)}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-body">
          <div className="AdminTaskManagement-form-container">
            <div className="AdminTaskManagement-form-group">
              <label>Task</label>
              <input
                type="text"
                className="AdminTaskManagement-form-input"
                value={selectedTask?.title || ''}
                disabled
              />
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Select Status *</label>
              <select
                className="AdminTaskManagement-form-select"
                value={statusChange.status}
                onChange={(e) => setStatusChange({ ...statusChange, status: e.target.value })}
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Remarks (Optional)</label>
              <textarea
                className="AdminTaskManagement-form-textarea"
                placeholder="Enter remarks for status change..."
                rows={3}
                value={statusChange.remarks}
                onChange={(e) => setStatusChange({ ...statusChange, remarks: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-footer">
          <button 
            className="AdminTaskManagement-btn" 
            onClick={() => setOpenStatusDialog(false)}
          >
            Cancel
          </button>
          <button
            className="AdminTaskManagement-btn AdminTaskManagement-btn-primary"
            onClick={handleStatusChange}
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );

  
  const renderEnhancedFilters = () => (
    <div className="AdminTaskManagement-filter-section">
      <div className="AdminTaskManagement-filter-stack">
        <div className="AdminTaskManagement-search-input-container">
          <FiSearch className="AdminTaskManagement-search-icon" />
          <input
            type="text"
            className="AdminTaskManagement-search-input"
            placeholder="Search tasks by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="AdminTaskManagement-filter-search-row">
          <button className="AdminTaskManagement-btn AdminTaskManagement-btn-primary" onClick={applyFilters}>
            <FiFilter /> Apply
          </button>
          <button className="AdminTaskManagement-btn AdminTaskManagement-btn-outline" onClick={clearFilters}>
            Clear
          </button>
        </div>

        
        <div className="AdminTaskManagement-date-range-filters">
          <div className="AdminTaskManagement-date-input-container">
            <label>From Date</label>
            <input
              type="datetime-local"
              className="AdminTaskManagement-date-input"
              value={dateRange.startDate ? formatDateForInput(dateRange.startDate) : ''}
              onChange={(e) => setDateRange(prev => ({ 
                ...prev, 
                startDate: e.target.value ? parseDateTimeInput(e.target.value) : null 
              }))}
            />
          </div>
          <div className="AdminTaskManagement-date-input-container">
            <label>To Date</label>
            <input
              type="datetime-local"
              className="AdminTaskManagement-date-input"
              value={dateRange.endDate ? formatDateForInput(dateRange.endDate) : ''}
              onChange={(e) => setDateRange(prev => ({ 
                ...prev, 
                endDate: e.target.value ? parseDateTimeInput(e.target.value) : null 
              }))}
            />
          </div>
        </div>

        
        <div className="AdminTaskManagement-filter-grid">
          <div className="AdminTaskManagement-filter-select-container">
            <label>Status</label>
            <select
              className="AdminTaskManagement-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="AdminTaskManagement-filter-select-container">
            <label>Priority</label>
            <select
              className="AdminTaskManagement-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="AdminTaskManagement-filter-select-container">
            <label>Assigned To</label>
            <select
              className="AdminTaskManagement-filter-select"
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
            >
              <option value="">All Users</option>
              {filteredUsers.map(user => (
                <option key={user.id || user._id} value={user.id || user._id}>
                  {user.name} 
                </option>
              ))}
            </select>
          </div>

          <div className="AdminTaskManagement-filter-select-container">
            <label>Overdue</label>
            <select
              className="AdminTaskManagement-filter-select"
              value={overdueFilter}
              onChange={(e) => setOverdueFilter(e.target.value)}
            >
              <option value="">All Tasks</option>
              <option value="true">Overdue Only</option>
              <option value="false">Not Overdue</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  
  const renderFilteredStatsCards = () => {
    const statsCards = [
      { label: "Total Tasks", value: filteredStats.total, color: "primary", icon: FiCalendar },
      { label: "Pending", value: filteredStats.pending, color: "warning", icon: FiClock },
      { label: "In Progress", value: filteredStats.inProgress, color: "info", icon: FiAlertCircle },
      { label: "Completed", value: filteredStats.completed, color: "success", icon: FiCheckCircle },
      { label: "Rejected", value: filteredStats.rejected, color: "error", icon: FiXCircle },
      { label: "Overdue", value: filteredStats.overdue, color: "error", icon: FiAlertTriangle }
    ];

    return (
      <div className="AdminTaskManagement-stats-grid">
        {statsCards.map((stat, index) => (
          <AdminTaskManagementStatCard
            key={index}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            icon={stat.icon}
          />
        ))}
      </div>
    );
  };

  
  const renderRemarksDialog = () => (
    <div className={`AdminTaskManagement-modal ${openRemarksDialog ? 'AdminTaskManagement-modal-open' : ''}`}>
      <div className="AdminTaskManagement-modal-content AdminTaskManagement-modal-large">
        <div className="AdminTaskManagement-modal-header AdminTaskManagement-modal-info">
          <div className="AdminTaskManagement-modal-title-row">
            <div className="AdminTaskManagement-modal-title-icon">
              <FiMessageSquare />
              <h3>Remarks for: {selectedTask?.title}</h3>
            </div>
            <div className="AdminTaskManagement-modal-subtitle">{remarks.length} remark(s)</div>
          </div>
          <button 
            className="AdminTaskManagement-icon-btn"
            onClick={() => setOpenRemarksDialog(false)}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="AdminTaskManagement-modal-body">
          <div className="AdminTaskManagement-remarks-container">
            
            <div className="AdminTaskManagement-card AdminTaskManagement-card-outline">
              <div className="AdminTaskManagement-card-content">
                <h4>Add New Remark</h4>
                
                
                <textarea
                  className="AdminTaskManagement-remark-textarea"
                  placeholder="Enter your remark here... (Optional if uploading images)"
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  rows={3}
                />

                
                <div className="AdminTaskManagement-image-upload-section">
                  <label>Attach Image (Optional)</label>
                  
                  <div 
                    className="AdminTaskManagement-image-upload-area"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('AdminTaskManagement-remark-image-upload').click()}
                  >
                    <div className="AdminTaskManagement-upload-content">
                      <FiImage size={32} className="AdminTaskManagement-upload-icon" />
                      <div className="AdminTaskManagement-upload-text">
                        Click to upload or drag & drop
                      </div>
                      <div className="AdminTaskManagement-upload-subtext">
                        Supports JPG, PNG, GIF • Max 5MB
                      </div>
                      <button className="AdminTaskManagement-btn AdminTaskManagement-btn-outline AdminTaskManagement-upload-btn">
                        <FiCamera /> Choose Image
                      </button>
                    </div>
                    
                    <input
                      id="AdminTaskManagement-remark-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleRemarkImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

                  
                  {remarkImages.length > 0 && (
                    <div className="AdminTaskManagement-image-preview-container">
                      <label>Selected Image:</label>
                      <div className="AdminTaskManagement-image-preview-grid">
                        {remarkImages.map((image, index) => (
                          <div key={index} className="AdminTaskManagement-image-preview-item">
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              onClick={() => setZoomImage(image.preview)}
                            />
                            <button
                              className="AdminTaskManagement-remove-image-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRemarkImage(index);
                              }}
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                
                <button
                  className="AdminTaskManagement-btn AdminTaskManagement-btn-primary AdminTaskManagement-btn-block"
                  onClick={addRemark}
                  disabled={isUploadingRemark || (!newRemark.trim() && remarkImages.length === 0)}
                >
                  {isUploadingRemark ? 'Uploading...' : 'Add Remark'}
                </button>
              </div>
            </div>

            
            <div className="AdminTaskManagement-remarks-history">
              <h4>Remarks History</h4>
              
              {remarks.length > 0 ? (
                <div className="AdminTaskManagement-remarks-list">
                  {remarks.map((remark, index) => (
                    <div key={index} className="AdminTaskManagement-card AdminTaskManagement-card-outline">
                      <div className="AdminTaskManagement-card-content">
                        <div className="AdminTaskManagement-remark-item">
                          
                          <div className="AdminTaskManagement-remark-header">
                            <div className="AdminTaskManagement-remark-user">
                              <div className="AdminTaskManagement-remark-avatar">
                                {getUserName(remark.user)?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="AdminTaskManagement-remark-user-info">
                                <div className="AdminTaskManagement-remark-user-name">
                                  {getUserName(remark.user)}
                                </div>
                                <div className="AdminTaskManagement-remark-user-details">
                                  {users.find(u => u.id === remark.user || u._id === remark.user)?.role || 'User'} • {new Date(remark.createdAt).toLocaleDateString()} at {' '}
                                  {new Date(remark.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>

                          
                          {remark.text && (
                            <div className="AdminTaskManagement-remark-text">
                              {remark.text}
                            </div>
                          )}

                          
                          {remark.image && (
                            <div className="AdminTaskManagement-remark-image-container">
                              <label>Attached Image:</label>
                              <div className="AdminTaskManagement-remark-image-preview">
                                <img
                                  src={`${API_URL_IMG}/${remark.image}`}
                                  alt="Remark attachment"
                                  onClick={() => setZoomImage(`${API_URL_IMG}/${remark.image}`)}
                                />
                                <button
                                  className="AdminTaskManagement-zoom-image-btn"
                                  onClick={() => setZoomImage(`${API_URL_IMG}/${remark.image}`)}
                                >
                                  <FiZoomIn size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="AdminTaskManagement-card AdminTaskManagement-card-outline AdminTaskManagement-text-center">
                  <div className="AdminTaskManagement-card-content">
                    <FiMessageSquare size={48} className="AdminTaskManagement-empty-icon" />
                    <h5>No remarks yet</h5>
                    <p>Be the first to add a remark for this task</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-footer">
          <button 
            className="AdminTaskManagement-btn" 
            onClick={() => setOpenRemarksDialog(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  
  const renderImageZoomModal = () => (
    <div className={`AdminTaskManagement-modal ${zoomImage ? 'AdminTaskManagement-modal-open' : ''} AdminTaskManagement-modal-zoom`}>
      <div className="AdminTaskManagement-modal-zoom-content">
        <button
          className="AdminTaskManagement-zoom-close-btn"
          onClick={() => setZoomImage(null)}
        >
          <FiX size={20} />
        </button>
        <img
          src={zoomImage}
          alt="Zoomed view"
          className="AdminTaskManagement-zoomed-image"
        />
      </div>
    </div>
  );

  
  const renderActivityLogsDialog = () => (
    <div className={`AdminTaskManagement-modal ${openActivityDialog ? 'AdminTaskManagement-modal-open' : ''}`}>
      <div className="AdminTaskManagement-modal-content AdminTaskManagement-modal-large">
        <div className="AdminTaskManagement-modal-header AdminTaskManagement-modal-primary">
          <div className="AdminTaskManagement-modal-title-row">
            <div className="AdminTaskManagement-modal-title-icon">
              <FiActivity />
              <h3>Activity Logs for: {selectedTask?.title}</h3>
            </div>
            <button 
              className="AdminTaskManagement-icon-btn"
              onClick={() => setOpenActivityDialog(false)}
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="AdminTaskManagement-modal-subtitle">
            {activityLogs.length} activity log(s)
          </div>
        </div>
        <div className="AdminTaskManagement-modal-body">
          {activityLogs.length > 0 ? (
            <div className="AdminTaskManagement-activity-logs">
              {activityLogs.map((log, index) => (
                <div key={index} className="AdminTaskManagement-card AdminTaskManagement-card-outline">
                  <div className="AdminTaskManagement-card-content">
                    <div className="AdminTaskManagement-activity-log">
                      <div className="AdminTaskManagement-activity-header">
                        <div className="AdminTaskManagement-activity-user">
                          <div className="AdminTaskManagement-activity-avatar">
                            {getUserName(log.user)?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="AdminTaskManagement-activity-user-info">
                            <div className="AdminTaskManagement-activity-user-name">{getUserName(log.user)}</div>
                            <div className="AdminTaskManagement-activity-user-role">
                              {users.find(u => u.id === log.user || u._id === log.user)?.role || 'User'}
                            </div>
                          </div>
                        </div>
                        <div className="AdminTaskManagement-activity-date">
                          {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="AdminTaskManagement-activity-description">
                        {log.description || log.action}
                      </div>
                      <div className="AdminTaskManagement-activity-footer">
                        <span className="AdminTaskManagement-activity-tag">{log.action}</span>
                        {log.ipAddress && (
                          <span className="AdminTaskManagement-activity-ip">IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="AdminTaskManagement-text-center">
              <FiActivity size={32} className="AdminTaskManagement-empty-icon" />
              <h5>No activity logs found</h5>
              <p>No activity logs found for this task</p>
            </div>
          )}
        </div>
        <div className="AdminTaskManagement-modal-footer">
          <button 
            className="AdminTaskManagement-btn" 
            onClick={() => setOpenActivityDialog(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  
  const renderUserStatusDialog = () => (
    <div className={`AdminTaskManagement-modal ${openUserStatusDialog ? 'AdminTaskManagement-modal-open' : ''}`}>
      <div className="AdminTaskManagement-modal-content AdminTaskManagement-modal-medium">
        <div className="AdminTaskManagement-modal-header AdminTaskManagement-modal-info">
          <div className="AdminTaskManagement-modal-title-row">
            <div className="AdminTaskManagement-modal-title-icon">
              <FiUsers />
              <h3>User Statuses for: {selectedTask?.title}</h3>
            </div>
            <button 
              className="AdminTaskManagement-icon-btn"
              onClick={() => setOpenUserStatusDialog(false)}
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="AdminTaskManagement-modal-subtitle">
            {taskUserStatuses.length} user(s)
          </div>
        </div>
        <div className="AdminTaskManagement-modal-body">
          <div className="AdminTaskManagement-user-statuses">
            {taskUserStatuses.length > 0 ? (
              taskUserStatuses.map((userStatus, index) => {
                const user = users.find(u => 
                  u.id === userStatus.userId || 
                  u._id === userStatus.userId ||
                  (userStatus.user && (u.id === userStatus.user.id || u._id === userStatus.user._id))
                );
                
                return (
                  <div key={index} className="AdminTaskManagement-card AdminTaskManagement-card-outline">
                    <div className="AdminTaskManagement-card-content">
                      <div className="AdminTaskManagement-user-status-item">
                        <div className="AdminTaskManagement-user-status-header">
                          <div className="AdminTaskManagement-user-status-user">
                            <div className="AdminTaskManagement-user-status-avatar">
                              {user?.name?.charAt(0)?.toUpperCase() || userStatus.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="AdminTaskManagement-user-status-info">
                              <div className="AdminTaskManagement-user-status-name">
                                {user?.name || userStatus.name || 'Unknown User'}
                              </div>
                              <div className="AdminTaskManagement-user-status-details">
                                 • {user?.email || userStatus.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <AdminTaskManagementStatusChip status={userStatus.status} />
                        </div>
                        {userStatus.updatedAt && (
                          <div className="AdminTaskManagement-user-status-updated">
                            Last updated: {new Date(userStatus.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="AdminTaskManagement-text-center">
                <FiUsers size={32} className="AdminTaskManagement-empty-icon" />
                <h5>No user status information available</h5>
                <p>No user status data found for this task</p>
              </div>
            )}
          </div>
        </div>
        <div className="AdminTaskManagement-modal-footer">
          <button 
            className="AdminTaskManagement-btn" 
            onClick={() => setOpenUserStatusDialog(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  
  useEffect(() => {
    if (openCreateDialog) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const defaultDateTime = formatDateForInput(now);
      setCreateDueDateTime(defaultDateTime);
      setNewTask(prev => ({ ...prev, dueDateTime: defaultDateTime }));
    }
  }, [openCreateDialog]);

  
  const renderCreateTaskDialog = () => (
    <div className={`AdminTaskManagement-modal ${openCreateDialog ? 'AdminTaskManagement-modal-open' : ''}`}>
      <div className="AdminTaskManagement-modal-content AdminTaskManagement-modal-large">
        <div className="AdminTaskManagement-modal-header">
          <div className="AdminTaskManagement-modal-title-row">
            <h3>Create New Task</h3>
            <button 
              className="AdminTaskManagement-icon-btn"
              onClick={() => setOpenCreateDialog(false)}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-body">
          <div className="AdminTaskManagement-form-container">
            
            <div className="AdminTaskManagement-form-group">
              <div className="AdminTaskManagement-role-hint">
                {isOwner() ? (
                  <span className="AdminTaskManagement-role-hint-admin">
                    <FiUserCheck /> Owner: You can assign tasks to any user in the company
                  </span>
                ) : (
                  <span className="AdminTaskManagement-role-hint-employee">
                    <FiUsers /> Employee: You can only assign tasks to users in your department
                  </span>
                )}
              </div>
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Task Title *</label>
              <input
                type="text"
                className="AdminTaskManagement-form-input"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Description *</label>
              <textarea
                className="AdminTaskManagement-form-textarea"
                placeholder="Enter task description"
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Due Date & Time *</label>
              <input
                type="datetime-local"
                className="AdminTaskManagement-form-input"
                value={newTask.dueDateTime || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewTask({ ...newTask, dueDateTime: value });
                }}
                min={new Date().toISOString().slice(0, 16)}
              />
              <small className="AdminTaskManagement-form-hint">
                Please select a future date and time
              </small>
            </div>

            <div className="AdminTaskManagement-form-row">
              <div className="AdminTaskManagement-form-group">
                <label>Priority</label>
                <select
                  className="AdminTaskManagement-form-select"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="AdminTaskManagement-form-group">
                <label>Priority Days</label>
                <input
                  type="text"
                  className="AdminTaskManagement-form-input"
                  placeholder="Enter priority days"
                  value={newTask.priorityDays}
                  onChange={(e) => setNewTask({ ...newTask, priorityDays: e.target.value })}
                />
              </div>
            </div>

            
            <div className="AdminTaskManagement-form-group">
              <label>
                Assign to Users 
                {isOwner() ? (
                  <span className="AdminTaskManagement-role-badge">(All Company Users)</span>
                ) : (
                  <span className="AdminTaskManagement-role-badge">(Same Department Only)</span>
                )}
              </label>
              <div className="AdminTaskManagement-multi-select-container">
                <div className="AdminTaskManagement-select-search-bar">
                  <FiSearch className="AdminTaskManagement-select-search-icon" />
                  <input
                    type="text"
                    className="AdminTaskManagement-select-search-input"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  {userSearch && (
                    <button className="AdminTaskManagement-select-search-clear" onClick={() => setUserSearch('')}>
                      <FiX size={14} />
                    </button>
                  )}
                </div>
                <div className="AdminTaskManagement-multi-select-options">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div key={user.id || user._id} className="AdminTaskManagement-multi-select-option">
                        <input
                          type="checkbox"
                          id={`AdminTaskManagement-user-${user.id || user._id}`}
                          checked={newTask.assignedUsers.includes(user.id || user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTask({
                                ...newTask,
                                assignedUsers: [...newTask.assignedUsers, user.id || user._id]
                              });
                            } else {
                              setNewTask({
                                ...newTask,
                                assignedUsers: newTask.assignedUsers.filter(id => id !== (user.id || user._id))
                              });
                            }
                          }}
                        />
                        <label htmlFor={`AdminTaskManagement-user-${user.id || user._id}`} className="AdminTaskManagement-multi-select-label">
                          <AdminTaskManagementUserInfoChip user={user} />
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="AdminTaskManagement-multi-select-empty">
                      <div className="AdminTaskManagement-empty-state">
                        <FiUsers size={32} className="AdminTaskManagement-empty-icon" />
                        <h5>No users available</h5>
                        <p>
                          {isOwner() 
                            ? 'No other users found in your company' 
                            : 'No other users found in your department'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {newTask.assignedUsers.length > 0 && (
                <div className="AdminTaskManagement-selected-chips">
                  {newTask.assignedUsers.map(value => {
                    const user = users.find(u => u.id === value || u._id === value);
                    return user ? (
                      <span key={value} className="AdminTaskManagement-selected-chip">
                        {user.name} {!isOwner() && getUserDepartmentDisplay(user) && `(${getUserDepartmentDisplay(user)})`}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            
            <div className="AdminTaskManagement-form-group">
              <label>Assign to Groups</label>
              <div className="AdminTaskManagement-multi-select-container">
                <div className="AdminTaskManagement-select-search-bar">
                  <FiSearch className="AdminTaskManagement-select-search-icon" />
                  <input
                    type="text"
                    className="AdminTaskManagement-select-search-input"
                    placeholder="Search groups..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                  />
                  {groupSearch && (
                    <button className="AdminTaskManagement-select-search-clear" onClick={() => setGroupSearch('')}>
                      <FiX size={14} />
                    </button>
                  )}
                </div>
                <div className="AdminTaskManagement-multi-select-options">
                  {filteredGroups.map((group) => (
                    <div key={group._id} className="AdminTaskManagement-multi-select-option">
                      <input
                        type="checkbox"
                        id={`AdminTaskManagement-group-${group._id}`}
                        checked={newTask.assignedGroups.includes(group._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTask({
                              ...newTask,
                              assignedGroups: [...newTask.assignedGroups, group._id]
                            });
                          } else {
                            setNewTask({
                              ...newTask,
                              assignedGroups: newTask.assignedGroups.filter(id => id !== group._id)
                            });
                          }
                        }}
                      />
                      <label htmlFor={`AdminTaskManagement-group-${group._id}`} className="AdminTaskManagement-multi-select-label">
                        <div className="AdminTaskManagement-multi-select-text">
                          <div className="AdminTaskManagement-multi-select-primary">{group.name}</div>
                          <div className="AdminTaskManagement-multi-select-secondary">
                            <span>{group.description}</span>
                            <span className="AdminTaskManagement-separator">•</span>
                            <span>{group.members?.length || 0} members</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                  {filteredGroups.length === 0 && (
                    <div className="AdminTaskManagement-multi-select-empty">
                      No groups found
                    </div>
                  )}
                </div>
              </div>
              {newTask.assignedGroups.length > 0 && (
                <div className="AdminTaskManagement-selected-chips">
                  {newTask.assignedGroups.map(value => {
                    const group = groups.find(g => g._id === value);
                    return group ? (
                      <span key={value} className="AdminTaskManagement-selected-chip">
                        {group.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Attachments (Optional)</label>
              <div className="AdminTaskManagement-file-upload">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setNewTask({ ...newTask, files: e.target.files })}
                />
                <div className="AdminTaskManagement-file-upload-hint">
                  <FiPaperclip /> You can upload multiple files
                </div>
              </div>
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Voice Note (Optional)</label>
              <div className="AdminTaskManagement-file-upload">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setNewTask({ ...newTask, voiceNote: e.target.files[0] })}
                />
                <div className="AdminTaskManagement-file-upload-hint">
                  <FiMic /> Record or upload voice note
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-footer">
          <button 
            className="AdminTaskManagement-btn" 
            onClick={() => setOpenCreateDialog(false)}
            disabled={isCreatingTask}
          >
            Cancel
          </button>
          <button
            className="AdminTaskManagement-btn AdminTaskManagement-btn-primary"
            onClick={handleCreateTask}
            disabled={isCreatingTask}
          >
            {isCreatingTask ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );

  
  const renderEditTaskDialog = () => (
    <div className={`AdminTaskManagement-modal ${openEditDialog ? 'AdminTaskManagement-modal-open' : ''}`}>
      <div className="AdminTaskManagement-modal-content AdminTaskManagement-modal-large">
        <div className="AdminTaskManagement-modal-header">
          <div className="AdminTaskManagement-modal-title-row">
            <h3>Edit Task</h3>
            <button 
              className="AdminTaskManagement-icon-btn"
              onClick={() => setOpenEditDialog(false)}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-body">
          <div className="AdminTaskManagement-form-container">
            <div className="AdminTaskManagement-form-group">
              <label>Task Title *</label>
              <input
                type="text"
                className="AdminTaskManagement-form-input"
                placeholder="Enter task title"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              />
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Description *</label>
              <textarea
                className="AdminTaskManagement-form-textarea"
                placeholder="Enter task description"
                rows={3}
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              />
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Due Date & Time *</label>
              <input
                type="datetime-local"
                className="AdminTaskManagement-form-input"
                value={editTask.dueDateTime || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditTask({ ...editTask, dueDateTime: value });
                }}
              />
            </div>

            <div className="AdminTaskManagement-form-row">
              <div className="AdminTaskManagement-form-group">
                <label>Priority</label>
                <select
                  className="AdminTaskManagement-form-select"
                  value={editTask.priority}
                  onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="AdminTaskManagement-form-group">
                <label>Priority Days</label>
                <input
                  type="text"
                  className="AdminTaskManagement-form-input"
                  placeholder="Enter priority days"
                  value={editTask.priorityDays}
                  onChange={(e) => setEditTask({ ...editTask, priorityDays: e.target.value })}
                />
              </div>
            </div>

            
            <div className="AdminTaskManagement-form-group">
              <label>
                Assign to Users 
                {isOwner() ? (
                  <span className="AdminTaskManagement-role-badge">(All Company Users)</span>
                ) : (
                  <span className="AdminTaskManagement-role-badge">(Same Department Only)</span>
                )}
              </label>
              <div className="AdminTaskManagement-multi-select-container">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div key={user.id || user._id} className="AdminTaskManagement-checkbox-option">
                      <input
                        type="checkbox"
                        id={`AdminTaskManagement-edit-user-${user.id || user._id}`}
                        checked={editTask.assignedUsers.includes(user.id || user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditTask({
                              ...editTask,
                              assignedUsers: [...editTask.assignedUsers, user.id || user._id]
                            });
                          } else {
                            setEditTask({
                              ...editTask,
                              assignedUsers: editTask.assignedUsers.filter(id => id !== (user.id || user._id))
                            });
                          }
                        }}
                      />
                      <label htmlFor={`AdminTaskManagement-edit-user-${user.id || user._id}`}>
                        <AdminTaskManagementUserInfoChip user={user} />
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="AdminTaskManagement-empty-state">
                    <FiUsers size={32} className="AdminTaskManagement-empty-icon" />
                    <h5>No users available</h5>
                    <p>
                      {isOwner() 
                        ? 'No other users found in your company' 
                        : 'No other users found in your department'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            
            <div className="AdminTaskManagement-form-group">
              <label>Assign to Groups</label>
              <div className="AdminTaskManagement-multi-select-container">
                {groups.map((group) => (
                  <div key={group._id} className="AdminTaskManagement-checkbox-option">
                    <input
                      type="checkbox"
                      id={`AdminTaskManagement-edit-group-${group._id}`}
                      checked={editTask.assignedGroups.includes(group._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditTask({
                            ...editTask,
                            assignedGroups: [...editTask.assignedGroups, group._id]
                          });
                        } else {
                          setEditTask({
                            ...editTask,
                            assignedGroups: editTask.assignedGroups.filter(id => id !== group._id)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`AdminTaskManagement-edit-group-${group._id}`}>
                      {group.name} ({group.members?.length || 0} members)
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-footer">
          <button 
            className="AdminTaskManagement-btn" 
            onClick={() => setOpenEditDialog(false)}
            disabled={isUpdatingTask}
          >
            Cancel
          </button>
          <button
            className="AdminTaskManagement-btn AdminTaskManagement-btn-primary"
            onClick={handleEditTask}  
            disabled={isUpdatingTask}
          >
            {isUpdatingTask ? 'Updating...' : 'Update Task'}
          </button>
        </div>
      </div>
    </div>
  );

  
  const renderGroupDialog = () => (
    <div className={`AdminTaskManagement-modal ${openGroupDialog ? 'AdminTaskManagement-modal-open' : ''}`}>
      <div className="AdminTaskManagement-modal-content AdminTaskManagement-modal-medium">
        <div className="AdminTaskManagement-modal-header">
          <div className="AdminTaskManagement-modal-title-row">
            <h3>{editingGroup ? 'Edit Group' : 'Create New Group'}</h3>
            <button 
              className="AdminTaskManagement-icon-btn"
              onClick={() => {
                setOpenGroupDialog(false);
                resetGroupForm();
              }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-body">
          <div className="AdminTaskManagement-form-container">
            <div className="AdminTaskManagement-form-group">
              <label>Group Name *</label>
              <input
                type="text"
                className="AdminTaskManagement-form-input"
                placeholder="Enter group name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              />
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Description *</label>
              <textarea
                className="AdminTaskManagement-form-textarea"
                placeholder="Enter group description"
                rows={3}
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              />
            </div>

            <div className="AdminTaskManagement-form-group">
              <label>Select Members *</label>
              <div className="AdminTaskManagement-multi-select-container">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div key={user.id || user._id} className="AdminTaskManagement-checkbox-option">
                      <input
                        type="checkbox"
                        id={`AdminTaskManagement-group-member-${user.id || user._id}`}
                        checked={newGroup.members.includes(user.id || user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewGroup({
                              ...newGroup,
                              members: [...newGroup.members, user.id || user._id]
                            });
                          } else {
                            setNewGroup({
                              ...newGroup,
                              members: newGroup.members.filter(id => id !== (user.id || user._id))
                            });
                          }
                        }}
                      />
                      <label htmlFor={`AdminTaskManagement-group-member-${user.id || user._id}`}>
                        <AdminTaskManagementUserInfoChip user={user} />
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="AdminTaskManagement-empty-state">
                    <FiUsers size={32} className="AdminTaskManagement-empty-icon" />
                    <h5>No users available</h5>
                    <p>No users found to add to group</p>
                  </div>
                )}
              </div>
              {newGroup.members.length > 0 && (
                <div className="AdminTaskManagement-selected-chips">
                  <div className="AdminTaskManagement-selected-label">{newGroup.members.length} member(s) selected</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="AdminTaskManagement-modal-footer">
          <button 
            className="AdminTaskManagement-btn" 
            onClick={() => {
              setOpenGroupDialog(false);
              resetGroupForm();
            }}
            disabled={isCreatingGroup}
          >
            Cancel
          </button>
          <button
            className="AdminTaskManagement-btn AdminTaskManagement-btn-primary"
            onClick={handleCreateGroup}
            disabled={isCreatingGroup}
          >
            {isCreatingGroup ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );

  
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (initialAuthCheck) {
      if (authError) {
        void 0;
      } else if (userId) {
        fetchAllData(page, rowsPerPage);
      }
    }
  }, [authError, initialAuthCheck, userId, page, rowsPerPage]);

  
  useEffect(() => {
    if (authError && initialAuthCheck) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authError, initialAuthCheck, navigate]);

  
  const renderTasksTable = () => {
    if (loading && tasks.length === 0) {
      return <CIISLoader />;
    }

    if (tasks.length === 0) {
      return (
        <div className="AdminTaskManagement-empty-state">
          <FiCalendar size={48} className="AdminTaskManagement-empty-icon" />
          <h4>No tasks found</h4>
          <p>Try adjusting your filters or create a new task</p>
          <button 
            className="AdminTaskManagement-btn AdminTaskManagement-btn-primary"
            onClick={() => setOpenCreateDialog(true)}
          >
            <FiPlus /> Create New Task
          </button>
        </div>
      );
    }

    return (
      <div className="AdminTaskManagement-table-responsive">
        <table className="AdminTaskManagement-table">
          <thead>
            <tr>
              <th className="AdminTaskManagement-serial-column">S.No.</th>
              <th>Task</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={task._id} className={isOverdue(task) ? 'AdminTaskManagement-task-overdue' : ''}>
                <td className="AdminTaskManagement-serial-cell">
                  {page * rowsPerPage + index + 1}
                </td>
                <td>
                  <div className="AdminTaskManagement-task-title-cell">
                    <div className="AdminTaskManagement-task-title">{task.title}</div>
                    <div className="AdminTaskManagement-task-description">{task.description}</div>
                  </div>
                </td>
                <td>
                  <AdminTaskManagementStatusChip status={getTaskStatus(task)} />
                </td>
                <td>
                  <AdminTaskManagementPriorityChip priority={task.priority} />
                </td>
                <td>
                  <div className="AdminTaskManagement-due-date-cell">
                    <div>{new Date(task.dueDateTime || task.dueDate).toLocaleDateString()}</div>
                    <div className="AdminTaskManagement-due-time">
                      {new Date(task.dueDateTime || task.dueDate).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    {isOverdue(task) && (
                      <div className="AdminTaskManagement-overdue-badge">
                        <FiAlertTriangle size={12} /> Overdue
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  
                  <AssignedUsersDisplay task={task} />
                </td>
                <td>
                  <div className="AdminTaskManagement-action-buttons">
                    <button
                      className="AdminTaskManagement-icon-btn AdminTaskManagement-btn-sm"
                      onClick={() => openEditTaskDialog(task)}
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="AdminTaskManagement-icon-btn AdminTaskManagement-btn-sm"
                      onClick={() => fetchRemarks(task._id)}
                      title="Remarks"
                    >
                      <FiMessageSquare />
                    </button>
                    <button
                      className="AdminTaskManagement-icon-btn AdminTaskManagement-btn-sm"
                      onClick={() => fetchActivityLogs(task._id)}
                      title="Activity Logs"
                    >
                      <FiActivity />
                    </button>
                    <button
                      className="AdminTaskManagement-icon-btn AdminTaskManagement-btn-sm"
                      onClick={() => fetchUserStatuses(task)}
                      title="User Statuses"
                    >
                      <FiUsers />
                    </button>
                    <button
                      className="AdminTaskManagement-icon-btn AdminTaskManagement-btn-sm"
                      onClick={() => openStatusChangeDialog(task)}
                      title="Change Status"
                    >
                      <FiCheckCircle />
                    </button>
                    <button
                      className="AdminTaskManagement-icon-btn AdminTaskManagement-btn-sm AdminTaskManagement-btn-danger"
                      onClick={() => handleDeleteTask(task._id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        
        <div className="AdminTaskManagement-pagination">
          <div className="AdminTaskManagement-pagination-info">
            Showing {tasks.length} of {totalTasks} tasks
          </div>
          <div className="AdminTaskManagement-pagination-controls">
            <button
              className="AdminTaskManagement-btn AdminTaskManagement-btn-outline"
              onClick={() => handleChangePage(null, page - 1)}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="AdminTaskManagement-pagination-page">
              Page {page + 1} of {Math.ceil(totalTasks / rowsPerPage)}
            </span>
            <button
              className="AdminTaskManagement-btn AdminTaskManagement-btn-outline"
              onClick={() => handleChangePage(null, page + 1)}
              disabled={page >= Math.ceil(totalTasks / rowsPerPage) - 1}
            >
              Next
            </button>
            <select
              className="AdminTaskManagement-select"
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  
  const renderSnackbar = () => (
    <div className={`AdminTaskManagement-snackbar ${snackbar.open ? 'AdminTaskManagement-snackbar-open' : ''} AdminTaskManagement-snackbar-${snackbar.severity}`}>
      <div className="AdminTaskManagement-snackbar-content">
        <div className="AdminTaskManagement-snackbar-message">
          {snackbar.message}
        </div>
        <button
          className="AdminTaskManagement-snackbar-close"
          onClick={() => setSnackbar({ ...snackbar, open: false })}
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="AdminTaskManagement-container">
      
      <div className="AdminTaskManagement-header">
        <div className="AdminTaskManagement-header-content">
          <div className="AdminTaskManagement-header-title">
            <h2>Admin Task Management</h2>
            <div className="AdminTaskManagement-header-subtitle">
              Manage and assign tasks to users and groups
            </div>
          </div>
          <div className="AdminTaskManagement-header-actions">
            {companyRole && (
              <div className="AdminTaskManagement-user-info">
                
              </div>
            )}
            <button 
              className="AdminTaskManagement-btn AdminTaskManagement-btn-primary"
              onClick={() => setOpenCreateDialog(true)}
            >
              <FiPlus /> Create Task
            </button>
            <button 
              className="AdminTaskManagement-btn"
              onClick={() => setOpenGroupDialog(true)}
            >
              <FiUsers /> Manage Groups
            </button>
          </div>
        </div>
      </div>

      
      {authError && initialAuthCheck && (
        <div className="AdminTaskManagement-auth-error">
          <div className="AdminTaskManagement-auth-error-content">
            <FiAlertCircle size={24} />
            <div className="AdminTaskManagement-auth-error-text">
              <h4>Authentication Error</h4>
              <p>Please login to access this page.</p>
              <p>Redirecting to login...</p>
            </div>
          </div>
        </div>
      )}

      
      {!authError && (
        <>
          
          {renderFilteredStatsCards()}
          
          
          {renderEnhancedFilters()}
          
          
          <div className="AdminTaskManagement-card">
            <div className="AdminTaskManagement-card-header">
              <div className="AdminTaskManagement-card-title">
                <FiCalendar /> Tasks ({filteredStats.total})
              </div>
              <button 
                className="AdminTaskManagement-icon-btn"
                onClick={() => fetchAllData(page, rowsPerPage)}
                disabled={loading}
              >
                <FiRefreshCw className={loading ? 'AdminTaskManagement-spin' : ''} />
              </button>
            </div>
            <div className="AdminTaskManagement-card-content">
              {renderTasksTable()}
            </div>
          </div>
        </>
      )}

      
      {renderCreateTaskDialog()}
      {renderEditTaskDialog()}
      {renderGroupDialog()}
      {renderStatusChangeDialog()}
      {renderRemarksDialog()}
      {renderActivityLogsDialog()}
      {renderUserStatusDialog()}
      {renderImageZoomModal()}
      
      
      {renderSnackbar()}
    </div>
  );
};

export default AdminTaskManagement;
