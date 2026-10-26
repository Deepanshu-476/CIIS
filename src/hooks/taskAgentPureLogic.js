/**
 * Pure decision and helper logic for Task Agent.
 * ZERO browser dependencies (safe for unit testing in Node.js).
 */

export const MAX_FILES = 10;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mp3', 'wav', 'avi', 'mkv', 'webm']);

export const candidateId = (c) => c?.id || c?._id || c?.userId || c?.assigneeId || '';

export const isRefusalOrEditIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /(?:^|\P{L})(?:nahi|no|abhi\s*nahi|ruko|wait|cancel|rehne\s*do|chhod|rok\s*do|nahi\s*chahiye|change|changes|badal|badalna|edit|गलत|नहीं|मत|रुको|मत\s*करो|बदलो)(?:\P{L}|$)/iu.test(text);
};

export const hasFieldChangeIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    return (
        /\b\d{1,2}[:.]\d{1,2}\b/i.test(text) ||
        /\b([1-9]|1[0-2])\s+[0-5]\d\b/i.test(text) ||
        /(?:title|naam|नाम|description|विवरण|डिस्क्रिप्शन|priority|प्रायोरिटी|status|स्टेटस|due|kal|कल|aaj|आज|tomorrow|today|baje|बजे|baaj|baj|bach|बज|time|samay|समय|date|tareekh|tarikh|तारीख|minute|min|मिनट|घंटा|hour|p\.?m\.?|a\.?m\.?|pm|am|subah|shaam|sham|dopahar|raat|reminder|रिमाइंडर|checkpoints|चेकपॉइंट|assign|photo|file|low|high|medium|pending|in-progress|completed|chay|pchas|saadhe|sadhe|saade|sade|साढ़े|tees|तीस|pandrah|पंद्रह|pachaas|पचास)/iu.test(text)
    );
};

export const isConfirmationIntent = (text) => {
    if (!text || typeof text !== 'string') return false;
    if (isRefusalOrEditIntent(text)) return false;
    if (hasFieldChangeIntent(text)) return false;

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

/**
 * Rule: Accept confirm ONLY when in ready/confirming state AND not currently creating (single-flight lock).
 */
export const canAcceptConfirm = (status, isCreatingLock = false) => {
    if (isCreatingLock) return false;
    return status === 'ready' || status === 'confirming';
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
        return { valid: false, error: `Sirf maximum ${maxFiles} files attach kar sakte hain.` };
    }
    return { valid: true };
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
