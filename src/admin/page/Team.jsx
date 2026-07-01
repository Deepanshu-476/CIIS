import React, { useState } from 'react';
import {
  Box, Button, Tabs, Tab, Typography, Avatar, TextField, MenuItem,
  IconButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper,
  useMediaQuery, Menu
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search, PersonAdd, ArrowUpward, ArrowDownward, ContactPage,
  MoreVert, Edit, Delete
} from '@mui/icons-material';

const users = [
  {
    name: 'Ashutosh Rai',
    role: 'Admin',
    phone: '+919056766266',
    email: 'Careerinfowisitsolutions@gmail.com',
    reportsTo: '--',
    createdOn: '2023-10-01'
  }
];

const MoreMenu = ({ user }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    void 0;
    handleClose();
  };

  const handleDelete = () => {
    void 0;
    handleClose();
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick}>
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </>
  );
};

const Team = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box p={2}>
      
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="subtitle1">
          <strong>1 out of 1 User</strong>
        </Typography>

        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={2} alignItems="center" flexGrow={1}>
          <TextField
            variant="outlined"
            placeholder="Search by Name/Phone"
            size="small"
            InputProps={{
              startAdornment: <Search sx={{ mr: 1 }} />
            }}
            sx={{ flex: 1 }}
          />
          <TextField select size="small" label="Process" sx={{ minWidth: 150 }}>
            <MenuItem value="All">All Process</MenuItem>
          </TextField>
          <TextField select size="small" label="Role" sx={{ minWidth: 150 }}>
            <MenuItem value="All">All Roles</MenuItem>
          </TextField>
          <Button variant="contained" startIcon={<PersonAdd />} sx={{ bgcolor: "#ff7a59" }}>
            Add User
          </Button>
        </Box>

        <Box display="flex" gap={1} mt={isMobile ? 2 : 0}>
          <IconButton><ArrowUpward /></IconButton>
          <IconButton><ArrowDownward /></IconButton>
          <IconButton><ContactPage /></IconButton>
        </Box>
      </Box>

      
      <Tabs value={0} textColor="primary" indicatorColor="primary">
        <Tab label="Active Users (1)" />
        <Tab label="Invite Pending (0)" />
      </Tabs>

      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Phone Number</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Reports to</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Created On</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: "#4caf50" }}>{user.name[0]}</Avatar>
                    <Box>
                      <Typography variant="subtitle2">{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.role}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.reportsTo}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.createdOn}</TableCell>
                <TableCell>
                  <MoreMenu user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Team;
