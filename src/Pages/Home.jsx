import React from 'react';
import './Home.css';
import Header from '../components/CiisNavbar';
import Footer from '../components/CiisFooter';
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBriefcase,
  FiCheck,
  FiClock,
  FiGlobe,
  FiGrid,
  FiMonitor,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiTrendingDown,
  FiTrendingUp,
  FiUmbrella,
  FiUsers,
  FiZap
} from 'react-icons/fi';

const primaryFeatures = [
  { title: 'Attendance Tracking', icon: FiClock, color: 'blue' },
  { title: 'Leave Management', icon: FiUmbrella, color: 'green' },
  { title: 'Asset Management', icon: FiMonitor, color: 'purple' },
  { title: 'Task Automation', icon: FiCheck, color: 'orange' }
];

const powerfulFeatures = [
  { title: 'Advanced Analytics', description: 'Real-time insights and detailed reports for informed decision-making.', icon: FiBarChart2, color: 'blue' },
  { title: 'Lightning Fast', description: 'Optimized performance with instant updates and seamless navigation.', icon: FiZap, color: 'green' },
  { title: 'Enterprise Security', description: 'Military-grade encryption and compliance with industry standards.', icon: FiShield, color: 'blue' },
  { title: 'Automated Workflows', description: 'Streamline operations with customizable automation rules.', icon: FiRefreshCw, color: 'orange' }
];

const overviewStats = [
  { label: 'Employees', value: '1,248', trend: '12.5% from last month', icon: FiUsers, color: 'blue', up: true },
  { label: 'Attendance Records', value: '8,856', trend: '8.2% from last month', icon: FiClock, color: 'green', up: true },
  { label: 'Leaves', value: '342', trend: '3.1% from last month', icon: FiUmbrella, color: 'orange', up: false },
  { label: 'Tasks in Progress', value: '128', trend: '15.5% from last month', icon: FiGrid, color: 'purple', up: true }
];

const benefits = [
  { title: '24/7 Access', description: 'Access your dashboard anytime, anywhere', icon: FiClock, color: 'blue' },
  { title: 'Real-time Updates', description: 'Instant synchronization across all devices', icon: FiRefreshCw, color: 'blue' },
  { title: 'Secure Data', description: 'Enterprise-grade security and encryption', icon: FiShield, color: 'green' },
  { title: 'User-friendly', description: 'Intuitive interface for all users', icon: FiSmartphone, color: 'purple' },
  { title: 'Fully Responsive', description: 'Perfect experience on any device', icon: FiMonitor, color: 'blue' }
];

const adminFeatures = [
  'Manage all employees and departments',
  'Approve leaves and asset requests',
  'Assign tasks and track progress',
  'Generate comprehensive reports and analytics',
  'System configuration and permissions'
];

const employeeFeatures = [
  'Check attendance records and work hours',
  'Apply for leaves with easy workflows',
  'Track assigned tasks and deadlines',
  'Request company assets and resources',
  'Update personal profile and preferences'
];

const IconBox = ({ icon: Icon, color = 'blue', className = '' }) => (
  <span className={`home-icon-box ${color} ${className}`}>
    <Icon />
  </span>
);

const MiniDashboard = ({ compact = false }) => (
  <div className={`home-dashboard ${compact ? 'compact' : ''}`}>
    <aside className="home-dashboard-side">
      <div className="home-dashboard-brand">
        <span>K</span>
        <strong>WorkSmart</strong>
      </div>
      {['Dashboard', 'Employees', 'Attendance', 'Leaves', 'Assets', 'Tasks', 'Reports', 'Settings'].map((item, index) => (
        <div className={`home-side-item ${index === 0 ? 'active' : ''}`} key={item}>
          <FiGrid />
          <span>{item}</span>
        </div>
      ))}
    </aside>

    <main className="home-dashboard-main">
      <div className="home-dashboard-topbar">
        <div className="home-search">
          <FiSearch />
          <span>Search anything...</span>
        </div>
        <div className="home-user-mini">
          <FiBell />
          <span className="home-mini-avatar"></span>
          <div>
            <strong>John Doe</strong>
            <small>Admin</small>
          </div>
        </div>
      </div>

      <h3>Dashboard</h3>
      <div className="home-metric-grid">
        {overviewStats.map((stat) => (
          <div className="home-metric-card" key={stat.label}>
            <IconBox icon={stat.icon} color={stat.color} />
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small className={stat.up ? 'up' : 'down'}>{stat.up ? '+' : '-'} {stat.trend.split(' ')[0]}</small>
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
            {[12, 22, 44, 31, 70, 52, 66, 50, 76].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }}></span>
            ))}
          </div>
        </div>
        <div className="home-donut-card">
          <strong>Leave Overview</strong>
          <div className="home-donut-row">
            <div className="home-donut"></div>
            <div className="home-legend">
              <span><i className="blue"></i>Approved 296</span>
              <span><i className="orange"></i>Pending 36</span>
              <span><i className="red"></i>Rejected 50</span>
            </div>
          </div>
        </div>
      </div>

      <div className="home-lower-panels">
        <div className="home-activity-card">
          <strong>Recent Activities</strong>
          {['Leave request by Sarah Johnson', 'Asset request by Mike Davis', 'Task completed by James Anderson', 'New employee John Smith joined'].map((text) => (
            <span key={text}><i></i>{text}<small>3h ago</small></span>
          ))}
        </div>
        <div className="home-task-card">
          <div className="home-card-head">
            <strong>Upcoming Tasks</strong>
            <small>View All</small>
          </div>
          {[
            ['UI/UX Design Review', '75%'],
            ['Monthly Report Generation', '60%'],
            ['Performance Review', '30%']
          ].map(([task, progress]) => (
            <div className="home-progress-task" key={task}>
              <span>{task}<small>{progress}</small></span>
              <div className="home-progress-track">
                <i style={{ width: progress }}></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

const PersonArt = ({ type }) => (
  <div className={`home-person ${type}`}>
    <div className="home-person-head"></div>
    <div className="home-person-hair"></div>
    <div className="home-person-body"></div>
    <div className="home-person-shirt"></div>
    <div className="home-person-arm left"></div>
    <div className="home-person-arm right"></div>
  </div>
);

const Home = () => {
  return (
    <>
      <Header />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-shell home-hero-grid">
            <div className="home-hero-copy">
              <div className="home-pill"><FiZap />All-in-One Employee Management Platform</div>
              <h1>Smart Employee <span>Management</span> Platform</h1>
              <p>
                Streamline attendance, leaves, assets, and tasks with our intelligent dashboard. Boost productivity with real-time insights and automated workflows designed for modern workplaces.
              </p>
              <div className="home-feature-chips">
                {primaryFeatures.map((feature) => (
                  <div className="home-feature-chip" key={feature.title}>
                    <IconBox icon={feature.icon} color={feature.color} />
                    <strong>{feature.title}</strong>
                  </div>
                ))}
              </div>
            <div className="home-trust">
              <div className="home-avatar-stack">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div>
                  <strong>*****</strong>
                  <p>Trusted by 500+ companies worldwide</p>
                </div>
              </div>
            </div>

            <div className="home-hero-visual">
              <MiniDashboard />
            </div>
          </div>
        </section>

        <section className="home-stats-strip home-shell">
          <div><IconBox icon={FiUsers} color="blue" /><strong>5,000+</strong><span>Active Employees</span></div>
          <div><IconBox icon={FiBriefcase} color="green" /><strong>500+</strong><span>Companies Trust Us</span></div>
          <div><IconBox icon={FiGlobe} color="blue" /><strong>25+</strong><span>Countries Worldwide</span></div>
          <div><IconBox icon={FiShield} color="orange" /><strong>99.9%</strong><span>System Uptime</span></div>
        </section>

        <section className="home-section">
          <div className="home-shell">
            <div className="home-section-title">
              <span>Powerful Features</span>
              <h2>Everything you need to manage<br />your <em>workforce efficiently</em></h2>
            </div>
            <div className="home-power-grid">
              {powerfulFeatures.map((feature) => (
                <article className="home-power-card" key={feature.title}>
                  <IconBox icon={feature.icon} color={feature.color} />
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-shell home-overview">
          <div className="home-section-title small">
            <span>Dashboard Overview</span>
            <p>Real-time insights and analytics at your fingertips. Monitor your key metrics with beautiful visualizations.</p>
          </div>
          <div className="home-overview-grid">
            {overviewStats.map((stat) => (
              <article className="home-overview-card" key={stat.label}>
                <IconBox icon={stat.icon} color={stat.color} />
                <div>
                  <h3>{stat.label}</h3>
                  <strong>{stat.value}</strong>
                  <small className={stat.up ? 'up' : 'down'}>
                    {stat.up ? <FiTrendingUp /> : <FiTrendingDown />}
                    {stat.up ? '+' : '-'} {stat.trend}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-role-section">
          <div className="home-shell">
            <div className="home-section-title small">
              <span>Role-Based Access</span>
              <p>Tailored experiences for different user roles with comprehensive functionality</p>
            </div>
            <div className="home-role-grid">
              <article className="home-role-card admin">
                <PersonArt type="admin" />
                <div className="home-role-content">
                  <span>Administrator</span>
                  <h3>Admin Portal</h3>
                  <strong>Full system control & management</strong>
                  <ul>{adminFeatures.map((item) => <li key={item}><FiCheck />{item}</li>)}</ul>
                  <button>Explore Admin Portal <FiArrowRight /></button>
                </div>
              </article>
              <article className="home-role-card employee">
                <PersonArt type="employee" />
                <div className="home-role-content">
                  <span>Employee</span>
                  <h3>Employee Portal</h3>
                  <strong>Streamlined daily operations</strong>
                  <ul>{employeeFeatures.map((item) => <li key={item}><FiCheck />{item}</li>)}</ul>
                  <button>Explore Employee Portal <FiArrowRight /></button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="home-section home-benefit-section">
          <div className="home-shell">
            <div className="home-section-title small">
              <span>Why Choose Our Platform?</span>
              <p>Experience the difference with our cutting-edge employee management solution</p>
            </div>
            <div className="home-benefit-grid">
              {benefits.map((benefit) => (
                <article className="home-benefit-card" key={benefit.title}>
                  <IconBox icon={benefit.icon} color={benefit.color} />
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="home-cta">
              <div className="home-rocket"><FiActivity /></div>
            <div> 
              <h2>Ready to Transform<br />Your Workforce Management?</h2>
              <p>Join thousands of companies already using our platform to streamline their operations.</p>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;
