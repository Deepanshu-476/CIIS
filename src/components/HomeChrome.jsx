import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Layers,
  Menu,
  Phone,
  Sparkles,
  X,
  Zap
} from 'lucide-react';
import '../Pages/CIISLandingPage.css';
import FeatureMegaMenu from './landing/FeatureMegaMenu';

export function HomeHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`ciis-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="ciis-container">
        <div className="ciis-nav-inner">
          <a href="/" className="ciis-logo">
            <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo" />
          </a>

          <nav>
            <ul className="ciis-nav-links">
              <li><a href="/" className="ciis-nav-link">Home</a></li>
              <FeatureMegaMenu />
              <li><a href="/solutions" className="ciis-nav-link">Solutions</a></li>
              <li><a href="/how-it-works" className="ciis-nav-link">How It Works</a></li>
              <li><a href="/contact" className="ciis-nav-link">Contact</a></li>
            </ul>
          </nav>

          <div className="ciis-nav-actions">
            <a href="/login" className="ciis-btn ciis-btn-secondary">Login</a>
            <a href="/RegisterCompany" className="ciis-btn ciis-header-demo-btn">
              Request A Demo
            </a>
            <div className="ciis-header-app-icons">
              <a 
                href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ciis-header-app-circle"
                aria-label="Download on the App Store"
                title="Download on Apple App Store"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                </svg>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ciis-header-app-circle"
                aria-label="Get it on Google Play"
                title="Get it on Google Play"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: '2px' }}>
                  <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                  <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                  <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                  <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                </svg>
              </a>
            </div>
            <button
              className="ciis-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`ciis-mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <div className={`ciis-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="ciis-mob-header">
          <div className="ciis-logo">
            <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo" />
          </div>
          <button
            className="ciis-mob-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ciis-mob-nav-list">
          <a href="/" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="ciis-mob-link-content">
              <div className="ciis-mob-link-icon"><Sparkles size={16} /></div>
              <span>Home</span>
            </div>
            <ChevronRight size={16} />
          </a>
          <a href="/features" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="ciis-mob-link-content">
              <div className="ciis-mob-link-icon"><Layers size={16} /></div>
              <span>Features</span>
            </div>
            <ChevronRight size={16} />
          </a>
          <a href="/solutions" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="ciis-mob-link-content">
              <div className="ciis-mob-link-icon"><BarChart3 size={16} /></div>
              <span>Solutions</span>
            </div>
            <ChevronRight size={16} />
          </a>
          <a href="/how-it-works" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="ciis-mob-link-content">
              <div className="ciis-mob-link-icon"><Zap size={16} /></div>
              <span>How It Works</span>
            </div>
            <ChevronRight size={16} />
          </a>
          <a href="/#why" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="ciis-mob-link-content">
              <div className="ciis-mob-link-icon"><CheckCircle2 size={16} /></div>
              <span>Why CIIS</span>
            </div>
            <ChevronRight size={16} />
          </a>
          <a href="/contact" className="ciis-mob-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="ciis-mob-link-content">
              <div className="ciis-mob-link-icon"><Phone size={16} /></div>
              <span>Contact</span>
            </div>
            <ChevronRight size={16} />
          </a>
        </div>

        <div className="ciis-mob-actions">
          <a href="/RegisterCompany" className="ciis-btn ciis-header-demo-btn" onClick={() => setMobileMenuOpen(false)}>
            Request A Demo
          </a>
          <a href="/login" className="ciis-btn ciis-btn-secondary" onClick={() => setMobileMenuOpen(false)}>Login</a>
          <div className="ciis-mob-app-icons-row">
            <span className="ciis-mob-app-label">Download CIIS App:</span>
            <div className="ciis-header-app-icons" style={{ display: 'inline-flex' }}>
              <a 
                href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ciis-header-app-circle"
                aria-label="Download on the App Store"
                title="Download on Apple App Store"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                </svg>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ciis-header-app-circle"
                aria-label="Get it on Google Play"
                title="Get it on Google Play"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: '2px' }}>
                  <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                  <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                  <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                  <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="ciis-mob-footer-status">
          <span className="ciis-live-pill-dot"></span>
          <span>Cloud Network Operational (99.9% Uptime)</span>
        </div>
      </div>
    </header>
  );
}

export function HomeFooter() {
  return (
    <footer className="ciis-footer">
      <div className="ciis-container">
        <div className="ciis-footer-grid">
          <div className="ciis-footer-brand">
            <a href="/" className="ciis-logo">
              <img src="/logoo.png" alt="CIIS Network" className="ciis-brand-logo" />
            </a>
            <p className="ciis-footer-tagline">
              CIIS Network unifies workforce, attendance, CRM, projects and client operations into one reliable business management platform.
            </p>
            <div className="ciis-footer-status">
              <span className="ciis-live-pill-dot"></span>
              <span>Cloud Network Operational</span>
            </div>
          </div>

          <div className="ciis-footer-col">
            <h3>Platform</h3>
            <a href="/features">Features</a>
            <a href="/solutions">Solutions</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/security">Security</a>
          </div>

          <div className="ciis-footer-col">
            <h3>Operations</h3>
            <a href="/employee-management">Employee Management</a>
            <a href="/crm-telecaller">CRM &amp; Telecaller</a>
            <a href="/team-communication">Team Communication</a>
            <a href="/business-automation">Business Automation</a>
          </div>

          <div className="ciis-footer-col ciis-footer-actions-col">
            <h3>Super Admin</h3>
            <p>Access the CIIS central administration control portal.</p>
            <div className="ciis-footer-actions">
              <a href="/SuperAdminLogin" className="ciis-btn ciis-btn-primary ciis-btn-sm">
                Super Admin Login
              </a>
            </div>
          </div>
        </div>

        {/* ==================== GET THE APP & FOLLOW US ROW ==================== */}
        <div className="ciis-footer-connect-row">
          {/* Get the app */}
          <div className="ciis-footer-app-block">
            <h4 className="ciis-footer-block-heading">Get the app</h4>
            <div className="ciis-footer-store-btns">
              {/* Apple App Store Badge */}
              <a 
                href="https://apps.apple.com/in/app/ciis-network/id6780872642" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ciis-store-badge-btn" 
                aria-label="Download on the App Store"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.83 1.04.08 2.08-.49 2.72-1.27z"/>
                </svg>
                <div className="ciis-store-badge-text">
                  <span className="ciis-store-label">Download on the</span>
                  <span className="ciis-store-title">App Store</span>
                </div>
              </a>

              {/* Google Play Store Badge */}
              <a 
                href="https://play.google.com/store/apps/details?id=ciisnetwork.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ciis-store-badge-btn" 
                aria-label="Get it on Google Play"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path d="M3.6 1.6C3.2 2 3 2.6 3 3.4v17.2c0 .8.2 1.4.6 1.8l.1.1 9.6-9.6v-.2L3.6 1.6z" fill="#00e5ff"/>
                  <path d="M16.9 16.3l-3.6-3.6v-.2l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.4 2.4z" fill="#ffeb3b"/>
                  <path d="M13.3 12.5l-9.6 9.6c.4.4 1.1.5 1.9.1l11.3-6.4-3.6-3.3z" fill="#ff1744"/>
                  <path d="M13.3 12.5L17 8.8 5.6 2.4c-.8-.4-1.5-.3-1.9.1l9.6 10z" fill="#00e676"/>
                </svg>
                <div className="ciis-store-badge-text">
                  <span className="ciis-store-label">GET IT ON</span>
                  <span className="ciis-store-title">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Follow Us */}
          <div className="ciis-footer-social-block">
            <h4 className="ciis-footer-block-heading">Follow Us</h4>
            <div className="ciis-footer-social-icons">
              {/* Facebook */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ciis-social-circle-btn" 
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>

              {/* Twitter / X */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ciis-social-circle-btn" 
                aria-label="X (Twitter)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0f172a">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ciis-social-circle-btn" 
                aria-label="LinkedIn"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#0f172a">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.21a1.62 1.62 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ciis-social-circle-btn" 
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="ciis-footer-legal-row">
          <div className="ciis-footer-legal-links">
            <a href="/terms">Terms &amp; Conditions</a>
            <span className="ciis-footer-bullet">&bull;</span>
            <a href="/privacy">Privacy Policy</a>
            <span className="ciis-footer-bullet">&bull;</span>
            <a href="/usage">Usage Policy</a>
            <span className="ciis-footer-bullet">&bull;</span>
            <a href="/security">Data Security</a>
          </div>
        </div>

        <div className="ciis-footer-bottom">
          <span>&copy; 2026 CIIS Network. All rights reserved.</span>
          <span>Enterprise Business Suite &bull; Secure Cloud Operations</span>
        </div>
      </div>
    </footer>
  );
}
