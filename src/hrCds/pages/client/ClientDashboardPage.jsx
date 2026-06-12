import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../../../config';
import {
  calculatePaymentSummary,
  calculateTaskStats,
  formatDate,
  formatMoney,
  getTaskTitle
} from '../../utils/clientPortalData';
import './ClientDashboardPage.css';

// Icons
import {
  FiBriefcase,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiChevronRight,
  FiFolder,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiStar,
  FiHeadphones,
  FiFileText,
  FiDollarSign,
  FiUpload,
  FiCreditCard,
  FiGrid,
  FiArrowUp,
  FiArrowDown,
  FiUser,
  FiUsers,
  FiMoreHorizontal,
  FiPackage,
  FiInbox
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

const getPersonName = person => {
  if (!person) return '';
  if (typeof person === 'string') return person;
  return person.name || person.fullName || person.employeeName || person.username || person.email || '';
};

const getPersonEmail = person => (
  typeof person === 'object' && person
    ? person.email || person.employeeEmail || person.userEmail || ''
    : ''
);

const getPersonRole = person => (
  typeof person === 'object' && person
    ? person.role || person.designation || person.position || person.employeeRole || 'Project Team'
    : 'Project Team'
);

const normalizeMatchValue = value => String(value || '').trim().toLowerCase();

const normalizePhoneValue = value => String(value || '').replace(/\D/g, '');

const getIdValues = value => {
  if (!value) return [];
  if (typeof value === 'object') {
    return [
      value._id,
      value.id,
      value.userId,
      value.clientId,
      value.clientUserId
    ].map(normalizeMatchValue).filter(Boolean);
  }
  return [normalizeMatchValue(value)].filter(Boolean);
};

const getClientMatchValues = client => ({
  ids: [
    ...getIdValues(client?._id),
    ...getIdValues(client?.id),
    ...getIdValues(client?.userId),
    ...getIdValues(client?.clientId),
    ...getIdValues(client?.clientUserId),
    ...getIdValues(client?.user),
    ...getIdValues(client?.clientUser)
  ],
  emails: [
    client?.email,
    client?.clientEmail,
    client?.userEmail,
    client?.contactEmail,
    client?.companyEmail,
    client?.user?.email,
    client?.clientUser?.email
  ].map(normalizeMatchValue).filter(Boolean),
  names: [
    client?.client,
    client?.name,
    client?.clientName,
    client?.fullName,
    client?.company,
    client?.companyName,
    client?.contactName,
    client?.username,
    client?.user?.name,
    client?.user?.fullName,
    client?.clientUser?.name
  ].map(normalizeMatchValue).filter(Boolean),
  phones: [
    client?.phone,
    client?.mobile,
    client?.contactPhone,
    client?.contactMobile,
    client?.user?.phone,
    client?.clientUser?.phone
  ].map(normalizePhoneValue).filter(Boolean)
});

const getUserMatchValues = user => ({
  ids: [
    ...getIdValues(user?._id),
    ...getIdValues(user?.id),
    ...getIdValues(user?.userId),
    ...getIdValues(user?.clientId),
    ...getIdValues(user?.clientUserId),
    ...getIdValues(user?.client),
    ...getIdValues(user?.clientUser)
  ],
  emails: [
    user?.email,
    user?.clientEmail,
    user?.userEmail,
    user?.companyEmail,
    user?.client?.email,
    user?.clientUser?.email
  ].map(normalizeMatchValue).filter(Boolean),
  names: [
    user?.name,
    user?.fullName,
    user?.client,
    user?.clientName,
    user?.company,
    user?.companyName,
    user?.organizationName,
    user?.username,
    user?.client?.name,
    user?.client?.client,
    user?.client?.company,
    user?.clientUser?.name
  ].map(normalizeMatchValue).filter(Boolean),
  phones: [
    user?.phone,
    user?.mobile,
    user?.clientPhone,
    user?.clientMobile,
    user?.client?.phone,
    user?.clientUser?.phone
  ].map(normalizePhoneValue).filter(Boolean)
});

const hasIntersection = (left = [], right = []) => left.some(value => right.includes(value));

const isClientForLoggedInUser = (client, user) => {
  const clientValues = getClientMatchValues(client);
  const userValues = getUserMatchValues(user);

  return (
    hasIntersection(clientValues.ids, userValues.ids) ||
    hasIntersection(clientValues.emails, userValues.emails) ||
    hasIntersection(clientValues.names, userValues.names) ||
    hasIntersection(clientValues.phones, userValues.phones)
  );
};

const normalizeProjectMember = person => {
  const name = getPersonName(person).trim();
  if (!name) return null;

  return {
    _id: typeof person === 'object' && person ? person._id || person.id || person.userId || person.employeeId || name : name,
    name,
    email: getPersonEmail(person),
    role: getPersonRole(person)
  };
};

const addUniqueProjectMember = (membersMap, person) => {
  const member = normalizeProjectMember(person);
  if (!member) return;

  const key = String(member.email || member._id || member.name).toLowerCase();
  if (!membersMap.has(key)) {
    membersMap.set(key, member);
  }
};

const findUserForAssignedMember = (member, users = []) => {
  const memberId = typeof member === 'object' && member ? member._id || member.id || member.userId || member.employeeId : '';
  const memberName = getPersonName(member).trim().toLowerCase();
  const memberEmail = getPersonEmail(member).trim().toLowerCase();

  return users.find(user => {
    const userId = String(user._id || user.id || user.userId || user.employeeId || '').toLowerCase();
    const userName = String(user.name || user.fullName || user.employeeName || '').trim().toLowerCase();
    const userEmail = String(user.email || user.employeeEmail || '').trim().toLowerCase();

    return (
      (memberId && userId && String(memberId).toLowerCase() === userId) ||
      (memberEmail && userEmail && memberEmail === userEmail) ||
      (memberName && userName && memberName === userName)
    );
  });
};

const addAssignedProjectMember = (membersMap, member, users = []) => {
  const matchedUser = findUserForAssignedMember(member, users);
  addUniqueProjectMember(membersMap, matchedUser || member);
};

const collectProjectMembers = (currentClient, users = []) => {
  const membersMap = new Map();

  [
    currentClient?.projectManagers,
    currentClient?.projectManager
  ].forEach(group => {
    if (Array.isArray(group)) {
      group.forEach(person => addAssignedProjectMember(membersMap, person, users));
    } else {
      addAssignedProjectMember(membersMap, group, users);
    }
  });

  return Array.from(membersMap.values());
};

const getUsersArrayFromResponse = responseData => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.users)) return responseData.users;
  if (Array.isArray(responseData?.message?.users)) return responseData.message.users;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

// ========== MAIN DASHBOARD COMPONENT ==========
const Dashboard = () => {
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [serviceTasks, setServiceTasks] = useState([]);
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
    baseURL: `${API_URL}/tasks/client-tasks`,
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

  const fetchCompanyUsers = async (currentUser = {}) => {
    try {
      const companyRole = (
        currentUser.companyRole ||
        currentUser.role ||
        currentUser.userRole ||
        ''
      ).toLowerCase();

      const apiEndpoint = companyRole === 'employee' ? '/department-users' : '/company-users';
      const response = await usersApi.get(apiEndpoint);
      return getUsersArrayFromResponse(response.data).map(user => ({
        _id: user.id || user._id,
        name: user.name || user.fullName || user.employeeName || 'Unknown User',
        email: user.email || user.employeeEmail || '',
        role: user.companyRole || user.jobRole || user.role || user.designation || '',
        phone: user.phone || '',
        department: user.department || '',
        isActive: user.isActive !== undefined ? user.isActive : true
      }));
    } catch (error) {
      console.error('Error fetching company users for dashboard team:', error);
      return [];
    }
  };

  const fetchAllServicesTasks = async (currentClient, servicesList) => {
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    const collectedTasks = [];

    for (const service of servicesList) {
      const tasks = await fetchServiceTasks(currentClient._id, service);
      collectedTasks.push(...tasks.map(task => ({ ...task, serviceName: service })));
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
      setServiceTasks(collectedTasks);
      
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
      const companyUsers = await fetchCompanyUsers(user);
      
      const response = await api.get('/', {
        params: {
          companyCode: companyInfo.companyCode,
          companyIdentifier: companyInfo.companyIdentifier
        }
      });

      if (response.data?.success && isMounted.current) {
        const allClients = response.data.data || [];
        
        const currentClient = allClients.find(client => isClientForLoggedInUser(client, user));
        
        if (!currentClient) {
          setClient(null);
          setServices([]);
          setProjectManagers([]);
          setServiceTasks([]);
          setOverallStats({
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0
          });
          setError('No client data found for this login.');
          return;
        }
        
        setError('');
        setClient(currentClient);
        setProjectManagers(collectProjectMembers(currentClient, companyUsers));
        
        if (currentClient && currentClient.services) {
          setServices(currentClient.services);
          await fetchAllServicesTasks(currentClient, currentClient.services);
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

  const taskStats = calculateTaskStats(serviceTasks);
  const paymentSummary = calculatePaymentSummary(client);
  const serviceRows = services.map(serviceName => {
    const tasks = serviceTasks.filter(task => task.serviceName === serviceName);
    const completed = tasks.filter(task => task.completed === true).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const latestSub = client?.subscription?.[client?.subscription?.length - 1];
    return [
      serviceName,
      projectManagers[0]?.role || projectManagers[0]?.name || 'Assigned Team',
      formatDate(client?.subscription?.[0]?.startDate || client?.subscriptionStartDate || client?.createdAt),
      formatDate(latestSub?.endDate || client?.subscriptionEndDate),
      percent,
      tasks.length && percent === 100 ? 'Completed' : tasks.length ? 'In Progress' : 'Active'
    ];
  });
  const completedPercent = taskStats.totalTasks ? Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100) : 0;
  const inProgressPercent = taskStats.totalTasks ? Math.round((taskStats.inProgressTasks / taskStats.totalTasks) * 100) : 0;
  const pendingPercent = taskStats.totalTasks ? Math.round((taskStats.pendingTasks / taskStats.totalTasks) * 100) : 0;
  const overduePercent = taskStats.totalTasks ? Math.round((taskStats.overdueTasks / taskStats.totalTasks) * 100) : 0;
  const recentActivities = [
    ...serviceTasks.slice(0, 4).map(task => [
      `${getTaskTitle(task)} - ${task.completed ? 'completed' : 'updated'}`,
      formatDate(task.updatedAt || task.createdAt || task.dueDate),
      task.completed ? <FiCheckCircle /> : <FiFileText />
    ]),
    ...(paymentSummary.receipts[0] ? [[`Payment received for ${formatMoney(paymentSummary.receipts[0].amount || paymentSummary.subscriptionPrice)}`, formatDate(paymentSummary.receipts[0].createdAt || paymentSummary.receipts[0].paymentDate), <FiDollarSign />]] : [])
  ].slice(0, 5);

  const doughnutData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [taskStats.completedTasks, taskStats.inProgressTasks, taskStats.pendingTasks, taskStats.overdueTasks],
        backgroundColor: ['#35c985', '#4a90f3', '#ffc25a', '#f65470'],
        borderColor: '#ffffff',
        borderWidth: 0,
        spacing: 0,
        hoverOffset: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '64%',
    animation: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true
      }
    }
  };

  const clientName = client?.client || client?.name || 'Client';
  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const sidebarManagers = projectManagers.slice(0, 3);

  /*
  const summaryCards = [
    { label: 'Invoices', value: '₹1,24,500', note: '2 Overdue', tone: 'purple', icon: <FiBriefcase /> },
    { label: 'Support Tickets', value: '3', note: '1 Open', tone: 'green', icon: <FiHeadphones /> },
    { label: 'Upcoming Meetings', value: '2', note: 'Next: May 23, 2026', tone: 'blue', icon: <FiCalendar /> },
    { label: 'Team Availability', value: '85%', note: 'Available this week', tone: 'purple', icon: <FiUsers /> }
  ];

  const reportBullets = ['Custom Reports', 'Performance Analytics', 'Export & Share'];

  const cardSparkline = {
    purple: 'M4 31 L18 20 L31 25 L45 14 L60 24 L74 18 L88 27 L103 12',
    green: 'M4 26 L18 18 L31 23 L45 12 L60 20 L74 16 L88 24 L103 10',
    orange: 'M4 24 L18 13 L31 22 L45 18 L60 28 L74 21 L88 25 L103 14',
    red: 'M4 14 L18 20 L31 17 L45 29 L60 22 L74 31 L88 24 L103 15'
  };

  */

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
      <section className="ClientDashboard-hero-card ClientDashboard-greeting-card">
        <div>
          <h1>Good morning! <span>☀</span></h1>
          <p>Stay on top of your services, tasks, and payments.</p>
        </div>
        <div className="ClientDashboard-hero-stats">
          {[
            { label: 'Active Services', value: services.length, icon: <FiBriefcase />, tone: 'blue' },
            { label: 'Pending Invoices', value: paymentSummary.unpaidInvoices, icon: <FiFileText />, tone: 'orange' },
            { label: 'Open Tasks', value: taskStats.pendingTasks + taskStats.overdueTasks, icon: <FiInbox />, tone: 'teal' },
            { label: 'Recent Updates', value: recentActivities.length, icon: <FiCreditCard />, tone: 'purple' }
          ].map(item => (
            <div className="ClientDashboard-hero-stat" key={item.label}>
              <span className={`ClientDashboard-icon ClientDashboard-icon--${item.tone}`}>{item.icon}</span>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="ClientDashboard-update-strip">
          <span><FiArrowUp /></span>
          <p><strong>Recent update:</strong> {recentActivities[0]?.[0] || 'No recent task updates found.'}</p>
          <button type="button">View All Updates <FiChevronRight /></button>
        </div>
      </section>

      <section className="ClientDashboard-hero-card ClientDashboard-profile-summary">
        <button type="button" className="ClientDashboard-date-pill"><FiCalendar /> {todayLabel}</button>
        <div className="ClientDashboard-profile-glow" aria-hidden="true"></div>
        <div className="ClientDashboard-profile-avatar">{clientName.charAt(0).toUpperCase()}</div>
        <div className="ClientDashboard-profile-info">
          <div className="ClientDashboard-name-row">
            <h2>{clientName}</h2>
            <span>Client</span>
          </div>
          <p><FiMail /> {client?.email || 'No email available'}</p>
          <p><FiPhone /> {client?.phone || 'No phone available'}</p>
          <p><FiMapPin /> {client?.city || client?.address || 'No address available'}</p>
          <p><FiCalendar /> Client ID: CLT-{String(client?._id || client?.id || 'UNKNOWN').slice(-9).toUpperCase()}</p>
          <p><FiUser /> Account Manager: {sidebarManagers[0]?.name || 'Not assigned'}</p>
        </div>
        <div className="ClientDashboard-profile-actions">
          <button type="button" className="ClientDashboard-btn-light"><FiUser /> View Profile</button>
          <button type="button" className="ClientDashboard-btn-solid">Contact Support</button>
        </div>
      </section>

      <section className="ClientDashboard-kpi-row">
        {[
          { label: 'Active Services', value: services.length, trend: 'Live', dir: 'up', icon: <FiPackage />, tone: 'blue' },
          { label: 'Completed Tasks', value: overallStats.completedTasks, trend: 'Live', dir: 'up', icon: <FiCheckCircle />, tone: 'green' },
          { label: 'Pending Tasks', value: overallStats.pendingTasks, trend: 'Live', dir: 'up', icon: <FiClock />, tone: 'orange' },
          { label: 'Overdue Tasks', value: overallStats.overdueTasks, trend: 'Live', dir: 'down', icon: <FiAlertCircle />, tone: 'red' },
          { label: 'Open Tasks', value: taskStats.pendingTasks + taskStats.overdueTasks, trend: 'Live', dir: 'down', icon: <FiHeadphones />, tone: 'purple' },
          { label: 'Total Paid', value: formatMoney(paymentSummary.paidAmount), trend: 'Live', dir: 'up', icon: <FiDollarSign />, tone: 'green' }
        ].map(card => (
          <article className={`ClientDashboard-kpi-card ClientDashboard-kpi-card--${card.tone}`} key={card.label}>
            <div className={`ClientDashboard-icon ClientDashboard-icon--${card.tone}`}>{card.icon}</div>
            <div className="ClientDashboard-kpi-copy">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
            <div className={`ClientDashboard-kpi-trend ClientDashboard-kpi-trend--${card.dir}`}>
              <b>{card.trend}</b> {card.dir === 'up' ? <FiArrowUp /> : <FiArrowDown />}
            </div>
            <small>from real client data</small>
          </article>
        ))}
      </section>

      <section className="ClientDashboard-content-grid">
        <article className="ClientDashboard-card ClientDashboard-progress-overview">
          <h3>Service Progress Overview</h3>
          <div className="ClientDashboard-progress-layout">
            <div className="ClientDashboard-progress-ring" style={{ '--progress': `${completedPercent * 3.6}deg` }}>
              <div>
                <strong>{completedPercent}%</strong>
                <span>Overall Progress</span>
              </div>
            </div>
            <div className="ClientDashboard-progress-legend">
              <div className="ClientDashboard-progress-legend-row">
                <span><i className="green"></i>Completed</span>
                <b><em style={{ width: `${completedPercent}%` }}></em></b>
                <strong>{taskStats.completedTasks} ({completedPercent}%)</strong>
              </div>
              <div className="ClientDashboard-progress-legend-row">
                <span><i className="blue"></i>In Progress</span>
                <b><em style={{ width: `${inProgressPercent}%` }}></em></b>
                <strong>{taskStats.inProgressTasks} ({inProgressPercent}%)</strong>
              </div>
              <div className="ClientDashboard-progress-legend-row">
                <span><i className="orange"></i>Not Started</span>
                <b><em style={{ width: `${pendingPercent}%` }}></em></b>
                <strong>{taskStats.pendingTasks} ({pendingPercent}%)</strong>
              </div>
              <button type="button">View All Projects <FiChevronRight /></button>
            </div>
          </div>
        </article>

        <article className="ClientDashboard-card ClientDashboard-active-services">
          <div className="ClientDashboard-card-head">
            <h3>Active Services</h3>
            <button type="button">View All <span>⌄</span></button>
          </div>
          <div className="ClientDashboard-service-table">
            <div className="ClientDashboard-table-head">
              <span>Service / Project</span><span>Assigned Team</span><span>Start Date</span><span>Deadline</span><span>Progress</span><span></span>
            </div>
            {serviceRows.map(([service, team, startDate, deadline, percent, status]) => {
              return (
                <div className="ClientDashboard-service-table-row" key={service}>
                  <strong>{service}</strong>
                  <span className="ClientDashboard-team-cell"><i></i><i></i><i></i>{team}</span>
                  <span>{startDate}</span>
                  <span>{deadline}</span>
                  <span className="ClientDashboard-progress-cell">{percent}% <b><em style={{ width: `${percent}%` }}></em></b></span>
                  <span className={`ClientDashboard-pill ${status === 'Active' ? 'ClientDashboard-pill--green' : ''}`}>{status}</span>
                  <button type="button" aria-label="More"><FiMoreHorizontal /></button>
                </div>
              );
            })}
          </div>
        </article>

        <article className="ClientDashboard-card ClientDashboard-task-distribution">
          <div className="ClientDashboard-card-head">
            <h3>Task Distribution</h3>
            <button type="button">This Month <span>⌄</span></button>
          </div>
          <div className="ClientDashboard-distribution-content">
            <div className="ClientDashboard-doughnut-container">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div className="ClientDashboard-distribution-legend">
              <p><span className="ClientDashboard-dot green"></span>Completed <strong>{taskStats.completedTasks} ({completedPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot blue"></span>In Progress <strong>{taskStats.inProgressTasks} ({inProgressPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot orange"></span>Pending <strong>{taskStats.pendingTasks} ({pendingPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot red"></span>Overdue <strong>{taskStats.overdueTasks} ({overduePercent}%)</strong></p>
            </div>
          </div>
        </article>

        <article className="ClientDashboard-card ClientDashboard-recent-activity">
          <div className="ClientDashboard-card-head">
            <h3>Recent Activities</h3>
            <button type="button">View All</button>
          </div>
          <div className="ClientDashboard-timeline">
            {recentActivities.map(([title, time, icon], index) => (
              <div className="ClientDashboard-timeline-item" key={title}>
                <span className={`ClientDashboard-icon ClientDashboard-icon--${['green', 'green', 'blue', 'purple', 'blue'][index]}`}>{icon}</span>
                <p><strong>{title}</strong><small>{time}</small></p>
              </div>
            ))}
          </div>
        </article>

        <article className="ClientDashboard-card ClientDashboard-payment-summary">
          <h3>Payment Summary</h3>
          <div className="ClientDashboard-payment-line"><span><FiCreditCard /> Total Paid</span><strong>{formatMoney(paymentSummary.paidAmount)}</strong></div>
          <div className="ClientDashboard-payment-line due"><span><FiFileText /> Total Due</span><strong>{formatMoney(paymentSummary.outstanding)}</strong></div>
          <div className="ClientDashboard-payment-line"><span><FiCalendar /> Next Due Date</span><strong>{formatDate(paymentSummary.nextDueDate)}</strong></div>
          <div className="ClientDashboard-due-box">
            <small>{paymentSummary.outstanding > 0 ? 'Due Soon' : 'No Due'}</small>
            <p>{paymentSummary.planName} <strong>{formatMoney(paymentSummary.outstanding)}</strong></p>
            <button type="button">Pay Now</button>
          </div>
          <button type="button" className="ClientDashboard-link-button">View All Invoices <FiChevronRight /></button>
        </article>

        <article className="ClientDashboard-card ClientDashboard-support-card">
          <div className="ClientDashboard-card-head">
            <h3>Support Tickets</h3>
            <button type="button">View All</button>
          </div>
          <div className="ClientDashboard-ticket-stats">
            <div><FiHeadphones /><span>Open Tickets</span><strong>3</strong></div>
            <div><FiCheckCircle /><span>Resolved Tickets</span><strong>27</strong></div>
          </div>
          <h4>Recent Tickets</h4>
          {[
            ['#TK-2026-021', 'Email not syncing on mobile', 'Open'],
            ['#TK-2026-018', 'Website loading issue', 'In Progress'],
            ['#TK-2026-015', 'Request for SSL Certificate', 'Resolved']
          ].map(ticket => (
            <div className="ClientDashboard-ticket-row" key={ticket[0]}>
              <FiFileText />
              <p><strong>{ticket[0]}</strong><span>{ticket[1]}</span></p>
              <em className={`ClientDashboard-ticket-${ticket[2].toLowerCase().replace(' ', '-')}`}>{ticket[2]}</em>
            </div>
          ))}
        </article>

        <article className="ClientDashboard-card ClientDashboard-actions-card">
          <h3>Quick Actions</h3>
          <div className="ClientDashboard-action-grid">
            {[
              ['Pay Invoice', 'Secure payments', <FiCreditCard />, 'green'],
              ['Upload Document', 'Share important files', <FiUpload />, 'blue'],
              ['Book Meeting', 'Schedule with team', <FiCalendar />, 'purple'],
              ['Raise Ticket', 'Get support', <FiHeadphones />, 'orange']
            ].map(([title, desc, icon, tone]) => (
              <button type="button" key={title} className="ClientDashboard-action-tile">
                <span className={`ClientDashboard-icon ClientDashboard-icon--${tone}`}>{icon}</span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </button>
            ))}
          </div>
          <button type="button" className="ClientDashboard-all-services"><FiGrid /> View All Services <FiChevronRight /></button>
        </article>
      </section>
    </div>
  );

  /*
  return (
    <div className="ClientDashboard-client-dashboard">
      <main className="ClientDashboard-main">
        <header className="ClientDashboard-header">
          <div className="ClientDashboard-greeting">
            <h1>Welcome back, {clientFirstName}! <span>{'\uD83D\uDC4B'}</span></h1>
            <p>Here's what's happening with your projects today.</p>
          </div>
        </header>

        <section className="ClientDashboard-overall-stats">
          {statCards.map(card => (
            <article key={card.label} className="ClientDashboard-stat-card">
              <div className={`ClientDashboard-stat-icon-wrapper ClientDashboard-tone-${card.tone}`}>
                {card.icon}
              </div>
              <div className="ClientDashboard-stat-content">
                <span className="ClientDashboard-stat-label">{card.label}</span>
                <strong className="ClientDashboard-stat-number">{card.value}</strong>
                <span className={`ClientDashboard-stat-trend ClientDashboard-stat-trend--${card.direction}`}>
                  {card.direction === 'up' ? <FiArrowUp /> : <FiArrowDown />}
                  {card.trend}
                </span>
              </div>
              <svg className={`ClientDashboard-sparkline ClientDashboard-sparkline--${card.tone}`} viewBox="0 0 108 42" aria-hidden="true">
                <path d={cardSparkline[card.tone] || cardSparkline.purple} />
              </svg>
            </article>
          ))}
        </section>

        <section className="ClientDashboard-grid">
          <article className="ClientDashboard-card ClientDashboard-progress-card">
            <div className="ClientDashboard-card-title-row">
              <h3>Overall Progress <span>i</span></h3>
              <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
            </div>
            <div className="ClientDashboard-progress-content">
              <div className="ClientDashboard-progress-ring" style={{ '--progress': `${completedPercent * 3.6}deg` }}>
                <div className="ClientDashboard-progress-ring-inner">
                  <strong>{completedPercent}%</strong>
                  <span>Completed</span>
                </div>
              </div>
              <p><strong>+8%</strong> increase from last week</p>
            </div>
          </article>

          <article className="ClientDashboard-card ClientDashboard-distribution-card">
            <div className="ClientDashboard-card-title-row">
              <h3>Task Distribution <span>i</span></h3>
              <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
            </div>
            <div className="ClientDashboard-distribution-content">
              <div className="ClientDashboard-doughnut-container">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div className="ClientDashboard-distribution-legend">
                <div><span className="ClientDashboard-dot green"></span><span>Completed</span><strong>{overallStats.completedTasks} ({completedPercent}%)</strong></div>
                <div><span className="ClientDashboard-dot orange"></span><span>Pending</span><strong>{overallStats.pendingTasks} ({pendingPercent}%)</strong></div>
                <div><span className="ClientDashboard-dot red"></span><span>Overdue</span><strong>{overallStats.overdueTasks} ({overduePercent}%)</strong></div>
                <footer>Total Tasks <strong>{totalTasks}</strong></footer>
              </div>
            </div>
          </article>

          <article className="ClientDashboard-card ClientDashboard-activity-card">
            <div className="ClientDashboard-card-title-row">
              <h3>Recent Activities</h3>
              <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
            </div>
            <div className="ClientDashboard-activity-list">
              {recentActivities.map(task => (
                <div className="ClientDashboard-activity-item" key={task.id}>
                  <div className={`ClientDashboard-activity-icon ClientDashboard-tone-${task.status.tone}`}>{task.status.icon}</div>
                  <div className="ClientDashboard-activity-copy">
                    <strong>{task.name}</strong>
                    <span>{task.service}</span>
                  </div>
                  <span className={`ClientDashboard-task-status ClientDashboard-task-status--${task.status.tone}`}>
                    {task.status.label}
                  </span>
                  <small>{task.time}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="ClientDashboard-card ClientDashboard-weekly-card">
            <div className="ClientDashboard-card-title-row">
              <h3>Weekly Progress Overview <span>i</span></h3>
              <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
            </div>
            <div className="ClientDashboard-chart-container">
              <Line data={chartData} options={lineOptions} />
            </div>
          </article>

          <article className="ClientDashboard-card ClientDashboard-deadline-card">
            <div className="ClientDashboard-card-title-row">
              <h3>Upcoming Deadlines</h3>
              <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
            </div>
            <div className="ClientDashboard-deadline-list">
              {upcomingDeadlines.slice(0, 4).map((task, index) => (
                <div className="ClientDashboard-deadline-item" key={`${task.task || task.title}-${index}`}>
                  <div className="ClientDashboard-deadline-icon ClientDashboard-tone-blue"><FiCalendar /></div>
                  <div>
                    <strong>{task.task || task.title || 'Project Deadline'}</strong>
                    <span>{task.serviceName || 'Project Service'}</span>
                  </div>
                  <small>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="ClientDashboard-card ClientDashboard-services-card">
            <div className="ClientDashboard-card-title-row">
              <h3>Active Services</h3>
              <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
            </div>
            <div className="ClientDashboard-service-list">
              {servicePerformance.map(item => (
                <div className="ClientDashboard-service-row" key={item.service}>
                  <div className={`ClientDashboard-service-icon ClientDashboard-tone-${item.tone}`}><FiFolder /></div>
                  <div>
                    <strong>{item.service}</strong>
                    <div className="ClientDashboard-row-progress"><span style={{ width: `${item.percent}%` }}></span></div>
                  </div>
                  <small>{item.percent}%</small>
                </div>
              ))}
            </div>
          </article>

          <article className="ClientDashboard-card ClientDashboard-performance-card">
            <div className="ClientDashboard-card-title-row">
              <h3>Top Services Performance</h3>
              <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
            </div>
            <div className="ClientDashboard-performance-list">
              {servicePerformance.map((item, index) => (
                <div className="ClientDashboard-performance-row" key={item.service}>
                  <div className={`ClientDashboard-service-icon ClientDashboard-tone-${item.tone}`}><FiFolder /></div>
                  <strong>{item.service}</strong>
                  <span className="ClientDashboard-stars">{'★'.repeat(4)}<i>★</i></span>
                  <div className="ClientDashboard-row-progress"><span style={{ width: `${item.percent}%` }}></span></div>
                  <small>{(4.8 - index * 0.2).toFixed(1)}/5</small>
                </div>
              ))}
            </div>
          </article>

          <article className="ClientDashboard-reports-card">
            <div className="ClientDashboard-report-art" aria-hidden="true">
              <div className="ClientDashboard-report-sheet">
                <span></span><span></span><span></span>
                <i></i>
              </div>
              <div className="ClientDashboard-report-bars"><b></b><b></b><b></b></div>
            </div>
            <div className="ClientDashboard-report-copy">
              <h3>Reports & Analytics</h3>
              <p>Get detailed insights into your projects, performance and growth.</p>
              {reportBullets.map(item => (
                <span key={item}><FiCheckCircle /> {item}</span>
              ))}
              <button type="button">View Reports <FiChevronRight /></button>
            </div>
          </article>

          <section className="ClientDashboard-summary-cards">
            {summaryCards.map(card => (
              <article className="ClientDashboard-summary-card" key={card.label}>
                <div className={`ClientDashboard-summary-icon ClientDashboard-tone-${card.tone}`}>{card.icon}</div>
                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.note}</small>
                </div>
                <button type="button" aria-label={`Open ${card.label}`}><FiChevronRight /></button>
              </article>
            ))}
          </section>
        </section>
      </main>

      <aside className="ClientDashboard-sidebar">
        <section className="ClientDashboard-side-card ClientDashboard-profile-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Client Profile</h3>
            <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
          </div>
          <div className="ClientDashboard-profile-avatar-wrap">
            <div className="ClientDashboard-profile-avatar">{clientName.charAt(0).toUpperCase()}</div>
            <span><FiShield /></span>
          </div>
          <div className="ClientDashboard-premium-badge"><FiStar /> Premium Client</div>
          <h2>{clientName}</h2>
          <div className="ClientDashboard-profile-meta">
            <span><FiMail /> {client?.email || 'rahul.sharma@email.com'}</span>
            <span><FiPhone /> {client?.phone || '+91 98765 43210'}</span>
            <span><FiMapPin /> {client?.city || client?.address || 'Bangalore, India'}</span>
          </div>
        </section>

        <section className="ClientDashboard-side-card ClientDashboard-managers-card">
          <div className="ClientDashboard-card-title-row">
            <h3>Project Managers</h3>
            <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
          </div>
          <div className="ClientDashboard-manager-list">
            {sidebarManagers.map(manager => (
              <div className="ClientDashboard-manager-row" key={manager.email || manager.name}>
                <div className="ClientDashboard-manager-avatar">{(manager.name || 'M').charAt(0)}</div>
                <div>
                  <strong>{manager.name || 'Project Manager'}</strong>
                  <span>{manager.role || manager.designation || 'Project Manager'}</span>
                </div>
                <i></i>
              </div>
            ))}
          </div>
          <button className="ClientDashboard-view-managers" type="button">View all managers <FiChevronRight /></button>
        </section>

        <section className="ClientDashboard-side-card ClientDashboard-progress-summary">
          <div className="ClientDashboard-card-title-row">
            <h3>Progress Summary</h3>
            <button type="button" aria-label="More options"><FiMoreHorizontal /></button>
          </div>
          <div className="ClientDashboard-summary-top">
            <span>Overall Progress<br /><strong>+8% from last week</strong></span>
            <b>{completedPercent}%</b>
          </div>
          <div className="ClientDashboard-mini-chart">
            <Line data={chartData} options={lineOptions} />
          </div>
        </section>
      </aside>
    </div>
  );
  */
};
export default Dashboard;
