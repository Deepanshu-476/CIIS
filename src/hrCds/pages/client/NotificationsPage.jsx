import React from 'react';
import { FiBell, FiCheckCircle, FiClock, FiCreditCard, FiFileText } from 'react-icons/fi';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  calculatePaymentSummary,
  formatDate,
  getClientDisplayName,
  getTaskTitle,
  useClientPortalData
} from '../../utils/clientPortalData';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { client, services, tasks, loading, error, refetch } = useClientPortalData();
  const payment = calculatePaymentSummary(client);
  const notifications = [
    ...tasks.slice(0, 5).map(task => ({
      title: `${getTaskTitle(task)} ${task.completed ? 'completed' : 'updated'}`,
      time: formatDate(task.updatedAt || task.createdAt || task.dueDate),
      type: task.serviceName || 'Task',
      icon: task.completed ? <FiCheckCircle /> : <FiClock />
    })),
    ...(payment.nextDueDate ? [{
      title: `${payment.planName} renewal date is ${formatDate(payment.nextDueDate)}`,
      time: formatDate(payment.nextDueDate),
      type: 'Billing',
      icon: <FiCreditCard />
    }] : []),
    ...services.slice(0, 3).map(service => ({
      title: `${service} service is active for ${getClientDisplayName(client)}`,
      time: 'Current',
      type: 'Service',
      icon: <FiFileText />
    }))
  ].slice(0, 8);

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return <section className="ClientPageBase-root"><p>{error || 'No client data found.'}</p><button type="button" onClick={refetch}>Try Again</button></section>;
  }

  return (
    <section className="ClientPageBase-root">
      <div className="ClientPageBase-header">
        <div>
          <p>Notifications</p>
          <h1>Real-time updates for {getClientDisplayName(client)}</h1>
        </div>
        <button type="button">Mark all as read</button>
      </div>

      <section className="ClientPageBase-card ClientPageBase-notifications-card">
        {notifications.length ? notifications.map((item) => (
          <div key={`${item.title}-${item.time}`} className="ClientPageBase-notification-item">
            <div className="ClientPageBase-notification-icon">{item.icon || <FiBell />}</div>
            <div>
              <strong>{item.title}</strong>
              <p>{item.type}</p>
            </div>
            <span>{item.time}</span>
          </div>
        )) : (
          <div className="ClientPageBase-notification-item">
            <div className="ClientPageBase-notification-icon"><FiBell /></div>
            <div><strong>No updates yet</strong><p>{getClientDisplayName(client)}</p></div>
            <span>Now</span>
          </div>
        )}
      </section>
    </section>
  );
};

export default NotificationsPage;
