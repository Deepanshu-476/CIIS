import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {prepareReminderAlerts} from '../utils/taskReminderAlerts';
import './taskReminderAlert.css';

export default function TaskReminderAlert({notification, remaining, onDismiss}) {
  const navigate = useNavigate();
  const [permission, setPermission] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  useEffect(() => {
    setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, [notification]);
  if (!notification) return null;
  return (
    <div className="global-reminder-overlay">
      <section className="global-reminder-card" role="alertdialog" aria-modal="true" aria-labelledby="global-reminder-title" aria-describedby="global-reminder-body" onKeyDown={event => {if (event.key === 'Escape') onDismiss();}}>
        <div className="global-reminder-icon" aria-hidden="true">⏰</div>
        <h2 id="global-reminder-title">{notification.title || 'Task Reminder'}</h2>
        <p id="global-reminder-body">{notification.message || notification.body || 'Your task reminder is due.'}</p>
        {remaining > 0 && <small>{remaining} more reminder(s)</small>}
        {permission === 'denied' && <small>Notifications are blocked. Allow them in your browser settings for sound and system alerts.</small>}
        {permission === 'default' && <button className="global-reminder-enable" onClick={async () => {await prepareReminderAlerts(); setPermission(Notification.permission);}}>Enable notification &amp; sound</button>}
        <div className="global-reminder-actions">
          <button autoFocus onClick={onDismiss}>Dismiss</button>
          <button className="global-reminder-open" onClick={() => {navigate('/ciisUser/task-management'); onDismiss();}}>View Task</button>
        </div>
      </section>
    </div>
  );
}
