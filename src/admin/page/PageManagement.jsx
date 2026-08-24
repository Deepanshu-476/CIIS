import React, { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import { invalidateGetCache } from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  AssignmentIndOutlined,
  CalendarMonthOutlined,
  DeleteOutline,
  EditOutlined,
  FilterAltOutlined,
  GroupsOutlined,
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
  { pageKey: "leave-policy", name: "Leave Policy", path: "/ciisUser/leave-policy", permissionPattern: "viewEdit" },
  { pageKey: "emp-assets", name: "Employee Assets", path: "/ciisUser/emp-assets", permissionPattern: "approveReject" },
  { pageKey: "emp-attendance", name: "Employee Attendance", path: "/ciisUser/emp-attendance", permissionPattern: "viewEdit" },
  { pageKey: "department", name: "Department Management", path: "/ciisUser/department", permissionPattern: "viewEdit" },
  { pageKey: "JobRoleManagement", name: "Job Role Management", path: "/ciisUser/JobRoleManagement", permissionPattern: "viewEdit" },
  { pageKey: "manage-groups", name: "Manage Groups", path: "/ciisUser/manage-groups", permissionPattern: "viewEdit" },
  { pageKey: "company-all-task", name: "Company All Task", path: "/ciisUser/company-all-task", permissionPattern: "viewEdit" },
];

const ICON_MAP = {
  "emp-details": PersonOutline,
  "emp-leaves": CalendarMonthOutlined,
  "leave-policy": DescriptionOutlined,
  "emp-assets": WorkOutline,
  "emp-attendance": DashboardCustomizeOutlined,
  department: InsightsOutlined,
  JobRoleManagement: AssignmentIndOutlined,
  "manage-groups": GroupsOutlined,
  "company-all-task": ViewColumnOutlined,
};

const getRecordId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value.user || value.value || "").trim();
  }
  return String(value).trim();
};

const normalizeRoleToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const normalizeAccessKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/^ciisuser\//, "")
    .replace(/^client\//, "")
    .replace(/[?#].*$/, "");

const getRouteLeaf = (value) => normalizeAccessKey(value).split("/").filter(Boolean).pop() || "";

const normalizeUserIds = (items = []) =>
  [...new Set((Array.isArray(items) ? items : []).map(getRecordId).filter(Boolean))];

const normalizeScopeIds = (items = []) =>
  [...new Set((Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean))];

const getUserLabel = (user) => user?.name || user?.email || "Unnamed User";
const getUserEmail = (user) => user?.email || "";
const getUserInitials = (user) => {
  const label = getUserLabel(user);
  const parts = label.split(" ").filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const getPagePermissionMetric = (page) => ({
  view: normalizeUserIds(page?.viewUsers).length,
  edit: normalizeUserIds(page?.editUsers).length,
  delete: normalizeUserIds(page?.deleteUsers).length,
  approve: normalizeUserIds(page?.approvers).length,
});

const getAccessTypeLabel = (accessType, page) => {
  if (accessType === "approve") return "Approve / Reject";
  if (accessType === "edit") return "Edit";
  if (accessType === "delete") return "Delete";
  return page?.permissionPattern === "approveReject" ? "View" : "View";
};

const getPageAccessTypeOptions = (page) => {
  const options = [{ value: "view", label: "View" }];
  if (page?.permissionPattern === "approveReject") {
    options.push({ value: "approve", label: "Approve / Reject" });
  } else {
    options.push({ value: "edit", label: "Edit" });
  }
  options.push({ value: "delete", label: "Delete" });
  return options;
};

const getPageUserIdsForAccessType = (page, accessType) => {
  if (!page) return [];
  if (accessType === "approve") return normalizeUserIds(page.approvers);
  if (accessType === "edit") return normalizeUserIds(page.editUsers);
  if (accessType === "delete") return normalizeUserIds(page.deleteUsers);
  return normalizeUserIds(page.viewUsers);
};

const getPageScopeSummaryForAccessType = (page, accessType, branches = [], departments = []) => {
  const scopes = Array.isArray(page?.userAccessScopes) ? page.userAccessScopes : [];
  const scopeKey = accessType === "approve" ? "approve" : accessType;
  const pageUserIds = new Set(getPageUserIdsForAccessType(page, scopeKey));

  const summaries = scopes
    .filter((scope) => String(scope?.accessType || "").trim().toLowerCase() === scopeKey)
    .filter((scope) => {
      const userId = getRecordId(scope?.user);
      return !pageUserIds.size || pageUserIds.has(userId);
    })
    .map((scope) => getScopeSummary(scope, branches, departments));

  if (!summaries.length) return "";
  return [...new Set(summaries)].join(" | ");
};

const getPageAccessScopeCategory = (page) => {
  const scopes = Array.isArray(page?.userAccessScopes) ? page.userAccessScopes : [];
  if (!scopes.length) return "all";

  const hasDepartmentLimit = scopes.some((scope) => {
    const departmentIds = normalizeScopeIds(scope?.departmentIds || ["all"]);
    return departmentIds.length > 0 && !departmentIds.includes("all");
  });
  const hasBranchLimit = scopes.some((scope) => {
    const branchIds = normalizeScopeIds(scope?.branchIds || ["all"]);
    return branchIds.length > 0 && !branchIds.includes("all");
  });

  if (hasBranchLimit && hasDepartmentLimit) return "branch-department";
  if (hasBranchLimit) return "branch";
  if (hasDepartmentLimit) return "department";
  return "all";
};

const getPageAccessScopeLabel = (page) => {
  const category = getPageAccessScopeCategory(page);
  if (category === "department") return "Department";
  if (category === "branch") return "Branch";
  if (category === "branch-department") return "Branch + Dept";
  return "All Users";
};

const getPageStatusLabel = (page) => {
  const metrics = getPagePermissionMetric(page);
  return metrics.view || metrics.edit || metrics.delete || metrics.approve ? "Active" : "Inactive";
};

const getPermissionPatternLabel = (page) =>
  page?.permissionPattern === "approveReject" ? "approveReject" : "viewEdit";

const getPermissionPatternTone = (page) =>
  page?.permissionPattern === "approveReject" ? "green" : "blue";

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

const getScopeLabel = (ids = [], options = [], fallback = "All") => {
  const normalizedIds = normalizeScopeIds(ids);
  if (!normalizedIds.length || normalizedIds.includes("all")) return fallback;

  const labels = normalizedIds
    .map((id) => options.find((option) => getRecordId(option) === id))
    .map((option) => option?.name || option?.branchCode || option?.departmentName || option?.title)
    .filter(Boolean);

  return labels.length ? labels.join(", ") : fallback;
};

const getScopeSummary = (scope = {}, branches = [], departments = []) => {
  const branchLabel = getScopeLabel(scope.branchIds, branches, "All Branches");
  const departmentLabel = getScopeLabel(scope.departmentIds, departments, "All Departments");
  return `${branchLabel} / ${departmentLabel}`;
};

const DEFAULT_SCOPE = { branchIds: ["all"], departmentIds: ["all"] };

const normalizeScopeValue = (scope = DEFAULT_SCOPE) => ({
  branchIds: normalizeScopeIds(scope.branchIds || ["all"]),
  departmentIds: normalizeScopeIds(scope.departmentIds || ["all"]),
});

const buildScopeMapByTab = (scopes = []) => {
  const result = {
    view: {},
    edit: {},
    delete: {},
    approve: {},
  };

  (Array.isArray(scopes) ? scopes : []).forEach((scope) => {
    const accessType = String(scope?.accessType || "").trim().toLowerCase();
    const userId = getRecordId(scope?.user);
    if (!userId || !result[accessType]) return;
    result[accessType][userId] = normalizeScopeValue(scope);
  });

  return result;
};

const getPageAccessKeys = (page) => {
  const keys = new Set();
  const pushKey = (value) => {
    const normalized = normalizeAccessKey(value);
    if (normalized) keys.add(normalized);
  };

  pushKey(page?.name);
  pushKey(page?.pageKey);
  pushKey(page?.path);
  pushKey(page?.path?.replace(/^\/+/, ""));
  pushKey(page?.path?.replace(/^\/ciisUser\//i, ""));
  pushKey(page?.path?.replace(/^\/client\//i, ""));
  pushKey(getRouteLeaf(page?.path));

  return keys;
};

const getRoleDisplayName = (value, jobRoleNameById) => {
  if (!value) return "";
  if (typeof value === "object") {
    return value.name || value.roleName || value.title || value.jobRoleName || "";
  }

  const raw = String(value).trim();
  return jobRoleNameById?.get(raw) || raw;
};

const getUserRoleTokens = (user, jobRoleNameById) => {
  const rawValues = [
    user?.jobRole,
    user?.jobRoleName,
  ];

  const tokens = new Set();
  rawValues.forEach((value) => {
    if (!value) return;
    if (typeof value === "object") {
      [
        value._id,
        value.id,
        value.jobRole,
        value.role,
        value.roleId,
        value.roleName,
        value.name,
        value.title,
      ]
        .filter(Boolean)
        .forEach((item) => {
          tokens.add(normalizeRoleToken(item));
          const mapped = jobRoleNameById?.get(String(item).trim());
          if (mapped) tokens.add(normalizeRoleToken(mapped));
        });
      return;
    }

    tokens.add(normalizeRoleToken(value));
    const mapped = jobRoleNameById?.get(String(value).trim());
    if (mapped) tokens.add(normalizeRoleToken(mapped));
  });

  return [...tokens].filter(Boolean);
};

const pageMatchesAccessKey = (pageKeys, accessKey) => {
  const normalized = normalizeAccessKey(accessKey);
  if (!normalized) return false;
  if (pageKeys.has(normalized)) return true;

  const leaf = getRouteLeaf(normalized);
  return Boolean(leaf && pageKeys.has(leaf));
};

const normalizePage = (page) => ({
  pageKey: page?.pageKey || page?.id || page?.key || "",
  name: page?.name || page?.title || page?.pageKey || "Page",
  path: page?.path || "",
  permissionPattern: page?.permissionPattern || "viewEdit",
  jobRole: page?.jobRole || page?.jobRoleName || page?.role || "",
  jobRoles: Array.isArray(page?.jobRoles) ? page.jobRoles : [],
  accessRoles: Array.isArray(page?.accessRoles) ? page.accessRoles : [],
  userAccessScopes: Array.isArray(page?.userAccessScopes) ? page.userAccessScopes : [],
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
  const [jobRoles, setJobRoles] = useState([]);
  const [sidebarConfigs, setSidebarConfigs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedPageKey, setSelectedPageKey] = useState("emp-details");
  const [activeTab, setActiveTab] = useState("view");
  const [pageSearch, setPageSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [permissionTypeFilter, setPermissionTypeFilter] = useState("all");
  const [accessScopeFilter, setAccessScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [draftPermissions, setDraftPermissions] = useState({
    viewIds: [],
    editIds: [],
    deleteIds: [],
    approverIds: [],
  });
  const [draftScopes, setDraftScopes] = useState({
    view: { branchIds: ["all"], departmentIds: ["all"] },
    edit: { branchIds: ["all"], departmentIds: ["all"] },
    delete: { branchIds: ["all"], departmentIds: ["all"] },
    approve: { branchIds: ["all"], departmentIds: ["all"] },
  });
  const [draftUserScopes, setDraftUserScopes] = useState({
    view: {},
    edit: {},
    delete: {},
    approve: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [addUsersOpen, setAddUsersOpen] = useState(false);
  const [summaryModal, setSummaryModal] = useState({
    open: false,
    pageKey: "",
    accessType: "view",
  });
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateSelection, setCandidateSelection] = useState(new Set());
  const [candidateUserScopes, setCandidateUserScopes] = useState({});

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const companyId = getStoredCompanyId();
      const [pagesRes, contextRes, jobRolesRes, sidebarConfigsRes] = await Promise.all([
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
              },
            },
          };
        }),
        axios.get("/job-roles", companyId ? { params: { company: companyId } } : undefined).catch(() => ({ data: {} })),
        companyId
          ? axios.get("/sidebar", { params: { companyId } }).catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      const loadedPages = (pagesRes.data?.pages || []).map(normalizePage);
      const normalizedPages = loadedPages.length ? loadedPages : FALLBACK_PAGES.map(normalizePage);
      const loadedContext = contextRes.data?.context || {};
      const loadedJobRoles = Array.isArray(jobRolesRes.data?.jobRoles)
        ? jobRolesRes.data.jobRoles
        : Array.isArray(jobRolesRes.data?.data)
          ? jobRolesRes.data.data
          : Array.isArray(jobRolesRes.data)
            ? jobRolesRes.data
            : [];
      const loadedSidebarConfigs = Array.isArray(sidebarConfigsRes.data?.data) ? sidebarConfigsRes.data.data : [];

      setPages(normalizedPages);
      setUsers(Array.isArray(loadedContext.users) ? loadedContext.users : []);
      setJobRoles(loadedJobRoles);
      setSidebarConfigs(loadedSidebarConfigs);
      setBranches(Array.isArray(loadedContext.branches) ? loadedContext.branches : []);
      setDepartments(Array.isArray(loadedContext.departments) ? loadedContext.departments : []);

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
    const scopeByTab = { view: { branchIds: ["all"], departmentIds: ["all"] }, edit: { branchIds: ["all"], departmentIds: ["all"] }, delete: { branchIds: ["all"], departmentIds: ["all"] }, approve: { branchIds: ["all"], departmentIds: ["all"] } };
    (Array.isArray(selectedPage.userAccessScopes) ? selectedPage.userAccessScopes : []).forEach((scope) => {
      const accessType = String(scope?.accessType || "").trim().toLowerCase();
      if (!["view", "edit", "delete", "approve"].includes(accessType)) return;
      if (!scopeByTab[accessType] || scopeByTab[accessType].branchIds[0] !== "all") return;
      scopeByTab[accessType] = {
        branchIds: normalizeScopeIds(scope.branchIds || ["all"]),
        departmentIds: normalizeScopeIds(scope.departmentIds || ["all"]),
      };
    });
    setDraftScopes(scopeByTab);
    setDraftUserScopes(buildScopeMapByTab(selectedPage.userAccessScopes));
    setCandidateSearch("");
    setPageIndex(1);
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
    return pages.filter((page) => {
      const searchMatch = !query || `${page.name} ${page.path} ${page.pageKey}`.toLowerCase().includes(query);
      const permissionMatch = permissionTypeFilter === "all" || page.permissionPattern === permissionTypeFilter;
      const accessScopeKey = accessScopeFilter === "all-users" ? "all" : accessScopeFilter;
      const accessScopeMatch = accessScopeFilter === "all" || getPageAccessScopeCategory(page) === accessScopeKey;
      const statusMatch = statusFilter === "all" || getPageStatusLabel(page).toLowerCase() === statusFilter;
      return searchMatch && permissionMatch && accessScopeMatch && statusMatch;
    });
  }, [accessScopeFilter, pageSearch, pages, permissionTypeFilter, statusFilter]);

  const pageSize = 8;
  const totalPageCount = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPageCount);
  const visiblePages = filteredPages.slice((safePageIndex - 1) * pageSize, safePageIndex * pageSize);

  const jobRoleNameById = useMemo(() => {
    const map = new Map();
    jobRoles.forEach((role) => {
      const id = getRecordId(role);
      const name = role?.name || role?.roleName || role?.title || role?.jobRoleName || "";
      if (id && name) {
        map.set(id, name);
      }
    });
    return map;
  }, [jobRoles]);

  const usersById = useMemo(() => {
    const map = new Map();
    users.forEach((user) => {
      const id = getRecordId(user);
      if (id) map.set(id, user);
    });
    return map;
  }, [users]);

  const selectedPageAccessKeys = useMemo(() => getPageAccessKeys(selectedPage), [selectedPage]);
  const selectedSidebarConfigs = useMemo(() => {
    if (!selectedPage || !selectedPageAccessKeys.size) return [];
    return sidebarConfigs.filter((config) => (
      Array.isArray(config?.menuItems) &&
      config.menuItems.some((item) => pageMatchesAccessKey(selectedPageAccessKeys, item?.id || item?.path || item?.name))
    ));
  }, [selectedPage, selectedPageAccessKeys, sidebarConfigs]);

  const selectedPageRoleNames = useMemo(() => {
    const fromSidebarConfigs = selectedSidebarConfigs
      .flatMap((config) => {
        const displayName = getRoleDisplayName(config?.role, jobRoleNameById);
        return displayName ? [String(displayName).trim()] : [];
      })
      .filter(Boolean);

    if (fromSidebarConfigs.length > 0) {
      return [...new Set(fromSidebarConfigs)];
    }

    if (!selectedPage) return [];

    const fromPageFields = [
      selectedPage.jobRole,
      ...(Array.isArray(selectedPage.jobRoles) ? selectedPage.jobRoles : []),
      ...(Array.isArray(selectedPage.accessRoles) ? selectedPage.accessRoles : []),
    ]
      .map((value) => getRoleDisplayName(value, jobRoleNameById))
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return [...new Set(fromPageFields)];
  }, [jobRoleNameById, selectedPage, selectedSidebarConfigs]);

  const selectedPageRoleTokenSet = useMemo(
    () => new Set(selectedPageRoleNames.map(normalizeRoleToken).filter(Boolean)),
    [selectedPageRoleNames]
  );

  const getActiveScopeKey = () => {
    if (selectedPage?.permissionPattern === "approveReject") {
      if (activeTab === "approve") return "approve";
      if (activeTab === "delete") return "delete";
      return "view";
    }

    if (activeTab === "edit") return "edit";
    if (activeTab === "delete") return "delete";
    return "view";
  };

  const isRoleScopedPage = selectedPageRoleTokenSet.size > 0;
  const isUserVisibleForSelectedPage = (user) => {
    if (!isRoleScopedPage) return true;
    const userTokens = getUserRoleTokens(user, jobRoleNameById);
    return userTokens.some((token) => selectedPageRoleTokenSet.has(token));
  };

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

  const visibleUsers = useMemo(
    () => users.filter((user) => isUserVisibleForSelectedPage(user)),
    [jobRoleNameById, isRoleScopedPage, selectedPageRoleTokenSet, users]
  );

  const activeUserIdSet = useMemo(() => new Set(activeIds), [activeIds]);
  const modalUsers = useMemo(() => {
    const query = candidateSearch.trim().toLowerCase();
    const filtered = !query
      ? visibleUsers
      : visibleUsers.filter((user) =>
          [user?.name, user?.email, user?.jobRole, user?.companyRole]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        );

    return [...filtered].sort((left, right) => {
      const leftSelected = candidateSelection.has(getRecordId(left));
      const rightSelected = candidateSelection.has(getRecordId(right));
      if (leftSelected === rightSelected) return 0;
      return leftSelected ? -1 : 1;
    });
  }, [candidateSearch, candidateSelection, visibleUsers]);

  const stats = useMemo(() => {
    const totalPages = pages.length;
    const totalViewAccess = pages.reduce((sum, page) => sum + getPagePermissionMetric(page).view, 0);
    const totalEditAccess = pages.reduce((sum, page) => sum + getPagePermissionMetric(page).edit, 0);
    const totalDeleteAccess = pages.reduce((sum, page) => sum + getPagePermissionMetric(page).delete, 0);
    const totalApproveAccess = pages.reduce((sum, page) => sum + getPagePermissionMetric(page).approve, 0);

    return [
      { label: "Total Pages", value: totalPages, caption: "Active pages", tone: "violet", icon: ViewColumnOutlined },
      { label: "View Access", value: totalViewAccess, caption: "Users with access", tone: "green", icon: VisibilityOutlined },
      { label: "Edit Access", value: totalEditAccess, caption: "Users with access", tone: "orange", icon: EditOutlined },
      { label: "Delete Access", value: totalDeleteAccess, caption: "Users with access", tone: "red", icon: DeleteOutline },
      { label: "Approve / Reject", value: totalApproveAccess, caption: "Users with access", tone: "blue", icon: ShieldOutlined },
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

      if (activeTab === "edit") {
        const mergedViewIds = normalizeUserIds([...prev.viewIds, ...normalized]);
        return { ...prev, editIds: normalized, viewIds: mergedViewIds };
      }
      if (activeTab === "delete") {
        const mergedViewIds = normalizeUserIds([...prev.viewIds, ...normalized]);
        return { ...prev, deleteIds: normalized, viewIds: mergedViewIds };
      }
      return { ...prev, viewIds: normalized };
    });
  };

  const openAddUsersDialog = (page = selectedPage, tab = activeTab) => {
    if (!page) return;

    const resolvedTab = page?.permissionPattern === "approveReject"
      ? (tab === "approve" || tab === "delete" ? tab : "view")
      : (tab === "edit" || tab === "delete" ? tab : "view");

    const resolvedActiveIds = getActiveIdsForTab(
      {
        ...page,
        viewUsers: draftPermissions.viewIds,
        editUsers: draftPermissions.editIds,
        deleteUsers: draftPermissions.deleteIds,
        approvers: draftPermissions.approverIds,
      },
      resolvedTab
    );

    setSelectedPageKey(page.pageKey);
    setActiveTab(resolvedTab);
    setCandidateSelection(new Set(resolvedActiveIds));
    setCandidateSearch("");

    const scopeKey = page.permissionPattern === "approveReject"
      ? (resolvedTab === "approve" ? "approve" : resolvedTab === "delete" ? "delete" : "view")
      : (resolvedTab === "edit" ? "edit" : resolvedTab === "delete" ? "delete" : "view");
    const baseScope = draftScopes[scopeKey] || DEFAULT_SCOPE;
    const existingScopes = draftUserScopes[scopeKey] || {};
    const nextCandidateScopes = {};

    resolvedActiveIds.forEach((userId) => {
      nextCandidateScopes[userId] = existingScopes[userId] || normalizeScopeValue(baseScope);
    });

    setCandidateUserScopes(nextCandidateScopes);
    setAddUsersOpen(true);
  };

  const toggleCandidateSelection = (userId) => {
    const normalizedId = getRecordId(userId);
    setCandidateSelection((prev) => {
      const next = new Set(prev);
      const scopeKey = getActiveScopeKey();
      const baseScope = normalizeScopeValue(draftScopes[scopeKey] || DEFAULT_SCOPE);

      if (next.has(normalizedId)) {
        next.delete(normalizedId);
        setCandidateUserScopes((scopePrev) => {
          const copy = { ...scopePrev };
          delete copy[normalizedId];
          return copy;
        });
      } else {
        next.add(normalizedId);
        setCandidateUserScopes((scopePrev) => ({
          ...scopePrev,
          [normalizedId]: scopePrev[normalizedId] || baseScope,
        }));
      }
      return next;
    });
  };

  const confirmCandidateSelection = () => {
    const scopeKey = getActiveScopeKey();
    setDraftUserScopes((prev) => ({
      ...prev,
      [scopeKey]: Object.fromEntries(
        [...candidateSelection].map((userId) => [
          userId,
          normalizeScopeValue(candidateUserScopes[userId] || DEFAULT_SCOPE),
        ])
      ),
    }));
    syncSelectionToActiveTab([...candidateSelection]);
    setAddUsersOpen(false);
  };

  const toggleCandidateUserScopeSelection = (userId, field, value) => {
    const normalizedId = getRecordId(userId);
    setCandidateUserScopes((prev) => {
      const current = normalizeScopeValue(prev[normalizedId] || DEFAULT_SCOPE);
      const currentValues = normalizeScopeIds(current[field] || ["all"]);
      let nextValues;

      if (value === "all") {
        nextValues = ["all"];
      } else {
        const next = new Set(currentValues.filter((item) => item !== "all"));
        if (next.has(value)) next.delete(value);
        else next.add(value);
        nextValues = [...next];
        if (!nextValues.length) nextValues = ["all"];
      }

      return {
        ...prev,
        [normalizedId]: {
          ...current,
          [field]: nextValues,
        },
      };
    });
  };

  const savePermissions = async () => {
    if (!selectedPage) return;
    setSaving(true);
    setMessage(null);

    try {
      const toScopeEntries = (accessType, ids) => {
        const scopeKey = accessType === "approve" ? "approve" : accessType;
        const scopeMap = draftUserScopes[scopeKey] || {};
        const fallbackScope = normalizeScopeValue(draftScopes[scopeKey] || DEFAULT_SCOPE);

        return normalizeUserIds(ids).map((id) => {
          const scope = normalizeScopeValue(scopeMap[id] || fallbackScope);
          return {
            user: id,
            accessType,
            branchIds: scope.branchIds,
            departmentIds: scope.departmentIds,
          };
        });
      };

      const payload = {
        viewUserIds: draftPermissions.viewIds,
        editUserIds: draftPermissions.editIds,
        deleteUserIds: draftPermissions.deleteIds,
        approverIds: draftPermissions.approverIds,
        userAccessScopes: [
          ...toScopeEntries("view", draftPermissions.viewIds),
          ...toScopeEntries("edit", draftPermissions.editIds),
          ...toScopeEntries("delete", draftPermissions.deleteIds),
          ...toScopeEntries("approve", draftPermissions.approverIds),
        ],
      };

      const res = await axios.put(`/page-permissions/${selectedPage.pageKey}`, payload);
      invalidateGetCache("/page-permissions");
      const updatedPage = normalizePage(res.data?.page || selectedPage);

      setPages((prev) =>
        prev.map((page) => (page.pageKey === updatedPage.pageKey ? { ...page, ...updatedPage } : page))
      );
      setDraftUserScopes(buildScopeMapByTab(updatedPage.userAccessScopes));
      setSelectedPageKey(updatedPage.pageKey);
      setMessage({ type: "success", text: "Page permissions saved successfully." });
    } catch (error) {
      console.error("Failed to save page permissions:", error);
      setMessage({ type: "error", text: error.response?.data?.error || "Unable to save page permissions." });
    } finally {
      setSaving(false);
    }
  };

  const summaryPage = useMemo(
    () => pages.find((page) => page.pageKey === summaryModal.pageKey) || null,
    [pages, summaryModal.pageKey]
  );

  const summaryAccessTypeLabel = getAccessTypeLabel(summaryModal.accessType, summaryPage);
  const summaryPageAccessTypeOptions = getPageAccessTypeOptions(summaryPage);
  const summaryAccessTypeIds = getPageUserIdsForAccessType(summaryPage, summaryModal.accessType);
  const summaryUserScopeMap = useMemo(
    () => buildScopeMapByTab(summaryPage?.userAccessScopes || []),
    [summaryPage]
  );
  const summaryUserRows = useMemo(
    () =>
      summaryAccessTypeIds.map((userId) => {
        const user = usersById.get(userId) || null;
        const scopeKey = summaryModal.accessType === "approve" ? "approve" : summaryModal.accessType;
        const scope = normalizeScopeValue(summaryUserScopeMap[scopeKey]?.[userId] || DEFAULT_SCOPE);
        return { id: userId, user, scope };
      }),
    [summaryAccessTypeIds, summaryModal.accessType, summaryUserScopeMap, usersById]
  );

  const openPermissionSummaryDialog = (page, accessType) => {
    if (!page) return;
    const availableTypes = getPageAccessTypeOptions(page).map((option) => option.value);
    const resolvedAccessType = availableTypes.includes(accessType) ? accessType : availableTypes[0];
    setSelectedPageKey(page.pageKey);
    setSummaryModal({
      open: true,
      pageKey: page.pageKey,
      accessType: resolvedAccessType,
    });
  };

  const closePermissionSummaryDialog = () => {
    setSummaryModal({
      open: false,
      pageKey: "",
      accessType: "view",
    });
  };

  const switchAccessType = (nextAccessType) => {
    const page = selectedPage;
    if (!page) return;

    const availableTypes = getPageAccessTypeOptions(page).map((option) => option.value);
    const resolved = availableTypes.includes(nextAccessType) ? nextAccessType : availableTypes[0];

    const resolvedActiveIds = getActiveIdsForTab(
      {
        ...page,
        viewUsers: draftPermissions.viewIds,
        editUsers: draftPermissions.editIds,
        deleteUsers: draftPermissions.deleteIds,
        approvers: draftPermissions.approverIds,
      },
      resolved
    );

    setActiveTab(resolved);
    setCandidateSelection(new Set(resolvedActiveIds));
    setCandidateSearch("");

    const scopeKey = page.permissionPattern === "approveReject"
      ? (resolved === "approve" ? "approve" : resolved === "delete" ? "delete" : "view")
      : (resolved === "edit" ? "edit" : resolved === "delete" ? "delete" : "view");
    const existingScopes = draftUserScopes[scopeKey] || {};
    const nextCandidateScopes = {};

    resolvedActiveIds.forEach((userId) => {
      nextCandidateScopes[userId] = existingScopes[userId] || normalizeScopeValue(draftScopes[scopeKey] || DEFAULT_SCOPE);
    });

    setCandidateUserScopes(nextCandidateScopes);
  };

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

        <section className="pm-card pm-filter-card">
          <div className="pm-filter-grid">
            <div className="pm-filter-field pm-filter-search">
              <Search className="pm-search-icon" />
              <input
                type="search"
                placeholder="Search pages by name or path..."
                value={pageSearch}
                onChange={(event) => setPageSearch(event.target.value)}
              />
            </div>

            <div className="pm-filter-field">
              <label>Permission Type</label>
              <select value={permissionTypeFilter} onChange={(event) => setPermissionTypeFilter(event.target.value)}>
                <option value="all">All Types</option>
                <option value="viewEdit">View / Edit</option>
                <option value="approveReject">Approve / Reject</option>
              </select>
            </div>

            <div className="pm-filter-field">
              <label>Access Scope</label>
              <select value={accessScopeFilter} onChange={(event) => setAccessScopeFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="all-users">All Users</option>
                <option value="department">Department</option>
                <option value="branch">Branch</option>
                <option value="branch-department">Branch + Dept</option>
              </select>
            </div>

            <div className="pm-filter-field">
              <label>Status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="pm-filter-actions">
              <button type="button" className="pm-primary-btn">
                <FilterAltOutlined />
                Filter
              </button>
              <button
                type="button"
                className="pm-outline-btn"
                onClick={() => {
                  setPageSearch("");
                  setPermissionTypeFilter("all");
                  setAccessScopeFilter("all");
                  setStatusFilter("all");
                }}
              >
                <Close />
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="pm-card pm-table-card">
          <div className="pm-card-head pm-table-head">
            <div>
              <h2>Pages</h2>
              <p>Click a page to manage its users, scope and permissions.</p>
            </div>
            <div className="pm-card-head-actions">
              <button type="button" className="pm-outline-btn" onClick={savePermissions} disabled={saving || !selectedPage}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="pm-table-wrap pm-table-wrap-wide">
            <table className="pm-table pm-overview-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Path & Pattern</th>
                  <th>Permission Summary</th>
                  <th>Access Scope</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePages.length ? (
                  visiblePages.map((page) => {
                    const Icon = getPageTitleIcon(page.pageKey);
                    const metrics = getPagePermissionMetric(page);
                    const isSelected = selectedPageKey === page.pageKey;
                    const accessScopeLabel = getPageAccessScopeLabel(page);
                    const viewScopeSummary = getPageScopeSummaryForAccessType(page, "view", branches, departments);
                    const editScopeSummary = getPageScopeSummaryForAccessType(
                      page,
                      page.permissionPattern === "approveReject" ? "approve" : "edit",
                      branches,
                      departments
                    );
                    const deleteScopeSummary = getPageScopeSummaryForAccessType(page, "delete", branches, departments);
                    return (
                      <tr
                        key={page.pageKey}
                        className={isSelected ? "is-selected" : ""}
                        onClick={() => setSelectedPageKey(page.pageKey)}
                      >
                        <td>
                          <div className="pm-page-cell">
                            <span className="pm-page-icon pm-page-icon-soft">
                              <Icon />
                            </span>
                            <div>
                              <strong>{page.name}</strong>
                              <span>{page.pageKey}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="pm-path-stack">
                            <span>{page.path}</span>
                            <small className={`pm-pattern-pill pm-pattern-${getPermissionPatternTone(page)}`}>
                              {getPermissionPatternLabel(page)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="pm-permission-summary">
                            <button
                              type="button"
                              className="pm-summary-icon-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                openPermissionSummaryDialog(page, "view");
                              }}
                            >
                              <VisibilityOutlined />
                              <span>
                                <strong>{metrics.view}</strong>
                                <small>View</small>
                                {viewScopeSummary && <em>{viewScopeSummary}</em>}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="pm-summary-icon-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                openPermissionSummaryDialog(page, page.permissionPattern === "approveReject" ? "approve" : "edit");
                              }}
                            >
                              {page.permissionPattern === "approveReject" ? <ShieldOutlined /> : <EditOutlined />}
                              <span>
                                <strong>{page.permissionPattern === "approveReject" ? metrics.approve : metrics.edit}</strong>
                                <small>{page.permissionPattern === "approveReject" ? "Approve/Reject" : "Edit"}</small>
                                {editScopeSummary && <em>{editScopeSummary}</em>}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="pm-summary-icon-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                openPermissionSummaryDialog(page, "delete");
                              }}
                            >
                              <DeleteOutline />
                              <span>
                                <strong>{metrics.delete}</strong>
                                <small>Delete</small>
                                {deleteScopeSummary && <em>{deleteScopeSummary}</em>}
                              </span>
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`pm-scope-badge pm-scope-${getPageAccessScopeCategory(page)}`}>
                            {accessScopeLabel}
                          </span>
                        </td>
                        <td>
                          <span className={`pm-status-pill ${getPageStatusLabel(page).toLowerCase() === "active" ? "is-active" : "is-inactive"}`}>
                            {getPageStatusLabel(page)}
                          </span>
                        </td>
                        <td>
                          <div className="pm-row-actions">
                            <button
                              type="button"
                              className="pm-row-action"
                              aria-label={`Edit ${page.name}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                openAddUsersDialog(page, page.permissionPattern === "approveReject" ? "approve" : "edit");
                              }}
                            >
                              <EditOutlined />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="pm-empty-row">
                      No pages found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pm-pagination pm-overview-pagination">
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
        </section>

      </div>

      {addUsersOpen && (
        <div className="pm-modal-backdrop" role="presentation" onClick={() => setAddUsersOpen(false)}>
          <div className="pm-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="pm-modal-header">
              <div>
                <h3>Manage Page Access</h3>
                <p>
                  {selectedPage?.name || "Select a page"} - choose users, scope and access type.
                </p>
              </div>
              <button type="button" className="pm-icon-btn" onClick={() => setAddUsersOpen(false)} aria-label="Close">
                <Close />
              </button>
            </div>

            <div className="pm-access-type-strip">
              <span className="pm-access-type-label">Access Type</span>
              <div className="pm-access-type-wrap">
                {getPageAccessTypeOptions(selectedPage).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`pm-access-type-chip ${activeTab === option.value ? "is-active" : ""}`}
                    onClick={() => switchAccessType(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
              {modalUsers.length ? (
                modalUsers.map((user) => {
                  const userId = getRecordId(user);
                  const checked = candidateSelection.has(userId);
                  const scope = normalizeScopeValue(candidateUserScopes[userId] || DEFAULT_SCOPE);
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
                        {activeUserIdSet.has(userId) && (
                          <span className="pm-modal-user-tag">Already assigned</span>
                        )}
                      </span>
                      {checked && (
                        <div className="pm-modal-user-scope">
                          <div className="pm-modal-user-scope-head">
                            <strong>Scope</strong>
                            <span>{getScopeSummary(scope, branches, departments)}</span>
                          </div>

                          <div className="pm-modal-user-scope-grid">
                            <div className="pm-modal-user-scope-card">
                              <label>Branches</label>
                              <div className="pm-scope-chip-wrap">
                                <button
                                  type="button"
                                  className={`pm-scope-chip ${scope.branchIds.includes("all") ? "is-active" : ""}`}
                                  onClick={() => toggleCandidateUserScopeSelection(userId, "branchIds", "all")}
                                >
                                  All Branches
                                </button>
                                {branches.map((branch) => {
                                  const id = getRecordId(branch);
                                  const selected = scope.branchIds.includes(id);
                                  return (
                                    <button
                                      key={id || branch?.name}
                                      type="button"
                                      className={`pm-scope-chip ${selected ? "is-active" : ""}`}
                                      onClick={() => toggleCandidateUserScopeSelection(userId, "branchIds", id)}
                                    >
                                      {branch?.name || branch?.branchCode || "Branch"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pm-modal-user-scope-card">
                              <label>Departments</label>
                              <div className="pm-scope-chip-wrap">
                                <button
                                  type="button"
                                  className={`pm-scope-chip ${scope.departmentIds.includes("all") ? "is-active" : ""}`}
                                  onClick={() => toggleCandidateUserScopeSelection(userId, "departmentIds", "all")}
                                >
                                  All Departments
                                </button>
                                {departments.map((department) => {
                                  const id = getRecordId(department);
                                  const selected = scope.departmentIds.includes(id);
                                  return (
                                    <button
                                      key={id || department?.name}
                                      type="button"
                                      className={`pm-scope-chip ${selected ? "is-active" : ""}`}
                                      onClick={() => toggleCandidateUserScopeSelection(userId, "departmentIds", id)}
                                    >
                                      {department?.name || department?.departmentName || "Department"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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

      {summaryModal.open && summaryPage && (
        <div className="pm-modal-backdrop" role="presentation" onClick={closePermissionSummaryDialog}>
          <div className="pm-modal pm-summary-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="pm-modal-header">
              <div>
                <h3>
                  {summaryPage.name} - {summaryAccessTypeLabel}
                </h3>
                <p>Yahan woh users dikh rahe hain jinko is page par ye access diya gaya hai.</p>
              </div>
              <button type="button" className="pm-icon-btn" onClick={closePermissionSummaryDialog} aria-label="Close">
                <Close />
              </button>
            </div>

            <div className="pm-summary-switch">
              {summaryPageAccessTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`pm-summary-switch-btn ${summaryModal.accessType === option.value ? "is-active" : ""}`}
                  onClick={() => setSummaryModal((prev) => ({ ...prev, accessType: option.value }))}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="pm-summary-list">
              {summaryUserRows.length ? (
                summaryUserRows.map(({ id, user, scope }) => (
                  <div key={id} className="pm-summary-user-row">
                    <div className="pm-user-cell">
                      <span className="pm-user-badge">{getUserInitials(user)}</span>
                      <div>
                        <strong>{getUserLabel(user)}</strong>
                        <span>{getUserEmail(user)}</span>
                      </div>
                    </div>
                    <div className="pm-summary-user-meta">
                      <span className="pm-scope-cell">{getScopeSummary(scope, branches, departments)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="pm-empty-row">No users assigned for this access type.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManagement;
