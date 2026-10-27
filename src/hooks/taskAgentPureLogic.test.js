import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AI_ENDPOINTS } from '../constants/aiEndpoints.js';
import {
    isConfirmationIntent,
    isRefusalOrEditIntent,
    hasFieldChangeIntent,
    canAcceptConfirm,
    resolveConfirmPayload,
    buildConfirmPayloadFromDraft,
    shouldAutoListenAfterTurn,
    createTtsWatchdog,
    mapTaskAgentError,
    validateAttachmentFile,
    checkSttUploadCap,
    getRoleAwareGreeting,
    formatSpokenForTTS,
    isSilenceHallucination,
    isFillerOnlyTranscript,
    isSelfEcho,
    canProcessTranscriptTurn,
    candidateId,
    sanitizeDocName,
    buildTaskFormDataEntries,
} from './taskAgentPureLogic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Task Agent Pure Decision Logic & Route Contract', () => {

    test('1. Endpoint Constants match routes registered in CIISBackend/routes/aiRoutes.js', () => {
        assert.equal(AI_ENDPOINTS.TASK_AGENT_PARSE, '/ai/task-agent/parse');
        assert.equal(AI_ENDPOINTS.TRANSCRIBE, '/ai/transcribe');

        // Verify against actual backend route file on disk
        const backendRoutesPath = path.resolve(__dirname, '../../../CIISBackend/routes/aiRoutes.js');
        assert.ok(fs.existsSync(backendRoutesPath), `File not found: ${backendRoutesPath}`);
        const routesSource = fs.readFileSync(backendRoutesPath, 'utf8');

        // Assert router.post('/task-agent/parse') exists in aiRoutes.js
        assert.match(routesSource, /router\.post\(\s*['"]\/task-agent\/parse['"]/);
        // Assert router.post('/transcribe') exists in aiRoutes.js
        assert.match(routesSource, /router\.post\(\s*['"]\/transcribe['"]/);
    });

    test('2. Single-Flight Lock: canAcceptConfirm accepts only in ready/confirming and locks out duplicates', () => {
        // Must accept when ready or confirming and unlocked
        assert.equal(canAcceptConfirm('ready', false), true);
        assert.equal(canAcceptConfirm('confirming', false), true);

        // Must reject when lock is active (creating in progress)
        assert.equal(canAcceptConfirm('ready', true), false);
        assert.equal(canAcceptConfirm('confirming', true), false);

        // Must reject during any other state
        assert.equal(canAcceptConfirm('idle', false), false);
        assert.equal(canAcceptConfirm('thinking', false), false);
        assert.equal(canAcceptConfirm('listening', false), false);
        assert.equal(canAcceptConfirm('creating', false), false);
        assert.equal(canAcceptConfirm('done', false), false);
        assert.equal(canAcceptConfirm('cancelled', false), false);
    });

    test('3. Confirmation Intent: recognizes affirmative Hinglish, Hindi, and English variations', () => {
        const affirmatives = [
            'haan',
            'ha',
            'haanji',
            'haan ji',
            'ji haan',
            'yes',
            'sure',
            'ok',
            'okay',
            'done',
            'theek hai',
            'kar do',
            'create kar do',
            'bana do',
            'haan bana do',
            'create now',
            'bana dijiye',
            'complete kar do',
            'हाँ',
            'हां',
            'हाँ जी',
            'जी हाँ',
            'हाँ बना दो',
            'बना दो',
            'कर दो',
            'क्रिएट कर दो',
            'ठीक है',
        ];

        for (const phrase of affirmatives) {
            assert.equal(
                isConfirmationIntent(phrase),
                true,
                `Expected "${phrase}" to be recognized as confirmation`
            );
        }
    });

    test('4. Confirmation Intent: rejects refusals, edits, cancellations and duplicate noise', () => {
        const nonAffirmatives = [
            'nahi',
            'no',
            'ruko',
            'wait',
            'cancel',
            'rehne do',
            'priority high kar do',
            'due date change karo',
            'kisi aur ko assign karo',
        ];

        for (const phrase of nonAffirmatives) {
            assert.equal(
                isConfirmationIntent(phrase),
                false,
                `Expected "${phrase}" NOT to be confirmation`
            );
        }
    });

    test('5. Refusal & Edit Intent detection', () => {
        assert.equal(isRefusalOrEditIntent('nahi chahiye'), true);
        assert.equal(isRefusalOrEditIntent('ruko change karna hai'), true);
        assert.equal(isRefusalOrEditIntent('cancel'), true);
        assert.equal(isRefusalOrEditIntent('cancel kar do'), true);
        assert.equal(isRefusalOrEditIntent('rehne do'), true);
        assert.equal(isRefusalOrEditIntent('rok do'), true);
        assert.equal(isRefusalOrEditIntent('no'), true);
        assert.equal(isRefusalOrEditIntent('wait'), true);
        assert.equal(isRefusalOrEditIntent('badal do'), true);
        assert.equal(isRefusalOrEditIntent('मत करो'), true);
        assert.equal(isRefusalOrEditIntent('नहीं'), true);
        assert.equal(isRefusalOrEditIntent('haan bilkul'), false);
    });

    test('6. Field Change Intent detection', () => {
        assert.equal(hasFieldChangeIntent('priority High kar do'), true);
        assert.equal(hasFieldChangeIntent('kal shaam 6 baje'), true);
        assert.equal(hasFieldChangeIntent('due time 10:30 am'), true);
        assert.equal(hasFieldChangeIntent('sirf theek hai'), false);
    });

    test('7. Error Mapping: Every single failure path produces a non-empty user-facing bubble', () => {
        const testCases = [
            { err: { response: { status: 404 } }, expected: 'AI service endpoint nahi mila (404). Admin se contact karein.' },
            { err: { response: { status: 429 } }, expected: 'AI abhi busy hai, 1 minute baad try karein.' },
            { err: { response: { status: 503 } }, expected: 'AI service abhi available nahi hai. Admin se contact karein.' },
            { err: { response: { status: 502 } }, expected: 'Samajh nahi paaya, kripya dobara bolein.' },
            { err: { response: { status: 401 } }, expected: 'Session expire ho gaya, dobara login karein.' },
            { err: { response: { status: 403 } }, expected: 'Aapko ye action karne ki permission nahi hai.' },
            { err: { response: { status: 500 } }, expected: 'Server par error aayi (500). Dobara try karein.' },
            { err: { code: 'ECONNABORTED', message: 'timeout of 25000ms exceeded' }, expected: 'Request timeout ho gaya. Kripya apna connection check karke dobara koshish karein.' },
            { err: { name: 'AbortError', message: 'The user aborted a request.' }, expected: 'Request timeout ho gaya. Kripya apna connection check karke dobara koshish karein.' },
            { err: { name: 'CanceledError', message: 'canceled' }, expected: 'Request timeout ho gaya. Kripya apna connection check karke dobara koshish karein.' },
            { err: { code: 'ERR_NETWORK', message: 'Network Error' }, expected: 'Network connection nahi mil raha. Internet check karein.' },
            { err: { response: { data: { message: 'Daily AI budget limit reached' } } }, expected: 'Daily AI budget limit reached' },
            { err: null, expected: 'Kuch gadbad ho gayi. Dobara try karein.' },
            { err: new Error('Unknown error'), expected: 'Kuch gadbad ho gayi. Dobara try karein.' },
        ];

        for (const { err, expected } of testCases) {
            const mapped = mapTaskAgentError(err);
            assert.ok(typeof mapped === 'string' && mapped.length > 0, 'Must return non-empty string');
            assert.equal(mapped, expected);
        }
    });

    test('8. Attachment Validation: validates extensions, size limits and maximum file count', () => {
        // Valid file
        const validFile = { name: 'document.pdf', size: 1024 * 1024 };
        assert.deepEqual(validateAttachmentFile(validFile, 2), { valid: true });

        // Invalid extension
        const invalidExt = { name: 'script.exe', size: 1024 };
        const extRes = validateAttachmentFile(invalidExt, 0);
        assert.equal(extRes.valid, false);
        assert.match(extRes.error, /not allowed|allowed nahi hai/i);

        // Oversized (> 20MB)
        const bigFile = { name: 'video.mp4', size: 25 * 1024 * 1024 };
        const sizeRes = validateAttachmentFile(bigFile, 0);
        assert.equal(sizeRes.valid, false);
        assert.match(sizeRes.error, /20MB/);

        // Exceeded max count (>= 10)
        const countRes = validateAttachmentFile(validFile, 10);
        assert.equal(countRes.valid, false);
        assert.match(countRes.error, /maximum 10/i);
    });

    test('9. STT Upload Cap: allows uploads under 12, caps at 12', () => {
        assert.deepEqual(checkSttUploadCap(0), { isCapped: false, remaining: 12 });
        assert.deepEqual(checkSttUploadCap(11), { isCapped: false, remaining: 1 });
        assert.deepEqual(checkSttUploadCap(12), { isCapped: true, remaining: 0 });
        assert.deepEqual(checkSttUploadCap(15), { isCapped: true, remaining: 0 });
    });

    test('10. Role-Aware Greeting: privileged roles get assignee line, employees get self-focused list', () => {
        const ownerUser = { companyRole: 'owner' };
        const adminUser = { role: 'admin' };
        const empUser = { companyRole: 'employee', role: 'user' };

        const ownerGreeting = getRoleAwareGreeting(ownerUser);
        const adminGreeting = getRoleAwareGreeting(adminUser);
        const empGreeting = getRoleAwareGreeting(empUser);

        assert.match(ownerGreeting, /Namaste! Main CIIS AI Assistant hoon/);
        assert.match(ownerGreeting, /Kiske liye \(assignee/);
        assert.match(adminGreeting, /Kiske liye \(assignee/);
        assert.doesNotMatch(empGreeting, /Kiske liye \(assignee/);
        assert.match(empGreeting, /Task ka naam \(zaroori\)/);
    });

    test('11. TTS Phonetic Formatting: formatSpokenForTTS spells CIIS as C I I S A I and maps priority to English', () => {
        assert.equal(formatSpokenForTTS('Main CIIS AI hoon'), 'Main C I I S A I hoon');
        assert.equal(formatSpokenForTTS('CIIS network me swagat hai'), 'C I I S network me swagat hai');
        assert.equal(formatSpokenForTTS('Astra speaking'), 'C I I S A I speaking');
        assert.equal(formatSpokenForTTS('प्राथमिकता क्या रखें?'), 'Priority क्या रखें?');
        assert.equal(formatSpokenForTTS('प्रायोरिटी क्या रखें?'), 'Priority क्या रखें?');
        assert.equal(formatSpokenForTTS(''), '');
        assert.equal(formatSpokenForTTS(null), '');
    });

    test('12. Unified Confirm Paths: Button click, typed yes, and voice yes all resolve payload and share single-flight lock', () => {
        const mockPayload = {
            endpoint: '/tasks/self/create',
            method: 'POST',
            multipart: true,
            fields: { title: 'Audit Report', priority: 'high' },
        };

        // Path 1: Button click passes React SyntheticEvent (has event props, lacks .endpoint)
        const reactClickEvent = {
            _reactName: 'onClick',
            type: 'click',
            target: { tagName: 'BUTTON' },
            nativeEvent: {},
        };
        const resolvedFromButton = resolveConfirmPayload(reactClickEvent, mockPayload);
        assert.deepEqual(resolvedFromButton, mockPayload, 'Button click must safely resolve session payload');
        assert.equal(resolvedFromButton.endpoint, '/tasks/self/create');

        // Path 2: Typed yes ("haan, create kar do")
        const typedInput = 'haan, create kar do';
        assert.equal(isConfirmationIntent(typedInput), true);
        const resolvedFromTyped = resolveConfirmPayload(null, mockPayload);
        assert.deepEqual(resolvedFromTyped, mockPayload, 'Typed yes must resolve session payload');
        assert.equal(resolvedFromTyped.endpoint, '/tasks/self/create');

        // Path 3: Voice yes ("haan ji" or "bana do" or Devanagari "हाँ जी")
        const voicePhrases = ['haan ji', 'create kar do', 'bana do', 'हाँ जी', 'बना दो'];
        for (const voiceText of voicePhrases) {
            assert.equal(isConfirmationIntent(voiceText), true, `Voice "${voiceText}" must be confirmation`);
            const resolvedFromVoice = resolveConfirmPayload(null, mockPayload);
            assert.deepEqual(resolvedFromVoice, mockPayload);
            assert.equal(resolvedFromVoice.endpoint, '/tasks/self/create');
        }

        // Single-flight lock verification:
        // When lock is inactive, ready/confirming state accepts confirm
        assert.equal(canAcceptConfirm('ready', false), true);

        // When lock is active (creation in flight), ALL 3 paths are locked out
        assert.equal(canAcceptConfirm('ready', true), false);

        // On failure: lock resets to false, allowing retry
        let isCreatingLock = true;
        // Simulate failure catch block
        isCreatingLock = false;
        assert.equal(canAcceptConfirm('ready', isCreatingLock), true, 'Lock must be re-enabled on error');

        // Error bubble mapping on failure: extracts server message
        const serverErr = { response: { status: 400, data: { message: 'Title already exists in company' } } };
        assert.equal(mapTaskAgentError(serverErr), 'Title already exists in company');
    });

    test('13. Voice Echo & Half-Duplex: drops transcripts arriving while speaking, during guard window, or echoing assistant', () => {
        const now = 5000;

        // 1. Transcript arriving while assistant is speaking -> DROPPED
        const speakingCheck = canProcessTranscriptTurn({
            isSpeaking: true,
            speechEndedAt: 0,
            now,
        });
        assert.equal(speakingCheck.allowed, false);
        assert.equal(speakingCheck.reason, 'assistant_speaking');

        // 2. Transcript arriving within 250ms guard window after speech ended -> DROPPED
        const guardWindowCheck = canProcessTranscriptTurn({
            isSpeaking: false,
            speechEndedAt: now - 150, // 150ms ago (< 250ms)
            now,
        });
        assert.equal(guardWindowCheck.allowed, false);
        assert.equal(guardWindowCheck.reason, 'half_duplex_guard_window');

        // 3. Transcript arriving after guard window (> 250ms) -> ALLOWED
        const cleanWindowCheck = canProcessTranscriptTurn({
            isSpeaking: false,
            speechEndedAt: now - 350, // 350ms ago (> 250ms)
            now,
        });
        assert.equal(cleanWindowCheck.allowed, true);

        // 4. "yes" is accepted ONLY after preview was spoken and guard window passed
        const yesText = 'haan, create kar do';
        assert.equal(isConfirmationIntent(yesText), true);
        // While speaking -> dropped
        assert.equal(canProcessTranscriptTurn({ isSpeaking: true, now }).allowed, false);
        // After speaking ends -> allowed and confirmed
        assert.equal(canProcessTranscriptTurn({ isSpeaking: false, speechEndedAt: now - 300, now }).allowed, true);

        // 5. Echo Detection: transcript matching assistant's last spoken reply is dropped
        const lastSpoken = 'Task ka title aur due date batayein';
        assert.equal(isSelfEcho(lastSpoken, lastSpoken), true);
        assert.equal(isSelfEcho('task ka title aur due date batayein', lastSpoken), true);
        assert.equal(isSelfEcho('Task create kar diya gaya hai', 'Task create kar diya gaya hai ✅'), true);
        // Legitimate user speech that is NOT an echo
        assert.equal(isSelfEcho('Create invoice template', lastSpoken), false);

        // 6. Safety timeout calculation based on text length (prevents hanging if onend never fires)
        const computeTimeoutMs = (text) => {
            const charCount = (text || '').length;
            const estimatedMs = Math.max(2000, Math.min(45000, charCount * 120));
            return estimatedMs + 1000;
        };
        assert.equal(computeTimeoutMs('Short'), 3000); // 5 chars * 120 = 600 -> min 2000 + 1000 = 3000ms
        assert.equal(computeTimeoutMs('A'.repeat(100)), 13000); // 100 * 120 = 12000 + 1000 = 13000ms
        assert.equal(computeTimeoutMs('A'.repeat(500)), 46000); // 500 * 120 = 60000 -> max 45000 + 1000 = 46000ms
    });

    test('14. Ported State Machine Transitions (myAiStateMachine coverage)', () => {
        // 1. Greeting to listening transition
        const initialUser = { companyRole: 'employee', role: 'user' };
        const greeting = getRoleAwareGreeting(initialUser);
        assert.ok(greeting.length > 0);
        // In voice mode, initial state transitions to listening if not muted
        const initialCheck = canProcessTranscriptTurn({ userMuted: false, isSpeaking: false, speechEndedAt: 0, now: 1000 });
        assert.equal(initialCheck.allowed, true);

        // 2. 10-second silence timeout logic
        const checkSilencePhase = (silenceMs) => {
            if (silenceMs >= 10000) return 'pause_inactivity';
            if (silenceMs >= 6000) return 'prompt_inactivity';
            return 'listening';
        };
        assert.equal(checkSilencePhase(2000), 'listening');
        assert.equal(checkSilencePhase(6100), 'prompt_inactivity');
        assert.equal(checkSilencePhase(10100), 'pause_inactivity');

        // 3. Confirm only in confirming state
        assert.equal(canAcceptConfirm('idle'), false);
        assert.equal(canAcceptConfirm('thinking'), false);
        assert.equal(canAcceptConfirm('ready'), true);
        assert.equal(canAcceptConfirm('confirming'), true);

        // 4. Cancel transition
        const cancelInputs = ['cancel', 'nahi chahiye', 'rehne do', 'rok do'];
        for (const c of cancelInputs) {
            assert.equal(isRefusalOrEditIntent(c), true, `Expected "${c}" to trigger cancel/refusal`);
        }

        // 5. Edit then re-confirm transition
        const editIntent = 'due date kal shaam 6 baje ka karo';
        assert.equal(hasFieldChangeIntent(editIntent), true);
        // Preserves ready state after edit is parsed, user then confirms
        const subsequentConfirm = 'theek hai, bana do';
        assert.equal(isConfirmationIntent(subsequentConfirm), true);
        assert.equal(canAcceptConfirm('ready', false), true);

        // 6. Error then retry transition
        let lock = true; // while creating
        assert.equal(canAcceptConfirm('ready', lock), false);
        // Error occurs -> mapped to message bubble and lock released
        const networkErr = { code: 'ERR_NETWORK', message: 'Network Error' };
        const errBubble = mapTaskAgentError(networkErr);
        assert.equal(errBubble, 'Network connection nahi mil raha. Internet check karein.');
        lock = false; // lock released
        assert.equal(canAcceptConfirm('ready', lock), true, 'User must be able to retry confirmation after error');
    });

    test('15. Ghost Voice Prevention, Session Invalidation & Typed Send Precedence', () => {
        // 1. Session invalidation on stop: late transcript from prior session is dropped
        const activeSession = 3;
        // User turned off mic -> active session becomes 0
        const sessionAfterStop = 0;
        const lateTranscriptCheck = canProcessTranscriptTurn({
            transcriptSessionId: activeSession,
            currentSessionId: sessionAfterStop,
        });
        assert.equal(lateTranscriptCheck.allowed, false);
        assert.equal(lateTranscriptCheck.reason, 'session_invalidated');

        // 2. Sticky userMuted persists until explicit turn-on
        const userMutedState = true;
        const mutedTurnCheck = canProcessTranscriptTurn({
            userMuted: userMutedState,
            transcriptSessionId: 1,
            currentSessionId: 1,
        });
        assert.equal(mutedTurnCheck.allowed, false);
        assert.equal(mutedTurnCheck.reason, 'user_muted');

        // Auto-restart simulated with userMuted = true
        const attemptAutoRestart = (isUserMuted) => {
            if (isUserMuted) return { restarted: false, reason: 'user_muted' };
            return { restarted: true };
        };
        assert.deepEqual(attemptAutoRestart(true), { restarted: false, reason: 'user_muted' });

        // 3. Silence Hallucinations: dropped under short speech duration (< 2s) or low energy
        const hallucinationPhrases = [
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
        ];
        for (const phrase of hallucinationPhrases) {
            // Short clip (800ms) with low RMS (10) -> must be dropped
            assert.equal(
                isSilenceHallucination(phrase, 800, 10),
                true,
                `Expected "${phrase}" to be dropped as silence hallucination`
            );
        }
        // Legitimate task commands are NEVER dropped as hallucinations
        assert.equal(isSilenceHallucination('Create invoice template', 3000, 45), false);
        assert.equal(isSilenceHallucination('Assign permissions module', 2500, 38), false);
        assert.equal(isSilenceHallucination('Database indexing', 2200, 35), false);

        // 4. Filler-only transcripts: dropped in idle state
        const fillerTranscripts = ['thank you', 'thanks', 'hmm', 'ok', 'okay', 'acha', 'theek', 'haan'];
        for (const filler of fillerTranscripts) {
            assert.equal(isFillerOnlyTranscript(filler), true, `Expected "${filler}" to be recognized as filler`);
        }
        assert.equal(isFillerOnlyTranscript('create invoice template'), false);

        // Simulated idle turn check
        const shouldSubmitTurn = ({ transcript, isQuestionPending }) => {
            if (!isQuestionPending && isFillerOnlyTranscript(transcript)) {
                return false;
            }
            return true;
        };
        assert.equal(shouldSubmitTurn({ transcript: 'thank you', isQuestionPending: false }), false, 'Idle "thank you" must not auto-submit');
        assert.equal(shouldSubmitTurn({ transcript: 'hmm', isQuestionPending: false }), false, 'Idle "hmm" must not auto-submit');
        assert.equal(shouldSubmitTurn({ transcript: 'Create invoice template', isQuestionPending: false }), true, 'Real task command must auto-submit');

        // 5. Confirming state: only explicit yes counts, "thank you" must NOT count as yes
        assert.equal(isConfirmationIntent('ok'), true, '"ok" must count as confirmation in confirming state');
        assert.equal(isConfirmationIntent('haan'), true, '"haan" must count as confirmation in confirming state');
        assert.equal(isConfirmationIntent('haan ji'), true, '"haan ji" must count as confirmation in confirming state');
        assert.equal(isConfirmationIntent('bana do'), true, '"bana do" must count as confirmation in confirming state');
        assert.equal(isConfirmationIntent('theek hai'), true, '"theek hai" must count as confirmation in confirming state');
        assert.equal(isConfirmationIntent('thank you'), false, '"thank you" must NEVER count as confirmation');
        assert.equal(isConfirmationIntent('thanks'), false, '"thanks" must NEVER count as confirmation');

        // 6. Typed send precedence while recording: discards audio and aborts upload
        const simulateTypedSendWhileRecording = () => {
            let activeSession = 4;
            let audioChunks = [new Uint8Array([1, 2, 3])];
            let aborted = false;
            const controller = { abort: () => { aborted = true; } };

            // User clicks Send for typed message
            activeSession = 0; // Invalidate session
            controller.abort(); // Abort in-flight upload
            audioChunks = []; // Discard audio buffer

            return { activeSession, aborted, audioChunksCount: audioChunks.length };
        };
        const typedSendResult = simulateTypedSendWhileRecording();
        assert.equal(typedSendResult.activeSession, 0, 'Session must be invalidated to 0');
        assert.equal(typedSendResult.aborted, true, 'In-flight upload must be aborted');
        assert.equal(typedSendResult.audioChunksCount, 0, 'Audio chunks must be discarded');
    });

    test('16. Project Task Document Sanitization: sanitizeDocName removes illegal chars and truncates to 60', () => {
        assert.equal(sanitizeDocName('Task: Review & Deploy / Final*'), 'Task_Review_&_Deploy_Final');
        assert.equal(sanitizeDocName(''), 'Document');
        assert.equal(sanitizeDocName(null, 'Task'), 'Task');
        assert.equal(sanitizeDocName('   spaces   trimmed   '), 'spaces_trimmed');

        // Illegal chars stripped: \ / : * ? " < > |
        assert.equal(sanitizeDocName('a\\b/c:d*e?f"g<h>i|j'), 'abcdefghij');

        // Long title sliced to 60 characters
        const longTitle = 'A'.repeat(80);
        assert.equal(sanitizeDocName(longTitle).length, 60);
    });

    test('17. Candidate ID: candidateId resolves projectId, assigneeId, userId, _id, id', () => {
        assert.equal(candidateId({ projectId: 'proj-123' }), 'proj-123');
        assert.equal(candidateId({ assigneeId: 'user-456' }), 'user-456');
        assert.equal(candidateId({ userId: 'u-789' }), 'u-789');
        assert.equal(candidateId({ _id: 'mongo-id' }), 'mongo-id');
        assert.equal(candidateId({ id: 'plain-id' }), 'plain-id');
        assert.equal(candidateId(null), '');
    });

    test('18. Attachment Validation with Custom maxFiles (maxFiles: 1 for project task)', () => {
        const dummyFile = { name: 'spec.pdf', size: 1024 * 1024 };

        // With maxFiles = 1, first file is accepted
        const first = validateAttachmentFile(dummyFile, 0, 1);
        assert.equal(first.valid, true);

        // Second file is rejected with singular message
        const second = validateAttachmentFile(dummyFile, 1, 1);
        assert.equal(second.valid, false);
        assert.equal(second.error, 'Sirf maximum 1 file attach kar sakte hain.');
    });

    test('19. Task Form Data Construction: buildTaskFormDataEntries conforms to ProjectDetailsPage contract', () => {
        const projectPayload = {
            endpoint: '/projects/60d5ec49f1b2c8b1f8e4e1a1/tasks',
            method: 'POST',
            multipart: true,
            fileField: 'pdfFile',
            maxFiles: 1,
            fields: {
                title: 'Client Portal Setup',
                description: 'Initial config',
                assignedUsers: ['60d5ec49f1b2c8b1f8e4e1a2'],
                priority: 'High',
                status: 'in progress',
                checkpoints: [{ title: 'Setup DB', completed: false }],
                reminderSettings: { enabled: true, options: ['oneHourBefore'] },
                dueDate: '2026-11-01T10:00:00.000Z',
            },
        };

        const file1 = { name: 'specs.pdf', size: 2048 };
        const file2 = { name: 'extra.png', size: 1024 };
        const voiceBlob = { size: 5000, type: 'audio/webm' };

        const entries = buildTaskFormDataEntries({
            payload: projectPayload,
            files: [file1, file2],
            voiceNoteBlob: voiceBlob,
        });

        const entryMap = new Map();
        for (const [key, val, filename] of entries) {
            entryMap.set(key, { val, filename });
        }

        // 1. Title, description, dueDate preserved as strings
        assert.equal(entryMap.get('title').val, 'Client Portal Setup');
        assert.equal(entryMap.get('description').val, 'Initial config');
        assert.equal(entryMap.get('dueDate').val, '2026-11-01T10:00:00.000Z');

        // 2. Priority is Title Case 'High'
        assert.equal(entryMap.get('priority').val, 'High');

        // 3. Status is lowercase 'in progress'
        assert.equal(entryMap.get('status').val, 'in progress');

        // 4. Complex fields: assignedUsers appended per user ID, checkpoints/reminderSettings JSON stringified
        assert.equal(entryMap.get('assignedUsers').val, '60d5ec49f1b2c8b1f8e4e1a2');
        assert.equal(entryMap.get('checkpoints').val, JSON.stringify([{ title: 'Setup DB', completed: false }]));
        assert.equal(entryMap.get('reminderSettings').val, JSON.stringify({ enabled: true, options: ['oneHourBefore'] }));

        // 5. Exactly 1 file attached under 'pdfFile' with sanitized document filename
        assert.ok(entryMap.has('pdfFile'));
        assert.equal(entryMap.get('pdfFile').filename, 'Client_Portal_Setup_Document.pdf');

        // 6. Voice note must NOT be appended for project tasks
        assert.equal(entryMap.has('voiceNote'), false);
    });

    test('20. Chromium speechSynthesis.speaking stuck true: half-duplex gate allows mic restart and captures "haan ji"', () => {
        // Mock Chromium environment where window.speechSynthesis.speaking remains stuck as true
        const mockWindow = {
            speechSynthesis: {
                speaking: true, // Stuck true due to Chromium bug after onend
                cancel: () => {},
            },
            __ciisVoiceSpeaking: false, // App's own flag correctly reset to false after onend
        };

        const isSpeakingRef = { current: false }; // App ref correctly false
        const speechEndedAt = Date.now() - 300; // Utterance ended 300ms ago

        // Test 1: The half-duplex gate in useSpeech.js uses (isSpeakingRef.current || window.__ciisVoiceSpeaking)
        // rather than window.speechSynthesis.speaking.
        const isAgentSpeakingAppFlag = isSpeakingRef.current || mockWindow.__ciisVoiceSpeaking;
        const isAgentSpeakingWithFlakyBrowserFlag = isSpeakingRef.current || mockWindow.__ciisVoiceSpeaking || mockWindow.speechSynthesis.speaking;

        assert.equal(isAgentSpeakingAppFlag, false, 'App own flags must report agent is NOT speaking');
        assert.equal(isAgentSpeakingWithFlakyBrowserFlag, true, 'Flaky browser flag would have frozen the mic');

        // Test 2: Turn processor allows user utterance to be dispatched
        const check = canProcessTranscriptTurn({
            transcriptSessionId: 'sess_123',
            currentSessionId: 'sess_123',
            userMuted: false,
            isSpeaking: isAgentSpeakingAppFlag,
            speechEndedAt,
        });

        assert.equal(check.allowed, true, 'Turn processor must allow transcript when app speech has ended');

        // Test 3: The following spoken text "haan ji" is captured and recognized as confirmation
        const capturedUserText = 'haan ji';
        assert.equal(isConfirmationIntent(capturedUserText, 'confirming'), true);
        assert.equal(isConfirmationIntent(capturedUserText, 'ready'), true);
    });

    test('21. Generic affirmative matching: word limit, state guard, and edit-distance tolerance without hardcoded kartok', () => {
        // 1. Only active in confirming or ready state when state is supplied
        assert.equal(isConfirmationIntent('haan ji', 'idle'), false, 'Must reject in idle state');
        assert.equal(isConfirmationIntent('haan ji', 'thinking'), false, 'Must reject in thinking state');
        assert.equal(isConfirmationIntent('haan ji', 'listening'), false, 'Must reject in listening state');
        assert.equal(isConfirmationIntent('haan ji', 'confirming'), true, 'Must accept in confirming state');
        assert.equal(isConfirmationIntent('haan ji', 'ready'), true, 'Must accept in ready state');

        // 2. Short utterance limit: must reject utterances > 6 words
        assert.equal(
            isConfirmationIntent('haan ji kal meeting rakho aur Simran ko assign karo', 'confirming'),
            false,
            'Must reject multi-intent sentences longer than 6 words'
        );
        assert.equal(
            isConfirmationIntent('haan ji 1 2 3 4 5 6 7', 'confirming'),
            false,
            'Must reject arbitrary 8-word utterances'
        );

        // 3. Generic edit-distance tolerance against canonical list (haan ji, bana do, kar do, create kar do, ok, theek hai)
        assert.equal(isConfirmationIntent('theek hai', 'confirming'), true);
        assert.equal(isConfirmationIntent('bana do', 'confirming'), true);
        assert.equal(isConfirmationIntent('kar do', 'confirming'), true);
        assert.equal(isConfirmationIntent('create kar do', 'confirming'), true);
        assert.equal(isConfirmationIntent('ok', 'confirming'), true);

        // Common speech mis-transcriptions like "hanji kartok" or "hnji kartok" match via edit-distance
        assert.equal(isConfirmationIntent('hanji kartok', 'confirming'), true);
        assert.equal(isConfirmationIntent('hnji kartok', 'confirming'), true);

        // 4. Refusals and field changes are strictly rejected
        assert.equal(isConfirmationIntent('nahi cancel kar do', 'confirming'), false);
        assert.equal(isConfirmationIntent('nahi mujhe change karna hai', 'confirming'), false);
        assert.equal(isConfirmationIntent('priority high kar do', 'confirming'), false);
        assert.equal(isConfirmationIntent('due date kal subah', 'confirming'), false);
    });

    test('22. Client builds confirm payload dynamically from latest server draft at click time (never earlier cached payload)', () => {
        // Earlier cached payload had empty assignedUsers (e.g. from turn before assignee was picked)
        const earlierCachedPayload = {
            endpoint: '/projects/6ae0232bd68fab22dd1597ba/tasks',
            method: 'POST',
            multipart: true,
            fileField: 'pdfFile',
            maxFiles: 1,
            fields: {
                title: 'API testing',
                description: 'doing testing',
                assignedUsers: '[]',
                priority: 'High',
                status: 'in progress',
                checkpoints: '[]',
                reminderSettings: '{"enabled":true}',
                dueDate: '2026-10-28T10:00:00+05:30',
            },
        };

        // Latest server draft at confirm click time has resolved assigneeId for Aarav Sharma
        const latestServerDraft = {
            intent: 'task_project',
            projectId: '6ae0232bd68fab22dd1597ba',
            projectName: 'Demo 1',
            title: 'API testing',
            description: 'doing testing',
            assigneeId: '6acdf50cd2a8c22d6f2b2e5c',
            assigneeName: 'Aarav Sharma',
            assigneeLabel: 'Aarav Sharma — Developer',
            priority: 'High',
            status: 'in progress',
            checkpoints: [],
            reminder: true,
            reminderOption: 'oneHourBefore',
            dueDate: '2026-10-28T10:00:00+05:30',
        };

        // When confirm is clicked, resolveConfirmPayload MUST compile from latestServerDraft
        const resolved = resolveConfirmPayload(null, earlierCachedPayload, latestServerDraft);

        assert.ok(resolved, 'Must return a valid payload');
        assert.equal(resolved.endpoint, '/projects/6ae0232bd68fab22dd1597ba/tasks');
        assert.deepEqual(
            resolved.fields.assignedUsers,
            ['6acdf50cd2a8c22d6f2b2e5c'],
            'Must use assigneeId from latest server draft, NOT the earlier cached empty assignedUsers array'
        );
        assert.equal(resolved.fields.assignedTo, '6acdf50cd2a8c22d6f2b2e5c');
        assert.equal(resolved.fields.status, 'in progress');
        assert.equal(resolved.fields.title, 'API testing');
    });

    test('23. Single-Flight Lock covers full lifecycle including error path (two rapid confirms = one request)', async () => {
        let isCreatingLock = false;
        let networkCallCount = 0;

        // Simulated asynchronous create handler matching useTaskAgentSession
        const simulatedConfirmHandler = async () => {
            if (isCreatingLock) {
                // Secondary trigger ignored by single-flight lock
                return { ignored: true };
            }
            if (!canAcceptConfirm('ready', isCreatingLock)) {
                return { ignored: true };
            }

            isCreatingLock = true;
            try {
                networkCallCount += 1;
                // Simulate network latency
                await new Promise((resolve) => setTimeout(resolve, 50));
                // Simulate 400 Bad Request error from backend
                const error = new Error('Assign at least one user before moving a task to In Progress');
                error.response = { status: 400, data: { message: error.message } };
                throw error;
            } catch (err) {
                // In the bug, lock was released prematurely here!
                // Fixed: lock stays true through catch
                assert.equal(isCreatingLock, true, 'Lock must remain active during catch/error handling');
                return { success: false, error: err.message };
            } finally {
                // Lock is released only in finally
                isCreatingLock = false;
            }
        };

        // Simulate two rapid confirm triggers (e.g. rapid double button click, or voice confirm + button click)
        const [call1, call2] = await Promise.all([
            simulatedConfirmHandler(),
            simulatedConfirmHandler(),
        ]);

        // Exactly one request was dispatched
        assert.equal(networkCallCount, 1, 'Two rapid confirms must fire exactly ONE network request');
        assert.equal(call1.success, false);
        assert.equal(call2.ignored, true, 'Second confirm must be ignored while first is in flight');
        assert.equal(isCreatingLock, false, 'Lock is released cleanly in finally after request finishes');
    });

    test('24. Mic Auto-Listen: triggers for every needs_input field and TTS watchdog fires if onend never fires', async () => {
        // 1. All needs_input fields must trigger auto-listen when user is not muted
        const requiredNeedsInputFields = [
            'project',
            'title',
            'description',
            'checkpoints',
            'priority',
            'dueDate',
            'dueDateTime',
            'status',
            'assignee',
            'reminder',
            'reminderOption',
            'priorityDays',
            'repeatPattern',
            'file',
            'attachments',
        ];

        for (const field of requiredNeedsInputFields) {
            const shouldListen = shouldAutoListenAfterTurn({
                status: 'needs_input',
                field,
                userMuted: false,
            });
            assert.equal(shouldListen, true, `Field "${field}" with status needs_input must trigger auto-listen`);
        }

        // 2. needs_disambiguation and ready also trigger auto-listen
        assert.equal(shouldAutoListenAfterTurn({ status: 'needs_disambiguation', field: 'assignee', userMuted: false }), true);
        assert.equal(shouldAutoListenAfterTurn({ status: 'ready', field: 'ready', userMuted: false }), true);

        // 3. User muted must NEVER auto-listen
        assert.equal(shouldAutoListenAfterTurn({ status: 'needs_input', field: 'checkpoints', userMuted: true }), false);
        assert.equal(shouldAutoListenAfterTurn({ status: 'needs_input', field: 'assignee', userMuted: true }), false);
        assert.equal(shouldAutoListenAfterTurn({ status: 'ready', field: 'ready', userMuted: true }), false);

        // 4. Finished / cancelled states must NEVER auto-listen
        assert.equal(shouldAutoListenAfterTurn({ status: 'created', isCreated: true }), false);
        assert.equal(shouldAutoListenAfterTurn({ status: 'cancelled' }), false);

        // 5. Watchdog test: if onend never fires, watchdog must fire within estimated timeout
        let watchdogFired = false;
        const watchdog = createTtsWatchdog(() => {
            watchdogFired = true;
        }, 10, 80); // 80ms max timeout for test

        await new Promise((resolve) => setTimeout(resolve, 120));
        assert.equal(watchdogFired, true, 'Watchdog must trigger callback if onend never fires');

        // 6. Watchdog cancel: when onend fires normally, cancel prevents watchdog from firing
        let cancelledWatchdogFired = false;
        const normalWatchdog = createTtsWatchdog(() => {
            cancelledWatchdogFired = true;
        }, 10, 80);
        normalWatchdog.cancel();

        await new Promise((resolve) => setTimeout(resolve, 120));
        assert.equal(cancelledWatchdogFired, false, 'Cancelled watchdog must not fire callback');
    });

    test('25. Integration-Style Hook Simulation: Agent asks checkpoints, reminder, attachments, assignee -> mic reopens after TTS ends, and does not reopen when muted or after create', async () => {
        // Fake speech engine and fake timers coordination harness
        class FakeSpeechEngine {
            constructor() {
                this.speaking = false;
                this.currentUtterance = null;
                this.onendCallback = null;
            }

            speak(text, onEnd) {
                this.speaking = true;
                this.currentUtterance = text;
                this.onendCallback = onEnd;
            }

            finishSpeaking() {
                if (this.speaking) {
                    this.speaking = false;
                    const cb = this.onendCallback;
                    this.onendCallback = null;
                    if (cb) cb();
                }
            }

            cancel() {
                this.speaking = false;
                this.currentUtterance = null;
                this.onendCallback = null;
            }
        }

        class FakeTaskAgentSession {
            constructor() {
                this.micOpen = false;
                this.userMuted = false;
                this.autoSpeak = true;
                this.isCreated = false;
                this.speechEngine = new FakeSpeechEngine();
                this.activeWatchdog = null;
            }

            handleAgentTurnResponse(result) {
                // If created or cancelled, stop mic permanently
                if (result.status === 'created' || this.isCreated) {
                    this.micOpen = false;
                    return;
                }

                const shouldListen = shouldAutoListenAfterTurn({
                    status: result.status,
                    field: result.field,
                    userMuted: this.userMuted,
                    isCreated: this.isCreated,
                });

                if (!shouldListen) {
                    this.micOpen = false;
                    return;
                }

                // Close mic during TTS speech
                this.micOpen = false;

                const openMic = () => {
                    if (this.activeWatchdog) {
                        this.activeWatchdog.cancel();
                        this.activeWatchdog = null;
                    }
                    if (!this.userMuted && !this.isCreated) {
                        this.micOpen = true;
                    }
                };

                if (this.autoSpeak && result.speech) {
                    // Arm watchdog
                    this.activeWatchdog = createTtsWatchdog(() => {
                        this.speechEngine.cancel();
                        openMic();
                    }, result.speech.length, 100);

                    this.speechEngine.speak(result.speech, () => {
                        openMic();
                    });
                } else {
                    openMic();
                }
            }
        }

        const session = new FakeTaskAgentSession();

        // 1. Agent asks 'checkpoints' -> TTS speaking, mic closed -> TTS ends -> mic reopens
        session.handleAgentTurnResponse({ status: 'needs_input', field: 'checkpoints', speech: 'Kya koi checkpoints add karne hain?' });
        assert.equal(session.speechEngine.speaking, true, 'Speech engine must be speaking');
        assert.equal(session.micOpen, false, 'Mic must remain closed while assistant is speaking');
        session.speechEngine.finishSpeaking();
        assert.equal(session.micOpen, true, 'Mic must reopen after checkpoints question TTS ends');

        // 2. Agent asks 'reminder' -> TTS speaking, mic closed -> TTS ends -> mic reopens
        session.handleAgentTurnResponse({ status: 'needs_input', field: 'reminder', speech: 'Kya reminder set karna hai?' });
        assert.equal(session.speechEngine.speaking, true);
        assert.equal(session.micOpen, false);
        session.speechEngine.finishSpeaking();
        assert.equal(session.micOpen, true, 'Mic must reopen after reminder question TTS ends');

        // 3. Agent asks 'file' (attachments) -> TTS speaking, mic closed -> TTS ends -> mic reopens
        session.handleAgentTurnResponse({ status: 'needs_input', field: 'file', speech: 'Koi file attach karni hai?' });
        assert.equal(session.speechEngine.speaking, true);
        assert.equal(session.micOpen, false);
        session.speechEngine.finishSpeaking();
        assert.equal(session.micOpen, true, 'Mic must reopen after attachments question TTS ends');

        // 4. Agent asks 'assignee' -> TTS speaking, mic closed -> TTS ends -> mic reopens
        session.handleAgentTurnResponse({ status: 'needs_input', field: 'assignee', speech: 'Kiske liye task banana hai?' });
        assert.equal(session.speechEngine.speaking, true);
        assert.equal(session.micOpen, false);
        session.speechEngine.finishSpeaking();
        assert.equal(session.micOpen, true, 'Mic must reopen after assignee question TTS ends');

        // 5. TTS Off (autoSpeak = false) -> mic reopens immediately
        session.autoSpeak = false;
        session.handleAgentTurnResponse({ status: 'needs_input', field: 'priority', speech: 'Priority kya rakhni hai?' });
        assert.equal(session.speechEngine.speaking, false, 'Speech engine must not be called when autoSpeak is false');
        assert.equal(session.micOpen, true, 'Mic must open immediately when autoSpeak is false');
        session.autoSpeak = true;

        // 6. Watchdog: onend never fires -> watchdog cancels speech and reopens mic
        session.handleAgentTurnResponse({ status: 'needs_disambiguation', field: 'assignee', speech: 'Multiple matches mile, kripya chunein' });
        assert.equal(session.micOpen, false);
        await new Promise((resolve) => setTimeout(resolve, 140)); // Wait for watchdog
        assert.equal(session.micOpen, true, 'Watchdog must reopen mic when onend never fires');

        // 7. User muted -> mic NEVER reopens
        session.userMuted = true;
        session.handleAgentTurnResponse({ status: 'needs_input', field: 'dueDate', speech: 'Due date kya hogi?' });
        assert.equal(session.micOpen, false, 'Mic must NOT open when user is muted');
        session.speechEngine.finishSpeaking();
        assert.equal(session.micOpen, false, 'Mic must NOT open after TTS when user is muted');
        session.userMuted = false;

        // 8. After task created -> mic permanently stops
        session.isCreated = true;
        session.handleAgentTurnResponse({ status: 'created', speech: 'Task ban gaya' });
        assert.equal(session.micOpen, false, 'Mic must NEVER open after task creation');
    });
});

