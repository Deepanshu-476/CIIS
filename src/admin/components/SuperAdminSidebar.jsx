import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  styled,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Apartment as CompanyDetailsIcon,
  Public as AllCompanyIcon,
  VpnKey as CompanyAccessIcon,
  AccountTree as DepartmentIcon,
  Place as BranchIcon,
  Badge as JobRoleIcon,
  PersonAdd as CreateUserIcon,
  HowToReg as RegisterRequestIcon,
  Devices as AssetsIcon,
  ViewSidebar as SidebarManagementIcon,
  Layers as PageManagementIcon,
  CardMembership as PlansIcon,
  Email as EmailIcon,
  SystemUpdateAlt as AppUpdateIcon,
  SupportAgent as SupportAgentIcon,
  RateReview as FeedbackIcon,
  CalendarMonth as LeavePolicyIcon,
  VideoCall as DemoIcon,
  Celebration as HolidayIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { preloadRouteChunk } from '../../utils/routePreloader';
import { useAuth } from '../../context/AuthContext';


const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 260,
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
  [theme.breakpoints.down('sm')]: {
    top: 56,
    height: 'calc(100vh - 56px)',
  },
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const CollapsedSidebar = styled(SidebarContainer)(({ theme }) => ({
  width: 72,
  overflow: 'hidden',
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2, 2, 1),
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  fontWeight: 600,
  letterSpacing: '0.5px',
}));

const StyledListItem = styled(ListItem)({
  padding: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
});

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'isCollapsed'
})(({ theme, selected, isCollapsed }) => ({
  minHeight: isCollapsed ? 44 : 42,
  height: isCollapsed ? 44 : 'auto',
  width: isCollapsed ? 44 : 'calc(100% - 16px)',
  margin: isCollapsed ? '3px auto' : theme.spacing(0.35, 1),
  padding: isCollapsed ? 0 : theme.spacing(0.8, 1.5),
  justifyContent: isCollapsed ? 'center' : 'flex-start',
  alignItems: 'center',
  borderRadius: isCollapsed ? 10 : theme.spacing(1),
  color: selected ? '#1d4ed8' : '#475569',
  backgroundColor: selected 
    ? (isCollapsed ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.08)')
    : 'transparent',
  border: isCollapsed 
    ? (selected ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid transparent')
    : (selected ? '1px solid rgba(37, 99, 235, 0.18)' : '1px solid transparent'),
  boxShadow: isCollapsed && selected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  boxSizing: 'border-box',
  '&:hover': {
    backgroundColor: selected 
      ? (isCollapsed ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.12)')
      : 'rgba(241, 245, 249, 0.9)',
    color: '#1d4ed8',
    transform: isCollapsed ? 'scale(1.06)' : 'none',
    boxShadow: isCollapsed ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
  },
  '& .MuiListItemIcon-root': {
    minWidth: isCollapsed ? 0 : 32,
    marginRight: isCollapsed ? 0 : theme.spacing(1.25),
    margin: isCollapsed ? 0 : undefined,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: selected ? '#2563eb' : '#64748b',
    transition: 'color 0.18s ease, transform 0.18s ease',
  },
  '&:hover .MuiListItemIcon-root': {
    color: '#2563eb',
  },
  '& .MuiSvgIcon-root': {
    fontSize: isCollapsed ? 22 : 21,
    width: isCollapsed ? 22 : 21,
    height: isCollapsed ? 22 : 21,
    display: 'block',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.82rem',
    fontWeight: selected ? 600 : 500,
    color: selected ? '#1d4ed8' : '#334155',
  },
}));

const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: 0,
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'inherit',
});

const LogoutListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'isCollapsed'
})(({ theme, isCollapsed }) => ({
  minHeight: isCollapsed ? 44 : 42,
  height: isCollapsed ? 44 : 'auto',
  width: isCollapsed ? 44 : 'calc(100% - 16px)',
  margin: isCollapsed ? '3px auto' : theme.spacing(0.35, 1),
  padding: isCollapsed ? 0 : theme.spacing(0.8, 1.5),
  justifyContent: isCollapsed ? 'center' : 'flex-start',
  alignItems: 'center',
  borderRadius: isCollapsed ? 10 : theme.spacing(1),
  color: theme.palette.error.main,
  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: theme.palette.error.light + '20',
    color: theme.palette.error.dark,
    transform: isCollapsed ? 'scale(1.06)' : 'none',
  },
  '& .MuiListItemIcon-root': {
    minWidth: isCollapsed ? 0 : 32,
    marginRight: isCollapsed ? 0 : theme.spacing(1.25),
    margin: isCollapsed ? 0 : undefined,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.error.main,
  },
  '& .MuiSvgIcon-root': {
    fontSize: isCollapsed ? 22 : 21,
    width: isCollapsed ? 22 : 21,
    height: isCollapsed ? 22 : 21,
    display: 'block',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.82rem',
    fontWeight: 500,
  },
}));

const ContentWrapper = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'none', // Firefox
  msOverflowStyle: 'none', // IE and Edge
  '&::-webkit-scrollbar': {
    display: 'none', // Chrome, Safari, Opera
    width: 0,
    height: 0,
  },
});

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [userEmail, setUserEmail] = useState('');
  
  useEffect(() => {
    try {
      const userDataString = localStorage.getItem('superAdmin');
      
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);

        if (parsedData && parsedData.email) {
          setUserEmail(parsedData.email);
        } else if (parsedData && parsedData.user && parsedData.user.email) {
          setUserEmail(parsedData.user.email);
        }
      }

    } catch (error) {
      console.error('Error parsing superAdmin data from localStorage:', error);
    }
  }, []);

  const isOwnerSuperAdmin = String(userEmail || '').trim().toLowerCase() === 'ashutoshrai130@gmail.com';
  const isGlobalSuperAdmin = isOwnerSuperAdmin;

  // Pages explicitly defined in the Super Admin menu must remain visible.
  // Role-specific flags below still protect owner/global-only entries.
  const isAllowedByPlan = () => true;

  const ciisUserMenuItems = [
    { heading: 'MPA Management' },
    { 
      icon: <CompanyDetailsIcon />, 
      name: 'Company Details', 
      route: '/Ciis-network/company-details',
      showForAll: true
    },
    { 
      icon: <AllCompanyIcon />, 
      name: 'All Company', 
      route: '/Ciis-network/all-company',
      showForOwnerSuperAdmin: true
    },
    { 
      icon: <CompanyAccessIcon />, 
      name: 'Company Access', 
      route: '/Ciis-network/CompanyAccessManagement',
      showForOwnerSuperAdmin: true
    },
    { 
      icon: <DepartmentIcon />, 
      name: 'Department', 
      route: '/Ciis-network/department',
      showForAll: true
    },
    { 
      icon: <BranchIcon />, 
      name: 'Manage Branches', 
      route: '/Ciis-network/branch',
      showForAll: true
    },
    { 
      icon: <JobRoleIcon />, 
      name: 'Job Roles', 
      route: '/Ciis-network/JobRoleManagement',
      showForAll: true
    },
    { 
      icon: <CreateUserIcon />, 
      name: 'Create User', 
      route: '/Ciis-network/create-user',
      showForAll: true
    },
    {
      icon: <RegisterRequestIcon />,
      name: 'Register Request',
      route: '/Ciis-network/register-request',
      showForAll: true
    },
    { 
      icon: <AssetsIcon />, 
      name: 'Assets Management', 
      route: '/Ciis-network/company-assets',
      showForAll: true
    },
    { 
      icon: <SidebarManagementIcon />, 
      name: 'Sidebar Management', 
      route: '/Ciis-network/SidebarManagement',
      showForAll: true
    },
    {
      icon: <PageManagementIcon />, 
      name: 'Page Management',
      route: '/Ciis-network/page-management',
      showForAll: true
    },
    {
      icon: <PlansIcon />, 
      name: 'Plans',
      route: '/Ciis-network/plans',
      showForOwnerSuperAdmin: true
    },
    {
      icon: <EmailIcon />, 
      name: 'Email Settings',
      route: '/Ciis-network/email-settings',
      showForOwnerSuperAdmin: true
    },
    {
      icon: <AppUpdateIcon />, 
      name: 'App Version',
      route: '/Ciis-network/app-version-control',
      showForOwnerSuperAdmin: true
    },
    {
      icon: <SupportAgentIcon />, 
      name: 'Support Operations',
      route: '/Ciis-network/support-operations',
      showForAll: true
    },
    {
      icon: <FeedbackIcon />, 
      name: 'Feedback / Questionnaire',
      route: '/Ciis-network/feedback-questionnaire',
      showForAll: true
    },
    {
      icon: <LeavePolicyIcon />, 
      name: 'Leave Policy',
      route: '/Ciis-network/leave-policy',
      showForAll: true
    },
    {
      icon: <DemoIcon />, 
      name: 'Demo Requests',
      route: '/Ciis-network/demo-requests',
      showForSuperAdmin: true
    },
    { 
      icon: <HolidayIcon />, 
      name: 'Holiday', 
      route: '/Ciis-network/holiday',
      showForAll: true
    },
    { 
      icon: <SettingsIcon />, 
      name: 'Settings', 
      route: '/Ciis-network/settings',
      showForAll: true
    },
  ];

  const getFilteredMenuItems = () => {
    const filteredItems = [];
    let skipNextHeading = false;
    
    for (let i = 0; i < ciisUserMenuItems.length; i++) {
      const item = ciisUserMenuItems[i];
      
      if (item.heading) {
        if (skipNextHeading) {
          skipNextHeading = false;
          continue;
        }
        filteredItems.push(item);
      } else {
        
        let shouldShow = false;
        
        if (!isAllowedByPlan(item)) {
          shouldShow = false;
        } else if (item.showForAll) {
          shouldShow = true;
        } else if (item.showForSuperAdmin) {
          shouldShow = isGlobalSuperAdmin;
        } else if (item.showForOwnerSuperAdmin) {
          shouldShow = !!isOwnerSuperAdmin;
        } else if (item.showForEmail && item.showForEmail.includes(userEmail)) {
          shouldShow = true;
        }
        
        if (shouldShow) {
          filteredItems.push(item);
          skipNextHeading = false;
        } else {
          if (filteredItems.length > 0 && filteredItems[filteredItems.length - 1].heading) {
            skipNextHeading = true;
          }
        }
      }
    }
    
    return filteredItems.filter((item, index, array) => {
      if (item.heading) {
        const hasMenuItemAfter = array
          .slice(index + 1)
          .some(nextItem => !nextItem.heading);
        return hasMenuItemAfter;
      }
      return true;
    });
  };

  const handleClick = (route) => {
    const currentPath = location.pathname.replace(/\/+$/, '');
    const nextPath = String(route || '').replace(/\/+$/, '');
    if (nextPath && currentPath !== nextPath) {
      navigate(route);
    }
    if (isMobile) {
      closeSidebar?.();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout?.();
      navigate('/');
      
      if (isMobile) {
        closeSidebar?.();
      }
    }
  };

  const SidebarComponent = isOpen ? SidebarContainer : CollapsedSidebar;
  const filteredMenuItems = getFilteredMenuItems();

  void 0;
  void 0;

  return (
    <SidebarComponent>
      <ContentWrapper>
        <List sx={{ pt: 1 }}>
          {filteredMenuItems.map((item, idx) =>
            item.heading ? (
              isOpen && (
                <SectionHeading key={`heading-${idx}`}>
                  {item.heading}
                </SectionHeading>
              )
            ) : (
              <StyledListItem key={`item-${idx}`} disablePadding>
                {isOpen ? (
                  <StyledListItemButton
                    selected={location.pathname.startsWith(item.route)}
                    onClick={() => handleClick(item.route)}
                    onMouseEnter={() => preloadRouteChunk(item.route)}
                    onFocus={() => preloadRouteChunk(item.route)}
                    isCollapsed={false}
                  >
                    <StyledListItemIcon>{item.icon}</StyledListItemIcon>
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 500,
                      }}
                    />
                  </StyledListItemButton>
                ) : (
                  <Tooltip title={item.name} placement="right">
                    <StyledListItemButton
                      selected={location.pathname.startsWith(item.route)}
                      onClick={() => handleClick(item.route)}
                      onMouseEnter={() => preloadRouteChunk(item.route)}
                      onFocus={() => preloadRouteChunk(item.route)}
                      isCollapsed={true}
                    >
                      <StyledListItemIcon>
                        {item.icon}
                      </StyledListItemIcon>
                    </StyledListItemButton>
                  </Tooltip>
                )}
              </StyledListItem>
            )
          )}
        </List>

        <Box sx={{ flex: 1 }} />
        <Divider sx={{ my: 1, mx: 2 }} />

        <List sx={{ pb: 2 }}>
          <StyledListItem disablePadding>
            {isOpen ? (
              <LogoutListItemButton onClick={handleLogout} isCollapsed={false}>
                <StyledListItemIcon>
                  <LogoutIcon />
                </StyledListItemIcon>
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                  }}
                />
              </LogoutListItemButton>
            ) : (
              <Tooltip title="Logout" placement="right">
                <LogoutListItemButton
                  onClick={handleLogout}
                  isCollapsed={true}
                >
                  <StyledListItemIcon>
                    <LogoutIcon />
                  </StyledListItemIcon>
                </LogoutListItemButton>
              </Tooltip>
            )}
          </StyledListItem>
        </List>
      </ContentWrapper>
    </SidebarComponent>
  );
};

export default React.memo(Sidebar);
