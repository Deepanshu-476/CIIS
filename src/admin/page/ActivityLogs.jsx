import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Popover,
  Checkbox,
  TextField,
  Button,
  Paper,
  Divider,
  useMediaQuery,
  useTheme,
  Chip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';


const generateLogData = (type) => {
  const actions = ['Created', 'Updated', 'Deleted', 'Modified', 'Uploaded'];
  const entities = ['User', 'Process', 'Settings', 'CRM Field', 'Template'];
  const users = ['Admin User', 'System Admin', 'Manager', 'Supervisor'];

  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: users[Math.floor(Math.random() * users.length)],
    action: `${actions[Math.floor(Math.random() * actions.length)]} ${entities[Math.floor(Math.random() * entities.length)]}`,
    details: `${type} action performed`,
    status: Math.random() > 0.3 ? 'success' : 'failed'
  }));
};

const months = ['May - 2025', 'June - 2025', 'July - 2025'];
const eventsList = [
  'Add User',
  'Edit User',
  'Delete User',
  'Bulk Upload Users',
  'Update CrmFields',
  'Add Process',
  'Edit Process',
];

const ActivityLogs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  const [activeTab, setActiveTab] = useState('Admin');
  const [selectedMonth, setSelectedMonth] = useState('July - 2025');
  const [eventAnchorEl, setEventAnchorEl] = useState(null);
  const [searchEvent, setSearchEvent] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setData(generateLogData(activeTab));
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeTab, selectedMonth, selectedEvents]);

  const handleEventClick = (event) => {
    setEventAnchorEl(event.currentTarget);
  };

  const handleEventClose = () => {
    setEventAnchorEl(null);
  };

  const toggleEvent = (eventName) => {
    setSelectedEvents((prev) =>
      prev.includes(eventName)
        ? prev.filter((e) => e !== eventName)
        : [...prev, eventName]
    );
  };

  const clearFilters = () => {
    setSelectedEvents([]);
    setSearchQuery('');
  };

  const open = Boolean(eventAnchorEl);

  
  const filteredData = data?.filter(item => {
    const matchesSearch = item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvents = selectedEvents.length === 0 ||
      selectedEvents.some(event => item.action.includes(event));
    return matchesSearch && matchesEvents;
  });

  return (
    <Box p={isMobile ? 2 : 3}>
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600} color="#3B3E66">
          Activity Logs
        </Typography>

        <Box display="flex" alignItems="center" mt={isMobile ? 2 : 0} width={isMobile ? '100%' : 'auto'}>
          <TextField
            placeholder="Search logs..."
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              mr: 1,
              width: isMobile ? '100%' : 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
          <IconButton onClick={clearFilters} size={isMobile ? 'small' : 'medium'}>
            <RefreshIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          {!isMobile && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ ml: 1, borderRadius: 2 }}
            >
              Export
            </Button>
          )}
        </Box>
      </Box>

      
      <Box mt={3} display="flex" alignItems="center" flexWrap="wrap" gap={2}>
        
        <Box display="flex" alignItems="center" gap={1} sx={{ overflowX: isMobile ? 'auto' : 'visible', width: isMobile ? '100%' : 'auto', pb: isMobile ? 1 : 0 }}>
          {months.map((month) => (
            <Chip
              key={month}
              label={month}
              onClick={() => setSelectedMonth(month)}
              variant={selectedMonth === month ? 'filled' : 'outlined'}
              color={selectedMonth === month ? 'primary' : 'default'}
              sx={{
                borderRadius: 1,
                fontWeight: selectedMonth === month ? 600 : 400,
                borderColor: selectedMonth === month ? '#FA5A28' : '#ddd',
                backgroundColor: selectedMonth === month ? '#FA5A28' : 'transparent',
                color: selectedMonth === month ? '#fff' : '#6D6E8C'
              }}
            />
          ))}
        </Box>

        
        <Box>
          <Button
            variant="outlined"
            onClick={handleEventClick}
            startIcon={<FilterIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: selectedEvents.length > 0 ? '#FA5A28' : '#ddd'
            }}
          >
            {selectedEvents.length > 0 ? (
              <>
                Events: {selectedEvents.length}
                <Badge
                  badgeContent={selectedEvents.length}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </>
            ) : (
              'All Events'
            )}
          </Button>
          <Popover
            open={open}
            anchorEl={eventAnchorEl}
            onClose={handleEventClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <Box p={2} sx={{ width: isMobile ? '90vw' : 300 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Filter Events
              </Typography>
              <TextField
                placeholder="Search events..."
                fullWidth
                size="small"
                variant="outlined"
                value={searchEvent}
                onChange={(e) => setSearchEvent(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {eventsList
                  .filter((e) => e.toLowerCase().includes(searchEvent.toLowerCase()))
                  .map((eventName) => (
                    <Box
                      key={eventName}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1
                        }
                      }}
                    >
                      <Typography variant="body2">{eventName}</Typography>
                      <Checkbox
                        size="small"
                        checked={selectedEvents.includes(eventName)}
                        onChange={() => toggleEvent(eventName)}
                        color="primary"
                      />
                    </Box>
                  ))}
              </Box>
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                  onClick={() => setSelectedEvents([])}
                  sx={{ color: '#FA5A28' }}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleEventClose}
                  variant="contained"
                  sx={{
                    backgroundColor: '#FA5A28',
                    color: '#fff',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#e04a1a'
                    }
                  }}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </Popover>
        </Box>
      </Box>

      
      <Box mt={3}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          textColor="secondary"
          indicatorColor="secondary"
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#FA5A28',
              height: 3
            }
          }}
        >
          <Tab
            value="Admin"
            label={
              <Box display="flex" alignItems="center">
                <Typography fontWeight={600}>Admin</Typography>
                {data && !loading && (
                  <Chip
                    label={data.length}
                    size="small"
                    sx={{ ml: 1, backgroundColor: '#f0f0f0' }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            value="User"
            label={
              <Box display="flex" alignItems="center">
                <Typography fontWeight={600}>User</Typography>
                {data && !loading && (
                  <Chip
                    label={data.length}
                    size="small"
                    sx={{ ml: 1, backgroundColor: '#f0f0f0' }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        
        {loading ? (
          <Box mt={2}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={60}
                sx={{ mb: 1, borderRadius: 1 }}
              />
            ))}
          </Box>
        ) : filteredData && filteredData.length > 0 ? (
          <Paper sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: '60vh', overflow: 'auto' }}>
              <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 600 }}>User</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        {new Date(row.timestamp).toLocaleString()}
                      </TableCell>
                      {!isMobile && <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12, mr: 1 }}>
                            {row.user.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          {row.user}
                        </Box>
                      </TableCell>}
                      <TableCell>{row.action}</TableCell>
                      {!isMobile && <TableCell>{row.details}</TableCell>}
                      <TableCell>
                        <Chip
                          icon={row.status === 'success' ?
                            <CheckCircleIcon fontSize="small" /> :
                            <CancelIcon fontSize="small" />}
                          label={row.status}
                          size="small"
                          sx={{
                            backgroundColor: row.status === 'success' ? '#e6f7ee' : '#ffebee',
                            color: row.status === 'success' ? '#1f7d59' : '#d32f2f'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Paper sx={{
            mt: 2,
            p: 4,
            height: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: 2
          }}>
            <img
              src="https://cdni.iconscout.com/illustration/premium/thumb/data-not-found-7207065-5879252.png"
              alt="no-data"
              style={{ height: isMobile ? 100 : 150 }}
            />
            <Typography mt={2} variant="body1" color="text.secondary">
              No {activeTab.toLowerCase()} activity data found for {selectedMonth}
            </Typography>
            {selectedEvents.length > 0 && (
              <Button
                onClick={clearFilters}
                variant="outlined"
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Clear Filters
              </Button>
            )}
          </Paper>
        )}
      </Box>

      
      {isMobile && (
        <Box
          position="fixed"
          bottom={16}
          right={16}
          zIndex={1000}
        >
          <IconButton
            color="primary"
            sx={{
              backgroundColor: '#FA5A28',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#e04a1a'
              }
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default ActivityLogs;