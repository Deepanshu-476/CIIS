import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  PhoneCall,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Flame,
  PhoneForwarded,
  Filter,
  Check
} from 'lucide-react';

const CRM_PILLARS = [
  {
    icon: PhoneForwarded,
    tag: 'LEAD ROUTING',
    title: 'Intelligent Lead Distribution',
    desc: 'Automatically distribute incoming leads to available agents via round-robin, priority assignment, or workload balancing.',
    bullets: [
      'Instant lead dispatching with zero wait time',
      'Bulk CSV/Excel lead import with automatic duplication filtering',
      'Branch and language-based routing rules'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  },
  {
    icon: PhoneCall,
    tag: 'CALL WORKSPACE',
    title: 'Single-Pane Calling Workspace',
    desc: 'Telecallers access a dedicated high-velocity workspace with single-click dialing, instant call outcome logging, and live customer history.',
    bullets: [
      'Quick disposition tagging (Interested, Not Answered, Callback, Closed)',
      'Rich notes and customer interaction history timeline',
      'Fast keyboard shortcuts and streamlined dial queue'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: Clock,
    tag: 'FOLLOW-UPS',
    title: 'Scheduled Call Reminders',
    desc: 'Never miss a hot opportunity. Set precise callback times with automated reminders pushing directly to telecallers before the scheduled time.',
    bullets: [
      'Visual timeline of pending and upcoming follow-ups',
      'Automated reassignment if an agent is unavailable or on leave',
      'Overdue follow-up alert escalation to team managers'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: BarChart3,
    tag: 'ANALYTICS',
    title: 'Live Agent Leaderboards & Telemetry',
    desc: 'Real-time insight into daily call volumes, talk time duration, conversion ratios, and top-performing sales representatives.',
    bullets: [
      'Daily, weekly, and monthly conversion funnels',
      'Manager audit mode: review call outcomes and agent productivity',
      'Automated daily performance reports sent to executive leadership'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  }
];

const CRM_STEPS = [
  {
    num: '01',
    title: 'Instant Lead Ingestion',
    desc: 'Leads arrive from web forms, Facebook Ads, or bulk CSV upload and are instantly assigned to active sales agents.',
    color: '#ea580c'
  },
  {
    num: '02',
    title: 'Rapid Dialing & Contextual Notes',
    desc: 'Agents work through prioritized queues, recording discussion points and setting targeted callback intervals.',
    color: '#2563eb'
  },
  {
    num: '03',
    title: 'Closed Deal & Client Onboarding',
    desc: 'Converted leads convert into client accounts with a single click, linking invoices, projects, and recurring deliverables.',
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

export default function CrmTelecaller() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        {/* HERO SECTION */}
        <section className="ciis-op-hero theme-crm">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-op-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse" style={{ background: '#ea580c' }}></span>
              <span>SALES &amp; TELECALLING ACCELERATION</span>
            </div>
            <h1 className="ciis-op-title">
              Supercharge Call Connect Rates,{' '}
              <span className="ciis-gradient-orange">Close Deals Faster</span>
            </h1>
            <p className="ciis-op-subtitle">
              Equip your sales and telecalling teams with automated lead routing, dedicated call workspaces,
              scheduled callback alerts, and real-time agent productivity telemetry.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Accelerate Sales Free
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Book a Live Telecaller Demo
              </Link>
            </div>

            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Automated Round-Robin Lead Distribution</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Single-Pane Calling Workspace</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Scheduled Call Reminders</span>
              </div>
              <div className="ciis-op-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Real-Time Conversion Leaderboards</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 CORE CRM PILLARS */}
        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <PhoneCall size={14} />
                <span>TELECALLING ENGINE</span>
              </div>
              <h2 className="ciis-section-title">Built for High-Velocity Dialing Teams</h2>
              <p className="ciis-section-subtitle">
                Turn cold contacts into warm discussions and closed contracts with less friction.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {CRM_PILLARS.map((pillar, idx) => {
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
          title="Scale your telecalling team's daily output with automated lead queues."
        />

        {/* WORKFLOW DEEP DIVE */}
        <section className="ciis-op-deep-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <TrendingUp size={14} />
                <span>SALES ACCELERATION PIPELINE</span>
              </div>
              <h2 className="ciis-section-title">How Deals Move Through CIIS CRM</h2>
              <p className="ciis-section-subtitle">
                A seamless flow from lead capture to scheduled callbacks and closed client contracts.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {CRM_STEPS.map((step, sIdx) => (
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
                  <div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>3.5x</div>
                  <div className="ciis-op-stat-label">Faster Lead Response Speed</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>+40%</div>
                  <div className="ciis-op-stat-label">Higher Daily Connect Rate</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#10b981' }}>0</div>
                  <div className="ciis-op-stat-label">Dropped Follow-Up Leads</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>100%</div>
                  <div className="ciis-op-stat-label">Real-Time Telemetry Visibility</div>
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
                <span>SALES VELOCITY</span>
              </div>
              <h2>Ready to scale your sales output?</h2>
              <p>
                Start your 30-day free trial and experience intelligent lead distribution, fast dialing, and real-time conversion telemetry.
              </p>
              <div className="ciis-op-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Start Free 30-Day Trial
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                  Talk to Sales Specialist
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

