import React, { useRef, useEffect } from 'react';
import useAudioAnalyser from './useAudioAnalyser';

/**
 * GptVoiceOrb
 * Recreates the authentic ChatGPT Advanced Voice Mode fluid sphere:
 * - Smooth, matte circular perimeter without artificial glass highlights or lens reflections
 * - ALL dynamic fluid waves ("hil-jhul"), swirling cloud nebula, and audio reactivity
 *   happen strictly INSIDE the circle (clipped to circle perimeter)
 * - Multi-layered nebula:
 *   - Top: deep celestial royal blue (#1d4ed8 ~ #2563eb)
 *   - Middle: horizontal drifting, luminous cloud nebula that smoothly pulses with voice amplitude
 *   - Bottom: soft ethereal sky-blue (#93c5fd ~ #bfdbfe)
 *   - Soft ambient atmospheric glow around circle (no harsh glass shine)
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
      smoothAmp += (targetAmp - smoothAmp) * 0.22;

      const isPaused = currentState === 'paused' || currentState === 'idle';
      const isListening = currentState === 'listening';
      const isSpeaking = currentState === 'speaking';
      const isThinking = currentState === 'thinking';

      // Conversational state speed adjustments
      const timeSpeed = isPaused ? 0.012 : isThinking ? 0.042 : isSpeaking ? 0.035 : 0.022;
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

      // 1. Soft Ambient Atmospheric Outer Glow (Soft aura, no harsh glass rim)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.shadowBlur = isSpeaking ? 24 : isListening ? 18 : 12;
      ctx.shadowColor = isSpeaking
        ? 'rgba(59, 130, 246, 0.45)'
        : isListening
        ? 'rgba(14, 165, 233, 0.4)'
        : 'rgba(59, 130, 246, 0.22)';
      ctx.fillStyle = '#1d4ed8';
      ctx.fill();
      ctx.restore();

      // 2. Strictly clip inside the pristine CIRCLE boundary
      // All fluid ripples, swirling clouds, and internal motion ("hil-jhul") stay INSIDE
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      // 2a. Base celestial gradient:
      // Top celestial royal blue down to soft sky-blue at bottom (warm matte nebula feel)
      const baseGrad = ctx.createLinearGradient(
        centerX,
        centerY - baseRadius,
        centerX,
        centerY + baseRadius
      );
      baseGrad.addColorStop(0, '#1e40af');     // Deep royal blue top
      baseGrad.addColorStop(0.26, '#2563eb');  // Intense celestial azure
      baseGrad.addColorStop(0.58, '#3b82f6');  // Sky azure
      baseGrad.addColorStop(0.84, '#93c5fd');  // Soft sky-blue
      baseGrad.addColorStop(1, '#bfdbfe');     // Pastel baby blue bottom
      ctx.fillStyle = baseGrad;
      ctx.fillRect(centerX - baseRadius - 2, centerY - baseRadius - 2, (baseRadius + 2) * 2, (baseRadius + 2) * 2);

      // 2b. Internal organic fluid wave harmonics ("hil-jhul")
      // Three undulating harmonic liquid layers inside the sphere reacting to audio amplitude
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const waveSpeed = time * (1.7 + w * 0.6);
        const waveAmp = (4 + w * 3) + smoothAmp * (10 + w * 6);
        const waveY = centerY + (w - 0.9) * (baseRadius * 0.28) + Math.sin(waveSpeed * 0.7) * (baseRadius * 0.08);

        ctx.beginPath();
        ctx.moveTo(centerX - baseRadius, centerY + baseRadius);
        ctx.lineTo(centerX - baseRadius, waveY);

        const segments = 16;
        const step = (baseRadius * 2) / segments;
        for (let s = 0; s <= segments; s++) {
          const x = centerX - baseRadius + s * step;
          const nx = (s / segments) * Math.PI * 2;
          const y = waveY +
            Math.sin(nx * 2 + waveSpeed) * waveAmp * 0.55 +
            Math.cos(nx * 3 - waveSpeed * 1.3) * (waveAmp * 0.35);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(centerX + baseRadius, centerY + baseRadius);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(centerX, waveY - waveAmp, centerX, centerY + baseRadius);
        if (w === 0) {
          waveGrad.addColorStop(0, 'rgba(147, 197, 253, 0.32)');
          waveGrad.addColorStop(1, 'rgba(59, 130, 246, 0.06)');
        } else if (w === 1) {
          waveGrad.addColorStop(0, 'rgba(224, 242, 254, 0.4)');
          waveGrad.addColorStop(1, 'rgba(191, 219, 254, 0.1)');
        } else {
          waveGrad.addColorStop(0, 'rgba(224, 242, 254, 0.25)');
          waveGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
        }
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      // 2c. Middle horizontal drifting glowing cloud nebula (soft diffused core, no hard glass glare)
      // Expands and swirls with voice amplitude
      const cloudX = centerX + Math.cos(time * 1.4) * (baseRadius * 0.16) + Math.sin(time * 2.2) * (baseRadius * 0.06);
      const cloudY = centerY - baseRadius * 0.05 + Math.sin(time * 1.1) * (baseRadius * 0.1);
      const cloudRadius = baseRadius * (0.8 + smoothAmp * 0.42);

      ctx.save();
      ctx.translate(cloudX, cloudY);
      ctx.scale(1.24, 0.66); // Horizontal elliptical stretch matching authentic nebula

      const cloudGrad = ctx.createRadialGradient(
        0, 0, baseRadius * 0.04,
        0, 0, cloudRadius
      );
      cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
      cloudGrad.addColorStop(0.3, 'rgba(240, 249, 255, 0.78)');
      cloudGrad.addColorStop(0.58, 'rgba(224, 242, 254, 0.48)');
      cloudGrad.addColorStop(0.85, 'rgba(147, 197, 253, 0.16)');
      cloudGrad.addColorStop(1, 'rgba(96, 165, 250, 0)');

      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(0, 0, cloudRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2d. Second luminous swirling atmospheric vortex for organic liquid depth
      const vortexAngle = -time * 1.5;
      const vortexDist = baseRadius * (0.16 + smoothAmp * 0.1);
      const vortexX = centerX + Math.cos(vortexAngle) * vortexDist;
      const vortexY = centerY - baseRadius * 0.16 + Math.sin(vortexAngle * 1.2) * (baseRadius * 0.08);
      const vortexRadius = baseRadius * (0.58 + smoothAmp * 0.28);

      const vortexGrad = ctx.createRadialGradient(
        vortexX, vortexY, baseRadius * 0.02,
        vortexX, vortexY, vortexRadius
      );
      vortexGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      vortexGrad.addColorStop(0.42, 'rgba(186, 230, 253, 0.38)');
      vortexGrad.addColorStop(0.8, 'rgba(96, 165, 250, 0.1)');
      vortexGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

      ctx.fillStyle = vortexGrad;
      ctx.beginPath();
      ctx.arc(vortexX, vortexY, vortexRadius, 0, Math.PI * 2);
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
