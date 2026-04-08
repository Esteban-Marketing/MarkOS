const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleExecutionActions } = require('../../api/crm/execution/actions.js');
const { handleExecutionDrafts } = require('../../api/crm/execution/drafts.js');

const root = path.join(__dirname, '../..');
const draftPanelPath = path.join(root, 'components/markos/crm/draft-suggestion-panel.tsx');
const draftContractPath = path.join(root, 'contracts/F-61-draft-suggestions-v1.yaml');

function authFor(role, tenantId = 'tenant-alpha-001', actorId = `${role}-actor-001`) {
  return {
    tenant_id: tenantId,
    iamRole: role,
    principal: {
      id: actorId,
      tenant_id: tenantId,
      tenant_role: role,
    },
  };
}

function makeReq({ method = 'GET', auth = null, crmStore = null, body = {}, query = {} } = {}) {
  return {
    method,
    body,
    query,
    crmStore,
    markosAuth: auth,
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

test('CRM-06: draft suggestions remain suggestion-only with no send or sequence controls', async () => {
  const source = fs.readFileSync(draftPanelPath, 'utf8');
  const contract = fs.readFileSync(draftContractPath, 'utf8');
  assert.match(source, /Suggestion-Only Draft/);
  assert.match(source, /Non-executable/);
  assert.doesNotMatch(source, /Send Email|Start Sequence|delivery/i);
  assert.match(contract, /send_disabled: true/);
  assert.match(contract, /sequence_disabled: true/);

  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { owner_actor_id: 'manager-actor-001', intent_score: 77, amount: 1000 },
  });
  store.activities.push({
    activity_id: 'activity-001',
    tenant_id: 'tenant-alpha-001',
    activity_family: 'campaign_touch',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    occurred_at: '2026-04-04T08:00:00.000Z',
    payload_json: { direction: 'inbound' },
  });

  const draftsReq = makeReq({ method: 'GET', auth: authFor('manager'), crmStore: store, query: { now: '2026-04-04T12:00:00.000Z' } });
  const draftsRes = makeRes();
  await handleExecutionDrafts(draftsReq, draftsRes);
  assert.equal(draftsRes.statusCode, 200);
  assert.equal(draftsRes.body.drafts.length, 1);
  assert.equal(draftsRes.body.drafts[0].suggestion_only, true);

  const forbiddenReq = makeReq({ method: 'POST', auth: authFor('manager'), crmStore: store, body: { action_key: 'send_email', record_kind: 'deal', record_id: 'deal-001' } });
  const forbiddenRes = makeRes();
  await handleExecutionActions(forbiddenReq, forbiddenRes);
  assert.equal(forbiddenRes.statusCode, 400);
  assert.equal(forbiddenRes.body.error, 'CRM_EXECUTION_BOUNDARY_FORBIDDEN');
});

test('CRM-06: draft suggestions are dismissible without becoming executable workflow state', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { owner_actor_id: 'manager-actor-001', intent_score: 77, amount: 1000 },
  });
  store.activities.push({
    activity_id: 'activity-001',
    tenant_id: 'tenant-alpha-001',
    activity_family: 'campaign_touch',
    related_record_kind: 'deal',
    related_record_id: 'deal-001',
    occurred_at: '2026-04-04T08:00:00.000Z',
    payload_json: { direction: 'inbound' },
  });

  const draftsReq = makeReq({ method: 'GET', auth: authFor('manager'), crmStore: store, query: { now: '2026-04-04T12:00:00.000Z' } });
  const draftsRes = makeRes();
  await handleExecutionDrafts(draftsReq, draftsRes);

  const dismissReq = makeReq({ method: 'PATCH', auth: authFor('manager'), crmStore: store, body: { suggestion_id: draftsRes.body.drafts[0].suggestion_id } });
  const dismissRes = makeRes();
  await handleExecutionDrafts(dismissReq, dismissRes);

  const rereadReq = makeReq({ method: 'GET', auth: authFor('manager'), crmStore: store, query: { now: '2026-04-04T12:00:00.000Z' } });
  const rereadRes = makeRes();
  await handleExecutionDrafts(rereadReq, rereadRes);

  assert.equal(dismissRes.statusCode, 200);
  assert.equal(dismissRes.body.draft.status, 'dismissed');
  assert.equal(rereadRes.body.drafts.length, 0);
  assert.ok(store.activities.some((item) => item.payload_json.action === 'draft_suggestion_dismissed'));
});