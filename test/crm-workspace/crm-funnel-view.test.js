const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { createCrmEntity, upsertPipelineConfig, upsertWorkspaceObjectDefinition } = require('../../lib/markos/crm/api.cjs');
const { handleFunnel } = require('../../api/crm/funnel.js');

const root = path.join(__dirname, '../..');
const workspacePath = path.join(root, 'lib/markos/crm/workspace.ts');
const funnelViewPath = path.join(root, 'components/markos/crm/funnel-view.tsx');
const contractPath = path.join(root, 'contracts/F-60-workspace-rollups-v1.yaml');

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

function makeReq({ method = 'GET', body = {}, query = {}, auth = null, crmStore = null } = {}) {
  return { method, body, query, crmStore, markosAuth: auth };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

function authFor(role, tenantId = 'tenant-alpha-001') {
  return {
    tenant_id: tenantId,
    iamRole: role,
    principal: { id: `${role}-actor-001`, tenant_id: tenantId, tenant_role: role },
  };
}

test('REP-01: funnel view computes weighted stage forecast and value totals from canonical records', () => {
  assert.equal(fs.existsSync(funnelViewPath), true);
  const contract = fs.readFileSync(contractPath, 'utf8');
  assert.match(contract, /funnel_semantics:/);
  assert.match(contract, /record_count/);
  assert.match(contract, /total_value/);
  assert.match(contract, /weighted_value/);

  const workspace = loadTsCommonJsModule(workspacePath);
  const state = workspace.createWorkspaceState({
    tenant_id: 'tenant-alpha-001',
    object_kind: 'deal',
    view_type: 'funnel',
    pipeline_key: 'sales',
    records: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200 } },
      { entity_id: 'deal-002', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Beta Deal', attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 800 } },
      { entity_id: 'deal-003', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Gamma Deal', attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 200 } },
    ],
  });
  const rows = workspace.buildFunnelRows({
    state,
    pipeline: { stages: [
      { stage_key: 'qualified', display_name: 'Qualified', forecast_weight: 0.25 },
      { stage_key: 'proposal', display_name: 'Proposal', forecast_weight: 0.75 },
    ] },
  });

  assert.deepEqual(rows.map((row) => [row.stage_key, row.record_count, row.total_value, row.weighted_value]), [
    ['qualified', 1, 1200, 300],
    ['proposal', 2, 1000, 750],
  ]);
});

test('REP-01: funnel API derives rows from active stage config and canonical deal values', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [], objectDefinitions: [], pipelines: [], pipelineStages: [] };
  upsertWorkspaceObjectDefinition(store, {
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Deals',
    workspace_enabled: true,
    pipeline_enabled: true,
    detail_enabled: true,
    timeline_enabled: true,
    calendar_enabled: true,
    funnel_enabled: true,
    calendar_date_field_key: 'expected_close_at',
  }, 'owner-actor-001');
  upsertPipelineConfig(store, {
    tenant_id: 'tenant-alpha-001',
    pipeline_key: 'sales',
    display_name: 'Sales Pipeline',
    object_kind: 'deal',
    stages: [
      { stage_key: 'qualified', display_name: 'Qualified', stage_order: 1, forecast_weight: 0.25 },
      { stage_key: 'proposal', display_name: 'Proposal', stage_order: 2, forecast_weight: 0.75 },
    ],
  }, 'owner-actor-001');
  createCrmEntity(store, {
    entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'qualified', amount: 1200 },
  });
  createCrmEntity(store, {
    entity_id: 'deal-002', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Beta Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'proposal', amount: 800 },
  });

  const req = makeReq({ method: 'GET', auth: authFor('readonly'), crmStore: store, query: { object_kind: 'deal', pipeline_key: 'sales' } });
  const res = makeRes();
  await handleFunnel(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.rows.map((row) => [row.stage_key, row.record_count, row.total_value, row.weighted_value]), [
    ['qualified', 1, 1200, 300],
    ['proposal', 1, 800, 600],
  ]);
});