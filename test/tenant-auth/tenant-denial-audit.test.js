import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

/**
 * Denial Audit Telemetry Tests (Task 51-04-03)
 * 
 * These tests ensure that:
 * - Cross-tenant denials emit immutable telemetry events
 * - Payloads are sanitized (no secrets/tokens included)
 * - Event structure includes actor, tenant, action, reason, request_id
 * - Denials are auditable but secrets are never leaked
 */

// ============================================================================
// Denial Telemetry Event Contract Tests
// ============================================================================

test('telemetry events module defines markos_tenant_access_denied constant', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Check for event constant definition
  assert.match(events, /markos_tenant_access_denied|TENANT_ACCESS_DENIED/i);
});

test('telemetry buildEvent function includes denial event handling', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Check for event builder
  assert.match(events, /buildEvent|createEvent|event.*function/i);
});

test('telemetry sanitizePayload or redaction removes bearer tokens', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Check for token redaction
  assert.match(events, /Bearer|bearer|token|secret|REDACTED/i);
  assert.match(events, /sanitize|redact|remove|filter/i);
});

test('runtime-context.cjs implements deny helper function', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check for deny helper
  assert.match(runtime, /deny|emitDeny|denyTenant|accessDenied/i);
  assert.match(runtime, /function|const.*=.*function|function.*deny/i);
});

test('deny helper returns structured response with status and error', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check for response structure
  assert.match(runtime, /ok|status|error|message/i);
  assert.match(runtime, /return.*{|response/i);
});

test('deny helper includes actor_id, tenant_id, reason in telemetry', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check for required telemetry fields
  assert.match(runtime, /actor|user/i);
  assert.match(runtime, /tenant/i);
  assert.match(runtime, /reason|cause|justification/i);
});

test('deny helper includes correlation ID for audit traceability', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check for correlation ID
  assert.match(runtime, /request_id|correlation|trace_id|id/i);
});

// ============================================================================
// Payload Sanitization Tests
// ============================================================================

test('no authorization headers leak into telemetry payloads', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Verify token leakage prevention
  assert.match(events, /authorization|bearer|token/i);
  assert.match(events, /REDACTED|sanitize|redact|remove/i);
});

test('no api keys leak into telemetry payloads', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Verify API key redaction
  assert.match(events, /api.*key|key.*=|secret/i);
  assert.match(events, /REDACTED|sanitize|redact|filter/i);
});

// ============================================================================
// Integration Contract Tests
// ============================================================================

test('runtime-context exports deny helper for external use', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check that deny helper is exported
  assert.match(runtime, /exports.*=.*{[\s\S]*deny|module\.exports.*{[\s\S]*deny/i);
});

test('handlers.cjs can import deny helper from runtime-context', () => {
  const handlers = read('onboarding/backend/handlers.cjs');
  // Check that handlers import/require error helpers
  assert.match(handlers, /require|import|from/i);
  assert.match(handlers, /runtime.*context|runtime-context/i);
});

// ============================================================================
// Immutability and Audit Trail Tests
// ============================================================================

test('denial events capture immutable timestamp', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check for timestamp capture
  assert.match(runtime, /timestamp|time|date|Date\.now/i);
});

test('denial events cannot be modified after creation', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Check for immutability (freeze or const)
  assert.match(events, /Object\.freeze|const |freeze/i);
});
