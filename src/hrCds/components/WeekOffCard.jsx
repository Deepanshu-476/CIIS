import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";

/**
 * The employee's own weekly off: which day(s) it is this month, and asking to take it on another
 * day of the same week. Nothing changes until an approver says yes, so the card shows the pending
 * request as pending.
 *
 * Self-contained (its own fetching and styles) so it can sit on the attendance page as one line.
 */
const WEEKDAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const monthKeyOf = (date = new Date()) => {
  const shifted = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 7);
};
const dayKeyOf = (date = new Date()) => {
  const shifted = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};
const weekdayOfKey = key => {
  if (!key) return 0;
  const day = new Date(`${key}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
};
const prettyDate = key => {
  if (!key) return "";
  const date = new Date(`${key}T00:00:00.000Z`);
  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} (${WEEKDAYS[weekdayOfKey(key)].slice(0, 3)})`;
};

const STATUS_COLORS = {
  Pending: { background: "#fef3c7", color: "#92400e" },
  Approved: { background: "#dcfce7", color: "#15803d" },
  Rejected: { background: "#fee2e2", color: "#b91c1c" },
  Cancelled: { background: "#e2e8f0", color: "#475569" },
};

const styles = {
  card: { background: "#fff", border: "1px solid #e6ebf3", borderRadius: 12, padding: 16, marginBottom: 16 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" },
  sub: { margin: "2px 0 0", fontSize: 12, color: "#64748b" },
  pill: { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: "#e0e7ff", color: "#3730a3" },
  datesRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 },
  dateChip: { padding: "4px 9px", borderRadius: 8, background: "#f1f5f9", fontSize: 12, fontWeight: 600, color: "#334155" },
  button: { padding: "8px 14px", borderRadius: 8, border: "none", background: "#1845b8", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  ghost: { padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, fontSize: 12, cursor: "pointer" },
  form: { marginTop: 14, padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e6ebf3", display: "grid", gap: 10 },
  label: { fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 12 },
  th: { textAlign: "left", padding: "6px 8px", color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e6ebf3", whiteSpace: "nowrap" },
  td: { padding: "7px 8px", borderBottom: "1px solid #f1f5f9", color: "#0f172a" },
  badge: { padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  empty: { fontSize: 12, color: "#94a3b8", marginTop: 10 },
};

export default function WeekOffCard() {
  const [month, setMonth] = useState(monthKeyOf());
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [toDate, setToDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/week-off/my-schedule?month=${month}`);
      if (res.data?.success) setSchedule(res.data);
    } catch (error) {
      // A company that does not use weekly offs (or an employee without access) simply sees nothing.
      if (![401, 403, 404].includes(error?.response?.status)) {
        console.error("Failed to load weekly off schedule:", error?.message);
      }
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  // Which of my upcoming off days I could give up: this week onwards.
  const upcomingOffDays = useMemo(() => {
    const today = dayKeyOf();
    return (schedule?.offDayKeys || []).filter(key => key >= today);
  }, [schedule]);

  const submit = async event => {
    event.preventDefault();
    if (!toDate) {
      toast.error("Pick the day you want as your weekly off.");
      return;
    }
    try {
      setSaving(true);
      const res = await axios.post("/week-off/request", {
        toDate,
        ...(fromDate ? { fromDate } : {}),
        reason,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Weekly off request sent for approval.");
        setFormOpen(false);
        setToDate("");
        setFromDate("");
        setReason("");
        load();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not send the request.");
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async id => {
    if (!window.confirm("Withdraw this weekly off request?")) return;
    try {
      const res = await axios.delete(`/week-off/request/${id}`);
      if (res.data?.success) {
        toast.success("Request withdrawn.");
        load();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not withdraw the request.");
    }
  };

  if (loading && !schedule) return null;
  if (!schedule || schedule.entitlement === 0) return null;   // seven-day week: nothing to show

  const fixedDays = schedule.weekOffDayNames?.length ? schedule.weekOffDayNames.join(", ") : "";

  return (
    <div style={styles.card}>
      <div style={styles.head}>
        <div>
          <h3 style={styles.title}>My Weekly Off</h3>
          <p style={styles.sub}>
            {schedule.entitlement} day{schedule.entitlement === 1 ? "" : "s"} a week
            {schedule.departmentName ? ` · ${schedule.departmentName}` : ""}
            {` · ${schedule.workingDays} working days`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={styles.pill}>{fixedDays || "Department default (end of week)"}</span>
          <input
            type="month"
            value={month}
            onChange={event => setMonth(event.target.value)}
            style={{ ...styles.input, width: 150 }}
            aria-label="Month"
          />
          <button type="button" style={styles.button} onClick={() => setFormOpen(open => !open)}>
            {formOpen ? "Close" : "Request a change"}
          </button>
        </div>
      </div>

      <div style={styles.datesRow}>
        {(schedule.offDayKeys || []).length === 0
          ? <span style={styles.empty}>No weekly off falls in this month.</span>
          : schedule.offDayKeys.map(key => (
            <span key={key} style={styles.dateChip}>{prettyDate(key)}</span>
          ))}
      </div>

      {formOpen && (
        <form style={styles.form} onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            <div>
              <label style={styles.label} htmlFor="week-off-to">I want this day off</label>
              <input
                id="week-off-to"
                type="date"
                value={toDate}
                min={dayKeyOf()}
                onChange={event => setToDate(event.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label} htmlFor="week-off-from">
                {schedule.entitlement > 1 ? "Instead of (required)" : "Instead of (optional)"}
              </label>
              <select
                id="week-off-from"
                value={fromDate}
                onChange={event => setFromDate(event.target.value)}
                style={styles.input}
              >
                <option value="">
                  {schedule.entitlement > 1 ? "Select the off day you give up" : "My scheduled off that week"}
                </option>
                {upcomingOffDays.map(key => (
                  <option key={key} value={key}>{prettyDate(key)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={styles.label} htmlFor="week-off-reason">Reason (optional)</label>
            <input
              id="week-off-reason"
              type="text"
              value={reason}
              maxLength={500}
              placeholder="Family function, appointment…"
              onChange={event => setReason(event.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="submit" style={{ ...styles.button, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? "Sending…" : "Send for approval"}
            </button>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              The day can only move within the same week (Monday to Sunday).
            </span>
          </div>
        </form>
      )}

      {(schedule.requests || []).length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Wanted off</th>
              <th style={styles.th}>Instead of</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Remarks</th>
              <th style={styles.th} />
            </tr>
          </thead>
          <tbody>
            {schedule.requests.map(request => (
              <tr key={request._id}>
                <td style={styles.td}>{prettyDate(request.toDateKey)}</td>
                <td style={styles.td}>{prettyDate(request.fromDateKey)}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...(STATUS_COLORS[request.status] || STATUS_COLORS.Cancelled) }}>
                    {request.status}
                  </span>
                </td>
                <td style={styles.td}>{request.reviewRemarks || request.reason || "—"}</td>
                <td style={styles.td}>
                  {request.status === "Pending" && (
                    <button type="button" style={styles.ghost} onClick={() => withdraw(request._id)}>Withdraw</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
