import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  ChevronDown,
  Building2,
  Briefcase,
  Save,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { getCurrentUserId, getStoredUser, getUserIds, loadPagePermission } from '../../utils/pageAccess';
import { toast } from 'react-toastify';
import './LeavePolicy.css';

// Dynamic Company Custom Leave Types
const DEFAULT_LEAVE_TYPES = [];

const normalizeRoleValue = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const getUserName = value => {
  if (!value) return '';
  if (typeof value === 'object') return value.name || value.email || '';
  return String(value);
};

const getFormattedDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const LeavePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  // Real Backend Data State
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Dynamic Company Custom Leave Types State (Top Form)
  const [leaveTypesList, setLeaveTypesList] = useState(DEFAULT_LEAVE_TYPES);
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    typeName: '',
    description: '',
    sortOrder: '1',
    status: 'Active'
  });

  // Form State for Leave Policy Configuration (Bottom Form)
  const [formData, setFormData] = useState({
    policyName: '',
    department: '',
    jobRoles: [],
    leaveType: '',
    payType: 'Paid', // Paid or Unpaid for this policy
    entitledDays: '',
    monthlyAllowed: '',
    carryForward: 'Yes',
    maxCarryForwardDays: '',
    encashmentAllowed: 'Yes',
    probationApplicable: 'No',
    sortOrder: '',
    status: 'Active'
  });

  // Multi-select dropdown open state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageAccess, setPageAccess] = useState({ canEdit: false, canDelete: false });

  // Extract Logged-in Company Info from LocalStorage dynamically
  const companyInfo = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('superAdmin');
      const companyStr = localStorage.getItem('company') || localStorage.getItem('companyDetails');
      const user = userStr ? JSON.parse(userStr) : null;
      const company = companyStr ? JSON.parse(companyStr) : null;

      const name = company?.companyName || user?.companyName || user?.companyDetails?.companyName || 'CIIS Network';
      const code = company?.companyCode || user?.companyCode || user?.code || '';
      const id = company?._id || user?.company?._id || user?.company || '';
      return { name, code, id };
    } catch {
      return { name: 'CIIS Network', code: '', id: '' };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAccess = async () => {
      try {
        const storedUser = getStoredUser() || {};
        const roles = [storedUser.companyRole, storedUser.role, storedUser.jobRole].map(normalizeRoleValue);
        const fallbackManager = roles.some(role => ['owner', 'admin', 'hr', 'super_admin', 'superadmin', 'company_owner', 'companyowner'].includes(role));
        const currentUserId = getCurrentUserId();
        const page = await loadPagePermission('/ciisUser/leave-policy');
        const editIds = getUserIds(page.editUsers);
        const deleteIds = getUserIds(page.deleteUsers);

        if (!cancelled) {
          setPageAccess({
            canEdit: fallbackManager || editIds.includes(currentUserId),
            canDelete: fallbackManager || deleteIds.includes(currentUserId)
          });
        }
      } catch (error) {
        const storedUser = getStoredUser() || {};
        const roles = [storedUser.companyRole, storedUser.role, storedUser.jobRole].map(normalizeRoleValue);
        const fallbackManager = roles.some(role => ['owner', 'admin', 'hr', 'super_admin', 'superadmin', 'company_owner', 'companyowner'].includes(role));
        if (!cancelled) setPageAccess({ canEdit: fallbackManager, canDelete: fallbackManager });
      }
    };

    loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to extract clean Department Name and Branch Name
  const getDeptDisplayName = (dept) => {
    if (!dept) return '';
    if (typeof dept === 'string') return dept;
    
    const deptName = dept.name || dept.departmentName || '';
    const branchObj = typeof dept.branch === 'object' ? dept.branch : null;
    const branchName = branchObj ? (branchObj.name || branchObj.branchCode) : '';

    if (deptName && branchName) {
      return `${deptName} (${branchName})`;
    }
    return deptName || dept._id || '';
  };

  const getRoleDisplayName = (role) => {
    if (!role) return '';
    if (typeof role === 'string') return role;
    return role.name || role.roleName || role.title || '';
  };

  const getRecordId = (record) => {
    if (!record) return '';
    if (typeof record === 'string') return record;
    return record._id || record.id || '';
  };

  // Fetch REAL Departments, Job Roles, Custom Leave Types, and Leave Policies from REST API
  const fetchRealCompanyData = useCallback(async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Real Leave Types from MongoDB API
      let loadedLeaveTypes = [];
      const ltRes = await axios.get('/leave-types', { _skipErrorNotify: true });
      loadedLeaveTypes = ltRes?.data?.leaveTypes || ltRes?.data?.data || [];

      setLeaveTypesList(Array.isArray(loadedLeaveTypes) ? loadedLeaveTypes : []);

      // 2. Fetch Real Departments from Backend
      let deptsData = [];
      try {
        const deptsRes = await axios.get('/departments', { _skipErrorNotify: true });
        deptsData = deptsRes?.data?.departments || deptsRes?.data?.data || deptsRes?.data || [];
      } catch (err) {
        console.warn('Could not fetch departments endpoint', err);
      }

      if (Array.isArray(deptsData)) {
        setDepartments(deptsData);
      }

      // 3. Fetch Real Job Roles from Backend
      let rolesData = [];
      try {
        const rolesRes = await axios.get('/job-roles', { _skipErrorNotify: true });
        rolesData = rolesRes?.data?.jobRoles || rolesRes?.data?.data || rolesRes?.data || [];
      } catch (err) {
        console.warn('Could not fetch job roles endpoint', err);
      }

      if (Array.isArray(rolesData)) {
        setJobRoles(rolesData);
      }

      // 4. Fetch Real Leave Policies from MongoDB API
      let loadedPolicies = [];
      try {
        const polRes = await axios.get('/leave-policies', { _skipErrorNotify: true });
        const rawPolicies = polRes?.data?.leavePolicies || polRes?.data?.data || [];
        loadedPolicies = rawPolicies.map((p) => ({
          id: p._id || p.id,
          policyName: p.policyName,
          departmentId: getRecordId(p.department),
          department: getDeptDisplayName(p.department),
          jobRoles: Array.isArray(p.jobRoles) && p.jobRoles.length > 0 
            ? p.jobRoles.map(r => getRoleDisplayName(r))
            : (p.jobRoleNames || []),
          leaveType: p.leaveType,
          payType: p.payType || 'Paid',
          entitledDays: p.entitledDays,
          monthlyAllowed: p.monthlyAllowed,
          carryForward: p.carryForward,
          maxCarryForwardDays: p.maxCarryForwardDays,
          encashmentAllowed: p.encashmentAllowed,
          probationApplicable: p.probationApplicable,
          sortOrder: p.sortOrder,
          status: p.status,
          createdByName: getUserName(p.createdBy),
          updatedByName: getUserName(p.updatedBy),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }));
      } catch (error) {
        throw new Error(error?.response?.data?.message || error?.response?.data?.error || 'Failed to load leave policies');
      }

      setPolicies(loadedPolicies);
    } catch (err) {
      console.error('Error fetching real company data:', err);
      toast.error(err?.message || 'Failed to load leave policy data');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchRealCompanyData();
  }, [fetchRealCompanyData]);

  // Handle Adding New Custom Leave Type (TOP CARD)
  const handleLeaveTypeSubmit = async (e) => {
    e.preventDefault();

    if (!pageAccess.canEdit) {
      toast.error('You do not have permission to create leave types.');
      return;
    }

    if (!leaveTypeForm.typeName.trim()) {
      toast.error('Please enter a Leave Type name');
      return;
    }

    const typeNameClean = leaveTypeForm.typeName.trim();
    const exists = leaveTypesList.some(
      (lt) => lt.name.toLowerCase() === typeNameClean.toLowerCase()
    );

    if (exists) {
      toast.warning(`Leave type "${typeNameClean}" already exists!`);
      return;
    }

    const payload = {
      name: typeNameClean,
      description: leaveTypeForm.description.trim(),
      sortOrder: Number(leaveTypeForm.sortOrder) || (leaveTypesList.length + 1),
      status: leaveTypeForm.status,
      company: companyInfo.id
    };

    try {
      const res = await axios.post('/leave-types', payload, { _skipErrorNotify: true });
      const createdLt = res?.data?.leaveType;

      if (!createdLt?._id) {
        throw new Error('Leave type was not saved by the server');
      }
      const newLeaveType = createdLt;

      const updatedTypes = [...leaveTypesList, newLeaveType];
      setLeaveTypesList(updatedTypes);
      toast.success(`Leave Type "${typeNameClean}" saved to database! Available below.`);

      // Reset Form
      setLeaveTypeForm({
        typeName: '',
        description: '',
        sortOrder: String(updatedTypes.length + 1),
        status: 'Active'
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save leave type');
    }
  };

  // Handle Deleting Custom Leave Type
  const handleDeleteLeaveType = async (id) => {
    if (!pageAccess.canDelete) {
      toast.error('You do not have permission to delete leave types.');
      return;
    }

    const target = leaveTypesList.find((lt) => (lt._id || lt.id) === id);
    if (!target) return;

    if (window.confirm(`Delete leave type "${target.name}"?`)) {
      try {
        if (target._id) {
          await axios.delete(`/leave-types/${target._id}`, { _skipErrorNotify: true });
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to delete leave type');
        return;
      }

      const updatedTypes = leaveTypesList.filter((lt) => (lt._id || lt.id) !== id);
      setLeaveTypesList(updatedTypes);
      toast.info(`Leave Type "${target.name}" removed.`);
    }
  };

  // Department change handler - resets selected roles for that dept
  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value;
    setFormData((prev) => ({
      ...prev,
      department: selectedDept,
      jobRoles: [] // Reset selected job roles on department change
    }));
    setRoleDropdownOpen(false);
  };

  // Available REAL job roles filtered by selected department
  const availableJobRoles = useMemo(() => {
    if (!formData.department) return [];

    const selectedDeptObj = departments.find(
      (d) => getDeptDisplayName(d) === formData.department || getRecordId(d) === formData.department
    );

    const selectedDeptId = selectedDeptObj ? getRecordId(selectedDeptObj) : formData.department;
    const selectedDeptName = selectedDeptObj ? (selectedDeptObj.name || selectedDeptObj.departmentName || formData.department) : formData.department;

    // Filter job roles that belong to this department
    const matchingRoles = jobRoles.filter((role) => {
      if (role?.isActive === false || role?.status === 'Inactive') return false;
      const roleDeptId = getRecordId(role.department) || getRecordId(role.departmentId) || role.deptId;
      const roleDeptName = typeof role.department === 'object' ? (role.department?.name || role.department?.departmentName || '') : (role.departmentName || '');

      return (
        roleDeptId === selectedDeptId ||
        (roleDeptName && roleDeptName.toLowerCase() === selectedDeptName.toLowerCase()) ||
        (typeof role.department === 'string' && role.department.toLowerCase() === selectedDeptName.toLowerCase())
      );
    });

    return [...new Map(
      matchingRoles
        .map((role) => getRoleDisplayName(role).trim())
        .filter(Boolean)
        .map((name) => [name.toLowerCase(), name])
    ).values()].sort((a, b) => a.localeCompare(b));
  }, [formData.department, departments, jobRoles]);

  const departmentOptions = useMemo(() => {
    const unique = new Map();
    departments
      .filter((dept) => dept?.isActive !== false && dept?.status !== 'Inactive')
      .forEach((dept) => {
        const label = getDeptDisplayName(dept).trim();
        if (!label) return;
        const key = getRecordId(dept) || label.toLowerCase();
        if (!unique.has(key)) unique.set(key, { record: dept, label });
      });
    return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [departments]);

  const activeLeaveTypes = useMemo(() => {
    const unique = new Map();
    leaveTypesList
      .filter((leaveType) => leaveType?.status === 'Active')
      .sort((a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0))
      .forEach((leaveType) => {
        const name = String(leaveType?.name || '').trim();
        if (name && !unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), leaveType);
      });
    return [...unique.values()];
  }, [leaveTypesList]);

  // Toggle job role selection (Multi-Select)
  const toggleJobRole = (roleName) => {
    setFormData((prev) => {
      const exists = prev.jobRoles.includes(roleName);
      const updatedRoles = exists
        ? prev.jobRoles.filter((r) => r !== roleName)
        : [...prev.jobRoles, roleName];
      return { ...prev, jobRoles: updatedRoles };
    });
  };

  // Select all job roles for current department
  const selectAllRoles = () => {
    if (availableJobRoles.length === 0) return;
    setFormData((prev) => ({ ...prev, jobRoles: [...availableJobRoles] }));
  };

  // Clear all selected job roles
  const clearAllRoles = () => {
    setFormData((prev) => ({ ...prev, jobRoles: [] }));
  };

  // Generic input handler for Leave Policy Form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'carryForward' && value === 'No' ? { maxCarryForwardDays: '0' } : {})
    }));
  };

  // Leave Policy Form Submission (MongoDB API Integration)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pageAccess.canEdit) {
      toast.error('You do not have permission to create or update leave policies.');
      return;
    }

    if (!formData.policyName.trim()) {
      toast.error('Please enter a policy name');
      return;
    }
    if (!formData.department) {
      toast.error('Please select a department');
      return;
    }
    if (formData.jobRoles.length === 0) {
      toast.error('Please select at least one job role for this department');
      return;
    }
    if (!formData.leaveType) {
      toast.error('Please select a leave type');
      return;
    }
    if (formData.entitledDays === '' || Number(formData.entitledDays) < 0) {
      toast.error('Please enter valid entitled days');
      return;
    }
    if (formData.monthlyAllowed === '' || Number(formData.monthlyAllowed) < 0) {
      toast.error('Please enter valid monthly allowed days');
      return;
    }
    if (formData.carryForward === 'Yes' && (formData.maxCarryForwardDays === '' || Number(formData.maxCarryForwardDays) < 0)) {
      toast.error('Please enter valid max carry forward days');
      return;
    }
    if (formData.sortOrder === '' || Number(formData.sortOrder) < 1) {
      toast.error('Please enter a valid sort order');
      return;
    }

    // Resolve Department ObjectId
    const deptObj = departments.find(d => getDeptDisplayName(d) === formData.department || getRecordId(d) === formData.department);
    const deptId = deptObj ? getRecordId(deptObj) : formData.department;

    // Resolve JobRole ObjectIds
    const selectedDeptName = deptObj ? (deptObj.name || deptObj.departmentName || formData.department) : formData.department;
    const selectedRolesObjs = jobRoles.filter((role) => {
      if (!formData.jobRoles.includes(getRoleDisplayName(role))) return false;
      const roleDeptId = getRecordId(role.department) || getRecordId(role.departmentId) || role.deptId;
      const roleDeptName = typeof role.department === 'object'
        ? (role.department?.name || role.department?.departmentName || '')
        : (role.departmentName || role.department || '');
      return String(roleDeptId || '') === String(deptId || '') ||
        (roleDeptName && roleDeptName.toLowerCase() === String(selectedDeptName).toLowerCase());
    });
    const roleIds = [...new Set(selectedRolesObjs.map(r => getRecordId(r)).filter(Boolean))];

    if (!/^[a-f\d]{24}$/i.test(String(deptId || ''))) {
      toast.error('Selected department is invalid. Refresh the page and select it again.');
      return;
    }
    if (roleIds.length !== formData.jobRoles.length || roleIds.some(id => !/^[a-f\d]{24}$/i.test(String(id)))) {
      toast.error('One or more selected job roles are invalid. Select the roles again.');
      return;
    }

    const payload = {
      policyName: formData.policyName.trim(),
      department: deptId,
      jobRoles: roleIds,
      jobRoleNames: formData.jobRoles,
      leaveType: formData.leaveType,
      payType: formData.payType || 'Paid',
      entitledDays: Number(formData.entitledDays) || 0,
      monthlyAllowed: Number(formData.monthlyAllowed) || 0,
      carryForward: formData.carryForward,
      maxCarryForwardDays: Number(formData.maxCarryForwardDays) || 0,
      encashmentAllowed: formData.encashmentAllowed,
      probationApplicable: formData.probationApplicable,
      sortOrder: Number(formData.sortOrder) || 1,
      status: formData.status,
      company: companyInfo.id
    };

    try {
      if (editingId) {
        // Update Existing Policy in MongoDB
        await axios.put(`/leave-policies/${editingId}`, payload, { _skipErrorNotify: true });

        toast.success('Leave policy updated in database!');
      } else {
        // Create New Policy in MongoDB
        await axios.post('/leave-policies', payload, { _skipErrorNotify: true });

        toast.success('New leave policy created in database!');
      }

      await fetchRealCompanyData();
      resetForm();
    } catch (err) {
      console.error('Error saving policy to API:', err);
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to save leave policy');
    }
  };

  // Edit existing policy
  const handleEdit = (policy) => {
    if (!pageAccess.canEdit) {
      toast.error('You do not have permission to edit leave policies.');
      return;
    }

    setEditingId(policy.id);
    setFormData({
      policyName: policy.policyName,
      department: policy.departmentId || getRecordId(
        departments.find(dept => getDeptDisplayName(dept) === policy.department)
      ),
      jobRoles: policy.jobRoles || [],
      leaveType: policy.leaveType,
      payType: policy.payType || 'Paid',
      entitledDays: String(policy.entitledDays),
      monthlyAllowed: String(policy.monthlyAllowed),
      carryForward: policy.carryForward,
      maxCarryForwardDays: String(policy.maxCarryForwardDays),
      encashmentAllowed: policy.encashmentAllowed,
      probationApplicable: policy.probationApplicable,
      sortOrder: String(policy.sortOrder),
      status: policy.status
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Delete policy
  const handleDelete = async (id) => {
    if (!pageAccess.canDelete) {
      toast.error('You do not have permission to delete leave policies.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this leave policy?')) {
      try {
        await axios.delete(`/leave-policies/${id}`, { _skipErrorNotify: true });
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to delete leave policy');
        return;
      }

      const updated = policies.filter((item) => item.id !== id);
      setPolicies(updated);
      toast.info('Leave policy removed');
    }
  };

  // Reset form fields
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      policyName: '',
      department: '',
      jobRoles: [],
      leaveType: '',
      payType: 'Paid',
      entitledDays: '',
      monthlyAllowed: '',
      carryForward: 'Yes',
      maxCarryForwardDays: '',
      encashmentAllowed: 'Yes',
      probationApplicable: 'No',
      sortOrder: '',
      status: 'Active'
    });
    setRoleDropdownOpen(false);
  };

  // Filtered Policies for Table
  const filteredPolicies = useMemo(() => {
    if (!searchTerm.trim()) return policies;
    const q = searchTerm.toLowerCase();
    return policies.filter(
      (p) =>
        p.policyName.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.leaveType.toLowerCase().includes(q) ||
        p.jobRoles.some((r) => r.toLowerCase().includes(q))
    );
  }, [policies, searchTerm]);

  // Paginated policies
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredPolicies.slice(start, start + entriesPerPage);
  }, [filteredPolicies, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredPolicies.length / entriesPerPage) || 1;

  return (
    <div className="lpm-container">
      
      {/* Header & Breadcrumb */}
      <div className="lpm-top-bar">
        <div>
          <div className="lpm-breadcrumb">
            Dashboard / Leave Policy
          </div>
          <h1 className="lpm-title">
            LEAVE POLICY
          </h1>
        </div>
      </div>

      {/* 1. TOP CARD: Add Leave Type (Screenshot 4 Original Fields) */}
      {pageAccess.canEdit && (
      <div className="lpm-card form-card">
        <div className="lpm-card-header">
          <h2>Add Leave Type</h2>
        </div>

        <form onSubmit={handleLeaveTypeSubmit} className="lpm-form">
          <div className="lpm-grid lpm-grid-4">
            
            {/* Leave Type Name */}
            <div className="lpm-field">
              <label htmlFor="lt-typeName">Leave Type</label>
              <input
                id="lt-typeName"
                name="typeName"
                type="text"
                className="lpm-input"
                placeholder="Enter Leave Type"
                value={leaveTypeForm.typeName}
                onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, typeName: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="lpm-field">
              <label htmlFor="lt-description">Description</label>
              <input
                id="lt-description"
                name="description"
                type="text"
                className="lpm-input"
                placeholder="Enter Description"
                value={leaveTypeForm.description}
                onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, description: e.target.value })}
              />
            </div>

            {/* Sort Order */}
            <div className="lpm-field">
              <label htmlFor="lt-sortOrder">Sort Order</label>
              <input
                id="lt-sortOrder"
                name="sortOrder"
                type="number"
                min="1"
                className="lpm-input"
                value={leaveTypeForm.sortOrder}
                onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, sortOrder: e.target.value })}
              />
            </div>

            {/* Status */}
            <div className="lpm-field">
              <label htmlFor="lt-status">Status</label>
              <div className="lpm-select-wrapper">
                <select
                  id="lt-status"
                  name="status"
                  className="lpm-select"
                  value={leaveTypeForm.status}
                  onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div className="lpm-form-actions">
            <button type="submit" className="lpm-btn-primary">
              Save
            </button>
          </div>
        </form>

        {/* Configured Leave Types Pill Bar */}
        {leaveTypesList.length > 0 && (
          <div className="lpm-leave-types-chip-bar">
            <span className="chip-bar-label">Configured Leave Types:</span>
            <div className="chip-bar-flex">
              {leaveTypesList.map((lt) => (
                <span key={lt._id || lt.id || lt.name} className={`lpm-type-badge ${lt.status}`}>
                  <strong>{lt.name}</strong>
                  {pageAccess.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLeaveType(lt._id || lt.id)}
                    className="chip-remove"
                    title="Remove leave type"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* 2. SECOND CARD: Add Leave Policy (Includes Paid / Unpaid Field) */}
      {pageAccess.canEdit && (
      <div className="lpm-card form-card">
        <div className="lpm-card-header">
          <h2>{editingId ? 'Edit Leave Policy' : 'Add Leave Policy'}</h2>
          {editingId && (
            <span className="lpm-editing-tag">Editing Policy #{editingId}</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="lpm-form">
          <div className="lpm-grid">
            
            {/* 1. Policy Name */}
            <div className="lpm-field">
              <label htmlFor="policyName">Policy Name</label>
              <input
                id="policyName"
                name="policyName"
                type="text"
                className="lpm-input"
                placeholder="Enter Policy Name"
                value={formData.policyName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* 2. Select Department */}
            <div className="lpm-field">
              <label htmlFor="department">Department</label>
              <div className="lpm-select-wrapper">
                <select
                  id="department"
                  name="department"
                  className="lpm-select"
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  required
                >
                  <option value="" disabled>
                    {loadingData ? 'Loading company departments...' : 'Select Department'}
                  </option>
                  {departmentOptions.map(({ record: dept, label: deptName }) => {
                    return (
                      <option key={getRecordId(dept) || deptName} value={getRecordId(dept) || deptName}>
                        {deptName}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* 3. Job Roles (Multi-Select Dropdown) */}
            <div className="lpm-field relative">
              <label>
                Job Roles (Multi-Select)
                {formData.department && availableJobRoles.length > 0 && (
                  <span className="lpm-dept-hint">({availableJobRoles.length} roles)</span>
                )}
              </label>

              {!formData.department ? (
                <div className="lpm-input lpm-disabled-box">
                  Select a department first
                </div>
              ) : (
                <div className="lpm-multi-select-container">
                  <div
                    className={`lpm-multi-select-trigger ${roleDropdownOpen ? 'open' : ''}`}
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  >
                    <div className="lpm-selected-chips">
                      {formData.jobRoles.length === 0 ? (
                        <span className="lpm-placeholder">Select Job Roles for {formData.department}...</span>
                      ) : (
                        formData.jobRoles.map((role) => (
                          <span key={role} className="lpm-chip">
                            {role}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleJobRole(role);
                              }}
                              className="chip-remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <ChevronDown className={`select-icon ${roleDropdownOpen ? 'rotate' : ''}`} />
                  </div>

                  {roleDropdownOpen && (
                    <div className="lpm-multi-dropdown-menu">
                      <div className="lpm-dropdown-actions">
                        <button type="button" onClick={selectAllRoles} className="lpm-link-btn">
                          Select All
                        </button>
                        <button type="button" onClick={clearAllRoles} className="lpm-link-btn text-red-500">
                          Clear All
                        </button>
                      </div>
                      <div className="lpm-dropdown-list">
                        {availableJobRoles.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">No active job roles found for this department.</div>
                        ) : (
                          availableJobRoles.map((role) => {
                            const isSelected = formData.jobRoles.includes(role);
                            return (
                              <label key={role} className={`lpm-option-row ${isSelected ? 'selected' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleJobRole(role)}
                                />
                                <Briefcase className="option-icon" />
                                <span>{role}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Leave Type (FETCHED DYNAMICALLY FROM TOP CARD ADD LEAVE TYPE) */}
            <div className="lpm-field">
              <label htmlFor="leaveType">Leave Type</label>
              <div className="lpm-select-wrapper">
                <select
                  id="leaveType"
                  name="leaveType"
                  className="lpm-select"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>
                    {activeLeaveTypes.length === 0
                      ? 'No leave types created (Add above first)'
                      : 'Select Leave Type'}
                  </option>
                  {activeLeaveTypes.map((lt) => (
                      <option key={lt._id || lt.id || lt.name} value={lt.name}>
                        {lt.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* 5. Paid / Unpaid Selection (ADDED TO BOTTOM LEAVE POLICY FORM) */}
            <div className="lpm-field">
              <label htmlFor="payType">Paid / Unpaid</label>
              <div className="lpm-select-wrapper">
                <select
                  id="payType"
                  name="payType"
                  className="lpm-select"
                  value={formData.payType}
                  onChange={handleInputChange}
                >
                  <option value="Paid">Paid — Salary not deducted</option>
                  <option value="Unpaid">Unpaid — Salary may be deducted</option>
                  <option value="Admin Choice">Admin Choice — Decide during approval</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* 6. Entitled Days */}
            <div className="lpm-field">
              <label htmlFor="entitledDays">Entitled Days</label>
              <input
                id="entitledDays"
                name="entitledDays"
                type="number"
                min="0"
                className="lpm-input"
                placeholder="Enter entitled days"
                required
                value={formData.entitledDays}
                onChange={handleInputChange}
              />
            </div>

            {/* 7. Monthly Allowed */}
            <div className="lpm-field">
              <label htmlFor="monthlyAllowed">Monthly Allowed</label>
              <input
                id="monthlyAllowed"
                name="monthlyAllowed"
                type="number"
                min="0"
                className="lpm-input"
                placeholder="Enter monthly allowed days"
                required
                value={formData.monthlyAllowed}
                onChange={handleInputChange}
              />
            </div>

            {/* 8. Carry Forward */}
            <div className="lpm-field">
              <label htmlFor="carryForward">Carry Forward</label>
              <div className="lpm-select-wrapper">
                <select
                  id="carryForward"
                  name="carryForward"
                  className="lpm-select"
                  value={formData.carryForward}
                  onChange={handleInputChange}
                >
                  <option value="Yes">Yes — Carry unused days forward</option>
                  <option value="No">No — Expire unused days</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* 9. Max Carry Forward Days */}
            <div className="lpm-field">
              <label htmlFor="maxCarryForwardDays">Max Carry Forward Days</label>
              <input
                id="maxCarryForwardDays"
                name="maxCarryForwardDays"
                type="number"
                min="0"
                className="lpm-input"
                placeholder="Enter max carry forward days"
                required={formData.carryForward === 'Yes'}
                value={formData.maxCarryForwardDays}
                onChange={handleInputChange}
                disabled={formData.carryForward === 'No'}
              />
            </div>

            {/* 10. Encashment Allowed */}
            <div className="lpm-field">
              <label htmlFor="encashmentAllowed">Encashment Allowed</label>
              <div className="lpm-select-wrapper">
                <select
                  id="encashmentAllowed"
                  name="encashmentAllowed"
                  className="lpm-select"
                  value={formData.encashmentAllowed}
                  onChange={handleInputChange}
                >
                  <option value="Yes">Yes — Encashment allowed</option>
                  <option value="No">No — Encashment not allowed</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* 11. Probation Applicable */}
            <div className="lpm-field">
              <label htmlFor="probationApplicable">Probation Applicable</label>
              <div className="lpm-select-wrapper">
                <select
                  id="probationApplicable"
                  name="probationApplicable"
                  className="lpm-select"
                  value={formData.probationApplicable}
                  onChange={handleInputChange}
                >
                  <option value="No">No — Not available during probation</option>
                  <option value="Yes">Yes — Available during probation</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* 12. Sort Order */}
            <div className="lpm-field">
              <label htmlFor="sortOrder">Sort Order</label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="1"
                className="lpm-input"
                placeholder="Enter sort order"
                required
                value={formData.sortOrder}
                onChange={handleInputChange}
              />
            </div>

            {/* 13. Status */}
            <div className="lpm-field">
              <label htmlFor="status">Status</label>
              <div className="lpm-select-wrapper">
                <select
                  id="status"
                  name="status"
                  className="lpm-select"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

          </div>

          {/* Form Save Button */}
          <div className="lpm-form-actions">
            <button type="submit" className="lpm-btn-primary">
              {editingId ? 'Update' : 'Save'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="lpm-btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      {!pageAccess.canEdit && (
        <div className="lpm-card form-card">
          <div className="lpm-card-header">
            <h2>Leave Policy Access</h2>
          </div>
          <p className="text-slate-500 text-sm">
            You can view leave policies. Create or update access is controlled from Page Management.
          </p>
        </div>
      )}

      {/* 3. THIRD CARD: Leave Policy List Table */}
      <div className="lpm-card table-card">
        <div className="lpm-table-header">
          <div>
            <h2>Leave Policy List</h2>
            <p>Manage leave policies dynamically</p>
          </div>
          <div className="lpm-table-controls">
            <div className="lpm-entries-control">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>entries</span>
            </div>

            <div className="lpm-search-box">
              <span>Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="lpm-table-wrapper">
          <table className="lpm-table">
            <thead>
              <tr>
                <th>Sl. No.</th>
                {(pageAccess.canEdit || pageAccess.canDelete) && <th>Action</th>}
                <th>Policy Name</th>
                <th>Department</th>
                <th>Job Roles</th>
                <th>Leave Type</th>
                <th>Paid / Unpaid</th>
                <th>Entitled Days</th>
                <th>Monthly</th>
                <th>Carry Forward</th>
                <th>Max CF</th>
                <th>Encashment</th>
                <th>Probation</th>
                <th>Created By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPolicies.length === 0 ? (
                <tr>
                  <td colSpan={(pageAccess.canEdit || pageAccess.canDelete) ? 15 : 14} className="lpm-empty-cell">
                    No leave policies found. Fill out the form above to add a policy.
                  </td>
                </tr>
              ) : (
                paginatedPolicies.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * entriesPerPage + index + 1}</td>
                    {(pageAccess.canEdit || pageAccess.canDelete) && (
                    <td>
                      <div className="lpm-action-buttons">
                        {pageAccess.canEdit && (
                        <button
                          type="button"
                          className="lpm-icon-btn edit"
                          title="Edit Policy"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        )}
                        {pageAccess.canDelete && (
                        <button
                          type="button"
                          className="lpm-icon-btn delete"
                          title="Delete Policy"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                      </div>
                    </td>
                    )}
                    <td>{item.policyName}</td>
                    <td>{item.department}</td>
                    <td>
                      <div className="lpm-roles-flex">
                        {item.jobRoles && item.jobRoles.length > 0 ? (
                          item.jobRoles.map((role) => (
                            <span key={role} className="lpm-role-tag">
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">All Roles</span>
                        )}
                      </div>
                    </td>
                    <td>{item.leaveType}</td>
                    <td>
                      <span className={`lpm-pay-badge ${item.payType?.toLowerCase().replace(/\s+/g, '-') || 'paid'}`}>
                        {item.payType || 'Paid'}
                      </span>
                    </td>
                    <td className="text-center">{item.entitledDays}</td>
                    <td className="text-center">{item.monthlyAllowed}</td>
                    <td className="text-center">
                      <span className={`lpm-bool-badge ${item.carryForward === 'Yes' ? 'yes' : 'no'}`}>
                        {item.carryForward}
                      </span>
                    </td>
                    <td className="text-center">{item.maxCarryForwardDays}</td>
                    <td className="text-center">
                      <span className={`lpm-bool-badge ${item.encashmentAllowed === 'Yes' ? 'yes' : 'no'}`}>
                        {item.encashmentAllowed}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`lpm-bool-badge ${item.probationApplicable === 'Yes' ? 'yes' : 'no'}`}>
                        {item.probationApplicable}
                      </span>
                    </td>
                    <td>
                      <div className="lpm-creator-cell">
                        <strong>{item.createdByName || 'Unknown'}</strong>
                        <span>{getFormattedDate(item.createdAt)}</span>
                        {item.updatedByName && item.updatedByName !== item.createdByName && (
                          <small>Updated by {item.updatedByName}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`lpm-status-pill ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="lpm-pagination-bar">
          <div className="lpm-pagination-info">
            Showing {filteredPolicies.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, filteredPolicies.length)} of {filteredPolicies.length} entries
          </div>
          <div className="lpm-pagination-controls">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="page-number">{currentPage} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LeavePolicy;
