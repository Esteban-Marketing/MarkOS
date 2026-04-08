const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { handleReportingVerification } = require('../../api/crm/reporting/verification.js');

const root = path.join(__dirname, '../..');
const pagePath = path.join(root, 'app/(markos)/crm/reporting/verification/page.tsx');
const checklistPath = path.join(root, 'components/markos/crm/reporting-verification-checklist.tsx');

function makeReq({ method = 'GET', auth = null, crmStore = null, query = {} } = {}) {
  return {
    method,
    query,
    crmStore,
    markosAuth: auth,
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) {
      this.statusCode = code;
    },
    end(payload) {
      this.body = JSON.parse(payload);
    },
  };
}

test('REP-01: verification route keeps live checks and evidence capture inside the CRM reporting shell', () => {
  assert.equal(fs.existsSync(pagePath), true, 'verification page must exist');
  assert.equal(fs.existsSync(checklistPath), true, 'verification checklist component must exist');

  const pageSource = fs.readFileSync(pagePath, 'utf8');
  const checklistSource = fs.readFileSync(checklistPath, 'utf8');

  assert.match(pageSource, /ReportingVerificationChecklist/);
  assert.match(pageSource, /ReportingReadinessPanel/);
  assert.match(pageSource, /CRM Reporting Verification/i);
  assert.match(checklistSource, /ATT-01/);
  assert.match(checklistSource, /REP-01/);
  assert.match(checklistSource, /live verification/i);
  assert.match(checklistSource, /closeout promotion/i);
});

test('REP-01: verification API returns checklist state, readiness review, and requirement-promotion metadata', async () => {
  const req = makeReq({
    method: 'GET',
    auth: {
      tenant_id: 'tenant-alpha-001',
      iamRole: 'manager',
      principal: {
        id: 'manager-001',
        tenant_id: 'tenant-alpha-001',
        tenant_role: 'manager',
      },
    },
    crmStore: {
      entities: [],
      activities: [],
      identityLinks: [],
      outboundMessages: [],
      mergeDecisions: [],
      mergeLineage: [],
    },
  });
  const res = makeRes();

  await handleReportingVerification(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(Array.isArray(res.body.checklist), true);
  assert.deepEqual(res.body.checklist.map((entry) => entry.requirement_id), ['ATT-01', 'REP-01']);
  assert.equal(typeof res.body.readiness_review.status, 'string');
  assert.equal(res.body.promotion.closure_matrix_target, '.planning/projects/markos-v3/CLOSURE-MATRIX.md');
  assert.deepEqual(res.body.promotion.requirements.map((entry) => entry.id), ['ATT-01', 'REP-01']);
});