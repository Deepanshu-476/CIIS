import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiLock,
  FiInfo,
  FiCheckCircle,
  FiList,
  FiShield
} from 'react-icons/fi';
import './CrmAddUser.css';

export default function CrmAddUser() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: 'admin@haps.com',
    userType: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.firstName.trim()) {
      setErrorMessage('First Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Email Address is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Phone Number is required.');
      return;
    }
    if (!formData.username.trim()) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!formData.userType) {
      setErrorMessage('Please select a User Type.');
      return;
    }
    if (!formData.password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Success simulation
    setSuccessMessage(`User "${formData.firstName} ${formData.lastName}" created successfully!`);
    setTimeout(() => {
      navigate('/ciisUser/crm/admin/users');
    }, 1200);
  };

  return (
    <div className="cau-root">
      {/* Header & Breadcrumb */}
      <div className="cau-page-header">
        <h1 className="cau-page-title">Add User</h1>
        <div className="cau-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <span className="separator">&gt;</span>
          <Link to="/ciisUser/crm/admin/team">Team</Link>
          <span className="separator">&gt;</span>
          <Link to="/ciisUser/crm/admin/users">Users</Link>
          <span className="separator">&gt;</span>
          <span className="active">Add User</span>
        </div>
      </div>

      {/* Main Card Wrapper */}
      <div className="cau-card">
        {/* Card Header Top */}
        <div className="cau-card-header">
          <h2 className="cau-card-title">Create New User</h2>
          <button
            className="cau-btn-listings"
            onClick={() => navigate('/ciisUser/crm/admin/users')}
          >
            <FiList className="btn-icon" /> View Listings
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="cau-card-body">
          {/* Left Form Section */}
          <div className="cau-form-wrapper">
            {errorMessage && (
              <div className="cau-alert cau-alert-danger">{errorMessage}</div>
            )}
            {successMessage && (
              <div className="cau-alert cau-alert-success">{successMessage}</div>
            )}

            <form onSubmit={handleSubmit}>
              {/* 1. Personal Details */}
              <div className="cau-section">
                <div className="cau-section-header">
                  <FiUser className="section-icon" />
                  <span>Personal Details</span>
                </div>
                <div className="cau-grid-2">
                  <div className="cau-field-group">
                    <label>First Name <span className="req">*</span></label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="cau-field-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="cau-field-group">
                    <label>Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="cau-field-group">
                    <label>Phone Number <span className="req">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Account Details */}
              <div className="cau-section">
                <div className="cau-section-header">
                  <FiLock className="section-icon" />
                  <span>Account Details</span>
                </div>
                <div className="cau-grid-2">
                  <div className="cau-field-group">
                    <label>Username <span className="req">*</span></label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="cau-field-group">
                    <label>User Type <span className="req">*</span></label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select User Type</option>
                      <option value="Admin">Admin</option>
                      <option value="Marketing Exec">Marketing Exec</option>
                      <option value="Telecaller">Telecaller</option>
                    </select>
                  </div>
                  <div className="cau-field-group">
                    <label>Password <span className="req">*</span></label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="cau-field-group">
                    <label>Confirm Password <span className="req">*</span></label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 3. Status Section */}
              <div className="cau-section">
                <div className="cau-section-header">
                  <FiShield className="section-icon" />
                  <span>Status</span>
                </div>
                <div className="cau-field-group" style={{ maxWidth: '300px' }}>
                  <label>Account Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="cau-form-actions">
                <button type="submit" className="cau-btn-submit">
                  Create User
                </button>
                <button
                  type="button"
                  className="cau-btn-cancel"
                  onClick={() => navigate('/ciisUser/crm/admin/users')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Right Quick Tips Panel */}
          <div className="cau-tips-panel">
            <div className="cau-tips-card">
              <div className="cau-tips-header">
                <FiInfo className="tips-icon" />
                <span>Quick Tips</span>
              </div>
              <ul className="cau-tips-list">
                <li>
                  <FiCheckCircle className="check-icon" />
                  <span>Use a valid email address for creating users.</span>
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  <span>Assign appropriate user type based on responsibilities.</span>
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  <span>Set strong password (min 8 chars, mix of letters & numbers).</span>
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  <span>Users can be deactivated anytime from the users list.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
