import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  styled,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Divider,
  Typography,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  EventNote as EventNoteIcon,
  Computer as ComputerIcon,
  Task as TaskIcon,
  Groups as GroupsIcon,
  Notifications as NotificationsIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ListAlt as ListAltIcon,
  MeetingRoom as MeetingRoomIcon,
  Apartment as ApartmentIcon,
  PersonAdd as PersonAddIcon,
  CreditCard as CreditCardIcon,
  Folder as FolderIcon,
  LogoutOutlined
} from '@mui/icons-material';
import Swal from "sweetalert2";

const drawerWidthOpen = 260;
const drawerWidthClosed = 70;

const SidebarContainer = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  height: 'calc(100vh - 64px)',
  position: 'fixed',
  top: 64,
  left: 0,
  zIndex: theme.zIndex.drawer,
  overflowY: 'auto',
  transition: 'width 0.3s ease, transform 0.3s ease',
  '&::-webkit-scrollbar': { 
    width: 6,
    display: 'none'
  },
  '&:hover::-webkit-scrollbar': {
    display: 'block'
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.action.hover,
    borderRadius: 3,
  },
}));

const MobileSidebarContainer = styled(Box)(({ theme }) => ({
  width: drawerWidthOpen,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  height: 'calc(100vh - 64px)',
  overflowY: 'auto',
  '&::-webkit-scrollbar': { 
    width: 6,
    display: 'none'
  },
  '&:hover::-webkit-scrollbar': {
    display: 'block'
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.action.hover,
    borderRadius: 3,
  },
}));

const StyledListItem = styled(ListItem)({
  padding: 0,
});

const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  minHeight: 48,
  justifyContent: 'initial',
  padding: theme.spacing(1, 2),
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  borderRight: selected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
  margin: theme.spacing(0.2, 1),
  borderRadius: 8,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(2px)',
    transition: 'all 0.2s ease',
  },
  '& .MuiListItemIcon-root': {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  },
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 0,
  marginRight: theme.spacing(2),
  color: 'inherit',
  fontSize: '1.1rem',
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.5, 2, 1),
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  fontWeight: 600,
  letterSpacing: '0.5px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  margin: theme.spacing(0, 1),
}));

const CollapsedHeading = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  margin: theme.spacing(0, 1),
  display: 'flex',
  justifyContent: 'center',
}));

const Sidebar = ({ isMobile = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [userData, setUserData] = useState(null);
  const sidebarRef = useRef(null);
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);

  const isSidebarOpen = isMobile ? true : isHovered;

  // LocalStorage से user data fetch करें
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        setUserData(JSON.parse(user));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    
    leaveTimer.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (!isMobile) {
      setIsHovered(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You'll be logged out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      background: "#f9f9f9",
      color: "#333",
      customClass: {
        popup: "rounded-xl shadow-lg",
        title: "text-lg font-semibold",
        confirmButton: "px-4 py-2 rounded-md",
        cancelButton: "px-4 py-2 rounded-md",
      },
    });

    if (result.isConfirmed) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      Swal.fire({
        title: "Logged Out!",
        text: "You have successfully logged out.",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
      });

      setTimeout(() => navigate("/"), 1800);
    }
  };

  // Check if user is a client
  const isClientUser = useMemo(() => {
    return userData?.companyRole === "client";
  }, [userData]);

  // CLIENT MENU ITEMS - Sirf 3 pages client ke liye
  const clientMenuItems = useMemo(() => [
    {
      id: 'client-dashboard',
      icon: <DashboardIcon />,
      name: 'Dashboard',
      path: '/client/dashboard',
      category: 'main'
    },
    {
      id: 'client-payment',
      icon: <CreditCardIcon />,
      name: 'Payment',
      path: '/client/payment',
      category: 'main'
    },
    {
      id: 'client-services-tasks',
      icon: <FolderIcon />,
      name: 'Services & Tasks',
      path: '/client/services-tasks',
      category: 'main'
    }
  ], []);

  // FULL MENU ITEMS - Admin/HR/Employee ke liye
  const fullMenuItems = useMemo(() => [
    // Main Menu - सभी users के लिए (all departments)
    {
      id: 'dashboard',
      icon: <DashboardIcon />, 
      name: 'Dashboard', 
      path: '/cds/user-dashboard', 
      category: 'main',
      accessRules: [
        { department: 'all', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['user'] }
      ]
    },
    {
      id: 'attendance',
      icon: <CalendarIcon />, 
      name: 'Attendance', 
      path: '/cds/attendance', 
      category: 'main',
      accessRules: [
        { department: 'all', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['user'] }
      ]
    },
    {
      id: 'my-leaves',
      icon: <EventNoteIcon />, 
      name: 'My Leaves', 
      path: '/cds/my-leaves', 
      category: 'main',
      accessRules: [
        { department: 'all', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['user'] }
      ]
    },
    {
      id: 'my-assets',
      icon: <ComputerIcon />, 
      name: 'My Assets', 
      path: '/cds/my-assets', 
      category: 'main',
      accessRules: [
        { department: 'all', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['user'] }
      ]
    },
    
    // Tasks & Projects
    {
      id: 'create-task',
      icon: <TaskIcon />, 
      name: 'Create Task', 
      path: '/cds/task-management', 
      category: 'tasks',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin','intern'] }
      ]
    },
    {
      id: 'employee-project',
      icon: <GroupsIcon />, 
      name: 'Employee Project', 
      path: '/cds/project', 
      category: 'tasks',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin'] }
      ]
    },
    
    // Communication
    {
      id: 'alerts',
      icon: <NotificationsIcon />, 
      name: 'Alerts', 
      path: '/cds/alert', 
      category: 'communication',
      accessRules: [
        { department: 'all', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin'] }
      ]
    },
    {
      id: 'employee-meeting',
      icon: <VideoCallIcon />, 
      name: 'Employee Meeting', 
      path: '/cds/employee-meeting', 
      category: 'communication',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'user', 'hr', 'manager', 'SuperAdmin'] }
      ]
    },

    // Admin Menu
    {
      id: 'emp-details',
      icon: <PersonIcon />, 
      name: 'Employee Details', 
      path: '/cds/admin/emp-details', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['manager'] }
      ]
    },
    {
      id: 'emp-attendance',
      icon: <CalendarIcon />, 
      name: 'Employees Attendance', 
      path: '/cds/admin/emp-attendance', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['manager'] }
      ]
    },
    {
      id: 'emp-leaves',
      icon: <EventNoteIcon />, 
      name: 'Employees Leaves', 
      path: '/cds/admin/emp-leaves', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['manager'] }
      ]
    },
    {
      id: 'emp-assets',
      icon: <ComputerIcon />, 
      name: 'Employees Assets', 
      path: '/cds/admin/emp-assets', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['manager'] }
      ]
    },
    {
      id: 'admin-task-create',
      icon: <TaskIcon />, 
      name: 'Create Task', 
      path: '/cds/admin/task-create', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['manager'] }
      ]
    },
    {
      id: 'emp-client',
      icon: <BusinessIcon />, 
      name: 'Client Management', 
      path: '/cds/admin/client', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] }
      ]
    },
    {
      id: 'emp-all-task',
      icon: <ListAltIcon />, 
      name: 'All Tasks', 
      path: '/cds/admin/all-tasks', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] }
      ]
    },
    {
      id: 'admin-meeting',
      icon: <MeetingRoomIcon />, 
      name: 'Admin Meeting', 
      path: '/cds/admin/meeting', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] }
      ]
    },
    {
      id: 'admin-projects',
      icon: <ApartmentIcon />, 
      name: 'Admin Projects', 
      path: '/cds/admin/adminp', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] }
      ]
    },
    {
      id: 'create-user',
      icon: <PersonAddIcon />, 
      name: 'Create User', 
      path: '/cds/admin/create-user', 
      category: 'admin',
      accessRules: [
        { department: '6968690c7c8d496a6cb657f5', roles: ['admin', 'hr', 'manager', 'SuperAdmin'] },
        { department: '696869607c8d496a6cb657fa', roles: ['manager'] }
      ]
    },
  ], []);

  // Filter menu items based on user type
  const menuItems = useMemo(() => {
    if (isClientUser) {
      // Client ke liye sirf 3 pages
      return clientMenuItems;
    }
    return fullMenuItems;
  }, [isClientUser, clientMenuItems, fullMenuItems]);

  // Filter items based on user role and department (only for non-client users)
  const filteredMenuItems = useMemo(() => {
    if (isClientUser) {
      // Client users ko directly client menu items return karo
      return menuItems;
    }

    if (!userData) return [];

    const userDepartment = userData.department;
    const userRole = userData.jobRole;
    
    if (userDepartment === "Management" && userRole === "super_admin") {
      return menuItems;
    }

    return menuItems.filter(item => {
      if (!item.accessRules) return false;
      return item.accessRules.some(rule => {
        const departmentMatch = rule.department === 'all' || rule.department === userDepartment;
        const roleMatch = rule.roles.includes(userRole);
        return departmentMatch && roleMatch;
      });
    });
  }, [userData, menuItems, isClientUser]);

  // Organize menu items into sections
  const menuSections = useMemo(() => {
    if (!filteredMenuItems.length) return [];

    if (isClientUser) {
      // Client ke liye sirf ek section "Main Menu"
      return [{
        id: 'main',
        heading: 'Main Menu',
        items: filteredMenuItems
      }];
    }

    // Non-client users ke liye multiple sections
    const sections = [
      { id: 'main', heading: 'Main Menu', items: [] },
      { id: 'tasks', heading: 'Tasks & Projects', items: [] },
      { id: 'communication', heading: 'Communication', items: [] },
      { id: 'admin', heading: 'Administration', items: [] }
    ];

    filteredMenuItems.forEach(item => {
      const section = sections.find(sec => sec.id === item.category);
      if (section) {
        section.items.push(item);
      }
    });

    return sections.filter(section => section.items.length > 0);
  }, [filteredMenuItems, isClientUser]);

  const renderMenuSection = (section) => {
    const shouldShowFull = isMobile ? true : isSidebarOpen;

    return (
      <Box key={section.id}>
        {/* Section Heading */}
        {shouldShowFull ? (
          <SectionHeading>
            {section.heading}
          </SectionHeading>
        ) : (
          <Tooltip title={section.heading} placement="right">
            <CollapsedHeading>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: (theme) => theme.palette.text.secondary,
                }}
              >
                •••
              </Typography>
            </CollapsedHeading>
          </Tooltip>
        )}

        {/* Section Items */}
        <List sx={{ py: 0 }}>
          {section.items.map((item) => (
            <StyledListItem key={item.id} disablePadding>
              {shouldShowFull ? (
                <StyledListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigate(item.path)}
                >
                  <StyledListItemIcon>{item.icon}</StyledListItemIcon>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{ 
                      variant: 'body2', 
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '0.9rem'
                    }}
                  />
                </StyledListItemButton>
              ) : (
                <Tooltip title={item.name} placement="right">
                  <StyledListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigate(item.path)}
                    sx={{ justifyContent: 'center' }}
                  >
                    <StyledListItemIcon sx={{ marginRight: 0, fontSize: '1.2rem' }}>
                      {item.icon}
                    </StyledListItemIcon>
                  </StyledListItemButton>
                </Tooltip>
              )}
            </StyledListItem>
          ))}
        </List>
      </Box>
    );
  };

  const Container = isMobile ? MobileSidebarContainer : SidebarContainer;

  // Loading state
  if (!userData) {
    return (
      <Container
        sx={!isMobile ? {
          width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
        } : undefined}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container
      ref={sidebarRef}
      onMouseEnter={isMobile ? undefined : handleMouseEnter}
      onMouseLeave={isMobile ? undefined : handleMouseLeave}
      sx={!isMobile ? {
        width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
      } : undefined}
    >
      {/* User Info (only when sidebar is open) */}
      {isSidebarOpen && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {userData.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {isClientUser ? 'Client User' : userData.jobRole}
          </Typography>
        </Box>
      )}

      {/* Menu Sections */}
      {menuSections.map((section) => renderMenuSection(section))}

      {/* Logout Section */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        
        {isMobile || isSidebarOpen ? (
          <StyledListItemButton
            onClick={handleLogout}
            sx={{
              color: 'text.secondary',
              '&:hover': { 
                color: 'error.main',
                backgroundColor: 'action.hover'
              }
            }}
          >
            <StyledListItemIcon>
              <LogoutOutlined sx={{ fontSize: '1.2rem' }} />
            </StyledListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ 
                variant: 'body2', 
                fontWeight: 500 
              }}
            />
          </StyledListItemButton>
        ) : (
          <Tooltip title="Logout" placement="right">
            <IconButton
              onClick={handleLogout}
              sx={{
                width: '100%',
                justifyContent: 'center',
                color: 'text.secondary',
                padding: '8px',
                borderRadius: 2,
                '&:hover': { 
                  color: 'error.main',
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <LogoutOutlined sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Container>
  );
};

export default Sidebar;