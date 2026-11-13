import { API_URL } from '../config';

// User Activity tracking (website side).
// - Every request to our own API carries X-Page-Path (the page the user is on) and
//   X-Client-App: web, so the server can log "who changed what, on which page".
// - Page views are queued with how long the page stayed open and sent in batches to
//   POST /api/activity/views. Only company pages (/ciisUser/...) are tracked.

const API_ORIGIN = (() => {
  try { return new URL(API_URL).origin; } catch { return ''; }
})();
const VIEWS_URL = `${String(API_URL).replace(/\/+$/, '')}/activity/views`;
const FLUSH_MS = 15000;
const MIN_VIEW_MS = 1000; // ignore pages that only flashed during a redirect

let queue = [];
let current = null;
let timer = null;

const isTrackedPath = pathname => /^\/ciisUser(\/|$)/i.test(String(pathname || ''));
const token = () => {
  try { return localStorage.getItem('token') || ''; } catch { return ''; }
};

// True for requests to our own backend (relative URLs or the API origin).
const isOwnApiRequest = config => {
  const url = String(config?.url || '');
  const base = String(config?.baseURL || '');
  const full = /^https?:\/\//i.test(url) ? url : `${base}${url}`;
  if (!/^https?:\/\//i.test(full)) return true;
  try { return new URL(full).origin === API_ORIGIN; } catch { return false; }
};

export const addActivityHeaders = config => {
  if (!isOwnApiRequest(config)) return config;
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  config.headers = config.headers || {};
  if (pathname) config.headers['X-Page-Path'] = pathname.slice(0, 300);
  config.headers['X-Client-App'] = 'web';
  return config;
};

export const flushPageViews = ({ useBeacon = false } = {}) => {
  if (!queue.length) return;
  const auth = token();
  if (!auth) { queue = []; return; }
  const views = queue.splice(0, 50);
  const body = JSON.stringify({ views });
  try {
    fetch(VIEWS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}`, 'X-Client-App': 'web' },
      body,
      keepalive: useBeacon,
    }).catch(() => {});
  } catch {
    // tracking must never break the page
  }
};

const closeCurrent = () => {
  if (!current) return;
  const durationMs = Date.now() - current.startedAt;
  if (durationMs >= MIN_VIEW_MS) {
    queue.push({ path: current.path, at: new Date(current.startedAt).toISOString(), durationMs });
  }
  current = null;
};

const ensureTimer = () => {
  if (timer || typeof window === 'undefined') return;
  timer = window.setInterval(() => flushPageViews(), FLUSH_MS);
  const onHide = () => {
    if (document.visibilityState === 'hidden') {
      // Count the time so far and keep the page "open" from now on.
      const path = current?.path;
      closeCurrent();
      if (path) current = { path, startedAt: Date.now() };
      flushPageViews({ useBeacon: true });
    }
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', () => { closeCurrent(); flushPageViews({ useBeacon: true }); });
};

// Call on every route change.
export const trackPageView = pathname => {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  if (current?.path === path) return;
  closeCurrent();
  if (!isTrackedPath(path) || !token()) return;
  current = { path, startedAt: Date.now() };
  ensureTimer();
};
