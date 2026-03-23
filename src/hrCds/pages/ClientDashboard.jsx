// client-dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './ClientDashboard.css';

// Icons
import {
  FiBriefcase,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiClock,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
  FiMail,
  FiPhone,
  FiMapPin,
  FiAward,
  FiRefreshCw
} from 'react-icons/fi';

// ========== SERVICE PROGRESS CARD COMPONENT ==========
const ServiceProgressCard = ({ service, clientId, api }) => {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const isMounted = useRef(true);
  const refreshTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const fetchTasks = async (isAutoRefresh = false) => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      if (!isAutoRefresh) {
        setLoading(true);
      }
      
      const response = await api.get(`/client/${clientId}/service/${encodeURIComponent(service)}`);
      
      if (!isMounted.current) return;
      
      if (response.data?.success) {
        const fetchedTasks = response.data.data || [];
        setAllTasks(fetchedTasks);
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(fetchedTasks));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      if (isMounted.current) {
        const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
        if (savedTasks) {
          setAllTasks(JSON.parse(savedTasks));
        }
      }
    } finally {
      if (isMounted.current) {
        setIsRefreshing(false);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchTasks();
    }
  }, []);

  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    const POLLING_INTERVAL = 30000;
    
    pollingIntervalRef.current = setInterval(() => {
      fetchTasks(true);
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const completedTasks = allTasks.filter(task => task.completed === true);
  const totalTasks = allTasks.length;
  const pendingTasks = allTasks.filter(task => task.completed === false);
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  const overdueTasks = allTasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  });

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

  const handleRefresh = (e) => {
    e.stopPropagation();
    
    if (refreshTimeoutRef.current) {
      clearInterval(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      fetchTasks();
    }, 300);
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusBadge = (task) => {
    if (task.completed) {
      return <span className="ClientDashboard-badge ClientDashboard-badge--completed">✓ Completed</span>;
    }
    if (task.status === 'in-progress') {
      return <span className="ClientDashboard-badge ClientDashboard-badge--in-progress">⚡ In Progress</span>;
    }
    return <span className="ClientDashboard-badge ClientDashboard-badge--pending">⏳ Pending</span>;
  };

  if (loading) {
    return (
      <div className="ClientDashboard-service-card">
        <div className="ClientDashboard-service-card__loading">
          <div className="ClientDashboard-spinner"></div>
          <p>Loading tasks for {service}...</p>
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
          <div className="ClientDashboard-stats-container">
            <div className="ClientDashboard-stat-item">
              <span className="ClientDashboard-stat-label">Total</span>
              <span className="ClientDashboard-stat-value ClientDashboard-stat-value--total">{totalTasks}</span>
            </div>
            <div className="ClientDashboard-stat-item">
              <span className="ClientDashboard-stat-label">Completed</span>
              <span className="ClientDashboard-stat-value ClientDashboard-stat-value--completed">{completedTasks.length}</span>
            </div>
            <div className="ClientDashboard-stat-item">
              <span className="ClientDashboard-stat-label">Pending</span>
              <span className="ClientDashboard-stat-value ClientDashboard-stat-value--pending">{pendingTasks.length}</span>
            </div>
            {overdueTasks.length > 0 && (
              <div className="ClientDashboard-stat-item">
                <span className="ClientDashboard-stat-label">Overdue</span>
                <span className="ClientDashboard-stat-value ClientDashboard-stat-value--overdue">{overdueTasks.length}</span>
              </div>
            )}
          </div>
          
          <div className="ClientDashboard-progress-circle">
            <span className="ClientDashboard-progress-circle__text">{progressPercentage}%</span>
          </div>
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

      <div className="ClientDashboard-service-card__summary">
        <div className="ClientDashboard-summary-stats">
          <div className="ClientDashboard-summary-item" onClick={() => setShowAllTasks(false)}>
            <FiCheckCircle className="ClientDashboard-summary-icon ClientDashboard-text-success" />
            <span>{completedTasks.length} Completed</span>
          </div>
          <div className="ClientDashboard-summary-item" onClick={() => setShowAllTasks(true)}>
            <FiClock className="ClientDashboard-summary-icon ClientDashboard-text-warning" />
            <span>{pendingTasks.length} Pending</span>
          </div>
          {overdueTasks.length > 0 && (
            <div className="ClientDashboard-summary-item ClientDashboard-summary-item--overdue">
              <FiAlertCircle className="ClientDashboard-summary-icon ClientDashboard-text-error" />
              <span>{overdueTasks.length} Overdue</span>
            </div>
          )}
          <button 
            className="ClientDashboard-refresh-btn" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <FiRefreshCw className={`ClientDashboard-refresh-icon ${isRefreshing ? 'ClientDashboard-spinning' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ClientDashboard-service-card__content">
          <div className="ClientDashboard-view-toggle">
            <button 
              className={`ClientDashboard-toggle-btn ${!showAllTasks ? 'active' : ''}`}
              onClick={() => setShowAllTasks(false)}
            >
              <FiCheckCircle /> Completed ({completedTasks.length})
            </button>
            <button 
              className={`ClientDashboard-toggle-btn ${showAllTasks ? 'active' : ''}`}
              onClick={() => setShowAllTasks(true)}
            >
              <FiClock /> All Tasks ({totalTasks})
            </button>
          </div>

          {(showAllTasks ? allTasks : completedTasks).length > 0 ? (
            <div className="ClientDashboard-tasks-list">
              {(showAllTasks ? allTasks : completedTasks).map(task => (
                <div key={task._id || task.id} className={`ClientDashboard-task-item ${task.completed ? 'ClientDashboard-task-item--completed' : ''}`}>
                  <div className="ClientDashboard-task-item__content">
                    <div className="ClientDashboard-task-item__header">
                      <span className={`ClientDashboard-task-item__name ${task.completed ? 'ClientDashboard-task-item__name--completed' : ''}`}>
                        {task.name}
                      </span>
                      <div className="ClientDashboard-task-item__badges">
                        {getStatusBadge(task)}
                        {task.priority && (
                          <span 
                            className="ClientDashboard-priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ClientDashboard-task-item__meta">
                      {task.dueDate && !task.completed && (
                        <span className={`ClientDashboard-task-due-date ${new Date(task.dueDate) < new Date() ? 'ClientDashboard-task-due-date--overdue' : ''}`}>
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
                      {task.assignee && (
                        <span className="ClientDashboard-task-assignee">
                          <FiUsers className="ClientDashboard-meta-icon" />
                          {task.assignee}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <div className="ClientDashboard-task-description">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ClientDashboard-empty-tasks">
              <FiCheckCircle size={32} color="#ccc" />
              <p>No {showAllTasks ? '' : 'completed'} tasks found for this service</p>
              {pendingTasks.length > 0 && !showAllTasks && (
                <p className="ClientDashboard-empty-subtext">
                  {pendingTasks.length} pending tasks - click "All Tasks" to view them
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ========== MAIN CLIENT DASHBOARD COMPONENT ==========
const ClientDashboard = () => {
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskCounts, setTaskCounts] = useState({});
  const [companyInfo, setCompanyInfo] = useState({
    companyCode: '',
    companyIdentifier: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

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

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      tasksApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      usersApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

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
      
      if (isMounted.current) {
        setProjectManagers(formattedManagers);
      }
    } catch (error) {
      console.error('Error fetching project managers:', error);
    }
  };

  const fetchClientData = async () => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not found. Please login again.');
        return;
      }

      const user = JSON.parse(userStr);
      
      const response = await api.get('/', {
        params: {
          companyCode: companyInfo.companyCode,
          companyIdentifier: companyInfo.companyIdentifier,
          search: user.email || user.name
        }
      });

      if (response.data?.success && isMounted.current) {
        const allClients = response.data.data || [];
        
        const currentClient = allClients.find(c => 
          c.email === user.email || 
          c.client === user.name ||
          c._id === user.id
        ) || allClients[0];
        
        setClient(currentClient);
        
        await fetchProjectManagers();
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchClientTasks = async (clientId) => {
    try {
      const response = await tasksApi.get(`/client/${clientId}`);
      if (response.data?.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching tasks for client ${clientId}:`, error);
      return [];
    }
  };

  const calculateStats = async () => {
    if (!client || !isMounted.current) return;

    const tasks = await fetchClientTasks(client._id);
    
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    if (isMounted.current) {
      setTaskCounts({
        [client._id]: {
          total,
          completed,
          pending: total - completed,
          overdue
        }
      });
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await calculateStats();
    window.location.reload();
    setRefreshing(false);
  };

  useEffect(() => {
    if ((companyInfo.companyCode || companyInfo.companyIdentifier) && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchClientData();
    }
  }, [companyInfo.companyCode, companyInfo.companyIdentifier]);

  useEffect(() => {
    if (client) {
      calculateStats();
    }
  }, [client]);

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

  if (loading) {
    return (
      <div className="ClientDashboard-dashboard-loading">
        <div className="ClientDashboard-loading-spinner"></div>
        <p>Loading your dashboard...</p>
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

  if (!client) {
    return (
      <div className="ClientDashboard-dashboard-error">
        <FiAlertCircle className="ClientDashboard-error-icon" />
        <h3>No Client Data</h3>
        <p>No client information found for your account.</p>
        <button className="ClientDashboard-btn ClientDashboard-btn--primary" onClick={handleLogout}>
          Go to Login
        </button>
      </div>
    );
  }

  const clientManagers = getProjectManagersDetails(client);
  const clientStats = taskCounts[client?._id] || { total: 0, completed: 0, pending: 0, overdue: 0 };

  return (
    <div className="ClientDashboard-client-dashboard">
      {/* Overall Stats Section */}
      <div className="ClientDashboard-overall-stats">
        <div className="ClientDashboard-stat-card ClientDashboard-stat-card--total">
          <FiTrendingUp className="ClientDashboard-stat-icon" />
          <div className="ClientDashboard-stat-content">
            <span className="ClientDashboard-stat-label">Total Tasks</span>
            <span className="ClientDashboard-stat-number">{clientStats.total}</span>
          </div>
        </div>
        <div className="ClientDashboard-stat-card ClientDashboard-stat-card--completed">
          <FiCheckCircle className="ClientDashboard-stat-icon" />
          <div className="ClientDashboard-stat-content">
            <span className="ClientDashboard-stat-label">Completed</span>
            <span className="ClientDashboard-stat-number">{clientStats.completed}</span>
          </div>
        </div>
        <div className="ClientDashboard-stat-card ClientDashboard-stat-card--pending">
          <FiClock className="ClientDashboard-stat-icon" />
          <div className="ClientDashboard-stat-content">
            <span className="ClientDashboard-stat-label">Pending</span>
            <span className="ClientDashboard-stat-number">{clientStats.pending}</span>
          </div>
        </div>
        {clientStats.overdue > 0 && (
          <div className="ClientDashboard-stat-card ClientDashboard-stat-card--overdue">
            <FiAlertCircle className="ClientDashboard-stat-icon" />
            <div className="ClientDashboard-stat-content">
              <span className="ClientDashboard-stat-label">Overdue</span>
              <span className="ClientDashboard-stat-number">{clientStats.overdue}</span>
            </div>
          </div>
        )}
        <button 
          className="ClientDashboard-refresh-all-btn"
          onClick={handleRefreshAll}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'ClientDashboard-spinning' : ''} />
          Refresh
        </button>
      </div>

      <div className="ClientDashboard-info-card ClientDashboard-full-width">
        <h3>Company Information</h3>
        <div className="ClientDashboard-info-grid">
          <div className="ClientDashboard-info-item">
            <label>Company Name</label>
            <p>{client?.company || 'N/A'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>City</label>
            <p>{client?.city || 'N/A'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Email</label>
            <p>{client?.email || 'Not provided'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Phone</label>
            <p>{client?.phone || 'Not provided'}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Client Since</label>
            <p>{formatDate(client?.createdAt)}</p>
          </div>
          <div className="ClientDashboard-info-item">
            <label>Status</label>
            <span className={getStatusColor(client?.status)}>
              {client?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

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

      <div className="ClientDashboard-projects-section">
        <div className="ClientDashboard-section-header">
          <h3>Services & Tasks Overview</h3>
        </div>
        
        {client?.services && client.services.length > 0 ? (
          <div className="ClientDashboard-services-list">
            {client.services.map((service, index) => (
              <ServiceProgressCard
                key={index}
                service={service}
                clientId={client._id}
                api={tasksApi}
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