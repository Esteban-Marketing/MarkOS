'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MIG_DIR = path.join(__dirname, '..', '..', 'supabase', 'migrations');
const read = (p) => fs.readFileSync(path.join(MIG_DIR, p), 'utf8');

test('Suite 202-01: migration 88 is idempotent (if-exists guards on every create)', () => {
  const sql = read('88_markos_mcp_sessions.sql');
  assert.match(sql, /create table if not exists markos_mcp_sessions/);
  assert.match(sql, /create index if not exists idx_mmsess_token_hash/);
  assert.match(sql, /create index if not exists idx_mmsess_tenant_id/);
  assert.match(sql, /create index if not exists idx_mmsess_user_tenant/);
  assert.match(sql, /create index if not exists idx_mmsess_expires/);
  assert.match(sql, /create policy if not exists mmsess_read_own/);
  assert.match(sql, /create policy if not exists mmsess_read_tenant_admin/);
  assert.match(sql, /create policy if not exists mmsess_revoke_own/);
  assert.match(sql, /create policy if not exists mmsess_revoke_tenant_owner/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /references markos_tenants\(id\) on delete cascade/);
  assert.match(sql, /references markos_orgs\(id\)\s+on delete cascade/);
});

test('Suite 202-01: migration 88 rollback drops in reverse order with if-exists', () => {
  const sql = read('rollback/88_markos_mcp_sessions.down.sql');
  const order = [
    'drop policy if exists mmsess_revoke_tenant_owner',
    'drop policy if exists mmsess_revoke_own',
    'drop policy if exists mmsess_read_tenant_admin',
    'drop policy if exists mmsess_read_own',
    'drop index if exists idx_mmsess_expires',
    'drop index if exists idx_mmsess_user_tenant',
    'drop index if exists idx_mmsess_tenant_id',
    'drop index if exists idx_mmsess_token_hash',
    'drop table if exists markos_mcp_sessions',
  ];
  let last = -1;
  for (const s of order) {
    const at = sql.indexOf(s);
    assert.ok(at > last, `expected ${s} after previous drop`);
    last = at;
  }
});

test('Suite 202-01: migration 89 defines atomic check_and_charge_mcp_budget fn', () => {
  const sql = read('89_markos_mcp_cost_window.sql');
  assert.match(sql, /create table if not exists markos_mcp_cost_window/);
  assert.match(sql, /primary key \(tenant_id, window_start\)/);
  assert.match(sql, /check \(spent_cents >= 0\)/);
  assert.match(sql, /create or replace function check_and_charge_mcp_budget/);
  assert.match(sql, /interval '24 hours'/);
  assert.match(sql, /date_trunc\('hour', v_now\)/);
  assert.match(sql, /on conflict \(tenant_id, window_start\)/);
  assert.match(sql, /language plpgsql security definer/);
});

test('Suite 202-01: migration 89 rollback drops fn before table', () => {
  const sql = read('rollback/89_markos_mcp_cost_window.down.sql');
  const fnAt = sql.indexOf('drop function if exists check_and_charge_mcp_budget');
  const tableAt = sql.indexOf('drop table if exists markos_mcp_cost_window');
  assert.ok(fnAt >= 0 && tableAt >= 0);
  assert.ok(fnAt < tableAt, 'fn must drop before table (fn depends on table columns)');
});
