// src/context/NotificationContext.js
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './SocketContext';
import '../components/notifications.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const recentToastKeys = useRef(new Set());
  const { onNewNotification = () => () => {} } = useSocket();

  const showToast = useCallback((message, type = 'info', duration = 3000, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toastContent = typeof message === 'object' && message !== null
      ? message
      : { message };

    setToasts(prev => [...prev, { id, type, ...toastContent, ...options }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = onNewNotification((notification = {}) => {
      const toastKey = String(
        notification._id ||
        notification.id ||
        `${notification.title || ''}:${notification.message || notification.body || ''}`
      );

      if (recentToastKeys.current.has(toastKey)) {
        return;
      }

      recentToastKeys.current.add(toastKey);
      setTimeout(() => {
        recentToastKeys.current.delete(toastKey);
      }, 5000);

      showToast(
        {
          title: notification.title || notification.notificationTitle || 'New notification',
          message: notification.message || notification.body || notification.description || 'You have a new update',
        },
        notification.type === 'error' ? 'error' : 'info',
        6000
      );
    });

    return () => {
      unsubscribe?.();
    };
  }, [onNewNotification, showToast]);

  const value = {
    toasts,
    showToast,
    removeToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer />
    </NotificationContext.Provider>
  );
};

// Simple Toast Component
const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
          <div className="toast-content">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
          </div>
          <button className="toast-close" type="button" aria-label="Close notification" onClick={() => removeToast(toast.id)}>
            x
          </button>
        </div>
      ))}
    </div>
  );
};
