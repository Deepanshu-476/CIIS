import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiDownload, FiFileText } from "react-icons/fi";
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

function numberToWords(num) {
  const value = Math.round(Number(num || 0) * 100) / 100;
  if (!value || isNaN(value) || value <= 0) return "Zero Only";
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  }
  const integerPart = Math.floor(value);
  const decimalPart = Math.round((value - integerPart) * 100);
  let str = inWords(integerPart) + " Rupees";
  if (decimalPart > 0) {
    str += " and " + inWords(decimalPart) + " Paise";
  }
  return str + " Only";
}

const resolveLogoUrl = (logo) => {
  if (!logo || typeof logo !== "string") return "";
  const clean = logo.trim();
  if (!clean) return "";
  if (clean.startsWith("data:") || clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${backendBase}${clean.startsWith("/") ? "" : "/"}${clean}`;
};

const urlToBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url || typeof url !== "string") return resolve(null);
    if (url.startsWith("data:")) return resolve(url);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
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
  const [backendCompany, setBackendCompany] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const company = useMemo(() => {
    const raw = backendCompany || storedCompany();
    return {
      ...raw,
      companyName: raw.companyName || raw.name || "Company",
      companyCode: raw.companyCode || raw.code || ""
    };
  }, [backendCompany]);

  const logoRaw = company.logoBase64 || company.logo || company.companyLogo || "";
  const logoUrl = useMemo(() => resolveLogoUrl(logoRaw), [logoRaw]);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

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
        if (response.data?.company) setBackendCompany(response.data.company);
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
  const displayedEarnings = isTillDatePayslip ? Number(payroll?.earnedTillDateGross ?? payroll?.monthlyGross ?? 0) : Number(payroll?.assignedGross || 0);
  const displayedNet = isTillDatePayslip ? Number(payroll?.earnedTillDateNet ?? payroll?.monthlyNet ?? 0) : Number(payroll?.monthlyNet || 0);
  const payslipNumber = payroll ? `PLS-${payrollMonth.replace("-", "")}-${(payroll.user?.employeeId || selectedId).toString().slice(-6).toUpperCase()}` : "—";
  const payDate = payroll?.approvedAt || payroll?.lockedAt || run?.approvedAt || run?.lockedAt || new Date(`${payrollMonth}-01T00:00:00`);
  const payslipStatus = payroll?.payrollStatus || run?.status || "Approved";

  const daysInMonthVal = attendance.daysInMonth || 31;
  const totalPaidDaysVal = Math.max(0, daysInMonthVal - Number(attendance.lopDays || 0));
  const weekOffVal = attendance.weekOffDays ?? Math.max(0, daysInMonthVal - (attendance.workingDays || 0));

  const downloadPdf = async () => {
    if (!documentRef.current || !payroll) return;
    setAction("pdf"); setError("");
    try {
      const logoImgTag = documentRef.current.querySelector(".ps2-company-name img");
      let originalSrc = "";
      if (logoImgTag && logoUrl && !logoFailed) {
        originalSrc = logoImgTag.src;
        const base64Data = await urlToBase64(logoUrl);
        if (base64Data) {
          logoImgTag.src = base64Data;
        }
      }

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(documentRef.current, { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: "#ffffff" });

      if (logoImgTag && originalSrc) {
        logoImgTag.src = originalSrc;
      }

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

  return <main className="ps2-page">
    <section className="ps2-toolbar ps2-no-print">
      <div className="ps2-heading"><FiFileText /><div><h1>Payslip</h1><p>Approved employee salary statement</p></div></div>
      <div className="ps2-filters">
        <label>Payroll Month<span className="ps2-date-input"><FiCalendar /><input type="month" value={payrollMonth} onChange={event => setPayrollMonth(event.target.value)} /></span></label>
        <label>Employee<select value={selectedId} onChange={event => setSelectedId(event.target.value)} disabled={loading || !employees.length}><option value="">Select employee</option>{employees.map(item => <option key={employeeKey(item)} value={employeeKey(item)}>{item.user?.name || "Employee"}{item.user?.employeeId ? ` (${item.user.employeeId})` : ""}</option>)}</select></label>
        <label>Status<select value={payslipStatus} disabled><option>{payslipStatus}</option></select></label>
      </div>
      <div className="ps2-actions">
        <button className="primary" onClick={downloadPdf} disabled={!payroll || Boolean(action)}>
          <FiDownload />{action === "pdf" ? "Preparing..." : "Download PDF"}
        </button>
      </div>
    </section>

    {loading && <section className="ps2-state">Preparing payslip...</section>}
    {!loading && error && <section className="ps2-alert error ps2-no-print">{error}</section>}
    {!loading && message && <section className="ps2-alert success ps2-no-print">{message}</section>}
    {!loading && !error && !payroll && <section className="ps2-state">This month has no approved employee payslip.</section>}

    {!loading && payroll && <section className="ps2-layout">
      <article className="ps2-document" ref={documentRef}>
          <header className="ps2-doc-title"><div><h2>{isTillDatePayslip ? "Payslip Till Date" : "Payslip"} — {monthName(payrollMonth)}</h2><span>{payslipStatus}</span></div><p>Payslip No: <strong>{payslipNumber}</strong></p></header>
          <section className="ps2-company">
            <div className="ps2-company-name">
              {logoUrl && !logoFailed ? (
                <img
                  src={logoUrl}
                  alt="Company logo"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="ps2-logo-badge">
                  {(company.companyName || company.name || "C").charAt(0).toUpperCase()}
                </div>
              )}
              <div><h3>{company.companyName || company.name || "Company"}</h3><p>{company.companyCode || ""}</p></div>
            </div>
            <dl><div><dt>Pay Date</dt><dd>{displayDate(payDate)}</dd></div><div><dt>Payment Mode</dt><dd>{payroll.paymentMode || "Bank Transfer"}</dd></div><div><dt>Account No.</dt><dd>{payroll.user?.accountNumber || "—"}</dd></div></dl>
          </section>
          <section className="ps2-employee">
            <div className="ps2-employee-identity"><span>Employee</span><strong>{payroll.user?.name || "—"}</strong><small>{payroll.user?.employeeId || payroll.user?.empId || payroll.user?.email || ""}</small></div>
            <div className="ps2-detail-list">
              <h5>Work Details</h5>
              <p><span>Department</span><strong>{payroll.department || payroll.user?.department?.name || payroll.user?.department || "—"}</strong></p>
              <p><span>Job Role</span><strong>{payroll.designation || payroll.user?.jobRole?.name || payroll.user?.jobRole || "—"}</strong></p>
              <p><span>Date of Joining</span><strong>{displayDate(payroll.dateOfJoining || payroll.user?.dateOfJoining)}</strong></p>
              <p><span>Mobile</span><strong>{payroll.user?.phone || "—"}</strong></p>
            </div>
            <div className="ps2-detail-list">
              <h5>Identity & Structure</h5>
              <p><span>PAN Number</span><strong>{payroll.user?.panCard || payroll.user?.panNo || payroll.user?.pan || "—"}</strong></p>
              <p><span>Aadhaar Number</span><strong>{payroll.user?.aadhaar || payroll.user?.aadhar || payroll.user?.aadharCard || payroll.user?.aadharNo || payroll.user?.aadhaarNo || "—"}</strong></p>
              <p><span>Salary Structure</span><strong>{payroll.salaryStructure?.name || "—"} ({payroll.salaryStructure?.code || ""})</strong></p>
              <p><span>Pay Frequency</span><strong>{payroll.payFrequency || "Monthly"}</strong></p>
            </div>
            <div className="ps2-detail-list">
              <h5>Banking Details</h5>
              <p><span>Bank Name</span><strong>{payroll.user?.bankName || "—"}</strong></p>
              <p><span>Account Holder</span><strong>{payroll.user?.bankHolderName || payroll.user?.name || "—"}</strong></p>
              <p><span>Account Number</span><strong>{payroll.user?.accountNumber || "—"}</strong></p>
              <p><span>IFSC Code</span><strong>{payroll.user?.ifsc || "—"}</strong></p>
            </div>
          </section>
          <section className="ps2-breakdown">
            <div className="earning"><h3>Earnings</h3><table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>{earnings.map(item => <tr key={`${item.component?._id || item.component}-${item.code}`}><td>{item.name}<small>{item.code || ""}</small></td><td>{money(earningAmount(item))}</td></tr>)}<tr className="total"><td>{isTillDatePayslip ? "Full Monthly Earnings" : "Total Earnings"}</td><td>{money(payroll.assignedGross)}</td></tr>{isTillDatePayslip && <tr className="ps2-earned-row"><td>Earned Salary Till Date<small>Calculated through {displayDate(attendance.calculationCutoff)}</small></td><td>{money(payroll.earnedTillDateGross ?? payroll.monthlyGross)}</td></tr>}</tbody></table></div>
            <div className="deduction"><h3>Actual Deductions</h3><table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>{displayedAttendanceDeduction > 0 && <tr><td>Attendance Deduction<small>{`${attendance.lopDays || 0} absent day(s), ${attendance.halfDayDays || 0} half day(s)`}</small></td><td>{money(displayedAttendanceDeduction)}</td></tr>}{deductions.map(item => <tr key={`${item.component?._id || item.component}-${item.code}`}><td>{item.name}<small>{item.code || ""}</small></td><td>{money(deductionAmount(item))}</td></tr>)}{(payroll.adjustments || []).map(item => <tr key={item._id}><td>{item.reason}<small>{item.remarks || "One-time deduction"}</small></td><td>{money(item.amount)}</td></tr>)}<tr className="total"><td>Total Actual Deductions</td><td>{money(totalDeductions)}</td></tr></tbody></table></div>
          </section>
          <section className="ps2-final-block">
            <div className="ps2-final">
              <div><span>{isTillDatePayslip ? "Earned Salary Till Date" : "Total Earnings"}</span><strong>{money(displayedEarnings)}</strong></div>
              <b>−</b>
              <div><span>Actual Deductions</span><strong className="red">{money(totalDeductions)}</strong></div>
              <b>=</b>
              <div><span>{isTillDatePayslip ? "Net Salary Till Date" : "Net Salary"}</span><strong className="blue">{money(displayedNet)}</strong></div>
            </div>
            <div className="ps2-net-words">
              <span>Amount in Words:</span> <strong>Rs. {numberToWords(displayedNet)}</strong>
            </div>
          </section>
        </article>

        <aside className="ps2-side ps2-no-print">
          <section><h3>Quick Summary</h3><dl><div><dt>Full Monthly Earnings</dt><dd>{money(payroll.assignedGross)}</dd></div><div><dt>{isTillDatePayslip ? "Earned Salary Till Date" : "Payable Earnings"}</dt><dd className="green">{money(payroll.earnedTillDateGross ?? payroll.monthlyGross)}</dd></div><div><dt>Actual Deductions</dt><dd className="red">{money(totalSalaryDeductions)}</dd></div><div className="net"><dt>{isTillDatePayslip ? "Net Salary Till Date" : "Net Salary"}</dt><dd>{money(displayedNet)}</dd></div></dl></section>
          <section className="ps2-attendance-card">
            <h3>Attendance Summary</h3>
            <div className="ps2-attendance-card-month">{monthName(payrollMonth)}</div>
            <div className="ps2-attendance-list">
              <div className="item-total-days"><span>Month Total Days</span><strong>{daysInMonthVal}</strong></div>
              <div className="item-working-days"><span>Working Days</span><strong>{attendance.workingDays || 0}</strong></div>
              <div className="item-weekoff"><span>Weekly Off</span><strong>{weekOffVal}</strong></div>
              <div className="item-present"><span>Present Days</span><strong>{attendance.presentDays || 0}</strong></div>
              <div className="item-halfday"><span>Half Days</span><strong>{attendance.halfDayDays || 0}</strong></div>
              <div className="item-paidleave"><span>Paid Leave</span><strong>{attendance.paidLeaveDays || 0}</strong></div>
              <div className="item-absent"><span>LWP / Absents</span><strong>{attendance.lopDays || 0}</strong></div>
              <div className="item-paid-days"><span>Total Paid Days</span><strong>{totalPaidDaysVal}</strong></div>
              {isTillDatePayslip && <div className="cutoff"><span>Calculated Through</span><strong>{displayDate(attendance.calculationCutoff)}</strong></div>}
            </div>
          </section>
        </aside>
      </section>}
  </main>;
}
