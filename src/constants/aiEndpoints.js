/**
 * AI Endpoint Constants
 * Single source of truth for all AI-related backend endpoints.
 * Must match routes registered in CIISBackend/routes/aiRoutes.js.
 */
export const AI_ENDPOINTS = Object.freeze({
  TASK_AGENT_ENTITLEMENT: '/ai/task-agent/entitlement',
  TASK_AGENT_PARSE: '/ai/task-agent/parse',
  TRANSCRIBE: '/ai/transcribe',
  PARSE_CSV: '/ai/task-agent/parse-csv',
  BULK_CREATE: '/ai/task-agent/bulk-create',
});
