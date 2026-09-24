import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './HowItWorks.css';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  Clock,
  PhoneCall,
  ShieldCheck,
  Database,
  Lock,
  Server,
  Activity,
  Play,
  Check,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

const JOURNEY_STEPS = [
  {
    step: '01',
    badge: 'Step 1 • Setup',
    title: 'Instant 2-Minute Organization Setup',
    subtitle: 'Register your company and structure branches, departments, and roles.',
    desc: 'Setting up your entire company infrastructure takes less than two minutes. Create branches, setup departments (HR, Sales, Tech, Accounts), and invite managers with designated permission tiers.',
    highlights: [
      'Enter basic company credentials and subdomain setup',
      'Create multi-branch locations (Mohali, Delhi, Bangalore, etc.)',
      'Define role hierarchies and reporting lines',
      'Send employee self-registration invites with automated KYC'
    ],
    icon: Building2,
    gradientClass: 'from-blue',
    accentColor: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.08)'
  },
  {
    step: '02',
    badge: 'Step 2 • Operations',
    title: 'Daily Workflow & Attendance Automation',
    subtitle: 'Track presence, shifts, working hours, and task progress seamlessly.',
    desc: 'Employees log in via web or mobile to clock in with network and IP verification. Shifts are automatically assigned, and tasks with deadlines are distributed across teams with real-time Kanban transparency.',
    highlights: [
      'Geofenced / IP-verified Clock In and Clock Out',
      'Live attendance dashboard with real-time absent/late flags',
      'Interactive Kanban boards with task assignment and subtasks',
      'Built-in team chat channels and announcement broadcasts'
    ],
    icon: Clock,
    gradientClass: 'from-purple',
    accentColor: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.08)'
  },
  {
    step: '03',
    badge: 'Step 3 • Pipeline',
    title: 'Sales & Telecaller Queue Acceleration',
    subtitle: 'Distribute incoming leads and track calling outcomes in real time.',
    desc: 'Import leads in bulk or via API. CIIS distributes calls to available telecallers with prioritized daily dial queues. Agents log notes, schedule automatic follow-up reminders, and advance deals through pipeline stages.',
    highlights: [
      'Smart lead distribution (round-robin, manual, or workload-based)',
      'Dedicated call workspace with single-click dialing and call logging',
      'Scheduled follow-ups and pending call reminders',
      'Live agent conversion leaderboards and performance metrics'
    ],
    icon: PhoneCall,
    gradientClass: 'from-orange',
    accentColor: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.08)'
  },
  {
    step: '04',
    badge: 'Step 4 • Governance',
    title: 'Super Admin Oversight & 1-Click Payroll',
    subtitle: 'Consolidate executive intelligence, audit trails, and automatic salaries.',
    desc: 'As month-end approaches, attendance records automatically calculate employee salaries, overtime bonuses, and deductions. Super Admins generate official PDF payslips and review comprehensive company health analytics.',
    highlights: [
      'Consolidated multi-branch overview from the Super Admin portal',
      '1-click salary processing with automated attendance linkage',
      'Direct employee payslip generation and download portal',
      'Full compliance audit trails and security session tracking'
    ],
    icon: ShieldCheck,
    gradientClass: 'from-green',
    accentColor: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.08)'
  }
];

const ARCH_CARDS = [
  {
    icon: Server,
    tag: 'HIGH AVAILABILITY',
    title: '99.9% Uptime SLA',
    desc: 'Distributed cloud redundancy across tier-4 data centers guarantees continuous, uninterrupted business operations.',
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: Lock,
    tag: 'ENCRYPTION',
    title: '256-Bit SSL & At-Rest',
    desc: 'All sensitive workforce records, KYC documents, banking credentials, and client calls are end-to-end encrypted.',
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: Database,
    tag: 'REDUNDANCY',
    title: 'Automated Daily Backups',
    desc: 'Continuous real-time replication and daily automated snapshots ensure zero data loss during unforeseen events.',
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: Activity,
    tag: 'TELEMETRY',
    title: 'Real-Time Threat Shield',
    desc: 'Sub-second anomaly detection, active session tracking, and automatic traffic failover keep your workspace secure.',
    accent: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)'
  }
];

const FAQS = [
  {
    q: 'How long does it take to implement CIIS Network in our company?',
    a: 'You can be up and running in less than 5 minutes. Company registration is instantaneous, and you can immediately invite employees or import existing staff records via CSV.'
  },
  {
    q: 'Can we import our existing employees, client accounts, and lead lists?',
    a: 'Yes! CIIS Network includes built-in bulk CSV and Excel import/export utilities for employees, leads, client lists, and asset inventories.'
  },
  {
    q: 'Does CIIS Network support multiple office branches and remote teams?',
    a: 'Absolutely. CIIS is architected natively for multi-branch organizations. You can isolate departments by branch location or view unified company-wide metrics from the Super Admin dashboard.'
  },
  {
    q: 'How does the attendance system link with monthly payroll?',
    a: 'CIIS synchronizes verified clock-in records, shift rosters, overtime hours, and approved leaves directly into the payroll calculation engine, eliminating manual spreadsheet calculations.'
  },
  {
    q: 'What security standards protect our confidential company data?',
    a: 'We implement 256-bit SSL encryption in transit and AES-256 at rest, strict Role-Based Access Controls (RBAC), multi-factor email OTP authentication, and automated daily cloud snapshots.'
  }
];

// 3 Product Tour Videos (Single Row Showcase)
const PORTAL_VIDEOS = [
  {
    id: 1,
    badge: 'Video 01',
    category: 'Command Center & Attendance',
    title: 'Live Shift Telemetry & Roster',
    desc: 'Employee biometrics, shift tracking, active roster status, and instant leave approvals.',
    duration: '1:45 Min',
    poster: '/dashboard-preview.jpg',
    videoSrc: '/ciis-portal-tour-1.mp4'
  },
  {
    id: 2,
    badge: 'Video 02',
    category: 'Workflows & Projects',
    title: 'Automated Task Pipelines',
    desc: 'Project milestones, task dispatches, real-time lead telemetry, and departmental output.',
    duration: '2:15 Min',
    poster: '/image.png',
    videoSrc: '/ciis-portal-tour-2.mp4'
  },
  {
    id: 3,
    badge: 'Video 03',
    category: 'Employee Mobile App',
    title: 'Mobile Companion Experience',
    desc: 'Geo-fenced punches, instant mobile task updates, push alerts, and direct team chat.',
    duration: '1:30 Min',
    poster: '/mobile-app-preview.png',
    videoSrc: '/ciis-portal-tour-3.mp4'
  }
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

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(0);
  const [activePlayingId, setActivePlayingId] = useState(null);
  const videoRefs = useRef({});

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handlePlayVideoCard = (id) => {
    setActivePlayingId(id);
    Object.keys(videoRefs.current).forEach((key) => {
      if (Number(key) !== id && videoRefs.current[key]) {
        videoRefs.current[key].pause();
      }
    });
    if (videoRefs.current[id]) {
      videoRefs.current[id].play().catch((err) => {
        console.log(`Video ${id} play handled:`, err);
      });
    }
  };

  return (
    <div className="ciis-hiw-page">
      <HomeHeader />

      <main className="ciis-hiw-main">
        {/* HERO SECTION */}
        <section className="ciis-hiw-hero">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-hiw-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse"></span>
              <span>SEAMLESS WORKFLOW ARCHITECTURE</span>
            </div>
            <h1 className="ciis-hiw-title">
              How CIIS Network Powers Your{' '}
              <span className="ciis-gradient-text">Daily Business Operations</span>
            </h1>
            <p className="ciis-hiw-subtitle">
              From initial company registration to automated shifts, telecalling pipelines, and 1-click
              payroll—discover the simple 4-step journey to operational excellence.
            </p>
            <div className="ciis-hiw-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Start 2-Minute Setup
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Book a Live Guided Walkthrough
              </Link>
            </div>

            {/* Quick Hero Trust Highlights */}
            <div className="ciis-hiw-hero-trust">
              <div className="ciis-hiw-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Instant Subdomain Setup</span>
              </div>
              <div className="ciis-hiw-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>No Credit Card Required</span>
              </div>
              <div className="ciis-hiw-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Free 30-Day Evaluation</span>
              </div>
              <div className="ciis-hiw-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>256-Bit SSL Bank-Grade Security</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4-STAGE JOURNEY SECTION */}
        <section className="ciis-hiw-journey-section">
          <div className="ciis-hiw-container">
            <div className="ciis-hiw-section-header">
              <div className="ciis-badge">
                <span className="ciis-badge-pulse"></span>
                <span>THE 4-STAGE JOURNEY</span>
              </div>
              <h2 className="ciis-section-title">From Setup to Autopilot Operations</h2>
              <p className="ciis-section-subtitle">
                A structured, battle-tested blueprint that transitions your business from chaos to clarity.
              </p>
            </div>

            <div className="ciis-hiw-timeline">
              {JOURNEY_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={idx}
                    className={`ciis-hiw-step-card ${step.gradientClass}`}
                    style={{ '--card-accent': step.accentColor }}
                  >
                    <div className="ciis-hiw-step-top">
                      <div className="ciis-hiw-step-badge-wrap">
                        <span className="ciis-hiw-step-badge" style={{ color: step.accentColor, background: step.bgColor }}>
                          {step.badge}
                        </span>
                        <span className="ciis-hiw-step-num-pill">{step.step}</span>
                      </div>
                      <div className="ciis-hiw-step-icon" style={{ color: step.accentColor, background: step.bgColor }}>
                        <StepIcon size={24} />
                      </div>
                    </div>

                    <div className="ciis-hiw-step-body">
                      <h3 className="ciis-hiw-step-title">{step.title}</h3>
                      <h4 className="ciis-hiw-step-subtitle" style={{ color: step.accentColor }}>
                        {step.subtitle}
                      </h4>
                      <p className="ciis-hiw-step-desc">{step.desc}</p>

                      <div className="ciis-hiw-step-points">
                        {step.highlights.map((h, i) => (
                          <div key={i} className="ciis-hiw-step-point">
                            <CheckCircle2 size={16} className="ciis-hiw-check" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INTER-SECTION CTA BANNER (After 2nd Major Section) */}
        <SectionCtaBanner
          badge="30-Day Risk-Free Trial"
          title="Ready to automate your shifts, attendance & payroll in minutes?"
        />

        {/* SECURITY & ARCHITECTURE HIGHLIGHTS */}
        <section className="ciis-hiw-arch-section">
          <div className="ciis-hiw-container">
            <div className="ciis-hiw-section-header">
              <div className="ciis-badge">
                <span className="ciis-badge-pulse"></span>
                <span>ENTERPRISE INFRASTRUCTURE</span>
              </div>
              <h2 className="ciis-section-title">Built on High-Availability Cloud Architecture</h2>
              <p className="ciis-section-subtitle">
                Engineered with high security, data encryption, and instant global access.
              </p>
            </div>

            <div className="ciis-hiw-arch-grid">
              {ARCH_CARDS.map((arch, aIdx) => {
                const ArchIcon = arch.icon;
                return (
                  <div key={aIdx} className="ciis-hiw-arch-card">
                    <div className="ciis-hiw-arch-icon-wrap" style={{ background: arch.bg, color: arch.accent }}>
                      <ArchIcon size={28} />
                    </div>
                    <span className="ciis-hiw-arch-tag">{arch.tag}</span>
                    <h4>{arch.title}</h4>
                    <p>{arch.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INTERACTIVE FAQ ACCORDION */}
        <section className="ciis-hiw-faq-section">
          <div className="ciis-hiw-container">
            <div className="ciis-hiw-section-header">
              <div className="ciis-badge">
                <HelpCircle size={14} />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </div>
              <h2 className="ciis-section-title">Everything You Need to Know</h2>
              <p className="ciis-section-subtitle">
                Clear answers to common questions about onboarding, migration, and daily workflows.
              </p>
            </div>

            <div className="ciis-hiw-faq-list">
              {FAQS.map((faq, fIndex) => {
                const isOpen = openFaq === fIndex;
                return (
                  <div key={fIndex} className={`ciis-hiw-faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="ciis-hiw-faq-question"
                      onClick={() => toggleFaq(fIndex)}
                      aria-expanded={isOpen}
                    >
                      <span className="ciis-hiw-faq-qtext">{faq.q}</span>
                      <span className="ciis-hiw-faq-icon-holder">
                        <ChevronDown size={18} className={`ciis-hiw-faq-arrow ${isOpen ? 'rotated' : ''}`} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="ciis-hiw-faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRODUCT VIDEO OVERVIEW (Runo-style Portal Tour) */}
        <section className="ciis-video-tour-section" id="video-tour">
          <div className="ciis-container">
            
            {/* Section Header */}
            <div className="ciis-section-header" style={{ textAlign: 'center', marginBottom: '38px' }}>
              <div className="ciis-badge" style={{ marginBottom: '14px' }}>
                <span className="ciis-badge-pulse"></span>
                <span>PORTAL VIDEO OVERVIEW</span>
              </div>
              <h2 className="ciis-section-title">
                Watch How CIIS Works: Quick Video Overview
              </h2>
              <p className="ciis-section-subtitle">
                See how modern enterprises manage employees, track live shifts, automate recurring workflows, and monitor operational telemetry from a single intuitive command center.
              </p>
            </div>

            {/* 3 Videos in One Line (Grid) */}
            <div className="ciis-video-grid-3">
              {PORTAL_VIDEOS.map((item) => {
                const isPlaying = activePlayingId === item.id;
                return (
                  <div key={item.id} className="ciis-video-card-item">
                    {/* Card Chrome Header */}
                    <div className="ciis-video-card-chrome">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px', fontWeight: 600 }}>{item.badge}</span>
                      </div>
                      <span className="ciis-badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#38bdf8', borderColor: 'transparent', fontSize: '10.5px', padding: '2px 7px' }}>
                        {item.duration}
                      </span>
                    </div>

                    {/* Video Stage with Poster and Play Button */}
                    <div className="ciis-video-card-stage">
                      <div 
                        className={`ciis-video-card-poster ${isPlaying ? 'ciis-video-hidden' : ''}`}
                        onClick={() => handlePlayVideoCard(item.id)}
                      >
                        <img
                          src={item.poster}
                          alt={item.title}
                          loading="lazy"
                        />
                        <div className="ciis-video-card-scrim"></div>

                        {/* Play Button */}
                        <button 
                          className="ciis-video-card-play-btn" 
                          aria-label={`Play ${item.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayVideoCard(item.id);
                          }}
                        >
                          <span className="ciis-card-play-pulse"></span>
                          <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: '3px' }} />
                        </button>

                        {/* Floating Category Pill */}
                        <div className="ciis-video-card-badge">
                          <Sparkles size={12} color="#38bdf8" />
                          <span>{item.category}</span>
                        </div>
                      </div>

                      {/* HTML5 Video Element */}
                      <video
                        ref={(el) => (videoRefs.current[item.id] = el)}
                        controls={isPlaying}
                        playsInline
                        preload="metadata"
                        className="ciis-video-card-media"
                        poster={item.poster}
                        onEnded={() => setActivePlayingId(null)}
                        onPause={() => {
                          if (videoRefs.current[item.id] && videoRefs.current[item.id].paused && videoRefs.current[item.id].currentTime === 0) {
                            setActivePlayingId(null);
                          }
                        }}
                      >
                        <source src={item.videoSrc} type="video/mp4" />
                        <source src="/ciis-portal-tour.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    {/* Info Section under Video */}
                    <div className="ciis-video-card-info">
                      <h3 className="ciis-video-card-title">{item.title}</h3>
                      <p className="ciis-video-card-desc">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Highlight Pills & CTA Buttons */}
            <div className="ciis-video-footer-bar">
              <div className="ciis-video-highlights">
                <span className="ciis-video-highlight-item">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Simultaneous Web &amp; Mobile Sync</span>
                </span>
                <span className="ciis-video-highlight-item">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Biometric &amp; Shift Telemetry</span>
                </span>
                <span className="ciis-video-highlight-item">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Automated Workflow Triggers</span>
                </span>
              </div>

              <div className="ciis-video-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Start Free Trial
                  <ArrowRight size={16} />
                </Link>
                <Link to="/features" className="ciis-btn ciis-btn-ghost">
                  Explore All Features
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
