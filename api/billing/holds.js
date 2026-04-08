'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { deriveProviderSyncOutcome } = require('../../lib/markos/billing/provider-sync.cjs');
const { buildBillingLifecycleEvidence } = require('../../lib/markos/billing/reconciliation.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }

  const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
  if (!canPerformAction(iamRole, 'manage_billing')) {
    return writeJson(res, 403, { success: false, error: 'BILLING_ADMIN_REQUIRED', message: 'manage_billing permission required' });
  }

  const failedOutcome = deriveProviderSyncOutcome({
    line_items: [],
    tenant_id: auth.tenant_id || 'tenant-alpha-001',
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'PAYMENT_METHOD_DECLINED',
    sync_attempt_id: 'sync-attempt-hold-001',
  });
  const restoredOutcome = deriveProviderSyncOutcome({
    line_items: [],
    tenant_id: auth.tenant_id || 'tenant-alpha-001',
    provider: 'stripe',
    sync_status: 'succeeded',
    sync_attempt_id: 'sync-attempt-release-001',
    previous_sync_attempts: [failedOutcome.sync_attempt],
    hold_history: failedOutcome.hold_history,
    active_hold: failedOutcome.hold_interval,
  });
  const lifecycle = buildBillingLifecycleEvidence({ sync_outcome: restoredOutcome });
  const incidentId = 'INC-BILLING-SYNC-2026-04-03-001';

  return writeJson(res, 200, {
    success: true,
    hold_events: lifecycle.hold_history,
    current_hold: lifecycle.hold_interval,
    release_event: lifecycle.release_event,
    current_snapshot: lifecycle.current_snapshot,
    restored_snapshot: lifecycle.restored_snapshot,
    incident_context: {
      incident_id: incidentId,
      severity: 'SEV-2',
      detection_source: 'billing_provider_sync_attempt_failed',
      first_detected_at: '2026-04-03T00:00:00.000Z',
      impacted_tenants: [auth.tenant_id || 'tenant-alpha-001'],
      impacted_workflows: ['execute_task', 'premium_plugin_actions', 'billing_reconciliation_review'],
      mitigation_path: 'preserve_read_access_and_billing_evidence_until_same_period_sync_restores_active_state',
      communication_owner: 'billing-admin',
      communication_audiences: ['tenant-billing-admin', 'operator-billing-admin'],
      communication_cadence: 'initial triage update and restoration confirmation',
      recovery_criteria: [
        'same-period provider sync succeeds',
        'hold_released evidence is recorded',
        'restored_snapshot shows active state',
      ],
    },
  });
};