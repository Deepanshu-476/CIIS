import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CallOverlay from "../chat/CallOverlay";
import { useSocket } from "./SocketContext";

const CallContext = createContext({
  startCall: () => {},
  callHistory: [],
  clearCallHistory: () => {},
});

export const useCall = () => useContext(CallContext);

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || localStorage.getItem("superAdmin")) || {};
  } catch {
    return {};
  }
};

const getUserStorageIds = (user = getStoredUser()) => {
  const ids = [user?._id, user?.id]
    .map(value => (value || "").toString())
    .filter(Boolean);
  return [...new Set(ids)];
};

const getCallHistoryKeys = (user = getStoredUser()) => {
  const ids = getUserStorageIds(user);
  return ids.length ? ids.map(id => `ciis-call-history-${id}`) : [];
};

const readSavedCallHistory = (user = getStoredUser()) => {
  for (const key of getCallHistoryKeys(user)) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {
      void 0;
    }
  }
  return [];
};

const writeSavedCallHistory = (user, history) => {
  const keys = getCallHistoryKeys(user);
  keys.forEach(key => {
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch {
      void 0;
    }
  });
};

export const CallProvider = ({ children }) => {
  const callOverlayRef = useRef(null);
  const [callHistory, setCallHistory] = useState([]);
  const socket = useSocket()?.socket;
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentUserId = (currentUser._id || currentUser.id || "").toString();

  useEffect(() => {
    try {
      setCallHistory(readSavedCallHistory(currentUser));
    } catch {
      setCallHistory([]);
    }
  }, [currentUserId, currentUser]);

  const persistCallHistory = useCallback((updater) => {
    setCallHistory(prev => {
      const next = updater(prev).slice(0, 80);
      writeSavedCallHistory(currentUser, next);
      return next;
    });
  }, [currentUser]);

  const handleCallEvent = useCallback((event) => {
    if (!event?.callId) return;

    persistCallHistory(prev => {
      const existing = prev.find(item => item.callId === event.callId);
      const now = new Date().toISOString();

      if (existing) {
        return prev.map(item => (
          item.callId === event.callId
            ? { ...item, ...event, updatedAt: now }
            : item
        ));
      }

      return [{
        id: event.callId,
        callId: event.callId,
        direction: event.direction || "outgoing",
        status: event.status || "ringing",
        type: event.type || "audio",
        title: event.title || event.peerUser?.name || "User",
        peerUser: event.peerUser || null,
        peerUserId: event.peerUserId || "",
        isGroupCall: Boolean(event.isGroupCall),
        participantCount: event.participantCount || event.participantIds?.length || 1,
        startedAt: event.startedAt || now,
        updatedAt: now,
      }, ...prev];
    });
  }, [persistCallHistory]);

  const clearCallHistory = useCallback(() => {
    setCallHistory([]);
    getCallHistoryKeys(currentUser).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        void 0;
      }
    });
  }, [currentUser]);

  const value = useMemo(() => ({
    startCall: (callType, user) => {
      callOverlayRef.current?.startCall(callType, user);
    },
    callHistory,
    clearCallHistory,
  }), [callHistory, clearCallHistory]);

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay
        ref={callOverlayRef}
        socket={socket}
        currentUser={currentUser}
        onCallEvent={handleCallEvent}
      />
    </CallContext.Provider>
  );
};
