import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { transformSync } from 'esbuild';

test('employee calendars load personal offs, refresh changes, and follow the selected month', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const calls = [];
  let offDayKeys = ['2026-11-19', '2026-11-26']; // Thursday, rather than Sunday.
  const axios = { get: async (url, options) => {
    calls.push({ url, options });
    return { data: { success: true, offDayKeys: [...offDayKeys] } };
  } };
  const module = { exports: {} };
  const { code } = transformSync(fs.readFileSync(new URL('../src/hooks/useWeekOffSchedule.js', import.meta.url), 'utf8'), { format: 'cjs' });
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: name => name === 'react' ? React : axios,
    window: dom.window, document: dom.window.document,
  });
  const useWeekOffSchedule = module.exports.default;
  let result;
  function Calendar({ month }) {
    result = useWeekOffSchedule([month, month]);
    return null;
  }
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => { root.render(React.createElement(Calendar, { month: '2026-11' })); });
    assert.equal(calls.length, 1, 'duplicate month requests are collapsed');
    assert.equal(calls[0].options.cache, false, 'saved changes must bypass the persistent API cache');
    assert.equal(result.isWeeklyOff('2026-11-19'), true);
    assert.equal(result.isWeeklyOff('2026-11-22'), false, 'Sunday is a working day for this employee');
    assert.equal(result.isWeeklyOff('2026-12-03'), null, 'an unloaded month is not an empty schedule');

    // Admin changes the day, or approves a swap, while the employee is away.
    offDayKeys = ['2026-11-20'];
    await act(async () => { window.dispatchEvent(new window.Event('focus')); });
    assert.equal(result.isWeeklyOff('2026-11-19'), false);
    assert.equal(result.isWeeklyOff('2026-11-20'), true);

    // A seven-day department has an authoritative empty schedule.
    offDayKeys = [];
    await act(async () => { root.render(React.createElement(Calendar, { month: '2026-12' })); });
    assert.match(calls.at(-1).url, /month=2026-12$/);
    assert.equal(result.isWeeklyOff('2026-12-06'), false);
  } finally {
    await act(async () => { root.unmount(); });
    dom.window.close();
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
