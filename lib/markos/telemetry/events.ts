export type MarkOSTelemetryEvent = {
  name:
    | "onboarding_started"
    | "onboarding_page_view"
    | "onboarding_form_started"
    | "onboarding_completed"
    | "onboarding_step_completed"
    | "business_model_selected"
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
    | "plugin_dashboard_view"
    | "rollout_endpoint_observed"
    | "approval_completed"
    | "execution_readiness_ready"
    | "execution_readiness_blocked"
    | "execution_failure"
    | "execution_loop_completed"
    | "execution_loop_abandoned"
    | "markos_agent_run_provider_attempt"
    | "markos_agent_run_close_completed"
    | "markos_agent_run_close_incomplete"
    | "markos_tracking_ingest_received"
    | "markos_tracking_ingest_denied"
    | "markos_crm_workspace_viewed"
    | "markos_crm_record_opened"
    | "markos_crm_stage_changed"
    | "markos_crm_field_updated"
    | "markos_crm_calendar_rescheduled"
    | "markos_crm_funnel_opened"
    | "markos_crm_execution_queue_opened"
    | "markos_crm_recommendation_viewed"
    | "markos_crm_execution_action_taken"
    | "markos_crm_recommendation_dismissed"
    | "markos_crm_draft_suggestion_viewed"
    | "markos_crm_copilot_context_viewed"
    | "markos_crm_copilot_summary_generated"
    | "markos_crm_copilot_recommendation_packaged"
    | "markos_crm_copilot_package_approved"
    | "markos_crm_copilot_package_rejected"
    | "markos_crm_copilot_playbook_started"
    | "markos_crm_copilot_playbook_resumed"
    | "markos_crm_copilot_mutation_committed"
    | "markos_crm_copilot_oversight_reviewed"
    | "markos_crm_reporting_viewed"
    | "markos_crm_reporting_readiness_inspected"
    | "markos_crm_attribution_drilldown_opened"
    | "crm_outbound_compose_started"
    | "crm_outbound_send_requested"
    | "crm_outbound_send_blocked"
    | "crm_outbound_send_approved"
    | "crm_outbound_reply_recorded"
    | "crm_outbound_opt_out_recorded"
    | "crm_outbound_conversation_viewed";
  workspaceId: string;
  role: string;
  requestId: string;
  payload: Record<string, unknown>;
};

export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const blocked = ["authorization", "token", "password", "secret", "service_role_key"];

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
