import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useAudioAnalyser Hook
 * 
 * Supports:
 * 1. Microphone input via getUserMedia
 * 2. HTMLAudioElement / MediaStream input
 * 3. AnalyserNode direct input
 * 4. Fake amplitude simulation for 'speaking' state when no active audio element is attached
 * 
 * Returns smoothed 0.0 - 1.0 amplitude value each frame
 */
export function useAudioAnalyser(options = {}) {
    const {
        audioSource = null,
        fftSize = 256,
        smoothingTimeConstant = 0.8,
        fakeSpeaking = false
    } = options;

    const [amplitude, setAmplitude] = useState(0);
    const [isMicActive, setIsMicActive] = useState(false);
    const [micError, setMicError] = useState(null);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const micStreamRef = useRef(null);
    const animFrameRef = useRef(null);
    const smoothedAmpRef = useRef(0);
    const fakeTimeRef = useRef(0);

    // Initialize or get Web Audio Context
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                audioContextRef.current = new AudioCtx();
            }
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(() => { });
        }
        return audioContextRef.current;
    }, []);

    // Start Microphone
    const startMic = useCallback(async () => {
        try {
            const ctx = getAudioContext();
            if (!ctx) throw new Error('Web Audio API not supported');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = fftSize;
            analyser.smoothingTimeConstant = smoothingTimeConstant;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceNodeRef.current = source;

            setIsMicActive(true);
            setMicError(null);
            return true;
        } catch (err) {
            console.warn('[useAudioAnalyser] Mic access error:', err);
            setMicError(err.message || 'Microphone access denied');
            setIsMicActive(false);
            return false;
        }
    }, [getAudioContext, fftSize, smoothingTimeConstant]);

    // Stop Microphone
    const stopMic = useCallback(() => {
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((track) => track.stop());
            micStreamRef.current = null;
        }
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.disconnect();
            } catch (_) { }
            sourceNodeRef.current = null;
        }
        setIsMicActive(false);
    }, []);

    // Toggle Microphone
    const toggleMic = useCallback(() => {
        if (isMicActive) {
            stopMic();
        } else {
            startMic();
        }
    }, [isMicActive, startMic, stopMic]);

    // Handle incoming audioSource (HTMLAudioElement, MediaStream, AnalyserNode)
    useEffect(() => {
        if (!audioSource) return;

        const ctx = getAudioContext();
        if (!ctx) return;

        try {
            if (audioSource instanceof AnalyserNode) {
                analyserRef.current = audioSource;
            } else if (audioSource instanceof HTMLAudioElement) {
                const analyser = ctx.createAnalyser();
                analyser.fftSize = fftSize;
                analyser.smoothingTimeConstant = smoothingTimeConstant;
                analyserRef.current = analyser;

                const source = ctx.createMediaElementSource(audioSource);
                source.connect(analyser);
                analyser.connect(ctx.destination);
                sourceNodeRef.current = source;
            } else if (window.MediaStream && audioSource instanceof MediaStream) {
                const analyser = ctx.createAnalyser();
                analyser.fftSize = fftSize;
                analyser.smoothingTimeConstant = smoothingTimeConstant;
                analyserRef.current = analyser;

                const source = ctx.createMediaStreamSource(audioSource);
                source.connect(analyser);
                sourceNodeRef.current = source;
            }
        } catch (err) {
            console.warn('[useAudioAnalyser] Source connect error:', err);
        }

        return () => {
            if (sourceNodeRef.current && !(audioSource instanceof AnalyserNode)) {
                try {
                    sourceNodeRef.current.disconnect();
                } catch (_) { }
                sourceNodeRef.current = null;
            }
        };
    }, [audioSource, getAudioContext, fftSize, smoothingTimeConstant]);

    // Continuous Frame Polling Loop
    useEffect(() => {
        const dataArray = new Uint8Array(fftSize / 2);

        const tick = () => {
            let instantAmp = 0;

            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                instantAmp = Math.min(1.0, avg / 128.0);
            } else if (fakeSpeaking) {
                // Organic Speech Cadence Simulator when no audio stream is active
                fakeTimeRef.current += 0.08;
                const ft = fakeTimeRef.current;
                const rawPulse =
                    0.45 +
                    Math.sin(ft * 3.4) * 0.28 +
                    Math.sin(ft * 7.2) * 0.16 +
                    Math.cos(ft * 1.8) * 0.12;
                instantAmp = Math.max(0.0, Math.min(1.0, rawPulse));
            } else {
                instantAmp = 0.0;
            }

            // Smooth with lerp
            smoothedAmpRef.current += (instantAmp - smoothedAmpRef.current) * 0.25;
            setAmplitude(smoothedAmpRef.current);

            animFrameRef.current = requestAnimationFrame(tick);
        };

        animFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
        };
    }, [fftSize, fakeSpeaking]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMic();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    audioContextRef.current.close();
                } catch (_) { }
            }
        };
    }, [stopMic]);

    return {
        amplitude,
        isMicActive,
        micError,
        startMic,
        stopMic,
        toggleMic,
        analyserNode: analyserRef.current
    };
}

export default useAudioAnalyser;
