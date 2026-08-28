import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiEdit, FiUsers, FiUserPlus } from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/EmployeeSalaryAssignment.css";
import "../styles/AssignSalary.css";

const money = (amount) => `₹ ${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const nameOf = (value) => typeof value === "object" ? value?.name || "—" : value || "—";

const assignedDate = (value) => value ? new Date(value).toLocaleDateString("en-GB") : "—";

export default function AssignSalary() {
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [jobRoleFilter, setJobRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let current = true;
    axiosInstance.get("/employee-salaries", { noCache: true })
      .then((response) => {
        if (!current) return;
        setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
        setAssignments(Array.isArray(response.data?.assignments) ? response.data.assignments : []);
      })
      .catch((requestError) => current && setError(requestError.response?.data?.message || "Salary assignment data could not be loaded."))
      .finally(() => current && setLoading(false));
    return () => { current = false; };
  }, []);

  const assignmentByUser = useMemo(() => new Map(assignments.filter((item) => item.status === "active").map((item) => [String(item.user?._id || item.user), item])), [assignments]);
  const assignedUsers = useMemo(() => users.filter((user) => assignmentByUser.has(String(user._id))), [users, assignmentByUser]);
  const unassignedUsers = useMemo(() => users.filter((user) => !assignmentByUser.has(String(user._id))), [users, assignmentByUser]);
  const departments = useMemo(() => [...new Set(users.map((user) => nameOf(user.department)).filter((item) => item !== "—"))].sort(), [users]);
  const jobRoles = useMemo(() => [...new Set(users.map((user) => nameOf(user.jobRole)).filter((item) => item !== "—"))].sort(), [users]);
  const filteredUsers = useMemo(() => {
    const byStatus = activeFilter === "assigned" ? assignedUsers : activeFilter === "pending" ? unassignedUsers : users;
    return byStatus.filter((user) => (!departmentFilter || nameOf(user.department) === departmentFilter) && (!jobRoleFilter || nameOf(user.jobRole) === jobRoleFilter));
  }, [activeFilter, users, assignedUsers, unassignedUsers, departmentFilter, jobRoleFilter]);
  const filterTitle = activeFilter === "assigned" ? "Salary Assigned" : activeFilter === "pending" ? "Salary Not Assigned" : "All Employees";

  const handleUnassign = async (user, assignment) => {
    if (!assignment?._id) return;
    if (!window.confirm(`Are you sure you want to unassign salary for ${user.name || "this employee"}?`)) return;

    try {
      setLoading(true);
      await axiosInstance.delete(`/employee-salaries/${assignment._id}`);
      setAssignments((prev) => prev.filter((item) => item._id !== assignment._id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unassign salary.");
    } finally {
      setLoading(false);
    }
  };

  const userRow = (user, assigned) => {
    const assignment = assignmentByUser.get(String(user._id));
    return <tr key={user._id}>
      <td><strong>{user.name || "—"}</strong><small>{user.employeeId || user.email || ""}</small></td>
      <td>{nameOf(user.department)}</td>
      <td>{nameOf(user.jobRole)}</td>
      <td>{assigned ? <><strong>{assignment?.salaryStructure?.name || "Salary Structure"}</strong><small>{money(assignment?.monthlyGross)} / month</small></> : <span className="as-pending">Not assigned</span>}</td>
      <td>{assigned ? <><strong>{assignment?.createdBy?.name || "—"}</strong><small>{assignedDate(assignment?.createdAt)}</small></> : "—"}</td>
      <td>{assigned ? <div className="as-action-stack"><span className="as-status assigned"><FiCheckCircle /> Assigned</span><button className="as-edit-btn" type="button" onClick={() => navigate(`/ciisUser/salary-assignment?user=${user._id}`)}><FiEdit /> Edit</button><button className="as-unassign-btn" type="button" style={{ marginLeft: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleUnassign(user, assignment)}>Unassign</button></div> : <button className="as-assign-btn" type="button" onClick={() => navigate(`/ciisUser/salary-assignment?user=${user._id}`)}><FiUserPlus /> Assign Salary</button>}</td>
    </tr>;
  };

  return <main className="esa-container assign-salary-page">
    <section className="esa-card as-header"><div className="esa-card-header"><h2>Assign Salary</h2><p>View employees with an assigned salary and employees still pending salary assignment.</p></div><div className="as-header-actions"><div className="as-filters"><label>Department<select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="">All Departments</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label><label>Job Role<select value={jobRoleFilter} onChange={(event) => setJobRoleFilter(event.target.value)}><option value="">All Job Roles</option>{jobRoles.map((jobRole) => <option key={jobRole} value={jobRole}>{jobRole}</option>)}</select></label></div><button type="button" onClick={() => navigate("/ciisUser/salary-assignment")}><FiUserPlus /> Assign Salary</button></div></section>
    <section className="as-counts">
      <button type="button" className={activeFilter === "all" ? "active" : ""} onClick={() => setActiveFilter("all")}><FiUsers /><span><small>Total Employees</small><strong>{users.length}</strong></span></button>
      <button type="button" className={`green ${activeFilter === "assigned" ? "active" : ""}`} onClick={() => setActiveFilter("assigned")}><FiCheckCircle /><span><small>Salary Assigned</small><strong>{assignedUsers.length}</strong></span></button>
      <button type="button" className={`orange ${activeFilter === "pending" ? "active" : ""}`} onClick={() => setActiveFilter("pending")}><FiUserPlus /><span><small>Pending Assignment</small><strong>{unassignedUsers.length}</strong></span></button>
    </section>
    {loading && <section className="as-card as-empty">Loading employees…</section>}
    {!loading && error && <section className="as-card as-error">{error}</section>}
    {!loading && !error && <section className="as-card"><div className="as-card-head"><h2>{filterTitle}</h2><span>{filteredUsers.length} Employees</span></div><div className="as-table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Job Role</th><th>Salary Details</th><th>Assigned By / On</th><th>Status / Action</th></tr></thead><tbody>{filteredUsers.length ? filteredUsers.map((user) => userRow(user, assignmentByUser.has(String(user._id)))) : <tr><td colSpan="6" className="as-none">No employee found for this filter.</td></tr>}</tbody></table></div></section>}
  </main>;
}
