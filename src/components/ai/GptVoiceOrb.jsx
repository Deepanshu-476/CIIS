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

    let currentScale = 1.0;
    let currentRotation = 0;

    const render = () => {
      const currentState = stateRef.current;
      const currentAmp = ampRef.current;

      const isPaused = currentState === 'paused' || currentState === 'idle';
      const isListening = currentState === 'listening';
      const isSpeaking = currentState === 'speaking';
      const isThinking = currentState === 'thinking';

      // Speed rates
      const timeSpeed = isPaused ? 0.012 : isThinking ? 0.045 : isSpeaking ? 0.036 : 0.024;
      time += timeSpeed;

      const rotSpeed = isThinking ? 0.025 : isSpeaking ? 0.008 : 0.004;
      currentRotation += rotSpeed;

      // Handle Retina / High DPI
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

      // Dynamic breathing scale
      let targetScale = 1.0;
      if (isSpeaking) {
        targetScale = 1.0 + Math.sin(time * 3.5) * 0.05 + currentAmp * 0.22;
      } else if (isListening) {
        targetScale = 1.0 + Math.sin(time * 2.5) * 0.025 + currentAmp * 0.14;
      } else if (isThinking) {
        targetScale = 1.0 + Math.sin(time * 4) * 0.04;
      } else {
        targetScale = 1.0 + Math.sin(time * 1.5) * 0.02;
      }
      currentScale += (targetScale - currentScale) * 0.15;

      // Calculate perimeter harmonic wave ripples
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
          const w1 = Math.sin(a * 3 - time * 2.6) * (4 + currentAmp * 15);
          const w2 = Math.cos(a * 2 + time * 2.1) * (3 + currentAmp * 10);
          const w3 = Math.sin(a * 4 - time * 1.6) * (2 + currentAmp * 6);
          deformation = w1 + w2 + w3;
        } else if (isThinking) {
          const w1 = Math.sin(a * 3 - time * 5) * 6;
          const w2 = Math.cos(a * 2 + time * 3.5) * 4;
          deformation = w1 + w2;
        } else {
          deformation = Math.sin(a * 2 + time * 1.5) * 1.5;
        }

        const targetR = (baseRadius + deformation) * currentScale;
        pt.currentRadius += (targetR - pt.currentRadius) * 0.18;
      }

      // Build closed spline curve path
      const coords = points.map((pt) => {
        const a = pt.angle + currentRotation;
        return {
          x: centerX + Math.cos(a) * pt.currentRadius,
          y: centerY + Math.sin(a) * pt.currentRadius,
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

      // 1. Base Gradient (Soft azure sky)
      const baseGrad = ctx.createLinearGradient(
        centerX,
        centerY - baseRadius * 1.2,
        centerX,
        centerY + baseRadius * 1.2
      );
      baseGrad.addColorStop(0, '#93c5fd');   // light sky blue
      baseGrad.addColorStop(0.4, '#60a5fa'); // celestial blue
      baseGrad.addColorStop(0.8, '#3b82f6'); // rich azure
      baseGrad.addColorStop(1, '#1d4ed8');   // deep cobalt
      ctx.fillStyle = baseGrad;
      ctx.fill();

      // 2. Swirling glowing white cloud layer (matches the white luminous core in user image)
      const cloudX = centerX + Math.cos(time * 1.8) * (baseRadius * 0.25);
      const cloudY = centerY - baseRadius * 0.35 + Math.sin(time * 1.5) * (baseRadius * 0.15);
      const cloudRadius = baseRadius * (0.85 + currentAmp * 0.35);

      const cloudGrad = ctx.createRadialGradient(
        cloudX,
        cloudY,
        baseRadius * 0.05,
        cloudX,
        cloudY,
        cloudRadius
      );
      cloudGrad.addColorStop(0, '#ffffff');
      cloudGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.85)');
      cloudGrad.addColorStop(0.75, 'rgba(186, 230, 253, 0.45)');
      cloudGrad.addColorStop(1, 'rgba(96, 165, 250, 0)');

      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloudRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Second luminous atmospheric swirl
      const swirlX = centerX + Math.sin(-time * 1.4) * (baseRadius * 0.3);
      const swirlY = centerY + baseRadius * 0.1 + Math.cos(time * 1.2) * (baseRadius * 0.2);
      const swirlRadius = baseRadius * 0.7;

      const swirlGrad = ctx.createRadialGradient(
        swirlX,
        swirlY,
        baseRadius * 0.05,
        swirlX,
        swirlY,
        swirlRadius
      );
      swirlGrad.addColorStop(0, 'rgba(224, 242, 254, 0.75)');
      swirlGrad.addColorStop(0.5, 'rgba(147, 197, 253, 0.35)');
      swirlGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.fillStyle = swirlGrad;
      ctx.beginPath();
      ctx.arc(swirlX, swirlY, swirlRadius, 0, Math.PI * 2);
      ctx.fill();

      // 4. Subtle top specular sheen (gives 3D lens depth)
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY - baseRadius * 0.5,
        baseRadius * 0.6,
        baseRadius * 0.25,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
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

