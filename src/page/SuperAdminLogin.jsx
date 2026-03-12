import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { toast } from 'react-toastify';
import './SuperAdminLogin.css';
import companyLogo from '../../public/logoo.png';

// ==================== OTP POPUP COMPONENT ====================
const OtpPopup = ({ email, tempToken, onClose, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  React.useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-login-otp`, {
        email,
        otp: otpString,
        tempToken
      });

      if (response.data.success) {
        localStorage.setItem('superAdmin', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('company', JSON.stringify(response.data.companyDetails));
        
        toast.success('Login successful!');
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/resend-login-otp`, { email });
      if (response.data.success) {
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        toast.success('OTP resent successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-popup-overlay">
      <div className="otp-popup-container">
        <button className="otp-popup-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        
        <div className="otp-popup-header">
          <div className="otp-popup-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#667eea">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          <h2>Verify OTP</h2>
          <p>Enter the 6-digit code sent to</p>
          <p className="otp-popup-email">{email}</p>
        </div>

        <div className="otp-popup-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-popup-input"
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && <div className="otp-popup-error">{error}</div>}

        <button
          onClick={handleVerify}
          className="otp-popup-verify-btn"
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? (
            <>
              <span className="otp-popup-spinner"></span>
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </button>

        <div className="otp-popup-resend">
          {canResend ? (
            <button 
              onClick={handleResend} 
              className="otp-popup-resend-btn"
              disabled={loading}
            >
              Resend OTP
            </button>
          ) : (
            <p>Resend OTP in <span className="otp-popup-timer">{timer}</span> seconds</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN SUPER ADMIN LOGIN COMPONENT ====================
const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  
  // OTP states
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [tempToken, setTempToken] = useState('');

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
      // ✅ Use superadmin specific route
      const response = await axios.post(`${API_URL}/auth/superadmin/login`, {
        email: form.email.trim(),
        password: form.password
        // No company code needed for superadmin
      });

      // ✅ Check if OTP verification is required
      if (response.data.requiresOTP) {
        setOtpEmail(response.data.email);
        setTempToken(response.data.tempToken);
        setShowOtpPopup(true);
        toast.info('OTP sent to your email. Please verify.');
      } else {
        handleLoginSuccess(response.data);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMsg = 'Login failed. Please try again.';
      
      if (error.response?.data) {
        const { errorCode, message } = error.response.data;
        
        if (message) errorMsg = message;
        
        switch (errorCode) {
          case 'ACCOUNT_LOCKED':
            errorMsg = 'Account locked. Please try again later.';
            break;
          case 'ACCOUNT_DEACTIVATED':
            errorMsg = 'Your account has been deactivated.';
            break;
          case 'INVALID_CREDENTIALS':
            errorMsg = 'Invalid email or password.';
            break;
          default:
            errorMsg = message || 'Login failed';
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMsg);
      setErrors((prev) => ({ ...prev, general: errorMsg }));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    localStorage.setItem('superAdmin', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    localStorage.setItem('company', JSON.stringify(data.companyDetails));
    
    toast.success('Login successful! Redirecting...');
    navigate('/Ciis-network/company-details');
  };

  const handleOtpSuccess = () => {
    setShowOtpPopup(false);
    navigate('/Ciis-network/company-details');
  };

  // ==================== ICON COMPONENTS ====================
  const VisibilityIcon = () => (
    <svg className="ciis-login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  );

  const VisibilityOffIcon = () => (
    <svg className="ciis-login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    </svg>
  );

  const LoginIcon = () => (
    <svg className="ciis-login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 7L9.6 8.4 12.2 11H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
    </svg>
  );

  const LockIcon = () => (
    <svg className="ciis-login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  );

  const EmailIcon = () => (
    <svg className="ciis-login-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
    </svg>
  );

  const DashboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  );

  const PeopleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm8 6h-3v-3c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3h-3v-6h-2v6h-3v-3c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v3H1v2h22v-2zm-4 0h-3v-3h3v3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3z"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  );

  const AnalyticsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  );

  const SecurityIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
    </svg>
  );

  return (
    <div className="ciis-login-container">
      <div className="ciis-login-paper ciis-login-fade-in">
        {/* LEFT SECTION - Super Admin Features */}
        <div className="ciis-login-left">
          <div className="ciis-login-left-pattern"></div>
          
          <div className="ciis-login-left-content">
            <div className="ciis-login-logo-container">
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="ciis-login-company-logo"
              />
            </div>

            <h1 className="ciis-login-company-name">
              CIIS NETWORK
            </h1>

            <p className="ciis-login-company-subtitle">
              Super Admin Portal
            </p>

            <div className="ciis-login-features-card">
              <h3 className="ciis-login-features-title">
                Super Admin Features:
              </h3>
              
              <div className="ciis-login-feature-item">
                <div className="ciis-login-feature-icon"><DashboardIcon /></div>
                <span className="ciis-login-feature-text">📊 Manage all companies</span>
              </div>
              
              <div className="ciis-login-feature-item">
                <div className="ciis-login-feature-icon"><PeopleIcon /></div>
                <span className="ciis-login-feature-text">👥 View all users across companies</span>
              </div>
              
              <div className="ciis-login-feature-item">
                <div className="ciis-login-feature-icon"><SettingsIcon /></div>
                <span className="ciis-login-feature-text">⚙️ System configuration</span>
              </div>
              
              <div className="ciis-login-feature-item">
                <div className="ciis-login-feature-icon"><AnalyticsIcon /></div>
                <span className="ciis-login-feature-text">📈 Analytics and reports</span>
              </div>
              
              <div className="ciis-login-feature-item">
                <div className="ciis-login-feature-icon"><SecurityIcon /></div>
                <span className="ciis-login-feature-text">🔐 Master access control</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION - Login Form */}
        <div className="ciis-login-right">
          <div className="ciis-login-form-container">
            <div className="ciis-login-form-header">
              <div className="ciis-login-form-logo">
                <div className="ciis-login-mobile-logo">
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="ciis-login-mobile-logo-img"
                  />
                </div>
              </div>
              
              <h2 className="ciis-login-form-title">
                CIIS NETWORK
              </h2>
              <p className="ciis-login-form-subtitle">
                Access the master control panel
              </p>
            </div>

            {errors.general && (
              <div className="ciis-login-error-alert">
                <div className="ciis-login-error-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f2120">
                    <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  </svg>
                </div>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="ciis-login-input-group">
                <label className="ciis-login-input-label">Email Address</label>
                <div className="ciis-login-input-container">
                  <div className="ciis-login-input-icon"><EmailIcon /></div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="email"
                    className={`ciis-login-input ${errors.email ? 'ciis-login-input-error' : ''}`}
                    placeholder="Enter super admin email"
                  />
                </div>
                {errors.email && <span className="ciis-login-error-text">{errors.email}</span>}
              </div>

              <div className="ciis-login-input-group">
                <label className="ciis-login-input-label">Password</label>
                <div className="ciis-login-input-container">
                  <div className="ciis-login-input-icon"><LockIcon /></div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="current-password"
                    className={`ciis-login-input ${errors.password ? 'ciis-login-input-error' : ''}`}
                    placeholder="Enter your password"
                  />
                  <div 
                    className="ciis-login-input-adornment"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </div>
                </div>
                {errors.password && <span className="ciis-login-error-text">{errors.password}</span>}
              </div>

              <button
                type="submit"
                className="ciis-login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="ciis-login-button-icon">
                      <div className="ciis-login-spinner"></div>
                    </div>
                    Logging in...
                  </>
                ) : (
                  <>
                    <div className="ciis-login-button-icon"><LoginIcon /></div>
                    Login as Super Admin
                  </>
                )}
              </button>

              <div className="ciis-login-link-text">
                Regular company login?{' '}
                <a href="/" className="ciis-login-link">Go to Home</a>
              </div>
            </form>

            <div className="ciis-login-terms">
              By signing in, you agree to our{' '}
              <a href="#" className="ciis-login-terms-link">Terms of Service</a> and{' '}
              <a href="#" className="ciis-login-terms-link">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Popup */}
      {showOtpPopup && (
        <OtpPopup
          email={otpEmail}
          tempToken={tempToken}
          onClose={() => setShowOtpPopup(false)}
          onSuccess={handleOtpSuccess}
        />
      )}
    </div>
  );
};

export default SuperAdminLogin;