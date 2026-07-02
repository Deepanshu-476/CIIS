import React from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const licenses = [
  {
    id: 1,
    user: {
      name: 'Ashutosh Rai',
      role: 'Admin',
    },
    expiry: '10 Aug 2025',
    created: '12 FEB 2025',
    type: 'Paid',
    expired: false,
  },
  {
    id: 2,
    user: null,
    expiry: '27 Jun 2025',
    created: '12 FEB 2025',
    type: 'Demo',
    expired: true,
  },
  {
    id: 3,
    user: null,
    expiry: '22 Feb 2025',
    created: '12 FEB 2025',
    type: 'Signup',
    expired: true,
  },
];

function Licenses() {
  const used = licenses.filter((l) => l.user).length;
  const unused = licenses.length - used;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ p: 2 }}>
      
      <Typography variant="h6" gutterBottom>
        3 Licenses{' '}
        <Typography component="span" sx={{ color: 'green', fontWeight: 500 }}>
          Used: {used}
        </Typography>{' '}
        |{' '}
        <Typography component="span" sx={{ color: '#f57c00', fontWeight: 500 }}>
          Un Used: {unused}
        </Typography>
      </Typography>

      
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Select State</InputLabel>
            <Select defaultValue="">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="active">Active</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Usage</InputLabel>
            <Select defaultValue="">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="used">Used</MenuItem>
              <MenuItem value="unused">Unused</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort by</InputLabel>
            <Select defaultValue="old">
              <MenuItem value="old">Date Created: Old to New</MenuItem>
              <MenuItem value="new">Date Created: New to Old</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      
      <Box sx={{ overflowX: 'auto' }}>
        
        <Paper
          sx={{
            p: 2,
            bgcolor: '#f9fafb',
            fontWeight: 500,
            minWidth: 600,
          }}
        >
          <Grid container>
            <Grid item xs={3}>
              License assigned to
            </Grid>
            <Grid item xs={3}>
              Expiry Date
            </Grid>
            <Grid item xs={3}>
              Created on
            </Grid>
            <Grid item xs={3}>
              Type
            </Grid>
          </Grid>
        </Paper>

        
        {licenses.map((license) => (
          <Paper
            key={license.id}
            sx={{
              p: 2,
              mt: 1,
              minWidth: 600,
            }}
          >
            <Grid container alignItems="center">
              <Grid item xs={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ bgcolor: '#ff5722' }}>
                    {license.user ? license.user.name[0] : ''}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={500} fontSize="0.9rem">
                      {license.user ? license.user.name : '<UNASSIGNED>'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {license.user ? license.user.role : ''}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontSize="0.9rem">{license.expiry}</Typography>
                  {license.expired && (
                    <Chip
                      label="Expired"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>

              <Grid item xs={3}>
                <Typography fontSize="0.9rem">{license.created}</Typography>
              </Grid>

              <Grid item xs={3}>
                <Chip
                  label={license.type}
                  size="small"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    fontWeight: 500,
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

export default Licenses;
