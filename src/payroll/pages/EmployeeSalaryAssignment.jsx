import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiCalendar,
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiX
} from "react-icons/fi";
import axiosInstance from "../../utils/axiosConfig";
import "../styles/EmployeeSalaryAssignment.css";

const isHexId = (str) => /^[0-9a-fA-F]{24}$/.test(String(str || "").trim());
const isActiveUser = (user) => (
  user?.isActive !== false &&
  String(user?.status || user?.employeeStatus || "active").toLowerCase() !== "inactive"
);

const emptyForm = {
  user: "",
  department: "",
  jobRole: "",
  designation: "",
  dateOfJoining: "",
  salaryStructure: "",
  effectiveFrom: "",
  salaryInputType: "gross",
  currency: "INR - Indian Rupee",
  payFrequency: "Monthly",
  paymentMode: "Bank Transfer",
  bankAccount: "",
  grossSalary: "",
  notes: ""
};

const formatCurrencyNumber = (num) => {
  if (num === "" || num === null || num === undefined || Number.isNaN(Number(num))) return "0.00";
  return Number(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const setCompVal = (map, row, amt) => {
  const comp = (typeof row.component === "object" && row.component !== null) ? row.component : {};
  const code = String(comp.code || row.code || "").trim().toUpperCase();
  const name = String(comp.name || row.name || "").trim().toUpperCase();
  const id = String(comp._id || row._id || "");
  if (code) map.set(code, amt);
  if (name) map.set(name, amt);
  if (id) map.set(id, amt);
  if (name.includes("BASIC") || code === "BS" || code === "BASIC") {
    map.set("BASIC", amt);
    map.set("BASIC SALARY", amt);
    map.set("BS", amt);
  }
};

const getCompVal = (map, baseStr, defaultVal = 0, pfBase = 0, esiBase = 0) => {
  const key = String(baseStr || "").trim().toUpperCase();
  if (map.has(key)) return map.get(key);
  if (key.includes("BASIC")) {
    if (map.has("BASIC")) return map.get("BASIC");
    if (map.has("BASIC SALARY")) return map.get("BASIC SALARY");
    if (map.has("BS")) return map.get("BS");
  }
  if (key.includes("PF")) {
    if (pfBase > 0) return pfBase;
    if (map.has("BASIC")) return map.get("BASIC");
    if (map.has("BS")) return map.get("BS");
  }
  if (key.includes("ESI")) {
    if (esiBase > 0) return esiBase;
    if (map.has("BASIC")) return map.get("BASIC");
  }
  return defaultVal;
};

// Return the gross defined by a fixed salary structure. If an earning depends
// on Gross/CTC (or is a balance row), the structure needs an assignment input
// and cannot provide its own gross amount.
const getStructureDefinedGross = (structure) => {
  if (!structure) return "";
  if (structure.defaultGross && Number(structure.defaultGross) > 0) {
    return String(structure.defaultGross);
  }

  const values = new Map();
  let gross = 0;
  let pfWageBase = 0;
  let esiWageBase = 0;
  const rows = [...(structure.components || [])].sort(
    (a, b) => (a.sortOrder || 1) - (b.sortOrder || 1)
  );

  for (const row of rows) {
    const comp = (typeof row.component === "object" && row.component !== null) ? row.component : {};
    const code = String(comp.code || row.code || "").trim().toUpperCase();
    const name = String(comp.name || row.name || "").trim().toUpperCase();
    const type = String(comp.type || row.type || "earning").toLowerCase();
    const calculationType = String(row.calculationType || "manual").toLowerCase();
    const calculationBase = String(row.calculationBase || "").trim();
    let amount = 0;

    if (calculationType === "manual") {
      amount = Math.max(0, Number(row.value || 0));
    } else if (calculationType === "percentage") {
      let baseAmount = getCompVal(values, calculationBase, -1, pfWageBase, esiWageBase);
      if (baseAmount < 0) {
        baseAmount = getCompVal(values, "BASIC", gross);
      }
      amount = (baseAmount * Number(row.value || 0)) / 100;
    } else if (calculationType === "formula") {
      amount = 0;
    } else {
      amount = 0;
    }

    amount = Math.round(amount * 100) / 100;
    setCompVal(values, row, amount);
    if (comp.pfWage || code === "BASIC" || code === "BS" || name.includes("BASIC")) {
      pfWageBase += amount;
    }
    if (comp.esiWage || type === "earning") {
      esiWageBase += amount;
    }
    if (type === "earning") {
      gross += amount;
    }
  }

  return gross > 0 ? String(Math.round(gross * 100) / 100) : "";
};

export default function EmployeeSalaryAssignment() {
  const [searchParams] = useSearchParams();
  const requestedUserId = searchParams.get("user") || searchParams.get("employeeId") || searchParams.get("userId");
  const [users, setUsers] = useState([]);
  const [structures, setStructures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [jobRolesList, setJobRolesList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states - Clean Initial State
  const [form, setForm] = useState(emptyForm);
  const [selectedUserObj, setSelectedUserObj] = useState(null);

  // Component breakdown state
  const [componentRows, setComponentRows] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [lockedMap, setLockedMap] = useState({});

  // Fetch dynamic data from database
  const loadInitialData = async () => {
    try {
      const [salRes, structRes, compUsersRes] = await Promise.allSettled([
        axiosInstance.get("/employee-salaries", { noCache: true }),
        axiosInstance.get("/salary-structures", { noCache: true }),
        axiosInstance.get("/users/company-users", { params: { active: "true" }, _skipErrorNotify: true })
      ]);

      let loadedUsers = [];
      let loadedDepts = [];
      let loadedRoles = [];
      let loadedAssignments = [];

      if (salRes.status === "fulfilled" && salRes.value?.data) {
        const d = salRes.value.data;
        if (Array.isArray(d.users)) loadedUsers = d.users;
        if (Array.isArray(d.assignments)) loadedAssignments = d.assignments;
        if (Array.isArray(d.departments)) loadedDepts = d.departments;
        if (Array.isArray(d.jobRoles)) loadedRoles = d.jobRoles;
      }

      // Build quick lookup dictionaries — indexed by both ObjectId AND name (lowercase)
      const deptMap = new Map();
      loadedDepts.forEach(d => {
        const name = typeof d === "object" ? d.name : d;
        const id = typeof d === "object" ? d._id : d;
        if (name) {
          const cleanName = String(name).trim();
          if (id) deptMap.set(String(id), cleanName);
          deptMap.set(cleanName.toLowerCase(), cleanName);
        }
      });

      const roleMap = new Map();
      loadedRoles.forEach(r => {
        const name = typeof r === "object" ? (r.name || r.title || r.jobRoleName) : r;
        const id = typeof r === "object" ? r._id : r;
        if (name) {
          const cleanName = String(name).trim();
          if (id) roleMap.set(String(id), cleanName);
          roleMap.set(cleanName.toLowerCase(), cleanName);
        }
      });

      // Merge additional users from /users/company-users if available
      if (compUsersRes.status === "fulfilled" && compUsersRes.value?.data) {
        const cuData = compUsersRes.value.data;
        const cuList = Array.isArray(cuData) ? cuData : (cuData.users || cuData.data || []);
        if (Array.isArray(cuList) && cuList.length > 0) {
          const existingIds = new Set(loadedUsers.map(u => String(u._id)));
          cuList.forEach(u => {
            if (!existingIds.has(String(u._id))) {
              const rawDept = typeof u.department === "object" && u.department !== null ? u.department.name : String(u.department || "");
              const rawRole = typeof u.jobRole === "object" && u.jobRole !== null ? u.jobRole.name : String(u.jobRole || u.designation || "");

              const cleanDept = deptMap.get(rawDept) || deptMap.get(rawDept.toLowerCase()) || (isHexId(rawDept) ? "" : rawDept.trim());
              const cleanRole = roleMap.get(rawRole) || roleMap.get(rawRole.toLowerCase()) || (isHexId(rawRole) ? "" : rawRole.trim());

              loadedUsers.push({
                ...u,
                department: cleanDept,
                departmentName: cleanDept,
                jobRole: cleanRole,
                designation: cleanRole
              });
            }
          });
        }
      }

      // Normalize loaded users so no raw hex IDs remain
      const normalizedUsers = loadedUsers.filter(isActiveUser).map(u => {
        let cleanDept = u.departmentName || u.department || "";
        if (typeof cleanDept === "object" && cleanDept !== null) cleanDept = cleanDept.name || "";
        cleanDept = String(cleanDept).trim();
        cleanDept = deptMap.get(cleanDept) || deptMap.get(cleanDept.toLowerCase()) || (isHexId(cleanDept) ? "" : cleanDept);

        let cleanRole = u.jobRole || u.designation || "";
        if (typeof cleanRole === "object" && cleanRole !== null) cleanRole = cleanRole.name || cleanRole.title || "";
        cleanRole = String(cleanRole).trim();
        cleanRole = roleMap.get(cleanRole) || roleMap.get(cleanRole.toLowerCase()) || (isHexId(cleanRole) ? "" : cleanRole);

        return {
          ...u,
          department: cleanDept,
          departmentName: cleanDept,
          jobRole: cleanRole,
          designation: cleanRole
        };
      });

      setUsers(normalizedUsers);
      setAssignments(loadedAssignments);
      setDepartmentsList(loadedDepts);
      setJobRolesList(loadedRoles);

      // DEBUG: Remove after testing
      console.log("🔵 Departments loaded:", loadedDepts.map(d => d.name || d));
      console.log("🔵 JobRoles loaded:", loadedRoles.map(r => r.name || r.title || r));
      console.log("🔵 Users with resolved dept/role:", normalizedUsers.slice(0, 5).map(u => ({
        name: u.name,
        department: u.department,
        jobRole: u.jobRole
      })));

      if (structRes.status === "fulfilled" && structRes.value?.data) {
        const sList = (structRes.value.data.structures || []).filter(s => s.status === "active");
        setStructures(sList);
      }
    } catch (err) {
      console.error("Unable to load dynamic employee salary data:", err);
      setMessage({ type: "error", text: "Unable to load dynamic employees and structures." });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Compute all unique readable Department names (ignoring raw hex ObjectIds)
  const allDepartmentOptions = useMemo(() => {
    const set = new Set();
    const list = [];

    departmentsList.forEach(d => {
      const name = typeof d === "object" ? d.name : d;
      if (name && typeof name === "string" && !isHexId(name) && !set.has(name.toLowerCase().trim())) {
        set.add(name.toLowerCase().trim());
        list.push(name.trim());
      }
    });

    users.forEach(u => {
      const name = u.department || u.departmentName;
      if (name && typeof name === "string" && !isHexId(name) && !set.has(name.toLowerCase().trim())) {
        set.add(name.toLowerCase().trim());
        list.push(name.trim());
      }
    });

    if (form.department && typeof form.department === "string" && !isHexId(form.department) && !set.has(form.department.toLowerCase().trim())) {
      list.push(form.department.trim());
    }

    return list;
  }, [departmentsList, users, form.department]);

  // Compute all unique readable Job Role names (ignoring raw hex ObjectIds)
  const allJobRoleOptions = useMemo(() => {
    const set = new Set();
    const list = [];

    jobRolesList.forEach(j => {
      const name = typeof j === "object" ? (j.name || j.title || j.jobRoleName) : j;
      if (name && typeof name === "string" && !isHexId(name) && !set.has(name.toLowerCase().trim())) {
        set.add(name.toLowerCase().trim());
        list.push(name.trim());
      }
    });

    users.forEach(u => {
      const name = u.jobRole || u.designation;
      if (name && typeof name === "string" && !isHexId(name) && !set.has(name.toLowerCase().trim())) {
        set.add(name.toLowerCase().trim());
        list.push(name.trim());
      }
    });

    if (form.jobRole && typeof form.jobRole === "string" && !isHexId(form.jobRole) && !set.has(form.jobRole.toLowerCase().trim())) {
      list.push(form.jobRole.trim());
    }

    return list;
  }, [jobRolesList, users, form.jobRole]);

  // Selected Salary Structure Object
  const selectedStructureObj = useMemo(() => {
    return structures.find(s => String(s._id) === String(form.salaryStructure)) || null;
  }, [structures, form.salaryStructure]);

  // Recalculate components based on structure rules & gross salary
  const calculateComponents = (structObj = selectedStructureObj, grossVal = form.grossSalary, curOverrides = overrides, curLocks = lockedMap) => {
    if (!structObj || !grossVal || Number(grossVal) <= 0) {
      setComponentRows([]);
      return;
    }

    const baseMonthly = Number(grossVal || 0);
    const componentValues = new Map();
    let pfWageBase = 0;
    let esiWageBase = 0;

    const sorted = [...(structObj.components || [])].sort(
      (a, b) => (a.sortOrder || 1) - (b.sortOrder || 1)
    );

    const rows = sorted.map((row, idx) => {
      const comp = row.component || {};
      const compId = String(comp._id || comp || `comp-${idx}`);
      const compName = comp.name || row.name || `Component ${idx + 1}`;
      const compCode = (comp.code || row.code || "").toUpperCase();
      const compType = comp.type || row.type || "earning";
      const calcType = (row.calculationType || "manual").toLowerCase();
      const calcBase = String(row.calculationBase || "").trim();
      const formulaStr = String(row.formula || "").trim();
      const rateVal = Number(row.value || 0);
      const isLocked = curLocks[compId] !== undefined ? curLocks[compId] : true;

      let amount = 0;

      if (curOverrides[compId] !== undefined && curOverrides[compId] !== "" && !isLocked) {
        amount = Math.max(0, Number(curOverrides[compId]));
      } else if (calcType === "manual") {
        amount = Math.max(0, rateVal);
      } else if (calcType === "percentage") {
        const baseUpper = calcBase.toUpperCase();
        let baseAmount = baseMonthly;

        if (baseUpper.includes("BASIC")) {
          baseAmount = getCompVal(componentValues, "BASIC", 0);
        } else if (baseUpper.includes("PF")) {
          baseAmount = pfWageBase || getCompVal(componentValues, "BASIC", baseMonthly);
        } else if (baseUpper.includes("ESI")) {
          baseAmount = esiWageBase || baseMonthly;
        } else if (componentValues.has(baseUpper)) {
          baseAmount = componentValues.get(baseUpper) || 0;
        } else if (baseUpper.includes("GROSS") || baseUpper.includes("CTC") || !calcBase) {
          baseAmount = baseMonthly;
        } else {
          baseAmount = getCompVal(componentValues, calcBase, baseMonthly);
        }

        amount = (baseAmount * rateVal) / 100;
      } else if (calcType === "formula") {
        let expr = formulaStr.toUpperCase();
        if (!expr && (compCode === "SPL" || compCode === "SPECIAL")) {
          let otherEarnings = 0;
          componentValues.forEach((v) => { otherEarnings += v; });
          amount = Math.max(0, baseMonthly - otherEarnings);
        } else {
          const replacements = [
            { key: "GROSS SALARY", val: baseMonthly },
            { key: "GROSS", val: baseMonthly },
            { key: "CTC", val: baseMonthly }
          ];

          sorted.forEach((otherRow) => {
            const oc = otherRow.component || {};
            const oCode = (oc.code || otherRow.code || "").toUpperCase();
            const oName = (oc.name || otherRow.name || "").toUpperCase();
            const val = getCompVal(componentValues, oCode) || getCompVal(componentValues, oName) || 0;
            if (oName) replacements.push({ key: oName, val });
            if (oCode) replacements.push({ key: oCode, val });
          });

          replacements.sort((a, b) => b.key.length - a.key.length);
          replacements.forEach(({ key, val }) => {
            if (key) {
              const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              expr = expr.replace(new RegExp(`\\b${esc}\\b`, "gi"), String(val));
            }
          });

          expr = expr.replace(/₹|RS\.?/gi, "").trim();

          if (/^[0-9+\-*/().\s]+$/.test(expr)) {
            try {
              const evaluated = Function(`"use strict"; return (${expr})`)();
              amount = Number.isFinite(evaluated) && evaluated >= 0 ? evaluated : 0;
            } catch {
              amount = 0;
            }
          }
        }
      }

      amount = Math.round(amount * 100) / 100;
      setCompVal(componentValues, row, amount);

      if (comp?.pfWage || compCode === "BASIC" || compCode === "DA") {
        pfWageBase += amount;
      }
      if (comp?.esiWage || compType === "earning") {
        esiWageBase += amount;
      }

      // Display text for Calculation Base / Formula column
      let calcDisplay = "--";
      if (calcType === "percentage") {
        calcDisplay = `${rateVal}% of ${calcBase || "Gross"}`;
      } else if (calcType === "formula") {
        calcDisplay = formulaStr || "Gross - (Basic + HRA + CONV)";
      }

      return {
        componentId: compId,
        name: compName,
        code: compCode,
        type: compType,
        calculationType: calcType.charAt(0).toUpperCase() + calcType.slice(1),
        calculationBase: calcDisplay,
        amount: amount,
        isLocked: isLocked,
        isOverride: curOverrides[compId] !== undefined && !isLocked
      };
    });

    if (form.salaryInputType === "gross") {
      const explicitBalanceIndex = rows.findIndex(row => row.type === "earning" && row.calculationType.toLowerCase() === "balance");
      const specialIndex = rows.findIndex(row => row.type === "earning" && (String(row.code).toUpperCase() === "SPL" || String(row.code).toUpperCase() === "SPECIAL" || String(row.name).toUpperCase().includes("SPECIAL")));
      const fallbackIndex = rows.reduce((found, row, index) => row.type === "earning" ? index : found, -1);
      const targetIndex = explicitBalanceIndex >= 0 ? explicitBalanceIndex : (specialIndex >= 0 ? specialIndex : fallbackIndex);
      const otherEarnings = rows.reduce((sum, row, index) => sum + (row.type === "earning" && index !== targetIndex ? Number(row.amount || 0) : 0), 0);
      const difference = Math.round((baseMonthly - otherEarnings) * 100) / 100;

      if (targetIndex >= 0) {
        rows[targetIndex] = {
          ...rows[targetIndex],
          amount: Math.max(0, difference),
          calculationType: "Balance",
          calculationBase: "Auto balance to Gross Salary",
          isAutoBalanced: true
        };
      }
    }

    setComponentRows(rows);
  };

  // Trigger recalculation on structure or grossSalary change
  useEffect(() => {
    if (selectedStructureObj && form.grossSalary) {
      calculateComponents(selectedStructureObj, form.grossSalary, overrides, lockedMap);
    } else {
      setComponentRows([]);
    }
  }, [form.salaryStructure, form.grossSalary, selectedStructureObj]);

  // Handler: When User selects an Employee from Dropdown by ID
  const handleUserSelectById = (userId) => {
    if (!userId) {
      setSelectedUserObj(null);
      setForm(emptyForm);
      setComponentRows([]);
      setOverrides({});
      setLockedMap({});
      return;
    }

    const user = users.find(u => String(u._id) === String(userId));
    if (!user) return;

    setSelectedUserObj(user);

    let userDept = user.departmentName || user.department || "";
    if (isHexId(userDept)) userDept = "";

    let userRole = user.jobRole || user.designation || "";
    if (isHexId(userRole)) userRole = "";

    const existingAssign = assignments.find(
      a => String(a.user?._id || a.user) === String(user._id) && a.status === "active"
    );

    const bankStr = user.bankName
      ? `${user.bankName} - ${user.accountNumber || ""}`
      : (user.accountNumber || "");

    const dojFormatted = user.dateOfJoining
      ? new Date(user.dateOfJoining).toISOString().slice(0, 10)
      : "";
    if (existingAssign) {
      // Assignment rules remain selected, but employee details always come from the employee profile.
      setForm({
        user: user._id,
        department: userDept || existingAssign.department || "",
        jobRole: userRole || existingAssign.designation || "",
        designation: userRole || existingAssign.designation || "",
        dateOfJoining: dojFormatted || (existingAssign.dateOfJoining ? new Date(existingAssign.dateOfJoining).toISOString().slice(0, 10) : ""),
        salaryStructure: existingAssign.salaryStructure?._id || existingAssign.salaryStructure || "",
        effectiveFrom: existingAssign.effectiveFrom
          ? new Date(existingAssign.effectiveFrom).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        salaryInputType: existingAssign.salaryInputType || "gross",
        currency: existingAssign.currency || "INR - Indian Rupee",
        payFrequency: existingAssign.payFrequency || "Monthly",
        paymentMode: existingAssign.paymentMode || "Bank Transfer",
        bankAccount: bankStr || existingAssign.bankAccount || "",
        // Salary assignment is the source of truth. Never overwrite it with the
        // legacy salary field stored on the employee profile.
        grossSalary: String(existingAssign.baseAmount || existingAssign.monthlyGross || ""),
        notes: existingAssign.notes || existingAssign.remarks || ""
      });

      const initialOverrides = {};
      const initialLocks = {};
      (existingAssign.components || []).forEach(c => {
        const id = String(c.component?._id || c.component);
        if (c.isOverride) initialOverrides[id] = c.amount;
        initialLocks[id] = c.isLocked !== false;
      });
      setOverrides(initialOverrides);
      setLockedMap(initialLocks);
    } else {
      // New salary assignment for this employee
      setForm(prev => ({
        ...prev,
        user: user._id,
        department: userDept || prev.department,
        jobRole: userRole || prev.jobRole,
        designation: userRole || prev.designation,
        dateOfJoining: dojFormatted,
        bankAccount: bankStr,
        salaryStructure: "",
        // A new salary must be defined as part of this assignment; employee
        // profile data must not silently decide payroll values.
        grossSalary: "",
        notes: ""
      }));
      setOverrides({});
      setLockedMap({});
    }
  };

  useEffect(() => {
    if (!requestedUserId || !users.length) return;
    const requestedUser = users.find((user) => String(user._id) === String(requestedUserId));
    if (requestedUser) handleUserSelectById(requestedUser._id);
  }, [requestedUserId, users, assignments]);

  // Handle amount override change
  const handleAmountChange = (compId, val) => {
    const newOverrides = { ...overrides, [compId]: val };
    setOverrides(newOverrides);
    calculateComponents(selectedStructureObj, form.grossSalary, newOverrides, lockedMap);
  };

  // Toggle lock / unlock
  const toggleLock = (compId) => {
    const currentLock = lockedMap[compId] !== undefined ? lockedMap[compId] : true;
    const nextLock = !currentLock;
    const newLockedMap = { ...lockedMap, [compId]: nextLock };
    setLockedMap(newLockedMap);

    let newOverrides = { ...overrides };
    if (nextLock) {
      delete newOverrides[compId];
      setOverrides(newOverrides);
    }
    calculateComponents(selectedStructureObj, form.grossSalary, newOverrides, newLockedMap);
  };

  // Calculate totals
  const totals = useMemo(() => {
    let earnings = 0;
    let deductions = 0;
    componentRows.forEach(r => {
      const amt = Number(r.amount) || 0;
      if (r.type === "earning") earnings += amt;
      else if (r.type === "deduction") deductions += amt;
    });
    return {
      earnings,
      deductions,
      net: Math.max(0, earnings - deductions)
    };
  }, [componentRows]);

  // Current active assignment for selected user
  const currentAssignment = useMemo(() => {
    if (!form.user) return null;
    return assignments.find(
      a => String(a.user?._id || a.user) === String(form.user) && a.status === "active"
    ) || null;
  }, [assignments, form.user]);

  const salaryHistory = useMemo(() => {
    if (!currentAssignment) return [];

    const previous = Array.isArray(currentAssignment.history) ? currentAssignment.history : [];
    const current = {
      _id: currentAssignment._id,
      effectiveFrom: currentAssignment.effectiveFrom,
      salaryStructureName: currentAssignment.salaryStructure?.name || currentAssignment.salaryStructureName || "",
      monthlyGross: currentAssignment.monthlyGross,
      baseAmount: currentAssignment.baseAmount,
      revisedAt: currentAssignment.updatedAt || currentAssignment.createdAt,
      isCurrent: true
    };

    return [...previous, current].sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      return new Date(b.effectiveFrom || b.revisedAt || 0).getTime()
        - new Date(a.effectiveFrom || a.revisedAt || 0).getTime();
    });
  }, [currentAssignment]);

  const deleteSalaryHistory = async (historyId) => {
    if (!currentAssignment?._id || !historyId) return;
    if (!window.confirm("Delete this previous salary record permanently?")) return;
    try {
      const response = await axiosInstance.delete(`/employee-salaries/${currentAssignment._id}/history/${historyId}`);
      const updated = response.data?.assignment;
      if (updated) setAssignments(previous => previous.map(item => item._id === updated._id ? updated : item));
      setMessage({ type: "success", text: response.data?.message || "Previous salary record deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to delete previous salary record." });
    }
  };

  const handleUnassignCurrentAssignment = async () => {
    if (!currentAssignment?._id) return;
    if (!window.confirm(`Are you sure you want to unassign salary for ${selectedUserObj?.name || "this employee"}?`)) return;

    try {
      setSaving(true);
      await axiosInstance.delete(`/employee-salaries/${currentAssignment._id}`);
      setMessage({ type: "success", text: "Salary unassigned successfully." });
      setSelectedUserObj(null);
      setForm(emptyForm);
      setComponentRows([]);
      setOverrides({});
      setLockedMap({});
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Unable to unassign salary." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Assignment
  const handleSave = async () => {
    if (!form.user) {
      setMessage({ type: "error", text: "Please select an employee." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.salaryStructure) {
      setMessage({ type: "error", text: "Please select a salary structure." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.effectiveFrom) {
      setMessage({ type: "error", text: "Please enter an effective date." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.grossSalary || Number(form.grossSalary) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid Gross Salary." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (form.salaryInputType === "gross" && Math.abs(totals.earnings - Number(form.grossSalary)) > 0.01) {
      setMessage({ type: "error", text: "Earning components exceed the Gross Salary. Please correct the selected salary structure." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      user: form.user,
      salaryStructure: form.salaryStructure,
      department: form.department,
      designation: form.jobRole || form.designation,
      dateOfJoining: form.dateOfJoining,
      effectiveFrom: form.effectiveFrom,
      salaryInputType: form.salaryInputType,
      currency: form.currency,
      payFrequency: form.payFrequency,
      paymentMode: form.paymentMode,
      bankAccount: form.bankAccount,
      baseAmount: Number(form.grossSalary),
      notes: form.notes,
      overrides: Object.entries(overrides).map(([k, v]) => ({
        component: k,
        amount: Number(v),
        isLocked: lockedMap[k] !== undefined ? lockedMap[k] : true
      }))
    };

    try {
      const res = await axiosInstance.post("/employee-salaries", payload);
      setMessage({
        type: "success",
        text: res.data?.message || "Employee salary structure assigned successfully!"
      });
      if (res.data?.assignment) {
        setAssignments(prev => {
          const list = prev.filter(a => String(a.user?._id || a.user) !== String(form.user));
          return [res.data.assignment, ...list];
        });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Assignment save error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Unable to save employee salary assignment."
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="esa-container">
      {/* Alert Banner */}
      {message && (
        <div className={`esa-alert ${message.type}`}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Main Card: Assign Salary Structure */}
      <div className="esa-card">
        <div className="esa-card-header">
          <h2>Employee Salary</h2>
        </div>

        {/* Row 1: Employee, Department, Job Role, Date of Joining */}
        <div className="esa-grid-4">
          {/* Employee Dropdown */}
          <div className="esa-form-group">
            <label>
              Employee <span className="req">*</span>
            </label>
            <select
              className="esa-select"
              value={form.user}
              onChange={(e) => handleUserSelectById(e.target.value)}
              required
            >
              <option value="">-- Select Employee --</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="esa-form-group">
            <label>Department</label>
            <select
              className="esa-select"
              value={form.department}
              disabled
              aria-label="Employee department"
            >
              <option value="">-- Select Department --</option>
              {allDepartmentOptions.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Job Role (Designation) */}
          <div className="esa-form-group">
            <label>Job Role</label>
            <select
              className="esa-select"
              value={form.jobRole}
              disabled
              aria-label="Employee job role"
            >
              <option value="">-- Select Job Role --</option>
              {allJobRoleOptions.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Date of Joining */}
          <div className="esa-form-group">
            <label>Date of Joining</label>
            <div className="esa-input-icon-wrap">
              <FiCalendar className="prefix-icon" />
              <input
                type="date"
                className="esa-input"
                value={form.dateOfJoining}
                readOnly
              />
            </div>
          </div>
        </div>

        {form.user && (
          <p className="esa-readonly-note"><FiLock /> Employee profile details are read-only here. Update them from Employee Edit Profile.</p>
        )}

        {/* Row 2: Salary Structure, Effective From, Salary Input Type, Currency */}
        <div className="esa-grid-4">
          {/* Salary Structure */}
          <div className="esa-form-group">
            <label>
              Salary Structure <span className="req">*</span>
            </label>
            <select
              className="esa-select"
              value={form.salaryStructure}
              onChange={(e) => {
                const structureId = e.target.value;
                const structure = structures.find(item => String(item._id) === String(structureId));
                const autoGross = getStructureDefinedGross(structure);
                setForm(prev => ({
                  ...prev,
                  salaryStructure: structureId,
                  salaryInputType: structure?.salaryInputType || "gross",
                  grossSalary: autoGross
                }));
                setOverrides({});
                setLockedMap({});
                if (structure && autoGross) {
                  calculateComponents(structure, autoGross, {}, {});
                }
              }}
              required
            >
              <option value="">-- Select Salary Structure --</option>
              {structures.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Effective From */}
          <div className="esa-form-group">
            <label>
              Effective From <span className="req">*</span>
            </label>
            <div className="esa-input-icon-wrap">
              <FiCalendar className="prefix-icon" />
              <input
                type="date"
                className="esa-input"
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Salary Input Type */}
          <div className="esa-form-group">
            <label>Salary Input Type</label>
            <select
              className="esa-select"
              value={form.salaryInputType}
              disabled
            >
              <option value="gross">Gross</option>
            </select>
          </div>

          {/* Currency */}
          <div className="esa-form-group">
            <label>Currency</label>
            <select
              className="esa-select"
              value={form.currency}
              disabled
            >
              <option value="INR - Indian Rupee">INR - Indian Rupee</option>
              <option value="USD - US Dollar">USD - US Dollar</option>
              <option value="EUR - Euro">EUR - Euro</option>
              <option value="GBP - British Pound">GBP - British Pound</option>
            </select>
          </div>
        </div>

        {/* Row 3: Pay Frequency, Payment Mode, Bank Name, Account Holder Name */}
        <div className="esa-grid-4">
          {/* Pay Frequency */}
          <div className="esa-form-group">
            <label>Pay Frequency</label>
            <select
              className="esa-select"
              value={form.payFrequency}
              disabled
            >
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div className="esa-form-group">
            <label>Payment Mode</label>
            <select
              className="esa-select"
              value={form.paymentMode}
              onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {/* Bank Name */}
          <div className="esa-form-group">
            <label>Bank Name</label>
            <input
              type="text"
              className="esa-input"
              value={selectedUserObj?.bankName || "—"}
              readOnly
              placeholder="Bank Name"
            />
          </div>

          {/* Account Holder Name */}
          <div className="esa-form-group">
            <label>Account Holder Name</label>
            <input
              type="text"
              className="esa-input"
              value={selectedUserObj?.bankHolderName || selectedUserObj?.name || "—"}
              readOnly
              placeholder="Account Holder Name"
            />
          </div>
        </div>

        {/* Row 4: Account Number, IFSC Code, Monthly Gross Salary */}
        <div className="esa-grid-4">
          {/* Account Number */}
          <div className="esa-form-group">
            <label>Account Number</label>
            <input
              type="text"
              className="esa-input"
              value={selectedUserObj?.accountNumber || "—"}
              readOnly
              placeholder="Account Number"
            />
          </div>

          {/* IFSC Code */}
          <div className="esa-form-group">
            <label>IFSC Code</label>
            <input
              type="text"
              className="esa-input"
              value={selectedUserObj?.ifsc || "—"}
              readOnly
              placeholder="IFSC Code"
            />
          </div>

          {/* Monthly Gross Salary */}
          <div className="esa-form-group">
            <label>
              Monthly Gross Salary <span className="req">*</span>
            </label>
            <div className="esa-input-icon-wrap">
              <span className="prefix-icon">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                className="esa-input"
                placeholder="Auto-calculated from salary structure"
                value={form.grossSalary}
                readOnly
                required
              />
            </div>
          </div>

          {/* Notes / Remarks */}
          <div className="esa-form-group">
            <label>Notes / Remarks</label>
            <input
              type="text"
              className="esa-input"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Salary Components Section */}
      <div className="esa-card">
        <div className="esa-card-header esa-card-header-flex">
          <div>
            <h2>Salary Components</h2>
            <p>Component amounts are calculated based on the defined salary structure.</p>
          </div>
          <button
            type="button"
            className="esa-btn-recalc"
            disabled={!form.grossSalary || !selectedStructureObj}
            onClick={() => calculateComponents(selectedStructureObj, form.grossSalary, overrides, lockedMap)}
          >
            <FiRefreshCw /> Recalculate
          </button>
        </div>

        {/* Components Table */}
        <div className="esa-table-wrap">
          <table className="esa-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Sl.</th>
                <th>Component</th>
                <th style={{ width: 110 }}>Type</th>
                <th style={{ width: 140 }}>Calculation Type</th>
                <th>Calculation Base / Formula</th>
                <th style={{ textAlign: "right", width: 200 }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {componentRows.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 28, color: "#64748b" }}>
                    Select an employee, salary structure, and enter monthly gross salary above to calculate components.
                  </td>
                </tr>
              ) : (
                componentRows.map((row, idx) => (
                  <tr key={row.componentId || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{row.name}</strong>{" "}
                      <span style={{ color: "#64748b" }}>({row.code})</span>
                    </td>
                    <td>
                      <span className={`esa-badge ${row.type}`}>
                        {row.type === "earning" ? "Earning" : "Deduction"}
                      </span>
                    </td>
                    <td>{row.calculationType}</td>
                    <td>{row.calculationBase}</td>
                    <td>
                      <div className="esa-amount-cell">
                        {row.isLocked ? (
                          <input
                            type="text"
                            readOnly
                            className="esa-amount-input locked"
                            value={formatCurrencyNumber(row.amount)}
                          />
                        ) : (
                          <input
                            type="number"
                            step="any"
                            className="esa-amount-input"
                            value={row.amount}
                            onChange={(e) => handleAmountChange(row.componentId, e.target.value)}
                          />
                        )}
                        <button
                          type="button"
                          className={`esa-lock-btn ${row.isLocked ? "" : "unlocked"}`}
                          title={row.isLocked ? "Click to unlock and override amount" : "Click to lock and auto-compute"}
                          onClick={() => toggleLock(row.componentId)}
                        >
                          {row.isLocked ? <FiLock /> : <FiUnlock />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Calculation Strip */}
        <div className="esa-summary-strip">
          {/* Total Earnings */}
          <div className="esa-sum-card earnings">
            <small>Total Earnings</small>
            <strong>₹ {formatCurrencyNumber(totals.earnings)}</strong>
          </div>

          <div className="esa-operator">−</div>

          {/* Total Deductions */}
          <div className="esa-sum-card deductions">
            <small>Total Deductions</small>
            <strong>₹ {formatCurrencyNumber(totals.deductions)}</strong>
          </div>

          <div className="esa-operator">=</div>

          {/* Net Salary */}
          <div className="esa-sum-card net">
            <small>Net Salary (Per Month)</small>
            <strong>₹ {formatCurrencyNumber(totals.net)}</strong>
          </div>

          {/* Notes Input */}
          <div className="esa-notes-box">
            <label>Notes</label>
            <input
              type="text"
              placeholder="Add any note here..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Previous Salary History Section */}
      <div className="esa-card">
        <div className="esa-card-header">
          <h2>Previous Salary History</h2>
        </div>

        <div className="esa-table-wrap" style={{ marginTop: 0 }}>
          <table className="esa-history-table">
            <thead>
              <tr>
                <th>Effective From</th>
                <th>Structure</th>
                <th>Gross Salary</th>
                <th>Created On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {salaryHistory.length > 0 ? (
                salaryHistory.map((hist, idx) => (
                  <tr key={hist._id || idx}>
                    <td>
                      {hist.effectiveFrom
                        ? new Date(hist.effectiveFrom).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      <strong>{hist.salaryStructureName || "Salary Structure"}</strong>
                      {hist.isCurrent && <span className="esa-badge earning" style={{ marginLeft: 8 }}>Current</span>}
                    </td>
                    <td>
                      <strong>₹ {formatCurrencyNumber(hist.monthlyGross || hist.baseAmount)}</strong>
                    </td>
                    <td>
                      {hist.revisedAt
                        ? new Date(hist.revisedAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      {hist.isCurrent ? (
                        <span className="esa-history-current-label">Active</span>
                      ) : (
                        <button
                          type="button"
                          className="esa-history-delete"
                          onClick={() => deleteSalaryHistory(hist._id)}
                          title="Delete previous salary record"
                          aria-label="Delete previous salary record"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>
                    {selectedUserObj
                      ? "No previous salary revisions on record for this employee."
                      : "Select an employee above to view their previous salary history."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="esa-bottom-actions">
        {currentAssignment?._id && (
          <button
            type="button"
            className="esa-btn-cancel"
            style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
            disabled={saving}
            onClick={handleUnassignCurrentAssignment}
          >
            Unassign Salary
          </button>
        )}
        <button
          type="button"
          className="esa-btn-cancel"
          onClick={() => {
            setSelectedUserObj(null);
            setForm(emptyForm);
            setComponentRows([]);
            setOverrides({});
            setLockedMap({});
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="esa-btn-save"
          disabled={saving || !form.user || !form.grossSalary}
          onClick={handleSave}
        >
          <FiSave /> {saving ? "Saving..." : "Save Assignment"}
        </button>
      </div>
    </div>
  );
}
