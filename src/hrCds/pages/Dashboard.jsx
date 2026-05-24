import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './Dashboard.css';

// Icons
import {
  FiBriefcase,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiInfo,
  FiStar,
  FiBarChart2,
  FiFolder,
  FiArrowUp,
  FiArrowDown,
  FiLogOut,
  FiMenu,
  FiBell,
  FiUser
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

// ========== HELPER FUNCTIONS ==========
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

// ========== MAIN DASHBOARD COMPONENT ==========
const Dashboard = () => {
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    companyCode: '',
    companyIdentifier: ''
  });
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

    for (const service of servicesList) {
      const tasks = await fetchServiceTasks(clientId, service);
      const completed = tasks.filter(t => t.completed).length;
      const total = tasks.length;
      const overdue = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < new Date();
      }).length;
      
      totalTasks += total;
      completedTasks += completed;
      overdueTasks += overdue;
    }

    if (isMounted.current) {
      setOverallStats({
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks
      });
      
      const weeklyData = Array(7).fill(0).map(() => Math.floor(Math.random() * (completedTasks / 4) + 1));
      setChartData({
        ...chartData,
        datasets: [{ ...chartData.datasets[0], data: weeklyData }]
      });
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

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 11 }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e2e8f0'
        }
      },
      x: {
        grid: {
          display: false
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

      {/* Three Column Layout - Client Info, Quick Overview, Weekly Progress */}
      <div className="ClientDashboard-three-column">
        {/* Column 1 - Client Information */}
        <div className="ClientDashboard-client-info-column">
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
        </div>

        {/* Column 2 - Quick Overview */}
        <div className="ClientDashboard-overview-column">
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
                  <FiCheckCircle className="ClientDashboard-overview-icon" />
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
        </div>

        {/* Column 3 - Weekly Progress Chart */}
        <div className="ClientDashboard-chart-column">
          <div className="ClientDashboard-chart-card">
            <div className="ClientDashboard-card-header">
              <h3>Weekly Progress</h3>
              <FiTrendingUp className="ClientDashboard-card-header-icon" />
            </div>
            <div className="ClientDashboard-chart-container">
              <Line data={chartData} options={lineOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;