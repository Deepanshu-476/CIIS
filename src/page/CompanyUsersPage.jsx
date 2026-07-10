import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config";
import "./AllCompany.css";
import CIISLoader from "../Loader/CIISLoader";

const getEntityId = value => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return value;
};

const extractList = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.message)) return data.message;
  if (Array.isArray(data?.message?.data)) return data.message.data;
  return [];
};

const looksLikeObjectId = value => typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

const getRoleColor = role => {
  switch (role?.toLowerCase()) {
    case "admin": return "#2563eb";
    case "manager": return "#7e22ce";
    case "supervisor": return "#0891b2";
    case "employee": return "#0a5e0a";
    default: return "#64748b";
  }
};

const CompanyUsersPage = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentNamesById, setDepartmentNamesById] = useState({});
  const [jobRoleNamesById, setJobRoleNamesById] = useState({});

  const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const getUserDepartment = user => {
    if (user?.departmentName || user?.deptName) return user.departmentName || user.deptName;
    const department = user?.department || user?.departmentId || user?.deptId;
    if (department && typeof department === "object") {
      const departmentId = getEntityId(department);
      return department.name || department.departmentName || department.title || departmentNamesById[departmentId] || "Not assigned";
    }
    const departmentId = getEntityId(department);
    if (departmentNamesById[departmentId]) return departmentNamesById[departmentId];
    return looksLikeObjectId(departmentId) ? "Not assigned" : departmentId || "Not assigned";
  };

  const getUserJobRole = user => {
    if (user?.jobRoleName || user?.companyRoleName || user?.designationName) {
      return user.jobRoleName || user.companyRoleName || user.designationName;
    }
    const jobRole = user?.jobRole || user?.jobRoleId || user?.companyRole || user?.designation || user?.employeeType;
    if (jobRole && typeof jobRole === "object") {
      const jobRoleId = getEntityId(jobRole);
      return jobRole.name || jobRole.title || jobRole.roleName || jobRoleNamesById[jobRoleId] || "N/A";
    }
    const jobRoleId = getEntityId(jobRole);
    if (jobRoleNamesById[jobRoleId]) return jobRoleNamesById[jobRoleId];
    return looksLikeObjectId(jobRoleId) ? "N/A" : jobRoleId || "N/A";
  };

  const getUserRole = user => user?.role || user?.userRole || "User";
  const getUserPhone = user => user?.mobile || user?.phone || user?.contact || user?.contactNumber || user?.phoneNumber || "N/A";

  useEffect(() => {
    const loadCompanyUsers = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();
        const [companyRes, usersRes, departmentsRes, jobRolesRes] = await Promise.allSettled([
          axios.get(`${API_URL}/company/${companyId}`, { headers }),
          axios.get(`${API_URL}/superAdmin/users`, { headers }),
          axios.get(`${API_URL}/departments`, { headers, params: { company: companyId } }),
          axios.get(`${API_URL}/job-roles`, { headers, params: { company: companyId } })
        ]);

        if (companyRes.status === "fulfilled") {
          setCompany(companyRes.value.data?.company || companyRes.value.data);
        }

        const departments = departmentsRes.status === "fulfilled"
          ? extractList(departmentsRes.value.data, ["departments"])
          : [];
        const jobRoles = jobRolesRes.status === "fulfilled"
          ? extractList(jobRolesRes.value.data, ["jobRoles", "roles"])
          : [];

        const departmentMap = {};
        departments.forEach(dept => {
          const id = dept?._id || dept?.id;
          const name = dept?.name || dept?.departmentName || dept?.title;
          if (id && name) departmentMap[id] = name;
        });

        const jobRoleMap = {};
        jobRoles.forEach(role => {
          const id = role?._id || role?.id;
          const name = role?.name || role?.jobRoleName || role?.roleName || role?.title;
          if (id && name) jobRoleMap[id] = name;
        });

        setDepartmentNamesById(departmentMap);
        setJobRoleNamesById(jobRoleMap);

        const allUsers = usersRes.status === "fulfilled"
          ? extractList(usersRes.value.data, ["users", "companyUsers"])
          : [];
        setUsers(allUsers.filter(user => String(getEntityId(user.company || user.companyId)) === String(companyId)));
      } catch (error) {
        console.error("Error loading company users:", error);
        toast.error(error.response?.data?.message || "Failed to load company users");
      } finally {
        setLoading(false);
      }
    };

    loadCompanyUsers();
  }, [companyId]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(user => (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      getUserDepartment(user)?.toLowerCase().includes(term) ||
      getUserJobRole(user)?.toLowerCase().includes(term)
    ));
  }, [searchTerm, users, departmentNamesById, jobRoleNamesById]);

  if (loading) return <CIISLoader />;

  return (
    <div className="AllCompany-all-company-container">
      <div className="AllCompany-responsive-container">
        <div className="AllCompany-users-page-header">
          <button className="AllCompany-btn-outline" onClick={() => navigate("/Ciis-network/all-company")}>
            <span className="material-icons AllCompany-btn-icon">arrow_back</span>
            Back
          </button>
          <div>
            <h1 className="AllCompany-header-title">{company?.companyName || "Company Users"}</h1>
            <p className="AllCompany-header-subtitle">{users.length} users in this company</p>
          </div>
        </div>

        <div className="AllCompany-search-filter-section">
          <div className="AllCompany-search-input-container">
            <span className="material-icons AllCompany-search-icon">search</span>
            <input
              type="text"
              className="AllCompany-search-input"
              placeholder="Search users by name, email, department or role..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="AllCompany-users-table-container AllCompany-users-page-table">
            <table className="AllCompany-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Job Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id || user.id}>
                    <td>
                      <div className="AllCompany-user-cell">
                        <div className="AllCompany-user-avatar" style={{background: `linear-gradient(135deg, ${getRoleColor(getUserRole(user))} 0%, ${getRoleColor(getUserRole(user))}80 100%)`}}>
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <div className="AllCompany-user-primary-info">
                          <span className="AllCompany-user-name">{user.name || "User"}</span>
                          <span className="AllCompany-user-id">{user.employeeId || user.empId || user.userCode || ""}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.email || "N/A"}</td>
                    <td><span className="AllCompany-info-chip">{getUserDepartment(user)}</span></td>
                    <td><span className="AllCompany-role-badge" style={{color: getRoleColor(getUserRole(user))}}>{getUserJobRole(user)}</span></td>
                    <td>{getUserPhone(user)}</td>
                    <td>
                      <span className={`AllCompany-status-badge-small ${user.isActive !== false ? "AllCompany-active" : "AllCompany-inactive"}`}>
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="AllCompany-empty-state">
            <div className="AllCompany-empty-state-icon">
              <span className="material-icons">groups</span>
            </div>
            <h6 className="AllCompany-empty-state-title">No users found</h6>
            <p className="AllCompany-empty-state-text">No users match this company or search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyUsersPage;
