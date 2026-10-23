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
 * 3D Torus Ribbon geometry with custom GLSL 3D Simplex noise displacement shader
 */
function VoiceOrbMesh({ state, audioAmplitude }) {
    const meshGroupRef = useRef(null);
    const materialRef1 = useRef(null);
    const materialRef2 = useRef(null);
    const materialRef3 = useRef(null);

    // Dynamic state lerp values
    const speedRef = useRef(0.0);
    const ampRef = useRef(0.8);
    const scaleRef = useRef(1.0);
    const rotSpeedRef = useRef(0.0);
    const timeRef = useRef(0.0);

    // Color definitions: Cyan (#22d3ee) -> Blue (#3b82f6) -> Teal (#2dd4bf)
    const colorCyan = useMemo(() => new THREE.Color('#22d3ee'), []);
    const colorBlue = useMemo(() => new THREE.Color('#3b82f6'), []);
    const colorTeal = useMemo(() => new THREE.Color('#2dd4bf'), []);

    // Create shader uniforms
    const uniforms1 = useMemo(
        () => ({
            uTime: { value: 0 },
            uSpeed: { value: 1.0 },
            uAmplitude: { value: 0.85 },
            uScale: { value: 1.0 },
            uAudioLevel: { value: 0.0 },
            uTwist: { value: 1.0 },
            uColorCyan: { value: colorCyan },
            uColorBlue: { value: colorBlue },
            uColorTeal: { value: colorTeal }
        }),
        [colorCyan, colorBlue, colorTeal]
    );

    const uniforms2 = useMemo(
        () => ({
            uTime: { value: 0 },
            uSpeed: { value: 1.0 },
            uAmplitude: { value: 0.70 },
            uScale: { value: 0.97 },
            uAudioLevel: { value: 0.0 },
            uTwist: { value: 1.5 },
            uColorCyan: { value: colorCyan },
            uColorBlue: { value: colorBlue },
            uColorTeal: { value: colorTeal }
        }),
        [colorCyan, colorBlue, colorTeal]
    );

    const uniforms3 = useMemo(
        () => ({
            uTime: { value: 0 },
            uSpeed: { value: 1.0 },
            uAmplitude: { value: 0.95 },
            uScale: { value: 1.03 },
            uAudioLevel: { value: 0.0 },
            uTwist: { value: 0.8 },
            uColorCyan: { value: colorCyan },
            uColorBlue: { value: colorBlue },
            uColorTeal: { value: colorTeal }
        }),
        [colorCyan, colorBlue, colorTeal]
    );

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);

        // State targets
        const isPaused = state === 'idle' || state === 'paused';
        const isSpeaking = state === 'speaking';
        const isListening = state === 'listening';

        const targetSpeed = isPaused ? 0.0 : isSpeaking ? 1.4 : 1.0;
        const targetRotSpeed = isPaused ? 0.0 : isSpeaking ? 0.95 : 0.65;
        const targetAmp = isPaused
            ? 0.65
            : isSpeaking
            ? 1.1 + audioAmplitude * 0.8
            : 0.8 + audioAmplitude * 0.4;

        // Speech Scale Pulsing (0.90 -> 1.25 synced with audio amplitude)
        let targetScale = 1.0;
        if (isSpeaking) {
            targetScale = 0.92 + audioAmplitude * 0.33;
        } else if (isListening) {
            targetScale = 1.0 + audioAmplitude * 0.08;
        } else {
            targetScale = 1.0;
        }

        // Smooth Lerp Transitions (ease out within ~300ms)
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
            materialRef2.current.uniforms.uTime.value = timeRef.current + 0.4;
            materialRef2.current.uniforms.uSpeed.value = speedRef.current;
            materialRef2.current.uniforms.uAmplitude.value = ampRef.current * 0.85;
            materialRef2.current.uniforms.uScale.value = scaleRef.current * 0.96;
            materialRef2.current.uniforms.uAudioLevel.value = audioAmplitude;
        }

        // Apply Uniforms to Layer 3
        if (materialRef3.current) {
            materialRef3.current.uniforms.uTime.value = timeRef.current + 0.8;
            materialRef3.current.uniforms.uSpeed.value = speedRef.current;
            materialRef3.current.uniforms.uAmplitude.value = ampRef.current * 1.05;
            materialRef3.current.uniforms.uScale.value = scaleRef.current * 1.02;
            materialRef3.current.uniforms.uAudioLevel.value = audioAmplitude;
        }

        // Rotate Mesh Group (Continuous Z rotation + 3D Y/X tilt wobble)
        if (meshGroupRef.current) {
            meshGroupRef.current.rotation.z += dt * rotSpeedRef.current;
            if (!isPaused) {
                const t = timeRef.current;
                meshGroupRef.current.rotation.y = Math.sin(t * 0.7) * 0.14;
                meshGroupRef.current.rotation.x = Math.cos(t * 0.6) * 0.09;
            }
        }
    });

    return (
        <group ref={meshGroupRef}>
            {/* Layer 1: Primary High-Segment Volumetric Torus Ribbon */}
            <mesh>
                <torusGeometry args={[1.0, 0.17, 48, 180]} />
                <shaderMaterial
                    ref={materialRef1}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms1}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Layer 2: Secondary Intertwining Translucent Ribbon Veil */}
            <mesh rotation={[0.2, 0.3, 0.8]}>
                <torusGeometry args={[0.98, 0.13, 36, 140]} />
                <shaderMaterial
                    ref={materialRef2}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms2}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Layer 3: Whispering Outer Silk Veil (Glowing Crossing Highlights) */}
            <mesh rotation={[-0.15, -0.25, 1.4]}>
                <torusGeometry args={[1.02, 0.09, 32, 120]} />
                <shaderMaterial
                    ref={materialRef3}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms3}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
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
                        : 'Astra speaking (Tap to stop)'
                }
            >
                <Canvas
                    camera={{ position: [0, 0, 3.1], fov: 45 }}
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
