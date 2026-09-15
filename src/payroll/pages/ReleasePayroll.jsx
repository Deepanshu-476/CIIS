import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiSearch,
  FiUnlock,
  FiUsers,
  FiX,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
  FiFilter,
  FiArrowUpRight,
  FiTrendingUp,
  FiShield
} from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/ReleasePayroll.css";

const currentMonth = () => new Date().toISOString().slice(0, 7);

const money = value =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const nameOf = row => row?.user?.name || row?.user?.email || "Employee";

const initialsOf = name => {
  if (!name || typeof name !== "string") return "E";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const avatarBgColor = name => {
  const colors = [
    "rp-av-indigo",
    "rp-av-emerald",
    "rp-av-blue",
    "rp-av-purple",
    "rp-av-amber"
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const monthName = value => {
  if (!value) return "";
  return new Date(`${value}-01T00:00:00`).toLocaleString("en-IN", {
    month: "long",
    year: "numeric"
  });
};

const dateTime = value =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "—";

export default function ReleasePayroll() {
  const [month, setMonth] = useState(currentMonth());
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [data, setData] = useState({ pending: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ paymentReference: "", remarks: "" });
  const [releasing, setReleasing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(
        "/employee-salaries/payroll-release",
        { params: { month }, noCache: true }
      );
      setData({
        pending: response.data?.pending || [],
        history: response.data?.history || []
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Release payroll data could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const departments = useMemo(() => {
    const set = new Set();
    [...data.pending, ...data.history].forEach(row => {
      const dept = row.department || row.user?.department?.name || row.user?.department;
      if (dept) set.add(dept);
    });
    return Array.from(set);
  }, [data.pending, data.history]);

  const matches = row => {
    const textMatch = `${nameOf(row)} ${row?.user?.employeeId || row?.user?.empId || ""} ${
      row?.department || row?.user?.department?.name || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase());

    const rowDept = row.department || row.user?.department?.name || row.user?.department || "";
    const deptMatch = deptFilter === "ALL" || rowDept.toUpperCase() === deptFilter.toUpperCase();

    return textMatch && deptMatch;
  };

  const pending = useMemo(
    () => data.pending.filter(matches),
    [data.pending, search, deptFilter]
  );
  const history = useMemo(
    () => data.history.filter(matches),
    [data.history, search, deptFilter]
  );

  const totalPendingAmount = useMemo(
    () => data.pending.reduce((sum, row) => sum + Number(row.monthlyNet || 0), 0),
    [data.pending]
  );

  const totalReleasedAmount = useMemo(
    () => data.history.reduce((sum, row) => sum + Number(row.monthlyNet || 0), 0),
    [data.history]
  );

  const release = async event => {
    event.preventDefault();
    if (!selected || releasing) return;
    setReleasing(true);
    setError("");
    setMessage("");
    try {
      const response = await axiosInstance.post(
        "/employee-salaries/payroll-release",
        {
          month: selected.month,
          employeeId: selected.employeeId,
          ...form
        }
      );
      setMessage(response.data?.message || "Payroll released successfully.");
      setSelected(null);
      setForm({ paymentReference: "", remarks: "" });
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Payroll could not be released."
      );
    } finally {
      setReleasing(false);
    }
  };

  return (
    <main className="release-payroll">
      {/* Top Banner & Header */}
      <header className="rp-header-card">
        <div className="rp-header-content">
          <div className="rp-eyebrow">
            <FiShield /> Payroll Management Center
          </div>
          <h1>Release Payroll</h1>
          <p>
            Publish locked payroll runs, generate employee payslips, and dispatch salary disbursements.
          </p>
        </div>

        <div className="rp-header-controls">
          <label className="rp-control-group">
            <span className="rp-label-text">Salary Period</span>
            <div className="rp-input-with-icon">
              <FiCalendar className="rp-input-icon" />
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
              />
            </div>
          </label>
          <button
            type="button"
            className="rp-btn-refresh"
            onClick={load}
            disabled={loading}
            title="Refresh Data"
          >
            <FiRefreshCw className={loading ? "rp-spinning" : ""} /> Refresh
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="rp-alert error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="rp-alert success">
          <FiCheckCircle />
          <span>{message}</span>
        </div>
      )}

      {/* 4 Executive Metric Cards */}
      <section className="rp-stats-grid">
        <article className="rp-stat-tile rp-tile-amber">
          <div className="rp-tile-top">
            <div className="rp-tile-icon"><FiClock /></div>
            <span className="rp-pill rp-pill-amber">
              {data.pending.length > 0 ? "Action Required" : "All Clear"}
            </span>
          </div>
          <div className="rp-tile-content">
            <span className="rp-tile-title">Pending Release</span>
            <strong className="rp-tile-val">
              {data.pending.length} <small className="rp-val-unit">record{data.pending.length === 1 ? "" : "s"}</small>
            </strong>
          </div>
        </article>

        <article className="rp-stat-tile rp-tile-purple">
          <div className="rp-tile-top">
            <div className="rp-tile-icon"><FiTrendingUp /></div>
            <span className="rp-pill rp-pill-purple">Locked Net</span>
          </div>
          <div className="rp-tile-content">
            <span className="rp-tile-title">Pending Payout</span>
            <strong className="rp-tile-val">{money(totalPendingAmount)}</strong>
          </div>
        </article>

        <article className="rp-stat-tile rp-tile-blue">
          <div className="rp-tile-top">
            <div className="rp-tile-icon"><FiUsers /></div>
            <span className="rp-pill rp-pill-blue">Active Payslips</span>
          </div>
          <div className="rp-tile-content">
            <span className="rp-tile-title">Released Employees</span>
            <strong className="rp-tile-val">
              {data.history.length} <small className="rp-val-unit">employee{data.history.length === 1 ? "" : "s"}</small>
            </strong>
          </div>
        </article>

        <article className="rp-stat-tile rp-tile-emerald">
          <div className="rp-tile-top">
            <div className="rp-tile-icon"><FiCheckCircle /></div>
            <span className="rp-pill rp-pill-emerald">Released Net</span>
          </div>
          <div className="rp-tile-content">
            <span className="rp-tile-title">Net Amount Released</span>
            <strong className="rp-tile-val">{money(totalReleasedAmount)}</strong>
          </div>
        </article>
      </section>

      {/* Search & Filter Toolbar */}
      <div className="rp-toolbar-card">
        <div className="rp-search-field">
          <FiSearch className="rp-search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by employee name, employee ID, or job role..."
          />
          {search && (
            <button
              type="button"
              className="rp-btn-clear"
              onClick={() => setSearch("")}
            >
              <FiX />
            </button>
          )}
        </div>

        {departments.length > 0 && (
          <div className="rp-filter-field">
            <FiFilter className="rp-filter-icon" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments ({data.pending.length + data.history.length})</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rp-toolbar-meta">
          Showing <strong>{pending.length}</strong> pending & <strong>{history.length}</strong> released
        </div>
      </div>

      {/* Table 1: Locked Payroll Awaiting Release */}
      <section className="rp-section-card">
        <div className="rp-section-head">
          <div className="rp-head-title-wrap">
            <div className="rp-title-with-dot">
              <span className="rp-dot rp-dot-amber"></span>
              <h2>Locked Payroll Awaiting Release</h2>
            </div>
            <p>
              Locked payroll records for {monthName(month)}. Click Release to publish payslips to employees.
            </p>
          </div>
          <span className="rp-count-badge rp-badge-amber">
            {pending.length} Record{pending.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="rp-table-wrapper">
          <table className="rp-modern-table">
            <thead>
              <tr>
                <th>Employee Details</th>
                <th>Department</th>
                <th className="rp-num">Gross Salary</th>
                <th className="rp-num">Total Deductions</th>
                <th className="rp-num">Net Transfer Amount</th>
                <th>Locked Timestamp</th>
                <th className="rp-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(row => {
                const empName = nameOf(row);
                const empId = row.user?.employeeId || row.user?.empId || "—";
                const totalDed =
                  Number(row.totalDeductions || 0) +
                  Number(row.adjustmentDeductions || 0);
                const avatarClass = avatarBgColor(empName);

                return (
                  <tr key={`${row.month}-${row.employeeId}`}>
                    <td>
                      <div className="rp-user-cell">
                        <div className={`rp-avatar-circle ${avatarClass}`}>
                          {initialsOf(empName)}
                        </div>
                        <div className="rp-user-info">
                          <strong className="rp-user-name">{empName}</strong>
                          <span className="rp-user-id">{empId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rp-dept-tag">
                        {row.department || row.user?.department?.name || "—"}
                      </span>
                    </td>
                    <td className="rp-num rp-val-gross">{money(row.monthlyGross)}</td>
                    <td className="rp-num rp-val-deduction">{money(totalDed)}</td>
                    <td className="rp-num">
                      <span className="rp-net-box">{money(row.monthlyNet)}</span>
                    </td>
                    <td className="rp-timestamp">{dateTime(row.lockedAt)}</td>
                    <td className="rp-right">
                      <button
                        className="rp-btn-action-release"
                        onClick={() => setSelected(row)}
                      >
                        <FiUnlock /> Release
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && !pending.length && (
                <tr>
                  <td colSpan="7" className="rp-empty-td">
                    <div className="rp-empty-state">
                      <div className="rp-empty-badge">
                        <FiCheckCircle />
                      </div>
                      <h3>All Payroll Released!</h3>
                      <p>There are no locked payroll records awaiting release for {monthName(month)}.</p>
                    </div>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="7" className="rp-empty-td">
                    <div className="rp-empty-state">
                      <div className="rp-loader-spin"></div>
                      <p>Fetching payroll records...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 2: Released History */}
      <section className="rp-section-card">
        <div className="rp-section-head">
          <div className="rp-head-title-wrap">
            <div className="rp-title-with-dot">
              <span className="rp-dot rp-dot-emerald"></span>
              <h2>Released History</h2>
            </div>
            <p>Official released payroll history and active payslip logs.</p>
          </div>
          <span className="rp-count-badge rp-badge-emerald">
            {history.length} Released Record{history.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="rp-table-wrapper">
          <table className="rp-modern-table">
            <thead>
              <tr>
                <th>Employee Details</th>
                <th>Payroll Period</th>
                <th className="rp-num">Net Salary Paid</th>
                <th>Release Timestamp</th>
                <th className="rp-right">Payslip Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(row => {
                const empName = nameOf(row);
                const empId = row.user?.employeeId || row.user?.empId || "—";
                const avatarClass = avatarBgColor(empName);

                return (
                  <tr key={`${row.month}-${row.employeeId}`}>
                    <td>
                      <div className="rp-user-cell">
                        <div className={`rp-avatar-circle ${avatarClass}`}>
                          {initialsOf(empName)}
                        </div>
                        <div className="rp-user-info">
                          <strong className="rp-user-name">{empName}</strong>
                          <span className="rp-user-id">{empId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rp-period-tag">{monthName(row.month)}</span>
                    </td>
                    <td className="rp-num">
                      <span className="rp-net-box rp-net-box-green">
                        {money(row.monthlyNet)}
                      </span>
                    </td>
                    <td className="rp-timestamp">{dateTime(row.releasedAt)}</td>
                    <td className="rp-right">
                      <span className="rp-status-published">
                        <FiCheckCircle /> Payslip Published
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!loading && !history.length && (
                <tr>
                  <td colSpan="5" className="rp-empty-td">
                    <div className="rp-empty-state">
                      <p>No released payroll history records found for this period.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal */}
      {selected && (
        <div
          className="rp-backdrop"
          onMouseDown={() => !releasing && setSelected(null)}
        >
          <form
            className="rp-dialog"
            onSubmit={release}
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="rp-btn-close"
              onClick={() => setSelected(null)}
            >
              <FiX />
            </button>

            <div className="rp-dialog-head">
              <div className="rp-dialog-icon">
                <FiUnlock />
              </div>
              <div>
                <h2>Confirm Payroll Release</h2>
                <p>
                  Publishing official payslip for <strong>{nameOf(selected)}</strong> ({monthName(selected.month)}).
                </p>
              </div>
            </div>

            <div className="rp-dialog-amount-card">
              <div className="rp-amount-left">
                <span>Net Transfer Amount</span>
                <small>Final net salary payable to employee</small>
              </div>
              <strong className="rp-amount-val">{money(selected.monthlyNet)}</strong>
            </div>

            <div className="rp-dialog-form">
              <label className="rp-field">
                <span>Payment Reference / UTR Number <small>(Optional)</small></span>
                <input
                  value={form.paymentReference}
                  maxLength="120"
                  onChange={e =>
                    setForm({ ...form, paymentReference: e.target.value })
                  }
                  placeholder="e.g. UTR19847291849 / NEFT / IMPS Transfer ID"
                />
              </label>

              <label className="rp-field">
                <span>Internal Remarks / Notes <small>(Optional)</small></span>
                <textarea
                  value={form.remarks}
                  maxLength="500"
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Add any internal processing note..."
                />
              </label>
            </div>

            <div className="rp-dialog-footer">
              <button
                type="button"
                className="rp-btn-secondary"
                onClick={() => setSelected(null)}
                disabled={releasing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rp-btn-primary"
                disabled={releasing}
              >
                {releasing ? (
                  <>
                    <div className="rp-spin-ring"></div> Releasing Payslip...
                  </>
                ) : (
                  <>
                    <FiUnlock /> Confirm & Release Payslip
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
