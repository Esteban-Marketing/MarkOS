const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const schemaPath = path.join(root, 'supabase/migrations/58_crm_core_entities.sql');
const customFieldsPath = path.join(root, 'supabase/migrations/58_crm_custom_fields.sql');
const activityPath = path.join(root, 'supabase/migrations/58_crm_activity_and_identity.sql');
const hardeningPath = path.join(root, 'supabase/migrations/100_crm_schema_identity_graph_hardening.sql');
const entitiesPath = path.join(root, 'lib/markos/crm/entities.ts');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename: filePath });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      return loadTsCommonJsModule(path.resolve(path.dirname(filePath), specifier));
    }
    return require(specifier);
  };
  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

test('CRM tenant isolation: core CRM tables use membership-backed RLS with WITH CHECK clauses', () => {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  ['crm_contacts', 'crm_companies', 'crm_accounts', 'crm_customers', 'crm_deals', 'crm_tasks', 'crm_notes'].forEach((tableName) => {
    assert.match(sql, new RegExp(`create policy if not exists ${tableName}_read_via_tenant`, 'i'));
    assert.match(sql, new RegExp(`${tableName}[\\s\\S]*markos_tenant_memberships`, 'i'));
  });
  assert.match(sql, /with check/i);
  assert.match(sql, /auth\.jwt\(\)->>'sub'/i);
});

test('CRM tenant isolation: custom field tables also fail closed on missing tenant membership', () => {
  const sql = fs.readFileSync(customFieldsPath, 'utf8');
  assert.match(sql, /crm_custom_field_definitions_read_via_tenant/i);
  assert.match(sql, /crm_custom_field_values_insert_via_tenant/i);
  assert.match(sql, /markos_tenant_memberships/i);
});

test('CRM tenant isolation: activity, identity, and merge lineage tables remain tenant partitioned', () => {
  const sql = fs.readFileSync(activityPath, 'utf8');
  ['crm_activity_ledger', 'crm_identity_links', 'crm_merge_decisions', 'crm_merge_lineage'].forEach((tableName) => {
    assert.match(sql, new RegExp(`create table if not exists ${tableName}`, 'i'));
    assert.match(sql, new RegExp(`${tableName}[\\s\\S]*tenant_id text not null`, 'i'));
    assert.match(sql, new RegExp(`alter table ${tableName} enable row level security`, 'i'));
  });
  assert.match(sql, /decision_state in \('accepted', 'rejected'\)/i);

  const hardeningSql = fs.readFileSync(hardeningPath, 'utf8');
  assert.match(hardeningSql, /crm_identity_links/i);
  assert.match(hardeningSql, /review/i);
  assert.match(hardeningSql, /link_status/i);
});

test('CRM tenant isolation: entity helpers deny cross-tenant mutation and hide foreign rows', () => {
  const entities = loadTsCommonJsModule(entitiesPath);
  const store = { entities: [] };
  entities.createCrmEntity(store, {
    entity_id: 'company-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'company',
    display_name: 'Alpha Co',
  });
  entities.createCrmEntity(store, {
    entity_id: 'company-002',
    tenant_id: 'tenant-beta-002',
    record_kind: 'company',
    display_name: 'Beta Co',
  });
  assert.equal(entities.listCrmEntities(store, { tenant_id: 'tenant-alpha-001', record_kind: 'company' }).length, 1);
  assert.equal(entities.listCrmEntities(store, { tenant_id: 'tenant-beta-002', record_kind: 'company' }).length, 1);
  assert.throws(() => entities.updateCrmEntity(store, { tenant_id: 'tenant-beta-002', entity_id: 'company-001' }, { display_name: 'Leak' }), /CRM_TENANT_SCOPE_DENIED/);
});
