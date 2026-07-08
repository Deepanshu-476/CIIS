import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiBox,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFile,
  FiFileText,
  FiFilter,
  FiFolder,
  FiMoreVertical,
  FiRefreshCw,
  FiSearch,
  FiShare2,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import CIISLoader from "../../../Loader/CIISLoader";
import API_URL from "../../../config";
import {
  getClientDisplayName,
  useClientPortalData,
} from "../../utils/clientPortalData";
import "./DocumentsPage.css";

const clientDocumentsApi = axios.create({
  baseURL: `${API_URL}/client-documents`,
  timeout: 20000,
});

clientDocumentsApi.interceptors.request.use(config => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const quickActions = [
  { icon: <FiUploadCloud />, title: "Upload Document", text: "Upload files to your account" },
  { icon: <FiFileText />, title: "Request Document", text: "Request documents from our team" },
  { icon: <FiShare2 />, title: "Shared Documents", text: "View documents shared with you" },
  { icon: <FiTrash2 />, title: "Trash", text: "View and restore deleted files" },
];

const documentTabs = [
  { id: "all", label: "All Documents" },
  { id: "shared", label: "Shared With You" },
  { id: "uploads", label: "My Uploads" },
  { id: "trash", label: "Trash" },
];

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

const iconMap = {
  pdf: <span className="DocumentsPage-docIcon DocumentsPage-pdf">PDF</span>,
  word: <span className="DocumentsPage-docIcon DocumentsPage-word">W</span>,
  excel: <span className="DocumentsPage-docIcon DocumentsPage-excel">W</span>,
  folder: <span className="DocumentsPage-folderIcon"><FiFolder /></span>,
};

const formatDate = value => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatBytes = bytes => {
  const size = Number(bytes || 0);
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getStorageDisplay = bytes => {
  const value = formatBytes(bytes).split(" ");
  return { value: value[0] || "0", unit: value[1] || "KB" };
};

const sumDocumentSizes = docs => (
  docs.reduce((total, doc) => total + Number(doc?.size || 0), 0)
);

const clampPercent = value => Math.min(100, Math.max(0, value));

const getStoragePercent = bytes => (
  clampPercent((Number(bytes || 0) / STORAGE_LIMIT_BYTES) * 100)
);

const formatStoragePercent = value => {
  if (value > 0 && value < 1) return "<1%";
  return `${Math.round(value)}%`;
};

const formatUploadedDocument = doc => ({
  ...doc,
  name: doc.name || doc.originalName || "Document",
  type: doc.type || "Uploaded Document",
  category: doc.category || "General",
  date: formatDate(doc.updatedAt || doc.createdAt),
  by: doc.uploadedBy || "User",
  size: formatBytes(doc.size),
  icon: "uploaded",
  isUploaded: true,
});

const DocumentsPage = () => {
  const { client, tasks, user, loading, error, refetch } = useClientPortalData();
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [trashedDocuments, setTrashedDocuments] = useState([]);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documentActionId, setDocumentActionId] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const documents = useMemo(() => uploadedDocuments.map(formatUploadedDocument), [uploadedDocuments]);
  const trashDocuments = useMemo(() => trashedDocuments.map(formatUploadedDocument), [trashedDocuments]);
  const currentTabDocuments = useMemo(() => {
    if (activeTab === "shared") return documents.filter(doc => doc.uploadedByRole === "company");
    if (activeTab === "uploads") return documents.filter(doc => doc.uploadedByRole === "client");
    if (activeTab === "trash") return trashDocuments;
    return documents;
  }, [activeTab, documents, trashDocuments]);
  const filteredDocuments = useMemo(() => (
    currentTabDocuments.filter(doc => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return `${doc.name} ${doc.category} ${doc.type} ${doc.by}`.toLowerCase().includes(query);
    })
  ), [currentTabDocuments, search]);
  const visibleDocuments = filteredDocuments.slice(0, 8);
  const clientName = getClientDisplayName(client);
  const recentCount = documents.filter(doc => doc.date !== 'N/A').length;
  const storageUsedBytes = useMemo(
    () => sumDocumentSizes([...uploadedDocuments, ...trashedDocuments]),
    [uploadedDocuments, trashedDocuments]
  );
  const storageDisplay = getStorageDisplay(storageUsedBytes);
  const storagePercent = getStoragePercent(storageUsedBytes);
  const isStorageFull = storageUsedBytes >= STORAGE_LIMIT_BYTES;

  const loadUploadedDocuments = async () => {
    if (!client?._id) return;

    try {
      setDocumentLoading(true);
      setDocumentError("");
      const response = await clientDocumentsApi.get("/", {
        params: { clientId: client._id },
      });
      const trashResponse = await clientDocumentsApi.get("/", {
        params: { clientId: client._id, trash: true },
      });
      setUploadedDocuments(response.data?.data || []);
      setTrashedDocuments(trashResponse.data?.data || []);
    } catch (err) {
      console.error("Failed to load client documents", err);
      setDocumentError(err.response?.data?.message || "Failed to load uploaded documents");
    } finally {
      setDocumentLoading(false);
    }
  };

  useEffect(() => {
    loadUploadedDocuments();
  }, [client?._id]);

  const handleUploadDocument = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !client?._id) return;

    if (storageUsedBytes + file.size > STORAGE_LIMIT_BYTES) {
      setDocumentError(`Storage limit exceeded. You can upload up to 5 GB only. Available space: ${formatBytes(Math.max(0, STORAGE_LIMIT_BYTES - storageUsedBytes))}.`);
      return;
    }

    try {
      setUploading(true);
      setDocumentError("");

      const formData = new FormData();
      formData.append("clientId", client._id);
      formData.append("category", "Client Upload");
      formData.append("document", file);

      const response = await clientDocumentsApi.post("/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.data) {
        setUploadedDocuments(prev => [response.data.data, ...prev]);
        setActiveTab("uploads");
      }
    } catch (err) {
      console.error("Document upload failed", err);
      setDocumentError(err.response?.data?.message || "Document upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async doc => {
    if (!doc?._id) return;

    try {
      const response = await clientDocumentsApi.get(`/${doc._id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name || doc.originalName || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Document download failed", err);
      setDocumentError(err.response?.data?.message || "Document download failed");
    }
  };

  const handleDeleteDocument = async doc => {
    if (!doc?._id) return;
    if (!doc.canDelete) {
      setDocumentError("Only the uploader can delete this document");
      return;
    }

    try {
      setDocumentError("");
      const response = await clientDocumentsApi.delete(`/${doc._id}`);
      const deleted = response.data?.data || doc;
      setUploadedDocuments(prev => prev.filter(item => item._id !== doc._id));
      setTrashedDocuments(prev => [deleted, ...prev]);
      await loadUploadedDocuments();
    } catch (err) {
      console.error("Document delete failed", err);
      setDocumentError(err.response?.data?.message || "Document delete failed");
    }
  };

  const handleRecoverDocument = async doc => {
    if (!doc?._id) return;
    if (!doc.canDelete) {
      setDocumentError("You do not have permission to recover this document");
      return;
    }

    try {
      setDocumentActionId(`recover-${doc._id}`);
      setDocumentError("");
      const response = await clientDocumentsApi.post(`/${doc._id}/restore`);
      const recovered = response.data?.data || { ...doc, isDeleted: false };
      setTrashedDocuments(prev => prev.filter(item => item._id !== doc._id));
      setUploadedDocuments(prev => [recovered, ...prev.filter(item => item._id !== doc._id)]);
      await loadUploadedDocuments();
    } catch (err) {
      console.error("Document recover failed", err);
      setDocumentError(err.response?.data?.message || "Document recover failed");
    } finally {
      setDocumentActionId("");
    }
  };

  const handlePermanentDeleteDocument = async doc => {
    if (!doc?._id) return;
    if (!doc.canDelete) {
      setDocumentError("You do not have permission to permanently delete this document");
      return;
    }
    if (!window.confirm(`Permanently delete "${doc.name}"? This cannot be undone.`)) return;

    try {
      setDocumentActionId(`delete-${doc._id}`);
      setDocumentError("");
      await clientDocumentsApi.delete(`/${doc._id}`, {
        params: { permanent: true },
      });
      setTrashedDocuments(prev => prev.filter(item => item._id !== doc._id));
      await loadUploadedDocuments();
    } catch (err) {
      console.error("Permanent document delete failed", err);
      setDocumentError(err.response?.data?.message || "Permanent document delete failed");
    } finally {
      setDocumentActionId("");
    }
  };

  if (loading) {
    return <CIISLoader />;
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
          <strong>{storageDisplay.value} <em>{storageDisplay.unit}</em></strong>
          <small>of 5 GB used</small>
        </div>
        <div className="DocumentsPage-storageMini">
          <span style={{ "--storage-width": `${storagePercent}%` }}><i></i></span>
          <b>{formatStoragePercent(storagePercent)}</b>
        </div>
      </article>
    </section>

    <div className="DocumentsPage-layout">
      <main className="DocumentsPage-mainPanel">
        <nav className="DocumentsPage-tabs">
          {documentTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="DocumentsPage-toolbar">
          <label className="DocumentsPage-docSearch">
            <FiSearch />
            <input
              type="search"
              placeholder="Search documents..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </label>
          <button type="button">Category <FiChevronDown /></button>
          <button type="button">Date Modified <FiChevronDown /></button>
          <button type="button"><FiFilter /> More Filters</button>
          <label className={`DocumentsPage-upload ${isStorageFull ? "DocumentsPage-uploadDisabled" : ""}`}>
            <FiUploadCloud /> {isStorageFull ? "Storage Full" : uploading ? "Uploading..." : "Upload Document"}
            <input
              type="file"
              onChange={handleUploadDocument}
              disabled={uploading || isStorageFull}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
            />
          </label>
        </div>

        {(documentError || documentLoading) && (
          <div className={`DocumentsPage-inlineNotice ${documentError ? "is-error" : ""}`}>
            {documentError || "Loading uploaded documents..."}
          </div>
        )}

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
                <tr key={doc._id || doc.name}>
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
                  <td>
                    <div className="DocumentsPage-rowActions">
                      {doc.isUploaded && activeTab !== "trash" ? (
                        <>
                          <button type="button" className="DocumentsPage-more" aria-label={`Download ${doc.name}`} onClick={() => handleDownloadDocument(doc)}>
                            <FiDownload />
                          </button>
                          {doc.canDelete && (
                            <button type="button" className="DocumentsPage-more DocumentsPage-deleteAction" aria-label={`Move ${doc.name} to trash`} onClick={() => handleDeleteDocument(doc)}>
                              <FiTrash2 />
                            </button>
                          )}
                        </>
                      ) : activeTab === "trash" ? (
                        doc.canDelete ? (
                          <>
                            <button
                              type="button"
                              className="DocumentsPage-trashAction DocumentsPage-recoverAction"
                              onClick={() => handleRecoverDocument(doc)}
                              disabled={documentActionId === `recover-${doc._id}` || documentActionId === `delete-${doc._id}`}
                            >
                              <FiRefreshCw />
                              {documentActionId === `recover-${doc._id}` ? "Recovering..." : "Recover"}
                            </button>
                            <button
                              type="button"
                              className="DocumentsPage-trashAction DocumentsPage-permanentDeleteAction"
                              onClick={() => handlePermanentDeleteDocument(doc)}
                              disabled={documentActionId === `recover-${doc._id}` || documentActionId === `delete-${doc._id}`}
                            >
                              <FiTrash2 />
                              {documentActionId === `delete-${doc._id}` ? "Deleting..." : "Permanently Delete"}
                            </button>
                          </>
                        ) : (
                          <span className="DocumentsPage-trashBadge">In Trash</span>
                        )
                      ) : (
                        <button type="button" className="DocumentsPage-more" aria-label={`Open ${doc.name} actions`}><FiMoreVertical /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleDocuments.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="DocumentsPage-emptyRow">
                      No documents found in {documentTabs.find(tab => tab.id === activeTab)?.label}.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="DocumentsPage-pagination">
          <span>Showing 1 to {visibleDocuments.length} of {filteredDocuments.length} documents for {clientName}</span>
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
      </aside>
    </div>
  </section>
  );
};

export default DocumentsPage;
