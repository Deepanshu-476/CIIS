import React, { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import "./PageManagement.css";
import CIISLoader from "../../Loader/CIISLoader";

const getUserId = (user) => String(user?._id || user?.id || "");
const getPagePermissionPattern = (page) => page?.permissionPattern || null;
const normalizeValue = (value) => String(value || "").trim();
const normalizeKey = (value) => normalizeValue(value).replace(/^\/+/, "").toLowerCase();
const normalizeLookupId = (value) => String(value || "").trim();
const ALLOWED_PAGE_PATHS = new Set([
  "/ciisUser/emp-details",
  "/ciisUser/emp-leaves",
  "/ciisUser/emp-assets",
  "/ciisUser/emp-attendance",
  "/ciisUser/manage-groups",
  "/ciisUser/company-all-task",
  "/ciisUser/department",
  "/ciisUser/JobRoleManagement",
  "/ciisUser/SidebarManagement"
]);

const normalizePagePath = (path) => normalizeValue(path);
const isAllowedPage = (page) => {
  const path = normalizePagePath(page?.path);
  const pageKey = normalizePagePath(page?.pageKey);
  return ALLOWED_PAGE_PATHS.has(path) || ALLOWED_PAGE_PATHS.has(`/ciisUser/${pageKey}`) || ALLOWED_PAGE_PATHS.has(pageKey);
};

const getStoredCompany = () => {
  try {
    const raw = localStorage.getItem("company") || localStorage.getItem("companyDetails");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.company || parsed || null;
  } catch {
    return null;
  }
};

const getCompanyId = (company) => String(company?._id || company?.id || company?.companyId || "");

const getUserRoleCandidates = (user) => {
  const roleSources = [
    user?.jobRole,
    user?.companyRole,
    user?.role,
    user?.userRole,
    user?.designation,
    user?.jobRoleName,
    user?.roleName,
  ];

  const normalized = new Set();
  roleSources.forEach((value) => {
    if (!value) return;
    if (typeof value === "object") {
      [value._id, value.id, value.name, value.roleName, value.role, value.title, value.code]
        .filter(Boolean)
        .forEach((candidate) => {
          normalized.add(normalizeKey(candidate));
          normalized.add(normalizeValue(candidate).toLowerCase());
        });
      return;
    }

    normalized.add(normalizeKey(value));
    normalized.add(normalizeValue(value).toLowerCase());
  });

  return normalized;
};

const buildPageRoleMap = (configs = []) => {
  const map = new Map();

  configs.forEach((config) => {
    const roleKey = normalizeKey(config?.role);
    if (!roleKey) return;

    (config?.menuItems || []).forEach((item) => {
      const keys = new Set([
        item?.path,
        item?.id,
        item?.route,
      ]
        .filter(Boolean)
        .flatMap((value) => {
          const normalized = normalizePagePath(value);
          const clean = normalized.replace(/^\/+/, "");
          return [
            normalized,
            clean,
            normalizeKey(normalized),
            normalizeKey(clean),
          ];
        })
        .filter(Boolean));

      keys.forEach((pageKey) => {
        if (!map.has(pageKey)) {
          map.set(pageKey, new Set());
        }
        map.get(pageKey).add(roleKey);
      });
    });
  });

  return map;
};

const getAllowedRolesForPage = (page, pageRoleMap) => {
  const keys = [
    page?.path,
    page?.pageKey,
    `/ciisUser/${page?.pageKey || ""}`,
  ]
    .filter(Boolean)
    .flatMap((value) => {
      const normalized = normalizePagePath(value);
      const clean = normalized.replace(/^\/+/, "");
      return [
        normalized,
        clean,
        normalizeKey(normalized),
        normalizeKey(clean),
      ];
    });

  const allowedRoles = new Set();
  keys.forEach((key) => {
    const roleSet = pageRoleMap.get(key);
    if (roleSet) {
      roleSet.forEach((role) => allowedRoles.add(role));
    }
  });

  return allowedRoles;
};

const userMatchesAllowedRoles = (user, allowedRoles) => {
  if (!allowedRoles.size) return false;
  const candidates = getUserRoleCandidates(user);
  for (const role of allowedRoles) {
    if (candidates.has(role)) return true;
  }
  return false;
};

const hasConfiguredPermission = (page) =>
  (page?.approvers || []).length > 0 ||
  (page?.viewUsers || []).length > 0 ||
  (page?.editUsers || []).length > 0 ||
  (page?.deleteUsers || []).length > 0;

const getPermissionTabs = (page) => {
  const pattern = getPagePermissionPattern(page);

  if (pattern === "approveReject") {
    return [
      { key: "view", label: "View", count: (page?.viewUsers || []).length },
      { key: "approve", label: "Approve / Reject", count: (page?.approvers || []).length },
      { key: "delete", label: "Delete", count: (page?.deleteUsers || []).length }
    ];
  }

  if (pattern === "viewEdit") {
    return [
      { key: "view", label: "View", count: (page?.viewUsers || []).length },
      { key: "edit", label: "Edit", count: (page?.editUsers || []).length },
      { key: "delete", label: "Delete", count: (page?.deleteUsers || []).length }
    ];
  }

  return [
    { key: "delete", label: "Delete", count: (page?.deleteUsers || []).length }
  ];
};

const getPermissionSummary = (page) => {
  const pattern = getPagePermissionPattern(page);
  if (pattern === "approveReject") {
    return `${(page?.viewUsers || []).length} view user(s) / ${(page?.approvers || []).length} approve/reject user(s) / ${(page?.deleteUsers || []).length} delete user(s)`;
  }
  if (pattern === "viewEdit") {
    return `${(page?.viewUsers || []).length} view user(s) / ${(page?.editUsers || []).length} edit user(s) / ${(page?.deleteUsers || []).length} delete user(s)`;
  }
  return `${(page?.deleteUsers || []).length} delete user(s)`;
};

const normalizeId = (value) => String(value || "").trim().toLowerCase();

const getRecordId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return normalizeId(value._id || value.id || value.user || value.value);
  }
  return normalizeId(value);
};

const getBranchLabel = (branch) => branch?.name || branch?.branchCode || "Branch";
const getDepartmentLabel = (department) => department?.name || department?.title || department?.departmentName || "Department";
const getUserLabel = (user) => user?.name || user?.email || "User";
const getRoleLabel = (role) => role?.label || role?.name || role?.key || "Role";
const getRoleSubtitle = (role) => role?.departmentName || role?.department?.name || role?.department || "";
const getUserScopeSummary = (user) => {
  const branchLabel = user?.branch ? getBranchLabel(user.branch) : (user?.branchCode || "");
  const departmentLabel = typeof user?.department === "object"
    ? getDepartmentLabel(user.department)
    : String(user?.department || "").trim();

  return [
    branchLabel ? `Branch: ${branchLabel}` : null,
    departmentLabel ? `Department: ${departmentLabel}` : null
  ].filter(Boolean).join(" | ");
};

const buildVisibilitySummary = (rule, branchesById, departmentsById) => {
  if (!rule) return "No access defined";
  if (rule.scope === "all") return "All company data";

  const branchNames = (rule.branchIds || [])
    .map((id) => branchesById.get(String(id)))
    .filter(Boolean)
    .map(getBranchLabel);
  const departmentNames = (rule.departmentIds || [])
    .map((id) => departmentsById.get(String(id)))
    .filter(Boolean)
    .map(getDepartmentLabel);

  const pieces = [];
  if (rule.scope === "branches" || rule.scope === "custom") {
    pieces.push(branchNames.length ? `Branches: ${branchNames.join(", ")}` : "Branches: none");
  }
  if (rule.scope === "departments" || rule.scope === "custom") {
    pieces.push(departmentNames.length ? `Departments: ${departmentNames.join(", ")}` : "Departments: none");
  }
  return pieces.join(" | ") || "No access defined";
};

const createBlankVisibilityRule = (subjectType, subjectKey, subjectLabel) => ({
  subjectType,
  subjectKey: normalizeId(subjectKey),
  subjectLabel: String(subjectLabel || subjectKey || "").trim(),
  scope: "custom",
  branchIds: [],
  departmentIds: []
});

const upsertVisibilityRule = (rules, nextRule) => {
  const key = normalizeId(nextRule.subjectKey);
  const type = String(nextRule.subjectType || "").trim();
  const existingIndex = rules.findIndex((rule) => normalizeId(rule.subjectKey) === key && String(rule.subjectType || "").trim() === type);
  const normalizedRule = {
    subjectType: type,
    subjectKey: key,
    subjectLabel: String(nextRule.subjectLabel || nextRule.label || nextRule.subjectKey || "").trim(),
    scope: ["all", "branches", "departments", "custom"].includes(String(nextRule.scope || "").trim())
      ? String(nextRule.scope || "").trim()
      : "custom",
    branchIds: [...new Set((nextRule.branchIds || []).map(String).filter(Boolean))],
    departmentIds: [...new Set((nextRule.departmentIds || []).map(String).filter(Boolean))]
  };

  if (existingIndex === -1) {
    return [...rules, normalizedRule];
  }

  const nextRules = [...rules];
  nextRules[existingIndex] = { ...nextRules[existingIndex], ...normalizedRule };
  return nextRules;
};

const PageManagement = () => {
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [jobRoleMap, setJobRoleMap] = useState(new Map());
  const [roleVisibilityRules, setRoleVisibilityRules] = useState([]);
  const [userVisibilityRules, setUserVisibilityRules] = useState([]);
  const [selectedPageKey, setSelectedPageKey] = useState("emp-leaves");
  const [selectedViewUsers, setSelectedViewUsers] = useState([]);
  const [selectedEditUsers, setSelectedEditUsers] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [selectedDeleteUsers, setSelectedDeleteUsers] = useState([]);
  const [permissionMode, setPermissionMode] = useState("approve");
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [visibilityMessage, setVisibilityMessage] = useState(null);
  const [sidebarConfigs, setSidebarConfigs] = useState([]);
  const [accessReady, setAccessReady] = useState(false);
  const [visibilityMode, setVisibilityMode] = useState("role");
  const [selectedVisibilityKey, setSelectedVisibilityKey] = useState("");
  const [visibilitySearchTerm, setVisibilitySearchTerm] = useState("");
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  const selectedPage = useMemo(
    () => pages.find((page) => page.pageKey === selectedPageKey) || pages[0],
    [pages, selectedPageKey]
  );

  const permissionTabs = useMemo(
    () => getPermissionTabs(selectedPage),
    [selectedPage]
  );

  const selectedPermissionPattern = getPagePermissionPattern(selectedPage);
  const pageRoleMap = useMemo(() => buildPageRoleMap(sidebarConfigs), [sidebarConfigs]);
  const allowedRolesForSelectedPage = useMemo(
    () => getAllowedRolesForPage(selectedPage, pageRoleMap),
    [pageRoleMap, selectedPage]
  );
  const branchesById = useMemo(
    () => new Map(branches.map((branch) => [String(branch._id || branch.id), branch])),
    [branches]
  );
  const departmentsById = useMemo(
    () => new Map(departments.map((department) => [String(department._id || department.id), department])),
    [departments]
  );
  const visibilityItems = useMemo(() => {
    if (visibilityMode === "user") return users;
    return roleOptions;
  }, [roleOptions, users, visibilityMode]);
  const selectedVisibilityRule = useMemo(() => {
    if (visibilityMode === "user") {
      return userVisibilityRules.find((rule) => normalizeId(rule.subjectKey) === normalizeId(selectedVisibilityKey)) || null;
    }
    return roleVisibilityRules.find((rule) => normalizeId(rule.subjectKey) === normalizeId(selectedVisibilityKey)) || null;
  }, [roleVisibilityRules, selectedVisibilityKey, userVisibilityRules, visibilityMode]);
  const selectedVisibilityLabel = useMemo(() => {
    if (visibilityMode === "user") {
      const user = users.find((item) => normalizeId(getRecordId(item)) === normalizeId(selectedVisibilityKey));
      return getUserLabel(user);
    }
    const role = roleOptions.find((item) => normalizeId(item.key || item.subjectKey) === normalizeId(selectedVisibilityKey));
    return getRoleLabel(role);
  }, [roleOptions, selectedVisibilityKey, users, visibilityMode]);
  const filteredVisibilityItems = useMemo(() => {
    const query = visibilitySearchTerm.trim().toLowerCase();
    const items = visibilityItems || [];
    if (!query) return items;

    return items.filter((item) => {
      const label = visibilityMode === "user"
        ? [item?.name, item?.email, item?.jobRole, item?.companyRole].filter(Boolean).join(" ")
        : [item?.label, item?.name, item?.key].filter(Boolean).join(" ");
      return label.toLowerCase().includes(query);
    });
  }, [visibilityItems, visibilityMode, visibilitySearchTerm]);
  const firstVisibilityRole = roleOptions[0] || null;
  const firstVisibilityUser = users[0] || null;
  const resolveJobRoleName = (value) => {
    const key = normalizeLookupId(value);
    if (!key) return "";
    const exact = jobRoleMap.get(key);
    if (exact) return exact.name;
    for (const role of jobRoleMap.values()) {
      if (normalizeKey(role.name) === normalizeKey(key)) return role.name;
    }
    return "";
  };

  const searchedPages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pages;

    return pages.filter((page) =>
      [page.name, page.path, page.pageKey]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [pages, searchTerm]);

  const configuredPages = useMemo(
    () => searchedPages.filter(hasConfiguredPermission),
    [searchedPages]
  );

  const unconfiguredPages = useMemo(
    () => searchedPages.filter((page) => !hasConfiguredPermission(page)),
    [searchedPages]
  );

  const activeSelectedUsersResolved = useMemo(() => {
    if (permissionMode === "delete") return selectedDeleteUsers;
    if (permissionMode === "view") {
      return selectedViewUsers;
    }
    if (permissionMode === "edit") return selectedEditUsers;
    return selectedApprovers;
  }, [permissionMode, selectedApprovers, selectedDeleteUsers, selectedEditUsers, selectedViewUsers]);
  const activeSelectedUserSet = useMemo(
    () => new Set(activeSelectedUsersResolved.map(String)),
    [activeSelectedUsersResolved]
  );

  const filteredUsers = useMemo(() => {
    if (!accessReady) return [];

    const query = userSearchTerm.trim().toLowerCase();
    const roleFilteredUsers = users.filter((user) => userMatchesAllowedRoles(user, allowedRolesForSelectedPage));

    if (!query) return roleFilteredUsers;

    return roleFilteredUsers.filter((user) =>
      [user.name, user.email, user.companyRole, user.jobRole, user.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [accessReady, allowedRolesForSelectedPage, userSearchTerm, users]);

  const selectedUsers = useMemo(
    () => filteredUsers.filter((user) => activeSelectedUserSet.has(getUserId(user))),
    [activeSelectedUserSet, filteredUsers]
  );

  const availableUsers = useMemo(
    () => filteredUsers.filter((user) => !activeSelectedUserSet.has(getUserId(user))),
    [activeSelectedUserSet, filteredUsers]
  );

  const loadData = async () => {
    setLoading(true);
    setAccessReady(false);
    setVisibilityMessage(null);
    try {
      const companyFromStorage = getStoredCompany();
      const companyId = getCompanyId(companyFromStorage);
      const [pagesRes, visibilityRes, sidebarRes, jobRolesRes] = await Promise.all([
        axios.get("/page-permissions/pages"),
        axios.get("/page-permissions/data-visibility/context").catch(async (error) => {
          if (error?.response?.status !== 404) throw error;
          const [usersRes, branchesRes, departmentsRes] = await Promise.all([
            companyId ? axios.get("/users/company-users", { params: { companyId, limit: 100 } }) : Promise.resolve({ data: {} }),
            companyId ? axios.get("/branches/company/" + companyId).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
            companyId ? axios.get("/departments", { params: { company: companyId } }).catch(() => ({ data: {} })) : Promise.resolve({ data: {} })
          ]);

          return {
            data: {
              context: {
                users: usersRes.data?.users || usersRes.data?.message?.users || [],
                branches: branchesRes.data?.branches || branchesRes.data?.data || [],
                departments: departmentsRes.data?.departments || departmentsRes.data?.data || [],
                roleOptions: [],
                roleRules: [],
                userRules: []
              }
            }
          };
        }),
        companyId ? axios.get("/sidebar", { params: { companyId } }) : Promise.resolve({ data: { data: [] } }),
        companyId ? axios.get("/job-roles", { params: { company: companyId } }).catch(() => ({ data: {} })) : Promise.resolve({ data: {} })
      ]);

      const loadedPages = pagesRes.data?.pages || [];
      const loadedVisibilityContext = visibilityRes.data?.context || {};
      const loadedUsers = loadedVisibilityContext.users || [];
      const loadedSidebarConfigs = sidebarRes.data?.data || [];
      const loadedJobRoles = jobRolesRes.data?.jobRoles || jobRolesRes.data?.data?.jobRoles || jobRolesRes.data?.data || [];
      const visiblePages = loadedPages.filter(isAllowedPage);
      const jobRoleLookup = new Map(
        loadedJobRoles
          .map((jobRole) => {
            const id = normalizeLookupId(jobRole?._id || jobRole?.id);
            if (!id) return null;
            return [id, {
              id,
              name: String(jobRole?.name || jobRole?.roleName || id).trim(),
              departmentName: jobRole?.department?.name || jobRole?.departmentName || "",
              department: jobRole?.department || null
            }];
          })
          .filter(Boolean)
      );

      setPages(visiblePages);
      setUsers(loadedUsers);
      setBranches(loadedVisibilityContext.branches || []);
      setDepartments(loadedVisibilityContext.departments || []);
      setJobRoleMap(jobRoleLookup);
      setRoleOptions(
        loadedVisibilityContext.roleOptions?.length
          ? loadedVisibilityContext.roleOptions.map((role) => ({
              ...role,
              label: jobRoleLookup.get(normalizeLookupId(role.key))?.name || role.label || role.name || role.key
            }))
          : [...jobRoleLookup.values()].map((role) => ({
              key: role.id,
              label: role.name,
              departmentName: role.departmentName,
              department: role.department
            }))
      );
      setRoleVisibilityRules((loadedVisibilityContext.roleRules || []).map((rule) => ({
        ...rule,
        subjectKey: normalizeId(rule.subjectKey),
        branchIds: (rule.branchIds || []).map(String),
        departmentIds: (rule.departmentIds || []).map(String)
      })));
      setUserVisibilityRules((loadedVisibilityContext.userRules || []).map((rule) => ({
        ...rule,
        subjectKey: normalizeId(rule.subjectKey),
        branchIds: (rule.branchIds || []).map(String),
        departmentIds: (rule.departmentIds || []).map(String)
      })));
      setSidebarConfigs(loadedSidebarConfigs);

      const initialPage = visiblePages.find((page) => page.pageKey === selectedPageKey) || visiblePages[0];
      if (initialPage) {
        setSelectedPageKey(initialPage.pageKey);
        setSelectedViewUsers((initialPage.viewUsers || []).map(getUserId).filter(Boolean));
        setSelectedEditUsers((initialPage.editUsers || []).map(getUserId).filter(Boolean));
        setSelectedApprovers((initialPage.approvers || []).map(getUserId).filter(Boolean));
        setSelectedDeleteUsers((initialPage.deleteUsers || []).map(getUserId).filter(Boolean));
        const initialTabs = getPermissionTabs(initialPage);
        setPermissionMode(initialTabs[0]?.key || "delete");
      }
      const firstRole = (loadedVisibilityContext.roleOptions?.length ? loadedVisibilityContext.roleOptions : [...jobRoleLookup.values()])[0];
      const firstUser = (loadedUsers || [])[0];
      setSelectedVisibilityKey(normalizeId(firstRole?.key || firstRole?.subjectKey || firstUser?._id || firstUser?.id || ""));
      setVisibilityMode(firstRole ? "role" : "user");
      if (firstRole) {
        setRoleVisibilityRules((prev) => {
          const key = normalizeId(firstRole.key || firstRole.subjectKey);
          return prev.some((rule) => normalizeId(rule.subjectKey) === key)
            ? prev
            : [...prev, createBlankVisibilityRule("role", key, firstRole.label || firstRole.name || firstRole.key)];
        });
      } else if (firstUser) {
        const userId = normalizeId(getRecordId(firstUser));
        setUserVisibilityRules((prev) => {
          return prev.some((rule) => normalizeId(rule.subjectKey) === userId)
            ? prev
            : [...prev, createBlankVisibilityRule("user", userId, getUserLabel(firstUser))];
        });
      }
      setAccessReady(true);
    } catch (error) {
      console.error("Failed to load page management data:", error);
      setMessage({ type: "error", text: "Unable to load page management data." });
      setVisibilityMessage({ type: "error", text: "Unable to load data visibility settings." });
      setAccessReady(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectPage = (page) => {
    setSelectedPageKey(page.pageKey);
    setSelectedViewUsers((page.viewUsers || []).map(getUserId).filter(Boolean));
    setSelectedEditUsers((page.editUsers || []).map(getUserId).filter(Boolean));
    setSelectedApprovers((page.approvers || []).map(getUserId).filter(Boolean));
    setSelectedDeleteUsers((page.deleteUsers || []).map(getUserId).filter(Boolean));
    const tabs = getPermissionTabs(page);
    setPermissionMode(tabs[0]?.key || "delete");
    setMessage(null);
  };

  const selectVisibilityItem = (item) => {
    if (visibilityMode === "user") {
      const userId = normalizeId(getRecordId(item));
      const userLabel = getUserLabel(item);
      setSelectedVisibilityKey(userId);
      setUserVisibilityRules((prev) => {
        const existing = prev.find((rule) => normalizeId(rule.subjectKey) === userId);
        return existing ? prev : [...prev, createBlankVisibilityRule("user", userId, userLabel)];
      });
      setVisibilityMessage(null);
      return;
    }

    const roleKey = normalizeId(item?.key || item?.subjectKey || item?.name);
    const roleLabel = getRoleLabel(item);
    setSelectedVisibilityKey(roleKey);
    setRoleVisibilityRules((prev) => {
      const existing = prev.find((rule) => normalizeId(rule.subjectKey) === roleKey);
      return existing ? prev : [...prev, createBlankVisibilityRule("role", roleKey, roleLabel)];
    });
    setVisibilityMessage(null);
  };

  const updateSelectedVisibilityRule = (patch) => {
    if (!selectedVisibilityKey) return;

    if (visibilityMode === "user") {
      setUserVisibilityRules((prev) =>
        upsertVisibilityRule(prev, {
          ...(prev.find((rule) => normalizeId(rule.subjectKey) === normalizeId(selectedVisibilityKey)) || createBlankVisibilityRule("user", selectedVisibilityKey, selectedVisibilityLabel)),
          ...patch
        })
      );
      return;
    }

    setRoleVisibilityRules((prev) =>
      upsertVisibilityRule(prev, {
        ...(prev.find((rule) => normalizeId(rule.subjectKey) === normalizeId(selectedVisibilityKey)) || createBlankVisibilityRule("role", selectedVisibilityKey, selectedVisibilityLabel)),
        ...patch
      })
    );
  };

  const toggleVisibilityId = (type, id) => {
    if (!selectedVisibilityKey) return;
    const normalizedId = normalizeId(id);
    const subjectType = visibilityMode === "user" ? "user" : "role";
    const rule = selectedVisibilityRule || createBlankVisibilityRule(subjectType, selectedVisibilityKey, selectedVisibilityLabel);
    const currentIds = type === "branch" ? [...(rule.branchIds || [])] : [...(rule.departmentIds || [])];
    const nextIds = currentIds.includes(normalizedId)
      ? currentIds.filter((item) => item !== normalizedId)
      : [...currentIds, normalizedId];
    const nextBranchIds = type === "branch" ? nextIds : [...(rule.branchIds || [])];
    const nextDepartmentIds = type === "department" ? nextIds : [...(rule.departmentIds || [])];
    const nextScope = (() => {
      if (rule.scope === "all") {
        return type === "branch" ? "branches" : "departments";
      }
      if (nextBranchIds.length && nextDepartmentIds.length) return "custom";
      if (nextBranchIds.length) return "branches";
      if (nextDepartmentIds.length) return "departments";
      return "custom";
    })();

    updateSelectedVisibilityRule(
      type === "branch"
        ? { branchIds: nextIds, scope: nextScope }
        : { departmentIds: nextIds, scope: nextScope }
    );
  };

  const updateVisibilityScope = (scope) => {
    const nextBranchIds = scope === "departments" || scope === "all" ? [] : (selectedVisibilityRule?.branchIds || []);
    const nextDepartmentIds = scope === "branches" || scope === "all" ? [] : (selectedVisibilityRule?.departmentIds || []);
    updateSelectedVisibilityRule({
      scope,
      branchIds: nextBranchIds,
      departmentIds: nextDepartmentIds
    });
  };

  const saveVisibilityRules = async () => {
    setVisibilitySaving(true);
    setVisibilityMessage(null);
    try {
      const res = await axios.put("/page-permissions/data-visibility", {
        roleRules: roleVisibilityRules,
        userRules: userVisibilityRules
      });

      const nextRoleRules = (res.data?.roleRules || res.data?.context?.roleRules || roleVisibilityRules).map((rule) => ({
        ...rule,
        subjectKey: normalizeId(rule.subjectKey),
        branchIds: (rule.branchIds || []).map(String),
        departmentIds: (rule.departmentIds || []).map(String)
      }));
      const nextUserRules = (res.data?.userRules || res.data?.context?.userRules || userVisibilityRules).map((rule) => ({
        ...rule,
        subjectKey: normalizeId(rule.subjectKey),
        branchIds: (rule.branchIds || []).map(String),
        departmentIds: (rule.departmentIds || []).map(String)
      }));

      setRoleVisibilityRules(nextRoleRules);
      setUserVisibilityRules(nextUserRules);
      setVisibilityMessage({ type: "success", text: "Data visibility rules saved successfully." });
    } catch (error) {
      console.error("Failed to save data visibility rules:", error);
      setVisibilityMessage({ type: "error", text: error.response?.data?.error || "Unable to save data visibility rules." });
    } finally {
      setVisibilitySaving(false);
    }
  };

  const toggleSelectedUser = (userId) => {
    if (permissionMode === "view") {
      setSelectedViewUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
      return;
    }

    if (permissionMode === "delete") {
      setSelectedDeleteUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
      return;
    }

    if (permissionMode === "edit") {
      setSelectedEditUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
      setSelectedViewUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      return;
    }

    setSelectedApprovers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const savePermissions = async () => {
    if (!selectedPage) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.put(`/page-permissions/${selectedPage.pageKey}`, {
        approverIds: selectedApprovers,
        viewUserIds: selectedViewUsers,
        editUserIds: selectedEditUsers,
        deleteUserIds: selectedDeleteUsers
      });

      const updatedPage = res.data?.page;
      setPages((prev) =>
        prev.map((page) =>
          page.pageKey === selectedPage.pageKey
            ? {
                ...page,
                approvers: updatedPage?.approvers || [],
                viewUsers: updatedPage?.viewUsers || [],
                editUsers: updatedPage?.editUsers || [],
                deleteUsers: updatedPage?.deleteUsers || []
              }
            : page
        )
      );
      setMessage({ type: "success", text: "Page permissions saved successfully." });
    } catch (error) {
      console.error("Failed to save page permissions:", error);
      setMessage({ type: "error", text: error.response?.data?.error || "Unable to save page permissions." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CIISLoader />;

  return (
    <div className="PageManagement-container">
      <section className="PageManagement-header">
        <div>
          <h1>Page Management</h1>
          <p>View page URLs and select authorized users for page actions such as leave approvals.</p>
        </div>
        <button className="PageManagement-refresh" onClick={loadData} type="button">
          Refresh
        </button>
      </section>

      {message && (
        <div className={`PageManagement-alert PageManagement-alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="PageManagement-layout">
        <section className="PageManagement-pages">
          <div className="PageManagement-section-title">
            <h2>All Pages</h2>
            <span>{searchedPages.length} pages</span>
          </div>

          <input
            className="PageManagement-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search page or URL"
            type="search"
          />

          <div className="PageManagement-page-list">
            {configuredPages.length > 0 && (
              <PageGroup
                title="Configured Pages"
                pages={configuredPages}
                selectedPage={selectedPage}
                onSelectPage={selectPage}
              />
            )}
            {unconfiguredPages.length > 0 && (
              <PageGroup
                title="No Permissions Configured"
                pages={unconfiguredPages}
                selectedPage={selectedPage}
                onSelectPage={selectPage}
              />
            )}
            {!searchedPages.length && (
              <div className="PageManagement-empty">No pages found.</div>
            )}
          </div>
        </section>

        <section className="PageManagement-editor">
          <div className="PageManagement-section-title">
            <div>
              <h2>{selectedPage?.name || "Select Page"}</h2>
              <p>{selectedPage?.path}</p>
            </div>
            <button
              className="PageManagement-save"
              onClick={savePermissions}
              disabled={saving || !selectedPage}
              type="button"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="PageManagement-note">
            {selectedPermissionPattern === "approveReject"
              ? "Configure who can view, approve/reject, and delete records for the selected page. For `/ciisUser/emp-leaves`, view access allows page access, approvers must approve before a leave becomes Approved."
              : selectedPermissionPattern === "viewEdit"
                ? "Configure who can only view the selected page and who can edit it. Edit access always includes View access."
                : "Configure delete access for this page."}
          </div>

          <div className="PageManagement-mode-tabs">
            {permissionTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={permissionMode === tab.key ? "PageManagement-mode-active" : ""}
                onClick={() => setPermissionMode(tab.key)}
              >
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>

          <input
            className="PageManagement-search PageManagement-user-search"
            value={userSearchTerm}
            onChange={(event) => setUserSearchTerm(event.target.value)}
            placeholder="Search users"
            type="search"
          />

          <div className="PageManagement-user-sections">
            <UserGroup
              title={`Selected Users (${selectedUsers.length})`}
              users={selectedUsers}
              activeSelectedUserSet={activeSelectedUserSet}
              onToggleUser={toggleSelectedUser}
              emptyText="No selected users."
              resolveJobRoleName={resolveJobRoleName}
            />
            <UserGroup
              title={`Available Users (${availableUsers.length})`}
              users={availableUsers}
              activeSelectedUserSet={activeSelectedUserSet}
              onToggleUser={toggleSelectedUser}
              emptyText="No available users found."
              resolveJobRoleName={resolveJobRoleName}
            />
          </div>

          <div className="PageManagement-visibility">
            <div className="PageManagement-section-title">
              <div>
                <h2>Data Visibility</h2>
                <p>Role defaults stay separate from page access, and per-user overrides can narrow or widen branch and department data.</p>
              </div>
              <button
                className="PageManagement-save"
                onClick={saveVisibilityRules}
                disabled={visibilitySaving || !selectedVisibilityKey}
                type="button"
              >
                {visibilitySaving ? "Saving..." : "Save Visibility"}
              </button>
            </div>

            {visibilityMessage && (
              <div className={`PageManagement-alert PageManagement-alert-${visibilityMessage.type}`}>
                {visibilityMessage.text}
              </div>
            )}

            <div className="PageManagement-mode-tabs">
              <button
                type="button"
                className={visibilityMode === "role" ? "PageManagement-mode-active" : ""}
                onClick={() => {
                  setVisibilityMode("role");
                  if (firstVisibilityRole) {
                    const roleKey = normalizeId(firstVisibilityRole.key || firstVisibilityRole.subjectKey);
                    setSelectedVisibilityKey(roleKey);
                    setRoleVisibilityRules((prev) => {
                      return prev.some((rule) => normalizeId(rule.subjectKey) === roleKey)
                        ? prev
                        : [...prev, createBlankVisibilityRule("role", roleKey, firstVisibilityRole.label || firstVisibilityRole.name || firstVisibilityRole.key)];
                    });
                  }
                }}
              >
                Role Defaults
                <span>{roleOptions.length}</span>
              </button>
              <button
                type="button"
                className={visibilityMode === "user" ? "PageManagement-mode-active" : ""}
                onClick={() => {
                  setVisibilityMode("user");
                  if (firstVisibilityUser) {
                    const userId = normalizeId(getRecordId(firstVisibilityUser));
                    setSelectedVisibilityKey(userId);
                    setUserVisibilityRules((prev) => {
                      return prev.some((rule) => normalizeId(rule.subjectKey) === userId)
                        ? prev
                        : [...prev, createBlankVisibilityRule("user", userId, getUserLabel(firstVisibilityUser))];
                    });
                  }
                }}
              >
                User Overrides
                <span>{users.length}</span>
              </button>
            </div>

            <input
              className="PageManagement-search PageManagement-user-search"
              value={visibilitySearchTerm}
              onChange={(event) => setVisibilitySearchTerm(event.target.value)}
              placeholder={visibilityMode === "role" ? "Search roles" : "Search users"}
              type="search"
            />

            <div className="PageManagement-visibility-grid">
              <section className="PageManagement-user-group">
                <h3>{visibilityMode === "role" ? "Role Defaults" : "User Overrides"}</h3>
                {filteredVisibilityItems.length ? (
                  <div className="PageManagement-users">
                    {filteredVisibilityItems.map((item) => {
                      const itemKey = visibilityMode === "user"
                        ? normalizeId(getRecordId(item))
                        : normalizeId(item?.key || item?.subjectKey || item?.name);
                      const selected = normalizeId(selectedVisibilityKey) === normalizeId(itemKey);
                      const label = visibilityMode === "user" ? getUserLabel(item) : getRoleLabel(item);
                      const rule = visibilityMode === "user"
                        ? userVisibilityRules.find((entry) => normalizeId(entry.subjectKey) === normalizeId(itemKey))
                        : roleVisibilityRules.find((entry) => normalizeId(entry.subjectKey) === normalizeId(itemKey));
                      return (
                        <button
                          key={itemKey || label}
                          type="button"
                          className={`PageManagement-user PageManagement-visibility-item ${selected ? "PageManagement-user-selected" : ""}`}
                          onClick={() => selectVisibilityItem(item)}
                        >
                          <span className="PageManagement-avatar">
                            {label.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="PageManagement-user-main">
                            <strong>{label}</strong>
                            <small>
                              {visibilityMode === "user"
                                ? item?.email || resolveJobRoleName(item?.jobRole) || ""
                                : item?.departmentName || item?.department?.name || ""}
                            </small>
                          </span>
                          <span className="PageManagement-role">
                            {rule ? "Configured" : "Default"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="PageManagement-empty">No {visibilityMode === "role" ? "roles" : "users"} found.</div>
                )}
              </section>

              <section className="PageManagement-visibility-editor">
                <div className="PageManagement-visibility-editor-header">
                  <div>
                    <h3>{selectedVisibilityLabel || "Select an item"}</h3>
                    <p>{selectedVisibilityRule ? "Branch and department visibility for this entry." : "Pick a role or user to configure visibility."}</p>
                  </div>
                  <span className="PageManagement-role">
                    {selectedVisibilityRule?.scope || "custom"}
                  </span>
                </div>

                {selectedVisibilityRule ? (
                  <>
                    <div className="PageManagement-visibility-scope">
                      {[
                        { key: "all", label: "All Company Data" },
                        { key: "branches", label: "Branches Only" },
                        { key: "departments", label: "Departments Only" },
                        { key: "custom", label: "Branches + Departments" }
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={selectedVisibilityRule.scope === option.key ? "PageManagement-mode-active" : ""}
                          onClick={() => updateVisibilityScope(option.key)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="PageManagement-visibility-columns">
                      <div className="PageManagement-visibility-column">
                        <h4>Branches</h4>
                        <div className="PageManagement-visibility-list">
                          {branches.length ? branches.map((branch) => {
                            const branchId = String(branch._id || branch.id);
                            const checked = (selectedVisibilityRule.branchIds || []).map(String).includes(branchId);
                            return (
                              <label key={branchId} className={`PageManagement-visibility-choice ${checked ? "PageManagement-visibility-choice-selected" : ""}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={selectedVisibilityRule.scope === "all"}
                                  onChange={() => toggleVisibilityId("branch", branchId)}
                                />
                                <span>
                                  <strong>{getBranchLabel(branch)}</strong>
                                  <small>{branch.branchCode}</small>
                                </span>
                              </label>
                            );
                          }) : <div className="PageManagement-empty">No branches available.</div>}
                        </div>
                      </div>

                      <div className="PageManagement-visibility-column">
                        <h4>Departments</h4>
                        <div className="PageManagement-visibility-list">
                          {departments.length ? departments.map((department) => {
                            const departmentId = String(department._id || department.id);
                            const checked = (selectedVisibilityRule.departmentIds || []).map(String).includes(departmentId);
                            return (
                              <label key={departmentId} className={`PageManagement-visibility-choice ${checked ? "PageManagement-visibility-choice-selected" : ""}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={selectedVisibilityRule.scope === "all"}
                                  onChange={() => toggleVisibilityId("department", departmentId)}
                                />
                                <span>
                                  <strong>{getDepartmentLabel(department)}</strong>
                                  <small>{department.branch?.name || department.branchCode || "Any branch"}</small>
                                </span>
                              </label>
                            );
                          }) : <div className="PageManagement-empty">No departments available.</div>}
                        </div>
                      </div>
                    </div>

                    <div className="PageManagement-note">
                      {buildVisibilitySummary(selectedVisibilityRule, branchesById, departmentsById)}
                    </div>
                  </>
                ) : (
                  <div className="PageManagement-empty">Select a role or user to configure data visibility.</div>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const PageGroup = ({ title, pages, selectedPage, onSelectPage }) => (
  <div className="PageManagement-page-group">
    <h3>{title}</h3>
    {pages.map((page) => (
      <button
        key={page.pageKey}
        type="button"
        className={`PageManagement-page-item ${selectedPage?.pageKey === page.pageKey ? "PageManagement-page-item-active" : ""}`}
        onClick={() => onSelectPage(page)}
      >
        <span className="PageManagement-page-name">{page.name}</span>
        <span className="PageManagement-page-url">{page.path}</span>
        <span className="PageManagement-page-count">
          {getPermissionSummary(page)}
        </span>
      </button>
    ))}
  </div>
);

const UserGroup = ({ title, users, activeSelectedUserSet, onToggleUser, emptyText, resolveJobRoleName = () => "" }) => (
  <section className="PageManagement-user-group">
    <h3>{title}</h3>
    {users.length ? (
      <div className="PageManagement-users">
        {users.map((user) => {
          const userId = getUserId(user);
          const selected = activeSelectedUserSet.has(userId);
          return (
            <label className={`PageManagement-user ${selected ? "PageManagement-user-selected" : ""}`} key={userId}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleUser(userId)}
              />
              <span className="PageManagement-avatar">
                {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
              </span>
              <span className="PageManagement-user-main">
                <strong>{user.name || "Unnamed User"}</strong>
                <small>{user.email}</small>
                <small>{getUserScopeSummary(user)}</small>
              </span>
              <span className="PageManagement-role">
                {user.companyRole || resolveJobRoleName(user.jobRole) || user.jobRole || "User"}
              </span>
            </label>
          );
        })}
      </div>
    ) : (
      <div className="PageManagement-empty">{emptyText}</div>
    )}
  </section>
);

export default PageManagement;
