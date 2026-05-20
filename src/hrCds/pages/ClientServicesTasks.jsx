import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './ServicesTasks.css';

// Icons
import {
  FiFolder,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiUser,
  FiChevronRight,
  FiAlertCircle,
  FiPlayCircle,
  FiCheckSquare,
  FiList,
  FiRefreshCw
} from 'react-icons/fi';

// ========== HELPER FUNCTIONS ==========
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

// ========== ANIMATED PROGRESS RING ==========
const AnimatedProgressRing = ({ percentage, size = 80, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="ClientDashboard-animated-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(59, 130, 246, 0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="ClientDashboard-ring-progress"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="ClientDashboard-ring-text"
      >
        {percentage}%
      </text>
    </svg>
  );
};

// ========== SERVICE PROGRESS CARD ==========
const ServiceProgressCard = ({ service, clientId, api }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [hoveredTask, setHoveredTask] = useState(null);

  const isMounted = useRef(true);
  const pollingIntervalRef = useRef(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
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
      
      const encodedService = encodeURIComponent(service);
      const response = await api.get(`/client/${clientId}/service/${encodedService}`);
      
      if (!isMounted.current) return;
      
      if (response.data?.success) {
        const fetchedTasks = response.data.data || [];
        setTasks(fetchedTasks);
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(fetchedTasks));
      } else {
        const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
      }
    } catch (error) {
      console.error(`Error fetching tasks for ${service}:`, error);
      
      if (isMounted.current) {
        const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
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

  const completedTasks = tasks.filter(task => task.completed === true);
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.completed === false);
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  const overdueTasks = tasks.filter(task => {
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

  const getPriorityBadgeClass = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'ClientDashboard-priority-high';
      case 'medium': return 'ClientDashboard-priority-medium';
      case 'low': return 'ClientDashboard-priority-low';
      default: return '';
    }
  };

  const getStatusBadge = (task) => {
    if (task.completed) {
      return <span className="ClientDashboard-badge ClientDashboard-badge--completed"><FiCheckCircle size={12} /> Completed</span>;
    }
    if (task.status === 'in-progress') {
      return <span className="ClientDashboard-badge ClientDashboard-badge--in-progress"><FiPlayCircle size={12} /> In Progress</span>;
    }
    return <span className="ClientDashboard-badge ClientDashboard-badge--pending"><FiClock size={12} /> Pending</span>;
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="ClientDashboard-service-card ClientDashboard-service-card--loading">
        <div className="ClientDashboard-service-card__loading">
          <div className="ClientDashboard-spinner"></div>
          <p>Loading tasks for {service}...</p>
        </div>
      </div>
    );
  }

  const tasksToDisplay = showCompletedTasks ? completedTasks : tasks;
  const displayTitle = showCompletedTasks ? 'Completed Tasks' : 'All Tasks';

  return (
    <div className={`ClientDashboard-service-card ${expanded ? 'ClientDashboard-service-card--expanded' : ''}`}>
      <div className="ClientDashboard-service-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="ClientDashboard-service-card__title">
          <div className="ClientDashboard-service-icon-wrapper">
            <FiFolder className="ClientDashboard-service-icon" />
          </div>
          <div>
            <h4>{service}</h4>
            <p className="ClientDashboard-service-subtitle">
              {completedTasks.length} of {totalTasks} tasks completed
            </p>
          </div>
          <FiChevronRight className={`ClientDashboard-service-arrow ${expanded ? 'ClientDashboard-service-arrow--rotated' : ''}`} />
        </div>
        
        <div className="ClientDashboard-service-card__stats">
          <AnimatedProgressRing percentage={progressPercentage} size={56} strokeWidth={4} />
          
          <div className="ClientDashboard-stats-container">
            <div className="ClientDashboard-stat-item">
              <span className="ClientDashboard-stat-value ClientDashboard-stat-value--total">{totalTasks}</span>
              <span className="ClientDashboard-stat-label">Total</span>
            </div>
            <div className="ClientDashboard-stat-item">
              <span className="ClientDashboard-stat-value ClientDashboard-stat-value--completed">{completedTasks.length}</span>
              <span className="ClientDashboard-stat-label">Done</span>
            </div>
            <div className="ClientDashboard-stat-item">
              <span className="ClientDashboard-stat-value ClientDashboard-stat-value--pending">{pendingTasks.length}</span>
              <span className="ClientDashboard-stat-label">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ClientDashboard-service-card__content-area">
        <div className="ClientDashboard-service-card__summary">
          <div className="ClientDashboard-summary-stats">
            <button 
              className={`ClientDashboard-summary-item ${!showCompletedTasks ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowCompletedTasks(false); }}
            >
              <FiList size={14} />
              <span>All Tasks ({totalTasks})</span>
            </button>
            <button 
              className={`ClientDashboard-summary-item ${showCompletedTasks ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowCompletedTasks(true); }}
            >
              <FiCheckSquare size={14} />
              <span>Completed ({completedTasks.length})</span>
            </button>
            {overdueTasks.length > 0 && (
              <div className="ClientDashboard-summary-item ClientDashboard-summary-item--overdue">
                <FiAlertCircle size={14} />
                <span>{overdueTasks.length} Overdue</span>
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="ClientDashboard-service-card__content">
            <div className="ClientDashboard-view-header">
              <h5>{displayTitle}</h5>
            </div>

            {tasksToDisplay.length > 0 ? (
              <div className="ClientDashboard-tasks-list">
                {tasksToDisplay.map(task => (
                  <div 
                    key={task._id || task.id} 
                    className={`ClientDashboard-task-item ${task.completed ? 'ClientDashboard-task-item--completed' : ''}`}
                    onMouseEnter={() => setHoveredTask(task._id || task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    <div className="ClientDashboard-task-item__status">
                      {task.completed ? 
                        <FiCheckCircle className="ClientDashboard-task-status-icon completed" /> : 
                        <FiClock className="ClientDashboard-task-status-icon pending" />
                      }
                    </div>
                    <div className="ClientDashboard-task-item__content">
                      <div className="ClientDashboard-task-item__header">
                        <span className={`ClientDashboard-task-item__name ${task.completed ? 'ClientDashboard-task-item__name--completed' : ''}`}>
                          {task.name}
                        </span>
                        <div className="ClientDashboard-task-item__badges">
                          {task.priority && task.priority !== 'Medium' && (
                            <span className={`ClientDashboard-priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}
                          {getStatusBadge(task)}
                        </div>
                      </div>
                      
                      <div className="ClientDashboard-task-item__meta">
                        {task.assignee && (
                          <span className="ClientDashboard-task-assignee">
                            <FiUser className="ClientDashboard-meta-icon" />
                            {task.assignee}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`ClientDashboard-task-due-date ${!task.completed && new Date(task.dueDate) < new Date() ? 'ClientDashboard-task-due-date--overdue' : ''}`}>
                            <FiCalendar className="ClientDashboard-meta-icon" />
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    {hoveredTask === (task._id || task.id) && !task.completed && (
                      <button className="ClientDashboard-task-action">
                        <FiCheckCircle size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ClientDashboard-empty-tasks">
                <FiCheckCircle size={32} />
                <p>No {showCompletedTasks ? 'completed' : ''} tasks found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ========== MAIN SERVICES & TASKS COMPONENT ==========
const ServicesTasks = () => {
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    companyCode: '',
    companyIdentifier: ''
  });

  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

  const api = axios.create({
    baseURL: `${API_URL}/clientsservice`,
    timeout: 10000,
  });

  const tasksApi = axios.create({
    baseURL: `${API_URL}/tasks`,
    timeout: 10000,
  });

  const addAuthInterceptor = (axiosInstance) => {
    axiosInstance.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  };

  addAuthInterceptor(api);
  addAuthInterceptor(tasksApi);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
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
          companyIdentifier: companyInfo.companyIdentifier
        }
      });

      if (response.data?.success && isMounted.current) {
        const allClients = response.data.data || [];
        
        let currentClient = allClients.find(c => 
          c.email === user.email || 
          c.client === user.name ||
          c._id === user.id ||
          (c.projectManagers && c.projectManagers.some(pm => pm.email === user.email))
        );
        
        if (!currentClient && allClients.length > 0) {
          currentClient = allClients[0];
        }
        
        setClient(currentClient);
        
        if (currentClient && currentClient.services) {
          setServices(currentClient.services);
        }
      } else {
        setError('No client data found');
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Failed to load services');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    // Refresh will be handled by individual service cards
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    if ((companyInfo.companyCode || companyInfo.companyIdentifier) && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchClientData();
    }
  }, [companyInfo.companyCode, companyInfo.companyIdentifier]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyIdentifier');
    localStorage.removeItem('company');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="ClientDashboard-dashboard-loading">
        <div className="ClientDashboard-loading-spinner"></div>
        <p>Loading your services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ClientDashboard-dashboard-error">
        <FiAlertCircle className="ClientDashboard-error-icon" />
        <h3>Error Loading Services</h3>
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

  return (
    <div className="ClientDashboard-services-tasks-page">
      <div className="ClientDashboard-welcome-header">
        <div>
          <h1>Services & Tasks</h1>
          <p>Track your progress across all services</p>
        </div>
        <div className="ClientDashboard-section-actions">
          <button 
            className="ClientDashboard-refresh-btn"
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {services.length > 0 ? (
        <div className="ClientDashboard-services-list">
          {services.map((service, index) => (
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
          <FiFolder className="ClientDashboard-empty-icon" />
          <h4>No Services Assigned</h4>
          <p>Your team hasn't assigned any services to you yet.</p>
        </div>
      )}
    </div>
  );
};

export default ServicesTasks;