import React from 'react';
import { FaTwitter, FaFacebookF, FaInstagram, FaLinkedinIn, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import './CiisFooter.css';
import { Link, useNavigate } from 'react-router-dom';

const CiisFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="ciis-footer">
      <div className="ciis-footer-wave"></div>
      
      <div className="ciis-footer-container">
        {/* Main Footer Content */}
        <div className="ciis-footer-content"> 
          
          {/* Brand Section */}
          <div className="ciis-footer-section">
            <div className="ciis-footer-brand">
              <div className="ciis-footer-logo">
                <img
                  src="/Logo.png"
                  alt="CIIS Network Logo"
                  className="ciis-logo-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              </div>
              <p className="ciis-footer-tagline">
                Empowering Modern Workforce Management
              </p>
              <p className="ciis-footer-description">
                Innovative solutions for streamlined employee management and business excellence.
              </p>
         
            <Link to="/SuperAdminLogin">
              <button >SuperAdminLogin</button>
            </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="ciis-footer-section">
            <h4 className="ciis-footer-title">Quick Links</h4>
            <ul className="ciis-footer-list">
              <li><a href="#about" onClick={() => navigate("/about")} className="ciis-footer-link">About Us</a></li>
              <li><a href="#solutions" onClick={() => navigate("/solutions")} className="ciis-footer-link">Solutions</a></li>
              <li><a href="#pricing" onClick={() => navigate("/pricing")} className="ciis-footer-link">Pricing</a></li>
              <li><a href="#support" className="ciis-footer-link">Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="ciis-footer-section">
            <h4 className="ciis-footer-title">Legal</h4>
            <ul className="ciis-footer-list">
              <li><Link to="/privacy-policy" className="ciis-footer-link">Privacy Policy</Link></li>
              <li><Link to="/terms" className="ciis-footer-link">Terms of Service</Link></li>
              <li><Link to="/cookies" className="ciis-footer-link">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="ciis-footer-section">
            <h4 className="ciis-footer-title">Contact Us</h4>
            <ul className="ciis-footer-contact-list">
              <li className="ciis-contact-item">
                <FaEnvelope className="ciis-contact-icon" />
                <span>info@ciisnetwork.com</span>
              </li>
              <li className="ciis-contact-item">
                <FaPhone className="ciis-contact-icon" />
                <span>+91  099922 29755</span>
              </li>
              <li className="ciis-contact-item">
                <FaMapMarkerAlt className="ciis-contact-icon" />
                <span>5th Floor, C210 8B, Sector-74, Mohali, Punjab, India</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="ciis-footer-bottom">
          <div className="ciis-bottom-content">

              <Link to="/company/CAREER/login">
              <p className="ciis-copyright">
              
              © 2025 CIIS Network. All rights reserved.
            </p>
            </Link>


            
            
            <div className="ciis-legal-links">
              <Link to="/privacy-policy" className="ciis-legal-link">Privacy</Link>
              <span className="ciis-link-separator">•</span>
              <Link to="/terms" className="ciis-legal-link">Terms</Link>
              <span className="ciis-link-separator">•</span>
              <Link to="/cookies" className="ciis-legal-link">Cookies</Link>
            </div>
            
            <div className="ciis-social-links">
              <a
                href="https://www.linkedin.com/company/career-infowis-it-solutons-pvt-ltd/"
                className="ciis-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>
              
              <a
                href="https://x.com/careerinfowisit"
                className="ciis-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
              
              <a
                href="https://www.facebook.com/careerinfowisitsolutions"
                className="ciis-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
              
              <a
                href="https://www.instagram.com/careerinfowisitsolutions"
                className="ciis-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CiisFooter;
