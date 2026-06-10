import React from 'react';
import { FiUser, FiShield, FiBell, FiMail, FiSmartphone } from 'react-icons/fi';
import './AccountSettingsPage.css';

const AccountSettingsPage = () => (
  <section className="ClientPageBase-root">
    <div className="ClientPageBase-header">
      <div>
        <p>Account Settings</p>
        <h1>Manage your profile, security, and notifications</h1>
      </div>
    </div>

    <div className="ClientPageBase-grid ClientPageBase-settings-grid">
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiUser /></div>
        <span>Profile</span>
        <h2>Update your contact details</h2>
        <p>Manage your name, email, and company profile in one place.</p>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiShield /></div>
        <span>Security</span>
        <h2>Protect your client account</h2>
        <p>Enable stronger security, session control, and password preferences.</p>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiBell /></div>
        <span>Notifications</span>
        <h2>Control alert preferences</h2>
        <p>Choose how you receive updates for tickets, invoices, and services.</p>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiMail /></div>
        <span>Communication</span>
        <h2>Set your preferred contact channels</h2>
        <p>Email, phone, or WhatsApp options for fast engagement.</p>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiSmartphone /></div>
        <span>Integrations</span>
        <h2>Connect with your business tools</h2>
        <p>Link your account to apps for seamless updates and reporting.</p>
      </article>
    </div>
  </section>
);

export default AccountSettingsPage;
