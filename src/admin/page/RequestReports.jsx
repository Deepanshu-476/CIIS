import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Radio, RadioGroup,
  FormControlLabel, Button, TextField, Grid, Paper
} from '@mui/material';


const basicReports = [
  'Interactions (All)',
  'Interactions (Last/Unique)',
  'Whatsapp Messages',
  'SMS Interactions',
  'Emails',
  'Allocations (Pending)',
  'Allocations (Completed)',
  'Customers',
  'Calls (All)',
  'Calls (Unique)',
  'Login',
];

const advancedReports = [
  'Agent Disposition',
  'Agent Login',
];

const RequestReports = () => {
  const [tab, setTab] = useState(0);
  const [selectedReport, setSelectedReport] = useState('');
  const [startDate, setStartDate] = useState('2025-07-02T00:00');
  const [endDate, setEndDate] = useState('2025-07-16T10:07');

  const handleChangeTab = (event, newValue) => {
    setTab(newValue);
    setSelectedReport('');
  };

  const reportOptions = tab === 0 ? basicReports : advancedReports;

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} color="primary">
        Request Reports
      </Typography>

      <Tabs value={tab} onChange={handleChangeTab} sx={{ mt: 2 }} textColor="inherit">
        <Tab label="Basic Reports" />
        <Tab label="Advanced Reports" />
      </Tabs>

      <Paper elevation={0} sx={{ mt: 2, p: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        
        <Box flex="1">
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Select the report you want to request
          </Typography>
          <RadioGroup
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
          >
            {reportOptions.map((label) => (
              <FormControlLabel
                key={label}
                value={label}
                control={<Radio />}
                label={label}
              />
            ))}
          </RadioGroup>
        </Box>

        
        <Box flex="1">
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Choose Date and Time range
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="From"
                type="datetime-local"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="To"
                type="datetime-local"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            sx={{
              mt: 4,
              background: 'linear-gradient(90deg, #ff6a3d, #ff9c5a)',
              color: '#fff',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              fontSize: '16px',
            }}
            disabled={!selectedReport}
          >
            Request Report
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RequestReports;
