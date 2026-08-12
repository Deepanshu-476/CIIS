import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, RefreshCw, Save, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../../../utils/axiosConfig';
import './RegisterRequest.css';

const getId = value => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || '';
  return String(value);
};

const getName = value => {
  if (!value) return '';
  if (typeof value === 'object') return value.name || value.companyName || value.companyCode || value.email || value._id || '';
  return String(value);
};

const toDateInput = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const companyRoleOptions = ['employee', 'manager', 'hr', 'admin', 'owner'];
const employeeTypeOptions = ['Full Time', 'Part Time', 'Contract', 'Intern', 'Probation', 'Work from Home'];
const propertyOptions = ['sim', 'phone', 'laptop', 'desktop', 'headphones', 'tablet', 'vehicle'];

const sections = [
  {
    key: 'personalInformation',
    title: 'Personal Information',
    fields: [
      ['name', 'Full Name'],
      ['email', 'Email Address'],
      ['phone', 'Mobile Number'],
      ['dob', 'Date of Birth', 'date'],
      ['gender', 'Gender', 'select', ['male', 'female', 'other']],
      ['maritalStatus', 'Marital Status', 'select', ['single', 'married', 'divorced', 'widowed']]
    ]
  },
  {
    key: 'companyAssignment',
    title: 'Company Assignment',
    fields: [
      ['branch', 'Branch', 'branch'],
      ['department', 'Department', 'department'],
      ['jobRole', 'Job Role', 'jobRole'],
      ['shiftId', 'Shift', 'shift'],
      ['companyRole', 'Company Role', 'select', companyRoleOptions]
    ]
  },
  {
    key: 'additionalDetails',
    title: 'Additional Details',
    fields: [
      ['employeeType', 'Employee Type', 'select', employeeTypeOptions],
      ['dateOfJoining', 'Date of Joining', 'date']
    ]
  },
  {
    key: 'workDetails',
    title: 'Work Details',
    fields: [
      ['experienceType', 'Experience Type', 'select', ['fresher', 'experienced']],
      ['additionalDocumentDetails', 'Additional Document Details', 'textarea']
    ]
  },
  {
    key: 'addressInformation',
    title: 'Address Information',
    fields: [
      ['address', 'Address', 'textarea'],
      ['city', 'City'],
      ['state', 'State'],
      ['country', 'Country'],
      ['pinCode', 'Pin Code']
    ]
  },
  {
    key: 'identityDocuments',
    title: 'Identity Documents',
    fields: [
      ['aadharCard', 'Aadhar Card'],
      ['panCard', 'PAN Card']
    ]
  },
  {
    key: 'salaryBankDetails',
    title: 'Salary & Bank Details',
    fields: [
      ['salary', 'Salary', 'number'],
      ['bankHolderName', 'Account Holder Name'],
      ['accountNumber', 'Account Number'],
      ['ifsc', 'IFSC'],
      ['bankName', 'Bank Name']
    ]
  },
  {
    key: 'familyDetails',
    title: 'Family Details',
    fields: [
      ['fatherName', "Father's Name"],
      ['motherName', "Mother's Name"]
    ]
  },
  {
    key: 'emergencyContact',
    title: 'Emergency Contact',
    fields: [
      ['emergencyName', 'Emergency Name'],
      ['emergencyPhone', 'Emergency Phone'],
      ['emergencyRelation', 'Relation'],
      ['emergencyAddress', 'Emergency Address', 'textarea']
    ]
  },
  {
    key: 'assetsExtraDetails',
    title: 'Assets & Extra Details',
    fields: [
      ['properties', 'Company Assets', 'multi'],
      ['propertyOwned', 'Property Owned'],
      ['additionalDetails', 'Additional Details', 'textarea']
    ]
  }
];

const emptyForm = sections.reduce((acc, section) => {
  section.fields.forEach(([key]) => {
    acc[key] = key === 'properties' ? [] : '';
  });
  return acc;
}, {});

const getVerifiedCount = request => (
  sections.filter(section => (
    (request?.verificationSections || []).find(item => item.key === section.key)?.verified
  )).length
);

const getErrorMessage = (error, fallback) => (
  error.response?.data?.message || error.response?.data?.error || fallback
);

export default function RegisterRequest() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canVerify, setCanVerify] = useState(false);
  const [companyConfig, setCompanyConfig] = useState({ branches: [], departments: [], jobRoles: [] });

  const selected = useMemo(
    () => requests.find(request => String(request._id) === String(selectedId)) || null,
    [requests, selectedId]
  );

  const selectedRole = useMemo(
    () => companyConfig.jobRoles.find(role => getId(role) === String(form.jobRole)),
    [companyConfig.jobRoles, form.jobRole]
  );

  const shiftOptions = useMemo(() => {
    const shifts = Array.isArray(selectedRole?.shifts) && selectedRole.shifts.length
      ? selectedRole.shifts
      : (selectedRole?.shiftSettings ? [selectedRole.shiftSettings] : []);

    return shifts.map((shift, index) => ({
      ...shift,
      shiftId: shift.shiftId || shift.id || shift._id || `${getId(selectedRole)}-shift-${index}`,
      shiftName: shift.shiftName || shift.name || `Shift ${index + 1}`,
      shiftType: shift.shiftType || 'custom'
    }));
  }, [selectedRole]);

  const filteredRequests = useMemo(() => {
    const clean = search.trim().toLowerCase();
    if (!clean) return requests;
    return requests.filter(request => `${request.name} ${request.email} ${request.companyCode}`.toLowerCase().includes(clean));
  }, [requests, search]);

  const verificationBySection = useMemo(() => {
    const map = {};
    (selected?.verificationSections || []).forEach(section => {
      map[section.key] = section;
    });
    return map;
  }, [selected]);

  const verifiedCount = sections.filter(section => verificationBySection[section.key]?.verified).length;
  const allVerified = selected?.canActivate || verifiedCount === sections.length;

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/users/register-requests');
      const list = response.data?.data?.requests || response.data?.requests || [];
      setRequests(list);
      setCanVerify(Boolean(response.data?.data?.canVerify ?? response.data?.canVerify));
      setSelectedId(current => current || list[0]?._id || '');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load register requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm(prev => {
      const next = { ...prev };
      Object.keys(emptyForm).forEach(key => {
        if (key === 'branch' || key === 'department' || key === 'jobRole') {
          next[key] = getId(selected[key]);
        } else if (key === 'dateOfJoining' || key === 'dob') {
          next[key] = toDateInput(selected[key]);
        } else if (key === 'properties') {
          next[key] = Array.isArray(selected[key]) ? selected[key] : [];
        } else {
          next[key] = selected[key] ?? '';
        }
      });
      return next;
    });
  }, [selected]);

  useEffect(() => {
    const code = selected?.companyCode;
    if (!code) return;

    axios.get(`/company/self-registration/${code}`)
      .then(response => {
        const data = response.data?.data || response.data || {};
        setCompanyConfig({
          branches: data.branches || [],
          departments: data.departments || [],
          jobRoles: data.jobRoles || []
        });
      })
      .catch(() => setCompanyConfig({ branches: [], departments: [], jobRoles: [] }));
  }, [selected?.companyCode]);

  const updateField = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'branch') {
        next.department = '';
        next.jobRole = '';
        next.shiftId = '';
      }
      if (key === 'department') {
        next.jobRole = '';
        next.shiftId = '';
      }
      if (key === 'jobRole') {
        next.shiftId = '';
      }
      return next;
    });
  };

  const replaceRequest = request => {
    setRequests(prev => {
      const exists = prev.some(item => String(item._id) === String(request._id));
      if (!exists) return [request, ...prev];
      return prev.map(item => String(item._id) === String(request._id) ? request : item);
    });
    setSelectedId(request._id);
  };

  const saveDetails = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await axios.put(`/users/register-requests/${selected._id}`, form);
      const request = response.data?.data?.request || response.data?.request;
      if (request) replaceRequest(request);
      toast.success('Register request updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update request'));
    } finally {
      setSaving(false);
    }
  };

  const toggleVerify = async (sectionKey, checked) => {
    if (!selected) return;
    try {
      const response = await axios.patch(`/users/register-requests/${selected._id}/verify-section`, {
        sectionKey,
        verified: checked
      });
      const request = response.data?.data?.request || response.data?.request;
      if (request) replaceRequest(request);
      toast.success(checked ? 'Section verified' : 'Verification removed');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to verify section'));
    }
  };

  const activateUser = async () => {
    if (!selected) return;
    try {
      const response = await axios.patch(`/users/register-requests/${selected._id}/activate`);
      const request = response.data?.data?.request || response.data?.request;
      if (request) setRequests(prev => prev.filter(item => String(item._id) !== String(request._id)));
      setSelectedId('');
      toast.success('User activated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to activate user'));
    }
  };

  const renderInput = ([key, label, type = 'text', options = []]) => {
    if (type === 'select' || type === 'branch' || type === 'department' || type === 'jobRole' || type === 'shift') {
      let selectOptions = options;
      if (type === 'branch') selectOptions = companyConfig.branches.map(item => ({ value: getId(item), label: `${item.name} ${item.branchCode ? `(${item.branchCode})` : ''}` }));
      if (type === 'department') {
        selectOptions = companyConfig.departments
          .filter(item => !form.branch || getId(item.branch) === form.branch)
          .map(item => ({ value: getId(item), label: item.name }));
      }
      if (type === 'jobRole') {
        selectOptions = companyConfig.jobRoles
          .filter(item => !form.department || getId(item.department) === form.department)
          .map(item => ({ value: getId(item), label: item.name }));
      }
      if (type === 'shift') {
        selectOptions = shiftOptions.map(item => ({ value: item.shiftId, label: `${item.shiftName} (${item.shiftType})` }));
      }

      return (
        <label className="RegisterRequest-field" key={key}>
          <span>{label}</span>
          <select value={form[key] || ''} onChange={event => updateField(key, event.target.value)} disabled={!canVerify}>
            <option value="">Select {label}</option>
            {selectOptions.map(option => {
              const value = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              return <option key={value} value={value}>{optionLabel}</option>;
            })}
          </select>
        </label>
      );
    }

    if (type === 'textarea') {
      return (
        <label className="RegisterRequest-field RegisterRequest-field-wide" key={key}>
          <span>{label}</span>
          <textarea value={form[key] || ''} onChange={event => updateField(key, event.target.value)} disabled={!canVerify} rows={3} />
        </label>
      );
    }

    if (type === 'multi') {
      return (
        <div className="RegisterRequest-field RegisterRequest-field-wide" key={key}>
          <span>{label}</span>
          <div className="RegisterRequest-check-grid">
            {propertyOptions.map(option => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={(form.properties || []).includes(option)}
                  disabled={!canVerify}
                  onChange={event => {
                    const next = event.target.checked
                      ? [...(form.properties || []), option]
                      : (form.properties || []).filter(item => item !== option);
                    updateField('properties', next);
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <label className="RegisterRequest-field" key={key}>
        <span>{label}</span>
        <input type={type} value={form[key] || ''} onChange={event => updateField(key, event.target.value)} disabled={!canVerify} />
      </label>
    );
  };

  const documentBaseUrl = String(axios.defaults.baseURL || '').replace(/\/$/, '');

  return (
    <div className="RegisterRequest-page">
      <header className="RegisterRequest-header">
        <div>
          <p>CIIS Network</p>
          <h1>Register Request</h1>
        </div>
        <button type="button" onClick={loadRequests}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </header>

      <div className="RegisterRequest-layout">
        <aside className="RegisterRequest-list">
          <div className="RegisterRequest-search">
            <Search size={18} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search request" />
          </div>

          {loading && <div className="RegisterRequest-empty">Loading requests...</div>}
          {!loading && filteredRequests.map(request => (
            <button
              type="button"
              key={request._id}
              className={String(selectedId) === String(request._id) ? 'active' : ''}
              onClick={() => setSelectedId(request._id)}
            >
              <strong>{request.name}</strong>
              <span>{request.email}</span>
              <small>{getVerifiedCount(request)}/{sections.length} verified</small>
            </button>
          ))}
          {!loading && !filteredRequests.length && <div className="RegisterRequest-empty">No pending requests</div>}
        </aside>

        <main className="RegisterRequest-detail">
          {!selected ? (
            <div className="RegisterRequest-placeholder">Select a register request to verify details.</div>
          ) : (
            <>
              <section className="RegisterRequest-summary">
                <div>
                  <h2>{selected.name}</h2>
                  <p>{selected.email} • {selected.companyCode} • {getName(selected.branch) || 'No branch'}</p>
                </div>
                <div className="RegisterRequest-actions">
                  <span>{verifiedCount}/{sections.length} sections verified</span>
                  <button type="button" onClick={saveDetails} disabled={!canVerify || saving}>
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Details'}
                  </button>
                  <button type="button" className="RegisterRequest-activate" onClick={activateUser} disabled={!canVerify || !allVerified}>
                    <UserCheck size={18} />
                    Activate
                  </button>
                </div>
              </section>

              <section className="RegisterRequest-documents">
                <h3><FileText size={18} /> Uploaded Documents</h3>
                <div>
                  {(selected.documents || []).map(doc => (
                    <a key={doc._id} href={`${documentBaseUrl}${doc.viewUrl}`} target="_blank" rel="noreferrer">
                      {doc.name}
                    </a>
                  ))}
                  {!selected.documents?.length && <span>No documents uploaded</span>}
                </div>
              </section>

              {sections.map(section => {
                const verification = verificationBySection[section.key] || {};
                return (
                  <section className="RegisterRequest-section" key={section.key}>
                    <div className="RegisterRequest-section-head">
                      <div>
                        <h3>{section.title}</h3>
                        {verification.verified && (
                          <p><ShieldCheck size={14} /> Verified by {verification.verifierName || 'Verifier'}</p>
                        )}
                      </div>
                      <label className="RegisterRequest-verify">
                        <input
                          type="checkbox"
                          checked={Boolean(verification.verified)}
                          disabled={!canVerify}
                          onChange={event => toggleVerify(section.key, event.target.checked)}
                        />
                        <CheckCircle2 size={18} />
                        Verify
                      </label>
                    </div>
                    <div className="RegisterRequest-fields">
                      {section.fields.map(renderInput)}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
