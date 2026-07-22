import React, { useEffect, useState, useRef } from 'react';
import axios from '../../utils/axiosConfig';
import { API_URL_IMG } from '../../config';
import '../Css/MyTaskManagement.css';

const createEmptyCheckpoint = () => ({ title: '', completed: false });

const getCleanCheckpoints = (checkpoints = []) => (
  Array.isArray(checkpoints)
    ? checkpoints
        .map(item => ({ title: String(item?.title || '').trim(), completed: Boolean(item?.completed) }))
        .filter(item => item.title)
    : []
);

const MyTaskManagement = () => {
  const [tab, setTab] = useState(0);
  const [myTasksGrouped, setMyTasksGrouped] = useState({});
  const [assignedTasksGrouped, setAssignedTasksGrouped] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [remarksDialog, setRemarksDialog] = useState({ open: false, taskId: null, remarks: [] });
  const [newRemark, setNewRemark] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityDialog, setActivityDialog] = useState({ open: false, taskId: null });
  const [taskManagementDialog, setTaskManagementDialog] = useState({ open: false, task: null });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    taskId: null,
    newStatus: '',
    remarks: '',
    selectedUserId: null
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDateTime: '',
    assignedUsers: [],
    assignedGroups: [],
    priorityDays: '1',
    priority: 'medium',
    files: null,
    voiceNote: null,
    repeatPattern: 'none',
    repeatDays: [],
    checkpoints: []
  });
  const [newGroup, setNewGroup] = useState({
    name: '', description: '', members: []
  });
  const [editingGroup, setEditingGroup] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0
  });
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);
  const voiceNoteInputRef = useRef(null);
  const addCheckpoint = () => {
    setNewTask(prev => ({ ...prev, checkpoints: [...(prev.checkpoints || []), createEmptyCheckpoint()] }));
  };
  const updateCheckpoint = (index, title) => {
    setNewTask(prev => ({
      ...prev,
      checkpoints: (prev.checkpoints || []).map((item, itemIndex) => itemIndex === index ? { ...item, title } : item)
    }));
  };
  const removeCheckpoint = (index) => {
    setNewTask(prev => ({ ...prev, checkpoints: (prev.checkpoints || []).filter((_, itemIndex) => itemIndex !== index) }));
  };

  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('No user data found in localStorage');
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Please log in to access task management',
          severity: 'error'
        });
        return;
      }

      const user = JSON.parse(userStr);
      const storedUserId = user?._id || user?.id;
      if (!user || !storedUserId) {
        console.error('Invalid user data structure:', user);
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Invalid user data. Please log in again.',
          severity: 'error'
        });
        return;
      }

      setUserId(storedUserId); 
      setAuthError(false);
      void 0;
    } catch (error) {
      console.error('Error parsing user data:', error);
      setAuthError(true);
      setSnackbar({
        open: true,
        message: 'Error loading user data. Please log in again.',
        severity: 'error'
      });
    }
  };

  const fetchNotifications = async () => {
    if (authError || !userId) return;
    
    try {
      const res = await axios.get('/task/notifications/all');
      setNotifications(res.data.notifications || []);
      setUnreadNotificationCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(`/task/notifications/${notificationId}/read`);
      fetchNotifications();
      setSnackbar({ open: true, message: 'Notification marked as read', severity: 'success' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.patch('/task/notifications/read-all');
      fetchNotifications();
      setSnackbar({ open: true, message: 'All notifications marked as read', severity: 'success' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const fetchTaskRemarks = async (taskId) => {
    try {
      const isSelf = Object.values(myTasksGrouped).flat().some(t => t._id === taskId);
      const endpoint = isSelf ? `/tasks/self/${taskId}/remarks` : `/tasks/assigned/${taskId}/remarks`;
      const res = await axios.get(endpoint);
      setRemarksDialog({ 
        open: true, 
        taskId, 
        remarks: res.data.remarks || [] 
      });
    } catch (error) {
      console.error('Error fetching remarks:', error);
      setSnackbar({ open: true, message: 'Failed to load remarks', severity: 'error' });
    }
  };

  const addRemark = async (taskId) => {
    if (!newRemark.trim()) {
      setSnackbar({ open: true, message: 'Please enter a remark', severity: 'warning' });
      return;
    }
    
    try {
      const isSelf = Object.values(myTasksGrouped).flat().some(t => t._id === taskId);
      const endpoint = isSelf ? `/tasks/self/${taskId}/remarks` : `/tasks/assigned/${taskId}/remarks`;
      await axios.post(endpoint, { text: newRemark });
      setNewRemark('');
      fetchTaskRemarks(taskId);
      setSnackbar({ open: true, message: 'Remark added successfully', severity: 'success' });
    } catch (error) {
      console.error('Error adding remark:', error);
      setSnackbar({ open: true, message: 'Failed to add remark', severity: 'error' });
    }
  };

  const fetchActivityLogs = async (taskId) => {
    try {
      const res = await axios.get(`/task/${taskId}/activity-logs`);
      setActivityLogs(res.data.logs || []);
      setActivityDialog({ open: true, taskId });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setSnackbar({ open: true, message: 'Failed to load activity logs', severity: 'error' });
    }
  };

  const updateTask = async (taskId, updateData) => {
    try {
      const formData = new FormData();
      
      Object.keys(updateData).forEach(key => {
        if (key !== 'files' && key !== 'voiceNote' && updateData[key] !== undefined) {
          if (key === 'dueDateTime' && updateData[key]) {
            formData.append(key, new Date(updateData[key]).toISOString());
          } else if (key === 'assignedUsers' || key === 'assignedGroups') {
            formData.append(key, JSON.stringify(updateData[key]));
          } else {
            formData.append(key, updateData[key]);
          }
        }
      });

      if (updateData.files) {
        for (let i = 0; i < updateData.files.length; i++) {
          formData.append('files', updateData.files[i]);
        }
      }

      if (updateData.voiceNote) {
        formData.append('voiceNote', updateData.voiceNote);
      }

      const response = await axios.put(`/tasks/self/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setTaskManagementDialog({ open: false, task: null });
      setEditTaskData(null);
      fetchMyTasks();
      fetchAssignedTasks();
      fetchNotifications();
      setSnackbar({ open: true, message: 'Task updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating task:', error);
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.error || 'Failed to update task', 
        severity: 'error' 
      });
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/tasks/self/${taskId}`);
      setTaskManagementDialog({ open: false, task: null });
      fetchMyTasks();
      fetchAssignedTasks();
      fetchNotifications();
      setSnackbar({ open: true, message: 'Task deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.error || 'Failed to delete task', 
        severity: 'error' 
      });
    }
  };

  const handleStatusChange = async (taskId, newStatus, remarks = '', selectedUserId = null) => {
    if (authError || !userId) {
      setSnackbar({
        open: true,
        message: 'Please log in to update task status',
        severity: 'error'
      });
      return;
    }

    try {
      let task;
      try {
        const allMyTasks = Object.values(myTasksGrouped).flat();
        task = allMyTasks.find(t => t._id === taskId);
        
        if (!task) {
          const allAssignedTasks = Object.values(assignedTasksGrouped).flat();
          task = allAssignedTasks.find(t => t._id === taskId);
        }
      } catch (error) {
        console.error('Error finding task:', error);
      }

      if (!task) {
        setSnackbar({
          open: true,
          message: 'Task not found',
          severity: 'error'
        });
        return;
      }

      const isTaskCreator = task.createdBy === userId || task.createdBy?._id === userId;
      const isAssignedUser = task.assignedUsers?.some(assignedUserId => 
        assignedUserId === userId || assignedUserId._id === userId
      );

      let finalUserId = userId;
      let finalRemarks = remarks;

      if (isTaskCreator) {
        if (selectedUserId) {
          finalUserId = selectedUserId;
          finalRemarks = remarks || `Status changed to ${newStatus} by task creator`;
        } else if (task.assignedUsers && task.assignedUsers.length > 1) {
          setStatusChangeDialog({
            open: true,
            taskId,
            newStatus,
            remarks: remarks || '',
            selectedUserId: null
          });
          return;
        } else {
          finalRemarks = remarks || `Status changed to ${newStatus} by task creator`;
        }
      } else if (isAssignedUser) {
        finalRemarks = remarks || `Status changed to ${newStatus}`;
      } else {
        setSnackbar({
          open: true,
          message: 'You are not authorized to update status for this task',
          severity: 'error'
        });
        return;
      }

      const isSelf = Object.values(myTasksGrouped).flat().some(t => t._id === taskId);
      const endpoint = isSelf ? `/tasks/self/${taskId}/status` : `/tasks/assigned/${taskId}/status`;

      await axios.patch(endpoint, { 
        status: newStatus, 
        remarks: finalRemarks,
        userId: finalUserId
      });

      await fetchMyTasks();
      await fetchAssignedTasks();
      await fetchNotifications();
      
      setSnackbar({ 
        open: true, 
        message: 'Status updated successfully', 
        severity: 'success' 
      });

    } catch (err) {
      console.error("❌ Error in handleStatusChange:", err.response || err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: err?.response?.data?.error || 'Failed to update status', 
          severity: 'error' 
        });
      }
    }
  };

  const getUserStatusForTask = (task, userId) => {
    const userStatus = task.statusByUser?.find(s => 
      s.user === userId || s.user?._id === userId
    );
    return userStatus?.status || 'pending';
  };

  const getAllUsersStatus = (task) => {
    if (!task.assignedUsers || !task.statusByUser) return [];
    
    return task.assignedUsers.map(assignedUserId => {
      const userStatus = task.statusByUser.find(s => 
        s.user === assignedUserId || s.user?._id === assignedUserId
      );
      const user = users.find(u => u._id === assignedUserId);
      
      return {
        userId: assignedUserId,
        userName: user?.name || 'Unknown User',
        userRole: user?.role || 'N/A',
        status: userStatus?.status || 'pending',
        updatedAt: userStatus?.updatedAt || task.createdAt
      };
    });
  };

  const calculateStats = (tasks) => {
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let rejected = 0;

    Object.values(tasks).forEach(dateTasks => {
      dateTasks.forEach(task => {
        total++;
        const myStatus = getUserStatusForTask(task, userId);

        switch (myStatus) {
          case 'pending':
            pending++;
            break;
          case 'in-progress':
            inProgress++;
            break;
          case 'completed':
            completed++;
            break;
          case 'rejected':
            rejected++;
            break;
        }
      });
    });

    setStats({ total, pending, inProgress, completed, rejected });
  };

  const fetchAssignableData = async () => {
    if (authError || !userId) {
      void 0;
      return;
    }

    try {
      const [usersRes, groupsRes] = await Promise.all([
        axios.get('/task/assignable-users'),
        axios.get('/groups')
      ]);

      setUsers(Array.isArray(usersRes.data.users) ? usersRes.data.users : []);
      setGroups(Array.isArray(groupsRes.data.groups) ? groupsRes.data.groups : []);
    } catch (error) {
      console.error('Error fetching assignable data:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      }
      setUsers([]);
      setGroups([]);
    }
  };

  const fetchMyTasks = async () => {
    if (authError || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = statusFilter ? `/tasks/self?status=${statusFilter}` : '/tasks/self';
      const res = await axios.get(url);
      setMyTasksGrouped(res.data.groupedTasks || {});
      if (tab === 0) calculateStats(res.data.groupedTasks || {});
    } catch (err) {
      console.error('Error fetching my tasks:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      } else {
        setSnackbar({ open: true, message: 'Failed to load tasks', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedTasks = async () => {
    if (authError || !userId) return;

    try {
      const res = await axios.get('/tasks/assigned/to-me');
      setAssignedTasksGrouped(res.data.groupedTasks || {});
      if (tab === 1) calculateStats(res.data.groupedTasks || {});
    } catch (err) {
      console.error('Error fetching assigned tasks:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      } else {
        setSnackbar({ open: true, message: 'Failed to load assigned tasks', severity: 'error' });
      }
    }
  };

  const handleCreateTask = async () => {
    if (authError || !userId) {
      setSnackbar({
        open: true,
        message: 'Please log in to create tasks',
        severity: 'error'
      });
      return;
    }

    if (!newTask.title || !newTask.description || !newTask.dueDateTime) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields (Title, Description, Due Date)',
        severity: 'error'
      });
      return;
    }

    if (newTask.dueDateTime && new Date(newTask.dueDateTime) < new Date()) {
      setSnackbar({
        open: true,
        message: 'Due date cannot be in the past',
        severity: 'error'
      });
      return;
    }

    setIsCreatingTask(true);

    try {
      const formData = new FormData();
      const finalAssignedUsers = newTask.assignedUsers.length > 0 ? newTask.assignedUsers : [userId];

      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('dueDateTime', new Date(newTask.dueDateTime).toISOString());
      formData.append('priorityDays', newTask.priorityDays || '1');
      formData.append('priority', newTask.priority);
      formData.append('assignedUsers', JSON.stringify(finalAssignedUsers));
      formData.append('assignedGroups', JSON.stringify(newTask.assignedGroups || []));
      formData.append('repeatPattern', newTask.repeatPattern);
      formData.append('repeatDays', JSON.stringify(newTask.repeatDays || []));
      formData.append('checkpoints', JSON.stringify(getCleanCheckpoints(newTask.checkpoints)));

      if (newTask.files) {
        for (let i = 0; i < newTask.files.length; i++) {
          formData.append('files', newTask.files[i]);
        }
      }

      if (newTask.voiceNote) {
        formData.append('voiceNote', newTask.voiceNote);
      }

      const isSelfTask = finalAssignedUsers.length === 1 && finalAssignedUsers[0] === userId;
      const endpoint = isSelfTask ? '/tasks/self/create' : '/tasks/assigned/create';

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      await fetchAssignedTasks();
      await fetchMyTasks();
      await fetchNotifications();
      
      setOpenDialog(false);
      setSnackbar({ 
        open: true, 
        message: newTask.repeatPattern !== 'none' 
          ? 'Recurring task created successfully' 
          : 'Task created successfully', 
        severity: 'success' 
      });
      
      setNewTask({
        title: '', 
        description: '', 
        dueDateTime: '', 
        assignedUsers: [],
        assignedGroups: [], 
        priorityDays: '1', 
        priority: 'medium', 
        files: null, 
        voiceNote: null,
        repeatPattern: 'none',
        repeatDays: [],
        checkpoints: []
      });

    } catch (err) {
      console.error('Error creating task:', err);
      
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: err?.response?.data?.error || err?.response?.data?.message || 'Task creation failed', 
          severity: 'error' 
        });
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateGroup = async () => {
    if (authError || !userId) {
      setSnackbar({
        open: true,
        message: 'Please log in to manage groups',
        severity: 'error'
      });
      return;
    }

    try {
      if (editingGroup) {
        await axios.put(`/groups/${editingGroup._id}`, newGroup);
        setSnackbar({ open: true, message: 'Group updated successfully', severity: 'success' });
      } else {
        await axios.post('/groups', newGroup);
        setSnackbar({ open: true, message: 'Group created successfully', severity: 'success' });
      }
      fetchAssignableData();
      setOpenGroupDialog(false);
      setNewGroup({ name: '', description: '', members: [] });
      setEditingGroup(null);
    } catch (err) {
      console.error('Error in group operation:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      } else {
        setSnackbar({ open: true, message: err?.response?.data?.error || 'Group operation failed', severity: 'error' });
      }
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (authError || !userId) {
      setSnackbar({
        open: true,
        message: 'Please log in to manage groups',
        severity: 'error'
      });
      return;
    }

    try {
      await axios.delete(`/groups/${groupId}`);
      fetchAssignableData();
      setSnackbar({ open: true, message: 'Group deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error deleting group:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
      } else {
        setSnackbar({ open: true, message: err?.response?.data?.error || 'Group deletion failed', severity: 'error' });
      }
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setNewGroup({
      name: group.name,
      description: group.description,
      members: group.members.map(m => m._id || m)
    });
    setOpenGroupDialog(true);
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '🕒',
      'in-progress': '⚡',
      completed: '✅',
      rejected: '❌'
    };
    return icons[status] || '🕒';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDateTime) => {
    if (!dueDateTime) return false;
    return new Date(dueDateTime) < new Date();
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getRepeatInfo = (task) => {
    if (!task.repeatPattern || task.repeatPattern === 'none') return null;
    
    let info = {
      none: 'No Repeat',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    }[task.repeatPattern];
    
    if (task.repeatPattern === 'weekly' && task.repeatDays && task.repeatDays.length > 0) {
      const dayLabels = task.repeatDays.map(day => 
        day.charAt(0).toUpperCase() + day.slice(1)
      );
      info += ` (${dayLabels.join(', ')})`;
    }
    
    return info;
  };

  const canUserChangeStatus = (task) => {
    const isTaskCreator = task.createdBy === userId || task.createdBy?._id === userId;
    const isAssignedUser = task.assignedUsers?.some(assignedUserId => 
      assignedUserId === userId || assignedUserId._id === userId
    );
    
    return isTaskCreator || isAssignedUser;
  };

  const renderActionButtons = (task) => {
    const isTaskCreator = task.createdBy === userId || task.createdBy?._id === userId;
    const canEditDelete = isTaskCreator;
    
    return (
      <div className="MyTaskManagement-action-buttons">
        <button 
          className="MyTaskManagement-action-btn MyTaskManagement-info"
          onClick={() => fetchTaskRemarks(task._id)}
          title="View Remarks"
        >
          💬
        </button>

        <button 
          className="MyTaskManagement-action-btn MyTaskManagement-primary"
          onClick={() => fetchActivityLogs(task._id)}
          title="Activity Logs"
        >
          📊
        </button>

        {canEditDelete && (
          <>
            <button 
              className="MyTaskManagement-action-btn MyTaskManagement-warning"
              onClick={() => {
                setEditTaskData(task);
                setTaskManagementDialog({ open: true, task });
              }}
              title="Edit Task"
            >
              ✏️
            </button>
            <button 
              className="MyTaskManagement-action-btn MyTaskManagement-error"
              onClick={() => deleteTask(task._id)}
              title="Delete Task"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    );
  };

  const renderStatusSelect = (task) => {
    const myStatus = getUserStatusForTask(task, userId);
    const canChangeStatus = canUserChangeStatus(task);
    
    return (
      <select 
        className={`MyTaskManagement-status-select ${!canChangeStatus ? 'MyTaskManagement-disabled' : ''}`}
        value={myStatus}
        onChange={(e) => {
          const isTaskCreator = task.createdBy === userId || task.createdBy?._id === userId;
          
          if (isTaskCreator && task.assignedUsers && task.assignedUsers.length > 1) {
            setStatusChangeDialog({
              open: true,
              taskId: task._id,
              newStatus: e.target.value,
              remarks: '',
              selectedUserId: null
            });
          } else {
            handleStatusChange(task._id, e.target.value);
          }
        }}
        disabled={!canChangeStatus}
        title={canChangeStatus ? '' : 'You are not authorized to update status for this task'}
      >
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
      </select>
    );
  };

  const handleEditTask = () => {
    if (!editTaskData) return;
    
    const updateData = {
      title: editTaskData.title,
      description: editTaskData.description,
      dueDateTime: editTaskData.dueDateTime,
      priority: editTaskData.priority,
      priorityDays: editTaskData.priorityDays,
      assignedUsers: editTaskData.assignedUsers || [],
      assignedGroups: editTaskData.assignedGroups || [],
    };

    updateTask(editTaskData._id, updateData);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!authError && userId) {
      fetchMyTasks();
      fetchAssignedTasks();
      fetchAssignableData();
      fetchNotifications();
    }
  }, [statusFilter, tab, authError, userId]);

  if (authError && !localStorage.getItem('token')) {
    return (
      <div className="MyTaskManagement-auth-error">
        <div className="MyTaskManagement-error-card">
          <div className="MyTaskManagement-error-icon">🔒</div>
          <h3>Authentication Required</h3>
          <p>Please log in to access the Task Management system.</p>
          <button className="MyTaskManagement-login-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const renderDesktopTable = (groupedTasks, showAssignedByMe = false) => {
    return Object.entries(groupedTasks).map(([dateKey, tasks]) => (
      <div key={dateKey} className="MyTaskManagement-date-group">
        <h3 className="MyTaskManagement-date-header">📅 {dateKey}</h3>
        <div className="MyTaskManagement-table-container">
          <table className="MyTaskManagement-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>My Status</th>
                {showAssignedByMe && (
                  <th>Assigned Users</th>
                )}
                <th>Repeat</th>
                <th>Files</th>
                <th>Actions</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const myStatus = getUserStatusForTask(task, userId);
                const allUsersStatus = getAllUsersStatus(task);
                const repeatInfo = getRepeatInfo(task);

                return (
                  <tr key={task._id} className={`MyTaskManagement-table-row MyTaskManagement-status-${myStatus}`}>
                    <td>
                      <div className="MyTaskManagement-task-title">
                        <strong>{task.title}</strong>
                        {task.isRecurring && (
                          <span className="MyTaskManagement-recurring-icon" title="Recurring Task">🔄</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="MyTaskManagement-task-description" title={task.description}>
                        {task.description}
                      </div>
                    </td>
                    <td>
                      <div className={`MyTaskManagement-due-date ${isOverdue(task.dueDateTime) ? 'MyTaskManagement-overdue' : ''}`}>
                        📅 {task.dueDateTime
                          ? new Date(task.dueDateTime).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '—'}
                        {isOverdue(task.dueDateTime) && (
                          <span className="MyTaskManagement-overdue-icon">⚠️</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`MyTaskManagement-priority-chip MyTaskManagement-priority-${task.priority || 'medium'}`}>
                        {task.priority || 'medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`MyTaskManagement-status-chip MyTaskManagement-status-${myStatus}`}>
                        {myStatus.charAt(0).toUpperCase() + myStatus.slice(1)}
                      </span>
                    </td>
                    
                    {showAssignedByMe && (
                      <td>
                        <div className="MyTaskManagement-assigned-users">
                          {allUsersStatus.slice(0, 2).map((userStatus, index) => (
                            <div key={index} className="MyTaskManagement-user-status">
                              <div className="MyTaskManagement-user-avatar">
                                {userStatus.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="MyTaskManagement-user-info">
                                <div className="MyTaskManagement-user-name">{userStatus.userName}</div>
                                <span className={`MyTaskManagement-status-chip MyTaskManagement-status-${userStatus.status}`}>
                                  {userStatus.status}
                                </span>
                              </div>
                            </div>
                          ))}
                          {allUsersStatus.length > 2 && (
                            <div className="MyTaskManagement-more-users">
                              +{allUsersStatus.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    <td>
                      {repeatInfo ? (
                        <span className="MyTaskManagement-recurring-badge">
                          🔄 {repeatInfo.split(' ')[0]}
                        </span>
                      ) : (
                        <span className="MyTaskManagement-no-repeat">-</span>
                      )}
                    </td>
                    <td>
                      {task.files?.length ? (
                        <a 
                          className="MyTaskManagement-download-btn"
                          href={`${API_URL_IMG}${task.files[0].path || task.files[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${task.files.length} file(s)`}
                        >
                          📥
                        </a>
                      ) : (
                        <span className="MyTaskManagement-no-files">-</span>
                      )}
                    </td>
                    <td>
                      {renderActionButtons(task)}
                    </td>
                    <td>
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

  const renderMobileCards = (groupedTasks, showAssignedByMe = false) => {
    return Object.entries(groupedTasks).map(([dateKey, tasks]) => (
      <div key={dateKey} className="MyTaskManagement-date-group">
        <h3 className="MyTaskManagement-date-header">📅 {dateKey}</h3>
        <div className="MyTaskManagement-mobile-cards">
          {tasks.map((task) => {
            const myStatus = getUserStatusForTask(task, userId);
            const allUsersStatus = getAllUsersStatus(task);
            const repeatInfo = getRepeatInfo(task);

            return (
              <div key={task._id} className={`MyTaskManagement-mobile-card MyTaskManagement-status-${myStatus}`}>
                <div className="MyTaskManagement-mobile-card-content">
                  <div className="MyTaskManagement-mobile-card-header">
                    <div className="MyTaskManagement-mobile-card-title-section">
                      <div className="MyTaskManagement-mobile-task-title">
                        <strong>{task.title}</strong>
                        {task.isRecurring && (
                          <span className="MyTaskManagement-recurring-icon" title="Recurring Task">🔄</span>
                        )}
                      </div>
                      <span className={`MyTaskManagement-status-chip MyTaskManagement-status-${myStatus}`}>
                        {myStatus}
                      </span>
                    </div>
                    <p className="MyTaskManagement-mobile-description">{task.description}</p>
                    {repeatInfo && (
                      <div className="MyTaskManagement-recurring-info">
                        🔄 {repeatInfo}
                      </div>
                    )}
                  </div>

                  <div className="MyTaskManagement-mobile-card-info">
                    <div className={`MyTaskManagement-mobile-due-date ${isOverdue(task.dueDateTime) ? 'MyTaskManagement-overdue' : ''}`}>
                      📅 {task.dueDateTime ? new Date(task.dueDateTime).toLocaleDateString() : 'No date'}
                    </div>
                    <span className={`MyTaskManagement-priority-chip MyTaskManagement-priority-${task.priority || 'medium'}`}>
                      {task.priority || 'medium'}
                    </span>
                  </div>

                  {showAssignedByMe && allUsersStatus.length > 0 && (
                    <div className="MyTaskManagement-mobile-assigned-users">
                      <div className="MyTaskManagement-assigned-users-label">Assigned Users:</div>
                      <div className="MyTaskManagement-mobile-users-list">
                        {allUsersStatus.slice(0, 3).map((userStatus, index) => (
                          <div key={index} className="MyTaskManagement-mobile-user-status">
                            <div className="MyTaskManagement-user-avatar">
                              {userStatus.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="MyTaskManagement-mobile-user-info">
                              <div className="MyTaskManagement-mobile-user-name">{userStatus.userName}</div>
                              <span className={`MyTaskManagement-status-chip MyTaskManagement-status-${userStatus.status}`}>
                                {userStatus.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {allUsersStatus.length > 3 && (
                          <div className="MyTaskManagement-mobile-more-users">
                            +{allUsersStatus.length - 3} more users
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {task.files?.length > 0 && (
                    <div className="MyTaskManagement-mobile-files">
                      <div className="MyTaskManagement-files-label">Files:</div>
                      <div className="MyTaskManagement-mobile-files-list">
                        {task.files.slice(0, 2).map((file, i) => (
                          <a 
                            key={i}
                            className="MyTaskManagement-mobile-download-btn"
                            href={`${API_URL_IMG}${file.path || file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download"
                          >
                            📥
                          </a>
                        ))}
                        {task.files.length > 2 && (
                          <span className="MyTaskManagement-mobile-more-files">
                            +{task.files.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="MyTaskManagement-mobile-card-actions">
                    <div className="MyTaskManagement-mobile-action-buttons">
                      {renderActionButtons(task)}
                    </div>
                    <div className="MyTaskManagement-mobile-status-select">
                      {renderStatusSelect(task)}
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

  const renderGroupedTasks = (groupedTasks, showAssignedByMe = false) => {
    if (Object.keys(groupedTasks).length === 0) {
      return (
        <div className="MyTaskManagement-no-tasks">
          <div className="MyTaskManagement-no-tasks-icon">📅</div>
          <h3>No tasks found</h3>
          <p>{showAssignedByMe ? 'You have not assigned any tasks' : 'You have no tasks assigned'}</p>
        </div>
      );
    }

    return isMobile ? renderMobileCards(groupedTasks, showAssignedByMe) : renderDesktopTable(groupedTasks, showAssignedByMe);
  };

  const renderGroupsManagement = () => (
    <div className="MyTaskManagement-groups-section">
      <div className="MyTaskManagement-groups-header">
        <h2>Group Management</h2>
        <button 
          className="MyTaskManagement-create-group-btn"
          onClick={() => {
            setEditingGroup(null);
            setNewGroup({ name: '', description: '', members: [] });
            setOpenGroupDialog(true);
          }}
        >
          + Create Group
        </button>
      </div>

      <div className="MyTaskManagement-groups-grid">
        {groups.map((group) => (
          <div key={group._id} className="MyTaskManagement-group-card">
            <div className="MyTaskManagement-group-card-content">
              <div className="MyTaskManagement-group-card-header">
                <div className="MyTaskManagement-group-info">
                  <h3>{group.name}</h3>
                  <p>{group.description}</p>
                </div>
                <div className="MyTaskManagement-group-actions">
                  <button 
                    className="MyTaskManagement-group-action-btn MyTaskManagement-edit"
                    onClick={() => handleEditGroup(group)}
                    title="Edit Group"
                  >
                    ✏️
                  </button>
                  <button 
                    className="MyTaskManagement-group-action-btn MyTaskManagement-delete"
                    onClick={() => handleDeleteGroup(group._id)}
                    title="Delete Group"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="MyTaskManagement-group-divider"></div>

              <div className="MyTaskManagement-group-members">
                <div className="MyTaskManagement-members-label">Members ({group.members.length})</div>
                <div className="MyTaskManagement-members-list">
                  {group.members.slice(0, 3).map(memberId => {
                    const member = users.find(u => u._id === memberId);
                    return member ? (
                      <div key={memberId} className="MyTaskManagement-member-item">
                        <div className="MyTaskManagement-member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="MyTaskManagement-member-details">
                          <div className="MyTaskManagement-member-name">{member.name}</div>
                          <div className="MyTaskManagement-member-role">{member.role}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                  {group.members.length > 3 && (
                    <div className="MyTaskManagement-more-members">
                      +{group.members.length - 3} more members
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="MyTaskManagement-no-groups">
          <div className="MyTaskManagement-no-groups-icon">👥</div>
          <h3>No groups created yet</h3>
          <p>Create your first group to assign tasks to multiple users at once</p>
        </div>
      )}
    </div>
  );

  const renderNotificationsPanel = () => (
    <div className={`MyTaskManagement-modal-overlay ${notificationsOpen ? 'MyTaskManagement-modal-open' : ''}`}>
      <div className="MyTaskManagement-notifications-modal">
        <div className="MyTaskManagement-notifications-header">
          <h3>Notifications</h3>
          <button 
            className="MyTaskManagement-mark-all-read-btn"
            onClick={markAllNotificationsAsRead}
            disabled={unreadNotificationCount === 0}
          >
            Mark all as read
          </button>
        </div>
        <div className="MyTaskManagement-notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`MyTaskManagement-notification-item ${notification.isRead ? '' : 'MyTaskManagement-unread'}`}
              >
                <div className="MyTaskManagement-notification-content">
                  <div className="MyTaskManagement-notification-title">{notification.title}</div>
                  <div className="MyTaskManagement-notification-message">{notification.message}</div>
                  <div className="MyTaskManagement-notification-footer">
                    <div className="MyTaskManagement-notification-date">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                    {!notification.isRead && (
                      <button 
                        className="MyTaskManagement-mark-read-btn"
                        onClick={() => markNotificationAsRead(notification._id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="MyTaskManagement-no-notifications">
              <div className="MyTaskManagement-no-notifications-icon">🔔</div>
              <p>No notifications</p>
            </div>
          )}
        </div>
        <button 
          className="MyTaskManagement-close-modal-btn"
          onClick={() => setNotificationsOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderRemarksDialog = () => (
    <div className={`MyTaskManagement-modal-overlay ${remarksDialog.open ? 'MyTaskManagement-modal-open' : ''}`}>
      <div className="MyTaskManagement-remarks-modal">
        <div className="MyTaskManagement-remarks-header">
          <h3>💬 Task Remarks</h3>
        </div>
        <div className="MyTaskManagement-remarks-content">
          <div className="MyTaskManagement-add-remark">
            <h4>Add New Remark</h4>
            <textarea
              className="MyTaskManagement-remark-textarea"
              placeholder="Enter your remark here..."
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              rows="3"
            />
            <button
              className="MyTaskManagement-add-remark-btn"
              onClick={() => addRemark(remarksDialog.taskId)}
              disabled={!newRemark.trim()}
            >
              Add Remark
            </button>
          </div>

          <div className="MyTaskManagement-remarks-history">
            <h4>Remarks History</h4>
            {remarksDialog.remarks.length > 0 ? (
              <div className="MyTaskManagement-remarks-list">
                {remarksDialog.remarks.map((remark, index) => (
                  <div key={index} className="MyTaskManagement-remark-item">
                    <div className="MyTaskManagement-remark-header">
                      <div className="MyTaskManagement-remark-user">
                        <div className="MyTaskManagement-remark-avatar">
                          {remark.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="MyTaskManagement-remark-username">{remark.user?.name || 'Unknown User'}</div>
                          <div className="MyTaskManagement-remark-userrole">{remark.user?.role || 'User'}</div>
                        </div>
                      </div>
                      <div className="MyTaskManagement-remark-date">
                        {new Date(remark.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="MyTaskManagement-remark-text">{remark.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="MyTaskManagement-no-remarks">
                No remarks yet. Be the first to add one!
              </div>
            )}
          </div>
        </div>
        <button 
          className="MyTaskManagement-close-modal-btn"
          onClick={() => setRemarksDialog({ open: false, taskId: null, remarks: [] })}
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderActivityLogsDialog = () => (
    <div className={`MyTaskManagement-modal-overlay ${activityDialog.open ? 'MyTaskManagement-modal-open' : ''}`}>
      <div className="MyTaskManagement-activity-modal">
        <div className="MyTaskManagement-activity-header">
          <h3>📊 Activity Logs</h3>
        </div>
        <div className="MyTaskManagement-activity-content">
          {activityLogs.length > 0 ? (
            <div className="MyTaskManagement-activity-list">
              {activityLogs.map((log, index) => (
                <div key={index} className="MyTaskManagement-activity-item">
                  <div className="MyTaskManagement-activity-header-row">
                    <div className="MyTaskManagement-activity-user">
                      <div className="MyTaskManagement-activity-avatar">
                        {log.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="MyTaskManagement-activity-username">{log.user?.name || 'Unknown User'}</div>
                        <div className="MyTaskManagement-activity-userrole">{log.user?.role || 'User'}</div>
                      </div>
                    </div>
                    <div className="MyTaskManagement-activity-date">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="MyTaskManagement-activity-description">{log.description}</div>
                  <div className="MyTaskManagement-activity-tags">
                    <span className="MyTaskManagement-activity-action">{log.action}</span>
                    {log.ipAddress && (
                      <span className="MyTaskManagement-activity-ip">IP: {log.ipAddress}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="MyTaskManagement-no-activity">
              No activity logs found for this task
            </div>
          )}
        </div>
        <button 
          className="MyTaskManagement-close-modal-btn"
          onClick={() => setActivityDialog({ open: false, taskId: null })}
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderEditTaskDialog = () => {
    const task = taskManagementDialog.task;
    
    if (!task) return null;

    return (
      <div className={`MyTaskManagement-modal-overlay ${taskManagementDialog.open ? 'MyTaskManagement-modal-open' : ''}`}>
        <div className="MyTaskManagement-edit-task-modal">
          <div className="MyTaskManagement-edit-task-header">
            <h3>✏️ Edit Task</h3>
          </div>
          <div className="MyTaskManagement-edit-task-content">
            <div className="MyTaskManagement-edit-form">
              <div className="MyTaskManagement-form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  className="MyTaskManagement-form-input"
                  value={editTaskData?.title || task.title}
                  onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>

              <div className="MyTaskManagement-form-group">
                <label>Description</label>
                <textarea
                  className="MyTaskManagement-form-textarea"
                  value={editTaskData?.description || task.description}
                  onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                  placeholder="Enter task description"
                  rows="3"
                />
              </div>

              <div className="MyTaskManagement-form-group">
                <label>Due Date & Time</label>
                <input
                  type="datetime-local"
                  className="MyTaskManagement-form-input"
                  value={editTaskData?.dueDateTime ? new Date(editTaskData.dueDateTime).toISOString().slice(0, 16) : new Date(task.dueDateTime).toISOString().slice(0, 16)}
                  onChange={(e) => setEditTaskData({ ...editTaskData, dueDateTime: e.target.value })}
                />
              </div>

              <div className="MyTaskManagement-form-group">
                <label>Priority</label>
                <select
                  className="MyTaskManagement-form-select"
                  value={editTaskData?.priority || task.priority}
                  onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="MyTaskManagement-form-group">
                <label>Priority Days</label>
                <input
                  type="number"
                  className="MyTaskManagement-form-input"
                  value={editTaskData?.priorityDays || task.priorityDays}
                  onChange={(e) => setEditTaskData({ ...editTaskData, priorityDays: e.target.value })}
                  placeholder="Enter priority days"
                />
              </div>
            </div>
          </div>
          <div className="MyTaskManagement-edit-task-footer">
            <button 
              className="MyTaskManagement-cancel-btn"
              onClick={() => {
                setTaskManagementDialog({ open: false, task: null });
                setEditTaskData(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="MyTaskManagement-update-task-btn"
              onClick={handleEditTask}
            >
              Update Task
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateTaskDialog = () => (
    <div className={`MyTaskManagement-modal-overlay ${openDialog ? 'MyTaskManagement-modal-open' : ''}`}>
      <div className="MyTaskManagement-create-task-modal">
        <div className="MyTaskManagement-create-task-header">
          <div className="MyTaskManagement-create-task-title">
            <h2>Create New Task</h2>
            <p>Fill in the details to create a new task</p>
          </div>
        </div>

        <div className="MyTaskManagement-create-task-content">
          <div className="MyTaskManagement-create-task-section">
            <h3>📝 Basic Information</h3>
            
            <div className="MyTaskManagement-form-group">
              <label>Task Title *</label>
              <input
                type="text"
                className="MyTaskManagement-form-input"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter a descriptive task title"
              />
            </div>

            <div className="MyTaskManagement-form-group">
              <label>Description *</label>
              <textarea
                className="MyTaskManagement-form-textarea"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Provide detailed description of the task..."
                rows="3"
              />
            </div>

            <div className="MyTaskManagement-form-row">
              <div className="MyTaskManagement-form-group MyTaskManagement-half">
                <label>Due Date & Time *</label>
                <input
                  type="datetime-local"
                  className="MyTaskManagement-form-input"
                  value={newTask.dueDateTime}
                  onChange={(e) => setNewTask({ ...newTask, dueDateTime: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="MyTaskManagement-form-group MyTaskManagement-half">
                <label>Priority</label>
                <select
                  className="MyTaskManagement-form-select"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="MyTaskManagement-form-row">
              <div className="MyTaskManagement-form-group MyTaskManagement-half">
                <label>Priority Days</label>
                <input
                  type="number"
                  className="MyTaskManagement-form-input"
                  value={newTask.priorityDays}
                  onChange={(e) => setNewTask({ ...newTask, priorityDays: e.target.value })}
                  placeholder="Enter priority days"
                />
              </div>
            </div>
          </div>

          <div className="MyTaskManagement-create-task-section">
            <h3>🔄 Repeat Task</h3>
            
            <div className="MyTaskManagement-form-group">
              <label>Repeat Pattern</label>
              <select
                className="MyTaskManagement-form-select"
                value={newTask.repeatPattern}
                onChange={(e) => setNewTask({ ...newTask, repeatPattern: e.target.value })}
              >
                <option value="none">No Repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {newTask.repeatPattern === 'weekly' && (
              <div className="MyTaskManagement-week-days">
                <label>Select Week Days</label>
                <div className="MyTaskManagement-days-grid">
                  {[
                    { value: 'monday', label: 'Mon' },
                    { value: 'tuesday', label: 'Tue' },
                    { value: 'wednesday', label: 'Wed' },
                    { value: 'thursday', label: 'Thu' },
                    { value: 'friday', label: 'Fri' },
                    { value: 'saturday', label: 'Sat' },
                    { value: 'sunday', label: 'Sun' }
                  ].map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`MyTaskManagement-day-chip ${newTask.repeatDays?.includes(day.value) ? 'MyTaskManagement-day-selected' : ''}`}
                      onClick={() => {
                        const currentDays = newTask.repeatDays || [];
                        if (currentDays.includes(day.value)) {
                          setNewTask({
                            ...newTask,
                            repeatDays: currentDays.filter(d => d !== day.value)
                          });
                        } else {
                          setNewTask({
                            ...newTask,
                            repeatDays: [...currentDays, day.value]
                          });
                        }
                      }}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="MyTaskManagement-create-task-section">
            <h3>Checkpoints (Optional)</h3>
            <button type="button" className="MyTaskManagement-upload-btn" onClick={addCheckpoint}>
              + Add Checkpoint
            </button>
            {(newTask.checkpoints || []).length > 0 && (
              <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                {newTask.checkpoints.map((checkpoint, index) => (
                  <div key={`checkpoint-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="MyTaskManagement-form-input"
                      placeholder={`Checkpoint ${index + 1}`}
                      value={checkpoint.title}
                      onChange={(event) => updateCheckpoint(index, event.target.value)}
                    />
                    <button type="button" className="MyTaskManagement-cancel-btn" onClick={() => removeCheckpoint(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="MyTaskManagement-create-task-section">
            <h3>📎 Attachments</h3>
            
            <div className="MyTaskManagement-upload-buttons">
              <button 
                type="button"
                className="MyTaskManagement-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📄 Upload Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                style={{ display: 'none' }}
                onChange={(e) => setNewTask({ ...newTask, files: e.target.files })}
              />

              <button 
                type="button"
                className="MyTaskManagement-upload-btn"
                onClick={() => voiceNoteInputRef.current?.click()}
              >
                🎤 Voice Note
              </button>
              <input
                type="file"
                ref={voiceNoteInputRef}
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={(e) => setNewTask({ ...newTask, voiceNote: e.target.files[0] })}
              />
            </div>
          </div>

          <div className="MyTaskManagement-create-task-section">
            <h3>👥 Assign to Team Members</h3>
            
            <div className="MyTaskManagement-form-group">
              <label>Select Team Members</label>
              <select
                multiple
                className="MyTaskManagement-multi-select"
                value={newTask.assignedUsers}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setNewTask({ ...newTask, assignedUsers: selected });
                }}
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <div className="MyTaskManagement-selected-users">
                {newTask.assignedUsers.map(userId => {
                  const user = users.find(u => u._id === userId);
                  return user ? (
                    <span key={userId} className="MyTaskManagement-selected-user-chip">
                      {user.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <div className="MyTaskManagement-create-task-section">
            <h3>📁 Assign to Groups</h3>
            
            <div className="MyTaskManagement-form-group">
              <label>Select Groups</label>
              <select
                multiple
                className="MyTaskManagement-multi-select"
                value={newTask.assignedGroups}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setNewTask({ ...newTask, assignedGroups: selected });
                }}
              >
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name} ({group.members.length} members)
                  </option>
                ))}
              </select>
              <div className="MyTaskManagement-selected-groups">
                {newTask.assignedGroups.map(groupId => {
                  const group = groups.find(g => g._id === groupId);
                  return group ? (
                    <span key={groupId} className="MyTaskManagement-selected-group-chip">
                      {group.name} ({group.members.length})
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="MyTaskManagement-create-task-footer">
          <button
            className="MyTaskManagement-cancel-btn"
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </button>

          <button
            className="MyTaskManagement-create-btn"
            onClick={handleCreateTask}
            disabled={!newTask.title || !newTask.description || !newTask.dueDateTime || isCreatingTask}
          >
            {isCreatingTask ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderGroupManagementDialog = () => (
    <div className={`MyTaskManagement-modal-overlay ${openGroupDialog ? 'MyTaskManagement-modal-open' : ''}`}>
      <div className="MyTaskManagement-group-modal">
        <div className="MyTaskManagement-group-modal-header">
          <h3>{editingGroup ? 'Edit Group' : 'Create New Group'}</h3>
          <p>{editingGroup ? 'Update group details and members' : 'Create a new group to assign tasks efficiently'}</p>
        </div>

        <div className="MyTaskManagement-group-modal-content">
          <div className="MyTaskManagement-group-form-section">
            <h4>Basic Information</h4>
            
            <div className="MyTaskManagement-form-group">
              <label>Group Name</label>
              <input
                type="text"
                className="MyTaskManagement-form-input"
                value={newGroup.name}
                onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Enter a descriptive group name"
              />
            </div>

            <div className="MyTaskManagement-form-group">
              <label>Description</label>
              <textarea
                className="MyTaskManagement-form-textarea"
                value={newGroup.description}
                onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="Describe the purpose of this group..."
                rows="3"
              />
            </div>
          </div>

          <div className="MyTaskManagement-group-form-section">
            <h4>Group Members</h4>
            
            <div className="MyTaskManagement-form-group">
              <label>Select Members</label>
              <select
                multiple
                className="MyTaskManagement-multi-select"
                value={newGroup.members}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setNewGroup({ ...newGroup, members: selected });
                }}
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <div className="MyTaskManagement-selected-members">
                {newGroup.members.map(memberId => {
                  const user = users.find(u => u._id === memberId);
                  return user ? (
                    <span key={memberId} className="MyTaskManagement-selected-member-chip">
                      {user.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="MyTaskManagement-group-modal-footer">
          <button
            className="MyTaskManagement-cancel-btn"
            onClick={() => setOpenGroupDialog(false)}
          >
            Cancel
          </button>
          <button
            className="MyTaskManagement-create-group-submit-btn"
            onClick={handleCreateGroup}
            disabled={!newGroup.name || !newGroup.description || newGroup.members.length === 0}
          >
            {editingGroup ? 'Update Group' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStatusChangeDialog = () => (
    <div className={`MyTaskManagement-modal-overlay ${statusChangeDialog.open ? 'MyTaskManagement-modal-open' : ''}`}>
      <div className="MyTaskManagement-status-modal">
        <div className="MyTaskManagement-status-modal-header">
          <h3>Select User to Update Status</h3>
          <p>Multiple users are assigned to this task. Please select which user's status you want to update.</p>
        </div>
        
        <div className="MyTaskManagement-status-modal-content">
          <div className="MyTaskManagement-form-group">
            <label>Select User</label>
            <select
              className="MyTaskManagement-form-select"
              value={statusChangeDialog.selectedUserId || ''}
              onChange={(e) => setStatusChangeDialog(prev => ({ ...prev, selectedUserId: e.target.value }))}
            >
              <option value="">Select a user</option>
              {(() => {
                const task = Object.values(myTasksGrouped).flat().find(t => t._id === statusChangeDialog.taskId) ||
                            Object.values(assignedTasksGrouped).flat().find(t => t._id === statusChangeDialog.taskId);
                
                return task?.assignedUsers?.map(assignedUserId => {
                  const user = users.find(u => u._id === assignedUserId);
                  return user ? (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ) : null;
                }) || [];
              })()}
            </select>
          </div>

          <div className="MyTaskManagement-form-group">
            <label>Remarks (Optional)</label>
            <textarea
              className="MyTaskManagement-form-textarea"
              placeholder="Add remarks for this status change..."
              value={statusChangeDialog.remarks}
              onChange={(e) => setStatusChangeDialog(prev => ({ ...prev, remarks: e.target.value }))}
              rows="2"
            />
          </div>
        </div>

        <div className="MyTaskManagement-status-modal-footer">
          <button 
            className="MyTaskManagement-cancel-btn"
            onClick={() => setStatusChangeDialog({ open: false, taskId: null, newStatus: '', remarks: '', selectedUserId: null })}
          >
            Cancel
          </button>
          <button 
            className="MyTaskManagement-update-status-btn"
            onClick={() => {
              if (statusChangeDialog.selectedUserId) {
                handleStatusChange(
                  statusChangeDialog.taskId, 
                  statusChangeDialog.newStatus, 
                  statusChangeDialog.remarks,
                  statusChangeDialog.selectedUserId
                );
                setStatusChangeDialog({ open: false, taskId: null, newStatus: '', remarks: '', selectedUserId: null });
              } else {
                setSnackbar({
                  open: true,
                  message: 'Please select a user',
                  severity: 'warning'
                });
              }
            }}
            disabled={!statusChangeDialog.selectedUserId}
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="MyTaskManagement-loading">
        <div className="MyTaskManagement-loading-spinner"></div>
        <h3>Loading Tasks...</h3>
      </div>
    );
  }

  return (
    <div className="MyTaskManagement-container">
      {/* Header Section */}
      <div className="MyTaskManagement-header">
        <div className="MyTaskManagement-header-content">
          <div className="MyTaskManagement-header-text">
            <h1>{tab === 2 ? "Group Management" : "Task Management"}</h1>
            <p>
              {tab === 2
                ? "Create and manage user groups easily"
                : "Manage and track your tasks efficiently"}
            </p>
          </div>

          <div className="MyTaskManagement-header-actions">
            <button 
              className="MyTaskManagement-notifications-btn"
              onClick={() => setNotificationsOpen(true)}
              title="Notifications"
            >
              🔔
              {unreadNotificationCount > 0 && (
                <span className="MyTaskManagement-notification-badge">{unreadNotificationCount}</span>
              )}
            </button>

            {tab !== 2 && (
              <button
                className="MyTaskManagement-manage-groups-btn"
                onClick={() => setTab(2)}
              >
                👥 Manage Groups
              </button>
            )}

            <button
              className="MyTaskManagement-create-task-btn"
              onClick={() => setOpenDialog(true)}
            >
              + Create Task
            </button>
          </div>
        </div>
      </div>

      {tab === 2 ? (
        renderGroupsManagement()
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="MyTaskManagement-stats-grid">
            {[
              { label: 'Total Tasks', value: stats.total, color: 'primary' },
              { label: 'Pending', value: stats.pending, color: 'warning' },
              { label: 'In Progress', value: stats.inProgress, color: 'info' },
              { label: 'Completed', value: stats.completed, color: 'success' },
              { label: 'Rejected', value: stats.rejected, color: 'error' },
            ].map((stat, index) => (
              <div key={index} className={`MyTaskManagement-stat-card MyTaskManagement-${stat.color}`}>
                <div className="MyTaskManagement-stat-content">
                  <div className="MyTaskManagement-stat-icon">
                    {stat.label === 'Total Tasks' ? '📅' :
                     stat.label === 'Pending' ? '🕒' :
                     stat.label === 'In Progress' ? '⚡' :
                     stat.label === 'Completed' ? '✅' : '❌'}
                  </div>
                  <div className="MyTaskManagement-stat-details">
                    <div className="MyTaskManagement-stat-label">{stat.label}</div>
                    <div className="MyTaskManagement-stat-value">{stat.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs Section */}
          <div className="MyTaskManagement-tabs-container">
            <div className="MyTaskManagement-tabs-header">
              <button
                className={`MyTaskManagement-tab ${tab === 0 ? 'MyTaskManagement-active-tab' : ''}`}
                onClick={() => setTab(0)}
              >
                👤 My Tasks
                {stats.total > 0 && (
                  <span className="MyTaskManagement-tab-badge">{stats.total}</span>
                )}
              </button>
              <button
                className={`MyTaskManagement-tab ${tab === 1 ? 'MyTaskManagement-active-tab' : ''}`}
                onClick={() => setTab(1)}
              >
                👥 Assigned by Me
              </button>
            </div>

            {/* Tab Content */}
            <div className="MyTaskManagement-tab-content">
              {/* Filter Section */}
              <div className="MyTaskManagement-filter-section">
                <div className="MyTaskManagement-filter-control">
                  <label>Status Filter</label>
                  <select
                    className="MyTaskManagement-filter-select"
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

                <div className="MyTaskManagement-results-count">
                  Showing {stats.total} tasks
                </div>
              </div>

              {/* Tasks Content */}
              {renderGroupedTasks(
                tab === 0 ? myTasksGrouped : assignedTasksGrouped,
                tab === 1
              )}
            </div>
          </div>
        </>
      )}

      {/* DIALOGS */}
      {renderCreateTaskDialog()}
      {renderGroupManagementDialog()}
      {renderNotificationsPanel()}
      {renderRemarksDialog()}
      {renderActivityLogsDialog()}
      {renderEditTaskDialog()}
      {renderStatusChangeDialog()}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`MyTaskManagement-snackbar MyTaskManagement-snackbar-${snackbar.severity}`}>
          <div className="MyTaskManagement-snackbar-content">
            <span className="MyTaskManagement-snackbar-icon">
              {snackbar.severity === 'error' ? '❌' :
               snackbar.severity === 'warning' ? '⚠️' : '✅'}
            </span>
            <span className="MyTaskManagement-snackbar-message">{snackbar.message}</span>
          </div>
          <button 
            className="MyTaskManagement-snackbar-close"
            onClick={() => setSnackbar({ ...snackbar, open: false })}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTaskManagement;
