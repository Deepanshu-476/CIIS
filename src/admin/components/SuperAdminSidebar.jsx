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
  Dashboard as DashboardIcon,
  Business as CompanyIcon,
  CorporateFare as DepartmentIcon,
  WorkOutline as JobRoleIcon,
  PersonAdd as CreateUserIcon,
  ExitToApp as LogoutIcon,
  Inventory as AssetsIcon, // Import Assets Icon
} from '@mui/icons-material';

// Styled components
const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 240,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: theme.zIndex.drawer,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowY: 'auto',
  scrollbarWidth: 'none',
  display: 'flex',
  flexDirection: 'column',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
}));

const CollapsedSidebar = styled(SidebarContainer)(({ theme }) => ({
  width: 72,
  overflowX: 'hidden',
}));

// Header space for AppBar
const HeaderSpacer = styled(Box)(({ theme }) => ({
  height: 64, // AppBar ki height
  [theme.breakpoints.down('sm')]: {
    height: 56, // Mobile par AppBar ki height
  },
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2, 2, 1), // Top padding increased
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  fontWeight: 600,
  letterSpacing: '0.5px',
}));

const StyledListItem = styled(ListItem)({
  padding: 0,
});

const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  minHeight: 48,
  justifyContent: 'initial',
  padding: theme.spacing(1, 2),
  margin: theme.spacing(0.5, 1), // Added margin for better spacing
  borderRadius: theme.spacing(1), // Rounded corners
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .MuiListItemIcon-root': {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  },
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 0,
  marginRight: theme.spacing(2),
  color: 'inherit',
}));

// Logout button styled component
const LogoutListItemButton = styled(ListItemButton)(({ theme }) => ({
  minHeight: 48,
  justifyContent: 'initial',
  padding: theme.spacing(1, 2),
  margin: theme.spacing(0.5, 1), // Same margin as other items
  borderRadius: theme.spacing(1), // Rounded corners
  color: theme.palette.error.main,
  '&:hover': {
    backgroundColor: theme.palette.error.light + '20',
  },
  '& .MuiListItemIcon-root': {
    color: theme.palette.error.main,
  },
}));

// Content wrapper for proper spacing
const ContentWrapper = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
});

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [companyRole, setCompanyRole] = useState('Owner');
  
  useEffect(() => {
    try {
      const userDataString = localStorage.getItem('superAdmin');
      console.log('superAdmin data from localStorage:', userDataString);
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('Parsed user data:', userData);
        
        if (userData && userData.companyRole) {
          setCompanyRole(userData.companyRole);
          console.log('Company role set to:', userData.companyRole);
        } else {
          console.log('companyRole not found in user data');
          setCompanyRole('Owner');
        }
      } else {
        console.log('No superAdmin data found in localStorage');
        setCompanyRole('Owner');
      }
    } catch (error) {
      console.error('Error parsing superAdmin data from localStorage:', error);
      setCompanyRole('Owner');
    }
  }, []);

  const ciisUserMenuItems = [
    { heading: 'MPA Management' }, // Changed heading text as per your image
    { 
      icon: <CompanyIcon />, 
      name: 'Company Details', 
      route: '/Ciis-network/company-details',
      showForRoles: ['ADMIN','Owner']
    },
     { 
      icon: <CompanyIcon />, 
      name: 'All Company', 
      route: '/Ciis-network/all-company',
      showForRoles: ['ADMIN']
    },
    
    { 
      icon: <DepartmentIcon />, 
      name: 'Department', 
      route: '/Ciis-network/department',
      showForRoles: ['ADMIN', 'Owner']
    },
    { 
      icon: <JobRoleIcon />, 
      name: 'Job Roles', 
      route: '/Ciis-network/JobRoleManagement',
      showForRoles: ['ADMIN', 'Owner']
    },
    { 
      icon: <CreateUserIcon />, 
      name: 'Create User', 
      route: '/Ciis-network/create-user',
      showForRoles: ['ADMIN', 'Owner']
    },
    { 
      icon: <AssetsIcon />, // Add Assets Management with Inventory icon
      name: 'Assets Management', 
      route: '/Ciis-network/assets',
      showForRoles: ['ADMIN', 'Owner']
    },
    { 
      icon: <DepartmentIcon />, 
      name: 'Sidebar Management', 
      route: '/Ciis-network/SidebarManagement',
      showForRoles: ['ADMIN', 'Owner']
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
        const shouldShow = !item.showForRoles || item.showForRoles.includes(companyRole);
        
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
    navigate(route);
    if (isMobile) {
      closeSidebar?.();
    }
  };

  // Logout function
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('superAdmin');
      localStorage.removeItem('company');
      localStorage.removeItem('user');
      navigate('/');
      
      if (isMobile) {
        closeSidebar?.();
      }
    }
  };

  const SidebarComponent = isOpen ? SidebarContainer : CollapsedSidebar;
  const filteredMenuItems = getFilteredMenuItems();

  console.log('Current companyRole:', companyRole);
  console.log('Filtered menu items count:', filteredMenuItems.length);

  return (
    <SidebarComponent>
      {/* Header Spacer - Yeh AppBar ke neeche space dega */}
      <HeaderSpacer />
      
      <ContentWrapper>
        {/* Main Menu Items */}
        <List sx={{ pt: 1 }}> {/* Reduced top padding */}
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
                      sx={{ justifyContent: 'center' }}
                    >
                      <StyledListItemIcon sx={{ marginRight: 0 }}>
                        {item.icon}
                      </StyledListItemIcon>
                    </StyledListItemButton>
                  </Tooltip>
                )}
              </StyledListItem>
            )
          )}
        </List>

        {/* Spacer to push logout to bottom */}
        <Box sx={{ flex: 1 }} />

        {/* Divider before logout */}
        <Divider sx={{ my: 1, mx: 2 }} />

        {/* Logout Button */}
        <List sx={{ pb: 2 }}> {/* Bottom padding */}
          <StyledListItem disablePadding>
            {isOpen ? (
              <LogoutListItemButton onClick={handleLogout}>
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
                  sx={{ justifyContent: 'center' }}
                >
                  <StyledListItemIcon sx={{ marginRight: 0 }}>
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

export default Sidebar;