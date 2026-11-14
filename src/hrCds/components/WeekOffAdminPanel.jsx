import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";

/**
 * Weekly offs for the whole company: the requests waiting for a decision, and which weekday each
 * employee's weekly off falls on. How many days a week they get still comes from the department's
 * working days; this only sets which ones.
 *
 * Self-contained, and it renders nothing for someone who may not manage attendance (the API answers
 * 403), so it is safe to drop on the admin attendance page.
 */
const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];
const FULL_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const weekdayOfKey = key => {
  if (!key) return 0;
  const day = new Date(`${key}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
};
const prettyDate = key => {
  if (!key) return "—";
  const date = new Date(`${key}T00:00:00.000Z`);
  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} (${FULL_NAMES[weekdayOfKey(key)].slice(0, 3)})`;
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
  tabs: { display: "flex", gap: 6 },
  tab: { padding: "6px 12px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  tabActive: { background: "#1845b8", borderColor: "#1845b8", color: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 12 },
  th: { textAlign: "left", padding: "7px 8px", color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e6ebf3", whiteSpace: "nowrap" },
  td: { padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", verticalAlign: "middle" },
  approve: { padding: "5px 10px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", marginRight: 6 },
  reject: { padding: "5px 10px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  dayBtn: { padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  dayBtnOn: { background: "#1845b8", borderColor: "#1845b8", color: "#fff" },
  badge: { padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  search: { padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, minWidth: 180 },
  empty: { fontSize: 12, color: "#94a3b8", padding: "12px 0" },
  count: { marginLeft: 6, padding: "1px 7px", borderRadius: 999, background: "#fee2e2", color: "#b91c1c", fontSize: 11, fontWeight: 800 },
};

export default function WeekOffAdminPanel() {
  const [allowed, setAllowed] = useState(true);
  const [tab, setTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const res = await axios.get(`/week-off/admin-requests?status=${statusFilter}`);
      if (res.data?.success) {
        setRequests(res.data.data || []);
        setPendingCount(res.data.pendingCount || 0);
      }
    } catch (error) {
      if (error?.response?.status === 403) setAllowed(false);
      else console.error("Failed to load weekly off requests:", error?.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await axios.get("/week-off/employees");
      if (res.data?.success) setEmployees(res.data.data || []);
    } catch (error) {
      if (error?.response?.status === 403) setAllowed(false);
      else console.error("Failed to load weekly off settings:", error?.message);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { if (tab === "employees" && employees.length === 0) loadEmployees(); }, [tab, employees.length, loadEmployees]);

  const review = async (request, action) => {
    const remarks = action === "reject"
      ? window.prompt("Reason for rejecting (optional):", "") ?? ""
      : "";
    try {
      setBusyId(String(request._id));
      const res = await axios.put(`/week-off/admin-action/${request._id}`, { action, remarks });
      if (res.data?.success) {
        toast.success(res.data.message || `Request ${action}d.`);
        loadRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update the request.");
    } finally {
      setBusyId("");
    }
  };

  const setDays = async (employee, weekday) => {
    const current = employee.weekOffDays || [];
    const next = current.includes(weekday)
      ? current.filter(day => day !== weekday)
      : [...current, weekday].sort((a, b) => a - b);
    if (next.length > employee.entitlement) {
      toast.error(`${employee.departmentName || "This department"} allows ${employee.entitlement} weekly off${employee.entitlement === 1 ? "" : "s"}.`);
      return;
    }
    try {
      setBusyId(employee.userId);
      const res = await axios.put(`/week-off/employees/${employee.userId}`, { weekOffDays: next });
      if (res.data?.success) {
        toast.success(res.data.message || "Weekly off updated.");
        setEmployees(list => list.map(item => (
          item.userId === employee.userId
            ? { ...item, weekOffDays: res.data.data.weekOffDays, weekOffDayNames: res.data.data.weekOffDayNames, usingDefault: res.data.data.weekOffDays.length === 0 }
            : item
        )));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update the weekly off.");
    } finally {
      setBusyId("");
    }
  };

  const visibleEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter(item => (
      `${item.name} ${item.email} ${item.employeeId} ${item.departmentName}`.toLowerCase().includes(needle)
    ));
  }, [employees, search]);

  // Whoever may not manage attendance gets a 403 from the API; show them nothing at all.
  if (!allowed) return null;
  if (loading && requests.length === 0) return null;

  return (
    <div style={styles.card}>
      <div style={styles.head}>
        <div>
          <h3 style={styles.title}>Weekly Off</h3>
          <p style={styles.sub}>Approve day changes, and set which day each employee's weekly off falls on.</p>
        </div>
        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tab, ...(tab === "requests" ? styles.tabActive : {}) }}
            onClick={() => setTab("requests")}
          >
            Requests
            {pendingCount > 0 && <span style={styles.count}>{pendingCount}</span>}
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(tab === "employees" ? styles.tabActive : {}) }}
            onClick={() => setTab("employees")}
          >
            Employee days
          </button>
        </div>
      </div>

      {tab === "requests" ? (
        <>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {["Pending", "Approved", "Rejected", "All"].map(value => (
              <button
                key={value}
                type="button"
                style={{ ...styles.tab, ...(statusFilter === value ? styles.tabActive : {}) }}
                onClick={() => setStatusFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {requests.length === 0 ? (
            <div style={styles.empty}>No {statusFilter === "All" ? "" : statusFilter.toLowerCase()} weekly off requests.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Wants off</th>
                  <th style={styles.th}>Instead of</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th} />
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request._id}>
                    <td style={styles.td}>
                      <strong>{request.user?.name || "Employee"}</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {request.user?.departmentName || request.user?.department || ""}
                      </div>
                    </td>
                    <td style={styles.td}>{prettyDate(request.toDateKey)}</td>
                    <td style={styles.td}>{prettyDate(request.fromDateKey)}</td>
                    <td style={styles.td}>{request.reason || "—"}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(STATUS_COLORS[request.status] || STATUS_COLORS.Cancelled) }}>
                        {request.status}
                      </span>
                      {request.reviewedBy?.name && (
                        <div style={{ fontSize: 11, color: "#64748b" }}>by {request.reviewedBy.name}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      {request.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            style={{ ...styles.approve, opacity: busyId === String(request._id) ? 0.6 : 1 }}
                            disabled={busyId === String(request._id)}
                            onClick={() => review(request, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.reject, opacity: busyId === String(request._id) ? 0.6 : 1 }}
                            disabled={busyId === String(request._id)}
                            onClick={() => review(request, "reject")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              value={search}
              placeholder="Search employee or department"
              onChange={event => setSearch(event.target.value)}
              style={styles.search}
            />
          </div>
          {visibleEmployees.length === 0 ? (
            <div style={styles.empty}>No employees to show.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Offs / week</th>
                  <th style={styles.th}>Weekly off day</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map(employee => (
                  <tr key={employee.userId}>
                    <td style={styles.td}>
                      <strong>{employee.name}</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{employee.employeeId || employee.email}</div>
                    </td>
                    <td style={styles.td}>{employee.departmentName || "—"}</td>
                    <td style={styles.td}>{employee.entitlement}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                        {WEEKDAYS.map(day => {
                          const on = (employee.weekOffDays || []).includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              title={employee.entitlement === 0 ? "This department works all seven days" : FULL_NAMES[day.value]}
                              disabled={employee.entitlement === 0 || busyId === employee.userId}
                              style={{ ...styles.dayBtn, ...(on ? styles.dayBtnOn : {}), opacity: employee.entitlement === 0 ? 0.4 : 1 }}
                              onClick={() => setDays(employee, day.value)}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                        {employee.usingDefault && (
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            {employee.entitlement === 0 ? "No weekly off" : "Department default (end of week)"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
