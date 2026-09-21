import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('hover preload resolves mixed-case payroll and every canonical CRM route', async () => {
  const loaded = [];
  const modules = Object.fromEntries(fs.readdirSync(new URL('../src/crm/admin/', import.meta.url))
    .filter(name => name.endsWith('.jsx'))
    .map(name => [`../crm/admin/${name}`, async () => { loaded.push(name); }]));
  const source = fs.readFileSync(new URL('../src/utils/routePreloader.js', import.meta.url), 'utf8')
    .replace(/import\.meta\.glob\(\s*\[[\s\S]*?\]\s*\)/g, 'modules')
    .replace(/import\(("[^"]+")\)/g, 'load($1)')
    .replace(/export const /g, 'const ');
  const context = vm.createContext({ modules, load: async path => { loaded.push(path); } });
  vm.runInContext(`${source}\nglobalThis.preload = preloadRouteByPath; globalThis.paths = routeChunkPaths; globalThis.crmModuleCount = Object.keys(crmPageModules).length;`, context);
  await context.preload('/ciisUser/Payroll-Process/');
  assert.equal(loaded.pop(), '../payroll/pages/PayrollProcess.jsx');
  const crmPaths = context.paths.filter(path => path.includes('/crm/'));
  assert.equal(crmPaths.length, context.crmModuleCount);
  for (const path of crmPaths) await context.preload(path);
  assert.equal(loaded.length, context.crmModuleCount);
  await context.preload('/not-a-route');
  assert.equal(loaded.length, context.crmModuleCount);
});
