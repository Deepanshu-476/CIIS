import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the page's actual state/actions with controlled hooks and deferred APIs.
// No browser session, server, or customer records are used.
function harness(api) {
  const source = fs.readFileSync(new URL('../src/crm/admin/ImportExportLeads.jsx', import.meta.url), 'utf8');
  const slots = [], timers = new Map();
  let index = 0, timerId = 0, effects = [];
  const context = vm.createContext({
    api, Blob, FormData,
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    useState(initial) {
      const i = index++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = index++; return slots[i] ||= { current: initial }; },
    useEffect(fn, deps) {
      const i = index++, previous = slots[i];
      if (!previous || deps.some((value, n) => value !== previous.deps[n])) {
        previous?.cleanup?.();
        slots[i] = { deps };
        effects.push(() => { slots[i].cleanup = fn(); });
      }
    },
  });
  const prefix = source.slice(source.indexOf('const BASE'), source.indexOf('export default function'));
  const body = source.slice(source.indexOf('export default function'), source.indexOf('  // Format React-Select'))
    .replace('export default function', 'function');
  vm.runInContext(`${prefix}\n${body}\nreturn { file, preview, result, busy, count, countLoading, error, setTab, updateFilter, validateFile, handleDrop, createPreview, confirm, refreshResult, refreshCount: () => setCountVersion(v => v + 1) }; }\nglobalThis.renderPage = ImportExportLeads;`, context);
  return {
    render() {
      index = 0;
      context.renderPage();
      const pending = effects; effects = [];
      pending.forEach(fn => fn());
      index = 0;
      return context.renderPage();
    },
    startTimers() { const pending = [...timers.values()]; timers.clear(); return pending.map(fn => fn()); },
  };
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const drop = file => ({ preventDefault() {}, stopPropagation() {}, dataTransfer: { files: [file] } });

test('dropping another file cannot replace a running preview or confirm', async () => {
  for (const action of ['preview', 'confirm']) {
    const pending = deferred();
    const h = harness({ get: async () => ({ data: { users: [] } }), post: () => pending.promise });
    const first = new Blob(['first']); first.name = 'first.csv';
    const second = new Blob(['second']); second.name = 'second.csv';
    h.render().validateFile(first);
    const page = h.render();
    const request = action === 'preview' ? page.createPreview() : page.confirm('batch-1');
    h.render().handleDrop(drop(second));
    assert.equal(h.render().file, first);
    pending.resolve({ data: { id: 'batch-1', fileName: 'first.csv', rows: [] } });
    await request;
    assert.equal(h.render()[action === 'preview' ? 'preview' : 'result'].fileName, 'first.csv');
    h.render().handleDrop(drop(second));
    assert.equal(h.render().file, second);
    assert.equal(h.render().preview, null);
    assert.equal(h.render().result, null);
  }
});

test('late export counts cannot override newer filters; failed refresh clears prior count', async () => {
  const requests = [];
  const h = harness({ get: url => {
    if (!url.endsWith('/export/count')) return Promise.resolve({ data: { users: [] } });
    const pending = deferred(); requests.push(pending); return pending.promise;
  } });
  h.render().setTab('export'); h.render();
  const old = h.startTimers();
  h.render().updateFilter('assignment', 'unassigned'); h.render();
  const current = h.startTimers();
  requests[1].resolve({ data: { count: 2 } }); await Promise.all(current);
  requests[0].resolve({ data: { count: 99 } }); await Promise.all(old);
  assert.equal(h.render().count, 2);
  h.render().refreshCount(); h.render();
  assert.equal(h.render().count, null);
  const refresh = h.startTimers();
  requests[2].reject({ response: { data: { message: 'Count unavailable' } } });
  await Promise.all(refresh);
  assert.equal(h.render().count, null);
  assert.equal(h.render().countLoading, false);
  assert.equal(h.render().error, 'Count unavailable');
});

test('incomplete date filters clear count and do not send a count request', () => {
  const h = harness({ get: async () => ({ data: { users: [] } }) });
  h.render().setTab('export');
  h.render().updateFilter('dateMode', 'range');
  assert.equal(h.render().count, null);
  assert.equal(h.render().countLoading, false);
  assert.equal(h.startTimers().length, 0);
});

test('loading history clears a previously selected upload and empty files show accurate errors', async () => {
  const h = harness({ get: async url => ({ data: url.endsWith('/options') ? { users: [] } : { id: 'old', fileName: 'old.csv', status: 'completed', rows: [] } }) });
  h.render().validateFile({ name: 'empty.csv', size: 0 });
  assert.match(h.render().error, /empty/i);
  h.render().validateFile({ name: 'new.csv', size: 100 });
  await h.render().refreshResult('old');
  assert.equal(h.render().file, null);
  assert.equal(h.render().preview, null);
  assert.equal(h.render().result.fileName, 'old.csv');
});
