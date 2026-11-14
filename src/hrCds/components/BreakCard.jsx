import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";

/**
 * The employee's break card on My Attendance.
 *
 * Working time counts up from clock-in and **stops while a break is running**. A company with fixed
 * breaks has those deducted on its own, so the button is only for an extra break; a company with no
 * fixed times gets a plain start/end button. Renders nothing when the company does not use breaks.
 */
const pad = value => String(value).padStart(2, "0");
const formatClock = seconds => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};
const minutesLabel = minutes => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  return total < 60 ? `${total}m` : `${Math.floor(total / 60)}h ${total % 60}m`;
};
const timeLabel = value => (value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");

const styles = {
  card: { background: "#fff", border: "1px solid #e6ebf3", borderRadius: 12, padding: 16, marginBottom: 16 },
  cardOnBreak: { borderColor: "#f59e0b", background: "#fffbeb" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  label: { margin: 0, fontSize: 12, fontWeight: 700, color: "#64748b" },
  timer: { margin: "2px 0 0", fontSize: 30, fontWeight: 800, color: "#0f172a", letterSpacing: 1, fontVariantNumeric: "tabular-nums" },
  sub: { margin: "2px 0 0", fontSize: 12, color: "#64748b" },
  running: { margin: "2px 0 0", fontSize: 12, color: "#b45309", fontWeight: 700 },
  button: { padding: "10px 18px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  start: { background: "#1845b8" },
  end: { background: "#b45309" },
  stats: { display: "flex", gap: 22, flexWrap: "wrap", marginTop: 14 },
  statLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.3 },
  statValue: { fontSize: 15, fontWeight: 800, color: "#0f172a" },
  note: { fontSize: 11, color: "#64748b", marginTop: 10 },
  history: { fontSize: 12, color: "#475569", marginTop: 4 },
};

export default function BreakCard() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);
  const loadedAtRef = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const res = await axios.get("/breaks/today");
      if (res.data?.success) {
        setState(res.data);
        loadedAtRef.current = Date.now();
      } else setState(null);
    } catch (error) {
      if (![401, 403, 404].includes(error?.response?.status)) {
        console.error("Failed to load break status:", error?.message);
      }
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ticking = Boolean(state?.isClockedIn);
  useEffect(() => {
    if (!ticking) return undefined;
    const timer = window.setInterval(() => setTick(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [ticking]);

  const act = async action => {
    try {
      setBusy(true);
      const res = await axios.post(`/breaks/${action}`, {});
      if (res.data?.success) {
        setState(res.data);
        loadedAtRef.current = Date.now();
        if (res.data.warning) toast.warn(res.data.warning);
        else toast.success(res.data.message || "Done");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Could not ${action === "start" ? "start" : "end"} the break.`);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !state) return null;
  if (!state || state.policy?.mode === "OFF") return null;

  const { policy } = state;
  const isFixed = policy.mode === "FIXED";
  const onBreak = Boolean(state.onBreak);
  const limits = policy.limits || {};
  const elapsed = Math.floor((Date.now() - loadedAtRef.current) / 1000);
  // Frozen while a break runs: those seconds belong to the break, not to work.
  const workingSeconds = state.isClockedIn && !onBreak
    ? (Number(state.workingSeconds) || 0) + Math.max(0, elapsed)
    : (Number(state.workingSeconds) || 0);
  const breakSeconds = onBreak ? Math.max(0, elapsed) : 0;

  return (
    <div style={{ ...styles.card, ...(onBreak ? styles.cardOnBreak : {}) }}>
      <div style={styles.row}>
        <div>
          <p style={styles.label}>{onBreak ? `On break · ${state.runningBreak?.label || "Break"}` : "Working time"}</p>
          <p style={styles.timer}>{formatClock(workingSeconds)}</p>
          {onBreak ? (
            <p style={styles.running}>{`Break running ${formatClock(breakSeconds)} · working time paused`}</p>
          ) : (
            <p style={styles.sub}>
              {isFixed
                ? (state.nextFixedBreak
                  ? `Next break: ${state.nextFixedBreak.name} ${state.nextFixedBreak.start}–${state.nextFixedBreak.end}`
                  : "Scheduled breaks are deducted automatically")
                : "Take a break whenever you can"}
            </p>
          )}
          {!state.isClockedIn && <p style={styles.note}>Clock in first to use breaks.</p>}
        </div>
        <button
          type="button"
          style={{ ...styles.button, ...(onBreak ? styles.end : styles.start), opacity: busy || !state.isClockedIn ? 0.6 : 1 }}
          disabled={busy || !state.isClockedIn}
          onClick={() => act(onBreak ? "stop" : "start")}
        >
          {busy ? "Please wait…" : onBreak ? "End break" : (isFixed ? "Extra break" : "Start break")}
        </button>
      </div>

      <div style={styles.stats}>
        <div>
          <div style={styles.statLabel}>Break today</div>
          <div style={styles.statValue}>{minutesLabel(state.breakMinutes)}</div>
        </div>
        {isFixed && (
          <div>
            <div style={styles.statLabel}>Scheduled</div>
            <div style={styles.statValue}>{minutesLabel(state.autoBreakMinutes)}</div>
          </div>
        )}
        <div>
          <div style={styles.statLabel}>Breaks taken</div>
          <div style={styles.statValue}>
            {state.breakCount}{limits.enabled && limits.maxBreaksPerDay ? ` / ${limits.maxBreaksPerDay}` : ""}
          </div>
        </div>
        {limits.enabled && limits.maxMinutesPerDay ? (
          <div>
            <div style={styles.statLabel}>Allowed</div>
            <div style={styles.statValue}>{minutesLabel(limits.maxMinutesPerDay)}</div>
          </div>
        ) : null}
        <div>
          <div style={styles.statLabel}>Gross (in → now)</div>
          <div style={styles.statValue}>{state.grossTime}</div>
        </div>
      </div>

      {isFixed && (policy.fixedBreaks || []).length > 0 && (
        <p style={styles.note}>
          {`Fixed breaks: ${policy.fixedBreaks.map(item => `${item.name} ${item.start}–${item.end}`).join(" · ")}`}
        </p>
      )}

      {(state.breaks || []).filter(entry => entry.end).slice(-4).reverse().map((entry, index) => (
        <div key={`${entry.start}-${index}`} style={styles.history}>
          {`${entry.label} · ${timeLabel(entry.start)}–${timeLabel(entry.end)} · ${minutesLabel(entry.minutes)}`}
        </div>
      ))}
    </div>
  );
}
