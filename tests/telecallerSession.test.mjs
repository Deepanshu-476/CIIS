import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalizeLead, todayKey, isTerminal } from '../src/crm/telecaller/liveData.js';

// Run the actual session state/actions with controlled hooks and deferred requests.
function harness(api) {
  const source = fs.readFileSync(new URL('../src/crm/telecaller/TelecallerLayout.jsx', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('function TelecallerSession'), source.indexOf('  const pageTitle'));
  const slots = []; let index = 0, effects = [];
  const context = vm.createContext({
    api, normalizeLead, todayKey, isTerminal,
    TELECALLER_PAGES: [{ slug: 'call-workspace', path: '/workspace' }],
    getCompany: () => ({}), getCurrentUserId: () => 'user',
    hasTelecallerCompanyAccess: () => true,
    loadPagePermission: async () => ({ viewUsers: ['user'], editUsers: ['user'] }),
    hasPageAccess: (page, id, action) => page[`${action}Users`].includes(id),
    useState(initial) {
      const i = index++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useEffect(fn, deps) {
      const i = index++, prev = slots[i];
      if (!prev || deps.some((value, n) => value !== prev.deps[n])) {
        prev?.cleanup?.(); slots[i] = { deps };
        effects.push(() => { slots[i].cleanup = fn(); });
      }
    },
  });
  vm.runInContext(`${body}\n return { ...value, loading, error, refresh: () => setVersion(v => v + 1) }; } globalThis.renderPage = TelecallerSession;`, context);
  return {
    render() {
      index = 0; context.renderPage({ slug: 'call-workspace' });
      const pending = effects; effects = []; pending.forEach(fn => fn());
      index = 0; return context.renderPage({ slug: 'call-workspace' });
    },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const lead = { _id: 'lead-1', name: 'Real lead', status: 'assigned', callHistory: [] };

test('empty server result stays empty and failed load exposes retry, without demo data', async () => {
  let fail = false;
  const h = harness({ get: async () => { if (fail) throw new Error('Offline'); return { data: { items: [] } }; } });
  assert.equal(h.render().loading, true);
  assert.equal(h.render().assigned.length, 0);
  await settle(); assert.equal(h.render().loading, false);
  assert.equal(h.render().assigned.length, 0);
  fail = true; h.render().refresh(); h.render(); await settle();
  assert.equal(h.render().error, 'Offline');
  assert.equal(h.render().assigned.length, 0);
  fail = false; h.render().refresh(); h.render(); await settle();
  assert.equal(h.render().error, '');
});

test('failed or malformed saves reject and leave the server-derived lead unchanged', async () => {
  let malformed = false;
  const h = harness({ get: async () => ({ data: { items: [lead] } }), post: async () => {
    if (malformed) return { data: {} }; throw new Error('Database unavailable');
  } });
  h.render(); await settle();
  const original = h.render().assigned[0];
  await assert.rejects(h.render().saveCall({ leadId: lead._id, outcome: 'Converted' }), /Database unavailable/);
  assert.equal(h.render().assigned[0], original);
  malformed = true;
  await assert.rejects(h.render().saveCall({ leadId: lead._id, outcome: 'Converted' }), /could not be confirmed/);
  assert.equal(h.render().assigned[0], original);
});

test('successful save returns the confirmed item and updates shared lists', async () => {
  const saved = { ...lead, status: 'converted', callHistory: [{ id: 'call-1', outcome: 'Converted', date: new Date().toISOString() }] };
  const h = harness({ get: async () => ({ data: { items: [lead] } }), post: async () => ({ data: { item: saved } }) });
  h.render(); await settle();
  assert.equal(await h.render().saveCall({ leadId: lead._id, outcome: 'Converted' }), saved);
  assert.equal(h.render().assigned[0].status, 'Converted');
  assert.equal(h.render().converted.length, 1);
  assert.equal(h.render().pending.length, 0);
});

test('refresh clears leads that are no longer assigned and bypasses request cache', async () => {
  let items = [lead];
  const h = harness({ get: async (url, options) => {
    assert.equal(options.noCache, true); return { data: { items } };
  } });
  h.render(); await settle(); assert.equal(h.render().assigned.length, 1);
  items = []; h.render().refresh(); h.render(); await settle();
  assert.equal(h.render().assigned.length, 0);
});
