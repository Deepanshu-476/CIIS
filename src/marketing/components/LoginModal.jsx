import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../../utils/scrollLock';
import './LoginModal.css';

// Custom event names for global trigger
const OPEN_MODAL_EVENT = 'ciis:open-login-modal';
const CLOSE_MODAL_EVENT = 'ciis:close-login-modal';

export const openLoginModal = (payload = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_MODAL_EVENT, { detail: payload }));
  }
};

export const closeLoginModal = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLOSE_MODAL_EVENT));
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

const getCompanyAuthPath = (companyIdentifier, action) => {
  const safeIdentifier = encodeURIComponent(companyIdentifier);
  const paths = {
    login: `/auth/company/${safeIdentifier}/login`,
    verifyOtp: `/auth/company/${safeIdentifier}/verify-otp`,
    resendOtp: `/auth/company/${safeIdentifier}/resend-otp`,
  };
  return paths[action] || '/auth/login';
};

const LoginModal = ({ isOpen: controlledIsOpen, onClose: controlledOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const navigate = useNavigate();
  const { setUser, setToken, setIsAuthenticated } = useAuth();

  // Modal Views: 'login' | 'otp' | 'forgot_email' | 'forgot_reset'
  const [view, setView] = useState('login');

  // Form State
  const [form, setForm] = useState({
    companyCode: '',
    email: '',
    password: '',
    rememberCompanyCode: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 2FA / Login OTP state
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const cardRef = useRef(null);
  const overlayRef = useRef(null);
  const initialCompanyCodeSet = useRef(false);

  // Load remembered company code
  useEffect(() => {
    if (!initialCompanyCodeSet.current) {
      const savedCode = localStorage.getItem('companyCode') || localStorage.getItem('companyIdentifier') || '';
      if (savedCode) {
        setForm(prev => ({ ...prev, companyCode: savedCode }));
      }
      initialCompanyCodeSet.current = true;
    }
  }, []);

  // Listen to global open/close events
  useEffect(() => {
    const handleOpen = (e) => {
      const detail = e.detail || {};
      if (detail.companyCode) {
        setForm(prev => ({ ...prev, companyCode: detail.companyCode }));
      }
      setView('login');
      setErrors({});
      setInternalIsOpen(true);
    };

    const handleClose = () => {
      setInternalIsOpen(false);
      controlledOnClose?.();
    };

    window.addEventListener(OPEN_MODAL_EVENT, handleOpen);
    window.addEventListener(CLOSE_MODAL_EVENT, handleClose);

    return () => {
      window.removeEventListener(OPEN_MODAL_EVENT, handleOpen);
      window.removeEventListener(CLOSE_MODAL_EVENT, handleClose);
    };
  }, [controlledOnClose]);

  // Handle ESC key & robust background scroll locking
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
    if (view === 'otp' && otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
    } else if (view === 'otp' && otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearTimeout(timer);
  }, [view, otpTimer]);

  const handleModalClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalIsOpen(false);
    }
    setErrors({});
    setView('login');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!form.companyCode.trim()) {
      newErrors.companyCode = 'Company code is required';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
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

  // Perform Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    setErrors({});

    const activeCompanyCode = form.companyCode.trim().toUpperCase();

    try {
      const loginEndpoint = getCompanyAuthPath(activeCompanyCode, 'login');
      const loginPayload = {
        email: form.email.trim(),
        password: form.password,
        companyCode: activeCompanyCode
      };

      const res = await axios.post(loginEndpoint, loginPayload, { _skipErrorNotify: true });

      // Handle 2FA / OTP requirement
      if (res.data.requiresOTP) {
        setOtpEmail(res.data.email || form.email.trim());
        setTempToken(res.data.tempToken);
        setOtp('');
        setOtpTimer(60);
        setCanResendOtp(false);
        setView('otp');
        toast.info('Verification code sent to your email.');
        return;
      }

      // Success
      handleLoginSuccess(res.data, activeCompanyCode);

    } catch (err) {
      console.error('Login error:', err);
      let errorMsg = 'Login failed. Please verify your credentials.';

      if (err.response?.data) {
        const { errorCode, message } = err.response.data;
        if (message) errorMsg = message;

        switch (errorCode) {
          case 'ACCOUNT_LOCKED':
            errorMsg = 'Account is locked. Please try again later.';
            break;
          case 'ACCOUNT_DEACTIVATED':
            errorMsg = 'Account deactivated. Please contact your company admin.';
            break;
          case 'SUBSCRIPTION_EXPIRED':
            errorMsg = 'Company subscription has expired. Contact your administrator.';
            break;
          case 'INVALID_CREDENTIALS':
            errorMsg = 'Invalid email or password.';
            break;
          case 'COMPANY_NOT_FOUND':
            errorMsg = 'Company code not found. Please double-check.';
            break;
          default:
            if (err.response.status === 401) {
              errorMsg = 'Invalid credentials. Please check your email and password.';
            }
            break;
        }
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Network error. Please check your internet connection.';
      }

      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Process successful auth response
  const handleLoginSuccess = (data, activeCompanyCode) => {
    clearPreviousLoginStorage();

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken?.(data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser?.(data.user);
      setIsAuthenticated?.(true);
    }

    if (data.client) {
      localStorage.setItem('client', JSON.stringify(data.client));
    }

    if (activeCompanyCode) {
      if (form.rememberCompanyCode) {
        localStorage.setItem('companyCode', activeCompanyCode);
        localStorage.setItem('companyIdentifier', activeCompanyCode);
      }
    }

    if (data.companyDetails) {
      localStorage.setItem('companyDetails', JSON.stringify(data.companyDetails));
    }

    toast.success('Login successful!');
    handleModalClose();

    // Determine redirect
    const companyRole = String(data.user?.companyRole || '').toLowerCase();
    const userRole = String(data.user?.role || '').toLowerCase();
    let redirectPath = '/ciisUser/user-dashboard';

    if (companyRole === 'client') {
      redirectPath = '/client/dashboard';
    } else if (data.redirectTo) {
      redirectPath = data.redirectTo;
    } else if (userRole === 'admin') {
      redirectPath = '/admin/dashboard';
    }

    navigate(redirectPath);
  };

  // Verify Login OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    setErrors({});

    const activeCompanyCode = form.companyCode.trim().toUpperCase();

    try {
      const verifyEndpoint = activeCompanyCode
        ? getCompanyAuthPath(activeCompanyCode, 'verifyOtp')
        : '/auth/verify-login-otp';

      const response = await axios.post(verifyEndpoint, {
        email: otpEmail,
        otp: cleanOtp,
        tempToken: tempToken
      }, { _skipErrorNotify: true });

      if (response.data.success) {
        handleLoginSuccess(response.data, activeCompanyCode);
      }
    } catch (err) {
      console.error('OTP error:', err);
      const msg = err.response?.data?.message || 'Invalid verification code. Please try again.';
      setErrors({ otp: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend Login OTP
  const handleResendOtp = async () => {
    if (!canResendOtp || loading) return;

    setLoading(true);
    const activeCompanyCode = form.companyCode.trim().toUpperCase();

    try {
      const resendEndpoint = activeCompanyCode
        ? getCompanyAuthPath(activeCompanyCode, 'resendOtp')
        : '/auth/resend-login-otp';

      const res = await axios.post(resendEndpoint, { email: otpEmail }, { _skipErrorNotify: true });
      if (res.data.success) {
        setTempToken(res.data.tempToken || tempToken);
        setOtpTimer(60);
        setCanResendOtp(false);
        setOtp('');
        setErrors({});
        toast.success('Verification code resent successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Request Forgot Password OTP
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrors({ forgotEmail: 'Registered email is required' });
      return;
    }

    setLoading(true);
    setErrors({});

    const activeCompanyCode = form.companyCode.trim().toUpperCase();

    try {
      const resetContext = activeCompanyCode ? { companyCode: activeCompanyCode } : {};
      const res = await axios.post('/auth/forgot-password', {
        email: forgotEmail.trim(),
        ...resetContext
      }, { _skipErrorNotify: true });

      if (res.data.success) {
        toast.success(res.data.message || 'Reset code sent to your email!');
        setView('forgot_reset');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code.';
      setErrors({ forgotEmail: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!resetOtp || resetOtp.length !== 6) {
      newErrors.resetOtp = 'Please enter 6-digit code';
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
    setErrors({});

    const activeCompanyCode = form.companyCode.trim().toUpperCase();

    try {
      const resetContext = activeCompanyCode ? { companyCode: activeCompanyCode } : {};
      const verifyRes = await axios.post('/auth/verify-reset-otp', {
        email: forgotEmail.trim(),
        otp: resetOtp.trim(),
        ...resetContext
      }, { _skipErrorNotify: true });

      const nextResetToken = verifyRes.data?.resetToken;
      if (!nextResetToken) {
        throw new Error('Verification completed, but reset token was not received.');
      }

      await axios.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        resetToken: nextResetToken,
        newPassword: newPassword,
        ...resetContext
      }, { _skipErrorNotify: true });

      toast.success('Password reset successfully! Please sign in.');
      setView('login');
      setForm(prev => ({ ...prev, password: '' }));
      setForgotEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password.';
      setErrors({ resetGeneral: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="ciis-login-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ciis-modal-title"
    >
      <div className="ciis-login-modal-card" ref={cardRef}>
        {/* Close Button */}
        <button
          type="button"
          onClick={handleModalClose}
          className="ciis-modal-close-btn"
          aria-label="Close modal"
          title="Close (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* VIEW 1: LOGIN */}
        {view === 'login' && (
          <>
            <div className="ciis-modal-header">
              <div className="ciis-modal-logo-wrap">
                <img src="/logoo.png" alt="CIIS Network" className="ciis-modal-logo-img" />
              </div>
              <span className="ciis-modal-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                Enterprise Portal
              </span>
              <h2 id="ciis-modal-title" className="ciis-modal-title">Welcome Back</h2>
              <p className="ciis-modal-subtitle">Sign in to access your company workspace</p>
            </div>

            {errors.general && (
              <div className="ciis-modal-alert">
                <svg className="ciis-modal-alert-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="ciis-modal-form" noValidate>
              {/* Company Code */}
              <div className="ciis-modal-field">
                <label className="ciis-modal-label" htmlFor="ciis-company-code">Company Code</label>
                <div className={`ciis-modal-input-wrap ${errors.companyCode ? 'has-error' : ''}`}>
                  <span className="ciis-modal-field-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                    </svg>
                  </span>
                  <input
                    id="ciis-company-code"
                    type="text"
                    name="companyCode"
                    value={form.companyCode}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="e.g. CIISNE or YOURCODE"
                    className="ciis-modal-input"
                    autoCapitalize="characters"
                    autoComplete="organization"
                    required
                  />
                </div>
                {errors.companyCode && <span className="ciis-modal-error-text">{errors.companyCode}</span>}
              </div>

              {/* Email Address */}
              <div className="ciis-modal-field">
                <label className="ciis-modal-label" htmlFor="ciis-email">Email Address</label>
                <div className={`ciis-modal-input-wrap ${errors.email ? 'has-error' : ''}`}>
                  <span className="ciis-modal-field-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </span>
                  <input
                    id="ciis-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="employee@company.com"
                    className="ciis-modal-input"
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && <span className="ciis-modal-error-text">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="ciis-modal-field">
                <div className="ciis-modal-label-row">
                  <label className="ciis-modal-label" htmlFor="ciis-password">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(form.email);
                      setView('forgot_email');
                      setErrors({});
                    }}
                    className="ciis-modal-forgot-link"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className={`ciis-modal-input-wrap ${errors.password ? 'has-error' : ''}`}>
                  <span className="ciis-modal-field-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </span>
                  <input
                    id="ciis-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Enter your account password"
                    className="ciis-modal-input"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ciis-modal-input-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="ciis-modal-error-text">{errors.password}</span>}
              </div>

              {/* Remember Code Checkbox */}
              <div className="ciis-modal-options-row">
                <label className="ciis-modal-checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberCompanyCode"
                    checked={form.rememberCompanyCode}
                    onChange={handleInputChange}
                    className="ciis-modal-checkbox"
                  />
                  <span>Remember company code on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="ciis-modal-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="ciis-modal-spinner" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 7L9.6 8.4 12.2 11H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="ciis-modal-footer">
              <p className="ciis-modal-footer-text">
                Don't have a company account?
                <button
                  type="button"
                  onClick={() => {
                    handleModalClose();
                    navigate('/RegisterCompany');
                  }}
                  className="ciis-modal-register-link"
                >
                  Start 90 Days Free
                </button>
              </p>
              <span className="ciis-modal-security-note">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                256-bit TLS Encrypted · Enterprise Security
              </span>
            </div>
          </>
        )}

        {/* VIEW 2: 2FA / LOGIN OTP */}
        {view === 'otp' && (
          <>
            <button
              type="button"
              onClick={() => {
                setView('login');
                setErrors({});
              }}
              className="ciis-modal-back-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back to Credentials
            </button>

            <div className="ciis-modal-header">
              <span className="ciis-modal-badge">Two-Factor Authentication</span>
              <h2 className="ciis-modal-title">Verify Your Identity</h2>
              <p className="ciis-modal-subtitle">
                Enter the 6-digit code sent to <strong>{otpEmail}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="ciis-modal-form">
              <div className="ciis-modal-field">
                <label className="ciis-modal-label">6-Digit Verification Code</label>
                <div className={`ciis-modal-input-wrap ${errors.otp ? 'has-error' : ''}`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setErrors({});
                    }}
                    placeholder="000000"
                    className="ciis-modal-input ciis-modal-otp-input"
                    autoFocus
                    required
                  />
                </div>
                {errors.otp && <span className="ciis-modal-error-text">{errors.otp}</span>}
              </div>

              <div className="ciis-modal-resend-row">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp || loading}
                  className="ciis-modal-resend-btn"
                >
                  {canResendOtp ? 'Resend code now' : `Resend code in ${otpTimer}s`}
                </button>
              </div>

              <button
                type="submit"
                className="ciis-modal-submit-btn"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <div className="ciis-modal-spinner" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify & Sign In</span>
                )}
              </button>
            </form>
          </>
        )}

        {/* VIEW 3: FORGOT PASSWORD (EMAIL INPUT) */}
        {view === 'forgot_email' && (
          <>
            <button
              type="button"
              onClick={() => {
                setView('login');
                setErrors({});
              }}
              className="ciis-modal-back-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back to Sign In
            </button>

            <div className="ciis-modal-header">
              <span className="ciis-modal-badge">Password Recovery</span>
              <h2 className="ciis-modal-title">Reset Your Password</h2>
              <p className="ciis-modal-subtitle">
                Enter your registered email address to receive an OTP reset code.
              </p>
            </div>

            <form onSubmit={handleSendForgotOtp} className="ciis-modal-form">
              <div className="ciis-modal-field">
                <label className="ciis-modal-label">Company Code</label>
                <div className="ciis-modal-input-wrap">
                  <span className="ciis-modal-field-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={form.companyCode}
                    onChange={(e) => setForm(p => ({ ...p, companyCode: e.target.value }))}
                    placeholder="Enter company code"
                    className="ciis-modal-input"
                  />
                </div>
              </div>

              <div className="ciis-modal-field">
                <label className="ciis-modal-label">Registered Email</label>
                <div className={`ciis-modal-input-wrap ${errors.forgotEmail ? 'has-error' : ''}`}>
                  <span className="ciis-modal-field-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setErrors({});
                    }}
                    placeholder="name@company.com"
                    className="ciis-modal-input"
                    autoFocus
                    required
                  />
                </div>
                {errors.forgotEmail && <span className="ciis-modal-error-text">{errors.forgotEmail}</span>}
              </div>

              <button
                type="submit"
                className="ciis-modal-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="ciis-modal-spinner" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Reset Code</span>
                )}
              </button>
            </form>
          </>
        )}

        {/* VIEW 4: FORGOT PASSWORD (OTP + NEW PASSWORD) */}
        {view === 'forgot_reset' && (
          <>
            <button
              type="button"
              onClick={() => {
                setView('forgot_email');
                setErrors({});
              }}
              className="ciis-modal-back-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back
            </button>

            <div className="ciis-modal-header">
              <span className="ciis-modal-badge">New Password</span>
              <h2 className="ciis-modal-title">Create New Password</h2>
              <p className="ciis-modal-subtitle">
                Enter the code sent to <strong>{forgotEmail}</strong> and your new password.
              </p>
            </div>

            {errors.resetGeneral && (
              <div className="ciis-modal-alert">
                <svg className="ciis-modal-alert-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>{errors.resetGeneral}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="ciis-modal-form">
              <div className="ciis-modal-field">
                <label className="ciis-modal-label">6-Digit Reset Code</label>
                <div className={`ciis-modal-input-wrap ${errors.resetOtp ? 'has-error' : ''}`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={resetOtp}
                    onChange={(e) => {
                      setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setErrors({});
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="ciis-modal-input ciis-modal-otp-input"
                    autoFocus
                    required
                  />
                </div>
                {errors.resetOtp && <span className="ciis-modal-error-text">{errors.resetOtp}</span>}
              </div>

              <div className="ciis-modal-field">
                <label className="ciis-modal-label">New Password</label>
                <div className={`ciis-modal-input-wrap ${errors.newPassword ? 'has-error' : ''}`}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="ciis-modal-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="ciis-modal-input-toggle"
                  >
                    {showNewPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.newPassword && <span className="ciis-modal-error-text">{errors.newPassword}</span>}
              </div>

              <div className="ciis-modal-field">
                <label className="ciis-modal-label">Confirm New Password</label>
                <div className={`ciis-modal-input-wrap ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="ciis-modal-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="ciis-modal-input-toggle"
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <span className="ciis-modal-error-text">{errors.confirmPassword}</span>}
              </div>

              <button
                type="submit"
                className="ciis-modal-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="ciis-modal-spinner" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Reset Password & Sign In</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
