import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLead, isTerminal, localDateTime, todayKey, outcomes, conversionRate, countCallOutcomes } from '../src/crm/telecaller/liveData.js';
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

test('conversion rate uses all assigned leads, including terminal leads, and stays zero when empty', () => {
  assert.equal(conversionRate([]), '0.0');
  assert.equal(conversionRate([{ status: 'Interested' }]), '0.0');
  assert.equal(conversionRate([{ status: 'Converted' }, { status: 'Closed' }, { status: 'Assigned' }]), '33.3');
  assert.equal(conversionRate([{ status: 'Converted' }]), '100.0');
});

test('outcome analytics never manufacture conversions or count notes as attempts', () => {
  const counts = countCallOutcomes([
    {}, { outcome: 'Unknown' }, { outcome: 'Note Added' },
    { outcome: 'Converted' }, { outcome: 'Call Later' }, { outcome: 'Follow-up' }, { outcome: 'Need Callback' },
  ]);
  assert.equal(counts.Converted, 1);
  assert.equal(counts.Other, 2);
  assert.equal(counts['Need Callback'], 3);
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), 6);
});

test('filterCalls filters assigned calls by status, source, and date properly', async () => {
  const { filterCalls } = await import('../src/crm/telecaller/filterCalls.js');
  const sampleLeads = [
    { id: '1', name: 'Lead 1', status: 'Assigned', source: 'Facebook', assigned: '2026-09-17T10:00:00Z' },
    { id: '2', name: 'Lead 2', status: 'Follow-up', source: 'Instagram', assigned: '2026-09-15T10:00:00Z' },
    { id: '3', name: 'Lead 3', status: 'Interested', source: 'Facebook', assigned: '2026-09-10T10:00:00Z' },
  ];

  // Filter by Status
  const followUpOnly = filterCalls(sampleLeads, { status: 'Follow-up' }, 'assigned');
  assert.equal(followUpOnly.length, 1);
  assert.equal(followUpOnly[0].id, '2');

  // Filter with placeholder "All Statuses"
  const allStatus = filterCalls(sampleLeads, { status: 'All Statuses' }, 'assigned');
  assert.equal(allStatus.length, 3);

  // Filter by Source
  const fbOnly = filterCalls(sampleLeads, { source: 'Facebook' }, 'assigned');
  assert.equal(fbOnly.length, 2);

  // Filter by Date From
  const recent = filterCalls(sampleLeads, { from: '2026-09-16' }, 'assigned');
  assert.equal(recent.length, 1);
  assert.equal(recent[0].id, '1');
});

