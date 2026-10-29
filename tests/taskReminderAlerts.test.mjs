import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture({permission = 'granted', worker = true} = {}) {
  const calls = {notifications: [], sounds: 0, permissions: 0};
  class Audio {
    state = 'suspended'; currentTime = 0; destination = {};
    async resume() {this.state = 'running';}
    createOscillator() {return {connect() {}, disconnect() {}, frequency: {setValueAtTime() {}, exponentialRampToValueAtTime() {}}, start() {calls.sounds++;}, stop() {}};}
    createGain() {return {connect() {}, disconnect() {}, gain: {setValueAtTime() {}, exponentialRampToValueAtTime() {}}};}
  }
  class Notification {
    static permission = permission;
    static async requestPermission() {calls.permissions++; return this.permission = 'granted';}
    constructor(title, options) {calls.notifications.push({title, options});}
  }
  const registration = {active: true, showNotification: async (title, options) => calls.notifications.push({title, options})};
  const navigator = worker ? {serviceWorker: {getRegistration: async () => registration, register: async () => registration}} : {};
  const context = {window: {AudioContext: Audio, Notification}, Notification, navigator};
  const source = fs.readFileSync('src/utils/taskReminderAlerts.js', 'utf8').replaceAll('export const ', 'const ');
  const api = vm.runInNewContext(`${source}\n({isTaskReminder, reminderAlertKey, prepareReminderAlerts, playTaskReminderSound, showTaskReminderSystemNotification})`, context);
  return {api, calls};
}
const reminder = {_id: 'reminder-id', type: 'task_due_reminder', title: 'Task Reminder', message: 'Finish report'};

test('web reminder shows a system notification with sound enabled and plays a chime', async () => {
  const {api, calls} = fixture();
  assert.equal(api.isTaskReminder(reminder), true);
  await api.prepareReminderAlerts();
  await api.playTaskReminderSound();
  assert.equal(await api.showTaskReminderSystemNotification(reminder), true);
  assert.equal(calls.sounds, 1);
  assert.equal(calls.notifications.length, 1);
  assert.equal(calls.notifications[0].options.silent, false);
  assert.equal(calls.notifications[0].options.tag, 'reminder-id');
});

test('permission request happens during preparation, not a timer-triggered notification', async () => {
  const {api, calls} = fixture({permission: 'default'});
  assert.equal(await api.showTaskReminderSystemNotification(reminder), false);
  assert.equal(calls.permissions, 0);
  await api.prepareReminderAlerts();
  assert.equal(calls.permissions, 1);
  assert.equal(await api.showTaskReminderSystemNotification(reminder), true);
});

test('desktop Notification fallback works without service workers', async () => {
  const {api, calls} = fixture({worker: false});
  assert.equal(await api.showTaskReminderSystemNotification(reminder), true);
  assert.equal(calls.notifications[0].title, 'Task Reminder');
});

test('blocked permission is respected; pending reminders and stable IDs are recognized', async () => {
  const {api, calls} = fixture({permission: 'denied'});
  await api.prepareReminderAlerts();
  assert.equal(calls.permissions, 0);
  assert.equal(await api.showTaskReminderSystemNotification(reminder), false);
  assert.equal(api.isTaskReminder({type: 'task_pending_reminder'}), true);
  assert.equal(api.isTaskReminder({type: 'chat'}), false);
  assert.equal(api.reminderAlertKey(reminder), api.reminderAlertKey({...reminder}));
});
