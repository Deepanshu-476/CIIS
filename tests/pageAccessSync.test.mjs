import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { transformSync } from 'esbuild';
import { CRM_PAGES, resolveCrmPermissionPath } from '../src/config/crmPages.js';
import { TELECALLER_PAGES } from '../src/crm/telecaller/telecallerPages.js';

const require = createRequire(import.meta.url);
const loadPageAccessModule = () => {
  const code = transformSync(fs.readFileSync(path.resolve('src/utils/pageAccess.js'), 'utf8'), {
    loader: 'js',
    format: 'cjs',
  }).code;
  const module = { exports: {} };
  const mocks = {
    './authSession': { accountStorage: new Map() },
    './axiosConfig': { get: async () => ({ data: {} }) },
    '../config/crmPages': { CRM_PAGES, resolveCrmPermissionPath },
    '../crm/telecaller/telecallerPages': { TELECALLER_PAGES },
  };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => (name in mocks ? mocks[name] : require(name)),
    Date,
    Map,
    Set,
    Promise,
  });
  return module.exports;
};

const { getManagedPermissionPath, hasPageAccess, hasConfiguredPageAccess, getCatalogAccessPages } = loadPageAccessModule();

test('getManagedPermissionPath normalizes aliases across Sidebar, Plan, and Page Management', () => {
  assert.equal(getManagedPermissionPath('/ciisUser/asset-management'), '/ciisuser/company-assets');
  assert.equal(getManagedPermissionPath('/ciisUser/job-role-management'), '/ciisuser/jobrolemanagement');
  assert.equal(getManagedPermissionPath('/ciisUser/employee-leaves'), '/ciisuser/emp-leaves');
  assert.equal(getManagedPermissionPath('/ciisUser/create-task'), '/ciisuser/task-management');
  assert.equal(getManagedPermissionPath('/ciisUser/company-all-tasks'), '/ciisuser/company-all-task');
  assert.equal(getManagedPermissionPath('/ciisUser/client-management'), '/ciisuser/emp-client');
  assert.equal(getManagedPermissionPath('/ciisUser/create-employee-meeting'), '/ciisuser/admin-meeting');
});

test('getCatalogAccessPages preserves requiresExplicitGrant and view access grants', () => {
  const userId = '507f1f77bcf86cd799439011';
  const catalog = {
    accessPages: [
      { pageKey: 'create-alert', path: '/ciisUser/create-alert', editUsers: [userId], viewUsers: [userId] },
      { pageKey: 'client-plans', path: '/ciisUser/client-plans', editUsers: [], viewUsers: [] },
    ],
    managedPages: [
      { pageKey: 'create-alert', path: '/ciisUser/create-alert', entitled: true, requiresExplicitGrant: false },
      { pageKey: 'client-plans', path: '/ciisUser/client-plans', entitled: true, requiresExplicitGrant: true },
    ],
  };

  const merged = getCatalogAccessPages(catalog);
  const createAlert = merged.find(p => p.pageKey === 'create-alert');
  const clientPlans = merged.find(p => p.pageKey === 'client-plans');

  assert.equal(createAlert.requiresExplicitGrant, false);
  assert.equal(hasPageAccess(createAlert, userId, 'view'), true);
  assert.equal(hasConfiguredPageAccess(createAlert), true);

  assert.equal(clientPlans.requiresExplicitGrant, true);
  assert.equal(hasPageAccess(clientPlans, userId, 'view'), false);
  assert.equal(hasConfiguredPageAccess(clientPlans), false);
});

test('PageManagement auto-grants viewIds when assigning non-view access tabs', () => {
  const src = fs.readFileSync(path.resolve('src/admin/page/PageManagement.jsx'), 'utf8');
  assert.match(src, /viewUsers:\s*normalizeUserIds\(page\?\.viewUsers\s*\?\?\s*page\?\.explicitViewUsers\s*\?\?\s*\[\]\)/);
  assert.match(src, /nextPermissions\.viewIds\s*=\s*normalizeUserIds\(\[\.\.\.nextPermissions\.viewIds,\s*\.\.\.selectedIds\]\)/);
});

test('Sidebar surfaces pages explicitly granted in Page Management and adds company-assets and client-plans', () => {
  const src = fs.readFileSync(path.resolve('src/hrCds/Sidebar.jsx'), 'utf8');
  assert.match(src, /id:\s*'company-assets'/);
  assert.match(src, /id:\s*'client-plans'/);
  assert.match(src, /const grantedItems = Array\.isArray\(pagePermissions\)/);
  assert.match(src, /hasPageAccess\(managedPageFor\('\/ciisuser\/client-plans'\), userId, 'view'\)/);
});

test('Auto full-permission pages grant all actions when entitled and assigned', () => {
  const userId = '507f1f77bcf86cd799439011';
  const catalog = {
    accessPages: [
      { pageKey: 'register-request', path: '/ciisUser/register-request', viewUsers: [] },
      { pageKey: 'company-all-task-tasks', path: '/ciisUser/company-all-task/tasks', viewUsers: [userId] },
    ],
    managedPages: [
      { pageKey: 'register-request', path: '/ciisUser/register-request', entitled: true, requiresExplicitGrant: false, autoFullAccess: true, hasAutoFullAccess: true },
      { pageKey: 'company-all-task-tasks', path: '/ciisUser/company-all-task/tasks', entitled: true, requiresExplicitGrant: false, autoFullAccess: true },
    ],
  };

  const merged = getCatalogAccessPages(catalog);
  const registerPage = merged.find(p => p.pageKey === 'register-request');
  const tasksPage = merged.find(p => p.pageKey === 'company-all-task-tasks');

  for (const action of ['view', 'edit', 'approve', 'delete']) {
    assert.equal(hasPageAccess(registerPage, userId, action), true);
    assert.equal(hasPageAccess(tasksPage, userId, action), true);
  }
});
