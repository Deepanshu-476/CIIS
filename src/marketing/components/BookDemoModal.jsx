import React, { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../../utils/scrollLock';
import './BookDemoModal.css';

// Custom event names for global trigger
const OPEN_DEMO_MODAL_EVENT = 'ciis:open-book-demo-modal';
const CLOSE_DEMO_MODAL_EVENT = 'ciis:close-book-demo-modal';

export const openBookDemoModal = (payload = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_DEMO_MODAL_EVENT, { detail: payload }));
  }
};

export const closeBookDemoModal = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLOSE_DEMO_MODAL_EVENT));
  }
};

const TEAM_SIZES = [
  { val: '', label: 'Select team size' },
  { val: '1-10', label: '1 – 10 employees' },
  { val: '11-25', label: '11 – 25 employees' },
  { val: '26-50', label: '26 – 50 employees' },
  { val: '51-100', label: '51 – 100 employees' },
  { val: '101-250', label: '101 – 250 employees' },
  { val: '250+', label: '250+ employees' }
];

const AVAILABLE_MODULES = [
  { id: 'Employees & HR', icon: 'badge' },
  { id: 'Attendance & GPS', icon: 'fingerprint' },
  { id: 'Shifts & Leaves', icon: 'schedule' },
  { id: 'Payroll & Salary', icon: 'payments' },
  { id: 'Tasks & Projects', icon: 'task_alt' },
  { id: 'Client Portal', icon: 'handshake' },
  { id: 'Chat & Meetings', icon: 'video_call' },
  { id: 'Reports & Insights', icon: 'insights' }
];

const BookDemoModal = ({ isOpen: controlledIsOpen, onClose: controlledOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    employeeCount: '',
    datetime: '',
    message: ''
  });

  const [selectedModules, setSelectedModules] = useState([
    'Employees & HR',
    'Attendance & GPS',
    'Payroll & Salary'
  ]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const overlayRef = useRef(null);

  // Global event listener for open/close
  useEffect(() => {
    const handleOpen = (e) => {
      setAlertError('');
      setErrors({});
      setIsSuccess(false);

      if (e?.detail) {
        if (e.detail.module && !selectedModules.includes(e.detail.module)) {
          setSelectedModules((prev) => [...prev, e.detail.module]);
        }
        if (e.detail.companyName) {
          setForm((prev) => ({ ...prev, companyName: e.detail.companyName }));
        }
      }

      setInternalIsOpen(true);
    };

    const handleClose = () => {
      setInternalIsOpen(false);
      if (controlledOnClose) controlledOnClose();
    };

    window.addEventListener(OPEN_DEMO_MODAL_EVENT, handleOpen);
    window.addEventListener(CLOSE_DEMO_MODAL_EVENT, handleClose);

    return () => {
      window.removeEventListener(OPEN_DEMO_MODAL_EVENT, handleOpen);
      window.removeEventListener(CLOSE_DEMO_MODAL_EVENT, handleClose);
    };
  }, [controlledOnClose, selectedModules]);

  // Intercept any #demo links or [data-open-demo] clicks across marketing pages
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href');
      const hasDataAttr = target.getAttribute('data-open-demo') !== null;
      const isDemoHash = href === '#demo' || href === '#demo/' || href === '/#demo';

      if (hasDataAttr || isDemoHash) {
        e.preventDefault();
        e.stopPropagation();
        setAlertError('');
        setErrors({});
        setIsSuccess(false);
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

  const handleModalClose = () => {
    if (isControlled) {
      if (controlledOnClose) controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      handleModalClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;

    if (name === 'phone') {
      sanitized = value.replace(/\D/g, '').slice(0, 10);
    }

    setForm((prev) => ({ ...prev, [name]: sanitized }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (alertError) setAlertError('');
  };

  const toggleModule = (modId) => {
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Please enter a valid name';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid work email';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!form.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!form.employeeCount) {
      newErrors.employeeCount = 'Please select your team size';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setAlertError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      companyName: form.companyName.trim(),
      employeeCount: form.employeeCount,
      preferredDemoDateTime: form.datetime ? form.datetime : undefined,
      modules: selectedModules,
      requirements: selectedModules.join(', '),
      message: form.message.trim(),
      source: window.location.pathname || 'Marketing Book Demo Modal'
    };

    try {
      // Primary endpoint
      await axios.post('/demo-requests', payload, { _skipErrorNotify: true });
      setIsSuccess(true);
      toast.success('Demo booking request submitted successfully!');
    } catch (primaryErr) {
      // Fallback endpoint if primary fails
      try {
        await axios.post(
          '/clientsservice/service-enquiries',
          {
            serviceName: 'Live Personalised Demo',
            clientName: payload.name,
            companyName: payload.companyName,
            clientEmail: payload.email,
            clientPhone: payload.phone,
            employeeCount: payload.employeeCount,
            requirements: payload.requirements,
            message: payload.message,
            preferredDate: payload.preferredDemoDateTime
          },
          { _skipErrorNotify: true }
        );
        setIsSuccess(true);
        toast.success('Demo booking request submitted successfully!');
      } catch (fallbackErr) {
        const msg =
          primaryErr?.response?.data?.message ||
          fallbackErr?.response?.data?.message ||
          'Unable to submit demo request right now. Please check your internet or try again.';
        setAlertError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="ciis-demo-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ciis-demo-title"
    >
      <div className="ciis-demo-modal-card">
        {/* Close Button */}
        <button
          type="button"
          className="ciis-demo-close-btn"
          onClick={handleModalClose}
          aria-label="Close dialog"
        >
          <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: '20px', lineHeight: 1 }}>
            close
          </span>
        </button>

        {isSuccess ? (
          /* Success Screen */
          <div className="ciis-demo-success-wrap">
            <div className="ciis-demo-success-icon">
              <span style={{ fontFamily: "'Material Symbols Rounded'" }}>check</span>
            </div>
            <h2 className="ciis-demo-success-title">Demo Request Received!</h2>
            <p className="ciis-demo-success-desc">
              Thank you, <strong>{form.name}</strong>. Our product specialist will get in touch at{' '}
              <strong>{form.email}</strong> or <strong>+91 {form.phone}</strong> to confirm your live walkthrough.
            </p>

            <div className="ciis-demo-success-box">
              <div className="ciis-demo-success-row">
                <span style={{ fontFamily: "'Material Symbols Rounded'", color: '#2563eb' }}>business</span>
                <span>Company: <strong>{form.companyName}</strong></span>
              </div>
              <div className="ciis-demo-success-row">
                <span style={{ fontFamily: "'Material Symbols Rounded'", color: '#2563eb' }}>groups</span>
                <span>Team size: <strong>{form.employeeCount} employees</strong></span>
              </div>
              {selectedModules.length > 0 && (
                <div className="ciis-demo-success-row">
                  <span style={{ fontFamily: "'Material Symbols Rounded'", color: '#2563eb' }}>widgets</span>
                  <span>Modules: <strong>{selectedModules.join(', ')}</strong></span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="ciis-demo-submit-btn"
              onClick={handleModalClose}
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Form Screen */
          <>
            <div className="ciis-demo-header">
              <div className="ciis-demo-badge">
                <span style={{ fontFamily: "'Material Symbols Rounded'", fontSize: '15px' }}>play_circle</span>
                Live 1-on-1 Walkthrough
              </div>
              <h2 id="ciis-demo-title" className="ciis-demo-title">
                Book a <span>Live Demo</span>
              </h2>
              <p className="ciis-demo-subtitle">
                See CIIS running for a company like yours with live data, GPS attendance, payroll & task visibility.
              </p>
            </div>

            {alertError && (
              <div className="ciis-demo-alert" role="alert">
                <span
                  className="ciis-demo-alert-icon"
                  style={{ fontFamily: "'Material Symbols Rounded'", fontSize: '18px' }}
                >
                  error
                </span>
                <span>{alertError}</span>
              </div>
            )}

            <form className="ciis-demo-form" onSubmit={handleSubmit} noValidate>
              <div className="ciis-demo-grid">
                {/* Full Name */}
                <div className="ciis-demo-field">
                  <label className="ciis-demo-label" htmlFor="demo-name">
                    Full Name <span className="ciis-demo-req">*</span>
                  </label>
                  <div className={`ciis-demo-input-wrap ${errors.name ? 'has-error' : ''}`}>
                    <span
                      className="ciis-demo-field-icon"
                      style={{ fontFamily: "'Material Symbols Rounded'" }}
                    >
                      person
                    </span>
                    <input
                      id="demo-name"
                      name="name"
                      type="text"
                      className="ciis-demo-input"
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  {errors.name && <span className="ciis-demo-field-error">{errors.name}</span>}
                </div>

                {/* Work Email */}
                <div className="ciis-demo-field">
                  <label className="ciis-demo-label" htmlFor="demo-email">
                    Work Email <span className="ciis-demo-req">*</span>
                  </label>
                  <div className={`ciis-demo-input-wrap ${errors.email ? 'has-error' : ''}`}>
                    <span
                      className="ciis-demo-field-icon"
                      style={{ fontFamily: "'Material Symbols Rounded'" }}
                    >
                      mail
                    </span>
                    <input
                      id="demo-email"
                      name="email"
                      type="email"
                      className="ciis-demo-input"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && <span className="ciis-demo-field-error">{errors.email}</span>}
                </div>

                {/* Mobile Number */}
                <div className="ciis-demo-field">
                  <label className="ciis-demo-label" htmlFor="demo-phone">
                    Mobile Number <span className="ciis-demo-req">*</span>
                  </label>
                  <div className={`ciis-demo-input-wrap ${errors.phone ? 'has-error' : ''}`}>
                    <span
                      className="ciis-demo-field-icon"
                      style={{ fontFamily: "'Material Symbols Rounded'" }}
                    >
                      call
                    </span>
                    <input
                      id="demo-phone"
                      name="phone"
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="ciis-demo-input"
                      placeholder="9876543210"
                      value={form.phone}
                      onKeyDown={(e) => {
                        if (
                          !/[0-9]/.test(e.key) &&
                          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key) &&
                          !e.ctrlKey && !e.metaKey
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.phone && <span className="ciis-demo-field-error">{errors.phone}</span>}
                </div>

                {/* Company Name */}
                <div className="ciis-demo-field">
                  <label className="ciis-demo-label" htmlFor="demo-company">
                    Company Name <span className="ciis-demo-req">*</span>
                  </label>
                  <div className={`ciis-demo-input-wrap ${errors.companyName ? 'has-error' : ''}`}>
                    <span
                      className="ciis-demo-field-icon"
                      style={{ fontFamily: "'Material Symbols Rounded'" }}
                    >
                      domain
                    </span>
                    <input
                      id="demo-company"
                      name="companyName"
                      type="text"
                      className="ciis-demo-input"
                      placeholder="Acme Technologies"
                      value={form.companyName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.companyName && (
                    <span className="ciis-demo-field-error">{errors.companyName}</span>
                  )}
                </div>

                {/* Team Size */}
                <div className="ciis-demo-field">
                  <label className="ciis-demo-label" htmlFor="demo-size">
                    Team Size <span className="ciis-demo-req">*</span>
                  </label>
                  <div className={`ciis-demo-input-wrap ${errors.employeeCount ? 'has-error' : ''}`}>
                    <span
                      className="ciis-demo-field-icon"
                      style={{ fontFamily: "'Material Symbols Rounded'" }}
                    >
                      groups
                    </span>
                    <select
                      id="demo-size"
                      name="employeeCount"
                      className="ciis-demo-select"
                      value={form.employeeCount}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      {TEAM_SIZES.map((s) => (
                        <option key={s.val} value={s.val}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className="ciis-demo-select-caret"
                      style={{ fontFamily: "'Material Symbols Rounded'" }}
                    >
                      expand_more
                    </span>
                  </div>
                  {errors.employeeCount && (
                    <span className="ciis-demo-field-error">{errors.employeeCount}</span>
                  )}
                </div>

                {/* Preferred Date & Time */}
                <div className="ciis-demo-field">
                  <label className="ciis-demo-label" htmlFor="demo-datetime">
                    Preferred Date & Time <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '11.5px' }}>(Optional)</span>
                  </label>
                  <div className="ciis-demo-input-wrap">
                    <span
                      className="ciis-demo-field-icon"
                      style={{ fontFamily: "'Material Symbols Rounded'" }}
                    >
                      event
                    </span>
                    <input
                      id="demo-datetime"
                      name="datetime"
                      type="datetime-local"
                      className="ciis-demo-input"
                      value={form.datetime}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Modules Interested */}
                <div className="ciis-demo-field ciis-demo-grid-full">
                  <label className="ciis-demo-label">
                    Modules you want to see
                    <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '12px' }}>
                      (Click to select)
                    </span>
                  </label>
                  <div className="ciis-demo-modules-box">
                    <div className="ciis-demo-modules-list">
                      {AVAILABLE_MODULES.map((m) => {
                        const isSel = selectedModules.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`ciis-demo-pill ${isSel ? 'selected' : ''}`}
                            onClick={() => toggleModule(m.id)}
                            disabled={isSubmitting}
                          >
                            <span
                              className="ciis-demo-pill-icon"
                              style={{ fontFamily: "'Material Symbols Rounded'" }}
                            >
                              {m.icon}
                            </span>
                            <span>{m.id}</span>
                            {isSel && (
                              <span
                                style={{
                                  fontFamily: "'Material Symbols Rounded'",
                                  fontSize: '13px',
                                  marginLeft: '2px'
                                }}
                              >
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Message / Questions */}
                <div className="ciis-demo-field ciis-demo-grid-full">
                  <label className="ciis-demo-label" htmlFor="demo-msg">
                    Anything specific you’d like us to focus on?{' '}
                    <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '11.5px' }}>
                      (Optional)
                    </span>
                  </label>
                  <div className="ciis-demo-input-wrap">
                    <span
                      className="ciis-demo-field-icon"
                      style={{
                        fontFamily: "'Material Symbols Rounded'",
                        top: '12px',
                        transform: 'none'
                      }}
                    >
                      chat
                    </span>
                    <textarea
                      id="demo-msg"
                      name="message"
                      className="ciis-demo-textarea"
                      placeholder="e.g. Currently tracking 50 employees on Excel; want biometric + GPS sync."
                      value={form.message}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="ciis-demo-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="ciis-demo-spinner" />
                    <span>Booking Walkthrough...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Live Demo Request</span>
                    <span
                      style={{
                        fontFamily: "'Material Symbols Rounded'",
                        fontSize: '18px',
                        lineHeight: 1
                      }}
                    >
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              <div className="ciis-demo-footer-note">
                <span className="ciis-demo-footer-item">
                  <span
                    style={{
                      fontFamily: "'Material Symbols Rounded'",
                      color: '#10b981',
                      fontSize: '15px'
                    }}
                  >
                    check_circle
                  </span>
                  No credit card required
                </span>
                <span className="ciis-demo-footer-item">
                  <span
                    style={{
                      fontFamily: "'Material Symbols Rounded'",
                      color: '#10b981',
                      fontSize: '15px'
                    }}
                  >
                    schedule
                  </span>
                  30-min focused session
                </span>
                <span className="ciis-demo-footer-item">
                  <span
                    style={{
                      fontFamily: "'Material Symbols Rounded'",
                      color: '#10b981',
                      fontSize: '15px'
                    }}
                  >
                    lock
                  </span>
                  100% Privacy guaranteed
                </span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BookDemoModal;
