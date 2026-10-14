import React, { useState, useEffect } from 'react';
import {
  FiBell,
  FiBriefcase,
  FiMail,
  FiShield,
  FiSmartphone,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiKey
} from 'react-icons/fi';
import CIISLoader from '../../../Loader/CIISLoader';
import axiosInstance from '../../../utils/axiosConfig';
import {
  calculatePaymentSummary,
  formatDate,
  getClientDisplayName,
  getUserDisplayName,
  useClientPortalData
} from '../../utils/clientPortalData';
import './AccountSettingsPage.css';

const AccountSettingsPage = () => {
  const { client, services, projectManagers, user, loading, error, refetch } = useClientPortalData();
  const payment = calculatePaymentSummary(client);
  const manager = projectManagers[0] || {};

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (client || user) {
      setProfileForm({
        name: client?.client || user?.name || '',
        phone: client?.phone || user?.phone || '',
        company: client?.company || client?.companyName || '',
        address: client?.address || user?.address || '',
        city: client?.city || user?.city || '',
        state: client?.state || user?.state || '',
        pincode: client?.pincode || user?.pinCode || '',
        country: client?.country || user?.country || 'India',
      });
    }
  }, [client, user]);

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return (
      <section className="ClientPageBase-root">
        <p>{error || 'No client data found.'}</p>
        <button type="button" onClick={refetch}>Try Again</button>
      </section>
    );
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileMessage({ type: 'error', text: 'Please enter your name.' });
      return;
    }

    setProfileSaving(true);
    setProfileMessage({ type: '', text: '' });

    try {
      // 1. Update user login account (/users/me)
      await axiosInstance.put('/users/me', {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        city: profileForm.city.trim(),
        state: profileForm.state.trim(),
        pinCode: profileForm.pincode.trim(),
        country: profileForm.country.trim(),
      });

      // 2. If client record exists, update client collection (/clientsservice/:id)
      if (client?._id) {
        try {
          await axiosInstance.put(`/clientsservice/${client._id}`, {
            client: profileForm.name.trim(),
            phone: profileForm.phone.trim(),
            company: profileForm.company.trim(),
            address: profileForm.address.trim(),
            city: profileForm.city.trim(),
            state: profileForm.state.trim(),
            pincode: profileForm.pincode.trim(),
            country: profileForm.country.trim(),
          });
        } catch (clientErr) {
          console.warn('Clients service update notice:', clientErr.message);
        }
      }

      // 3. Update localStorage sessions
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (client) {
        const storedClient = JSON.parse(localStorage.getItem('client') || '{}');
        const updatedClient = {
          ...storedClient,
          client: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          company: profileForm.company.trim(),
        };
        localStorage.setItem('client', JSON.stringify(updatedClient));
      }

      window.dispatchEvent(new CustomEvent('ciis-profile-updated', { detail: updatedUser }));
      setProfileMessage({ type: 'success', text: 'Your profile details have been updated successfully!' });
      refetch?.();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error || 'Failed to update details. Please try again.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await axiosInstance.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'Password update failed');
      }

      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to change password.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const cards = [
    {
      icon: <FiUser />,
      label: 'Profile',
      title: getClientDisplayName(client),
      text: `${client.email || user?.email || 'No email'}${client.phone ? ` • ${client.phone}` : ''}`
    },
    {
      icon: <FiBriefcase />,
      label: 'Company',
      title: client.company || client.companyName || 'Company profile',
      text: `${services.length} active service${services.length === 1 ? '' : 's'} assigned.`
    },
    {
      icon: <FiShield />,
      label: 'Subscription',
      title: payment.planName,
      text: `Renewal: ${formatDate(payment.nextDueDate)} • Price: ${payment.subscriptionPrice || 0}`
    },
    {
      icon: <FiBell />,
      label: 'Notifications',
      title: 'Service and billing alerts',
      text: 'Updates are based on your active tasks, payments, and services.'
    },
    {
      icon: <FiMail />,
      label: 'Account Manager',
      title: manager.name || 'Not assigned',
      text: `${manager.email || 'No email assigned'}${manager.phone ? ` • ${manager.phone}` : ''}`
    },
    {
      icon: <FiSmartphone />,
      label: 'Login User',
      title: getUserDisplayName(user),
      text: user?.companyRole || user?.role || 'Client account'
    }
  ];

  return (
    <section className="ClientPageBase-root">
      <div className="ClientPageBase-header">
        <div>
          <p>Account Settings</p>
          <h1>Manage {getClientDisplayName(client)} profile, security, and credentials</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="AccountSettings-tabs">
        <button
          type="button"
          className={`AccountSettings-tabBtn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FiUser /> Profile & Details
        </button>
        <button
          type="button"
          className={`AccountSettings-tabBtn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <FiLock /> Security & Password
        </button>
        <button
          type="button"
          className={`AccountSettings-tabBtn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiShield /> Account Overview
        </button>
      </div>

      {/* Tab 1: Profile & Details */}
      {activeTab === 'profile' && (
        <div className="AccountSettings-tabContent">
          <div className="AccountSettings-formCard">
            <div className="AccountSettings-cardHeader">
              <div>
                <h2>Edit Personal & Business Details</h2>
                <p>Update your display name, phone number, and address details.</p>
              </div>
            </div>

            {profileMessage.text && (
              <div className={`AccountSettings-alert ${profileMessage.type === 'success' ? 'is-success' : 'is-error'}`}>
                {profileMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="AccountSettings-form">
              <div className="AccountSettings-formRow">
                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-name">Your Full Name *</label>
                  <input
                    id="account-name"
                    name="name"
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-email">Email Address (Login Identity)</label>
                  <input
                    id="account-email"
                    type="email"
                    disabled
                    value={client.email || user?.email || ''}
                    title="Email is tied to your account credentials"
                  />
                  <small className="AccountSettings-helperText">Email address is your primary login identifier.</small>
                </div>
              </div>

              <div className="AccountSettings-formRow">
                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-phone">Phone Number</label>
                  <input
                    id="account-phone"
                    name="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>

                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-company">Company / Business Name</label>
                  <input
                    id="account-company"
                    name="company"
                    type="text"
                    value={profileForm.company}
                    onChange={handleProfileChange}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="AccountSettings-formRow">
                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-address">Street Address</label>
                  <input
                    id="account-address"
                    name="address"
                    type="text"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                    placeholder="e.g. 104 Business Park, Main Road"
                  />
                </div>

                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-city">City</label>
                  <input
                    id="account-city"
                    name="city"
                    type="text"
                    value={profileForm.city}
                    onChange={handleProfileChange}
                    placeholder="e.g. Mumbai"
                  />
                </div>
              </div>

              <div className="AccountSettings-formRow">
                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-state">State / Province</label>
                  <input
                    id="account-state"
                    name="state"
                    type="text"
                    value={profileForm.state}
                    onChange={handleProfileChange}
                    placeholder="e.g. Maharashtra"
                  />
                </div>

                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-pincode">PIN / Postal Code</label>
                  <input
                    id="account-pincode"
                    name="pincode"
                    type="text"
                    value={profileForm.pincode}
                    onChange={handleProfileChange}
                    placeholder="e.g. 400001"
                  />
                </div>

                <div className="AccountSettings-formGroup">
                  <label htmlFor="account-country">Country</label>
                  <input
                    id="account-country"
                    name="country"
                    type="text"
                    value={profileForm.country}
                    onChange={handleProfileChange}
                    placeholder="e.g. India"
                  />
                </div>
              </div>

              <div className="AccountSettings-formActions">
                <button
                  type="submit"
                  className="AccountSettings-submitBtn"
                  disabled={profileSaving}
                >
                  <FiSave /> {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'password' && (
        <div className="AccountSettings-tabContent">
          <div className="AccountSettings-formCard AccountSettings-passwordCard">
            <div className="AccountSettings-cardHeader">
              <div>
                <h2>Change Account Password</h2>
                <p>Ensure your account remains secure by choosing a strong password.</p>
              </div>
            </div>

            {passwordMessage.text && (
              <div className={`AccountSettings-alert ${passwordMessage.type === 'success' ? 'is-success' : 'is-error'}`}>
                {passwordMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="AccountSettings-form">
              <div className="AccountSettings-formGroup">
                <label htmlFor="currentPassword">Current Password *</label>
                <div className="AccountSettings-passwordInputWrap">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPassword.current ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your existing password"
                  />
                  <button
                    type="button"
                    className="AccountSettings-eyeBtn"
                    aria-label="Toggle current password visibility"
                    onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}
                  >
                    {showPassword.current ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="AccountSettings-formRow">
                <div className="AccountSettings-formGroup">
                  <label htmlFor="newPassword">New Password *</label>
                  <div className="AccountSettings-passwordInputWrap">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword.new ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      className="AccountSettings-eyeBtn"
                      aria-label="Toggle new password visibility"
                      onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}
                    >
                      {showPassword.new ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <small className="AccountSettings-helperText">Must be at least 6 characters with letters and numbers.</small>
                </div>

                <div className="AccountSettings-formGroup">
                  <label htmlFor="confirmPassword">Confirm New Password *</label>
                  <div className="AccountSettings-passwordInputWrap">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword.confirm ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      className="AccountSettings-eyeBtn"
                      aria-label="Toggle confirm password visibility"
                      onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}
                    >
                      {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="AccountSettings-formActions">
                <button
                  type="submit"
                  className="AccountSettings-submitBtn"
                  disabled={passwordSaving}
                >
                  <FiKey /> {passwordSaving ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Account Overview (Original Cards) */}
      {activeTab === 'overview' && (
        <div className="ClientPageBase-grid ClientPageBase-settings-grid">
          {cards.map(card => (
            <article className="ClientPageBase-card" key={card.label}>
              <div className="ClientPageBase-card-icon">{card.icon}</div>
              <span>{card.label}</span>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AccountSettingsPage;
