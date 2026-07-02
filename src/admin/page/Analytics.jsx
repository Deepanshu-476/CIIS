
import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, MenuItem, Select, Card, CardContent,
  Grid, Paper, Divider, useTheme, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Stack
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { FiUser, FiClock, FiPhone, FiActivity, FiTrendingUp } from 'react-icons/fi';


const generateCallData = () => {
  const hours = Array.from({ length: 12 }, (_, i) => `${i + 9}h`);
  return hours.map(hour => ({
    hour,
    Connected: Math.floor(Math.random() * 10) + 1,
    NotConnected: Math.floor(Math.random() * 3),
    Missed: Math.floor(Math.random() * 2),
    Voicemail: Math.floor(Math.random() * 2)
  }));
};

const generateTalkTimeData = () => {
  const hours = Array.from({ length: 12 }, (_, i) => `${i + 9}h`);
  return hours.map(hour => ({
    hour,
    talkTime: Math.floor(Math.random() * 30) + 5,
    holdTime: Math.floor(Math.random() * 10),
    wrapUpTime: Math.floor(Math.random() * 8)
  }));
};

const generateLoginAnalytics = () => ({
  loginDuration: `${Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 60)}m`,
  wrapUpTime: `${Math.floor(Math.random() * 15)}m ${Math.floor(Math.random() * 60)}s`,
  breakTime: `${Math.floor(Math.random() * 30)}m ${Math.floor(Math.random() * 60)}s`,
  idleTime: `${Math.floor(Math.random() * 45)}m ${Math.floor(Math.random() * 60)}s`,
  totalTalkTime: `${Math.floor(Math.random() * 90)}m ${Math.floor(Math.random() * 60)}s`,
  productivityScore: Math.floor(Math.random() * 20) + 80
});

const userPerformanceData = [
  { id: 1, name: 'John Doe', avatar: 'JD', calls: 42, talkTime: '3h 22m', score: 92, trend: 'up' },
  { id: 2, name: 'Jane Smith', avatar: 'JS', calls: 38, talkTime: '2h 58m', score: 88, trend: 'up' },
  { id: 3, name: 'Robert Johnson', avatar: 'RJ', calls: 35, talkTime: '2h 45m', score: 85, trend: 'down' },
  { id: 4, name: 'Emily Davis', avatar: 'ED', calls: 31, talkTime: '2h 12m', score: 82, trend: 'up' },
  { id: 5, name: 'Michael Wilson', avatar: 'MW', calls: 28, talkTime: '1h 58m', score: 78, trend: 'down' }
];

const callDistributionData = [
  { name: 'Connected', value: 68, color: '#10b981' },
  { name: 'Not Connected', value: 12, color: '#3b82f6' },
  { name: 'Missed', value: 8, color: '#ef4444' },
  { name: 'Voicemail', value: 12, color: '#f59e0b' }
];

const performanceRadarData = [
  { subject: 'Calls', A: 85, fullMark: 100 },
  { subject: 'Talk Time', A: 78, fullMark: 100 },
  { subject: 'Resolution', A: 92, fullMark: 100 },
  { subject: 'Satisfaction', A: 88, fullMark: 100 },
  { subject: 'Productivity', A: 84, fullMark: 100 }
];

const Analytics = () => {
  const [tab, setTab] = useState(0);
  const [timeRange, setTimeRange] = useState('Today');
  const theme = useTheme();

  const handleTabChange = (e, newValue) => setTab(newValue);

  
  const callData = generateCallData();
  const talkTimeData = generateTalkTimeData();
  const loginAnalytics = generateLoginAnalytics();

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Analytics Dashboard</Typography>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="Today">Today</MenuItem>
          <MenuItem value="Yesterday">Yesterday</MenuItem>
          <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
          <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
          <MenuItem value="Custom Range">Custom Range</MenuItem>
        </Select>
      </Box>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 4,
            borderRadius: 2
          }
        }}
      >
        <Tab label="Overall Analytics" icon={<FiActivity size={18} />} iconPosition="start" />
        <Tab label="User Performance" icon={<FiUser size={18} />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.primary.main
                  }}
                >
                  <FiPhone size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Calls</Typography>
                  <Typography variant="h5">124</Typography>
                  <Typography variant="caption" color="success.main">+12% from yesterday</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: theme.palette.success.light,
                    color: theme.palette.success.main
                  }}
                >
                  <FiClock size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Avg. Talk Time</Typography>
                  <Typography variant="h5">4m 32s</Typography>
                  <Typography variant="caption" color="error.main">-5% from yesterday</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: theme.palette.warning.light,
                    color: theme.palette.warning.main
                  }}
                >
                  <FiUser size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Active Agents</Typography>
                  <Typography variant="h5">14</Typography>
                  <Typography variant="caption" color="success.main">+2 from yesterday</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: theme.palette.info.light,
                    color: theme.palette.info.main
                  }}
                >
                  <FiTrendingUp size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Satisfaction</Typography>
                  <Typography variant="h5">89%</Typography>
                  <LinearProgress variant="determinate" value={89} color="info" sx={{ mt: 1, height: 6, borderRadius: 3 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          
          <Grid item xs={12} lg={8}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" mb={2}>Call Activity</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={callData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: theme.shadows[3] }}
                    formatter={(value, name) => [`${value} calls`, name.replace(/([A-Z])/g, ' $1').trim()]}
                  />
                  <Legend
                    formatter={(value) => value.replace(/([A-Z])/g, ' $1').trim()}
                  />
                  <Bar dataKey="Connected" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NotConnected" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Missed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Voicemail" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          
          <Grid item xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" mb={2}>Call Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={callDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {callDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} calls`]}
                    contentStyle={{ borderRadius: 8, boxShadow: theme.shadows[3] }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box mt={2}>
                {callDistributionData.map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <Box width={12} height={12} bgcolor={item.color} borderRadius="2px" mr={1} />
                    <Typography variant="body2">{item.name}: {item.value} calls</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          
          <Grid item xs={12} lg={8}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" mb={2}>Talk Time Analysis</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={talkTimeData}>
                  <defs>
                    <linearGradient id="colorTalkTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHoldTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" />
                  <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: theme.shadows[3] }}
                    formatter={(value, name) => [`${value} min`, name.replace(/([A-Z])/g, ' $1').trim()]}
                  />
                  <Legend
                    formatter={(value) => value.replace(/([A-Z])/g, ' $1').trim()}
                  />
                  <Area type="monotone" dataKey="talkTime" stroke="#06b6d4" fillOpacity={1} fill="url(#colorTalkTime)" />
                  <Area type="monotone" dataKey="holdTime" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHoldTime)" />
                  <Area type="monotone" dataKey="wrapUpTime" stroke="#f59e0b" fillOpacity={1} fill="url(#colorHoldTime)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          
          <Grid item xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" mb={2}>Agent Activity</Typography>
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary">Productivity Score</Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <Box width="100%" mr={1}>
                    <LinearProgress
                      variant="determinate"
                      value={loginAnalytics.productivityScore}
                      color={
                        loginAnalytics.productivityScore > 90 ? 'success' :
                          loginAnalytics.productivityScore > 75 ? 'primary' : 'warning'
                      }
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {loginAnalytics.productivityScore}%
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Time Breakdown</Typography>
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Login Duration</Typography>
                    <Typography variant="body2" fontWeight={600}>{loginAnalytics.loginDuration}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Total Talk Time</Typography>
                    <Typography variant="body2" fontWeight={600}>{loginAnalytics.totalTalkTime}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Wrap up Time</Typography>
                    <Typography variant="body2" fontWeight={600}>{loginAnalytics.wrapUpTime}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Break Time</Typography>
                    <Typography variant="body2" fontWeight={600}>{loginAnalytics.breakTime}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Idle Time</Typography>
                    <Typography variant="body2" fontWeight={600}>{loginAnalytics.idleTime}</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          
          <Grid item xs={12} lg={8}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" mb={2}>Top Performers</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell align="right">Calls</TableCell>
                      <TableCell align="right">Talk Time</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell align="right">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userPerformanceData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                              {row.avatar}
                            </Avatar>
                            <Typography>{row.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.calls}</TableCell>
                        <TableCell align="right">{row.talkTime}</TableCell>
                        <TableCell align="right">
                          <LinearProgress
                            variant="determinate"
                            value={row.score}
                            color={
                              row.score > 90 ? 'success' :
                                row.score > 75 ? 'primary' : 'warning'
                            }
                            sx={{ height: 8, borderRadius: 2 }}
                          />
                          <Typography variant="body2">{row.score}%</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {row.trend === 'up' ? (
                            <Box color={theme.palette.success.main} display="flex" alignItems="center" justifyContent="flex-end">
                              <FiTrendingUp size={18} />
                              <Typography ml={0.5}>+5%</Typography>
                            </Box>
                          ) : (
                            <Box color={theme.palette.error.main} display="flex" alignItems="center" justifyContent="flex-end">
                              <FiTrendingUp size={18} style={{ transform: 'rotate(180deg)' }} />
                              <Typography ml={0.5}>-3%</Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          
          <Grid item xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" mb={2}>Performance Metrics</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Average"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: theme.shadows[3] }}
                    formatter={(value) => [`${value}/100`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" mb={2}>Weekly Trend Analysis</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { day: 'Mon', calls: 120, talkTime: 210 },
                  { day: 'Tue', calls: 135, talkTime: 230 },
                  { day: 'Wed', calls: 128, talkTime: 195 },
                  { day: 'Thu', calls: 145, talkTime: 250 },
                  { day: 'Fri', calls: 132, talkTime: 220 },
                  { day: 'Sat', calls: 90, talkTime: 150 },
                  { day: 'Sun', calls: 60, talkTime: 100 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: theme.shadows[3] }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="talkTime" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;