import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TuneIcon from '@mui/icons-material/Tune';
import axios from '../../utils/axiosConfig';
import { toast, ToastContainer } from 'react-toastify';
import './MarketingAdsSettings.css';

export default function MarketingAdsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [lang, setLang] = useState('hi'); // 'hi' (Hindi) or 'en' (English)
  const [showHelp, setShowHelp] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Password visibility
  const [showMetaSecret, setShowMetaSecret] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);

  // Form State
  const [form, setForm] = useState({
    metaAppId: '',
    metaAppSecret: '',
    metaWebhookVerifyToken: 'ciis_meta_verify_token_2026_secure',
    metaGraphApiVersion: 'v26.0',
    googleClientId: '',
    googleClientSecret: '',
    googleAdsDeveloperToken: '',
    googleAdsApiVersion: 'v26',
    adsCrmOrigin: '',
    adsPublicApiOrigin: ''
  });

  const [metaInfo, setMetaInfo] = useState({
    hasMetaAppSecret: false,
    hasGoogleClientSecret: false,
    metaConfigured: false,
    googleConfigured: false,
    metaCallbackUrl: '',
    metaWebhookUrl: '',
    googleCallbackUrl: ''
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/marketing-ads-settings');
      if (res.data?.success && res.data?.config) {
        const conf = res.data.config;
        setForm({
          metaAppId: conf.metaAppId || '',
          metaAppSecret: '', // Left blank so saved secret remains unless updated
          metaWebhookVerifyToken: conf.metaWebhookVerifyToken || 'ciis_meta_verify_token_2026_secure',
          metaGraphApiVersion: conf.metaGraphApiVersion || 'v26.0',
          googleClientId: conf.googleClientId || '',
          googleClientSecret: '',
          googleAdsDeveloperToken: conf.googleAdsDeveloperToken || '',
          googleAdsApiVersion: conf.googleAdsApiVersion || 'v26',
          adsCrmOrigin: conf.adsCrmOrigin || '',
          adsPublicApiOrigin: conf.adsPublicApiOrigin || ''
        });
        setMetaInfo({
          hasMetaAppSecret: conf.hasMetaAppSecret,
          hasGoogleClientSecret: conf.hasGoogleClientSecret,
          metaConfigured: conf.metaConfigured,
          googleConfigured: conf.googleConfigured,
          metaCallbackUrl: conf.metaCallbackUrl,
          metaWebhookUrl: conf.metaWebhookUrl,
          googleCallbackUrl: conf.googleCallbackUrl
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load marketing ads settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const generateToken = () => {
    const random = 'ciis_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    handleChange('metaWebhookVerifyToken', random);
    toast.info('New Verify Token generated. Remember to save!');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      // If secret wasn't changed, send empty string so backend retains existing
      const res = await axios.put('/marketing-ads-settings', payload);
      if (res.data?.success) {
        toast.success('Marketing Ads settings saved successfully!');
        if (res.data.config) {
          const conf = res.data.config;
          setMetaInfo({
            hasMetaAppSecret: conf.hasMetaAppSecret,
            hasGoogleClientSecret: conf.hasGoogleClientSecret,
            metaConfigured: conf.metaConfigured,
            googleConfigured: conf.googleConfigured,
            metaCallbackUrl: conf.metaCallbackUrl,
            metaWebhookUrl: conf.metaWebhookUrl,
            googleCallbackUrl: conf.googleCallbackUrl
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ads-settings-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="ads-settings-header">
        <div className="ads-settings-title-group">
          <h1>Marketing Ads Settings (Meta & Google)</h1>
          <p>Configure platform API keys & Webhook endpoints for automated lead sync across all registered companies.</p>
        </div>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            disabled={loading || saving}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={loading || saving}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </Stack>
      </div>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Copyable Webhook & Redirect URLs */}
      <div className="ads-card">
        <div className="ads-card-header">
          <div className="ads-card-title">
            <TuneIcon sx={{ color: '#2563eb' }} />
            <span>Platform URLs (Copy & Paste in Developer Consoles)</span>
          </div>
        </div>
        <div className="ads-urls-grid">
          <div className="ads-url-box">
            <span className="ads-url-label">Meta OAuth Redirect URI (Facebook Login)</span>
            <div className="ads-url-content">
              <span className="ads-url-text">{metaInfo.metaCallbackUrl || 'Loading…'}</span>
              <Tooltip title={copiedKey === 'metaCallback' ? 'Copied!' : 'Copy URL'}>
                <IconButton size="small" onClick={() => handleCopy(metaInfo.metaCallbackUrl, 'metaCallback')}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div className="ads-url-box">
            <span className="ads-url-label">Meta Webhook Callback URL (Page Leadgen)</span>
            <div className="ads-url-content">
              <span className="ads-url-text">{metaInfo.metaWebhookUrl || 'Loading…'}</span>
              <Tooltip title={copiedKey === 'metaWebhook' ? 'Copied!' : 'Copy URL'}>
                <IconButton size="small" onClick={() => handleCopy(metaInfo.metaWebhookUrl, 'metaWebhook')}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div className="ads-url-box">
            <span className="ads-url-label">Google OAuth Redirect URI</span>
            <div className="ads-url-content">
              <span className="ads-url-text">{metaInfo.googleCallbackUrl || 'Loading…'}</span>
              <Tooltip title={copiedKey === 'googleCallback' ? 'Copied!' : 'Copy URL'}>
                <IconButton size="small" onClick={() => handleCopy(metaInfo.googleCallbackUrl, 'googleCallback')}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Help Guide (Hindi & English) */}
      <div className="ads-help-box">
        <div className="ads-help-header">
          <div className="ads-help-title">
            <HelpOutlineIcon />
            <span>{lang === 'hi' ? 'सहायता गाइड: यह Keys कहाँ से मिलेंगी? (Step-by-Step Guide)' : 'Setup Guide: Where to find these Keys? (Step-by-Step)'}</span>
          </div>
          <Stack direction="row" spacing={1} alignItems="center">
            <button
              type="button"
              className={`ads-help-lang-btn ${lang === 'hi' ? 'active' : ''}`}
              onClick={() => setLang('hi')}
            >
              हिंदी (Hindi)
            </button>
            <button
              type="button"
              className={`ads-help-lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              English
            </button>
            <Button size="small" onClick={() => setShowHelp(!showHelp)}>
              {showHelp ? 'Hide' : 'Show'}
            </Button>
          </Stack>
        </div>

        <Collapse in={showHelp}>
          <div className="ads-help-content">
            {lang === 'hi' ? (
              <div>
                <Typography variant="subtitle1" fontWeight={700} color="#15803d" sx={{ mt: 1 }}>
                  1. Meta (Facebook & Instagram Lead Ads) Setup Steps:
                </Typography>
                <ol className="ads-step-list">
                  <li>
                    <strong>developers.facebook.com</strong> पर जाएं और अपने Facebook अकाउंट से लॉगिन करें।
                  </li>
                  <li>
                    <strong>My Apps</strong> &gt; <strong>Create App</strong> पर क्लिक करें और App Type में <strong>Business</strong> चुनें।
                  </li>
                  <li>
                    App बनने के बाद, Left Sidebar में <strong>App settings &gt; Basic</strong> में जाएं:
                    <br />- <strong>App ID</strong> कॉपी करें और नीचे <strong>Meta App ID</strong> में डालें।
                    <br />- <strong>App Secret</strong> के सामने "Show" दबाकर कॉपी करें और नीचे <strong>Meta App Secret</strong> में डालें।
                  </li>
                  <li>
                    Left Sidebar में <strong>Add Product</strong> पर क्लिक करके <strong>Facebook Login for Business</strong> जोड़ें:
                    <br />- उसकी Settings में <strong>Valid OAuth Redirect URIs</strong> में ऊपर दिया गया <strong>Meta OAuth Redirect URI</strong> पेस्ट करके Save करें।
                  </li>
                  <li>
                    Left Sidebar में <strong>Webhooks</strong> प्रोडक्ट जोड़ें:
                    <br />- Dropdown से <strong>Page</strong> चुनें और <strong>Subscribe to this object</strong> दबाएं।
                    <br />- <strong>Callback URL</strong> में ऊपर दिया गया <strong>Meta Webhook Callback URL</strong> पेस्ट करें।
                    <br />- <strong>Verify Token</strong> में जो नीचे <strong>Webhook Verify Token</strong> लिखा है, वही डालें और Save करें।
                    <br />- Page Webhook के अंदर <strong>leadgen</strong> इवेंट को <strong>Subscribe</strong> करें।
                  </li>
                </ol>

                <Typography variant="subtitle1" fontWeight={700} color="#15803d" sx={{ mt: 2 }}>
                  2. Google Ads Setup Steps:
                </Typography>
                <ol className="ads-step-list">
                  <li>
                    <strong>console.cloud.google.com</strong> पर जाएं और नया Project बनाएं (या मौजूदा Project चुनें)।
                  </li>
                  <li>
                    <strong>APIs & Services &gt; Library</strong> में जाकर <strong>Google Ads API</strong> को Search करके <strong>Enable</strong> करें।
                  </li>
                  <li>
                    <strong>APIs & Services &gt; Credentials</strong> पर जाएं और <strong>Create Credentials &gt; OAuth client ID</strong> चुनें:
                    <br />- Application type: <strong>Web application</strong> चुनें।
                    <br />- <strong>Authorized redirect URIs</strong> में ऊपर दिया गया <strong>Google OAuth Redirect URI</strong> जोड़ें।
                    <br />- Create करने पर आपको <strong>Client ID</strong> और <strong>Client Secret</strong> मिलेंगे। दोनों को नीचे फॉर्म में पेस्ट करें।
                  </li>
                  <li>
                    <strong>Google Ads Developer Token:</strong> अपने Google Ads Manager (MCC) अकाउंट में जाएं &gt; <strong>Tools & Settings &gt; API Center</strong> से अपना Developer Token कॉपी करके नीचे <strong>Google Ads Developer Token</strong> में डालें।
                  </li>
                </ol>

                <Alert severity="success" sx={{ mt: 1.5 }}>
                  <strong>Note:</strong> यह सेटिंग्स पूरे प्लेटफॉर्म के लिए सिर्फ एक बार करनी होती है। इसके बाद सभी 10+ कंपनियां अपने-अपने CRM से सीधा अपना अकाउंट कनेक्ट कर पाएंगी!
                </Alert>
              </div>
            ) : (
              <div>
                <Typography variant="subtitle1" fontWeight={700} color="#15803d" sx={{ mt: 1 }}>
                  1. Meta (Facebook & Instagram Lead Ads) Setup Steps:
                </Typography>
                <ol className="ads-step-list">
                  <li>
                    Go to <strong>developers.facebook.com</strong> and log in with your Facebook account.
                  </li>
                  <li>
                    Click <strong>My Apps</strong> &gt; <strong>Create App</strong> and select <strong>Business</strong> as App Type.
                  </li>
                  <li>
                    In the left sidebar, navigate to <strong>App settings &gt; Basic</strong>:
                    <br />- Copy <strong>App ID</strong> and paste into <strong>Meta App ID</strong> below.
                    <br />- Click "Show" next to <strong>App Secret</strong>, copy it and paste into <strong>Meta App Secret</strong> below.
                  </li>
                  <li>
                    In the left sidebar, click <strong>Add Product</strong> and add <strong>Facebook Login for Business</strong>:
                    <br />- Under its Settings, paste the <strong>Meta OAuth Redirect URI</strong> (shown above) into <strong>Valid OAuth Redirect URIs</strong> and Save.
                  </li>
                  <li>
                    In the left sidebar, add <strong>Webhooks</strong> product:
                    <br />- Select <strong>Page</strong> from the dropdown and click <strong>Subscribe to this object</strong>.
                    <br />- In <strong>Callback URL</strong>, paste the <strong>Meta Webhook Callback URL</strong> shown above.
                    <br />- In <strong>Verify Token</strong>, paste the <strong>Webhook Verify Token</strong> configured below and click Verify and Save.
                    <br />- Under Page events, click <strong>Subscribe</strong> for the <strong>leadgen</strong> field.
                  </li>
                </ol>

                <Typography variant="subtitle1" fontWeight={700} color="#15803d" sx={{ mt: 2 }}>
                  2. Google Ads Setup Steps:
                </Typography>
                <ol className="ads-step-list">
                  <li>
                    Go to <strong>console.cloud.google.com</strong> and create or select a Project.
                  </li>
                  <li>
                    Go to <strong>APIs & Services &gt; Library</strong>, search for <strong>Google Ads API</strong> and click <strong>Enable</strong>.
                  </li>
                  <li>
                    Go to <strong>APIs & Services &gt; Credentials</strong> and click <strong>Create Credentials &gt; OAuth client ID</strong>:
                    <br />- Application type: <strong>Web application</strong>.
                    <br />- Under <strong>Authorized redirect URIs</strong>, add the <strong>Google OAuth Redirect URI</strong> shown above.
                    <br />- Copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong> into the fields below.
                  </li>
                  <li>
                    <strong>Developer Token:</strong> Log in to your Google Ads Manager (MCC) account &gt; navigate to <strong>Tools & Settings &gt; API Center</strong>, and copy your Developer Token into the field below.
                  </li>
                </ol>

                <Alert severity="success" sx={{ mt: 1.5 }}>
                  <strong>Note:</strong> This configuration is platform-wide and done only once. All registered companies can then independently connect their accounts directly from their CRM!
                </Alert>
              </div>
            )}
          </div>
        </Collapse>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Meta (Facebook) Credentials Card */}
        <div className="ads-card">
          <div className="ads-card-header">
            <div className="ads-card-title">
              <span style={{ fontSize: '1.4rem' }}>📘</span>
              <span>Meta Ads Configuration (Facebook & Instagram)</span>
            </div>
            <Chip
              icon={metaInfo.metaConfigured ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
              label={metaInfo.metaConfigured ? 'Configured & Ready' : 'Incomplete'}
              color={metaInfo.metaConfigured ? 'success' : 'default'}
              size="small"
            />
          </div>

          <div className="ads-form-grid">
            <TextField
              label="Meta App ID"
              placeholder="e.g. 123456789012345"
              value={form.metaAppId}
              onChange={(e) => handleChange('metaAppId', e.target.value)}
              fullWidth
              size="small"
              helperText="App ID from developers.facebook.com"
            />

            <TextField
              label="Meta App Secret"
              type={showMetaSecret ? 'text' : 'password'}
              placeholder={metaInfo.hasMetaAppSecret ? '•••••••••••• (Leave blank to keep saved)' : 'Paste App Secret'}
              value={form.metaAppSecret}
              onChange={(e) => handleChange('metaAppSecret', e.target.value)}
              fullWidth
              size="small"
              helperText={metaInfo.hasMetaAppSecret ? 'Secret is saved securely. Enter new value only to update.' : 'App Secret from Basic Settings'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowMetaSecret(!showMetaSecret)}>
                      {showMetaSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Meta Webhook Verify Token"
              value={form.metaWebhookVerifyToken}
              onChange={(e) => handleChange('metaWebhookVerifyToken', e.target.value)}
              fullWidth
              size="small"
              helperText="Custom secret token matched during Facebook Webhook verification"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={generateToken} sx={{ textTransform: 'none', minWidth: 0, p: 0.5 }}>
                      Generate
                    </Button>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Graph API Version"
              value={form.metaGraphApiVersion}
              onChange={(e) => handleChange('metaGraphApiVersion', e.target.value)}
              fullWidth
              size="small"
              helperText="Default: v26.0"
            />
          </div>
        </div>

        {/* Google Ads Credentials Card */}
        <div className="ads-card">
          <div className="ads-card-header">
            <div className="ads-card-title">
              <span style={{ fontSize: '1.4rem' }}>🔴</span>
              <span>Google Ads Configuration</span>
            </div>
            <Chip
              icon={metaInfo.googleConfigured ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
              label={metaInfo.googleConfigured ? 'Configured & Ready' : 'Incomplete'}
              color={metaInfo.googleConfigured ? 'success' : 'default'}
              size="small"
            />
          </div>

          <div className="ads-form-grid">
            <TextField
              label="Google Client ID"
              placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
              value={form.googleClientId}
              onChange={(e) => handleChange('googleClientId', e.target.value)}
              fullWidth
              size="small"
              helperText="OAuth 2.0 Web Client ID from Google Cloud Console"
            />

            <TextField
              label="Google Client Secret"
              type={showGoogleSecret ? 'text' : 'password'}
              placeholder={metaInfo.hasGoogleClientSecret ? '•••••••••••• (Leave blank to keep saved)' : 'Paste Client Secret'}
              value={form.googleClientSecret}
              onChange={(e) => handleChange('googleClientSecret', e.target.value)}
              fullWidth
              size="small"
              helperText={metaInfo.hasGoogleClientSecret ? 'Secret is saved securely. Enter new value only to update.' : 'Client Secret from Google Cloud Console'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowGoogleSecret(!showGoogleSecret)}>
                      {showGoogleSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Google Ads Developer Token"
              placeholder="e.g. abcd1234efgh5678"
              value={form.googleAdsDeveloperToken}
              onChange={(e) => handleChange('googleAdsDeveloperToken', e.target.value)}
              fullWidth
              size="small"
              helperText="Developer Token from Google Ads Manager (MCC) API Center"
            />

            <TextField
              label="Google Ads API Version"
              value={form.googleAdsApiVersion}
              onChange={(e) => handleChange('googleAdsApiVersion', e.target.value)}
              fullWidth
              size="small"
              helperText="Default: v26"
            />
          </div>
        </div>

        {/* Advanced Origins Collapse */}
        <Box sx={{ mb: 2 }}>
          <Button
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            {showAdvanced ? '▲ Hide Advanced Domain Overrides' : '▼ Advanced: Custom CRM & API Domain Overrides'}
          </Button>

          <Collapse in={showAdvanced}>
            <div className="ads-card" style={{ marginTop: '0.75rem', background: '#fdfdfe' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                By default, callback and webhook URLs automatically use the server domain. Only edit these if you are using a proxy or staging domain.
              </Typography>
              <div className="ads-form-grid">
                <TextField
                  label="CRM Frontend Origin"
                  placeholder="https://cds.ciisnetwork.in"
                  value={form.adsCrmOrigin}
                  onChange={(e) => handleChange('adsCrmOrigin', e.target.value)}
                  fullWidth
                  size="small"
                  helperText="User-facing web app URL"
                />
                <TextField
                  label="Backend API Public Origin"
                  placeholder="https://backendcds.ciisnetwork.in"
                  value={form.adsPublicApiOrigin}
                  onChange={(e) => handleChange('adsPublicApiOrigin', e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Public backend domain for Webhooks & OAuth callbacks"
                />
              </div>
            </div>
          </Collapse>
        </Box>

        {/* Submit Actions */}
        <div className="ads-actions-bar">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SaveIcon />}
            disabled={saving || loading}
          >
            {saving ? 'Saving Settings…' : 'Save Marketing Ads Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
