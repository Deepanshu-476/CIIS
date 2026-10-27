/**
 * Pure decision and helper logic for Task Agent.
 * ZERO browser dependencies (safe for unit testing in Node.js).
 */

export const MAX_FILES = 10;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mp3', 'wav', 'avi', 'mkv', 'webm']);

export const candidateId = (c) => c?.id || c?._id || c?.userId || c?.assigneeId || c?.projectId || '';

export const formatCandidateDate = (dateVal) => {
    if (!dateVal) return 'No date';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'No date';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/**
 * Sanitizes document name for project task attachment.
 * Matches ProjectDetailsPage.jsx lines 407-414.
 */
export const sanitizeDocName = (value, fallback = 'Document') => {
    const clean = String(value || '')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 60);
    return clean || fallback;
};

export const isRefusalOrEditIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /(?:^|\P{L})(?:nahi|no|abhi\s*nahi|ruko|wait|cancel|rehne\s*do|chhod|rok\s*do|nahi\s*chahiye|change|changes|badal|badalna|edit|गलत|नहीं|मत|रुको|मत\s*करो|बदलो)(?:\P{L}|$)/iu.test(text);
};

export const hasFieldChangeIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    // Strict whole-word match for date words preventing combining marks like 'ी' from being treated as boundary
    const hasDateWords = /(?<![\p{L}\p{M}])(?:kal|कल|aaj|आज|tomorrow|today)(?![\p{L}\p{M}])/iu.test(text);
    return (
        /\b\d{1,2}[:.]\d{1,2}\b/i.test(text) ||
        /\b([1-9]|1[0-2])\s+[0-5]\d\b/i.test(text) ||
        hasDateWords ||
        /(?:title|naam|नाम|description|विवरण|डिस्क्रिप्शन|priority|प्रायोरिटी|status|स्टेटस|due|baje|बजे|baaj|baj|bach|बज|time|samay|समय|date|tareekh|tarikh|तारीख|minute|min|मिनट|घंटा|hour|p\.?m\.?|a\.?m\.?|pm|am|subah|shaam|sham|dopahar|raat|reminder|रिमाइंडर|checkpoints|चेकपॉइंट|assign|photo|file|low|high|medium|pending|in-progress|completed|chay|pchas|saadhe|sadhe|saade|sade|साढ़े|tees|तीस|pandrah|पंद्रह|pachaas|पचास)/iu.test(text)
    );
};

function levenshtein(a, b) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;
    const row = [];
    for (let j = 0; j <= lb; j += 1) row[j] = j;
    for (let i = 1; i <= la; i += 1) {
        let prev = i;
        for (let j = 1; j <= lb; j += 1) {
            const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
            row[j - 1] = prev;
            prev = val;
        }
        row[lb] = prev;
    }
    return row[lb];
}

const CANONICAL_AFFIRMATIVES = [
    'haan ji', 'bana do', 'kar do', 'create kar do', 'ok', 'theek hai',
    'haan ji kardo', 'haan ji banado', 'kardo', 'banado'
];

export const isConfirmationIntent = (text, state = null) => {
    if (!text || typeof text !== 'string') return false;
    // Safe guard: only active in confirming or ready state when state is provided
    if (state && state !== 'ready' && state !== 'confirming') return false;
    if (isRefusalOrEditIntent(text)) return false;

    // Utterance word-count limit (up to 6 words)
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 6) return false;

    if (hasFieldChangeIntent(text)) return false;

    let clean = text.toLowerCase().replace(/[^a-zA-Z\u0900-\u097F\s]/g, ' ').replace(/\s+/g, ' ').trim();
    clean = clean.replace(/\b(?:hanji|hnji|haanji|aaji)\b/g, 'haan ji');

    // Direct affirmative patterns
    const isDirect = (
        // English & Hinglish create variations (including Whisper mishearings: "crete", "buna")
        /(?:^|\P{L})(?:create\s*it|create\s*this|create\s*now|create\s*task|create\s*kardo|create\s*kar\s*do|create\s*karo|create\s*kar|crete\s*it|crete\s*kardo|create|submit|confirm)(?:\P{L}|$)/iu.test(text) ||
        // Hindi/Hinglish bana do / buna do variations
        /(?:^|\P{L})(?:bana\s*do|banao|bana\s*dijiye|bana\s*dena|buna\s*do|bana\s*dein|bana\s*karo)(?:\P{L}|$)/iu.test(text) ||
        // Kar do variations (e.g., "kar do complete", "complete kar do", "kar do create", "kar do")
        /(?:^|\P{L})(?:kar\s*do|kardo|kar\s*dijiye|karo|kar\s*dein|complete\s*kar\s*do|kar\s*do\s*complete)(?:\P{L}|$)/iu.test(text) ||
        // Direct affirmations
        /(?:^|\P{L})(?:haan|ha|haanji|hnji|yes|yep|yeah|sure|ok|okay|done|theek\s*hai|thik\s*hai|sahi\s*hai|bilkul)(?:\P{L}|$)/iu.test(text) ||
        // Devanagari explicit affirmation & creation patterns
        /(?:हाँ|हां|अहां|अहा|बना\s*दो|बनाओ|बना\s*दीजिए|बना\s*दें|कर\s*दो|कर\s*दीजिए|कर\s*दें|क्रिएट|क्रिएट\s*करो|क्रिएट\s*कर\s*दो|सबमिट|ठीक\s*है|सही\s*है|हांजी|हाँजी)/iu.test(text)
    );
    if (isDirect) return true;

    // Edit distance against canonical list
    for (const target of CANONICAL_AFFIRMATIVES) {
        const dist = levenshtein(clean, target);
        const maxAllowed = target.length >= 10 ? 3 : (target.length >= 6 ? 2 : 1);
        if (dist <= maxAllowed) return true;
    }

    // Token-by-token alignment tolerance
    for (const target of CANONICAL_AFFIRMATIVES) {
        const targetWords = target.split(' ');
        if (targetWords.length === words.length) {
            let totalWordDist = 0;
            let ok = true;
            for (let i = 0; i < words.length; i++) {
                const d = levenshtein(words[i], targetWords[i]);
                if (d > 2) { ok = false; break; }
                totalWordDist += d;
            }
            if (ok && totalWordDist <= 2) return true;
        }
    }

    return false;
};

/**
/**
 * Builds task creation payload dynamically from the latest server draft at click time.
 * Prevents submitting earlier cached payloads where assignedUsers or other fields are stale.
 */
export const buildConfirmPayloadFromDraft = (draft, fallbackPayload = null) => {
    if (!draft || typeof draft !== 'object') {
        return fallbackPayload;
    }

    const intent = draft.intent;
    const isProject = intent === 'task_project' || Boolean(draft.projectId);
    const isAssigned = intent === 'task_assigned_user' || (draft.taskFor === 'others' && draft.assigneeId);

    if (isProject) {
        const projectId = draft.projectId ? String(draft.projectId) : '';
        const rawStatus = String(draft.status || 'pending').toLowerCase();
        const normStatus = rawStatus.replace(/[-_]/g, ' ');
        const finalStatus = (normStatus === 'in progress' || normStatus === 'inprogress') ? 'in progress' : rawStatus;

        const assignedUsers = draft.assigneeId ? [String(draft.assigneeId)] : [];
        const checkpoints = Array.isArray(draft.checkpoints)
            ? draft.checkpoints.map(c => typeof c === 'string' ? { title: c, completed: false } : c)
            : [];

        const reminderSettings = {
            enabled: Boolean(draft.reminder),
            options: [draft.reminderOption || 'oneHourBefore'],
            reminderTime: draft.reminderTime || null,
            customTime: draft.customTime || null,
            repeatIntervalMinutes: draft.repeatIntervalMinutes || null,
            minutesBeforeDue: draft.minutesBeforeDue || (draft.reminderOption === 'oneHourBefore' ? 60 : null),
        };

        const rawDue = draft.dueDate || draft.dueDateTime || null;

        return {
            endpoint: `/projects/${projectId}/tasks`,
            method: 'POST',
            multipart: true,
            fileField: 'pdfFile',
            maxFiles: 1,
            accept: ['.pdf', 'image/*'],
            fields: {
                title: String(draft.title || '').trim(),
                description: String(draft.description || '').trim(),
                assignedUsers,
                assignedTo: draft.assigneeId ? String(draft.assigneeId) : '',
                priority: draft.priority ? (draft.priority.charAt(0).toUpperCase() + draft.priority.slice(1).toLowerCase()) : 'Medium',
                status: finalStatus,
                checkpoints: JSON.stringify(checkpoints),
                reminderSettings: JSON.stringify(reminderSettings),
                dueDate: rawDue,
            },
        };
    }

    if (isAssigned) {
        return {
            endpoint: '/task/create-for-others',
            method: 'POST',
            multipart: true,
            fileField: 'files',
            maxFiles: 5,
            accept: ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.mp3', '.wav', '.avi', '.mkv', '.webm', 'image/*', 'application/pdf', 'video/*', 'audio/*'],
            fields: {
                title: String(draft.title || '').trim(),
                description: String(draft.description || '').trim(),
                assigneeId: draft.assigneeId ? String(draft.assigneeId) : '',
                priority: draft.priority ? draft.priority.toLowerCase() : 'medium',
                status: draft.status || 'pending',
                checkpoints: JSON.stringify(draft.checkpoints || []),
                dueDateTime: draft.dueDateTime || draft.dueDate || null,
                reminder: Boolean(draft.reminder),
                reminderOption: draft.reminderOption || null,
                priorityDays: draft.priorityDays ? Number(draft.priorityDays) : 1,
            },
        };
    }

    // Default: self task
    return {
        endpoint: '/tasks/self/create',
        method: 'POST',
        multipart: true,
        fileField: 'files',
        maxFiles: 5,
        accept: ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.mp3', '.wav', '.avi', '.mkv', '.webm', 'image/*', 'application/pdf', 'video/*', 'audio/*'],
        fields: {
            title: String(draft.title || '').trim(),
            description: String(draft.description || '').trim(),
            priority: draft.priority ? draft.priority.toLowerCase() : 'medium',
            status: draft.status || 'pending',
            checkpoints: JSON.stringify(draft.checkpoints || []),
            dueDateTime: draft.dueDateTime || draft.dueDate || null,
            reminder: Boolean(draft.reminder),
            reminderOption: draft.reminderOption || null,
            priorityDays: draft.priorityDays ? Number(draft.priorityDays) : 1,
            repeatPattern: draft.repeatPattern || 'none',
        },
    };
};

/**
 * Resolves valid payload for confirmation, safely discarding React click events,
 * and building from the latest server draft if available.
 */
export const resolveConfirmPayload = (overridePayload, currentPayload, latestDraft = null) => {
    if (overridePayload && typeof overridePayload === 'object' && overridePayload.endpoint) {
        return overridePayload;
    }
    if (latestDraft) {
        const built = buildConfirmPayloadFromDraft(latestDraft, currentPayload);
        if (built && built.endpoint) return built;
    }
    return currentPayload || null;
};

/**
 * Rule: Accept confirm ONLY when in ready/confirming state AND not currently creating (single-flight lock).
 */
export const canAcceptConfirm = (status, isCreatingLock = false) => {
    if (isCreatingLock) return false;
    return status === 'ready' || status === 'confirming';
};

/**
 * Mic Auto-Listen Rule:
 * After EVERY agent question (checkpoints, reminder, attachments, assignee, etc.),
 * the mic must reopen automatically unless userMuted is true.
 *
 * States that trigger auto-listen:
 * 1. 'needs_input' (for any field: checkpoints, reminder, attachments, assignee, chips, etc.)
 * 2. 'needs_disambiguation' (e.g. assignee or project chips)
 * 3. 'ready' (summary question "Kya ise create kar doon?")
 *
 * States that do NOT trigger auto-listen:
 * - 'created' (task finished)
 * - 'cancelled' (session cancelled)
 * - Any state when userMuted === true
 */
export const shouldAutoListenAfterTurn = ({ status, field, userMuted = false, isCreated = false } = {}) => {
    if (userMuted) return false;
    if (isCreated || status === 'created' || status === 'cancelled') return false;
    if (status === 'needs_input' || status === 'needs_disambiguation' || status === 'ready') {
        return true;
    }
    return false;
};

/**
 * Watchdog for TTS onend:
 * If onend never fires (e.g. Chrome garbage-collected SpeechSynthesisUtterance or silent audio device),
 * triggers fallback finish within bounded timeout so the mic reopens.
 */
export const createTtsWatchdog = (onFinish, textLength = 0, maxTimeoutMs = 8000) => {
    let triggered = false;
    const calculated = Math.max(50, textLength * 100 + 1500);
    const estimatedMs = Math.min(maxTimeoutMs, calculated);
    const timer = setTimeout(() => {
        if (!triggered) {
            triggered = true;
            onFinish();
        }
    }, estimatedMs);

    return {
        cancel: () => {
            triggered = true;
            clearTimeout(timer);
        },
        triggerNow: () => {
            if (!triggered) {
                triggered = true;
                clearTimeout(timer);
                onFinish();
            }
        },
        estimatedMs,
    };
};

const KNOWN_SILENCE_HALLUCINATIONS = new Set([
    'thank you',
    'thanks',
    'thanks for watching',
    'thank you for watching',
    'bye',
    'bye bye',
    'you',
    'धन्यवाद',
    'please subscribe',
    'subtitles by',
    'amara.org',
]);

/**
 * Checks if transcript is a known silence hallucination under low real speech duration (< 2s)
 * or low audio energy.
 */
export const isSilenceHallucination = (text, speechDurationMs = 0, peakRms = 0) => {
    if (!text || typeof text !== 'string') return true;
    const lowerRaw = text.trim().toLowerCase();
    const clean = lowerRaw.replace(/[.,!?;:।]+/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!clean && !lowerRaw) return true;

    const isKnown = KNOWN_SILENCE_HALLUCINATIONS.has(clean) ||
        KNOWN_SILENCE_HALLUCINATIONS.has(lowerRaw) ||
        lowerRaw.includes('amara.org') ||
        clean.includes('amara org') ||
        clean.includes('thanks for watching') ||
        clean.includes('thank you for watching') ||
        clean.includes('please subscribe') ||
        clean.includes('subtitles by');

    if (isKnown) {
        // If duration under 2 seconds or peak RMS below normal speech, drop it
        if (speechDurationMs < 2000 || peakRms < 15) {
            return true;
        }
    }
    return false;
};

const FILLER_ONLY_REGEX = /^(?:thank\s*you|thanks|hmm|ok|okay|acha|achha|theek|thik|haan|ha)(?:\s+(?:thank\s*you|thanks|hmm|ok|okay|acha|achha|theek|thik|haan|ha|ji))*$/i;

/**
 * Checks if transcript consists only of filler or acknowledgement words.
 */
export const isFillerOnlyTranscript = (text) => {
    if (!text || typeof text !== 'string') return true;
    return FILLER_ONLY_REGEX.test(text.trim());
};

/**
 * Checks if transcript matches the last spoken assistant reply (app hearing itself).
 */
export const isSelfEcho = (transcript, lastSpokenText) => {
    if (!transcript || !lastSpokenText) return false;
    const t1 = String(transcript).toLowerCase().replace(/[\s.,!?;:।]+/gu, ' ').trim();
    const t2 = String(lastSpokenText).toLowerCase().replace(/[\s.,!?;:।]+/gu, ' ').trim();
    if (!t1 || !t2) return false;
    if (t1 === t2) return true;
    if (t1.length >= 10 && (t2.includes(t1) || t1.includes(t2))) return true;
    return false;
};

/**
 * Validates if an incoming transcript turn can be accepted based on active session and half-duplex state.
 */
export const canProcessTranscriptTurn = ({
    transcriptSessionId,
    currentSessionId,
    userMuted = false,
    isSpeaking = false,
    speechEndedAt = 0,
    now = Date.now(),
}) => {
    if (userMuted) return { allowed: false, reason: 'user_muted' };
    if (transcriptSessionId !== undefined && currentSessionId !== undefined && transcriptSessionId !== currentSessionId) {
        return { allowed: false, reason: 'session_invalidated' };
    }
    if (isSpeaking) return { allowed: false, reason: 'assistant_speaking' };
    if (now - speechEndedAt < 250) return { allowed: false, reason: 'half_duplex_guard_window' };
    return { allowed: true };
};

/**
 * Maps any error (HTTP status, server payload, network/timeout, or unknown) to a user-facing string.
 * Guaranteed to NEVER return an empty string, ensuring every failure produces a visible bubble.
 */
export const mapTaskAgentError = (err) => {
    if (!err) return 'Kuch gadbad ho gayi. Dobara try karein.';
    
    // Explicit server-provided error message takes priority
    const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
    if (serverMsg && typeof serverMsg === 'string' && serverMsg.trim()) {
        return serverMsg.trim();
    }

    const status = err?.response?.status;
    if (status === 404) return 'AI service endpoint nahi mila (404). Admin se contact karein.';
    if (status === 429) return 'AI abhi busy hai, 1 minute baad try karein.';
    if (status === 503) return 'AI service abhi available nahi hai. Admin se contact karein.';
    if (status === 502) return 'Samajh nahi paaya, kripya dobara bolein.';
    if (status === 401) return 'Session expire ho gaya, dobara login karein.';
    if (status === 403) return 'Aapko ye action karne ki permission nahi hai.';
    if (status >= 500) return 'Server par error aayi (500). Dobara try karein.';

    // Check for network errors, timeouts, or aborted requests
    const code = err?.code;
    const message = err?.message || '';
    if (code === 'ECONNABORTED' || message.includes('timeout') || err?.name === 'CanceledError' || err?.name === 'AbortError' || /aborted|canceled/i.test(message)) {
        return 'Request timeout ho gaya. Kripya apna connection check karke dobara koshish karein.';
    }
    if (code === 'ERR_NETWORK' || message.includes('Network Error') || message.includes('Failed to fetch')) {
        return 'Network connection nahi mil raha. Internet check karein.';
    }

    return 'Kuch gadbad ho gayi. Dobara try karein.';
};

/**
 * Validates a file for task attachment.
 * Returns { valid: boolean, error?: string }
 */
export const validateAttachmentFile = (file, currentCount, maxFiles = MAX_FILES, maxSizeBytes = MAX_FILE_SIZE_BYTES, allowedExts = ALLOWED_EXTS) => {
    if (!file || !file.name) {
        return { valid: false, error: 'File invalid hai.' };
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowedExts.has(ext)) {
        return { valid: false, error: `File type .${ext} allowed nahi hai.` };
    }
    if (file.size > maxSizeBytes) {
        return { valid: false, error: `File "${file.name}" 20MB se badi hai.` };
    }
    if (currentCount >= maxFiles) {
        return { valid: false, error: `Sirf maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} attach kar sakte hain.` };
    }
    return { valid: true };
};

/**
 * Pure helper to build form data payload entries for task creation.
 * Can be tested in Node.js unit tests without browser DOM.
 */
export const buildTaskFormDataEntries = ({
    payload,
    files = [],
    voiceNoteBlob = null,
}) => {
    const entries = [];
    if (!payload) return entries;

    if (payload.fields) {
        Object.entries(payload.fields).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                if (k === 'assignedUsers') {
                    const list = Array.isArray(v)
                        ? v
                        : (typeof v === 'string' && v.startsWith('[') ? JSON.parse(v) : (v ? [v] : []));
                    list.forEach(userId => entries.push(['assignedUsers', String(userId)]));
                    return;
                }
                entries.push([k, typeof v === 'string' ? v : JSON.stringify(v)]);
            }
        });
    }

    const fileField = payload.fileField || 'files';
    const maxFiles = payload.maxFiles || MAX_FILES;
    const filesToUpload = Array.isArray(files) ? files.slice(0, maxFiles) : [];

    if (fileField === 'pdfFile') {
        if (filesToUpload.length > 0) {
            const file = filesToUpload[0];
            const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')) : '.pdf';
            const safeTaskTitle = sanitizeDocName(payload.fields?.title || 'Task', 'Task');
            const customFileName = `${safeTaskTitle}_Document${(ext || '.pdf').toLowerCase()}`;
            entries.push(['pdfFile', file, customFileName]);
        }
    } else {
        filesToUpload.forEach((file) => {
            entries.push([fileField, file]);
        });
    }

    if (voiceNoteBlob && fileField !== 'pdfFile') {
        entries.push(['voiceNote', voiceNoteBlob, `voice_note_${Date.now()}.webm`]);
    }

    return entries;
};

/**
 * Checks STT upload cap (default 12 per session)
 */
export const checkSttUploadCap = (count, maxCap = 12) => {
    return {
        isCapped: count >= maxCap,
        remaining: Math.max(0, maxCap - count),
    };
};

/**
 * Formats text for text-to-speech pronunciation:
 * Replaces "CIIS AI" / "CIIS" with phonetic "C I I S A I" / "C I I S" so TTS spells the letters
 * instead of mispronouncing it.
 */
export const formatSpokenForTTS = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/\bCIIS\s*AI\b/gi, 'C I I S A I')
        .replace(/\bCIIS\b/gi, 'C I I S')
        .replace(/\bAstra\b/gi, 'C I I S A I')
        .replace(/प्राथमिकता/g, 'Priority')
        .replace(/प्रायोरिटी/g, 'Priority');
};

/**
 * Returns role-aware static greeting text.
 */
export const getRoleAwareGreeting = (user) => {
    const role = String(user?.companyRole || user?.role || user?.userRole || '').toLowerCase();
    const isPrivileged = ['owner', 'admin', 'super_admin', 'super-admin', 'manager', 'hr'].includes(role);

    return isPrivileged
        ? `Namaste! Main CIIS AI Assistant hoon.

Task create karne ke liye mujhe ye jaankari chahiye:
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
        : `Namaste! Main CIIS AI Assistant hoon.

Task create karne ke liye mujhe ye jaankari chahiye:
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
};
