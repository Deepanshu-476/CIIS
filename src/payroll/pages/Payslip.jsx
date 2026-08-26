import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiDownload, FiFileText } from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/Payslip.css";
import "../styles/PayslipModern.css";
import "../styles/PayslipAttendanceCard.css";
import "../styles/PayslipTillDateClarity.css";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);
const displayDate = (value) => value ? new Date(value).toLocaleDateString("en-GB") : "—";
const monthName = (value) => value ? new Date(`${value}-01T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" }) : "Selected month";
const employeeKey = (item) => String(item?.user?._id || item?.user || item?._id || "");

const storedCompany = () => {
  try { return JSON.parse(localStorage.getItem("companyDetails") || "null") || {}; }
  catch { return {}; }
};

export default function Payslip() {
  const documentRef = useRef(null);
  const [run, setRun] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [payrollMonth, setPayrollMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const company = useMemo(storedCompany, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError(""); setMessage("");
      try {
        const response = await axiosInstance.get("/employee-salaries/payroll-payslips", { params: { month: payrollMonth }, noCache: true });
        if (!active) return;
        const nextRun = response.data?.run || null;
        const list = nextRun?.employees || [];
        setRun(nextRun); setEmployees(list);
        setSelectedId(current => list.some(item => employeeKey(item) === String(current)) ? current : employeeKey(list[0]));
      } catch (requestError) {
        if (active) { setRun(null); setEmployees([]); setSelectedId(""); setError(requestError.response?.data?.message || "Payslip data could not be loaded."); }
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [payrollMonth]);

  const payroll = useMemo(() => employees.find(item => employeeKey(item) === String(selectedId)) || null, [employees, selectedId]);
  const earnings = useMemo(() => (payroll?.components || []).filter(item => item.type === "earning"), [payroll]);
  const deductions = useMemo(() => (payroll?.components || []).filter(item => item.type === "deduction"), [payroll]);
  const attendance = payroll?.attendance || {};
  const isTillDatePayslip = Number(attendance.futureDays || 0) > 0;
  const earningAmount = (item) => item.amount ?? item.payrollAmount ?? 0;
  const deductionAmount = (item) => item.payrollAmount ?? item.amount ?? 0;
  const totalSalaryDeductions = Number(payroll?.totalDeductions || 0) + Number(payroll?.adjustmentDeductions || 0);
  const displayedAttendanceDeduction = Number(payroll?.attendanceDeduction || 0);
  const totalDeductions = totalSalaryDeductions;
  const displayedEarnings = isTillDatePayslip ? Number(payroll?.monthlyGross || 0) : Number(payroll?.assignedGross || 0);
  const payslipNumber = payroll ? `PLS-${payrollMonth.replace("-", "")}-${(payroll.user?.employeeId || selectedId).toString().slice(-6).toUpperCase()}` : "—";
  const payDate = payroll?.approvedAt || payroll?.lockedAt || run?.approvedAt || run?.lockedAt || new Date(`${payrollMonth}-01T00:00:00`);
  const payslipStatus = payroll?.payrollStatus || run?.status || "Approved";

  const downloadPdf = async () => {
    if (!documentRef.current || !payroll) return;
    setAction("pdf"); setError("");
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(documentRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF("p", "mm", "a4");
      const maxWidth = 196; const maxHeight = 273;
      let width = maxWidth; let height = (canvas.height * width) / canvas.width;
      if (height > maxHeight) { height = maxHeight; width = (canvas.width * height) / canvas.height; }
      const xPos = (210 - width) / 2;
      const yPos = 12;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", xPos, yPos, width, height, undefined, "FAST");
      pdf.save(`${payslipNumber}.pdf`);
    } catch { setError("Payslip PDF could not be generated."); }
    finally { setAction(""); }
  };

  const emailPayslip = async () => {
    if (!payroll) return;
    setAction("email"); setError(""); setMessage("");
    try {
      const response = await axiosInstance.post("/employee-salaries/payroll-payslips/email", { month: payrollMonth, employeeId: selectedId });
      setMessage(response.data?.message || "Payslip emailed successfully.");
    } catch (requestError) { setError(requestError.response?.data?.message || "Payslip could not be emailed."); }
    finally { setAction(""); }
  };

  return <main className="ps2-page">
    <section className="ps2-toolbar ps2-no-print">
      <div className="ps2-heading"><FiFileText /><div><h1>Payslip</h1><p>Approved employee salary statement</p></div></div>
      <div className="ps2-filters">
        <label>Payroll Month<input type="month" value={payrollMonth} onChange={event => setPayrollMonth(event.target.value)} /></label>
        <label>Employee<select value={selectedId} onChange={event => setSelectedId(event.target.value)} disabled={loading || !employees.length}><option value="">Select employee</option>{employees.map(item => <option key={employeeKey(item)} value={employeeKey(item)}>{item.user?.name || "Employee"}{item.user?.employeeId ? ` (${item.user.employeeId})` : ""}</option>)}</select></label>
        <label>Status<select value={payslipStatus} disabled><option>{payslipStatus}</option></select></label>
      </div>
      <div className="ps2-actions">
        <button className="primary" onClick={downloadPdf} disabled={!payroll || Boolean(action)}>
          <FiDownload />{action === "pdf" ? "Preparing..." : "Download PDF"}
        </button>
      </div>
    </section>

    {loading && <section className="ps2-state">Preparing approved payslip...</section>}
    {!loading && error && <section className="ps2-alert error ps2-no-print">{error}</section>}
    {!loading && message && <section className="ps2-alert success ps2-no-print">{message}</section>}
    {!loading && !error && !payroll && <section className="ps2-state">This month has no approved employee payslip.</section>}

    {!loading && payroll && <section className="ps2-layout">
      <article className="ps2-document" ref={documentRef}>
        <header className="ps2-doc-title"><div><h2>{isTillDatePayslip ? "Payslip Till Date" : "Payslip"} — {monthName(payrollMonth)}</h2><span>{payslipStatus}</span></div><p>Payslip No: <strong>{payslipNumber}</strong></p></header>
        <section className="ps2-company">
          <div className="ps2-company-name">{company.logo && <img src={company.logo} alt="Company logo" />}<div><h3>{company.companyName || company.name || "Company"}</h3><p>{company.companyCode || ""}</p></div></div>
          <dl><div><dt>Pay Date</dt><dd>{displayDate(payDate)}</dd></div><div><dt>Payment Mode</dt><dd>{payroll.paymentMode || "—"}</dd></div><div><dt>Bank Account</dt><dd>{payroll.bankAccount || "—"}</dd></div></dl>
        </section>
        <section className="ps2-employee">
          <div className="ps2-employee-identity"><span>Employee</span><strong>{payroll.user?.name || "—"}</strong><small>{payroll.user?.employeeId || payroll.user?.empId || payroll.user?.email || ""}</small></div>
          <div className="ps2-detail-list"><p><span>Department</span><strong>{payroll.department || payroll.user?.department?.name || payroll.user?.department || "—"}</strong></p><p><span>Job Role</span><strong>{payroll.designation || payroll.user?.jobRole?.name || payroll.user?.jobRole || "—"}</strong></p><p><span>Date of Joining</span><strong>{displayDate(payroll.dateOfJoining || payroll.user?.dateOfJoining)}</strong></p></div>
          <div className="ps2-detail-list"><p><span>Salary Structure</span><strong>{payroll.salaryStructure?.name || "—"}</strong></p><p><span>Structure Code</span><strong>{payroll.salaryStructure?.code || "—"}</strong></p><p><span>Pay Frequency</span><strong>{payroll.payFrequency || "Monthly"}</strong></p></div>
          <div className="ps2-detail-list"><p><span>Payment Mode</span><strong>{payroll.paymentMode || "—"}</strong></p><p><span>Bank Account</span><strong>{payroll.bankAccount || "—"}</strong></p><p><span>Payroll Status</span><strong>{payslipStatus}</strong></p></div>
        </section>
        <section className="ps2-breakdown">
          <div className="earning"><h3>Earnings</h3><table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>{earnings.map(item => <tr key={`${item.component?._id || item.component}-${item.code}`}><td>{item.name}<small>{item.code || ""}</small></td><td>{money(earningAmount(item))}</td></tr>)}<tr className="total"><td>{isTillDatePayslip ? "Full Monthly Earnings" : "Total Earnings"}</td><td>{money(payroll.assignedGross)}</td></tr>{isTillDatePayslip && <tr className="ps2-earned-row"><td>Earned Salary Till Date<small>Calculated through {displayDate(attendance.calculationCutoff)}</small></td><td>{money(payroll.monthlyGross)}</td></tr>}</tbody></table></div>
          <div className="deduction"><h3>Actual Deductions</h3><table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>{displayedAttendanceDeduction > 0 && <tr><td>Attendance Deduction<small>{`${attendance.lopDays || 0} absent day(s), ${attendance.halfDayDays || 0} half day(s)`}</small></td><td>{money(displayedAttendanceDeduction)}</td></tr>}{deductions.map(item => <tr key={`${item.component?._id || item.component}-${item.code}`}><td>{item.name}<small>{item.code || ""}</small></td><td>{money(deductionAmount(item))}</td></tr>)}{(payroll.adjustments || []).map(item => <tr key={item._id}><td>{item.reason}<small>{item.remarks || "One-time deduction"}</small></td><td>{money(item.amount)}</td></tr>)}<tr className="total"><td>Total Actual Deductions</td><td>{money(totalDeductions)}</td></tr></tbody></table></div>
        </section>
        <section className="ps2-final"><div><span>{isTillDatePayslip ? "Earned Salary Till Date" : "Total Earnings"}</span><strong>{money(displayedEarnings)}</strong></div><b>−</b><div><span>Actual Deductions</span><strong className="red">{money(totalDeductions)}</strong></div><b>=</b><div><span>{isTillDatePayslip ? "Net Salary Till Date" : "Net Salary"}</span><strong className="blue">{money(payroll.monthlyNet)}</strong></div></section>
      </article>

      <aside className="ps2-side ps2-no-print">
        <section><h3>Quick Summary</h3><dl><div><dt>Full Monthly Earnings</dt><dd>{money(payroll.assignedGross)}</dd></div><div><dt>{isTillDatePayslip ? "Earned Salary Till Date" : "Payable Earnings"}</dt><dd className="green">{money(payroll.monthlyGross)}</dd></div><div><dt>Actual Deductions</dt><dd className="red">{money(totalSalaryDeductions)}</dd></div><div className="net"><dt>{isTillDatePayslip ? "Net Salary Till Date" : "Net Salary"}</dt><dd>{money(payroll.monthlyNet)}</dd></div></dl></section>
        <section className="ps2-attendance-card">
          <h3>Attendance Summary</h3>
          <div className="ps2-attendance-card-month">{monthName(payrollMonth)}</div>
          <div className="ps2-attendance-list">
            <div className="item-total-days"><span>Total Working Days</span><strong>{attendance.workingDays || 0}</strong></div>
            <div className="item-working-days"><span>{isTillDatePayslip ? "Working Days (Till Date)" : "Working Days"}</span><strong>{isTillDatePayslip ? (attendance.eligibleWorkingDays ?? attendance.workingDays ?? 0) : (attendance.workingDays || 0)}</strong></div>
            <div className="item-present"><span>Present Days</span><strong>{attendance.presentDays || 0}</strong></div>
            <div className="item-halfday"><span>Half Days</span><strong>{attendance.halfDayDays || 0}</strong></div>
            <div className="item-paidleave"><span>Paid Leave</span><strong>{attendance.paidLeaveDays || 0}</strong></div>
            <div className="item-absent"><span>Absent Days</span><strong>{attendance.lopDays || 0}</strong></div>
            {isTillDatePayslip && <div className="cutoff"><span>Calculated Through</span><strong>{displayDate(attendance.calculationCutoff)}</strong></div>}
          </div>
        </section>
      </aside>
    </section>}
  </main>;
}
