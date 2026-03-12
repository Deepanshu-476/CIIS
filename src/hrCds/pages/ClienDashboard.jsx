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
  FiMenu,
  FiX
} from 'react-icons/fi';

const ClientDashboard = () => {
  console.log('🔍 ClientDashboard mounted');
  
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    progressPercentage: 0
  });

  // API setup with auth token
  const api = axios.create({
    baseURL: `${API_URL}`,
    timeout: 10000,
  });

  // Add token to requests
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Fetch client data on mount
  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    console.log('🔍 Fetching client data...');
    try {
      setLoading(true);
      
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not found. Please login again.');
        return;
      }

      const user = JSON.parse(userStr);
      console.log('🔍 Current user:', user);

      // Fetch client details using user's email
      const clientResponse = await api.get(`/clients/${user.id}`);
      console.log('✅ Client response:', clientResponse.data);

      if (clientResponse.data.success) {
        const clientData = clientResponse.data.data;
        setClient(clientData);
        
        // Fetch tasks for this client
        await fetchTasks(clientData._id);
      } else {
        setError('Failed to load client data');
      }
    } catch (err) {
      console.error('❌ Error fetching client data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (clientId) => {
    console.log(`🔍 Fetching tasks for client: ${clientId}`);
    try {
      const response = await api.get(`/clienttasks/client/${clientId}`);
      console.log('✅ Tasks response:', response.data);

      if (response.data.success) {
        const tasksData = response.data.data;
        
        // Group tasks by service
        const tasksByService = {};
        let totalCompleted = 0;
        let totalTasks = 0;

        tasksData.forEach(task => {
          const serviceName = task.service || 'General';
          if (!tasksByService[serviceName]) {
            tasksByService[serviceName] = [];
          }
          tasksByService[serviceName].push(task);
          
          if (task.completed) totalCompleted++;
          totalTasks++;
        });

        setTasks(tasksByService);
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdueTasks = tasksData.filter(task => {
          if (!task.dueDate || task.completed) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length;

        setStats({
          totalTasks,
          completedTasks: totalCompleted,
          pendingTasks: totalTasks - totalCompleted,
          overdueTasks,
          progressPercentage: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
        });
      }
    } catch (err) {
      console.error('❌ Error fetching tasks:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'ClientDashboard-status-badge ClientDashboard-status-badge--active';
      case 'On Hold': return 'ClientDashboard-status-badge ClientDashboard-status-badge--hold';
      case 'Inactive': return 'ClientDashboard-status-badge ClientDashboard-status-badge--inactive';
      default: return 'ClientDashboard-status-badge';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'ClientDashboard-priority-badge ClientDashboard-priority-badge--high';
      case 'Medium': return 'ClientDashboard-priority-badge ClientDashboard-priority-badge--medium';
      case 'Low': return 'ClientDashboard-priority-badge ClientDashboard-priority-badge--low';
      default: return 'ClientDashboard-priority-badge';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  if (loading) {
    return (
      <div className="ClientDashboard-client-dashboard-loading">
        <div className="ClientDashboard-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ClientDashboard-client-dashboard-error">
        <FiAlertCircle className="ClientDashboard-error-icon" />
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button className="ClientDashboard-btn ClientDashboard-btn--primary" onClick={fetchClientData}>
          Try Again
        </button>
        <button className="ClientDashboard-btn ClientDashboard-btn--outlined" onClick={handleLogout}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="ClientDashboard-client-dashboard">
      {/* Mobile Menu Button */}
      <button className="ClientDashboard-mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
        <FiMenu />
      </button>

      {/* Sidebar */}
      <div className={`ClientDashboard-dashboard-sidebar ${sidebarOpen ? 'ClientDashboard-sidebar-open' : ''}`}>
        <div className="ClientDashboard-sidebar-header">
          <h2>CIIS NETWORK</h2>
          <button className="ClientDashboard-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <div className="ClientDashboard-sidebar-user">
          <div className="ClientDashboard-user-avatar">
            {client?.client?.charAt(0) || 'C'}
          </div>
          <div className="ClientDashboard-user-info">
            <h4>{client?.client || 'Client'}</h4>
            <p>{client?.company || 'Company'}</p>
          </div>
          <span className={getStatusColor(client?.status)}>
            {client?.status}
          </span>
        </div>

        <nav className="ClientDashboard-sidebar-nav">
          <a href="#" className="ClientDashboard-nav-item ClientDashboard-nav-item--active">
            <FiTrendingUp />
            <span>Dashboard</span>
          </a>
          <a href="#" className="ClientDashboard-nav-item">
            <FiBriefcase />
            <span>Projects</span>
          </a>
          <a href="#" className="ClientDashboard-nav-item">
            <FiUser />
            <span>Team</span>
          </a>
          <button className="ClientDashboard-nav-item ClientDashboard-nav-item--logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ClientDashboard-dashboard-main">
        {/* Header */}
        <div className="ClientDashboard-dashboard-header">
          <h1>Welcome, {client?.client}!</h1>
          <div className="ClientDashboard-header-date">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ClientDashboard-stats-grid">
          <div className="ClientDashboard-stat-card ClientDashboard-stat-card--primary">
            <div className="ClientDashboard-stat-icon">
              <FiTrendingUp />
            </div>
            <div className="ClientDashboard-stat-content">
              <span className="ClientDashboard-stat-label">Overall Progress</span>
              <h2 className="ClientDashboard-stat-value">{stats.progressPercentage}%</h2>
              <div className="ClientDashboard-progress-bar">
                <div 
                  className="ClientDashboard-progress-fill" 
                  style={{ width: `${stats.progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="ClientDashboard-stat-card ClientDashboard-stat-card--success">
            <div className="ClientDashboard-stat-icon">
              <FiCheckCircle />
            </div>
            <div className="ClientDashboard-stat-content">
              <span className="ClientDashboard-stat-label">Completed</span>
              <h2 className="ClientDashboard-stat-value">{stats.completedTasks}</h2>
              <span className="ClientDashboard-stat-sub">out of {stats.totalTasks}</span>
            </div>
          </div>

          <div className="ClientDashboard-stat-card ClientDashboard-stat-card--warning">
            <div className="ClientDashboard-stat-icon">
              <FiClock />
            </div>
            <div className="ClientDashboard-stat-content">
              <span className="ClientDashboard-stat-label">Pending</span>
              <h2 className="ClientDashboard-stat-value">{stats.pendingTasks}</h2>
              <span className="ClientDashboard-stat-sub">tasks remaining</span>
            </div>
          </div>

          <div className="ClientDashboard-stat-card ClientDashboard-stat-card--error">
            <div className="ClientDashboard-stat-icon">
              <FiAlertCircle />
            </div>
            <div className="ClientDashboard-stat-content">
              <span className="ClientDashboard-stat-label">Overdue</span>
              <h2 className="ClientDashboard-stat-value">{stats.overdueTasks}</h2>
              <span className="ClientDashboard-stat-sub">tasks overdue</span>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="ClientDashboard-company-info">
          <h3>Company Information</h3>
          <div className="ClientDashboard-info-grid">
            <div className="ClientDashboard-info-item">
              <label>Company Name</label>
              <p>{client?.company}</p>
            </div>
            <div className="ClientDashboard-info-item">
              <label>City</label>
              <p>{client?.city}</p>
            </div>
            <div className="ClientDashboard-info-item">
              <label>Email</label>
              <p>{client?.email || 'Not provided'}</p>
            </div>
            <div className="ClientDashboard-info-item">
              <label>Phone</label>
              <p>{client?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Projects & Tasks */}
        <div className="ClientDashboard-projects-section">
          <h3>Your Projects</h3>
          
          {Object.keys(tasks).length === 0 ? (
            <div className="ClientDashboard-empty-state">
              <FiBriefcase className="ClientDashboard-empty-icon" />
              <h4>No tasks yet</h4>
              <p>Your team hasn't assigned any tasks yet.</p>
            </div>
          ) : (
            <div className="ClientDashboard-projects-list">
              {Object.entries(tasks).map(([serviceName, serviceTasks]) => {
                const completed = serviceTasks.filter(t => t.completed).length;
                const total = serviceTasks.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                const overdueCount = serviceTasks.filter(t => 
                  !t.completed && isOverdue(t.dueDate)
                ).length;

                return (
                  <div 
                    key={serviceName} 
                    className={`ClientDashboard-project-card ${selectedService === serviceName ? 'ClientDashboard-project-expanded' : ''}`}
                  >
                    <div 
                      className="ClientDashboard-project-header"
                      onClick={() => setSelectedService(
                        selectedService === serviceName ? null : serviceName
                      )}
                    >
                      <div className="ClientDashboard-project-title">
                        <h4>{serviceName}</h4>
                        <FiChevronRight className={`ClientDashboard-project-arrow ${selectedService === serviceName ? 'ClientDashboard-arrow-rotated' : ''}`} />
                      </div>
                      
                      <div className="ClientDashboard-project-stats">
                        <span className="ClientDashboard-stat">
                          Progress: <strong>{progress}%</strong>
                        </span>
                        <span className="ClientDashboard-stat">
                          Tasks: <strong>{completed}/{total}</strong>
                        </span>
                        {overdueCount > 0 && (
                          <span className="ClientDashboard-stat ClientDashboard-overdue">
                            Overdue: <strong>{overdueCount}</strong>
                          </span>
                        )}
                      </div>

                      <div className="ClientDashboard-project-progress">
                        <div className="ClientDashboard-progress-bar">
                          <div 
                            className="ClientDashboard-progress-fill"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {selectedService === serviceName && (
                      <div className="ClientDashboard-project-tasks">
                        <h5>Tasks</h5>
                        <div className="ClientDashboard-tasks-list">
                          {serviceTasks.map(task => (
                            <div key={task._id || task.id} className="ClientDashboard-task-item">
                              <div className="ClientDashboard-task-checkbox">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  readOnly
                                />
                              </div>
                              <div className="ClientDashboard-task-content">
                                <div className="ClientDashboard-task-header">
                                  <p className={`ClientDashboard-task-name ${task.completed ? 'ClientDashboard-task-completed' : ''}`}>
                                    {task.name}
                                  </p>
                                  {task.priority && (
                                    <span className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="ClientDashboard-task-meta">
                                  {task.assignee && (
                                    <span className="ClientDashboard-task-assignee">
                                      <FiUser /> {task.assignee}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className={`ClientDashboard-task-due ${isOverdue(task.dueDate) && !task.completed ? 'ClientDashboard-due-overdue' : ''}`}>
                                      <FiCalendar /> {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>

                                {task.completed && task.completedAt && (
                                  <small className="ClientDashboard-task-completed">
                                    Completed: {formatDate(task.completedAt)}
                                  </small>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Section */}
        {client?.projectManager && client.projectManager.length > 0 && (
          <div className="ClientDashboard-team-section">
            <h3>Your Project Team</h3>
            <div className="ClientDashboard-team-list">
              {client.projectManager.map((manager, index) => (
                <div key={index} className="ClientDashboard-team-member">
                  <div className="ClientDashboard-member-avatar">
                    {manager.charAt(0)}
                  </div>
                  <div className="ClientDashboard-member-info">
                    <h4>{manager}</h4>
                    <p>Project Manager</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;