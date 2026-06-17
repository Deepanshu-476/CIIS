import React, { createContext, useContext, useMemo, useRef } from "react";
import CallOverlay from "../chat/CallOverlay";
import { useSocket } from "./SocketContext";

const CallContext = createContext({
  startCall: () => {},
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
  const socket = useSocket()?.socket;
  const currentUser = getStoredUser();

  const value = useMemo(() => ({
    startCall: (callType, user) => {
      callOverlayRef.current?.startCall(callType, user);
    },
  }), []);

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay ref={callOverlayRef} socket={socket} currentUser={currentUser} />
    </CallContext.Provider>
  );
};
