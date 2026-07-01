import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

const isDev = import.meta.env.DEV;

class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.isConnecting = false;
  }

  connect(token) {
    if (!token) return null;

    if (this.socket && this.token === token) {
      this.socket.auth = { token };

      if (!this.socket.connected && !this.isConnecting) {
        this.isConnecting = true;
        this.socket.connect();
      }

      return this.socket;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }

    this.token = token;
    this.isConnecting = true;

    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
      return this.socket;
    }

    try {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
      });

      this.socket.on('disconnect', () => {
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        this.isConnecting = false;
        if (isDev) {
          console.warn('Socket connection failed:', error.message);
        }
      });

      return this.socket;
    } catch (error) {
      this.isConnecting = false;
      if (isDev) {
        console.warn('Failed to create socket:', error);
      }
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.isConnecting = false;
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  onNewLeave(callback) {
    if (!this.socket) return () => {};
    this.socket.on('leave:new', callback);
    return () => this.socket?.off('leave:new', callback);
  }

  onLeaveStatusChanged(callback) {
    if (!this.socket) return () => {};
    this.socket.on('leave:status_changed', callback);
    return () => this.socket?.off('leave:status_changed', callback);
  }

  onLeaveDeleted(callback) {
    if (!this.socket) return () => {};
    this.socket.on('leave:deleted', callback);
    return () => this.socket?.off('leave:deleted', callback);
  }

  joinLeaveRoom(leaveId) {
    if (this.socket?.connected && leaveId) {
      this.socket.emit('leave:join', leaveId);
    }
  }

  leaveLeaveRoom(leaveId) {
    if (this.socket?.connected && leaveId) {
      this.socket.emit('leave:leave', leaveId);
    }
  }

  onNewNotification(callback) {
    if (!this.socket) return () => {};
    this.socket.on('notification:new', callback);
    return () => this.socket?.off('notification:new', callback);
  }

  onUnreadCount(callback) {
    if (!this.socket) return () => {};
    this.socket.on('notification:unread_count', callback);
    return () => this.socket?.off('notification:unread_count', callback);
  }

  markNotificationRead(notificationId) {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('notification:markRead', notificationId, (response) => {
        resolve(response || { success: true });
      });

      setTimeout(() => resolve({ success: true }), 3000);
    });
  }

  getUnreadCount() {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve(0);
        return;
      }

      this.socket.emit('notification:getUnreadCount', (response) => {
        resolve(response?.count || 0);
      });

      setTimeout(() => resolve(0), 2000);
    });
  }

  ping() {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ status: 'error', message: 'Not connected' });
        return;
      }

      this.socket.emit('ping', (response) => {
        resolve(response);
      });

      setTimeout(() => resolve({ status: 'timeout' }), 2000);
    });
  }
}

const socketServiceInstance = new SocketService();
export default socketServiceInstance;

if (typeof window !== 'undefined') {
  window.socketService = socketServiceInstance;
    void 0;
}
