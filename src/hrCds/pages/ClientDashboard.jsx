// client-dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './ClientDashboard.css';

// Icons
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiUser,
  FiCalendar,
  FiChevronRight,
  FiLogOut,
  FiSearch,
  FiBell,
  FiStar,
  FiMessageCircle,
  FiEye,
  FiActivity,
  FiRefreshCw
} from 'react-icons/fi';

// Task Details Modal Component
const TaskDetailsModal = ({ task, open, onClose, projectManagers = [] }) => {
  console.log('🔍 TaskDetailsModal rendered:', { taskId: task?._id, open });
  
  if (!open || !task) return null;

  const getAssigneeDetails = (assigneeName) => {
    return projectManagers.find(pm => pm.name === assigneeName || pm.name === task.assignee);
  };

  const isOverdue = (dueDate) => {
    if (!dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const assigneeDetails = getAssigneeDetails(task.assignee);

  return (
    <div className="ClientDashboard-modal-overlay" onClick={onClose}>
      <div className="ClientDashboard-modal ClientDashboard-modal-md" onClick={e => e.stopPropagation()}>
        <div className="ClientDashboard-modal__header">
          <h3>Task Details</h3>
          <button className="ClientDashboard-action-button" onClick={onClose}>
            <FiEye />
          </button>
        </div>
        
        <div className="ClientDashboard-modal__content">
          <div className="ClientDashboard-task-details">
            <div className="ClientDashboard-detail-section">
              <h4 className="ClientDashboard-detail-section-title">Task Information</h4>
              <div className="ClientDashboard-detail-grid">
                <div className="ClientDashboard-detail-item">
                  <span className="ClientDashboard-detail-label">Task Name</span>
                  <span className="ClientDashboard-detail-value">{task.name}</span>
                </div>
                
                <div className="ClientDashboard-detail-item">
                  <span className="ClientDashboard-detail-label">Status</span>
                  <span className={`ClientDashboard-status-badge ${task.completed ? 'ClientDashboard-status-badge--success' : 'ClientDashboard-status-badge--warning'}`}>
                    {task.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>

                <div className="ClientDashboard-detail-item">
                  <span className="ClientDashboard-detail-label">Priority</span>
                  <span className={`ClientDashboard-priority-badge ClientDashboard-priority-badge--${task.priority?.toLowerCase() || 'medium'}`}>
                    {task.priority || 'Medium'}
                  </span>
                </div>

                {task.service && (
                  <div className="ClientDashboard-detail-item">
                    <span className="ClientDashboard-detail-label">Service</span>
                    <span className="ClientDashboard-detail-value">{task.service}</span>
                  </div>
                )}

                {task.dueDate && (
                  <div className="ClientDashboard-detail-item">
                    <span className="ClientDashboard-detail-label">Due Date</span>
                    <span className={`ClientDashboard-detail-value ${isOverdue(task.dueDate) ? 'ClientDashboard-text-error' : ''}`}>
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && <FiAlertCircle className="ClientDashboard-ml-1" />}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {task.assignee && (
              <div className="ClientDashboard-detail-section">
                <h4 className="ClientDashboard-detail-section-title">Assigned To</h4>
                <div className="ClientDashboard-assignee-details">
                  <div className="ClientDashboard-avatar ClientDashboard-avatar--primary">
                    {task.assignee.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="ClientDashboard-assignee-name">{task.assignee}</p>
                    {assigneeDetails?.email && (
                      <p className="ClientDashboard-assignee-email">{assigneeDetails.email}</p>
                    )}
                    {assigneeDetails?.role && (
                      <p className="ClientDashboard-assignee-role">{assigneeDetails.role}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="ClientDashboard-detail-section">
              <h4 className="ClientDashboard-detail-section-title">Timeline</h4>
              <div className="ClientDashboard-timeline-details">
                <div className="ClientDashboard-timeline-item">
                  <span className="ClientDashboard-timeline-label">Created</span>
                  <span className="ClientDashboard-timeline-value">{formatDate(task.createdAt)}</span>
                </div>
                {task.completed && task.completedAt && (
                  <div className="ClientDashboard-timeline-item">
                    <span className="ClientDashboard-timeline-label">Completed</span>
                    <span className="ClientDashboard-timeline-value">{formatDate(task.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="ClientDashboard-modal__footer">
          <button className="ClientDashboard-btn ClientDashboard-btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Service Progress Card Component - UPDATED to show only completed tasks with auto-refresh
const ServiceProgressCard = ({ service, clientId, clientProjectManagers = [], onTaskUpdate, api }) => {
  console.log('🔍 ServiceProgressCard mounted:', { service, clientId });
  
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState({ open: false, task: null });
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching tasks for client:', clientId, 'service:', service);
      
      const response = await api.get(`/client/${clientId}/service/${encodeURIComponent(service)}`);
      console.log('📥 Tasks response:', response.data);
      
      if (response.data?.success) {
        const allFetchedTasks = response.data.data || [];
        console.log('📊 All tasks fetched:', allFetchedTasks.length);
        
        // Filter ONLY completed tasks for display
        const completedTasksOnly = allFetchedTasks.filter(task => task.completed === true);
        console.log('✅ Completed tasks:', completedTasksOnly.length, completedTasksOnly);
        
        setAllTasks(allFetchedTasks);
        setTasks(completedTasksOnly);
        
        // Save to localStorage as backup
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(allFetchedTasks));
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      
      // Try to load from localStorage if API fails
      const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
      if (savedTasks) {
        console.log('📦 Loading tasks from localStorage');
        const allFetchedTasks = JSON.parse(savedTasks);
        setAllTasks(allFetchedTasks);
        
        const completedTasksOnly = allFetchedTasks.filter(task => task.completed === true);
        setTasks(completedTasksOnly);
        setLastUpdated(Date.now());
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [clientId, service]);

  // Set up polling to check for updates every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing tasks...');
      fetchTasks();
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [clientId, service]);

  // Calculate progress based on all tasks
  const completedTasks = tasks.length;
  const totalTasks = allTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate overdue tasks
  const overdueTasks = allTasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  }).length;

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle manual refresh
  const handleRefresh = (e) => {
    e.stopPropagation();
    console.log('🔄 Manual refresh triggered');
    fetchTasks();
    if (onTaskUpdate) onTaskUpdate();
  };

  if (loading) {
    return (
      <div className="ClientDashboard-service-card">
        <div className="ClientDashboard-service-card__loading">
          <div className="ClientDashboard-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ClientDashboard-service-card ${expanded ? 'ClientDashboard-service-card--expanded' : ''}`}>
      <div className="ClientDashboard-service-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="ClientDashboard-service-card__title">
          <FiBriefcase className="ClientDashboard-service-icon" />
          <h4>{service}</h4>
          <FiChevronRight className={`ClientDashboard-service-arrow ${expanded ? 'ClientDashboard-service-arrow--rotated' : ''}`} />
        </div>
        
        <div className="ClientDashboard-service-card__stats">
          <div className="ClientDashboard-stat-badge">
            <FiCheckCircle className="ClientDashboard-stat-icon ClientDashboard-text-success" />
            <span>{completedTasks}/{totalTasks} completed</span>
          </div>
          {overdueTasks > 0 && (
            <div className="ClientDashboard-stat-badge ClientDashboard-stat-badge--error">
              <FiAlertCircle className="ClientDashboard-stat-icon" />
              <span>{overdueTasks} overdue</span>
            </div>
          )}
          <div className="ClientDashboard-progress-circle">
            <span className="ClientDashboard-progress-circle__text">{progressPercentage}%</span>
          </div>
          <button 
            className="ClientDashboard-refresh-btn"
            onClick={handleRefresh}
            title="Refresh tasks"
          >
            <FiRefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="ClientDashboard-service-card__progress">
        <div className="ClientDashboard-progress-bar">
          <div 
            className={`ClientDashboard-progress-bar__fill ${
              progressPercentage >= 100 ? 'ClientDashboard-progress-bar__fill--success' :
              progressPercentage >= 70 ? 'ClientDashboard-progress-bar__fill--primary' :
              progressPercentage >= 40 ? 'ClientDashboard-progress-bar__fill--warning' : 'ClientDashboard-progress-bar__fill--info'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {expanded && (
        <div className="ClientDashboard-service-card__content">
          <div className="ClientDashboard-service-card__filters">
            <div className="ClientDashboard-filter-info">
              <span className="ClientDashboard-filter-badge">
                <FiCheckCircle /> Completed Tasks Only
              </span>
              <small className="ClientDashboard-last-updated">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </small>
            </div>
          </div>

          {tasks.length > 0 ? (
            <div className="ClientDashboard-tasks-list">
              {tasks.map(task => (
                <div key={task._id || task.id} className="ClientDashboard-task-item">
                  <div className="ClientDashboard-task-item__content" onClick={() => setShowTaskDetails({ open: true, task })}>
                    <div className="ClientDashboard-task-item__header">
                      <span className="ClientDashboard-task-item__name ClientDashboard-task-item__name--completed">
                        {task.name}
                      </span>
                      <div className="ClientDashboard-task-item__badges">
                        {task.priority && (
                          <span className={`ClientDashboard-priority-badge ClientDashboard-priority-badge--${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="ClientDashboard-assignee-badge">
                            <FiUser className="ClientDashboard-assignee-icon" />
                            {task.assignee}
                          </span>
                        )}
                        <span className="ClientDashboard-completed-badge">
                          <FiCheckCircle /> Completed
                        </span>
                      </div>
                    </div>
                    
                    <div className="ClientDashboard-task-item__meta">
                      {task.dueDate && (
                        <span className="ClientDashboard-task-due">
                          <FiCalendar className="ClientDashboard-meta-icon" />
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="ClientDashboard-task-completed-date">
                          <FiCheckCircle className="ClientDashboard-meta-icon" />
                          Completed: {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ClientDashboard-empty-tasks">
              <FiCheckCircle size={32} color="#ccc" />
              <p>No completed tasks found for this service</p>
              {totalTasks > 0 && (
                <p className="ClientDashboard-empty-subtext">
                  {totalTasks} total tasks, {totalTasks - completedTasks} pending
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {showTaskDetails.open && (
        <TaskDetailsModal
          task={showTaskDetails.task}
          open={showTaskDetails.open}
          onClose={() => setShowTaskDetails({ open: false, task: null })}
          projectManagers={clientProjectManagers}
        />
      )}
    </div>
  );
};

// Main ClientDashboard Component - UPDATED with auto-refresh
const ClientDashboard = () => {
  console.log('🔍 ClientDashboard mounted');
  
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [taskCounts, setTaskCounts] = useState({});
  const [tasksStats, setTasksStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    highPriorityTasks: 0,
    tasksThisWeek: 0,
    progressPercentage: 0
  });
  const [companyInfo, setCompanyInfo] = useState({
    companyCode: '',
    companyIdentifier: ''
  });
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState(Date.now());

  // API setup
  const api = axios.create({
    baseURL: `${API_URL}/clientsservice`,
    timeout: 10000,
  });

  const tasksApi = axios.create({
    baseURL: `${API_URL}/clienttasks`,
    timeout: 10000,
  });

  const usersApi = axios.create({
    baseURL: `${API_URL}/users`,
    timeout: 10000,
  });

  // Add token to requests
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      tasksApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      usersApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Fetch company info from localStorage
  useEffect(() => {
    const fetchCompanyInfo = () => {
      const companyCode = localStorage.getItem('companyCode') || '';
      const companyIdentifier = localStorage.getItem('companyIdentifier') || '';
      const company = localStorage.getItem('company') || '';
      
      setCompanyInfo({
        companyCode: companyCode || company,
        companyIdentifier: companyIdentifier
      });
    };

    fetchCompanyInfo();
  }, []);

  // Fetch project managers
  const fetchProjectManagers = async () => {
    try {
      const response = await usersApi.get('/company-users');
      
      let usersArray = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          usersArray = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersArray = response.data.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          usersArray = response.data.users;
        }
      }
      
      const formattedManagers = usersArray.map(user => ({
        _id: user._id || user.id,
        name: user.name || user.username || 'Unknown',
        email: user.email || '',
        role: user.role || user.jobRole || 'Team Member'
      }));
      
      setProjectManagers(formattedManagers);
    } catch (error) {
      console.error('❌ Error fetching project managers:', error);
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await api.get('/services', {
        params: {
          companyCode: companyInfo.companyCode,
          companyIdentifier: companyInfo.companyIdentifier
        }
      });
      
      if (response.data?.success) {
        setServices(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching services:', error);
    }
  };

  // Fetch client data
  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not found. Please login again.');
        return;
      }

      const user = JSON.parse(userStr);
      
      // Fetch all clients for this company
      const response = await api.get('/', {
        params: {
          companyCode: companyInfo.companyCode,
          companyIdentifier: companyInfo.companyIdentifier,
          search: user.email || user.name
        }
      });

      if (response.data?.success) {
        const allClients = response.data.data || [];
        setClients(allClients);
        
        // Find the current client
        const currentClient = allClients.find(c => 
          c.email === user.email || 
          c.client === user.name ||
          c._id === user.id
        ) || allClients[0];
        
        setClient(currentClient);
        setSelectedClient(currentClient);
        
        // Fetch project managers and services
        await Promise.all([
          fetchProjectManagers(),
          fetchServices()
        ]);
      }
    } catch (err) {
      console.error('❌ Error fetching client data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks for a client
  const fetchClientTasks = async (clientId) => {
    try {
      const response = await tasksApi.get(`/client/${clientId}`);
      if (response.data?.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching tasks for client ${clientId}:`, error);
      return [];
    }
  };

  // Calculate stats for all clients
  const calculateStats = async () => {
    if (!clients.length) return;

    const counts = {};
    let totalCompleted = 0;
    let totalTasks = 0;
    let totalOverdue = 0;
    let totalHighPriority = 0;
    let tasksThisWeek = 0;

    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    for (const client of clients) {
      const tasks = await fetchClientTasks(client._id);
      
      const clientCompleted = tasks.filter(t => t.completed).length;
      const clientTotal = tasks.length;
      const clientOverdue = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < today;
      }).length;
      const clientHighPriority = tasks.filter(t => t.priority === 'High' && !t.completed).length;
      const clientTasksThisWeek = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate <= weekFromNow;
      }).length;

      counts[client._id] = {
        total: clientTotal,
        completed: clientCompleted,
        pending: clientTotal - clientCompleted,
        overdue: clientOverdue
      };

      totalCompleted += clientCompleted;
      totalTasks += clientTotal;
      totalOverdue += clientOverdue;
      totalHighPriority += clientHighPriority;
      tasksThisWeek += clientTasksThisWeek;
    }

    setTaskCounts(counts);
    setTasksStats({
      totalTasks,
      completedTasks: totalCompleted,
      pendingTasks: totalTasks - totalCompleted,
      overdueTasks: totalOverdue,
      highPriorityTasks: totalHighPriority,
      tasksThisWeek,
      progressPercentage: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
    });
    setLastGlobalRefresh(Date.now());
  };

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (clients.length > 0) {
      const intervalId = setInterval(() => {
        console.log('🔄 Auto-refreshing stats...');
        calculateStats();
      }, 30000); // 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [clients]);

  useEffect(() => {
    if (companyInfo.companyCode || companyInfo.companyIdentifier) {
      fetchClientData();
    }
  }, [companyInfo.companyCode, companyInfo.companyIdentifier]);

  useEffect(() => {
    if (clients.length > 0) {
      calculateStats();
    }
  }, [clients]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyIdentifier');
    localStorage.removeItem('company');
    window.location.href = '/login';
  };

  const getProjectManagersDetails = (client) => {
    if (!client) return [];
    
    if (client.projectManagers && Array.isArray(client.projectManagers) && client.projectManagers.length > 0) {
      return client.projectManagers;
    }
    
    const managerNames = client.projectManager || [];
    return managerNames.map(name => {
      const manager = projectManagers.find(pm => pm.name === name);
      return manager || { name, _id: `temp-${Date.now()}` };
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'ClientDashboard-status-badge ClientDashboard-status-badge--success';
      case 'On Hold': return 'ClientDashboard-status-badge ClientDashboard-status-badge--warning';
      case 'Inactive': return 'ClientDashboard-status-badge ClientDashboard-status-badge--error';
      default: return 'ClientDashboard-status-badge';
    }
  };

  const handleGlobalRefresh = () => {
    console.log('🔄 Global refresh triggered');
    fetchClientData();
    calculateStats();
  };

  if (loading) {
    return (
      <div className="ClientDashboard-dashboard-loading">
        <div className="ClientDashboard-loading-spinner"></div>
        <p>Loading your dashboard...</p>
        <div className="ClientDashboard-loading-skeleton">
          <div className="ClientDashboard-skeleton-header"></div>
          <div className="ClientDashboard-skeleton-stats">
            {[1,2,3,4,5,6].map(i => <div key={i} className="ClientDashboard-skeleton-card"></div>)}
          </div>
          <div className="ClientDashboard-skeleton-content"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ClientDashboard-dashboard-error">
        <FiAlertCircle className="ClientDashboard-error-icon" />
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <div className="ClientDashboard-error-actions">
          <button className="ClientDashboard-btn ClientDashboard-btn--primary" onClick={fetchClientData}>
            Try Again
          </button>
          <button className="ClientDashboard-btn ClientDashboard-btn--outlined" onClick={handleLogout}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const currentClient = selectedClient || client;
  const clientManagers = getProjectManagersDetails(currentClient);
  const clientStats = taskCounts[currentClient?._id] || { total: 0, completed: 0, pending: 0, overdue: 0 };

  return (
    <div className="ClientDashboard-client-dashboard">
      {/* Header with Refresh Button */}
      <div className="ClientDashboard-header">
        <div className="ClientDashboard-header-left">
          <h1>Client Dashboard</h1>
          <p className="ClientDashboard-header-subtitle">
            Track your completed tasks and project progress
          </p>
        </div>
        <div className="ClientDashboard-header-right">
          <div className="ClientDashboard-last-refresh">
            Last updated: {new Date(lastGlobalRefresh).toLocaleTimeString()}
          </div>
          <button 
            className="ClientDashboard-refresh-header-btn"
            onClick={handleGlobalRefresh}
            title="Refresh all data"
          >
            <FiRefreshCw /> Refresh Dashboard
          </button>
        </div>
      </div>

      {/* Company Information Card */}
      <div className="ClientDashboard-info-card ClientDashboard-full-width">
        <h3>Company Information</h3>
        <div className="ClientDashboard-info-grid">
          <div className="ClientDashboard-info-item">
            <label>Company Name</label>
            <p>{currentClient?.company || 'N/A'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>City</label>
            <p>{currentClient?.city || 'N/A'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Email</label>
            <p>{currentClient?.email || 'Not provided'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Phone</label>
            <p>{currentClient?.phone || 'Not provided'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Client Since</label>
            <p>{formatDate(currentClient?.createdAt)}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Status</label>
            <span className={getStatusColor(currentClient?.status)}>
              {currentClient?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Team Card */}
      {clientManagers.length > 0 && (
        <div className="ClientDashboard-info-card ClientDashboard-full-width">
          <h3>Your Project Team</h3>
          <div className="ClientDashboard-team-grid">
            {clientManagers.map((manager, index) => (
              <div key={index} className="ClientDashboard-team-member">
                <div className="ClientDashboard-member-avatar">
                  {manager.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ClientDashboard-member-info">
                  <h4>{manager.name}</h4>
                  <p>{manager.role || 'Project Manager'}</p>
                  {manager.email && <small>{manager.email}</small>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects & Tasks - SHOWING ONLY COMPLETED TASKS */}
      <div className="ClientDashboard-projects-section">
        <div className="ClientDashboard-section-header">
          <h3>Your Completed Tasks</h3>
          {currentClient?.services && currentClient.services.length > 0 && (
            <div className="ClientDashboard-client-stats-summary">
              <span className="ClientDashboard-stat-summary ClientDashboard-stat-summary--success">
                <FiCheckCircle /> {clientStats.completed} completed
              </span>
              <span className="ClientDashboard-stat-summary ClientDashboard-stat-summary--warning">
                <FiClock /> {clientStats.pending} pending
              </span>
              {clientStats.overdue > 0 && (
                <span className="ClientDashboard-stat-summary ClientDashboard-stat-summary--error">
                  <FiAlertCircle /> {clientStats.overdue} overdue
                </span>
              )}
            </div>
          )}
        </div>
        
        {currentClient?.services && currentClient.services.length > 0 ? (
          <div className="ClientDashboard-services-list">
            {currentClient.services.map((service, index) => (
              <ServiceProgressCard
                key={index}
                service={service}
                clientId={currentClient._id}
                clientProjectManagers={clientManagers}
                api={tasksApi}
                onTaskUpdate={() => {
                  setTimeout(() => calculateStats(), 500);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="ClientDashboard-empty-state">
            <FiBriefcase className="ClientDashboard-empty-icon" />
            <h4>No Services Assigned</h4>
            <p>Your team hasn't assigned any services to you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;