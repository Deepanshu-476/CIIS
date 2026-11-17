import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
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
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  PlayArrow as PlayIcon,
  Shield as ShieldIcon,
  Star as StarIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Inventory2 as VaultIcon,
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
  const [actionKeyId, setActionKeyId] = useState(null);
  const [notice, setNotice] = useState(null);

  const [settings, setSettings] = useState({
    primaryApiKeyMasked: "",
    secondaryApiKeyMasked: "",
    hasPrimaryApiKey: false,
    hasSecondaryApiKey: false,
    primaryVaultId: null,
    secondaryVaultId: null,
    primaryLabel: "",
    keyVault: [],
    selectedModel: "qwen/qwen3.8-27b",
    selectedSttModel: "whisper-large-v3-turbo",
    isEnabled: true,
    testStatus: "untested",
    testMessage: "",
    lastTestedAt: null,
  });

  const [form, setForm] = useState({
    selectedModel: "qwen/qwen3.8-27b",
    selectedSttModel: "whisper-large-v3-turbo",
    isEnabled: true,
  });

  // Add Key to Vault Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalNotice, setModalNotice] = useState(null);
  const [newVaultKey, setNewVaultKey] = useState({
    label: "",
    apiKey: "",
    setAsPrimary: false,
    setAsSecondary: false,
  });
  const [showNewVaultKey, setShowNewVaultKey] = useState(false);
  const [addingToVault, setAddingToVault] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/ai-settings");
      if (res.data?.success && res.data?.settings) {
        const s = res.data.settings;
        setSettings(s);
        setForm({
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

  // Quick Switch: One-Click Set Primary or Secondary Key
  const handleSetActive = async (vaultId, target) => {
    try {
      setActionKeyId(`${vaultId}_${target}`);
      setNotice(null);
      const res = await axiosInstance.post("/ai-settings/vault/set-active", {
        vaultId,
        target,
      });

      if (res.data?.success) {
        setNotice({
          severity: "success",
          message: res.data.message || `Switched ${target} key successfully!`,
        });
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
      }
    } catch (err) {
      setNotice({
        severity: "error",
        message: err.response?.data?.message || "Failed to switch active key.",
      });
    } finally {
      setActionKeyId(null);
    }
  };

  // Live Test of a Specific Vault Key
  const handleTestVaultKey = async (vaultId, label) => {
    try {
      setActionKeyId(`${vaultId}_test`);
      const res = await axiosInstance.post(`/ai-settings/vault/${vaultId}/test`);
      if (res.data?.success) {
        setNotice({
          severity: res.data.isValid ? "success" : "error",
          message: `[${label}]: ${res.data.message}`,
        });
        // Refresh settings so badge updates
        await fetchSettings();
      }
    } catch (err) {
      setNotice({
        severity: "error",
        message: err.response?.data?.message || `Failed to test key "${label}".`,
      });
    } finally {
      setActionKeyId(null);
    }
  };

  // Delete a Key from the Vault
  const handleDeleteVaultKey = async (vaultId, label) => {
    if (!window.confirm(`Are you sure you want to remove "${label}" from your Key Vault?`)) {
      return;
    }

    try {
      setActionKeyId(`${vaultId}_del`);
      setNotice(null);
      const res = await axiosInstance.delete(`/ai-settings/vault/${vaultId}`);
      if (res.data?.success) {
        setNotice({
          severity: "success",
          message: res.data.message || `Key "${label}" removed from vault.`,
        });
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
      }
    } catch (err) {
      setNotice({
        severity: "error",
        message: err.response?.data?.message || `Failed to remove key "${label}".`,
      });
    } finally {
      setActionKeyId(null);
    }
  };

  // Add a New Key into Vault
  const handleAddVaultKeySubmit = async (e) => {
    e.preventDefault();
    setModalNotice(null);

    if (!newVaultKey.label.trim()) {
      setModalNotice("Please provide a nickname/label for this key.");
      return;
    }
    if (!newVaultKey.apiKey.trim().startsWith("gsk_")) {
      setModalNotice("Groq API key must start with 'gsk_'.");
      return;
    }

    try {
      setAddingToVault(true);
      setNotice(null);
      const res = await axiosInstance.post("/ai-settings/vault/add", {
        label: newVaultKey.label.trim(),
        apiKey: newVaultKey.apiKey.trim(),
        setAsPrimary: newVaultKey.setAsPrimary,
        setAsSecondary: newVaultKey.setAsSecondary,
      });

      if (res.data?.success) {
        setNotice({
          severity: "success",
          message: res.data.message || "Key successfully added to Vault!",
        });
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
        setIsAddModalOpen(false);
        setModalNotice(null);
        setNewVaultKey({
          label: "",
          apiKey: "",
          setAsPrimary: false,
          setAsSecondary: false,
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to add key to vault.";
      setModalNotice(errMsg);
    } finally {
      setAddingToVault(false);
    }
  };

  // Save Engine & Model Settings
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

      const res = await axiosInstance.put("/ai-settings", payload);
      if (res.data?.success) {
        setNotice({
          severity: "success",
          message: res.data.message || "AI Engine & Model settings saved successfully!",
        });
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
      }
    } catch (err) {
      setNotice({
        severity: "error",
        message: err.response?.data?.message || "Failed to save AI engine settings.",
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
  const vaultKeys = settings.keyVault || [];

  return (
    <div className="JobRoleManagement-container">
      <div className="PlanManagement-hero">
        <div>
          <span className="PlanManagement-eyebrow">Platform Engine</span>
          <h1>AI Assistant Management</h1>
          <p>
            Manage your Groq API key vault, switch models, and control live AI engine settings with zero downtime.
          </p>
        </div>
      </div>

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      {/* Top Dynamic Stats Grid */}
      <div className="JobRoleManagement-stats-grid" style={{ marginBottom: 24 }}>
        {/* Active API Key Card */}
        <div className="JobRoleManagement-stat-card JobRoleManagement-stat-blue">
          <div className="JobRoleManagement-stat-content">
            <div className="JobRoleManagement-stat-icon-box">
              <KeyIcon className="JobRoleManagement-stat-icon" />
            </div>
            <div className="JobRoleManagement-stat-info">
              <span className="JobRoleManagement-stat-label">Active API Key</span>
              <div className="JobRoleManagement-stat-value-wrapper">
                <span className="JobRoleManagement-stat-value" style={{ fontSize: "14.5px", fontFamily: "monospace" }}>
                  {settings.primaryApiKeyMasked || "No Active Key"}
                </span>
                <span
                  className="JobRoleManagement-stat-chip"
                  style={{
                    backgroundColor: !settings.primaryApiKeyMasked ? "#fef3c7" : isCurrentKeyValid ? "#dcfce7" : isCurrentKeyInvalid ? "#fee2e2" : "#eff6ff",
                    color: !settings.primaryApiKeyMasked ? "#b45309" : isCurrentKeyValid ? "#15803d" : isCurrentKeyInvalid ? "#b91c1c" : "#1d4ed8",
                  }}
                >
                  {!settings.primaryApiKeyMasked ? "Needs Setup" : isCurrentKeyValid ? "Verified" : isCurrentKeyInvalid ? "Error" : "Active"}
                </span>
              </div>
              {settings.primaryLabel ? (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: "11px", color: "#1e40af", fontWeight: 600, backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
                    Vault: {settings.primaryLabel}
                  </span>
                </div>
              ) : !settings.primaryApiKeyMasked ? (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: "11px", color: "#92400e" }}>
                    Select a key from Vault below
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* LLM Model Card */}
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

        {/* Voice STT Model Card */}
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

      {/* SECTION 1: GROQ API KEY VAULT (STORED POOL) */}
      <div className="JobRoleManagement-paper" style={{ padding: "24px 28px", marginBottom: 28 }}>
        <div className="JobRoleManagement-header" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="JobRoleManagement-header-left">
            <div className="JobRoleManagement-header-icon-box" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
              <VaultIcon className="JobRoleManagement-header-icon" />
            </div>
            <div>
              <h2 className="JobRoleManagement-header-title">Groq API Key Vault (Stored Pool)</h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Store up to 10+ keys. Click to switch active Primary or Fallback keys in 1 click without re-typing.
              </span>
            </div>
          </div>
          <div>
            <button
              type="button"
              className="JobRoleManagement-btn-primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px" }}
            >
              <AddIcon fontSize="small" />
              <span>Add Key to Vault</span>
            </button>
          </div>
        </div>

        {/* Key Vault Table */}
        <div className="JobRoleManagement-table-container">
          <table className="JobRoleManagement-table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Key Nickname</th>
                <th style={{ width: "22%" }}>API Key (Masked)</th>
                <th style={{ width: "20%" }}>Role & Status</th>
                <th style={{ width: "12%" }}>Health</th>
                <th style={{ width: "22%", textAlign: "right" }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {vaultKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="JobRoleManagement-table-empty" style={{ padding: 32 }}>
                    <VaultIcon className="JobRoleManagement-table-empty-icon" />
                    <h4>No Keys in Vault</h4>
                    <p>Click "Add Key to Vault" to store your Groq keys here for 1-click switching.</p>
                  </td>
                </tr>
              ) : (
                vaultKeys.map((item) => {
                  const isPrimary = item.isPrimary;
                  const isSecondary = item.isSecondary;
                  const isItemValid = item.status === "valid";
                  const isItemInvalid = item.status === "invalid";

                  return (
                    <tr
                      key={item.id}
                      className="JobRoleManagement-table-row"
                      style={{
                        backgroundColor: isPrimary ? "rgba(37, 99, 235, 0.03)" : isSecondary ? "rgba(245, 158, 11, 0.03)" : undefined,
                      }}
                    >
                      {/* Nickname */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <KeyIcon style={{ fontSize: 18, color: isPrimary ? "#2563eb" : isSecondary ? "#d97706" : "#94a3b8" }} />
                          <strong style={{ fontSize: "13.5px", color: isPrimary ? "#1e40af" : "#1e293b" }}>
                            {item.label}
                          </strong>
                        </div>
                      </td>

                      {/* API Key */}
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#334155", backgroundColor: "#f1f5f9", padding: "3px 8px", borderRadius: 4 }}>
                          {item.apiKeyMasked}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isPrimary && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: "#dbeafe",
                              color: "#1d4ed8",
                              padding: "3px 8px",
                              borderRadius: 12,
                            }}>
                              <StarIcon style={{ fontSize: 13 }} />
                              PRIMARY ACTIVE
                            </span>
                          )}
                          {isSecondary && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: "#fef3c7",
                              color: "#b45309",
                              padding: "3px 8px",
                              borderRadius: 12,
                            }}>
                              <ShieldIcon style={{ fontSize: 13 }} />
                              SECONDARY FALLBACK
                            </span>
                          )}
                          {!isPrimary && !isSecondary && (
                            <span style={{
                              fontSize: "11px",
                              color: "#64748b",
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              padding: "3px 8px",
                              borderRadius: 12,
                            }}>
                              Idle in Vault
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Health Chip */}
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: isItemValid ? "#dcfce7" : isItemInvalid ? "#fee2e2" : "#f1f5f9",
                            color: isItemValid ? "#15803d" : isItemInvalid ? "#b91c1c" : "#64748b",
                          }}
                        >
                          ● {isItemValid ? "Verified" : isItemInvalid ? "Invalid" : "Untested"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          {/* Set as Primary */}
                          <button
                            type="button"
                            className="JobRoleManagement-btn-outline"
                            onClick={() => handleSetActive(item.id, "primary")}
                            disabled={isPrimary || actionKeyId !== null}
                            style={{
                              fontSize: "11.5px",
                              padding: "4px 10px",
                              fontWeight: 600,
                              borderColor: isPrimary ? "#93c5fd" : "#cbd5e1",
                              backgroundColor: isPrimary ? "#eff6ff" : "#ffffff",
                              color: isPrimary ? "#3b82f6" : "#1e293b",
                            }}
                          >
                            {actionKeyId === `${item.id}_primary` ? "Switching..." : isPrimary ? "✓ Active Primary" : "Set Primary"}
                          </button>

                          {/* Set as Secondary */}
                          <button
                            type="button"
                            className="JobRoleManagement-btn-outline"
                            onClick={() => handleSetActive(item.id, "secondary")}
                            disabled={isPrimary || isSecondary || actionKeyId !== null}
                            style={{
                              fontSize: "11.5px",
                              padding: "4px 10px",
                              fontWeight: 600,
                              borderColor: isSecondary ? "#fde68a" : "#cbd5e1",
                              backgroundColor: isSecondary ? "#fffbeb" : "#ffffff",
                              color: isSecondary ? "#d97706" : "#475569",
                            }}
                          >
                            {actionKeyId === `${item.id}_secondary` ? "Setting..." : isSecondary ? "✓ Active Fallback" : "Set Fallback"}
                          </button>

                          {/* Test Key */}
                          <button
                            type="button"
                            className="JobRoleManagement-btn-outline"
                            onClick={() => handleTestVaultKey(item.id, item.label)}
                            disabled={actionKeyId !== null}
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                            title="Test this key live with Groq API"
                          >
                            {actionKeyId === `${item.id}_test` ? "..." : "Test"}
                          </button>

                          {/* Delete Key */}
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteVaultKey(item.id, item.label)}
                            disabled={isPrimary || actionKeyId !== null}
                            style={{
                              color: isPrimary ? "#cbd5e1" : "#ef4444",
                              opacity: isPrimary ? 0.4 : 1,
                            }}
                            title={isPrimary ? "Cannot delete active Primary key" : "Delete key from vault"}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: ENGINE & MODEL SETTINGS */}
      <div className="JobRoleManagement-paper" style={{ padding: "24px 28px" }}>
        <div className="JobRoleManagement-header" style={{ marginBottom: 20 }}>
          <div className="JobRoleManagement-header-left">
            <div className="JobRoleManagement-header-icon-box">
              <AiIcon className="JobRoleManagement-header-icon" />
            </div>
            <div>
              <h2 className="JobRoleManagement-header-title">AI Engine & Model Configuration</h2>
              <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
                Instant Zero-Downtime Switch
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
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
                <small style={{ color: "#64748b", fontSize: "11.5px", marginTop: 4, display: "block" }}>
                  Used for interactive chat, task extraction, slot filling, and CRM assistant intelligence.
                </small>
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
                <small style={{ color: "#64748b", fontSize: "11.5px", marginTop: 4, display: "block" }}>
                  Used for converting voice notes and audio clips into clean task titles and descriptions.
                </small>
              </div>
            </Grid>

          </Grid>

          {/* Zero-Downtime Banner */}
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
              <strong>Zero-Downtime Switching:</strong> When you switch a key in the Vault above or change models, the AI engine updates in 0 milliseconds with zero downtime.
            </span>
          </div>

          {/* Actions */}
          <div className="JobRoleManagement-modal-footer" style={{ marginTop: 24, paddingInline: 0, justifyContent: "flex-end" }}>
            <div className="PlanManagement-footer-actions">
              <button
                type="submit"
                className="JobRoleManagement-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving Settings..." : "Save Engine Settings"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ADD KEY TO VAULT MODAL */}
      {isAddModalOpen && (
        <div className="JobRoleManagement-modal-overlay">
          <div className="JobRoleManagement-modal" style={{ maxWidth: 540, width: "92%" }}>
            <div className="JobRoleManagement-modal-header">
              <div className="JobRoleManagement-modal-header-content">
                <div className="JobRoleManagement-modal-avatar" style={{ backgroundColor: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center" }}>
                  <VaultIcon />
                </div>
                <div>
                  <h3 className="JobRoleManagement-modal-title">Add Groq Key to Vault</h3>
                  <span className="JobRoleManagement-modal-subtitle">
                    Save a new key into your storage pool for 1-click switching
                  </span>
                </div>
              </div>
              <IconButton
                size="small"
                onClick={() => setIsAddModalOpen(false)}
                className="JobRoleManagement-modal-close"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>

            <form onSubmit={handleAddVaultKeySubmit}>
              <div className="JobRoleManagement-modal-body" style={{ padding: 24 }}>
                {modalNotice && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setModalNotice(null)}>
                    {modalNotice}
                  </Alert>
                )}

                {/* Key Nickname / Label */}
                <div className="JobRoleManagement-form-group" style={{ marginBottom: 18 }}>
                  <label className="JobRoleManagement-form-label">Key Nickname / Label *</label>
                  <input
                    type="text"
                    className="JobRoleManagement-form-input"
                    placeholder="e.g. Main Production Account, Backup 429, Dev Account"
                    value={newVaultKey.label}
                    onChange={(e) => setNewVaultKey({ ...newVaultKey, label: e.target.value })}
                    required
                  />
                </div>

                {/* API Key */}
                <div className="JobRoleManagement-form-group" style={{ marginBottom: 18 }}>
                  <label className="JobRoleManagement-form-label">Groq API Key *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewVaultKey ? "text" : "password"}
                      className="JobRoleManagement-form-input"
                      placeholder="gsk_..."
                      value={newVaultKey.apiKey}
                      onChange={(e) => setNewVaultKey({ ...newVaultKey, apiKey: e.target.value })}
                      required
                      style={{ paddingRight: 40 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setShowNewVaultKey(!showNewVaultKey)}
                      style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }}
                    >
                      {showNewVaultKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </div>
                  <small style={{ color: "#64748b", fontSize: "11.5px", marginTop: 4, display: "block" }}>
                    Key will be securely stored and tested against Groq's live API.
                  </small>
                </div>

                {/* Instant Activation Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newVaultKey.setAsPrimary}
                      onChange={(e) => setNewVaultKey({
                        ...newVaultKey,
                        setAsPrimary: e.target.checked,
                        setAsSecondary: e.target.checked ? false : newVaultKey.setAsSecondary,
                      })}
                    />
                    <span><strong>Set as Active Primary Key immediately</strong> (starts using it now)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newVaultKey.setAsSecondary}
                      onChange={(e) => setNewVaultKey({
                        ...newVaultKey,
                        setAsSecondary: e.target.checked,
                        setAsPrimary: e.target.checked ? false : newVaultKey.setAsPrimary,
                      })}
                    />
                    <span>Set as Secondary Fallback Key (for 429 auto-failover)</span>
                  </label>
                </div>
              </div>

              <div className="JobRoleManagement-modal-footer">
                <div className="JobRoleManagement-modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button
                    type="button"
                    className="JobRoleManagement-btn-secondary"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={addingToVault}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="JobRoleManagement-btn-primary"
                    disabled={addingToVault}
                  >
                    {addingToVault ? "Validating & Saving..." : "Save to Vault"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
