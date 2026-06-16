import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CIISLoader from '../../../Loader/CIISLoader';
import API_URL from '../../../config';
import { isClientForLoggedInUser } from '../../utils/clientPortalData';
import './ClientTasksUpdatesPage.css';

import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFilter,
  FiGrid,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiUpload,
  FiUsers,
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

const isClientTaskOverdue = task => {
  if (!task?.dueDate || task.completed) return false;
  const status = String(task.status || 'pending').trim().toLowerCase();
  if (status === 'overdue') return true;
  if (status !== 'pending') return false;
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

const formatShortDate = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
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

const ServicesTasks = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({ companyCode: '', companyIdentifier: '' });
  const [activeTaskFilter, setActiveTaskFilter] = useState('total');
  const [detailsModal, setDetailsModal] = useState(null);

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
      const currentClient = allClients.find(c => isClientForLoggedInUser(c, user));

      if (!currentClient) {
        setClient(null);
        setServices([]);
        setAllTasks([]);
        setError('No client data found for this login.');
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

  const now = new Date();
  const next30Days = new Date(now);
  next30Days.setDate(now.getDate() + 30);
  const completedTasks = allTasks.filter(task => task.completed === true);
  const overdueTasks = allTasks.filter(isClientTaskOverdue);
  const inProgressTasks = allTasks.filter(task => task.completed !== true && !isClientTaskOverdue(task) && String(task.status || '').toLowerCase().includes('progress'));
  const pendingApprovalTasks = allTasks.filter(task => String(task.status || '').trim().toLowerCase() === 'pending approval');
  const upcomingDeadlineTasks = allTasks.filter(task => {
    if (!task.dueDate || task.completed === true) return false;
    const dueDate = new Date(task.dueDate);
    return !Number.isNaN(dueDate.getTime()) && dueDate >= now && dueDate <= next30Days;
  });
  const totalTasks = allTasks.length;
  const clientName = client?.client || client?.name || 'Client';
  const projectManagers = client?.projectManagers || [];
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
    const overdue = isClientTaskOverdue(task) || String(task.status || '').toLowerCase() === 'overdue';
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
      status,
      priority: String(task.priority || (overdue ? 'High' : 'Medium')).replace(/\b\w/g, char => char.toUpperCase()),
      progress
    };
  };

  const taskMatchesFilter = task => {
    if (activeTaskFilter === 'completed') return task.completed === true;
    if (activeTaskFilter === 'in-progress') return task.completed !== true && !isClientTaskOverdue(task) && String(task.status || '').toLowerCase().includes('progress');
    if (activeTaskFilter === 'pending-approval') return String(task.status || '').trim().toLowerCase() === 'pending approval';
    if (activeTaskFilter === 'overdue') return isClientTaskOverdue(task);
    if (activeTaskFilter === 'upcoming') return upcomingDeadlineTasks.includes(task);
    return true;
  };

  const filteredTaskSource = allTasks.filter(taskMatchesFilter);
  const taskRows = filteredTaskSource.slice(0, 8).map(buildTaskRow);

  const upcomingDeadlines = upcomingDeadlineTasks
    .slice()
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map(buildTaskRow)
    .slice(0, 5);
  const allUpcomingDeadlines = upcomingDeadlineTasks
    .slice()
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map(buildTaskRow);
  const allFilteredTaskRows = filteredTaskSource.map(buildTaskRow);

  const recentUpdates = [
    ...(taskRows[0] ? [{ icon: <FiCheckCircle />, tone: 'green', title: `Latest task: "${taskRows[0].title}" is ${taskRows[0].status}.`, time: formatDate(taskRows[0].dueDate) }] : []),
    ...(taskRows[1] ? [{ icon: <FiUsers />, tone: 'orange', title: `Update available for "${taskRows[1].title}".`, time: formatDate(taskRows[1].dueDate) }] : []),
    ...(baseServices[0] ? [{ icon: <FiCalendar />, tone: 'blue', title: `${baseServices[0]} service is active for your account.`, time: 'Current service' }] : []),
    { icon: <FiDownload />, tone: 'purple', title: `${clientName} client portal synced with live records.`, time: 'Now' }
  ].slice(0, 5);
  const allRecentUpdates = [
    ...allTasks.map(task => ({
      icon: task.completed ? <FiCheckCircle /> : <FiClock />,
      tone: task.completed ? 'green' : isClientTaskOverdue(task) ? 'red' : 'blue',
      title: `${getTaskTitle(task)} - ${task.completed ? 'Completed' : isClientTaskOverdue(task) ? 'Overdue' : 'Updated'}`,
      time: formatDate(task.updatedAt || task.createdAt || task.dueDate),
      service: task.serviceName || 'Project Service'
    })),
    { icon: <FiDownload />, tone: 'purple', title: `${clientName} client portal synced with live records.`, time: 'Now', service: 'Client Portal' }
  ];

  const stats = [
    { label: 'Total Tasks', filter: 'total', value: totalTasks, tone: 'blue', icon: <FiCalendar />, trend: '', helper: 'Live total', spark: 'M2 23 C10 19, 17 26, 25 21 S41 16, 50 22 S67 28, 76 17 S92 12, 104 19 S114 17, 120 10' },
    { label: 'Completed Tasks', filter: 'completed', value: completedTasks.length, tone: 'green', icon: <FiCheckCircle />, trend: '', helper: 'Live total', spark: 'M2 24 C12 16, 18 22, 27 19 S43 12, 52 18 S66 27, 76 21 S90 13, 101 18 S112 12, 120 15' },
    { label: 'In Progress', filter: 'in-progress', value: inProgressTasks.length, tone: 'blue', icon: <FiClock />, trend: '', helper: 'Live total', spark: 'M2 21 C12 18, 20 22, 29 20 S43 17, 54 22 S69 25, 79 19 S94 14, 105 20 S114 17, 120 12' },
    { label: 'Pending Approval', filter: 'pending-approval', value: pendingApprovalTasks.length, tone: 'orange', icon: <FiUsers />, trend: '', helper: 'Live total', spark: 'M2 25 C12 25, 17 15, 27 20 S41 26, 51 18 S66 14, 76 23 S88 24, 98 17 S111 18, 120 22' },
    { label: 'Overdue Tasks', filter: 'overdue', value: overdueTasks.length, tone: 'red', icon: <FiAlertCircle />, trend: '', helper: 'Live total', spark: 'M2 24 C12 19, 19 21, 28 17 S43 20, 52 15 S66 25, 77 17 S91 12, 101 20 S112 16, 120 23' },
    { label: 'Upcoming Deadlines', filter: 'upcoming', value: upcomingDeadlineTasks.length, tone: 'purple', icon: <FiCalendar />, trend: '', helper: 'Next 30 days', spark: 'M2 25 C13 20, 20 24, 30 17 S45 18, 55 13 S69 19, 78 16 S92 10, 102 14 S113 9, 120 12' }
  ];

  const distribution = [
    { label: 'Completed', value: stats[1].value, color: '#1f78ff' },
    { label: 'In Progress', value: stats[2].value, color: '#60a5fa' },
    { label: 'Pending Approval', value: stats[3].value, color: '#f59e0b' },
    { label: 'Overdue', value: stats[4].value, color: '#ef4444' },
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
              <p>Track tasks, milestones, approvals and latest project activity.</p>
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
                <svg viewBox="0 0 120 34" aria-hidden="true">
                  <path d={stat.spark} />
                </svg>
              </button>
            ))}
          </section>

          <section className="ClientTasksUpdatesPage-tablePanel">
            <div className="ClientTasksUpdatesPage-toolbar">
              <label className="ClientTasksUpdatesPage-tableSearch">
                <FiSearch />
                <input type="search" placeholder="Search tasks by name or keyword..." />
              </label>
              <select defaultValue="all"><option value="all">All Status</option></select>
              <select defaultValue="all"><option value="all">All Priority</option></select>
              <select defaultValue="all"><option value="all">All Services</option></select>
              <select defaultValue="any"><option value="any">Anytime</option></select>
              <button type="button" className="ClientTasksUpdatesPage-filter"><FiFilter /> Filters</button>
              {/* <button type="button" className="ClientTasksUpdatesPage-add"><FiPlus /> Add Task</button> */}
            </div>

            <div className="ClientTasksUpdatesPage-tableWrap">
              <table>
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Select all tasks" /></th>
                    <th>Task Name</th>
                    <th>Related Service / Project</th>
                    <th>Assigned Team</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {taskRows.map((task, index) => (
                    <tr key={task.id}>
                      <td><input type="checkbox" aria-label={`Select ${task.title}`} /></td>
                      <td>
                        <div className="ClientTasksUpdatesPage-taskName">
                          <span>{index + 1}</span>
                          <strong>{task.title}</strong>
                        </div>
                      </td>
                      <td>{task.service}</td>
                      <td>
                        <div className="ClientTasksUpdatesPage-avatars">
                          {[0, 1, 2].map(item => <i key={item}>{getInitials(teamMembers[item]?.name || clientName)}</i>)}
                          {index % 2 === 0 && <b>+1</b>}
                        </div>
                      </td>
                      <td><span className={`ClientTasksUpdatesPage-priority ClientTasksUpdatesPage-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                      <td>
                        {formatDate(task.dueDate)}
                        {task.status === 'Overdue' && <small>Overdue</small>}
                      </td>
                      <td>
                        <div className="ClientTasksUpdatesPage-progress">
                          <span>{task.progress}%</span>
                          <div><i style={{ width: `${task.progress}%` }}></i></div>
                        </div>
                      </td>
                      <td><span className={`ClientTasksUpdatesPage-status ClientTasksUpdatesPage-${task.status.replace(/\s/g, '').toLowerCase()}`}>{task.status}</span></td>
                      <td><button className="ClientTasksUpdatesPage-review" type="button">{index === 0 ? 'Review' : 'View Details'}</button></td>
                      <td><FiMoreVertical /></td>
                    </tr>
                  ))}
                  {!taskRows.length && (
                    <tr>
                      <td colSpan={10} className="ClientTasksUpdatesPage-emptyCell">No tasks match this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ClientTasksUpdatesPage-pagination">
              <span>Showing 1 to {taskRows.length} of {filteredTaskSource.length} tasks</span>
              <div>
                <button type="button"><FiChevronLeft /></button>
                <button className="ClientTasksUpdatesPage-active" type="button">1</button>
                <button type="button">2</button>
                <button type="button">3</button>
                <button type="button">4</button>
                <button type="button">5</button>
                <button type="button">...</button>
                <button type="button">6</button>
                <button type="button"><FiChevronRight /></button>
              </div>
              <select defaultValue="10"><option value="10">10 / page</option></select>
            </div>
          </section>
        </section>

        <aside className="ClientTasksUpdatesPage-side">
          <section className="ClientTasksUpdatesPage-sideCard">
            <div className="ClientTasksUpdatesPage-cardHead">
              <h3>Recent Updates</h3>
              <button type="button" onClick={() => setDetailsModal('updates')}>View All</button>
            </div>
            <div className="ClientTasksUpdatesPage-updateList">
              {recentUpdates.map(update => (
                <article key={update.title}>
                  <div className={`ClientTasksUpdatesPage-updateIcon ClientTasksUpdatesPage-is-${update.tone}`}>{update.icon}</div>
                  <div>
                    <strong>{update.title}</strong>
                    <span>{update.time}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ClientTasksUpdatesPage-sideCard">
            <div className="ClientTasksUpdatesPage-cardHead">
              <h3>Upcoming Deadlines</h3>
              <button type="button" onClick={() => setDetailsModal('deadlines')}>View All</button>
            </div>
            <div className="ClientTasksUpdatesPage-deadlineList">
              {upcomingDeadlines.map((task, index) => (
                <article key={`${task.id}-deadline`}>
                  <time>{formatShortDate(task.dueDate)}</time>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.service}</span>
                  </div>
                  <i className={`ClientTasksUpdatesPage-dot-${index % 3}`}></i>
                </article>
              ))}
            </div>
          </section>
        </aside>
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
          <button type="button" onClick={() => setDetailsModal('tasks')}>View All Tasks <FiChevronRight /></button>
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
            <button type="button">View Profile</button>
          </div>
          <span>Account Manager</span>
          <div className="ClientTasksUpdatesPage-manager">
            <b>{getInitials(manager.name || clientName)}</b>
            <div>
              <strong>{manager.name || 'Account Manager'}</strong>
              <small>{manager.email || 'No email assigned'}</small>
              <small>{manager.phone || 'No phone assigned'}</small>
            </div>
          </div>
          <span>Project Team</span>
          <div className="ClientTasksUpdatesPage-teamAvatars">
            {teamMembers.map(member => <i key={member.email || member.name}>{getInitials(member.name)}</i>)}
            {projectManagers.length > teamMembers.length && <b>+{projectManagers.length - teamMembers.length}</b>}
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
            className="ClientTasksUpdatesPage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ClientTasksUpdatesPage-modalTitle"
            onClick={event => event.stopPropagation()}
          >
            <header className="ClientTasksUpdatesPage-modalHead">
              <div>
                <span>Tasks & Updates</span>
                <h3 id="ClientTasksUpdatesPage-modalTitle">
                  {detailsModal === 'updates' && 'All Recent Updates'}
                  {detailsModal === 'deadlines' && 'All Upcoming Deadlines'}
                  {detailsModal === 'tasks' && 'All Tasks'}
                  {detailsModal === 'project' && 'Project Details'}
                </h3>
              </div>
              <button type="button" aria-label="Close details" onClick={() => setDetailsModal(null)}>
                <FiX />
              </button>
            </header>

            {detailsModal === 'updates' && (
              <div className="ClientTasksUpdatesPage-modalList">
                {allRecentUpdates.map(update => (
                  <article key={`${update.title}-${update.time}`}>
                    <div className={`ClientTasksUpdatesPage-updateIcon ClientTasksUpdatesPage-is-${update.tone}`}>{update.icon}</div>
                    <div>
                      <strong>{update.title}</strong>
                      <span>{update.service} - {update.time}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {detailsModal === 'deadlines' && (
              <div className="ClientTasksUpdatesPage-modalList ClientTasksUpdatesPage-modalDeadlineList">
                {allUpcomingDeadlines.map((task, index) => (
                  <article key={`${task.id}-all-deadline`}>
                    <time>{formatShortDate(task.dueDate)}</time>
                    <div>
                      <strong>{task.title}</strong>
                      <span>{task.service} - {task.priority}</span>
                    </div>
                    <i className={`ClientTasksUpdatesPage-dot-${index % 3}`}></i>
                  </article>
                ))}
                {!allUpcomingDeadlines.length && <p className="ClientTasksUpdatesPage-modalEmpty">No upcoming deadlines found.</p>}
              </div>
            )}

            {detailsModal === 'tasks' && (
              <div className="ClientTasksUpdatesPage-modalTable">
                <div className="ClientTasksUpdatesPage-modalTableHead">
                  <span>Task</span><span>Service</span><span>Priority</span><span>Due Date</span><span>Progress</span><span>Status</span>
                </div>
                {allFilteredTaskRows.map(task => (
                  <div className="ClientTasksUpdatesPage-modalTableRow" key={`${task.id}-modal`}>
                    <strong>{task.title}</strong>
                    <span>{task.service}</span>
                    <span>{task.priority}</span>
                    <span>{formatDate(task.dueDate)}</span>
                    <span>{task.progress}%</span>
                    <em className={`ClientTasksUpdatesPage-status ClientTasksUpdatesPage-${task.status.replace(/\s/g, '').toLowerCase()}`}>{task.status}</em>
                  </div>
                ))}
                {!allFilteredTaskRows.length && <p className="ClientTasksUpdatesPage-modalEmpty">No tasks match this filter.</p>}
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
