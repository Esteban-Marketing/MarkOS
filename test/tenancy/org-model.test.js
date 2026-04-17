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

test('Suite 201-01: orgs contracts module exports canonical constants', { todo: 'implement after Task 2 writes contracts.ts' },
  () => {
    // This test becomes active once lib/markos/orgs/contracts.cjs exists.
  });

test('Suite 201-01: orgs api module exports createOrg / addOrgMember / countOrgActiveMembers', { todo: 'implement after Task 2 writes api.cjs' },
  () => {});
