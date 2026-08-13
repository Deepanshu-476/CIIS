import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, Eye, EyeOff, FileText, Landmark, LockKeyhole, MapPin, PackageCheck, PhoneCall, ShieldCheck, UserRound, Users } from 'lucide-react';
import axios from '../utils/axiosConfig';
import './Login.css';
import '../admin/page/CreateUser.css';
import './SelfRegister.css';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  branch: '',
  department: '',
  jobRole: '',
  shiftId: '',
  companyRole: 'Employee',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pinCode: '',
  gender: '',
  maritalStatus: '',
  dob: '',
  aadharCard: '',
  panCard: '',
  salary: '',
  accountNumber: '',
  ifsc: '',
  bankName: '',
  bankHolderName: '',
  employeeType: '',
  dateOfJoining: '',
  propertyOwned: '',
  additionalDetails: '',
  experienceType: '',
  additionalDocumentDetails: '',
  fatherName: '',
  motherName: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  emergencyAddress: '',
  properties: []
};

const genderOptions = ['male', 'female', 'other'];
const maritalStatusOptions = ['single', 'married', 'divorced', 'widowed'];
const companyRoleOptions = ['Employee', 'Manager', 'HR', 'Admin', 'Owner'];
const employeeTypeOptions = ['Full Time', 'Part Time', 'Contract', 'Intern', 'Probation', 'Work from Home'];
const propertyOptions = ['sim', 'phone', 'laptop', 'desktop', 'headphones', 'tablet', 'vehicle'];
const documentFileFields = [
  { name: 'aadharFront', label: 'Aadhar Card Front Image' },
  { name: 'aadharBack', label: 'Aadhar Card Back Image' },
  { name: 'panFront', label: 'PAN Card Front Image' },
  { name: 'panBack', label: 'PAN Card Back Image' }
];
const experienceTypeOptions = ['fresher', 'experienced'];
const experienceFileFields = {
  fresher: [
    { name: 'bankStatement', label: 'Bank Statement PDF', accept: 'application/pdf', hint: 'Upload bank statement PDF' }
  ],
  experienced: [
    { name: 'experienceLetter', label: 'Experience Letter', accept: 'application/pdf,image/*', hint: 'Upload experience letter' },
    { name: 'salarySlip', label: 'Salary Slip', accept: 'application/pdf,image/*', hint: 'Upload salary slip' },
    { name: 'additionalDocument', label: 'Additional Document', accept: 'application/pdf,image/*', hint: 'Upload additional document' }
  ]
};

const getId = value => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || '';
  return String(value);
};

const getRoleShiftOptions = role => {
  const shifts = Array.isArray(role?.shifts) && role.shifts.length > 0
    ? role.shifts
    : (role?.shiftSettings ? [role.shiftSettings] : []);

  return shifts.map((shift, index) => ({
    ...shift,
    shiftId: shift.shiftId || shift.id || shift._id || `${getId(role)}-shift-${index}`,
    shiftName: shift.shiftName || shift.name || `Shift ${index + 1}`,
    shiftType: shift.shiftType || 'custom'
  }));
};

const normalizeCompanyCode = value => String(value || '')
  .toUpperCase()
  .replace(/[^A-Z0-9_-]/g, '')
  .slice(0, 30);

function SelfRegister() {
  const navigate = useNavigate();
  const { companyCode: routeCompanyCode } = useParams();
  const [companyCode, setCompanyCode] = useState(normalizeCompanyCode(routeCompanyCode));
  const [company, setCompany] = useState(null);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [documentFiles, setDocumentFiles] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const selectedJobRole = jobRoles.find(role => getId(role) === form.jobRole);
  const shiftOptions = selectedJobRole ? getRoleShiftOptions(selectedJobRole) : [];
  const selectedShift = shiftOptions.find(shift => String(shift.shiftId) === String(form.shiftId));

  const visibleDepartments = useMemo(() => (
    departments.filter(department => {
      const branchId = getId(department.branch) || getId(department.branchId);
      return !form.branch || !branchId || branchId === form.branch;
    })
  ), [departments, form.branch]);

  const visibleJobRoles = useMemo(() => (
    jobRoles.filter(role => {
      const departmentId = getId(role.department) || getId(role.departmentId);
      return !form.department || !departmentId || departmentId === form.department;
    })
  ), [jobRoles, form.department]);

  const loadCompany = async (code = companyCode) => {
    const cleanCode = normalizeCompanyCode(code);
    if (!cleanCode) {
      toast.error('Company code is required');
      return;
    }

    setLoadingCompany(true);
    try {
      const response = await axios.get(`/company/self-registration/${cleanCode}`, {
        _skipErrorNotify: true,
        noCache: true
      });

      const data = response.data || {};
      setCompany(data.company || null);
      setBranches(data.branches || []);
      setDepartments(data.departments || []);
      setJobRoles(data.jobRoles || []);
      setCompanyCode(data.company?.companyCode || cleanCode);

      const defaultBranch = (data.branches || []).find(branch => branch.isDefault) || data.branches?.[0];
      setForm(prev => ({
        ...prev,
        branch: getId(defaultBranch),
        department: '',
        jobRole: '',
        shiftId: ''
      }));
    } catch (error) {
      console.error('Company self registration lookup failed:', error);
      setCompany(null);
      setBranches([]);
      setDepartments([]);
      setJobRoles([]);
      toast.error(error.response?.data?.message || 'Company not found');
    } finally {
      setLoadingCompany(false);
    }
  };

  useEffect(() => {
    if (routeCompanyCode) {
      loadCompany(routeCompanyCode);
    }
  }, [routeCompanyCode]);

  const updateField = event => {
    const { name, value } = event.target;
    setValidationMessage('');
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'branch') {
        next.department = '';
        next.jobRole = '';
        next.shiftId = '';
      } else if (name === 'department') {
        next.jobRole = '';
        next.shiftId = '';
      } else if (name === 'jobRole') {
        next.shiftId = '';
      }
      return next;
    });
  };

  const toggleProperty = property => {
    setForm(prev => {
      const hasProperty = prev.properties.includes(property);
      return {
        ...prev,
        properties: hasProperty
          ? prev.properties.filter(item => item !== property)
          : [...prev.properties, property]
      };
    });
  };

  const updateDocumentFile = event => {
    const { name, files } = event.target;
    setValidationMessage('');
    setDocumentFiles(prev => ({
      ...prev,
      [name]: files?.[0] || null
    }));
  };

  const renderInput = ({ name, label, type = 'text', placeholder = '', required = false, inputMode }) => (
    <div className="CreateUser-form-group">
      <label className="CreateUser-label">{label}{required && ' *'}</label>
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={updateField}
        className="CreateUser-input"
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
      />
    </div>
  );

  const renderPasswordInput = ({ name, label, placeholder, visible, onToggle }) => (
    <div className="CreateUser-form-group">
      <label className="CreateUser-label">{label} *</label>
      <div className="CreateUser-input-wrapper">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          value={form[name]}
          onChange={updateField}
          className="CreateUser-input"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          className="CreateUser-password-toggle"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  const renderSelect = ({ name, label, options, placeholder, required = false }) => (
    <div className="CreateUser-form-group">
      <label className="CreateUser-label">{label}{required && ' *'}</label>
      <select name={name} value={form[name]} onChange={updateField} className="CreateUser-select" required={required}>
        <option value="">{placeholder}</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );

  const validateForm = () => {
    if (!company?._id) {
      toast.error('Please verify company code first');
      return false;
    }

    for (const stepIndex of [0, 1, 3]) {
      if (!validateStep(stepIndex)) {
        setActiveStep(stepIndex);
        return false;
      }
    }
    return true;
  };

  const validateStep = stepIndex => {
    const showRequiredError = message => {
      setValidationMessage(message);
      toast.error(message);
      return false;
    };

    if (stepIndex === 0) {
      const missing = [
        ['name', 'Full name'],
        ['email', 'Email'],
        ['password', 'Password'],
        ['confirmPassword', 'Confirm password']
      ].find(([field]) => !String(form[field] || '').trim());

      if (missing) {
        return showRequiredError(`${missing[1]} is required. Please fill this field to continue.`);
      }
      if (form.password.length < 8) {
        return showRequiredError('Password must be at least 8 characters to continue.');
      }
      if (form.password !== form.confirmPassword) {
        return showRequiredError('Password and Confirm Password do not match.');
      }
    }

    if (stepIndex === 1) {
      const missing = [
        ['branch', 'Branch'],
        ['department', 'Department'],
        ['jobRole', 'Job role'],
        ['shiftId', 'Shift'],
        ['companyRole', 'Company role']
      ].find(([field]) => !String(form[field] || '').trim());

      if (missing) {
        return showRequiredError(`${missing[1]} is required. Please select it to continue.`);
      }
    }

    if (stepIndex === 3 && form.experienceType === 'fresher' && !documentFiles.bankStatement) {
      return showRequiredError('Bank Statement PDF is required for Fresher. Please upload it to continue.');
    }

    if (stepIndex === 3 && form.experienceType === 'experienced') {
      const missingDocument = [
        ['experienceLetter', 'Experience Letter'],
        ['salarySlip', 'Salary Slip'],
        ['additionalDocument', 'Additional Document']
      ].find(([field]) => !documentFiles[field]);

      if (missingDocument) {
        return showRequiredError(`${missingDocument[1]} is required for Experienced user. Please upload it to continue.`);
      }

      if (!form.additionalDocumentDetails.trim()) {
        return showRequiredError('Additional Document Details is required for Experienced user.');
      }
    }

    setValidationMessage('');
    return true;
  };

  const goToNextStep = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep(step => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      void confirmPassword;
      const finalPayload = {
        ...payload,
        salary: payload.salary ? Number(payload.salary) : '',
        properties: payload.properties || [],
        assignedBranches: [payload.branch],
        shiftName: selectedShift?.shiftName || '',
        shiftType: selectedShift?.shiftType || '',
        company: company._id,
        companyCode: company.companyCode,
        registrationSource: 'self_register'
      };

      const activeDocumentFieldNames = new Set([
        ...documentFileFields.map(field => field.name),
        ...(experienceFileFields[payload.experienceType] || []).map(field => field.name)
      ]);

      const filesToUpload = Object.entries(documentFiles).filter(([key, file]) => (
        activeDocumentFieldNames.has(key) && file
      ));

      if (filesToUpload.length === 0) {
        const jsonPayload = Object.fromEntries(Object.entries(finalPayload).filter(([, value]) => (
          value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')
        )));
        await axios.post('/auth/register', jsonPayload, { _skipErrorNotify: true });
      } else {
        const submitData = new FormData();

        Object.entries(finalPayload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (typeof value === 'string' && value.trim() === '') return;
          submitData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
        });

        filesToUpload.forEach(([key, file]) => submitData.append(key, file));

        await axios.post('/auth/register', submitData, { _skipErrorNotify: true });
      }

      toast.success('Registration submitted successfully. Your account is pending approval.');
      navigate(`/company/${encodeURIComponent(company.companyCode)}/login`);
    } catch (error) {
      const responseData = error.response?.data;
      console.error('Self registration failed:', {
        status: error.response?.status,
        message: responseData?.message || error.message,
        errorCode: responseData?.errorCode || responseData?.code
      });
      toast.error(responseData?.message || 'User creation failed. Please check the required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Personal Information',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            {renderInput({ name: 'name', label: 'Full Name', placeholder: 'Enter full name', required: true })}
            {renderInput({ name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter email address', required: true })}
          </div>
          <div className="CreateUser-form-row">
            {renderPasswordInput({ name: 'password', label: 'Password', placeholder: 'Minimum 8 characters', visible: showPassword, onToggle: () => setShowPassword(value => !value) })}
            {renderPasswordInput({ name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Confirm password', visible: showConfirmPassword, onToggle: () => setShowConfirmPassword(value => !value) })}
          </div>
        </div>
      )
    },
    {
      title: 'Company Assignment',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            <div className="CreateUser-form-group">
              <label className="CreateUser-label">Branch *</label>
              <select name="branch" value={form.branch} onChange={updateField} className="CreateUser-select" required>
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={getId(branch)} value={getId(branch)}>{branch.name} ({branch.branchCode})</option>
                ))}
              </select>
            </div>
            <div className="CreateUser-form-group">
              <label className="CreateUser-label">Department *</label>
              <select name="department" value={form.department} onChange={updateField} className="CreateUser-select" disabled={!form.branch} required>
                <option value="">Select Department</option>
                {visibleDepartments.map(department => (
                  <option key={getId(department)} value={getId(department)}>{department.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="CreateUser-form-row">
            <div className="CreateUser-form-group">
              <label className="CreateUser-label">Job Role *</label>
              <select name="jobRole" value={form.jobRole} onChange={updateField} className="CreateUser-select" disabled={!form.department} required>
                <option value="">Select Job Role</option>
                {visibleJobRoles.map(role => (
                  <option key={getId(role)} value={getId(role)}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="CreateUser-form-group">
              <label className="CreateUser-label">Shift *</label>
              <select name="shiftId" value={form.shiftId} onChange={updateField} className="CreateUser-select" disabled={!form.jobRole} required>
                <option value="">Select Shift</option>
                {shiftOptions.map(shift => (
                  <option key={shift.shiftId} value={shift.shiftId}>{shift.shiftName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="CreateUser-form-row">
            {renderSelect({ name: 'companyRole', label: 'Company Role', placeholder: 'Select role', options: companyRoleOptions, required: true })}
          </div>
        </div>
      )
    },
    {
      title: 'Additional Details',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            {renderInput({ name: 'phone', label: 'Phone', placeholder: 'Enter phone number', inputMode: 'numeric' })}
            {renderSelect({ name: 'employeeType', label: 'Employee Type', placeholder: 'Select employee type', options: employeeTypeOptions })}
          </div>
          <div className="CreateUser-form-row">
            {renderSelect({ name: 'gender', label: 'Gender', placeholder: 'Select gender', options: genderOptions })}
            {renderSelect({ name: 'maritalStatus', label: 'Marital Status', placeholder: 'Select marital status', options: maritalStatusOptions })}
          </div>
          <div className="CreateUser-form-row">
            {renderInput({ name: 'dob', label: 'Date of Birth', type: 'date' })}
          </div>
        </div>
      )
    },
    {
      title: 'Work Details',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            {renderInput({ name: 'dateOfJoining', label: 'Date of Joining', type: 'date' })}
          </div>
          <div className="CreateUser-form-row">
            {renderSelect({ name: 'experienceType', label: 'Experience Type', placeholder: 'Select fresher or experienced', options: experienceTypeOptions })}
          </div>
          {form.experienceType && (
            <div className="self-register-upload-grid">
              {(experienceFileFields[form.experienceType] || []).map(field => (
                <div className="CreateUser-form-group" key={field.name}>
                  <label className="CreateUser-label">{field.label} *</label>
                  <input type="file" name={field.name} accept={field.accept} onChange={updateDocumentFile} className="CreateUser-input" />
                  <small className="CreateUser-helper-text">{documentFiles[field.name]?.name || field.hint}</small>
                </div>
              ))}
            </div>
          )}
          {form.experienceType === 'experienced' && (
            <div className="CreateUser-form-group CreateUser-full-width">
              <label className="CreateUser-label">Additional Document Details *</label>
              <textarea name="additionalDocumentDetails" value={form.additionalDocumentDetails} onChange={updateField} className="CreateUser-input" rows={3} placeholder="Mention what this additional document is" />
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Address Information',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-group CreateUser-full-width">
            <label className="CreateUser-label">Address</label>
            <textarea name="address" value={form.address} onChange={updateField} className="CreateUser-input" rows={3} placeholder="Enter address" />
          </div>
          <div className="CreateUser-form-row">
            {renderInput({ name: 'city', label: 'City', placeholder: 'Enter city' })}
            {renderInput({ name: 'state', label: 'State', placeholder: 'Enter state' })}
          </div>
          <div className="CreateUser-form-row">
            {renderInput({ name: 'country', label: 'Country', placeholder: 'Enter country' })}
            {renderInput({ name: 'pinCode', label: 'Pin Code', placeholder: 'Enter pin code', inputMode: 'numeric' })}
          </div>
        </div>
      )
    },
    {
      title: 'Identity Documents',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            {renderInput({ name: 'aadharCard', label: 'Aadhar Card', placeholder: 'Enter aadhar card number' })}
            {renderInput({ name: 'panCard', label: 'PAN Card', placeholder: 'Enter PAN card number' })}
          </div>
          <div className="self-register-upload-grid">
            {documentFileFields.map(field => (
              <div className="CreateUser-form-group" key={field.name}>
                <label className="CreateUser-label">{field.label}</label>
                <input type="file" name={field.name} accept="image/*" onChange={updateDocumentFile} className="CreateUser-input" />
                <small className="CreateUser-helper-text">{documentFiles[field.name]?.name || 'Upload front/back image'}</small>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Salary & Bank Details',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            {renderInput({ name: 'salary', label: 'Salary', type: 'number', placeholder: 'Enter salary' })}
            {renderInput({ name: 'accountNumber', label: 'Account Number', placeholder: 'Enter bank account number' })}
          </div>
          <div className="CreateUser-form-row">
            {renderInput({ name: 'ifsc', label: 'IFSC', placeholder: 'Enter IFSC' })}
            {renderInput({ name: 'bankName', label: 'Bank Name', placeholder: 'Enter bank name' })}
          </div>
          <div className="CreateUser-form-row">
            {renderInput({ name: 'bankHolderName', label: 'Bank Holder Name', placeholder: 'Enter account holder name' })}
          </div>
        </div>
      )
    },
    {
      title: 'Family Details',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            {renderInput({ name: 'fatherName', label: 'Father Name', placeholder: 'Enter father name' })}
            {renderInput({ name: 'motherName', label: 'Mother Name', placeholder: 'Enter mother name' })}
          </div>
        </div>
      )
    },
    {
      title: 'Emergency Contact',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-row">
            {renderInput({ name: 'emergencyName', label: 'Emergency Name', placeholder: 'Enter contact name' })}
            {renderInput({ name: 'emergencyPhone', label: 'Emergency Phone', placeholder: 'Enter contact phone', inputMode: 'numeric' })}
          </div>
          <div className="CreateUser-form-row">
            {renderInput({ name: 'emergencyRelation', label: 'Emergency Relation', placeholder: 'Enter relation' })}
          </div>
          <div className="CreateUser-form-group CreateUser-full-width">
            <label className="CreateUser-label">Emergency Address</label>
            <textarea name="emergencyAddress" value={form.emergencyAddress} onChange={updateField} className="CreateUser-input" rows={3} placeholder="Enter emergency address" />
          </div>
        </div>
      )
    },
    {
      title: 'Assets & Extra Details',
      content: (
        <div className="CreateUser-form-grid">
          <div className="CreateUser-form-group CreateUser-full-width">
            <label className="CreateUser-label">Properties</label>
            <div className="self-register-checkbox-grid">
              {propertyOptions.map(property => (
                <label key={property} className="self-register-checkbox">
                  <input type="checkbox" checked={form.properties.includes(property)} onChange={() => toggleProperty(property)} />
                  <span>{property}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="CreateUser-form-row">
            {renderInput({ name: 'propertyOwned', label: 'Property Owned', placeholder: 'Enter owned property details' })}
          </div>
          <div className="CreateUser-form-group CreateUser-full-width">
            <label className="CreateUser-label">Additional Details</label>
            <textarea name="additionalDetails" value={form.additionalDetails} onChange={updateField} className="CreateUser-input" rows={3} placeholder="Enter any additional details" />
          </div>
        </div>
      )
    }
  ];

  const isLastStep = activeStep === steps.length - 1;
  const stepIcons = [UserRound, Building2, Users, BriefcaseBusiness, MapPin, FileText, Landmark, Users, PhoneCall, PackageCheck];
  const stepDescriptions = [
    'Complete your account credentials to continue.',
    'Choose your branch, department, role and shift.',
    'Tell us a little more about yourself.',
    'Add your joining and experience details.',
    'Provide your current address information.',
    'Upload identity and verification documents.',
    'Add salary and bank account information.',
    'Share your immediate family details.',
    'Add a trusted emergency contact.',
    'Review assets and any additional details.'
  ];
  const ActiveStepIcon = stepIcons[activeStep];
  const completedPercent = Math.round(((activeStep + 1) / steps.length) * 100);

  return (
    <div className="login-page-container self-register-page">
      <div className="self-register-shell">
        <aside className="self-register-sidebar">
          <div className="self-register-brand">
            <strong>CIIS NETWORK</strong>
            <span>Employee onboarding</span>
          </div>
          <div className="self-register-phase">PHASE 1 — Profile Setup</div>
          <nav className="self-register-side-steps" aria-label="Registration progress">
            {steps.map((step, index) => {
              const StepIcon = stepIcons[index];
              return (
                <button key={step.title} type="button" className={`self-register-side-step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'done' : ''}`} onClick={() => index <= activeStep && setActiveStep(index)}>
                  <span>{index < activeStep ? <CheckCircle2 size={15} /> : index + 1}</span>
                  <StepIcon size={16} />
                  <b>{step.title}</b>
                </button>
              );
            })}
          </nav>
          <div className="self-register-progress">
            <div><strong>Step {activeStep + 1} of {steps.length}</strong><span>{completedPercent}% complete</span></div>
            <div className="self-register-progress-track"><span style={{ width: `${completedPercent}%` }} /></div>
          </div>
          <div className="self-register-security"><ShieldCheck size={26} /><span>Your information is<br />securely protected.</span></div>
        </aside>
        <main className="self-register-main">
        <div className="self-register-header">
          <div>
            <p className="self-register-kicker">CIIS Network</p>
            <h1>Create Your User Account</h1>
            <p>Enter your company code and complete your employee profile.</p>
          </div>
          <button
            type="button"
            className="self-register-login-link"
            onClick={() => navigate(company?.companyCode ? `/company/${company.companyCode}/login` : '/')}
          >
            Back to Login
          </button>
        </div>

        <div className="self-register-company-card">
          <div className="self-register-code-row">
            <div className="self-register-code-input">
              <label>Company Code</label>
              <div className="self-register-code-control">
                <input
                  type="text"
                  value={companyCode}
                  onChange={event => setCompanyCode(normalizeCompanyCode(event.target.value))}
                  className="self-register-company-code-input"
                  placeholder="Enter company code"
                  maxLength={30}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>
            <button
              type="button"
              className="self-register-verify-button"
              onClick={() => loadCompany(companyCode)}
              disabled={loadingCompany}
            >
              {loadingCompany ? 'Checking...' : 'Continue'}
            </button>
          </div>

          {company && (
            <div className="self-register-company-result">
              {!company.logo && <span className="self-register-company-logo-fallback"><Building2 size={25} /></span>}
              {company.logo && <img src={company.logo} alt={company.companyName} />}
              <div>
                <strong>{company.companyName}</strong>
                <span>{company.companyCode} • {branches.length} branches • {departments.length} departments</span>
              </div>
              <span className="self-register-verified"><ShieldCheck size={16} /> Verified</span>
            </div>
          )}
        </div>

        {company && (
          <form className="CreateUser-paper self-register-form" onSubmit={handleSubmit}>
            <div className="self-register-stepper">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  className={`self-register-step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'done' : ''}`}
                  onClick={() => index <= activeStep && setActiveStep(index)}
                >
                  <span>{index + 1}</span>
                  {step.title}
                </button>
              ))}
            </div>

            <div className="self-register-step-heading">
              <span className="self-register-heading-icon"><ActiveStepIcon size={25} /></span>
              <div>
                <h3 className="CreateUser-section-title">{steps[activeStep].title}</h3>
                <p>{stepDescriptions[activeStep]}</p>
              </div>
            </div>

            {validationMessage && (
              <div className="self-register-validation-message" role="alert">
                <span>!</span>
                <strong>{validationMessage}</strong>
              </div>
            )}

            {steps[activeStep].content}

            <div className={`self-register-step-actions ${activeStep === 0 ? 'first' : ''}`}>
              {activeStep > 0 && (
                <button
                  type="button"
                  className="self-register-small-action"
                  onClick={() => setActiveStep(step => Math.max(step - 1, 0))}
                  disabled={submitting}
                >
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              {isLastStep ? (
                <button type="submit" className="CreateUser-submit-button self-register-step-submit" disabled={submitting}>
                  {submitting ? 'Creating Account...' : 'Create Account'} <CheckCircle2 size={19} />
                </button>
              ) : (
                <button
                  type="button"
                  className="CreateUser-submit-button self-register-step-submit"
                  onClick={goToNextStep}
                  disabled={submitting}
                >
                  Next <ArrowRight size={20} />
                </button>
              )}
            </div>
          </form>
        )}
        {!company && (
          <div className="self-register-awaiting">
            <LockKeyhole size={28} />
            <div><strong>Verify your company to begin</strong><span>Your onboarding form will appear here.</span></div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

export default SelfRegister;
