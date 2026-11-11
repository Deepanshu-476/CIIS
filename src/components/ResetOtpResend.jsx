import React, { useCallback, useEffect, useState } from "react";
import "./ResetOtpResend.css";

// Forgot-password OTP limits, shown the same way on every page that sends one.
// The server decides (60 s wait between sends, 5 sends, then a 1 hour lock) and
// returns resendAfterSeconds / attemptsLeft / lockedUntil; this only displays it.
// Older servers send none of these, so a plain 60 s wait is used then.
const DEFAULT_WAIT_SECONDS = 60;

export const formatOtpWait = (seconds) => {
    const s = Math.max(0, Math.ceil(seconds));
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const useResetOtpLimit = () => {
    const [limit, setLimit] = useState({ resendAt: 0, lockedUntil: 0, attemptsLeft: null, maxAttempts: 5 });
    const [now, setNow] = useState(() => Date.now());
    const waitUntil = Math.max(limit.resendAt, limit.lockedUntil);

    useEffect(() => {
        if (waitUntil <= Date.now()) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [waitUntil]);

    const apply = useCallback((data = {}) => {
        const at = Date.now();
        setNow(at);
        setLimit((previous) => {
            const lockedUntil = data.lockedUntil
                ? new Date(data.lockedUntil).getTime()
                : data.errorCode === "OTP_LOCKED" ? at + Number(data.retryAfterSeconds || 3600) * 1000 : 0;
            const wait = Number(data.resendAfterSeconds);
            return {
                resendAt: at + (Number.isFinite(wait) && wait > 0 ? wait : DEFAULT_WAIT_SECONDS) * 1000,
                lockedUntil,
                attemptsLeft: Number.isFinite(Number(data.attemptsLeft)) && data.attemptsLeft !== null ? Number(data.attemptsLeft) : previous.attemptsLeft,
                maxAttempts: Number(data.maxAttempts) || previous.maxAttempts,
            };
        });
    }, []);

    // Returns true when the error was a limit answer (wait or lock) and has been applied.
    const applyError = useCallback((error) => {
        const data = error?.response?.data;
        if (error?.response?.status !== 429 || !data || !["OTP_COOLDOWN", "OTP_LOCKED"].includes(data.errorCode)) return false;
        apply(data);
        return true;
    }, [apply]);

    const reset = useCallback(() => setLimit({ resendAt: 0, lockedUntil: 0, attemptsLeft: null, maxAttempts: 5 }), []);

    const locked = limit.lockedUntil > now;
    const lockEnded = limit.lockedUntil && limit.lockedUntil <= now;
    const secondsLeft = Math.max(0, Math.ceil((waitUntil - now) / 1000));
    return {
        locked,
        secondsLeft,
        canSend: secondsLeft === 0 && !locked,
        // After the hour the server gives all tries back.
        attemptsLeft: lockEnded ? null : limit.attemptsLeft,
        maxAttempts: limit.maxAttempts,
        applySuccess: apply,
        applyError,
        reset,
    };
};

const triesText = (n) => `${n} more ${n === 1 ? "try" : "tries"} left`;

// Resend button + countdown + tries left, for the OTP entry step.
const ResetOtpResend = ({ limit, onResend, loading = false, buttonClassName = "" }) => (
    <div className="reset-otp-resend" aria-live="polite">
        {limit.locked ? (
            <span className="reset-otp-resend-note is-locked">
                OTP limit reached. You can request a new OTP in {formatOtpWait(limit.secondsLeft)}.
            </span>
        ) : (
            <>
                <button
                    type="button"
                    className={`reset-otp-resend-btn ${buttonClassName}`}
                    onClick={onResend}
                    disabled={!limit.canSend || loading}
                >
                    {loading ? "Sending..." : limit.secondsLeft > 0 ? `Resend OTP in ${formatOtpWait(limit.secondsLeft)}` : "Resend OTP"}
                </button>
                {limit.attemptsLeft !== null && (
                    <span className="reset-otp-resend-note">
                        {limit.attemptsLeft > 0 ? triesText(limit.attemptsLeft) : "No resends left"}
                    </span>
                )}
            </>
        )}
    </div>
);

// Note under a "Send OTP" button when the account is waiting or locked.
export const ResetOtpSendNote = ({ limit }) => {
    if (limit.locked) {
        return <p className="reset-otp-resend-note is-locked" aria-live="polite">OTP limit reached. Try again in {formatOtpWait(limit.secondsLeft)}.</p>;
    }
    if (limit.secondsLeft > 0) {
        return <p className="reset-otp-resend-note" aria-live="polite">You can request another OTP in {formatOtpWait(limit.secondsLeft)}.</p>;
    }
    return null;
};

export default ResetOtpResend;
