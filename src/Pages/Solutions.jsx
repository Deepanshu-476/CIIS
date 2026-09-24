import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './Solutions.css';
import {
  Users,
  Briefcase,
  PhoneCall,
  ShieldCheck,
  Building,
  Rocket,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';

const DEPARTMENT_SOLUTIONS = [
  {
    id: 'hr',
    title: 'For HR & People Operations',
    tag: 'People Operations',
    icon: Users,
    headline: 'Eliminate tedious paperwork & automate your workforce lifecycle.',
    desc: 'From new hire digital onboarding to biometric/IP attendance, automated leave requests, and payroll disbursement—CIIS streamlines every HR process.',
    benefits: [
      'Self-onboarding portal for new recruits with KYC document verification',
      'Automated leave policies, public holiday calendars, and approval workflows',
      'Live attendance dashboard with real-time late and absent alerts',
      '1-click monthly payroll processing with automated tax & deduction calculations'
    ],
    metric: '70% Reduction in HR Admin Time',
    accent: 'blue',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)'
  },
  {
    id: 'sales',
    title: 'For Sales & Telecalling Teams',
    tag: 'Revenue & Calling',
    icon: PhoneCall,
    headline: 'Maximize connect rates & convert leads into paying clients.',
    desc: 'Equip your sales representatives and telecallers with intelligent lead assignment, automated call schedules, call outcome tracking, and live conversion analytics.',
    benefits: [
      'Automated lead distribution (round-robin or workload-balanced)',
      'Single-pane call workspace: dial, log conversation notes, and set follow-ups',
      'Pending and scheduled call reminders to prevent dropped leads',
      'Real-time conversion reports and executive agent performance leaderboards'
    ],
    metric: '3.5x Faster Lead Follow-Up Speed',
    accent: 'orange',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.08)'
  },
  {
    id: 'ops',
    title: 'For Project Managers & Operations',
    tag: 'Execution & Tasks',
    icon: Briefcase,
    headline: 'Total clarity across projects, deliverables, and team bandwidth.',
    desc: 'Eliminate missed deadlines with structured task assignments, priority tags, interactive Kanban boards, and milestone tracking linked directly to client accounts.',
    benefits: [
      'Visual Kanban boards and priority matrices for daily sprints',
      'Task assignment across individual staff, departments, and specific clients',
      'Milestone deadline tracking with automated status progress percentages',
      'Activity audit trails to maintain accountability across all deliverables'
    ],
    metric: '45% Increase in Project On-Time Delivery',
    accent: 'purple',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)'
  },
  {
    id: 'exec',
    title: 'For Founders, Executives & Super Admins',
    tag: 'Executive Governance',
    icon: ShieldCheck,
    headline: 'Bird’s-eye visibility and complete control across all branches.',
    desc: 'Gain real-time operational intelligence across all company departments, branches, employee attendance, and revenue operations from one centralized Super Admin portal.',
    benefits: [
      'Centralized command center for multi-branch and multi-department governance',
      'Granular role-based access control (RBAC) and page permission manager',
      'Comprehensive system audit logs, device security, and 2FA authentication',
      'Real-time executive summaries on workforce productivity and revenue pipeline'
    ],
    metric: '100% Operational Transparency',
    accent: 'green',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.08)'
  }
];

const SCALE_SOLUTIONS = [
  {
    badge: 'Growing Teams',
    badgeColor: '#2563eb',
    title: 'Startups & Fast-Growing SMBs',
    icon: Rocket,
    desc: 'Launch fast without IT overhead. Unify attendance, tasks, and basic sales calling under one affordable platform.',
    features: [
      'Quick 2-minute self-service setup',
      'Unified single login for all employees',
      'Core attendance, task, and lead tracking',
      'Scale effortlessly as your headcount expands'
    ],
    highlight: 'Ideal for 5 - 50 employees'
  },
  {
    badge: 'Most Popular',
    badgeColor: '#7c3aed',
    title: 'Mid-Sized Enterprises',
    icon: Building,
    desc: 'Structure your growing organization with multiple departments, custom reporting lines, and specialized shift rosters.',
    features: [
      'Multi-tier manager approval chains',
      'Custom shift rosters and rotational schedules',
      'Role-based permissions by department',
      'Automated monthly salary structures and payslips'
    ],
    highlight: 'Ideal for 50 - 500 employees'
  },
  {
    badge: 'Multi-Entity',
    badgeColor: '#059669',
    title: 'Large Corporate Networks',
    icon: Building2,
    desc: 'Manage multiple branches, regional divisions, and massive workforce operations with enterprise security and governance.',
    features: [
      'Super Admin multi-branch command console',
      'Encrypted cloud storage with 99.9% uptime SLA',
      'Custom employee KYC & asset assignment vault',
      'Dedicated technical onboarding and support desk'
    ],
    highlight: 'Ideal for 500+ employees & branches'
  }
];

const INDUSTRIES = [
  { tag: 'TECH & SOFTWARE', name: 'IT Services & Software', icon: '💻', desc: 'Manage developers, client milestones, sprints, and remote attendance verification.' },
  { tag: 'BPO & CALLING', name: 'Telecalling & BPO Centers', icon: '🎧', desc: 'Optimize daily call volumes, lead conversions, dial queues, and agent performance logs.' },
  { tag: 'CORPORATE', name: 'Financial & Corporate', icon: '📈', desc: 'Strict role-based permissions, payroll automation, audit trails, and compliance records.' },
  { tag: 'FIELD OPERATIONS', name: 'Real Estate & Field Sales', icon: '🏢', desc: 'Track sales reps on the go, client visits, geo-punches, and active deal pipelines.' },
  { tag: 'AGENCY WORKFLOWS', name: 'Marketing & Digital Agencies', icon: '🚀', desc: 'Client portal services, creative task workflows, subtask deadlines, and team chat.' },
  { tag: 'HEALTHCARE', name: 'Healthcare & Facilities', icon: '🏥', desc: 'Multi-shift rosters, attendance verification, asset tracking, and branch supervision.' }
];

// Inter-Section Reusable CTA Banner Component (Every 2nd Section)
function SectionCtaBanner({ badge, title }) {
  return (
    <div className="ciis-section-cta-divider">
      <div className="ciis-container">
        <div className="ciis-cta-banner-card">
          <div className="ciis-cta-banner-left">
            <div className="ciis-cta-banner-badge">
              <Sparkles size={14} className="ciis-sparkle-pulse" />
              <span>{badge}</span>
            </div>
            <h3 className="ciis-cta-banner-title">{title}</h3>
          </div>
          <div className="ciis-cta-banner-right">
            <Link to="/RegisterCompany" className="ciis-btn ciis-btn-trial">
              <span>Start Free Trial in 30 Days</span>
              <ArrowRight size={17} className="ciis-trial-arrow" />
            </Link>
            <div className="ciis-cta-banner-meta">
              <span><CheckCircle2 size={13} color="#10b981" /> No credit card required</span>
              <span><CheckCircle2 size={13} color="#10b981" /> Instant activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Solutions() {
  const [activeDept, setActiveDept] = useState('hr');

  const selectedDeptData = DEPARTMENT_SOLUTIONS.find((d) => d.id === activeDept) || DEPARTMENT_SOLUTIONS[0];
  const IconComp = selectedDeptData.icon;

  return (
    <div className="ciis-sol-page">
      <HomeHeader />

      <main className="ciis-sol-main">
        {/* HERO SECTION */}
        <section className="ciis-sol-hero">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-sol-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse"></span>
              <span>TAILORED OPERATIONAL ARCHITECTURE</span>
            </div>
            <h1 className="ciis-sol-title">
              Engineered for Every Team,{' '}
              <span className="ciis-gradient-text">Optimized for Every Scale</span>
            </h1>
            <p className="ciis-sol-subtitle">
              Whether you need to streamline HR attendance, supercharge your telecalling pipeline,
              or govern multi-branch operations, CIIS Network delivers specialized operational solutions.
            </p>
            <div className="ciis-sol-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Get Started with CIIS
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Request Custom Solution
              </Link>
            </div>

            {/* Hero Trust Highlights */}
            <div className="ciis-sol-hero-trust">
              <div className="ciis-sol-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Tailored for Every Department</span>
              </div>
              <div className="ciis-sol-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Granular RBAC Permissions</span>
              </div>
              <div className="ciis-sol-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Free 30-Day Evaluation</span>
              </div>
              <div className="ciis-sol-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Multi-Branch Scalability</span>
              </div>
            </div>
          </div>
        </section>

        {/* DEPARTMENT-SPECIFIC SOLUTIONS SECTION */}
        <section className="ciis-sol-dept-section">
          <div className="ciis-sol-container">
            <div className="ciis-sol-section-header">
              <div className="ciis-badge">
                <span className="ciis-badge-pulse"></span>
                <span>SOLUTIONS BY ROLE</span>
              </div>
              <h2 className="ciis-section-title">Built for Your Organization&apos;s Core Pillars</h2>
              <p className="ciis-section-subtitle">
                Select your department to see how CIIS Network transforms day-to-day operations and removes operational friction.
              </p>
            </div>

            {/* Department Navigation Tabs */}
            <div className="ciis-sol-dept-tabs">
              {DEPARTMENT_SOLUTIONS.map((dept) => {
                const TabIcon = dept.icon;
                const isActive = activeDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    className={`ciis-sol-dept-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveDept(dept.id)}
                    style={isActive ? { borderColor: dept.color, boxShadow: `0 4px 16px ${dept.color}33` } : {}}
                  >
                    <span className="ciis-sol-tab-icon" style={isActive ? { color: '#ffffff' } : { color: dept.color }}>
                      <TabIcon size={18} />
                    </span>
                    <span>{dept.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Department Showcase Card */}
            <div
              className={`ciis-sol-showcase-box accent-${selectedDeptData.accent}`}
              style={{ '--dept-accent': selectedDeptData.color }}
            >
              <div className="ciis-sol-showcase-content">
                <div className="ciis-sol-showcase-header">
                  <div className="ciis-sol-icon-wrap" style={{ background: selectedDeptData.bg, color: selectedDeptData.color }}>
                    <IconComp size={30} />
                  </div>
                  <div>
                    <span className="ciis-sol-showcase-tag" style={{ color: selectedDeptData.color }}>{selectedDeptData.tag}</span>
                    <h3 className="ciis-sol-showcase-title">{selectedDeptData.title}</h3>
                  </div>
                </div>

                <h4 className="ciis-sol-showcase-headline" style={{ color: selectedDeptData.color }}>{selectedDeptData.headline}</h4>
                <p className="ciis-sol-showcase-desc">{selectedDeptData.desc}</p>

                <div className="ciis-sol-benefits-grid">
                  {selectedDeptData.benefits.map((b, idx) => (
                    <div key={idx} className="ciis-sol-benefit-item">
                      <CheckCircle2 size={18} className="ciis-sol-check" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="ciis-sol-showcase-footer">
                  <div className="ciis-sol-metric-pill">
                    <Award size={18} />
                    <span>{selectedDeptData.metric}</span>
                  </div>

                  <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary" style={{ padding: '10px 22px', fontSize: '14.5px' }}>
                    Deploy This Workflow
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTER-SECTION CTA BANNER 1 (After 2nd Section) */}
        <SectionCtaBanner
          badge="30-Day Risk-Free Trial"
          title="Ready to supercharge your department's daily operational efficiency?"
        />

        {/* SOLUTIONS BY BUSINESS SCALE */}
        <section className="ciis-sol-scale-section">
          <div className="ciis-sol-container">
            <div className="ciis-sol-section-header">
              <div className="ciis-badge">
                <span className="ciis-badge-pulse"></span>
                <span>ADAPTS AS YOU GROW</span>
              </div>
              <h2 className="ciis-section-title">A Solution That Scales With Your Journey</h2>
              <p className="ciis-section-subtitle">
                From pre-seed startups establishing initial operational discipline to large multi-entity corporations.
              </p>
            </div>

            <div className="ciis-sol-scale-grid">
              {SCALE_SOLUTIONS.map((scale, i) => {
                const SIcon = scale.icon;
                return (
                  <div key={i} className="ciis-sol-scale-card" style={{ '--card-tint': scale.badgeColor }}>
                    <div className="ciis-sol-scale-badge" style={{ background: scale.badgeColor }}>
                      {scale.badge}
                    </div>
                    <div className="ciis-sol-scale-icon" style={{ color: scale.badgeColor }}>
                      <SIcon size={26} />
                    </div>
                    <h3 className="ciis-sol-scale-title">{scale.title}</h3>
                    <p className="ciis-sol-scale-desc">{scale.desc}</p>

                    <div className="ciis-sol-scale-highlight">
                      <span>{scale.highlight}</span>
                    </div>

                    <div className="ciis-sol-scale-features">
                      {scale.features.map((f, j) => (
                        <div key={j} className="ciis-sol-scale-feat-item">
                          <CheckCircle2 size={16} className="ciis-sol-scale-check" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ciis-sol-scale-cta">
                      <Link to="/RegisterCompany" className="ciis-btn ciis-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        Get Started
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INDUSTRIES SERVED */}
        <section className="ciis-sol-industry-section">
          <div className="ciis-sol-container">
            <div className="ciis-sol-section-header">
              <div className="ciis-badge">
                <span className="ciis-badge-pulse"></span>
                <span>INDUSTRY AGNOSTIC</span>
              </div>
              <h2 className="ciis-section-title">Proven Across Key Business Verticals</h2>
              <p className="ciis-section-subtitle">
                Versatile workflow modules designed to fit specific operational requirements across sectors.
              </p>
            </div>

            <div className="ciis-sol-industry-grid">
              {INDUSTRIES.map((ind, k) => (
                <div key={k} className="ciis-sol-industry-card">
                  <div className="ciis-sol-industry-top">
                    <span className="ciis-sol-industry-emoji">{ind.icon}</span>
                    <span className="ciis-sol-industry-tag">{ind.tag}</span>
                  </div>
                  <h4 className="ciis-sol-industry-name">{ind.name}</h4>
                  <p className="ciis-sol-industry-desc">{ind.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTER-SECTION CTA BANNER 2 */}
        <SectionCtaBanner
          badge="Tailored Enterprise Architecture"
          title="Looking for a custom setup for your unique industry workflow?"
        />

        {/* BOTTOM CTA BANNER */}
        <section className="ciis-sol-cta-section">
          <div className="ciis-sol-container">
            <div className="ciis-sol-cta-box">
              <div className="ciis-badge ciis-badge-dark" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>EXPERIENCE CIIS NETWORK</span>
              </div>
              <h2>Ready for an Operational Upgrade?</h2>
              <p>
                Deploy CIIS Network in your organization today and experience effortless productivity, real-time telemetry, and automated payroll.
              </p>
              <div className="ciis-sol-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Register Your Company
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                  Talk to Our Solutions Architect
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
