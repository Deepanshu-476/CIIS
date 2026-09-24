import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Landmark,
  ShieldCheck,
  Upload,
  UserRound,
  X,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config';
import './CompanyRegister.css';

const initialForm = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  department: 'Management',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  confirmPassword: '',
  planId: '',
  logoFile: null
};

const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              {
                type: 'image/jpeg',
                lastModified: Date.now()
              }
            );
            callback(compressedFile);
          } else {
            callback(file);
          }
        },
        'image/jpeg',
        0.75
      );
    };
    img.onerror = () => callback(file);
  };
  reader.onerror = () => callback(file);
};

export default function CompanyRegister() {
  const navigate = useNavigate();
  const location = useLocation();

  const isCiisNetworkRegisterRoute = location.pathname === '/Ciis-network/RegisterCompany';
  const returnTo = location.state?.returnTo || (isCiisNetworkRegisterRoute ? '/Ciis-network/all-company' : '/');

  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredCompany, setRegisteredCompany] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Load registration draft if passed from another screen
  useEffect(() => {
    let storedDraft = null;
    try {
      storedDraft = JSON.parse(sessionStorage.getItem('ciisCompanyRegistrationDraft') || 'null');
    } catch (draftError) {
      console.warn('Unable to read company registration draft', draftError);
    }

    const draft = location.state?.registrationDraft || storedDraft;
    if (!draft) return;

    setForm((prev) => ({
      ...prev,
      companyName: draft.companyName || prev.companyName,
      companyEmail: draft.companyEmail || prev.companyEmail,
      companyPhone: String(draft.companyPhone || prev.companyPhone || '').replace(/\D/g, '').slice(0, 10),
      ownerName: draft.ownerName || prev.ownerName,
      ownerEmail: draft.ownerEmail || prev.ownerEmail
    }));

    try {
      sessionStorage.removeItem('ciisCompanyRegistrationDraft');
    } catch (draftError) {
      console.warn('Unable to clear company registration draft', draftError);
    }
  }, [location.state]);

  // Load active subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/plans`);
        const activePlans = response.data?.plans || response.data?.data || [];
        setPlans(activePlans);
        if (activePlans.length === 1) {
          setForm((prev) => ({ ...prev, planId: activePlans[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
        toast.error('Failed to load plans. Please refresh.');
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    let finalValue = value;

    if (name === 'companyPhone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'ownerName') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setValidationMessage('');
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

    setForm((prev) => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, WEBP)');
      return;
    }

    compressImage(file, (compressedFile) => {
      setForm((prev) => ({ ...prev, logoFile: compressedFile }));
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(compressedFile);
    });
  };

  const removeLogo = () => {
    setForm((prev) => ({ ...prev, logoFile: null }));
    setLogoPreview('');
  };

  const uploadLogoToServer = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('logo', file);

    const endpoints = [
      `${API_URL}/company/upload-logo`,
      `${API_URL}/upload-logo`,
      `${API_URL}/api/company/upload-logo`
    ];

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const uploadRes = await axios.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          _skipErrorNotify: true,
          timeout: 30000
        });

        if (uploadRes.data && (uploadRes.data.success || uploadRes.data.logoUrl)) {
          return uploadRes.data.logoUrl;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Failed to upload logo.');
  };

  const validateStep = (stepIndex, notify = true) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (stepIndex === 0) {
      if (!form.companyName.trim()) errors.companyName = 'Company name is required';
      if (!form.companyEmail.trim()) {
        errors.companyEmail = 'Company email is required';
      } else if (!emailRegex.test(form.companyEmail.trim())) {
        errors.companyEmail = 'Enter a valid email address';
      }

      if (!form.companyPhone.trim()) {
        errors.companyPhone = 'Phone number is required';
      } else if (form.companyPhone.replace(/\D/g, '').length !== 10) {
        errors.companyPhone = 'Phone must be exactly 10 digits';
      }

      if (!form.companyAddress.trim()) errors.companyAddress = 'Company address is required';
    }

    if (stepIndex === 2) {
      if (!form.ownerName.trim()) errors.ownerName = 'Owner name is required';
      if (!form.ownerEmail.trim()) {
        errors.ownerEmail = 'Owner email is required';
      } else if (!emailRegex.test(form.ownerEmail.trim())) {
        errors.ownerEmail = 'Enter a valid email address';
      }

      if (!form.ownerPassword) {
        errors.ownerPassword = 'Password is required';
      } else if (form.ownerPassword.length < 6) {
        errors.ownerPassword = 'Password must be at least 6 characters';
      }

      if (!form.confirmPassword) {
        errors.confirmPassword = 'Confirm your password';
      } else if (form.ownerPassword !== form.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (stepIndex === 3) {
      if (!form.planId) {
        errors.planId = 'Please select a subscription plan to continue';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMessage = Object.values(errors)[0];
      setValidationMessage(firstErrorMessage);
      if (notify) toast.error(firstErrorMessage);
      return false;
    }

    setFieldErrors({});
    setValidationMessage('');
    return true;
  };

  const handleNextStep = (event) => {
    event?.preventDefault();
    if (!validateStep(activeStep, true)) return;
    setActiveStep((curr) => Math.min(curr + 1, steps.length - 1));
  };

  const handleStepClick = (targetIndex) => {
    if (targetIndex < activeStep) {
      setValidationMessage('');
      setActiveStep(targetIndex);
      return;
    }

    // Verify all steps up to target
    for (let i = 0; i < targetIndex; i++) {
      if (!validateStep(i, true)) {
        setActiveStep(i);
        return;
      }
    }

    setValidationMessage('');
    setActiveStep(targetIndex);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Verify all mandatory steps
    for (const stepIdx of [0, 2, 3]) {
      if (!validateStep(stepIdx, true)) {
        setActiveStep(stepIdx);
        return;
      }
    }

    setSubmitting(true);
    setValidationMessage('');

    try {
      let logoUrl = '';
      if (form.logoFile) {
        try {
          logoUrl = await uploadLogoToServer(form.logoFile);
        } catch (uploadErr) {
          console.warn('Logo upload skipped due to error:', uploadErr);
          toast.warn('Logo upload was skipped. Company registration will continue.');
        }
      }

      const payload = {
        companyName: form.companyName.trim(),
        companyEmail: form.companyEmail.trim().toLowerCase(),
        companyAddress: form.companyAddress.trim(),
        companyPhone: form.companyPhone.replace(/\D/g, ''),
        department: form.department?.trim() || 'Management',
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerPassword: form.ownerPassword,
        planId: form.planId,
        logo: logoUrl || ''
      };

      const res = await axios.post(`${API_URL}/company`, payload);
      const data = res.data || {};

      const createdCompany = data.company ||
        data.companyDetails ||
        data.newCompany ||
        data.savedCompany ||
        data.data || {
          companyName: payload.companyName,
          companyCode: data.companyCode || ''
        };

      const finalCompanyCode = createdCompany.companyCode || createdCompany.code || '';
      const loginUrl = `${window.location.origin}/company/${encodeURIComponent(finalCompanyCode)}/login`;

      setRegisteredCompany({
        ...createdCompany,
        companyCode: finalCompanyCode,
        loginUrl
      });

      setRegistrationSuccess(true);
      toast.success(data.message || 'Company registered successfully! 🎉');
    } catch (err) {
      console.error('Registration failed:', err);
      const errData = err.response?.data;
      const errorMsg =
        errData?.message ||
        (Array.isArray(errData?.errors) ? errData.errors[0] : null) ||
        err.message ||
        'Registration failed. Please check the required fields.';

      setValidationMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p._id === form.planId);
  }, [plans, form.planId]);

  const copyToClipboard = async (text, type) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const steps = [
    {
      title: 'Company Profile',
      icon: Building2,
      description: 'Enter your company name, email, phone, and registered address.',
      content: (
        <div className="company-form-grid">
          <div className="company-form-row">
            <div className={`company-form-group ${fieldErrors.companyName ? 'has-error' : ''}`}>
              <label className="company-form-label">
                Company Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={updateField}
                className="company-form-input"
                placeholder="e.g. Acme Innovations Pvt Ltd"
                autoComplete="off"
              />
              {fieldErrors.companyName && (
                <span className="company-field-error">{fieldErrors.companyName}</span>
              )}
            </div>

            <div className={`company-form-group ${fieldErrors.companyEmail ? 'has-error' : ''}`}>
              <label className="company-form-label">
                Company Email <span className="required-star">*</span>
              </label>
              <input
                type="email"
                name="companyEmail"
                value={form.companyEmail}
                onChange={updateField}
                className="company-form-input"
                placeholder="contact@company.com"
                autoComplete="off"
              />
              {fieldErrors.companyEmail && (
                <span className="company-field-error">{fieldErrors.companyEmail}</span>
              )}
            </div>
          </div>

          <div className="company-form-row">
            <div className={`company-form-group ${fieldErrors.companyPhone ? 'has-error' : ''}`}>
              <label className="company-form-label">
                Company Phone <span className="required-star">*</span>
              </label>
              <input
                type="tel"
                name="companyPhone"
                value={form.companyPhone}
                onChange={updateField}
                className="company-form-input"
                placeholder="10-digit mobile number"
                maxLength={10}
                autoComplete="off"
              />
              {fieldErrors.companyPhone && (
                <span className="company-field-error">{fieldErrors.companyPhone}</span>
              )}
            </div>

            <div className="company-form-group">
              <label className="company-form-label">Primary Department</label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={updateField}
                className="company-form-input"
                placeholder="Default: Management"
              />
            </div>
          </div>

          <div className={`company-form-group full-width ${fieldErrors.companyAddress ? 'has-error' : ''}`}>
            <label className="company-form-label">
              Company Address <span className="required-star">*</span>
            </label>
            <textarea
              name="companyAddress"
              value={form.companyAddress}
              onChange={updateField}
              className="company-form-textarea"
              placeholder="Enter full office or registered business address"
              rows={3}
            />
            {fieldErrors.companyAddress && (
              <span className="company-field-error">{fieldErrors.companyAddress}</span>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Logo & Branding',
      icon: ImageIcon,
      description: 'Upload your company logo for customized branding across portals and reports.',
      content: (
        <div className="company-form-grid">
          <div className="company-form-group full-width">
            <label className="company-form-label">Company Logo (Optional)</label>

            {!logoPreview ? (
              <label className="company-logo-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
                <div className="company-logo-dropzone-icon">
                  <Upload size={22} />
                </div>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                  Click to select company logo
                </strong>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Supports PNG, JPG, WEBP, or SVG (Max 2MB)
                </span>
              </label>
            ) : (
              <div className="company-logo-preview-box">
                <img src={logoPreview} alt="Logo preview" className="company-logo-preview-img" />
                <div className="company-logo-preview-info">
                  <strong>{form.logoFile?.name || 'Selected Company Logo'}</strong>
                  <span>{(form.logoFile?.size ? (form.logoFile.size / 1024).toFixed(1) + ' KB' : 'Image ready')}</span>
                </div>
                <button
                  type="button"
                  className="company-logo-remove-btn"
                  onClick={removeLogo}
                >
                  <X size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="company-form-group full-width">
            <div
              style={{
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>
                Your company logo will appear on your login portal, payslips, email notifications, and invoices.
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Owner Account',
      icon: UserRound,
      description: 'Create the primary administrator / business owner credentials.',
      content: (
        <div className="company-form-grid">
          <div className="company-form-row">
            <div className={`company-form-group ${fieldErrors.ownerName ? 'has-error' : ''}`}>
              <label className="company-form-label">
                Owner Full Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                name="ownerName"
                value={form.ownerName}
                onChange={updateField}
                className="company-form-input"
                placeholder="e.g. John Doe"
                autoComplete="off"
              />
              {fieldErrors.ownerName && (
                <span className="company-field-error">{fieldErrors.ownerName}</span>
              )}
            </div>

            <div className={`company-form-group ${fieldErrors.ownerEmail ? 'has-error' : ''}`}>
              <label className="company-form-label">
                Owner Email <span className="required-star">*</span>
              </label>
              <input
                type="email"
                name="ownerEmail"
                value={form.ownerEmail}
                onChange={updateField}
                className="company-form-input"
                placeholder="owner@company.com"
                autoComplete="off"
              />
              {fieldErrors.ownerEmail && (
                <span className="company-field-error">{fieldErrors.ownerEmail}</span>
              )}
            </div>
          </div>

          <div className="company-form-row">
            <div className={`company-form-group ${fieldErrors.ownerPassword ? 'has-error' : ''}`}>
              <label className="company-form-label">
                Account Password <span className="required-star">*</span>
              </label>
              <div className="company-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="ownerPassword"
                  value={form.ownerPassword}
                  onChange={updateField}
                  className="company-form-input"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  className="company-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.ownerPassword && (
                <span className="company-field-error">{fieldErrors.ownerPassword}</span>
              )}
            </div>

            <div className={`company-form-group ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
              <label className="company-form-label">
                Confirm Password <span className="required-star">*</span>
              </label>
              <div className="company-password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={updateField}
                  className="company-form-input"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  className="company-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="company-field-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Subscription Plan',
      icon: Landmark,
      description: 'Choose a subscription plan tailored to your team size and requirements.',
      content: (
        <div className="company-plans-container">
          {plansLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading available subscription plans...
            </div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
              No active subscription plans found. Please contact support.
            </div>
          ) : (
            <div className="company-plans-grid">
              {plans.map((plan) => {
                const isSelected = form.planId === plan._id;
                return (
                  <div
                    key={plan._id}
                    className={`company-plan-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, planId: plan._id }));
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.planId;
                        return next;
                      });
                      setValidationMessage('');
                    }}
                  >
                    {isSelected && (
                      <span className="company-plan-badge-selected">
                        <Check size={13} /> Selected
                      </span>
                    )}
                    <div className="company-plan-header">
                      <h4 className="company-plan-title">{plan.name}</h4>
                      {plan.description && (
                        <p className="company-plan-description">{plan.description}</p>
                      )}
                    </div>
                    <div className="company-plan-pricing">
                      <span className="company-plan-price">₹{plan.price}</span>
                      <span className="company-plan-duration">/ {plan.durationDays} days</span>
                    </div>

                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul className="company-plan-features">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx}>
                            <Check size={14} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {fieldErrors.planId && (
            <span className="company-field-error" style={{ textAlign: 'center', marginTop: '10px' }}>
              {fieldErrors.planId}
            </span>
          )}
        </div>
      )
    },
    {
      title: 'Review & Confirm',
      icon: CheckCircle2,
      description: 'Review your details before creating your company workspace.',
      content: (
        <div className="company-review-grid">
          <div className="company-review-card">
            <div className="company-review-card-header">
              <h4>
                <Building2 size={17} color="#2563eb" /> Company Details
              </h4>
              <button
                type="button"
                className="company-review-edit-btn"
                onClick={() => setActiveStep(0)}
              >
                Edit
              </button>
            </div>
            <div className="company-review-row">
              <span className="company-review-label">Company Name:</span>
              <span className="company-review-value">{form.companyName || '—'}</span>
            </div>
            <div className="company-review-row">
              <span className="company-review-label">Company Email:</span>
              <span className="company-review-value">{form.companyEmail || '—'}</span>
            </div>
            <div className="company-review-row">
              <span className="company-review-label">Phone:</span>
              <span className="company-review-value">{form.companyPhone || '—'}</span>
            </div>
            <div className="company-review-row">
              <span className="company-review-label">Address:</span>
              <span className="company-review-value">{form.companyAddress || '—'}</span>
            </div>
            <div className="company-review-row">
              <span className="company-review-label">Logo:</span>
              <span className="company-review-value">
                {form.logoFile ? form.logoFile.name : 'No logo uploaded'}
              </span>
            </div>
          </div>

          <div className="company-review-card">
            <div className="company-review-card-header">
              <h4>
                <UserRound size={17} color="#2563eb" /> Administrator Account
              </h4>
              <button
                type="button"
                className="company-review-edit-btn"
                onClick={() => setActiveStep(2)}
              >
                Edit
              </button>
            </div>
            <div className="company-review-row">
              <span className="company-review-label">Owner Name:</span>
              <span className="company-review-value">{form.ownerName || '—'}</span>
            </div>
            <div className="company-review-row">
              <span className="company-review-label">Owner Email:</span>
              <span className="company-review-value">{form.ownerEmail || '—'}</span>
            </div>
          </div>

          <div className="company-review-card">
            <div className="company-review-card-header">
              <h4>
                <Landmark size={17} color="#2563eb" /> Selected Plan
              </h4>
              <button
                type="button"
                className="company-review-edit-btn"
                onClick={() => setActiveStep(3)}
              >
                Edit
              </button>
            </div>
            {selectedPlan ? (
              <>
                <div className="company-review-row">
                  <span className="company-review-label">Plan Name:</span>
                  <span className="company-review-value">{selectedPlan.name}</span>
                </div>
                <div className="company-review-row">
                  <span className="company-review-label">Price & Validity:</span>
                  <span className="company-review-value">
                    ₹{selectedPlan.price} / {selectedPlan.durationDays} days
                  </span>
                </div>
              </>
            ) : (
              <div style={{ color: '#ef4444', fontSize: '13px' }}>No plan selected yet.</div>
            )}
          </div>
        </div>
      )
    }
  ];

  const completedPercent = Math.round(((activeStep + 1) / steps.length) * 100);
  const isLastStep = activeStep === steps.length - 1;
  const ActiveStepIcon = steps[activeStep].icon;

  return (
    <div className={`company-register-page ${isCiisNetworkRegisterRoute ? 'embedded-mode' : ''}`}>
      <div className="company-register-shell">
        {/* Left Sidebar */}
        <aside className="company-register-sidebar">
          <div className="company-register-brand">
            <img src="/logoo.png" alt="CIIS Network" className="company-register-brand-logo" />
            <span>Company Onboarding</span>
          </div>

          <div className="company-register-phase">PHASE 1 — Workspace Setup</div>

          <nav className="company-register-side-steps" aria-label="Registration steps">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isDone = idx < activeStep;
              const isActive = idx === activeStep;
              return (
                <button
                  key={step.title}
                  type="button"
                  className={`company-register-side-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  onClick={() => handleStepClick(idx)}
                >
                  <span>{isDone ? <CheckCircle2 size={15} /> : idx + 1}</span>
                  <StepIcon size={16} />
                  <b>{step.title}</b>
                </button>
              );
            })}
          </nav>

          <div className="company-register-progress">
            <div>
              <strong>Step {activeStep + 1} of {steps.length}</strong>
              <span>{completedPercent}% complete</span>
            </div>
            <div className="company-register-progress-track">
              <span style={{ width: `${completedPercent}%` }} />
            </div>
          </div>

          <div className="company-register-security">
            <ShieldCheck size={26} />
            <span>Your company data is<br />encrypted & securely stored.</span>
          </div>
        </aside>

        {/* Right Main Panel */}
        <main className="company-register-main">
          <div className="company-register-header">
            <div>
              <span className="company-register-kicker">CIIS Network</span>
              <h1>Register Your Company</h1>
              <p>Set up your company workspace and create your administrator account.</p>
            </div>

            <button
              type="button"
              className="company-register-top-link"
              onClick={() => navigate(returnTo)}
            >
              <ArrowLeft size={15} />
              {isCiisNetworkRegisterRoute ? 'Back to Companies' : 'Back to Home'}
            </button>
          </div>

          {registrationSuccess ? (
            /* Success View */
            <div className="company-success-view">
              <div className="company-success-icon">
                <CheckCircle2 size={44} />
              </div>
              <h2 className="company-success-title">Company Registered Successfully! 🎉</h2>
              <p className="company-success-subtitle">
                Your workspace is ready. You can now use your generated Company Code to log in
                with your administrator credentials.
              </p>

              <div className="company-success-card">
                <div className="company-success-item">
                  <label>Company Code</label>
                  <div className="company-success-box">
                    <span className="company-success-code">
                      {registeredCompany?.companyCode || 'GENERATED'}
                    </span>
                    <button
                      type="button"
                      className="company-copy-btn"
                      onClick={() => copyToClipboard(registeredCompany?.companyCode, 'code')}
                    >
                      {copiedCode ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      {copiedCode ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>
                </div>

                <div className="company-success-item">
                  <label>Company Login URL</label>
                  <div className="company-success-box">
                    <span className="company-success-url">
                      {registeredCompany?.loginUrl ||
                        `${window.location.origin}/company/${registeredCompany?.companyCode}/login`}
                    </span>
                    <button
                      type="button"
                      className="company-copy-btn"
                      onClick={() =>
                        copyToClipboard(
                          registeredCompany?.loginUrl ||
                            `${window.location.origin}/company/${registeredCompany?.companyCode}/login`,
                          'url'
                        )
                      }
                    >
                      {copiedUrl ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      {copiedUrl ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="company-success-actions">
                <button
                  type="button"
                  className="company-btn-primary"
                  onClick={() =>
                    navigate(
                      `/company/${encodeURIComponent(registeredCompany?.companyCode || '')}/login`
                    )
                  }
                >
                  <ExternalLink size={16} />
                  Proceed to Company Login
                </button>
                <button
                  type="button"
                  className="company-btn-secondary"
                  onClick={() => {
                    setRegistrationSuccess(false);
                    setRegisteredCompany(null);
                    setForm(initialForm);
                    setActiveStep(0);
                    removeLogo();
                  }}
                >
                  Register Another Company
                </button>
              </div>
            </div>
          ) : (
            /* Multi-step Form */
            <form className="company-register-form" onSubmit={handleSubmit} noValidate>
              <div className="company-register-step-content">
                <div className="company-register-step-heading">
                  <div className="company-register-heading-icon">
                    <ActiveStepIcon size={22} />
                  </div>
                  <div>
                    <h3>{steps[activeStep].title}</h3>
                    <p>{steps[activeStep].description}</p>
                  </div>
                </div>

                {validationMessage && (
                  <div className="company-register-validation-message" role="alert">
                    <span>!</span>
                    <strong>{validationMessage}</strong>
                  </div>
                )}

                {steps[activeStep].content}
              </div>

              {/* Bottom Navigation Actions */}
              <div
                className={`company-register-actions ${
                  activeStep === 0 ? 'first-step' : ''
                }`}
              >
                {activeStep > 0 && (
                  <button
                    type="button"
                    className="company-btn-back"
                    onClick={() => {
                      setValidationMessage('');
                      setActiveStep((curr) => Math.max(curr - 1, 0));
                    }}
                    disabled={submitting}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                )}

                {isLastStep ? (
                  <button
                    type="submit"
                    className="company-btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating Company...' : 'Create Company Workspace'}
                    <CheckCircle2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="company-btn-next"
                    onClick={handleNextStep}
                    disabled={submitting}
                  >
                    Next Step
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
