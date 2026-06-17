import React from 'react';
import { FiBell, FiBriefcase, FiMail, FiShield, FiSmartphone, FiUser } from 'react-icons/fi';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  calculatePaymentSummary,
  formatDate,
  getClientDisplayName,
  getUserDisplayName,
  useClientPortalData
} from '../../utils/clientPortalData';
import './AccountSettingsPage.css';

const AccountSettingsPage = () => {
  const { client, services, projectManagers, user, loading, error, refetch } = useClientPortalData();
  const payment = calculatePaymentSummary(client);
  const manager = projectManagers[0] || {};

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return <section className="ClientPageBase-root"><p>{error || 'No client data found.'}</p><button type="button" onClick={refetch}>Try Again</button></section>;
  }

  const cards = [
    {
      icon: <FiUser />,
      label: 'Profile',
      title: getClientDisplayName(client),
      text: `${client.email || user?.email || 'No email'}${client.phone ? ` • ${client.phone}` : ''}`
    },
    {
      icon: <FiBriefcase />,
      label: 'Company',
      title: client.company || client.companyName || 'Company profile',
      text: `${services.length} active service${services.length === 1 ? '' : 's'} assigned.`
    },
    {
      icon: <FiShield />,
      label: 'Subscription',
      title: payment.planName,
      text: `Renewal: ${formatDate(payment.nextDueDate)} • Price: ${payment.subscriptionPrice || 0}`
    },
    {
      icon: <FiBell />,
      label: 'Notifications',
      title: 'Service and billing alerts',
      text: 'Updates are based on your active tasks, payments, and services.'
    },
    {
      icon: <FiMail />,
      label: 'Account Manager',
      title: manager.name || 'Not assigned',
      text: `${manager.email || 'No email assigned'}${manager.phone ? ` • ${manager.phone}` : ''}`
    },
    {
      icon: <FiSmartphone />,
      label: 'Login User',
      title: getUserDisplayName(user),
      text: user?.companyRole || user?.role || 'Client account'
    }
  ];

  return (
    <section className="ClientPageBase-root">
      <div className="ClientPageBase-header">
        <div>
          <p>Account Settings</p>
          <h1>Manage {getClientDisplayName(client)} profile, security, and notifications</h1>
        </div>
      </div>

      <div className="ClientPageBase-grid ClientPageBase-settings-grid">
        {cards.map(card => (
          <article className="ClientPageBase-card" key={card.label}>
            <div className="ClientPageBase-card-icon">{card.icon}</div>
            <span>{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AccountSettingsPage;
