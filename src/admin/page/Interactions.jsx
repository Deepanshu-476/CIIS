'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tabs,
  Tab,
  Button,
  Stack,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  FilterList as FilterListIcon,
  Settings as SettingsIcon,
  SortByAlpha as SortByAlphaIcon,
  CalendarMonth as CalendarMonthIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';

const Interactions = () => {
  const theme = useTheme();

  
  const interactions = [
    {
      id: 1,
      name: '7289868659',
      phone: '+917289868659',
      status: 'Appointment',
      interactedOn: '04:35 PM, Today',
      company: 'Green',
      assignedBy: 'Ashutosh Rai',
      color: '#FF5722',
      badge: '7',
    },
    {
      id: 2,
      name: 'Loterry',
      phone: '+919653148633',
      status: 'Not contacted',
      interactedOn: '04:13 PM, Today',
      company: '--',
      assignedBy: 'Ashutosh Rai',
      color: '#3F51B5',
      badge: 'L',
    },
    {
      id: 3,
      name: '7988785540',
      phone: '+917988785540',
      status: 'Appointment',
      interactedOn: '03:22 PM, Today',
      company: '--',
      assignedBy: 'Ashutosh Rai',
      color: '#FF5722',
      badge: '7',
    },
    {
      id: 4,
      name: '8427278597',
      phone: '+918427278597',
      status: 'Not contacted',
      interactedOn: '03:16 PM, Today',
      company: '--',
      assignedBy: 'Ashutosh Rai',
      color: '#FF9800',
      badge: '8',
    },
    {
      id: 5,
      name: '8976646470',
      phone: '+918976646470',
      status: 'Not contacted',
      interactedOn: '03:11 PM, Today',
      company: '--',
      assignedBy: 'Ashutosh Rai',
      color: '#FF9800',
      badge: '8',
    },
    {
      id: 6,
      name: '5769796640',
      phone: '+915769796640',
      status: 'Not contacted',
      interactedOn: '03:10 PM, Today',
      company: '--',
      assignedBy: 'Ashutosh Rai',
      color: '#FF5722',
      badge: '5',
    },
  ];

  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  
  const totalCount = 1210;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Last 30 Days');
  const [statusFilter, setStatusFilter] = useState('Select Status');
  const [uniqueFilter, setUniqueFilter] = useState('Unique');

  const tabs = ['Today', 'Last 30 Days', 'Select Range'];
  const statusOptions = ['Select Status', 'Completed', 'Pending', 'In Progress', 'Cancelled'];

  function handleTabChange(_event, newValue) {
    setActiveTab(newValue);
  }

  
  const statusColors = {
    'Appointment': 'success',
    'Not contacted': 'default',
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {totalCount.toLocaleString()}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" color="text.secondary">
              Interactions
            </Typography>
            <Tooltip title="Interaction metrics">
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2 }}
        >
          New Interaction
        </Button>
      </Box>

      
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            
            <Stack direction="row" spacing={1} alignItems="center" flex={1} minWidth={300}>
              <TextField
                fullWidth
                placeholder="Search by name, phone, or company"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title="Call search result">
                <IconButton
                  color="primary"
                  sx={{
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: '#fff'
                    }
                  }}
                >
                  <PhoneIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={uniqueFilter}
                onChange={(e) => setUniqueFilter(e.target.value)}
              >
                <FormControlLabel
                  value="Unique"
                  control={<Radio color="primary" size="small" />}
                  label="Unique"
                />
                <FormControlLabel
                  value="All"
                  control={<Radio color="primary" size="small" />}
                  label="All"
                />
              </RadioGroup>
            </FormControl>

            
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab}
                value={tab}
                label={tab}
                sx={{ minWidth: 'unset' }}
              />
            ))}
          </Tabs>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              sx={{ textTransform: 'none' }}
            >
              Assigned By
            </Button>

            <Tooltip title="Filter">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sort">
              <IconButton>
                <SortByAlphaIcon />
              </IconButton>
            </Tooltip>
            
          </Stack>
        </Stack>
      </Paper>

      
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.grey[50] }}>
              <TableRow>
                <TableCell width={60}></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Interacted On</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Company</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Assigned By</Typography></TableCell>
                <TableCell width={40}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {interactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Avatar
                        sx={{
                          bgcolor: item.color,
                          width: 36,
                          height: 36,
                          fontSize: 16,
                          fontWeight: 600
                        }}
                      >
                        {item.badge}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={statusColors[item.status] || 'default'}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderRadius: 1,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: theme.palette.grey[300],
                          backgroundColor: theme.palette.grey[50],
                          color: theme.palette.text.primary
                        }}
                      />
                    </TableCell>
                    <TableCell>{item.interactedOn}</TableCell>
                    <TableCell>{item.company}</TableCell>
                    <TableCell>{item.assignedBy}</TableCell>
                    <TableCell>
                      <Tooltip title="Call customer">
                        <IconButton size="small">
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.grey[50]
          }}
          ActionsComponent={({ count, page, rowsPerPage, onPageChange }) => (
            <Box sx={{ flexShrink: 0, ml: 2 }}>
              <Tooltip title="First page">
                <IconButton
                  onClick={() => onPageChange(null, 0)}
                  disabled={page === 0}
                  aria-label="first page"
                >
                  <FirstPageIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Previous page">
                <IconButton
                  onClick={() => onPageChange(null, page - 1)}
                  disabled={page === 0}
                  aria-label="previous page"
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next page">
                <IconButton
                  onClick={() => onPageChange(null, page + 1)}
                  disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                  aria-label="next page"
                >
                  <ChevronRightIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Last page">
                <IconButton
                  onClick={() => onPageChange(null, Math.max(0, Math.ceil(count / rowsPerPage) - 1))}
                  disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                  aria-label="last page"
                >
                  <LastPageIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        />
      </Paper>
    </Box>
  );
};

export default Interactions;
