import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  MessageSquare,
  Users,
  Megaphone,
  Radio,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Send,
  BellRing,
  Layers,
  FileText
} from 'lucide-react';

const COMM_PILLARS = [
  {
    icon: MessageSquare,
    tag: 'ORGANIZED CHANNELS',
    title: 'Department & Branch Channels',
    desc: 'Keep conversations organized with dedicated channels for HR, Sales, Tech, and regional branch operations.',
    bullets: [
      'Automatic channel membership based on department & role',
      'Threaded discussions for focused brainstorming',
      'Searchable message history with instant filter by date or author'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: Megaphone,
    tag: 'ANNOUNCEMENTS',
    title: 'Company-Wide Broadcast Bulletins',
    desc: 'Super Admins and HR leaders can publish official company announcements, policy updates, and holiday alerts instantly.',
    bullets: [
      'Priority pinned announcements with read-receipt tracking',
      'Push notification alerts sent to all employee mobile apps',
      'Formatted rich text with attached PDFs and guidelines'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: Users,
    tag: 'DIRECT CHAT',
    title: 'Secure 1-on-1 Direct Messaging',
    desc: 'Fast, encrypted internal messaging between colleagues without relying on unmonitored personal chat apps like WhatsApp.',
    bullets: [
      'Direct peer-to-peer real-time messaging with live typing indicator',
      'Online presence indicators and do-not-disturb status',
      'Secure internal environment with zero external access'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: BellRing,
    tag: 'TASK INTEGRATION',
    title: 'Context-Linked Task & Shift Pings',
    desc: 'Tag colleagues directly on specific Kanban tasks, shift changes, or client issues to keep work contextual and actionable.',
    bullets: [
      'Single-click jump from a task card into its dedicated discussion thread',
      'Automated bot alerts for approaching project deadlines',
      'Mobile push notifications for high-priority mentions'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  }
];

const COMM_STEPS = [
  {
    num: '01',
    title: 'Auto-Provisioned Groups',
    desc: 'As soon as an employee is onboarded, their branch, department, and role automatically place them into the right channels.',
    color: '#7c3aed'
  },
  {
    num: '02',
    title: 'Real-Time Sync Across Devices',
    desc: 'Employees chat seamlessly on desktop browser or native mobile apps with sub-50ms message synchronization.',
    color: '#2563eb'
  },
  {
    num: '03',
    title: 'Actionable Workflow Tie-ins',
    desc: 'Discussions turn into assigned tasks, shift reminders, and project deliverables with built-in accountability.',
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

export default function TeamCommunication() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        {/* HERO SECTION */}
        <section className="ciis-op-hero theme-communication">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-op-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse" style={{ background: '#7c3aed' }}></span>
              <span>ENTERPRISE COLLABORATION SUITE</span>
            </div>
            <h1 className="ciis-op-title">
              Connected Teams,{' '}
              <span className="ciis-gradient-purple">Synchronized Operations</span>
            </h1>
            <p className="ciis-op-subtitle">
              Eliminate disjointed communication. Bring your departments, branches, announcements,
              and task discussions together into one secure enterprise messaging hub.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Unify Your Team Free
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Explore Communication Features
              </Link>
            </div>

            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Department &amp; Branch Channels</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Official Broadcast Bulletins</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Zero WhatsApp Fragmentation</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Instant Mobile Push Notifications</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 CORE COMMUNICATION PILLARS */}
        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <MessageSquare size={14} />
                <span>COLLABORATION ARCHITECTURE</span>
              </div>
              <h2 className="ciis-section-title">Purpose-Built for Modern Distributed Teams</h2>
              <p className="ciis-section-subtitle">
                Keep conversations structured, searchable, and directly aligned with active corporate projects.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {COMM_PILLARS.map((pillar, idx) => {
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
          title="Consolidate your team's chats, announcements, and task updates in one secure place."
        />

        {/* WORKFLOW DEEP DIVE */}
        <section className="ciis-op-deep-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <Radio size={14} />
                <span>SYNCHRONIZATION PIPELINE</span>
              </div>
              <h2 className="ciis-section-title">Real-Time Connectivity Without Distractions</h2>
              <p className="ciis-section-subtitle">
                How CIIS Communication integrates cleanly with your daily attendance and project sprints.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {COMM_STEPS.map((step, sIdx) => (
                  <div key={sIdx} className="ciis-op-step-item">
                    <span className="ciis-op-step-num" style={{ background: `${step.color}15`, color: step.color }}>
                      Layer {step.num}
                    </span>
                    <h3 className="ciis-op-step-title">{step.title}</h3>
                    <p className="ciis-op-step-desc">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="ciis-op-stats-row">
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>&lt; 50ms</div>
                  <div className="ciis-op-stat-label">Real-Time WebSocket Sync</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>100%</div>
                  <div className="ciis-op-stat-label">In-House Data Ownership</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#10b981' }}>0</div>
                  <div className="ciis-op-stat-label">External Leaks or Exposure</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>Instant</div>
                  <div className="ciis-op-stat-label">Web &amp; Mobile Push Alerts</div>
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
                <span>MODERN WORKPLACE</span>
              </div>
              <h2>Ready to unify your company communication?</h2>
              <p>
                Get your team started in 2 minutes. Replace scattered chat tools with an integrated corporate messaging workspace.
              </p>
              <div className="ciis-op-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Start Free 30-Day Trial
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                  Talk to a Product Specialist
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

