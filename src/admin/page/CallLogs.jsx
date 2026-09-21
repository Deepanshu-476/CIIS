import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, InputAdornment, IconButton, Button,
  MenuItem, Select, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Avatar, Chip, TablePagination, CircularProgress, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  ArrowUpward,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../utils/axiosConfig';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const formatCallTime = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getStatusColor = (status) => {
  switch (String(status).toLowerCase()) {
    case 'answered':
      return { chip: 'success', avatar: '#10b981' };
    case 'missed':
      return { chip: 'warning', avatar: '#f59e0b' };
    case 'not reachable':
      return { chip: 'info', avatar: '#3b82f6' };
    case 'rejected':
      return { chip: 'error', avatar: '#ef4444' };
    default:
      return { chip: 'default', avatar: '#64748b' };
  }
};

function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchCalls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/calls');
      const data = Array.isArray(res.data) ? res.data : [];
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || err.message || 'Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
      const leadName = log.lead?.name || 'Unknown';
      const leadPhone = log.lead?.phone || '';
      const agentName = log.agent?.name || '';
      const notes = log.notes || '';
      const searchLower = search.toLowerCase();

      const matchesSearch =
        !search ||
        leadName.toLowerCase().includes(searchLower) ||
        leadPhone.includes(search) ||
        agentName.toLowerCase().includes(searchLower) ||
        notes.toLowerCase().includes(searchLower);

      const matchesStatus = !status || String(log.status).toLowerCase() === status.toLowerCase();

      const logTime = new Date(log.startTime || log.createdAt).getTime();
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = logTime >= todayStart;
      } else if (dateFilter === 'Last 30 Days') {
        matchesDate = logTime >= thirtyDaysAgo;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [logs, search, status, dateFilter]);

  const displayedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  return (
    <Box p={3}>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={600}>
          {filteredLogs.length} Call Logs
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchCalls}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={fetchCalls}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search by phone, name, or notes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />

        <Select
          size="small"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="answered">Answered</MenuItem>
          <MenuItem value="missed">Missed</MenuItem>
          <MenuItem value="not reachable">Not Reachable</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </Select>

        <Box display="flex" gap={1}>
          {['All', 'Today', 'Last 30 Days'].map((item) => (
            <Button
              key={item}
              size="small"
              variant={dateFilter === item ? 'contained' : 'outlined'}
              onClick={() => {
                setDateFilter(item);
                setPage(0);
              }}
            >
              {item}
            </Button>
          ))}
        </Box>
      </Box>

      <Paper variant="outlined">
        {loading ? (
          <Box p={5} display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">Loading call logs from database...</Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Lead Name &amp; Phone</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Called At</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedLogs.length > 0 ? (
                  displayedLogs.map((log) => {
                    const colors = getStatusColor(log.status);
                    const leadName = log.lead?.name || 'Unknown Lead';
                    const leadPhone = log.lead?.phone || '—';
                    const agentName = log.agent?.name || 'Assigned Agent';

                    return (
                      <TableRow key={log._id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ArrowUpward fontSize="small" color="primary" />
                            <Chip
                              label={log.status || 'answered'}
                              size="small"
                              color={colors.chip}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: colors.avatar, width: 34, height: 34, fontSize: 14 }}>
                              {leadName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600} variant="body2">{leadName}</Typography>
                              <Typography variant="caption" color="text.secondary">{leadPhone}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{agentName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatCallTime(log.startTime || log.createdAt)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDuration(log.duration)}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" color="text.secondary" noWrap title={log.notes || '—'}>
                            {log.notes || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {log.lead?.phone ? (
                            <IconButton
                              component="a"
                              href={`tel:${log.lead.phone}`}
                              title={`Dial ${log.lead.phone}`}
                              size="small"
                              color="primary"
                            >
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton size="small" disabled>
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No matching call logs found in database.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={filteredLogs.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}

export default CallLogs;
