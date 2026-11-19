export const registrationDateOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom' },
];

// Use local calendar days so the filter matches the displayed application date.
// The end is exclusive, which includes the entire selected end day.
export function getRegistrationDateBounds(preset, from, to, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const dayOffset = offset => new Date(year, month, day + offset).getTime();
  const monthStart = offset => new Date(year, month + offset, 1).getTime();

  switch (preset) {
    case 'today': return [dayOffset(0), dayOffset(1)];
    case 'yesterday': return [dayOffset(-1), dayOffset(0)];
    case 'last7': return [dayOffset(-6), dayOffset(1)];
    case 'thisMonth': return [monthStart(0), monthStart(1)];
    case 'lastMonth': return [monthStart(-1), monthStart(0)];
    case 'last90': return [dayOffset(-89), dayOffset(1)];
    case 'custom': {
      if (!Number.isFinite(from?.getTime()) || !Number.isFinite(to?.getTime())) return [];
      const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
      const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1).getTime();
      return start < end ? [start, end] : [];
    }
    default: return [];
  }
}

export function isRegistrationDateInRange(createdAt, start, end) {
  const timestamp = createdAt ? new Date(createdAt).getTime() : NaN;
  return timestamp >= start && timestamp < end;
}
