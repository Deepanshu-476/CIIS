import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  PackageCheck,
  Laptop,
  QrCode,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Check,
  FileCheck,
  Building,
  AlertTriangle,
  History
} from 'lucide-react';

const ASSET_PILLARS = [
  {
    icon: Laptop,
    tag: 'HARDWARE REPOSITORY',
    title: 'Centralized IT & Office Asset Registry',
    desc: 'Keep exhaustive records of every company laptop, desktop workstation, monitor, phone, SIM card, and peripheral across all your physical branches and remote employees.',
    bullets: [
      'Comprehensive serial number, model, MAC address, and vendor tracking',
      'Categorized asset condition status (Brand New, Assigned, Repair, Retired)',
      'Bulk Excel/CSV asset upload with automatic duplicate serial detection'
    ],
    accent: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.1)'
  },
  {
    icon: FileCheck,
    tag: 'DIGITAL HANDOVER',
    title: 'Digital Handover Receipts & E-Signatures',
    desc: 'Never rely on fragile paper receipts. Generate instant digital handover forms with employee e-signatures and asset condition photos upon device allocation.',
    bullets: [
      'One-tap digital employee acknowledgement from their mobile app',
      'Photographic proof of asset physical condition at handover and return',
      'Downloadable PDF handover certificates stored in employee records'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: ShieldCheck,
    tag: 'EXIT CLEARANCE',
    title: 'Zero-Leakage Offboarding & Asset Recovery',
    desc: 'Prevent costly hardware loss during employee exits. IT and HR receive automated asset recovery checklists that must be cleared before final settlement.',
    bullets: [
      'Instant list of all assigned devices and accessories on resignation',
      'IT verification checklist (formatting, password reset, accessory return)',
      'Automated hold on final payroll settlement until all assets are recovered'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: AlertTriangle,
    tag: 'WARRANTY & AMC',
    title: 'Automated Warranty & AMC Renewal Alerts',
    desc: 'Stay ahead of equipment failures. Automated notifications alert IT admins months before manufacturer warranties, insurance policies, or AMCs expire.',
    bullets: [
      'Scheduled preventive maintenance reminders and service tickets',
      'Vendor contact and support SLA tracking for rapid repairs',
      'Device replacement schedule forecasting based on aging metrics'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  },
  {
    icon: Building,
    tag: 'BRANCH AUDITS',
    title: 'Multi-Branch & Remote Inventory Control',
    desc: 'Assign and transfer assets across different branches, offices, or remote work-from-home team members with a complete chain-of-custody transfer log.',
    bullets: [
      'Inter-branch hardware dispatch and courier tracking notes',
      'Branch-level asset managers with dedicated inventory quotas',
      'One-click physical asset verification audit reports'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: History,
    tag: 'FINANCIAL GOVERNANCE',
    title: 'Asset Depreciation & Capex Analytics',
    desc: 'Maintain financial accuracy for your balance sheet. Calculate straight-line or written-down asset depreciation and forecast upcoming hardware expenditures.',
    bullets: [
      'Automated book value depreciation calculation per asset class',
      'Disposal and scrap valuation tracking with salvage values',
      'Executive dashboard summarizing total company hardware investments'
    ],
    accent: '#059669',
    bg: 'rgba(5, 150, 105, 0.1)'
  }
];

const ASSET_STEPS = [
  {
    num: '01',
    title: 'Asset Ingestion & Tagging',
    desc: 'Log hardware specifications, purchase invoices, serial numbers, and assign unique asset tags.',
    color: '#0284c7'
  },
  {
    num: '02',
    title: 'Digital Allocation & E-Sign',
    desc: 'Assign device to employee with digital handover receipt and mobile self-service acknowledgement.',
    color: '#2563eb'
  },
  {
    num: '03',
    title: 'Continuous Health & Custody',
    desc: 'Track service histories, maintenance tickets, and warranty lifecycles in real time.',
    color: '#7c3aed'
  },
  {
    num: '04',
    title: 'Exit Verification & Recovery',
    desc: 'Checklist-driven return clearance ensuring 100% asset recovery before full-and-final settlement.',
    color: '#10b981'
  }
];

export default function AssetManagementPage() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        {/* HERO SECTION */}
        <section className="ciis-op-hero" style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(2, 132, 199, 0.09) 0%, rgba(248, 250, 252, 0) 70%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
        }}>
          <div className="ciis-op-container">
            <div className="ciis-badge" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.2)' }}>
              <PackageCheck size={14} />
              <span>ASSETS & HARDWARE GOVERNANCE</span>
            </div>

            <h1 className="ciis-op-title">
              Complete Visibility & Zero Leakage <br />
              <span className="ciis-gradient-text" style={{
                backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Enterprise Asset Management
              </span>
            </h1>

            <p className="ciis-op-subtitle">
              Eliminate lost laptops, unreturned hardware, and chaotic spreadsheets. Track company laptops, workstations, peripherals, digital handover receipts, warranty lifecycles, and exit clearance in one unified platform.
            </p>

            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary" style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                borderColor: '#0284c7'
              }}>
                Start Free Asset System Trial
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Request Asset Governance Demo
              </Link>
            </div>

            <div className="ciis-op-quick-trust">
              <span><Check size={14} color="#0284c7" /> Digital Handover E-Signatures</span>
              <span><Check size={14} color="#0284c7" /> Zero-Leakage Exit Clearance</span>
              <span><Check size={14} color="#0284c7" /> Multi-Branch Custody Logs</span>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION */}
        <section className="ciis-op-pillars-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <span className="ciis-op-eyebrow" style={{ color: '#0284c7' }}>ASSET GOVERNANCE</span>
              <h2>Protecting High-Value Company Hardware Across Branches</h2>
              <p>Built for modern enterprises managing equipment across multiple offices and remote home environments.</p>
            </div>

            <div className="ciis-op-pillars-grid">
              {ASSET_PILLARS.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div key={idx} className="ciis-op-card">
                    <div className="ciis-op-card-top">
                      <div className="ciis-op-card-icon" style={{ background: pillar.bg, color: pillar.accent }}>
                        <Icon size={24} />
                      </div>
                      <span className="ciis-op-card-tag" style={{ color: pillar.accent }}>{pillar.tag}</span>
                    </div>

                    <h3 className="ciis-op-card-title">{pillar.title}</h3>
                    <p className="ciis-op-card-desc">{pillar.desc}</p>

                    <ul className="ciis-op-bullets">
                      {pillar.bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>
                          <CheckCircle2 size={16} color={pillar.accent} className="ciis-bullet-icon" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WORKFLOW / STEP SECTION */}
        <section className="ciis-op-deep-dive">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <span className="ciis-op-eyebrow" style={{ color: '#0284c7' }}>CHAIN OF CUSTODY</span>
              <h2>Lifecycle Management from Onboarding to Exit</h2>
              <p>Transparent accountability at every step of an asset's journey.</p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {ASSET_STEPS.map((step, sIdx) => (
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
                  <div className="ciis-op-stat-value" style={{ color: '#0284c7' }}>100%</div>
                  <div className="ciis-op-stat-label">Hardware Audit Traceability</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#10b981' }}>0</div>
                  <div className="ciis-op-stat-label">Lost Laptops on Employee Exits</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>Paperless</div>
                  <div className="ciis-op-stat-label">Digital Handover Sign-Offs</div>
                </div>
                <div className="ciis-op-stat-card">
                  <div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>Real-Time</div>
                  <div className="ciis-op-stat-label">Warranty & AMC Expiration Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="ciis-op-cta-section">
          <div className="ciis-op-container">
            <div className="ciis-op-cta-box" style={{
              background: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0284c7 100%)'
            }}>
              <div className="ciis-badge ciis-badge-dark" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>COMPLETE ASSET SECURITY</span>
              </div>
              <h2>Ready to secure your company's IT assets?</h2>
              <p>
                Start your 30-day free trial and experience digital handovers, real-time serial tracking, and zero-leakage exit clearance.
              </p>
              <div className="ciis-op-cta-actions">
                <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                  Start Free 30-Day Trial
                  <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                  Talk to an Asset Specialist
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
