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
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
};

export const CallProvider = ({ children }) => {
  const callOverlayRef = useRef(null);
  const [callHistory, setCallHistory] = useState([]);
  const socket = useSocket()?.socket;
  const currentUser = getStoredUser();
  const currentUserId = (currentUser._id || currentUser.id || "").toString();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`ciis-call-history-${currentUserId}`) || "[]");
      setCallHistory(Array.isArray(saved) ? saved : []);
    } catch {
      setCallHistory([]);
    }
  }, [currentUserId]);

  const persistCallHistory = useCallback((updater) => {
    setCallHistory(prev => {
      const next = updater(prev).slice(0, 80);
      try {
        localStorage.setItem(`ciis-call-history-${currentUserId}`, JSON.stringify(next));
      } catch {
        void 0;
      }
      return next;
    });
  }, [currentUserId]);

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
    try {
      localStorage.removeItem(`ciis-call-history-${currentUserId}`);
    } catch {
      void 0;
    }
  }, [currentUserId]);

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
