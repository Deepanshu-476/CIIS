import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { toast } from 'react-toastify';
import './Login.css'; 

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

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [companyDetails, setCompanyDetails] = useState(null);
  const [companyIdentifier, setCompanyIdentifier] = useState('');
  
  
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); 
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const { setUser, setToken, setIsAuthenticated } = useAuth();

  
  useEffect(() => {
    const extractCompanyIdentifier = () => {
      const path = window.location.pathname;
      
      const match1 = path.match(/\/company\/([^/]+)\/login/);
      if (match1 && match1[1]) {
        return match1[1];
      }

      const match2 = path.match(/\/company\/([^/]+)/);
      if (match2 && match2[1]) {
        return match2[1];
      }

      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 2 && segments[0] === 'company') {
        return segments[1];
      }

      return null;
    };

    const identifier = extractCompanyIdentifier();
    if (identifier) {
      setCompanyIdentifier(identifier);
      fetchCompanyDetails(identifier);
    } else {
      setCompanyLoading(false);
    }
  }, []);

  
  useEffect(() => {
    let timer;
    if (showOtpPopup && otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [showOtpPopup, otpTimer]);

  
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchCompanyDetails = async (identifier) => {
    try {
      setCompanyLoading(true);
      const response = await axios.get(`/company/details/${identifier}`, { _skipErrorNotify: true });

      if (response.data.success) {
        setCompanyDetails(response.data.company);
        document.title = `${response.data.company.companyName} - Login`;
      }
    } catch (error) {
      console.error('Error fetching company details:', error);

      if (error.response?.status === 404) {
        toast.error('Company not found. Please check the URL.');
      } else if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'Company account is not active');
      }

      setCompanyDetails({
        companyName: 'CIIS NETWORK',
        logo: null
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      
      const loginData = {
        email: form.email.trim(),
        password: form.password,
        companyCode: companyIdentifier || null
      };

      void 0;

      const loginEndpoint = companyIdentifier
        ? getCompanyAuthPath(companyIdentifier, 'login')
        : '/auth/login';
      const res = await axios.post(loginEndpoint, loginData, { _skipErrorNotify: true });

      
      if (res.data.requiresOTP) {
        
        setOtpEmail(res.data.email);
        setTempToken(res.data.tempToken);
        setShowOtpPopup(true);
        setOtpTimer(60);
        setCanResend(false);
        setOtp('');
        setOtpError('');
        
        toast.info('OTP sent to your email. Please verify to continue.');
        return;
      }

      
      clearPreviousLoginStorage();
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken?.(res.data.token);
      }

      if (res.data.user) {
        const userData = res.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
      }

      if (res.data.client) {
        localStorage.setItem('client', JSON.stringify(res.data.client));
      } else {
        localStorage.removeItem('client');
      }

      if (companyIdentifier) {
        localStorage.setItem('companyIdentifier', companyIdentifier);
        localStorage.setItem('companyCode', companyIdentifier);
      }

      if (companyDetails) {
        localStorage.setItem('companyDetails', JSON.stringify(companyDetails));
      }

      toast.success("Login successful!");

      const companyRole = String(res.data.user?.companyRole || '').toLowerCase();
      const userRole = String(res.data.user?.role || '').toLowerCase();
      let redirectPath = '/ciisUser/user-dashboard';

      if (companyRole === 'client') {
        redirectPath = '/client/dashboard';
      } else if (res.data.redirectTo) {
        redirectPath = res.data.redirectTo;
      } else if (userRole === 'admin') {
        redirectPath = '/admin/dashboard';
      }

      void 0;
      navigate(redirectPath);
      
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          data: err.config?.data
        }
      });

      let errorMsg = 'Login failed. Please try again.';

      if (err.response?.data) {
        const { errorCode, message } = err.response.data;

        if (message) errorMsg = message;

        switch (errorCode) {
          case 'ACCOUNT_LOCKED':
            errorMsg = 'Account locked. Please try again later.';
            break;
          case 'ACCOUNT_DEACTIVATED':
            errorMsg = 'Your account has been deactivated. Contact your administrator.';
            break;
          case 'SUBSCRIPTION_EXPIRED':
            errorMsg = 'Company subscription has expired. Contact your company admin.';
            break;
          case 'INVALID_CREDENTIALS':
            errorMsg = 'Invalid email or password.';
            break;
          case 'COMPANY_NOT_FOUND':
            errorMsg = 'Company not found. Please check your URL.';
            break;
          default:
            if (err.response.status === 401) {
              errorMsg = 'Invalid credentials. Please check your email and password.';
            }
            break;
        }
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Network error. Please check your connection.';
      }

      toast.error(errorMsg);
      setErrors((prev) => ({ ...prev, general: errorMsg }));
      
    } finally {
      setLoading(false);
    }
  };

  
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setOtpError('');
  };

  
  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
    const otpString = otp.trim();
    
    if (otpString.length !== 6) {
      setOtpError('Please enter complete 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const verifyEndpoint = companyIdentifier
        ? getCompanyAuthPath(companyIdentifier, 'verifyOtp')
        : '/auth/verify-login-otp';
      const response = await axios.post(verifyEndpoint, {
        email: otpEmail,
        otp: otpString,
        tempToken: tempToken
      }, { _skipErrorNotify: true });

      if (response.data.success) {
        
        clearPreviousLoginStorage();
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setToken?.(response.data.token);
        }

        if (response.data.user) {
          const userData = response.data.user;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          setIsAuthenticated(true);
        }

        if (response.data.client) {
          localStorage.setItem('client', JSON.stringify(response.data.client));
        } else {
          localStorage.removeItem('client');
        }

        
        if (companyIdentifier) {
          localStorage.setItem('companyIdentifier', companyIdentifier);
          localStorage.setItem('companyCode', companyIdentifier);
        }

        if (response.data.companyDetails) {
          localStorage.setItem('companyDetails', JSON.stringify(response.data.companyDetails));
        } else if (companyDetails) {
          localStorage.setItem('companyDetails', JSON.stringify(companyDetails));
        }

        
        setShowOtpPopup(false);
        
        toast.success('Login successful!');

        
        const companyRole = String(response.data.user?.companyRole || '').toLowerCase();
        const userRole = String(response.data.user?.role || '').toLowerCase();
        let redirectPath = '/ciisUser/user-dashboard';

        if (companyRole === 'client') {
          redirectPath = '/client/dashboard';
        } else if (response.data.redirectTo) {
          redirectPath = response.data.redirectTo;
        } else if (userRole === 'admin') {
          redirectPath = '/admin/dashboard';
        }
        
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError(error.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp('');
    } finally {
      setOtpLoading(false);
    }
  };

  
  const handleResendOtp = async () => {
    setOtpLoading(true);
    
    try {
      const resendEndpoint = companyIdentifier
        ? getCompanyAuthPath(companyIdentifier, 'resendOtp')
        : '/auth/resend-login-otp';
      const response = await axios.post(resendEndpoint, {
        email: otpEmail
      }, { _skipErrorNotify: true });

      if (response.data.success) {
        setTempToken(response.data.tempToken);
        setOtpTimer(60);
        setCanResend(false);
        setOtp('');
        setOtpError('');
        toast.success('OTP resent successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  
  const handleCloseOtpPopup = () => {
    setShowOtpPopup(false);
    setOtp('');
    setOtpError('');
    setOtpTimer(60);
    setCanResend(false);
    setOtpEmail('');
    setTempToken('');
  };

  
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setErrors({ forgotPassword: 'Email is required' });
      return;
    }

    setLoading(true);

    try {
      const resetContext = companyIdentifier ? { companyCode: companyIdentifier } : {};
      const response = await axios.post('/auth/forgot-password', {
        email: forgotPasswordEmail,
        ...resetContext
      }, { _skipErrorNotify: true });

      if (response.data.success) {
        toast.success(response.data.devOtp
          ? `OTP generated: ${response.data.devOtp}`
          : 'OTP sent to your email!');
        setForgotPasswordStep('reset');
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: 'Enter valid 6-digit OTP' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrors({ newPassword: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const resetContext = companyIdentifier ? { companyCode: companyIdentifier } : {};
      await axios.post('/auth/reset-password', {
        email: forgotPasswordEmail,
        otp: otpCode,
        newPassword: newPassword,
        ...resetContext
      }, { _skipErrorNotify: true });

      toast.success("Password reset successful!");

      setShowForgotPassword(false);
      setForgotPasswordStep('email');

    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotPasswordEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  
  const VisibilityIcon = () => (
    <svg className="login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  );

  const VisibilityOffIcon = () => (
    <svg className="login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    </svg>
  );

  const LoginIcon = () => (
    <svg className="login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 7L9.6 8.4 12.2 11H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
    </svg>
  );

  const LockIcon = () => (
    <svg className="login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  );

  const EmailIcon = () => (
    <svg className="login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
    </svg>
  );

  const BusinessIcon = () => (
    <svg className="login-icon business-icon" width="48" height="48" viewBox="0 0 24 24" fill="white">
      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
    </svg>
  );

  const ArrowBackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  );

  const renderLoginOtpForm = () => (
    <div className="login-otp-form">
      <div className="form-header">
        <h2 className="form-title">
          Verify OTP
        </h2>
        <p className="form-subtitle">
          We've sent a 6-digit code to {otpEmail || form.email}
        </p>
      </div>

      <form onSubmit={handleVerifyOtp}>
        <div className="input-group">
          <label className="input-label">6-Digit OTP</label>
          <div className="input-container">
            <div className="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <input
              type="text"
              name="otp"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="6"
              value={otp}
              onChange={handleOtpChange}
              disabled={otpLoading}
              className={`login-input ${otpError ? 'input-error' : ''}`}
              placeholder="Enter 6-digit OTP"
              autoFocus
            />
          </div>
          {otpError && <span className="error-text">{otpError}</span>}
        </div>

        <div className="login-resend-container">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={!canResend || otpLoading}
            className="login-resend-button"
          >
            {canResend ? 'Resend OTP' : `Resend OTP in ${otpTimer}s`}
          </button>
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={otpLoading || otp.length !== 6}
        >
          {otpLoading ? (
            <>
              <div className="button-icon">
                <div className="spinner small"></div>
              </div>
              Verifying...
            </>
          ) : (
            <>
              <div className="button-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              Verify OTP
            </>
          )}
        </button>

        <div className="login-link-text">
          <button
            type="button"
            onClick={handleCloseOtpPopup}
            className="login-link-button"
            disabled={otpLoading}
          >
            ← Back to Login
          </button>
        </div>
      </form>
    </div>
  );

  const renderForgotPasswordForm = () => {
    switch (forgotPasswordStep) {
      case 'email':
        return (
          <div className="forgot-password-form">
            <div className="back-button-container">
              <button
                onClick={handleBackToLogin}
                className="back-button"
              >
                <ArrowBackIcon />
                Back to Login
              </button>
            </div>

            <h3 className="forgot-password-title">Forgot Password?</h3>
            <p className="forgot-password-subtitle">
              Enter your email address and we'll send you an OTP to reset your password.
            </p>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-container">
                <div className="input-icon">
                  <EmailIcon />
                </div>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  disabled={loading}
                  className={`login-input ${errors.forgotPassword ? 'input-error' : ''}`}
                  placeholder="Enter your registered email"
                />
              </div>
              {errors.forgotPassword && <span className="error-text">{errors.forgotPassword}</span>}
            </div>

            <button
              onClick={handleForgotPassword}
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        );

      case 'reset':
        return (
          <div className="forgot-password-form">
            <div className="back-button-container">
              <button
                onClick={() => setForgotPasswordStep('email')}
                className="back-button"
              >
                <ArrowBackIcon />
                Back
              </button>
            </div>

            <h3 className="forgot-password-title">Reset Password</h3>
            <p className="forgot-password-subtitle">
              Create a new password for your account
            </p>

            <div className="input-group">
              <label className="input-label">6-Digit OTP</label>
              <div className="input-container">
                <div className="input-icon">
                  <LockIcon />
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  className={`login-input ${errors.otp ? 'input-error' : ''}`}
                  placeholder="Enter 6-digit OTP"
                />
              </div>
              {errors.otp && <span className="error-text">{errors.otp}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">New Password</label>
              <div className="input-container">
                <div className="input-icon">
                  <LockIcon />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className={`login-input ${errors.newPassword ? 'input-error' : ''}`}
                  placeholder="Enter new password"
                />
                <div 
                  className="input-adornment"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </div>
              </div>
              {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-container">
                <div className="input-icon">
                  <LockIcon />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className={`login-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm new password"
                />
                <div 
                  className="input-adornment"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </div>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            {errors.reset && (
              <div className="error-message">
                {errors.reset}
              </div>
            )}

            <button
              onClick={handleResetPassword}
              className="primary-button"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-paper fade-in">
        
        <div className="login-left-section">
          <div className="left-pattern"></div>
          
          <div className="left-content">
            
            <div className="logo-container" onClick={() => navigate('/dashboard')} title="Go to Dashboard">
              {companyLoading ? (
                <div className="loading-spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : companyDetails?.logo ? (
                <img 
                  src={companyDetails.logo} 
                  alt={companyDetails.companyName} 
                  className="company-logo"
                />
              ) : (
                <BusinessIcon />
              )}
            </div>

            
            <h1 className="company-name">
              {companyLoading ? 'Loading...' : (companyDetails?.companyName || 'CIIS NETWORK')}
            </h1>

            <p className="company-subtitle">
              Secure Enterprise Portal
            </p>
          </div>
        </div>

        
        <div className="login-right-section">
          <div className="form-container">
            
            
            <div className="mobile-logo-container">
              <div className="mobile-logo-wrapper">
                {companyLoading ? (
                  <div className="loading-spinner-container">
                    <div className="spinner small"></div>
                  </div>
                ) : companyDetails?.logo ? (
                  <img 
                    src={companyDetails.logo} 
                    alt={companyDetails?.companyName || 'Company Logo'} 
                    className="mobile-logo-img"
                  />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#4f46e5">
                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                  </svg>
                )}
              </div>
              
              <h2 className="mobile-company-name">
                {companyLoading ? 'Loading...' : (companyDetails?.companyName || 'CIIS NETWORK')}
              </h2>
              
              <p className="mobile-company-subtitle">
                Secure Enterprise Portal
              </p>
            </div>
            

            {showForgotPassword ? (
              
              renderForgotPasswordForm()
            ) : showOtpPopup ? (
              
              renderLoginOtpForm()
            ) : (
              
              <>
                
                <div className="form-header">
                  <h2 className="form-title">
                    Welcome Back
                  </h2>
                  <p className="form-subtitle">
                    Sign in to your account
                  </p>
                </div>

                
                {errors.general && (
                  <div className="error-alert">
                    <div className="error-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f2120">
                        <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                      </svg>
                    </div>
                    {errors.general}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className="input-container">
                      <div className="input-icon">
                        <EmailIcon />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        disabled={loading}
                        autoComplete="email"
                        className={`login-input ${errors.email ? 'input-error' : ''}`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  
                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <div className="input-container">
                      <div className="input-icon">
                        <LockIcon />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        disabled={loading}
                        autoComplete="current-password"
                        className={`login-input ${errors.password ? 'input-error' : ''}`}
                        placeholder="Enter your password"
                      />
                      <div 
                        className="input-adornment"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </div>
                    </div>
                    {errors.password && <span className="error-text">{errors.password}</span>}
                  </div>

                  
                  <div className="forgot-password-link">
                    <span
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </span>
                  </div>

                  
                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="button-icon">
                          <div className="spinner small"></div>
                        </div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <div className="button-icon">
                          <LoginIcon />
                        </div>
                        Sign In
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            
            {!showForgotPassword && !showOtpPopup && (
              <div className="terms-privacy">
                By signing in, you agree to our{' '}
                <a href="#" className="terms-link">Terms of Service</a> and{' '}
                <a href="#" className="terms-link">Privacy Policy</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
