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
  History,
  Calendar,
  Download,
  TrendingUp,
  Award,
  Filter,
  Check,
  X,
} from 'lucide-react';
import './CompanyAiSettings.css';

export default function CompanyAiSettings() {
  const [activeTab, setActiveTab] = useState('key'); // 'key', 'employees', or 'history'
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
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkQuotaInput, setBulkQuotaInput] = useState('');
  const [savingUserId, setSavingUserId] = useState(null);

  // History tab state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyDateRange, setHistoryDateRange] = useState('7d'); // 'today' | '7d' | '30d' | 'month' | 'custom'
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyKeySource, setHistoryKeySource] = useState('all'); // 'all' | 'platform' | 'client'
  const [historyDeptFilter, setHistoryDeptFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historySubView, setHistorySubView] = useState('daily'); // 'daily' or 'leaderboard'

  // Retrieve current company ID
  const companyId = useMemo(() => {
    try {
      const getStored = (key) => {
        try {
          const sVal = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
          if (sVal) return JSON.parse(sVal);
          const lVal = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
          if (lVal) return JSON.parse(lVal);
          return null;
        } catch {
          return null;
        }
      };
      const user = getStored('user') || getStored('currentUser');
      const rawUserComp = user?.company?._id || user?.company || user?.companyId;
      if (rawUserComp && typeof rawUserComp === 'string') return rawUserComp;
      if (rawUserComp && typeof rawUserComp === 'object') return rawUserComp._id || rawUserComp.id || '';

      const storedCompany = getStored('companyDetails') || getStored('company');
      const scId = storedCompany?._id || storedCompany?.id;
      if (scId) return String(scId);

      return '';
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

  const getCalculatedDateRange = useCallback((rangeKey) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = end;

    if (rangeKey === 'today') {
      start = end;
    } else if (rangeKey === '7d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (rangeKey === '30d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
    } else if (rangeKey === 'month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = d.toISOString().split('T')[0];
    }
    return { start, end };
  }, []);

  const fetchHistory = useCallback(async (start, end, keySource, dept, search) => {
    if (!companyId) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);
      if (keySource && keySource !== 'all') params.set('keySource', keySource);
      if (dept && dept !== 'ALL') params.set('department', dept);
      if (search && search.trim()) params.set('search', search.trim());

      const res = await axios.get(`/company/${companyId}/ai-settings/history?${params.toString()}`);
      if (res.data?.success) {
        setHistoryData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load AI usage history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [companyId]);

  const handleExportCsv = () => {
    if (!historyData) return;
    const { dailyBreakdown, employeeLeaderboard } = historyData;

    let csv = "=== DAILY AI TOKEN CONSUMPTION ===\r\n";
    csv += "Date,Platform Tokens,BYOK Tokens,Total Tokens,AI Requests,Active Employees\r\n";
    (dailyBreakdown || []).forEach(row => {
      csv += `"${row.date}",${row.platformTokens || 0},${row.byokTokens || 0},${row.totalTokens || 0},${row.calls || 0},${row.activeUsersCount || 0}\r\n`;
    });

    csv += "\r\n=== EMPLOYEE CONSUMPTION LEADERBOARD ===\r\n";
    csv += "Rank,Employee Name,Email,Department,Job Role,Platform Tokens,BYOK Tokens,Total Tokens,AI Requests,Percent of Total\r\n";
    (employeeLeaderboard || []).forEach(emp => {
      csv += `${emp.rank},"${emp.name}","${emp.email}","${emp.department}","${emp.jobRole}",${emp.platformTokens || 0},${emp.byokTokens || 0},${emp.totalTokens || 0},${emp.calls || 0},"${emp.percentOfTotal}%"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CIIS_AI_Token_History_${historyStartDate || 'from'}_to_${historyEndDate || 'to'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    return ['ALL', ...Array.from(set).sort()];
  }, [employees]);

  const roles = useMemo(() => {
    const set = new Set(
      employees
        .map(e => e.jobRole || e.companyRole)
        .filter(Boolean)
    );
    return ['ALL', ...Array.from(set).sort()];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.jobRole?.toLowerCase().includes(q) ||
        emp.companyRole?.toLowerCase().includes(q);
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const empRole = emp.jobRole || emp.companyRole;
      const matchesRole = roleFilter === 'ALL' || empRole === roleFilter;
      return matchesSearch && matchesDept && matchesRole;
    });
  }, [employees, searchQuery, departmentFilter, roleFilter]);

  const selectableEmployees = useMemo(
    () => filteredEmployees.filter(e => !e.isOwnerAdmin),
    [filteredEmployees]
  );

  const isAllSelected =
    selectableEmployees.length > 0 &&
    selectableEmployees.every(e => selectedIds.includes(e._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableEmployees.map(e => e._id));
    }
  };

  const toggleSelectOne = (empId) => {
    setSelectedIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleBulkUpdate = async (updates, label = 'Updated') => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      const res = await axios.put(
        `/company/${companyId}/ai-settings/employees/bulk`,
        { userIds: selectedIds, updates }
      );
      if (res.data?.success) {
        showNotice('success', res.data.message || `${label} ${selectedIds.length} employees`);
        setSelectedIds([]);
        fetchEmployees();
      }
    } catch (err) {
      showNotice('error', err.response?.data?.message || 'Failed to bulk update');
    } finally {
      setBulkLoading(false);
    }
  };

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

      {aiApiKeySource !== 'client' && companyPlanTokens === 0 && companyExtraTokens === 0 && (
        <div className="company-ai-alert warning" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', color: '#b45309', marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>Aapki company ke active plan mein AI Assistant shamil nahi hai. AI tokens activate karne ke liye Super Admin se plan upgrade karwayein.</span>
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
        <button
          type="button"
          className={`company-ai-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            if (!historyData) {
              const { start, end } = getCalculatedDateRange('7d');
              setHistoryStartDate(start);
              setHistoryEndDate(end);
              fetchHistory(start, end, historyKeySource, historyDeptFilter, historySearch);
            }
          }}
        >
          <History size={16} /> Token Usage & History
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

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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

              <select
                className="company-ai-input"
                style={{ width: '160px', fontSize: '13px' }}
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role === 'ALL' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="company-ai-bulk-actions-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="company-ai-bulk-counter">
                  {selectedIds.length} {selectedIds.length === 1 ? 'employee' : 'employees'} selected
                </span>
                <button
                  type="button"
                  className="company-ai-btn-bulk company-ai-btn-bulk-enable"
                  disabled={bulkLoading}
                  onClick={() => handleBulkUpdate({ enabled: true }, 'Enabled AI Access for')}
                >
                  <Check size={14} /> Enable AI Access
                </button>
                <button
                  type="button"
                  className="company-ai-btn-bulk company-ai-btn-bulk-disable"
                  disabled={bulkLoading}
                  onClick={() => handleBulkUpdate({ enabled: false }, 'Disabled AI Access for')}
                >
                  <X size={14} /> Disable AI Access
                </button>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="e.g. 15000"
                    className="company-ai-input"
                    style={{ width: '110px', padding: '5px 8px', fontSize: '12px' }}
                    value={bulkQuotaInput}
                    onChange={e => setBulkQuotaInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="company-ai-btn-bulk company-ai-btn-bulk-quota"
                    disabled={bulkLoading || !bulkQuotaInput}
                    onClick={() => {
                      const val = Number(bulkQuotaInput);
                      if (val > 0) {
                        handleBulkUpdate({ customDailyTokenLimit: val }, `Set ${val.toLocaleString()} tokens for`);
                        setBulkQuotaInput('');
                      }
                    }}
                  >
                    Set Quota
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="company-ai-btn-bulk-clear"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </button>
            </div>
          )}

          <div className="company-ai-table-container">
            <table className="company-ai-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label="Select all employees"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
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
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No employees found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const isSaving = savingUserId === emp._id;
                    const isSelected = selectedIds.includes(emp._id);
                    const usedTokens = emp.todayUsage?.tokensUsed || 0;
                    const limitVal = emp.effectiveTokenLimit === 'Unlimited' ? Infinity : Number(emp.effectiveTokenLimit || defaultTokens);
                    const percent = limitVal !== Infinity && limitVal > 0 ? Math.min(100, Math.round((usedTokens / limitVal) * 100)) : 0;
                    const isOver = percent >= 100;

                    return (
                      <tr key={emp._id} style={{ background: isSelected ? '#f0f7ff' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          {emp.isOwnerAdmin ? (
                            <span title="Owner / Admin (Permanent Access)" style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                          ) : (
                            <input
                              type="checkbox"
                              aria-label={`Select ${emp.name}`}
                              checked={isSelected}
                              onChange={() => toggleSelectOne(emp._id)}
                            />
                          )}
                        </td>
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

      {/* TAB 3: Token Usage & History */}
      {activeTab === 'history' && (
        <div className="company-ai-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="company-ai-card-title" style={{ margin: 0 }}>
                <History size={20} color="#2563eb" /> AI Token Consumption & Usage History
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Historical audit trail of token consumption, employee activity, and Platform vs BYOK differentiation.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="company-ai-export-btn"
                onClick={handleExportCsv}
                disabled={!historyData || historyLoading}
              >
                <Download size={15} /> Export CSV
              </button>

              <button
                type="button"
                className="company-ai-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '13px' }}
                onClick={() => fetchHistory(historyStartDate, historyEndDate, historyKeySource, historyDeptFilter, historySearch)}
                disabled={historyLoading}
              >
                <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              {/* Quick Date Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> Timeframe:
                </span>
                <div className="company-ai-chip-group">
                  {[
                    { key: 'today', label: 'Today' },
                    { key: '7d', label: 'Last 7 Days' },
                    { key: '30d', label: 'Last 30 Days' },
                    { key: 'month', label: 'This Month' },
                    { key: 'custom', label: 'Custom Range' },
                  ].map(chip => (
                    <button
                      key={chip.key}
                      type="button"
                      className={`company-ai-chip ${historyDateRange === chip.key ? 'active' : ''}`}
                      onClick={() => {
                        setHistoryDateRange(chip.key);
                        if (chip.key !== 'custom') {
                          const { start, end } = getCalculatedDateRange(chip.key);
                          setHistoryStartDate(start);
                          setHistoryEndDate(end);
                          fetchHistory(start, end, historyKeySource, historyDeptFilter, historySearch);
                        }
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Source Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={14} /> Key Source:
                </span>
                <select
                  className="company-ai-input"
                  style={{ width: '200px', padding: '6px 10px', fontSize: '13px' }}
                  value={historyKeySource}
                  onChange={e => {
                    setHistoryKeySource(e.target.value);
                    fetchHistory(historyStartDate, historyEndDate, e.target.value, historyDeptFilter, historySearch);
                  }}
                >
                  <option value="all">All Sources (Platform + BYOK)</option>
                  <option value="platform">🔵 Platform Quota Only</option>
                  <option value="client">🟣 Own BYOK Key Only</option>
                </select>
              </div>
            </div>

            {/* Custom Range Picker (if custom selected) */}
            {historyDateRange === 'custom' && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>From:</span>
                  <input
                    type="date"
                    className="company-ai-input"
                    style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                    value={historyStartDate}
                    onChange={e => setHistoryStartDate(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>To:</span>
                  <input
                    type="date"
                    className="company-ai-input"
                    style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                    value={historyEndDate}
                    onChange={e => setHistoryEndDate(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="company-ai-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                  onClick={() => fetchHistory(historyStartDate, historyEndDate, historyKeySource, historyDeptFilter, historySearch)}
                >
                  Apply Filter
                </button>
              </div>
            )}
          </div>

          {/* History KPI Cards */}
          {historyData && (
            <div className="company-ai-stats-grid" style={{ marginBottom: '24px' }}>
              <div className="company-ai-stat-card">
                <div className="company-ai-stat-icon indigo">
                  <Coins size={22} />
                </div>
                <div className="company-ai-stat-info">
                  <h3>{(historyData.summary?.totalTokens || 0).toLocaleString()}</h3>
                  <p>Total Tokens in Period</p>
                </div>
              </div>

              <div className="company-ai-stat-card">
                <div className="company-ai-stat-icon blue">
                  <Zap size={22} />
                </div>
                <div className="company-ai-stat-info">
                  <h3>{(historyData.summary?.platformTokens || 0).toLocaleString()}</h3>
                  <p>
                    <span className="company-ai-badge-platform" style={{ padding: '2px 8px', fontSize: '11px', marginRight: '4px' }}>Platform</span>
                    Plan Quota Tokens
                  </p>
                </div>
              </div>

              <div className="company-ai-stat-card">
                <div className="company-ai-stat-icon purple">
                  <KeyRound size={22} />
                </div>
                <div className="company-ai-stat-info">
                  <h3>{(historyData.summary?.byokTokens || 0).toLocaleString()}</h3>
                  <p>
                    <span className="company-ai-badge-byok" style={{ padding: '2px 8px', fontSize: '11px', marginRight: '4px' }}>BYOK</span>
                    Own Groq Key Tokens
                  </p>
                </div>
              </div>

              <div className="company-ai-stat-card">
                <div className="company-ai-stat-icon amber">
                  <Award size={22} />
                </div>
                <div className="company-ai-stat-info">
                  <h3 style={{ fontSize: '16px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                    {historyData.summary?.topUser?.name || 'None'}
                  </h3>
                  <p>
                    Top Active User
                    {historyData.summary?.topUser ? ` (${(historyData.summary.topUser.tokens || 0).toLocaleString()} tokens)` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view switcher: Daily Breakdown vs Leaderboard */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`company-ai-tab-btn ${historySubView === 'daily' ? 'active' : ''}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setHistorySubView('daily')}
              >
                <Calendar size={15} /> Daily Consumption Log ({(historyData?.dailyBreakdown || []).length} days)
              </button>
              <button
                type="button"
                className={`company-ai-tab-btn ${historySubView === 'leaderboard' ? 'active' : ''}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setHistorySubView('leaderboard')}
              >
                <TrendingUp size={15} /> Employee Consumption Leaderboard ({(historyData?.employeeLeaderboard || []).length})
              </button>
            </div>

            {historySubView === 'leaderboard' && (
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search user..."
                  className="company-ai-input"
                  style={{ paddingLeft: '32px', padding: '6px 12px 6px 32px', fontSize: '13px' }}
                  value={historySearch}
                  onChange={e => {
                    setHistorySearch(e.target.value);
                    fetchHistory(historyStartDate, historyEndDate, historyKeySource, historyDeptFilter, e.target.value);
                  }}
                />
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {historyLoading && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#2563eb' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Loading historical token records...</p>
            </div>
          )}

          {/* SUB-VIEW 1: Daily Breakdown Table */}
          {!historyLoading && historySubView === 'daily' && (
            <div className="company-ai-table-container">
              <table className="company-ai-table">
                <thead>
                  <tr>
                    <th>Date (IST)</th>
                    <th>Platform Quota Tokens</th>
                    <th>Own BYOK Tokens</th>
                    <th>Total Tokens Used</th>
                    <th>AI Requests (Turns)</th>
                    <th>Active Employees</th>
                    <th>Key Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {!historyData?.dailyBreakdown?.length ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No token consumption recorded for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    historyData.dailyBreakdown.map((row) => {
                      const total = row.totalTokens || 0;
                      const platformPct = total > 0 ? Math.round(((row.platformTokens || 0) / total) * 100) : 0;
                      const byokPct = total > 0 ? Math.round(((row.byokTokens || 0) / total) * 100) : 0;

                      return (
                        <tr key={row.date}>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{row.date}</strong>
                          </td>
                          <td>
                            <span className="company-ai-badge-platform" style={{ padding: '3px 10px', fontSize: '12px' }}>
                              {(row.platformTokens || 0).toLocaleString()}
                            </span>
                          </td>
                          <td>
                            {(row.byokTokens || 0) > 0 ? (
                              <span className="company-ai-badge-byok">
                                {(row.byokTokens || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>0</span>
                            )}
                          </td>
                          <td>
                            <strong style={{ color: '#1e293b' }}>{total.toLocaleString()}</strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', color: '#475569' }}>{row.calls} calls</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', color: '#475569' }}>{row.activeUsersCount} active</span>
                          </td>
                          <td style={{ minWidth: '140px' }}>
                            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#f1f5f9' }}>
                              <div style={{ width: `${platformPct}%`, background: '#2563eb' }} title={`Platform: ${platformPct}%`} />
                              <div style={{ width: `${byokPct}%`, background: '#7c3aed' }} title={`BYOK: ${byokPct}%`} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                              <span>{platformPct}% Plat</span>
                              <span>{byokPct}% BYOK</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW 2: Employee Leaderboard Table */}
          {!historyLoading && historySubView === 'leaderboard' && (
            <div className="company-ai-table-container">
              <table className="company-ai-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Rank</th>
                    <th>Employee</th>
                    <th>Department & Role</th>
                    <th>Platform Tokens</th>
                    <th>Own BYOK Tokens</th>
                    <th>Total Tokens</th>
                    <th>AI Requests</th>
                    <th>% Share of Company</th>
                  </tr>
                </thead>
                <tbody>
                  {!historyData?.employeeLeaderboard?.length ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No employee token activity found for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    historyData.employeeLeaderboard.map((emp) => {
                      const rankClass = emp.rank === 1 ? 'gold' : emp.rank === 2 ? 'silver' : emp.rank === 3 ? 'bronze' : 'default';

                      return (
                        <tr key={emp.userId}>
                          <td>
                            <span className={`company-ai-rank-badge ${rankClass}`}>
                              {emp.rank}
                            </span>
                          </td>
                          <td>
                            <div>
                              <strong style={{ color: '#0f172a', fontSize: '14px' }}>{emp.name}</strong>
                              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>{emp.email}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{emp.department}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{emp.jobRole}</span>
                          </td>
                          <td>
                            <span className="company-ai-badge-platform" style={{ padding: '2px 8px', fontSize: '12px' }}>
                              {(emp.platformTokens || 0).toLocaleString()}
                            </span>
                          </td>
                          <td>
                            {(emp.byokTokens || 0) > 0 ? (
                              <span className="company-ai-badge-byok" style={{ padding: '2px 8px', fontSize: '12px' }}>
                                {(emp.byokTokens || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>0</span>
                            )}
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{(emp.totalTokens || 0).toLocaleString()}</strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', color: '#475569' }}>{emp.calls} calls</span>
                          </td>
                          <td style={{ minWidth: '130px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(100, emp.percentOfTotal || 0)}%`,
                                    background: 'linear-gradient(90deg, #3b82f6 0%, #7c3aed 100%)',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                {emp.percentOfTotal}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
