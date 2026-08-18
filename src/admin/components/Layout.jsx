import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidthOpen = 240;
const drawerWidthClosed = 72;

const LayoutContainer = styled('div')({
  display: 'flex',
  minHeight: '100vh',
});

const MainContent = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
 
  minHeight: '100vh',
  overflow: 'auto',
  marginLeft: open ? drawerWidthOpen : drawerWidthClosed,
  transition: theme.transitions.create(['margin'], {
    easing: theme.transitions.easing.sharp,
    duration: 120,
  }),
}));

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <LayoutContainer>
      <CssBaseline />
    
      <MainContent open={sidebarOpen}>

        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;
