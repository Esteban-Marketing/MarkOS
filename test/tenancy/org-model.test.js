'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '81_markos_orgs.sql');
const rollbackPath  = path.join(__dirname, '..', '..', 'supabase', 'migrations', 'rollback', '81_markos_orgs.down.sql');

test('Suite 201-01: migration 81 file exists + contains markos_orgs create', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /create table if not exists markos_orgs/);
  assert.match(sql, /owner_user_id text not null/);
  assert.match(sql, /seat_quota integer not null default 5/);
  assert.match(sql, /status text not null default 'active'/);
  assert.match(sql, /check \(status in \('active', 'suspended', 'offboarding', 'purged'\)\)/);
});

test('Suite 201-01: migration 81 creates markos_org_memberships with org_role CHECK', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /create table if not exists markos_org_memberships/);
  assert.match(sql, /check \(org_role in \('owner', 'billing-admin', 'member', 'readonly'\)\)/);
  assert.match(sql, /unique\(org_id, user_id\)/);
});

test('Suite 201-01: migration 81 extends markos_tenants with org_id NOT NULL + slug + status', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /alter table markos_tenants/);
  assert.match(sql, /add column if not exists org_id text references markos_orgs\(id\)/);
  assert.match(sql, /add column if not exists slug text/);
  assert.match(sql, /add column if not exists status text not null default 'active'/);
  assert.match(sql, /alter column org_id set not null/);
});

test('Suite 201-01: migration 81 adds RLS policies on both new tables', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /alter table markos_orgs enable row level security/);
  assert.match(sql, /alter table markos_org_memberships enable row level security/);
  assert.match(sql, /create policy if not exists markos_orgs_read_via_membership/);
  assert.match(sql, /create policy if not exists markos_org_memberships_read_own/);
});

test('Suite 201-01: migration 81 defines count_org_active_members function', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /create or replace function count_org_active_members\(p_org_id text\)/);
  assert.match(sql, /returns integer/);
});

test('Suite 201-01: rollback file exists + reverses every create', () => {
  assert.ok(fs.existsSync(rollbackPath), 'rollback file missing (QA-13)');
  const rb = fs.readFileSync(rollbackPath, 'utf8');
  assert.match(rb, /drop table if exists markos_org_memberships/);
  assert.match(rb, /drop table if exists markos_orgs/);
  assert.match(rb, /drop function if exists count_org_active_members/);
  assert.match(rb, /drop policy if exists markos_orgs_read_via_membership on markos_orgs/);
});

// --- Populated by Task 2 (library shape tests) ---
test('Suite 201-01: contracts.cjs exports canonical constants', () => {
  const c = require('../../lib/markos/orgs/contracts.cjs');
  assert.deepEqual([...c.ORG_ROLES], ['owner', 'billing-admin', 'member', 'readonly']);
  assert.deepEqual([...c.TENANT_STATUSES], ['active', 'suspended', 'offboarding', 'purged']);
  assert.equal(c.DEFAULT_SEAT_QUOTA, 5);
  assert.equal(c.isValidOrgRole('owner'), true);
  assert.equal(c.isValidOrgRole('banana'), false);
  assert.equal(Object.isFrozen(c.ORG_ROLES), true);
});

test('Suite 201-01: api.cjs exports all 5 helpers as functions', () => {
  const a = require('../../lib/markos/orgs/api.cjs');
  for (const name of ['createOrg', 'addOrgMember', 'listOrgsForUser', 'countOrgActiveMembers', 'getOrgByUserId']) {
    assert.equal(typeof a[name], 'function', `${name} must be a function`);
  }
});

test('Suite 201-01: createOrg rejects missing inputs', async () => {
  const { createOrg } = require('../../lib/markos/orgs/api.cjs');
  await assert.rejects(() => createOrg(null, {}), /supabase client/);
  await assert.rejects(() => createOrg({ from: () => ({}) }, {}), /slug, name, owner_user_id/);
});

test('Suite 201-01: addOrgMember rejects invalid org_role', async () => {
  const { addOrgMember } = require('../../lib/markos/orgs/api.cjs');
  const mockClient = { from: () => ({}) };
  await assert.rejects(
    () => addOrgMember(mockClient, { org_id: 'o1', user_id: 'u1', org_role: 'banana' }),
    /invalid org_role/
  );
});

test('Suite 201-01: countOrgActiveMembers calls the RPC and handles null', async () => {
  const { countOrgActiveMembers } = require('../../lib/markos/orgs/api.cjs');
  let capturedArgs = null;
  const mockClient = {
    rpc: async (fn, args) => {
      capturedArgs = { fn, args };
      return { data: 7, error: null };
    },
  };
  const n = await countOrgActiveMembers(mockClient, 'org-test');
  assert.equal(n, 7);
  assert.equal(capturedArgs.fn, 'count_org_active_members');
  assert.deepEqual(capturedArgs.args, { p_org_id: 'org-test' });

  // null data path
  const mockClient2 = { rpc: async () => ({ data: null, error: null }) };
  assert.equal(await countOrgActiveMembers(mockClient2, 'org-x'), 0);
});

test('Suite 201-01: createOrg uses DEFAULT_SEAT_QUOTA when not provided', async () => {
  const { createOrg } = require('../../lib/markos/orgs/api.cjs');
  let inserted = null;
  const mockClient = {
    from: (table) => ({
      insert: (row) => {
        inserted = { table, row };
        return { select: () => ({ single: async () => ({ data: row, error: null }) }) };
      },
    }),
  };
  const result = await createOrg(mockClient, { slug: 'acme', name: 'Acme', owner_user_id: 'u1' });
  assert.equal(result.seat_quota, 5);
  assert.equal(result.status, 'active');
  assert.equal(inserted.table, 'markos_orgs');
  assert.match(result.id, /^org-/);
});
