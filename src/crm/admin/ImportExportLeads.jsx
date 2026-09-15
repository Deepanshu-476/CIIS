import React, { useState, useRef } from 'react';
import {
  FiUploadCloud,
  FiDownload,
  FiClock,
  FiRefreshCw,
  FiInfo,
  FiFileText,
  FiCheckCircle
} from 'react-icons/fi';
import './ImportExportLeads.css';

// Import History Mock Data matching reference image
const historyRows = [
  {
    id: '#IMP-009',
    source: 'School Visit',
    sourceType: 'purple',
    type: 'Counselling',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 37,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:33 AM'
  },
  {
    id: '#IMP-008',
    source: 'Referral',
    sourceType: 'purple',
    type: 'Book Campaign',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 109,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:30 AM'
  },
  {
    id: '#IMP-007',
    source: 'Phone Call',
    sourceType: 'purple',
    type: 'Admission Enquiry',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 109,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:29 AM'
  },
  {
    id: '#IMP-006',
    source: 'WhatsApp',
    sourceType: 'purple',
    type: 'Foundation',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 20,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:27 AM'
  },
  {
    id: '#IMP-005',
    source: 'Google Ads',
    sourceType: 'purple',
    type: 'CUET',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 59,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:22 AM'
  },
  {
    id: '#IMP-003',
    source: 'Google Ads',
    sourceType: 'purple',
    type: 'NDA',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 41,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:16 AM'
  },
  {
    id: '#IMP-002',
    source: 'Instagram',
    sourceType: 'purple',
    type: 'JEE',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 27,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:13 AM'
  },
  {
    id: '#IMP-001',
    source: 'Facebook',
    sourceType: 'purple',
    type: 'NEET',
    typeBadge: 'green',
    fileName: 'leads_sample.csv',
    imported: 16,
    status: 'Completed',
    dateTime: '22 Aug 2026, 11:06 AM'
  }
];

export default function ImportExportLeads() {
  const [activeTab, setActiveTab] = useState('import'); // 'import', 'export', 'history'
  const [file, setFile] = useState(null);
  const [leadSource, setLeadSource] = useState('');
  const [leadType, setLeadType] = useState('');
  const [fileType, setFileType] = useState('');
  const [importMessage, setImportMessage] = useState('');

  // Export filters
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exportStatus, setExportStatus] = useState('All');
  const [exportDateFrom, setExportDateFrom] = useState('2026-09-01');
  const [exportDateTo, setExportDateTo] = useState('2026-09-01');
  const [exportMessage, setExportMessage] = useState('');

  const fileInputRef = useRef(null);

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setImportMessage('Please choose a CSV or Excel file to import.');
      return;
    }
    setImportMessage(`Success! File "${file.name}" imported into system.`);
  };

  const handleExportSubmit = (e) => {
    e.preventDefault();
    setExportMessage(`Export initiated in ${exportFormat} format. Download started.`);
  };

  const handleResetExport = () => {
    setExportFormat('CSV');
    setExportStatus('All');
    setExportDateFrom('2026-09-01');
    setExportDateTo('2026-09-01');
    setExportMessage('');
  };

  return (
    <div className="ie-root">
      {/* Page Header & Breadcrumb */}
      <div className="ie-page-header">
        <h1 className="ie-page-title">Import Leads</h1>
        <div className="ie-breadcrumb">
          <span>Dashboard</span>
          <span className="separator">&gt;</span>
          <span>Leads</span>
          <span className="separator">&gt;</span>
          <span className="active">Import Leads</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="ie-card">
        {/* Navigation Tabs Bar */}
        <div className="ie-tab-bar">
          <button
            type="button"
            className={`ie-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('import');
              setImportMessage('');
            }}
          >
            <FiUploadCloud size={15} /> Import Leads
          </button>

          <button
            type="button"
            className={`ie-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('export');
              setExportMessage('');
            }}
          >
            <FiDownload size={15} /> Export Data
          </button>

          <button
            type="button"
            className={`ie-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FiClock size={15} /> Import History
          </button>
        </div>

        {/* TAB 1: IMPORT LEADS */}
        {activeTab === 'import' && (
          <div className="ie-grid-container">
            {/* Left Panel: Lead Import */}
            <div className="ie-panel ie-form-panel">
              <div className="ie-panel-header">
                <h2 className="ie-panel-title">Lead Import</h2>
                <p className="ie-panel-sub">
                  Upload a CSV or Excel file to create new leads with the mapped CRM fields
                </p>
              </div>

              <form onSubmit={handleImportSubmit} className="ie-form">
                <div className="ie-field">
                  <label>
                    Lead Source <span className="req">*</span>
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    required
                  >
                    <option value="">Select Lead Source</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="School Visit">School Visit</option>
                  </select>
                </div>

                <div className="ie-field">
                  <label>
                    Lead Type <span className="req">*</span>
                  </label>
                  <select
                    value={leadType}
                    onChange={(e) => setLeadType(e.target.value)}
                    required
                  >
                    <option value="">Select Lead Type</option>
                    <option value="NEET">NEET</option>
                    <option value="JEE">JEE</option>
                    <option value="CUET">CUET</option>
                    <option value="Counselling">Counselling</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>

                <div className="ie-field">
                  <label>
                    File Type <span className="req">*</span>
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    required
                  >
                    <option value="">Select File Type</option>
                    <option value="CSV">CSV (.csv)</option>
                    <option value="Excel">Excel (.xlsx)</option>
                  </select>
                </div>

                {/* File Upload Box */}
                <div className="ie-file-picker">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    style={{ display: 'none' }}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    className="ie-btn-choose-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiFileText size={14} />
                    <span>{file ? file.name : 'Choose CSV / Excel File'}</span>
                  </button>
                </div>

                {importMessage && (
                  <div className={`ie-msg ${file ? 'msg-success' : 'msg-error'}`}>
                    {importMessage}
                  </div>
                )}

                <div className="ie-form-actions">
                  <button type="submit" className="ie-btn-primary">
                    <FiUploadCloud size={15} /> Import Leads
                  </button>
                </div>
              </form>
            </div>

            {/* Right Panel: Import Tips */}
            <div className="ie-panel ie-tips-panel">
              <div className="ie-panel-header">
                <h2 className="ie-panel-title">Import Tips</h2>
              </div>
              <ul className="ie-tips-list">
                <li>Use a CSV or Excel file format with columns such as name, email, phone, and company.</li>
                <li>Keep required values consistent to reduce duplicates.</li>
                <li>Verify that email addresses and phone numbers are correctly formatted before importing.</li>
                <li>Remove empty rows and unnecessary columns to avoid import errors.</li>
                <li>Check for duplicate contacts in your file before uploading to keep your data clean.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: EXPORT DATA */}
        {activeTab === 'export' && (
          <div className="ie-grid-container">
            {/* Left Panel: Export Leads */}
            <div className="ie-panel ie-form-panel">
              <div className="ie-panel-header">
                <h2 className="ie-panel-title">Export Leads</h2>
                <p className="ie-panel-sub">
                  Download your lead records in CSV or Excel format for analysis or external use.
                </p>
              </div>

              <form onSubmit={handleExportSubmit} className="ie-form">
                <div className="ie-form-grid">
                  <div className="ie-field">
                    <label>
                      Format <span className="req">*</span>
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                    >
                      <option value="CSV">CSV</option>
                      <option value="Excel">Excel (.xlsx)</option>
                    </select>
                  </div>

                  <div className="ie-field">
                    <label>Status</label>
                    <select
                      value={exportStatus}
                      onChange={(e) => setExportStatus(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Active">Active</option>
                      <option value="Converted">Converted</option>
                      <option value="Unassigned">Unassigned</option>
                    </select>
                  </div>

                  <div className="ie-field">
                    <label>Date From</label>
                    <input
                      type="date"
                      value={exportDateFrom}
                      onChange={(e) => setExportDateFrom(e.target.value)}
                    />
                  </div>

                  <div className="ie-field">
                    <label>Date To</label>
                    <input
                      type="date"
                      value={exportDateTo}
                      onChange={(e) => setExportDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {exportMessage && (
                  <div className="ie-msg msg-success">
                    {exportMessage}
                  </div>
                )}

                <div className="ie-form-actions">
                  <button type="submit" className="ie-btn-primary">
                    <FiDownload size={15} /> Export Leads
                  </button>
                  <button
                    type="button"
                    className="ie-btn-secondary"
                    onClick={handleResetExport}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Right Panel: Export Summary */}
            <div className="ie-panel ie-summary-panel">
              <div className="ie-panel-header">
                <h2 className="ie-panel-title">Export Summary</h2>
              </div>

              <div className="ie-summary-rows">
                <div className="summary-row">
                  <span>Records to export</span>
                  <strong>295</strong>
                </div>
                <div className="summary-row">
                  <span>Last Export</span>
                  <strong>Never</strong>
                </div>
              </div>

              <div className="ie-info-banner">
                <FiInfo size={14} className="info-icon" />
                <span>
                  Change filters on the left to update the count, then click Export Leads.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: IMPORT HISTORY */}
        {activeTab === 'history' && (
          <div className="ie-history-container">
            <div className="ie-panel-header flex-between">
              <div>
                <h2 className="ie-panel-title">Import Activity</h2>
                <p className="ie-panel-sub">Track recent uploads and their outcomes.</p>
              </div>
              <button type="button" className="ie-btn-refresh">
                <FiRefreshCw size={12} /> Refresh
              </button>
            </div>

            <div className="ie-table-responsive">
              <table className="ie-table">
                <thead>
                  <tr>
                    <th>IMPORT ID</th>
                    <th>LEAD SOURCE</th>
                    <th>LEAD TYPE</th>
                    <th>FILE TYPE</th>
                    <th>IMPORTED</th>
                    <th>STATUS</th>
                    <th>DATE &amp; TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-semibold text-slate-700">{row.id}</td>
                      <td>
                        <span className={`ie-pill pill-${row.sourceType}`}>
                          {row.source}
                        </span>
                      </td>
                      <td>
                        <span className={`ie-pill pill-${row.typeBadge}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="text-slate-600">{row.fileName}</td>
                      <td className="font-semibold text-slate-800">{row.imported}</td>
                      <td>
                        <span className="ie-status-pill">
                          {row.status}
                        </span>
                      </td>
                      <td className="text-slate-600">{row.dateTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
