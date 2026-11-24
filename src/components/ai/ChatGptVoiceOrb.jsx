import React, { useRef, useEffect, useMemo } from 'react';

/**
 * ChatGptVoiceOrb
 * 
 * Recreates the exact OpenAI ChatGPT Advanced Voice Mode fluid orb:
 * - Anti-aliased circular sphere/disk
 * - Upper hemisphere: Deep Electric Royal Blue (#1761f5)
 * - Lower hemisphere: Soft Pastel Powder Sky Blue (#aed1fc)
 * - Center: Organic, undulating, luminous white/cyan cloudy fluid wave
 * - Dynamic audio reactivity ("halchal karta hai baat karte waqt"):
 *   - Speaking: Fast, dramatic harmonic waves, fluid billow, scale breathing, vibrant blue aura
 *   - Listening: Soft rhythmic breathing wave reacting to speech
 *   - Thinking: Contemplative smooth swirling wave
 *   - Paused / Idle: Gentle resting fluid float
 * - WebGL Shader implementation with automatic HTML5 2D Canvas fallback
 */

const VERTEX_SHADER_SRC = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uAudioLevel;
uniform int uState; // 0: idle, 1: listening, 2: thinking, 3: speaking
uniform vec2 uResolution;

void main() {
    // Map to centered coordinates [-1, 1]
    vec2 p = (vUv - 0.5) * 2.0;
    float dist = length(p);

    // Ultra-clean anti-aliased circle boundary with zero jagged edge
    float radius = 0.97;
    float edgeWidth = 0.014;
    float alpha = smoothstep(radius, radius - edgeWidth, dist);
    if (alpha <= 0.0) {
        discard;
    }

    float t = uTime;
    float speed = (uState == 3) ? 2.8 : (uState == 1) ? 1.4 : (uState == 2) ? 1.8 : 0.85;
    float amp = (uState == 3) ? (0.85 + uAudioLevel * 0.95) : (uState == 1) ? 0.45 : (uState == 2) ? 0.55 : 0.32;

    // Multi-frequency harmonic liquid wave along horizontal axis
    float w1 = sin(p.x * 2.5 + t * speed * 1.6) * 0.12;
    float w2 = cos(p.x * 4.6 - t * speed * 2.2) * 0.055;
    float w3 = sin(p.x * 7.8 + t * speed * 1.1) * 0.026;
    float w4 = cos(p.x * 1.3 + t * speed * 0.7) * 0.055;

    // Organic cloudy billow turbulence
    float billow = sin(p.x * 11.0 + t * speed * 1.4) * cos(p.y * 9.0 - t * speed) * 0.018;

    float wave = (w1 + w2 + w3 + w4 + billow) * amp;

    // Wave center sits slightly below equator (matching reference image)
    float waveCenter = -0.05 + wave;
    float dWave = p.y - waveCenter;

    // Color definitions matching user's image exactly:
    // Top: Deep Royal Blue (#1761f5) fading into rich cobalt
    vec3 topBlue = vec3(0.09, 0.38, 0.96);
    vec3 deepBlue = vec3(0.06, 0.22, 0.80);
    
    // Bottom: Soft Powder Sky Blue (#aed1fc) fading to light pastel
    vec3 bottomSky = vec3(0.62, 0.78, 0.98);
    vec3 bottomLavender = vec3(0.78, 0.88, 1.0);

    // Luminous White core & Cyan mist along wave
    vec3 whiteCore = vec3(1.0, 1.0, 1.0);
    vec3 cyanMist = vec3(0.80, 0.92, 1.0);

    // Base background hemisphere colors
    vec3 baseColor;
    if (p.y > waveCenter) {
        float f = clamp((p.y - waveCenter) / (1.0 - waveCenter), 0.0, 1.0);
        baseColor = mix(topBlue, deepBlue, f * 0.35);
    } else {
        float f = clamp((waveCenter - p.y) / (waveCenter + 1.0), 0.0, 1.0);
        baseColor = mix(bottomSky, bottomLavender, f * 0.55);
    }

    // Dense cloudy luminous white mist along the wave crest
    float mistThickness = (uState == 3) ? 0.22 : 0.17;
    float mist = exp(-pow(dWave / mistThickness, 2.0));

    // Secondary soft billowing cloud layer
    float w2nd = sin(p.x * 3.2 - t * speed * 1.2 + 0.8) * 0.08 * amp;
    float mist2 = exp(-pow((p.y - (-0.08 + w2nd)) / (mistThickness * 1.6), 2.0)) * 0.45;

    float totalMist = clamp(mist + mist2, 0.0, 1.0);
    vec3 mistColor = mix(cyanMist, whiteCore, mist);

    vec3 finalColor = mix(baseColor, mistColor, totalMist * 0.95);

    // Subtle 3D sphere depth shading towards edges
    float sphereFactor = sqrt(max(0.0, 1.0 - (dist / radius) * (dist / radius)));
    finalColor *= (0.88 + 0.12 * sphereFactor);

    gl_FragColor = vec4(finalColor * alpha, alpha);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compilation failed: ' + info);
  }
  return shader;
}

function initWebGL(canvas) {
  try {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      // Keep the canvas fully transparent outside the circular shader.
      // This prevents a dark rectangular strip behind the orb in Chromium.
      premultipliedAlpha: true,
    });
    if (!gl) return null;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    // Full-screen quad
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'uTime');
    const uAudioLevel = gl.getUniformLocation(program, 'uAudioLevel');
    const uState = gl.getUniformLocation(program, 'uState');
    const uResolution = gl.getUniformLocation(program, 'uResolution');

    return { gl, program, uniforms: { uTime, uAudioLevel, uState, uResolution } };
  } catch (err) {
    console.warn('[ChatGptVoiceOrb] WebGL init fallback to 2D:', err);
    return null;
  }
}

/**
 * 2D Canvas Fallback renderer for environments without WebGL
 */
function render2DFallback(ctx, width, height, time, audioLevel, state) {
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.46;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // 1. Background gradient (Top Blue -> Bottom Sky Blue)
  const bgGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
  bgGrad.addColorStop(0, '#1761f5');
  bgGrad.addColorStop(0.45, '#1e40af');
  bgGrad.addColorStop(0.55, '#93c5fd');
  bgGrad.addColorStop(1, '#bfdbfe');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Center undulating white fluid wave
  const speed = state === 'speaking' ? 3.0 : state === 'listening' ? 1.4 : 0.9;
  const amp = (state === 'speaking' ? 14 + audioLevel * 18 : 8) * (radius / 100);

  ctx.beginPath();
  ctx.moveTo(cx - radius - 10, cy + radius + 10);
  for (let x = cx - radius - 10; x <= cx + radius + 10; x += 4) {
    const normX = (x - cx) / radius;
    const waveY =
      cy +
      Math.sin(normX * 2.8 + time * speed * 1.5) * amp +
      Math.cos(normX * 5.0 - time * speed * 2.0) * (amp * 0.45);
    ctx.lineTo(x, waveY);
  }
  ctx.lineTo(cx + radius + 10, cy + radius + 10);
  ctx.closePath();

  // Wave fill with soft white/sky-blue gradient
  const waveGrad = ctx.createLinearGradient(cx, cy - amp * 2, cx, cy + radius);
  waveGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
  waveGrad.addColorStop(0.25, 'rgba(224, 242, 254, 0.92)');
  waveGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.85)');
  waveGrad.addColorStop(1, 'rgba(147, 197, 253, 0.8)');
  ctx.fillStyle = waveGrad;
  ctx.fill();

  ctx.restore();
}

export default function ChatGptVoiceOrb({
  state = 'idle', // 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused'
  size = 200,
  onClick,
  className = '',
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioLevelRef = useRef(0.0);
  const startTimeRef = useRef(performance.now());

  // Dynamic state code mapping
  const stateCode = useMemo(() => {
    switch (state) {
      case 'speaking':
        return 3;
      case 'thinking':
        return 2;
      case 'listening':
        return 1;
      default:
        return 0; // idle or paused
    }
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const webglContext = initWebGL(canvas);
    let ctx2d = null;
    if (!webglContext) {
      ctx2d = canvas.getContext('2d');
    }

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000.0;

      // Realistic speech modulation rhythm when speaking
      if (state === 'speaking') {
        const speechEnvelope =
          0.45 +
          0.35 * Math.sin(elapsed * 7.5) * Math.cos(elapsed * 3.8) +
          0.20 * Math.sin(elapsed * 14.0);
        audioLevelRef.current += (Math.max(0.0, speechEnvelope) - audioLevelRef.current) * 0.18;
      } else if (state === 'listening') {
        const breathe = 0.25 + 0.15 * Math.sin(elapsed * 2.2);
        audioLevelRef.current += (breathe - audioLevelRef.current) * 0.1;
      } else {
        audioLevelRef.current += (0.05 - audioLevelRef.current) * 0.1;
      }

      if (webglContext) {
        const { gl, program, uniforms } = webglContext;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.uniform1f(uniforms.uTime, elapsed);
        gl.uniform1f(uniforms.uAudioLevel, audioLevelRef.current);
        gl.uniform1i(uniforms.uState, stateCode);
        gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (ctx2d) {
        render2DFallback(ctx2d, canvas.width, canvas.height, elapsed, audioLevelRef.current, state);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [size, state, stateCode]);

  // Dynamic pulsing scale & glow matching ChatGPT voice mode
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';

  return (
    <div
      className={`chatgpt-voice-orb-wrap ${state} ${className}`}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      role="button"
      tabIndex={-1}
      title={
        isSpeaking
          ? 'AI bol raha hai (Tap to stop)'
          : isListening
          ? 'AI sun raha hai (Tap to pause)'
          : 'Tap to speak'
      }
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease',
        transform: isSpeaking ? 'scale(1.03)' : isListening ? 'scale(1.01)' : 'scale(1.0)',
        filter: isSpeaking
          ? 'drop-shadow(0 4px 18px rgba(23, 97, 245, 0.35)) drop-shadow(0 0 10px rgba(96, 165, 250, 0.25))'
          : isListening
          ? 'drop-shadow(0 4px 14px rgba(23, 97, 245, 0.28))'
          : 'drop-shadow(0 2px 8px rgba(23, 97, 245, 0.18))',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'block',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
      />
    </div>
  );
}
