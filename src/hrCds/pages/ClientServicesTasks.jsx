import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './ClientServicesTasks.css'; 
import {
  getClientPortalCompanyContext,
  getCompanyScopedClientParams
} from '../utils/clientPortalData';

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
  FiSend,
  FiUpload,
  FiUsers
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

const fallbackServices = [
  'Website Redesign',
  'SEO Optimization',
  'Mobile App Development',
  'Branding & Creatives',
  'IT Support & Maintenance'
];

const ServicesTasks = () => {
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({ companyCode: '', companyIdentifier: '' });

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
      const requestCompanyInfo = getClientPortalCompanyContext(user);
      if (!requestCompanyInfo.companyCode) {
        setClient(null);
        setServices([]);
        setAllTasks([]);
        setError('Company code missing. Please login again from your company portal.');
        return;
      }

      const response = await api.get('/', {
        params: {
          ...getCompanyScopedClientParams(requestCompanyInfo),
          limit: 1000
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

      if (!currentClient && allClients.length > 0) currentClient = allClients[0];
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

  const completedTasks = allTasks.filter(task => task.completed === true);
  const overdueTasks = allTasks.filter(isClientTaskOverdue);
  const pendingTasks = allTasks.filter(task => task.completed !== true && !isClientTaskOverdue(task));
  const totalTasks = allTasks.length;
  const inProgressTasks = allTasks.filter(task => String(task.status || '').toLowerCase().includes('progress'));
  const clientName = client?.client || client?.name || 'Client';
  const projectManagers = client?.projectManagers || [];
  const baseServices = services.length ? services : fallbackServices;

  const serviceRows = baseServices.map((service, index) => {
    const serviceTasks = allTasks.filter(task => task.serviceName === service);
    const taskTotal = serviceTasks.length || [8, 7, 6, 5, 6][index] || 5;
    const done = serviceTasks.length ? serviceTasks.filter(task => task.completed).length : [6, 4, 3, 5, 3][index] || 2;
    const progress = Math.round((done / taskTotal) * 100);
    return { service, taskTotal, done, progress };
  });

  const fallbackTasks = serviceRows.slice(0, 8).map((row, index) => ({
    _id: `fallback-task-${index}`,
    name: [
      'Homepage Design Approval',
      'SEO Keyword Research',
      'Mobile App UI Kit',
      'Content Migration',
      'Logo Design Finalization',
      'UAT Feedback Review',
      'Server Health Check',
      'Analytics & Tracking Setup'
    ][index],
    serviceName: row.service,
    dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    status: index === 0 ? 'pending approval' : index === 5 ? 'overdue' : index === 7 ? 'upcoming' : 'in progress',
    priority: index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low',
    completed: index === 4 || index === 6
  }));

  const taskRows = (allTasks.length ? allTasks : fallbackTasks).slice(0, 8).map((task, index) => {
    const completed = task.completed === true;
    const overdue = isClientTaskOverdue(task) || String(task.status || '').toLowerCase() === 'overdue';
    const status = completed
      ? 'Completed'
      : overdue
        ? 'Overdue'
        : String(task.status || 'In Progress').replace(/\b\w/g, char => char.toUpperCase());
    const progress = completed ? 100 : overdue ? 90 : [80, 60, 75, 40, 100, 90, 100, 20][index] || 55;

    return {
      id: task._id || task.id || `${getTaskTitle(task)}-${index}`,
      title: getTaskTitle(task),
      service: task.serviceName || baseServices[index % baseServices.length] || 'Project Service',
      dueDate: task.dueDate,
      status,
      priority: String(task.priority || (overdue ? 'High' : 'Medium')).replace(/\b\w/g, char => char.toUpperCase()),
      progress
    };
  });

  const upcomingDeadlines = taskRows
    .filter(task => task.dueDate && task.status !== 'Completed')
    .slice()
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const recentUpdates = [
    { icon: <FiCheckCircle />, tone: 'green', title: `Task "${taskRows[0]?.title || 'Logo Design Finalization'}" completed successfully.`, time: 'Today, 10:23 AM' },
    { icon: <FiUpload />, tone: 'orange', title: 'You uploaded "Brand Guidelines v2.pdf" in Branding & Creatives.', time: 'Today, 09:15 AM' },
    { icon: <FiUsers />, tone: 'orange', title: `Approval requested for "${taskRows[0]?.title || 'Homepage Design'}".`, time: 'Yesterday, 04:45 PM' },
    { icon: <FiCalendar />, tone: 'blue', title: `Meeting note added for ${baseServices[0] || 'Website Redesign'} project.`, time: 'Yesterday, 11:30 AM' },
    { icon: <FiDownload />, tone: 'purple', title: 'Invoice INV-2026-065 document reminder sent.', time: 'May 9, 2026, 05:20 PM' }
  ];

  const stats = [
    { label: 'Total Tasks', value: totalTasks || 48, tone: 'blue', icon: <FiCalendar />, trend: '+12%', helper: 'vs last month', spark: 'M2 23 C10 19, 17 26, 25 21 S41 16, 50 22 S67 28, 76 17 S92 12, 104 19 S114 17, 120 10' },
    { label: 'Completed Tasks', value: completedTasks.length || 21, tone: 'green', icon: <FiCheckCircle />, trend: '+20%', helper: 'vs last month', spark: 'M2 24 C12 16, 18 22, 27 19 S43 12, 52 18 S66 27, 76 21 S90 13, 101 18 S112 12, 120 15' },
    { label: 'In Progress', value: inProgressTasks.length || 14, tone: 'blue', icon: <FiClock />, trend: '+8%', helper: 'vs last month', spark: 'M2 21 C12 18, 20 22, 29 20 S43 17, 54 22 S69 25, 79 19 S94 14, 105 20 S114 17, 120 12' },
    { label: 'Pending Approval', value: taskRows.filter(t => t.status === 'Pending Approval').length || 6, tone: 'orange', icon: <FiUsers />, trend: '-5%', helper: 'vs last month', spark: 'M2 25 C12 25, 17 15, 27 20 S41 26, 51 18 S66 14, 76 23 S88 24, 98 17 S111 18, 120 22' },
    { label: 'Overdue Tasks', value: overdueTasks.length || taskRows.filter(t => t.status === 'Overdue').length || 3, tone: 'red', icon: <FiAlertCircle />, trend: '-40%', helper: 'vs last month', spark: 'M2 24 C12 19, 19 21, 28 17 S43 20, 52 15 S66 25, 77 17 S91 12, 101 20 S112 16, 120 23' },
    { label: 'Upcoming Deadlines', value: upcomingDeadlines.length || 9, tone: 'purple', icon: <FiCalendar />, trend: '', helper: 'Next 30 days', spark: 'M2 25 C13 20, 20 24, 30 17 S45 18, 55 13 S69 19, 78 16 S92 10, 102 14 S113 9, 120 12' }
  ];

  const distribution = [
    { label: 'Completed', value: stats[1].value, color: '#1f78ff' },
    { label: 'In Progress', value: stats[2].value, color: '#60a5fa' },
    { label: 'Pending Approval', value: stats[3].value, color: '#f59e0b' },
    { label: 'Overdue', value: stats[4].value, color: '#ef4444' },
    { label: 'Upcoming', value: Math.max(3, upcomingDeadlines.length), color: '#8b5cf6' }
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

  const projectProgress = serviceRows[0] || { service: 'Website Redesign', progress: 68 };
  const manager = projectManagers[0] || { name: 'Rahul Sharma', email: 'rahul.sharma@ciisnetwork.com', phone: '+91 98765 43221' };
  const teamMembers = (projectManagers.length ? projectManagers : [
    { name: 'Aman Verma' },
    { name: 'Neha Kapoor' },
    { name: 'Isha Mehta' },
    { name: 'Dev Patel' }
  ]).slice(0, 4);

  if (loading) {
    return (
      <div className="ClientServicesTasks-loading">
        <div className="ClientServicesTasks-spinner"></div>
        <p>Loading your tasks...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="ClientServicesTasks-error">
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
    <div className="ClientServicesTasks-page">
      <main className="ClientServicesTasks-shell">
        <section className="ClientServicesTasks-main">
          <div className="ClientServicesTasks-titleRow">
            <div>
              <h2>Tasks & Updates</h2>
              <p>Track tasks, milestones, approvals and latest project activity.</p>
            </div>
          </div>

          <section className="ClientServicesTasks-stats">
            {stats.map(stat => (
              <article className={`ClientServicesTasks-statCard tone-${stat.tone}`} key={stat.label}>
                <div className={`ClientServicesTasks-statIcon is-${stat.tone}`}>{stat.icon}</div>
                <div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
                {stat.trend && <small className={String(stat.trend).startsWith('-') ? 'down' : ''}>{stat.trend}</small>}
                <em>{stat.helper}</em>
                <svg viewBox="0 0 120 34" aria-hidden="true">
                  <path d={stat.spark} />
                </svg>
              </article>
            ))}
          </section>

          <section className="ClientServicesTasks-tablePanel">
            <div className="ClientServicesTasks-toolbar">
              <label className="ClientServicesTasks-tableSearch">
                <FiSearch />
                <input type="search" placeholder="Search tasks by name or keyword..." />
              </label>
              <select defaultValue="all"><option value="all">All Status</option></select>
              <select defaultValue="all"><option value="all">All Priority</option></select>
              <select defaultValue="all"><option value="all">All Services</option></select>
              <select defaultValue="any"><option value="any">Anytime</option></select>
              <button type="button" className="ClientServicesTasks-filter"><FiFilter /> Filters</button>
              <button type="button" className="ClientServicesTasks-add"><FiPlus /> Add Task</button>
            </div>

            <div className="ClientServicesTasks-tableWrap">
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
                        <div className="ClientServicesTasks-taskName">
                          <span>{index + 1}</span>
                          <strong>{task.title}</strong>
                        </div>
                      </td>
                      <td>{task.service}</td>
                      <td>
                        <div className="ClientServicesTasks-avatars">
                          {[0, 1, 2].map(item => <i key={item}>{getInitials(teamMembers[item]?.name || clientName)}</i>)}
                          {index % 2 === 0 && <b>+1</b>}
                        </div>
                      </td>
                      <td><span className={`ClientServicesTasks-priority ${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                      <td>
                        {formatDate(task.dueDate)}
                        {task.status === 'Overdue' && <small>Overdue</small>}
                      </td>
                      <td>
                        <div className="ClientServicesTasks-progress">
                          <span>{task.progress}%</span>
                          <div><i style={{ width: `${task.progress}%` }}></i></div>
                        </div>
                      </td>
                      <td><span className={`ClientServicesTasks-status ${task.status.replace(/\s/g, '').toLowerCase()}`}>{task.status}</span></td>
                      <td><button className="ClientServicesTasks-review" type="button">{index === 0 ? 'Review' : 'View Details'}</button></td>
                      <td><FiMoreVertical /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ClientServicesTasks-pagination">
              <span>Showing 1 to {taskRows.length} of {taskRows.length} tasks</span>
              <div>
                <button type="button"><FiChevronLeft /></button>
                <button className="active" type="button">1</button>
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

        <aside className="ClientServicesTasks-side">
          <section className="ClientServicesTasks-sideCard">
            <div className="ClientServicesTasks-cardHead">
              <h3>Recent Updates</h3>
              <button type="button">View All</button>
            </div>
            <div className="ClientServicesTasks-updateList">
              {recentUpdates.map(update => (
                <article key={update.title}>
                  <div className={`ClientServicesTasks-updateIcon is-${update.tone}`}>{update.icon}</div>
                  <div>
                    <strong>{update.title}</strong>
                    <span>{update.time}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ClientServicesTasks-sideCard">
            <div className="ClientServicesTasks-cardHead">
              <h3>Upcoming Deadlines</h3>
              <button type="button">View All</button>
            </div>
            <div className="ClientServicesTasks-deadlineList">
              {upcomingDeadlines.map((task, index) => (
                <article key={`${task.id}-deadline`}>
                  <time>{formatShortDate(task.dueDate)}</time>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.service}</span>
                  </div>
                  <i className={`dot-${index % 3}`}></i>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <section className="ClientServicesTasks-bottomGrid">
        <article className="ClientServicesTasks-widget ClientServicesTasks-distribution">
          <h3>Task Distribution</h3>
          <div className="ClientServicesTasks-donutBox">
            <div className="ClientServicesTasks-donut">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div><strong>{totalTasks || taskRows.length}</strong><span>Total Tasks</span></div>
            </div>
            <div className="ClientServicesTasks-legend">
              {distribution.map(item => (
                <p key={item.label}>
                  <i style={{ background: item.color }}></i>
                  <span>{item.label}</span>
                  <strong>{item.value} ({Math.round((item.value / distributionTotal) * 100)}%)</strong>
                </p>
              ))}
            </div>
          </div>
          <button type="button">View All Tasks <FiChevronRight /></button>
        </article>

        <article className="ClientServicesTasks-widget ClientServicesTasks-project">
          <div className="ClientServicesTasks-cardHead">
            <h3>Project Progress Overview</h3>
            <span>In Progress</span>
          </div>
          <strong>{projectProgress.service}</strong>
          <p>Redesign corporate website with modern UI/UX and performance improvements.</p>
          <div className="ClientServicesTasks-milestones">
            {['Discovery', 'Design', 'Development', 'Testing', 'Launch'].map((step, index) => (
              <div key={step} className={index < 3 ? 'done' : ''}>
                <i>{index < 3 ? <FiCheckCircle /> : index + 1}</i>
                <span>{step}</span>
                <small>{index < 3 ? 'Completed' : 'Upcoming'}</small>
              </div>
            ))}
          </div>
          <div className="ClientServicesTasks-overall">
            <span>Overall Progress</span>
            <strong>{projectProgress.progress}%</strong>
            <div><i style={{ width: `${projectProgress.progress}%` }}></i></div>
          </div>
          <button type="button">View Project Details <FiChevronRight /></button>
        </article>

        <article className="ClientServicesTasks-widget ClientServicesTasks-team">
          <div className="ClientServicesTasks-cardHead">
            <h3>Assigned Team & Manager</h3>
            <button type="button">View Profile</button>
          </div>
          <span>Account Manager</span>
          <div className="ClientServicesTasks-manager">
            <b>{getInitials(manager.name || clientName)}</b>
            <div>
              <strong>{manager.name || 'Rahul Sharma'}</strong>
              <small>{manager.email || 'rahul.sharma@ciisnetwork.com'}</small>
              <small>{manager.phone || '+91 98765 43221'}</small>
            </div>
          </div>
          <span>Project Team</span>
          <div className="ClientServicesTasks-teamAvatars">
            {teamMembers.map(member => <i key={member.email || member.name}>{getInitials(member.name)}</i>)}
            <b>+2</b>
          </div>
          <button type="button"><FiSend /> Message Rahul <FiChevronRight /></button>
        </article>

        <article className="ClientServicesTasks-widget ClientServicesTasks-quick">
          <h3>Quick Actions</h3>
          <div>
            <button type="button"><FiGrid /><span>View Service</span><small>See project details</small></button>
            <button type="button"><FiUpload /><span>Upload Feedback</span><small>Share your feedback</small></button>
            <button type="button"><FiCalendar /><span>Book Meeting</span><small>Schedule with team</small></button>
            <button type="button"><FiAlertCircle /><span>Raise Ticket</span><small>Get support</small></button>
          </div>
          <button type="button"><FiGrid /> View All Services <FiChevronRight /></button>
        </article>
      </section>
    </div>
  );
};

export default ServicesTasks;
