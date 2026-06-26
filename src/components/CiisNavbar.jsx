import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './CiisNavbar.css';

const CiisNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

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
            <Link to="/RegisterCompany">
              <button className="login-btn">Register your company</button>
            </Link>
          
          </div>

        </div>

      </div>
    </nav>
  );
};

export default CiisNavbar;