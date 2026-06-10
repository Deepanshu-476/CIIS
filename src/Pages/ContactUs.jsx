import React, { useState } from 'react';
import './ContactUs.css';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock,
  ExternalLink,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Send,
  Shield,
  Users,
  Zap
} from 'lucide-react';
import Header from "../Components/CiisNavbar.jsx";
import Footer from "../Components/CiisFooter.jsx";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = event => {
    setFormData(prev => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 900));
    setSubmitted(true);
    setLoading(false);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      });
    }, 3500);
  };

  const supportPoints = [
    { icon: <Headphones />, title: 'Expert Support', text: 'Get help from our experienced team', tone: 'blue' },
    { icon: <Zap />, title: 'Quick Response', text: 'We respond within 24 hours', tone: 'green' },
    { icon: <Shield />, title: 'Reliable Solutions', text: 'Tailored solutions for your needs', tone: 'purple' },
    { icon: <Users />, title: 'Customer First', text: 'Your success is our priority', tone: 'orange' }
  ];

  const contactCards = [
    { icon: <Phone />, title: 'Phone', lines: ['+91 99922 29755', 'Mon - Fri: 9:00 AM - 7:00 PM'], tone: 'blue' },
    { icon: <Mail />, title: 'Email', lines: ['info@ciisnetwork.com', 'We reply within 24 hours'], tone: 'green' },
    { icon: <MapPin />, title: 'Office', lines: ['5th Floor, C210 8B, Sector-74, Mohali, Punjab, India'], tone: 'purple' },
    { icon: <Clock />, title: 'Working Hours', lines: ['9:00 AM - 7:00 PM', 'Sat - Sun: Closed'], tone: 'orange' }
  ];

  const faqs = [
    'How can I get started with CIIS Network?',
    'Is there a free trial available?',
    'Can CIIS integrate with our existing systems?',
    'What kind of support do you provide?',
    'How secure is our data?'
  ];

  return (
    <>
      <Header />

      <div className="CiisContact">
        <main className="CiisContact-page">
          <section className="CiisContact-hero-grid">
            <div className="CiisContact-intro">
              <div className="CiisContact-pill">
                <Send size={14} />
                Get In Touch
              </div>
              <h1>
                We&apos;re Here to Help You <span>Succeed</span>
              </h1>
              <p>
                Have questions about our platform? Our team is ready to assist you with anything you need. Let&apos;s connect and build something great together.
              </p>

              <div className="CiisContact-support-list">
                {supportPoints.map(item => (
                  <div className="CiisContact-support-item" key={item.title}>
                    <div className={`CiisContact-soft-icon CiisContact-soft-${item.tone}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <section className="CiisContact-form-card">
            <div className="CiisContact-form-heading">
              <div>
                <h2>Send Us a Message</h2>
                <p>Fill out the form and we&apos;ll get back to you soon.</p>
              </div>
              <div className="CiisContact-mail-badge">
                <Mail />
              </div>
            </div>

            {submitted && (
              <div className="CiisContact-success">
                Message sent successfully. Our team will contact you soon.
              </div>
            )}

            <form className="CiisContact-form" onSubmit={handleSubmit}>
              <div className="CiisContact-form-row">
                <label>
                  <span>Full Name</span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </label>
                <label>
                  <span>Email Address</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </label>
              </div>

              <label>
                <span>Company Name</span>
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                />
              </label>

              <label>
                <span>Subject</span>
                <select name="subject" value={formData.subject} onChange={handleChange} required>
                  <option value="">Select a subject</option>
                  <option value="demo">Schedule a demo</option>
                  <option value="support">Support request</option>
                  <option value="pricing">Pricing question</option>
                  <option value="integration">Integration help</option>
                </select>
              </label>

              <label>
                <span>Message</span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message here..."
                  rows="6"
                  required
                />
              </label>

              <button className="CiisContact-submit" type="submit" disabled={loading}>
                <Send size={18} />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            </section>
          </section>

        <section className="CiisContact-cards-grid">
          {contactCards.map(card => (
            <div className="CiisContact-info-card" key={card.title}>
              <div className={`CiisContact-soft-icon CiisContact-soft-${card.tone}`}>
                {card.icon}
              </div>
              <div>
                <h3>{card.title}</h3>
                {card.lines.map(line => <p key={line}>{line}</p>)}
              </div>
            </div>
          ))}
        </section>

        <section className="CiisContact-map-panel">
          <div className="CiisContact-map-card">
            <h3>WorkSmart Headquarters</h3>
            <p>5th Floor, C210 8B, Sector-74, Mohali, Punjab, India</p>
            <button onClick={() => window.open('https://www.google.com/maps/dir/Career+Infowis+IT+Solution+Pvt+Ltd+-+Best+Digital+Marketing+Agency+in+Mohali+%7C+Social+Media+Marketing+%7C+Best+SEO+services,+5th+Floor,+C,+210,+Phase+8B,+Industrial+Area,+Sector+74,+Sahibzada+Ajit+Singh+Nagar,+Punjab+140307/Career+Infowis+IT+Solution+Pvt+Ltd+-+Best+Digital+Marketing+Agency+in+Mohali+%7C+Social+Media+Marketing+%7C+Best+SEO+services,+5th+Floor,+C,+210,+Phase+8B,+Industrial+Area,+Sector+74,+Sahibzada+Ajit+Singh+Nagar,+Punjab+140307/@29.6671537,77.0219015,14z/data=!4m13!4m12!1m5!1m1!1s0x390f951631d7d8eb:0x9909fb6b31afeedf!2m2!1d76.6861848!2d30.708077!1m5!1m1!1s0x390f951631d7d8eb:0x9909fb6b31afeedf!2m2!1d76.6861848!2d30.708077?entry=ttu&g_ep=EgoyMDI2MDUyNy4wIKXMDSoASAFQAw%3D%3D', '_blank')}>
              View on Google Maps
              <ExternalLink size={15} />
            </button>
            <button className="CiisContact-direction-btn" onClick={() => window.open('https://www.google.com/maps/dir/Career+Infowis+IT+Solution+Pvt+Ltd+-+Best+Digital+Marketing+Agency+in+Mohali+%7C+Social+Media+Marketing+%7C+Best+SEO+services,+5th+Floor,+C,+210,+Phase+8B,+Industrial+Area,+Sector+74,+Sahibzada+Ajit+Singh+Nagar,+Punjab+140307/Career+Infowis+IT+Solution+Pvt+Ltd+-+Best+Digital+Marketing+Agency+in+Mohali+%7C+Social+Media+Marketing+%7C+Best+SEO+services,+5th+Floor,+C,+210,+Phase+8B,+Industrial+Area,+Sector+74,+Sahibzada+Ajit+Singh+Nagar,+Punjab+140307/@29.6671537,77.0219015,14z/data=!4m13!4m12!1m5!1m1!1s0x390f951631d7d8eb:0x9909fb6b31afeedf!2m2!1d76.6861848!2d30.708077!1m5!1m1!1s0x390f951631d7d8eb:0x9909fb6b31afeedf!2m2!1d76.6861848!2d30.708077?entry=ttu&g_ep=EgoyMDI2MDUyNy4wIKXMDSoASAFQAw%3D%3D', '_blank')}>
              Get Directions
              <ArrowRight size={18} />
            </button>
          </div>
          <span className="CiisContact-map-label CiisContact-map-label-1">Empire State Building</span>
          <span className="CiisContact-map-label CiisContact-map-label-2">Bryant Park</span>
          <span className="CiisContact-map-label CiisContact-map-label-3">Grand Central Terminal</span>
          <span className="CiisContact-map-label CiisContact-map-label-4">MURRAY HILL</span>
          <div className="CiisContact-map-pin">
            <MapPin />
          </div>
        </section>

        <section className="CiisContact-bottom-grid">
          <div className="CiisContact-cta-card">
            <div className="CiisContact-paper-plane"></div>
            <h2>Let&apos;s Build Something Amazing Together!</h2>
            <p>
              Join thousands of companies already using WorkSmart to streamline their operations and empower their teams.
            </p>
           
          </div>

          <div className="CiisContact-faq-card">
            <div className="CiisContact-faq-head">
              <h2>Frequently Asked Questions</h2>
              <button>
                View All FAQs
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="CiisContact-faq-list">
              {faqs.map(question => (
                <div className="CiisContact-faq-item" key={question}>
                  <span><HelpCircle size={18} /></span>
                  <strong>{question}</strong>
                  <ChevronDown size={18} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="CiisContact-help-strip">
          <div className="CiisContact-soft-icon CiisContact-soft-blue">
            <Headphones />
          </div>
          <div>
            <h3>Need Immediate Help?</h3>
            <p>Call us now or email our support team for quick assistance.</p>
          </div>
          <div className="CiisContact-help-actions">
            <a href="tel:+9199992229755">
              <Phone size={18} />
               +91 99922 29755
            </a>
            <a href="mailto:info@ciisnetwork.com" className="CiisContact-help-primary">
              <Mail size={18} />
              Email Support
            </a>
          </div>
        </section>
        </main>
      </div>

      <Footer />
    </>
  );
};

export default ContactUs;

