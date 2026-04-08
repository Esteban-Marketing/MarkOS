const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const reportingPath = path.join(root, 'lib/markos/crm/reporting.ts');
const readinessApiPath = path.join(root, 'api/crm/reporting/readiness.js');
const telemetryPath = path.join(root, 'lib/markos/telemetry/events.ts');
const reportingContractPath = path.join(root, 'contracts/F-64-reporting-data-v1.yaml');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename: filePath });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filePath), specifier);
      const extension = path.extname(resolved);
      if (extension === '.cjs' || extension === '.json' || extension === '.node') {
        return require(resolved);
      }
      return loadTsCommonJsModule(resolved);
    }
    return require(specifier);
  };
  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

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
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

test('REP-01: reporting contract makes readiness, freshness, productivity, and executive summary explicit', () => {
  assert.equal(fs.existsSync(reportingContractPath), true, `${reportingContractPath} must exist`);
  const source = fs.readFileSync(reportingContractPath, 'utf8');

  assert.match(source, /readiness/i);
  assert.match(source, /freshness/i);
  assert.match(source, /pipeline_health/i);
  assert.match(source, /sla_risk/i);
  assert.match(source, /productivity/i);
  assert.match(source, /executive_summary/i);
});

test('REP-01: readiness report degrades honestly when identity, tracking, or outbound coverage is partial', () => {
  const { buildReadinessReport } = loadTsCommonJsModule(reportingPath);

  const report = buildReadinessReport({
    tenant_id: 'tenant-alpha-001',
    contacts: [
      { entity_id: 'contact-001', tenant_id: 'tenant-alpha-001', record_kind: 'contact', display_name: 'Alpha Contact', attributes: {} },
      { entity_id: 'contact-002', tenant_id: 'tenant-alpha-001', record_kind: 'contact', display_name: 'Beta Contact', attributes: {} },
    ],
    identity_links: [
      {
        identity_link_id: 'identity-link-001',
        tenant_id: 'tenant-alpha-001',
        anonymous_identity_id: 'anon-001',
        known_record_kind: 'contact',
        known_record_id: 'contact-001',
        confidence: 0.92,
        link_status: 'accepted',
        source_event_ref: 'identity:accepted',
      },
      {
        identity_link_id: 'identity-link-002',
        tenant_id: 'tenant-alpha-001',
        anonymous_identity_id: 'anon-002',
        known_record_kind: 'contact',
        known_record_id: 'contact-002',
        confidence: 0.52,
        link_status: 'review',
        source_event_ref: 'identity:review',
      },
    ],
    activities: [
      {
        activity_id: 'activity-001',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'campaign_touch',
        related_record_kind: 'contact',
        related_record_id: 'contact-001',
        source_event_ref: 'tracking:campaign',
        payload_json: { utm_campaign: 'spring-launch' },
        occurred_at: '2026-04-04T10:00:00.000Z',
      },
    ],
    outbound_messages: [],
    now: '2026-04-06T10:00:00.000Z',
  });

  assert.equal(report.status, 'degraded');
  assert.equal(report.coverage.identity.accepted_links, 1);
  assert.equal(report.coverage.identity.review_links, 1);
  assert.equal(report.coverage.tracking.covered_records, 1);
  assert.equal(report.coverage.outbound.records_with_outbound, 0);
  assert.match(report.summary, /degraded/i);
  assert.match(report.reasons.join(' '), /identity stitching pending review/i);
  assert.match(report.reasons.join(' '), /outbound evidence missing/i);
});

test('REP-01: readiness API returns deterministic degraded-state reporting payload and telemetry vocabulary exists', async () => {
  const { handleReportingReadiness } = require('../../api/crm/reporting/readiness.js');
  const telemetrySource = fs.readFileSync(telemetryPath, 'utf8');

  assert.match(telemetrySource, /markos_crm_reporting_viewed/);
  assert.match(telemetrySource, /markos_crm_reporting_readiness_inspected/);
  assert.match(telemetrySource, /markos_crm_attribution_drilldown_opened/);

  const req = makeReq({
    method: 'GET',
    auth: {
      tenant_id: 'tenant-alpha-001',
      iamRole: 'manager',
      principal: {
        id: 'manager-actor-001',
        tenant_id: 'tenant-alpha-001',
        tenant_role: 'manager',
      },
    },
    crmStore: {
      entities: [
        { entity_id: 'contact-001', tenant_id: 'tenant-alpha-001', record_kind: 'contact', display_name: 'Alpha Contact', created_at: '2026-04-01T00:00:00.000Z', updated_at: '2026-04-01T00:00:00.000Z', status: 'active', linked_record_kind: null, linked_record_id: null, merged_into: null, attributes: {} },
      ],
      activities: [],
      identityLinks: [],
      outboundMessages: [],
      mergeDecisions: [],
      mergeLineage: [],
    },
  });
  const res = makeRes();

  await handleReportingReadiness(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.readiness.status, 'degraded');
  assert.equal(res.body.readiness.coverage.tracking.covered_records, 0);
  assert.equal(res.body.readiness.coverage.outbound.records_with_outbound, 0);
  assert.ok(Array.isArray(res.body.readiness.reasons));
  assert.ok(res.body.readiness.reasons.length > 0);
});