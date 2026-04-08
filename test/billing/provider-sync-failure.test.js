const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  buildBillingHoldEvent,
  buildInvoiceLineItem,
  buildProviderSyncAttempt,
} = require('../helpers/billing-fixtures.cjs');
const { withMockedModule } = require('../setup.js');
const {
  deriveProviderSyncOutcome,
} = require('../../lib/markos/billing/provider-sync.cjs');

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = '') {
      this.body += chunk || '';
    },
  };
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('BIL-04: failed provider sync opens an append-only hold interval with linked sync evidence', () => {
  const outcome = deriveProviderSyncOutcome({
    line_items: [buildInvoiceLineItem()],
    tenant_id: 'tenant-alpha-001',
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'PAYMENT_METHOD_DECLINED',
    sync_attempt_id: 'sync-attempt-failed-001',
  });

  assert.equal(outcome.billing_state, 'hold');
  assert.equal(outcome.reason_code, 'PAYMENT_METHOD_DECLINED');
  assert.equal(outcome.read_access_preserved, true);
  assert.equal(outcome.sync_attempt.sync_attempt_id, 'sync-attempt-failed-001');
  assert.equal(outcome.hold_history.length, 1);
  assert.equal(outcome.hold_history[0].event_type, 'hold_opened');
  assert.equal(outcome.hold_interval.active, true);
  assert.equal(outcome.current_snapshot.status, 'hold');
  assert.equal(outcome.current_snapshot.reason_code, 'PAYMENT_METHOD_DECLINED');
});

test('BIL-04: first successful sync in the same billing period releases the hold with explicit evidence', () => {
  const failedOutcome = deriveProviderSyncOutcome({
    line_items: [buildInvoiceLineItem()],
    tenant_id: 'tenant-alpha-001',
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'INVOICE_FINALIZATION_FAILED',
    sync_attempt_id: 'sync-attempt-failed-002',
  });

  const restoredOutcome = deriveProviderSyncOutcome({
    line_items: [buildInvoiceLineItem()],
    tenant_id: 'tenant-alpha-001',
    provider: 'stripe',
    sync_status: 'succeeded',
    sync_attempt_id: 'sync-attempt-restored-001',
    previous_sync_attempts: [failedOutcome.sync_attempt],
    hold_history: failedOutcome.hold_history,
    active_hold: failedOutcome.hold_interval,
  });

  assert.equal(restoredOutcome.billing_state, 'active');
  assert.equal(restoredOutcome.release_event?.event_type, 'hold_released');
  assert.equal(restoredOutcome.release_event?.released_by_sync_attempt_id, 'sync-attempt-restored-001');
  assert.equal(restoredOutcome.restored_snapshot?.status, 'active');
  assert.equal(restoredOutcome.hold_history.length, 2);
  assert.equal(restoredOutcome.hold_interval?.hold_state, 'released');
});

test('BIL-04: success outside the active hold window does not silently fabricate release evidence', () => {
  const outcome = deriveProviderSyncOutcome({
    line_items: [buildInvoiceLineItem()],
    tenant_id: 'tenant-alpha-001',
    provider: 'stripe',
    sync_status: 'succeeded',
    sync_attempt_id: 'sync-attempt-clean-001',
    previous_sync_attempts: [buildProviderSyncAttempt()],
    hold_history: [buildBillingHoldEvent()],
    active_hold: {
      ...buildBillingHoldEvent(),
      billing_period_start: '2026-03-01T00:00:00.000Z',
      billing_period_end: '2026-03-31T23:59:59.999Z',
    },
  });

  assert.equal(outcome.billing_state, 'active');
  assert.equal(outcome.release_event, null);
  assert.equal(outcome.restored_snapshot, null);
  assert.equal(outcome.current_snapshot.status, 'active');
});

test('BIL-04: billing evidence APIs expose incident context for triage and recovery review', async () => {
  const runtimeContextPath = path.resolve(__dirname, '../../onboarding/backend/runtime-context.cjs');
  const iamPath = path.resolve(__dirname, '../../lib/markos/rbac/iam-v32.js');
  const holdsPath = path.resolve(__dirname, '../../api/billing/holds.js');
  const tenantSummaryPath = path.resolve(__dirname, '../../api/billing/tenant-summary.js');
  const operatorPath = path.resolve(__dirname, '../../api/billing/operator-reconciliation.js');

  await withMockedModule(runtimeContextPath, {
    createRuntimeContext: () => ({ runtime_mode: 'hosted' }),
    requireHostedSupabaseAuth: () => ({
      ok: true,
      tenant_id: 'tenant-alpha-001',
      iamRole: 'billing-admin',
      role: 'billing-admin',
      principal: { tenant_role: 'billing-admin' },
    }),
  }, async () => {
    await withMockedModule(iamPath, {
      canPerformAction: () => true,
    }, async () => {
      const holdsHandler = loadFreshModule(holdsPath);
      const tenantSummaryHandler = loadFreshModule(tenantSummaryPath);
      const operatorHandler = loadFreshModule(operatorPath);

      const holdsRes = createMockResponse();
      await holdsHandler({ method: 'GET', headers: {} }, holdsRes);
      const holdsPayload = JSON.parse(holdsRes.body);

      assert.equal(holdsRes.statusCode, 200);
      assert.equal(holdsPayload.incident_context.incident_id, 'INC-BILLING-SYNC-2026-04-03-001');
      assert.deepEqual(holdsPayload.incident_context.impacted_workflows, ['execute_task', 'premium_plugin_actions', 'billing_reconciliation_review']);
      assert.match(holdsPayload.incident_context.recovery_criteria.join(' '), /restored_snapshot/i);

      const tenantRes = createMockResponse();
      await tenantSummaryHandler({ method: 'GET', headers: {} }, tenantRes);
      const tenantPayload = JSON.parse(tenantRes.body);

      assert.equal(tenantRes.statusCode, 200);
      assert.equal(tenantPayload.incident_context.severity, 'SEV-2');
      assert.deepEqual(tenantPayload.incident_context.communication_audiences, ['tenant-billing-admin']);
      assert.equal(tenantPayload.recovery_evidence.restored_active_snapshot, true);

      const operatorRes = createMockResponse();
      await operatorHandler({ method: 'GET', headers: {} }, operatorRes);
      const operatorPayload = JSON.parse(operatorRes.body);

      assert.equal(operatorRes.statusCode, 200);
      assert.equal(operatorPayload.incident_context.communication_owner, 'billing-admin');
      assert.deepEqual(operatorPayload.incident_context.impacted_tenants, ['tenant-alpha-001']);
      assert.match(operatorPayload.incident_context.recovery_criteria.join(' '), /release_events|active state/i);
    });
  });
});