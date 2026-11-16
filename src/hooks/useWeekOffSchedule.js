import { useEffect, useMemo, useState } from 'react';
import axios from '../utils/axiosConfig';

// A loaded month is authoritative, including a month with no weekly offs.
export default function useWeekOffSchedule(months) {
  const monthKey = [...new Set(months)].sort().join(',');
  const [schedules, setSchedules] = useState({});

  useEffect(() => {
    let active = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      const results = await Promise.allSettled(monthKey.split(',').map(async month => {
        const { data } = await axios.get(`/week-off/my-schedule?month=${month}`, { cache: false });
        if (!data?.success || !Array.isArray(data.offDayKeys)) throw new Error('Invalid weekly off schedule');
        return [month, data];
      }));
      if (active) setSchedules(previous => {
        const next = { ...previous };
        results.forEach(result => {
          if (result.status === 'fulfilled') next[result.value[0]] = result.value[1];
        });
        return next;
      });
      loading = false;
    };
    const refresh = () => {
      if (document.visibilityState !== 'hidden') load();
    };
    load();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [monthKey]);

  return useMemo(() => ({
    schedules,
    isWeeklyOff: dateKey => {
      const schedule = schedules[dateKey.slice(0, 7)];
      return schedule ? schedule.offDayKeys.includes(dateKey) : null;
    },
  }), [schedules]);
}
