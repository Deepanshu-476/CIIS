import { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from '../utils/axiosConfig';
import {
    isSilenceHallucination,
    isSelfEcho,
    canProcessTranscriptTurn,
    collapseRepeatedUtterance,
} from './taskAgentPureLogic';

const getSR = () =>
    typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const stripEmojis = (str) =>
    String(str || '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
        .trim();

export default function useSpeech({
    defaultEngine = 'whisper', // 'whisper' | 'browser'
    defaultLang = 'auto',       // 'auto' | 'hi-IN' | 'en-IN'
    onFinalTranscript,
    onInactivityPrompt,
    onInactivityPause,
    enableChunking = false,
    maxSttUploads = 12,
} = {}) {
    const SR = getSR();
    const [engine, setEngine] = useState(defaultEngine);
    const [lang, setLang] = useState(defaultLang);
    const [listening, setListening] = useState(false);
    const listeningRef = useRef(false);

    const setListeningTracked = useCallback((val) => {
        const boolVal = typeof val === 'function' ? val(listeningRef.current) : Boolean(val);
        listeningRef.current = boolVal;
        setListening(boolVal);
    }, []);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const isTranscribingRef = useRef(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [userMuted, setUserMuted] = useState(false);
    const userMutedRef = useRef(false);
    const sessionCounterRef = useRef(0);
    const activeSessionIdRef = useRef(0);
    const abortControllerRef = useRef(null);
    const startRef = useRef(null);
    const lastSpokenAssistantTextRef = useRef('');
    const speechEndedAtRef = useRef(0);
    const [interim, setInterim] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [hasHindiVoice, setHasHindiVoice] = useState(false);

    // Permission tracking ('prompt' | 'granted' | 'denied')
    const [micPermission, setMicPermission] = useState('prompt');
    const micPermissionRef = useRef('prompt');

    // DEV overlay diagnostic for manual mic capture
    const [lastTranscriptDiag, setLastTranscriptDiag] = useState(null);
    const lastTranscriptDiagRef = useRef(null);

    const updateTranscriptDiag = useCallback((diag) => {
        setLastTranscriptDiag(diag);
        lastTranscriptDiagRef.current = diag;
    }, []);

    // Monitor microphone permission through navigator.permissions
    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
            setMicPermission('prompt');
            micPermissionRef.current = 'prompt';
            return undefined;
        }
        let active = true;
        let permStatusObj = null;
        try {
            navigator.permissions.query({ name: 'microphone' }).then((status) => {
                if (!active || !status) return;
                permStatusObj = status;
                setMicPermission(status.state);
                micPermissionRef.current = status.state;
                status.onchange = () => {
                    if (!active) return;
                    setMicPermission(status.state);
                    micPermissionRef.current = status.state;
                };
            }).catch(() => {
                if (active) {
                    setMicPermission('prompt');
                    micPermissionRef.current = 'prompt';
                }
            });
        } catch {
            setMicPermission('prompt');
            micPermissionRef.current = 'prompt';
        }
        return () => {
            active = false;
            if (permStatusObj) {
                permStatusObj.onchange = null;
            }
        };
    }, []);

    // Auto-dismiss errors/notices immediately whenever engine or language changes
    useEffect(() => {
        setError(null);
        if (sttFailureCountRef.current === 0) {
            setNotice(null);
        }
    }, [engine, lang]);

    // Diagnostics ref for live telemetry & bug reports
    const lastDiagRef = useRef({
        durationMs: 0,
        blobSize: 0,
        mimeType: '',
        peakRms: 0,
        avgRms: 0,
        noiseFloor: 0,
        firstSpeechTime: null,
        silenceTimerStarted: false,
        endReason: 'none',
    });

    // Voice note attachment recording (separate from STT)
    const [recordingVoiceNote, setRecordingVoiceNote] = useState(false);
    const voiceNoteRecorderRef = useRef(null);
    const voiceNoteChunksRef = useRef([]);

    // Whisper STT MediaRecorder & Analyser refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const durationTimerRef = useRef(null);
    const hardCapTimerRef = useRef(null);
    const speechDetectedRef = useRef(false);
    const inactivityPhaseRef = useRef(0); // 0: none, 1: prompted at 6s, 2: paused at 12s
    const lastSpeechOrListenStartRef = useRef(0);
    const sttFailureCountRef = useRef(0);
    const isStartingRef = useRef(false);

    const clearUserMute = useCallback(() => {
        userMutedRef.current = false;
        setUserMuted(false);
        setIsPaused(false);
    }, []);

    // Adaptive VAD calibration & state
    const isCalibratingRef = useRef(true);
    const calibrationStartTimeRef = useRef(0);
    const calibrationSamplesRef = useRef([]);
    const noiseFloorRef = useRef(8);
    const speechThresholdRef = useRef(15);
    const silenceThresholdRef = useRef(10);
    const smoothedRmsRef = useRef(0);
    const peakRmsRef = useRef(0);
    const sumRmsRef = useRef(0);
    const countRmsRef = useRef(0);
    const silenceStartTimeRef = useRef(null);

    // Live VAD statistics for Dev overlay & tuning inspection
    const [vadStats, setVadStats] = useState({
        rms: 0,
        noiseFloor: 8,
        minRms3s: 8,
        speechThreshold: 15,
        silenceThreshold: 10,
        silenceMs: 0,
        speechDurationMs: 0,
        isSpeechDetected: false,
    });
    const lastVadUpdateRef = useRef(0);
    const rmsHistory3sRef = useRef([]);

    // Chunked recording management
    const chunkCutPendingRef = useRef(false);
    const segmentStartTimeRef = useRef(0);
    const segmentSpeechDetectedRef = useRef(false);

    // Browser Web Speech refs
    const recRef = useRef(null);
    const userStoppedRef = useRef(false);
    const accumulatedTextRef = useRef('');
    const uncommittedInterimRef = useRef('');
    const browserSilenceTimerRef = useRef(null);

    // Speaking state & Echo Guard ref
    const isSpeakingRef = useRef(false);
    const speakTimeoutRef = useRef(null);
    const activeUtteranceRef = useRef(null);

    // Turn dispatch & STT cap guards
    const turnDispatchedRef = useRef(false);
    const sttUploadCountRef = useRef(0);
    const [sttUploadCount, setSttUploadCount] = useState(0);

    const resetSttUploadCount = useCallback(() => {
        sttUploadCountRef.current = 0;
        setSttUploadCount(0);
    }, []);

    const cbRef = useRef(onFinalTranscript);
    cbRef.current = onFinalTranscript;

    const dispatchFinalText = useCallback((text, sessionId = activeSessionIdRef.current) => {
        const speechDur = lastDiagRef.current.firstSpeechTime
            ? (Date.now() - lastDiagRef.current.firstSpeechTime)
            : (lastDiagRef.current.durationMs || 0);

        const autoRearm = () => {
            if (!userMutedRef.current && !isSpeakingRef.current && !isTranscribingRef.current) {
                setTimeout(() => {
                    if (!userMutedRef.current && !isSpeakingRef.current && !isTranscribingRef.current) {
                        startRef.current?.({ force: true });
                    }
                }, 300);
            }
        };

        if (!text || String(text).trim().length < 2) {
            updateTranscriptDiag({ text: String(text || '').trim(), dropped: true, reason: 'too short', durationMs: speechDur });
            autoRearm();
            return;
        }

        const clean = collapseRepeatedUtterance(String(text || '').trim());
        if (!clean) {
            updateTranscriptDiag({ text: '', dropped: true, reason: 'too short', durationMs: speechDur });
            autoRearm();
            return;
        }

        const check = canProcessTranscriptTurn({
            transcriptSessionId: sessionId,
            currentSessionId: activeSessionIdRef.current,
            userMuted: userMutedRef.current,
            isSpeaking: isSpeakingRef.current || window.__ciisVoiceSpeaking,
            speechEndedAt: speechEndedAtRef.current,
        });
        if (!check.allowed) {
            if (import.meta.env.DEV) {
                console.info('[useSpeech] Dropped transcript due to:', check.reason, { text: clean });
            }
            updateTranscriptDiag({
                text: clean,
                dropped: true,
                reason: check.reason === 'speaking' || check.reason === 'guard_window' ? 'echo' : (check.reason || 'other'),
                durationMs: speechDur,
            });
            autoRearm();
            return;
        }

        // Silence Hallucination guard: drop "thank you", "thanks for watching", etc. on short/quiet clips
        if (isSilenceHallucination(clean, speechDur, lastDiagRef.current.peakRms)) {
            if (import.meta.env.DEV) {
                console.info('[useSpeech] Dropped silence hallucination:', clean);
            }
            updateTranscriptDiag({ text: clean, dropped: true, reason: 'silence hallucination', durationMs: speechDur });
            autoRearm();
            return;
        }

        // Echo guard: drop if transcript echoes the assistant's own speech
        if (isSelfEcho(clean, lastSpokenAssistantTextRef.current)) {
            if (import.meta.env.DEV) {
                console.info('[useSpeech] Dropped self-echo transcript:', clean);
            }
            updateTranscriptDiag({ text: clean, dropped: true, reason: 'echo', durationMs: speechDur });
            autoRearm();
            return;
        }

        if (turnDispatchedRef.current) return;
        turnDispatchedRef.current = true;
        updateTranscriptDiag({ text: clean, dropped: false, durationMs: speechDur });
        if (cbRef.current) {
            cbRef.current(clean, speechDur);
        }
    }, [updateTranscriptDiag]);

    const inactivityPromptCbRef = useRef(onInactivityPrompt);
    inactivityPromptCbRef.current = onInactivityPrompt;

    const inactivityPauseCbRef = useRef(onInactivityPause);
    inactivityPauseCbRef.current = onInactivityPause;

    const voicesRef = useRef([]);
    const sttSupported = Boolean(SR) || (typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia));
    const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Load available TTS voices
    useEffect(() => {
        if (!ttsSupported) return undefined;
        const load = () => {
            const vList = window.speechSynthesis.getVoices() || [];
            voicesRef.current = vList;
            const hi = vList.some((v) => v.lang && v.lang.toLowerCase().startsWith('hi'));
            setHasHindiVoice(hi);
        };
        load();
        window.speechSynthesis.addEventListener?.('voiceschanged', load);
        return () => {
            window.speechSynthesis.removeEventListener?.('voiceschanged', load);
            window.speechSynthesis.cancel();
        };
    }, [ttsSupported]);

    // Cleanup helper for audio stream and analyser
    const cleanupAudioNodes = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
        }
        if (hardCapTimerRef.current) {
            clearTimeout(hardCapTimerRef.current);
            hardCapTimerRef.current = null;
        }
        if (browserSilenceTimerRef.current) {
            clearTimeout(browserSilenceTimerRef.current);
            browserSilenceTimerRef.current = null;
        }
        try {
            audioStreamRef.current?.getTracks().forEach((track) => track.stop());
            audioStreamRef.current = null;
        } catch {
            /* ignore */
        }
        try {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        } catch {
            /* ignore */
        }
        setAudioLevel(0);
        setDurationSeconds(0);
        speechDetectedRef.current = false;
        segmentSpeechDetectedRef.current = false;
        inactivityPhaseRef.current = 0;
        lastSpeechOrListenStartRef.current = 0;
        silenceStartTimeRef.current = null;
        chunkCutPendingRef.current = false;
    }, []);

    // Stop listening method
    const stop = useCallback((reason = 'manual') => {
        userStoppedRef.current = true;
        lastDiagRef.current.endReason = reason;

        // Sticky manual mute
        if (reason === 'manual' || reason === 'user-stop') {
            userMutedRef.current = true;
            setUserMuted(true);
        }

        // Invalidate recording session on manual stop, typed send, cancel, creation, or chip/button click
        if (reason === 'manual' || reason === 'user-stop' || reason === 'typed-send' || reason === 'cancel' || reason === 'created' || reason === 'chip-click' || reason === 'button-click' || reason === 'task-confirmed') {
            activeSessionIdRef.current = 0;
            if (abortControllerRef.current) {
                try { abortControllerRef.current.abort(); } catch { /* ignore */ }
                abortControllerRef.current = null;
            }
            audioChunksRef.current = [];
        }

        if (engine === 'whisper') {
            const rec = mediaRecorderRef.current;
            if (rec && rec.state !== 'inactive') {
                try {
                    rec.stop();
                } catch {
                    /* ignore */
                }
            } else {
                setListeningTracked(false);
                cleanupAudioNodes();
            }
        } else {
            // Browser Web Speech
            try {
                recRef.current?.stop();
            } catch {
                /* ignore */
            }
            setListeningTracked(false);
            cleanupAudioNodes();
            const uncommitted = (uncommittedInterimRef.current || '').trim();
            let text = accumulatedTextRef.current.trim();
            if (uncommitted && !text.endsWith(uncommitted) && text !== uncommitted) {
                text = (text + ' ' + uncommitted).trim();
            }
            text = collapseRepeatedUtterance(text);
            accumulatedTextRef.current = '';
            uncommittedInterimRef.current = '';
            setInterim('');
            // Discard transcript if stopped manually, session invalidated, or typed send
            if (text && reason !== 'manual' && reason !== 'user-stop' && reason !== 'typed-send' && reason !== 'cancel') {
                dispatchFinalText(text, activeSessionIdRef.current);
            }
        }
    }, [engine, cleanupAudioNodes, dispatchFinalText]);

    // Setup adaptive VAD audio analyser
    const startAudioAnalyser = useCallback((stream, onSilenceExceeded, onChunkCut) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                try { ctx.resume(); } catch {}
            }
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.25;
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const nowTime = Date.now();
            lastSpeechOrListenStartRef.current = nowTime;
            calibrationStartTimeRef.current = nowTime;
            calibrationSamplesRef.current = [];
            isCalibratingRef.current = true;
            speechDetectedRef.current = false;
            segmentSpeechDetectedRef.current = false;
            inactivityPhaseRef.current = 0;
            smoothedRmsRef.current = 0;
            peakRmsRef.current = 0;
            sumRmsRef.current = 0;
            countRmsRef.current = 0;
            silenceStartTimeRef.current = null;
            chunkCutPendingRef.current = false;

            const checkAudio = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);

                // Focus on human vocal frequencies (100Hz - 4500Hz, bins 1 to 28)
                const voiceBins = Math.min(28, dataArray.length);
                let voiceSum = 0;
                let voicePeak = 0;
                for (let i = 1; i < voiceBins; i += 1) {
                    const v = dataArray[i];
                    voiceSum += v;
                    if (v > voicePeak) voicePeak = v;
                }
                const voiceAvg = voiceBins > 1 ? voiceSum / (voiceBins - 1) : 0;
                const now = Date.now();

                // Half-duplex & echo guard: do NOT elevate audio level or process while agent is speaking
                const isAgentSpeaking = isSpeakingRef.current || window.__ciisVoiceSpeaking;
                if (isAgentSpeaking) {
                    setAudioLevel(0);
                    lastSpeechOrListenStartRef.current = now;
                    silenceStartTimeRef.current = null;
                    animFrameRef.current = requestAnimationFrame(checkAudio);
                    return;
                }

                const level = Math.min(100, Math.round((voicePeak / 128) * 100));
                setAudioLevel(level);

                // 1. Initial 400ms noise floor calibration
                if (isCalibratingRef.current) {
                    calibrationSamplesRef.current.push(voiceAvg);
                    if (now - calibrationStartTimeRef.current >= 400) {
                        isCalibratingRef.current = false;
                        const samples = calibrationSamplesRef.current;
                        const sorted = [...samples].sort((a, b) => a - b);
                        // Take lower 40th percentile to prevent speech onset or mic transients from blowing up the floor
                        const p40Floor = sorted[Math.floor(sorted.length * 0.4)] || 8;
                        noiseFloorRef.current = Math.max(3, Math.min(25, Math.round(p40Floor)));
                        speechThresholdRef.current = Math.max(noiseFloorRef.current + 6, 12);
                        silenceThresholdRef.current = Math.max(noiseFloorRef.current + 2, 8);
                        lastDiagRef.current.noiseFloor = noiseFloorRef.current;
                    }
                    animFrameRef.current = requestAnimationFrame(checkAudio);
                    return;
                }

                // Smooth RMS level using exponential moving average
                smoothedRmsRef.current = smoothedRmsRef.current * 0.6 + voiceAvg * 0.4;
                const curSmoothed = smoothedRmsRef.current;

                // Maintain rolling 3-second RMS history to detect quiet periods
                rmsHistory3sRef.current.push({ time: now, rms: curSmoothed });
                const windowCutoff = now - 3000;
                while (rmsHistory3sRef.current.length > 0 && rmsHistory3sRef.current[0].time < windowCutoff) {
                    rmsHistory3sRef.current.shift();
                }
                const minRms3s = rmsHistory3sRef.current.reduce((min, item) => (item.rms < min ? item.rms : min), curSmoothed);

                // Continuous background floor tracking: never stay pinned at cap (25)
                if (!speechDetectedRef.current && curSmoothed > 0) {
                    // Decay downward towards minRms3s during quiet periods
                    const targetFloor = Math.min(noiseFloorRef.current, minRms3s);
                    noiseFloorRef.current = Math.max(3, Math.min(25, Math.round(noiseFloorRef.current * 0.95 + targetFloor * 0.05)));
                    speechThresholdRef.current = Math.max(noiseFloorRef.current + 6, 12);
                    silenceThresholdRef.current = Math.max(noiseFloorRef.current + 2, 8);
                    lastDiagRef.current.noiseFloor = noiseFloorRef.current;
                    lastDiagRef.current.minRms3s = minRms3s;
                }

                if (voicePeak > peakRmsRef.current) {
                    peakRmsRef.current = Math.round(voicePeak);
                }
                sumRmsRef.current += curSmoothed;
                countRmsRef.current += 1;

                lastDiagRef.current.peakRms = peakRmsRef.current;
                lastDiagRef.current.avgRms = countRmsRef.current
                    ? Math.round(sumRmsRef.current / countRmsRef.current)
                    : 0;

                // 2. Speech vs Silence classification
                // When speech has not started: reliable threshold catches speech onset without triggering on mic pops
                // Once speech has started: only sustained speech energy resets silence timer
                const isSpeechOnset = !speechDetectedRef.current && (curSmoothed >= speechThresholdRef.current && voicePeak >= 20);
                const isSustainedSpeech = speechDetectedRef.current && (curSmoothed >= speechThresholdRef.current);

                if (isSpeechOnset || isSustainedSpeech) {
                    // Definite user speech detected
                    if (!speechDetectedRef.current) {
                        speechDetectedRef.current = true;
                        lastDiagRef.current.firstSpeechTime = now;
                    }
                    segmentSpeechDetectedRef.current = true;
                    silenceStartTimeRef.current = null;
                    lastSpeechOrListenStartRef.current = now;
                    inactivityPhaseRef.current = 0;
                } else if (curSmoothed <= silenceThresholdRef.current) {
                    // Level below ambient silence threshold
                    if (speechDetectedRef.current) {
                        if (!silenceStartTimeRef.current) {
                            silenceStartTimeRef.current = now;
                            lastDiagRef.current.silenceTimerStarted = true;
                        } else {
                            const silenceMs = now - silenceStartTimeRef.current;
                            const speechDurationMs = lastDiagRef.current.firstSpeechTime ? (now - lastDiagRef.current.firstSpeechTime) : 0;

                            // Utterance end: 1.4s (1400ms) speech pause window after speech stops, AND after at least 400ms of real speech
                            if (silenceMs >= 1400 && speechDurationMs >= 400) {
                                if (onSilenceExceeded) {
                                    onSilenceExceeded('silence');
                                    return;
                                }
                            } else if (silenceMs >= 1400 && speechDurationMs < 400) {
                                // False onset (ambient click/breath < 400ms): reset speech detection and keep listening!
                                speechDetectedRef.current = false;
                                silenceStartTimeRef.current = null;
                                lastDiagRef.current.firstSpeechTime = null;
                            }
                        }
                    } else if (onSilenceExceeded) {
                        // Speech NOT yet detected: prompt at 7s, pause at 12s
                        const silenceDuration = now - (lastSpeechOrListenStartRef.current || now);
                        if (silenceDuration >= 7000 && inactivityPhaseRef.current === 0) {
                            inactivityPhaseRef.current = 1;
                            lastSpeechOrListenStartRef.current = now;
                            if (inactivityPromptCbRef.current) inactivityPromptCbRef.current();
                        } else if (silenceDuration >= 12000) {
                            inactivityPhaseRef.current = 0;
                            lastSpeechOrListenStartRef.current = now;
                            if (inactivityPauseCbRef.current) inactivityPauseCbRef.current();
                            if (userMutedRef.current) {
                                setIsPaused(true);
                                stop('inactivity');
                                return;
                            }
                        }
                    }
                } else if (speechDetectedRef.current) {
                    // Transition zone: voice level has dropped between speech and silence thresholds
                    const midThreshold = (speechThresholdRef.current + silenceThresholdRef.current) / 2;
                    if (curSmoothed <= midThreshold) {
                        if (!silenceStartTimeRef.current) {
                            silenceStartTimeRef.current = now;
                        } else {
                            const silenceMs = now - silenceStartTimeRef.current;
                            const speechDurationMs = lastDiagRef.current.firstSpeechTime ? (now - lastDiagRef.current.firstSpeechTime) : 0;
                            if (silenceMs >= 1500 && speechDurationMs >= 400) {
                                if (onSilenceExceeded) {
                                    onSilenceExceeded('silence');
                                    return;
                                }
                            }
                        }
                    }
                }

                // Throttled live VAD stats update for dev overlay and console trace
                if (now - lastVadUpdateRef.current >= 120) {
                    lastVadUpdateRef.current = now;
                    const curRms = Math.round(curSmoothed);
                    const silenceElapsed = silenceStartTimeRef.current ? (now - silenceStartTimeRef.current) : 0;
                    const speechElapsed = lastDiagRef.current.firstSpeechTime ? (now - lastDiagRef.current.firstSpeechTime) : 0;
                    setVadStats({
                        rms: curRms,
                        noiseFloor: noiseFloorRef.current,
                        minRms3s: Math.round(minRms3s),
                        speechThreshold: speechThresholdRef.current,
                        silenceThreshold: silenceThresholdRef.current,
                        silenceMs: silenceElapsed,
                        speechDurationMs: speechElapsed,
                        isSpeechDetected: speechDetectedRef.current,
                    });
                }

                animFrameRef.current = requestAnimationFrame(checkAudio);
            };

            animFrameRef.current = requestAnimationFrame(checkAudio);
        } catch (err) {
            console.warn('Audio analyser setup error:', err);
        }
    }, [stop, enableChunking]);

    // Start Browser Web Speech Recognition with keyword interrupt
    const startBrowserSpeech = useCallback(() => {
        if (!SR) {
            setError('unsupported');
            return;
        }

        userStoppedRef.current = false;
        accumulatedTextRef.current = '';
        uncommittedInterimRef.current = '';
        speechDetectedRef.current = false;
        inactivityPhaseRef.current = 0;
        setInterim('');
        setError(null);
        setIsPaused(false);
        setListening(true);

        const resetBrowserSilence = () => {
            if (browserSilenceTimerRef.current) {
                clearTimeout(browserSilenceTimerRef.current);
            }
            // 1200ms natural silence for browser speech utterance completion
            browserSilenceTimerRef.current = setTimeout(() => {
                stop('silence');
            }, 1200);
        };

        const createAndStart = () => {
            try {
                recRef.current?.abort();
            } catch {
                /* ignore */
            }

            const rec = new SR();
            const speechLang = lang === 'auto' ? 'hi-IN' : lang;
            rec.lang = speechLang;
            rec.continuous = true;
            rec.interimResults = true;
            rec.maxAlternatives = 1;

            rec.onstart = () => {
                lastSpeechOrListenStartRef.current = Date.now();
            };

            rec.onresult = (e) => {
                // Echo guard: ignore while agent is speaking
                if (isSpeakingRef.current || window.__ciisVoiceSpeaking) return;

                speechDetectedRef.current = true;
                inactivityPhaseRef.current = 0;
                lastSpeechOrListenStartRef.current = Date.now();
                resetBrowserSilence();
                let currentInterim = '';
                for (let i = e.resultIndex; i < e.results.length; i += 1) {
                    const r = e.results[i];
                    if (r.isFinal) {
                        const chunk = r[0].transcript.trim();
                        if (chunk) {
                            accumulatedTextRef.current = (
                                accumulatedTextRef.current ? accumulatedTextRef.current + ' ' + chunk : chunk
                            ).trim();
                        }
                    } else {
                        currentInterim = (
                            currentInterim ? currentInterim + ' ' + r[0].transcript.trim() : r[0].transcript.trim()
                        ).trim();
                    }
                }
                uncommittedInterimRef.current = currentInterim;
                const display = (accumulatedTextRef.current + (currentInterim ? ' ' + currentInterim : '')).trim();
                setInterim(display);

                // Detect immediate finish/control keywords in interim text
                if (/\b(?:create\s*kar\s*do|bana\s*do|kardo|create\s*now|submit\s*task|baaki\s*sab\s*default|cancel|ruko)\b/i.test(display)) {
                    stop('keyword');
                }
            };

            rec.onerror = (e) => {
                const errType = e.error;
                if (errType === 'not-allowed') {
                    setError('not-allowed');
                    setNotice('Mic permission nahi mili. Aap type karke task bana sakte hain.');
                    userStoppedRef.current = true;
                    setListeningTracked(false);
                    cleanupAudioNodes();
                } else if (errType !== 'no-speech' && errType !== 'aborted') {
                    setError(errType || 'speech-error');
                }
            };

            rec.onend = () => {
                if (!userStoppedRef.current) {
                    try {
                        createAndStart();
                    } catch {
                        setListeningTracked(false);
                        cleanupAudioNodes();
                    }
                } else {
                    setListeningTracked(false);
                    cleanupAudioNodes();
                    const finalText = accumulatedTextRef.current.trim();
                    if (finalText) {
                        dispatchFinalText(finalText);
                    }
                }
            };

            recRef.current = rec;
            try {
                rec.start();
            } catch {
                setError('start-failed');
                setListeningTracked(false);
            }
        };

        // Audio stream with echo cancellation & noise suppression
        navigator.mediaDevices
            ?.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            })
            .then((stream) => {
                audioStreamRef.current = stream;
                // Audio analyser used for dynamic level visualizer meter & 10s inactivity stop
                startAudioAnalyser(stream, (reason) => {
                    stop(reason);
                });
            })
            .catch((err) => {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('not-allowed');
                    setNotice('Mic permission nahi mili. Aap type karke task bana sakte hain.');
                }
            });

        durationTimerRef.current = setInterval(() => {
            setDurationSeconds((s) => s + 1);
        }, 1000);

        // Hard cap at 20s
        hardCapTimerRef.current = setTimeout(() => {
            stop('cap');
        }, 20000);

        createAndStart();
    }, [SR, lang, stop, cleanupAudioNodes, startAudioAnalyser]);

    // Upload an audio chunk to backend /api/ai/transcribe
    const uploadAudioBlob = useCallback(async (audioBlob, ext, durationMs, sessionId) => {
        if (!audioBlob || audioBlob.size < 400 || durationMs < 250) {
            if (speechDetectedRef.current) {
                setNotice('Awaaz bahut chhoti thi, dobara bolein');
            }
            return null;
        }

        // Drop immediately if session is not active or was invalidated
        if (sessionId && activeSessionIdRef.current !== sessionId) {
            return null;
        }

        // STT upload cap check (12 uploads per conversation session)
        if (sttUploadCountRef.current >= maxSttUploads) {
            setNotice(`Voice limit (${maxSttUploads}/${maxSttUploads} turns) reached. Switched to browser speech or text.`);
            if (SR) {
                setEngine('browser');
            }
            return null;
        }

        setIsTranscribing(true);
        isTranscribingRef.current = true;
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const uploadAttempt = async () => {
            const formData = new FormData();
            formData.append('audio', audioBlob, `recording.${ext}`);
            let langCode = 'hi'; // Default to 'hi' so Whisper doesn't auto-translate or hallucinate English words
            if (lang && lang.toLowerCase().startsWith('en')) {
                langCode = 'en';
            } else if (lang && (lang.toLowerCase().startsWith('hi') || lang === 'hi-IN')) {
                langCode = 'hi';
            } else if (lang === 'auto') {
                langCode = 'auto';
            }
            formData.append('language', langCode);

            const response = await axiosInstance.post('/ai/transcribe', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: controller.signal,
            });
            return response.data;
        };

        let data = null;
        try {
            data = await uploadAttempt();
            if (sessionId && activeSessionIdRef.current !== sessionId) {
                return null;
            }
            sttFailureCountRef.current = 0; // Reset failures on success
            sttUploadCountRef.current += 1;
            setSttUploadCount(sttUploadCountRef.current);
        } catch (firstErr) {
            if (firstErr?.name === 'CanceledError' || firstErr?.name === 'AbortError' || firstErr?.code === 'ERR_CANCELED' || /cancel|abort/i.test(firstErr?.message || '')) {
                return null;
            }
            if (sessionId && activeSessionIdRef.current !== sessionId) {
                return null;
            }
            const status = firstErr?.response?.status;
            const code = firstErr?.response?.data?.code;

            if (code === 'STT_NO_SPEECH') {
                setNotice('Awaaz saaf nahi aayi, dobara bolein');
                sttFailureCountRef.current += 1;
            } else if (!firstErr?.response || status >= 500) {
                try {
                    data = await uploadAttempt();
                    if (sessionId && activeSessionIdRef.current !== sessionId) {
                        return null;
                    }
                    sttFailureCountRef.current = 0;
                } catch (retryErr) {
                    if (retryErr?.name === 'CanceledError' || retryErr?.name === 'AbortError' || retryErr?.code === 'ERR_CANCELED' || /cancel|abort/i.test(retryErr?.message || '')) {
                        return null;
                    }
                    if (sessionId && activeSessionIdRef.current !== sessionId) {
                        return null;
                    }
                    sttFailureCountRef.current += 1;
                    const rCode = retryErr?.response?.data?.code;
                    const rMsg = retryErr?.response?.data?.message || retryErr?.response?.data?.error;

                    let noticeText = 'Whisper service abhi busy hai. Dobara try karein.';
                    if (rCode === 'STT_NO_SPEECH') {
                        noticeText = 'Awaaz saaf nahi aayi, dobara bolein';
                    } else if (rCode === 'STT_RATE_LIMIT' || rCode === 'STT_BUDGET_EXCEEDED') {
                        noticeText = 'Voice limit khatam, text se continue karein';
                    } else if (rCode === 'STT_BAD_AUDIO') {
                        noticeText = 'Awaaz record theek se nahi hui, dobara bolein';
                    } else if (rCode === 'STT_FORMAT_ERROR') {
                        noticeText = 'Mic ki awaaz format support nahi hua';
                    } else if (rMsg) {
                        noticeText = rMsg;
                    }
                    setNotice(noticeText);
                    setError(rMsg || noticeText);
                }
            } else {
                sttFailureCountRef.current += 1;
                const errCode = firstErr?.response?.data?.code;
                const errMsg = firstErr?.response?.data?.message || firstErr?.response?.data?.error;
                let noticeText = 'Whisper service abhi busy hai. Dobara try karein.';
                if (errCode === 'STT_NO_SPEECH') {
                    noticeText = 'Awaaz saaf nahi aayi, dobara bolein';
                } else if (errMsg) {
                    noticeText = errMsg;
                }
                setNotice(noticeText);
                setError(errMsg || noticeText);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
            setIsTranscribing(false);
            isTranscribingRef.current = false;
        }

        // Notify user if Whisper is struggling without silently switching modes behind their back
        if (sttFailureCountRef.current >= 2 && SR) {
            setNotice('Whisper mic saaf nahi sun pa raha. Aap uper "Live (Browser)" switch kar sakte hain.');
        }

        return data;
    }, [lang, SR, maxSttUploads]);

    // Start Groq Whisper recording
    const startWhisper = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('unsupported');
            return;
        }

        sessionCounterRef.current += 1;
        const currentSessionId = sessionCounterRef.current;
        activeSessionIdRef.current = currentSessionId;
        userStoppedRef.current = false;
        audioChunksRef.current = [];
        speechDetectedRef.current = false;
        segmentSpeechDetectedRef.current = false;
        inactivityPhaseRef.current = 0;
        setError(null);
        if (sttFailureCountRef.current === 0) {
            setNotice(null);
        }
        setIsPaused(false);
        setInterim('');
        chunkCutPendingRef.current = false;

        isStartingRef.current = true;
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            audioStreamRef.current = stream;
            setMicPermission('granted');
            micPermissionRef.current = 'granted';
        } catch (err) {
            isStartingRef.current = false;
            setListeningTracked(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('not-allowed');
                setNotice('Mic permission nahi mili. Aap type karke task bana sakte hain.');
                setMicPermission('denied');
                micPermissionRef.current = 'denied';
            } else {
                setError('mic-failed');
                setNotice('Microphone connect nahi ho saka. Aap type karke task bana sakte hain.');
            }
            return;
        }

        // If stopped or invalidated while awaiting getUserMedia
        if (activeSessionIdRef.current !== currentSessionId) {
            isStartingRef.current = false;
            if (stream) {
                try { stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
            }
            return;
        }

        // Supported mime selection
        const candidateMimes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
        ];
        let chosenMime = '';
        let ext = 'webm';
        if (typeof window !== 'undefined' && window.MediaRecorder) {
            for (const m of candidateMimes) {
                if (MediaRecorder.isTypeSupported(m)) {
                    chosenMime = m;
                    if (m.includes('mp4')) ext = 'mp4';
                    else if (m.includes('ogg')) ext = 'ogg';
                    else ext = 'webm';
                    break;
                }
            }
        }

        const options = chosenMime ? { mimeType: chosenMime } : undefined;
        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch {
            mediaRecorder = new MediaRecorder(stream);
        }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
            }
        };

        const recordingStartTime = Date.now();
        segmentStartTimeRef.current = recordingStartTime;

        const recordingStream = stream;
        mediaRecorder.onstop = async () => {
            if (activeSessionIdRef.current !== currentSessionId || currentSessionId === 0) {
                if (import.meta.env.DEV) {
                    console.info('[useSpeech] Dropped audio blob because session was invalidated', { currentSessionId, activeSessionId: activeSessionIdRef.current });
                }
                audioChunksRef.current = [];
                try { recordingStream?.getTracks().forEach((t) => t.stop()); } catch {}
                return;
            }

            cleanupAudioNodes();
            setListeningTracked(false);

            const durationMs = Date.now() - recordingStartTime;
            const chunks = [...audioChunksRef.current];
            audioChunksRef.current = [];
            const finalMime = mediaRecorder.mimeType || chosenMime || 'audio/webm';
            const audioBlob = chunks.length ? new Blob(chunks, { type: finalMime }) : null;

            // Telemetry logging for diagnostics
            lastDiagRef.current.durationMs = durationMs;
            lastDiagRef.current.blobSize = audioBlob ? audioBlob.size : 0;
            lastDiagRef.current.mimeType = finalMime;

            // Discard only if audio blob is missing or corrupt/too small (allow short words down to 250ms)
            if (!audioBlob || audioBlob.size < 400 || durationMs < 250) {
                if (speechDetectedRef.current) {
                    setNotice('Awaaz bahut chhoti thi, dobara bolein');
                }
                if (!userMutedRef.current && activeSessionIdRef.current === currentSessionId) {
                    setTimeout(() => {
                        if (!userMutedRef.current && !isSpeakingRef.current && !isTranscribingRef.current) {
                            start({ force: true });
                        }
                    }, 400);
                }
                return;
            }

            const data = await uploadAudioBlob(audioBlob, ext, durationMs, currentSessionId);
            if (data?.text && activeSessionIdRef.current === currentSessionId) {
                dispatchFinalText(data.text.trim(), currentSessionId);
            } else if (!userMutedRef.current && activeSessionIdRef.current === currentSessionId) {
                // If Whisper caught no speech or returned empty, re-arm mic for user in hands-free voice mode
                setTimeout(() => {
                    if (!userMutedRef.current && !isSpeakingRef.current && !isTranscribingRef.current) {
                        start({ force: true });
                    }
                }, 400);
            }
        };

        mediaRecorderRef.current = mediaRecorder;
        lastSpeechOrListenStartRef.current = recordingStartTime;
        mediaRecorder.start();
        isStartingRef.current = false;
        setListeningTracked(true);

        startAudioAnalyser(
            stream,
            (reason) => {
                stop(reason);
            }
        );

        durationTimerRef.current = setInterval(() => {
            setDurationSeconds((s) => s + 1);
        }, 1000);

        // Hard cap at 20s
        hardCapTimerRef.current = setTimeout(() => {
            stop('cap');
        }, 20000);
    }, [cleanupAudioNodes, startAudioAnalyser, stop, uploadAudioBlob, dispatchFinalText]);

    // Unified start listening (half-duplex: strictly blocked while speaking, respects userMuted)
    const start = useCallback(
        ({ force = false } = {}) => {
            if (force) {
                // Force mode: clear all speaking, muting, and transcribing locks
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                    try { window.speechSynthesis.cancel(); } catch {}
                }
                activeUtteranceRef.current = null;
                if (typeof window !== 'undefined') {
                    window.__ciisCurrentUtterance = null;
                    window.__ciisVoiceSpeaking = false;
                }
                isSpeakingRef.current = false;
                setIsSpeaking(false);
                userMutedRef.current = false;
                setUserMuted(false);
                isStartingRef.current = false;
                isTranscribingRef.current = false;
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    try {
                        mediaRecorderRef.current.stop();
                    } catch {}
                }
                if (speakTimeoutRef.current) {
                    clearTimeout(speakTimeoutRef.current);
                    speakTimeoutRef.current = null;
                }
            } else {
                if (listening || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') || isStartingRef.current || isTranscribingRef.current) {
                    return;
                }

                if (userMutedRef.current) {
                    if (import.meta.env.DEV) {
                        console.info('[useSpeech] start() ignored because user tapped mute in current window');
                    }
                    return;
                }
            }

            if (!force && (isSpeakingRef.current || (typeof window !== 'undefined' && window.__ciisVoiceSpeaking))) {
                // If browser speech synthesis has actually finished, has no active utterance, or was cancelled, clear stuck speaking flags
                if (!activeUtteranceRef.current || (ttsSupported && !window.speechSynthesis?.speaking)) {
                    isSpeakingRef.current = false;
                    if (typeof window !== 'undefined') {
                        window.__ciisVoiceSpeaking = false;
                    }
                    setIsSpeaking(false);
                } else {
                    console.warn('[useSpeech] Cannot start listening while agent is speaking (half-duplex)');
                    return;
                }
            }

            turnDispatchedRef.current = false;
            cleanupAudioNodes();
            setIsPaused(false);
            setError(null);
            setNotice(null);

            if (engine === 'whisper') {
                return startWhisper();
            } else {
                return Promise.resolve(startBrowserSpeech());
            }
        },
        [ttsSupported, cleanupAudioNodes, engine, startWhisper, startBrowserSpeech]
    );
    startRef.current = start;

    // TTS Speaking helper with onEnd completion callback (half-duplex: mutes mic)
    const speak = useCallback(
        (speechDevanagari, replyHinglish, onEnd) => {
            // Half-duplex: stop listening immediately before speaking begins
            stop('agent-speaking');
            try {
                recRef.current?.abort();
            } catch {
                /* ignore */
            }

            if (!ttsSupported) {
                if (onEnd) onEnd();
                return;
            }

            window.speechSynthesis.cancel();
            if (speakTimeoutRef.current) {
                clearInterval(speakTimeoutRef.current);
                speakTimeoutRef.current = null;
            }

            const sanitizeTtsWords = (t) => {
                if (!t) return '';
                return t
                    .replace(/\bCIIS\s*AI\b/gi, 'C I I S A I')
                    .replace(/\bCIIS\b/gi, 'C I I S')
                    .replace(/विवरण/gu, 'Description')
                    .replace(/डिस्क्रिप्शन/gu, 'Description')
                    .replace(/प्राथमिकता/gu, 'Priority')
                    .replace(/प्रायोरिटी/gu, 'Priority');
            };

            const devanagariClean = sanitizeTtsWords(stripEmojis(speechDevanagari));
            const hinglishClean = sanitizeTtsWords(stripEmojis(replyHinglish));
            if (!devanagariClean && !hinglishClean) {
                if (onEnd) onEnd();
                return;
            }

            lastSpokenAssistantTextRef.current = hinglishClean || devanagariClean;

            const voices = voicesRef.current.length > 0 ? voicesRef.current : (window.speechSynthesis.getVoices() || []);
            const hiInVoice =
                voices.find((x) => x.lang === 'hi-IN' || x.lang === 'hi_IN') ||
                voices.find((x) => x.lang?.toLowerCase().startsWith('hi'));
            const enInVoice =
                voices.find((x) => x.lang === 'en-IN' || x.lang === 'en_IN') ||
                voices.find((x) => x.lang?.toLowerCase().startsWith('en'));

            // Prefer en-IN Indian English voice when English technical terms like description or priority are present
            // so these words are pronounced in natural, authentic English rather than Hindi phonetics
            const hasEnglishTechWords = /\b(?:description|priority|project|client|task)\b/i.test(hinglishClean || devanagariClean);
            const voiceToUse = (hasEnglishTechWords && enInVoice) ? enInVoice : (hiInVoice || enInVoice);
            const isHindi = Boolean(!hasEnglishTechWords && voiceToUse === hiInVoice && devanagariClean);
            const textToSpeak = isHindi ? devanagariClean : (hinglishClean || devanagariClean);
            const langToUse = isHindi ? (voiceToUse?.lang || 'hi-IN') : (enInVoice?.lang || 'en-IN');

            // Chunk long utterances sentence-by-sentence to avoid Chromium cutoff
            const sentenceMatches = textToSpeak.match(/[^.!?।\n]+[.!?।\n]*/g);
            const sentenceChunks = (sentenceMatches && sentenceMatches.length > 0)
                ? sentenceMatches.map((s) => s.trim()).filter(Boolean)
                : [textToSpeak];

            isSpeakingRef.current = true;
            window.__ciisVoiceSpeaking = true;
            setIsSpeaking(true);

            let ended = false;
            let lastBoundaryTime = Date.now();
            const startTime = Date.now();
            const charCount = textToSpeak.length;
            // Estimated duration: realistic speaking rate (approx 65-70ms per char + 2s grace)
            const estimatedMs = Math.max(3000, Math.min(25000, charCount * 70 + 2000));

            // Retain utterances on window so Chromium V8 never garbage-collects them mid-speech
            if (typeof window !== 'undefined') {
                window.__ciisUtterances = window.__ciisUtterances || [];
            }

            const handleFinish = (shouldCancel = true) => {
                if (ended) return;
                ended = true;
                if (speakTimeoutRef.current) {
                    clearInterval(speakTimeoutRef.current);
                    speakTimeoutRef.current = null;
                }
                activeUtteranceRef.current = null;
                if (typeof window !== 'undefined') {
                    window.__ciisCurrentUtterance = null;
                    window.__ciisUtterances = [];
                }
                if (ttsSupported && shouldCancel) {
                    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
                }
                isSpeakingRef.current = false;
                window.__ciisVoiceSpeaking = false;
                speechEndedAtRef.current = Date.now();
                setIsSpeaking(false);
                lastSpeechOrListenStartRef.current = Date.now();
                if (onEnd) onEnd();
            };

            // Watchdog: restores state when estimated duration has passed and no recent progress
            // Also prevents Chromium's 15s pause bug by un-pausing if paused
            speakTimeoutRef.current = setInterval(() => {
                if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
                    try { window.speechSynthesis.resume(); } catch {}
                }
                const elapsed = Date.now() - startTime;
                const timeSinceLastBoundary = Date.now() - lastBoundaryTime;
                if (elapsed >= estimatedMs && timeSinceLastBoundary >= 2000) {
                    handleFinish(false);
                }
            }, 400);

            sentenceChunks.forEach((chunkText, idx) => {
                const isLast = idx === sentenceChunks.length - 1;
                const utterance = new SpeechSynthesisUtterance(chunkText);
                if (voiceToUse) utterance.voice = voiceToUse;
                utterance.lang = langToUse;
                utterance.rate = 1.0;

                if (typeof window !== 'undefined' && window.__ciisUtterances) {
                    window.__ciisUtterances.push(utterance);
                }

                utterance.onboundary = () => {
                    lastBoundaryTime = Date.now();
                };

                if (idx === 0) {
                    activeUtteranceRef.current = utterance;
                    if (typeof window !== 'undefined') {
                        window.__ciisCurrentUtterance = utterance;
                    }
                }

                utterance.onerror = () => {
                    if (isLast) handleFinish(false);
                };

                if (isLast) {
                    utterance.onend = () => handleFinish(false);
                }

                try {
                    window.speechSynthesis.speak(utterance);
                } catch {
                    if (isLast) handleFinish(false);
                }
            });

            if (window.speechSynthesis.paused) {
                try { window.speechSynthesis.resume(); } catch { /* ignore */ }
            }
        },
        [ttsSupported, stop]
    );

    const cancelSpeech = useCallback(() => {
        if (ttsSupported) {
            try {
                window.speechSynthesis.cancel();
            } catch {
                /* ignore */
            }
        }
        if (speakTimeoutRef.current) {
            clearInterval(speakTimeoutRef.current);
            speakTimeoutRef.current = null;
        }
        activeUtteranceRef.current = null;
        if (typeof window !== 'undefined') {
            window.__ciisCurrentUtterance = null;
            window.__ciisUtterances = [];
            window.__ciisVoiceSpeaking = false;
        }
        isSpeakingRef.current = false;
        speechEndedAtRef.current = Date.now();
        setIsSpeaking(false);
        lastSpeechOrListenStartRef.current = Date.now();
    }, [ttsSupported]);

    // Voice Note recorder for task attachments
    const startVoiceNoteRecording = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('MediaRecorder not supported');
        }
        voiceNoteChunksRef.current = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                voiceNoteChunksRef.current.push(event.data);
            }
        };

        voiceNoteRecorderRef.current = recorder;
        recorder.start();
        setRecordingVoiceNote(true);
    }, []);

    const stopVoiceNoteRecording = useCallback(() => {
        return new Promise((resolve) => {
            const recorder = voiceNoteRecorderRef.current;
            if (!recorder || recorder.state === 'inactive') {
                setRecordingVoiceNote(false);
                resolve(null);
                return;
            }
            recorder.onstop = () => {
                const mimeType = recorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(voiceNoteChunksRef.current, { type: mimeType });
                try {
                    recorder.stream?.getTracks().forEach((t) => t.stop());
                } catch {
                    /* ignore */
                }
                setRecordingVoiceNote(false);
                resolve(audioBlob);
            };
            recorder.stop();
        });
    }, []);

    // Unmount cleanup: release microphone streams and cancel timers
    useEffect(() => {
        return () => {
            cleanupAudioNodes();
            if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
            try {
                recRef.current?.abort();
            } catch {
                /* ignore */
            }
            try {
                voiceNoteRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
            } catch {
                /* ignore */
            }
            if (ttsSupported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [cleanupAudioNodes, ttsSupported]);

    return {
        engine,
        setEngine,
        lang,
        setLang,
        sttSupported,
        ttsSupported,
        listening,
        listeningRef,
        isTranscribing,
        isSpeaking,
        isSpeakingRef,
        isPaused,
        setIsPaused,
        interim,
        audioLevel,
        durationSeconds,
        error,
        setError,
        notice,
        setNotice,
        hasHindiVoice,
        start,
        stop,
        speak,
        cancelSpeech,
        recordingVoiceNote,
        startVoiceNoteRecording,
        stopVoiceNoteRecording,
        sttUploadCount,
        resetSttUploadCount,
        vadStats,
        userMuted,
        userMutedRef,
        setUserMuted,
        clearUserMute,
        lastDiag: lastDiagRef.current,
        micPermission,
        micPermissionRef,
        setMicPermission,
        lastTranscriptDiag,
        setLastTranscriptDiag,
        updateTranscriptDiag,
    };
}