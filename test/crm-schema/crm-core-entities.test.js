const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const contractsPath = path.join(root, 'lib/markos/crm/contracts.ts');
const entitiesPath = path.join(root, 'lib/markos/crm/entities.ts');
const schemaPath = path.join(root, 'supabase/migrations/58_crm_core_entities.sql');
const customFieldsPath = path.join(root, 'supabase/migrations/58_crm_custom_fields.sql');
const crudContractPath = path.join(root, 'contracts/F-58-crm-entity-crud-v1.yaml');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename: filePath });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      return loadTsCommonJsModule(path.resolve(path.dirname(filePath), specifier.endsWith('.ts') ? specifier : `${specifier}`));
    }
    return require(specifier);
  };
  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

test('CRM-01: Wave 1 artifacts exist', () => {
  [contractsPath, entitiesPath, schemaPath, customFieldsPath, crudContractPath].forEach((filePath) => {
    assert.ok(fs.existsSync(filePath), `${filePath} must exist`);
  });
});

test('CRM-01: contracts expose first-class CRM entity families', () => {
  const contracts = loadTsCommonJsModule(contractsPath);
  assert.deepEqual(contracts.crmRecordKinds, ['contact', 'company', 'deal', 'account', 'customer', 'task', 'note']);
  assert.ok(contracts.crmEntitySchema.required.includes('tenant_id'));
  assert.ok(contracts.crmCustomFieldDefinitionSchema.required.includes('entity_kind'));
  assert.ok(contracts.crmCustomFieldValueSchema.required.includes('field_definition_id'));
});

test('CRM-01: create/update/list helpers stay tenant-bound and legacy-table independent', () => {
  const entities = loadTsCommonJsModule(entitiesPath);
  const store = { entities: [] };
  const created = entities.createCrmEntity(store, {
    entity_id: 'contact-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    display_name: 'Ada Lovelace',
  });
  assert.equal(created.record_kind, 'contact');
  assert.equal(entities.listCrmEntities(store, { tenant_id: 'tenant-alpha-001', record_kind: 'contact' }).length, 1);
  assert.throws(() => entities.listCrmEntities(store, {}), /CRM_TENANT_SCOPE_REQUIRED/);
  assert.throws(() => entities.updateCrmEntity(store, { tenant_id: 'tenant-beta-002', entity_id: 'contact-001' }, { display_name: 'Wrong Tenant' }), /CRM_TENANT_SCOPE_DENIED/);
});

test('CRM-01: core schema migration declares all first-class CRM tables', () => {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  ['crm_contacts', 'crm_companies', 'crm_deals', 'crm_accounts', 'crm_customers', 'crm_tasks', 'crm_notes'].forEach((tableName) => {
    assert.match(sql, new RegExp(`create table if not exists ${tableName}`, 'i'));
    assert.match(sql, new RegExp(`${tableName}[\\s\\S]*tenant_id text not null`, 'i'));
    assert.match(sql, new RegExp(`alter table ${tableName} enable row level security`, 'i'));
  });
  assert.doesNotMatch(sql, /alter table markos_company/i);
  assert.doesNotMatch(sql, /alter table markos_icps/i);
});

test('CRM-01: custom fields stay explicit and object-scoped', () => {
  const sql = fs.readFileSync(customFieldsPath, 'utf8');
  assert.match(sql, /crm_custom_field_definitions/i);
  assert.match(sql, /crm_custom_field_values/i);
  assert.match(sql, /entity_kind text not null/i);
  assert.match(sql, /entity_id text not null/i);
  assert.match(sql, /unique\(tenant_id, field_definition_id, entity_id\)/i);
});

test('CRM-01: CRUD contract names canonical ids and fail-closed authorization', () => {
  const source = fs.readFileSync(crudContractPath, 'utf8');
  assert.match(source, /entity_families:/);
  assert.match(source, /canonical_identifier: "entity_id"/);
  assert.match(source, /authorization: "fail_closed"/);
  assert.match(source, /\/api\/crm\/contacts/);
});
