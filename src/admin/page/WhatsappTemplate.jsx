import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button,
  List, ListItem, ListItemText, Divider, Paper,
  FormControl, InputLabel, Select, MenuItem, Grid,
  useMediaQuery, useTheme, Chip, Avatar, Badge,
  IconButton, Tooltip, Skeleton, Tabs, Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';


const whatsappTemplates = [
  {
    id: 1,
    title: 'Portfolio',
    content: "Dear {customer_name},\n\nWe're excited to share our latest portfolio with you. Please find attached our complete catalog of services.\n\nBest regards,\n{agent_name}",
    createdBy: 'Admin',
    process: 'Default process',
    visibility: 'All Templates',
    status: 'active',
    lastUpdated: '2025-07-15',
    variables: ['customer_name', 'agent_name']
  },
  {
    id: 2,
    title: 'Proposal',
    content: "Dear {customer_name},\n\nThank you for your interest in our services. We've prepared a customized proposal for your {service_type} needs.\n\nSincerely,\n{agent_name}",
    createdBy: 'Admin',
    process: 'div',
    visibility: 'My Templates',
    status: 'active',
    lastUpdated: '2025-07-10',
    variables: ['customer_name', 'agent_name', 'service_type']
  },
  {
    id: 3,
    title: 'Follow Up',
    content: "Hello {customer_name},\n\nJust checking in to see if you had any questions about our proposal. We're happy to discuss further!\n\nBest,\n{agent_name}",
    createdBy: 'Manager',
    process: 'Default process',
    visibility: 'All Templates',
    status: 'draft',
    lastUpdated: '2025-07-05',
    variables: ['customer_name', 'agent_name']
  },
];

const processOptions = ['All', 'Default process', 'div'];
const visibilityOptions = ['All Templates', 'My Templates'];
const statusOptions = ['All', 'active', 'draft', 'archived'];

const WhatsAppTemplate = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [processFilter, setProcessFilter] = useState('All');
  const [visibilityFilter, setVisibilityFilter] = useState('All Templates');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('templates');

  
  const filteredTemplates = whatsappTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(search.toLowerCase()) ||
      template.content.toLowerCase().includes(search.toLowerCase());
    const matchesProcess = processFilter === 'All' || template.process === processFilter;
    const matchesVisibility = visibilityFilter === 'All Templates' || template.visibility === visibilityFilter;
    const matchesStatus = statusFilter === 'All' || template.status === statusFilter;
    return matchesSearch && matchesProcess && matchesVisibility && matchesStatus;
  });

  const clearFilters = () => {
    setSearch('');
    setProcessFilter('All');
    setVisibilityFilter('All Templates');
    setStatusFilter('All');
  };

  return (
    <Box p={isMobile ? 2 : 3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600} color="primary">
          WhatsApp Templates
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(90deg, #ff6a3d, #ff9c5a)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(90deg, #e55a37, #e58c4a)'
              }
            }}
          >
            Create New
          </Button>
        )}
      </Box>

      
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab
          value="templates"
          label={
            <Box display="flex" alignItems="center">
              <Typography fontWeight={600}>Templates</Typography>
              <Chip
                label={whatsappTemplates.length}
                size="small"
                sx={{ ml: 1, height: 20 }}
              />
            </Box>
          }
        />
        <Tab
          value="variables"
          label={
            <Typography fontWeight={600}>Variables</Typography>
          }
        />
      </Tabs>

      
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Process</InputLabel>
              <Select
                value={processFilter}
                onChange={(e) => setProcessFilter(e.target.value)}
                label="Process"
              >
                {processOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Visibility</InputLabel>
              <Select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                label="Visibility"
              >
                {visibilityOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
                fullWidth={isMobile}
                sx={{ borderRadius: 2 }}
              >
                Clear Filters
              </Button>
              {isMobile && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(90deg, #ff6a3d, #ff9c5a)',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  New
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      
      <Grid container spacing={3}>
        
        <Grid item xs={12} md={5} lg={4}>
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <React.Fragment key={template.id}>
                    <ListItem
                      button
                      selected={selectedTemplate?.id === template.id}
                      onClick={() => setSelectedTemplate(template)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.action.selected,
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography fontWeight={600} sx={{ mr: 1 }}>
                              {template.title}
                            </Typography>
                            {template.status === 'draft' && (
                              <Chip
                                label="Draft"
                                size="small"
                                color="warning"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Box component="span" display="block">
                              Process: {template.process}
                            </Box>
                            <Box component="span" display="block" fontSize="0.75rem">
                              Updated: {new Date(template.lastUpdated).toLocaleDateString()}
                            </Box>
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              ) : (
                <Box p={3} textAlign="center">
                  <Typography color="text.secondary">
                    No templates found matching your criteria
                  </Typography>
                  <Button
                    onClick={clearFilters}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Clear filters
                  </Button>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        
        <Grid item xs={12} md={7} lg={8}>
          {selectedTemplate ? (
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  {selectedTemplate.title}
                </Typography>
                <Box>
                  <Tooltip title="Edit">
                    <IconButton sx={{ color: theme.palette.primary.main }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Duplicate">
                    <IconButton sx={{ color: theme.palette.info.main }}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton sx={{ color: theme.palette.error.main }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 2,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace'
                }}
              >
                {selectedTemplate.content}
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Template Details
                  </Typography>
                  <Box mt={1}>
                    <Typography variant="body2">
                      <strong>Created By:</strong> {selectedTemplate.createdBy}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Process:</strong> {selectedTemplate.process}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Visibility:</strong> {selectedTemplate.visibility}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Updated:</strong> {new Date(selectedTemplate.lastUpdated).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong>
                      <Chip
                        label={selectedTemplate.status}
                        size="small"
                        color={
                          selectedTemplate.status === 'active' ? 'success' :
                            selectedTemplate.status === 'draft' ? 'warning' : 'default'
                        }
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Available Variables
                  </Typography>
                  <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                    {selectedTemplate.variables.map((variable) => (
                      <Chip
                        key={variable}
                        label={`{${variable}}`}
                        size="small"
                        color="primary"
                        sx={{
                          fontFamily: 'monospace',
                          backgroundColor: theme.palette.primary.light,
                          color: theme.palette.primary.dark
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
                <Button variant="outlined" sx={{ borderRadius: 2 }}>
                  Test Template
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(90deg, #ff6a3d, #ff9c5a)',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Send Sample
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={1}
              sx={{
                p: 3,
                height: '70vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <img
                src="https://cdni.iconscout.com/illustration/premium/thumb/document-not-found-4068214-3363925.png"
                alt="no-template-selected"
                style={{ height: isMobile ? 120 : 150, opacity: 0.7 }}
              />
              <Typography variant="body1" color="text.secondary" mt={2}>
                Select a template to view details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                or create a new template using the button above
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default WhatsAppTemplate;