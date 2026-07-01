import React from 'react';
import {
  Box,
  Typography,
  InputAdornment,
  TextField,
  Tabs,
  Tab,
  Button,
  MenuItem,
  Select,
  IconButton,
  Stack,
  useTheme
} from '@mui/material';
import {
  Search,
  Phone,
  FilterList,
  SortByAlpha,
  Tune,
  Person
} from '@mui/icons-material';

const Allocations = () => {
  const [tab, setTab] = React.useState(0);
  const [status, setStatus] = React.useState('');
  const [user, setUser] = React.useState('');
  const theme = useTheme();

  return (
    <>
      
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          px: theme.spacing(3),
          pt: theme.spacing(2),
          pb: theme.spacing(1),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              0
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Allocations
            </Typography>
            <TextField
              placeholder="Search by Phone Number"
              size="small"
              sx={{ width: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Phone fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Button
              variant="contained"
              disableElevation
              size="small"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                px: 2,
                bgcolor: theme.palette.grey[900],
                '&:hover': {
                  bgcolor: theme.palette.grey[800]
                }
              }}
            >
              Overall
            </Button>
            <Button variant="outlined" size="small" sx={{ textTransform: 'none', px: 2 }}>
              Last 30 Days
            </Button>
            <Button variant="outlined" size="small" sx={{ textTransform: 'none', px: 2 }}>
              Select Range
            </Button>

            <Select size="small" displayEmpty value="" sx={{ minWidth: 140 }}>
              <MenuItem value="">By Status</MenuItem>
            </Select>

            <Select
              size="small"
              displayEmpty
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Select Status</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="attempted">Attempted</MenuItem>
            </Select>

            <Select
              size="small"
              displayEmpty
              value={user}
              onChange={(e) => setUser(e.target.value)}
              startAdornment={<Person fontSize="small" sx={{ mr: 1 }} />}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Selected Users</MenuItem>
              <MenuItem value="user1">User 1</MenuItem>
              <MenuItem value="user2">User 2</MenuItem>
            </Select>

            <IconButton size="small"><FilterList /></IconButton>
            <IconButton size="small"><SortByAlpha /></IconButton>
            <IconButton size="small"><Tune /></IconButton>
          </Stack>
        </Box>

        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            textColor="inherit"
            indicatorColor="error"
            TabIndicatorProps={{ sx: { height: 3, borderRadius: 2 } }}
          >
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontWeight="medium" color={theme.palette.error.main}>New</Typography>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.error.main,
                      color: '#fff',
                      fontSize: '12px',
                      px: 1,
                      borderRadius: '50%',
                      minWidth: 20,
                      textAlign: 'center',
                      lineHeight: '20px'
                    }}
                  >
                    0
                  </Box>
                </Box>
              }
              sx={{ textTransform: 'none', minWidth: 100 }}
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontWeight="medium" color="text.secondary">Attempted</Typography>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[300],
                      color: theme.palette.text.primary,
                      fontSize: '12px',
                      px: 1,
                      borderRadius: '50%',
                      minWidth: 20,
                      textAlign: 'center',
                      lineHeight: '20px'
                    }}
                  >
                    0
                  </Box>
                </Box>
              }
              sx={{ textTransform: 'none', minWidth: 120 }}
            />
          </Tabs>

          <Typography variant="body2" color="text.secondary">
            0 Allocation Selected
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.error.main,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Assign to <Person fontSize="small" sx={{ ml: 0.5 }} />
          </Typography>
        </Box>
      </Box>

      
      <Box
        sx={{
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.background.paper
        }}
      >
        <img
          src="/images/no-allocations.png" 
          alt="No Allocations"
          style={{ width: 240, marginBottom: theme.spacing(3) }}
        />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          No Allocations
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Looks like there are no allocations data to display for the selected users
        </Typography>
      </Box>
    </>
  );
};

export default Allocations;
