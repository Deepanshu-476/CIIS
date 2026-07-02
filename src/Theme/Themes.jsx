import { createTheme } from '@mui/material/styles';
import React from 'react';
export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#69dd3fff',
        light: mode === 'light' ? '#4791db' : '#85e46c',
        dark: mode === 'light' ? '#115293' : '#4a9c2c',
        contrastText: mode === 'light' ? '#fff' : '#000',
      },
      secondary: {
        main: '#f50057',
        light: '#ff5983',
        dark: '#ab003c',
        contrastText: '#fff',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#fff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
        secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 2,
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            padding: '8px 16px',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: mode === 'light' 
                ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
                : '0 2px 8px rgba(0, 0, 0, 0.4)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: mode === 'light' 
                ? '0 4px 12px rgba(0, 0, 0, 0.2)' 
                : '0 4px 12px rgba(0, 0, 0, 0.6)',
            },
          },
        },
        variants: [
          {
            props: { variant: 'dashed' },
            style: {
              border: `2px dashed ${mode === 'light' ? '#1976d2' : '#69dd3fff'}`,
              backgroundColor: 'transparent',
            },
          },
        ],
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            boxShadow: mode === 'light' 
              ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              boxShadow: mode === 'light' 
                ? '0 4px 16px rgba(0, 0, 0, 0.15)' 
                : '0 4px 16px rgba(0, 0, 0, 0.4)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0 1px 4px rgba(0, 0, 0, 0.1)' 
              : '0 1px 4px rgba(0, 0, 0, 0.3)',
            backgroundColor: mode === 'light' ? '#fff' : '#1a1a1a',
            color: mode === 'light' ? '#000' : '#fff',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#1976d2' : '#69dd3fff',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            fontWeight: 500,
          },
          filled: {
            backgroundColor: mode === 'light' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(105, 221, 63, 0.1)',
            color: mode === 'light' ? '#1976d2' : '#69dd3fff',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#fff' : '#1e1e1e',
            borderRight: mode === 'light' 
              ? '1px solid rgba(0, 0, 0, 0.12)' 
              : '1px solid rgba(255, 255, 255, 0.12)',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'light' 
              ? 'rgba(0, 0, 0, 0.12)' 
              : 'rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
  });


export const useAppTheme = () => {
  const [mode, setMode] = React.useState('light');
  
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return { theme, mode, toggleColorMode };
};