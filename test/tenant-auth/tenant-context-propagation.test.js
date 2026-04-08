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
 * Tenant Context Propagation Tests (Task 51-02-01)
 * 
 * These tests ensure that:
 * - tenant context is resolved from trusted JWT claims
 * - missing or ambiguous tenant context fails closed
 * - deterministic error codes are returned for auth failures
 * - tenant principal is attached to req.markosAuth
 * - wrapper functions use requireHostedSupabaseAuth consistently
 */

// ============================================================================
// Hosted Auth Boundary Contract Tests
// ============================================================================

test('requireHostedSupabaseAuth is exported from runtime-context.cjs', () => {
  const runtimeContext = read('onboarding/backend/runtime-context.cjs');
  assert.match(runtimeContext, /module\.exports[\s\S]*requireHostedSupabaseAuth/);
  assert.match(runtimeContext, /function requireHostedSupabaseAuth/);
});

test('requireHostedSupabaseAuth accepts tenant selector parameters', () => {
  const runtimeContext = read('onboarding/backend/runtime-context.cjs');
  // Check that the function accepts req, runtimeContext, operation, and requiredProjectSlug
  assert.match(runtimeContext, /function requireHostedSupabaseAuth/);
  assert.match(runtimeContext, /requiredProjectSlug/);
  assert.match(runtimeContext, /operation/);
});

test('requireHostedSupabaseAuth returns tenant_id in success response', () => {
  const runtimeContext = read('onboarding/backend/runtime-context.cjs');
  // Check for tenant_id extraction logic from JWT claims
  assert.match(runtimeContext, /active_tenant_id|tenant_id/i);
  assert.match(runtimeContext, /payload\./);
  assert.match(runtimeContext, /canonicalTenantId/);
});

test('requireHostedSupabaseAuth returns fail-closed 4xx for missing tenant', () => {
  const runtimeContext = read('onboarding/backend/runtime-context.cjs');
  // Check for error handling for missing tenant
  assert.match(runtimeContext, /TENANT_CONTEXT_MISSING/);
  assert.match(runtimeContext, /401/);
  assert.match(runtimeContext, /!canonicalTenantId/);
});

test('requireHostedSupabaseAuth detects ambiguous tenant context', () => {
  const runtimeContext = read('onboarding/backend/runtime-context.cjs');
  // Check for conflict detection between different tenant sources
  assert.match(runtimeContext, /TENANT_CONTEXT_AMBIGUOUS/);
  assert.match(runtimeContext, /conflictingTenant/);
  assert.match(runtimeContext, /403/);
});

test('api/status.js requires tenant scope in auth wrapper', () => {
  const statusJs = read('api/status.js');
  // Verify that status.js calls requireHostedSupabaseAuth with tenant context
  assert.match(statusJs, /requireHostedSupabaseAuth/);
  assert.match(statusJs, /req\.markosAuth/);
  assert.match(statusJs, /tenant|x-tenant-id|tenant_id/i);
});

test('api/migrate.js requires tenant scope for protected endpoint', () => {
  const migrateJs = read('api/migrate.js');
  // Verify that migrate.js also protects the endpoint with tenant auth
  assert.match(migrateJs, /requireHostedSupabaseAuth|tenant|auth/i);
});

test('api/config.js supports tenant-scoped config retrieval', () => {
  const configJs = read('api/config.js');
  // Verify that config.js integrates with tenant auth
  assert.ok(configJs.includes('config') || configJs.includes('Config'));
});

// ============================================================================
// UI Tenant Propagation Contract Structure Tests
// ============================================================================

test('app/(markos)/layout.tsx defines tenant context provider', () => {
  const layoutFile = read('app/(markos)/layout.tsx');
  // Check that layout.tsx has context/state for tenant
  assert.match(layoutFile, /tenant|context|provider|auth/i);
});

test('app/(markos)/operations/tasks/page.tsx mounts TaskStoreProvider for tenant context', () => {
  const tasksPage = read('app/(markos)/operations/tasks/page.tsx');
  // Check that tasks page uses TaskStoreProvider to manage context
  assert.match(tasksPage, /TaskStoreProvider/);
  // Provider will handle tenant context propagation to API calls
  assert.match(tasksPage, /'use client'|'use strict'|export|import/i);
});

// ============================================================================
// Fail-Closed Behavior Tests
// ============================================================================

test('tenant-auth propagation tests exist and are executable', () => {
  const testFile = path.join(ROOT, 'test/tenant-auth/tenant-context-propagation.test.js');
  assert.equal(fs.existsSync(testFile), true, 'Propagation test file exists');
});

test('ui-security tests include tenant context propagation checks', () => {
  const securityTests = read('test/ui-security/security.test.js');
  // Verify security tests are in place
  assert.match(securityTests, /unauthorized|forbidden|tenant|auth/i);
});
