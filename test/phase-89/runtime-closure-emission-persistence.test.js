'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const handlers = require('../../onboarding/backend/handlers.cjs');

function createStore({ durable = true, failAppend = false } = {}) {
  const rows = [];
  return {
    __durable: durable,
    rows,
    async append(entry) {
      if (failAppend) {
        const err = new Error('append failed');
        err.code = 'E_APPEND_FAILED';
        throw err;
      }
      const stored = {
        ...entry,
        appended_at: `mock-${String(rows.length + 1).padStart(3, '0')}`,
      };
      rows.push(stored);
      return stored;
    },
    async getAll() {
      return rows.slice();
    },
  };
}

test('smoke: closeout success returns deterministic closure refs and dual-write evidence', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-89-closure-'));
  const store = createStore({ durable: true });

  const result = await handlers.__testing.emitRuntimeClosureEvidence({
    phase: '89',
    tenant_id: 'tenant-alpha',
    bundle_id: 'bundle-123',
    actor_role: 'system',
    gate_results: {
      passed: true,
      gates: {
        tenant_isolation: { passed: true },
        contract_integrity: { passed: true },
      },
    },
    closeout_verification: { ok: true, verification: { verified: true, anomaly_flags: [] } },
    auditStore: store,
    closureOutputDir: tempDir,
    now: '2026-04-13T21:00:00.000Z',
    require_durable_persistence: true,
  });

  assert.equal(result.ok, true);
  assert.ok(result.closure.bundle_hash);
  assert.equal(typeof result.closure.bundle_locator, 'string');
  assert.ok(result.closure.bundle_locator.includes(result.closure.bundle_hash));
  assert.equal(fs.existsSync(result.closure.bundle_path), true);
  assert.equal(store.rows.length, 1);
  assert.equal(store.rows[0].bundle_hash, result.closure.bundle_hash);
});

test('smoke: closeout fails closed when durable persistence is required but unavailable', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-89-closure-'));
  const store = createStore({ durable: false });

  const result = await handlers.__testing.emitRuntimeClosureEvidence({
    phase: '89',
    tenant_id: 'tenant-alpha',
    bundle_id: 'bundle-456',
    actor_role: 'system',
    gate_results: { passed: true, gates: {} },
    closeout_verification: { ok: true, verification: { verified: true, anomaly_flags: [] } },
    auditStore: store,
    closureOutputDir: tempDir,
    require_durable_persistence: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'E_CLOSURE_DURABLE_PERSISTENCE_REQUIRED');
});

test('smoke: closeout fails closed when durable audit append fails', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-89-closure-'));
  const store = createStore({ durable: true, failAppend: true });

  const result = await handlers.__testing.emitRuntimeClosureEvidence({
    phase: '89',
    tenant_id: 'tenant-alpha',
    bundle_id: 'bundle-789',
    actor_role: 'system',
    gate_results: { passed: true, gates: {} },
    closeout_verification: { ok: true, verification: { verified: true, anomaly_flags: [] } },
    auditStore: store,
    closureOutputDir: tempDir,
    require_durable_persistence: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'E_CLOSURE_AUDIT_APPEND_FAILED');
});
