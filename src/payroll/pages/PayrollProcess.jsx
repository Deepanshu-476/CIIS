import React, { useCallback, useEffect, useState } from "react";
import { FiCalendar, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiEdit2, FiEye, FiFileText, FiList, FiLock, FiUnlock, FiRefreshCw, FiUsers, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/EmployeeSalaryAssignment.css";
import "../styles/PayrollProcess.css";
import "../styles/PayrollWorkflow.css";
import "../styles/PayrollOverflowFix.css";
import "../styles/PayrollFine.css";
import "../styles/PayrollPending.css";
import "../styles/PayrollAudit.css";
import "../styles/PayrollEmployeeHistory.css";
import "../styles/PayrollFineLimit.css";
import "../styles/PayrollPagination.css";
import "../styles/PayrollSerialNumber.css";
import "../styles/PayrollStructureColumn.css";
import "../styles/PayrollCalculationBreakdown.css";

const money = (amount) => `INR ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nameOf = (value) => typeof value === "object" ? value?.name || "—" : value || "—";
const workflowSteps = ["Draft", "Calculated", "Reviewed", "Approved", "Locked"];
const auditTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function PayrollProcess() {
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [fixingEmployee, setFixingEmployee] = useState(null);
  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [showFineForm, setShowFineForm] = useState(false);
  const [fineForm, setFineForm] = useState({ reason: "Late Fine", amount: "", remarks: "" });
  const [fineError, setFineError] = useState("");

  const loadRun = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/employee-salaries/payroll-run", { params: { month, department, page, limit: pageSize }, noCache: true });
      setRun(response.data?.run || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Payroll data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [month, department, page]);

  useEffect(() => { loadRun(); }, [loadRun]);

  const assignments = run?.employees || [];
  const departments = run?.filterOptions?.departments || [];
  const employees = assignments;
  const totals = { gross: Number(run?.filteredTotals?.earnings || 0), deductions: Number(run?.filteredTotals?.deductions || 0), net: Number(run?.filteredTotals?.net || 0) };
  const pagination = run?.pagination || { page: 1, limit: pageSize, total: employees.length, totalPages: 1 };
  const monthLabel = month ? new Date(`${month}-01T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" }) : "Selected Month";
  const status = run?.status || "Draft";
  const statusIndex = workflowSteps.indexOf(status);
  const historyEmployeeId = historyEmployee ? String(historyEmployee.user?._id || historyEmployee.user || "") : "";
  const employeeHistory = historyEmployeeId ? (run?.auditLog || []).filter(entry => String(entry.employeeId || "") === historyEmployeeId).reverse() : [];
  const availableFineAmount = Math.max(0, Number(fixingEmployee?.monthlyNet || 0));
  const selectedAppliedDeductions = Number(selectedEmployee?.totalDeductions || 0) + Number(selectedEmployee?.adjustmentDeductions || 0);

  const generate = async () => {
    setActing(true); setError(""); setMessage("");
    try {
      const response = await axiosInstance.post("/employee-salaries/payroll-run/generate", { month });
      setMessage(response.data.message); setPage(1); await loadRun();
    } catch (requestError) { setError(requestError.response?.data?.message || "Payroll could not be calculated."); }
    finally { setActing(false); }
  };

  const changeStatus = async (action) => {
    let reason = "";
    if (["sendback", "reopen"].includes(action)) {
      reason = window.prompt("Enter correction / reopen reason:", "") || "";
      if (!reason.trim()) return;
    }
    setActing(true); setError(""); setMessage("");
    try {
      const response = await axiosInstance.patch("/employee-salaries/payroll-run/status", { month, action, reason });
      setMessage(response.data.message); await loadRun();
    } catch (requestError) { setError(requestError.response?.data?.message || "Payroll status could not be updated."); }
    finally { setActing(false); }
  };

  const reprocessPayroll = async () => {
    const reason = window.prompt("Enter reprocess reason:", "Refresh attendance and employee salary data") || "";
    if (!reason.trim()) return;
    setActing(true); setError(""); setMessage("");
    try {
      await axiosInstance.patch("/employee-salaries/payroll-run/status", { month, action: "sendback", reason });
      const response = await axiosInstance.post("/employee-salaries/payroll-run/generate", { month });
      setMessage("Payroll reprocessed with the latest attendance and employee salary data."); setPage(1); await loadRun();
    } catch (requestError) { setError(requestError.response?.data?.message || "Payroll could not be reprocessed."); }
    finally { setActing(false); }
  };

  const openFixPage = (path) => {
    const userId = fixingEmployee?.user?._id || fixingEmployee?.user;
    const params = new URLSearchParams({ month });
    if (userId) {
      params.set("employeeId", String(userId));
      params.set("user", String(userId));
    }
    window.open(`${path}?${params.toString()}`, "_blank");
  };

  const reprocessSingleEmployee = async (employee) => {
    const employeeId = employee?.user?._id || employee?.user;
    const employeeName = employee?.user?.name || "this employee";
    if (!employeeId) return;
    setActing(true); setError(""); setMessage("");
    try {
      const response = await axiosInstance.post("/employee-salaries/payroll-run/recalculate-employee", { month, employeeId });
      setMessage(response.data?.message || `Recalculated payroll for ${employeeName}.`);
      await loadRun();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Payroll for ${employeeName} could not be recalculated.`);
    } finally {
      setActing(false);
    }
  };

  const addFine = async (event) => {
    event.preventDefault();
    const employeeId = fixingEmployee?.user?._id || fixingEmployee?.user;
    if (!employeeId || !fineForm.reason.trim() || Number(fineForm.amount) <= 0) {
      setFineError("Fine reason and valid amount are required.");
      return;
    }
    setActing(true); setError(""); setFineError(""); setMessage("");
    try {
      const selectedMonth = month || run?.month;
      if (!selectedMonth) {
        setFineError("Please select a payroll month.");
        setActing(false);
        return;
      }
      if (!run?.saved) {
        const generatedResponse = await axiosInstance.post("/employee-salaries/payroll-run/generate", { month: selectedMonth }, { params: { month: selectedMonth } });
        void generatedResponse;
      }
      const response = await axiosInstance.patch("/employee-salaries/payroll-run/adjustment", { month: selectedMonth, employeeId, ...fineForm, amount: Number(fineForm.amount) }, { params: { month: selectedMonth } });
      setMessage(response.data.message); setFixingEmployee(null); setShowFineForm(false); setFineForm({ reason: "Late Fine", amount: "", remarks: "" }); await loadRun();
    } catch (requestError) { setFineError(requestError.response?.data?.message || "Fine could not be added. Please try again."); }
    finally { setActing(false); }
  };

  const removeFine = async (employee, adjustmentId) => {
    if (!window.confirm("Are you sure you want to remove this fine?")) return;
    const employeeId = employee?.user?._id || employee?.user;
    setActing(true); setError(""); setMessage("");
    try {
      const response = await axiosInstance.delete("/employee-salaries/payroll-run/adjustment", { data: { month, employeeId, adjustmentId }, params: { month, employeeId, adjustmentId } });
      setMessage(response.data.message); setSelectedEmployee(null); await loadRun();
    } catch (requestError) { setError(requestError.response?.data?.message || "Fine could not be removed."); }
    finally { setActing(false); }
  };

  const changeEmployeePayrollStatus = async (employee, action) => {
    const employeeId = employee?.user?._id || employee?.user;
    const actionLabel = action === "review" ? "mark as Reviewed" : action === "approve" ? "Approve" : action === "reopen" || action === "unlock" ? "Unlock & Reopen" : "Lock";
    if (!employeeId || !window.confirm(`${actionLabel} payroll for ${employee?.user?.name || "this employee"}?`)) return;
    setActing(true); setError(""); setMessage("");
    try {
      const response = await axiosInstance.patch("/employee-salaries/payroll-run/employee-status", { month, employeeId, action });
      setMessage(response.data.message); await loadRun();
    } catch (requestError) { setError(requestError.response?.data?.message || "Employee payroll status could not be updated."); }
    finally { setActing(false); }
  };

  return <main className="esa-container payroll-process-page">
    <section className="esa-card pp-filter-card">
      <div className="esa-card-header"><h2>Payroll Process</h2><p>Select the payroll period, verify employee calculations and complete the monthly workflow.</p></div>
      <div className="pp-filters">
        <label>Payroll Month<span><FiCalendar /><input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setDepartment(""); setPage(1); }} /></span></label>
        <label>Department<select value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1); }}><option value="">All Departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
    </section>

    {loading && <section className="esa-card pp-empty">Loading monthly payroll...</section>}
    {!loading && error && <section className="esa-card pp-error">{error}</section>}
    {!loading && message && <section className="esa-card pp-success">{message}</section>}
    {!loading && run && <>
      <section className="esa-card pp-workflow">
        <div className="pp-workflow-main">
          <div className="pp-status-heading"><div><small>PAYROLL WORKFLOW</small><h3>{monthLabel}</h3></div><strong className={`pp-run-status status-${status.toLowerCase()}`}>{status}</strong></div>
          <div className="pp-status-track">{workflowSteps.map((step, index) => <div className={`pp-status-step ${index <= statusIndex ? "complete" : ""} ${step === status ? "current" : ""}`} key={step}><i>{index < statusIndex ? "✓" : index + 1}</i><span>{step}</span></div>)}</div>
          {Number(run.totals?.pendingAttendance || 0) > 0 && <p className="pp-pending-alert"><span>!</span>{run.totals.pendingAttendance} attendance day(s) pending — approval will use attendance recorded up to the calculation date.</p>}
        </div>
        <div className="pp-actions">
          {(["Draft", "Calculated"].includes(status)) && <button onClick={generate} disabled={acting}><FiRefreshCw />{run.saved ? "Recalculate Payroll" : "Generate Payroll"}</button>}
          {status === "Calculated" && <>
            <button onClick={() => changeStatus("review")} disabled={acting}><FiCheckCircle />Mark Reviewed</button>
            <button className="primary" disabled title="Approve Payroll will be active after completing Mark Reviewed"><FiCheckCircle />Approve Payroll</button>
          </>}
          {status === "Reviewed" && <><button onClick={reprocessPayroll} disabled={acting}><FiRefreshCw />Reprocess Payroll</button><button className="primary" onClick={() => changeStatus("approve")} disabled={acting} title="Approve payroll calculated up to the current cut-off date"><FiCheckCircle />Approve All</button></>}
          {status === "Approved" && <><button onClick={() => changeStatus("reopen")} disabled={acting}><FiRefreshCw />Reopen</button><button className="primary" onClick={() => changeStatus("lock")} disabled={acting}><FiLock />Lock Payroll</button></>}
          {status === "Locked" && <button onClick={() => changeStatus("reopen")} disabled={acting}><FiRefreshCw />Reopen for Correction</button>}
        </div>
      </section>

      {/* Summary Metrics Cards */}
      <section className="esa-card" style={{ padding: "16px 18px", marginBottom: 24 }}>
        <div className="pp-summary" style={{ margin: 0 }}>
          {/* 1. Total Employees */}
          <div className="pp-card-item pp-card-employees">
            <div className="pp-card-icon">
              <FiUsers />
            </div>
            <div className="pp-card-content">
              <span className="pp-card-title">Total Employees</span>
              <strong className="pp-card-value">{pagination.total}</strong>
              <small className="pp-card-sub">Employees</small>
            </div>
          </div>

          {/* 2. Total Earnings */}
          <div className="pp-card-item pp-card-earnings">
            <div className="pp-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 3H4a2 2 0 0 0-2 2v2"/>
                <circle cx="17" cy="14" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div className="pp-card-content">
              <span className="pp-card-title">Total Earnings</span>
              <strong className="pp-card-value">{money(totals.gross)}</strong>
            </div>
          </div>

          {/* 3. Total Deductions */}
          <div className="pp-card-item pp-card-deductions">
            <div className="pp-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v12" />
                <path d="m6 10 6 6 6-6" />
                <path d="M4 20h16" />
              </svg>
            </div>
            <div className="pp-card-content">
              <span className="pp-card-title">Total Deductions</span>
              <strong className="pp-card-value">{money(totals.deductions)}</strong>
            </div>
          </div>

          {/* 4. Net Payroll */}
          <div className="pp-card-item pp-card-net">
            <div className="pp-card-icon">
              <FiCreditCard />
            </div>
            <div className="pp-card-content">
              <span className="pp-card-title">Net Payroll</span>
              <strong className="pp-card-value">{money(totals.net)}</strong>
            </div>
          </div>
          <div className="pp-card-item pp-card-status">
            <div className="pp-card-icon"><FiClock /></div>
            <div className="pp-card-content">
              <span className="pp-card-title">Payroll Status</span>
              <strong className="pp-card-value">{status}</strong>
              <small className="pp-card-sub">{monthLabel}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="esa-card pp-table-card">
        <div className="pp-table-head"><div><h2>Payroll Register — {monthLabel}</h2><p>Identify issues via View Calculation and correct them in Attendance, Leave, or Employee Salary.</p></div><span>{pagination.total} Employees</span></div>
        <div className="pp-table-wrap"><table className="pp-register-table">
          <thead><tr><th className="pp-sno">S.No.</th><th>Employee</th><th>Department / Job Role</th><th>Salary Structure</th><th>Present Days</th><th>Half Days</th><th>Absent Days</th><th>Gross Salary</th><th>Total Deductions</th><th>Net Salary</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{employees.length ? employees.map((item, index) => <tr key={item._id}>
            <td className="pp-sno">{(pagination.page - 1) * pagination.limit + index + 1}</td>
            <td><strong>{item.user?.name || "—"}</strong><small>{item.user?.employeeId || item.user?.email || ""}</small></td>
            <td><strong>{item.department || nameOf(item.user?.department)}</strong><small>{item.designation || nameOf(item.user?.jobRole)}</small></td>
            <td className="pp-structure"><strong>{item.salaryStructure?.name || "Not Assigned"}</strong><small>{item.salaryStructure?.code || ""}</small></td>
            <td className="pp-number pp-positive">{item.attendance?.presentDays || 0}</td><td className="pp-number pp-halfday">{item.attendance?.halfDayDays || 0}</td><td className="pp-number pp-negative">{item.attendance?.lopDays || 0}</td>
            <td className="pp-money">{money(item.assignedGross)}</td><td className="pp-money pp-negative">{money(Number(item.totalDeductions || 0) + Number(item.adjustmentDeductions || 0))}</td><td className="pp-money pp-net"><strong>{money(item.monthlyNet)}</strong></td>
            <td><span className={`pp-ready ${item.payrollStatus === "Reviewed" ? "reviewed" : item.payrollStatus === "Approved" ? "approved" : item.payrollStatus === "Locked" ? "locked" : ""}`}>{item.payrollStatus}</span>{Number(item.attendance?.pendingDays || 0) > 0 && <small>{item.attendance.pendingDays} attendance pending</small>}</td><td><div className="pp-row-actions"><button className="pp-view" onClick={() => setSelectedEmployee(item)} aria-label={`View ${item.user?.name || "employee"} calculation`} title="View calculation"><FiEye /></button><button className="pp-fix" onClick={() => setFixingEmployee(item)} disabled={acting || ["Approved", "Locked"].includes(item.payrollStatus || status)} aria-label={`Edit ${item.user?.name || "employee"} payroll source`} title={["Approved", "Locked"].includes(item.payrollStatus || status) ? "Unlock payroll to edit this employee" : "Edit / Fix source data"}><FiEdit2 /></button><button className="pp-recalculate-employee" onClick={() => reprocessSingleEmployee(item)} disabled={acting || ["Approved", "Locked"].includes(item.payrollStatus || status)} aria-label={`Recalculate ${item.user?.name || "employee"} payroll`} title="Recalculate single employee payroll"><FiRefreshCw /></button><button className="pp-history" onClick={() => setHistoryEmployee(item)} aria-label={`View ${item.user?.name || "employee"} payroll history`} title="Employee history"><FiList /></button>{item.payrollStatus === "Calculated" && <button className="pp-status-btn pp-btn-review" onClick={() => changeEmployeePayrollStatus(item, "review")} disabled={acting} title="Mark employee payroll Reviewed"><FiCheckCircle /> Mark Reviewed</button>}{item.payrollStatus === "Reviewed" && <button className="pp-status-btn pp-btn-approve" onClick={() => changeEmployeePayrollStatus(item, "approve")} disabled={acting} title="Approve employee payroll till calculation date"><FiCheckCircle /> Approve</button>}{item.payrollStatus === "Approved" && <button className="pp-status-btn pp-btn-lock" onClick={() => changeEmployeePayrollStatus(item, "lock")} disabled={acting} title="Lock employee payroll"><FiLock /> Lock</button>}{["Approved", "Locked"].includes(item.payrollStatus) && <button className="pp-status-btn pp-btn-unlock" onClick={() => changeEmployeePayrollStatus(item, "unlock")} disabled={acting} title="Unlock/Reopen payroll for this employee"><FiUnlock /> Unlock</button>}</div></td>
          </tr>) : <tr><td colSpan="12" className="pp-empty">No active salary assignment found.</td></tr>}</tbody>
        </table></div>
        {pagination.totalPages > 1 && <div className="pp-pagination"><span>Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span><div><button onClick={() => setPage(current => Math.max(1, current - 1))} disabled={pagination.page <= 1 || loading}>Previous</button>{Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map(number => <button key={number} className={number === pagination.page ? "active" : ""} onClick={() => setPage(number)} disabled={loading}>{number}</button>)}<button onClick={() => setPage(current => Math.min(pagination.totalPages, current + 1))} disabled={pagination.page >= pagination.totalPages || loading}>Next</button></div></div>}
      </section>
      <p className="pp-note">Correct source data in Draft/Calculated mode and click Recalculate. For Approved/Locked payroll, provide a reason to Reopen for correction.</p>
    </>}

    {selectedEmployee && <div className="pp-modal-backdrop" onMouseDown={() => setSelectedEmployee(null)}><section className="pp-modal pp-calculation-modal" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><h3>{selectedEmployee.user?.name} — Calculation</h3><p>{monthLabel} payroll breakdown</p></div><button onClick={() => setSelectedEmployee(null)} aria-label="Close calculation"><FiX /></button></header>
      <div className="pp-calculation-scroll">
      <div className="pp-detail-days"><span>Working <b>{selectedEmployee.attendance?.workingDays || 0}</b></span><span>Present <b>{selectedEmployee.attendance?.presentDays || 0}</b></span><span>Half Day <b>{selectedEmployee.attendance?.halfDayDays || 0}</b></span><span>Paid Leave <b>{selectedEmployee.attendance?.paidLeaveDays || 0}</b></span><span>Absent <b>{selectedEmployee.attendance?.lopDays || 0}</b></span><span>Pending <b>{selectedEmployee.attendance?.pendingDays || 0}</b></span><span>Future Working <b>{selectedEmployee.attendance?.futureDays || 0}</b></span></div>
      {Number(selectedEmployee.attendance?.pendingDays || 0) > 0 && <div className="pp-pending-pay"><span>Provisional Calculation</span><strong>{selectedEmployee.attendance.pendingDays} days pending</strong><small>Full monthly salary is shown below. Payable earnings and net salary currently include only recorded attendance; pending days are not treated as absence.</small></div>}
      <div className="pp-detail-grid">
        <section>
          <h4>Monthly Earnings (Full Salary)</h4>
          {(selectedEmployee.components || []).filter((item) => item.type === "earning").map((item) => <p key={`${item.component?._id || item.component}-${item.code}`}><span>{item.name}</span><b>{money(item.amount)}</b></p>)}
          <p className="pp-section-total"><span>Full Monthly Earnings</span><b>{money(selectedEmployee.assignedGross)}</b></p>
          <p className="pp-payable-row"><span>Earned Salary Till Date<small>Future working days are not included and are not deductions</small></span><b>{money(selectedEmployee.monthlyGross)}</b></p>
        </section>
        <section>
          <h4>Applied Deductions</h4>
          {Number(selectedEmployee.halfDayDeduction || 0) > 0 && <p><span>Half-day Deduction ({selectedEmployee.attendance?.halfDayDays || 0} days)</span><b>{money(selectedEmployee.halfDayDeduction)}</b></p>}
          {Number(selectedEmployee.lopDeduction || 0) > 0 && <p><span>Absent-day Deduction ({selectedEmployee.attendance?.lopDays || 0} days)</span><b>{money(selectedEmployee.lopDeduction)}</b></p>}
          {(selectedEmployee.components || []).filter((item) => item.type === "deduction").map((item) => <p key={`${item.component?._id || item.component}-${item.code}`}><span>{item.name}</span><b>{money(item.payrollAmount ?? item.amount)}</b></p>)}
          {(selectedEmployee.adjustments || []).map((item) => <p className="pp-fine-row" key={item._id}><span>{item.reason}<small>{item.remarks || "One-time payroll adjustment"}</small></span><b>{money(item.amount)}{!["Approved", "Locked"].includes(selectedEmployee?.payrollStatus || status) && <button onClick={() => removeFine(selectedEmployee, item._id)} disabled={acting} title="Remove adjustment"><FiX /></button>}</b></p>)}
          <p className="pp-deduction-total"><span>Total Applied Deductions</span><b>{money(selectedAppliedDeductions)}</b></p>
        </section>
      </div>
      </div>
      <footer><span>{Number(selectedEmployee.attendance?.pendingDays || 0) > 0 ? "Provisional Net Salary Till Date" : Number(selectedEmployee.attendance?.futureDays || 0) > 0 ? "Net Salary Till Date" : "Final Net Salary"}</span><strong>{money(selectedEmployee.monthlyNet)}</strong></footer>
    </section></div>}

    {fixingEmployee && <div className="pp-modal-backdrop" onMouseDown={() => { setFixingEmployee(null); setShowFineForm(false); }}><section className="pp-modal pp-fix-modal" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><h3>Fix Payroll Source</h3><p>{fixingEmployee.user?.name} — {monthLabel}</p></div><button onClick={() => { setFixingEmployee(null); setShowFineForm(false); }} aria-label="Close fix options"><FiX /></button></header>
      <div className="pp-fix-intro">Correct the issue directly via fine deduction or open salary structure and attendance management in a new tab without losing your filled payroll details.</div>
      {!showFineForm ? <div className="pp-fix-options">
        <button className="fine" onClick={() => { setFineError(""); setShowFineForm(true); }} disabled={["Approved", "Locked"].includes(fixingEmployee?.payrollStatus || status)}><i><FiDollarSign /></i><span><strong>Add Fine / Deduction</strong><small>{!["Approved", "Locked"].includes(fixingEmployee?.payrollStatus || status) ? "Apply a one-time monthly fine to the selected employee" : "Unlock payroll to add fine"}</small></span></button>
        <button onClick={() => openFixPage("/ciisUser/salary-assignment")} disabled={["Approved", "Locked"].includes(fixingEmployee?.payrollStatus || status)}><i><FiFileText /></i><span><strong>Fix Salary Structure</strong><small>{!["Approved", "Locked"].includes(fixingEmployee?.payrollStatus || status) ? "Open salary structure assignment in a new tab" : "Unlock payroll to edit salary structure"}</small></span></button>
        <button onClick={() => openFixPage("/ciisUser/emp-attendance")} disabled={["Approved", "Locked"].includes(fixingEmployee?.payrollStatus || status)}><i><FiClock /></i><span><strong>Fix Attendance</strong><small>{!["Approved", "Locked"].includes(fixingEmployee?.payrollStatus || status) ? "Open full attendance management in a new tab" : "Unlock payroll to edit attendance"}</small></span></button>
      </div> : <form className="pp-fine-form" onSubmit={addFine}>
        {fineError && <div className="pp-fine-error">{fineError}</div>}
        <label>Fine Reason<select value={fineForm.reason} onChange={(event) => setFineForm({ ...fineForm, reason: event.target.value })}><option>Late Fine</option><option>Damage Fine</option><option>Policy Violation</option><option>Advance Recovery</option><option>Other Deduction</option></select></label>
        <label>Amount (INR)<input type="number" min="0.01" max={availableFineAmount || undefined} step="0.01" value={fineForm.amount} onChange={(event) => setFineForm({ ...fineForm, amount: event.target.value })} placeholder="Enter amount" required /><small className="pp-fine-limit">Maximum available: {money(availableFineAmount)}</small></label>
        <label className="full">Remarks<textarea value={fineForm.remarks} onChange={(event) => setFineForm({ ...fineForm, remarks: event.target.value })} placeholder="Enter reason / remarks for the fine" rows="3" /></label>
        <div className="pp-fine-form-actions"><button type="button" onClick={() => setShowFineForm(false)}>Back</button><button className="primary" type="submit" disabled={acting}>{acting ? "Saving..." : "Add Fine"}</button></div>
      </form>}
    </section></div>}

    {historyEmployee && <div className="pp-modal-backdrop" onMouseDown={() => setHistoryEmployee(null)}><section className="pp-modal pp-employee-history" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><h3>{historyEmployee.user?.name} — Payroll History</h3><p>{monthLabel} employee-specific changes</p></div><button onClick={() => setHistoryEmployee(null)} aria-label="Close employee history"><FiX /></button></header>
      <div className="pp-employee-history-list">{employeeHistory.length ? employeeHistory.map((entry, index) => <article key={`${entry.performedAt}-${index}`}><i className={entry.action?.startsWith("Remove") ? "removed" : "added"}>{entry.action?.startsWith("Remove") ? "−" : "+"}</i><div><strong>{entry.action}</strong><span>{entry.reason || "No details"}</span><small>By {entry.performedByName || entry.performedBy?.name || entry.performedBy?.email || "Payroll User"}</small></div><time>{auditTime(entry.performedAt)}</time></article>) : <div className="pp-no-employee-history"><FiList /><strong>No employee-specific history</strong><span>Audit logs of added or removed fines will appear here.</span></div>}</div>
    </section></div>}
  </main>;
}
