'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MIG = path.join(__dirname, '..', '..', 'supabase', 'migrations', '88_markos_mcp_sessions.sql');
const sql = fs.readFileSync(MIG, 'utf8');

test('Suite 202-01: RLS — read-own binds user_id to auth.jwt()->>sub', () => {
  assert.match(sql, /create policy if not exists mmsess_read_own[\s\S]*?for select[\s\S]*?using \(user_id = auth\.jwt\(\)->>'sub'\)/);
});

test('Suite 202-01: RLS — read-tenant-admin checks iam_role in (owner,tenant-admin)', () => {
  assert.match(sql, /mmsess_read_tenant_admin[\s\S]*?iam_role in \('owner','tenant-admin'\)/);
});

test('Suite 202-01: RLS — revoke-own allows user to update their own rows', () => {
  assert.match(sql, /mmsess_revoke_own[\s\S]*?for update[\s\S]*?user_id = auth\.jwt\(\)->>'sub'/);
});

test('Suite 202-01: RLS — revoke-tenant-owner allows iam_role=owner to update any session in tenant', () => {
  assert.match(sql, /mmsess_revoke_tenant_owner[\s\S]*?iam_role = 'owner'/);
});

test('Suite 202-01: RLS — enable row level security statement present', () => {
  assert.match(sql, /alter table markos_mcp_sessions enable row level security/);
});

test('Suite 202-01: FK cascade on tenant_id + org_id prevents orphan sessions (Pitfall 9)', () => {
  assert.match(sql, /tenant_id\s+text not null references markos_tenants\(id\) on delete cascade/);
  assert.match(sql, /org_id\s+text not null references markos_orgs\(id\)\s+on delete cascade/);
});
