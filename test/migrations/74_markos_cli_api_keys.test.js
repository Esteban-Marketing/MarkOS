'use strict';

// Phase 204 Plan 01 Task 1: grep-shape migration tests for 74 api keys.
// Asserts migration + rollback files contain required DDL clauses.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const MIGRATION = path.join(ROOT, 'supabase', 'migrations', '74_markos_cli_api_keys.sql');
const ROLLBACK = path.join(ROOT, 'supabase', 'migrations', 'rollback', '74_markos_cli_api_keys.down.sql');

test('migration 74: file exists', () => {
  assert.ok(fs.existsSync(MIGRATION), `expected ${MIGRATION} to exist`);
});

test('migration 74: rollback file exists', () => {
  assert.ok(fs.existsSync(ROLLBACK), `expected ${ROLLBACK} to exist`);
});

test('migration 74: creates markos_cli_api_keys table', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /create table if not exists markos_cli_api_keys/i);
});

test('migration 74: key_hash UNIQUE NOT NULL', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /key_hash\s+text unique not null/i);
});

test('migration 74: key_fingerprint NOT NULL', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /key_fingerprint\s+text not null/i);
});

test('migration 74: RLS enabled', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /enable row level security/i);
});

test('migration 74: tenant isolation policy', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /policy markos_cli_api_keys_tenant_isolation/i);
  assert.match(sql, /request\.jwt\.claims/i);
  assert.match(sql, /tenant_id/i);
});

test('migration 74: indices exist', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /idx_cli_api_keys_tenant/i);
  assert.match(sql, /idx_cli_api_keys_fingerprint/i);
});

test('migration 74: name column exists for user label', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /\bname\s+text\b/i);
});

test('rollback 74: drops policy, indices, and table', () => {
  const sql = fs.readFileSync(ROLLBACK, 'utf8');
  assert.match(sql, /drop policy if exists markos_cli_api_keys_tenant_isolation/i);
  assert.match(sql, /drop index if exists idx_cli_api_keys_fingerprint/i);
  assert.match(sql, /drop index if exists idx_cli_api_keys_tenant/i);
  assert.match(sql, /drop table if exists markos_cli_api_keys/i);
});

test('package.json: Node engine >= 22 and keytar dep present', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.engines.node, '>=22.0.0', 'engines.node must be >=22.0.0');
  assert.ok(pkg.dependencies.keytar, 'keytar dep must be present');
  assert.match(pkg.dependencies.keytar, /^\^?7\./, 'keytar should be v7.x');
});

test('cli-runtime: MIN_NODE_VERSION bumped to 22.0.0', () => {
  const src = fs.readFileSync(path.join(ROOT, 'bin', 'cli-runtime.cjs'), 'utf8');
  assert.match(src, /MIN_NODE_VERSION = '22\.0\.0'/);
});

test('cli-runtime: COMMAND_ALIASES includes 10 new entries', () => {
  const src = fs.readFileSync(path.join(ROOT, 'bin', 'cli-runtime.cjs'), 'utf8');
  const newCommands = ['init', 'plan', 'run', 'eval', 'login', 'keys', 'whoami', 'env', 'status', 'doctor'];
  for (const cmd of newCommands) {
    // Match either `cmd: Object.freeze(...)` or `cmd:    Object.freeze(...)`
    const re = new RegExp(`${cmd}:\\s+Object\\.freeze\\(\\{\\s*command:\\s*'${cmd}'`, 'm');
    assert.match(src, re, `COMMAND_ALIASES missing '${cmd}' entry`);
  }
});
