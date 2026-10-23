
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
      joinLeaveRoom: () => { },
      leaveLeaveRoom: () => { },
      onNewLeave: () => () => { },
      onLeaveStatusChanged: () => () => { },
      onLeaveDeleted: () => () => { },
      onNewNotification: () => () => { },
      voiceAlertsEnabled: true,
      setVoiceAlertsEnabled: () => { },
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

  const [voiceAlertsEnabled, setVoiceAlertsEnabledState] = useState(() => {
    try {
      return localStorage.getItem('ciis_voice_notifications_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const setVoiceAlertsEnabled = useCallback((enabled) => {
    try {
      localStorage.setItem('ciis_voice_notifications_enabled', enabled ? 'true' : 'false');
    } catch {
      /* ignore */
    }
    setVoiceAlertsEnabledState(Boolean(enabled));
  }, []);

  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window.__ciisAudioCtx) {
        window.__ciisAudioCtx = new AudioCtx();
      }
      const ctx = window.__ciisAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.52);
    } catch {
      /* ignore audio context failure */
    }
  }, []);

  const speakNotificationVoiceAlert = useCallback((payload = {}, eventName = '') => {
    if (typeof window === 'undefined') return;

    // Respect user preference (defaults to true)
    try {
      if (localStorage.getItem('ciis_voice_notifications_enabled') === 'false') return;
    } catch {
      /* ignore */
    }

    // 1. Play immediate audible notification chime via Web Audio API
    playNotificationChime();

    if (!window.speechSynthesis) return;

    const type = String(payload.type || eventName || '').toLowerCase();
    const data = payload.data || {};
    const task = payload.task || payload.relatedTask || data.task || {};
    const rawTitle = String(payload.title || payload.notificationTitle || '').trim();
    const rawMessage = String(payload.message || payload.body || payload.description || data.message || '').trim();

    // Extract taskTitle reliably across formats (data, task object, or quotes inside message)
    let taskTitle = data.taskTitle || task.title || task.name || payload.taskTitle || '';
    if (!taskTitle && rawMessage) {
      const match = rawMessage.match(/"([^"]+)"/);
      if (match) taskTitle = match[1];
    }
    if (!taskTitle && rawTitle && !rawTitle.toLowerCase().includes('reminder') && !rawTitle.toLowerCase().includes('notification') && !rawTitle.toLowerCase().includes('update')) {
      taskTitle = rawTitle;
    }

    let devanagariText = '';
    let hinglishText = '';

    if (type.includes('task_due_reminder') || (type.includes('reminder') && !type.includes('pending'))) {
      const taskDevanagari = taskTitle ? `टास्क "${taskTitle}"` : 'टास्क';
      const taskHinglish = taskTitle ? `Task "${taskTitle}"` : 'Task';
      devanagariText = `ध्यान दें! ${taskDevanagari} का रिमाइंडर टाइम हो गया है।`;
      hinglishText = `Dhyan dein! ${taskHinglish} ka reminder time ho gaya hai.`;
    } else if (type.includes('task_overdue') || type.includes('overdue')) {
      const taskDevanagari = taskTitle ? `टास्क "${taskTitle}"` : 'टास्क';
      const taskHinglish = taskTitle ? `Task "${taskTitle}"` : 'Task';
      devanagariText = `अलर्ट! आपका ${taskDevanagari} ओवरड्यू हो गया है। कृपया इसे चेक करें।`;
      hinglishText = `Alert! Aapka ${taskHinglish} overdue ho gaya hai. Kripya ise check karein.`;
    } else if (type.includes('task_pending') || (type.includes('pending') && type.includes('reminder'))) {
      const taskDevanagari = taskTitle ? `टास्क "${taskTitle}"` : 'टास्क';
      const taskHinglish = taskTitle ? `Task "${taskTitle}"` : 'Task';
      devanagariText = `रिमाइंडर: आपका ${taskDevanagari} अभी पेंडिंग है, कृपया समय पर पूरा करें।`;
      hinglishText = `Reminder: Aapka ${taskHinglish} abhi pending hai, kripya samay par poora karein.`;
    } else if (type.includes('task')) {
      const label = taskTitle || rawTitle || rawMessage || 'नया अपडेट';
      devanagariText = `टास्क अपडेट: ${label}`;
      hinglishText = `Task update: ${label}`;
    } else if (type.includes('leave')) {
      const label = rawTitle || rawMessage || 'छुट्टी की अर्जी अपडेट';
      devanagariText = `लीव अपडेट: ${label}`;
      hinglishText = `Leave update: ${label}`;
    } else if (type.includes('attendance')) {
      const label = rawTitle || rawMessage || 'अटेंडेंस अपडेट';
      devanagariText = `अटेंडेंस अपडेट: ${label}`;
      hinglishText = `Attendance update: ${label}`;
    } else if (type.includes('meeting')) {
      const label = rawTitle || rawMessage || 'मीटिंग अपडेट';
      devanagariText = `मीटिंग रिमाइंडर: ${label}`;
      hinglishText = `Meeting reminder: ${label}`;
    } else {
      // Universal fallback: speak any alert or notification title and message
      const cleanTitle = rawTitle ? `${rawTitle}. ` : '';
      const cleanBody = rawMessage ? rawMessage.replace(/https?:\/\/\S+/g, '') : '';
      const combined = (cleanTitle + cleanBody).trim();
      if (combined) {
        devanagariText = combined;
        hinglishText = combined;
      } else {
        devanagariText = 'नया नोटिफिकेशन प्राप्त हुआ है।';
        hinglishText = 'Naya notification aaya hai.';
      }
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Chrome fix: do NOT call cancel() unconditionally right before speak();
      // only cancel if actively speaking, and allow a 60ms tick for Chrome's voice pipeline
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      window.setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const voices = window.speechSynthesis.getVoices() || [];
          const hiVoice =
            voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
            voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('hi'));
          const inVoice =
            voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN') ||
            voices.find((v) => v.lang && v.lang.toLowerCase().includes('in'));
          const defaultVoice = inVoice || voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) || voices[0];

          // If Hindi voice is present, speak Devanagari text; otherwise clear Hinglish
          const textToSpeak = hiVoice ? (devanagariText || hinglishText) : (hinglishText || devanagariText);
          if (!textToSpeak) return;

          const chosenVoice = hiVoice || defaultVoice;
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          if (chosenVoice) {
            utterance.voice = chosenVoice;
            utterance.lang = chosenVoice.lang || (hiVoice ? 'hi-IN' : 'en-IN');
          } else {
            utterance.lang = hiVoice ? 'hi-IN' : 'en-IN';
          }
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          // Mark global speaking flag so microphone echo guards drop self-speech
          window.__ciisVoiceSpeaking = true;
          window.__ciisNotificationUtterance = utterance;

          const finishSpeech = () => {
            window.__ciisVoiceSpeaking = false;
            if (window.__ciisNotificationUtterance === utterance) {
              window.__ciisNotificationUtterance = null;
            }
          };

          utterance.onend = finishSpeech;
          utterance.onerror = (e) => {
            console.warn('[SocketContext] Voice alert error event:', e);
            finishSpeech();
          };

          // Safety timeout in case browser drops onend
          const safetyMs = Math.max(3000, (textToSpeak.length / 10) * 1000 + 1500);
          window.setTimeout(finishSpeech, safetyMs);

          window.speechSynthesis.speak(utterance);
        } catch (innerErr) {
          console.warn('[SocketContext] Error in delayed speech speak:', innerErr);
          window.__ciisVoiceSpeaking = false;
        }
      }, 60);
    } catch (err) {
      console.warn('[SocketContext] Voice alert failed:', err);
      window.__ciisVoiceSpeaking = false;
    }
  }, [playNotificationChime]);

  // Voice priming, interaction unlock, and QA test helper
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Expose global speak handler for components (TaskReminderControl, Header, etc.)
    window.__ciisSpeakNotification = speakNotificationVoiceAlert;

    // Interaction unlock for browser Autoplay Policy
    const unlockAudioAndSpeech = () => {
      try {
        if (window.__ciisAudioCtx && window.__ciisAudioCtx.state === 'suspended') {
          window.__ciisAudioCtx.resume().catch(() => {});
        }
        if (window.speechSynthesis && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('click', unlockAudioAndSpeech, { once: true });
    window.addEventListener('keydown', unlockAudioAndSpeech, { once: true });
    window.addEventListener('touchstart', unlockAudioAndSpeech, { once: true });

    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);

      // Expose manual test function in console for QA testing: window.__testVoiceAlert('AI voice agents')
      window.__testVoiceAlert = (title = 'AI voice agents', type = 'task_due_reminder') => {
        speakNotificationVoiceAlert({
          type,
          title: 'Task Reminder',
          message: `Personal Task "${title}" is due. Reminder: Every 5 min.`,
          data: { taskTitle: title }
        }, 'notification:new');
      };

      return () => {
        window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
        window.removeEventListener('click', unlockAudioAndSpeech);
        window.removeEventListener('keydown', unlockAudioAndSpeech);
        window.removeEventListener('touchstart', unlockAudioAndSpeech);
      };
    }
  }, [speakNotificationVoiceAlert]);

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
        speakNotificationVoiceAlert(notification, eventName);

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
          speakNotificationVoiceAlert(payload, eventName);
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
      return () => { };
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
      return () => { };
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
      return () => { };
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
    let cleanup = () => { };

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
    voiceAlertsEnabled,
    setVoiceAlertsEnabled,
    socket: socketService.socket
  };

  void 0;

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
