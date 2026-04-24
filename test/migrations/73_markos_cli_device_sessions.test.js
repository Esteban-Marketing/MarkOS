'use strict';

// Phase 204 Plan 01 Task 1: grep-shape migration tests for 73 device sessions.
// Asserts migration + rollback files contain required DDL clauses.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const MIGRATION = path.join(ROOT, 'supabase', 'migrations', '73_markos_cli_device_sessions.sql');
const ROLLBACK = path.join(ROOT, 'supabase', 'migrations', 'rollback', '73_markos_cli_device_sessions.down.sql');

test('migration 73: file exists', () => {
  assert.ok(fs.existsSync(MIGRATION), `expected ${MIGRATION} to exist`);
});

test('migration 73: rollback file exists', () => {
  assert.ok(fs.existsSync(ROLLBACK), `expected ${ROLLBACK} to exist`);
});

test('migration 73: creates markos_cli_device_sessions table', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /create table if not exists markos_cli_device_sessions/i);
});

test('migration 73: status enum CHECK constraint', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /status in \('pending', 'approved', 'denied', 'expired'\)/i);
});

test('migration 73: expires_after_issue CHECK constraint', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /expires_after_issue/i);
  assert.match(sql, /expires_at > issued_at/i);
});

test('migration 73: partial index on user_code where status = pending', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /idx_cli_device_user_code/i);
  assert.match(sql, /where status = 'pending'/i);
});

test('migration 73: poll_count + last_poll_at columns', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /poll_count\s+int/i);
  assert.match(sql, /last_poll_at\s+timestamptz/i);
});

test('rollback 73: drops index and table', () => {
  const sql = fs.readFileSync(ROLLBACK, 'utf8');
  assert.match(sql, /drop index if exists idx_cli_device_user_code/i);
  assert.match(sql, /drop table if exists markos_cli_device_sessions/i);
});

test('audit writer: AUDIT_SOURCE_DOMAINS contains "cli"', () => {
  const writer = require(path.join(ROOT, 'lib', 'markos', 'audit', 'writer.cjs'));
  // Module should expose the constant or validate inputs; use behavioral test.
  // writeAuditRow validates source_domain — if 'cli' is in the list, validation
  // will fail NOT on domain check but on other required fields.
  const src = fs.readFileSync(path.join(ROOT, 'lib', 'markos', 'audit', 'writer.cjs'), 'utf8');
  assert.match(src, /'cli'/, "AUDIT_SOURCE_DOMAINS should include 'cli'");
});
