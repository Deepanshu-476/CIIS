import { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance, { clearAllCaches } from '../utils/axiosConfig';
import useSpeech from './useSpeech';
import { markTaskIdAsCreated, broadcastTaskCreated, broadcastTaskUpdated, invalidateTaskManagementCache } from './useTaskRealtime';
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
    getRoleAwareGreetingHindi,
    filterWelcomeButtonsByPermissions,
    detectMessageLanguage,
    isChitChatOrGreeting,
    isOutOfScopeQuery,
    WELCOME_MENU_BUTTONS,
    WELCOME_GREETING_TEXT,
    WELCOME_GREETING_HINDI,
    cleanForSpeech,
    resolveSpokenText,
    determineTurnSpeechAndMicAction,
    formatSpokenForTTS,
    buildParseRequestBody,
    MAX_FILES,
    MAX_FILE_SIZE_BYTES,
    ALLOWED_EXTS,
} from './taskAgentPureLogic';

const axios = axiosInstance;

const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
    } catch {
        return {};
    }
};

const getSidebarConfig = () => {
    try {
        return JSON.parse(localStorage.getItem('sidebarConfig') || '{}');
    } catch {
        return {};
    }
};

const getStoredPagePermissions = () => {
    try {
        const perms = [];
        const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
        const userData = user?.user || user;
        const currentUserId = String(userData?._id || userData?.id || '');

        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith('ciis-page-permission-catalog:')) {
                const item = JSON.parse(sessionStorage.getItem(k) || '{}');
                const val = item?.value;
                if (val) {
                    const accessList = Array.isArray(val.accessPages) ? val.accessPages : [];
                    accessList.forEach(p => {
                        if (p && p.hasAccess !== false) {
                            if (p.path) perms.push(p.path);
                            if (p.key) perms.push(p.key);
                            if (p.name) perms.push(p.name);
                        }
                    });
                    if (Array.isArray(val.pages)) {
                        val.pages.forEach(p => {
                            if (p && p.hasAccess === true) {
                                if (p.path) perms.push(p.path);
                                if (p.key) perms.push(p.key);
                                if (p.name) perms.push(p.name);
                            } else if (p && currentUserId) {
                                const vUsers = Array.isArray(p.viewUsers) ? p.viewUsers.map(String) : [];
                                const eUsers = Array.isArray(p.editUsers) ? p.editUsers.map(String) : [];
                                if (vUsers.includes(currentUserId) || eUsers.includes(currentUserId)) {
                                    if (p.path) perms.push(p.path);
                                    if (p.key) perms.push(p.key);
                                    if (p.name) perms.push(p.name);
                                }
                            }
                        });
                    }
                }
            }
        }
        if (Array.isArray(userData?.allowedPages)) perms.push(...userData.allowedPages);
        if (Array.isArray(userData?.permissions)) perms.push(...userData.permissions);
        if (Array.isArray(userData?.pagePermissions)) perms.push(...userData.pagePermissions);
        return perms;
    } catch {
        return [];
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
    const sessionLangRef = useRef('en');
    const currentSessionIdRef = useRef(null);
    const activeEntityContextRef = useRef({
        lastActiveType: null,
        lastProjectId: null,
        lastProjectName: null,
        lastClientId: null,
        lastClientName: null
    });
    const [chatSessions, setChatSessions] = useState(() => {
        try {
            if (typeof window === 'undefined') return [];
            const raw = window.localStorage.getItem('ciis_ai_chat_sessions');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
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
    const [micSkipReason, setMicSkipReason] = useState(null);
    const micSkipReasonRef = useRef(null);
    const pendingStartRef = useRef(false);

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
        listeningRef,
        isTranscribing,
        isSpeaking,
        isSpeakingRef,
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
        micPermission,
        micPermissionRef,
        setMicPermission,
        lastTranscriptDiag,
        updateTranscriptDiag,
        voiceInfo,
        allVoices,
        speakDiag,
        setSpeakDiag,
    } = useSpeech({
        defaultEngine: 'whisper',
        defaultLang: 'auto', // Defaults to auto language detection
        enableChunking: false,
        maxSttUploads: 12,
        onFinalTranscript: (text) => handleFinalTranscriptRef.current?.(text),
        onInactivityPrompt: () => {
            if (autoSpeak) {
                rawSpeak('मैं सुन रहा हूँ, बोलिये', 'Main sun raha hoon, boliye', () => {
                    (ensureListeningRef.current || ensureListening)();
                });
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

    const persistSession = useCallback((latestMsgs, latestDraft, latestResult) => {
        try {
            if (typeof window === 'undefined') return;
            const msgsList = Array.isArray(latestMsgs) ? latestMsgs : [];
            const userMsg = msgsList.find(m => m.role === 'user');
            if (!userMsg) return;

            let sId = currentSessionIdRef.current;
            if (!sId) {
                sId = 'session_' + Date.now();
                currentSessionIdRef.current = sId;
            }

            const title = String(userMsg.text || 'Conversation').slice(0, 45);
            const sessionData = {
                id: sId,
                title,
                timestamp: Date.now(),
                messages: msgsList,
                draft: latestDraft,
                result: latestResult,
            };

            setChatSessions(prev => {
                const filtered = prev.filter(s => s.id !== sId);
                const next = [sessionData, ...filtered].slice(0, 20);
                try {
                    window.localStorage.setItem('ciis_ai_chat_sessions', JSON.stringify(next));
                } catch {}
                return next;
            });
        } catch {}
    }, []);

    const startNewChat = useCallback(() => {
        resetFlow();
        currentSessionIdRef.current = null;
        sessionLangRef.current = 'en';
        const user = getUser();
        const sidebarConfig = getSidebarConfig();
        const welcomeText = getRoleAwareGreeting(user, new Date(), 'en');
        const allowed = filterWelcomeButtonsByPermissions(user, { sidebarConfig, pagePermissions: getStoredPagePermissions(), language: 'en' });
        setMessages([{ role: 'assistant', text: welcomeText, id: 'msg_' + Date.now() }]);
        setResult({
            status: 'open',
            field: 'welcome',
            reply: welcomeText,
            speech: welcomeText,
            speakText: welcomeText,
            chips: allowed,
            draft: null,
        });
    }, [resetFlow]);

    const loadChatSession = useCallback((session) => {
        if (!session) return;
        currentSessionIdRef.current = session.id;
        if (Array.isArray(session.messages)) {
            setMessages(session.messages);
        }
        draftRef.current = session.draft || null;
        resultRef.current = session.result || null;
        setResult(session.result || null);
    }, []);

    const deleteChatSession = useCallback((sessionId) => {
        setChatSessions(prev => {
            const next = prev.filter(s => s.id !== sessionId);
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('ciis_ai_chat_sessions', JSON.stringify(next));
                }
            } catch {}
            return next;
        });
        if (currentSessionIdRef.current === sessionId) {
            startNewChat();
        }
    }, [startNewChat]);

    // Unified mic restart function after every agent message ends
    const ensureListening = useCallback((attempt = 0) => {
        // 1. Speaker toggle
        if (!autoSpeak) {
            setMicSkipReason('speaker off');
            micSkipReasonRef.current = 'speaker off';
            return;
        }

        // 2. Awaiting an answer check
        const currentStatus = resultRef.current?.status || result?.status;
        const isSessionFinished = isCreatingRef.current || currentStatus === 'created' || currentStatus === 'cancelled';
        if (isSessionFinished) {
            setMicSkipReason('session complete');
            micSkipReasonRef.current = 'session complete';
            return;
        }

        // At greeting/start, status is null/undefined or messages <= 1 (agent just greeted)
        const isAwaiting = !currentStatus || ['needs_input', 'needs_disambiguation', 'ready', 'open', 'idle'].includes(currentStatus);
        if (!isAwaiting) {
            setMicSkipReason('not awaiting answer');
            micSkipReasonRef.current = 'not awaiting answer';
            return;
        }

        // 3. User muted in current window
        if (userMutedRef.current || userMuted) {
            setMicSkipReason('muted');
            micSkipReasonRef.current = 'muted';
            return;
        }

        // 4. Typing in composer
        const isTypingNow = Boolean(isTypingRef.current || inputRef.current?.value?.trim()?.length > 0);
        if (isTypingNow) {
            setMicSkipReason('typing');
            micSkipReasonRef.current = 'typing';
            return;
        }

        // 5. Already listening
        if (listeningRef ? listeningRef.current : listening) {
            setMicSkipReason('already listening');
            micSkipReasonRef.current = 'already listening';
            return;
        }

        // 6. Permission check: block ONLY when permission is explicitly 'denied'!
        if (micPermissionRef?.current === 'denied' || micPermission === 'denied' || speechError === 'not-allowed') {
            setMicSkipReason('permission');
            micSkipReasonRef.current = 'permission';
            return;
        }

        // 7. Agent speaking check: only delay if active utterance is actually queued, otherwise cancel speech & start
        const isActivelySpeaking = Boolean(
            (isSpeakingRef ? isSpeakingRef.current : isSpeaking) &&
            typeof window !== 'undefined' &&
            window.speechSynthesis?.speaking &&
            window.__ciisCurrentUtterance
        );
        if (isActivelySpeaking) {
            setTimeout(() => ensureListening(attempt + 1), 300);
            return;
        }

        // Force-clear stale speaking flags before starting mic
        cancelSpeech();
        if (typeof window !== 'undefined') {
            window.__ciisVoiceSpeaking = false;
            window.__ciisCurrentUtterance = null;
        }

        pendingStartRef.current = true;
        try {
            const startProm = start({ force: true });
            if (startProm && typeof startProm.catch === 'function') {
                startProm.then(() => {
                    pendingStartRef.current = false;
                }).catch((err) => {
                    pendingStartRef.current = false;
                    if (attempt < 2) {
                        setTimeout(() => ensureListening(attempt + 1), 300);
                    } else {
                        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
                            setMicPermission?.('denied');
                            if (micPermissionRef) micPermissionRef.current = 'denied';
                        }
                        const r = (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') ? 'permission' : 'start failed';
                        setMicSkipReason(r);
                        micSkipReasonRef.current = r;
                    }
                });
            } else {
                pendingStartRef.current = false;
            }
            setMicSkipReason(null);
            micSkipReasonRef.current = null;
        } catch (err) {
            pendingStartRef.current = false;
            if (attempt < 2) {
                setTimeout(() => ensureListening(attempt + 1), 300);
            } else {
                setMicSkipReason('start failed');
                micSkipReasonRef.current = 'start failed';
            }
        }
    }, [autoSpeak, result?.status, userMuted, listening, speechError, cancelSpeech, start, isSpeaking]);

    const ensureListeningRef = useRef(null);
    ensureListeningRef.current = ensureListening;

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

            if (text && /(?:remove|delete|clear|hatao|hata\s*do)\s*(?:attachment|file|photo|image)|(?:attachment|file|photo|image)\s*(?:hatao|hata\s*do|remove|delete|clear)/i.test(text)) {
                setFiles([]);
            }

            setInput('');
            if (inputRef.current) {
                inputRef.current.value = '';
            }
            setLoading(true);
            cancelSpeech();
            stop('turn-send');

            // When ready to create, check if message is a field change, confirmation, or refusal
            const isReady = readyCountdown !== null || resultRef.current?.status === 'ready' || result?.status === 'ready';
            if (isReady && text && !action && !pick) {
                if (hasFieldChangeIntent(text)) {
                    // Field modification requested (e.g. "due time change karo 7 baaj kar 10 min ka karo")
                    // Fall through to backend parse so the draft is updated!
                } else if (isRefusalOrEditIntent(text)) {
                    setLoading(false);
                    const isEn = sessionLangRef.current === 'en';
                    const replyMsg = isEn ? 'Please tell me what changes you want to make, and I will update them.' : 'Ji batayein kya changes karne hain? Main kar dungi.';
                    const speechMsg = isEn ? 'Please tell me what changes you want to make.' : 'जी बताएं क्या बदलाव करने हैं? मैं कर दूंगी।';
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
                        const watchdog = createTtsWatchdog(() => {
                            cancelSpeech();
                            (ensureListeningRef.current || ensureListening)();
                        }, replyMsg.length);
                        speak(speechMsg, replyMsg, () => {
                            watchdog.cancel();
                            (ensureListeningRef.current || ensureListening)();
                        });
                    } else {
                        (ensureListeningRef.current || ensureListening)();
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
                        const watchdog = createTtsWatchdog(() => {
                            cancelSpeech();
                            (ensureListeningRef.current || ensureListening)();
                        }, noiseReply.length);
                        speak(noiseSpeech, noiseReply, () => {
                            watchdog.cancel();
                            (ensureListeningRef.current || ensureListening)();
                        });
                    } else {
                        (ensureListeningRef.current || ensureListening)();
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
                const currentUser = getUser();
                const currentSidebarConfig = getSidebarConfig();
                const allowedButtons = filterWelcomeButtonsByPermissions(currentUser, { sidebarConfig: currentSidebarConfig, pagePermissions: getStoredPagePermissions() });
                const allowedIntents = allowedButtons.map(b => b.action?.intent).filter(Boolean);

                const currentLanguage = sessionLangRef.current || 'en';
                const detectedLanguage = text ? detectMessageLanguage(text, currentLanguage) : currentLanguage;
                sessionLangRef.current = detectedLanguage;

                const enrichedDraft = {
                    ...(draft || {}),
                    ...(activeEntityContextRef.current?.lastActiveType ? activeEntityContextRef.current : {})
                };
                const history = (messages || []).slice(-10).map(m => ({
                    role: m.role || m.sender || 'user',
                    content: m.text || m.content || ''
                }));

                const requestPayload = buildParseRequestBody({
                    text,
                    action,
                    pick,
                    draft: enrichedDraft,
                    language: detectedLanguage,
                    allowedIntents,
                    history,
                });
                const { data } = await axiosInstance.post(
                    AI_ENDPOINTS.TASK_AGENT_PARSE,
                    requestPayload,
                    {
                        signal: abortController.signal,
                        timeout: TURN_TIMEOUT_MS,
                    }
                );

                if (data?.draft?.lastClientId) {
                    activeEntityContextRef.current = {
                        lastActiveType: 'client',
                        lastClientId: data.draft.lastClientId,
                        lastClientName: data.draft.lastClientName,
                        lastProjectId: null,
                        lastProjectName: null
                    };
                } else if (data?.draft?.lastProjectId) {
                    activeEntityContextRef.current = {
                        lastActiveType: 'project',
                        lastProjectId: data.draft.lastProjectId,
                        lastProjectName: data.draft.lastProjectName,
                        lastClientId: null,
                        lastClientName: null
                    };
                }

                draftRef.current = data.draft || draft || null;
                resultRef.current = data;
                setResult(data);

                if (data.taskUpdated) {
                    broadcastTaskUpdated(data.updatedTask || { _id: data.updatedTaskId });
                }

                let assistantMsgId = null;
                if (data.reply) {
                    const extra = (data.status === 'ready' && data.preview) ? { preview: data.preview, payload: data.payload } : {};
                    assistantMsgId = pushMsg('assistant', data.reply, extra);
                }

                if (data.language) {
                    sessionLangRef.current = data.language;
                }

                setMessages(prev => {
                    persistSession(prev, data.draft, data);
                    return prev;
                });

                if (data.field === 'attachments') {
                    setHighlightPaperclip(true);
                } else {
                    setHighlightPaperclip(false);
                }

                const spokenText = resolveSpokenText(data, data.reply);
                const isEnglishTurn = (data.language === 'en') || (sessionLangRef.current === 'en') || (!/[\u0900-\u097F]/.test(data.reply || '') && !/\b(?:aap|ap|mera|meri|mere|mujhe|hamara|hum|kya|kaun|kon|kaunsi|kab|kahan|kaise|kese|kyun|kisko|kisse|kitne|kitna|hai|hain|ho|hoon|hun|tha|thi|kar|karo|karna|kariye|banao|banayein|batao|batayein|dikhao|dikhayein|rakho|hoga|hogi|dena|dijiye|chahiye|raha|rahi|rahe|aur|ya|ke|ki|ka|ko|mein|main|liye|saath|bhi|nahi|nhi|mat|badhiya|shukriya|theek|thik|dhanyawad|kaam|kardo|karwao)\b/i.test(data.reply || '') && /[a-zA-Z]{3,}/.test(data.reply || ''));
                const spokenSpeech = isEnglishTurn
                    ? cleanForSpeech(data.speech || data.speakText || spokenText)
                    : (data.speakTextHi
                    ? cleanForSpeech(data.speakTextHi)
                    : (data.speechDevanagari
                    ? cleanForSpeech(data.speechDevanagari)
                    : ((data.speech && !data.reply) ? cleanForSpeech(data.speech) : spokenText)));

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

                    speak(spokenSpeech, spokenText, () => {
                        (ensureListeningRef.current || ensureListening)();
                    });
                } else {
                    (ensureListeningRef.current || ensureListening)();
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
        (text, speechDur = 0) => {
            const clean = String(text || '').trim();
            if (!clean) {
                updateTranscriptDiag?.({ text: '', dropped: true, reason: 'too short', durationMs: speechDur });
                return;
            }

            // Exact prompt match guard
            const isGreetingPrompt = clean.toLowerCase().includes('main ciis ai assistant hoon') ||
                clean.toLowerCase().includes('task create karne ke liye mujhe ye jaankari');
            if (isGreetingPrompt) {
                updateTranscriptDiag?.({ text: clean, dropped: true, reason: 'exact prompt match', durationMs: speechDur });
                setTimeout(() => {
                    if (!userMutedRef.current) {
                        start({ force: true });
                    }
                }, 300);
                return;
            }

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
                        updateTranscriptDiag?.({ text: clean, dropped: true, reason: 'filler', durationMs: speechDur });
                        (ensureListeningRef.current || ensureListening)();
                        return;
                    }
                }

                // If in idle state (no question pending, no draft being collected), drop filler-only transcripts
                const isQuestionPending = Boolean(resultRef.current?.field || result?.field || isReady);
                if (!isQuestionPending && isFillerOnlyTranscript(clean)) {
                    if (import.meta.env?.DEV) {
                        console.info('[useTaskAgentSession] Dropped filler-only transcript in idle state:', clean);
                    }
                    updateTranscriptDiag?.({ text: clean, dropped: true, reason: 'filler', durationMs: speechDur });
                    (ensureListeningRef.current || ensureListening)();
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
                updateTranscriptDiag?.({ text: clean, dropped: true, reason: 'filler', durationMs: speechDur });
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
            const isClientFlow = resultRef.current?.draft?.intent === 'create_client' || result?.draft?.intent === 'create_client';
            const clientAllowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
            const clientMaxSizeBytes = 2 * 1024 * 1024;
            const maxFilesLimit = isClientFlow ? 1 : (resultRef.current?.payload?.maxFiles || result?.payload?.maxFiles || (resultRef.current?.draft?.intent === 'task_project' || result?.draft?.intent === 'task_project' ? 1 : MAX_FILES));
            for (const file of newFilesList) {
                if (isClientFlow) {
                    const ext = (file.name ? '.' + file.name.split('.').pop() : '').toLowerCase();
                    if (!clientAllowedExts.includes(ext)) {
                        setFileError('Logo file type invalid hai. Sirf PNG, JPG, JPEG ya WEBP files allowed hain.');
                        continue;
                    }
                    if (file.size > clientMaxSizeBytes) {
                        setFileError('Logo file size is too large. Maximum size is 2MB.');
                        continue;
                    }
                }
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
                        action: isClientFlow ? { type: 'set', field: 'companyLogoName', value: limited[0]?.name } : { type: 'attachments', count: limited.length },
                        display: isClientFlow ? `📎 Logo: ${limited[0]?.name} attached` : `📎 ${limited.length} file(s) attached`,
                    });
                    return limited;
                }
                if (valid.length > 0) {
                    sendRef.current?.({
                        action: isClientFlow ? { type: 'set', field: 'companyLogoName', value: combined[0]?.name } : { type: 'attachments', count: combined.length },
                        display: isClientFlow ? `📎 Logo: ${combined[0]?.name} attached` : `📎 ${combined.length} file(s) attached`,
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
            const isCreatingClient = payload.endpoint === '/clientsservice' || currentDraft?.intent === 'create_client';
            let uploadedLogoUrl = null;
            if (isCreatingClient && files.length > 0) {
                const logoForm = new FormData();
                logoForm.append('logo', files[0]);
                try {
                    const logoRes = await axiosInstance.post('/company/upload-logo', logoForm, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        timeout: 30000,
                    });
                    if (logoRes?.data?.success && logoRes?.data?.logoUrl) {
                        uploadedLogoUrl = logoRes.data.logoUrl;
                    } else {
                        throw new Error(logoRes?.data?.message || 'Logo upload failed');
                    }
                } catch (logoErr) {
                    console.error('[useTaskAgentSession] Logo upload error:', logoErr);
                    const errMsg = logoErr.response?.data?.message || logoErr.message || 'Logo upload fail ho gaya';
                    pushMsg('assistant', `Logo upload error: ${errMsg}. Client create nahi ho saka.`, { isError: true });
                    setCreating(false);
                    isCreatingRef.current = false;
                    return;
                }
            }

            const isMultipart = !isCreatingClient && payload.multipart !== false && (files.length > 0 || Boolean(voiceNoteBlob) || payload.multipart === true);
            let requestData;
            const requestHeaders = {};

            if (isMultipart) {
                const entries = buildTaskFormDataEntries({ payload, files, voiceNoteBlob });
                const formData = new FormData();
                entries.forEach(([key, val, filename]) => {
                    if (filename) {
                        formData.append(key, val, filename);
                    } else {
                        formData.append(key, val);
                    }
                });
                requestData = formData;
            } else {
                requestData = { ...(payload.body || payload.fields || {}) };
                if (uploadedLogoUrl) {
                    requestData.companyLogo = uploadedLogoUrl;
                }
                requestHeaders['Content-Type'] = 'application/json';
            }

            let targetEndpoint = payload.endpoint;
            if (targetEndpoint.startsWith('/api/')) {
                targetEndpoint = targetEndpoint.slice(4);
            }

            const response = await axiosInstance.request({
                url: targetEndpoint,
                method: payload.method || 'POST',
                data: requestData,
                headers: requestHeaders,
                timeout: 30000,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(pct);
                    }
                },
            });

            const statusOk = response?.status === 200 || response?.status === 201;
            if (!statusOk) {
                const errMsg = response?.data?.message || response?.data?.error || 'Request failed';
                const err = new Error(errMsg);
                err.response = response;
                throw err;
            }

            if (isCreatingClient) {
                const createdClient = response?.data?.data?.client || response?.data?.client || response?.data?.data || null;
                const newClientId = createdClient?._id || response?.data?.client?._id || response?.data?.data?._id || createdClient?.id;
                if (!newClientId) {
                    const errMsg = response?.data?.message || response?.data?.error || 'Client creation failed (no ID returned)';
                    const err = new Error(errMsg);
                    err.response = response;
                    throw err;
                }
                const newClientName = createdClient?.client || payload.fields?.client || currentDraft?.client || 'Client';

                clearAllCaches();

                if (typeof window !== 'undefined') {
                    const detail = { client: createdClient || { _id: newClientId, ...payload.fields } };
                    window.dispatchEvent(new CustomEvent('client:created', { detail }));
                }

                const hasServices = Array.isArray(payload.fields?.services) && payload.fields.services.length > 0;
                let clientSuccessText = `Client '${newClientName}' successfully ban gaya ✅`;
                if (!hasServices) {
                    clientSuccessText += '\n\nIs client ke liye abhi koi service nahi hai, isliye client task tab tak nahi ban payega.';
                }
                pushMsg('assistant', clientSuccessText);
                if (autoSpeak) {
                    cancelSpeech();
                    const spokenMsg = hasServices
                        ? `Client '${newClientName}' successfully ban gaya`
                        : `Client '${newClientName}' ban gaya. Is client ke liye abhi koi service nahi hai, isliye client task tab tak nahi ban payega.`;
                    speak(hasServices ? 'क्लाइंट सफलतापूर्वक बन गया' : 'क्लाइंट बन गया। इसके लिए कोई सर्विस नहीं है।', spokenMsg);
                }

                const clientChips = [
                    ...(hasServices ? [{
                        label: 'Is Client Ke Liye Task Banayein',
                        action: {
                            type: 'set_intent',
                            intent: 'create_client_task',
                            client: newClientName,
                            clientId: String(newClientId),
                            clientServices: payload.fields?.services || createdClient?.services || []
                        }
                    }] : []),
                    { label: 'Naya Client Banayein', action: { type: 'set_intent', intent: 'create_client' } },
                    { label: 'Main Menu', action: { type: 'reset' } },
                ];
                setResult({
                    status: 'needs_input',
                    field: 'post_client_creation',
                    reply: clientSuccessText,
                    speech: hasServices ? 'क्लाइंट सफलतापूर्वक बन गया।' : 'क्लाइंट बन गया। इसके लिए कोई सर्विस नहीं है।',
                    speakText: clientSuccessText,
                    chips: clientChips,
                    draft: {
                        intent: 'create_client_task',
                        client: newClientName,
                        clientId: String(newClientId),
                        clientServices: payload.fields?.services || createdClient?.services || []
                    }
                });
                stop('created');
                return;
            }

            const isCreatingClientPlan = payload.endpoint === '/api/client-plans' || payload.endpoint === '/client-plans' || currentDraft?.intent === 'create_client_plan';
            if (isCreatingClientPlan) {
                const createdPlan = response?.data?.data || response?.data?.plan || response?.data || null;
                const newPlanId = createdPlan?._id || createdPlan?.id || 'plan_' + Date.now();
                const planName = createdPlan?.name || payload.fields?.name || currentDraft?.name || 'Client Plan';

                clearAllCaches();
                if (typeof window !== 'undefined') {
                    const detail = { plan: createdPlan || { _id: newPlanId, ...payload.fields } };
                    window.dispatchEvent(new CustomEvent('clientPlan:created', { detail }));
                }

                const planSuccessText = `Client Plan "${planName}" successfully create aur save ho gaya hai! ✅\n\nAb yeh plan "Add Client" me bhi available hai.`;
                pushMsg('assistant', planSuccessText);
                if (autoSpeak) {
                    cancelSpeech();
                    speak('क्लाइंट प्लान सफलतापूर्वक बन गया और सेव हो गया है।', `Client Plan "${planName}" successfully create aur save ho gaya hai!`);
                }

                const planChips = [
                    { label: 'Naya Client Banayein', action: { type: 'set_intent', intent: 'create_client' } },
                    { label: 'Aur Ek Plan Banayein', action: { type: 'set_intent', intent: 'create_client_plan' } },
                    { label: 'Main Menu', action: { type: 'reset' } },
                ];
                setResult({
                    status: 'needs_input',
                    field: 'post_plan_creation',
                    reply: planSuccessText,
                    speech: 'क्लाइंट प्लान सफलतापूर्वक बन गया और सेव हो गया है।',
                    speakText: `Client Plan "${planName}" successfully create aur save ho gaya hai!`,
                    chips: planChips,
                    draft: { intent: 'create_client' }
                });
                stop('created');
                return;
            }

            const isCreatingClientTask = payload.endpoint?.includes('/tasks/client-tasks') || currentDraft?.intent === 'create_client_task';
            if (isCreatingClientTask) {
                const createdTask = response?.data?.data || response?.data?.task || response?.data || null;
                const taskTitle = createdTask?.name || payload.fields?.name || currentDraft?.title || 'Client Task';
                const serviceName = currentDraft?.service || 'service';
                const clientName = currentDraft?.client || 'Client';

                clearAllCaches();
                if (typeof window !== 'undefined') {
                    const detail = { task: createdTask, clientId: currentDraft?.clientId, service: serviceName };
                    window.dispatchEvent(new CustomEvent('clientTask:created', { detail }));
                }

                const taskSuccessText = `"${taskTitle}" task "${clientName}" ki "${serviceName}" service mein successfully add ho gaya! ✅`;
                pushMsg('assistant', taskSuccessText);
                if (autoSpeak) {
                    cancelSpeech();
                    speak('क्लाइंट सर्विस टास्क सफलतापूर्वक बन गया है।', taskSuccessText);
                }

                const postChips = [
                    {
                        label: `${serviceName} mein aur task add karein`,
                        action: {
                            type: 'set_client_task_service',
                            service: serviceName,
                        }
                    },
                    {
                        label: 'Kisi aur service mein',
                        action: {
                            type: 'set_intent',
                            intent: 'create_client_task',
                            client: clientName,
                            clientId: currentDraft?.clientId,
                            clientServices: currentDraft?.clientServices || []
                        }
                    },
                    { label: 'Main Menu', action: { type: 'reset' } },
                ];

                setResult({
                    status: 'needs_input',
                    field: 'post_client_task_creation',
                    reply: taskSuccessText,
                    speech: 'क्लाइंट सर्विस टास्क सफलतापूर्वक बन गया है।',
                    speakText: taskSuccessText,
                    chips: postChips,
                    draft: {
                        intent: 'create_client_task',
                        client: clientName,
                        clientId: currentDraft?.clientId,
                        clientServices: currentDraft?.clientServices || [],
                        service: serviceName
                    }
                });
                stop('created');
                return;
            }

            const isCreatingProject = payload.endpoint === '/projects' || currentDraft?.intent === 'create_project';
            if (isCreatingProject) {
                const createdProject = response?.data?.project || response?.data?.newProject || response?.data?.data || null;
                const newProjId = createdProject?._id || response?.data?.project?._id || response?.data?._id || createdProject?.id || response?.data?.id;
                if (!newProjId) {
                    const errMsg = response?.data?.message || response?.data?.error || 'Project creation failed (no ID returned)';
                    const err = new Error(errMsg);
                    err.response = response;
                    throw err;
                }
                const newProjName = createdProject?.projectName || createdProject?.name || payload.fields?.projectName || 'Project';

                clearAllCaches();
                invalidateTaskManagementCache();

                if (typeof window !== 'undefined') {
                    const detail = { project: createdProject || { _id: newProjId, ...payload.fields } };
                    window.dispatchEvent(new CustomEvent('project:created', { detail }));
                    window.dispatchEvent(new CustomEvent('ciis:project-created', { detail }));
                }

                const successReply = `Project '${newProjName}' ban gaya ✅\n\nIs project mein koi task banana hai?`;
                pushMsg('assistant', successReply);
                if (autoSpeak) {
                    cancelSpeech();
                    speak('प्रोजेक्ट बन गया। क्या इसमें कोई टास्क बनाना है?', `Project '${newProjName}' ban gaya. Is project mein koi task banana hai?`, () => {
                        (ensureListeningRef.current || ensureListening)();
                    });
                } else {
                    (ensureListeningRef.current || ensureListening)();
                }

                // Chained task prompt: project._id is now known from create response
                setResult({
                    status: 'needs_input',
                    field: 'chain_task_decision',
                    reply: successReply,
                    speech: 'प्रोजेक्ट बन गया। क्या इसमें कोई टास्क बनाना है?',
                    speakText: `Project '${newProjName}' ban gaya. Is project mein koi task banana hai?`,
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
            if (!newTaskId) {
                const errMsg = response?.data?.message || response?.data?.error || 'Task creation failed (no ID returned)';
                const err = new Error(errMsg);
                err.response = response;
                throw err;
            }

            markTaskIdAsCreated(newTaskId);

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

            const taskTitle = createdTask?.title || payload.fields?.title || 'Task';
            const taskSuccessText = `Task '${taskTitle}' ban gaya ✅`;
            pushMsg('assistant', taskSuccessText);
            if (autoSpeak) {
                cancelSpeech();
                speak('टास्क बन गया', `Task '${taskTitle}' ban gaya`);
            }
            // Mic stays off after task creation
            stop('created');
            resetFlow();
        } catch (err) {
            // Lock remains held through error handling; unlocked only in finally
            let msg;
            const isTimeout = err?.code === 'ECONNABORTED' ||
                err?.name === 'TimeoutError' ||
                String(err?.message || '').toLowerCase().includes('timeout');

            if (isTimeout) {
                msg = 'Server ne jawab nahi diya. Task ban gaya ho sakta hai, project ke Tasks mein check karein.';
            } else {
                const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
                msg = (serverMsg && typeof serverMsg === 'string' && serverMsg.trim())
                    ? serverMsg.trim()
                    : mapTaskAgentError(err);
            }
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
        const activeDraft = resultRef.current?.draft || draftRef.current || result?.draft;
        const activeIntent = activeDraft?.intent;
        let cancelText = 'Theek hai, task cancel kar diya.';
        let cancelSpoken = 'टास्क कैंसिल कर दिया गया';
        if (activeIntent === 'create_client') {
            cancelText = 'Theek hai, client add karna cancel kar diya.';
            cancelSpoken = 'क्लाइंट जोड़ना कैंसिल कर दिया गया';
        } else if (activeIntent === 'create_client_plan') {
            cancelText = 'Theek hai, client plan banana cancel kar diya.';
            cancelSpoken = 'क्लाइंट प्लान बनाना कैंसिल कर दिया गया';
        } else if (activeIntent === 'create_project') {
            cancelText = 'Theek hai, project banana cancel kar diya.';
            cancelSpoken = 'प्रोजेक्ट बनाना कैंसिल कर दिया गया';
        }
        resetFlow();
        const msgId = pushMsg('assistant', cancelText);
        if (autoSpeak && msgId && !spokenMessageIdsRef.current.has(msgId)) {
            spokenMessageIdsRef.current.add(msgId);
            cancelSpeech();
            speak(cancelSpoken, cancelText);
        }
    }, [result, resetFlow, pushMsg, cancelReadyCountdown, autoSpeak, speak, stop, cancelSpeech]);

    const handleEdit = useCallback(() => {
        cancelReadyCountdown();
        stop('button-click');
        const isEn = sessionLangRef.current === 'en';
        pushMsg('user', isEn ? 'Edit' : 'Edit');
        const replyMsg = isEn ? 'Please tell me what changes you want to make, and I will update them.' : 'Ji batayein kya changes karne hain? Main kar dungi.';
        const speechMsg = isEn ? 'Please tell me what changes you want to make.' : 'जी बताएं क्या बदलाव करने हैं? मैं कर दूंगी।';
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
            sessionLangRef.current = 'en';
            currentSessionIdRef.current = null;
            const currentUser = getUser();
            const currentSidebarConfig = getSidebarConfig();
            const allowed = filterWelcomeButtonsByPermissions(currentUser, { sidebarConfig: currentSidebarConfig, pagePermissions: getStoredPagePermissions(), language: 'en' });
            const welcomeText = getRoleAwareGreeting(currentUser, new Date(), 'en');
            const msgId = pushMsg('assistant', welcomeText);
            if (autoSpeak && msgId && !spokenMessageIdsRef.current.has(msgId)) {
                spokenMessageIdsRef.current.add(msgId);
                cancelSpeech();
                speak(welcomeText, welcomeText);
            }
            setResult({
                status: 'open',
                field: 'welcome',
                reply: welcomeText,
                speech: welcomeText,
                speakText: welcomeText,
                chips: allowed,
                draft: null,
            });
            return;
        }
        if (chip.action?.type === 'finish_chain') {
            setResult(null);
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
            sendTurn({ action: chip.action, text: chip.label, display: chip.label, source: turnSource });
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
            inputRef.current.style.height = 'auto';
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
            const sidebarConfig = getSidebarConfig();
            const allowed = filterWelcomeButtonsByPermissions(user, { sidebarConfig, pagePermissions: getStoredPagePermissions(), language: 'en' });
            const greetingText = getRoleAwareGreeting(user, new Date(), 'en');
            const greetingId = pushMsg('assistant', greetingText);

            setResult({
                status: 'open',
                field: 'welcome',
                reply: greetingText,
                speech: greetingText,
                speakText: greetingText,
                chips: allowed,
                draft: null,
            });

            // Dynamically ensure fresh sidebar permissions if local storage copy was missing or incomplete
            if (!Array.isArray(sidebarConfig?.menuItems) || sidebarConfig.menuItems.length === 0) {
                const comp = JSON.parse(localStorage.getItem('companyDetails') || localStorage.getItem('company') || '{}');
                const companyId = user?.company?._id || user?.company || comp?._id || comp?.id;
                const role = user?.jobRole?._id || user?.jobRole || user?.role;
                if (companyId && role) {
                    axiosInstance.get('/sidebar/config', {
                        params: { companyId, role }
                    }).then(res => {
                        if (res?.data?.data?.menuItems) {
                            try {
                                localStorage.setItem('sidebarConfig', JSON.stringify(res.data.data));
                            } catch {}
                            const refreshedAllowed = filterWelcomeButtonsByPermissions(user, {
                                sidebarConfig: res.data.data,
                                pagePermissions: getStoredPagePermissions(),
                                language: 'en'
                            });
                            setResult(prev => (!prev?.draft?.intent ? { ...prev, chips: refreshedAllowed } : prev));
                        }
                    }).catch(() => {});
                }
            }

            if (autoSpeak && ttsSupported && greetingId && !spokenMessageIdsRef.current.has(greetingId)) {
                spokenMessageIdsRef.current.add(greetingId);
                cancelSpeech();
                const watchdog = createTtsWatchdog(() => {
                    cancelSpeech();
                    (ensureListeningRef.current || ensureListening)();
                }, greetingText.length);
                speak(greetingText, greetingText, () => {
                    watchdog.cancel();
                    (ensureListeningRef.current || ensureListening)();
                });
            } else if (sttSupported && !userMutedRef.current) {
                (ensureListeningRef.current || ensureListening)();
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
    const currentUser = getUser();
    const currentSidebarConfig = getSidebarConfig();
    const allowedWelcomeButtons = filterWelcomeButtonsByPermissions(currentUser, { sidebarConfig: currentSidebarConfig, pagePermissions: getStoredPagePermissions() });
    const chips = Array.isArray(result?.chips) && result?.chips.length > 0
        ? result.chips
        : ((!result?.draft || !result?.draft?.intent) ? allowedWelcomeButtons : []);
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
        listeningRef,
        isTranscribing,
        isSpeaking,
        isSpeakingRef,
        micSkipReason,
        micPermission,
        lastTranscriptDiag,
        ensureListening,
        pendingStartRef,
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
        voiceInfo,
        // Chat History & Sessions
        chatSessions,
        loadChatSession,
        deleteChatSession,
        startNewChat,
    };
}
