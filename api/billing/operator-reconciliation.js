'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { buildBillingLifecycleEvidence, reconcileInvoiceLineItems } = require('../../lib/markos/billing/reconciliation.cjs');
const { deriveProviderSyncOutcome } = require('../../lib/markos/billing/provider-sync.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function buildLedgerRow(tenantId) {
  return {
    ledger_row_id: 'ledger-row-operator-billing',
    tenant_id: tenantId,
    billing_period_start: '2026-04-01T00:00:00.000Z',
    billing_period_end: '2026-04-30T23:59:59.999Z',
    unit_type: 'agent_run',
    aggregated_quantity: 12,
    pricing_key: 'agent_run.base',
    unit_amount_usd: 12.5,
    amount_usd: 150,
  };
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

  const tenantId = auth.tenant_id || 'tenant-alpha-001';
  const ledgerRows = [buildLedgerRow(tenantId)];
  const reconciled = reconcileInvoiceLineItems({ ledger_rows: ledgerRows, existing_line_items: [] });
  const failedOutcome = deriveProviderSyncOutcome({
    line_items: reconciled.line_items,
    tenant_id: tenantId,
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'INVOICE_FINALIZATION_FAILED',
    sync_attempt_id: 'sync-attempt-operator-failed-001',
  });
  const restoredOutcome = deriveProviderSyncOutcome({
    line_items: reconciled.line_items,
    tenant_id: tenantId,
    provider: 'stripe',
    sync_status: 'succeeded',
    sync_attempt_id: 'sync-attempt-operator-restored-001',
    previous_sync_attempts: [failedOutcome.sync_attempt],
    hold_history: failedOutcome.hold_history,
    active_hold: failedOutcome.hold_interval,
  });
  const failedLifecycle = buildBillingLifecycleEvidence({ sync_outcome: failedOutcome });
  const restoredLifecycle = buildBillingLifecycleEvidence({ sync_outcome: restoredOutcome });
  const incidentId = 'INC-BILLING-SYNC-2026-04-03-001';

  return writeJson(res, 200, {
    success: true,
    incident_context: {
      incident_id: incidentId,
      severity: 'SEV-2',
      detection_source: 'billing_provider_sync_attempt_failed',
      first_detected_at: '2026-04-03T00:00:00.000Z',
      impacted_tenants: [tenantId],
      impacted_workflows: ['execute_task', 'premium_plugin_actions', 'billing_reconciliation_review'],
      mitigation_path: 'keep_read_and_reconciliation_surfaces_open_while_hold_blocks_protected_mutations',
      communication_owner: 'billing-admin',
      communication_audiences: ['tenant-billing-admin', 'operator-billing-admin'],
      communication_cadence: 'initial triage, mitigation update, restoration confirmation',
      recovery_criteria: [
        'successful same-period provider sync',
        'release_events contains hold_released evidence',
        'active_snapshots include restored active state',
      ],
    },
    reconciliation_items: [
      {
        tenant: tenantId,
        billing_period: 'April 2026',
        plan: 'growth-monthly',
        usage_status: 'review',
        invoice_status: 'pending',
        provider_sync_state: failedOutcome.sync_status,
        hold_state: failedOutcome.billing_state,
        last_reconciled_at: '2026-04-03T00:00:00.000Z',
      },
      {
        tenant: tenantId,
        billing_period: 'April 2026',
        plan: 'growth-monthly',
        usage_status: 'restored',
        invoice_status: 'reconciled',
        provider_sync_state: restoredOutcome.sync_status,
        hold_state: restoredOutcome.recovery_state,
        last_reconciled_at: '2026-04-03T18:30:00.000Z',
      },
    ],
    invoice_line_items: reconciled.line_items,
    hold_history: failedLifecycle.hold_history,
    release_events: restoredLifecycle.release_event ? [restoredLifecycle.release_event] : [],
    active_snapshots: [failedLifecycle.current_snapshot, restoredLifecycle.current_snapshot],
    sync_failures: [failedOutcome],
  });
};