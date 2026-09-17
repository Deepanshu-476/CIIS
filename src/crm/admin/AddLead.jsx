import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiTag,
  FiSliders,
  FiSave,
  FiX,
  FiList
} from 'react-icons/fi';
import './AddLead.css';
import api from '../../utils/axiosConfig';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  leadDate: '',
  address: '',
  leadSource: '',
  leadType: '',
  customField1: '',
  customField2: '',
  customField3: '',
  customField4: '',
  customField5: '',
  remarks: ''
};

function toTitleCase(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s|-|\.)\S/g, char => char.toUpperCase());
}

export default function AddLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => { const today = new Date(); return {...initialForm, leadDate: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`}; });
  const [errors, setErrors] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [options, setOptions] = useState({types: [], sources: []});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [reload, setReload] = useState(0);
  const pending = useRef(false);
  const redirectTimer = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setApiError('');
    api.get('/crm/leads/options', {cache: false}).then(({data}) => {if(active) setOptions(data);})
      .catch(err => {if(active) setApiError(err.response?.data?.message || 'Could not load lead types and sources. Please retry.');})
      .finally(() => {if(active) setLoading(false);});
    return () => {active = false;};
  }, [reload]);
  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const handleChange = (e) => {
    if (pending.current || savedSuccess) return;
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      const onlyDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
      setForm(prev => ({ ...prev, phone: onlyDigits }));
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
      setSavedSuccess(false);
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSavedSuccess(false);
  };

  const handleFullNameBlur = () => {
    if (form.fullName && form.fullName.trim()) {
      setForm(prev => ({ ...prev, fullName: toTitleCase(prev.fullName) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pending.current || loading || savedSuccess) return;
    const newErrors = {};

    const formattedFullName = toTitleCase(form.fullName);
    if (!formattedFullName) newErrors.fullName = 'Full Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!form.leadDate) newErrors.leadDate = 'Lead Date is required';
    if (!form.leadSource) newErrors.leadSource = 'Lead Source is required';
    if (!form.leadType) newErrors.leadType = 'Lead Type is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      pending.current = true; setSaving(true); setApiError('');
      try {
        const payload = { ...form, fullName: formattedFullName };
        await api.post('/crm/leads', payload);
        setSavedSuccess(true);
        redirectTimer.current = setTimeout(() => navigate('/ciisUser/crm/admin/all-leads'), 1000);
      } catch(err) {
        setErrors(err.response?.data?.errors || {});
        setApiError(err.response?.data?.message || 'Could not save lead. Your details are still here; please try again.');
      } finally { pending.current = false; setSaving(false); }
    }
  };

  return (
    <div className="al-root crm-add-lead">
      {/* Page Header & Breadcrumb */}
      <div className="al-page-header">
        <h1 className="al-page-title">Add Lead</h1>
        <div className="al-breadcrumb">
          <span>Dashboard</span>
          <span className="separator">&gt;</span>
          <span>Leads</span>
          <span className="separator">&gt;</span>
          <span className="active">Add Lead</span>
        </div>
      </div>

      {/* Main Add Lead Form Card */}
      <div className="al-card">
        <div className="al-card-header flex-between">
          <h2 className="al-card-title">Lead Information</h2>
          <button
            type="button"
            className="al-btn-view-all"
            disabled={saving || savedSuccess}
            onClick={() => navigate('/ciisUser/crm/admin/all-leads')}
          >
            <FiList size={14} /> View All Leads
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="al-card-body">
          {apiError && <div role="alert" className="al-err">{apiError} <button type="button" disabled={loading || saving} onClick={() => setReload(v => v+1)}>Reload options</button></div>}
          {!loading && !apiError && (!options.types.length || !options.sources.length) && <p role="status">Add an active <a href="/ciisUser/crm/admin/lead-types">Lead Type</a> and <a href="/ciisUser/crm/admin/lead-sources">Lead Source</a> before saving a lead.</p>}
          {/* Section 1: BASIC INFORMATION */}
          <div className="al-section">
            <div className="al-section-title">
              <FiUser size={13} className="section-icon text-indigo" />
              <span>BASIC INFORMATION</span>
            </div>

            <div className="al-grid grid-3">
              <div className="al-field">
                <label>
                  Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={handleFullNameBlur}
                  placeholder="Enter full name"
                  className={errors.fullName ? 'is-invalid' : ''}
                />
                {errors.fullName && <span className="al-err">{errors.fullName}</span>}
              </div>

              <div className="al-field">
                <label>
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className={errors.email ? 'is-invalid' : ''}
                />
                {errors.email && <span className="al-err">{errors.email}</span>}
              </div>

              <div className="al-field">
                <label>
                  Phone <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={30}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={errors.phone ? 'is-invalid' : ''}
                />
                {errors.phone && <span className="al-err">{errors.phone}</span>}
              </div>

              <div className="al-field">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="al-err">{errors.gender}</span>}
              </div>

              <div className="al-field">
                <label>
                  Lead Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  name="leadDate"
                  value={form.leadDate}
                  onChange={handleChange}
                  className={errors.leadDate ? 'is-invalid' : ''}
                />
                {errors.leadDate && <span className="al-err">{errors.leadDate}</span>}
              </div>

              <div className="al-field">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
                {errors.address && <span className="al-err">{errors.address}</span>}
              </div>
            </div>
          </div>

          <div className="al-divider" />

          {/* Section 2: LEAD CLASSIFICATION */}
          <div className="al-section">
            <div className="al-section-title">
              <FiTag size={13} className="section-icon text-indigo" />
              <span>LEAD CLASSIFICATION</span>
            </div>

            <div className="al-grid grid-2-limited">
              <div className="al-field">
                <label>
                  Lead Source <span className="req">*</span>
                </label>
                <select
                  name="leadSource"
                  value={form.leadSource}
                  onChange={handleChange}
                  className={errors.leadSource ? 'is-invalid' : ''}
                >
                  <option value="">{loading ? 'Loading...' : 'Select Lead Source'}</option>
                  {options.sources.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                {errors.leadSource && <span className="al-err">{errors.leadSource}</span>}
              </div>

              <div className="al-field">
                <label>
                  Lead Type <span className="req">*</span>
                </label>
                <select
                  name="leadType"
                  value={form.leadType}
                  onChange={handleChange}
                  className={errors.leadType ? 'is-invalid' : ''}
                >
                  <option value="">{loading ? 'Loading...' : 'Select Lead Type'}</option>
                  {options.types.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                {errors.leadType && <span className="al-err">{errors.leadType}</span>}
              </div>
            </div>
          </div>

          <div className="al-divider" />

          {/* Section 3: CUSTOM FIELDS */}
          <div className="al-section">
            <div className="al-section-title">
              <FiSliders size={13} className="section-icon text-indigo" />
              <span>CUSTOM FIELDS</span>
            </div>

            <div className="al-grid grid-3">
              <div className="al-field">
                <label>Custom Field 1</label>
                <input
                  type="text"
                  name="customField1"
                  value={form.customField1}
                  onChange={handleChange}
                  placeholder="Custom Field 1"
                />
                {errors.customField1 && <span className="al-err">{errors.customField1}</span>}
              </div>

              <div className="al-field">
                <label>Custom Field 2</label>
                <input
                  type="text"
                  name="customField2"
                  value={form.customField2}
                  onChange={handleChange}
                  placeholder="Custom Field 2"
                />
                {errors.customField2 && <span className="al-err">{errors.customField2}</span>}
              </div>

              <div className="al-field">
                <label>Custom Field 3</label>
                <input
                  type="text"
                  name="customField3"
                  value={form.customField3}
                  onChange={handleChange}
                  placeholder="Custom Field 3"
                />
                {errors.customField3 && <span className="al-err">{errors.customField3}</span>}
              </div>
            </div>

            <div className="al-grid grid-2-limited mt-3">
              <div className="al-field">
                <label>Custom Field 4</label>
                <input
                  type="text"
                  name="customField4"
                  value={form.customField4}
                  onChange={handleChange}
                  placeholder="Custom Field 4"
                />
                {errors.customField4 && <span className="al-err">{errors.customField4}</span>}
              </div>

              <div className="al-field">
                <label>Custom Field 5</label>
                <input
                  type="text"
                  name="customField5"
                  value={form.customField5}
                  onChange={handleChange}
                  placeholder="Custom Field 5"
                />
                {errors.customField5 && <span className="al-err">{errors.customField5}</span>}
              </div>
            </div>

            <div className="al-field mt-4">
              <label>Remarks / Notes</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Enter any notes about this lead..."
                rows={4}
              />
                {errors.remarks && <span className="al-err">{errors.remarks}</span>}
            </div>
          </div>

          {savedSuccess && (
            <div className="al-success-banner" role="status">
              Lead saved successfully! Redirecting...
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="al-form-actions">
            <button type="submit" disabled={saving || loading || savedSuccess || !options.types.length || !options.sources.length} className="al-btn-save">
              <FiSave size={14} /> {saving ? 'Saving...' : 'Save Lead'}
            </button>
            <button
              type="button"
              className="al-btn-cancel"
              disabled={saving || savedSuccess}
              onClick={() => navigate('/ciisUser/crm/admin/all-leads')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
