export const OVERDUE_STATUS_MESSAGE = 'Change the status of overdue tasks from Company All Task.';

export const hasOverdueStatus = (task, currentStatus) =>
  [currentStatus, task?.status, task?.overallStatus, task?.userStatus].some(
    status => String(status || '').trim().toLowerCase() === 'overdue',
  );
