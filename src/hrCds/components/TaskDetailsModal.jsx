import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiX,
  FiClock,
  FiActivity,
  FiLayers,
  FiCalendar,
  FiFlag,
  FiUser,
  FiChevronDown,
  FiPaperclip,
  FiSend,
  FiDownload,
  FiMaximize2,
  FiMinimize2,
  FiFileText,
  FiCheck,
  FiRefreshCw,
  FiArrowUpRight,
  FiInfo,
  FiMessageSquare,
  FiFolder,
  FiImage,
  FiZoomIn,
  FiEye,
  FiExternalLink
} from 'react-icons/fi';
import axios from '../../utils/axiosConfig';
import API_URL, { API_URL_IMG } from '../../config';
import './TaskDetailsModal.css';

// Helper to format seconds into "Xh Ym" or "Ym Zs" or "Xs"
const formatDuration = (totalSeconds = 0) => {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
};

const formatTimeOnly = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getRemarkImagePath = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || image.path || image.image || image.filename || '';
};

const isImageFile = (pathOrName = '') => {
  if (!pathOrName) return false;
  const clean = String(pathOrName).split('?')[0].toLowerCase();
  return (
    /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i.test(clean) ||
    clean.startsWith('data:image/') ||
    clean.includes('/uploads/') ||
    clean.includes('client-remarks') ||
    clean.includes('remarks')
  );
};

const getRemarkImages = (remark) => {
  if (!remark) return [];
  const list = [];

  // 1. Array of images (ClientTask model)
  if (Array.isArray(remark.images)) {
    remark.images.forEach((img) => {
      const p = getRemarkImagePath(img);
      if (p) list.push(p);
    });
  }

  // 2. Array of attachments
  if (Array.isArray(remark.attachments)) {
    remark.attachments.forEach((att) => {
      const p = getRemarkImagePath(att);
      if (p && isImageFile(p)) list.push(p);
    });
  }

  // 3. Array of files
  if (Array.isArray(remark.files)) {
    remark.files.forEach((f) => {
      const p = getRemarkImagePath(f);
      if (p && isImageFile(p)) list.push(p);
    });
  }

  // 4. Single image (Task / Project models)
  if (remark.image) {
    const p = getRemarkImagePath(remark.image);
    if (p) list.push(p);
  }

  // 5. Single file
  if (remark.file) {
    const p = getRemarkImagePath(remark.file);
    if (p && isImageFile(p)) list.push(p);
  }

  return [...new Set(list.filter(Boolean))];
};

const getImageUrl = (rawPath) => {
  if (!rawPath) return '';
  if (
    typeof rawPath === 'string' &&
    (rawPath.startsWith('http://') ||
      rawPath.startsWith('https://') ||
      rawPath.startsWith('data:') ||
      rawPath.startsWith('blob:'))
  ) {
    return rawPath;
  }

  const baseUrl = API_URL;
  const baseUrlWithoutApi = baseUrl.replace(/\/api\/?$/, '');
  let cleanPath = String(rawPath).replace(/\\/g, '/').replace(/^\/+/, '');

  if (cleanPath.startsWith('uploads/client-remarks/')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  if (cleanPath.startsWith('client-remarks/')) {
    return `${baseUrlWithoutApi}/uploads/${cleanPath}`;
  }
  if (cleanPath.startsWith('uploads/remarks/')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  if (cleanPath.startsWith('remarks/')) {
    return `${baseUrlWithoutApi}/uploads/${cleanPath}`;
  }
  if (cleanPath.startsWith('uploads/')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }
  if (cleanPath.includes('client-remarks')) {
    return `${baseUrlWithoutApi}/${cleanPath}`;
  }

  const filename = cleanPath.split('/').pop();
  return `${baseUrlWithoutApi}/uploads/client-remarks/${filename}`;
};

const handleRemarkImageError = (e, originalPath) => {
  const filename = String(originalPath || '').split('/').pop();
  if (!filename) {
    e.target.style.display = 'none';
    return;
  }
  const baseUrlWithoutApi = API_URL.replace(/\/api\/?$/, '');
  const fallbacks = [
    `${baseUrlWithoutApi}/uploads/client-remarks/${filename}`,
    `${baseUrlWithoutApi}/uploads/remarks/${filename}`,
    `${baseUrlWithoutApi}/uploads/remarks/client-remarks/${filename}`,
    `${baseUrlWithoutApi}/uploads/${filename}`,
    `${baseUrlWithoutApi}/${filename}`,
  ];

  const currentTry = parseInt(e.target.dataset.tryIndex || '0', 10);
  if (currentTry < fallbacks.length) {
    e.target.dataset.tryIndex = String(currentTry + 1);
    e.target.src = fallbacks[currentTry];
  } else {
    e.target.style.display = 'none';
  }
};

const formatDateOnly = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatFullDateTime = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  return `${formatDateOnly(d)}, ${formatTimeOnly(d)}`;
};

const getInitials = (name = '') => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'in-progress': { label: 'In Progress', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  inprogress: { label: 'In Progress', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  onhold: { label: 'On Hold', color: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe' },
  'on-hold': { label: 'On Hold', color: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe' },
  completed: { label: 'Completed', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  overdue: { label: 'Overdue', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  reopen: { label: 'Reopen', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
};

const normalizeStatus = (status = 'pending') => {
  const raw = String(status || 'pending').toLowerCase().trim();
  if (raw === 'in-progress' || raw === 'inprogress' || raw === 'in progress' || raw === 'in_progress') return 'in-progress';
  if (raw === 'onhold' || raw === 'on-hold' || raw === 'on hold' || raw === 'on_hold') return 'onhold';
  if (raw === 'completed' || raw === 'complete') return 'completed';
  if (raw === 'pending') return 'pending';
  if (raw === 'reopen' || raw === 're-open') return 'reopen';
  if (raw === 'rejected') return 'rejected';
  if (raw === 'overdue') return 'overdue';
  const clean = raw.replace(/_/g, '-').replace(/\s+/g, '-');
  return STATUS_CONFIG[clean] ? clean : 'pending';
};

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  medium: { label: 'Medium Priority', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  low: { label: 'Low Priority', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' }
};

// Helper to accurately resolve log event status destination
const resolveLogEventType = (log) => {
  // ActivityLog records expose the destination in `newValues.status`, while
  // status-history fallback records expose it directly as `status`. Support
  // both shapes; otherwise a hold/resume event is silently treated as generic
  // activity and the time journey cannot be reconstructed.
  const newS = String(log?.newValues?.status || log?.status || '').toLowerCase().trim();
  if (newS) {
    if (newS === 'in-progress' || newS === 'inprogress' || newS === 'in progress' || newS === 'in_progress') return 'in-progress';
    if (newS === 'onhold' || newS === 'on-hold' || newS === 'on hold' || newS === 'on_hold') return 'onhold';
    if (newS === 'completed' || newS === 'complete') return 'completed';
    if (newS === 'pending') return 'pending';
    if (newS === 'reopen' || newS === 're-open') return 'reopen';
  }

  const title = String(log?.title || '').toLowerCase().trim();
  if (title.includes('→')) {
    const dest = title.split('→').pop().trim();
    if (dest.includes('complete')) return 'completed';
    if (dest.includes('hold') || dest.includes('pause')) return 'onhold';
    if (dest.includes('progress') || dest.includes('start') || dest.includes('resume')) return 'in-progress';
    if (dest.includes('pending')) return 'pending';
  }

  const desc = String(log?.description || log?.details || log?.remarks || '').toLowerCase().trim();
  if (desc.includes('to completed') || desc.includes('marked as complete')) return 'completed';
  if (desc.includes('to on hold') || desc.includes('to on-hold') || desc.includes('to onhold') || desc.includes('tracking paused')) return 'onhold';
  if (desc.includes('to in progress') || desc.includes('to in-progress') || desc.includes('to inprogress') || desc.includes('tracking resumed') || desc.includes('tracking started')) return 'in-progress';
  if (desc.includes('to pending') || desc.includes('task created')) return 'pending';

  const act = String(log?.action || log?.status || '').toLowerCase().trim();
  if (act === 'completed' || act.includes('complete')) return 'completed';
  if (act === 'onhold' || act === 'on-hold' || act.includes('hold') || act.includes('pause')) return 'onhold';
  if (act === 'in-progress' || act === 'inprogress' || act.includes('progress') || act.includes('start') || act.includes('resume')) return 'in-progress';
  if (act === 'pending' || act.includes('create')) return 'pending';

  return 'other';
};

const TaskDetailsModal = ({
  open,
  task,
  onClose,
  onStatusChange,
  onRemarkAdded,
  employeeInfo,
  canEdit = true,
  mentionUsers = []
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [howTrackingOpen, setHowTrackingOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [selectedMentionIds, setSelectedMentionIds] = useState([]);
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState(null); // 'header' | 'footer' | null
  const [liveSessionSeconds, setLiveSessionSeconds] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);

  const remarkInputRef = useRef(null);
  const statusMenuRef = useRef(null);
  const footerStatusMenuRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Close status dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedHeaderMenu = statusMenuRef.current?.contains(e.target);
      const clickedFooterMenu = footerStatusMenuRef.current?.contains(e.target);
      if (!clickedHeaderMenu && !clickedFooterMenu) {
        setOpenStatusMenu(null);
      }
    };
    if (openStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openStatusMenu]);

  const safeTask = task || {};
  const currentStatus = normalizeStatus(safeTask.status || safeTask.overallStatus);
  const priority = String(safeTask.priority || 'medium').toLowerCase();
  const priorityConf = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const statusConf = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['in-progress'];

  // Dynamic Assignee Information
  const assigneeName = safeTask.assignee || safeTask.assignedUser?.name || (Array.isArray(safeTask.assignedTo) ? safeTask.assignedTo[0]?.name : safeTask.assignedTo?.name) || employeeInfo?.name || employeeInfo?.fullName || 'Assignee';
  const assigneeRole = employeeInfo?.role || employeeInfo?.designation || employeeInfo?.jobRole;
  const assigneeDept = employeeInfo?.department?.name || employeeInfo?.department;
  const assigneeSummary = [assigneeName, assigneeRole, assigneeDept].filter(Boolean).join(' · ');
  const projectName = safeTask.projectName || safeTask.project?.name || safeTask.project?.title || (typeof safeTask.project === 'string' ? safeTask.project : '');
  const clientName = safeTask.clientName || safeTask.client?.name || safeTask.client?.companyName || safeTask.clientId?.client || safeTask.clientId?.name || safeTask.clientId?.company || (typeof safeTask.client === 'string' ? safeTask.client : '');
  const isPersonal = safeTask.taskFor === 'self' || safeTask.isSelfTask;
  const isClient = safeTask.source === 'client' || Boolean(safeTask.clientId || clientName);
  const isProject = safeTask.source === 'project' || Boolean(safeTask.projectId || projectName);

  const taskTypeTag = isPersonal
    ? 'Personal Task'
    : isClient
      ? 'Client Task'
      : isProject
        ? 'Project Task'
        : 'Company Task';

  // Dynamic Dates
  const createdDate = safeTask.createdAt || safeTask.createdTime;
  const dueDate = safeTask.dueDate || safeTask.dueDateTime || safeTask.completionDate;
  const updatedDate = safeTask.updatedAt || safeTask.lastActivityAt || createdDate;

  // Dynamic Activity Logs, Remarks & Files
  const rawActivities = Array.isArray(safeTask.activityLogs) ? safeTask.activityLogs : (Array.isArray(safeTask.statusHistory) ? safeTask.statusHistory : (Array.isArray(safeTask.activities) ? safeTask.activities : []));
  const rawRemarks = Array.isArray(safeTask.remarks) ? safeTask.remarks : [];

  // All Attachments & Uploaded Images (collected from all task fields + remarks)
  const allAttachments = useMemo(() => {
    const list = [];
    const pushItem = (item) => {
      if (!item) return;
      if (typeof item === 'string') {
        const raw = item.trim();
        if (!raw) return;
        const filename = raw.split('/').pop().split('\\').pop() || 'Attachment';
        list.push({
          filename,
          originalName: filename,
          path: raw,
          url: getImageUrl(raw),
          isImage: isImageFile(raw)
        });
      } else if (typeof item === 'object') {
        const rawPath = item.path || item.url || item.image || item.filename || item.file || '';
        const filename = item.originalName || item.filename || item.name || (rawPath ? rawPath.split('/').pop().split('\\').pop() : 'Attachment');
        const url = getImageUrl(rawPath) || item.url || (rawPath.startsWith('http') ? rawPath : '');
        list.push({
          ...item,
          filename,
          originalName: filename,
          path: rawPath,
          url: url || rawPath,
          size: item.size,
          uploadedAt: item.uploadedAt || item.createdAt || item.timestamp,
          isImage: isImageFile(rawPath || filename)
        });
      }
    };

    if (Array.isArray(safeTask.files)) safeTask.files.forEach(pushItem);
    if (Array.isArray(safeTask.attachments)) safeTask.attachments.forEach(pushItem);
    if (Array.isArray(safeTask.images)) safeTask.images.forEach(pushItem);
    if (safeTask.image) pushItem(safeTask.image);
    if (safeTask.file) pushItem(safeTask.file);
    if (Array.isArray(safeTask.documents)) safeTask.documents.forEach(pushItem);

    if (Array.isArray(safeTask.remarks)) {
      safeTask.remarks.forEach((r) => {
        const rImages = getRemarkImages(r);
        rImages.forEach((img) => pushItem(img));
      });
    }

    const seen = new Set();
    return list.filter((f) => {
      const key = f.url || f.path || f.filename;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [safeTask.files, safeTask.attachments, safeTask.images, safeTask.image, safeTask.file, safeTask.documents, safeTask.remarks]);

  const rawFiles = allAttachments;
  const imageAttachments = useMemo(() => allAttachments.filter((f) => f.isImage), [allAttachments]);

  // Parse time spent & sessions
  const isCurrentlyRunning = currentStatus === 'in-progress';

  // Robust calculation of when the task actually started running
  const resolvedInProgressStart = useMemo(() => {
    if (!task || !isCurrentlyRunning) return null;

    // 1. Explicit in-progress timestamp field
    if (task.inProgressSince) {
      const d = new Date(task.inProgressSince);
      if (!isNaN(d.getTime())) return d;
    }
    if (task.startedAt) {
      const d = new Date(task.startedAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (task.startTime) {
      const d = new Date(task.startTime);
      if (!isNaN(d.getTime())) return d;
    }

    // 2. Find the latest "in-progress" destination log in activityLogs
    if (Array.isArray(rawActivities) && rawActivities.length > 0) {
      const inProgressLogs = rawActivities.filter(log => resolveLogEventType(log) === 'in-progress');
      if (inProgressLogs.length > 0) {
        const lastLog = inProgressLogs[inProgressLogs.length - 1];
        const logDate = new Date(lastLog.createdAt || lastLog.changedAt || lastLog.timestamp || lastLog.date);
        if (!isNaN(logDate.getTime())) {
          return logDate;
        }
      }
    }

    // 3. Fall back to updatedAt or createdAt
    if (task.updatedAt) {
      const d = new Date(task.updatedAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (task.createdAt) {
      const d = new Date(task.createdAt);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  }, [isCurrentlyRunning, task, rawActivities]);

  // Dynamic Live timer ticker based on actual start time
  useEffect(() => {
    if (!isCurrentlyRunning || !resolvedInProgressStart) {
      setLiveSessionSeconds(0);
      return;
    }
    const updateSession = () => {
      const now = new Date();
      const diffSecs = Math.max(0, Math.floor((now.getTime() - resolvedInProgressStart.getTime()) / 1000));
      setLiveSessionSeconds(diffSecs);
    };
    updateSession();
    const interval = setInterval(updateSession, 1000);
    return () => clearInterval(interval);
  }, [isCurrentlyRunning, resolvedInProgressStart]);

  // Base accumulated seconds from database
  const baseAccumulatedSeconds = useMemo(() => {
    return Number(task?.timeSpent || task?.workTime?.seconds || task?.timeTracking?.totalSeconds || 0);
  }, [task?.timeSpent, task?.workTime, task?.timeTracking]);

  // 1. Comprehensive Lifecycle & Work Sessions Extraction from Activity Logs
  const lifecycleData = useMemo(() => {
    const sortedLogs = [...rawActivities].sort((a, b) => {
      const tA = new Date(a.createdAt || a.changedAt || a.timestamp || a.date || 0).getTime();
      const tB = new Date(b.createdAt || b.changedAt || b.timestamp || b.date || 0).getTime();
      return tA - tB;
    });

    const completedSessionsList = [];
    let holdDurationSum = 0;
    let lastHoldStartTime = null;
    let activeSessionStartTime = null;
    let firstSessionStartTime = null;
    let firstHoldStartTime = null;
    let resumeSessionStartTime = null;
    let completedTimestamp = task?.completedAt ? new Date(task.completedAt) : null;

    if (task?.holdStartedAt) {
      firstHoldStartTime = new Date(task.holdStartedAt);
    }

    sortedLogs.forEach((log) => {
      const logDate = new Date(log.createdAt || log.changedAt || log.timestamp || log.date || 0);
      if (isNaN(logDate.getTime())) return;

      const eventType = resolveLogEventType(log);

      if (eventType === 'in-progress') {
        if (!firstSessionStartTime) {
          firstSessionStartTime = logDate;
        } else if (lastHoldStartTime) {
          resumeSessionStartTime = logDate;
        }

        if (lastHoldStartTime) {
          const holdDiff = Math.max(0, Math.floor((logDate.getTime() - lastHoldStartTime.getTime()) / 1000));
          holdDurationSum += holdDiff;
          lastHoldStartTime = null;
        }

        activeSessionStartTime = logDate;
      } else if (eventType === 'onhold') {
        if (!firstHoldStartTime) {
          firstHoldStartTime = logDate;
        }
        lastHoldStartTime = logDate;

        if (activeSessionStartTime) {
          const durSec = Math.max(0, Math.floor((logDate.getTime() - activeSessionStartTime.getTime()) / 1000));
          completedSessionsList.push({
            id: completedSessionsList.length + 1,
            startStr: formatTimeOnly(activeSessionStartTime),
            endStr: formatTimeOnly(logDate),
            durationStr: formatDuration(durSec),
            durationSeconds: durSec,
            start: activeSessionStartTime,
            end: logDate
          });
          activeSessionStartTime = null;
        }
      } else if (eventType === 'completed') {
        completedTimestamp = logDate;
        if (activeSessionStartTime) {
          const durSec = Math.max(0, Math.floor((logDate.getTime() - activeSessionStartTime.getTime()) / 1000));
          completedSessionsList.push({
            id: completedSessionsList.length + 1,
            startStr: formatTimeOnly(activeSessionStartTime),
            endStr: formatTimeOnly(logDate),
            durationStr: formatDuration(durSec),
            durationSeconds: durSec,
            start: activeSessionStartTime,
            end: logDate
          });
          activeSessionStartTime = null;
        }
        if (lastHoldStartTime) {
          const holdDiff = Math.max(0, Math.floor((logDate.getTime() - lastHoldStartTime.getTime()) / 1000));
          holdDurationSum += holdDiff;
          lastHoldStartTime = null;
        }
      }
    });

    if (isCurrentlyRunning) {
      const runningStart = activeSessionStartTime || resolvedInProgressStart;
      if (runningStart && !firstSessionStartTime) {
        firstSessionStartTime = runningStart;
      }
      if (runningStart && completedSessionsList.length > 0 && !resumeSessionStartTime) {
        resumeSessionStartTime = runningStart;
      }
    }

    if (currentStatus === 'onhold') {
      const curHold = lastHoldStartTime || (task?.holdStartedAt ? new Date(task.holdStartedAt) : new Date(updatedDate));
      if (!firstHoldStartTime) firstHoldStartTime = curHold;
      const curHoldSecs = Math.max(0, Math.floor((new Date().getTime() - curHold.getTime()) / 1000));
      holdDurationSum += curHoldSecs;
    }

    return {
      completedSessionsList,
      activeSessionStartTime: isCurrentlyRunning ? (activeSessionStartTime || resolvedInProgressStart) : null,
      holdDurationSum,
      firstSessionStartTime,
      firstHoldStartTime,
      resumeSessionStartTime,
      completedTimestamp
    };
  }, [rawActivities, isCurrentlyRunning, resolvedInProgressStart, updatedDate, currentStatus, task?.holdStartedAt, task?.completedAt]);

  // Dynamically compute static sessions from task.workSessions or logs
  const computedSessions = useMemo(() => {
    if (Array.isArray(task?.workSessions) && task.workSessions.length > 0) {
      return task.workSessions.map((s, idx) => ({
        id: idx + 1,
        startStr: s.start ? formatTimeOnly(s.start) : formatTimeOnly(createdDate),
        endStr: s.end ? formatTimeOnly(s.end) : (isCurrentlyRunning ? 'Ongoing' : formatTimeOnly(updatedDate)),
        durationStr: s.durationSeconds ? formatDuration(s.durationSeconds) : (s.duration || '0m'),
        durationSeconds: s.durationSeconds || 0
      }));
    }

    return [...lifecycleData.completedSessionsList];
  }, [task?.workSessions, lifecycleData, isCurrentlyRunning, createdDate, updatedDate]);

  // Total Work Sessions count (including ongoing active session)
  const totalWorkSessionsCount = useMemo(() => {
    if (Array.isArray(task?.workSessions) && task.workSessions.length > 0) {
      return task.workSessions.length;
    }
    const completedCount = computedSessions.length;
    if (isCurrentlyRunning) {
      return completedCount + 1;
    }
    if (completedCount > 0) return completedCount;
    if (baseAccumulatedSeconds > 0 || currentStatus === 'completed') return 1;
    return 0;
  }, [task?.workSessions, computedSessions.length, isCurrentlyRunning, baseAccumulatedSeconds, currentStatus]);

  // Dynamic Total Tracked Time (in seconds)
  const staticTrackedSeconds = useMemo(() => {
    if (computedSessions.length > 0) {
      return computedSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    }
    return isCurrentlyRunning ? 0 : baseAccumulatedSeconds;
  }, [computedSessions, baseAccumulatedSeconds, isCurrentlyRunning]);

  const displayTrackedSeconds = isCurrentlyRunning
    ? (staticTrackedSeconds + liveSessionSeconds)
    : staticTrackedSeconds;

  const totalTrackedSeconds = displayTrackedSeconds;

  // Dynamic Hold Time
  const totalHoldSeconds = useMemo(() => {
    if (task?.totalHoldSeconds) return Number(task.totalHoldSeconds);
    if (lifecycleData.holdDurationSum > 0) return lifecycleData.holdDurationSum;
    if (currentStatus === 'onhold') {
      const hStart = task?.holdStartedAt ? new Date(task.holdStartedAt) : new Date(updatedDate);
      return Math.max(0, Math.floor((new Date() - hStart) / 1000));
    }
    return 0;
  }, [task?.totalHoldSeconds, lifecycleData.holdDurationSum, currentStatus, task?.holdStartedAt, updatedDate]);

  // Real Waiting / Pending duration before work actually started
  const totalWaitingSeconds = useMemo(() => {
    const cDate = new Date(createdDate);
    if (isNaN(cDate.getTime())) return 0;

    if (lifecycleData.firstSessionStartTime) {
      return Math.max(0, Math.floor((lifecycleData.firstSessionStartTime.getTime() - cDate.getTime()) / 1000));
    }
    if (isCurrentlyRunning && resolvedInProgressStart) {
      return Math.max(0, Math.floor((resolvedInProgressStart.getTime() - cDate.getTime()) / 1000));
    }
    if (currentStatus === 'pending') {
      return Math.max(0, Math.floor((new Date().getTime() - cDate.getTime()) / 1000));
    }
    return 0;
  }, [createdDate, lifecycleData.firstSessionStartTime, isCurrentlyRunning, resolvedInProgressStart, currentStatus]);

  const totalAllSeconds = Math.max(1, totalTrackedSeconds + totalHoldSeconds + totalWaitingSeconds);
  const trackedPct = Math.min(100, Math.round((totalTrackedSeconds / totalAllSeconds) * 100));
  const holdPct = Math.min(100 - trackedPct, Math.round((totalHoldSeconds / totalAllSeconds) * 100));
  const waitingPct = Math.max(0, 100 - trackedPct - holdPct);

  // Dynamic SVG Donut Chart Calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const trackedStrokeDash = (trackedPct / 100) * circumference;
  const holdStrokeDash = (holdPct / 100) * circumference;
  const waitingStrokeDash = (waitingPct / 100) * circumference;

  const holdOffset = -trackedStrokeDash;
  const waitingOffset = -(trackedStrokeDash + holdStrokeDash);

  // Dynamic Journey Progress Segments summing seamlessly to 100%
  const journeySegments = useMemo(() => {
    if (currentStatus === 'pending') {
      return [{ type: 'waiting', width: 100, title: 'Waiting / Pending' }];
    }

    const hasHold = totalHoldSeconds > 0 || currentStatus === 'onhold' || lifecycleData.firstHoldStartTime;
    const hasSession2 = isCurrentlyRunning || computedSessions.length > 1;
    const isDone = currentStatus === 'completed';

    if (hasHold && hasSession2 && isDone) {
      return [
        { type: 'waiting', width: 10, title: 'Waiting / Pending' },
        { type: 'tracked', width: 35, title: 'Active Work (Session 1)' },
        { type: 'onhold', width: 18, title: 'On Hold' },
        { type: 'tracked', width: 25, title: 'Active Work (Session 2)' },
        { type: 'completed', width: 12, title: 'Completed' }
      ];
    }
    if (hasHold && hasSession2) {
      return [
        { type: 'waiting', width: 10, title: 'Waiting / Pending' },
        { type: 'tracked', width: 42, title: 'Active Work (Session 1)' },
        { type: 'onhold', width: 18, title: 'On Hold' },
        { type: 'tracked', width: 30, title: 'Active Work (Session 2 Ongoing)' }
      ];
    }
    if (hasHold) {
      return [
        { type: 'waiting', width: 18, title: 'Waiting / Pending' },
        { type: 'tracked', width: 52, title: 'Active Work (Session 1)' },
        { type: 'onhold', width: 30, title: 'On Hold' }
      ];
    }
    if (isDone) {
      return [
        { type: 'waiting', width: 18, title: 'Waiting / Pending' },
        { type: 'tracked', width: 64, title: 'Active Work' },
        { type: 'completed', width: 18, title: 'Completed' }
      ];
    }
    return [
      { type: 'waiting', width: 18, title: 'Waiting / Pending' },
      { type: 'tracked', width: 82, title: 'Active Work / Tracked' }
    ];
  }, [currentStatus, totalHoldSeconds, lifecycleData.firstHoldStartTime, isCurrentlyRunning, computedSessions.length]);

  // Dynamic Journey Steps (Only actual events that occurred for this task)
  const journeySteps = useMemo(() => {
    const steps = [];

    // 1. Pending (Task Created)
    steps.push({
      label: 'Pending',
      time: formatTimeOnly(createdDate),
      color: '#94a3b8',
      active: true
    });

    // 2. In Progress (Session 1 Start)
    const hasStarted = currentStatus !== 'pending' || staticTrackedSeconds > 0 || computedSessions.length > 0;
    if (hasStarted) {
      const s1Time = lifecycleData.firstSessionStartTime
        ? formatTimeOnly(lifecycleData.firstSessionStartTime)
        : (computedSessions[0]?.startStr && computedSessions[0]?.startStr !== '—'
            ? computedSessions[0].startStr
            : (resolvedInProgressStart ? formatTimeOnly(resolvedInProgressStart) : formatTimeOnly(createdDate)));
      steps.push({
        label: 'In Progress',
        time: s1Time,
        color: '#2563eb',
        active: true
      });
    }

    // 3. On Hold (Only if task actually went on hold or has hold duration)
    const hasHold = Boolean(lifecycleData.firstHoldStartTime || task?.holdStartedAt || currentStatus === 'onhold' || totalHoldSeconds > 0);
    if (hasHold) {
      const holdTime = lifecycleData.firstHoldStartTime
        ? formatTimeOnly(lifecycleData.firstHoldStartTime)
        : formatTimeOnly(task?.holdStartedAt || updatedDate);
      steps.push({
        label: 'On Hold',
        time: holdTime,
        color: '#9333ea',
        active: true
      });
    }

    // 4. In Progress Resumed (Only if multiple sessions exist or resumed after hold)
    const hasResumed = Boolean(lifecycleData.resumeSessionStartTime || (hasHold && computedSessions.length > 1) || (hasHold && isCurrentlyRunning));
    if (hasResumed) {
      const s2Time = lifecycleData.resumeSessionStartTime
        ? formatTimeOnly(lifecycleData.resumeSessionStartTime)
        : (computedSessions[1]?.startStr || (isCurrentlyRunning && resolvedInProgressStart ? formatTimeOnly(resolvedInProgressStart) : formatTimeOnly(updatedDate)));
      steps.push({
        label: 'In Progress (Resumed)',
        time: s2Time,
        color: '#2563eb',
        active: true
      });
    }

    // 5. Completed (Only if task is marked completed)
    if (currentStatus === 'completed') {
      const doneTime = lifecycleData.completedTimestamp
        ? formatTimeOnly(lifecycleData.completedTimestamp)
        : formatTimeOnly(task?.completedAt || updatedDate);
      steps.push({
        label: 'Completed',
        time: doneTime,
        color: '#10b981',
        active: true
      });
    }

    return steps;
  }, [createdDate, currentStatus, staticTrackedSeconds, computedSessions, lifecycleData, task?.holdStartedAt, task?.completedAt, updatedDate, totalHoldSeconds, isCurrentlyRunning, resolvedInProgressStart]);

  // Dynamic Audit & Status Timeline Events
  const auditEvents = useMemo(() => {
    const parseActionTitle = (action, desc, oldVals, newVals) => {
      const act = String(action || '').toLowerCase();
      const d = String(desc || '').toLowerCase();
      const oldS = String(oldVals?.status || '').toLowerCase();
      const newS = String(newVals?.status || '').toLowerCase();

      if (act.includes('create') || d.includes('task created') || act === 'creation') return 'Task Created';
      if (act.includes('remark') || act.includes('comment')) return 'Remark Added';
      if (act.includes('checkpoint')) return 'Checkpoint Updated';
      if (act.includes('timer') || d.includes('timer')) return 'Timer Session';

      if (oldS && newS && oldS !== newS) {
        const fmt = (s) => (s === 'in-progress' || s === 'inprogress') ? 'In Progress' : (s === 'onhold') ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1);
        return `${fmt(oldS)} → ${fmt(newS)}`;
      }

      if (d.includes('from onhold to in-progress') || d.includes('from on hold to in progress')) return 'On Hold → In Progress';
      if (d.includes('from in-progress to onhold') || d.includes('from in progress to on hold')) return 'In Progress → On Hold';
      if (d.includes('from in-progress to completed') || d.includes('from in progress to completed')) return 'In Progress → Completed';
      if (d.includes('to in-progress') || d.includes('to in progress')) return 'Pending → In Progress';
      if (d.includes('to onhold') || d.includes('to on hold')) return 'In Progress → On Hold';
      if (d.includes('to completed')) return 'In Progress → Completed';

      return String(action || 'Status Update').replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const resolveStatusFromEvent = (title, action, desc, newVals, origStatus) => {
      const t = String(title || '').toLowerCase();
      const d = String(desc || '').toLowerCase();
      const a = String(action || '').toLowerCase();
      const n = String(newVals?.status || '').toLowerCase();

      if (n) return normalizeStatus(n);

      if (t.includes('→')) {
        const dest = t.split('→').pop().trim();
        if (dest.includes('completed')) return 'completed';
        if (dest.includes('hold') || dest.includes('pause')) return 'onhold';
        if (dest.includes('progress') || dest.includes('start')) return 'in-progress';
        if (dest.includes('pending')) return 'pending';
        if (dest.includes('reopen')) return 'reopen';
      }

      if (d.includes('to completed')) return 'completed';
      if (d.includes('to on hold') || d.includes('to onhold') || d.includes('to on-hold')) return 'onhold';
      if (d.includes('to in progress') || d.includes('to in-progress') || d.includes('to inprogress')) return 'in-progress';
      if (d.includes('to pending')) return 'pending';

      if (t.includes('completed') || a.includes('completed')) return 'completed';
      if (t.includes('hold') || a.includes('hold') || a.includes('pause')) return 'onhold';
      if (t.includes('progress') || a.includes('progress') || a.includes('start')) return 'in-progress';
      if (t.includes('task created') || t.includes('creation') || a.includes('create') || d.includes('task created')) return 'pending';
      if (t.includes('reopen') || d.includes('reopen')) return 'reopen';
      if (t.includes('overdue') || d.includes('overdue')) return 'overdue';
      return normalizeStatus(origStatus || 'pending');
    };

    if (rawActivities.length > 0) {
      const sorted = [...rawActivities].sort((a, b) => {
        const tA = new Date(a.createdAt || a.changedAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.changedAt || b.timestamp || 0).getTime();
        return tA - tB;
      });

      let hasCreationEvent = false;
      const rawMapped = sorted.map((ev, idx) => {
        const d = ev.createdAt || ev.changedAt || ev.timestamp || ev.date || new Date();
        const action = ev.action || ev.status || 'Status Update';
        const desc = ev.description || ev.details || ev.remarks || `Status updated to ${action}`;
        const user = ev.userName || ev.user?.name || ev.changedBy?.name || assigneeName;
        const title = parseActionTitle(action, desc, ev.oldValues, ev.newValues);
        const status = resolveStatusFromEvent(title, action, desc, ev.newValues, ev.status);

        if (title === 'Task Created') {
          hasCreationEvent = true;
        }

        const dotColor = (title === 'Task Created' || title === 'Creation') ? '#94a3b8' : (STATUS_CONFIG[status]?.color || '#2563eb');

        return {
          id: ev._id || idx,
          time: formatTimeOnly(d),
          date: formatDateOnly(d),
          title,
          description: desc,
          status,
          statusConf: STATUS_CONFIG[status] || STATUS_CONFIG.pending,
          dotColor,
          user: user
        };
      });

      // Deduplicate consecutive identical creation events if any
      const events = [];
      rawMapped.forEach((ev) => {
        if (ev.title === 'Task Created') {
          const alreadyHasCreate = events.some((e) => e.title === 'Task Created');
          if (alreadyHasCreate) return;
        }
        events.push(ev);
      });

      // If initial creation is still not present, prepend Task Created
      if (!hasCreationEvent) {
        events.unshift({
          id: 'init_create',
          time: formatTimeOnly(createdDate),
          date: formatDateOnly(createdDate),
          title: 'Task Created',
          description: `Task created: ${safeTask.title || 'Task'}`,
          status: 'pending',
          statusConf: STATUS_CONFIG.pending,
          dotColor: '#94a3b8',
          user: `${assigneeName} (Owner)`
        });
      }

      return events;
    }

    // Dynamic lifecycle events fallback from task timestamps
    const list = [
      {
        id: 1,
        time: formatTimeOnly(createdDate),
        date: formatDateOnly(createdDate),
        title: 'Task Created',
        description: 'Task created and set to Pending',
        status: 'pending',
        statusConf: STATUS_CONFIG.pending,
        user: `${assigneeName} (Owner)`
      }
    ];

    if (currentStatus !== 'pending' || totalTrackedSeconds > 0) {
      list.push({
        id: 2,
        time: lifecycleData.firstSessionStartTime ? formatTimeOnly(lifecycleData.firstSessionStartTime) : (resolvedInProgressStart ? formatTimeOnly(resolvedInProgressStart) : formatTimeOnly(createdDate)),
        date: formatDateOnly(createdDate),
        title: 'Pending → In Progress',
        description: 'Tracking started',
        status: 'in-progress',
        statusConf: STATUS_CONFIG['in-progress'],
        user: `${assigneeName} (Owner)`
      });
    }

    if (lifecycleData.firstHoldStartTime || currentStatus === 'onhold' || totalHoldSeconds > 0) {
      list.push({
        id: 3,
        time: lifecycleData.firstHoldStartTime ? formatTimeOnly(lifecycleData.firstHoldStartTime) : formatTimeOnly(updatedDate),
        date: formatDateOnly(updatedDate),
        title: 'In Progress → On Hold',
        description: `Tracking paused\nSession: ${computedSessions[0]?.durationStr || '0m'}`,
        status: 'onhold',
        statusConf: STATUS_CONFIG.onhold,
        user: `${assigneeName} (Owner)`
      });
    }

    if (lifecycleData.resumeSessionStartTime || (lifecycleData.firstHoldStartTime && isCurrentlyRunning)) {
      list.push({
        id: 4,
        time: lifecycleData.resumeSessionStartTime ? formatTimeOnly(lifecycleData.resumeSessionStartTime) : formatTimeOnly(updatedDate),
        date: formatDateOnly(updatedDate),
        title: 'On Hold → In Progress',
        description: 'Tracking resumed',
        status: 'in-progress',
        statusConf: STATUS_CONFIG['in-progress'],
        user: `${assigneeName} (Owner)`
      });
    }

    if (currentStatus === 'completed') {
      list.push({
        id: 5,
        time: lifecycleData.completedTimestamp ? formatTimeOnly(lifecycleData.completedTimestamp) : formatTimeOnly(task?.completedAt || updatedDate),
        date: formatDateOnly(updatedDate),
        title: 'In Progress → Completed',
        description: `Tracking finalized\nFinal tracked time: ${formatDuration(totalTrackedSeconds)}`,
        status: 'completed',
        statusConf: STATUS_CONFIG.completed,
        user: `${assigneeName} (Owner)`
      });
    }

    return list;
  }, [rawActivities, createdDate, currentStatus, totalTrackedSeconds, lifecycleData, resolvedInProgressStart, assigneeName, computedSessions, totalHoldSeconds, updatedDate, task?.completedAt, safeTask.title]);

  // Handle adding a remark dynamically
  const handleAddRemarkSubmit = async (e) => {
    if (e) e.preventDefault();
    const text = remarkText.trim();
    if (!text) return;

    setIsSubmittingRemark(true);
    try {
      if (onRemarkAdded) {
        const mentions = selectedMentionIds.filter(id => {
          const user = mentionUsers.find(member => String(member._id || member) === id);
          return user && text.includes(`@${user.name || 'User'}`);
        });
        await onRemarkAdded(task, text, [], mentions);
      } else {
        const source = safeTask.taskFor === 'self' || safeTask.isSelfTask ? 'self' : safeTask.source || 'task';
        const isClient = source === 'client' || Boolean(safeTask.clientId || safeTask.isClientTask);
        const endpoint = isClient
          ? `/tasks/client-tasks/${safeTask._id}/client-remarks`
          : source === 'self'
            ? `/tasks/self/${safeTask._id}/remarks`
            : `/task/${safeTask._id}/remarks`;

        await axios.post(endpoint, { text, remark: text });
      }
      setRemarkText('');
      setSelectedMentionIds([]);
    } catch (err) {
      console.error('Failed to submit remark:', err);
    } finally {
      setIsSubmittingRemark(false);
    }
  };

  const handleStatusSelect = (newStatus) => {
    setOpenStatusMenu(null);
    if (newStatus === currentStatus) return;
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    }
  };

  const focusRemarkInput = () => {
    if (remarkInputRef.current) {
      remarkInputRef.current.focus();
      remarkInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!open || !task) return null;

  const taskIdStr = task.taskNumber || task.customId || `TSK-${String(task._id || '001234').slice(-6).toUpperCase()}`;

  return (
    <div className={`task-detail-modal-overlay ${isFullscreen ? 'fullscreen-overlay' : ''}`} onClick={onClose}>
      <div
        className={`task-detail-modal-panel ${isFullscreen ? 'fullscreen-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* TOP BAR */}
        <div className="task-detail-modal-topbar">
          <div className="topbar-left">
            <div className="topbar-icon-badge">
              <FiArrowUpRight size={17} />
            </div>
            <div className="topbar-title-wrap">
              <h2 className="topbar-title">Task Details</h2>
              <p className="topbar-subtitle">View complete task information, time tracking, activity and more.</p>
            </div>
          </div>
          <div className="topbar-right">
            <button
              type="button"
              className="topbar-action-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>
            <button
              type="button"
              className="topbar-action-btn close-btn"
              onClick={onClose}
              title="Close (ESC)"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="task-detail-modal-scrollable">
          {/* TASK HERO SECTION */}
          <div className="task-hero-section">
            <div className="task-hero-top-row">
              <div className="task-hero-left">
                <h1 className="task-main-heading">{task.title || task.name || 'Untitled Task'}</h1>
                
                {/* User Line */}
                <div className="task-hero-user-line">
                  <FiUser size={13} className="hero-user-icon" />
                  <span className="hero-user-text">
                    {assigneeSummary}
                  </span>
                </div>

                {/* Meta Pills Row */}
                <div className="task-hero-meta-row">
                  <div className="task-meta-pill tag-pill">
                    <FiFolder size={12} />
                    <span>{taskTypeTag}</span>
                  </div>

                  {projectName && (
                    <div className="task-meta-pill project-pill" style={{ color: '#0284c7', backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }}>
                      <FiFolder size={12} />
                      <span>Project: {projectName}</span>
                    </div>
                  )}

                  {clientName && (
                    <div className="task-meta-pill client-pill" style={{ color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
                      <FiUser size={12} />
                      <span>Client: {clientName}</span>
                    </div>
                  )}

                  <div
                    className="task-meta-pill priority-pill"
                    style={{
                      color: priorityConf.color,
                      backgroundColor: priorityConf.bg,
                      borderColor: priorityConf.border
                    }}
                  >
                    <FiFlag size={12} />
                    <span>{priorityConf.label}</span>
                  </div>

                  <div className="task-meta-pill date-pill">
                    <FiCalendar size={12} />
                    <span>{formatDateOnly(dueDate || createdDate)}</span>
                  </div>
                </div>
              </div>

              <div className="task-hero-right">
                {/* Status Action Dropdown */}
                <div className="task-hero-status-area" ref={statusMenuRef}>
                  <button
                    type="button"
                    className="task-status-btn"
                    onClick={() => setOpenStatusMenu(openStatusMenu === 'header' ? null : 'header')}
                    disabled={!canEdit}
                  >
                    <span>{statusConf.label}</span>
                    <FiChevronDown size={14} className={openStatusMenu === 'header' ? 'rotate-180' : ''} />
                  </button>

                  {openStatusMenu === 'header' && (
                    <div className="task-status-dropdown-menu">
                      <div className="dropdown-menu-header">Change Status</div>
                      {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'inprogress').map(([key, cfg]) => (
                        <button
                          key={key}
                          type="button"
                          className={`status-dropdown-option ${currentStatus === key ? 'active' : ''}`}
                          onClick={() => handleStatusSelect(key)}
                        >
                          <span className="status-opt-dot" style={{ backgroundColor: cfg.color }} />
                          <span>{cfg.label}</span>
                          {currentStatus === key && <FiCheck size={14} className="status-opt-check" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Tracking Indicator */}
                <div className="task-live-tracking-row">
                  <span className={`live-pulse-dot ${isCurrentlyRunning ? 'running' : ''}`} />
                  <span className="live-tracking-text">
                    Live Tracking — automatic based on task status
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 STATS CARDS ROW (100% Dynamic) */}
          <div className="task-metrics-grid">
            <div className="metric-stat-card">
              <div className="metric-icon-box">
                <FiClock size={19} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Tracked</span>
                <strong className="metric-value">{formatDuration(displayTrackedSeconds)}</strong>
              </div>
            </div>

            <div className="metric-stat-card">
              <div className="metric-icon-box">
                <FiActivity size={19} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Current Session</span>
                <div className="metric-value-row">
                  <strong className="metric-value">{formatDuration(isCurrentlyRunning ? liveSessionSeconds : (computedSessions[computedSessions.length - 1]?.durationSeconds || 0))}</strong>
                  {isCurrentlyRunning && <span className="metric-live-chip">● Live</span>}
                </div>
              </div>
            </div>

            <div className="metric-stat-card">
              <div className="metric-icon-box">
                <FiLayers size={19} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Work Sessions</span>
                <strong className="metric-value">{totalWorkSessionsCount}</strong>
              </div>
            </div>

            <div className="metric-stat-card">
              <div className="metric-icon-box">
                <FiClock size={19} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Last Status Change</span>
                <strong className="metric-value">{formatTimeOnly(updatedDate)}</strong>
              </div>
            </div>
          </div>

          {/* HOW AUTOMATIC TIME TRACKING WORKS BANNER */}
          <div className={`task-info-banner ${howTrackingOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="info-banner-header"
              onClick={() => setHowTrackingOpen(!howTrackingOpen)}
            >
              <div className="info-banner-left">
                <div className="info-icon-bubble">
                  <FiInfo size={13} className="info-icon" />
                </div>
                <div className="info-text-summary">
                  <strong className="info-banner-title">How automatic time tracking works?</strong>
                  <div className="info-inline-rules">
                    <p className="info-rule-line">
                      Pending = timer inactive &nbsp;|&nbsp; In Progress = timer automatically running &nbsp;|&nbsp; On Hold = timer automatically paused &nbsp;|&nbsp; In Progress after hold = tracking resumes
                    </p>
                    <p className="info-rule-line">
                      Completed = timer finalized &nbsp;|&nbsp; Reopen followed by In Progress = tracking resumes
                    </p>
                  </div>
                </div>
              </div>
              <FiChevronDown size={16} className={`info-chevron ${howTrackingOpen ? 'rotate-180' : ''}`} />
            </button>

            {howTrackingOpen && (
              <div className="info-banner-content">
                <div className="tracking-rule-chips">
                  <span className="rule-chip"><strong>Pending</strong> = timer inactive</span>
                  <span className="rule-chip active"><strong>In Progress</strong> = timer automatically running</span>
                  <span className="rule-chip pause"><strong>On Hold</strong> = timer automatically paused</span>
                  <span className="rule-chip"><strong>In Progress after hold</strong> = tracking resumes</span>
                  <span className="rule-chip done"><strong>Completed</strong> = timer finalized</span>
                  <span className="rule-chip"><strong>Reopen</strong> followed by In Progress = tracking resumes</span>
                </div>
              </div>
            )}
          </div>

          {/* MAIN 2-COLUMN GRID */}
          <div className="task-content-columns-grid">
            {/* LEFT COLUMN */}
            <div className="task-left-column">
              {/* TASK TIME JOURNEY CARD */}
              <div className="card-box time-journey-card">
                <div className="card-box-header">
                  <div className="card-header-title">
                    <FiActivity size={15} className="card-header-icon" />
                    <h3>Task Time Journey</h3>
                  </div>
                </div>

                <div className="time-journey-body">
                  {/* Step Journey Milestones (Dynamic to actual events) */}
                  <div className={`journey-milestones-row ${journeySteps.length <= 1 ? 'single-step' : ''}`}>
                    {journeySteps.length > 1 && (
                      <div
                        className="milestones-track-line"
                        style={{
                          left: `${100 / (journeySteps.length * 2)}%`,
                          right: `${100 / (journeySteps.length * 2)}%`
                        }}
                      />
                    )}
                    {journeySteps.map((step, idx) => (
                      <div className="journey-step-node is-active" key={idx}>
                        <span className="step-status-label">{step.label}</span>
                        <span className="step-time-label">{step.time}</span>
                        <div className="step-dot" style={{ borderColor: step.color }}>
                          <span className="step-inner-dot" style={{ backgroundColor: step.color }} />
                        </div>
                        <div className="step-vertical-guide" />
                      </div>
                    ))}
                  </div>

                  {/* Segmented Timeline Bar (100% Dynamic) */}
                  <div className="journey-progress-bar">
                    {journeySegments.map((seg, sIdx) => (
                      <div
                        key={sIdx}
                        className={`segment-bar ${seg.type}`}
                        style={{ width: `${seg.width}%` }}
                        title={seg.title}
                      />
                    ))}
                  </div>

                  {/* Summary Breakdown (3 Legend Columns) */}
                  <div className="journey-legend-row">
                    <div className="legend-item">
                      <span className="legend-dot waiting" />
                      <div className="legend-text-col">
                        <span className="legend-name">Waiting / Pending</span>
                        <strong className="legend-val">{formatDuration(totalWaitingSeconds)}</strong>
                        <span className="legend-sub">(Not counted)</span>
                      </div>
                    </div>

                    <div className="legend-item">
                      <span className="legend-dot tracked" />
                      <div className="legend-text-col">
                        <span className="legend-name">Active Work / Tracked</span>
                        <strong className="legend-val text-blue">{formatDuration(totalTrackedSeconds)}</strong>
                        <span className="legend-sub">(Counted)</span>
                      </div>
                    </div>

                    <div className="legend-item">
                      <span className="legend-dot onhold" />
                      <div className="legend-text-col">
                        <span className="legend-name">On Hold</span>
                        <strong className="legend-val">{formatDuration(totalHoldSeconds)}</strong>
                        <span className="legend-sub">(Not counted)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AUDIT & STATUS TIMELINE CARD (100% Dynamic) */}
              <div className="card-box audit-timeline-card">
                <div className="card-box-header">
                  <div className="card-header-title">
                    <FiClock size={15} className="card-header-icon" />
                    <h3>Audit & Status Timeline</h3>
                  </div>
                  <span className="events-count-badge">{auditEvents.length} events</span>
                </div>

                <div className="audit-timeline-body">
                  {auditEvents.map((ev, idx) => (
                    <div className="audit-event-row" key={ev.id || idx}>
                      <div className="audit-time-col">
                        <span className="audit-time">{ev.time}</span>
                        <span className="audit-date">{ev.date}</span>
                      </div>

                      <div className="audit-node-col">
                        <div className="audit-node-dot" style={{ backgroundColor: ev.dotColor || ev.statusConf.color }}>
                          <span className="node-pulse-ring" style={{ backgroundColor: ev.dotColor || ev.statusConf.color }} />
                        </div>
                        {idx < auditEvents.length - 1 && <div className="audit-connector-line" />}
                      </div>

                      <div className="audit-info-col">
                        <div className="audit-title-line">
                          <strong className="audit-title">{ev.title}</strong>
                        </div>
                        <p className="audit-desc">{ev.description}</p>
                      </div>

                      <div className="audit-status-col">
                        <span
                          className={`audit-status-chip status-${ev.status}`}
                          style={{ color: ev.statusConf.color, backgroundColor: ev.statusConf.bg, borderColor: ev.statusConf.border }}
                        >
                          {ev.statusConf.label}
                        </span>
                      </div>

                      <div className="audit-user-col">
                        <span className="audit-user-name">{ev.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ATTACHMENTS & MEDIA CARD (100% Dynamic with Previews) */}
              <div className="card-box attachments-card">
                <div className="card-box-header">
                  <div className="card-header-title">
                    <FiPaperclip size={15} className="card-header-icon" />
                    <h3>Attachments & Media ({rawFiles.length})</h3>
                  </div>
                  {imageAttachments.length > 0 && (
                    <span className="events-count-badge">{imageAttachments.length} image{imageAttachments.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                <div className="attachments-body">
                  {/* Visual Image Gallery Preview if images exist */}
                  {imageAttachments.length > 0 && (
                    <div className="attachments-image-gallery">
                      {imageAttachments.map((img, i) => (
                        <div
                          key={`gallery-${i}`}
                          className="attachment-gallery-item"
                          onClick={() => setZoomImage(img.url)}
                          title={`Click to preview ${img.filename}`}
                        >
                          <img
                            src={img.url}
                            alt={img.filename}
                            onError={(e) => handleRemarkImageError(e, img.path)}
                          />
                          <div className="gallery-item-overlay">
                            <FiZoomIn size={16} />
                            <span>Preview</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {rawFiles.length > 0 ? (
                    <div className="attachments-list">
                      {rawFiles.map((f, idx) => {
                        const fileName = f.filename || `Attachment-${idx + 1}`;
                        const fileSize = f.size ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : null;
                        const fileUrl = f.url || '#';
                        const isImg = f.isImage;

                        return (
                          <div className="attachment-item-card" key={idx}>
                            <div
                              className={`attachment-icon-box ${isImg ? 'clickable-thumb' : ''}`}
                              onClick={() => isImg && setZoomImage(fileUrl)}
                              title={isImg ? 'Click to preview image' : ''}
                            >
                              {isImg ? (
                                <img
                                  src={fileUrl}
                                  alt={fileName}
                                  className="attachment-thumb-img"
                                  onError={(e) => handleRemarkImageError(e, f.path)}
                                />
                              ) : (
                                <FiFileText size={18} />
                              )}
                            </div>
                            <div
                              className="attachment-info"
                              onClick={() => isImg && setZoomImage(fileUrl)}
                              style={{ cursor: isImg ? 'pointer' : 'default' }}
                            >
                              <span className="attachment-name" title={fileName}>{fileName}</span>
                              <span className="attachment-meta">
                                {[fileSize, formatFullDateTime(f.uploadedAt || f.createdAt), assigneeName].filter(Boolean).join(' · ')}
                              </span>
                            </div>
                            <div className="attachment-actions">
                              {isImg ? (
                                <button
                                  type="button"
                                  className="attachment-btn preview-btn"
                                  onClick={() => setZoomImage(fileUrl)}
                                  title="Preview Image"
                                >
                                  <FiEye size={14} />
                                </button>
                              ) : (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="attachment-btn preview-btn"
                                  title="Open in new tab"
                                >
                                  <FiExternalLink size={14} />
                                </a>
                              )}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={fileName}
                                className="attachment-btn download-btn"
                                title="Download File"
                              >
                                <FiDownload size={14} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="attachments-empty-state">
                      <FiPaperclip size={24} style={{ color: '#94a3b8', marginBottom: 4 }} />
                      <span className="empty-state-title">No files attached</span>
                      <span className="empty-state-subtitle">Files and images uploaded to this task will appear here.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="task-right-column">
              {/* WORK SESSIONS CARD (100% Dynamic) */}
              <div className="card-box work-sessions-card">
                <div className="card-box-header">
                  <div className="card-header-title">
                    <FiClock size={15} className="card-header-icon" />
                    <h3>Work Sessions</h3>
                  </div>
                </div>

                <div className="work-sessions-body">
                  <div className="sessions-list">
                    {computedSessions.map((session, idx) => (
                      <div className="session-item-row" key={session.id || idx}>
                        <div className="session-left">
                          <span className="session-title">Session {session.id}</span>
                          <span className="session-timeframe">
                            {session.startStr} &nbsp;–&nbsp; {session.endStr}
                          </span>
                        </div>
                        <div className="session-right">
                          <strong className="session-duration">
                            {session.durationStr}
                          </strong>
                        </div>
                      </div>
                    ))}

                    {isCurrentlyRunning && lifecycleData.activeSessionStartTime && (
                      <div className="session-item-row ongoing-session">
                        <div className="session-left">
                          <span className="session-title">Session {computedSessions.length + 1}</span>
                          <span className="session-timeframe">
                            {formatTimeOnly(lifecycleData.activeSessionStartTime)} &nbsp;–&nbsp; <span className="text-blue">Ongoing</span>
                          </span>
                        </div>
                        <div className="session-right">
                          <strong className="session-duration text-blue">
                            {formatDuration(liveSessionSeconds)}
                          </strong>
                        </div>
                      </div>
                    )}

                    {!isCurrentlyRunning && computedSessions.length === 0 && (
                      <div className="work-sessions-empty-state">No work sessions recorded.</div>
                    )}
                  </div>

                  <div className="sessions-divider" />

                  <div className="sessions-total-row">
                    <span className="sessions-total-label">Total Tracked Time</span>
                    <strong className="total-tracked-highlight">{formatDuration(displayTrackedSeconds)}</strong>
                  </div>
                </div>
              </div>

              {/* WORK DISTRIBUTION CARD (100% Dynamic) */}
              <div className="card-box work-distribution-card">
                <div className="card-box-header">
                  <div className="card-header-title">
                    <FiActivity size={15} className="card-header-icon" />
                    <h3>Work Distribution</h3>
                  </div>
                </div>

                <div className="work-distribution-body">
                  <div className="distribution-chart-wrap">
                    <svg className="donut-chart-svg" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="donut-bg-ring"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="donut-segment waiting"
                        strokeDasharray={`${waitingStrokeDash} ${circumference}`}
                        strokeDashoffset={waitingOffset}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="donut-segment onhold"
                        strokeDasharray={`${holdStrokeDash} ${circumference}`}
                        strokeDashoffset={holdOffset}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="donut-segment tracked"
                        strokeDasharray={`${trackedStrokeDash} ${circumference}`}
                        strokeDashoffset="0"
                      />
                    </svg>

                    <div className="donut-center-label">
                      <strong>{formatDuration(totalTrackedSeconds)}</strong>
                      <span>Tracked</span>
                    </div>
                  </div>

                  <div className="distribution-legend-col">
                    <div className="dist-legend-item">
                      <span className="dist-dot tracked" />
                      <span className="dist-label">Active Work / Tracked</span>
                      <span className="dist-time">{formatDuration(totalTrackedSeconds)}</span>
                      <span className="dist-pct">{trackedPct}%</span>
                    </div>

                    <div className="dist-legend-item">
                      <span className="dist-dot onhold" />
                      <span className="dist-label">On Hold</span>
                      <span className="dist-time">{formatDuration(totalHoldSeconds)}</span>
                      <span className="dist-pct">{holdPct}%</span>
                    </div>

                    <div className="dist-legend-item">
                      <span className="dist-dot waiting" />
                      <span className="dist-label">Waiting / Pending</span>
                      <span className="dist-time">{formatDuration(totalWaitingSeconds)}</span>
                      <span className="dist-pct">{waitingPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REMARKS CARD (100% Dynamic) */}
              <div className="card-box remarks-card">
                <div className="card-box-header">
                  <div className="card-header-title">
                    <FiMessageSquare size={15} className="card-header-icon" />
                    <h3>Remarks</h3>
                  </div>
                  <span className="events-count-badge">{rawRemarks.length} {rawRemarks.length === 1 ? 'remark' : 'remarks'}</span>
                </div>

                <div className="remarks-body">
                  {rawRemarks.length > 0 ? (
                    <div className="remarks-feed-list">
                      {rawRemarks.map((rem, idx) => {
                        const author = rem.userName || rem.user?.name || assigneeName;
                        const dateStr = formatFullDateTime(rem.createdAt || rem.date);
                        const text = rem.text || rem.remark || rem.message || rem.comment || 'done';

                        return (
                          <div className="remark-feed-item" key={rem._id || idx}>
                            <div className="remark-avatar">
                              {getInitials(author)}
                            </div>
                            <div className="remark-content-wrap">
                              <div className="remark-header-line">
                                <div className="remark-author-col">
                                  <strong className="remark-author-name">{author}</strong>
                                  <span className="remark-time">{dateStr}</span>
                                </div>
                              </div>
                              <p className="remark-text-body">{text}</p>
                              {(() => {
                                const remarkImages = getRemarkImages(rem);
                                if (!remarkImages || remarkImages.length === 0) return null;
                                return (
                                  <div className="task-remark-images-wrap" style={{ marginTop: '8px' }}>
                                    <div className="task-remark-images-grid">
                                      {remarkImages.map((imgPath, imgIdx) => {
                                        const fullUrl = getImageUrl(imgPath);
                                        return (
                                          <div
                                            key={imgIdx}
                                            className="task-remark-thumb-container"
                                            onClick={() => setZoomImage(fullUrl)}
                                            title="Click to view full image"
                                          >
                                            <img
                                              src={fullUrl}
                                              alt={`Remark attachment ${imgIdx + 1}`}
                                              className="task-remark-image-thumb"
                                              onError={(e) => handleRemarkImageError(e, imgPath)}
                                            />
                                            <div className="task-remark-thumb-overlay">
                                              <FiZoomIn size={16} />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="remarks-empty-state">
                      <span>No remarks yet. Add the first note below!</span>
                    </div>
                  )}

                  {/* Add Remark Input Row */}
                  {mentionUsers.length > 0 && <label>Mention a member
                    <select aria-label="Mention a project member" value="" onChange={event => {
                      const user = mentionUsers.find(member => String(member._id || member) === event.target.value);
                      if (user) {
                        setRemarkText(previous => `${previous} @${user.name || 'User'} `);
                        setSelectedMentionIds(previous => [...new Set([...previous, String(user._id || user)])]);
                      }
                      remarkInputRef.current?.focus();
                    }}>
                      <option value="">Select member</option>
                      {mentionUsers.map(user => <option key={user._id || user} value={user._id || user}>{user.name || 'User'}</option>)}
                    </select>
                  </label>}
                  <form onSubmit={handleAddRemarkSubmit} className="add-remark-box">
                    <div className="remark-current-avatar">
                      {getInitials(employeeInfo?.name || 'User')}
                    </div>
                    <input
                      ref={remarkInputRef}
                      type="text"
                      className="remark-input-field"
                      placeholder="Write a remark..."
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                    />
                    <div className="remark-action-btns">
                      <button
                        type="submit"
                        disabled={isSubmittingRemark || !remarkText.trim()}
                        className="remark-send-btn"
                        title="Send Remark"
                      >
                        {isSubmittingRemark ? <FiRefreshCw size={13} className="spin-icon" /> : <FiSend size={13} />}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* TASK & SYSTEM INFO SUB-CARDS (100% Dynamic) */}
              <div className="info-subcards-grid">
                <div className="card-box mini-info-card">
                  <div className="card-box-header">
                    <div className="card-header-title">
                      <FiFolder size={13} className="card-header-icon" />
                      <h4>Task Information</h4>
                    </div>
                  </div>
                  <div className="mini-info-body">
                    <div className="info-pair-row">
                      <span className="info-pair-label">Task ID</span>
                      <strong className="info-pair-val">{taskIdStr}</strong>
                    </div>
                    <div className="info-pair-row">
                      <span className="info-pair-label">Project</span>
                      <strong className="info-pair-val">{task.projectName || task.project?.name || '—'}</strong>
                    </div>
                    <div className="info-pair-row">
                      <span className="info-pair-label">Client</span>
                      <strong className="info-pair-val">{task.clientName || task.client?.name || '—'}</strong>
                    </div>
                  </div>
                </div>

                <div className="card-box mini-info-card">
                  <div className="card-box-header">
                    <div className="card-header-title">
                      <FiActivity size={13} className="card-header-icon" />
                      <h4>System Information</h4>
                    </div>
                  </div>
                  <div className="mini-info-body">
                    <div className="info-pair-row">
                      <span className="info-pair-label">Created by</span>
                      <strong className="info-pair-val">{task.createdBy?.name || assigneeName}</strong>
                    </div>
                    <div className="info-pair-row">
                      <span className="info-pair-label">Created time</span>
                      <strong className="info-pair-val">{formatFullDateTime(createdDate)}</strong>
                    </div>
                    <div className="info-pair-row">
                      <span className="info-pair-label">Last updated</span>
                      <strong className="info-pair-val">{formatFullDateTime(updatedDate)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="task-detail-modal-footer">
          <div className="footer-left" ref={footerStatusMenuRef}>
            <button
              type="button"
              className="footer-status-pill"
              onClick={() => setOpenStatusMenu(openStatusMenu === 'footer' ? null : 'footer')}
              disabled={!canEdit}
            >
              <span>Status: {statusConf.label}</span>
              <FiChevronDown size={14} className={openStatusMenu === 'footer' ? 'rotate-180' : ''} />
            </button>
            {openStatusMenu === 'footer' && (
              <div className="footer-status-dropdown-menu">
                <div className="dropdown-menu-header">Change Status</div>
                {Object.entries(STATUS_CONFIG).filter(([key]) => key !== 'inprogress').map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    className={`status-dropdown-option ${currentStatus === key ? 'active' : ''}`}
                    onClick={() => handleStatusSelect(key)}
                  >
                    <span className="status-opt-dot" style={{ backgroundColor: cfg.color }} />
                    <span>{cfg.label}</span>
                    {currentStatus === key && <FiCheck size={14} className="status-opt-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="footer-right">
            <button
              type="button"
              className="footer-btn add-remark-btn"
              onClick={focusRemarkInput}
            >
              <FiMessageSquare size={15} />
              <span>Add Remark</span>
            </button>

            <button
              type="button"
              className="footer-btn close-action-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Lightbox with Preview Controls */}
      {zoomImage && (
        <div className="task-remark-zoom-backdrop" onClick={() => setZoomImage(null)}>
          <div className="task-remark-zoom-box" onClick={(e) => e.stopPropagation()}>
            <div className="task-remark-zoom-toolbar">
              <a
                href={zoomImage}
                target="_blank"
                rel="noreferrer"
                className="zoom-toolbar-btn"
                title="Open original in new tab"
              >
                <FiExternalLink size={16} />
              </a>
              <a
                href={zoomImage}
                download
                className="zoom-toolbar-btn"
                title="Download image"
              >
                <FiDownload size={16} />
              </a>
              <button
                type="button"
                className="zoom-toolbar-btn close-btn"
                onClick={() => setZoomImage(null)}
                title="Close (ESC)"
              >
                <FiX size={18} />
              </button>
            </div>
            <img
              src={zoomImage}
              alt="Enlarged attachment preview"
              className="task-remark-zoom-img"
              onError={(e) => handleRemarkImageError(e, zoomImage)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailsModal;
