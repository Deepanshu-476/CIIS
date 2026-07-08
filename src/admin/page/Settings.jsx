import React, { useState, useEffect } from 'react';
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
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { toast, ToastContainer } from 'react-toastify';
import axios from '../../utils/axiosConfig';

function Settings() {
  const [limitAssignTo, setLimitAssignTo] = useState(true);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  
  // Super Admin specific state variables
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const [dashboardConfig, setDashboardConfig] = useState([
    { componentId: 'header', componentName: 'Welcome Header', isEnabled: true, sortOrder: 1 },
    { componentId: 'clock-in', componentName: 'Attendance Timer & Clock In', isEnabled: true, sortOrder: 2, settings: { attendanceMode: 'normal' } },
    { componentId: 'stats', componentName: 'Monthly Stats Grid', isEnabled: true, sortOrder: 3 },
    { componentId: 'calendar', componentName: 'Attendance Calendar Grid', isEnabled: true, sortOrder: 4 },
    { componentId: 'activity', componentName: 'Recent Activity Timeline', isEnabled: true, sortOrder: 5 }
  ]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/company', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetched = response.data?.companies || response.data?.data || [];
      setCompanies(fetched);
    } catch (err) {
      console.error("Failed to load companies:", err);
      toast.error("Failed to load companies list");
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchDashboardConfig = async (companyId) => {
    if (!companyId) return;

    setLoadingConfig(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/company/${companyId}/dashboard-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.dashboardConfig && response.data.dashboardConfig.length > 0) {
        setDashboardConfig(response.data.dashboardConfig);
      } else {
        // Fallback default config
        setDashboardConfig([
          { componentId: 'header', componentName: 'Welcome Header', isEnabled: true, sortOrder: 1 },
          { componentId: 'clock-in', componentName: 'Attendance Timer & Clock In', isEnabled: true, sortOrder: 2, settings: { attendanceMode: 'normal' } },
          { componentId: 'stats', componentName: 'Monthly Stats Grid', isEnabled: true, sortOrder: 3 },
          { componentId: 'calendar', componentName: 'Attendance Calendar Grid', isEnabled: true, sortOrder: 4 },
          { componentId: 'activity', componentName: 'Recent Activity Timeline', isEnabled: true, sortOrder: 5 }
        ]);
      }
    } catch (err) {
      console.error("Failed to load dashboard config:", err);
      // Set default fallback config on error
      setDashboardConfig([
        { componentId: 'header', componentName: 'Welcome Header', isEnabled: true, sortOrder: 1 },
        { componentId: 'clock-in', componentName: 'Attendance Timer & Clock In', isEnabled: true, sortOrder: 2, settings: { attendanceMode: 'normal' } },
        { componentId: 'stats', componentName: 'Monthly Stats Grid', isEnabled: true, sortOrder: 3 },
        { componentId: 'calendar', componentName: 'Attendance Calendar Grid', isEnabled: true, sortOrder: 4 },
        { componentId: 'activity', componentName: 'Recent Activity Timeline', isEnabled: true, sortOrder: 5 }
      ]);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCompanyChange = (event) => {
    const companyId = event.target.value;
    setSelectedCompanyId(companyId);
    fetchDashboardConfig(companyId);
  };

  const handleToggleComponent = (index) => {
    const updated = [...dashboardConfig];
    updated[index].isEnabled = !updated[index].isEnabled;
    setDashboardConfig(updated);
  };

  const handleOrderChange = (index, value) => {
    const updated = [...dashboardConfig];
    updated[index].sortOrder = Number(value) || 0;
    setDashboardConfig(updated);
  };

  const handleAttendanceModeChange = (index, mode) => {
    const updated = [...dashboardConfig];
    if (!updated[index].settings) {
      updated[index].settings = {};
    }
    updated[index].settings.attendanceMode = mode;
    setDashboardConfig(updated);
  };

  const saveDashboardConfig = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first");
      return;
    }

    setSavingConfig(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/company/${selectedCompanyId}/dashboard-config`, {
        dashboardConfig
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Dashboard configuration saved successfully for the company!");
      } else {
        toast.error("Failed to save dashboard configuration");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save dashboard configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" pauseOnHover />
      
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Super Admin Settings
      </Typography>

      <Box sx={{ bgcolor: '#f7f9fc', p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Company Selector */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Select Company to Configure
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Company</InputLabel>
            <Select
              value={selectedCompanyId}
              label="Company"
              onChange={handleCompanyChange}
              disabled={loadingCompanies}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {companies.map(company => (
                <MenuItem key={company._id} value={company._id}>
                  {company.companyName} ({company.companyCode})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Dashboard Configuration Settings Accordion */}
        <Accordion defaultExpanded disabled={!selectedCompanyId}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">
              {!selectedCompanyId ? "Dashboard Config (Select Company First)" : "Dashboard Customizer & Attendance Mode"}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Typography variant="body2" color="text.secondary">
                Configure which widgets are shown on the employee dashboard, in what order they are sorted, and choose the verification type for attendance clock-ins.
              </Typography>

              {loadingConfig ? (
                <Typography variant="body2">Loading configurations...</Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {dashboardConfig.map((comp, idx) => (
                    <Box 
                      key={comp.componentId} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        bgcolor: comp.isEnabled ? '#fff' : '#f0f0f0'
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Switch
                            checked={comp.isEnabled}
                            onChange={() => handleToggleComponent(idx)}
                          />
                          <Typography fontWeight="bold" color={comp.isEnabled ? 'text.primary' : 'text.secondary'}>
                            {comp.componentName}
                          </Typography>
                        </Box>
                        <TextField
                          type="number"
                          label="Sort Order"
                          size="small"
                          sx={{ width: 100 }}
                          value={comp.sortOrder}
                          onChange={(e) => handleOrderChange(idx, e.target.value)}
                          disabled={!comp.isEnabled}
                        />
                      </Box>

                      {comp.componentId === 'clock-in' && comp.isEnabled && (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Attendance Verification Mode</InputLabel>
                          <Select
                            value={comp.settings?.attendanceMode || 'normal'}
                            label="Attendance Verification Mode"
                            onChange={(e) => handleAttendanceModeChange(idx, e.target.value)}
                          >
                            <MenuItem value="normal">Normal clock-in (No validation)</MenuItem>
                            <MenuItem value="location">GPS Location Capture</MenuItem>
                            <MenuItem value="image">Camera Selfie Upload</MenuItem>
                            <MenuItem value="both">Both GPS Location & Camera Selfie</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  ))}

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={saveDashboardConfig}
                    disabled={savingConfig}
                    sx={{ mt: 2, textTransform: 'none' }}
                  >
                    {savingConfig ? 'Saving Configurations...' : 'Save Dashboard Settings'}
                  </Button>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Divider />

        {/* Reset Password Accordion */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">Reset Super Admin Password</Typography>
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

      </Box>
    </Box>
  );
}

export default Settings;
