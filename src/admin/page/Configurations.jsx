import React, { useState } from 'react';
import {
  Typography,
  Switch,
  TextField,
  Chip,
  Box,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function Configurations() {
  
  const [assignedUsers, setAssignedUsers] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [daysBefore, setDaysBefore] = useState(1);

  
  const [trackInternal, setTrackInternal] = useState(true);
  const [ignoreUnknown, setIgnoreUnknown] = useState(false);

  
  const handleAddEmail = () => {
    if (emailInput && !emailList.includes(emailInput)) {
      setEmailList([...emailList, emailInput]);
      setEmailInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddEmail();
    }
  };

  const handleDeleteEmail = (email) => {
    setEmailList(emailList.filter((e) => e !== email));
  };

  const handleDaysChange = (increment) => {
    setDaysBefore((prev) => Math.max(1, prev + increment));
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', p: 2 }}>
      
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Auto Dial</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2">You can configure recurring follow-ups and notifications here.</Typography>
        </AccordionDetails>
      </Accordion>

      
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">SIM Call Track</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box my={2}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography flex={1}>Track Internal Calls</Typography>
              <Switch
                checked={trackInternal}
                onChange={() => setTrackInternal(!trackInternal)}
                color="primary"
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Note: By disabling this CIIS Network will stop tracking internal team calls.
            </Typography>
          </Box>

          <Box my={2}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography flex={1}>Ignore Unknown Calls</Typography>
              <Switch
                checked={ignoreUnknown}
                onChange={() => setIgnoreUnknown(!ignoreUnknown)}
                color="primary"
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Note: By enabling this  CIIS Network will stop tracking unknown calls.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Configure Recurring Followup</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" alignItems="center" my={1}>
            <Typography flex={1}>Assigned Users</Typography>
            <Switch
              checked={assignedUsers}
              onChange={() => setAssignedUsers(!assignedUsers)}
            />
          </Box>

          <Box display="flex" alignItems="center" my={1}>
            <Typography flex={1}>Admin</Typography>
            <Switch checked={admin} onChange={() => setAdmin(!admin)} />
          </Box>

          <Box my={2}>
            <Typography variant="body1" gutterBottom>
              Add email Ids
            </Typography>
            <TextField
              fullWidth
              placeholder="Type Email id"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleKeyPress}
              variant="outlined"
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              Press Enter to add an email Id
            </Typography>
            <Box mt={1} display="flex" gap={1} flexWrap="wrap">
              {emailList.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleDeleteEmail(email)}
                />
              ))}
            </Box>
          </Box>

          <Box my={2}>
            <Typography variant="body1">Notify before (in days)</Typography>
            <Typography variant="caption" color="text.secondary">
              You will receive an email prior to the event based on the no of days you choose
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <IconButton onClick={() => handleDaysChange(-1)}>
                <RemoveIcon />
              </IconButton>
              <Typography variant="h6" mx={2}>
                {daysBefore}
              </Typography>
              <IconButton onClick={() => handleDaysChange(1)}>
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default Configurations;
