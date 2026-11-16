import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the attendance page's real status resolver without mounting its clock/camera UI.
const source = fs.readFileSync(new URL('../src/hrCds/pages/Attendance.jsx', import.meta.url), 'utf8');
const resolver = source.match(/const getNormalizedStatus = useCallback\(([\s\S]*?), \[holidayDateKeySet, isWeeklyOff\]\);/)[1];
const resolve = (offDays, holidays = []) => vm.runInNewContext(`(${resolver})`, {
  Date,
  normalizeToDateKey: value => value instanceof Date ? value.toISOString().slice(0, 10) : String(value || '').slice(0, 10),
  holidayDateKeySet: new Set(holidays),
  isWeeklyOff: key => offDays.includes(key),
});

test('an assigned Thursday replaces an absent record in the employee attendance page', () => {
  const status = resolve(['2026-11-12']);
  assert.equal(status('ABSENT', '2026-11-12', {}), 'WEEKLY OFF');
  assert.equal(status('UNINFORMED LEAVE', '2026-11-12', {}), 'WEEKLY OFF');
  assert.equal(status('WEEKEND', '2020-11-15', {}), 'ABSENT', 'the old Sunday off no longer applies');
});

test('weekly off preserves actual attendance, leave and holiday statuses', () => {
  const status = resolve(['2026-11-12']);
  for (const value of ['PRESENT', 'LATE', 'HALF DAY']) {
    assert.equal(status(value, '2026-11-12', { inTime: '09:00' }), value);
  }
  assert.equal(status('ON LEAVE', '2026-11-12', {}), 'ON LEAVE');
  assert.equal(resolve(['2026-11-12'], ['2026-11-12'])('ABSENT', '2026-11-12', {}), 'HOLIDAY');
});

test('an old weekly-off record does not make a future working day absent', () => {
  assert.equal(resolve([])('WEEKEND', '2099-11-15', {}), 'NONE');
});
