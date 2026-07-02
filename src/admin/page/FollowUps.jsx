import React, { useState } from 'react';
import {
  Box, Typography, InputBase, Select, MenuItem, Button, Tabs, Tab,
  Paper, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SortIcon from '@mui/icons-material/Sort';
import ViewListIcon from '@mui/icons-material/ViewList';

const mockData = [
  {
    id: 1, name: '', phone: '7717433361', status: 'Cold Follow Up',
    followup: '06:00 AM, 1 Aug', assignedBy: 'Ashutosh Rai', assignTo: 'Ashutosh Rai',
    company: '--', avatar: '7', color: '#FF5722',
  },
  {
    id: 2, name: 'Ram', phone: '9445980231', status: 'Cold Follow Up',
    followup: '10:00 AM, 29 Jul', assignedBy: 'Ashutosh Rai', assignTo: 'Ashutosh Rai',
    company: 'Blue', avatar: 'R', color: '#2196F3',
  },
  {
    id: 3, name: 'RIDHIMA', phone: '8360042884', status: 'Appointment',
    followup: '10:55 AM, 22 Jul', assignedBy: 'Ashutosh Rai', assignTo: 'Ashutosh Rai',
    company: '--', avatar: 'R', color: '#2196F3',
  },
  {
    id: 4, name: '', phone: '7988785540', status: 'Appointment',
    followup: '11:30 AM, 16 Jul', assignedBy: 'Ashutosh Rai', assignTo: 'Ashutosh Rai',
    company: '--', avatar: '7', color: '#FF5722',
  },
  {
    id: 5, name: '', phone: '9988003622', status: 'Not contacted',
    followup: '12:30 AM, 14 Jul', assignedBy: 'Ashutosh Rai', assignTo: 'Ashutosh Rai',
    company: '--', avatar: '9', color: '#FF5722',
  },
];

const statusColors = {
  'Cold Follow Up': '#E5E8F1',
  'Appointment': '#E5E8F1',
  'Not contacted': '#E5E8F1',
};

function FollowUps() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filteredData = mockData.filter(row => {
    const matchSearch = row.phone.includes(search);
    const matchStatus = status ? row.status === status : true;
    return matchSearch && matchStatus;
  });

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', p: 3 }}>
      
      <Box mb={2}>
        <Typography variant="h5" fontWeight={700}>100</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Follow-Ups
          <Box
            component="span"
            sx={{
              ml: 1,
              bgcolor: theme.palette.grey[200],
              borderRadius: '50%',
              px: 1.2,
              py: 0.5,
              display: 'inline-block',
              cursor: 'pointer',
            }}
          >
            ?
          </Box>
        </Typography>
      </Box>

      
      <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={3}>
        <Paper
          component="form"
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: { xs: '100%', sm: 300 },
            px: 2,
            borderRadius: theme.shape.borderRadius
          }}
        >
          <SearchIcon />
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search by Phone Number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <IconButton>
            📞▼
          </IconButton>
        </Paper>

        <Tabs
          value={tab}
          onChange={(e, newVal) => setTab(newVal)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Upcoming" />
        </Tabs>

        <Select
          value={status}
          onChange={e => setStatus(e.target.value)}
          displayEmpty
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">By Status</MenuItem>
          <MenuItem value="Cold Follow Up">Cold Follow Up</MenuItem>
          <MenuItem value="Appointment">Appointment</MenuItem>
          <MenuItem value="Not contacted">Not contacted</MenuItem>
        </Select>

        <Select defaultValue="" sx={{ minWidth: 120 }}>
          <MenuItem value="">Select Status</MenuItem>
        </Select>

        <IconButton><ScheduleIcon /></IconButton>
        <IconButton><SortIcon /></IconButton>
        <IconButton><ViewListIcon /></IconButton>
      </Box>

      
      <TableContainer component={Paper} sx={{ borderRadius: theme.shape.borderRadius * 1.5, boxShadow: theme.shadows[2] }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.background.default }}>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Followup On</strong></TableCell>
              <TableCell><strong>Assigned By</strong></TableCell>
              <TableCell><strong>Assign To</strong></TableCell>
              <TableCell><strong>Company Name</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map(row => (
              <TableRow key={row.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: row.color }}>{row.avatar}</Avatar>
                    <Box>
                      <Typography fontWeight={700}>
                        {row.name || <b>{row.phone}</b>}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">+91{row.phone}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      backgroundColor: statusColors[row.status],
                      display: 'inline-block',
                      fontWeight: 600,
                    }}
                  >
                    {row.status.length > 13 ? `${row.status.slice(0, 13)}…` : row.status}
                  </Box>
                </TableCell>
                <TableCell>{row.followup}</TableCell>
                <TableCell>{row.assignedBy}</TableCell>
                <TableCell>{row.assignTo}</TableCell>
                <TableCell>{row.company}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default FollowUps;
