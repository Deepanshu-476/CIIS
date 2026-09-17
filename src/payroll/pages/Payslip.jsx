import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiDownload, FiFileText } from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/PayslipModern.css";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);

const displayDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
};

const displayPayDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const asOfDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
};

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
      companyName: raw.companyName || raw.name || "CAREER INFOWIS IT SOLUTION PRIVATE LIMITED",
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
  const isTillDatePayslip = Number(attendance.futureDays || 0) > 0 || Boolean(payroll?.earnedTillDateGross && payroll?.earnedTillDateGross !== payroll?.monthlyGross);
  const earningAmount = (item) => item.amount ?? item.payrollAmount ?? 0;
  const deductionAmount = (item) => item.payrollAmount ?? item.amount ?? 0;
  const totalSalaryDeductions = Number(payroll?.totalDeductions || 0) + Number(payroll?.adjustmentDeductions || 0);
  const displayedAttendanceDeduction = Number(payroll?.attendanceDeduction || 0);
  const totalDeductions = totalSalaryDeductions;
  const displayedEarnings = isTillDatePayslip
    ? Number(payroll?.earnedTillDateGross ?? payroll?.monthlyGross ?? 0)
    : Number(payroll?.monthlyGross ?? payroll?.payableGross ?? payroll?.assignedGross ?? 0);
  const displayedNet = isTillDatePayslip
    ? Number(payroll?.earnedTillDateNet ?? payroll?.monthlyNet ?? 0)
    : Number(payroll?.monthlyNet ?? 0);
  const payslipNumber = payroll ? `PLS-${payrollMonth.replace("-", "")}-${(payroll.user?.employeeId || selectedId).toString().slice(-6).toUpperCase()}` : "—";
  const payDate = payroll?.approvedAt || payroll?.lockedAt || run?.approvedAt || run?.lockedAt || new Date(`${payrollMonth}-01T00:00:00`);
  const payslipStatus = payroll?.payrollStatus || run?.status || "Approved";

  const daysInMonthVal = attendance.daysInMonth || 30;
  const totalPaidDaysVal = attendance.payableDays !== undefined ? Number(attendance.payableDays) : Math.max(0, daysInMonthVal - Number(attendance.lopDays || 0));
  const weekOffVal = attendance.paidWeekOffDays ?? attendance.weekOffDays ?? Math.max(0, daysInMonthVal - (attendance.workingDays || 0));

  const downloadPdf = async () => {
    if (!documentRef.current || !payroll) return;
    setAction("pdf"); setError("");
    try {
      const logoImgTag = documentRef.current.querySelector(".ps-header-logo-card img");
      let originalSrc = "";
      const currentSrc = logoImgTag?.src || logoUrl || "/logoo.png";
      if (logoImgTag && currentSrc) {
        originalSrc = logoImgTag.src;
        const base64Data = await urlToBase64(currentSrc);
        if (base64Data) {
          logoImgTag.src = base64Data;
        }
      }

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      if (logoImgTag && originalSrc) {
        logoImgTag.src = originalSrc;
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 8;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);

      let renderWidth = availableWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }

      const xPos = (pdfWidth - renderWidth) / 2;
      const yPos = margin;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", xPos, yPos, renderWidth, renderHeight, undefined, "FAST");
      pdf.save(`${payslipNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Payslip PDF could not be generated.");
    } finally {
      setAction("");
    }
  };

  return (
    <main className="ps2-page">
      {/* Top Filter Toolbar */}
      <section className="ps2-toolbar ps2-no-print">
        <div className="ps2-heading">
          <FiFileText />
          <div>
            <h1>Payslip</h1>
            <p>Approved employee salary statement</p>
          </div>
        </div>
        <div className="ps2-filters">
          <label>
            Payroll Month
            <span className="ps2-date-input">
              <FiCalendar />
              <input type="month" value={payrollMonth} onChange={event => setPayrollMonth(event.target.value)} />
            </span>
          </label>
          <label>
            Employee
            <select value={selectedId} onChange={event => setSelectedId(event.target.value)} disabled={loading || !employees.length}>
              <option value="">Select employee</option>
              {employees.map(item => (
                <option key={employeeKey(item)} value={employeeKey(item)}>
                  {item.user?.name || "Employee"}{item.user?.employeeId ? ` (${item.user.employeeId})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={payslipStatus} disabled>
              <option>{payslipStatus}</option>
            </select>
          </label>
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

      {!loading && payroll && (
        <section className="ps-doc-container">
          <article className="ps-modern-document" ref={documentRef}>
            {/* 1. Dark Navy Header */}
            <header className="ps-modern-header">
              <div className="ps-header-left">
                <div className="ps-header-logo-card">
                  {logoUrl && !logoFailed ? (
                    <img
                      src={logoUrl}
                      alt="Company logo"
                      onError={() => setLogoFailed(true)}
                      className="ps-header-logo-img"
                    />
                  ) : (
                    <img
                      src="/logoo.png"
                      alt="CIIS Network"
                      className="ps-header-logo-img"
                    />
                  )}
                </div>
                <div className="ps-header-company-info">
                  <h2 className="ps-header-company-title">
                    {company.companyName || company.name || "CAREER INFOWIS IT SOLUTION PRIVATE LIMITED"}
                  </h2>
                  <p className="ps-header-statement">Employee Salary Statement</p>
                </div>
              </div>
              <div className="ps-header-right">
                <h1 className="ps-header-payslip-title">PAYSLIP</h1>
                <div className="ps-header-month">{monthName(payrollMonth)}</div>
                <div className="ps-header-slip-num">{payslipNumber}</div>
              </div>
            </header>

            {/* 2. Employee Summary Strip */}
            <section className="ps-emp-summary-strip">
              <div className="ps-emp-strip-col">
                <span className="ps-strip-label ps-strip-emp-label">EMPLOYEE</span>
                <span className="ps-strip-emp-name">{payroll.user?.name || "—"}</span>
                <span className="ps-strip-emp-id">{payroll.user?.employeeId || payroll.user?.empId || selectedId}</span>
              </div>
              <div className="ps-emp-strip-col">
                <span className="ps-strip-label">DEPARTMENT</span>
                <span className="ps-strip-val">{payroll.department || payroll.user?.department?.name || payroll.user?.department || "—"}</span>
              </div>
              <div className="ps-emp-strip-col">
                <span className="ps-strip-label">JOB ROLE</span>
                <span className="ps-strip-val">{payroll.designation || payroll.user?.jobRole?.name || payroll.user?.jobRole || "User"}</span>
              </div>
              <div className="ps-emp-strip-col">
                <span className="ps-strip-label">PAY DATE</span>
                <span className="ps-strip-val">{displayPayDate(payDate)}</span>
              </div>
              <div className="ps-emp-strip-col">
                <span className="ps-strip-label">PAYMENT MODE</span>
                <span className="ps-strip-val">{payroll.paymentMode || "Bank Transfer"}</span>
              </div>
            </section>

            {/* 3. Three Detail Cards */}
            <section className="ps-three-cards-grid">
              {/* Employment Details */}
              <div className="ps-info-card">
                <h3 className="ps-info-card-header">EMPLOYMENT DETAILS</h3>
                <div className="ps-info-card-body">
                  <div className="ps-info-row">
                    <span className="ps-info-label">Date of Joining</span>
                    <span className="ps-info-val">{displayDate(payroll.dateOfJoining || payroll.user?.dateOfJoining)}</span>
                  </div>
                  <div className="ps-info-row">
                    <span className="ps-info-label">Mobile</span>
                    <span className="ps-info-val">{payroll.user?.phone || "—"}</span>
                  </div>
                  <div className="ps-info-row">
                    <span className="ps-info-label">Pay Frequency</span>
                    <span className="ps-info-val">{payroll.payFrequency || "Monthly"}</span>
                  </div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="ps-info-card">
                <h3 className="ps-info-card-header">IDENTITY DETAILS</h3>
                <div className="ps-info-card-body">
                  <div className="ps-info-row">
                    <span className="ps-info-label">PAN Number</span>
                    <span className="ps-info-val">{payroll.user?.panCard || payroll.user?.panNo || payroll.user?.pan || "—"}</span>
                  </div>
                  <div className="ps-info-row">
                    <span className="ps-info-label">Aadhaar Number</span>
                    <span className="ps-info-val">{payroll.user?.aadhaar || payroll.user?.aadhar || payroll.user?.aadharCard || payroll.user?.aadharNo || payroll.user?.aadhaarNo || "—"}</span>
                  </div>
                  <div className="ps-info-row">
                    <span className="ps-info-label">Employee ID</span>
                    <span className="ps-info-val">{payroll.user?.employeeId || payroll.user?.empId || selectedId}</span>
                  </div>
                </div>
              </div>

              {/* Banking Details */}
              <div className="ps-info-card">
                <h3 className="ps-info-card-header">BANKING DETAILS</h3>
                <div className="ps-info-card-body">
                  <div className="ps-info-row">
                    <span className="ps-info-label">Bank Name</span>
                    <span className="ps-info-val">{payroll.user?.bankName || "—"}</span>
                  </div>
                  <div className="ps-info-row">
                    <span className="ps-info-label">Account Holder</span>
                    <span className="ps-info-val">{payroll.user?.bankHolderName || payroll.user?.name || "—"}</span>
                  </div>
                  <div className="ps-info-row">
                    <span className="ps-info-label">Account Number</span>
                    <span className="ps-info-val">{payroll.user?.accountNumber || "—"}</span>
                  </div>
                  <div className="ps-info-row">
                    <span className="ps-info-label">IFSC Code</span>
                    <span className="ps-info-val">{payroll.user?.ifsc || "—"}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Attendance Summary Card */}
            <section className="ps-attendance-card-block">
              <div className="ps-attendance-banner">
                <FiCalendar className="ps-attendance-cal-ico" />
                <span>ATTENDANCE SUMMARY</span>
              </div>
              <div className="ps-attendance-grid-body">
                <div className="ps-attendance-col">
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">Month Total Days</span>
                    <span className="ps-att-stat-val">{daysInMonthVal}</span>
                  </div>
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">Working Days</span>
                    <span className="ps-att-stat-val">{attendance.workingDays || 0}</span>
                  </div>
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">Weekly Off</span>
                    <span className="ps-att-stat-val">{weekOffVal}</span>
                  </div>
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">Present Days</span>
                    <span className="ps-att-stat-val">{attendance.presentDays || 0}</span>
                  </div>
                </div>
                <div className="ps-attendance-col">
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">Half Days</span>
                    <span className="ps-att-stat-val">{attendance.halfDayDays || 0}</span>
                  </div>
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">Paid Leave</span>
                    <span className="ps-att-stat-val">{attendance.paidLeaveDays || 0}</span>
                  </div>
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">LWP / Absents</span>
                    <span className="ps-att-stat-val">{attendance.lopDays || 0}</span>
                  </div>
                  <div className="ps-att-stat-row">
                    <span className="ps-att-stat-label">Total Paid Days</span>
                    <span className="ps-att-stat-val">{totalPaidDaysVal}</span>
                  </div>
                </div>
              </div>
              <div className="ps-attendance-cutoff-footer">
                <div className="ps-cutoff-pill">
                  <FiCalendar className="ps-cutoff-ico" />
                  <span>Calculated Through : {attendance.calculationCutoff ? displayDate(attendance.calculationCutoff) : displayDate(payDate)}</span>
                </div>
              </div>
            </section>

            {/* 5. Earnings & Actual Deductions Section */}
            <section className="ps-breakdown-section">
              {/* EARNINGS */}
              <div className="ps-panel-box ps-earnings-panel">
                <div className="ps-panel-heading">
                  <span>EARNINGS</span>
                </div>
                <div className="ps-panel-table-head">
                  <span className="ps-th-component">COMPONENT</span>
                  <span className="ps-th-amount">AMOUNT</span>
                </div>
                <div className="ps-panel-content">
                  <div className="ps-components-list">
                    {earnings.map(item => (
                      <div className="ps-component-item" key={`${item.component?._id || item.component}-${item.code}`}>
                        <div className="ps-component-meta">
                          <span className="ps-comp-name">{item.name}</span>
                          {item.code && <span className="ps-comp-code">{item.code}</span>}
                        </div>
                        <span className="ps-comp-amount">{money(earningAmount(item))}</span>
                      </div>
                    ))}
                  </div>

                  <div className="ps-monthly-gross-container">
                    <div className="ps-monthly-gross-line">
                      <span className="ps-gross-title">Monthly Gross Salary</span>
                      <span className="ps-gross-amount">{money(payroll.monthlyGross ?? payroll.assignedGross)}</span>
                    </div>
                  </div>
                </div>

                <div className="ps-panel-highlight-box ps-earnings-highlight">
                  <div className="ps-hl-meta">
                    <span className="ps-hl-main-text">{isTillDatePayslip ? "Gross Salary Earned to Date" : "Gross Salary Earned to Date"}</span>
                    <span className="ps-hl-sub-text">
                      {isTillDatePayslip ? `As of ${asOfDate(attendance.calculationCutoff || payDate)}` : `As of ${asOfDate(payDate)}`}
                    </span>
                  </div>
                  <span className="ps-hl-val">{money(displayedEarnings)}</span>
                </div>
              </div>

              {/* ACTUAL DEDUCTIONS */}
              <div className="ps-panel-box ps-deductions-panel">
                <div className="ps-panel-heading">
                  <span>ACTUAL DEDUCTIONS</span>
                </div>
                <div className="ps-panel-table-head">
                  <span className="ps-th-component">COMPONENT</span>
                  <span className="ps-th-amount">AMOUNT</span>
                </div>
                <div className="ps-panel-content">
                  <div className="ps-components-list">
                    {displayedAttendanceDeduction > 0 && (
                      <div className="ps-component-item">
                        <div className="ps-component-meta">
                          <span className="ps-comp-name">ATTENDANCE DEDUCTION</span>
                          <span className="ps-comp-code">{`${attendance.lopDays || 0} absent, ${attendance.halfDayDays || 0} half day`}</span>
                        </div>
                        <span className="ps-comp-amount">{money(displayedAttendanceDeduction)}</span>
                      </div>
                    )}
                    {deductions.map(item => (
                      <div className="ps-component-item" key={`${item.component?._id || item.component}-${item.code}`}>
                        <div className="ps-component-meta">
                          <span className="ps-comp-name">{item.name}</span>
                          {item.code && <span className="ps-comp-code">{item.code}</span>}
                        </div>
                        <span className="ps-comp-amount">{money(deductionAmount(item))}</span>
                      </div>
                    ))}
                    {(payroll.adjustments || []).map(item => (
                      <div className="ps-component-item" key={item._id}>
                        <div className="ps-component-meta">
                          <span className="ps-comp-name">{item.reason || "Adjustment"}</span>
                          <span className="ps-comp-code">{item.remarks || "One-time deduction"}</span>
                        </div>
                        <span className="ps-comp-amount">{money(item.amount)}</span>
                      </div>
                    ))}
                    {!displayedAttendanceDeduction && !deductions.length && !(payroll.adjustments || []).length && (
                      <div className="ps-no-deductions-msg">No deductions for this period</div>
                    )}
                  </div>
                </div>

                <div className="ps-panel-highlight-box ps-deductions-highlight">
                  <div className="ps-hl-meta">
                    <span className="ps-hl-main-text">Total Actual Deductions</span>
                  </div>
                  <span className="ps-hl-val">{money(totalDeductions)}</span>
                </div>
              </div>
            </section>

            {/* 6. Three Metrics Summary Strip */}
            <section className="ps-three-metrics-strip">
              <div className="ps-metric-item">
                <span className="ps-metric-label">{isTillDatePayslip ? "GROSS SALARY EARNED TO DATE" : "TOTAL GROSS SALARY"}</span>
                <span className="ps-metric-val">{money(displayedEarnings)}</span>
              </div>
              <div className="ps-metric-divider" />
              <div className="ps-metric-item">
                <span className="ps-metric-label">ACTUAL DEDUCTIONS</span>
                <span className="ps-metric-val ps-text-red">{money(totalDeductions)}</span>
              </div>
              <div className="ps-metric-divider" />
              <div className="ps-metric-item">
                <span className="ps-metric-label">{isTillDatePayslip ? "NET SALARY TILL DATE" : "NET SALARY"}</span>
                <span className="ps-metric-val ps-text-blue">{money(displayedNet)}</span>
              </div>
            </section>

            {/* 7. Amount in Words Box */}
            <section className="ps-words-strip">
              <div className="ps-words-left">
                <span className="ps-words-title">Amount in Words:</span>
                <span className="ps-words-text">Rs. {numberToWords(displayedNet)}</span>
              </div>
              <span className="ps-badge-confidential">CONFIDENTIAL</span>
            </section>

            {/* 8. Footer */}
            <footer className="ps-modern-footer">
              <span className="ps-footer-left">Calculated through {displayDate(attendance.calculationCutoff || payDate)}</span>
              <span className="ps-footer-right">Computer-generated payslip - no signature or stamp required.</span>
            </footer>
          </article>
        </section>
      )}
    </main>
  );
}

