
import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#1976d2' },
            secondary: { main: '#f50057' },
            background: { default: '#f5f5f5', paper: '#fff' },
            text: { primary: '#000', secondary: '#555' },
          }
        : {
            primary: { main: '#90caf9' },
            secondary: { main: '#f48fb1' },
            background: { default: '#121212', paper: '#1e1e1e' },
            text: { primary: '#fff', secondary: '#aaa' },
          }),
    },
    typography: {
      fontFamily: 'Poppins, sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 20px',
            transition: '0.3s',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            textDecoration: 'none',
            transition: 'color 0.3s ease',
            '&:hover': {
              color: mode === 'light' ? '#0d47a1' : '#e3f2fd',
            },
          },
        },
      },
    },
  });
