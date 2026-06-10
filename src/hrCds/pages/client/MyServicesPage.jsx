import React, { useMemo, useState } from 'react';
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
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShare2,
  FiSmartphone,
  FiTarget,
  FiUsers
} from 'react-icons/fi';
import { MdOutlinePalette, MdOutlineWeb } from 'react-icons/md';
import './MyServicesPage.css';

const people = [
  { name: 'Rahul Sharma', role: 'Project Manager', photo: 'https://i.pravatar.cc/80?img=12' },
  { name: 'Priya Mehta', role: 'UI/UX Designer', photo: 'https://i.pravatar.cc/80?img=47' },
  { name: 'Amit Verma', role: 'Frontend Developer', photo: 'https://i.pravatar.cc/80?img=11' },
  { name: 'Karan Singh', role: 'Backend Developer', photo: 'https://i.pravatar.cc/80?img=32' }
];

const services = [
  {
    title: 'Website Redesign',
    description: 'Redesigning corporate website with modern UI/UX and CMS.',
    status: 'In Progress', type: 'Web Development', tone: 'blue', icon: <MdOutlineWeb />,
    start: 'May 10, 2026', end: 'Jun 30, 2026', progress: 60, team: [0, 1, 2, 3], more: 2, updated: 6
  },
  {
    title: 'SEO Optimization',
    description: 'Improving website visibility and ranking across target keywords.',
    status: 'Active', type: 'Digital Marketing', tone: 'green', icon: <FiBarChart2 />,
    start: 'Apr 15, 2026', end: 'Aug 15, 2026', progress: 75, team: [1, 0, 2], more: 1, updated: 5
  },
  {
    title: 'Social Media Management',
    description: 'Managing social channels and content strategy.',
    status: 'Active', type: 'Digital Marketing', tone: 'coral', icon: <FiShare2 />,
    start: 'Apr 20, 2026', end: 'Ongoing', progress: 80, team: [0, 2, 1], more: 1, updated: 4
  },
  {
    title: 'Mobile App Development',
    description: 'Building cross-platform mobile app for iOS and Android.',
    status: 'In Progress', type: 'App Development', tone: 'violet', icon: <FiSmartphone />,
    start: 'May 15, 2026', end: 'Aug 30, 2026', progress: 40, team: [0, 1, 2, 3], more: 3, updated: 3
  },
  {
    title: 'IT Support & Maintenance',
    description: 'Ongoing IT support, monitoring and maintenance.',
    status: 'Active', type: 'IT Support', tone: 'sky', icon: <FiHeadphones />,
    start: 'Jan 01, 2026', end: 'Dec 31, 2026', progress: 90, team: [0], more: 0, updated: 2,
    taskLabel: 'View Tickets'
  },
  {
    title: 'Branding & Creatives',
    description: 'Brand identity, creatives and marketing collaterals.',
    status: 'On Hold', type: 'Design', tone: 'rose', icon: <MdOutlinePalette />,
    start: 'Mar 10, 2026', end: 'On Hold', progress: 25, team: [1, 0, 2], more: 1, updated: 1
  }
];

const stats = [
  { label: 'Active Services', value: 6, icon: <FiBriefcase />, tone: 'blue' },
  { label: 'Completed Services', value: 3, icon: <FiCheckCircle />, tone: 'green' },
  { label: 'In Progress', value: 4, icon: <FiRefreshCw />, tone: 'orange' },
  { label: 'Support Retainers', value: 2, icon: <FiHeadphones />, tone: 'purple' }
];

const deliverables = [
  { month: 'Jun', day: '10', title: 'Website Redesign', text: 'Homepage UI Concepts', due: 'In 2 days' },
  { month: 'Jun', day: '15', title: 'SEO Optimization', text: 'Technical Audit Report', due: 'In 7 days' },
  { month: 'Jun', day: '20', title: 'Mobile App Development', text: 'Beta Build v1.0', due: 'In 12 days' }
];

const updates = [
  { title: 'Website Redesign', text: 'UI Design phase completed', date: 'Jun 8, 2026', tone: 'blue' },
  { title: 'SEO Optimization', text: 'Keyword research updated', date: 'Jun 7, 2026', tone: 'green' },
  { title: 'IT Support & Maintenance', text: 'Monthly maintenance completed', date: 'Jun 6, 2026', tone: 'blue' }
];

const timeline = [
  { title: 'Discovery', date: 'May 10, 2026', state: 'Completed', tone: 'done', icon: <FiCheck /> },
  { title: 'UI Design', date: 'May 28, 2026', state: 'Completed', tone: 'done', icon: <FiCheck /> },
  { title: 'Development', date: 'Jun 1 - Jun 22', state: 'In Progress', tone: 'active', icon: <FiBarChart2 /> },
  { title: 'Testing', date: 'Jun 23 - Jun 28', state: 'Upcoming', tone: 'next', icon: <FiClock /> },
  { title: 'Launch', date: 'Jun 30, 2026', state: 'Upcoming', tone: 'next', icon: <FiSend /> }
];

const serviceTypes = [...new Set(services.map((service) => service.type))];

const MyServicesPage = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Status');
  const [serviceType, setServiceType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Recently Updated');

  const filteredServices = useMemo(() => {
    const text = query.trim().toLowerCase();
    return services
      .filter((service) => (
        (!text || `${service.title} ${service.description} ${service.type}`.toLowerCase().includes(text))
        && (status === 'All Status' || service.status === status)
        && (serviceType === 'All Types' || service.type === serviceType)
      ))
      .sort((a, b) => {
        if (sortBy === 'Progress: High to Low') return b.progress - a.progress;
        if (sortBy === 'Progress: Low to High') return a.progress - b.progress;
        if (sortBy === 'Name: A to Z') return a.title.localeCompare(b.title);
        return b.updated - a.updated;
      });
  }, [query, serviceType, sortBy, status]);

  return (
    <div className="MyServices-shell">
      <div className="MyServices-dashboard">
        <header className="MyServices-heading">
          <div>
            <h1>My Services</h1>
            <p>Track all your active services, progress, timelines and assigned teams.</p>
          </div>
          <div className="MyServices-stats">
            {stats.map((item) => (
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
                    <option>All Status</option><option>Active</option><option>In Progress</option><option>On Hold</option>
                  </select>
                  <FiChevronDown />
                </label>
                <label className="MyServices-filter">
                  <span>Service Type</span>
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    <option>All Types</option>{serviceTypes.map((type) => <option key={type}>{type}</option>)}
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
                <button className="MyServices-request" type="button"><FiPlus /> Request New Service</button>
              </div>

              {filteredServices.length ? (
                <div className="MyServices-grid">
                  {filteredServices.map((service) => (
                    <article className="MyServices-card" key={service.title}>
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
                          {service.team.map((index) => <img key={`${service.title}-${index}`} src={people[index].photo} alt={people[index].name} />)}
                          {service.more > 0 && <span>+{service.more}</span>}
                        </div>
                        <strong>{service.progress}%</strong>
                      </div>
                      <div className={`MyServices-progress ${service.tone}`}><span style={{ width: `${service.progress}%` }} /></div>
                      <footer>
                        <button type="button"><FiFileText /> View Details</button>
                        <button type="button"><FiFileText /> {service.taskLabel || 'View Tasks'}</button>
                        <button type="button"><FiMessageSquare /> Contact Team</button>
                      </footer>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="MyServices-empty"><FiSearch /><strong>No services found</strong><span>Try changing your search or filters.</span></div>
              )}
              <button className="MyServices-view-all" type="button">View All Services <FiChevronRight /></button>
            </section>

            <div className="MyServices-bottom">
              <section className="MyServices-timeline">
                <header><h3>Service Timeline: Website Redesign</h3><span>In Progress</span></header>
                <div className="MyServices-timeline-track">
                  {timeline.map((step) => (
                    <div className={`MyServices-step ${step.tone}`} key={step.title}>
                      <i>{step.icon}</i><strong>{step.title}</strong><time>{step.date}</time><small>{step.state}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className="MyServices-team-panel">
                <header><h3>Team Assigned</h3><button type="button">View All</button></header>
                {people.map((person) => (
                  <div className="MyServices-team-row" key={person.name}>
                    <img src={person.photo} alt={person.name} /><strong>{person.name}</strong><span>{person.role}</span>
                  </div>
                ))}
                <div className="MyServices-team-row">
                  <i>+2</i><strong>+2 More Members</strong><span>Support Team</span>
                </div>
              </section>
            </div>
          </div>

          <aside className="MyServices-sidebar">
            <section className="MyServices-side-panel MyServices-deliverables">
              <header><h3><FiCalendar /> Upcoming Deliverables</h3><button type="button">View All</button></header>
              {deliverables.map((item) => (
                <div className="MyServices-deliverable" key={item.day}>
                  <time><span>{item.month}</span><strong>{item.day}</strong></time>
                  <div><strong>{item.title}</strong><p>{item.text}</p></div>
                  <em>{item.due}</em>
                </div>
              ))}
              <button className="MyServices-side-link" type="button">View All Deliverables <FiChevronRight /></button>
            </section>

            <section className="MyServices-side-panel MyServices-updates">
              <header><h3><FiClock /> Recent Service Updates</h3><button type="button">View All</button></header>
              {updates.map((item) => (
                <div className="MyServices-update" key={item.title}>
                  <i className={item.tone}><FiTarget /></i>
                  <div><strong>{item.title}</strong><p>{item.text}</p></div>
                  <time>{item.date}</time><b className={item.tone} />
                </div>
              ))}
            </section>

            <section className="MyServices-side-panel MyServices-billing">
              <header><h3><FiCalendar /> Billing Snapshot</h3><button type="button">View All Invoices</button></header>
              <div className="MyServices-bill-main">
                <strong>₹1,24,500<small>Total Outstanding</small></strong>
                <strong>3<small>Unpaid Invoices</small></strong>
              </div>
              <div className="MyServices-bill-details">
                <span>Overdue<strong>₹32,000</strong></span>
                <span>Due This Month<strong>₹18,000</strong></span>
                <span>Not Due Yet<strong>₹74,500</strong></span>
              </div>
            </section>

            <section className="MyServices-side-panel MyServices-manager">
              <header><h3><FiUsers /> Your Account Manager</h3><button type="button">View Profile</button></header>
              <div className="MyServices-manager-info">
                <div className="MyServices-manager-photo"><img src={people[0].photo} alt="Rahul Sharma" /><span /></div>
                <div>
                  <strong>Rahul Sharma</strong><p>Account Manager</p>
                  <a href="mailto:rahul.sharma@ciisnetwork.com"><FiMail /> rahul.sharma@ciisnetwork.com</a>
                  <a href="tel:+919876787645"><FiPhone /> +91 98767 87645</a>
                </div>
              </div>
              <button className="MyServices-message" type="button"><FiMessageSquare /> Message Rahul</button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MyServicesPage;
