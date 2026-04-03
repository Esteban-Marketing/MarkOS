export type MarkOSTelemetryEvent = {
  name:
    | "markos_ui_view_loaded"
    | "markos_entity_opened"
    | "markos_entity_validation_failed"
    | "markos_entity_saved"
    | "markos_entity_published"
    | "markos_theme_changed"
    | "markos_access_denied"
    | "markos_tenant_access_denied"
    | "markos_ai_snapshot_generated"
    | "markos_ai_snapshot_read"
    | "markos_task_step_executed"
    | "markos_task_step_approved"
    | "markos_task_step_rejected"
    | "markos_task_step_retried"
    | "markos_llm_call_completed"
    | "markos_llm_budget_80_percent"
    | "markos_llm_budget_100_percent"
    // Phase 52 — Plugin runtime telemetry (D-06)
    | "plugin_operation"
    | "plugin_access_denied"
    | "plugin_campaign_published"
    | "plugin_draft_read"
    | "plugin_approval_granted"
    | "plugin_dashboard_view";
  workspaceId: string;
  role: string;
  requestId: string;
  payload: Record<string, unknown>;
};

export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const blocked = ["token", "password", "secret", "service_role_key"];

  for (const [key, value] of Object.entries(payload)) {
    const lowered = key.toLowerCase();
    if (blocked.some((needle) => lowered.includes(needle))) {
      output[key] = "[REDACTED]";
      continue;
    }
    output[key] = value;
  }

  return output;
}

export function buildEvent(event: MarkOSTelemetryEvent): MarkOSTelemetryEvent {
  return {
    ...event,
    payload: sanitizePayload(event.payload),
  };
}
