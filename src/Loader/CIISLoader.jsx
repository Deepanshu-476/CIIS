import React, { useState, useEffect } from "react";
import "./CIISLOADER.css"; 

const logo = "/logoo.png";

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
      
      setFade(false);
      
      
      const timeout = setTimeout(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        
        setFade(true);
      }, 350); 

      return () => clearTimeout(timeout);
    }, 2500); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ciis-wrapper">
      <div className="ciis-card">
        
        <img src={logo} alt="CIIS Network" className="ciis-logo" />
        
        
        <div className="premium-spinner-container">
          <div className="outer-ring"></div>
          <div className="inner-ring"></div>
        </div>

        
        <p className={`loading-text ${fade ? "fade-in" : "fade-out"}`}>
          {loadingMessages[messageIndex]}
        </p>

        
        <div className="progress-bar-container">
          <div className="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  );
}
