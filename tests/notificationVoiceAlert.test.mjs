import test from 'node:test';
import assert from 'node:assert/strict';

function generateVoiceAlertTexts(payload = {}, eventName = '') {
  const type = String(payload.type || eventName || '').toLowerCase();
  const data = payload.data || {};
  const task = payload.task || payload.relatedTask || data.task || {};
  const rawTitle = String(payload.title || payload.notificationTitle || '').trim();
  const rawMessage = String(payload.message || payload.body || payload.description || data.message || '').trim();

  let taskTitle = data.taskTitle || task.title || task.name || payload.taskTitle || '';
  if (!taskTitle && rawMessage) {
    const match = rawMessage.match(/"([^"]+)"/);
    if (match) taskTitle = match[1];
  }
  if (!taskTitle && rawTitle && !rawTitle.toLowerCase().includes('reminder') && !rawTitle.toLowerCase().includes('notification') && !rawTitle.toLowerCase().includes('update')) {
    taskTitle = rawTitle;
  }

  let devanagariText = '';
  let hinglishText = '';

  if (type.includes('task_due_reminder') || (type.includes('reminder') && !type.includes('pending'))) {
    const taskDevanagari = taskTitle ? `टास्क "${taskTitle}"` : 'टास्क';
    const taskHinglish = taskTitle ? `Task "${taskTitle}"` : 'Task';
    devanagariText = `ध्यान दें! ${taskDevanagari} का रिमाइंडर टाइम हो गया है।`;
    hinglishText = `Dhyan dein! ${taskHinglish} ka reminder time ho gaya hai.`;
  } else if (type.includes('task_overdue') || type.includes('overdue')) {
    const taskDevanagari = taskTitle ? `टास्क "${taskTitle}"` : 'टास्क';
    const taskHinglish = taskTitle ? `Task "${taskTitle}"` : 'Task';
    devanagariText = `अलर्ट! आपका ${taskDevanagari} ओवरड्यू हो गया है। कृपया इसे चेक करें।`;
    hinglishText = `Alert! Aapka ${taskHinglish} overdue ho gaya hai. Kripya ise check karein.`;
  } else if (type.includes('task_pending') || (type.includes('pending') && type.includes('reminder'))) {
    const taskDevanagari = taskTitle ? `टास्क "${taskTitle}"` : 'टास्क';
    const taskHinglish = taskTitle ? `Task "${taskTitle}"` : 'Task';
    devanagariText = `रिमाइंडर: आपका ${taskDevanagari} अभी पेंडिंग है, कृपया समय पर पूरा करें।`;
    hinglishText = `Reminder: Aapka ${taskHinglish} abhi pending hai, kripya samay par poora karein.`;
  } else if (type.includes('task')) {
    const label = taskTitle || rawTitle || rawMessage || 'नया अपडेट';
    devanagariText = `टास्क अपडेट: ${label}`;
    hinglishText = `Task update: ${label}`;
  } else if (type.includes('leave')) {
    const label = rawTitle || rawMessage || 'छुट्टी की अर्जी अपडेट';
    devanagariText = `लीव अपडेट: ${label}`;
    hinglishText = `Leave update: ${label}`;
  } else if (type.includes('attendance')) {
    const label = rawTitle || rawMessage || 'अटेंडेंस अपडेट';
    devanagariText = `अटेंडेंस अपडेट: ${label}`;
    hinglishText = `Attendance update: ${label}`;
  } else if (type.includes('meeting')) {
    const label = rawTitle || rawMessage || 'मीटिंग अपडेट';
    devanagariText = `मीटिंग रिमाइंडर: ${label}`;
    hinglishText = `Meeting reminder: ${label}`;
  } else {
    const cleanTitle = rawTitle ? `${rawTitle}. ` : '';
    const cleanBody = rawMessage ? rawMessage.replace(/https?:\/\/\S+/g, '') : '';
    const combined = (cleanTitle + cleanBody).trim();
    if (combined) {
      devanagariText = combined;
      hinglishText = combined;
    } else {
      devanagariText = 'नया नोटिफिकेशन प्राप्त हुआ है।';
      hinglishText = 'Naya notification aaya hai.';
    }
  }

  return { devanagariText, hinglishText };
}

test('Chrome Voice Alerts Suite - Comprehensive Notification Speech Verification', async (t) => {
  await t.test('1. Task Due Reminder generates clear voice alert text with task name', () => {
    const { devanagariText, hinglishText } = generateVoiceAlertTexts({
      type: 'task_due_reminder',
      title: 'Task Reminder',
      message: 'Personal Task "testing of CRM" is due at 6:00 PM. Reminder: Scheduled reminder.',
      data: { taskTitle: 'testing of CRM' }
    });
    assert.ok(hinglishText.includes('testing of CRM'));
    assert.ok(hinglishText.includes('ka reminder time ho gaya hai'));
    assert.ok(devanagariText.includes('testing of CRM'));
  });

  await t.test('2. Overdue notification generates warning alert', () => {
    const { hinglishText } = generateVoiceAlertTexts({
      type: 'task_overdue',
      message: 'Personal Task "AI Voice QA" is overdue.',
      data: { taskTitle: 'AI Voice QA' }
    });
    assert.ok(hinglishText.includes('Alert! Aapka Task "AI Voice QA" overdue ho gaya hai'));
  });

  await t.test('3. Leave notification is spoken cleanly without being dropped', () => {
    const { hinglishText } = generateVoiceAlertTexts({
      title: 'Leave Approved',
      message: 'Your leave application for tomorrow has been approved.',
    }, 'leave:status_changed');
    assert.ok(hinglishText.includes('Leave update: Leave Approved'));
  });

  await t.test('4. General Chrome alert with title and message fallback is spoken aloud', () => {
    const { hinglishText } = generateVoiceAlertTexts({
      title: 'System Alert',
      message: 'Server maintenance scheduled at 11 PM',
    }, 'notification:new');
    assert.equal(hinglishText, 'System Alert. Server maintenance scheduled at 11 PM');
  });

  await t.test('5. Empty payload still produces a friendly notification announcement', () => {
    const { hinglishText } = generateVoiceAlertTexts({}, 'notification:new');
    assert.equal(hinglishText, 'Naya notification aaya hai.');
  });
});
