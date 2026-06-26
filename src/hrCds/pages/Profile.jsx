import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import "./Profile.css";
import {
  FiCreditCard,
  FiEdit,
  FiHeart,
  FiPhone,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUser,
  FiUsers,
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
  ifsc: user.ifsc || "",
  bankName: user.bankName || "",
  fatherName: user.fatherName || "",
  motherName: user.motherName || "",
  spouseName: user.spouseName || "",
  children: Array.isArray(user.children) ? user.children : [],
});

const displayValue = (value) => value || "Not provided";

const ChildrenEditor = ({ childrenList, onChange }) => {
  const updateChild = (index, field, value) => {
    const updated = [...childrenList];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addChild = () => {
    onChange([...childrenList, { name: "", age: "", dob: "" }]);
  };

  const removeChild = (index) => {
    onChange(childrenList.filter((_, childIndex) => childIndex !== index));
  };

  return (
    <div className="UserDetails-children-editor">
      <div className="UserDetails-field-head">
        <label>Children</label>
        <button type="button" onClick={addChild}>
          <FiPlus /> Add Child
        </button>
      </div>

      {childrenList.length === 0 && (
        <p className="UserDetails-empty-note">No children added yet.</p>
      )}

      {childrenList.map((child, index) => (
        <div className="UserDetails-child-row" key={index}>
          <input
            type="text"
            placeholder="Name"
            value={child.name || ""}
            onChange={(event) => updateChild(index, "name", event.target.value)}
          />
          <input
            type="number"
            placeholder="Age"
            value={child.age || ""}
            onChange={(event) => updateChild(index, "age", event.target.value)}
          />
          <input
            type="date"
            value={child.dob ? String(child.dob).split("T")[0] : ""}
            onChange={(event) => updateChild(index, "dob", event.target.value)}
          />
          <button type="button" className="UserDetails-icon-btn danger" onClick={() => removeChild(index)}>
            <FiTrash2 />
          </button>
        </div>
      ))}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="UserDetails-info-item">
    <span>{label}</span>
    <strong>{displayValue(value)}</strong>
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
  const [message, setMessage] = useState(null);

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

  const handleSave = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Name is required." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const updateData = {
      name: formData.name.trim(),
      phone: formData.phone,
      bankHolderName: formData.bankHolderName,
      accountNumber: formData.accountNumber,
      ifsc: formData.ifsc,
      bankName: formData.bankName,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      spouseName: formData.spouseName,
      children: formData.children || [],
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
          <p>View and update your name, mobile, bank details, and family details.</p>
        </div>
        <button className="UserDetails-primary-btn" onClick={openEdit}>
          <FiEdit /> Edit Details
        </button>
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
            <InfoItem label="Full Name" value={profile?.name} />
            <InfoItem label="Mobile Number" value={profile?.phone || profile?.mobile} />
          </div>
        </section>

        <section className="UserDetails-section-card">
          <h3><FiCreditCard /> Bank Details</h3>
          <div className="UserDetails-info-grid">
            <InfoItem label="Account Holder Name" value={profile?.bankHolderName} />
            <InfoItem label="Account Number" value={profile?.accountNumber} />
            <InfoItem label="IFSC Code" value={profile?.ifsc} />
            <InfoItem label="Bank Name" value={profile?.bankName} />
          </div>
        </section>

        <section className="UserDetails-section-card UserDetails-section-wide">
          <h3><FiHeart /> Family Details</h3>
          <div className="UserDetails-info-grid three">
            <InfoItem label="Father's Name" value={profile?.fatherName} />
            <InfoItem label="Mother's Name" value={profile?.motherName} />
            <InfoItem label="Spouse Name" value={profile?.spouseName} />
          </div>

          <div className="UserDetails-children-list">
            <h4><FiUsers /> Children</h4>
            {profile?.children?.length ? (
              profile.children.map((child, index) => (
                <div className="UserDetails-child-pill" key={index}>
                  <strong>{displayValue(child.name)}</strong>
                  {child.age && <span>Age: {child.age}</span>}
                  {child.dob && <span>DOB: {String(child.dob).split("T")[0]}</span>}
                </div>
              ))
            ) : (
              <p className="UserDetails-empty-note">No children details added.</p>
            )}
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
                    Mobile Number
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(event) => handleChange("phone", event.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="UserDetails-form-section">
                <h3><FiCreditCard /> Bank Details</h3>
                <div className="UserDetails-form-grid">
                  <label>
                    Account Holder Name
                    <input
                      type="text"
                      value={formData.bankHolderName}
                      onChange={(event) => handleChange("bankHolderName", event.target.value)}
                    />
                  </label>
                  <label>
                    Account Number
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(event) => handleChange("accountNumber", event.target.value)}
                    />
                  </label>
                  <label>
                    IFSC Code
                    <input
                      type="text"
                      value={formData.ifsc}
                      onChange={(event) => handleChange("ifsc", event.target.value)}
                    />
                  </label>
                  <label>
                    Bank Name
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(event) => handleChange("bankName", event.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="UserDetails-form-section">
                <h3><FiHeart /> Family Details</h3>
                <div className="UserDetails-form-grid">
                  <label>
                    Father's Name
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(event) => handleChange("fatherName", event.target.value)}
                    />
                  </label>
                  <label>
                    Mother's Name
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(event) => handleChange("motherName", event.target.value)}
                    />
                  </label>
                  <label>
                    Spouse Name
                    <input
                      type="text"
                      value={formData.spouseName}
                      onChange={(event) => handleChange("spouseName", event.target.value)}
                    />
                  </label>
                </div>

                <ChildrenEditor
                  childrenList={formData.children}
                  onChange={(children) => handleChange("children", children)}
                />
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
    </div>
  );
};

export default Profile;
