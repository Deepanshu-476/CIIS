import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config';
import { toast } from 'react-toastify';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../../utils/scrollLock';
import './SuperAdminModal.css';

// Custom event names for global trigger
const OPEN_SA_MODAL_EVENT = 'ciis:open-superadmin-modal';
const CLOSE_SA_MODAL_EVENT = 'ciis:close-superadmin-modal';

export const openSuperAdminModal = (payload = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SA_MODAL_EVENT, { detail: payload }));
  }
};

export const closeSuperAdminModal = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLOSE_SA_MODAL_EVENT));
  }
};

const clearPreviousLoginStorage = () => {
  [
    'token',
    'user',
    'superAdmin',
    'company',
    'companyDetails',
    'companyIdentifier',
    'companyCode',
    'client',
    'sidebarConfig',
  ].forEach(key => localStorage.removeItem(key));
};

const SuperAdminModal = ({ isOpen: controlledIsOpen, onClose: controlledOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const navigate = useNavigate();
  const overlayRef = useRef(null);

  // Views: 'login' | 'otp' | 'forgot_email' | 'forgot_reset'
  const [view, setView] = useState('login');

  // Form states
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alertError, setAlertError] = useState('');

  // 2FA / OTP State
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSessionToken, setResetSessionToken] = useState('');

  // Listen to global open/close events
  useEffect(() => {
    const handleOpen = (e) => {
      setAlertError('');
      setErrors({});
      setView('login');
      if (e?.detail?.email) {
        setForm(prev => ({ ...prev, email: e.detail.email }));
      }
      setInternalIsOpen(true);
    };

    const handleClose = () => {
      setInternalIsOpen(false);
      controlledOnClose?.();
    };

    window.addEventListener(OPEN_SA_MODAL_EVENT, handleOpen);
    window.addEventListener(CLOSE_SA_MODAL_EVENT, handleClose);

    return () => {
      window.removeEventListener(OPEN_SA_MODAL_EVENT, handleOpen);
      window.removeEventListener(CLOSE_SA_MODAL_EVENT, handleClose);
    };
  }, [controlledOnClose]);

  // Intercept any /SuperAdminLogin link clicks across the page
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href');
      const hasDataAttr = target.getAttribute('data-open-superadmin') !== null;
      const isSuperAdminLink =
        href === '/SuperAdminLogin' ||
        href === '/SuperAdminLogin/' ||
        href === '#superadmin' ||
        href === '#superadminlogin';

      if (hasDataAttr || isSuperAdminLink) {
        e.preventDefault();
        e.stopPropagation();
        setAlertError('');
        setErrors({});
        setView('login');
        setInternalIsOpen(true);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // Robust background scroll lock & ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    lockBackgroundScroll();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent wheel and touch dragging on backdrop directly
    const overlay = overlayRef.current;
    const handleBackdropScroll = (e) => {
      if (e.target === overlay) {
        e.preventDefault();
      }
    };

    if (overlay) {
      overlay.addEventListener('wheel', handleBackdropScroll, { passive: false });
      overlay.addEventListener('touchmove', handleBackdropScroll, { passive: false });
    }

    return () => {
      unlockBackgroundScroll();
      window.removeEventListener('keydown', handleKeyDown);
      if (overlay) {
        overlay.removeEventListener('wheel', handleBackdropScroll);
        overlay.removeEventListener('touchmove', handleBackdropScroll);
      }
    };
  }, [isOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleModalClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalIsOpen(false);
    }
    setErrors({});
    setAlertError('');
    setView('login');
  };

  const handleBackdropClick = (e) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      handleModalClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name] || alertError) {
      setErrors(prev => ({ ...prev, [name]: '' }));
      setAlertError('');
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Master email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    setAlertError('');
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/auth/superadmin/login`, {
        email: form.email.trim(),
        password: form.password
      });

      if (response.data.success && response.data.requiresOTP) {
        setTempToken(response.data.tempToken || '');
        setOtpEmail(response.data.email || form.email.trim());
        setOtp('');
        setResendTimer(60);
        setView('otp');
        toast.success('Security verification OTP sent to your email!');
      } else if (response.data.success) {
        clearPreviousLoginStorage();
        localStorage.setItem('superAdmin', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        if (response.data.companyDetails) {
          localStorage.setItem('company', JSON.stringify(response.data.companyDetails));
        }

        toast.success('Super Admin Login successful! Redirecting...');
        handleModalClose();
        navigate('/Ciis-network/company-details');
      } else {
        const msg = response.data.message || 'Super Admin login failed';
        setAlertError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('SuperAdmin login error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please verify master credentials.';
      setAlertError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2FA / OTP Verify
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setLoading(true);
    setAlertError('');

    try {
      const response = await axios.post(`${API_URL}/auth/superadmin/verify-otp`, {
        email: otpEmail,
        otp: cleanOtp,
        tempToken: tempToken
      });

      if (response.data.success) {
        clearPreviousLoginStorage();
        localStorage.setItem('superAdmin', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        if (response.data.companyDetails) {
          localStorage.setItem('company', JSON.stringify(response.data.companyDetails));
        }

        toast.success('Super Admin authenticated! Redirecting...');
        handleModalClose();
        navigate('/Ciis-network/company-details');
      } else {
        const msg = response.data.message || 'OTP verification failed';
        setAlertError(msg);
        setErrors({ otp: msg });
        toast.error(msg);
      }
    } catch (err) {
      console.error('SuperAdmin OTP verify error:', err);
      const msg = err.response?.data?.message || 'Invalid or expired verification code';
      setAlertError(msg);
      setErrors({ otp: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;

    setLoading(true);
    setAlertError('');

    try {
      const response = await axios.post(`${API_URL}/auth/superadmin/resend-otp`, {
        email: otpEmail,
        tempToken: tempToken
      });

      if (response.data.success) {
        if (response.data.tempToken) {
          setTempToken(response.data.tempToken);
        }
        setResendTimer(60);
        setOtp('');
        toast.success('New security code sent to your email!');
      } else {
        toast.error(response.data.message || 'Failed to resend code');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 1 (Send Email)
  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setErrors({ forgotEmail: 'Please enter a valid master email address' });
      return;
    }

    setLoading(true);
    setAlertError('');

    try {
      const response = await axios.post(`${API_URL}/auth/superadmin/forgot-password`, {
        email: forgotEmail.trim()
      });

      if (response.data?.sessionToken) {
        setResetSessionToken(response.data.sessionToken);
      }
      setResendTimer(60);
      setView('forgot_reset');
      toast.success('Password reset code sent to your email!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to request password reset.';
      setAlertError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 2 (Verify OTP & Set New Password)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      newErrors.resetOtp = 'Please enter a valid 6-digit code';
    }
    if (!newPassword || newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlertError('');

    try {
      await axios.post(`${API_URL}/auth/superadmin/reset-password`, {
        email: forgotEmail.trim(),
        otp: resetOtp.trim(),
        newPassword: newPassword,
        sessionToken: resetSessionToken
      });

      toast.success('Password reset successfully! Please log in.');
      setView('login');
      setForm(prev => ({ ...prev, password: '' }));
      setForgotEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please check your OTP.';
      setAlertError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="ciis-sa-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ciis-sa-modal-title"
    >
      <div className="ciis-sa-modal-card">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleModalClose}
          className="ciis-sa-close-btn"
          aria-label="Close modal"
          title="Close (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header Section */}
        <div className="ciis-sa-header">
          <div className="ciis-sa-logo-wrap">
            <img src="/logoo.png" alt="CIIS Network" className="ciis-sa-logo-img" />
          </div>

          <div className="ciis-sa-badge">
            <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px", lineHeight: "1" }}>
              shield_person
            </span>
            <span>Super Admin Access</span>
          </div>

          <h2 id="ciis-sa-modal-title" className="ciis-sa-title">
            {view === 'login' && 'Super Admin Portal'}
            {view === 'otp' && 'Security Verification'}
            {view === 'forgot_email' && 'Reset Super Admin Password'}
            {view === 'forgot_reset' && 'Set New Password'}
          </h2>

          <p className="ciis-sa-subtitle">
            {view === 'login' && 'Enter credentials to access platform governance and multi-tenant control.'}
            {view === 'otp' && 'Two-factor authentication is active. Enter the 6-digit code sent to your email.'}
            {view === 'forgot_email' && 'Enter your registered super admin email to receive a recovery OTP.'}
            {view === 'forgot_reset' && 'Enter the 6-digit recovery code and your new master password.'}
          </p>
        </div>

        {/* Alert Error Box */}
        {alertError && (
          <div className="ciis-sa-alert error" style={{ marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "18px", lineHeight: "1" }}>
              error
            </span>
            <span>{alertError}</span>
          </div>
        )}

        {/* VIEW 1: SUPER ADMIN LOGIN */}
        {view === 'login' && (
          <form className="ciis-sa-form" onSubmit={handleLoginSubmit} noValidate>
            {/* Master Email */}
            <div className="ciis-sa-field">
              <label className="ciis-sa-label" htmlFor="sa-email">
              Email Address
              </label>
              <div className={`ciis-sa-input-wrap ${errors.email ? 'has-error' : ''}`}>
                <span className="ciis-sa-field-icon" style={{ fontFamily: "'Material Symbols Rounded'" }}>
                  mail
                </span>
                <input
                  id="sa-email"
                  type="email"
                  name="email"
                  className="ciis-sa-input"
                  placeholder="superadmin@ciisnetwork.in"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
              {errors.email && <span className="ciis-sa-field-error">{errors.email}</span>}
            </div>

            {/* Master Password */}
            <div className="ciis-sa-field">
              <div className="ciis-sa-label">
                <label htmlFor="sa-password">Password</label>
                <button
                  type="button"
                  className="ciis-sa-forgot-link"
                  onClick={() => {
                    setForgotEmail(form.email.trim());
                    setAlertError('');
                    setErrors({});
                    setView('forgot_email');
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className={`ciis-sa-input-wrap ${errors.password ? 'has-error' : ''}`}>
                <span className="ciis-sa-field-icon" style={{ fontFamily: "'Material Symbols Rounded'" }}>
                  lock
                </span>
                <input
                  id="sa-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="ciis-sa-input"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="ciis-sa-toggle-pwd"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && <span className="ciis-sa-field-error">{errors.password}</span>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="ciis-sa-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ciis-sa-spinner"></span>
                  <span>Verifying Master Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            {/* Security Footer Note */}
            <div className="ciis-sa-footer-note">
              <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "15px", lineHeight: "1", color: "#6366f1" }}>
                lock
              </span>
              <span>Encrypted TLS 1.3 · IP Geofenced Master Console</span>
            </div>
          </form>
        )}

        {/* VIEW 2: 2FA / OTP VERIFICATION */}
        {view === 'otp' && (
          <form className="ciis-sa-form" onSubmit={handleVerifyOtp} noValidate>
            <p className="ciis-sa-otp-display-email">
              Verification code sent to <strong>{otpEmail}</strong>
            </p>

            <div className="ciis-sa-field">
              <label className="ciis-sa-label" htmlFor="sa-otp">
                Enter 6-Digit OTP
              </label>
              <div className={`ciis-sa-input-wrap ${errors.otp ? 'has-error' : ''}`}>
                <input
                  id="sa-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="ciis-sa-input ciis-sa-otp-input"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(clean);
                    if (errors.otp) setErrors({});
                  }}
                  autoFocus
                  disabled={loading}
                />
              </div>
              {errors.otp && <span className="ciis-sa-field-error">{errors.otp}</span>}
            </div>

            <div className="ciis-sa-otp-timer-row">
              <span style={{ color: '#64748b' }}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Didn’t receive the code?'}
              </span>
              <button
                type="button"
                className="ciis-sa-resend-btn"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
              >
                Resend Code
              </button>
            </div>

            <button
              type="submit"
              className="ciis-sa-submit-btn"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <span className="ciis-sa-spinner"></span>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Access Console</span>
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>
                    check_circle
                  </span>
                </>
              )}
            </button>

            <div className="ciis-sa-back-row">
              <button
                type="button"
                className="ciis-sa-back-btn"
                onClick={() => {
                  setView('login');
                  setOtp('');
                  setAlertError('');
                  setErrors({});
                }}
              >
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px", lineHeight: "1" }}>
                  arrow_back
                </span>
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD (EMAIL) */}
        {view === 'forgot_email' && (
          <form className="ciis-sa-form" onSubmit={handleSendResetEmail} noValidate>
            <div className="ciis-sa-field">
              <label className="ciis-sa-label" htmlFor="sa-forgot-email">
                Registered Super Admin Email
              </label>
              <div className={`ciis-sa-input-wrap ${errors.forgotEmail ? 'has-error' : ''}`}>
                <span className="ciis-sa-field-icon" style={{ fontFamily: "'Material Symbols Rounded'" }}>
                  mail
                </span>
                <input
                  id="sa-forgot-email"
                  type="email"
                  className="ciis-sa-input"
                  placeholder="superadmin@ciisnetwork.in"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (errors.forgotEmail) setErrors({});
                  }}
                  autoFocus
                  disabled={loading}
                />
              </div>
              {errors.forgotEmail && <span className="ciis-sa-field-error">{errors.forgotEmail}</span>}
            </div>

            <button
              type="submit"
              className="ciis-sa-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ciis-sa-spinner"></span>
                  <span>Sending Recovery Code...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Code</span>
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>
                    send
                  </span>
                </>
              )}
            </button>

            <div className="ciis-sa-back-row">
              <button
                type="button"
                className="ciis-sa-back-btn"
                onClick={() => {
                  setView('login');
                  setAlertError('');
                  setErrors({});
                }}
              >
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px", lineHeight: "1" }}>
                  arrow_back
                </span>
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: FORGOT PASSWORD (RESET) */}
        {view === 'forgot_reset' && (
          <form className="ciis-sa-form" onSubmit={handleResetPassword} noValidate>
            <div className="ciis-sa-field">
              <label className="ciis-sa-label" htmlFor="sa-reset-otp">
                6-Digit Recovery Code
              </label>
              <div className={`ciis-sa-input-wrap ${errors.resetOtp ? 'has-error' : ''}`}>
                <input
                  id="sa-reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="ciis-sa-input ciis-sa-otp-input"
                  placeholder="••••••"
                  value={resetOtp}
                  onChange={(e) => {
                    setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (errors.resetOtp) setErrors({});
                  }}
                  autoFocus
                  disabled={loading}
                />
              </div>
              {errors.resetOtp && <span className="ciis-sa-field-error">{errors.resetOtp}</span>}
            </div>

            <div className="ciis-sa-field">
              <label className="ciis-sa-label" htmlFor="sa-new-password">
                New Master Password
              </label>
              <div className={`ciis-sa-input-wrap ${errors.newPassword ? 'has-error' : ''}`}>
                <span className="ciis-sa-field-icon" style={{ fontFamily: "'Material Symbols Rounded'" }}>
                  lock
                </span>
                <input
                  id="sa-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className="ciis-sa-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({});
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="ciis-sa-toggle-pwd"
                  onClick={() => setShowNewPassword(p => !p)}
                >
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.newPassword && <span className="ciis-sa-field-error">{errors.newPassword}</span>}
            </div>

            <div className="ciis-sa-field">
              <label className="ciis-sa-label" htmlFor="sa-confirm-password">
                Confirm Master Password
              </label>
              <div className={`ciis-sa-input-wrap ${errors.confirmPassword ? 'has-error' : ''}`}>
                <span className="ciis-sa-field-icon" style={{ fontFamily: "'Material Symbols Rounded'" }}>
                  lock_reset
                </span>
                <input
                  id="sa-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="ciis-sa-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({});
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="ciis-sa-toggle-pwd"
                  onClick={() => setShowConfirmPassword(p => !p)}
                >
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && <span className="ciis-sa-field-error">{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
              className="ciis-sa-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ciis-sa-spinner"></span>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset & Sign In</span>
                  <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "19px", lineHeight: "1" }}>
                    check
                  </span>
                </>
              )}
            </button>

            <div className="ciis-sa-back-row">
              <button
                type="button"
                className="ciis-sa-back-btn"
                onClick={() => {
                  setView('login');
                  setAlertError('');
                  setErrors({});
                }}
              >
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: "16px", lineHeight: "1" }}>
                  arrow_back
                </span>
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SuperAdminModal;
