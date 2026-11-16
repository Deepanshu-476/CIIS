import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import "./BreakAdminPanel.css";

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
const GROUP_ICONS = {
  company: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <line x1="9" y1="9" x2="10" y2="9" />
      <line x1="14" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="10" y2="13" />
      <line x1="14" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="10" y2="17" />
      <line x1="14" y1="17" x2="15" y2="17" />
    </svg>
  ),
  branches: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  departments: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  jobRoles: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

const renderModeBadge = mode => {
  const m = mode || "INHERIT";
  return <span className={`bap-mode-badge bap-mode-${m.toLowerCase()}`}>{MODE_LABEL[m] || m}</span>;
};

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
  const [tab, setTab] = useState("live");
  const [month, setMonth] = useState(() => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 7));
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

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

  const loadReport = useCallback(async () => {
    try {
      setLoadingReport(true);
      const res = await axios.get(`/breaks/report?month=${month}`);
      if (res.data?.success) setReport(res.data);
    } catch (error) {
      if (error?.response?.status === 403) setAllowed(false);
      else toast.error("Could not load the break report.");
    } finally {
      setLoadingReport(false);
    }
  }, [month]);

  useEffect(() => { loadLive(); }, [loadLive]);
  useEffect(() => { if (tab === "report") loadReport(); }, [tab, loadReport]);

  // One CSV of the month, the same numbers the table shows.
  const exportReport = () => {
    if (!report?.items?.length) {
      toast.error("Nothing to export for this month.");
      return;
    }
    const header = ["Employee", "Employee ID", "Department", "Mode", "Days worked", "Days with break",
      "Total break (min)", "Punched (min)", "Auto (min)", "Breaks", "Avg per day (min)",
      "Longest break (min)", "Days over limit", "By reason"];
    const rows = report.items.map(item => [
      item.name, item.employeeId, item.departmentName, item.mode, item.daysWorked, item.daysWithBreak,
      item.totalMinutes, item.punchedMinutes, item.autoMinutes, item.breakCount, item.averageMinutesPerDay,
      item.longestBreakMinutes, item.overLimitDays,
      Object.entries(item.byReason || {}).map(([reason, minutes]) => `${reason}:${minutes}m`).join(" "),
    ]);
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `break_report_${report.month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            style={{ ...styles.modeChip, ...(tab === "live" ? styles.modeChipOn : {}) }}
            onClick={() => setTab("live")}
          >
            Today
          </button>
          <button
            type="button"
            style={{ ...styles.modeChip, ...(tab === "report" ? styles.modeChipOn : {}) }}
            onClick={() => setTab("report")}
          >
            Monthly report
          </button>
          <button type="button" style={styles.ghost} onClick={tab === "report" ? loadReport : loadLive}>Refresh</button>
          <button type="button" style={styles.button} onClick={openSettings}>Break settings</button>
        </div>
      </div>

      {tab === "live" ? (onBreakRows.length === 0 && withBreaks.length === 0 ? (
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
                    <span style={styles.pill}>
                      {`ON BREAK · ${sinceLabel(row.runningSince)}${row.runningReason ? ` · ${row.runningReason}` : ""}`}
                    </span>
                  )}
                  {row.overstayMinutes > 0 && (
                    <div style={{ fontSize: 11, color: "#b91c1c", fontWeight: 800 }}>{`${row.overstayMinutes}m over limit`}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )) : (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <input type="month" value={month} onChange={event => setMonth(event.target.value)} style={styles.input} />
            <button type="button" style={styles.ghost} onClick={exportReport}>Export CSV</button>
            {report?.summary && (
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {`${report.summary.employees} employee(s) · ${minutesLabel(report.summary.totalMinutes)} total · avg ${minutesLabel(report.summary.averageMinutesPerEmployee)} each · ${report.summary.overLimitDays} day(s) over limit`}
              </span>
            )}
          </div>

          {report?.summary?.byReason && Object.keys(report.summary.byReason).length > 0 && (
            <p style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>
              {Object.entries(report.summary.byReason)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, minutes]) => `${reason} ${minutesLabel(minutes)}`)
                .join(" · ")}
            </p>
          )}

          {loadingReport ? (
            <div style={styles.empty}>Loading…</div>
          ) : !report?.items?.length ? (
            <div style={styles.empty}>No breaks recorded in this month.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Days</th>
                  <th style={styles.th}>Total break</th>
                  <th style={styles.th}>Avg / day</th>
                  <th style={styles.th}>Breaks</th>
                  <th style={styles.th}>Longest</th>
                  <th style={styles.th}>Over limit</th>
                  <th style={styles.th}>By reason</th>
                </tr>
              </thead>
              <tbody>
                {report.items.map(item => (
                  <tr key={item.userId}>
                    <td style={styles.td}>
                      <strong>{item.name}</strong>
                      {item.employeeId ? <div style={{ fontSize: 11, color: "#64748b" }}>{item.employeeId}</div> : null}
                    </td>
                    <td style={styles.td}>{item.departmentName || "—"}</td>
                    <td style={styles.td}>{`${item.daysWithBreak}/${item.daysWorked}`}</td>
                    <td style={styles.td}><strong>{minutesLabel(item.totalMinutes)}</strong></td>
                    <td style={styles.td}>{minutesLabel(item.averageMinutesPerDay)}</td>
                    <td style={styles.td}>{item.breakCount}</td>
                    <td style={styles.td}>{minutesLabel(item.longestBreakMinutes)}</td>
                    <td style={styles.td}>
                      {item.overLimitDays > 0
                        ? <span style={{ color: "#b91c1c", fontWeight: 800 }}>{item.overLimitDays}</span>
                        : "—"}
                    </td>
                    <td style={styles.td}>
                      {Object.entries(item.byReason || {}).map(([reason, minutes]) => `${reason} ${minutesLabel(minutes)}`).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {open && (
        <div
          className="bap-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setOpen(false);
              setEditing(null);
            }
          }}
        >
          <div className="bap-dialog">
            <div className="bap-dialog-header">
              <div className="bap-header-left">
                <div className="bap-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                </div>
                <div className="bap-header-text">
                  <h3 className="bap-dialog-title">
                    {editing ? `${editing.name} — Break Policy` : "Break Settings & Policies"}
                  </h3>
                  <p className="bap-dialog-subtitle">
                    {editing ? "Configure custom timing, rules, and limits" : "Manage company, branch, and department break rules"}
                  </p>
                </div>
              </div>
              <div className="bap-header-actions">
                {editing && (
                  <button
                    type="button"
                    className="bap-back-btn"
                    onClick={() => setEditing(null)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                  </button>
                )}
                <button
                  type="button"
                  className="bap-close-btn"
                  onClick={() => {
                    setEditing(null);
                    setOpen(false);
                  }}
                  aria-label="Close dialog"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div className="bap-dialog-body">
              {!editing && !settings && <div style={styles.empty}>Loading settings…</div>}

              {!editing && settings && (
                <>
                  <div className="bap-rule-banner">
                    <span className="bap-rule-banner-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </span>
                    <div>
                      <strong>Hierarchy Priority:</strong> Shift → Department → Branch → Company.
                      The most specific setting always wins. Unset levels automatically inherit from above.
                    </div>
                  </div>

                  {GROUPS.map(group => {
                    const entries = group.key === "company" ? [settings.company] : (settings[group.key] || []);
                    if (!entries.length) return null;
                    return (
                      <div key={group.key} className="bap-group-section">
                        <div className="bap-group-heading">
                          {GROUP_ICONS[group.key]}
                          <span>{group.label}</span>
                          <span className="bap-group-count">{entries.length}</span>
                        </div>
                        <div className="bap-level-list">
                          {entries.map(entry => (
                            <div key={`${entry.level}-${entry.id}`} className="bap-level-card">
                              <div className="bap-level-info">
                                <span className="bap-level-name">{entry.name}</span>
                                <div className="bap-level-meta">
                                  {renderModeBadge(entry.policy.mode)}
                                  {entry.policy.mode === "FIXED" && entry.policy.fixedBreaks?.length > 0 && (
                                    <span className="bap-level-details">
                                      · {entry.policy.fixedBreaks.map(item => `${item.name} (${item.start}–${item.end})`).join(", ")}
                                    </span>
                                  )}
                                  {entry.policy.mode === "FLEXIBLE" && entry.policy.limits?.enabled && (
                                    <span className="bap-level-details">
                                      · Max {entry.policy.limits.maxBreaksPerDay || "-"} breaks / {entry.policy.limits.maxMinutesPerDay || "-"}m
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="bap-edit-btn"
                                onClick={() => setEditing({ level: entry.level, id: entry.id, name: entry.name, policy: entry.policy })}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {editing && (
                <div className="bap-edit-section">
                  <div>
                    <label className="bap-field-label">Break Tracking Mode</label>
                    <div className="bap-mode-selector">
                      {MODES.map(mode => (
                        <button
                          key={mode}
                          type="button"
                          className={`bap-mode-option ${editing.policy.mode === mode ? "active" : ""}`}
                          onClick={() => patchPolicy({ mode })}
                        >
                          {MODE_LABEL[mode]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editing.policy.mode === "FIXED" && (
                    <div>
                      <label className="bap-field-label">Scheduled Break Windows (24-Hour Time)</label>
                      <div className="bap-windows-container">
                        {(editing.policy.fixedBreaks || []).map((window, index) => (
                          <div key={`window-${index}`} className="bap-window-row">
                            <input
                              className="bap-input-name"
                              value={window.name}
                              placeholder="Break Name (e.g. Lunch)"
                              onChange={event => patchWindow(index, { name: event.target.value })}
                            />
                            <input
                              className="bap-input-time"
                              value={window.start}
                              placeholder="13:00"
                              onChange={event => patchWindow(index, { start: event.target.value })}
                            />
                            <span style={{ color: "#94a3b8", fontSize: 12 }}>to</span>
                            <input
                              className="bap-input-time"
                              value={window.end}
                              placeholder="13:30"
                              onChange={event => patchWindow(index, { end: event.target.value })}
                            />
                            <label className="bap-window-toggle">
                              <input
                                type="checkbox"
                                checked={window.autoDeduct !== false}
                                onChange={event => patchWindow(index, { autoDeduct: event.target.checked })}
                              />
                              Auto deduct
                            </label>
                            <button
                              type="button"
                              className="bap-delete-btn"
                              title="Remove window"
                              onClick={() => patchPolicy({ fixedBreaks: editing.policy.fixedBreaks.filter((_, position) => position !== index) })}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="bap-add-window-btn"
                          onClick={() => patchPolicy({
                            fixedBreaks: [...(editing.policy.fixedBreaks || []), { name: "Break", start: "13:00", end: "13:30", autoDeduct: true }],
                          })}
                        >
                          + Add Break Window
                        </button>
                      </div>

                      <label className="bap-toggle-box" style={{ marginTop: 10 }}>
                        <input
                          type="checkbox"
                          checked={editing.policy.allowExtraBreak !== false}
                          onChange={event => patchPolicy({ allowExtraBreak: event.target.checked })}
                        />
                        <span>Allow unscheduled extra breaks outside these windows (admin gets notified)</span>
                      </label>
                    </div>
                  )}

                  {(editing.policy.mode === "FIXED" || editing.policy.mode === "FLEXIBLE") && (
                    <>
                      <label className="bap-toggle-box">
                        <input
                          type="checkbox"
                          checked={editing.policy.notifyAdmin !== false}
                          onChange={event => patchPolicy({ notifyAdmin: event.target.checked })}
                        />
                        <span>
                          {editing.policy.mode === "FIXED"
                            ? "Notify admin when someone takes an extra unscheduled break"
                            : "Notify admin whenever a break starts and ends"}
                        </span>
                      </label>

                      <div>
                        <label className="bap-field-label">Allowed Break Reasons</label>
                        <input
                          className="bap-input-text"
                          value={(editing.policy.reasons || []).join(", ")}
                          placeholder="Lunch, Tea, Personal, Meeting, Other (comma separated)"
                          onChange={event => patchPolicy({ reasons: event.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                        />
                        <label className="bap-toggle-box" style={{ marginTop: 8 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(editing.policy.requireReason)}
                            onChange={event => patchPolicy({ requireReason: event.target.checked })}
                          />
                          <span>Mandatory: Employee must pick a reason before starting any break</span>
                        </label>
                      </div>

                      <div>
                        <label className="bap-field-label">Daily Break Limits</label>
                        <label className="bap-toggle-box">
                          <input
                            type="checkbox"
                            checked={Boolean(editing.policy.limits?.enabled)}
                            onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), enabled: event.target.checked } })}
                          />
                          <span>Enforce daily usage constraints (max breaks, max duration, cooldown gap)</span>
                        </label>

                        {editing.policy.limits?.enabled && (
                          <div className="bap-limits-box" style={{ marginTop: 8 }}>
                            <div className="bap-limits-row">
                              <div className="bap-limit-item">
                                <input
                                  className="bap-limit-input"
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={editing.policy.limits?.maxBreaksPerDay || ""}
                                  onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), maxBreaksPerDay: Number(event.target.value) || 0 } })}
                                />
                                <span>max breaks / day</span>
                              </div>
                              <div className="bap-limit-item">
                                <input
                                  className="bap-limit-input"
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={editing.policy.limits?.maxMinutesPerDay || ""}
                                  onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), maxMinutesPerDay: Number(event.target.value) || 0 } })}
                                />
                                <span>max total mins / day</span>
                              </div>
                            </div>
                            <div className="bap-limits-row">
                              <div className="bap-limit-item">
                                <input
                                  className="bap-limit-input"
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={editing.policy.limits?.minGapMinutes || ""}
                                  onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), minGapMinutes: Number(event.target.value) || 0 } })}
                                />
                                <span>min gap between breaks (mins)</span>
                              </div>
                              <div className="bap-limit-item">
                                <input
                                  className="bap-limit-input"
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={editing.policy.limits?.maxSingleBreakMinutes || ""}
                                  onChange={event => patchPolicy({ limits: { ...(editing.policy.limits || {}), maxSingleBreakMinutes: Number(event.target.value) || 0 } })}
                                />
                                <span>single break warning limit (mins)</span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              {["WARN", "BLOCK"].map(value => (
                                <button
                                  key={value}
                                  type="button"
                                  className={`bap-mode-option ${((editing.policy.limits?.enforce || "WARN") === value) ? "active" : ""}`}
                                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                                  onClick={() => patchPolicy({ limits: { ...(editing.policy.limits || {}), enforce: value } })}
                                >
                                  {value === "WARN" ? "Warn only" : "Block next break"}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {editing && (
              <div className="bap-dialog-footer">
                <button
                  type="button"
                  className="bap-footer-btn-secondary"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bap-footer-btn-primary"
                  disabled={saving}
                  onClick={save}
                >
                  {saving ? "Saving Changes…" : "Save Policy"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
