import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import './CIISLandingPage.css';
import './OperationsPages.css';
import {
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  Calculator,
  CheckCircle2,
  FileText,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const PAYROLL_PILLARS = [
  {
    icon: Calculator,
    tag: 'SALARY CALCULATION',
    title: 'Attendance-Linked Payroll Processing',
    desc: 'Convert verified attendance, approved leaves, overtime, late marks, and deductions into accurate monthly salary calculations.',
    bullets: [
      'Working-day and fixed-month salary policies',
      'Leave, half-day, late mark, and overtime adjustments',
      'Department-wise payroll review before finalization'
    ],
    accent: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    icon: ReceiptText,
    tag: 'PAYSLIPS',
    title: 'Professional Payslip Generation',
    desc: 'Generate structured payslips with earnings, deductions, net pay, attendance basis, and company details ready for employee download.',
    bullets: [
      'PDF payslips for every payroll cycle',
      'Employee self-service payslip access',
      'Clear earnings and deductions breakdown'
    ],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    icon: Banknote,
    tag: 'DISBURSEMENT READY',
    title: 'Payroll Review & Payout Preparation',
    desc: 'Prepare salary data for disbursement with clean approvals, employee bank information, and payroll summaries.',
    bullets: [
      'Final review before payroll locking',
      'Bank-ready salary summaries',
      'Admin visibility into monthly payroll cost'
    ],
    accent: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)'
  },
  {
    icon: FileText,
    tag: 'REPORTING',
    title: 'Payroll Reports & Compliance Records',
    desc: 'Track payroll expenses, employee payouts, deductions, reimbursements, and historical salary records for audits.',
    bullets: [
      'Monthly payroll reports for leadership',
      'Employee-wise salary history',
      'Export-ready operational payroll records'
    ],
    accent: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)'
  }
];

const PAYROLL_STEPS = [
  { num: '01', title: 'Attendance & Leave Inputs', desc: 'CIIS collects verified attendance, approved leaves, overtime, and deduction inputs.', color: '#2563eb' },
  { num: '02', title: 'Salary Computation', desc: 'Payroll rules calculate gross salary, deductions, net pay, and payout summaries.', color: '#7c3aed' },
  { num: '03', title: 'Payslip & Reports', desc: 'Admins finalize payroll and employees receive clean payslips with full breakdown.', color: '#10b981' }
];

export default function PayrollManagementPage() {
  return (
    <div className="ciis-op-page">
      <HomeHeader />

      <main className="ciis-op-main">
        <section className="ciis-op-hero theme-crm">
          <div className="ciis-op-container">
            <div className="ciis-badge">
              <IndianRupee size={14} />
              <span>PAYROLL MANAGEMENT</span>
            </div>
            <h1 className="ciis-op-title">
              Salary Processing, Payslips, Deductions &{' '}
              <span className="ciis-gradient-orange">Payroll Reports</span>
            </h1>
            <p className="ciis-op-subtitle">
              CIIS connects attendance, leaves, overtime, salary structures, deductions,
              payslips, and payroll reports into a single monthly payroll workflow.
            </p>
            <div className="ciis-op-hero-actions">
              <Link to="/RegisterCompany" className="ciis-btn ciis-btn-primary">
                Start Payroll Trial
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="ciis-btn ciis-btn-secondary">
                Book Payroll Demo
              </Link>
            </div>
            <div className="ciis-op-hero-trust">
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Attendance-Linked Salary</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>PDF Payslips</span></div>
              <div className="ciis-op-trust-item"><CheckCircle2 size={15} color="#10b981" /><span>Payroll Reports</span></div>
            </div>
          </div>
        </section>

        <section className="ciis-op-features-section">
          <div className="ciis-op-container">
            <div className="ciis-op-section-header">
              <div className="ciis-badge">
                <BadgeIndianRupee size={14} />
                <span>PAYROLL CONTROL</span>
              </div>
              <h2 className="ciis-section-title">Run Monthly Payroll Without Spreadsheet Chaos</h2>
              <p className="ciis-section-subtitle">
                Give HR and finance a clean payroll workflow backed by attendance and leave data.
              </p>
            </div>

            <div className="ciis-op-grid-4">
              {PAYROLL_PILLARS.map((pillar) => {
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
                <ShieldCheck size={14} />
                <span>MONTH-END FLOW</span>
              </div>
              <h2 className="ciis-section-title">From Attendance Logs to Final Payslips</h2>
              <p className="ciis-section-subtitle">
                Reduce payroll cycle time with structured inputs, clear reviews, and automated outputs.
              </p>
            </div>

            <div className="ciis-op-deep-box">
              <div className="ciis-op-steps-flow">
                {PAYROLL_STEPS.map((step) => (
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
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#2563eb' }}>1-Click</div><div className="ciis-op-stat-label">Payroll Processing</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#10b981' }}>PDF</div><div className="ciis-op-stat-label">Employee Payslips</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#7c3aed' }}>Clean</div><div className="ciis-op-stat-label">Salary Reports</div></div>
                <div className="ciis-op-stat-card"><div className="ciis-op-stat-value" style={{ color: '#ea580c' }}>Zero</div><div className="ciis-op-stat-label">Manual Reconciliation</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="ciis-op-cta-section">
          <div className="ciis-op-container">
            <div className="ciis-op-cta-box">
              <div className="ciis-badge ciis-badge-dark" style={{ marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>PAYROLL SIMPLIFIED</span>
              </div>
              <h2>Ready to automate monthly salary processing?</h2>
              <p>Use CIIS to calculate salaries, generate payslips, and keep payroll reports ready for review.</p>
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
