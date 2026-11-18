import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from '../../utils/axiosConfig';
import {
  Bot,
  KeyRound,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Save,
  Activity,
  Layers,
  Coins,
  PlusCircle,
} from 'lucide-react';
import './CompanyAiSettings.css';

export default function CompanyAiSettings() {
  const [activeTab, setActiveTab] = useState('key'); // 'key' or 'employees'
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [notice, setNotice] = useState(null);

  // Settings state
  const [aiApiKeySource, setAiApiKeySource] = useState('platform');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState(null);
  const [defaultTokens, setDefaultTokens] = useState(10000);
  const [defaultCalls, setDefaultCalls] = useState(30);
  const [companyPlanTokens, setCompanyPlanTokens] = useState(25000);
  const [companyExtraTokens, setCompanyExtraTokens] = useState(0);
  const [companyExtraCalls, setCompanyExtraCalls] = useState(0);
  const [companyExtraStt, setCompanyExtraStt] = useState(0);
  const [companyCallsLimit, setCompanyCallsLimit] = useState(35);
  const [companySttLimit, setCompanySttLimit] = useState(100);
  const [todayUsage, setTodayUsage] = useState({ totalTokens: 0, totalCalls: 0, activeUsersCount: 0 });

  // Employees state
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [savingUserId, setSavingUserId] = useState(null);

  // Retrieve current company ID
  const companyId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const storedCompany = JSON.parse(localStorage.getItem('companyDetails') || '{}');
      return (
        user?.company?._id ||
        user?.company ||
        storedCompany?._id ||
        storedCompany?.id ||
        user?.companyId ||
        ''
      );
    } catch {
      return '';
    }
  }, []);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 6000);
  };

  const fetchSettings = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/company/${companyId}/ai-settings`);
      if (res.data?.success) {
        const d = res.data.data;
        setAiApiKeySource(d.aiApiKeySource || 'platform');
        setHasCustomApiKey(d.hasCustomApiKey);
        setMaskedKey(d.maskedKey);
        setDefaultTokens(d.byokDefaultEmployeeDailyTokens ?? 10000);
        setDefaultCalls(d.byokDefaultEmployeeDailyCalls ?? 30);
        setCompanyPlanTokens(d.companyDailyTokenLimit ?? d.platformPlanTokenLimit ?? 25000);
        setCompanyExtraTokens(Number(d.companyExtraTokens || 0));
        setCompanyExtraCalls(Number(d.companyExtraCalls || 0));
        setCompanyExtraStt(Number(d.companyExtraStt || 0));
        setCompanyCallsLimit(d.companyDailyCallLimit ?? 35);
        setCompanySttLimit(d.companyDailySttLimit ?? 100);
        setTodayUsage(d.todayUsage || { totalTokens: 0, totalCalls: 0, activeUsersCount: 0 });
      }
    } catch (err) {
      console.error('Failed to load company AI settings', err);
      showNotice('error', err.response?.data?.message || 'Failed to load company AI settings.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchEmployees = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await axios.get(`/company/${companyId}/ai-settings/employees`);
      if (res.data?.success) {
        setEmployees(res.data.data?.employees || []);
      }
    } catch (err) {
      console.error('Failed to load employee token allocations', err);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSettings();
    fetchEmployees();
  }, [fetchSettings, fetchEmployees]);

  const handleTestKey = async () => {
    if (!customApiKey && !hasCustomApiKey) {
      showNotice('error', 'Please enter a Groq API Key to test.');
      return;
    }
    try {
      setTestingKey(true);
      const res = await axios.post(`/company/${companyId}/ai-settings/test-key`, {
        apiKey: customApiKey || undefined,
      });
      if (res.data?.success) {
        showNotice('success', `API Key Validated! Connected to ${res.data.model}.`);
      }
    } catch (err) {
      showNotice('error', err.response?.data?.message || 'Groq connection failed. Please check the API key.');
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingKey(true);
      const payload = {
        aiApiKeySource,
        byokDefaultEmployeeDailyTokens: Number(defaultTokens),
        byokDefaultEmployeeDailyCalls: Number(defaultCalls),
      };
      if (customApiKey && !customApiKey.includes('...')) {
        payload.customGroqApiKey = customApiKey;
      }
      const res = await axios.put(`/company/${companyId}/ai-settings/key`, payload);
      if (res.data?.success) {
        showNotice('success', 'Company AI configuration updated successfully.');
        setCustomApiKey('');
        fetchSettings();
      }
    } catch (err) {
      showNotice('error', err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleUpdateEmployee = async (empId, updates) => {
    try {
      setSavingUserId(empId);
      const res = await axios.put(`/company/${companyId}/ai-settings/employees/${empId}`, updates);
      if (res.data?.success) {
        setEmployees(prev =>
          prev.map(emp => (emp._id === empId ? { ...emp, ...updates, aiConfig: { ...emp.aiConfig, ...updates } } : emp))
        );
        showNotice('success', res.data.message || 'Updated employee allocation');
        fetchEmployees();
      }
    } catch (err) {
      showNotice('error', err.response?.data?.message || 'Failed to update employee allocation');
    } finally {
      setSavingUserId(null);
    }
  };

  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.jobRole?.toLowerCase().includes(q);
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, departmentFilter]);

  if (loading) {
    return (
      <div className="company-ai-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <RefreshCw size={36} className="animate-spin text-blue-600" style={{ margin: '0 auto 16px auto', display: 'block' }} />
        <p style={{ color: '#64748b', fontSize: '15px' }}>Loading Company AI & Token Settings...</p>
      </div>
    );
  }

  return (
    <div className="company-ai-container">
      {/* Header */}
      <div className="company-ai-header">
        <div className="company-ai-title-wrap">
          <h1>
            <Bot size={28} color="#2563eb" /> Company AI & Token Manager
          </h1>
          <p>
            Configure your own Groq API Key (BYOK) and allocate daily token quotas for your company employees.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="company-ai-btn-secondary"
            onClick={() => { fetchSettings(); fetchEmployees(); }}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            <RefreshCw size={14} /> Refresh Stats
          </button>
          {aiApiKeySource === 'client' ? (
            <span className="company-ai-badge-active">
              <Zap size={14} /> BYOK Custom Key Active {maskedKey ? `(${maskedKey})` : ''}
            </span>
          ) : (
            <span className="company-ai-badge-platform">
              <ShieldCheck size={14} /> Platform Standard Plan Active
            </span>
          )}
        </div>
      </div>

      {notice && (
        <div className={`company-ai-alert ${notice.type}`}>
          {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Top Stats Overview */}
      <div className="company-ai-stats-grid">
        <div className="company-ai-stat-card">
          <div className="company-ai-stat-icon blue">
            <Zap size={22} />
          </div>
          <div className="company-ai-stat-info">
            <h3>{(todayUsage.totalTokens || 0).toLocaleString()}</h3>
            <p>Tokens Used Today</p>
          </div>
        </div>

        <div className="company-ai-stat-card">
          <div className="company-ai-stat-icon emerald">
            <ShieldCheck size={22} />
          </div>
          <div className="company-ai-stat-info">
            <h3>
              {aiApiKeySource === 'client' ? 'BYOK Mode' : companyPlanTokens.toLocaleString()}
            </h3>
            <p>{aiApiKeySource === 'client' ? 'Use Your Own API Key' : 'Company Daily Quota'}</p>
          </div>
        </div>

        <div className="company-ai-stat-card">
          <div className="company-ai-stat-icon indigo">
            <Coins size={22} />
          </div>
          <div className="company-ai-stat-info">
            <h3 style={{ color: (companyExtraTokens > 0 || companyExtraCalls > 0 || companyExtraStt > 0) ? '#4f46e5' : '#0f172a' }}>
              {companyExtraTokens > 0 ? `+${companyExtraTokens.toLocaleString()}` : '0'}
            </h3>
            <p>
              Extra Top-Up Tokens
              {(companyExtraCalls > 0 || companyExtraStt > 0) ? ` (+${companyExtraCalls}c / +${companyExtraStt}v)` : ''}
            </p>
          </div>
        </div>

        <div className="company-ai-stat-card">
          <div className="company-ai-stat-icon purple">
            <Sliders size={22} />
          </div>
          <div className="company-ai-stat-info">
            <h3>{defaultTokens.toLocaleString()}</h3>
            <p>Per-Employee Daily Limit</p>
          </div>
        </div>

        <div className="company-ai-stat-card">
          <div className="company-ai-stat-icon amber">
            <Users size={22} />
          </div>
          <div className="company-ai-stat-info">
            <h3>{todayUsage.activeUsersCount || 0}</h3>
            <p>Active Employees Today</p>
          </div>
        </div>
      </div>

      {/* Company Plan Usage Progress Bar (Platform Managed AI) */}
      {aiApiKeySource !== 'client' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                Company Daily Plan Usage Today
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: ((todayUsage.totalTokens || 0) / (companyPlanTokens || 1)) >= 1 ? '#dc2626' : '#059669',
                background: ((todayUsage.totalTokens || 0) / (companyPlanTokens || 1)) >= 1 ? '#fef2f2' : '#ecfdf5',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {((todayUsage.totalTokens || 0) / (companyPlanTokens || 1)) >= 1 ? 'Daily Quota Exhausted' : 'Quota Active'}
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              <strong>{(todayUsage.totalTokens || 0).toLocaleString()}</strong> / {companyPlanTokens.toLocaleString()} tokens
              <span style={{ color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
                ({companyPlanTokens > 0 ? Math.min(100, Math.round(((todayUsage.totalTokens || 0) / companyPlanTokens) * 100)) : 0}%)
              </span>
              {companyExtraTokens > 0 && (
                <span style={{ marginLeft: '12px', color: '#4f46e5', fontWeight: 600 }}>
                  • +{companyExtraTokens.toLocaleString()} extra top-up in reserve
                </span>
              )}
            </div>
          </div>
          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '4px',
                width: `${companyPlanTokens > 0 ? Math.min(100, ((todayUsage.totalTokens || 0) / companyPlanTokens) * 100) : 0}%`,
                background: ((todayUsage.totalTokens || 0) / (companyPlanTokens || 1)) >= 1 ? '#ef4444' : 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="company-ai-tabs">
        <button
          type="button"
          className={`company-ai-tab-btn ${activeTab === 'key' ? 'active' : ''}`}
          onClick={() => setActiveTab('key')}
        >
          <KeyRound size={16} /> Groq API Key & BYOK Settings
        </button>
        <button
          type="button"
          className={`company-ai-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={16} /> Employee Token Allocation ({employees.length})
        </button>
      </div>

      {/* TAB 1: Key Management */}
      {activeTab === 'key' && (
        <div className="company-ai-card">
          <h2 className="company-ai-card-title">
            <KeyRound size={20} color="#2563eb" /> AI Key Source & BYOK Configuration
          </h2>

          <div className="company-ai-input-group" style={{ marginBottom: '24px' }}>
            <label className="company-ai-label">Select AI Key Source for your Company</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="keySource"
                  value="platform"
                  checked={aiApiKeySource === 'platform'}
                  onChange={e => setAiApiKeySource(e.target.value)}
                />
                <strong>Platform Managed AI</strong> (Uses CIIS Network Plan Quota)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="keySource"
                  value="client"
                  checked={aiApiKeySource === 'client'}
                  onChange={e => setAiApiKeySource(e.target.value)}
                />
                <strong>Own Groq API Key (BYOK)</strong> (Use Your Own API Key)
              </label>
            </div>

            {aiApiKeySource === 'platform' && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                💡 <strong>Current Platform Subscription:</strong> Your company has <strong>{companyPlanTokens.toLocaleString()} tokens/day</strong>
                {companyExtraTokens > 0 ? ` (+${companyExtraTokens.toLocaleString()} extra tokens)` : ''} • {companyCallsLimit} requests/day
                {companyExtraCalls > 0 ? ` (+${companyExtraCalls} extra calls)` : ''} • {companySttLimit} voice notes/day
                {companyExtraStt > 0 ? ` (+${companyExtraStt} extra voice)` : ''}.
              </div>
            )}
          </div>

          <div className="company-ai-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="company-ai-label" style={{ margin: 0 }}>Company Groq API Key</label>
              {hasCustomApiKey && (
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                  Active on file: {maskedKey}
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="company-ai-input"
                placeholder={hasCustomApiKey ? `Current: ${maskedKey} (Enter new to replace)` : 'gsk_...'}
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              You can get a free, high-speed Groq API key from{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                console.groq.com/keys
              </a>.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="company-ai-input-group" style={{ margin: 0 }}>
              <label className="company-ai-label">Default Daily Token Quota per Employee</label>
              <input
                type="number"
                min="1000"
                step="1000"
                className="company-ai-input"
                value={defaultTokens}
                onChange={e => setDefaultTokens(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[5000, 10000, 25000, 50000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDefaultTokens(val)}
                    style={{
                      background: Number(defaultTokens) === val ? '#eff6ff' : '#f8fafc',
                      color: Number(defaultTokens) === val ? '#2563eb' : '#64748b',
                      border: `1px solid ${Number(defaultTokens) === val ? '#bfdbfe' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Standard allocation for each employee every day (~12-15 task parses).
              </span>
            </div>

            <div className="company-ai-input-group" style={{ margin: 0 }}>
              <label className="company-ai-label">Default Daily AI Requests per Employee</label>
              <input
                type="number"
                min="5"
                className="company-ai-input"
                value={defaultCalls}
                onChange={e => setDefaultCalls(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Max AI request turns per employee daily.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="company-ai-btn-secondary"
              onClick={handleTestKey}
              disabled={testingKey}
            >
              {testingKey ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Test Connection
            </button>

            <button
              type="button"
              className="company-ai-btn-primary"
              onClick={handleSaveSettings}
              disabled={savingKey}
            >
              {savingKey ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Save & Apply Configuration
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Employee Token Allocation */}
      {activeTab === 'employees' && (
        <div className="company-ai-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="company-ai-card-title" style={{ margin: 0 }}>
                <Users size={20} color="#2563eb" /> Employee Token Quota Allocations
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Control which team members have AI access and assign custom daily token limits.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search employee..."
                  className="company-ai-input"
                  style={{ paddingLeft: '32px', fontSize: '13px' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="company-ai-input"
                style={{ width: '160px', fontSize: '13px' }}
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'ALL' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="company-ai-table-container">
            <table className="company-ai-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>AI Access</th>
                  <th>Daily Token Quota</th>
                  <th>Unlimited</th>
                  <th>Today's Consumption</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No employees found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const isSaving = savingUserId === emp._id;
                    const usedTokens = emp.todayUsage?.tokensUsed || 0;
                    const limitVal = emp.effectiveTokenLimit === 'Unlimited' ? Infinity : Number(emp.effectiveTokenLimit || defaultTokens);
                    const percent = limitVal !== Infinity && limitVal > 0 ? Math.min(100, Math.round((usedTokens / limitVal) * 100)) : 0;
                    const isOver = percent >= 100;

                    return (
                      <tr key={emp._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email}</div>
                        </td>

                        <td>
                          <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                            {emp.department}
                          </span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {emp.jobRole || emp.companyRole}
                          </div>
                        </td>

                        <td>
                          {emp.isOwnerAdmin ? (
                            <span style={{ color: '#059669', fontWeight: 600, fontSize: '12px' }}>Owner / Admin</span>
                          ) : (
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={emp.aiConfig.enabled}
                                onChange={e => handleUpdateEmployee(emp._id, { enabled: e.target.checked })}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 500, color: emp.aiConfig.enabled ? '#059669' : '#dc2626' }}>
                                {emp.aiConfig.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </label>
                          )}
                        </td>

                        <td>
                          {emp.isOwnerAdmin || emp.aiConfig.isUnlimited ? (
                            <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '12px' }}>Unlimited</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                min="1000"
                                step="1000"
                                className="company-ai-input"
                                style={{ width: '110px', padding: '6px 10px', fontSize: '13px' }}
                                defaultValue={emp.aiConfig.customDailyTokenLimit ?? defaultTokens}
                                onBlur={e => {
                                  const val = Number(e.target.value);
                                  if (!isNaN(val) && val !== (emp.aiConfig.customDailyTokenLimit ?? defaultTokens)) {
                                    handleUpdateEmployee(emp._id, { customDailyTokenLimit: val });
                                  }
                                }}
                              />
                              <span style={{ fontSize: '11px', color: '#64748b' }}>tokens</span>
                            </div>
                          )}
                        </td>

                        <td>
                          {emp.isOwnerAdmin ? (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Auto</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={emp.aiConfig.isUnlimited}
                              onChange={e => handleUpdateEmployee(emp._id, { isUnlimited: e.target.checked })}
                            />
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '12px', fontWeight: 500 }}>
                            {usedTokens.toLocaleString()} / {emp.effectiveTokenLimit === 'Unlimited' ? '∞' : Number(limitVal).toLocaleString()}
                            <span style={{ color: '#64748b', marginLeft: '6px' }}>({emp.todayUsage?.count || 0} calls)</span>
                          </div>
                          {emp.effectiveTokenLimit !== 'Unlimited' && (
                            <div className="company-ai-progress-bar-bg">
                              <div
                                className={`company-ai-progress-bar-fill ${isOver ? 'danger' : percent > 75 ? 'warning' : ''}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          )}
                        </td>

                        <td>
                          {isSaving ? (
                            <RefreshCw size={16} className="animate-spin text-blue-600" />
                          ) : (
                            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>Saved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
