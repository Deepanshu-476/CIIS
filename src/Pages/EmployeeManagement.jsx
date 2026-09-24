import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  Users,
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  ShieldCheck,
  Award,
  Layers,
  FileCheck
} from 'lucide-react';

const WORKFORCE_PILLARS = [
  {
    icon: Clock,
    tag: 'ATTENDANCE TELEMETRY',
    title: 'Geofenced & IP-Verified Attendance',
    desc: 'Eliminate proxy attendance and time theft with strict network IP verification and mobile geofencing for office and field employees.',
    bullets: [
      'Single-tap Clock In & Clock Out with GPS stamps',
      'Real-time late, half-day, and absent auto-detection',
      'Live attendance dashboard with instant manager alerts'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: CalendarCheck,
    tag: 'SHIFT ROSTERING',
    title: 'Rotational Shifts & Roster Scheduling',
    desc: 'Effortlessly plan and assign day, evening, and night shifts across multiple teams, departments, and regional branches.',
    bullets: [
      'Multi-department weekly and monthly shift calendars',
      'Automated shift conflict detection and overtime tracking',
      'Instant shift notifications pushed directly to employee devices'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: FileCheck,
    tag: 'ONBOARDING & KYC',
    title: 'Digital Onboarding & Asset Vault',
    desc: 'Paperless employee registration with self-service KYC document uploads, Aadhaar/PAN verification, and corporate hardware asset tracking.',
    bullets: [
      'Self-registration links with automated approval queues',
      'Encrypted digital storage for KYC, resumes, and bank details',
      'Company asset assignment (laptops, SIMs, IDs) with return tracking'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: FileSpreadsheet,
    tag: 'PAYROLL INTEGRATION',
    title: '1-Click Attendance-Linked Payroll',
    desc: 'Zero manual spreadsheet calculations. Verified attendance records, approved leaves, and overtime hours feed directly into monthly salary processing.',
    bullets: [
      'Automated salary computation with fixed 30-day or working-day policies',
      'Custom deductions, PF/ESI allowances, and bonus calculations',
      'Instant official PDF payslip generation and employee self-download'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  }
];

const ONBOARDING_STEPS = [
  {
    num: '01',
    title: 'Digital Invite & Self-KYC',
    desc: 'HR shares an automated onboarding link. The recruit enters their credentials, bank account info, and uploads KYC proof.',
    color: '#2563eb'
  },
  {
    num: '02',
    title: 'Daily Shift & Presence Logging',
    desc: 'Staff clock in via office network or mobile app with real-time biometric and location telemetry sent to the command center.',
    color: '#7c3aed'
  },
  {
    num: '03',
    title: 'Automated 1-Click Salary Disbursement',
    desc: 'At month-end, working days, approved leaves, and overtime compute automatically into final payslips ready for payout.',
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

export default function EmployeeManagement() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        {/* HERO SECTION */}
        <section className="ciis-op-hero theme-employee">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-op-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse" style={{ background: '#2563eb' }}></span>
              <span>WORKFORCE &amp; OPERATIONS SUITE</span>
            </div>
            <h1 className="ciis-op-title">
              Complete Employee Lifecycle,{' '}
              <span className="ciis-gradient-text">Zero Administrative Friction</span>
            </h1>
            <p className="ciis-op-subtitle">
              From digital self-onboarding and biometric shift tracking to automated leave policies
              and 1-click payroll—CIIS unifies your entire workforce into one intelligent system.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Start Managing Staff Free
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Book a Live Guided Walkthrough
              </Link>
            </div>

            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Geofenced &amp; IP Biometric Punches</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Shift Rosters &amp; Holiday Calendars</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>1-Click Salary Calculation</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Free 30-Day Evaluation</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 PILLARS OF WORKFORCE MANAGEMENT */}
        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Users size={14} />
                <span>CORE CAPABILITIES</span>
              </div>
              <h2 className="ciis-section-title">Everything You Need to Manage Your People</h2>
              <p className="ciis-section-subtitle">
                Automate the repetitive operational tasks so your leadership team can focus on growth and strategy.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {WORKFORCE_PILLARS.map((pillar, idx) => {
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
          title="Empower your HR & Operations with automated shift rosters & instant payroll."
        />

        {/* WORKFLOW DEEP DIVE */}
        <section className="ciis-op-deep-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Layers size={14} />
                <span>SEAMLESS WORKFLOW</span>
              </div>
              <h2 className="ciis-section-title">From First Day to Monthly Payout</h2>
              <p className="ciis-section-subtitle">
                How our automated employee pipeline eliminates operational delays and manual errors.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {ONBOARDING_STEPS.map((step, sIdx) => (
                  <div key={sIdx} className="ciis-op-step-item">
                    <span className="ciis-op-step-num" style={{ background: `${step.color}15`, color: step.color }}>
                      Phase {step.num}
                    </span>
                    <h3 className="ciis-op-step-title">{step.title}</h3>
                    <p className="ciis-op-step-desc">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="ciis-op-stats-row">
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>70%</div>
                  <div className="ciis-op-stat-label">Reduction in HR Admin Time</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#10b981' }}>100%</div>
                  <div className="ciis-op-stat-label">Attendance-Payroll Accuracy</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>&lt; 2 Mins</div>
                  <div className="ciis-op-stat-label">Company Registration</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>0</div>
                  <div className="ciis-op-stat-label">Manual Spreadsheets Needed</div>
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
                <span>WORKFORCE SIMPLIFIED</span>
              </div>
              <h2>Ready to streamline your employee operations?</h2>
              <p>
                Set up your company in 2 minutes and experience automated shifts, live presence telemetry, and 1-click payroll.
              </p>
              <div className="ciis-op-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Start Free 30-Day Trial
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                  Schedule a Consultation
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

