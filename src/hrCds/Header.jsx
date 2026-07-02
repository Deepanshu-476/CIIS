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
  Button,
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
import { openNotificationRoute } from "../../src/utils/notificationNavigation";

const Header = ({ toggleSidebar, isMobile }) => {
  const { user } = useAuth();

  const isClient = user?.companyRole === "client";
  const { 
    onNewNotification = () => () => {}, 
    markAsRead = async () => {},
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

  
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  const getDismissedNotificationKey = () =>
    `dismissedNotifications:${user?._id || user?.id || "anonymous"}`;

  const readDismissedNotificationIds = () => {
    try {
      const stored = localStorage.getItem(getDismissedNotificationKey());
      return new Set(JSON.parse(stored || "[]").map(String));
    } catch (error) {
      console.error("Error reading dismissed notifications:", error);
      return new Set();
    }
  };

  const rememberDismissedNotificationIds = (ids) => {
    const normalizedIds = ids.filter(Boolean).map(String);
    if (!normalizedIds.length) return;

    const dismissedIds = readDismissedNotificationIds();
    normalizedIds.forEach(id => dismissedIds.add(id));
    const nextIds = Array.from(dismissedIds).slice(-300);
    localStorage.setItem(getDismissedNotificationKey(), JSON.stringify(nextIds));
  };

  const formatSystemNotification = (notification = {}) => ({
    ...notification,
    id: notification._id || notification.id,
    msg: notification.message || notification.title || "New notification",
    time: notification.createdAt || notification.updatedAt || new Date(),
    type: notification.type || "system",
    category: notification.priority === "high" ? "system-high" : "system",
    read: notification.isRead === true,
    targetPath: notification.targetPath || notification.data?.targetPath,
    targetScreen: notification.targetScreen || notification.data?.targetScreen,
  });

  
  const combineDateTime = (dueDate, dueTime) => {
    if (!dueDate) return null;
    
    try {
      
      let dateObj;
      if (dueDate instanceof Date) {
        dateObj = dueDate;
      } else {
        dateObj = new Date(dueDate);
      }
      
      
      if (isNaN(dateObj.getTime())) return null;
      
      
      if (dueTime) {
        const [hours, minutes] = dueTime.split(':');
        if (hours && minutes) {
          dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        }
      } else {
        
        dateObj.setHours(23, 59, 59, 999);
      }
      
      return dateObj;
    } catch (error) {
      console.error('Error combining date/time:', error);
      return null;
    }
  };

  
  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/notifications/unread-count`, { headers, _skipErrorNotify: true });
      
      const count = response.data?.data?.unreadCount || 0;
      setLocalUnreadCount(count);
      localStorage.setItem('unreadCount', count);
      void 0;
      
    } catch (err) {
      console.error("Error fetching unread count:", err);
      
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

  
  useEffect(() => {
    void 0;
    
    
    const unsubscribe = onNewNotification((notification) => {
      void 0;
      
      
      setNotifications(prev => {
        
        const exists = prev.some(n => n._id === notification._id || n.id === notification.id);
        
        if (!exists) {
          if (notification.type === "meeting") {
            void 0;
          }

          const route = notification.targetPath || notification.data?.targetPath;
          if (route && Notification.permission === "granted") {
            try {
              const browserNotification = new Notification(notification.title || "New notification", {
                body: notification.message || "",
                data: { route },
                icon: "/logoo.png"
              });
              browserNotification.onclick = () => {
                window.focus();
                navigate(route);
              };
            } catch (error) {
              console.error("Browser notification failed:", error);
            }
          }

          setLocalUnreadCount(prevCount => {
            const newCount = prevCount + 1;
            localStorage.setItem('unreadCount', newCount);
            return newCount;
          });

          const formattedNotification = formatSystemNotification({
            ...notification,
            isRead: false,
          });
          
          return [formattedNotification, ...prev];
        }
        
        return prev;
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [onNewNotification]);

  
  useEffect(() => {
    if (!hasFetched) {
      fetchNotifications();
      fetchUnreadCount(); 
    }
    
    
    const interval = setInterval(() => {
      fetchNotifications(true); 
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  
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
        systemNotificationsRes,
      ] = await Promise.allSettled([
        axios.get(`${API_URL}/attendance/list`, { headers, _skipErrorNotify: true }),
        axios.get(`${API_URL}/leaves/status`, { headers, _skipErrorNotify: true }),
        axios.get(`${API_URL}/asset-requests/my-requests`, { headers, _skipErrorNotify: true }),
        axios.get(`${API_URL}/task/my`, { headers, _skipErrorNotify: true }),
        axios.get(`${API_URL}/task/assigned`, { headers, _skipErrorNotify: true }),
        axios.get(`${API_URL}/groups`, { headers, _skipErrorNotify: true }),
        axios.get(`${API_URL}/alerts`, { headers, _skipErrorNotify: true }),
        axios.get(`${API_URL}/notifications`, {
          headers,
          params: { unreadOnly: true, limit: 100 },
          _skipErrorNotify: true
        }),
      ]);
      

      const all = [];
      const today = new Date().toDateString();

      const backendNotifications =
        systemNotificationsRes.status === "fulfilled"
          ? systemNotificationsRes.value?.data?.data?.notifications || []
          : [];
      const backendUnreadCount =
        systemNotificationsRes.status === "fulfilled"
          ? systemNotificationsRes.value?.data?.data?.pagination?.unreadCount
          : undefined;

      backendNotifications.forEach((item) => {
        all.push(formatSystemNotification(item));
      });

      const formatTime = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      
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

      
      const groupedTasks = myTasksRes.value?.data?.groupedTasks || {};
      
      Object.keys(groupedTasks).forEach((dateKey) => {
        groupedTasks[dateKey].forEach((t) => {
          const status =
            t.statusInfo?.find(
              (s) => s.userId === user?._id || s.user === user?._id
            )?.status || "N/A";

          if (status.toLowerCase() === "completed") return;

          all.push({
            id: `task-${t._id || Date.now()}`,
            msg: `🧾 Task Update: ${t.title} (${status})`,
            time: t.createdAt,
            type: 'info',
            read: false,
            category: 'task',
            dueDateTime: combineDateTime(t.dueDate, t.dueTime),
            taskData: t
          });
        });
      });

      
      const assignedTaskData = assignedTasksRes.value?.data?.data || [];
      assignedTaskData.forEach((t) => {
        if (t.status?.toLowerCase() === "completed") return;
        
        all.push({
          id: `assigned-${t._id || Date.now()}`,
          msg: `📋 New Task Assigned: ${t.title} (${t.status})`,
          time: t.createdAt,
          type: 'info',
          read: false,
          category: 'task'
        });
      });

      
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

      
      const sorted = all.sort((a, b) => {
        
        if (a.category === 'overdue' && b.category !== 'overdue') return -1;
        if (a.category !== 'overdue' && b.category === 'overdue') return 1;
        
        return new Date(b.time) - new Date(a.time);
      });
      
      
      
      const dismissedIds = readDismissedNotificationIds();
      const filteredNotifications = sorted.filter((n) => {
        const notificationId = String(n.id || n._id || "");
        if (n._id) return n.isRead === false;
        if (notificationId && dismissedIds.has(notificationId)) return false;
        return n.category === 'overdue' || new Date(n.time).toDateString() === today;
      });

      setNotifications(filteredNotifications);
      if (typeof backendUnreadCount === 'number') {
        setLocalUnreadCount(backendUnreadCount);
        localStorage.setItem('unreadCount', backendUnreadCount);
      }
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

  
  const handleNotificationClick = async (e) => {
    setAnchorEl(e.currentTarget);
    
    
    await fetchNotifications(true);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  
  const handleMarkAsRead = async (notification, index) => {
    try {
      const shouldDecreaseCount =
        (notification._id && notification.isRead === false) ||
        (notification.category === 'overdue' && notification.read === false);
      const notificationId = notification.id || notification._id;

      rememberDismissedNotificationIds([notificationId]);

      
      setNotifications(prev => prev.filter((_, i) => i !== index));
      
      if (shouldDecreaseCount) {
        
        setLocalUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1);
          localStorage.setItem('unreadCount', newCount);
          return newCount;
        });
      }
      
      
      if (notification._id) {
        await markAsRead(notification._id);
        const token = localStorage.getItem("token");
        if (token) {
          await axios.patch(`${API_URL}/notifications/${notification._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        }
      }
      
      showToast('Notification marked as read', 'success', 2000);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleOpenNotification = async (notification, index) => {
    await handleMarkAsRead(notification, index);
    setAnchorEl(null);
    openNotificationRoute(navigate, notification);
  };

  
  const handleMarkAllAsRead = async () => {
    try {
      rememberDismissedNotificationIds(notifications.map(n => n.id || n._id));

      
      const promises = notifications.map((n) => {
        if (n._id) {
          return markAsRead(n._id);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      const token = localStorage.getItem("token");
      if (token) {
        await axios.patch(`${API_URL}/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
      
      
      setNotifications([]);
      setLocalUnreadCount(0);
      localStorage.setItem('unreadCount', 0);
      
      showToast('All notifications marked as read', 'success', 3000);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  
  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  
  const handleLogoClick = () => {
    navigate("/ciisUser/user-dashboard");
  };

  
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
          
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
            
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

          
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
            
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
                  badgeContent={localUnreadCount}
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
                      onClick={() => handleOpenNotification(n, i)}
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
                        
                        <Box sx={{ mt: 0.5 }}>
                          {n.category === 'overdue' ? (
                            <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                          ) : (
                            getNotificationIcon(n.type)
                          )}
                        </Box>
                        
                        
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

                        
                        <Tooltip title="Mark this notification as read">
                          <IconButton
                            size="small"
                            aria-label="Mark this notification as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(n, i);
                            }}
                            sx={{
                              p: 0.5,
                              opacity: 0.75,
                              backgroundColor: 'rgba(0,0,0,0.03)',
                              '&:hover': {
                                opacity: 1,
                                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                color: '#d32f2f'
                              }
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

              
              {notifications.length > 0 && (
                <Box sx={{
                  p: 1.5,
                  borderTop: 1,
                  borderColor: 'divider',
                  background: 'rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5
                }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontWeight: 500, textAlign: 'left' }}
                  >
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    {notifications.filter(n => n.category === 'overdue').length > 0 && 
                      ` (${notifications.filter(n => n.category === 'overdue').length} overdue)`
                    }
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CheckCircleIcon fontSize="small" />}
                    onClick={handleMarkAllAsRead}
                    sx={{
                      flexShrink: 0,
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.22)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      }
                    }}
                  >
                    Mark all read
                  </Button>
                </Box>
              )}
            </Menu>

            
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
