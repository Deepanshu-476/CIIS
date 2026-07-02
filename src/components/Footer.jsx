import React from 'react';
import { FaApple, FaGooglePlay, FaEnvelope, FaPhone } from 'react-icons/fa';
import { FaXTwitter, FaInstagram, FaLinkedin, FaFacebookF } from 'react-icons/fa6';
import '../componentsCSS/Footer.css'; 
import logo from '/logoo.png'
const Footer = () => {
  return (
      <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-logo-section">
          <img src={logo} alt=" CIIS Network Logo" className="footer-logo" />
          <div className="footer-contact">
            <a href="mailto:cars@tuno.ai" className="contact-link">
              <FaEnvelope className="contact-icon" /> cars@tuno.ai
            </a>
            <a href="tel:+918179880074" className="contact-link">
              <FaPhone className="contact-icon" /> +91 8179880074
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>ABOUT</h3>
          <ul>
            <li><a href="/about-us">About Us</a></li>
            <li><a href="/newsroom">Newsroom</a></li>
            <li><a href="/partners">Become a Partner</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>PRODUCTS</h3>
          <ul>
            <li><a href="/call-management">Call Management CRM</a></li>
            <li><a href="/lead-management">Lead Management System</a></li>
            <li><a href="/call-center">Call Center App</a></li>
            <li><a href="/auto-dialer">Auto Dialer</a></li>
            <li><a href="/talicaliler">Talicaliler App</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>SUPPORT</h3>
          <ul>
            <li><a href="/contact-sales">Contact sales</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>FOLLOW US</h3>
          <div className="social-icons">
            <a href="#" aria-label="Twitter"><FaXTwitter /></a>
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
          </div>
          
          <h3 className="get-app-title">GET THE APP</h3>
          <div className="app-buttons">
            <a href="#" className="app-button">
              <FaApple className="app-icon" /> App Store
            </a>
            <a href="#" className="app-button">
              <FaGooglePlay className="app-icon" /> Google Play
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 CIIS Network, All Rights Reserved.</p>
        <div className="legal-links">
          <a href="/terms">Terms & Conditions</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/usage">Usage Policy</a>
          <a href="/security">Data Security</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;