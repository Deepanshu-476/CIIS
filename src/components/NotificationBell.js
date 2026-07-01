
import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { openNotificationRoute } from '../utils/notificationNavigation';

const NotificationBell = () => {
  const { notifications, markAsRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const todayNotifications = notifications.filter(notification =>
    new Date(notification.createdAt || notification.updatedAt || Date.now()).toDateString() === new Date().toDateString()
  );
  const todayUnreadCount = todayNotifications.filter(notification => !notification.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_applied':
        return '📝';
      case 'leave_status_changed':
        return '🔄';
      case 'leave_deleted':
        return '🗑️';
      case 'task_overdue':
        return '⚠️';
      case 'attendance_absent':
        return '❌';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async notification => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setIsOpen(false);
    openNotificationRoute(navigate, notification);
  };

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {todayUnreadCount > 0 && (
          <span className="notification-badge">{todayUnreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="notification-list">
            {todayNotifications.length === 0 ? (
              <p className="no-notifications">No notifications for today</p>
            ) : (
              todayNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
