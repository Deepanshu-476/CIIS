'use client';

import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  useTheme
} from '@mui/material';

import {
  PlayArrow,
  Group,
  CalendarToday,
  PhoneMissed,
  Info,
  Refresh,
  MoreVert
} from '@mui/icons-material';

import CountUp from 'react-countup';


const StatCard = ({ label, value, color }) => {
  const theme = useTheme();

  return (
    <Card sx={{ borderLeft: `5px solid ${theme.palette[color]?.main}` }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color={color}>
          <CountUp end={value} duration={1.5} />
        </Typography>
        <Typography variant="body2">{label}</Typography>
      </CardContent>
    </Card>
  );
};


const ActionItemCard = ({ icon, label, value }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'primary.light' }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            <CountUp end={value} duration={1.2} />
          </Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};


const ProgressBarItem = ({ label, value }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight="bold">{value}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': { borderRadius: 4 }
        }}
      />
    </Box>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const stats = {
    connected: 12,
    notConnected: 8,
    personal: 5,
    allocations: 7,
    followups: 15,
    missedCalls: 3,
    totalCustomers: 42,
    statusCounts: {
      'Hot Followup': 5,
      'Cold Followup': 8,
      'Interested': 3,
      'Only Enquiry': 7,
      'On Hold': 2,
      'No Response': 10,
      'Junk Lead': 4,
      'Enrolled': 1,
      'Not contacted': 12,
      'Not interested': 6
    },
    progress: {
      'Start': 30,
      'In Progress': 45,
      'Closed Won': 15,
      'Closed Lost': 10
    },
    talkTime: {
      average: '2m 45s',
      total: '5h 30m'
    },
    completionPercentage: 25
  };

  return (
    <Box p={3} sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          CIIS Dashboard
        </Typography>
        <Box>
          
          <IconButton color="primary">
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      
      <Card
        sx={{
          mb: 3,
          background: isDarkMode
            ? theme.palette.background.paper
            : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)'
        }}
      >
        <CardContent>
          <Grid container justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">🎉 Welcome to CIIS</Typography>
              <Typography variant="body2" color="text.secondary">Complete your onboarding to get started</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress
                variant="determinate"
                value={stats.completionPercentage}
                sx={{
                  width: 100,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': { borderRadius: 4 }
                }}
              />
              <Chip label={`${stats.completionPercentage}%`} color="primary" size="small" />
              <Button variant="contained" startIcon={<PlayArrow />} sx={{ textTransform: 'none' }}>
                Continue Setup
              </Button>
            </Box>
          </Grid>
        </CardContent>
      </Card>

      
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center" gap={1}>
              <Info color="primary" />
              Performance Overview
            </Typography>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            {[
              { label: 'Connected', value: stats.connected, color: 'success' },
              { label: 'Not Connected', value: stats.notConnected, color: 'error' },
              { label: 'Personal', value: stats.personal, color: 'warning' }
            ].map((item) => (
              <Grid item xs={12} sm={4} key={item.label}>
                <StatCard {...item} />
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Typography variant="body2">
              <Box component="span" fontWeight="bold">{stats.talkTime.average}</Box> Avg Talk Time
            </Typography>
            <Typography variant="body2">
              <Box component="span" fontWeight="bold">{stats.talkTime.total}</Box> Total Talk Time
            </Typography>
          </Box>
        </CardContent>
      </Card>

      
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Open Actions" />
        <CardContent>
          <Grid container spacing={2}>
            {[
              { label: 'Allocations', value: stats.allocations, icon: <Group /> },
              { label: 'Followups', value: stats.followups, icon: <CalendarToday /> },
              { label: 'Missed Calls', value: stats.missedCalls, icon: <PhoneMissed color="error" /> }
            ].map((item) => (
              <Grid item xs={12} sm={4} key={item.label}>
                <ActionItemCard {...item} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Customer Progress" />
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Group />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    <CountUp end={stats.totalCustomers} duration={1.4} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Customers</Typography>
                </Box>
              </Box>

              {Object.entries(stats.progress).map(([status, value]) => (
                <ProgressBarItem key={status} label={status} value={value} />
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Lead Status Distribution" />
            <Divider />
            <CardContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <Box
                  key={status}
                  display="flex"
                  justifyContent="space-between"
                  py={1.2}
                  borderBottom={`1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`}
                  sx={{ '&:last-child': { borderBottom: 'none' } }}
                >
                  <Typography variant="body2">{status}</Typography>
                  <Chip label={count} size="small" sx={{ fontWeight: 'bold' }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
