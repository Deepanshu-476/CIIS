import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Chip,
  Avatar,
  Button,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  FilterList as FilterListIcon,
  SortByAlpha as SortByAlphaIcon,
  InfoOutlined as InfoOutlinedIcon,
  Add,
  Refresh,
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage,
} from '@mui/icons-material';

function Customers() {
  const theme = useTheme();

  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  
  const totalCount = 5886;

  
  const customers = [
    
  ];

  
  const pagedCustomers = Array.from({ length: rowsPerPage }, (_, i) => {
    const base = customers[i % customers.length];
    return {
      ...base,
      id: page * rowsPerPage + i + 1,
    };
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState('Select Status');

  const tabs = ['Overall', 'Last 30 Days', 'Select Range'];
  const statusOptions = ['Select Status', 'Active', 'Inactive', 'Pending', 'Converted'];

  const statusColors = {
    'Not contacted': 'default',
    'Not interested': 'error',
    'Appointment': 'success',
  };

  return (
    <Box p={3}>
      
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {totalCount.toLocaleString()} Customers
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Manage your customer relationships
            </Typography>
            <Tooltip title="Customer information">
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          sx={{ borderRadius: 2 }}
        >
          Add Customer
        </Button>
      </Box>

      
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          
          <Box flexGrow={1} minWidth={300}>
            <TextField
              fullWidth
              placeholder="Search by name, phone, or company"
              size="small"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">Status:</Typography>
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Box>

          
          <Box display="flex" gap={1}>
            <Tooltip title="Filter">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sort">
              <IconButton>
                <SortByAlphaIcon />
              </IconButton>
            </Tooltip>
            
          </Box>
        </Box>

        
        <Box mt={2}>
          <Tabs
            value={activeTab}
            onChange={(e, newVal) => setActiveTab(newVal)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab key={tab} label={tab} />
            ))}
          </Tabs>
        </Box>
      </Paper>

      
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.grey[50] }}>
            <TableRow>
              <TableCell width={60}></TableCell>
              <TableCell><Typography variant="subtitle2">Name</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Created By</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Created On</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Company</Typography></TableCell>
              <TableCell width={40}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedCustomers.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{ '&:last-child td': { borderBottom: 0 } }}
              >
                <TableCell>
                  <Avatar
                    sx={{
                      bgcolor: item.color,
                      width: 36,
                      height: 36,
                      fontSize: 16,
                      fontWeight: 600
                    }}
                  >
                    {item.badge}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    color={statusColors[item.status] || 'default'}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: theme.palette.grey[300],
                      backgroundColor: theme.palette.grey[50],
                      color: theme.palette.text.primary
                    }}
                  />
                </TableCell>
                <TableCell>{item.createdBy}</TableCell>
                <TableCell>{item.createdOn}</TableCell>
                <TableCell>{item.company}</TableCell>
                <TableCell>
                  <Tooltip title="Call customer">
                    <IconButton size="small">
                      <PhoneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.grey[50]
          }}
          ActionsComponent={({ count, page, rowsPerPage, onPageChange }) => (
            <Box sx={{ flexShrink: 0, ml: 2 }}>
              <IconButton
                onClick={() => onPageChange(null, 0)}
                disabled={page === 0}
                aria-label="first page"
              >
                <FirstPage />
              </IconButton>
              <IconButton
                onClick={() => onPageChange(null, page - 1)}
                disabled={page === 0}
                aria-label="previous page"
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={() => onPageChange(null, page + 1)}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
              >
                <ChevronRight />
              </IconButton>
              <IconButton
                onClick={() => onPageChange(null, Math.max(0, Math.ceil(count / rowsPerPage) - 1))}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
              >
                <LastPage />
              </IconButton>
            </Box>
          )}
        />
      </Paper>
    </Box>
  );
}

export default Customers;