import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../../config';
import {
  calculatePaymentSummary,
  calculateTaskStats,
  formatDate,
  formatPublicId,
  isClientTaskOverdue,
  applyClientSubscriptionDueDates,
  CLIENT_PORTAL_SELECTED_CLIENT_KEY,
  CLIENT_PORTAL_SELECTION_EVENT,
  getClientPortalCompanyContext,
  getCompanyScopedClientParams,
  CLIENT_PORTAL_REQUEST_TIMEOUT_MS
} from '../../utils/clientPortalData';
import './ClientDashboardPage.css';

import {
  FiSun,
  FiMoon,
  FiSunset,
  FiCalendar,
  FiPackage,
  FiFileText,
  FiCheckCircle,
  FiBell,
  FiHeadphones,
  FiClock,
  FiMessageSquare,
  FiPhone,
  FiMail,
  FiUser,
  FiMapPin,
  FiMoreVertical,
  FiArrowRight,
  FiArrowUp,
  FiChevronRight,
  FiChevronDown,
  FiBarChart2,
  FiLayers,
  FiZap,
  FiCreditCard,
  FiUpload,
  FiX,
  FiFilter,
  FiMessageCircle
} from 'react-icons/fi';

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

// Mini SVG sparklines
const MiniWaveSparkline = ({ color = '#3b82f6', isNeutral = false }) => {
  if (isNeutral) {
    return (
      <svg width="56" height="24" viewBox="0 0 56 24" fill="none" className="ClientDashboard-wave-sparkline">
        <path
          d="M2,14 Q16,8 28,14 T54,10"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="56" height="24" viewBox="0 0 56 24" fill="none" className="ClientDashboard-wave-sparkline">
      <path
        d="M2,18 C14,24 22,20 32,10 C40,-2 48,16 54,6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const MiniBarSparkline = ({ color = '#3b82f6', heights = [40, 65, 50, 85, 100] }) => (
  <svg width="38" height="22" viewBox="0 0 38 22" className="ClientDashboard-bar-sparkline">
    {heights.map((h, i) => (
      <rect
        key={i}
        x={i * 7.5 + 2}
        y={22 - (h / 100) * 20}
        width="4.2"
        height={(h / 100) * 20}
        rx="2"
        fill={color}
        opacity={0.35 + (i / heights.length) * 0.65}
      />
    ))}
  </svg>
);

const DonutRing = ({ percent = 0, size = 138, strokeWidth = 14, color = '#3b82f6', trackColor = '#e2e8f0', children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="ClientDashboard-donut-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ClientDashboard-donut-inner">
        {children}
      </div>
    </div>
  );
};

const AvatarStack = ({ count = 2 }) => (
  <div className="ClientDashboard-avatar-stack">
    <img
      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&auto=format&fit=crop&crop=faces"
      alt="Member 1"
      className="ClientDashboard-table-avatar"
    />
    <img
      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&auto=format&fit=crop&crop=faces"
      alt="Member 2"
      className="ClientDashboard-table-avatar"
    />
    <img
      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&auto=format&fit=crop&crop=faces"
      alt="Member 3"
      className="ClientDashboard-table-avatar"
    />
    <span className="ClientDashboard-avatar-more">+{count}</span>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('client') || 'null');
    } catch {
      return null;
    }
  });
  const [availableClients, setAvailableClients] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('client_available_clients') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
      const current = JSON.parse(localStorage.getItem('client') || 'null');
      return current ? [current] : [];
    } catch {
      return [];
    }
  });
  const [companyTaskCounts, setCompanyTaskCounts] = useState({});
  const [services, setServices] = useState(() => {
    try {
      const current = JSON.parse(localStorage.getItem('client') || 'null');
      return Array.isArray(current?.services) ? current.services : [];
    } catch {
      return [];
    }
  });
  const [projectManagers, setProjectManagers] = useState([]);
  const [serviceTasks, setServiceTasks] = useState([]);
  const [supportTicketsData, setSupportTicketsData] = useState([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(false);
  const [supportTicketsError, setSupportTicketsError] = useState('');
  const [isDashboardLoading, setIsDashboardLoading] = useState(() => {
    return !localStorage.getItem('client');
  });
  const [companyInfo, setCompanyInfo] = useState(() => getClientPortalCompanyContext());
  const [dashboardFilter, setDashboardFilter] = useState('active-services');
  const [detailsModal, setDetailsModal] = useState(null);
  const [supportTicketTab, setSupportTicketTab] = useState('all');
  const [supportTicketFilter, setSupportTicketFilter] = useState('all');

  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);
  const isFetchingRef = useRef(false);

  const { api, tasksApi, usersApi, supportApi } = React.useMemo(() => {
    const attachAuth = (instance) => {
      instance.interceptors.request.use((config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }, (err) => Promise.reject(err));
      return instance;
    };

    return {
      api: attachAuth(axios.create({ baseURL: `${API_URL}/clientsservice`, timeout: CLIENT_PORTAL_REQUEST_TIMEOUT_MS })),
      tasksApi: attachAuth(axios.create({ baseURL: `${API_URL}/tasks/client-tasks`, timeout: CLIENT_PORTAL_REQUEST_TIMEOUT_MS })),
      usersApi: attachAuth(axios.create({ baseURL: `${API_URL}/users`, timeout: CLIENT_PORTAL_REQUEST_TIMEOUT_MS })),
      supportApi: attachAuth(axios.create({ baseURL: API_URL, timeout: CLIENT_PORTAL_REQUEST_TIMEOUT_MS })),
    };
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const handleSelectionChange = () => {
      initialFetchDone.current = true;
      fetchClientData(false);
    };
    window.addEventListener(CLIENT_PORTAL_SELECTION_EVENT, handleSelectionChange);
    return () => {
      isMounted.current = false;
      window.removeEventListener(CLIENT_PORTAL_SELECTION_EVENT, handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    setCompanyInfo(getClientPortalCompanyContext());
  }, []);

  const fetchServiceTasks = async (clientId, serviceName) => {
    try {
      const encodedService = encodeURIComponent(serviceName);
      const response = await tasksApi.get(`/client/${clientId}/service/${encodedService}`);
      if (response.data?.success) {
        return response.data.data || [];
      }
      return [];
    } catch {
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
    } catch {
      return [];
    }
  };

  const fetchAllServicesTasks = async (currentClient, servicesList) => {
    try {
      const taskResults = await Promise.all(
        servicesList.map(async (service) => {
          const tasks = await fetchServiceTasks(currentClient._id, service);
          return tasks.map(task => ({ ...task, serviceName: service }));
        })
      );

      if (isMounted.current) {
        setServiceTasks(applyClientSubscriptionDueDates(taskResults.flat(), currentClient));
      }
    } catch {
      if (isMounted.current) setServiceTasks([]);
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
    } catch (err) {
      if (isMounted.current) {
        setSupportTicketsError(err.response?.data?.message || 'Failed to load support tickets');
        setSupportTicketsData([]);
      }
    } finally {
      if (isMounted.current) {
        setSupportTicketsLoading(false);
      }
    }
  };

  const fetchDashboardOverview = async (user, storedClient) => {
    const requestCompanyInfo = getClientPortalCompanyContext(user, storedClient);
    if (!requestCompanyInfo.companyCode) return false;

    try {
      setSupportTicketsLoading(true);
      const selectedClientId = normalizeMatchValue(localStorage.getItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY));
      const storedClientId = selectedClientId || normalizeMatchValue(storedClient?._id || storedClient?.id || storedClient?.clientId);
      const response = await api.get('/dashboard-overview', {
        params: {
          ...getCompanyScopedClientParams(requestCompanyInfo),
          selectedClientId: storedClientId || undefined
        }
      });

      const overview = response.data?.data;
      if (!response.data?.success || !overview) return false;
      if (!isMounted.current) return true;

      const matchingClients = overview.availableClients || [];
      const currentClient = overview.client || null;
      setAvailableClients(matchingClients);
      if (matchingClients.length > 0) {
        localStorage.setItem('client_available_clients', JSON.stringify(matchingClients));
      }
      fetchCompaniesTaskSummary(matchingClients);

      if (currentClient) {
        setClient(currentClient);
        localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, String(currentClient._id));
        localStorage.setItem('client', JSON.stringify(currentClient));
        setServices(overview.services || currentClient.services || []);
        setProjectManagers(overview.projectManagers || []);
        setServiceTasks(applyClientSubscriptionDueDates(overview.serviceTasks || [], currentClient));
        setSupportTicketsData(Array.isArray(overview.supportTickets) ? overview.supportTickets : []);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      if (isMounted.current) {
        setSupportTicketsLoading(false);
      }
    }
  };

  const fetchClientData = async (forceSpinner = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!isMounted.current) return;
      if (forceSpinner) {
        setIsDashboardLoading(true);
      }

      const userStr = localStorage.getItem('user');
      if (!userStr) {
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
      const overviewLoaded = await fetchDashboardOverview(user, storedClient);
      if (overviewLoaded) {
        return;
      }

      const requestCompanyInfo = getClientPortalCompanyContext(user, storedClient);
      if (!requestCompanyInfo.companyCode) {
        return;
      }

      const [companyUsers, response] = await Promise.all([
        fetchCompanyUsers(user),
        api.get('/', {
          params: {
            ...getCompanyScopedClientParams(requestCompanyInfo),
            limit: 1000
          }
        })
      ]);

      if (response.data?.success && isMounted.current) {
        const allClients = response.data.data || [];
        const userAssignedClientId = normalizeMatchValue(
          parseAdditionalDetails(user?.additionalDetails)?.clientId || user?.clientId
        );
        const userEmail = normalizeMatchValue(user?.email);

        const matchingClients = allClients
          .filter(item => isClientForLoggedInUser(item, user))
          .sort((a, b) => {
            const aId = normalizeMatchValue(a?._id || a?.id || a?.clientId);
            const bId = normalizeMatchValue(b?._id || b?.id || b?.clientId);
            const aEmail = normalizeMatchValue(a?.email || a?.clientEmail);
            const bEmail = normalizeMatchValue(b?.email || b?.clientEmail);

            if (userAssignedClientId) {
              if (aId === userAssignedClientId && bId !== userAssignedClientId) return -1;
              if (bId === userAssignedClientId && aId !== userAssignedClientId) return 1;
            }
            if (userEmail) {
              if (aEmail === userEmail && bEmail !== userEmail) return -1;
              if (bEmail === userEmail && aEmail !== userEmail) return 1;
            }
            return 0;
          });
        const effectiveClients = matchingClients.length > 0 ? matchingClients : allClients;
        setAvailableClients(effectiveClients);
        if (effectiveClients.length > 0) {
          localStorage.setItem('client_available_clients', JSON.stringify(effectiveClients));
        }
        fetchCompaniesTaskSummary(effectiveClients);
        const selectedClientId = normalizeMatchValue(localStorage.getItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY));
        const storedClientId = selectedClientId || normalizeMatchValue(storedClient?._id || storedClient?.id || storedClient?.clientId);

        const currentClient = (
          storedClientId
            ? effectiveClients.find(item => normalizeMatchValue(item?._id || item?.id) === storedClientId)
            : null
        ) || effectiveClients.find(item => String(item?.status || 'Active').toLowerCase() === 'active') || effectiveClients[0] || null;

        if (currentClient) {
          setClient(currentClient);
          localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, String(currentClient._id));
          localStorage.setItem('client', JSON.stringify(currentClient));
          setProjectManagers(collectProjectMembers(currentClient, companyUsers));
          fetchSupportTickets();

          const clientServices = Array.isArray(currentClient.services) ? currentClient.services : [];
          setServices(clientServices);
          if (clientServices.length > 0) {
            await fetchAllServicesTasks(currentClient, clientServices);
          } else {
            setServiceTasks([]);
          }
        } else {
          setClient(null);
          setServices([]);
          setServiceTasks([]);
          setProjectManagers([]);
        }
      }
    } catch {
      // Graceful fallback to default state
    } finally {
      isFetchingRef.current = false;
      if (isMounted.current) {
        setIsDashboardLoading(false);
      }
    }
  };

  useEffect(() => {
    if ((companyInfo.companyCode || companyInfo.companyIdentifier) && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchClientData(false);
    }
  }, [companyInfo.companyCode, companyInfo.companyIdentifier]);

  const handleCompanySelect = nextClient => {
    if (!nextClient?._id) return;
    const nextClientId = String(nextClient._id);
    localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, nextClientId);
    localStorage.setItem('client', JSON.stringify(nextClient));
    window.dispatchEvent(new CustomEvent(CLIENT_PORTAL_SELECTION_EVENT, {
      detail: { clientId: nextClientId }
    }));
  };

  // Calculations
  const taskStats = calculateTaskStats(serviceTasks);
  const paymentSummary = calculatePaymentSummary(client);
  const openTasksCalculated = taskStats.pendingTasks + taskStats.overdueTasks + taskStats.inProgressTasks;
  const openTasksCount = openTasksCalculated;
  const activeServicesCount = services.length;
  const totalTasksCount = taskStats.totalTasks || 0;
  const completedTasksPct = totalTasksCount > 0 ? Math.round(((taskStats.completedTasks || 0) / totalTasksCount) * 100) : 0;
  const inProgressTasksPct = totalTasksCount > 0 ? Math.round(((taskStats.inProgressTasks || 0) / totalTasksCount) * 100) : 0;
  const pendingTasksPct = totalTasksCount > 0 ? Math.round(((taskStats.pendingTasks || 0) / totalTasksCount) * 100) : 0;
  const overdueTasksPct = totalTasksCount > 0 ? Math.round(((taskStats.overdueTasks || 0) / totalTasksCount) * 100) : 0;
  const notStartedTasksCount = (taskStats.pendingTasks || 0) + (taskStats.overdueTasks || 0);
  const notStartedTasksPct = totalTasksCount > 0 ? Math.round((notStartedTasksCount / totalTasksCount) * 100) : 0;

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

  const dynamicServiceRows = services.map(serviceName => {
    const tasks = serviceTasks.filter(task => task.serviceName === serviceName);
    const completed = tasks.filter(task => task.completed === true).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const latestSub = client?.subscription?.[client?.subscription?.length - 1];
    return {
      name: serviceName,
      team: projectManagers[0]?.role || projectManagers[0]?.name || 'Assigned Team',
      start: formatDate(client?.subscription?.[0]?.startDate || client?.subscriptionStartDate || client?.createdAt),
      deadline: formatDate(latestSub?.endDate || client?.subscriptionEndDate),
      progress: percent,
      status: tasks.length && percent === 100 ? 'Completed' : 'In Progress'
    };
  });

  const filteredServiceRows = dynamicServiceRows.filter(row => {
    if (dashboardFilter === 'active-services') return true;
    return serviceTasks
      .filter(task => task.serviceName === row.name)
      .some(task => taskMatchesFilter(task, dashboardFilter));
  });

  const displayServiceRows = filteredServiceRows.length > 0
    ? filteredServiceRows.slice(0, 4)
    : dynamicServiceRows.slice(0, 4);

  const supportTickets = supportTicketsData
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .map(mapSupportTicketRow);

  const displayTickets = supportTickets.slice(0, 3).map(t => ({ id: t[0], subject: t[1], status: t[2], fullId: t[4] }));

  const openSupportTicketCount = supportTicketsData.filter(
    ticket => !closedTicketStatuses.has(String(ticket.status || '').toLowerCase())
  ).length;
  const resolvedSupportTicketCount = supportTicketsData.filter(
    ticket => closedTicketStatuses.has(String(ticket.status || '').toLowerCase())
  ).length;

  const openSupportTickets = () => {
    setSupportTicketTab('all');
    setSupportTicketFilter('all');
    setDetailsModal('support');
  };

  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const clientName = client?.company || client?.businessName || client?.client || client?.name || user?.name || user?.fullName || 'Client';
  const clientEmail = client?.email || user?.email || '—';
  const clientPhone = client?.phone || user?.phone || '—';
  const clientLocation = client?.city || client?.address || user?.city || user?.address || '—';
  const clientFormattedId = (client && formatPublicId('CLT', client)) || '—';
  const clientAccountManager = projectManagers[0]?.name || 'Unassigned';

  const dynamicCompanyCards = availableClients.map((item, idx) => {
    const companyName = item.company || item.businessName || item.companyName || item.client || 'Company';
    const serviceCount = Array.isArray(item.services) ? item.services.length : 0;
    const taskCount = Array.isArray(item.tasks) ? item.tasks.length : 0;
    const status = item.status || item.accountStatus || 'Active';
    const id = normalizeMatchValue(item?._id || item?.id);
    const selectedClientId = normalizeMatchValue(client?._id || client?.id);
    return {
      client: item,
      id: id || `comp-${idx}`,
      companyName,
      serviceCount,
      taskCount,
      status,
      isActive: id && id === selectedClientId,
      initial: companyName.charAt(0).toUpperCase(),
      bgType: idx % 2 === 0 ? 'blue' : 'purple'
    };
  });

  const displayCompanyCards = dynamicCompanyCards
    .slice()
    .sort((a, b) => Number(b.isActive) - Number(a.isActive));

  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const greetingData = React.useMemo(() => {
    const hour = currentDateTime.getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning,', icon: 'morning' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon,', icon: 'afternoon' };
    } else if (hour >= 17 && hour < 21) {
      return { text: 'Good Evening,', icon: 'evening' };
    } else {
      return { text: 'Good Night,', icon: 'night' };
    }
  }, [currentDateTime]);

  const currentDateTimeFormatted = React.useMemo(() => {
    return {
      date: currentDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    };
  }, [currentDateTime]);

  if (isDashboardLoading && !client) {
    return (
      <div className="ClientDashboard-client-dashboard ClientDashboard-loading-state">
        <div className="ClientDashboard-top-row">
          <div className="ClientDashboard-skeleton-card ClientDashboard-hero-skeleton" style={{ flex: 1 }}>
            <div className="ClientDashboard-skeleton" style={{ height: '32px', width: '240px', marginBottom: '12px' }} />
            <div className="ClientDashboard-skeleton" style={{ height: '20px', width: '340px', marginBottom: '24px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {[1, 2, 3, 4].map(k => (
                <div key={k} className="ClientDashboard-skeleton" style={{ height: '90px', borderRadius: '12px' }} />
              ))}
            </div>
          </div>
          <div className="ClientDashboard-skeleton-card" style={{ width: '320px', minWidth: '280px', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            <div className="ClientDashboard-skeleton" style={{ height: '64px', width: '64px', borderRadius: '50%' }} />
            <div className="ClientDashboard-skeleton" style={{ height: '22px', width: '180px' }} />
            <div className="ClientDashboard-skeleton" style={{ height: '16px', width: '140px' }} />
          </div>
        </div>

        <div className="ClientDashboard-skeleton-card" style={{ marginTop: '20px' }}>
          <div className="ClientDashboard-skeleton" style={{ height: '20px', width: '160px', marginBottom: '16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {[1, 2].map(k => (
              <div key={k} className="ClientDashboard-skeleton" style={{ height: '76px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {[1, 2, 3, 4].map(k => (
            <div key={k} className="ClientDashboard-skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ClientDashboard-client-dashboard">

      {/* SECTION 1: Top Hero Banner + Profile Card */}
      <div className="ClientDashboard-top-row">
        {/* Left Hero Card */}
        <section className="ClientDashboard-hero-card">
          {/* Subtle Pastel Wave Graphic in the Background */}
          <div className="ClientDashboard-hero-bg-wave" aria-hidden="true">
            <svg viewBox="0 0 850 160" preserveAspectRatio="none">
              <path
                d="M 0,90 C 180,140 280,40 450,95 C 600,140 720,70 850,85 L 850,160 L 0,160 Z"
                fill="url(#hero-ribbon-gradient)"
                opacity="0.28"
              />
              <path
                d="M 0,110 C 220,150 350,60 520,110 C 680,150 780,95 850,105 L 850,160 L 0,160 Z"
                fill="url(#hero-ribbon-gradient-2)"
                opacity="0.18"
              />
              <defs>
                <linearGradient id="hero-ribbon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity="0.4" />
                  <stop offset="35%" stopColor="#a855f7" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="hero-ribbon-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="ClientDashboard-hero-top">
            <div className="ClientDashboard-hero-greeting">
              <div className="ClientDashboard-sun-icon" aria-hidden="true">
                {greetingData.icon === 'night' ? (
                  <FiMoon />
                ) : greetingData.icon === 'evening' ? (
                  <FiSunset />
                ) : (
                  <FiSun />
                )}
              </div>
              <div className="ClientDashboard-greeting-text">
                <h2>{greetingData.text}</h2>
                <h1>{clientName}! <span className="ClientDashboard-wave-emoji">👋</span></h1>
                <p>Stay on top of your services, tasks, and payments.</p>
              </div>
            </div>

            <div className="ClientDashboard-hero-visual-wrap">
              <div className="ClientDashboard-date-pill">
                <FiCalendar className="ClientDashboard-pill-cal-icon" />
                <div className="ClientDashboard-pill-datetime">
                  <span className="ClientDashboard-pill-date">{currentDateTimeFormatted.date}</span>
                  <span className="ClientDashboard-pill-time">{currentDateTimeFormatted.time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Mini Stat Cards inside Hero */}
          <div className="ClientDashboard-hero-mini-stats">
            {/* 1: Active Services */}
            <div className="ClientDashboard-mini-stat-card">
              <div className="ClientDashboard-mini-stat-icon ClientDashboard-mini-icon--blue">
                <FiPackage />
              </div>
              <div className="ClientDashboard-mini-stat-info">
                <span className="ClientDashboard-mini-label">Active Services</span>
                <span className="ClientDashboard-mini-val">{activeServicesCount}</span>
                <span className="ClientDashboard-mini-trend positive">
                  <FiArrowUp /> 12% <small>vs last month</small>
                </span>
              </div>
              <div className="ClientDashboard-mini-stat-wave">
                <MiniWaveSparkline color="#3b82f6" />
              </div>
            </div>

            {/* 2: Pending Invoices */}
            <div className="ClientDashboard-mini-stat-card">
              <div className="ClientDashboard-mini-stat-icon ClientDashboard-mini-icon--orange">
                <FiFileText />
              </div>
              <div className="ClientDashboard-mini-stat-info">
                <span className="ClientDashboard-mini-label">Pending Invoices</span>
                <span className="ClientDashboard-mini-val val-orange">{paymentSummary.unpaidInvoices || 0}</span>
                <span className="ClientDashboard-mini-trend neutral">
                  – 0% <small>vs last month</small>
                </span>
              </div>
              <div className="ClientDashboard-mini-stat-wave">
                <MiniWaveSparkline color="#f97316" isNeutral={true} />
              </div>
            </div>

            {/* 3: Open Tasks */}
            <div className="ClientDashboard-mini-stat-card">
              <div className="ClientDashboard-mini-stat-icon ClientDashboard-mini-icon--green">
                <FiCheckCircle />
              </div>
              <div className="ClientDashboard-mini-stat-info">
                <span className="ClientDashboard-mini-label">Open Tasks</span>
                <span className="ClientDashboard-mini-val">{openTasksCount}</span>
                <span className="ClientDashboard-mini-trend negative">
                  <FiArrowUp /> 8% <small>vs last month</small>
                </span>
              </div>
              <div className="ClientDashboard-mini-stat-wave">
                <MiniWaveSparkline color="#10b981" />
              </div>
            </div>

            {/* 4: Recent Updates */}
            <div className="ClientDashboard-mini-stat-card">
              <div className="ClientDashboard-mini-stat-icon ClientDashboard-mini-icon--purple">
                <FiBell />
              </div>
              <div className="ClientDashboard-mini-stat-info">
                <span className="ClientDashboard-mini-label">Recent Updates</span>
                <span className="ClientDashboard-mini-val val-purple">2</span>
                <span className="ClientDashboard-mini-trend positive">
                  <FiArrowUp /> 100% <small>vs last month</small>
                </span>
              </div>
              <div className="ClientDashboard-mini-stat-wave">
                <MiniWaveSparkline color="#8b5cf6" />
              </div>
            </div>
          </div>
        </section>

        {/* Right Profile Card */}
        <section className="ClientDashboard-profile-card">
          <div className="ClientDashboard-profile-header">
            <div className="ClientDashboard-profile-avatar-wrap">
              <div className="ClientDashboard-profile-avatar">
                {clientName.charAt(0).toUpperCase()}
              </div>
              <span className="ClientDashboard-online-dot" title="Online"></span>
            </div>

            <div className="ClientDashboard-profile-details">
              <div className="ClientDashboard-profile-name-row">
                <h3 className="ClientDashboard-profile-name">{clientName}</h3>
                <span className="ClientDashboard-role-badge">Client</span>
                <button type="button" className="ClientDashboard-more-btn" aria-label="More options">
                  <FiMoreVertical />
                </button>
              </div>

              <div className="ClientDashboard-profile-contact-list">
                <div className="ClientDashboard-profile-contact-item">
                  <FiMail className="ClientDashboard-contact-icon" />
                  <span>{clientEmail}</span>
                </div>
                <div className="ClientDashboard-profile-contact-item">
                  <FiPhone className="ClientDashboard-contact-icon" />
                  <span>{clientPhone}</span>
                </div>
                <div className="ClientDashboard-profile-contact-item">
                  <FiMapPin className="ClientDashboard-contact-icon" />
                  <span>{clientLocation}</span>
                </div>
                <div className="ClientDashboard-profile-contact-item">
                  <FiCalendar className="ClientDashboard-contact-icon" />
                  <span>Client ID: {clientFormattedId}</span>
                </div>
                <div className="ClientDashboard-profile-contact-item">
                  <FiUser className="ClientDashboard-contact-icon" />
                  <span>Account Manager: {clientAccountManager}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Bottom Action Circles */}
          <div className="ClientDashboard-profile-actions">
            <button
              type="button"
              className="ClientDashboard-action-item"
              onClick={() => navigate('/client/support-tickets')}
            >
              <div className="ClientDashboard-action-circle ClientDashboard-action-circle--blue">
                <FiMessageSquare />
              </div>
              <span>Message</span>
            </button>

            <a
              href={`tel:${clientPhone}`}
              className="ClientDashboard-action-item"
            >
              <div className="ClientDashboard-action-circle ClientDashboard-action-circle--green">
                <FiPhone />
              </div>
              <span>Call</span>
            </a>

            <a
              href={`mailto:${clientEmail}`}
              className="ClientDashboard-action-item"
            >
              <div className="ClientDashboard-action-circle ClientDashboard-action-circle--orange">
                <FiMail />
              </div>
              <span>Email</span>
            </a>
          </div>
        </section>
      </div>

      {/* SECTION 2: Your Companies */}
      <section className="ClientDashboard-companies-section">
        <div className="ClientDashboard-companies-header">
          <div className="ClientDashboard-companies-title">
            <div className="ClientDashboard-companies-icon-badge">
              <FiCalendar />
            </div>
            <div>
              <h3>Your Companies</h3>
              <p>Manage and switch between your connected companies.</p>
            </div>
          </div>
        </div>

        <div className="ClientDashboard-companies-grid">
          {displayCompanyCards.length > 0 ? displayCompanyCards.map((company) => (
            <div
              key={company.id}
              className={`ClientDashboard-company-box ${company.isActive ? 'active' : ''}`}
              onClick={() => company.client && handleCompanySelect(company.client)}
              role="button"
              tabIndex={0}
            >
              <div className={`ClientDashboard-company-initial-badge ${company.bgType}`}>
                {company.initial}
              </div>

              <div className="ClientDashboard-company-box-info">
                <h4>{company.companyName}</h4>
                <p>{company.serviceCount} services • {company.taskCount} tasks</p>
              </div>

              <span className="ClientDashboard-company-status-badge">
                {company.status}
              </span>

              <div className="ClientDashboard-company-thumb-wrap">
                <img
                  src="/company_building.jpg"
                  alt={company.companyName}
                  className="ClientDashboard-company-thumb-img"
                />
                <FiChevronRight className="ClientDashboard-company-chevron" />
              </div>
            </div>
          )) : (
            <div className="ClientDashboard-modal-empty" style={{ padding: '16px', gridColumn: '1 / -1' }}>
              No client companies found in this workspace.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: KPI Metrics Row (4 Cards) */}
      <section className="ClientDashboard-kpi-grid">
        {/* KPI 1: Active Services */}
        <div
          className={`ClientDashboard-kpi-card ${dashboardFilter === 'active-services' ? 'active' : ''}`}
          onClick={() => setDashboardFilter('active-services')}
          role="button"
          tabIndex={0}
        >
          <div className="ClientDashboard-kpi-circle-icon ClientDashboard-kpi-circle--blue">
            <FiPackage />
          </div>
          <div className="ClientDashboard-kpi-data">
            <span className="ClientDashboard-kpi-title">Active Services</span>
            <span className="ClientDashboard-kpi-number">{activeServicesCount}</span>
            <small className="ClientDashboard-kpi-sub">Live data from client portal</small>
          </div>
          <div className="ClientDashboard-kpi-visual">
            <MiniBarSparkline color="#3b82f6" heights={[30, 60, 45, 80, 100]} />
            <span className="ClientDashboard-kpi-percent positive">
              <FiArrowUp /> {activeServicesCount > 0 ? '100%' : '0%'}
            </span>
          </div>
        </div>

        {/* KPI 2: Completed Tasks */}
        <div
          className={`ClientDashboard-kpi-card ${dashboardFilter === 'completed-tasks' ? 'active' : ''}`}
          onClick={() => setDashboardFilter('completed-tasks')}
          role="button"
          tabIndex={0}
        >
          <div className="ClientDashboard-kpi-circle-icon ClientDashboard-kpi-circle--green">
            <FiCheckCircle />
          </div>
          <div className="ClientDashboard-kpi-data">
            <span className="ClientDashboard-kpi-title">Completed Tasks</span>
            <span className="ClientDashboard-kpi-number">{taskStats.completedTasks || 0}</span>
            <small className="ClientDashboard-kpi-sub">Live data from client portal</small>
          </div>
          <div className="ClientDashboard-kpi-visual">
            <MiniBarSparkline color="#10b981" heights={[35, 50, 40, 75, 95]} />
            <span className="ClientDashboard-kpi-percent positive">
              <FiArrowUp /> {completedTasksPct}%
            </span>
          </div>
        </div>

        {/* KPI 3: Pending Tasks */}
        <div
          className={`ClientDashboard-kpi-card ${dashboardFilter === 'pending-tasks' ? 'active' : ''}`}
          onClick={() => setDashboardFilter('pending-tasks')}
          role="button"
          tabIndex={0}
        >
          <div className="ClientDashboard-kpi-circle-icon ClientDashboard-kpi-circle--orange">
            <FiClock />
          </div>
          <div className="ClientDashboard-kpi-data">
            <span className="ClientDashboard-kpi-title">Pending Tasks</span>
            <span className="ClientDashboard-kpi-number">{taskStats.pendingTasks || 0}</span>
            <small className="ClientDashboard-kpi-sub">Live data from client portal</small>
          </div>
          <div className="ClientDashboard-kpi-visual">
            <MiniBarSparkline color="#f97316" heights={[40, 55, 70, 85, 100]} />
            <span className="ClientDashboard-kpi-percent warning">
              <FiArrowUp /> {pendingTasksPct}%
            </span>
          </div>
        </div>

        {/* KPI 4: Open Tasks */}
        <div
          className={`ClientDashboard-kpi-card ${dashboardFilter === 'open-tasks' ? 'active' : ''}`}
          onClick={() => setDashboardFilter('open-tasks')}
          role="button"
          tabIndex={0}
        >
          <div className="ClientDashboard-kpi-circle-icon ClientDashboard-kpi-circle--purple">
            <FiHeadphones />
          </div>
          <div className="ClientDashboard-kpi-data">
            <span className="ClientDashboard-kpi-title">Open Tasks</span>
            <span className="ClientDashboard-kpi-number">{openTasksCount}</span>
            <small className="ClientDashboard-kpi-sub">Live data from client portal</small>
          </div>
          <div className="ClientDashboard-kpi-visual">
            <MiniBarSparkline color="#8b5cf6" heights={[30, 45, 60, 90, 75]} />
            <span className="ClientDashboard-kpi-percent danger">
              <FiArrowUp /> {overdueTasksPct}%
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4: Middle Grid (Service Progress Overview | Active Services Table | Task Distribution) */}
      <section className="ClientDashboard-middle-grid">
        {/* Col 1: Service Progress Overview */}
        <article className="ClientDashboard-card ClientDashboard-progress-card">
          <div className="ClientDashboard-card-topbar">
            <div className="ClientDashboard-card-topbar-title">
              <FiBarChart2 className="ClientDashboard-card-topbar-icon" />
              <h3>Service Progress Overview</h3>
            </div>
            <button
              type="button"
              className="ClientDashboard-view-all-link"
              onClick={() => navigate('/client/my-services')}
            >
              View All
            </button>
          </div>

          <div className="ClientDashboard-progress-donut-area">
            <DonutRing percent={completedTasksPct} color="#3b82f6" trackColor="#e2e8f0">
              <span className="ClientDashboard-donut-main-number">{completedTasksPct}%</span>
              <span className="ClientDashboard-donut-sub-text">Overall Progress</span>
            </DonutRing>
          </div>

          <div className="ClientDashboard-progress-legend-list">
            <div className="ClientDashboard-legend-line">
              <div className="ClientDashboard-legend-name">
                <span className="ClientDashboard-color-dot green"></span>
                <span>Completed</span>
              </div>
              <span className="ClientDashboard-legend-count">{taskStats.completedTasks || 0} ({completedTasksPct}%)</span>
            </div>

            <div className="ClientDashboard-legend-line">
              <div className="ClientDashboard-legend-name">
                <span className="ClientDashboard-color-dot blue"></span>
                <span>In Progress</span>
              </div>
              <span className="ClientDashboard-legend-count">{taskStats.inProgressTasks || 0} ({inProgressTasksPct}%)</span>
            </div>

            <div className="ClientDashboard-legend-line">
              <div className="ClientDashboard-legend-name">
                <span className="ClientDashboard-color-dot orange"></span>
                <span>Not Started</span>
              </div>
              <span className="ClientDashboard-legend-count">{notStartedTasksCount} ({notStartedTasksPct}%)</span>
            </div>
          </div>
        </article>

        {/* Col 2: Active Services Table */}
        <article className="ClientDashboard-card ClientDashboard-table-card">
          <div className="ClientDashboard-card-topbar">
            <div className="ClientDashboard-card-topbar-title">
              <FiLayers className="ClientDashboard-card-topbar-icon" />
              <h3>Active Services</h3>
            </div>
            <button
              type="button"
              className="ClientDashboard-view-all-link"
              onClick={() => navigate('/client/my-services')}
            >
              View All <FiChevronDown className="ClientDashboard-down-chevron" />
            </button>
          </div>

          <div className="ClientDashboard-services-table-wrapper">
            <table className="ClientDashboard-services-table">
              <thead>
                <tr>
                  <th>Service / Project</th>
                  <th>Assigned Team</th>
                  <th>Start Date</th>
                  <th>Deadline</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayServiceRows.length > 0 ? displayServiceRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="ClientDashboard-cell-service-name">
                      <span>{row.name}</span>
                    </td>
                    <td className="ClientDashboard-cell-team">
                      <AvatarStack count={2} />
                    </td>
                    <td className="ClientDashboard-cell-date">{row.start}</td>
                    <td className="ClientDashboard-cell-date">{row.deadline}</td>
                    <td className="ClientDashboard-cell-progress">
                      <span className="ClientDashboard-cell-progress-val">{row.progress}%</span>
                      <div className="ClientDashboard-table-progress-bar">
                        <div
                          className="ClientDashboard-table-progress-fill"
                          style={{ width: `${row.progress}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="ClientDashboard-cell-status">
                      <span className="ClientDashboard-in-progress-pill">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No active services assigned for this client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* Col 3: Task Distribution */}
        <article className="ClientDashboard-card ClientDashboard-distribution-card">
          <div className="ClientDashboard-card-topbar">
            <div className="ClientDashboard-card-topbar-title">
              <FiZap className="ClientDashboard-card-topbar-icon purple" />
              <h3>Task Distribution</h3>
            </div>
            <button
              type="button"
              className="ClientDashboard-view-all-link"
              onClick={() => navigate('/client/tasks')}
            >
              View All
            </button>
          </div>

          <div className="ClientDashboard-progress-donut-area">
            <DonutRing percent={completedTasksPct} color="#f59e0b" trackColor="#fef3c7">
              <span className="ClientDashboard-donut-main-number">{completedTasksPct}%</span>
              <span className="ClientDashboard-donut-sub-text">Total Tasks</span>
              <span className="ClientDashboard-donut-tasks-count">{totalTasksCount}</span>
            </DonutRing>
          </div>

          <div className="ClientDashboard-progress-legend-list">
            <div className="ClientDashboard-legend-line">
              <div className="ClientDashboard-legend-name">
                <span className="ClientDashboard-color-dot green"></span>
                <span>Completed</span>
              </div>
              <span className="ClientDashboard-legend-count">{taskStats.completedTasks || 0} ({completedTasksPct}%)</span>
            </div>

            <div className="ClientDashboard-legend-line">
              <div className="ClientDashboard-legend-name">
                <span className="ClientDashboard-color-dot blue"></span>
                <span>In Progress</span>
              </div>
              <span className="ClientDashboard-legend-count">{taskStats.inProgressTasks || 0} ({inProgressTasksPct}%)</span>
            </div>

            <div className="ClientDashboard-legend-line">
              <div className="ClientDashboard-legend-name">
                <span className="ClientDashboard-color-dot orange"></span>
                <span>Pending</span>
              </div>
              <span className="ClientDashboard-legend-count">{taskStats.pendingTasks || 0} ({pendingTasksPct}%)</span>
            </div>

            <div className="ClientDashboard-legend-line">
              <div className="ClientDashboard-legend-name">
                <span className="ClientDashboard-color-dot red"></span>
                <span>Overdue</span>
              </div>
              <span className="ClientDashboard-legend-count">{taskStats.overdueTasks || 0} ({overdueTasksPct}%)</span>
            </div>
          </div>
        </article>
      </section>

      {/* SECTION 5: Bottom Grid (Payment Summary | Support Tickets | Quick Actions) */}
      <section className="ClientDashboard-bottom-grid">
        {/* Col 1: Payment Summary */}
        <article className="ClientDashboard-card ClientDashboard-payment-card">
          <div className="ClientDashboard-card-topbar">
            <div className="ClientDashboard-card-topbar-title">
              <FiCreditCard className="ClientDashboard-card-topbar-icon blue" />
              <h3>Payment Summary</h3>
            </div>
            <button
              type="button"
              className="ClientDashboard-view-all-link"
              onClick={() => navigate('/client/payments')}
            >
              View Details
            </button>
          </div>

          <div className="ClientDashboard-payment-details">
            <div className="ClientDashboard-payment-row">
              <div className="ClientDashboard-payment-meta">
                <FiFileText className="ClientDashboard-pay-row-icon" />
                <span>Total Due</span>
              </div>
              <span className="ClientDashboard-pay-amount blue">₹{(paymentSummary.totalDue || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="ClientDashboard-payment-row">
              <div className="ClientDashboard-payment-meta">
                <FiCalendar className="ClientDashboard-pay-row-icon" />
                <span>Next Due Date</span>
              </div>
              <span className="ClientDashboard-pay-due-date">{paymentSummary.nextDueDate ? formatDate(paymentSummary.nextDueDate) : '—'}</span>
            </div>

            {/* Peach Plan Box */}
            <div className="ClientDashboard-peach-due-box">
              <div className="ClientDashboard-peach-top">
                <div className="ClientDashboard-peach-badge-col">
                  <div className="ClientDashboard-peach-n-badge">
                    {(paymentSummary.activePlanName || 'N').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="ClientDashboard-peach-heading">{paymentSummary.activePlanName || 'No Active Plan'}</h5>
                    <p className="ClientDashboard-peach-sub">{paymentSummary.hasActiveSubscription ? 'Active Plan' : 'Subscription Status'}</p>
                  </div>
                </div>
                <span className="ClientDashboard-peach-val">₹{(paymentSummary.totalDue || 0).toLocaleString('en-IN')}</span>
              </div>

              <button
                type="button"
                className="ClientDashboard-pay-now-btn"
                onClick={() => navigate('/client/payments')}
              >
                Pay Now <FiArrowRight className="ClientDashboard-btn-arrow" />
              </button>
            </div>
          </div>
        </article>

        {/* Col 2: Support Tickets */}
        <article className="ClientDashboard-card ClientDashboard-support-card">
          <div className="ClientDashboard-card-topbar">
            <div className="ClientDashboard-card-topbar-title">
              <FiHeadphones className="ClientDashboard-card-topbar-icon purple" />
              <h3>Support Tickets</h3>
            </div>
            <button
              type="button"
              className="ClientDashboard-view-all-link"
              onClick={openSupportTickets}
            >
              View All
            </button>
          </div>

          <div className="ClientDashboard-support-body">
            <div className="ClientDashboard-support-stat-column">
              <div className="ClientDashboard-support-metric">
                <div className="ClientDashboard-support-metric-icon red">
                  <FiHeadphones />
                </div>
                <div>
                  <span className="ClientDashboard-metric-title">Open Tickets</span>
                  <span className="ClientDashboard-metric-num">{openSupportTicketCount}</span>
                </div>
              </div>

              <div className="ClientDashboard-support-metric">
                <div className="ClientDashboard-support-metric-icon green">
                  <FiCheckCircle />
                </div>
                <div>
                  <span className="ClientDashboard-metric-title">Resolved Tickets</span>
                  <span className="ClientDashboard-metric-num">{resolvedSupportTicketCount}</span>
                </div>
              </div>
            </div>

            <div className="ClientDashboard-support-recent-column">
              <h5 className="ClientDashboard-recent-tickets-title">Recent Tickets</h5>
              <div className="ClientDashboard-recent-tickets-list">
                {displayTickets.length > 0 ? displayTickets.map((ticket, idx) => (
                  <div
                    key={ticket.id || idx}
                    className="ClientDashboard-recent-ticket-item"
                    onClick={() => navigate('/client/support-tickets', { state: { ticketId: ticket.fullId || ticket.id } })}
                    role="button"
                    tabIndex={0}
                  >
                    <FiFileText className="ClientDashboard-ticket-file-icon" />
                    <div className="ClientDashboard-recent-ticket-meta">
                      <span>{ticket.id}</span>
                      <p>{ticket.subject}</p>
                    </div>
                    <span className="ClientDashboard-ticket-open-badge">
                      {ticket.status}
                    </span>
                  </div>
                )) : (
                  <p className="ClientDashboard-modal-empty" style={{ margin: '12px 0', fontSize: '0.85rem' }}>
                    No recent support tickets.
                  </p>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Col 3: Quick Actions */}
        <article className="ClientDashboard-card ClientDashboard-quick-actions-card">
          <div className="ClientDashboard-card-topbar">
            <div className="ClientDashboard-card-topbar-title">
              <FiZap className="ClientDashboard-card-topbar-icon purple" />
              <div>
                <h3>Quick Actions</h3>
                <p className="ClientDashboard-topbar-sub">Manage your services quickly.</p>
              </div>
            </div>
          </div>

          <div className="ClientDashboard-quick-actions-grid">
            {/* Action 1 */}
            <div
              className="ClientDashboard-action-tile"
              onClick={() => navigate('/client/payments')}
              role="button"
              tabIndex={0}
            >
              <div className="ClientDashboard-action-tile-icon blue">
                <FiCreditCard />
              </div>
              <div className="ClientDashboard-action-tile-copy">
                <span>Pay Invoice</span>
                <p>Secure payments</p>
              </div>
              <FiChevronRight className="ClientDashboard-action-tile-chevron" />
            </div>

            {/* Action 2 */}
            <div
              className="ClientDashboard-action-tile"
              onClick={() => navigate('/client/documents')}
              role="button"
              tabIndex={0}
            >
              <div className="ClientDashboard-action-tile-icon purple">
                <FiUpload />
              </div>
              <div className="ClientDashboard-action-tile-copy">
                <span>Upload Document</span>
                <p>Share important files</p>
              </div>
              <FiChevronRight className="ClientDashboard-action-tile-chevron" />
            </div>

            {/* Action 3 */}
            <div
              className="ClientDashboard-action-tile"
              onClick={() => navigate('/ciisUser/client-meeting')}
              role="button"
              tabIndex={0}
            >
              <div className="ClientDashboard-action-tile-icon green">
                <FiCalendar />
              </div>
              <div className="ClientDashboard-action-tile-copy">
                <span>Book Meeting</span>
                <p>Schedule with team</p>
              </div>
              <FiChevronRight className="ClientDashboard-action-tile-chevron" />
            </div>

            {/* Action 4 */}
            <div
              className="ClientDashboard-action-tile"
              onClick={() => navigate('/client/support-tickets')}
              role="button"
              tabIndex={0}
            >
              <div className="ClientDashboard-action-tile-icon orange">
                <FiHeadphones />
              </div>
              <div className="ClientDashboard-action-tile-copy">
                <span>Raise Ticket</span>
                <p>Get support</p>
              </div>
              <FiChevronRight className="ClientDashboard-action-tile-chevron" />
            </div>
          </div>
        </article>
      </section>

      {/* Modal View for Support Tickets / Services */}
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
                  <div>
                    <small>Client Dashboard</small>
                    <h3 id="ClientDashboard-details-title">Support Tickets</h3>
                    <p>View and manage all your support requests in one place.</p>
                  </div>
                </div>
                <button type="button" aria-label="Close support tickets" onClick={() => setDetailsModal(null)}>
                  <FiX />
                </button>
              </header>
            ) : (
              <header className="ClientDashboard-modal-head">
                <div>
                  <span>Client Dashboard</span>
                  <h3 id="ClientDashboard-details-title">Dashboard Details</h3>
                </div>
                <button type="button" aria-label="Close details" onClick={() => setDetailsModal(null)}>
                  <FiX />
                </button>
              </header>
            )}

            {detailsModal === 'support' && (
              <div className="ClientDashboard-support-ticket-body">
                <div className="ClientDashboard-support-ticket-toolbar">
                  <div className="ClientDashboard-support-ticket-tabs" role="tablist" aria-label="Ticket categories">
                    <button
                      type="button"
                      className={supportTicketTab === 'all' ? 'active' : ''}
                      onClick={() => setSupportTicketTab('all')}
                    >
                      All Tickets <span>{supportTickets.length}</span>
                    </button>
                    <button
                      type="button"
                      className={supportTicketTab === 'closed' ? 'active' : ''}
                      onClick={() => setSupportTicketTab('closed')}
                    >
                      Closed <span>{resolvedSupportTicketCount}</span>
                    </button>
                  </div>
                  <label className="ClientDashboard-support-ticket-filter">
                    <FiFilter />
                    <span>Filter</span>
                    <FiChevronRight />
                    <select
                      aria-label="Filter support tickets"
                      value={supportTicketFilter}
                      onChange={event => setSupportTicketFilter(event.target.value)}
                    >
                      <option value="all">All tickets</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>
                </div>
                <div className="ClientDashboard-support-ticket-scroll">
                  {supportTicketsLoading && <p className="ClientDashboard-modal-empty">Loading support tickets...</p>}
                  {!supportTicketsLoading && supportTicketsError && <p className="ClientDashboard-modal-empty">{supportTicketsError}</p>}
                  {!supportTicketsLoading && !supportTicketsError && supportTickets.length === 0 && (
                    <p className="ClientDashboard-modal-empty">No support tickets found.</p>
                  )}
                  {!supportTicketsLoading && !supportTicketsError && supportTickets.map(ticket => (
                    <button
                      type="button"
                      className="ClientDashboard-support-ticket-row"
                      key={ticket[0]}
                      onClick={() => navigate('/client/support-tickets', { state: { ticketId: ticket[4] } })}
                    >
                      <span><FiFileText /></span>
                      <p>
                        <span>{ticket[0]}</span>
                        <small>{ticket[1]}</small>
                      </p>
                      <time>{formatSupportTicketTime(ticket[3])}</time>
                      <em className={`ClientDashboard-ticket-${getTicketStatusClass(ticket[2])}`}>
                        ●&nbsp;{ticket[2]}
                      </em>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {detailsModal === 'support' && (
              <footer className="ClientDashboard-support-ticket-foot">
                <div>
                  <span><FiHeadphones /></span>
                  <p>
                    <span>Can't find what you're looking for?</span>
                    <small>Contact our support team and we'll be happy to help.</small>
                  </p>
                </div>
                <button type="button" onClick={() => navigate('/client/support-tickets')}>
                  <FiMessageCircle /> Contact Support
                </button>
              </footer>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
