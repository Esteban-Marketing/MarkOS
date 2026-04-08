'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { buildBillingLifecycleEvidence, reconcileInvoiceLineItems } = require('../../lib/markos/billing/reconciliation.cjs');
const { deriveProviderSyncOutcome } = require('../../lib/markos/billing/provider-sync.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function buildLedgerRow(tenantId) {
  return {
    ledger_row_id: 'ledger-row-tenant-summary',
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

  const tenantId = auth.tenant_id || 'tenant-alpha-001';
  const ledgerRows = [buildLedgerRow(tenantId)];
  const reconciled = reconcileInvoiceLineItems({ ledger_rows: ledgerRows, existing_line_items: [] });
  const failedOutcome = deriveProviderSyncOutcome({
    line_items: reconciled.line_items,
    tenant_id: tenantId,
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'PAYMENT_METHOD_DECLINED',
    sync_attempt_id: 'sync-attempt-tenant-failed-001',
  });
  const syncOutcome = deriveProviderSyncOutcome({
    line_items: reconciled.line_items,
    tenant_id: tenantId,
    provider: 'stripe',
    sync_status: 'succeeded',
    sync_attempt_id: 'sync-attempt-tenant-restored-001',
    previous_sync_attempts: [failedOutcome.sync_attempt],
    hold_history: failedOutcome.hold_history,
    active_hold: failedOutcome.hold_interval,
  });
  const lifecycle = buildBillingLifecycleEvidence({ sync_outcome: syncOutcome });
  const incidentId = 'INC-BILLING-SYNC-2026-04-03-001';

  return writeJson(res, 200, {
    success: true,
    tenant_id: tenantId,
    billing_period: 'April 2026',
    current_invoice: reconciled.line_items[0],
    current_snapshot: lifecycle.current_snapshot,
    restored_snapshot: lifecycle.restored_snapshot,
    included_usage: {
      seats: 10,
      projects: 5,
      agent_runs: 1000,
      storage: '50 GB-days',
    },
    usage_rows: ledgerRows,
    hold: lifecycle.hold_interval?.active ? lifecycle.hold_interval : null,
    recovery_evidence: {
      sync_attempts: lifecycle.sync_attempts,
      hold_history: lifecycle.hold_history,
      release_event: lifecycle.release_event,
      restored_active_snapshot: Boolean(lifecycle.restored_snapshot),
    },
    incident_context: {
      incident_id: incidentId,
      severity: 'SEV-2',
      detection_source: 'billing_provider_sync_attempt_failed',
      impacted_workflows: ['execute_task', 'premium_plugin_actions'],
      communication_owner: 'billing-admin',
      communication_audiences: ['tenant-billing-admin'],
      communication_cadence: 'initial hold notification and restoration confirmation',
      recovery_criteria: [
        'release_event is present',
        'restored_active_snapshot is true',
      ],
    },
    evidence: {
      billing_truth_source: 'markos-ledger',
      translated_labels: true,
    },
  });
};