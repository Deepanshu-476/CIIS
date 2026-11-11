/**
 * Pure decision and helper logic for Task Agent.
 * ZERO browser dependencies (safe for unit testing in Node.js).
 */

export const MAX_FILES = 10;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mp3', 'wav', 'avi', 'mkv', 'webm']);

/**
 * Collapses duplicate repeated sentences or utterances back-to-back:
 * e.g. "Simran, Gabya, Gaurav, Vanch, Arav.  Simran, Gabya, Gaurav, Vanch, Arav." -> "Simran, Gabya, Gaurav, Vanch, Arav."
 */
export const collapseRepeatedUtterance = (text) => {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (!trimmed) return trimmed;

    // 1. Direct split by sentence delimiters like ". ", ".\n", "? ", "! "
    const sentenceSplit = trimmed.split(/(?<=[.!?])\s+/);
    if (sentenceSplit.length >= 2) {
        const first = sentenceSplit[0].trim().replace(/[.!?]+$/, '').toLowerCase();
        const allIdentical = sentenceSplit.every(s => s.trim().replace(/[.!?]+$/, '').toLowerCase() === first);
        if (allIdentical) {
            return sentenceSplit[0].trim();
        }
    }

    // 2. Exact repeated halves: "X X" or "X, X" or "X. X"
    const halfLen = Math.floor(trimmed.length / 2);
    for (let offset = -5; offset <= 5; offset += 1) {
        const mid = halfLen + offset;
        if (mid > 3 && mid < trimmed.length - 3) {
            const part1 = trimmed.slice(0, mid).trim().replace(/[,;.!?]+$/, '').trim();
            const part2 = trimmed.slice(mid).trim().replace(/^[,;.!?]+/, '').trim().replace(/[,;.!?]+$/, '').trim();
            if (part1 && part1.toLowerCase() === part2.toLowerCase()) {
                return part1;
            }
        }
    }

    // 3. Repeated clauses separated by comma or semicolon
    const clauses = trimmed.split(/\s*[,;]\s*/);
    if (clauses.length === 2 && clauses[0].trim().toLowerCase() === clauses[1].trim().toLowerCase()) {
        return clauses[0].trim();
    }

    return trimmed;
};

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

export const NON_CONFIRMING_TOKENS = new Set([
    'to', 'toh', 'na', 'ko', 'ho', 'hm', 'oh', 'so', 'go', 'bhi', 'aur', 'kya', 'ab',
    'kuch', 'nahi', 'kisko', 'kab', 'kyun', 'kaha', 'kahan', 'kis'
]);

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

    // eslint-disable-next-line no-misleading-character-class
    let clean = text.toLowerCase().replace(/[^a-zA-Z\u0900-\u097F\s]/gu, ' ').replace(/\s+/g, ' ').trim();

    // Strict rejection for non-confirming filler tokens (e.g., "to", "toh", "na", "ko", "ho", "hm", "oh", "so", "go", "bhi", "aur", "kya", "ab")
    if (NON_CONFIRMING_TOKENS.has(clean)) return false;
    if (words.length === 1 && NON_CONFIRMING_TOKENS.has(words[0].toLowerCase())) return false;
    if (words.every(w => NON_CONFIRMING_TOKENS.has(w.toLowerCase()))) return false;

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
        if (target.length <= 3) continue;
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
                const maxWordDist = targetWords[i].length <= 3 ? 0 : 2;
                const d = levenshtein(words[i], targetWords[i]);
                if (d > maxWordDist) { ok = false; break; }
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
    const isCreatingClientPlan = intent === 'create_client_plan' || (fallbackPayload?.endpoint === '/api/client-plans') || (fallbackPayload?.endpoint === '/client-plans');
    const isCreatingClient = intent === 'create_client' || (fallbackPayload?.endpoint === '/clientsservice');
    const isCreatingProject = intent === 'create_project' || (fallbackPayload?.endpoint === '/projects');
    const isProject = intent === 'task_project' || Boolean(draft.projectId);
    const isAssigned = intent === 'task_assigned_user' || (draft.taskFor === 'others' && draft.assigneeId);

    if (isCreatingClientPlan) {
        const rawServices = fallbackPayload?.fields?.services || (Array.isArray(draft.services) ? draft.services : []);
        return {
            endpoint: '/client-plans',
            method: 'POST',
            multipart: false,
            fields: {
                name: String(draft.name || fallbackPayload?.fields?.name || '').trim(),
                price: Number(draft.price ?? fallbackPayload?.fields?.price ?? 0),
                months: Number(draft.months ?? fallbackPayload?.fields?.months ?? 1),
                status: draft.status || fallbackPayload?.fields?.status || 'Active',
                description: String(draft.description || fallbackPayload?.fields?.description || '').trim(),
                services: rawServices.map(item => {
                    const sName = typeof item === 'string' ? item.trim() : String(item.service || item.name || '').trim();
                    const sTasks = Array.isArray(item.tasks) && item.tasks.length > 0
                        ? item.tasks
                        : (draft.serviceTasks && Array.isArray(draft.serviceTasks[sName]) ? draft.serviceTasks[sName] : []);
                    return {
                        service: sName,
                        tasks: sTasks.map(t => ({
                            name: String(t.name || t.title || '').trim(),
                            description: String(t.description || '').trim(),
                            priority: ['Low', 'Medium', 'High'].includes(t.priority) ? t.priority : 'Medium',
                            dueInDays: Number(t.dueInDays || 30),
                        })).filter(t => t.name)
                    };
                }).filter(s => s && s.service),
                isActive: draft.status === 'Inactive' ? false : true,
            }
        };
    }

    if (isCreatingClient) {
        let pmNames = [];
        if (Array.isArray(draft.projectManager) && draft.projectManager.length > 0) {
            pmNames = draft.projectManager.map(m => (typeof m === 'object' ? (m.name || m.label || '') : String(m))).filter(Boolean);
        } else if (Array.isArray(draft.team) && draft.team.length > 0) {
            pmNames = draft.team.map(m => (typeof m === 'object' ? (m.name || m.label || '') : String(m))).filter(Boolean);
        } else if (Array.isArray(draft.members) && draft.members.length > 0) {
            pmNames = draft.members.map(m => (typeof m === 'object' ? (m.name || m.label || '') : String(m))).filter(Boolean);
        } else if (Array.isArray(fallbackPayload?.fields?.projectManager)) {
            pmNames = fallbackPayload.fields.projectManager;
        }

        const servicesList = (Array.isArray(draft.services) && draft.services.length > 0)
            ? draft.services
            : (Array.isArray(fallbackPayload?.fields?.services) ? fallbackPayload.fields.services : []);

        let subscriptionArray = [];
        const planMonths = draft.clientPlanMonths || 1;
        if (draft.clientPlanId && draft.subscriptionStartDate) {
            subscriptionArray = [{
                startDate: draft.subscriptionStartDate,
                endDate: draft.subscriptionEndDate || '',
                price: Number(draft.clientPlanPrice || 0),
                status: 'Active',
                months: planMonths
            }];
        } else if (Array.isArray(draft.subscription) && draft.subscription.length > 0) {
            subscriptionArray = draft.subscription;
        } else if (Array.isArray(fallbackPayload?.fields?.subscription)) {
            subscriptionArray = fallbackPayload.fields.subscription;
        }

        const fields = {
            client: draft.client || draft.clientName || fallbackPayload?.fields?.client || '',
            parentClientId: draft.parentClientId || fallbackPayload?.fields?.parentClientId || null,
            parentClientName: draft.parentClientName || draft.client || draft.clientName || fallbackPayload?.fields?.parentClientName || '',
            company: draft.company || draft.companyName || fallbackPayload?.fields?.company || '',
            city: draft.city || fallbackPayload?.fields?.city || '',
            projectManager: pmNames,
            services: servicesList,
            status: draft.status || fallbackPayload?.fields?.status || 'Active',
            progress: draft.progress || fallbackPayload?.fields?.progress || '0/0 (0%)',
            email: draft.email || fallbackPayload?.fields?.email || '',
            phone: draft.phone ? String(draft.phone).replace(/\D/g, '').slice(-10) : (fallbackPayload?.fields?.phone || ''),
            companyLogo: draft.companyLogo || fallbackPayload?.fields?.companyLogo || '',
            industry: draft.industry || fallbackPayload?.fields?.industry || '',
            gst: draft.gst ? String(draft.gst).trim().toUpperCase() : (fallbackPayload?.fields?.gst || ''),
            pan: draft.pan ? String(draft.pan).trim().toUpperCase() : (fallbackPayload?.fields?.pan || ''),
            website: draft.website || fallbackPayload?.fields?.website || '',
            state: draft.state || fallbackPayload?.fields?.state || '',
            country: draft.country || fallbackPayload?.fields?.country || 'India',
            pincode: draft.pincode || fallbackPayload?.fields?.pincode || '',
            address: draft.address || fallbackPayload?.fields?.address || '',
            description: draft.description || fallbackPayload?.fields?.description || '',
            notes: draft.notes || fallbackPayload?.fields?.notes || '',
            companyCode: fallbackPayload?.fields?.companyCode || '',
            clientPlanId: draft.clientPlanId || fallbackPayload?.fields?.clientPlanId || '',
            subscription: subscriptionArray,
            ...(fallbackPayload?.fields?.branch ? { branch: fallbackPayload.fields.branch } : {}),
            ...(fallbackPayload?.fields?.branchId ? { branchId: fallbackPayload.fields.branchId } : {}),
        };

        return {
            endpoint: '/clientsservice',
            method: 'POST',
            multipart: false,
            fields,
            body: fields,
        };
    }

    if (isCreatingProject) {
        let memberIds = [];
        if (Array.isArray(draft.members) && draft.members.length > 0) {
            memberIds = draft.members.map(m => String(m.id || m._id || m));
        }
        if (Array.isArray(draft.assignedUsers) && draft.assignedUsers.length > 0) {
            memberIds = [...new Set([...memberIds, ...draft.assignedUsers.map(String)])];
        }
        if (fallbackPayload?.fields?.users) {
            try {
                const parsed = JSON.parse(fallbackPayload.fields.users);
                if (Array.isArray(parsed)) {
                    memberIds = [...new Set([...memberIds, ...parsed.map(String)])];
                }
            } catch {
                // ignore parse failure
            }
        }
        return {
            endpoint: '/projects',
            method: 'POST',
            multipart: true,
            fileField: 'pdfFile',
            maxFiles: 1,
            accept: ['.pdf'],
            fields: {
                projectName: draft.name || draft.projectName || fallbackPayload?.fields?.projectName || '',
                description: draft.description || fallbackPayload?.fields?.description || '',
                startDate: draft.startDate || fallbackPayload?.fields?.startDate || '',
                endDate: draft.endDate || fallbackPayload?.fields?.endDate || '',
                priority: draft.priority ? (draft.priority.charAt(0).toUpperCase() + draft.priority.slice(1).toLowerCase()) : (fallbackPayload?.fields?.priority || 'Medium'),
                status: draft.status || fallbackPayload?.fields?.status || 'Active',
                users: JSON.stringify(memberIds),
                companyCode: fallbackPayload?.fields?.companyCode || '',
                ...(fallbackPayload?.fields?.branchId ? { branchId: fallbackPayload.fields.branchId, branch: fallbackPayload.fields.branch } : {}),
                ...(fallbackPayload?.fields?.companyIdentifier ? { companyIdentifier: fallbackPayload.fields.companyIdentifier, companyId: fallbackPayload.fields.companyId } : {}),
            },
        };
    }

    const isClientTask = draft.intent === 'create_client_task' || fallbackPayload?.entity === 'client_task' || fallbackPayload?.endpoint?.includes('/tasks/client-tasks');
    if (isClientTask) {
        const clientId = draft.clientId || fallbackPayload?.clientId || '';
        const service = draft.service || fallbackPayload?.service || '';
        const encodedService = encodeURIComponent(service);
        return {
            endpoint: `/tasks/client-tasks/client/${clientId}/service/${encodedService}`,
            method: 'POST',
            multipart: false,
            fields: {
                name: String(draft.title || draft.name || fallbackPayload?.fields?.name || '').trim(),
                description: String(draft.description || fallbackPayload?.fields?.description || '').trim(),
                dueDate: draft.dueDate || (draft.dueDateTime ? draft.dueDateTime.split('T')[0] : (fallbackPayload?.fields?.dueDate || null)),
                dueDateTime: draft.dueDateTime || fallbackPayload?.fields?.dueDateTime || null,
                assignee: draft.assignee || draft.assigneeName || fallbackPayload?.fields?.assignee || '',
                assigneeId: draft.assigneeId || fallbackPayload?.fields?.assigneeId || null,
                priority: draft.priority || fallbackPayload?.fields?.priority || 'Medium',
            }
        };
    }

    if (isProject) {
        const projectId = draft.projectId ? String(draft.projectId) : '';
        const rawStatus = String(draft.status || 'pending').toLowerCase();
        const normStatus = rawStatus.replace(/[-_]/g, ' ');
        const finalStatus = (normStatus === 'in progress' || normStatus === 'inprogress') ? 'in progress' : rawStatus;

        const assignedUsers = (Array.isArray(draft.assignedUsers) && draft.assignedUsers.length > 0)
            ? draft.assignedUsers.map(String)
            : ((Array.isArray(draft.assignees) && draft.assignees.length > 0)
                ? draft.assignees.map(a => String(a.id || a._id))
                : (draft.assigneeId ? [String(draft.assigneeId)] : []));
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
                assignedTo: assignedUsers[0] || (draft.assigneeId ? String(draft.assigneeId) : ''),
                priority: draft.priority ? (draft.priority.charAt(0).toUpperCase() + draft.priority.slice(1).toLowerCase()) : 'Medium',
                status: finalStatus,
                checkpoints: JSON.stringify(checkpoints),
                reminderSettings: JSON.stringify(reminderSettings),
                dueDate: rawDue,
            },
        };
    }

    if (isAssigned) {
        const userIds = Array.isArray(draft.assignedUsers) && draft.assignedUsers.length > 0
            ? draft.assignedUsers.map(String)
            : (Array.isArray(draft.assignees) && draft.assignees.length > 0
                ? draft.assignees.map(a => String(a.id || a._id))
                : (draft.assigneeId ? [String(draft.assigneeId)] : []));

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
                assignedUsers: JSON.stringify(userIds),
                assigneeId: draft.assigneeId ? String(draft.assigneeId) : (userIds[0] || ''),
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
export const shouldAutoListenAfterTurn = ({ status, userMuted = false, isCreated = false, isTyping = false } = {}) => {
    if (userMuted || isTyping) return false;
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
export const createTtsWatchdog = (onFinish, textLength = 0, maxTimeoutMs = 30000) => {
    let triggered = false;
    let lastProgressTime = 0;
    const startTime = Date.now();
    const calculated = Math.max(50, textLength * 70 + 2000);
    const estimatedMs = Math.min(maxTimeoutMs, calculated);

    let timer = null;
    const trigger = () => {
        if (triggered) return;
        const timeSinceBoundary = Date.now() - lastProgressTime;
        // If boundary events are actively firing within the last 3s, speech is progressing: wait!
        if (lastProgressTime > 0 && timeSinceBoundary < 3000) {
            timer = setTimeout(trigger, 500);
        } else {
            triggered = true;
            onFinish();
        }
    };

    timer = setTimeout(trigger, estimatedMs);

    return {
        recordProgress: () => {
            lastProgressTime = Date.now();
        },
        cancel: () => {
            triggered = true;
            if (timer) clearTimeout(timer);
        },
        triggerNow: () => {
            if (!triggered) {
                triggered = true;
                if (timer) clearTimeout(timer);
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

    // Detailed validation errors take priority over generic "Validation failed"
    if (err?.response?.data?.details && Array.isArray(err.response.data.details) && err.response.data.details.length > 0) {
        const detailMsgs = err.response.data.details.map(d => `${d.field ? d.field + ': ' : ''}${d.message}`).join(', ');
        return `Validation failed (${detailMsgs})`;
    }

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
                    if (Array.isArray(v)) {
                        // Repeated FormData entries (e.g. POST /projects/:id/tasks contract in ProjectDetailsPage.jsx)
                        v.forEach(userId => entries.push(['assignedUsers', String(userId)]));
                    } else if (typeof v === 'string') {
                        // Single FormData entry with JSON string (e.g. POST /task/create-for-others contract in AdminTaskCreate.jsx)
                        entries.push(['assignedUsers', v]);
                    }
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
            const safeTitle = sanitizeDocName(payload.fields?.projectName || payload.fields?.title || 'Project', 'Project');
            const customFileName = `${safeTitle}_Document${(ext || '.pdf').toLowerCase()}`;
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
        .replace(/विवरण/gu, 'Description')
        .replace(/डिस्क्रिप्शन/gu, 'Description')
        .replace(/प्राथमिकता/gu, 'Priority')
        .replace(/प्रायोरिटी/gu, 'Priority');
};

export const WELCOME_GREETING_TEXT = 'Namaste! Main CIIS AI Assistant hoon. Aap kya karna chahte hain?';
export const WELCOME_GREETING_HINDI = 'नमस्ते! मैं सी आई आई एस ए आई असिस्टेंट हूँ। आप क्या करना चाहते हैं?';

export const WELCOME_MENU_BUTTONS = [
    { label: 'Personal task banana', action: { type: 'set_intent', intent: 'self_task' } },
    { label: 'Kisi ko task assign karna', action: { type: 'set_intent', intent: 'task_assigned_user' } },
    { label: 'Naya project banana', action: { type: 'set_intent', intent: 'create_project' } },
    { label: 'Project mein task banana/assign karna', action: { type: 'set_intent', intent: 'task_project' } },
    { label: 'Naya client add karna', action: { type: 'set_intent', intent: 'create_client' } },
    { label: 'Client plan banana', action: { type: 'set_intent', intent: 'create_client_plan' } },
];

export const WELCOME_MENU_BUTTONS_EN = [
    { label: 'Create personal task', action: { type: 'set_intent', intent: 'self_task' } },
    { label: 'Assign task to someone', action: { type: 'set_intent', intent: 'task_assigned_user' } },
    { label: 'Create new project', action: { type: 'set_intent', intent: 'create_project' } },
    { label: 'Create task in project', action: { type: 'set_intent', intent: 'task_project' } },
    { label: 'Add new client', action: { type: 'set_intent', intent: 'create_client' } },
    { label: 'Create client plan', action: { type: 'set_intent', intent: 'create_client_plan' } },
];

export const getTimeBasedSalutation = (now = new Date()) => {
    const hours = now.getHours();
    if (hours < 12) return { en: 'Good morning', hi: 'गुड मॉर्निंग' };
    if (hours < 17) return { en: 'Good afternoon', hi: 'गुड आफ्टरनून' };
    return { en: 'Good evening', hi: 'गुड इवनिंग' };
};

export const getUserFirstName = (user) => {
    const rawName = String(user?.name || user?.userName || '').trim();
    if (!rawName) return '';
    return rawName.split(/\s+/)[0];
};

/**
 * Returns role & time-aware greeting text.
 * When lang === 'en', greets in pure English: "Good morning Kanika! What would you like to do today?"
 * When lang === 'hinglish', greets "Good morning Kanika! Aap aaj kya karna chahte hain?"
 */
export const getRoleAwareGreeting = (user = null, now = new Date(), lang = 'hinglish') => {
    const firstName = getUserFirstName(user);
    const salutation = getTimeBasedSalutation(now);
    if (!firstName) {
        return lang === 'en'
            ? `${salutation.en}! I am your CIIS AI Assistant. What would you like to do today?`
            : WELCOME_GREETING_TEXT;
    }
    const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    if (lang === 'en') {
        return `${salutation.en} ${capitalized}! What would you like to do today?`;
    }
    return `${salutation.en} ${capitalized}! Aap aaj kya karna chahte hain?`;
};

export const getRoleAwareGreetingHindi = (user = null, now = new Date()) => {
    const firstName = getUserFirstName(user);
    if (!firstName) {
        return WELCOME_GREETING_HINDI;
    }
    const salutation = getTimeBasedSalutation(now);
    const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    return `${salutation.hi} ${capitalized}! आप आज क्या करना चाहते हैं?`;
};

export const isPrivilegedRoleUser = (user) => {
    if (!user) return false;
    const roleValues = [user.companyRole, user.role, user.jobRole, user.jobRoleName]
        .filter(Boolean)
        .map(r => String(typeof r === 'object' ? r.name || r.role || '' : r).trim().toLowerCase().replace(/[\s-]+/g, '_'));

    const PRIVILEGED_ROLES = new Set([
        'owner',
        'company_owner',
        'companyowner',
        'admin',
        'super_admin',
        'superadmin'
    ]);

    return roleValues.some(r => PRIVILEGED_ROLES.has(r)) || Boolean(user.isSuperAdmin || user.isPlatformOwner);
};

export const filterWelcomeButtonsByPermissions = (user, { sidebarConfig, pagePermissions, language = 'hinglish', allowAll = false } = {}) => {
    const baseButtons = language === 'en' ? WELCOME_MENU_BUTTONS_EN : WELCOME_MENU_BUTTONS;
    if (allowAll || !user || isPrivilegedRoleUser(user)) {
        return baseButtons;
    }

    const rawMenuItems = Array.isArray(sidebarConfig?.menuItems)
        ? sidebarConfig.menuItems
        : (Array.isArray(sidebarConfig?.data?.menuItems) ? sidebarConfig.data.menuItems : []);
    const ranges = Array.isArray(sidebarConfig?.ranges)
        ? sidebarConfig.ranges
        : (Array.isArray(sidebarConfig?.data?.ranges) ? sidebarConfig.data.ranges : []);
    const rangeItems = ranges.flatMap(r => Array.isArray(r?.items) ? r.items : []);

    const extractItems = (items) => {
        const result = [];
        (items || []).forEach(item => {
            if (!item) return;
            result.push(item);
            if (Array.isArray(item.children)) result.push(...extractItems(item.children));
            if (Array.isArray(item.subItems)) result.push(...extractItems(item.subItems));
            if (Array.isArray(item.subMenu)) result.push(...extractItems(item.subMenu));
            if (Array.isArray(item.items)) result.push(...extractItems(item.items));
        });
        return result;
    };
    const allConfigItems = extractItems([...rawMenuItems, ...rangeItems]);

    const menuSlugs = new Set();
    allConfigItems.forEach(item => {
        if (typeof item === 'object' && item !== null) {
            [item.path, item.id, item.key, item.name].filter(Boolean).forEach(val => {
                menuSlugs.add(
                    String(val).toLowerCase().replace(/^\/+/, '').replace(/^ciisuser\//, '').replace(/[\s_-]+/g, '')
                );
            });
        } else if (item) {
            menuSlugs.add(
                String(item).toLowerCase().replace(/^\/+/, '').replace(/^ciisuser\//, '').replace(/[\s_-]+/g, '')
            );
        }
    });

    const userPerms = [
        ...(Array.isArray(user.allowedPages) ? user.allowedPages : []),
        ...(Array.isArray(user.pagePermissions) ? user.pagePermissions : []),
        ...(Array.isArray(user.permissions) ? user.permissions : []),
        ...(Array.isArray(pagePermissions) ? pagePermissions : [])
    ];
    const permSlugs = new Set();
    userPerms.forEach(p => {
        if (typeof p === 'object' && p !== null) {
            [p.page, p.name, p.path, p.id, p.key].filter(Boolean).forEach(val => {
                permSlugs.add(
                    String(val).toLowerCase().replace(/^\/+/, '').replace(/^ciisuser\//, '').replace(/[\s_-]+/g, '')
                );
            });
        } else if (p) {
            permSlugs.add(
                String(p).toLowerCase().replace(/^\/+/, '').replace(/^ciisuser\//, '').replace(/[\s_-]+/g, '')
            );
        }
    });

    const hasSlug = (...keys) => keys.some(k => menuSlugs.has(k) || permSlugs.has(k));

    const allowed = new Set(['self_task']); // Personal task is always allowed for all employees

    // Assigning tasks to others requires "Admin Create Task" permission (not general Task Management)
    const hasAdminTaskCreateMenu = menuSlugs.has('admintaskcreate') || menuSlugs.has('admin-task-create') || menuSlugs.has('admincreatetask') || menuSlugs.has('admin-create-task');
    const hasAdminTaskCreatePerm = permSlugs.has('admintaskcreate') || permSlugs.has('admin-task-create') || permSlugs.has('admincreatetask') || permSlugs.has('admin-create-task');
    if (allConfigItems.length > 0) {
        if (hasAdminTaskCreateMenu) {
            allowed.add('task_assigned_user');
        }
    } else if (hasAdminTaskCreatePerm) {
        allowed.add('task_assigned_user');
    }
    // Creating projects requires administrative project permission
    if (hasSlug('adminproject', 'manageprojects', 'admin-project', 'createproject')) {
        allowed.add('create_project');
    }
    // Creating tasks in projects is allowed for anyone with My Projects / Project view or admin project access
    const hasProjectView = hasSlug('adminproject', 'manageprojects', 'admin-project', 'projects', 'project', 'myprojects', 'my-projects') ||
        Boolean(user.hasProjects) ||
        (typeof window !== 'undefined' && (
            window.location?.pathname?.includes('/project') ||
            window.location?.pathname?.includes('/my-projects') ||
            Boolean(document?.querySelector?.('a[href*="/project"], a[href*="my-projects"], [data-page="project"]'))
        ));
    if (hasProjectView) {
        allowed.add('task_project');
    }
    const hasClientMenu = menuSlugs.has('empclient') || menuSlugs.has('clientmanagement') || menuSlugs.has('emp-client') || menuSlugs.has('activeclients') || menuSlugs.has('active-clients');
    const hasClientPerm = permSlugs.has('empclient') || permSlugs.has('clientmanagement') || permSlugs.has('emp-client') || permSlugs.has('activeclients') || permSlugs.has('active-clients');
    if (allConfigItems.length > 0) {
        if (hasClientMenu) {
            allowed.add('create_client');
        }
    } else if (hasClientPerm) {
        allowed.add('create_client');
    }

    const hasPlanMenu = menuSlugs.has('clientplans') || menuSlugs.has('clientplan') || menuSlugs.has('client-plans');
    const hasPlanPerm = permSlugs.has('clientplans') || permSlugs.has('clientplan') || permSlugs.has('client-plans');
    if (allConfigItems.length > 0) {
        if (hasPlanMenu) {
            allowed.add('create_client_plan');
        }
    } else if (hasPlanPerm) {
        allowed.add('create_client_plan');
    }

    return baseButtons.filter(b => allowed.has(b.action?.intent));
};

export const detectMessageLanguage = (text, fallback = 'hinglish') => {
    if (!text || typeof text !== 'string') return fallback;
    const clean = text.trim();
    if (/[\u0900-\u097F]/.test(clean)) return 'hinglish';
    const hinglishMarker = /\b(?:aap|ap|mera|meri|mere|mujhe|hamara|hum|kya|kaun|kon|kaunsi|kab|kahan|kaise|kese|kyun|kisko|kisse|kitne|kitna|hai|hain|ho|hoon|hun|tha|thi|kar|karo|karna|kariye|banao|banayein|batao|batayein|dikhao|dikhayein|rakho|hoga|hogi|dena|dijiye|chahiye|raha|rahi|rahe|aur|ya|ke|ki|ka|ko|mein|main|liye|saath|bhi|nahi|nhi|mat|badhiya|shukriya|theek|thik|dhanyawad|kaam|kardo|karwao)\b/i;
    if (hinglishMarker.test(clean)) return 'hinglish';
    const englishWords = clean.match(/\b[a-zA-Z]{2,}\b/g) || [];
    if (englishWords.length > 0) {
        return 'en';
    }
    return fallback;
};

export const CRM_PROJECTS_QUERY_REGEX = /(?:(?:projects?|projekts?|projets?|प्रोजेक्ट्स?|प्रजेक्ट|प्रोज़ेक्ट).*(?:\?|kitne|kitna|how\s+many|kon|kaun|which|what|list|dikhao|batao|tell|show|status|hai|hain|chal\s+rahe|have|i\s+have|कितने|इतने|दिखाओ|बताओ|हैं)|(?:\?|kitne|kitna|how\s+many|kon\s+se|kaun\s+se|which|what|list|dikhao|batao|tell\s+me|tell|show|mere|apne|active|all|crm\s+ma?i|crm\s+mein|कितने|इतने|चेक|check).*(?:projects?|projekts?|projets?|प्रोजेक्ट्स?|प्रजेक्ट|प्रोज़ेक्ट))/iu;
export const CRM_CLIENTS_QUERY_REGEX = /(?:(?:clients?|cleints?|clints?|क्लाइंट्स?|क्लाइज|क्लाइन्स|क्लाइंट|क्लायंट).*(?:\?|kitne|kitna|kidney|how\s+many|kon|kaun|which|what|list|dikhao|batao|tell|show|status|hai|hain|have|i\s+have|कितने|इतने|दिखाओ|बताओ|हैं)|(?:\?|kitne|kitna|kidney|how\s+many|kon\s+se|kaun\s+se|which|what|list|dikhao|batao|tell\s+me|tell|show|mere|apne|active|all|crm\s+ma?i|crm\s+mein|कितने|इतने|चेक|check).*(?:clients?|cleints?|clints?|क्लाइंट्स?|क्लाइज|क्लाइन्स|क्लाइंट|क्लायंट))/iu;
export const CLIENT_DETAIL_QUERY_REGEX = /(?:(?:services?|सर्विस(?:िस)?|plans?|प्लाइ?न्स?|subscription|details?|जानकारी|status).*(?:di\s+gayi|दी\s+गई|assigned|diya|diye|mil[ie]|hai|hain|kya|kon|kaun|which|batao|dikhao|kaun\s+sa|kon\s+sa|कौन\s*सा|कौन\s*कौन|kisko|uska|uski|inhe|unhe))|(?:(?:kisko|kis\s+client|client|ko|ka|ki|को|का|की).*(?:services?|सर्विस(?:िस)?|plans?|प्लाइ?न्स?).*(?:di\s+gayi|दी\s+गई|assigned|diya|diye|mil[ie]|hai|hain|kya|kon|kaun|batao|dikhao|details?))|(?:(?:services?|सर्विस(?:िस)?|plans?|प्लाइ?न्स?)\s+(?:aur|and|ya|or)\s+(?:services?|सर्विस(?:िस)?|plans?|प्लाइ?न्स?))/iu;
export const CRM_TASKS_QUERY_REGEX = /(?:(?:tasks?|taks|tasak|taask|tsk|kaam|work|टास्क|काम).*(?:\?|kon|kaun|konsa|kaunsa|konsi|kaunsi|kya|which|what|list|dikhao|batao|tell|show|status|kitne|kitna|how\s+many|check|hai|hain|hia|chal\s+raha|कितने|इतने|दिखाओ|बताओ)|(?:\?|check|batao|batayein|dikhao|tell|show|kon|kaun|konsa|kaunsa|konsi|kaunsi|kya|which|what|kitne|kitna|how\s+many|abhi\s+mera|mere|apne|my|aaj\s+ke|कितने|इतने|चेक).*(?:tasks?|taks|tasak|taask|tsk|kaam|work|टास्क|काम)|(?:in[- ]progress|pending|overdue|completed).*(?:tasks?|taks|tasak|taask|tsk|kaam|work|टास्क|काम|\?|hai|hain|hia|chal\s+raha)|(?:tasks?|taks|tasak|taask|tsk|kaam|work|टास्क|काम).*(?:in[- ]progress|pending|overdue|completed)|(?:check|batao|dikhao|tell|kon\s+sa|konsa|kaun\s+sa|kaunsa|kya|चेक|बताओ|दिखाओ).*(?:in[- ]progress|pending|overdue|completed))/iu;

export const CRM_TASK_COMPLETE_REGEX = /(?:(?:task|kam)\s*(?:ko\s*)?(?:complete|done|khatam)\s*(?:mark\s*)?(?:karo|kar\s*do|kardo)?|mark\s*(?:task\s*)?(?:as\s*)?(?:complete|done)|(?:complete|done|khatam)\s*(?:mark\s*)?(?:karo|kar\s*do|kardo))/i;
export const CRM_TASK_UPDATE_REGEX = /(?:(?:priority|status)\s*(?:ko\s*)?(?:badal\s*kar\s*)?(?:high|low|medium|in[- ]progress|pending|completed?|done|on[- ]?hold)|(?:high|low|medium|in[- ]progress|pending|completed?|done|on[- ]?hold)\s*(?:priority|status|kardo|kar\s+do|rakho)|(?:priority|status)\s*(?:high|low|medium|in[- ]progress|pending|completed?|done|on[- ]?hold)|(?:task|kam)\s+(?:complete|done|khatam)\s+(?:karo|kar\s+do|mark)|mark\s+(?:task\s+)?(?:as\s+)?(?:complete|done)|(?:priority|status)\s+(?:update|change|badal)|(?:kardo|kar\s+do|update|change|badal).*?(?:priority|status))/iu;

export const isCrmTaskUpdate = (text) => {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    return CRM_TASK_COMPLETE_REGEX.test(clean) || CRM_TASK_UPDATE_REGEX.test(clean);
};

export const isCrmQuery = (text) => {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    const hasCreationCommand = /\b(?:task\s+naam|task\s+name|task\s+banao|naya\s+task|new\s+task|create\s+task|assign\s+karo|description\s+|priority\s+(?:high|medium|low|urgent)|project\s+banao|naya\s+project|new\s+project|create\s+project|client\s+add|client\s+banao|new\s+client|create\s+client)\b/i.test(clean);
    if (hasCreationCommand) return false;
    if (isCrmTaskUpdate(clean)) return false;
    return CRM_PROJECTS_QUERY_REGEX.test(clean) || CRM_CLIENTS_QUERY_REGEX.test(clean) || CRM_TASKS_QUERY_REGEX.test(clean) || CLIENT_DETAIL_QUERY_REGEX.test(clean);
};

export const isChitChatOrGreeting = (text) => {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (isCrmQuery(clean)) return false;
    const hasTaskCommand = /\b(?:task\s+banao|task\s+create|assign\s+karo|task\s+do|project\s+banao|client\s+add|client\s+banao|meeting\s+rakh)\b/i.test(clean);
    if (hasTaskCommand) return false;
    const rxList = [
        /^(?:gud|good)?\s*(?:morning|afternoon|evening|night)\b/i,
        /^(?:hi+|he+y+|hello+|namaste+|namaskar+|pranam+|salaam+|wassup|sup)\b/i,
        /\b(?:how\s+(?:are|r)\s+u|how\s+are\s+you|how\s+is\s+it\s+going|how's\s+it\s+going|how\s+do\s+you\s+do)\b/i,
        /\b(?:kaise\s+ho|kya\s+haal\s+hai|kaisa\s+hai|sab\s+theek\s+hai|sab\s+kaisa\s+hai)\b/i,
        /\b(?:who\s+are\s+you|tum\s+kaun\s+ho|aap\s+kaun\s+hai[n]?|tumhara\s+naam\s+kya\s+hai|aapka\s+naam\s+kya\s+hai)\b/i,
        /\b(?:what\s+can\s+you\s+do|tum\s+kya\s+kar\s+sakte\s+ho|aap\s+kya\s+kar\s+sakte\s+hai[n]?|kya\s+kya\s+kar\s+sakte\s+ho|help|madad|features|commands)\b/i,
        /\b(?:thanks?|thank\s+you|thanku|dhanyawad|shukriya|so\s+nice|bahut\s+achha|bahut\s+khoob|nice|great|awesome|badhiya)\b/i,
        /\b(?:bye|goodbye|alvida|see\s+you|tata|chalta\s+hoon|phir\s+milenge)\b/i,
        /\b(?:mood|bhuut\s+kush|bohot\s+khush|kush\s+hu|khush\s+hu|bhuut\s+asha|bahut\s+achha|feeling\s+happy|feeling\s+good|feeling\s+great|feeling)\b/i,
        /\b(?:tired|so\s+tired|fell\s+tired|feel\s+tired|feeling\s+tired|exhausted|sleepy|lazy|bored|boring|stressed|tension|thak\s+gaya|thak\s+gayi|thakan|neend|sad|upset|low)\b/i,
    ];
    return rxList.some(rx => rx.test(clean));
};

export const isOutOfScopeQuery = (text) => {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    const hasCrmContext = /(?:task|taks|project|projek|client|cleint|service|priority|status|assign|lead|company|crm|meeting|deadline|due|banao|kardo|update|edit|add)/i.test(clean);
    if (hasCrmContext) return false;
    const outOfScopeRegex = /(?:(?:\b(?:fever|bukhar|bimar|medicine|dawai|tablet|headache|sir\s+dard|pet\s+dard|doctor|treatment|cure|hospital|bimari)\b)|(?:\b(?:capital\s+of|prime\s+minister|pm\s+of|who\s+is\s+the\s+pm|president|chief\s+minister|pradhan\s+mantri|current\s+weather|aaj\s+ka\s+mausam|temperature|cricket|ipl|who\s+won|movie|film|song|gana|recipe|khana\s+kaise|tea|coffee|chai|how\s+to\s+make|chutkula|tell\s+me\s+a\s+joke)\b)|(?:\b(?:write\s+(?:a\s+)?python|write\s+(?:a\s+)?code|write\s+(?:a\s+)?script|fibonacci|solve\s+math|quantum|stock\s+market|crypto|bitcoin|horoscope|rashifal)\b))/i;
    const isGeneralKnowledgeQuestion = /^(?:tell\s+me|who\s+is|who\s+was|who\s+are|what\s+is|what\s+are|what\s+was|how\s+to|how\s+do|where\s+is|why\s+is|why\s+do|when\s+did|which\s+is|can\s+you\s+(?:tell|explain|cook|sing|dance|write|solve|make|teach))\b/i.test(clean) || /(?:kaise\s+(?:banayein|banta|banti|banaye|karein)|kaun\s+hai|kya\s+hai|kahan\s+hai)\b/i.test(clean);
    return outOfScopeRegex.test(clean) || isGeneralKnowledgeQuestion;
};

/**
 * Helper to determine whether the diagnostic debug overlay should render.
 * Item 4: Show only when URL has ?aidebug=1 or localStorage.getItem('ciis_ai_debug') === '1'.
 */
export const shouldShowDebugOverlay = () => {
    try {
        if (typeof window !== 'undefined') {
            const search = window.location?.search || '';
            if (new URLSearchParams(search).get('aidebug') === '1') {
                return true;
            }
            if (window.localStorage?.getItem('ciis_ai_debug') === '1') {
                return true;
            }
        }
    } catch {
        // Safe fallback in non-browser or sandbox environments
    }
    return false;
};

/**
 * Strips markdown, emojis, bullet points, chip labels, debug "Kya samjha" lines,
 * and caps long messages to 1-2 sentences (at most ~200 characters) for natural TTS output.
 */
export const cleanForSpeech = (raw, maxLen = 220) => {
    if (!raw || typeof raw !== 'string') return '';
    let text = raw;

    // 1. Strip debug / recap lines like "Kya samjha: ..." or "क्या समझा: ..."
    text = text.replace(/(?:^|\n)\s*(?:Kya samjha|क्या समझा):[^\n]*/gi, '');

    // 2. Strip bullet markers (e.g. "• ", "- ", "* ", "1. ", "1) ")
    text = text.replace(/^\s*(?:[•\-*]|\d+[.)])\s+/gm, '');

    // 3. Strip markdown syntax: bold, italic, code blocks, links, headers
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    text = text.replace(/\[([^\]]+)\]/g, '$1');
    text = text.replace(/^#+\s+/gm, '');

    // 4. Strip emojis
    text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');

    // 5. Strip parenthetical chip / default hints: e.g. "(default 1)", "(default 18:00)"
    text = text.replace(/\(default\s+[^)]+\)/gi, '');

    // 6. Collapse multiple spaces and newlines
    text = text.replace(/\s+/g, ' ').trim();

    // 7. Cap length for speech: cut ONLY at a sentence boundary if extraordinarily long
    if (text.length > maxLen) {
        const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g);
        if (sentences && sentences.length > 0) {
            let accum = '';
            for (const s of sentences) {
                if ((accum + s).trim().length <= maxLen) {
                    accum += s;
                } else {
                    break;
                }
            }
            if (accum.trim()) {
                text = accum.trim();
            } else {
                const firstSentence = sentences[0];
                const lastSpace = firstSentence.lastIndexOf(' ', maxLen);
                if (lastSpace > 80) {
                    text = firstSentence.slice(0, lastSpace).trim();
                } else {
                    text = firstSentence.trim();
                }
            }
        }
    }

    return text;
};

/**
 * Resolves spoken text for TTS prioritizing speakText, then speech, then cleaned bubble reply.
 */
export const resolveSpokenText = (data, fallbackBubbleText = '') => {
    if (data?.speakText && typeof data.speakText === 'string' && data.speakText.trim()) {
        return cleanForSpeech(data.speakText);
    }
    if (data?.speechText && typeof data.speechText === 'string' && data.speechText.trim()) {
        return cleanForSpeech(data.speechText);
    }
    if (data?.speech && typeof data.speech === 'string' && data.speech.trim()) {
        return cleanForSpeech(data.speech);
    }
    const raw = fallbackBubbleText || data?.reply || '';
    return cleanForSpeech(raw);
};

/**
 * Mic & Speech Rule:
 * 1. Speaker toggle ON (autoSpeak = true): hands-free voice mode.
 *    - Agent speaks every reply (shouldSpeak = true if ttsSupported).
 *    - Mic reopens automatically after questions (needs_input, needs_disambiguation, ready),
 *      whether last turn was typed, chip, or voice (micAction = 'reopen_after_speech').
 * 2. Speaker toggle OFF (autoSpeak = false): text mode.
 *    - Silent (shouldSpeak = false).
 *    - No auto-listen (micAction = 'none').
 * 3. In both modes:
 *    - Mic stays closed if user muted, is typing in composer, or task created/cancelled.
 *    - Denied mic permission fails silently.
 */
export const determineTurnSpeechAndMicAction = ({
    inputSource = 'typed', // 'voice' | 'typed' | 'chip'
    autoSpeak = true,      // boolean speaker toggle
    ttsSupported = true,   // boolean
    shouldListen = false,  // boolean from shouldAutoListenAfterTurn
    isTyping = false,      // boolean composer typing state
} = {}) => {
    if (!autoSpeak) {
        // Speaker OFF = text mode (silent, no auto-listen)
        return {
            shouldSpeak: false,
            micAction: 'none',
        };
    }

    // Speaker ON = hands-free voice mode
    const shouldSpeak = Boolean(ttsSupported);
    let micAction = 'none';

    if (shouldListen && !isTyping) {
        micAction = shouldSpeak ? 'reopen_after_speech' : 'reopen_after_delay';
    }

    return {
        shouldSpeak,
        micAction,
    };
};

/**
 * Title Guard: fillers that must never be accepted as a task title.
 */
export const TITLE_GUARD_FILLERS = new Set([
    'hlo', 'hello', 'hi', 'hey', 'helo', 'namaste', 'namashkar', 'namaskar', 'pranam',
    'salam', 'salaam', 'yo', 'ya', 'yes', 'yep', 'yeah', 'ok', 'okay', 'okk',
    'ko', 'co', 'haan', 'ha', 'haanji', 'hnji', 'hn', 'hnn', 'nahi', 'nahin', 'no', 'nope', 'na',
    'theek hai', 'thik hai', 'theek', 'thik', 'accha', 'acha', 'achha', 'kuch nahi', 'koi nahi',
    'kuch nhi', 'koi nhi', 'skip', 'kardo', 'kar do', 'banao', 'bana do', 'do', 'done',
    'sure', 'true', 'false', 'blank', 'none', 'नहीं', 'हाँ', 'हां', 'नमस्ते', 'हेलो', 'हाय'
]);

export const isTitleGuardRejected = (title) => {
    if (!title || typeof title !== 'string') return true;
    const clean = title.trim().toLowerCase().replace(/^[#@$%&*+=~`<>{}()[\]\\/|'"]+|[#@$%&*+=~`<>{}()[\]\\/|'"]+$/g, '').trim();
    return TITLE_GUARD_FILLERS.has(clean) || clean.length < 2;
};

export const sanitizeDraftForTransport = (draftObj) => {
    if (!draftObj || typeof draftObj !== 'object') return undefined;
    const clean = {};
    for (const [k, v] of Object.entries(draftObj)) {
        if (v !== null && v !== undefined) {
            clean[k] = v;
        }
    }
    return Object.keys(clean).length > 0 ? clean : undefined;
};

export const buildParseRequestBody = ({ text = '', action, pick, draft, language = 'hinglish', allowedIntents, history } = {}) => {
    return {
        message: text || undefined,
        action: action || undefined,
        pick: pick || undefined,
        language: language === 'hi' ? 'hinglish' : language,
        draft: sanitizeDraftForTransport(draft),
        allowedIntents: Array.isArray(allowedIntents) && allowedIntents.length > 0 ? allowedIntents : undefined,
        history: Array.isArray(history) && history.length > 0 ? history : undefined,
    };
};

export const MALE_VOICE_EXCLUSIONS = [
    'ravi',
    'hemant',
    'prabhat',
    'rishi',
    'madhur',
    'david',
    'mark',
    'george',
    'male',
];

export const PREFERRED_FEMALE_VOICE_NAMES = [
    'neerja',
    'google uk english female',
    'swara online (natural)',
    'swara',
    'google us english',
    'heera',
    'kalpana',
    'veena',
    'priya',
    'jenny online (natural)',
    'sonia online (natural)',
    'samantha',
    'zira',
];

export const isMaleVoice = (voice) => {
    if (!voice || !voice.name) return false;
    const lower = voice.name.toLowerCase();
    return MALE_VOICE_EXCLUSIONS.some((term) => lower.includes(term));
};

export const getVoiceRank = (voice) => {
    if (!voice || !voice.name) return 999;
    if (isMaleVoice(voice)) return 999;

    const lower = voice.name.toLowerCase();
    const lang = (voice.lang || '').toLowerCase();

    // 1. Voices whose name contains "Natural" or "Online"
    if (lower.includes('natural') || lower.includes('online')) {
        if (lang.startsWith('hi') || lang.startsWith('en-in') || lang.startsWith('en_in')) {
            return 1;
        }
        return 2;
    }

    // 2. then "Google हिन्दी"
    if (lower.includes('google हिन्दी') || lower.includes('google hindi')) {
        return 3;
    }

    const isOldLocal = lower.includes('heera') || lower.includes('kalpana');

    // 3. then other female hi-IN or en-IN voices
    if (!isOldLocal && (lang.startsWith('hi') || lang.startsWith('en-in') || lang.startsWith('en_in'))) {
        return 4;
    }

    // 4. old local voices (Heera, Kalpana)
    if (isOldLocal) {
        return 5;
    }

    // 5. any other female / non-male voice (foreign, etc.)
    return 6;
};

export const selectPreferredVoice = (voices = [], savedVoiceName = null) => {
    if (!Array.isArray(voices) || voices.length === 0) {
        return { voice: null, isFallback: false, voiceInfo: null };
    }

    const eligibleVoices = voices.filter((v) => !isMaleVoice(v));
    if (eligibleVoices.length === 0) {
        const indicFallback = voices.find((v) => {
            const l = (v.lang || '').toLowerCase();
            return l.startsWith('en-in') || l.startsWith('en_in') || l.startsWith('hi');
        });
        const fallbackVoice = indicFallback || voices[0];
        return {
            voice: fallbackVoice,
            isFallback: true,
            voiceInfo: { name: fallbackVoice?.name || 'Default', lang: fallbackVoice?.lang || 'en-IN', isFallback: true },
        };
    }

    const sorted = [...eligibleVoices].sort((a, b) => getVoiceRank(a) - getVoiceRank(b));
    const bestRank = getVoiceRank(sorted[0]);

    if (savedVoiceName) {
        const saved = eligibleVoices.find((v) => v.name === savedVoiceName);
        if (saved && getVoiceRank(saved) <= bestRank) {
            return {
                voice: saved,
                isFallback: getVoiceRank(saved) >= 6,
                voiceInfo: { name: saved.name, lang: saved.lang, isFallback: getVoiceRank(saved) >= 6 },
            };
        }
    }

    const chosen = sorted[0];
    const isFallback = getVoiceRank(chosen) >= 6;
    return {
        voice: chosen,
        isFallback,
        voiceInfo: { name: chosen.name, lang: chosen.lang, isFallback },
    };
};

export const waitForVoices = (speechSynth, timeoutMs = 1500) => {
    return new Promise((resolve) => {
        if (!speechSynth || typeof speechSynth.getVoices !== 'function') {
            resolve([]);
            return;
        }
        const immediate = speechSynth.getVoices() || [];
        if (immediate.length > 0) {
            resolve(immediate);
            return;
        }
        let timer = null;
        const onVoicesChanged = () => {
            const v = speechSynth.getVoices() || [];
            if (v.length > 0) {
                if (timer) clearTimeout(timer);
                speechSynth.removeEventListener?.('voiceschanged', onVoicesChanged);
                resolve(v);
            }
        };
        speechSynth.addEventListener?.('voiceschanged', onVoicesChanged);
        timer = setTimeout(() => {
            speechSynth.removeEventListener?.('voiceschanged', onVoicesChanged);
            resolve(speechSynth.getVoices() || []);
        }, timeoutMs);
    });
};



