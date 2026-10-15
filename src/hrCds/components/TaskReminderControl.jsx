import React, { useState, useCallback } from 'react';
import { FiBell, FiCheck, FiX, FiClock } from 'react-icons/fi';

export const REMINDER_OPTIONS = [
  { value: 'hourly', label: 'Every 1 hour' },
  { value: 'halfHourly', label: 'Every 30 minutes' },
  { value: 'oneHourBefore', label: '1 hour before due time' },
];

export const createDefaultReminderSettings = () => ({
  enabled: false,
  options: [],
  reminderTime: null,
  customTime: '',
  repeatIntervalMinutes: '',
  minutesBeforeDue: '',
});

export const normalizeReminderSettings = (settings = {}) => {
  const options = Array.isArray(settings?.options) ? settings.options.filter(Boolean) : [];
  const reminderTime = settings?.reminderTime || null;
  const customTime = settings?.customTime || (reminderTime ? new Date(reminderTime).toISOString().slice(0, 16) : '');
  const repeatIntervalMinutes = settings?.repeatIntervalMinutes ? Number(settings.repeatIntervalMinutes) : null;
  const minutesBeforeDue = settings?.minutesBeforeDue ? Number(settings.minutesBeforeDue) : null;
  const hasTriggers = options.length > 0 || Boolean(reminderTime || customTime || repeatIntervalMinutes || minutesBeforeDue);
  return {
    enabled: Boolean(settings?.enabled) && hasTriggers,
    options,
    reminderTime,
    customTime,
    repeatIntervalMinutes: repeatIntervalMinutes || '',
    minutesBeforeDue: minutesBeforeDue || '',
  };
};

export const buildReminderPayload = (settings = {}) => {
  const normalized = normalizeReminderSettings(settings);
  return {
    enabled: normalized.enabled,
    options: normalized.options,
    reminderTime: normalized.reminderTime,
    customTime: normalized.customTime || null,
    repeatIntervalMinutes: normalized.repeatIntervalMinutes ? Number(normalized.repeatIntervalMinutes) : null,
    minutesBeforeDue: normalized.minutesBeforeDue ? Number(normalized.minutesBeforeDue) : null,
  };
};

export const format12HourTime = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const format12HourDateTime = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
};

export const formatReminderPreviewTime = (dueDateTime, option) => {
  if (!dueDateTime) return '';
  const dueDate = new Date(dueDateTime);
  if (Number.isNaN(dueDate.getTime())) return '';
  const dueTime12h = format12HourTime(dueDate);

  if (option === 'oneHourBefore') {
    const preview = new Date(dueDate.getTime() - 60 * 60 * 1000);
    return `Scheduled: ${format12HourDateTime(preview)} (Due: ${dueTime12h})`;
  }
  if (option === 'hourly') {
    return `Repeats every 1 hour until due time (${dueTime12h})`;
  }
  if (option === 'halfHourly') {
    return `Repeats every 30 minutes until due time (${dueTime12h})`;
  }
  return '';
};

export const formatActiveReminderLabels = (settings) => {
  if (!settings || !settings.enabled) return 'None';
  const labels = [];
  if (Array.isArray(settings.options)) {
    settings.options.forEach((opt) => {
      const found = REMINDER_OPTIONS.find((o) => o.value === opt);
      if (found) labels.push(found.label);
    });
  }
  if (settings.repeatIntervalMinutes) {
    labels.push(`Repeats every ${settings.repeatIntervalMinutes} min`);
  }
  if (settings.minutesBeforeDue) {
    labels.push(`${settings.minutesBeforeDue} min before due`);
  }
  if (settings.customTime) {
    labels.push(`One-time: ${format12HourDateTime(settings.customTime)}`);
  }
  return labels.length ? labels.join(' • ') : 'Enabled';
};

export const playReminderChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (_e) {
    // Ignore audio error
  }
};

export const triggerBrowserNotification = async (title, body) => {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
      return;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    }
  } catch (_e) {
    // Ignore notification error
  }
};

const TaskReminderControl = ({
  settings,
  dueDateTime,
  onChange,
  taskTitle = 'Task',
  showConfirmPopup = true,
  className = '',
  style = {},
}) => {
  const normalized = normalizeReminderSettings(settings);
  const [confirmPopup, setConfirmPopup] = useState({ open: false, title: '', message: '', optionLabel: '', time12h: '' });

  const notifyUser = useCallback((optionLabel, scheduledTime) => {
    playReminderChime();
    triggerBrowserNotification('Task Reminder Selected', `"${optionLabel}" selected (${scheduledTime})`);

    if (showConfirmPopup) {
      setConfirmPopup({
        open: true,
        title: 'Reminder Option Selected',
        message: `"${optionLabel}" reminder option has been selected.`,
        optionLabel,
        time12h: scheduledTime,
      });
    }
  }, [showConfirmPopup]);

  const toggleOption = (option) => {
    const currentOptions = Array.isArray(normalized.options) ? normalized.options : [];
    const options = currentOptions.includes(option)
      ? currentOptions.filter((item) => item !== option)
      : [...currentOptions, option];
    const hasTriggers = options.length > 0 || Boolean(normalized.reminderTime || normalized.customTime || normalized.repeatIntervalMinutes || normalized.minutesBeforeDue);
    const next = {
      ...normalized,
      enabled: hasTriggers,
      options,
    };
    onChange(next);

    if (!currentOptions.includes(option)) {
      const label = REMINDER_OPTIONS.find((o) => o.value === option)?.label || option;
      const preview = formatReminderPreviewTime(dueDateTime, option) || 'Reminder set';
      notifyUser(label, preview);
    }
  };

  return (
    <div
      className={`task-reminder-control-container ${className}`}
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px 14px',
        marginTop: '10px',
        ...style,
      }}
    >
      {/* Header with Switch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalized.enabled ? '12px' : 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
          <FiBell style={{ color: normalized.enabled ? '#2563eb' : '#64748b' }} />
          <span>Reminder Settings</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
          <input
            type="checkbox"
            checked={normalized.enabled}
            onChange={(e) => {
              const isChecked = e.target.checked;
              const hasExisting = normalized.options.length > 0 || Boolean(normalized.repeatIntervalMinutes || normalized.minutesBeforeDue || normalized.customTime);
              const nextOptions = isChecked ? (hasExisting ? normalized.options : ['oneHourBefore']) : [];
              const next = {
                ...normalized,
                enabled: isChecked,
                options: nextOptions,
              };
              onChange(next);
              if (isChecked) {
                const firstOpt = nextOptions[0] || 'oneHourBefore';
                const label = REMINDER_OPTIONS.find((o) => o.value === firstOpt)?.label || '1 hour before due time';
                const preview = formatReminderPreviewTime(dueDateTime, firstOpt) || 'Reminder ON';
                notifyUser(label, preview);
              }
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb' }}>Reminder ON</span>
        </label>
      </div>

      {normalized.enabled && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {/* Preset Checkbox Options */}
          {REMINDER_OPTIONS.map((option) => {
            const checked = normalized.options.includes(option.value);
            const preview = formatReminderPreviewTime(dueDateTime, option.value);
            return (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(option.value)}
                  style={{ marginTop: '3px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{option.label}</div>
                  {preview && (
                    <div style={{ fontSize: '11.5px', color: '#0369a1', marginTop: '3px', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                      ⏰ {preview}
                    </div>
                  )}
                </div>
              </label>
            );
          })}

          {/* 1. Recurring Interval in Minutes */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
              🔁 Repeat Reminder Every (Interval in Minutes):
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  placeholder="e.g. 15, 30, 45"
                  style={{ width: '90px', padding: '5px 28px 5px 8px', fontSize: '13px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                  value={normalized.repeatIntervalMinutes || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = val ? Math.max(1, parseInt(val, 10)) : '';
                    const next = {
                      ...normalized,
                      enabled: Boolean(num || normalized.options.length || normalized.reminderTime || normalized.minutesBeforeDue),
                      repeatIntervalMinutes: num,
                    };
                    onChange(next);
                    if (num) {
                      const due12 = dueDateTime ? format12HourTime(dueDateTime) : '';
                      notifyUser(
                        `Every ${num} minutes`,
                        due12 ? `Repeats every ${num} minutes until ${due12}` : `Repeats every ${num} minutes`
                      );
                    }
                  }}
                />
                <span style={{ position: 'absolute', right: '6px', fontSize: '11px', color: '#94a3b8', pointerEvents: 'none' }}>min</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[10, 15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    style={{
                      padding: '3px 7px',
                      fontSize: '11.5px',
                      background: Number(normalized.repeatIntervalMinutes) === mins ? '#2563eb' : '#f1f5f9',
                      color: Number(normalized.repeatIntervalMinutes) === mins ? '#ffffff' : '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: Number(normalized.repeatIntervalMinutes) === mins ? 600 : 400,
                    }}
                    onClick={() => {
                      const next = { ...normalized, enabled: true, repeatIntervalMinutes: mins };
                      onChange(next);
                      const due12 = dueDateTime ? format12HourTime(dueDateTime) : '';
                      notifyUser(
                        `Every ${mins} minutes`,
                        due12 ? `Repeats every ${mins} minutes until ${due12}` : `Repeats every ${mins} minutes`
                      );
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              {normalized.repeatIntervalMinutes && (
                <button
                  type="button"
                  style={{ padding: '3px 7px', fontSize: '11px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#64748b' }}
                  onClick={() => onChange({ ...normalized, repeatIntervalMinutes: '' })}
                >
                  Clear
                </button>
              )}
            </div>
            {normalized.repeatIntervalMinutes && (
              <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#0369a1', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                🔁 Repeats every <strong>{normalized.repeatIntervalMinutes} minutes</strong> until due time {dueDateTime ? `(${format12HourTime(dueDateTime)})` : ''}
              </div>
            )}
          </div>

          {/* 2. Minutes Before Due Time */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
              ⏳ Remind Before Due Time (Minutes Before Due):
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="10080"
                  placeholder="e.g. 15, 30, 60"
                  style={{ width: '90px', padding: '5px 28px 5px 8px', fontSize: '13px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                  value={normalized.minutesBeforeDue || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = val ? Math.max(1, parseInt(val, 10)) : '';
                    const next = {
                      ...normalized,
                      enabled: Boolean(num || normalized.options.length || normalized.reminderTime || normalized.repeatIntervalMinutes),
                      minutesBeforeDue: num,
                    };
                    onChange(next);
                    if (num && dueDateTime) {
                      const dueDate = new Date(dueDateTime);
                      if (!Number.isNaN(dueDate.getTime())) {
                        const targetTime = new Date(dueDate.getTime() - num * 60 * 1000);
                        notifyUser(
                          `${num} minutes before due time`,
                          `${format12HourDateTime(targetTime)} (${num} mins before due)`
                        );
                      }
                    }
                  }}
                />
                <span style={{ position: 'absolute', right: '6px', fontSize: '11px', color: '#94a3b8', pointerEvents: 'none' }}>min</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[15, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    style={{
                      padding: '3px 7px',
                      fontSize: '11.5px',
                      background: Number(normalized.minutesBeforeDue) === mins ? '#2563eb' : '#f1f5f9',
                      color: Number(normalized.minutesBeforeDue) === mins ? '#ffffff' : '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: Number(normalized.minutesBeforeDue) === mins ? 600 : 400,
                    }}
                    onClick={() => {
                      const next = { ...normalized, enabled: true, minutesBeforeDue: mins };
                      onChange(next);
                      if (dueDateTime) {
                        const dueDate = new Date(dueDateTime);
                        if (!Number.isNaN(dueDate.getTime())) {
                          const targetTime = new Date(dueDate.getTime() - mins * 60 * 1000);
                          notifyUser(
                            `${mins} minutes before due time`,
                            `${format12HourDateTime(targetTime)} (${mins} mins before due)`
                          );
                        }
                      }
                    }}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
              {normalized.minutesBeforeDue && (
                <button
                  type="button"
                  style={{ padding: '3px 7px', fontSize: '11px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#64748b' }}
                  onClick={() => onChange({ ...normalized, minutesBeforeDue: '' })}
                >
                  Clear
                </button>
              )}
            </div>
            {normalized.minutesBeforeDue && (
              <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#0369a1', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                {dueDateTime && !Number.isNaN(new Date(dueDateTime).getTime()) ? (
                  <>
                    ⏰ Scheduled at: <strong>{format12HourDateTime(new Date(new Date(dueDateTime).getTime() - Number(normalized.minutesBeforeDue) * 60 * 1000))}</strong> ({normalized.minutesBeforeDue} minutes before due time)
                  </>
                ) : (
                  <>⏰ Remind <strong>{normalized.minutesBeforeDue} minutes</strong> before task due time</>
                )}
              </div>
            )}
          </div>

          {/* 3. One-Time Specific Date & Time */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
              📅 Set One-Time Specific Reminder Date & Time:
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="datetime-local"
                style={{ fontSize: '13px', padding: '5px 8px', flex: 1, minWidth: '220px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                value={normalized.customTime || ''}
                max={dueDateTime ? new Date(dueDateTime).toISOString().slice(0, 16) : undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    onChange({ ...normalized, customTime: '', reminderTime: null });
                    return;
                  }
                  if (dueDateTime && new Date(val).getTime() >= new Date(dueDateTime).getTime()) {
                    alert('Reminder time must be before the due date!');
                    return;
                  }
                  const updated = {
                    ...normalized,
                    enabled: true,
                    customTime: val,
                    reminderTime: new Date(val).toISOString(),
                  };
                  onChange(updated);
                  notifyUser('One-Time Specific Reminder', format12HourDateTime(val));
                }}
              />
              {normalized.customTime && (
                <button
                  type="button"
                  style={{ padding: '5px 8px', fontSize: '12px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#64748b' }}
                  onClick={() => onChange({ ...normalized, customTime: '', reminderTime: null })}
                >
                  Remove
                </button>
              )}
            </div>
            {normalized.customTime && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#166534', fontWeight: 500 }}>
                ⏰ Scheduled (12-Hour): <strong>{format12HourDateTime(normalized.customTime)}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Popup Modal */}
      {confirmPopup.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                background: '#eff6ff',
                color: '#2563eb',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <FiBell size={24} />
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>
              {confirmPopup.title}
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              {confirmPopup.message}
            </p>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                <strong style={{ color: '#334155' }}>Task:</strong> {taskTitle || 'Current Task'}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong style={{ color: '#334155' }}>Selected Option:</strong>{' '}
                <span style={{ color: '#2563eb', fontWeight: 600 }}>{confirmPopup.optionLabel}</span>
              </div>
              <div>
                <strong style={{ color: '#334155' }}>12-Hour Time:</strong>{' '}
                <span style={{ color: '#059669', fontWeight: 600 }}>{confirmPopup.time12h}</span>
              </div>
            </div>
            <button
              type="button"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
              onClick={() => setConfirmPopup((prev) => ({ ...prev, open: false }))}
            >
              OK, Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskReminderControl;
