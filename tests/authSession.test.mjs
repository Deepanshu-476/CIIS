import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

test('web tabs ignore shared account storage and logout clears only the current tab', async () => {
  const adminTab = new JSDOM('', { url: 'https://ciis.example' }).window;
  const employeeTab = new JSDOM('', { url: 'https://ciis.example' }).window;
  const sharedStorage = adminTab.localStorage;
  Object.defineProperty(employeeTab, 'localStorage', { value: sharedStorage });
  sharedStorage.setItem('token', 'legacy-token');
  sharedStorage.setItem('themeMode', 'dark');

  try {
    globalThis.window = adminTab;
    globalThis.Event = adminTab.Event;
    const adminSession = await import('../src/utils/authSession.js?admin');
    adminSession.accountStorage.setItem('token', 'admin-token');
    adminSession.accountStorage.setItem('company', 'Admin company');

    globalThis.window = employeeTab;
    globalThis.Event = employeeTab.Event;
    const employeeSession = await import('../src/utils/authSession.js?employee');
    assert.equal(employeeSession.accountStorage.getItem('token'), null);
    employeeSession.accountStorage.setItem('token', 'employee-token');
    employeeSession.accountStorage.setItem('unreadCount', '12');

    let authChanges = 0;
    employeeTab.addEventListener(employeeSession.AUTH_SYNC_EVENT, () => { authChanges++; });
    employeeSession.endTabSession();

    assert.equal(employeeSession.accountStorage.getItem('token'), null);
    assert.equal(employeeSession.accountStorage.getItem('unreadCount'), null);
    assert.equal(adminSession.accountStorage.getItem('token'), 'admin-token');
    assert.equal(adminSession.accountStorage.getItem('company'), 'Admin company');
    assert.equal(sharedStorage.getItem('themeMode'), 'dark');
    assert.equal(authChanges, 1);
  } finally {
    delete globalThis.window;
    delete globalThis.Event;
    adminTab.close();
    employeeTab.close();
  }
});

test('the installed desktop app keeps its persisted login storage', async () => {
  const desktop = new JSDOM('', { url: 'https://ciis.example' }).window;
  desktop.electronAPI = {};
  desktop.localStorage.setItem('token', 'desktop-token');
  try {
    globalThis.window = desktop;
    const session = await import('../src/utils/authSession.js?desktop');
    assert.equal(session.accountStorage.getItem('token'), 'desktop-token');
  } finally {
    delete globalThis.window;
    desktop.close();
  }
});
