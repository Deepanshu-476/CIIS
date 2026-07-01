
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SYSTEM_NOTIFICATION_EVENTS = ['notification:new', 'new_notification'];
const PORTAL_DESKTOP_EVENTS = [
  'attendance:marked',
  'leave:new',
  'leave:status_changed',
  'leave:deleted',
  'client-meeting:new',
  'client_meeting_new',
  'client-meeting:updated',
  'client-meeting:deleted',
];

const getDesktopNotificationContent = (payload = {}, eventName = '') => {
  const titleByEvent = {
    'attendance:marked': 'Attendance Update',
    'leave:new': 'New Leave Request',
    'leave:status_changed': 'Leave Status Updated',
    'leave:deleted': 'Leave Deleted',
    'client-meeting:new': 'New Client Meeting',
    'client_meeting_new': 'New Client Meeting',
    'client-meeting:updated': 'Client Meeting Updated',
    'client-meeting:deleted': 'Client Meeting Deleted',
  };

  const data = payload.data || {};
  const task = payload.task || payload.relatedTask || data.task || data.leave || {};
  const title =
    payload.title ||
    payload.notificationTitle ||
    titleByEvent[eventName] ||
    (payload.type?.includes?.('task') ? 'Task Update' : 'CIIS Network');

  const body =
    payload.message ||
    payload.body ||
    payload.description ||
    data.message ||
    task.title ||
    task.name ||
    'You have a new notification';

  return {
    id: payload._id || payload.id || data._id || data.id,
    title,
    body,
    type: payload.type || eventName,
    targetPath: payload.targetPath || data.targetPath,
  };
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('⚠️ useSocket must be used within SocketProvider - returning dummy functions');
    
    return {
      isConnected: false,
      notifications: [],
      unreadCount: 0,
      markAsRead: () => Promise.resolve(),
      joinLeaveRoom: () => {},  
      leaveLeaveRoom: () => {},
      onNewLeave: () => () => {},
      onLeaveStatusChanged: () => () => {},
      onLeaveDeleted: () => () => {},
      onNewNotification: () => () => {},
      socket: socketService.socket
    };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  void 0;
  void 0;
  
  const { user, token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const recentDesktopNotificationKeys = useRef(new Set());

  const showDesktopNotification = useCallback((payload = {}, eventName = 'notification:new') => {
    const desktopNotification = getDesktopNotificationContent(payload, eventName);
    const dedupeKey = String(
      desktopNotification.id ||
      `${desktopNotification.type}:${desktopNotification.title}:${desktopNotification.body}`
    );

    if (recentDesktopNotificationKeys.current.has(dedupeKey)) {
      return;
    }

    recentDesktopNotificationKeys.current.add(dedupeKey);
    setTimeout(() => {
      recentDesktopNotificationKeys.current.delete(dedupeKey);
    }, 5000);

    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(desktopNotification);
      return;
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const browserNotif = new Notification(desktopNotification.title, {
          body: desktopNotification.body,
          icon: '/vite.svg'
        });

        browserNotif.onclick = () => {
          window.focus();
        };
      } catch (notifError) {
        console.error('âŒ Failed to show browser notification:', notifError);
      }
    }
  }, []);

  
  useEffect(() => {
    void 0;
  }, [isAuthenticated, user, token, connectionAttempts, retryCount]);

  
  useEffect(() => {
    
    if (isAuthenticated && user && !token) {
      void 0;
      
      
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        void 0;
        void 0;
        
        
        setTimeout(() => {
          void 0;
          setRetryCount(prev => prev + 1);
          socketService.connect(storedToken);
        }, 1000);
      } else {
        void 0;
        void 0;
      }
      
      
      const interval = setInterval(() => {
        const checkToken = localStorage.getItem('token');
        if (checkToken) {
          void 0;
          void 0;
          setRetryCount(prev => prev + 1);
          socketService.connect(checkToken);
          clearInterval(interval);
        } else {
          void 0;
        }
      }, 1000);
      
      
      const timeout = setTimeout(() => {
        clearInterval(interval);
        void 0;
      }, 15000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isAuthenticated, user, token]);

  
  useEffect(() => {
    void 0;

    if (!isAuthenticated) {
      void 0;
      return;
    }

    if (!user) {
      void 0;
      return;
    }

    if (!token) {
      void 0;
      return;
    }

    void 0;
    void 0;
    void 0;
    void 0;
    void 0;
    
    
    setConnectionAttempts(prev => prev + 1);
    
    try {
      
      void 0;
      const socket = socketService.connect(token);

      if (!socket) {
        console.error('❌ socketService.connect() returned null or undefined');
        return;
      }

      void 0;

      
      socket.on('connect', () => {
        void 0;
        void 0;
        void 0;
        setIsConnected(true);
        setConnectionAttempts(0); 
      });
      
      socket.on('disconnect', (reason) => {
        void 0;
        void 0;
        void 0;
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('%c❌❌❌ Socket connection error', 'color: red; font-size: 16px');
        console.error('🔍 Error message:', error.message);
        void 0;
        setIsConnected(false);
      });

      socket.on('reconnect', (attemptNumber) => {
        void 0;
        void 0;
        setIsConnected(true);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        void 0;
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error.message);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌❌❌ Failed to reconnect after all attempts');
      });

      
      const handleSystemNotification = (notification = {}, eventName = 'notification:new') => {
        void 0;
        void 0;

        showDesktopNotification(notification, eventName);
        
        setNotifications(prev => {
          const updated = [notification, ...prev];
          void 0;
          return updated;
        });
        
        setUnreadCount(prev => {
          const newCount = prev + 1;
          void 0;
          return newCount;
        });
        
      };

      SYSTEM_NOTIFICATION_EVENTS.forEach((eventName) => {
        socket.on(eventName, (notification) => handleSystemNotification(notification, eventName));
      });

      PORTAL_DESKTOP_EVENTS.forEach((eventName) => {
        socket.on(eventName, (payload = {}) => {
          void 0;
          void 0;
          showDesktopNotification(payload, eventName);
        });
      });

      
      socket.on('notification:unread_count', (count) => {
        void 0;
        setUnreadCount(count);
      });

      
      socket.on('leave:new', (data) => {
        void 0;
        void 0;
      });

      socket.on('leave:status_changed', (data) => {
        void 0;
        void 0;
      });

      socket.on('leave:deleted', (data) => {
        void 0;
        void 0;
      });

      
      void 0;
      socketService.getUnreadCount()
        .then(count => {
          void 0;
          setUnreadCount(count);
        })
        .catch(err => {
          console.error('❌ Error getting unread count:', err);
        });

      
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        void 0;
        Notification.requestPermission().then(permission => {
          void 0;
        });
      } else if (typeof Notification !== 'undefined') {
        void 0;
      }

      
      setTimeout(() => {
        void 0;
      }, 2000);

      
      setTimeout(() => {
        void 0;
      }, 5000);

    } catch (error) {
      console.error('%c❌❌❌ EXCEPTION in socket connection', 'color: red; font-size: 16px');
      console.error('Error:', error);
      console.error('Error stack:', error.stack);
    }

    
    return () => {
      void 0;
      void 0;
      void 0;
      socketService.removeAllListeners();
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user, token, showDesktopNotification]);

  
  const handleNewLeave = useCallback((callback) => {
    void 0;
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot set up leave:new listener');
      return () => {};
    }
    
    socketService.socket.on('leave:new', callback);
    void 0;
    
    return () => {
      void 0;
      socketService.socket?.off('leave:new', callback);
    };
  }, []);

  const handleLeaveStatusChanged = useCallback((callback) => {
    void 0;
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot set up leave:status_changed listener');
      return () => {};
    }
    
    socketService.socket.on('leave:status_changed', callback);
    void 0;
    
    return () => {
      void 0;
      socketService.socket?.off('leave:status_changed', callback);
    };
  }, []);

  const handleLeaveDeleted = useCallback((callback) => {
    void 0;
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot set up leave:deleted listener');
      return () => {};
    }
    
    socketService.socket.on('leave:deleted', callback);
    void 0;
    
    return () => {
      void 0;
      socketService.socket?.off('leave:deleted', callback);
    };
  }, []);

  const handleNewNotification = useCallback((callback) => {
    void 0;

    let disposed = false;
    let cleanup = () => {};

    const attach = () => {
      if (disposed) return true;
      if (!socketService.socket) return false;

      socketService.socket.on('notification:new', callback);
      socketService.socket.on('new_notification', callback);
      void 0;
      cleanup = () => {
        socketService.socket?.off('notification:new', callback);
        socketService.socket?.off('new_notification', callback);
      };
      return true;
    };

    if (!attach()) {
      const retry = setInterval(() => {
        if (attach()) clearInterval(retry);
      }, 300);

      cleanup = () => clearInterval(retry);
    }

    return () => {
      disposed = true;
      cleanup();
    };
  }, [isConnected]);

  
  const joinLeaveRoom = useCallback((leaveId) => {
    void 0;
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot join room');
      return;
    }
    
    if (!leaveId) {
      console.warn('⚠️ No leaveId provided to join room');
      return;
    }
    
    socketService.socket.emit('leave:join', leaveId);
    void 0;
  }, []);

  const leaveLeaveRoom = useCallback((leaveId) => {
    void 0;
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot leave room');
      return;
    }
    
    socketService.socket.emit('leave:leave', leaveId);
    void 0;
  }, []);

  
  const markAsRead = useCallback(async (notificationId) => {
    void 0;
    try {
      const result = await socketService.markNotificationRead(notificationId);
      void 0;
      
      setNotifications(prev => {
        const updated = prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        void 0;
        return updated;
      });
      
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        void 0;
        return newCount;
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to mark as read:', error);
      return false;
    }
  }, []);

  
  const value = {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    joinLeaveRoom,
    leaveLeaveRoom,
    onNewLeave: handleNewLeave,
    onLeaveStatusChanged: handleLeaveStatusChanged,
    onLeaveDeleted: handleLeaveDeleted,
    onNewNotification: handleNewNotification,
    socket: socketService.socket
  };

  void 0;

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
