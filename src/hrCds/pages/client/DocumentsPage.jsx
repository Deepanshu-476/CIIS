import React from "react";
import {
  FiBell,
  FiBox,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFile,
  FiFileText,
  FiFilter,
  FiFolder,
  FiHeadphones,
  FiMoreVertical,
  FiSearch,
  FiSettings,
  FiShare2,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import {
  buildClientDocuments,
  getClientDisplayName,
  getUserDisplayName,
  useClientPortalData,
} from "../../utils/clientPortalData";
import "./DocumentsPage.css";

<<<<<<< HEAD
const documents = [
  { name: 'Monthly Performance Report',   type: 'PDF', date: 'Jun 04, 2026', status: 'Ready' },
  { name: 'Contract Amendment', type: 'DOCX', date: 'May 22, 2026', status: 'Pending' },
  { name: 'Invoice #1028', type: 'PDF', date: 'May 26, 2026', status: 'Paid' },
  { name: 'Strategy Proposal', type: 'PPTX', date: 'May 14, 2026', status: 'Ready' }
=======
const quickActions = [
  { icon: <FiUploadCloud />, title: "Upload Document", text: "Upload files to your account" },
  { icon: <FiFileText />, title: "Request Document", text: "Request documents from our team" },
  { icon: <FiShare2 />, title: "Shared Documents", text: "View documents shared with you" },
  { icon: <FiTrash2 />, title: "Trash", text: "View and restore deleted files" },
>>>>>>> 39aafa9046b5762ab4003153abdd7f0e3ef4ee61
];

const iconMap = {
  pdf: <span className="DocumentsPage-docIcon DocumentsPage-pdf">PDF</span>,
  word: <span className="DocumentsPage-docIcon DocumentsPage-word">W</span>,
  excel: <span className="DocumentsPage-docIcon DocumentsPage-excel">W</span>,
  folder: <span className="DocumentsPage-folderIcon"><FiFolder /></span>,
};

const DocumentsPage = () => {
  const { client, tasks, projectManagers, user, loading, error, refetch } = useClientPortalData();
  const documents = buildClientDocuments({ client, tasks, projectManagers });
  const visibleDocuments = documents.slice(0, 8);
  const clientName = getClientDisplayName(client);
  const userName = getUserDisplayName(user);
  const recentCount = documents.filter(doc => doc.date !== 'N/A').length;

  if (loading) {
    return <section className="DocumentsPage-root"><div className="DocumentsPage-mainPanel">Loading documents...</div></section>;
  }

  if (error || !client) {
    return (
      <section className="DocumentsPage-root">
        <div className="DocumentsPage-mainPanel">
          <p>{error || 'No client data found for this login.'}</p>
          <button type="button" onClick={refetch}>Try Again</button>
        </div>
      </section>
    );
  }

  return (
  <section className="DocumentsPage-root">
    <header className="DocumentsPage-header">
      <div className="DocumentsPage-title">
        <h1>Documents</h1>
        <p>Access and manage all your documents in one place.</p>
      </div>

      <div className="DocumentsPage-topActions">
        <label className="DocumentsPage-searchTop">
          <FiSearch />
          <input type="search" placeholder="Search services, invoices, tickets..." />
        </label>
        <button type="button" className="DocumentsPage-bell" aria-label="Notifications">
          <FiBell />
          <span>7</span>
        </button>
        <button type="button" className="DocumentsPage-user">
          <b>T</b>
          <strong>{userName}</strong>
          <FiChevronDown />
        </button>
      </div>
    </header>

    <section className="DocumentsPage-stats">
      <article className="DocumentsPage-stat">
        <span className="DocumentsPage-statIcon DocumentsPage-blue"><FiFolder /></span>
        <div><p>Total Documents</p><strong>{documents.length}</strong></div>
        <small>All time documents</small>
      </article>
      <article className="DocumentsPage-stat">
        <span className="DocumentsPage-statIcon DocumentsPage-green"><FiFileText /></span>
        <div><p>Recently Added</p><strong>{recentCount}</strong></div>
        <small>In the last 30 days</small>
      </article>
      <article className="DocumentsPage-stat">
        <span className="DocumentsPage-statIcon DocumentsPage-purple"><FiDownload /></span>
        <div><p>Downloads</p><strong>{Math.max(0, tasks.filter(task => task.completed).length)}</strong></div>
        <small>In the last 30 days</small>
      </article>
      <article className="DocumentsPage-storageStat">
        <span className="DocumentsPage-statIcon DocumentsPage-orange"><FiBox /></span>
        <div>
          <p>Storage Used</p>
          <strong>120 <em>MB</em></strong>
          <small>of 5 GB used</small>
        </div>
        <div className="DocumentsPage-storageMini">
          <span><i></i></span>
          <b>2%</b>
        </div>
      </article>
    </section>

    <div className="DocumentsPage-layout">
      <main className="DocumentsPage-mainPanel">
        <nav className="DocumentsPage-tabs">
          <button type="button" className="active">All Documents</button>
          <button type="button">Shared With You</button>
          <button type="button">My Uploads</button>
          <button type="button">Trash</button>
        </nav>

        <div className="DocumentsPage-toolbar">
          <label className="DocumentsPage-docSearch">
            <FiSearch />
            <input type="search" placeholder="Search documents..." />
          </label>
          <button type="button">Document Type <FiChevronDown /></button>
          <button type="button">Category <FiChevronDown /></button>
          <button type="button">Date Modified <FiChevronDown /></button>
          <button type="button"><FiFilter /> More Filters</button>
          <button type="button" className="DocumentsPage-upload"><FiUploadCloud /> Upload Document</button>
        </div>

        <div className="DocumentsPage-tableWrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Select all documents" /></th>
                <th>Document Name <span>↑</span></th>
                <th>Type</th>
                <th>Category</th>
                <th>Date Modified <span>↑</span></th>
                <th>Uploaded By</th>
                <th>Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleDocuments.map(doc => (
                <tr key={doc.name}>
                  <td><input type="checkbox" aria-label={`Select ${doc.name}`} /></td>
                  <td>
                    <div className="DocumentsPage-nameCell">
                      {iconMap[doc.icon] || <FiFile />}
                      <strong>{doc.name}</strong>
                    </div>
                  </td>
                  <td>{doc.type}</td>
                  <td>{doc.category}</td>
                  <td>{doc.date}</td>
                  <td>{doc.by}</td>
                  <td>{doc.size}</td>
                  <td><button type="button" className="DocumentsPage-more" aria-label={`Open ${doc.name} actions`}><FiMoreVertical /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="DocumentsPage-pagination">
          <span>Showing 1 to {visibleDocuments.length} of {documents.length} documents for {clientName}</span>
          <div>
            <button type="button"><FiChevronLeft /></button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">4</button>
            <button type="button"><FiChevronRight /></button>
          </div>
        </footer>
      </main>

      <aside className="DocumentsPage-side">
        <section className="DocumentsPage-sideCard DocumentsPage-quick">
          <h2>Quick Actions</h2>
          {quickActions.map(action => (
            <button type="button" key={action.title}>
              <span>{action.icon}</span>
              <div><strong>{action.title}</strong><small>{action.text}</small></div>
            </button>
          ))}
        </section>

        <section className="DocumentsPage-sideCard DocumentsPage-storage">
          <h2>Storage Overview</h2>
          <p><strong>120 MB</strong> of 5 GB used <b>2%</b></p>
          <div className="DocumentsPage-progress"><i></i></div>
          <button type="button"><FiSettings /> Manage Storage</button>
        </section>

        <section className="DocumentsPage-sideCard DocumentsPage-help">
          <h2>Need Help?</h2>
          <p>If you can't find a document or need assistance, our support team is here to help.</p>
          <button type="button"><FiHeadphones /> Contact Support</button>
        </section>
      </aside>
    </div>
  </section>
  );
};

export default DocumentsPage;
