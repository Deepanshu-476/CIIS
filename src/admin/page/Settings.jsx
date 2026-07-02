import React, { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  Button,
  InputAdornment,
  Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function Settings() {
  const [limitAssignTo, setLimitAssignTo] = useState(true);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Settings
      </Typography>

      <Box sx={{ bgcolor: '#f7f9fc', p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          General
        </Typography>

        
        <Box display="flex" alignItems="center" mb={1}>
          <Switch
            checked={limitAssignTo}
            onChange={() => setLimitAssignTo(!limitAssignTo)}
          />
          <Typography fontWeight={500}>
            Limit Assign To option in CRM
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          When enabled, only the direct reportees, colleagues, manager will be shown under Assign To option. When disabled, all the users under current process will be shown under Assign To option.
        </Typography>

        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">Reset Password</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                type={showOldPwd ? 'text' : 'password'}
                label="Old Password"
                required
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowOldPwd((prev) => !prev)}>
                        {showOldPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                type={showNewPwd ? 'text' : 'password'}
                label="New Password"
                required
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPwd((prev) => !prev)}>
                        {showNewPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" color="text.secondary">
                • Password must be 8-15 characters long. <br />
                • Include an uppercase character <br />
                • Include a number <br />
                • Include a special character
              </Typography>

              <TextField
                type="password"
                label="Confirm Password"
                required
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />

              <Button
                variant="contained"
                color="warning"
                sx={{ mt: 1, textTransform: 'none' }}
              >
                Reset Password
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">Delete Account</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold', color: '#f28b82', mb: 1 }}
            >
              Delete Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This account can’t be deleted. Please reach out to our support.{' '}
              <Link href="#" underline="hover" sx={{ fontWeight: 600, color: '#ff3d00' }}>
                Contact Support
              </Link>
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}

export default Settings;
