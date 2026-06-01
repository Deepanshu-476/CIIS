import React, { useState, useEffect } from "react";
import logo from "../../public/logoo.png"; // yaha apna logo file rakho
import "./CIISLOADER.css"; // CSS file for styling

const loadingMessages = [
  "Connecting Intelligence...",
  "Securing your workspace...",
  "Loading database clusters...",
  "Syncing intelligence nodes...",
  "Optimizing dashboard interface...",
  "Verifying authentication tokens...",
  "Readying CIIS experience..."
];

export default function CIISLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger fade out
      setFade(false);
      
      // Wait for fade out animation to finish before changing text
      const timeout = setTimeout(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        // Trigger fade in
        setFade(true);
      }, 350); // match transition speed in CSS

      return () => clearTimeout(timeout);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ciis-wrapper">
      <div className="ciis-card">
        {/* Breathing Logo */}
        <img src={logo} alt="CIIS Network" className="ciis-logo" />
        
        {/* Premium Dual Concentric Spinner */}
        <div className="premium-spinner-container">
          <div className="outer-ring"></div>
          <div className="inner-ring"></div>
        </div>

        {/* Dynamic Transition Text */}
        <p className={`loading-text ${fade ? "fade-in" : "fade-out"}`}>
          {loadingMessages[messageIndex]}
        </p>

        {/* Shimmering Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  );
}
