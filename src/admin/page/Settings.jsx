import React, { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Chip,
  Paper,
  Stack,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BusinessIcon from '@mui/icons-material/Business';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import LockResetIcon from '@mui/icons-material/LockReset';
import SaveIcon from '@mui/icons-material/Save';
import TuneIcon from '@mui/icons-material/Tune';
import ShieldIcon from '@mui/icons-material/Shield';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { toast, ToastContainer } from 'react-toastify';
import axios from '../../utils/axiosConfig';

const DEFAULT_DASHBOARD_CONFIG = [
  { componentId: 'header', componentName: 'Welcome Header', isEnabled: true, sortOrder: 1 },
  { componentId: 'clock-in', componentName: 'Attendance Timer & Clock In', isEnabled: true, sortOrder: 2, settings: { attendanceMode: 'normal' } },
  { componentId: 'stats', componentName: 'Monthly Stats Grid', isEnabled: true, sortOrder: 3 },
  { componentId: 'calendar', componentName: 'Attendance Calendar Grid', isEnabled: true, sortOrder: 4 },
  { componentId: 'activity', componentName: 'Recent Activity Timeline', isEnabled: true, sortOrder: 5 }
];

const getDefaultDashboardConfig = () => DEFAULT_DASHBOARD_CONFIG.map(item => ({
  ...item,
  settings: item.settings ? { ...item.settings } : undefined
}));

const getStoredJson = key => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getEntityId = value => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || '';
  return value;
};

const getCurrentCompanyFromStorage = () => {
  const storedCompany = getStoredJson('company') || getStoredJson('companyDetails');
  const storedUser = getStoredJson('user') || getStoredJson('superAdmin');

  const companyId = getEntityId(storedCompany) || getEntityId(storedUser?.company) || storedUser?.companyId || '';

  if (!companyId) return null;

  return {
    _id: companyId,
    companyName: storedCompany?.companyName || storedUser?.companyName || 'Your Company',
    companyCode: storedCompany?.companyCode || storedUser?.companyCode || '',
    companyEmail: storedCompany?.companyEmail || storedUser?.companyEmail || ''
  };
};

function Settings() {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [dashboardConfig, setDashboardConfig] = useState(getDefaultDashboardConfig);
  const [locationForm, setLocationForm] = useState({
    latitude: '',
    longitude: '',
    allowedRadiusMeters: 100,
    allowedRadiusEnabled: true
  });
  const [savingLocation, setSavingLocation] = useState(false);

  const activeCompanyId = currentCompany?._id || '';
  const selectedBranch = branches.find(branch => getEntityId(branch) === selectedBranchId) || null;
  const activeSettingsId = selectedBranchId;
  const enabledDashboardCount = dashboardConfig.filter(item => item.isEnabled).length;
  const attendanceMode = dashboardConfig.find(item => item.componentId === 'clock-in')?.settings?.attendanceMode || 'normal';
  const hasCompanyLocation = locationForm.latitude !== '' && locationForm.longitude !== '';
  const companyLabel = useMemo(() => {
    if (!currentCompany) return 'Company not found';
    return currentCompany.companyCode
      ? `${currentCompany.companyName} (${currentCompany.companyCode})`
      : currentCompany.companyName;
  }, [currentCompany]);

  const branchLabel = selectedBranch
    ? selectedBranch.branchCode
      ? `${selectedBranch.name} (${selectedBranch.branchCode})`
      : selectedBranch.name
    : 'Select branch';

  const fetchBranchSettings = async (branchId) => {
    if (!branchId) {
      setDashboardConfig(getDefaultDashboardConfig());
      syncLocationForm(null);
      return;
    }
    setLoadingConfig(true);
    try {
      const response = await axios.get(`/branches/${branchId}`);
      const branch = response.data?.branch;

      if (Array.isArray(branch?.dashboardConfig) && branch.dashboardConfig.length > 0) {
        setDashboardConfig(branch.dashboardConfig);
      } else {
        setDashboardConfig(getDefaultDashboardConfig());
      }
      syncLocationForm(branch?.officeLocation);
    } catch (err) {
      console.error("Failed to load branch settings:", err);
      toast.error(err.response?.data?.message || "Failed to load branch settings");
      setDashboardConfig(getDefaultDashboardConfig());
      syncLocationForm(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  const syncLocationForm = (officeLocation) => {
    setLocationForm({
      latitude: officeLocation?.latitude ?? '',
      longitude: officeLocation?.longitude ?? '',
      allowedRadiusMeters: officeLocation?.allowedRadiusMeters ?? 100,
      allowedRadiusEnabled: officeLocation?.allowedRadiusEnabled !== false
    });
  };

  const fetchBranches = async (companyId) => {
    if (!companyId) return [];
    setLoadingBranches(true);
    try {
      const response = await axios.get(`/branches/company/${companyId}`);
      const nextBranches = response.data?.branches || [];
      setBranches(nextBranches);
      return nextBranches;
    } catch (err) {
      console.error("Could not load branches:", err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || "Failed to load branches");
      setBranches([]);
      return [];
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    const initializeCompanySettings = async () => {
      setLoadingCompany(true);
      const storedCompany = getCurrentCompanyFromStorage();

      if (!storedCompany?._id) {
        setCurrentCompany(null);
        setLoadingCompany(false);
        return;
      }

      let activeCompany = storedCompany;
      try {
        const response = await axios.get(`/company/${storedCompany._id}`);
        if (response.data?.company?._id) {
          activeCompany = response.data.company;
          localStorage.setItem('company', JSON.stringify(activeCompany));
          localStorage.setItem('companyDetails', JSON.stringify(activeCompany));
        }
      } catch (err) {
        console.warn("Could not refresh company details, using saved company data:", err.message);
      }

      setCurrentCompany(activeCompany);
      setLoadingCompany(false);
      const companyBranches = await fetchBranches(activeCompany._id);
      const initialBranch = companyBranches.find(branch => branch.isDefault && branch.isActive !== false) ||
        companyBranches.find(branch => branch.isActive !== false) ||
        companyBranches[0];

      if (initialBranch) {
        setSelectedBranchId(getEntityId(initialBranch));
      } else {
        setDashboardConfig(getDefaultDashboardConfig());
        syncLocationForm(null);
      }
    };

    initializeCompanySettings();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchSettings(selectedBranchId);
    }
  }, [selectedBranchId]);

  const handleToggleComponent = (index) => {
    setDashboardConfig(prev => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, isEnabled: !item.isEnabled } : item
    )));
  };

  const handleOrderChange = (index, value) => {
    setDashboardConfig(prev => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, sortOrder: Number(value) || 0 } : item
    )));
  };

  const handleAttendanceModeChange = (index, mode) => {
    setDashboardConfig(prev => prev.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, settings: { ...(item.settings || {}), attendanceMode: mode } }
        : item
    )));
  };

  const saveDashboardConfig = async () => {
    if (!activeSettingsId) {
      toast.error("Please select a branch first.");
      return;
    }

    setSavingConfig(true);
    try {
      const response = await axios.put(`/branches/${activeSettingsId}`, {
        dashboardConfig
      });

      if (response.data.success) {
        toast.success("Dashboard settings saved for selected branch.");
      } else {
        toast.error("Failed to save dashboard settings");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save dashboard settings");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleLocationChange = (field, value) => {
    setLocationForm(prev => ({ ...prev, [field]: value }));
  };

  const saveCompanyLocation = async () => {
    if (!activeSettingsId) {
      toast.error("Please select a branch first.");
      return;
    }

    const latitude = Number(locationForm.latitude);
    const longitude = Number(locationForm.longitude);
    const allowedRadiusMeters = Number(locationForm.allowedRadiusMeters);
    const allowedRadiusEnabled = locationForm.allowedRadiusEnabled !== false;

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      toast.error("Latitude must be between -90 and 90.");
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast.error("Longitude must be between -180 and 180.");
      return;
    }

    if (allowedRadiusEnabled && (!Number.isFinite(allowedRadiusMeters) || allowedRadiusMeters < 10 || allowedRadiusMeters > 10000)) {
      toast.error("Allowed radius must be between 10 and 10000 meters.");
      return;
    }

    setSavingLocation(true);
    try {
      const response = await axios.put(`/branches/${activeSettingsId}`, {
        officeLocation: {
          latitude,
          longitude,
          allowedRadiusMeters: allowedRadiusEnabled ? allowedRadiusMeters : null,
          allowedRadiusEnabled
        }
      });

      if (response.data.success) {
        const updatedLocation = response.data.branch?.officeLocation;
        syncLocationForm(updatedLocation);
        setBranches(prev => prev.map(branch => getEntityId(branch) === activeSettingsId
          ? { ...branch, officeLocation: updatedLocation }
          : branch
        ));
        toast.success("Branch location saved successfully.");
      } else {
        toast.error("Failed to save branch location");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save branch location");
    } finally {
      setSavingLocation(false);
    }
  };

  const settingCardSx = {
    border: '1px solid #e7edf6',
    borderRadius: 3,
    overflow: 'hidden',
    boxShadow: '0 20px 55px -42px rgba(15, 23, 42, 0.65)',
    '&:before': { display: 'none' },
    '&.Mui-expanded': { margin: 0 },
    '& .MuiAccordionSummary-root': {
      px: 3,
      py: 1.5,
      minHeight: 74,
      bgcolor: '#fff'
    },
    '& .MuiAccordionSummary-content': {
      margin: 0,
      alignItems: 'center'
    },
    '& .MuiAccordionDetails-root': {
      px: 3,
      pb: 3,
      pt: 0,
      bgcolor: '#fff'
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
        background:
          'linear-gradient(180deg, #f5f8ff 0%, #ffffff 42%, #f8fafc 100%)'
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} theme="colored" pauseOnHover />

      <Box sx={{ maxWidth: 1160, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 2.25, md: 3 },
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            color: '#fff',
            background: 'linear-gradient(135deg, #5865e8 0%, #7548b8 100%)',
            boxShadow: '0 28px 70px -42px rgba(74, 58, 180, 0.9)'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.2,
              background:
                'radial-gradient(circle at 85% 10%, #ffffff 0 110px, transparent 112px), radial-gradient(circle at 92% 72%, #ffffff 0 70px, transparent 72px)'
            }}
          />

          <Box sx={{ position: 'relative', display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.22)'
                }}
              >
                <BusinessIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 800, opacity: 0.88, mb: 0.5 }}>
                  Company Settings
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0, lineHeight: 1.15 }}>
                  {loadingCompany ? 'Loading company...' : companyLabel}
                </Typography>
                <Typography sx={{ mt: 1, fontSize: 14, opacity: 0.9 }}>
                  Manage dashboard visibility, attendance mode and office location for the selected branch.
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Chip
                icon={<DashboardCustomizeIcon />}
                label={`${enabledDashboardCount}/${dashboardConfig.length} widgets active`}
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  bgcolor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.22)'
                }}
              />
              <Chip
                icon={<ShieldIcon />}
                label={`Attendance: ${attendanceMode}`}
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  textTransform: 'capitalize',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.22)'
                }}
              />
              <Chip
                icon={<LocationOnIcon />}
                label={hasCompanyLocation ? 'Branch location added' : 'Branch location pending'}
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  bgcolor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.22)'
                }}
              />
            </Stack>
          </Box>
        </Paper>

        {!loadingCompany && !activeCompanyId && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            Company details were not found. Please login again from your company login URL.
          </Alert>
        )}

        {activeCompanyId && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 3,
              border: '1px solid #e7edf6',
              bgcolor: '#fff'
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
              <Box>
                <Typography fontWeight={900}>Branch Scope</Typography>
                <Typography variant="body2" color="text.secondary">
                  All settings below will load and save only for the selected branch.
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 320 } }}>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={selectedBranchId}
                  label="Branch"
                  onChange={(event) => setSelectedBranchId(event.target.value)}
                  disabled={loadingBranches || branches.length === 0}
                >
                  {branches.map(branch => (
                    <MenuItem key={getEntityId(branch)} value={getEntityId(branch)}>
                      {branch.branchCode ? `${branch.name} (${branch.branchCode})` : branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            {!loadingBranches && branches.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                No branches found for this company. Please create a branch first.
              </Alert>
            )}
            {selectedBranch && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                Currently editing settings for {branchLabel}.
              </Alert>
            )}
          </Paper>
        )}

        <Stack spacing={2.5}>
        <Accordion defaultExpanded disabled={!activeSettingsId} elevation={0} sx={settingCardSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#6757ec', bgcolor: '#f0efff' }}>
                <TuneIcon />
              </Box>
              <Box>
                <Typography fontWeight={900}>Dashboard Customizer & Attendance Mode</Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure employee dashboard widgets and clock-in verification.
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              {loadingConfig ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Loading dashboard configuration...
                  </Typography>
                  <LinearProgress sx={{ borderRadius: 999 }} />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {dashboardConfig.map((comp, idx) => (
                    <Box
                      key={comp.componentId}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: comp.isEnabled ? '#dde5f0' : '#eef2f7',
                        borderRadius: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        bgcolor: comp.isEnabled ? '#fff' : '#f8fafc',
                        boxShadow: comp.isEnabled ? '0 14px 34px -28px rgba(15, 23, 42, 0.6)' : 'none'
                      }}
                    >
                      <Box display="flex" alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Switch
                            checked={Boolean(comp.isEnabled)}
                            onChange={() => handleToggleComponent(idx)}
                          />
                          <Box>
                            <Typography fontWeight={900} color={comp.isEnabled ? 'text.primary' : 'text.secondary'}>
                              {comp.componentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {comp.isEnabled ? 'Visible on employee dashboard' : 'Hidden from employee dashboard'}
                            </Typography>
                          </Box>
                        </Box>
                        <TextField
                          type="number"
                          label="Sort Order"
                          size="small"
                          sx={{ width: 110 }}
                          value={comp.sortOrder}
                          onChange={(event) => handleOrderChange(idx, event.target.value)}
                          disabled={!comp.isEnabled}
                        />
                      </Box>

                      {comp.componentId === 'clock-in' && comp.isEnabled && (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Attendance Verification Mode</InputLabel>
                          <Select
                            value={comp.settings?.attendanceMode || 'normal'}
                            label="Attendance Verification Mode"
                            onChange={(event) => handleAttendanceModeChange(idx, event.target.value)}
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
                    startIcon={<SaveIcon />}
                    onClick={saveDashboardConfig}
                    disabled={savingConfig || loadingConfig || !activeSettingsId}
                    sx={{
                      mt: 1,
                      alignSelf: { xs: 'stretch', sm: 'flex-start' },
                      px: 3,
                      py: 1.2,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #5865e8 0%, #7548b8 100%)'
                    }}
                  >
                    {savingConfig ? 'Saving Settings...' : 'Save Dashboard Settings'}
                  </Button>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion disabled={!activeSettingsId} elevation={0} sx={settingCardSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#0f766e', bgcolor: '#ecfdf5' }}>
                <LocationOnIcon />
              </Box>
              <Box>
                <Typography fontWeight={900}>Branch Location</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add branch office coordinates and allowed attendance radius.
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={2.5}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Choose whether users must be inside the selected branch radius while clocking in.
              </Alert>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2
                }}
              >
                <TextField
                  type="number"
                  label="Latitude"
                  value={locationForm.latitude}
                  onChange={(event) => handleLocationChange('latitude', event.target.value)}
                  inputProps={{ min: -90, max: 90, step: 'any' }}
                  placeholder="Example: 28.6139"
                  fullWidth
                />
                <TextField
                  type="number"
                  label="Longitude"
                  value={locationForm.longitude}
                  onChange={(event) => handleLocationChange('longitude', event.target.value)}
                  inputProps={{ min: -180, max: 180, step: 'any' }}
                  placeholder="Example: 77.2090"
                  fullWidth
                />
              </Box>

              <FormControl>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Allowed Radius
                </Typography>
                <RadioGroup
                  row
                  value={locationForm.allowedRadiusEnabled ? 'yes' : 'no'}
                  onChange={(event) => handleLocationChange('allowedRadiusEnabled', event.target.value === 'yes')}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>

              {locationForm.allowedRadiusEnabled && (
                <TextField
                  type="number"
                  label="Allowed Radius (meters)"
                  value={locationForm.allowedRadiusMeters}
                  onChange={(event) => handleLocationChange('allowedRadiusMeters', event.target.value)}
                  inputProps={{ min: 10, max: 10000, step: 1 }}
                  placeholder="Example: 100"
                  sx={{ maxWidth: { xs: '100%', md: 360 } }}
                />
              )}

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveCompanyLocation}
                disabled={savingLocation || !activeSettingsId}
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)'
                }}
              >
                {savingLocation ? 'Saving Location...' : 'Save Branch Location'}
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion elevation={0} sx={settingCardSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#b45309', bgcolor: '#fff7ed' }}>
                <LockResetIcon />
              </Box>
              <Box>
                <Typography fontWeight={900}>Reset Password</Typography>
                <Typography variant="body2" color="text.secondary">
                  Update your account password with stronger security.
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                type={showOldPwd ? 'text' : 'password'}
                label="Old Password"
                required
                value={oldPwd}
                onChange={(event) => setOldPwd(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowOldPwd(prev => !prev)}>
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
                onChange={(event) => setNewPwd(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPwd(prev => !prev)}>
                        {showNewPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Password must be 8-15 characters long, include an uppercase character, a number, and a special character.
              </Typography>

              <TextField
                type="password"
                label="Confirm Password"
                required
                value={confirmPwd}
                onChange={(event) => setConfirmPwd(event.target.value)}
              />

              <Button
                variant="contained"
                color="warning"
                startIcon={<LockResetIcon />}
                sx={{
                  mt: 1,
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 900
                }}
              >
                Reset Password
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
        </Stack>
      </Box>
    </Box>
  );
}

export default Settings;
