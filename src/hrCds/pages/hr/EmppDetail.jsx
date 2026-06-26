import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "../../../utils/axiosConfig";
import './employee-directory.css';
import CIISLoader from '../../../Loader/CIISLoader';

// Icons imports
import {
  FiMail, FiPhone, FiUser, FiCalendar, FiMapPin,
  FiBriefcase, FiPhoneCall, FiUsers, FiAlertTriangle,
  FiSearch, FiX, FiEdit, FiDownload,
  FiMoreVertical, FiTrash2, FiSave, FiEye, FiShield,
  FiTrendingUp, FiFilter, FiPlus,
  FiRefreshCw, FiCheckCircle, FiInfo, FiMenu, FiGrid, FiList,
  FiHome, FiCreditCard, FiUserCheck, FiUserX, FiLock,
  FiHeart, FiUsers as FiFamily, FiDollarSign, FiFileText,
  FiCamera, FiSmartphone, FiClock, FiFlag, FiStar, FiAward,
  FiUpload, FiLink, FiDownload as FiDownloadIcon
} from "react-icons/fi";

// Additional icons from react-icons/fa
import { FaLaptop, FaDesktop, FaHeadphones, FaTabletAlt, FaTruck, FaMoneyBillWave } from "react-icons/fa";

// ==================== CUSTOM HOOKS ====================

// Custom hook for form management
const useForm = (initialState = {}) => {
  const [formData, setFormData] = useState(initialState);
  
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const resetForm = useCallback((newData = {}) => {
    setFormData(newData);
  }, []);
  
  return {
    formData,
    handleChange,
    resetForm,
    setFormData
  };
};

// Custom hook for user management
const useUser = () => {
  const getCurrentUser = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      const companyData = localStorage.getItem('companyDetails');
      
      if (!userData) {
        console.warn("❌ No user data found in localStorage");
        return null;
      }
      
      const parsedUser = JSON.parse(userData);
      
      let companyDetails = null;
      if (companyData) {
        try {
          companyDetails = JSON.parse(companyData);
        } catch (e) {
          console.error('❌ Error parsing company details:', e);
        }
      }
      
      const combinedUser = {
        ...parsedUser,
        companyDetails,
        companyRole: parsedUser.companyRole || parsedUser.role || 'employee',
        jobRole: parsedUser.jobRole || parsedUser.role || 'employee'
      };
      
      return combinedUser;
      
    } catch (err) {
      console.error('❌ Error parsing user data:', err);
      return null;
    }
  }, []);
  
  const getCurrentUserJobRole = useCallback(() => {
    const user = getCurrentUser();
    return (user?.jobRole || user?.role || '').toLowerCase();
  }, [getCurrentUser]);
  
  const getCurrentUserId = useCallback(() => {
    const user = getCurrentUser();
    return user?.id || user?._id || null;
  }, [getCurrentUser]);
  
  const getCurrentUserCompanyId = useCallback(() => {
    const user = getCurrentUser();
    return user?.company || user?.companyId || user?.companyDetails?._id || null;
  }, [getCurrentUser]);
  
  const getCurrentUserCompanyCode = useCallback(() => {
    const user = getCurrentUser();
    return user?.companyCode || user?.companyDetails?.companyCode || null;
  }, [getCurrentUser]);
  
  const getCurrentUserCompanyName = useCallback(() => {
    const user = getCurrentUser();
    return user?.companyName || user?.companyDetails?.companyName || null;
  }, [getCurrentUser]);
  
  const getCurrentUserDepartmentId = useCallback(() => {
    const user = getCurrentUser();
    return user?.department || user?.departmentId || null;
  }, [getCurrentUser]);
  
  const getCurrentUserCompanyRole = useCallback(() => {
    const user = getCurrentUser();
    return (user?.companyRole || user?.role || 'employee').toLowerCase();
  }, [getCurrentUser]);
  
  // Check if user is super_admin
  const isSuperAdmin = useMemo(() => {
    const jobRole = getCurrentUserJobRole();
    return jobRole === 'super_admin';
  }, [getCurrentUserJobRole]);
  
  // ✅ UPDATED: EVERYONE can edit other employees (Employee, Owner, HR, Manager, Admin, Super Admin)
  const canEditOtherEmployees = useMemo(() => {
    const jobRole = getCurrentUserJobRole();
    const companyRole = getCurrentUserCompanyRole();
    // Edit permission is available for Employee, Owner, HR, Manager, Admin, and Super Admin.
    const allowedRoles = ['super_admin', 'admin', 'owner', 'hr', 'manager', 'employee'];
    return allowedRoles.includes(jobRole) || allowedRoles.includes(companyRole);
  }, [getCurrentUserJobRole, getCurrentUserCompanyRole]);
  
  // ✅ Check if user can see all company users (Owner, HR, Manager, Admin, Super Admin)
  // Employee will only see department users
  const canSeeAllCompanyUsers = useMemo(() => {
    const jobRole = getCurrentUserJobRole();
    const companyRole = getCurrentUserCompanyRole();
    const allowedRoles = ['super_admin', 'admin', 'owner', 'hr', 'manager'];
    return allowedRoles.includes(jobRole) || allowedRoles.includes(companyRole);
  }, [getCurrentUserJobRole, getCurrentUserCompanyRole]);
  
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);
  
  return {
    getCurrentUser,
    getCurrentUserJobRole,
    getCurrentUserId,
    getCurrentUserCompanyId,
    getCurrentUserCompanyCode,
    getCurrentUserCompanyName,
    getCurrentUserDepartmentId,
    getCurrentUserCompanyRole,
    isSuperAdmin,
    canEditOtherEmployees,
    canSeeAllCompanyUsers,
    getAuthToken
  };
};

// ==================== ASSET ICONS MAPPING ====================
const assetIcons = {
  sim: <FiSmartphone size={14} />,
  phone: <FiPhoneCall size={14} />,
  laptop: <FaLaptop size={14} />,
  desktop: <FaDesktop size={14} />,
  headphones: <FaHeadphones size={14} />,
  tablet: <FaTabletAlt size={14} />,
  vehicle: <FaTruck size={14} />
};

// ==================== SUB-COMPONENTS ====================

// Employee Card Component
const EmployeeDirectoryEmployeeCard = React.memo(({ 
  emp, 
  onView, 
  onMenuOpen,
  currentUserId,
  jobRoles,
  departments,
  canEditOtherEmployees
}) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Not provided';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return phoneStr.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return phoneStr;
  };
  
  const getJobRoleName = (jobRoleId) => {
    if (!jobRoleId || !jobRoles || jobRoles.length === 0) {
      return typeof emp.jobRole === 'string' ? emp.jobRole.charAt(0).toUpperCase() + emp.jobRole.slice(1) : 'N/A';
    }
    
    const roleId = typeof jobRoleId === 'object' ? jobRoleId._id || jobRoleId.id : jobRoleId;
    
    const jobRole = jobRoles.find(role => 
      role._id === roleId || 
      role.id === roleId ||
      role.roleNumber === roleId
    );
    
    return jobRole ? jobRole.roleName : (typeof emp.jobRole === 'string' ? emp.jobRole : 'N/A');
  };
  
  const getDepartmentName = (dept) => {
    if (!dept) return 'Not assigned';
    
    if (typeof dept === 'object') {
      return dept.name || dept.departmentName || 'Department';
    }
    
    if (typeof dept === 'string') {
      const department = departments.find(d => d._id === dept || d.id === dept);
      return department ? department.name : 'Department';
    }
    
    return 'Department';
  };
  
  const getCompanyRoleBadge = (role) => {
    const roleLower = (role || '').toLowerCase();
    if (roleLower === 'owner') return 'EmployeeDirectory-company-role-owner';
    if (roleLower === 'admin') return 'EmployeeDirectory-company-role-admin';
    if (roleLower === 'manager') return 'EmployeeDirectory-company-role-manager';
    if (roleLower === 'hr') return 'EmployeeDirectory-company-role-hr';
    return 'EmployeeDirectory-company-role-employee';
  };
  
  const isCurrentUserEmp = currentUserId === (emp._id || emp.id);
  const isOtherUser = !isCurrentUserEmp;
  
  // Show menu if user can edit other employees AND this is not the current user
  const showMenu = canEditOtherEmployees && isOtherUser;
  
  return (
    <div 
      className="EmployeeDirectory-employee-card"
      onClick={() => onView(emp)}
    >
      {showMenu && (
        <button 
          className="EmployeeDirectory-employee-card-menu"
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(e, emp);
          }}
        >
          <FiMoreVertical size={16} />
        </button>
      )}
      
      <div className="EmployeeDirectory-employee-card-content">
        <div className="EmployeeDirectory-employee-header">
          <div className="EmployeeDirectory-employee-avatar">
            <div className="EmployeeDirectory-avatar-initials">
              {getInitials(emp.name)}
            </div>
            {emp.isActive && (
              <div className="EmployeeDirectory-avatar-status active"></div>
            )}
          </div>
          
          <div className="EmployeeDirectory-employee-info">
            <div className="EmployeeDirectory-employee-name">
              {emp.name || 'No Name'}
              {isCurrentUserEmp && (
                <span className="EmployeeDirectory-current-user-badge">(You)</span>
              )}
            </div>
            <div className="EmployeeDirectory-employee-email">
              {emp.email || 'No email'}
            </div>
            
            <div className="EmployeeDirectory-employee-tags">
              <span className={`EmployeeDirectory-employee-tag ${emp.isActive ? 'EmployeeDirectory-employee-tag-active' : 'EmployeeDirectory-employee-tag-inactive'}`}>
                {emp.isActive ? 'Active' : 'Inactive'}
              </span>
              {emp.employeeId && (
                <span className="EmployeeDirectory-employee-tag EmployeeDirectory-employee-tag-secondary">
                  ID: {emp.employeeId}
                </span>
              )}
              {emp.companyRole && (
                <span className={`EmployeeDirectory-employee-tag ${getCompanyRoleBadge(emp.companyRole)}`}>
                  {emp.companyRole}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="EmployeeDirectory-employee-details">
          <div className="EmployeeDirectory-detail-row">
            <div className="EmployeeDirectory-detail-icon EmployeeDirectory-detail-icon-primary">
              <FiPhone size={12} />
            </div>
            <div className="EmployeeDirectory-detail-text">{formatPhoneNumber(emp.phone)}</div>
          </div>
          
          {emp.department && (
            <div className="EmployeeDirectory-detail-row">
              <div className="EmployeeDirectory-detail-icon EmployeeDirectory-detail-icon-success">
                <FiBriefcase size={12} />
              </div>
              <div className="EmployeeDirectory-detail-text">
                {getDepartmentName(emp.department)}
              </div>
            </div>
          )}
          
          {emp.jobRole && (
            <div className="EmployeeDirectory-detail-row">
              <div className="EmployeeDirectory-detail-icon EmployeeDirectory-detail-icon-warning">
                <FiUser size={12} />
              </div>
              <div className="EmployeeDirectory-detail-text">
                {getJobRoleName(emp.jobRole)}
              </div>
            </div>
          )}
          
          {emp.employeeType && (
            <div className="EmployeeDirectory-detail-row">
              <div className="EmployeeDirectory-detail-icon EmployeeDirectory-detail-icon-info">
                <FiUserCheck size={12} />
              </div>
              <div className="EmployeeDirectory-detail-text">
                {emp.employeeType}
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="EmployeeDirectory-view-profile-btn"
          onClick={(e) => {
            e.stopPropagation();
            onView(emp);
          }}
        >
          <FiEye size={14} /> View Profile
        </button>
      </div>
    </div>
  );
});

// Children Form Component
const ChildrenForm = ({ children = [], onChange, isReadOnly = false }) => {
  const addChild = () => {
    if (!isReadOnly) {
      onChange([...children, { name: '', age: '', dob: '' }]);
    }
  };

  const removeChild = (index) => {
    if (!isReadOnly) {
      onChange(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index, field, value) => {
    if (!isReadOnly) {
      const updated = [...children];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    }
  };

  return (
    <div className="EmployeeDirectory-children-section">
      <label className="EmployeeDirectory-form-label">
        <FiHeart size={14} style={{ marginRight: '6px' }} />
        Children
      </label>
      {children.map((child, index) => (
        <div key={index} className="EmployeeDirectory-child-row">
          <input
            type="text"
            className="EmployeeDirectory-form-input EmployeeDirectory-child-input"
            placeholder="Name"
            value={child.name || ''}
            onChange={(e) => updateChild(index, 'name', e.target.value)}
            disabled={isReadOnly}
          />
          <input
            type="number"
            className="EmployeeDirectory-form-input EmployeeDirectory-child-input"
            placeholder="Age"
            value={child.age || ''}
            onChange={(e) => updateChild(index, 'age', e.target.value)}
            disabled={isReadOnly}
          />
          <input
            type="date"
            className="EmployeeDirectory-form-input EmployeeDirectory-child-input"
            value={child.dob || ''}
            onChange={(e) => updateChild(index, 'dob', e.target.value)}
            disabled={isReadOnly}
          />
          {!isReadOnly && (
            <button
              type="button"
              className="EmployeeDirectory-btn-icon EmployeeDirectory-btn-danger"
              onClick={() => removeChild(index)}
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      ))}
      {!isReadOnly && (
        <button
          type="button"
          className="EmployeeDirectory-btn EmployeeDirectory-btn-outlined EmployeeDirectory-btn-add"
          onClick={addChild}
        >
          <FiPlus size={14} /> Add Child
        </button>
      )}
    </div>
  );
};

// Documents Form Component
const DocumentsForm = ({ documents = [], onChange, isReadOnly = false }) => {
  const addDocument = () => {
    if (!isReadOnly) {
      onChange([...documents, { name: '', type: '', url: '' }]);
    }
  };

  const removeDocument = (index) => {
    if (!isReadOnly) {
      onChange(documents.filter((_, i) => i !== index));
    }
  };

  const updateDocument = (index, field, value) => {
    if (!isReadOnly) {
      const updated = [...documents];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    }
  };

  return (
    <div className="EmployeeDirectory-documents-section">
      <label className="EmployeeDirectory-form-label">
        <FiFileText size={14} style={{ marginRight: '6px' }} />
        Documents
      </label>
      {documents.map((doc, index) => (
        <div key={index} className="EmployeeDirectory-document-row">
          <input
            type="text"
            className="EmployeeDirectory-form-input EmployeeDirectory-document-input"
            placeholder="Document Name"
            value={doc.name || ''}
            onChange={(e) => updateDocument(index, 'name', e.target.value)}
            disabled={isReadOnly}
          />
          <select
            className="EmployeeDirectory-form-select EmployeeDirectory-document-select"
            value={doc.type || ''}
            onChange={(e) => updateDocument(index, 'type', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Select Type</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="doc">Word Document</option>
            <option value="xls">Excel Sheet</option>
            <option value="other">Other</option>
          </select>
          <div className="EmployeeDirectory-document-url">
            <FiLink size={14} className="EmployeeDirectory-document-url-icon" />
            <input
              type="text"
              className="EmployeeDirectory-form-input"
              placeholder="Document URL"
              value={doc.url || ''}
              onChange={(e) => updateDocument(index, 'url', e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          {!isReadOnly && (
            <button
              type="button"
              className="EmployeeDirectory-btn-icon EmployeeDirectory-btn-danger"
              onClick={() => removeDocument(index)}
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      ))}
      {!isReadOnly && (
        <button
          type="button"
          className="EmployeeDirectory-btn EmployeeDirectory-btn-outlined EmployeeDirectory-btn-add"
          onClick={addDocument}
        >
          <FiUpload size={14} /> Add Document
        </button>
      )}
    </div>
  );
};

// Assets Form Component
const AssetsForm = ({ properties = [], currentlyAssignedAssets = [], onChange, isReadOnly = false }) => {
  const assetOptions = ['sim', 'phone', 'laptop', 'desktop', 'headphones', 'tablet', 'vehicle'];

  const toggleAsset = (asset) => {
    if (!isReadOnly) {
      const newProperties = properties.includes(asset)
        ? properties.filter(a => a !== asset)
        : [...properties, asset];
      onChange('properties', newProperties);
    }
  };

  return (
    <div className="EmployeeDirectory-assets-section">
      <label className="EmployeeDirectory-form-label">
        <FiSmartphone size={14} style={{ marginRight: '6px' }} />
        Assigned Assets
      </label>
      <div className="EmployeeDirectory-assets-grid">
        {assetOptions.map(asset => (
          <label key={asset} className="EmployeeDirectory-asset-checkbox">
            <input
              type="checkbox"
              checked={properties.includes(asset)}
              onChange={() => toggleAsset(asset)}
              disabled={isReadOnly}
            />
            <span className="EmployeeDirectory-asset-label">
              {assetIcons[asset] || <FiSmartphone size={14} />}
              {asset.charAt(0).toUpperCase() + asset.slice(1)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Bank Details Form Component
const BankDetailsForm = ({ formData, onInputChange, canEdit }) => {
  return (
    <div className="EmployeeDirectory-form-section">
      <h3 className="EmployeeDirectory-section-title">
        <FiCreditCard /> Bank Details
      </h3>
      <div className="EmployeeDirectory-bank-details-grid">
        <div className="EmployeeDirectory-form-group EmployeeDirectory-form-group-full">
          <label className="EmployeeDirectory-form-label">Account Holder Name</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.bankHolderName || ''}
            onChange={(e) => onInputChange('bankHolderName', e.target.value)}
            disabled={!canEdit}
            placeholder="Enter account holder name"
          />
          {!canEdit && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit bank details</span>
          )}
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Account Number</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.accountNumber || ''}
            onChange={(e) => onInputChange('accountNumber', e.target.value)}
            disabled={!canEdit}
            placeholder="Enter account number"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">IFSC Code</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.ifsc || ''}
            onChange={(e) => onInputChange('ifsc', e.target.value)}
            disabled={!canEdit}
            placeholder="Enter IFSC code"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group EmployeeDirectory-form-group-full">
          <label className="EmployeeDirectory-form-label">Bank Name</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.bankName || ''}
            onChange={(e) => onInputChange('bankName', e.target.value)}
            disabled={!canEdit}
            placeholder="Enter bank name"
          />
        </div>
      </div>
    </div>
  );
};

// Family Details Form Component
const FamilyDetailsForm = ({ formData, onInputChange, isReadOnly = false }) => {
  return (
    <div className="EmployeeDirectory-form-section">
      <h3 className="EmployeeDirectory-section-title">
        <FiFamily /> Family Details
      </h3>
      <div className="EmployeeDirectory-family-grid">
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Father's Name</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.fatherName || ''}
            onChange={(e) => onInputChange('fatherName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter father's name"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Mother's Name</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.motherName || ''}
            onChange={(e) => onInputChange('motherName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter mother's name"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Spouse Name</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.spouseName || ''}
            onChange={(e) => onInputChange('spouseName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter spouse name"
          />
        </div>
      </div>

      {/* Children Section */}
      <ChildrenForm 
        children={formData.children || []} 
        onChange={(children) => onInputChange('children', children)}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};

// Emergency Contact Form Component
const EmergencyContactForm = ({ formData, onInputChange, isReadOnly = false }) => {
  return (
    <div className="EmployeeDirectory-form-section">
      <h3 className="EmployeeDirectory-section-title">
        <FiPhoneCall /> Emergency Contact
      </h3>
      <div className="EmployeeDirectory-emergency-grid">
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Contact Name</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.emergencyName || ''}
            onChange={(e) => onInputChange('emergencyName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter emergency contact name"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Phone Number</label>
          <input
            type="tel"
            className="EmployeeDirectory-form-input"
            value={formData.emergencyPhone || ''}
            onChange={(e) => onInputChange('emergencyPhone', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter emergency phone number"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Relationship</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.emergencyRelation || ''}
            onChange={(e) => onInputChange('emergencyRelation', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g., Spouse, Parent, Sibling"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group EmployeeDirectory-form-group-full">
          <label className="EmployeeDirectory-form-label">Emergency Address</label>
          <textarea
            className="EmployeeDirectory-form-input EmployeeDirectory-form-textarea"
            value={formData.emergencyAddress || ''}
            onChange={(e) => onInputChange('emergencyAddress', e.target.value)}
            rows="2"
            disabled={isReadOnly}
            placeholder="Enter emergency contact address"
          />
        </div>
      </div>
    </div>
  );
};

// Employment Details Form Component
const EmploymentDetailsForm = ({ 
  formData, 
  onInputChange, 
  departments, 
  jobRoles,
  canEditAllFields,
  isSuperAdmin
}) => {
  const employeeTypeOptions = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
    { value: 'probation', label: 'Probation' }
  ];

  const companyRoleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'admin', label: 'Admin' },
    { value: 'owner', label: 'Owner' }
  ];

  return (
    <div className="EmployeeDirectory-form-section">
      <h3 className="EmployeeDirectory-section-title">
        <FiBriefcase /> Employment Information
      </h3>
      {!canEditAllFields && (
        <div className="EmployeeDirectory-info-banner">
          <FiInfo size={14} />
          <span>You don't have permission to edit employment details</span>
        </div>
      )}
      <div className="EmployeeDirectory-employment-grid">
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Employee ID</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.employeeId || ''}
            onChange={(e) => onInputChange('employeeId', e.target.value)}
            disabled={!canEditAllFields}
            placeholder="Auto-generated if empty"
          />
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Job Role</label>
          <select
            className="EmployeeDirectory-form-select"
            value={formData.jobRole || ''}
            onChange={(e) => onInputChange('jobRole', e.target.value)}
            disabled={!canEditAllFields}
          >
            <option value="">Select Job Role</option>
            {jobRoles.map(role => (
              <option key={role._id} value={role._id}>
                {role.roleName} ({role.roleNumber})
              </option>
            ))}
          </select>
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Department</label>
          <select
            className="EmployeeDirectory-form-select"
            value={formData.department || ''}
            onChange={(e) => onInputChange('department', e.target.value)}
            disabled={!canEditAllFields}
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Company Role</label>
          <select
            className="EmployeeDirectory-form-select"
            value={formData.companyRole || 'employee'}
            onChange={(e) => onInputChange('companyRole', e.target.value)}
            disabled={!canEditAllFields}
          >
            {companyRoleOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Employee Type</label>
          <select
            className="EmployeeDirectory-form-select"
            value={formData.employeeType || ''}
            onChange={(e) => onInputChange('employeeType', e.target.value)}
            disabled={!canEditAllFields}
          >
            <option value="">Select Type</option>
            {employeeTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">
            <FaMoneyBillWave size={12} style={{ marginRight: '4px' }} />
            Salary
          </label>
          <input
            type="number"
            className="EmployeeDirectory-form-input"
            value={formData.salary || ''}
            onChange={(e) => onInputChange('salary', e.target.value)}
            disabled={!canEditAllFields}
            placeholder="Enter salary"
          />
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Status</label>
          <select
            className="EmployeeDirectory-form-select"
            value={formData.isActive === false ? 'inactive' : 'active'}
            onChange={(e) => onInputChange('isActive', e.target.value === 'active')}
            disabled={!canEditAllFields}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Reporting Manager</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.reportingManager || ''}
            onChange={(e) => onInputChange('reportingManager', e.target.value)}
            disabled={!canEditAllFields}
            placeholder="Manager ID or Name"
          />
          {!canEditAllFields && (
            <span className="EmployeeDirectory-field-note">You don't have permission to edit</span>
          )}
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Date of Joining</label>
          <input
            type="date"
            className="EmployeeDirectory-form-input"
            value={formData.dateOfJoining ? new Date(formData.dateOfJoining).toISOString().split('T')[0] : ''}
            onChange={(e) => onInputChange('dateOfJoining', e.target.value)}
            disabled={!canEditAllFields}
            placeholder="Date of joining"
          />
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Work Location</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.workLocation || ''}
            onChange={(e) => onInputChange('workLocation', e.target.value)}
            disabled={!canEditAllFields}
            placeholder="Office location"
          />
        </div>
      </div>
    </div>
  );
};

// Personal Information Form Component
const PersonalInfoForm = ({ formData, onInputChange, isReadOnly = false }) => {
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' }
  ];

  return (
    <div className="EmployeeDirectory-form-section">
      <h3 className="EmployeeDirectory-section-title">
        <FiUser /> Personal Information
      </h3>
      <div className="EmployeeDirectory-personal-grid">
        <div className="EmployeeDirectory-form-group EmployeeDirectory-form-group-full">
          <label className="EmployeeDirectory-form-label">Full Name *</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.name || ''}
            onChange={(e) => onInputChange('name', e.target.value)}
            required
            disabled={isReadOnly}
            placeholder="Enter full name"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group EmployeeDirectory-form-group-full">
          <label className="EmployeeDirectory-form-label">Email Address *</label>
          <input
            type="email"
            className="EmployeeDirectory-form-input EmployeeDirectory-form-input-disabled"
            value={formData.email || ''}
            disabled
            placeholder="Email cannot be changed"
          />
          <span className="EmployeeDirectory-field-note">Email cannot be changed</span>
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Phone Number</label>
          <input
            type="tel"
            className="EmployeeDirectory-form-input"
            value={formData.phone || ''}
            onChange={(e) => onInputChange('phone', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter phone number"
          />
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Date of Birth</label>
          <input
            type="date"
            className="EmployeeDirectory-form-input"
            value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
            onChange={(e) => onInputChange('dob', e.target.value)}
            disabled={isReadOnly}
          />
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Gender</label>
          <select
            className="EmployeeDirectory-form-select"
            value={formData.gender || ''}
            onChange={(e) => onInputChange('gender', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Select Gender</option>
            {genderOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Marital Status</label>
          <select
            className="EmployeeDirectory-form-select"
            value={formData.maritalStatus || ''}
            onChange={(e) => onInputChange('maritalStatus', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Select Status</option>
            {maritalStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="EmployeeDirectory-form-group EmployeeDirectory-form-group-full">
          <label className="EmployeeDirectory-form-label">Address</label>
          <textarea
            className="EmployeeDirectory-form-input EmployeeDirectory-form-textarea"
            value={formData.address || ''}
            onChange={(e) => onInputChange('address', e.target.value)}
            rows="2"
            disabled={isReadOnly}
            placeholder="Enter full address"
          />
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">City</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.city || ''}
            onChange={(e) => onInputChange('city', e.target.value)}
            disabled={isReadOnly}
            placeholder="City"
          />
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">State</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.state || ''}
            onChange={(e) => onInputChange('state', e.target.value)}
            disabled={isReadOnly}
            placeholder="State"
          />
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Zip Code</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.zipCode || ''}
            onChange={(e) => onInputChange('zipCode', e.target.value)}
            disabled={isReadOnly}
            placeholder="Zip code"
          />
        </div>

        <div className="EmployeeDirectory-form-group">
          <label className="EmployeeDirectory-form-label">Country</label>
          <input
            type="text"
            className="EmployeeDirectory-form-input"
            value={formData.country || ''}
            onChange={(e) => onInputChange('country', e.target.value)}
            disabled={isReadOnly}
            placeholder="Country"
          />
        </div>
      </div>
    </div>
  );
};

// Edit Form Component
const EditEmployeeForm = React.memo(({ 
  editingUser, 
  formData, 
  onInputChange, 
  departments, 
  jobRoles,
  canEditOtherEmployees,
  isSelfEdit,
  currentUserId,
  isSuperAdmin
}) => {
  if (!editingUser) {
    return null;
  }
  
  const isEditingSelf = currentUserId === (editingUser._id || editingUser.id);
  
  // If editing SELF -> Full edit access
  // If editing OTHER and has permission -> Full edit access
  const hasFullEditAccess = isEditingSelf || canEditOtherEmployees;
  
  // Show permission warning for users without edit access
  const showPermissionWarning = !canEditOtherEmployees && !isEditingSelf;
  
  // Show info for users with edit access
  const showEditInfo = canEditOtherEmployees && !isEditingSelf;
  
  return (
    <>
      {showPermissionWarning && (
        <div className="EmployeeDirectory-permission-warning">
          <FiShield size={20} />
          <span>You don't have permission to edit other employees.</span>
        </div>
      )}
      
      {showEditInfo && (
        <div className="EmployeeDirectory-permission-info">
          <FiEdit size={20} />
          <span>You have full edit access. You can edit all employee details.</span>
        </div>
      )}
      
      <form onSubmit={(e) => e.preventDefault()} className="EmployeeDirectory-edit-form">
        <div className="EmployeeDirectory-form-sections EmployeeDirectory-scrollable-form">
          {/* Personal Information */}
          <PersonalInfoForm 
            formData={formData} 
            onInputChange={onInputChange}
            isReadOnly={false}
          />

          {/* Employment Information */}
          <EmploymentDetailsForm 
            formData={formData}
            onInputChange={onInputChange}
            departments={departments}
            jobRoles={jobRoles}
            canEditAllFields={hasFullEditAccess}
            isSuperAdmin={isSuperAdmin}
          />

          {/* Bank Details */}
          <BankDetailsForm 
            formData={formData}
            onInputChange={onInputChange}
            canEdit={hasFullEditAccess}
          />

          {/* Family Details */}
          <FamilyDetailsForm 
            formData={formData}
            onInputChange={onInputChange}
            isReadOnly={false}
          />

          {/* Emergency Contact */}
          <EmergencyContactForm 
            formData={formData}
            onInputChange={onInputChange}
            isReadOnly={false}
          />
        </div>
      </form>
    </>
  );
});

// ==================== MAIN COMPONENT ====================

const EmployeeDirectory = () => {
  console.log("🚀 EmployeeDirectory component mounted");
  
  // Custom hooks
  const user = useUser();
  
  // State
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMenuUser, setSelectedMenuUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form handling
  const {
    formData: editFormData,
    handleChange: handleInputChange,
    resetForm: resetEditForm,
  } = useForm({});
  
  // Get current user info
  const currentUserId = user.getCurrentUserId();
  const currentUserCompanyId = user.getCurrentUserCompanyId();
  const currentUserDepartmentId = user.getCurrentUserDepartmentId();
  const currentUserCompanyCode = user.getCurrentUserCompanyCode();
  const currentUserCompanyName = user.getCurrentUserCompanyName();
  const currentUserCompanyRole = user.getCurrentUserCompanyRole();
  const isSuperAdmin = user.isSuperAdmin;
  const canEditOtherEmployees = user.canEditOtherEmployees;
  const canSeeAllCompanyUsers = user.canSeeAllCompanyUsers;
  
  // Snackbar helper
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ 
      open: true, 
      message, 
      severity,
      id: Date.now()
    });
    
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 3000);
  }, []);
  
  // Fetch Job Roles from API
  const fetchJobRoles = useCallback(async () => {
    if (!currentUserCompanyId) {
      return [];
    }
    
    try {
      const token = user.getAuthToken();
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`/job-roles?company=${currentUserCompanyId}`, config);
      
      if (response.data && response.data.success) {
        let jobRolesData = [];
        
        if (Array.isArray(response.data.jobRoles)) {
          jobRolesData = response.data.jobRoles;
        } else if (Array.isArray(response.data.data)) {
          jobRolesData = response.data.data;
        } else if (response.data.message && Array.isArray(response.data.message)) {
          jobRolesData = response.data.message;
        }
        
        const formattedJobRoles = jobRolesData.map(role => ({
          _id: role._id || role.id,
          roleName: role.roleName || role.name || 'Unnamed Role',
          roleNumber: role.roleNumber || role.roleNo || role.number || 'N/A',
          description: role.description || '',
          company: role.company || currentUserCompanyId
        }));
        
        setJobRoles(formattedJobRoles);
        return formattedJobRoles;
      } else {
        setJobRoles([]);
        return [];
      }
      
    } catch (err) {
      console.error("❌ Error fetching job roles:", err);
      setJobRoles([]);
      return [];
    }
  }, [currentUserCompanyId, user.getAuthToken]);
  
  // Helper function to get job role name by ID
  const getJobRoleName = useCallback((jobRoleId) => {
    if (!jobRoleId || jobRoles.length === 0) {
      return 'N/A';
    }
    
    const roleId = typeof jobRoleId === 'object' ? jobRoleId._id || jobRoleId.id : jobRoleId;
    
    const jobRole = jobRoles.find(role => 
      role._id === roleId || 
      role.id === roleId ||
      role.roleNumber === roleId
    );
    
    return jobRole ? jobRole.roleName : 'N/A';
  }, [jobRoles]);
  
  // Helper function to get job role details by ID
  const getJobRoleDetails = useCallback((jobRoleId) => {
    if (!jobRoleId || jobRoles.length === 0) {
      return null;
    }
    
    const roleId = typeof jobRoleId === 'object' ? jobRoleId._id || jobRoleId.id : jobRoleId;
    
    const jobRole = jobRoles.find(role => 
      role._id === roleId || 
      role.id === roleId ||
      role.roleNumber === roleId
    );
    
    return jobRole;
  }, [jobRoles]);
  
  // Helper function to check if current user can delete a specific user
  const canDeleteUser = useCallback((targetUser) => {
    if (!targetUser) return false;
    
    const targetUserId = targetUser._id || targetUser.id;
    
    // Cannot delete self
    if (currentUserId === targetUserId) {
      return false;
    }
    
    // Users with edit permission can delete
    return canEditOtherEmployees;
  }, [currentUserId, canEditOtherEmployees]);
  
  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentUserCompanyId) {
      showSnackbar('Company information not found. Please login again.', 'error');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = user.getAuthToken();
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      let usersRes;
      
      if (canSeeAllCompanyUsers) {
        console.log("👑 Fetching ALL company users");
        usersRes = await axios.get(`/users/company-users?companyId=${currentUserCompanyId}&includeInactive=true`, config);
      } else {
        console.log("👤 Fetching department users only");
        usersRes = await axios.get(
          `/users/department-users?department=${currentUserDepartmentId}&includeInactive=true`,
          config
        );
      }
      
      let employeesData = [];
      
      if (usersRes.data && usersRes.data.success) {
        if (usersRes.data.message && usersRes.data.message.users) {
          employeesData = usersRes.data.message.users;
        } else if (usersRes.data.users) {
          employeesData = usersRes.data.users;
        } else if (usersRes.data.message && Array.isArray(usersRes.data.message)) {
          employeesData = usersRes.data.message;
        } else if (usersRes.data.data && Array.isArray(usersRes.data.data)) {
          employeesData = usersRes.data.data;
        }
        
        setEmployees(employeesData);
      } else {
        setEmployees([]);
      }
      
      const deptRes = await axios.get("/departments", config);
      
      if (deptRes.data && deptRes.data.success && Array.isArray(deptRes.data.departments)) {
        const filteredDepartments = deptRes.data.departments.filter(dept => {
          const deptCompanyId = dept.company?._id || dept.company;
          return deptCompanyId === currentUserCompanyId;
        });
        
        setDepartments(filteredDepartments);
      } else {
        setDepartments([]);
      }
      
      await fetchJobRoles();
      
    } catch (err) {
      console.error("❌ Failed to fetch data:", err);
      setError(err.response?.data?.message || 'Failed to load data');
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    currentUserCompanyId, 
    currentUserDepartmentId, 
    canSeeAllCompanyUsers,
    showSnackbar, 
    user.getAuthToken,
    fetchJobRoles
  ]);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle view user
  const handleOpenUser = useCallback((userData) => {
    setSelectedUser(userData);
  }, []);
  
  const handleCloseUser = useCallback(() => {
    setSelectedUser(null);
    setActiveTab('personal');
  }, []);
  
  // Handle menu
  const handleMenuOpen = useCallback((event, userData) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuAnchorEl({
      top: rect.bottom,
      left: rect.left
    });
    setSelectedMenuUser(userData);
  }, []);
  
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedMenuUser(null);
  }, []);
  
  // Handle edit
  const handleEdit = useCallback((userData) => {
    if (!userData) return;
    
    setEditingUser(userData);
    
    const isEditingSelf = currentUserId === (userData._id || userData.id);
    
    let formDataToSet = { 
      ...userData,
      department: userData.department?._id || userData.department || '',
      jobRole: userData.jobRole || '',
      children: userData.children || [],
      documents: userData.documents || [],
      properties: userData.properties || [],
      currentlyAssignedAssets: userData.currentlyAssignedAssets || []
    };
    
    if (isEditingSelf) {
      const latestUserData = user.getCurrentUser();
      if (latestUserData) {
        formDataToSet = {
          ...formDataToSet,
          ...latestUserData,
          department: latestUserData.department?._id || latestUserData.department || formDataToSet.department,
          jobRole: latestUserData.jobRole || formDataToSet.jobRole,
        };
      }
    }
    
    resetEditForm(formDataToSet);
    handleMenuClose();
  }, [resetEditForm, handleMenuClose, currentUserId, user]);
  
  const handleCancelEdit = useCallback(() => {
    setEditingUser(null);
    resetEditForm({});
  }, [resetEditForm]);
  
  // Handle save
  const handleSaveEdit = useCallback(async () => {
    if (!editingUser) {
      return;
    }
    
    setSaving(true);
    
    try {
      const userId = editingUser._id || editingUser.id;
      
      if (!userId) {
        showSnackbar('User ID is missing', 'error');
        return;
      }
      
      const updateData = { ...editFormData };
      
      if (updateData.department && typeof updateData.department === 'object') {
        updateData.department = updateData.department._id;
      }
      
      if (updateData.jobRole) {
        const roleObj = jobRoles.find(r => r._id === updateData.jobRole);
        if (roleObj) {
          updateData.jobRole = roleObj.roleName;
        }
      }
     
      const isSelfEdit = currentUserId === userId;
      
      // Permission check: Can edit if self OR has permission to edit others
      const canEdit = isSelfEdit || canEditOtherEmployees;
      
      if (!canEdit) {
        showSnackbar('You don\'t have permission to edit this user', 'error');
        setSaving(false);
        return;
      }
      
      // Remove system fields only
      const fieldsToDelete = [
        '_id', 'id', '__v', 'createdAt', 'updatedAt', 
        'company', 'companyCode', 'companyId', 'createdBy',
        'resetToken', 'resetTokenExpiry', 'lastPasswordChange',
        'lastLogin', 'loginAttempts', 'lockUntil', 'verificationToken'
      ];
      
      fieldsToDelete.forEach(field => {
        delete updateData[field];
      });
      
      if (!updateData.name?.trim()) {
        showSnackbar('Name is required', 'error');
        setSaving(false);
        return;
      }
      
      const token = user.getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const apiUrl = isSelfEdit ? '/users/me' : `/users/${userId}`;
      
      console.log(`📝 Updating user: ${isSelfEdit ? 'Self-edit' : 'Admin edit'} - Endpoint: ${apiUrl}`);
      console.log("FINAL PAYLOAD 👉", updateData);
      
      const res = await axios.put(apiUrl, updateData, config);
      
      if (res.data && res.data.success) {
        const updatedUser = res.data.message?.user || res.data.user || res.data.data;

        if (selectedUser && (selectedUser._id === userId || selectedUser.id === userId)) {
          setSelectedUser(updatedUser);
        }
        
        setEmployees(prev => prev.map(emp => 
          (emp._id === userId || emp.id === userId) 
            ? { ...updatedUser } 
            : emp
        ));

        if (selectedUser && (selectedUser._id === userId)) {
          setSelectedUser(updatedUser);
        }

        if (isSelfEdit) {
          const currentUserData = user.getCurrentUser();
          const updatedCurrentUser = { ...currentUserData, ...updateData, ...updatedUser };
          localStorage.setItem('user', JSON.stringify(updatedCurrentUser));
          
          const companyDetails = localStorage.getItem('companyDetails');
          if (companyDetails && updatedUser.companyDetails) {
            localStorage.setItem('companyDetails', JSON.stringify(updatedUser.companyDetails));
          }
          
          showSnackbar('Your profile has been updated successfully');
        } else {
          showSnackbar(`${editingUser.name || 'Employee'} has been updated successfully`);
        }
        
        setEditingUser(null);
        resetEditForm({});
        await fetchData();
        
      } else {
        showSnackbar(res.data.message || 'Update failed', 'error');
      }
        
    } catch (err) {
      console.error("❌ Update failed:", err);
      const errorMessage = err.response?.data?.message || 'Failed to update employee';
      
      if (err.response?.status === 403) {
        showSnackbar('You do not have permission to edit this user', 'error');
      } else if (err.response?.status === 404) {
        showSnackbar('User not found', 'error');
      } else {
        showSnackbar(errorMessage, 'error');
      }
    } finally {
      setSaving(false);
    }
  }, [
    editingUser, 
    editFormData, 
    currentUserId, 
    canEditOtherEmployees,
    showSnackbar, 
    resetEditForm, 
    user,
    fetchData,
    jobRoles,
    selectedUser
  ]);
  
  // Handle delete
  const handleDeleteClick = useCallback((userData) => {
    if (!userData) return;
    
    const canDelete = canDeleteUser(userData);
    
    if (!canDelete) {
      const message = canEditOtherEmployees ? 
        'You cannot delete your own account' : 
        'You don\'t have permission to delete users';
      showSnackbar(message, 'error');
      handleMenuClose();
      return;
    }
    
    setUserToDelete(userData);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  }, [canDeleteUser, canEditOtherEmployees, showSnackbar, handleMenuClose]);
  
  const handleDeleteConfirm = useCallback(async () => {
    if (!userToDelete) {
      return;
    }
    
    const isSelfDelete = currentUserId === (userToDelete._id || userToDelete.id);
    
    if (isSelfDelete) {
      showSnackbar('You cannot delete your own account', 'error');
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      return;
    }
    
    setDeleting(true);
    
    try {
      const userId = userToDelete._id || userToDelete.id;
      const token = user.getAuthToken();
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.delete(`/users/${userId}`, config);
      
      if (response.data && response.data.success) {
        setEmployees(prev => prev.filter(emp => 
          (emp._id !== userId && emp.id !== userId)
        ));
        
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        showSnackbar('Employee deleted successfully');
        
        if (selectedUser && (selectedUser.id === userId || selectedUser._id === userId)) {
          handleCloseUser();
        }
        
      } else {
        showSnackbar(response.data.message || 'Delete failed', 'error');
      }
      
    } catch (err) {
      console.error("❌ Delete failed:", err);
      const errorMessage = err.response?.data?.message || 'Failed to delete employee';
      showSnackbar(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  }, [userToDelete, selectedUser, currentUserId, handleCloseUser, showSnackbar, user.getAuthToken]);
  
  // Helper functions
  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return 'Not provided';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return phoneStr.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return phoneStr;
  }, []);
  
  const getDepartmentName = useCallback((dept) => {
    if (!dept) return 'Not assigned';
    
    if (typeof dept === 'object') {
      return dept.name || dept.departmentName || 'Department';
    }
    
    if (typeof dept === 'string') {
      const department = departments.find(d => d._id === dept || d.id === dept);
      return department ? department.name : 'Not assigned';
    }
    
    return 'Not assigned';
  }, [departments]);
  
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }, []);
  
  const formatCurrency = useCallback((amount) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);
  
  // Stats calculation
  const stats = useMemo(() => {
    if (!Array.isArray(employees)) {
      return { total: 0, active: 0, inactive: 0 };
    }

    const activeEmployees = employees.filter(emp => emp && emp.isActive !== false);
    const inactiveEmployees = employees.filter(emp => emp && emp.isActive === false);
    
    return {
      total: employees.length,
      active: activeEmployees.length,
      inactive: inactiveEmployees.length
    };
  }, [employees]);
  
  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees)) {
      return [];
    }
    
    let filtered = employees;
    
    if (selectedFilter === "active") {
      filtered = filtered.filter(emp => emp && emp.isActive !== false);
    } else if (selectedFilter === "inactive") {
      filtered = filtered.filter(emp => emp && emp.isActive === false);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((emp) => {
        const jobRoleName = getJobRoleName(emp.jobRole).toLowerCase();
        const departmentName = getDepartmentName(emp.department).toLowerCase();
        const companyRole = (emp.companyRole || '').toLowerCase();
        
        return (
          (emp.name && emp.name.toLowerCase().includes(search)) ||
          (emp.email && emp.email.toLowerCase().includes(search)) ||
          (emp.employeeId && emp.employeeId.toLowerCase().includes(search)) ||
          (emp.phone && emp.phone.toString().includes(search)) ||
          (emp.jobRole && jobRoleName.includes(search)) ||
          departmentName.includes(search) ||
          companyRole.includes(search)
        );
      });
    }
    
    return filtered;
  }, [employees, selectedFilter, searchTerm, getJobRoleName, getDepartmentName]);
  
  // Loading state
  if (loading) {
    return <CIISLoader />;
  }
  
  // Error state
  if (error) {
    return (
      <div className="EmployeeDirectory-error-container">
        <FiAlertTriangle size={48} color="#d32f2f" />
        <h3>Error Loading Employees</h3>
        <p>{error}</p>
        <button 
          className="EmployeeDirectory-btn EmployeeDirectory-btn-contained"
          onClick={fetchData}
        >
          <FiRefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }
  
  // Check if no company data
  if (!currentUserCompanyId) {
    return (
      <div className="EmployeeDirectory-error-container">
        <FiAlertTriangle size={48} color="#ff9800" />
        <h3>Company Information Missing</h3>
        <p>Unable to load employee directory. Please login again.</p>
        <button 
          className="EmployeeDirectory-btn EmployeeDirectory-btn-contained"
          onClick={() => window.location.href = '/login'}
        >
          Go to Login
        </button>
      </div>
    );
  }
  
  return (
    <div className="EmployeeDirectory">      
      <div className="EmployeeDirectory-header">
        <div className="EmployeeDirectory-company-info">
          <div className="EmployeeDirectory-company-avatar"></div>
          <div>
            <h1 className="EmployeeDirectory-title">Employee Directory</h1>
            <p className="EmployeeDirectory-subtitle">
              {currentUserCompanyName || 'Company'} • {currentUserCompanyCode}
              {!canSeeAllCompanyUsers && currentUserDepartmentId && (
                <span className="EmployeeDirectory-department-badge">
                  • {getDepartmentName(currentUserDepartmentId)} Department
                </span>
              )}
              {canSeeAllCompanyUsers && (
                <span className="EmployeeDirectory-super-admin-badge">
                  • Full Company Access
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="EmployeeDirectory-action-bar">
          <div className="EmployeeDirectory-total-count">
            <span className="EmployeeDirectory-count-badge">
              {stats.total} Employees
            </span>
            <span className="EmployeeDirectory-company-badge">
               {currentUserCompanyCode}
            </span>
            
            {!isMobile && (
              <div className="EmployeeDirectory-view-toggle">
                <button 
                  className={`EmployeeDirectory-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <FiGrid size={14} />
                </button>
                <button 
                  className={`EmployeeDirectory-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <FiList size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isMobile && (
        <div className="EmployeeDirectory-search-filter-container">
          <div className="EmployeeDirectory-search-filter-header">
            <FiFilter size={20} color="#1976d2" />
            <h3>Search & Filter</h3>
          </div>
          
          <div className="EmployeeDirectory-search-row">
            <div className="EmployeeDirectory-search-input-container">
              <FiSearch className="EmployeeDirectory-search-icon" />
              <input
                type="text"
                className="EmployeeDirectory-search-input"
                placeholder="Search employees by name, email, ID, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="EmployeeDirectory-clear-search" onClick={() => setSearchTerm('')}>
                  <FiX size={16} />
                </button>
              )}
            </div>
            
            <select
              className="EmployeeDirectory-role-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">All Employees ({stats.total})</option>
              <option value="active">Active ({stats.active})</option>
              <option value="inactive">Inactive ({stats.inactive})</option>
            </select>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="EmployeeDirectory-stats-container">
          {[
            { label: 'Total Employees', count: stats.total, color: 'primary', icon: <FiUsers /> },
            { label: 'Active', count: stats.active, color: 'success', icon: <FiCheckCircle /> },
            { label: 'Inactive', count: stats.inactive, color: 'error', icon: <FiAlertTriangle /> },
          ]
          .map((stat, index) => (
            <div key={index} className={`EmployeeDirectory-stat-card EmployeeDirectory-stat-card-${stat.color}`}>
              <div className="EmployeeDirectory-stat-card-header">
                <div className={`EmployeeDirectory-stat-icon EmployeeDirectory-stat-icon-${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="EmployeeDirectory-stat-value">{stat.count}</div>
              <div className="EmployeeDirectory-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="EmployeeDirectory-results-header">
        <div>
          <h2 className="EmployeeDirectory-results-title">Team Members</h2>
          <p className="EmployeeDirectory-results-count">
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
            {selectedFilter !== 'all' && ` • ${selectedFilter === 'active' ? 'Active' : 'Inactive'} employees`}
            {searchTerm && ` • Matching "${searchTerm}"`}
          </p>
        </div>
        
        <div className="EmployeeDirectory-permission-note">
          <FiInfo size={16} />
          <span>{canEditOtherEmployees ? 'You have full edit access' : 'You can only edit your own profile'}</span>
        </div>
      </div>

      {isMobile && (
        <div className="EmployeeDirectory-search-filter-container">
          <div className="EmployeeDirectory-search-input-container">
            <FiSearch className="EmployeeDirectory-search-icon" />
            <input
              type="text"
              className="EmployeeDirectory-search-input"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="EmployeeDirectory-clear-search" onClick={() => setSearchTerm('')}>
                <FiX size={16} />
              </button>
            )}
          </div>
          
          <div className="EmployeeDirectory-mobile-filter-select">
            <select
              className="EmployeeDirectory-role-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">All Employees</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}

      {filteredEmployees.length === 0 ? (
        <div className="EmployeeDirectory-empty-state">
          <div className="EmployeeDirectory-empty-state-icon">
            <FiUsers size={isMobile ? 48 : 64} />
          </div>
          <h3 className="EmployeeDirectory-empty-state-title">No Employees Found</h3>
          <p className="EmployeeDirectory-empty-state-text">
            {searchTerm || selectedFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'No employees found in your company directory.'
            }
          </p>
          <button 
            className="EmployeeDirectory-btn EmployeeDirectory-btn-outlined"
            onClick={() => {
              setSearchTerm('');
              setSelectedFilter('all');
            }}
          >
            <FiX size={16} /> Clear Filters
          </button>
        </div>
      ) : (
        <div className={`EmployeeDirectory-employee-${viewMode}`}>
          {filteredEmployees.map((emp) => (
            <EmployeeDirectoryEmployeeCard 
              key={emp._id || emp.id} 
              emp={emp} 
              onView={handleOpenUser}
              onMenuOpen={handleMenuOpen}
              currentUserId={currentUserId}
              jobRoles={jobRoles}
              departments={departments}
              canEditOtherEmployees={canEditOtherEmployees}
            />
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="EmployeeDirectory-modal-overlay" onClick={handleCloseUser}>
          <div className="EmployeeDirectory-modal EmployeeDirectory-user-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="EmployeeDirectory-modal-header">
              <div className="EmployeeDirectory-modal-header-content">
                <h2 className="EmployeeDirectory-modal-title">{selectedUser.name}</h2>
                <div className="EmployeeDirectory-modal-subtitle">
                  {selectedUser.employeeId && <span>ID: {selectedUser.employeeId}</span>}
                  {selectedUser.companyRole && (
                    <span className={`EmployeeDirectory-company-role-badge ${selectedUser.companyRole}`}>
                      • {selectedUser.companyRole}
                    </span>
                  )}
                  {selectedUser.jobRole && (
                    <span>• {getJobRoleName(selectedUser.jobRole)}</span>
                  )}
                  {selectedUser.department && (
                    <span>• {getDepartmentName(selectedUser.department)}</span>
                  )}
                </div>
              </div>
              
              <div>
                <button className="EmployeeDirectory-modal-close" onClick={handleCloseUser}>
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="EmployeeDirectory-tabs">
              <button 
                className={`EmployeeDirectory-tab ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <FiUser size={14} /> Personal
              </button>
              <button 
                className={`EmployeeDirectory-tab ${activeTab === 'employment' ? 'active' : ''}`}
                onClick={() => setActiveTab('employment')}
              >
                <FiBriefcase size={14} /> Employment
              </button>
              <button 
                className={`EmployeeDirectory-tab ${activeTab === 'bank' ? 'active' : ''}`}
                onClick={() => setActiveTab('bank')}
              >
                <FiCreditCard size={14} /> Bank
              </button>
              <button 
                className={`EmployeeDirectory-tab ${activeTab === 'family' ? 'active' : ''}`}
                onClick={() => setActiveTab('family')}
              >
                <FiFamily size={14} /> Family
              </button>
              <button 
                className={`EmployeeDirectory-tab ${activeTab === 'emergency' ? 'active' : ''}`}
                onClick={() => setActiveTab('emergency')}
              >
                <FiPhoneCall size={14} /> Emergency
              </button>
            </div>
            
            <div className="EmployeeDirectory-modal-content">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="EmployeeDirectory-modal-section">
                  <h3 className="EmployeeDirectory-section-title">
                    <FiUser /> Personal Information
                  </h3>
                  <div className="EmployeeDirectory-detail-grid">
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Full Name</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.name || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Email Address</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.email || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Phone Number</div>
                      <div className="EmployeeDirectory-detail-value">{formatPhoneNumber(selectedUser.phone)}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Date of Birth</div>
                      <div className="EmployeeDirectory-detail-value">{formatDate(selectedUser.dob)}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Gender</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.gender || 'Not specified'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Marital Status</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.maritalStatus || 'Not specified'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item" style={{ gridColumn: '1 / -1' }}>
                      <div className="EmployeeDirectory-detail-label">Address</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.address || 'Not provided'}</div>
                    </div>

                    {selectedUser.city && (
                      <div className="EmployeeDirectory-detail-item">
                        <div className="EmployeeDirectory-detail-label">City</div>
                        <div className="EmployeeDirectory-detail-value">{selectedUser.city}</div>
                      </div>
                    )}

                    {selectedUser.state && (
                      <div className="EmployeeDirectory-detail-item">
                        <div className="EmployeeDirectory-detail-label">State</div>
                        <div className="EmployeeDirectory-detail-value">{selectedUser.state}</div>
                      </div>
                    )}

                    {selectedUser.zipCode && (
                      <div className="EmployeeDirectory-detail-item">
                        <div className="EmployeeDirectory-detail-label">Zip Code</div>
                        <div className="EmployeeDirectory-detail-value">{selectedUser.zipCode}</div>
                      </div>
                    )}

                    {selectedUser.country && (
                      <div className="EmployeeDirectory-detail-item">
                        <div className="EmployeeDirectory-detail-label">Country</div>
                        <div className="EmployeeDirectory-detail-value">{selectedUser.country}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Employment Information Tab */}
              {activeTab === 'employment' && (
                <div className="EmployeeDirectory-modal-section">
                  <h3 className="EmployeeDirectory-section-title">
                    <FiBriefcase /> Employment Information
                  </h3>
                  <div className="EmployeeDirectory-detail-grid">
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Employee ID</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.employeeId || 'Not assigned'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Job Role</div>
                      <div className="EmployeeDirectory-detail-value">
                        {getJobRoleName(selectedUser.jobRole)}
                      </div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Department</div>
                      <div className="EmployeeDirectory-detail-value">{getDepartmentName(selectedUser.department)}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Company Role</div>
                      <div className="EmployeeDirectory-detail-value">
                        <span className={`EmployeeDirectory-company-role-badge ${selectedUser.companyRole || 'employee'}`}>
                          {selectedUser.companyRole || 'employee'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Employee Type</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.employeeType || 'Not specified'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Salary</div>
                      <div className="EmployeeDirectory-detail-value">{formatCurrency(selectedUser.salary)}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Status</div>
                      <div className="EmployeeDirectory-detail-value">
                        <span className={`EmployeeDirectory-status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Member Since</div>
                      <div className="EmployeeDirectory-detail-value">{formatDate(selectedUser.createdAt)}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Reporting Manager</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.reportingManager || 'Not assigned'}</div>
                    </div>

                    {selectedUser.dateOfJoining && (
                      <div className="EmployeeDirectory-detail-item">
                        <div className="EmployeeDirectory-detail-label">Date of Joining</div>
                        <div className="EmployeeDirectory-detail-value">{formatDate(selectedUser.dateOfJoining)}</div>
                      </div>
                    )}

                    {selectedUser.workLocation && (
                      <div className="EmployeeDirectory-detail-item">
                        <div className="EmployeeDirectory-detail-label">Work Location</div>
                        <div className="EmployeeDirectory-detail-value">{selectedUser.workLocation}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Details Tab */}
              {activeTab === 'bank' && (
                <div className="EmployeeDirectory-modal-section">
                  <h3 className="EmployeeDirectory-section-title">
                    <FiCreditCard /> Bank Details
                  </h3>
                  <div className="EmployeeDirectory-detail-grid">
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Account Holder Name</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.bankHolderName || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Account Number</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.accountNumber || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">IFSC Code</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.ifsc || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Bank Name</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.bankName || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Details Tab */}
              {activeTab === 'family' && (
                <div className="EmployeeDirectory-modal-section">
                  <h3 className="EmployeeDirectory-section-title">
                    <FiFamily /> Family Details
                  </h3>
                  <div className="EmployeeDirectory-detail-grid">
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Father's Name</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.fatherName || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Mother's Name</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.motherName || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Spouse Name</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.spouseName || 'Not provided'}</div>
                    </div>
                  </div>

                  {selectedUser.children && selectedUser.children.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 className="EmployeeDirectory-subsection-title">Children</h4>
                      <div className="EmployeeDirectory-children-list">
                        {selectedUser.children.map((child, index) => (
                          <div key={index} className="EmployeeDirectory-child-item">
                            <span><strong>{child.name}</strong></span>
                            {child.age && <span>Age: {child.age}</span>}
                            {child.dob && <span>DOB: {formatDate(child.dob)}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Contact Tab */}
              {activeTab === 'emergency' && (
                <div className="EmployeeDirectory-modal-section">
                  <h3 className="EmployeeDirectory-section-title">
                    <FiPhoneCall /> Emergency Contact
                  </h3>
                  <div className="EmployeeDirectory-detail-grid">
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Contact Name</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.emergencyName || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Phone Number</div>
                      <div className="EmployeeDirectory-detail-value">{formatPhoneNumber(selectedUser.emergencyPhone)}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item">
                      <div className="EmployeeDirectory-detail-label">Relationship</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.emergencyRelation || 'Not provided'}</div>
                    </div>
                    
                    <div className="EmployeeDirectory-detail-item" style={{ gridColumn: '1 / -1' }}>
                      <div className="EmployeeDirectory-detail-label">Emergency Address</div>
                      <div className="EmployeeDirectory-detail-value">{selectedUser.emergencyAddress || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="EmployeeDirectory-modal-footer">
              {(canEditOtherEmployees || currentUserId === (selectedUser._id || selectedUser.id)) && (
                <button 
                  className="EmployeeDirectory-btn EmployeeDirectory-btn-contained"
                  onClick={() => handleEdit(selectedUser)}
                  style={{ marginRight: '8px' }}
                >
                  <FiEdit size={14} /> Edit Employee
                </button>
              )}
              <button className="EmployeeDirectory-btn EmployeeDirectory-btn-outlined" onClick={handleCloseUser}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="EmployeeDirectory-modal-overlay" onClick={handleCancelEdit}>
          <div className="EmployeeDirectory-modal EmployeeDirectory-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="EmployeeDirectory-modal-header">
              <div className="EmployeeDirectory-modal-header-content">
                <h2 className="EmployeeDirectory-modal-title">
                  {currentUserId === (editingUser._id || editingUser.id) ? 'Edit Your Profile' : `Edit ${editingUser.name}`}
                </h2>
                <div className="EmployeeDirectory-modal-subtitle">
                  Update employee information across all sections
                </div>
              </div>
              <button className="EmployeeDirectory-modal-close" onClick={handleCancelEdit}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className="EmployeeDirectory-modal-content">
              <EditEmployeeForm 
                editingUser={editingUser}
                formData={editFormData}
                onInputChange={handleInputChange}
                departments={departments}
                jobRoles={jobRoles}
                canEditOtherEmployees={canEditOtherEmployees}
                isSelfEdit={currentUserId === (editingUser._id || editingUser.id)}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
              />
            </div>
            
            <div className="EmployeeDirectory-modal-footer">
              <button 
                className="EmployeeDirectory-btn EmployeeDirectory-btn-outlined"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <FiX size={14} /> Cancel
              </button>
              <button 
                className="EmployeeDirectory-btn EmployeeDirectory-btn-contained"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="EmployeeDirectory-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={14} /> Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="EmployeeDirectory-modal-overlay" onClick={() => !deleting && setDeleteConfirmOpen(false)}>
          <div className="EmployeeDirectory-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="EmployeeDirectory-modal-header">
              <div className="EmployeeDirectory-modal-header-content">
                <h2 className="EmployeeDirectory-modal-title" style={{ color: '#d32f2f' }}>
                  <FiAlertTriangle style={{ marginRight: '8px' }} />
                  Confirm Delete
                </h2>
              </div>
              {!deleting && (
                <button className="EmployeeDirectory-modal-close" onClick={() => setDeleteConfirmOpen(false)}>
                  <FiX size={20} />
                </button>
              )}
            </div>
            
            <div className="EmployeeDirectory-modal-content">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <FiAlertTriangle size={24} color="#d32f2f" style={{ marginRight: '12px' }} />
                <p style={{ fontWeight: '600' }}>
                  Are you sure you want to delete this employee?
                </p>
              </div>
              <p>
                You are about to delete <strong>{userToDelete?.name}</strong>. 
                This action will deactivate their account and cannot be undone.
              </p>
            </div>
            
            <div className="EmployeeDirectory-modal-footer">
              <button 
                className="EmployeeDirectory-btn EmployeeDirectory-btn-outlined"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="EmployeeDirectory-btn EmployeeDirectory-btn-error"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="EmployeeDirectory-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={14} /> Delete Employee
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu - Only visible to users with edit access */}
      {canEditOtherEmployees && menuAnchorEl && selectedMenuUser && (
        <>
          <div 
            className="EmployeeDirectory-modal-overlay"
            style={{ background: 'transparent', zIndex: 1099 }}
            onClick={handleMenuClose}
          />
          <div 
            className="EmployeeDirectory-context-menu"
            style={{
              position: 'fixed',
              top: menuAnchorEl.top + 'px',
              left: menuAnchorEl.left + 'px',
              zIndex: 1100
            }}
          >
            <button className="EmployeeDirectory-menu-item" onClick={() => handleOpenUser(selectedMenuUser)}>
              <FiEye size={16} color="#0288d1" />
              <span className="EmployeeDirectory-menu-item-text">View Details</span>
            </button>
            
            <button 
              className="EmployeeDirectory-menu-item" 
              onClick={() => handleEdit(selectedMenuUser)}
            >
              <FiEdit size={16} color="#1976d2" />
              <span className="EmployeeDirectory-menu-item-text">Edit Employee</span>
            </button>
            
            {canDeleteUser(selectedMenuUser) && (
              <button 
                className="EmployeeDirectory-menu-item" 
                onClick={() => handleDeleteClick(selectedMenuUser)}
                style={{ color: '#d32f2f' }}
              >
                <FiTrash2 size={16} color="#d32f2f" />
                <span className="EmployeeDirectory-menu-item-text">Delete Employee</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className="EmployeeDirectory-snackbar">
          <div className={`EmployeeDirectory-alert EmployeeDirectory-alert-${snackbar.severity}`}>
            {snackbar.severity === 'success' ? (
              <FiCheckCircle size={20} />
            ) : (
              <FiAlertTriangle size={20} />
            )}
            <span>{snackbar.message}</span>
            <button 
              className="EmployeeDirectory-alert-close"
              onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
