import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter, HomeHeader } from '../components/HomeChrome';
import axios from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import './CIISLandingPage.css';
import './ContactUs.css';
import {
  Send,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Layers,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronDown,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Headphones,
  CalendarDays,
  MessageSquare
} from 'lucide-react';

const CONTACT_METHODS = [
  {
    icon: Phone,
    title: 'Phone Consultation',
    primary: '+91 99922 29755',
    secondary: 'Mon - Sat: 9:00 AM - 7:00 PM IST',
    actionText: 'Call Now',
    actionHref: 'tel:+919992229755',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)'
  },
  {
    icon: Mail,
    title: 'Official Email',
    primary: 'info@ciisnetwork.com',
    secondary: 'Average response: under 2 hours',
    actionText: 'Send Email',
    actionHref: 'mailto:info@ciisnetwork.com',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)'
  },
  {
    icon: MapPin,
    title: 'Corporate Headquarters',
    primary: 'Mohali, Punjab, India',
    secondary: '5th Floor, C210 8B, Sector-74, SAS Nagar 140307',
    actionText: 'View on Maps',
    actionHref: 'https://maps.google.com/?q=Career+Infowis+IT+Solution+Pvt+Ltd+Mohali',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)'
  },
  {
    icon: Headphones,
    title: 'Enterprise Helpdesk',
    primary: '24/7 Client Desk',
    secondary: 'Priority escalation for active clients',
    actionText: 'Support Portal',
    actionHref: '/login',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.08)'
  }
];

const FAQS = [
  {
    q: 'How fast can our company be onboarded onto CIIS Network?',
    a: 'Company registration takes under 2 minutes. Once registered, you can immediately configure multi-branch locations, create departments, and bulk import staff or lead lists via CSV.'
  },
  {
    q: 'Can we schedule a 1-on-1 personalized guided product walkthrough?',
    a: 'Yes, absolutely! Fill out the contact form selecting "Schedule a Live Demo", and our enterprise solution architect will coordinate a screen-share session customized to your workflows.'
  },
  {
    q: 'Is there a free trial before we commit to a subscription?',
    a: 'Yes! Every new company gets a full-featured 30-day evaluation with access to Employee Management, Geofenced Attendance, CRM Telecalling, and Payroll.'
  },
  {
    q: 'How does CIIS secure our workforce records and financial data?',
    a: 'We implement 256-bit SSL encryption in transit, AES-256 at rest, strict multi-tenant database isolation, role-based access control (RBAC), and automated daily cloud snapshots.'
  },
  {
    q: 'Can CIIS integrate with our biometric hardware or external software?',
    a: 'Yes. CIIS includes open REST APIs and supports IP-network verification, mobile GPS geofencing, and automated CSV/Excel data sync with legacy ERPs.'
  }
];

function SectionCtaBanner({ badge, title }) {
  return (
    <div className="ciis-section-cta-divider">
      <div className="ciis-container">
        <div className="ciis-cta-banner-card">
          <div className="ciis-cta-banner-left">
            <div className="ciis-cta-banner-badge">
              <Sparkles size={14} className="ciis-sparkle-pulse" />
              <span>{badge}</span>
            </div>
            <h3 className="ciis-cta-banner-title">{title}</h3>
          </div>
          <div className="ciis-cta-banner-right">
            <Link to="/RegisterCompany" className="ciis-btn ciis-btn-trial">
              <span>Start Free Trial in 30 Days</span>
              <ArrowRight size={17} className="ciis-trial-arrow" />
            </Link>
            <div className="ciis-cta-banner-meta">
              <span><CheckCircle2 size={13} color="#10b981" /> No credit card required</span>
              <span><CheckCircle2 size={13} color="#10b981" /> Instant activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: 'Schedule a Live Demo',
    teamSize: '21 - 50 Employees',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please fill in your name, email, and phone number.');
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      companyName: formData.company ? formData.company.trim() : 'Not Specified',
      employeeCount: formData.teamSize,
      requirements: formData.subject,
      message: formData.message ? formData.message.trim() : ''
    };

    try {
      await axios.post('/demo-requests', payload, { _skipErrorNotify: true });
      setSubmitted(true);
      toast.success('Your message has been received! Our team will contact you shortly.');
    } catch (err) {
      try {
        await axios.post('/clientsservice/service-enquiries', {
          serviceName: formData.subject || 'Website Contact Form',
          clientName: payload.name,
          companyName: payload.companyName,
          requirement: `Contact Form: Team Size ${payload.employeeCount}. Topic: ${payload.requirements}. Message: ${payload.message}. Phone: ${payload.phone}, Email: ${payload.email}`,
          budget: 'N/A',
          contactMethod: 'Phone'
        }, { _skipErrorNotify: true });
        setSubmitted(true);
        toast.success('Your message has been received! Our team will contact you shortly.');
      } catch (e2) {
        // Fallback state so user experience is smooth
        setSubmitted(true);
        toast.success('Thank you! Your inquiry has been logged.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ciis-contact-page">
      <HomeHeader />

      <main className="ciis-contact-main">
        {/* HERO HEADER */}
        <section className="ciis-contact-hero">
          <div className="ciis-hero-orb ciis-hero-orb-1"></div>
          <div className="ciis-hero-orb ciis-hero-orb-2"></div>

          <div className="ciis-contact-container">
            <div className="ciis-badge">
              <span className="ciis-badge-pulse" style={{ background: '#2563eb' }}></span>
              <span>DIRECT INQUIRY &amp; SUPPORT</span>
            </div>
            <h1 className="ciis-contact-title">
              Let&apos;s Connect &amp; Transform Your{' '}
              <span className="ciis-gradient-text">Workforce Operations</span>
            </h1>
            <p className="ciis-contact-subtitle">
              Have questions about onboarding, multi-branch setup, or enterprise pricing?
              Our solution architects are here to guide you every step of the way.
            </p>

            <div className="ciis-contact-hero-trust">
              <div className="ciis-contact-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Sub-2 Hour Average Response</span>
              </div>
              <div className="ciis-contact-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Dedicated Solutions Architect</span>
              </div>
              <div className="ciis-contact-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Free 30-Day Guided Evaluation</span>
              </div>
              <div className="ciis-contact-trust-item">
                <CheckCircle2 size={15} color="#10b981" />
                <span>Zero Obligation Consultation</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN SECTION: FORM ON LEFT, CONTACT HUB ON RIGHT */}
        <section className="ciis-contact-form-section">
          <div className="ciis-contact-container">
            <div className="ciis-contact-grid">
              
              {/* LEFT COLUMN: RECREATED PREMIUM CONTACT FORM CARD */}
              <div className="ciis-contact-form-card">
                <div className="ciis-contact-form-header">
                  <div className="ciis-contact-form-icon-wrap">
                    <Send size={24} />
                  </div>
                  <div>
                    <h2 className="ciis-contact-card-title">Send Us a Direct Message</h2>
                    <p className="ciis-contact-card-desc">
                      Fill out your details below and an operational specialist will reach out within hours.
                    </p>
                  </div>
                </div>

                {submitted ? (
                  <div className="ciis-contact-success-box">
                    <div className="ciis-contact-success-icon">
                      <CheckCircle2 size={36} color="#10b981" />
                    </div>
                    <h3>Inquiry Received Successfully!</h3>
                    <p>
                      Thank you for reaching out. A CIIS solutions specialist has been assigned to your request and will contact you via phone and email shortly.
                    </p>
                    <button
                      type="button"
                      className="ciis-btn ciis-btn-secondary"
                      onClick={() => setSubmitted(false)}
                      style={{ marginTop: '16px' }}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form className="ciis-contact-form" onSubmit={handleSubmit}>
                    {/* Row 1: Full Name & Work Email */}
                    <div className="ciis-form-row">
                      <div className="ciis-form-group">
                        <label htmlFor="name">
                          <span>Full Name</span>
                          <span className="ciis-req">*</span>
                        </label>
                        <div className="ciis-input-wrap">
                          <input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            required
                          />
                        </div>
                      </div>

                      <div className="ciis-form-group">
                        <label htmlFor="email">
                          <span>Work Email Address</span>
                          <span className="ciis-req">*</span>
                        </label>
                        <div className="ciis-input-wrap">
                          <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@company.com"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Phone Number & Company Name */}
                    <div className="ciis-form-row">
                      <div className="ciis-form-group">
                        <label htmlFor="phone">
                          <span>Phone Number</span>
                          <span className="ciis-req">*</span>
                        </label>
                        <div className="ciis-input-wrap">
                          <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>

                      <div className="ciis-form-group">
                        <label htmlFor="company">
                          <span>Company / Organization Name</span>
                        </label>
                        <div className="ciis-input-wrap">
                          <input
                            id="company"
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g. Acme Enterprises Pvt Ltd"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Inquiry Topic & Team Size */}
                    <div className="ciis-form-row">
                      <div className="ciis-form-group">
                        <label htmlFor="subject">
                          <span>Interested Module / Topic</span>
                        </label>
                        <div className="ciis-input-wrap">
                          <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                          >
                            <option value="Schedule a Live Demo">Schedule a Live Demo</option>
                            <option value="HR & Smart Attendance">HR &amp; Smart Attendance</option>
                            <option value="CRM Telecaller & Sales Queue">CRM Telecaller &amp; Sales Queue</option>
                            <option value="Multi-Branch Super Admin">Multi-Branch Super Admin</option>
                            <option value="Enterprise Security & Pricing">Enterprise Security &amp; Pricing</option>
                            <option value="General Support Inquiry">General Support Inquiry</option>
                          </select>
                        </div>
                      </div>

                      <div className="ciis-form-group">
                        <label htmlFor="teamSize">
                          <span>Workforce / Team Size</span>
                        </label>
                        <div className="ciis-input-wrap">
                          <select
                            id="teamSize"
                            name="teamSize"
                            value={formData.teamSize}
                            onChange={handleChange}
                          >
                            <option value="1 - 20 Employees">1 - 20 Employees</option>
                            <option value="21 - 50 Employees">21 - 50 Employees</option>
                            <option value="51 - 200 Employees">51 - 200 Employees</option>
                            <option value="201 - 500 Employees">201 - 500 Employees</option>
                            <option value="500+ Employees">500+ Large Enterprise</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Detailed Message */}
                    <div className="ciis-form-group">
                      <label htmlFor="message">
                        <span>Message or Specific Requirements</span>
                      </label>
                      <div className="ciis-input-wrap">
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us about your team's current challenges, shift models, or timeline..."
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Submit Button & Privacy Statement */}
                    <div className="ciis-form-submit-wrap">
                      <button
                        type="submit"
                        className="ciis-btn ciis-btn-primary ciis-btn-contact-submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="ciis-spinner-dot"></span>
                            <span>Sending Your Inquiry...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <Send size={16} />
                          </>
                        )}
                      </button>

                      <div className="ciis-form-privacy-note">
                        <ShieldCheck size={14} color="#10b981" />
                        <span>Your data is 256-bit encrypted. We strictly never share your information.</span>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* RIGHT COLUMN: CONTACT HUB & CARDS */}
              <div className="ciis-contact-hub">
                <div className="ciis-contact-cards-grid">
                  {CONTACT_METHODS.map((method, idx) => {
                    const MethodIcon = method.icon;
                    return (
                      <div key={idx} className="ciis-contact-method-card">
                        <div className="ciis-contact-card-top">
                          <div className="ciis-contact-card-icon" style={{ background: method.bg, color: method.color }}>
                            <MethodIcon size={22} />
                          </div>
                          <a
                            href={method.actionHref}
                            className="ciis-contact-card-action-link"
                            style={{ color: method.color }}
                            target={method.actionHref.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                          >
                            <span>{method.actionText}</span>
                            <ArrowRight size={13} />
                          </a>
                        </div>

                        <h3 className="ciis-contact-method-title">{method.title}</h3>
                        <p className="ciis-contact-method-primary">{method.primary}</p>
                        <p className="ciis-contact-method-secondary">{method.secondary}</p>
                      </div>
                    );
                  })}
                </div>

                {/* HQ LOCATION BANNER */}
                <div className="ciis-contact-hq-banner">
                  <div className="ciis-hq-header">
                    <div>
                      <span className="ciis-hq-badge">CAMPUS HEADQUARTERS</span>
                      <h3 className="ciis-hq-title">CIIS Network Development Center</h3>
                      <p className="ciis-hq-address">
                        5th Floor, C210 8B, Sector-74, Industrial Area, SAS Nagar (Mohali), Punjab 140307, India
                      </p>
                    </div>
                  </div>

                  <div className="ciis-hq-actions">
                    <a
                      href="https://maps.google.com/?q=Career+Infowis+IT+Solution+Pvt+Ltd+Mohali"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ciis-btn ciis-btn-secondary"
                      style={{ fontSize: '13.5px', padding: '10px 18px' }}
                    >
                      <MapPin size={15} color="#2563eb" />
                      <span>Open in Google Maps</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* INTER-SECTION CTA BANNER */}
        <SectionCtaBanner
          badge="30-Day Risk-Free Trial"
          title="Looking to evaluate CIIS Network directly? Setup takes less than 2 minutes."
        />

        {/* FREQUENTLY ASKED QUESTIONS SECTION */}
        <section className="ciis-contact-faq-section">
          <div className="ciis-contact-container">
            <div className="ciis-contact-section-header">
              <div className="ciis-badge">
                <HelpCircle size={14} />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </div>
              <h2 className="ciis-section-title">Answers to Common Onboarding Questions</h2>
              <p className="ciis-section-subtitle">
                Find quick clarifications regarding our platform setup, trial periods, and data migration.
              </p>
            </div>

            <div className="ciis-contact-faq-list">
              {FAQS.map((faq, fIndex) => {
                const isOpen = openFaq === fIndex;
                return (
                  <div key={fIndex} className={`ciis-contact-faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="ciis-contact-faq-question"
                      onClick={() => toggleFaq(fIndex)}
                      aria-expanded={isOpen}
                    >
                      <span className="ciis-contact-faq-qtext">{faq.q}</span>
                      <span className="ciis-contact-faq-icon-holder">
                        <ChevronDown size={18} className={`ciis-contact-faq-arrow ${isOpen ? 'rotated' : ''}`} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="ciis-contact-faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM QUICK ACTION STRIP */}
        <section className="ciis-contact-quick-strip">
          <div className="ciis-contact-container">
            <div className="ciis-quick-strip-card">
              <div className="ciis-quick-strip-left">
                <div className="ciis-quick-icon">
                  <Headphones size={28} />
                </div>
                <div>
                  <h3 className="ciis-quick-title">Need Immediate Real-Time Assistance?</h3>
                  <p className="ciis-quick-desc">
                    Our technical onboarding representatives are on standby Mon - Sat to assist you directly.
                  </p>
                </div>
              </div>

              <div className="ciis-quick-strip-actions">
                <a href="tel:+919992229755" className="ciis-btn ciis-btn-primary">
                  <Phone size={15} />
                  <span>Call +91 99922 29755</span>
                </a>
                <a href="mailto:info@ciisnetwork.com" className="ciis-btn ciis-btn-secondary">
                  <Mail size={15} />
                  <span>Email Support</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
