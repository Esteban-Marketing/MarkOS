const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const contractsPath = path.join(root, 'lib/markos/crm/contracts.ts');
const migrationPath = path.join(root, 'supabase/migrations/60_crm_pipeline_workspace.sql');
const pipelineContractPath = path.join(root, 'contracts/F-60-pipeline-config-v1.yaml');
const objectContractPath = path.join(root, 'contracts/F-60-object-workspace-metadata-v1.yaml');

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

test('CRM-03: pipeline workspace migration declares tenant-owned pipeline, stage, and object metadata tables', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  ['crm_pipelines', 'crm_pipeline_stages', 'crm_workspace_object_definitions'].forEach((tableName) => {
    assert.match(sql, new RegExp(`create table if not exists ${tableName}`, 'i'));
    assert.match(sql, new RegExp(`${tableName}[\\s\\S]*tenant_id text not null`, 'i'));
    assert.match(sql, new RegExp(`alter table ${tableName} enable row level security`, 'i'));
  });

  assert.match(sql, /stage_order integer not null/i);
  assert.match(sql, /is_won boolean not null default false/i);
  assert.match(sql, /calendar_enabled boolean not null default false/i);
  assert.match(sql, /funnel_enabled boolean not null default false/i);
  assert.match(sql, /markos_tenant_memberships/i);
});

test('CRM-03: CRM contracts expose workspace views, pipeline validation, and custom-object eligibility', () => {
  const contracts = loadTsCommonJsModule(contractsPath);

  assert.deepEqual(contracts.crmWorkspaceViewTypes, ['kanban', 'table', 'detail', 'timeline', 'calendar', 'funnel']);
  assert.equal(contracts.validatePipelineDefinition({
    tenant_id: 'tenant-alpha-001',
    pipeline_key: 'renewal',
    display_name: 'Renewal',
    object_kind: 'deal',
  }), true);
  assert.equal(contracts.validateWorkspaceObjectDefinition({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Deals',
    workspace_enabled: true,
    pipeline_enabled: true,
    detail_enabled: true,
    timeline_enabled: true,
  }), true);
  assert.equal(contracts.validateWorkspaceObjectDefinition({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'partner_portal',
    display_name: 'Partner Portal',
    is_custom_object: true,
    workspace_enabled: true,
    pipeline_enabled: false,
    detail_enabled: true,
    timeline_enabled: true,
    calendar_enabled: true,
    calendar_date_field_key: 'renewal_at',
  }), true);
});

test('REP-01: pipeline and object contracts name simple stage semantics and view-capability rules explicitly', () => {
  const pipelineContract = fs.readFileSync(pipelineContractPath, 'utf8');
  const objectContract = fs.readFileSync(objectContractPath, 'utf8');

  assert.match(pipelineContract, /stage_order:/);
  assert.match(pipelineContract, /is_won/);
  assert.match(pipelineContract, /is_lost/);
  assert.match(pipelineContract, /\/api\/crm\/pipelines/);
  assert.match(objectContract, /workspace_enabled/);
  assert.match(objectContract, /calendar_enabled/);
  assert.match(objectContract, /funnel_enabled/);
  assert.match(objectContract, /custom_object/);
});