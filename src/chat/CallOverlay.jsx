import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
    Maximize2,
    Mic,
    MicOff,
    Minimize2,
    MonitorUp,
    Phone,
    PhoneOff,
    ScreenShareOff,
    UserPlus,
    Video,
    VideoOff,
    X,
} from "lucide-react";
import API_URL, { API_URL_IMG } from "../config";
import { resolveAvatarUrl } from "./messageUtils";
import { getCompanyUsers } from "../services/chatService";
import "../Pages/Chat/chat.css";

const getFallbackIceServers = () => {
    return [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ];
};
const isCallDebugEnabled = () => (
    import.meta.env.DEV ||
    import.meta.env.VITE_WEBRTC_DEBUG === "true" ||
    localStorage.getItem("ciis_webrtc_debug") === "true"
);

const logCall = (...args) => {
    if (!isCallDebugEnabled()) return;
    console.info("[CIIS WebRTC]", ...args);
};

const formatCallDuration = (totalSeconds = 0) => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    const two = value => value.toString().padStart(2, "0");
    return hours > 0
        ? `${two(hours)}:${two(minutes)}:${two(seconds)}`
        : `${two(minutes)}:${two(seconds)}`;
};

const playMediaElement = (element, label) => {
    if (!element) return;
    const tryPlay = (attempt = 0) => {
        element.play?.().catch(error => {
            logCall(`${label} autoplay failed`, { attempt, error: error?.message || error });
            if (attempt < 3) {
                window.setTimeout(() => tryPlay(attempt + 1), 350 * (attempt + 1));
            }
        });
    };
    tryPlay();
};

const summarizeCandidate = (candidate) => {
    const raw = candidate?.candidate || "";
    const type = raw.match(/\btyp\s+(\w+)/)?.[1] || "";
    const protocol = raw.match(/\b(udp|tcp)\b/i)?.[1] || "";
    return {
        type,
        protocol: protocol.toLowerCase(),
        addressFamily: raw.includes(" raddr ") ? "server-reflexive/relay" : "host-or-masked",
    };
};
    
const getUserId = (user) => {
    if (!user) return ""; 
    if (typeof user !== "object") return user.toString();

    const rawId = user._id || user.id || user.userId || user.user?._id || user.user?.id;
    if (!rawId) return "";

    if (typeof rawId === "object") {
        return getUserId(rawId);
    }

    return rawId.toString();
};

const getAvatarSrc = (avatar) => resolveAvatarUrl(avatar);
 
const getGroupName = (group) => (
    group?.name || group?.groupName || group?.group_name || group?.title || "Group call"
);

const uniqueIds = (ids) => [...new Set(ids.map(id => id?.toString()).filter(Boolean))];

const getCallParticipantIds = (target, currentUserId) => {
    if (!target) return [];

    if (Array.isArray(target.participantIds)) {
        return uniqueIds(target.participantIds).filter(id => id !== currentUserId);
    }

    const memberSource = target.members || target.users || target.attendees || target.memberIds || target.membersIds;
    if (Array.isArray(memberSource)) {
        return uniqueIds(memberSource.map(member => (
            typeof member === "object" ? getUserId(member) : member
        ))).filter(id => id !== currentUserId);
    }

    const directUserId = getUserId(target);
    return directUserId && directUserId !== currentUserId ? [directUserId] : [];
};

const getKnownParticipantUser = (target, userId) => {
    const memberSource = target?.members || target?.users || target?.attendees || [];
    if (!Array.isArray(memberSource)) return null;
    return memberSource.find(member => typeof member === "object" && getUserId(member) === userId) || null;
};

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || localStorage.getItem("superAdmin")) || {};
    } catch {
        return {};
    }
};

const getCurrentUserPublicInfo = (user = {}) => {
    const fallback = getStoredUser();
    const resolvedUser = (user && (user._id || user.id || user.name)) ? user : fallback;
    const name = resolvedUser.name || resolvedUser.fullName ||
        (resolvedUser.firstName ? `${resolvedUser.firstName} ${resolvedUser.lastName || ''}`.trim() : "") ||
        resolvedUser.email || "User";
    const avatar = resolvedUser.avatar || resolvedUser.profileImage || resolvedUser.image || "";
    const id = getUserId(resolvedUser) || getUserId(fallback);

    return {
        _id: id,
        id,
        name,
        email: resolvedUser.email,
        avatar,
        profileImage: avatar,
        image: avatar,
    };
};

const notifyIncomingCall = (incomingCall) => {
    const callerName = incomingCall.peerUser?.name || "User";
    const title = incomingCall.type === "video" ? "Incoming video call" : "Incoming voice call";
    const body = incomingCall.isGroupCall
        ? `${callerName} invited you to ${incomingCall.title || "a group call"}`
        : `${callerName} is calling`;

    window.electronAPI?.showIncomingCall?.({         
        title,
        body,     
        callerName,
        callType: incomingCall.type,
    });

    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        new Notification(title, {
            body,
            icon: "/logoo.png",
            tag: `ciis-call-${incomingCall.callId}`,
            requireInteraction: true,
        });
        return;
    }

    if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                new Notification(title, {
                    body,
                    icon: "/logoo.png",
                    tag: `ciis-call-${incomingCall.callId}`,
                    requireInteraction: true,
                });
            }
        });
    }
};

const RemoteVideoTile = ({ participant }) => {
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }

        if (audioRef.current && participant.stream) {
            audioRef.current.srcObject = participant.stream;
            playMediaElement(audioRef.current, "Remote audio");
        }
    }, [participant.stream]);   
  
    const avatarSrc = getAvatarSrc(participant.user?.avatar || participant.user?.profileImage || participant.user?.image);

    return (
        <div className="call-remote-tile">
            <audio ref={audioRef} autoPlay playsInline />
            {participant.stream ? (
                <video ref={videoRef} autoPlay playsInline className="call-remote-video" />
            ) : (
                <div className="call-avatar-large">
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt={participant.user?.name || "Participant"}
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "inline";
                            }}
                        />
                    ) : null}
                    <span style={{ display: avatarSrc ? "none" : "inline" }}>
                        {participant.user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                </div>
            )}
            <div className="call-tile-name">{participant.user?.name || "Participant"}</div>
        </div>
    );
};

const RemoteAudioTrack = ({ participant }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current || !participant.stream) return;

        audioRef.current.srcObject = participant.stream;
        playMediaElement(audioRef.current, "Remote voice audio");
    }, [participant.stream]);

    return <audio ref={audioRef} autoPlay playsInline />;
};

const CallOverlay = forwardRef(({ socket, currentUser, onCallEvent }, ref) => {
    const [call, setCall] = useState(null);
    const [error, setError] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState("");
    const [floatingPosition, setFloatingPosition] = useState({ x: 24, y: 90 });
    const [remoteParticipants, setRemoteParticipants] = useState([]);
    const [showAddPeople, setShowAddPeople] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedInviteIds, setSelectedInviteIds] = useState([]);
    const [isInvitingPeople, setIsInvitingPeople] = useState(false);
    const localVideoRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());
    const localStreamRef = useRef(null);
    const cameraVideoTrackRef = useRef(null);
    const screenTrackRef = useRef(null);
    const candidateQueuesRef = useRef(new Map());
    const activeCallRef = useRef(null);
    const audioContextRef = useRef(null);
    const ringtoneTimerRef = useRef(null);
    const callTimeoutRef = useRef(null);
    const statsTimerRef = useRef(null);
    const durationTimerRef = useRef(null);
    const connectedAtRef = useRef(null);
    const endedCallIdsRef = useRef(new Set());
    const reconnectTimersRef = useRef(new Map());
    const floatingDragRef = useRef(null);
    const iceServersRef = useRef(getFallbackIceServers());
    const iceServersLoadedAtRef = useRef(0);
    const currentUserId = getUserId(currentUser) || getUserId(getStoredUser());

    const loadIceServers = async () => {
        const cacheAge = Date.now() - iceServersLoadedAtRef.current;
        if (iceServersLoadedAtRef.current && cacheAge < 5 * 60 * 1000) {
            return iceServersRef.current;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/chat/turn-credentials`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                throw new Error(`TURN credentials request failed (${response.status})`);
            }

            const iceServers = await response.json();
            if (!Array.isArray(iceServers) || iceServers.length === 0) {
                throw new Error("TURN credentials response is empty");
            }

            iceServersRef.current = iceServers;
            iceServersLoadedAtRef.current = Date.now();
            logCall("Loaded ICE servers", iceServers.map(server => ({
                urls: Array.isArray(server.urls) ? server.urls : [server.urls],
                hasUsername: Boolean(server.username),
            })));
            return iceServers;
        } catch (turnError) {
            logCall("Using STUN-only fallback; self-hosted TURN credentials unavailable", turnError.message || turnError);
            iceServersRef.current = getFallbackIceServers();
            return iceServersRef.current;
        }
    };

    const stopRingtone = () => {
        if (ringtoneTimerRef.current) {
            clearInterval(ringtoneTimerRef.current);
            ringtoneTimerRef.current = null;
        }

        const audioCtx = audioContextRef.current;
        if (audioCtx && audioCtx.state !== "closed") {
            try {
                audioCtx.suspend();
            } catch (error) {
                console.warn("Failed to suspend ringtone audio context", error);
            }
        }
    };

    const stopStatsLogging = () => {
        if (statsTimerRef.current) {
            window.clearInterval(statsTimerRef.current);
            statsTimerRef.current = null;
        }
    };

    const stopDurationTimer = () => {
        if (durationTimerRef.current) {
            window.clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
        }
    };

    const startDurationTimer = (startedAt = new Date().toISOString()) => {
        if (!connectedAtRef.current) {
            connectedAtRef.current = startedAt;
        }
        if (durationTimerRef.current) return;

        const tick = () => {
            const startedAtTime = new Date(connectedAtRef.current).getTime();
            if (!Number.isNaN(startedAtTime)) {
                setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtTime) / 1000)));
            }
        };

        tick();
        durationTimerRef.current = window.setInterval(tick, 1000);
    };

    const stopScreenShare = async ({ restoreCamera = true } = {}) => {
        const screenTrack = screenTrackRef.current;
        if (!screenTrack) {
            setIsScreenSharing(false);
            return;
        }

        screenTrack.onended = null;
        try {
            screenTrack.stop();
        } catch {
            void 0;
        }
        screenTrackRef.current = null;

        const restoreTrack = restoreCamera ? cameraVideoTrackRef.current : null;
        await Promise.all([...peerConnectionsRef.current.values()].map(async peerConnection => {
            const videoSender = peerConnection.getSenders().find(sender => sender.track?.kind === "video");
            if (videoSender && restoreTrack) {
                await videoSender.replaceTrack(restoreTrack);
            } else if (videoSender && !restoreTrack) {
                await videoSender.replaceTrack(null);
            }
        }));

        setIsScreenSharing(false);
        if (restoreTrack) {
            restoreTrack.enabled = !isCameraOff;
            if (localVideoRef.current && localStreamRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        }
    };

    const clearReconnectTimers = () => {
        reconnectTimersRef.current.forEach(timer => window.clearTimeout(timer));
        reconnectTimersRef.current.clear();
    };

    const startStatsLogging = () => {
        if (!isCallDebugEnabled() || statsTimerRef.current) return;

        statsTimerRef.current = window.setInterval(async () => {
            for (const [peerUserId, peerConnection] of peerConnectionsRef.current.entries()) {
                try {
                    const stats = await peerConnection.getStats();
                    const summary = {
                        peerUserId,
                        inbound: [],
                        outbound: [],
                        selectedPair: null,
                    };

                    stats.forEach(report => {
                        if (report.type === "inbound-rtp" && !report.isRemote) {
                            summary.inbound.push({
                                kind: report.kind || report.mediaType,
                                bytesReceived: report.bytesReceived,
                                packetsReceived: report.packetsReceived,
                                packetsLost: report.packetsLost,
                                jitter: report.jitter,
                            });
                        }
                        if (report.type === "outbound-rtp" && !report.isRemote) {
                            summary.outbound.push({
                                kind: report.kind || report.mediaType,
                                bytesSent: report.bytesSent,
                                packetsSent: report.packetsSent,
                            });
                        }
                        if (report.type === "candidate-pair" && report.selected) {
                            summary.selectedPair = {
                                state: report.state,
                                nominated: report.nominated,
                                bytesSent: report.bytesSent,
                                bytesReceived: report.bytesReceived,
                                currentRoundTripTime: report.currentRoundTripTime,
                            };
                        }
                    });

                    logCall("Stats snapshot", summary);
                } catch (error) {
                    logCall("Stats snapshot failed", { peerUserId, error: error.message || error });
                }
            }
        }, 5000);
    };

    const startRingtone = () => {
        stopRingtone();
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        let audioCtx = audioContextRef.current;
        if (!audioCtx || audioCtx.state === "closed") {
            audioCtx = new AudioContext();
            audioContextRef.current = audioCtx;
        }

        const createTone = () => {
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = 440;
            gain.gain.value = 0.25;
            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.25);
            oscillator.onended = () => {
                oscillator.disconnect();
                gain.disconnect();
            };
        };

        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }

        createTone();
        ringtoneTimerRef.current = window.setInterval(createTone, 1100);
    };

    const attachLocalStream = (stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    };

    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [call?.status, call?.type]);

    const upsertRemoteParticipant = (userId, patch) => {
        setRemoteParticipants(prev => {
            const existing = prev.find(participant => participant.userId === userId);
            if (existing) {
                return prev.map(participant => (
                    participant.userId === userId
                        ? { ...participant, ...patch, user: patch.user || participant.user }
                        : participant
                ));
            }

            return [...prev, {
                userId,
                user: patch.user || { _id: userId, name: "Participant" },
                stream: patch.stream || null,
            }];
        });
    };

    const stopStreams = () => {
        if (screenTrackRef.current) {
            screenTrackRef.current.onended = null;
            try {
                screenTrackRef.current.stop();
            } catch {
                void 0;
            }
            screenTrackRef.current = null;
        }
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        cameraVideoTrackRef.current = null;
        setRemoteParticipants([]);
    };

    const resetPeers = () => {
        peerConnectionsRef.current.forEach(peerConnection => peerConnection.close());
        peerConnectionsRef.current.clear();
        candidateQueuesRef.current.clear();
    };

    const resetCall = () => {
        stopRingtone();
        window.clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
        stopStatsLogging();
        stopDurationTimer();
        clearReconnectTimers();
        resetPeers();
        stopStreams();
        activeCallRef.current = null;
        setCall(null);
        setError("");
        setIsMuted(false);
        setIsCameraOff(false);
        setIsScreenSharing(false);
        setIsMinimized(false);
        setShowAddPeople(false);
        setSelectedInviteIds([]);
        setIsInvitingPeople(false);
        setElapsedSeconds(0);
        setConnectionStatus("");
        connectedAtRef.current = null;
    };

    const emitCallEvent = (callEvent, overrides = {}) => {
        if (!callEvent?.callId) return;

        onCallEvent?.({
            callId: callEvent.callId,
            type: callEvent.type,
            direction: callEvent.isCaller ? "outgoing" : "incoming",
            status: callEvent.status,
            title: callEvent.title || callEvent.peerUser?.name || "User",
            peerUser: callEvent.peerUser,
            peerUserId: callEvent.peerUserId,
            participantIds: callEvent.participantIds,
            participantCount: callEvent.participantIds?.length || 1,
            isGroupCall: callEvent.isGroupCall,
            ...overrides,
        });
    };

    const getConnectedDurationSeconds = () => {
        const startedAtTime = connectedAtRef.current ? new Date(connectedAtRef.current).getTime() : NaN;
        if (Number.isNaN(startedAtTime)) return 0;
        return Math.max(0, Math.floor((Date.now() - startedAtTime) / 1000));
    };

    const activateCall = (nextCall, overrides = {}) => {
        const connectedAt = overrides.connectedAt || connectedAtRef.current || new Date().toISOString();
        const activeNextCall = {
            ...nextCall,
            status: "active",
            connectedAt,
        };
        activeCallRef.current = activeNextCall;
        setCall(activeNextCall);
        setConnectionStatus("Connected");
        stopRingtone();
        startStatsLogging();
        startDurationTimer(connectedAt);
        emitCallEvent(activeNextCall, {
            status: "answered",
            connectedAt,
            durationSeconds: getConnectedDurationSeconds(),
            ...overrides,
        });
        return activeNextCall;
    };

    const completeCall = (status = "ended", extra = {}) => {
        const activeCall = activeCallRef.current;
        if (!activeCall?.callId) return;
        if (endedCallIdsRef.current.has(activeCall.callId)) return;
        endedCallIdsRef.current.add(activeCall.callId);

        const endedAt = new Date().toISOString();
        const durationSeconds = ["ended", "completed"].includes(status)
            ? getConnectedDurationSeconds()
            : 0;

        emitCallEvent(activeCall, {
            status,
            endedAt,
            connectedAt: connectedAtRef.current || activeCall.connectedAt,
            durationSeconds,
            durationLabel: formatCallDuration(durationSeconds),
            ...extra,
        });
    };

    const emitToPeer = (peerUserId, eventName, payload = {}) => {
        const activeCall = activeCallRef.current;
        if (!socket || !activeCall?.callId || !peerUserId) return;

        socket.emit(eventName, {
            ...payload,
            callId: activeCall.callId,
            toUserId: peerUserId,
            callType: activeCall.type,
        });
    };

    const createPeerConnection = (peerUserId, peerUser = null) => {
        if (peerConnectionsRef.current.has(peerUserId)) {
            return peerConnectionsRef.current.get(peerUserId);
        }

        const peerConnection = new RTCPeerConnection({ iceServers: iceServersRef.current });
        logCall("PeerConnection created", { peerUserId, iceServerCount: iceServersRef.current.length });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                logCall("Local ICE candidate", { peerUserId, ...summarizeCandidate(event.candidate) });
                emitToPeer(peerUserId, "call:ice-candidate", { candidate: event.candidate });
            } else {
                logCall("ICE gathering complete", { peerUserId });
            }
        };

        peerConnection.onicegatheringstatechange = () => {
            logCall("iceGatheringState", { peerUserId, state: peerConnection.iceGatheringState });
        };

        peerConnection.oniceconnectionstatechange = () => {
            logCall("iceConnectionState", { peerUserId, state: peerConnection.iceConnectionState });
            if (peerConnection.iceConnectionState === "disconnected") {
                setConnectionStatus("Reconnecting...");
            }
        };

        peerConnection.onsignalingstatechange = () => {
            logCall("signalingState", { peerUserId, state: peerConnection.signalingState });
        };

        peerConnection.ontrack = (event) => {
            logCall("Remote track received", {
                peerUserId,
                kind: event.track?.kind,
                readyState: event.track?.readyState,
                streamCount: event.streams?.length || 0,
            });
            const [stream] = event.streams;
            if (stream) {
                upsertRemoteParticipant(peerUserId, {
                    user: peerUser || getKnownParticipantUser(activeCallRef.current?.peerUser, peerUserId),
                    stream,
                });
            }
        };

        peerConnection.onconnectionstatechange = () => {
            logCall("connectionState", { peerUserId, state: peerConnection.connectionState });
            if (["connected", "completed"].includes(peerConnection.connectionState)) {
                setConnectionStatus("Connected");
                if (reconnectTimersRef.current.has(peerUserId)) {
                    window.clearTimeout(reconnectTimersRef.current.get(peerUserId));
                    reconnectTimersRef.current.delete(peerUserId);
                }
            }
            if (["disconnected", "failed"].includes(peerConnection.connectionState)) {
                setConnectionStatus("Reconnecting...");
                if (!reconnectTimersRef.current.has(peerUserId)) {
                    const timer = window.setTimeout(() => {
                        const latestConnection = peerConnectionsRef.current.get(peerUserId);
                        if (latestConnection && ["failed", "disconnected", "closed"].includes(latestConnection.connectionState)) {
                            setRemoteParticipants(prev => prev.filter(participant => participant.userId !== peerUserId));
                            setConnectionStatus("Connection interrupted");
                        }
                        reconnectTimersRef.current.delete(peerUserId);
                    }, 12000);
                    reconnectTimersRef.current.set(peerUserId, timer);
                }
            }
            if (peerConnection.connectionState === "closed") {
                setRemoteParticipants(prev => prev.filter(participant => participant.userId !== peerUserId));
            }
        };

        localStreamRef.current?.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current);
        });
        if (screenTrackRef.current) {
            peerConnection.addTrack(screenTrackRef.current, new MediaStream([screenTrackRef.current]));
        }

        peerConnectionsRef.current.set(peerUserId, peerConnection);
        upsertRemoteParticipant(peerUserId, {
            user: peerUser || getKnownParticipantUser(activeCallRef.current?.peerUser, peerUserId),
        });
        return peerConnection;
    };

    const removePeer = (peerUserId) => {
        peerConnectionsRef.current.get(peerUserId)?.close();
        peerConnectionsRef.current.delete(peerUserId);
        candidateQueuesRef.current.delete(peerUserId);
        setRemoteParticipants(prev => prev.filter(participant => participant.userId !== peerUserId));
    };

    const getMediaStream = async (callType) => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Media devices are not supported.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === "video",
            });
            cameraVideoTrackRef.current = stream.getVideoTracks()[0] || null;
            attachLocalStream(stream);
            return stream;
        } catch (mediaError) {
            setError("Allow microphone/camera permission, then try again.");
            throw mediaError;
        }
    };

    const flushCandidateQueue = async (peerUserId) => {
        const peerConnection = peerConnectionsRef.current.get(peerUserId);
        if (!peerConnection?.remoteDescription) return;

        const queuedCandidates = candidateQueuesRef.current.get(peerUserId) || [];
        candidateQueuesRef.current.set(peerUserId, []);

        await Promise.all(queuedCandidates.map(candidate => (
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(error => {
                logCall("Queued ICE candidate rejected", { peerUserId, error: error.message || error });
            })
        )));
    };

    const checkCallAvailability = (participantIds) => new Promise((resolve) => {
        if (!socket?.connected) {
            resolve({ success: false, reason: "Socket is not connected. Please refresh and try the call again." });
            return;
        }

        let settled = false;
        const finish = (response) => {
            if (settled) return;
            settled = true;
            resolve(response || { success: false, reason: "Users are not available for the call." });
        };

        socket.emit("call:check-availability", { participantIds }, finish);
        window.setTimeout(() => {
            finish({ success: true, warning: "Call availability check timeout; continuing with invite." });
        }, 3000);
    });

    const loadAvailableUsers = async () => {
        try {
            const response = await getCompanyUsers();
            setAvailableUsers(Array.isArray(response.data?.users) ? response.data.users : []);
        } catch (fetchError) {
            logCall("Unable to load call invite users", fetchError);
            setError("Unable to load users for invite.");
        }
    };

    const openAddPeople = async () => {
        setShowAddPeople(true);
        setSelectedInviteIds([]);
        if (!availableUsers.length) {
            await loadAvailableUsers();
        }
    };

    const inviteSelectedPeople = async () => {
        const activeCall = activeCallRef.current;
        const inviteIds = uniqueIds(selectedInviteIds)
            .filter(userId => userId !== currentUserId)
            .filter(userId => !(activeCall?.participantIds || []).includes(userId));

        if (!activeCall?.callId || inviteIds.length === 0) {
            setShowAddPeople(false);
            return;
        }

        setIsInvitingPeople(true);
        try {
            const availability = await checkCallAvailability(inviteIds);
            const targetIds = availability.availableIds?.length ? availability.availableIds : inviteIds;
            if (!availability.success || targetIds.length === 0) {
                setError(availability.reason || "Selected users are offline.");
                return;
            }

            const nextCall = {
                ...activeCall,
                isGroupCall: true,
                participantIds: uniqueIds([...(activeCall.participantIds || []), ...targetIds]),
            };
            activeCallRef.current = nextCall;
            setCall(nextCall);

            targetIds.forEach(userId => {
                const user = availableUsers.find(candidate => getUserId(candidate) === userId);
                upsertRemoteParticipant(userId, { user: user || { _id: userId, name: "Participant" } });
            });

            socket.emit("call:add-participants", {
                callId: activeCall.callId,
                participantIds: targetIds,
                callType: activeCall.type,
                title: activeCall.title,
                isGroupCall: true,
                callerUser: getCurrentUserPublicInfo(currentUser),
            });

            setError(availability.unavailableIds?.length
                ? "Some selected users are offline; inviting available users."
                : "");
            setShowAddPeople(false);
            setSelectedInviteIds([]);
        } finally {
            setIsInvitingPeople(false);
        }
    };

    const startCall = async (callType, user) => {
        if (!socket || !user) {
            setError("Unable to start the call.");
            return;
        }

        if (!socket.connected) {
            setError("Socket is not connected. Please refresh and try the call again.");
            return;
        }

        const myUser = (currentUser && (getUserId(currentUser) || currentUser.name)) ? currentUser : getStoredUser();
        const myId = getUserId(myUser) || currentUserId;
        const participantIds = getCallParticipantIds(user, myId);
        if (participantIds.length === 0) {
            setError("No participant found for the call.");
            return;
        }

        const availability = await checkCallAvailability(participantIds);
        if (!availability.success) {
            setError(availability.reason || "Users are offline.");
            return;
        }

        const isGroupCall = Boolean(user.isGroup || (Array.isArray(user.members) && user.members.length > 2) || participantIds.length > 1);
        const nextCall = {
            callId: `${myId || "user"}-${Date.now()}`,
            type: callType,
            status: "outgoing",
            peerUser: user,
            peerUserId: participantIds[0],
            participantIds,
            isCaller: true,
            isGroupCall,
            title: isGroupCall ? getGroupName(user) : (user.name || user.fullName || "User"),
        };

        activeCallRef.current = nextCall;
        setCall(nextCall);
        emitCallEvent(nextCall, {
            status: "ringing",
            startedAt: new Date().toISOString(),
        });
        setRemoteParticipants(participantIds.map(userId => ({
            userId,
            user: getKnownParticipantUser(user, userId) || (participantIds.length === 1 ? user : { _id: userId, name: "Participant" }),
            stream: null,
        })));
        setError("");

        try {
            await loadIceServers();
            await getMediaStream(callType);
            startRingtone();
            socket.emit("call:invite", {
                callId: nextCall.callId,
                participantIds,
                toUserId: participantIds[0],
                callType,
                isGroupCall,
                groupTitle: isGroupCall ? getGroupName(user) : "",
                title: isGroupCall ? getGroupName(user) : "",
                callerUser: getCurrentUserPublicInfo(myUser),
            });
            callTimeoutRef.current = window.setTimeout(() => {
                if (activeCallRef.current?.callId === nextCall.callId && activeCallRef.current?.status === "outgoing") {
                    socket.emit("call:end", { callId: nextCall.callId });
                    emitCallEvent(nextCall, { status: "missed" });
                    resetCall();
                    setError("The call was not answered.");
                }
            }, 45000);
        } catch (mediaError) {
            logCall("startCall media error", mediaError);
            emitCallEvent(nextCall, { status: "failed" });
            resetCall();
        }
    };

    useImperativeHandle(ref, () => ({
        startCall,
    }));

    const acceptCall = async () => {
        const activeCall = activeCallRef.current;
        if (!activeCall) return;

        try {
            await loadIceServers();
            await getMediaStream(activeCall.type);
            const acceptedCall = { ...activeCall, status: "connecting" };
            activeCallRef.current = acceptedCall;
            setCall(acceptedCall);
            emitCallEvent(acceptedCall, { status: "answered" });
            stopRingtone();
            window.clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
            socket.emit("call:accept", {
                callId: activeCall.callId,
                callType: activeCall.type,
            });
        } catch (mediaError) {
            logCall("acceptCall media error", mediaError);
            socket.emit("call:reject", {
                callId: activeCall.callId,
            });
            resetCall();
        }
    };

    const rejectCall = () => {
        const activeCall = activeCallRef.current;
        socket?.emit("call:reject", { callId: activeCall?.callId });
        if (activeCall) {
            completeCall(activeCall.isCaller ? "cancelled" : "declined");
        }
        resetCall();
    };

    const endCall = () => {
        const activeCall = activeCallRef.current;
        if (activeCall) {
            socket?.emit("call:end", { callId: activeCall.callId });
            completeCall(activeCall.status === "active" ? "ended" : "cancelled");
        }
        resetCall();
    };

    const toggleMute = () => {
        const nextMuted = !isMuted;
        localStreamRef.current?.getAudioTracks().forEach(track => {
            track.enabled = !nextMuted;
        });
        setIsMuted(nextMuted);
    };

    const toggleCamera = () => {
        const nextCameraOff = !isCameraOff;
        localStreamRef.current?.getVideoTracks().forEach(track => {
            track.enabled = !nextCameraOff;
        });
        setIsCameraOff(nextCameraOff);
    };

    const renegotiatePeers = async () => {
        await Promise.all([...peerConnectionsRef.current.keys()].map(peerUserId => (
            createOfferForPeer(peerUserId).catch(error => {
                logCall("Renegotiation failed", { peerUserId, error: error.message || error });
            })
        )));
    };

    const startScreenShare = async () => {
        if (isScreenSharing) {
            await stopScreenShare();
            await renegotiatePeers();
            return;
        }

        if (!navigator.mediaDevices?.getDisplayMedia) {
            setError("Screen sharing is not supported in this browser.");
            return;
        }

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });
            const [screenTrack] = displayStream.getVideoTracks();
            if (!screenTrack) throw new Error("No screen video track selected");

            screenTrackRef.current = screenTrack;
            screenTrack.onended = async () => {
                await stopScreenShare();
                await renegotiatePeers();
            };

            await Promise.all([...peerConnectionsRef.current.values()].map(async peerConnection => {
                const videoSender = peerConnection.getSenders().find(sender => sender.track?.kind === "video");
                if (videoSender) {
                    await videoSender.replaceTrack(screenTrack);
                } else {
                    peerConnection.addTrack(screenTrack, displayStream);
                }
            }));

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = displayStream;
            }
            setIsScreenSharing(true);
            await renegotiatePeers();
        } catch (shareError) {
            logCall("Screen share failed", shareError);
            if (shareError?.name !== "NotAllowedError") {
                setError("Unable to start screen sharing.");
            }
        }
    };

    const toggleFullscreen = () => {
        const panel = document.querySelector(".call-overlay .call-panel");
        if (!document.fullscreenElement) {
            panel?.requestFullscreen?.().catch(error => logCall("Fullscreen request failed", error));
        } else {
            document.exitFullscreen?.().catch(error => logCall("Exit fullscreen failed", error));
        }
    };

    const createOfferForPeer = async (peerUserId, peerUser = null) => {
        const activeCall = activeCallRef.current;
        if (!activeCall || peerUserId === currentUserId) return;

        const peerConnection = createPeerConnection(peerUserId, peerUser);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        emitToPeer(peerUserId, "call:offer", { offer });
    };

    useEffect(() => {
        if (!socket) return undefined;

        const handleIncoming = (data) => {
            if (activeCallRef.current) {
                socket.emit("call:reject", {
                    callId: data.callId,
                });
                return;
            }

            const myUser = (currentUser && (getUserId(currentUser) || currentUser.name)) ? currentUser : getStoredUser();
            const myId = currentUserId || getUserId(currentUser) || getUserId(myUser) || "";
            const callerUser = data.fromUser || data.callerUser || { _id: data.fromUserId, name: "User" };

            const rawParticipantIds = uniqueIds(data.participantIds || [data.fromUserId]);
            const otherIds = rawParticipantIds.filter(id => id && id !== myId && id !== data.fromUserId);
            const isGroupCall = Boolean(
                data.isGroupCall !== undefined
                    ? data.isGroupCall
                    : otherIds.length > 0
            );

            const displayTitle = isGroupCall
                ? (data.groupTitle || data.title || "Group call")
                : (callerUser?.name || "User");

            const incomingCall = {
                callId: data.callId,
                type: data.callType === "video" ? "video" : "audio",
                status: "incoming",
                peerUser: callerUser,
                peerUserId: data.fromUserId,
                participantIds: isGroupCall ? rawParticipantIds.filter(id => id !== myId) : [data.fromUserId],
                isCaller: false,
                isGroupCall,
                title: displayTitle,
            };

            activeCallRef.current = incomingCall;
            setCall(incomingCall);
            emitCallEvent(incomingCall, {
                status: "missed",
                startedAt: new Date().toISOString(),
            });
            setRemoteParticipants([{
                userId: data.fromUserId,
                user: callerUser,
                stream: null,
            }]);
            setError("");
            notifyIncomingCall(incomingCall);
            startRingtone();
        };

        const handleRinging = (data) => {
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) return;
            setError(data.unavailableIds?.length ? "Some participants are offline; ringing the remaining participants." : "");
        };

        const handleUnavailable = (data) => {
            const activeCall = activeCallRef.current;
            if (activeCall && data.callId && activeCall.callId !== data.callId) return;
            resetCall();
            setError(data.reason || "Users are not available for the call.");
        };

        const handleJoined = (data) => {
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) return;

            const activeNextCall = activateCall(activeCall);

            (data.participants || []).forEach(participant => {
                upsertRemoteParticipant(participant.userId, { user: participant.user });
            });
        };

        const handleParticipantJoined = async (data) => {
            try {
                const activeCall = activeCallRef.current;
                if (!activeCall || activeCall.callId !== data.callId || !data.fromUserId || data.fromUserId === currentUserId) return;

                const activeNextCall = activateCall({
                    ...activeCall,
                    participantIds: uniqueIds([...activeCall.participantIds, data.fromUserId]),
                });
                window.clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
                upsertRemoteParticipant(data.fromUserId, { user: data.fromUser });
                await createOfferForPeer(data.fromUserId, data.fromUser);
            } catch (error) {
                logCall("call:participant-joined failed", error);
                setError("Unable to connect the participant.");
            }
        };

        const handleOffer = async (data) => {
            try {
                const activeCall = activeCallRef.current;
                if (!activeCall || activeCall.callId !== data.callId || !data.fromUserId) return;

                const peerConnection = createPeerConnection(data.fromUserId, data.fromUser);
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                await flushCandidateQueue(data.fromUserId);

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                const activeNextCall = activateCall({
                    ...activeCall,
                    participantIds: uniqueIds([...activeCall.participantIds, data.fromUserId]),
                });

                emitToPeer(data.fromUserId, "call:answer", { answer });
            } catch (error) {
                logCall("call:offer failed", error);
                setError("Unable to connect the call.");
            }
        };

        const handleAnswer = async (data) => {
            try {
                const activeCall = activeCallRef.current;
                const peerConnection = peerConnectionsRef.current.get(data.fromUserId);
                if (!activeCall || activeCall.callId !== data.callId || !peerConnection) return;

                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                await flushCandidateQueue(data.fromUserId);

                activateCall(activeCall);
            } catch (error) {
                logCall("call:answer failed", error);
                setError("Unable to connect the call.");
            }
        };

        const handleIceCandidate = async (data) => {
            const activeCall = activeCallRef.current;
            const peerUserId = data.fromUserId;
            const peerConnection = peerConnectionsRef.current.get(peerUserId);
            if (!activeCall || activeCall.callId !== data.callId || !data.candidate || !peerUserId) return;

            if (!peerConnection?.remoteDescription) {
                const queue = candidateQueuesRef.current.get(peerUserId) || [];
                candidateQueuesRef.current.set(peerUserId, [...queue, data.candidate]);
                logCall("Remote ICE candidate queued", { peerUserId, ...summarizeCandidate(data.candidate) });
                return;
            }

            logCall("Remote ICE candidate add", { peerUserId, ...summarizeCandidate(data.candidate) });
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(error => {
                logCall("Failed to add ICE candidate", error);
            });
        };

        const handleCallClosed = (data) => {
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) return;

            if (data.fromUserId && activeCall.isGroupCall) {
                removePeer(data.fromUserId);
                return;
            }

            completeCall(data.status || "ended");
            resetCall();
        };

        const handleCallRejected = (data) => {
            handleCallClosed({ ...data, status: activeCallRef.current?.isCaller ? "declined" : "cancelled" });
        };

        const handleCallMissed = (data) => {
            handleCallClosed({ ...data, status: "missed" });
        };

        const handleAnsweredElsewhere = (data) => {
            const activeCall = activeCallRef.current;
            if (activeCall && (!data?.callId || activeCall.callId === data.callId)) {
                logCall("Call answered on another device", data);
                stopRingtone();
                completeCall("answered-elsewhere");
                resetCall();
            }
        };

        const handleConnect = () => {
            socket.emit("chat:get-online-users");
            const activeCall = activeCallRef.current;
            if (activeCall?.callId) {
                socket.emit("call:rebind", { callId: activeCall.callId });
            }
        };

        socket.on("connect", handleConnect);
        socket.on("call:answered-elsewhere", handleAnsweredElsewhere);
        socket.on("call:incoming", handleIncoming);
        socket.on("call:ringing", handleRinging);
        socket.on("call:unavailable", handleUnavailable);
        socket.on("call:joined", handleJoined);
        socket.on("call:participant-joined", handleParticipantJoined);
        socket.on("call:offer", handleOffer);
        socket.on("call:answer", handleAnswer);
        socket.on("call:ice-candidate", handleIceCandidate);
        socket.on("call:rejected", handleCallRejected);
        socket.on("call:ended", handleCallClosed);
        socket.on("call:missed", handleCallMissed);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("call:answered-elsewhere", handleAnsweredElsewhere);
            socket.off("call:incoming", handleIncoming);
            socket.off("call:ringing", handleRinging);
            socket.off("call:unavailable", handleUnavailable);
            socket.off("call:joined", handleJoined);
            socket.off("call:participant-joined", handleParticipantJoined);
            socket.off("call:offer", handleOffer);
            socket.off("call:answer", handleAnswer);
            socket.off("call:ice-candidate", handleIceCandidate);
            socket.off("call:rejected", handleCallRejected);
            socket.off("call:ended", handleCallClosed);
            socket.off("call:missed", handleCallMissed);
        };
    }, [socket, currentUserId, currentUser, onCallEvent]);

    useEffect(() => {
        if (!socket || !currentUserId) return;

        const query = new URLSearchParams(window.location.search);
        const callType = query.get("callType");
        const callTarget = query.get("callTarget");
        const callTargetName = query.get("callTargetName");

        const acceptCallId = query.get("acceptCallId");
        const acceptCallType = query.get("acceptCallType");
        const callerId = query.get("callerId");
        const callerName = query.get("callerName");

        if (callType && callTarget) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, "", cleanUrl);

            const userObj = {
                _id: callTarget,
                name: callTargetName || "User",
            };
            startCall(callType === "video" ? "video" : "audio", userObj);
        } else if (acceptCallId && acceptCallType && callerId) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, "", cleanUrl);

            const incomingCall = {
                callId: acceptCallId,
                type: acceptCallType === "video" ? "video" : "audio",
                status: "incoming",
                peerUser: { _id: callerId, name: callerName || "User" },
                peerUserId: callerId,
                participantIds: [callerId],
                isCaller: false,
                isGroupCall: false,
                title: callerName || "User",
            };
            activeCallRef.current = incomingCall;
            setCall(incomingCall);
            emitCallEvent(incomingCall, {
                status: "missed",
                startedAt: new Date().toISOString(),
            });
            setRemoteParticipants([{
                userId: callerId,
                user: { _id: callerId, name: callerName || "User" },
                stream: null,
            }]);
            setError("");

            setTimeout(() => {
                acceptCall();
            }, 600);
        }
    }, [socket, currentUserId]);

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => {
            setError("");
        }, 5000);
        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => () => {
        stopRingtone();
        resetCall();
    }, []);

    if (!call) {
        return error ? (
            <div className="call-toast" role="status" aria-live="polite">
                <span className="call-toast-msg">{error}</span>
                <button
                    type="button"
                    className="call-toast-dismiss-btn"
                    onClick={() => setError("")}
                    aria-label="Dismiss call message"
                    title="Dismiss"
                >
                    <X size={15} />
                </button>
            </div>
        ) : null;
    }

    const avatarSrc = getAvatarSrc(call.peerUser?.avatar || call.peerUser?.profileImage || call.peerUser?.image);
    const isVideoCall = call.type === "video";
    const connectedCount = remoteParticipants.filter(participant => participant.stream).length;
    const statusLabel = call.status === "incoming"
        ? `Incoming ${call.isGroupCall ? "group " : ""}${isVideoCall ? "video" : "voice"} call`
        : call.status === "outgoing"
        ? "Ringing..."
        : call.status === "connecting"
        ? "Connecting..."
        : call.isGroupCall
        ? `${connectedCount} participant${connectedCount === 1 ? "" : "s"} connected`
        : "Connected";
    const displayStatus = connectionStatus || statusLabel;
    const callDuration = call.status === "active" ? formatCallDuration(elapsedSeconds) : "00:00";
    const showsVideoStage = isVideoCall || isScreenSharing;
    const invitedIds = new Set([currentUserId, ...(call.participantIds || [])]);
    const inviteCandidates = availableUsers.filter(user => {
        const userId = getUserId(user);
        return userId && !invitedIds.has(userId);
    });

    const startFloatingDrag = (event) => {
        if (!isMinimized) return;
        const pointer = event.touches?.[0] || event;
        floatingDragRef.current = {
            startX: pointer.clientX,
            startY: pointer.clientY,
            originX: floatingPosition.x,
            originY: floatingPosition.y,
        };

        const move = moveEvent => {
            const nextPointer = moveEvent.touches?.[0] || moveEvent;
            const drag = floatingDragRef.current;
            if (!drag) return;
            setFloatingPosition({
                x: Math.max(8, Math.min(window.innerWidth - 260, drag.originX + nextPointer.clientX - drag.startX)),
                y: Math.max(8, Math.min(window.innerHeight - 120, drag.originY + nextPointer.clientY - drag.startY)),
            });
        };
        const end = () => {
            floatingDragRef.current = null;
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", end);
            window.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", end);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", end);
        window.addEventListener("touchmove", move, { passive: true });
        window.addEventListener("touchend", end);
    };

    if (isMinimized) {
        return (
            <button
                type="button"
                className="call-floating-window"
                style={{ left: floatingPosition.x, top: floatingPosition.y }}
                onMouseDown={startFloatingDrag}
                onTouchStart={startFloatingDrag}
                onClick={() => {
                    if (!floatingDragRef.current) setIsMinimized(false);
                }}
                title="Restore call"
            >
                <span className="call-floating-avatar">
                    {avatarSrc ? <img src={avatarSrc} alt="" /> : (call.title || call.peerUser?.name || "U").charAt(0).toUpperCase()}
                </span>
                <span>
                    <strong>{call.title || call.peerUser?.name || "Call"}</strong>
                    <small>{displayStatus} · {callDuration}</small>
                </span>
                <Maximize2 size={16} />
            </button>
        );
    }

    return (
        <div className={showsVideoStage ? "call-overlay video-call" : "call-overlay voice-call"}>
            <div className="call-panel">
                <div className="call-topbar">
                    <span>{callDuration}</span>
                    <div>
                        <button type="button" className="call-icon-btn" onClick={() => setIsMinimized(true)} title="Minimize call">
                            <Minimize2 size={17} />
                        </button>
                    </div>
                </div>
                <div className={call.isGroupCall ? "call-remote-stage group-stage" : "call-remote-stage"}>
                    {showsVideoStage ? (
                        remoteParticipants.length > 0 ? (
                            <div className="call-video-grid">
                                {remoteParticipants.map(participant => (
                                    <RemoteVideoTile key={participant.userId} participant={participant} />
                                ))}
                            </div>
                        ) : (
                            <div className="call-waiting-text">Waiting for participants...</div>
                        )
                    ) : (
                        <>
                            {remoteParticipants.map(participant => (
                                <RemoteAudioTrack key={participant.userId} participant={participant} />
                            ))}
                            <div className="call-avatar-large">
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt={call.peerUser?.name || "User"}
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "inline";
                                        }}
                                    />
                                ) : null}
                                <span style={{ display: avatarSrc ? "none" : "inline" }}>
                                    {call.peerUser?.name?.charAt(0).toUpperCase() || "U"}
                                </span>
                            </div>
                        </>
                    )}

                    {showsVideoStage && (
                        <video ref={localVideoRef} autoPlay muted playsInline className="call-local-video" />
                    )}
                </div>

                <div className="call-info">
                    <strong>{call.title || call.peerUser?.name || "User"}</strong>
                    <span>{displayStatus}{call.status === "active" ? ` · ${callDuration}` : ""}</span>
                    {error && <small>{error}</small>}
                </div>

                {call.status === "incoming" ? (
                    <div className="call-actions">
                        <button type="button" className="call-btn decline" onClick={rejectCall} title="Reject call">
                            <PhoneOff size={22} />
                        </button>
                        <button type="button" className="call-btn accept" onClick={acceptCall} title="Accept call">
                            <Phone size={22} />
                        </button>
                    </div>
                ) : (
                    <div className="call-actions">
                        <button type="button" className={isMuted ? "call-btn active" : "call-btn"} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                            {isMuted ? <MicOff size={21} /> : <Mic size={21} />}
                        </button>
                        {isVideoCall && (
                            <button type="button" className={isCameraOff ? "call-btn active" : "call-btn"} onClick={toggleCamera} title={isCameraOff ? "Camera on" : "Camera off"}>
                                {isCameraOff ? <VideoOff size={21} /> : <Video size={21} />}
                            </button>
                        )}
                        <button type="button" className={isScreenSharing ? "call-btn active" : "call-btn"} onClick={startScreenShare} title={isScreenSharing ? "Stop sharing" : "Share screen"}>
                            {isScreenSharing ? <ScreenShareOff size={21} /> : <MonitorUp size={21} />}
                        </button>
                        <button type="button" className="call-btn" onClick={openAddPeople} title="Add people">
                            <UserPlus size={21} />
                        </button>
                        <button type="button" className="call-btn" onClick={toggleFullscreen} title="Fullscreen">
                            <Maximize2 size={21} />
                        </button>
                        <button type="button" className="call-btn decline" onClick={endCall} title="End call">
                            <PhoneOff size={22} />
                        </button>
                    </div>
                )}
                {showAddPeople && (
                    <div className="call-add-people-panel">
                        <div className="call-add-people-header">
                            <strong>Add people</strong>
                            <button type="button" onClick={() => setShowAddPeople(false)} title="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="call-add-people-list">
                            {inviteCandidates.length ? inviteCandidates.map(user => {
                                const userId = getUserId(user);
                                const name = user.name || user.fullName || user.email || "User";
                                const avatar = getAvatarSrc(user.avatar || user.profileImage || user.image);
                                const checked = selectedInviteIds.includes(userId);
                                return (
                                    <label key={userId} className="call-add-person">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => setSelectedInviteIds(prev => (
                                                checked ? prev.filter(id => id !== userId) : [...prev, userId]
                                            ))}
                                        />
                                        <span className="call-add-person-avatar">
                                            {avatar ? <img src={avatar} alt="" /> : name.charAt(0).toUpperCase()}
                                        </span>
                                        <span>{name}</span>
                                    </label>
                                );
                            }) : (
                                <div className="call-add-empty">No more users available</div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="call-add-confirm"
                            onClick={inviteSelectedPeople}
                            disabled={!selectedInviteIds.length || isInvitingPeople}
                        >
                            {isInvitingPeople ? "Inviting..." : "Add to call"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

CallOverlay.displayName = "CallOverlay";

export default CallOverlay;
