import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {transformSync} from 'esbuild';
import {JSDOM} from 'jsdom';
import * as policy from '../src/utils/subscriptionPolicy.js';

const require = createRequire(import.meta.url);
const dom = new JSDOM('<div id="root"></div><button id="edit">Edit</button><button id="view">View record</button>', {url: 'http://localhost/ciisUser/projects'});
Object.assign(globalThis, {window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true});
const React = require('react');
const {createRoot} = require('react-dom/client');
const {act} = React;
const runtime = await import('../src/utils/subscriptionRuntime.js');
const expired = {companyName: 'Test Company', subscriptionExpiry: '2020-01-01', subscriptionPlan: 'Created Premium'};
const catalog = [{_id: 'created-plan', name: 'Created Premium', price: 499, durationDays: 15, features: ['Projects included'], allowedPages: ['projects']}];

const loadComponent = (file, mocks) => {
  const code = transformSync(fs.readFileSync(file, 'utf8'), {loader: 'jsx', format: 'cjs', jsx: 'automatic'}).code;
  const module = {exports: {}};
  vm.runInNewContext(code, {module, exports: module.exports, setInterval, clearInterval, window, document, localStorage, Event,
    require: name => name in mocks ? mocks[name] : name.endsWith('.css') ? {} : require(name)});
  return module.exports.default;
};
const findButton = label => [...document.querySelectorAll('button')].find(button => button.textContent === label);
const click = async element => act(async () => {element.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true, cancelable: true}));});

test('web expired company can view, action opens created plans, and renewal restores actions', async () => {
  const auth = {token: 'session', user: {email: 'owner@example.com', jobRole: 'super_admin'}};
  localStorage.setItem('token', auth.token);
  let renewed = false, writes = 0, views = 0;
  const requests = [];
  const api = {get: async path => {requests.push(path); return {data: path === '/plans' ? {plans: catalog} : {company: renewed ? {...expired, subscriptionExpiry: '2099-01-01'} : expired}};}};
  const Guard = loadComponent(new URL('../src/components/SubscriptionGuard.jsx', import.meta.url), {
    '../context/AuthContext': {useAuth: () => auth}, '../utils/axiosConfig': api,
    '../utils/subscriptionPolicy': policy, '../utils/subscriptionRuntime': runtime,
  });
  const root = createRoot(document.getElementById('root'));
  document.getElementById('edit').onclick = () => writes++;
  document.getElementById('view').onclick = () => views++;
  try {
    await act(async () => root.render(React.createElement(Guard)));
    assert.match(document.body.textContent, /Plan expired/);
    await click(document.getElementById('view')); assert.equal(views, 1);
    await click(document.getElementById('edit')); assert.equal(writes, 0);
    assert.equal(document.querySelector('[role="dialog"]').getAttribute('aria-label'), 'Plan expired');
    assert.match(document.body.textContent, /Created Premium/);
    assert.match(document.body.textContent, /499 \/ 15 days/);
    assert.match(document.body.textContent, /Projects included/);
    assert.ok(requests.includes('/plans'));
    await act(async () => { assert.throws(() => runtime.guardSubscriptionRequest({method: 'POST', url: '/projects'}), /Plan expired/); });
    assert.doesNotThrow(() => runtime.guardSubscriptionRequest({method: 'GET', url: '/projects'}));
    renewed = true;
    await click(findButton('Check renewal status'));
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(document.querySelector('.subscription-notice'), null);
    await click(document.getElementById('edit')); assert.equal(writes, 1);
  } finally { await act(async () => root.unmount()); localStorage.clear(); }
});

test('app expired-plan modal renders the actual catalog, preserves viewing and refreshes renewal', async () => {
  const auth = {token: 'mobile-session', user: {email: 'owner@example.com'}, companyDetails: expired};
  const context = React.createContext(auth);
  const listeners = new Map();
  const emitter = {addListener: (event, fn) => {listeners.set(event, fn); return {remove: () => listeners.delete(event)};}};
  let renewed = false;
  const api = {get: async path => ({data: path === '/plans' ? {plans: catalog} : {company: renewed ? {...expired, subscriptionExpiry: '2099-01-01'} : expired}})};
  const native = {
    AppState: {addEventListener: () => ({remove() {}})}, DeviceEventEmitter: emitter,
    StyleSheet: {create: styles => styles},
    View: ({children}) => React.createElement('div', null, children),
    Text: ({children}) => React.createElement('span', null, children),
    ScrollView: ({children}) => React.createElement('div', null, children),
    TouchableOpacity: ({children, onPress}) => React.createElement('button', {onClick: onPress}, children),
    Modal: ({children, visible}) => visible ? React.createElement('section', {role: 'dialog'}, children) : null,
  };
  const Guard = loadComponent(new URL('../../CIISMobile/src/components/SubscriptionGuard.js', import.meta.url), {
    'react-native': native, '../context/AuthContext': {AuthContext: context},
    '../context/runtimeAuth': {getRuntimeAuth: () => auth}, '../api/client': api,
    '../utils/subscriptionPolicy': policy, '../utils/subscriptionRuntime': {setSubscriptionCompany() {}},
  });
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(Guard)));
    assert.match(document.body.textContent, /Plan expired/);
    await act(async () => listeners.get('ciis-plan-expired')());
    assert.ok(document.querySelector('[role="dialog"]'));
    assert.match(document.body.textContent, /Created Premium/);
    assert.match(document.body.textContent, /499 \/ 15 days/);
    await click(findButton('Continue viewing'));
    assert.equal(document.querySelector('[role="dialog"]'), null);
    await click(findButton('View plans'));
    renewed = true;
    await click(findButton('Check renewal status'));
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(document.getElementById('root').textContent, '');
  } finally { await act(async () => root.unmount()); }
});
