import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config";
import CIISLoader from "../Loader/CIISLoader";
import "./AllCompany.css";

const getId = value => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return String(value);
};

const formatDate = value => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAvatarLabel = value => {
  const text = String(value || "").trim();
  if (!text) return "U";
  const parts = text.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";
  return `${first}${second}`.toUpperCase();
};

const getProfileImageSrc = value => {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_URL}/${String(value).replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  if (currentPage > 3) pages.push("ellipsis-left");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) pages.push("ellipsis-right");
  pages.push(totalPages);

  return [...new Set(pages)];
};

const CompanyUsersPage = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, admins: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rowMenuOpenId, setRowMenuOpenId] = useState(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // Department and job role names come resolved from the server.
  const getUserDepartment = user => user?.departmentName || "Not assigned";
  const getUserJobRole = user => user?.jobRoleName || "N/A";
  const getUserPhone = user => user?.mobile || user?.phone || user?.contact || user?.contactNumber || user?.phoneNumber || "N/A";

  const getStatus = user => (user?.isActive === false ? { label: "Inactive", tone: "danger" } : { label: "Active", tone: "success" });

  useEffect(() => {
    axios.get(`${API_URL}/company/${companyId}`, { headers: getAuthHeaders() })
      .then(res => setCompany(res.data?.company || res.data))
      .catch(() => {});
  }, [companyId]);

  // Typing waits a moment before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, pageSize]);

  // One page of this company's users from the server. The old page loaded /superAdmin/users, which
  // stops at 50 users across every company, and filtered here.
  useEffect(() => {
    let active = true;
    setListLoading(true);
    const params = { page, limit: pageSize, ...(query ? { search: query } : {}), ...(statusFilter !== "all" ? { status: statusFilter } : {}) };
    axios.get(`${API_URL}/superAdmin/company/${companyId}/users`, { headers: getAuthHeaders(), params })
      .then(res => {
        if (!active) return;
        setUsers(res.data?.items || []);
        setTotal(res.data?.total || 0);
        if (res.data?.stats) setStats(res.data.stats);
      })
      .catch(error => {
        if (!active) return;
        console.error("Failed to load company users:", error);
        toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to load company users");
        setUsers([]);
        setTotal(0);
      })
      .finally(() => {
        if (!active) return;
        setListLoading(false);
        setLoading(false);
      });
    return () => { active = false; };
  }, [companyId, page, pageSize, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = users;
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(total, currentPage * pageSize);
  const activeCount = stats.active;
  const inactiveCount = stats.inactive;
  const adminCount = stats.admins;

  const handleCopy = async value => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Copy failed");
    }
  };

  if (loading) {
    return <CIISLoader />;
  }

  return (
    <div className="AllCompany-page">
      <div className="AllCompany-page-inner">
        <div className="AllCompany-back-row">
          <button type="button" className="AllCompany-btn AllCompany-btn-ghost" onClick={() => navigate("/Ciis-network/all-company")}>
            <span className="material-icons">arrow_back</span>
            <span>Back to Companies</span>
          </button>
        </div>

        <section className="AllCompany-company-hero AllCompany-card">
          <div className="AllCompany-company-hero-left">
            <div className="AllCompany-company-hero-avatar">
              <span className="material-icons">apartment</span>
            </div>
            <div>
              <div className="AllCompany-company-hero-title">
                <h1>{company?.companyName || "Company Users"}</h1>
                <span className={`AllCompany-status-badge AllCompany-status-${company?.isActive === false ? "danger" : "success"}`}>
                  <span className="AllCompany-status-dot" />
                  {company?.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
              <p className="AllCompany-company-hero-meta">
                <span>{company?.companyCode || "N/A"}</span>
                <span>•</span>
                <span>{company?.subscriptionPlan || company?.selectedPlan?.name || "Plan not set"}</span>
                <span>•</span>
                <span>{getUserCountLabel(stats.total)}</span>
              </p>
              <p className="AllCompany-company-hero-submeta">
                <span><span className="material-icons">groups</span>{stats.total} users</span>
                <span>•</span>
                <span>Joined on {formatDate(company?.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="AllCompany-company-hero-stats">
            <div className="AllCompany-mini-stat">
              <span className="material-icons">groups</span>
              <strong>{stats.total}</strong>
              <span>Total Users</span>
            </div>
            <div className="AllCompany-mini-stat">
              <span className="material-icons">check_circle</span>
              <strong>{activeCount}</strong>
              <span>Active Users</span>
            </div>
            <div className="AllCompany-mini-stat">
              <span className="material-icons">do_not_disturb_on</span>
              <strong>{inactiveCount}</strong>
              <span>Inactive Users</span>
            </div>
            <div className="AllCompany-mini-stat">
              <span className="material-icons">admin_panel_settings</span>
              <strong>{adminCount}</strong>
              <span>Admin Users</span>
            </div>
          </div>
        </section>

        <section className="AllCompany-card AllCompany-toolbar-card">
          <div className="AllCompany-toolbar-grid AllCompany-toolbar-grid-users">
            <div className="AllCompany-search-wrap">
              <span className="material-icons AllCompany-search-icon">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search users by name, email, department or role..."
                className="AllCompany-input AllCompany-search-input"
              />
            </div>

            <div className="AllCompany-toolbar-actions">
              <div className="AllCompany-popover-wrap">
                <button type="button" className="AllCompany-btn AllCompany-btn-outline" onClick={() => setFiltersOpen(prev => !prev)}>
                  <span className="material-icons">filter_alt</span>
                  <span>Filters</span>
                  <span className="AllCompany-chip">{statusFilter === "all" ? 0 : 1}</span>
                </button>

                {filtersOpen && (
                  <div className="AllCompany-mini-menu AllCompany-mini-menu-right">
                    <button type="button" onClick={() => setStatusFilter("all")}>All Users</button>
                    <button type="button" onClick={() => setStatusFilter("active")}>Active</button>
                    <button type="button" onClick={() => setStatusFilter("inactive")}>Inactive</button>
                    <button type="button" onClick={() => setStatusFilter("all")}>Reset Filters</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="AllCompany-card AllCompany-table-card">
          <div className="AllCompany-table-wrap">
            <table className="AllCompany-table AllCompany-table-users">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Job Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listLoading && paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="AllCompany-empty-state">
                        <strong>Loading users…</strong>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map(user => {
                    const userId = getId(user);
                    const status = getStatus(user);
                    const initials = getAvatarLabel(user?.name || user?.email || "User");
                    const profileImageSrc = getProfileImageSrc(user?.profileImage);

                    return (
                      <tr key={userId}>
                        <td>
                          <div className="AllCompany-user-cell">
                            <div className={`AllCompany-user-avatar AllCompany-avatar-${status.tone}`}>
                              {profileImageSrc ? <img src={profileImageSrc} alt={user?.name || "User"} /> : <span>{initials}</span>}
                            </div>
                            <div className="AllCompany-user-meta">
                              <strong>{user?.name || "User"}</strong>
                              <span>{user?.employeeId || user?.empId || ""}</span>
                            </div>
                          </div>
                        </td>
                        <td className="AllCompany-table-ellipsis">{user?.email || "N/A"}</td>
                        <td>
                          <span className="AllCompany-info-chip">{getUserDepartment(user)}</span>
                        </td>
                        <td>
                          <span className="AllCompany-role-chip">{getUserJobRole(user)}</span>
                        </td>
                        <td>{getUserPhone(user)}</td>
                        <td>
                          <span className={`AllCompany-status-badge AllCompany-status-${status.tone}`}>
                            <span className="AllCompany-status-dot" />
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <div className="AllCompany-row-actions">
                            <button
                              type="button"
                              className="AllCompany-icon-button"
                              onClick={() => setRowMenuOpenId(prev => (prev === userId ? null : userId))}
                              aria-label="Open actions"
                            >
                              <span className="material-icons">more_vert</span>
                            </button>

                            {rowMenuOpenId === userId && (
                              <div className="AllCompany-row-menu">
                                <button type="button" onClick={() => {
                                  setRowMenuOpenId(null);
                                  handleCopy(user?.email || "");
                                }}>
                                  <span className="material-icons">mail</span>
                                  Copy Email
                                </button>
                                <button type="button" onClick={() => {
                                  setRowMenuOpenId(null);
                                  handleCopy(getUserPhone(user));
                                }}>
                                  <span className="material-icons">call</span>
                                  Copy Phone
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="AllCompany-empty-state">
                        <span className="material-icons">groups_off</span>
                        <strong>No users found</strong>
                        <p>Try another search term or remove the active filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="AllCompany-footer">
            <p>
              Showing {startItem} to {endItem} of {total} users
            </p>

            <div className="AllCompany-pagination">
              <button type="button" className="AllCompany-page-btn" disabled={currentPage === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>
                <span className="material-icons">chevron_left</span>
              </button>

              {getPaginationItems(currentPage, totalPages).map(item => (
                item === "ellipsis-left" || item === "ellipsis-right" ? (
                  <span key={item} className="AllCompany-page-ellipsis">...</span>
                ) : (
                  <button
                    type="button"
                    key={item}
                    className={`AllCompany-page-btn ${item === currentPage ? "is-active" : ""}`}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                )
              ))}

              <button type="button" className="AllCompany-page-btn" disabled={currentPage === totalPages} onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}>
                <span className="material-icons">chevron_right</span>
              </button>
            </div>

            <label className="AllCompany-page-size">
              <span>Per page</span>
              <select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}>
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};

const getUserCountLabel = count => `${count} ${count === 1 ? "member" : "members"}`;

export default CompanyUsersPage;
