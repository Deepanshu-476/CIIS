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
  FiChevronUp,
  FiCreditCard,
  FiDollarSign,
  FiUpload
} from 'react-icons/fi';

// Import from react-icons/fa for additional icons if needed
import { FaTasks, FaProjectDiagram, FaCity } from 'react-icons/fa';
import { Repeat } from 'lucide-react';

// ============================================
//  CENTRALIZED AXIOS INSTANCES WITH INTERCEPTORS
// ============================================

// Helper to get token from localStorage (tries both common keys)
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

// Clients API instance
const api = axios.create({
  baseURL: `${API_URL}/clientsservice`,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tasks API instance
const tasksApi = axios.create({
  baseURL: `${API_URL}/tasks`,
  timeout: 10000,
});

tasksApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Users API instance
const usersApi = axios.create({
  baseURL: `${API_URL}/users`,
  timeout: 10000,
});

usersApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
//  PAYMENT RECEIPTS MODAL COMPONENT
// ============================================
const PaymentReceiptsModal = ({ open, onClose, client, onRenewSubscription, userRole }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState('');
  const [months, setMonths] = useState(1);
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [renewMessage, setRenewMessage] = useState({ type: '', text: '' });
  const [updating, setUpdating] = useState(false);

  if (!open || !client) return null;

  const paymentReceipts = client.paymentReceipts || [];
  const latestSubscription = client.subscription && client.subscription.length > 0 
    ? client.subscription[client.subscription.length - 1] 
    : null;

  const canRenewSubscription = userRole === 'owner' || userRole === 'admin' || userRole === 'superadmin';

  const calculateEndDate = (startDateValue, monthsValue) => {
    if (!startDateValue || !monthsValue) return '';
    const date = new Date(startDateValue);
    date.setMonth(date.getMonth() + parseInt(monthsValue));
    return date.toISOString().split('T')[0];
  };

  const handleMonthsChange = (selectedMonths) => {
    setMonths(selectedMonths);
    if (startDate) {
      const calculatedEndDate = calculateEndDate(startDate, selectedMonths);
      setEndDate(calculatedEndDate);
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date && months) {
      const calculatedEndDate = calculateEndDate(date, months);
      setEndDate(calculatedEndDate);
    }
  };

  const handleUpdateSubscription = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!startDate || !endDate) {
      setRenewMessage({
        type: 'error',
        text: 'Please select both start and end date'
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setRenewMessage({
        type: 'error',
        text: 'End date must be greater than start date'
      });
      return;
    }

    if (price && (isNaN(price) || parseFloat(price) <= 0)) {
      setRenewMessage({
        type: 'error',
        text: 'Please enter a valid price (positive number)'
      });
      return;
    }

    setUpdating(true);
    setRenewMessage({ type: '', text: '' });

    try {
      const response = await api.patch(
        `/renew-subscription/${client._id}`,
        {
          startDate,
          endDate,
          price: price ? parseFloat(price) : undefined
        }
      );

      if (response.data.success) {
        setRenewMessage({
          type: 'success',
          text: 'Subscription updated successfully!'
        });

        setStartDate('');
        setEndDate('');
        setPrice('');
        setMonths(1);

        if (onRenewSubscription) {
          onRenewSubscription();
        }

        setTimeout(() => {
          setShowRenewForm(false);
          setRenewMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      setRenewMessage({
        type: 'error',
        text: error.response?.data?.message || 'Update failed'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveSubscription = async () => {
    if (!window.confirm('Are you sure you want to remove the subscription for this client?')) {
      return;
    }

    setUpdating(true);
    setRenewMessage({ type: '', text: '' });

    try {
      const response = await api.delete(`/subscription/${client._id}`);

      if (response.data.success) {
        setRenewMessage({
          type: 'success',
          text: 'Subscription removed successfully!'
        });
        
        if (onRenewSubscription) {
          onRenewSubscription();
        }

        setTimeout(() => {
          setShowRenewForm(false);
          setRenewMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      setRenewMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to remove subscription'
      });
    } finally {
      setUpdating(false);
    }
  };

  const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal ClientManagement-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>
            <FiCreditCard className="ClientManagement-header-icon" />
            Payment Receipts & Subscription - {client.client}
          </h3>
          <button className="ClientManagement-action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          {latestSubscription ? (
            <div className="ClientManagement-current-subscription-info">
              <h4>📅 Current Subscription</h4>
              <div className="ClientManagement-subscription-details">
                <div className="ClientManagement-subscription-date">
                  <strong>Start:</strong> {new Date(latestSubscription.startDate).toLocaleDateString()}
                </div>
                <div className="ClientManagement-subscription-date">
                  <strong>End:</strong> {new Date(latestSubscription.endDate).toLocaleDateString()}
                </div>
                {latestSubscription.price && (
                  <div className="ClientManagement-subscription-price">
                    <strong>Price:</strong> ₹{typeof latestSubscription.price === 'number' ? latestSubscription.price.toLocaleString('en-IN') : latestSubscription.price}
                  </div>
                )}
                <div className={`ClientManagement-subscription-status ${new Date(latestSubscription.endDate) < new Date() ? 'expired' : 'active'}`}>
                  {new Date(latestSubscription.endDate) < new Date() ? 'Expired' : 'Active'}
                </div>
              </div>
            </div>
          ) : (
            <div className="ClientManagement-current-subscription-info ClientManagement-no-subscription">
              <h4>📅 No Active Subscription</h4>
              <div className="ClientManagement-subscription-details">
                <p className="ClientManagement-text-muted">This client doesn't have an active subscription.</p>
              </div>
            </div>
          )}

          {canRenewSubscription && (
            <>
              <div className="ClientManagement-renewal-section">
                <button 
                  type="button"
                  className={`ClientManagement-renewal-toggle-btn ${showRenewForm ? 'active' : ''}`}
                  onClick={() => setShowRenewForm(!showRenewForm)}
                >
                  <FiPlus /> {showRenewForm ? 'Cancel' : 'Update Subscription'}
                </button>

                {latestSubscription && (
                  <button 
                    type="button"
                    className="ClientManagement-renewal-toggle-btn ClientManagement-remove-subscription-btn"
                    onClick={handleRemoveSubscription}
                    disabled={updating}
                  >
                    <FiTrash2 /> Remove Subscription
                  </button>
                )}
              </div>

              {showRenewForm && (
                <div className="ClientManagement-renewal-form-container">
                  <h4>🔄 Update Subscription</h4>
                  
                  {renewMessage.text && (
                    <div className={`ClientManagement-renewal-message ClientManagement-renewal-message--${renewMessage.type}`}>
                      {renewMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                      <span>{renewMessage.text}</span>
                    </div>
                  )}

                  <div className="ClientManagement-renewal-form">
                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiCalendar /> Start Date
                      </label>
                      <input
                        type="date"
                        className="ClientManagement-form-input"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        disabled={updating}
                      />
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiCalendar /> Subscription Period (Months)
                      </label>
                      <select
                        className="ClientManagement-form-input"
                        value={months}
                        onChange={(e) => handleMonthsChange(parseInt(e.target.value))}
                        disabled={updating}
                      >
                        {monthOptions.map(month => (
                          <option key={month} value={month}>{month} {month === 1 ? 'Month' : 'Months'}</option>
                        ))}
                      </select>
                      <small className="ClientManagement-text-muted">Select number of months for subscription</small>
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiCalendar /> End Date (Auto-calculated)
                      </label>
                      <input
                        type="date"
                        className="ClientManagement-form-input"
                        value={endDate}
                        disabled
                        style={{ backgroundColor: '#f3f4f6' }}
                      />
                      <small className="ClientManagement-text-muted">End date will be calculated based on start date and months selected</small>
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiDollarSign /> Price (₹)
                      </label>
                      <input
                        type="number"
                        className="ClientManagement-form-input"
                        placeholder="Enter subscription price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={updating}
                        step="0.01"
                        min="0"
                      />
                      <small className="ClientManagement-text-muted">Enter the subscription amount</small>
                    </div>

                    <div className="ClientManagement-renewal-actions">
                      <button 
                        className="ClientManagement-btn ClientManagement-btn--outlined"
                        onClick={() => {
                          setShowRenewForm(false);
                          setStartDate('');
                          setEndDate('');
                          setPrice('');
                          setMonths(1);
                          setRenewMessage({ type: '', text: '' });
                        }}
                        disabled={updating}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        className="ClientManagement-btn ClientManagement-btn--primary"
                        onClick={(e) => handleUpdateSubscription(e)}
                        disabled={updating || !startDate || !endDate}
                      >
                        {updating ? ( 
                          <>
                            <div className="ClientManagement-spinner-small"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiCheckCircle /> Update Subscription
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <h4 className="ClientManagement-receipts-title">💰 Payment History ({paymentReceipts.length})</h4>
          
          {paymentReceipts.length > 0 ? (
            <div className="ClientManagement-payment-receipts-list">
              {paymentReceipts.map((receipt, index) => (
                <div key={index} className="ClientManagement-payment-receipt-card">
                  <div className="ClientManagement-payment-receipt-header">
                    <div className="ClientManagement-payment-receipt-title">
                      <span className="ClientManagement-payment-receipt-number">#{index + 1}</span>
                      <span className={`ClientManagement-badge ${
                        receipt.status === 'Approved' ? 'ClientManagement-badge--success' :
                        receipt.status === 'Rejected' ? 'ClientManagement-badge--error' : 'ClientManagement-badge--warning'
                      }`}>
                        {receipt.status === 'Approved' ? '✓ Approved' : 
                         receipt.status === 'Rejected' ? '✗ Rejected' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="ClientManagement-payment-receipt-date">
                      <FiCalendar size={14} />
                      {new Date(receipt.uploadedAt || receipt.uploadDate || receipt.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="ClientManagement-payment-receipt-details">
                    <div className="ClientManagement-payment-detail-row">
                      <div className="ClientManagement-payment-detail-label">
                        <FiDollarSign size={14} /> Amount:
                      </div>
                      <div className="ClientManagement-payment-detail-value ClientManagement-amount-highlight">
                        ₹{typeof receipt.amount === 'number' ? receipt.amount.toLocaleString('en-IN') : receipt.amount}
                      </div>
                    </div>
                    
                    <div className="ClientManagement-payment-detail-row">
                      <div className="ClientManagement-payment-detail-label">🔑 Transaction ID:</div>
                      <div className="ClientManagement-payment-detail-value ClientManagement-transaction-id">
                        <code>{receipt.transactionId}</code>
                        <button 
                          className="ClientManagement-copy-transaction-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(receipt.transactionId);
                            alert('Transaction ID copied!');
                          }}
                          title="Copy Transaction ID"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    
                    {receipt.receiptImage && (
                      <div className="ClientManagement-payment-receipt-image-container">
                        <div className="ClientManagement-payment-detail-label">🖼️ Receipt:</div>
                        <div className="ClientManagement-receipt-image-wrapper">
                          <img 
                            src={`${API_URL}/clientsservice/receipt-image/${receipt.receiptImage.split('/').pop()}`}
                            alt={`Receipt ${receipt.transactionId}`}
                            className="ClientManagement-receipt-image"
                            onClick={() => window.open(`${API_URL}/clientsservice/receipt-image/${receipt.receiptImage.split('/').pop()}`, '_blank')}
                            style={{ cursor: 'pointer', maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x200?text=Receipt+Not+Found';
                            }}
                          />
                          <button 
                            className="ClientManagement-view-receipt-btn"
                            onClick={() => window.open(`${API_URL}/clientsservice/receipt-image/${receipt.receiptImage.split('/').pop()}`, '_blank')}
                          >
                            <FiEye /> View Full Receipt
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {receipt.receiptFilename && (
                      <div className="ClientManagement-payment-detail-row">
                        <div className="ClientManagement-payment-detail-label">📄 File:</div>
                        <div className="ClientManagement-payment-detail-value">
                          {receipt.receiptOriginalName || receipt.receiptFilename}
                        </div>
                      </div>
                    )}
                    
                    {receipt.status !== 'Pending' && (
                      <div className={`ClientManagement-payment-verification-info ${receipt.status === 'Approved' ? 'approved' : 'rejected'}`}>
                        <div className="ClientManagement-payment-detail-label">
                          {receipt.status === 'Approved' ? '✓ Verified:' : '✗ Rejected:'}
                        </div>
                        <div className="ClientManagement-payment-verification-details">
                          {receipt.verifiedAt && (
                            <>on {new Date(receipt.verifiedAt).toLocaleString()}</>
                          )}
                          {receipt.notes && <div className="ClientManagement-verification-notes">📝 {receipt.notes}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ClientManagement-empty-state ClientManagement-text-center ClientManagement-py-4">
              <FiAlertCircle size={48} className="ClientManagement-text-muted ClientManagement-mb-2" />
              <p className="ClientManagement-text-muted">No payment receipts found</p>
              <small>Payment receipts will appear here after subscription payments are recorded</small>
            </div>
          )}
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
//  TASK DETAILS MODAL COMPONENT
// ============================================
const TaskDetailsModal = ({ task, open, onClose, projectManagers = [] }) => {
  if (!open) return null;

  const getAssigneeDetails = (assigneeName) => {
    return projectManagers.find(pm => pm.name === assigneeName);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'ClientManagement-badge--error';
      case 'Medium': return 'ClientManagement-badge--warning';
      case 'Low': return 'ClientManagement-badge--info';
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
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>Task Details</h3>
          <button className="ClientManagement-action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          <div className="ClientManagement-form-group">
            <label className="ClientManagement-form-label">Task Name</label>
            <p className="ClientManagement-text-large">{task.name}</p>
          </div>

          <div className="ClientManagement-grid-2">
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Status</label>
              <div className={`ClientManagement-badge ${task.completed ? 'ClientManagement-badge--success' : ''}`}>
                {task.completed ? 'Completed' : 'Pending'}
              </div>
            </div>
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Priority</label>
              <div className={`ClientManagement-badge ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </div>
            </div>
          </div>

          {task.dueDate && (
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Due Date</label>
              <div className="ClientManagement-flex-align-center ClientManagement-gap-1">
                <p>{new Date(task.dueDate).toLocaleDateString()}</p>
                {isOverdue(task.dueDate) && !task.completed && (
                  <div className="ClientManagement-badge ClientManagement-badge--error">Overdue</div>
                )}
              </div>
            </div>
          )}

          {task.assignee && (
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Assigned To</label>
              <div className="ClientManagement-flex-align-center ClientManagement-gap-1 ClientManagement-mt-1">
                {assigneeDetails ? (
                  <>
                    <div className="ClientManagement-avatar ClientManagement-avatar--primary">
                      {assigneeDetails.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="ClientManagement-text-bold">{assigneeDetails.name}</p>
                      {assigneeDetails.email && (
                        <small className="ClientManagement-text-muted">{assigneeDetails.email}</small>
                      )}
                    </div>
                  </>
                ) : (
                  <p>{task.assignee}</p>
                )}
              </div>
            </div>
          )}

          <div className="ClientManagement-form-group">
            <label className="ClientManagement-form-label">Created</label>
            <p>
              {new Date(task.createdAt).toLocaleDateString()} at{' '}
              {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {task.completed && task.completedAt && (
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Completed</label>
              <p>
                {new Date(task.completedAt).toLocaleDateString()} at{' '}
                {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
//  SERVICE PROGRESS CARD COMPONENT
// ============================================
const ServiceProgressCard = ({ service, clientId, clientProjectManagers = [], onTaskUpdate, api }) => {
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
    try {
      setLoading(true);
      const encodedService = encodeURIComponent(service);
      const response = await api.get(`/client/${clientId}/service/${encodedService}`);
      const tasksData = response.data?.data || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          setTasks(parsedTasks.map(task => ({
            ...task,
            dueDate: task.dueDate || null,
            assignee: task.assignee || '',
            priority: task.priority || 'Medium'
          })));
        } catch (e) {
          console.error('Error parsing localStorage tasks:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [clientId, service]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = async () => {
    if (newTask.name.trim()) {
      try {
        const encodedService = encodeURIComponent(service);
        const response = await api.post(`/client/${clientId}/service/${encodedService}`, {
          name: newTask.name.trim(),
          dueDate: newTask.dueDate || null,
          assignee: newTask.assignee,
          priority: newTask.priority
        });

        if (response.data.success) {
          setTasks([...tasks, response.data.data]);
          setNewTask({ name: '', dueDate: '', assignee: '', priority: 'Medium' });
          setShowAddTask(false);
          if (onTaskUpdate) {
            onTaskUpdate(service, [...tasks, response.data.data]);
          }
        }
      } catch (error) {
        console.error('Error adding task:', error);
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
    if (editTask && editTask.name.trim()) {
      try {
        if (editTask._id) {
          const response = await api.put(`/${editTask._id}`, {
            name: editTask.name.trim(),
            dueDate: editTask.dueDate || null,
            assignee: editTask.assignee,
            priority: editTask.priority
          });

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
        console.error('Error updating task:', error);
      }
    }
  };

  const toggleTaskCompletion = async (task) => {
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
      } else {
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
      }
      
      if (onTaskUpdate) {
        onTaskUpdate(service, updatedTasks);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      fetchTasks();
    }
  };

  const deleteTask = async (task) => {
    try {
      const updatedTasks = tasks.filter(t => t._id !== task._id && t.id !== task.id);
      setTasks(updatedTasks);

      if (task._id) {
        await api.delete(`/${task._id}`);
      } else {
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
      }
      
      if (onTaskUpdate) {
        onTaskUpdate(service, updatedTasks);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
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
      case 'High': return 'ClientManagement-badge--error';
      case 'Medium': return 'ClientManagement-badge--warning';
      case 'Low': return 'ClientManagement-badge--info';
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
      <div className="ClientManagement-card">
        <div className="ClientManagement-card__content">
          <div className="ClientManagement-flex-align-center ClientManagement-justify-center ClientManagement-py-3">
            <div className="ClientManagement-spinner"></div>
            <p className="ClientManagement-ml-2">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ClientManagement-card ClientManagement-mb-2">
      <div className="ClientManagement-card__content">
        <div className="ClientManagement-flex-align-center ClientManagement-justify-between ClientManagement-mb-2">
          <div className="ClientManagement-flex-grow-1">
            <h4 className="ClientManagement-mb-1">{service}</h4>
            <p className="ClientManagement-text-muted">
              {completedTasks} / {totalTasks} tasks completed
            </p>
          </div>
          <div className="ClientManagement-flex-align-center ClientManagement-gap-1">
            <div className={`ClientManagement-badge ${
              progressPercentage >= 100 ? 'ClientManagement-badge--success' :
              progressPercentage >= 70 ? 'ClientManagement-badge--info' :
              progressPercentage >= 40 ? 'ClientManagement-badge--warning' : ''
            }`}>
              {Math.round(progressPercentage)}%
            </div>
            <button 
              className="ClientManagement-action-button ClientManagement-action-button--primary"
              onClick={() => setShowAddTask(!showAddTask)}
              title="Add Task"
            >
              <FiPlus />
            </button>
            <button 
              className="ClientManagement-action-button"
              onClick={() => fetchTasks()}
              title="Refresh Tasks"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        <div className="ClientManagement-progress-bar ClientManagement-mb-2">
          <div 
            className={`ClientManagement-progress-bar__fill ${
              progressPercentage >= 100 ? 'ClientManagement-progress-bar__fill--success' :
              progressPercentage >= 70 ? 'ClientManagement-progress-bar__fill--primary' :
              progressPercentage >= 40 ? 'ClientManagement-progress-bar__fill--warning' : 'ClientManagement-progress-bar__fill--info'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {(showAddTask || editTask) && (
          <div className="ClientManagement-card ClientManagement-mb-2 ClientManagement-p-2 ClientManagement-bg-grey-50">
            <h5 className="ClientManagement-mb-2">{editTask ? 'Edit Task' : 'Add New Task'}</h5>
            <div className="ClientManagement-space-y-2">
              <input
                type="text"
                className="ClientManagement-form-input"
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
              
              <div className="ClientManagement-grid-2 ClientManagement-gap-2">
                <div>
                  <input
                    type="date"
                    className="ClientManagement-form-input"
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
                    className="ClientManagement-form-input"
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
                  className="ClientManagement-form-input"
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
              
              <div className="ClientManagement-flex ClientManagement-justify-end ClientManagement-gap-1">
                <button 
                  className="ClientManagement-btn ClientManagement-btn--outlined"
                  onClick={() => {
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
                  className="ClientManagement-btn ClientManagement-btn--primary"
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
          <h5 className="ClientManagement-mb-2">Tasks ({totalTasks}):</h5>
          {tasks.length > 0 ? (
            <div className="ClientManagement-task-list">
              {tasks.map((task) => (
                <div key={task._id || task.id} className="ClientManagement-task-item">
                  <div className="ClientManagement-task-item__checkbox">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task)}
                    />
                  </div>
                  <div className="ClientManagement-task-item__content">
                    <div className="ClientManagement-flex-align-center ClientManagement-gap-1 ClientManagement-flex-wrap">
                      <p className={task.completed ? 'ClientManagement-text-line-through ClientManagement-text-muted' : ''}>
                        {task.name}
                      </p>
                      
                      {task.priority && task.priority !== 'Medium' && (
                        <div className={`ClientManagement-badge ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </div>
                      )}
                      
                      {task.assignee && (
                        <div className="ClientManagement-badge" title={`Assigned to: ${task.assignee}`}>
                          {task.assignee}
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="ClientManagement-badge" title={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <small className="ClientManagement-text-muted">
                      Added: {new Date(task.createdAt).toLocaleDateString()}
                      {task.completed && task.completedAt && (
                        <> • Completed: {new Date(task.completedAt).toLocaleDateString()}</>
                      )}
                    </small>
                  </div>
                  <div className="ClientManagement-task-item__actions">
                    <button 
                      className="ClientManagement-action-button"
                      onClick={() => setShowTaskDetails({ open: true, task })}
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button 
                      className="ClientManagement-action-button ClientManagement-action-button--primary"
                      onClick={() => setEditTask(task)}
                      title="Edit Task"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      className="ClientManagement-action-button ClientManagement-action-button--error"
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
            <div className="ClientManagement-text-center ClientManagement-py-3 ClientManagement-border-dashed ClientManagement-border ClientManagement-rounded ClientManagement-bg-grey-50">
              <p className="ClientManagement-text-muted">
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
          onClose={() => setShowTaskDetails({ open: false, task: null })}
          projectManagers={clientProjectManagers}
        />
      )}
    </div>
  );
};

// ============================================
//  SERVICES MODAL COMPONENT
// ============================================
const ServicesModal = ({ open, onClose, services, onAddService, onDeleteService, companyCode }) => {
  const [newService, setNewService] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
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
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>Manage Services</h3>
          <button className="ClientManagement-action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          {!companyCode && (
            <div className="ClientManagement-alert ClientManagement-alert--warning ClientManagement-mb-3">
              <FiAlertCircle /> Company code not found. Services may not save properly.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="ClientManagement-mb-3">
            <div className="ClientManagement-grid-2 ClientManagement-gap-2">
              <div>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  placeholder="New Service Name"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  required
                />
                {companyCode && (
                  <small className="ClientManagement-text-muted ClientManagement-mt-1 ClientManagement-block">
                    This service will be added for company: {companyCode}
                  </small>
                )}
              </div>
              <div>
                <button 
                  type="submit" 
                  className="ClientManagement-btn ClientManagement-btn--primary ClientManagement-w-100"
                  disabled={!companyCode}
                >
                  <FiPlus /> {companyCode ? 'Add Service' : 'Company Code Required'}
                </button>
              </div>
            </div>
          </form>

          <hr className="ClientManagement-my-2" />

          <h4 className="ClientManagement-mb-2">All Services ({filteredServices.length})</h4>
          
          {filteredServices.length > 0 ? (
            <div className="ClientManagement-service-list">
              {filteredServices.map((service) => (
                <div key={service._id} className="ClientManagement-service-item">
                  <div className="ClientManagement-service-item__icon">
                    <FiBriefcase />
                  </div>
                  <div className="ClientManagement-service-item__content">
                    <p className="ClientManagement-font-bold">{service.servicename}</p>
                    <small className="ClientManagement-text-muted">
                      Created: {new Date(service.createdAt).toLocaleDateString()}
                      {service.companyCode && (
                        <> • Company: {service.companyCode}</>
                      )}
                    </small>
                  </div>
                  <div className="ClientManagement-service-item__actions">
                    <button
                      className="ClientManagement-action-button ClientManagement-action-button--error"
                      onClick={() => onDeleteService(service._id, service.servicename)}
                      title="Delete Service"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ClientManagement-text-center ClientManagement-py-3">
              <FiBriefcase className="ClientManagement-text-4xl ClientManagement-text-muted ClientManagement-mb-2" />
              <h5 className="ClientManagement-text-muted">No Services Found</h5>
              <p className="ClientManagement-text-muted">
                {companyCode 
                  ? 'Add your first service using the form above'
                  : 'Company code not found. Please refresh the page.'
                }
              </p>
            </div>
          )}
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
//  ADD CLIENT MODAL COMPONENT WITH PER MONTH SUBSCRIPTION
// ============================================
const AddClientModal = ({ 
  open, 
  onClose, 
  onAddClient, 
  services, 
  projectManagers,
  loading = false,
  companyCode 
}) => {
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
    notes: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    subscriptionPrice: '',
    subscriptionMonths: 1
  });

  const [managerSearch, setManagerSearch] = useState('');
  const [teamOpen, setTeamOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [dateError, setDateError] = useState('');
  const [priceError, setPriceError] = useState('');

  const filteredServices = companyCode 
    ? services.filter(service => service.companyCode === companyCode)
    : services;

  const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  useEffect(() => {
    if (open) {
      setFormError('');
      setFieldErrors({});
      setDateError('');
      setPriceError('');
      setNewClient(prev => ({ ...prev, subscriptionMonths: 1 }));
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.ClientManagement-dropdown-container')) {
        setTeamOpen(false);
        setServicesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const calculateEndDate = (startDate, months) => {
    if (!startDate || !months) return '';
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().split('T')[0];
  };

  const validateSubscriptionDates = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        setDateError('End date must be greater than start date');
        return false;
      } else {
        setDateError('');
        return true;
      }
    }
    setDateError('');
    return true;
  };

  const validatePrice = (price) => {
    if (price && (isNaN(price) || parseFloat(price) <= 0)) {
      setPriceError('Price must be a positive number');
      return false;
    }
    setPriceError('');
    return true;
  };

  const handleStartDateChange = (date) => {
    setNewClient(prev => ({...prev, subscriptionStartDate: date}));
    if (date && newClient.subscriptionMonths) {
      const calculatedEndDate = calculateEndDate(date, newClient.subscriptionMonths);
      setNewClient(prev => ({...prev, subscriptionEndDate: calculatedEndDate}));
      validateSubscriptionDates(date, calculatedEndDate);
    }
  };

  const handleMonthsChange = (months) => {
    setNewClient(prev => ({...prev, subscriptionMonths: months}));
    if (newClient.subscriptionStartDate && months) {
      const calculatedEndDate = calculateEndDate(newClient.subscriptionStartDate, months);
      setNewClient(prev => ({...prev, subscriptionEndDate: calculatedEndDate}));
      validateSubscriptionDates(newClient.subscriptionStartDate, calculatedEndDate);
    }
  };

  const handlePriceChange = (price) => {
    setNewClient(prev => ({...prev, subscriptionPrice: price}));
    validatePrice(price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});
    setDateError('');
    setPriceError('');

    const nextFieldErrors = {};
    if (!newClient.client.trim()) nextFieldErrors.client = 'Client name is required';
    if (!newClient.company.trim()) nextFieldErrors.company = 'Company is required';
    if (!newClient.city.trim()) nextFieldErrors.city = 'City is required';
    if (newClient.projectManagers.length === 0) nextFieldErrors.projectManagers = 'Select at least one team member';
    if (!companyCode) nextFieldErrors.companyCode = 'Company code is missing. Please login again.';
    if (filteredServices.length === 0) nextFieldErrors.services = 'Add at least one service before creating a client.';
    if (newClient.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email.trim())) {
      nextFieldErrors.email = 'Enter a valid email address';
    }

    if (newClient.subscriptionPrice && !validatePrice(newClient.subscriptionPrice)) {
      nextFieldErrors.subscriptionPrice = 'Please enter a valid price';
    }

    let subscriptionArray = [];
    if (newClient.subscriptionStartDate && newClient.subscriptionEndDate) {
      const start = new Date(newClient.subscriptionStartDate);
      const end = new Date(newClient.subscriptionEndDate);
      if (end <= start) {
        nextFieldErrors.subscriptionDates = 'End date must be greater than start date';
      } else {
        subscriptionArray = [{
          startDate: newClient.subscriptionStartDate,
          endDate: newClient.subscriptionEndDate,
          price: newClient.subscriptionPrice ? parseFloat(newClient.subscriptionPrice) : undefined,
          status: 'Active',
          months: newClient.subscriptionMonths
        }];
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError(Object.values(nextFieldErrors)[0]);
      return;
    }

    try {
      const selectedManagerIds = newClient.projectManagers;
      const selectedManagers = projectManagers.filter(pm => selectedManagerIds.includes(pm._id));
      const formattedProjectManagers = selectedManagers.map(pm => ({
        _id: pm._id,
        name: pm.name,
        email: pm.email,
        role: pm.role
      }));

      const clientData = {
        client: newClient.client,
        company: newClient.company,
        city: newClient.city,
        projectManagers: formattedProjectManagers,
        services: newClient.services,
        status: newClient.status,
        progress: newClient.progress,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        description: newClient.description,
        notes: newClient.notes,
        companyCode: companyCode,
        subscription: subscriptionArray
      };

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
        notes: '',
        subscriptionStartDate: '',
        subscriptionEndDate: '',
        subscriptionPrice: '',
        subscriptionMonths: 1
      });
    } catch (error) {
      console.error("Error adding client:", error);
      const responseData = error.response?.data || {};
      const message = responseData.message || responseData.errors?.join(', ') || error.message || 'Client add failed';
      setFormError(message);
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
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal ClientManagement-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>Add New Client</h3>
          {companyCode && (
            <small className="ClientManagement-text-muted">Company: {companyCode}</small>
          )}
          <button className="ClientManagement-action-button" onClick={onClose} disabled={loading}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          {formError && (
            <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3">
              <FiAlertCircle /> {formError}
            </div>
          )}

          {dateError && (
            <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3">
              <FiAlertCircle /> {dateError}
            </div>
          )}

          {priceError && (
            <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3">
              <FiAlertCircle /> {priceError}
            </div>
          )}

          {!companyCode && (
            <div className="ClientManagement-alert ClientManagement-alert--warning ClientManagement-mb-3">
              <FiAlertCircle /> Company code not found. Client may not save properly.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="ClientManagement-dropdown-container">
            <div className="ClientManagement-grid-2 ClientManagement-gap-2">
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Client Name *</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.client}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, client: '' }));
                    setNewClient(prev => ({...prev, client: e.target.value}));
                  }}
                  required
                  disabled={loading}
                />
                {fieldErrors.client && <small className="ClientManagement-text-danger">{fieldErrors.client}</small>}
              </div>
              
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Company *</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.company}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, company: '' }));
                    setNewClient(prev => ({...prev, company: e.target.value}));
                  }}
                  required
                  disabled={loading}
                />
                {fieldErrors.company && <small className="ClientManagement-text-danger">{fieldErrors.company}</small>}
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">City *</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.city}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, city: '' }));
                    setNewClient(prev => ({...prev, city: e.target.value}));
                  }}
                  required
                  disabled={loading}
                />
                {fieldErrors.city && <small className="ClientManagement-text-danger">{fieldErrors.city}</small>}
              </div>
              
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Status *</label>
                <select
                  className="ClientManagement-form-input"
                  value={newClient.status}
                  onChange={(e) => setNewClient(prev => ({...prev, status: e.target.value}))}
                  disabled={loading}
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">
                  <FiCalendar className="ClientManagement-icon-inline" /> Subscription Start Date
                </label>
                <input
                  type="date"
                  className="ClientManagement-form-input"
                  value={newClient.subscriptionStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={loading}
                />
                <small className="ClientManagement-text-muted">Select start date</small>
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">
                  <FiCalendar className="ClientManagement-icon-inline" /> Subscription Period
                </label>
                <select
                  className="ClientManagement-form-input"
                  value={newClient.subscriptionMonths}
                  onChange={(e) => handleMonthsChange(parseInt(e.target.value))}
                  disabled={loading}
                >
                  {monthOptions.map(month => (
                    <option key={month} value={month}>{month} {month === 1 ? 'Month' : 'Months'}</option>
                  ))}
                </select>
                <small className="ClientManagement-text-muted">Select number of months</small>
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">
                  <FiCalendar className="ClientManagement-icon-inline" /> Subscription End Date
                </label>
                <input
                  type="date"
                  className="ClientManagement-form-input"
                  value={newClient.subscriptionEndDate}
                  disabled
                  style={{ backgroundColor: '#f3f4f6' }}
                />
                <small className="ClientManagement-text-muted">Auto-calculated based on start date and months</small>
                {fieldErrors.subscriptionDates && (
                  <small className="ClientManagement-text-danger">{fieldErrors.subscriptionDates}</small>
                )}
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">
                  <FiDollarSign className="ClientManagement-icon-inline" /> Subscription Price (₹)
                </label>
                <input
                  type="number"
                  className="ClientManagement-form-input"
                  placeholder="Enter subscription amount"
                  value={newClient.subscriptionPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  disabled={loading}
                  step="0.01"
                  min="0"
                />
                <small className="ClientManagement-text-muted">Enter the subscription amount</small>
                {priceError && <small className="ClientManagement-text-danger">{priceError}</small>}
              </div>

              {/* Team Selection */}
              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Team *</label>
                <div className="ClientManagement-dropdown-wrapper">
                  <div
                    className="ClientManagement-dropdown-box"
                    onClick={() => setTeamOpen(!teamOpen)}
                  >
                    <span>
                      {newClient.projectManagers.length === 0
                        ? "Select team members"
                        : `${newClient.projectManagers.length} selected`}
                    </span>
                    <span className={`ClientManagement-dropdown-arrow ${teamOpen ? 'ClientManagement-dropdown-arrow--open' : ''}`}>
                      <FiChevronDown />
                    </span>
                  </div>

                  {teamOpen && (
                    <div className="ClientManagement-dropdown-content">
                      <div className="ClientManagement-dropdown-search">
                        <input
                          type="text"
                          className="ClientManagement-form-input"
                          placeholder="Search users..."
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      <div className="ClientManagement-dropdown-list">
                        {filteredManagers.length > 0 ? (
                          filteredManagers.map((manager) => (
                            <label
                              key={manager._id}
                              className="ClientManagement-dropdown-item"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={newClient.projectManagers.includes(manager._id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setNewClient(prev => ({
                                    ...prev,
                                    projectManagers: checked
                                      ? [...prev.projectManagers, manager._id]
                                      : prev.projectManagers.filter(id => id !== manager._id)
                                  }));
                                  setFieldErrors(prev => ({ ...prev, projectManagers: '' }));
                                }}
                                disabled={loading}
                              />
                              <div className="ClientManagement-dropdown-item-content">
                                <div className="ClientManagement-avatar ClientManagement-avatar--primary">
                                  {manager.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <span className="ClientManagement-font-medium">{manager.name || 'No Name'}</span>
                                  <div className="ClientManagement-dropdown-item-details">
                                    <span>•</span>
                                    <span>{manager.email || 'No email'}</span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="ClientManagement-dropdown-empty">
                            <p>No users found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {newClient.projectManagers.length > 0 && (
                  <div className="ClientManagement-selected-items-preview">
                    {newClient.projectManagers.map(managerId => {
                      const manager = projectManagers.find(pm => pm._id === managerId);
                      if (!manager) return null;
                      return (
                        <div key={managerId} className="ClientManagement-selected-item">
                          <span>{manager.name}</span>
                          <button
                            type="button"
                            className="ClientManagement-selected-item-remove"
                            onClick={() => {
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
                {fieldErrors.projectManagers && <small className="ClientManagement-text-danger">{fieldErrors.projectManagers}</small>}
              </div>

              {/* Services Selection */}
              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Services</label>
                {filteredServices.length === 0 && (
                  <div className="ClientManagement-alert ClientManagement-alert--info ClientManagement-mb-2">
                    <FiInfo /> No services available for this company. Please add services first.
                  </div>
                )}
                <div className="ClientManagement-dropdown-wrapper">
                  <div 
                    className="ClientManagement-dropdown-box"
                    onClick={() => setServicesOpen(!servicesOpen)}
                  >
                    <span>
                      {newClient.services.length === 0
                        ? "Select services"
                        : `${newClient.services.length} selected`}
                    </span>
                    <span className={`ClientManagement-dropdown-arrow ${servicesOpen ? 'ClientManagement-dropdown-arrow--open' : ''}`}>
                      <FiChevronDown />
                    </span>
                  </div>

                  {servicesOpen && (
                    <div className="ClientManagement-dropdown-content">
                      <div className="ClientManagement-dropdown-list">
                        {filteredServices.length > 0 ? (
                          filteredServices.map((service) => (
                            <label
                              key={service._id}
                              className="ClientManagement-dropdown-item"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                id={`service-${service._id}`}
                                checked={newClient.services.includes(service.servicename)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setNewClient(prev => ({
                                    ...prev,
                                    services: isChecked
                                      ? [...prev.services, service.servicename]
                                      : prev.services.filter(s => s !== service.servicename)
                                  }));
                                }}
                                disabled={loading || filteredServices.length === 0}
                              />
                              <label htmlFor={`service-${service._id}`} className="ClientManagement-dropdown-item-content">
                                <div className="ClientManagement-font-medium">{service.servicename}</div>
                              </label>
                            </label>
                          ))
                        ) : (
                          <div className="ClientManagement-dropdown-empty">
                            No services available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {newClient.services.length > 0 && (
                  <div className="ClientManagement-selected-items-preview">
                    {newClient.services.map((serviceName, index) => (
                      <div key={index} className="ClientManagement-selected-item ClientManagement-selected-item--info">
                        <span>{serviceName}</span>
                        <button
                          type="button"
                          className="ClientManagement-selected-item-remove"
                          onClick={() => {
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
                {fieldErrors.services && <small className="ClientManagement-text-danger">{fieldErrors.services}</small>}
              </div>

              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Description</label>
                <textarea
                  className="ClientManagement-form-input"
                  rows="3"
                  value={newClient.description}
                  onChange={(e) => setNewClient(prev => ({...prev, description: e.target.value}))}
                  placeholder="Enter client description..."
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Email</label>
                <input
                  type="email"
                  className="ClientManagement-form-input"
                  value={newClient.email}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                    setNewClient(prev => ({...prev, email: e.target.value}));
                  }}
                  disabled={loading}
                />
                {fieldErrors.email && <small className="ClientManagement-text-danger">{fieldErrors.email}</small>}
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Phone</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({...prev, phone: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Address</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({...prev, address: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Notes</label>
                <textarea
                  className="ClientManagement-form-input"
                  rows="2"
                  value={newClient.notes}
                  onChange={(e) => setNewClient(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Additional notes..."
                  disabled={loading}
                />
              </div>
            </div>
          </form>
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="ClientManagement-btn ClientManagement-btn--primary"
            onClick={handleSubmit}
            disabled={
              loading || 
              !newClient.client || 
              !newClient.company || 
              !newClient.city || 
              newClient.projectManagers.length === 0 ||
              filteredServices.length === 0 ||
              !companyCode ||
              !!dateError ||
              !!priceError
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

// ============================================
//  MAIN CLIENT MANAGEMENT COMPONENT
// ============================================
const ClientManagement = () => {
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
  const [paymentReceiptsModal, setPaymentReceiptsModal] = useState({ open: false, client: null });
  const [taskCounts, setTaskCounts] = useState({});
  
  const [companyCode, setCompanyCode] = useState('');
  const [companyIdentifier, setCompanyIdentifier] = useState('');
  const [userRole, setUserRole] = useState('');
  
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

  const [tasksStats, setTasksStats] = useState({
    pendingTasks: 0,
    overdueTasks: 0
  });

  const getLatestSubscriptionInfo = (client) => {
    if (!client.subscription || client.subscription.length === 0) {
      return { endDate: null, status: null, isExpired: false, formattedEndDate: null, price: null };
    }
    
    const latestSubscription = client.subscription[client.subscription.length - 1];
    const endDate = latestSubscription.endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(endDate);
    expiryDate.setHours(0, 0, 0, 0);
    const isExpired = expiryDate < today;
    
    return {
      endDate: endDate,
      status: latestSubscription.status,
      isExpired: isExpired,
      formattedEndDate: endDate ? new Date(endDate).toLocaleDateString() : null,
      price: latestSubscription.price
    };
  };

  useEffect(() => {
    const getUserRole = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserRole(user.role || user.userRole || 'client');
        } else {
          setUserRole('client');
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        setUserRole('client');
      }
    };
    getUserRole();
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = () => {
      try {
        const localStorageCompany = localStorage.getItem('company') || '';
        const localStorageCompanyDetails = localStorage.getItem('companyDetails') || '';
        
        const companyCodeFromStorage = localStorage.getItem('companyCode') || localStorageCompany;
        const companyIdentifierFromStorage = localStorage.getItem('companyIdentifier') || localStorageCompanyDetails;
        
        setCompanyCode(companyCodeFromStorage);
        setCompanyIdentifier(companyIdentifierFromStorage);
        
        if (!companyCodeFromStorage && !companyIdentifierFromStorage) {
          setError('Company information not found. Please login again.');
        } else {
          setError('');
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        setError('Error loading company information');
      }
    };

    fetchCompanyInfo();
  }, []);

  const fetchProjectManagers = async () => {
    try {
      const token = getAuthToken();
      const userStr = localStorage.getItem('user');
      let currentUser = {};

      if (userStr) {
        currentUser = JSON.parse(userStr);
      }

      const companyRole = (
        currentUser.companyRole ||
        currentUser.role ||
        currentUser.userRole ||
        ''
      ).toLowerCase();

      let apiEndpoint = '/company-users';

      if (companyRole === 'employee') {
        apiEndpoint = '/department-users';
      }

      if (companyRole === 'owner' || companyRole === 'hr' || companyRole === 'manager') {
        apiEndpoint = '/company-users';
      }

      const response = await usersApi.get(apiEndpoint, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      let usersArray = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          usersArray = response.data;
        } else if (Array.isArray(response.data.users)) {
          usersArray = response.data.users;
        } else if (response.data.message && Array.isArray(response.data.message.users)) {
          usersArray = response.data.message.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersArray = response.data.data;
        }
      }

      const formattedManagers = usersArray.map((user) => ({
        _id: user.id || user._id,
        name: user.name || 'Unknown User',
        email: user.email || '',
        role: user.companyRole || user.jobRole || '',
        phone: user.phone || '',
        department: user.department || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      }));

      setProjectManagers(formattedManagers);

      if (formattedManagers.length > 0) {
        setSuccess(`Loaded ${formattedManagers.length} users`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('No users found');
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      setProjectManagers([]);
      setError('Failed to load users');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchProjectManagers();
      
      const apiParams = {
        ...filters,
        companyCode: companyCode || undefined,
        companyIdentifier: companyIdentifier || undefined
      };
      
      const [clientsRes, servicesRes] = await Promise.all([
        api.get('/', { params: apiParams }),
        api.get('/services', { 
          params: { 
            companyCode: companyCode || undefined,
            companyIdentifier: companyIdentifier || undefined
          } 
        })
      ]);
      
      if (servicesRes.data?.success) {
        const allServices = servicesRes.data.data || [];
        setServices(allServices);
      } else {
        setServices([]);
      }
      
      if (clientsRes.data?.success) {
        const allClients = clientsRes.data.data || [];
        
        const enhancedClients = allClients.map(client => ({
          ...client,
          projectManagers: Array.isArray(client.projectManagers) ? client.projectManagers : []
        }));
        
        setClients(enhancedClients);
      } else {
        setClients([]);
      }
      
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Data fetch failed';
      setError(errorMessage);
      setClients([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyCode || companyIdentifier) {
      fetchData();
    }
  }, [filters, companyCode, companyIdentifier]);

  const fetchClientTasks = async (clientId) => {
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
      console.error(`Error fetching client tasks for ${clientId}:`, error);
      return [];
    }
  };

  useEffect(() => {
    const calculateTasksForAll = async () => {
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
          console.error(`Error calculating tasks for client ${client._id}:`, error);
          counts[client._id] = { total: 0, completed: 0, pending: 0 };
        }
      }
      
      setTaskCounts(counts);
      setTasksStats(prev => ({
        ...prev,
        pendingTasks: totalPending
      }));
    };
    
    if (clients.length > 0) {
      calculateTasksForAll();
      
      const calculateOverdueTasks = async () => {
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
        setTasksStats(prev => ({
          ...prev,
          overdueTasks: totalOverdue
        }));
      };
      
      calculateOverdueTasks();
    } else {
      setTaskCounts({});
      setTasksStats({
        pendingTasks: 0,
        overdueTasks: 0
      });
    }
  }, [clients]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {})
    }));
  };

  const handleAddService = async (serviceName) => {
    if (!serviceName.trim()) return;

    try {
      const serviceData = { 
        servicename: serviceName.trim(),
        companyCode: companyCode
      };
      
      const response = await api.post('/services', serviceData);
      
      if (response.data.success) {
        setSuccess('Service added successfully!');
        setError('');
        fetchData();
      } else {
        setError(response.data.message || 'Service add failed');
      }
    } catch (err) {
      console.error('Add service error:', err);
      const errorMsg = err.response?.data?.message || 'Service add failed';
      setError(errorMsg);
    }
  };

  const handleAddClient = async (clientData) => {
    try {
      setAddLoading(true);
      setError('');
      
      const managerNames = clientData.projectManagers.map(pm => pm.name);
      
      const backendClientData = {
        client: clientData.client,
        company: clientData.company,
        city: clientData.city,
        projectManager: managerNames,
        services: clientData.services,
        status: clientData.status,
        progress: clientData.progress,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        description: clientData.description,
        notes: clientData.notes,
        companyCode: clientData.companyCode,
        subscription: clientData.subscription || []
      };
      
      const response = await api.post('/', backendClientData);
      
      if (response.data.success) {
        setSuccess('Client added successfully!');
        setError('');
        setAddClientModal(false);
        fetchData();
      } else {
        setError(response.data.message || 'Client add failed');
      }
    } catch (err) {
      console.error('Add client error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.join(', ') || 
                          'Client add failed';
      setError(errorMessage);
      throw err;
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateClient = async (clientId, updateData) => {
    try {
      const response = await api.put(`/${clientId}`, updateData);
      
      if (response.data.success) {
        setSuccess('Client updated successfully!');
        setEditDialog({ open: false, client: null });
        fetchData();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Client update failed';
      setError(errorMessage);
      console.error('Update client error:', err);
    }
  };

  const handleDeleteClick = (type, id, name) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleDeleteConfirm = async () => {
    const { type, id } = deleteDialog;
    
    try {
      if (type === 'client') {
        try {
          const tasksResponse = await tasksApi.get(`/client/${id}`);
          const tasks = tasksResponse.data?.data || [];
          if (Array.isArray(tasks)) {
            for (const task of tasks) {
              await tasksApi.delete(`/${task._id}`);
            }
          }
        } catch (taskError) {
          console.warn('Error deleting client tasks:', taskError);
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
      console.error('Delete error:', err);
    }
    
    setDeleteDialog({ open: false, type: '', id: '', name: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, type: '', id: '', name: '' });
  };

  const handleEditClick = (client) => {
    let subscriptionStartDate = '';
    let subscriptionEndDate = '';
    let subscriptionPrice = '';
    
    if (client.subscription && client.subscription.length > 0) {
      const latestSub = client.subscription[client.subscription.length - 1];
      subscriptionStartDate = new Date(latestSub.startDate).toISOString().split('T')[0];
      subscriptionEndDate = new Date(latestSub.endDate).toISOString().split('T')[0];
      subscriptionPrice = latestSub.price || '';
    }
    
    let formattedProjectManagers = [];
    
    if (client.projectManagers && Array.isArray(client.projectManagers)) {
      if (client.projectManagers.length > 0 && typeof client.projectManagers[0] === 'object') {
        formattedProjectManagers = client.projectManagers.map(pm => ({
          _id: pm._id || pm.id,
          name: pm.name,
          email: pm.email,
          role: pm.role
        }));
      } else if (client.projectManagers.length > 0 && typeof client.projectManagers[0] === 'string') {
        formattedProjectManagers = client.projectManagers.map(name => {
          const manager = projectManagers.find(pm => pm.name === name);
          return manager ? {
            _id: manager._id,
            name: manager.name,
            email: manager.email,
            role: manager.role
          } : { _id: name, name: name, email: '', role: '' };
        });
      }
    }
    
    if (formattedProjectManagers.length === 0 && client.projectManager && Array.isArray(client.projectManager)) {
      formattedProjectManagers = client.projectManager.map(name => {
        const manager = projectManagers.find(pm => pm.name === name);
        return manager ? {
          _id: manager._id,
          name: manager.name,
          email: manager.email,
          role: manager.role
        } : { _id: name, name: name, email: '', role: '' };
      });
    }
    
    setEditDialog({ 
      open: true, 
      client: {
        ...client,
        projectManagers: formattedProjectManagers,
        subscriptionStartDate: subscriptionStartDate,
        subscriptionEndDate: subscriptionEndDate,
        subscriptionPrice: subscriptionPrice
      }
    });
  };

  const handleEditSave = () => {
    const { client } = editDialog;
    
    const formattedProjectManagers = client.projectManagers.map(pm => ({
      _id: pm._id || pm.id,
      name: pm.name,
      email: pm.email,
      role: pm.role
    }));
    
    const managerNames = client.projectManagers.map(pm => pm.name);
    
    let subscriptionData = [];
    
    if (client.subscriptionStartDate && client.subscriptionEndDate) {
      subscriptionData = [{
        startDate: client.subscriptionStartDate,
        endDate: client.subscriptionEndDate,
        price: client.subscriptionPrice ? parseFloat(client.subscriptionPrice) : 0,
        status: 'Active'
      }];
    } else if (client.subscription && client.subscription.length > 0) {
      subscriptionData = client.subscription;
    }
    
    const updateData = {
      client: client.client,
      company: client.company,
      city: client.city,
      projectManager: managerNames,
      services: client.services,
      status: client.status,
      progress: client.progress,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      description: client.description || '',
      notes: client.notes || '',
      companyCode: companyCode,
      subscription: subscriptionData
    };
    
    handleUpdateClient(client._id, updateData);
  };

  const handleViewClick = (client) => {
    setViewDialog({ open: true, client });
  };

  const safeMapProjectManagers = (callback) => {
    return Array.isArray(projectManagers) 
      ? projectManagers.map(callback)
      : [];
  };

  const filteredClients = clients;

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
      <div className="ClientManagement-manager-info">
        <div className="ClientManagement-manager-header">
          <div className="ClientManagement-avatar ClientManagement-avatar--primary">
            {manager.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="ClientManagement-font-bold">{manager.name}</p>
          </div>
        </div>
        <div className="ClientManagement-manager-details">
          {manager.email && (
            <div>
              <small className="ClientManagement-text-muted">Email:</small>
              <small>{manager.email}</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleTaskUpdate = (serviceName, tasks) => {
    console.log(`Tasks updated for ${serviceName}:`, tasks);
  };

  return (
    <div className="ClientManagement-client-management">
      <div className="ClientManagement-client-management-header">
        <div className="ClientManagement-card__content">
          <div className="ClientManagement-client-header-container">
            <div className="ClientManagement-client-header-left">
              <FiUsers className="ClientManagement-client-header-icon" />
              <div>
                <h1 className="ClientManagement-client-header-title">Client Management</h1>
                <p className="ClientManagement-client-header-subtitle">
                  {companyCode || companyIdentifier 
                    ? `Company: ${companyCode || companyIdentifier}` 
                    : 'Manage clients and services'}
                </p>
              </div>
            </div>
            <div className="ClientManagement-client-header-actions">
              <button
                className="ClientManagement-btn ClientManagement-btn--outlined"
                onClick={() => setServicesModal(true)}
                disabled={!companyCode && !companyIdentifier}
              >
                <FiBriefcase /> Services ({services.length})
              </button>
              <button
                className="ClientManagement-btn ClientManagement-btn--primary"
                onClick={() => setAddClientModal(true)}
                disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
              >
                <FiPlus /> Add Client
              </button>
              <button
                className="ClientManagement-btn ClientManagement-btn--outlined"
                onClick={() => fetchData()}
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ClientManagement-stats-griddd">
        {[
          { label: 'Total Clients', value: filteredClients.length, color: 'primary', icon: <FiUsers /> },
          { label: 'Active Clients', value: filteredClients.filter(c => c.status === 'Active').length, color: 'success', icon: <FiCheckCircle /> },
          { label: 'Pending Tasks', value: tasksStats.pendingTasks, color: 'warning', icon: <FiClock /> },
          { label: 'Overdue Tasks', value: tasksStats.overdueTasks, color: 'error', icon: <FiAlertCircle /> },
          { label: 'Services', value: services.length, color: 'info', icon: <FiBriefcase /> },
        ].map((stat, index) => (
          <div key={index} className={`ClientManagement-stat-card ClientManagement-stat-card--${stat.color}`}>
            <div className="ClientManagement-card__content">
              <div className="ClientManagement-stat-card-content">
                <div className={`ClientManagement-avatar ClientManagement-avatar--${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <small className="ClientManagement-text-muted">{stat.label}</small>
                  <p className="ClientManagement-stat-card-value">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!companyCode && !companyIdentifier && (
        <div className="ClientManagement-alert ClientManagement-alert--warning">
          <FiAlertCircle /> Company information not found. Please refresh the page or login again.
        </div>
      )}

      {error && (
        <div className="ClientManagement-alert ClientManagement-alert--error">
          <FiAlertCircle /> {error}
        </div>
      )}

      {success && (
        <div className="ClientManagement-alert ClientManagement-alert--success">
          <FiCheckCircle /> {success}
        </div>
      )}

      <div className="ClientManagement-card">
        <div className="ClientManagement-card__header ClientManagement-card-header-gradient">
          <div className="ClientManagement-card-header-container">
            <div className="ClientManagement-card-header-left">
              <div className="ClientManagement-avatar-circle">
                <FiUsers />
              </div>
              <div>
                <h2 className="ClientManagement-card-header-title">Client Portfolio</h2>
                <p className="ClientManagement-card-header-subtitle">
                  Total {filteredClients.length} clients • {filteredClients.filter(c => c.status === 'Active').length} active                  
                  {(companyCode || companyIdentifier) && 
                    <span> • Company: {companyCode || companyIdentifier}</span>
                  }
                </p>
              </div>
            </div>
            
            <div className="ClientManagement-card-header-right">
              <div className="ClientManagement-active-indicator">
                <FiActivity />
                <span>{filteredClients.filter(c => c.status === 'Active').length} Active</span>
              </div>
              
              <button 
                className="ClientManagement-refresh-button"
                onClick={() => fetchData()}
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>
        </div>
        
        <div className="ClientManagement-filter-bar">
          <div className="ClientManagement-filter-grid">
            <div className="ClientManagement-filter-search-container">
              <div className="ClientManagement-search-input">
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
                className="ClientManagement-form-input"
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
                className="ClientManagement-form-input"
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
                className="ClientManagement-form-input"
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
                className="ClientManagement-btn ClientManagement-btn--primary ClientManagement-w-100"
                onClick={() => setAddClientModal(true)}
                disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
              >
                <FiPlus /> New Client
              </button>
            </div>
          </div>
        </div>
        
        <div className="ClientManagement-card__content ClientManagement-card-content-padded">
          {!companyCode && !companyIdentifier ? (
            <div className="ClientManagement-empty-state-container">
              <div className="ClientManagement-empty-state">
                <FiAlertCircle className="ClientManagement-empty-state-icon" />
                <h3 className="ClientManagement-empty-state-title">Company Information Required</h3>
                <p className="ClientManagement-empty-state-description">
                  Company code or identifier not found. Please refresh the page or login again.
                </p>
                <button 
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="ClientManagement-loading-container">
              <div className="ClientManagement-spinner"></div>
              <p>Loading clients...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <>
              <div className="ClientManagement-table-container">
                <table className="ClientManagement-data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th className="ClientManagement-table-cell-hidden-sm">Company</th>
                      <th className="ClientManagement-table-cell-hidden-md">Services</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Subscription</th>
                      <th className="ClientManagement-table-cell-hidden-sm">Tasks</th>
                      <th className="ClientManagement-text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => {
                      const stats = taskCounts[client._id] || { total: 0, completed: 0, pending: 0 };
                      const pending = stats.pending || 0;
                      const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                      const subscriptionInfo = getLatestSubscriptionInfo(client);
                      
                      return (
                        <tr key={client._id}>
                          <td>
                            <div className="ClientManagement-client-cell">
                              <div>
                                <p className="ClientManagement-font-bold">{client.client || 'N/A'}</p>
                                <small className="ClientManagement-text-muted ClientManagement-client-cell-secondary">
                                  ID: {client.clientId || client._id?.slice(-6)}
                                  {client.companyCode && ` • Code: ${client.companyCode}`}
                                  {client.companyIdentifier && ` • ID: ${client.companyIdentifier}`}
                                </small>
                                <small className="ClientManagement-text-muted ClientManagement-client-cell-mobile">
                                  {client.company || 'N/A'}
                                </small>
                              </div>
                            </div>
                          </td>
                          
                          <td className="ClientManagement-table-cell-hidden-sm">
                            <div>
                              <p className="ClientManagement-font-medium">{client.company || 'N/A'}</p>
                              <small className="ClientManagement-text-muted">{client.email || 'No email'}</small>
                            </div>
                          </td>
                          
                          <td className="ClientManagement-table-cell-hidden-md">
                            <div className="ClientManagement-services-tags">
                              {Array.isArray(client.services) && client.services.slice(0, 2).map((service, idx) => (
                                <div key={idx} className="ClientManagement-badge ClientManagement-badge--info">
                                  {service}
                                </div>
                              ))}
                              {Array.isArray(client.services) && client.services.length > 2 && (
                                <div className="ClientManagement-badge">
                                  +{client.services.length - 2}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td>
                            <div className={`ClientManagement-status-chip ClientManagement-status-chip--${client.status === 'Active' ? 'active' : client.status === 'On Hold' ? 'on-hold' : 'default'}`}>
                              {client.status || 'Unknown'}
                            </div>
                          </td>
                          
                          <td>
                            <div className="ClientManagement-progress-cell">
                              <div className="ClientManagement-progress-header">
                                <p className="ClientManagement-font-medium">{progress}%</p>
                                <small className="ClientManagement-text-muted ClientManagement-progress-stats">
                                  {stats.completed}/{stats.total}
                                </small>
                              </div>
                              <div className="ClientManagement-progress-bar">
                                <div 
                                  className={`ClientManagement-progress-bar__fill ${
                                    progress > 70 ? 'ClientManagement-progress-bar__fill--success' :
                                    progress > 30 ? 'ClientManagement-progress-bar__fill--warning' :
                                    'ClientManagement-progress-bar__fill--error'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          
                          <td>
                            <div className="ClientManagement-subscription-cell">
                              {subscriptionInfo.endDate ? (
                                <div className={`ClientManagement-subscription-badge ${subscriptionInfo.isExpired ? 'ClientManagement-subscription-expired' : 'ClientManagement-subscription-active'}`}>
                                  <div className="ClientManagement-subscription-date">
                                    <small>Expires:</small>
                                    <strong>{subscriptionInfo.formattedEndDate}</strong>
                                  </div>
                                  {subscriptionInfo.price && (
                                    <div className="ClientManagement-subscription-price-badge">
                                      <small>₹{typeof subscriptionInfo.price === 'number' ? subscriptionInfo.price.toLocaleString('en-IN') : subscriptionInfo.price}</small>
                                    </div>
                                  )}
                                  <div className={`ClientManagement-subscription-status ${subscriptionInfo.isExpired ? 'status-expired' : 'status-active'}`}>
                                    {subscriptionInfo.isExpired ? 'Expired' : 'Active'}
                                  </div>
                                </div>
                              ) : (
                                <div className="ClientManagement-subscription-badge ClientManagement-subscription-none">
                                  <small>No subscription</small>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="ClientManagement-table-cell-hidden-sm">
                            <div className="ClientManagement-tasks-cell">
                              <div className={`ClientManagement-badge ${pending > 0 ? 'ClientManagement-badge--warning' : 'ClientManagement-badge--success'}`}>
                                {pending}
                              </div>
                              <small className="ClientManagement-text-muted">pending</small>
                            </div>
                          </td>
                          
                          <td className="ClientManagement-text-center">
                            <div className="ClientManagement-actions-cell">
                              <button 
                                className="ClientManagement-action-button ClientManagement-action-button--primary"
                                onClick={() => handleViewClick(client)}
                                title="View Details"
                              >
                                <FiEye />
                              </button>
                              <button 
                                className="ClientManagement-action-button ClientManagement-action-button--success"
                                onClick={() => handleEditClick(client)}
                                title="Edit Client"
                              >
                                <FiEdit />
                              </button>
                              <button 
                                className="ClientManagement-action-button ClientManagement-action-button--info"
                                onClick={() => setPaymentReceiptsModal({ open: true, client: client })}
                                title="View Payment Receipts"
                              >
                                <FiCreditCard />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="ClientManagement-pagination-container">
                <div className="ClientManagement-pagination-left">
                  <select
                    className="ClientManagement-form-input ClientManagement-pagination-select"
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <p className="ClientManagement-pagination-info">
                    Showing <strong>{((filters.page - 1) * filters.limit) + 1}-{Math.min(filters.page * filters.limit, filteredClients.length)}</strong> of <strong>{filteredClients.length}</strong>
                  </p>
                </div>
                
                <div className="ClientManagement-pagination">
                  {Array.from({ length: Math.ceil(filteredClients.length / filters.limit) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`ClientManagement-pagination__item ${page === filters.page ? 'ClientManagement-pagination__item--active' : ''}`}
                      onClick={() => handleFilterChange('page', page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="ClientManagement-empty-state-container">
              <div className="ClientManagement-empty-state">
                <FiUsers className="ClientManagement-empty-state-icon" />
                <h3 className="ClientManagement-empty-state-title">No Clients Found</h3>
                <p className="ClientManagement-empty-state-description">
                  {services.length === 0 
                    ? 'Add services first to create clients' 
                    : `No clients found for ${companyCode || companyIdentifier}. Add your first client.`
                  }
                </p>
                <button 
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  onClick={() => services.length === 0 ? setServicesModal(true) : setAddClientModal(true)}
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
        onClose={() => setAddClientModal(false)}
        onAddClient={handleAddClient}
        services={services}
        projectManagers={projectManagers}
        loading={addLoading}
        companyCode={companyCode}
      />

      <ServicesModal
        open={servicesModal}
        onClose={() => setServicesModal(false)}
        services={services}
        onAddService={handleAddService}
        onDeleteService={(id, name) => handleDeleteClick('service', id, name)}
        companyCode={companyCode}
      />

      {deleteDialog.open && (
        <div className="ClientManagement-modal-overlay" onClick={handleDeleteCancel}>
          <div className="ClientManagement-modal" onClick={e => e.stopPropagation()}>
            <div className="ClientManagement-modal__header">
              <h3>Delete {deleteDialog.type === 'client' ? 'Client' : 'Service'}</h3>
            </div>
            <div className="ClientManagement-modal__content">
              <p>
                Are you sure you want to delete {deleteDialog.type} "{deleteDialog.name}"?
                {deleteDialog.type === 'client' && ' This action will also delete all associated tasks.'}
              </p>
            </div>
            <div className="ClientManagement-modal__footer">
              <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={handleDeleteCancel}>Cancel</button>
              <button 
                className="ClientManagement-btn ClientManagement-btn--error"
                onClick={handleDeleteConfirm}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDialog.open && viewDialog.client && (
        <div className="ClientManagement-modal-overlay ClientManagement-view-modal-overlay" onClick={() => setViewDialog({ open: false, client: null })}>
          <div className="ClientManagement-modal ClientManagement-modal-lg ClientManagement-view-modal" onClick={e => e.stopPropagation()}>
            <div className="ClientManagement-modal__header ClientManagement-view-modal-header">
              <h3>Client Details</h3>
              <button className="ClientManagement-action-button ClientManagement-view-modal-close" onClick={() => setViewDialog({ open: false, client: null })}>
                <FiX />
              </button>
            </div>
            
            <div className="ClientManagement-modal__content ClientManagement-view-modal-content">
              <div className="ClientManagement-client-details-content">
                <div className="ClientManagement-client-details-section">
                  <h4 className="ClientManagement-section-header">
                    <FiBriefcase className="ClientManagement-section-icon" />
                    Basic Information
                  </h4>
                  
                  <div className="ClientManagement-details-grid">
                    <div className="ClientManagement-detail-item">
                      <p className="ClientManagement-detail-label">Client Name</p>
                      <p className="ClientManagement-detail-value ClientManagement-client-name-highlight">{viewDialog.client.client}</p>
                    </div>
                    
                    <div className="ClientManagement-detail-item">
                      <p className="ClientManagement-detail-label">Company</p>
                      <p className="ClientManagement-detail-value ClientManagement-company-badge">{viewDialog.client.company}</p>
                    </div>
                    
                    <div className="ClientManagement-detail-item">
                      <p className="ClientManagement-detail-label">City</p>
                      <p className="ClientManagement-detail-value ClientManagement-location-text">
                        <span className="ClientManagement-location-dot"></span>
                        <span>{viewDialog.client.city}</span>
                      </p>
                    </div>
                    
                    <div className="ClientManagement-detail-item">
                      <p className="ClientManagement-detail-label">Status</p>
                      <div className={`ClientManagement-status-chip ClientManagement-status-chip--${viewDialog.client.status === 'Active' ? 'active' : viewDialog.client.status === 'On Hold' ? 'on-hold' : 'default'}`}>
                        <span className="ClientManagement-status-dot"></span>
                        {viewDialog.client.status}
                      </div>
                    </div>
                    
                    {(viewDialog.client.companyCode || viewDialog.client.companyIdentifier) && (
                      <div className="ClientManagement-detail-item ClientManagement-company-info-item">
                        <p className="ClientManagement-detail-label">Company Info</p>
                        <p className="ClientManagement-detail-value ClientManagement-company-codes">
                          {viewDialog.client.companyCode && (
                            <span className="ClientManagement-company-code-badge">Code: {viewDialog.client.companyCode}</span>
                          )}
                          {viewDialog.client.companyIdentifier && (
                            <span className="ClientManagement-company-id-badge">ID: {viewDialog.client.companyIdentifier}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ClientManagement-client-details-section ClientManagement-team-section">
                  <h4 className="ClientManagement-section-header">
                    <FiUsers className="ClientManagement-section-icon" />
                    Team
                  </h4>
                  
                  <p className="ClientManagement-section-description ClientManagement-team-description">
                    <span className="ClientManagement-description-icon">👥</span>
                    These managers will appear in task assignment dropdowns
                  </p>
                  
                  <div className="ClientManagement-team-members-container">
                    {(() => {
                      const managers = getProjectManagersDetails(viewDialog.client);
                      return managers.length > 0 ? (
                        <div className="ClientManagement-managers-grid">
                          {managers.map((manager, idx) => (
                            <div key={idx} className="ClientManagement-manager-card-wrapper">
                              {renderManagerInfo(manager)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ClientManagement-empty-state ClientManagement-enhanced-empty">
                          <div className="ClientManagement-empty-icon">👥</div>
                          <p className="ClientManagement-text-muted">No project managers assigned</p>
                          <button className="ClientManagement-btn-assign-manager">Assign Manager</button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {viewDialog.client.services && viewDialog.client.services.length > 0 && (
                  <div className="ClientManagement-client-details-section ClientManagement-services-section">
                    <h4 className="ClientManagement-section-header">
                      <FiTrendingUp className="ClientManagement-section-icon" />
                      Services & Tasks
                    </h4>
                    
                    <p className="ClientManagement-section-description ClientManagement-services-description">
                      <span className="ClientManagement-description-icon">📋</span>
                      Add tasks with due dates and assign them to project managers
                    </p>
                    
                    <div className="ClientManagement-services-container">
                      {viewDialog.client.services.map((service, index) => {
                        const clientProjectManagers = getProjectManagersDetails(viewDialog.client);
                        return (
                          <div key={index} className="ClientManagement-service-card-wrapper">
                            <div className="ClientManagement-service-card-header">
                              <span className="ClientManagement-service-icon">📊</span>
                              <h5 className="ClientManagement-service-title">{service}</h5>
                            </div>
                            <div className="ClientManagement-service-card-body">
                              <ServiceProgressCard
                                service={service}
                                clientId={viewDialog.client._id}
                                clientProjectManagers={clientProjectManagers}
                                onTaskUpdate={handleTaskUpdate}
                                api={tasksApi}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="ClientManagement-client-details-section ClientManagement-additional-info-section">
                  <h4 className="ClientManagement-section-header">
                    <FiMapPin className="ClientManagement-section-icon" />
                    Additional Information
                  </h4>
                  
                  <div className="ClientManagement-details-grid ClientManagement-additional-grid">
                    {viewDialog.client.phone && (
                      <div className="ClientManagement-detail-item ClientManagement-contact-item">
                        <p className="ClientManagement-detail-label">
                          <span className="ClientManagement-contact-icon">📞</span> Phone
                        </p>
                        <p className="ClientManagement-detail-value ClientManagement-contact-value">{viewDialog.client.phone}</p>
                      </div>
                    )}
                    
                    {viewDialog.client.email && (
                      <div className="ClientManagement-detail-item ClientManagement-contact-item">
                        <p className="ClientManagement-detail-label">
                          <span className="ClientManagement-contact-icon">✉️</span> Email
                        </p>
                        <p className="ClientManagement-detail-value ClientManagement-contact-value ClientManagement-email-value">{viewDialog.client.email}</p>
                      </div>
                    )}
                    
                    {viewDialog.client.address && (
                      <div className="ClientManagement-detail-item ClientManagement-address-item">
                        <p className="ClientManagement-detail-label">
                          <span className="ClientManagement-contact-icon">📍</span> Address
                        </p>
                        <p className="ClientManagement-detail-value ClientManagement-address-text">{viewDialog.client.address}</p>
                      </div>
                    )}
                    
                    {viewDialog.client.description && (
                      <div className="ClientManagement-detail-item ClientManagement-detail-item-full ClientManagement-description-item">
                        <p className="ClientManagement-detail-label">
                          <span className="ClientManagement-contact-icon">📝</span> Description
                        </p>
                        <p className="ClientManagement-detail-value ClientManagement-description-text">{viewDialog.client.description}</p>
                      </div>
                    )}
                    
                    {viewDialog.client.notes && (
                      <div className="ClientManagement-detail-item ClientManagement-detail-item-full ClientManagement-notes-item">
                        <p className="ClientManagement-detail-label">
                          <span className="ClientManagement-contact-icon">📌</span> Notes
                        </p>
                        <p className="ClientManagement-detail-value ClientManagement-notes-text">{viewDialog.client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ClientManagement-modal__footer ClientManagement-view-modal-footer">
              <button className="ClientManagement-btn ClientManagement-btn--outlined ClientManagement-view-modal-close-btn" onClick={() => setViewDialog({ open: false, client: null })}>
                <span className="ClientManagement-close-icon">✕</span> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editDialog.open && editDialog.client && (
        <div className="ClientManagement-modal-overlay" onClick={() => setEditDialog({ open: false, client: null })}>
          <div className="ClientManagement-modal ClientManagement-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="ClientManagement-modal__header">
              <h3>Edit Client</h3>
              <button 
                type="button"
                className="ClientManagement-action-button" 
                onClick={() => setEditDialog({ open: false, client: null })}
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEditSave();
            }}>
              <div className="ClientManagement-modal__content">
                <div className="ClientManagement-edit-client-grid">
                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Client Name *</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.client}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, client: e.target.value }
                      })}
                      required
                    />
                  </div>
                  
                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Company *</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.company}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, company: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">City *</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.city}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, city: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Status</label>
                    <select
                      className="ClientManagement-form-input"
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

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">
                      <FiCalendar className="ClientManagement-icon-inline" /> Subscription Start Date
                    </label>
                    <input
                      type="date"
                      className="ClientManagement-form-input"
                      value={editDialog.client.subscriptionStartDate || ''}
                      onChange={(e) => {
                        setEditDialog({
                          ...editDialog,
                          client: { 
                            ...editDialog.client, 
                            subscriptionStartDate: e.target.value
                          }
                        });
                      }}
                    />
                    <small className="ClientManagement-text-muted">Select start date</small>
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">
                      <FiCalendar className="ClientManagement-icon-inline" /> Subscription End Date
                    </label>
                    <input
                      type="date"
                      className="ClientManagement-form-input"
                      value={editDialog.client.subscriptionEndDate || ''}
                      onChange={(e) => {
                        setEditDialog({
                          ...editDialog,
                          client: { 
                            ...editDialog.client, 
                            subscriptionEndDate: e.target.value
                          }
                        });
                      }}
                      min={editDialog.client.subscriptionStartDate || undefined}
                    />
                    <small className="ClientManagement-text-muted">Must be after start date</small>
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">
                      <FiDollarSign className="ClientManagement-icon-inline" /> Subscription Price (₹)
                    </label>
                    <input
                      type="number"
                      className="ClientManagement-form-input"
                      placeholder="Enter subscription amount"
                      value={editDialog.client.subscriptionPrice || ''}
                      onChange={(e) => {
                        setEditDialog({
                          ...editDialog,
                          client: { 
                            ...editDialog.client, 
                            subscriptionPrice: e.target.value
                          }
                        });
                      }}
                      step="0.01"
                      min="0"
                    />
                    <small className="ClientManagement-text-muted">Enter the subscription amount</small>
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-managers-group">
                    <label className="ClientManagement-form-label">Team *</label>
                    <div className="ClientManagement-managers-list">
                      {safeMapProjectManagers((manager) => {
                        const isSelected = editDialog.client.projectManagers?.some(pm => 
                          pm._id === manager._id || pm.id === manager._id || pm.name === manager.name
                        ) || false;
                        
                        return (
                          <div key={manager._id} className="ClientManagement-manager-checkbox-item">
                            <input
                              type="checkbox"
                              id={`edit-manager-${manager._id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setEditDialog({
                                  ...editDialog,
                                  client: {
                                    ...editDialog.client,
                                    projectManagers: isChecked
                                      ? [...(editDialog.client.projectManagers || []), {
                                          _id: manager._id,
                                          name: manager.name,
                                          email: manager.email,
                                          role: manager.role
                                        }]
                                      : (editDialog.client.projectManagers || []).filter(pm => 
                                          pm._id !== manager._id && pm.id !== manager._id && pm.name !== manager.name
                                        )
                                  }
                                });
                              }}
                            />
                            <div className="ClientManagement-manager-checkbox-content">
                              <div className="ClientManagement-avatar ClientManagement-avatar--primary">
                                {manager.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="ClientManagement-font-bold">{manager.name}</p>
                                <small className="ClientManagement-text-muted">{manager.email}</small>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {editDialog.client.projectManagers && editDialog.client.projectManagers.length > 0 && (
                      <div className="ClientManagement-selected-items-preview ClientManagement-mt-2">
                        <small className="ClientManagement-text-muted">Selected Team Members:</small>
                        <div className="ClientManagement-flex ClientManagement-flex-wrap ClientManagement-gap-1 ClientManagement-mt-1">
                          {editDialog.client.projectManagers.map((pm, idx) => (
                            <div key={idx} className="ClientManagement-selected-item ClientManagement-selected-item--primary">
                              <span>{pm.name}</span>
                              <button
                                type="button"
                                className="ClientManagement-selected-item-remove"
                                onClick={() => {
                                  setEditDialog({
                                    ...editDialog,
                                    client: {
                                      ...editDialog.client,
                                      projectManagers: editDialog.client.projectManagers.filter(p => p.name !== pm.name)
                                    }
                                  });
                                }}
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-services-group">
                    <label className="ClientManagement-form-label">Services</label>
                    <div className="ClientManagement-services-list">
                      {services.map((service) => (
                        <div key={service._id} className="ClientManagement-service-checkbox-item">
                          <input
                            type="checkbox"
                            id={`edit-service-${service._id}`}
                            checked={(editDialog.client.services || []).includes(service.servicename)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
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
                          <label htmlFor={`edit-service-${service._id}`}>{service.servicename}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-progress-group">
                    <label className="ClientManagement-form-label">Progress</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.progress || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, progress: e.target.value }
                      })}
                      placeholder="28/40 (70%)"
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Email</label>
                    <input
                      type="email"
                      className="ClientManagement-form-input"
                      value={editDialog.client.email || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, email: e.target.value }
                      })}
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Phone</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.phone || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, phone: e.target.value }
                      })}
                    />
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-address-group">
                    <label className="ClientManagement-form-label">Address</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.address || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, address: e.target.value }
                      })}
                    />
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-description-group">
                    <label className="ClientManagement-form-label">Description</label>
                    <textarea
                      className="ClientManagement-form-input"
                      rows="3"
                      value={editDialog.client.description || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, description: e.target.value }
                      })}
                      placeholder="Enter client description..."
                    />
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-notes-group">
                    <label className="ClientManagement-form-label">Notes</label>
                    <textarea
                      className="ClientManagement-form-input"
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
              <div className="ClientManagement-modal__footer">
                <button 
                  type="button"
                  className="ClientManagement-btn ClientManagement-btn--outlined" 
                  onClick={() => setEditDialog({ open: false, client: null })}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  disabled={!editDialog.client?.client || !editDialog.client?.company || !editDialog.client?.city || !editDialog.client?.projectManagers?.length}
                >
                  <FiSave /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PaymentReceiptsModal 
        open={paymentReceiptsModal.open}
        onClose={() => setPaymentReceiptsModal({ open: false, client: null })}
        client={paymentReceiptsModal.client}
        onRenewSubscription={fetchData}
        userRole={userRole}
      />
    </div>
  );
};

export default ClientManagement;