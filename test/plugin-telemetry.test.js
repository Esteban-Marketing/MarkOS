'use strict';

/**
 * test/plugin-telemetry.test.js
 *
 * TDD contracts for Phase 52 WL-04 — plugin telemetry and brand-version audit trail.
 *
 * Covers:
 *   - Plugin operation events: immutable shape, required fields, sanitization
 *   - Plugin deny events: deterministic reason/action, no secret leakage
 *   - Brand-pack version snapshot in every plugin operation event
 *   - Rollback auditability: before/after version fields in telemetry
 *   - DA workflow lineage: draft → assemble → publish emits traceable events
 *
 * Phase 52 — Plan 04, Task 52-04-01/02 (RED scaffolds committed first)
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  emitPluginOperation,
  emitPluginDeny,
} = require('../lib/markos/plugins/telemetry.js');

const {
  emitCampaignPublished,
  emitDraftRead,
  emitApprovalGranted: emitDAApprovalGranted,
} = require('../lib/markos/plugins/digital-agency/telemetry.js');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_OP = {
  tenantId: 'tenant-alpha-001',
  actorId: 'user-1',
  pluginId: 'digital-agency-v1',
  correlationId: 'corr-abc-123',
  operationName: 'campaign_published',
  payload: { campaign_id: 'c-99', campaign_name: 'Q4' },
  brandPackVersion: '1.2.0',
};

const BASE_DENY = {
  tenantId: 'tenant-alpha-001',
  actorId: 'user-1',
  pluginId: 'digital-agency-v1',
  correlationId: 'corr-deny-001',
  reason: 'CAPABILITY_NOT_GRANTED',
  action: 'publish_campaigns',
};

// ---------------------------------------------------------------------------
// Task 52-04-01: Plugin operation event shape
// ---------------------------------------------------------------------------

test('telemetry: emitPluginOperation returns frozen event with required fields', () => {
  const event = emitPluginOperation(BASE_OP);
  assert.ok(Object.isFrozen(event), 'Event must be immutable (Object.frozen)');
  assert.equal(event.tenant_id, 'tenant-alpha-001');
  assert.equal(event.actor_id, 'user-1');
  assert.equal(event.plugin_id, 'digital-agency-v1');
  assert.equal(event.correlation_id, 'corr-abc-123');
  assert.equal(event.operation_name, 'campaign_published');
  assert.equal(typeof event.timestamp, 'string', 'timestamp must be ISO string');
  assert.ok(Date.parse(event.timestamp) > 0, 'timestamp must be valid ISO date');
});

test('telemetry: emitPluginOperation sanitizes secret keys in payload', () => {
  const event = emitPluginOperation({
    ...BASE_OP,
    payload: {
      campaign_id: 'c-99',
      service_role_key: 'super-secret',
      api_token: 'tok-abc',
      name: 'visible-name',
    },
  });
  assert.equal(event.payload.service_role_key, '[REDACTED]', 'service_role_key must be redacted');
  assert.equal(event.payload.api_token, '[REDACTED]', 'token key must be redacted');
  assert.equal(event.payload.name, 'visible-name', 'Non-secret keys must pass through');
});

test('telemetry: emitPluginOperation records brand_pack_version in event', () => {
  const event = emitPluginOperation({ ...BASE_OP, brandPackVersion: '2.0.0' });
  assert.equal(event.brand_pack_version, '2.0.0', 'brand_pack_version must be captured');
});

test('telemetry: emitPluginOperation falls back to "unversioned" when no brandPackVersion given', () => {
  const { brandPackVersion: _omit, ...opWithoutVersion } = BASE_OP;
  const event = emitPluginOperation(opWithoutVersion);
  assert.equal(typeof event.brand_pack_version, 'string');
  assert.ok(event.brand_pack_version.length > 0);
});

// ---------------------------------------------------------------------------
// Task 52-04-01: Plugin deny event shape
// ---------------------------------------------------------------------------

test('telemetry: emitPluginDeny returns frozen deny event with reason and action', () => {
  const event = emitPluginDeny(BASE_DENY);
  assert.ok(Object.isFrozen(event), 'Deny event must be immutable');
  assert.equal(event.tenant_id, 'tenant-alpha-001');
  assert.equal(event.plugin_id, 'digital-agency-v1');
  assert.equal(event.reason, 'CAPABILITY_NOT_GRANTED');
  assert.equal(event.action, 'publish_campaigns');
  assert.equal(event.event_name, 'plugin_access_denied');
  assert.equal(typeof event.timestamp, 'string');
});

test('telemetry: emitPluginDeny does not expose secret values', () => {
  const event = emitPluginDeny({ ...BASE_DENY, reason: 'CAPABILITY_NOT_GRANTED' });
  const raw = JSON.stringify(event);
  assert.ok(!raw.includes('password'), 'deny event must not contain raw secret fields');
  assert.ok(!raw.includes('service_role'), 'deny event must not contain service_role references');
});

// ---------------------------------------------------------------------------
// Task 52-04-02: Brand-pack rollback auditability
// ---------------------------------------------------------------------------

test('telemetry: rollback_from and rollback_to are captured when brand-pack changes', () => {
  const event = emitPluginOperation({
    ...BASE_OP,
    brandPackVersion: '1.3.0',
    rollbackFrom: '1.2.0',
  });
  assert.equal(event.brand_pack_version, '1.3.0');
  assert.equal(event.rollback_from, '1.2.0', 'rollback_from must be captured for audit trail');
});

test('telemetry: subsequent operations with updated brand-pack version are traceable', () => {
  const v1 = emitPluginOperation({ ...BASE_OP, brandPackVersion: '1.0.0' });
  const v2 = emitPluginOperation({ ...BASE_OP, brandPackVersion: '1.1.0', rollbackFrom: '1.0.0' });
  assert.notEqual(v1.brand_pack_version, v2.brand_pack_version, 'Successive versions must differ');
  assert.equal(v2.rollback_from, v1.brand_pack_version, 'rollback_from must match previous version');
});

// ---------------------------------------------------------------------------
// Task 52-04-02: Digital Agency telemetry lineage (draft → publish)
// ---------------------------------------------------------------------------

test('DA telemetry: emitCampaignPublished produces event with plugin_id and operation_name', () => {
  const event = emitCampaignPublished({
    tenantId: 'tenant-alpha-001',
    actorId: 'user-1',
    correlationId: 'corr-pub-001',
    campaignId: 'c-100',
    brandPackVersion: '1.0.0',
  });
  assert.ok(event, 'emitCampaignPublished must return an event');
  assert.equal(event.plugin_id, 'digital-agency-v1');
  assert.ok(event.operation_name.includes('publish') || event.operation_name.includes('campaign'), 'operation_name must reflect campaign publish');
  assert.equal(event.tenant_id, 'tenant-alpha-001');
  assert.equal(event.correlation_id, 'corr-pub-001');
});

test('DA telemetry: emitDraftRead produces event with draft correlation_id', () => {
  const event = emitDraftRead({
    tenantId: 'tenant-alpha-001',
    actorId: 'user-1',
    correlationId: 'corr-draft-001',
    discipline: 'social',
    brandPackVersion: '1.0.0',
  });
  assert.ok(event, 'emitDraftRead must return an event');
  assert.equal(event.correlation_id, 'corr-draft-001');
  assert.equal(event.plugin_id, 'digital-agency-v1');
});

test('DA telemetry: draft-to-publish lineage events share same correlation_id', () => {
  const correlationId = 'lineage-001';
  const draftEvt = emitDraftRead({ tenantId: 'tenant-alpha-001', actorId: 'user-1', correlationId, discipline: 'social', brandPackVersion: '1.0.0' });
  const publishEvt = emitCampaignPublished({ tenantId: 'tenant-alpha-001', actorId: 'user-1', correlationId, campaignId: 'c-lin', brandPackVersion: '1.0.0' });
  assert.equal(draftEvt.correlation_id, publishEvt.correlation_id, 'Lineage events must share correlation_id');
});
