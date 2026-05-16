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
  FiRefreshCw,
  FiUser,
  FiInfo,
  FiStar,
  FiBarChart2,
  FiFolder,
  FiPlayCircle,
  FiCheckSquare,
  FiList,
  FiMenu,
  FiLogOut,
  FiBell,
  FiSearch,
  FiSettings,
  FiHelpCircle,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiEyeOff,
  FiThumbsUp,
  FiHeart,
  FiShare2,
  FiMoreVertical,
  FiUpload,
  FiDollarSign,
  FiCreditCard,
  FiFileText
} from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// ========== HELPER FUNCTION FOR AUTH TOKEN ==========
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

// ========== HELPER FUNCTION TO GET LATEST SUBSCRIPTION ==========
const getLatestSubscription = (client) => {
  if (!client || !client.subscription || client.subscription.length === 0) {
    return null;
  }
  // Get the last subscription in the array
  return client.subscription[client.subscription.length - 1];
};

// ========== HELPER FUNCTION TO CHECK IF SUBSCRIPTION IS EXPIRED ==========
const isSubscriptionExpired = (subscription) => {
  if (!subscription || !subscription.endDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(subscription.endDate);
  endDate.setHours(0, 0, 0, 0);
  return endDate < today;
};

// ========== HELPER FUNCTION TO FORMAT DATE ==========
const formatSubscriptionDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ========== HELPER FUNCTION TO GET DAYS REMAINING ==========
const getDaysRemaining = (subscription) => {
  if (!subscription || !subscription.endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(subscription.endDate);
  endDate.setHours(0, 0, 0, 0);
  
  if (endDate < today) return null;
  
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// ========== SUBSCRIPTION STATUS BADGE COMPONENT ==========
const SubscriptionStatusBadge = ({ subscription }) => {
  const expired = isSubscriptionExpired(subscription);
  const daysRemaining = getDaysRemaining(subscription);
  
  if (!subscription) {
    return (
      <div className="ClientDashboard-subscription-badge ClientDashboard-subscription-badge--none">
        <FiAlertCircle size={14} />
        <span>No Subscription</span>
      </div>
    );
  }
  
  if (expired) {
    return (
      <div className="ClientDashboard-subscription-badge ClientDashboard-subscription-badge--expired">
        <FiAlertCircle size={14} />
        <span>Expired</span>
      </div>
    );
  }
  
  return (
    <div className="ClientDashboard-subscription-badge ClientDashboard-subscription-badge--active">
      <FiCheckCircle size={14} />
      <span>Active</span>
      {daysRemaining !== null && daysRemaining <= 7 && (
        <span className="ClientDashboard-subscription-warning">
          ({daysRemaining} days left)
        </span>
      )}
    </div>
  );
};

// ========== ANIMATED PROGRESS RING COMPONENT ==========
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

// ========== SERVICE PROGRESS CARD COMPONENT ==========
const ServiceProgressCard = ({ service, clientId, api }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [hoveredTask, setHoveredTask] = useState(null);

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

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#94a3b8';
    }
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

// ========== SUBSCRIPTION RENEWAL COMPONENT ==========
const SubscriptionRenewal = ({ clientId, onRenewalSuccess, api }) => {
  const [renewAmount, setRenewAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please upload a valid file (JPEG, PNG, or PDF)' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size should be less than 5MB' });
        return;
      }
      
      setReceiptFile(file);
      setMessage({ type: '', text: '' });
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleReceiptUpload = async () => {
    // Validate fields
    if (!renewAmount || !transactionId || !receiptFile) {
      setMessage({ type: 'error', text: 'Please fill all fields and upload receipt' });
      return;
    }

    if (isNaN(renewAmount) || parseFloat(renewAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setUploadingReceipt(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('amount', renewAmount);
      formData.append('transactionId', transactionId);
      formData.append('receipt', receiptFile);
      formData.append('uploadDate', new Date().toISOString());

      const response = await api.post(`/upload-receipt/${clientId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Receipt uploaded successfully! Owner has been notified.' });
        
        // Reset form
        setRenewAmount('');
        setTransactionId('');
        setReceiptFile(null);
        setPreviewUrl(null);
        
        // Notify parent component
        if (onRenewalSuccess) {
          onRenewalSuccess();
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 5000);
      } else {
        setMessage({ type: 'error', text: response.data?.message || 'Failed to upload receipt' });
      }
    } catch (error) {
      console.error('Error uploading receipt:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload receipt. Please try again.' 
      });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleReset = () => {
    setRenewAmount('');
    setTransactionId('');
    setReceiptFile(null);
    setPreviewUrl(null);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="ClientDashboard-renewal-card">
      <div className="ClientDashboard-card-header">
        <h3>Renew Subscription</h3>
        <FiRefreshCw className="ClientDashboard-card-header-icon" />
      </div>
      
      <div className="ClientDashboard-renewal-content">
        <p className="ClientDashboard-renewal-description">
          Submit your payment details to renew your subscription. Once verified, your subscription will be extended.
        </p>
        
        {message.text && (
          <div className={`ClientDashboard-renewal-message ClientDashboard-renewal-message--${message.type}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message.text}</span>
          </div>
        )}
        
        <div className="ClientDashboard-renewal-form">
          <div className="ClientDashboard-form-group">
            <label className="ClientDashboard-form-label">
              <FiDollarSign className="ClientDashboard-form-icon" />
              Amount (₹)
            </label>
            <input
              type="number"
              className="ClientDashboard-form-input"
              placeholder="Enter amount"
              value={renewAmount}
              onChange={(e) => setRenewAmount(e.target.value)}
              disabled={uploadingReceipt}
            />
          </div>
          
          <div className="ClientDashboard-form-group">
            <label className="ClientDashboard-form-label">
              <FiCreditCard className="ClientDashboard-form-icon" />
              Transaction ID
            </label>
            <input
              type="text"
              className="ClientDashboard-form-input"
              placeholder="Enter transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={uploadingReceipt}
            />
          </div>
          
          <div className="ClientDashboard-form-group">
            <label className="ClientDashboard-form-label">
              <FiUpload className="ClientDashboard-form-icon" />
              Upload Receipt
            </label>
            <div className="ClientDashboard-file-upload-area">
              <input
                type="file"
                id="receipt-upload"
                className="ClientDashboard-file-input"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                disabled={uploadingReceipt}
              />
              <label htmlFor="receipt-upload" className="ClientDashboard-file-upload-label">
                {receiptFile ? (
                  <>
                    <FiFileText />
                    <span>{receiptFile.name}</span>
                    <button 
                      className="ClientDashboard-file-clear"
                      onClick={(e) => {
                        e.preventDefault();
                        setReceiptFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <FiUpload />
                    <span>Click or drag to upload receipt</span>
                    <small>JPEG, PNG, or PDF (Max 5MB)</small>
                  </>
                )}
              </label>
            </div>
            
            {previewUrl && (
              <div className="ClientDashboard-file-preview">
                <img src={previewUrl} alt="Receipt Preview" />
              </div>
            )}
          </div>
          
          <div className="ClientDashboard-renewal-actions">
            <button 
              className="ClientDashboard-btn ClientDashboard-btn--outlined"
              onClick={handleReset}
              disabled={uploadingReceipt}
            >
              Reset
            </button>
            <button 
              className="ClientDashboard-btn ClientDashboard-btn--primary"
              onClick={handleReceiptUpload}
              disabled={uploadingReceipt}
            >
              {uploadingReceipt ? (
                <>
                  <div className="ClientDashboard-spinner-small"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload />
                  Submit Renewal
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="ClientDashboard-renewal-info">
          <FiInfo size={14} />
          <small>
            Your payment will be verified by the owner. You'll receive a confirmation once approved.
          </small>
        </div>
      </div>
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications] = useState([
    { id: 1, message: 'New task assigned to you', time: '5 min ago', read: false },
    { id: 2, message: 'Project milestone achieved', time: '1 hour ago', read: false },
    { id: 3, message: 'Meeting scheduled for tomorrow', time: '3 hours ago', read: true },
  ]);
  const [overallStats, setOverallStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Tasks Completed',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
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

  const usersApi = axios.create({
    baseURL: `${API_URL}/users`,
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
  addAuthInterceptor(usersApi);

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
        } else if (response.data.message?.users && Array.isArray(response.data.message.users)) {
          usersArray = response.data.message.users;
        }
      }
      
      const formattedManagers = usersArray.map(user => ({
        _id: user._id || user.id,
        name: user.name || user.username || 'Unknown',
        email: user.email || '',
        role: user.role || user.jobRole || 'Project Manager',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=fff`
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
        
        await fetchProjectManagers();
        
        if (currentClient && currentClient.services) {
          await fetchAllServicesTasks(currentClient._id, currentClient.services);
        }
      } else {
        setError('No client data found');
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

  const fetchServiceTasks = async (clientId, serviceName) => {
    try {
      const encodedService = encodeURIComponent(serviceName);
      const response = await tasksApi.get(`/client/${clientId}/service/${encodedService}`);
      if (response.data?.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching tasks for service ${serviceName}:`, error);
      return [];
    }
  };

  const fetchAllServicesTasks = async (clientId, servicesList) => {
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    const taskCountsMap = {};

    for (const service of servicesList) {
      const tasks = await fetchServiceTasks(clientId, service);
      const completed = tasks.filter(t => t.completed).length;
      const total = tasks.length;
      const overdue = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < new Date();
      }).length;
      
      taskCountsMap[service] = {
        total,
        completed,
        pending: total - completed,
        overdue
      };
      
      totalTasks += total;
      completedTasks += completed;
      overdueTasks += overdue;
    }

    if (isMounted.current) {
      setTaskCounts(taskCountsMap);
      setOverallStats({
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks
      });
      
      // Update chart data with mock weekly data based on completion rate
      const weeklyData = Array(7).fill(0).map(() => Math.floor(Math.random() * (completedTasks / 4) + 1));
      setChartData({
        ...chartData,
        datasets: [{ ...chartData.datasets[0], data: weeklyData }]
      });
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    if (client && client.services) {
      await fetchAllServicesTasks(client._id, client.services);
    }
    setRefreshing(false);
  };

  const handleRenewalSuccess = () => {
    // Refresh client data to show updated subscription
    fetchClientData();
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

  const getProjectManagersDetails = () => {
    if (!client) return [];
    
    if (client.projectManagers && Array.isArray(client.projectManagers) && client.projectManagers.length > 0) {
      return client.projectManagers;
    }
    
    const managerNames = client.projectManager || [];
    return managerNames.map(name => {
      const manager = projectManagers.find(pm => pm.name === name);
      return manager || { name, _id: `temp-${Date.now()}`, role: 'Project Manager' };
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

  const doughnutData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [overallStats.completedTasks, overallStats.pendingTasks, overallStats.overdueTasks],
        backgroundColor: ['#10b981', '#f97316', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          font: { size: 11 }
        }
      }
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

  const clientManagers = getProjectManagersDetails();
  const latestSubscription = getLatestSubscription(client);
  const subscriptionExpired = isSubscriptionExpired(latestSubscription);
  const daysRemaining = getDaysRemaining(latestSubscription);

  return (
    <div className="ClientDashboard-client-dashboard">
      

      {/* Welcome Header */}
      <div className="ClientDashboard-welcome-header">
        <div>
          <h1>
            Welcome back, {client?.client?.split(' ')[0] || 'Client'}!
            <span className="ClientDashboard-wave">👋</span>
          </h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        </div>

      {/* Overall Stats Section */}
      <div className="ClientDashboard-overall-stats">
        <div className="ClientDashboard-stat-card ClientDashboard-stat-card--blue">
          <div className="ClientDashboard-stat-icon-wrapper">
            <FiBriefcase />
          </div>
          <div className="ClientDashboard-stat-content">
            <span className="ClientDashboard-stat-number">{services.length}</span>
            <span className="ClientDashboard-stat-label">Active Services</span>
          </div>
          <div className="ClientDashboard-stat-trend ClientDashboard-stat-trend--up">
            <FiArrowUp /> +12%
          </div>
        </div>
        
        <div className="ClientDashboard-stat-card ClientDashboard-stat-card--green">
          <div className="ClientDashboard-stat-icon-wrapper">
            <FiCheckCircle />
          </div>
          <div className="ClientDashboard-stat-content">
            <span className="ClientDashboard-stat-number">{overallStats.completedTasks}</span>
            <span className="ClientDashboard-stat-label">Tasks Completed</span>
          </div>
          <div className="ClientDashboard-stat-trend ClientDashboard-stat-trend--up">
            <FiArrowUp /> +8%
          </div>
        </div>
        
        <div className="ClientDashboard-stat-card ClientDashboard-stat-card--orange">
          <div className="ClientDashboard-stat-icon-wrapper">
            <FiClock />
          </div>
          <div className="ClientDashboard-stat-content">
            <span className="ClientDashboard-stat-number">{overallStats.pendingTasks}</span>
            <span className="ClientDashboard-stat-label">In Progress</span>
          </div>
          <div className="ClientDashboard-stat-trend ClientDashboard-stat-trend--down">
            <FiArrowDown /> -3%
          </div>
        </div>
        
        <div className="ClientDashboard-stat-card ClientDashboard-stat-card--red">
          <div className="ClientDashboard-stat-icon-wrapper">
            <FiAlertCircle />
          </div>
          <div className="ClientDashboard-stat-content">
            <span className="ClientDashboard-stat-number">{overallStats.overdueTasks}</span>
            <span className="ClientDashboard-stat-label">Overdue Tasks</span>
          </div>
          <div className="ClientDashboard-stat-trend ClientDashboard-stat-trend--up">
            <FiArrowUp /> +5%
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="ClientDashboard-two-column">
        {/* Left Column - Client Info & Team */}
        <div className="ClientDashboard-left-column">
          {/* Client Information Card */}
          <div className="ClientDashboard-info-card">
            <div className="ClientDashboard-card-header">
              <h3>Client Information</h3>
              <FiInfo className="ClientDashboard-card-header-icon" />
            </div>
            <div className="ClientDashboard-info-grid">
              <div className="ClientDashboard-info-item">
                <label>Client Name</label>
                <p>{client?.client || 'N/A'}</p>
              </div>
              <div className="ClientDashboard-info-item">
                <label>Company</label>
                <p>{client?.company || 'N/A'}</p>
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
                <label>City</label>
                <p>{client?.city || 'N/A'}</p>
              </div>
              <div className="ClientDashboard-info-item">
                <label>Status</label>
                <span className={getStatusColor(client?.status)}>
                  {client?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Details Card */}
          <div className="ClientDashboard-subscription-card">
            <div className="ClientDashboard-card-header">
              <h3>Subscription Details</h3>
              <FiCalendar className="ClientDashboard-card-header-icon" />
            </div>
            
            {latestSubscription ? (
              <div className="ClientDashboard-subscription-content">
                {/* Status Badge */}
                <div className="ClientDashboard-subscription-status-wrapper">
                  <SubscriptionStatusBadge subscription={latestSubscription} />
                </div>
                
                {/* Subscription Dates */}
                <div className="ClientDashboard-subscription-dates">
                  <div className="ClientDashboard-subscription-date-item">
                    <div className="ClientDashboard-date-label">
                      <FiCalendar size={14} />
                      <span>Start Date</span>
                    </div>
                    <p className="ClientDashboard-date-value">
                      {formatSubscriptionDate(latestSubscription.startDate)}
                    </p>
                  </div>
                  
                  <div className="ClientDashboard-subscription-date-item">
                    <div className="ClientDashboard-date-label">
                      <FiCalendar size={14} />
                      <span>End Date</span>
                    </div>
                    <p className={`ClientDashboard-date-value ${subscriptionExpired ? 'ClientDashboard-date-value--expired' : ''}`}>
                      {formatSubscriptionDate(latestSubscription.endDate)}
                    </p>
                  </div>
                </div>
                
                {/* Valid Till / Days Remaining */}
                <div className="ClientDashboard-subscription-validity">
                  {subscriptionExpired ? (
                    <div className="ClientDashboard-validity-expired">
                      <FiAlertCircle size={16} />
                      <span>Subscription has expired. Please renew to continue services.</span>
                    </div>
                  ) : (
                    <div className="ClientDashboard-validity-active">
                      <FiCheckCircle size={16} />
                      <span>
                        Valid till {formatSubscriptionDate(latestSubscription.endDate)}
                        {daysRemaining !== null && (
                          <strong> ({daysRemaining} days remaining)</strong>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Progress Bar for Days Remaining (if active) */}
                {!subscriptionExpired && latestSubscription.startDate && latestSubscription.endDate && (
                  <div className="ClientDashboard-subscription-progress">
                    <div className="ClientDashboard-progress-label">
                      <span>Subscription Period Progress</span>
                      <span>{daysRemaining !== null ? daysRemaining : 0} days left</span>
                    </div>
                    <div className="ClientDashboard-progress-bar">
                      <div 
                        className={`ClientDashboard-progress-bar__fill ${
                          daysRemaining !== null && daysRemaining <= 7 
                            ? 'ClientDashboard-progress-bar__fill--warning'
                            : 'ClientDashboard-progress-bar__fill--success'
                        }`}
                        style={{ 
                          width: `${(() => {
                            if (!latestSubscription.startDate || !latestSubscription.endDate) return 0;
                            const start = new Date(latestSubscription.startDate);
                            const end = new Date(latestSubscription.endDate);
                            const today = new Date();
                            const total = end - start;
                            const elapsed = today - start;
                            const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
                            return percentage;
                          })()}%` 
                        }}
                      >
                        <div className="ClientDashboard-progress-glow"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ClientDashboard-subscription-empty">
                <FiAlertCircle size={32} />
                <p>No subscription information available</p>
                <small>Please contact your administrator for subscription details</small>
              </div>
            )}
          </div>

<<<<<<< HEAD
=======
          {/* Subscription Renewal Card */}
          <SubscriptionRenewal 
            clientId={client._id}
            onRenewalSuccess={handleRenewalSuccess}
            api={api}
          />

>>>>>>> e1d0cb8c01ff454da64890ba6d1dc0b10d490ea6
          {/* Project Team Section */}
          {clientManagers.length > 0 && (
            <div className="ClientDashboard-team-card">
              <div className="ClientDashboard-card-header">
                <h3>Project Team</h3>
                <FiUsers className="ClientDashboard-card-header-icon" />
              </div>
              <div className="ClientDashboard-team-list">
                {clientManagers.map((manager, index) => (
                  <div key={index} className="ClientDashboard-team-member">
                    <img 
                      src={manager.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name)}&background=3b82f6&color=fff`}
                      alt={manager.name}
                      className="ClientDashboard-member-avatar"
                    />
                    <div className="ClientDashboard-member-info">
                      <h4>{manager.name}</h4>
                      <p>{manager.role || 'Project Manager'}</p>
                      {manager.email && <span>{manager.email}</span>}
                    </div>
                    <button className="ClientDashboard-member-action">
                      <FiMail size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Overview */}
        <div className="ClientDashboard-right-column">
          <div className="ClientDashboard-overview-card">
            <div className="ClientDashboard-card-header">
              <h3>Quick Overview</h3>
              <FiBarChart2 className="ClientDashboard-card-header-icon" />
            </div>
            <div className="ClientDashboard-overview-stats">
              <div className="ClientDashboard-overview-item">
                <div className="ClientDashboard-overview-label">
                  <FiStar className="ClientDashboard-overview-icon" />
                  <span>Overall Progress</span>
                </div>
                <div className="ClientDashboard-overview-progress">
                  <div className="ClientDashboard-progress-bar">
                    <div 
                      className="ClientDashboard-progress-bar__fill"
                      style={{ width: `${overallStats.totalTasks ? Math.round((overallStats.completedTasks / overallStats.totalTasks) * 100) : 0}%` }}
                    >
                      <div className="ClientDashboard-progress-glow"></div>
                    </div>
                  </div>
                  <span className="ClientDashboard-overview-percentage">
                    {overallStats.totalTasks ? Math.round((overallStats.completedTasks / overallStats.totalTasks) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="ClientDashboard-overview-divider"></div>
              
              <div className="ClientDashboard-overview-item">
                <div className="ClientDashboard-overview-label">
                  <FiCheckSquare className="ClientDashboard-overview-icon" />
                  <span>Completion Rate</span>
                </div>
                <div className="ClientDashboard-overview-value">
                  <span className="ClientDashboard-value-large">
                    {overallStats.totalTasks ? Math.round((overallStats.completedTasks / overallStats.totalTasks) * 100) : 0}%
                  </span>
                  <span className="ClientDashboard-value-small">of tasks done</span>
                </div>
              </div>

              <div className="ClientDashboard-overview-divider"></div>

              <div className="ClientDashboard-task-distribution">
                <h4>Task Distribution</h4>
                <div className="ClientDashboard-doughnut-container">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="ClientDashboard-chart-card">
            <div className="ClientDashboard-card-header">
              <h3>Weekly Progress</h3>
              <FiTrendingUp className="ClientDashboard-card-header-icon" />
            </div>
            <div className="ClientDashboard-chart-container">
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Services & Tasks Section */}
      <div className="ClientDashboard-projects-section">
        <div className="ClientDashboard-section-header">
          <div>
            <h3>Services & Tasks</h3>
            <p>Track your progress across all services</p>
          </div>
          <div className="ClientDashboard-section-actions">
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
    </div>
  );
};

export default ClientDashboard;