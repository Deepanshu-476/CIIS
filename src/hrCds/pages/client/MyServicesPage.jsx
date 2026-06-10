import React from 'react';
import {
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiSearch,
  FiFilter,
  FiSliders,
  FiPlus,
  FiMessageCircle,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiActivity
} from 'react-icons/fi';
import './MyServicesPage.css';

const MyServicesPage = () => {
  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div>
          <h2>Welcome back, Test123</h2>
          <p>Search services, invoices, tickets.</p>
        </div>
        <button className="quick-action-btn">Quick Action</button>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-value">6</div>
          <div className="stat-label">Active Services</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">3</div>
          <div className="stat-label">Completed Services</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">4</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">2</div>
          <div className="stat-label">Support Retainers</div>
        </div>
      </div>

      {/* My Services Section */}
      <div className="section-header">
        <div>
          <h3>My Services</h3>
          <p>Track all your active services, progress, timelines and assigned teams.</p>
        </div>
        <button className="view-all-btn">View All</button>
      </div>

      {/* Search and Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch />
          <input type="text" placeholder="Search services by name or keyword..." />
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option>All Status</option>
            <option>Active</option>
            <option>In Progress</option>
            <option>On Hold</option>
            <option>Completed</option>
          </select>
          <select className="filter-select">
            <option>All Types</option>
            <option>Design</option>
            <option>Development</option>
            <option>Marketing</option>
          </select>
          <select className="filter-select">
            <option>Recently Updated</option>
            <option>Oldest</option>
            <option>A-Z</option>
          </select>
          <button className="sort-btn">
            <FiSliders /> Sort By
          </button>
        </div>
        <button className="request-service-btn">
          <FiPlus /> Request New Service
        </button>
      </div>

      {/* Service Cards Grid */}
      <div className="services-grid">
        {/* Card 1 - Website Redesign */}
        <div className="service-card">
          <div className="card-header">
            <div>
              <span className="service-type">Website Redesign</span>
              <div className="status-badge in-progress">In Progress</div>
            </div>
            <div className="date-badge">
              <FiCalendar /> <span>In 2 days</span>
            </div>
          </div>
          <p className="service-desc">Redesigning corporate website with modern UI/UX and CMS.</p>
          <div className="progress-section">
            <div className="progress-label">
              <span>60%</span>
              <span>Complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '60%' }}></div>
            </div>
          </div>
          <div className="date-info">
            <div>
              <span>Start Date</span>
              <strong>May 10, 2026</strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>Jun 30, 2026</strong>
            </div>
          </div>
          <div className="card-actions">
            <button className="action-link">View Details</button>
            <button className="action-link">View Tasks</button>
            <button className="action-link">Contact Team</button>
          </div>
        </div>

        {/* Card 2 - SEO Optimization */}
        <div className="service-card">
          <div className="card-header">
            <div>
              <span className="service-type">SEO Optimization</span>
              <div className="status-badge active">Active</div>
            </div>
            <div className="date-badge">
              <FiCalendar /> <span>In 7 days</span>
            </div>
          </div>
          <p className="service-desc">Improving website visibility and ranking across target keywords.</p>
          <div className="progress-section">
            <div className="progress-label">
              <span>75%</span>
              <span>Complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '75%' }}></div>
            </div>
          </div>
          <div className="date-info">
            <div>
              <span>Start Date</span>
              <strong>Apr 15, 2026</strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>Aug 15, 2026</strong>
            </div>
          </div>
          <div className="card-actions">
            <button className="action-link">View Details</button>
            <button className="action-link">View Tasks</button>
            <button className="action-link">Contact Team</button>
          </div>
        </div>

        {/* Card 3 - Social Media Management */}
        <div className="service-card">
          <div className="card-header">
            <div>
              <span className="service-type">Social Media Management</span>
              <div className="status-badge active">Active</div>
            </div>
            <div className="date-badge">
              <FiCalendar /> <span>In 15 days</span>
            </div>
          </div>
          <p className="service-desc">Managing social channels and content strategy.</p>
          <div className="progress-section">
            <div className="progress-label">
              <span>80%</span>
              <span>Complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div className="date-info">
            <div>
              <span>Start Date</span>
              <strong>Apr 20, 2026</strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>Ongoing</strong>
            </div>
          </div>
          <div className="card-actions">
            <button className="action-link">View Details</button>
            <button className="action-link">View Tasks</button>
            <button className="action-link">Contact Team</button>
          </div>
        </div>

        {/* Card 4 - Mobile App Development */}
        <div className="service-card">
          <div className="card-header">
            <div>
              <span className="service-type">Mobile App Development</span>
              <div className="status-badge in-progress">In Progress</div>
            </div>
            <div className="date-badge">
              <FiCalendar /> <span>In 12 days</span>
            </div>
          </div>
          <p className="service-desc">Building cross-platform mobile app for iOS and Android.</p>
          <div className="progress-section">
            <div className="progress-label">
              <span>40%</span>
              <span>Complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '40%' }}></div>
            </div>
          </div>
          <div className="date-info">
            <div>
              <span>Start Date</span>
              <strong>May 15, 2026</strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>Aug 30, 2026</strong>
            </div>
          </div>
          <div className="card-actions">
            <button className="action-link">View Details</button>
            <button className="action-link">View Tasks</button>
            <button className="action-link">Contact Team</button>
          </div>
        </div>

        {/* Card 5 - IT Support & Maintenance */}
        <div className="service-card">
          <div className="card-header">
            <div>
              <span className="service-type">IT Support & Maintenance</span>
              <div className="status-badge active">Active</div>
            </div>
            <div className="date-badge">
              <FiCalendar /> <span>Ongoing</span>
            </div>
          </div>
          <p className="service-desc">Ongoing IT support, monitoring and maintenance.</p>
          <div className="progress-section">
            <div className="progress-label">
              <span>90%</span>
              <span>Complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '90%' }}></div>
            </div>
          </div>
          <div className="date-info">
            <div>
              <span>Start Date</span>
              <strong>Jun 01, 2026</strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>Dec 31, 2026</strong>
            </div>
          </div>
          <div className="card-actions">
            <button className="action-link">View Details</button>
            <button className="action-link">View Tasks</button>
            <button className="action-link">Contact Team</button>
          </div>
        </div>

        {/* Card 6 - Branding & Creatives */}
        <div className="service-card">
          <div className="card-header">
            <div>
              <span className="service-type">Branding & Creatives</span>
              <div className="status-badge on-hold">On Hold</div>
            </div>
            <div className="date-badge">
              <FiCalendar /> <span>Paused</span>
            </div>
          </div>
          <p className="service-desc">Brand identity, creatives and marketing collaterals.</p>
          <div className="progress-section">
            <div className="progress-label">
              <span>25%</span>
              <span>Complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '25%' }}></div>
            </div>
          </div>
          <div className="date-info">
            <div>
              <span>Start Date</span>
              <strong>Mar 10, 2026</strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>On Hold</strong>
            </div>
          </div>
          <div className="card-actions">
            <button className="action-link">View Details</button>
            <button className="action-link">View Tasks</button>
            <button className="action-link">Contact Team</button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Updates & Billing */}
      <div className="bottom-section">
        {/* Recent Service Updates */}
        <div className="recent-updates">
          <div className="section-header small">
            <h4>Recent Service Updates</h4>
            <button className="view-all-text">View All</button>
          </div>
          <div className="updates-list">
            <div className="update-item">
              <div className="update-dot blue"></div>
              <div className="update-content">
                <p><strong>Website Redesign</strong> - UI Design phase completed</p>
                <span>Jun 8, 2026</span>
              </div>
            </div>
            <div className="update-item">
              <div className="update-dot green"></div>
              <div className="update-content">
                <p><strong>SEO Optimization</strong> - Keyword research updated</p>
                <span>Jun 7, 2026</span>
              </div>
            </div>
            <div className="update-item">
              <div className="update-dot purple"></div>
              <div className="update-content">
                <p><strong>Mobile App Development</strong> - In Progress</p>
                <span>Jun 6, 2026</span>
              </div>
            </div>
            <div className="update-item">
              <div className="update-dot orange"></div>
              <div className="update-content">
                <p><strong>IT Support & Maintenance</strong> - Monthly maintenance completed</p>
                <span>Jun 6, 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Snapshot */}
        <div className="billing-snapshot">
          <div className="section-header small">
            <h4>Billing Snapshot</h4>
            <button className="view-all-text">View All Invoices</button>
          </div>
          <div className="billing-stats">
            <div className="billing-item">
              <div className="billing-value">₹1,24,500</div>
              <div className="billing-label">Total Outstanding</div>
            </div>
            <div className="billing-item">
              <div className="billing-value">3</div>
              <div className="billing-label">Unpaid Invoices</div>
            </div>
          </div>
          <div className="invoice-breakdown">
            <div className="breakdown-item overdue">
              <span>Overdue</span>
              <strong>₹32,000</strong>
            </div>
            <div className="breakdown-item due-this-month">
              <span>Due This Month</span>
              <strong>₹18,000</strong>
            </div>
            <div className="breakdown-item not-due">
              <span>Not Due Yet</span>
              <strong>₹74,500</strong>
            </div>
          </div>
          <button className="view-all-services">View All Services</button>
        </div>

        {/* Service Timeline Section */}
        <div className="timeline-section">
          <div className="timeline-header">
            <div>
              <h4>Service Timeline: Website Redesign</h4>
              <div className="timeline-status in-progress">In Progress</div>
            </div>
            <button className="view-all-text">View All</button>
          </div>
          <div className="timeline-steps">
            <div className="timeline-step completed">
              <div className="step-icon"><FiCheckCircle /></div>
              <div className="step-info">
                <strong>Discovery</strong>
                <span>May 10, 2026</span>
              </div>
              <div className="step-status">Completed</div>
            </div>
            <div className="timeline-step completed">
              <div className="step-icon"><FiCheckCircle /></div>
              <div className="step-info">
                <strong>UI Design</strong>
                <span>May 28, 2026</span>
              </div>
              <div className="step-status">Completed</div>
            </div>
            <div className="timeline-step active">
              <div className="step-icon"><FiActivity /></div>
              <div className="step-info">
                <strong>Development</strong>
                <span>Jun 1 - Jun 22</span>
              </div>
              <div className="step-status">In Progress</div>
            </div>
            <div className="timeline-step upcoming">
              <div className="step-icon"><FiClock /></div>
              <div className="step-info">
                <strong>Testing</strong>
                <span>Jun 23 - Jun 28</span>
              </div>
              <div className="step-status">Upcoming</div>
            </div>
            <div className="timeline-step upcoming">
              <div className="step-icon"><FiClock /></div>
              <div className="step-info">
                <strong>Launch</strong>
                <span>Jun 30, 2026</span>
              </div>
              <div className="step-status">Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Assigned Section */}
      <div className="team-section">
        <div className="team-header">
          <h4>Team Assigned</h4>
          <button className="view-all-text">View All</button>
        </div>
        <div className="team-members">
          <div className="member-card">
            <div className="member-avatar">RS</div>
            <div className="member-info">
              <strong>Rahul Sharma</strong>
              <span>Project Manager</span>
            </div>
          </div>
          <div className="member-card">
            <div className="member-avatar">PM</div>
            <div className="member-info">
              <strong>Priya Mehta</strong>
              <span>UI/UX Designer</span>
            </div>
          </div>
          <div className="member-card">
            <div className="member-avatar">AV</div>
            <div className="member-info">
              <strong>Amit Verma</strong>
              <span>Frontend Developer</span>
            </div>
          </div>
          <div className="member-card">
            <div className="member-avatar">KS</div>
            <div className="member-info">
              <strong>Karan Singh</strong>
              <span>Backend Developer</span>
            </div>
          </div>
          <div className="member-card more-members">
            <div className="member-avatar">+2</div>
            <div className="member-info">
              <strong>More Members</strong>
              <span>Support Team</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Manager Section */}
      <div className="account-manager">
        <div className="manager-info">
          <div className="manager-avatar">RS</div>
          <div className="manager-details">
            <p>Your Account Manager</p>
            <h4>Rahul Sharma</h4>
            <span>rahul.sharma@ciisnetwork.com</span>
            <span>+919876787645</span>
          </div>
        </div>
        <button className="message-btn">
          <FiMessageCircle /> Message Rahul
        </button>
      </div>
    </div>
  );
};

export default MyServicesPage;