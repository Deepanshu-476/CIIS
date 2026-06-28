import React, { useState, useCallback, memo, useEffect } from "react";
import axios from "axios";
import API_URL from "../../config";
import { useNavigate } from "react-router-dom";

const FormField = memo(
  ({ label, name, type = "text", placeholder, required, value, onChange, error, autoComplete, ...rest }) => {
    return (
      <div style={{ marginBottom: "18px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#1f2937",
            fontSize: "13px",
            marginRight: "4px"
          }}>
            {label}
          </label>
          {required && (
            <span style={{ 
              color: "#ef4444", 
              fontSize: "10px",
              fontWeight: "500"
            }}>• Required</span>
          )}
        </div>

        {type === "file" ? (
          <input
            type="file"
            name={name}
            onChange={onChange}
            accept="image/*"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: error ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
              fontSize: "13px",
              backgroundColor: error ? "#fef2f2" : "#f9fafb",
              outline: "none",
              transition: "all 0.2s ease",
              fontWeight: "500",
              color: "#111827",
              boxShadow: error ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
              WebkitAppearance: "none",
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
            {...rest}
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
              padding: "10px 12px",
              borderRadius: 6,
              border: error ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
              fontSize: "13px",
              backgroundColor: error ? "#fef2f2" : "#f9fafb",
              outline: "none",
              transition: "all 0.2s ease",
              fontWeight: "500",
              color: "#111827",
              boxShadow: error ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
              WebkitAppearance: "none",
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
            {...rest}
          />
        )}

        {error && (
          <div
            style={{
              color: "#dc2626",
              fontSize: "11px",
              marginTop: 4,
              padding: "6px 10px",
              background: "#fef2f2",
              borderRadius: 4,
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              borderLeft: "2px solid #dc2626",
              animation: "slideIn 0.2s ease-out",
              wordBreak: "break-word",
            }}
          >
            <div style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1
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

const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            callback(compressedFile);
          } else {
            callback(file);
          }
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => {
      callback(file);
    };
  };
  reader.onerror = () => {
    callback(file);
  };
};

const CompanyRegister = () => {
  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    companyAddress: "",
    companyPhone: "",
    ownerName: "",
    logoFile: null,
    ownerEmail: "",
    ownerPassword: "",
    planId: "",
  });

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [apiErrors, setApiErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredCompany, setRegisteredCompany] = useState(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/plans`);
        const activePlans = response.data?.plans || response.data?.data || [];
        setPlans(activePlans);
        if (activePlans.length === 1) {
          setForm(prev => ({ ...prev, planId: activePlans[0]._id }));
        }
      } catch (plansError) {
        setError(plansError.response?.data?.message || "Failed to load plans. Please try again.");
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleBackToHome = () => {
    navigate("/");
  };

  const clearMessages = () => {
    setMsg("");
    setError("");
    setApiErrors({});
  };

  const normalizeCreatedCompany = (responseData, submittedData) => {
    const companyData =
      responseData?.company ||
      responseData?.companyDetails ||
      responseData?.companyInfo ||
      responseData?.newCompany ||
      responseData?.savedCompany ||
      responseData?.data?.company ||
      responseData?.data?.companyDetails ||
      responseData?.data ||
      responseData ||
      {};

    return {
      ...companyData,
      companyName: companyData.companyName || submittedData.companyName,
      companyEmail: companyData.companyEmail || submittedData.companyEmail,
      companyCode: companyData.companyCode || companyData.code || companyData.slug || "",
      loginUrl: companyData.loginUrl || companyData.companyLoginUrl || companyData.loginURL || "",
    };
  };

  const getCompanyLoginPath = (companyData = registeredCompany) => {
    const companyCode = companyData?.companyCode || companyData?.code || companyData?.slug;
    const rawLoginUrl = companyData?.loginUrl || (companyCode ? `/company/${companyCode}/login` : "");

    if (!rawLoginUrl) return "";

    if (/^https?:\/\//i.test(rawLoginUrl)) {
      try {
        const parsedUrl = new URL(rawLoginUrl);
        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || "";
      } catch (error) {
        console.warn("Invalid company login URL:", rawLoginUrl, error);
        return companyCode ? `/company/${companyCode}/login` : "";
      }
    }

    return rawLoginUrl.startsWith("/") ? rawLoginUrl : `/${rawLoginUrl}`;
  };

  const getCompanyLoginUrl = (companyData = registeredCompany) => {
    const loginPath = getCompanyLoginPath(companyData);
    if (!loginPath) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${loginPath}`;
  };

  const handleCopyLoginUrl = async () => {
    const loginUrl = getCompanyLoginUrl();
    if (!loginUrl) return;

    try {
      await navigator.clipboard.writeText(loginUrl);
      setMsg("Company login URL copied.");
    } catch (error) {
      console.warn("Unable to copy company login URL", error);
      setError("Login URL copy nahi ho paaya. Please manually copy karein.");
    }
  };

  const handleOpenCompanyLogin = () => {
    const loginPath = getCompanyLoginPath();
    if (loginPath) {
      navigate(loginPath);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      if (file) {
        // Validate file type
        if (!file.type.match("image.*")) {
          setFormErrors((prev) => ({
            ...prev,
            [name]: "Only image files are allowed",
          }));
          return;
        }

        // Auto compress the image
        compressImage(file, (compressedFile) => {
          setForm((prev) => ({
            ...prev,
            [name]: compressedFile,
          }));

          // Create preview
          const reader = new FileReader();
          reader.onload = (ev) => {
            setLogoPreview(ev.target.result);
          };
          reader.readAsDataURL(compressedFile);

          // Clear any previous errors for this field
          setFormErrors((prev) => ({
            ...prev,
            [name]: "",
          }));
        });
      }
    } else {
      let finalValue = value;
      if (name === "companyPhone") {
        finalValue = value.replace(/\D/g, '');
      } else if (name === "ownerName") {
        finalValue = value.replace(/[^a-zA-Z\s]/g, '');
      }

      setForm((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    }

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    
    setApiErrors((prev) => ({
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
      planId,
    } = form;

    if (!companyName?.trim()) errors.companyName = "Company name is required";
    if (!companyEmail?.trim()) errors.companyEmail = "Company email is required";
    if (!companyAddress?.trim()) errors.companyAddress = "Company address is required";
    if (!companyPhone?.trim()) errors.companyPhone = "Company phone is required";
    if (!ownerName?.trim()) errors.ownerName = "Owner name is required";
    if (!ownerEmail?.trim()) errors.ownerEmail = "Owner email is required";
    if (!ownerPassword?.trim()) errors.ownerPassword = "Owner password is required";
    if (!planId) errors.planId = "Please select a plan";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (companyEmail && !emailRegex.test(companyEmail)) {
      errors.companyEmail = "Invalid company email format";
    }
    if (ownerEmail && !emailRegex.test(ownerEmail)) {
      errors.ownerEmail = "Invalid owner email format";
    }

    const phoneRegex = /^\d{10}$/;
    const phoneDigits = companyPhone.replace(/\D/g, '');
    if (companyPhone && !phoneRegex.test(phoneDigits)) {
      errors.companyPhone = "Phone must be exactly 10 digits";
    }

    if (ownerPassword && ownerPassword.length < 6) {
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
      ownerEmail: "",
      ownerPassword: "",
      planId: "",
    });
    setLogoPreview("");
    setFormErrors({});
    setApiErrors({});
    setUploadProgress(0);
  };

  const mapFieldName = (backendField) => {
    const fieldMap = {
      'phone': 'companyPhone',
      'email': 'companyEmail',
      'address': 'companyAddress',
      'name': 'companyName',
    };
    return fieldMap[backendField] || backendField;
  };

  const uploadLogoToServer = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      setLogoLoading(true);
      
      // Try multiple endpoints for better reliability
      let uploadRes;
      let endpoints = [
        `${API_URL}/upload-logo`,
        `${API_URL}/api/upload-logo`,
        `${API_URL}/company/upload-logo`
      ];
      
      let lastError;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying logo upload to: ${endpoint}`);
          uploadRes = await axios.post(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            _skipErrorNotify: true,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            },
            timeout: 30000 // 30 second timeout
          });
          
          if (uploadRes.data && uploadRes.data.success) {
            console.log(`✅ Logo uploaded successfully to ${endpoint}`);
            break;
          }
        } catch (err) {
          console.log(`❌ Failed to upload to ${endpoint}:`, err.message);
          lastError = err;
          continue;
        }
      }
      
      if (!uploadRes || !uploadRes.data || !uploadRes.data.success) {
        throw lastError || new Error("All upload endpoints failed");
      }
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      
      return uploadRes.data.logoUrl;
    } catch (err) {
      console.error("Logo upload failed:", err);
      throw new Error("Failed to upload logo. Please try again or skip logo for now.");
    } finally {
      setLogoLoading(false);
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

    try {
      let logoUrl = "";
      
      // Upload logo if exists
      if (form.logoFile) {
        try {
          logoUrl = await uploadLogoToServer(form.logoFile);
        } catch (uploadError) {
          setError(uploadError.message);
          setIsSubmitting(false);
          return;
        }
      }

      const formData = { 
        ...form,
        logo: logoUrl,
        companyPhone: form.companyPhone.replace(/\D/g, '')
      };

      // Remove the file object before sending
      delete formData.logoFile;

      console.log("Submitting company registration with data:", {
        ...formData,
        ownerPassword: "[HIDDEN]"
      });

      const res = await axios.post(`${API_URL}/company`, formData);
      const createdCompany = normalizeCreatedCompany(res.data, formData);
      
      setMsg(res.data?.message || "Company registered successfully! 🎉");
      setRegisteredCompany(createdCompany);
      setRegistrationSuccess(true);
      
      resetForm();
      
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);

      let errorMessage = "Something went wrong ❌";
      const errorData = err.response?.data;

      if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        }

        if (errorData.details) {
          const newApiErrors = {};
          
          Object.entries(errorData.details).forEach(([field, errorInfo]) => {
            if (errorInfo && errorInfo.message) {
              const frontendField = mapFieldName(field);
              newApiErrors[frontendField] = errorInfo.message;
            }
          });
          
          setApiErrors(newApiErrors);
          
          const firstError = Object.values(newApiErrors)[0];
          if (firstError) {
            errorMessage = firstError;
          }
        }
        
        if (Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(". ");
        }
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = err.message || "Unexpected error";
      }

      setError(errorMessage);
      setRegistrationSuccess(false);
      setRegisteredCompany(null);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getFieldError = (fieldName) => {
    return apiErrors[fieldName] || formErrors[fieldName];
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
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
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-2px);
        }
      }
      
      @media (max-width: 768px) {
        input, button {
          font-size: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: isMobile ? "12px 8px" : isTablet ? "16px 12px" : "24px 16px",
      position: "relative",
      overflow: "auto",
      width: "100%",
    }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        position: "relative",
        animation: "fadeIn 0.8s ease-out",
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: isMobile ? 10 : 12,
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Header Section - Logo Left with Text */}
          <div style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            padding: isMobile ? "16px" : isTablet ? "20px" : "24px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}>
            {/* Logo on Left Side */}
            <div
              style={{
                width: isMobile ? 50 : isTablet ? 60 : 70,
                height: isMobile ? 50 : isTablet ? 60 : 70,
                borderRadius: isMobile ? 10 : 12,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.15)",
                position: "relative",
                zIndex: 2,
                transition: "all 0.3s ease",
                animation: "float 3s ease-in-out infinite",
                flexShrink: 0,
              }}
            >
              <img
                src="/logoo.png"
                alt="CIBNETWORK Logo"
                style={{
                  width: isMobile ? 35 : isTablet ? 45 : 50,
                  height: isMobile ? 35 : isTablet ? 45 : 50,
                  objectFit: "contain",
                  borderRadius: isMobile ? "6px" : "8px",
                  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  const parent = e.target.parentElement;
                  const fallback = document.createElement('div');
                  fallback.textContent = 'CIBNETWORK';
                  fallback.style.color = '#ffffff';
                  fallback.style.fontWeight = 'bold';
                  fallback.style.fontSize = isMobile ? '10px' : '12px';
                  parent.appendChild(fallback);
                }}
              />
            </div>

            {/* Text Content on Right */}
            <div style={{ 
              position: "relative", 
              zIndex: 2,
              flex: 1,
              textAlign: "left"
            }}>
              <h1 style={{
                fontSize: isMobile ? "1.3rem" : isTablet ? "1.5rem" : "1.7rem",
                color: "#ffffff",
                marginBottom: 4,
                fontWeight: "700",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                lineHeight: 1.2,
              }}>
                CIIS NETWORK
              </h1>
              
              <h2 style={{
                fontSize: isMobile ? "1.1rem" : isTablet ? "1.3rem" : "1.5rem",
                color: "#ffffff",
                marginBottom: 6,
                fontWeight: "600",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                lineHeight: 1.2,
              }}>
                Company Registration Form
              </h2>
              
              <p style={{
                color: "#dbeafe",
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                marginBottom: 0,
                fontWeight: "500",
                opacity: 0.95,
                lineHeight: 1.4,
              }}>
                Register your company and create owner account in minutes
              </p>
            </div>

            <div style={{
              position: "absolute",
              top: "-50%",
              right: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
              animation: "spin 20s linear infinite",
            }} />
          </div>

          <div style={{ padding: isMobile ? "12px 12px 0" : isTablet ? "16px 16px 0" : "20px 24px 0" }}>
            {msg && (
              <div style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                padding: isMobile ? "12px" : isTablet ? "16px" : "20px",
                borderRadius: isMobile ? 8 : 10,
                marginBottom: isMobile ? 12 : 16,
                position: "relative",
                overflow: "hidden",
                animation: "slideIn 0.3s ease-out",
              }}>
                
                <div style={{
                  display: "flex",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: 12,
                  position: "relative",
                  flexDirection: isMobile ? "column" : "row",
                }}>
                  <div style={{
                    width: isMobile ? 36 : 40,
                    height: isMobile ? 36 : 40,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? "18px" : "20px",
                    flexShrink: 0,
                  }}>
                    🎉
                  </div>
                  
                  <div style={{ flex: 1, width: "100%" }}>
                    <h3 style={{
                      margin: isMobile ? "0 0 4px 0" : "0 0 6px 0",
                      fontSize: isMobile ? "14px" : isTablet ? "16px" : "18px",
                      fontWeight: "700",
                    }}>
                      Registration Successful!
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: isMobile ? "12px" : "13px",
                      opacity: 0.95,
                      lineHeight: 1.4,
                    }}>
                      {msg}
                    </p>

                    {registeredCompany && (
                      <div style={{
                        marginTop: 14,
                        padding: isMobile ? "10px" : "12px",
                        background: "rgba(255, 255, 255, 0.16)",
                        border: "1px solid rgba(255, 255, 255, 0.28)",
                        borderRadius: 8,
                      }}>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "130px 1fr",
                          gap: isMobile ? 6 : 10,
                          alignItems: "center",
                          marginBottom: 8,
                        }}>
                          <strong style={{ fontSize: "12px" }}>Company Code</strong>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            wordBreak: "break-word",
                          }}>
                            {registeredCompany.companyCode || "Not received from server"}
                          </span>
                        </div>

                        <div style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "130px 1fr",
                          gap: isMobile ? 6 : 10,
                          alignItems: "center",
                        }}>
                          <strong style={{ fontSize: "12px" }}>Login URL</strong>
                          {getCompanyLoginUrl() ? (
                            <a
                              href={getCompanyLoginPath()}
                              style={{
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                wordBreak: "break-all",
                                textDecoration: "underline",
                              }}
                            >
                              {getCompanyLoginUrl()}
                            </a>
                          ) : (
                            <span style={{ fontSize: "12px", fontWeight: "700" }}>
                              Login URL server response me nahi aaya.
                            </span>
                          )}
                        </div>

                        <div style={{
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          gap: 8,
                          marginTop: 12,
                        }}>
                          <button
                            type="button"
                            onClick={handleCopyLoginUrl}
                            disabled={!getCompanyLoginUrl()}
                            style={{
                              padding: isMobile ? "8px 12px" : "7px 12px",
                              background: "rgba(255, 255, 255, 0.24)",
                              color: "#ffffff",
                              border: "1px solid rgba(255, 255, 255, 0.35)",
                              borderRadius: 6,
                              cursor: getCompanyLoginUrl() ? "pointer" : "not-allowed",
                              fontWeight: "700",
                              fontSize: "12px",
                              opacity: getCompanyLoginUrl() ? 1 : 0.6,
                            }}
                          >
                            Copy Login URL
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenCompanyLogin}
                            disabled={!getCompanyLoginUrl()}
                            style={{
                              padding: isMobile ? "8px 12px" : "7px 12px",
                              background: "#ffffff",
                              color: "#047857",
                              border: "1px solid rgba(255, 255, 255, 0.35)",
                              borderRadius: 6,
                              cursor: getCompanyLoginUrl() ? "pointer" : "not-allowed",
                              fontWeight: "700",
                              fontSize: "12px",
                              opacity: getCompanyLoginUrl() ? 1 : 0.6,
                            }}
                          >
                            Open Login Page
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/SuperAdminLogin")}
                            style={{
                              padding: isMobile ? "8px 12px" : "7px 12px",
                              background: "transparent",
                              color: "#ffffff",
                              border: "1px solid rgba(255, 255, 255, 0.35)",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontWeight: "700",
                              fontSize: "12px",
                            }}
                          >
                            Go to Admin Login
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => {
                        clearMessages();
                        setRegistrationSuccess(false);
                        setRegisteredCompany(null);
                      }}
                      style={{
                        marginTop: 12,
                        padding: isMobile ? "6px 12px" : "8px 16px",
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: isMobile ? "12px" : "13px",
                        transition: "all 0.2s",
                        backdropFilter: "blur(10px)",
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      Register Another Company
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#ffffff",
                padding: isMobile ? "12px" : "16px",
                borderRadius: isMobile ? 8 : 10,
                marginBottom: isMobile ? 12 : 16,
                position: "relative",
                overflow: "hidden",
                animation: "slideIn 0.3s ease-out",
              }}>
                
                <div style={{
                  display: "flex",
                  alignItems: isMobile ? "flex-start" : "flex-start",
                  gap: 10,
                  position: "relative",
                  flexDirection: isMobile ? "column" : "row",
                }}>
                  <div style={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? "14px" : "16px",
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    ❌
                  </div>
                  
                  <div style={{ flex: 1, width: "100%" }}>
                    <strong style={{
                      display: "block",
                      marginBottom: 4,
                      fontSize: isMobile ? "13px" : "15px",
                      fontWeight: "700",
                    }}>
                      Registration Failed
                    </strong>
                    <p style={{
                      margin: "0 0 8px 0",
                      fontSize: isMobile ? "12px" : "13px",
                      opacity: 0.95,
                      lineHeight: 1.4,
                    }}>
                      {error}
                    </p>
                    
                    {Object.keys(apiErrors).length > 0 && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <p style={{
                          margin: "0 0 6px 0",
                          fontSize: "12px",
                          fontWeight: "600",
                          opacity: 0.9,
                        }}>
                          Please fix the following errors:
                        </p>
                        <ul style={{
                          margin: 0,
                          paddingLeft: 16,
                          fontSize: "12px",
                          opacity: 0.9,
                        }}>
                          {Object.entries(apiErrors).map(([field, message]) => (
                            <li key={field} style={{ marginBottom: 3 }}>
                              <strong style={{ textTransform: "capitalize" }}>{field}:</strong> {message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={clearMessages}
                    style={{
                      padding: isMobile ? "4px 10px" : "6px 12px",
                      background: "rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: isMobile ? "10px" : "11px",
                      transition: "all 0.2s",
                      flexShrink: 0,
                      width: isMobile ? "100%" : "auto",
                      marginTop: isMobile ? 6 : 0,
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {!registrationSuccess && (
            <div style={{ padding: isMobile ? "16px 12px" : isTablet ? "20px 16px" : "24px" }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: isMobile ? 20 : 24 }}>
                  <div style={{
                    display: "flex",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    marginBottom: isMobile ? 12 : 20,
                    paddingBottom: isMobile ? 10 : 12,
                    borderBottom: "1px solid #e5e7eb",
                    position: "relative",
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 10 : 0,
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}>
                      <div style={{
                        background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                        padding: isMobile ? "8px" : "10px",
                        borderRadius: isMobile ? 8 : 10,
                        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.1)",
                      }}>
                        <span style={{ fontSize: isMobile ? "16px" : "18px", color: "#1e40af" }}>🏢</span>
                      </div>
                      <div>
                        <h2 style={{
                          margin: 0,
                          color: "#1e40af",
                          fontSize: isMobile ? "16px" : isTablet ? "18px" : "20px",
                          fontWeight: "700",
                          lineHeight: 1.2,
                        }}>
                          Company Details
                        </h2>
                        <p style={{
                          margin: "3px 0 0 0",
                          color: "#6b7280",
                          fontSize: isMobile ? "12px" : "13px",
                        }}>
                          Enter your company information
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleBackToHome}
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: isMobile ? "8px 12px" : "10px 16px",
                        background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                        color: "#374151",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: isMobile ? "12px" : "13px",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>←</span>
                      Back to Home
                    </button>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 16,
                    marginBottom: isMobile ? 12 : 16,
                  }}>
                    <FormField
                      label="Company Name"
                      name="companyName"
                      placeholder="Enter company name"
                      required
                      value={form.companyName}
                      onChange={handleChange}
                      error={getFieldError("companyName")}
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
                      error={getFieldError("companyEmail")}
                      autoComplete="off"
                    />
                  </div>

                  <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                    <FormField
                      label="Company Address"
                      name="companyAddress"
                      placeholder="Full company address"
                      required
                      value={form.companyAddress}
                      onChange={handleChange}
                      error={getFieldError("companyAddress")}
                      autoComplete="off"
                    />
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 16,
                    marginBottom: isMobile ? 12 : 16,
                  }}>
                    <FormField
                      label="Company Phone"
                      name="companyPhone"
                      placeholder="Enter 10 digits (e.g., 9876543210)"
                      required
                      value={form.companyPhone}
                      onChange={handleChange}
                      error={getFieldError("companyPhone")}
                      autoComplete="off"
                      type="tel"
                      maxLength={10}
                    />

                    <div style={{ marginBottom: "18px", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
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
                          fontSize: "10px",
                          fontWeight: "500"
                        }}>• Optional (Max 2MB)</span>
                      </div>

                      <div style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        gap: 12,
                        alignItems: isMobile ? "stretch" : "center",
                      }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input
                            type="file"
                            name="logoFile"
                            onChange={handleChange}
                            accept="image/*"
                            disabled={logoLoading}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 6,
                              border: getFieldError("logoFile") ? "1.5px solid #ef4444" : "1px solid #e5e7eb",
                              fontSize: "13px",
                              backgroundColor: logoLoading ? "#f3f4f6" : (getFieldError("logoFile") ? "#fef2f2" : "#f9fafb"),
                              outline: "none",
                              transition: "all 0.2s ease",
                              fontWeight: "500",
                              color: "#111827",
                              boxShadow: getFieldError("logoFile") ? "0 1px 2px rgba(239, 68, 68, 0.1)" : "0 1px 1px rgba(0, 0, 0, 0.05)",
                              WebkitAppearance: "none",
                              opacity: logoLoading ? 0.7 : 1,
                              cursor: logoLoading ? "not-allowed" : "pointer",
                            }}
                          />
                          
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div style={{
                              position: "absolute",
                              bottom: -2,
                              left: 0,
                              width: "100%",
                              height: "2px",
                              background: "#e5e7eb",
                              borderRadius: "2px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                width: `${uploadProgress}%`,
                                height: "100%",
                                background: "#3b82f6",
                                transition: "width 0.3s ease"
                              }} />
                            </div>
                          )}
                        </div>
                        
                        {logoPreview && (
                          <div style={{
                            width: isMobile ? "100%" : "80px",
                            height: isMobile ? "60px" : "80px",
                            borderRadius: 6,
                            overflow: "hidden",
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative"
                          }}>
                            <img 
                              src={logoPreview} 
                              alt="Logo preview" 
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                padding: "4px",
                              }}
                            />
                            {logoLoading && (
                              <div style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "rgba(255,255,255,0.7)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}>
                                <div style={{
                                  width: 24,
                                  height: 24,
                                  border: "2px solid #e5e7eb",
                                  borderTop: "2px solid #3b82f6",
                                  borderRadius: "50%",
                                  animation: "spin 1s linear infinite"
                                }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {logoLoading && (
                        <div style={{
                          marginTop: 8,
                          fontSize: "11px",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          <div style={{
                            width: 14,
                            height: 14,
                            border: "2px solid #e5e7eb",
                            borderTop: "2px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                          }} />
                          <span>Uploading logo... {uploadProgress}%</span>
                        </div>
                      )}

                      {getFieldError("logoFile") && (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "11px",
                            marginTop: 4,
                            padding: "6px 10px",
                            background: "#fef2f2",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                            borderLeft: "2px solid #dc2626",
                            animation: "slideIn 0.2s ease-out",
                            wordBreak: "break-word",
                          }}
                        >
                          <div style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 1
                          }}>
                            <span style={{ color: "white", fontSize: "10px" }}>!</span>
                          </div>
                          <span style={{ fontWeight: "500", flex: 1 }}>{getFieldError("logoFile")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: isMobile ? 20 : 24 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                    <label style={{ display: "block", fontWeight: "700", color: "#1f2937", fontSize: "14px", marginRight: 6 }}>
                      Select Plan
                    </label>
                    <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: "600" }}>• Required</span>
                  </div>

                  {plansLoading ? (
                    <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 8, color: "#6b7280", fontWeight: 600 }}>
                      Loading plans...
                    </div>
                  ) : plans.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                      {plans.map(plan => {
                        const selected = form.planId === plan._id;
                        return (
                          <button
                            type="button"
                            key={plan._id}
                            onClick={() => handleChange({ target: { name: "planId", value: plan._id } })}
                            style={{
                              textAlign: "left",
                              border: selected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                              background: selected ? "#eff6ff" : "#ffffff",
                              borderRadius: 10,
                              padding: 14,
                              cursor: "pointer",
                              boxShadow: selected ? "0 8px 18px rgba(37, 99, 235, 0.14)" : "0 1px 3px rgba(0,0,0,0.06)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{plan.name}</div>
                              <div style={{ color: "#2563eb", fontWeight: 900 }}>₹{Number(plan.price || 0).toLocaleString("en-IN")}</div>
                            </div>
                            <div style={{ marginTop: 6, color: "#4b5563", fontSize: 12, fontWeight: 700 }}>
                              {plan.durationDays} days / {plan.allowedPages?.length || 0} pages
                            </div>
                            {!!plan.description && (
                              <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12, lineHeight: 1.5 }}>{plan.description}</div>
                            )}
                            {!!plan.features?.length && (
                              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {plan.features.slice(0, 3).map(feature => (
                                  <span key={feature} style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 999, padding: "4px 8px", fontSize: 11, fontWeight: 700 }}>
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: 14, border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", background: "#fef2f2", fontWeight: 700 }}>
                      No active plans available. Please ask super admin to create a plan first.
                    </div>
                  )}
                  {getFieldError("planId") && (
                    <div style={{ color: "#dc2626", fontSize: "12px", marginTop: 8, fontWeight: 700 }}>
                      {getFieldError("planId")}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: isMobile ? 20 : 24 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: isMobile ? 12 : 20,
                    paddingBottom: isMobile ? 10 : 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}>
                    <div style={{
                      background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                      padding: isMobile ? "8px" : "10px",
                      borderRadius: isMobile ? 8 : 10,
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)",
                    }}>
                      <span style={{ fontSize: isMobile ? "16px" : "18px", color: "#059669" }}>👤</span>
                    </div>
                    <div>
                      <h2 style={{
                        margin: 0,
                        color: "#059669",
                        fontSize: isMobile ? "16px" : isTablet ? "18px" : "20px",
                        fontWeight: "700",
                        lineHeight: 1.2,
                      }}>
                        Owner Account Details
                      </h2>
                      <p style={{
                        margin: "3px 0 0 0",
                        color: "#6b7280",
                        fontSize: isMobile ? "12px" : "13px",
                      }}>
                        Create the owner's login credentials
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 16,
                    marginBottom: isMobile ? 12 : 16,
                  }}>
                    <FormField
                      label="Owner Full Name"
                      name="ownerName"
                      placeholder="Owner full name"
                      required
                      value={form.ownerName}
                      onChange={handleChange}
                      error={getFieldError("ownerName")}
                      autoComplete="off"
                    />

                    <FormField
                      label="Owner Email / For Super Admin Login"
                      name="ownerEmail"
                      type="email"
                      placeholder="owner@example.com"
                      required
                      value={form.ownerEmail}
                      onChange={handleChange}
                      error={getFieldError("ownerEmail")}
                      autoComplete="off"
                    />
                  </div>

                  <FormField
                    label="Owner Password"
                    name="ownerPassword"
                    type="password"
                    placeholder="Enter strong password (min 6 characters)"
                    required
                    value={form.ownerPassword}
                    onChange={handleChange}
                    error={getFieldError("ownerPassword")}
                    autoComplete="new-password"
                  />
                </div>

                <div style={{ 
                  background: "#f8fafc",
                  padding: isMobile ? "12px" : "16px",
                  borderRadius: isMobile ? 8 : 10,
                  marginBottom: isMobile ? 16 : 20,
                  border: "1px solid #e5e7eb",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 18,
                      height: 18,
                      flexShrink: 0,
                      position: "relative",
                    }}>
                      <input 
                        type="checkbox" 
                        id="terms" 
                        required 
                        style={{
                          width: "100%",
                          height: "100%",
                          margin: 0,
                          borderRadius: 3,
                          border: "1.5px solid #d1d5db",
                          cursor: "pointer",
                          appearance: "none",
                          position: "relative",
                          transition: "all 0.2s",
                        }}
                        onChange={(e) => {
                          e.target.style.background = e.target.checked ? "#2563eb" : "#fff";
                          e.target.style.borderColor = e.target.checked ? "#2563eb" : "#d1d5db";
                        }}
                      />
                    </div>
                    <label htmlFor="terms" style={{ 
                      fontSize: isMobile ? "12px" : "13px", 
                      color: "#4b5563",
                      lineHeight: 1.4,
                    }}>
                      <strong style={{ color: "#1f2937" }}>I confirm that all information provided is accurate</strong> and I have the authority to 
                      register this company. By submitting, I agree to the{" "}
                      <span style={{ color: "#2563eb", fontWeight: "600" }}>terms and conditions</span>.
                    </label>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  gap: isMobile ? 10 : 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: isMobile ? 16 : 20,
                  flexDirection: isMobile ? "column" : "row",
                }}>
                  <button
                    type="submit"
                    disabled={isSubmitting || logoLoading}
                    style={{
                      padding: isMobile ? "12px 20px" : "14px 30px",
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: isMobile ? 8 : 10,
                      cursor: (isSubmitting || logoLoading) ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: isMobile ? "13px" : "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: (isSubmitting || logoLoading) ? 0.8 : 1,
                      transition: "all 0.3s ease",
                      minWidth: isMobile ? "100%" : "180px",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{
                          width: 18,
                          height: 18,
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "16px" }}>🚀</span>
                        <span>Register Company</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    style={{
                      padding: isMobile ? "12px 20px" : "14px 24px",
                      background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: isMobile ? 8 : 10,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: isMobile ? "13px" : "14px",
                      minWidth: isMobile ? "100%" : "140px",
                      transition: "all 0.2s",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    Clear Form
                  </button>
                </div>

                <div style={{ 
                  textAlign: "center", 
                  padding: isMobile ? "12px" : "16px",
                  background: "#f9fafb",
                  borderRadius: isMobile ? 8 : 10,
                  border: "1px solid #e5e7eb",
                }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: isMobile ? "6px 12px" : "8px 16px",
                    background: "rgba(37, 99, 235, 0.1)",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}>
                    <span style={{ fontSize: "16px", color: "#2563eb" }}>💡</span>
                    <span style={{ 
                      color: "#1f2937", 
                      fontWeight: "600",
                      fontSize: isMobile ? "12px" : "13px",
                    }}>
                      Important Information
                    </span>
                  </div>
                  <p style={{ 
                    margin: "0",
                    color: "#6b7280",
                    fontSize: isMobile ? "12px" : "13px",
                    lineHeight: 1.5,
                    maxWidth: "600px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}>
                    <strong>Note:</strong> After registration, a unique company code will be generated 
                    automatically. The owner can use the provided email and password to login to the 
                    Super Admin dashboard. Keep your credentials secure.
                  </p>
                </div>
              </form>
            </div>
          )}

          <div style={{
            background: "#f3f4f6",
            padding: isMobile ? "12px" : "16px 24px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
          }}>
            <p style={{
              margin: 0,
              color: "#6b7280",
              fontSize: isMobile ? "10px" : "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flexWrap: "wrap",
            }}>
              <span>🔒</span>
              <span>Your information is secure and encrypted</span>
              <span style={{ display: isMobile ? "none" : "inline" }}>•</span>
              <span>© {new Date().getFullYear()} Company Registration Portal</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegister;
