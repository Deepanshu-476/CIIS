import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import {
  Bell,
  Building2,
  BriefcaseBusiness,
  Download,
  Filter,
  Inbox,
  Search,
  ShieldAlert,
  TicketCheck,
  UserCheck,
  Users,
} from "lucide-react";
import "../../hrCds/pages/SupportCenter.css";

const fallbackTickets = [
  { id: "SUP-2208", employee: "Nisha Sharma", company: "CIIS Network", issue: "Payroll escalation", queue: "Payroll", status: "Escalated", priority: "Critical", owner: "Ritika", age: "1h 12m" },
  { id: "SUP-2204", employee: "Rahul Verma", company: "CIIS Network", issue: "VPN provisioning delay", queue: "IT", status: "In Progress", priority: "High", owner: "Akhil", age: "2h 45m" },
  { id: "SUP-2199", employee: "Meera Joshi", company: "North Branch", issue: "Leave policy question", queue: "HR Policy", status: "Open", priority: "Medium", owner: "Unassigned", age: "3h 05m" },
  { id: "SUP-2191", employee: "Karan Singh", company: "West Branch", issue: "Asset return confirmation", queue: "Assets", status: "Waiting", priority: "Low", owner: "Pooja", age: "1d 4h" },
];

const statusClass = value => String(value || "Open").toLowerCase().replace(/\s+/g, "-");
const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data?.departments)) return payload.data.departments;
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

const mapEmployee = employee => ({
  id: employee.id || employee._id,
  name: employee.name,
  email: employee.email,
  jobRole: employee.jobRole || "employee",
  employeeId: employee.employeeId,
  department: employee.department,
  departmentName: employee.departmentName || getEntityName(employee.department),
});

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
  const [queue, setQueue] = useState("All");
  const [tickets, setTickets] = useState(fallbackTickets);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
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

    setDepartments(mapped);
    setSelectedDepartmentId(current => mapped.some(department => department.id === current) ? current : mapped[0]?.id || "");
  };

  const fetchDepartmentEmployees = async departmentId => {
    if (!departmentId) {
      setDepartmentEmployees([]);
      return;
    }

    const selected = departments.find(department => department.id === departmentId);

    try {
      const response = await axiosInstance.get(`/users/department-users?department=${encodeURIComponent(departmentId)}`, { _skipErrorNotify: true });
      const users = extractList(response.data, ["users"]).map(mapEmployee);
      const filteredUsers = users.filter(employee => employeeBelongsToDepartment(employee, selected));
      const mapped = filteredUsers.length ? filteredUsers : users;
      setDepartmentEmployees(mapped);
      setSelectedEmployeeId(mapped[0]?.id || "");
      if (mapped.length) return;
    } catch (error) {
      console.warn("Department users endpoint failed:", error.message);
    }

    try {
      const response = await axiosInstance.get(`/support/admin/departments/${departmentId}/employees`, { _skipErrorNotify: true });
      if (response.data?.success) {
        const mapped = (response.data.employees || []).map(mapEmployee);
        setDepartmentEmployees(mapped);
        setSelectedEmployeeId(response.data.department?.supportHead?.id || mapped[0]?.id || "");
        if (mapped.length) return;
      }
    } catch (error) {
      console.warn("Support department employees fallback active:", error.message);
    }

    try {
      const response = await axiosInstance.get("/users/company-users", { _skipErrorNotify: true });
      const users = extractList(response.data, ["users"]).map(mapEmployee);
      const filteredUsers = users.filter(employee => employeeBelongsToDepartment(employee, selected));
      const mapped = filteredUsers.length ? filteredUsers : users;
      setDepartmentEmployees(mapped);
      setSelectedEmployeeId(mapped[0]?.id || "");
    } catch (error) {
      console.warn("Company users fallback failed:", error.message);
      setDepartmentEmployees([]);
      setSelectedEmployeeId("");
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDepartmentEmployees(selectedDepartmentId);
  }, [selectedDepartmentId]);

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
        console.log("Support report:", response.data);
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

    try {
      const response = await axiosInstance.patch(`/support/admin/departments/${selectedDepartmentId}/head`, {
        employeeId: selectedEmployeeId,
      });
      if (response.data?.success) {
        toast.success(response.data.message || "Department Head assigned");
        await fetchDepartments();
        await fetchDepartmentEmployees(selectedDepartmentId);
        await fetchDashboard();
      }
    } catch (error) {
      console.error("Assign department head failed:", error);
    }
  };

  const filteredTickets = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return tickets.filter(ticket => {
      const matchesQueue = queue === "All" || ticket.queue === queue;
      const matchesQuery = !searchTerm || Object.values(ticket).join(" ").toLowerCase().includes(searchTerm);
      return matchesQueue && matchesQuery;
    });
  }, [query, queue, tickets]);

  const adminStats = [
    { icon: Inbox, title: "Enquiries", value: String(stats.enquiries), note: `+${stats.newEnquiriesToday} today`, tone: "blue" },
    { icon: TicketCheck, title: "Open Tickets", value: String(stats.openTickets), note: `${stats.escalatedTickets} escalated`, tone: "green" },
    { icon: ShieldAlert, title: "Employee Issues", value: String(stats.employeeIssues), note: `${stats.escalatedTickets} escalated`, tone: "rose" },
  ];

  const selectedDepartment = departments.find(department => department.id === selectedDepartmentId);

  return (
    <main className="support-page support-admin-page">
      <section className="support-hero glass-card">
        <div>
          <div className="support-eyebrow">
            <BriefcaseBusiness size={16} />
            Super Admin Support Operations
          </div>
          <h1>Unified support command center.</h1>
          <p>
            Manage enquiries, ticket queues, and employee issue tracking from one focused support workspace.
          </p>
          <div className="support-hero-actions">
            <button className="support-primary-btn" onClick={handleExportReport}>
              <Download size={18} />
              Export Report
            </button>
            <button className="support-secondary-btn" onClick={fetchDashboard}>
              <Bell size={18} />
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>
        {/* <aside className="support-notification-card">
          <div className="support-panel-header">
            <div>
              <span className="support-panel-kicker">Today</span>
              <h2>Operations Pulse</h2>
            </div>
            <Activity size={20} />
          </div>
          <div className="support-kpi-strip">
            <div className="support-kpi"><strong>{stats.newEnquiriesToday}</strong><span>New enquiries</span></div>
            <div className="support-kpi"><strong>{stats.avgResponse}</strong><span>Avg response</span></div>
            <div className="support-kpi"><strong>{stats.escalatedTickets}</strong><span>Escalations</span></div>
          </div>
        </aside> */}
      </section>

      <section className="support-stats-grid">
        {adminStats.map(({ icon: Icon, title, value, note, tone }) => (
          <article className={`support-stat glass-card support-tone-${tone}`} key={title}>
            <div className="support-stat-icon"><Icon size={22} /></div>
            <div>
              <strong>{value}</strong>
              <span>{title}</span>
              <small>{note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="support-department-admin glass-card">
        <div className="support-panel-header">
          <div>
            <span className="support-panel-kicker">Support Management</span>
            <h2>Department Heads</h2>
          </div>
          <Building2 size={20} />
        </div>

        <div className="support-department-layout">
          <div className="support-department-list">
            {departments.length ? departments.map(department => (
              <button
                className={`support-department-card ${selectedDepartmentId === department.id ? "active" : ""}`}
                key={department.id}
                onClick={() => setSelectedDepartmentId(department.id)}
              >
                <strong>{department.name}</strong>
                <span>{department.employeeCount} employees - {department.openTickets} open chats</span>
                <small>Head: {department.supportHeadName}</small>
              </button>
            )) : (
              <div className="support-empty-state">
                <Building2 size={20} />
                <span>No departments found for this company.</span>
              </div>
            )}
          </div>

          <div className="support-employee-assignment">
            <div className="support-assignment-summary">
              <UserCheck size={20} />
              <div>
                <strong>{selectedDepartment?.name || "Select department"}</strong>
                <span>Current Head: {selectedDepartment?.supportHeadName || "Unassigned"}</span>
              </div>
            </div>

            <div className="support-toolbar">
              <select value={selectedEmployeeId} onChange={event => setSelectedEmployeeId(event.target.value)}>
                {departmentEmployees.length ? departmentEmployees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.jobRole}
                  </option>
                )) : <option value="">No employees found</option>}
              </select>
              <button className="support-primary-btn" onClick={handleAssignHead} disabled={!departmentEmployees.length}>
                <UserCheck size={18} />
                Assign Head
              </button>
            </div>

            <div className="support-employee-list">
              {departmentEmployees.length ? departmentEmployees.map(employee => (
                <div className="support-employee-row" key={employee.id}>
                  <div>
                    <strong>{employee.name}</strong>
                    <span>{employee.email}</span>
                  </div>
                  <small>{employee.employeeId || employee.jobRole}</small>
                </div>
              )) : (
                <div className="support-empty-state">
                  <Users size={20} />
                  <span>No employees found for the selected department.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="support-workspace support-status-workspace">
        <div className="support-panel glass-card support-ticket-panel">
          <div className="support-panel-header">
            <div>
              <span className="support-panel-kicker">Tickets Management</span>
              <h2>Active Employee Issues</h2>
            </div>
            <button className="support-icon-btn" aria-label="Filter tickets"><Filter size={18} /></button>
          </div>
          <div className="support-toolbar">
            <label className="support-search">
              <Search size={18} />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search employee, ticket, issue" />
            </label>
            <select value={queue} onChange={event => setQueue(event.target.value)}>
              <option>All</option>
              <option>HR Policy</option>
              <option>IT Helpdesk</option>
              <option>Payroll</option>
              <option>Assets</option>
              <option>Facilities</option>
              <option>Attendance</option>
              <option>General</option>
            </select>
          </div>
          <div className="support-table-wrap">
            <table className="support-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Employee</th>
                  <th>Queue</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Owner</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} onDoubleClick={() => handleUpdateTicket(ticket)}>
                    <td data-label="Issue">
                      <strong>{ticket.id}</strong>
                      <span>{ticket.issue}</span>
                    </td>
                    <td data-label="Employee">
                      <strong>{ticket.employee}</strong>
                      <span>{ticket.company}</span>
                    </td>
                    <td data-label="Queue">{ticket.queue}</td>
                    <td data-label="Status"><span className={`support-badge ${statusClass(ticket.status)}`}>{ticket.status}</span></td>
                    <td data-label="Priority"><span className={`support-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
                    <td data-label="Owner">{ticket.owner}</td>
                    <td data-label="Age">{ticket.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>
    </main>
  );
};

export default SupportOperations;