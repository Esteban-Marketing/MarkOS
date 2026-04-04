'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { reconcileInvoiceLineItems } = require('../../lib/markos/billing/reconciliation.cjs');
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
  const syncOutcome = deriveProviderSyncOutcome({
    line_items: reconciled.line_items,
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'INVOICE_FINALIZATION_FAILED',
  });

  return writeJson(res, 200, {
    success: true,
    reconciliation_items: [
      {
        tenant: tenantId,
        billing_period: 'April 2026',
        plan: 'growth-monthly',
        usage_status: 'review',
        invoice_status: 'pending',
        provider_sync_state: syncOutcome.sync_status,
        hold_state: syncOutcome.billing_state,
        last_reconciled_at: '2026-04-03T00:00:00.000Z',
      },
    ],
    invoice_line_items: reconciled.line_items,
    hold_history: syncOutcome.hold_history,
    sync_failures: [syncOutcome],
  });
};