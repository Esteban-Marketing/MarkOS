const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  buildBillingUsageEvent,
} = require('../helpers/billing-fixtures.cjs');
const { emitPluginOperation } = require('../../lib/markos/plugins/telemetry.js');
const { captureProviderAttempt, captureRunClose } = require('../../onboarding/backend/agents/telemetry.cjs');

const billingContractsPath = path.join(__dirname, '../../lib/markos/billing/contracts.ts');
const usageNormalizerPath = path.join(__dirname, '../../lib/markos/billing/usage-normalizer.ts');

function loadTsCommonJsModule(filePath) {
  const ts = require('typescript');
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filePath,
  });
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${outputText}\n})`, {
    filename: filePath.replace(/\.ts$/, '.js'),
  });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      return require(path.resolve(path.dirname(filePath), specifier));
    }
    return require(specifier);
  };

  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

const {
  normalizePluginUsageEvent,
  normalizeAgentRunUsageEvent,
  buildUsageDedupeKey,
} = loadTsCommonJsModule(usageNormalizerPath);

test('BIL-02: billing contracts export canonical usage and invoice contract vocabulary', () => {
  const source = fs.readFileSync(billingContractsPath, 'utf8');

  assert.match(source, /export type BillingUsageEvent/);
  assert.match(source, /export type BillingUsageLedgerRow/);
  assert.match(source, /export type EntitlementSnapshot/);
  assert.match(source, /export type InvoiceLineItem/);
  assert.match(source, /source_event_key/);
  assert.match(source, /correlation_id/);
});

test('BIL-02: usage event fixture preserves MarkOS-ledger lineage keys and provider context', () => {
  const usageEvent = buildBillingUsageEvent({
    source_type: 'agent_run_close',
    provider_context: {
      provider: 'openai',
      model: 'gpt-4o-mini',
    },
  });

  assert.equal(usageEvent.tenant_id, 'tenant-alpha-001');
  assert.equal(usageEvent.correlation_id, 'corr-billing-001');
  assert.equal(usageEvent.source_event_key, 'run-close:tenant-alpha-001:corr-billing-001:agent_run');
  assert.equal(usageEvent.source_payload_ref, 'run:run-001');
  assert.deepEqual(usageEvent.provider_context, {
    provider: 'openai',
    model: 'gpt-4o-mini',
  });
});

test('BIL-02: usage event fixture encodes billing period boundaries for later aggregation', () => {
  const usageEvent = buildBillingUsageEvent();

  assert.equal(usageEvent.billing_period_start, '2026-04-01T00:00:00.000Z');
  assert.equal(usageEvent.billing_period_end, '2026-04-30T23:59:59.999Z');
  assert.equal(usageEvent.quantity, 1);
});

test('BIL-02: buildUsageDedupeKey is deterministic across plugin retries and payload variance', () => {
  const firstKey = buildUsageDedupeKey({
    source_type: 'plugin_operation',
    tenant_id: 'tenant-alpha-001',
    correlation_id: 'corr-plugin-001',
    plugin_id: 'digital-agency-v1',
    operation_name: 'publish_campaign',
    unit_type: 'plugin_operation',
    source_payload_ref: 'plugin:digital-agency-v1:publish_campaign:corr-plugin-001',
    quantity: 1,
    measured_at: '2026-04-03T18:30:00.000Z',
  });

  const retryKey = buildUsageDedupeKey({
    quantity: 99,
    measured_at: '2026-04-03T18:31:00.000Z',
    source_payload_ref: 'plugin:digital-agency-v1:publish_campaign:corr-plugin-001',
    unit_type: 'plugin_operation',
    operation_name: 'publish_campaign',
    plugin_id: 'digital-agency-v1',
    correlation_id: 'corr-plugin-001',
    tenant_id: 'tenant-alpha-001',
    source_type: 'plugin_operation',
  });

  assert.equal(firstKey, retryKey);
});

test('BIL-02: normalizePluginUsageEvent emits canonical MarkOS-owned usage events with lineage', () => {
  const rawPluginEvent = emitPluginOperation({
    tenantId: 'tenant-alpha-001',
    actorId: 'user-001',
    pluginId: 'digital-agency-v1',
    correlationId: 'corr-plugin-001',
    operationName: 'publish_campaign',
    payload: { campaignId: 'cmp-001', secret: 'hidden' },
    brandPackVersion: 'bp-v1',
  });

  const usageEvent = normalizePluginUsageEvent(rawPluginEvent);

  assert.equal(usageEvent.tenant_id, 'tenant-alpha-001');
  assert.equal(usageEvent.correlation_id, 'corr-plugin-001');
  assert.equal(usageEvent.unit_type, 'plugin_operation');
  assert.equal(usageEvent.quantity, 1);
  assert.equal(usageEvent.source_type, 'plugin_operation');
  assert.equal(usageEvent.source_payload_ref, 'plugin:digital-agency-v1:publish_campaign:corr-plugin-001');
  assert.equal(usageEvent.provider_context, null);
  assert.match(usageEvent.pricing_key, /^plugin_operation\./);
  assert.deepEqual(usageEvent.raw_lineage, {
    actor_id: 'user-001',
    brand_pack_version: 'bp-v1',
    plugin_id: 'digital-agency-v1',
    operation_name: 'publish_campaign',
  });
});

test('BIL-02: normalizeAgentRunUsageEvent emits agent-run and token usage events with deterministic lineage', () => {
  const runCloseInput = {
    run_id: 'run-001',
    tenant_id: 'tenant-alpha-001',
    project_slug: 'markos',
    model: 'gpt-4o-mini',
    prompt_version: 'prompt-v1',
    tool_events: [{ tool: 'write-msp', outcome: 'success' }],
    latency_ms: 928,
    cost_usd: 0.41,
    outcome: 'completed',
    error_count: 0,
    measured_at: '2026-04-03T18:30:00.000Z',
  };
  const providerAttemptInput = {
    run_id: 'run-001',
    tenant_id: 'tenant-alpha-001',
    project_slug: 'markos',
    agent_name: 'mir-filler',
    attempt_number: 2,
    provider: 'openai',
    model: 'gpt-4o-mini',
    outcome_state: 'completed',
    latency_ms: 401,
    cost_usd: 0.18,
    token_usage: { input_tokens: 120, output_tokens: 45 },
    measured_at: '2026-04-03T18:30:00.000Z',
    correlation_id: 'corr-run-001',
  };

  captureRunClose(runCloseInput);
  captureProviderAttempt(providerAttemptInput);

  const runCloseUsage = normalizeAgentRunUsageEvent(runCloseInput);
  const providerUsage = normalizeAgentRunUsageEvent(providerAttemptInput);

  assert.equal(runCloseUsage.length, 1);
  assert.equal(runCloseUsage[0].unit_type, 'agent_run');
  assert.equal(runCloseUsage[0].source_type, 'agent_run_close');
  assert.equal(runCloseUsage[0].source_payload_ref, 'run:run-001');
  assert.equal(runCloseUsage[0].correlation_id, 'run:run-001');

  assert.equal(providerUsage.length, 2);
  assert.deepEqual(
    providerUsage.map((event) => event.unit_type).sort(),
    ['token_input', 'token_output']
  );
  assert.deepEqual(
    providerUsage.map((event) => event.quantity).sort((left, right) => left - right),
    [45, 120]
  );
  assert.ok(providerUsage.every((event) => event.source_payload_ref === 'run:run-001:attempt:2'));
  assert.ok(providerUsage.every((event) => event.correlation_id === 'corr-run-001'));
});

test('BIL-02: normalization rejects incomplete billing inputs instead of approximating units', () => {
  assert.throws(
    () => normalizePluginUsageEvent({ event_name: 'plugin_operation', tenant_id: 'tenant-alpha-001' }),
    /BILLING_INPUT_INVALID/
  );

  assert.throws(
    () => normalizeAgentRunUsageEvent({
      run_id: 'run-001',
      tenant_id: 'tenant-alpha-001',
      provider: 'openai',
      model: 'gpt-4o-mini',
      attempt_number: 1,
      measured_at: '2026-04-03T18:30:00.000Z',
      token_usage: {},
    }),
    /BILLING_INPUT_INVALID/
  );
});