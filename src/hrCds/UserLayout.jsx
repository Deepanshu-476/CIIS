import React, { useState, useEffect, Suspense } from 'react';
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
import RouteBoundaryLoader from '../components/RouteBoundaryLoader';
import PageAccessGate from './components/PageAccessGate';
import FeedbackQuestionnairePopup from '../components/FeedbackQuestionnairePopup';

const drawerWidthOpen = 224;
const drawerWidthClosed = 70;

const LayoutContainer = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f8faff',
});

const MainContent = styled('main', {
  shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'isSidebarHovered',
})(({ theme, isMobile, isSidebarHovered }) => ({
  flexGrow: 1,
  padding: 0,
  minHeight: 'calc(100dvh - 64px)',
  width: '100%',
  overflow: 'auto',
  backgroundColor: '#f8faff',
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
  const isDashboard = ['/ciisUser/user-dashboard', '/ciisUser/dashboard-1'].includes(normalizedPath);
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
          overflow: 'auto',
          padding: 0,
          mt: isMobile ? 7 : 8,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <CallProvider>
          <Box
            className="UserLayout-page-shell"
            sx={{
              width: '100%',
              maxWidth: '100%',
              minHeight: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
              overflow: 'visible',
              boxSizing: 'border-box',
              backgroundColor: '#f8faff',
              padding: { xs: '10px 12px', sm: '14px 18px 18px' },
              '& > *': {
                minHeight: '100%',
                padding: '0 !important',
                background: 'transparent !important',
                boxSizing: 'border-box',
              },
            }}
          >
            <Suspense fallback={<RouteBoundaryLoader label="Loading page..." />}>
              <PageAccessGate>
                <Outlet />
              </PageAccessGate>
            </Suspense>
          </Box>
        </CallProvider>
      </MainContent>
      <FeedbackQuestionnairePopup />
      <SupportChatWidget />
    </LayoutContainer>
  );
};

export default UserLayout;
