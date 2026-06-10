import React from 'react';
import { FiBell, FiCheckCircle, FiMail } from 'react-icons/fi';
import './NotificationsPage.css';

const notifications = [
  { title: 'Invoice INV-1031 due in 3 days', time: '15 mins ago', type: 'Billing' },
  { title: 'Support ticket CT-457 updated', time: '1 hr ago', type: 'Support' },
  { title: 'New proposal delivered for review', time: '4 hrs ago', type: 'Operations' },
  { title: 'Monthly report available', time: 'Yesterday', type: 'Report' }
];

const NotificationsPage = () => (
  <section className="ClientPageBase-root">
    <div className="ClientPageBase-header">
      <div>
        <p>Notifications</p>
        <h1>Real-time updates from your service team</h1>
      </div>
      <button>Mark all as read</button>
    </div>

    <section className="ClientPageBase-card ClientPageBase-notifications-card">
      {notifications.map((item) => (
        <div key={item.title} className="ClientPageBase-notification-item">
          <div className="ClientPageBase-notification-icon"><FiBell /></div>
          <div>
            <strong>{item.title}</strong>
            <p>{item.type}</p>
          </div>
          <span>{item.time}</span>
        </div>
      ))}
    </section>
  </section>
);

export default NotificationsPage;
