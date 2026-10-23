import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useSocket } from '../context/SocketContext';
import socketService from '../services/socket';

// Module-level deduplication cache to ensure a task only triggers ONE toast
// across the entire application even if multiple components/layouts mount the hook.
const MAX_RECENT_IDS = 50;
const recentTaskIds = new Set();
const recentIdsQueue = [];

export const recordAndCheckSeen = (id) => {
  if (!id) return false;
  const idStr = String(id);
  if (recentTaskIds.has(idStr)) return true;
  recentTaskIds.add(idStr);
  recentIdsQueue.push(idStr);
  if (recentIdsQueue.length > MAX_RECENT_IDS) {
    const oldest = recentIdsQueue.shift();
    if (oldest) recentTaskIds.delete(oldest);
  }
  return false;
};

/**
 * Marks a task ID as already seen/created by the current user so the creator
 * does not receive a redundant "Naya task mila" toast when the socket broadcasts.
 */
export const markTaskIdAsCreated = (id) => {
  if (!id) return;
  recordAndCheckSeen(id);
};

export const TASK_MANAGEMENT_SESSION_CACHE_KEY = 'ciis-task-management-cache-v1';
export const getTaskManagementLocalCacheKey = (userId) => `ciis-task-management-cache:${userId || 'anonymous'}`;

export const invalidateTaskManagementCache = (userId = null) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TASK_MANAGEMENT_SESSION_CACHE_KEY);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TASK_MANAGEMENT_SESSION_CACHE_KEY);
      const targetUserId = userId || getCurrentUserId();
      if (targetUserId) {
        localStorage.removeItem(getTaskManagementLocalCacheKey(targetUserId));
      }
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ciis-task-management-cache')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('[invalidateTaskManagementCache] Failed to clear task cache:', err);
  }
};

export const broadcastTaskCreated = (task, options = {}) => {
  if (!task) return;
  const taskId = String(task._id || task.id || '');
  if (taskId) {
    markTaskIdAsCreated(taskId);
  }
  const currentUserId = getCurrentUserId();
  invalidateTaskManagementCache(currentUserId);

  if (typeof window !== 'undefined') {
    const detail = {
      task,
      source: options.source || (task.taskFor === 'self' ? 'self' : 'assigned'),
    };
    window.dispatchEvent(new CustomEvent('ciis:task-created', { detail }));
    window.dispatchEvent(new CustomEvent('task:new', { detail: task }));
  }
};

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return String(parsed?._id || parsed?.id || parsed?.userId || '');
  } catch {
    return null;
  }
};

/**
 * useTaskRealtime
 * Subscribes to 'task:new' on the active socket.
 * - Dedupes by task._id (Set of last 50 IDs)
 * - Shows toast: "Naya task mila: <title>" ONLY if not duplicate and not created by current user
 * - Invokes optional onNewTask(task) callback
 * - Cleans up listener on unmount
 *
 * @param {Object} [options]
 * @param {Function} [options.onNewTask] - Callback invoked when a new task is received
 * @param {boolean} [options.showToast=true] - Whether to show the toast notification
 */
export const useTaskRealtime = (options = {}) => {
  const { onNewTask, showToast = true } = options;
  const socketContext = useSocket();
  const socket = socketContext?.socket || socketService.socket;
  const onNewTaskRef = useRef(onNewTask);

  useEffect(() => {
    onNewTaskRef.current = onNewTask;
  }, [onNewTask]);

  useEffect(() => {
    const activeSocket = socket || socketService.socket;

    const handleTaskNew = (task) => {
      if (!task) return;
      const taskId = String(task._id || task.id || '');
      const isDuplicate = recordAndCheckSeen(taskId);

      // Identify whether this task was created by the currently logged-in user
      const creatorId = String(
        task.createdBy?._id || task.createdBy || task.creator?._id || task.creator || ''
      );
      const currentUserId = getCurrentUserId();
      const isCreatedByMe = Boolean(currentUserId && creatorId && currentUserId === creatorId);

      // Do not show "Naya task mila" toast if duplicate or if creator created it
      if (!isDuplicate && !isCreatedByMe && showToast) {
        const title = task.title || task.name || 'Task';
        toast.info(`Naya task mila: ${title}`);
      }

      if (typeof onNewTaskRef.current === 'function') {
        try {
          onNewTaskRef.current(task);
        } catch (err) {
          console.error('[useTaskRealtime] error in onNewTask callback:', err);
        }
      }
    };

    const handleWindowTaskCreated = (e) => {
      const task = e?.detail?.task || e?.detail;
      if (!task) return;
      if (typeof onNewTaskRef.current === 'function') {
        try {
          onNewTaskRef.current(task);
        } catch (err) {
          console.error('[useTaskRealtime] error in onNewTask callback from window event:', err);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ciis:task-created', handleWindowTaskCreated);
    }

    if (activeSocket) {
      activeSocket.on('task:new', handleTaskNew);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ciis:task-created', handleWindowTaskCreated);
      }
      if (activeSocket) {
        activeSocket.off('task:new', handleTaskNew);
      }
    };
  }, [socket, showToast]);
};

export default useTaskRealtime;
