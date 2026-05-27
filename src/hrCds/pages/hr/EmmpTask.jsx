import React, { useEffect, useState } from 'react';
import axios from '../../../utils/axiosConfig';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, TableContainer, Chip, CircularProgress,
  Stack, Divider, Card, CardContent, Grid, Avatar, Fade,
  LinearProgress, useTheme, useMediaQuery, Tooltip, Badge,
  Button, FormControl, Select, MenuItem, Snackbar,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, InputLabel, OutlinedInput, Checkbox, ListItemText,
  InputAdornment, Modal
} from '@mui/material';
import {
  FiCheckCircle, FiClock, FiAlertCircle, FiXCircle,
  FiUsers, FiTrendingUp, FiCalendar, FiFilter,
  FiRefreshCw, FiArrowRight, FiUser, FiList,
  FiPlus, FiEdit2, FiTrash2, FiMessageCircle,
  FiFileText, FiMic, FiDownload, FiFlag, FiBell
} from 'react-icons/fi';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Enhanced Styled Components
const TaskCard = styled(Card)(({ theme, priority = 'medium' }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
  }),
  borderLeft: `4px solid ${
    priority === 'high' ? theme.palette.error.main :
    priority === 'medium' ? theme.palette.warning.main :
    theme.palette.success.main
  }`,
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)',
  },
}));

const StatCard = styled(Card)(({ theme, color = 'primary' }) => ({
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
  }),
  borderLeft: `4px solid ${theme.palette[color].main}`,
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)',
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  ...(status === 'completed' && {
    background: `${theme.palette.success.main}20`,
    color: theme.palette.success.dark,
    border: `1px solid ${theme.palette.success.main}40`,
  }),
  ...(status === 'rejected' && {
    background: `${theme.palette.error.main}20`,
    color: theme.palette.error.dark,
    border: `1px solid ${theme.palette.error.main}40`,
  }),
  ...(status === 'pending' && {
    background: `${theme.palette.warning.main}20`,
    color: theme.palette.warning.dark,
    border: `1px solid ${theme.palette.warning.main}40`,
  }),
  ...(status === 'in-progress' && {
    background: `${theme.palette.info.main}20`,
    color: theme.palette.info.dark,
    border: `1px solid ${theme.palette.info.main}40`,
  }),
}));

const PriorityChip = styled(Chip)(({ theme, priority }) => ({
  fontWeight: 500,
  ...(priority === 'high' && {
    background: `${theme.palette.error.main}20`,
    color: theme.palette.error.dark,
  }),
  ...(priority === 'medium' && {
    background: `${theme.palette.warning.main}20`,
    color: theme.palette.warning.dark,
  }),
  ...(priority === 'low' && {
    background: `${theme.palette.success.main}20`,
    color: theme.palette.success.dark,
  }),
}));

const GroupChip = styled(Chip)(({ theme }) => ({
  background: `${theme.palette.secondary.main}20`,
  color: theme.palette.secondary.dark,
  border: `1px solid ${theme.palette.secondary.main}40`,
  fontWeight: 500,
}));

const StyledTableRow = styled(TableRow)(({ theme, status }) => ({
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  ...(status === 'completed' && {
    borderLeft: `4px solid ${theme.palette.success.main}`,
  }),
  ...(status === 'in-progress' && {
    borderLeft: `4px solid ${theme.palette.info.main}`,
  }),
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const statusColors = {
  pending: 'warning',
  'in-progress': 'info',
  completed: 'success',
  rejected: 'error'
};

const statusIcons = {
  pending: FiClock,
  'in-progress': FiAlertCircle,
  completed: FiCheckCircle,
  rejected: FiXCircle
};

const EmmpTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '', description: '', dueDate: null, assignedUsers: [],
    assignedGroups: [], priorityDays: '', priority: 'medium', files: null, voiceNote: null
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0
  });

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Notifications Functions
  const fetchNotifications = async () => {
    if (authError || !userId) return;
    
    try {
      const res = await axios.get('/task/notifications/all');
      setNotifications(res.data.notifications || []);
      setUnreadNotificationCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(`/task/notifications/${notificationId}/read`);
      fetchNotifications();
      setSnackbar({ open: true, message: 'Notification marked as read', severity: 'success' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.patch('/task/notifications/read-all');
      fetchNotifications();
      setSnackbar({ open: true, message: 'All notifications marked as read', severity: 'success' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Enhanced Notifications Panel
  const renderNotificationsPanel = () => (
    <Modal
      open={notificationsOpen}
      onClose={() => setNotificationsOpen(false)}
      closeAfterTransition
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isSmallMobile ? '90%' : 400,
        maxHeight: '80vh',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        overflow: 'hidden',
      }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>Notifications</Typography>
            <Button 
              onClick={markAllNotificationsAsRead} 
              size="small"
              disabled={unreadNotificationCount === 0}
              sx={{ borderRadius: 1 }}
            >
              Mark all as read
            </Button>
          </Stack>
        </Box>
        <Box sx={{ maxHeight: '60vh', overflow: 'auto', p: 1 }}>
          {notifications.length > 0 ? (
            <Stack spacing={1}>
              {notifications.map((notification) => (
                <Card 
                  key={notification._id} 
                  variant="outlined"
                  sx={{ 
                    bgcolor: notification.isRead ? 'background.default' : 'action.hover',
                    borderLeft: notification.isRead ? null : `4px solid ${theme.palette.primary.main}`,
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: theme.shadows[1]
                    }
                  }}
                >
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {notification.title}
                      </Typography>
                      <Typography variant="body2">
                        {notification.message}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </Typography>
                        {!notification.isRead && (
                          <Button 
                            size="small" 
                            onClick={() => markNotificationAsRead(notification._id)}
                            sx={{ borderRadius: 1 }}
                          >
                            Mark read
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FiBell size={32} color={theme.palette.text.secondary} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
                No notifications
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );

  // Notification Bell Component
  const NotificationBell = () => (
    <Tooltip title="Notifications">
      <ActionButton 
        onClick={() => setNotificationsOpen(true)}
        sx={{ 
          position: 'relative',
          '&:hover': { 
            backgroundColor: `${theme.palette.primary.main}10`,
          }
        }}
      >
        <FiBell size={18} />
        {unreadNotificationCount > 0 && (
          <Badge 
            badgeContent={unreadNotificationCount} 
            color="error"
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
            }}
          />
        )}
      </ActionButton>
    </Tooltip>
  );

  // Fixed: Proper user data fetching with error handling
  const fetchUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('No user data found in localStorage');
        setAuthError(true);
        setSnackbar({ 
          open: true, 
          message: 'Please log in to access task management', 
          severity: 'error' 
        });
        return;
      }

      const user = JSON.parse(userStr);
      if (!user || !user.role || !user.id) {
        console.error('Invalid user data structure:', user);
        setAuthError(true);
        setSnackbar({ 
          open: true, 
          message: 'Invalid user data. Please log in again.', 
          severity: 'error' 
        });
        return;
      }

      setUserRole(user.role);
      setUserId(user.id);
      setAuthError(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      setAuthError(true);
      setSnackbar({ 
        open: true, 
        message: 'Error loading user data. Please log in again.', 
        severity: 'error' 
      });
    }
  };

  // Combined data fetching with proper authentication check
  const fetchAssignableData = async () => {
    if (authError || !userId) {
      console.log('Skipping data fetch due to authentication issues');
      return;
    }

    try {
      const [usersRes, groupsRes] = await Promise.all([
        axios.get('/task/assignable-users'),
        axios.get('/groups')
      ]);
      
      setUsers(Array.isArray(usersRes.data.users) ? usersRes.data.users : []);
      setGroups(Array.isArray(groupsRes.data.groups) ? groupsRes.data.groups : []);
    } catch (error) {
      console.error('Error fetching assignable data:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
        setSnackbar({ 
          open: true, 
          message: 'Session expired. Please log in again.', 
          severity: 'error' 
        });
      }
      setUsers([]);
      setGroups([]);
    }
  };

  const fetchAssignedTasks = async () => {
    if (authError || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get('/task/assigned-tasks-status');
      const sortedTasks = (res.data.tasks || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setTasks(sortedTasks);
      calculateStats(sortedTasks);
    } catch (err) {
      console.error('❌ Error fetching assigned tasks:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({ 
          open: true, 
          message: 'Session expired. Please log in again.', 
          severity: 'error' 
        });
      } else {
        setSnackbar({ open: true, message: 'Failed to load tasks', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (authError || !userId) {
      setSnackbar({ 
        open: true, 
        message: 'Please log in to update task status', 
        severity: 'error' 
      });
      return;
    }

    try {
      await axios.patch(`/task/${taskId}/status`, { status: newStatus });
      fetchAssignedTasks();
      fetchNotifications(); // Refresh notifications after status change
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
    } catch (err) {
      console.error("❌ Error in handleStatusChange:", err.response || err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({ 
          open: true, 
          message: 'Session expired. Please log in again.', 
          severity: 'error' 
        });
      } else {
        setSnackbar({ open: true, message: err?.response?.data?.error || 'Unauthorized to update status', severity: 'error' });
      }
    }
  };

  const handleCreateTask = async () => {
    if (authError || !userId) {
      setSnackbar({ 
        open: true, 
        message: 'Please log in to create tasks', 
        severity: 'error' 
      });
      return;
    }

    const formData = new FormData();
    const finalAssignedUsers =
      userRole === 'employee' || userRole === 'staff'
        ? [userId]
        : newTask.assignedUsers;

    formData.append('title', newTask.title);
    formData.append('description', newTask.description);
    formData.append('dueDate', newTask.dueDate.toISOString().split('T')[0]);
    
    formData.append('priorityDays', newTask.priorityDays);
    formData.append('priority', newTask.priority);
    formData.append('assignedUsers', JSON.stringify(finalAssignedUsers));
    formData.append('assignedGroups', JSON.stringify(newTask.assignedGroups));

    if (newTask.files) {
      for (let i = 0; i < newTask.files.length; i++) {
        formData.append('files', newTask.files[i]);
      }
    }

    if (newTask.voiceNote) {
      formData.append('voiceNote', newTask.voiceNote);
    }

    try {
      await axios.post('/task/create', formData);
      fetchAssignedTasks();
      fetchNotifications(); // Refresh notifications after creating task
      setOpenDialog(false);
      setSnackbar({ open: true, message: 'Task created successfully', severity: 'success' });
      setNewTask({
        title: '', description: '', dueDate: null, assignedUsers: [],
        assignedGroups: [], priorityDays: '', priority: 'medium', files: null, voiceNote: null
      });
    } catch (err) {
      console.error('Error creating task:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
        setSnackbar({ 
          open: true, 
          message: 'Session expired. Please log in again.', 
          severity: 'error' 
        });
      } else {
        setSnackbar({ open: true, message: err?.response?.data?.error || 'Task creation failed', severity: 'error' });
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const calculateStats = (tasksData) => {
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let rejected = 0;

    tasksData.forEach(task => {
      task.statusInfo?.forEach(status => {
        total++;
        const statusLower = status.status?.toLowerCase();
        switch (statusLower) {
          case 'pending':
            pending++;
            break;
          case 'in-progress':
            inProgress++;
            break;
          case 'completed':
            completed++;
            break;
          case 'rejected':
            rejected++;
            break;
        }
      });
    });

    setStats({
      total,
      pending,
      inProgress,
      completed,
      rejected
    });
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return <FiCheckCircle color={theme.palette.success.main} />;
      case 'rejected':
        return <FiXCircle color={theme.palette.error.main} />;
      case 'pending':
        return <FiClock color={theme.palette.warning.main} />;
      case 'in-progress':
        return <FiAlertCircle color={theme.palette.info.main} />;
      default:
        return <FiClock color={theme.palette.text.secondary} />;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskProgress = (task) => {
    if (!task.statusInfo?.length) return 0;
    const completed = task.statusInfo.filter(s => 
      s.status?.toLowerCase() === 'completed' || s.status?.toLowerCase() === 'approved'
    ).length;
    return Math.round((completed / task.statusInfo.length) * 100);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (!authError && userId) {
      fetchAssignedTasks();
      fetchAssignableData();
      fetchNotifications(); // Fetch notifications when component loads
    }
  }, [authError, userId]);

  // Show authentication error message
  if (authError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 3
      }}>
        <Card sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <CardContent>
            <FiAlertCircle size={48} color={theme.palette.error.main} style={{ marginBottom: 16 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Authentication Required
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please log in to access the Task Management system.
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleLogout}
              startIcon={<FiUser />}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh'
      }}>
        <LinearProgress sx={{ width: '100px' }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Fade in={!loading} timeout={500}>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Header Section */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: theme.shape.borderRadius * 2,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            boxShadow: theme.shadows[4]
          }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3} 
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Box>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  Task Status Overview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Track progress and status of all assigned tasks
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center">
                {/* Notification Bell */}
                <NotificationBell />

                {userRole !== 'employee' && userRole !== 'staff' && (
                  <Button
                    variant="contained"
                    startIcon={<FiPlus />}
                    onClick={() => setOpenDialog(true)}
                    sx={{
                      borderRadius: theme.shape.borderRadius * 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3
                    }}
                  >
                    Create Task
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={2}>
              <StatCard color="primary">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: `${theme.palette.primary.main}20`, 
                      color: theme.palette.primary.main 
                    }}>
                      <FiList />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Tasks
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {tasks.length}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatCard>
            </Grid>

            <Grid item xs={6} md={2}>
              <StatCard color="warning">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: `${theme.palette.warning.main}20`, 
                      color: theme.palette.warning.main 
                    }}>
                      <FiClock />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.pending}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatCard>
            </Grid>

            <Grid item xs={6} md={2}>
              <StatCard color="info">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: `${theme.palette.info.main}20`, 
                      color: theme.palette.info.main 
                    }}>
                      <FiAlertCircle />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.inProgress}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatCard>
            </Grid>

            <Grid item xs={6} md={2}>
              <StatCard color="success">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: `${theme.palette.success.main}20`, 
                      color: theme.palette.success.main 
                    }}>
                      <FiCheckCircle />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.completed}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatCard>
            </Grid>

            <Grid item xs={6} md={2}>
              <StatCard color="error">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: `${theme.palette.error.main}20`, 
                      color: theme.palette.error.main 
                    }}>
                      <FiXCircle />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Rejected
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.rejected}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatCard>
            </Grid>
          </Grid>

          {/* Tasks List */}
          <Stack spacing={3}>
            {tasks.length === 0 ? (
              <Card sx={{ 
                textAlign: 'center', 
                py: 8,
                borderRadius: theme.shape.borderRadius * 2
              }}>
                <FiList size={48} color={theme.palette.text.secondary} style={{ marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Tasks Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't been assigned any tasks yet
                </Typography>
              </Card>
            ) : (
              tasks.map((task, tIndex) => (
                <TaskCard 
                  key={task._id} 
                  priority={task.priority || 'medium'}
                >
                  <CardContent>
                    {/* Task Header */}
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={2} 
                      justifyContent="space-between" 
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      sx={{ mb: 2 }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {task.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {task.description}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Progress
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {getTaskProgress(task)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={getTaskProgress(task)} 
                          sx={{ 
                            mt: 1,
                            height: 6,
                            borderRadius: 3,
                            width: 100
                          }}
                        />
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Assigned Users & Groups */}
                    <Box>
                      <Stack 
                        direction="row" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          Assigned To
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.assignedUsers?.length || 0} user(s), {task.assignedGroups?.length || 0} group(s)
                        </Typography>
                      </Stack>

                      {/* Groups */}
                      {task.assignedGroups && task.assignedGroups.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            Groups:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {task.assignedGroups.map(groupId => (
                              <GroupChip
                                key={groupId}
                                label={getGroupName(groupId)}
                                size="small"
                                sx={{ mb: 0.5 }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Status Table */}
                      {(!task.statusInfo || task.statusInfo.length === 0) ? (
                        <Typography variant="body2" color="text.secondary" align="center" py={2}>
                          No team members assigned to this task
                        </Typography>
                      ) : (
                        <TableContainer 
                          component={Paper} 
                          variant="outlined" 
                          sx={{ borderRadius: theme.shape.borderRadius }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell sx={{ fontWeight: 700 }}>Team Member</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {task.statusInfo.map((status, sIndex) => {
                                const isCurrentUser = status.userId === userId;
                                const canChangeStatus = isCurrentUser;

                                return (
                                  <StyledTableRow 
                                    key={`${task._id}-${sIndex}`} 
                                    status={status.status?.toLowerCase()}
                                  >
                                    <TableCell>
                                      <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ width: 32, height: 32 }}>
                                          {getInitials(status.name)}
                                        </Avatar>
                                        <Box>
                                          <Typography variant="body2" fontWeight={600}>
                                            {status.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {status.email || 'No email'}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={status.role || 'Not specified'}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <StatusChip
                                        label={status.status?.charAt(0).toUpperCase() + status.status?.slice(1)}
                                        status={status.status?.toLowerCase()}
                                        icon={getStatusIcon(status.status)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {canChangeStatus ? (
                                        <FormControl size="small">
                                          <Select
                                            value={status.status || 'pending'}
                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                            sx={{ minWidth: 120 }}
                                          >
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="in-progress">In Progress</MenuItem>
                                            <MenuItem value="completed">Completed</MenuItem>
                                            <MenuItem value="rejected">Rejected</MenuItem>
                                          </Select>
                                        </FormControl>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          Read only
                                        </Typography>
                                      )}
                                    </TableCell>
                                  </StyledTableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>

                    {/* Task Footer */}
                    <Stack 
                      direction="row" 
                      justifyContent="space-between" 
                      alignItems="center" 
                      sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        {task.files?.length > 0 && (
                          <Tooltip title={`${task.files.length} files`}>
                            <IconButton size="small">
                              <FiFileText size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {task.voiceNote && (
                          <Tooltip title="Voice note available">
                            <IconButton size="small">
                              <FiMic size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                      </Stack>
                      
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(task.createdAt)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </TaskCard>
              ))
            )}
          </Stack>

          {/* Create Task Dialog */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Typography variant="h5" fontWeight={700}>
                Create New Task
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField 
                  fullWidth 
                  label="Task Title" 
                  value={newTask.title} 
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                />
                <TextField 
                  fullWidth 
                  label="Description" 
                  multiline
                  rows={3}
                  value={newTask.description} 
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Due Date"
                      value={newTask.dueDate}
                      onChange={(date) => setNewTask({ ...newTask, dueDate: date })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        label="Priority"
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>


                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Attachments
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<FiFileText />}
                    >
                      Upload Files
                      <input
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => setNewTask({ ...newTask, files: e.target.files })}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<FiMic />}
                    >
                      Voice Note
                      <input
                        type="file"
                        accept="audio/*"
                        hidden
                        onChange={(e) => setNewTask({ ...newTask, voiceNote: e.target.files[0] })}
                      />
                    </Button>
                  </Stack>
                </Box>

                {userRole !== 'employee' && userRole !== 'staff' ? (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>Assign To Users</InputLabel>
                      <Select
                        multiple
                        value={newTask.assignedUsers}
                        onChange={(e) => setNewTask({ ...newTask, assignedUsers: e.target.value })}
                        input={<OutlinedInput label="Assign To Users" />}
                        renderValue={(selected) =>
                          users.filter(u => selected.includes(u._id)).map(u => u.name).join(', ')
                        }
                      >
                        {users.map(user => (
                          <MenuItem key={user._id} value={user._id}>
                            <Checkbox checked={newTask.assignedUsers.includes(user._id)} />
                            <ListItemText primary={`${user.name} (${user.role})`} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Assign To Groups</InputLabel>
                      <Select
                        multiple
                        value={newTask.assignedGroups}
                        onChange={(e) => setNewTask({ ...newTask, assignedGroups: e.target.value })}
                        input={<OutlinedInput label="Assign To Groups" />}
                        renderValue={(selected) =>
                          groups.filter(g => selected.includes(g._id)).map(g => g.name).join(', ')
                        }
                      >
                        {groups.map(group => (
                          <MenuItem key={group._id} value={group._id}>
                            <Checkbox checked={newTask.assignedGroups.includes(group._id)} />
                            <ListItemText 
                              primary={`${group.name} (${group.members.length} members)`} 
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  <Box sx={{ p: 2, bgcolor: `${theme.palette.primary.main}10`, borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>Assigned To:</strong> You (Self)
                    </Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                sx={{ borderRadius: theme.shape.borderRadius * 2 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask} 
                variant="contained"
                disabled={!newTask.title || !newTask.description || !newTask.dueDate}
                sx={{ borderRadius: theme.shape.borderRadius * 2 }}
              >
                Create Task
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notifications Panel */}
          {renderNotificationsPanel()}

          {/* Enhanced Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Card sx={{ 
              minWidth: 300,
              background: snackbar.severity === 'error' 
                ? theme.palette.error.main 
                : theme.palette.success.main,
              color: 'white'
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  {snackbar.severity === 'error' ? 
                    <FiXCircle size={20} /> : 
                    <FiCheckCircle size={20} />
                  }
                  <Typography variant="body2" fontWeight={500}>
                    {snackbar.message}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Snackbar>
        </Box>
      </Fade>
    </LocalizationProvider>
  );
};

export default EmmpTask;