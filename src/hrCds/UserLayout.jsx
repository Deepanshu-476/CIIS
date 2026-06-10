import React, { useState, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  CssBaseline,
  useMediaQuery,
  Drawer,
  Box
} from '@mui/material';
import { Outlet } from 'react-router-dom';

import Header from './Header';
import Sidebar from './Sidebar';
import SupportChatWidget from './pages/SupportChatWidget';

const drawerWidthOpen = 260;
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
  
  // Desktop styles
  ...(!isMobile && {
    marginLeft: `${drawerWidthClosed}px`,
    width: `calc(100% - ${drawerWidthClosed}px)`,
    
    // When sidebar is hovered (open)
    ...(isSidebarHovered && {
      marginLeft: `${drawerWidthOpen}px`,
      width: `calc(100% - ${drawerWidthOpen}px)`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
  
  // Mobile styles
  ...(isMobile && {
    marginLeft: 0,
    width: '100%',
  }),
}));

const UserLayout = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Handle sidebar hover
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
  
  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };
  
  // Close mobile sidebar when route changes
  const handleCloseMobileSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };
  
  // Auto-close sidebar on mobile when resizing to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);
  
  return (
    <LayoutContainer>
      <CssBaseline />

      <Header
        toggleSidebar={toggleMobileSidebar}
        isMobile={isMobile}
      />

      {/* Desktop Sidebar (Always visible, hover-controlled) */}
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
            closeSidebar={() => setIsSidebarHovered(false)}
            drawerWidthOpen={drawerWidthOpen}
            drawerWidthClosed={drawerWidthClosed}
          />
        </Box>
      )}

      {/* Mobile Drawer */}
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
              top: 64,
              height: 'calc(100% - 64px)',
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
        isMobile={isMobile} 
        isSidebarHovered={isSidebarHovered}
        sx={{ 
          maxWidth: '100%', 
          overflow: 'hidden',
          padding: { 
            xs: 1, 
            sm: 2, 
            md: 3 
          },
          mt: isMobile ? 7 : 8,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <Box sx={{ 
          maxWidth: '100%', 
          overflow: 'hidden',
          padding: { xs: 1, sm: 2, md: 3 }
        }}>
          <Outlet />
        </Box>
      </MainContent>
      <SupportChatWidget />
    </LayoutContainer>
  );
};

export default UserLayout;
