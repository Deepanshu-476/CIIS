import React, { useRef, useEffect } from 'react';
import useAudioAnalyser from './useAudioAnalyser';

/**
 * GptVoiceOrb
 * Recreates the authentic ChatGPT Advanced Voice Mode fluid sphere:
 * - Pristine, smooth circular boundary
 * - NO glass reflection / specular lens shine
 * - NO white pin-point dot in the center ("white bindu removed")
 * - Smooth, diffused horizontal luminous cloud nebula across the center
 * - Soft celestial base gradient with internal fluid motion ("hil-jhul")
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
    let smoothAmp = 0;

    const render = () => {
      const currentState = stateRef.current;
      const targetAmp = ampRef.current || 0;

      // Smooth amplitude tracking for fluid organic reaction
      smoothAmp += (targetAmp - smoothAmp) * 0.2;

      const isPaused = currentState === 'paused' || currentState === 'idle';
      const isListening = currentState === 'listening';
      const isSpeaking = currentState === 'speaking';
      const isThinking = currentState === 'thinking';

      // Conversational state speed adjustments
      const timeSpeed = isPaused ? 0.012 : isThinking ? 0.04 : isSpeaking ? 0.034 : 0.022;
      time += timeSpeed;

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

      // 1. Soft Ambient Atmospheric Outer Glow (Aura, clean circular blur)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.shadowBlur = isSpeaking ? 24 : isListening ? 18 : 12;
      ctx.shadowColor = isSpeaking
        ? 'rgba(59, 130, 246, 0.45)'
        : isListening
        ? 'rgba(14, 165, 233, 0.4)'
        : 'rgba(59, 130, 246, 0.25)';
      ctx.fillStyle = '#1e40af';
      ctx.fill();
      ctx.restore();

      // 2. Strictly clip inside the pristine CIRCLE boundary
      // All fluid ripples and internal motion ("hil-jhul") stay INSIDE
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      // 2a. Base celestial gradient:
      // Deep royal blue at top down to soft sky-blue at bottom (like original ChatGPT orb)
      const baseGrad = ctx.createLinearGradient(
        centerX,
        centerY - baseRadius,
        centerX,
        centerY + baseRadius
      );
      baseGrad.addColorStop(0, '#1e40af');     // Deep royal blue top
      baseGrad.addColorStop(0.24, '#2563eb');  // Intense celestial azure
      baseGrad.addColorStop(0.55, '#3b82f6');  // Sky azure
      baseGrad.addColorStop(0.82, '#93c5fd');  // Soft sky-blue
      baseGrad.addColorStop(1, '#bfdbfe');     // Pastel baby blue bottom
      ctx.fillStyle = baseGrad;
      ctx.fillRect(centerX - baseRadius - 2, centerY - baseRadius - 2, (baseRadius + 2) * 2, (baseRadius + 2) * 2);

      // 2b. Horizontal drifting luminous cloud band across middle (Diffused soft light, NO white center dot / bindu)
      const cloudX = centerX + Math.cos(time * 1.5) * (baseRadius * 0.16);
      const cloudY = centerY - baseRadius * 0.05 + Math.sin(time * 1.2) * (baseRadius * 0.09);

      ctx.save();
      ctx.translate(cloudX, cloudY);
      ctx.scale(1.35, 0.6); // Wide horizontal stretch across the sphere

      const cloudHeight = baseRadius * (0.8 + smoothAmp * 0.35);
      const cloudGrad = ctx.createLinearGradient(0, -cloudHeight, 0, cloudHeight);
      cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      cloudGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
      cloudGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.42)'); // Soft diffused light, NO sharp dot!
      cloudGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
      cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * (0.92 + smoothAmp * 0.25), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2c. Soft organic fluid swirl for depth (No white dot)
      const swirlX = centerX + Math.sin(-time * 1.3) * (baseRadius * 0.2);
      const swirlY = centerY - baseRadius * 0.12 + Math.cos(time * 1.4) * (baseRadius * 0.12);
      const swirlRadius = baseRadius * 0.72;

      const swirlGrad = ctx.createRadialGradient(
        swirlX,
        swirlY,
        baseRadius * 0.18, // Wide inner radius so it never concentrates into a dot
        swirlX,
        swirlY,
        swirlRadius
      );
      swirlGrad.addColorStop(0, 'rgba(186, 230, 253, 0.35)');
      swirlGrad.addColorStop(0.55, 'rgba(96, 165, 250, 0.15)');
      swirlGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.fillStyle = swirlGrad;
      ctx.beginPath();
      ctx.arc(swirlX, swirlY, swirlRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2d. Bottom subtle atmospheric glow
      const bottomX = centerX + Math.cos(time * 1.1) * (baseRadius * 0.1);
      const bottomY = centerY + baseRadius * 0.45;
      const bottomRadius = baseRadius * 0.6;
      const bottomGrad = ctx.createRadialGradient(
        bottomX,
        bottomY,
        baseRadius * 0.15,
        bottomX,
        bottomY,
        bottomRadius
      );
      bottomGrad.addColorStop(0, 'rgba(191, 219, 254, 0.3)');
      bottomGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
      ctx.fillStyle = bottomGrad;
      ctx.beginPath();
      ctx.arc(bottomX, bottomY, bottomRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore clipping context
      ctx.restore(); // Restore dpr scaling context

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
