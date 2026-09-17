import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUploadCloud,
  FiDownload,
  FiClock,
  FiRefreshCw,
  FiFileText,
  FiCheckCircle,
  FiUsers,
  FiFilter,
  FiRotateCcw,
  FiCalendar,
  FiInfo,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiChevronRight,
  FiLayers,
  FiCopy
} from 'react-icons/fi';
import Select from 'react-select';
import api from '../../utils/axiosConfig';
import './ImportExportLeads.css';

const BASE = '/crm/leads/transfer';
const initialFilters = { assignment: 'all', userId: '', dateMode: 'all', date: '', month: '', from: '', to: '' };
const columns = [
  'Full Name', 'Email', 'Phone', 'Gender', 'Lead Date',
  'Address', 'Lead Source', 'Lead Type',
  'Custom Field 1', 'Custom Field 2', 'Custom Field 3', 'Custom Field 4', 'Custom Field 5',
  'Remarks'
];
const requiredColumns = ['Full Name', 'Email', 'Phone', 'Lead Date', 'Lead Source', 'Lead Type'];

const dateTime = value => (value ? new Date(value).toLocaleString() : '-');

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function errorMessage(error) {
  if (error.response?.data instanceof Blob) {
    try {
      return JSON.parse(await error.response.data.text()).message;
    } catch {
      /* use readable fallback */
    }
  }
  return error.response?.data?.message || 'Request failed. Please check your connection and retry.';
}

async function download(path, filename, params) {
  const response = await api.get(BASE + path, { params, responseType: 'blob', cache: false });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ImportExportLeads() {
  const [tab, setTab] = useState('import'); // Default to import section first
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [rowPage, setRowPage] = useState(1);
  const [busy, setBusy] = useState('');
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [users, setUsers] = useState([]);
  const [optionsError, setOptionsError] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsVersion, setOptionsVersion] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [format, setFormat] = useState('xlsx');
  const [count, setCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [countVersion, setCountVersion] = useState(0);
  const [history, setHistory] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load team users for filters
  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsError('');
    api.get(BASE + '/options', { cache: false })
      .then(({ data }) => {
        if (active) setUsers(data.users || []);
      })
      .catch(async err => {
        const message = await errorMessage(err);
        if (active) setOptionsError(message);
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [optionsVersion]);

  // Load import history when on history tab
  useEffect(() => {
    if (tab !== 'history') return;
    let active = true;
    setHistoryLoading(true);
    setHistoryError('');
    api.get(BASE + '/history', { params: { page: historyPage }, cache: false })
      .then(({ data }) => {
        if (active) setHistory(data);
      })
      .catch(async err => {
        const message = await errorMessage(err);
        if (active) setHistoryError(message);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, historyPage, historyVersion]);

  // Auto-fetch matching lead count with debounce when on export tab
  useEffect(() => {
    setCount(null);
    setCountLoading(false);
    if (tab !== 'export') return;
    if (filters.dateMode === 'range' && (!filters.from || !filters.to)) return;
    if (['date', 'week'].includes(filters.dateMode) && !filters.date) return;
    if (filters.dateMode === 'month' && !filters.month) return;

    let active = true;
    setCountLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(BASE + '/export/count', { params: filters, cache: false });
        if (active) setCount(data.count);
      } catch (err) {
        const message = await errorMessage(err);
        if (active) setError(message);
      } finally {
        if (active) setCountLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tab, filters, countVersion]);

  async function run(label, action) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(label);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      setError(await errorMessage(err));
    } finally {
      busyRef.current = false;
      setBusy('');
    }
  }

  function updateFilter(key, value) {
    setFilters(current => ({
      ...current,
      [key]: value,
      ...(key === 'assignment' && value === 'unassigned' ? { userId: '' } : {})
    }));
    setCount(null);
    setError('');
    setNotice('');
  }

  function validateFile(nextFile) {
    if (busyRef.current) return;
    setFile(null);
    setPreview(null);
    setResult(null);
    setRowPage(1);
    setError('');
    setNotice('');
    if (!nextFile) return;
    if (!/\.(xlsx|csv)$/i.test(nextFile.name)) {
      return setError('Invalid file format. Please upload an .xlsx or .csv spreadsheet.');
    }
    if (!nextFile.size) return setError('The file is empty. Please choose a spreadsheet containing leads.');
    if (nextFile.size > 5 * 1024 * 1024) {
      return setError('File size exceeds the 5 MB limit. Please upload a smaller file.');
    }
    setFile(nextFile);
  }

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!busyRef.current) setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const createPreview = () =>
    run('preview', async () => {
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post(BASE + '/preview', form);
      setPreview(data);
      setResult(null);
      setRowPage(1);
    });

  const confirm = id =>
    run('confirm', async () => {
      const { data } = await api.post(`${BASE}/imports/${id}/confirm`);
      setResult(data);
      setRowPage(1);
      setHistoryVersion(v => v + 1);
    });

  const refreshResult = id =>
    run('result', async () => {
      const { data } = await api.get(`${BASE}/imports/${id}`, { cache: false });
      if (data.status === 'preview') {
        setNotice('Import has not started yet. Review the preview and click Confirm Import.');
        return;
      }
      setResult(data);
      setRowPage(1);
      setTab('import');
      setFile(null);
      setPreview(null);
      setHistoryVersion(v => v + 1);
    });

  const rows = result?.rows || preview?.rows || [];
  const batchId = result?.id || preview?.id;
  const rowPages = Math.max(1, Math.ceil(rows.length / 25));
  const teamOptions = users.map(user => ({
    value: user._id,
    label: user.name,
    email: user.email || ''
  }));
  const canResume = result && ['interrupted', 'processing'].includes(result.status);

  // Format React-Select styles for clean modern appearance
  const customSelectStyles = {
    menuPortal: base => ({ ...base, zIndex: 100000 }),
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      height: '38px',
      fontSize: '12.5px',
      borderRadius: '8px',
      borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#ffffff',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : '#94a3b8'
      }
    }),
    placeholder: base => ({
      ...base,
      color: '#94a3b8',
      fontSize: '12.5px'
    }),
    singleValue: base => ({
      ...base,
      color: '#0f172a',
      fontSize: '12.5px',
      fontWeight: '500'
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '12.5px',
      backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1e293b',
      cursor: 'pointer'
    })
  };

  const selectedUserName =
    teamOptions.find(o => o.value === filters.userId)?.label || 'All team members';

  return (
    <div className="ie-root ie-transfer">
      {/* Top Header & Navigation */}
      <header className="ie-page-header">
        <div className="ie-header-left">
          <div className="ie-header-badge">
            <FiUploadCloud />
          </div>
          <div>
            <div className="ie-breadcrumb">
              <span>CRM</span>
              <FiChevronRight className="separator" />
              <span>Admin</span>
              <FiChevronRight className="separator" />
              <span className="active">Import &amp; Export</span>
            </div>
            <h1 className="ie-page-title">Import &amp; Export Leads</h1>
            <p className="ie-page-subtitle">
              Bulk import leads from spreadsheets or export filtered CRM data to Excel &amp; CSV.
            </p>
          </div>
        </div>
        <div className="ie-header-right">
          <Link to="/ciisUser/crm/admin/all-leads" className="ie-header-link-btn">
            <FiUsers /> View All Leads
          </Link>
        </div>
      </header>

      {/* Main Container Card */}
      <section className="ie-card">
        {/* Navigation Tabs */}
        <nav className="ie-tab-bar" aria-label="Lead transfer sections">
          {[
            ['import', FiUploadCloud, 'Import Leads', 'Add leads via spreadsheet'],
            ['export', FiDownload, 'Export Data', 'Filter & download CRM records'],
            ['history', FiClock, 'Import History', 'View past import batches']
          ].map(([key, Icon, label, desc]) => (
            <button
              key={key}
              type="button"
              className={`ie-tab-btn ${tab === key ? 'active' : ''}`}
              aria-pressed={tab === key}
              disabled={!!busy}
              onClick={() => {
                setTab(key);
                setError('');
                setNotice('');
              }}
            >
              <div className="ie-tab-icon-wrap">
                <Icon />
              </div>
              <div className="ie-tab-text">
                <span className="ie-tab-label">{label}</span>
                <span className="ie-tab-desc">{desc}</span>
              </div>
            </button>
          ))}
        </nav>

        {/* Status Alerts */}
        {error && (
          <div role="alert" className="ie-msg msg-error">
            <FiAlertCircle className="msg-icon" />
            <div className="msg-content">{error}</div>
            <button type="button" className="msg-close" onClick={() => setError('')}>
              <FiX />
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="ie-msg msg-success">
            <FiCheckCircle className="msg-icon" />
            <div className="msg-content">{notice}</div>
            <button type="button" className="msg-close" onClick={() => setNotice('')}>
              <FiX />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: EXPORT DATA (Enhanced User-Friendly Layout) */}
        {/* ========================================================================= */}
        {tab === 'export' && (
          <div className="ie-export-section">
            <div className="ie-section-intro">
              <div className="ie-intro-text">
                <div className="ie-intro-tag">
                  <FiFilter /> Export Filters
                </div>
                <h2>Configure Your Lead Export</h2>
                <p>
                  Filter leads by assignment, telecaller, and lead date. Your file will contain all matching records.
                </p>
              </div>
              <div className="ie-intro-actions">
                <button
                  type="button"
                  className="ie-btn-text"
                  disabled={!!busy}
                  onClick={() => {
                    setFilters(initialFilters);
                    setCount(null);
                    setNotice('');
                    setError('');
                  }}
                >
                  <FiRotateCcw size={13} /> Reset Filters
                </button>
              </div>
            </div>

            {optionsError && (
              <div className="ie-msg msg-error" role="alert">
                <FiAlertCircle className="msg-icon" />
                <div className="msg-content">
                  {optionsError}
                  <button
                    type="button"
                    className="ie-btn-retry"
                    disabled={!!busy}
                    onClick={() => setOptionsVersion(v => v + 1)}
                  >
                    Retry team list
                  </button>
                </div>
              </div>
            )}

            {/* Filter Controls Grid */}
            <fieldset className="ie-export-fields" disabled={!!busy}>
              <div className="ie-filter-card">
                <div className="ie-filter-grid">
                  {/* Field 1: Assignment */}
                  <div className="ie-field">
                    <label htmlFor="ie-assignment">
                      <span>Assignment Status</span>
                    </label>
                    <div className="ie-select-wrapper">
                      <select
                        id="ie-assignment"
                        value={filters.assignment}
                        onChange={e => updateFilter('assignment', e.target.value)}
                      >
                        <option value="all">All leads (Assigned &amp; Unassigned)</option>
                        <option value="assigned">Assigned Leads Only</option>
                        <option value="unassigned">Unassigned Leads Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 2: Team member */}
                  <div className="ie-field">
                    <label htmlFor="ie-user">
                      <span>Team Member / Telecaller</span>
                    </label>
                    <Select
                      inputId="ie-user"
                      instanceId="ie-export-user"
                      options={teamOptions}
                      value={teamOptions.find(o => o.value === filters.userId) || null}
                      onChange={option => updateFilter('userId', option?.value || '')}
                      isClearable
                      isLoading={optionsLoading}
                      isDisabled={
                        !!busy ||
                        filters.assignment === 'unassigned' ||
                        optionsLoading ||
                        !!optionsError
                      }
                      placeholder={
                        filters.assignment === 'unassigned'
                          ? 'Disabled for unassigned leads'
                          : 'All team members'
                      }
                      filterOption={({ data }, value) =>
                        `${data.label} ${data.email}`.toLowerCase().includes(value.toLowerCase())
                      }
                      menuPortalTarget={document.body}
                      menuPlacement="auto"
                      maxMenuHeight={220}
                      styles={customSelectStyles}
                    />
                  </div>

                  {/* Field 3: Date Mode */}
                  <div className="ie-field">
                    <label htmlFor="ie-dates">
                      <span>Lead Date Range</span>
                    </label>
                    <div className="ie-select-wrapper">
                      <select
                        id="ie-dates"
                        value={filters.dateMode}
                        onChange={e => updateFilter('dateMode', e.target.value)}
                      >
                        <option value="all">All Dates</option>
                        <option value="date">Single Specific Date</option>
                        <option value="week">Specific Week (Monday – Sunday)</option>
                        <option value="month">Specific Month</option>
                        <option value="range">Custom Date Range (From – To)</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 4: File Format Toggle */}
                  <div className="ie-field">
                    <label>
                      <span>Export File Format</span>
                    </label>
                    <div className="ie-format-toggle-group">
                      <button
                        type="button"
                        className={`ie-format-pill ${format === 'xlsx' ? 'active' : ''}`}
                        onClick={() => setFormat('xlsx')}
                      >
                        <span className="format-badge xlsx">XLSX</span>
                        <span className="format-name">Excel (.xlsx)</span>
                      </button>
                      <button
                        type="button"
                        className={`ie-format-pill ${format === 'csv' ? 'active' : ''}`}
                        onClick={() => setFormat('csv')}
                      >
                        <span className="format-badge csv">CSV</span>
                        <span className="format-name">CSV (.csv)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-row for Conditional Date Inputs */}
                {filters.dateMode !== 'all' && (
                  <div className="ie-date-subpanel">
                    <div className="ie-subpanel-header">
                      <FiCalendar className="subpanel-icon" />
                      <span>Specify your date filter details:</span>
                    </div>
                    <div className="ie-subpanel-inputs">
                      {['date', 'week'].includes(filters.dateMode) && (
                        <div className="ie-sub-field">
                          <label htmlFor="ie-date">
                            {filters.dateMode === 'week'
                              ? 'Pick any date inside target week:'
                              : 'Select Date:'}
                          </label>
                          <input
                            id="ie-date"
                            type="date"
                            value={filters.date}
                            onChange={e => updateFilter('date', e.target.value)}
                          />
                        </div>
                      )}
                      {filters.dateMode === 'month' && (
                        <div className="ie-sub-field">
                          <label htmlFor="ie-month">Select Month:</label>
                          <input
                            id="ie-month"
                            type="month"
                            value={filters.month}
                            onChange={e => updateFilter('month', e.target.value)}
                          />
                        </div>
                      )}
                      {filters.dateMode === 'range' && (
                        <>
                          <div className="ie-sub-field">
                            <label htmlFor="ie-from">From Date (inclusive):</label>
                            <input
                              id="ie-from"
                              type="date"
                              value={filters.from}
                              onChange={e => updateFilter('from', e.target.value)}
                            />
                          </div>
                          <div className="ie-sub-field">
                            <label htmlFor="ie-to">To Date (inclusive):</label>
                            <input
                              id="ie-to"
                              type="date"
                              value={filters.to}
                              onChange={e => updateFilter('to', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="ie-filter-hint">
                  <FiInfo className="hint-icon" />
                  <span>
                    Filters apply to <strong>Lead Date</strong> (not entry timestamp). Date boundaries are inclusive. Weeks run Monday through Sunday.
                  </span>
                </div>
              </div>
            </fieldset>

            {/* ========================================================================= */}
            {/* Redesigned Export Status & Download Banner */}
            {/* ========================================================================= */}
            <div
              role="status"
              aria-live="polite"
              className={`ie-export-summary-card ${
                countLoading
                  ? 'is-calculating'
                  : count > 0
                  ? 'is-ready'
                  : count === 0
                  ? 'is-empty'
                  : 'is-neutral'
              }`}
            >
              <div className="ie-summary-main">
                <div className="ie-summary-badge">
                  {countLoading ? (
                    <FiRefreshCw className="ie-spin" />
                  ) : count !== null ? (
                    <span className="ie-badge-count">{count.toLocaleString()}</span>
                  ) : (
                    <FiFileText />
                  )}
                </div>

                <div className="ie-summary-text">
                  <div className="ie-summary-heading-row">
                    <h3>
                      {countLoading
                        ? 'Checking matching leads...'
                        : count === null
                        ? 'Ready to calculate matching leads'
                        : count === 0
                        ? 'No matching leads found'
                        : `${count.toLocaleString()} ${
                            count === 1 ? 'lead' : 'leads'
                          } ready for export`}
                    </h3>
                    {count > 0 && !countLoading && (
                      <span className="ie-filetype-chip">
                        {format === 'xlsx' ? 'Excel .XLSX' : 'CSV .CSV'}
                      </span>
                    )}
                  </div>

                  <p className="ie-summary-subtext">
                    {countLoading
                      ? 'Querying database for records matching your filter combination...'
                      : count === null
                      ? 'Adjust your filters above. Matching leads will be calculated automatically.'
                      : count === 0
                      ? 'No records match this combination. Try broadening your date range or telecaller selection.'
                      : `Your ${
                          format === 'xlsx' ? 'Excel' : 'CSV'
                        } file will include all ${count.toLocaleString()} matching records across every page.`}
                  </p>

                  {/* Active Filter Tags */}
                  <div className="ie-active-filters-row">
                    <span className="ie-filter-tag">
                      <strong>Assignment:</strong>{' '}
                      {filters.assignment === 'all'
                        ? 'All leads'
                        : filters.assignment === 'assigned'
                        ? 'Assigned only'
                        : 'Unassigned only'}
                    </span>
                    {filters.assignment !== 'unassigned' && (
                      <span className="ie-filter-tag">
                        <strong>Member:</strong> {selectedUserName}
                      </span>
                    )}
                    <span className="ie-filter-tag">
                      <strong>Date:</strong>{' '}
                      {filters.dateMode === 'all'
                        ? 'All dates'
                        : filters.dateMode === 'date'
                        ? filters.date || 'Specific date'
                        : filters.dateMode === 'week'
                        ? `Week of ${filters.date || '...'}`
                        : filters.dateMode === 'month'
                        ? filters.month || 'Month'
                        : `${filters.from || '...'} to ${filters.to || '...'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ie-summary-actions">
                <button
                  type="button"
                  className="ie-btn-action-refresh"
                  disabled={!!busy}
                  title="Recalculate matching leads"
                  onClick={() => {
                    setCount(null);
                    setError('');
                    setCountVersion(v => v + 1);
                  }}
                >
                  <FiRefreshCw className={countLoading ? 'ie-spin' : ''} />
                  {countLoading ? 'Checking...' : 'Refresh Count'}
                </button>

                <button
                  type="button"
                  className="ie-btn-primary ie-btn-export-main"
                  disabled={!!busy || countLoading || !count}
                  onClick={() =>
                    run('export', async () => {
                      await download('/export', `leads-export.${format}`, { ...filters, format });
                      setNotice(`Export file (leads-export.${format}) downloaded successfully.`);
                    })
                  }
                >
                  <FiDownload />
                  {busy === 'export'
                    ? 'Preparing File...'
                    : `Download Export ${count ? `(${count.toLocaleString()})` : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IMPORT LEADS */}
        {/* ========================================================================= */}
        {tab === 'import' && (
          <div className="ie-import-section">
            <div className="ie-section-intro">
              <div className="ie-intro-text">
                <div className="ie-intro-tag">
                  <FiUploadCloud /> Bulk Upload
                </div>
                <h2>Import Leads from Spreadsheet</h2>
                <p>
                  Upload your .xlsx or .csv lead file. Review valid records and duplicates before confirming import.
                </p>
              </div>
              <div className="ie-intro-actions">
                <button
                  type="button"
                  className="ie-btn-secondary"
                  disabled={!!busy}
                  onClick={() =>
                    run('template', () => download('/template', 'lead-import-template.xlsx'))
                  }
                >
                  <FiDownload />
                  {busy === 'template' ? 'Downloading...' : 'Download Sample Excel Template'}
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              className={`ie-dropzone ${isDragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id="ie-file"
                type="file"
                className="ie-hidden-file-input"
                accept=".xlsx,.csv"
                disabled={!!busy}
                onClick={e => {
                  e.target.value = null;
                }}
                onChange={e => validateFile(e.target.files?.[0])}
              />

              {!file ? (
                <div
                  className="ie-dropzone-empty"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="ie-dropzone-icon">
                    <FiUploadCloud size={38} />
                  </div>
                  <div className="ie-dropzone-text">
                    <p className="ie-dropzone-title">
                      <strong>Choose an Excel or CSV file</strong> or drag &amp; drop it here
                    </p>
                    <p className="ie-dropzone-hints">
                      Supported formats: <strong>.XLSX</strong> or <strong>.CSV</strong> &bull; Max 5 MB &bull; Up to 1,000 data rows per batch
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ie-btn-secondary ie-btn-browse"
                    disabled={!!busy}
                  >
                    Browse Local File
                  </button>
                </div>
              ) : (
                <div className="ie-dropzone-selected">
                  <div className="ie-selected-file-info">
                    <div className="file-icon-box">
                      <FiFileText size={26} />
                    </div>
                    <div>
                      <h4 className="file-name">{file.name}</h4>
                      <p className="file-meta">
                        Size: {formatFileSize(file.size)} &bull; Ready for server-side validation
                      </p>
                    </div>
                  </div>
                  <div className="ie-selected-file-actions">
                    <button
                      type="button"
                      className="ie-btn-text-danger"
                      disabled={!!busy}
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setResult(null);
                      }}
                    >
                      <FiX /> Remove
                    </button>
                    <button
                      type="button"
                      className="ie-btn-primary"
                      disabled={!!busy}
                      onClick={createPreview}
                    >
                      {busy === 'preview' ? (
                        <>
                          <FiRefreshCw className="ie-spin" /> Validating File...
                        </>
                      ) : (
                        <>
                          <FiCheck size={16} /> Validate &amp; Preview Leads
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Template Column Guidelines Collapsible */}
            <details className="ie-template-guide-card">
              <summary>
                <div className="summary-title">
                  <FiInfo />
                  <span>View Expected Spreadsheet Columns &amp; Validation Rules</span>
                </div>
                <span className="summary-badge">14 Columns</span>
              </summary>
              <div className="guide-content">
                <div className="guide-columns-group">
                  <h4>Required Columns:</h4>
                  <div className="column-pills">
                    {requiredColumns.map(col => (
                      <span key={col} className="col-pill req">
                        {col} *
                      </span>
                    ))}
                  </div>
                </div>

                <div className="guide-columns-group">
                  <h4>Optional Values (Keep These Column Headers):</h4>
                  <div className="column-pills">
                    {columns
                      .filter(c => !requiredColumns.includes(c))
                      .map(col => (
                        <span key={col} className="col-pill">
                          {col}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="guide-rules-list">
                  <p>
                    &bull; <strong>Lead Date:</strong> Use YYYY-MM-DD format (e.g. 2026-09-16).
                  </p>
                  <p>
                    &bull; <strong>Phone:</strong> Must be formatted as plain 10 digits in Text format.
                  </p>
                  <p>
                    &bull; <strong>Gender:</strong> Male, Female, Other, or leave blank.
                  </p>
                  <p>
                    &bull; <strong>Lead Source &amp; Type:</strong> Must match existing active names in your company settings.
                  </p>
                  <p>
                    &bull; <strong>Duplicate Safeguard:</strong> Rows matching existing phone or email inside your company are automatically detected and skipped.
                  </p>
                </div>
              </div>
            </details>

            {/* Preview / Results Panel */}
            {(preview || result) && (
              <section className="ie-preview-section" aria-live="polite">
                {/* Batch Header Bar */}
                <div className="ie-batch-result-header">
                  <div className="ie-batch-info">
                    <div className="ie-batch-title-row">
                      <h2>{result ? 'Import Batch Result' : 'Spreadsheet Preview'}</h2>
                      <span className={`ie-batch-status-badge status-${result?.status || 'preview'}`}>
                        {result?.status === 'completed'
                          ? '✓ Completed'
                          : result?.status === 'processing'
                          ? 'Processing...'
                          : result?.status === 'interrupted'
                          ? '⚠ Interrupted'
                          : result?.status === 'failed'
                          ? '✕ Failed'
                          : result?.status === 'partial'
                          ? 'Partially Imported'
                          : 'Preview Ready'}
                      </span>
                    </div>
                    <p className="ie-batch-sub">
                      File: <strong>{result?.fileName || preview?.fileName || '-'}</strong>
                      {result?.completedAt && ` • Completed at ${dateTime(result.completedAt)}`}
                    </p>
                  </div>
                  <div className="ie-batch-actions">
                    <button
                      type="button"
                      className="ie-btn-secondary"
                      disabled={!!busy}
                      onClick={() =>
                        run('report', () =>
                          download(`/imports/${batchId}/errors`, 'lead-import-errors.csv')
                        )
                      }
                    >
                      <FiDownload size={14} /> Download Row Report
                    </button>
                    <button
                      type="button"
                      className="ie-btn-secondary"
                      disabled={!!busy}
                      onClick={() => refreshResult(batchId)}
                    >
                      <FiRefreshCw className={busy === 'result' ? 'ie-spin' : ''} size={14} /> Refresh Result
                    </button>
                  </div>
                </div>

                {/* Metric Summary Cards (Immunized with ie-kpi- prefix) */}
                <div className="ie-stats-grid">
                  {(result
                    ? [
                        ['Total Rows', result.total, 'total', FiLayers, 'Processed'],
                        ['Successfully Added', result.added, 'added', FiCheckCircle, 'In CRM'],
                        ['Duplicates Skipped', result.skipped, 'skipped', FiCopy, 'Skipped'],
                        ['Failed Rows', result.failed, 'failed', FiAlertCircle, 'Issues'],
                        ['Pending', result.pending, 'pending', FiClock, 'Queue']
                      ]
                    : [
                        ['Total Rows', preview.total, 'total', FiLayers, 'Parsed'],
                        ['Valid Records', preview.valid, 'added', FiCheckCircle, 'Ready'],
                        ['Duplicates Found', preview.duplicates, 'skipped', FiCopy, 'Duplicate'],
                        ['Invalid Records', preview.invalid, 'failed', FiAlertCircle, 'Errors']
                      ]
                  ).map(([label, val, theme, Icon, badge]) => (
                    <div key={label} className={`ie-kpi-card theme-${theme}`}>
                      <div className="ie-kpi-header">
                        <span className="ie-kpi-label">{label}</span>
                        <div className={`ie-kpi-icon-circle theme-${theme}`}>
                          <Icon size={16} />
                        </div>
                      </div>
                      <div className="ie-kpi-body">
                        <strong className="ie-kpi-number">{val ?? 0}</strong>
                        <span className={`ie-kpi-status-pill theme-${theme}`}>{badge}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {result?.pending > 0 && (
                  <div className="ie-warning-card">
                    <FiAlertCircle className="warn-icon" />
                    <div>
                      <strong>Import in progress</strong>
                      <p>
                        Some rows are still being processed. Please refresh to check progress. Do not upload the file again.
                      </p>
                    </div>
                  </div>
                )}

                {/* Table of Rows */}
                <div className="ie-table-wrapper">
                  <table className="ie-transfer-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Row #</th>
                        <th style={{ width: '220px' }}>Lead Name</th>
                        <th style={{ width: '240px' }}>Contact (Email / Phone)</th>
                        <th style={{ width: '160px' }}>Validation Status</th>
                        <th>Details / Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length > 0 ? (
                        rows.slice((rowPage - 1) * 25, rowPage * 25).map(row => (
                          <tr key={row.rowNumber}>
                            <td className="row-num">#{row.rowNumber}</td>
                            <td className="row-name">
                              <strong>{row.name || row.body?.fullName || '-'}</strong>
                            </td>
                            <td className="row-contact">
                              <div className="contact-email">{row.email || row.body?.email || '-'}</div>
                              <small className="contact-phone">{row.phone || row.body?.phone || '-'}</small>
                            </td>
                            <td>
                              <span className={`ie-badge-outcome outcome-${row.outcome}`}>
                                {row.outcome === 'valid' || row.outcome === 'added' ? (
                                  <><FiCheck size={12} /> {row.outcome}</>
                                ) : row.outcome === 'duplicate' || row.outcome === 'skipped' ? (
                                  <><FiCopy size={12} /> {row.outcome}</>
                                ) : (
                                  <><FiAlertCircle size={12} /> {row.outcome}</>
                                )}
                              </span>
                            </td>
                            <td className="row-notes">
                              {row.errors?.join(', ') ||
                                (row.outcome === 'added' ? 'Imported successfully' : row.outcome === 'valid' ? 'Ready to import' : '-')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="ie-table-empty">
                            No rows to display.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="ie-pagination-bar">
                  <span className="page-summary">
                    Showing page <strong>{rowPage}</strong> of <strong>{rowPages}</strong> ({rows.length} rows)
                  </span>
                  <div className="page-buttons">
                    <button
                      type="button"
                      className="ie-page-btn"
                      disabled={rowPage <= 1 || !!busy}
                      onClick={() => setRowPage(p => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="ie-page-btn"
                      disabled={rowPage >= rowPages || !!busy}
                      onClick={() => setRowPage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Confirm Action */}
                {!result && (
                  <div className="ie-confirm-box">
                    <div className="confirm-text">
                      <h4>Ready to import leads?</h4>
                      <p>
                        Only the <strong>{preview.valid} valid rows</strong> will be added to your CRM as New leads. Duplicates and invalid rows will be skipped.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ie-btn-primary ie-btn-confirm"
                      disabled={!!busy || !preview.valid}
                      onClick={() => confirm(preview.id)}
                    >
                      <FiCheckCircle size={16} />
                      {busy === 'confirm'
                        ? 'Importing Leads...'
                        : `Confirm Import (${preview.valid} valid records)`}
                    </button>
                  </div>
                )}

                {canResume && (
                  <div className="ie-confirm-box">
                    <div className="confirm-text">
                      <h4>Resume interrupted import</h4>
                      <p>Pick up where the previous import process left off.</p>
                    </div>
                    <button
                      type="button"
                      className="ie-btn-primary"
                      disabled={!!busy}
                      onClick={() => confirm(result.id)}
                    >
                      {busy === 'confirm' ? 'Resuming...' : 'Resume This Import'}
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: IMPORT HISTORY */}
        {/* ========================================================================= */}
        {tab === 'history' && (
          <div className="ie-history-section">
            <div className="ie-section-intro">
              <div className="ie-intro-text">
                <div className="ie-intro-tag">
                  <FiClock /> Audit Log
                </div>
                <h2>Import History &amp; Batches</h2>
                <p>
                  View past spreadsheet imports, total processed rows, and outcomes.
                </p>
              </div>
              <div className="ie-intro-actions">
                <button
                  type="button"
                  className="ie-btn-secondary"
                  disabled={!!busy || historyLoading}
                  onClick={() => setHistoryVersion(v => v + 1)}
                >
                  <FiRefreshCw className={historyLoading ? 'ie-spin' : ''} /> Refresh History
                </button>
              </div>
            </div>

            {historyError && (
              <div role="alert" className="ie-msg msg-error">
                <FiAlertCircle className="msg-icon" />
                <div className="msg-content">{historyError}</div>
              </div>
            )}

            {historyLoading ? (
              <div className="ie-loading-state">
                <FiRefreshCw className="ie-spin" size={24} />
                <span>Loading import history records...</span>
              </div>
            ) : !historyError && (
              <>
                <div className="ie-table-wrapper">
                  <table className="ie-transfer-table">
                    <thead>
                      <tr>
                        <th>Spreadsheet / Uploader</th>
                        <th>Date &amp; Time</th>
                        <th>Total</th>
                        <th>Added</th>
                        <th>Skipped</th>
                        <th>Failed</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.items.map(item => (
                        <tr key={item._id}>
                          <td className="row-file">
                            <strong>{item.fileName}</strong>
                            <small>{item.createdBy?.name || 'User'}</small>
                          </td>
                          <td className="row-date">
                            {dateTime(item.startedAt || item.createdAt)}
                          </td>
                          <td>
                            <strong>{item.total}</strong>
                          </td>
                          <td className="text-success">
                            <strong>{item.added}</strong>
                          </td>
                          <td className="text-warning">{item.skipped}</td>
                          <td className="text-danger">{item.failed}</td>
                          <td>
                            <span className={`ie-status-tag status-${item.status}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {item.canResume ? (
                              <button
                                type="button"
                                className="ie-btn-table-action"
                                disabled={!!busy}
                                onClick={() => refreshResult(item._id)}
                              >
                                {['interrupted', 'processing'].includes(item.status) ? 'View / Resume' : 'View Result'}
                              </button>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!history.items.length && (
                  <div className="ie-empty-card">
                    <FiClock size={32} />
                    <h4>No imports on record yet</h4>
                    <p>When you or your team import leads from spreadsheets, batch records will appear here.</p>
                  </div>
                )}

                <div className="ie-pagination-bar">
                  <span className="page-summary">
                    Page <strong>{history.page}</strong> of <strong>{history.pages}</strong> &bull; Total {history.total} batches
                  </span>
                  <div className="page-buttons">
                    <button
                      type="button"
                      className="ie-page-btn"
                      disabled={historyPage <= 1 || !!busy}
                      onClick={() => setHistoryPage(p => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="ie-page-btn"
                      disabled={historyPage >= history.pages || !!busy}
                      onClick={() => setHistoryPage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
