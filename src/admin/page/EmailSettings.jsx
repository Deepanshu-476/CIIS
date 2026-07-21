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
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import axios from '../../utils/axiosConfig';
import { toast, ToastContainer } from 'react-toastify';

const defaultForm = {
  enabled: true,
  senderName: 'CIIS NETWORK',
  emailUser: '',
  emailPass: '',
  emailService: 'Gmail',
  emailHost: '',
  emailPort: 465,
  emailSecure: true,
  replyTo: ''
};

function EmailSettings() {
  const [form, setForm] = useState(defaultForm);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const statusColor = form.enabled ? '#0f766e' : '#b91c1c';
  const statusLabel = form.enabled ? 'Email service ON' : 'Email service OFF';
  const lastTestLabel = useMemo(() => {
    if (!meta?.lastTestedAt) return 'Not tested yet';
    return `${meta.lastTestStatus === 'success' ? 'Passed' : 'Failed'} - ${new Date(meta.lastTestedAt).toLocaleString()}`;
  }, [meta]);

  const syncSettings = (settings) => {
    setForm({
      enabled: settings.enabled !== false,
      senderName: settings.senderName || 'CIIS NETWORK',
      emailUser: settings.emailUser || '',
      emailPass: '',
      emailService: settings.emailService || 'Gmail',
      emailHost: settings.emailHost || '',
      emailPort: settings.emailPort || 465,
      emailSecure: settings.emailSecure !== false,
      replyTo: settings.replyTo || ''
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

  const saveSettings = async () => {
    if (form.enabled && !form.emailUser.trim()) {
      toast.error('Sender email is required');
      return;
    }

    if (form.enabled && !meta?.hasPassword && !form.emailPass.trim()) {
      toast.error('Email password/app password is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        emailPort: Number(form.emailPort) || 465
      };

      if (!payload.emailPass) {
        delete payload.emailPass;
      }

      const response = await axios.put('/email-settings', payload);
      if (response.data?.success) {
        syncSettings(response.data.settings);
        toast.success('Email settings saved successfully');
      }
    } catch (error) {
      console.error('Email settings save failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
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
                  <Switch
                    checked={form.enabled}
                    onChange={(event) => updateField('enabled', event.target.checked)}
                    color="success"
                  />
                </Stack>
              </Stack>

              {!form.enabled && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  Emails will be skipped globally. OTP and automated notification emails will also stop sending.
                </Alert>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SecurityIcon sx={{ color: '#2563eb' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Sender Credentials</Typography>
                    <Typography color="text.secondary">Update sender account without editing the server .env file.</Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
                    label={meta?.hasPassword ? 'New Password / App Password' : 'Password / App Password'}
                    type={showPassword ? 'text' : 'password'}
                    value={form.emailPass}
                    onChange={(event) => updateField('emailPass', event.target.value)}
                    helperText={meta?.hasPassword ? `Leave blank to keep saved password (${meta.maskedPassword})` : 'Required before emails can be sent'}
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
                    label="Email Service"
                    value={form.emailService}
                    onChange={(event) => updateField('emailService', event.target.value)}
                    helperText="Example: Gmail. Ignored when SMTP host is set."
                    fullWidth
                  />
                  <TextField
                    label="SMTP Host"
                    value={form.emailHost}
                    onChange={(event) => updateField('emailHost', event.target.value)}
                    helperText="Optional. Example: smtp.gmail.com"
                    fullWidth
                  />
                  <TextField
                    label="SMTP Port"
                    type="number"
                    value={form.emailPort}
                    onChange={(event) => updateField('emailPort', event.target.value)}
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
                    onClick={saveSettings}
                    disabled={saving}
                    sx={{ px: 3, py: 1.15, borderRadius: 1.5, textTransform: 'none', fontWeight: 900 }}
                  >
                    {saving ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                </Stack>
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
