import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider,
  Stack
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const DataCleanup = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cleanupMethod, setCleanupMethod] = useState('now');
  const [dateRange, setDateRange] = useState('6months');

  const handleCleanupChange = (event, newValue) => {
    if (newValue !== null) {
      setCleanupMethod(newValue);
    }
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
  };

  return (
    <Box p={2}>
      <Typography variant="h6" fontWeight={600} color="#2d3748" mb={2}>
        Data Cleanup
      </Typography>

      <Box
        p={2}
        bgcolor="#f9f9f9"
        borderRadius={2}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Process</InputLabel>
            <Select value={"default"} label="Process">
              <MenuItem value="default">Default process</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value="" label="Status">
              <MenuItem value="">Select Status</MenuItem>
            </Select>
          </FormControl>

          <IconButton color="default">
            <FilterListIcon />
          </IconButton>

          <IconButton color="error">
            <PeopleIcon />
            <Box component="span" fontSize={10} color="white" bgcolor="error.main" px={0.5} borderRadius={1} ml={-1}>
              1
            </Box>
          </IconButton>
        </Stack>

        
        <Typography mt={1}>Choose a cleanup method</Typography>
        <ToggleButtonGroup
          value={cleanupMethod}
          exclusive
          onChange={handleCleanupChange}
          size="small"
        >
          <ToggleButton value="now">
            {cleanupMethod === 'now' ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />}
            &nbsp;Cleanup Now
          </ToggleButton>
          <ToggleButton value="schedule">
            {cleanupMethod === 'schedule' ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />}
            &nbsp;Schedule Auto Cleanup
          </ToggleButton>
        </ToggleButtonGroup>

        
        <Typography mt={2}>Choose Data Cleanup Date Range</Typography>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
          <Button
            variant={dateRange === '6months' ? 'contained' : 'outlined'}
            onClick={() => handleDateRangeChange('6months')}
          >
            Older than 6 months
          </Button>
          <Button
            variant={dateRange === '1year' ? 'contained' : 'outlined'}
            onClick={() => handleDateRangeChange('1year')}
          >
            Older than 1 year
          </Button>
          <Button
            variant={dateRange === 'custom' ? 'contained' : 'outlined'}
            onClick={() => handleDateRangeChange('custom')}
          >
            Select Range
          </Button>
        </Stack>
      </Box>

      
      <Box p={2} bgcolor="#f9f9f9" borderRadius={2} mt={3}>
        <Typography fontWeight={600} mb={1}>Matched Customers</Typography>
        <Button variant="outlined" color="error" startIcon={<AutorenewIcon />}>
          Get Count
        </Button>
        <Divider sx={{ my: 2 }} />
        <Typography fontSize={12} color="text.secondary">
          On click of 'Download & Delete', the deleted data will be sent to your registered email (careerinfowisitsolutions@gmail.com) in Excel format
        </Typography>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mt={2}>
          <Button fullWidth variant="outlined" color="error">
            Download & Delete
          </Button>
          <Button fullWidth variant="contained" sx={{ bgcolor: '#ff7a59' }}>
            Delete
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default DataCleanup;