import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment, IconButton, Button,
  MenuItem, Select, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Avatar, Chip, TablePagination, CircularProgress, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  PlayArrow,
  Download as DownloadIcon,
  ArrowUpward,
  ArrowDownward,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from '../../utils/axiosConfig';
import { API_URL_IMG } from '../../config';

// Real call logs from GET /crm/telecaller/call-logs (same source as the mobile Call History).
// Previously this page rendered hard-coded sample rows.

const STATUS_COLORS = {
  answered: 'success',
  missed: 'warning',
  'not reachable': 'default',
  rejected: 'error',
};

const DATE_FILTERS = ['Today', 'Last 30 Days', 'All'];

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
};

const formatCalledAt = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const isToday = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `${time}, Today` : `${time}, ${date.toLocaleDateString()}`;
};

// Backend accepts Inbound/Incoming and Outbound/Outgoing for the same direction.
const callDirection = (callType) => {
  const value = String(callType || '').toLowerCase();
  if (value === 'inbound' || value === 'incoming') return 'inbound';
  if (value === 'outbound' || value === 'outgoing') return 'outbound';
  return value;
};

const recordingHref = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${String(API_URL_IMG).replace(/\/+$/, '')}/${String(url).replace(/^\/+/, '')}`;
};

// Local-day bounds for the date buttons, sent to the server as from/to.
const dateRange = (filter) => {
  if (filter === 'All') return {};
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (filter === 'Last 30 Days') start.setDate(start.getDate() - 29);
  return { from: start.toISOString() };
};

function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [direction, setDirection] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  // Typing waits a moment before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [query, status, direction, dateFilter, rowsPerPage]);

  // One page at a time from the server (the page used to load 500 rows and filter them here,
  // so older calls never showed).
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      ...(query ? { search: query } : {}),
      ...(status ? { status } : {}),
      ...(direction ? { direction } : {}),
      ...dateRange(dateFilter),
    };
    axios.get('/crm/telecaller/call-logs', { params })
      .then((response) => {
        if (!active) return;
        setLogs(Array.isArray(response.data?.items) ? response.data.items : []);
        setTotal(Number(response.data?.total) || 0);
      })
      .catch((err) => {
        if (!active) return;
        setLogs([]);
        setTotal(0);
        setError(err.response?.data?.message || 'Failed to load call logs.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page, rowsPerPage, query, status, direction, dateFilter, reloadKey]);

  const fetchLogs = useCallback(() => setReloadKey((key) => key + 1), []);
  const pageRows = logs;

  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={600}>{total} Call Logs</Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchLogs} disabled={loading}>Refresh</Button>
      </Box>

      <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search by name, phone or agent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Select size="small" value={direction} onChange={(e) => setDirection(e.target.value)} displayEmpty>
          <MenuItem value="">All Directions</MenuItem>
          <MenuItem value="outbound">Outgoing</MenuItem>
          <MenuItem value="inbound">Incoming</MenuItem>
        </Select>

        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} displayEmpty>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="answered">Answered</MenuItem>
          <MenuItem value="missed">Missed</MenuItem>
          <MenuItem value="not reachable">Not Reachable</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </Select>

        <Box display="flex" gap={1}>
          {DATE_FILTERS.map((item) => (
            <Button
              key={item}
              variant={dateFilter === item ? 'contained' : 'outlined'}
              onClick={() => setDateFilter(item)}
            >
              {item}
            </Button>
          ))}
        </Box>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>By</TableCell>
              <TableCell>Called At</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center"><CircularProgress size={28} /></TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No call logs found for the selected filters.</Typography>
                </TableCell>
              </TableRow>
            ) : pageRows.map((log) => {
              const name = log.leadName || log.leadPhone || 'Unknown';
              const isInbound = callDirection(log.callType) === 'inbound';
              const recording = recordingHref(log.recordingUrl);
              return (
                <TableRow key={log._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {isInbound ? <ArrowDownward fontSize="small" color="success" /> : <ArrowUpward fontSize="small" color="primary" />}
                      <Chip label={log.status || 'answered'} size="small" color={STATUS_COLORS[String(log.status || '').toLowerCase()] || 'default'} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: isInbound ? 'green' : 'orangered' }}>
                        {String(name).charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{name}</Typography>
                        <Typography variant="body2" color="text.secondary">{log.leadPhone || '—'}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{log.agentName || '—'}</TableCell>
                  <TableCell>{formatCalledAt(log.startTime || log.createdAt)}</TableCell>
                  <TableCell>{formatDuration(log.duration)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<PlayArrow />}
                        variant="outlined"
                        color="error"
                        disabled={!recording}
                        href={recording || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Play Recording
                      </Button>
                      <IconButton disabled={!recording} href={recording || undefined} download>
                        <DownloadIcon />
                      </IconButton>
                      <IconButton disabled={!log.leadPhone} href={log.leadPhone ? `tel:${log.leadPhone}` : undefined}>
                        <PhoneIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

export default CallLogs;
