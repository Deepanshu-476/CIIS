import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const navigate = useNavigate();
  
  
  const [step, setStep] = useState('email'); 
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  
  const VisibilityIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  );

  const VisibilityOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    </svg>
  );

  const EmailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
    </svg>
  );

  const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  );

  const ArrowBackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="#4caf50">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await axios.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        toast.success('OTP sent to your email!');
        setStep('reset');
        setCountdown(60); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
      setErrors({ general: error.response?.data?.message || 'Failed to send OTP' });
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
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await axios.post('/auth/reset-password', {
        email: email,
        otp: otpCode,
        newPassword: newPassword
      });

      if (response.data.success) {
        setSuccessMessage('Password changed successfully! You can now login with your new password.');
        
        
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setStep('success'); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      setErrors({ general: error.response?.data?.message || 'Invalid OTP or expired' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setSuccessMessage('');
    
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        toast.success('New OTP sent to your email!');
        setCountdown(60); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setSuccessMessage('');
  };

  const handleTryAgain = () => {
    setStep('email');
    setEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setSuccessMessage('');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  
  const renderContent = () => {
    
    if (step === 'success') {
      return (
        <>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ marginBottom: '20px' }}>
              <CheckCircleIcon />
            </div>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
              Password Changed Successfully!
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              {successMessage}
            </Typography>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={handleTryAgain}
              className="ciis-login-secondary-button"
              style={{ padding: '12px 24px' }}
            >
              Change Another Password
            </button>
            <button
              onClick={handleGoToLogin}
              className="ciis-login-primary-button"
              style={{ padding: '12px 24px' }}
            >
              Go to Login
            </button>
          </div>
        </>
      );
    }

    switch (step) {
      case 'email':
        return (
          <>
            <div style={{ marginBottom: '32px' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
                Change Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Enter your email address and we'll send you an OTP to reset your password.
              </Typography>
            </div>

            {errors.general && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.general}
              </Alert>
            )}

            <div className="ciis-login-input-group" style={{ marginBottom: '24px' }}>
              <label className="ciis-login-input-label">Email Address</label>
              <div className="ciis-login-input-container">
                <div className="ciis-login-input-icon">
                  <EmailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  disabled={loading}
                  className={`ciis-login-input ${errors.email ? 'ciis-login-input-error' : ''}`}
                  placeholder="Enter your registered email"
                />
              </div>
              {errors.email && <span className="ciis-login-error-text">{errors.email}</span>}
            </div>

            <button
              onClick={handleSendOTP}
              className="ciis-login-primary-button"
              disabled={loading}
              style={{ width: '100%', padding: '14px' }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                Back to Login
              </button>
            </div>
          </>
        );

      case 'reset':
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <button
                onClick={handleBackToEmail}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                <ArrowBackIcon />
                Back
              </button>
            </div>

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
              Create a new password for your account
            </Typography>

            {errors.general && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.general}
              </Alert>
            )}

            {/* OTP Input */}
            <div className="ciis-login-input-group" style={{ marginBottom: '20px' }}>
              <label className="ciis-login-input-label">6-Digit OTP</label>
              <div className="ciis-login-input-container">
                <div className="ciis-login-input-icon">
                  <LockIcon />
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (errors.otp) setErrors({ ...errors, otp: '' });
                  }}
                  disabled={loading}
                  className={`ciis-login-input ${errors.otp ? 'ciis-login-input-error' : ''}`}
                  placeholder="Enter 6-digit OTP"
                />
              </div>
              {errors.otp && <span className="ciis-login-error-text">{errors.otp}</span>}
              
              {/* Resend OTP */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: countdown > 0 ? '#999' : '#667eea',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="ciis-login-input-group" style={{ marginBottom: '20px' }}>
              <label className="ciis-login-input-label">New Password</label>
              <div className="ciis-login-input-container">
                <div className="ciis-login-input-icon">
                  <LockIcon />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                  }}
                  disabled={loading}
                  className={`ciis-login-input ${errors.newPassword ? 'ciis-login-input-error' : ''}`}
                  placeholder="Enter new password"
                />
                <div 
                  className="ciis-login-input-adornment"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </div>
              </div>
              {errors.newPassword && <span className="ciis-login-error-text">{errors.newPassword}</span>}
            </div>

            {/* Confirm Password */}
            <div className="ciis-login-input-group" style={{ marginBottom: '24px' }}>
              <label className="ciis-login-input-label">Confirm Password</label>
              <div className="ciis-login-input-container">
                <div className="ciis-login-input-icon">
                  <LockIcon />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  disabled={loading}
                  className={`ciis-login-input ${errors.confirmPassword ? 'ciis-login-input-error' : ''}`}
                  placeholder="Confirm new password"
                />
                <div 
                  className="ciis-login-input-adornment"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </div>
              </div>
              {errors.confirmPassword && <span className="ciis-login-error-text">{errors.confirmPassword}</span>}
            </div>

            <button
              onClick={handleResetPassword}
              className="ciis-login-primary-button"
              disabled={loading || !otpCode || otpCode.length !== 6 || !newPassword || !confirmPassword}
              style={{ width: '100%', padding: '14px' }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </>
        );

      default:
        return null;
    }
  };

  // Styles (same as in Login component)
  const styles = `
    .ciis-login-input-group {
      margin-bottom: 16px;
    }

    .ciis-login-input-label {
      display: block;
      margin-bottom: 6px;
      color: #333;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .ciis-login-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .ciis-login-input {
      width: 100%;
      padding: 12px 16px;
      padding-left: 40px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .ciis-login-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    .ciis-login-input-error {
      border-color: #f44336;
    }

    .ciis-login-input-error:focus {
      border-color: #f44336;
      box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
    }

    .ciis-login-input-icon {
      position: absolute;
      left: 12px;
      color: #777;
    }

    .ciis-login-input-adornment {
      position: absolute;
      right: 12px;
      cursor: pointer;
      color: #777;
    }

    .ciis-login-error-text {
      color: #f44336;
      font-size: 0.75rem;
      margin-top: 4px;
      display: block;
    }

    .ciis-login-primary-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4);
    }

    .ciis-login-primary-button:hover:not(:disabled) {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a3a9a 100%);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .ciis-login-primary-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .ciis-login-secondary-button {
      background: transparent;
      border: 1px solid #667eea;
      color: #667eea;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .ciis-login-secondary-button:hover {
      background-color: rgba(102, 126, 234, 0.1);
    }
  `;

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <style>{styles}</style>
      <Paper elevation={4} sx={{ p: 4, borderRadius: '16px' }}>
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default ChangePassword;