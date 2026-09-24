import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './Features.css';
import {
  Users,
  Clock,
  CheckSquare,
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  BarChart3,
  Sliders,
  Lock,
  Building2,
  Calendar,
  Search,
  Bell
} from 'lucide-react';

const FEATURE_CATEGORIES = [
  { id: 'all', label: 'All Modules' },
  { id: 'hr', label: 'Workforce & HR' },
  { id: 'tasks', label: 'Tasks & Projects' },
  { id: 'crm', label: 'CRM & Calling' },
  { id: 'automation', label: 'Automation & Security' }
];

const DETAILED_FEATURES = [
  {
    id: 'emp-mgmt',
    category: 'hr',
    icon: Users,
    tag: 'Core Workforce',
    title: 'Employee & Organization Management',
    desc: 'Centralize your entire workforce database with structured multi-branch hierarchies, role designations, and comprehensive digital profiles.',
    highlights: [
      'Multi-branch & department organization architecture',
      'Custom designation hierarchy & reporting lines',
      'Encrypted digital employee document repository',
      'Seamless self-registration and KYC verification workflows'
    ],
    badge: 'Popular',
    accent: 'blue'
  },
  {
    id: 'smart-attendance',
    category: 'hr',
    icon: Clock,
    tag: 'Time & Attendance',
    title: 'Smart Attendance & Shift Rosters',
    desc: 'Track working hours, shifts, attendance, and overtime in real-time with automated geofencing, IP restrictions, and auto clock-out.',
    highlights: [
      'One-click clock in/out with IP & network verification',
      'Flexible multi-shift scheduling and rotational rosters',
      'Automated late-coming & overtime calculations',
      'Direct integration with leave approvals and payroll cycles'
    ],
    badge: 'Real-Time',
    accent: 'green'
  },
  {
    id: 'task-mgmt',
    category: 'tasks',
    icon: CheckSquare,
    tag: 'Productivity',
    title: 'Task & Milestone Management',
    desc: 'Delegate, monitor, and collaborate on tasks across individuals, departments, clients, and projects with transparent status pipelines.',
    highlights: [
      'Interactive Kanban boards and list views with priority levels',
      'Recurring tasks, checklist items, and milestone tracking',
      'Client and project-associated work assignments',
      'Live audit timeline and real-time progress percentage'
    ],
    badge: 'Collaborative',
    accent: 'purple'
  },
  {
    id: 'crm-telecaller',
    category: 'crm',
    icon: Phone,
    tag: 'Sales & Telecalling',
    title: 'Integrated CRM & Telecaller Suite',
    desc: 'Empower your sales and support teams with automated lead assignments, call history tracking, converted pipelines, and agent workload reports.',
    highlights: [
      'Smart lead distribution (manual, bulk, or round-robin)',
      'Today’s scheduled calls, follow-ups, and pending call queues',
      'Detailed call outcome logging and conversation summaries',
      'Real-time conversion reports and executive performance dashboards'
    ],
    badge: 'High Impact',
    accent: 'orange'
  },
  {
    id: 'team-comm',
    category: 'tasks',
    icon: MessageSquare,
    tag: 'Communication',
    title: 'Real-Time Team Communication & Chat',
    desc: 'Break communication silos with unified team chat, department channels, file sharing, direct peer messaging, and scheduled meetings.',
    highlights: [
      'Instant direct and group messaging with media attachments',
      'Department-specific discussion rooms and project channels',
      'Online presence indicators and read receipts',
      'Integrated meeting scheduler for internal and client reviews'
    ],
    badge: 'Unified',
    accent: 'teal'
  },
  {
    id: 'payroll-mgmt',
    category: 'hr',
    icon: DollarSign,
    tag: 'Compensation',
    title: 'Payroll, Salary & Payslips',
    desc: 'Automate salary processing, customized allowances, statutory deductions, and generate professional payslips with zero manual effort.',
    highlights: [
      'Custom salary structures with basic, HRA, bonuses, and deductions',
      'Automated monthly salary calculation based on attendance logs',
      'Instant PDF payslip generation and download portal',
      'Comprehensive payroll tax and company expenditure reports'
    ],
    badge: 'Automated',
    accent: 'indigo'
  },
  {
    id: 'security-rbac',
    category: 'automation',
    icon: ShieldCheck,
    tag: 'Governance',
    title: 'Enterprise Security & RBAC',
    desc: 'Protect sensitive company data with multi-factor authentication, granular role-based permissions, and end-to-end encryption.',
    highlights: [
      'Multi-level roles: Super Admin, Branch Admin, HR, Manager, Telecaller, Staff',
      'Secure 2-Factor Authentication (OTP verification over email)',
      'Granular sidebar & page-level permission controls',
      'Comprehensive system access audit trails and login logging'
    ],
    badge: 'Enterprise Grade',
    accent: 'red'
  },
  {
    id: 'business-automation',
    category: 'automation',
    icon: Zap,
    tag: 'Workflows',
    title: 'Automated Alerts & Approvals',
    desc: 'Eliminate manual bottlenecks with smart approval workflows, automated leave policies, company announcements, and system alerts.',
    highlights: [
      'Multi-tier leave application and approval hierarchy',
      'Real-time broadcast alerts and department announcements',
      'Automated email notifications for tasks and meetings',
      'Custom feedback questionnaires and evaluation forms'
    ],
    badge: 'Smart Engine',
    accent: 'cyan'
  }
];

const PLATFORM_STATS = [
  { value: '8+', label: 'Integrated Modules', desc: 'No more switching between separate tools' },
  { value: '99.9%', label: 'Cloud Uptime SLA', desc: 'Enterprise reliability with 24/7 monitoring' },
  { value: '70%', label: 'Time Saved on Admin', desc: 'Automated payroll, shifts, and attendance' },
  { value: '3x', label: 'Faster Lead Follow-Up', desc: 'Instant telecaller assignment pipelines' }
];

export default function Features() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = DETAILED_FEATURES.filter((feat) => {
    const matchesCategory = activeCategory === 'all' || feat.category === activeCategory;
    const matchesSearch =
      feat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="ciis-feat-page">
      <HomeHeader />

      <main className="ciis-feat-main">
        {/* HERO SECTION */}
        <section className="ciis-feat-hero">
          <div className="ciis-feat-container">
            <div className="ciis-feat-badge">
              <Sparkles size={15} />
              <span>POWERFUL BUSINESS MANAGEMENT PLATFORM</span>
            </div>
            <h1 className="ciis-feat-hero-title">
              Every Tool Your Business Needs,{' '}
              <span className="ciis-text-gradient">Unified in One Platform</span>
            </h1>
            <p className="ciis-feat-subtitle">
              From employee attendance and task pipelines to telecaller CRM and automated payroll—CIIS
              Network replaces fragmented software stacks with one integrated cloud operating system.
            </p>
            <div className="ciis-feat-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Register Your Company
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Schedule a Live Demo
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="ciis-feat-metrics-bar">
              {PLATFORM_STATS.map((stat, idx) => (
                <div key={idx} className="ciis-feat-metric-card">
                  <div className="ciis-feat-metric-num">{stat.value}</div>
                  <div className="ciis-feat-metric-label">{stat.label}</div>
                  <div className="ciis-feat-metric-desc">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE CONTROLS & FILTER SECTION */}
        <section className="ciis-feat-grid-section">
          <div className="ciis-feat-container">
            <div className="ciis-feat-controls">
              <div className="ciis-feat-search-wrap">
                <Search size={18} className="ciis-feat-search-icon" />
                <input
                  type="text"
                  placeholder="Search features (e.g. attendance, CRM, payroll, tasks)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ciis-feat-search-input"
                />
              </div>

              <div className="ciis-feat-tabs">
                {FEATURE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`ciis-feat-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FEATURE CARDS GRID */}
            <div className="ciis-feat-cards-grid">
              {filteredFeatures.map((feat) => {
                const IconComponent = feat.icon;
                return (
                  <div key={feat.id} className={`ciis-feat-card accent-${feat.accent}`}>
                    <div className="ciis-feat-card-header">
                      <div className="ciis-feat-card-icon-box">
                        <IconComponent size={24} />
                      </div>
                      <div className="ciis-feat-card-badge">{feat.badge}</div>
                    </div>

                    <div className="ciis-feat-card-tag">{feat.tag}</div>
                    <h3 className="ciis-feat-card-title">{feat.title}</h3>
                    <p className="ciis-feat-card-desc">{feat.desc}</p>

                    <div className="ciis-feat-card-points">
                      {feat.highlights.map((pt, i) => (
                        <div key={i} className="ciis-feat-card-point">
                          <CheckCircle2 size={16} className="ciis-point-check" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="ciis-feat-empty-state">
                <p>No features matched your search &quot;{searchQuery}&quot;.</p>
                <button
                  className="ciis-btn ciis-btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* WHY A UNIFIED PLATFORM WINS */}
        <section className="ciis-feat-comparison-section">
          <div className="ciis-feat-container">
            <div className="ciis-feat-section-header">
              <span className="ciis-pill-tag">ALL-IN-ONE ADVANTAGE</span>
              <h2 className="ciis-section-title">The CIIS Advantage vs. Fragmented Software</h2>
              <p className="ciis-section-subtitle">
                Stop paying for 5 separate subscriptions with disconnected data. CIIS brings everything under one synchronized roof.
              </p>
            </div>

            <div className="ciis-feat-compare-grid">
              <div className="ciis-compare-card bad">
                <h4 className="ciis-compare-title">Fragmented Standalone Tools</h4>
                <ul className="ciis-compare-list">
                  <li>Separate billing for Attendance, CRM, Tasks, and Payroll</li>
                  <li>Manual CSV exports and imports between apps</li>
                  <li>Employees confused by multiple passwords & logins</li>
                  <li>No centralized executive overview across departments</li>
                  <li>Slow manual reconciliation between shifts and salaries</li>
                </ul>
              </div>

              <div className="ciis-compare-card good">
                <div className="ciis-compare-badge">CIIS NETWORK WAY</div>
                <h4 className="ciis-compare-title">Unified CIIS Network Ecosystem</h4>
                <ul className="ciis-compare-list">
                  <li>One transparent subscription covering your entire team</li>
                  <li>Single sign-on: one account for attendance, tasks, and leads</li>
                  <li>Live attendance data automatically flows into payroll calculation</li>
                  <li>Instant executive oversight across all branches and leads</li>
                  <li>Enterprise 2FA, encrypted cloud storage & role-based controls</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CONVERSION CTA */}
        <section className="ciis-feat-cta-section">
          <div className="ciis-feat-container">
            <div className="ciis-feat-cta-box">
              <h2>Ready to Streamline Your Business Operations?</h2>
              <p>
                Join growing enterprises that manage their people, shifts, projects, and client pipelines from CIIS Network.
              </p>
              <div className="ciis-feat-cta-btns">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-light">
                  Register Company Now
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-outline-light">
                  Talk to Sales Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
