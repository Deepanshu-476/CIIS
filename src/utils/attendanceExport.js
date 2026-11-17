// Use the same report values in Excel, CSV, PDF and image exports.
export const attendanceStatusKey = value => {
  const key = String(value || 'absent').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (['weekend', 'weeklyoff', 'weekoff'].includes(key)) return 'weekend';
  if (key === 'onleave') return 'leave';
  return key;
};

export function attendanceExportValues(record = {}) {
  const key = attendanceStatusKey(record.status);
  const approved = record.hasOvertimeApproved === true;
  const fullDay = approved && (record.isFullDayOt || record.overtimeCalculationType === 'FULL_DAY_PRESENT');
  const overtime = fullDay ? 'Full Day' : String(record.overTime || '00:00:00');
  const hasOvertime = approved && (fullDay || /[1-9]/.test(overtime));
  const labels = {present: 'PRESENT', late: 'LATE', halfday: 'HALF DAY', absent: 'ABSENT',
    uninformedleave: 'UNINFORMED LEAVE', holiday: 'HOLIDAY', weekend: 'WEEKLY OFF', leave: 'ON LEAVE'};
  const baseStatus = labels[key] || String(record.status || 'ABSENT').toUpperCase();
  return {
    status: fullDay ? 'PRESENT + OVERTIME' : hasOvertime ? `${baseStatus} + OVERTIME` : baseStatus,
    overtime: approved ? overtime : '00:00:00',
    overtimeApproval: approved ? 'Approved' : 'Not approved',
    hasOvertime,
    weeklyOff: key === 'weekend',
  };
}

export function attendanceExportSummary(records = []) {
  const summary = {total: records.length, present: 0, late: 0, halfDay: 0, absent: 0,
    uninformedLeave: 0, holiday: 0, weekend: 0, leave: 0, onTime: 0, overtime: 0};
  const keys = {present: 'present', late: 'late', halfday: 'halfDay', absent: 'absent',
    uninformedleave: 'uninformedLeave', holiday: 'holiday', weekend: 'weekend', leave: 'leave'};
  for (const record of records) {
    const status = attendanceStatusKey(record.status);
    if (keys[status]) summary[keys[status]]++;
    if (status === 'present') summary.onTime++;
    if (attendanceExportValues(record).hasOvertime) summary.overtime++;
  }
  return summary;
}

// The API resolves department history, employee weekdays and approved swaps.
// Actual punches, approved leave and holidays keep their recorded status.
export function resolveScheduledAttendanceStatus(record, userId, response = {}) {
  const status = attendanceStatusKey(record?.status);
  if (!Array.isArray(response.weeklyOffUserIds) || record?.inTime || record?.outTime ||
      !['absent', 'uninformedleave', 'weekend'].includes(status)) return status;
  return response.weeklyOffUserIds.includes(String(userId)) ? 'weekend' : status === 'weekend' ? 'absent' : status;
}

export async function fetchAttendanceDay(client, date) {
  const first = await client.get('/attendance/all', {params: {date, page: 1, limit: 1000}, cache: false});
  const result = {...first.data, data: [...(first.data?.data || [])]};
  const pages = Number(first.data?.pagination?.totalPages || first.data?.pagination?.pages || 1);
  for (let page = 2; page <= pages; page++) {
    const next = await client.get('/attendance/all', {params: {date, page, limit: 1000}, cache: false});
    result.data.push(...(next.data?.data || []));
  }
  return result;
}
