// src/services/socket.js - Add at the bottom
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config'; 

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting to socket:', SOCKET_URL);

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
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully! ID:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Failed to create socket:', error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Leave Events
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

  // Notification Events
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

// ✅ Add this line to make it globally available
if (typeof window !== 'undefined') {
  window.socketService = socketServiceInstance;
  console.log('✅ Socket service attached to window');
}