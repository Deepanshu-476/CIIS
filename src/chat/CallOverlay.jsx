import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { API_URL_IMG } from "../config";

const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

const getUserId = (user) => (user?._id || user?.id || "").toString();

const getAvatarSrc = (avatar) => {
    if (!avatar) return null;
    return avatar.startsWith("http")
        ? avatar
        : `${API_URL_IMG.replace(/\/$/, "")}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
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

    const attachLocalStream = (stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    };

    const attachRemoteStream = (stream) => {
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
        if (!socket || !activeCall?.peerUserId) return;

        socket.emit(eventName, {
            ...payload,
            callId: activeCall.callId,
            toUserId: activeCall.peerUserId,
            callType: activeCall.type,
        });
    };

    const createPeerConnection = () => {
        const peerConnection = new RTCPeerConnection({ iceServers });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                emitToPeer("call:ice-candidate", { candidate: event.candidate });
            }
        };

        peerConnection.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) {
                attachRemoteStream(stream);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            if (["failed", "disconnected", "closed"].includes(peerConnection.connectionState)) {
                if (activeCallRef.current?.status === "active") {
                    setError("Call disconnected.");
                }
            }
        };

        localStreamRef.current?.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStreamRef.current);
        });

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    };

    const getMediaStream = async (callType) => {
        try {
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

    const startCall = async (callType, user) => {
        if (!socket || !user || user.isGroup) {
            setError(user?.isGroup ? "Group calling abhi available nahi hai." : "Call start nahi ho paayi.");
            return;
        }

        const peerUserId = getUserId(user);
        if (!peerUserId) return;

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
            socket.emit("call:invite", {
                callId: nextCall.callId,
                toUserId: peerUserId,
                callType,
            });
        } catch (mediaError) {
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
            socket.emit("call:accept", {
                callId: activeCall.callId,
                toUserId: activeCall.peerUserId,
                callType: activeCall.type,
            });
        } catch (mediaError) {
            socket.emit("call:reject", {
                callId: activeCall.callId,
                toUserId: activeCall.peerUserId,
            });
            resetCall();
        }
    };

    const rejectCall = () => {
        emitToPeer("call:reject");
        resetCall();
    };

    const endCall = () => {
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
            if (activeCallRef.current) {
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
        };

        const handleAccepted = async (data) => {
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) return;

            const connectingCall = { ...activeCall, status: "connecting" };
            activeCallRef.current = connectingCall;
            setCall(connectingCall);

            const peerConnection = createPeerConnection();
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.emit("call:offer", {
                callId: activeCall.callId,
                toUserId: activeCall.peerUserId,
                offer,
            });
        };

        const handleOffer = async (data) => {
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) return;

            const peerConnection = peerConnectionRef.current || createPeerConnection();
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            await flushCandidateQueue();

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            const activeNextCall = { ...activeCall, status: "active" };
            activeCallRef.current = activeNextCall;
            setCall(activeNextCall);

            socket.emit("call:answer", {
                callId: activeCall.callId,
                toUserId: activeCall.peerUserId,
                answer,
            });
        };

        const handleAnswer = async (data) => {
            const activeCall = activeCallRef.current;
            const peerConnection = peerConnectionRef.current;
            if (!activeCall || activeCall.callId !== data.callId || !peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            await flushCandidateQueue();

            const activeNextCall = { ...activeCall, status: "active" };
            activeCallRef.current = activeNextCall;
            setCall(activeNextCall);
        };

        const handleIceCandidate = async (data) => {
            const activeCall = activeCallRef.current;
            const peerConnection = peerConnectionRef.current;
            if (!activeCall || activeCall.callId !== data.callId || !data.candidate) return;

            if (!peerConnection?.remoteDescription) {
                candidateQueueRef.current.push(data.candidate);
                return;
            }

            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
        };

        const handleCallClosed = (data) => {
            const activeCall = activeCallRef.current;
            if (!activeCall || activeCall.callId !== data.callId) return;
            resetCall();
        };

        socket.on("call:incoming", handleIncoming);
        socket.on("call:accepted", handleAccepted);
        socket.on("call:offer", handleOffer);
        socket.on("call:answer", handleAnswer);
        socket.on("call:ice-candidate", handleIceCandidate);
        socket.on("call:rejected", handleCallClosed);
        socket.on("call:ended", handleCallClosed);

        return () => {
            socket.off("call:incoming", handleIncoming);
            socket.off("call:accepted", handleAccepted);
            socket.off("call:offer", handleOffer);
            socket.off("call:answer", handleAnswer);
            socket.off("call:ice-candidate", handleIceCandidate);
            socket.off("call:rejected", handleCallClosed);
            socket.off("call:ended", handleCallClosed);
        };
    }, [socket]);

    useEffect(() => () => resetCall(), []);

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
                        <video ref={remoteVideoRef} autoPlay playsInline className="call-remote-video" />
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
