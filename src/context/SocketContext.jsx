// src/context/SocketContext.jsx - WITH COMPLETE CONSOLE LOGS + TOKEN RETRY
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
    // Return dummy functions
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
  console.log('🟢 SocketProvider initializing...');
  console.log('📅 Time:', new Date().toLocaleTimeString());
  
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

  // Log auth state on mount and when it changes
  useEffect(() => {
    console.log('📊 SocketProvider - Auth State:', {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!token,
      userName: user?.name || 'No user',
      userId: user?._id || 'No ID',
      connectionAttempts,
      retryCount,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [isAuthenticated, user, token, connectionAttempts, retryCount]);

  // ========== TOKEN RETRY MECHANISM ==========
  useEffect(() => {
    // If token not available yet, set up a retry mechanism
    if (isAuthenticated && user && !token) {
      console.log('🔄 Token not available in context, setting up retry...');
      
      // Try to get token from localStorage directly
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log('✅ Found token in localStorage manually:', !!storedToken);
        console.log('📦 Token value (first 20 chars):', storedToken.substring(0, 20) + '...');
        
        // Force reconnect with stored token
        setTimeout(() => {
          console.log('🔄 Retrying socket connection with stored token...');
          setRetryCount(prev => prev + 1);
          socketService.connect(storedToken);
        }, 1000);
      } else {
        console.log('❌ No token found in localStorage either');
        console.log('🔍 localStorage keys:', Object.keys(localStorage));
      }
      
      // Set up an interval to check for token
      const interval = setInterval(() => {
        const checkToken = localStorage.getItem('token');
        if (checkToken) {
          console.log('✅ Token became available! Connecting socket...');
          console.log('📦 Token value (first 20 chars):', checkToken.substring(0, 20) + '...');
          setRetryCount(prev => prev + 1);
          socketService.connect(checkToken);
          clearInterval(interval);
        } else {
          console.log('⏳ Still waiting for token...');
        }
      }, 1000);
      
      // Clear interval after 15 seconds to avoid infinite loop
      const timeout = setTimeout(() => {
        clearInterval(interval);
        console.log('⏰ Token retry timeout after 15 seconds');
      }, 15000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isAuthenticated, user, token]);

  // ========== FORCE RECONNECT IF TOKEN EXISTS ==========
  useEffect(() => {
    // Force reconnect if token exists but socket not connected
    const checkAndConnect = () => {
      const storedToken = localStorage.getItem('token');
      console.log('🔍 Force reconnect check:', {
        storedToken: !!storedToken,
        socketConnected: socketService.socket?.connected,
        isConnected,
        retryCount
      });

      
      if (storedToken && !socketService.socket?.connected) {
        console.log('🔄 Force reconnect - Token exists but socket not connected');
        console.log('📦 Using token:', storedToken.substring(0, 20) + '...');
        socketService.connect(storedToken);
      } else if (storedToken && socketService.socket?.connected) {
        console.log('✅ Socket already connected, no force reconnect needed');
        setIsConnected(true);
      }
    };
    
    // Check immediately
    checkAndConnect();
    
    // Check after 1, 2, 3, and 5 seconds
    const timeouts = [
      setTimeout(checkAndConnect, 1000),
      setTimeout(checkAndConnect, 2000),
      setTimeout(checkAndConnect, 3000),
      setTimeout(checkAndConnect, 5000)
    ];
    
    return () => timeouts.forEach(t => clearTimeout(t));
  }, [retryCount]);

  // Connect to socket when user is authenticated
  useEffect(() => {
    console.log('🔄 SocketProvider useEffect triggered with dependencies:', {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!token,
      timestamp: new Date().toLocaleTimeString()
    });

    if (!isAuthenticated) {
      console.log('⏳ Not authenticated yet, waiting...');
      return;
    }

    if (!user) {
      console.log('⏳ User not available yet, waiting...');
      return;
    }

    if (!token) {
      console.log('⏳ Token not available in context yet, waiting...');
      return;
    }

    console.log('🔌 All conditions met, attempting socket connection...');
    console.log('🔑 Token exists:', !!token);
    console.log('📦 Token value (first 20 chars):', token.substring(0, 20) + '...');
    console.log('👤 User:', user.name || user.email || 'Unknown');
    console.log('🆔 User ID:', user._id);
    
    // Increment connection attempts
    setConnectionAttempts(prev => prev + 1);
    
    try {
      // Connect to socket
      console.log('🔄 Calling socketService.connect() with token...');
      const socket = socketService.connect(token);

      if (!socket) {
        console.error('❌ socketService.connect() returned null or undefined');
        return;
      }

      console.log('✅ Socket instance obtained:', {
        id: socket.id || 'not connected yet',
        connected: socket.connected,
        auth: !!socket.auth,
        transport: socket.io?.engine?.transport?.name || 'unknown'
      });

      // Connection status handlers
      socket.on('connect', () => {
        console.log('%c✅✅✅ SOCKET CONNECTED SUCCESSFULLY! ID: ' + socket.id, 'color: green; font-size: 16px; font-weight: bold');
        console.log('%c🎉 Real-time updates are now active', 'color: blue; font-size: 14px');
        console.log('📊 Connection details:', {
          transport: socket.io?.engine?.transport?.name,
          connected: socket.connected,
          id: socket.id
        });
        setIsConnected(true);
        setConnectionAttempts(0); // Reset attempts on successful connection
      });
      
      socket.on('disconnect', (reason) => {
        console.log('%c❌❌❌ Socket disconnected', 'color: red; font-size: 16px');
        console.log('🔍 Disconnect reason:', reason);
        console.log('📊 Disconnect details:', {
          reason,
          wasConnected: isConnected,
          attempts: connectionAttempts,
          timestamp: new Date().toLocaleTimeString()
        });
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('%c❌❌❌ Socket connection error', 'color: red; font-size: 16px');
        console.error('🔍 Error message:', error.message);
        console.log('🔍 Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type
        });
        setIsConnected(false);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        console.log('✅ New socket ID:', socket.id);
        setIsConnected(true);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt #${attemptNumber}`);
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error.message);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌❌❌ Failed to reconnect after all attempts');
      });

      // Listen for new notifications
      const handleSystemNotification = (notification = {}, eventName = 'notification:new') => {
        console.log('%c📢📢📢 NEW NOTIFICATION RECEIVED', 'color: purple; font-size: 14px');
        console.log('📨 Notification details:', {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          id: notification._id,
          timestamp: new Date().toLocaleTimeString()
        });

        showDesktopNotification(notification, eventName);
        
        setNotifications(prev => {
          const updated = [notification, ...prev];
          console.log(`📊 Notification count: ${updated.length}`);
          return updated;
        });
        
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log(`🔔 Unread count increased to: ${newCount}`);
          return newCount;
        });
        
      };

      SYSTEM_NOTIFICATION_EVENTS.forEach((eventName) => {
        socket.on(eventName, (notification) => handleSystemNotification(notification, eventName));
      });

      PORTAL_DESKTOP_EVENTS.forEach((eventName) => {
        socket.on(eventName, (payload = {}) => {
          console.log(`%cPortal event received: ${eventName}`, 'color: teal; font-size: 14px');
          console.log('Portal event data:', payload);
          showDesktopNotification(payload, eventName);
        });
      });

      // Listen for unread count updates
      socket.on('notification:unread_count', (count) => {
        console.log(`📊 Unread count updated from server: ${count}`);
        setUnreadCount(count);
      });

      // Listen for leave events
      socket.on('leave:new', (data) => {
        console.log('%c📢 New leave event received', 'color: orange; font-size: 14px');
        console.log('📊 Leave data:', data);
      });

      socket.on('leave:status_changed', (data) => {
        console.log('%c📢 Leave status changed event', 'color: orange; font-size: 14px');
        console.log('📊 Status change data:', data);
      });

      socket.on('leave:deleted', (data) => {
        console.log('%c📢 Leave deleted event', 'color: orange; font-size: 14px');
        console.log('📊 Delete data:', data);
      });

      // Get initial unread count
      console.log('📊 Fetching initial unread count...');
      socketService.getUnreadCount()
        .then(count => {
          console.log(`📊 Initial unread count received: ${count}`);
          setUnreadCount(count);
        })
        .catch(err => {
          console.error('❌ Error getting unread count:', err);
        });

      // Request notification permission
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission result:', permission);
        });
      } else if (typeof Notification !== 'undefined') {
        console.log('🔔 Notification permission already:', Notification.permission);
      }

      // Log socket connection status after 2 seconds
      setTimeout(() => {
        console.log('📊 Socket status check (2s):', {
          connected: socket.connected,
          id: socket.id,
          transport: socket.io?.engine?.transport?.name,
          uptime: socket.io?.engine?.transport?.writable ? 'active' : 'inactive'
        });
      }, 2000);

      // Log again after 5 seconds
      setTimeout(() => {
        console.log('📊 Socket status check (5s):', {
          connected: socket.connected,
          id: socket.id,
          transport: socket.io?.engine?.transport?.name
        });
      }, 5000);

    } catch (error) {
      console.error('%c❌❌❌ EXCEPTION in socket connection', 'color: red; font-size: 16px');
      console.error('Error:', error);
      console.error('Error stack:', error.stack);
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket connection...');
      console.log('📊 Final socket state:', {
        connected: socketService.socket?.connected,
        id: socketService.socket?.id
      });
      console.log('Removing all listeners and disconnecting');
      socketService.removeAllListeners();
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user, token, showDesktopNotification]);

  // ========== LEAVE EVENT LISTENERS ==========
  const handleNewLeave = useCallback((callback) => {
    console.log('📢 Setting up leave:new listener');
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot set up leave:new listener');
      return () => {};
    }
    
    socketService.socket.on('leave:new', callback);
    console.log('✅ leave:new listener registered');
    
    return () => {
      console.log('🧹 Cleaning up leave:new listener');
      socketService.socket?.off('leave:new', callback);
    };
  }, []);

  const handleLeaveStatusChanged = useCallback((callback) => {
    console.log('📢 Setting up leave:status_changed listener');
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot set up leave:status_changed listener');
      return () => {};
    }
    
    socketService.socket.on('leave:status_changed', callback);
    console.log('✅ leave:status_changed listener registered');
    
    return () => {
      console.log('🧹 Cleaning up leave:status_changed listener');
      socketService.socket?.off('leave:status_changed', callback);
    };
  }, []);

  const handleLeaveDeleted = useCallback((callback) => {
    console.log('📢 Setting up leave:deleted listener');
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot set up leave:deleted listener');
      return () => {};
    }
    
    socketService.socket.on('leave:deleted', callback);
    console.log('✅ leave:deleted listener registered');
    
    return () => {
      console.log('🧹 Cleaning up leave:deleted listener');
      socketService.socket?.off('leave:deleted', callback);
    };
  }, []);

  const handleNewNotification = useCallback((callback) => {
    console.log('📢 Setting up notification:new listener');

    let disposed = false;
    let cleanup = () => {};

    const attach = () => {
      if (disposed) return true;
      if (!socketService.socket) return false;

      socketService.socket.on('notification:new', callback);
      socketService.socket.on('new_notification', callback);
      console.log('✅ notification listener registered');
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

  // ========== ROOM MANAGEMENT ==========
  const joinLeaveRoom = useCallback((leaveId) => {
    console.log(`🚪 Attempting to join leave room: ${leaveId}`);
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot join room');
      return;
    }
    
    if (!leaveId) {
      console.warn('⚠️ No leaveId provided to join room');
      return;
    }
    
    socketService.socket.emit('leave:join', leaveId);
    console.log(`✅ Joined leave room: ${leaveId}`);
  }, []);

  const leaveLeaveRoom = useCallback((leaveId) => {
    console.log(`🚪 Attempting to leave leave room: ${leaveId}`);
    if (!socketService.socket) {
      console.warn('⚠️ Socket not connected, cannot leave room');
      return;
    }
    
    socketService.socket.emit('leave:leave', leaveId);
    console.log(`✅ Left leave room: ${leaveId}`);
  }, []);

  // ========== NOTIFICATION ACTIONS ==========
  const markAsRead = useCallback(async (notificationId) => {
    console.log(`📌 Marking notification as read: ${notificationId}`);
    try {
      const result = await socketService.markNotificationRead(notificationId);
      console.log('✅ Mark as read result:', result);
      
      setNotifications(prev => {
        const updated = prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        console.log(`📊 Updated notifications, read count: ${updated.filter(n => n.isRead).length}`);
        return updated;
      });
      
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log(`🔔 Unread count decreased to: ${newCount}`);
        return newCount;
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to mark as read:', error);
      return false;
    }
  }, []);

  // Value object with all functions
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

  console.log('🔄 SocketProvider rendering with state:', {
    isConnected,
    notificationCount: notifications.length,
    unreadCount,
    hasSocket: !!socketService.socket,
    socketConnected: socketService.socket?.connected,
    retryCount,
    timestamp: new Date().toLocaleTimeString()
  });

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
