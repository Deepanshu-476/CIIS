import React, { useEffect, useState } from "react";
import "./CIISLOADER.css";

export default function CIISLoader({
  compact = false,
  overlay = false,
  text = "",
  progress = null,
}) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (typeof progress === "number") {
      setPercent(Math.min(100, Math.max(0, Math.round(progress))));
      return;
    }

    let isMounted = true;
    let animFrameId = null;
    const startTime = performance.now();

    const updateProgress = (currentTime) => {
      if (!isMounted) return;
      const elapsed = currentTime - startTime;

      let currentPercent = 0;
      if (elapsed < 300) {
        // Phase 1: 0 to 28%
        const t = elapsed / 300;
        currentPercent = 28 * (1 - Math.pow(1 - t, 2));
      } else if (elapsed < 800) {
        // Phase 2: 28 to 68%
        const t = (elapsed - 300) / 500;
        currentPercent =
          28 +
          40 * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      } else if (elapsed < 1500) {
        // Phase 3: 68 to 89%
        const t = (elapsed - 800) / 700;
        currentPercent = 68 + 21 * Math.sin((t * Math.PI) / 2);
      } else {
        // Phase 4: 89 to 98%
        const t = Math.min(1, (elapsed - 1500) / 2500);
        currentPercent = 89 + 9 * t;
      }

      setPercent(Math.min(99, Math.round(currentPercent)));

      if (elapsed < 4000) {
        animFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animFrameId = requestAnimationFrame(updateProgress);

    return () => {
      isMounted = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [progress]);

  const displayPercent =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : percent;

  return (
    <div
      className={`ciis-wrapper ${compact ? "ciis-compact" : ""} ${
        overlay ? "ciis-overlay" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ciis-card">
        {/* Centered CIIS Logo with gentle breathing pulse */}
        <div className="ciis-logo-box">
          <img
            className="ciis-logo"
            src="/logoo.png"
            alt="CIIS Network"
          />
        </div>

        {/* 100% Animated Progress Bar Line */}
        <div className="ciis-progress-bar-container">
          <div
            className="ciis-progress-bar-fill"
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {/* Status & Progress Info */}
        <div className="ciis-info-row">
          <span className="ciis-percentage-text">{displayPercent}%</span>
          {text ? <span className="ciis-loading-text">{text}</span> : null}
        </div>
      </div>
    </div>
  );
}
