import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import axios from '../../utils/axiosConfig';
import { toast, ToastContainer } from 'react-toastify';

const defaultPlatform = {
  latestVersionName: '',
  latestVersionCode: 1,
  minimumVersionCode: 1,
  forceUpdate: false,
  updateEnabled: true,
  title: 'New Update Available',
  message: '',
  storeUrl: '',
  appIdentifier: '',
  storeId: ''
};

const defaultForm = {
  ios: {
    ...defaultPlatform,
    latestVersionName: '1.1.15',
    appIdentifier: 'ciisnetwork.in',
    storeId: '6780872642'
  },
  android: {
    ...defaultPlatform,
    latestVersionName: '1.1.16',
    appIdentifier: 'ciisnetwork.in'
  }
};

const numberFields = new Set(['latestVersionCode', 'minimumVersionCode']);

const platformCopy = {
  ios: {
    title: 'Apple / iOS',
    icon: <AppleIcon />,
    latestLabel: 'Latest Build Number',
    minimumLabel: 'Minimum Build Number',
    identifierLabel: 'Bundle ID',
    storeIdLabel: 'App Store ID',
    storeUrlLabel: 'App Store URL',
    help: 'The iPhone app reads this configuration. To disable the popup, keep the Latest Build at or below the current app build.'
  },
  android: {
    title: 'Android',
    icon: <AndroidIcon />,
    latestLabel: 'Latest Version Code',
    minimumLabel: 'Minimum Version Code',
    identifierLabel: 'Package Name',
    storeIdLabel: 'Store ID',
    storeUrlLabel: 'Play Store URL',
    help: 'The Android app compares versionCode values. For a mandatory update, increase the Minimum Version Code or turn Force Update on.'
  }
};

const normalizeSettings = (settings = {}) => ({
  ios: { ...defaultForm.ios, ...(settings.ios || {}) },
  android: { ...defaultForm.android, ...(settings.android || {}) }
});

const VersionStatus = ({ platform, data }) => {
  const copy = platformCopy[platform];
  const isForced = data.forceUpdate === true;
  const isEnabled = data.updateEnabled !== false;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip
        size="small"
        color={isEnabled ? 'primary' : 'default'}
        label={isEnabled ? 'Popup ON' : 'Popup OFF'}
      />
      <Chip
        size="small"
        color={isForced ? 'error' : 'success'}
        label={isForced ? 'Force update ON' : 'Force update OFF'}
      />
      <Chip size="small" variant="outlined" label={`Latest: ${data.latestVersionName || data.latestVersionCode}`} />
      <Chip size="small" variant="outlined" label={`${copy.minimumLabel}: ${data.minimumVersionCode}`} />
    </Stack>
  );
};

const PlatformCard = ({ platform, value, onChange }) => {
  const copy = platformCopy[platform];

  const updateField = (field, nextValue) => {
    onChange(platform, {
      ...value,
      [field]: numberFields.has(field) ? Number(nextValue || 0) : nextValue
    });
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#eff6ff', color: '#1d4ed8', display: 'grid', placeItems: 'center' }}>
              {copy.icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>{copy.title}</Typography>
              <Typography variant="body2" color="text.secondary">{copy.help}</Typography>
            </Box>
          </Stack>
          <VersionStatus platform={platform} data={value} />
        </Stack>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
          <TextField
            label="Latest Version Name"
            value={value.latestVersionName}
            onChange={(event) => updateField('latestVersionName', event.target.value)}
            size="small"
          />
          <TextField
            label={copy.latestLabel}
            value={value.latestVersionCode}
            onChange={(event) => updateField('latestVersionCode', event.target.value)}
            type="number"
            size="small"
            inputProps={{ min: 0 }}
          />
          <TextField
            label={copy.minimumLabel}
            value={value.minimumVersionCode}
            onChange={(event) => updateField('minimumVersionCode', event.target.value)}
            type="number"
            size="small"
            inputProps={{ min: 0 }}
          />
          <TextField
            label={copy.identifierLabel}
            value={value.appIdentifier}
            onChange={(event) => updateField('appIdentifier', event.target.value)}
            size="small"
          />
          <TextField
            label={copy.storeIdLabel}
            value={value.storeId}
            onChange={(event) => updateField('storeId', event.target.value)}
            size="small"
            disabled={platform === 'android'}
          />
          <FormControlLabel
            sx={{ m: 0, alignSelf: 'center' }}
            control={
              <Switch
                checked={value.updateEnabled !== false}
                onChange={(event) => updateField('updateEnabled', event.target.checked)}
              />
            }
            label="Popup Enabled"
          />
          <FormControlLabel
            sx={{ m: 0, alignSelf: 'center' }}
            control={
              <Switch
                checked={value.forceUpdate === true}
                onChange={(event) => updateField('forceUpdate', event.target.checked)}
              />
            }
            label="Force Update"
          />
        </Box>

        <TextField
          label="Popup Title"
          value={value.title}
          onChange={(event) => updateField('title', event.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          label="Popup Message"
          value={value.message}
          onChange={(event) => updateField('message', event.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label={copy.storeUrlLabel}
          value={value.storeUrl}
          onChange={(event) => updateField('storeUrl', event.target.value)}
          size="small"
          fullWidth
        />
      </Stack>
    </Paper>
  );
};

function AppVersionControl() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const lastUpdatedLabel = useMemo(() => {
    if (!updatedAt) return 'Not saved yet';
    return new Date(updatedAt).toLocaleString();
  }, [updatedAt]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/app-version/admin', { noCache: true });
      const settings = response.data?.settings || {};
      setForm(normalizeSettings(settings));
      setUpdatedAt(settings.updatedAt || null);
    } catch (error) {
      console.error('App version settings load failed:', error);
      toast.error(error.response?.data?.message || 'Failed to load app version settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updatePlatform = (platform, nextValue) => {
    setForm(prev => ({ ...prev, [platform]: nextValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put('/app-version/admin', form);
      const settings = response.data?.settings || {};
      setForm(normalizeSettings(settings));
      setUpdatedAt(settings.updatedAt || new Date().toISOString());
      toast.success(response.data?.message || 'App version settings saved');
    } catch (error) {
      console.error('App version settings save failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save app version settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1180, mx: 'auto' }}>
      <ToastContainer position="top-right" autoClose={2500} />
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <SystemUpdateAltIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900}>App Version Control</Typography>
              <Typography variant="body2" color="text.secondary">Backend control for Apple and Android app update popups.</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSettings} disabled={loading || saving}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Stack>
        </Stack>

        {(loading || saving) && <LinearProgress />}

        <Alert severity="info">
          When Popup Enabled is turned off, the update popup will be completely disabled for that platform. Force Update only makes the popup mandatory.
        </Alert>

        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Last updated: {lastUpdatedLabel}</Typography>
            <VersionStatus platform="ios" data={form.ios} />
          </Stack>
        </Paper>

        <PlatformCard platform="ios" value={form.ios} onChange={updatePlatform} />
        <PlatformCard platform="android" value={form.android} onChange={updatePlatform} />
      </Stack>
    </Box>
  );
}

export default AppVersionControl;
