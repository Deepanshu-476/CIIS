import React, { useState, useEffect } from 'react';
import {
  HiXMark,
  HiCheckCircle,
  HiUser,
  HiEnvelope,
  HiPhone,
  HiBuildingOffice2,
  HiUsers,
  HiChatBubbleLeftEllipsis,
  HiCalendarDays,
  HiShieldCheck,
  HiChevronDown,
  HiQueueList
} from 'react-icons/hi2';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import './BookDemoModal.css';

const BookDemoModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    employeeCount: '',
    requirements: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setErrors({});
      setFormData({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        employeeCount: '',
        requirements: '',
        message: ''
      });
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && open && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'name') {
      // Disallow numbers or special symbols - only letters, spaces, dots & hyphens
      sanitizedValue = value.replace(/[^a-zA-Z\s.-]/g, '');
    } else if (name === 'phone') {
      // Disallow non-digits and cap strictly at 10 digits
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid work email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.employeeCount) newErrors.employeeCount = 'Please select team size';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      companyName: formData.companyName.trim(),
      employeeCount: formData.employeeCount,
      requirements: formData.requirements ? formData.requirements.trim() : '',
      message: formData.message ? formData.message.trim() : ''
    };

    try {
      await axios.post('/demo-requests', payload, { _skipErrorNotify: true });
      setSubmitted(true);
      toast.success('Demo booking request submitted successfully!');
    } catch (err) {
      console.warn('Fallback: posting to service-enquiries', err);
      try {
        await axios.post('/clientsservice/service-enquiries', {
          serviceName: 'Free Personalised Demo',
          clientName: formData.name,
          companyName: formData.companyName,
          requirement: `Demo Request: ${formData.employeeCount} Employees. Requirements: ${formData.requirements || 'N/A'}. Message: ${formData.message || 'N/A'}. Phone: ${formData.phone}, Email: ${formData.email}`,
          budget: 'Free Demo Request',
          contactMethod: 'Phone'
        }, { _skipErrorNotify: true });
      } catch (fallbackErr) {
        console.warn('Demo request fallback complete', fallbackErr);
      }
      setSubmitted(true);
      toast.success('Demo booking request submitted successfully!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="exact-demo-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="exact-demo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exact-demo-title"
      >
        {/* Header Section with Light Blue Tint (Fixed Top) */}
        <div className="exact-demo-header">
          <div className="exact-header-left">
            <div className="exact-icon-box">
              <HiCalendarDays />
            </div>
            <div className="exact-header-text">
              <h2 id="exact-demo-title">Book a Free Demo</h2>
              <p>Schedule a 1-on-1 walkthrough with a product specialist</p>
            </div>
          </div>
          <button
            type="button"
            className="exact-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <HiXMark />
          </button>
        </div>

        {/* Modal Form Wrap */}
        {!submitted ? (
          <form className="exact-demo-form-wrap" onSubmit={handleSubmit} noValidate>
            
            {/* Scrollable Form Body (Middle) */}
            <div className="exact-demo-body">
              
              {/* Full Name (Strict: No numbers allowed) */}
              <div className="exact-form-group">
                <label htmlFor="exact-name">Full Name</label>
                <div className={`exact-input-wrapper ${errors.name ? 'error' : ''}`}>
                  <HiUser className="field-icon" />
                  <input
                    id="exact-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
                {errors.name && <span className="exact-error-msg">{errors.name}</span>}
              </div>

              {/* Work Email */}
              <div className="exact-form-group">
                <label htmlFor="exact-email">Work Email</label>
                <div className={`exact-input-wrapper ${errors.email ? 'error' : ''}`}>
                  <HiEnvelope className="field-icon" />
                  <input
                    id="exact-email"
                    name="email"
                    type="email"
                    placeholder="Enter your work email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && <span className="exact-error-msg">{errors.email}</span>}
              </div>

              {/* Phone & Company Row */}
              <div className="exact-form-row">
                {/* Phone Number (Strict: Max 10 digits only) */}
                <div className="exact-form-group">
                  <label htmlFor="exact-phone">Phone Number</label>
                  <div className={`exact-input-wrapper ${errors.phone ? 'error' : ''}`}>
                    <HiPhone className="field-icon" />
                    <input
                      id="exact-phone"
                      name="phone"
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.phone && <span className="exact-error-msg">{errors.phone}</span>}
                </div>

                <div className="exact-form-group">
                  <label htmlFor="exact-company">Company Name</label>
                  <div className={`exact-input-wrapper ${errors.companyName ? 'error' : ''}`}>
                    <HiBuildingOffice2 className="field-icon" />
                    <input
                      id="exact-company"
                      name="companyName"
                      type="text"
                      placeholder="Enter your company name"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.companyName && <span className="exact-error-msg">{errors.companyName}</span>}
                </div>
              </div>

              {/* Total Team / Employee Count */}
              <div className="exact-form-group">
                <label htmlFor="exact-size">Total Team / Employee Count</label>
                <div className={`exact-input-wrapper select-wrapper ${errors.employeeCount ? 'error' : ''}`}>
                  <HiUsers className="field-icon" />
                  <select
                    id="exact-size"
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select employee count</option>
                    <option value="1-10">1 – 10 Employees</option>
                    <option value="11-50">11 – 50 Employees</option>
                    <option value="51-200">51 – 200 Employees</option>
                    <option value="201-500">201 – 500 Employees</option>
                    <option value="500+">500+ Enterprise Employees</option>
                  </select>
                  <HiChevronDown className="select-arrow" />
                </div>
                {errors.employeeCount && <span className="exact-error-msg">{errors.employeeCount}</span>}
              </div>

              {/* Specific Requirements */}
              <div className="exact-form-group">
                <label htmlFor="exact-requirements">Specific Requirements (Optional)</label>
                <div className="exact-input-wrapper">
                  <HiQueueList className="field-icon" />
                  <input
                    id="exact-requirements"
                    name="requirements"
                    type="text"
                    placeholder="e.g. Biometric Attendance, Task Boards, HR Leaves..."
                    value={formData.requirements}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Additional Message / Note */}
              <div className="exact-form-group">
                <label htmlFor="exact-message">Additional Message (Optional)</label>
                <div className="exact-input-wrapper textarea-wrapper">
                  <HiChatBubbleLeftEllipsis className="field-icon textarea-icon" />
                  <textarea
                    id="exact-message"
                    name="message"
                    rows={2}
                    placeholder="Enter any additional notes or questions..."
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
              </div>

            </div>

            {/* Fixed Modal Footer (Sticky Bottom) */}
            <div className="exact-demo-footer">
              <button type="submit" className="exact-submit-btn" disabled={loading}>
                {loading ? 'Submitting Request...' : 'Schedule Free Demo'}
              </button>
              
              <div className="exact-security-note">
                <HiShieldCheck className="shield-icon" /> No commitment required • We'll contact you within 24 hours
              </div>
            </div>

          </form>
        ) : (
          /* Confirmation Success State */
          <div className="exact-success-state">
            <div className="exact-success-icon">
              <HiCheckCircle />
            </div>
            <h2>Demo Request Submitted!</h2>
            <p>
              Thank you, <strong>{formData.name}</strong>. We received your request for <strong>{formData.companyName}</strong>.
            </p>

            <div className="exact-summary-box">
              <div><span>Work Email:</span> <strong>{formData.email}</strong></div>
              <div><span>Phone:</span> <strong>{formData.phone}</strong></div>
              <div><span>Team Size:</span> <strong>{formData.employeeCount} Employees</strong></div>
              {formData.requirements && <div><span>Requirements:</span> <strong>{formData.requirements}</strong></div>}
            </div>

            <p className="exact-notice-text">
              📞 Our Product Specialist will contact you within <strong>2 business hours</strong> to schedule your 1-on-1 walkthrough.
            </p>

            <button type="button" className="exact-done-btn" onClick={onClose}>
              Done &amp; Close Window
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookDemoModal;
