import React from 'react';
import VoiceOrb from './VoiceOrb';

/**
 * AuraFluidRing (3D Animated Three.js AI Voice Orb)
 * 
 * Implemented with:
 * - Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing Bloom
 * - Custom GLSL vertex + fragment shaders (3D Simplex noise displacement)
 * - Color gradient: #22d3ee (cyan) -> #3b82f6 (blue) -> #2dd4bf (teal)
 * - Additive blending, transparent material, depthWrite: false
 * - Full audio reactivity (scale pulsing + wave displacement on speaking)
 * - Smooth lerp state transitions (idle, listening, speaking, paused)
 */
const AuraFluidRing = ({ orbState = 'listening', onClick, size = 130 }) => {
    // Map orbState to VoiceOrb states
    const mappedState =
        orbState === 'speaking'
            ? 'speaking'
            : orbState === 'listening'
            ? 'listening'
            : orbState === 'paused'
            ? 'paused'
            : 'idle';

    const canvasSize = Math.round(size * 0.95);

    return (
        <div
            className={`ai-aura-ring-container ${orbState}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            title={
                orbState === 'listening'
                    ? 'Listening... (Tap to pause)'
                    : orbState === 'paused'
                    ? 'Paused (Tap to speak)'
                    : orbState === 'speaking'
                    ? 'CIIS AI speaking (Tap to stop)'
                    : 'Processing…'
            }
            style={{
                width: size,
                height: size,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
            }}
        >
            {/* Ambient Cosmic Halo Behind 3D Orb */}
            <div
                className={`ai-aura-cosmic-halo ${orbState === 'speaking' ? 'active' : ''}`}
                style={{ width: size, height: size }}
            />

            {/* 3D Three.js GLSL Shader Ribbon Orb */}
            <VoiceOrb
                state={mappedState}
                size={canvasSize}
                transparent={true}
            />
        </div>
    );
};

export default AuraFluidRing;
