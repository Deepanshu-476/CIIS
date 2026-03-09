// page/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config";
import "./UserProfile.css";
import CIISLoader from '../Loader/CIISLoader';

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // State for fetched names
  const [departmentName, setDepartmentName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get user data from localStorage
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      
      if (!userStr || !token) {
        toast.error("Please login first");
        navigate("/");
        return null;
      }

      const user = JSON.parse(userStr);
      return user;
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Session expired. Please login again.");
      localStorage.clear();
      navigate("/");
      return null;
    }
  };

  // Fetch department name by ID
  const fetchDepartmentName = async (departmentId) => {
    if (!departmentId) return;
    
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/department/${departmentId}`, { headers });
      
      if (response.data) {
        setDepartmentName(response.data.name || response.data.departmentName || 'Unknown Department');
      }
    } catch (error) {
      console.error("Error fetching department:", error);
      setDepartmentName('Department not found');
    }
  };

  // Fetch company name by ID
  const fetchCompanyName = async (companyId) => {
    if (!companyId) return;
    
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/company/${companyId}`, { headers });
      
      if (response.data) {
        const company = response.data.company || response.data;
        setCompanyName(company.companyName || 'Unknown Company');
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      setCompanyName('Company not found');
    }
  };

  // Fetch complete user profile from API
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const user = getUserFromStorage();
      if (!user) return;

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Get user details from API using user ID
      const response = await axios.get(
        `${API_URL}/user/${user._id || user.id}`,
        { headers }
      );

      if (response.data) {
        const userProfile = response.data.user || response.data;
        setUserData(userProfile);
        
        // Set edited data with only personal fields
        setEditedData({
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          dateOfBirth: userProfile.dateOfBirth,
          gender: userProfile.gender,
          address: userProfile.address,
          bio: userProfile.bio,
          emergencyContact: userProfile.emergencyContact,
          emergencyPhone: userProfile.emergencyPhone
        });
        
        // Update localStorage with latest data
        localStorage.setItem("user", JSON.stringify(userProfile));
        
        // Fetch department name if department ID exists
        if (userProfile.department) {
          fetchDepartmentName(userProfile.department);
        }
        
        // Fetch company name if company ID exists
        if (userProfile.company) {
          fetchCompanyName(userProfile.company);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again!");
        localStorage.clear();
        navigate("/");
      } else {
        // If API fails, use localStorage data
        const user = getUserFromStorage();
        if (user) {
          setUserData(user);
          setEditedData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address: user.address,
            bio: user.bio,
            emergencyContact: user.emergencyContact,
            emergencyPhone: user.emergencyPhone
          });
        }
      }
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // Update user profile (only personal information)
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Only send personal information fields
      const updateData = {
        name: editedData.name,
        email: editedData.email,
        phone: editedData.phone,
        dateOfBirth: editedData.dateOfBirth,
        gender: editedData.gender,
        address: editedData.address,
        bio: editedData.bio,
        emergencyContact: editedData.emergencyContact,
        emergencyPhone: editedData.emergencyPhone
      };

      const response = await axios.put(
        `${API_URL}/user/${userData._id}`,
        updateData,
        { headers }
      );

      if (response.data) {
        const updatedUser = response.data.user || response.data;
        setUserData(updatedUser);
        
        toast.success("Profile updated successfully!");
        setEditMode(false);
        
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit field change (only personal fields)
  const handleEditChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      address: userData.address,
      bio: userData.bio,
      emergencyContact: userData.emergencyContact,
      emergencyPhone: userData.emergencyPhone
    });
    setEditMode(false);
  };

  // Load user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData?.name) return "U";
    const nameParts = userData.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return userData.name[0].toUpperCase();
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '#2563eb';
      case 'manager': return '#7e22ce';
      case 'supervisor': return '#0891b2';
      case 'employee': return '#0a5e0a';
      default: return '#64748b';
    }
  };

  // Show loader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="UserProfile-container">
      {/* Animated Background */}
      <div className="UserProfile-animated-bg">
        <div className="UserProfile-bg-circle UserProfile-circle-1"></div>
        <div className="UserProfile-bg-circle UserProfile-circle-2"></div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className="UserProfile-mobile-header">
          <button className="UserProfile-back-btn" onClick={() => navigate(-1)}>
            <span className="material-icons">arrow_back</span>
          </button>
          <h1 className="UserProfile-mobile-title">My Profile</h1>
          {!editMode ? (
            <button className="UserProfile-edit-btn" onClick={() => setEditMode(true)}>
              <span className="material-icons">edit</span>
            </button>
          ) : (
            <button className="UserProfile-save-btn" onClick={handleUpdateProfile} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      )}

      <div className="UserProfile-content">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="UserProfile-desktop-header">
            <div className="UserProfile-header-left">
              <button className="UserProfile-back-btn-desktop" onClick={() => navigate(-1)}>
                <span className="material-icons">arrow_back</span>
                Back
              </button>
              <h1 className="UserProfile-desktop-title">My Profile</h1>
            </div>
            <div className="UserProfile-header-actions">
              {!editMode ? (
                <button className="UserProfile-btn-primary" onClick={() => setEditMode(true)}>
                  <span className="material-icons UserProfile-btn-icon">edit</span>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="UserProfile-btn-outline" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="UserProfile-btn-primary" onClick={handleUpdateProfile} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="UserProfile-main-card">
          {/* Profile Header */}
          <div className="UserProfile-profile-header">
            <div className="UserProfile-avatar-section">
              <div className="UserProfile-avatar-wrapper">
                {userData?.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt={userData.name} 
                    className="UserProfile-avatar"
                  />
                ) : (
                  <div 
                    className="UserProfile-avatar UserProfile-avatar-text"
                    style={{ background: `linear-gradient(135deg, ${getRoleColor(userData?.role)} 0%, ${getRoleColor(userData?.role)}80 100%)` }}
                  >
                    {getUserInitials()}
                  </div>
                )}
                <span className={`UserProfile-status-badge ${userData?.isActive ? 'active' : 'inactive'}`}>
                  <span className="material-icons">
                    {userData?.isActive ? 'check_circle' : 'cancel'}
                  </span>
                </span>
              </div>

              <div className="UserProfile-profile-info">
                <h2 className="UserProfile-user-name">{userData?.name || 'User'}</h2>
                <div className="UserProfile-user-badges">
                  <span 
                    className="UserProfile-role-badge"
                    style={{ backgroundColor: `${getRoleColor(userData?.role)}20`, color: getRoleColor(userData?.role) }}
                  >
                    {userData?.role || 'Employee'}
                  </span>
                  {userData?.employeeId && (
                    <span className="UserProfile-id-badge">
                      <span className="material-icons UserProfile-id-icon">badge</span>
                      ID: {userData.employeeId}
                    </span>
                  )}
                </div>
                <div className="UserProfile-user-email">
                  <span className="material-icons UserProfile-email-icon">email</span>
                  {userData?.email}
                </div>
              </div>
            </div>

            {/* Quick Stats - Now showing fetched names */}
            <div className="UserProfile-quick-stats">
              <div className="UserProfile-stat-item">
                <span className="UserProfile-stat-label">Department</span>
                <span className="UserProfile-stat-value">{departmentName || 'Not assigned'}</span>
              </div>
              <div className="UserProfile-stat-divider"></div>
              <div className="UserProfile-stat-item">
                <span className="UserProfile-stat-label">Company</span>
                <span className="UserProfile-stat-value">{companyName || 'Not assigned'}</span>
              </div>
              <div className="UserProfile-stat-divider"></div>
              <div className="UserProfile-stat-item">
                <span className="UserProfile-stat-label">Member Since</span>
                <span className="UserProfile-stat-value">{formatDate(userData?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid - Only Personal Information editable */}
          <div className="UserProfile-details-grid">
            {/* Personal Information - EDITABLE */}
            <div className="UserProfile-details-section">
              <h3 className="UserProfile-section-title">
                <span className="material-icons UserProfile-section-icon">person</span>
                Personal Information
              </h3>
              <div className="UserProfile-details-card">
                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Full Name</div>
                  {editMode ? (
                    <input
                      type="text"
                      className="UserProfile-detail-input"
                      value={editedData?.name || ''}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{userData?.name || 'Not specified'}</div>
                  )}
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Email Address</div>
                  {editMode ? (
                    <input
                      type="email"
                      className="UserProfile-detail-input"
                      value={editedData?.email || ''}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{userData?.email || 'Not specified'}</div>
                  )}
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Phone Number</div>
                  {editMode ? (
                    <input
                      type="tel"
                      className="UserProfile-detail-input"
                      value={editedData?.phone || ''}
                      onChange={(e) => handleEditChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{userData?.phone || 'Not specified'}</div>
                  )}
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Date of Birth</div>
                  {editMode ? (
                    <input
                      type="date"
                      className="UserProfile-detail-input"
                      value={editedData?.dateOfBirth?.split('T')[0] || ''}
                      onChange={(e) => handleEditChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{formatDate(userData?.dateOfBirth)}</div>
                  )}
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Gender</div>
                  {editMode ? (
                    <select
                      className="UserProfile-detail-select"
                      value={editedData?.gender || ''}
                      onChange={(e) => handleEditChange('gender', e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  ) : (
                    <div className="UserProfile-detail-value">
                      {userData?.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not specified'}
                    </div>
                  )}
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Address</div>
                  {editMode ? (
                    <textarea
                      className="UserProfile-detail-textarea"
                      value={editedData?.address || ''}
                      onChange={(e) => handleEditChange('address', e.target.value)}
                      placeholder="Enter your full address"
                      rows="2"
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{userData?.address || 'No address provided'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact - EDITABLE */}
            <div className="UserProfile-details-section">
              <h3 className="UserProfile-section-title">
                <span className="material-icons UserProfile-section-icon">emergency</span>
                Emergency Contact
              </h3>
              <div className="UserProfile-details-card">
                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Contact Name</div>
                  {editMode ? (
                    <input
                      type="text"
                      className="UserProfile-detail-input"
                      value={editedData?.emergencyContact || ''}
                      onChange={(e) => handleEditChange('emergencyContact', e.target.value)}
                      placeholder="Emergency contact name"
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{userData?.emergencyContact || 'Not specified'}</div>
                  )}
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Contact Phone</div>
                  {editMode ? (
                    <input
                      type="tel"
                      className="UserProfile-detail-input"
                      value={editedData?.emergencyPhone || ''}
                      onChange={(e) => handleEditChange('emergencyPhone', e.target.value)}
                      placeholder="Emergency contact phone"
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{userData?.emergencyPhone || 'Not specified'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio - EDITABLE */}
            <div className="UserProfile-details-section UserProfile-full-width">
              <h3 className="UserProfile-section-title">
                <span className="material-icons UserProfile-section-icon">description</span>
                Bio
              </h3>
              <div className="UserProfile-details-card">
                <div className="UserProfile-detail-row">
                  {editMode ? (
                    <textarea
                      className="UserProfile-detail-textarea"
                      value={editedData?.bio || ''}
                      onChange={(e) => handleEditChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows="3"
                    />
                  ) : (
                    <div className="UserProfile-detail-value">{userData?.bio || 'No bio provided'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Work Information - READ ONLY with fetched names */}
            <div className="UserProfile-details-section">
              <h3 className="UserProfile-section-title">
                <span className="material-icons UserProfile-section-icon">work</span>
                Work Information
              </h3>
              <div className="UserProfile-details-card">
                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Employee ID</div>
                  <div className="UserProfile-detail-value">{userData?.employeeId || 'Not assigned'}</div>
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Role</div>
                  <div className="UserProfile-detail-value" style={{ color: getRoleColor(userData?.role) }}>
                    {userData?.role || 'Not specified'}
                  </div>
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Department</div>
                  <div className="UserProfile-detail-value">{departmentName || 'Not assigned'}</div>
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Company</div>
                  <div className="UserProfile-detail-value">{companyName || 'Not assigned'}</div>
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Position</div>
                  <div className="UserProfile-detail-value">{userData?.position || 'Not specified'}</div>
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Join Date</div>
                  <div className="UserProfile-detail-value">{formatDate(userData?.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Account Information - READ ONLY */}
            <div className="UserProfile-details-section">
              <h3 className="UserProfile-section-title">
                <span className="material-icons UserProfile-section-icon">security</span>
                Account Information
              </h3>
              <div className="UserProfile-details-card">
                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Account Status</div>
                  <div className="UserProfile-detail-value">
                    <span className={`UserProfile-status-text ${userData?.isActive ? 'active' : 'inactive'}`}>
                      {userData?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Last Login</div>
                  <div className="UserProfile-detail-value">{formatDate(userData?.lastLogin)}</div>
                </div>

                <div className="UserProfile-detail-row">
                  <div className="UserProfile-detail-label">Last Updated</div>
                  <div className="UserProfile-detail-value">{formatDate(userData?.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="UserProfile-loading-overlay">
          <div className="UserProfile-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;