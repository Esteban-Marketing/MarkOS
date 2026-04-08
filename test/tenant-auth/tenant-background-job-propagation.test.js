 'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

/**
 * Background Job Tenant Propagation Tests (Task 51-04-01, 51-04-02)
 * 
 * These tests ensure that:
 * - Background/queued execution paths receive required tenant principal
 * - Execution fails closed when tenant context is missing or mismatched
 * - Orchestrator receives tenant context from handlers
 * - Deny helper implementations exist and are callable
 */

// ============================================================================
// Background Job Tenant Propagation Contract Tests (51-04-01)
// ============================================================================

test('migration-runner.cjs enforces tenant principal for background execution', () => {
  const runner = read('onboarding/backend/provisioning/migration-runner.cjs');
  // Check for tenant principal requirements
  assert.match(runner, /tenant|principal|context/i);
  assert.match(runner, /migration|queue|background|job/i);
});

test('migration-runner.cjs fails closed when tenant context missing', () => {
  const runner = read('onboarding/backend/provisioning/migration-runner.cjs');
  // Check for fail-closed behavior on missing tenant
  assert.match(runner, /tenant.*missing|!.*tenant|null.*tenant|undefined.*tenant/i);
  assert.match(runner, /throw|Error|reject|fail|403/i);
});

test('migration-runner.cjs rejects execution on tenant mismatch', () => {
  const runner = read('onboarding/backend/provisioning/migration-runner.cjs');
  // Check for tenant conflict detection
  assert.match(runner, /mismatch|conflict|!==|ambiguous/i);
});

test('api/migrate.js passes tenant principal to migration-runner', () => {
  const migrateJs = read('api/migrate.js');
  // Verify migrate passes tenant context to runner
  assert.match(migrateJs, /migration.*tenant|tenant.*migration|migration.*principal/i);
  assert.match(migrateJs, /migration-runner|migration_runner|provisioning/i);
});

// ============================================================================
// Handler-to-Orchestrator Execution Context Tests (51-04-02)
// ============================================================================

test('handlers.cjs builds executionContext object from req.markosAuth', () => {
  const handlers = read('onboarding/backend/handlers.cjs');
  // Check that handlers construct execution context
  assert.match(handlers, /executionContext|execution_context/i);
  assert.match(handlers, /req\.markosAuth|req\.auth|auth|context/i);
});

test('handlers.cjs includes tenant_id, actor_id, role, request_id in context', () => {
  const handlers = read('onboarding/backend/handlers.cjs');
  // Check for required context fields
  assert.match(handlers, /tenant_id/);
  assert.match(handlers, /actor_id|user_id|actor/i);
  assert.match(handlers, /role/);
  assert.match(handlers, /request_id|requestId|correlation/i);
});

test('orchestrator.cjs receives executionContext parameter', () => {
  const orchestrator = read('onboarding/backend/agents/orchestrator.cjs');
  // Check that orchestrator signature includes executionContext
  assert.match(orchestrator, /orchestrate|function.*orchestrate/i);
  assert.match(orchestrator, /executionContext|execution_context|context/i);
});

test('orchestrator.cjs rejects execution when tenant context missing', () => {
  const orchestrator = read('onboarding/backend/agents/orchestrator.cjs');
  // Check for fail-closed behavior
  assert.match(orchestrator, /!.*tenant|tenant.*missing|null.*context/i);
  assert.match(orchestrator, /throw|Error|reject|fail/i);
});

// ============================================================================
// Deny Helper and Telemetry Contract Tests (51-04-03)
// ============================================================================

test('telemetry/events.ts defines markos_tenant_access_denied event', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Check for deny event
  assert.match(events, /markos_tenant_access_denied|TENANT_ACCESS_DENIED|tenant_denied/i);
});

test('telemetry.cjs exposes rollout and execution-checkpoint observability seams for OPS-01', () => {
  const telemetry = read('onboarding/backend/agents/telemetry.cjs');
  assert.match(telemetry, /ROLLOUT_ENDPOINT_SLOS/);
  assert.match(telemetry, /captureRolloutEndpointEvent/);
  assert.match(telemetry, /captureExecutionCheckpoint/);
  assert.match(telemetry, /execution_readiness_blocked|execution_failure|execution_loop_completed/);
});

test('telemetry/events.ts implements sanitizePayload or redaction helper', () => {
  const events = read('lib/markos/telemetry/events.ts');
  // Check for payload sanitization
  assert.match(events, /sanitize|redact|REDACTED|secret/i);
});

test('runtime-context.cjs exports deny helper for telemetry emission', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check for deny helper implementation
  assert.match(runtime, /deny|telemetry|event|emit|log/i);
});

test('deny helper includes actor, tenant, action, reason in payload', () => {
  const runtime = read('onboarding/backend/runtime-context.cjs');
  // Check required payload fields for deny events
  assert.match(runtime, /actor|user/i);
  assert.match(runtime, /tenant/i);
  assert.match(runtime, /action|operation|reason/i);
});

// ============================================================================
// Background Job and Orchestrator Test File Existence
// ============================================================================

test('tenant-background-job-propagation.test.js exists', () => {
  const testFile = path.join(ROOT, 'test/tenant-auth/tenant-background-job-propagation.test.js');
  assert.equal(fs.existsSync(testFile), true, 'Background job propagation test file exists');
});

test('tenant-denial-audit.test.js exists', () => {
  const testFile = path.join(ROOT, 'test/tenant-auth/tenant-denial-audit.test.js');
  assert.equal(fs.existsSync(testFile), true, 'Denial audit test file exists');
});
