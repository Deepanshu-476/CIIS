import React, { useState, useEffect, useRef } from 'react';
import './CIISLandingPage.css';
import BookDemoModal from '../components/landing/BookDemoModal';
import {
  Users,
  Clock,
  CheckSquare,
  Phone,
  UsersRound,
  Briefcase,
  ShieldCheck,
  Bot,
  ArrowRight,
  Check,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
  Building2,
  Bell,
  Send,
  MessageSquare,
  Search,
  Menu,
  X,
  Lock,
  Layers,
  Zap,
  TrendingUp,
  UserCheck,
  Sliders,
  CheckCircle2,
  FileText,
  AlertCircle,
  MapPin,
  Award,
  Play,
  Smartphone
} from 'lucide-react';

// 4 Implementation Steps
const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Set Up Your Organization',
    desc: 'Configure your company profile, create departments, define designations, branches, and customized permission structures.'
  },
  {
    step: '02',
    title: 'Add Your Team',
    desc: 'Invite team members, assign designated roles, configure shift timings, and allocate department supervisors in minutes.'
  },
  {
    step: '03',
    title: 'Manage Your Operations',
    desc: 'Run daily clock-ins, orchestrate tasks, nurture sales leads, monitor ongoing client projects, and coordinate communication.'
  },
  {
    step: '04',
    title: 'Track & Grow',
    desc: 'Analyze executive performance reports, identify productivity trends, optimize resource planning, and scale operations.'
  }
];

// Mock Employee Table Data
const MOCK_EMPLOYEES = [
  { id: 'emp-1', name: 'Sophia Chen', role: 'Product Lead', dept: 'Engineering', status: 'Active', shift: '09:00 - 18:00', prog: 88, att: 'Present' },
  { id: 'emp-2', name: 'Marcus Vance', role: 'Sr. Consultant', dept: 'Operations', status: 'Active', shift: '09:00 - 18:00', prog: 94, att: 'Present' },
  { id: 'emp-3', name: 'Elena Rostova', role: 'Account Exec', dept: 'CRM & Sales', status: 'On Call', shift: '10:00 - 19:00', prog: 72, att: 'Present' },
  { id: 'emp-4', name: 'David Kim', role: 'Support Lead', dept: 'Client Care', status: 'Active', shift: '08:00 - 17:00', prog: 80, att: 'Present' },
  { id: 'emp-5', name: 'Priya Sharma', role: 'UI Architect', dept: 'Design', status: 'In Review', shift: '09:00 - 18:00', prog: 96, att: 'Present' }
];

// Operational Channels Dataset
const COMM_CHANNELS = [
  { id: 'general', name: '# general-announcements', count: '248 Online' },
  { id: 'crm', name: '# crm-leads-stream', count: '18 Online' },
  { id: 'operations', name: '# operations-shifts', count: '52 Online' },
  { id: 'sla', name: '# client-equinox-sla', count: '9 Online' }
];

const COMM_MESSAGES = {
  general: [
    {
      avatar: 'SC',
      avatarBg: '#dbeafe',
      avatarColor: '#1e40af',
      name: 'Sophia Chen',
      time: '09:14 AM',
      text: 'Good morning team! The new branch rosters for next month have been published to all employee portals. Please check your assigned shift blocks.',
      alert: false
    },
    {
      avatar: 'ER',
      avatarBg: '#fef3c7',
      avatarColor: '#92400e',
      name: 'Elena Rostova',
      time: '09:22 AM',
      text: '🎉 Just converted Orion Logistics on the enterprise plan! All client documents and project milestones are now auto-provisioned in CIIS.',
      alert: true
    },
    {
      avatar: 'MV',
      avatarBg: '#e0e7ff',
      avatarColor: '#3730a3',
      name: 'Marcus Vance',
      time: '09:31 AM',
      text: 'Outstanding work Elena! The engineering board has already synchronized their onboarding tasks.',
      alert: false
    }
  ],
  crm: [
    {
      avatar: 'DL',
      avatarBg: '#fce7f3',
      avatarColor: '#9d174d',
      name: 'David Lee',
      time: '10:05 AM',
      text: 'Apex Global Logistics scheduled an executive demo call for 2:00 PM today. Deal size set at $42,000.',
      alert: false
    },
    {
      avatar: 'ER',
      avatarBg: '#fef3c7',
      avatarColor: '#92400e',
      name: 'Elena Rostova',
      time: '10:14 AM',
      text: 'Proposal and SLA templates generated automatically by CIIS CRM. Ready to send upon conclusion.',
      alert: true
    }
  ],
  operations: [
    {
      avatar: 'SC',
      avatarBg: '#dbeafe',
      avatarColor: '#1e40af',
      name: 'Sophia Chen',
      time: '08:50 AM',
      text: 'Morning biometric geo-attendance completed: 236 employees verified across North & South branches.',
      alert: false
    },
    {
      avatar: 'AK',
      avatarBg: '#ccfbf1',
      avatarColor: '#115e59',
      name: 'Aiden Kumar',
      time: '09:05 AM',
      text: 'Shift adjustment request between Floor 2 & 4 has been auto-balanced by policy engine #18.',
      alert: false
    }
  ],
  sla: [
    {
      avatar: 'MV',
      avatarBg: '#e0e7ff',
      avatarColor: '#3730a3',
      name: 'Marcus Vance',
      time: '11:15 AM',
      text: 'Enterprise SLA latency maintained at 99.98% across all cloud nodes. Zero downtime recorded.',
      alert: false
    }
  ]
};

// ============================================================================
// CLIENT / PARTNER COMPANIES (Animated Infinite Marquee)
// Easily customize this array: you can specify `logo` with an image path
// (e.g. '/logos/mybrand.png' in the public folder) or use the built-in SVG brand identities.
// ============================================================================
const CLIENT_COMPANIES = [
  {
    name: 'Shiprocket',
    logo: '',
    category: 'Logistics Tech',
    color: '#7c3aed',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M5 3L19 12L5 21V3Z" fill="#7c3aed" />
        <path d="M8 8L15 12L8 16V8Z" fill="#38bdf8" />
      </svg>
    )
  },
  {
    name: 'WWF',
    logo: '',
    category: 'Global Alliance',
    color: '#111827',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm5-6c-.83 0-1.5-.67-1.5-1.5S15.17 8 16 8s1.5.67 1.5 1.5S16.83 11 16 11zm-10 0c-.83 0-1.5-.67-1.5-1.5S5.17 8 6 8s1.5.67 1.5 1.5S6.83 11 6 11z"/>
      </svg>
    )
  },
  {
    name: 'bond bazaar',
    logo: '',
    category: 'Fintech Capital',
    color: '#ea580c',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4v16M4 12h16" />
      </svg>
    )
  },
  {
    name: 'Confidence',
    logo: '',
    category: 'Petroleum & Gas',
    color: '#0284c7',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0284c7" />
      </svg>
    )
  },
  {
    name: 'Futurense',
    logo: '',
    category: 'Talent Cloud',
    color: '#1e293b',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="6" cy="11" r="2" fill="#2563eb" />
        <circle cx="18" cy="11" r="2" fill="#2563eb" />
      </svg>
    )
  },
  {
    name: 'dīgit',
    logo: '',
    category: 'General Insurance',
    color: '#0f172a',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#0f172a" strokeWidth="2.5" />
        <path d="M12 7v10M9 9l3-2 3 2" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    name: 'Kotak Securities',
    logo: '',
    category: 'Equity & Banking',
    color: '#dc2626',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#dc2626" />
        <path d="M8 12h8M12 8v8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    name: 'Vedantu',
    logo: '',
    category: 'EdTech Network',
    color: '#ea580c',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 6L12 20L20 6" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="3" fill="#ea580c" />
      </svg>
    )
  },
  {
    name: 'shadowfax',
    logo: '',
    category: 'Hyperlocal Logistics',
    color: '#0d9488',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    name: 'petpooja',
    logo: '',
    category: 'POS & Food Service',
    color: '#e11d48',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#ffe4e6" />
        <path d="M8 9v6M16 9v6M12 8v8" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    name: 'Newton School',
    logo: '',
    category: 'Tech Academy',
    color: '#4f46e5',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    name: 'Mswipe',
    logo: '',
    category: 'Merchant Terminals',
    color: '#0284c7',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    )
  },
  {
    name: 'Toyota Financial',
    logo: '',
    category: 'Auto Finance',
    color: '#b91c1c',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
        <ellipse cx="12" cy="12" rx="9" ry="6" />
        <ellipse cx="12" cy="12" rx="4" ry="6" />
      </svg>
    )
  },
  {
    name: 'Reliance Nippon',
    logo: '',
    category: 'Asset Management',
    color: '#1d4ed8',
    svgIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#1d4ed8" />
        <path d="M8 12l3 3 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
];

// ============================================================================
// 6 CAPABILITY TABS FOR "WHAT MAKES CIIS THE MOST TRUSTED FOR 3100+ BUSINESSES"
// ============================================================================
const TRUSTED_FEATURES = [
  {
    id: 'precision',
    tabLabel: '99.8% Punch Precision',
    badge: 'GEO & BIOMETRIC ACCURACY',
    title: 'Real Coordinates. Zero Buddy Punching. Absolute Attendance Truth.',
    desc: 'Unlike generic clock-in apps that can be spoofed with fake GPS or photo proxies, CIIS Network pairs device-level biometric authentication with multi-point geofencing and Wi-Fi BSSID verification. Attendance records are tamper-proof and instant.',
    bullets: [
      'Sub-5 meter precision geofencing with anti-mock GPS detection',
      'Dual selfie + face liveness matching in under 400 milliseconds',
      'Instant offline punch-caching with cryptographic timestamping'
    ],
    metric: '99.8% Verified Accuracy',
    metricSub: 'Eliminated attendance disputes across 185k+ active workers',
    visualType: 'attendance'
  },
  {
    id: 'payroll',
    tabLabel: 'Zero-Leak Payroll',
    badge: 'AUTOMATED COMPLIANCE ENGINE',
    title: 'One-Click Disbursal. Zero Calculation Headaches.',
    desc: 'Stop spending days cross-referencing biometric punch logs with complex shift multipliers. CIIS automatically calculates exact payable hours, overtime slabs, deductions, and statutory contributions, producing audit-ready payslips in seconds.',
    bullets: [
      'Automatic calculation of late marks, half-days, and grace periods',
      'Seamless compliance rollups for PF, ESIC, Professional Tax & TDS',
      'Direct NEFT/RTGS bank disbursal batch files generated with 1 click'
    ],
    metric: '38+ Hours Saved',
    metricSub: 'Per HR desk each payroll cycle with automated wage ledger',
    visualType: 'payroll'
  },
  {
    id: 'field',
    tabLabel: 'Live Field Telemetry',
    badge: 'REAL-TIME WORKFORCE RADAR',
    title: 'Complete Field Transparency Without Micromanagement.',
    desc: 'Gain real-time operational visibility into your sales executives and field service teams. Track travel routes, client meeting check-ins, and battery telemetry as they happen—empowering managers to guide teams proactively.',
    bullets: [
      'Live timeline breadcrumbs with low-battery and GPS-off detection',
      'Geotagged client meeting check-ins with client signature capture',
      'Automated travel distance calculations for fair fuel reimbursements'
    ],
    metric: '2.4× More Field Visits',
    metricSub: 'Achieved by optimizing daily executive travel paths',
    visualType: 'field'
  },
  {
    id: 'workflows',
    tabLabel: 'Smart Task Routing',
    badge: 'EVENT-DRIVEN AUTOMATION',
    title: 'Keep Pipelines Moving. Never Drop a Critical Task.',
    desc: 'Eliminate forgotten assignments and operational delays. CIIS intelligent lifecycle engine detects priority shifts, assigns tasks based on real-time team bandwidth, and sends progressive escalations if SLAs are in jeopardy.',
    bullets: [
      'Automated template cloning for daily, weekly, or monthly routines',
      'Dynamic workload balancing based on active task counts per rep',
      'Multi-tier SLA breach warnings sent directly via SMS, Email & App'
    ],
    metric: '94% SLA Adherence',
    metricSub: 'Across 4.2M+ enterprise operations completed on schedule',
    visualType: 'tasks'
  },
  {
    id: 'compliance',
    tabLabel: '100% Stat Compliance',
    badge: 'LEGAL & REGULATORY VAULT',
    title: 'Audit-Proof from Day One. Zero Regulatory Penalties.',
    desc: 'Labor law compliance shouldn’t keep business owners awake. CIIS maintains continuous statutory registers, generating compliant Form 16s, PF ECR files, and ESIC contribution reports ready for labor inspectors and chartered accountants.',
    bullets: [
      'Auto-generated Form D, Form 12, and statutory muster registers',
      'Real-time compliance alerts before statutory filing deadlines',
      'Comprehensive immutable audit trails for every punch and salary edit'
    ],
    metric: '100% Audit Ready',
    metricSub: 'Validated against national labor & statutory enterprise codes',
    visualType: 'compliance'
  },
  {
    id: 'rapid-setup',
    tabLabel: '30-Min Rapid Rollout',
    badge: 'ZERO-IT COMPLEXITY',
    title: 'Up and Running in 30 Minutes. No Costly Hardware.',
    desc: 'Forget tedious multi-month ERP implementations. Import your employee directory via CSV or spreadsheet, configure your branches with a map pin, and invite your team. Works seamlessly on existing Android and iOS smartphones.',
    bullets: [
      'Zero expensive hardware or proprietary biometric machines required',
      'Instant bulk employee directory import via Excel or HRIS sync',
      'Self-service employee mobile app with 98% adoption within 48 hours'
    ],
    metric: '< 30 Min Onboarding',
    metricSub: 'From signup to full multi-branch organizational deployment',
    visualType: 'onboarding'
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
    <div className="ciis-section-cta-divider ciis-reveal">
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
            <a href="/RegisterCompany" className="ciis-btn ciis-btn-trial">
              <span>Start Free Trial in 30 Days</span>
              <ArrowRight size={17} className="ciis-trial-arrow" />
            </a>
            <div className="ciis-cta-banner-meta">
              <span><Check size={13} /> No credit card required</span>
              <span><Check size={13} /> Instant activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CIISLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activeChannel, setActiveChannel] = useState('general');

  // Interactive Live Animation State
  const [activeTrustedTab, setActiveTrustedTab] = useState(0);
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });
  const [livePunchCount, setLivePunchCount] = useState(236);
  const [lastEventMsg, setLastEventMsg] = useState('Biometric punch synced: Marcus Vance (09:02 AM)');

  // Stats Counter State
  const [statsCounted, setStatsCounted] = useState(false);
  const [statBiz, setStatBiz] = useState(0);
  const [statEmp, setStatEmp] = useState(0);
  const [statTasks, setStatTasks] = useState(0);
  const [statRel, setStatRel] = useState(0);

  const statsRef = useRef(null);

  // 3-Video Showcase State (Independent play for each card)
  const [activePlayingId, setActivePlayingId] = useState(null);
  const videoRefs = useRef({});

  const handlePlayVideoCard = (id) => {
    setActivePlayingId(id);
    // Pause other videos if running
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

  const handleOpenDemoModal = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setDemoModalOpen(true);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Live simulation ticker for realism
  useEffect(() => {
    const liveTimer = setInterval(() => {
      setLivePunchCount((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const nextVal = prev + delta;
        return nextVal > 248 ? 245 : nextVal < 230 ? 234 : nextVal;
      });
      const events = [
        'Shift Auto-Assigned: Roster #24 (Engineering)',
        'CRM Deal Converted: Apex Global Logistics ($42,000)',
        'Biometric punch synced: Sophia Chen (09:14 AM)',
        'Daily Task Dispatched: Sprint Backlog Review',
        'Overtime Approved: +1.5 hrs policy checked'
      ];
      setLastEventMsg(events[Math.floor(Math.random() * events.length)]);
    }, 4500);
    return () => clearInterval(liveTimer);
  }, []);

  // 3D Card Tilt Handler for Hero Mockup
  const handleHeroMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.01)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleHeroMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.5s ease-out'
    });
  };

  // Scroll listener for sticky navbar blur & shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll reveal animations & stat counter trigger
  useEffect(() => {
    const revealElements = document.querySelectorAll(
      '.ciis-reveal, .ciis-reveal-left, .ciis-reveal-right, .ciis-reveal-zoom'
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));

    // Stats counter trigger
    const currentStats = statsRef.current;
    let statsObserver;
    if (currentStats) {
      statsObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !statsCounted) {
            setStatsCounted(true);
          }
        },
        { threshold: 0.3 }
      );
      statsObserver.observe(currentStats);
    }

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      if (statsObserver && currentStats) {
        statsObserver.unobserve(currentStats);
      }
    };
  }, [statsCounted]);

  // Smooth count-up effect
  useEffect(() => {
    if (!statsCounted) return;

    let start = 0;
    const duration = 1800; // ms
    const startTime = performance.now();

    const animateCounters = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setStatBiz(Math.floor(easeProgress * 500));
      setStatEmp(Math.floor(easeProgress * 10));
      setStatTasks(Math.floor(easeProgress * 50));
      setStatRel((easeProgress * 99.9).toFixed(1));

      if (progress < 1) {
        requestAnimationFrame(animateCounters);
      }
    };

    requestAnimationFrame(animateCounters);
  }, [statsCounted]);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const elem = document.getElementById(targetId);
    if (elem) {
      const yOffset = -80;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="ciis-root" id="top">
      {/* ==================== NAVBAR ==================== */}
      <header className={`ciis-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="ciis-container">
          <div className="ciis-nav-inner">
            <a href="/" className="ciis-logo">
              <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo" />
            </a>

            <nav>
              <ul className="ciis-nav-links">
                <li>
                  <a href="/" className="ciis-nav-link">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/features" className="ciis-nav-link">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/solutions" className="ciis-nav-link">
                    Solutions
                  </a>
                </li>
                <li>
                  <a href="/how-it-works" className="ciis-nav-link">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/contact" className="ciis-nav-link">
                    Contact
                  </a>
                </li>
              </ul>
            </nav>

            <div className="ciis-nav-actions">
              <a href="/login" className="ciis-btn ciis-btn-secondary">
                Login
              </a>
              <a href="#book-demo" className="ciis-btn ciis-header-demo-btn" onClick={handleOpenDemoModal}>
                Request A Demo
              </a>
              <div className="ciis-header-app-icons">
                <a 
                  href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ciis-header-app-circle"
                  aria-label="Download on the App Store"
                  title="Download on Apple App Store"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                  </svg>
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ciis-header-app-circle"
                  aria-label="Get it on Google Play"
                  title="Get it on Google Play"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: '2px' }}>
                    <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                    <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                    <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                    <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                  </svg>
                </a>
              </div>
              <button
                className="ciis-mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`ciis-mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        <div className={`ciis-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="ciis-mob-header">
            <div className="ciis-logo">
              <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo" />
            </div>
            <button
              className="ciis-mob-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="ciis-mob-nav-list">
            <a href="/" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="ciis-mob-link-content">
                <div className="ciis-mob-link-icon"><Sparkles size={16} /></div>
                <span>Home</span>
              </div>
              <ChevronRight size={16} />
            </a>
            <a href="/features" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="ciis-mob-link-content">
                <div className="ciis-mob-link-icon"><Layers size={16} /></div>
                <span>Features</span>
              </div>
              <ChevronRight size={16} />
            </a>
            <a href="/solutions" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="ciis-mob-link-content">
                <div className="ciis-mob-link-icon"><BarChart3 size={16} /></div>
                <span>Solutions</span>
              </div>
              <ChevronRight size={16} />
            </a>
            <a href="/how-it-works" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="ciis-mob-link-content">
                <div className="ciis-mob-link-icon"><Zap size={16} /></div>
                <span>How It Works</span>
              </div>
              <ChevronRight size={16} />
            </a>
            <a href="/contact" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="ciis-mob-link-content">
                <div className="ciis-mob-link-icon"><Phone size={16} /></div>
                <span>Contact</span>
              </div>
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="ciis-mob-actions">
            <a href="#book-demo" className="ciis-btn ciis-header-demo-btn" onClick={handleOpenDemoModal}>
              Request A Demo
            </a>
            <a href="/login" className="ciis-btn ciis-btn-secondary" onClick={() => setMobileMenuOpen(false)}>
              Login
            </a>
            <div className="ciis-mob-app-icons-row">
              <span className="ciis-mob-app-label">Download CIIS App:</span>
              <div className="ciis-header-app-icons" style={{ display: 'inline-flex' }}>
                <a 
                  href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ciis-header-app-circle"
                  aria-label="Download on the App Store"
                  title="Download on Apple App Store"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                  </svg>
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ciis-header-app-circle"
                  aria-label="Get it on Google Play"
                  title="Get it on Google Play"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: '2px' }}>
                    <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                    <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                    <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                    <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="ciis-mob-footer-status">
            <span className="ciis-live-pill-dot"></span>
            <span>Cloud Network Operational (99.9% Uptime)</span>
          </div>
        </div>
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="ciis-hero" id="hero">
        {/* Animated Background Glowing Orbs */}
        <div className="ciis-hero-orb ciis-hero-orb-1" aria-hidden="true"></div>
        <div className="ciis-hero-orb ciis-hero-orb-2" aria-hidden="true"></div>
        <div className="ciis-hero-orb ciis-hero-orb-3" aria-hidden="true"></div>

        <div className="ciis-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="ciis-hero-grid">
            {/* Left Content */}
            <div className="ciis-hero-content ciis-reveal">
              <div className="ciis-hero-badges-row">
                <div className="ciis-badge">
                  <span className="ciis-badge-pulse"></span>
                  ALL-IN-ONE BUSINESS MANAGEMENT PLATFORM
                </div>
                <div className="ciis-live-pill">
                  <span className="ciis-live-pill-dot"></span>
                  <span>LIVE CLOUD SUITE</span>
                </div>
                <div className="ciis-hero-mob-pill">
                  <Smartphone size={13} />
                  <span>IOS &amp; ANDROID APP</span>
                </div>
              </div>

              <h1 className="ciis-hero-title">
                One Platform to Manage Your <span className="ciis-animated-gradient-text">Entire Business</span>
              </h1>

              <p className="ciis-hero-desc">
                CIIS Network brings your employees, attendance, tasks, CRM, clients, projects, communication and business operations together in one intelligent platform — available on Web, iOS &amp; Android.
              </p>

              <div className="ciis-hero-actions">
                <a href="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Register Company
                  <ArrowRight size={17} />
                </a>
                <a href="#features" className="ciis-btn ciis-btn-secondary" onClick={(e) => handleNavClick(e, 'features')}>
                  Explore Features
                </a>
              </div>

              {/* Mobile App Download & Live Sync Row */}
              <div className="ciis-hero-app-row">
                <div className="ciis-hero-app-label">
                  <Smartphone size={15} style={{ color: '#2563eb' }} />
                  <span>Download Mobile App:</span>
                </div>
                <div className="ciis-hero-app-links">
                  <a 
                    href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ciis-hero-store-pill"
                    title="Download CIIS Network on Apple App Store"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                    </svg>
                    <span>App Store</span>
                  </a>
                  <a 
                    href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ciis-hero-store-pill"
                    title="Get CIIS Network on Google Play"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24">
                      <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                      <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                      <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                      <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                    </svg>
                    <span>Google Play</span>
                  </a>
                </div>
                <span className="ciis-hero-app-sync-note">
                  <span className="ciis-live-pill-dot" style={{ background: '#10b981' }}></span>
                  Live Biometric &amp; GPS Punch
                </span>
              </div>

              {/* Real-Time Live Activity Event Bar */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: '#334155',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
              }}>
                <span className="ciis-live-pill-dot" style={{ background: '#2563eb', boxShadow: '0 0 6px #2563eb' }}></span>
                <span style={{ fontWeight: '700', color: '#1d4ed8' }}>Live Engine:</span>
                <span style={{ transition: 'all 0.3s ease' }}>{lastEventMsg}</span>
              </div>
            </div>

            {/* Right Side: Animated Dashboard Mockup with 3D Tilt & Bottom Trust Strip */}
            <div className="ciis-hero-right-col">
              <div
                className="ciis-hero-visual ciis-reveal"
                onMouseMove={handleHeroMouseMove}
                onMouseLeave={handleHeroMouseLeave}
              >
              {/* Floating Mini Cards */}
              <div className="ciis-float-card ciis-float-card-1">
                <div className="ciis-float-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <TrendingUp size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Operations</div>
                  <div>Task Completed +24%</div>
                </div>
              </div>

              <div className="ciis-float-card ciis-float-card-2">
                <div className="ciis-float-icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Live Rollup</div>
                  <div>98% Attendance</div>
                </div>
              </div>

              {/* Main Dashboard Window with interactive 3D Tilt */}
              <div className="ciis-dashboard-mockup ciis-shine-card" style={tiltStyle}>
                <div className="ciis-mockup-header">
                  <div className="ciis-mockup-dots">
                    <span style={{ background: '#f87171' }}></span>
                    <span style={{ background: '#fbbf24' }}></span>
                    <span style={{ background: '#34d399' }}></span>
                  </div>
                  <div className="ciis-mockup-search">
                    <Search size={12} />
                    <span>Search employees, tasks, leads...</span>
                  </div>
                  <div className="ciis-mockup-user">
                    <span>HQ Admin</span>
                    <div className="ciis-mockup-avatar">CN</div>
                  </div>
                </div>

                <div className="ciis-mockup-body">
                  {/* Top Stats */}
                  <div className="ciis-mockup-stats">
                    <div className="ciis-mstat-card">
                      <span className="ciis-mstat-label">Total Staff</span>
                      <span className="ciis-mstat-val">248</span>
                      <span className="ciis-mstat-sub">Present: {livePunchCount}</span>
                    </div>
                    <div className="ciis-mstat-card">
                      <span className="ciis-mstat-label">Pending</span>
                      <span className="ciis-mstat-val">{248 - livePunchCount}</span>
                      <span className="ciis-mstat-sub" style={{ color: '#f59e0b' }}>Absent / Late</span>
                    </div>
                    <div className="ciis-mstat-card">
                      <span className="ciis-mstat-label">Active Tasks</span>
                      <span className="ciis-mstat-val">19</span>
                      <span className="ciis-mstat-sub">94% On-Track</span>
                    </div>
                    <div className="ciis-mstat-card">
                      <span className="ciis-mstat-label">Clients</span>
                      <span className="ciis-mstat-val">84</span>
                      <span className="ciis-mstat-sub">+6 this week</span>
                    </div>
                  </div>

                  {/* Graph & Activity */}
                  <div className="ciis-mockup-main">
                    <div className="ciis-mockup-chart-card">
                      <div className="ciis-mchart-header">
                        <span>Attendance &amp; Throughput</span>
                        <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: '600' }}>Live Week</span>
                      </div>
                      <svg className="ciis-mockup-chart-svg" viewBox="0 0 240 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,60 Q40,30 80,45 T160,20 T240,15 L240,80 L0,80 Z"
                          fill="url(#heroGradient)"
                        />
                        <path
                          className="ciis-animated-path"
                          d="M0,60 Q40,30 80,45 T160,20 T240,15"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                        />
                        <circle cx="80" cy="45" r="3.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                        <circle cx="160" cy="20" r="3.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                        <circle cx="240" cy="15" r="3.5" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Today</span>
                      </div>
                    </div>

                    <div className="ciis-mockup-tasks-card">
                      <div className="ciis-mchart-header">
                        <span>Priority Queue</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Recent</span>
                      </div>
                      <div className="ciis-mtask-item">
                        <div>
                          <div style={{ fontWeight: '600' }}>Q3 Audit Prep</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>Finance dept</div>
                        </div>
                        <span className="ciis-mtask-pill ciis-pill-blue">Active</span>
                      </div>
                      <div className="ciis-mtask-item">
                        <div>
                          <div style={{ fontWeight: '600' }}>CRM Sync 2.0</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>Sales lead</div>
                        </div>
                        <span className="ciis-mtask-pill ciis-pill-emerald">Done</span>
                      </div>
                      <div className="ciis-mtask-item">
                        <div>
                          <div style={{ fontWeight: '600' }}>Shift Reassign</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>HR desk</div>
                        </div>
                        <span className="ciis-mtask-pill ciis-pill-amber">Review</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlaid Animated Mobile Phone Device Mockup */}
              <div className="ciis-hero-phone-device">
                <div className="ciis-hero-phone-pill">
                  <span className="ciis-hero-phone-pill-dot"></span>
                  <span>Mobile App &bull; Live Sync</span>
                </div>

                <div className="ciis-hero-phone-chassis">
                  <div className="ciis-hero-phone-island">
                    <span className="ciis-hero-phone-camera"></span>
                  </div>
                  <div className="ciis-hero-phone-glare"></div>
                  <div className="ciis-hero-phone-screen">
                    <img
                      src="/mobile-app-preview.png"
                      alt="CIIS Network Mobile App Experience"
                      className="ciis-hero-phone-img"
                      loading="eager"
                    />
                  </div>
                  <div className="ciis-hero-phone-home-bar"></div>
                </div>
              </div>
            </div>

              {/* Trust Strip Moved to Right Side Below Image/Mockup */}
              <div className="ciis-trust-strip ciis-hero-right-trust" style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap', gap: '8px', justifyContent: 'flex-start' }}>
                <div className="ciis-trust-item" style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '5px 9px', fontSize: '12px' }}>
                  <Check size={14} />
                  <span>Employee Management</span>
                </div>
                <div className="ciis-trust-item" style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '5px 9px', fontSize: '12px' }}>
                  <Check size={14} />
                  <span>Smart Attendance</span>
                </div>
                <div className="ciis-trust-item" style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '5px 9px', fontSize: '12px' }}>
                  <Check size={14} />
                  <span>CRM</span>
                </div>
                <div className="ciis-trust-item" style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '5px 9px', fontSize: '12px' }}>
                  <Check size={14} />
                  <span>Task Management</span>
                </div>
                <div className="ciis-trust-item" style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '5px 9px', fontSize: '12px' }}>
                  <Check size={14} />
                  <span>iOS &amp; Android App</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS / TRUST SECTION ==================== */}
      <section className="ciis-stats-section" ref={statsRef}>
        <div className="ciis-container">
          <div className="ciis-stats-grid">
            <div className="ciis-stat-box ciis-reveal">
              <div className="ciis-stat-number ciis-gradient-text">
                {statBiz}+
              </div>
              <div className="ciis-stat-label">Businesses Empowered</div>
              <div className="ciis-stat-note">Multi-location enterprises</div>
            </div>

            <div className="ciis-stat-box ciis-reveal">
              <div className="ciis-stat-number ciis-gradient-text">
                {statEmp}K+
              </div>
              <div className="ciis-stat-label">Employees Managed</div>
              <div className="ciis-stat-note">Across diverse branches</div>
            </div>

            <div className="ciis-stat-box ciis-reveal">
              <div className="ciis-stat-number ciis-gradient-text">
                {statTasks}K+
              </div>
              <div className="ciis-stat-label">Tasks Completed</div>
              <div className="ciis-stat-note">With real-time accountability</div>
            </div>

            <div className="ciis-stat-box ciis-reveal">
              <div className="ciis-stat-number ciis-gradient-text">
                {statRel}%
              </div>
              <div className="ciis-stat-label">Platform Reliability</div>
              <div className="ciis-stat-note">Engineered for SLA uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CLIENT LOGOS MARQUEE (Left-to-Right Continuous Animation) ==================== */}
      <section className="ciis-clients-section">
        <div className="ciis-container">
          <div className="ciis-clients-header ciis-reveal">
            <h2 className="ciis-clients-title">
              Big Names? Yeah, They’re All On Board
            </h2>
            <p className="ciis-clients-desc">
              Powering daily workforce management, attendance transparency, and automated operations for fast-growing enterprises.
            </p>
          </div>
        </div>

        <div className="ciis-marquee-container">
          <div className="ciis-marquee-track-ltr">
            {[...CLIENT_COMPANIES, ...CLIENT_COMPANIES].map((company, idx) => (
              <div
                key={`${company.name}-${idx}`}
                className="ciis-client-card"
                title={`${company.name} • ${company.category}`}
              >
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="ciis-client-logo-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="ciis-client-brand-wrap"
                  style={{ display: company.logo ? 'none' : 'flex' }}
                >
                  <div
                    className="ciis-client-brand-icon"
                    style={{ background: 'rgba(241, 245, 249, 0.9)' }}
                  >
                    {company.svgIcon}
                  </div>
                  <div>
                    <span className="ciis-client-brand-name">{company.name}</span>
                    <span className="ciis-client-brand-sub">{company.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== INTER-SECTION CTA 1 (After Section 2) ==================== */}
      <SectionCtaBanner 
        badge="30-Day Risk-Free Trial"
        title="Join 3,100+ businesses streamlining their workforce with CIIS Network."
      />

      {/* ==================== WHAT MAKES CIIS THE MOST TRUSTED FOR 3100+ BUSINESSES ==================== */}
      <section className="ciis-trusted-section" id="trusted">
        <div className="ciis-trusted-container">
          <div className="ciis-section-header ciis-reveal" style={{ maxWidth: '820px', margin: '0 auto 20px auto', textAlign: 'center' }}>
            <div className="ciis-badge">
              <Award size={14} />
              ENTERPRISE ADVANTAGE &amp; PROOF
            </div>
            <h2 className="ciis-section-title">
              What Makes CIIS Network the Most Trusted Workforce &amp; Business Management ERP for <span className="ciis-gradient-text">3100+ Businesses</span>?
            </h2>
            <p className="ciis-section-desc">
              Engineered with zero-leak statutory payroll, tamper-proof biometric attendance, live field GPS telemetry, and autonomous workflow chains.
            </p>
          </div>

          {/* Desktop & Mobile Interactive Pill Tabs */}
          <div className="ciis-trusted-tabs-bar ciis-reveal">
            {TRUSTED_FEATURES.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                className={`ciis-trusted-tab-btn ${activeTrustedTab === idx ? 'active' : ''}`}
                onClick={() => setActiveTrustedTab(idx)}
              >
                <span>{tab.tabLabel}</span>
                {activeTrustedTab === idx && (
                  <span className="ciis-trusted-tab-badge">Active</span>
                )}
              </button>
            ))}
          </div>

          {/* Active Tab Detailed Content Card */}
          <div className="ciis-trusted-content-card" key={activeTrustedTab}>
            {/* Left Narrative Column */}
            <div className="ciis-trusted-left">
              <span className="ciis-trusted-pill">
                <Sparkles size={12} />
                {TRUSTED_FEATURES[activeTrustedTab].badge}
              </span>
              <h3 className="ciis-trusted-headline">
                {TRUSTED_FEATURES[activeTrustedTab].title}
              </h3>
              <p className="ciis-trusted-desc">
                {TRUSTED_FEATURES[activeTrustedTab].desc}
              </p>

              <ul className="ciis-trusted-bullets">
                {TRUSTED_FEATURES[activeTrustedTab].bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="ciis-trusted-bullet-item">
                    <div className="ciis-trusted-bullet-icon">
                      <Check size={13} />
                    </div>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="ciis-trusted-metric-box">
                <div className="ciis-trusted-metric-val">
                  {TRUSTED_FEATURES[activeTrustedTab].metric}
                </div>
                <div className="ciis-trusted-metric-sub">
                  {TRUSTED_FEATURES[activeTrustedTab].metricSub}
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <a href="#cta" className="ciis-btn ciis-btn-primary" style={{ display: 'inline-flex' }}>
                  <span>Request Full Enterprise Demo</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Right Interactive Simulation Column */}
            <div className="ciis-trusted-right">
              {activeTrustedTab === 0 && (
                <div className="ciis-tab-preview-frame">
                  <div className="ciis-preview-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#60a5fa" />
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>Biometric Punch Radar</span>
                    </div>
                    <span className="ciis-preview-badge-live">
                      <span className="ciis-preview-live-dot"></span>
                      VERIFIED 0.4s
                    </span>
                  </div>
                  <div className="ciis-preview-card-inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                        AK
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>Aiden Kumar</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Emp #CIIS-8492 • Field Ops</div>
                      </div>
                      <span style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                        On-Duty
                      </span>
                    </div>

                    <div className="ciis-preview-stat-row">
                      <span>Geofence Status:</span>
                      <span style={{ color: '#34d399' }}>✓ Inside Branch Perimeter (6m accuracy)</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Anti-Spoof Check:</span>
                      <span>Mock GPS &amp; Rooting Negative</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Official Punch:</span>
                      <span style={{ color: '#60a5fa' }}>09:00:04 AM (Exact)</span>
                    </div>

                    <div className="ciis-preview-success-bar">
                      <CheckCircle2 size={18} />
                      <span>Tamper-Proof Ledger Synced with Hardware</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTrustedTab === 1 && (
                <div className="ciis-tab-preview-frame">
                  <div className="ciis-preview-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#34d399" />
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>Automated Payroll Ledger</span>
                    </div>
                    <span className="ciis-preview-badge-live" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}>
                      ZERO MANUAL TOUCH
                    </span>
                  </div>
                  <div className="ciis-preview-card-inner">
                    <div className="ciis-preview-stat-row">
                      <span>Base CTC (Gross):</span>
                      <span>₹65,000.00</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Payable Days Computed:</span>
                      <span style={{ color: '#34d399' }}>30 / 30 Days (100% Present)</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Approved Overtime (9.5h):</span>
                      <span style={{ color: '#38bdf8' }}>+₹3,650.00</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Statutory Deductions (PF/ESI):</span>
                      <span style={{ color: '#f87171' }}>-₹3,600.00</span>
                    </div>

                    <div style={{ background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase' }}>Net Disbursal</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>₹65,050.00</div>
                      </div>
                      <span style={{ background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>
                        Batch Encrypted
                      </span>
                    </div>

                    <div className="ciis-preview-success-bar">
                      <CheckCircle2 size={18} />
                      <span>Ready for 1-Click Bank NEFT/RTGS Gateway</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTrustedTab === 2 && (
                <div className="ciis-tab-preview-frame">
                  <div className="ciis-preview-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#f59e0b" />
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>Live Field Telemetry &amp; Route</span>
                    </div>
                    <span className="ciis-preview-badge-live">
                      <span className="ciis-preview-live-dot"></span>
                      5G ACTIVE
                    </span>
                  </div>
                  <div className="ciis-preview-card-inner">
                    <div className="ciis-preview-stat-row">
                      <span>Field Executive:</span>
                      <span>Marcus Vance (Route #4)</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Distance Traveled:</span>
                      <span style={{ color: '#60a5fa' }}>22.4 km (Odometer Synced)</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Device Telemetry:</span>
                      <span>Battery 88% • GPS High Accuracy</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Scheduled Visits:</span>
                      <span style={{ color: '#34d399' }}>5 of 6 Completed (Geotagged)</span>
                    </div>

                    <div className="ciis-preview-success-bar">
                      <CheckCircle2 size={18} />
                      <span>Last Client Visit: Apex Corp (Signature &amp; Photo Captured)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTrustedTab === 3 && (
                <div className="ciis-tab-preview-frame">
                  <div className="ciis-preview-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bot size={16} color="#c084fc" />
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>Autonomous Workflow Engine</span>
                    </div>
                    <span className="ciis-preview-badge-live" style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc', borderColor: 'rgba(192,132,252,0.3)' }}>
                      CRON TRIGGERED
                    </span>
                  </div>
                  <div className="ciis-preview-card-inner">
                    <div className="ciis-preview-stat-row">
                      <span>Incoming Routine:</span>
                      <span>Priority SLA Dispatch #819</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Load Balancer:</span>
                      <span style={{ color: '#34d399' }}>Assigned to Sofia Chen (Bandwidth: 40%)</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Escalation Rule:</span>
                      <span>Auto-ping Lead if idle for &gt; 30 mins</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>SLA Timer Remaining:</span>
                      <span style={{ color: '#38bdf8', fontWeight: '800' }}>01h : 44m : 18s</span>
                    </div>

                    <div className="ciis-preview-success-bar">
                      <CheckCircle2 size={18} />
                      <span>99.4% Enterprise SLA Completion Rate</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTrustedTab === 4 && (
                <div className="ciis-tab-preview-frame">
                  <div className="ciis-preview-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} color="#34d399" />
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>Statutory Compliance Vault</span>
                    </div>
                    <span className="ciis-preview-badge-live">
                      <span className="ciis-preview-live-dot"></span>
                      100% AUDIT READY
                    </span>
                  </div>
                  <div className="ciis-preview-card-inner">
                    <div className="ciis-preview-stat-row">
                      <span>PF ECR File:</span>
                      <span style={{ color: '#34d399' }}>Generated &amp; Portal Validated</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>ESIC Monthly Return:</span>
                      <span style={{ color: '#34d399' }}>Challan Reconciled</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Professional Tax &amp; TDS:</span>
                      <span>State Slab Calculations Applied</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Audit Trail Hash:</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>sha256:7f4a...89c2</span>
                    </div>

                    <div className="ciis-preview-success-bar">
                      <CheckCircle2 size={18} />
                      <span>One-Click Export for Chartered Accountants &amp; Auditors</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTrustedTab === 5 && (
                <div className="ciis-tab-preview-frame">
                  <div className="ciis-preview-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} color="#38bdf8" />
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>Rapid Rollout Checklist</span>
                    </div>
                    <span className="ciis-preview-badge-live" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}>
                      &lt; 30 MINS TOTAL
                    </span>
                  </div>
                  <div className="ciis-preview-card-inner">
                    <div className="ciis-preview-stat-row">
                      <span>1. Bulk Employee Import:</span>
                      <span style={{ color: '#34d399' }}>✓ 250 Staff Loaded via Excel</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>2. Office Geofences:</span>
                      <span style={{ color: '#34d399' }}>✓ 4 Branches Configured</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>3. App Invites Broadcast:</span>
                      <span style={{ color: '#34d399' }}>✓ SMS &amp; Email Credentials Sent</span>
                    </div>
                    <div className="ciis-preview-stat-row">
                      <span>Active Mobile Adoption:</span>
                      <span style={{ color: '#60a5fa' }}>98% Connected within 48 Hours</span>
                    </div>

                    <div className="ciis-preview-success-bar">
                      <CheckCircle2 size={18} />
                      <span>Zero Proprietary Hardware Required • Native Mobile App</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURE SHOWCASE SECTION (4 Major Systems) ==================== */}
      <section className="ciis-section" id="showcase" style={{ background: '#ffffff' }}>
        <div className="ciis-container">
          <div className="ciis-section-header ciis-reveal">
            <div className="ciis-badge">DEEP SYSTEM SHOWCASE</div>
            <h2 className="ciis-section-title">
              Architected for Unified Business Operations
            </h2>
            <p className="ciis-section-desc">
              Explore how each core discipline operates cohesively inside the CIIS Network environment.
            </p>
          </div>

          <div className="ciis-showcase-wrap">
            {/* 1. Workforce Management */}
            <div className="ciis-showcase-row ciis-reveal-left">
              <div className="ciis-showcase-text">
                <div className="ciis-badge">SYSTEM 01</div>
                <h3 className="ciis-showcase-title">Workforce Management</h3>
                <p className="ciis-showcase-desc">
                  Maintain a single source of truth for your people. Organize departments, designations, branches, and documentation without disjointed spreadsheets.
                </p>
                <ul className="ciis-checklist">
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Multi-branch employee organization with designation mappings</span>
                  </li>
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Centralized document vaults with expiration tracking and alerts</span>
                  </li>
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Real-time duty status, active task progress, and department shifts</span>
                  </li>
                </ul>
              </div>

              <div className="ciis-showcase-visual">
                <div className="ciis-showcase-card ciis-shine-card ciis-interactive-card">
                  <div className="ciis-card-topbar">
                    <div className="ciis-card-topbar-title">
                      <Users size={16} />
                      <span>Employee Master Directory</span>
                    </div>
                    <span className="ciis-badge" style={{ fontSize: '10px', padding: '3px 8px' }}>5 Active</span>
                  </div>

                  <div className="ciis-table-wrap">
                    <table className="ciis-mock-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Shift</th>
                          <th>Task Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_EMPLOYEES.map((emp) => (
                          <tr key={emp.id}>
                            <td>
                              <div className="ciis-user-cell">
                                <div className="ciis-avatar-sm">{emp.name.slice(0, 2).toUpperCase()}</div>
                                <div>
                                  <div>{emp.name}</div>
                                  <div style={{ fontSize: '10px', color: '#64748b' }}>{emp.role}</div>
                                </div>
                              </div>
                            </td>
                            <td>{emp.dept}</td>
                            <td>
                              <span className="ciis-status-dot active">{emp.status}</span>
                            </td>
                            <td>{emp.shift}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="ciis-table-prog-bar">
                                  <div className="ciis-table-prog-fill" style={{ width: `${emp.prog}%` }}></div>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '600' }}>{emp.prog}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Smart Attendance & Shifts */}
            <div className="ciis-showcase-row reverse ciis-reveal-right">
              <div className="ciis-showcase-text">
                <div className="ciis-badge">SYSTEM 02</div>
                <h3 className="ciis-showcase-title">Smart Attendance &amp; Shifts</h3>
                <p className="ciis-showcase-desc">
                  Eliminate attendance discrepancies and manual punching reviews. Real-time biometric or web punches sync with automated shift rules and overtime policies.
                </p>
                <ul className="ciis-checklist">
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Intelligent auto clock-out with automated break hour deductions</span>
                  </li>
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Shift management supporting rotating, night, and flexible rosters</span>
                  </li>
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Seamless overtime calculation integrated directly with payroll rollups</span>
                  </li>
                </ul>
              </div>

              <div className="ciis-showcase-visual">
                <div className="ciis-showcase-card ciis-shine-card ciis-interactive-card">
                  <div className="ciis-card-topbar">
                    <div className="ciis-card-topbar-title">
                      <Clock size={16} />
                      <span>Today's Shift &amp; Attendance Pulse</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>LIVE TRACKING</span>
                  </div>

                  <div className="ciis-attendance-visual-grid">
                    <div className="ciis-att-chart-side">
                      <div className="ciis-donut-container">
                        <svg width="140" height="140" viewBox="0 0 140 140">
                          <circle cx="70" cy="70" r="54" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                          <circle
                            cx="70"
                            cy="70"
                            r="54"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="12"
                            strokeDasharray="339.29"
                            strokeDashoffset="33.9"
                            strokeLinecap="round"
                            transform="rotate(-90 70 70)"
                          />
                        </svg>
                        <div className="ciis-donut-center">
                          <div className="ciis-donut-center-val">96%</div>
                          <div className="ciis-donut-center-lbl">On Time</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Shift Compliance Index</span>
                    </div>

                    <div className="ciis-att-pills-side">
                      <div className="ciis-att-metric-pill">
                        <span style={{ fontWeight: '600' }}>Present</span>
                        <span style={{ fontWeight: '800', color: '#2563eb' }}>236 Staff</span>
                      </div>
                      <div className="ciis-att-metric-pill">
                        <span style={{ fontWeight: '600' }}>Absent</span>
                        <span style={{ fontWeight: '800', color: '#ef4444' }}>8 Staff</span>
                      </div>
                      <div className="ciis-att-metric-pill">
                        <span style={{ fontWeight: '600' }}>Late In</span>
                        <span style={{ fontWeight: '800', color: '#f59e0b' }}>4 Staff</span>
                      </div>
                      <div className="ciis-att-metric-pill">
                        <span style={{ fontWeight: '600' }}>Overtime Logged</span>
                        <span style={{ fontWeight: '800', color: '#10b981' }}>+34.5 hrs</span>
                      </div>
                    </div>

                    <div className="ciis-shift-timeline">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}>
                        <span>Day Shift Coverage</span>
                        <span style={{ color: '#2563eb' }}>09:00 AM - 06:00 PM</span>
                      </div>
                      <div className="ciis-timeline-bar">
                        <div className="ciis-timeline-active"></div>
                      </div>
                      <div className="ciis-timeline-labels">
                        <span>08:00 AM (Check-in open)</span>
                        <span>01:00 PM (Lunch break)</span>
                        <span>06:00 PM (Shift wrap)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Task Management */}
            <div className="ciis-showcase-row ciis-reveal-left">
              <div className="ciis-showcase-text">
                <div className="ciis-badge">SYSTEM 03</div>
                <h3 className="ciis-showcase-title">Task Management</h3>
                <p className="ciis-showcase-desc">
                  Keep every project, deliverable, and routine chore organized across departments. Prioritize tasks, assign deadlines, and trace execution with zero bottlenecks.
                </p>
                <ul className="ciis-checklist">
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Visual Kanban pipelines with multi-tier tags and urgency indicators</span>
                  </li>
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Automated recurring tasks for end-of-month and weekly checklists</span>
                  </li>
                  <li className="ciis-check-item">
                    <div className="ciis-check-dot"><Check size={12} /></div>
                    <span>Cross-department assignment with file attachments and progress milestones</span>
                  </li>
                </ul>
              </div>

              <div className="ciis-showcase-visual">
                <div className="ciis-showcase-card ciis-shine-card ciis-interactive-card">
                  <div className="ciis-card-topbar">
                    <div className="ciis-card-topbar-title">
                      <CheckSquare size={16} />
                      <span>Sprint Execution Board</span>
                    </div>
                    <span className="ciis-badge" style={{ fontSize: '10px' }}>Active Sprint 24</span>
                  </div>

                  <div className="ciis-kanban-board">
                    {/* Pending Col */}
                    <div className="ciis-kanban-col">
                      <div className="ciis-kanban-head">
                        <span>Pending</span>
                        <span className="ciis-mtask-pill ciis-pill-amber">3</span>
                      </div>
                      <div className="ciis-kanban-card">
                        <span className="ciis-kanban-card-title">Security Key Rotation</span>
                        <div className="ciis-kanban-meta">
                          <span style={{ color: '#ef4444' }}>High Priority</span>
                          <span>Tomorrow</span>
                        </div>
                      </div>
                      <div className="ciis-kanban-card">
                        <span className="ciis-kanban-card-title">Quarterly Asset Audit</span>
                        <div className="ciis-kanban-meta">
                          <span>Operations</span>
                          <span>Fri</span>
                        </div>
                      </div>
                    </div>

                    {/* In Progress Col */}
                    <div className="ciis-kanban-col">
                      <div className="ciis-kanban-head">
                        <span>In Progress</span>
                        <span className="ciis-mtask-pill ciis-pill-blue">2</span>
                      </div>
                      <div className="ciis-kanban-card">
                        <span className="ciis-kanban-card-title">Client Billing Reconciliation</span>
                        <div className="ciis-table-prog-bar" style={{ width: '100%', margin: '4px 0' }}>
                          <div className="ciis-table-prog-fill" style={{ width: '65%' }}></div>
                        </div>
                        <div className="ciis-kanban-meta">
                          <span>Elena R.</span>
                          <span>65%</span>
                        </div>
                      </div>
                      <div className="ciis-kanban-card">
                        <span className="ciis-kanban-card-title">Mobile Push Notification Sync</span>
                        <div className="ciis-kanban-meta">
                          <span>Engineering</span>
                          <span>Today</span>
                        </div>
                      </div>
                    </div>

                    {/* Completed Col */}
                    <div className="ciis-kanban-col">
                      <div className="ciis-kanban-head">
                        <span>Completed</span>
                        <span className="ciis-mtask-pill ciis-pill-emerald">4</span>
                      </div>
                      <div className="ciis-kanban-card">
                        <span className="ciis-kanban-card-title">Branch Roster Publication</span>
                        <div className="ciis-kanban-meta">
                          <span style={{ color: '#10b981' }}>Completed</span>
                          <span>10:30 AM</span>
                        </div>
                      </div>
                      <div className="ciis-kanban-card">
                        <span className="ciis-kanban-card-title">Salary Slips Distribution</span>
                        <div className="ciis-kanban-meta">
                          <span style={{ color: '#10b981' }}>Dispatched</span>
                          <span>Yesterday</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== INTER-SECTION CTA 2 (After Section 4) ==================== */}
      <SectionCtaBanner 
        badge="Full Enterprise Suite • 30 Days Free"
        title="Get complete access to Employee Management, CRM, Telecaller & Payroll."
      />

      {/* ==================== DASHBOARD SECTION (Side-by-Side: Left Boxes, Right Dashboard) ==================== */}
      <section className="ciis-dash-section" id="dashboard">
        <div className="ciis-container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 24px' }}>
          
          <div className="ciis-section-header ciis-reveal" style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div className="ciis-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={14} />
              COMMAND CENTER &amp; MOBILE APP
            </div>
            <h2 className="ciis-section-title" style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', marginBottom: '12px' }}>
              Everything You Need. Unified Dashboard &amp; <span className="ciis-gradient-text">Employee Mobile App</span>.
            </h2>
            <p className="ciis-section-desc" style={{ maxWidth: '740px', margin: '0 auto', fontSize: '15px' }}>
              Total enterprise oversight on the web dashboard combined with our native iOS &amp; Android companion app for 1-tap mobile attendance, real-time alerts, and field operations.
            </p>
          </div>

          <div className="ciis-dash-split-wrap">
            {/* LEFT SIDE: 5 Feature Boxes (including Mobile App) */}
            <div className="ciis-dash-left-boxes">
              {/* Feature 1: Mobile App Card */}
              <div className="ciis-dash-side-card ciis-reveal" style={{ borderLeft: '3px solid #0284c7', background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.6) 0%, #ffffff 100%)' }}>
                <div className="ciis-dash-side-icon" style={{ background: 'rgba(14,165,233,0.12)', color: '#0284c7' }}>
                  <Smartphone size={20} />
                </div>
                <div className="ciis-dash-side-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <h4 className="ciis-dash-side-title" style={{ margin: 0 }}>CIIS Mobile App (iOS &amp; Android)</h4>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', textTransform: 'uppercase' }}>Live Sync</span>
                  </div>
                  <p className="ciis-dash-side-desc">
                    1-tap clock-in/out with live timer, GPS geo-fenced attendance, instant push alerts, and direct leave requests in your pocket.
                  </p>
                </div>
              </div>

              <div className="ciis-dash-side-card ciis-reveal">
                <div className="ciis-dash-side-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                  <Clock size={20} />
                </div>
                <div className="ciis-dash-side-info">
                  <h4 className="ciis-dash-side-title">Biometrics &amp; Attendance</h4>
                  <p className="ciis-dash-side-desc">
                    Real-time shift tracking, present/absent counters, and monthly calendar heatmaps with 1-click clock-in/out.
                  </p>
                </div>
              </div>

              <div className="ciis-dash-side-card ciis-reveal">
                <div className="ciis-dash-side-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <TrendingUp size={20} />
                </div>
                <div className="ciis-dash-side-info">
                  <h4 className="ciis-dash-side-title">Productivity &amp; Projects</h4>
                  <p className="ciis-dash-side-desc">
                    Weekly productivity curves, top project milestones, and automated task status distributions in real time.
                  </p>
                </div>
              </div>

              <div className="ciis-dash-side-card ciis-reveal">
                <div className="ciis-dash-side-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
                  <Bot size={20} />
                </div>
                <div className="ciis-dash-side-info">
                  <h4 className="ciis-dash-side-title">AI Assistant Integration</h4>
                  <p className="ciis-dash-side-desc">
                    Get instant personalized insights, task suggestions, and smart answers directly from your workspace data.
                  </p>
                </div>
              </div>

              <div className="ciis-dash-side-card ciis-reveal">
                <div className="ciis-dash-side-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                  <Zap size={20} />
                </div>
                <div className="ciis-dash-side-info">
                  <h4 className="ciis-dash-side-title">Quick Operational Actions</h4>
                  <p className="ciis-dash-side-desc">
                    Create new tasks, apply for leaves, request assets, schedule meetings, and take notes in just one click.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Dashboard Window with Overlaid Mobile App Mockup */}
            <div className="ciis-dash-right-window">
              <div className="ciis-dash-stage-wrap">
                {/* Desktop Command Center Window */}
                <div className="ciis-big-dashboard ciis-reveal">
                  {/* Top Toolbar with macOS Traffic Lights */}
                  <div className="ciis-dash-headbar">
                    <div className="ciis-dash-head-left">
                      <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginRight: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                      </div>
                      <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo ciis-brand-logo-sm" style={{ height: '22px' }} />
                      <span className="ciis-badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'transparent', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px' }}>
                        <ShieldCheck size={12} color="#38bdf8" />
                        CIIS Command Center
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span className="ciis-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)', fontSize: '11px', padding: '3px 8px' }}>
                        <span className="ciis-preview-live-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginRight: '5px' }}></span>
                        Live Employee Portal
                      </span>
                    </div>
                  </div>

                  {/* Real Dashboard Image Uploaded by User */}
                  <div className="ciis-dash-img-wrap">
                    <img
                      src="/dashboard-preview.jpg"
                      alt="CIIS Network Enterprise Command Center Dashboard"
                      className="ciis-dash-real-img"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Overlaid Mobile Phone Device Mockup */}
                <div className="ciis-phone-device ciis-reveal">
                  {/* Floating Pill Label */}
                  <div className="ciis-phone-floating-pill">
                    <span className="ciis-phone-pill-dot"></span>
                    <span>CIIS Mobile App &bull; Live Sync</span>
                  </div>

                  <div className="ciis-phone-chassis">
                    {/* Dynamic Island / Speaker Pill */}
                    <div className="ciis-phone-island">
                      <span className="ciis-phone-camera"></span>
                    </div>
                    {/* Glass glare effect */}
                    <div className="ciis-phone-glare"></div>
                    {/* Phone Screen with Mobile App Screenshot */}
                    <div className="ciis-phone-screen">
                      <img
                        src="/mobile-app-preview.png"
                        alt="CIIS Network Mobile App Experience"
                        className="ciis-phone-img"
                        loading="eager"
                      />
                    </div>
                    {/* Home Indicator Bar */}
                    <div className="ciis-phone-home-indicator"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== DEDICATED MOBILE APP CAPABILITIES STRIP ==================== */}
          <div className="ciis-dash-app-strip ciis-reveal">
            <div className="ciis-dash-app-strip-header">
              <div className="ciis-dash-app-tag">
                <Smartphone size={15} />
                <span>POWERFUL MOBILE COMPANION</span>
              </div>
              <h3 className="ciis-dash-app-heading">
                Full Operational Power In Every Employee&apos;s Pocket
              </h3>
              <p className="ciis-dash-app-sub">
                Designed specifically for today&apos;s hybrid, field, and on-premise workforce. Every mobile action updates the Command Center in real time.
              </p>
            </div>

            <div className="ciis-dash-app-cards-grid">
              {/* Feature 1: 1-Tap Clock In/Out */}
              <div className="ciis-dash-app-feature-card">
                <div className="ciis-dash-app-feature-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <Clock size={20} />
                </div>
                <div className="ciis-dash-app-feature-content">
                  <h4>1-Tap Punch &amp; Active Timer</h4>
                  <p>Live active work hours counter (04:57:09) with instant clock-in &amp; clock-out buttons for transparent shift logging.</p>
                </div>
              </div>

              {/* Feature 2: Geo-fenced GPS Attendance */}
              <div className="ciis-dash-app-feature-card">
                <div className="ciis-dash-app-feature-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                  <MapPin size={20} />
                </div>
                <div className="ciis-dash-app-feature-content">
                  <h4>Geo-Fenced GPS Verification</h4>
                  <p>Tamper-proof location boundaries ensure on-site attendance accuracy for field telecallers, sales reps, and office staff.</p>
                </div>
              </div>

              {/* Feature 3: Real-Time Push Alerts */}
              <div className="ciis-dash-app-feature-card">
                <div className="ciis-dash-app-feature-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <Bell size={20} />
                </div>
                <div className="ciis-dash-app-feature-content">
                  <h4>Instant Mobile Push Alerts</h4>
                  <p>Never miss a lead or approval. Employees receive priority task notifications, team announcements, and manager feedback on the fly.</p>
                </div>
              </div>

              {/* Feature 4: Monthly Attendance Calendar */}
              <div className="ciis-dash-app-feature-card">
                <div className="ciis-dash-app-feature-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
                  <Calendar size={20} />
                </div>
                <div className="ciis-dash-app-feature-content">
                  <h4>Visual Attendance Calendar</h4>
                  <p>Color-coded monthly tracking with live summary metrics for Present, Late, and Half-Day status at a glance.</p>
                </div>
              </div>
            </div>

            {/* App Store Availability Footer */}
            <div className="ciis-dash-app-badges-row">
              <span className="ciis-dash-app-avail-text">Experience CIIS on your mobile device:</span>
              <div className="ciis-dash-app-badges">
                <a 
                  href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ciis-app-pill-badge"
                  style={{ textDecoration: 'none' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                  </svg>
                  <span>Apple iOS App</span>
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ciis-app-pill-badge"
                  style={{ textDecoration: 'none' }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24">
                    <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                    <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                    <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                    <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                  </svg>
                  <span>Google Play Store</span>
                </a>
                <span className="ciis-app-pill-sync">
                  <span className="ciis-live-pill-dot"></span>
                  <span>Instant Real-Time Web Cloud Sync</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECURITY & ACCESS SECTION ==================== */}
      <section className="ciis-section" id="security" style={{ background: '#ffffff' }}>
        <div className="ciis-container">
          <div className="ciis-security-grid">
            <div className="ciis-reveal">
              <div className="ciis-badge">GRANULAR SECURITY</div>
              <h2 className="ciis-section-title" style={{ marginTop: '16px', marginBottom: '16px' }}>
                The Right Access for the Right People
              </h2>
              <p className="ciis-section-desc">
                Control access by role, department, branch, and page permissions. CIIS Network enforces strict principle-of-least-privilege across every operational boundary.
              </p>

              <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="ciis-check-dot"><Check size={12} /></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                    Zero-leak role hierarchy guarding executive and employee data
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="ciis-check-dot"><Check size={12} /></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                    Branch-level isolation ensuring regional managers see only assigned workforce
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="ciis-check-dot"><Check size={12} /></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                    Comprehensive audit trail logging read, create, and edit operations
                  </span>
                </div>
              </div>
            </div>

            <div className="ciis-hierarchy-box ciis-reveal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
                  Permission Matrix Configuration
                </span>
                <Lock size={16} color="#2563eb" />
              </div>

              {/* Super Admin */}
              <div className="ciis-role-tier">
                <div className="ciis-role-info">
                  <div className="ciis-role-icon"><ShieldCheck size={18} /></div>
                  <div>
                    <div className="ciis-role-name">Super Admin</div>
                    <div className="ciis-role-scope">Full multi-branch &amp; financial governance</div>
                  </div>
                </div>
                <div className="ciis-chips-wrap">
                  <span className="ciis-chip active">Full Access</span>
                  <span className="ciis-chip active">Billing</span>
                </div>
              </div>

              {/* Admin */}
              <div className="ciis-role-tier">
                <div className="ciis-role-info">
                  <div className="ciis-role-icon"><Sliders size={18} /></div>
                  <div>
                    <div className="ciis-role-name">Admin</div>
                    <div className="ciis-role-scope">Departmental policies &amp; payroll approval</div>
                  </div>
                </div>
                <div className="ciis-chips-wrap">
                  <span className="ciis-chip active">View</span>
                  <span className="ciis-chip active">Create</span>
                  <span className="ciis-chip active">Edit</span>
                </div>
              </div>

              {/* Manager */}
              <div className="ciis-role-tier">
                <div className="ciis-role-info">
                  <div className="ciis-role-icon"><Users size={18} /></div>
                  <div>
                    <div className="ciis-role-name">Manager</div>
                    <div className="ciis-role-scope">Direct report roster, tasks &amp; attendance</div>
                  </div>
                </div>
                <div className="ciis-chips-wrap">
                  <span className="ciis-chip active">View</span>
                  <span className="ciis-chip active">Edit Roster</span>
                </div>
              </div>

              {/* Employee */}
              <div className="ciis-role-tier">
                <div className="ciis-role-info">
                  <div className="ciis-role-icon"><UserCheck size={18} /></div>
                  <div>
                    <div className="ciis-role-name">Employee</div>
                    <div className="ciis-role-scope">Self clock-in, personal tasks &amp; leave requests</div>
                  </div>
                </div>
                <div className="ciis-chips-wrap">
                  <span className="ciis-chip active">Personal View</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== INTER-SECTION CTA 3 (After Section 6) ==================== */}
      <SectionCtaBanner 
        badge="Enterprise Security & Privacy"
        title="Deploy secure, biometric & GPS-verified operations across your company."
      />

      {/* ==================== COMMUNICATION SECTION ==================== */}
      <section className="ciis-section" id="communication">
        <div className="ciis-container">
          <div className="ciis-section-header ciis-reveal">
            <div className="ciis-badge">TEAM CONNECTIVITY</div>
            <h2 className="ciis-section-title">
              Keep Your Team Connected
            </h2>
            <p className="ciis-section-desc">
              Context-switching between third-party chat and your work platform kills momentum. CIIS integrates instant team conversations directly into project flows.
            </p>
          </div>

          <div className="ciis-comm-window ciis-reveal">
            {/* Channels Sidebar (Desktop) */}
            <div className="ciis-comm-sidebar">
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
                Operational Channels
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {COMM_CHANNELS.map((chan) => (
                  <button
                    key={chan.id}
                    type="button"
                    className={`ciis-channel-item ${activeChannel === chan.id ? 'active' : ''}`}
                    onClick={() => setActiveChannel(chan.id)}
                    style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
                  >
                    <MessageSquare size={14} />
                    <span>{chan.name}</span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 'auto', padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Live Voice Huddle</div>
                <div style={{ fontSize: '10px', color: '#10b981' }}>3 members active</div>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="ciis-comm-main">
              {/* Mobile Channel Switcher Tabs */}
              <div className="ciis-mobile-channel-tabs">
                {COMM_CHANNELS.map((chan) => (
                  <button
                    key={chan.id}
                    type="button"
                    className={`ciis-mob-chan-btn ${activeChannel === chan.id ? 'active' : ''}`}
                    onClick={() => setActiveChannel(chan.id)}
                  >
                    <MessageSquare size={12} />
                    <span>{chan.name.replace('# ', '')}</span>
                  </button>
                ))}
              </div>

              <div className="ciis-comm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={16} color="#2563eb" />
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>
                    {COMM_CHANNELS.find((c) => c.id === activeChannel)?.name || '# general-announcements'}
                  </span>
                </div>
                <span className="ciis-badge" style={{ fontSize: '10px' }}>
                  {COMM_CHANNELS.find((c) => c.id === activeChannel)?.count || 'Active'}
                </span>
              </div>

              <div className="ciis-comm-messages">
                {(COMM_MESSAGES[activeChannel] || COMM_MESSAGES.general).map((msg, mIdx) => (
                  <div className="ciis-message-row" key={mIdx}>
                    <div className="ciis-avatar-sm" style={{ background: msg.avatarBg, color: msg.avatarColor }}>
                      {msg.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                        {msg.name}{' '}
                        <span style={{ fontWeight: '400', color: '#94a3b8', fontSize: '10px' }}>
                          {msg.time}
                        </span>
                      </div>
                      <div className={`ciis-msg-bubble ${msg.alert ? 'alert' : ''}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ciis-comm-input-bar">
                <div className="ciis-fake-input">
                  Type a team message, attach a document, or assign a task...
                </div>
                <button className="ciis-btn ciis-btn-primary" style={{ padding: '10px 16px' }} aria-label="Send message">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS (4 Steps) ==================== */}
      <section className="ciis-section" id="how-it-works">
        <div className="ciis-container">
          <div className="ciis-section-header ciis-reveal">
            <div className="ciis-badge">ONBOARDING SIMPLICITY</div>
            <h2 className="ciis-section-title">
              How CIIS Network Works
            </h2>
            <p className="ciis-section-desc">
              Go from disconnected spreadsheets and legacy tools to a synchronized enterprise workflow in four straightforward steps.
            </p>
          </div>

          <div className="ciis-steps-wrap ciis-reveal">
            <div className="ciis-steps-line"></div>
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.step} className="ciis-step-box">
                <div className="ciis-step-num">{step.step}</div>
                <h3 className="ciis-step-title">{step.title}</h3>
                <p className="ciis-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== INTER-SECTION CTA 4 (After Section 8) ==================== */}
      <SectionCtaBanner 
        badge="1-Minute Company Setup"
        title="Experience frictionless automation today with zero commitment."
      />

      {/* ==================== PRODUCT VIDEO OVERVIEW (Runo-style Portal Tour) ==================== */}
      <section className="ciis-video-tour-section" id="cta">
        <div className="ciis-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Section Header */}
          <div className="ciis-section-header ciis-reveal" style={{ textAlign: 'center', marginBottom: '38px' }}>
            <div className="ciis-badge" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', borderColor: 'rgba(37,99,235,0.2)' }}>
              PORTAL VIDEO OVERVIEW
            </div>
            <h2 className="ciis-section-title" style={{ fontSize: 'clamp(28px, 3.4vw, 42px)', marginBottom: '14px', fontWeight: 800 }}>
              Watch How CIIS Works: Quick Video Overview
            </h2>
            <p className="ciis-section-desc" style={{ maxWidth: '720px', margin: '0 auto', fontSize: '15.5px', color: '#64748b' }}>
              See how modern enterprises manage employees, track live shifts, automate recurring workflows, and monitor operational telemetry from a single intuitive command center.
            </p>
          </div>

          {/* 3 Videos in One Line (Grid) */}
          <div className="ciis-video-grid-3 ciis-reveal">
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

          {/* Bottom Highlight Pills & CTA Buttons (Like Runo) */}
          <div className="ciis-video-footer-bar ciis-reveal">
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
              <a href="/RegisterCompany" className="ciis-btn ciis-btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
                Start Free Trial
                <ArrowRight size={16} />
              </a>
              <a href="#features" className="ciis-btn ciis-btn-ghost" onClick={(e) => handleNavClick(e, 'features')} style={{ padding: '12px 22px', fontSize: '15px' }}>
                Explore All Features
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="ciis-footer">
        <div className="ciis-container">
          <div className="ciis-footer-grid">
            <div className="ciis-footer-brand">
              <a href="#top" className="ciis-logo" onClick={(e) => handleNavClick(e, 'top')}>
                <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo" />
              </a>
              <p className="ciis-footer-tagline">
                CIIS Network unifies workforce, attendance, CRM, projects and client operations into one reliable business management platform.
              </p>
              <div className="ciis-footer-status">
                <span className="ciis-live-pill-dot"></span>
                <span>Cloud Network Operational</span>
              </div>
            </div>

            <div className="ciis-footer-col">
              <h3>Platform</h3>
              <a href="/features">Features</a>
              <a href="/solutions">Solutions</a>
              <a href="/how-it-works">How It Works</a>
              <a href="/security">Security</a>
            </div>

            <div className="ciis-footer-col">
              <h3>Operations</h3>
              <a href="/employee-management">Employee Management</a>
              <a href="/crm-telecaller">CRM &amp; Telecaller</a>
              <a href="/team-communication">Team Communication</a>
              <a href="/business-automation">Business Automation</a>
            </div>

            <div className="ciis-footer-col ciis-footer-actions-col">
              <h3>Super Admin</h3>
              <p>Access the CIIS central administration control portal.</p>
              <div className="ciis-footer-actions">
                <a href="/SuperAdminLogin" className="ciis-btn ciis-btn-primary ciis-btn-sm">
                  Super Admin Login
                </a>
              </div>
            </div>
          </div>

          {/* ==================== GET THE APP & FOLLOW US ROW ==================== */}
          <div className="ciis-footer-connect-row">
            {/* Get the app */}
            <div className="ciis-footer-app-block">
              <h4 className="ciis-footer-block-heading">Get the app</h4>
              <div className="ciis-footer-store-btns">
                {/* Apple App Store Badge */}
                <a 
                  href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ciis-store-badge-btn" 
                  aria-label="Download on the App Store"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                  </svg>
                  <div className="ciis-store-badge-text">
                    <span className="ciis-store-label">Download on the</span>
                    <span className="ciis-store-title">App Store</span>
                  </div>
                </a>

                {/* Google Play Store Badge */}
                <a 
                  href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ciis-store-badge-btn" 
                  aria-label="Get it on Google Play"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                    <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                    <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                    <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                  </svg>
                  <div className="ciis-store-badge-text">
                    <span className="ciis-store-label">GET IT ON</span>
                    <span className="ciis-store-title">Google Play</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Follow Us */}
            <div className="ciis-footer-social-block">
              <h4 className="ciis-footer-block-heading">Follow Us</h4>
              <div className="ciis-footer-social-icons">
                {/* Facebook */}
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ciis-social-circle-btn" 
                  aria-label="Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ciis-social-circle-btn" 
                  aria-label="Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ciis-social-circle-btn" 
                  aria-label="YouTube"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="#0f172a">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ciis-social-circle-btn" 
                  aria-label="LinkedIn"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#0f172a">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="ciis-footer-bottom">
            <span>&copy; 2026 CIIS Network. All rights reserved.</span>
            <span>Enterprise Business Suite &bull; Secure Cloud Operations</span>
          </div>
        </div>
      </footer>

      {/* Floating Mobile Bottom Action Pill Bar */}
      <div className={`ciis-mobile-bottom-bar ${scrolled ? 'visible' : ''}`}>
        <div className="ciis-mob-bar-brand">
          <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo ciis-brand-logo-xs" />
        </div>
        <div className="ciis-mob-bar-actions">
          <a href="/RegisterCompany" className="ciis-btn ciis-btn-primary ciis-btn-sm">
            Get Started
          </a>
          <a href="#features" className="ciis-btn ciis-btn-secondary ciis-btn-sm" onClick={(e) => handleNavClick(e, 'features')}>
            Explore
          </a>
        </div>
      </div>
      <BookDemoModal open={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
}
