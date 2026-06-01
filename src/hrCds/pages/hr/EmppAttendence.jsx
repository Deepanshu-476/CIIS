import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "../../../utils/axiosConfig";
import './employee-attendance.css';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CIISLoader from '../../../Loader/CIISLoader'; 

import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiDownload,
  FiFileText,
  FiImage,
  FiWatch,
  FiAlertTriangle,
  FiUserCheck,
  FiUserX,
  FiEdit,
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiRefreshCw,
  FiLock,
  FiEyeOff,
  FiShield,
  FiHome,
  FiCalendar as FiRangeCalendar
} from "react-icons/fi";

// ============================================
// DATE RANGE FILTER COMPONENT
// ============================================
const DateRangeFilter = ({ startDate, endDate, onStartDateChange, onEndDateChange, onApply, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presets = [
    { label: "Today", days: 0 },
    { label: "This Week", days: 7 },
    { label: "Last 7 Days", days: 7 },
    { label: "Last 15 Days", days: 15 },
    { label: "This Month", days: 30 },
    { label: "Last Month", days: 30, offset: 30 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 60 Days", days: 60 },
    { label: "Last 90 Days", days: 90 },
    { label: "This Quarter", days: 90 },
    { label: "This Year", days: 365 },
  ];

  const applyPreset = (preset) => {
    const end = new Date();
    let start = new Date();
    
    if (preset.offset) {
      start.setDate(start.getDate() - preset.days - preset.offset);
      end.setDate(end.getDate() - preset.offset);
    } else {
      start.setDate(start.getDate() - preset.days);
    }
    
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  return (
    <div className="EmppAttendence-date-range-filter" ref={dropdownRef}>
      <div className="EmppAttendence-date-range-inputs">
        <div className="EmppAttendence-date-input-group">
          <label className="EmppAttendence-filter-label">From Date</label>
          <input
            type="date"
            className="EmppAttendence-filter-input"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="EmppAttendence-date-input-group">
          <label className="EmppAttendence-filter-label">To Date</label>
          <input
            type="date"
            className="EmppAttendence-filter-input"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
        <button 
          className="EmppAttendence-btn EmppAttendence-btn-contained EmppAttendence-btn-sm"
          onClick={onApply}
        >
          <FiRangeCalendar size={16} />
          <span>Apply</span>
        </button>
        <button 
          className="EmppAttendence-btn EmppAttendence-btn-outlined EmppAttendence-btn-sm"
          onClick={onClear}
        >
          <FiRefreshCw size={16} />
        </button>
        <button 
          className="EmppAttendence-btn EmppAttendence-btn-outlined EmppAttendence-btn-sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          Quick Select ▼
        </button>
      </div>
      
      {isOpen && (
        <div className="EmppAttendence-presets-dropdown">
          {presets.map((preset, index) => (
            <button
              key={index}
              className="EmppAttendence-preset-option"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Employee Type Filter Component
const EmployeeTypeFilter = ({ selected, onChange }) => {
  const options = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
  ];

  return (
    <select
      className="EmppAttendence-filter-input"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Department Filter Component
const DepartmentFilter = ({ selected, onChange, departments }) => {
  const options = [
    { value: 'all', label: 'All Departments' },
    ...(departments || []).map(dept => ({
      value: dept.name || dept,
      label: dept.name || dept
    }))
  ];

  return (
    <select
      className="EmppAttendence-filter-input"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Status Filter Component
const StatusFilter = ({ selected, onChange }) => {
  const options = [
    { value: 'all', label: 'All Status' },
    { value: 'present', label: 'Present' },
    { value: 'late', label: 'Late' },
    { value: 'halfday', label: 'Half Day' },
    { value: 'absent', label: 'Absent' },
  ];

  return (
    <select
      className="EmppAttendence-filter-input"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Add New Attendance Modal
const AddAttendanceModal = ({ onClose, onSave, users, selectedDate, currentUserDepartment, canEdit }) => {
  const [formData, setFormData] = useState({
    user: '',
    date: selectedDate,
    inTime: '09:00',
    outTime: '18:00',
    status: 'present',
    lateBy: '00:00:00',
    earlyLeave: '00:00:00',
    overTime: '00:00:00',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  // Filter users based on department (everyone can see all users in same company)
  const filteredUsers = useMemo(() => {
    let availableUsers = users;
    
    // Only filter by department if not in admin role (but still show all users)
    // For attendance, everyone can add attendance for any user in same company
    return availableUsers.filter(user => 
      user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [users, searchUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const inDateTime = new Date(`${selectedDate}T${formData.inTime}`);
      const outDateTime = new Date(`${selectedDate}T${formData.outTime}`);
      
      const payload = {
        user: formData.user,
        date: selectedDate,
        inTime: inDateTime.toISOString(),
        outTime: outDateTime.toISOString(),
        status: formData.status.toUpperCase(),
        lateBy: formData.lateBy,
        earlyLeave: formData.earlyLeave,
        overTime: formData.overTime,
        notes: formData.notes
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error("Error adding attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = () => {
    if (!formData.inTime) return "absent";
    
    const [hours, minutes] = formData.inTime.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes;
    
    if (totalMinutes >= 600) return "halfday";
    if (totalMinutes >= 550) return "late";
    return "present";
  };

  const handleTimeChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'inTime') {
      newFormData.status = calculateStatus();
    }
    
    setFormData(newFormData);
  };

  return (
    <div className="EmppAttendence-modal-overlay" onClick={onClose}>
      <div className="EmppAttendence-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="EmppAttendence-modal-header">
          <h3>Add New Attendance</h3>
          <button className="EmppAttendence-modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="EmppAttendence-modal-body">
            <div className="EmppAttendence-form-group EmppAttendence-full-width">
              <label>Select Employee *</label>
              <select
                className="EmppAttendence-form-input"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                required
              >
                <option value="">Select an employee...</option>
                {filteredUsers.map(user => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.name} - {user.email} ({user.department || 'N/A'}) - {user.employeeType || 'N/A'}
                  </option>
                ))}
              </select>
              
              {formData.user && (
                <div className="EmppAttendence-selected-user-info">
                  {(() => {
                    const selectedUser = users.find(u => (u.id || u._id) === formData.user);
                    if (!selectedUser) return null;
                    return (
                      <div className="EmppAttendence-user-display">
                        <div className="EmppAttendence-user-avatar-small">
                          {selectedUser.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                        <div className="EmppAttendence-user-details">
                          <strong>{selectedUser.name || 'Unknown'}</strong>
                          <small>{selectedUser.email || 'N/A'} • {selectedUser.department || 'N/A'} • {selectedUser.employeeType || 'N/A'}</small>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="EmppAttendence-form-grid">
              <div className="EmppAttendence-form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className="EmppAttendence-form-input"
                  value={selectedDate}
                  readOnly
                />
              </div>

              <div className="EmppAttendence-form-group">
                <label>Check In Time *</label>
                <input
                  type="time"
                  className="EmppAttendence-form-input"
                  value={formData.inTime}
                  onChange={(e) => handleTimeChange('inTime', e.target.value)}
                  required
                />
              </div>

              <div className="EmppAttendence-form-group">
                <label>Check Out Time *</label>
                <input
                  type="time"
                  className="EmppAttendence-form-input"
                  value={formData.outTime}
                  onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                  required
                />
              </div>

              <div className="EmppAttendence-form-group">
                <label>Status *</label>
                <select
                  className="EmppAttendence-form-input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="halfday">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div className="EmppAttendence-form-group">
                <label>Late By</label>
                <input
                  type="text"
                  className="EmppAttendence-form-input"
                  value={formData.lateBy}
                  onChange={(e) => setFormData({ ...formData, lateBy: e.target.value })}
                  placeholder="00:00:00"
                />
              </div>

              <div className="EmppAttendence-form-group">
                <label>Early Leave</label>
                <input
                  type="text"
                  className="EmppAttendence-form-input"
                  value={formData.earlyLeave}
                  onChange={(e) => setFormData({ ...formData, earlyLeave: e.target.value })}
                  placeholder="00:00:00"
                />
              </div>

              <div className="EmppAttendence-form-group">
                <label>Overtime</label>
                <input
                  type="text"
                  className="EmppAttendence-form-input"
                  value={formData.overTime}
                  onChange={(e) => setFormData({ ...formData, overTime: e.target.value })}
                  placeholder="00:00:00"
                />
              </div>

              <div className="EmppAttendence-form-group EmppAttendence-full-width">
                <label>Notes</label>
                <textarea
                  className="EmppAttendence-form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>
            </div>

            <div className="EmppAttendence-calculated-info">
              <div className="EmppAttendence-info-item">
                <span>Calculated Status:</span>
                <span className={`EmppAttendence-status-chip ${calculateStatus()}`}>
                  {calculateStatus().toUpperCase()}
                </span>
              </div>
              <div className="EmppAttendence-info-item">
                <span>Hours Worked:</span>
                <span>
                  {(() => {
                    if (!formData.inTime || !formData.outTime) return "00:00:00";
                    const [inHour, inMinute] = formData.inTime.split(':').map(Number);
                    const [outHour, outMinute] = formData.outTime.split(':').map(Number);
                    const totalMinutes = (outHour * 60 + outMinute) - (inHour * 60 + inMinute);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          <div className="EmppAttendence-modal-footer">
            <button 
              className="EmppAttendence-btn EmppAttendence-btn-outlined" 
              type="button" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="EmppAttendence-btn EmppAttendence-btn-contained" 
              type="submit"
              disabled={loading || !formData.user}
            >
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to get department name
const getDepartmentName = (deptId, departmentsMap, departmentsList) => {
  if (!deptId) return 'Unassigned';
  
  if (departmentsMap && departmentsMap[deptId]) {
    return departmentsMap[deptId];
  }
  
  if (departmentsList && Array.isArray(departmentsList)) {
    const dept = departmentsList.find(d => d._id === deptId || d.id === deptId);
    if (dept) return dept.name;
  }
  
  return deptId;
};

// Edit Attendance Modal - UPDATED with full permissions
const EditAttendanceModal = ({ record, onClose, onSave, onDelete, users, canEdit }) => {
  const [editedRecord, setEditedRecord] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // ✅ Everyone can edit and delete
  const canEditRecord = true;
  const canDeleteRecord = true;

  useEffect(() => {
    if (record) {
      setEditedRecord({
        user: record.user?.id || record.user?._id || record.user || '',
        date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
        inTime: record.inTime ? new Date(record.inTime).toTimeString().slice(0, 5) : '',
        outTime: record.outTime ? new Date(record.outTime).toTimeString().slice(0, 5) : '',
        status: record.status?.toLowerCase() || 'absent',
        lateBy: record.lateBy || '00:00:00',
        earlyLeave: record.earlyLeave || '00:00:00',
        overTime: record.overTime || '00:00:00',
        notes: record.notes || ''
      });
    }
  }, [record]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const inDateTime = new Date(`${editedRecord.date}T${editedRecord.inTime}`);
      const outDateTime = new Date(`${editedRecord.date}T${editedRecord.outTime}`);
      
      const payload = {
        inTime: editedRecord.inTime ? inDateTime.toISOString() : null,
        outTime: editedRecord.outTime ? outDateTime.toISOString() : null,
        status: editedRecord.status.toUpperCase(),
        lateBy: editedRecord.lateBy,
        earlyLeave: editedRecord.earlyLeave,
        overTime: editedRecord.overTime,
        notes: editedRecord.notes,
        date: editedRecord.date
      };

      await onSave(record._id, payload);
      onClose();
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(record._id);
      onClose();
    } catch (error) {
      console.error("Error deleting attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = () => {
    if (!editedRecord.inTime) return "absent";
    
    const [hours, minutes] = editedRecord.inTime.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes;
    
    if (totalMinutes >= 600) return "halfday";
    if (totalMinutes >= 550) return "late";
    return "present";
  };

  const handleTimeChange = (field, value) => {
    const newRecord = { ...editedRecord, [field]: value };
    
    if (field === 'inTime') {
      newRecord.status = calculateStatus();
    }
    
    setEditedRecord(newRecord);
  };

  const getEmployeeName = () => {
    if (!record.user) return "Unknown Employee";
    return record.user.name || record.user.email || "Unknown Employee";
  };

  if (!record) return null;

  return (
    <div className="EmppAttendence-modal-overlay" onClick={onClose}>
      <div className="EmppAttendence-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="EmppAttendence-modal-header">
          <h3>Edit Attendance</h3>
          <button className="EmppAttendence-modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="EmppAttendence-modal-body">
          <div className="EmppAttendence-employee-info-summary">
            <div className="EmppAttendence-employee-avatar large">
              {(() => {
                const name = getEmployeeName();
                return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              })()}
            </div>
            <div>
              <h4>{getEmployeeName()}</h4>
              <p className="EmppAttendence-text-muted">{record.user?.email || "N/A"}</p>
              <p className="EmppAttendence-text-muted">
                {record.user?.department || "N/A"} • {record.user?.employeeType?.toUpperCase() || "N/A"} • 
                {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>

          <div className="EmppAttendence-form-grid">
            <div className="EmppAttendence-form-group">
              <label>Date</label>
              <input
                type="date"
                className="EmppAttendence-form-input"
                value={editedRecord.date}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="EmppAttendence-form-group">
              <label>Check In Time</label>
              <input
                type="time"
                className="EmppAttendence-form-input"
                value={editedRecord.inTime}
                onChange={(e) => handleTimeChange('inTime', e.target.value)}
              />
            </div>

            <div className="EmppAttendence-form-group">
              <label>Check Out Time</label>
              <input
                type="time"
                className="EmppAttendence-form-input"
                value={editedRecord.outTime}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, outTime: e.target.value }))}
              />
            </div>

            <div className="EmppAttendence-form-group">
              <label>Status</label>
              <select
                className="EmppAttendence-form-input"
                value={editedRecord.status}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="halfday">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            <div className="EmppAttendence-form-group">
              <label>Late By</label>
              <input
                type="text"
                className="EmppAttendence-form-input"
                value={editedRecord.lateBy}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, lateBy: e.target.value }))}
                placeholder="00:00:00"
              />
            </div>

            <div className="EmppAttendence-form-group">
              <label>Early Leave</label>
              <input
                type="text"
                className="EmppAttendence-form-input"
                value={editedRecord.earlyLeave}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, earlyLeave: e.target.value }))}
                placeholder="00:00:00"
              />
            </div>

            <div className="EmppAttendence-form-group">
              <label>Overtime</label>
              <input
                type="text"
                className="EmppAttendence-form-input"
                value={editedRecord.overTime}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, overTime: e.target.value }))}
                placeholder="00:00:00"
              />
            </div>

            <div className="EmppAttendence-form-group EmppAttendence-full-width">
              <label>Notes</label>
              <textarea
                className="EmppAttendence-form-input"
                value={editedRecord.notes}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
                rows="3"
              />
            </div>
          </div>

          <div className="EmppAttendence-calculated-info">
            <div className="EmppAttendence-info-item">
              <span>Calculated Status:</span>
              <span className={`EmppAttendence-status-chip ${calculateStatus()}`}>
                {calculateStatus().toUpperCase()}
              </span>
            </div>
            {editedRecord.inTime && editedRecord.outTime && (
              <div className="EmppAttendence-info-item">
                <span>Hours Worked:</span>
                <span>
                  {(() => {
                    const [inHour, inMinute] = editedRecord.inTime.split(':').map(Number);
                    const [outHour, outMinute] = editedRecord.outTime.split(':').map(Number);
                    const totalMinutes = (outHour * 60 + outMinute) - (inHour * 60 + inMinute);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                  })()}
                </span>
              </div>
            )}
          </div>

          {showConfirmDelete && (
            <div className="EmppAttendence-confirm-delete">
              <FiAlertTriangle size={24} color="#ff6b6b" />
              <h4>Delete Attendance Record?</h4>
              <p>Are you sure you want to delete this attendance record? This action cannot be undone.</p>
              <div className="EmppAttendence-confirm-buttons">
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-outlined" 
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-danger" 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="EmppAttendence-modal-footer">
          <div className="EmppAttendence-footer-left">
            <button 
              className="EmppAttendence-btn EmppAttendence-btn-danger" 
              onClick={() => setShowConfirmDelete(true)}
              disabled={showConfirmDelete}
            >
              <FiTrash2 /> Delete Record
            </button>
          </div>
          <div className="EmppAttendence-footer-right">
            <button className="EmppAttendence-btn EmppAttendence-btn-outlined" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="EmppAttendence-btn EmppAttendence-btn-contained" 
              onClick={handleSave}
              disabled={loading || showConfirmDelete}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Edit Modal - UPDATED with full permissions
const QuickEditModal = ({ records, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('present');

  const handleSave = async () => {
    setLoading(true);
    try {
      const promises = records.map(record =>
        axios.put(`/attendance/${record._id}`, { status: status.toUpperCase() })
      );
      
      await Promise.all(promises);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error in quick edit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="EmppAttendence-modal-overlay" onClick={onClose}>
      <div className="EmppAttendence-modal-content EmppAttendence-quick-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="EmppAttendence-modal-header">
          <h3>Quick Edit {records.length} Records</h3>
          <button className="EmppAttendence-modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="EmppAttendence-modal-body">
          <div className="EmppAttendence-selected-count">
            <FiUsers size={20} />
            <span>{records.length} employee(s) selected</span>
          </div>

          <div className="EmppAttendence-status-selector">
            <h4>Set Status To:</h4>
            <div className="EmppAttendence-status-options">
              <button 
                className={`EmppAttendence-status-option ${status === 'present' ? 'EmppAttendence-selected' : ''}`}
                onClick={() => setStatus('present')}
              >
                <FiCheckCircle /> Present
              </button>
              <button 
                className={`EmppAttendence-status-option ${status === 'late' ? 'EmppAttendence-selected' : ''}`}
                onClick={() => setStatus('late')}
              >
                <FiClock /> Late
              </button>
              <button 
                className={`EmppAttendence-status-option ${status === 'halfday' ? 'EmppAttendence-selected' : ''}`}
                onClick={() => setStatus('halfday')}
              >
                <FiAlertCircle /> Half Day
              </button>
              <button 
                className={`EmppAttendence-status-option ${status === 'absent' ? 'EmppAttendence-selected' : ''}`}
                onClick={() => setStatus('absent')}
              >
                <FiUserX /> Absent
              </button>
            </div>
          </div>

          <div className="EmppAttendence-selected-employees">
            <h4>Affected Employees:</h4>
            <div className="EmppAttendence-employee-list">
              {records.slice(0, 5).map(record => (
                <div key={record._id} className="EmppAttendence-employee-item">
                  <div className="EmppAttendence-employee-avatar small">
                    {getInitials(record.user?.name)}
                  </div>
                  <span>{record.user?.name || 'Unknown'} - {record.user?.department || 'N/A'}</span>
                </div>
              ))}
              {records.length > 5 && (
                <div className="EmppAttendence-more-count">
                  +{records.length - 5} more employees
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="EmppAttendence-modal-footer">
          <button className="EmppAttendence-btn EmppAttendence-btn-outlined" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="EmppAttendence-btn EmppAttendence-btn-contained" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Updating...' : `Update to ${status.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const getStatusClass = (status) => {
  if (status === "present") return "EmppAttendence-status-present";
  if (status === "absent") return "EmppAttendence-status-absent";
  if (status === "halfday") return "EmppAttendence-status-halfday";
  if (status === "late") return "EmppAttendence-status-late";
  return "";
};

const getEmployeeTypeClass = (type) => {
  if (!type) return "";
  const typeLower = type.toLowerCase();
  if (typeLower.includes("full")) return "EmppAttendence-type-full-time";
  if (typeLower.includes("part")) return "EmppAttendence-type-part-time";
  if (typeLower.includes("contract")) return "EmppAttendence-type-contract";
  if (typeLower.includes("intern")) return "EmppAttendence-type-intern";
  return "";
};

const getRowClass = (status) => {
  if (status === "present") return "EmppAttendence-row-present";
  if (status === "absent") return "EmppAttendence-row-absent";
  if (status === "halfday") return "EmppAttendence-row-halfday";
  if (status === "late") return "EmppAttendence-row-late";
  return "";
};

const getStatusFilterLabel = (statusFilter) => {
  const labels = {
    all: "All Status",
    present: "PRESENT",
    late: "LATE",
    halfday: "HALF DAY",
    absent: "ABSENT",
    ontime: "ON TIME",
  };
  return labels[statusFilter] || String(statusFilter || "").toUpperCase();
};

const calculateHoursWorked = (inTime, outTime) => {
  if (!inTime || !outTime) return { hours: 0, formatted: "00:00:00" };
  
  const start = new Date(inTime);
  const end = new Date(outTime);
  const diffMs = end - start;
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  
  return {
    hours: diffMs / (1000 * 60 * 60),
    formatted: `${hours}:${minutes}:${seconds}`
  };
};

// Main Component
const EmployeeAttendance = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentsMap, setDepartmentsMap] = useState({});
  
  // Date states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEndDate, setSelectedEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRangeMode, setDateRangeMode] = useState(false);
  
  const [selectedEmployeeType, setSelectedEmployeeType] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    late: 0,
    onTime: 0,
  });
  
  // Date range stats
  const [dateRangeStats, setDateRangeStats] = useState({
    totalDays: 1,
    averagePresent: 0,
    averageLate: 0,
    averageHalfDay: 0,
    averageAbsent: 0,
    totalPresent: 0,
    totalLate: 0,
    totalHalfDay: 0,
    totalAbsent: 0,
    bestDay: null,
    worstDay: null
  });

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);

  // User Role Related States
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserDepartment, setCurrentUserDepartment] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState('');
  const [currentUserCompanyCode, setCurrentUserCompanyCode] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  
  // ✅ UPDATED: Everyone can edit attendance now
  const [canEditAttendance, setCanEditAttendance] = useState(true);
  const [canViewAllAttendance, setCanViewAllAttendance] = useState(true);

  const tableRef = useRef(null);
  const exportMenuRef = useRef(null);

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const initializeData = async () => {
      setPageLoading(true);
      setLoading(true);
      try {
        await fetchCurrentUserAndCompany();
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setTimeout(() => {
          setLoading(false);
          setInitialLoadComplete(true);
          setPageLoading(false);
        }, 500);
      }
    };
    
    initializeData();
  }, []);

  // Fetch users after user role is loaded
  useEffect(() => {
    if (currentUserCompanyId) {
      fetchAllUsers();
    }
  }, [currentUserCompanyId]);

  // Fetch attendance after users are loaded
  useEffect(() => {
    if (allUsers.length > 0 && currentUserCompanyId && initialLoadComplete) {
      if (dateRangeMode) {
        fetchAttendanceDataRange(selectedStartDate, selectedEndDate);
      } else {
        fetchAttendanceData(selectedDate);
      }
    }
  }, [selectedDate, selectedStartDate, selectedEndDate, dateRangeMode, allUsers, currentUserCompanyId, initialLoadComplete]);

  // Click outside handler for export menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ============================================
  // USER & PERMISSION FUNCTIONS
  // ============================================
  const fetchCurrentUserAndCompany = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log("⚠️ No user found in localStorage");
        return;
      }

      const user = JSON.parse(userStr);
      
      const userId = user._id || user.id || '';
      const companyId = user.company || user.companyId || '';
      const companyCode = user.companyCode || user.companyDetails?.companyCode || '';
      const department = user.department || '';
      const name = user.name || user.username || 'User';
      let role = '';
      
      if (user.companyRole) {
        role = user.companyRole;
      } else if (user.role) {
        role = user.role;
      }
      
      setCurrentUser(user);
      setCurrentUserId(userId);
      setCurrentUserCompanyId(companyId);
      setCurrentUserCompanyCode(companyCode);
      setCurrentUserDepartment(department);
      setCurrentUserName(name);
      setCurrentUserRole(role);
      
      // ✅ Everyone can edit attendance
      setCanEditAttendance(true);
      setCanViewAllAttendance(true);
      
    } catch (error) {
      console.error("Error parsing user data:", error);
      showSnackbar("Error loading user data", "error");
    }
  };

  // Fetch all users function
  const fetchAllUsers = async () => {
    try {
      console.log("🔄 Fetching all company users...");
      
      // Create a map for department IDs to names
      let deptMap = {};
      let departmentsList = [];
      
      try {
        const deptRes = await axios.get('/departments');
        
        if (deptRes.data && deptRes.data.success) {
          if (deptRes.data.data && Array.isArray(deptRes.data.data)) {
            departmentsList = deptRes.data.data;
          } else if (deptRes.data.departments && Array.isArray(deptRes.data.departments)) {
            departmentsList = deptRes.data.departments;
          } else if (Array.isArray(deptRes.data)) {
            departmentsList = deptRes.data;
          }
        }
        
        deptMap = departmentsList.reduce((acc, dept) => {
          if (dept._id) {
            acc[dept._id] = dept.name;
          }
          if (dept.id) {
            acc[dept.id] = dept.name;
          }
          return acc;
        }, {});
        
        setDepartments(departmentsList);
        setDepartmentsMap(deptMap);
        console.log("✅ Departments loaded:", deptMap);
      } catch (deptErr) {
        console.error("❌ Failed to load departments", deptErr);
      }
      
      // Fetch all company users
      const res = await axios.get('/users/company-users');
      
      let usersData = [];
      
      if (res.data && res.data.success) {
        if (res.data.message && res.data.message.users && Array.isArray(res.data.message.users)) {
          usersData = res.data.message.users;
        }
        else if (res.data.users && Array.isArray(res.data.users)) {
          usersData = res.data.users;
        }
        else if (res.data.message && Array.isArray(res.data.message)) {
          usersData = res.data.message;
        }
        else if (res.data.data && Array.isArray(res.data.data)) {
          usersData = res.data.data;
        }
        else if (Array.isArray(res.data)) {
          usersData = res.data;
        }
      }
      
      const usersWithDepartment = usersData.map(user => {
        let deptId = null;
        let deptName = "Unassigned";
        
        if (user.department) {
          if (typeof user.department === "object") {
            deptId = user.department._id || user.department.id;
            deptName = user.department.name || "Unassigned";
          } else {
            deptId = user.department;
            deptName = deptMap[user.department] || user.departmentName || "Unassigned";
          }
        } else if (user.departmentId) {
          deptId = user.departmentId;
          deptName = deptMap[user.departmentId] || "Unassigned";
        } else if (user.department_name) {
          deptName = user.department_name;
        }
        
        return {
          id: user.id || user._id,
          _id: user.id || user._id,
          name: user.name,
          email: user.email,
          employeeType: user.employeeType || user.employmentType || 'full-time',
          departmentId: deptId,
          department: deptName,
          jobRole: user.jobRole || user.position || user.designation
        };
      });
      
      setAllUsers(usersWithDepartment);
      console.log("✅ Users loaded:", usersWithDepartment.length);
      
    } catch (err) {
      console.error("❌ Failed to load users", err);
      showSnackbar("Error loading users data", "error");
    }
  };

  const calculateStatusFromTime = (inTime) => {
    if (!inTime) return "absent";
    
    const loginTime = new Date(inTime);
    const loginHour = loginTime.getHours();
    const loginMinute = loginTime.getMinutes();
    const totalMinutes = (loginHour * 60) + loginMinute;
    
    if (totalMinutes >= 600) return "halfday";
    if (totalMinutes >= 550 && totalMinutes < 570) return "late";
    if (totalMinutes >= 570) return "halfday";
    return "present";
  };

  // ============================================
  // FETCH ATTENDANCE DATA (SINGLE DAY)
  // ============================================
  const fetchAttendanceData = async (date) => {
    setLoading(true);
    try {
      const formatted = date;
      console.log("📅 Fetching attendance for date:", formatted);
      
      const res = await axios.get(`/attendance/all?date=${formatted}`);
      
      const attendanceMap = {};
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        res.data.data.forEach(record => {
          if (record.user && (record.user._id || record.user.id)) {
            const userId = record.user._id || record.user.id;
            attendanceMap[userId] = {
              ...record,
              status: record.status ? record.status.toLowerCase() : 'absent'
            };
          }
        });
      }

      const combinedRecords = allUsers.map(user => {
        const userId = user.id || user._id;
        const attendanceRecord = attendanceMap[userId];
        
        if (attendanceRecord) {
          const calculatedStatus = calculateStatusFromTime(attendanceRecord.inTime);
          const hoursWorked = calculateHoursWorked(attendanceRecord.inTime, attendanceRecord.outTime);
          
          let finalStatus = attendanceRecord.status 
            ? attendanceRecord.status.toLowerCase() 
            : calculatedStatus;

          if (
            finalStatus === 'present' &&
            hoursWorked.hours > 0 &&
            hoursWorked.hours < 9
          ) {
            finalStatus = hoursWorked.hours >= 5 ? 'halfday' : 'absent';
          }
          
          return {
            ...attendanceRecord,
            user: {
              id: user.id || user._id,
              _id: user.id || user._id,
              name: user.name,
              email: user.email,
              employeeType: user.employeeType || 'full-time',
              department: user.department,
              departmentId: user.departmentId,
              jobRole: user.jobRole
            },
            status: finalStatus,
            calculatedStatus: calculatedStatus,
            hoursWorked: hoursWorked.formatted,
            totalHours: hoursWorked.hours,
            displayDate: formatted
          };
        } else {
          return {
            _id: `absent_${userId}_${date}`,
            user: {
              id: user.id || user._id,
              _id: user.id || user._id,
              name: user.name,
              email: user.email,
              employeeType: user.employeeType || 'full-time',
              department: user.department,
              departmentId: user.departmentId,
              jobRole: user.jobRole
            },
            date: new Date(date),
            inTime: null,
            outTime: null,
            hoursWorked: "00:00:00",
            totalHours: 0,
            lateBy: "00:00:00",
            earlyLeave: "00:00:00",
            overTime: "00:00:00",
            status: "absent",
            calculatedStatus: "absent",
            isClockedIn: false,
            displayDate: formatted
          };
        }
      });
      
      setRecords(combinedRecords);
      calculateStats(combinedRecords);
      
    } catch (err) {
      console.error("❌ Failed to load attendance", err);
      showSnackbar("Error loading attendance data", "error");
      setRecords([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FETCH ATTENDANCE DATA (DATE RANGE)
  // ============================================
  const fetchAttendanceDataRange = async (startDate, endDate) => {
    setLoading(true);
    try {
      console.log("📅 Fetching attendance from", startDate, "to", endDate);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateRange = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d).toISOString().split('T')[0]);
      }
      
      const allRecords = [];
      const dailyStats = {};
      
      const fetchPromises = dateRange.map(async (date) => {
        try {
          const res = await axios.get(`/attendance/all?date=${date}`);
          return { date, data: res.data };
        } catch (error) {
          console.error(`Error fetching attendance for ${date}:`, error);
          return { date, data: null };
        }
      });
      
      const results = await Promise.all(fetchPromises);
      
      results.forEach(({ date, data }) => {
        const attendanceMap = {};
        
        if (data && data.data && Array.isArray(data.data)) {
          data.data.forEach(record => {
            if (record.user && (record.user._id || record.user.id)) {
              const userId = record.user._id || record.user.id;
              attendanceMap[userId] = {
                ...record,
                status: record.status ? record.status.toLowerCase() : 'absent'
              };
            }
          });
        }

        const dateCombinedRecords = allUsers.map(user => {
          const userId = user.id || user._id;
          const attendanceRecord = attendanceMap[userId];
          
          if (attendanceRecord) {
            const calculatedStatus = calculateStatusFromTime(attendanceRecord.inTime);
            const hoursWorked = calculateHoursWorked(attendanceRecord.inTime, attendanceRecord.outTime);
            
            let finalStatus = attendanceRecord.status 
              ? attendanceRecord.status.toLowerCase() 
              : calculatedStatus;

            if (
              finalStatus === 'present' &&
              hoursWorked.hours > 0 &&
              hoursWorked.hours < 9
            ) {
              finalStatus = hoursWorked.hours >= 5 ? 'halfday' : 'absent';
            }
            
            return {
              ...attendanceRecord,
              user: {
                id: user.id || user._id,
                _id: user.id || user._id,
                name: user.name,
                email: user.email,
                employeeType: user.employeeType || 'full-time',
                department: user.department,
                departmentId: user.departmentId,
                jobRole: user.jobRole
              },
              status: finalStatus,
              calculatedStatus: calculatedStatus,
              hoursWorked: hoursWorked.formatted,
              totalHours: hoursWorked.hours,
              displayDate: date
            };
          } else {
            return {
              _id: `absent_${userId}_${date}`,
              user: {
                id: user.id || user._id,
                _id: user.id || user._id,
                name: user.name,
                email: user.email,
                employeeType: user.employeeType || 'full-time',
                department: user.department,
                departmentId: user.departmentId,
                jobRole: user.jobRole
              },
              date: new Date(date),
              inTime: null,
              outTime: null,
              hoursWorked: "00:00:00",
              totalHours: 0,
              lateBy: "00:00:00",
              earlyLeave: "00:00:00",
              overTime: "00:00:00",
              status: "absent",
              calculatedStatus: "absent",
              isClockedIn: false,
              displayDate: date
            };
          }
        });
        
        allRecords.push(...dateCombinedRecords);
        
        const present = dateCombinedRecords.filter(r => r.status === "present").length;
        const absent = dateCombinedRecords.filter(r => r.status === "absent").length;
        const halfDay = dateCombinedRecords.filter(r => r.status === "halfday").length;
        const late = dateCombinedRecords.filter(r => r.status === "late").length;
        
        dailyStats[date] = {
          total: dateCombinedRecords.length,
          present,
          absent,
          halfDay,
          late,
          attendanceRate: ((present + late + halfDay) / dateCombinedRecords.length * 100).toFixed(1)
        };
      });
      
      setRecords(allRecords);
      
      const totalDays = dateRange.length;
      const totalPresent = allRecords.filter(r => r.status === "present").length;
      const totalLate = allRecords.filter(r => r.status === "late").length;
      const totalHalfDay = allRecords.filter(r => r.status === "halfday").length;
      const totalAbsent = allRecords.filter(r => r.status === "absent").length;
      
      const avgEmployeesPerDay = allUsers.length || 1;
      
      let bestDay = null;
      let worstDay = null;
      let bestRate = 0;
      let worstRate = 100;
      
      Object.entries(dailyStats).forEach(([date, stats]) => {
        const rate = parseFloat(stats.attendanceRate);
        if (rate > bestRate) {
          bestRate = rate;
          bestDay = date;
        }
        if (rate < worstRate) {
          worstRate = rate;
          worstDay = date;
        }
      });
      
      setDateRangeStats({
        totalDays,
        averagePresent: totalDays > 0 ? (totalPresent / totalDays / avgEmployeesPerDay * 100).toFixed(1) : 0,
        averageLate: totalDays > 0 ? (totalLate / totalDays / avgEmployeesPerDay * 100).toFixed(1) : 0,
        averageHalfDay: totalDays > 0 ? (totalHalfDay / totalDays / avgEmployeesPerDay * 100).toFixed(1) : 0,
        averageAbsent: totalDays > 0 ? (totalAbsent / totalDays / avgEmployeesPerDay * 100).toFixed(1) : 0,
        totalPresent,
        totalLate,
        totalHalfDay,
        totalAbsent,
        bestDay,
        worstDay
      });
      
      calculateStats(allRecords);
      
    } catch (err) {
      console.error("❌ Failed to load attendance range", err);
      showSnackbar("Error loading attendance data", "error");
      setRecords([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendanceData) => {
    const present = attendanceData.filter((r) => r.status === "present").length;
    const absent = attendanceData.filter((r) => r.status === "absent").length;
    const halfDay = attendanceData.filter((r) => r.status === "halfday").length;
    const late = attendanceData.filter((r) => r.status === "late").length;
    const onTime = attendanceData.filter((r) => r.calculatedStatus === "present").length;
    
    setStats({
      total: attendanceData.length,
      present,
      absent,
      halfDay,
      late,
      onTime,
    });
  };

  // ============================================
  // HANDLE DATE RANGE
  // ============================================
  const handleDateRangeApply = () => {
    if (selectedStartDate && selectedEndDate) {
      if (new Date(selectedStartDate) > new Date(selectedEndDate)) {
        showSnackbar("Start date cannot be after end date", "error");
        return;
      }
      setDateRangeMode(true);
      fetchAttendanceDataRange(selectedStartDate, selectedEndDate);
    }
  };

  const handleDateRangeClear = () => {
    setDateRangeMode(false);
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setSelectedStartDate(today);
    setSelectedEndDate(today);
    fetchAttendanceData(today);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSelectedEmployeeType("all");
    setSelectedDepartment("all");
    setSearchTerm("");
    handleDateRangeClear();
  };

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 4000);
  };

  // ============================================
  // FILTERED RECORDS
  // ============================================
  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (selectedEmployeeType !== "all") {
      filtered = filtered.filter(
        (rec) =>
          rec.user?.employeeType &&
          rec.user.employeeType.toLowerCase() ===
            selectedEmployeeType.toLowerCase()
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (rec) => rec.user?.department === selectedDepartment
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((rec) => {
        if (statusFilter === "ontime") {
          return rec.calculatedStatus === "present";
        }
        return rec.status === statusFilter;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (rec) =>
          rec.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.user?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const dateA = a.displayDate || (a.date ? new Date(a.date).toISOString().split('T')[0] : '');
      const dateB = b.displayDate || (b.date ? new Date(b.date).toISOString().split('T')[0] : '');
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      
      const deptA = a.user?.department || 'Unassigned';
      const deptB = b.user?.department || 'Unassigned';
      if (deptA < deptB) return -1;
      if (deptA > deptB) return 1;
      
      const nameA = a.user?.name || '';
      const nameB = b.user?.name || '';
      return nameA.localeCompare(nameB);
    });

    return filtered;
  }, [records, selectedEmployeeType, selectedDepartment, searchTerm, statusFilter]);

  // ============================================
  // GROUP RECORDS BY DATE (for date range mode)
  // ============================================
  const groupedByDate = useMemo(() => {
    if (!dateRangeMode) return null;
    
    return filteredRecords.reduce((acc, record) => {
      const dateKey = record.displayDate || (record.date ? new Date(record.date).toISOString().split('T')[0] : 'unknown');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
    }, {});
  }, [filteredRecords, dateRangeMode]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    return new Date(timeStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLoginTimeCategory = (inTime) => {
    if (!inTime) return "No Login";
    
    const loginTime = new Date(inTime);
    const hour = loginTime.getHours();
    const minute = loginTime.getMinutes();
    const totalMinutes = (hour * 60) + minute;
    
    if (totalMinutes >= 600) return "After 10:00 AM";
    if (totalMinutes >= 570) return "9:30 AM - 10:00 AM";
    if (totalMinutes >= 550) return "9:10 AM - 9:30 AM (LATE)";
    return "Before 9:10 AM";
  };

  const formatExportDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  };

  const handleAddRecord = () => {
    setAddModalOpen(true);
  };

  const handleSaveRecord = async (recordId, updatedData) => {
    try {
      setLoading(true);
      
      if (recordId.startsWith('absent_')) {
        const parts = recordId.split('_');
        const userId = parts[1];
        const date = parts[2];

        await axios.post('/attendance/manual', {
          user: userId,
          date: date,
          ...updatedData
        });
      } else {
        await axios.put(`/attendance/${recordId}`, updatedData);
      }
      
      showSnackbar("Attendance record saved successfully!", "success");
      
      if (dateRangeMode) {
        fetchAttendanceDataRange(selectedStartDate, selectedEndDate);
      } else {
        fetchAttendanceData(selectedDate);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      showSnackbar("Failed to save attendance record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewRecord = async (data) => {
    try {
      setLoading(true);
      await axios.post('/attendance/manual', data);
      
      showSnackbar("Attendance record added successfully!", "success");
      
      if (dateRangeMode) {
        fetchAttendanceDataRange(selectedStartDate, selectedEndDate);
      } else {
        fetchAttendanceData(selectedDate);
      }
    } catch (error) {
      console.error("Error adding attendance:", error);
      showSnackbar("Failed to add attendance record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      setLoading(true);
      
      if (recordId.startsWith('absent_')) {
        showSnackbar("Cannot delete absent record - it doesn't exist in database", "warning");
        setEditModalOpen(false);
        return;
      }
      
      await axios.delete(`/attendance/${recordId}`);
      
      showSnackbar("Attendance record deleted successfully!", "success");
      
      if (dateRangeMode) {
        fetchAttendanceDataRange(selectedStartDate, selectedEndDate);
      } else {
        fetchAttendanceData(selectedDate);
      }
      
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error deleting attendance:", error);
      showSnackbar("Failed to delete attendance record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedRecords.length === 0) {
      showSnackbar("Please select records to update", "warning");
      return;
    }

    try {
      setLoading(true);
      const promises = selectedRecords.map(recordId =>
        axios.put(`/attendance/${recordId}`, { status: status.toUpperCase() })
      );
      
      await Promise.all(promises);
      
      showSnackbar(`Updated ${selectedRecords.length} record(s) to ${status}`, "success");
      setSelectedRecords([]);
      setBulkEditMode(false);
      
      if (dateRangeMode) {
        fetchAttendanceDataRange(selectedStartDate, selectedEndDate);
      } else {
        fetchAttendanceData(selectedDate);
      }
    } catch (error) {
      console.error("Error in bulk update:", error);
      showSnackbar("Failed to update records", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const selectAllRecords = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(record => record._id));
    }
  };

  const handleQuickEdit = () => {
    if (selectedRecords.length === 0) {
      showSnackbar("Please select records to edit", "warning");
      return;
    }
    setQuickEditModalOpen(true);
  };

  const handleQuickEditSave = () => {
    showSnackbar(`Updated ${selectedRecords.length} records`, "success");
    setSelectedRecords([]);
    setBulkEditMode(false);
    
    if (dateRangeMode) {
      fetchAttendanceDataRange(selectedStartDate, selectedEndDate);
    } else {
      fetchAttendanceData(selectedDate);
    }
  };

  // Export functions
  const exportToPDF = async () => {
    setExportMenuOpen(false);
    setLoading(true);

    try {
      const input = tableRef.current;
      input.classList.add("EmppAttendence-pdf-export");

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: input.scrollWidth,
        height: input.scrollHeight,
      });

      input.classList.remove("EmppAttendence-pdf-export");

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("landscape", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.setFontSize(16);
      pdf.text(
        dateRangeMode 
          ? `Attendance Report - ${new Date(selectedStartDate).toLocaleDateString()} to ${new Date(selectedEndDate).toLocaleDateString()}`
          : `Attendance Report - ${formatExportDate(selectedDate)}`,
        pdfWidth / 2,
        8,
        { align: "center" }
      );

      pdf.setFontSize(10);
      pdf.text(
        `Total: ${stats.total} | Present: ${stats.present} | Late: ${stats.late} | Half Day: ${stats.halfDay} | Absent: ${stats.absent}`,
        margin,
        15
      );

      position = 20;

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - heightLeft;

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          position,
          imgWidth,
          imgHeight
        );

        heightLeft -= usableHeight;
      }

      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pdfWidth - 20,
          pdfHeight - 8
        );
      }

      pdf.save(dateRangeMode 
        ? `attendance_report_${selectedStartDate}_to_${selectedEndDate}.pdf`
        : `attendance_report_${selectedDate}.pdf`
      );
      showSnackbar("Attendance PDF exported successfully!", "success");
    } catch (error) {
      console.error("PDF Export Error:", error);
      showSnackbar("Failed to export PDF", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToImage = async () => {
    setExportMenuOpen(false);
    setLoading(true);
    
    try {
      const input = tableRef.current;
      input.classList.add('EmppAttendence-image-export');
      
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: input.scrollWidth,
        height: input.scrollHeight,
      });
      
      input.classList.remove('EmppAttendence-image-export');
      
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.download = dateRangeMode 
        ? `attendance_report_${selectedStartDate}_to_${selectedEndDate}.jpg`
        : `attendance_report_${selectedDate}.jpg`;
      link.href = image;
      link.click();
      
      showSnackbar("Image exported successfully!", "success");
    } catch (error) {
      console.error("Error exporting to image:", error);
      showSnackbar("Error exporting image", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    setExportMenuOpen(false);
    
    const excelData = filteredRecords.map(record => ({
      'Date': record.displayDate || formatDate(record.date),
      'Department': record.user?.department || 'Unassigned',
      'Employee ID': record.user?.id || record.user?._id || 'N/A',
      'Name': record.user?.name || 'N/A',
      'Email': record.user?.email || 'N/A',
      'Employee Type': record.user?.employeeType?.toUpperCase() || 'N/A',
      'Check In': formatTime(record.inTime),
      'Check Out': formatTime(record.outTime),
      'Hours Worked': record.hoursWorked || '00:00:00',
      'Status': record.status.toUpperCase(),
      'Late By': record.lateBy || '00:00:00',
      'Early Leave': record.earlyLeave || '00:00:00',
      'Overtime': record.overTime || '00:00:00',
      'Total Hours': record.totalHours?.toFixed(2) || '0.00'
    }));

    const summaryRows = [
      {},
      { 'Date': 'SUMMARY REPORT' },
      { 'Date': 'Total Employees', 'Name': stats.total },
      { 'Date': 'Present', 'Name': stats.present },
      { 'Date': 'Late', 'Name': stats.late },
      { 'Date': 'Half Day', 'Name': stats.halfDay },
      { 'Date': 'Absent', 'Name': stats.absent },
      { 'Date': 'On Time', 'Name': stats.onTime },
      { 'Date': dateRangeMode ? 'Period' : 'Report Date', 'Name': dateRangeMode 
        ? `${new Date(selectedStartDate).toLocaleDateString()} - ${new Date(selectedEndDate).toLocaleDateString()}`
        : formatExportDate(selectedDate) }
    ];

    if (dateRangeMode) {
      summaryRows.push(
        { 'Date': 'Total Days', 'Name': dateRangeStats.totalDays },
        { 'Date': 'Avg Present %', 'Name': `${dateRangeStats.averagePresent}%` },
        { 'Date': 'Avg Late %', 'Name': `${dateRangeStats.averageLate}%` },
        { 'Date': 'Best Day', 'Name': dateRangeStats.bestDay ? new Date(dateRangeStats.bestDay).toLocaleDateString() : 'N/A' },
        { 'Date': 'Worst Day', 'Name': dateRangeStats.worstDay ? new Date(dateRangeStats.worstDay).toLocaleDateString() : 'N/A' }
      );
    }

    const allData = [...excelData, ...summaryRows];
    
    const worksheet = XLSX.utils.json_to_sheet(allData, {
      header: ['Date', 'Department', 'Employee ID', 'Name', 'Email', 'Employee Type', 'Check In', 'Check Out', 
               'Hours Worked', 'Status', 'Late By', 'Early Leave', 'Overtime', 'Total Hours']
    });
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    
    XLSX.writeFile(workbook, dateRangeMode 
      ? `attendance_report_${selectedStartDate}_to_${selectedEndDate}.xlsx`
      : `attendance_report_${selectedDate}.xlsx`
    );
    showSnackbar("Excel file exported successfully!", "success");
  };

  const exportToCSV = () => {
    setExportMenuOpen(false);
    
    const headers = ['Date', 'Department', 'Employee Name', 'Email', 'Employee Type', 'Check In', 'Check Out', 
                     'Hours Worked', 'Status', 'Late By', 'Early Leave', 'Overtime'];
    
    const csvData = filteredRecords.map(record => [
      record.displayDate || formatDate(record.date),
      record.user?.department || 'Unassigned',
      record.user?.name || 'N/A',
      record.user?.email || 'N/A',
      record.user?.employeeType?.toUpperCase() || 'N/A',
      formatTime(record.inTime),
      formatTime(record.outTime),
      record.hoursWorked || '00:00:00',
      record.status.toUpperCase(),
      record.lateBy || '00:00:00',
      record.earlyLeave || '00:00:00',
      record.overTime || '00:00:00'
    ]);
    
    csvData.push([]);
    csvData.push(['SUMMARY REPORT']);
    csvData.push(['Total Employees', stats.total]);
    csvData.push(['Present', stats.present]);
    csvData.push(['Late', stats.late]);
    csvData.push(['Half Day', stats.halfDay]);
    csvData.push(['Absent', stats.absent]);
    csvData.push(['On Time', stats.onTime]);
    csvData.push([dateRangeMode ? 'Period' : 'Report Date', dateRangeMode 
      ? `${new Date(selectedStartDate).toLocaleDateString()} - ${new Date(selectedEndDate).toLocaleDateString()}`
      : formatExportDate(selectedDate)]);
    
    if (dateRangeMode) {
      csvData.push(['Total Days', dateRangeStats.totalDays]);
      csvData.push(['Avg Present %', `${dateRangeStats.averagePresent}%`]);
      csvData.push(['Avg Late %', `${dateRangeStats.averageLate}%`]);
      csvData.push(['Best Day', dateRangeStats.bestDay ? new Date(dateRangeStats.bestDay).toLocaleDateString() : 'N/A']);
      csvData.push(['Worst Day', dateRangeStats.worstDay ? new Date(dateRangeStats.worstDay).toLocaleDateString() : 'N/A']);
    }
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', dateRangeMode 
      ? `attendance_report_${selectedStartDate}_to_${selectedEndDate}.csv`
      : `attendance_report_${selectedDate}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const normalizeRole = (role) => {
    if (!role) return 'Employee';
    const r = role.toLowerCase();
    if (r === 'hr') return 'HR Manager';
    if (r === 'admin') return 'Administrator';
    if (r === 'superadmin') return 'Super Admin';
    if (r === 'manager') return 'Team Manager';
    if (r === 'owner') return 'Company Owner';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const RoleBadge = () => {
    if (!currentUserRole) return null;
    
    let badgeClass = 'EmppAttendence-role-badge';
    let icon = <FiUsers size={12} />;
    
    const roleLower = currentUserRole.toLowerCase();
    if (roleLower === 'owner') {
      badgeClass += ' EmppAttendence-role-badge-owner';
      icon = <FiShield size={12} />;
    } else if (roleLower === 'admin') {
      badgeClass += ' EmppAttendence-role-badge-admin';
      icon = <FiShield size={12} />;
    } else if (roleLower === 'hr') {
      badgeClass += ' EmppAttendence-role-badge-hr';
    } else if (roleLower === 'manager') {
      badgeClass += ' EmppAttendence-role-badge-manager';
    }
    
    return (
      <span className={badgeClass}>
        {icon}
        {normalizeRole(currentUserRole)}
      </span>
    );
  };

  // Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  // Loading State
  if (loading && !initialLoadComplete) {
    return (
      <div className="EmppAttendence-loading-container">
        <div className="EmppAttendence-loading-progress">
          <div className="EmppAttendence-loading-progress-bar"></div>
        </div>
        <p>Loading attendance data...</p>
        {currentUserRole && (
          <span className="EmppAttendence-loading-role">Role: {normalizeRole(currentUserRole)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="EmppAttendence-employee-attendance">
      {/* Header */}
      <div className="EmppAttendence-attendance-header">
        <div>
          <h1 className="EmppAttendence-attendance-title">Attendance Management</h1>
          <p className="EmppAttendence-attendance-subtitle">
            Monitor and manage employee attendance
            <RoleBadge />
            
          </p>
          <div className="EmppAttendence-timing-rules">
            <span className="EmppAttendence-rule-item"><FiCheckCircle /> Before 9:10 AM → PRESENT</span>
            <span className="EmppAttendence-rule-item"><FiAlertTriangle /> 9:10 AM - 9:30 AM → LATE</span>
            <span className="EmppAttendence-rule-item"><FiAlertCircle /> 9:30 AM - 10:00 AM → HALF DAY</span>
            <span className="EmppAttendence-rule-item"><FiUserX /> After 10:00 AM → HALF DAY / No Login → ABSENT</span>
          </div>
          
          {dateRangeMode && (
            <div className="EmppAttendence-date-range-indicator">
              <FiRangeCalendar size={16} />
              <span>Viewing from <strong>{new Date(selectedStartDate).toLocaleDateString()}</strong> to <strong>{new Date(selectedEndDate).toLocaleDateString()}</strong></span>
              <button className="EmppAttendence-btn-icon-small" onClick={handleDateRangeClear} >
                <FiX size={14} />
              </button>
            </div>
          )}
          
          {bulkEditMode && selectedRecords.length > 0 && (
            <div className="EmppAttendence-bulk-actions-bar">
              <span className="EmppAttendence-bulk-selection-count">
                <FiUsers size={16} />
                {selectedRecords.length} record(s) selected
              </span>
              <div className="EmppAttendence-bulk-action-buttons">
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-outlined EmppAttendence-btn-sm"
                  onClick={() => handleBulkStatusChange('present')}
                >
                  Mark as Present
                </button>
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-outlined EmppAttendence-btn-sm"
                  onClick={() => handleBulkStatusChange('late')}
                >
                  Mark as Late
                </button>
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-outlined EmppAttendence-btn-sm"
                  onClick={() => handleBulkStatusChange('halfday')}
                >
                  Mark as Half Day
                </button>
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-outlined EmppAttendence-btn-sm"
                  onClick={() => handleBulkStatusChange('absent')}
                >
                  Mark as Absent
                </button>
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-contained EmppAttendence-btn-sm"
                  onClick={handleQuickEdit}
                >
                  <FiEdit /> Quick Edit
                </button>
                <button 
                  className="EmppAttendence-btn EmppAttendence-btn-outlined EmppAttendence-btn-sm"
                  onClick={() => {
                    setSelectedRecords([]);
                    setBulkEditMode(false);
                  }}
                >
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="EmppAttendence-header-actions">
          <button
            className="EmppAttendence-date-chip"
            onClick={handleAddRecord}
            title="Add Attendance Record"
            style={{ marginRight: '8px' }}
          >
            <FiPlus size={16} />
            <span>Add Attendance</span>
          </button>

          {/* Export Button */}
          <div className="EmppAttendence-export-container" ref={exportMenuRef}>
            <button
              className="EmppAttendence-date-chip"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              title="Export Report"
              disabled={loading}
            >
              <FiDownload size={16} />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="EmppAttendence-export-dropdown">
                <button className="EmppAttendence-export-option" onClick={exportToExcel}>
                  <FiFileText size={16} />
                  <span>Export as Excel (XLSX)</span>
                </button>

                <button className="EmppAttendence-export-option" onClick={exportToCSV}>
                  <FiFileText size={16} />
                  <span>Export as CSV</span>
                </button>

                <button className="EmppAttendence-export-option" onClick={exportToPDF}>
                  <FiFileText size={16} />
                  <span>Export as PDF</span>
                </button>

                <button className="EmppAttendence-export-option" onClick={exportToImage}>
                  <FiImage size={16} />
                  <span>Export as Image</span>
                </button>
              </div>
            )}
          </div>

          <div className="EmppAttendence-date-chip">
            <FiCalendar size={16} />
            {dateRangeMode 
              ? `${new Date(selectedStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(selectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
            }
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="EmppAttendence-filter-section">
        <div className="EmppAttendence-filter-header">
          <FiFilter size={20} color="#1976d2" />
          <h3>Filters & Search</h3>
        </div>
        
        <div className="EmppAttendence-filter-grid">
          {/* Date Range Filter */}
          <div className="EmppAttendence-filter-group EmppAttendence-full-width">
            <label className="EmppAttendence-filter-label">Date Range</label>
            <DateRangeFilter
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              onStartDateChange={setSelectedStartDate}
              onEndDateChange={setSelectedEndDate}
              onApply={handleDateRangeApply}
              onClear={handleDateRangeClear}
            />
          </div>
          
          <div className="EmppAttendence-filter-group">
            <label className="EmppAttendence-filter-label">Department</label>
            <DepartmentFilter
              selected={selectedDepartment}
              onChange={setSelectedDepartment}
              departments={departments}
            />
          </div>

          <div className="EmppAttendence-filter-group">
            <label className="EmppAttendence-filter-label">Status</label>
            <StatusFilter
              selected={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          
          <div className="EmppAttendence-filter-group">
            <label className="EmppAttendence-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <FiSearch 
                size={18} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666'
                }}
              />
              <input
                type="text"
                className="EmppAttendence-filter-input"
                placeholder="Search by name, email, department or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>
          
          <div className="EmppAttendence-filter-actions">
            <button 
              className="EmppAttendence-btn EmppAttendence-btn-outlined"
              onClick={clearFilters}
              disabled={loading}
            >
              Clear Filters
            </button>
            <button 
              className="EmppAttendence-btn EmppAttendence-btn-contained"
              onClick={() => dateRangeMode 
                ? fetchAttendanceDataRange(selectedStartDate, selectedEndDate)
                : fetchAttendanceData(selectedDate)
              }
              disabled={loading}
            >
              {loading ? <FiRefreshCw className="EmppAttendence-spin" /> : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="EmppAttendence-stats-container">
        {[
          { 
            label: "Total Employees", 
            filterValue: "all",
            count: stats.total, 
            icon: <FiUsers />,
            description: dateRangeMode ? `Across ${dateRangeStats.totalDays} days` : "Total tracked employees",
            statClass: "EmppAttendence-stat-card-primary",
            iconClass: "EmppAttendence-stat-icon-primary"
          },
          { 
            label: "Present", 
            filterValue: "present",
            count: stats.present, 
            icon: <FiCheckCircle />,
            description: dateRangeMode ? `Avg: ${dateRangeStats.averagePresent}%` : "Before 9:10 AM",
            statClass: "EmppAttendence-stat-card-success",
            iconClass: "EmppAttendence-stat-icon-success"
          },
          { 
            label: "Late", 
            filterValue: "late",
            count: stats.late, 
            icon: <FiClock />,
            description: dateRangeMode ? `Avg: ${dateRangeStats.averageLate}%` : "9:10 AM - 9:30 AM",
            statClass: "EmppAttendence-stat-card-warning",
            iconClass: "EmppAttendence-stat-icon-warning"
          },
          { 
            label: "Half Day", 
            filterValue: "halfday",
            count: stats.halfDay, 
            icon: <FiAlertCircle />,
            description: dateRangeMode ? `Avg: ${dateRangeStats.averageHalfDay}%` : "After 9:30 AM",
            statClass: "EmppAttendence-stat-card-info",
            iconClass: "EmppAttendence-stat-icon-info"
          },
          { 
            label: "Absent", 
            filterValue: "absent",
            count: stats.absent, 
            icon: <FiUserX />,
            description: dateRangeMode ? `Avg: ${dateRangeStats.averageAbsent}%` : "No login recorded",
            statClass: "EmppAttendence-stat-card-error",
            iconClass: "EmppAttendence-stat-icon-error"
          },
          { 
            label: "On Time", 
            filterValue: "ontime",
            count: stats.onTime, 
            icon: <FiUserCheck />,
            description: "Arrived before 9:10 AM",
            statClass: "EmppAttendence-stat-card-secondary",
            iconClass: "EmppAttendence-stat-icon-secondary"
          },
        ]
          .filter(stat => stat.count > 0)
          .map((stat) => (
            <div 
              key={stat.label}
              className={`EmppAttendence-stat-card ${stat.statClass} ${statusFilter === stat.filterValue ? 'EmppAttendence-stat-card-active' : ''}`}
              onClick={() =>
                setStatusFilter((prev) =>
                  prev === stat.filterValue ? "all" : stat.filterValue
                )
              }
              style={{ cursor: 'pointer' }}
            >
              <div className="EmppAttendence-stat-content">
                <div className={`EmppAttendence-stat-icon ${stat.iconClass}`}>
                  {stat.icon}
                </div>
                <div className="EmppAttendence-stat-info">
                  <div className="EmppAttendence-stat-value">{stat.count}</div>
                  <div className="EmppAttendence-stat-label">{stat.label}</div>
                  <div className="EmppAttendence-stat-description">{stat.description}</div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Date Range Summary */}
      {dateRangeMode && (
        <div className="EmppAttendence-date-range-summary">
          <div className="EmppAttendence-summary-cards">
            <div className="EmppAttendence-summary-card">
              <div className="EmppAttendence-summary-card-icon">📊</div>
              <div className="EmppAttendence-summary-card-content">
                <span className="EmppAttendence-summary-card-label">Total Days</span>
                <span className="EmppAttendence-summary-card-value">{dateRangeStats.totalDays}</span>
              </div>
            </div>
            <div className="EmppAttendence-summary-card">
              <div className="EmppAttendence-summary-card-icon">📈</div>
              <div className="EmppAttendence-summary-card-content">
                <span className="EmppAttendence-summary-card-label">Best Day</span>
                <span className="EmppAttendence-summary-card-value">
                  {dateRangeStats.bestDay ? new Date(dateRangeStats.bestDay).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="EmppAttendence-summary-card">
              <div className="EmppAttendence-summary-card-icon">📉</div>
              <div className="EmppAttendence-summary-card-content">
                <span className="EmppAttendence-summary-card-label">Worst Day</span>
                <span className="EmppAttendence-summary-card-value">
                  {dateRangeStats.worstDay ? new Date(dateRangeStats.worstDay).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="EmppAttendence-summary-card">
              <div className="EmppAttendence-summary-card-icon">✅</div>
              <div className="EmppAttendence-summary-card-content">
                <span className="EmppAttendence-summary-card-label">Total Present</span>
                <span className="EmppAttendence-summary-card-value">{dateRangeStats.totalPresent}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="EmppAttendence-attendance-table-container" ref={tableRef}>
        <div className="EmppAttendence-table-header">
          <div>
            <h3 className="EmppAttendence-table-title">
              {dateRangeMode ? 'Attendance Records by Date' : 'Attendance Records by Department'}
            </h3>
            <div className="EmppAttendence-table-count">
              {filteredRecords.length} records found • 
              <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                {dateRangeMode 
                  ? `Period: ${new Date(selectedStartDate).toLocaleDateString()} - ${new Date(selectedEndDate).toLocaleDateString()}`
                  : `Date: ${formatExportDate(selectedDate)}`
                }
              </span>
              <span style={{ marginLeft: '16px', color: '#666' }}>
                Showing: {getStatusFilterLabel(statusFilter)}
              </span>
            </div>
          </div>
          
          {bulkEditMode && (
            <div className="EmppAttendence-bulk-select-all">
              <input
                type="checkbox"
                checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                onChange={selectAllRecords}
              />
              <span>Select All ({selectedRecords.length} selected)</span>
            </div>
          )}
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="EmppAttendence-attendance-table">
            <thead>
              <tr>
                {bulkEditMode && <th style={{ width: '50px' }}></th>}
                {dateRangeMode && <th className="EmppAttendence-col-date-header">Date</th>}
                <th className="EmppAttendence-col-employee">Employee</th>
                <th className="EmppAttendence-col-department">Department</th>
                <th className="EmppAttendence-col-type">Type</th>
                {!dateRangeMode && <th className="EmppAttendence-col-date">Date</th>}
                <th className="EmppAttendence-col-checkin">Check In</th>
                <th className="EmppAttendence-col-checkout">Check Out</th>
                <th className="EmppAttendence-col-hours">Hours</th>
                <th className="EmppAttendence-col-login">Login Time</th>
                <th className="EmppAttendence-col-status">Status</th>
                <th className="EmppAttendence-col-late">Late By</th>
                {!bulkEditMode && <th className="EmppAttendence-col-actions">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length ? (
                dateRangeMode ? (
                  // Group by date for range mode
                  Object.entries(groupedByDate || {}).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([date, dateRecords]) => (
                    <React.Fragment key={date}>
                      {/* Date Header */}
                      <tr className="EmppAttendence-date-header">
                        <td colSpan={bulkEditMode ? 12 : 11}>
                          <div className="EmppAttendence-date-title">
                            <FiCalendar size={18} />
                            <strong>{new Date(date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}</strong>
                            <span className="EmppAttendence-date-count">
                              ({dateRecords.length} employees)
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Records for this date */}
                      {dateRecords.map((rec) => (
                        <tr key={`${rec._id}_${date}`} className={getRowClass(rec.status)}>
                          {bulkEditMode && (
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedRecords.includes(rec._id)}
                                onChange={() => toggleRecordSelection(rec._id)}
                              />
                            </td>
                          )}
                          
                          {dateRangeMode && (
                            <td className="EmppAttendence-col-date">
                              <div className="EmppAttendence-date-badge">
                                {new Date(date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric"
                                })}
                              </div>
                            </td>
                          )}

                          <td className="EmppAttendence-col-employee">
                            <div className="EmppAttendence-employee-info">
                              <div className="EmppAttendence-employee-avatar">
                                {getInitials(rec.user?.name)}
                              </div>
                              <div className="EmppAttendence-employee-details">
                                <div className="EmppAttendence-employee-name">
                                  {rec.user?.name || "N/A"}
                                </div>
                                <div className="EmppAttendence-employee-email">
                                  {rec.user?.email || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="EmppAttendence-col-department">
                            <span className="EmppAttendence-department-chip">
                              {rec.user?.department || 
                               (rec.user?.departmentId && departmentsMap[rec.user.departmentId]) || 
                               'Unassigned'}
                            </span>
                          </td>

                          <td className="EmppAttendence-col-type">
                            <span className={`EmppAttendence-type-chip ${getEmployeeTypeClass(rec.user?.employeeType)}`}>
                              {rec.user?.employeeType?.toUpperCase() || "N/A"}
                            </span>
                          </td>

                          {!dateRangeMode && (
                            <td className="EmppAttendence-col-date">
                              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                {formatDate(rec.date)}
                              </div>
                            </td>
                          )}

                          <td className="EmppAttendence-col-checkin">
                            <div style={{ fontWeight: 500 }}>
                              {formatTime(rec.inTime)}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-checkout">
                            <div style={{ fontWeight: 500 }}>
                              {formatTime(rec.outTime)}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-hours">
                            <span className={`EmppAttendence-time-chip ${
                              rec.totalHours >= 9
                                ? 'EmppAttendence-time-full'
                                : rec.totalHours >= 5
                                ? 'EmppAttendence-time-half'
                                : 'EmppAttendence-time-low'
                            }`}>
                              {rec.hoursWorked || "00:00:00"}
                            </span>
                          </td>

                          <td className="EmppAttendence-col-login">
                            <div className="EmppAttendence-login-time-info">
                              {getLoginTimeCategory(rec.inTime)}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-status">
                            <span className={`EmppAttendence-status-chip ${getStatusClass(rec.status)}`}>
                              {rec.status.toUpperCase()}
                            </span>
                            <div className="EmppAttendence-status-explanation">
                              {rec.status === 'present' && 'Arrived before 9:10 AM'}
                              {rec.status === 'late' && 'Arrived between 9:10-9:30 AM'}
                              {rec.status === 'halfday' && 'Arrived after 9:30 AM'}
                              {rec.status === 'absent' && 'No attendance recorded'}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-late">
                            <span className="EmppAttendence-late-chip">
                              {rec.lateBy || "00:00:00"}
                            </span>
                          </td>

                          {!bulkEditMode && (
                            <td className="EmppAttendence-col-actions">
                              <div className="EmppAttendence-action-buttons">
                                <button
                                  className="EmppAttendence-btn-icon EmppAttendence-edit-btn"
                                  onClick={() => handleEditRecord(rec)}
                                  title="Edit Attendance"
                                >
                                  <FiEdit size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  // Group by department for single day
                  Object.entries(
                    filteredRecords.reduce((acc, rec) => {
                      const dept = rec.user?.department || 'Unassigned';
                      if (!acc[dept]) acc[dept] = [];
                      acc[dept].push(rec);
                      return acc;
                    }, {})
                  ).map(([department, deptRecords]) => (
                    <React.Fragment key={department}>
                      {/* Department Header */}
                      <tr className="EmppAttendence-department-header">
                        <td colSpan={bulkEditMode ? 12 : 11}>
                          <div className="EmppAttendence-department-title">
                            <FiUsers size={18} />
                            <strong>{department} Department</strong>
                            <span className="EmppAttendence-department-count">
                              ({deptRecords.length} employees)
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Records */}
                      {deptRecords.map((rec) => (
                        <tr key={rec._id} className={getRowClass(rec.status)}>
                          {bulkEditMode && (
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedRecords.includes(rec._id)}
                                onChange={() => toggleRecordSelection(rec._id)}
                              />
                            </td>
                          )}

                          <td className="EmppAttendence-col-employee">
                            <div className="EmppAttendence-employee-info">
                              <div className="EmppAttendence-employee-avatar">
                                {getInitials(rec.user?.name)}
                              </div>
                              <div className="EmppAttendence-employee-details">
                                <div className="EmppAttendence-employee-name">
                                  {rec.user?.name || "N/A"}
                                </div>
                                <div className="EmppAttendence-employee-email">
                                  {rec.user?.email || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="EmppAttendence-col-department">
                            <span className="EmppAttendence-department-chip">
                              {rec.user?.department || 
                               (rec.user?.departmentId && departmentsMap[rec.user.departmentId]) || 
                               'Unassigned'}
                            </span>
                          </td>

                          <td className="EmppAttendence-col-type">
                            <span className={`EmppAttendence-type-chip ${getEmployeeTypeClass(rec.user?.employeeType)}`}>
                              {rec.user?.employeeType?.toUpperCase() || "N/A"}
                            </span>
                          </td>

                          <td className="EmppAttendence-col-date">
                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                              {formatDate(rec.date)}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-checkin">
                            <div style={{ fontWeight: 500 }}>
                              {formatTime(rec.inTime)}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-checkout">
                            <div style={{ fontWeight: 500 }}>
                              {formatTime(rec.outTime)}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-hours">
                            <span className={`EmppAttendence-time-chip ${
                              rec.totalHours >= 9
                                ? 'EmppAttendence-time-full'
                                : rec.totalHours >= 5
                                ? 'EmppAttendence-time-half'
                                : 'EmppAttendence-time-low'
                            }`}>
                              {rec.hoursWorked || "00:00:00"}
                            </span>
                          </td>

                          <td className="EmppAttendence-col-login">
                            <div className="EmppAttendence-login-time-info">
                              {getLoginTimeCategory(rec.inTime)}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-status">
                            <span className={`EmppAttendence-status-chip ${getStatusClass(rec.status)}`}>
                              {rec.status.toUpperCase()}
                            </span>
                            <div className="EmppAttendence-status-explanation">
                              {rec.status === 'present' && 'Arrived before 9:10 AM'}
                              {rec.status === 'late' && 'Arrived between 9:10-9:30 AM'}
                              {rec.status === 'halfday' && 'Arrived after 9:30 AM'}
                              {rec.status === 'absent' && 'No attendance recorded'}
                            </div>
                          </td>

                          <td className="EmppAttendence-col-late">
                            <span className="EmppAttendence-late-chip">
                              {rec.lateBy || "00:00:00"}
                            </span>
                          </td>

                          {!bulkEditMode && (
                            <td className="EmppAttendence-col-actions">
                              <div className="EmppAttendence-action-buttons">
                                <button
                                  className="EmppAttendence-btn-icon EmppAttendence-edit-btn"
                                  onClick={() => handleEditRecord(rec)}
                                  title="Edit Attendance"
                                >
                                  <FiEdit size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={bulkEditMode ? (dateRangeMode ? 12 : 11) : (dateRangeMode ? 11 : 10)}>
                    <div className="EmppAttendence-empty-state">
                      <div className="EmppAttendence-empty-state-icon">
                        <FiCalendar size={48} />
                      </div>
                      <h4 className="EmppAttendence-empty-state-title">No Records Found</h4>
                      <p className="EmppAttendence-empty-state-text">
                        Try adjusting your filters or add a new attendance record
                      </p>
                      <button
                        className="EmppAttendence-btn EmppAttendence-btn-contained"
                        onClick={handleAddRecord}
                      >
                        Add Attendance
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="EmppAttendence-summary-grid">
        {stats.total > 0 && (
          <div className="EmppAttendence-summary-item">
            <span className="EmppAttendence-summary-label">Total Employees:</span>
            <span className="EmppAttendence-summary-value">{stats.total}</span>
          </div>
        )}

        {(stats.present + stats.late + stats.halfDay) > 0 && (
          <div className="EmppAttendence-summary-item">
            <span className="EmppAttendence-summary-label">Attendance Rate:</span>
            <span className="EmppAttendence-summary-value">
              {((stats.present + stats.late + stats.halfDay) / stats.total * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {stats.onTime > 0 && (
          <div className="EmppAttendence-summary-item">
            <span className="EmppAttendence-summary-label">On Time Rate:</span>
            <span className="EmppAttendence-summary-value">
              {(stats.onTime / stats.total * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {stats.late > 0 && (
          <div className="EmppAttendence-summary-item">
            <span className="EmppAttendence-summary-label">Late Rate:</span>
            <span className="EmppAttendence-summary-value">
              {(stats.late / stats.total * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      {editModalOpen && (
        <EditAttendanceModal
          record={selectedRecord}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRecord(null);
          }}
          onSave={handleSaveRecord}
          onDelete={handleDeleteRecord}
          users={allUsers}
          canEdit={canEditAttendance}
        />
      )}

      {addModalOpen && (
        <AddAttendanceModal
          onClose={() => setAddModalOpen(false)}
          onSave={handleAddNewRecord}
          users={allUsers}
          selectedDate={selectedDate}
          canEdit={canEditAttendance}
        />
      )}

      {quickEditModalOpen && (
        <QuickEditModal
          records={filteredRecords.filter(rec => selectedRecords.includes(rec._id))}
          onClose={() => setQuickEditModalOpen(false)}
          onSave={handleQuickEditSave}
        />
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className="EmppAttendence-snackbar">
          <div className={`EmppAttendence-snackbar-content EmppAttendence-snackbar-${snackbar.type}`}>
            {snackbar.type === "success" && <FiCheckCircle size={20} />}
            {snackbar.type === "error" && <FiXCircle size={20} />}
            {snackbar.type === "info" && <FiAlertCircle size={20} />}
            <span>{snackbar.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;
