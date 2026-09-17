import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function harness(get) {
  const values = new Map([['user', JSON.stringify({ _id: 'alice', company: 'a' })], ['token', 'a-token']]);
  const storage = { getItem: key => values.get(key) || null };
  const context = vm.createContext({ axios: { get }, localStorage: storage, sessionStorage: storage });
  const source = fs.readFileSync(new URL('../src/utils/pageAccess.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export const /g, 'const ');
  vm.runInContext(`${source}\nglobalThis.api = { loadPagePermission, loadPagePermissionCatalog, invalidatePagePermissionCache, hasPageAccess };`, context);
  return { ...context.api, values };
}

const paths = ['/ciisUser/payroll-process', '/ciisUser/crm/admin/dashboard'];
const catalog = user => ({ data: { pages: [], accessPages: paths.map(path => ({ path, viewUsers: [user] })) } });

test('concurrent sidebar and page checks share one batch and reuse it on navigation', async () => {
  let requests = 0;
  const api = harness(async () => { requests++; return catalog('alice'); });
  const [page] = await Promise.all([api.loadPagePermission(paths[0]), api.loadPagePermissionCatalog(), api.loadPagePermission(paths[1])]);
  assert.equal(requests, 1);
  assert.equal(api.hasPageAccess(page, 'alice'), true);
  assert.equal(api.hasPageAccess(page, 'bob'), false);
  await api.loadPagePermission(paths[0].toLowerCase() + '/');
  assert.equal(requests, 1);
});

test('switching accounts cannot reuse another account permission cache', async () => {
  let requests = 0;
  const api = harness(async () => catalog(++requests === 1 ? 'alice' : 'bob'));
  await api.loadPagePermission(paths[0]);
  api.values.set('user', JSON.stringify({ _id: 'bob', company: 'b' }));
  api.values.set('token', 'b-token');
  const page = await api.loadPagePermission(paths[0]);
  assert.equal(requests, 2);
  assert.equal(api.hasPageAccess(page, 'alice'), false);
});

test('invalidating a page reloads the batch and does not restore an in-flight stale page', async () => {
  let resolveFirst;
  let requests = 0;
  const api = harness(() => ++requests === 1 ? new Promise(resolve => { resolveFirst = resolve; }) : Promise.resolve(catalog('bob')));
  const first = api.loadPagePermission(paths[0]);
  api.invalidatePagePermissionCache(paths[0]);
  const updated = await api.loadPagePermission(paths[0]);
  resolveFirst(catalog('alice'));
  await first;
  assert.equal(api.hasPageAccess(updated, 'bob'), true);
  assert.equal(api.hasPageAccess(await api.loadPagePermission(paths[0]), 'bob'), true);
  assert.equal(requests, 2);
});

test('older server catalog falls back to by-path and shares concurrent requests', async () => {
  const requests = [];
  const api = harness(async url => {
    requests.push(url);
    return url.endsWith('/pages') ? { data: { pages: [] } } : { data: { page: { path: paths[0], viewUsers: [] } } };
  });
  const [page] = await Promise.all([api.loadPagePermission(paths[0]), api.loadPagePermission(paths[0])]);
  assert.deepEqual(requests, ['/page-permissions/pages', '/page-permissions/by-path']);
  assert.equal(api.hasPageAccess(page, 'alice'), false);
});
