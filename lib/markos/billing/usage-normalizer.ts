import type { BillingUsageEvent } from './contracts';

'use strict';

const usageNormalizerCrypto = require('node:crypto');

type UsageDedupeKeyParts = {
  source_type: string;
  tenant_id: string;
  correlation_id: string;
  unit_type: string;
  source_payload_ref: string;
  plugin_id?: unknown;
  operation_name?: unknown;
  attempt_number?: unknown;
};

function assertString(value, fieldName) {
  if (!String(value || '').trim()) {
    throw new Error(`BILLING_INPUT_INVALID:${fieldName}`);
  }
  return String(value).trim();
}

function assertFiniteNumber(value, fieldName) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`BILLING_INPUT_INVALID:${fieldName}`);
  }
  return numeric;
}

function assertMeasuredAt(value) {
  const measuredAt = assertString(value, 'measured_at');
  if (Number.isNaN(Date.parse(measuredAt))) {
    throw new Error('BILLING_INPUT_INVALID:measured_at');
  }
  return measuredAt;
}

function toMonthPeriod(measuredAt) {
  const date = new Date(measuredAt);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString();
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
  return {
    billing_period_start: start,
    billing_period_end: end,
  };
}

function buildUsageDedupeKey(parts: Partial<UsageDedupeKeyParts> & Record<string, unknown> = {}) {
  const normalized = [
    assertString(parts.source_type, 'source_type'),
    assertString(parts.tenant_id, 'tenant_id'),
    assertString(parts.correlation_id, 'correlation_id'),
    assertString(parts.unit_type, 'unit_type'),
    assertString(parts.source_payload_ref, 'source_payload_ref'),
    String(parts.plugin_id || '').trim(),
    String(parts.operation_name || '').trim(),
    String(parts.attempt_number || '').trim(),
  ].join('|');

  return usageNormalizerCrypto.createHash('sha256').update(normalized).digest('hex');
}

function buildUsageEventId(sourceEventKey) {
  return `usage:${sourceEventKey.slice(0, 24)}`;
}

function normalizePluginUsageEvent(rawEvent: Record<string, unknown> = {}): BillingUsageEvent {
  if (rawEvent.event_name !== 'plugin_operation') {
    throw new Error('BILLING_INPUT_INVALID:event_name');
  }

  const tenantId = assertString(rawEvent.tenant_id, 'tenant_id');
  const correlationId = assertString(rawEvent.correlation_id, 'correlation_id');
  const pluginId = assertString(rawEvent.plugin_id, 'plugin_id');
  const operationName = assertString(rawEvent.operation_name, 'operation_name');
  const measuredAt = assertMeasuredAt(rawEvent.timestamp);
  const period = toMonthPeriod(measuredAt);
  const sourcePayloadRef = `plugin:${pluginId}:${operationName}:${correlationId}`;
  const sourceEventKey = buildUsageDedupeKey({
    source_type: 'plugin_operation',
    tenant_id: tenantId,
    correlation_id: correlationId,
    unit_type: 'plugin_operation',
    source_payload_ref: sourcePayloadRef,
    plugin_id: pluginId,
    operation_name: operationName,
  });

  return Object.freeze({
    usage_event_id: buildUsageEventId(sourceEventKey),
    tenant_id: tenantId,
    correlation_id: correlationId,
    billing_period_start: period.billing_period_start,
    billing_period_end: period.billing_period_end,
    unit_type: 'plugin_operation',
    quantity: 1,
    source_type: 'plugin_operation',
    source_event_key: sourceEventKey,
    source_payload_ref: sourcePayloadRef,
    provider_context: null,
    pricing_key: `plugin_operation.${pluginId}.${operationName}`,
    measured_at: measuredAt,
    raw_lineage: Object.freeze({
      actor_id: assertString(rawEvent.actor_id, 'actor_id'),
      brand_pack_version: assertString(rawEvent.brand_pack_version, 'brand_pack_version'),
      plugin_id: pluginId,
      operation_name: operationName,
    }),
  });
}

function inferAgentSourceType(rawEvent: Record<string, unknown> = {}): 'agent_run_close' | 'agent_provider_attempt' {
  if (rawEvent.prompt_version || rawEvent.tool_events) {
    return 'agent_run_close';
  }
  if (rawEvent.attempt_number || rawEvent.token_usage) {
    return 'agent_provider_attempt';
  }
  throw new Error('BILLING_INPUT_INVALID:agent_source_type');
}

function normalizeAgentRunUsageEvent(rawEvent: Record<string, unknown> = {}): BillingUsageEvent[] {
  const sourceType = inferAgentSourceType(rawEvent);
  const tenantId = assertString(rawEvent.tenant_id, 'tenant_id');
  const runId = assertString(rawEvent.run_id, 'run_id');
  const measuredAt = assertMeasuredAt(rawEvent.measured_at);
  const period = toMonthPeriod(measuredAt);
  const correlationId = String(rawEvent.correlation_id || '').trim() || `run:${runId}`;

  if (sourceType === 'agent_run_close') {
    assertString(rawEvent.model, 'model');
    assertString(rawEvent.prompt_version, 'prompt_version');
    if (!Array.isArray(rawEvent.tool_events) || rawEvent.tool_events.length === 0) {
      throw new Error('BILLING_INPUT_INVALID:tool_events');
    }
    assertFiniteNumber(rawEvent.latency_ms, 'latency_ms');
    assertFiniteNumber(rawEvent.cost_usd, 'cost_usd');
    assertString(rawEvent.outcome, 'outcome');

    const sourcePayloadRef = `run:${runId}`;
    const sourceEventKey = buildUsageDedupeKey({
      source_type: 'agent_run_close',
      tenant_id: tenantId,
      correlation_id: correlationId,
      unit_type: 'agent_run',
      source_payload_ref: sourcePayloadRef,
    });

    return [Object.freeze({
      usage_event_id: buildUsageEventId(sourceEventKey),
      tenant_id: tenantId,
      correlation_id: correlationId,
      billing_period_start: period.billing_period_start,
      billing_period_end: period.billing_period_end,
      unit_type: 'agent_run',
      quantity: 1,
      source_type: 'agent_run_close',
      source_event_key: sourceEventKey,
      source_payload_ref: sourcePayloadRef,
      provider_context: Object.freeze({
        provider: String(rawEvent.provider || 'unknown'),
        model: assertString(rawEvent.model, 'model'),
      }),
      pricing_key: 'agent_run.base',
      measured_at: measuredAt,
      raw_lineage: Object.freeze({
        outcome: rawEvent.outcome,
        prompt_version: rawEvent.prompt_version,
        run_id: runId,
      }),
    })];
  }

  const attemptNumber = Math.max(1, Math.trunc(assertFiniteNumber(rawEvent.attempt_number, 'attempt_number')));
  const tokenUsage: Record<string, unknown> =
    rawEvent.token_usage && typeof rawEvent.token_usage === 'object' && !Array.isArray(rawEvent.token_usage)
      ? rawEvent.token_usage as Record<string, unknown>
      : {};
  const inputTokens = Number(tokenUsage.input_tokens);
  const outputTokens = Number(tokenUsage.output_tokens);
  const events = [];
  const sourcePayloadRef = `run:${runId}:attempt:${attemptNumber}`;
  const provider = assertString(rawEvent.provider, 'provider');
  const model = assertString(rawEvent.model, 'model');

  if (Number.isFinite(inputTokens) && inputTokens > 0) {
    const sourceEventKey = buildUsageDedupeKey({
      source_type: 'agent_provider_attempt',
      tenant_id: tenantId,
      correlation_id: correlationId,
      unit_type: 'token_input',
      source_payload_ref: sourcePayloadRef,
      attempt_number: attemptNumber,
    });
    events.push(Object.freeze({
      usage_event_id: buildUsageEventId(sourceEventKey),
      tenant_id: tenantId,
      correlation_id: correlationId,
      billing_period_start: period.billing_period_start,
      billing_period_end: period.billing_period_end,
      unit_type: 'token_input',
      quantity: inputTokens,
      source_type: 'agent_provider_attempt',
      source_event_key: sourceEventKey,
      source_payload_ref: sourcePayloadRef,
      provider_context: Object.freeze({ provider, model }),
      pricing_key: `token_input.${provider}.${model}`,
      measured_at: measuredAt,
      raw_lineage: Object.freeze({ attempt_number: attemptNumber, run_id: runId }),
    }));
  }

  if (Number.isFinite(outputTokens) && outputTokens > 0) {
    const sourceEventKey = buildUsageDedupeKey({
      source_type: 'agent_provider_attempt',
      tenant_id: tenantId,
      correlation_id: correlationId,
      unit_type: 'token_output',
      source_payload_ref: sourcePayloadRef,
      attempt_number: attemptNumber,
    });
    events.push(Object.freeze({
      usage_event_id: buildUsageEventId(sourceEventKey),
      tenant_id: tenantId,
      correlation_id: correlationId,
      billing_period_start: period.billing_period_start,
      billing_period_end: period.billing_period_end,
      unit_type: 'token_output',
      quantity: outputTokens,
      source_type: 'agent_provider_attempt',
      source_event_key: sourceEventKey,
      source_payload_ref: sourcePayloadRef,
      provider_context: Object.freeze({ provider, model }),
      pricing_key: `token_output.${provider}.${model}`,
      measured_at: measuredAt,
      raw_lineage: Object.freeze({ attempt_number: attemptNumber, run_id: runId }),
    }));
  }

  if (events.length === 0) {
    throw new Error('BILLING_INPUT_INVALID:token_usage');
  }

  return events;
}

module.exports = {
  normalizePluginUsageEvent,
  normalizeAgentRunUsageEvent,
  buildUsageDedupeKey,
};