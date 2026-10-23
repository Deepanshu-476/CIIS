import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance, { clearAllCaches } from '../../utils/axiosConfig';
import useSpeech from '../../hooks/useSpeech';
import { markTaskIdAsCreated, broadcastTaskCreated, invalidateTaskManagementCache } from '../../hooks/useTaskRealtime';
import TaskPreviewCard from './TaskPreviewCard';
import AuraFluidRing from './AuraFluidRing';
import './AIAssistant.css';

const PARSE_URL = '/ai/task-agent/parse';
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mp3', 'wav', 'avi', 'mkv', 'webm']);

const candidateId = (c) => c.id || c._id || c.userId || c.assigneeId;

const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
    } catch {
        return {};
    }
};

const errorMessage = (err) => {
    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
    if (serverMsg) return serverMsg;
    if (status === 429) return 'AI abhi busy hai, 1 minute baad try karein.';
    if (status === 503) return 'AI service abhi available nahi hai. Admin se contact karein.';
    if (status === 502) return 'Samajh nahi paaya, kripya dobara bolein.';
    if (status === 401) return 'Session expire ho gaya, dobara login karein.';
    return 'Kuch gadbad ho gayi. Dobara try karein.';
};

const isRefusalOrEditIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /(?:^|\P{L})(?:nahi|no|abhi\s*nahi|ruko|wait|cancel|rehne\s*do|chhod|rok\s*do|nahi\s*chahiye|change|changes|badal|badalna|edit|गलत|नहीं|मत|रुको|मत\s*करो|बदलो)(?:\P{L}|$)/iu.test(text);
};

const hasFieldChangeIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    return (
        /\b\d{1,2}[:.]\d{1,2}\b/i.test(text) ||
        /\b([1-9]|1[0-2])\s+[0-5]\d\b/i.test(text) ||
        /(?:title|naam|नाम|description|विवरण|डिस्क्रिप्शन|priority|प्रायोरिटी|status|स्टेटस|due|kal|कल|aaj|आज|tomorrow|today|baje|बजे|baaj|baj|bach|बज|time|samay|समय|date|tareekh|tarikh|तारीख|minute|min|मिनट|घंटा|hour|p\.?m\.?|a\.?m\.?|pm|am|subah|shaam|sham|dopahar|raat|reminder|रिमाइंडर|checkpoints|चेकपॉइंट|assign|photo|file|low|high|medium|pending|in-progress|completed|chay|pchas|saadhe|sadhe|saade|sade|साढ़े|tees|तीस|pandrah|पंद्रह|pachaas|पचास)/iu.test(text)
    );
};

const isConfirmationIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    if (isRefusalOrEditIntent(text)) return false;

    return (
        // English & Hinglish create variations (including Whisper mishearings: "crete", "buna")
        /(?:^|\P{L})(?:create\s*it|create\s*this|create\s*now|create\s*task|create\s*kardo|create\s*kar\s*do|create\s*karo|create\s*kar|crete\s*it|crete\s*kardo|create|submit|confirm)(?:\P{L}|$)/iu.test(text) ||
        // Hindi/Hinglish bana do / buna do variations
        /(?:^|\P{L})(?:bana\s*do|banao|bana\s*dijiye|bana\s*dena|buna\s*do|bana\s*dein|bana\s*karo)(?:\P{L}|$)/iu.test(text) ||
        // Kar do variations (e.g., "kar do complete", "complete kar do", "kar do create", "kar do")
        /(?:^|\P{L})(?:kar\s*do|kardo|kar\s*dijiye|karo|kar\s*dein|complete\s*kar\s*do|kar\s*do\s*complete)(?:\P{L}|$)/iu.test(text) ||
        // Direct affirmations
        /(?:^|\P{L})(?:haan|ha|haanji|hnji|yes|yep|yeah|sure|ok|okay|done|theek\s*hai|thik\s*hai|sahi\s*hai|bilkul)(?:\P{L}|$)/iu.test(text) ||
        // Devanagari explicit affirmation & creation patterns (matches anywhere without ASCII-only \b bug)
        /(?:हाँ|हां|अहां|अहा|बना\s*दो|बनाओ|बना\s*दीजिए|बना\s*दें|कर\s*दो|कर\s*दीजिए|कर\s*दें|क्रिएट|क्रिएट\s*करो|क्रिएट\s*कर\s*दो|सबमिट|ठीक\s*है|सही\s*है|हांजी|हाँजी)/iu.test(text)
    );
};

const AIChatDrawer = React.forwardRef(function AIChatDrawer(
    {
        open,
        onClose,
        startWithMic = false,
        variant = 'side', // 'side' | 'voice'
    },
    ref
) {
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
        setMessages((m) => [...m, { id: idRef.current, role, text, ...extra }]);
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
        speak,
        cancelSpeech,
        recordingVoiceNote,
        startVoiceNoteRecording,
        stopVoiceNoteRecording,
    } = useSpeech({
        defaultEngine: 'whisper',
        defaultLang: 'hi-IN', // Defaults to Hindi/Hinglish in voice mode
        enableChunking: false,
        onFinalTranscript: (text) => handleFinalTranscriptRef.current?.(text),
        onInactivityPrompt: () => {
            if (autoSpeak) {
                speak('मैं सुन रहा हूँ, बोलिये', 'Main sun raha hoon, boliye');
            }
        },
        onInactivityPause: () => {
            // Orb transitions to PAUSED state after 2 consecutive timeouts
        },
    });

    // Auto-dismiss mic error notices after 5 seconds
    useEffect(() => {
        if (speechError) {
            const t = setTimeout(() => setSpeechError?.(null), 5000);
            return () => clearTimeout(t);
        }
    }, [speechError, setSpeechError]);

    useImperativeHandle(
        ref,
        () => ({
            startVoiceMode: () => {
                setIsPaused(false);
                setNotice(null);
                setLiveTranscriptText('');
                setEnHindiHint(null);
                start();
            },
            stopVoiceMode: () => {
                stop('manual');
            },
        }),
        [start, stop, setIsPaused, setNotice]
    );

    const resetFlow = useCallback(() => {
        draftRef.current = null;
        resultRef.current = null;
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
        async ({ text = '', action, pick, draftPatch, display }) => {
            cancelAutoSend();
            cancelReadyCountdown();

            const shown = display !== undefined ? display : text;
            if (!text.trim() && !action && !pick) return;
            if (shown) {
                pushMsg('user', shown);
                setLiveTranscriptText(shown);
            }

            setInput('');
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
                    pushMsg('assistant', replyMsg);
                    if (autoSpeak) {
                        speak(speechMsg, replyMsg, () => {
                            if (variant === 'voice') setTimeout(() => start(), 300);
                        });
                    } else if (variant === 'voice') {
                        setTimeout(() => start(), 300);
                    }
                    return;
                } else if (isConfirmationIntent(text)) {
                    setLoading(false);
                    confirmHandlerRef.current?.(resultRef.current?.payload || result?.payload);
                    return;
                }
            }

            const baseDraft = draftRef.current;
            const draft = draftPatch ? { ...(baseDraft || {}), ...draftPatch } : baseDraft;

            try {
                const { data } = await axiosInstance.post(PARSE_URL, {
                    message: text || undefined,
                    action: action || undefined,
                    pick: pick || undefined,
                    language: 'hinglish',
                    draft: draft || undefined,
                });

                draftRef.current = data.draft || draft || null;
                resultRef.current = data;
                setResult(data);

                if (data.reply) {
                    pushMsg('assistant', data.reply);
                }

                // Voice loop progression
                if (variant === 'voice') {
                    if (data.field === 'attachments') {
                        setHighlightPaperclip(true);
                    } else {
                        setHighlightPaperclip(false);
                    }

                    const spokenSpeech = data.speech || data.reply;
                    const spokenHinglish = data.reply;

                    if (data.status === 'ready') {
                        cancelReadyCountdown();

                        // Speak summary & confirmation question ("Kya ise create kar doon?")
                        // Then AUTOMATICALLY turn on microphone after TTS finishes so user can confirm or request changes!
                        if (autoSpeak) {
                            speak(spokenSpeech, spokenHinglish, () => {
                                setTimeout(() => {
                                    start();
                                }, 300);
                            });
                        } else {
                            setTimeout(() => {
                                start();
                            }, 300);
                        }
                    } else if (data.status === 'cancelled') {
                        if (autoSpeak) speak('टास्क कैंसिल कर दिया गया है', 'Task cancel kar diya gaya hai');
                        stop('cancelled');
                    } else {
                        // Next question: speak and resume listening automatically after TTS finishes
                        if (autoSpeak) {
                            speak(spokenSpeech, spokenHinglish, () => {
                                setTimeout(() => {
                                    start();
                                }, 300);
                            });
                        } else {
                            setTimeout(() => {
                                start();
                            }, 300);
                        }
                    }
                } else if (data.reply && autoSpeak) {
                    speak(data.speech, data.reply);
                }
            } catch (err) {
                const msg = errorMessage(err);
                pushMsg('assistant', msg, { isError: true });
                if (autoSpeak) speak('कुछ गड़बड़ हो गई', msg);
                if (variant === 'voice') {
                    setTimeout(() => start(), 500);
                }
            } finally {
                setLoading(false);
            }
        },
        [variant, autoSpeak, speak, cancelSpeech, pushMsg, cancelAutoSend, cancelReadyCountdown, listening, start, stop]
    );

    sendRef.current = sendTurn;

    // Handle incoming transcript (full or segment-cut)
    const handleFinalTranscript = useCallback(
        (text) => {
            const clean = String(text || '').trim();
            if (!clean) return;

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

            if (variant === 'voice') {
                const lower = clean.toLowerCase();

                // If currently in ready state:
                const isReady = readyCountdown !== null || resultRef.current?.status === 'ready' || result?.status === 'ready';
                if (isReady) {
                    if (hasFieldChangeIntent(clean)) {
                        cancelReadyCountdown();
                        sendRef.current?.({ text: clean });
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
                sendRef.current?.({ text: clean });
                return;
            }

            // In Side mode: manual input or countdown
            setInput(clean);
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
        [variant, lang, readyCountdown, cancelReadyCountdown, autoSpeak, speak, start, stop, cancelSpeech, onClose, result?.field, autoSendVoice, cancelAutoSend, pushMsg, setIsPaused]
    );

    handleFinalTranscriptRef.current = handleFinalTranscript;

    // File addition handler
    const handleAddFiles = useCallback(
        (newFilesList) => {
            setFileError(null);
            const valid = [];
            for (const file of newFilesList) {
                const ext = (file.name.split('.').pop() || '').toLowerCase();
                if (!ALLOWED_EXTS.has(ext)) {
                    setFileError(`File type .${ext} allowed nahi hai.`);
                    continue;
                }
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    setFileError(`File "${file.name}" 20MB se badi hai.`);
                    continue;
                }
                valid.push(file);
            }

            setFiles((prev) => {
                const combined = [...prev, ...valid];
                if (combined.length > MAX_FILES) {
                    setFileError(`Sirf maximum ${MAX_FILES} files attach kar sakte hain.`);
                    const limited = combined.slice(0, MAX_FILES);
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

            if (variant === 'voice') {
                setTimeout(() => start(), 400);
            }
        },
        [variant, start]
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
                if (variant === 'voice') {
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

    // Confirm & create task: stop mic and release streams automatically
    const handleConfirm = useCallback(async (overridePayload) => {
        cancelReadyCountdown();
        stop('task-confirmed');
        cancelSpeech();

        const payload = overridePayload || resultRef.current?.payload || result?.payload;
        if (!payload) {
            console.warn('[AIChatDrawer] handleConfirm: No task payload available to create', {
                resultRef: resultRef.current,
                result,
            });
            return;
        }
        setCreating(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();

            if (payload.fields) {
                Object.entries(payload.fields).forEach(([k, v]) => {
                    if (v !== undefined && v !== null) {
                        formData.append(k, typeof v === 'string' ? v : JSON.stringify(v));
                    }
                });
            }

            const fileField = payload.fileField || 'files';
            files.forEach((file) => {
                formData.append(fileField, file);
            });

            if (voiceNoteBlob) {
                formData.append('voiceNote', voiceNoteBlob, `voice_note_${Date.now()}.webm`);
            }

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

            const createdTask = response?.data?.task || response?.data?.newTask || response?.data?.data || null;
            const newTaskId = createdTask?._id || createdTask?.id || response?.data?._id || response?.data?.id;
            if (newTaskId) {
                markTaskIdAsCreated(newTaskId);
            }

            clearAllCaches();
            invalidateTaskManagementCache();

            broadcastTaskCreated(createdTask || { _id: newTaskId, ...payload.fields }, {
                source: payload.endpoint?.includes('others') ? 'assigned' : 'self',
            });

            if (typeof window !== 'undefined') {
                const detail = {
                    task: createdTask || { _id: newTaskId, ...payload.fields },
                    source: payload.endpoint?.includes('others') ? 'assigned' : 'self',
                };
                window.dispatchEvent(new CustomEvent('task:created', { detail }));
                window.dispatchEvent(new CustomEvent('ciis:task-created', { detail }));
            }

            pushMsg('assistant', 'Task create ho gaya ✅');
            if (autoSpeak) {
                speak('टास्क बन गया', 'Task create ho gaya');
            }
            // Mic stays off after task creation
            stop('created');
            resetFlow();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || 'Task create nahi ho paaya. Dobara try karein.';
            pushMsg('assistant', msg, { isError: true });
            if (autoSpeak) {
                speak('टास्क नहीं बन पाया', msg);
            }
            if (variant === 'voice') {
                setTimeout(() => start(), 500);
            }
        } finally {
            setCreating(false);
            setUploadProgress(null);
        }
    }, [result, files, voiceNoteBlob, autoSpeak, speak, pushMsg, resetFlow, cancelReadyCountdown, stop, cancelSpeech, variant, start]);

    confirmHandlerRef.current = handleConfirm;

    const handleCancel = useCallback(() => {
        cancelReadyCountdown();
        resetFlow();
        pushMsg('assistant', 'Theek hai, task cancel kar diya.');
        if (autoSpeak) speak('टास्क कैंसिल कर दिया गया', 'Task cancel kar diya');
    }, [resetFlow, pushMsg, cancelReadyCountdown, autoSpeak, speak]);

    const handleEdit = useCallback(() => {
        cancelReadyCountdown();
        const replyMsg = 'Ji batayein kya changes karne hain? Main kar dungi.';
        const speechMsg = 'जी बताएं क्या बदलाव करने हैं? मैं कर दूंगी।';
        pushMsg('assistant', replyMsg);
        if (autoSpeak) {
            speak(speechMsg, replyMsg, () => {
                if (variant === 'voice') {
                    setTimeout(() => start(), 300);
                }
            });
        } else if (variant === 'voice') {
            setTimeout(() => start(), 300);
        } else {
            inputRef.current?.focus();
        }
    }, [pushMsg, cancelReadyCountdown, autoSpeak, speak, variant, start]);

    const handleChip = (chip) => {
        cancelAutoSend();
        cancelReadyCountdown();
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
        if (chip.action) {
            sendTurn({ action: chip.action, display: chip.label });
        } else if (chip.type === 'due') {
            sendTurn({
                action: { type: 'set', field: 'dueDateTime', value: chip.value },
                display: chip.label,
            });
        } else if (result?.field === 'attachments' && chip.label.toLowerCase().includes('attach')) {
            fileInputRef.current?.click();
        } else {
            sendTurn({ text: chip.value || chip.label, display: chip.label });
        }
    };

    const handlePick = (c) => {
        cancelAutoSend();
        cancelReadyCountdown();
        sendTurn({
            action: { type: 'set', field: 'assignee', value: candidateId(c) },
            pick: { assigneeId: candidateId(c) },
            display: c.name || c.label,
        });
    };

    const onSubmit = (e) => {
        e.preventDefault();
        cancelAutoSend();
        cancelReadyCountdown();
        if (loading || listening || isTranscribing) return;
        const trimmed = (input || '').trim();
        if (!trimmed) return;

        const isReady = (resultRef.current?.status === 'ready' || result?.status === 'ready');
        if (isReady && /\b(?:haan|ha|yes|kar\s*do|kardo|create|bana\s*do|submit|ok|okay|theek\s*hai|हाँ|हां)\b/i.test(trimmed)) {
            pushMsg('user', trimmed);
            setInput('');
            handleConfirm(resultRef.current?.payload || result?.payload);
            return;
        }

        sendTurn({ text: input });
    };

    // Greeting on open (visible in messages list, but never spoken with TTS in voice mode)
    useEffect(() => {
        if (open && messages.length === 0) {
            const user = getUser();
            const role = String(user.companyRole || user.role || user.userRole || '').toLowerCase();
            const isPrivileged = ['owner', 'admin', 'super_admin', 'super-admin'].includes(role);

            const greeting = isPrivileged
                ? `Task create karne ke liye mujhe ye jaankari chahiye:
1. Kiske liye (assignee - khud ke liye ya kisi aur ke liye)
2. Task ka naam (zaroori)
3. Description
4. Due date aur time (zaroori)
5. Priority (Low / Medium / High)
6. Status (Pending / In Progress / Completed / On Hold)
7. Reminder
8. Priority Days
9. Repeat Task
10. Checkpoints
11. Attachments (photo / file / voice note)

Aap sab ek saath bol sakte hain ya main ek ek karke poochunga. Jo nahi dena, 'koi nahi' bol dein, wo blank rahega.`
                : `Task create karne ke liye mujhe ye jaankari chahiye:
1. Task ka naam (zaroori)
2. Description
3. Due date aur time (zaroori)
4. Priority (Low / Medium / High)
5. Status (Pending / In Progress / Completed / On Hold)
6. Reminder
7. Priority Days
8. Repeat Task
9. Checkpoints
10. Attachments (photo / file / voice note)

Aap sab ek saath bol sakte hain ya main ek ek karke poochunga. Jo nahi dena, 'koi nahi' bol dein, wo blank rahega.`;

            pushMsg('assistant', greeting);

            if ((variant === 'voice' || startWithMic) && sttSupported) {
                if (!listening) {
                    start();
                }
            }
        }
    }, [open, messages.length, pushMsg, variant, startWithMic, sttSupported, listening, start]);

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
    const chips = status === 'needs_input' ? result?.chips || [] : [];
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
            stop('orb-toggle');
            setIsPaused(true);
        } else if (isSpeaking) {
            cancelSpeech();
            start();
        } else {
            setIsPaused(false);
            setNotice(null);
            start();
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

    const renderChatStream = () => (
        <>
            {/* 3-Second Visible Countdown Indicator on Ready State */}
            {readyCountdown !== null ? (
                <div className="ai-countdown-indicator">
                    <span>⏱️ Task create ho raha hai… ({readyCountdown}s) (cancel bolo ya tap karein)</span>
                    <button type="button" onClick={cancelReadyCountdown}>
                        Cancel
                    </button>
                </div>
            ) : null}

            <div className="ai-messages" ref={listRef}>
                {messages.map((m) => (
                    <div key={m.id} className={`ai-row ${m.role}`}>
                        <div className={`ai-bubble ${m.role}${m.isError ? ' error' : ''}`}>{m.text}</div>
                    </div>
                ))}

                {loading ? (
                    <div className="ai-row assistant">
                        <div className="ai-bubble assistant">Soch raha hoon…</div>
                    </div>
                ) : null}

                {Array.isArray(result?.notices)
                    ? result.notices.map((n, i) => (
                          <div key={i} className="ai-notice">
                              ℹ️ {typeof n === 'string' ? n : n?.message}
                          </div>
                      ))
                    : null}

                {candidates.map((c) => (
                    <button
                        key={candidateId(c)}
                        type="button"
                        className="ai-cand"
                        disabled={loading}
                        onClick={() => handlePick(c)}
                    >
                        <strong>{c.name || c.label}</strong>
                        <span>
                            {[c.employeeId, c.jobRole || c.role, c.department].filter(Boolean).join(' • ')}
                        </span>
                    </button>
                ))}

                {status === 'ready' && result?.preview ? (
                    <TaskPreviewCard
                        preview={result.preview}
                        files={files}
                        busy={creating}
                        uploadProgress={uploadProgress}
                        onConfirm={handleConfirm}
                        onEdit={handleEdit}
                        onCancel={handleCancel}
                    />
                ) : null}
            </div>

            {/* Attachment preview strip */}
            {files.length > 0 || voiceNoteBlob ? (
                <div className="ai-attachment-tray">
                    <span className="ai-tray-label">Attached ({files.length}):</span>
                    <div className="ai-tray-chips">
                        {files.map((file, idx) => (
                            <div key={idx} className="ai-tray-item">
                                <span className="ai-tray-name" title={file.name}>
                                    {file.type?.startsWith('image/') ? '🖼️' : '📄'} {file.name}
                                </span>
                                <button
                                    type="button"
                                    className="ai-tray-remove"
                                    onClick={() => handleRemoveFile(idx)}
                                    title="Hatao"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {voiceNoteBlob ? (
                            <div className="ai-tray-item voice">
                                <span className="ai-tray-name">🎙️ Voice Note</span>
                                <button
                                    type="button"
                                    className="ai-tray-remove"
                                    onClick={() => setVoiceNoteBlob(null)}
                                    title="Hatao"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {fileError ? <p className="ai-form-note err">{fileError}</p> : null}

            {/* Dedicated attachment action buttons ONLY on attachments step */}
            {result?.field === 'attachments' ? (
                <div className="ai-attachments-step-bar">
                    <button
                        type="button"
                        className={`ai-attach-step-btn ${highlightPaperclip ? 'highlighted' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        title="File ya photo attach karein"
                    >
                        📎 File attach karein
                    </button>
                    <button
                        type="button"
                        className={`ai-attach-step-btn ${recordingVoiceNote ? 'recording' : ''}`}
                        onClick={toggleVoiceNote}
                        title="Task ke saath awaaz ki recording attach karein"
                    >
                        {recordingVoiceNote ? '⏹️ Recording roko' : '🎤 Voice note'}
                    </button>
                </div>
            ) : null}

            {chips.length > 0 ? (
                <div className="ai-chips">
                    {chips.map((c) => (
                        <button
                            key={`${c.label}-${c.value || ''}`}
                            type="button"
                            className="ai-pill"
                            disabled={loading}
                            onClick={() => handleChip(c)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {/* Live Speech state & visual indicator in side mode */}
            {variant !== 'voice' ? (
                listening ? (
                    <div className="ai-listening-bar">
                        <span className="ai-pulse-dot" />
                        <span className="ai-listening-text">
                            Sun raha hoon… {Math.floor(durationSeconds / 60)}:
                            {String(durationSeconds % 60).padStart(2, '0')}
                        </span>
                        <div className="ai-level-track">
                            <div className="ai-level-fill" style={{ width: `${audioLevel}%` }} />
                        </div>
                        <button type="button" className="ai-stop-listen-btn" onClick={() => stop('manual')}>
                            Roko
                        </button>
                    </div>
                ) : isTranscribing ? (
                    <div className="ai-listening-bar transcribing">
                        <span className="ai-spin-dot" />
                        <span className="ai-listening-text">Samajh raha hoon…</span>
                    </div>
                ) : autoSendCountdown !== null ? (
                    <div className="ai-countdown-bar">
                        <span>Bhej raha hoon… ({autoSendCountdown.toFixed(1)}s)</span>
                        <button type="button" className="ai-cancel-countdown-btn" onClick={cancelAutoSend}>
                            Cancel
                        </button>
                    </div>
                ) : null
            ) : null}

            <form className="ai-form" onSubmit={onSubmit}>
                {micErrorText ? <p className="ai-form-note err">{micErrorText}</p> : null}
                {speechNotice && variant !== 'voice' ? <p className="ai-form-note notice">{speechNotice}</p> : null}
                {browserHint && variant !== 'voice' ? <p className="ai-form-note hint">{browserHint}</p> : null}

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.mp4,.mp3,.wav,.avi,.mkv,.webm,image/*,application/pdf,video/*,audio/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleAddFiles(Array.from(e.target.files));
                            e.target.value = '';
                        }
                    }}
                />

                {/* Input Row: Paperclip button + Mic + Text input + Send button */}
                <div className="ai-input-row">
                    <button
                        type="button"
                        className={`ai-clip-btn ${highlightPaperclip ? 'highlighted' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        title="File ya photo attach karein"
                    >
                        📎
                    </button>

                    {sttSupported ? (
                        <button
                            type="button"
                            className={`ai-mic ${listening ? 'on' : ''}`}
                            onClick={handleOrbClick}
                            aria-label={listening ? 'Stop listening' : 'Start listening'}
                            title={listening ? 'Awaaz roko' : 'Awaaz se bolein'}
                            disabled={isTranscribing || loading || creating}
                        >
                            🎤
                        </button>
                    ) : null}

                    <input
                        ref={inputRef}
                        className="ai-text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            cancelAutoSend();
                            cancelReadyCountdown();
                        }}
                        onFocus={() => {
                            cancelAutoSend();
                            cancelReadyCountdown();
                        }}
                        placeholder={
                            isTranscribing
                                ? 'Samajh raha hoon…'
                                : listening
                                ? 'Sun raha hoon…'
                                : 'Task likhein ya bolein…'
                        }
                        maxLength={600}
                    />

                    <button
                        type="submit"
                        className="ai-send"
                        disabled={loading || listening || isTranscribing || !input.trim()}
                    >
                        Send
                    </button>
                </div>
            </form>
        </>
    );

    const node = (
        <div className="ai-scope">
            <div className={`ai-overlay ${variant === 'voice' ? 'variant-voice' : ''} ${open ? 'open' : ''}`}>
                <div className="ai-backdrop" onClick={onClose} />
                <aside
                    className={`ai-panel ${isDragOver ? 'drag-over' : ''}`}
                    role="dialog"
                    aria-label="Astra AI Voice Assistant"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <header className="ai-head">
                        <div>
                            <h2>⚡ Astra — {variant === 'voice' ? 'Voice Task Agent' : 'Task Assistant'}</h2>
                            {variant !== 'voice' ? <p>Bolo ya likho, task ban jayega</p> : null}
                        </div>
                        <div className="ai-head-actions">
                            {/* Voice Engine toggle: Accurate (Whisper) vs Live (Browser) */}
                            <button
                                type="button"
                                className="ai-icon-btn"
                                onClick={() => {
                                    setSpeechError?.(null);
                                    setNotice(null);
                                    setEngine((e) => (e === 'whisper' ? 'browser' : 'whisper'));
                                }}
                                title={`Voice engine: ${engine === 'whisper' ? 'Accurate (Whisper)' : 'Live (Browser)'}`}
                            >
                                {engine === 'whisper' ? '🎙️ Accurate (Whisper)' : '⚡ Live (Browser)'}
                            </button>

                            {/* Language toggle: hi-IN vs en-IN vs Auto */}
                            <button
                                type="button"
                                className="ai-icon-btn"
                                onClick={cycleLanguage}
                                title={`Voice language: ${lang === 'hi-IN' ? 'Hindi/Hinglish (hi-IN)' : lang === 'en-IN' ? 'English (en-IN)' : 'Auto-detect'}`}
                            >
                                {lang === 'hi-IN' ? 'हिं' : lang === 'en-IN' ? 'EN' : 'Auto'}
                            </button>

                            {/* Auto-send toggle on silence */}
                            {variant === 'voice' ? (
                                <button
                                    type="button"
                                    className={`ai-icon-btn ${autoSendVoice ? 'active' : ''}`}
                                    onClick={() => {
                                        setAutoSendVoice((v) => !v);
                                        cancelAutoSend();
                                    }}
                                    title="Auto-send after speaking (1.5s countdown)"
                                >
                                    {autoSendVoice ? '⚡ Auto' : '✋ Manual'}
                                </button>
                            ) : null}

                            {/* TTS voice reply toggle */}
                            {ttsSupported ? (
                                <button
                                    type="button"
                                    className="ai-icon-btn"
                                    onClick={() => {
                                        setAutoSpeak((v) => !v);
                                        cancelSpeech();
                                    }}
                                    title="Reply bolkar sunao"
                                >
                                    {autoSpeak ? '🔊' : '🔇'}
                                </button>
                            ) : null}

                            <button type="button" className="ai-icon-btn" onClick={onClose} aria-label="Close">
                                ✕
                            </button>
                        </div>
                    </header>

                    {enHindiHint ? (
                        <div className="ai-tts-hint" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                            💡 {enHindiHint}
                        </div>
                    ) : null}

                    {result?.progress ? (
                        <div className="ai-step-progress">
                            <div
                                className="ai-step-fill"
                                style={{
                                    width: `${Math.round((result.progress.done / Math.max(1, result.progress.total)) * 100)}%`,
                                }}
                            />
                        </div>
                    ) : null}

                    {/* Voice Mode Split Workspace: Left Pane (Celestial Sphere Stage) + Right Pane (Full Height Chat Stream) */}
                    {variant === 'voice' ? (
                        <div className="ai-voice-workspace">
                            {/* Left Pane: Celestial Glass Sphere Stage matching Image 1 */}
                            <div className="ai-voice-orb-pane">
                                <AuraFluidRing orbState={orbState} onClick={handleOrbClick} />

                                {/* Status Pill Badge */}
                                <div className={`ai-liquid-status-badge ${orbState}`}>
                                    <span className={`ai-status-indicator-dot ${orbState}`} />
                                    <span className="ai-status-indicator-text">
                                        {orbState === 'speaking'
                                            ? 'ASTRA SPEAKING...'
                                            : orbState === 'listening'
                                            ? 'LISTENING (SPEAK NOW)'
                                            : orbState === 'thinking'
                                            ? 'PROCESSING...'
                                            : 'PAUSED (TAP TO TALK)'}
                                    </span>
                                </div>

                                {/* Live Transcript Line */}
                                {(interim || liveTranscriptText) ? (
                                    <div className="ai-live-transcript-line">
                                        {interim ? (
                                            <>
                                                "{interim}"
                                                <div className="ai-transcript-dots">
                                                    <span />
                                                    <span />
                                                    <span />
                                                </div>
                                            </>
                                        ) : (
                                            `"${liveTranscriptText}"`
                                        )}
                                    </div>
                                ) : null}

                                {/* "Kya samjha" Captured Fields Compact Chips */}
                                <div className="ai-kya-samjha-row">
                                    {currentDraft.title ? (
                                        <span className="ai-captured-chip" title={currentDraft.title}>
                                            📝 <strong>Title:</strong> {currentDraft.title}
                                        </span>
                                    ) : null}
                                    {currentDraft.dueDateTime ? (
                                        <span className="ai-captured-chip">
                                            ⏰ <strong>Due:</strong> {formatDueChip(currentDraft.dueDateTime)}
                                        </span>
                                    ) : null}
                                    {currentDraft.priority ? (
                                        <span className="ai-captured-chip">
                                            ⚡ <strong>Priority:</strong> {currentDraft.priority}
                                        </span>
                                    ) : null}
                                    {currentDraft.status ? (
                                        <span className="ai-captured-chip">
                                            📊 <strong>Status:</strong> {currentDraft.status}
                                        </span>
                                    ) : null}
                                    {currentDraft.description ? (
                                        <span className="ai-captured-chip" title={currentDraft.description}>
                                            📄 <strong>Desc:</strong> {currentDraft.description}
                                        </span>
                                    ) : null}
                                    {currentDraft.assigneeName ? (
                                        <span className="ai-captured-chip">
                                            👤 <strong>Assignee:</strong> {currentDraft.assigneeName}
                                        </span>
                                    ) : null}
                                    {currentDraft.reminder !== null && currentDraft.reminder !== undefined ? (
                                        <span className="ai-captured-chip">
                                            🔔 <strong>Reminder:</strong> {currentDraft.reminder ? 'On' : 'Off'}
                                        </span>
                                    ) : null}
                                    {Array.isArray(currentDraft.checkpoints) && currentDraft.checkpoints.length > 0 ? (
                                        <span className="ai-captured-chip">
                                            ☑️ <strong>Checkpoints:</strong> {currentDraft.checkpoints.length}
                                        </span>
                                    ) : null}
                                    {files.length > 0 ? (
                                        <span className="ai-captured-chip">
                                            📎 <strong>Files:</strong> {files.length}
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {/* Right Pane: Full-Height Chat Stream (100% visible, no scrolling needed) */}
                            <div className="ai-voice-chat-pane">
                                {renderChatStream()}
                            </div>
                        </div>
                    ) : (
                        renderChatStream()
                    )}
                </aside>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(node, document.body) : null;
});

AIChatDrawer.displayName = 'AIChatDrawer';

export default AIChatDrawer;