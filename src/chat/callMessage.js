// Call log entries are system messages ({systemEvent.type: "call", call: {...}}) posted by the backend when a call ends.
export const isCallMessage = message => message?.messageType === "system" && message?.systemEvent?.type === "call";

export const formatCallDuration = seconds => {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    if (!total) return "";
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = String(total % 60).padStart(2, "0");
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}` : `${minutes}:${secs}`;
};

export const describeCallMessage = (message, currentUserId) => {
    const call = message?.call || {};
    const callerId = call.caller?._id || call.caller || message?.sender?._id || message?.sender;
    const outgoing = String(callerId || "") === String(currentUserId || "");
    const answered = call.status === "completed";
    const kind = call.callType === "video" ? "Video" : "Voice";
    let label;
    if (answered) label = `${kind} call`;
    else if (outgoing) label = call.status === "rejected" ? `${kind} call declined` : `${kind} call not answered`;
    else label = `Missed ${kind.toLowerCase()} call`;
    const duration = answered ? formatCallDuration(call.durationSeconds) : "";
    return {
        outgoing,
        missed: !answered && !outgoing,
        isVideo: call.callType === "video",
        text: duration ? `${label} · ${duration}` : label,
    };
};
