import React, { useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCode,
  FiCreditCard,
  FiFileText,
  FiHeadphones,
  FiMessageSquare,
  FiMonitor,
  FiPenTool,
  FiPlus,
  FiSearch,
  FiSmartphone,
  FiTarget,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import './MyServicesPage.css';

const team = {
  rahul: { initials: 'RS', color: '#e8b091' },
  priya: { initials: 'PM', color: '#f0c09d' },
  amit: { initials: 'AV', color: '#9ab3ce' },
  karan: { initials: 'KS', color: '#d6a076' },
  neha: { initials: 'NK', color: '#cf8c79' },
  rohan: { initials: 'RK', color: '#8eabc4' },
};

const services = [
  {
    title: 'Website Redesign',
    description: 'Redesigning corporate website with modern UI/UX and CMS.',
    icon: FiMonitor,
    tone: 'indigo',
    status: 'In Progress',
    start: 'May 10, 2026',
    end: 'Jun 30, 2026',
    progress: 60,
    members: ['rahul', 'priya', 'amit', 'karan'],
    extra: 2,
    taskLabel: 'View Tasks',
  },
  {
    title: 'SEO Optimization',
    description: 'Improving website visibility and ranking across target keywords.',
    icon: FiBarChart2,
    tone: 'green',
    status: 'Active',
    start: 'Apr 15, 2026',
    end: 'Aug 15, 2026',
    progress: 75,
    members: ['neha', 'priya', 'rohan'],
    extra: 1,
    taskLabel: 'View Tasks',
  },
  {
    title: 'Social Media Management',
    description: 'Managing social channels and content strategy.',
    icon: FiTarget,
    tone: 'coral',
    status: 'Active',
    start: 'Apr 20, 2026',
    end: 'Ongoing',
    progress: 80,
    members: ['karan', 'rohan', 'priya'],
    extra: 1,
    taskLabel: 'View Tasks',
  },
  {
    title: 'Mobile App Development',
    description: 'Building cross-platform mobile app for iOS and Android.',
    icon: FiSmartphone,
    tone: 'purple',
    status: 'In Progress',
    start: 'May 15, 2026',
    end: 'Aug 30, 2026',
    progress: 40,
    members: ['rahul', 'amit', 'rohan', 'karan'],
    extra: 3,
    taskLabel: 'View Tasks',
  },
  {
    title: 'IT Support & Maintenance',
    description: 'Ongoing IT support, monitoring and maintenance.',
    icon: FiHeadphones,
    tone: 'blue',
    status: 'Active',
    start: 'Jan 01, 2026',
    end: 'Dec 31, 2026',
    progress: 90,
    members: ['karan'],
    taskLabel: 'View Tickets',
  },
  {
    title: 'Branding & Creatives',
    description: 'Brand identity, creatives and marketing collaterals.',
    icon: FiPenTool,
    tone: 'pink',
    status: 'On Hold',
    start: 'Mar 10, 2026',
    end: 'On Hold',
    progress: 25,
    members: ['neha', 'priya', 'karan'],
    extra: 1,
    taskLabel: 'View Tasks',
  },
];

const deliverables = [
  { month: 'Jun', day: '10', title: 'Website Redesign', subtitle: 'Homepage UI Concepts', due: 'In 2 days' },
  { month: 'Jun', day: '15', title: 'SEO Optimization', subtitle: 'Technical Audit Report', due: 'In 7 days' },
  { month: 'Jun', day: '20', title: 'Mobile App Development', subtitle: 'Beta Build v1.0', due: 'In 12 days' },
];

const timeline = [
  { title: 'Discovery', date: 'May 10, 2026', state: 'Completed', status: 'done', icon: FiCheckCircle },
  { title: 'UI Design', date: 'May 28, 2026', state: 'Completed', status: 'done', icon: FiCheckCircle },
  { title: 'Development', date: 'Jun 1 – Jun 22', state: 'In Progress', status: 'active', icon: FiCode },
  { title: 'Testing', date: 'Jun 23 – Jun 28', state: 'Upcoming', status: 'upcoming', icon: FiClock },
  { title: 'Launch', date: 'Jun 30, 2026', state: 'Upcoming', status: 'upcoming', icon: FiTarget },
];

const Avatar = ({ member }) => {
  const person = team[member];
  return <span className="myServices-avatar" style={{ background: person.color }}>{person.initials}</span>;
};

const SummaryItem = ({ icon: Icon, label, value, tone }) => (
  <div className="myServices-summaryItem">
    <span className={`myServices-summaryIcon ${tone}`}>{React.createElement(Icon)}</span>
    <span><small>{label}</small><strong>{value}</strong></span>
  </div>
);

const ServiceCard = ({ service }) => {
  const Icon = service.icon;
  const statusClass = service.status.toLowerCase().replaceAll(' ', '-');
  return (
    <article className="myServices-serviceCard">
      <div className="myServices-serviceTop">
        <span className={`myServices-serviceIcon ${service.tone}`}><Icon /></span>
        <div className="myServices-serviceCopy">
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
        <span className={`myServices-status ${statusClass}`}>{service.status}</span>
      </div>

      <div className="myServices-dates">
        <span><FiCalendar /> <b>Start Date</b> {service.start}</span>
        <span><FiCalendar /> {service.end}</span>
      </div>

      <div className="myServices-cardTeam">
        <div className="myServices-avatarStack">
          {service.members.map(member => <Avatar member={member} key={member} />)}
          {service.extra && <span className="myServices-avatar myServices-avatarMore">+{service.extra}</span>}
        </div>
      </div>

      <div className="myServices-progressRow">
        <span className="myServices-progressTrack"><i className={service.status === 'On Hold' ? 'hold' : ''} style={{ width: `${service.progress}%` }} /></span>
        <strong>{service.progress}%</strong>
      </div>

      <div className="myServices-cardActions">
        <button type="button"><FiFileText /> View Details</button>
        <button type="button"><FiCreditCard /> {service.taskLabel}</button>
        <button type="button"><FiMessageSquare /> Contact Team</button>
      </div>
    </article>
  );
};

const MyServicesPage = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Status');
  const [serviceType, setServiceType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Recently Updated');

  const filteredServices = useMemo(() => services.filter(service => {
    const matchesQuery = `${service.title} ${service.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'All Status' || service.status === status;
    const matchesType = serviceType === 'All Types' || service.title === serviceType;
    return matchesQuery && matchesStatus && matchesType;
  }), [query, status, serviceType]);

  return (
    <div className="myServices-page">
      <section className="myServices-welcomeBar">
        <div>
          <h2>Welcome back, Test123 <span>👋</span></h2>
          <p>Here&apos;s what&apos;s happening with your account today.</p>
        </div>
        <div className="myServices-welcomeActions">
          <label><FiSearch /><input aria-label="Global search" placeholder="Search services, invoices, tickets..." /></label>
          <button type="button"><FiPlus /> Quick Action <FiChevronDown /></button>
          <span className="myServices-bell"><FiBell /><i>12</i></span>
          <span className="myServices-userBadge">T</span>
          <b>Test123</b><FiChevronDown />
        </div>
      </section>

      <div className="myServices-layout">
        <main className="myServices-main">
          <header className="myServices-pageHeader">
            <div><h1>My Services</h1><p>Track all your active services, progress, timelines and assigned teams.</p></div>
            <div className="myServices-summary">
              <SummaryItem icon={FiBriefcase} label="Active Services" value="6" tone="blue" />
              <SummaryItem icon={FiCheckCircle} label="Completed Services" value="3" tone="green" />
              <SummaryItem icon={FiClock} label="In Progress" value="4" tone="orange" />
              <SummaryItem icon={FiHeadphones} label="Support Retainers" value="2" tone="purple" />
            </div>
          </header>

          <section className="myServices-servicesPanel">
            <div className="myServices-filters">
              <label className="myServices-search"><FiSearch /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search services by name or keyword..." /></label>
              <label><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}><option>All Status</option><option>Active</option><option>In Progress</option><option>On Hold</option></select></label>
              <label><span>Service Type</span><select value={serviceType} onChange={event => setServiceType(event.target.value)}><option>All Types</option>{services.map(item => <option key={item.title}>{item.title}</option>)}</select></label>
              <label><span>Sort By</span><select value={sortBy} onChange={event => setSortBy(event.target.value)}><option>Recently Updated</option><option>Progress</option><option>Name</option></select></label>
              <button className="myServices-requestButton" type="button"><FiPlus /> Request New Service</button>
            </div>

            <div className="myServices-cardGrid">
              {filteredServices.map(service => <ServiceCard service={service} key={service.title} />)}
              {!filteredServices.length && <div className="myServices-empty">No services match your filters.</div>}
            </div>
            <button className="myServices-viewAll" type="button">View All Services <FiArrowRight /></button>
          </section>

          <div className="myServices-bottomGrid">
            <section className="myServices-panel myServices-timelinePanel">
              <div className="myServices-panelTitle"><h3>Service Timeline: Website Redesign</h3><span>In Progress</span></div>
              <div className="myServices-timeline">
                {timeline.map((step, index) => {
                  const Icon = step.icon;
                  return <div className={`myServices-timelineStep ${step.status}`} key={step.title}>
                    <div className="myServices-timelineMarker"><Icon /></div>
                    {index < timeline.length - 1 && <i className="myServices-timelineLine" />}
                    <strong>{step.title}</strong><small>{step.date}</small><em>{step.state}</em>
                  </div>;
                })}
              </div>
            </section>

            <section className="myServices-panel myServices-teamPanel">
              <div className="myServices-panelTitle"><h3>Team Assigned</h3><button type="button">View All</button></div>
              {[['rahul', 'Rahul Sharma', 'Project Manager'], ['priya', 'Priya Mehta', 'UI/UX Designer'], ['amit', 'Amit Verma', 'Frontend Developer'], ['karan', 'Karan Singh', 'Backend Developer']].map(([member, name, role]) => (
                <div className="myServices-teamRow" key={name}><Avatar member={member} /><strong>{name}</strong><span>{role}</span></div>
              ))}
              <div className="myServices-teamRow"><span className="myServices-avatar myServices-avatarMore">+2</span><strong>+2 More Members</strong><span>Support Team</span></div>
            </section>
          </div>
        </main>

        <aside className="myServices-sidebar">
          <section className="myServices-panel">
            <div className="myServices-panelTitle"><h3><FiCalendar /> Upcoming Deliverables</h3><button type="button">View All</button></div>
            {deliverables.map(item => <div className="myServices-deliverable" key={item.day}>
              <span className="myServices-dateBox"><small>{item.month}</small><b>{item.day}</b></span>
              <span><strong>{item.title}</strong><small>{item.subtitle}</small></span><em>{item.due}</em>
            </div>)}
            <button className="myServices-sideLink" type="button">View All Deliverables <FiArrowRight /></button>
          </section>

          <section className="myServices-panel">
            <div className="myServices-panelTitle"><h3><FiClock /> Recent Service Updates</h3><button type="button">View All</button></div>
            {[['Website Redesign', 'UI Design phase completed', 'Jun 8, 2026', 'blue'], ['SEO Optimization', 'Keyword research updated', 'Jun 7, 2026', 'green'], ['IT Support & Maintenance', 'Monthly maintenance completed', 'Jun 6, 2026', 'blue']].map(item => (
              <div className="myServices-update" key={item[0]}><span className={item[3]}><FiCheckCircle /></span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><time>{item[2]}</time><i className={item[3]} /></div>
            ))}
          </section>

          <section className="myServices-panel myServices-billing">
            <div className="myServices-panelTitle"><h3><FiCreditCard /> Billing Snapshot</h3><button type="button">View All Invoices</button></div>
            <div className="myServices-billingTop"><span><strong>₹1,24,500</strong><small>Total Outstanding</small></span><span><strong>3</strong><small>Unpaid Invoices</small></span></div>
            <div className="myServices-billingBottom"><span><small>Overdue</small><b>₹32,000</b></span><span><small>Due This Month</small><b>₹18,000</b></span><span><small>Not Due Yet</small><b>₹74,500</b></span></div>
          </section>

          <section className="myServices-panel myServices-manager">
            <div className="myServices-panelTitle"><h3><FiUsers /> Your Account Manager</h3><button type="button">View Profile</button></div>
            <div className="myServices-managerBody"><span className="myServices-managerPhoto"><FiUser /></span><div><strong>Rahul Sharma</strong><small>Account Manager</small><a href="mailto:rahul.sharma@ciisnetwork.com">rahul.sharma@ciisnetwork.com</a><a href="tel:+919876787645">+91 98767 87645</a></div></div>
            <button className="myServices-messageButton" type="button"><FiMessageSquare /> Message Rahul</button>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MyServicesPage;
