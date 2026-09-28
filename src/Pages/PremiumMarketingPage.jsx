import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderKanban,
  Lock,
  MessageSquare,
  MonitorSmartphone,
  PackageCheck,
  Phone,
  PieChart,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Workflow
} from 'lucide-react';
import { HomeHeader, HomeFooter } from '../components/HomeChrome';
import './PremiumMarketingPage.css';

const pageCatalog = {
  'product-overview': {
    eyebrow: 'Product Overview',
    title: 'One connected operating system for your company.',
    description: 'Bring people, work, clients and insights into one CIIS workspace with shared data, permissions and real-time visibility.',
    icon: Workflow,
    color: '#2563eb',
    image: '/dashboard-preview.jpg',
    bullets: ['Unified company dashboard', 'Role-based access for every team', 'Web and mobile workflows'],
    stats: [['4', 'Operating pillars'], ['99.9%', 'Cloud uptime'], ['1', 'Company database']]
  },
  people: {
    eyebrow: 'People Suite',
    title: 'Manage employees, attendance, shifts, leaves, payroll and assets.',
    description: 'A complete workforce command center for HR, admins, managers and employees.',
    icon: Users,
    color: '#2563eb',
    image: '/dashboard-preview.jpg',
    bullets: ['Employee directory and roles', 'Attendance, shifts and leave workflows', 'Payroll and asset operations'],
    stats: [['10K+', 'Employee records'], ['99.8%', 'Punch accuracy'], ['30 min', 'Setup']]
  },
  work: {
    eyebrow: 'Work Suite',
    title: 'Plan tasks, projects, meetings, chat and alerts without scattered tools.',
    description: 'CIIS keeps daily operations moving with task ownership, timelines, collaboration and escalation paths.',
    icon: Briefcase,
    color: '#4f46e5',
    image: '/image.png',
    bullets: ['Task and project tracking', 'Meetings and internal chat', 'Automated alerts and follow-ups'],
    stats: [['94%', 'SLA adherence'], ['4.2M+', 'Tasks tracked'], ['Live', 'Team updates']]
  },
  clients: {
    eyebrow: 'Client Suite',
    title: 'Run client accounts, services, documents, support and billing from one place.',
    description: 'A shared delivery layer for account teams and client portals, with service tasks and updates connected to the same system.',
    icon: Briefcase,
    color: '#0891b2',
    image: '/dashboard-preview.jpg',
    bullets: ['Client account management', 'Services, support and documents', 'Payments and delivery timelines'],
    stats: [['360°', 'Client view'], ['24/7', 'Support trail'], ['1', 'Portal']]
  },
  insights: {
    eyebrow: 'Insights',
    title: 'Turn attendance, payroll, tasks and client work into executive visibility.',
    description: 'Make decisions from connected reports instead of stitched spreadsheets and fragmented dashboards.',
    icon: BarChart3,
    color: '#ea580c',
    image: '/image.png',
    bullets: ['Attendance and task analytics', 'Payroll and team performance reports', 'Department-level visibility'],
    stats: [['Real-time', 'Reports'], ['100%', 'Audit trail'], ['Multi', 'Department']]
  },
  'employee-management': {
    eyebrow: 'Employee Management',
    title: 'A single source of truth for employee records and organization structure.',
    description: 'Create employees, map departments and roles, manage branches, and keep access aligned to company policy.',
    icon: Users,
    color: '#2563eb',
    bullets: ['Profiles, documents and reporting lines', 'Departments, branches and designations', 'Role-aware access controls']
  },
  attendance: {
    eyebrow: 'Attendance',
    title: 'Reliable geo, selfie and shift-aware attendance tracking.',
    description: 'Capture verified punches, handle late marks, half-days and shift rules with transparent records.',
    icon: ClipboardCheck,
    color: '#10b981',
    bullets: ['GPS and biometric-ready punch flow', 'Late, grace and half-day rules', 'Employee and manager visibility']
  },
  'shift-management': {
    eyebrow: 'Shift Management',
    title: 'Flexible rosters for rotating, night and branch-based teams.',
    description: 'Build shift schedules that match real operations and sync cleanly with attendance and payroll.',
    icon: CalendarClock,
    color: '#7c3aed',
    bullets: ['Rotating and night shifts', 'Grace rules and shift windows', 'Branch and team assignment']
  },
  'leave-management': {
    eyebrow: 'Leave Management',
    title: 'Policy-based leave requests, approvals and balances.',
    description: 'Keep leave calendars, balances and approval trails clean across departments.',
    icon: CalendarClock,
    color: '#0d9488',
    bullets: ['Configurable leave policies', 'Approval workflows', 'Balances and holiday context']
  },
  payroll: {
    eyebrow: 'Payroll',
    title: 'Salary structures, calculations, payslips and payroll reports connected to attendance.',
    description: 'Reduce payroll effort with linked salary components, attendance inputs and audit-ready outputs.',
    icon: CreditCard,
    color: '#f59e0b',
    bullets: ['Salary structures and components', 'Payslips and payroll processing', 'Reports and audit breakdowns']
  },
  'asset-management': {
    eyebrow: 'Asset Management',
    title: 'Track company assets, requests and employee allocation.',
    description: 'Know which devices and resources are assigned, requested, returned or pending action.',
    icon: PackageCheck,
    color: '#64748b',
    bullets: ['Asset inventory', 'Employee assignment', 'Requests and return tracking']
  },
  'task-management': {
    eyebrow: 'Task Management',
    title: 'Assign, prioritize and monitor work across teams.',
    description: 'Give every task an owner, due date, context and completion history.',
    icon: ClipboardCheck,
    color: '#4f46e5',
    bullets: ['Company and department tasks', 'Priority and status tracking', 'Attachments and updates']
  },
  'project-management': {
    eyebrow: 'Project Management',
    title: 'Coordinate projects, milestones and delivery progress.',
    description: 'Keep project work visible across admins, employees and client-facing teams.',
    icon: FolderKanban,
    color: '#6366f1',
    bullets: ['Project timelines', 'Milestone progress', 'Team accountability']
  },
  meetings: {
    eyebrow: 'Meetings',
    title: 'Schedule team and client meetings with operational context.',
    description: 'Connect meetings to tasks, clients and follow-up actions.',
    icon: Video,
    color: '#0ea5e9',
    bullets: ['Team meetings', 'Client meetings', 'Follow-up visibility']
  },
  chat: {
    eyebrow: 'Chat',
    title: 'Realtime communication for teams and support workflows.',
    description: 'Keep discussions connected to daily operations with fast internal collaboration.',
    icon: MessageSquare,
    color: '#14b8a6',
    bullets: ['Team conversations', 'Support context', 'Realtime updates']
  },
  alerts: {
    eyebrow: 'Alerts',
    title: 'Send important operational updates at the right time.',
    description: 'Create alerts for employees, departments and company-wide announcements.',
    icon: Bell,
    color: '#ef4444',
    bullets: ['Push-style announcements', 'Department targeting', 'Operational reminders']
  },
  'client-management': {
    eyebrow: 'Client Management',
    title: 'Manage clients, services, plans and account delivery.',
    description: 'Give account teams a clear view of client history, tasks, documents and support.',
    icon: Briefcase,
    color: '#0891b2',
    bullets: ['Client profiles', 'Plans and services', 'Delivery and support tracking']
  },
  support: {
    eyebrow: 'Support',
    title: 'A structured support desk for internal and client operations.',
    description: 'Handle tickets, conversations and escalations with a visible service trail.',
    icon: Phone,
    color: '#0284c7',
    bullets: ['Support tickets', 'Department support desk', 'Client support operations']
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Flexible plans for growing companies.',
    description: 'Start with essential company operations and scale into advanced workflows as your team grows.',
    icon: CreditCard,
    color: '#2563eb',
    bullets: ['Launch-ready trial path', 'Scalable company modules', 'Web and mobile access'],
    pricing: true
  },
  compare: {
    eyebrow: 'Compare',
    title: 'Replace disconnected tools with one connected CIIS platform.',
    description: 'Compare scattered attendance apps, spreadsheets, CRMs and chat tools against a unified operating system.',
    icon: PieChart,
    color: '#7c3aed',
    bullets: ['Fewer duplicated records', 'One login for all modules', 'Connected reports across departments']
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Talk to CIIS Network about your company workflow.',
    description: 'Book a walkthrough, ask about implementation, or start planning your rollout.',
    icon: Phone,
    color: '#2563eb',
    bullets: ['Product walkthrough', 'Implementation guidance', 'Trial and onboarding support']
  },
  'book-a-demo': {
    eyebrow: 'Book a Demo',
    title: 'See CIIS running your company workflows live.',
    description: 'Schedule a guided demo for attendance, payroll, tasks, CRM, clients and reporting.',
    icon: MonitorSmartphone,
    color: '#2563eb',
    bullets: ['Live product walkthrough', 'Use-case based demo', 'Rollout recommendations']
  },
  'start-trial': {
    eyebrow: 'Start Trial',
    title: 'Start your CIIS rollout with a guided trial.',
    description: 'Explore the platform with core company modules and mobile access.',
    icon: Sparkles,
    color: '#10b981',
    bullets: ['Trial-ready setup', 'No-code onboarding', 'Employee mobile app access']
  },
  'privacy-policy': {
    eyebrow: 'Privacy Policy',
    title: 'Privacy-first handling for company and workforce data.',
    description: 'CIIS is designed around responsible access, operational visibility and secure company data handling.',
    icon: Lock,
    color: '#0f172a',
    bullets: ['Role-based access', 'Operational audit trails', 'Secure data workflows']
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Clear terms for using CIIS Network services.',
    description: 'Review platform usage expectations, account responsibilities and service boundaries.',
    icon: FileText,
    color: '#334155',
    bullets: ['Account responsibility', 'Service usage guidelines', 'Operational continuity']
  },
  'design-system': {
    eyebrow: 'Design System',
    title: 'A consistent product language across CIIS pages and modules.',
    description: 'The premium UI system uses clear cards, crisp status states and enterprise-grade navigation.',
    icon: Sparkles,
    color: '#4f46e5',
    bullets: ['Unified visual language', 'Consistent status badges', 'Responsive layouts']
  },
  'project-report': {
    eyebrow: 'Project Report',
    title: 'Track project outcomes, status and delivery performance.',
    description: 'Review milestones, ownership, delays and progress from one reporting view.',
    icon: BarChart3,
    color: '#ea580c',
    bullets: ['Project performance', 'Milestone reporting', 'Delivery accountability']
  },
  'homepage-mobile': {
    eyebrow: 'Mobile Homepage',
    title: 'CIIS marketing and app workflows optimized for mobile visitors.',
    description: 'A compact experience for quick demos, trial starts and app downloads.',
    icon: MonitorSmartphone,
    color: '#2563eb',
    image: '/mobile-app-preview.png',
    bullets: ['Mobile-first content', 'Fast CTA access', 'App download journey']
  },
  'pages-mobile': {
    eyebrow: 'Mobile Pages',
    title: 'Mobile-ready page layouts for every CIIS product module.',
    description: 'Module content remains readable, actionable and responsive across small screens.',
    icon: MonitorSmartphone,
    color: '#0891b2',
    image: '/mobile-app-preview.png',
    bullets: ['Responsive sections', 'Touch-friendly CTAs', 'Compact module cards']
  },
  leadform: {
    eyebrow: 'Lead Form',
    title: 'Capture demo and trial interest from one connected form.',
    description: 'Collect company context and route interest into your sales and support process.',
    icon: FileText,
    color: '#2563eb',
    bullets: ['Company lead capture', 'Demo intent', 'Follow-up ready details']
  }
};

export const premiumPageRoutes = [
  ['product-overview', '/product-overview'],
  ['people', '/people'],
  ['work', '/work'],
  ['clients', '/clients'],
  ['insights', '/insights'],
  ['employee-management', '/employee-management'],
  ['attendance', '/attendance'],
  ['shift-management', '/shift-management'],
  ['leave-management', '/leave-management'],
  ['payroll', '/payroll'],
  ['asset-management', '/asset-management'],
  ['task-management', '/task-management'],
  ['project-management', '/project-management'],
  ['meetings', '/meetings'],
  ['chat', '/chat'],
  ['alerts', '/alerts'],
  ['client-management', '/client-management'],
  ['support', '/support'],
  ['pricing', '/pricing'],
  ['compare', '/compare'],
  ['contact', '/contact'],
  ['book-a-demo', '/book-a-demo'],
  ['start-trial', '/start-trial'],
  ['privacy-policy', '/privacy-policy'],
  ['terms', '/terms'],
  ['design-system', '/design-system'],
  ['project-report', '/project-report'],
  ['homepage-mobile', '/homepage-mobile'],
  ['pages-mobile', '/pages-mobile'],
  ['leadform', '/leadform']
];

const defaultPage = pageCatalog['product-overview'];

const relatedPages = [
  ['people', '/people'],
  ['work', '/work'],
  ['clients', '/clients'],
  ['insights', '/insights']
];

export default function PremiumMarketingPage({ pageKey = 'product-overview' }) {
  const page = pageCatalog[pageKey] || defaultPage;
  const Icon = page.icon || Sparkles;
  const stats = page.stats || [['Web', 'Platform'], ['Mobile', 'App'], ['Secure', 'Cloud']];

  return (
    <div className="pm-page">
      <HomeHeader />
      <main>
        <section className="pm-hero">
          <div className="pm-shell pm-hero-grid">
            <div className="pm-hero-copy">
              <div className="pm-eyebrow"><Icon size={16} /> {page.eyebrow}</div>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
              <div className="pm-actions">
                <a className="pm-btn pm-btn-primary" href="/book-a-demo">Book a Demo <ArrowRight size={17} /></a>
                <a className="pm-btn pm-btn-secondary" href="/start-trial">Start Trial</a>
              </div>
            </div>
            <div className="pm-visual" style={{ '--pm-accent': page.color }}>
              <div className="pm-browser">
                <div className="pm-browser-top"><span></span><span></span><span></span><b>CIIS Network</b></div>
                {page.image ? (
                  <img src={page.image} alt={`${page.eyebrow} preview`} />
                ) : (
                  <div className="pm-mock">
                    <Icon size={42} />
                    <h2>{page.eyebrow}</h2>
                    <div className="pm-mock-lines">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="pm-section">
          <div className="pm-shell pm-stats">
            {stats.map(([value, label]) => (
              <div className="pm-stat" key={`${value}-${label}`}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pm-section pm-light">
          <div className="pm-shell pm-content-grid">
            <div>
              <span className="pm-kicker">What this page includes</span>
              <h2>Integrated from the premium CIIS page set.</h2>
              <p>All ZIP page concepts are now available as real app routes with shared CIIS header, footer, responsive layout and conversion actions.</p>
            </div>
            <div className="pm-card-stack">
              {page.bullets.map((bullet) => (
                <div className="pm-feature-card" key={bullet}>
                  <CheckCircle2 size={20} />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {page.pricing && (
          <section className="pm-section">
            <div className="pm-shell pm-pricing">
              {['Starter', 'Growth', 'Enterprise'].map((plan, index) => (
                <div className="pm-price-card" key={plan}>
                  <span>{plan}</span>
                  <strong>{index === 0 ? 'Launch' : index === 1 ? 'Scale' : 'Custom'}</strong>
                  <p>{index === 0 ? 'For first rollout.' : index === 1 ? 'For growing teams.' : 'For multi-branch companies.'}</p>
                  <a href="/book-a-demo">Talk to sales</a>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pm-section">
          <div className="pm-shell">
            <div className="pm-section-head">
              <span className="pm-kicker">Explore connected pages</span>
              <h2>Move across the full CIIS website set.</h2>
            </div>
            <div className="pm-related-grid">
              {relatedPages.map(([key, href]) => {
                const item = pageCatalog[key];
                const RelatedIcon = item.icon;
                return (
                  <a className="pm-related-card" href={href} key={key}>
                    <RelatedIcon size={22} />
                    <strong>{item.eyebrow}</strong>
                    <span>{item.description}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pm-final">
          <div className="pm-shell pm-final-inner">
            <AlertTriangle size={22} />
            <div>
              <h2>Ready to connect your company operations?</h2>
              <p>Book a CIIS walkthrough and see the right setup for your team.</p>
            </div>
            <a className="pm-btn pm-btn-primary" href="/book-a-demo">Request Demo <ArrowRight size={17} /></a>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
