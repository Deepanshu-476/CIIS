import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import axios from '../../utils/axiosConfig';
import CIISLoader from '../../Loader/CIISLoader';
import { pageName, describeAction } from '../../utils/pageNames';

// Company "Employee Activity" (/ciisUser/user-activity): which pages people use, what they change there, and when each
// person last logged in. Owner/admin see the whole company; others (given View in Page
// Management) see only the people of their own branches - the server decides.

const RANGES = [
  { value: 1, label: 'Today' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const fmtDateTime = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const ago = value => {
  if (!value) return 'Never';
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return '—';
  const min = Math.round(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

const fmtDuration = ms => {
  const total = Math.round((Number(ms) || 0) / 1000);
  if (!total) return '—';
  if (total < 60) return `${total}s`;
  const min = Math.floor(total / 60);
  if (min < 60) return `${min}m ${total % 60}s`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

const errorText = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const Stat = ({ label, value, hint }) => (
  <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, minWidth: 0 }}>
    <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{value ?? '—'}</Typography>
    {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
  </Paper>
);

const scrollTable = { overflowX: 'auto', borderRadius: 2 };
const headCell = { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'action.hover' };

function PagesTab({ pages, onOpenPage }) {
  const max = Math.max(1, ...pages.map(p => p.views + p.actions));
  if (!pages.length) return <Alert severity="info">No page activity in this period yet.</Alert>;
  return (
    <TableContainer component={Paper} variant="outlined" sx={scrollTable}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headCell}>Page</TableCell>
            <TableCell sx={headCell} align="right">Opened</TableCell>
            <TableCell sx={headCell} align="right">Changes</TableCell>
            <TableCell sx={headCell} align="right">People</TableCell>
            <TableCell sx={headCell} align="right">Avg time</TableCell>
            <TableCell sx={headCell}>Last used</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pages.map(page => (
            <TableRow key={page.path} hover sx={{ cursor: 'pointer' }} onClick={() => onOpenPage(page.path)}>
              <TableCell sx={{ minWidth: 200 }}>
                <Typography variant="body2" fontWeight={600}>{pageName(page.path)}</Typography>
                <Box sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.max(2, ((page.views + page.actions) / max) * 100)}%`, height: '100%', bgcolor: 'primary.main' }} />
                </Box>
              </TableCell>
              <TableCell align="right">{page.views}</TableCell>
              <TableCell align="right">{page.actions}</TableCell>
              <TableCell align="right">{page.uniqueUsers}</TableCell>
              <TableCell align="right">{fmtDuration(page.avgDurationMs)}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDateTime(page.lastAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function UsersTab({ users, onOpenUser }) {
  const [search, setSearch] = useState('');
  const [show, setShow] = useState('all');
  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(user => {
      if (show === 'active' && !(user.views + user.actions + user.logins)) return false;
      if (show === 'inactive' && user.views + user.actions + user.logins) return false;
      if (show === 'never' && user.lastLogin) return false;
      if (!term) return true;
      return [user.name, user.email, user.department, user.role, ...(user.branches || [])]
        .some(value => String(value || '').toLowerCase().includes(term));
    });
  }, [users, search, show]);

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField size="small" label="Search people" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1 }} />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Show</InputLabel>
          <Select label="Show" value={show} onChange={e => setShow(e.target.value)}>
            <MenuItem value="all">Everyone</MenuItem>
            <MenuItem value="active">Used the system in this period</MenuItem>
            <MenuItem value="inactive">Did not use it in this period</MenuItem>
            <MenuItem value="never">Never logged in</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <TableContainer component={Paper} variant="outlined" sx={scrollTable}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headCell}>Person</TableCell>
              <TableCell sx={headCell}>Branch</TableCell>
              <TableCell sx={headCell}>Last login</TableCell>
              <TableCell sx={headCell}>Last active</TableCell>
              <TableCell sx={headCell} align="right">Pages opened</TableCell>
              <TableCell sx={headCell} align="right">Changes</TableCell>
              <TableCell sx={headCell}>Most used page</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(user => (
              <TableRow key={user._id} hover sx={{ cursor: 'pointer', opacity: user.isActive ? 1 : 0.6 }} onClick={() => onOpenUser(user._id)}>
                <TableCell sx={{ minWidth: 180 }}>
                  <Typography variant="body2" fontWeight={600}>{user.name}{user.isActive ? '' : ' (inactive)'}</Typography>
                  <Typography variant="caption" color="text.secondary">{[user.role, user.department].filter(Boolean).join(' · ') || user.email}</Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 120 }}>{(user.branches || []).join(', ') || '—'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={fmtDateTime(user.lastLogin)}><span>{ago(user.lastLogin)}</span></Tooltip>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={fmtDateTime(user.lastActiveAt)}><span>{user.lastActiveAt ? ago(user.lastActiveAt) : '—'}</span></Tooltip>
                </TableCell>
                <TableCell align="right">{user.views}</TableCell>
                <TableCell align="right">{user.actions}</TableCell>
                <TableCell sx={{ minWidth: 140 }}>{user.topPage ? pageName(user.topPage) : '—'}</TableCell>
              </TableRow>
            ))}
            {!list.length ? (
              <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary">Nobody matches.</Typography></TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function FeedTab({ days, users, pages, filters, setFilters }) {
  const [state, setState] = useState({ loading: true, items: [], page: 1, pages: 1, total: 0, error: '' });

  const load = useCallback(async (pageNo = 1) => {
    setState(s => ({ ...s, loading: true, error: '' }));
    try {
      const { data } = await axios.get('/activity/feed', {
        params: { days, page: pageNo, limit: 50, userId: filters.userId || undefined, path: filters.path || undefined, type: filters.type || undefined },
        _skipErrorNotify: true,
      });
      setState({ loading: false, items: data.items || [], page: data.page || 1, pages: data.pages || 1, total: data.total || 0, error: '' });
    } catch (error) {
      setState(s => ({ ...s, loading: false, error: errorText(error, 'Could not load the activity log') }));
    }
  }, [days, filters]);

  useEffect(() => { load(1); }, [load]);

  const what = item => {
    if (item.type === 'login') return 'Logged in';
    if (item.type === 'view') return item.durationMs ? `Opened the page (${fmtDuration(item.durationMs)})` : 'Opened the page';
    return describeAction(item.method, item.endpoint);
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Person</InputLabel>
          <Select label="Person" value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}>
            <MenuItem value="">Everyone</MenuItem>
            {users.map(user => <MenuItem key={user._id} value={user._id}>{user.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Page</InputLabel>
          <Select label="Page" value={filters.path} onChange={e => setFilters(f => ({ ...f, path: e.target.value }))}>
            <MenuItem value="">All pages</MenuItem>
            {pages.map(page => <MenuItem key={page.path} value={page.path}>{pageName(page.path)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>What</InputLabel>
          <Select label="What" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <MenuItem value="">Everything</MenuItem>
            <MenuItem value="action">Changes only</MenuItem>
            <MenuItem value="view">Pages opened</MenuItem>
            <MenuItem value="login">Logins</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      <TableContainer component={Paper} variant="outlined" sx={scrollTable}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headCell}>When</TableCell>
              <TableCell sx={headCell}>Person</TableCell>
              <TableCell sx={headCell}>Page</TableCell>
              <TableCell sx={headCell}>What</TableCell>
              <TableCell sx={headCell}>From</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.items.map(item => (
              <TableRow key={item._id}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDateTime(item.at)}</TableCell>
                <TableCell sx={{ minWidth: 130 }}>{item.user?.name || '—'}</TableCell>
                <TableCell sx={{ minWidth: 150 }}>{item.type === 'login' ? '—' : pageName(item.path || '(unknown)')}</TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <Tooltip title={item.type === 'action' ? `${item.method} ${item.endpoint}` : ''}><span>{what(item)}</span></Tooltip>
                </TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" label={item.source === 'app' ? 'App' : item.source === 'web' ? 'Website' : '—'} />
                </TableCell>
              </TableRow>
            ))}
            {!state.loading && !state.items.length ? (
              <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No activity for these filters.</Typography></TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
        <Typography variant="body2" color="text.secondary">{state.total} entries · page {state.page} of {state.pages}</Typography>
        <Button size="small" variant="outlined" disabled={state.loading || state.page <= 1} onClick={() => load(state.page - 1)}>Previous</Button>
        <Button size="small" variant="outlined" disabled={state.loading || state.page >= state.pages} onClick={() => load(state.page + 1)}>Next</Button>
      </Stack>
    </Stack>
  );
}

export default function UserActivity() {
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState('pages');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ userId: '', path: '', type: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/activity/summary', { params: { days }, _skipErrorNotify: true });
      setSummary(data);
    } catch (err) {
      setError(errorText(err, 'Could not load employee activity'));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const t = summary?.totals || {};
  const rangeLabel = RANGES.find(r => r.value === days)?.label.toLowerCase() || '';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto', minWidth: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Employee Activity</Typography>
          <Typography variant="body2" color="text.secondary">Who is using which page, what they change, and when they last logged in.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select label="Period" value={days} onChange={e => setDays(e.target.value)}>
              {RANGES.map(range => <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={load} disabled={loading}>Refresh</Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {loading && !summary ? <CIISLoader /> : null}

      {summary ? (
        <>
          <Box sx={{ display: 'grid', gap: 1.5, mb: 2.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' } }}>
            <Stat label="People" value={t.users} hint={`${t.activeAccounts} active accounts`} />
            <Stat label="Logged in today" value={t.loggedInToday} />
            <Stat label={`Logged in (${rangeLabel})`} value={t.loggedInInRange} hint={`${t.neverLoggedIn} never logged in`} />
            <Stat label={`Used the system (${rangeLabel})`} value={t.activeInRange} />
            <Stat label="Pages opened" value={t.views} />
            <Stat label="Changes made" value={t.actions} hint="Add, edit, delete, approve ..." />
          </Box>

          <Tabs value={tab} onChange={(e, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab value="pages" label="Pages" />
            <Tab value="users" label="People" />
            <Tab value="feed" label="Activity log" />
          </Tabs>

          {tab === 'pages' ? (
            <PagesTab pages={summary.pages || []} onOpenPage={path => { setFilters({ userId: '', path, type: '' }); setTab('feed'); }} />
          ) : null}
          {tab === 'users' ? (
            <UsersTab users={summary.users || []} onOpenUser={userId => { setFilters({ userId, path: '', type: '' }); setTab('feed'); }} />
          ) : null}
          {tab === 'feed' ? (
            <FeedTab days={days} users={summary.users || []} pages={summary.pages || []} filters={filters} setFilters={setFilters} />
          ) : null}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Activity is recorded from the website and the app. Entries older than 180 days are removed automatically.
          </Typography>
        </>
      ) : null}
    </Box>
  );
}
