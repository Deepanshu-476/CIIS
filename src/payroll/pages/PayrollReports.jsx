import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiBarChart2, FiCalendar, FiChevronRight, FiCreditCard, FiEye, FiFileText, FiLayers, FiRefreshCw, FiTrendingDown, FiTrendingUp, FiUsers } from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/PayrollReports.css";
import "../styles/PayrollReportInsights.css";
import "../styles/PayrollReportCards.css";

const REPORTS = ["Payroll Summary", "Employee Payroll Report", "Earnings Report", "Deductions Report", "Bank Transfer Report"];
const REPORT_DESCRIPTIONS = {
  "Payroll Summary": "Department-wise payroll totals",
  "Employee Payroll Report": "Employee salary details",
  "Earnings Report": "Gross and payable earnings",
  "Deductions Report": "Attendance and salary deductions",
  "Bank Transfer Report": "Approved bank payment data"
};
const money = value => `INR ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);
const monthLabel = value => value ? new Date(`${value}-01T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" }) : "";
const employeeKey = item => String(item?.user?._id || item?.user || item?._id || "");
const employeeName = item => item?.user?.name || "Employee";
const employeeCode = item => item?.user?.employeeId || item?.user?.empId || "—";
const departmentName = item => item?.department || item?.user?.department?.name || item?.user?.department || "Unassigned";
const roleName = item => item?.designation || item?.user?.jobRole?.name || item?.user?.jobRole || "—";
const componentAmount = item => Number(item?.payrollAmount ?? item?.amount ?? 0);
const componentMatches = (item, terms) => terms.some(term => `${item?.code || ""} ${item?.name || ""}`.toLowerCase().includes(term));
const componentTotal = (employee, terms, type) => (employee?.components || []).filter(item => (!type || item.type === type) && componentMatches(item, terms)).reduce((sum, item) => sum + componentAmount(item), 0);
const salaryDeductions = employee => Number(employee?.salaryDeductions ?? (Number(employee?.totalDeductions || 0) - Number(employee?.attendanceDeduction || 0))) + Number(employee?.adjustmentDeductions || 0);
const allDeductions = employee => Number(employee?.totalDeductions || 0) + Number(employee?.adjustmentDeductions || 0);

export default function PayrollReports() {
  const reportRef = useRef(null);
  const [filters, setFilters] = useState({ reportType: REPORTS[0], month: currentMonth(), payGroup: "All", department: "All", employee: "All", status: "All" });
  const [applied, setApplied] = useState(filters);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    axiosInstance.get("/employee-salaries/payroll-payslips", { params: { month: applied.month }, noCache: true })
      .then(response => { if (active) setRun(response.data?.run || null); })
      .catch(requestError => { if (active) { setRun(null); setError(requestError.response?.data?.message || "Approved payroll report could not be loaded."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied.month]);

  const sourceEmployees = run?.employees || [];
  const departments = useMemo(() => [...new Set(sourceEmployees.map(departmentName))].sort(), [sourceEmployees]);
  const payGroups = useMemo(() => [...new Set(sourceEmployees.map(item => item.payFrequency || "Monthly"))].sort(), [sourceEmployees]);
  const filtered = useMemo(() => sourceEmployees.filter(item => {
    const status = item.payrollStatus || run?.status || "";
    return (applied.department === "All" || departmentName(item) === applied.department)
      && (applied.payGroup === "All" || (item.payFrequency || "Monthly") === applied.payGroup)
      && (applied.employee === "All" || employeeKey(item) === applied.employee)
      && (applied.status === "All" || status === applied.status);
  }), [sourceEmployees, applied, run]);

  const totals = useMemo(() => filtered.reduce((result, item) => ({
    employees: result.employees + 1,
    earnings: result.earnings + Number(item.monthlyGross || 0),
    deductions: result.deductions + allDeductions(item),
    net: result.net + Number(item.monthlyNet || 0)
  }), { employees: 0, earnings: 0, deductions: 0, net: 0 }), [filtered]);

  const summaryRows = useMemo(() => Object.values(filtered.reduce((map, item) => {
    const department = departmentName(item);
    map[department] ||= { department, employees: 0, earnings: 0, deductions: 0, net: 0 };
    map[department].employees += 1; map[department].earnings += Number(item.monthlyGross || 0); map[department].deductions += allDeductions(item); map[department].net += Number(item.monthlyNet || 0);
    return map;
  }, {})), [filtered]);

  const statutory = (item, kind) => {
    const terms = { pf: ["pf", "provident"], esi: ["esi", "state insurance"], pt: ["professional tax", "pt"], tds: ["tds", "income tax"] }[kind];
    return componentTotal(item, terms, "deduction");
  };

  const reportRows = useMemo(() => {
    if (applied.reportType === "Payroll Summary") return summaryRows.map(row => ({ Department: row.department, Employees: row.employees, Earnings: row.earnings, Deductions: row.deductions, "Net Payroll": row.net }));
    if (applied.reportType === "Earnings Report") return filtered.map(item => ({ Employee: employeeName(item), "Employee ID": employeeCode(item), Department: departmentName(item), "Gross Salary": Number(item.assignedGross || 0), "Payable Earnings": Number(item.monthlyGross || 0) }));
    if (applied.reportType === "Deductions Report") return filtered.map(item => ({ Employee: employeeName(item), "Employee ID": employeeCode(item), "Attendance Impact": Number(item.attendanceDeduction || 0), "Salary Deductions": salaryDeductions(item), "Total Actual Deductions": allDeductions(item) }));
    if (applied.reportType === "Bank Transfer Report") return filtered.map(item => ({ Employee: employeeName(item), "Employee ID": employeeCode(item), "Bank Name": item.user?.bankName || "—", "Account Number": item.user?.accountNumber || item.bankAccount || "—", IFSC: item.user?.ifsc || "—", "Net Salary": Number(item.monthlyNet || 0), "Payroll Status": item.payrollStatus || run?.status || "—" }));
    return filtered.map(item => ({ Employee: employeeName(item), "Employee ID": employeeCode(item), Department: departmentName(item), "Job Role": roleName(item), "Gross Salary": Number(item.assignedGross || 0), "Total Earnings": Number(item.monthlyGross || 0), PF: statutory(item, "pf"), ESI: statutory(item, "esi"), PT: statutory(item, "pt"), "Other Deductions": Math.max(0, allDeductions(item) - statutory(item, "pf") - statutory(item, "esi") - statutory(item, "pt")), "Net Salary": Number(item.monthlyNet || 0), Status: item.payrollStatus || run?.status || "—" }));
  }, [applied.reportType, filtered, summaryRows, run]);

  const exportPdf = async () => {
    if (!reportRef.current) return; setExporting("pdf"); setError("");
    try { const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]); const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#fff" }); const pdf = new jsPDF("l", "mm", "a4"); const width = 277; const height = Math.min(190, canvas.height * width / canvas.width); pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, width, height); pdf.save(`${applied.reportType}-${applied.month}.pdf`); }
    catch { setError("PDF report could not be exported."); } finally { setExporting(""); }
  };
  const reset = () => { const next = { reportType: REPORTS[0], month: currentMonth(), payGroup: "All", department: "All", employee: "All", status: "All" }; setFilters(next); setApplied(next); };
  const isMoneyColumn = key => /salary|earnings|deduction|payroll|wage|\bpf\b|\besi\b|\bpt\b|tds/i.test(key) && key !== "Employees";
  const openReport = reportType => { const next = { ...filters, reportType }; setFilters(next); setApplied({ ...applied, reportType }); };
  const earningsComparisonTotal = totals.earnings + totals.deductions;
  const earningsPercent = earningsComparisonTotal ? totals.earnings / earningsComparisonTotal * 100 : 0;
  const deductionsPercent = earningsComparisonTotal ? totals.deductions / earningsComparisonTotal * 100 : 0;
  const topEmployees = [...filtered].sort((a, b) => Number(b.monthlyNet || 0) - Number(a.monthlyNet || 0)).slice(0, 5);
  const structureRows = Object.values(filtered.reduce((result, item) => {
    const name = item.salaryStructure?.name || "Not Assigned";
    const code = item.salaryStructure?.code || "";
    const key = `${name}:${code}`;
    result[key] ||= { name, code, employees: 0 };
    result[key].employees += 1;
    return result;
  }, {})).sort((a, b) => b.employees - a.employees).slice(0, 5);

  return <main className="pr-page">
    <header className="pr-header-card pr-no-print">
      <div className="pr-heading">
        <FiBarChart2 />
        <div>
          <h1>Payroll Reports</h1>
          <p>Approved and locked payroll records only</p>
        </div>
      </div>
    </header>
    <section className="pr-filters pr-no-print">
      <label>Report Type<select value={filters.reportType} onChange={event => setFilters({ ...filters, reportType: event.target.value })}>{REPORTS.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Payroll Month<span className="pr-date-input"><FiCalendar /><input type="month" value={filters.month} onChange={event => setFilters({ ...filters, month: event.target.value })} /></span></label>
      <label>Pay Frequency<select value={filters.payGroup} onChange={event => setFilters({ ...filters, payGroup: event.target.value })}><option>All</option>{payGroups.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Department<select value={filters.department} onChange={event => setFilters({ ...filters, department: event.target.value })}><option>All</option>{departments.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Employee<select value={filters.employee} onChange={event => setFilters({ ...filters, employee: event.target.value })}><option value="All">All Employees</option>{sourceEmployees.map(item => <option key={employeeKey(item)} value={employeeKey(item)}>{employeeName(item)} ({employeeCode(item)})</option>)}</select></label>
      <label>Status<select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option>All</option><option>Approved</option><option>Locked</option></select></label>
      <div className="pr-filter-actions"><button onClick={reset}><FiRefreshCw />Reset</button><button className="primary" onClick={() => setApplied(filters)}><FiEye />View Report</button></div>
    </section>
    {loading && <section className="pr-state">Loading approved payroll report...</section>}
    {!loading && error && <section className="pr-alert pr-no-print">{error}</section>}
    {!loading && !error && <>
      <section className="pr-cards">
        <article><i><FiUsers /></i><div><span>Total Employees</span><strong>{totals.employees}</strong><small>Employees</small></div></article>
        <article className="green"><i><FiTrendingUp /></i><div><span>Total Earnings</span><strong>{money(totals.earnings)}</strong></div></article>
        <article className="red"><i><FiTrendingDown /></i><div><span>Total Deductions</span><strong>{money(totals.deductions)}</strong></div></article>
        <article className="blue"><i><FiCreditCard /></i><div><span>Net Payroll</span><strong>{money(totals.net)}</strong></div></article>
        <article className="amber"><i><FiBarChart2 /></i><div><span>Average Net Salary</span><strong>{money(totals.employees ? totals.net / totals.employees : 0)}</strong></div></article>
      </section>
      <section className="pr-content-grid">
      <div className="pr-main-column">
      <section className="pr-report" ref={reportRef}>
        <div className="pr-report-head"><div><h2>{applied.reportType} — {monthLabel(applied.month)}</h2><p>{filtered.length} approved/locked employee record(s)</p></div><div className="pr-exports pr-no-print"><button onClick={exportPdf} disabled={!reportRows.length || exporting}><FiFileText />{exporting === "pdf" ? "Exporting..." : "Export PDF"}</button></div></div>
        <div className="pr-table-wrap"><table><thead><tr><th>#</th>{Object.keys(reportRows[0] || {}).map(key => <th key={key}>{key}</th>)}</tr></thead><tbody>{reportRows.map((row, index) => <tr key={`${row["Employee ID"] || row.Department}-${index}`}><td>{index + 1}</td>{Object.entries(row).map(([key, value]) => <td key={key}>{isMoneyColumn(key) ? money(value) : value}</td>)}</tr>)}{!reportRows.length && <tr><td colSpan="20" className="empty">No approved or locked payroll data matches these filters.</td></tr>}</tbody></table></div>
        <footer>Reports use saved Approved/Locked payroll snapshots. Amounts are in INR.</footer>
      </section>
      <section className="pr-report-insights pr-no-print">
        <article className="pr-comparison-card">
          <header><span><FiTrendingUp /></span><div><h3>Earnings vs Deductions</h3><p>Payroll amount distribution</p></div></header>
          <div className="pr-comparison-body"><div className="pr-report-donut" style={{ background: `conic-gradient(#2fbd6b 0 ${earningsPercent}%, #ef3e50 ${earningsPercent}% 100%)` }}><div><strong>{earningsPercent.toFixed(1)}%</strong><small>Earnings</small></div></div><div className="pr-comparison-values"><div className="earning"><span><i />Total Earnings</span><strong>{money(totals.earnings)}</strong><small>{earningsPercent.toFixed(1)}% of combined amount</small></div><div className="deduction"><span><i />Total Deductions</span><strong>{money(totals.deductions)}</strong><small>{deductionsPercent.toFixed(1)}% of combined amount</small></div></div></div>
        </article>
        <article className="pr-ranking-card">
          <header><span><FiBarChart2 /></span><div><h3>Top 5 Net Salaries</h3><p>Highest payable employees</p></div></header>
          <ol>{topEmployees.map((item, index) => <li key={employeeKey(item)}><b>{index + 1}</b><span><strong>{employeeName(item)}</strong><small>{departmentName(item)}</small></span><em>{money(item.monthlyNet)}</em></li>)}{!topEmployees.length && <li className="empty">No employee data available.</li>}</ol>
        </article>
        <article className="pr-structure-card">
          <header><span><FiLayers /></span><div><h3>Salary Structures</h3><p>Employee assignment distribution</p></div></header>
          <ul>{structureRows.map(item => <li key={`${item.name}:${item.code}`}><span><strong>{item.name}</strong><small>{item.code || "No structure code"}</small></span><b>{item.employees}<small>Employees</small></b></li>)}{!structureRows.length && <li className="empty">No structure data available.</li>}</ul>
        </article>
      </section>
      </div>
      <aside className="pr-report-nav pr-no-print"><h3>Available Reports</h3>{REPORTS.map(report => <button key={report} className={applied.reportType === report ? "active" : ""} onClick={() => openReport(report)}><span><strong>{report}</strong><small>{REPORT_DESCRIPTIONS[report]}</small></span><FiChevronRight /></button>)}</aside>
      </section>
    </>}
  </main>;
}
