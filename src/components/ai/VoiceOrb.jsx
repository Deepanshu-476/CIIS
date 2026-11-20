import React, { useRef, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './VoiceOrbShaders';
import useAudioAnalyser from './useAudioAnalyser';

/**
 * ErrorBoundary to guarantee the host page NEVER goes blank
 */
class OrbErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.warn('[VoiceOrb] Error caught by boundary:', error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 70%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                />
            );
        }
        return this.props.children;
    }
}

/**
 * VoiceOrbMesh
 * Circular fluid aura ring ribbon matching user reference image
 */
function VoiceOrbMesh({ state, audioAmplitude }) {
    const meshGroupRef = useRef(null);
    const materialRef1 = useRef(null);
    const materialRef2 = useRef(null);

    // Dynamic state lerp values
    const speedRef = useRef(0.0);
    const ampRef = useRef(0.75);
    const scaleRef = useRef(1.0);
    const rotSpeedRef = useRef(0.0);
    const timeRef = useRef(0.0);

    // Color definitions matching reference image:
    // Electric Cyan (#05b8e0) -> Ocean Blue (#1e73f3) -> Royal Cobalt (#1440d1)
    const colorCyan = useMemo(() => new THREE.Color('#05b8e0'), []);
    const colorBlue = useMemo(() => new THREE.Color('#1e73f3'), []);
    const colorDeepBlue = useMemo(() => new THREE.Color('#1440d1'), []);

    // Create shader uniforms for Primary Ribbon Layer
    const uniforms1 = useMemo(
        () => ({
            uTime: { value: 0 },
            uSpeed: { value: 1.0 },
            uAmplitude: { value: 0.75 },
            uScale: { value: 1.0 },
            uAudioLevel: { value: 0.0 },
            uPhaseOffset: { value: 0.0 },
            uColorCyan: { value: colorCyan },
            uColorBlue: { value: colorBlue },
            uColorDeepBlue: { value: colorDeepBlue }
        }),
        [colorCyan, colorBlue, colorDeepBlue]
    );

    // Create shader uniforms for Secondary Translucent Silk Veil Layer
    const uniforms2 = useMemo(
        () => ({
            uTime: { value: 0 },
            uSpeed: { value: 1.0 },
            uAmplitude: { value: 0.65 },
            uScale: { value: 0.98 },
            uAudioLevel: { value: 0.0 },
            uPhaseOffset: { value: 1.4 },
            uColorCyan: { value: colorCyan },
            uColorBlue: { value: colorBlue },
            uColorDeepBlue: { value: colorDeepBlue }
        }),
        [colorCyan, colorBlue, colorDeepBlue]
    );

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);

        // State targets
        const isPaused = state === 'idle' || state === 'paused';
        const isSpeaking = state === 'speaking';
        const isListening = state === 'listening';

        const targetSpeed = isPaused ? 0.0 : isSpeaking ? 1.35 : 0.95;
        const targetRotSpeed = isPaused ? 0.0 : isSpeaking ? 0.75 : 0.45;
        const targetAmp = isPaused
            ? 0.55
            : isSpeaking
            ? 0.95 + audioAmplitude * 0.7
            : 0.75 + audioAmplitude * 0.35;

        // Speech Scale Pulsing (gentle breathing scale)
        let targetScale = 1.0;
        if (isSpeaking) {
            targetScale = 0.96 + audioAmplitude * 0.18;
        } else if (isListening) {
            targetScale = 1.0 + audioAmplitude * 0.06;
        } else {
            targetScale = 1.0;
        }

        // Smooth Lerp Transitions
        const lerpFactor = 1.0 - Math.exp(-dt * 9.0);
        speedRef.current += (targetSpeed - speedRef.current) * lerpFactor;
        rotSpeedRef.current += (targetRotSpeed - rotSpeedRef.current) * lerpFactor;
        ampRef.current += (targetAmp - ampRef.current) * lerpFactor;
        scaleRef.current += (targetScale - scaleRef.current) * lerpFactor;

        // Advance time only when moving
        timeRef.current += dt * speedRef.current;

        // Apply Uniforms to Layer 1
        if (materialRef1.current) {
            materialRef1.current.uniforms.uTime.value = timeRef.current;
            materialRef1.current.uniforms.uSpeed.value = speedRef.current;
            materialRef1.current.uniforms.uAmplitude.value = ampRef.current;
            materialRef1.current.uniforms.uScale.value = scaleRef.current;
            materialRef1.current.uniforms.uAudioLevel.value = audioAmplitude;
        }

        // Apply Uniforms to Layer 2
        if (materialRef2.current) {
            materialRef2.current.uniforms.uTime.value = timeRef.current + 0.35;
            materialRef2.current.uniforms.uSpeed.value = speedRef.current;
            materialRef2.current.uniforms.uAmplitude.value = ampRef.current * 0.88;
            materialRef2.current.uniforms.uScale.value = scaleRef.current * 0.98;
            materialRef2.current.uniforms.uAudioLevel.value = audioAmplitude;
        }

        // Rotate Mesh Group ONLY on Z-axis (continuous circular rotation in the XY plane)
        // Keeps the circle 100% round and flat-facing the user, matching the reference image.
        if (meshGroupRef.current) {
            meshGroupRef.current.rotation.z += dt * rotSpeedRef.current;
            meshGroupRef.current.rotation.x = 0;
            meshGroupRef.current.rotation.y = 0;
        }
    });

    return (
        <group ref={meshGroupRef}>
            {/* Layer 1: Primary Luminous Circular Fluid Ribbon */}
            <mesh>
                <torusGeometry args={[0.85, 0.18, 64, 192]} />
                <shaderMaterial
                    ref={materialRef1}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms1}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.NormalBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Layer 2: Ethereal Translucent Inner Fluid Veil (Produces silky overlapping folds) */}
            <mesh position={[0, 0, 0.015]}>
                <torusGeometry args={[0.85, 0.14, 48, 192]} />
                <shaderMaterial
                    ref={materialRef2}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms2}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.NormalBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

/**
 * VoiceOrb Component
 * 
 * @param {string} state - 'idle' | 'listening' | 'speaking' | 'paused'
 * @param {AudioNode|HTMLAudioElement|MediaStream|null} audioSource - optional audio source
 * @param {number} size - size in px (default 280)
 * @param {boolean} transparent - canvas background transparent or #0a0a0a
 * @param {function} onClick - click handler
 */
export default function VoiceOrb({
    state = 'listening',
    audioSource = null,
    size = 280,
    transparent = true,
    onClick,
    className = ''
}) {
    const { amplitude } = useAudioAnalyser({
        audioSource,
        fakeSpeaking: state === 'speaking' && !audioSource
    });

    return (
        <OrbErrorBoundary>
            <div
                className={`ai-voice-orb-wrapper ${className}`}
                style={{
                    width: size,
                    height: size,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    filter:
                        state === 'speaking'
                            ? 'drop-shadow(0 0 28px rgba(6, 182, 212, 0.7)) drop-shadow(0 0 50px rgba(59, 130, 246, 0.4))'
                            : state === 'listening'
                            ? 'drop-shadow(0 0 18px rgba(6, 182, 212, 0.5)) drop-shadow(0 0 32px rgba(59, 130, 246, 0.25))'
                            : 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.25))',
                    transition: 'filter 0.3s ease'
                }}
                onClick={onClick}
                role="button"
                tabIndex={0}
                title={
                    state === 'listening'
                        ? 'Listening... (Tap to pause)'
                        : state === 'paused' || state === 'idle'
                        ? 'Paused (Tap to speak)'
                        : 'CIIS AI speaking (Tap to stop)'
                }
            >
                <Canvas
                    camera={{ position: [0, 0, 3.4], fov: 45 }}
                    dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)}
                    gl={{
                        alpha: true,
                        antialias: true,
                        powerPreference: 'high-performance'
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: transparent ? 'transparent' : '#0a0a0a',
                        borderRadius: '50%'
                    }}
                >
                    <ambientLight intensity={0.5} />
                    <VoiceOrbMesh state={state} audioAmplitude={amplitude} />
                </Canvas>
            </div>
        </OrbErrorBoundary>
    );
}
