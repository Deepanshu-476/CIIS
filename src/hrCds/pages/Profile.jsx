import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import "./Profile.css";
import {
  FiBriefcase,
  FiActivity,
  FiAlertTriangle,
  FiCalendar,
  FiCreditCard,
  FiDownload,
  FiEdit,
  FiEye,
  FiFileText,
  FiHeart,
  FiLock,
  FiMail,
  FiMoreVertical,
  FiPhone,
  FiSave,
  FiShield,
  FiTrash2,
  FiUpload,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getUserId = (user) => user?._id || user?.id || null;

const buildInitialForm = (user = {}) => ({
  name: user.name || "",
  phone: user.phone || user.mobile || "",
  dob: user.dob || "",
  gender: user.gender || "",
  maritalStatus: user.maritalStatus || "",
  emergencyName: user.emergencyName || "",
  emergencyPhone: user.emergencyPhone || "",
  emergencyRelation: user.emergencyRelation || "",
  emergencyAddress: user.emergencyAddress || "",
  address: user.address || "",
  city: user.city || "",
  state: user.state || "",
  pinCode: user.pinCode || user.zipCode || "",
  country: user.country || "",
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
  employeeType: user.employeeType || user.employmentType || "",
  workLocation: user.workLocation || user.location || user.officeLocation || "",
  salary: user.salary || "",
  status: user.status || "",
  noticePeriod: user.noticePeriod || user.notice_period || "",
  shift: user.shift || user.shiftName || "",
  designation: getReferenceName(user.designation || user.jobTitle || user.jobRole || user.role),
  department: getReferenceName(user.department || user.departmentName),
  joiningDate: user.joiningDate || user.dateOfJoining || "",
  reportingManager: typeof user.reportingManager === "object" ? user.reportingManager?.name || "" : user.reportingManager || user.managerName || "",
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
    <span>{label}</span>
    <strong>
      {required && !value && <FiAlertTriangle className="UserDetails-missing-icon" aria-hidden="true" />}
      {required && !value ? "Not added" : displayValue(value)}
    </strong>
  </div>
);

const getProfileValue = (user, ...keys) => keys.map((key) => user?.[key]).find(Boolean);
const getReferenceName = (value) => {
  if (!value) return "";
  if (typeof value === "object") return value.name || value.roleName || value.departmentName || value.title || "";
  return String(value);
};
const isMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));
const getList = (payload, keys) => {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.message?.[key])) return payload.message[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.message)) return payload.message;
  return [];
};

const Profile = () => {
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);
  const userId = getUserId(storedUser);
  const [profile, setProfile] = useState(storedUser);
  const [formData, setFormData] = useState(buildInitialForm(storedUser));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSection, setEditSection] = useState("all");
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
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const documentInputRef = useRef(null);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [referenceNames, setReferenceNames] = useState({});
  const documentsSectionRef = useRef(null);

  useEffect(() => {
    let active = true;
    const companyValue = storedUser?.company;
    const companyId = typeof companyValue === "object" ? companyValue?._id || companyValue?.id : companyValue;
    const companyCode = storedUser?.companyCode || (typeof companyValue === "object" ? companyValue?.companyCode : "");

    const loadReferenceNames = async () => {
      const requests = [
        axios.get("/job-roles", { params: { company: companyId || undefined, companyCode: companyCode || undefined } }),
        axios.get("/departments"),
        axios.get("/users/company-users", { params: { companyId: companyId || undefined, includeInactive: true } }),
      ];
      const [rolesResult, departmentsResult, usersResult] = await Promise.allSettled(requests);
      if (!active) return;

      const nextNames = {};
      const addItems = (items, nameKeys) => items.forEach((item) => {
        const id = item?._id || item?.id;
        const name = nameKeys.map((key) => item?.[key]).find(Boolean);
        if (id && name) nextNames[String(id)] = String(name);
      });

      if (rolesResult.status === "fulfilled") {
        addItems(getList(rolesResult.value.data, ["jobRoles", "roles"]), ["roleName", "name"]);
      }
      if (departmentsResult.status === "fulfilled") {
        addItems(getList(departmentsResult.value.data, ["departments"]), ["departmentName", "name"]);
      }
      if (usersResult.status === "fulfilled") {
        addItems(getList(usersResult.value.data, ["users"]), ["name"]);
      }
      setReferenceNames(nextNames);
    };

    loadReferenceNames();
    return () => { active = false; };
  }, [storedUser]);

  const resolveReferenceName = useCallback((value) => {
    const directName = getReferenceName(value);
    if (!directName) return "";
    if (!isMongoId(directName)) return directName;
    return referenceNames[directName] || "Not assigned";
  }, [referenceNames]);

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
    setUploadProgress(0);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("name", documentName.trim());
      const response = await axios.post(`/users/${userId}/documents`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
      });
      setDocuments((current) => [...current, response.data.document]);
      setDocumentName("");
      setDocumentUploadOpen(false);
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
      setUploadProgress(0);
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

  const openEdit = (section = "all") => {
    setFormData(buildInitialForm(profile));
    setEditSection(section);
    setEditOpen(true);
    setMessage(null);
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    if (tab === "documents") {
      requestAnimationFrame(() => documentsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    const destinations = { attendance: "/ciisUser/attendance", leave: "/ciisUser/my-leaves", payroll: "/ciisUser/profile", activity: "/ciisUser/profile" };
    if (destinations[tab] && tab !== "payroll" && tab !== "activity") navigate(destinations[tab]);
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

    const requiredFieldsBySection = {
      personal: [["name", "Full Name"], ["phone", "Mobile Number"]],
      identity: [["aadhaar", "Aadhaar Number"], ["panCard", "PAN Number"]],
      bank: [["bankHolderName", "Account Holder Name"], ["accountNumber", "Account Number"], ["ifsc", "IFSC Code"], ["bankName", "Bank Name"]],
      family: [["fatherName", "Father's Name"], ["motherName", "Mother's Name"]],
      employment: [],
    };
    const requiredFields = editSection === "all"
      ? Object.values(requiredFieldsBySection).flat()
      : requiredFieldsBySection[editSection] || [];
    const missingFields = requiredFields
      .filter(([field]) => !String(formData[field] || "").trim())
      .map(([, label]) => label);

    if (missingFields.length) {
      setMessage({ type: "error", text: `Please fill all required fields: ${missingFields.join(", ")}.` });
      return;
    }

    if ((editSection === "all" || editSection === "identity") && !/^\d{12}$/.test(formData.aadhaar.trim())) {
      setMessage({ type: "error", text: "Aadhaar Number must contain exactly 12 digits." });
      return;
    }

    const normalizedPan = formData.panCard.trim().toUpperCase();
    if ((editSection === "all" || editSection === "identity") && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizedPan)) {
      setMessage({ type: "error", text: "Please enter a valid PAN Number (for example: ABCDE1234F)." });
      return;
    }

    const normalizedAccountNumber = formData.accountNumber.trim();
    if ((editSection === "all" || editSection === "bank") && !/^\d{9,18}$/.test(normalizedAccountNumber)) {
      setMessage({ type: "error", text: "Account Number must contain 9 to 18 digits." });
      return;
    }

    if ((editSection === "all" || editSection === "bank") && normalizedAccountNumber !== formData.confirmAccountNumber.trim()) {
      setMessage({ type: "error", text: "Account Number and Confirm Account Number do not match." });
      return;
    }

    const normalizedIfsc = formData.ifsc.trim().toUpperCase();
    if ((editSection === "all" || editSection === "bank") && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      setMessage({ type: "error", text: "Please enter a valid IFSC Code (for example: SBIN0001234)." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const allUpdateData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      dob: formData.dob || undefined,
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      emergencyName: formData.emergencyName.trim(),
      emergencyPhone: formData.emergencyPhone.trim(),
      emergencyRelation: formData.emergencyRelation.trim(),
      emergencyAddress: formData.emergencyAddress.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pinCode: formData.pinCode.trim(),
      country: formData.country.trim(),
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
    const sectionFields = {
      personal: ["name", "phone", "dob", "gender", "address", "city", "state", "pinCode", "country"],
      identity: ["aadhaar", "panCard"],
      bank: ["bankHolderName", "accountNumber", "confirmAccountNumber", "ifsc", "bankName"],
      family: ["maritalStatus", "fatherName", "motherName", "spouseName", "emergencyName", "emergencyPhone", "emergencyRelation", "emergencyAddress"],
    };
    const updateData = editSection === "all"
      ? allUpdateData
      : Object.fromEntries((sectionFields[editSection] || []).map((field) => [field, allUpdateData[field]]));

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
      window.dispatchEvent(new CustomEvent("ciis-profile-updated", { detail: mergedUser }));
      setEditOpen(false);
      setEditSection("all");
      setMessage({ type: "success", text: "Your details have been updated successfully." });
    } catch (error) {
      console.error("Profile update failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to update your details.",
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

  const requiredProfileFields = [
    profile?.name,
    profile?.phone || profile?.mobile,
    profile?.aadhaar || profile?.aadhar || profile?.aadharCard,
    profile?.panCard || profile?.pan,
    profile?.bankHolderName,
    profile?.accountNumber,
    profile?.ifsc,
    profile?.bankName,
    profile?.fatherName,
    profile?.motherName,
  ];
  const completion = Math.round((requiredProfileFields.filter(Boolean).length / requiredProfileFields.length) * 100);
  const role = resolveReferenceName(getProfileValue(profile, "designation", "jobTitle", "jobRole", "role"));
  const department = resolveReferenceName(getProfileValue(profile, "department", "departmentName"));
  const employeeId = getProfileValue(profile, "employeeId", "empId", "employeeCode");
  const joiningDate = getProfileValue(profile, "joiningDate", "dateOfJoining");
  const manager = resolveReferenceName(getProfileValue(profile, "reportingManager", "managerName", "manager"));
  const location = getProfileValue(profile, "workLocation", "location", "officeLocation");

  return (
    <div className="UserDetails-page">
      <div className="UserDetails-header">
        <div>
          <span className="UserDetails-eyebrow"><span>Employees</span> / Employee Profile</span>
          <h1>Employee Profile</h1>
          <p>Manage employee information, verification and documents.</p>
        </div>
        <div className="UserDetails-header-actions">
          <button className="UserDetails-primary-btn" onClick={() => openEdit("all")}>
            <FiEdit /> Edit Profile
          </button>
          <button className="UserDetails-secondary-btn UserDetails-password-btn" onClick={openPasswordModal}>
            <FiLock /> Change Password
          </button>
          <div className="UserDetails-more-actions">
            <button type="button" className="UserDetails-more-button" aria-label="More profile actions" aria-expanded={moreActionsOpen} onClick={() => setMoreActionsOpen((open) => !open)}><FiMoreVertical /></button>
            {moreActionsOpen && (
              <div className="UserDetails-more-menu">
                <button type="button" onClick={() => { setMoreActionsOpen(false); loadProfile(); }}>Refresh profile</button>
                <button type="button" onClick={() => { setMoreActionsOpen(false); selectTab("documents"); }}>View documents</button>
              </div>
            )}
          </div>
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
        <div className="UserDetails-profile-summary">
          <div className="UserDetails-name-row"><h2>{displayValue(profile?.name)}</h2><span className={`UserDetails-status ${String(profile?.status || "active").toLowerCase() === "active" ? "active" : "inactive"}`}>{profile?.status || "Active"}</span></div>
          <p><FiMail /> {displayValue(profile?.email)}</p>
          <p><FiPhone /> {displayValue(profile?.phone || profile?.mobile)}</p>
        </div>
        <div className="UserDetails-employment-summary">
          <div><FiFileText /><span>Employee ID</span><strong>{displayValue(employeeId)}</strong></div>
          <div><FiCalendar /><span>Joining Date</span><strong>{joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not provided"}</strong></div>
          <div><FiBriefcase /><span>Job Role</span><strong>{displayValue(role)}</strong></div>
          <div><FiUsers /><span>Reporting Manager</span><strong>{displayValue(manager)}</strong></div>
        </div>
        <div className="UserDetails-completion">
          <strong>Profile Completion</strong>
          <b>{completion}%</b>
          <div className="UserDetails-progress"><span style={{ width: `${completion}%` }} /></div>
          <p>{completion === 100 ? "Your mandatory details are complete." : "Complete required details for HR verification."}</p>
          {completion < 100 && <button type="button" onClick={() => openEdit("all")}>Complete Profile</button>}
        </div>
      </section>

      <nav className="UserDetails-tabs" aria-label="Employee profile sections">
        {[
          ["overview", <FiUser />, "Overview"],
          ["documents", <FiFileText />, "Documents"],
          ["attendance", <FiCalendar />, "Attendance"],
          ["leave", <FiUsers />, "Leave"],
          ["payroll", <FiCreditCard />, "Payroll"],
          ["activity", <FiActivity />, "Activity"],
        ].map(([id, icon, label]) => (
          <button key={id} type="button" className={activeTab === id ? "active" : ""} onClick={() => selectTab(id)}>{icon}{label}</button>
        ))}
      </nav>

      <div className="UserDetails-grid">
        <section className="UserDetails-section-card UserDetails-section-half">
          <div className="UserDetails-section-heading"><h3><FiUser /> Personal Information</h3><button type="button" onClick={() => openEdit("personal")}><FiEdit /> Edit</button></div>
          <div className="UserDetails-info-columns">
            <div className="UserDetails-info-grid">
              <InfoItem label="Full Name" value={profile?.name} required />
              <InfoItem label="Email Address" value={profile?.email} required />
              <InfoItem label="Date of Birth" value={profile?.dob ? new Date(profile.dob).toLocaleDateString("en-IN") : ""} />
              <InfoItem label="Gender" value={profile?.gender} />
              <InfoItem label="Mobile Number" value={profile?.phone || profile?.mobile} required />
            </div>
            <div className="UserDetails-info-grid">
              <InfoItem label="Address" value={profile?.address} />
              <InfoItem label="City" value={profile?.city} />
              <InfoItem label="State" value={profile?.state} />
              <InfoItem label="Country" value={profile?.country} />
              <InfoItem label="PIN Code" value={profile?.pinCode || profile?.zipCode} />
            </div>
          </div>
        </section>

        <section className="UserDetails-section-card UserDetails-section-half">
          <div className="UserDetails-section-heading"><h3><FiBriefcase /> Employment Information</h3></div>
          <div className="UserDetails-info-columns">
            <div className="UserDetails-info-grid">
              <InfoItem label="Employee Type" value={getProfileValue(profile, "employeeType", "employmentType")} />
              <InfoItem label="Work Location" value={location} />
              <InfoItem label="Salary" value={profile?.salary} />
              <InfoItem label="Employment Status" value={profile?.status} />
              <InfoItem label="Notice Period" value={getProfileValue(profile, "noticePeriod", "notice_period")} />
            </div>
            <div className="UserDetails-info-grid">
              <InfoItem label="Shift" value={getProfileValue(profile, "shift", "shiftName")} />
              <InfoItem label="Designation" value={role} />
              <InfoItem label="Department" value={department} />
              <InfoItem label="Joining Date" value={joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN") : ""} />
              <InfoItem label="Reporting Manager" value={manager} />
            </div>
          </div>
        </section>

        <section ref={documentsSectionRef} className="UserDetails-section-card UserDetails-section-third UserDetails-identity-card">
          <div className="UserDetails-section-heading">
            <h3><FiShield /> Identity & Compliance</h3>
            <div className="UserDetails-section-actions">
              <button type="button" onClick={() => openEdit("identity")}><FiEdit /> Edit</button>
              <button className="UserDetails-identity-upload-btn" type="button" onClick={() => setDocumentUploadOpen((open) => !open)}><FiUpload /> Upload</button>
            </div>
          </div>
          <div className="UserDetails-info-grid UserDetails-identity-fields">
            <InfoItem label="Aadhaar Number" value={maskAccountNumber(profile?.aadhaar || profile?.aadhar || profile?.aadharCard)} required />
            <InfoItem label="PAN Number" value={maskAccountNumber(profile?.panCard || profile?.pan)} required />
          </div>
          {documentUploadOpen && <div className="UserDetails-identity-upload">
            <input type="text" value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Document name" autoFocus />
            <input ref={documentInputRef} className="UserDetails-hidden-file-input" type="file" accept=".pdf,.jpg,.jpeg,.jfif,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.odt,.ods" onChange={handleDocumentSelected} tabIndex={-1} />
            <button className="UserDetails-primary-btn" type="button" onClick={handleDocumentButtonClick} disabled={uploadingDocument}><FiUpload /> {uploadingDocument ? `${uploadProgress}%` : "Choose File"}</button>
          </div>}
          <div className="UserDetails-identity-documents">
            <div className="UserDetails-identity-documents-head">
              <span><FiFileText /> Documents</span>
              <b>{documents.length}</b>
            </div>
            {documentsLoading ? <p className="UserDetails-empty-note">Loading documents...</p> : documents.length === 0 ? (
              <div className="UserDetails-identity-empty">
                <FiFileText />
                <span>No documents uploaded yet.</span>
              </div>
            ) : documents.map((item) => (
              <div className="UserDetails-identity-document" key={item._id}>
                <span><FiFileText /><strong>{item.name}</strong></span>
                <div>
                  <button type="button" title="View" onClick={() => openDocument(item)}><FiEye /></button>
                  <button type="button" title="Download" onClick={() => openDocument(item, true)}><FiDownload /></button>
                  <button type="button" className="danger" title="Remove" onClick={() => deleteDocument(item._id)}><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="UserDetails-section-card UserDetails-section-third">
          <div className="UserDetails-section-heading"><h3><FiCreditCard /> Bank & Payroll</h3><button type="button" onClick={() => openEdit("bank")}><FiEdit /> Edit</button></div>
          <div className="UserDetails-info-grid">
            <InfoItem label="Bank Name" value={profile?.bankName} required />
            <InfoItem label="Account Number" value={maskAccountNumber(profile?.accountNumber)} required />
            <InfoItem label="IFSC Code" value={profile?.ifsc} required />
          </div>
        </section>

        <section className="UserDetails-section-card UserDetails-section-third">
          <div className="UserDetails-section-heading"><h3><FiHeart /> Family & Emergency</h3><button type="button" onClick={() => openEdit("family")}><FiEdit /> Edit</button></div>
          <div className="UserDetails-info-grid three">
            <InfoItem label="Marital Status" value={profile?.maritalStatus} />
            <InfoItem label="Spouse Name" value={profile?.spouseName} required />
            <InfoItem label="Emergency Contact" value={profile?.emergencyPhone} required />
            <InfoItem label="Emergency Address" value={profile?.emergencyAddress} required />
          </div>
        </section>

        {Boolean(documentPreview?.legacy) && <section className="UserDetails-section-card UserDetails-section-wide UserDetails-documents-card">
          <div className="UserDetails-documents-heading">
            <div>
              <h3><FiFileText /> Employee Documents</h3>
            </div>
            <button className="UserDetails-primary-btn" type="button" onClick={() => setDocumentUploadOpen((open) => !open)}>
              <FiUpload /> Upload Document
            </button>
          </div>

          {documentUploadOpen && <div className="UserDetails-document-form">
              <label>
                Document Name *
                <input
                  type="text"
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                  placeholder="e.g. Aadhaar Card, PAN Card"
                  autoFocus
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
                <FiUpload /> {uploadingDocument ? `Uploading ${uploadProgress}%` : "Choose File"}
              </button>
            </div>}
          <p className="UserDetails-document-hint">Supported formats: PDF, images, Word, Excel &nbsp;•&nbsp; Maximum file size: 25 MB</p>

          <div className="UserDetails-document-list">
            <div className="UserDetails-document-table-head"><span>Document</span><span>Category</span><span>Status</span><span>Uploaded On</span><span>Action</span></div>
            {documentsLoading ? (
              <p className="UserDetails-empty-note">Loading documents...</p>
            ) : documents.length === 0 ? (
              <div className="UserDetails-document-empty"><FiFileText /><p>No documents uploaded yet.</p></div>
            ) : documents.map((item) => (
              <div className="UserDetails-document-row" key={item._id}>
                <div className="UserDetails-document-main">
                  <div className="UserDetails-document-icon"><FiFileText /></div>
                  <div className="UserDetails-document-info">
                    <strong>{item.name}</strong>
                  </div>
                </div>
                <span className="UserDetails-document-date">{item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString("en-IN") : "—"}</span>
                <span className="UserDetails-document-meta">{item.category || "—"}</span>
                <span className="UserDetails-document-status">{item.status || "Uploaded"}</span>
                <div className="UserDetails-document-actions">
                  <button type="button" onClick={() => openDocument(item)}><FiEye /> View</button>
                  <button type="button" onClick={() => openDocument(item, true)}><FiDownload /> Download</button>
                  <button type="button" className="danger" onClick={() => deleteDocument(item._id)}><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        </section>}
      </div>

      {editOpen && (
        <div className="UserDetails-modal-overlay" onClick={closeEdit}>
          <form className="UserDetails-modal" onSubmit={handleSave} onClick={(event) => event.stopPropagation()}>
            <div className="UserDetails-modal-header">
              <div>
                <h2>{editSection === "all" ? "Edit Profile" : `Edit ${{ personal: "Personal Information", employment: "Employment Information", identity: "Identity & Compliance", bank: "Bank & Payroll", family: "Family & Emergency" }[editSection]}`}</h2>
                <p>{editSection === "all" ? "Update your profile details." : "Only this section's data will be updated."}</p>
              </div>
              <button type="button" className="UserDetails-icon-btn" onClick={closeEdit} disabled={saving}>
                <FiX />
              </button>
            </div>

            <div className="UserDetails-modal-content">
              {(editSection === "all" || editSection === "personal") && <section className="UserDetails-form-section">
                <h3><FiUser /> Personal Information</h3>
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
              </section>}

              {(editSection === "all" || editSection === "identity" || editSection === "personal") && <section className="UserDetails-form-section">
                <h3>{editSection === "personal" ? <><FiUser /> Additional Personal Information</> : <><FiFileText /> Identity Details</>}</h3>
                <div className="UserDetails-form-grid">
                  {(editSection === "all" || editSection === "identity") && <label>
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
                  </label>}
                  {(editSection === "all" || editSection === "personal") && <>
                  <label>
                    Date of Birth
                    <input type="date" value={formData.dob} onChange={(event) => handleChange("dob", event.target.value)} />
                  </label>
                  <label>
                    Gender
                    <select value={formData.gender} onChange={(event) => handleChange("gender", event.target.value)}>
                      <option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                  </label>
                  <label className="UserDetails-form-full">
                    Address
                    <input type="text" value={formData.address} onChange={(event) => handleChange("address", event.target.value)} placeholder="Enter full address" />
                  </label>
                  <label>
                    City
                    <input type="text" value={formData.city} onChange={(event) => handleChange("city", event.target.value)} placeholder="City" />
                  </label>
                  <label>
                    State
                    <input type="text" value={formData.state} onChange={(event) => handleChange("state", event.target.value)} placeholder="State" />
                  </label>
                  <label>
                    PIN Code
                    <input type="text" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={formData.pinCode} onChange={(event) => handleChange("pinCode", event.target.value.replace(/\D/g, ""))} placeholder="6-digit PIN code" />
                  </label>
                  <label>
                    Country
                    <input type="text" value={formData.country} onChange={(event) => handleChange("country", event.target.value)} placeholder="Country" />
                  </label>
                  </>}
                  {(editSection === "all" || editSection === "identity") && <label>
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
                  </label>}
                </div>
              </section>}

              {(editSection === "all" || editSection === "bank") && <section className="UserDetails-form-section">
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
              </section>}

              {(editSection === "all" || editSection === "family") && <section className="UserDetails-form-section">
                <h3><FiHeart /> Family Details</h3>
                <div className="UserDetails-form-grid">
                  <label>
                    Marital Status
                    <select value={formData.maritalStatus} onChange={(event) => handleChange("maritalStatus", event.target.value)}>
                      <option value="">Select status</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option>
                    </select>
                  </label>
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
                  <label>
                    Emergency Contact Name
                    <input type="text" value={formData.emergencyName} onChange={(event) => handleChange("emergencyName", event.target.value)} />
                  </label>
                  <label>
                    Emergency Contact Number
                    <input type="tel" value={formData.emergencyPhone} onChange={(event) => handleChange("emergencyPhone", event.target.value)} />
                  </label>
                  <label>
                    Relationship
                    <input type="text" value={formData.emergencyRelation} onChange={(event) => handleChange("emergencyRelation", event.target.value)} />
                  </label>
                  <label className="UserDetails-form-full">
                    Emergency Address
                    <input type="text" value={formData.emergencyAddress} onChange={(event) => handleChange("emergencyAddress", event.target.value)} placeholder="Enter emergency contact address" />
                  </label>
                </div>

              </section>}
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
              {(editSection === "all" || editSection === "family") && <section className="UserDetails-form-section">
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
              </section>}
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
