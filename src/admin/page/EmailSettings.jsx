import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import axios from '../../utils/axiosConfig';
import { toast, ToastContainer } from 'react-toastify';

const defaultForm = {
  enabled: true,
  senderName: 'CIIS NETWORK',
  senderProfileLabel: 'Default Sender',
  activeSenderProfileId: 'default',
  createSenderProfile: false,
  emailUser: '',
  emailPass: '',
  emailHostType: 'simple',
  emailService: 'Gmail',
  emailHost: 'smtp.gmail.com',
  emailPort: 465,
  emailSecure: true,
  replyTo: '',
  moduleSettings: {},
  loginSettings: {
    companyLoginOtpEnabled: true,
    superAdminLoginOtpEnabled: true
  }
};

function EmailSettings() {
  const [form, setForm] = useState(defaultForm);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const emailModules = meta?.emailModules || [];
  const senderProfiles = meta?.senderProfiles || [];
  const selectedSenderProfile = senderProfiles.find(profile => profile.profileId === form.activeSenderProfileId);

  const statusColor = form.enabled ? '#0f766e' : '#b91c1c';
  const statusLabel = form.enabled ? 'Email service ON' : 'Email service OFF';
  const lastTestLabel = useMemo(() => {
    if (!meta?.lastTestedAt) return 'Not tested yet';
    return `${meta.lastTestStatus === 'success' ? 'Passed' : 'Failed'} - ${new Date(meta.lastTestedAt).toLocaleString()}`;
  }, [meta]);

  const syncSettings = (settings) => {
    setForm({
      enabled: settings.enabled !== false,
      activeSenderProfileId: settings.activeSenderProfileId || 'default',
      senderProfileLabel: settings.senderProfileLabel || settings.emailUser || 'Default Sender',
      createSenderProfile: false,
      senderName: settings.senderName || 'CIIS NETWORK',
      emailUser: settings.emailUser || '',
      emailPass: '',
      emailHostType: settings.emailHost ? 'hosting' : 'simple',
      emailService: settings.emailService || 'Gmail',
      emailHost: settings.emailHost || (settings.emailHost ? 'smtp.hostinger.com' : 'smtp.gmail.com'),
      emailPort: settings.emailPort || 465,
      emailSecure: settings.emailSecure !== false,
      replyTo: settings.replyTo || '',
      moduleSettings: settings.moduleSettings || {},
      loginSettings: {
        companyLoginOtpEnabled: settings.loginSettings?.companyLoginOtpEnabled !== false,
        superAdminLoginOtpEnabled: settings.loginSettings?.superAdminLoginOtpEnabled !== false
      }
    });
    setMeta(settings);
    setTestEmail(settings.emailUser || '');
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/email-settings');
      if (response.data?.success) {
        syncSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Email settings load failed:', error);
      toast.error(error.response?.data?.message || 'Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateModuleSetting = async (moduleKey, enabled) => {
    const previousForm = form;
    const nextForm = {
      ...form,
      moduleSettings: {
        ...form.moduleSettings,
        [moduleKey]: enabled
      }
    };

    setForm(nextForm);
    setSaving(true);

    try {
      const response = await axios.put('/email-settings', {
        activeSenderProfileId: nextForm.activeSenderProfileId,
        moduleSettings: nextForm.moduleSettings,
        saveSenderProfile: false
      });

      if (response.data?.success) {
        syncSettings(response.data.settings);
        toast.success(enabled ? 'Email module enabled' : 'Email module disabled');
        return true;
      }

      setForm(previousForm);
      return false;
    } catch (error) {
      console.error('Email module setting update failed:', error);
      setForm(previousForm);
      toast.error(error.response?.data?.message || 'Failed to update email module');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateLoginSetting = (field, enabled) => {
    setForm(prev => ({
      ...prev,
      loginSettings: {
        ...prev.loginSettings,
        [field]: enabled
      }
    }));
  };

  const saveSettings = async (formOverride = null) => {
    const nextForm = formOverride || form;

    if (nextForm.enabled && !nextForm.emailUser.trim()) {
      toast.error('Sender email is required');
      return;
    }

    const selectedProfile = senderProfiles.find(profile => profile.profileId === nextForm.activeSenderProfileId);
    const selectedHasPassword = nextForm.createSenderProfile ? false : (selectedProfile?.hasPassword ?? meta?.hasPassword);

    if (nextForm.enabled && !selectedHasPassword && !nextForm.emailPass.trim()) {
      toast.error('Email password/app password is required');
      return;
    }

    if (nextForm.enabled && !nextForm.emailHost.trim()) {
      toast.error('SMTP Host is required');
      return;
    }

    setSaving(true);
    try {
      const normalizedEmailPass = nextForm.emailHost === 'smtp.gmail.com'
        ? nextForm.emailPass.replace(/\s+/g, '')
        : nextForm.emailPass;
      const payload = {
        ...nextForm,
        emailService: nextForm.emailHost === 'smtp.gmail.com' ? 'Gmail' : nextForm.emailService,
        emailPass: normalizedEmailPass,
        emailHost: nextForm.emailHost,
        emailPort: Number(nextForm.emailPort) || 465,
        emailSecure: nextForm.emailHost === 'smtp.gmail.com' ? true : nextForm.emailSecure
      };

      if (!payload.emailPass) {
        delete payload.emailPass;
      }

      const response = await axios.put('/email-settings', payload);
      if (response.data?.success) {
        syncSettings(response.data.settings);
        toast.success('Sender credentials saved successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Email settings save failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save email settings');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const selectSenderProfile = async (profileId) => {
    const profile = senderProfiles.find(item => item.profileId === profileId);
    if (!profile) return;

    const previousForm = form;
    setForm(prev => ({
      ...prev,
      activeSenderProfileId: profile.profileId,
      senderProfileLabel: profile.label || profile.emailUser || 'Sender Account',
      createSenderProfile: false,
      senderName: profile.senderName || 'CIIS NETWORK',
      emailUser: profile.emailUser || '',
      emailPass: '',
      emailHostType: profile.emailHost ? 'hosting' : 'simple',
      emailService: profile.emailService || 'Gmail',
      emailHost: profile.emailHost || (profile.emailHost ? 'smtp.hostinger.com' : 'smtp.gmail.com'),
      emailPort: profile.emailPort || 465,
      emailSecure: profile.emailSecure !== false,
      replyTo: profile.replyTo || ''
    }));

    setSaving(true);
    try {
      const response = await axios.put('/email-settings', {
        activeSenderProfileId: profile.profileId,
        saveSenderProfile: false
      }, { _skipErrorNotify: true });

      if (response.data?.success) {
        syncSettings(response.data.settings);
        toast.success('Active sender selected');
      } else {
        setForm(previousForm);
      }
    } catch (error) {
      console.error('Active sender selection failed:', error);
      toast.error(error.response?.data?.message || 'Failed to select sender');
      setForm(previousForm);
    } finally {
      setSaving(false);
    }
  };

  const startNewSenderProfile = () => {
    setForm(prev => ({
      ...prev,
      activeSenderProfileId: `new-${Date.now()}`,
      senderProfileLabel: '',
      createSenderProfile: true,
      senderName: 'CIIS NETWORK',
      emailUser: '',
      emailPass: '',
      emailHostType: 'simple',
      emailService: 'Gmail',
      emailHost: 'smtp.gmail.com',
      emailPort: 465,
      emailSecure: true,
      replyTo: ''
    }));
    setShowPassword(false);
  };

  const handleGlobalSwitchChange = async (enabled) => {
    const previousEnabled = form.enabled;
    setForm(prev => ({ ...prev, enabled }));
    setSaving(true);

    try {
      let response;

      try {
        response = await axios.post('/email-settings/global-switch', { enabled }, { _skipErrorNotify: true });
      } catch (postError) {
        try {
          response = await axios.put('/email-settings', { enabled, globalOnly: true }, { _skipErrorNotify: true });
        } catch (putError) {
          response = await axios.patch('/email-settings/global-switch', { enabled }, { _skipErrorNotify: true });
        }
      }

      if (response.data?.success) {
        syncSettings(response.data.settings);
        toast.success(response.data.message || 'Global email switch updated');
        return;
      }
      setForm(prev => ({ ...prev, enabled: previousEnabled }));
    } catch (error) {
      console.error('Global email switch update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update global email switch. Please restart/deploy backend and try again.');
      setForm(prev => ({ ...prev, enabled: previousEnabled }));
    } finally {
      setSaving(false);
    }
  };

  const updateEmailHostType = (type) => {
    setForm(prev => ({
      ...prev,
      emailHostType: type,
      emailHost: type === 'simple' ? 'smtp.gmail.com' : 'smtp.hostinger.com',
      emailPort: type === 'simple' ? 465 : (prev.emailPort || 465),
      emailSecure: type === 'simple' ? true : prev.emailSecure
    }));
  };

  const sendTestEmail = async () => {
    setTesting(true);
    try {
      const response = await axios.post('/email-settings/test', { testEmail });
      if (response.data?.success) {
        setMeta(response.data.settings);
        toast.success(response.data.message || 'Test email sent successfully');
      }
    } catch (error) {
      console.error('Email test failed:', error);
      if (error.response?.data?.settings) {
        setMeta(error.response.data.settings);
      }
      toast.error(error.response?.data?.message || 'Test email failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: '#f5f7fb' }}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" pauseOnHover />

      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.25, md: 3 },
            mb: 3,
            borderRadius: 2,
            color: '#fff',
            background: 'linear-gradient(135deg, #14532d 0%, #0f766e 52%, #2563eb 100%)',
            boxShadow: '0 28px 70px -46px rgba(15, 23, 42, 0.9)'
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 60, height: 60, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.16)' }}>
                <EmailIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>
                  SuperAdmin Control
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0 }}>
                  Email Settings
                </Typography>
                <Typography sx={{ mt: 0.75, fontSize: 14, opacity: 0.9 }}>
                  Control portal-wide outgoing emails and sender SMTP credentials.
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Chip label={statusLabel} sx={{ color: '#fff', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.16)' }} />
              <Chip label={lastTestLabel} sx={{ color: '#fff', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.16)' }} />
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography sx={{ mb: 1 }} color="text.secondary">Loading email settings...</Typography>
            <LinearProgress />
          </Paper>
        ) : (
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Global Email Switch</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Turn this off to stop outgoing emails from every portal page.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography sx={{ fontWeight: 900, color: statusColor }}>
                    {form.enabled ? 'ON' : 'OFF'}
                  </Typography>
                  <Button
                    variant={form.enabled ? 'outlined' : 'contained'}
                    color={form.enabled ? 'error' : 'success'}
                    size="small"
                    onClick={() => handleGlobalSwitchChange(!form.enabled)}
                    disabled={saving}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 900 }}
                  >
                    {form.enabled ? 'Turn OFF' : 'Turn ON'}
                  </Button>
                  <Switch
                    checked={form.enabled}
                    onChange={(event) => handleGlobalSwitchChange(event.target.checked)}
                    disabled={saving}
                    color="success"
                  />
                </Stack>
              </Stack>

              {saving && (
                <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 13, fontWeight: 700 }}>
                  Saving global email switch...
                </Typography>
              )}

              {!form.enabled && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  Emails will be skipped globally. OTP and automated notification emails will also stop sending.
                </Alert>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SettingsApplicationsIcon sx={{ color: '#0f766e' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Page / Module Email Control</Typography>
                    <Typography color="text.secondary">
                      Enable or disable outgoing emails independently for every module that sends mail.
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                  {emailModules.map((moduleItem) => {
                    const enabled = form.moduleSettings[moduleItem.key] !== false;
                    return (
                      <Box
                        key={moduleItem.key}
                        sx={{
                          p: 2,
                          border: '1px solid #e5e7eb',
                          borderRadius: 1.5,
                          bgcolor: enabled ? '#f8fafc' : '#fff7ed'
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                              <Typography sx={{ fontWeight: 900, color: '#111827' }}>{moduleItem.label}</Typography>
                              <Chip size="small" label={moduleItem.area} sx={{ height: 22, fontWeight: 800 }} />
                            </Stack>
                            <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.45 }}>
                              {moduleItem.description}
                            </Typography>
                          </Box>
                          <Stack alignItems="center" spacing={0.5}>
                            <Switch
                              checked={enabled}
                              disabled={saving}
                              onChange={(event) => updateModuleSetting(moduleItem.key, event.target.checked)}
                              color="success"
                            />
                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: enabled ? '#0f766e' : '#b45309' }}>
                              {enabled ? 'ON' : 'OFF'}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SecurityIcon sx={{ color: '#7c3aed' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Login Settings</Typography>
                    <Typography color="text.secondary">
                      Manage OTP authentication for Company Login and Super Admin Login without editing code or .env.
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Company Login</Typography>
                    <RadioGroup
                      value={form.loginSettings.companyLoginOtpEnabled ? 'otp' : 'withoutOtp'}
                      onChange={(event) => updateLoginSetting('companyLoginOtpEnabled', event.target.value === 'otp')}
                    >
                      <FormControlLabel value="otp" control={<Radio />} label="Login with OTP" />
                      <FormControlLabel value="withoutOtp" control={<Radio />} label="Allow login without OTP" />
                    </RadioGroup>
                  </Box>

                  <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Super Admin Login</Typography>
                    <RadioGroup
                      value={form.loginSettings.superAdminLoginOtpEnabled ? 'otp' : 'withoutOtp'}
                      onChange={(event) => updateLoginSetting('superAdminLoginOtpEnabled', event.target.value === 'otp')}
                    >
                      <FormControlLabel value="otp" control={<Radio />} label="Login with OTP" />
                      <FormControlLabel value="withoutOtp" control={<Radio />} label="Allow login without OTP" />
                    </RadioGroup>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  These login settings control authentication flow. Email module switches only control whether related emails are sent.
                </Alert>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SecurityIcon sx={{ color: '#2563eb' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Sender Credentials</Typography>
                    <Typography color="text.secondary">Save multiple sender accounts and choose which one sends outgoing emails.</Typography>
                  </Box>
                </Stack>

                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>Saved Sender Accounts</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        Saved accounts are shown below. Select any account to load its setup and make it active.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={startNewSenderProfile}
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 900 }}
                    >
                      Add New Sender
                    </Button>
                  </Stack>

                  {senderProfiles.length > 0 && (
                    <RadioGroup
                      value={form.createSenderProfile ? '' : form.activeSenderProfileId}
                      onChange={(event) => selectSenderProfile(event.target.value)}
                    >
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                        {senderProfiles.map((profile) => {
                          const selected = !form.createSenderProfile && profile.profileId === form.activeSenderProfileId;
                          return (
                            <Box
                              key={profile.profileId}
                              sx={{
                                p: 1.5,
                                border: selected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                borderRadius: 1.5,
                                bgcolor: selected ? '#eff6ff' : '#f8fafc'
                              }}
                            >
                              <FormControlLabel
                                value={profile.profileId}
                                control={<Radio />}
                                sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                                label={
                                  <Box sx={{ minWidth: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                      <Typography sx={{ fontWeight: 900 }}>{profile.label || profile.emailUser || 'Sender Account'}</Typography>
                                      {profile.active && <Chip size="small" color="primary" label="Active" sx={{ height: 22, fontWeight: 800 }} />}
                                      {profile.hasPassword && <Chip size="small" label="Password saved" sx={{ height: 22, fontWeight: 800 }} />}
                                    </Stack>
                                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                                      {profile.emailUser || 'No email set'} {profile.emailHost ? `- ${profile.emailHost}:${profile.emailPort}` : `- ${profile.emailService || 'Gmail'}`}
                                    </Typography>
                                    {profile.hasPassword && (
                                      <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.25 }}>
                                        Saved password: {profile.maskedPassword || '********'}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </Box>
                          );
                        })}
                      </Box>
                    </RadioGroup>
                  )}

                  {form.createSenderProfile && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      New sender mode is active. Fill credentials and save to add this sender account.
                    </Alert>
                  )}
                </Stack>

                <Alert severity={form.emailHostType === 'hosting' ? 'warning' : 'info'} sx={{ borderRadius: 2 }}>
                  {form.emailHostType === 'hosting'
                    ? 'Hosting Email: Sender email, hosting mailbox password, SMTP host, SMTP port, and secure setting are required.'
                    : 'Simple Email: Sender email, app password/passkey, and email service are required. SMTP host is not needed.'}
                </Alert>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Sender Profile Name"
                    value={form.senderProfileLabel}
                    onChange={(event) => updateField('senderProfileLabel', event.target.value)}
                    helperText="Example: Support Gmail, HR SMTP, Billing Email"
                    fullWidth
                  />
                  <TextField
                    label="Sender Name"
                    value={form.senderName}
                    onChange={(event) => updateField('senderName', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Sender Email"
                    type="email"
                    value={form.emailUser}
                    onChange={(event) => updateField('emailUser', event.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label={
                      form.emailHostType === 'hosting'
                        ? selectedSenderProfile?.hasPassword ? 'New Hosting Mail Password' : 'Hosting Mail Password'
                        : selectedSenderProfile?.hasPassword ? 'New App Password / Passkey' : 'App Password / Passkey'
                    }
                    type={showPassword ? 'text' : 'password'}
                    value={form.emailPass}
                    onChange={(event) => updateField('emailPass', event.target.value)}
                    helperText={
                      selectedSenderProfile?.hasPassword
                        ? `Leave blank to keep saved password (${selectedSenderProfile.maskedPassword})`
                        : form.emailHostType === 'hosting'
                          ? 'Use your hosting mailbox password'
                          : 'Use Gmail/app password/passkey, not your normal login password'
                    }
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(prev => !prev)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    label="Reply-To Email"
                    type="email"
                    value={form.replyTo}
                    onChange={(event) => updateField('replyTo', event.target.value)}
                    helperText="Blank uses sender email"
                    fullWidth
                  />
                  <TextField
                    select
                    label="Email Account Type"
                    value={form.emailHostType}
                    onChange={(event) => updateEmailHostType(event.target.value)}
                    helperText="Simple uses service like Gmail. Hosting uses your domain SMTP host."
                    fullWidth
                  >
                    <MenuItem value="simple">Simple Email - smtp.gmail.com</MenuItem>
                    <MenuItem value="hosting">Hosting Email - smtp.hostinger.com</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Email Service"
                    value={form.emailService}
                    onChange={(event) => updateField('emailService', event.target.value)}
                    helperText={form.emailHostType === 'simple' ? 'Example: Gmail' : 'Ignored when SMTP host is set'}
                    disabled={form.emailHostType === 'hosting'}
                    fullWidth
                  >
                    <MenuItem value="Gmail">Gmail</MenuItem>
                    <MenuItem value="Outlook">Outlook</MenuItem>
                    <MenuItem value="Yahoo">Yahoo</MenuItem>
                    <MenuItem value="Zoho">Zoho</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="SMTP Host"
                    value={form.emailHost}
                    onChange={(event) => updateField('emailHost', event.target.value)}
                    helperText={form.emailHostType === 'hosting' ? 'Hostinger hosting mail host' : 'Gmail/simple email host'}
                    required
                    fullWidth
                  >
                    {form.emailHostType === 'hosting' ? (
                      <MenuItem value="smtp.hostinger.com">smtp.hostinger.com</MenuItem>
                    ) : (
                      <MenuItem value="smtp.gmail.com">smtp.gmail.com</MenuItem>
                    )}
                  </TextField>
                  <TextField
                    label="SMTP Port"
                    type="number"
                    value={form.emailPort}
                    onChange={(event) => updateField('emailPort', event.target.value)}
                    helperText={form.emailHostType === 'hosting' ? 'Usually 465 SSL or 587 TLS' : 'Default 465'}
                    fullWidth
                  />
                  <FormControlLabel
                    sx={{ alignSelf: 'center' }}
                    control={
                      <Switch
                        checked={form.emailSecure}
                        onChange={(event) => updateField('emailSecure', event.target.checked)}
                      />
                    }
                    label="Use secure SMTP connection"
                  />
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => saveSettings()}
                    disabled={saving}
                    sx={{ px: 3, py: 1.15, borderRadius: 1.5, textTransform: 'none', fontWeight: 900 }}
                  >
                    {saving ? 'Saving...' : form.createSenderProfile ? 'Save New Sender' : 'Save Sender Credentials'}
                  </Button>
                </Stack>

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Saved Sender Accounts</Typography>
                  {senderProfiles.length > 0 ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                      {senderProfiles.map((profile) => {
                        const selected = !form.createSenderProfile && profile.profileId === form.activeSenderProfileId;
                        return (
                          <Button
                            key={`saved-${profile.profileId}`}
                            onClick={() => selectSenderProfile(profile.profileId)}
                            variant="outlined"
                            disabled={saving}
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              textTransform: 'none',
                              borderColor: selected ? '#2563eb' : '#e5e7eb',
                              bgcolor: selected ? '#eff6ff' : '#fff',
                              color: '#111827'
                            }}
                          >
                            <Box sx={{ width: '100%' }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', mb: 0.5 }}>
                                <Typography sx={{ fontWeight: 900 }}>{profile.label || profile.emailUser || 'Sender Account'}</Typography>
                                {profile.active && <Chip size="small" color="primary" label="Active" sx={{ height: 22, fontWeight: 800 }} />}
                                {profile.hasPassword && <Chip size="small" label="Password saved" sx={{ height: 22, fontWeight: 800 }} />}
                              </Stack>
                              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                                {profile.emailUser || 'No email set'}
                              </Typography>
                              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                                {profile.emailHost ? `Hosting SMTP: ${profile.emailHost}:${profile.emailPort}` : `Simple Email: ${profile.emailService || 'Gmail'}`}
                              </Typography>
                              {profile.hasPassword && (
                                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                                  Saved password: {profile.maskedPassword || '********'}
                                </Typography>
                              )}
                            </Box>
                          </Button>
                        );
                      })}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No sender accounts saved yet. Fill the fields above and save.
                    </Alert>
                  )}
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Send Test Email</Typography>
                  <Typography color="text.secondary">
                    Verify the saved SMTP configuration before relying on it.
                  </Typography>
                </Box>
                {meta?.lastTestMessage && (
                  <Alert severity={meta.lastTestStatus === 'success' ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                    {meta.lastTestMessage}
                  </Alert>
                )}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label="Test Recipient"
                    type="email"
                    value={testEmail}
                    onChange={(event) => setTestEmail(event.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={sendTestEmail}
                    disabled={testing || !form.enabled}
                    sx={{ px: 3, borderRadius: 1.5, textTransform: 'none', fontWeight: 900 }}
                  >
                    {testing ? 'Sending...' : 'Send Test'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default EmailSettings;
