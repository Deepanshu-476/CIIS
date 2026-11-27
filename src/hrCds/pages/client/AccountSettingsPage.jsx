import { accountStorage } from '../../../utils/authSession';
import React, { useState, useEffect } from 'react';
import {
  FiBell,
  FiBriefcase,
  FiCheck,
  FiMail,
  FiMapPin,
  FiShield,
  FiSmartphone,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiKey,
  FiCreditCard
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
      <section className="AccountSettings-page">
        <div className="AccountSettings-errorCard">
          <FiAlertCircle />
          <h2>Unable to load Account Settings</h2>
          <p>{error || 'No client data found for this account.'}</p>
          <button type="button" className="AccountSettings-submitBtn" onClick={refetch}>Try Again</button>
        </div>
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

      // 3. Update accountStorage sessions
      const storedUser = JSON.parse(accountStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      };
      accountStorage.setItem('user', JSON.stringify(updatedUser));

      if (client) {
        const storedClient = JSON.parse(accountStorage.getItem('client') || '{}');
        const updatedClient = {
          ...storedClient,
          client: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          company: profileForm.company.trim(),
        };
        accountStorage.setItem('client', JSON.stringify(updatedClient));
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

  const clientDisplayName = getClientDisplayName(client);
  const clientInitials = String(clientDisplayName || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'C';
  const formattedPrice = `₹${Number(payment.subscriptionPrice || 0).toLocaleString('en-IN')}`;
  const hasMinLen = passwordForm.newPassword.length >= 6;
  const hasAlphaNum = /[a-zA-Z]/.test(passwordForm.newPassword) && /\d/.test(passwordForm.newPassword);
  const passwordsMatch = Boolean(passwordForm.newPassword) && passwordForm.newPassword === passwordForm.confirmPassword;

  const cards = [
    {
      icon: <FiUser />,
      tone: 'blue',
      label: 'Profile',
      title: clientDisplayName,
      text: `${client.email || user?.email || 'No email'}${client.phone ? ` • ${client.phone}` : ''}`
    },
    {
      icon: <FiBriefcase />,
      tone: 'indigo',
      label: 'Company',
      title: client.company || client.companyName || 'Company profile',
      text: `${services.length} active service${services.length === 1 ? '' : 's'} assigned to this account.`
    },
    {
      icon: <FiCreditCard />,
      tone: 'emerald',
      label: 'Subscription',
      title: payment.planName,
      text: `Renewal: ${formatDate(payment.nextDueDate)} • Price: ${formattedPrice}`
    },
    {
      icon: <FiBell />,
      tone: 'amber',
      label: 'Notifications',
      title: 'Service and billing alerts',
      text: 'Updates are based on your active tasks, payments, and services.'
    },
    {
      icon: <FiMail />,
      tone: 'violet',
      label: 'Account Manager',
      title: manager.name || 'Not assigned',
      text: `${manager.email || 'No email assigned'}${manager.phone ? ` • ${manager.phone}` : ''}`
    },
    {
      icon: <FiSmartphone />,
      tone: 'slate',
      label: 'Login User',
      title: getUserDisplayName(user),
      text: `Role: ${user?.companyRole || user?.role || 'Client account'}`
    }
  ];

  return (
    <section className="AccountSettings-page">
      {/* Hero Header */}
      <header className="AccountSettings-hero">
        <div className="AccountSettings-heroIdentity">
          <div className="AccountSettings-avatar" aria-hidden="true">{clientInitials}</div>
          <div className="AccountSettings-heroText">
            <span className="AccountSettings-eyebrow">Account Settings</span>
            <h1>{clientDisplayName}</h1>
            <p>{client.email || user?.email || 'Client Portal'} • Manage profile, security, and credentials</p>
          </div>
        </div>
        <div className="AccountSettings-heroBadges">
          <span className="AccountSettings-pill is-emerald">
            <FiShield /> {payment.planName}
          </span>
          <span className="AccountSettings-pill is-blue">
            <FiBriefcase /> {services.length} Active Service{services.length === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="AccountSettings-tabsWrap">
        <div className="AccountSettings-tabs" role="tablist" aria-label="Account settings sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            className={`AccountSettings-tabBtn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> <span>Profile & Details</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'password'}
            className={`AccountSettings-tabBtn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <FiLock /> <span>Security & Password</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`AccountSettings-tabBtn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiShield /> <span>Account Overview</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Profile & Details */}
      {activeTab === 'profile' && (
        <div className="AccountSettings-workspace">
          <div className="AccountSettings-formCard">
            <div className="AccountSettings-cardHeader">
              <span className="AccountSettings-sectionIcon is-blue"><FiUser /></span>
              <div>
                <h2>Personal & Business Details</h2>
                <p>Update your contact name, phone number, and company address.</p>
              </div>
            </div>

            {profileMessage.text && (
              <div className={`AccountSettings-alert ${profileMessage.type === 'success' ? 'is-success' : 'is-error'}`}>
                {profileMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="AccountSettings-form">
              <div className="AccountSettings-sectionLabel">Contact Information</div>
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
                  <small className="AccountSettings-helperText">Primary login identifier (read-only).</small>
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

              <div className="AccountSettings-divider" />
              <div className="AccountSettings-sectionLabel"><FiMapPin /> Business & Billing Address</div>

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

              <div className="AccountSettings-formRow is-three">
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

          <aside className="AccountSettings-sideCard">
            <h3>Account Snapshot</h3>
            <p className="AccountSettings-sideSubtitle">Quick reference for your active workspace subscription.</p>
            <div className="AccountSettings-snapshotList">
              <div>
                <span>Subscription Plan</span>
                <strong>{payment.planName}</strong>
              </div>
              <div>
                <span>Next Renewal</span>
                <strong>{formatDate(payment.nextDueDate)}</strong>
              </div>
              <div>
                <span>Plan Amount</span>
                <strong>{formattedPrice}</strong>
              </div>
              <div>
                <span>Login Account</span>
                <strong>{getUserDisplayName(user)}</strong>
              </div>
              <div>
                <span>Account Manager</span>
                <strong>{manager.name || 'Not assigned'}</strong>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'password' && (
        <div className="AccountSettings-workspace">
          <div className="AccountSettings-formCard">
            <div className="AccountSettings-cardHeader">
              <span className="AccountSettings-sectionIcon is-indigo"><FiLock /></span>
              <div>
                <h2>Change Account Password</h2>
                <p>Keep your client portal secure with a strong unique password.</p>
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

          <aside className="AccountSettings-sideCard">
            <h3>Password Requirements</h3>
            <p className="AccountSettings-sideSubtitle">Follow these checks for strong account protection.</p>
            <ul className="AccountSettings-checklist">
              <li className={hasMinLen ? 'is-met' : ''}>
                <span><FiCheck /></span>
                At least 6 characters long
              </li>
              <li className={hasAlphaNum ? 'is-met' : ''}>
                <span><FiCheck /></span>
                Mix of letters and numbers recommended
              </li>
              <li className={passwordsMatch ? 'is-met' : ''}>
                <span><FiCheck /></span>
                New & confirm password match
              </li>
            </ul>
          </aside>
        </div>
      )}

      {/* Tab 3: Account Overview */}
      {activeTab === 'overview' && (
        <div className="AccountSettings-overviewGrid">
          {cards.map(card => (
            <article className="AccountSettings-overviewCard" key={card.label}>
              <div className="AccountSettings-overviewCardTop">
                <div className={`AccountSettings-overviewIcon is-${card.tone}`}>{card.icon}</div>
                <span className="AccountSettings-overviewLabel">{card.label}</span>
              </div>
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
