import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Globe,
  Headphones,
  PhoneCall,
  Settings,
  Smartphone,
  Users
} from 'lucide-react';

const featureServices = [
  {
    title: 'Workforce Suite',
    desc: 'Employees, attendance, leaves and HR workflows in one connected portal.',
    href: '/employee-management',
    icon: Users
  },
  {
    title: 'Sales CRM',
    desc: 'Lead capture, telecalling, follow-ups and pipeline tracking for sales teams.',
    href: '/crm-telecaller',
    icon: BarChart3
  },
  {
    title: 'Dialers & Calling',
    desc: 'Auto dialer, telecaller app and cloud calling tools for daily outreach.',
    href: '/call-management',
    icon: PhoneCall
  },
  {
    title: 'Call Center Operations',
    desc: 'Monitor calling teams, assign work and manage customer conversations.',
    href: '/features#call-center',
    icon: Headphones
  },
  {
    title: 'Tracking & Recording',
    desc: 'Call tracking, recordings, transcriptions and AI summaries for quality review.',
    href: '/features#call-tracking',
    icon: Settings
  },
  {
    title: 'Business Automation',
    desc: 'Automate tasks, projects, approvals and repeatable business workflows.',
    href: '/business-automation',
    icon: Bot
  },
  {
    title: 'Team Communication',
    desc: 'Company chat, groups, updates and employee collaboration channels.',
    href: '/team-communication',
    icon: Globe
  },
  {
    title: 'Mobile Employee App',
    desc: 'Mobile-first attendance, tasks, alerts and employee self-service access.',
    href: '/features#mobile-app',
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
