import React from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Headphones,
  IndianRupee,
  PackageCheck,
  Smartphone,
  Users
} from 'lucide-react';

const featureServices = [
  {
    title: 'Employee Management',
    desc: 'Employee records, roles, departments and HR workflows in one connected portal.',
    href: '/employee-management',
    icon: Users
  },
  {
    title: 'Smart Attendance',
    desc: 'Geo-fenced punches, shift tracking, live presence and attendance automation.',
    href: '/smart-attendance',
    icon: CalendarCheck
  },
  {
    title: 'Leave Management',
    desc: 'Leave requests, approvals, holiday policies and balance tracking for teams.',
    href: '/leave-management',
    icon: Headphones
  },
  {
    title: 'Payroll Management',
    desc: 'Salary processing, payslips, deductions and payroll reports linked with attendance.',
    href: '/payroll-management',
    icon: IndianRupee
  },
  {
    title: 'Asset Management',
    desc: 'Track devices, allocations, returns, handovers and branch-level asset inventory.',
    href: '/asset-management',
    icon: PackageCheck
  },
  {
    title: 'Mobile Employee App',
    desc: 'Mobile attendance, tasks, alerts, leaves and employee self-service access.',
    href: '/mobile-app',
    icon: Smartphone
  }
];

const FeatureMegaMenu = () => (
  <li className="ciis-nav-item-mega">
    <a href="/features" className="ciis-nav-link ciis-nav-link-with-caret">
      Features
      <ArrowRight size={13} className="ciis-nav-caret" aria-hidden="true" />
    </a>

    <div className="ciis-feature-mega" role="menu" aria-label="Feature menu">
      <div className="ciis-feature-mega-main">
        <div className="ciis-feature-mega-grid">
          {featureServices.map((service) => {
            const Icon = service.icon;
            return (
              <a className="ciis-feature-service-card" href={service.href} key={service.title}>
                <span className="ciis-feature-mega-icon"><Icon size={19} aria-hidden="true" /></span>
                <div className="ciis-feature-service-copy">
                  <strong>{service.title}</strong>
                  <span>{service.desc}</span>
                </div>
              </a>
            );
          })}
        </div>

        <div className="ciis-feature-mega-footer">
          <a href="/features">All services <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
      </div>
    </div>
  </li>
);

export default FeatureMegaMenu;
