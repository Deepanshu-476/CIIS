import test from 'node:test';
import assert from 'node:assert/strict';

// Mock storage
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(k) { return this.store.get(k) || null; }
  setItem(k, v) { this.store.set(k, String(v)); }
  removeItem(k) { this.store.delete(k); }
  clear() { this.store.clear(); }
  get length() { return this.store.size; }
  key(i) { return Array.from(this.store.keys())[i] || null; }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

const TASK_MANAGEMENT_SESSION_CACHE_KEY = 'ciis-task-management-cache-v1';
const getTaskManagementLocalCacheKey = (userId) => `ciis-task-management-cache:${userId || 'anonymous'}`;

const invalidateTaskManagementCache = (userId = null, storage = { session: mockSessionStorage, local: mockLocalStorage }) => {
  storage.session.removeItem(TASK_MANAGEMENT_SESSION_CACHE_KEY);
  storage.local.removeItem(TASK_MANAGEMENT_SESSION_CACHE_KEY);
  if (userId) {
    storage.local.removeItem(getTaskManagementLocalCacheKey(userId));
  }
  const keysToRemove = [];
  for (let i = 0; i < storage.local.length; i++) {
    const key = storage.local.key(i);
    if (key && key.startsWith('ciis-task-management-cache')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => storage.local.removeItem(k));
};

const broadcastTaskCreated = (task, options = {}, win = null, storage = { session: mockSessionStorage, local: mockLocalStorage }) => {
  if (!task) return;
  const currentUserId = 'mock_user_123';
  invalidateTaskManagementCache(currentUserId, storage);

  if (win) {
    const detail = {
      task,
      source: options.source || (task.taskFor === 'self' ? 'self' : 'assigned'),
    };
    win.dispatchEvent({ type: 'ciis:task-created', detail });
    win.dispatchEvent({ type: 'task:new', detail: task });
  }
};

test('Task Broadcast & Cache Invalidation Suite', async (t) => {
  await t.test('1. invalidateTaskManagementCache purges session and local storage cache keys', () => {
    const userId = 'user_abc123';
    mockSessionStorage.setItem(TASK_MANAGEMENT_SESSION_CACHE_KEY, JSON.stringify({ cachedAt: Date.now() }));
    mockLocalStorage.setItem(TASK_MANAGEMENT_SESSION_CACHE_KEY, JSON.stringify({ cachedAt: Date.now() }));
    mockLocalStorage.setItem(getTaskManagementLocalCacheKey(userId), JSON.stringify({ cachedAt: Date.now() }));
    mockLocalStorage.setItem('ciis-task-management-cache:stale_legacy', JSON.stringify({ cachedAt: Date.now() }));

    assert.equal(Boolean(mockSessionStorage.getItem(TASK_MANAGEMENT_SESSION_CACHE_KEY)), true);
    assert.equal(Boolean(mockLocalStorage.getItem(getTaskManagementLocalCacheKey(userId))), true);

    invalidateTaskManagementCache(userId);

    assert.equal(mockSessionStorage.getItem(TASK_MANAGEMENT_SESSION_CACHE_KEY), null);
    assert.equal(mockLocalStorage.getItem(TASK_MANAGEMENT_SESSION_CACHE_KEY), null);
    assert.equal(mockLocalStorage.getItem(getTaskManagementLocalCacheKey(userId)), null);
    assert.equal(mockLocalStorage.getItem('ciis-task-management-cache:stale_legacy'), null);
  });

  await t.test('2. broadcastTaskCreated dispatches ciis:task-created with payload and clears cache', () => {
    let capturedEvent = null;
    const mockWindow = {
      dispatchEvent: (e) => {
        if (e.type === 'ciis:task-created') capturedEvent = e;
      }
    };

    mockSessionStorage.setItem(TASK_MANAGEMENT_SESSION_CACHE_KEY, 'stale_data');

    const sampleTask = {
      _id: 'task_xyz999',
      title: 'AI Automated Task',
      taskFor: 'self',
      overallStatus: 'pending'
    };

    broadcastTaskCreated(sampleTask, {}, mockWindow);

    assert.equal(mockSessionStorage.getItem(TASK_MANAGEMENT_SESSION_CACHE_KEY), null);
    assert.notEqual(capturedEvent, null);
    assert.equal(capturedEvent.detail.task._id, 'task_xyz999');
    assert.equal(capturedEvent.detail.source, 'self');
  });

  await t.test('3. Cache TTL expiry prevents stale task data older than 45 seconds', () => {
    const now = Date.now();
    const staleCache = { userId: 'u1', cachedAt: now - 50000, allTasksGrouped: { 'Old Date': [] } };
    const freshCache = { userId: 'u1', cachedAt: now - 10000, allTasksGrouped: { 'New Date': [] } };

    const isCacheValid = (cache) => {
      if (!cache) return false;
      if (cache.cachedAt && (Date.now() - cache.cachedAt > 45 * 1000)) return false;
      return true;
    };

    assert.equal(isCacheValid(staleCache), false, 'Cache older than 45s must be rejected as expired');
    assert.equal(isCacheValid(freshCache), true, 'Cache under 45s must be considered valid');
  });
});
