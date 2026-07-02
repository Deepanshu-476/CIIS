import React, { useState } from 'react';
import {
  Box, Typography, MenuItem, Menu, Button, Checkbox, ListItemText,
  IconButton, Chip, Paper, useTheme, Modal, TextField
} from '@mui/material';
import {
  FilterList, ArrowBackIos, ArrowForwardIos,
  Person, Business, AccessTime, Phone
} from '@mui/icons-material';
import dayjs from 'dayjs';


const followUps = {
  '2025-07-14': [{
    name: '9988003622',
    time: '12:30 AM',
    status: 'Not contacted',
    assignedBy: 'Ashutosh Rai',
    assignTo: 'Ashutosh Rai',
  }],
  '2025-08-03': [{
    name: 'Customer X',
    time: '02:00 PM',
    status: 'Cold Followup',
    assignedBy: 'Ashutosh Rai',
    assignTo: 'Ashutosh Rai',
  }],
};

const statuses = [
  'Hot Followup', 'Sales Closed', 'Cold Followup',
  'Appointment Fixed', 'Not contacted', 'Not interested', 'Others'
];

export default function Calendar() {
  const theme = useTheme();

  
  const userName = localStorage.getItem("userName") || "User";

  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const openStatusMenu = (e) => setStatusAnchorEl(e.currentTarget);
  const closeStatusMenu = () => setStatusAnchorEl(null);

  const handleDayClick = (date) => setSelectedDate(date);

  const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));

  const todayFollowUps = followUps[selectedDate.format('YYYY-MM-DD')] || [];

  const renderCalendar = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day();
    const totalDays = endOfMonth.date();

    const weeks = [];
    let days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ width: 48, m: 0.5 }} />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = startOfMonth.date(day);
      const dayKey = date.format('YYYY-MM-DD');
      const isSelected = selectedDate.isSame(date, 'day');
      const hasFollowup = followUps[dayKey]?.length;

      days.push(
        <Box
          key={day}
          onClick={() => handleDayClick(date)}
          sx={{
            p: 1.2,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isSelected
              ? theme.palette.primary.main
              : theme.palette.background.paper,
            color: isSelected
              ? theme.palette.common.white
              : theme.palette.text.primary,
            borderRadius: 2,
            m: 0.5,
            width: 48,
            boxShadow: isSelected ? theme.shadows[3] : 'none'
          }}
        >
          <Typography fontSize={14}>{day}</Typography>
          {hasFollowup && (
            <Chip
              label={`• ${followUps[dayKey].length}`}
              size="small"
              sx={{ mt: 0.5, fontSize: 10 }}
            />
          )}
        </Box>
      );

      if ((days.length % 7 === 0) || day === totalDays) {
        weeks.push(
          <Box key={`week-${day}`} sx={{ display: 'flex', justifyContent: 'center' }}>
            {days}
          </Box>
        );
        days = [];
      }
    }

    return weeks;
  };

  return (
    <Box p={3} display="flex" gap={3} sx={{ backgroundColor: theme.palette.background.default }}>
      
      <Box flex={1}>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">Hi, {userName} 👋</Typography>
          <Box display="flex" gap={2}>
            <Button variant="outlined" color="primary">Action 1</Button>
            <Button variant="outlined" color="secondary">Action 2</Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>Follow-up Calendar</Typography>
          <Button variant="outlined" onClick={openStatusMenu} startIcon={<FilterList />}>
            Select Status
          </Button>
        </Box>

        <Menu open={Boolean(statusAnchorEl)} onClose={closeStatusMenu} anchorEl={statusAnchorEl}>
          {statuses.map(status => (
            <MenuItem key={status} onClick={() => toggleStatus(status)}>
              <Checkbox checked={selectedStatuses.includes(status)} />
              <ListItemText primary={status} />
            </MenuItem>
          ))}
          <Box textAlign="center" my={1}>
            <Button variant="contained" onClick={closeStatusMenu}>OK</Button>
          </Box>
        </Menu>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={1}>
          <Typography variant="h5" fontWeight={700}>
            {currentMonth.format('MMMM YYYY')}
          </Typography>
          <Box>
            <IconButton onClick={handlePrevMonth}><ArrowBackIos fontSize="small" /></IconButton>
            <IconButton onClick={handleNextMonth}><ArrowForwardIos fontSize="small" /></IconButton>
          </Box>
        </Box>

        <Typography variant="body2" mb={1}>Click on a date to view follow-ups</Typography>

        <Box display="flex" justifyContent="center" mb={1}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Box
              key={day}
              sx={{
                width: 48,
                textAlign: 'center',
                fontWeight: 600,
                color: theme.palette.text.secondary
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {renderCalendar()}
      </Box>

      
      <Box flex={1.3}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          <Box component="span" sx={{ color: theme.palette.primary.main }}>
            Quick Look
          </Box> - {selectedDate.format('DD MMM YYYY')}
        </Typography>

        {todayFollowUps.length > 0 ? todayFollowUps.map((entry, idx) => (
          <Paper
            key={idx}
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              borderRadius: 2,
              mb: 2
            }}
          >
            <Box>
              <Typography fontWeight={700}>{entry.name}</Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                <Chip label={entry.status} color="primary" size="small" />
                <Chip icon={<Person fontSize="small" />} label={entry.assignedBy} size="small" />
                <Chip icon={<Business fontSize="small" />} label={entry.assignTo} size="small" />
                <Chip icon={<AccessTime fontSize="small" />} label={entry.time} size="small" />
              </Box>
            </Box>
            <IconButton color="error"><Phone /></IconButton>
          </Paper>
        )) : (
          <Typography color="text.secondary" mb={2}>No follow-ups on this date</Typography>
        )}

        
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => alert(`Showing summary for ${selectedDate.format("DD MMM YYYY")}`)}
          >
            Day Summary
          </Button>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={() => setLeaveModalOpen(true)}
          >
            Apply for Leave
          </Button>
        </Box>
      </Box>

      
      <Modal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400, bgcolor: 'background.paper',
          boxShadow: 24, p: 4, borderRadius: 2
        }}>
          <Typography variant="h6" mb={2}>Apply for Leave</Typography>
          <TextField
            label="Selected Date"
            fullWidth
            value={selectedDate.format('YYYY-MM-DD')}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            label="Reason for Leave"
            fullWidth
            multiline
            rows={3}
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={() => setLeaveModalOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                alert(`Leave applied for ${selectedDate.format('YYYY-MM-DD')}.\nReason: ${leaveReason}`);
                setLeaveModalOpen(false);
                setLeaveReason('');
              }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
