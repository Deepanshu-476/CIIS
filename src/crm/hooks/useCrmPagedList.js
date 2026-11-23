import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';

// Loads one page of a CRM admin list from the server (?page&limit + filters + search).
// The server also returns `stats` (KPI cards for the whole list) and `options` (filter dropdown
// values), so pages no longer download every record to compute them in the browser.
const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
);

export default function useCrmPagedList(endpoint, { page = 1, limit = 10, filters = {}, search = '', refreshInterval = 0 } = {}) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    items: [], total: 0, pages: 1, stats: null, options: null, loading: true, error: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filtersKey = JSON.stringify(cleanParams(filters));

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const params = {
      page,
      limit,
      ...JSON.parse(filtersKey),
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {})
    };
    const load = async (background = false) => {
      if (pending || (background && document.visibilityState === 'hidden')) return;
      pending = true;
      if (!background) setState(current => ({ ...current, loading: true, error: '' }));
      try {
        const { data } = await axiosInstance.get(endpoint, { params, cache: false, _skipErrorNotify: true, signal: controller.signal });
        if (controller.signal.aborted) return;
        setState({
          items: Array.isArray(data?.items) ? data.items : [],
          total: Number(data?.total) || 0,
          pages: Math.max(1, Number(data?.pages) || 1),
          stats: data?.stats || null,
          options: data?.options || null,
          loading: false,
          error: ''
        });
      } catch (err) {
        if (controller.signal.aborted || background) return;
        setState(current => ({
          ...current,
          items: [],
          total: 0,
          pages: 1,
          loading: false,
          error: err.response?.data?.message || 'Could not load data. Please retry.'
        }));
      } finally {
        pending = false;
      }
    };
    void load();
    const refresh = () => { void load(true); };
    if (!refreshInterval) return () => controller.abort();
    const timer = setInterval(refresh, refreshInterval);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [endpoint, page, limit, filtersKey, debouncedSearch, reloadKey, refreshInterval]);

  return { ...state, reload: () => setReloadKey(key => key + 1) };
}

export const optionNames = (list = []) => [...new Set(list.map(item => (typeof item === 'string' ? item : item?.name)).map(v => String(v || '').trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b));

export const sumStatuses = (byStatus = {}, statuses = []) => statuses
  .reduce((sum, status) => sum + (Number(byStatus?.[status]) || 0), 0);

// Page numbers to render around the current page (lists can have thousands of pages now).
export const pageWindow = (current, total, radius = 2) => {
  const pages = [];
  const start = Math.max(1, Math.min(current - radius, total - radius * 2));
  const end = Math.min(total, Math.max(current + radius, 1 + radius * 2));
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
};

export const leadAttempts = lead => (lead?.callAttempts ?? lead?.callHistory?.length ?? 0);
export const leadLastCallAt = lead => lead?.lastCallAt || (lead?.callHistory?.length ? lead.callHistory.at(-1).date : null);
