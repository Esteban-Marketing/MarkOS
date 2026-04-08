const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { handleCopilotPlaybooks } = require('../../api/crm/copilot/playbooks.js');

const root = path.join(__dirname, '../..');
const routePath = path.join(root, 'app/(markos)/crm/copilot/playbooks/page.tsx');
const reviewPath = path.join(root, 'components/markos/crm/copilot-playbook-review.tsx');
const oversightPath = path.join(root, 'components/markos/crm/copilot-oversight-panel.tsx');

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    writeHead(code, headers = {}) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(payload) {
      this.body = payload ? JSON.parse(payload) : null;
    },
  };
}

test('CRM-06: playbook review route exposes explicit oversight surfaces inside the CRM shell', () => {
  [routePath, reviewPath, oversightPath].forEach((filePath) => {
    assert.equal(fs.existsSync(filePath), true, `${filePath} must exist`);
  });
  const routeSource = fs.readFileSync(routePath, 'utf8');
  assert.match(routeSource, /CopilotPlaybookReview/);
  assert.match(routeSource, /CopilotOversightPanel/);
});

test('CRM-06: cross-tenant oversight remains explicit and owner-scoped', async () => {
  const store = {
    entities: [],
    activities: [],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    outboundMessages: [],
    outboundConversations: [],
    copilotPlaybookRuns: [
      { playbook_id: 'playbook-001', tenant_id: 'tenant-beta-002', review_tenant_id: 'tenant-beta-002', playbook_key: 'account_review', status: 'awaiting_approval', actor_id: 'owner-001', actor_role: 'owner', run_id: 'run-001', record_kind: 'account', record_id: 'account-001' },
    ],
    copilotPlaybookSteps: [],
    copilotApprovalPackages: [],
    copilotMutationOutcomes: [],
  };

  const deniedReq = {
    method: 'GET',
    query: { review_tenant_id: 'tenant-beta-002' },
    crmStore: store,
    markosAuth: { tenant_id: 'tenant-alpha-001', iamRole: 'manager', principal: { id: 'manager-001', tenant_role: 'manager', tenant_id: 'tenant-alpha-001' } },
  };
  const deniedRes = createMockResponse();
  await handleCopilotPlaybooks(deniedReq, deniedRes);
  assert.equal(deniedRes.statusCode, 403);

  const allowedReq = {
    method: 'GET',
    query: { review_tenant_id: 'tenant-beta-002' },
    crmStore: store,
    markosAuth: { tenant_id: 'tenant-alpha-001', iamRole: 'owner', principal: { id: 'owner-001', tenant_role: 'owner', tenant_id: 'tenant-alpha-001' } },
  };
  const allowedRes = createMockResponse();
  await handleCopilotPlaybooks(allowedReq, allowedRes);
  assert.equal(allowedRes.statusCode, 200);
  assert.equal(allowedRes.body.target_tenant_id, 'tenant-beta-002');
  assert.equal(allowedRes.body.playbooks.length, 1);
  assert.equal(allowedRes.body.playbooks[0].tenant_id, 'tenant-beta-002');
});