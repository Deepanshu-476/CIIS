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
  rupee,
  getTaskTitle,
  isClientTaskOverdue,
  applyClientSubscriptionDueDates,
  CLIENT_PORTAL_SELECTED_CLIENT_KEY,
  CLIENT_PORTAL_SELECTION_EVENT,
  getClientPortalCompanyContext,
  getCompanyScopedClientParams
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
  FiUpload,
  FiCreditCard,
  FiGrid,
  FiArrowUp,
  FiArrowDown,
  FiUser,
  FiUsers,
  FiFilter,
  FiMessageCircle,
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
    ...getIdValues(parseAdditionalDetails(user?.additionalDetails)?.clientId),
    ...(Array.isArray(parseAdditionalDetails(user?.additionalDetails)?.clientIds)
      ? parseAdditionalDetails(user?.additionalDetails).clientIds.flatMap(getIdValues)
      : [])
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

const closedTicketStatuses = new Set(['resolved', 'closed']);

const getTicketStatusClass = status => {
  const normalized = String(status || 'Open').trim().toLowerCase().replace(/\s+/g, '-');
  if (normalized === 'closed') return 'resolved';
  return normalized || 'open';
};

const mapSupportTicketRow = ticket => {
  const status = ticket.status || 'Open';
  return [
    ticket.ticketNumber || formatPublicId(ticket._id || ticket.id, 'TK'),
    ticket.subject || ticket.title || ticket.description || 'Support request',
    status,
    ticket.updatedAt || ticket.createdAt || ticket.lastMessageAt || '',
    ticket._id || ticket.id || ticket.ticketNumber
  ];
};

const formatSupportTicketTime = value => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Date unavailable';
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day}  •  ${time}`;
};


const Dashboard = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [availableClients, setAvailableClients] = useState([]);
  const [services, setServices] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [serviceTasks, setServiceTasks] = useState([]);
  const [supportTicketsData, setSupportTicketsData] = useState([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(false);
  const [supportTicketsError, setSupportTicketsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    companyCode: '',
    companyIdentifier: ''
  });
  const [dashboardFilter, setDashboardFilter] = useState('active-services');
  const [detailsModal, setDetailsModal] = useState(null);
  const [supportTicketTab, setSupportTicketTab] = useState('all');
  const [supportTicketFilter, setSupportTicketFilter] = useState('all');

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

  const supportApi = axios.create({
    baseURL: API_URL,
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
  addAuthInterceptor(supportApi);

  useEffect(() => {
    isMounted.current = true;
    const handleSelectionChange = () => {
      initialFetchDone.current = true;
      fetchClientData();
    };
    window.addEventListener(CLIENT_PORTAL_SELECTION_EVENT, handleSelectionChange);
    return () => {
      isMounted.current = false;
      window.removeEventListener(CLIENT_PORTAL_SELECTION_EVENT, handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = () => {
      setCompanyInfo(getClientPortalCompanyContext());
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
      setServiceTasks(applyClientSubscriptionDueDates(collectedTasks, currentClient));
    }
  };

  const fetchSupportTickets = async () => {
    if (!isMounted.current) return;
    setSupportTicketsLoading(true);
    setSupportTicketsError('');

    try {
      const response = await supportApi.get('/support/tickets/my');
      if (isMounted.current) {
        setSupportTicketsData(Array.isArray(response.data?.tickets) ? response.data.tickets : []);
      }
    } catch (error) {
      console.error('Error fetching dashboard support tickets:', error);
      if (isMounted.current) {
        setSupportTicketsError(error.response?.data?.message || 'Failed to load support tickets');
        setSupportTicketsData([]);
      }
    } finally {
      if (isMounted.current) {
        setSupportTicketsLoading(false);
      }
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
      const requestCompanyInfo = getClientPortalCompanyContext(user, storedClient);

      if (!requestCompanyInfo.companyCode) {
        if (isMounted.current) {
          setAvailableClients([]);
          setClient(null);
          setServices([]);
          setProjectManagers([]);
          setServiceTasks([]);
          setError('Company code missing. Please login again from your company portal.');
        }
        return;
      }
      
      const response = await api.get('/', {
        params: {
          ...getCompanyScopedClientParams(requestCompanyInfo),
          limit: 1000
        }
      });

      if (response.data?.success && isMounted.current) {
        const allClients = response.data.data || [];
        const matchingClients = allClients.filter(item => isClientForLoggedInUser(item, user));
        setAvailableClients(matchingClients);
        const selectedClientId = normalizeMatchValue(localStorage.getItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY));
        const storedClientId = selectedClientId || normalizeMatchValue(storedClient?._id || storedClient?.id || storedClient?.clientId);
        
        const currentClient = (
          storedClientId
            ? matchingClients.find(client => normalizeMatchValue(client?._id || client?.id) === storedClientId)
            : null
        ) || matchingClients[0];
        
        if (!currentClient) {
          setClient(null);
          setAvailableClients([]);
          setServices([]);
          setProjectManagers([]);
          setServiceTasks([]);
          setError('No client data found for this login.');
          return;
        }
        
        setError('');
        setClient(currentClient);
        localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, String(currentClient._id));
        localStorage.setItem('client', JSON.stringify(currentClient));
        setProjectManagers(collectProjectMembers(currentClient, companyUsers));
        fetchSupportTickets();
        
        if (currentClient && currentClient.services) {
          setServices(currentClient.services);
          await fetchAllServicesTasks(currentClient, currentClient.services);
        }
      } else {
        setAvailableClients([]);
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
    localStorage.removeItem('client');
    localStorage.removeItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY);
    window.location.href = '/login';
  };

  const handleCompanySelect = nextClient => {
    if (!nextClient?._id) return;
    const nextClientId = String(nextClient._id);
    localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, nextClientId);
    localStorage.setItem('client', JSON.stringify(nextClient));
    window.dispatchEvent(new CustomEvent(CLIENT_PORTAL_SELECTION_EVENT, {
      detail: { clientId: nextClientId }
    }));
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
  const visibleTasks = serviceTasks.filter(task => taskMatchesFilter(task, dashboardFilter));
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
    return serviceTasks
      .filter(task => task.serviceName === service)
      .some(task => taskMatchesFilter(task, dashboardFilter));
  });
  const previewServiceRows = visibleServiceRows.slice(0, 4);
  const completedPercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.completedTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const inProgressPercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.inProgressTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const pendingPercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.pendingTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const overduePercent = visibleTaskStats.totalTasks ? Math.round((visibleTaskStats.overdueTasks / visibleTaskStats.totalTasks) * 100) : 0;
  const today = new Date();
  const isToday = value => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) && date.toDateString() === today.toDateString();
  };
  const isInProgressTask = task => (
    task.completed !== true &&
    !isClientTaskOverdue(task) &&
    String(task.status || '').toLowerCase().includes('progress')
  );
  const inProgressTasks = serviceTasks.filter(isInProgressTask);
  const todayInProgressTasks = inProgressTasks.filter(task => (
    isToday(task.dueDate) || isToday(task.updatedAt) || isToday(task.createdAt)
  ));
  const todayTasks = serviceTasks.filter(task => (
    isToday(task.dueDate) || isToday(task.updatedAt) || isToday(task.createdAt)
  ));
  const activityTasks = todayInProgressTasks.length
    ? todayInProgressTasks
    : inProgressTasks.length
      ? inProgressTasks
      : todayTasks.length
        ? todayTasks
        : serviceTasks;
  const recentActivities = activityTasks
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || b.dueDate || 0) - new Date(a.updatedAt || a.createdAt || a.dueDate || 0))
    .slice(0, 10)
    .map(task => [
      `${getTaskTitle(task)} - ${task.completed ? 'Completed' : task.status || 'Pending'}`,
      formatDate(task.dueDate || task.updatedAt || task.createdAt),
      <FiClock />
    ]);
  const visibleRecentActivities = recentActivities.slice(0, 5);
  const supportTickets = supportTicketsData
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .map(mapSupportTicketRow);
  const recentSupportTickets = supportTickets.slice(0, 3);
  const openSupportTicketCount = supportTicketsData.filter(ticket => !closedTicketStatuses.has(String(ticket.status || '').toLowerCase())).length;
  const resolvedSupportTicketCount = supportTicketsData.filter(ticket => closedTicketStatuses.has(String(ticket.status || '').toLowerCase())).length;
  const supportModalTickets = supportTickets.filter(ticket => {
    const status = String(ticket[2] || '').toLowerCase();
    const isClosed = closedTicketStatuses.has(status);
    if (supportTicketTab === 'closed' && !isClosed) return false;
    return supportTicketFilter === 'all' || status === supportTicketFilter;
  });
  const openSupportTickets = () => {
    setSupportTicketTab('all');
    setSupportTicketFilter('all');
    setDetailsModal('support');
  };
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
        backgroundColor: ['#37c889', '#4a90f3', '#ffc25a', '#f65470'],
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
  const selectedClientId = normalizeMatchValue(client?._id || client?.id);
  const companyCards = availableClients.map(item => {
    const companyName = item.company || item.companyName || item.client || 'Company';
    const serviceCount = Array.isArray(item.services) ? item.services.length : 0;
    const taskCount = Array.isArray(item.tasks) ? item.tasks.length : 0;
    const status = item.status || item.accountStatus || 'Active';
    const id = normalizeMatchValue(item?._id || item?.id);
    return {
      client: item,
      id,
      companyName,
      serviceCount,
      taskCount,
      status,
      isActive: id && id === selectedClientId,
      initial: companyName.charAt(0).toUpperCase(),
      logo: item.companyLogo || item.logo || item.logoUrl || ''
    };
  });
  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const sidebarManagers = projectManagers.slice(0, 3);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12
    ? { text: 'Good morning!', icon: '☀' }
    : currentHour < 18
      ? { text: 'Good afternoon!', icon: '☀' }
      : { text: 'Good evening!', icon: '☾' };

   

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
          <h1>{greeting.text} <span>{greeting.icon}</span></h1>
          <p>Stay on top of your services, tasks, and payments.</p>
        </div>
        <div className="ClientDashboard-hero-stats">
          {[
            { label: 'Active Services', value: services.length, icon: <FiBriefcase />, tone: 'blue' },
            { label: 'Pending Invoices', value: paymentSummary.unpaidInvoices, icon: <FiFileText />, tone: 'orange' },
            { label: 'Open Tasks', value: openTasksCount, icon: <FiInbox />, tone: 'teal' },
            { label: 'Recent Updates', value: recentActivities.length, icon: <FiCreditCard />, tone: 'purple' }
          ].map(item => (
            <div
              className={`ClientDashboard-hero-stat ClientDashboard-hero-stat--${item.tone}`}
              key={item.label}
            >
              <span className={`ClientDashboard-icon ClientDashboard-icon--${item.tone}`}>{item.icon}</span>
              <span className="ClientDashboard-hero-stat-copy">
                <small>{item.label}</small>
                <strong className={`ClientDashboard-count ClientDashboard-count--${item.tone}`}>
                  {item.value}
                </strong>
              </span>
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
          <p><FiMail /> <span>{client?.email || 'No email available'}</span></p>
          <p><FiPhone /> <span>{client?.phone || 'No phone available'}</span></p>
          <p><FiMapPin /> <span>{client?.city || client?.address || 'No address available'}</span></p>
          <p><FiCalendar /> <span>Client ID: {formatPublicId('CLT', client)}</span></p>
          <p><FiUser /> <span>Account Manager: {sidebarManagers[0]?.name || 'Not assigned'}</span></p>
        </div>
      </section>

      {companyCards.length > 0 && (
        <section className="ClientDashboard-company-switcher" aria-label="Your companies">
          <div className="ClientDashboard-company-switcher-head">
            <div>
              <h3>Your Companies</h3>
              <p>Click a company to open its dashboard data.</p>
            </div>
            <span>{companyCards.length} {companyCards.length === 1 ? 'company' : 'companies'}</span>
          </div>
          <div className="ClientDashboard-company-list">
            {companyCards.map(company => (
              <button
                type="button"
                key={company.id || company.companyName}
                className={`ClientDashboard-company-card ${company.isActive ? 'ClientDashboard-company-card--active' : ''}`}
                onClick={() => handleCompanySelect(company.client)}
                aria-pressed={company.isActive}
              >
                <span className="ClientDashboard-company-logo">
                  {company.logo ? <img src={company.logo} alt="" /> : company.initial}
                </span>
                <span className="ClientDashboard-company-copy">
                  <strong>{company.companyName}</strong>
                  <small>{company.serviceCount} services • {company.taskCount} tasks</small>
                </span>
                <em>{company.status}</em>
                <FiChevronRight />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="ClientDashboard-kpi-row">
        {[
          { label: 'Active Services', filter: 'active-services', value: services.length, trend: 'Live', dir: 'up', icon: <FiPackage />, tone: 'blue' },
          { label: 'Completed Tasks', filter: 'completed-tasks', value: taskStats.completedTasks, trend: 'Live', dir: 'up', icon: <FiCheckCircle />, tone: 'green' },
          { label: 'Pending Tasks', filter: 'pending-tasks', value: taskStats.pendingTasks, trend: 'Live', dir: 'up', icon: <FiClock />, tone: 'orange' },
          { label: 'Open Tasks', filter: 'open-tasks', value: openTasksCount, trend: 'Live', dir: 'down', icon: <FiHeadphones />, tone: 'purple' }
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
            <button type="button" onClick={() => navigate('/client/my-services')}>View All <span>⌄</span></button>
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
          </div>
            <div className="ClientDashboard-distribution-content">
            <div className="ClientDashboard-doughnut-container">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="ClientDashboard-doughnut-progress-label">
                <strong>{completedPercent}%</strong>
                <span>Overall Progress</span>
                <small>Completed</small>
              </div>
            </div>
            <div className="ClientDashboard-distribution-legend">
              <p><span className="ClientDashboard-dot green"></span><span>Completed</span><strong>{visibleTaskStats.completedTasks} ({completedPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot blue"></span><span>In Progress</span><strong>{visibleTaskStats.inProgressTasks} ({inProgressPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot orange"></span><span>Pending</span><strong>{visibleTaskStats.pendingTasks} ({pendingPercent}%)</strong></p>
              <p><span className="ClientDashboard-dot red"></span><span>Overdue</span><strong>{visibleTaskStats.overdueTasks} ({overduePercent}%)</strong></p>
            </div>
          </div>
        </article>

        <article className="ClientDashboard-card ClientDashboard-payment-summary">
          <div className="ClientDashboard-payment-heading"><span><FiCreditCard /></span><div><h3>Payment Summary</h3><small>Billing overview and due details</small></div></div>
          <div className="ClientDashboard-payment-line due"><span><FiFileText /> Total Due</span><strong>{formatMoney(paymentSummary.outstanding)}</strong></div>
          <div className="ClientDashboard-payment-line"><span><FiCalendar /> Next Due Date</span><strong>{formatDate(paymentSummary.nextDueDate)}</strong></div>
          <div className="ClientDashboard-due-box">
            <small>{paymentSummary.outstanding > 0 ? 'Due Soon' : 'No Due'}</small>
            <p>{paymentSummary.planName} <strong>{formatMoney(paymentSummary.outstanding)}</strong></p>
            <button type="button" onClick={() => navigate('/client/payments')}>Pay Now</button>
          </div>
          <button type="button" className="ClientDashboard-link-button ClientDashboard-view-invoices-button" onClick={() => navigate('/client/payments')}>View All Invoices <FiChevronRight /></button>
        </article>

        <article className="ClientDashboard-card ClientDashboard-support-card">
          <div className="ClientDashboard-card-head">
            <h3>Support Tickets</h3>
          </div>
          <div className="ClientDashboard-ticket-stats">
            <div><FiHeadphones /><span>Open Tickets</span><strong>{supportTicketsLoading ? '...' : openSupportTicketCount}</strong></div>
            <div><FiCheckCircle /><span>Resolved Tickets</span><strong>{supportTicketsLoading ? '...' : resolvedSupportTicketCount}</strong></div>
          </div>
          <h4>Recent Tickets</h4>
          {supportTicketsLoading && <p className="ClientDashboard-inline-state">Loading support tickets...</p>}
          {!supportTicketsLoading && supportTicketsError && <p className="ClientDashboard-inline-state ClientDashboard-inline-state--error">{supportTicketsError}</p>}
          {!supportTicketsLoading && !supportTicketsError && recentSupportTickets.map(ticket => (
            <div className="ClientDashboard-ticket-row" key={ticket[0]}>
              <FiFileText />
              <p><strong>{ticket[0]}</strong><span>{ticket[1]}</span></p>
              <em className={`ClientDashboard-ticket-${getTicketStatusClass(ticket[2])}`}>{ticket[2]}</em>
            </div>
          ))}
          {!supportTicketsLoading && !supportTicketsError && !recentSupportTickets.length && (
            <div className="ClientDashboard-empty-row">No support tickets found.</div>
          )}
          {!supportTicketsLoading && !supportTicketsError && (
            <button
              type="button"
              className="ClientDashboard-support-view-all"
              onClick={openSupportTickets}
            >
              View All <FiChevronRight />
            </button>
          )}
        </article>

        <article className="ClientDashboard-card ClientDashboard-actions-card">
          <div className="ClientDashboard-actions-heading"><span><FiGrid /></span><div><h3>Quick Actions</h3><small>Manage your services quickly</small></div></div>
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
          <button type="button" className="ClientDashboard-all-services" onClick={() => navigate('/client/my-services')}><FiGrid /> View All Services <FiChevronRight /></button>
        </article>
      </section>

      {detailsModal && (
        <div className="ClientDashboard-modal-backdrop" role="presentation" onClick={() => setDetailsModal(null)}>
          <section
            className={`ClientDashboard-details-modal ${detailsModal === 'support' ? 'ClientDashboard-support-ticket-modal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ClientDashboard-details-title"
            onClick={event => event.stopPropagation()}
          >
            {detailsModal === 'support' ? (
              <header className="ClientDashboard-support-ticket-head">
                <div className="ClientDashboard-support-ticket-title">
                  <span className="ClientDashboard-support-headset"><FiHeadphones /></span>
                  <div><small>Client Dashboard</small><h3 id="ClientDashboard-details-title">Support Tickets</h3><p>View and manage all your support requests in one place.</p></div>
                </div>
                <button type="button" aria-label="Close support tickets" onClick={() => setDetailsModal(null)}><FiX /></button>
              </header>
            ) : (
              <header className="ClientDashboard-modal-head">
                <div><span>Client Dashboard</span><h3 id="ClientDashboard-details-title">{modalTitle[detailsModal]}</h3></div>
                <button type="button" aria-label="Close details" onClick={() => setDetailsModal(null)}><FiX /></button>
              </header>
            )}

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
              <div className="ClientDashboard-support-ticket-body">
                <div className="ClientDashboard-support-ticket-toolbar">
                  <div className="ClientDashboard-support-ticket-tabs" role="tablist" aria-label="Ticket categories">
                    <button type="button" className={supportTicketTab === 'all' ? 'active' : ''} onClick={() => setSupportTicketTab('all')}>All Tickets <b>{supportTickets.length}</b></button>
                    <button type="button" className={supportTicketTab === 'closed' ? 'active' : ''} onClick={() => setSupportTicketTab('closed')}>Closed <b>{resolvedSupportTicketCount}</b></button>
                  </div>
                  <label className="ClientDashboard-support-ticket-filter"><FiFilter /><span>Filter</span><FiChevronRight /><select aria-label="Filter support tickets" value={supportTicketFilter} onChange={event => setSupportTicketFilter(event.target.value)}><option value="all">All tickets</option><option value="open">Open</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
                </div>
                <div className="ClientDashboard-support-ticket-scroll">
                {supportTicketsLoading && <p className="ClientDashboard-modal-empty">Loading support tickets...</p>}
                {!supportTicketsLoading && supportTicketsError && <p className="ClientDashboard-modal-empty">{supportTicketsError}</p>}
                {!supportTicketsLoading && !supportTicketsError && supportModalTickets.map(ticket => (
                  <button type="button" className="ClientDashboard-support-ticket-row" key={ticket[0]} onClick={() => navigate('/client/support-tickets', { state: { ticketId: ticket[4] } })}>
                    <span><FiFileText /></span><p><strong>{ticket[0]}</strong><small>{ticket[1]}</small></p><time>{formatSupportTicketTime(ticket[3])}</time><em className={`ClientDashboard-ticket-${getTicketStatusClass(ticket[2])}`}>●&nbsp;{ticket[2]}</em>
                  </button>
                ))}
                {!supportTicketsLoading && !supportTicketsError && !supportModalTickets.length && <p className="ClientDashboard-modal-empty">No support tickets match this filter.</p>}
                </div>
              </div>
            )}
            {detailsModal === 'support' && <footer className="ClientDashboard-support-ticket-foot"><div><span><FiHeadphones /></span><p><strong>Can't find what you're looking for?</strong><small>Contact our support team and we'll be happy to help.</small></p></div><button type="button" onClick={() => navigate('/client/support-tickets')}><FiMessageCircle /> Contact Support</button></footer>}
          </section>
        </div>
      )}
    </div>
  );

   
};
export default Dashboard;
