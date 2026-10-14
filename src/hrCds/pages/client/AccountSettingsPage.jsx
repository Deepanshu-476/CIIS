import React, { useState } from 'react';
import { FiBell, FiBriefcase, FiMail, FiShield, FiSmartphone, FiUser, FiEdit2, FiX, FiKey, FiPhone, FiMapPin, FiGlobe } from 'react-icons/fi';
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

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'profile' | 'company' | 'password' | null
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Forms
  const [profileForm, setProfileForm] = useState({
    client: '',
    phone: '',
    city: '',
    state: '',
    address: ''
  });

  const [companyForm, setCompanyForm] = useState({
    company: '',
    industry: '',
    website: '',
    gst: '',
    pan: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('ciis_client_notif_prefs');
      return saved ? JSON.parse(saved) : { taskUpdates: true, billingAlerts: true, meetingReminders: true };
    } catch {
      return { taskUpdates: true, billingAlerts: true, meetingReminders: true };
    }
  });

  const toggleNotif = key => {
    setNotificationPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('ciis_client_notif_prefs', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const showToast = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
  };

  const openEditProfile = () => {
    if (!client) return;
    setProfileForm({
      client: client.client || client.name || '',
      phone: client.phone || '',
      city: client.city || '',
      state: client.state || '',
      address: client.address || ''
    });
    setActiveModal('profile');
  };

  const openEditCompany = () => {
    if (!client) return;
    setCompanyForm({
      company: client.company || client.companyName || '',
      industry: client.industry || '',
      website: client.website || '',
      gst: client.gst || '',
      pan: client.pan || ''
    });
    setActiveModal('company');
  };

  const openChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setActiveModal('password');
  };

  const handleSaveProfile = async e => {
    e.preventDefault();
    if (!profileForm.client.trim()) {
      showToast('Client name is required', 'error');
      return;
    }
    if (!profileForm.phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const clientId = client._id || client.id;
      const payload = {
        client: profileForm.client.trim(),
        phone: profileForm.phone.trim(),
        city: profileForm.city.trim() || client.city || 'N/A',
        state: profileForm.state.trim(),
        address: profileForm.address.trim(),
        companyCode: client.companyCode
      };
      await axiosInstance.put(`/clientsservice/${clientId}`, payload);
      await refetch();
      setActiveModal(null);
      showToast('Profile information updated successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async e => {
    e.preventDefault();
    if (!companyForm.company.trim()) {
      showToast('Company name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const clientId = client._id || client.id;
      const payload = {
        company: companyForm.company.trim(),
        industry: companyForm.industry.trim(),
        website: companyForm.website.trim(),
        gst: companyForm.gst.trim().toUpperCase(),
        pan: companyForm.pan.trim().toUpperCase(),
        companyCode: client.companyCode
      };
      await axiosInstance.put(`/clientsservice/${clientId}`, payload);
      await refetch();
      setActiveModal(null);
      showToast('Company details updated successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to update company details', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match', 'error');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.put('/users/change-password', {
        currentPassword,
        newPassword
      });
      setActiveModal(null);
      showToast('Password changed successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <section className="ClientPageBase-root">
      {actionMessage.text && (
        <div className={`ClientPageBase-toast ${actionMessage.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {actionMessage.text}
        </div>
      )}

      <div className="ClientPageBase-header">
        <div>
          <p>Account Settings</p>
          <h1>Manage {getClientDisplayName(client)} profile, security, and notifications</h1>
        </div>
      </div>

      <div className="ClientPageBase-grid ClientPageBase-settings-grid">
        {/* PROFILE CARD */}
        <article className="ClientPageBase-card">
          <div className="ClientPageBase-card-top">
            <div className="ClientPageBase-card-icon"><FiUser /></div>
            <button type="button" className="ClientPageBase-card-edit-btn" onClick={openEditProfile}>
              <FiEdit2 /> Edit
            </button>
          </div>
          <span className="ClientPageBase-card-kicker">Profile</span>
          <h2>{getClientDisplayName(client)}</h2>
          <p>{client.email || user?.email || 'No email'}{client.phone ? ` • ${client.phone}` : ''}</p>
          <div className="ClientPageBase-card-meta">
            {client.city && (
              <div className="meta-tag"><FiMapPin /> {client.city}{client.state ? `, ${client.state}` : ''}</div>
            )}
            {client.address && (
              <div className="meta-tag meta-tag-full">{client.address}</div>
            )}
            {(!client.city || !client.address) && (
              <button type="button" className="meta-add-btn" onClick={openEditProfile}>+ Add City / Address details</button>
            )}
          </div>
        </article>

        {/* COMPANY CARD */}
        <article className="ClientPageBase-card">
          <div className="ClientPageBase-card-top">
            <div className="ClientPageBase-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FiBriefcase /></div>
            <button type="button" className="ClientPageBase-card-edit-btn" onClick={openEditCompany}>
              <FiEdit2 /> Edit
            </button>
          </div>
          <span className="ClientPageBase-card-kicker">Company</span>
          <h2>{client.company || client.companyName || 'Company profile'}</h2>
          <p>{services.length} active service{services.length === 1 ? '' : 's'} assigned.</p>
          <div className="ClientPageBase-card-meta">
            {client.industry && <div className="meta-tag">Industry: {client.industry}</div>}
            {client.website && <div className="meta-tag"><FiGlobe /> {client.website}</div>}
            {client.gst && <div className="meta-tag">GST: {client.gst}</div>}
            {client.pan && <div className="meta-tag">PAN: {client.pan}</div>}
            {(!client.gst || !client.pan || !client.website) && (
              <button type="button" className="meta-add-btn" onClick={openEditCompany}>+ Add GST / PAN / Website details</button>
            )}
          </div>
        </article>

        {/* SUBSCRIPTION CARD */}
        <article className="ClientPageBase-card">
          <div className="ClientPageBase-card-top">
            <div className="ClientPageBase-card-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><FiShield /></div>
            <span className="badge-active">Active</span>
          </div>
          <span className="ClientPageBase-card-kicker">Subscription</span>
          <h2>{payment.planName || 'Standard Client Plan'}</h2>
          <p>Renewal: {formatDate(payment.nextDueDate)} • Price: {payment.subscriptionPrice || 0}</p>
        </article>

        {/* NOTIFICATIONS CARD */}
        <article className="ClientPageBase-card">
          <div className="ClientPageBase-card-top">
            <div className="ClientPageBase-card-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><FiBell /></div>
          </div>
          <span className="ClientPageBase-card-kicker">Notification Preferences</span>
          <h2>Service & Billing Alerts</h2>
          <div className="toggle-list">
            <label className="toggle-item">
              <span>Task & Service Updates</span>
              <input type="checkbox" checked={notificationPrefs.taskUpdates} onChange={() => toggleNotif('taskUpdates')} />
            </label>
            <label className="toggle-item">
              <span>Billing & Invoice Reminders</span>
              <input type="checkbox" checked={notificationPrefs.billingAlerts} onChange={() => toggleNotif('billingAlerts')} />
            </label>
            <label className="toggle-item">
              <span>Meeting Alerts</span>
              <input type="checkbox" checked={notificationPrefs.meetingReminders} onChange={() => toggleNotif('meetingReminders')} />
            </label>
          </div>
        </article>

        {/* ACCOUNT MANAGER CARD */}
        <article className="ClientPageBase-card">
          <div className="ClientPageBase-card-top">
            <div className="ClientPageBase-card-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><FiMail /></div>
          </div>
          <span className="ClientPageBase-card-kicker">Account Manager</span>
          <h2>{manager.name || 'Not assigned'}</h2>
          <p>{manager.email || 'No email assigned'}{manager.phone ? ` • ${manager.phone}` : ''}</p>
          {manager.phone && (
            <div className="contact-actions">
              <a href={`tel:${manager.phone}`} className="btn-call">📞 Call Manager</a>
            </div>
          )}
        </article>

        {/* LOGIN USER & SECURITY CARD */}
        <article className="ClientPageBase-card">
          <div className="ClientPageBase-card-top">
            <div className="ClientPageBase-card-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><FiSmartphone /></div>
            <button type="button" className="ClientPageBase-card-edit-btn" onClick={openChangePassword}>
              <FiKey /> Password
            </button>
          </div>
          <span className="ClientPageBase-card-kicker">Login & Security</span>
          <h2>{getUserDisplayName(user)}</h2>
          <p>{user?.companyRole || user?.role || 'Client account'} • {user?.email || client.email}</p>
          <div className="security-actions">
            <button type="button" className="btn-change-pwd" onClick={openChangePassword}>
              Change Account Password
            </button>
          </div>
        </article>
      </div>

      {/* EDIT PROFILE MODAL */}
      {activeModal === 'profile' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile Information</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}><FiX /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={profileForm.client}
                  onChange={e => setProfileForm({ ...profileForm, client: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  rows="3"
                  value={profileForm.address}
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMPANY MODAL */}
      {activeModal === 'company' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Company Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}><FiX /></button>
            </div>
            <form onSubmit={handleSaveCompany} className="modal-form">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={companyForm.company}
                  onChange={e => setCompanyForm({ ...companyForm, company: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input
                  type="text"
                  value={companyForm.industry}
                  onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  placeholder="e.g. Technology, Healthcare"
                />
              </div>
              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  value={companyForm.website}
                  onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    value={companyForm.gst}
                    onChange={e => setCompanyForm({ ...companyForm, gst: e.target.value.toUpperCase() })}
                    placeholder="GSTIN"
                  />
                </div>
                <div className="form-group">
                  <label>PAN Number</label>
                  <input
                    type="text"
                    value={companyForm.pan}
                    onChange={e => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })}
                    placeholder="PAN Number"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {activeModal === 'password' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}><FiX /></button>
            </div>
            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password * (Min 6 characters)</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountSettingsPage;
