import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  ShieldCheck,
  Lock,
  Server,
  Database,
  KeyRound,
  EyeOff,
  Activity,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';

const SECURITY_PILLARS = [
  {
    icon: Lock,
    tag: 'ENCRYPTION',
    title: '256-Bit SSL & At-Rest Encryption',
    desc: 'All corporate telemetry, confidential KYC files, banking records, and telecaller logs are encrypted both in transit (TLS 1.3) and at rest (AES-256).',
    bullets: [
      'End-to-end data encryption across web and mobile',
      'Automated key rotation and hardened security headers',
      'Cryptographic salting for employee credentials'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: KeyRound,
    tag: 'ACCESS CONTROL',
    title: 'Granular Role-Based Access (RBAC)',
    desc: 'Super Admins can define strict page-level and action-level permissions for HR, Sales Managers, Telecallers, and Branch Supervisors.',
    bullets: [
      'Multi-branch permission isolation',
      'View, edit, or delete permission granularity',
      'Session timeout & multi-device login protection'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: Database,
    tag: 'REDUNDANCY',
    title: 'Daily Automated Cloud Snapshots',
    desc: 'Automated continuous cloud snapshots safeguard your business against accidental data deletion or hardware catastrophes.',
    bullets: [
      'Distributed multi-zone backup replication',
      'Instant disaster recovery point objectives (RPO < 1 hour)',
      'Immutable archival of attendance & payroll logs'
    ],
    accent: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)'
  },
  {
    icon: Activity,
    tag: 'TELEMETRY',
    title: 'Real-Time Threat Monitoring',
    desc: 'Intelligent security watchdogs detect suspicious login attempts, IP anomalies, and brute-force behaviors to neutralize threats instantly.',
    bullets: [
      '24/7 automated anomaly detection & IP geofencing',
      'Comprehensive Super Admin audit logs',
      'Instant alerts on unauthorized privilege escalation'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  }
];

const ARCH_STEPS = [
  {
    num: '01',
    title: 'In-Transit Shield',
    desc: 'Every packet exchanged between employee browsers, mobile apps, and our cloud cluster travels over high-grade encrypted tunnels.',
    color: '#10b981'
  },
  {
    num: '02',
    title: 'Identity & Access Gate',
    desc: 'JWT authentication, strict branch scoping, and encrypted token verification validate every single API transaction.',
    color: '#2563eb'
  },
  {
    num: '03',
    title: 'Isolated Storage Vault',
    desc: 'Company databases and KYC document vaults are logically isolated with restricted access keys and zero public internet exposure.',
    color: '#8b5cf6'
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

export default function SecurityPage() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        {/* HERO SECTION */}
        <section className="ciis-op-hero theme-security">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-op-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse" style={{ background: '#10b981' }}></span>
              <span>ENTERPRISE DATA PROTECTION</span>
            </div>
            <h1 className="ciis-op-title">
              Bank-Grade Cloud Infrastructure,{' '}
              <span className="ciis-gradient-emerald">Zero-Compromise Security</span>
            </h1>
            <p className="ciis-op-subtitle">
              CIIS Network is engineered with multi-layered defense mechanisms, end-to-end encryption,
              and isolated multi-tenant architecture to safeguard your enterprise workforce data.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Deploy Secure Workspace
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Request Security Whitepaper
              </Link>
            </div>

            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>256-Bit SSL/TLS Encryption</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>99.9% Uptime Guarantee</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Automated Daily Backups</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Role-Based Multi-Branch Scoping</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 CORE SECURITY PILLARS */}
        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <ShieldCheck size={14} />
                <span>SECURITY FOUNDATION</span>
              </div>
              <h2 className="ciis-section-title">Four Layers of Uncompromising Defense</h2>
              <p className="ciis-section-subtitle">
                How CIIS protects every employee interaction, payroll transaction, and customer telephone record.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {SECURITY_PILLARS.map((pillar, idx) => {
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
          title="Safeguard your organization's workforce records with enterprise cloud architecture."
        />

        {/* DEEP DIVE ARCHITECTURE */}
        <section className="ciis-op-deep-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Server size={14} />
                <span>DATA ARCHITECTURE</span>
              </div>
              <h2 className="ciis-section-title">End-to-End Secure Transaction Pipeline</h2>
              <p className="ciis-section-subtitle">
                From user authentication to database storage, every action passes through hardened security boundaries.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {ARCH_STEPS.map((step, sIdx) => (
                  <div key={sIdx} className="ciis-op-step-item">
                    <span className="ciis-op-step-num" style={{ background: `${step.color}15`, color: step.color }}>
                      Stage {step.num}
                    </span>
                    <h3 className="ciis-op-step-title">{step.title}</h3>
                    <p className="ciis-op-step-desc">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="ciis-op-stats-row">
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#10b981' }}>99.9%</div>
                  <div className="ciis-op-stat-label">Cloud Uptime SLA</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>256-Bit</div>
                  <div className="ciis-op-stat-label">SSL &amp; AES Encryption</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#8b5cf6' }}>&lt; 50ms</div>
                  <div className="ciis-op-stat-label">Edge Response Time</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>0</div>
                  <div className="ciis-op-stat-label">Reported Data Breaches</div>
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
                <span>CLOUD DEFENSE SUITE</span>
              </div>
              <h2>Ready to secure your business operations?</h2>
              <p>
                Join thousands of employees and growing enterprises operating on CIIS Network&apos;s hardened infrastructure.
              </p>
              <div className="ciis-op-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Start 30-Day Free Trial
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                  Contact Security Officer
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

