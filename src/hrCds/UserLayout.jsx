  import React, { useState, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  CssBaseline,
  useMediaQuery,
  Drawer,
  Box
} from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';

import Header from './Header';
import Sidebar from './Sidebar';
import SupportChatWidget from './pages/SupportChatWidget';
import { CallProvider } from '../context/CallContext';

const drawerWidthOpen = 224;
const drawerWidthClosed = 70;

const LayoutContainer = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
});

const MainContent = styled('main', {
  shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'isSidebarHovered',
})(({ theme, isMobile, isSidebarHovered }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  minHeight: '100vh',
  width: '100%',
  overflow: 'auto',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  
  
  ...(!isMobile && {
    marginLeft: `${drawerWidthClosed}px`,
    width: `calc(100% - ${drawerWidthClosed}px)`,
    
    
    ...(isSidebarHovered && {
      marginLeft: `${drawerWidthOpen}px`,
      width: `calc(100% - ${drawerWidthOpen}px)`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
  
  
  ...(isMobile && {
    marginLeft: 0,
    width: '100%',
  }),
}));

const UserLayout = () => {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '');
  const isDashboard = normalizedPath === '/ciisUser/user-dashboard';
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSidebarMouseEnter = () => {
    if (!isMobile) {
      setIsSidebarHovered(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isMobile) {
      setIsSidebarHovered(false);
    }
  };
  
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };
  
  
  const handleCloseMobileSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };
  
  
  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  return (
    <LayoutContainer>
      <CssBaseline />

      <Header
        toggleSidebar={toggleMobileSidebar}
        isMobile={isMobile}
        isDashboard={isDashboard}
      />

      
      {!isMobile && (
        <Box
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
          sx={{
            position: 'fixed',
            left: 0,
            top: 64,
            zIndex: theme.zIndex.drawer,
          }}
        >
          <Sidebar
            isOpen={isSidebarHovered}
            drawerWidthOpen={drawerWidthOpen}
            drawerWidthClosed={drawerWidthClosed}
          />
        </Box>
      )}

      
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileSidebarOpen}
          onClose={handleCloseMobileSidebar}
          ModalProps={{ 
            keepMounted: true,
            BackdropProps: { invisible: false }
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidthOpen,
              top: 56,
              height: 'calc(100% - 56px)',
            },
          }}
        >
          <Sidebar
            isOpen={true}
            closeSidebar={handleCloseMobileSidebar}
            isMobile={isMobile}
          />
        </Drawer>
      )}

      <MainContent 
        className={isSidebarHovered ? 'ClientDashboard-sidebar-open' : ''}
        isMobile={isMobile} 
        isSidebarHovered={isSidebarHovered}
        sx={{ 
          maxWidth: '100%', 
          overflow: 'hidden',
          padding: { 
            xs: 1, 
            sm: 2, 
            md: isDashboard ? 0 : 3
          },
          mt: isMobile ? 7 : 8,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <CallProvider>
          <Box sx={{ 
            maxWidth: '100%', 
            overflow: 'hidden',
            padding: { xs: 1, sm: 2, md: isDashboard ? 0 : 3 }
          }}>
            <Outlet />
          </Box>
        </CallProvider>
      </MainContent>
      <SupportChatWidget />
    </LayoutContainer>
  );
};

export default UserLayout;
