import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { API_URL_IMG, TURN_URL, TURN_USERNAME, TURN_CREDENTIAL } from "../config";
import "../Pages/Chat/chat.css";

const getIceServers = () => {
    const servers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ];

    if (TURN_URL) {
        const turnServer = { urls: TURN_URL };
        if (TURN_USERNAME) turnServer.username = TURN_USERNAME;
        if (TURN_CREDENTIAL) turnServer.credential = TURN_CREDENTIAL;
        servers.push(turnServer);
    }

    return servers;
};

const logCall = (...args) => console.log('[CallOverlay]', ...args);

const getUserId = (user) => (user?._id || user?.id || "").toString();

const getAvatarSrc = (avatar) => {
    if (!avatar) return null;
    return avatar.startsWith("http")
        ? avatar
        : `${API_URL_IMG.replace(/\/$/, "")}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

const notifyIncomingCall = (incomingCall) => {
    const callerName = incomingCall.peerUser?.name || "User";
    const title = incomingCall.type === "video" ? "Incoming video call" : "Incoming voice call";
    const body = `${callerName} is calling`;

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

const CallOverlay = forwardRef(({ socket, currentUser }, ref) => {
    const [call, setCall] = useState(null);
    const [error, setError] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const candidateQueueRef = useRef([]);
    const activeCallRef = useRef(null);
    const audioContextRef = useRef(null);
    const ringtoneTimerRef = useRef(null);
    const callTimeoutRef = useRef(null);

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
        ringtoneTimerRef.current = window.setInterval(() => {
            createTone();
        }, 1100);
    };

    const attachLocalStream = (stream) => {
        logCall('Attaching local stream', stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    };

    const attachRemoteStream = (stream) => {
        logCall('Attaching remote stream', stream);
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
        }
    };

    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }

        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }

        if (remoteAudioRef.current && remoteStreamRef.current) {
            remoteAudioRef.current.srcObject = remoteStreamRef.current;
        }
    }, [call?.status, call?.type]);

    const stopStreams = () => {
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        remoteStreamRef.current = null;
    };

    const resetPeer = () => {
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        candidateQueueRef.current = [];
    };

    const resetCall = () => {
        stopRingtone();
        window.clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
        resetPeer();
        stopStreams();
        activeCallRef.current = null;
        setCall(null);
        setError("");
        setIsMuted(false);
        setIsCameraOff(false);
    };

    const emitToPeer = (eventName, payload = {}) => {
        const activeCall = activeCallRef.current;
        if (!socket || !activeCall?.peerUserId) {
            logCall('emitToPeer skipped, missing socket or peerUserId', { eventName, activeCall });
            return;
        }

        const payloadWithMeta = {
            ...payload,
            callId: activeCall.callId,
            toUserId: activeCall.peerUserId,
            callType: activeCall.type,
        };
        logCall('Emitting to peer', eventName, payloadWithMeta);
        socket.emit(eventName, payloadWithMeta);
    };

    const createPeerConnection = () => {
        logCall('Creating RTCPeerConnection', getIceServers());
        const peerConnection = new RTCPeerConnection({ iceServers: getIceServers() });

        peerConnection.onicecandidate = (event) => {
            logCall('Peer connection ICE candidate', event.candidate);
            if (event.candidate) {
                emitToPeer("call:ice-candidate", { candidate: event.candidate });
            }
        };

        peerConnection.ontrack = (event) => {
            const [stream] = event.streams;
            logCall('Peer connection ontrack', event);
            if (stream) {
                attachRemoteStream(stream);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            logCall('Peer connection state change', peerConnection.connectionState);
            if (["failed", "disconnected", "closed"].includes(peerConnection.connectionState)) {
                if (activeCallRef.current?.status === "active") {
                    setError("Call disconnected.");
                }
            }
        };

        localStreamRef.current?.getTracks().forEach((track) => {
            logCall('Adding local track to peer connection', track.kind);
            peerConnection.addTrack(track, localStreamRef.current);
        });

        peerConnectionRef.current = peerConnection;
        return peerConnection;
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
            setError("Mic/camera permission allow karke phir try karein.");
            throw mediaError;
        }
    };

    const flushCandidateQueue = async () => {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection?.remoteDescription) return;

        const queuedCandidates = [...candidateQueueRef.current];
        candidateQueueRef.current = [];

        await Promise.all(queuedCandidates.map(candidate => (
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
        )));
    };

    const checkCallAvailability = (peerUserId) => new Promise((resolve) => {
        if (!socket?.connected) {
            resolve({ success: false, reason: "Socket connect nahi hai. Please refresh karke phir call try karein." });
            return;
        }

        let settled = false;
        const finish = (response) => {
            if (settled) return;
            settled = true;
            resolve(response || { success: false, reason: "User call ke liye available nahi hai." });
        };

        socket.emit("call:check-availability", { toUserId: peerUserId }, finish);
        window.setTimeout(() => {
            finish({ success: false, reason: "Call availability check timeout." });
        }, 3000);
    });

    const startCall = async (callType, user) => {
        if (!socket || !user || user.isGroup) {
            setError(user?.isGroup ? "Group calling abhi available nahi hai." : "Call start nahi ho paayi.");
            return;
        }

        if (!socket.connected) {
            setError("Socket connect nahi hai. Please refresh karke phir call try karein.");
            return;
        }

        const peerUserId = getUserId(user);
        if (!peerUserId) return;

        const availability = await checkCallAvailability(peerUserId);
        if (!availability.success) {
            setError(availability.reason || "User is offline");
            return;
        }

        const nextCall = {
            callId: `${getUserId(currentUser)}-${peerUserId}-${Date.now()}`,
            type: callType,
            status: "outgoing",
            peerUser: user,
            peerUserId,
            isCaller: true,
        };

        activeCallRef.current = nextCall;
        setCall(nextCall);
        setError("");

        try {
            await getMediaStream(callType);
            startRingtone();
            logCall('Sending call:invite', { callId: nextCall.callId, peerUserId, callType });
            socket.emit("call:invite", {
                callId: nextCall.callId,
                toUserId: peerUserId,
                callType,
            });
            callTimeoutRef.current = window.setTimeout(() => {
                if (activeCallRef.current?.callId === nextCall.callId && activeCallRef.current?.status === "outgoing") {
                    emitToPeer("call:end");
                    resetCall();
                    setError("Call answer nahi hua.");
                }
            }, 45000);
        } catch (mediaError) {
            logCall('startCall media error', mediaError);
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
            await getMediaStream(activeCall.type);
            const acceptedCall = { ...activeCall, status: "connecting" };
            activeCallRef.current = acceptedCall;
            setCall(acceptedCall);
            stopRingtone();
            window.clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
            logCall('Sending call:accept', { callId: activeCall.callId, peerUserId: activeCall.peerUserId, callType: activeCall.type });
            socket.emit("call:accept", {
                callId: activeCall.callId,
                toUserId: activeCall.peerUserId,
                callType: activeCall.type,
            });
        } catch (mediaError) {
            logCall('acceptCall media error', mediaError);
            socket.emit("call:reject", {
                callId: activeCall.callId,
                toUserId: activeCall.peerUserId,
            });
            resetCall();
        }
    };

    const rejectCall = () => {
        logCall('Sending call:reject', activeCallRef.current);
        emitToPeer("call:reject");
        resetCall();
    };

    const endCall = () => {
        logCall('Sending call:end', activeCallRef.current);
        emitToPeer("call:end");
        resetCall();
    };

    const toggleMute = () => {
        const nextMuted = !isMuted;
        localStreamRef.current?.getAudioTracks().forEach((track) => {
            track.enabled = !nextMuted;
        });
        setIsMuted(nextMuted);
    };

    const toggleCamera = () => {
        const nextCameraOff = !isCameraOff;
        localStreamRef.current?.getVideoTracks().forEach((track) => {
            track.enabled = !nextCameraOff;
        });
        setIsCameraOff(nextCameraOff);
    };

    useEffect(() => {
        if (!socket) return undefined;

        const handleIncoming = (data) => {
            logCall('Received call:incoming', data);
            if (activeCallRef.current) {
                logCall('Rejecting incoming call because another call is active', data.callId);
                socket.emit("call:reject", {
                    callId: data.callId,
                    toUserId: data.fromUserId,
                });
                return;
            }

            const incomingCall = {
                callId: data.callId,
                type: data.callType === "video" ? "video" : "audio",
                status: "incoming",
                peerUser: data.fromUser,
                peerUserId: data.fromUserId,
                isCaller: false,
            };

            activeCallRef.current = incomingCall;
            setCall(incomingCall);
            setError("");
            notifyIncomingCall(incomingCall);
            startRingtone();
        };

        const handleRinging = (data) => {
            logCall('Received call:ringing', data);
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) return;
            setError("");
        };

        const handleUnavailable = (data) => {
            logCall('Received call:unavailable', data);
            const activeCall = activeCallRef.current;
            if (activeCall && data.callId && activeCall.callId !== data.callId) return;
            resetCall();
            setError(data.reason || "User call ke liye available nahi hai.");
        };

        const handleAccepted = async (data) => {
            try {
                logCall('Received call:accepted', data);
                const activeCall = activeCallRef.current;
                if (!activeCall || activeCall.callId !== data.callId) {
                    logCall('call:accepted ignored: no active call or mismatched callId', data.callId);
                    return;
                }

                const connectingCall = { ...activeCall, status: "connecting" };
                activeCallRef.current = connectingCall;
                setCall(connectingCall);
                stopRingtone();
                window.clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;

                const peerConnection = createPeerConnection();
                const offer = await peerConnection.createOffer();
                logCall('Created offer for call:offer', offer);
                await peerConnection.setLocalDescription(offer);

                socket.emit("call:offer", {
                    callId: activeCall.callId,
                    toUserId: activeCall.peerUserId,
                    offer,
                });
            } catch (error) {
                logCall("call:accepted failed", error);
                setError("Call connect nahi ho paayi.");
                emitToPeer("call:end");
            }
        };

        const handleOffer = async (data) => {
            try {
                logCall('Received call:offer', data);
                const activeCall = activeCallRef.current;
                if (!activeCall || activeCall.callId !== data.callId) {
                    logCall('call:offer ignored: no active call or mismatched callId', data.callId);
                    return;
                }

                const peerConnection = peerConnectionRef.current || createPeerConnection();
                logCall('Setting remote description for offer');
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                await flushCandidateQueue();

                const answer = await peerConnection.createAnswer();
                logCall('Created answer for call:answer', answer);
                await peerConnection.setLocalDescription(answer);

                const activeNextCall = { ...activeCall, status: "active" };
                activeCallRef.current = activeNextCall;
                setCall(activeNextCall);

                socket.emit("call:answer", {
                    callId: activeCall.callId,
                    toUserId: activeCall.peerUserId,
                    answer,
                });
            } catch (error) {
                logCall("call:offer failed", error);
                setError("Call connect nahi ho paayi.");
                emitToPeer("call:end");
            }
        };

        const handleAnswer = async (data) => {
            try {
                logCall('Received call:answer', data);
                const activeCall = activeCallRef.current;
                const peerConnection = peerConnectionRef.current;
                if (!activeCall || activeCall.callId !== data.callId || !peerConnection) {
                    logCall('call:answer ignored: no active call or missing peerConnection', data.callId);
                    return;
                }

                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                await flushCandidateQueue();

                const activeNextCall = { ...activeCall, status: "active" };
                activeCallRef.current = activeNextCall;
                setCall(activeNextCall);
                stopRingtone();
            } catch (error) {
                logCall("call:answer failed", error);
                setError("Call connect nahi ho paayi.");
                emitToPeer("call:end");
            }
        };

        const handleIceCandidate = async (data) => {
            logCall('Received call:ice-candidate', data);
            const activeCall = activeCallRef.current;
            const peerConnection = peerConnectionRef.current;
            if (!activeCall || activeCall.callId !== data.callId || !data.candidate) {
                logCall('call:ice-candidate ignored: mismatched call or missing candidate', data);
                return;
            }

            if (!peerConnection?.remoteDescription) {
                logCall('Queueing ICE candidate until remote description is set');
                candidateQueueRef.current.push(data.candidate);
                return;
            }

            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch((error) => {
                logCall('Failed to add ICE candidate', error);
            });
        };

        const handleCallClosed = (data) => {
            logCall('Received call closed event', data);
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) {
                logCall('call closed ignored: no active call or mismatched callId', data.callId);
                return;
            }
            stopRingtone();
            resetCall();
        };

        socket.on("call:incoming", handleIncoming);
        socket.on("call:ringing", handleRinging);
        socket.on("call:unavailable", handleUnavailable);
        socket.on("call:accepted", handleAccepted);
        socket.on("call:offer", handleOffer);
        socket.on("call:answer", handleAnswer);
        socket.on("call:ice-candidate", handleIceCandidate);
        socket.on("call:rejected", handleCallClosed);
        socket.on("call:ended", handleCallClosed);

        return () => {
            socket.off("call:incoming", handleIncoming);
            socket.off("call:ringing", handleRinging);
            socket.off("call:unavailable", handleUnavailable);
            socket.off("call:accepted", handleAccepted);
            socket.off("call:offer", handleOffer);
            socket.off("call:answer", handleAnswer);
            socket.off("call:ice-candidate", handleIceCandidate);
            socket.off("call:rejected", handleCallClosed);
            socket.off("call:ended", handleCallClosed);
        };
    }, [socket]);

    useEffect(() => () => {
        stopRingtone();
        resetCall();
    }, []);

    if (!call) {
        return error ? <div className="call-toast">{error}</div> : null;
    }

    const avatarSrc = getAvatarSrc(call.peerUser?.avatar || call.peerUser?.profileImage || call.peerUser?.image);
    const isVideoCall = call.type === "video";
    const statusLabel = call.status === "incoming"
        ? `Incoming ${isVideoCall ? "video" : "voice"} call`
        : call.status === "outgoing"
        ? "Ringing..."
        : call.status === "connecting"
        ? "Connecting..."
        : "Connected";

    return (
        <div className={isVideoCall ? "call-overlay video-call" : "call-overlay voice-call"}>
            <div className="call-panel">
                <audio ref={remoteAudioRef} autoPlay playsInline />
                <div className="call-remote-stage">
                    {isVideoCall ? (
                        <video ref={remoteVideoRef} autoPlay muted playsInline className="call-remote-video" />
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
                    <strong>{call.peerUser?.name || "User"}</strong>
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
