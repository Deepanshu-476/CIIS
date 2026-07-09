import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import API_URL, { API_URL_IMG, TURN_URL, TURN_USERNAME, TURN_CREDENTIAL } from "../config";
import "../Pages/Chat/chat.css";

const getFallbackIceServers = () => {
    const servers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:openrelay.metered.ca:80" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ];

    if (TURN_URL) {
        const turnServer = { urls: TURN_URL };
        if (TURN_USERNAME) turnServer.username = TURN_USERNAME;
        if (TURN_CREDENTIAL) turnServer.credential = TURN_CREDENTIAL;
        servers.push(turnServer);
    }

    return servers;
};
const logCall = (...args) => void 0;
    
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

const getAvatarSrc = (avatar) => {
    if (!avatar) return null;
    return avatar.startsWith("http")
        ? avatar
        : `${API_URL_IMG.replace(/\/$/, "")}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};
 
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
            audioRef.current.play?.().catch(error => logCall("Remote audio autoplay failed", error));
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
                    {avatarSrc ? <img src={avatarSrc} alt={participant.user?.name} /> : participant.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
            )}
            <div className="call-tile-name">{participant.user?.name || "Participant"}</div>
        </div>
    );
};

const CallOverlay = forwardRef(({ socket, currentUser }, ref) => {
    const [call, setCall] = useState(null);
    const [error, setError] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [remoteParticipants, setRemoteParticipants] = useState([]);
    const localVideoRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());
    const localStreamRef = useRef(null);
    const candidateQueuesRef = useRef(new Map());
    const activeCallRef = useRef(null);
    const audioContextRef = useRef(null);
    const ringtoneTimerRef = useRef(null);
    const callTimeoutRef = useRef(null);
    const iceServersRef = useRef(getFallbackIceServers());
    const iceServersLoadedAtRef = useRef(0);
    const currentUserId = getUserId(currentUser);

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
            return iceServers;
        } catch (turnError) {
            logCall("Using STUN fallback; TURN credentials unavailable", turnError);
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
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
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
        resetPeers();
        stopStreams();
        activeCallRef.current = null;
        setCall(null);
        setError("");
        setIsMuted(false);
        setIsCameraOff(false);
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

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                emitToPeer(peerUserId, "call:ice-candidate", { candidate: event.candidate });
            }
        };

        peerConnection.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) {
                upsertRemoteParticipant(peerUserId, {
                    user: peerUser || getKnownParticipantUser(activeCallRef.current?.peerUser, peerUserId),
                    stream,
                });
            }
        };

        peerConnection.onconnectionstatechange = () => {
            if (["failed", "closed"].includes(peerConnection.connectionState)) {
                setRemoteParticipants(prev => prev.filter(participant => participant.userId !== peerUserId));
            }
        };

        localStreamRef.current?.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current);
        });

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
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
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

    const startCall = async (callType, user) => {
        if (!socket || !user) {
            setError("Unable to start the call.");
            return;
        }

        if (!socket.connected) {
            setError("Socket is not connected. Please refresh and try the call again.");
            return;
        }

        const participantIds = getCallParticipantIds(user, currentUserId);
        if (participantIds.length === 0) {
            setError("No participant found for the call.");
            return;
        }

        const availability = await checkCallAvailability(participantIds);
        if (!availability.success) {
            setError(availability.reason || "Users are offline.");
            return;
        }

        const isGroupCall = user.isGroup || participantIds.length > 1;
        const nextCall = {
            callId: `${currentUserId || "user"}-${Date.now()}`,
            type: callType,
            status: "outgoing",
            peerUser: user,
            peerUserId: participantIds[0],
            participantIds,
            isCaller: true,
            isGroupCall,
            title: isGroupCall ? getGroupName(user) : user.name,
        };

        activeCallRef.current = nextCall;
        setCall(nextCall);
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
                title: nextCall.title,
            });
            callTimeoutRef.current = window.setTimeout(() => {
                if (activeCallRef.current?.callId === nextCall.callId && activeCallRef.current?.status === "outgoing") {
                    socket.emit("call:end", { callId: nextCall.callId });
                    resetCall();
                    setError("The call was not answered.");
                }
            }, 45000);
        } catch (mediaError) {
            logCall("startCall media error", mediaError);
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
        socket?.emit("call:reject", { callId: activeCallRef.current?.callId });
        resetCall();
    };

    const endCall = () => {
        const activeCall = activeCallRef.current;
        if (activeCall) {
            socket?.emit("call:end", { callId: activeCall.callId });
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

            const participantIds = uniqueIds(data.participantIds || [data.fromUserId]).filter(id => id !== currentUserId);
            const incomingCall = {
                callId: data.callId,
                type: data.callType === "video" ? "video" : "audio",
                status: "incoming",
                peerUser: data.fromUser,
                peerUserId: data.fromUserId,
                participantIds,
                isCaller: false,
                isGroupCall: participantIds.length > 1,
                title: data.title || data.fromUser?.name,
            };

            activeCallRef.current = incomingCall;
            setCall(incomingCall);
            setRemoteParticipants([{
                userId: data.fromUserId,
                user: data.fromUser,
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

            const activeNextCall = { ...activeCall, status: "active" };
            activeCallRef.current = activeNextCall;
            setCall(activeNextCall);
            stopRingtone();

            (data.participants || []).forEach(participant => {
                upsertRemoteParticipant(participant.userId, { user: participant.user });
            });
        };

        const handleParticipantJoined = async (data) => {
            try {
                const activeCall = activeCallRef.current;
                if (!activeCall || activeCall.callId !== data.callId || !data.fromUserId || data.fromUserId === currentUserId) return;

                const activeNextCall = {
                    ...activeCall,
                    status: "active",
                    participantIds: uniqueIds([...activeCall.participantIds, data.fromUserId]),
                };
                activeCallRef.current = activeNextCall;
                setCall(activeNextCall);
                stopRingtone();
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

                const activeNextCall = {
                    ...activeCall,
                    status: "active",
                    participantIds: uniqueIds([...activeCall.participantIds, data.fromUserId]),
                };
                activeCallRef.current = activeNextCall;
                setCall(activeNextCall);

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

                const activeNextCall = { ...activeCall, status: "active" };
                activeCallRef.current = activeNextCall;
                setCall(activeNextCall);
                stopRingtone();
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
                return;
            }

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

            resetCall();
        };

        socket.on("call:incoming", handleIncoming);
        socket.on("call:ringing", handleRinging);
        socket.on("call:unavailable", handleUnavailable);
        socket.on("call:joined", handleJoined);
        socket.on("call:participant-joined", handleParticipantJoined);
        socket.on("call:offer", handleOffer);
        socket.on("call:answer", handleAnswer);
        socket.on("call:ice-candidate", handleIceCandidate);
        socket.on("call:rejected", handleCallClosed);
        socket.on("call:ended", handleCallClosed);

        return () => {
            socket.off("call:incoming", handleIncoming);
            socket.off("call:ringing", handleRinging);
            socket.off("call:unavailable", handleUnavailable);
            socket.off("call:joined", handleJoined);
            socket.off("call:participant-joined", handleParticipantJoined);
            socket.off("call:offer", handleOffer);
            socket.off("call:answer", handleAnswer);
            socket.off("call:ice-candidate", handleIceCandidate);
            socket.off("call:rejected", handleCallClosed);
            socket.off("call:ended", handleCallClosed);
        };
    }, [socket, currentUserId, remoteParticipants]);

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

    useEffect(() => () => {
        stopRingtone();
        resetCall();
    }, []);

    if (!call) {
        return error ? <div className="call-toast">{error}</div> : null;
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

    return (
        <div className={isVideoCall ? "call-overlay video-call" : "call-overlay voice-call"}>
            <div className="call-panel">
                <div className={call.isGroupCall ? "call-remote-stage group-stage" : "call-remote-stage"}>
                    {isVideoCall ? (
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
                        <div className="call-avatar-large">
                            {avatarSrc ? <img src={avatarSrc} alt={call.peerUser?.name} /> : call.peerUser?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                    )}

                    {isVideoCall && (
                        <video ref={localVideoRef} autoPlay muted playsInline className="call-local-video" />
                    )}
                </div>

                <div className="call-info">
                    <strong>{call.title || call.peerUser?.name || "User"}</strong>
                    <span>{statusLabel}</span>
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
                        <button type="button" className="call-btn decline" onClick={endCall} title="End call">
                            <PhoneOff size={22} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

CallOverlay.displayName = "CallOverlay";

export default CallOverlay;
