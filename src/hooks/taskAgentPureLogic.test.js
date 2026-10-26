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
    mapTaskAgentError,
    validateAttachmentFile,
    checkSttUploadCap,
    getRoleAwareGreeting,
    formatSpokenForTTS,
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
            'yes',
            'sure',
            'ok',
            'okay',
            'done',
            'theek hai',
            'bana do',
            'create kar do',
            'create now',
            'bana dijiye',
            'kar do',
            'complete kar do',
            'हाँ',
            'हां',
            'बना दो',
            'कर दो',
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
});
