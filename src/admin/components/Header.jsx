import React, { useState, useEffect,  } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Typography,
  Box,
  Avatar,
  Tooltip,
  styled,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Campaign as CampaignIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  PrivacyTip as PrivacyPolicyIcon,
  ContactSupport as ContactSupportIcon,
  ExitToApp as LogoutIcon,
  Info as VersionIcon,
  List as ViewLogsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import { ColorModeContext } from '../../Theme/ThemeContext';
import { useAuth } from '../../context/useAuth';
import logo from '/logoo.png'
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  transition: theme.transitions.create(['margin', 'width']),
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  height: 56,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(0, 2),
    height: 64,
  },
  zIndex: theme.zIndex.drawer + 1,
}));

const ProcessName = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  [theme.breakpoints.up('md')]: {
    fontSize: '0.875rem',
  },
}));

const UserProfile = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginLeft: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  borderRadius: '30px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5),
    gap: theme.spacing(0.25),
  },
}));

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const navigate = useNavigate();
  const { user } = useAuth();

  const open = Boolean(anchorEl);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

const handleLogout = () => {
  
  
  if (window.confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    navigate('/');
    
    
    alert('Logged out successfully!'); 
  }
};

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <StyledAppBar
      position="fixed"
      elevation={isScrolled ? 4 : 0}
      sx={{
        backgroundColor: isScrolled ? 'background.paper' : 'transparent',
        color: 'text.primary',
        backdropFilter: isScrolled ? 'blur(8px)' : 'none',
        borderBottom: isScrolled ? `1px solid ${theme.palette.divider}` : 'none',
      }}
    >
      <Toolbar sx={{ width: '100%', padding: '0 !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: isMobile ? 2 : 1 }}>
          <IconButton
            color="inherit"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: isMobile ? 0.5 : 1 }}
          >
            {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>

        <Typography
  variant="h6"
  noWrap
  component="div"
  sx={{
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover img': {
      opacity: 0.9,
      transform: 'scale(1.05)',
      transition: 'all 0.3s ease',
    },
  }}
  onClick={() => navigate('/user/dashboard')}
>
  <img
    src={logo}
    alt="Logo"
    style={{
      height: isMobile ? '35px' : '45px',
      width: 'auto',
      objectFit: 'contain',
      display: 'block',
    }}
  />
</Typography>


          {!isMobile && <SearchBar />}
        </Box>

        {(!isMobile && !isTablet) && (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
            <ProcessName variant="subtitle1">Default Process</ProcessName>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1, flex: 1, justifyContent: 'flex-end' }}>
          <Tooltip title="Create New">
            <IconButton color="inherit">
              <AddIcon />
            </IconButton>
          </Tooltip>

          
          <Tooltip title="Attendance">
            <IconButton color="inherit" onClick={() => navigate('/cds/user-dashboard')}>
              <Typography variant="subtitle2" fontWeight={600}>Attd.</Typography>
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Alerts">
            <IconButton color="inherit">
              <Badge badgeContent={1} color="error">
                <CampaignIcon />
              </Badge>
            </IconButton>
          </Tooltip>
                    <UserProfile onClick={handleProfileClick}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            {!isMobile && (
              <Box>
                <Typography variant="subtitle2" noWrap>
                  {user?.name || 'Admin'}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                  CIIS
                </Typography>
              </Box>
            )}
          </UserProfile>

          <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
            <MenuItem>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <MenuItem>
              <ListItemIcon><PrivacyPolicyIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Privacy Policy</ListItemText>
            </MenuItem>
            <MenuItem>
              <ListItemIcon><ContactSupportIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Contact Support</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Log out</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem disabled>
              <ListItemIcon><VersionIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Version 5.2.11</ListItemText>
            </MenuItem>
            <MenuItem>
              <ListItemIcon><ViewLogsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>View Logs</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;
