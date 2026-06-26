import React, { useState, useEffect } from 'react';

import { useNavigate } from "react-router-dom"; 

const App = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const animateCount = (setter, target, duration = 2000) => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
    };

    animateCount(setEmployeeCount, 125);
    animateCount(setAttendanceCount, 3420);
    animateCount(setLeaveCount, 87);
    animateCount(setTaskCount, 64);
    animateCount(setAssetCount, 210);
  }, []);

  const powerfulFeatures = [
    {title: 'Advanced Analytics',description: 'Real-time insights and detailed reports for informed decision-making.',icon: '📊'},
    {title: 'Lightning Fast',description: 'Optimized performance with instant updates and seamless navigation.',icon: '⚡'},
    {title: 'Enterprise Security',description: 'Military-grade encryption and compliance with industry standards.',icon: '🛡️'},
    {title: 'Automated Workflows',description: 'Streamline operations with customizable automation rules.',icon: '🔄'}
  ];

  const features = [
  {title: 'Attendance Management',description: 'Mark IN/OUT, track login/logout, and view total work hours with precision analytics.',icon: '⏰'},
  {title: 'Leave Management',description: 'Apply, approve, and track employee leaves with automated workflows and notifications.',icon: '🌴'},
  {title: 'Asset Management',description: 'Request and manage company assets with tracking, maintenance alerts, and inventory control.',icon: '💻'},
  {title: 'Task Management',description: 'Create, assign, and monitor task progress with real-time status updates and deadlines.',icon: '📋'},
  {title: 'System Alerts',description: 'Get instant notifications and important announcements with smart prioritization.',icon: '🔔'},
  {title: 'Employee Directory',description: 'View, search, and manage employee profiles with advanced filtering and analytics.',icon: '👥'}
];

  const stats = [
  { label: 'EMPLOYEES', icon: '👥' },
  { label: 'ATTENDANCE RECORDS', icon: '⏰' },
  { label: 'LEAVES', icon: '🌴' },
  { label: 'TASKS IN PROGRESS', icon: '📋' }
];

  const benefits = [
    { icon: '🕧', title: '24/7 Access', description: 'Access your dashboard anytime, anywhere' },
    { icon: '🔄', title: 'Real-time Updates', description: 'Instant synchronization across all devices' },
    { icon: '🔒', title: 'Secure Data', description: 'Enterprise-grade security and encryption' },
    { icon: '📱', title: 'User-friendly', description: 'Intuitive interface for all users' },
    { icon: '💻', title: 'Fully Responsive', description: 'Perfect experience on any device' }
  ];
 const navigate = useNavigate();
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

  return (
    <div className="ciis-app">
      {/* Header */}
      <header className="ciis-header">
        <div className="ciis-header-container">
          <div className="ciis-logo-section">
            <div className="ciis-logo-placeholder">
              {/* Logo Image */}
              <img 
                src="/logo.png" 
                alt="CIIS Network Logo" 
                className="ciis-logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback text logo, shown only when the image fails to load. */}
              <div className="ciis-logo-fallback">
                <span className="ciis-logo-text">CIIS NETWORK</span>
              </div>
            </div>
          </div>
         <button
      className="ciis-login-btn"
      onClick={() => navigate("/login")}
    >
      LOGIN
    </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="ciis-hero">
        <div className="ciis-hero-background">
          <div className="ciis-hero-radial-light-1"></div>
          <div className="ciis-hero-radial-light-2"></div>
          <div className="ciis-hero-floating-shape ciis-floating-1"></div>
          <div className="ciis-hero-floating-shape ciis-floating-2"></div>
          <div className="ciis-hero-floating-shape ciis-floating-3"></div>
        </div>

        <div className="ciis-hero-container">
          <div className="ciis-hero-content">
            <div className="ciis-hero-badge">
              🎯 Enterprise Ready Employee Portal
            </div>
            <h1 className="ciis-hero-title">
              <span className="ciis-hero-main">Smart Employee</span>
              <span className="ciis-hero-subtitle">Management Platform</span>
            </h1>
            <p className="ciis-hero-description">
              Streamline attendance, leaves, assets, and tasks with our intelligent dashboard. 
              Boost productivity with real-time insights and automated workflows designed for modern workplaces.
            </p>
            <div className="ciis-feature-chips">
              <span className="ciis-feature-chip">📊 Attendance Tracking</span>
              <span className="ciis-feature-chip">🌴 Leave Management</span>
              <span className="ciis-feature-chip">💻 Asset Management</span>
              <span className="ciis-feature-chip">✅ Task Automation</span>
            </div>
            <div className="ciis-hero-actions">
              
              
                <button
      className="ciis-hero-btn ciis-primary-btn"
      onClick={() => navigate("/login")}
    >
      LOGIN
    </button>
              
            </div>
            <div className="ciis-trust-indicators">
              <div className="ciis-trust-item">
                <strong>24/7</strong> Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section id="features" className="ciis-powerful-features">
        <div className="ciis-section-container">
          <div className="ciis-section-header">
            <h2 className="ciis-section-title">Powerful Features</h2>
            <p className="ciis-section-description">
              Everything you need to manage your workforce efficiently and effectively
            </p>
          </div>
          <div className="ciis-powerful-features-grid">
            {powerfulFeatures.map((feature, index) => (
              <div key={index} className="ciis-powerful-feature-card">
                <div className="ciis-powerful-feature-icon">
                  <span>{feature.icon}</span>
                </div>
                <h3 className="ciis-powerful-feature-title">{feature.title}</h3>
                <p className="ciis-powerful-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard" className="ciis-dashboard-preview">
        <div className="ciis-section-container">
          <div className="ciis-section-header">
            <h2 className="ciis-section-title">Key Features</h2>
            <p className="ciis-section-description">
              Explore the essential tools that make our Employee Management Portal smart, seamless, and efficient.
            </p>
          </div>
          <div className="ciis-dashboard-mockup">
            <div className="ciis-dashboard-grid">
              {features.map((feature, index) => (
                <div key={index} className="ciis-dashboard-feature">
                  <div className="ciis-dashboard-feature-icon">{feature.icon}</div>
                  <div className="ciis-dashboard-feature-info">
                    <h3 className="ciis-dashboard-feature-title">{feature.title}</h3>
                    <p className="ciis-dashboard-feature-description">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* <section id="dashboard" className="dashboard-overview">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h2 className="dashboard-title">Dashboard Overview</h2>
            <p className="dashboard-description">
              Real-time insights and analytics at your fingertips. Monitor your key metrics with beautiful visualizations.
            </p>
          </div>
          <div className="dashboard-content">
            <div className="dashboard-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-content">
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="dashboard-visualization">
              <div className="visualization-placeholder">
                <div className="chart-area">
                  <div className="chart-bars">
                    <div className="chart-bar" style={{height: '80%'}}></div>
                    <div className="chart-bar" style={{height: '60%'}}></div>
                    <div className="chart-bar" style={{height: '90%'}}></div>
                    <div className="chart-bar" style={{height: '70%'}}></div>
                    <div className="chart-bar" style={{height: '85%'}}></div>
                    <div className="chart-bar" style={{height: '75%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Access Section */}
      <section id="access" className="ciis-access">
        <div className="ciis-section-container">
          <div className="ciis-section-header">
            <h2 className="ciis-section-title">Role-Based Access</h2>
            <p className="ciis-section-description">
              Tailored experiences for different user roles with comprehensive functionality
            </p>
          </div>
          <div className="ciis-access-grid">
            <div className="ciis-access-card ciis-admin-card">
              <div className="ciis-access-badge">Administrator</div>
              <div className="ciis-access-header">
                <div className="ciis-access-icon">🛡️</div>
                <h3 className="ciis-access-title">Admin Portal</h3>
                <p className="ciis-access-subtitle">Full system control & management</p>
              </div>
              <ul className="ciis-access-list">
                {adminFeatures.map((feature, index) => (
                  <li key={index} className="ciis-access-list-item">
                    <span className="ciis-list-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="ciis-access-btn">Admin Login</button>
            </div>

            <div className="ciis-access-card ciis-employee-card">
              <div className="ciis-access-badge">Employee</div>
              <div className="ciis-access-header">
                <div className="ciis-access-icon">💼</div>
                <h3 className="ciis-access-title">Employee Portal</h3>
                <p className="ciis-access-subtitle">Streamlined daily operations</p>
              </div>
              <ul className="ciis-access-list">
                {employeeFeatures.map((feature, index) => (
                  <li key={index} className="ciis-access-list-item">
                    <span className="ciis-list-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="ciis-access-btn">Employee Login</button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="ciis-benefits">
        <div className="ciis-section-container">
          <div className="ciis-section-header">
            <h2 className="ciis-section-title">Why Choose Our Platform?</h2>
            <p className="ciis-section-description">
              Experience the difference with our cutting-edge employee management solution
            </p>
          </div>
          <div className="ciis-benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="ciis-benefit-card">
                <div className="ciis-benefit-icon">
                  <span>{benefit.icon}</span>
                </div>
                <h3 className="ciis-benefit-title">{benefit.title}</h3>
                <p className="ciis-benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>   

      {/* Footer */}
      <footer className="ciis-footer">
        <div className="ciis-footer-container">
          <div className="ciis-footer-content">
            <div className="ciis-footer-section">
              <div className="ciis-footer-logo">
                <img 
                  src="/logo.png" 
                  alt="CIIS Network Logo" 
                  className="ciis-footer-logo-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="ciis-footer-logo-fallback">
                  <span className="ciis-footer-logo-text">CIIS NETWORK</span>
                </div>
              </div>
              <p className="ciis-footer-description">
                Streamlining employee management for modern businesses with innovative
                solutions and cutting-edge technology.
              </p>
            </div>

            <div className="ciis-footer-section">
              <h4 className="ciis-footer-title">Company</h4>
              <ul className="ciis-footer-list">
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#support">Support</a></li>
              </ul>
            </div>

            <div className="ciis-footer-section">
              <h4 className="ciis-footer-title">Contact</h4>
              <ul className="ciis-footer-list">
                <li>📧 info@ciisnetwork.com</li>
                <li>📞 +91 98759 29761</li>
                <li>📍 Phase - 8B Azda Tower Mohali</li>
              </ul>
            </div>
          </div>

          <div className="ciis-footer-bottom">
            <p className="ciis-copyright">
              © 2025 CIIS Network. All rights reserved.
            </p>
            <div className="ciis-social-links">
              <a href="#" className="ciis-social-link">Twitter</a>
              <a href="#" className="ciis-social-link">LinkedIn</a>
              <a href="#" className="ciis-social-link">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
