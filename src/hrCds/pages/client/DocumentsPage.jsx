import React from 'react';
import { FiFileText, FiDownload, FiCheckCircle, FiClock } from 'react-icons/fi';
import './DocumentsPage.css';

const documents = [
  { name: 'Monthly Performance Report',   type: 'PDF', date: 'Jun 04, 2026', status: 'Ready' },
  { name: 'Contract Amendment', type: 'DOCX', date: 'May 22, 2026', status: 'Pending' },
  { name: 'Invoice #1028', type: 'PDF', date: 'May 26, 2026', status: 'Paid' },
  { name: 'Strategy Proposal', type: 'PPTX', date: 'May 14, 2026', status: 'Ready' }
];

const DocumentsPage = () => (
  <section className="ClientPageBase-root">
    <div className="ClientPageBase-header">
      <div>
        <p>Documents</p>
        <h1>All your important files in one location</h1>
      </div>
      <button>Upload Document</button>
    </div>

    <section className="ClientPageBase-card ClientPageBase-documents-card">
      <div className="ClientPageBase-card-header">
        <div>
          <span>Secure repository</span>
          <h2>Client document library</h2>
        </div>
      </div>
      <div className="ClientPageBase-documents-list">
        {documents.map((doc) => (
          <div key={doc.name} className="ClientPageBase-document-item">
            <div className="ClientPageBase-document-meta">
              <div className="ClientPageBase-card-icon"><FiFileText /></div>
              <div>
                <strong>{doc.name}</strong>
                <p>{doc.type} · {doc.date}</p>
              </div>
            </div>
            <div className="ClientPageBase-document-actions">
              <span className={`status status-${doc.status.toLowerCase()}`}>{doc.status}</span>
              <button><FiDownload /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  </section>
);

export default DocumentsPage;
