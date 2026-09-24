import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Fingerprint,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Wifi
} from 'lucide-react';

const ATTENDANCE_PILLARS = [
  {
    icon: MapPin,
    tag: 'GEOFENCED PUNCHES',
    title: 'Location-Verified Clock In & Clock Out',
    desc: 'Capture every punch with GPS coordinates, branch boundaries, and field-location context so attendance stays accurate across office and mobile teams.',
    bullets: [
      'Branch-wise geofence validation for office teams',
      'Field employee location stamps with travel context',
      'Late, early-exit, and absent detection in real time'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: Fingerprint,
    tag: 'BIOMETRIC READY',
    title: 'Identity-Safe Attendance Verification',
    desc: 'Reduce proxy attendance with secure employee identity checks, selfie evidence, and device-level validation before attendance is accepted.',
    bullets: [
      'Selfie and identity evidence for sensitive teams',
      'Device-aware punch records for audit trails',
      'Manager review flow for disputed attendance'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: Clock3,
    tag: 'SHIFT INTELLIGENCE',
    title: 'Shift, Late Mark & Overtime Automation',
    desc: 'Convert raw punches into meaningful working hours with shift rules, grace periods, half-days, overtime, and leave adjustments.',
    bullets: [
      'Automatic shift mapping and working-hour calculation',
      'Grace period, half-day, and overtime rule support',
      'Attendance data flows into leave and payroll'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: Radar,
    tag: 'LIVE PRESENCE',
    title: 'Real-Time Workforce Visibility',
    desc: 'Know who is present, late, absent, on leave, or in the field without waiting for end-of-day manual reconciliation.',
    bullets: [
      'Live attendance dashboard for managers',
      'Department, branch, and employee filters',
      'Instant alerts for missing punches and exceptions'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  }
];

const ATTENDANCE_STEPS = [
  {
    num: '01',
    title: 'Employee Punches In',
    desc: 'The employee marks attendance from web or mobile with location, time, and identity context.',
    color: '#2563eb'
  },
  {
    num: '02',
    title: 'CIIS Validates Rules',
    desc: 'Geofence, shift timing, late marks, half-day policy, and manager rules are applied instantly.',
    color: '#7c3aed'
  },
  {
    num: '03',
    title: 'Reports Stay Ready',
    desc: 'Verified logs become payroll-ready attendance reports with clean audit history.',
    color: '#10b981'
  }
];

export default function SmartAttendancePage() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        <section className="ciis-op-hero theme-employee">
          <div className="ciis-op-container">
            <div className="ciis-badge">
              <CalendarCheck size={14} />
              <span>SMART ATTENDANCE</span>
            </div>
            <h1 className="ciis-op-title">
              Geo-Fenced Punches, Shift Tracking &{' '}
              <span className="ciis-gradient-text">Live Presence Intelligence</span>
            </h1>
            <p className="ciis-op-subtitle">
              CIIS keeps attendance accurate with GPS-based punches, branch verification,
              shift rules, late marks, overtime tracking, and payroll-ready reports.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Start Attendance Trial
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Book Attendance Demo
              </Link>
            </div>
            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>GPS & Branch Verification</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Shift & Overtime Rules</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Payroll-Ready Reports</span></div>
            </div>
          </div>
        </section>

        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <ShieldCheck size={14} />
                <span>ATTENDANCE CONTROL</span>
              </div>
              <h2 className="ciis-section-title">Accurate Attendance Without Manual Follow-Up</h2>
              <p className="ciis-section-subtitle">
                Built for office staff, field employees, multi-branch teams, and payroll-linked workforce operations.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {ATTENDANCE_PILLARS.map((pillar) => {
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
                <Wifi size={14} />
                <span>REAL-TIME FLOW</span>
              </div>
              <h2 className="ciis-section-title">From Punch to Payroll-Ready Record</h2>
              <p className="ciis-section-subtitle">
                Every attendance event is validated, structured, and made available for managers and payroll.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {ATTENDANCE_STEPS.map((step) => (
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
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>Live</div><div className="ciis-op-stat-label">Presence Dashboard</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#10b981' }}>100%</div><div className="ciis-op-stat-label">Rule-Based Audit Trail</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>0</div><div className="ciis-op-stat-label">Manual Attendance Sheets</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>Instant</div><div className="ciis-op-stat-label">Late & Absent Alerts</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="ciis-op-cta-section">
          <div className="ciis-op-container">
            <div className="ciis-op-cta-box">
              <div className="ciis-badge ciis-badge-dark" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>ATTENDANCE AUTOMATION</span>
              </div>
              <h2>Ready to make attendance accurate and effortless?</h2>
              <p>Start with CIIS and connect verified attendance directly with leaves, payroll, and workforce reporting.</p>
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
