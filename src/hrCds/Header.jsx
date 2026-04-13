import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  useTheme,
  CircularProgress,
  Snackbar,
  Alert,
  Button
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/useAuth";
import { useSocket } from "../../src/context/SocketContext";
import { useNotification } from "../../src/context/NotificationContext";
import logo from "/logoo.png";
import axios from "axios";
import API_URL from "../../src/config";
import Swal from "sweetalert2";

const Header = ({ toggleSidebar, isMobile }) => {
  const { user } = useAuth();

  const isClient = user?.companyRole === "client";
  const { 
    onNewNotification = () => () => {}, 
    unreadCount = 0, 
    markAsRead = async () => {},
    isConnected = false 
  } = useSocket();
  const { showToast = () => {} } = useNotification();
  
  const theme = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "info"
  });
  const [overdueTasks, setOverdueTasks] = useState(new Set()); // Track notified overdue tasks

  // Local unread count state - single source of truth
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  // Helper function to combine dueDate and dueTime
  const combineDateTime = (dueDate, dueTime) => {
    if (!dueDate) return null;
    
    try {
      // Parse the date
      let dateObj;
      if (dueDate instanceof Date) {
        dateObj = dueDate;
      } else {
        dateObj = new Date(dueDate);
      }
      
      // If date is invalid, return null
      if (isNaN(dateObj.getTime())) return null;
      
      // If time is provided, combine it
      if (dueTime) {
        const [hours, minutes] = dueTime.split(':');
        if (hours && minutes) {
          dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        }
      } else {
        // Default to end of day if no time specified
        dateObj.setHours(23, 59, 59, 999);
      }
      
      return dateObj;
    } catch (error) {
      console.error('Error combining date/time:', error);
      return null;
    }
  };

  // Function to trigger vibration (if supported)
  const triggerVibration = (pattern = 200) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  // Function to check for overdue tasks
  const checkOverdueTasks = (tasks) => {
    const now = new Date();
    const newlyOverdue = [];
    
    tasks.forEach(task => {
      // Skip if task is already completed
      if (task.status === 'completed' || task.status === 'Completed') {
        return;
      }
      
      // Combine dueDate and dueTime
      const dueDateTime = combineDateTime(task.dueDate, task.dueTime);
      
      // Skip if no due date
      if (!dueDateTime) return;
      
      // Check if task is overdue
      const isOverdue = dueDateTime < now;
      
      // Check if we've already notified for this task
      const taskId = task._id || task.id;
      const alreadyNotified = overdueTasks.has(taskId);
      
      if (isOverdue && !alreadyNotified) {
        newlyOverdue.push({
          ...task,
          dueDateTime,
          overdueMinutes: Math.floor((now - dueDateTime) / (1000 * 60))
        });
      }
    });
    
    // Process newly overdue tasks
    if (newlyOverdue.length > 0) {
      // Trigger vibration
      triggerVibration([200, 100, 200]);
      
      // Show notifications for each overdue task
      newlyOverdue.forEach(task => {
        const overdueMinutes = task.overdueMinutes;
        const overdueHours = Math.floor(overdueMinutes / 60);
        const overdueText = overdueHours > 0 
          ? `${overdueHours} hour${overdueHours > 1 ? 's' : ''} and ${overdueMinutes % 60} minute${(overdueMinutes % 60) !== 1 ? 's' : ''}`
          : `${overdueMinutes} minute${overdueMinutes !== 1 ? 's' : ''}`;
        
        // Show toast notification
        showToast(
          `⚠️ Task Overdue: "${task.title}" is overdue by ${overdueText}!`,
          'warning',
          8000
        );
        
        // Add to notifications list
        setNotifications(prev => {
          const formattedNotification = {
            id: `overdue-${task._id || Date.now()}-${Date.now()}`,
            msg: `⚠️ OVERDUE TASK: "${task.title}" - Due ${dueDateTime.toLocaleString()} (Overdue by ${overdueText})`,
            time: new Date(),
            type: 'error',
            read: false,
            category: 'overdue',
            data: task
          };
          
          // Check if already exists to prevent duplicates
          const exists = prev.some(n => n.id === formattedNotification.id);
          if (!exists) {
            return [formattedNotification, ...prev];
          }
          return prev;
        });
        
        // Update unread count
        setLocalUnreadCount(prev => {
          const newCount = prev + 1;
          localStorage.setItem('unreadCount', newCount);
          return newCount;
        });
        
        // Mark task as notified
        setOverdueTasks(prev => new Set([...prev, task._id || task.id]));
      });
      
      // Show consolidated notification for multiple overdue tasks
      if (newlyOverdue.length > 1) {
        showToast(
          `⚠️ ${newlyOverdue.length} tasks are overdue! Please check your tasks.`,
          'error',
          8000
        );
      }
    }
    
    return newlyOverdue;
  };

  // ========== FETCH INITIAL UNREAD COUNT FROM BACKEND ==========
  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/notifications/unread-count`, { headers });
      
      const count = response.data?.data?.unreadCount || 0;
      setLocalUnreadCount(count);
      localStorage.setItem('unreadCount', count);
      console.log('📊 Initial unread count:', count);
      
    } catch (err) {
      console.error("Error fetching unread count:", err);
      // Fallback: count from notifications if API fails
      const storedUnread = localStorage.getItem('unreadCount');
      if (storedUnread) {
        setLocalUnreadCount(parseInt(storedUnread, 10));
      }
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('unreadCount');
    if (stored) {
      setLocalUnreadCount(parseInt(stored, 10));
    }
  }, []);

  // ========== SOCKET NOTIFICATION LISTENER ==========
  useEffect(() => {
    console.log('🔔 Header: Setting up notification listener');
    
    // Listen for new notifications via socket
    const unsubscribe = onNewNotification((notification) => {
      console.log('📢 Header: New notification received:', notification);
      
      // Add to notifications list and update count
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n._id === notification._id || n.id === notification.id);
        
        if (!exists) {
          showToast(notification.message || 'New notification', 'info', 5000);

          setLocalUnreadCount(prevCount => {
            const newCount = prevCount + 1;
            localStorage.setItem('unreadCount', newCount);
            return newCount;
          });

          const formattedNotification = {
            ...notification,
            id: notification._id || notification.id,
            read: false,
          };
          
          return [formattedNotification, ...prev];
        }
        
        return prev;
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [onNewNotification, showToast]);

  // ========== FETCH INITIAL NOTIFICATIONS AND UNREAD COUNT ==========
  useEffect(() => {
    if (!hasFetched) {
      fetchNotifications();
      fetchUnreadCount(); 
    }
    
    // Set up interval to refresh notifications every 2 minutes
    const interval = setInterval(() => {
      fetchNotifications(true); // silent refresh
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  // ========== FETCH NOTIFICATIONS FROM API ==========
  const fetchNotifications = async (silent = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!silent) setLoading(true);
    
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [
        attendanceRes,
        leavesRes,
        assetsRes,
        myTasksRes,
        assignedTasksRes,
        groupsRes,
        alertsRes,
      ] = await Promise.allSettled([
        axios.get(`${API_URL}/attendance/list`, { headers }),
        axios.get(`${API_URL}/leaves/status`, { headers }),
        axios.get(`${API_URL}/asset-requests/my-requests`, { headers }),
        axios.get(`${API_URL}/task/my`, { headers }),
        axios.get(`${API_URL}/task/assigned`, { headers }),
        axios.get(`${API_URL}/groups`, { headers }),
        axios.get(`${API_URL}/alerts`, { headers }),
      ]);
      

      const all = [];
      const today = new Date().toDateString();
      const now = new Date();

      const formatTime = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      // Attendance Notifications
      const attendanceData = attendanceRes.value?.data?.data || [];
      attendanceData.forEach((item) => {
        if (item.inTime) all.push({ 
          id: `attendance-in-${item._id || Date.now()}`,
          msg: `🕒 Clocked In at ${formatTime(item.inTime)}`, 
          time: item.inTime,
          type: 'info',
          read: false,
          category: 'attendance'
        });
        if (item.outTime) all.push({ 
          id: `attendance-out-${item._id || Date.now()}`,
          msg: `🏠 Clocked Out at ${formatTime(item.outTime)}`, 
          time: item.outTime,
          type: 'info',
          read: false,
          category: 'attendance'
        });
      });

      // Leaves
      const leavesData = leavesRes.value?.data?.leaves || [];
      leavesData.forEach((l) => {
        const emoji =
          l.status?.toLowerCase() === "approved"
            ? "✅"
            : l.status?.toLowerCase() === "pending"
            ? "⏳"
            : "❌";
        const type = l.status?.toLowerCase() === "approved" ? 'success' : 
                    l.status?.toLowerCase() === "pending" ? 'warning' : 'error';
        all.push({
          id: `leave-${l._id || Date.now()}`,
          msg: `${emoji} Leave ${l.status}: ${l.type}`,
          time: l.updatedAt || l.startDate,
          type: type,
          read: false,
          category: 'leave',
          data: l
        });
      });

      // Assets
      const assetsData = assetsRes.value?.data?.requests || [];
      assetsData.forEach((a) => {
        const type = a.status?.toLowerCase() === 'approved' ? 'success' :
                    a.status?.toLowerCase() === 'pending' ? 'warning' : 'info';
        all.push({
          id: `asset-${a._id || Date.now()}`,
          msg: `💻 Asset Request: ${a.assetName} — ${a.status.toUpperCase()}`,
          time: a.updatedAt,
          type: type,
          read: false,
          category: 'asset'
        });
      });

      // My Tasks with overdue checking
      const groupedTasks = myTasksRes.value?.data?.groupedTasks || {};
      const allTasks = [];
      
      Object.keys(groupedTasks).forEach((dateKey) => {
        groupedTasks[dateKey].forEach((t) => {
          const status =
            t.statusInfo?.find(
              (s) => s.userId === user?._id || s.user === user?._id
            )?.status || "N/A";

          // Store task for overdue checking
          if (status.toLowerCase() !== "completed") {
            allTasks.push(t);
          }

          if (status.toLowerCase() === "completed") return;

          // Combine dueDate and dueTime for display
          const dueDateTime = combineDateTime(t.dueDate, t.dueTime);
          const dueDateTimeStr = dueDateTime ? dueDateTime.toLocaleString() : 'No due date';
          
          // Check if overdue for highlighting
          const isOverdue = dueDateTime && dueDateTime < now && status.toLowerCase() !== "completed";
          
          all.push({
            id: `task-${t._id || Date.now()}`,
            msg: isOverdue 
              ? `⚠️ OVERDUE: ${t.title} (${status}) - Due: ${dueDateTimeStr}`
              : `🧾 Task Update: ${t.title} (${status})`,
            time: t.createdAt,
            type: isOverdue ? 'error' : 'info',
            read: false,
            category: 'task',
            isOverdue: isOverdue,
            dueDateTime: dueDateTime,
            taskData: t
          });
        });
      });

      // Check for overdue tasks and trigger notifications
      const overdueTasksList = checkOverdueTasks(allTasks);
      
      // If we found overdue tasks, add them to notifications with priority
      if (overdueTasksList.length > 0) {
        overdueTasksList.forEach(task => {
          const dueDateTime = combineDateTime(task.dueDate, task.dueTime);
          const overdueMinutes = Math.floor((now - dueDateTime) / (1000 * 60));
          const overdueHours = Math.floor(overdueMinutes / 60);
          const overdueText = overdueHours > 0 
            ? `${overdueHours}h ${overdueMinutes % 60}m`
            : `${overdueMinutes}m`;
          
          all.unshift({
            id: `overdue-priority-${task._id || Date.now()}`,
            msg: `🔴 CRITICAL: Task "${task.title}" is overdue by ${overdueText}! Please complete immediately.`,
            time: new Date(),
            type: 'error',
            read: false,
            category: 'overdue',
            priority: 'high',
            taskData: task
          });
        });
      }

      // Assigned Tasks (Skip completed)
      const assignedTaskData = assignedTasksRes.value?.data?.data || [];
      assignedTaskData.forEach((t) => {
        if (t.status?.toLowerCase() === "completed") return;
        
        // Combine dueDate and dueTime for assigned tasks
        const dueDateTime = combineDateTime(t.dueDate, t.dueTime);
        const isOverdue = dueDateTime && dueDateTime < now;
        
        all.push({
          id: `assigned-${t._id || Date.now()}`,
          msg: isOverdue
            ? `⚠️ OVERDUE Assigned Task: ${t.title} (${t.status})`
            : `📋 New Task Assigned: ${t.title} (${t.status})`,
          time: t.createdAt,
          type: isOverdue ? 'error' : 'info',
          read: false,
          category: 'task'
        });
      });

      // Groups
      const groupData = groupsRes.value?.data?.data || [];
      groupData.forEach((g) => {
        all.push({ 
          id: `group-${g._id || Date.now()}`,
          msg: `👥 New Group Created: ${g.groupName}`, 
          time: g.createdAt,
          type: 'info',
          read: false,
          category: 'group'
        });
      });

      // Alerts
      const alertData = alertsRes.value?.data?.data || [];
      alertData.forEach((a) => {
        all.push({ 
          id: `alert-${a._id || Date.now()}`,
          msg: `🚨 ${a.message}`, 
          time: a.createdAt,
          type: 'warning',
          read: false,
          category: 'alert'
        });
      });

      // ✅ Sorting Latest First + Prioritize Overdue Tasks
      const sorted = all.sort((a, b) => {
        // Prioritize overdue tasks
        if (a.category === 'overdue' && b.category !== 'overdue') return -1;
        if (a.category !== 'overdue' && b.category === 'overdue') return 1;
        // Then sort by time
        return new Date(b.time) - new Date(a.time);
      });
      
      // Filter for today's notifications but keep overdue tasks regardless of date
      const filteredNotifications = sorted.filter(
        (n) => n.category === 'overdue' || new Date(n.time).toDateString() === today
      );

      setNotifications(filteredNotifications);
      setHasFetched(true);
      
      if (!silent && filteredNotifications.length > 0) {
        const overdueCount = filteredNotifications.filter(n => n.category === 'overdue').length;
        if (overdueCount > 0) {
          showToast(`⚠️ ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} found!`, 'error', 5000);
        } else {
          showToast(`${filteredNotifications.length} new notification(s)`, 'info', 3000);
        }
      }
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
      if (!silent) {
        showToast("Failed to fetch notifications", 'error', 3000);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ========== PERIODIC OVERDUE CHECK ==========
  useEffect(() => {
    // Check for overdue tasks every minute
    const overdueCheckInterval = setInterval(() => {
      fetchNotifications(true); // Silent refresh to check for overdue tasks
    }, 60000); // Check every minute
    
    return () => clearInterval(overdueCheckInterval);
  }, []);

  // ========== HANDLE NOTIFICATION CLICK ==========
  const handleNotificationClick = async (e) => {
    setAnchorEl(e.currentTarget);
    
    // Refresh notifications when opened
    await fetchNotifications(true);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  // ========== MARK SINGLE NOTIFICATION AS READ ==========
  const handleMarkAsRead = async (notification, index) => {
    try {
      // Remove from notifications list
      setNotifications(prev => prev.filter((_, i) => i !== index));
      
      // Decrease local unread count (don't go below 0)
      setLocalUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        localStorage.setItem('unreadCount', newCount);
        return newCount;
      });
      
      // If it has an ID, mark as read via socket
      if (notification._id) {
        await markAsRead(notification._id);
      }
      
      showToast('Notification marked as read', 'success', 2000);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // ========== MARK ALL AS READ ==========
  const handleMarkAllAsRead = async () => {
    try {
      // Mark all current notifications as read
      const promises = notifications.map((n, index) => {
        if (n._id) {
          return markAsRead(n._id);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      
      // Clear notifications and reset unread count to 0
      setNotifications([]);
      setLocalUnreadCount(0);
      localStorage.setItem('unreadCount', 0);
      
      showToast('All notifications marked as read', 'success', 3000);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // ========== CLEAR TOAST ==========
  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  // ========== SHOW TOAST ==========
  const showCustomToast = (message, type = 'info', duration = 3000) => {
    setToast({ open: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }));
    }, duration);
  };

  // ========== LOGO CLICK HANDLER ==========
  const handleLogoClick = () => {
    navigate("/ciisUser/user-dashboard");
  };

  // ========== LOGOUT HANDLER ==========
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem('unreadCount');
      navigate("/login");

      Swal.fire({
        title: "Logged out!",
        text: "You have successfully logged out.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // ========== GET NOTIFICATION ICON ==========
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'error': return <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'warning': return <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
      default: return <InfoIcon sx={{ color: '#2196f3', fontSize: 20 }} />;
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          height: isMobile ? 56 : 64,
          justifyContent: "center",
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: isMobile ? 1.5 : 3,
            minHeight: "100% !important",
            width: "100%",
          }}
        >
          {/* LEFT */}
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
            {/* Show menu button only on mobile */}
            {isMobile && (
              <IconButton 
                onClick={toggleSidebar} 
                edge="start" 
                size={isMobile ? "small" : "medium"}
              >
                <MenuIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            )}

            <Typography
              variant="h6"
              noWrap
              component="img"
              src={logo}
              alt="Logo"
              onClick={!isClient ? handleLogoClick : undefined}
              sx={{
                height: isMobile ? 35 : 50,
                width: "auto",
                objectFit: "contain",
                cursor: !isClient ? "pointer" : "default",
                "&:hover": { 
                  transform: "scale(1.05)",
                  opacity: 0.9,
                  transition: "all 0.2s ease"
                },
              }}
            />
          </Box>

          {/* CENTER */}
          <Box sx={{ flex: 1, textAlign: "center" }}>
            {!isMobile ? (
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 500, 
                  color: theme.palette.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}
              >
                Welcome, {user?.name || "User"}
        
              </Typography>
            ) : (
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500, 
                  color: theme.palette.text.secondary 
                }}
              >
                {user?.name || "User"}
              </Typography>
            )}
          </Box>

          {/* RIGHT */}
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                onClick={handleNotificationClick}
                sx={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                  width: isMobile ? 36 : 44,
                  height: isMobile ? 36 : 44,
                }}
              >
                <Badge 
                  badgeContent={localUnreadCount || notifications.length}
                  color="error" 
                  overlap="circular"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: isMobile ? '0.6rem' : '0.7rem',
                      fontWeight: 'bold',
                      minWidth: isMobile ? 18 : 20,
                      height: isMobile ? 18 : 20,
                      borderRadius: '50%',
                      marginTop: '-10px',
                      boxShadow: '0 2px 8px rgba(244, 67, 54, 0.4)',
                    }
                  }}
                >
                  <NotificationsIcon 
                    sx={{ 
                      fontSize: isMobile ? 20 : 24,
                      animation: localUnreadCount > 0 ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      }
                    }} 
                  />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleNotificationClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  width: 380,
                  maxHeight: 500,
                  overflow: 'hidden',
                  borderRadius: 3,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#c1c1c1",
                    borderRadius: "4px",
                    '&:hover': {
                      backgroundColor: "#a8a8a8",
                    }
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* Header with Gradient Background */}
              <Box sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Notifications
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    {localUnreadCount > 0 ? `${localUnreadCount} unread` : 'All caught up!'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {notifications.length > 0 && (
                    <Tooltip title="Mark all as read">
                      <IconButton 
                        size="small" 
                        onClick={handleMarkAllAsRead}
                        sx={{
                          color: 'white',
                          background: 'rgba(255,255,255,0.2)',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.3)',
                          },
                          transition: 'all 0.3s ease',
                          width: 32,
                          height: 32,
                        }}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Refresh notifications">
                    <IconButton 
                      size="small" 
                      onClick={() => fetchNotifications(false)}
                      disabled={loading}
                      sx={{
                        color: 'white',
                        background: 'rgba(255,255,255,0.2)',
                        '&:hover': {
                          background: 'rgba(255,255,255,0.3)',
                          transform: 'rotate(45deg)',
                        },
                        transition: 'all 0.3s ease',
                        width: 32,
                        height: 32,
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={16} sx={{ color: 'white' }} />
                      ) : (
                        <Box
                          component="span"
                          sx={{
                            fontSize: '1rem',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: 'rotate(180deg)',
                            }
                          }}
                        >
                          🔄
                        </Box>
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Notifications List */}
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {loading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    py: 4 
                  }}>
                    <CircularProgress size={28} sx={{ color: '#667eea' }} />
                  </Box>
                ) : notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <MenuItem
                      key={n.id || i}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        whiteSpace: "normal",
                        gap: 1,
                        p: 2,
                        borderBottom: i < notifications.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        backgroundColor: n.category === 'overdue' ? 'rgba(244, 67, 54, 0.05)' : "transparent",
                        position: 'relative',
                        "&:hover": {
                          backgroundColor: n.category === 'overdue' 
                            ? 'rgba(244, 67, 54, 0.1)' 
                            : "rgba(102, 126, 234, 0.05)",
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.2s ease',
                        minHeight: '72px',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3px',
                          background: n.category === 'overdue' 
                            ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          opacity: 1,
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        width: '100%',
                        gap: 1.5 
                      }}>
                        {/* Notification Icon */}
                        <Box sx={{ mt: 0.5 }}>
                          {n.category === 'overdue' ? (
                            <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                          ) : (
                            getNotificationIcon(n.type)
                          )}
                        </Box>
                        
                        {/* Notification Content */}
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: n.category === 'overdue' ? 700 : 500, 
                              lineHeight: 1.4,
                              color: n.category === 'overdue' ? '#d32f2f' : 'text.primary',
                              fontSize: '0.875rem',
                              mb: 0.5
                            }}
                          >
                            {n.msg}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: "text.secondary",
                                fontSize: '0.7rem',
                                fontWeight: 500,
                              }}
                            >
                              {new Date(n.time).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: "text.secondary",
                                fontSize: '0.7rem',
                              }}
                            >
                              {new Date(n.time).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Mark as Read Button */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n, i);
                          }}
                          sx={{
                            p: 0.5,
                            opacity: 0.6,
                            '&:hover': {
                              opacity: 1,
                              backgroundColor: 'rgba(0,0,0,0.04)'
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <Box 
                    sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      px: 2 
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: '3rem',
                        mb: 1,
                        opacity: 0.5,
                      }}
                    >
                      🔔
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        mb: 1 
                      }}
                    >
                      {hasFetched ? "No notifications for today" : "No notifications yet"}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ opacity: 0.7 }}
                    >
                      {hasFetched ? "You're all caught up!" : "Notifications will appear here"}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Footer */}
              {notifications.length > 0 && (
                <Box sx={{ 
                  p: 1.5, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.02)'
                }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    {notifications.filter(n => n.category === 'overdue').length > 0 && 
                      ` (${notifications.filter(n => n.category === 'overdue').length} overdue)`
                    }
                  </Typography>
                </Box>
              )}
            </Menu>

            {/* Logout */}
            <Tooltip title="Logout">
              <IconButton 
                onClick={handleLogout} 
                sx={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ff5252 0%, #e53935 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                  width: isMobile ? 36 : 44,
                  height: isMobile ? 36 : 44,
                }}
                size={isMobile ? "small" : "medium"}
              >
                <LogoutIcon 
                  fontSize={isMobile ? "small" : "medium"} 
                  sx={{
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(2px)',
                    }
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.type}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: 24
            }
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Header;