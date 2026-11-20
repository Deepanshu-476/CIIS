import React, { useState } from 'react';
import VoiceOrb from './VoiceOrb';
import useAudioAnalyser from './useAudioAnalyser';

/**
 * VoiceOrbDemo
 * Interactive test bed for VoiceOrb with 4 states, Mic toggle, and real-time audio amplitude
 */
export default function VoiceOrbDemo() {
    const [state, setState] = useState('listening');
    const { isMicActive, toggleMic, micError, analyserNode, amplitude } = useAudioAnalyser({
        fakeSpeaking: state === 'speaking'
    });

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#0a0a0a',
                color: '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif',
                padding: '24px'
            }}
        >
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: '#22d3ee' }}>
                3D AI Voice Orb
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px' }}>
                Three.js GLSL Shader Ribbon • Additive Bloom • Audio Reactive
            </p>

            {/* 3D Voice Orb */}
            <div
                style={{
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)'
                }}
            >
                <VoiceOrb
                    state={state}
                    audioSource={isMicActive ? analyserNode : null}
                    size={300}
                    transparent={true}
                />
            </div>

            {/* State Badges & Amplitude Readout */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <span
                    style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background:
                            state === 'speaking'
                                ? 'rgba(34, 211, 238, 0.2)'
                                : state === 'listening'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(100, 116, 139, 0.2)',
                        color:
                            state === 'speaking'
                                ? '#22d3ee'
                                : state === 'listening'
                                ? '#60a5fa'
                                : '#94a3b8',
                        border: `1px solid ${
                            state === 'speaking'
                                ? 'rgba(34, 211, 238, 0.4)'
                                : state === 'listening'
                                ? 'rgba(59, 130, 246, 0.4)'
                                : 'rgba(100, 116, 139, 0.3)'
                        }`
                    }}
                >
                    State: {state}
                </span>

                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Amplitude: <strong style={{ color: '#2dd4bf' }}>{(amplitude * 100).toFixed(0)}%</strong>
                </span>
            </div>

            {/* 4 State Buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {['idle', 'listening', 'speaking', 'paused'].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setState(s)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            background: state === s ? '#0284c7' : '#1e293b',
                            color: '#ffffff',
                            border: `1px solid ${state === s ? '#38bdf8' : '#334155'}`,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Mic Toggle Button */}
            <button
                type="button"
                onClick={toggleMic}
                style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isMicActive ? '#ef4444' : '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                }}
            >
                <span>{isMicActive ? '🔴 Stop Mic' : '🎤 Use Mic'}</span>
            </button>

            {micError && (
                <p style={{ color: '#f87171', fontSize: '12px', marginTop: 12 }}>
                    ⚠️ {micError}
                </p>
            )}
        </div>
    );
}
