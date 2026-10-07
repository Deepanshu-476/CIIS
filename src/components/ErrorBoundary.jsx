import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.removeItem('sidebarConfig');
      Object.keys(localStorage)
        .filter(key => key.startsWith('ciis-api-cache:'))
        .forEach(key => localStorage.removeItem(key));
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 500,
              width: '100%',
              textAlign: 'center',
              borderRadius: 3,
              backgroundColor: '#fff',
              border: '1px solid #fee2e2',
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 56, color: '#ef4444', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom color="#1f2937">
              Something went wrong
            </Typography>
            <Typography variant="body2" color="#6b7280" sx={{ mb: 3 }}>
              {this.state.error?.message || "An unexpected error occurred while loading this page. Please reload to try again."}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
              }}
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
