import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../../config';
import './client-management.css';

// Import icons from react-icons
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiUsers,
  FiTrendingUp,
  FiInfo,
  FiPlus,
  FiRefreshCw,
  FiEdit,
  FiEye,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiX,
  FiSave,
  FiCalendar,
  FiUser,
  FiBriefcase,
  FiMapPin,
  FiActivity,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';

// Import from react-icons/fa for additional icons if needed
import { FaTasks, FaProjectDiagram, FaCity } from 'react-icons/fa';

const TaskDetailsModal = ({ task, open, onClose, projectManagers = [] }) => {
  console.log('🔍 TaskDetailsModal rendered:', { taskId: task?.id, open });
  
  if (!open) return null;

  const getAssigneeDetails = (assigneeName) => {
    console.log('🔍 Getting assignee details for:', assigneeName);
    return projectManagers.find(pm => pm.name === assigneeName);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'badge--error';
      case 'Medium': return 'badge--warning';
      case 'Low': return 'badge--info';
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

  const assigneeDetails = getAssigneeDetails(task.assignee);

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
              <div className={`badge ${task.completed ? 'badge--success' : ''}`}>
                {task.completed ? 'Completed' : 'Pending'}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className={`badge ${getPriorityColor(task.priority)}`}>
                {task.priority}
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
              <div className="flex-align-center gap-1 mt-1">
                {assigneeDetails ? (
                  <>
                    <div className="avatar avatar--primary">
                      {assigneeDetails.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-bold">{assigneeDetails.name}</p>
                      {assigneeDetails.email && (
                        <small className="text-muted">{assigneeDetails.email}</small>
                      )}
                    </div>
                  </>
                ) : (
                  <p>{task.assignee}</p>
                )}
              </div>
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

const ServiceProgressCard = ({ service, clientId, clientProjectManagers = [], onTaskUpdate, api }) => {
  console.log('🔍 ServiceProgressCard mounted:', { service, clientId, clientProjectManagersCount: clientProjectManagers.length });
  
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

  const fetchTasks = async () => {
    console.log(`🔍 Fetching tasks for client ${clientId}, service ${service}`);
    try {
      setLoading(true);
      const response = await api.get(`/client/${clientId}/service/${service}`);
      console.log('✅ Tasks fetched successfully:', response.data);
      if (response.data.success) {
        setTasks(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
      if (savedTasks) {
        try {
          console.log('📦 Loading tasks from localStorage');
          const parsedTasks = JSON.parse(savedTasks);
          setTasks(parsedTasks.map(task => ({
            ...task,
            dueDate: task.dueDate || null,
            assignee: task.assignee || '',
            priority: task.priority || 'Medium'
          })));
        } catch (e) {
          console.error('❌ Error parsing localStorage tasks:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 ServiceProgressCard useEffect triggered');
    fetchTasks();
  }, [clientId, service]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = async () => {
    console.log('🔍 Adding new task:', newTask);
    if (newTask.name.trim()) {
      try {
        const response = await api.post(`/client/${clientId}/service/${service}`, {
          name: newTask.name.trim(),
          dueDate: newTask.dueDate || null,
          assignee: newTask.assignee,
          priority: newTask.priority
        });

        console.log('✅ Task added successfully:', response.data);
        if (response.data.success) {
          setTasks([...tasks, response.data.data]);
          setNewTask({ name: '', dueDate: '', assignee: '', priority: 'Medium' });
          setShowAddTask(false);
          if (onTaskUpdate) {
            onTaskUpdate(service, [...tasks, response.data.data]);
          }
        }
      } catch (error) {
        console.error('❌ Error adding task:', error);
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
        setTasks(updatedTasks);
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
        setNewTask({ name: '', dueDate: '', assignee: '', priority: 'Medium' });
        setShowAddTask(false);
        if (onTaskUpdate) {
          onTaskUpdate(service, updatedTasks);
        }
      }
    }
  };

  const handleEditTask = async () => {
    console.log('🔍 Editing task:', editTask);
    if (editTask && editTask.name.trim()) {
      try {
        if (editTask._id) {
          const response = await api.put(`/${editTask._id}`, {
            name: editTask.name.trim(),
            dueDate: editTask.dueDate || null,
            assignee: editTask.assignee,
            priority: editTask.priority
          });

          console.log('✅ Task updated successfully:', response.data);
          if (response.data.success) {
            const updatedTasks = tasks.map(task => 
              task._id === editTask._id ? response.data.data : task
            );
            setTasks(updatedTasks);
            setEditTask(null);
            if (onTaskUpdate) {
              onTaskUpdate(service, updatedTasks);
            }
          }
        } else {
          const updatedTasks = tasks.map(task => 
            task.id === editTask.id ? {
              ...editTask,
              name: editTask.name.trim()
            } : task
          );
          setTasks(updatedTasks);
          localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
          setEditTask(null);
          if (onTaskUpdate) {
            onTaskUpdate(service, updatedTasks);
          }
        }
      } catch (error) {
        console.error('❌ Error updating task:', error);
      }
    }
  };

  const toggleTaskCompletion = async (task) => {
    console.log('🔍 Toggling task completion:', task);
    try {
      const updatedTasks = tasks.map(t => {
        if (t._id === task._id || t.id === task.id) {
          return {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : null
          };
        }
        return t;
      });
      setTasks(updatedTasks);

      if (task._id) {
        await api.patch(`/${task._id}/toggle`);
        console.log('✅ Task toggle API call successful');
      } else {
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
        console.log('📦 Task toggle saved to localStorage');
      }
      
      if (onTaskUpdate) {
        onTaskUpdate(service, updatedTasks);
      }
    } catch (error) {
      console.error('❌ Error toggling task:', error);
      fetchTasks();
    }
  };

  const deleteTask = async (task) => {
    console.log('🔍 Deleting task:', task);
    try {
      const updatedTasks = tasks.filter(t => t._id !== task._id && t.id !== task.id);
      setTasks(updatedTasks);

      if (task._id) {
        await api.delete(`/${task._id}`);
        console.log('✅ Task deleted successfully from API');
      } else {
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
        console.log('📦 Task deleted from localStorage');
      }
      
      if (onTaskUpdate) {
        onTaskUpdate(service, updatedTasks);
      }
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      fetchTasks();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !editTask) {
      handleAddTask();
    } else if (e.key === 'Enter' && editTask) {
      handleEditTask();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'badge--error';
      case 'Medium': return 'badge--warning';
      case 'Low': return 'badge--info';
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

  if (loading) {
    return (
      <div className="card">
        <div className="card__content">
          <div className="flex-align-center justify-center py-3">
            <div className="spinner"></div>
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
              progressPercentage >= 40 ? 'badge--warning' : ''
            }`}>
              {Math.round(progressPercentage)}%
            </div>
            <button 
              className="action-button action-button--primary"
              onClick={() => {
                console.log('🔍 Add task button clicked');
                setShowAddTask(!showAddTask);
              }}
              title="Add Task"
            >
              <FiPlus />
            </button>
            <button 
              className="action-button"
              onClick={() => {
                console.log('🔍 Refresh tasks button clicked');
                fetchTasks();
              }}
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
              progressPercentage >= 40 ? 'progress-bar__fill--warning' : 'progress-bar__fill--info'
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
                onKeyPress={handleKeyPress}
                autoFocus
              />
              
              <div className="grid-2 gap-2">
                <div>
                  <input
                    type="date"
                    className="form-input"
                    value={editTask ? (editTask.dueDate ? new Date(editTask.dueDate).toISOString().split('T')[0] : '') : newTask.dueDate}
                    onChange={(e) => {
                      if (editTask) {
                        setEditTask({ ...editTask, dueDate: e.target.value });
                      } else {
                        setNewTask({ ...newTask, dueDate: e.target.value });
                      }
                    }}
                  />
                </div>
                
                <div>
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
                    {Array.isArray(clientProjectManagers) && clientProjectManagers.map((pm) => (
                      <option key={pm.id || pm._id || pm.name} value={pm.name}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
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
              </div>
              
              <div className="flex justify-end gap-1">
                <button 
                  className="btn btn--outlined"
                  onClick={() => {
                    console.log('🔍 Cancel button clicked');
                    if (editTask) {
                      setEditTask(null);
                    } else {
                      setShowAddTask(false);
                      setNewTask({
                        name: '',
                        dueDate: '',
                        assignee: '',
                        priority: 'Medium'
                      });
                    }
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn--primary"
                  onClick={editTask ? handleEditTask : handleAddTask}
                  disabled={editTask ? !editTask.name.trim() : !newTask.name.trim()}
                >
                  {editTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h5 className="mb-2">Tasks ({totalTasks}):</h5>
          {tasks.length > 0 ? (
            <div className="task-list">
              {tasks.map((task) => (
                <div key={task._id || task.id} className="task-item">
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
                      onClick={() => {
                        console.log('🔍 View task details clicked:', task);
                        setShowTaskDetails({ open: true, task });
                      }}
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button 
                      className="action-button action-button--primary"
                      onClick={() => {
                        console.log('🔍 Edit task clicked:', task);
                        setEditTask(task);
                      }}
                      title="Edit Task"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      className="action-button action-button--error"
                      onClick={() => {
                        console.log('🔍 Delete task clicked:', task);
                        deleteTask(task);
                      }}
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
              <p className="text-muted">
                No tasks added yet. Click the + icon to add tasks.
              </p>
            </div>
          )}
        </div>
      </div>

      {showTaskDetails.open && (
        <TaskDetailsModal
          task={showTaskDetails.task}
          open={showTaskDetails.open}
          onClose={() => {
            console.log('🔍 Closing task details modal');
            setShowTaskDetails({ open: false, task: null });
          }}
          projectManagers={clientProjectManagers}
        />
      )}
    </div>
  );
};

const ServicesModal = ({ open, onClose, services, onAddService, onDeleteService, companyCode }) => {
  console.log('🔍 ServicesModal rendered:', { open, servicesCount: services.length, companyCode });
  
  const [newService, setNewService] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 Adding new service:', newService);
    
    if (newService.trim()) {
      onAddService(newService.trim());
      setNewService('');
    }
  };

  const filteredServices = companyCode 
    ? services.filter(service => service.companyCode === companyCode)
    : services;

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Manage Services</h3>
          <button className="action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal__content">
          {!companyCode && (
            <div className="alert alert--warning mb-3">
              <FiAlertCircle /> Company code not found. Services may not save properly.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mb-3">
            <div className="grid-2 gap-2">
              <div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="New Service Name"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  required
                />
                {companyCode && (
                  <small className="text-muted mt-1 block">
                    This service will be added for company: {companyCode}
                  </small>
                )}
              </div>
              <div>
                <button 
                  type="submit" 
                  className="btn btn--primary w-100"
                  disabled={!companyCode}
                >
                  <FiPlus /> {companyCode ? 'Add Service' : 'Company Code Required'}
                </button>
              </div>
            </div>
          </form>

          <hr className="my-2" />

          <h4 className="mb-2">All Services ({filteredServices.length})</h4>
          
          {filteredServices.length > 0 ? (
            <div className="service-list">
              {filteredServices.map((service) => (
                <div key={service._id} className="service-item">
                  <div className="service-item__icon">
                    <FiBriefcase />
                  </div>
                  <div className="service-item__content">
                    <p className="font-bold">{service.servicename}</p>
                    <small className="text-muted">
                      Created: {new Date(service.createdAt).toLocaleDateString()}
                      {service.companyCode && (
                        <> • Company: {service.companyCode}</>
                      )}
                    </small>
                  </div>
                  <div className="service-item__actions">
                    <button
                      className="action-button action-button--error"
                      onClick={() => {
                        console.log('🔍 Delete service clicked:', service);
                        onDeleteService(service._id, service.servicename);
                      }}
                      title="Delete Service"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <FiBriefcase className="text-4xl text-muted mb-2" />
              <h5 className="text-muted">No Services Found</h5>
              <p className="text-muted">
                {companyCode 
                  ? 'Add your first service using the form above'
                  : 'Company code not found. Please refresh the page.'
                }
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

const AddClientModal = ({ 
  open, 
  onClose, 
  onAddClient, 
  services, 
  projectManagers,
  loading = false,
  companyCode 
}) => {
  console.log('🔍 AddClientModal rendered:', { open, servicesCount: services.length, projectManagersCount: projectManagers.length, companyCode, loading });
  
  const [newClient, setNewClient] = useState({
    client: '',
    company: '',
    city: '',
    projectManagers: [],
    services: [],
    status: 'Active',
    progress: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    notes: ''
  });

  const [managerSearch, setManagerSearch] = useState('');
  const [teamOpen, setTeamOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const filteredServices = companyCode 
    ? services.filter(service => service.companyCode === companyCode)
    : services;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setTeamOpen(false);
        setServicesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 AddClientModal handleSubmit called with data:', newClient);
    
    if (
      newClient.client &&
      newClient.company &&
      newClient.city &&
      newClient.projectManagers.length > 0
    ) {
      try {
        const selectedManagerIds = newClient.projectManagers;

        const selectedManagers = projectManagers.filter(pm =>
          selectedManagerIds.includes(pm._id)
        );
        console.log('🔍 Selected managers:', selectedManagers);

        const formattedProjectManagers = selectedManagers.map(pm => ({
          _id: pm._id,
          name: pm.name,
          email: pm.email,
          role: pm.role
        }));

        const clientData = {
          ...newClient,
          projectManagers: formattedProjectManagers,
          projectManager: selectedManagers.map(pm => pm.name),
          companyCode: companyCode
        };

        console.log('🔍 Final client data to send:', clientData);
        await onAddClient(clientData);

        setNewClient({
          client: '',
          company: '',
          city: '',
          projectManagers: [],
          services: [],
          status: 'Active',
          progress: '',
          email: '',
          phone: '',
          address: '',
          description: '',
          notes: ''
        });

        console.log('✅ Client added successfully, reloading page');
        window.location.reload();

      } catch (error) {
        console.error("❌ Error adding client:", error);
      }
    } else {
      console.warn('⚠️ Form validation failed:', {
        client: !!newClient.client,
        company: !!newClient.company,
        city: !!newClient.city,
        projectManagers: newClient.projectManagers.length > 0
      });
    }
  };

  const filteredManagers = Array.isArray(projectManagers) 
    ? projectManagers.filter(manager =>
        manager.name?.toLowerCase().includes(managerSearch.toLowerCase()) ||
        manager.email?.toLowerCase().includes(managerSearch.toLowerCase())
      )
    : [];

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Add New Client</h3>
          {companyCode && (
            <small className="text-muted">Company: {companyCode}</small>
          )}
          <button className="action-button" onClick={onClose} disabled={loading}>
            <FiX />
          </button>
        </div>
        <div className="modal__content">
          {!companyCode && (
            <div className="alert alert--warning mb-3">
              <FiAlertCircle /> Company code not found. Client may not save properly.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="dropdown-container">
            <div className="grid-2 gap-2">
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newClient.client}
                  onChange={(e) => {
                    console.log('🔍 Client name changed:', e.target.value);
                    setNewClient({...newClient, client: e.target.value});
                  }}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newClient.company}
                  onChange={(e) => {
                    console.log('🔍 Company changed:', e.target.value);
                    setNewClient({...newClient, company: e.target.value});
                  }}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newClient.city}
                  onChange={(e) => {
                    console.log('🔍 City changed:', e.target.value);
                    setNewClient({...newClient, city: e.target.value});
                  }}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  className="form-input"
                  value={newClient.status}
                  onChange={(e) => {
                    console.log('🔍 Status changed:', e.target.value);
                    setNewClient({...newClient, status: e.target.value});
                  }}
                  disabled={loading}
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Team *</label>
                <div className="dropdown-wrapper">
                  <div
                    className="form-input cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      console.log('🔍 Team dropdown toggled');
                      setTeamOpen(!teamOpen);
                    }}
                  >
                    <span>
                      {newClient.projectManagers.length === 0
                        ? "Select team members"
                        : `${newClient.projectManagers.length} selected`}
                    </span>
                    <span className={`dropdown-arrow ${teamOpen ? 'dropdown-arrow--open' : ''}`}>
                      <FiChevronDown />
                    </span>
                  </div>

                  {teamOpen && (
                    <div className="dropdown-content">
                      <div className="dropdown-search">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search users..."
                          value={managerSearch}
                          onChange={(e) => {
                            console.log('🔍 Manager search changed:', e.target.value);
                            setManagerSearch(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      <div className="dropdown-list">
                        {filteredManagers.length > 0 ? (
                          filteredManagers.map((manager) => (
                            <label
                              key={manager._id}
                              className="dropdown-item"
                              onClick={(e) => e.stopPropagation()}
                              style={{ border: '1px solid #e0e0e0', marginBottom: '4px' }}
                            >
                              <input
                                type="checkbox"
                                checked={newClient.projectManagers.includes(manager._id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  console.log(`🔍 Manager ${manager.name} ${checked ? 'selected' : 'deselected'}`);
                                  setNewClient(prev => ({
                                    ...prev,
                                    projectManagers: checked
                                      ? [...prev.projectManagers, manager._id]
                                      : prev.projectManagers.filter(id => id !== manager._id)
                                  }));
                                }}
                                disabled={loading}
                              />
                              <div className="dropdown-item-content">
                                <div className="avatar avatar--primary">
                                  {manager.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <span className="font-medium">{manager.name || 'No Name'}</span>
                                  <div className="dropdown-item-details">
                                    <span>{manager.role || 'User'}</span>
                                    <span>•</span>
                                    <span>{manager.email || 'No email'}</span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="dropdown-empty">
                            <p>No users found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {newClient.projectManagers.length > 0 && (
                  <div className="selected-items-preview">
                    {newClient.projectManagers.map(managerId => {
                      const manager = projectManagers.find(pm => pm._id === managerId);
                      if (!manager) return null;
                      return (
                        <div key={managerId} className="selected-item">
                          <span>{manager.name}</span>
                          <button
                            type="button"
                            className="selected-item-remove"
                            onClick={() => {
                              console.log(`🔍 Removing manager: ${manager.name}`);
                              setNewClient(prev => ({
                                ...prev,
                                projectManagers: prev.projectManagers.filter(id => id !== managerId)
                              }));
                            }}
                          >
                            <FiX />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Services</label>
                {filteredServices.length === 0 && (
                  <div className="alert alert--info mb-2">
                    <FiInfo /> No services available for this company. Please add services first.
                  </div>
                )}
                <div className="dropdown-wrapper">
                  <div 
                    className="form-input cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      console.log('🔍 Services dropdown toggled');
                      setServicesOpen(!servicesOpen);
                    }}
                  >
                    <span>
                      {newClient.services.length === 0
                        ? "Select services"
                        : `${newClient.services.length} selected`}
                    </span>
                    <span className={`dropdown-arrow ${servicesOpen ? 'dropdown-arrow--open' : ''}`}>
                      <FiChevronDown />
                    </span>
                  </div>

                  {servicesOpen && (
                    <div className="dropdown-content">
                      <div className="dropdown-list">
                        {filteredServices.length > 0 ? (
                          filteredServices.map((service) => (
                            <label
                              key={service._id}
                              className="dropdown-item"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                id={`service-${service._id}`}
                                checked={newClient.services.includes(service.servicename)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  console.log(`🔍 Service ${service.servicename} ${isChecked ? 'selected' : 'deselected'}`);
                                  setNewClient(prev => ({
                                    ...prev,
                                    services: isChecked
                                      ? [...prev.services, service.servicename]
                                      : prev.services.filter(s => s !== service.servicename)
                                  }));
                                }}
                                disabled={loading || filteredServices.length === 0}
                              />
                              <label htmlFor={`service-${service._id}`} className="dropdown-item-content">
                                <div className="font-medium">{service.servicename}</div>
                                <small className="text-muted">
                                  Created: {new Date(service.createdAt).toLocaleDateString()}
                                </small>
                              </label>
                            </label>
                          ))
                        ) : (
                          <div className="dropdown-empty">
                            No services available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {newClient.services.length > 0 && (
                  <div className="selected-items-preview">
                    {newClient.services.map((serviceName, index) => (
                      <div key={index} className="selected-item selected-item--info">
                        <span>{serviceName}</span>
                        <button
                          type="button"
                          className="selected-item-remove"
                          onClick={() => {
                            console.log(`🔍 Removing service: ${serviceName}`);
                            setNewClient(prev => ({
                              ...prev,
                              services: prev.services.filter(s => s !== serviceName)
                            }));
                          }}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={newClient.description}
                  onChange={(e) => {
                    console.log('🔍 Description changed');
                    setNewClient({...newClient, description: e.target.value});
                  }}
                  placeholder="Enter client description..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newClient.email}
                  onChange={(e) => {
                    console.log('🔍 Email changed:', e.target.value);
                    setNewClient({...newClient, email: e.target.value});
                  }}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={newClient.phone}
                  onChange={(e) => {
                    console.log('🔍 Phone changed:', e.target.value);
                    setNewClient({...newClient, phone: e.target.value});
                  }}
                  disabled={loading}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={newClient.address}
                  onChange={(e) => {
                    console.log('🔍 Address changed:', e.target.value);
                    setNewClient({...newClient, address: e.target.value});
                  }}
                  disabled={loading}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={newClient.notes}
                  onChange={(e) => {
                    console.log('🔍 Notes changed');
                    setNewClient({...newClient, notes: e.target.value});
                  }}
                  placeholder="Additional notes..."
                  disabled={loading}
                />
              </div>
            </div>
          </form>
        </div>
        <div className="modal__footer">
          <button className="btn btn--outlined" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={
              loading || 
              !newClient.client || 
              !newClient.company || 
              !newClient.city || 
              newClient.projectManagers.length === 0 ||
              filteredServices.length === 0 ||
              !companyCode
            }
          >
            {loading ? 'Adding Client...' : 
             !companyCode ? 'Company Code Missing' :
             filteredServices.length === 0 ? 'Add Services First' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientManagement = () => {
  console.log('🔍 ClientManagement component mounted');
  
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: '', name: '' });
  const [editDialog, setEditDialog] = useState({ open: false, client: null });
  const [viewDialog, setViewDialog] = useState({ open: false, client: null });
  const [servicesModal, setServicesModal] = useState(false);
  const [addClientModal, setAddClientModal] = useState(false);
  const [taskCounts, setTaskCounts] = useState({});
  
  const [companyCode, setCompanyCode] = useState('');
  const [companyIdentifier, setCompanyIdentifier] = useState('');
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
    status: '',
    projectManager: '',
    service: ''
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [tasksStats, setTasksStats] = useState({
    pendingTasks: 0,
    overdueTasks: 0
  });

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

  // Debug function to check API configuration
  useEffect(() => {
    const debugAPI = () => {
      console.log('========== API DEBUG INFO ==========');
      console.log('API_URL from config:', API_URL);
      console.log('Users API Base URL:', `${API_URL}/users`);
      console.log('Full endpoint:', `${API_URL}/users/company-users`);
      console.log('LocalStorage items:');
      console.log('- token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      console.log('- authToken:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
      console.log('- company:', localStorage.getItem('company'));
      console.log('- companyCode:', localStorage.getItem('companyCode'));
      console.log('- companyIdentifier:', localStorage.getItem('companyIdentifier'));
      console.log('=====================================');
    };
    
    debugAPI();
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = () => {
      try {
        console.log('🔍 Fetching company info from localStorage');
        const localStorageCompany = localStorage.getItem('company') || '';
        const localStorageCompanyDetails = localStorage.getItem('companyDetails') || '';
        
        const companyCodeFromStorage = localStorage.getItem('companyCode') || localStorageCompany;
        const companyIdentifierFromStorage = localStorage.getItem('companyIdentifier') || localStorageCompanyDetails;
        
        console.log('🔍 Company info retrieved:', { 
          companyCode: companyCodeFromStorage, 
          companyIdentifier: companyIdentifierFromStorage 
        });
        
        setCompanyCode(companyCodeFromStorage);
        setCompanyIdentifier(companyIdentifierFromStorage);
        
        if (!companyCodeFromStorage && !companyIdentifierFromStorage) {
          console.warn('⚠️ No company info found in localStorage');
          setError('Company information not found. Please login again.');
        } else {
          setError('');
        }
      } catch (error) {
        console.error('❌ Error fetching company info:', error);
        setError('Error loading company information');
      }
    };

    fetchCompanyInfo();
  }, []);

  // Improved fetchProjectManagers function with better error handling and response parsing
  const fetchProjectManagers = async () => {
    try {
      console.log('========== FETCHING PROJECT MANAGERS ==========');
      console.log('API Base URL:', usersApi.defaults.baseURL);
      console.log('Full endpoint:', `${usersApi.defaults.baseURL}/company-users`);
      
      // Check token
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('Auth token present:', !!token);
      if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
      }
      
      // Make the request with explicit headers
      const response = await usersApi.get('/company-users', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('✅ Response received:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- Headers:', response.headers);
      console.log('- Data:', response.data);
      
      let usersArray = [];
      
      // Comprehensive response parsing
      if (response.data) {
        // Case 1: Direct array
        if (Array.isArray(response.data)) {
          console.log('Case 1: Response is direct array');
          usersArray = response.data;
        }
        // Case 2: { data: [...] }
        else if (response.data.data && Array.isArray(response.data.data)) {
          console.log('Case 2: Response has data array');
          usersArray = response.data.data;
        }
        // Case 3: { users: [...] }
        else if (response.data.users && Array.isArray(response.data.users)) {
          console.log('Case 3: Response has users array');
          usersArray = response.data.users;
        }
        // Case 4: { success: true, data: [...] }
        else if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
          console.log('Case 4: Response has success and data');
          usersArray = response.data.data;
        }
        // Case 5: { success: true, message: { users: [...] } }
        else if (response.data.success && response.data.message) {
          console.log('Case 5: Response has success and message');
          if (Array.isArray(response.data.message.users)) {
            usersArray = response.data.message.users;
          } else if (Array.isArray(response.data.message)) {
            usersArray = response.data.message;
          } else if (response.data.message.data && Array.isArray(response.data.message.data)) {
            usersArray = response.data.message.data;
          }
        }
        // Case 6: { results: [...] }
        else if (response.data.results && Array.isArray(response.data.results)) {
          console.log('Case 6: Response has results array');
          usersArray = response.data.results;
        }
        // Case 7: { items: [...] }
        else if (response.data.items && Array.isArray(response.data.items)) {
          console.log('Case 7: Response has items array');
          usersArray = response.data.items;
        }
        // Case 8: Try to find any array property
        else {
          console.log('Case 8: Searching for array in response');
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              console.log(`Found array in property: ${key}`);
              usersArray = response.data[key];
              break;
            }
          }
        }
      }
      
      console.log('Extracted users array length:', usersArray.length);
      
      // If still no users, try to create from object
      if (usersArray.length === 0 && response.data && typeof response.data === 'object') {
        console.log('Attempting to create array from object values');
        const possibleUsers = Object.values(response.data).filter(val => 
          val && typeof val === 'object' && (val.name || val.email || val._id)
        );
        if (possibleUsers.length > 0) {
          usersArray = possibleUsers;
          console.log('Created users array from object values:', usersArray.length);
        }
      }
      
      // Add current user if present in the response
      if (response.data?.message?.currentUser) {
        const currentUser = response.data.message.currentUser;
        const userExists = usersArray.some(u => u.id === currentUser.id || u._id === currentUser.id);
        
        if (!userExists) {
          usersArray.push(currentUser);
          console.log('Added current user to array');
        }
      }
      
      if (usersArray.length > 0) {
        const formattedManagers = usersArray.map(user => {
          // Log each user for debugging
          console.log('Processing user:', user);
          
          return {
            _id: user._id || user.id || `temp-${Date.now()}-${Math.random()}`,
            name: user.name || user.username || user.fullName || user.displayName || 'Unknown User',
            email: user.email || '',
            role: user.role || user.jobRole || user.designation || user.position || user.title || 'Team Member',
            phone: user.phone || user.mobile || user.phoneNumber || '',
            department: user.department || user.departmentName || user.departmentId || '',
            isActive: user.isActive !== undefined ? user.isActive : true
          };
        });
        
        console.log('✅ Formatted managers:', formattedManagers);
        setProjectManagers(formattedManagers);
        
        // Show success message
        setSuccess(`Loaded ${formattedManagers.length} team members`);
        
        // Clear success after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.warn('⚠️ No users found in response');
        setProjectManagers([]);
        
        // Show appropriate message
        if (response.data) {
          setError('No team members found. The API returned an empty response.');
        } else {
          setError('Unable to parse team members from API response.');
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching project managers:');
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Handle specific status codes
        switch (error.response.status) {
          case 401:
            setError('Authentication failed. Please log in again.');
            break;
          case 403:
            setError('You do not have permission to view team members.');
            break;
          case 404:
            setError('Team members endpoint not found. Please check API configuration.');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError(`Failed to load team members: ${error.response.status} ${error.response.statusText}`);
        }
        
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request Error - No Response:', {
          request: error.request,
          message: error.message
        });
        setError('Cannot connect to server. Please check your internet connection and API URL.');
        
      } else {
        // Something happened in setting up the request
        console.error('Setup Error:', error.message);
        setError('Failed to load team members. Please try again.');
      }
      
      // Set empty array as fallback
      setProjectManagers([]);
    }
  };

  // Test API endpoint function for debugging
  const testAPIEndpoint = async () => {
    try {
      console.log('Testing API connection...');
      console.log('Users API Base URL:', usersApi.defaults.baseURL);
      
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('Auth Token Present:', !!token);
      
      const response = await usersApi.get('/company-users');
      console.log('API Test Success - Status:', response.status);
      console.log('API Test Data:', response.data);
      
    } catch (error) {
      console.error('API Test Failed:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received');
      } else {
        console.error('Error:', error.message);
      }
    }
  };

  // Set up interceptors with logging
  useEffect(() => {
    // Request interceptor for usersApi
    const usersRequestInterceptor = usersApi.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log the request (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('Users API Request:', {
            url: config.url,
            method: config.method,
            baseURL: config.baseURL,
            headers: config.headers
          });
        }
        
        return config;
      },
      (error) => {
        console.error('Users API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for usersApi
    const usersResponseInterceptor = usersApi.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - maybe redirect to login
          console.error('Unauthorized access to users API');
        }
        return Promise.reject(error);
      }
    );

    // Similar interceptors for other APIs
    const apiInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const tasksInterceptor = tasksApi.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Cleanup interceptors
    return () => {
      usersApi.interceptors.request.eject(usersRequestInterceptor);
      usersApi.interceptors.response.eject(usersResponseInterceptor);
      api.interceptors.request.eject(apiInterceptor);
      tasksApi.interceptors.request.eject(tasksInterceptor);
    };
  }, []);

  const handleFilterChange = (key, value) => {
    console.log(`🔍 Filter changed: ${key} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {})
    }));
  };

  const getFullManagerObjects = (managerData) => {
    if (!managerData) return [];

    if (Array.isArray(managerData) && managerData.length > 0) {
      if (typeof managerData[0] === 'object') {
        return managerData;
      }
      if (typeof managerData[0] === 'string') {
        return managerData.map(name => {
          const manager = projectManagers.find(pm => pm.name === name);
          return manager || { name, id: `temp-${Date.now()}` };
        });
      }
    }

    return [];
  };

  const fetchData = async () => {
    console.log('🔍 Fetching data with filters:', filters);
    try {
      setLoading(true);
      
      // Test API endpoint first (only in development)
      if (process.env.NODE_ENV === 'development') {
        await testAPIEndpoint();
      }
      
      // Fetch project managers
      await fetchProjectManagers();
      
      const apiParams = {
        ...filters,
        companyCode: companyCode || undefined,
        companyIdentifier: companyIdentifier || undefined
      };
      console.log('🔍 API params:', apiParams);
      
      const [clientsRes, servicesRes] = await Promise.all([
        api.get('/', { params: apiParams }),
        api.get('/services', { 
          params: { 
            companyCode: companyCode || undefined,
            companyIdentifier: companyIdentifier || undefined
          } 
        })
      ]);
      
      console.log('✅ Clients response:', clientsRes.data);
      console.log('✅ Services response:', servicesRes.data);
      
      if (servicesRes.data?.success) {
        const allServices = servicesRes.data.data || [];
        setServices(allServices);
      } else {
        setServices([]);
      }
      
      if (clientsRes.data?.success) {
        const allClients = clientsRes.data.data || [];
        
        const enhancedClients = allClients.map(client => {
          const managerData = client.projectManagers || client.projectManager || [];
          const fullManagerObjects = getFullManagerObjects(managerData);
          
          return {
            ...client,
            projectManagers: fullManagerObjects,
            projectManager: fullManagerObjects.map(pm => pm.name)
          };
        });
        
        setClients(enhancedClients);
        
        if (clientsRes.data.pagination) {
          setPagination(clientsRes.data.pagination);
        } else {
          setPagination({
            currentPage: filters.page,
            totalPages: Math.ceil(enhancedClients.length / filters.limit),
            totalItems: enhancedClients.length,
            itemsPerPage: filters.limit
          });
        }
      } else {
        setClients([]);
      }
      
      setError('');
    } catch (err) {
      console.error('❌ Fetch error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Data fetch failed';
      setError(errorMessage);
      
      setClients([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered with companyCode/Identifier:', { companyCode, companyIdentifier });
    if (companyCode || companyIdentifier) {
      fetchData();
    }
  }, [filters, companyCode, companyIdentifier]);

  const getFilteredClients = () => {
    if (!companyCode && !companyIdentifier) {
      return clients;
    }
    
    return clients.filter(client => {
      const hasMatchingCompanyCode = client.companyCode === companyCode;
      const hasMatchingCompanyIdentifier = client.companyIdentifier === companyIdentifier;
      
      return hasMatchingCompanyCode || hasMatchingCompanyIdentifier;
    });
  };

  const fetchClientTasks = async (clientId) => {
    console.log(`🔍 Fetching tasks for client: ${clientId}`);
    try {
      const response = await tasksApi.get(`/client/${clientId}`);
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data.data?.tasks) {
          return response.data.data.tasks;
        }
        return [];
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching client tasks for ${clientId}:`, error);
      return [];
    }
  };

  const calculateTasksForAll = async () => {
    console.log('🔍 Calculating tasks for all clients');
    const counts = {};
    let totalPending = 0;
    
    for (const client of clients) {
      try {
        const tasks = await fetchClientTasks(client._id);
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        counts[client._id] = { total, completed, pending };
        totalPending += pending;
      } catch (error) {
        console.error(`❌ Error calculating tasks for client ${client._id}:`, error);
        counts[client._id] = { total: 0, completed: 0, pending: 0 };
      }
    }
    
    setTaskCounts(counts);
    setTasksStats(prev => ({
      ...prev,
      pendingTasks: totalPending
    }));
    console.log('✅ Task counts calculated:', counts);
  };

  const calculateOverdueTasks = async () => {
    console.log('🔍 Calculating overdue tasks');
    let totalOverdue = 0;
    for (const client of clients) {
      const tasksData = await fetchClientTasks(client._id);
      const today = new Date();
      const overdue = tasksData.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate < today;
      }).length;
      totalOverdue += overdue;
    }
    console.log('✅ Overdue tasks calculated:', totalOverdue);
    return totalOverdue;
  };

  useEffect(() => {
    if (clients.length > 0) {
      console.log('🔍 Clients loaded, calculating tasks');
      calculateTasksForAll();
      
      calculateOverdueTasks().then(overdue => {
        setTasksStats(prev => ({
          ...prev,
          overdueTasks: overdue
        }));
      });
    } else {
      setTaskCounts({});
      setTasksStats({
        pendingTasks: 0,
        overdueTasks: 0
      });
    }
  }, [clients]);

  const handleAddService = async (serviceName) => {
    console.log('🔍 Adding service:', serviceName);
    if (!serviceName.trim()) return;

    try {
      const serviceData = { 
        servicename: serviceName.trim(),
        companyCode: companyCode
      };
      
      const response = await api.post('/services', serviceData);
      console.log('✅ Service added response:', response.data);
      
      if (response.data.success) {
        setSuccess('Service added successfully!');
        setError('');
        fetchData();
      } else {
        setError(response.data.message || 'Service add failed');
      }
    } catch (err) {
      console.error('❌ Add service error:', err);
      const errorMsg = err.response?.data?.message || 'Service add failed';
      setError(errorMsg);
    }
  };

  const handleAddClient = async (clientData) => {
    console.log('🔍 Adding client with data:', clientData);
    try {
      setAddLoading(true);
      setError('');
      
      const backendClientData = {
        ...clientData,
        client: clientData.client,
        company: clientData.company,
        city: clientData.city,
        projectManagers: clientData.projectManagers.map(pm => ({
          _id: pm._id,
          name: pm.name,
          email: pm.email,
          role: pm.role
        })),
        projectManager: clientData.projectManagers.map(pm => pm.name),
        services: clientData.services,
        status: clientData.status,
        progress: clientData.progress,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        description: clientData.description,
        notes: clientData.notes,
        companyCode: clientData.companyCode 
      };
      
      console.log('🔍 Sending to backend:', backendClientData);
      const response = await api.post('/', backendClientData);
      console.log('✅ Client added response:', response.data);
      
      if (response.data.success) {
        const fullClientData = {
          ...response.data.data,
          projectManagers: clientData.projectManagers
        };
        
        setSuccess('Client added successfully!');
        setError('');
        setAddClientModal(false);
        fetchData();
      } else {
        setError(response.data.message || 'Client add failed');
      }
    } catch (err) {
      console.error('❌ Add client error:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.errors?.join(', ') || 
                         'Client add failed';
      setError(errorMessage);
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateClient = async (clientId, updateData) => {
    console.log('🔍 Updating client:', clientId, updateData);
    try {
      const response = await api.put(`/${clientId}`, updateData);
      console.log('✅ Client updated response:', response.data);
      
      if (response.data.success) {
        setSuccess('Client updated successfully!');
        setEditDialog({ open: false, client: null });
        fetchData();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Client update failed';
      setError(errorMessage);
      console.error('❌ Update client error:', err);
    }
  };

  const handleDeleteClick = (type, id, name) => {
    console.log(`🔍 Delete clicked: type=${type}, id=${id}, name=${name}`);
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleDeleteConfirm = async () => {
    const { type, id } = deleteDialog;
    console.log(`🔍 Confirm delete: type=${type}, id=${id}`);
    
    try {
      if (type === 'client') {
        try {
          const tasksResponse = await tasksApi.get(`/client/${id}`);
          if (tasksResponse.data.success && tasksResponse.data.data.tasks) {
            for (const task of tasksResponse.data.data.tasks) {
              await tasksApi.delete(`/${task._id}`);
            }
          }
        } catch (taskError) {
          console.warn('⚠️ Error deleting client tasks:', taskError);
        }
        
        const response = await api.delete(`/${id}`);
        if (response.data.success) {
          setSuccess('Client deleted successfully!');
          fetchData();
        }
      } else if (type === 'service') {
        const response = await api.delete(`/services/${id}`);
        if (response.data.success) {
          setSuccess('Service deleted successfully!');
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
      console.error('❌ Delete error:', err);
    }
    
    setDeleteDialog({ open: false, type: '', id: '', name: '' });
  };

  const handleDeleteCancel = () => {
    console.log('🔍 Delete cancelled');
    setDeleteDialog({ open: false, type: '', id: '', name: '' });
  };

  const handleEditClick = (client) => {
    console.log('🔍 Edit clicked for client:', client);
    setEditDialog({ 
      open: true, 
      client: {
        ...client,
        projectManagers: client.projectManagers || []
      }
    });
  };

  const handleEditSave = () => {
    const { client } = editDialog;
    console.log('🔍 Saving edit for client:', client);
    
    const formattedProjectManagers = client.projectManagers.map(pm => ({
      _id: pm._id || pm.id,
      name: pm.name,
      email: pm.email,
      role: pm.role
    }));
    
    const updateData = {
      client: client.client,
      company: client.company,
      city: client.city,
      projectManagers: formattedProjectManagers,
      projectManager: client.projectManagers.map(pm => pm.name),
      services: client.services,
      status: client.status,
      progress: client.progress,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      description: client.description || '',
      notes: client.notes || '',
      companyCode: companyCode
    };
    
    handleUpdateClient(client._id, updateData);
  };

  const handleViewClick = (client) => {
    console.log('🔍 View clicked for client:', client);
    setViewDialog({ open: true, client });
  };

  const getProjectManagersDetails = (client) => {
    if (!client) return [];
    
    if (client.projectManagers && Array.isArray(client.projectManagers) && client.projectManagers.length > 0) {
      return client.projectManagers;
    }
    
    const managerNames = client.projectManager || [];
    return managerNames.map(name => {
      const manager = projectManagers.find(pm => pm.name === name);
      return manager || { name, id: `temp-${Date.now()}` };
    });
  };

  const renderManagerInfo = (manager) => {
    return (
      <div className="manager-info">
        <div className="manager-header">
          <div className="avatar avatar--primary">
            {manager.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-bold">{manager.name}</p>
            <small className="text-muted">
              ID: {manager._id?.slice(-8) || manager.id?.slice(-8) || 'N/A'}
            </small>
          </div>
        </div>
        <div className="manager-details">
          {manager.email && (
            <div>
              <small className="text-muted">Email:</small>
              <small>{manager.email}</small>
            </div>
          )}
          {manager.role && (
            <div>
              <small className="text-muted">Role:</small>
              <small>{manager.role}</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleTaskUpdate = (serviceName, tasks) => {
    console.log(`🔍 Tasks updated for ${serviceName}:`, tasks);
  };

  const safeMapProjectManagers = (callback) => {
    return Array.isArray(projectManagers) 
      ? projectManagers.map(callback)
      : [];
  };

  const filteredClients = getFilteredClients();

  return (
    <div className="client-management">
      <div className="client-management-header">
        <div className="card__content">
          <div className="client-header-container">
            <div className="client-header-left">
              <FiUsers className="client-header-icon" />
              <div>
                <h1 className="client-header-title">Client Management</h1>
                <p className="client-header-subtitle">
                  {companyCode || companyIdentifier 
                    ? `Company: ${companyCode || companyIdentifier}` 
                    : 'Manage clients and services'}
                </p>
              </div>
            </div>
            <div className="client-header-actions">
              <button
                className="btn btn--outlined"
                onClick={() => {
                  console.log('🔍 Services modal button clicked');
                  setServicesModal(true);
                }}
                disabled={!companyCode && !companyIdentifier}
              >
                <FiBriefcase /> Services ({services.length})
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  console.log('🔍 Add client modal button clicked');
                  setAddClientModal(true);
                }}
                disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
              >
                <FiPlus /> Add Client
              </button>
              <button
                className="btn btn--outlined"
                onClick={() => {
                  console.log('🔍 Refresh button clicked');
                  fetchData();
                }}
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Clients', value: filteredClients.length, color: 'primary', icon: <FiUsers /> },
          { label: 'Active Clients', value: filteredClients.filter(c => c.status === 'Active').length, color: 'success', icon: <FiCheckCircle /> },
          { label: 'Pending Tasks', value: tasksStats.pendingTasks, color: 'warning', icon: <FiClock /> },
          { label: 'Overdue Tasks', value: tasksStats.overdueTasks, color: 'error', icon: <FiAlertCircle /> },
          { label: 'Services', value: services.length, color: 'info', icon: <FiBriefcase /> },
        ].map((stat, index) => (
          <div key={index} className={`stat-card stat-card--${stat.color}`}>
            <div className="card__content">
              <div className="stat-card-content">
                <div className={`avatar avatar--${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <small className="text-muted">{stat.label}</small>
                  <p className="stat-card-value">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!companyCode && !companyIdentifier && (
        <div className="alert alert--warning">
          <FiAlertCircle /> Company information not found. Please refresh the page or login again.
        </div>
      )}

      {error && (
        <div className="alert alert--error">
          <FiAlertCircle /> {error}
        </div>
      )}

      {success && (
        <div className="alert alert--success">
          <FiCheckCircle /> {success}
        </div>
      )}

      <div className="card">
        <div className="card__header card-header-gradient">
          <div className="card-header-container">
            <div className="card-header-left">
              <div className="avatar-circle">
                <FiUsers />
              </div>
              <div>
                <h2 className="card-header-title">Client Portfolio</h2>
                <p className="card-header-subtitle">
                  Total {filteredClients.length} clients • {filteredClients.filter(c => c.status === 'Active').length} active
                  {(companyCode || companyIdentifier) && 
                    <span> • Company: {companyCode || companyIdentifier}</span>
                  }
                </p>
              </div>
            </div>
            
            <div className="card-header-right">
              <div className="active-indicator">
                <FiActivity />
                <span>{filteredClients.filter(c => c.status === 'Active').length} Active</span>
              </div>
              
              <button 
                className="refresh-button"
                onClick={() => {
                  console.log('🔍 Header refresh button clicked');
                  fetchData();
                }}
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>
        </div>
        
        <div className="filter-bar">
          <div className="filter-grid">
            <div className="filter-search-container">
              <div className="search-input">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <select
                className="form-input"
                value={filters.projectManager}
                onChange={(e) => handleFilterChange('projectManager', e.target.value)}
              >
                <option value="">All Managers</option>
                {safeMapProjectManagers((manager) => (
                  <option key={manager._id || manager.id} value={manager.name}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                className="form-input"
                value={filters.service}
                onChange={(e) => handleFilterChange('service', e.target.value)}
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service._id} value={service.servicename}>
                    {service.servicename}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <button
                className="btn btn--primary w-100"
                onClick={() => {
                  console.log('🔍 New Client button clicked');
                  setAddClientModal(true);
                }}
                disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
              >
                <FiPlus /> New Client
              </button>
            </div>
          </div>
        </div>
        
        <div className="card__content card-content-padded">
          {!companyCode && !companyIdentifier ? (
            <div className="empty-state-container">
              <div className="empty-state">
                <FiAlertCircle className="empty-state-icon" />
                <h3 className="empty-state-title">Company Information Required</h3>
                <p className="empty-state-description">
                  Company code or identifier not found. Please refresh the page or login again.
                </p>
                <button 
                  className="btn btn--primary"
                  onClick={() => {
                    console.log('🔍 Refresh page button clicked');
                    window.location.reload();
                  }}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading clients...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th className="table-cell-hidden-sm">Company</th>
                      <th className="table-cell-hidden-md">Services</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th className="table-cell-hidden-sm">Tasks</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => {
                      const stats = taskCounts[client._id] || { total: 0, completed: 0, pending: 0 };
                      const pending = stats.pending || 0;
                      const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                      
                      return (
                        <tr key={client._id}>
                          <td>
                            <div className="client-cell">
                              <div>
                                <p className="font-bold">{client.client || 'N/A'}</p>
                                <small className="text-muted client-cell-secondary">
                                  ID: {client.clientId || client._id?.slice(-6)}
                                  {client.companyCode && ` • Code: ${client.companyCode}`}
                                  {client.companyIdentifier && ` • ID: ${client.companyIdentifier}`}
                                </small>
                                <small className="text-muted client-cell-mobile">
                                  {client.company || 'N/A'}
                                </small>
                              </div>
                            </div>
                          </td>
                          
                          <td className="table-cell-hidden-sm">
                            <div>
                              <p className="font-medium">{client.company || 'N/A'}</p>
                              <small className="text-muted">{client.email || 'No email'}</small>
                            </div>
                          </td>
                          
                          <td className="table-cell-hidden-md">
                            <div className="services-tags">
                              {Array.isArray(client.services) && client.services.slice(0, 2).map((service, idx) => (
                                <div key={idx} className="badge badge--info">
                                  {service}
                                </div>
                              ))}
                              {Array.isArray(client.services) && client.services.length > 2 && (
                                <div className="badge">
                                  +{client.services.length - 2}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td>
                            <div className={`status-chip status-chip--${client.status === 'Active' ? 'active' : client.status === 'On Hold' ? 'on-hold' : 'default'}`}>
                              {client.status || 'Unknown'}
                            </div>
                          </td>
                          
                          <td>
                            <div className="progress-cell">
                              <div className="progress-header">
                                <p className="font-medium">{progress}%</p>
                                <small className="text-muted progress-stats">
                                  {stats.completed}/{stats.total}
                                </small>
                              </div>
                              <div className="progress-bar">
                                <div 
                                  className={`progress-bar__fill ${
                                    progress > 70 ? 'progress-bar__fill--success' :
                                    progress > 30 ? 'progress-bar__fill--warning' :
                                    'progress-bar__fill--error'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="table-cell-hidden-sm">
                            <div className="tasks-cell">
                              <div className={`badge ${pending > 0 ? 'badge--warning' : 'badge--success'}`}>
                                {pending}
                              </div>
                              <small className="text-muted">pending</small>
                            </div>
                          </td>
                          
                          <td className="text-center">
                            <div className="actions-cell">
                              <button 
                                className="action-button action-button--primary"
                                onClick={() => handleViewClick(client)}
                                title="View Details"
                              >
                                <FiEye />
                              </button>
                              <button 
                                className="action-button action-button--success"
                                onClick={() => handleEditClick(client)}
                                title="Edit Client"
                              >
                                <FiEdit />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination-container">
                <div className="pagination-left">
                  <select
                    className="form-input pagination-select"
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <p className="pagination-info">
                    Showing <strong>{((filters.page - 1) * filters.limit) + 1}-{Math.min(filters.page * filters.limit, filteredClients.length)}</strong> of <strong>{filteredClients.length}</strong>
                  </p>
                </div>
                
                <div className="pagination">
                  {Array.from({ length: Math.ceil(filteredClients.length / filters.limit) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`pagination__item ${page === filters.page ? 'pagination__item--active' : ''}`}
                      onClick={() => {
                        console.log(`🔍 Page changed to: ${page}`);
                        handleFilterChange('page', page);
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state-container">
              <div className="empty-state">
                <FiUsers className="empty-state-icon" />
                <h3 className="empty-state-title">No Clients Found</h3>
                <p className="empty-state-description">
                  {services.length === 0 
                    ? 'Add services first to create clients' 
                    : `No clients found for ${companyCode || companyIdentifier}. Add your first client.`
                  }
                </p>
                <button 
                  className="btn btn--primary"
                  onClick={() => {
                    console.log('🔍 Create first client button clicked');
                    services.length === 0 ? setServicesModal(true) : setAddClientModal(true);
                  }}
                  disabled={!companyCode && !companyIdentifier}
                >
                  {services.length === 0 ? 'Add Services First' : 'Create First Client'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddClientModal
        open={addClientModal}
        onClose={() => {
          console.log('🔍 Add client modal closed');
          setAddClientModal(false);
        }}
        onAddClient={handleAddClient}
        services={services}
        projectManagers={projectManagers}
        loading={addLoading}
        companyCode={companyCode}
      />

      <ServicesModal
        open={servicesModal}
        onClose={() => {
          console.log('🔍 Services modal closed');
          setServicesModal(false);
        }}
        services={services}
        onAddService={handleAddService}
        onDeleteService={(id, name) => handleDeleteClick('service', id, name)}
        companyCode={companyCode}
      />

      {deleteDialog.open && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Delete {deleteDialog.type === 'client' ? 'Client' : 'Service'}</h3>
            </div>
            <div className="modal__content">
              <p>
                Are you sure you want to delete {deleteDialog.type} "{deleteDialog.name}"?
                {deleteDialog.type === 'client' && ' This action will also delete all associated tasks.'}
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outlined" onClick={handleDeleteCancel}>Cancel</button>
              <button 
                className="btn btn--error"
                onClick={handleDeleteConfirm}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDialog.open && viewDialog.client && (
        <div className="modal-overlay" onClick={() => setViewDialog({ open: false, client: null })}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Client Details & Task Management</h3>
              <button className="action-button" onClick={() => setViewDialog({ open: false, client: null })}>
                <FiX />
              </button>
            </div>
            <div className="modal__content">
              <div className="client-details-content">
                <div className="client-details-section">
                  <h4 className="section-header">
                    <FiBriefcase /> Basic Information
                  </h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <p className="detail-label">Client Name</p>
                      <p className="detail-value">{viewDialog.client.client}</p>
                    </div>
                    <div className="detail-item">
                      <p className="detail-label">Company</p>
                      <p className="detail-value">{viewDialog.client.company}</p>
                    </div>
                    <div className="detail-item">
                      <p className="detail-label">City</p>
                      <p className="detail-value">{viewDialog.client.city}</p>
                    </div>
                    <div className="detail-item">
                      <p className="detail-label">Status</p>
                      <div className={`status-chip status-chip--${viewDialog.client.status === 'Active' ? 'active' : viewDialog.client.status === 'On Hold' ? 'on-hold' : 'default'}`}>
                        {viewDialog.client.status}
                      </div>
                    </div>
                    {(viewDialog.client.companyCode || viewDialog.client.companyIdentifier) && (
                      <div className="detail-item">
                        <p className="detail-label">Company Info</p>
                        <p className="detail-value">
                          {viewDialog.client.companyCode && `Code: ${viewDialog.client.companyCode}`}
                          {viewDialog.client.companyIdentifier && ` • ID: ${viewDialog.client.companyIdentifier}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="client-details-section">
                  <h4 className="section-header">
                    <FiUsers /> Team
                  </h4>
                  <p className="section-description">
                    These managers will appear in task assignment dropdowns
                  </p>
                  <div>
                    {(() => {
                      const managers = getProjectManagersDetails(viewDialog.client);
                      return managers.length > 0 ? (
                        managers.map((manager, idx) => (
                          <React.Fragment key={idx}>
                            {renderManagerInfo(manager)}
                          </React.Fragment>
                        ))
                      ) : (
                        <div className="empty-state">
                          <p className="text-muted">No project managers assigned</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {viewDialog.client.services && viewDialog.client.services.length > 0 && (
                  <div className="client-details-section">
                    <h4 className="section-header">
                      <FiTrendingUp /> Services & Task Management
                    </h4>
                    <p className="section-description">
                      Add tasks with due dates and assign them to project managers
                    </p>
                    
                    {viewDialog.client.services.map((service, index) => {
                      const clientProjectManagers = getProjectManagersDetails(viewDialog.client);
                      return (
                        <ServiceProgressCard
                          key={index}
                          service={service}
                          clientId={viewDialog.client._id}
                          clientProjectManagers={clientProjectManagers}
                          onTaskUpdate={handleTaskUpdate}
                          api={tasksApi}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="client-details-section">
                  <h4 className="section-header">
                    <FiMapPin /> Additional Information
                  </h4>
                  <div className="details-grid">
                    {viewDialog.client.phone && (
                      <div className="detail-item">
                        <p className="detail-label">Phone</p>
                        <p className="detail-value">{viewDialog.client.phone}</p>
                      </div>
                    )}
                    {viewDialog.client.address && (
                      <div className="detail-item">
                        <p className="detail-label">Address</p>
                        <p className="detail-value">{viewDialog.client.address}</p>
                      </div>
                    )}
                    {viewDialog.client.description && (
                      <div className="detail-item detail-item-full">
                        <p className="detail-label">Description</p>
                        <p className="detail-value">{viewDialog.client.description}</p>
                      </div>
                    )}
                    {viewDialog.client.notes && (
                      <div className="detail-item detail-item-full">
                        <p className="detail-label">Notes</p>
                        <p className="detail-value">{viewDialog.client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outlined" onClick={() => setViewDialog({ open: false, client: null })}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editDialog.open && editDialog.client && (
        <div className="modal-overlay" onClick={() => setEditDialog({ open: false, client: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Edit Client</h3>
            </div>
            <div className="modal__content">
              <div className="edit-client-grid">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDialog.client.client}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, client: e.target.value }
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDialog.client.company}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, company: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDialog.client.city}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, city: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={editDialog.client.status}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, status: e.target.value }
                    })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group edit-managers-group">
                  <label className="form-label">Team *</label>
                  <div className="managers-list">
                    {safeMapProjectManagers((manager) => (
                      <div key={manager._id} className="manager-checkbox-item">
                        <input
                          type="checkbox"
                          id={`edit-manager-${manager._id}`}
                          checked={editDialog.client.projectManagers.some(pm => pm._id === manager._id || pm.id === manager._id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            console.log(`🔍 Manager ${manager.name} ${isChecked ? 'selected' : 'deselected'} for edit`);
                            setEditDialog({
                              ...editDialog,
                              client: {
                                ...editDialog.client,
                                projectManagers: isChecked
                                  ? [...editDialog.client.projectManagers, {
                                      _id: manager._id,
                                      name: manager.name,
                                      email: manager.email,
                                      role: manager.role
                                    }]
                                  : editDialog.client.projectManagers.filter(pm => pm._id !== manager._id)
                              }
                            });
                          }}
                        />
                        <div className="manager-checkbox-content">
                          <div className="avatar avatar--primary">
                            {manager.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold">{manager.name}</p>
                            <small className="text-muted">
                              {manager.role} • {manager.email}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group edit-services-group">
                  <label className="form-label">Services</label>
                  <div className="services-list">
                    {services.map((service) => (
                      <div key={service._id} className="service-checkbox-item">
                        <input
                          type="checkbox"
                          id={`edit-service-${service._id}`}
                          checked={(editDialog.client.services || []).includes(service.servicename)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            console.log(`🔍 Service ${service.servicename} ${isChecked ? 'selected' : 'deselected'} for edit`);
                            setEditDialog({
                              ...editDialog,
                              client: {
                                ...editDialog.client,
                                services: isChecked
                                  ? [...(editDialog.client.services || []), service.servicename]
                                  : (editDialog.client.services || []).filter(s => s !== service.servicename)
                              }
                            });
                          }}
                        />
                        <label htmlFor={`edit-service-${service._id}`}>
                          {service.servicename}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group edit-progress-group">
                  <label className="form-label">Progress</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDialog.client.progress}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, progress: e.target.value }
                    })}
                    placeholder="28/40 (70%)"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editDialog.client.email || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, email: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDialog.client.phone || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, phone: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group edit-address-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDialog.client.address || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, address: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group edit-description-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={editDialog.client.description || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, description: e.target.value }
                    })}
                    placeholder="Enter client description..."
                  />
                </div>

                <div className="form-group edit-notes-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={editDialog.client.notes || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      client: { ...editDialog.client, notes: e.target.value }
                    })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outlined" onClick={() => setEditDialog({ open: false, client: null })}>
                Cancel
              </button>
              <button 
                className="btn btn--primary"
                onClick={() => {
                  console.log('🔍 Save edit button clicked');
                  handleEditSave();
                }}
                disabled={!editDialog.client?.client || !editDialog.client?.company || !editDialog.client?.city || !editDialog.client?.projectManagers?.length}
              >
                <FiSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;