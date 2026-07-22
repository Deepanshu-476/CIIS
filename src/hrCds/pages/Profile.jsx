import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import "./Profile.css";
import {
  FiCreditCard,
  FiDownload,
  FiEdit,
  FiEye,
  FiFileText,
  FiHeart,
  FiLock,
  FiPhone,
  FiSave,
  FiTrash2,
  FiUpload,
  FiUser,
  FiX,
} from "react-icons/fi";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    return null;
  }
};

const getUserId = (user) => user?._id || user?.id || null;

const buildInitialForm = (user = {}) => ({
  name: user.name || "",
  phone: user.phone || user.mobile || "",
  bankHolderName: user.bankHolderName || "",
  accountNumber: user.accountNumber || "",
  confirmAccountNumber: user.accountNumber || "",
  ifsc: user.ifsc || "",
  bankName: user.bankName || "",
  fatherName: user.fatherName || "",
  motherName: user.motherName || "",
  spouseName: user.spouseName || "",
  aadhaar: user.aadhaar || user.aadhar || user.aadharCard || "",
  panCard: user.panCard || user.pan || "",
});

const displayValue = (value) => value || "Not provided";

const maskAccountNumber = (value) => {
  const accountNumber = String(value || "");
  if (!accountNumber) return "";
  if (accountNumber.length <= 4) return accountNumber;
  return `${"X".repeat(Math.min(8, accountNumber.length - 4))}${accountNumber.slice(-4)}`;
};

const InfoItem = ({ label, value, required = false }) => (
  <div className={`UserDetails-info-item${required && !value ? " is-missing" : ""}`}>
    <span>
      {label}
      {required && <em className="UserDetails-required-badge">* Required</em>}
    </span>
    <strong>{required && !value ? "Required field" : displayValue(value)}</strong>
  </div>
);

const Profile = () => {
  const storedUser = useMemo(() => getStoredUser(), []);
  const userId = getUserId(storedUser);
  const [profile, setProfile] = useState(storedUser);
  const [formData, setFormData] = useState(buildInitialForm(storedUser));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentName, setDocumentName] = useState("");
  const documentInputRef = useRef(null);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/users/profile/${userId}`);
      const userData = response.data?.user || response.data?.data || response.data;
      const mergedUser = { ...storedUser, ...userData };

      setProfile(mergedUser);
      setFormData(buildInitialForm(mergedUser));
      localStorage.setItem("user", JSON.stringify(mergedUser));
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfile(storedUser);
      setFormData(buildInitialForm(storedUser));
      setMessage({ type: "warning", text: "Latest profile could not be loaded. Showing saved login details." });
    } finally {
      setLoading(false);
    }
  }, [storedUser, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadDocuments = useCallback(async () => {
    if (!userId) return;
    setDocumentsLoading(true);
    try {
      const response = await axios.get(`/users/${userId}/documents`);
      setDocuments(response.data?.documents || []);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Documents could not be loaded." });
    } finally {
      setDocumentsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDocumentButtonClick = () => {
    if (!documentName.trim()) {
      setMessage({ type: "error", text: "Please enter the document name first." });
      return;
    }
    documentInputRef.current?.click();
  };

  const handleDocumentSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setUploadingDocument(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("name", documentName.trim());
      const response = await axios.post(`/users/${userId}/documents`, formData);
      setDocuments((current) => [...current, response.data.document]);
      setDocumentName("");
      setMessage({ type: "success", text: "Document uploaded successfully." });
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      setMessage({
        type: "error",
        text: backendMessage
          ? `Upload failed: ${backendMessage}`
          : "Document upload failed. Please select the file again.",
      });
    } finally {
      setUploadingDocument(false);
      event.target.value = "";
    }
  };

  const openDocument = async (item, download = false) => {
    try {
      const response = await axios.get(download ? item.downloadUrl : item.viewUrl, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(response.data);
      if (download) {
        const link = window.document.createElement("a");
        link.href = blobUrl;
        link.download = item.name || "document";
        link.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        setDocumentPreview({
          url: blobUrl,
          name: item.name || "Document Preview",
          type: response.data.type || "",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Document could not be opened." });
    }
  };

  const closeDocumentPreview = () => {
    setDocumentPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  useEffect(() => () => {
    if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url);
  }, [documentPreview]);

  const deleteDocument = async (documentId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await axios.delete(`/users/${userId}/documents/${documentId}`);
      setDocuments((current) => current.filter((item) => item._id !== documentId));
      setMessage({ type: "success", text: "Document deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Document could not be deleted." });
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openEdit = () => {
    setFormData(buildInitialForm(profile));
    setEditOpen(true);
    setMessage(null);
  };

  const closeEdit = () => {
    if (!saving) {
      setEditOpen(false);
      setFormData(buildInitialForm(profile));
    }
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordOpen(true);
    setMessage(null);
  };

  const closePasswordModal = () => {
    if (!passwordSaving) {
      setPasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const requiredFields = [
      ["name", "Full Name"],
      ["phone", "Mobile Number"],
      ["bankHolderName", "Account Holder Name"],
      ["accountNumber", "Account Number"],
      ["ifsc", "IFSC Code"],
      ["bankName", "Bank Name"],
      ["fatherName", "Father's Name"],
      ["motherName", "Mother's Name"],
      ["aadhaar", "Aadhaar Number"],
      ["panCard", "PAN Number"],
    ];
    const missingFields = requiredFields
      .filter(([field]) => !String(formData[field] || "").trim())
      .map(([, label]) => label);

    if (missingFields.length) {
      setMessage({ type: "error", text: `Please fill all required fields: ${missingFields.join(", ")}.` });
      return;
    }

    if (!/^\d{12}$/.test(formData.aadhaar.trim())) {
      setMessage({ type: "error", text: "Aadhaar Number must contain exactly 12 digits." });
      return;
    }

    const normalizedPan = formData.panCard.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizedPan)) {
      setMessage({ type: "error", text: "Please enter a valid PAN Number (for example: ABCDE1234F)." });
      return;
    }

    const normalizedAccountNumber = formData.accountNumber.trim();
    if (!/^\d{9,18}$/.test(normalizedAccountNumber)) {
      setMessage({ type: "error", text: "Account Number must contain 9 to 18 digits." });
      return;
    }

    if (normalizedAccountNumber !== formData.confirmAccountNumber.trim()) {
      setMessage({ type: "error", text: "Account Number and Confirm Account Number do not match." });
      return;
    }

    const normalizedIfsc = formData.ifsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      setMessage({ type: "error", text: "Please enter a valid IFSC Code (for example: SBIN0001234)." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const updateData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      bankHolderName: formData.bankHolderName.trim(),
      accountNumber: normalizedAccountNumber,
      confirmAccountNumber: formData.confirmAccountNumber.trim(),
      ifsc: normalizedIfsc,
      bankName: formData.bankName.trim(),
      fatherName: formData.fatherName.trim(),
      motherName: formData.motherName.trim(),
      spouseName: formData.spouseName.trim(),
      aadhaar: formData.aadhaar.trim(),
      panCard: normalizedPan,
    };

    try {
      const response = await axios.put("/users/me", updateData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Update failed");
      }

      const updatedUser = response.data?.message?.user || response.data?.user || response.data?.data || updateData;
      const mergedUser = { ...profile, ...updateData, ...updatedUser };

      setProfile(mergedUser);
      setFormData(buildInitialForm(mergedUser));
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...mergedUser }));
      setEditOpen(false);
      setMessage({ type: "success", text: "Your details have been updated successfully." });
    } catch (error) {
      console.error("Profile update failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || error.message || "Failed to update your details.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Please fill all password fields." });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    setPasswordSaving(true);
    setMessage(null);

    try {
      const response = await axios.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Password change failed");
      }

      setPasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Your password has been changed successfully." });
    } catch (error) {
      console.error("Password change failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || error.message || "Failed to change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!userId) {
    return (
      <div className="UserDetails-page">
        <div className="UserDetails-error-card">User not logged in. Please login first.</div>
      </div>
    );
  }

  if (loading) {
    return <CIISLoader />;
  }

  return (
    <div className="UserDetails-page">
      <div className="UserDetails-header">
        <div>
          <span className="UserDetails-eyebrow">My Profile</span>
          <h1>Personal Information</h1>
          <p>View and update your personal, identity, bank, and family details.</p>
        </div>
        <div className="UserDetails-header-actions">
          <button className="UserDetails-primary-btn" onClick={openEdit}>
            <FiEdit /> Edit Details
          </button>
          <button className="UserDetails-secondary-btn UserDetails-password-btn" onClick={openPasswordModal}>
            <FiLock /> Change Password
          </button>
        </div>
      </div>

      {message && (
        <div className={`UserDetails-alert ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}><FiX /></button>
        </div>
      )}

      <section className="UserDetails-profile-card">
        <div className="UserDetails-avatar">
          {(profile?.name || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2>{displayValue(profile?.name)}</h2>
          <p>{displayValue(profile?.email)}</p>
        </div>
      </section>

      <div className="UserDetails-grid">
        <section className="UserDetails-section-card">
          <h3><FiUser /> Basic Details</h3>
          <div className="UserDetails-info-grid">
            <InfoItem label="Full Name" value={profile?.name} required />
            <InfoItem label="Mobile Number" value={profile?.phone || profile?.mobile} required />
          </div>
        </section>

        <section className="UserDetails-section-card">
          <h3><FiFileText /> Identity Details</h3>
          <div className="UserDetails-info-grid">
            <InfoItem label="Aadhaar Number" value={profile?.aadhaar || profile?.aadhar || profile?.aadharCard} required />
            <InfoItem label="PAN Number" value={profile?.panCard || profile?.pan} required />
          </div>
        </section>

        <section className="UserDetails-section-card">
          <h3><FiCreditCard /> Bank Details</h3>
          <div className="UserDetails-info-grid">
            <InfoItem label="Account Holder Name" value={profile?.bankHolderName} required />
            <InfoItem label="Account Number" value={maskAccountNumber(profile?.accountNumber)} required />
            <InfoItem label="IFSC Code" value={profile?.ifsc} required />
            <InfoItem label="Bank Name" value={profile?.bankName} required />
          </div>
        </section>

        <section className="UserDetails-section-card UserDetails-section-wide">
          <h3><FiHeart /> Family Details</h3>
          <div className="UserDetails-info-grid three">
            <InfoItem label="Father's Name" value={profile?.fatherName} required />
            <InfoItem label="Mother's Name" value={profile?.motherName} required />
            <InfoItem label="Spouse Name (Optional)" value={profile?.spouseName} />
          </div>
        </section>

        <section className="UserDetails-section-card UserDetails-section-wide UserDetails-documents-card">
          <div className="UserDetails-documents-heading">
            <div>
              <h3><FiFileText /> My Documents</h3>
              <p>Upload the documents required by your company.</p>
            </div>
          </div>

          <div className="UserDetails-document-form">
            <label>
              Document Name *
              <input
                type="text"
                value={documentName}
                onChange={(event) => setDocumentName(event.target.value)}
                placeholder="e.g. Aadhaar Card, PAN Card"
                required
              />
            </label>
            <input
              ref={documentInputRef}
              className="UserDetails-hidden-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.jfif,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.odt,.ods"
              onChange={handleDocumentSelected}
              tabIndex={-1}
            />
            <button className="UserDetails-primary-btn" type="button" onClick={handleDocumentButtonClick} disabled={uploadingDocument}>
              <FiUpload /> {uploadingDocument ? "Uploading..." : "Upload Document"}
            </button>
          </div>
          <p className="UserDetails-document-hint">Enter a document name, then click Upload Document to choose and upload the file.</p>
          <p className="UserDetails-document-hint">Allowed: PDF, images, Word, Excel and text documents · Maximum 25 MB</p>

          <div className="UserDetails-document-list">
            {documentsLoading ? (
              <p className="UserDetails-empty-note">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="UserDetails-empty-note">No documents uploaded yet.</p>
            ) : documents.map((item) => (
              <div className="UserDetails-document-row" key={item._id}>
                <div className="UserDetails-document-icon"><FiFileText /></div>
                <div className="UserDetails-document-info">
                  <strong>{item.name}</strong>
                  <span>{item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : "Uploaded document"}</span>
                </div>
                <div className="UserDetails-document-actions">
                  <button type="button" onClick={() => openDocument(item)}><FiEye /> View</button>
                  <button type="button" onClick={() => openDocument(item, true)}><FiDownload /> Download</button>
                  <button type="button" className="danger" onClick={() => deleteDocument(item._id)}><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {editOpen && (
        <div className="UserDetails-modal-overlay" onClick={closeEdit}>
          <form className="UserDetails-modal" onSubmit={handleSave} onClick={(event) => event.stopPropagation()}>
            <div className="UserDetails-modal-header">
              <div>
                <h2>Edit Your Details</h2>
                <p>Only your personal, bank, and family details can be changed here.</p>
              </div>
              <button type="button" className="UserDetails-icon-btn" onClick={closeEdit} disabled={saving}>
                <FiX />
              </button>
            </div>

            <div className="UserDetails-modal-content">
              <section className="UserDetails-form-section">
                <h3><FiUser /> Basic Details</h3>
                <div className="UserDetails-form-grid">
                  <label>
                    Full Name *
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(event) => handleChange("name", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Mobile Number *
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(event) => handleChange("phone", event.target.value)}
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="UserDetails-form-section">
                <h3><FiFileText /> Identity Details</h3>
                <div className="UserDetails-form-grid">
                  <label>
                    Aadhaar Number *
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      pattern="[0-9]{12}"
                      placeholder="12-digit Aadhaar number"
                      value={formData.aadhaar}
                      onChange={(event) => handleChange("aadhaar", event.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </label>
                  <label>
                    PAN Number *
                    <input
                      type="text"
                      maxLength={10}
                      pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}"
                      placeholder="ABCDE1234F"
                      value={formData.panCard}
                      onChange={(event) => handleChange("panCard", event.target.value.toUpperCase())}
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="UserDetails-form-section">
                <h3><FiCreditCard /> Bank Details</h3>
                <div className="UserDetails-form-grid">
                  <label>
                    Account Holder Name *
                    <input
                      type="text"
                      value={formData.bankHolderName}
                      onChange={(event) => handleChange("bankHolderName", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Account Number *
                    <input
                      type="text"
                      inputMode="numeric"
                      minLength={9}
                      maxLength={18}
                      pattern="[0-9]{9,18}"
                      placeholder="9 to 18-digit account number"
                      value={formData.accountNumber}
                      onChange={(event) => handleChange("accountNumber", event.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </label>
                  <label>
                    Confirm Account Number *
                    <input
                      type="text"
                      inputMode="numeric"
                      minLength={9}
                      maxLength={18}
                      pattern="[0-9]{9,18}"
                      placeholder="Re-enter account number"
                      value={formData.confirmAccountNumber}
                      onChange={(event) => handleChange("confirmAccountNumber", event.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </label>
                  <label>
                    IFSC Code *
                    <input
                      type="text"
                      maxLength={11}
                      pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}"
                      placeholder="SBIN0001234"
                      value={formData.ifsc}
                      onChange={(event) => handleChange("ifsc", event.target.value.toUpperCase())}
                      required
                    />
                  </label>
                  <label>
                    Bank Name *
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(event) => handleChange("bankName", event.target.value)}
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="UserDetails-form-section">
                <h3><FiHeart /> Family Details</h3>
                <div className="UserDetails-form-grid">
                  <label>
                    Father's Name *
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(event) => handleChange("fatherName", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Mother's Name *
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(event) => handleChange("motherName", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Spouse Name (Optional)
                    <input
                      type="text"
                      value={formData.spouseName}
                      onChange={(event) => handleChange("spouseName", event.target.value)}
                    />
                  </label>
                </div>

              </section>
            </div>

            <div className="UserDetails-modal-footer">
              <button type="button" className="UserDetails-secondary-btn" onClick={closeEdit} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="UserDetails-primary-btn" disabled={saving}>
                <FiSave /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordOpen && (
        <div className="UserDetails-modal-overlay" onClick={closePasswordModal}>
          <form
            className="UserDetails-modal UserDetails-password-modal"
            onSubmit={handleChangePassword}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="UserDetails-modal-header">
              <div>
                <h2>Change Password</h2>
                <p>Enter your current password and choose a new secure password.</p>
              </div>
              <button type="button" className="UserDetails-icon-btn" onClick={closePasswordModal} disabled={passwordSaving}>
                <FiX />
              </button>
            </div>

            <div className="UserDetails-modal-content">
              <section className="UserDetails-form-section">
                <h3><FiLock /> Password Details</h3>
                <div className="UserDetails-form-grid UserDetails-password-grid">
                  <label>
                    Current Password *
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(event) => handlePasswordChange("currentPassword", event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <label>
                    New Password *
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(event) => handlePasswordChange("newPassword", event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <label>
                    Confirm New Password *
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                </div>
              </section>
            </div>

            <div className="UserDetails-modal-footer">
              <button type="button" className="UserDetails-secondary-btn" onClick={closePasswordModal} disabled={passwordSaving}>
                Cancel
              </button>
              <button type="submit" className="UserDetails-primary-btn" disabled={passwordSaving}>
                <FiSave /> {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {documentPreview && (
        <div className="UserDetails-document-preview-overlay" onClick={closeDocumentPreview} role="presentation">
          <div className="UserDetails-document-preview-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={documentPreview.name}>
            <div className="UserDetails-document-preview-header">
              <div>
                <h2>{documentPreview.name}</h2>
                <p>Document preview</p>
              </div>
              <button type="button" className="UserDetails-icon-btn" onClick={closeDocumentPreview} aria-label="Close preview">
                <FiX />
              </button>
            </div>
            <div className="UserDetails-document-preview-content">
              {documentPreview.type.startsWith("image/") ? (
                <img src={documentPreview.url} alt={documentPreview.name} />
              ) : documentPreview.type === "application/pdf" ? (
                <iframe src={documentPreview.url} title={documentPreview.name} />
              ) : (
                <div className="UserDetails-document-preview-unsupported">
                  <FiFileText />
                  <strong>Preview is not available for this file type.</strong>
                  <span>Please use the Download button to open this document.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
