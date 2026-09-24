import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  Zap,
  Cpu,
  Workflow,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Layers,
  Settings,
  BellRing,
  Activity,
  Bot
} from 'lucide-react';

const AUTO_PILLARS = [
  {
    icon: Zap,
    tag: 'EVENT TRIGGERS',
    title: 'Trigger-Based Workflow Engine',
    desc: 'Automate business logic with simple trigger-and-action rules. When an employee punches, a lead is captured, or a deadline nears—CIIS acts instantly.',
    bullets: [
      'Automatic late/absent notifications sent to managers',
      'Instant lead dispatching to on-duty telecallers',
      'Automated milestone status adjustments on task completion'
    ],
    accent: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.1)'
  },
  {
    icon: Workflow,
    tag: 'ROSTER AUTOMATION',
    title: 'Shift & Attendance Autopilot',
    desc: 'Eliminate manual punch monitoring. Rotational shifts, grace periods, sandwich rules, and public holiday leaves process hands-free.',
    bullets: [
      'Automated shift rotation by department and branch schedule',
      'Self-service leave requests with automated manager routing',
      'Automatic overtime hour aggregation into payroll'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: Cpu,
    tag: 'PIPELINE LOGIC',
    title: 'Automated CRM Queue Management',
    desc: 'Never let leads sit idle. The system automatically balances sales workloads, flags stagnant opportunities, and schedules callback reminders.',
    bullets: [
      'Round-robin and workload-based lead distribution',
      'Automated follow-up reminders pushed before scheduled call times',
      'Auto-escalation of untouched leads to senior executives'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  },
  {
    icon: Activity,
    tag: 'PAYROLL AUTOPILOT',
    title: '1-Click Payroll & Tax Automation',
    desc: 'Convert millions of attendance records into verified monthly salaries in seconds. Deductions, taxes, and payslips calculate automatically.',
    bullets: [
      'Automated 30-day fixed or dynamic working-day salary models',
      'Automatic deductions for unpaid leaves and half-days',
      'Bulk PDF payslip generation and automated dispatch'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  }
];

const AUTO_STEPS = [
  {
    num: '01',
    title: 'Event Detection & Capture',
    desc: 'A punch occurs, a new customer submits a lead, or a monthly cycle ends—the system detects the event with millisecond latency.',
    color: '#0284c7'
  },
  {
    num: '02',
    title: 'Rule Evaluation & Routing',
    desc: 'Automated rules evaluate branch location, role hierarchy, shift rosters, and priority tags to determine the exact action.',
    color: '#7c3aed'
  },
  {
    num: '03',
    title: 'Instant Execution & Notification',
    desc: 'Tasks are dispatched, alerts sent, payslips generated, and telemetry logged with zero human intervention required.',
    color: '#10b981'
  }
];

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

export default function BusinessAutomation() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        {/* HERO SECTION */}
        <section className="ciis-op-hero theme-automation">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-op-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse" style={{ background: '#0284c7' }}></span>
              <span>INTELLIGENT WORKFLOW ENGINE</span>
            </div>
            <h1 className="ciis-op-title">
              Put Your Daily Operations on{' '}
              <span className="ciis-gradient-cyan">Reliable Autopilot</span>
            </h1>
            <p className="ciis-op-subtitle">
              Eliminate repetitive manual bottlenecks. Automate shift schedules, lead distributions,
              task deadlines, and payroll computations with intelligent event-driven rules.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Automate Your Business Free
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Request an Automation Demo
              </Link>
            </div>

            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Zero-Lag Trigger &amp; Action Logic</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Automated Shift &amp; Leave Processing</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>1-Click Month-End Payroll Calculations</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Real-Time Anomaly Detection Alerts</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 CORE AUTOMATION PILLARS */}
        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Zap size={14} />
                <span>AUTOPILOT MODULES</span>
              </div>
              <h2 className="ciis-section-title">Engineered to Run Behind the Scenes</h2>
              <p className="ciis-section-subtitle">
                Automated operations keep your enterprise humming smoothly 24 hours a day, 7 days a week.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {AUTO_PILLARS.map((pillar, idx) => {
                const PIcon = pillar.icon;
                return (
                  <div key={idx} className="ciis-op-card">
                    <div className="ciis-op-card-icon-wrap" style={{ background: pillar.bg, color: pillar.accent }}>
                      <PIcon size={28} />
                    </div>
                    <span className="ciis-op-card-tag">{pillar.tag}</span>
                    <h3 className="ciis-op-card-title">{pillar.title}</h3>
                    <p className="ciis-op-card-desc">{pillar.desc}</p>

                    <div className="ciis-op-card-bullets">
                      {pillar.bullets.map((b, i) => (
                        <div key={i} className="ciis-op-bullet-item">
                          <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INTER-SECTION CTA BANNER */}
        <SectionCtaBanner
          badge="30-Day Risk-Free Trial"
          title="Save 15+ hours per week per manager with automated shift & payroll rules."
        />

        {/* WORKFLOW DEEP DIVE */}
        <section className="ciis-op-deep-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Cpu size={14} />
                <span>INTELLIGENT PIPELINE</span>
              </div>
              <h2 className="ciis-section-title">Sub-Second Execution Architecture</h2>
              <p className="ciis-section-subtitle">
                How our event bus processes company telemetry and executes background rules with zero latency.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {AUTO_STEPS.map((step, sIdx) => (
                  <div key={sIdx} className="ciis-op-step-item">
                    <span className="ciis-op-step-num" style={{ background: `${step.color}15`, color: step.color }}>
                      Step {step.num}
                    </span>
                    <h3 className="ciis-op-step-title">{step.title}</h3>
                    <p className="ciis-op-step-desc">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="ciis-op-stats-row">
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#0284c7' }}>85%</div>
                  <div className="ciis-op-stat-label">Reduction in Manual Admin Tasks</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>0</div>
                  <div className="ciis-op-stat-label">Spreadsheet Dependency</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#10b981' }}>100%</div>
                  <div className="ciis-op-stat-label">On-Time Execution SLA</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>&lt; 50ms</div>
                  <div className="ciis-op-stat-label">Event-to-Trigger Latency</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BOX */}
        <section className="ciis-op-cta-section">
          <div className="ciis-op-container">
            <div className="ciis-op-cta-box">
              <div className="ciis-badge ciis-badge-dark" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>INTELLIGENT SCALE</span>
              </div>
              <h2>Ready to put your business on autopilot?</h2>
              <p>
                Join forward-thinking companies saving hundreds of operational hours every month with CIIS Network.
              </p>
              <div className="ciis-op-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Start 30-Day Free Trial
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                  Consult an Automation Architect
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

