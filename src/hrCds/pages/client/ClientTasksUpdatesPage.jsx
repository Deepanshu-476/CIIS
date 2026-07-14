import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CIISLoader from '../../../Loader/CIISLoader';
import API_URL from '../../../config';
import {
  CLIENT_PORTAL_SELECTED_CLIENT_KEY,
  CLIENT_PORTAL_SELECTION_EVENT,
  collectProjectMembers,
  getClientPortalCompanyContext,
  getCompanyScopedClientParams,
  isClientForLoggedInUser
} from '../../utils/clientPortalData';
import './ClientTasksUpdatesPage.css';

import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilter,
  FiGrid,
  FiBriefcase,
  FiFlag,
  FiMail,
  FiMoreVertical,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrendingUp,
  FiUpload,
  FiUser,
  FiX
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip
} from 'chart.js';

ChartJS.register(ArcElement, Legend, Tooltip);

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const normalizeMatchValue = value => String(value || '').trim().toLowerCase();

const getUsersArrayFromResponse = responseData => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.users)) return responseData.users;
  if (Array.isArray(responseData?.message?.users)) return responseData.message.users;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

const isClientTaskOverdue = task => {
  if (!task?.dueDate || task.completed) return false;
  const status = String(task.status || 'pending').trim().toLowerCase();
  if (status === 'completed' || status === 'onhold') return false;
  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;
  return dueDate < new Date();
};

const formatDate = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getTaskTitle = task => (
  task?.name ||
  task?.task ||
  task?.title ||
  task?.taskName ||
  'Project Task'
);

const getInitials = value => String(value || 'U').trim().slice(0, 1).toUpperCase();

const getValueId = value => {
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || value.userId || value.employeeId || '').trim();
  }
  return String(value).trim();
};

const getDisplayName = value => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value.name || value.fullName || value.employeeName || value.username || value.email || '';
  }
  return String(value).trim();
};

const getDisplayEmail = value => (
  typeof value === 'object' && value
    ? value.email || value.employeeEmail || value.userEmail || ''
    : ''
);

const findMatchingMember = (value, members = []) => {
  const rawId = getValueId(value).toLowerCase();
  const rawName = getDisplayName(value).toLowerCase();
  const rawEmail = getDisplayEmail(value).toLowerCase();

  return members.find(member => {
    const memberId = getValueId(member).toLowerCase();
    const memberName = getDisplayName(member).toLowerCase();
    const memberEmail = getDisplayEmail(member).toLowerCase();
    return (
      (rawId && [memberId, memberName, memberEmail].includes(rawId)) ||
      (rawName && [memberId, memberName, memberEmail].includes(rawName)) ||
      (rawEmail && memberEmail === rawEmail)
    );
  });
};

const getTaskAssignee = (task, members = []) => {
  const assignedUsers = Array.isArray(task?.assignedUsers) ? task.assignedUsers : [];
  const directCandidates = [
    task?.assignedToName,
    task?.assigneeName,
    task?.assignedUserName,
    task?.employeeName,
    task?.assignee,
    task?.assignedTo,
    task?.assigneeId,
    ...assignedUsers
  ].filter(Boolean);

  const matched = directCandidates
    .map(candidate => findMatchingMember(candidate, members))
    .find(Boolean);
  const candidate = directCandidates.find(item => getDisplayName(item));
  const name = getDisplayName(matched || candidate);
  const email = getDisplayEmail(matched || candidate);

  return {
    name: name || 'Not assigned',
    email,
    allNames: directCandidates.map(item => getDisplayName(findMatchingMember(item, members) || item)).filter(Boolean)
  };
};

const ServicesTasks = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({ companyCode: '', companyIdentifier: '' });
  const [activeTaskFilter, setActiveTaskFilter] = useState('total');
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('any');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailsModal, setDetailsModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalStatus, setModalStatus] = useState('all');
  const [modalPage, setModalPage] = useState(1);

  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

  const api = useMemo(() => axios.create({
    baseURL: `${API_URL}/clientsservice`,
    timeout: 10000
  }), []);

  const tasksApi = useMemo(() => axios.create({
    baseURL: `${API_URL}/tasks/client-tasks`,
    timeout: 10000
  }), []);

  const usersApi = useMemo(() => axios.create({
    baseURL: `${API_URL}/users`,
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
    attachAuth(usersApi);
  }, [api, tasksApi, usersApi]);

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
    setCompanyInfo(getClientPortalCompanyContext());
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

  const fetchCompanyUsers = async user => {
    try {
      const role = String(user?.companyRole || user?.role || user?.userRole || '').toLowerCase();
      const response = await usersApi.get(role === 'employee' ? '/department-users' : '/company-users');
      return getUsersArrayFromResponse(response.data);
    } catch (err) {
      console.error('Error fetching company users for client tasks page:', err);
      return [];
    }
  };

  const fetchClientData = async () => {
    let storedClient = null;
    let storedUser = null;
    try {
      if (!isMounted.current) return;
      setLoading(true);
      setError('');

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not found. Please login again.');
        return;
      }

      storedUser = JSON.parse(userStr);
      const user = storedUser;
      storedClient = (() => {
        try {
          return JSON.parse(localStorage.getItem('client') || 'null');
        } catch {
          return null;
        }
      })();
      const requestCompanyInfo = getClientPortalCompanyContext(user, storedClient);
      if (!requestCompanyInfo.companyCode) {
        setClient(null);
        setServices([]);
        setAllTasks([]);
        setProjectManagers([]);
        setError('Company code missing. Please login again from your company portal.');
        return;
      }

      const [response, companyUsers] = await Promise.all([
        api.get('/', {
          params: {
            ...getCompanyScopedClientParams(requestCompanyInfo),
            limit: 1000
          }
        }),
        fetchCompanyUsers(user)
      ]);

      if (!response.data?.success) {
        setError('No client data found');
        return;
      }

      const allClients = response.data.data || [];
      const matchingClients = allClients.filter(c => isClientForLoggedInUser(c, user));
      const selectedClientId = normalizeMatchValue(localStorage.getItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY));
      const storedClientId = selectedClientId || normalizeMatchValue(storedClient?._id || storedClient?.id || storedClient?.clientId);
      const currentClient = (
        storedClientId
          ? matchingClients.find(c => normalizeMatchValue(c?._id || c?.id) === storedClientId)
          : null
      ) || matchingClients[0] || (
        storedClient?._id || storedClient?.id ? storedClient : null
      );

      if (!currentClient) {
        setClient(null);
        setServices([]);
        setAllTasks([]);
        setProjectManagers([]);
        setError('No client data found for this login.');
        return;
      }

      const serviceList = Array.isArray(currentClient.services) ? currentClient.services : [];
      setClient(currentClient);
      localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, String(currentClient._id));
      localStorage.setItem('client', JSON.stringify(currentClient));
      setServices(serviceList);
      setProjectManagers(collectProjectMembers(currentClient, companyUsers));
      await fetchAllServiceTasks(currentClient, serviceList);
    } catch (err) {
      console.error('Error fetching client services:', err);
      if (isMounted.current) {
        const fallbackClient = storedClient || storedUser?.client;

        if (fallbackClient) {
          const fallbackServices = Array.isArray(fallbackClient.services) ? fallbackClient.services : [];
          const cachedTasks = fallbackServices.flatMap(service => {
            try {
              const saved = localStorage.getItem(`client_${fallbackClient._id || fallbackClient.id}_service_${service}_tasks`);
              return saved ? JSON.parse(saved).map(task => ({ ...task, serviceName: service })) : [];
            } catch {
              return [];
            }
          });

          setClient(fallbackClient);
          setServices(fallbackServices);
          setAllTasks(cachedTasks);
          setProjectManagers([]);
          setError('');
        } else {
          setError(err.response?.data?.message || 'Failed to load services');
        }
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

  const now = new Date();
  const next30Days = new Date(now);
  next30Days.setDate(now.getDate() + 30);
  const completedTasks = allTasks.filter(task => task.completed === true);
  const overdueTasks = allTasks.filter(isClientTaskOverdue);
  const inProgressTasks = allTasks.filter(task => task.completed !== true && !isClientTaskOverdue(task) && String(task.status || '').toLowerCase().includes('progress'));
  const upcomingDeadlineTasks = allTasks.filter(task => {
    if (!task.dueDate || task.completed === true) return false;
    const dueDate = new Date(task.dueDate);
    return !Number.isNaN(dueDate.getTime()) && dueDate >= now && dueDate <= next30Days;
  });
  const totalTasks = allTasks.length;
  const clientName = client?.client || client?.name || 'Client';
  const baseServices = services;

  const serviceRows = baseServices.map((service, index) => {
    const serviceTasks = allTasks.filter(task => task.serviceName === service);
    const taskTotal = serviceTasks.length;
    const done = serviceTasks.filter(task => task.completed).length;
    const progress = taskTotal ? Math.round((done / taskTotal) * 100) : 0;
    return { service, taskTotal, done, progress };
  });

  const buildTaskRow = (task) => {
    const completed = task.completed === true;
    const overdue = isClientTaskOverdue(task);
    const assignee = getTaskAssignee(task, projectManagers);
    const status = completed
      ? 'Completed'
      : overdue
        ? 'Overdue'
        : String(task.status || 'In Progress').replace(/\b\w/g, char => char.toUpperCase());
    const progress = completed ? 100 : overdue ? 90 : Number(task.progress || task.percent || 0);

    return {
      id: task._id || task.id || `${getTaskTitle(task)}-${task.serviceName || 'service'}`,
      title: getTaskTitle(task),
      service: task.serviceName || 'Project Service',
      dueDate: task.dueDate,
      createdDate: task.createdAt || task.created_at || task.createdDate || task.date || task.dueDate,
      description: task.description || task.details || task.notes || task.remark || '',
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,
      assignedNames: assignee.allNames,
      status,
      priority: String(task.priority || (overdue ? 'High' : 'Medium')).replace(/\b\w/g, char => char.toUpperCase()),
      progress
    };
  };

  const taskMatchesFilter = task => {
    if (activeTaskFilter === 'completed') return task.completed === true;
    if (activeTaskFilter === 'in-progress') return task.completed !== true && !isClientTaskOverdue(task) && String(task.status || '').toLowerCase().includes('progress');
    if (activeTaskFilter === 'overdue') return isClientTaskOverdue(task);
    if (activeTaskFilter === 'upcoming') return upcomingDeadlineTasks.includes(task);
    return true;
  };

  const taskMatchesToolbarFilters = task => {
    const row = buildTaskRow(task);
    const search = taskSearch.trim().toLowerCase();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueThisMonth = dueDate && !Number.isNaN(dueDate.getTime())
      ? dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()
      : false;

    const matchesSearch = !search || [
      row.title,
      row.service,
      row.status,
      row.priority
    ].some(value => String(value || '').toLowerCase().includes(search));
    const matchesStatus = statusFilter === 'all' || row.status.toLowerCase().replace(/\s/g, '-') === statusFilter;
    const matchesPriority = priorityFilter === 'all' || row.priority.toLowerCase() === priorityFilter;
    const matchesService = serviceFilter === 'all' || row.service === serviceFilter;
    const matchesDue = (
      dueFilter === 'any' ||
      (dueFilter === 'overdue' && row.status === 'Overdue') ||
      (dueFilter === 'upcoming' && upcomingDeadlineTasks.includes(task)) ||
      (dueFilter === 'this-month' && dueThisMonth)
    );

    return matchesSearch && matchesStatus && matchesPriority && matchesService && matchesDue;
  };

  const filteredTaskSource = allTasks.filter(task => taskMatchesFilter(task) && taskMatchesToolbarFilters(task));
  const totalFilteredTasks = filteredTaskSource.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredTasks / pageSize));
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const taskRows = filteredTaskSource.slice(pageStartIndex, pageStartIndex + pageSize).map(buildTaskRow);
  const showingFrom = totalFilteredTasks ? pageStartIndex + 1 : 0;
  const showingTo = Math.min(pageStartIndex + taskRows.length, totalFilteredTasks);
  const pageWindowStart = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4));
  const visiblePageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => pageWindowStart + index
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTaskFilter, taskSearch, statusFilter, priorityFilter, serviceFilter, dueFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const goToPage = page => {
    const nextPage = Number(page);
    if (!Number.isFinite(nextPage)) return;
    setCurrentPage(Math.max(1, Math.min(totalPages, nextPage)));
  };

  const handlePageSizeChange = event => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const allFilteredTaskRows = filteredTaskSource.map(buildTaskRow);
  const modalTaskRows = allFilteredTaskRows.filter(task => {
    const search = modalSearch.trim().toLowerCase();
    const matchesSearch = !search || [task.title, task.service, task.priority, task.status]
      .some(value => String(value || '').toLowerCase().includes(search));
    const matchesStatus = modalStatus === 'all' || task.status.toLowerCase().replace(/\s/g, '-') === modalStatus;
    return matchesSearch && matchesStatus;
  });
  const modalTotalPages = Math.max(1, Math.ceil(modalTaskRows.length / pageSize));
  const safeModalPage = Math.min(modalPage, modalTotalPages);
  const modalStartIndex = (safeModalPage - 1) * pageSize;
  const visibleModalTaskRows = modalTaskRows.slice(modalStartIndex, modalStartIndex + pageSize);
  const modalPageNumbers = Array.from({ length: Math.min(3, modalTotalPages) }, (_, index) => index + 1);

  useEffect(() => {
    setModalPage(1);
  }, [modalSearch, modalStatus, pageSize]);

  const stats = [
    { label: 'Total Tasks', filter: 'total', value: totalTasks, tone: 'blue', icon: <FiCalendar />, trend: '', helper: 'Live total', spark: 'M2 23 C10 19, 17 26, 25 21 S41 16, 50 22 S67 28, 76 17 S92 12, 104 19 S114 17, 120 10' },
    { label: 'Completed Tasks', filter: 'completed', value: completedTasks.length, tone: 'green', icon: <FiCheckCircle />, trend: '', helper: 'Live total', spark: 'M2 24 C12 16, 18 22, 27 19 S43 12, 52 18 S66 27, 76 21 S90 13, 101 18 S112 12, 120 15' },
    { label: 'In Progress', filter: 'in-progress', value: inProgressTasks.length, tone: 'blue', icon: <FiClock />, trend: '', helper: 'Live total', spark: 'M2 21 C12 18, 20 22, 29 20 S43 17, 54 22 S69 25, 79 19 S94 14, 105 20 S114 17, 120 12' },
    { label: 'Overdue Tasks', filter: 'overdue', value: overdueTasks.length, tone: 'red', icon: <FiAlertCircle />, trend: '', helper: 'Live total', spark: 'M2 24 C12 19, 19 21, 28 17 S43 20, 52 15 S66 25, 77 17 S91 12, 101 20 S112 16, 120 23' },
    { label: 'Upcoming Deadlines', filter: 'upcoming', value: upcomingDeadlineTasks.length, tone: 'purple', icon: <FiCalendar />, trend: '', helper: 'Next 30 days', spark: 'M2 25 C13 20, 20 24, 30 17 S45 18, 55 13 S69 19, 78 16 S92 10, 102 14 S113 9, 120 12' }
  ];

  const distribution = [
    { label: 'Completed', value: stats[1].value, color: '#1f78ff' },
    { label: 'In Progress', value: stats[2].value, color: '#60a5fa' },
    { label: 'Overdue', value: stats[3].value, color: '#ef4444' },
    { label: 'Upcoming', value: upcomingDeadlineTasks.length, color: '#8b5cf6' }
  ];
  const distributionTotal = distribution.reduce((sum, item) => sum + item.value, 0) || 1;

  const doughnutData = {
    labels: distribution.map(item => item.label),
    datasets: [{
      data: distribution.map(item => item.value),
      backgroundColor: distribution.map(item => item.color),
      borderColor: '#ffffff',
      borderWidth: 3
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } }
  };

  const projectProgress = serviceRows[0] || { service: services[0] || 'No active service', progress: 0, taskTotal: 0, done: 0 };
  const projectTasks = allTasks.filter(task => task.serviceName === projectProgress.service);
  const projectStatus = projectProgress.taskTotal && projectProgress.progress === 100
    ? 'Completed'
    : projectProgress.taskTotal
      ? 'In Progress'
      : 'Active';
  const projectDescription = projectTasks[0]
    ? `Latest task: ${getTaskTitle(projectTasks[0])}`
    : `${projectProgress.service} service is active for your account.`;
  const fallbackMilestones = ['Discovery', 'Design', 'Development', 'Testing', 'Launch'].map((title, index) => ({
    title,
    completed: index < Math.round((projectProgress.progress / 100) * 5),
    status: index < Math.round((projectProgress.progress / 100) * 5) ? 'Completed' : 'Upcoming'
  }));
  const projectMilestones = projectTasks.length
    ? projectTasks.slice(0, 5).map(task => ({
      title: getTaskTitle(task),
      completed: task.completed === true,
      status: task.completed === true ? 'Completed' : isClientTaskOverdue(task) ? 'Overdue' : 'Upcoming'
    }))
    : fallbackMilestones;
  const manager = projectManagers[0] || { name: 'Account Manager', email: '', phone: '' };
  const teamMembers = projectManagers.slice(0, 4);

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return (
      <div className="ClientTasksUpdatesPage-error">
        <FiAlertCircle />
        <h3>{error ? 'Error Loading Services' : 'No Client Data'}</h3>
        <p>{error || 'No client information found for your account.'}</p>
        <div>
          <button type="button" onClick={fetchClientData}>Try Again</button>
          <button type="button" onClick={handleLogout}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ClientTasksUpdatesPage-page">
      <main className="ClientTasksUpdatesPage-shell">
        <section className="ClientTasksUpdatesPage-main">
          <div className="ClientTasksUpdatesPage-titleRow">
            <div>
              <h2>Tasks & Updates</h2>
              <p>Track tasks, milestones and latest project activity.</p>
            </div>
          </div>

          <section className="ClientTasksUpdatesPage-stats">
            {stats.map(stat => (
              <button
                type="button"
                className={`ClientTasksUpdatesPage-statCard ClientTasksUpdatesPage-tone-${stat.tone} ${activeTaskFilter === stat.filter ? 'ClientTasksUpdatesPage-statCard--active' : ''}`}
                key={stat.label}
                onClick={() => setActiveTaskFilter(stat.filter)}
                aria-pressed={activeTaskFilter === stat.filter}
              >
                <div className={`ClientTasksUpdatesPage-statIcon ClientTasksUpdatesPage-is-${stat.tone}`}>{stat.icon}</div>
                <div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
                {stat.trend && <small className={String(stat.trend).startsWith('-') ? 'ClientTasksUpdatesPage-down' : ''}>{stat.trend}</small>}
                <em>{stat.helper}</em>
                <svg className="ClientTasksUpdatesPage-statSpark" viewBox="0 0 120 34" aria-hidden="true">
                  <path d={stat.spark} />
                </svg>
              </button>
            ))}
          </section>

          <section className="ClientTasksUpdatesPage-tablePanel">
            <div className="ClientTasksUpdatesPage-toolbar">
              <label className="ClientTasksUpdatesPage-tableSearch">
                <FiSearch />
                <input
                  type="search"
                  placeholder="Search tasks by name or keyword..."
                  value={taskSearch}
                  onChange={event => setTaskSearch(event.target.value)}
                />
              </label>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filter by status">
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="overdue">Overdue</option>
              </select>
              <select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)} aria-label="Filter by priority">
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={serviceFilter} onChange={event => setServiceFilter(event.target.value)} aria-label="Filter by service">
                <option value="all">All Services</option>
                {baseServices.map(service => <option value={service} key={service}>{service}</option>)}
              </select>
              <select value={dueFilter} onChange={event => setDueFilter(event.target.value)} aria-label="Filter by due date">
                <option value="any">Anytime</option>
                <option value="this-month">This Month</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
              <button type="button" className="ClientTasksUpdatesPage-filter"><FiFilter /> Filters</button>
              
            </div>

            <div className="ClientTasksUpdatesPage-tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Related Service / Project</th>
                    <th>Priority</th>
                    <th>Created Date</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {taskRows.map((task, index) => (
                    <tr key={task.id}>
                      <td data-label="Task Name">
                        <div className="ClientTasksUpdatesPage-taskName">
                          <span>{pageStartIndex + index + 1}</span>
                          <strong>{task.title}</strong>
                        </div>
                      </td>
                      <td data-label="Service">{task.service}</td>
                      <td data-label="Priority"><span className={`ClientTasksUpdatesPage-priority ClientTasksUpdatesPage-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                      <td data-label="Created Date">
                        {formatDate(task.createdDate)}
                      </td>
                      <td data-label="Progress">
                        <div className="ClientTasksUpdatesPage-progress">
                          <span>{task.progress}%</span>
                          <div><i style={{ width: `${task.progress}%` }}></i></div>
                        </div>
                      </td>
                      <td data-label="Status"><span className={`ClientTasksUpdatesPage-status ClientTasksUpdatesPage-${task.status.replace(/\s/g, '').toLowerCase()}`}>{task.status}</span></td>
                      <td data-label="Action">
                        <button
                          className="ClientTasksUpdatesPage-review"
                          type="button"
                          onClick={() => {
                            setSelectedTask(task);
                            setDetailsModal('task');
                          }}
                        >
                          {pageStartIndex + index === 0 ? 'Review' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!taskRows.length && (
                    <tr>
                      <td colSpan={7} className="ClientTasksUpdatesPage-emptyCell">No tasks match this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ClientTasksUpdatesPage-pagination">
              <span>Showing {showingFrom} to {showingTo} of {totalFilteredTasks} tasks</span>
              <div>
                <button type="button" onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}>
                  <FiChevronLeft />
                </button>
                {pageWindowStart > 1 && (
                  <>
                    <button type="button" onClick={() => goToPage(1)}>1</button>
                    {pageWindowStart > 2 && <span>...</span>}
                  </>
                )}
                {visiblePageNumbers.map(page => (
                  <button
                    className={safeCurrentPage === page ? 'ClientTasksUpdatesPage-active' : ''}
                    type="button"
                    key={page}
                    onClick={() => goToPage(page)}
                    disabled={safeCurrentPage === page}
                  >
                    {page}
                  </button>
                ))}
                {pageWindowStart + visiblePageNumbers.length - 1 < totalPages && (
                  <>
                    {pageWindowStart + visiblePageNumbers.length < totalPages && <span>...</span>}
                    <button type="button" onClick={() => goToPage(totalPages)}>{totalPages}</button>
                  </>
                )}
                <button type="button" onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages}>
                  <FiChevronRight />
                </button>
              </div>
              <select value={pageSize} onChange={handlePageSizeChange} aria-label="Tasks per page">
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </select>
            </div>
          </section>
        </section>

      </main>

      <section className="ClientTasksUpdatesPage-bottomGrid">
        <article className="ClientTasksUpdatesPage-widget ClientTasksUpdatesPage-distribution">
          <h3>Task Distribution</h3>
          <div className="ClientTasksUpdatesPage-donutBox">
            <div className="ClientTasksUpdatesPage-donut">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div><strong>{totalTasks || taskRows.length}</strong><span>Total Tasks</span></div>
            </div>
            <div className="ClientTasksUpdatesPage-legend">
              {distribution.map(item => (
                <p key={item.label}>
                  <i style={{ background: item.color }}></i>
                  <span>{item.label}</span>
                  <strong>{item.value} ({Math.round((item.value / distributionTotal) * 100)}%)</strong>
                </p>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => { setDetailsModal('tasks'); setModalPage(1); }}>View All Tasks <FiChevronRight /></button>
        </article>

        <article className="ClientTasksUpdatesPage-widget ClientTasksUpdatesPage-project">
          <div className="ClientTasksUpdatesPage-cardHead">
            <h3>Project Progress Overview</h3>
            <span>{projectStatus}</span>
          </div>
          <strong>{projectProgress.service}</strong>
          <p>{projectDescription}</p>
          <div className="ClientTasksUpdatesPage-milestones">
            {projectMilestones.map((step, index) => (
              <div key={`${step.title}-${index}`} className={step.completed ? 'ClientTasksUpdatesPage-done' : ''}>
                <i>{step.completed ? <FiCheckCircle /> : index + 1}</i>
                <span>{step.title}</span>
                <small>{step.status}</small>
              </div>
            ))}
          </div>
          <div className="ClientTasksUpdatesPage-overall">
            <span>Overall Progress</span>
            <strong>{projectProgress.progress}%</strong>
            <div><i style={{ width: `${projectProgress.progress}%` }}></i></div>
          </div>
          <button type="button" onClick={() => setDetailsModal('project')}>View Project Details <FiChevronRight /></button>
        </article>

        <article className="ClientTasksUpdatesPage-widget ClientTasksUpdatesPage-team">
          <div className="ClientTasksUpdatesPage-cardHead">
            <h3>Assigned Team & Manager</h3>
          </div>
          <div className="ClientTasksUpdatesPage-manager">
            <b>{getInitials(manager.name || clientName)}</b>
            <div>
              <span>Account Manager</span>
              <strong>{manager.name || 'Account Manager'}</strong>
              <small>{manager.role || 'Account Manager'}</small>
            </div>
          </div>
          <div className="ClientTasksUpdatesPage-managerDetails">
            <span><FiMail /><small>Email</small><strong>{manager.email || 'No email assigned'}</strong></span>
            <span><FiPhone /><small>Phone</small><strong>{manager.phone || 'No phone assigned'}</strong></span>
          </div>
        </article>

        <article className="ClientTasksUpdatesPage-widget ClientTasksUpdatesPage-quick">
          <h3>Quick Actions</h3>
          <div>
            <button type="button" onClick={() => navigate('/client/marketplace')}><FiGrid /><span>View Service</span><small>See project details</small></button>
            <button type="button"><FiUpload /><span>Upload Feedback</span><small>Share your feedback</small></button>
            <button type="button" onClick={() => navigate('/client/support-tickets')}><FiCalendar /><span>Book Meeting</span><small>Schedule with team</small></button>
            <button type="button" onClick={() => navigate('/client/support-tickets')}><FiAlertCircle /><span>Raise Ticket</span><small>Get support</small></button>
          </div>
          <button type="button" onClick={() => navigate('/client/marketplace')}><FiGrid /> View All Services <FiChevronRight /></button>
        </article>
      </section>

      {detailsModal && (
        <div className="ClientTasksUpdatesPage-modalBackdrop" role="presentation" onClick={() => setDetailsModal(null)}>
          <section
            className={`ClientTasksUpdatesPage-modal ${detailsModal === 'task' ? 'ClientTasksUpdatesPage-taskModal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ClientTasksUpdatesPage-modalTitle"
            onClick={event => event.stopPropagation()}
          >
            <header className={`ClientTasksUpdatesPage-modalHead ${detailsModal === 'task' ? 'ClientTasksUpdatesPage-taskModalHead' : ''}`}>
              <div className={detailsModal === 'task' ? 'ClientTasksUpdatesPage-taskModalTitle' : ''}>
                {detailsModal === 'task' && <i><FiCalendar /></i>}
                <div>
                  <span>Tasks & Updates</span>
                  <h3 id="ClientTasksUpdatesPage-modalTitle">{detailsModal === 'tasks' && 'All Tasks'}{detailsModal === 'task' && 'Task Details'}{detailsModal === 'project' && 'Project Details'}</h3>
                  {detailsModal === 'tasks' && <p>Track and manage all your tasks in one place</p>}
                </div>
              </div>
              <div className="ClientTasksUpdatesPage-modalHeadActions">
                {detailsModal === 'tasks' && (
                  <>
                    <label className="ClientTasksUpdatesPage-modalFilter">
                      <FiFilter />
                      <select value={modalStatus} onChange={event => setModalStatus(event.target.value)} aria-label="Filter tasks by status">
                        <option value="all">Filter</option>
                        <option value="completed">Completed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </label>
                    <label className="ClientTasksUpdatesPage-modalSearch">
                      <FiSearch />
                      <input value={modalSearch} onChange={event => setModalSearch(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" />
                    </label>
                  </>
                )}
                <button type="button" aria-label="Close details" onClick={() => setDetailsModal(null)}>
                  <FiX />
                </button>
              </div>
            </header>

            {detailsModal === 'tasks' && (
              <div className="ClientTasksUpdatesPage-modalTable">
                <div className="ClientTasksUpdatesPage-modalTableHead">
                  <span>Task</span><span>Service</span><span>Priority</span><span>Created Date</span><span>Progress</span><span>Status</span><span>Actions</span>
                </div>
                <div className="ClientTasksUpdatesPage-modalTableRows">
                  {visibleModalTaskRows.map(task => (
                    <div className="ClientTasksUpdatesPage-modalTableRow" key={`${task.id}-modal`}>
                      <strong><i className="ClientTasksUpdatesPage-modalTaskIcon"><FiCalendar /></i>{task.title}</strong>
                      <span>{task.service}</span>
                      <span><b className={`ClientTasksUpdatesPage-priority ClientTasksUpdatesPage-priority-${task.priority.toLowerCase()}`}>{task.priority}</b></span>
                      <span><FiCalendar />{formatDate(task.createdDate)}</span>
                      <span className="ClientTasksUpdatesPage-modalProgress"><i><b style={{ width: `${task.progress}%` }} /></i>{task.progress}%</span>
                      <em className={`ClientTasksUpdatesPage-status ClientTasksUpdatesPage-${task.status.replace(/\s/g, '').toLowerCase()}`}>{task.status}</em>
                      <button type="button" className="ClientTasksUpdatesPage-modalRowAction" onClick={() => { setSelectedTask(task); setDetailsModal('task'); }} aria-label={`View ${task.title} details`}><FiMoreVertical /></button>
                    </div>
                  ))}
                  {!modalTaskRows.length && <p className="ClientTasksUpdatesPage-modalEmpty">No tasks match this filter.</p>}
                </div>
                {modalTaskRows.length > 0 && (
                  <footer className="ClientTasksUpdatesPage-modalPagination">
                    <span>Showing {modalStartIndex + 1} to {Math.min(modalStartIndex + visibleModalTaskRows.length, modalTaskRows.length)} of {modalTaskRows.length} tasks</span>
                    <div>
                      <button type="button" onClick={() => setModalPage(Math.max(1, safeModalPage - 1))} disabled={safeModalPage === 1} aria-label="Previous page"><FiChevronLeft /></button>
                      {modalPageNumbers.map(page => <button type="button" key={page} className={safeModalPage === page ? 'is-active' : ''} onClick={() => setModalPage(page)}>{page}</button>)}
                      <button type="button" onClick={() => setModalPage(Math.min(modalTotalPages, safeModalPage + 1))} disabled={safeModalPage === modalTotalPages} aria-label="Next page"><FiChevronRight /></button>
                    </div>
                    <select value={pageSize} onChange={handlePageSizeChange} aria-label="Tasks per page"><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select>
                  </footer>
                )}
              </div>
            )}

            {detailsModal === 'task' && selectedTask && (
              <div className="ClientTasksUpdatesPage-taskDetails">
                <div className="ClientTasksUpdatesPage-taskDetailsHero">
                  <div>
                    <span>Task Details</span>
                    <h4>{selectedTask.title}</h4>
                    <p>{selectedTask.description || 'No description added for this task.'}</p>
                  </div>
                  <div className={`ClientTasksUpdatesPage-taskDetailsSide ClientTasksUpdatesPage-taskStatus-${selectedTask.status.replace(/\s/g, '').toLowerCase()}`}>
                    <div className="ClientTasksUpdatesPage-taskProgressCopy"><em className={`ClientTasksUpdatesPage-status ClientTasksUpdatesPage-${selectedTask.status.replace(/\s/g, '').toLowerCase()}`}>{selectedTask.status}</em><strong>{selectedTask.progress}%</strong><small>Progress</small></div>
                    <span className="ClientTasksUpdatesPage-taskCompleteRing">{selectedTask.status.toLowerCase() === 'completed' ? <FiCheckCircle /> : selectedTask.status.toLowerCase() === 'overdue' ? <FiAlertCircle /> : selectedTask.status.toLowerCase() === 'pending' ? <FiClock /> : <FiTrendingUp />}</span>
                  </div>
                </div>

                <div className="ClientTasksUpdatesPage-taskDetailsGrid">
                  <div className="ClientTasksUpdatesPage-detailCard">
                    <i><FiUser /></i><div><span>Assigned To</span><strong>{selectedTask.assigneeName}</strong><small>{selectedTask.assigneeEmail || 'No assignee'}</small></div>
                  </div>
                  <div className="ClientTasksUpdatesPage-detailCard">
                    <i><FiCalendar /></i><div><span>Created Date</span><strong>{formatDate(selectedTask.createdDate)}</strong><small>{selectedTask.createdDate ? 'Task created' : 'No date'}</small></div>
                  </div>
                  <div className="ClientTasksUpdatesPage-detailCard">
                    <i><FiCalendar /></i><div><span>Due Date</span><strong>{formatDate(selectedTask.dueDate)}</strong><small>{selectedTask.dueDate ? 'Due date' : 'No due date'}</small></div>
                  </div>
                  <div className="ClientTasksUpdatesPage-detailCard">
                    <i><FiFlag /></i><div><span>Priority</span><strong>{selectedTask.priority}</strong><small>Priority level</small></div>
                  </div>
                  <div className="ClientTasksUpdatesPage-detailCard ClientTasksUpdatesPage-detailProgress">
                    <i><FiTrendingUp /></i><div><span>Progress</span><strong>{selectedTask.progress}% complete</strong><small>Task progress</small><div className="ClientTasksUpdatesPage-taskDetailsProgress"><i style={{ width: `${selectedTask.progress}%` }}></i></div></div>
                  </div>
                  <div className="ClientTasksUpdatesPage-detailCard">
                    <i><FiBriefcase /></i><div><span>Service</span><strong>{selectedTask.service}</strong><small>Related service</small></div>
                  </div>
                </div>

                {selectedTask.assignedNames.length > 1 && (
                  <div className="ClientTasksUpdatesPage-taskAssignees">
                    <span>All Assignees</span>
                    <p>{selectedTask.assignedNames.join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {detailsModal === 'project' && (
              <div className="ClientTasksUpdatesPage-projectDetails">
                <div className="ClientTasksUpdatesPage-projectSummary">
                  <strong>{projectProgress.service}</strong>
                  <span>{projectStatus}</span>
                  <p>{projectDescription}</p>
                  <div><i style={{ width: `${projectProgress.progress}%` }}></i></div>
                  <small>{projectProgress.progress}% overall progress - {projectProgress.done || 0}/{projectProgress.taskTotal || 0} tasks complete</small>
                </div>
                <div className="ClientTasksUpdatesPage-modalTable">
                  <div className="ClientTasksUpdatesPage-modalTableHead">
                    <span>Milestone</span><span>Status</span><span></span><span></span><span></span><span></span>
                  </div>
                  {projectMilestones.map((step, index) => (
                    <div className="ClientTasksUpdatesPage-modalTableRow" key={`${step.title}-project-${index}`}>
                      <strong>{step.title}</strong>
                      <em className={`ClientTasksUpdatesPage-status ClientTasksUpdatesPage-${step.status.replace(/\s/g, '').toLowerCase()}`}>{step.status}</em>
                      <span></span><span></span><span></span><span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ServicesTasks;
