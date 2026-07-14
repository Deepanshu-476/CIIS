import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiHeadphones,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiSmartphone,
  FiX
} from 'react-icons/fi';
import { MdOutlinePalette, MdOutlineWeb } from 'react-icons/md';
import {
  calculateTaskStats,
  formatDate,
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
  const [taskDetail, setTaskDetail] = useState(null);
  const [taskFilter, setTaskFilter] = useState('All');
  const [taskSort, setTaskSort] = useState('Newest');
  const [taskPage, setTaskPage] = useState(1);
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

  const timeline = filteredServices[0] ? [
    { title: 'Started', date: filteredServices[0].start, state: 'Completed', tone: 'done', icon: <FiCheck /> },
    { title: 'Tasks', date: `${tasks.filter(task => task.serviceName === filteredServices[0].rawTitle).length} total`, state: 'Active', tone: 'active', icon: <FiBarChart2 /> },
    { title: 'Progress', date: `${filteredServices[0].progress}%`, state: filteredServices[0].status, tone: 'active', icon: <FiClock /> },
    { title: 'Renewal', date: filteredServices[0].end, state: 'Upcoming', tone: 'next', icon: <FiSend /> }
  ] : [];

  const getServiceTasks = serviceName => tasks.filter(task => task.serviceName === serviceName);
  const getTaskStatus = task => task?.completed ? 'Completed' : task?.status || 'Pending';
  const normalizeTaskStatus = task => getTaskStatus(task).toLowerCase().replace(/\s+/g, '-');
  const taskPageSize = 7;
  const modalTasks = useMemo(() => {
    if (!tasksService) return [];
    const filtered = getServiceTasks(tasksService.rawTitle).filter(task => (
      taskFilter === 'All' || normalizeTaskStatus(task) === taskFilter.toLowerCase().replace(/\s+/g, '-')
    ));
    return [...filtered].sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt || a.dueDate || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || b.dueDate || 0).getTime();
      return taskSort === 'Oldest' ? aDate - bDate : bDate - aDate;
    });
  }, [taskFilter, taskSort, tasks, tasksService]);
  const modalTaskPages = Math.max(1, Math.ceil(modalTasks.length / taskPageSize));
  const visibleModalTasks = modalTasks.slice((taskPage - 1) * taskPageSize, taskPage * taskPageSize);
  const taskFilterCounts = useMemo(() => {
    const serviceTasks = tasksService ? getServiceTasks(tasksService.rawTitle) : [];
    return ['All', 'Pending', 'Completed', 'Overdue'].reduce((counts, filter) => {
      counts[filter] = filter === 'All'
        ? serviceTasks.length
        : serviceTasks.filter(task => normalizeTaskStatus(task) === filter.toLowerCase()).length;
      return counts;
    }, {});
  }, [tasks, tasksService]);

  const openTasksModal = service => {
    setTaskFilter('All');
    setTaskSort('Newest');
    setTaskPage(1);
    setTasksService(service);
  };

  const exportServiceTasks = () => {
    if (!tasksService || !modalTasks.length) return;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.setFillColor(80, 70, 235);
    pdf.rect(0, 0, pageWidth, 76, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(19);
    pdf.text(`${tasksService.title} Tasks`, 38, 35);
    pdf.setFontSize(9);
    pdf.text(`Service progress: ${tasksService.progress}%  |  Exported: ${new Date().toLocaleDateString()}`, 38, 54);
    autoTable(pdf, {
      startY: 96,
      head: [['Task', 'Description', 'Status', 'Due Date']],
      body: modalTasks.map(task => [
        getTaskTitle(task),
        task.description || task.notes || 'No description added',
        getTaskStatus(task),
        formatDate(task.dueDate || task.updatedAt || task.createdAt)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [80, 70, 235], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [35, 47, 71] },
      alternateRowStyles: { fillColor: [248, 249, 255] },
      margin: { left: 38, right: 38 }
    });
    pdf.save(`${tasksService.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-tasks.pdf`);
  };

  useEffect(() => {
    if (taskPage > modalTaskPages) setTaskPage(modalTaskPages);
  }, [modalTaskPages, taskPage]);

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
                        <button type="button" onClick={() => openTasksModal(service)}><FiFileText /> View Tasks</button>
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

        </div>
      </div>

      {detailsService && (
        <div className="MyServices-modalOverlay" onClick={() => setDetailsService(null)}>
          <div className="MyServices-modal MyServices-modalDetail" onClick={event => event.stopPropagation()}>
            <header className="MyServices-detailHeader">
              <div className="MyServices-detailHero">
                <span className={`MyServices-detailHeroIcon ${detailsService.tone}`}>{detailsService.icon}</span>
                <div>
                  <h3>{detailsService.title} Details</h3>
                  <p>Detailed overview of your {detailsService.title} service</p>
                </div>
              </div>
              <button type="button" onClick={() => setDetailsService(null)} aria-label="Close"><FiX /></button>
            </header>
            <div className="MyServices-modalBody">
              <div className="MyServices-detailGrid MyServices-detailVisualGrid">
                <section className="MyServices-detailCard status">
                  <i><FiCheckCircle /></i><div><small>Status</small><strong>{detailsService.status}</strong><em>Active</em></div>
                </section>
                <section className="MyServices-detailCard progress">
                  <i><FiBarChart2 /></i><div><small>Progress</small><strong>{detailsService.progress}%</strong><b><span style={{ width: `${detailsService.progress}%` }} /></b></div>
                </section>
                <section className="MyServices-detailCard start">
                  <i><FiCalendar /></i><div><small>Start Date</small><strong>{detailsService.start}</strong><em>Service start</em></div>
                </section>
                <section className="MyServices-detailCard end">
                  <i><FiCalendar /></i><div><small>End Date</small><strong>{detailsService.end}</strong><em>Service end</em></div>
                </section>
                <section className="MyServices-detailCard tasks">
                  <i><FiCheck /></i><div><small>Total Tasks</small><strong>{getServiceTasks(detailsService.rawTitle).length}</strong><p>Tasks to complete</p></div>
                </section>
                <section className="MyServices-detailCard team">
                  <i><FiBriefcase /></i><div><small>Team Members</small><strong>{projectManagers.length}</strong><p>Working on this service</p></div>
                </section>
              </div>
              <div className="MyServices-latestTask">
                <i><FiFileText /></i>
                <div><small>Latest Task</small><strong>{detailsService.description.replace(/^Latest task:\s*/i, '')}</strong><p>{detailsService.description}</p></div>
                <span><FiClock /> Updated today</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tasksService && (
        <div className="MyServices-modalOverlay" onClick={() => setTasksService(null)}>
          <div className="MyServices-modal MyServices-modalTasks" onClick={event => event.stopPropagation()}>
            <header className="MyServices-tasksHeader">
              <div className="MyServices-tasksHero">
                <i><FiFileText /></i>
                <div><h3>{tasksService.title} Tasks</h3><p>Manage and track your {tasksService.title} tasks</p></div>
              </div>
              <button type="button" onClick={() => setTasksService(null)} aria-label="Close"><FiX /></button>
            </header>
            <div className="MyServices-modalBody">
              <div className="MyServices-taskToolbar">
                <div className="MyServices-taskTotal"><i><FiSend /></i><div><small>Total Tasks</small><strong>{getServiceTasks(tasksService.rawTitle).length}</strong></div></div>
                <div className="MyServices-taskTabs" role="tablist" aria-label="Filter tasks">
                  {['All', 'Pending', 'Completed', 'Overdue'].map(filter => <button key={filter} type="button" className={taskFilter === filter ? 'active' : ''} onClick={() => { setTaskFilter(filter); setTaskPage(1); }}>{filter}<span>{taskFilterCounts[filter]}</span></button>)}
                </div>
                <label className="MyServices-taskSort"><span>Sort by:</span><select value={taskSort} onChange={event => { setTaskSort(event.target.value); setTaskPage(1); }}><option>Newest</option><option>Oldest</option></select><FiChevronDown /></label>
              </div>
              {visibleModalTasks.length ? (
                <div className="MyServices-taskList MyServices-taskModernList">
                  {visibleModalTasks.map((task, index) => (
                    <article className="MyServices-taskRow MyServices-taskModernRow" key={task._id || task.id || `${tasksService.title}-${getTaskTitle(task)}`}>
                      <i><FiFileText /></i>
                      <div className="MyServices-taskCopy"><strong>{getTaskTitle(task)}</strong><span>{task.description || task.notes || 'No description added'}</span></div>
                      <em className={normalizeTaskStatus(task)}>{getTaskStatus(task)}</em>
                      <time><FiCalendar />{formatDate(task.dueDate || task.updatedAt || task.createdAt)}</time>
                      <button type="button" onClick={() => setTaskDetail(task)} aria-label={`View ${getTaskTitle(task)}`}><FiChevronRight /></button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="MyServices-empty MyServices-emptyCompact"><FiFileText /><strong>No {taskFilter.toLowerCase()} tasks found</strong><span>Try another status filter.</span></div>
              )}
            </div>
            <footer className="MyServices-tasksFooter">
              <div><i><FiBriefcase /></i><span>Showing {modalTasks.length ? ((taskPage - 1) * taskPageSize) + 1 : 0} to {Math.min(taskPage * taskPageSize, modalTasks.length)} of {modalTasks.length} tasks</span></div>
              <nav aria-label="Task pages"><button type="button" className="MyServices-pageStep" disabled={taskPage === 1} onClick={() => setTaskPage(page => page - 1)}><FiChevronLeft /> Previous</button>{Array.from({ length: modalTaskPages }, (_, index) => index + 1).slice(0, 4).map(page => <button key={page} type="button" className={taskPage === page ? 'active' : ''} onClick={() => setTaskPage(page)}>{page}</button>)}<button type="button" className="MyServices-pageStep" disabled={taskPage === modalTaskPages} onClick={() => setTaskPage(page => page + 1)}>Next <FiChevronRight /></button></nav>
              <button type="button" className="MyServices-exportTasks" onClick={exportServiceTasks}><FiDownload /> Export Tasks</button>
            </footer>
          </div>
        </div>
      )}

      {taskDetail && (
        <div className="MyServices-modalOverlay" onClick={() => setTaskDetail(null)}>
          <div className="MyServices-modal MyServices-taskDetailModal" role="dialog" aria-modal="true" aria-label="Task details" onClick={event => event.stopPropagation()}>
            <header>
              <div className="MyServices-taskDetailTitle"><i><FiFileText /></i><div><span>Task Details</span><h3>{getTaskTitle(taskDetail)}</h3></div></div>
              <button type="button" onClick={() => setTaskDetail(null)} aria-label="Close"><FiX /></button>
            </header>
            <div className="MyServices-modalBody MyServices-taskDetailBody">
              <p>{taskDetail.description || taskDetail.notes || 'No description added for this task.'}</p>
              <div>
                <span><small>Status</small><strong>{getTaskStatus(taskDetail)}</strong></span>
                <span><small>Due Date</small><strong>{formatDate(taskDetail.dueDate || taskDetail.updatedAt || taskDetail.createdAt)}</strong></span>
                <span><small>Priority</small><strong>{taskDetail.priority || 'Medium'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyServicesPage;
