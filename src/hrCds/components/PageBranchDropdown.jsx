import React, { useEffect, useMemo, useState } from 'react';
import { FiGitBranch } from 'react-icons/fi';
import axios from '../../utils/axiosConfig';

export const getRecordId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || value.branchId || value.value || '').trim();
  }
  return String(value).trim();
};

const getBranchLabel = (value, branchMap = new Map()) => {
  if (!value) return '';
  if (typeof value === 'object') {
    const name = value.name || value.branchName || value.label || '';
    const code = value.branchCode || value.code || '';
    return name ? `${name}${code ? ` (${code})` : ''}` : code;
  }

  const branch = branchMap.get(String(value));
  if (!branch) return 'Assigned Branch';
  return `${branch.name || branch.branchName || 'Branch'}${branch.branchCode ? ` (${branch.branchCode})` : ''}`;
};

const getCompanyId = (user = {}) => getRecordId(user.company || user.companyId || user.companyDetails?._id);

const normalizeRoleToken = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[\s_-]+/g, '');

const getDepartmentToken = (department) => {
  if (!department) return '';
  if (typeof department === 'object') {
    return normalizeRoleToken(department.name || department.departmentName || department.title || department.label || department.code || '');
  }
  return normalizeRoleToken(department);
};

export const canViewAllPageBranches = (user = {}) => {
  const roles = [
    user.companyRole,
    user.role,
    user.userRole,
    user.jobRole,
    user.userType
  ].map(normalizeRoleToken);
  const department = getDepartmentToken(user.department || user.departmentName || user.departmentDetails);

  return roles.some(role => ['owner', 'admin', 'hr', 'superadmin', 'superadministrator'].includes(role)) ||
    (department === 'management' && roles.includes('superadmin'));
};

const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const getAssignedBranchIds = (user = {}) => {
  const items = [
    user.branch,
    user.branchId,
    user.branchDetails,
    ...(Array.isArray(user.assignedBranches) ? user.assignedBranches : []),
    ...(Array.isArray(user.branchIds) ? user.branchIds : [])
  ];

  const seen = new Set();
  return items.reduce((ids, item) => {
    const id = getRecordId(item);
    if (!id || seen.has(id)) return ids;
    seen.add(id);
    ids.push(id);
    return ids;
  }, []);
};

export const usePageBranchScope = () => {
  const [user, setUser] = useState(() => readCurrentUser());
  const [companyBranches, setCompanyBranches] = useState([]);
  const canViewAllBranches = useMemo(() => canViewAllPageBranches(user), [user]);
  const assignedBranchIds = useMemo(() => getAssignedBranchIds(user), [user]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  useEffect(() => {
    const latestUser = readCurrentUser();
    setUser(latestUser);
    setSelectedBranchId(current => {
      if (canViewAllPageBranches(latestUser)) return '';
      const ids = getAssignedBranchIds(latestUser);
      if (!ids.length) return '';
      return ids.includes(current) ? current : ids[0];
    });
  }, []);

  useEffect(() => {
    const companyId = getCompanyId(user);
    if (!companyId) {
      setCompanyBranches([]);
      return;
    }

    let cancelled = false;
    axios.get(`/branches/company/${companyId}`, { _skipErrorNotify: true })
      .then(response => {
        if (cancelled) return;
        const branches = response.data?.branches || response.data?.data || [];
        setCompanyBranches(Array.isArray(branches) ? branches : []);
      })
      .catch(() => {
        if (!cancelled) setCompanyBranches([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const branchMap = useMemo(() => (
    new Map(companyBranches.map(branch => [getRecordId(branch), branch]))
  ), [companyBranches]);

  const branchOptions = useMemo(() => {
    if (canViewAllBranches) {
      return [
        { id: '', label: 'All Branches' },
        ...companyBranches.map(branch => ({
          id: getRecordId(branch),
          label: getBranchLabel(branch, branchMap)
        })).filter(branch => branch.id)
      ];
    }

    const sourceItems = [
      user.branch,
      user.branchId,
      user.branchDetails,
      ...(Array.isArray(user.assignedBranches) ? user.assignedBranches : []),
      ...(Array.isArray(user.branchIds) ? user.branchIds : [])
    ];

    return assignedBranchIds.map(branchId => {
      const original = sourceItems.find(item => getRecordId(item) === branchId) || branchId;
      return {
        id: branchId,
        label: getBranchLabel(original, branchMap)
      };
    });
  }, [assignedBranchIds, branchMap, canViewAllBranches, companyBranches, user]);

  const branchQueryParams = useMemo(
    () => (selectedBranchId ? { branchId: selectedBranchId } : {}),
    [selectedBranchId]
  );

  return {
    branchOptions,
    selectedBranchId,
    setSelectedBranchId,
    branchQueryParams,
    hasMultipleBranches: branchOptions.length > 1
  };
};

const PageBranchDropdown = ({ branchOptions, selectedBranchId, onChange, className = '' }) => {
  if (!branchOptions || branchOptions.length <= 1) return null;

  return (
    <div className={`PageBranchDropdown ${className}`.trim()} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      border: '1px solid #dbe5f5',
      borderRadius: 8,
      background: '#f8fbff',
      width: 'fit-content',
      maxWidth: '100%',
      marginBottom: 14
    }}>
      <FiGitBranch size={17} color="#2563eb" />
      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }} htmlFor="page-branch-selector">
        Branch
      </label>
      <select
        id="page-branch-selector"
        value={selectedBranchId}
        onChange={(event) => onChange(event.target.value)}
        style={{
          minWidth: 210,
          maxWidth: 320,
          height: 36,
          border: '1px solid #cbd5e1',
          borderRadius: 6,
          background: '#fff',
          color: '#111827',
          fontWeight: 600,
          padding: '0 10px'
        }}
      >
        {branchOptions.map(branch => (
          <option key={branch.id || 'all-branches'} value={branch.id}>{branch.label}</option>
        ))}
      </select>
    </div>
  );
};

export default PageBranchDropdown;
