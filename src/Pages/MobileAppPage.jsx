import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck
} from 'lucide-react';

const MOBILE_PILLARS = [
  {
    icon: MapPin,
    tag: 'MOBILE ATTENDANCE',
    title: 'Clock In from the Field or Office',
    desc: 'Employees can mark attendance with mobile-first location context, shift status, and punch history from one app.',
    bullets: [
      'GPS-supported mobile punch experience',
      'Daily attendance history and status visibility',
      'Shift, late mark, and leave context in one place'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: ClipboardList,
    tag: 'TASK ACCESS',
    title: 'Tasks, Alerts & Daily Work Updates',
    desc: 'Keep employees connected with assigned tasks, project updates, client work, and day-to-day operational reminders.',
    bullets: [
      'Mobile task lists and status updates',
      'Client and department work visibility',
      'Instant alerts for deadlines and approvals'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: UserCheck,
    tag: 'SELF SERVICE',
    title: 'Employee Profile, Leaves & Payslips',
    desc: 'Give employees direct access to important HR actions without needing repeated admin follow-up.',
    bullets: [
      'Apply for leave and check leave status',
      'View profile, documents, and HR information',
      'Access payslips and important company updates'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: MessageSquare,
    tag: 'COMMUNICATION',
    title: 'Team Communication on Mobile',
    desc: 'Help employees stay connected with messages, groups, support updates, and company announcements.',
    bullets: [
      'Team chat and company communication access',
      'Push notifications for important activity',
      'Mobile-first coordination for remote teams'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  }
];

const MOBILE_STEPS = [
  { num: '01', title: 'Employee Logs In', desc: 'Staff access CIIS with their employee account and company workspace.', color: '#2563eb' },
  { num: '02', title: 'Daily Work Happens', desc: 'Attendance, tasks, leaves, alerts, and communication stay available on mobile.', color: '#7c3aed' },
  { num: '03', title: 'Managers Stay Updated', desc: 'Every employee action syncs back to dashboards, reports, and approval queues.', color: '#10b981' }
];

export default function MobileAppPage() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        <section className="ciis-op-hero theme-automation">
          <div className="ciis-op-container">
            <div className="ciis-badge">
              <Smartphone size={14} />
              <span>MOBILE EMPLOYEE APP</span>
            </div>
            <h1 className="ciis-op-title">
              Mobile Attendance, Tasks, Alerts, Leaves &{' '}
              <span className="ciis-gradient-cyan">Employee Self-Service</span>
            </h1>
            <p className="ciis-op-subtitle">
              CIIS gives employees a mobile-first companion for attendance, daily tasks,
              leave requests, notifications, payslips, team communication, and company updates.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Start Mobile App Trial
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Request App Demo
              </Link>
            </div>
            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Mobile Attendance</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Push Alerts</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Employee Self-Service</span></div>
            </div>
          </div>
        </section>

        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Bell size={14} />
                <span>EMPLOYEE EXPERIENCE</span>
              </div>
              <h2 className="ciis-section-title">Everything Employees Need in Their Pocket</h2>
              <p className="ciis-section-subtitle">
                Reduce admin dependency by giving employees secure access to daily work and HR actions.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {MOBILE_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div className="ciis-op-card" key={pillar.title}>
                    <div className="ciis-op-card-icon-wrap" style={{ background: pillar.bg, color: pillar.accent }}>
                      <Icon size={28} />
                    </div>
                    <span className="ciis-op-card-tag">{pillar.tag}</span>
                    <h3 className="ciis-op-card-title">{pillar.title}</h3>
                    <p className="ciis-op-card-desc">{pillar.desc}</p>
                    <div className="ciis-op-card-bullets">
                      {pillar.bullets.map((bullet) => (
                        <div className="ciis-op-bullet-item" key={bullet}>
                          <CheckCircle2 size={15} color="#10b981" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ciis-op-deep-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <ShieldCheck size={14} />
                <span>CONNECTED WORKFORCE</span>
              </div>
              <h2 className="ciis-section-title">Mobile Actions Sync Back to Operations</h2>
              <p className="ciis-section-subtitle">
                Every attendance punch, leave request, task update, and alert stays connected with CIIS dashboards.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {MOBILE_STEPS.map((step) => (
                  <div className="ciis-op-step-item" key={step.num}>
                    <span className="ciis-op-step-num" style={{ background: `${step.color}15`, color: step.color }}>
                      Step {step.num}
                    </span>
                    <h3 className="ciis-op-step-title">{step.title}</h3>
                    <p className="ciis-op-step-desc">{step.desc}</p>
                  </div>
                ))}
              </div>
              <div className="ciis-op-stats-row">
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>Anytime</div><div className="ciis-op-stat-label">Employee Access</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#10b981' }}>Live</div><div className="ciis-op-stat-label">Operational Sync</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>Fast</div><div className="ciis-op-stat-label">Leave & Task Updates</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>Secure</div><div className="ciis-op-stat-label">Employee Workspace</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="ciis-op-cta-section">
          <div className="ciis-op-container">
            <div className="ciis-op-cta-box">
              <div className="ciis-badge ciis-badge-dark" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>MOBILE WORKFORCE</span>
              </div>
              <h2>Ready to give employees a smarter mobile workspace?</h2>
              <p>Launch CIIS mobile workflows for attendance, tasks, leave, alerts, and employee self-service.</p>
              <div className="ciis-op-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">Start Free 30-Day Trial <ArrowRight size={16} /></Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">Schedule a Consultation</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
