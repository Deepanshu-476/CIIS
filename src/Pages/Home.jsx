import React, { useState } from 'react';
import './Home.css';
import Header from '../components/CiisNavbar';
import Footer from '../components/CiisFooter';
import AttendanceAiSection from '../components/landing/AttendanceAiSection';
import BusinessOperationsSection from '../components/landing/BusinessOperationsSection';
import AccessWorkflowCtaSection from '../components/landing/AccessWorkflowCtaSection';
import BookDemoModal from '../components/landing/BookDemoModal';
import {
  FiActivity,
  FiAperture,
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBox,
  FiBriefcase,
  FiBookOpen,
  FiCheck,
  FiClipboard,
  FiClock,
  FiCode,
  FiGlobe,
  FiGrid,
  FiHome,
  FiMonitor,
  FiMessageSquare,
  FiPieChart,
  FiPlayCircle,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiShield,
  FiSmartphone,
  FiTrendingDown,
  FiTrendingUp,
  FiUmbrella,
  FiUsers,
  FiUserCheck,
  FiZap
} from 'react-icons/fi';

const dashboardStats = [
  { label: 'Employees', value: '1,248', trend: '12.5%', icon: FiUsers, color: 'blue', up: true },
  { label: 'Attendance Today', value: '856', trend: 'Present', icon: FiClock, color: 'green', up: true },
  { label: 'Tasks', value: '342', trend: '3.7%', icon: FiClipboard, color: 'orange', up: false },
  { label: 'Businesses & Regions', value: '128', trend: '15.1%', icon: FiHome, color: 'purple', up: true }
];

const IconBox = ({ icon, color = 'blue', className = '' }) => (
  <span className={`home-icon-box ${color} ${className}`}>
    {React.createElement(icon)}
  </span>
);

const TrustedLogoIcon = ({ brand }) => {
  if (brand === 'techsoft') return <svg viewBox="0 0 32 32"><g fill="none" stroke="#1d9bf0" strokeWidth="2.2" strokeLinecap="round"><circle cx="16" cy="16" r="4.5" fill="#1d9bf0"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8"/><circle cx="16" cy="3" r="1.5" fill="#1d9bf0"/><circle cx="16" cy="29" r="1.5" fill="#1d9bf0"/><circle cx="3" cy="16" r="1.5" fill="#1d9bf0"/><circle cx="29" cy="16" r="1.5" fill="#1d9bf0"/></g></svg>;
  if (brand === 'brightmart') return <svg viewBox="0 0 32 32"><path fill="#f97316" d="M16 3l9 5.2v10.4L16 23.8 7 18.6V8.2z"/><path fill="#ef4444" d="M16 3v20.8l9-5.2V8.2z" opacity="0.85"/><path fill="#f59e0b" d="M16 3L7 8.2l9 5.2 9-5.2z" opacity="0.9"/></svg>;
  if (brand === 'educore') return <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="#10b981" strokeWidth="2.5"/><path d="M10 18c3-1.5 4.5 0 6 2.5 1.5-2.5 3-4 6-2.5v-6c-3-1.5-4.5 0-6 2.5-1.5-2.5-3-4-6-2.5z" fill="#10b981"/><path d="M16 6c3 1.5 4 4 0 7-4-3-3-5.5 0-7z" fill="#f59e0b"/></svg>;
  if (brand === 'healthplus') return <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5" fill="#2563eb"/><circle cx="16" cy="6" r="3.5" fill="#3b82f6"/><circle cx="16" cy="26" r="3.5" fill="#3b82f6"/><circle cx="6" cy="16" r="3.5" fill="#3b82f6"/><circle cx="26" cy="16" r="3.5" fill="#3b82f6"/><circle cx="9" cy="9" r="2.5" fill="#60a5fa"/><circle cx="23" cy="9" r="2.5" fill="#60a5fa"/><circle cx="9" cy="23" r="2.5" fill="#60a5fa"/><circle cx="23" cy="23" r="2.5" fill="#60a5fa"/></svg>;
  if (brand === 'buildright') return <svg viewBox="0 0 32 32"><path fill="#3b82f6" d="M4 26h24v3H4zM7 14h6v12H7zM15 8h6v18h-6zM23 18h5v8h-5z"/><path fill="#60a5fa" d="M5 12h10v2H5zM13 4h2v22h-2zM15 4h11v2H15z"/><path fill="#f59e0b" d="M9 17h2v3H9zM17 12h2v3h-2zM25 21h2v3h-2z"/></svg>;
  return <svg viewBox="0 0 32 32"><path d="M7 25L16 6l9 19z" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round"/><circle cx="16" cy="6" r="4" fill="#f59e0b"/><circle cx="7" cy="25" r="4" fill="#10b981"/><circle cx="25" cy="25" r="4" fill="#8b5cf6"/><path d="M11.5 22.5h9M16 11v8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>;
};

const MiniDashboard = ({ compact = false }) => (
  <div className={`home-dashboard ${compact ? 'compact' : ''}`}>
    <aside className="home-dashboard-side">
      <div className="home-dashboard-brand">
        <span>C</span>
        <strong>CIIS NETWORK</strong>
      </div>
      {['Dashboard', 'Employees', 'Attendance', 'Leaves', 'Tasks', 'Assets', 'Clients', 'Reports', 'Performance', 'AI Assistant', 'Settings'].map((item, index) => (
        <div className={`home-side-item ${index === 0 ? 'active' : ''}`} key={item}>
          <FiGrid />
          <span>{item}</span>
        </div>
      ))}
    </aside>

    <main className="home-dashboard-main">
      <div className="home-dashboard-topbar">
        <h3>Dashboard</h3>
        <div className="home-user-mini">
          <label className="home-preview-search"><FiSearch aria-hidden="true" /><span>Search anything...</span></label>
          <button type="button" aria-label="Preview notifications"><FiBell aria-hidden="true" /><i>3</i></button>
          <span className="home-mini-avatar"></span>
        </div>
      </div>

      <div className="home-dashboard-profile-row">
        <div className="home-dashboard-profile">
          <span className="home-profile-avatar">AR</span>
          <div><small>Welcome back, 10:45</small><strong>Ashutosh Rai</strong><em>Super Admin</em></div>
        </div>
        <button type="button">All Businesses <span>⌄</span></button>
      </div>

      <div className="home-metric-grid">
        {dashboardStats.map((stat) => (
          <div className="home-metric-card" key={stat.label}>
            <IconBox icon={stat.icon} color={stat.color} />
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small className={stat.up ? 'up' : 'down'}>{stat.up ? '+' : '-'} {stat.trend}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="home-dashboard-panels">
        <div className="home-chart-card">
          <div className="home-card-head">
            <strong>Attendance Overview</strong>
            <small>This Month</small>
          </div>
          <div className="home-line-chart">
            <svg viewBox="0 0 320 112" preserveAspectRatio="none" aria-label="Monthly attendance trend">
              <path className="home-chart-area" d="M4 87 L42 75 L78 69 L115 49 L151 57 L188 40 L224 48 L262 31 L298 21 L316 31 L316 108 L4 108 Z" />
              <polyline points="4,87 42,75 78,69 115,49 151,57 188,40 224,48 262,31 298,21 316,31" />
              {[['4','87'],['42','75'],['78','69'],['115','49'],['151','57'],['188','40'],['224','48'],['262','31'],['298','21'],['316','31']].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5" />
              ))}
            </svg>
            <div className="home-chart-dates"><span>1 Aug</span><span>8 Aug</span><span>15 Aug</span><span>22 Aug</span><span>31 Aug</span></div>
          </div>
        </div>
        <div className="home-donut-card">
          <strong>Task Overview</strong>
          <div className="home-donut-row">
            <div className="home-donut"></div>
            <div className="home-legend">
              <span><i className="blue"></i>Completed <small>60%</small></span>
              <span><i className="green"></i>In Progress <small>20%</small></span>
              <span><i className="orange"></i>Pending <small>15%</small></span>
              <span><i className="red"></i>Overdue <small>5%</small></span>
            </div>
          </div>
        </div>
      </div>

      <div className="home-lower-panels">
        <div className="home-activity-card">
          <strong>Recent Activities</strong>
          {[['Leave request by Sarah Johnson','2 min ago'],['Task completed by Mike Davis','15 min ago'],['New employee John Smith joined','1 hr ago'],['Asset request by Emma Wilson','2 hrs ago']].map(([text,time]) => (
            <span key={text}><i></i>{text}<small>{time}</small></span>
          ))}
        </div>
        <div className="home-task-card">
          <div className="home-card-head">
            <strong>Upcoming Tasks</strong>
            <small>View All</small>
          </div>
          {[
            ['UI/UX Design Review', 'Due Today', 'today', '84%'],
            ['Monthly Performance Report', 'Due Tomorrow', 'tomorrow', '66%'],
            ['Client Meeting', '12 Aug', 'scheduled', '48%']
          ].map(([task, due, tone, progress]) => (
            <div className={`home-progress-task home-progress-task--${tone}`} key={task}>
              <span>{task}<small>{due}</small></span>
              <span className="home-progress-track" aria-hidden="true"><i style={{ width: progress }} /></span>
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

const Home = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleOpenDemoModal = () => {
    setIsDemoModalOpen(true);
  };

  return (
    <>
      <Header onBookDemo={handleOpenDemoModal} />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-shell home-hero-grid">
            <div className="home-hero-copy home-reference-copy">
              <div className="home-pill"><FiZap aria-hidden="true" />AI-POWERED BUSINESS &amp; WORKFORCE MANAGEMENT</div>
              <h1>
                <span className="home-title-line">Manage Employees, Tasks</span>
                <span className="home-title-line">and <b>Multiple Businesses</b></span>
                <span className="home-title-line">from One Platform</span>
              </h1>
              <p>CIIS Network helps owners and managers handle attendance, leaves, tasks, teams, assets, clients, audits and performance across multiple businesses, branches and departments.</p>
              <div className="home-reference-actions">
                <button type="button" className="home-primary-btn" onClick={handleOpenDemoModal}>Book Free Demo <FiArrowRight /></button>
                <button type="button" className="home-secondary-btn"><FiPlayCircle /> Watch 2-Minute Tour</button>
              </div>
              <div className="home-reference-proof">
                <span><FiZap /> No complex setup</span>
                <span><FiUserCheck /> Role-based access</span>
                <span><FiMonitor /> Web, mobile &amp; desktop</span>
              </div>
            </div>

            <div className="home-hero-visual">
              <MiniDashboard />
            </div>
          </div>
        </section>

        <section className="home-trusted-strip">
          <strong>Trusted by growing businesses across industries</strong>
          <div className="home-trusted-logos home-shell">
            {[
              ['TechSoft', 'SOLUTIONS', 'techsoft'],
              ['BrightMart', 'Retail', 'brightmart'],
              ['EduCore', 'INSTITUTE', 'educore'],
              ['HealthPlus', 'CARE', 'healthplus'],
              ['BuildRight', 'CONSTRUCTIONS', 'buildright'],
              ['CodeCraft', 'LABS', 'codecraft']
            ].map(([name, type, brand]) => (
              <div className={`home-trusted-logo ${brand}`} key={name}>
                <i><TrustedLogoIcon brand={brand} /></i>
                <span><b>{name}</b><small>{type}</small></span>
              </div>
            ))}
          </div>
        </section>

        <section className="home-operations-section">
          <div className="home-shell">
            <BusinessOperationsSection />

            <div className="home-multibusiness-panel">
              <div className="home-multibusiness-copy">
                <h2>Manage Every Business, Branch<br />and Team from One Central Portal</h2>
                <ul>
                  {['Create and manage multiple businesses', 'Assign managers to businesses and departments', 'Fine-grained access and permissions', 'Consolidated reports across all businesses', 'Complete data isolation and security'].map((item) => (
                    <li key={item}><FiCheck />{item}</li>
                  ))}
                </ul>
                <button type="button">Explore Multi-Business Management <FiArrowRight /></button>
              </div>

              <div className="home-business-tree">
                <div className="home-tree-owner"><span><FiUsers /></span><strong>Owner / Super Admin</strong></div>
                <div className="home-tree-portal">One Central Portal</div>
                <div className="home-tree-connector"><i></i><i></i><i></i></div>
                <div className="home-tree-branches">
                  {['Business 1', 'Business 2', 'Business 3'].map((business) => (
                    <div className="home-tree-business" key={business}>
                      <strong>{business}</strong>
                      <div><span><FiUsers /><small>HR</small></span><span><FiBriefcase /><small>Managers</small></span><span><FiUsers /><small>Teams</small></span></div>
                      <p>Managers &amp; Teams</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AttendanceAiSection />

            <AccessWorkflowCtaSection onBookDemo={handleOpenDemoModal} />

          </div>
        </section>

      </main>
      <Footer />
      <BookDemoModal open={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </>
  );
};

export default Home;
