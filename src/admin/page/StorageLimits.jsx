import React from 'react';
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PhoneIcon from '@mui/icons-material/Phone';

function StorageLimits() {
  const available = 4036;
  const total = 10000;
  const used = total - available;
  const percentUsed = (used / total) * 100;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Storage
      </Typography>

      <Grid container spacing={3}>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">CUSTOMER STORAGE</Typography>
                <InfoOutlinedIcon fontSize="small" color="disabled" />
              </Box>
              <Button variant="outlined" color="error">
                Clean Up →
              </Button>
            </Box>

            
            <Box mt={3} mb={2}>
              <Typography variant="h4" fontWeight="bold" color="error">
                {available.toLocaleString()} <Typography component="span" fontSize={16}>40.00%</Typography>
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Available Customers
              </Typography>

              <Typography variant="h6" color="text.primary">
                {used.toLocaleString()}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={percentUsed}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  my: 1,
                  backgroundColor: '#eee',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#ff5722' },
                }}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Limit Used {percentUsed.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Customers Limit {total.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            
            <Typography fontWeight="bold" mt={4} mb={2}>
              CUSTOMERS UTILISATION
            </Typography>

            <Box display="flex" gap={2} mb={2}>
              <FormControl size="small">
                <InputLabel>Process</InputLabel>
                <Select defaultValue="default">
                  <MenuItem value="default">Default process</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Time</InputLabel>
                <Select defaultValue="3m">
                  <MenuItem value="3m">Last 3 months</MenuItem>
                </Select>
              </FormControl>
            </Box>

            
            <Box mt={2} px={1}>
              <Box display="flex" alignItems="flex-end" height={150} gap={4}>
                
                <Box textAlign="center">
                  <Box sx={{ height: 90, width: 20, bgcolor: '#ff5722', borderRadius: 1 }} />
                  <Typography variant="caption">May</Typography>
                </Box>
                
                <Box textAlign="center">
                  <Box sx={{ height: 50, width: 20, bgcolor: '#ff5722', borderRadius: 1 }} />
                  <Typography variant="caption">Jun</Typography>
                </Box>
                
                <Box textAlign="center">
                  <Box sx={{ height: 70, width: 20, bgcolor: '#ff5722', borderRadius: 1 }} />
                  <Typography variant="caption">Jul</Typography>
                </Box>
              </Box>
              <Typography variant="caption" mt={2} display="block">
                14 Apr 25 - 14 Jul 25
              </Typography>
            </Box>
          </Paper>
        </Grid>

        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontWeight="bold">CALL RECORDINGS</Typography>
              <InfoOutlinedIcon fontSize="small" color="disabled" />
            </Box>

            <Box display="flex" alignItems="center" mt={3} gap={2}>
              <PhoneIcon sx={{ fontSize: 30, color: '#666' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Call Recording Duration
                </Typography>
                <Typography variant="h6" color="error" fontWeight="bold">
                  6 months
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default StorageLimits;