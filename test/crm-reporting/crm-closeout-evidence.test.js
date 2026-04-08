const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const governanceHandler = require('../../api/governance/evidence.js');

const root = path.join(__dirname, '../..');
const checklistPath = path.join(root, '.planning/milestones/v3.3.0-LIVE-CHECKLIST.md');
const logTemplatePath = path.join(root, '.planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md');
const runRecordPath = path.join(root, '.planning/milestones/v3.3.0-LIVE-CHECK-RUN.md');
const closureMatrixPath = path.join(root, '.planning/projects/markos-v3/CLOSURE-MATRIX.md');

function makeReq({ auth }) {
  return {
    method: 'GET',
    markosAuth: auth,
    headers: {},
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

test('ATT-01 and REP-01: v3.3 live-check artifacts exist with closeout commands and evidence fields', () => {
  assert.equal(fs.existsSync(checklistPath), true, 'v3.3 live checklist must exist');
  assert.equal(fs.existsSync(logTemplatePath), true, 'v3.3 live check log template must exist');
  assert.equal(fs.existsSync(runRecordPath), true, 'v3.3 stable live check run record must exist');

  const checklistSource = fs.readFileSync(checklistPath, 'utf8');
  const logSource = fs.readFileSync(logTemplatePath, 'utf8');
  const runSource = fs.readFileSync(runRecordPath, 'utf8');

  assert.match(checklistSource, /ATT-01/);
  assert.match(checklistSource, /REP-01/);
  assert.match(checklistSource, /crm\/reporting/i);
  assert.match(checklistSource, /crm\/reporting\/verification/i);
  assert.match(checklistSource, /pass criteria/i);
  assert.match(checklistSource, /central-rollup/i);
  assert.match(logSource, /ATT-01/);
  assert.match(logSource, /REP-01/);
  assert.match(logSource, /Evidence captured/i);
  assert.match(logSource, /Run record path:/i);
  assert.match(logSource, /Central-rollup screenshot path:/i);
  assert.match(logSource, /Verdict: Pass \/ Fail/i);
  assert.match(runSource, /Repository baseline before hosted review/i);
  assert.match(runSource, /Stable run record reference:/i);
  assert.match(runSource, /Central-rollup actor or role:/i);
});

test('ATT-01 and REP-01: governance evidence packaging includes Phase 64 closeout artifacts and promotion targets', async () => {
  const req = makeReq({
    auth: {
      tenant_id: 'tenant-alpha-001',
      iamRole: 'owner',
      principal: {
        tenant_id: 'tenant-alpha-001',
        tenant_role: 'owner',
      },
    },
  });
  const res = makeRes();

  await governanceHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.reporting_closeout.phase, '64');
  assert.deepEqual(res.body.reporting_closeout.requirement_promotions.map((entry) => entry.id), ['ATT-01', 'REP-01']);
  assert.equal(res.body.reporting_closeout.live_check_artifacts.length, 3);
  assert.equal(res.body.reporting_closeout.live_check_artifacts.some((entry) => entry.includes('v3.3.0-LIVE-CHECKLIST.md')), true);
  assert.equal(res.body.reporting_closeout.live_check_artifacts.some((entry) => entry.includes('v3.3.0-LIVE-CHECK-RUN.md')), true);
});

test('ATT-01 and REP-01: closure matrix tracks Phase 64 requirement status explicitly', () => {
  assert.equal(fs.existsSync(closureMatrixPath), true, 'closure matrix must exist');
  const source = fs.readFileSync(closureMatrixPath, 'utf8');

  assert.match(source, /\| ATT-01 \|/);
  assert.match(source, /\| REP-01 \|/);
  assert.match(source, /Phase 64/i);
  assert.match(source, /Execute v3\.3 live reporting verification/i);
});