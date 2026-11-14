import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";

/**
 * Breaks on Attendance Management: who is on a break right now with today's totals, and the break
 * policy for the company, a branch, a department or a shift.
 *
 *   FIXED     everyone breaks at the same time; the windows are deducted on their own and only an
 *             extra break outside them notifies the admin
 *   FLEXIBLE  everyone takes their own breaks; the admin is notified on every start and end
 *   INHERIT   follow the level above            OFF   do not track breaks here
 *
 * Renders nothing for someone the API answers 403 to.
 */
const MODES = ["INHERIT", "OFF", "FIXED", "FLEXIBLE"];
const MODE_LABEL = { INHERIT: "Inherit", OFF: "Off", FIXED: "Fixed", FLEXIBLE: "Flexible" };
const GROUPS = [
  { key: "company", label: "Company" },
  { key: "branches", label: "Branches" },
  { key: "departments", label: "Departments" },
  { key: "jobRoles", label: "Shifts / job roles" },
];

const minutesLabel = minutes => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  return total < 60 ? `${total}m` : `${Math.floor(total / 60)}h ${total % 60}m`;
};
const sinceLabel = value => {
  if (!value) return "";
  return `${Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))}m`;
};
const isClock = value => /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(value || "").trim());

const styles = {
  card: { background: "#fff", border: "1px solid #e6ebf3", borderRadius: 12, padding: 16, marginBottom: 16 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" },
  sub: { margin: "2px 0 0", fontSize: 12, color: "#64748b" },
  button: { padding: "8px 14px", borderRadius: 8, border: "none", background: "#1845b8", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  ghost: { padding: "6px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 12 },
  th: { textAlign: "left", padding: "7px 8px", color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e6ebf3", whiteSpace: "nowrap" },
  td: { padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#0f172a" },
  pill: { padding: "2px 8px", borderRadius: 999, background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 800 },
  empty: { fontSize: 12, color: "#94a3b8", padding: "10px 0" },
  modal: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  sheet: { background: "#fff", borderRadius: 14, padding: 20, width: "min(680px, 100%)", maxHeight: "88vh", overflowY: "auto" },
  sheetHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  groupLabel: { fontSize: 12, fontWeight: 800, color: "#475569", marginTop: 18, textTransform: "uppercase", letterSpacing: 0.3 },
  levelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  modeRow: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 },
  modeChip: { padding: "7px 13px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f1f5f9", color: "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  modeChipOn: { background: "#1845b8", borderColor: "#1845b8", color: "#fff" },
  windowRow: { display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" },
  input: { padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, width: 110, boxSizing: "border-box" },
  wideInput: { padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, width: 160, boxSizing: "border-box" },
  toggleRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: "#334155" },
  save: { padding: "11px 20px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 20 },
  remove: { border: "none", background: "transparent", color: "#b91c1c", fontWeight: 800, cursor: "pointer", fontSize: 14 },
  addWindow: { border: "none", background: "transparent", color: "#1845b8", fontWeight: 800, cursor: "pointer", fontSize: 13, marginTop: 10, padding: 0 },
};

export default function BreakAdminPanel() {
  const [allowed, setAllowed] = useState(true);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadLive = useCallback(async () => {
    try {
      const res = await axios.get("/breaks/live");
      if (res.data?.success) setLive(res.data);
    } catch (error) {
      if (error?.response?.status === 403) setAllowed(false);
      else console.error("Failed to load the break report:", error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await axios.get("/breaks/settings");
      if (res.data?.success) setSettings(res.data);
    } catch (error) {
      if (error?.response?.status === 403) setAllowed(false);
      else toast.error("Could not load the break settings.");
    }
  }, []);

  useEffect(() => { loadLive(); }, [loadLive]);

  const openSettings = () => {
    setOpen(true);
    if (!settings) loadSettings();
  };

  const patchPolicy = patch => setEditing(current => (current ? { ...current, policy: { ...current.policy, ...patch } } : current));
  const patchWindow = (index, patch) => setEditing(current => {
    if (!current) return current;
    const windows = [...(current.policy.fixedBreaks || [])];
    windows[index] = { ...windows[index], ...patch };
    return { ...current, policy: { ...current.policy, fixedBreaks: windows } };
  });

  const save = async () => {
    if (!editing) return;
    const policy = editing.policy;
    if (policy.mode === "FIXED") {
      if (!(policy.fixedBreaks || []).length) {
        toast.error("Add at least one break window (start and end time).");
        return;
      }
      const bad = policy.fixedBreaks.find(item => !isClock(item.start) || !isClock(item.end) || item.start >= item.end);
      if (bad) {
        toast.error("Each window needs a valid start and end time (HH:mm), with the end after the start.");
        return;
      }
    }
    try {
      setSaving(true);
      const res = await axios.put(`/breaks/settings/${editing.level}/${editing.id}`, { policy });
      if (res.data?.success) {
        toast.success(res.data.message || "Break setting saved.");
        setEditing(null);
        setSettings(null);
        loadSettings();
        loadLive();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save the break settings.");
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => live?.items || [], [live]);
  const onBreakRows = rows.filter(row => row.onBreak);
  const withBreaks = rows.filter(row => !row.onBreak && row.breakMinutes > 0);

  if (!allowed) return null;
  if (loading && !live) return null;

  return (
    <div style={styles.card}>
      <div style={styles.head}>
        <div>
          <h3 style={styles.title}>Breaks</h3>
          <p style={styles.sub}>
            {onBreakRows.length > 0 ? `${onBreakRows.length} on a break right now` : "Nobody is on a break right now"}
            {live?.date ? ` · ${live.date}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={styles.ghost} onClick={loadLive}>Refresh</button>
          <button type="button" style={styles.button} onClick={openSettings}>Break settings</button>
        </div>
      </div>

      {onBreakRows.length === 0 && withBreaks.length === 0 ? (
        <div style={styles.empty}>No breaks taken yet today.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Employee</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Mode</th>
              <th style={styles.th}>Break today</th>
              <th style={styles.th}>Breaks</th>
              <th style={styles.th}>Working time</th>
              <th style={styles.th} />
            </tr>
          </thead>
          <tbody>
            {[...onBreakRows, ...withBreaks].map(row => (
              <tr key={row.userId}>
                <td style={styles.td}><strong>{row.name}</strong></td>
                <td style={styles.td}>{row.departmentName || "—"}</td>
                <td style={styles.td}>{MODE_LABEL[row.mode] || row.mode}</td>
                <td style={styles.td}>{minutesLabel(row.breakMinutes)}</td>
                <td style={styles.td}>{row.breakCount}</td>
                <td style={styles.td}>{row.workingTime}</td>
                <td style={styles.td}>
                  {row.onBreak && (
                    <span style={styles.pill}>{`ON BREAK · ${sinceLabel(row.runningSince)}`}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <div style={styles.modal} onMouseDown={event => { if (event.target === event.currentTarget) { setOpen(false); setEditing(null); } }}>
          <div style={styles.sheet}>
            <div style={styles.sheetHead}>
              <h3 style={styles.title}>{editing ? `${editing.name} — breaks` : "Break settings"}</h3>
              <button type="button" style={styles.ghost} onClick={() => (editing ? setEditing(null) : setOpen(false))}>
                {editing ? "Back" : "Close"}
              </button>
            </div>

            {!editing && !settings && <div style={styles.empty}>Loading…</div>}

            {!editing && settings && (
              <>
                <p style={styles.sub}>
                  The most specific setting wins: a shift beats a department, a department beats a branch,
                  a branch beats the company.
                </p>
                {GROUPS.map(group => {
                  const entries = group.key === "company" ? [settings.company] : (settings[group.key] || []);
                  if (!entries.length) return null;
                  return (
                    <div key={group.key}>
                      <div style={styles.groupLabel}>{group.label}</div>
                      {entries.map(entry => (
                        <div key={`${entry.level}-${entry.id}`} style={styles.levelRow}>
                          <div>
                            <strong>{entry.name}</strong>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {MODE_LABEL[entry.policy.mode] || entry.policy.mode}
                              {entry.policy.mode === "FIXED" && entry.policy.fixedBreaks.length
                                ? ` · ${entry.policy.fixedBreaks.map(item => `${item.name} ${item.start}–${item.end}`).join(", ")}`
                                : ""}
                              {entry.policy.mode === "FLEXIBLE" && entry.policy.limits?.enabled
                                ? ` · limit ${entry.policy.limits.maxBreaksPerDay || "-"} breaks / ${entry.policy.limits.maxMinutesPerDay || "-"}m (${entry.policy.limits.enforce.toLowerCase()})`
                                : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            style={styles.ghost}
                            onClick={() => setEditing({ level: entry.level, id: entry.id, name: entry.name, policy: entry.policy })}
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}

            {editing && (
              <>
                <div style={styles.groupLabel}>Mode</div>
                <div style={styles.modeRow}>
                  {MODES.map(mode => (
                    <button
                      key={mode}
                      type="button"
                      style={{ ...styles.modeChip, ...(editing.policy.mode === mode ? styles.modeChipOn : {}) }}
                      onClick={() => patchPolicy({ mode })}
                    >
                      {MODE_LABEL[mode]}
                    </button>
                  ))}
                </div>

                {editing.policy.mode === "FIXED" && (
                  <>
                    <div style={styles.groupLabel}>Break windows (24-hour time)</div>
                    {(editing.policy.fixedBreaks || []).map((window, index) => (
                      <div key={`window-${index}`} style={styles.windowRow}>
                        <input
                          style={styles.wideInput}
                          value={window.name}
                          placeholder="Lunch"
                          onChange={event => patchWindow(index, { name: event.target.value })}
                        />
                        <input
                          style={styles.input}
                          value={window.start}
                          placeholder="13:00"
                          onChange={event => patchWindow(index, { start: event.target.value })}
                        />
                        <span style={{ color: "#94a3b8" }}>to</span>
                        <input
                          style={styles.input}
                          value={window.end}
                          placeholder="13:30"
                          onChange={event => patchWindow(index, { end: event.target.value })}
                        />
                        <label style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                          <input
                            type="checkbox"
                            checked={window.autoDeduct !== false}
                            onChange={event => patchWindow(index, { autoDeduct: event.target.checked })}
                          />
                          deduct automatically
                        </label>
                        <button
                          type="button"
                          style={styles.remove}
                          onClick={() => patchPolicy({ fixedBreaks: editing.policy.fixedBreaks.filter((_, position) => position !== index) })}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      style={styles.addWindow}
                      onClick={() => patchPolicy({
                        fixedBreaks: [...(editing.policy.fixedBreaks || []), { name: "Break", start: "13:00", end: "13:30", autoDeduct: true }],
                      })}
                    >
                      + Add a window
                    </button>
                    <label style={styles.toggleRow}>
                      <input
                        type="checkbox"
                        checked={editing.policy.allowExtraBreak !== false}
                        onChange={event => patchPolicy({ allowExtraBreak: event.target.checked })}
                      />
                      Allow an extra break outside these windows (the admin is notified)
                    </label>
                  </>
                )}

                {(editing.policy.mode === "FIXED" || editing.policy.mode === "FLEXIBLE") && (
                  <>
                    <label style={styles.toggleRow}>
                      <input
                        type="checkbox"
                        checked={editing.policy.notifyAdmin !== false}
                        onChange={event => patchPolicy({ notifyAdmin: event.target.checked })}
                      />
                      {editing.policy.mode === "FIXED"
                        ? "Notify the admin when someone takes an extra break"
                        : "Notify the admin when a break starts and ends"}
                    </label>

                    <div style={styles.groupLabel}>Daily limit</div>
                    <label style={styles.toggleRow}>
                      <input
                        type="checkbox"
                        checked={Boolean(editing.policy.limits?.enabled)}
                        onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), enabled: event.target.checked } })}
                      />
                      Limit how many breaks and how long
                    </label>
                    {editing.policy.limits?.enabled && (
                      <>
                        <div style={styles.windowRow}>
                          <input
                            style={styles.input}
                            type="number"
                            min="0"
                            placeholder="Breaks"
                            value={editing.policy.limits?.maxBreaksPerDay || ""}
                            onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), maxBreaksPerDay: Number(event.target.value) || 0 } })}
                          />
                          <span style={{ fontSize: 12, color: "#64748b" }}>breaks a day</span>
                          <input
                            style={styles.input}
                            type="number"
                            min="0"
                            placeholder="Minutes"
                            value={editing.policy.limits?.maxMinutesPerDay || ""}
                            onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), maxMinutesPerDay: Number(event.target.value) || 0 } })}
                          />
                          <span style={{ fontSize: 12, color: "#64748b" }}>minutes a day</span>
                        </div>
                        <div style={styles.modeRow}>
                          {["WARN", "BLOCK"].map(value => (
                            <button
                              key={value}
                              type="button"
                              style={{ ...styles.modeChip, ...((editing.policy.limits?.enforce || "WARN") === value ? styles.modeChipOn : {}) }}
                              onClick={() => patchPolicy({ limits: { ...(editing.policy.limits || {}), enforce: value } })}
                            >
                              {value === "WARN" ? "Warn only" : "Block the next break"}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                <button type="button" style={{ ...styles.save, opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={save}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
