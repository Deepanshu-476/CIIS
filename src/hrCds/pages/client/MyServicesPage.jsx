import React, { useEffect, useMemo, useState } from 'react';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiHeadphones,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiSmartphone,
  FiTarget,
  FiUsers,
  FiX
} from 'react-icons/fi';
import { MdOutlinePalette, MdOutlineWeb } from 'react-icons/md';
import {
  calculatePaymentSummary,
  calculateTaskStats,
  formatDate,
  formatMoney,
  getTaskTitle,
  useClientPortalData
} from '../../utils/clientPortalData';
import './MyServicesPage.css';

const getInitials = value => String(value || 'U').trim().slice(0, 1).toUpperCase();
const tones = ['blue', 'green', 'coral', 'violet', 'sky', 'rose'];
const getServiceIcon = service => {
  const name = String(service || '').toLowerCase();
  if (name.includes('web')) return <MdOutlineWeb />;
  if (name.includes('design') || name.includes('brand')) return <MdOutlinePalette />;
  if (name.includes('app') || name.includes('mobile')) return <FiSmartphone />;
  if (name.includes('support') || name.includes('maintenance')) return <FiHeadphones />;
  if (name.includes('seo') || name.includes('marketing')) return <FiBarChart2 />;
  return <FiBriefcase />;
};

const MyServicesPage = () => {
  const { client, services, tasks, projectManagers, loading, error, refetch } = useClientPortalData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Status');
  const [serviceType, setServiceType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Recently Updated');
  const [detailsService, setDetailsService] = useState(null);
  const [tasksService, setTasksService] = useState(null);
  const [showAllServices, setShowAllServices] = useState(false);

  const serviceCards = useMemo(() => services.map((serviceName, index) => {
    const serviceTasks = tasks.filter(task => task.serviceName === serviceName);
    const completed = serviceTasks.filter(task => task.completed === true).length;
    const progress = serviceTasks.length ? Math.round((completed / serviceTasks.length) * 100) : 0;
    const latestTask = serviceTasks[0];
    const latestSubscription = client?.subscription?.[client?.subscription?.length - 1];

    return {
      rawTitle: serviceName,
      title: serviceName,
      description: latestTask ? `Latest task: ${getTaskTitle(latestTask)}` : `${serviceName} service is active for your account.`,
      status: serviceTasks.length && progress === 100 ? 'Completed' : serviceTasks.length ? 'In Progress' : 'Active',
      type: serviceName,
      tone: tones[index % tones.length],
      icon: getServiceIcon(serviceName),
      start: formatDate(client?.subscription?.[0]?.startDate || client?.subscriptionStartDate || client?.createdAt),
      end: formatDate(latestSubscription?.endDate || client?.subscriptionEndDate),
      progress,
      team: projectManagers.slice(0, 4),
      more: Math.max(0, projectManagers.length - 4),
      updated: latestTask?.updatedAt || latestTask?.createdAt || client?.updatedAt || client?.createdAt || ''
    };
  }), [client, projectManagers, services, tasks]);

  const taskStats = calculateTaskStats(tasks);
  const paymentSummary = calculatePaymentSummary(client);
  const stats = [
    { label: 'Active Services', value: services.length, icon: <FiBriefcase />, tone: 'blue' },
    { label: 'Completed Tasks', value: taskStats.completedTasks, icon: <FiCheckCircle />, tone: 'green' },
    { label: 'In Progress', value: taskStats.inProgressTasks, icon: <FiRefreshCw />, tone: 'orange' },
    { label: 'Open Tasks', value: taskStats.pendingTasks + taskStats.overdueTasks, icon: <FiHeadphones />, tone: 'purple' }
  ];

  const serviceTypes = useMemo(() => [...new Set(serviceCards.map(service => service.type))], [serviceCards]);

  const filteredServices = useMemo(() => {
    const text = query.trim().toLowerCase();
    return serviceCards
      .filter(service => (
        (!text || `${service.title} ${service.description} ${service.type}`.toLowerCase().includes(text)) &&
        (status === 'All Status' || service.status === status) &&
        (serviceType === 'All Types' || service.type === serviceType)
      ))
      .sort((a, b) => {
        if (sortBy === 'Progress: High to Low') return b.progress - a.progress;
        if (sortBy === 'Progress: Low to High') return a.progress - b.progress;
        if (sortBy === 'Name: A to Z') return a.title.localeCompare(b.title);
        return new Date(b.updated || 0) - new Date(a.updated || 0);
      });
  }, [query, serviceCards, serviceType, sortBy, status]);
  const visibleServices = showAllServices ? filteredServices : filteredServices.slice(0, 6);
  const hasMoreServices = filteredServices.length > visibleServices.length;

  useEffect(() => {
    setShowAllServices(false);
  }, [query, serviceType, sortBy, status]);

  const deliverables = tasks
    .filter(task => task.dueDate && task.completed !== true)
    .slice()
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3)
    .map(task => {
      const dueDate = new Date(task.dueDate);
      return {
        month: Number.isNaN(dueDate.getTime()) ? '' : dueDate.toLocaleString('en-US', { month: 'short' }),
        day: Number.isNaN(dueDate.getTime()) ? '' : dueDate.getDate(),
        title: task.serviceName || 'Service Task',
        text: getTaskTitle(task),
        due: formatDate(task.dueDate)
      };
    });

  const updates = tasks.slice(0, 3).map((task, index) => ({
    title: task.serviceName || 'Service Update',
    text: getTaskTitle(task),
    date: formatDate(task.updatedAt || task.createdAt || task.dueDate),
    tone: ['blue', 'green', 'blue'][index % 3]
  }));

  const timeline = filteredServices[0] ? [
    { title: 'Started', date: filteredServices[0].start, state: 'Completed', tone: 'done', icon: <FiCheck /> },
    { title: 'Tasks', date: `${tasks.filter(task => task.serviceName === filteredServices[0].rawTitle).length} total`, state: 'Active', tone: 'active', icon: <FiBarChart2 /> },
    { title: 'Progress', date: `${filteredServices[0].progress}%`, state: filteredServices[0].status, tone: 'active', icon: <FiClock /> },
    { title: 'Renewal', date: filteredServices[0].end, state: 'Upcoming', tone: 'next', icon: <FiSend /> }
  ] : [];

  const getServiceTasks = serviceName => tasks.filter(task => task.serviceName === serviceName);

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return (
      <div className="MyServices-empty">
        <FiSearch />
        <strong>{error || 'No client data found for this login.'}</strong>
        <button type="button" onClick={refetch}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="MyServices-shell">
      <div className="MyServices-dashboard">
        <header className="MyServices-heading">
          <div>
            <h1>My Services</h1>
            <p>Track all your active services, progress, timelines and assigned teams.</p>
          </div>
          <div className="MyServices-stats">
            {stats.map(item => (
              <div className="MyServices-stat" key={item.label}>
                <span className={item.tone}>{item.icon}</span>
                <div><small>{item.label}</small><strong>{item.value}</strong></div>
              </div>
            ))}
          </div>
        </header>

        <div className="MyServices-content">
          <div className="MyServices-left">
            <section className="MyServices-services-panel">
              <div className="MyServices-filterbar">
                <label className="MyServices-service-search">
                  <input aria-label="Search services" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services by name or keyword..." />
                  <FiSearch />
                </label>
                <label className="MyServices-filter">
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option>All Status</option><option>Active</option><option>In Progress</option><option>Completed</option>
                  </select>
                  <FiChevronDown />
                </label>
                <label className="MyServices-filter">
                  <span>Service Type</span>
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    <option>All Types</option>{serviceTypes.map(type => <option key={type}>{type}</option>)}
                  </select>
                  <FiChevronDown />
                </label>
                <label className="MyServices-filter">
                  <span>Sort By</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option>Recently Updated</option><option>Progress: High to Low</option>
                    <option>Progress: Low to High</option><option>Name: A to Z</option>
                  </select>
                  <FiChevronDown />
                </label>
              </div>

              {filteredServices.length ? (
                <div className="MyServices-grid">
                  {visibleServices.map(service => (
                    <article className="MyServices-card" key={service.rawTitle}>
                      <div className="MyServices-card-top">
                        <span className={`MyServices-service-icon ${service.tone}`}>{service.icon}</span>
                        <div className="MyServices-card-copy"><h2>{service.title}</h2><p>{service.description}</p></div>
                        <span className={`MyServices-badge ${service.status.replace(/\s/g, '-').toLowerCase()}`}>{service.status}</span>
                      </div>
                      <div className="MyServices-dates">
                        <span><FiCalendar /><strong>Start Date</strong></span><time>{service.start}</time>
                        <span><FiCalendar /></span><time>{service.end}</time>
                      </div>
                      <div className="MyServices-progress-row">
                        <div className="MyServices-avatars">
                          {service.team.map(person => <span key={`${service.rawTitle}-${person.email || person.name}`}>{getInitials(person.name)}</span>)}
                          {service.more > 0 && <span>+{service.more}</span>}
                        </div>
                        <strong>{service.progress}%</strong>
                      </div>
                      <div className={`MyServices-progress ${service.tone}`}><span style={{ width: `${service.progress}%` }} /></div>
                      <footer>
                        <button type="button" onClick={() => setDetailsService(service)}><FiFileText /> View Details</button>
                        <button type="button" onClick={() => setTasksService(service)}><FiFileText /> View Tasks</button>
                      </footer>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="MyServices-empty"><FiSearch /><strong>No services found</strong><span>Try changing your search or filters.</span></div>
              )}
              {hasMoreServices && (
                <button className="MyServices-view-all" type="button" onClick={() => setShowAllServices(true)}>
                  View All Services <FiChevronRight />
                </button>
              )}
            </section>

            <div className="MyServices-bottom">
              <section className="MyServices-timeline">
                <header><h3>Service Timeline: {filteredServices[0]?.title || 'No active service'}</h3><span>{filteredServices[0]?.status || 'N/A'}</span></header>
                <div className="MyServices-timeline-track">
                  {timeline.map(step => (
                    <div className={`MyServices-step ${step.tone}`} key={step.title}>
                      <i>{step.icon}</i><strong>{step.title}</strong><time>{step.date}</time><small>{step.state}</small>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>

          <aside className="MyServices-sidebar">
            <section className="MyServices-side-panel MyServices-deliverables">
              <header><h3><FiCalendar /> Upcoming Deliverables</h3><button type="button">View All</button></header>
              {deliverables.length ? deliverables.map(item => (
                <div className="MyServices-deliverable" key={`${item.title}-${item.day}`}>
                  <time><span>{item.month}</span><strong>{item.day}</strong></time>
                  <div><strong>{item.title}</strong><p>{item.text}</p></div>
                  <em>{item.due}</em>
                </div>
              )) : <div className="MyServices-empty"><FiCalendar /><strong>No upcoming deliverables</strong></div>}
              <button className="MyServices-side-link" type="button">View All Deliverables <FiChevronRight /></button>
            </section>

            <section className="MyServices-side-panel MyServices-updates">
              <header><h3><FiClock /> Recent Service Updates</h3><button type="button">View All</button></header>
              {updates.length ? updates.map(item => (
                <div className="MyServices-update" key={`${item.title}-${item.text}`}>
                  <i className={item.tone}><FiTarget /></i>
                  <div><strong>{item.title}</strong><p>{item.text}</p></div>
                  <time>{item.date}</time><b className={item.tone} />
                </div>
              )) : <div className="MyServices-empty"><FiClock /><strong>No recent updates</strong></div>}
            </section>

            <section className="MyServices-side-panel MyServices-billing">
              <header><h3><FiCalendar /> Billing Snapshot</h3><button type="button">View All Invoices</button></header>
              <div className="MyServices-bill-main">
                <strong>{formatMoney(paymentSummary.outstanding)}<small>Total Outstanding</small></strong>
                <strong>{paymentSummary.unpaidInvoices}<small>Unpaid Invoices</small></strong>
              </div>
              <div className="MyServices-bill-details">
                <span>Overdue<strong>{formatMoney(paymentSummary.outstanding)}</strong></span>
                <span>Paid<strong>{formatMoney(paymentSummary.paidAmount)}</strong></span>
                <span>Plan Price<strong>{formatMoney(paymentSummary.subscriptionPrice)}</strong></span>
              </div>
            </section>

          </aside>
        </div>
      </div>

      {detailsService && (
        <div className="MyServices-modalOverlay" onClick={() => setDetailsService(null)}>
          <div className="MyServices-modal" onClick={event => event.stopPropagation()}>
            <header>
              <h3>{detailsService.title} Details</h3>
              <button type="button" onClick={() => setDetailsService(null)} aria-label="Close"><FiX /></button>
            </header>
            <div className="MyServices-modalBody">
              <div className="MyServices-detailGrid">
                <span>Status<strong>{detailsService.status}</strong></span>
                <span>Progress<strong>{detailsService.progress}%</strong></span>
                <span>Start Date<strong>{detailsService.start}</strong></span>
                <span>End Date<strong>{detailsService.end}</strong></span>
                <span>Total Tasks<strong>{getServiceTasks(detailsService.rawTitle).length}</strong></span>
                <span>Team Members<strong>{projectManagers.length}</strong></span>
              </div>
              <p className="MyServices-detailText">{detailsService.description}</p>
            </div>
          </div>
        </div>
      )}

      {tasksService && (
        <div className="MyServices-modalOverlay" onClick={() => setTasksService(null)}>
          <div className="MyServices-modal MyServices-modalLarge" onClick={event => event.stopPropagation()}>
            <header>
              <h3>{tasksService.title} Tasks</h3>
              <button type="button" onClick={() => setTasksService(null)} aria-label="Close"><FiX /></button>
            </header>
            <div className="MyServices-modalBody">
              {getServiceTasks(tasksService.rawTitle).length ? (
                <div className="MyServices-taskList">
                  {getServiceTasks(tasksService.rawTitle).map(task => (
                    <div className="MyServices-taskRow" key={task._id || task.id || `${tasksService.title}-${getTaskTitle(task)}`}>
                      <div>
                        <strong>{getTaskTitle(task)}</strong>
                        <span>{task.description || task.notes || 'No description added'}</span>
                      </div>
                      <em>{task.completed ? 'Completed' : task.status || 'Pending'}</em>
                      <time>{formatDate(task.dueDate || task.updatedAt || task.createdAt)}</time>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="MyServices-empty MyServices-emptyCompact"><FiFileText /><strong>No tasks found for this service</strong></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyServicesPage;
