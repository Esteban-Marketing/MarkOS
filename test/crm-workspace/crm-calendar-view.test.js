const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { createCrmEntity, upsertWorkspaceObjectDefinition } = require('../../lib/markos/crm/api.cjs');
const { handleCalendar } = require('../../api/crm/calendar.js');

const root = path.join(__dirname, '../..');
const workspacePath = path.join(root, 'lib/markos/crm/workspace.ts');
const calendarViewPath = path.join(root, 'components/markos/crm/calendar-view.tsx');
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

test('CRM-03: calendar view only renders explicitly eligible objects and approved date fields', () => {
  assert.equal(fs.existsSync(calendarViewPath), true);
  const contract = fs.readFileSync(contractPath, 'utf8');
  assert.match(contract, /calendar_eligibility:/);
  assert.match(contract, /calendar_date_field_key/);

  const workspace = loadTsCommonJsModule(workspacePath);
  const state = workspace.createWorkspaceState({
    tenant_id: 'tenant-alpha-001',
    object_kind: 'deal',
    view_type: 'calendar',
    pipeline_key: 'sales',
    records: [
      { entity_id: 'deal-001', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Alpha Deal', attributes: { pipeline_key: 'sales', stage_key: 'qualified', expected_close_at: '2026-04-11T10:00:00.000Z' } },
      { entity_id: 'deal-002', tenant_id: 'tenant-alpha-001', record_kind: 'deal', display_name: 'Beta Deal', attributes: { pipeline_key: 'sales', stage_key: 'proposal' } },
    ],
  });

  const entries = workspace.buildCalendarEntries({
    state,
    object_definition: { calendar_enabled: true, calendar_date_field_key: 'expected_close_at' },
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].entity_id, 'deal-001');
});

test('CRM-03: calendar API lists eligible entries and persists reschedules with audit evidence', async () => {
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
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { pipeline_key: 'sales', stage_key: 'qualified', expected_close_at: '2026-04-11T10:00:00.000Z' },
  });

  let req = makeReq({ method: 'GET', auth: authFor('readonly'), crmStore: store, query: { object_kind: 'deal', pipeline_key: 'sales' } });
  let res = makeRes();
  await handleCalendar(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.entries.length, 1);
  assert.equal(res.body.entries[0].entity_id, 'deal-001');

  req = makeReq({
    method: 'PATCH',
    auth: authFor('manager'),
    crmStore: store,
    body: { record_kind: 'deal', entity_id: 'deal-001', value: '2026-04-15T09:00:00.000Z' },
  });
  res = makeRes();
  await handleCalendar(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.record.attributes.expected_close_at, '2026-04-15T09:00:00.000Z');
  assert.equal(store.activities.at(-1).payload_json.action, 'calendar_reschedule');
});