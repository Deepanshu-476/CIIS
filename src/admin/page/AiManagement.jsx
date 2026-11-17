import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Chip,
} from "@mui/material";
import {
  SmartToy as AiIcon,
  VpnKey as KeyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HelpOutline as HelpIcon,
  Visibility,
  VisibilityOff,
  Speed as SpeedIcon,
  RecordVoiceOver as VoiceIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import axiosInstance from "../../utils/axiosConfig";
import "./JobRoleManagement.css";
import "./PlanManagement.css";

const LLM_MODELS = [
  { id: "qwen/qwen3.8-27b", name: "Qwen 2.5 32B (Recommended - Fast & High Context)", speed: "Ultra Fast" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Highest Reasoning)", speed: "Balanced" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Lightweight)", speed: "Instant" },
];

const STT_MODELS = [
  { id: "whisper-large-v3-turbo", name: "Whisper Large V3 Turbo (Recommended - 0.2s Latency)" },
  { id: "whisper-large-v3", name: "Whisper Large V3 Standard" },
];

export default function AiManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const [settings, setSettings] = useState({
    primaryApiKeyMasked: "",
    secondaryApiKeyMasked: "",
    hasPrimaryApiKey: false,
    hasSecondaryApiKey: false,
    selectedModel: "qwen/qwen3.8-27b",
    selectedSttModel: "whisper-large-v3-turbo",
    isEnabled: true,
    testStatus: "untested",
    testMessage: "",
    lastTestedAt: null,
  });

  const [form, setForm] = useState({
    primaryApiKey: "",
    secondaryApiKey: "",
    selectedModel: "qwen/qwen3.8-27b",
    selectedSttModel: "whisper-large-v3-turbo",
    isEnabled: true,
  });

  const [showPrimaryKey, setShowPrimaryKey] = useState(false);
  const [showSecondaryKey, setShowSecondaryKey] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/ai-settings");
      if (res.data?.success && res.data?.settings) {
        const s = res.data.settings;
        setSettings(s);
        setForm({
          primaryApiKey: "",
          secondaryApiKey: "",
          selectedModel: s.selectedModel || "qwen/qwen3.8-27b",
          selectedSttModel: s.selectedSttModel || "whisper-large-v3-turbo",
          isEnabled: s.isEnabled !== false,
        });
      }
    } catch (err) {
      console.error("Failed to fetch AI settings:", err);
      setNotice({
        severity: "error",
        message: err.response?.data?.message || "Failed to load AI settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestKey = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await axiosInstance.post("/ai-settings/test", {
        apiKey: form.primaryApiKey.trim() || undefined,
      });

      if (res.data?.isValid) {
        setTestResult({
          isValid: true,
          message: res.data.message || "Groq API Key is valid and active!",
          models: res.data.models || [],
        });
      } else {
        setTestResult({
          isValid: false,
          message: res.data?.message || "Key validation failed with Groq.",
        });
      }
    } catch (err) {
      setTestResult({
        isValid: false,
        message: err.response?.data?.message || "Failed to test key with Groq.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setNotice(null);

      const payload = {
        selectedModel: form.selectedModel,
        selectedSttModel: form.selectedSttModel,
        isEnabled: form.isEnabled,
      };

      if (form.primaryApiKey.trim()) {
        payload.primaryApiKey = form.primaryApiKey.trim();
      }
      if (form.secondaryApiKey.trim() !== undefined) {
        payload.secondaryApiKey = form.secondaryApiKey.trim();
      }

      const res = await axiosInstance.put("/ai-settings", payload);
      if (res.data?.success) {
        setNotice({
          severity: "success",
          message: res.data.message || "AI Settings saved and switched successfully!",
        });
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
        setForm((prev) => ({
          ...prev,
          primaryApiKey: "",
          secondaryApiKey: "",
        }));
        setTestResult(null);
      }
    } catch (err) {
      setNotice({
        severity: "error",
        message: err.response?.data?.message || "Failed to save AI settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="JobRoleManagement-container">
        <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  const isCurrentKeyValid = settings.testStatus === "valid";
  const isCurrentKeyInvalid = settings.testStatus === "invalid";

  return (
    <div className="JobRoleManagement-container">
      <div className="PlanManagement-hero">
        <div>
          <span className="PlanManagement-eyebrow">Platform Engine</span>
          <h1>AI Assistant Management</h1>
          <p>
            Configure Groq API keys, switch models, and manage live AI engine settings with zero downtime.
          </p>
        </div>
      </div>

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="JobRoleManagement-stats-grid" style={{ marginBottom: 24 }}>
        <div className="JobRoleManagement-stat-card JobRoleManagement-stat-blue">
          <div className="JobRoleManagement-stat-content">
            <div className="JobRoleManagement-stat-icon-box">
              <KeyIcon className="JobRoleManagement-stat-icon" />
            </div>
            <div className="JobRoleManagement-stat-info">
              <span className="JobRoleManagement-stat-label">Active API Key</span>
              <div className="JobRoleManagement-stat-value-wrapper">
                <span className="JobRoleManagement-stat-value" style={{ fontSize: "15px", fontFamily: "monospace" }}>
                  {settings.primaryApiKeyMasked || "Using .env key"}
                </span>
                <span
                  className="JobRoleManagement-stat-chip"
                  style={{
                    backgroundColor: isCurrentKeyValid ? "#dcfce7" : isCurrentKeyInvalid ? "#fee2e2" : "#f1f5f9",
                    color: isCurrentKeyValid ? "#15803d" : isCurrentKeyInvalid ? "#b91c1c" : "#475569",
                  }}
                >
                  {isCurrentKeyValid ? "Verified" : isCurrentKeyInvalid ? "Error" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="JobRoleManagement-stat-card JobRoleManagement-stat-green">
          <div className="JobRoleManagement-stat-content">
            <div className="JobRoleManagement-stat-icon-box">
              <SpeedIcon className="JobRoleManagement-stat-icon" />
            </div>
            <div className="JobRoleManagement-stat-info">
              <span className="JobRoleManagement-stat-label">LLM Model</span>
              <div className="JobRoleManagement-stat-value-wrapper">
                <span className="JobRoleManagement-stat-value" style={{ fontSize: "14px" }}>
                  {settings.selectedModel}
                </span>
                <span className="JobRoleManagement-stat-chip">Groq LPU</span>
              </div>
            </div>
          </div>
        </div>

        <div className="JobRoleManagement-stat-card JobRoleManagement-stat-red">
          <div className="JobRoleManagement-stat-content">
            <div className="JobRoleManagement-stat-icon-box">
              <VoiceIcon className="JobRoleManagement-stat-icon" />
            </div>
            <div className="JobRoleManagement-stat-info">
              <span className="JobRoleManagement-stat-label">Voice STT Model</span>
              <div className="JobRoleManagement-stat-value-wrapper">
                <span className="JobRoleManagement-stat-value" style={{ fontSize: "14px" }}>
                  {settings.selectedSttModel}
                </span>
                <span className="JobRoleManagement-stat-chip">Whisper</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="JobRoleManagement-paper" style={{ padding: "24px 28px" }}>
        <div className="JobRoleManagement-header" style={{ marginBottom: 20 }}>
          <div className="JobRoleManagement-header-left">
            <div className="JobRoleManagement-header-icon-box">
              <AiIcon className="JobRoleManagement-header-icon" />
            </div>
            <div>
              <h2 className="JobRoleManagement-header-title">Groq API Key & Engine Settings</h2>
              <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
                Instant Zero-Downtime Switch
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            {/* Primary Key Input */}
            <Grid item xs={12} md={6}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Primary Groq API Key</span>
                  {settings.hasPrimaryApiKey && (
                    <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                      Current: {settings.primaryApiKeyMasked}
                    </span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPrimaryKey ? "text" : "password"}
                    className="JobRoleManagement-form-input"
                    placeholder={settings.hasPrimaryApiKey ? "Enter new key to change (e.g. gsk_...)" : "Enter gsk_..."}
                    value={form.primaryApiKey}
                    onChange={(e) => setForm({ ...form, primaryApiKey: e.target.value })}
                    style={{ paddingRight: 40 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setShowPrimaryKey(!showPrimaryKey)}
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }}
                  >
                    {showPrimaryKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </div>
                <small style={{ color: "#64748b", fontSize: "11.5px", marginTop: 4, display: "block" }}>
                  Used for all AI interactive chat, task extraction, slot filling, and voice transcription.
                </small>
              </div>
            </Grid>

            {/* Secondary Key Input */}
            <Grid item xs={12} md={6}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Secondary Groq API Key (Optional Fallback)</span>
                  {settings.hasSecondaryApiKey && (
                    <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                      Current: {settings.secondaryApiKeyMasked}
                    </span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showSecondaryKey ? "text" : "password"}
                    className="JobRoleManagement-form-input"
                    placeholder={settings.hasSecondaryApiKey ? "Enter new key to change (optional)" : "Enter gsk_... (optional)"}
                    value={form.secondaryApiKey}
                    onChange={(e) => setForm({ ...form, secondaryApiKey: e.target.value })}
                    style={{ paddingRight: 40 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setShowSecondaryKey(!showSecondaryKey)}
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }}
                  >
                    {showSecondaryKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </div>
                <small style={{ color: "#64748b", fontSize: "11.5px", marginTop: 4, display: "block" }}>
                  If primary key reaches 429 rate limit, requests automatically fail over to this key without error.
                </small>
              </div>
            </Grid>

            {/* Model Selection */}
            <Grid item xs={12} md={6}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Default LLM Model</label>
                <select
                  className="JobRoleManagement-form-input"
                  value={form.selectedModel}
                  onChange={(e) => setForm({ ...form, selectedModel: e.target.value })}
                >
                  {LLM_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </Grid>

            {/* STT Model Selection */}
            <Grid item xs={12} md={6}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Voice Transcription Model (STT)</label>
                <select
                  className="JobRoleManagement-form-input"
                  value={form.selectedSttModel}
                  onChange={(e) => setForm({ ...form, selectedSttModel: e.target.value })}
                >
                  {STT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </Grid>
          </Grid>

          {/* Test Result Alert */}
          {testResult && (
            <Alert
              severity={testResult.isValid ? "success" : "error"}
              sx={{ mt: 2, borderRadius: 2 }}
              onClose={() => setTestResult(null)}
            >
              <strong>{testResult.isValid ? "Success:" : "Connection Error:"}</strong> {testResult.message}
            </Alert>
          )}

          {/* Banner */}
          <div style={{
            marginTop: 20,
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <SyncIcon fontSize="small" />
            <span>
              <strong>Zero-Downtime Switching:</strong> When you click <strong>Save & Switch API Key</strong>, the backend immediately invalidates its key cache. All ongoing and future AI calls across the portal will switch to the new key instantly.
            </span>
          </div>

          {/* Actions */}
          <div className="JobRoleManagement-modal-footer" style={{ marginTop: 24, paddingInline: 0 }}>
            <div>
              <button
                type="button"
                className="JobRoleManagement-btn-outline"
                onClick={handleTestKey}
                disabled={testing || (!form.primaryApiKey.trim() && !settings.hasPrimaryApiKey)}
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
            </div>
            <div className="PlanManagement-footer-actions">
              <button
                type="submit"
                className="JobRoleManagement-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving & Switching..." : "Save & Switch API Key"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
