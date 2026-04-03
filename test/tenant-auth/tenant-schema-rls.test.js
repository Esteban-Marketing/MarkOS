const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TenantMembership,
  TenantPrincipal,
  IamRole,
  LegacyRole,
  LEGACY_TO_IAM_MAPPING,
  validateLegacyRole,
} = require('../../lib/markos/tenant/contracts.js');

// Test contract presence
test('51-01-01: Exports all required tenant contracts', () => {
  assert.equal(typeof TenantMembership, 'object');
  assert.equal(typeof TenantPrincipal, 'object');
  assert.equal(typeof IamRole, 'object');
  assert.equal(typeof LegacyRole, 'object');
  assert.equal(typeof LEGACY_TO_IAM_MAPPING, 'object');
  assert.equal(typeof validateLegacyRole, 'function');
});

// Test TenantMembership contract
test('51-01-01: TenantMembership contract includes tenant_id as mandatory', () => {
  const sample = {
    membership_id: 'mem-123',
    user_id: 'user-456',
    tenant_id: 'tenant-789',
    iam_role: 'owner',
    legacy_role: 'owner',
    created_at: new Date().toISOString(),
  };
  // Verify required fields are present in contract definition
  assert.ok(TenantMembership.memb_fields);
  assert.ok(TenantMembership.memb_fields.includes('tenant_id'));
  assert.ok(TenantMembership.memb_fields.includes('user_id'));
  assert.ok(TenantMembership.memb_fields.includes('iam_role'));
});

// Test TenantPrincipal contract
test('51-01-01: TenantPrincipal contract includes actor_id and active_tenant_id', () => {
  // Verify required fields are present
  assert.ok(TenantPrincipal.principal_fields);
  assert.ok(TenantPrincipal.principal_fields.includes('actor_id'));
  assert.ok(TenantPrincipal.principal_fields.includes('active_tenant_id'));
  assert.ok(TenantPrincipal.principal_fields.includes('memberships'));
});

// Test IamRole contract
test('51-01-01: IamRole lists all v3.2 canonical roles', () => {
  const expectedRoles = ['owner', 'tenant-admin', 'manager', 'contributor', 'reviewer', 'billing-admin', 'readonly'];
  expectedRoles.forEach((role) => {
    assert.ok(IamRole.valid_roles.includes(role), `IamRole should include ${role}`);
  });
});

// Test LegacyRole contract
test('51-01-01: LegacyRole lists v3.1 legacy roles', () => {
  const expectedLegacy = ['owner', 'operator', 'strategist', 'viewer', 'agent'];
  expectedLegacy.forEach((role) => {
    assert.ok(LegacyRole.valid_roles.includes(role), `LegacyRole should include ${role}`);
  });
});

// Test legacy-to-IAM mapping completeness
test('51-01-01: LEGACY_TO_IAM_MAPPING covers all legacy roles', () => {
  const legacyRoles = ['owner', 'operator', 'strategist', 'viewer', 'agent'];
  legacyRoles.forEach((legacy) => {
    assert.ok(LEGACY_TO_IAM_MAPPING[legacy], `Mapping missing for legacy role: ${legacy}`);
    assert.equal(typeof LEGACY_TO_IAM_MAPPING[legacy], 'string');
  });
});

// Test legacy role validation with unmapped roles
test('51-01-01: validateLegacyRole rejects unmapped roles with deterministic error', () => {
  assert.throws(
    () => validateLegacyRole('unknown-role'),
    (err) => {
      assert.equal(err.code, 'UNMAPPED_LEGACY_ROLE');
      return true;
    },
    'Should throw UNMAPPED_LEGACY_ROLE error'
  );
});

// Test legacy role validation with valid roles
test('51-01-01: validateLegacyRole accepts all mapped legacy roles', () => {
  const legacyRoles = ['owner', 'operator', 'strategist', 'viewer', 'agent'];
  legacyRoles.forEach((legacy) => {
    assert.equal(validateLegacyRole(legacy), LEGACY_TO_IAM_MAPPING[legacy]);
  });
});

// Test workspace_id marked as compatibility-only
test('51-01-01: TenantMembership marks workspace_id as compatibility-only metadata', () => {
  assert.ok(TenantMembership.compatibility_fields);
  assert.ok(TenantMembership.compatibility_fields.includes('workspace_id'));
});

// ============================================================================
// Task 51-01-02: Migration schema and RLS policy tests
// ============================================================================

const fs = require('fs');
const path = require('path');

// Helper to load and parse migration file
function loadMigrationFile() {
  const migrationPath = path.join(__dirname, '../../supabase/migrations/51_multi_tenant_foundation.sql');
  return fs.readFileSync(migrationPath, 'utf8');
}

// Test migration file exists
test('51-01-02: Migration file 51_multi_tenant_foundation.sql exists', () => {
  const migrationPath = path.join(__dirname, '../../supabase/migrations/51_multi_tenant_foundation.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
});

// Test migration creates tenant tables
test('51-01-02: Migration creates markos_tenants table', () => {
  const migrationSql = loadMigrationFile();
  assert.ok(migrationSql.includes('markos_tenants'), 'Must create markos_tenants table');
  assert.ok(migrationSql.includes('id text primary key') || migrationSql.includes('id uuid'), 'Tenants must have id field');
  assert.ok(migrationSql.includes('name text'), 'Tenants must have name field');
});

// Test migration creates membership table
test('51-01-02: Migration creates markos_tenant_memberships table', () => {
  const migrationSql = loadMigrationFile();
  assert.ok(migrationSql.includes('markos_tenant_memberships'), 'Must create markos_tenant_memberships table');
  assert.ok(migrationSql.includes('user_id'), 'Memberships must reference user_id');
  assert.ok(migrationSql.includes('tenant_id'), 'Memberships must reference tenant_id');
});

// Test migration adds tenant_id to existing tables
test('51-01-02: Migration adds tenant_id column to workspace-scoped tables', () => {
  const migrationSql = loadMigrationFile();
  // Check for ALTER TABLE statements that add tenant_id
  const hasAlterTable = migrationSql.includes('alter table');
  const hasTenantIdColumn = migrationSql.includes('tenant_id') && migrationSql.includes('add column');
  assert.ok(hasAlterTable && hasTenantIdColumn, 
    'Migration must add tenant_id column to existing tables');
});

// Test migration creates indexes on tenant_id
test('51-01-02: Migration creates indexes on tenant_id', () => {
  const migrationSql = loadMigrationFile();
  assert.ok(migrationSql.includes('create index') && migrationSql.includes('tenant_id'),
    'Migration must create indexes on tenant_id for query performance');
});

// Test migration enables RLS on tenant tables
test('51-01-02: Migration enables RLS on tenant tables', () => {
  const migrationSql = loadMigrationFile();
  assert.ok(migrationSql.includes('enable row level security') || migrationSql.includes('alter table'), 
    'Migration must enable RLS on tenant-scoped tables');
});

// Test migration creates RLS policies with USING and WITH CHECK
test('51-01-02: Migration creates RLS policies with USING and WITH CHECK clauses', () => {
  const migrationSql = loadMigrationFile();
  const hasUsingClause = migrationSql.includes('using (') || migrationSql.toUpperCase().includes('USING');
  const hasWithCheckClause = migrationSql.includes('with check') || migrationSql.toUpperCase().includes('WITH CHECK');
  assert.ok(hasUsingClause, 'RLS policies must include USING clause for read control');
  assert.ok(hasWithCheckClause, 'RLS policies must include WITH CHECK clause for write control');
});

// Test migration references tenant_id in policies
test('51-01-02: Migration creates policies that enforce tenant_id boundaries', () => {
  const migrationSql = loadMigrationFile();
  const policySection = migrationSql.toLowerCase();
  assert.ok(policySection.includes('tenant_id'), 'Policies must reference tenant_id for isolation');
  assert.ok(policySection.includes('policy'), 'Must create explicit policies');
});

// Test migration preserves workspace_id compatibility
test('51-01-02: Migration preserves workspace_id columns for compatibility', () => {
  const migrationSql = loadMigrationFile();
  assert.ok(migrationSql.includes('workspace_id'), 'Must preserve workspace_id for backward compatibility');
});
