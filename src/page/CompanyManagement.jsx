import React, { useState, useEffect, useCallback, memo } from "react";
import axios from "axios";
import API_URL from "../config";

const FormField = memo(
  ({ label, name, type = "text", placeholder, required, value, onChange, error, autoComplete, accept, onFileChange }) => {
    return (
      <div style={{ marginBottom: "18px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#1f2937",
            fontSize: "13px",
          }}>
            {label}
          </label>
          {required && (
            <span style={{ 
              marginLeft: "4px", 
              color: "#ef4444", 
              fontSize: "11px",
              fontWeight: "500"
            }}>• Required</span>
          )}
        </div>

        {type === "file" ? (
          <input
            type="file"
            name={name}
            onChange={onChange || onFileChange}
            accept={accept || "image/*"}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: error ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
              fontSize: "13px",
              backgroundColor: error ? "#fef2f2" : "#f9fafb",
              outline: "none",
              transition: "all 0.2s ease",
              fontWeight: "500",
              color: "#111827",
              boxShadow: error ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? "#ef4444" : "#3b82f6";
              e.target.style.backgroundColor = error ? "#fef2f2" : "#ffffff";
              e.target.style.boxShadow = error 
                ? "0 0 0 2px rgba(239, 68, 68, 0.1)" 
                : "0 0 0 2px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? "#ef4444" : "#e5e7eb";
              e.target.style.backgroundColor = error ? "#fef2f2" : "#f9fafb";
              e.target.style.boxShadow = error 
                ? "0 1px 2px rgba(239, 68, 68, 0.1)" 
                : "0 1px 1px rgba(0, 0, 0, 0.05)";
            }}
          />
        ) : (
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete || "off"}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: error ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
              fontSize: "13px",
              backgroundColor: error ? "#fef2f2" : "#f9fafb",
              outline: "none",
              transition: "all 0.2s ease",
              fontWeight: "500",
              color: "#111827",
              boxShadow: error ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? "#ef4444" : "#3b82f6";
              e.target.style.backgroundColor = error ? "#fef2f2" : "#ffffff";
              e.target.style.boxShadow = error 
                ? "0 0 0 2px rgba(239, 68, 68, 0.1)" 
                : "0 0 0 2px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? "#ef4444" : "#e5e7eb";
              e.target.style.backgroundColor = error ? "#fef2f2" : "#f9fafb";
              e.target.style.boxShadow = error 
                ? "0 1px 2px rgba(239, 68, 68, 0.1)" 
                : "0 1px 1px rgba(0, 0, 0, 0.05)";
            }}
          />
        )}

        {error && (
          <div
            style={{
              color: "#dc2626",
              fontSize: "11px",
              marginTop: "6px",
              padding: "6px 10px",
              background: "#fef2f2",
              borderRadius: "6px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              borderLeft: "2px solid #dc2626",
              animation: "slideIn 0.2s ease-out",
              wordBreak: "break-word",
            }}
          >
            <div style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <span style={{ color: "white", fontSize: "10px" }}>!</span>
            </div>
            <span style={{ fontWeight: "500", flex: 1 }}>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

const CompanyManagement = () => {
  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    companyAddress: "",
    companyPhone: "",
    ownerName: "",
    logoFile: null,
    logo: "",
    ownerEmail: "",
    ownerPassword: "",
  });

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoLoading, setLogoLoading] = useState(false);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState("view");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [searchCode, setSearchCode] = useState("");
  const [searchId, setSearchId] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-2px);
        }
      }
      
      @media (max-width: 768px) {
        .responsive-grid {
          grid-template-columns: 1fr !important;
          gap: 15px !important;
        }
        
        .responsive-flex {
          flex-direction: column !important;
          gap: 10px !important;
        }
        
        .responsive-padding {
          padding: 16px 12px !important;
        }
        
        .responsive-text {
          font-size: 20px !important;
        }
        
        .responsive-table {
          display: block !important;
          overflow-x: auto !important;
        }
        
        .responsive-table th,
        .responsive-table td {
          white-space: nowrap !important;
          padding: 10px 6px !important;
          font-size: 11px !important;
        }
        
        .responsive-buttons {
          flex-wrap: wrap !important;
          gap: 4px !important;
        }
        
        .responsive-button {
          padding: 5px 8px !important;
          font-size: 10px !important;
          min-width: auto !important;
        }
        
        .responsive-header {
          flex-direction: column !important;
          gap: 12px !important;
          text-align: center !important;
          padding: 16px !important;
        }
        
        .responsive-search-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
        }
        
        .responsive-search-input {
          flex-direction: column !important;
          gap: 8px !important;
        }
        
        .responsive-search-button {
          width: 100% !important;
          justify-content: center !important;
        }
        
        .responsive-company-details {
          grid-template-columns: 1fr !important;
        }
        
        .responsive-actions {
          flex-direction: column !important;
          gap: 6px !important;
        }
        
        .responsive-action-button {
          width: 100% !important;
          justify-content: center !important;
        }
        
        .responsive-logo-upload {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        
        .responsive-logo-preview {
          width: 100% !important;
          height: 120px !important;
        }
      }
      
      @media (min-width: 769px) and (max-width: 1024px) {
        .responsive-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 18px !important;
        }
        
        .responsive-table th,
        .responsive-table td {
          padding: 12px 10px !important;
          font-size: 12px !important;
        }
        
        .responsive-padding {
          padding: 20px 16px !important;
        }
        
        .responsive-text {
          font-size: 22px !important;
        }
        
        .responsive-search-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 18px !important;
        }
        
        .responsive-search-input {
          flex-direction: column !important;
          gap: 8px !important;
        }
        
        .responsive-search-button {
          width: 100% !important;
          justify-content: center !important;
        }
        
        .responsive-logo-preview {
          width: 120px !important;
          height: 120px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const clearMessages = () => {
    setMsg("");
    setError("");
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/company`);

      if (res.data?.success && Array.isArray(res.data?.data)) {
        setCompanies(res.data.data);
      } else if (Array.isArray(res.data?.companies)) {
        setCompanies(res.data.companies);
      } else if (Array.isArray(res.data)) {
        setCompanies(res.data);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setCompanies([]);
      setError("Failed to load companies. Please check backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      if (file) {
        
        if (!file.type.match("image.*")) {
          setFormErrors((prev) => ({
            ...prev,
            [name]: "Only image files are allowed (JPEG, PNG, etc.)",
          }));
          return;
        }
        
        
        if (file.size > 2 * 1024 * 1024) {
          setFormErrors((prev) => ({
            ...prev,
            [name]: "File size should be less than 2MB",
          }));
          return;
        }

        setForm((prev) => ({
          ...prev,
          [name]: file,
          logo: "", 
        }));

        
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const validateForm = () => {
    const errors = {};
    const {
      companyName,
      companyEmail,
      companyAddress,
      companyPhone,
      ownerName,
      ownerEmail,
      ownerPassword,
    } = form;

    if (!companyName?.trim()) errors.companyName = "Company name is required";
    if (!companyEmail?.trim()) errors.companyEmail = "Company email is required";
    if (!companyAddress?.trim()) errors.companyAddress = "Company address is required";
    if (!companyPhone?.trim()) errors.companyPhone = "Company phone is required";
    if (!ownerName?.trim()) errors.ownerName = "Owner name is required";
    if (!ownerEmail?.trim()) errors.ownerEmail = "Owner email is required";

    if (!isEditing && !ownerPassword?.trim()) {
      errors.ownerPassword = "Owner password is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (companyEmail && !emailRegex.test(companyEmail)) {
      errors.companyEmail = "Invalid company email format";
    }
    if (ownerEmail && !emailRegex.test(ownerEmail)) {
      errors.ownerEmail = "Invalid owner email format";
    }

    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (companyPhone && !phoneRegex.test(companyPhone)) {
      errors.companyPhone = "Phone must be 10-15 digits";
    }

    if (!isEditing && ownerPassword && ownerPassword.length < 6) {
      errors.ownerPassword = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setForm({
      companyName: "",
      companyEmail: "",
      companyAddress: "",
      companyPhone: "",
      ownerName: "",
      logoFile: null,
      logo: "",
      ownerEmail: "",
      ownerPassword: "",
    });
    setLogoPreview("");
    setFormErrors({});
  };

  
  const uploadLogoToServer = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      void 0;
      
      const uploadRes = await axios.post(`${API_URL}/company/upload-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, 
      });
      
      void 0;
      
      if (uploadRes.data.success) {
        return uploadRes.data.logoUrl;
      } else {
        throw new Error(uploadRes.data.message || 'Logo upload failed');
      }
    } catch (err) {
      console.error("❌ Logo upload failed:", err);
      
      
      let errorMessage = "Failed to upload logo";
      
      if (err.response) {
        
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.request) {
        
        errorMessage = "No response from server. Check if backend is running.";
      } else {
        
        errorMessage = err.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    clearMessages();

    if (!validateForm()) {
      setError("Please fix the errors in the form before submitting.");
      return;
    }

    setIsSubmitting(true);
    setLogoLoading(true);

    try {
      let logoUrl = form.logo;
      
      
      if (form.logoFile) {
        try {
          logoUrl = await uploadLogoToServer(form.logoFile);
          void 0;
        } catch (uploadError) {
          setError(`Logo upload failed: ${uploadError.message}. Please try again or use logo URL instead.`);
          setIsSubmitting(false);
          setLogoLoading(false);
          return;
        }
      }

      const formData = { 
        ...form,
        logo: logoUrl,
      };

      
      delete formData.logoFile;

      if (isEditing && !formData.ownerPassword?.trim()) {
        delete formData.ownerPassword;
      }

      if (isEditing && selectedCompany?._id) {
        const res = await axios.put(
          `${API_URL}/company/${selectedCompany._id}`,
          formData
        );
        
        if (res.data.success) {
          setMsg(res.data.message || "Company updated successfully ✅");
          resetForm();
          setSelectedCompany(null);
          setIsEditing(false);
          setViewMode("view");
          fetchCompanies();
        } else {
          setError(res.data.message || "Update failed");
        }
      }
    } catch (err) {
      console.error("❌ Submit error:", err.response?.data || err.message);

      let errorMessage = "Something went wrong ❌";

      if (err.response?.data) {
        if (Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.join(". ");
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.details) {
          errorMessage = Object.values(err.response.data.details).map(d => d.message).join(". ");
        }
      } else if (err.request) {
        errorMessage = "No response from server. Check backend connection.";
      } else {
        errorMessage = err.message || "Unexpected error";
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLogoLoading(false);
    }
  };

  const handleEdit = (company) => {
    clearMessages();

    setForm({
      companyName: company.companyName || "",
      companyEmail: company.companyEmail || "",
      companyAddress: company.companyAddress || "",
      companyPhone: company.companyPhone || "",
      ownerName: company.ownerName || "",
      logoFile: null,
      logo: company.logo || "",
      ownerEmail: company.ownerEmail || "",
      ownerPassword: "",
    });

    setSelectedCompany(company);
    setIsEditing(true);
    setViewMode("edit");
    
    
    if (company.logo) {
      setLogoPreview(company.logo);
    } else {
      setLogoPreview("");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleView = (company) => {
    clearMessages();
    setSelectedCompany(company);
    setViewMode("view");
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this company? All users will be locked.")) {
      return;
    }

    try {
      await axios.patch(`${API_URL}/company/${id}/deactivate`);
      setMsg("Company deactivated successfully ✅");
      fetchCompanies();

      if (selectedCompany?._id === id) {
        setSelectedCompany((prev) => (prev ? { ...prev, isActive: false } : null));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to deactivate company");
    }
  };

  const handleActivate = async (id) => {
    try {
      await axios.patch(`${API_URL}/company/${id}/activate`);
      setMsg("Company activated successfully ✅");
      fetchCompanies();

      if (selectedCompany?._id === id) {
        setSelectedCompany((prev) => (prev ? { ...prev, isActive: true } : null));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to activate company");
    }
  };

  const handleDelete = async (id) => {
    setShowDeleteConfirm(true);
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/company/${deleteTargetId}`);
      setMsg("Company deleted successfully ✅");
      fetchCompanies();

      if (selectedCompany?._id === deleteTargetId) {
        setSelectedCompany(null);
        setViewMode("view");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete company");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const handleGetByCode = async () => {
    if (!searchCode.trim()) {
      setError("Please enter a company code");
      return;
    }

    clearMessages();

    try {
      const res = await axios.get(`${API_URL}/company/code/${searchCode.trim()}`);
      if (res.data?.company) {
        setSelectedCompany(res.data.company);
        setViewMode("view");
      } else {
        setError("Company not found with this code");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Company not found");
    }
  };

  const handleGetById = async () => {
    if (!searchId.trim()) {
      setError("Please enter a company ID");
      return;
    }

    clearMessages();

    try {
      const res = await axios.get(`${API_URL}/company/${searchId.trim()}`);
      if (res.data?.company) {
        setSelectedCompany(res.data.company);
        setViewMode("view");
      } else {
        setError("Company not found");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Company not found");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: isMobile ? "12px 8px" : isTablet ? "16px 12px" : "24px 16px",
      position: "relative",
    }}>
      {showDeleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.3s ease-out",
          padding: "16px",
        }}>
          <div style={{
            background: "white",
            padding: isMobile ? "20px 16px" : "30px",
            borderRadius: "16px",
            maxWidth: "450px",
            width: "100%",
            boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.2)",
            animation: "slideIn 0.3s ease-out",
          }}>
            <div style={{
              fontSize: isMobile ? "40px" : "50px",
              textAlign: "center",
              marginBottom: "16px",
              color: "#ef4444",
            }}>
              ⚠️
            </div>
            <h3 style={{
              textAlign: "center",
              marginBottom: "12px",
              color: "#1f2937",
              fontSize: isMobile ? "18px" : "20px",
            }}>
              Confirm Deletion
            </h3>
            <p style={{
              textAlign: "center",
              color: "#6b7280",
              marginBottom: "24px",
              fontSize: isMobile ? "13px" : "14px",
              lineHeight: 1.4,
            }}>
              ⚠️ <strong>WARNING:</strong> This action cannot be undone. 
              This will permanently delete the company and all associated users.
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexDirection: isMobile ? "column" : "row",
            }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                style={{
                  padding: isMobile ? "10px 16px" : "12px 24px",
                  background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                  color: "#374151",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: isMobile ? "13px" : "14px",
                  transition: "all 0.2s",
                  minWidth: isMobile ? "auto" : "100px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: isMobile ? "10px 16px" : "12px 24px",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: isMobile ? "13px" : "14px",
                  transition: "all 0.2s",
                  minWidth: isMobile ? "auto" : "100px",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        position: "relative",
        animation: "fadeIn 0.8s ease-out",
      }}>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          padding: isMobile ? "16px" : "20px 24px",
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          borderRadius: "16px",
          boxShadow: "0 12px 30px -8px rgba(37, 99, 235, 0.25)",
          position: "relative",
          overflow: "hidden",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "12px" : "0",
          textAlign: isMobile ? "center" : "left",
        }}
        className="responsive-header"
        >
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            flexDirection: isMobile ? "column" : "row",
            textAlign: isMobile ? "center" : "left",
          }}>
            <div style={{
              width: isMobile ? "50px" : "60px",
              height: isMobile ? "50px" : "60px",
              borderRadius: "12px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.15)",
              animation: "float 3s ease-in-out infinite",
            }}>
              <span style={{ fontSize: isMobile ? "24px" : "28px", color: "#1e40af" }}>🏢</span>
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: isMobile ? "20px" : "24px",
                fontWeight: "700",
                color: "white",
                letterSpacing: "-0.3px",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
              }}
              className="responsive-text"
              >
                Company Management
              </h1>
              <p style={{
                margin: "6px 0 0 0",
                color: "#dbeafe",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: "500",
              }}>
                Manage and oversee all registered companies
              </p>
            </div>
          </div>
          
          <button 
            onClick={fetchCompanies}
            disabled={loading}
            style={{
              padding: isMobile ? "10px 16px" : "12px 20px",
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: isMobile ? "12px" : "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s",
              minWidth: isMobile ? "100%" : "auto",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Refreshing...
              </>
            ) : (
              <>
                <span>🔄</span>
                Refresh List
              </>
            )}
          </button>
        </div>

        
        <div style={{ marginBottom: "24px" }}>
          {msg && (
            <div style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              padding: isMobile ? "16px" : "20px",
              borderRadius: "12px",
              marginBottom: "12px",
              position: "relative",
              overflow: "hidden",
              animation: "slideIn 0.4s ease-out",
            }}>
              <div style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
              }} />
              
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "16px",
                flexDirection: isMobile ? "column" : "row",
                textAlign: isMobile ? "center" : "left",
              }}>
                <div style={{
                  width: isMobile ? "36px" : "40px",
                  height: isMobile ? "36px" : "40px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? "18px" : "20px",
                  flexShrink: 0,
                }}>
                  ✅
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: "0 0 6px 0", 
                    fontSize: isMobile ? "16px" : "18px", 
                    fontWeight: "700" 
                  }}>
                    Success!
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? "13px" : "14px", 
                    opacity: 0.95 
                  }}>
                    {msg}
                  </p>
                </div>
                <button 
                  onClick={clearMessages}
                  style={{
                    padding: isMobile ? "6px 12px" : "8px 16px",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: isMobile ? "12px" : "13px",
                    transition: "all 0.2s",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              padding: isMobile ? "16px" : "20px",
              borderRadius: "12px",
              marginBottom: "12px",
              position: "relative",
              overflow: "hidden",
              animation: "slideIn 0.4s ease-out",
            }}>
              <div style={{
                position: "absolute",
                top: "-25px",
                right: "-25px",
                width: "80px",
                height: "80px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
              }} />
              
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "16px",
                flexDirection: isMobile ? "column" : "row",
                textAlign: isMobile ? "center" : "left",
              }}>
                <div style={{
                  width: isMobile ? "36px" : "40px",
                  height: isMobile ? "36px" : "40px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? "18px" : "20px",
                  flexShrink: 0,
                }}>
                  ❌
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: "0 0 6px 0", 
                    fontSize: isMobile ? "16px" : "18px", 
                    fontWeight: "700" 
                  }}>
                    Error
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? "13px" : "14px", 
                    opacity: 0.95 
                  }}>
                    {error}
                  </p>
                </div>
                <button 
                  onClick={clearMessages}
                  style={{
                    padding: isMobile ? "6px 12px" : "8px 16px",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: isMobile ? "12px" : "13px",
                    transition: "all 0.2s",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: isMobile ? "16px" : "24px",
          borderRadius: "16px",
          marginBottom: "24px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 10px 25px -8px rgba(0, 0, 0, 0.08)",
        }}
        className="responsive-padding"
        >
          <h3 style={{ 
            marginBottom: "20px", 
            color: "#1e40af",
            fontSize: isMobile ? "18px" : "20px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: isMobile ? "20px" : "22px" }}>🔍</span>
            Search Company
          </h3>

          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr", 
              gap: isMobile ? "20px" : "20px",
              marginBottom: "20px",
            }}
            className="responsive-search-grid"
          >
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                }}>
                  🔢
                </div>
                <span style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>Search by Company Code</span>
              </div>
              <div style={{ 
                display: "flex", 
                gap: "10px",
                flexDirection: isMobile ? "column" : "row",
              }}
              className="responsive-search-input"
              >
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Enter Company Code (e.g., CIIS)"
                  autoComplete="off"
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "13px",
                    background: "#f9fafb",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleGetByCode()}
                />
                <button
                  onClick={handleGetByCode}
                  disabled={!searchCode.trim()}
                  style={{
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: !searchCode.trim() ? "not-allowed" : "pointer",
                    fontWeight: "700",
                    fontSize: "13px",
                    transition: "all 0.2s",
                    opacity: !searchCode.trim() ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minWidth: isMobile ? "auto" : "120px",
                    justifyContent: "center",
                    width: isMobile ? "100%" : "auto",
                  }}
                  className="responsive-search-button"
                >
                  <span>🔍</span>
                  Search
                </button>
              </div>
            </div>

            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                }}>
                  🆔
                </div>
                <span style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>Search by Company ID</span>
              </div>
              <div style={{ 
                display: "flex", 
                gap: "10px",
                flexDirection: isMobile ? "column" : "row",
              }}
              className="responsive-search-input"
              >
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Company ID"
                  autoComplete="off"
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "13px",
                    background: "#f9fafb",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleGetById()}
                />
                <button
                  onClick={handleGetById}
                  disabled={!searchId.trim()}
                  style={{
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: !searchId.trim() ? "not-allowed" : "pointer",
                    fontWeight: "700",
                    fontSize: "13px",
                    transition: "all 0.2s",
                    opacity: !searchId.trim() ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minWidth: isMobile ? "auto" : "120px",
                    justifyContent: "center",
                    width: isMobile ? "100%" : "auto",
                  }}
                  className="responsive-search-button"
                >
                  <span>🔎</span>
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        
        {viewMode === "edit" && isEditing && (
          <div style={{
            background: "rgba(255, 255, 255, 0.98)",
            padding: isMobile ? "16px 12px" : "28px",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.1)",
            marginBottom: "24px",
          }}
          className="responsive-padding"
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #e5e7eb",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "12px" : "0",
              textAlign: isMobile ? "center" : "left",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "14px",
                flexDirection: isMobile ? "column" : "row",
                textAlign: isMobile ? "center" : "left",
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  padding: "12px",
                  borderRadius: "12px",
                  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.15)",
                }}>
                  <span style={{ fontSize: "22px", color: "white" }}>✏️</span>
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    color: "#f59e0b",
                    fontSize: isMobile ? "20px" : "22px",
                    fontWeight: "700",
                  }}>
                    Edit Company
                  </h2>
                  <p style={{
                    margin: "6px 0 0 0",
                    color: "#6b7280",
                    fontSize: isMobile ? "13px" : "14px",
                  }}>
                    Update company details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setSelectedCompany(null);
                  setIsEditing(false);
                  setViewMode("view");
                  clearMessages();
                }}
                style={{
                  padding: isMobile ? "8px 16px" : "10px 20px",
                  background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                  color: "#374151",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: isMobile ? "12px" : "13px",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  justifyContent: "center",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <span>←</span>
                Back to List
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "28px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "18px", color: "#1e40af" }}>🏢</span>
                  </div>
                  <h3 style={{
                    margin: 0,
                    color: "#1e40af",
                    fontSize: isMobile ? "16px" : "18px",
                    fontWeight: "700",
                  }}>
                    Company Details
                  </h3>
                </div>

                <div 
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "18px",
                    marginBottom: "18px",
                  }}
                  className="responsive-grid"
                >
                  <FormField
                    label="Company Name"
                    name="companyName"
                    placeholder="Enter company name"
                    required
                    value={form.companyName}
                    onChange={handleChange}
                    error={formErrors.companyName}
                    autoComplete="off"
                  />

                  <FormField
                    label="Company Email"
                    name="companyEmail"
                    type="email"
                    placeholder="company@example.com"
                    required
                    value={form.companyEmail}
                    onChange={handleChange}
                    error={formErrors.companyEmail}
                    autoComplete="off"
                  />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <FormField
                    label="Company Address"
                    name="companyAddress"
                    placeholder="Full company address"
                    required
                    value={form.companyAddress}
                    onChange={handleChange}
                    error={formErrors.companyAddress}
                    autoComplete="off"
                  />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                  }}>
                    <label style={{ 
                      display: "block", 
                      fontWeight: "600", 
                      color: "#1f2937",
                      fontSize: "13px",
                      marginRight: "4px"
                    }}>
                      Company Logo
                    </label>
                    <span style={{ 
                      color: "#6b7280", 
                      fontSize: "11px",
                      fontWeight: "500"
                    }}>• Optional (Max 2MB)</span>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                    flexDirection: isMobile ? "column" : "row",
                  }}
                  className="responsive-logo-upload"
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: "12px" }}>
                        <input
                          type="file"
                          name="logoFile"
                          onChange={handleChange}
                          accept="image/*"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            border: formErrors.logoFile ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
                            fontSize: "13px",
                            backgroundColor: formErrors.logoFile ? "#fef2f2" : "#f9fafb",
                            outline: "none",
                            transition: "all 0.2s ease",
                            fontWeight: "500",
                            color: "#111827",
                            boxShadow: formErrors.logoFile ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
                          }}
                        />
                        <div style={{
                          marginTop: "6px",
                          fontSize: "12px",
                          color: "#6b7280",
                          paddingLeft: "4px",
                        }}>
                          📁 Upload company logo (JPEG, PNG, etc.)
                        </div>
                      </div>

                      <div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          flexWrap: "wrap",
                        }}>
                          <label style={{ 
                            display: "block", 
                            fontWeight: "600", 
                            color: "#1f2937",
                            fontSize: "13px",
                          }}>
                            OR Enter Logo URL
                          </label>
                          <span style={{ 
                            color: "#6b7280", 
                            fontSize: "11px",
                            fontWeight: "500"
                          }}>• Optional</span>
                        </div>
                        <input
                          type="text"
                          name="logo"
                          placeholder="https://example.com/logo.png"
                          value={form.logo}
                          onChange={handleChange}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            border: formErrors.logo ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
                            fontSize: "13px",
                            backgroundColor: formErrors.logo ? "#fef2f2" : "#f9fafb",
                            outline: "none",
                            transition: "all 0.2s ease",
                            fontWeight: "500",
                            color: "#111827",
                            boxShadow: formErrors.logo ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
                          }}
                        />
                      </div>
                    </div>

                    {(logoPreview || form.logo) && (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        <div style={{
                          width: isMobile ? "100%" : "150px",
                          height: isMobile ? "120px" : "150px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          border: "2px solid #e5e7eb",
                          background: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className="responsive-logo-preview"
                        >
                          <img 
                            src={logoPreview || form.logo} 
                            alt="Logo preview" 
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              padding: "8px",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `
                                <div style="
                                  width: 100%;
                                  height: 100%;
                                  display: flex;
                                  flex-direction: column;
                                  align-items: center;
                                  justify-content: center;
                                  color: #6b7280;
                                  font-size: 12px;
                                  text-align: center;
                                  padding: 16px;
                                ">
                                  <div style="font-size: 24px; margin-bottom: 8px;">🏢</div>
                                  <div>Logo Preview</div>
                                  <div style="font-size: 10px; margin-top: 4px;">Invalid image URL</div>
                                </div>
                              `;
                            }}
                          />
                        </div>
                        <span style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          textAlign: "center",
                        }}>
                          Logo Preview
                        </span>
                      </div>
                    )}
                  </div>

                  {(formErrors.logoFile || formErrors.logo) && (
                    <div
                      style={{
                        color: "#dc2626",
                        fontSize: "11px",
                        marginTop: "8px",
                        padding: "8px 12px",
                        background: "#fef2f2",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        borderLeft: "2px solid #dc2626",
                        animation: "slideIn 0.2s ease-out",
                      }}
                    >
                      <div style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <span style={{ color: "white", fontSize: "10px" }}>!</span>
                      </div>
                      <span style={{ fontWeight: "500", flex: 1 }}>
                        {formErrors.logoFile || formErrors.logo}
                      </span>
                    </div>
                  )}
                </div>

                <div 
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "18px",
                    marginBottom: "18px",
                  }}
                  className="responsive-grid"
                >
                  <FormField
                    label="Company Phone"
                    name="companyPhone"
                    placeholder="+1234567890"
                    required
                    value={form.companyPhone}
                    onChange={handleChange}
                    error={formErrors.companyPhone}
                    autoComplete="off"
                  />

                  <FormField
                    label="Owner Name"
                    name="ownerName"
                    placeholder="Owner full name"
                    required
                    value={form.ownerName}
                    onChange={handleChange}
                    error={formErrors.ownerName}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "28px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "18px", color: "#059669" }}>👤</span>
                  </div>
                  <h3 style={{
                    margin: 0,
                    color: "#059669",
                    fontSize: isMobile ? "16px" : "18px",
                    fontWeight: "700",
                  }}>
                    Owner Login Details
                  </h3>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <FormField
                    label="Owner Email"
                    name="ownerEmail"
                    type="email"
                    placeholder="owner@example.com"
                    required
                    value={form.ownerEmail}
                    onChange={handleChange}
                    error={formErrors.ownerEmail}
                    autoComplete="off"
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ 
                      display: "block", 
                      fontWeight: "600", 
                      color: "#1f2937",
                      fontSize: "13px",
                    }}>
                      Owner Password <span style={{ color: "#6b7280", fontSize: "11px" }}>(Optional)</span>
                    </label>
                  </div>

                  <input
                    type="password"
                    name="ownerPassword"
                    placeholder="Leave blank to keep current password"
                    value={form.ownerPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: formErrors.ownerPassword ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
                      fontSize: "13px",
                      backgroundColor: formErrors.ownerPassword ? "#fef2f2" : "#f9fafb",
                      outline: "none",
                      transition: "all 0.2s ease",
                      fontWeight: "500",
                      color: "#111827",
                      boxShadow: formErrors.ownerPassword ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
                    }}
                  />

                  {formErrors.ownerPassword && (
                    <div
                      style={{
                        color: "#dc2626",
                        fontSize: "11px",
                        marginTop: "6px",
                        padding: "6px 10px",
                        background: "#fef2f2",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        borderLeft: "2px solid #dc2626",
                        animation: "slideIn 0.2s ease-out",
                      }}
                    >
                      <div style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <span style={{ color: "white", fontSize: "10px" }}>!</span>
                      </div>
                      <span style={{ fontWeight: "500", flex: 1 }}>{formErrors.ownerPassword}</span>
                    </div>
                  )}

                  <div style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                    paddingLeft: "4px",
                  }}>
                    💡 Leave empty to keep the current password
                  </div>
                </div>
              </div>

              <div style={{ 
                display: "flex", 
                gap: "12px",
                flexDirection: isMobile ? "column" : "row",
              }}
              className="responsive-flex"
              >
                <button
                  type="submit"
                  disabled={isSubmitting || logoLoading}
                  style={{
                    flex: 1,
                    padding: isMobile ? "14px 18px" : "16px 24px",
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: (isSubmitting || logoLoading) ? "not-allowed" : "pointer",
                    fontWeight: "700",
                    fontSize: isMobile ? "14px" : "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    opacity: (isSubmitting || logoLoading) ? 0.8 : 1,
                    transition: "all 0.3s ease",
                    boxShadow: "0 6px 20px rgba(245, 158, 11, 0.2)",
                  }}
                >
                  {(isSubmitting || logoLoading) ? (
                    <>
                      <div style={{
                        width: "18px",
                        height: "18px",
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "18px" }}>✏️</span>
                      <span>Update Company</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setSelectedCompany(null);
                    setIsEditing(false);
                    setViewMode("view");
                    clearMessages();
                  }}
                  style={{
                    padding: isMobile ? "14px 18px" : "16px 24px",
                    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                    color: "#374151",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: isMobile ? "14px" : "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                    justifyContent: "center",
                  }}
                >
                  <span>←</span>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        
        <div>
          <div style={{
            background: "rgba(255, 255, 255, 0.98)",
            padding: isMobile ? "16px 12px" : "28px",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.1)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          className="responsive-padding"
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #e5e7eb",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "12px" : "0",
              textAlign: isMobile ? "center" : "left",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "14px",
                flexDirection: isMobile ? "column" : "row",
                textAlign: isMobile ? "center" : "left",
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
                  padding: "12px",
                  borderRadius: "12px",
                  boxShadow: "0 6px 16px rgba(168, 85, 247, 0.15)",
                }}>
                  <span style={{ fontSize: "22px", color: "white" }}>📋</span>
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    color: "#7c3aed",
                    fontSize: isMobile ? "20px" : "22px",
                    fontWeight: "700",
                  }}>
                    Companies List
                  </h2>
                  <p style={{
                    margin: "6px 0 0 0",
                    color: "#6b7280",
                    fontSize: isMobile ? "13px" : "14px",
                  }}>
                    Total: <strong>{companies.length}</strong> companies registered
                  </p>
                </div>
              </div>

              <div style={{
                padding: "6px 14px",
                background: companies.length > 0 ? "#10b981" : "#6b7280",
                color: "white",
                borderRadius: "999px",
                fontWeight: "700",
                fontSize: isMobile ? "11px" : "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span>{companies.length > 0 ? "✅" : "📊"}</span>
                {companies.length} companies
              </div>
            </div>

            
            {viewMode === "view" && selectedCompany && (
              <div style={{
                background: "#f8fafc",
                padding: isMobile ? "16px" : "22px",
                borderRadius: "14px",
                marginBottom: "20px",
                border: "1px solid #e5e7eb",
                animation: "slideIn 0.3s ease-out",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? "12px" : "0",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                    }}>
                      {selectedCompany.logo && (
                        <div style={{
                          width: isMobile ? "40px" : "50px",
                          height: isMobile ? "40px" : "50px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: "2px solid #e5e7eb",
                          background: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <img 
                            src={selectedCompany.logo} 
                            alt={`${selectedCompany.companyName} logo`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              padding: "4px",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `
                                <div style="
                                  width: 100%;
                                  height: 100%;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  color: #6b7280;
                                  font-size: 16px;
                                ">
                                  🏢
                                </div>
                              `;
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h3 style={{
                          margin: 0,
                          color: "#1e40af",
                          fontSize: isMobile ? "18px" : "20px",
                          fontWeight: "700",
                        }}>
                          {selectedCompany.companyName}
                        </h3>
                        <p style={{
                          margin: "4px 0 0 0",
                          color: "#6b7280",
                          fontSize: isMobile ? "12px" : "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}>
                          <code style={{
                            background: "#e0e7ff",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            color: "#3730a3",
                            fontSize: isMobile ? "11px" : "12px",
                          }}>
                            {selectedCompany.companyCode || "N/A"}
                          </code>
                          <span style={{ display: isMobile ? "none" : "inline" }}>•</span>
                          <span>Owner: {selectedCompany.ownerName}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: isMobile ? "10px" : "12px",
                      background: selectedCompany.isActive 
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      color: "white",
                      padding: "6px 16px",
                      borderRadius: "999px",
                      fontWeight: "700",
                      boxShadow: selectedCompany.isActive 
                        ? "0 3px 10px rgba(16, 185, 129, 0.15)"
                        : "0 3px 10px rgba(239, 68, 68, 0.15)",
                      alignSelf: isMobile ? "flex-start" : "auto",
                    }}
                  >
                    {selectedCompany.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                  gap: "12px",
                  marginBottom: "20px",
                }}
                className="responsive-company-details"
                >
                  <div>
                    <div style={{
                      fontSize: isMobile ? "11px" : "12px",
                      color: "#6b7280",
                      marginBottom: "3px",
                      fontWeight: "500",
                    }}>
                      Company Email
                    </div>
                    <div style={{
                      fontSize: isMobile ? "13px" : "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                      wordBreak: "break-word",
                    }}>
                      {selectedCompany.companyEmail}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? "11px" : "12px",
                      color: "#6b7280",
                      marginBottom: "3px",
                      fontWeight: "500",
                    }}>
                      Company Phone
                    </div>
                    <div style={{
                      fontSize: isMobile ? "13px" : "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}>
                      {selectedCompany.companyPhone}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? "11px" : "12px",
                      color: "#6b7280",
                      marginBottom: "3px",
                      fontWeight: "500",
                    }}>
                      Owner Email
                    </div>
                    <div style={{
                      fontSize: isMobile ? "13px" : "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                      wordBreak: "break-word",
                    }}>
                      {selectedCompany.ownerEmail}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? "11px" : "12px",
                      color: "#6b7280",
                      marginBottom: "3px",
                      fontWeight: "500",
                    }}>
                      Address
                    </div>
                    <div style={{
                      fontSize: isMobile ? "12px" : "13px",
                      fontWeight: "500",
                      color: "#4b5563",
                      wordBreak: "break-word",
                    }}>
                      {selectedCompany.companyAddress || "Not specified"}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  flexDirection: isMobile ? "column" : "row",
                }}
                className="responsive-actions"
                >
                  <button 
                    onClick={() => handleEdit(selectedCompany)}
                    style={{
                      padding: isMobile ? "10px 14px" : "10px 20px",
                      background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: isMobile ? "12px" : "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                      justifyContent: "center",
                    }}
                    className="responsive-action-button"
                  >
                    <span>✏️</span>
                    Edit
                  </button>

                  {selectedCompany.isActive ? (
                    <button 
                      onClick={() => handleDeactivate(selectedCompany._id)}
                      style={{
                        padding: isMobile ? "10px 14px" : "10px 20px",
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: isMobile ? "12px" : "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s",
                        justifyContent: "center",
                      }}
                      className="responsive-action-button"
                    >
                      <span>⏸️</span>
                      Deactivate
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleActivate(selectedCompany._id)}
                      style={{
                        padding: isMobile ? "10px 14px" : "10px 20px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: isMobile ? "12px" : "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s",
                        justifyContent: "center",
                      }}
                      className="responsive-action-button"
                    >
                      <span>▶️</span>
                      Activate
                    </button>
                  )}

                  <button 
                    onClick={() => handleDelete(selectedCompany._id)}
                    style={{
                      padding: isMobile ? "10px 14px" : "10px 20px",
                      background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: isMobile ? "12px" : "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                      justifyContent: "center",
                    }}
                    className="responsive-action-button"
                  >
                    <span>🗑️</span>
                    Delete
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedCompany(null);
                      setViewMode("view");
                    }}
                    style={{
                      padding: isMobile ? "10px 14px" : "10px 20px",
                      background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                      color: "#374151",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: isMobile ? "12px" : "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                      justifyContent: "center",
                    }}
                    className="responsive-action-button"
                  >
                    <span>←</span>
                    Back to List
                  </button>
                </div>
              </div>
            )}

            
            <div style={{
              flex: 1,
              overflowY: "auto",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
            }}>
              {companies.length === 0 ? (
                <div style={{
                  padding: isMobile ? "30px 16px" : "40px 24px",
                  textAlign: "center",
                  color: "#6b7280",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}>
                  <div style={{
                    width: isMobile ? "50px" : "60px",
                    height: isMobile ? "50px" : "60px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? "24px" : "28px",
                    color: "#9ca3af",
                  }}>
                    📊
                  </div>
                  <div>
                    <h4 style={{
                      margin: "0 0 6px 0",
                      fontSize: isMobile ? "16px" : "18px",
                      fontWeight: "600",
                      color: "#374151",
                    }}>
                      No Companies Found
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: isMobile ? "12px" : "13px",
                      color: "#6b7280",
                    }}>
                      No companies are registered in the system
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }} className="responsive-table">
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse", 
                    fontSize: "13px",
                    minWidth: isMobile ? "500px" : "auto",
                  }}>
                    <thead>
                      <tr style={{ 
                        background: "#f8fafc",
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                      }}>
                        <th style={{
                          padding: isMobile ? "10px 6px" : "14px 16px",
                          textAlign: "left",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: "700",
                          color: "#374151",
                          fontSize: isMobile ? "11px" : "13px",
                          whiteSpace: "nowrap",
                        }}>
                          Company
                        </th>
                        <th style={{
                          padding: isMobile ? "10px 6px" : "14px 16px",
                          textAlign: "left",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: "700",
                          color: "#374151",
                          fontSize: isMobile ? "11px" : "13px",
                          whiteSpace: "nowrap",
                        }}>
                          Email
                        </th>
                        <th style={{
                          padding: isMobile ? "10px 6px" : "14px 16px",
                          textAlign: "left",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: "700",
                          color: "#374151",
                          fontSize: isMobile ? "11px" : "13px",
                          whiteSpace: "nowrap",
                        }}>
                          Status
                        </th>
                        <th style={{
                          padding: isMobile ? "10px 6px" : "14px 16px",
                          textAlign: "left",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: "700",
                          color: "#374151",
                          fontSize: isMobile ? "11px" : "13px",
                          whiteSpace: "nowrap",
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company, index) => (
                        <tr
                          key={company._id || index}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: index % 2 === 0 ? "#fff" : "#fafafa",
                          }}
                        >
                          <td style={{
                            padding: isMobile ? "10px 6px" : "14px 16px",
                            fontSize: isMobile ? "11px" : "13px",
                            fontWeight: "600",
                            color: "#1f2937",
                            whiteSpace: "nowrap",
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "10px",
                              flexWrap: "wrap",
                            }}>
                              <div style={{
                                width: isMobile ? "28px" : "32px",
                                height: isMobile ? "28px" : "32px",
                                borderRadius: "8px",
                                background: company.logo ? "transparent" : "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: company.logo ? "transparent" : "#4f46e5",
                                fontSize: isMobile ? "12px" : "14px",
                                overflow: "hidden",
                                border: company.logo ? "none" : "1px solid #e5e7eb",
                              }}>
                                {company.logo ? (
                                  <img 
                                    src={company.logo} 
                                    alt={`${company.companyName} logo`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      const parent = e.target.parentElement;
                                      parent.style.background = "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)";
                                      parent.innerHTML = '<span style="color: #4f46e5; font-size: 14px;">🏢</span>';
                                    }}
                                  />
                                ) : (
                                  "🏢"
                                )}
                              </div>
                              <span style={{ 
                                fontSize: isMobile ? "12px" : "13px",
                                wordBreak: "break-word",
                                maxWidth: isMobile ? "120px" : "none",
                              }}>
                                {company.companyName || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td style={{
                            padding: isMobile ? "10px 6px" : "14px 16px",
                            fontSize: isMobile ? "11px" : "13px",
                            color: "#4b5563",
                            whiteSpace: "nowrap",
                            wordBreak: "break-word",
                            maxWidth: isMobile ? "100px" : "none",
                          }}>
                            {company.companyEmail || "N/A"}
                          </td>
                          <td style={{
                            padding: isMobile ? "10px 6px" : "14px 16px",
                            fontSize: isMobile ? "11px" : "13px",
                            whiteSpace: "nowrap",
                          }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: isMobile ? "3px 8px" : "4px 12px",
                              background: company.isActive 
                                ? "#d1fae5"
                                : "#fee2e2",
                              color: company.isActive ? "#065f46" : "#7f1d1d",
                              borderRadius: "999px",
                              fontWeight: "700",
                              fontSize: isMobile ? "9px" : "11px",
                              border: company.isActive 
                                ? "1px solid #a7f3d0"
                                : "1px solid #fecaca",
                            }}>
                              <span>{company.isActive ? "✅" : "⏸️"}</span>
                              {company.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{
                            padding: isMobile ? "10px 6px" : "14px 16px",
                            fontSize: isMobile ? "11px" : "13px",
                            whiteSpace: "nowrap",
                          }}>
                            <div style={{ 
                              display: "flex", 
                              gap: "6px", 
                              flexWrap: "wrap",
                              flexDirection: isMobile ? "column" : "row",
                            }}
                            className="responsive-buttons"
                            >
                              <button 
                                onClick={() => handleView(company)}
                                style={{
                                  padding: isMobile ? "5px 8px" : "6px 12px",
                                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                  fontSize: isMobile ? "10px" : "11px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  minWidth: isMobile ? "auto" : "60px",
                                  justifyContent: "center",
                                }}
                                className="responsive-button"
                              >
                                <span>👁️</span>
                                View
                              </button>
                              <button 
                                onClick={() => handleEdit(company)}
                                style={{
                                  padding: isMobile ? "5px 8px" : "6px 12px",
                                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                  fontSize: isMobile ? "10px" : "11px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  minWidth: isMobile ? "auto" : "60px",
                                  justifyContent: "center",
                                }}
                                className="responsive-button"
                              >
                                <span>✏️</span>
                                Edit
                              </button>
                              {company.isActive ? (
                                <button 
                                  onClick={() => handleDeactivate(company._id)}
                                  style={{
                                    padding: isMobile ? "5px 8px" : "6px 12px",
                                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: isMobile ? "10px" : "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    minWidth: isMobile ? "auto" : "80px",
                                    justifyContent: "center",
                                  }}
                                  className="responsive-button"
                                >
                                  <span>⏸️</span>
                                  Deactivate
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleActivate(company._id)}
                                  style={{
                                    padding: isMobile ? "5px 8px" : "6px 12px",
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: isMobile ? "10px" : "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    minWidth: isMobile ? "auto" : "70px",
                                    justifyContent: "center",
                                  }}
                                  className="responsive-button"
                                >
                                  <span>▶️</span>
                                  Activate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        
        <div style={{
          marginTop: "30px",
          padding: isMobile ? "16px" : "20px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          textAlign: "center",
          boxShadow: "0 6px 20px -8px rgba(0, 0, 0, 0.08)",
        }}>
          <p style={{
            margin: 0,
            color: "#6b7280",
            fontSize: isMobile ? "11px" : "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}>
            <span>🔒</span>
            <span>Secure Company Management System</span>
            <span style={{ color: "#e5e7eb", display: isMobile ? "none" : "inline" }}>•</span>
            <span>Total Companies: <strong>{companies.length}</strong></span>
            <span style={{ color: "#e5e7eb", display: isMobile ? "none" : "inline" }}>•</span>
            <span>© {new Date().getFullYear()} Company Management Portal</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;