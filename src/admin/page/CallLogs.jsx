import React, { useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment, IconButton, Button,
  MenuItem, Select, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Avatar, Chip, Tooltip, TablePagination
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Phone as PhoneIcon,
  PlayArrow,
  Download as DownloadIcon,
  ArrowUpward,
} from '@mui/icons-material';

function CallLogs() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalCount = 30;

  const mockLogs = [
    {
      id: 1,
      name: 'Unknown',
      phone: '+919811211503',
      by: 'Ashutosh Rai',
      time: '01:59 PM, Today',
      duration: '0m 27s',
      badge: 'U',
      avatarColor: 'green',
      status: 'Outgoing',
      hasRecording: true
    },
    {
      id: 2,
      name: '8837897006',
      phone: '+918837897006',
      by: 'Ashutosh Rai',
      time: '01:51 PM, Today',
      duration: '0m 48s',
      badge: '8',
      avatarColor: 'orangered',
      status: 'Outgoing',
      hasRecording: true
    },
    {
      id: 3,
      name: '9814289955',
      phone: '+919814289955',
      by: 'Ashutosh Rai',
      time: '01:47 PM, Today',
      duration: '0m 35s',
      badge: '9',
      avatarColor: 'orangered',
      status: 'Outgoing',
      hasRecording: true
    },
    {
      id: 4,
      name: '8178597256',
      phone: '+918178597256',
      by: 'Ashutosh Rai',
      time: '12:54 PM, Today',
      duration: '0m 1s',
      badge: '8',
      avatarColor: 'orangered',
      status: 'Outgoing',
      hasRecording: false
    },
    {
      id: 5,
      name: '8360149939',
      phone: '+918360149939',
      by: 'Ashutosh Rai',
      time: '12:51 PM, Today',
      duration: '0m 50s',
      badge: '8',
      avatarColor: 'orangered',
      status: 'Outgoing',
      hasRecording: true
    },
  ];

  return (
    <Box p={3}>
      
      <Box mb={3}>
        <Typography variant="h5" fontWeight={600}>30 Call Logs</Typography>
      </Box>

      
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search by Phone Number"
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

        <IconButton>
          <FilterListIcon />
        </IconButton>

        <Select
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          displayEmpty
        >
          <MenuItem value="">By Status</MenuItem>
          <MenuItem value="Outgoing">Outgoing</MenuItem>
          <MenuItem value="Incoming">Incoming</MenuItem>
        </Select>

        <Select
          size="small"
          value=""
          displayEmpty
        >
          <MenuItem value="">Select Status</MenuItem>
        </Select>

        <Box display="flex" gap={1}>
          {['Today', 'Last 30 Days', 'Select Range'].map((item) => (
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
            {mockLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ArrowUpward fontSize="small" color="primary" />
                    <Chip label={log.status} size="small" />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: log.avatarColor }}>
                      {log.badge}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{log.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{log.phone}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{log.by}</TableCell>
                <TableCell>{log.time}</TableCell>
                <TableCell>{log.duration}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      startIcon={<PlayArrow />}
                      variant="outlined"
                      color="error"
                      disabled={!log.hasRecording}
                    >
                      Play Recording
                    </Button>
                    <IconButton disabled={!log.hasRecording}>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton>
                      <PhoneIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  );
}

export default CallLogs;
