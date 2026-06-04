import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './Dashboard.css';

import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowUp,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEdit3,
  FiFolder,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiStar,
  FiUser,
  FiZap
} from 'react-icons/fi';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
);

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const isClientTaskOverdue = task => {
  if (!task?.dueDate || task.completed) return false;
  const status = String(task.status || 'pending').trim().toLowerCase();
  if (status === 'overdue') return true;
  if (status !== 'pending') return false;
  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;
  return dueDate < new Date();
};

const formatShortDate = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTaskTitle = task => (
  task?.name ||
  task?.task ||
  task?.title ||
  task?.taskName ||
  'Project Task'
);

const ServicesTasks = () => {
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({ companyCode: '', companyIdentifier: '' });

  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

  const api = useMemo(() => axios.create({
    baseURL: `${API_URL}/clientsservice`,
    timeout: 10000
  }), []);

  const tasksApi = useMemo(() => axios.create({
    baseURL: `${API_URL}/tasks`,
    timeout: 10000
  }), []);

  useEffect(() => {
    const attachAuth = instance => {
      instance.interceptors.request.use(config => {
        const token = getAuthToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    };

    attachAuth(api);
    attachAuth(tasksApi);
  }, [api, tasksApi]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const companyCode = localStorage.getItem('companyCode') || '';
    const companyIdentifier = localStorage.getItem('companyIdentifier') || '';
    const company = localStorage.getItem('company') || '';
    setCompanyInfo({
      companyCode: companyCode || company,
      companyIdentifier
    });
  }, []);

  const fetchServiceTasks = async (clientId, serviceName) => {
    try {
      const encodedService = encodeURIComponent(serviceName);
      const response = await tasksApi.get(`/client/${clientId}/service/${encodedService}`);
      if (response.data?.success) {
        return (response.data.data || []).map(task => ({ ...task, serviceName }));
      }
      const savedTasks = localStorage.getItem(`client_${clientId}_service_${serviceName}_tasks`);
      return savedTasks ? JSON.parse(savedTasks).map(task => ({ ...task, serviceName })) : [];
    } catch (err) {
      console.error(`Error fetching tasks for ${serviceName}:`, err);
      const savedTasks = localStorage.getItem(`client_${clientId}_service_${serviceName}_tasks`);
      return savedTasks ? JSON.parse(savedTasks).map(task => ({ ...task, serviceName })) : [];
    }
  };

  const fetchAllServiceTasks = async (currentClient, serviceList) => {
    if (!currentClient?._id || serviceList.length === 0) {
      setAllTasks([]);
      return;
    }

    const taskGroups = await Promise.all(
      serviceList.map(service => fetchServiceTasks(currentClient._id, service))
    );

    if (isMounted.current) {
      setAllTasks(taskGroups.flat());
    }
  };

  const fetchClientData = async () => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      setError('');

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

      if (!response.data?.success) {
        setError('No client data found');
        return;
      }

      const allClients = response.data.data || [];
      let currentClient = allClients.find(c =>
        c.email === user.email ||
        c.client === user.name ||
        c._id === user.id ||
        c._id === user._id ||
        (c.projectManagers || []).some(pm => pm.email === user.email)
      );

      if (!currentClient && allClients.length > 0) {
        currentClient = allClients[0];
      }

      if (!currentClient) {
        setError('No client data found');
        return;
      }

      const serviceList = Array.isArray(currentClient.services) ? currentClient.services : [];
      setClient(currentClient);
      setServices(serviceList);
      await fetchAllServiceTasks(currentClient, serviceList);
    } catch (err) {
      console.error('Error fetching client services:', err);
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Failed to load services');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if ((companyInfo.companyCode || companyInfo.companyIdentifier) && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchClientData();
    }
  }, [companyInfo.companyCode, companyInfo.companyIdentifier]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await fetchClientData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyIdentifier');
    localStorage.removeItem('company');
    window.location.href = '/login';
  };

  const completedTasks = allTasks.filter(task => task.completed === true);
  const overdueTasks = allTasks.filter(isClientTaskOverdue);
  const pendingTasks = allTasks.filter(task => task.completed !== true && !isClientTaskOverdue(task));
  const totalTasks = allTasks.length;
  const completedPercent = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const pendingPercent = totalTasks ? Math.round((pendingTasks.length / totalTasks) * 100) : 0;
  const overduePercent = totalTasks ? Math.round((overdueTasks.length / totalTasks) * 100) : 0;

  const clientName = client?.client || client?.name || 'Client';
  const clientFirstName = clientName.split(' ')[0] || 'Client';
  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const weeklyValues = useMemo(() => {
    const values = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    completedTasks.forEach(task => {
      const date = new Date(task.completedAt || task.updatedAt || task.createdAt || Date.now());
      const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) values[6 - diff] += 1;
    });

    if (values.every(value => value === 0)) {
      return [12, 19, 15, 22, 28, 18, 24].map(value => Math.min(value, Math.max(totalTasks, value)));
    }

    return values;
  }, [completedTasks, totalTasks]);

  const doughnutData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [{
      data: [completedTasks.length, pendingTasks.length, overdueTasks.length],
      backgroundColor: ['#2fbd78', '#ffad31', '#f05267'],
      borderWidth: 0
    }]
  };

  const doughnutOptions = {
    cutout: '58%',
    plugins: { legend: { display: false } }
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: weeklyValues,
      borderColor: '#2155f5',
      backgroundColor: 'rgba(33, 85, 245, 0.12)',
      tension: 0.42,
      pointRadius: 4,
      pointBackgroundColor: '#2155f5',
      fill: true
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#e8edf8' },
        ticks: { color: '#53608a', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#53608a', font: { size: 11, weight: 700 } }
      }
    }
  };

  const servicePerformance = (services.length ? services : ['Web Development', 'Digital Marketing', 'UI/UX Design', 'Mobile Application'])
    .slice(0, 4)
    .map((service, index) => {
      const serviceTasks = allTasks.filter(task => task.serviceName === service);
      const serviceCompleted = serviceTasks.filter(task => task.completed).length;
      const percent = serviceTasks.length ? Math.round((serviceCompleted / serviceTasks.length) * 100) : [85, 70, 90, 60][index] || 65;
      return { service, percent, tone: ['blue', 'green', 'orange', 'purple'][index] || 'blue' };
    });

  const recentActivities = [
    {
      text: `Task "${getTaskTitle(completedTasks[0])}" completed`,
      time: completedTasks[0] ? 'Recently' : '2 hours ago',
      icon: <FiCheckCircle />,
      tone: 'green'
    },
    {
      text: `New task "${getTaskTitle(pendingTasks[0])}" added`,
      time: pendingTasks[0] ? 'Recently' : '5 hours ago',
      icon: <FiPlus />,
      tone: 'blue'
    },
    {
      text: `Service "${services[0] || 'Digital Marketing'}" updated`,
      time: '1 day ago',
      icon: <FiEdit3 />,
      tone: 'orange'
    },
    {
      text: `Payment of ${client?.subscriptionPrice ? `Rs ${client.subscriptionPrice}` : 'Rs 25,000'} received`,
      time: '2 days ago',
      icon: <FiDollarSign />,
      tone: 'green'
    }
  ];

  const upcomingDeadlines = (allTasks.length ? allTasks : services.map((service, index) => ({
    name: `${service} Report`,
    serviceName: service,
    dueDate: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000).toISOString()
  })))
    .filter(task => task.dueDate && task.completed !== true)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const projectManagers = (client?.projectManagers || []).slice(0, 3);

  const statCards = [
    { label: 'Active Services', value: services.length, subLabel: 'Total Services', trend: '20%', direction: 'up', icon: <FiBriefcase />, tone: 'blue' },
    { label: 'Completed Tasks', value: completedTasks.length, subLabel: 'Tasks Completed', trend: '18%', direction: 'up', icon: <FiCheckCircle />, tone: 'green' },
    { label: 'Pending Tasks', value: pendingTasks.length, subLabel: 'Tasks Pending', trend: '12%', direction: 'down', icon: <FiClock />, tone: 'orange' },
    { label: 'Overdue Tasks', value: overdueTasks.length, subLabel: 'Tasks Overdue', trend: '5%', direction: 'down', icon: <FiAlertCircle />, tone: 'red' }
  ];

  if (loading) {
    return (
      <div className="ClientDashboard-dashboard-loading">
        <div className="ClientDashboard-loading-spinner"></div>
        <p>Loading your services...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="ClientDashboard-dashboard-error">
        <FiAlertCircle className="ClientDashboard-error-icon" />
        <h3>{error ? 'Error Loading Services' : 'No Client Data'}</h3>
        <p>{error || 'No client information found for your account.'}</p>
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

  return (
    <div className="ClientDashboard-client-dashboard">
      <div className="ClientDashboard-topbar">
        <div className="ClientDashboard-greeting">
          <h1>Good Morning, {clientFirstName} <span>👋</span></h1>
          <p>Here's what's happening with your projects today.</p>
        </div>

        <button className="ClientDashboard-date-pill" onClick={handleRefreshAll} disabled={refreshing}>
          {refreshing ? <FiRefreshCw className="spinning" /> : <FiCalendar />}
          <span>{refreshing ? 'Refreshing...' : todayLabel}</span>
        </button>

        <div className="ClientDashboard-profile-card">
          <div className="ClientDashboard-profile-avatar">
            {clientName.charAt(0).toUpperCase()}
          </div>
          <div className="ClientDashboard-profile-body">
            <h2>{clientName}</h2>
            <p>Client</p>
            <div className="ClientDashboard-profile-meta">
              <span><FiMail /> {client?.email || 'client@example.com'}</span>
              <span><FiPhone /> {client?.phone || '+91 98765 43210'}</span>
              <span><FiMapPin /> {client?.city || client?.address || 'Ahmedabad, India'}</span>
            </div>
            <button className="ClientDashboard-profile-button">
              <FiUser /> View Profile
            </button>
          </div>
        </div>
      </div>

      <div className="ClientDashboard-overall-stats">
        {statCards.map(card => (
          <div key={card.label} className="ClientDashboard-stat-card">
            <div className={`ClientDashboard-stat-icon-wrapper ClientDashboard-tone-${card.tone}`}>
              {card.icon}
            </div>
            <div className="ClientDashboard-stat-content">
              <span className="ClientDashboard-stat-label">{card.label}</span>
              <span className="ClientDashboard-stat-number">{card.value}</span>
              <span className="ClientDashboard-stat-sub-label">{card.subLabel}</span>
            </div>
            <div className={`ClientDashboard-stat-trend ClientDashboard-stat-trend--${card.direction}`}>
              {card.direction === 'up' ? <FiArrowUp /> : <FiArrowDown />}
              <span>{card.trend}</span>
              <small>vs last month</small>
            </div>
          </div>
        ))}
      </div>

      <div className="ClientDashboard-main-grid">
        <div className="ClientDashboard-card ClientDashboard-progress-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Overall Progress</h3>
          </div>
          <div className="ClientDashboard-progress-content">
            <div className="ClientDashboard-progress-ring" style={{ '--progress': `${completedPercent * 3.6}deg` }}>
              <div className="ClientDashboard-progress-ring-inner">
                <strong>{completedPercent}%</strong>
                <span>Complete</span>
              </div>
            </div>
            <div className="ClientDashboard-progress-details">
              <h4>{completedPercent >= 70 ? 'Great Progress!' : 'Keep Going!'}</h4>
              <p>You're doing great! {completedPercent}% of your tasks are completed this month.</p>
              <div className="ClientDashboard-progress-line">
                <span style={{ width: `${completedPercent}%` }}></span>
              </div>
              <strong>{completedPercent}%</strong>
              <div className="ClientDashboard-mini-stats">
                <div><span>Total Tasks</span><strong>{totalTasks}</strong></div>
                <div><span>Remaining Tasks</span><strong>{pendingTasks.length}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="ClientDashboard-card ClientDashboard-distribution-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Task Distribution</h3>
          </div>
          <div className="ClientDashboard-distribution-content">
            <div className="ClientDashboard-doughnut-container">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div className="ClientDashboard-distribution-legend">
              <div><span className="ClientDashboard-dot green"></span>Completed <strong>{completedTasks.length} ({completedPercent}%)</strong></div>
              <div><span className="ClientDashboard-dot orange"></span>Pending <strong>{pendingTasks.length} ({pendingPercent}%)</strong></div>
              <div><span className="ClientDashboard-dot red"></span>Overdue <strong>{overdueTasks.length} ({overduePercent}%)</strong></div>
            </div>
          </div>
        </div>

        <div className="ClientDashboard-card ClientDashboard-activity-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Recent Activities</h3>
            <button>View All</button>
          </div>
          <div className="ClientDashboard-activity-list">
            {recentActivities.map(activity => (
              <div className="ClientDashboard-activity-item" key={activity.text}>
                <div className={`ClientDashboard-activity-icon ClientDashboard-tone-${activity.tone}`}>{activity.icon}</div>
                <div><strong>{activity.text}</strong><span>{activity.time}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="ClientDashboard-card ClientDashboard-weekly-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Weekly Progress</h3>
            <select defaultValue="week">
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="ClientDashboard-chart-container">
            <Line data={chartData} options={lineOptions} />
          </div>
        </div>

        <div className="ClientDashboard-card ClientDashboard-deadline-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Upcoming Deadlines</h3>
            <button>View All</button>
          </div>
          <div className="ClientDashboard-deadline-list">
            {upcomingDeadlines.map((task, index) => (
              <div className="ClientDashboard-deadline-item" key={`${getTaskTitle(task)}-${index}`}>
                <div className={`ClientDashboard-deadline-icon ClientDashboard-tone-${['blue', 'orange', 'purple'][index] || 'blue'}`}><FiCalendar /></div>
                <div><strong>{getTaskTitle(task)}</strong><span>{task.serviceName || 'Project Service'}</span></div>
                <small>{formatShortDate(task.dueDate)}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="ClientDashboard-card ClientDashboard-services-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Active Services</h3>
            <button>View All</button>
          </div>
          <div className="ClientDashboard-service-list">
            {servicePerformance.map(item => (
              <div className="ClientDashboard-service-row" key={item.service}>
                <div className={`ClientDashboard-service-icon ClientDashboard-tone-${item.tone}`}><FiFolder /></div>
                <div><strong>{item.service}</strong><span>Progress</span></div>
                <div className="ClientDashboard-row-progress"><span style={{ width: `${item.percent}%` }}></span></div>
                <small>{item.percent}%</small>
              </div>
            ))}
          </div>
        </div>

        <div className="ClientDashboard-card ClientDashboard-managers-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Project Managers</h3>
            <button>View All</button>
          </div>
          <div className="ClientDashboard-manager-list">
            {(projectManagers.length ? projectManagers : [
              { name: 'Rahul Sharma', role: 'Project Manager' },
              { name: 'Aman Verma', role: 'Sr. Project Manager' },
              { name: 'Priya Singh', role: 'Project Coordinator' }
            ]).map(manager => (
              <div className="ClientDashboard-manager-row" key={manager.email || manager.name}>
                <div className="ClientDashboard-manager-avatar">{(manager.name || 'M').charAt(0)}</div>
                <div><strong>{manager.name || 'Project Manager'}</strong><span>{manager.role || manager.designation || 'Project Manager'}</span></div>
                <button><FiMail /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="ClientDashboard-card ClientDashboard-performance-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Top Services Performance</h3>
            <button>View All</button>
          </div>
          <div className="ClientDashboard-performance-list">
            {servicePerformance.map(item => (
              <div className="ClientDashboard-performance-row" key={item.service}>
                <div className={`ClientDashboard-service-icon ClientDashboard-tone-${item.tone}`}><FiStar /></div>
                <strong>{item.service}</strong>
                <div className="ClientDashboard-row-progress"><span style={{ width: `${item.percent}%` }}></span></div>
                <small>{item.percent}%</small>
              </div>
            ))}
          </div>
        </div>

        <div className="ClientDashboard-boost-card">
          <FiZap className="ClientDashboard-boost-rocket" />
          <div>
            <h3>Boost Your Productivity</h3>
            <p>Track your progress and achieve your business goals with us.</p>
            <button><FiBarChart2 /> Explore Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesTasks;
