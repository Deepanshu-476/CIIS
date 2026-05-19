import React, { useState, useEffect } from "react";
import logo from "../../public/logoo.png"; // yaha apna logo file rakho
import "./CIISLOADER.css"; // CSS file for styling - this import is correct

/**
 * A collection of 20+ unique loader animations.
 * Each loader returns JSX and can be styled independently.
 */
const loaderVariants = [
  // 1. Original spinner with dots (classic)
  () => (
    <>
      <div className="spinner"></div>
      <p className="loading-text">Connecting Intelligence...</p>
      <div className="dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </>
  ),

  // 2. Pulse ring
  () => (
    <div className="loader-pulse-ring">
      <div className="ring"></div>
      <p className="loading-text neon">Secure Link</p>
    </div>
  ),

  // 3. Double bounce circles
  () => (
    <div className="loader-double-bounce">
      <div className="bounce1"></div>
      <div className="bounce2"></div>
      <p className="loading-text">Encrypting</p>
    </div>
  ),

  // 4. Wave bars
  () => (
    <div className="loader-wave">
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <p className="loading-text">Handshake</p>
    </div>
  ),

  // 5. Rotating square
  () => (
    <div className="loader-rotating-square">
      <div className="square"></div>
      <p className="loading-text">Authenticating</p>
    </div>
  ),

  // 6. Three bouncing lines
  () => (
    <div className="loader-lines">
      <div className="line"></div>
      <div className="line"></div>
      <div className="line"></div>
      <p className="loading-text">Routing</p>
    </div>
  ),

  // 7. Flickering dots (morse)
  () => (
    <div className="loader-morse">
      <span>.</span>
      <span>.</span>
      <span>.</span>
      <span>-</span>
      <span>-</span>
      <span>-</span>
      <p className="loading-text">Sending</p>
    </div>
  ),

  // 8. Infinity loop
  () => (
    <div className="loader-infinity">
      <svg viewBox="0 0 100 40">
        <path d="M10,20 Q30,5 50,20 T90,20" />
        <path d="M10,20 Q30,35 50,20 T90,20" />
      </svg>
      <p className="loading-text">Connecting</p>
    </div>
  ),

  // 9. Heartbeat
  () => (
    <div className="loader-heartbeat">
      <div className="pulse"></div>
      <p className="loading-text">Signal</p>
    </div>
  ),

  // 10. Atom spin
  () => (
    <div className="loader-atom">
      <div className="orbit"></div>
      <div className="orbit2"></div>
      <div className="orbit3"></div>
      <p className="loading-text">Quantum</p>
    </div>
  ),

  // 11. Hourglass
  () => (
    <div className="loader-hourglass">
      <div className="sand"></div>
      <p className="loading-text">Patience</p>
    </div>
  ),

  // 12. Typing dots (like iMessage)
  () => (
    <div className="loader-typing">
      <span></span>
      <span></span>
      <span></span>
      <p className="loading-text">Receiving</p>
    </div>
  ),

  // 13. Flip box
  () => (
    <div className="loader-flip">
      <div className="flipbox"></div>
      <p className="loading-text">Decoding</p>
    </div>
  ),

  // 14. Clock
  () => (
    <div className="loader-clock">
      <div className="hand"></div>
      <p className="loading-text">Timeout</p>
    </div>
  ),

  // 15. Balls in a circle
  () => (
    <div className="loader-circle-balls">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <p className="loading-text">Syncing</p>
    </div>
  ),

  // 16. Progress bar
  () => (
    <div className="loader-progress">
      <div className="bar"></div>
      <p className="loading-text">Loading...</p>
    </div>
  ),

  // 17. Spinner with text change
  () => (
    <>
      <div className="spinner" style={{ borderTopColor: "#ffaa00" }}></div>
      <p className="loading-text" style={{ color: "#ffe082" }}>
        Warming up
      </p>
    </>
  ),

  // 18. Squares wave
  () => (
    <div className="loader-squares">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <p className="loading-text">Processing</p>
    </div>
  ),

  // 19. Glitch text
  () => (
    <div className="loader-glitch">
      <span data-text="CIIS">CIIS</span>
      <p className="loading-text">Establishing</p>
    </div>
  ),

  // 20. Ripple
  () => (
    <div className="loader-ripple">
      <div></div>
      <div></div>
      <p className="loading-text">Pinging</p>
    </div>
  ),

  // 21. Crosshair
  () => (
    <div className="loader-crosshair">
      <div className="cross"></div>
      <p className="loading-text">Targeting</p>
    </div>
  ),

  // 22. Simple fade (minimal)
  () => (
    <div className="loader-fade">
      <div className="circle"></div>
      <p className="loading-text">Stand by</p>
    </div>
  ),
];

export default function CIISLoader() {
  // Choose a random loader index once when component mounts
  const [loaderIndex] = useState(() =>
    Math.floor(Math.random() * loaderVariants.length)
  );

  // Get the loader component for the chosen index
  const CurrentLoader = loaderVariants[loaderIndex];

  return (
    <div className="ciis-wrapper">
      <div className="ciis-card">
        <img src={logo} alt="CIIS Network" className="ciis-logo" />
        <CurrentLoader />
      </div>
    </div>
  );
}