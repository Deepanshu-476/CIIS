import React, { useState, useRef, useEffect } from "react";
import {
  FiUploadCloud,
  FiDownload,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiPlus,
  FiFolder,
  FiTrash2,
} from "react-icons/fi";
import axios from "../../utils/axiosConfig";
import "./ProjectBulkImportModal.css";

const ProjectBulkImportModal = ({
  isOpen,
  onClose,
  onSuccess,
  currentProjectId = null,
  currentProjectName = "",
  projectsList = [],
  branchId = null,
  allowedModes = ["new", "existing"],
}) => {
  const isOnlyExisting = allowedModes.length === 1 && allowedModes[0] === "existing";
  const isOnlyNew = allowedModes.length === 1 && allowedModes[0] === "new";

  const initialMode = isOnlyExisting
    ? "existing"
    : isOnlyNew
      ? "new"
      : currentProjectId
        ? "existing"
        : "new";

  const [mode, setMode] = useState(initialMode);
  const [selectedProjectId, setSelectedProjectId] = useState(
    currentProjectId || (projectsList[0]?._id || projectsList[0]?.id || "")
  );
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (isOnlyExisting || currentProjectId) {
        setMode("existing");
        if (currentProjectId) {
          setSelectedProjectId(currentProjectId);
        } else if (projectsList.length > 0) {
          setSelectedProjectId(projectsList[0]._id || projectsList[0].id || "");
        }
      } else if (isOnlyNew) {
        setMode("new");
      } else {
        setMode("new");
        if (projectsList.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsList[0]._id || projectsList[0].id || "");
        }
      }
      setFile(null);
      setValidationErrors([]);
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, currentProjectId, projectsList, isOnlyExisting, isOnlyNew]);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setErrorMessage("");

      const response = await axios.get("/projects/sample-excel", {
        responseType: "blob",
        cache: false,
        noCache: true,
      });

      const blobData = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

      if (!blobData || blobData.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "CIIS_Project_Tasks_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => {
        try {
          window.URL.revokeObjectURL(url);
        } catch (_) {}
      }, 1000);
    } catch (err) {
      console.error("Failed to download demo excel template:", err);
      let message = "Failed to download template. Please check your connection and try again.";
      try {
        if (err.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.message) message = parsed.message;
        } else if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (err.message) {
          message = err.message;
        }
      } catch (_) {}
      setErrorMessage(message);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const processSelectedFile = (selected) => {
    if (!selected) return;

    const ext = selected.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setErrorMessage("Please select a valid Excel file (.xlsx, .xls) or CSV");
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setErrorMessage("File size exceeds 20MB limit");
      return;
    }

    setFile(selected);
    setValidationErrors([]);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select an Excel file to upload");
      return;
    }

    if (mode === "existing" && !selectedProjectId) {
      setErrorMessage("Please select a target project for Existing Project mode");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");
      setValidationErrors([]);
      setSuccessMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      if (mode === "existing") {
        formData.append("projectId", selectedProjectId);
      }
      if (branchId) {
        formData.append("branchId", branchId);
      }

      const response = await axios.post("/projects/bulk-import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        setSuccessMessage(response.data.message || "Excel imported successfully!");
        if (onSuccess) {
          onSuccess(response.data);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(response.data?.message || "Import failed. Please try again.");
      }
    } catch (err) {
      console.error("Error importing excel:", err);
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        setValidationErrors(data.errors);
        setErrorMessage(data.message || `Found ${data.errors.length} validation issues in your Excel file.`);
      } else {
        setErrorMessage(
          data?.message || err.message || "An unexpected error occurred during Excel import."
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="pbim-overlay" onClick={onClose}>
      <div className="pbim-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pbim-header">
          <div>
            <h2 className="pbim-header-title">
              <span className="pbim-header-icon">
                <FiUploadCloud />
              </span>
              {isOnlyExisting || currentProjectId
                ? "Bulk Import Tasks (Excel)"
                : isOnlyNew
                  ? "Bulk Import Projects (Excel)"
                  : "Bulk Import Projects & Tasks (Excel)"}
            </h2>
            <p className="pbim-header-subtitle">
              {isOnlyExisting || currentProjectId
                ? "Upload an Excel file to automatically create tasks for your project"
                : isOnlyNew
                  ? "Upload an Excel file to automatically create new projects and tasks"
                  : "Upload an Excel file to automatically create tasks or new projects"}
            </p>
          </div>
          <button
            type="button"
            className="pbim-close-btn"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="pbim-body">
          {/* Mode Selection - Only visible when multiple modes are allowed and no fixed project */}
          {allowedModes.length > 1 && !currentProjectId && (
            <div>
              <div className="pbim-mode-label">Select Import Destination</div>
              <div className="pbim-mode-grid">
                <button
                  type="button"
                  className={`pbim-mode-card ${mode === "existing" ? "active" : ""}`}
                  onClick={() => {
                    setMode("existing");
                    setValidationErrors([]);
                    setErrorMessage("");
                  }}
                >
                  <div className="pbim-mode-card-title">
                    <FiFolder /> Add to Existing Project
                  </div>
                  <div className="pbim-mode-card-desc">
                    Import multiple tasks into an existing project.
                  </div>
                </button>

                <button
                  type="button"
                  className={`pbim-mode-card ${mode === "new" ? "active" : ""}`}
                  onClick={() => {
                    setMode("new");
                    setValidationErrors([]);
                    setErrorMessage("");
                  }}
                >
                  <div className="pbim-mode-card-title">
                    <FiPlus /> Create New Project(s)
                  </div>
                  <div className="pbim-mode-card-desc">
                    Auto-create new project(s) and all their tasks from Excel data.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Target Project Dropdown (if Existing Project mode) */}
          {mode === "existing" && (
            <div className="pbim-field-group">
              <label className="pbim-label">Target Project *</label>
              {currentProjectId && currentProjectName ? (
                <input
                  type="text"
                  className="pbim-select"
                  value={currentProjectName}
                  disabled
                  style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                />
              ) : (
                <select
                  className="pbim-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">-- Choose Project --</option>
                  {projectsList.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.projectName || "Unnamed Project"} (
                      {(p.tasks || []).length} tasks)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Download Demo Excel Template Box */}
          <div className="pbim-template-box">
            <div className="pbim-template-info">
              <div className="pbim-template-icon">
                <FiFileText />
              </div>
              <div>
                <h4 className="pbim-template-title">Download Demo Excel File</h4>
                <p className="pbim-template-hint">
                  Pre-formatted with required columns: Task Title, Assignee Email/Phone, Due Date, etc.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="pbim-btn-download"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
            >
              <FiDownload />
              {isDownloadingTemplate ? "Downloading..." : "Download Demo Excel"}
            </button>
          </div>

          {/* Dropzone Area */}
          <div
            className={`pbim-dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => processSelectedFile(e.target.files[0])}
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              style={{ display: "none" }}
            />

            {file ? (
              <div
                className="pbim-file-selected"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pbim-file-info">
                  <FiFileText className="pbim-file-icon" />
                  <div>
                    <div className="pbim-file-name">{file.name}</div>
                    <div className="pbim-file-size">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="pbim-file-remove"
                  onClick={() => setFile(null)}
                  title="Remove file"
                >
                  <FiTrash2 />
                </button>
              </div>
            ) : (
              <>
                <FiUploadCloud className="pbim-dropzone-icon" />
                <p className="pbim-dropzone-text">
                  Click to browse or drag and drop your Excel file here
                </p>
                <p className="pbim-dropzone-subtext">
                  Supports .xlsx, .xls, .csv (Max 20MB)
                </p>
              </>
            )}
          </div>

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="pbim-error-box">
              <div className="pbim-error-header">
                <FiAlertCircle />
                <span>
                  Validation Failed: {validationErrors.length} Issue(s) Found
                </span>
              </div>
              <div className="pbim-error-list">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="pbim-error-item">
                    <span className="pbim-error-badge">Row {err.row}</span>
                    <div>
                      <span className="pbim-error-field">
                        {err.field ? `[${err.field}]: ` : ""}
                      </span>
                      <span>{err.error}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Error Message */}
          {errorMessage && validationErrors.length === 0 && (
            <div className="pbim-error-box">
              <div className="pbim-error-header">
                <FiAlertCircle />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="pbim-success-box">
              <FiCheckCircle style={{ fontSize: "1.2rem", flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pbim-footer">
          <button
            type="button"
            className="pbim-btn pbim-btn-secondary"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pbim-btn pbim-btn-primary"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <span className="pbim-spinner"></span>
                Importing...
              </>
            ) : (
              <>
                <FiUploadCloud />
                {isOnlyExisting || currentProjectId
                  ? "Import Tasks"
                  : isOnlyNew
                    ? "Import Projects"
                    : "Import Excel Data"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectBulkImportModal;
