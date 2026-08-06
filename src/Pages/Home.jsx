import React from 'react';
import './Home.css';
import Header from '../components/CiisNavbar';
import Footer from '../components/CiisFooter';
import AttendanceAiSection from '../components/landing/AttendanceAiSection';
import BusinessOperationsSection from '../components/landing/BusinessOperationsSection';
import AccessWorkflowCtaSection from '../components/landing/AccessWorkflowCtaSection';
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
  if (brand === 'techsoft') return <svg viewBox="0 0 32 32"><g fill="none" stroke="#20a8e8" strokeWidth="2.2" strokeLinecap="round"><circle cx="16" cy="16" r="5"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6M6.1 6.1l4.2 4.2M21.7 21.7l4.2 4.2M25.9 6.1l-4.2 4.2M10.3 21.7l-4.2 4.2"/><path d="M10 3.8l2.2 5.5M19.8 22.7l2.2 5.5M3.8 22l5.5-2.2M22.7 12.2l5.5-2.2"/></g></svg>;
  if (brand === 'brightmart') return <svg viewBox="0 0 32 32"><path fill="#f59a44" d="M4 8l7-4 7 4-7 4z"/><path fill="#ef6a67" d="M11 12l7-4 7 4-7 4z"/><path fill="#f7c64a" d="M4 8l7 4v8l-7-4z"/><path fill="#db657d" d="M18 16l7-4v8l-7 4z"/><path fill="#77b45a" d="M11 12l7 4v8l-7-4z"/></svg>;
  if (brand === 'educore') return <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#38a86e" strokeWidth="2"/><path d="M8 17c4-1 6 0 8 3 2-3 4-4 8-3v7c-4-1-6 0-8 3-2-3-4-4-8-3z" fill="#38a86e"/><path d="M16 7c4 2 5 5 0 9-5-4-4-7 0-9z" fill="#e3b83f"/></svg>;
  if (brand === 'healthplus') return <svg viewBox="0 0 32 32"><g fill="#347fe5"><ellipse cx="16" cy="7" rx="3.5" ry="6"/><ellipse cx="16" cy="25" rx="3.5" ry="6"/><ellipse cx="7" cy="16" rx="6" ry="3.5"/><ellipse cx="25" cy="16" rx="6" ry="3.5"/></g><circle cx="16" cy="16" r="4" fill="#22a9dc"/></svg>;
  if (brand === 'buildright') return <svg viewBox="0 0 34 32"><path fill="#6689a8" d="M3 25h28v3H3zM6 13h7v12H6zM15 8h6v17h-6zM23 15h6v10h-6z"/><path fill="#2f77b8" d="M4 11h18v2H4zM13 5h2v20h-2zM15 5h12v2H15zM25 7h2v5h-2z"/><path fill="#f1a23b" d="M9 16h2v3H9zM17 12h2v3h-2zM25 18h2v3h-2z"/></svg>;
  return <svg viewBox="0 0 34 32"><path d="M6 24L17 5l11 19z" fill="none" stroke="#3688cf" strokeWidth="2"/><circle cx="17" cy="5" r="4" fill="#f0a33b"/><circle cx="6" cy="24" r="4" fill="#32a66d"/><circle cx="28" cy="24" r="4" fill="#6b70c9"/><path d="M12 22h10M17 11v7" stroke="#3688cf" strokeWidth="2"/></svg>;
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
  return (
    <>
      <Header />
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
                <button className="home-primary-btn">Book Free Demo <FiArrowRight /></button>
                <button className="home-secondary-btn"><FiPlayCircle /> Watch 2-Minute Tour</button>
              </div>
              <div className="home-reference-proof">
                <span><FiZap /> No complex setup</span>
                <span><FiUsers /> Role-based access</span>
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

            <AccessWorkflowCtaSection />

          </div>
        </section>

      </main>
      <Footer />
    </>
  );
};

export default Home;
