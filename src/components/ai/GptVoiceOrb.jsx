import React, { useRef, useEffect } from 'react';
import useAudioAnalyser from './useAudioAnalyser';

/**
 * GptVoiceOrb
 * Recreates the exact ChatGPT Advanced Voice Mode fluid sphere from reference image:
 * - Circular sphere with organic liquid ripples on boundary
 * - Internal atmospheric sky-blue and white glowing cloud nebula
 * - Real-time audio reactivity: bulges, waves, and pulses with user speech & AI speech
 * - 60fps lightweight Canvas 2D
 */
export default function GptVoiceOrb({
  state = 'listening', // 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused'
  size = 110,
  onClick,
  className = '',
}) {
  const canvasRef = useRef(null);

  // Hook real-time mic / speaker audio amplitude
  const { amplitude } = useAudioAnalyser({
    fakeSpeaking: state === 'speaking',
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const ampRef = useRef(amplitude);
  ampRef.current = amplitude;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // 16 control points around circle perimeter for fluid ripple boundary
    const numPoints = 16;
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        angle: (i / numPoints) * Math.PI * 2,
        currentRadius: 0,
      });
    }

    let currentScaleX = 1.0;
    let currentScaleY = 1.0;
    let currentRotation = 0;

    const render = () => {
      const currentState = stateRef.current;
      const currentAmp = ampRef.current;

      const isPaused = currentState === 'paused' || currentState === 'idle';
      const isListening = currentState === 'listening';
      const isSpeaking = currentState === 'speaking';
      const isThinking = currentState === 'thinking';

      // Speed rates based on conversational state
      const timeSpeed = isPaused ? 0.012 : isThinking ? 0.045 : isSpeaking ? 0.038 : 0.024;
      time += timeSpeed;

      const rotSpeed = isThinking ? 0.028 : isSpeaking ? 0.009 : 0.004;
      currentRotation += rotSpeed;

      // Handle Retina / High DPI display
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = size;
      const height = size;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = size * 0.38;

      // Organic Squash & Stretch inertia: scaleX and scaleY dynamic breathing
      let targetScaleX = 1.0;
      let targetScaleY = 1.0;
      if (isSpeaking) {
        targetScaleX = 1.0 + Math.sin(time * 3.4) * 0.04 + currentAmp * 0.16;
        targetScaleY = 1.0 - Math.sin(time * 3.4) * 0.03 + currentAmp * 0.22;
      } else if (isListening) {
        targetScaleX = 1.0 + Math.sin(time * 2.4) * 0.025 + currentAmp * 0.12;
        targetScaleY = 1.0 - Math.sin(time * 2.4) * 0.02 + currentAmp * 0.15;
      } else if (isThinking) {
        targetScaleX = 1.0 + Math.sin(time * 4) * 0.035;
        targetScaleY = 1.0 - Math.sin(time * 4) * 0.035;
      } else {
        // Paused / Idle: subtle sine oscillation (~1.2s period)
        targetScaleX = 1.0 + Math.sin(time * 1.5) * 0.02;
        targetScaleY = 1.0 + Math.sin(time * 1.5) * 0.02;
      }
      currentScaleX += (targetScaleX - currentScaleX) * 0.16;
      currentScaleY += (targetScaleY - currentScaleY) * 0.16;

      // Calculate perimeter harmonic wave ripples (16-point cubic/quadratic spline)
      for (let i = 0; i < numPoints; i++) {
        const pt = points[i];
        const a = pt.angle + currentRotation;

        let deformation = 0;
        if (isSpeaking) {
          const w1 = Math.sin(a * 4 - time * 4.2) * (7 + currentAmp * 20);
          const w2 = Math.cos(a * 3 + time * 3.2) * (5 + currentAmp * 14);
          const w3 = Math.sin(a * 5 - time * 2.5) * (3 + currentAmp * 8);
          deformation = w1 + w2 + w3;
        } else if (isListening) {
          const w1 = Math.sin(a * 3 - time * 2.6) * (4 + currentAmp * 16);
          const w2 = Math.cos(a * 2 + time * 2.1) * (3 + currentAmp * 11);
          const w3 = Math.sin(a * 4 - time * 1.6) * (2 + currentAmp * 7);
          deformation = w1 + w2 + w3;
        } else if (isThinking) {
          const w1 = Math.sin(a * 3 - time * 5) * 6;
          const w2 = Math.cos(a * 2 + time * 3.5) * 4;
          deformation = w1 + w2;
        } else {
          deformation = Math.sin(a * 2 + time * 1.5) * 1.5;
        }

        const targetR = baseRadius + deformation;
        pt.currentRadius += (targetR - pt.currentRadius) * 0.18;
      }

      // Calculate coordinates with squash & stretch applied
      const coords = points.map((pt) => {
        const a = pt.angle + currentRotation;
        return {
          x: centerX + Math.cos(a) * pt.currentRadius * currentScaleX,
          y: centerY + Math.sin(a) * pt.currentRadius * currentScaleY,
        };
      });

      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const curr = coords[i];
        const next = coords[(i + 1) % numPoints];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;

        if (i === 0) {
          ctx.moveTo(midX, midY);
        } else {
          ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        }
      }
      ctx.closePath();

      // Outer Ambient Soft Atmospheric Glow
      ctx.shadowBlur = isSpeaking ? 32 : isListening ? 24 : 16;
      ctx.shadowColor = isSpeaking
        ? 'rgba(96, 165, 250, 0.65)'
        : isListening
        ? 'rgba(56, 189, 248, 0.55)'
        : 'rgba(99, 102, 241, 0.35)';

      // Clip inside spline boundary to draw the authentic ChatGPT fluid cloud
      ctx.save();
      ctx.clip();

      // 1. Base Gradient: Deep royal celestial blue on top down to ethereal baby blue on bottom (Matches reference screenshot 1:1)
      const baseGrad = ctx.createLinearGradient(
        centerX,
        centerY - baseRadius * 1.05,
        centerX,
        centerY + baseRadius * 1.05
      );
      baseGrad.addColorStop(0, '#1e40af');   // deep cobalt/royal blue at top
      baseGrad.addColorStop(0.22, '#2563eb'); // intense celestial azure
      baseGrad.addColorStop(0.55, '#60a5fa'); // sky blue
      baseGrad.addColorStop(0.85, '#93c5fd'); // ethereal baby blue
      baseGrad.addColorStop(1, '#bfdbfe');   // soft pastel blue at bottom
      ctx.fillStyle = baseGrad;
      ctx.fill();

      // 2. Swirling glowing white cloud nebula band across middle (Matches luminous core in reference image)
      const cloudX = centerX + Math.cos(time * 1.6) * (baseRadius * 0.16);
      const cloudY = centerY - baseRadius * 0.06 + Math.sin(time * 1.2) * (baseRadius * 0.1);

      ctx.save();
      ctx.translate(cloudX, cloudY);
      ctx.scale(1.22, 0.65); // Elliptical horizontal stretch matching the screenshot
      const cloudGrad = ctx.createRadialGradient(
        0,
        0,
        baseRadius * 0.04,
        0,
        0,
        baseRadius * (0.85 + currentAmp * 0.35)
      );
      cloudGrad.addColorStop(0, '#ffffff');
      cloudGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.96)');
      cloudGrad.addColorStop(0.65, 'rgba(224, 242, 254, 0.58)');
      cloudGrad.addColorStop(0.92, 'rgba(147, 197, 253, 0.15)');
      cloudGrad.addColorStop(1, 'rgba(96, 165, 250, 0)');

      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * (0.85 + currentAmp * 0.35), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Second luminous atmospheric swirl for organic internal fluid depth
      const swirlX = centerX + Math.sin(-time * 1.3) * (baseRadius * 0.22);
      const swirlY = centerY - baseRadius * 0.18 + Math.cos(time * 1.4) * (baseRadius * 0.14);
      const swirlRadius = baseRadius * 0.65;

      const swirlGrad = ctx.createRadialGradient(
        swirlX,
        swirlY,
        baseRadius * 0.03,
        swirlX,
        swirlY,
        swirlRadius
      );
      swirlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      swirlGrad.addColorStop(0.42, 'rgba(186, 230, 253, 0.45)');
      swirlGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.fillStyle = swirlGrad;
      ctx.beginPath();
      ctx.arc(swirlX, swirlY, swirlRadius, 0, Math.PI * 2);
      ctx.fill();

      // 4. Subtle top specular sheen (gives 3D spherical lens depth)
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY - baseRadius * 0.48,
        baseRadius * 0.55,
        baseRadius * 0.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fill();

      ctx.restore(); // restore clipping
      ctx.restore(); // restore state

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size]);

  return (
    <div
      className={`gpt-voice-orb-container ${state} ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={
        state === 'listening'
          ? 'Listening… (Tap to pause)'
          : state === 'speaking'
          ? 'CIIS AI Speaking… (Tap to stop)'
          : 'Tap to speak'
      }
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          display: 'block',
        }}
      />
    </div>
  );
}

