import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Radio, RadioGroup,
  FormControlLabel, Paper, Tabs, Tab, Select, InputLabel, FormControl
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const RechurnCustomers = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [dateTab, setDateTab] = useState(1); 
  const [assignOption, setAssignOption] = useState('');
  const [assignToUser, setAssignToUser] = useState('');

  const handleDateTabChange = (event, newValue) => {
    setDateTab(newValue);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} color="primary">
        Rechurn Customers
      </Typography>

      
      <Box display="flex" alignItems="center" gap={2} mt={3}>
        <FormControl size="small">
          <InputLabel>By Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="By Status"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="interested">Interested</MenuItem>
            <MenuItem value="not-interested">Not Interested</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Select Status</InputLabel>
          <Select
            value={userStatus}
            onChange={(e) => setUserStatus(e.target.value)}
            label="Select Status"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ ml: 'auto' }}>
          Filter
        </Button>

        <Button variant="outlined" sx={{ ml: 1 }}>
          History
        </Button>
      </Box>

      
      <Paper elevation={0} sx={{ mt: 4, p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Choose Date range
        </Typography>

        <Tabs value={dateTab} onChange={handleDateTabChange} textColor="primary">
          <Tab label="Today" />
          <Tab label="Last 30 Days" />
          <Tab label="Select Range" />
        </Tabs>

        {dateTab === 2 && (
          <Box display="flex" gap={2} mt={2}>
            <TextField type="date" size="small" fullWidth label="From" InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" fullWidth label="To" InputLabelProps={{ shrink: true }} />
          </Box>
        )}

        
        <Typography mt={3} mb={1} fontWeight={500}>
          Matched Customers
        </Typography>

        <Button
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          sx={{ fontWeight: 600 }}
        >
          Get Count
        </Button>
      </Paper>

      
      <Paper elevation={0} sx={{ mt: 4, p: 3 }}>
        <RadioGroup value={assignOption} onChange={(e) => setAssignOption(e.target.value)}>
          <FormControlLabel
            value="common"
            control={<Radio />}
            label={
              <Box>
                <Typography fontWeight={600}>Assign in Common Pool</Typography>
                <Typography variant="caption" color="text.secondary">
                  Allowed if user has access to web allocation permission
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            value="specific"
            control={<Radio />}
            label={
              <Box>
                <Typography fontWeight={600}>Change owner to Specific Users</Typography>
              </Box>
            }
          />
        </RadioGroup>

        {assignOption === 'specific' && (
          <Box mt={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Assign To</InputLabel>
              <Select
                value={assignToUser}
                onChange={(e) => setAssignToUser(e.target.value)}
                label="Assign To"
              >
                <MenuItem value="user1">User 1</MenuItem>
                <MenuItem value="user2">User 2</MenuItem>
                <MenuItem value="user3">User 3</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      
      <Box mt={4}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          On click of initiate, allocations will be created for the matched customers.
        </Typography>

        <Button
          variant="contained"
          sx={{
            background: 'linear-gradient(to right, #ff5722, #ff9c5a)',
            color: '#fff',
            fontWeight: 'bold',
            px: 5,
            py: 1.5,
            borderRadius: '8px',
          }}
        >
          Initiate
        </Button>
      </Box>
    </Box>
  );
};

export default RechurnCustomers;
