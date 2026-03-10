import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './clientDashboard.css';


// Import icons from react-icons
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUsers,
  FiPlus,
  FiRefreshCw,
  FiEdit,
  FiEye,
  FiTrash2,
  FiX,
  FiBriefcase,
  FiHome,
  FiLogOut,
  FiUser
} from 'react-icons/fi';

const TaskDetailsModal = ({ task, open, onClose, projectManagers = [] }) => {
  if (!open) return null;

  const getAssigneeDetails = (assigneeName) => {
    return projectManagers.find(pm => pm.name === assigneeName);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'badge--error';
      case 'medium': return 'badge--warning';
      case 'low': return 'badge--info';
      default: return '';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Task Details</h3>
          <button className="action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal__content">
          <div className="form-group">
            <label className="form-label">Task Name</label>
            <p className="text-large">{task.name}</p>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <div className={`badge ${task.completed ? 'badge--success' : 'badge--warning'}`}>
                {task.completed ? 'Completed' : 'Pending'}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className={`badge ${getPriorityColor(task.priority)}`}>
                {task.priority || 'Medium'}
              </div>
            </div>
          </div>

          {task.dueDate && (
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <div className="flex-align-center gap-1">
                <p>{new Date(task.dueDate).toLocaleDateString()}</p>
                {isOverdue(task.dueDate) && !task.completed && (
                  <div className="badge badge--error">Overdue</div>
                )}
              </div>
            </div>
          )}

          {task.assignee && (
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <p>{task.assignee}</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Created</label>
            <p>
              {new Date(task.createdAt).toLocaleDateString()} at{' '}
              {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {task.completed && task.completedAt && (
            <div className="form-group">
              <label className="form-label">Completed</label>
              <p>
                {new Date(task.completedAt).toLocaleDateString()} at{' '}
                {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const ServiceProgressCard = ({ service, clientId, clientProjectManagers = [], onTaskUpdate }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: '',
    dueDate: '',
    assignee: '',
    priority: 'Medium'
  });
  const [showAddTask, setShowAddTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState({ open: false, task: null });
  const [loading, setLoading] = useState(true);

  // Load tasks from localStorage on mount
  useEffect(() => {
    loadTasks();
  }, [clientId, service]);

  const loadTasks = () => {
    try {
      const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        // Initialize with empty array if no tasks exist
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Save tasks to localStorage whenever they change
  const saveTasks = (updatedTasks) => {
    try {
      localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = () => {
    if (newTask.name.trim()) {
      const newTaskObj = {
        id: Date.now(),
        name: newTask.name.trim(),
        dueDate: newTask.dueDate || null,
        assignee: newTask.assignee,
        priority: newTask.priority,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      
      const updatedTasks = [...tasks, newTaskObj];
      saveTasks(updatedTasks);
      
      setNewTask({ name: '', dueDate: '', assignee: '', priority: 'Medium' });
      setShowAddTask(false);
    }
  };

  const handleEditTask = () => {
    if (editTask && editTask.name.trim()) {
      const updatedTasks = tasks.map(task => 
        task.id === editTask.id ? { ...editTask, name: editTask.name.trim() } : task
      );
      saveTasks(updatedTasks);
      setEditTask(null);
    }
  };

  const toggleTaskCompletion = (task) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? new Date().toISOString() : null
        };
      }
      return t;
    });
    saveTasks(updatedTasks);
  };

  const deleteTask = (task) => {
    const updatedTasks = tasks.filter(t => t.id !== task.id);
    saveTasks(updatedTasks);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'badge--error';
      case 'medium': return 'badge--warning';
      case 'low': return 'badge--info';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card__content">
          <div className="flex-align-center justify-center py-3">
            <div className="spinner-small"></div>
            <p className="ml-2">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-2">
      <div className="card__content">
        <div className="flex-align-center justify-between mb-2">
          <div className="flex-grow-1">
            <h4 className="mb-1">{service}</h4>
            <p className="text-muted">
              {completedTasks} / {totalTasks} tasks completed
            </p>
          </div>
          <div className="flex-align-center gap-1">
            <div className={`badge ${
              progressPercentage >= 100 ? 'badge--success' :
              progressPercentage >= 70 ? 'badge--info' :
              progressPercentage >= 40 ? 'badge--warning' : 'badge--error'
            }`}>
              {Math.round(progressPercentage)}%
            </div>
            <button 
              className="action-button action-button--primary"
              onClick={() => setShowAddTask(!showAddTask)}
              title="Add Task"
            >
              <FiPlus />
            </button>
            <button 
              className="action-button"
              onClick={loadTasks}
              title="Refresh Tasks"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        <div className="progress-bar mb-2">
          <div 
            className={`progress-bar__fill ${
              progressPercentage >= 100 ? 'progress-bar__fill--success' :
              progressPercentage >= 70 ? 'progress-bar__fill--primary' :
              progressPercentage >= 40 ? 'progress-bar__fill--warning' : 'progress-bar__fill--error'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {(showAddTask || editTask) && (
          <div className="card mb-2 p-2 bg-grey-50">
            <h5 className="mb-2">{editTask ? 'Edit Task' : 'Add New Task'}</h5>
            <div className="space-y-2">
              <input
                type="text"
                className="form-input"
                placeholder="Enter task name..."
                value={editTask ? editTask.name : newTask.name}
                onChange={(e) => {
                  if (editTask) {
                    setEditTask({ ...editTask, name: e.target.value });
                  } else {
                    setNewTask({ ...newTask, name: e.target.value });
                  }
                }}
                autoFocus
              />
              
              <div className="grid-2 gap-2">
                <input
                  type="date"
                  className="form-input"
                  value={editTask?.dueDate?.split('T')[0] || newTask.dueDate}
                  onChange={(e) => {
                    if (editTask) {
                      setEditTask({ ...editTask, dueDate: e.target.value });
                    } else {
                      setNewTask({ ...newTask, dueDate: e.target.value });
                    }
                  }}
                />
                
                <select
                  className="form-input"
                  value={editTask ? editTask.assignee : newTask.assignee}
                  onChange={(e) => {
                    if (editTask) {
                      setEditTask({ ...editTask, assignee: e.target.value });
                    } else {
                      setNewTask({ ...newTask, assignee: e.target.value });
                    }
                  }}
                >
                  <option value="">Select Assignee</option>
                  {clientProjectManagers.map((pm) => (
                    <option key={pm._id || pm.id} value={pm.name}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <select
                className="form-input"
                value={editTask ? editTask.priority : newTask.priority}
                onChange={(e) => {
                  if (editTask) {
                    setEditTask({ ...editTask, priority: e.target.value });
                  } else {
                    setNewTask({ ...newTask, priority: e.target.value });
                  }
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              
              <div className="flex justify-end gap-1">
                <button 
                  className="btn btn--outlined"
                  onClick={() => {
                    setEditTask(null);
                    setShowAddTask(false);
                    setNewTask({ name: '', dueDate: '', assignee: '', priority: 'Medium' });
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn--primary"
                  onClick={editTask ? handleEditTask : handleAddTask}
                  disabled={editTask ? !editTask.name.trim() : !newTask.name.trim()}
                >
                  {editTask ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h5 className="mb-2">Tasks ({totalTasks})</h5>
          {tasks.length > 0 ? (
            <div className="task-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-item__checkbox">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task)}
                    />
                  </div>
                  <div className="task-item__content">
                    <div className="flex-align-center gap-1 flex-wrap">
                      <p className={task.completed ? 'text-line-through text-muted' : ''}>
                        {task.name}
                      </p>
                      
                      {task.priority && task.priority !== 'Medium' && (
                        <div className={`badge ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </div>
                      )}
                      
                      {task.assignee && (
                        <div className="badge" title={`Assigned to: ${task.assignee}`}>
                          {task.assignee}
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="badge" title={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <small className="text-muted">
                      Added: {new Date(task.createdAt).toLocaleDateString()}
                      {task.completed && task.completedAt && (
                        <> • Completed: {new Date(task.completedAt).toLocaleDateString()}</>
                      )}
                    </small>
                  </div>
                  <div className="task-item__actions">
                    <button 
                      className="action-button"
                      onClick={() => setShowTaskDetails({ open: true, task })}
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button 
                      className="action-button action-button--primary"
                      onClick={() => setEditTask(task)}
                      title="Edit Task"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      className="action-button action-button--error"
                      onClick={() => deleteTask(task)}
                      title="Delete Task"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 border-dashed border rounded bg-grey-50">
              <p className="text-muted">No tasks yet. Click + to add.</p>
            </div>
          )}
        </div>
      </div>

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

const ClientDashboard = () => {
  const [clientData, setClientData] = useState(null);
  const [services, setServices] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });

  const api = axios.create({
    baseURL: `${API_URL}/clientsservice`,
    timeout: 10000,
  });

  const usersApi = axios.create({
    baseURL: `${API_URL}/users`,
    timeout: 10000,
  });

  // Get client data from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const companyCode = localStorage.getItem('companyCode');
      
      console.log('Loading user data:', { userStr, companyCode });
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('Parsed user data:', userData);
        
        setClientData({
          ...userData,
          companyCode: companyCode || userData.companyCode
        });
      } else {
        setError('No client data found. Please login again.');
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      setError('Error loading client information');
    }
  }, []);

  // Set up axios interceptors
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    const addAuthInterceptor = (axiosInstance) => {
      axiosInstance.interceptors.request.use(
        (config) => {
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );
    };

    addAuthInterceptor(api);
    addAuthInterceptor(usersApi);
  }, []);

  // Fetch client's services and project managers
  const fetchClientDetails = async () => {
    if (!clientData?._id) {
      console.log('No client ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching details for client:', clientData._id);
      
      // Fetch services
      try {
        const servicesRes = await api.get('/services', {
          params: { companyCode: clientData.companyCode }
        });
        
        console.log('Services response:', servicesRes.data);
        
        if (servicesRes.data?.success) {
          setServices(servicesRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }

      // Fetch project managers
      try {
        const usersRes = await usersApi.get('/company-users');
        console.log('Users response:', usersRes.data);
        
        let usersArray = [];
        if (usersRes.data) {
          if (Array.isArray(usersRes.data)) {
            usersArray = usersRes.data;
          } else if (usersRes.data.data && Array.isArray(usersRes.data.data)) {
            usersArray = usersRes.data.data;
          } else if (usersRes.data.users && Array.isArray(usersRes.data.users)) {
            usersArray = usersRes.data.users;
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
        console.error('Error fetching project managers:', error);
      }

    } catch (error) {
      console.error('Error in fetchClientDetails:', error);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientData?._id) {
      fetchClientDetails();
    }
  }, [clientData]);

  // Calculate task stats from localStorage
  const calculateTaskStats = () => {
    let total = 0;
    let completed = 0;
    
    services.forEach(service => {
      const tasks = JSON.parse(localStorage.getItem(`client_${clientData._id}_service_${service.servicename}_tasks`) || '[]');
      total += tasks.length;
      completed += tasks.filter(t => t.completed).length;
    });

    const today = new Date();
    let overdue = 0;
    
    services.forEach(service => {
      const tasks = JSON.parse(localStorage.getItem(`client_${clientData._id}_service_${service.servicename}_tasks`) || '[]');
      overdue += tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < today;
      }).length;
    });

    setTaskStats({
      total,
      completed,
      pending: total - completed,
      overdue
    });
  };

  // Update stats when services change or when tasks are updated
  useEffect(() => {
    if (clientData?._id && services.length > 0) {
      calculateTaskStats();
    }
  }, [clientData, services]);

  const handleTaskUpdate = () => {
    calculateTaskStats();
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="client-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="client-dashboard">
        <div className="empty-state-container">
          <div className="empty-state">
            <FiAlertCircle className="empty-state-icon" />
            <h3 className="empty-state-title">Error Loading Dashboard</h3>
            <p className="empty-state-description">
              {error || 'Unable to load client data'}
            </p>
            <button 
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-dashboard">
      {/* Header */}
      <div className="client-dashboard-header">
        <div className="card__content">
          <div className="dashboard-header-container">
            <div className="dashboard-header-left">
              <div className="welcome-section">
                <FiHome className="welcome-icon" />
                <div>
                  <h1 className="welcome-title">Welcome back, {clientData.name}!</h1>
                  <p className="welcome-subtitle">
                    {clientData.companyName || clientData.company} • 
                    Last login: {clientData.lastLogin ? new Date(clientData.lastLogin).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="dashboard-header-actions">
              <button className="btn btn--outlined" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--primary">
          <div className="card__content">
            <div className="stat-card-content">
              <div className="avatar avatar--primary">
                <FiBriefcase />
              </div>
              <div>
                <small className="text-muted">Services</small>
                <p className="stat-card-value">{services.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="card__content">
            <div className="stat-card-content">
              <div className="avatar avatar--success">
                <FiCheckCircle />
              </div>
              <div>
                <small className="text-muted">Completed Tasks</small>
                <p className="stat-card-value">{taskStats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="card__content">
            <div className="stat-card-content">
              <div className="avatar avatar--warning">
                <FiClock />
              </div>
              <div>
                <small className="text-muted">Pending Tasks</small>
                <p className="stat-card-value">{taskStats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--error">
          <div className="card__content">
            <div className="stat-card-content">
              <div className="avatar avatar--error">
                <FiAlertCircle />
              </div>
              <div>
                <small className="text-muted">Overdue Tasks</small>
                <p className="stat-card-value">{taskStats.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card">
        <div className="card__header">
          <div className="card-header-container">
            <div className="card-header-left">
              <div className="avatar-circle">
                <FiUser />
              </div>
              <div>
                <h2 className="card-header-title">My Profile</h2>
                <p className="card-header-subtitle">
                  Your account information and tasks
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card__content">
          {/* Profile Information */}
          <div className="profile-section">
            <div className="profile-grid">
              <div className="profile-item">
                <label className="profile-label">Name</label>
                <p className="profile-value">{clientData.name}</p>
              </div>
              <div className="profile-item">
                <label className="profile-label">Email</label>
                <p className="profile-value">{clientData.email}</p>
              </div>
              <div className="profile-item">
                <label className="profile-label">Phone</label>
                <p className="profile-value">{clientData.phone || 'Not provided'}</p>
              </div>
              <div className="profile-item">
                <label className="profile-label">Employee ID</label>
                <p className="profile-value">{clientData.employeeId || clientData._id}</p>
              </div>
              <div className="profile-item">
                <label className="profile-label">Company</label>
                <p className="profile-value">{clientData.companyName || clientData.company}</p>
              </div>
              <div className="profile-item">
                <label className="profile-label">Company Code</label>
                <p className="profile-value">{clientData.companyCode}</p>
              </div>
            </div>
          </div>

          {/* Services and Tasks */}
          {services.length > 0 ? (
            <div className="services-section">
              <h3 className="section-title">My Services & Tasks</h3>
              <div className="services-list">
                {services.map((service, index) => (
                  <ServiceProgressCard
                    key={index}
                    service={service.servicename}
                    clientId={clientData._id}
                    clientProjectManagers={projectManagers}
                    onTaskUpdate={handleTaskUpdate}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state-container">
              <div className="empty-state">
                <FiBriefcase className="empty-state-icon" />
                <h3 className="empty-state-title">No Services Found</h3>
                <p className="empty-state-description">
                  No services are currently assigned to your account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;