let audioContext;
export const isTaskReminder = notification => ['task_due_reminder', 'task_pending_reminder'].includes(notification?.type || notification?.data?.type);

export const getReminderTaskId = notification =>
  String(notification?.data?.taskId || notification?.taskId || notification?.task?._id || notification?.data?.task?._id || '');

export const getReminderTaskKey = notification => {
  const taskId = getReminderTaskId(notification);
  if (taskId) return `task:${taskId}`;
  return String(notification?._id || notification?.id || notification?.data?.notificationId || '');
};

export const reminderAlertKey = notification => String(notification?._id || notification?.id || notification?.data?.notificationId || `${notification?.data?.taskId}:${notification?.data?.reminderOption}:${notification?.createdAt || notification?.message}`);

export const unlockReminderSound = async () => {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (!audioContext || audioContext.state === 'closed') audioContext = new Audio();
    if (audioContext.state === 'suspended') await audioContext.resume();
    return audioContext.state === 'running';
  } catch { return false; }
};
export const registerReminderWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register('/reminder-notifications-sw.js');
  } catch { return null; }
};
export const prepareReminderAlerts = async () => {
  // Called directly from a reminder control click (browser permission requires a gesture).
  const sound = unlockReminderSound();
  try {
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    await registerReminderWorker();
  } catch { /* The in-page popup remains available if system notifications are blocked. */ }
  await sound;
};
export const playTaskReminderSound = async () => {
  if (!(await unlockReminderSound())) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain); gain.connect(audioContext.destination);
  const now = audioContext.currentTime;
  osc.frequency.setValueAtTime(587.33, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  osc.onended = () => {osc.disconnect(); gain.disconnect();};
  osc.start(now); osc.stop(now + 0.55);
};
export const showTaskReminderSystemNotification = async notification => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const title = notification.title || 'Task Reminder';
  const tag = getReminderTaskKey(notification) || reminderAlertKey(notification);
  const options = {
    body: notification.message || notification.body || '', icon: '/favicon.ico',
    tag, silent: false,
    data: {url: '/ciisUser/task-management'},
  };
  try {
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (registration?.active) {
      await registration.showNotification(title, options);
    } else {
      const alert = new Notification(title, options);
      alert.onclick = () => {window.focus(); window.location.assign(options.data.url); alert.close();};
    }
    return true;
  } catch { return false; }
};
