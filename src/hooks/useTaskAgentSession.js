import { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance, { clearAllCaches } from '../utils/axiosConfig';
import useSpeech from './useSpeech';
import { markTaskIdAsCreated, broadcastTaskCreated, invalidateTaskManagementCache } from './useTaskRealtime';
import { AI_ENDPOINTS } from '../constants/aiEndpoints';
import {
    candidateId,
    mapTaskAgentError,
    isRefusalOrEditIntent,
    hasFieldChangeIntent,
    isConfirmationIntent,
    isFillerOnlyTranscript,
    canAcceptConfirm,
    resolveConfirmPayload,
    shouldAutoListenAfterTurn,
    createTtsWatchdog,
    validateAttachmentFile,
    buildTaskFormDataEntries,
    getRoleAwareGreeting,
    cleanForSpeech,
    resolveSpokenText,
    determineTurnSpeechAndMicAction,
    formatSpokenForTTS,
    buildParseRequestBody,
    MAX_FILES,
    MAX_FILE_SIZE_BYTES,
    ALLOWED_EXTS,
} from './taskAgentPureLogic';

const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
    } catch {
        return {};
    }
};

/**
 * useTaskAgentSession
 * 
 * Shared session hook extracted directly from AIChatDrawer.jsx.
 * Preserves exact original state order, turn mechanics, slot-filling refs,
 * assignee disambiguation, attachment handling, and realtime task creation.
 */
export default function useTaskAgentSession({
    open = false,
    onClose,
    startWithMic = false,
    variant = 'side', // 'side' | 'voice'
} = {}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [autoSendVoice, setAutoSendVoice] = useState(false);
    const [autoSendCountdown, setAutoSendCountdown] = useState(null);
    const [readyCountdown, setReadyCountdown] = useState(null);
    const [files, setFiles] = useState([]);
    const [voiceNoteBlob, setVoiceNoteBlob] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [fileError, setFileError] = useState(null);
    const [highlightPaperclip, setHighlightPaperclip] = useState(false);
    const [liveTranscriptText, setLiveTranscriptText] = useState('');
    const [enHindiHint, setEnHindiHint] = useState(null);

    const draftRef = useRef(null);
    const resultRef = useRef(null);
    const idRef = useRef(0);
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const sendRef = useRef(null);
    const autoSendIntervalRef = useRef(null);
    const countdownTargetRef = useRef(null);
    const readyCountdownIntervalRef = useRef(null);
    const confirmHandlerRef = useRef(null);
    const isCreatingRef = useRef(false);
    const inputSourceRef = useRef('typed'); // 'voice' | 'typed'
    // Session-level mic mode state: 'voice' once spoken or tapped, 'typed' when keyboard text sent or muted
    const micModeRef = useRef(variant === 'voice' || startWithMic ? 'voice' : 'typed');
    const spokenMessageIdsRef = useRef(new Set());
    const isTypingRef = useRef(false);

    const cancelAutoSend = useCallback(() => {
        if (autoSendIntervalRef.current) {
            clearInterval(autoSendIntervalRef.current);
            autoSendIntervalRef.current = null;
        }
        setAutoSendCountdown(null);
    }, []);

    const cancelReadyCountdown = useCallback(() => {
        if (readyCountdownIntervalRef.current) {
            clearInterval(readyCountdownIntervalRef.current);
            readyCountdownIntervalRef.current = null;
        }
        setReadyCountdown(null);
    }, []);

    const pushMsg = useCallback((role, text, extra = {}) => {
        idRef.current += 1;
        const newId = idRef.current;
        setMessages((m) => [...m, { id: newId, role, text, ...extra }]);
        return newId;
    }, []);

    const handleFinalTranscriptRef = useRef(null);

    const {
        engine,
        setEngine,
        lang,
        setLang,
        sttSupported,
        ttsSupported,
        listening,
        isTranscribing,
        isSpeaking,
        isPaused,
        setIsPaused,
        interim,
        audioLevel,
        durationSeconds,
        error: speechError,
        setError: setSpeechError,
        notice: speechNotice,
        setNotice,
        start,
        stop,
        speak: rawSpeak,
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
    } = useSpeech({
        defaultEngine: 'whisper',
        defaultLang: 'auto', // Defaults to auto language detection
        enableChunking: false,
        maxSttUploads: 12,
        onFinalTranscript: (text) => handleFinalTranscriptRef.current?.(text),
        onInactivityPrompt: () => {
            if (autoSpeak) {
                rawSpeak('मैं सुन रहा हूँ, बोलिये', 'Main sun raha hoon, boliye');
            }
        },
        onInactivityPause: () => {
            // Orb transitions to PAUSED state
        },
    });

    // Formats any spoken speech phonetically (e.g. "CIIS AI" -> "C I I S A I") so TTS never mispronounces it
    const speak = useCallback((speechText, fallbackText, onEnd) => {
        const fmtSpeech = formatSpokenForTTS(speechText);
        const fmtFallback = formatSpokenForTTS(fallbackText);
        rawSpeak(fmtSpeech, fmtFallback, onEnd);
    }, [rawSpeak]);

    // Auto-dismiss mic error notices after 5 seconds
    useEffect(() => {
        if (speechError) {
            const t = setTimeout(() => setSpeechError?.(null), 5000);
            return () => clearTimeout(t);
        }
    }, [speechError, setSpeechError]);

    const resetFlow = useCallback(() => {
        draftRef.current = null;
        resultRef.current = null;
        isCreatingRef.current = false;
        setResult(null);
        setFiles([]);
        setVoiceNoteBlob(null);
        setUploadProgress(null);
        setFileError(null);
        setHighlightPaperclip(false);
        setLiveTranscriptText('');
        setEnHindiHint(null);
        cancelAutoSend();
        cancelReadyCountdown();
    }, [cancelAutoSend, cancelReadyCountdown]);

    // Send Turn to Backend Task Agent
    const sendTurn = useCallback(
        async ({ text = '', action, pick, draftPatch, display, source }) => {
            cancelAutoSend();
            cancelReadyCountdown();
            // Sending a message (typed, chip, voice) clears mute from the previous window (Requirement 1)
            clearUserMute();
            isTypingRef.current = false;

            const turnSource = source || inputSourceRef.current || 'typed';
            inputSourceRef.current = 'typed';

            const shown = display !== undefined ? display : text;
            if (!text.trim() && !action && !pick) return;
            if (shown) {
                pushMsg('user', shown);
                setLiveTranscriptText(shown);
            }

            setInput('');
            if (inputRef.current) {
                inputRef.current.value = '';
            }
            setLoading(true);
            cancelSpeech();

            // When ready to create, check if message is a field change, confirmation, or refusal
            const isReady = readyCountdown !== null || resultRef.current?.status === 'ready' || result?.status === 'ready';
            if (isReady && text && !action && !pick) {
                if (hasFieldChangeIntent(text)) {
                    // Field modification requested (e.g. "due time change karo 7 baaj kar 10 min ka karo")
                    // Fall through to backend parse so the draft is updated!
                } else if (isRefusalOrEditIntent(text)) {
                    setLoading(false);
                    const replyMsg = 'Ji batayein kya changes karne hain? Main kar dungi.';
                    const speechMsg = 'जी बताएं क्या बदलाव करने हैं? मैं कर दूंगी।';
                    const msgId = pushMsg('assistant', replyMsg);
                    const isTypingNow = Boolean(isTypingRef.current || inputRef.current?.value?.trim()?.length > 0);
                    const { shouldSpeak, micAction } = determineTurnSpeechAndMicAction({
                        inputSource: turnSource,
                        autoSpeak,
                        ttsSupported,
                        shouldListen: true,
                        isTyping: isTypingNow,
                    });
                    if (shouldSpeak && msgId && !spokenMessageIdsRef.current.has(msgId)) {
                        spokenMessageIdsRef.current.add(msgId);
                        cancelSpeech();
                        if (micAction === 'reopen_after_speech') {
                            let micStarted = false;
                            const reopenMic = () => {
                                if (micStarted) return;
                                if (userMutedRef.current) return;
                                if (isTypingRef.current || inputRef.current?.value?.trim()?.length > 0) return;
                                if (!autoSpeak) return;
                                if (resultRef.current?.status === 'created' || resultRef.current?.status === 'cancelled' || isCreatedRef.current) return;
                                micStarted = true;
                                cancelSpeech();
                                clearUserMute();
                                setTimeout(() => start({ force: true })?.catch?.(() => {}), 200);
                            };
                            const watchdog = createTtsWatchdog(() => {
                                cancelSpeech();
                                reopenMic();
                            }, replyMsg.length);
                            speak(speechMsg, replyMsg, () => {
                                watchdog.cancel();
                                reopenMic();
                            });
                        } else {
                            speak(speechMsg, replyMsg);
                        }
                    } else if (!shouldSpeak && micAction === 'reopen_after_delay') {
                        setTimeout(() => {
                            if (!userMutedRef.current && !isTypingRef.current && !inputRef.current?.value?.trim()?.length) {
                                start({ force: true })?.catch?.(() => {});
                            }
                        }, 200);
                    }
                    return;
                } else if (isConfirmationIntent(text)) {
                    setLoading(false);
                    if (!isCreatingRef.current) {
                        const currentDraft = resultRef.current?.draft || draftRef.current || result?.draft;
                        confirmHandlerRef.current?.(resolveConfirmPayload(null, resultRef.current?.payload || result?.payload, currentDraft));
                    }
                    return;
                } else {
                    setLoading(false);
                    const noiseReply = 'Samajh nahi aaya. Create kar doon? Haan ya nahi bolein, ya bataiye kya badalna hai.';
                    const noiseSpeech = 'समझ नहीं आया। क्या बना दूं? हां या नहीं बोलें, या बताइए क्या बदलना है।';
                    const msgId = pushMsg('assistant', noiseReply);
                    const isTypingNow = Boolean(isTypingRef.current || inputRef.current?.value?.trim()?.length > 0);
                    const { shouldSpeak, micAction } = determineTurnSpeechAndMicAction({
                        inputSource: turnSource,
                        autoSpeak,
                        ttsSupported,
                        shouldListen: true,
                        isTyping: isTypingNow,
                    });
                    if (shouldSpeak && msgId && !spokenMessageIdsRef.current.has(msgId)) {
                        spokenMessageIdsRef.current.add(msgId);
                        cancelSpeech();
                        if (micAction === 'reopen_after_speech') {
                            let micStarted = false;
                            const reopenMic = () => {
                                if (micStarted) return;
                                if (userMutedRef.current) return;
                                if (isTypingRef.current || inputRef.current?.value?.trim()?.length > 0) return;
                                if (!autoSpeak) return;
                                if (resultRef.current?.status === 'created' || resultRef.current?.status === 'cancelled' || isCreatedRef.current) return;
                                micStarted = true;
                                cancelSpeech();
                                clearUserMute();
                                setTimeout(() => start({ force: true })?.catch?.(() => {}), 200);
                            };
                            const watchdog = createTtsWatchdog(() => {
                                cancelSpeech();
                                reopenMic();
                            }, noiseReply.length);
                            speak(noiseSpeech, noiseReply, () => {
                                watchdog.cancel();
                                reopenMic();
                            });
                        } else {
                            speak(noiseSpeech, noiseReply);
                        }
                    } else if (!shouldSpeak && micAction === 'reopen_after_delay') {
                        setTimeout(() => {
                            if (!userMutedRef.current && !isTypingRef.current && !inputRef.current?.value?.trim()?.length) {
                                start({ force: true })?.catch?.(() => {});
                            }
                        }, 200);
                    }
                    return;
                }
            }

            const baseDraft = draftRef.current;
            const draft = draftPatch ? { ...(baseDraft || {}), ...draftPatch } : baseDraft;

            const TURN_TIMEOUT_MS = 25000;
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => {
                abortController.abort();
            }, TURN_TIMEOUT_MS);

            try {
                const requestPayload = buildParseRequestBody({
                    text,
                    action,
                    pick,
                    draft,
                    language: 'hinglish',
                });
                const { data } = await axiosInstance.post(
                    AI_ENDPOINTS.TASK_AGENT_PARSE,
                    requestPayload,
                    {
                        signal: abortController.signal,
                        timeout: TURN_TIMEOUT_MS,
                    }
                );

                draftRef.current = data.draft || draft || null;
                resultRef.current = data;
                setResult(data);

                let assistantMsgId = null;
                if (data.reply) {
                    assistantMsgId = pushMsg('assistant', data.reply);
                }

                if (data.field === 'attachments') {
                    setHighlightPaperclip(true);
                } else {
                    setHighlightPaperclip(false);
                }

                const spokenText = resolveSpokenText(data, data.reply);
                const spokenSpeech = data.speech ? cleanForSpeech(data.speech) : spokenText;

                const isTypingNow = Boolean(isTypingRef.current || inputRef.current?.value?.trim()?.length > 0);

                const shouldListen = shouldAutoListenAfterTurn({
                    status: data.status,
                    field: data.field,
                    userMuted: false, // cleared on turn send; userMuted only pauses the current listening window
                    isCreated: false,
                    isTyping: isTypingNow,
                });

                if (data.status === 'ready') {
                    cancelReadyCountdown();
                }

                const { shouldSpeak, micAction } = determineTurnSpeechAndMicAction({
                    inputSource: turnSource,
                    autoSpeak,
                    ttsSupported,
                    shouldListen,
                    isTyping: isTypingNow,
                });

                if (shouldSpeak && assistantMsgId && !spokenMessageIdsRef.current.has(assistantMsgId)) {
                    spokenMessageIdsRef.current.add(assistantMsgId);
                    cancelSpeech();

                    if (micAction === 'reopen_after_speech') {
                        let micStarted = false;
                        const reopenMic = () => {
                            if (micStarted) return;
                            // 1. User tapped mute during speech in current window (Requirement 2)
                            if (userMutedRef.current) return;
                            // 2. User is currently typing in composer (Requirement 2)
                            if (isTypingRef.current || inputRef.current?.value?.trim()?.length > 0) {
                                console.info('[useTaskAgentSession] Auto-mic skipped because user is typing in composer');
                                return;
                            }
                            // 3. Speaker toggle is OFF (text mode) (Requirement 2)
                            if (!autoSpeak) return;
                            // 4. Task was created or cancelled (Requirement 2)
                            if (resultRef.current?.status === 'created' || resultRef.current?.status === 'cancelled' || isCreatedRef.current) return;

                            micStarted = true;
                            cancelSpeech();
                            clearUserMute();
                            setTimeout(() => {
                                start({ force: true })?.catch?.(() => {});
                            }, 200);
                        };

                        const charLen = spokenText.length;
                        const watchdog = createTtsWatchdog(() => {
                            cancelSpeech();
                            reopenMic();
                        }, charLen);

                        speak(spokenSpeech, spokenText, () => {
                            watchdog.cancel();
                            reopenMic();
                        });
                    } else {
                        // Speaks, but micAction is 'none' -> mic stays closed (e.g. typed + speaker ON)
                        speak(spokenSpeech, spokenText);
                    }
                } else if (!shouldSpeak && micAction === 'reopen_after_delay') {
                    // Voice + speaker OFF: silent, mic reopens after 200ms
                    setTimeout(() => {
                        if (!userMutedRef.current && !isTypingRef.current && !inputRef.current?.value?.trim()?.length) {
                            start({ force: true })?.catch?.(() => {});
                        }
                    }, 200);
                }

                if (data.status === 'cancelled') {
                    if (autoSpeak) {
                        cancelSpeech();
                        speak('टास्क कैंसिल कर दिया गया है', 'Task cancel kar diya gaya hai');
                    }
                    stop('cancelled');
                }
            } catch (err) {
                // Every single failure path produces a visible error message bubble
                const msg = mapTaskAgentError(err);
                const errId = pushMsg('assistant', msg, { isError: true });
                const cleanError = cleanForSpeech(msg);

                const { shouldSpeak } = determineTurnSpeechAndMicAction({
                    inputSource: turnSource,
                    autoSpeak,
                    ttsSupported,
                    shouldListen: false,
                });

                if (shouldSpeak && errId && !spokenMessageIdsRef.current.has(errId)) {
                    spokenMessageIdsRef.current.add(errId);
                    cancelSpeech();
                    speak('कुछ गड़बड़ हो गई', cleanError);
                }
                if (turnSource === 'voice' && !userMutedRef.current) {
                    setTimeout(() => start(), 500);
                }
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        },
        [variant, autoSpeak, speak, cancelSpeech, pushMsg, cancelAutoSend, cancelReadyCountdown, start, stop, result?.status, ttsSupported, userMuted]
    );

    sendRef.current = sendTurn;

    // Handle incoming transcript (full or segment-cut)
    const handleFinalTranscript = useCallback(
        (text) => {
            const clean = String(text || '').trim();
            if (!clean) return;

            micModeRef.current = 'voice';
            inputSourceRef.current = 'voice';
            setSpeechError?.(null);
            setNotice(null);
            setLiveTranscriptText(clean);

            // Check if user spoke Hindi/Hinglish while mic mode was set to English
            if (lang && lang.toLowerCase().startsWith('en')) {
                if (/\b(?:karo|karna|kar\s*do|bana\s*do|hai|hoon|baje|kal|subah|aaj|shaam|mera|meri|naam|baaki|baki|theek|nahi|chahiye|aur|kisko|kiska)\b/i.test(clean)) {
                    setEnHindiHint('Hindi bol rahe hain? हि mode chunein');
                } else {
                    setEnHindiHint(null);
                }
            } else {
                setEnHindiHint(null);
            }

            if (variant === 'voice' || autoSpeak) {
                const lower = clean.toLowerCase();

                // If currently in ready state:
                const isReady = readyCountdown !== null || resultRef.current?.status === 'ready' || result?.status === 'ready';
                if (isReady) {
                    // Dev-only logging for turns in confirming/ready state
                    if (import.meta.env?.DEV) {
                        let intentDecision = 'none';
                        if (hasFieldChangeIntent(clean)) intentDecision = 'field_change';
                        else if (isRefusalOrEditIntent(clean)) intentDecision = 'refusal_or_edit';
                        else if (isConfirmationIntent(clean)) intentDecision = 'confirm';
                        else intentDecision = 'unmatched';

                        console.log('[Dev Voice Turn - Confirming State]', {
                            rawSTTTranscript: text,
                            normalizedText: clean,
                            currentState: resultRef.current?.status || result?.status || (readyCountdown !== null ? 'ready' : 'unknown'),
                            intentDecision,
                        });
                    }

                    if (hasFieldChangeIntent(clean)) {
                        cancelReadyCountdown();
                        inputSourceRef.current = 'voice';
                        sendRef.current?.({ text: clean, source: 'voice' });
                        return;
                    }

                    if (isRefusalOrEditIntent(clean)) {
                        cancelReadyCountdown();
                        pushMsg('user', clean);
                        const replyMsg = 'Ji batayein kya changes karne hain? Main kar dungi.';
                        const speechMsg = 'जी बताएं क्या बदलाव करने हैं? मैं कर दूंगी।';
                        pushMsg('assistant', replyMsg);
                        if (autoSpeak) {
                            speak(speechMsg, replyMsg, () => {
                                setTimeout(() => start(), 300);
                            });
                        } else {
                            setTimeout(() => start(), 300);
                        }
                        return;
                    }

                    if (isConfirmationIntent(clean)) {
                        cancelReadyCountdown();
                        pushMsg('user', clean);
                        confirmHandlerRef.current?.(resultRef.current?.payload || result?.payload);
                        return;
                    }

                    // In confirming state, drop non-confirmation filler/acknowledgement words (e.g. "thank you" must NOT count as yes)
                    if (isFillerOnlyTranscript(clean)) {
                        if (import.meta.env?.DEV) {
                            console.info('[useTaskAgentSession] Ignored non-confirmation filler in confirming state:', clean);
                        }
                        return;
                    }
                }

                // If in idle state (no question pending, no draft being collected), drop filler-only transcripts
                const isQuestionPending = Boolean(resultRef.current?.field || result?.field || isReady);
                if (!isQuestionPending && isFillerOnlyTranscript(clean)) {
                    if (import.meta.env?.DEV) {
                        console.info('[useTaskAgentSession] Dropped filler-only transcript in idle state:', clean);
                    }
                    return;
                }

                if (/\b(?:band\s*karo|close|exit|खत्म\s*करो)\b/i.test(lower)) {
                    stop('user-exit');
                    cancelSpeech();
                    onClose?.();
                    return;
                }

                // Check attachments voice response
                if (result?.field === 'attachments') {
                    if (/\b(?:haan|ha|yes|karni\s*hai|photo|file|हाँ|हां)\b/i.test(lower)) {
                        pushMsg('user', clean);
                        stop('attachment-pick');
                        setIsPaused(true);
                        try {
                            fileInputRef.current?.click();
                        } catch {
                            /* ignore */
                        }
                        pushMsg('assistant', 'Paperclip button dabakar file chunein, ya "nahi" bolein.');
                        if (autoSpeak) speak('पेपरक्लिप बटन दबाकर फाइल चुनें', 'Paperclip button dabakar file chunein');
                        return;
                    }
                }

                // Auto-send immediately in voice mode without manual button press
                inputSourceRef.current = 'voice';
                sendRef.current?.({ text: clean, source: 'voice' });
                return;
            }

            // In Side mode: drop filler in idle state
            const isQuestionPendingSide = Boolean(resultRef.current?.field || result?.field || readyCountdown !== null || resultRef.current?.status === 'ready' || result?.status === 'ready');
            if (!isQuestionPendingSide && isFillerOnlyTranscript(clean)) {
                if (import.meta.env?.DEV) {
                    console.info('[useTaskAgentSession] Dropped filler-only transcript in idle state:', clean);
                }
                return;
            }

            // In Side mode: manual input or countdown
            setInput(clean);
            const isReadySide = readyCountdown !== null || resultRef.current?.status === 'ready' || result?.status === 'ready';
            if (isReadySide && isConfirmationIntent(clean)) {
                cancelAutoSend();
                cancelReadyCountdown();
                pushMsg('user', clean);
                setInput('');
                confirmHandlerRef.current?.(resultRef.current?.payload || result?.payload);
                return;
            }
            if (autoSendVoice && clean.length > 1) {
                cancelAutoSend();
                let remaining = 1.5;
                setAutoSendCountdown(remaining);
                countdownTargetRef.current = clean;

                autoSendIntervalRef.current = setInterval(() => {
                    remaining = Math.max(0, +(remaining - 0.1).toFixed(1));
                    setAutoSendCountdown(remaining);

                    if (remaining <= 0) {
                        clearInterval(autoSendIntervalRef.current);
                        autoSendIntervalRef.current = null;
                        setAutoSendCountdown(null);
                        sendRef.current?.({ text: countdownTargetRef.current });
                    }
                }, 100);
            }
        },
        [variant, lang, readyCountdown, cancelReadyCountdown, autoSpeak, speak, start, stop, cancelSpeech, onClose, result?.field, result?.status, autoSendVoice, cancelAutoSend, pushMsg, setIsPaused, setNotice, setSpeechError]
    );

    handleFinalTranscriptRef.current = handleFinalTranscript;

    // File addition handler with strict validation
    const handleAddFiles = useCallback(
        (newFilesList) => {
            setFileError(null);
            const valid = [];
            const maxFilesLimit = resultRef.current?.payload?.maxFiles || result?.payload?.maxFiles || (resultRef.current?.draft?.intent === 'task_project' || result?.draft?.intent === 'task_project' ? 1 : MAX_FILES);
            for (const file of newFilesList) {
                const validation = validateAttachmentFile(file, files.length + valid.length, maxFilesLimit);
                if (!validation.valid) {
                    setFileError(validation.error);
                    continue;
                }
                valid.push(file);
            }

            setFiles((prev) => {
                const combined = [...prev, ...valid];
                if (combined.length > maxFilesLimit) {
                    setFileError(`Sirf maximum ${maxFilesLimit} file${maxFilesLimit === 1 ? '' : 's'} attach kar sakte hain.`);
                    const limited = combined.slice(0, maxFilesLimit);
                    sendRef.current?.({
                        action: { type: 'attachments', count: limited.length },
                        display: `📎 ${limited.length} file(s) attached`,
                    });
                    return limited;
                }
                if (valid.length > 0) {
                    sendRef.current?.({
                        action: { type: 'attachments', count: combined.length },
                        display: `📎 ${combined.length} file(s) attached`,
                    });
                }
                return combined;
            });

            if (variant === 'voice' || autoSpeak) {
                setTimeout(() => start(), 400);
            }
        },
        [files.length, variant, start, result?.payload?.maxFiles, result?.draft?.intent]
    );

    const handleRemoveFile = useCallback((index) => {
        setFiles((prev) => {
            const next = prev.filter((_, i) => i !== index);
            sendRef.current?.({
                action: { type: 'attachments', count: next.length },
                display: next.length > 0 ? `📎 ${next.length} file(s) attached` : 'Attachments hata diye',
            });
            return next;
        });
    }, []);

    // Voice note recording
    const toggleVoiceNote = async () => {
        cancelAutoSend();
        if (recordingVoiceNote) {
            const blob = await stopVoiceNoteRecording();
            if (blob) {
                setVoiceNoteBlob(blob);
                pushMsg('user', '🎙️ Voice note attach kiya');
                if (variant === 'voice' || autoSpeak) {
                    setTimeout(() => start(), 400);
                }
            }
        } else {
            try {
                await startVoiceNoteRecording();
            } catch {
                setFileError('Voice note record karne ke liye mic allow karein.');
            }
        }
    };

    // Confirm & create task: SINGLE-FLIGHT LOCK prevents duplicate creation
    // Confirm & create task: SINGLE-FLIGHT LOCK prevents duplicate creation
    const handleConfirm = useCallback(async (overridePayload) => {
        // Enforce single-flight create lock
        if (isCreatingRef.current) {
            console.warn('[useTaskAgentSession] Duplicate confirm ignored (creation in flight)');
            return;
        }

        const currentStatus = resultRef.current?.status || result?.status;
        if (!canAcceptConfirm(currentStatus, isCreatingRef.current)) {
            console.warn('[useTaskAgentSession] Confirm ignored: state is not ready/confirming');
            return;
        }

        isCreatingRef.current = true;
        cancelReadyCountdown();
        stop('task-confirmed');
        cancelSpeech();

        // Extract valid payload: dynamically compile from latest server draft at click time
        const currentDraft = resultRef.current?.draft || draftRef.current || result?.draft;
        const payload = resolveConfirmPayload(overridePayload, resultRef.current?.payload || result?.payload, currentDraft);

        if (!payload || !payload.endpoint) {
            console.warn('[useTaskAgentSession] handleConfirm: No task payload/endpoint available to create', {
                resultRef: resultRef.current,
                result,
                overridePayload,
                currentDraft,
            });
            isCreatingRef.current = false;
            pushMsg('assistant', 'Task payload taiyar nahi hai. Kripya details check karein.', { isError: true });
            return;
        }
        setCreating(true);
        setUploadProgress(0);

        try {
            const entries = buildTaskFormDataEntries({ payload, files, voiceNoteBlob });
            const formData = new FormData();
            entries.forEach(([key, val, filename]) => {
                if (filename) {
                    formData.append(key, val, filename);
                } else {
                    formData.append(key, val);
                }
            });

            const response = await axiosInstance.request({
                url: payload.endpoint,
                method: payload.method || 'POST',
                data: formData,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(pct);
                    }
                },
            });

            const isCreatingProject = payload.endpoint === '/projects';
            if (isCreatingProject) {
                const createdProject = response?.data?.project || response?.data?.newProject || response?.data?.data || null;
                const newProjId = createdProject?._id || createdProject?.id || response?.data?._id;
                const newProjName = createdProject?.projectName || createdProject?.name || payload.fields?.projectName || 'Project';

                clearAllCaches();
                invalidateTaskManagementCache();

                if (typeof window !== 'undefined') {
                    const detail = { project: createdProject || { _id: newProjId, ...payload.fields } };
                    window.dispatchEvent(new CustomEvent('project:created', { detail }));
                    window.dispatchEvent(new CustomEvent('ciis:project-created', { detail }));
                }

                pushMsg('assistant', `Project "${newProjName}" create ho gaya! ✅\n\nIs project mein koi task banana hai?`);
                if (autoSpeak) {
                    cancelSpeech();
                    speak('प्रोजेक्ट बन गया। क्या इसमें टास्क बनाना है?', `Project "${newProjName}" create ho gaya. Is project mein koi task banana hai?`);
                }

                // Chained task prompt: project._id is now known from create response
                setResult({
                    status: 'needs_input',
                    field: 'chain_task_decision',
                    reply: `Project "${newProjName}" create ho gaya! ✅\n\nIs project mein koi task banana hai?`,
                    speech: 'प्रोजेक्ट बन गया। क्या इसमें कोई टास्क बनाना है?',
                    speakText: `Project "${newProjName}" create ho gaya. Is project mein koi task banana hai?`,
                    chips: [
                        {
                            label: 'Haan',
                            action: {
                                type: 'chain_task',
                                projectId: String(newProjId),
                                projectName: newProjName,
                                members: createdProject?.users || [],
                            },
                        },
                        {
                            label: 'Nahi',
                            action: { type: 'finish_chain' },
                        },
                    ],
                    draft: {
                        intent: 'task_project',
                        taskFor: 'project',
                        projectId: String(newProjId),
                        projectName: newProjName,
                    },
                });
                return;
            }

            const createdTask = response?.data?.task || response?.data?.newTask || response?.data?.data || null;
            const newTaskId = createdTask?._id || createdTask?.id || response?.data?._id || response?.data?.id;
            if (newTaskId) {
                markTaskIdAsCreated(newTaskId);
            }

            clearAllCaches();
            invalidateTaskManagementCache();

            const isProject = Boolean(payload.endpoint?.includes('/projects/') || payload.fields?.projectId || currentDraft.projectId);
            const source = isProject ? 'project' : (payload.endpoint?.includes('others') ? 'assigned' : 'self');

            broadcastTaskCreated(createdTask || { _id: newTaskId, ...payload.fields }, {
                source,
                projectId: payload.fields?.projectId || currentDraft.projectId,
            });

            if (typeof window !== 'undefined') {
                const detail = {
                    task: createdTask || { _id: newTaskId, ...payload.fields },
                    source,
                    projectId: payload.fields?.projectId || currentDraft.projectId,
                };
                window.dispatchEvent(new CustomEvent('task:created', { detail }));
                window.dispatchEvent(new CustomEvent('ciis:task-created', { detail }));
                if (isProject) {
                    window.dispatchEvent(new CustomEvent('project:task-created', { detail }));
                }
            }

            pushMsg('assistant', 'Task create ho gaya ✅');
            if (autoSpeak) {
                cancelSpeech();
                speak('टास्क बन गया', 'Task create ho gaya');
            }
            // Mic stays off after task creation
            stop('created');
            resetFlow();
        } catch (err) {
            // Lock remains held through error handling; unlocked only in finally
            const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
            const msg = (serverMsg && typeof serverMsg === 'string' && serverMsg.trim())
                ? serverMsg.trim()
                : mapTaskAgentError(err);
            const errId = pushMsg('assistant', msg, { isError: true });
            if (autoSpeak && errId && !spokenMessageIdsRef.current.has(errId)) {
                spokenMessageIdsRef.current.add(errId);
                cancelSpeech();
                speak('टास्क नहीं बन पाया', cleanForSpeech(msg));
            }
            if (variant === 'voice' && !userMuted) {
                setTimeout(() => start(), 500);
            }
        } finally {
            setCreating(false);
            setUploadProgress(null);
            isCreatingRef.current = false;
        }
    }, [result, files, voiceNoteBlob, autoSpeak, speak, pushMsg, resetFlow, cancelReadyCountdown, stop, cancelSpeech, variant, start, userMuted]);

    confirmHandlerRef.current = handleConfirm;

    const handleCancel = useCallback(() => {
        cancelReadyCountdown();
        stop('button-click');
        resetFlow();
        const msgId = pushMsg('assistant', 'Theek hai, task cancel kar diya.');
        if (autoSpeak && msgId && !spokenMessageIdsRef.current.has(msgId)) {
            spokenMessageIdsRef.current.add(msgId);
            cancelSpeech();
            speak('टास्क कैंसिल कर दिया गया', 'Theek hai, task cancel kar diya');
        }
    }, [resetFlow, pushMsg, cancelReadyCountdown, autoSpeak, speak, stop, cancelSpeech]);

    const handleEdit = useCallback(() => {
        cancelReadyCountdown();
        stop('button-click');
        const replyMsg = 'Ji batayein kya changes karne hain? Main kar dungi.';
        const speechMsg = 'जी बताएं क्या बदलाव करने हैं? मैं कर दूंगी।';
        const msgId = pushMsg('assistant', replyMsg);
        if (autoSpeak && msgId && !spokenMessageIdsRef.current.has(msgId)) {
            spokenMessageIdsRef.current.add(msgId);
            cancelSpeech();
            speak(speechMsg, replyMsg);
        } else {
            inputRef.current?.focus();
        }
    }, [pushMsg, cancelReadyCountdown, autoSpeak, speak, cancelSpeech]);

    const handleChip = (chip) => {
        cancelAutoSend();
        cancelReadyCountdown();
        stop('chip-click');
        clearUserMute();
        inputSourceRef.current = 'chip';
        const turnSource = 'chip';
        if (chip.action?.type === 'confirm') {
            handleConfirm(resultRef.current?.payload || result?.payload);
            return;
        }
        if (chip.action?.type === 'edit') {
            handleEdit();
            return;
        }
        if (chip.action?.type === 'reset') {
            resetFlow();
            return;
        }
        if (chip.action?.type === 'pickProject' || chip.action?.pickProject) {
            const projectId = chip.action?.projectId || chip.action?.pickProject?.projectId || chip.value;
            sendTurn({
                action: chip.action,
                pick: { projectId },
                display: chip.label,
                source: turnSource,
            });
            return;
        }
        if (chip.action) {
            sendTurn({ action: chip.action, display: chip.label, source: turnSource });
        } else if (chip.type === 'due') {
            sendTurn({
                action: { type: 'set', field: 'dueDateTime', value: chip.value },
                display: chip.label,
                source: turnSource,
            });
        } else if (result?.field === 'attachments' && chip.label.toLowerCase().includes('attach')) {
            fileInputRef.current?.click();
        } else {
            sendTurn({ text: chip.value || chip.label, display: chip.label, source: turnSource });
        }
    };

    const handlePick = (c) => {
        cancelAutoSend();
        cancelReadyCountdown();
        stop('chip-click');
        clearUserMute();
        inputSourceRef.current = 'chip';
        const turnSource = 'chip';
        if (c?.action) {
            sendTurn({
                action: c.action,
                pick: c.action.type === 'pickProject' || c.action.pickProject
                    ? { projectId: c.action.projectId || c.action.pickProject?.projectId }
                    : undefined,
                display: c.label || c.name || c.projectName,
                source: turnSource,
            });
            return;
        }
        if (resultRef.current?.field === 'project' || result?.field === 'project') {
            const pid = candidateId(c);
            sendTurn({
                action: { type: 'pickProject', projectId: pid },
                pick: { projectId: pid },
                display: c.projectName || c.name || c.label,
                source: turnSource,
            });
            return;
        }
        sendTurn({
            action: { type: 'set', field: 'assignee', value: candidateId(c) },
            pick: { assigneeId: candidateId(c) },
            display: c.name || c.label,
            source: turnSource,
        });
    };

    const onSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        cancelAutoSend();
        cancelReadyCountdown();
        if (loading) return;

        // Typing wins over voice: stop recording immediately and discard audio
        if (listening || isTranscribing) {
            stop('typed-send');
        }

        clearUserMute();
        isTypingRef.current = false;
        if (inputRef.current) {
            inputRef.current.value = '';
        }

        const trimmed = (input || '').trim();
        if (!trimmed) return;

        micModeRef.current = 'typed';
        inputSourceRef.current = 'typed';

        const isReady = (resultRef.current?.status === 'ready' || result?.status === 'ready');
        if (isReady && isConfirmationIntent(trimmed)) {
            pushMsg('user', trimmed);
            setInput('');
            handleConfirm(resultRef.current?.payload || result?.payload);
            return;
        }

        sendTurn({ text: input, source: 'typed' });
    };

    // Greeting on open (visible in messages list)
    useEffect(() => {
        if (open && messages.length === 0) {
            const user = getUser();
            const greeting = getRoleAwareGreeting(user);
            const greetingId = pushMsg('assistant', greeting);

            // Short spoken version (<= 200 characters) for natural TTS:
            const shortGreetingHinglish = 'Namaste! Main CIIS AI Assistant hoon. Task create karne mein main aapki madad karunga. Kripya task details batayein.';
            const shortGreetingHindi = 'नमस्ते! मैं सी आई आई एस ए आई असिस्टेंट हूँ। टास्क बनाने में मैं आपकी मदद करूँगा। कृपया टास्क बताएं।';

            if (autoSpeak && ttsSupported && greetingId && !spokenMessageIdsRef.current.has(greetingId)) {
                spokenMessageIdsRef.current.add(greetingId);
                cancelSpeech();
                if (sttSupported && !userMutedRef.current) {
                    let micStarted = false;
                    const reopenMic = () => {
                        if (micStarted) return;
                        if (userMutedRef.current) return;
                        micStarted = true;
                        cancelSpeech();
                        micModeRef.current = 'voice';
                        setTimeout(() => {
                            start({ force: true })?.catch?.(() => {});
                        }, 200);
                    };
                    const watchdog = createTtsWatchdog(() => {
                        cancelSpeech();
                        reopenMic();
                    }, shortGreetingHinglish.length);
                    speak(shortGreetingHindi, shortGreetingHinglish, () => {
                        watchdog.cancel();
                        reopenMic();
                    });
                } else {
                    speak(shortGreetingHindi, shortGreetingHinglish);
                }
            } else if (sttSupported && !userMutedRef.current) {
                if (!listening) {
                    micModeRef.current = 'voice';
                    setTimeout(() => start({ force: true })?.catch?.(() => {}), 200);
                }
            }
        }
    }, [open, messages.length, pushMsg, variant, startWithMic, sttSupported, listening, start, autoSpeak, ttsSupported, userMuted, speak, cancelSpeech]);

    // When re-opening drawer that was previously closed: resume listening if in voice mode and not muted
    const prevOpenRef = useRef(open);
    useEffect(() => {
        const wasClosed = !prevOpenRef.current && open;
        prevOpenRef.current = open;
        if (wasClosed && messages.length > 0 && autoSpeak && sttSupported && !userMutedRef.current) {
            const t = setTimeout(() => {
                micModeRef.current = 'voice';
                start({ force: true })?.catch?.(() => {});
            }, 300);
            return () => clearTimeout(t);
        }
    }, [open, messages.length, autoSpeak, sttSupported, userMuted, start]);

    // Live display of interim text in browser engine mode or live speech
    useEffect(() => {
        if (listening && interim) {
            setLiveTranscriptText(interim);
            if (engine === 'browser') {
                setInput(interim);
            }
        }
    }, [listening, interim, engine]);

    // On drawer close: cancel speech, stop listening, release mic stream
    useEffect(() => {
        if (!open) {
            cancelSpeech();
            stop('drawer-closed');
            cancelAutoSend();
            cancelReadyCountdown();
            setIsPaused(false);
            setLiveTranscriptText('');
            setEnHindiHint(null);
        }
    }, [open, cancelSpeech, stop, cancelAutoSend, cancelReadyCountdown, setIsPaused]);

    // Lifecycle guards: Tab visibility change & page unload (stop mic and speech)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                cancelSpeech();
                stop('tab-hidden');
            }
        };

        const handleUnloadOrLogout = () => {
            cancelSpeech();
            stop('unload');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleUnloadOrLogout);
        window.addEventListener('ciis-auth-changed', handleUnloadOrLogout);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleUnloadOrLogout);
            window.removeEventListener('ciis-auth-changed', handleUnloadOrLogout);
            cancelSpeech();
            stop('unmount');
        };
    }, [cancelSpeech, stop]);

    // Auto scroll list to bottom
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, result, loading]);

    // Focus trap & Esc to close
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                cancelSpeech();
                stop('escape');
                onClose?.();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose, cancelSpeech, stop]);

    // Fall back to typed mode on permission denial: focus input
    useEffect(() => {
        if (speechError === 'not-allowed') {
            inputRef.current?.focus();
        }
    }, [speechError]);

    // Drag-and-drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAddFiles(Array.from(e.dataTransfer.files));
        }
    };

    const status = result?.status;
    const chips = Array.isArray(result?.chips) ? result.chips : [];
    const candidates = status === 'needs_disambiguation' ? result?.candidates || [] : [];
    const currentDraft = result?.draft || draftRef.current || {};

    const micErrorText =
        speechError === 'not-allowed'
            ? 'Mic permission nahi mili. Aap type karke task bana sakte hain.'
            : speechError === 'no-speech'
            ? 'Kuch sunai nahi diya, dobara try karein.'
            : speechError && speechError !== 'aborted'
            ? 'Mic mein problem aayi: ' + speechError
            : null;

    const isChromeOrEdge =
        typeof navigator !== 'undefined' &&
        /chrome|edg/i.test(navigator.userAgent) &&
        !/firefox|opr|brave/i.test(navigator.userAgent);

    const browserHint =
        engine === 'browser' && !isChromeOrEdge
            ? 'Browser voice input Chrome aur Edge mein best chalta hai. Whisper engine choose karein agar text miss ho raha ho.'
            : null;

    // Determine central mic orb state: strictly synchronized with listening and speaking
    let orbState = 'paused';
    if (isTranscribing || loading || creating) {
        orbState = 'thinking';
    } else if (isSpeaking) {
        orbState = 'speaking';
    } else if (listening) {
        orbState = 'listening';
    } else {
        orbState = 'paused';
    }

    const handleOrbClick = () => {
        cancelReadyCountdown();
        setSpeechError?.(null);
        setNotice(null);
        if (listening) {
            stop('manual');
            setIsPaused(true);
        } else if (isSpeaking) {
            cancelSpeech();
            clearUserMute();
            start({ force: true });
        } else {
            setIsPaused(false);
            setNotice(null);
            clearUserMute();
            start({ force: true });
        }
    };

    // Cycle language: hi-IN -> en-IN -> auto -> hi-IN
    const cycleLanguage = () => {
        setSpeechError?.(null);
        setNotice(null);
        setLang((curr) => {
            if (curr === 'hi-IN' || curr === 'hi') return 'en-IN';
            if (curr === 'en-IN' || curr === 'en') return 'auto';
            return 'hi-IN';
        });
    };

    const formatDueChip = (iso) => {
        if (!iso) return null;
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch {
            return String(iso);
        }
    };

    return {
        // States
        messages,
        setMessages,
        input,
        setInput,
        loading,
        creating,
        uploadProgress,
        result,
        autoSpeak,
        setAutoSpeak,
        autoSendVoice,
        setAutoSendVoice,
        autoSendCountdown,
        readyCountdown,
        files,
        setFiles,
        voiceNoteBlob,
        setVoiceNoteBlob,
        isDragOver,
        fileError,
        setFileError,
        highlightPaperclip,
        liveTranscriptText,
        setLiveTranscriptText,
        enHindiHint,
        setEnHindiHint,
        // Refs
        draftRef,
        resultRef,
        listRef,
        inputRef,
        fileInputRef,
        sendRef,
        confirmHandlerRef,
        isCreatingRef,
        // Speech hook values
        engine,
        setEngine,
        lang,
        setLang,
        sttSupported,
        ttsSupported,
        listening,
        isTranscribing,
        isSpeaking,
        isPaused,
        setIsPaused,
        userMuted,
        setUserMuted,
        clearUserMute,
        isTypingRef,
        interim,
        audioLevel,
        durationSeconds,
        speechError,
        setSpeechError,
        speechNotice,
        setNotice,
        start,
        stop,
        speak,
        cancelSpeech,
        recordingVoiceNote,
        sttUploadCount,
        resetSttUploadCount,
        vadStats,
        // Handlers
        sendTurn,
        handleFinalTranscript,
        handleAddFiles,
        handleRemoveFile,
        toggleVoiceNote,
        handleConfirm,
        handleCancel,
        handleEdit,
        handleChip,
        handlePick,
        onSubmit,
        handleOrbClick,
        cycleLanguage,
        resetFlow,
        cancelAutoSend,
        cancelReadyCountdown,
        pushMsg,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        // Derived values
        status,
        chips,
        candidates,
        currentDraft,
        micErrorText,
        browserHint,
        orbState,
        formatDueChip,
    };
}
