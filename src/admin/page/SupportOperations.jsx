import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Menu,
  MoreVertical,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import "../../hrCds/pages/SupportCenter.css";

const fallbackDepartments = [
  { id: "it", name: "IT Department", description: "Handles all IT related queries", employeeCount: 28, openTickets: 15, supportHeadName: "Akhil Mehta", supportHead: { name: "Akhil Mehta", jobRole: "IT Support Lead" } },
  { id: "hr", name: "HR Department", description: "Handles HR & policy queries", employeeCount: 35, openTickets: 7, supportHeadName: "Pooja Yadav", supportHead: { name: "Pooja Yadav", jobRole: "HR Manager" } },
  { id: "finance", name: "Finance Department", description: "Handles finance & payroll queries", employeeCount: 22, openTickets: 9, supportHeadName: "Sandeep Kumar", supportHead: { name: "Sandeep Kumar", jobRole: "Finance Manager" } },
  { id: "ops", name: "Operations Department", description: "Handles operations queries", employeeCount: 18, openTickets: 4, supportHeadName: "Ritika Sharma", supportHead: { name: "Ritika Sharma", jobRole: "Operations Lead" } },
  { id: "marketing", name: "Marketing Department", description: "Handles marketing queries", employeeCount: 16, openTickets: 3, supportHeadName: "Vikas Singh", supportHead: { name: "Vikas Singh", jobRole: "Marketing Manager" } },
  { id: "sales", name: "Sales Department", description: "Handles sales related queries", employeeCount: 20, openTickets: 10, supportHeadName: "Neha Aggarwal", supportHead: { name: "Neha Aggarwal", jobRole: "Sales Manager" } },
  { id: "cs", name: "Customer Support", description: "Handles customer support chats", employeeCount: 30, openTickets: 12, supportHeadName: "Manoj Patel", supportHead: { name: "Manoj Patel", jobRole: "Support Manager" } },
  { id: "admin", name: "Admin Department", description: "Handles admin queries", employeeCount: 12, openTickets: 0, supportHeadName: "Unassigned" },
  { id: "procurement", name: "Procurement Department", description: "Handles procurement queries", employeeCount: 9, openTickets: 0, supportHeadName: "Unassigned" },
];

const fallbackTickets = [
  { id: "SUP-2208", employee: "Nisha Sharma", company: "CIIS Network", issue: "Payroll escalation", queue: "Payroll", status: "Escalated", priority: "Critical", owner: "Ritika", age: "1h 12m" },
  { id: "SUP-2204", employee: "Rahul Verma", company: "CIIS Network", issue: "VPN provisioning delay", queue: "IT", status: "In Progress", priority: "High", owner: "Akhil", age: "2h 45m" },
  { id: "SUP-2199", employee: "Meera Joshi", company: "North Branch", issue: "Leave policy question", queue: "HR Policy", status: "Open", priority: "Medium", owner: "Unassigned", age: "3h 05m" },
  { id: "SUP-2191", employee: "Karan Singh", company: "West Branch", issue: "Asset return confirmation", queue: "Assets", status: "Waiting", priority: "Low", owner: "Pooja", age: "1d 4h" },
];

const statusClass = value => String(value || "Open").toLowerCase().replace(/\s+/g, "-");
const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
    if (Array.isArray(payload.data?.[key])) return payload.data[key];
    if (Array.isArray(payload.message?.[key])) return payload.message[key];
  }
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.message)) return payload.message;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.employees)) return payload.employees;
  if (Array.isArray(payload.departments)) return payload.departments;
  if (Array.isArray(payload.data?.users)) return payload.data.users;
  if (Array.isArray(payload.data?.employees)) return payload.data.employees;
  if (Array.isArray(payload.data?.departments)) return payload.data.departments;
  if (Array.isArray(payload.message?.users)) return payload.message.users;
  if (Array.isArray(payload.message?.employees)) return payload.message.employees;
  if (Array.isArray(payload.message?.departments)) return payload.message.departments;
  return [];
};

const getEntityId = value => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || value.name || "");
  return String(value);
};

const getEntityName = value => {
  if (!value) return "";
  if (typeof value === "object") return value.name || value.departmentName || value.title || getEntityId(value);
  return String(value);
};

const mapTicket = ticket => ({
  id: ticket.ticketNumber || ticket.id,
  dbId: ticket.id || ticket._id,
  employee: ticket.requesterName || "Employee",
  company: ticket.requesterEmail || "Company employee",
  issue: ticket.subject,
  queue: ticket.category || "General",
  status: ticket.status || "Open",
  priority: ticket.priority || "Medium",
  owner: ticket.assignedToName || "Unassigned",
  age: ticket.age || "New",
});

const mapDepartment = department => ({
  id: getEntityId(department.id || department._id || department.name),
  name: department.name || "Department",
  description: department.description || "",
  employeeCount: department.employeeCount || 0,
  openTickets: department.openTickets || 0,
  supportHead: department.supportHead,
  supportHeadName: department.supportHeadName || department.supportHead?.name || "Unassigned",
});

const mapEmployee = employee => {
  if (!employee) return null;
  const rawId = employee.id || employee._id || employee.userId;
  if (!rawId) return null;
  const rawJobRole = employee.jobRoleName || employee.jobRole?.name || employee.jobRole || employee.role || employee.companyRole;
  return {
    id: String(rawId),
    name: employee.name || employee.fullName || "Employee",
    email: employee.email || "",
    jobRole: typeof rawJobRole === "string" ? rawJobRole : (rawJobRole?.name || "Employee"),
    employeeId: employee.employeeId || "",
    department: employee.department,
    departmentName: employee.departmentName || getEntityName(employee.department),
  };
};

const getInitials = value => String(value || "U")
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part.charAt(0).toUpperCase())
  .join("") || "U";

const isDepartmentAssigned = department => {
  const headName = String(department?.supportHeadName || department?.supportHead?.name || "").trim().toLowerCase();
  return Boolean(department?.supportHead || (headName && headName !== "unassigned"));
};

const ticketTone = count => {
  const value = Number(count || 0);
  if (value >= 12) return "hot";
  if (value >= 7) return "warm";
  if (value > 0) return "cool";
  return "quiet";
};

const employeeBelongsToDepartment = (employee, department) => {
  if (!department) return true;
  const employeeDepartmentId = getEntityId(employee.department);
  const employeeDepartmentName = getEntityName(employee.department).toLowerCase();
  const departmentId = getEntityId(department.id || department._id);
  const departmentName = String(department.name || "").toLowerCase();

  return employeeDepartmentId === departmentId || employeeDepartmentName === departmentName;
};

const SupportOperations = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [tickets, setTickets] = useState(fallbackTickets);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [companyEmployees, setCompanyEmployees] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [assigningHead, setAssigningHead] = useState(false);
  const [assignmentHighlight, setAssignmentHighlight] = useState(false);
  const assignmentPanelRef = useRef(null);
  const assignmentHighlightTimerRef = useRef(null);
  const [stats, setStats] = useState({
    enquiries: 186,
    newEnquiriesToday: 18,
    openTickets: 42,
    escalatedTickets: 4,
    chatbotLogs: "2.8k",
    chatbotDeflection: 91,
    employeeIssues: 17,
    slaHealth: 94,
    reportsReady: 12,
    avgResponse: "6m",
  });
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/support/admin/dashboard", { _skipErrorNotify: true });
      const data = response.data || {};
      if (data.success) {
        setStats(prev => ({ ...prev, ...(data.stats || {}) }));
        setTickets((data.tickets || []).map(mapTicket));
      }
    } catch (error) {
      console.warn("Support admin dashboard fallback active:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyEmployees = async () => {
    try {
      const response = await axiosInstance.get("/users/company-users", { _skipErrorNotify: true });
      const raw = extractList(response.data, ["users"]);
      const mapped = raw.map(mapEmployee).filter(Boolean);
      setCompanyEmployees(mapped);
      return mapped;
    } catch (error) {
      console.warn("Fetch company users failed:", error.message);
      return [];
    }
  };

  const fetchDepartments = async () => {
    let mapped = [];
    try {
      const response = await axiosInstance.get("/support/admin/departments", { _skipErrorNotify: true });
      if (response.data?.success) {
        mapped = (response.data.departments || []).map(mapDepartment);
      }
    } catch (error) {
      console.warn("Support department management fallback active:", error.message);
    }

    if (!mapped.length) {
      try {
        const response = await axiosInstance.get("/departments", { _skipErrorNotify: true });
        mapped = extractList(response.data, ["departments"]).map(mapDepartment);
      } catch (error) {
        console.warn("Department fallback endpoint failed:", error.message);
      }
    }

    if (!mapped.length) {
      mapped = fallbackDepartments;
    }

    setDepartments(mapped);
    setSelectedDepartmentId(current => (mapped.some(department => department.id === current) ? current : mapped[0]?.id || ""));
  };

  const fetchDepartmentEmployees = async (departmentId, currentCompanyUsers = companyEmployees) => {
    if (!departmentId) {
      setDepartmentEmployees([]);
      return;
    }

    setLoadingEmployees(true);
    const selected = departments.find(department => department.id === departmentId);
    let deptEmployees = [];

    try {
      const response = await axiosInstance.get(`/support/admin/departments/${departmentId}/employees`, { _skipErrorNotify: true });
      if (response.data?.success && Array.isArray(response.data.employees)) {
        deptEmployees = response.data.employees.map(mapEmployee).filter(Boolean);
      }
    } catch (error) {
      console.warn("Support department employees endpoint failed:", error.message);
    }

    if (!deptEmployees.length) {
      try {
        const response = await axiosInstance.get(`/users/department-users?department=${encodeURIComponent(departmentId)}`, { _skipErrorNotify: true });
        const list = extractList(response.data, ["users"]).map(mapEmployee).filter(Boolean);
        if (list.length) {
          deptEmployees = list;
        }
      } catch (error) {
        console.warn("Department users endpoint failed:", error.message);
      }
    }

    if (!deptEmployees.length && currentCompanyUsers.length) {
      deptEmployees = currentCompanyUsers.filter(employee => employeeBelongsToDepartment(employee, selected));
    }

    setDepartmentEmployees(deptEmployees);

    const currentHeadId = getEntityId(selected?.supportHead);
    const currentHeadName = String(selected?.supportHeadName || "").trim().toLowerCase();

    const allPool = deptEmployees.length ? [...deptEmployees, ...currentCompanyUsers] : currentCompanyUsers;
    const matchingHead = allPool.find(emp =>
      (currentHeadId && String(emp.id) === String(currentHeadId)) ||
      (currentHeadName && currentHeadName !== "unassigned" && emp.name?.trim().toLowerCase() === currentHeadName)
    );

    if (matchingHead) {
      setSelectedEmployeeId(matchingHead.id);
    } else if (currentHeadId) {
      setSelectedEmployeeId(currentHeadId);
    } else if (deptEmployees.length) {
      setSelectedEmployeeId(deptEmployees[0].id);
    } else if (currentCompanyUsers.length) {
      setSelectedEmployeeId(currentCompanyUsers[0].id);
    } else {
      setSelectedEmployeeId("");
    }

    setLoadingEmployees(false);
  };

  useEffect(() => {
    fetchDashboard();
    fetchDepartments();
    fetchCompanyEmployees();
  }, []);

  useEffect(() => {
    fetchDepartmentEmployees(selectedDepartmentId, companyEmployees);
  }, [selectedDepartmentId, companyEmployees]);

  useEffect(() => () => window.clearTimeout(assignmentHighlightTimerRef.current), []);

  const handleOpenHeadAssignment = department => {
    setSelectedDepartmentId(department.id);
    setEmployeeSearch("");
    setAssignmentHighlight(true);
    window.clearTimeout(assignmentHighlightTimerRef.current);

    window.requestAnimationFrame(() => {
      assignmentPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      assignmentPanelRef.current?.focus({ preventScroll: true });
    });

    assignmentHighlightTimerRef.current = window.setTimeout(() => setAssignmentHighlight(false), 1400);
  };

  const handleUpdateTicket = async ticket => {
    if (!ticket.dbId) return;
    const status = window.prompt("New status: Open, In Progress, Waiting, Resolved, Closed, Escalated", ticket.status);
    if (!status) return;
    const message = window.prompt("Add reply/comment for employee", `Ticket marked as ${status}`) || "";

    try {
      const response = await axiosInstance.patch(`/support/admin/tickets/${ticket.dbId}`, { status, message });
      if (response.data?.success) {
        toast.success("Support ticket updated");
        await fetchDashboard();
      }
    } catch (error) {
      console.error("Update support ticket failed:", error);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await axiosInstance.get("/support/admin/reports");
      if (response.data?.success) {
        toast.success("Report generated in backend");
        void 0;
      }
    } catch (error) {
      console.error("Generate report failed:", error);
    }
  };

  const handleAssignHead = async () => {
    if (!selectedDepartmentId || !selectedEmployeeId) {
      toast.error("Select a department and employee first");
      return;
    }

    setAssigningHead(true);
    try {
      const response = await axiosInstance.patch(`/support/admin/departments/${selectedDepartmentId}/head`, {
        employeeId: selectedEmployeeId,
      });
      if (response.data?.success) {
        toast.success(response.data.message || "Department Head assigned");
        await fetchDepartments();
        await fetchDepartmentEmployees(selectedDepartmentId, companyEmployees);
        await fetchDashboard();
      } else {
        toast.error(response.data?.message || "Failed to assign Department Head");
      }
    } catch (error) {
      console.error("Assign department head failed:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to assign Department Head");
    } finally {
      setAssigningHead(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return tickets.filter(ticket => {
      const matchesQueue = departmentFilter === "All Departments" || ticket.queue === departmentFilter;
      const matchesQuery = !searchTerm || Object.values(ticket).join(" ").toLowerCase().includes(searchTerm);
      return matchesQueue && matchesQuery;
    });
  }, [query, departmentFilter, tickets]);

  const selectedDepartment = departments.find(department => department.id === selectedDepartmentId);
  const assignedDepartments = departments.filter(isDepartmentAssigned);
  const unassignedDepartments = departments.filter(department => !isDepartmentAssigned(department));
  const departmentHeads = assignedDepartments.length;
  const departmentSearchTerm = query.trim().toLowerCase();
  const filteredDepartments = departments.filter(department => {
    const status = isDepartmentAssigned(department) ? "Assigned" : "Unassigned";
    const matchesSearch = !departmentSearchTerm || [
      department.name,
      department.description,
      department.supportHeadName,
      status,
    ].join(" ").toLowerCase().includes(departmentSearchTerm);
    const matchesStatus = statusFilter === "All Status" || status === statusFilter;
    const matchesDepartment = departmentFilter === "All Departments" || department.name === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const assignableEmployees = useMemo(() => {
    const deptEmpIds = new Set(departmentEmployees.map(e => String(e.id)));
    const otherEmployees = companyEmployees.filter(e => !deptEmpIds.has(String(e.id)));
    const combined = [...departmentEmployees, ...otherEmployees];

    const term = employeeSearch.trim().toLowerCase();
    if (!term) return combined;

    return combined.filter(emp =>
      emp.name.toLowerCase().includes(term) ||
      (emp.email && emp.email.toLowerCase().includes(term)) ||
      (emp.jobRole && emp.jobRole.toLowerCase().includes(term)) ||
      (emp.departmentName && emp.departmentName.toLowerCase().includes(term))
    );
  }, [departmentEmployees, companyEmployees, employeeSearch]);

  const selectedEmployee = assignableEmployees.find(employee => String(employee.id) === String(selectedEmployeeId)) || assignableEmployees[0];

  return (
    <main className="support-ops-page">
      <header className="support-ops-topbar support-ops-topbar-simple">
        <div className="support-ops-title">
          <button type="button" aria-label="Menu"><Menu size={20} /></button>
          <strong>Support Operations</strong>
          <span><i /> Live</span>
        </div>
      </header>

      <section className="support-ops-stats">
        {[
          { icon: Building2, label: "Total Departments", value: departments.length, note: "Active Departments", tone: "violet" },
          { icon: Users, label: "Assigned Departments", value: assignedDepartments.length, note: "Chat Handled", tone: "green" },
          { icon: UserPlus, label: "Unassigned Departments", value: unassignedDepartments.length, note: "No Department Head", tone: "orange" },
          { icon: ShieldCheck, label: "Total Department Heads", value: departmentHeads, note: "Active Heads", tone: "blue" },
        ].map(({ icon: Icon, label, value, note, tone }) => (
          <article className={`support-ops-stat support-ops-${tone}`} key={label}>
            <div><Icon size={30} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
            <button type="button">View All</button>
          </article>
        ))}
      </section>

      <section className="support-ops-grid">
        <div className="support-ops-card support-ops-table-card">
          <div className="support-ops-card-head">
            <h2>Department Assignment</h2>
            <p>Assign a Department Head to handle and manage department chats</p>
          </div>
          <div className="support-ops-filters">
            <label>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search department..." />
              <Search size={17} />
            </label>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option>All Status</option>
              <option>Assigned</option>
              <option>Unassigned</option>
            </select>
            <select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}>
              <option>All Departments</option>
              {departments.map(department => <option key={department.id}>{department.name}</option>)}
            </select>
          </div>

          <div className="support-ops-table-wrap">
            <table className="support-ops-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Open Tickets</th>
                  <th>Status</th>
                  <th>Assigned Department Head</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map(department => {
                  const assigned = isDepartmentAssigned(department);
                  const headName = assigned ? department.supportHeadName : "No Head Assigned";
                  return (
                    <tr key={department.id} className={selectedDepartmentId === department.id ? "active" : ""}>
                      <td>
                        <div className="support-ops-dept-cell">
                          <span>{getInitials(department.name)}</span>
                          <div><strong>{department.name}</strong><small>{department.description || "Handles department queries"}</small></div>
                        </div>
                      </td>
                      <td>{department.employeeCount || 0}</td>
                      <td><span className={`support-ops-ticket-pill ${ticketTone(department.openTickets)}`}>{department.openTickets || 0}</span></td>
                      <td><span className={`support-ops-status ${assigned ? "assigned" : "unassigned"}`}>{assigned ? "Assigned" : "Unassigned"}</span></td>
                      <td>
                        <div className="support-ops-head-cell">
                          {assigned ? <span>{getInitials(headName)}</span> : <b />}
                          <div><strong>{assigned ? headName : "--"}</strong><small>{assigned ? department.name : "No Head Assigned"}</small></div>
                        </div>
                      </td>
                      <td>
                        <div className="support-ops-actions">
                          <button
                            type="button"
                            onClick={() => handleOpenHeadAssignment(department)}
                          >
                            {assigned ? <Edit3 size={15} /> : <UserPlus size={15} />}
                            {assigned ? "Change Head" : "Assign Head"}
                          </button>
                          <button type="button" aria-label="More actions"><MoreVertical size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="support-ops-pagination">
            <span>Showing 1 to {filteredDepartments.length} of {departments.length} departments</span>
            <div>
              <button type="button"><ChevronLeft size={16} /></button>
              <button type="button" className="active">1</button>
              <button type="button">2</button>
              <button type="button"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        <aside className="support-ops-side">
          <div
            ref={assignmentPanelRef}
            tabIndex={-1}
            className={`support-ops-card support-ops-assign ${assignmentHighlight ? "assignment-highlight" : ""}`}
          >
            <div className="support-ops-card-head">
              <h2>Assign Department Head</h2>
              <p>Select a department to assign or change the department head</p>
            </div>
            <label>
              <span>Select Department</span>
              <select
                value={selectedDepartmentId}
                onChange={event => {
                  setSelectedDepartmentId(event.target.value);
                  setEmployeeSearch("");
                }}
              >
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Select Department Head</span>
              <div className="support-ops-employee-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={employeeSearch}
                  onChange={event => setEmployeeSearch(event.target.value)}
                />
                {employeeSearch && (
                  <button
                    type="button"
                    className="support-ops-search-clear"
                    onClick={() => setEmployeeSearch("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </label>
            <div className="support-ops-radio-list">
              {loadingEmployees && !assignableEmployees.length ? (
                <div className="support-ops-empty-message">Loading employees...</div>
              ) : assignableEmployees.length === 0 ? (
                <div className="support-ops-empty-message">
                  {employeeSearch ? `No employees matching "${employeeSearch}"` : "No employees available"}
                </div>
              ) : (
                assignableEmployees.map(employee => {
                  const isSelected = String(selectedEmployeeId) === String(employee.id);
                  const isCurrentHead =
                    selectedDepartment &&
                    (String(selectedDepartment.supportHead?.id || selectedDepartment.supportHead) === String(employee.id) ||
                      (selectedDepartment.supportHeadName &&
                        selectedDepartment.supportHeadName.toLowerCase() !== "unassigned" &&
                        selectedDepartment.supportHeadName.toLowerCase() === employee.name?.trim().toLowerCase()));

                  return (
                    <button
                      type="button"
                      className={`${isSelected ? "active" : ""} ${isCurrentHead ? "current-head" : ""}`}
                      key={employee.id}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                    >
                      <span>{getInitials(employee.name)}</span>
                      <div>
                        <strong>
                          {employee.name}
                          {isCurrentHead && <em className="support-ops-head-badge">Current Head</em>}
                        </strong>
                        <small>{employee.jobRole || employee.email || "Employee"}</small>
                      </div>
                      <i />
                    </button>
                  );
                })
              )}
            </div>
            <div className="support-ops-note">
              <strong>About Assignment</strong>
              <p>The assigned head will receive and handle all chat queries from employees of this department.</p>
            </div>
            <button
              className="support-ops-submit"
              type="button"
              onClick={handleAssignHead}
              disabled={assigningHead || !selectedEmployee?.id}
            >
              {assigningHead ? "Assigning..." : "Assign Department Head"}
            </button>
          </div>

          <div className="support-ops-card support-ops-summary">
            <h2>Assignment Summary</h2>
            <dl>
              <div><dt>Total Departments</dt><dd>{departments.length}</dd></div>
              <div><dt>Assigned Departments</dt><dd>{assignedDepartments.length}</dd></div>
              <div><dt>Unassigned Departments</dt><dd>{unassignedDepartments.length}</dd></div>
              <div><dt>Total Department Heads</dt><dd>{departmentHeads}</dd></div>
            </dl>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default SupportOperations;
