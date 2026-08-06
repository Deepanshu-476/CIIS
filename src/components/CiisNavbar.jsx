import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiX } from 'react-icons/fi';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/useAuth';
import { toast } from 'react-toastify';
import './CiisNavbar.css';

const CiisNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ companyCode: '', email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [otpState, setOtpState] = useState({ required: false, value: '', email: '', tempToken: '' });
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setToken, setIsAuthenticated } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!showLogin) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setShowLogin(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showLogin]);

  const updateLoginField = ({ target: { name, value } }) => {
    setLoginForm((current) => ({ ...current, [name]: value }));
    setLoginErrors((current) => ({ ...current, [name]: '' }));
  };

  const completeLogin = (data, companyCode) => {
    ['token','user','superAdmin','company','companyDetails','companyIdentifier','companyCode','client','sidebarConfig'].forEach((key) => localStorage.removeItem(key));
    if (data.token) { localStorage.setItem('token', data.token); setToken?.(data.token); }
    if (data.user) { localStorage.setItem('user', JSON.stringify(data.user)); setUser(data.user); setIsAuthenticated(true); }
    if (data.client) localStorage.setItem('client', JSON.stringify(data.client));
    if (data.companyDetails) localStorage.setItem('companyDetails', JSON.stringify(data.companyDetails));
    localStorage.setItem('companyIdentifier', companyCode);
    localStorage.setItem('companyCode', companyCode);
    const companyRole = String(data.user?.companyRole || '').toLowerCase();
    const userRole = String(data.user?.role || '').toLowerCase();
    const destination = companyRole === 'client' ? '/client/dashboard' : data.redirectTo || (userRole === 'admin' ? '/admin/dashboard' : '/ciisUser/user-dashboard');
    setShowLogin(false);
    toast.success('Login successful!');
    navigate(destination);
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    const companyCode = loginForm.companyCode.trim().toUpperCase();
    const email = loginForm.email.trim();
    const errors = {};
    if (!companyCode) errors.companyCode = 'Company code is required';
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (!loginForm.password) errors.password = 'Password is required';
    else if (loginForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (Object.keys(errors).length) return setLoginErrors(errors);

    setLoginLoading(true);
    setLoginErrors({});
    try {
      const response = await axios.post(`/auth/company/${encodeURIComponent(companyCode)}/login`, { email, password: loginForm.password, companyCode }, { _skipErrorNotify: true });
      if (response.data.requiresOTP) {
        setOtpState({ required: true, value: '', email: response.data.email || email, tempToken: response.data.tempToken || '' });
        toast.info('OTP sent to your email.');
      } else {
        completeLogin(response.data, companyCode);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Check your company code and credentials.';
      setLoginErrors({ general: message });
    } finally {
      setLoginLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otpState.value)) return setLoginErrors({ otp: 'Enter the complete 6-digit OTP' });
    const companyCode = loginForm.companyCode.trim().toUpperCase();
    setLoginLoading(true);
    try {
      const response = await axios.post(`/auth/company/${encodeURIComponent(companyCode)}/verify-otp`, { email: otpState.email, otp: otpState.value, tempToken: otpState.tempToken }, { _skipErrorNotify: true });
      completeLogin(response.data, companyCode);
    } catch (error) {
      setLoginErrors({ otp: error.response?.data?.message || 'Invalid OTP. Please try again.' });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">  

        <div className="navbar-brand">
          <Link to="/" className="logo">
            <img src="/logoo.png" alt="Brand Logo" className="logo-img" />
          </Link>
        </div>

        <button 
          className={`menu-toggle ${isOpen ? "active" : ""}`}
          onClick={toggleMenu}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div className={`nav-menu ${isOpen ? "active" : ""}`}>
          <ul className="nav-list">

            <li className="nav-item">
              <Link 
                to="/"
                className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
              >
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                to="/about"
                className={`nav-link ${location.pathname === "/about" ? "active" : ""}`}
              >
                About
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                to="/contact"
                className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}
              >
                Contact
              </Link>
            </li>

          </ul>

          <div className="nav-actions">
            <button type="button" className="user-login-btn" onClick={() => setShowLogin(true)}>Login</button>
            <Link to="/RegisterCompany">
              <button className="login-btn">Register your company</button>
            </Link>
          
          </div>

        </div>

      </div>
      {showLogin && (
        <div className="nav-login-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowLogin(false)}>
          <section className="nav-login-modal" role="dialog" aria-modal="true" aria-labelledby="nav-login-title">
            <button type="button" className="nav-login-close" aria-label="Close login" onClick={() => setShowLogin(false)}><FiX /></button>
            <header><span aria-hidden="true"><FiShield /></span><div><h2 id="nav-login-title">{otpState.required ? 'Verify Your Identity' : 'Welcome Back'}</h2><p>{otpState.required ? 'Enter the Security Code Sent to Your Email' : 'Sign In to Your Company Workspace'}</p></div></header>
            <form onSubmit={otpState.required ? verifyOtp : submitLogin} noValidate>
              {loginErrors.general && <div className="nav-login-alert" role="alert">{loginErrors.general}</div>}
              {!otpState.required ? <>
              <div className="nav-login-control">
                <label htmlFor="nav-company-code">Company Code</label>
                <div className={`nav-login-field ${loginErrors.companyCode ? 'error' : ''}`}><FiBriefcase aria-hidden="true" /><input id="nav-company-code" name="companyCode" value={loginForm.companyCode} onChange={updateLoginField} placeholder="e.g. CAREER" autoComplete="organization" autoCapitalize="characters" autoFocus /></div>
                {loginErrors.companyCode && <small>{loginErrors.companyCode}</small>}
              </div>
              <div className="nav-login-control">
                <label htmlFor="nav-login-email">Email Address</label>
                <div className={`nav-login-field ${loginErrors.email ? 'error' : ''}`}><FiMail aria-hidden="true" /><input id="nav-login-email" name="email" type="email" value={loginForm.email} onChange={updateLoginField} placeholder="you@company.com" autoComplete="email" /></div>
                {loginErrors.email && <small>{loginErrors.email}</small>}
              </div>
              <div className="nav-login-control">
                <div className="nav-login-label-row"><label htmlFor="nav-login-password">Password</label><button type="button" onClick={() => { const code = loginForm.companyCode.trim().toUpperCase(); if (!code) { setLoginErrors({ companyCode: 'Enter your company code first' }); return; } setShowLogin(false); navigate(`/company/${encodeURIComponent(code)}/login`); }}>Forgot Password?</button></div>
                <div className={`nav-login-field ${loginErrors.password ? 'error' : ''}`}><FiLock aria-hidden="true" /><input id="nav-login-password" name="password" type={showPassword ? 'text' : 'password'} value={loginForm.password} onChange={updateLoginField} placeholder="Enter your password" autoComplete="current-password" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div>
                {loginErrors.password && <small>{loginErrors.password}</small>}
              </div>
              <button type="submit" className="nav-login-submit" disabled={loginLoading}>{loginLoading ? 'Signing In...' : 'Sign In to Your Workspace'}</button>
              </> : <div className="nav-login-otp">
                <div className="nav-login-otp-message">
                  <span aria-hidden="true"><FiMail /></span>
                  <p>We Sent a 6-Digit Verification Code to <strong>{otpState.email}</strong></p>
                </div>
                <div className="nav-login-control">
                  <label htmlFor="nav-login-otp">Verification Code</label>
                  <div className={`nav-login-field nav-login-otp-field ${loginErrors.otp ? 'error' : ''}`}><FiLock aria-hidden="true" /><input id="nav-login-otp" aria-label="Six digit verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpState.value} onChange={(event) => { setOtpState((current) => ({ ...current, value: event.target.value.replace(/\D/g, '').slice(0, 6) })); setLoginErrors((current) => ({ ...current, otp: '' })); }} placeholder="000000" autoFocus /></div>
                  {loginErrors.otp && <small role="alert">{loginErrors.otp}</small>}
                </div>
                <button type="submit" className="nav-login-submit" disabled={loginLoading || otpState.value.length !== 6}>{loginLoading ? 'Verifying Code...' : 'Verify & Login'}</button>
                <button type="button" className="nav-login-back" onClick={() => { setOtpState({ required:false,value:'',email:'',tempToken:'' }); setLoginErrors({}); }}>← Back to Password Login</button>
              </div>}
            </form>
            <p className="nav-login-note"><FiShield aria-hidden="true" /> Secure Access to Your Company Workspace</p>
          </section>
        </div>
      )}
    </nav>
  );
};

export default CiisNavbar;
