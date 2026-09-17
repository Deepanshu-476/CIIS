import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLead, isTerminal, localDateTime, todayKey, outcomes } from '../src/crm/telecaller/liveData.js';
test('real lead data preserves final status and current follow-up after notes', () => {
  const lead = normalizeLead({ _id: 'real-id', name: 'Prospect', status: 'converted', assignedTo: { name: 'Agent' }, nextFollowUp: null, callHistory: [
    { id: 'a', outcome: 'Converted', date: '2026-09-17T10:00:00Z' },
    { id: 'b', outcome: 'Note Added', date: '2026-09-17T11:00:00Z' },
  ] });
  assert.equal(lead.id, 'real-id'); assert.equal(lead.outcome, 'Converted');
  assert.equal(lead.followUp, ''); assert.ok(isTerminal(lead));
  assert.ok(isTerminal(normalizeLead({ _id: 'closed-id', status: 'closed' })));
  assert.equal(lead.source, ''); assert.equal(lead.type, '');
});
test('date-time inputs retain local hours and both terminal outcomes are selectable', () => {
  const date = new Date(2026, 8, 17, 18, 0);
  assert.equal(localDateTime(date), '2026-09-17T18:00');
  assert.equal(todayKey(), localDateTime(new Date()).slice(0, 10));
  assert.ok(outcomes.includes('Call Closed')); assert.ok(outcomes.includes('Converted'));
});
test('latest outcome wins even when calls occur in the same minute', () => {
  const lead = normalizeLead({ _id: 'lead', status: 'interested', callHistory: [
    { id: 'first', outcome: 'Connected', date: '2026-09-17T10:00:10Z' },
    { id: 'second', outcome: 'Interested', date: '2026-09-17T10:00:50Z' },
  ] });
  assert.equal(lead.outcome, 'Interested');
  assert.equal(lead.calls[0].id, 'second');
});
