import React, { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import { invalidateGetCache } from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import {
  Add,
  AdminPanelSettingsOutlined,
  ArrowBackIosNew,
  ArrowForwardIos,
  AssignmentIndOutlined,
  CalendarMonthOutlined,
  DeleteOutline,
  EditOutlined,
  FilterAltOutlined,
  GroupsOutlined,
  KeyboardArrowRight,
  LanguageOutlined,
  Close,
  LockOutlined,
  PersonOutline,
  Search,
  ShieldOutlined,
  VisibilityOutlined,
  WorkOutline,
  DescriptionOutlined,
  DashboardCustomizeOutlined,
  InsightsOutlined,
  ViewColumnOutlined,
} from "@mui/icons-material";
import "./PageManagement.css";

const FALLBACK_PAGES = [
  { pageKey: "emp-details", name: "Employee Details", path: "/ciisUser/emp-details", permissionPattern: "viewEdit" },
  { pageKey: "emp-leaves", name: "Employee Leaves", path: "/ciisUser/emp-leaves", permissionPattern: "approveReject" },
  { pageKey: "emp-assets", name: "Employee Assets", path: "/ciisUser/emp-assets", permissionPattern: "approveReject" },
  { pageKey: "emp-attendance", name: "Employee Attendance", path: "/ciisUser/emp-attendance", permissionPattern: "viewEdit" },
  { pageKey: "manage-groups", name: "Manage Groups", path: "/ciisUser/manage-groups", permissionPattern: "viewEdit" },
  { pageKey: "company-all-task", name: "Company All Task", path: "/ciisUser/company-all-task", permissionPattern: "viewEdit" },
  { pageKey: "department", name: "Department", path: "/ciisUser/department", permissionPattern: "viewEdit" },
  { pageKey: "JobRoleManagement", name: "Job Role Management", path: "/ciisUser/JobRoleManagement", permissionPattern: "viewEdit" },
  { pageKey: "SidebarManagement", name: "Sidebar Management", path: "/ciisUser/SidebarManagement", permissionPattern: "viewEdit" },
  { pageKey: "salary-component", name: "Salary Component", path: "/ciisUser/salary-component", permissionPattern: "viewEdit" },
  { pageKey: "salary-structure", name: "Salary Structure", path: "/ciisUser/salary-structure", permissionPattern: "viewEdit" },
  { pageKey: "salary-assignment", name: "Employee Salary", path: "/ciisUser/salary-assignment", permissionPattern: "viewEdit" },
  { pageKey: "assign-salary", name: "Assign Salary", path: "/ciisUser/assign-salary", permissionPattern: "viewEdit" },
  { pageKey: "payroll-process", name: "Payroll Process", path: "/ciisUser/payroll-process", permissionPattern: "viewEdit" },
  { pageKey: "payslip", name: "Payslip", path: "/ciisUser/payslip", permissionPattern: "viewEdit" },
  { pageKey: "payroll-reports", name: "Payroll Reports", path: "/ciisUser/payroll-reports", permissionPattern: "viewEdit" },
];

const ICON_MAP = {
  "emp-details": PersonOutline,
  "emp-leaves": CalendarMonthOutlined,
  "emp-assets": WorkOutline,
  "emp-attendance": DashboardCustomizeOutlined,
  "manage-groups": GroupsOutlined,
  "company-all-task": ViewColumnOutlined,
  department: InsightsOutlined,
  JobRoleManagement: AssignmentIndOutlined,
  SidebarManagement: LockOutlined,
  "leave-policy": DescriptionOutlined,
  "salary-component": WorkOutline,
  "salary-structure": WorkOutline,
  "salary-assignment": WorkOutline,
  "assign-salary": WorkOutline,
  "payroll-process": WorkOutline,
};

const getRecordId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value.user || value.value || "").trim();
  }
  return String(value).trim();
};

const normalizeUserIds = (items = []) =>
  [...new Set((Array.isArray(items) ? items : []).map(getRecordId).filter(Boolean))];

const getUserLabel = (user) => user?.name || user?.email || "Unnamed User";
const getUserEmail = (user) => user?.email || "";
const getUserInitials = (user) => {
  const label = getUserLabel(user);
  const parts = label.split(" ").filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const getPagePermissionSummary = (page) => {
  const viewCount = page?.viewUsers?.length || 0;
  const editCount = page?.editUsers?.length || 0;
  const deleteCount = page?.deleteUsers?.length || 0;
  const approverCount = page?.approvers?.length || 0;

  if (page?.permissionPattern === "approveReject") {
    return `${viewCount} view user(s) / ${approverCount} approve-reject user(s) / ${deleteCount} delete user(s)`;
  }

  return `${viewCount} view user(s) / ${editCount} edit user(s) / ${deleteCount} delete user(s)`;
};

const getPermissionTabs = (page) => {
  if (page?.permissionPattern === "approveReject") {
    return [
      { key: "view", label: "View Users", icon: VisibilityOutlined, count: page?.viewUsers?.length || 0 },
      { key: "approve", label: "Approve / Reject", icon: ShieldOutlined, count: page?.approvers?.length || 0 },
      { key: "delete", label: "Delete Users", icon: DeleteOutline, count: page?.deleteUsers?.length || 0 },
    ];
  }

  return [
    { key: "view", label: "View Users", icon: VisibilityOutlined, count: page?.viewUsers?.length || 0 },
    { key: "edit", label: "Edit Users", icon: EditOutlined, count: page?.editUsers?.length || 0 },
    { key: "delete", label: "Delete Users", icon: DeleteOutline, count: page?.deleteUsers?.length || 0 },
  ];
};

const getActiveIdsForTab = (page, tab) => {
  if (!page) return [];
  if (page.permissionPattern === "approveReject") {
    if (tab === "approve") return normalizeUserIds(page.approvers);
    if (tab === "delete") return normalizeUserIds(page.deleteUsers);
    return normalizeUserIds(page.viewUsers);
  }

  if (tab === "edit") return normalizeUserIds(page.editUsers);
  if (tab === "delete") return normalizeUserIds(page.deleteUsers);
  return normalizeUserIds(page.viewUsers);
};

const getPageTitleIcon = (pageKey) => ICON_MAP[pageKey] || DescriptionOutlined;

const normalizePage = (page) => ({
  pageKey: page?.pageKey || page?.id || page?.key || "",
  name: page?.name || page?.title || page?.pageKey || "Page",
  path: page?.path || "",
  permissionPattern: page?.permissionPattern || "viewEdit",
  approvers: normalizeUserIds(page?.approvers || []),
  viewUsers: normalizeUserIds(page?.viewUsers || []),
  editUsers: normalizeUserIds(page?.editUsers || []),
  deleteUsers: normalizeUserIds(page?.deleteUsers || []),
});

const readStoredJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredCompanyId = () => {
  const company = readStoredJson("company") || readStoredJson("companyDetails");
  return String(company?._id || company?.id || company?.companyId || "").trim();
};

const PageManagement = () => {
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [roleRules, setRoleRules] = useState([]);
  const [userRules, setUserRules] = useState([]);
  const [selectedPageKey, setSelectedPageKey] = useState("emp-details");
  const [activeTab, setActiveTab] = useState("view");
  const [pageSearch, setPageSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [draftPermissions, setDraftPermissions] = useState({
    viewIds: [],
    editIds: [],
    deleteIds: [],
    approverIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [addUsersOpen, setAddUsersOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateSelection, setCandidateSelection] = useState(new Set());
  const [scopeBranch, setScopeBranch] = useState("all");
  const [scopeDepartment, setScopeDepartment] = useState("all");

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const companyId = getStoredCompanyId();
      const [pagesRes, contextRes] = await Promise.all([
        axios.get("/page-permissions/pages"),
        axios.get("/page-permissions/data-visibility/context").catch(async (error) => {
          if (error?.response?.status !== 404) throw error;

          const [usersRes, branchesRes, departmentsRes] = await Promise.all([
            companyId ? axios.get("/users/company-users", { params: { companyId, limit: 250 } }) : Promise.resolve({ data: {} }),
            companyId ? axios.get(`/branches/company/${companyId}`).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
            companyId ? axios.get("/departments", { params: { company: companyId } }).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
          ]);

          return {
            data: {
              context: {
                users: usersRes.data?.users || usersRes.data?.message?.users || [],
                branches: branchesRes.data?.branches || branchesRes.data?.data || [],
                departments: departmentsRes.data?.departments || departmentsRes.data?.data || [],
                roleOptions: [],
                roleRules: [],
                userRules: [],
              },
            },
          };
        }),
      ]);

      const loadedPages = (pagesRes.data?.pages || []).map(normalizePage);
      const normalizedPages = loadedPages.length ? loadedPages : FALLBACK_PAGES.map(normalizePage);
      const loadedContext = contextRes.data?.context || {};

      setPages(normalizedPages);
      setUsers(Array.isArray(loadedContext.users) ? loadedContext.users : []);
      setBranches(Array.isArray(loadedContext.branches) ? loadedContext.branches : []);
      setDepartments(Array.isArray(loadedContext.departments) ? loadedContext.departments : []);
      setRoleOptions(Array.isArray(loadedContext.roleOptions) ? loadedContext.roleOptions : []);
      setRoleRules(Array.isArray(loadedContext.roleRules) ? loadedContext.roleRules : []);
      setUserRules(Array.isArray(loadedContext.userRules) ? loadedContext.userRules : []);

      const currentPage = normalizedPages.find((page) => page.pageKey === selectedPageKey) || normalizedPages[0];
      setSelectedPageKey(currentPage?.pageKey || normalizedPages[0]?.pageKey || "emp-details");
    } catch (error) {
      console.error("Failed to load page management data:", error);
      setPages(FALLBACK_PAGES.map(normalizePage));
      setMessage({ type: "error", text: error.response?.data?.error || "Failed to load page permissions." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPage = useMemo(
    () => pages.find((page) => page.pageKey === selectedPageKey) || pages[0] || null,
    [pages, selectedPageKey]
  );

  useEffect(() => {
    if (!selectedPage) return;
    setActiveTab("view");
    setDraftPermissions({
      viewIds: normalizeUserIds(selectedPage.viewUsers),
      editIds: normalizeUserIds(selectedPage.editUsers),
      deleteIds: normalizeUserIds(selectedPage.deleteUsers),
      approverIds: normalizeUserIds(selectedPage.approvers),
    });
    setCandidateSearch("");
    setPageIndex(1);
    setScopeBranch("all");
    setScopeDepartment("all");
  }, [selectedPage?.pageKey]);

  useEffect(() => {
    if (selectedPage?.permissionPattern === "approveReject") {
      if (!["view", "approve", "delete"].includes(activeTab)) {
        setActiveTab("view");
      }
    } else if (!["view", "edit", "delete"].includes(activeTab)) {
      setActiveTab("view");
    }
  }, [activeTab, selectedPage?.permissionPattern]);

  useEffect(() => {
    setPageIndex(1);
  }, [pageSearch]);

  const filteredPages = useMemo(() => {
    const query = pageSearch.trim().toLowerCase();
    if (!query) return pages;
    return pages.filter((page) => `${page.name} ${page.path} ${page.pageKey}`.toLowerCase().includes(query));
  }, [pageSearch, pages]);

  const pageSize = 8;
  const totalPageCount = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPageCount);
  const visiblePages = filteredPages.slice((safePageIndex - 1) * pageSize, safePageIndex * pageSize);

  const pageTabs = useMemo(() => getPermissionTabs(selectedPage), [selectedPage]);
  const activeIds = useMemo(() => getActiveIdsForTab(
    {
      ...selectedPage,
      viewUsers: draftPermissions.viewIds,
      editUsers: draftPermissions.editIds,
      deleteUsers: draftPermissions.deleteIds,
      approvers: draftPermissions.approverIds,
    },
    activeTab
  ), [activeTab, draftPermissions, selectedPage]);

  const activeUserMap = useMemo(() => new Map(users.map((user) => [getRecordId(user), user])), [users]);
  const activeUsers = useMemo(
    () => activeIds.map((id) => activeUserMap.get(id) || { _id: id, name: id, email: "" }),
    [activeIds, activeUserMap]
  );
  const activeUserIdSet = useMemo(() => new Set(activeIds), [activeIds]);
  const availableUsers = useMemo(
    () => users.filter((user) => !activeUserIdSet.has(getRecordId(user))),
    [activeUserIdSet, users]
  );

  const filteredAvailableUsers = useMemo(() => {
    const query = candidateSearch.trim().toLowerCase();
    if (!query) return availableUsers;
    return availableUsers.filter((user) =>
      [user?.name, user?.email, user?.jobRole, user?.companyRole]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [availableUsers, candidateSearch]);

  const stats = useMemo(() => {
    const totalPages = pages.length;
    const configuredPages = pages.filter((page) =>
      (page.viewUsers?.length || 0) > 0 ||
      (page.editUsers?.length || 0) > 0 ||
      (page.deleteUsers?.length || 0) > 0 ||
      (page.approvers?.length || 0) > 0
    ).length;
    const permissionsSet = pages.reduce(
      (sum, page) =>
        sum +
        (page.viewUsers?.length || 0) +
        (page.editUsers?.length || 0) +
        (page.deleteUsers?.length || 0) +
        (page.approvers?.length || 0),
      0
    );

    return [
      { label: "Total Pages", value: totalPages, caption: "All pages", tone: "blue", icon: DescriptionOutlined },
      { label: "Configured Pages", value: configuredPages, caption: "Configured", tone: "green", icon: ShieldOutlined },
      { label: "Total Users", value: users.length, caption: "In organization", tone: "orange", icon: GroupsOutlined },
      { label: "Permissions Set", value: permissionsSet, caption: "Active permissions", tone: "violet", icon: AdminPanelSettingsOutlined },
    ];
  }, [pages, users.length]);

  const syncSelectionToActiveTab = (nextIds) => {
    const normalized = normalizeUserIds(nextIds);
    setDraftPermissions((prev) => {
      if (!selectedPage) return prev;
      if (selectedPage.permissionPattern === "approveReject") {
        if (activeTab === "approve") return { ...prev, approverIds: normalized };
        if (activeTab === "delete") return { ...prev, deleteIds: normalized };
        return { ...prev, viewIds: normalized };
      }

      if (activeTab === "edit") return { ...prev, editIds: normalized };
      if (activeTab === "delete") return { ...prev, deleteIds: normalized };
      return { ...prev, viewIds: normalized };
    });
  };

  const removeUserFromActiveTab = (userId) => {
    const normalizedId = getRecordId(userId);
    setDraftPermissions((prev) => {
      if (selectedPage?.permissionPattern === "approveReject") {
        if (activeTab === "approve") return { ...prev, approverIds: prev.approverIds.filter((id) => id !== normalizedId) };
        if (activeTab === "delete") return { ...prev, deleteIds: prev.deleteIds.filter((id) => id !== normalizedId) };
        return { ...prev, viewIds: prev.viewIds.filter((id) => id !== normalizedId) };
      }

      if (activeTab === "edit") return { ...prev, editIds: prev.editIds.filter((id) => id !== normalizedId) };
      if (activeTab === "delete") return { ...prev, deleteIds: prev.deleteIds.filter((id) => id !== normalizedId) };
      return { ...prev, viewIds: prev.viewIds.filter((id) => id !== normalizedId) };
    });
  };

  const openAddUsersDialog = () => {
    setCandidateSelection(new Set(activeIds));
    setCandidateSearch("");
    setAddUsersOpen(true);
  };

  const toggleCandidateSelection = (userId) => {
    const normalizedId = getRecordId(userId);
    setCandidateSelection((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
      return next;
    });
  };

  const confirmCandidateSelection = () => {
    syncSelectionToActiveTab([...candidateSelection]);
    setAddUsersOpen(false);
  };

  const savePermissions = async () => {
    if (!selectedPage) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        viewUserIds: draftPermissions.viewIds,
        editUserIds: draftPermissions.editIds,
        deleteUserIds: draftPermissions.deleteIds,
        approverIds: draftPermissions.approverIds,
      };

      const res = await axios.put(`/page-permissions/${selectedPage.pageKey}`, payload);
      invalidateGetCache("/page-permissions");
      const updatedPage = normalizePage(res.data?.page || selectedPage);

      setPages((prev) =>
        prev.map((page) => (page.pageKey === updatedPage.pageKey ? { ...page, ...updatedPage } : page))
      );
      setSelectedPageKey(updatedPage.pageKey);
      setMessage({ type: "success", text: "Page permissions saved successfully." });
    } catch (error) {
      console.error("Failed to save page permissions:", error);
      setMessage({ type: "error", text: error.response?.data?.error || "Unable to save page permissions." });
    } finally {
      setSaving(false);
    }
  };

  const selectedPermissionCount = activeIds.length;
  const SelectedPageIcon = getPageTitleIcon(selectedPage?.pageKey);
  const selectedPageStatus = selectedPage?.permissionPattern ? "Configured" : "Unconfigured";

  if (loading) return <CIISLoader />;

  return (
    <div className="pm-page">
      <div className="pm-shell">
        <div className="pm-topbar">
          <div>
            <h1 className="pm-title">Page Management</h1>
            <p className="pm-subtitle">
              Configure page-level permissions and control access for your organization.
            </p>
          </div>

          <button type="button" className="pm-primary-btn">
            <Add />
            Add New Page
          </button>
        </div>

        {message && (
          <div className={`pm-message pm-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="pm-stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className={`pm-stat-card pm-${stat.tone}`}>
                <div className="pm-stat-icon">
                  <Icon />
                </div>
                <div className="pm-stat-copy">
                  <div className="pm-stat-label">{stat.label}</div>
                  <div className="pm-stat-value">{stat.value}</div>
                  <div className="pm-stat-caption">{stat.caption}</div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="pm-grid">
          <aside className="pm-sidebar">
            <div className="pm-card pm-sidebar-card">
              <div className="pm-card-head">
                <h2>Pages</h2>
              </div>

              <div className="pm-search-row">
                <div className="pm-search">
                  <Search className="pm-search-icon" />
                  <input
                    type="search"
                    placeholder="Search pages..."
                    value={pageSearch}
                    onChange={(event) => setPageSearch(event.target.value)}
                  />
                </div>
                <button type="button" className="pm-icon-btn" aria-label="Filter pages">
                  <FilterAltOutlined />
                </button>
              </div>

              <div className="pm-page-list">
                {visiblePages.map((page) => {
                  const Icon = getPageTitleIcon(page.pageKey);
                  const selected = selectedPageKey === page.pageKey;
                  return (
                    <button
                      key={page.pageKey}
                      type="button"
                      className={`pm-page-item ${selected ? "is-active" : ""}`}
                      onClick={() => setSelectedPageKey(page.pageKey)}
                    >
                      <span className="pm-page-icon">
                        <Icon />
                      </span>
                      <span className="pm-page-meta">
                        <strong>{page.name}</strong>
                        <span>{page.path}</span>
                        <small>{getPagePermissionSummary(page)}</small>
                      </span>
                      <KeyboardArrowRight className="pm-page-arrow" />
                    </button>
                  );
                })}
              </div>

              <div className="pm-pagination">
                <button
                  type="button"
                  className="pm-page-nav"
                  onClick={() => setPageIndex((v) => Math.max(1, v - 1))}
                  disabled={safePageIndex <= 1}
                >
                  <ArrowBackIosNew />
                </button>
                <button type="button" className="pm-page-current">{safePageIndex}</button>
                <button
                  type="button"
                  className="pm-page-nav"
                  onClick={() => setPageIndex((v) => Math.min(totalPageCount, v + 1))}
                  disabled={safePageIndex >= totalPageCount}
                >
                  <ArrowForwardIos />
                </button>
              </div>
            </div>
          </aside>

          <main className="pm-main">
            <section className="pm-card pm-main-card">
              <div className="pm-page-header">
                <div className="pm-page-heading">
                  <div className="pm-page-avatar">
                    <SelectedPageIcon />
                  </div>
                  <div>
                    <div className="pm-page-title-row">
                      <h2>{selectedPage?.name || "Select Page"}</h2>
                      <span className="pm-status-pill">{selectedPageStatus}</span>
                    </div>
                    <p>{selectedPage?.path || "No page selected"}</p>
                  </div>
                </div>

                <div className="pm-header-actions">
                  <button type="button" className="pm-outline-btn">
                    <InsightsOutlined />
                    Page Summary
                  </button>
                  <button type="button" className="pm-primary-btn pm-save-btn" onClick={savePermissions} disabled={saving || !selectedPage}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              <div className="pm-tabs">
                {pageTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={`pm-tab ${active ? "is-active" : ""}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <Icon />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="pm-users-head">
                <div>
                  <div className="pm-section-title">
                    Users with {
                      activeTab === "approve" ? "Approve / Reject" : activeTab === "edit" ? "Edit" : "View"
                    } Access
                    <span>{selectedPermissionCount}</span>
                  </div>
                  <p>
                    These users can {
                      activeTab === "approve" ? "approve or reject" : activeTab === "edit" ? "edit" : "view"
                    } {selectedPage?.name || "this page"}.
                  </p>
                </div>
                <button type="button" className="pm-outline-btn pm-add-users" onClick={openAddUsersDialog}>
                  <Add />
                  Add Users
                </button>
              </div>

              <div className="pm-table-wrap">
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Added On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.length ? (
                      activeUsers.map((user) => (
                        <tr key={getRecordId(user)}>
                          <td>
                            <div className="pm-user-cell">
                              <span className="pm-user-badge">{getUserInitials(user)}</span>
                              <div>
                                <strong>{getUserLabel(user)}</strong>
                                <span>{getUserEmail(user)}</span>
                              </div>
                            </div>
                          </td>
                          <td>{user?.companyRole || user?.jobRole || "User"}</td>
                          <td>{user?.department?.name || user?.department || "N/A"}</td>
                          <td>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "N/A"}</td>
                          <td>
                            <button
                              type="button"
                              className="pm-trash-btn"
                              aria-label={`Delete ${getUserLabel(user)}`}
                              onClick={() => removeUserFromActiveTab(user)}
                            >
                              <DeleteOutline />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="pm-empty-row">
                          No users found for this permission.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pm-view-all-wrap">
                <button type="button" className="pm-view-all-btn">
                  View All ({selectedPermissionCount})
                </button>
              </div>
            </section>

            <section className="pm-bottom-grid">
              <div className="pm-card pm-mini-card">
                <div className="pm-mini-head">
                  <div className="pm-mini-title">
                    <VisibilityOutlined />
                    <div>
                      <h3>Data Visibility</h3>
                      <p>Manage role defaults and user-specific overrides.</p>
                    </div>
                  </div>
                </div>

                <div className="pm-visibility-item">
                  <div className="pm-visibility-left">
                    <span className="pm-visibility-icon green">
                      <ShieldOutlined />
                    </span>
                    <div>
                      <strong>Role Defaults</strong>
                      <p>Permissions inherited by roles</p>
                    </div>
                  </div>
                  <span className="pm-chip">{roleRules.length || roleOptions.length || 0} Roles</span>
                </div>

                <div className="pm-visibility-item">
                  <div className="pm-visibility-left">
                    <span className="pm-visibility-icon blue">
                      <PersonOutline />
                    </span>
                    <div>
                      <strong>User Overrides</strong>
                      <p>Custom permissions for specific users</p>
                    </div>
                  </div>
                  <span className="pm-chip">{userRules.length || 0} Users</span>
                </div>
              </div>

              <div className="pm-card pm-mini-card">
                <div className="pm-mini-head">
                  <div className="pm-mini-title">
                    <LanguageOutlined />
                    <div>
                      <h3>Scope</h3>
                      <p>Define the coverage for this page.</p>
                    </div>
                  </div>
                </div>

                <div className="pm-scope-grid">
                  <div className="pm-scope-field">
                    <label>Branch</label>
                    <div className="pm-select">
                      <span><WorkOutline /></span>
                      <select value={scopeBranch} onChange={(event) => setScopeBranch(event.target.value)}>
                        <option value="all">All Branches</option>
                        {branches.map((branch) => {
                          const id = getRecordId(branch);
                          return (
                            <option key={id || branch?.name} value={id}>
                              {branch?.name || branch?.branchCode || "Branch"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="pm-scope-field">
                    <label>Department</label>
                    <div className="pm-select">
                      <span><GroupsOutlined /></span>
                      <select value={scopeDepartment} onChange={(event) => setScopeDepartment(event.target.value)}>
                        <option value="all">All Departments</option>
                        {departments.map((department) => {
                          const id = getRecordId(department);
                          return (
                            <option key={id || department?.name} value={id}>
                              {department?.name || department?.departmentName || "Department"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pm-info-strip">
                  <span className="pm-info-dot">i</span>
                  This permission applies to all branches and departments.
                </div>
              </div>
            </section>

            <section className="pm-card pm-summary-card">
              <div className="pm-summary-left">
                <div className="pm-mini-title">
                  <InsightsOutlined />
                  <div>
                    <h3>Permission Summary</h3>
                    <p>
                      {pageTabs.map((tab) => `${tab.count} ${tab.key} user(s)`).join(" - ")}
                    </p>
                  </div>
                </div>
              </div>

              <button type="button" className="pm-outline-btn">
                <InsightsOutlined />
                View Full Summary
              </button>
            </section>
          </main>
        </div>
      </div>

      {addUsersOpen && (
        <div className="pm-modal-backdrop" role="presentation" onClick={() => setAddUsersOpen(false)}>
          <div className="pm-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <div className="pm-modal-header">
                <div>
                  <h3>Add Users</h3>
                  <p>{selectedPage?.name || "Select a page"} - choose users for the current access tab.</p>
                </div>
                <button type="button" className="pm-icon-btn" onClick={() => setAddUsersOpen(false)} aria-label="Close">
                <Close />
                </button>
              </div>

            <div className="pm-search-row pm-modal-search">
              <div className="pm-search">
                <Search className="pm-search-icon" />
                <input
                  type="search"
                  placeholder="Search users..."
                  value={candidateSearch}
                  onChange={(event) => setCandidateSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="pm-modal-list">
              {filteredAvailableUsers.length ? (
                filteredAvailableUsers.map((user) => {
                  const userId = getRecordId(user);
                  const checked = candidateSelection.has(userId);
                  return (
                    <label key={userId} className={`pm-modal-user ${checked ? "is-selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCandidateSelection(user)}
                      />
                      <span className="pm-user-badge">{getUserInitials(user)}</span>
                      <span className="pm-modal-user-meta">
                        <strong>{getUserLabel(user)}</strong>
                        <small>{getUserEmail(user)}</small>
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="pm-empty-row">No available users found.</div>
              )}
            </div>

            <div className="pm-modal-footer">
              <button type="button" className="pm-outline-btn" onClick={() => setAddUsersOpen(false)}>
                Cancel
              </button>
              <button type="button" className="pm-primary-btn" onClick={confirmCandidateSelection}>
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManagement;
