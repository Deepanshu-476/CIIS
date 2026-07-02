import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CIISLoader from '../../../Loader/CIISLoader';
import API_URL from '../../../config';
import {
  calculatePaymentSummary,
  calculateTaskStats,
  formatDate,
  formatMoney,
  formatPublicId,
  getTaskTitle,
  isClientTaskOverdue
} from '../../utils/clientPortalData';
import './ClientDashboardPage.css';


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
  FiInbox,
  FiX
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Tooltip,
  ArcElement
} from 'chart.js';

ChartJS.register(
  Tooltip,
  ArcElement
);


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

const parseAdditionalDetails = value => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

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
    ...getIdValues(user?.employeeType),
    ...getIdValues(user?.client),
    ...getIdValues(user?.clientUser),
    ...getIdValues(parseAdditionalDetails(user?.additionalDetails)?.clientId)
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


const Dashboard = () => {
  const navigate = useNavigate();
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
  const [dashboardFilter, setDashboardFilter] = useState('active-services');
  const [detailsModal, setDetailsModal] = useState(null);

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
    const collectedTasks = [];

    for (const service of servicesList) {
      const tasks = await fetchServiceTasks(currentClient._id, service);
      collectedTasks.push(...tasks.map(task => ({ ...task, serviceName: service })));
    }

    if (isMounted.current) {
      setServiceTasks(collectedTasks);
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
      const storedClient = (() => {
        try {
          return JSON.parse(localStorage.getItem('client') || 'null');
        } catch {
          return null;
        }
      })();
      const companyUsers = await fetchCompanyUsers(user);
      
      const response = await api.get('/', {
        params: {
          companyCode: companyInfo.companyCode,
          companyIdentifier: companyInfo.companyIdentifier,
          limit: 1000
        }
      });

      if (response.data?.success && isMounted.current) {
        const allClients = response.data.data || [];
        const storedClientId = normalizeMatchValue(storedClient?._id || storedClient?.id || storedClient?.clientId);
        
        const currentClient = (
          storedClientId
            ? allClients.find(client => normalizeMatchValue(client?._id || client?.id) === storedClientId)
            : null
        ) || allClients.find(client => isClientForLoggedInUser(client, user));
        
        if (!currentClient) {
          setClient(null);
          setServices([]);
          setProjectManagers([]);
          setServiceTasks([]);
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
  const openTasksCount = taskStats.pendingTasks + taskStats.overdueTasks + taskStats.inProgressTasks;
  const taskMatchesFilter = (task, filter) => {
    if (filter === 'completed-tasks') return task.completed === true;
    if (filter === 'pending-tasks') {
      return (
        task.completed !== true &&
        !isClientTaskOverdue(task) &&
        !String(task.status || '').toLowerCase().includes('progress')
      );
    }
    if (filter === 'overdue-tasks') return isClientTaskOverdue(task);
    if (filter === 'open-tasks') return task.completed !== true;
    return true;
  };
  const visibleTasks = dashboardFilter === 'total-paid'
    ? []
    : serviceTasks.filter(task => taskMatchesFilter(task, dashboardFilter));
  const visibleTaskStats = calculateTaskStats(visibleTasks);
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
  const visibleServiceRows = serviceRows.filter(([service]) => {
    if (dashboardFilter === 'active-services') return true;
    if (dashboardFilter === 'total-paid') return false;
    return serviceTasks
      .filter(task => task.serviceName === service)
      .some(task => taskMatchesFilter(task, dashboardFilter));
  });
  const previewServiceRows = visibleServiceRows.slice(0, 4);
  const completedPercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.completedTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const inProgressPercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.inProgressTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const pendingPercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.pendingTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const overduePercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.overdueTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const recentActivities = [
    ...serviceTasks.slice(0, 4).map(task => [
      `${getTaskTitle(task)} - ${task.completed ? 'completed' : 'updated'}`,
      formatDate(task.updatedAt || task.createdAt || task.dueDate),
      task.completed ? <FiCheckCircle /> : <FiFileText />
    ]),
    ...(paymentSummary.receipts[0] ? [[`Payment received for ${formatMoney(paymentSummary.receipts[0].amount || paymentSummary.subscriptionPrice)}`, formatDate(paymentSummary.receipts[0].createdAt || paymentSummary.receipts[0].paymentDate), <FiDollarSign />]] : [])
  ].slice(0, 5);
  const visibleRecentActivities = [
    ...visibleTasks.slice(0, 4).map(task => [
      `${getTaskTitle(task)} - ${task.completed ? 'completed' : 'updated'}`,
      formatDate(task.updatedAt || task.createdAt || task.dueDate),
      task.completed ? <FiCheckCircle /> : <FiFileText />
    ]),
    ...(dashboardFilter === 'total-paid' && paymentSummary.receipts[0]
      ? [[`Payment received for ${formatMoney(paymentSummary.receipts[0].amount || paymentSummary.subscriptionPrice)}`, formatDate(paymentSummary.receipts[0].createdAt || paymentSummary.receipts[0].paymentDate), <FiDollarSign />]]
      : [])
  ].slice(0, 5);
  const supportTickets = [
    ['#TK-2026-021', 'Email not syncing on mobile', 'Open'],
    ['#TK-2026-018', 'Website loading issue', 'In Progress'],
    ['#TK-2026-015', 'Request for SSL Certificate', 'Resolved']
  ];
  const modalTitle = {
    services: 'Active Services',
    activities: 'Recent Activities',
    support: 'Support Tickets'
  };

  const doughnutData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [visibleTaskStats.completedTasks, visibleTaskStats.inProgressTasks, visibleTaskStats.pendingTasks, visibleTaskStats.overdueTasks],
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

   

  if (loading) {
    return <CIISLoader />;
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
            { label: 'Open Tasks', value: openTasksCount, icon: <FiInbox />, tone: 'teal' },
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
          <p><FiCalendar /> Client ID: {formatPublicId('CLT', client)}</p>
          <p><FiUser /> Account Manager: {sidebarManagers[0]?.name || 'Not assigned'}</p>
        </div>
        <div className="ClientDashboard-profile-actions">
          
          <button type="button" className="ClientDashboard-btn-solid">Contact Support</button>
        </div>
      </section>

      <section className="ClientDashboard-kpi-row">
        {[
          { label: 'Active Services', filter: 'active-services', value: services.length, trend: 'Live', dir: 'up', icon: <FiPackage />, tone: 'blue' },
          { label: 'Completed Tasks', filter: 'completed-tasks', value: taskStats.completedTasks, trend: 'Live', dir: 'up', icon: <FiCheckCircle />, tone: 'green' },
          { label: 'Pending Tasks', filter: 'pending-tasks', value: taskStats.pendingTasks, trend: 'Live', dir: 'up', icon: <FiClock />, tone: 'orange' },
          { label: 'Overdue Tasks', filter: 'overdue-tasks', value: taskStats.overdueTasks, trend: 'Live', dir: 'down', icon: <FiAlertCircle />, tone: 'red' },
          { label: 'Open Tasks', filter: 'open-tasks', value: openTasksCount, trend: 'Live', dir: 'down', icon: <FiHeadphones />, tone: 'purple' },
          { label: 'Total Paid', filter: 'total-paid', value: formatMoney(paymentSummary.paidAmount), trend: 'Live', dir: 'up', icon: <FiDollarSign />, tone: 'green' }
        ].map(card => (
          <button
            type="button"
            className={`ClientDashboard-kpi-card ClientDashboard-kpi-card--${card.tone} ${dashboardFilter === card.filter ? 'ClientDashboard-kpi-card--active' : ''}`}
            key={card.label}
            onClick={() => setDashboardFilter(card.filter)}
            aria-pressed={dashboardFilter === card.filter}
          >
            <div className={`ClientDashboard-icon ClientDashboard-icon--${card.tone}`}>{card.icon}</div>
            <div className="ClientDashboard-kpi-copy">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
            <div className={`ClientDashboard-kpi-trend ClientDashboard-kpi-trend--${card.dir}`}>
              <b>{card.trend}</b> {card.dir === 'up' ? <FiArrowUp /> : <FiArrowDown />}
            </div>
            <small>from real client data</small>
          </button>
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
                <strong>{visibleTaskStats.completedTasks} ({completedPercent}%)</strong>
              </div>
              <div className="ClientDashboard-progress-legend-row">
                <span><i className="blue"></i>In Progress</span>
                <b><em style={{ width: `${inProgressPercent}%` }}></em></b>
                <strong>{visibleTaskStats.inProgressTasks} ({inProgressPercent}%)</strong>
              </div>
              <div className="ClientDashboard-progress-legend-row">
                <span><i className="orange"></i>Not Started</span>
                <b><em style={{ width: `${pendingPercent}%` }}></em></b>
                <strong>{visibleTaskStats.pendingTasks} ({pendingPercent}%)</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="ClientDashboard-card ClientDashboard-active-services">
          <div className="ClientDashboard-card-head">
            <h3>Active Services</h3>
            <button type="button" onClick={() => setDetailsModal('services')}>View All <span>⌄</span></button>
          </div>
          <div className="ClientDashboard-service-table">
            <div className="ClientDashboard-table-head">
              <span>Service / Project</span><span>Assigned Team</span><span>Start Date</span><span>Deadline</span><span>Progress</span><span></span>
            </div>
            {previewServiceRows.map(([service, team, startDate, deadline, percent, status]) => {
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
            {!previewServiceRows.length && (
              <div className="ClientDashboard-empty-row">No services match this filter.</div>
            )}
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
              <p><span className="ClientDashboard-dot green"></span>Completed <strong>{visibleTaskStats.completedTasks} ({completedPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot blue"></span>In Progress <strong>{visibleTaskStats.inProgressTasks} ({inProgressPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot orange"></span>Pending <strong>{visibleTaskStats.pendingTasks} ({pendingPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot red"></span>Overdue <strong>{visibleTaskStats.overdueTasks} ({overduePercent}%)</strong></p>
            </div>
          </div>
        </article>

        <article className="ClientDashboard-card ClientDashboard-recent-activity">
          <div className="ClientDashboard-card-head">
            <h3>Recent Activities</h3>
            <button type="button" onClick={() => setDetailsModal('activities')}>View All</button>
          </div>
          <div className="ClientDashboard-timeline">
            {visibleRecentActivities.map(([title, time, icon], index) => (
              <div className="ClientDashboard-timeline-item" key={title}>
                <span className={`ClientDashboard-icon ClientDashboard-icon--${['green', 'green', 'blue', 'purple', 'blue'][index]}`}>{icon}</span>
                <p><strong>{title}</strong><small>{time}</small></p>
              </div>
            ))}
            {!visibleRecentActivities.length && (
              <div className="ClientDashboard-empty-row">No updates match this filter.</div>
            )}
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
            <button type="button" onClick={() => navigate('/client/payments')}>Pay Now</button>
          </div>
          <button type="button" className="ClientDashboard-link-button" onClick={() => navigate('/client/payments')}>View All Invoices <FiChevronRight /></button>
        </article>

        <article className="ClientDashboard-card ClientDashboard-support-card">
          <div className="ClientDashboard-card-head">
            <h3>Support Tickets</h3>
            <button type="button" onClick={() => setDetailsModal('support')}>View All</button>
          </div>
          <div className="ClientDashboard-ticket-stats">
            <div><FiHeadphones /><span>Open Tickets</span><strong>3</strong></div>
            <div><FiCheckCircle /><span>Resolved Tickets</span><strong>27</strong></div>
          </div>
          <h4>Recent Tickets</h4>
          {supportTickets.map(ticket => (
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
              ['Pay Invoice', 'Secure payments', <FiCreditCard />, 'green', '/client/payments'],
              ['Upload Document', 'Share important files', <FiUpload />, 'blue', '/client/documents'],
              ['Book Meeting', 'Schedule with team', <FiCalendar />, 'purple', '/ciisUser/client-meeting'],
              ['Raise Ticket', 'Get support', <FiHeadphones />, 'orange', '/client/support-tickets']
            ].map(([title, desc, icon, tone, path]) => (
              <button type="button" key={title} className="ClientDashboard-action-tile" onClick={() => navigate(path)}>
                <span className={`ClientDashboard-icon ClientDashboard-icon--${tone}`}>{icon}</span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </button>
            ))}
          </div>
          <button type="button" className="ClientDashboard-all-services"><FiGrid /> View All Services <FiChevronRight /></button>
        </article>
      </section>

      {detailsModal && (
        <div className="ClientDashboard-modal-backdrop" role="presentation" onClick={() => setDetailsModal(null)}>
          <section
            className="ClientDashboard-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ClientDashboard-details-title"
            onClick={event => event.stopPropagation()}
          >
            <header className="ClientDashboard-modal-head">
              <div>
                <span>Client Dashboard</span>
                <h3 id="ClientDashboard-details-title">{modalTitle[detailsModal]}</h3>
              </div>
              <button type="button" aria-label="Close details" onClick={() => setDetailsModal(null)}>
                <FiX />
              </button>
            </header>

            {detailsModal === 'services' && (
              <div className="ClientDashboard-modal-table">
                <div className="ClientDashboard-modal-table-head">
                  <span>Service / Project</span><span>Assigned Team</span><span>Start Date</span><span>Deadline</span><span>Progress</span><span>Status</span>
                </div>
                {serviceRows.map(([service, team, startDate, deadline, percent, status]) => (
                  <div className="ClientDashboard-modal-table-row" key={service}>
                    <strong>{service}</strong>
                    <span>{team}</span>
                    <span>{startDate}</span>
                    <span>{deadline}</span>
                    <span>{percent}%</span>
                    <em className={`ClientDashboard-pill ${status === 'Active' ? 'ClientDashboard-pill--green' : ''}`}>{status}</em>
                  </div>
                ))}
                {!serviceRows.length && <p className="ClientDashboard-modal-empty">No service details available.</p>}
              </div>
            )}

            {detailsModal === 'activities' && (
              <div className="ClientDashboard-modal-list">
                {recentActivities.map(([title, time, icon], index) => (
                  <div className="ClientDashboard-modal-list-item" key={title}>
                    <span className={`ClientDashboard-icon ClientDashboard-icon--${['green', 'green', 'blue', 'purple', 'blue'][index]}`}>{icon}</span>
                    <p><strong>{title}</strong><small>{time}</small></p>
                  </div>
                ))}
                {!recentActivities.length && <p className="ClientDashboard-modal-empty">No activity details available.</p>}
              </div>
            )}

            {detailsModal === 'support' && (
              <div className="ClientDashboard-modal-list">
                {supportTickets.map(ticket => (
                  <div className="ClientDashboard-modal-ticket" key={ticket[0]}>
                    <FiFileText />
                    <p><strong>{ticket[0]}</strong><span>{ticket[1]}</span></p>
                    <em className={`ClientDashboard-ticket-${ticket[2].toLowerCase().replace(' ', '-')}`}>{ticket[2]}</em>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );

   
};
export default Dashboard;
