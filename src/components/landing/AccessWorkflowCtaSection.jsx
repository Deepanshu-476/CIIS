import React from 'react';
import {
  LuArrowDown,
  LuArrowRight,
  LuCrown,
  LuUserRound,
  LuUsers,
  LuUsersRound
} from 'react-icons/lu';
import './AccessWorkflowCtaSection.css';

const roles = [
  { title: 'Owner / Super Admin', description: 'Full control over all businesses, teams, users and reports.', icon: LuCrown, tone: 'amber' },
  { title: 'Manager', description: 'Access to assigned businesses, branches and departments.', icon: LuUsers, tone: 'green' },
  { title: 'Team Lead', description: 'Manage team tasks, attendance and daily operations.', icon: LuUsersRound, tone: 'orange' },
  { title: 'Employee', description: 'View own tasks, attendance, leaves and profile.', icon: LuUserRound, tone: 'blue' }
];

const steps = [
  { number: '1', title: 'Add Your Business', description: 'Create your business and set it up.' },
  { number: '2', title: 'Add Your Team', description: 'Invite employees and organise departments.' },
  { number: '3', title: 'Give Access', description: 'Assign roles and set permissions.' },
  { number: '4', title: 'Assign & Track Work', description: 'Assign tasks and track everything in real-time.' }
];

const RoleCard = ({ role }) => {
  const Icon = role.icon;
  return (
    <article className="awc-role-card">
      <span className={`awc-role-icon ${role.tone}`} aria-hidden="true"><Icon /></span>
      <div><h3>{role.title}</h3><p>{role.description}</p></div>
    </article>
  );
};

const WorkflowStep = ({ step }) => (
  <article className="awc-step-card">
    <b aria-hidden="true">{step.number}</b>
    <div><h3>{step.title}</h3><p>{step.description}</p></div>
  </article>
);

const AccessWorkflowCtaSection = ({ onBookDemo, onContactSales }) => (
  <section className="awc-section" aria-label="CIIS Network access and onboarding">
    <section className="awc-role-section" aria-labelledby="awc-role-heading">
      <header>
        <h2 id="awc-role-heading">Role-Based Access for Everyone</h2>
        <p>Everyone sees only what they are allowed to access.</p>
      </header>
      <div className="awc-role-grid">
        {roles.map((role) => <RoleCard key={role.title} role={role} />)}
      </div>
    </section>

    <section className="awc-workflow-section" aria-labelledby="awc-workflow-heading">
      <h2 id="awc-workflow-heading">How CIIS Network Works</h2>
      <div className="awc-workflow-list">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <WorkflowStep step={step} />
            {index < steps.length - 1 && (
              <span className="awc-step-arrow" aria-hidden="true"><LuArrowRight className="wide" /><LuArrowDown className="narrow" /></span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>

    <section className="awc-cta" aria-labelledby="awc-cta-heading">
      <div>
        <h2 id="awc-cta-heading">Ready to Simplify Your Business Operations?</h2>
        <p>See how CIIS Network can manage your employees, tasks and multiple businesses from one platform.</p>
      </div>
      <div className="awc-cta-actions">
        <button type="button" className="primary" onClick={onBookDemo}>Book Free Demo <LuArrowRight aria-hidden="true" /></button>
        <button type="button" className="secondary" onClick={onContactSales}>Contact Sales</button>
      </div>
    </section>
  </section>
);

export default AccessWorkflowCtaSection;
