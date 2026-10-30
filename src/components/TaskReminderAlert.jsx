import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { prepareReminderAlerts, getReminderTaskId } from '../utils/taskReminderAlerts';
import './taskReminderAlert.css';

export default function TaskReminderAlert({ reminders, notification, remaining, onDismiss }) {
  const navigate = useNavigate();
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  const activeReminders = useMemo(() => {
    if (Array.isArray(reminders) && reminders.length > 0) {
      return reminders;
    }
    if (notification) {
      return [notification];
    }
    return [];
  }, [reminders, notification]);

  useEffect(() => {
    setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, [activeReminders]);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onDismiss?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  if (activeReminders.length === 0) return null;

  const isMultiple = activeReminders.length > 1;
  const singleReminder = activeReminders[0];

  const handleViewTask = () => {
    if (isMultiple) {
      navigate('/ciisUser/task-management');
    } else {
      const taskId = getReminderTaskId(singleReminder);
      if (taskId) {
        navigate(`/ciisUser/task-management?taskId=${encodeURIComponent(taskId)}`);
      } else {
        navigate('/ciisUser/task-management');
      }
    }
    onDismiss?.();
  };

  return (
    <div className="global-reminder-overlay" onClick={e => { if (e.target === e.currentTarget) onDismiss?.(); }}>
      <section
        className="global-reminder-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="global-reminder-title"
        aria-describedby="global-reminder-body"
      >
        <div className="global-reminder-icon" aria-hidden="true">⏰</div>

        {isMultiple ? (
          <>
            <h2 id="global-reminder-title">{activeReminders.length} tasks due</h2>
            <div id="global-reminder-body" className="global-reminder-list-container">
              <ul className="global-reminder-list">
                {activeReminders.map((rem, idx) => {
                  const taskTitle = rem.data?.taskTitle || rem.title || `Task #${idx + 1}`;
                  const taskMessage = rem.message || rem.body || '';
                  return (
                    <li key={rem._id || rem.id || rem.data?.taskId || idx} className="global-reminder-list-item">
                      <span className="global-reminder-item-title">{taskTitle}</span>
                      {taskMessage && <span className="global-reminder-item-desc">{taskMessage}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <>
            <h2 id="global-reminder-title">{singleReminder.title || 'Task Reminder'}</h2>
            <p id="global-reminder-body">{singleReminder.message || singleReminder.body || 'Your task reminder is due.'}</p>
            {remaining > 0 && <small>{remaining} more reminder(s)</small>}
          </>
        )}

        {permission === 'denied' && (
          <small className="global-reminder-blocked">
            Notifications are blocked. Allow them in your browser settings for sound and system alerts.
          </small>
        )}
        {permission === 'default' && (
          <button
            type="button"
            className="global-reminder-enable"
            onClick={async () => {
              await prepareReminderAlerts();
              setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
            }}
          >
            Enable notification &amp; sound
          </button>
        )}

        <div className="global-reminder-actions">
          <button type="button" autoFocus onClick={onDismiss}>Dismiss</button>
          <button type="button" className="global-reminder-open" onClick={handleViewTask}>View Task</button>
        </div>
      </section>
    </div>
  );
}
