import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  GitPullRequest,
  Hourglass,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';

const LEAVE_PILLARS = [
  {
    icon: GitPullRequest,
    tag: 'REQUEST WORKFLOW',
    title: 'Employee Leave Requests & Approvals',
    desc: 'Employees submit leave from the portal or mobile app while managers approve, reject, or comment with complete visibility.',
    bullets: [
      'Single-day, multi-day, and half-day request handling',
      'Manager approval queues with employee history',
      'Automatic notifications for every request status'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: CalendarDays,
    tag: 'HOLIDAY POLICIES',
    title: 'Company Holidays & Branch Calendars',
    desc: 'Maintain holiday calendars and leave policies across departments, branches, and teams without manual spreadsheet tracking.',
    bullets: [
      'Branch-wise holiday planning and policy mapping',
      'Configurable paid, unpaid, sick, and casual leave types',
      'Clear leave balances visible to employees and admins'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: Hourglass,
    tag: 'BALANCE TRACKING',
    title: 'Leave Balance & Attendance Sync',
    desc: 'Approved leaves stay connected with attendance and payroll so salary calculations are consistent at month end.',
    bullets: [
      'Automatic balance deduction after approval',
      'Attendance calendar reflects leave status',
      'Payroll deductions and paid leave rules stay aligned'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: FileCheck,
    tag: 'AUDIT READY',
    title: 'Transparent Leave Records',
    desc: 'Every request, approval, rejection, and policy change is stored as a clean operational record for HR reviews.',
    bullets: [
      'Employee-wise leave history and manager remarks',
      'Department reports for absence trends',
      'Audit-ready documentation for HR operations'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  }
];

const LEAVE_STEPS = [
  { num: '01', title: 'Employee Applies', desc: 'The employee selects leave type, date range, reason, and submits the request from web or mobile.', color: '#2563eb' },
  { num: '02', title: 'Manager Reviews', desc: 'Approvers see balance, attendance context, team availability, and request history before taking action.', color: '#7c3aed' },
  { num: '03', title: 'Records Update Automatically', desc: 'Attendance calendar, leave balance, and payroll inputs update after approval.', color: '#10b981' }
];

export default function LeaveManagementPage() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        <section className="ciis-op-hero theme-communication">
          <div className="ciis-op-container">
            <div className="ciis-badge">
              <ClipboardCheck size={14} />
              <span>LEAVE MANAGEMENT</span>
            </div>
            <h1 className="ciis-op-title">
              Leave Requests, Approvals, Holiday Policies &{' '}
              <span className="ciis-gradient-purple">Balance Tracking</span>
            </h1>
            <p className="ciis-op-subtitle">
              CIIS simplifies leave operations with employee self-service requests, manager approval flows,
              company holidays, balance tracking, attendance sync, and payroll-ready records.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Start Leave Management Trial
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Book HR Workflow Demo
              </Link>
            </div>
            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Approval Workflows</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Holiday Calendars</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Payroll Alignment</span></div>
            </div>
          </div>
        </section>

        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Users size={14} />
                <span>HR CONTROL</span>
              </div>
              <h2 className="ciis-section-title">A Clean Leave System for Every Team</h2>
              <p className="ciis-section-subtitle">
                Replace chat approvals and manual balance sheets with a structured, auditable leave workflow.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {LEAVE_PILLARS.map((pillar) => {
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
                <span>APPROVAL FLOW</span>
              </div>
              <h2 className="ciis-section-title">From Request to Payroll Sync</h2>
              <p className="ciis-section-subtitle">
                Every leave action updates the operational system without repeated HR follow-up.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {LEAVE_STEPS.map((step) => (
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
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>Self-Service</div><div className="ciis-op-stat-label">Employee Leave Requests</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>Live</div><div className="ciis-op-stat-label">Leave Balance Visibility</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#10b981' }}>Auto</div><div className="ciis-op-stat-label">Attendance Calendar Sync</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>Clean</div><div className="ciis-op-stat-label">Payroll Inputs</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="ciis-op-cta-section">
          <div className="ciis-op-container">
            <div className="ciis-op-cta-box">
              <div className="ciis-badge ciis-badge-dark" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>LEAVE OPERATIONS</span>
              </div>
              <h2>Ready to remove manual leave tracking?</h2>
              <p>Use CIIS to manage leave approvals, holiday policies, balances, and payroll alignment from one place.</p>
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
