const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const attributionPath = path.join(root, 'lib/markos/crm/attribution.ts');
const contractPath = path.join(root, 'contracts/F-64-attribution-model-v1.yaml');

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

test('ATT-01: attribution contract codifies fixed CRM-native weights and evidence lineage', () => {
  assert.equal(fs.existsSync(contractPath), true, `${contractPath} must exist`);
  const source = fs.readFileSync(contractPath, 'utf8');

  assert.match(source, /fixed_weight_model/i);
  assert.match(source, /campaign_touch/i);
  assert.match(source, /web_activity/i);
  assert.match(source, /outbound_event/i);
  assert.match(source, /accepted_identity_only/i);
  assert.match(source, /attribution_update/i);
});

test('ATT-01: weighted attribution stays deterministic and inspectable across CRM activity families', () => {
  const { buildWeightedAttributionModel } = loadTsCommonJsModule(attributionPath);

  const result = buildWeightedAttributionModel({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    record_id: 'deal-001',
    revenue_amount: 1000,
    timeline: [
      {
        activity_id: 'activity-outbound-001',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'outbound_event',
        related_record_kind: 'deal',
        related_record_id: 'deal-001',
        source_event_ref: 'outbound:thread-001',
        payload_json: { channel: 'email' },
        occurred_at: '2026-04-01T12:00:00.000Z',
      },
      {
        activity_id: 'activity-web-001',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'web_activity',
        related_record_kind: 'deal',
        related_record_id: 'deal-001',
        source_event_ref: 'tracking:pageview',
        payload_json: { page: '/pricing' },
        occurred_at: '2026-04-02T12:00:00.000Z',
      },
      {
        activity_id: 'activity-campaign-001',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'campaign_touch',
        related_record_kind: 'deal',
        related_record_id: 'deal-001',
        source_event_ref: 'tracking:utm-entry',
        payload_json: { utm_campaign: 'spring-launch' },
        occurred_at: '2026-04-03T12:00:00.000Z',
      },
    ],
    identity_links: [],
  });

  assert.equal(result.record_id, 'deal-001');
  assert.equal(result.total_weight, 1);
  assert.deepEqual(
    result.weights.map((entry) => [entry.activity_family, entry.weight]),
    [
      ['campaign_touch', 0.5],
      ['web_activity', 0.3],
      ['outbound_event', 0.2],
    ]
  );
  assert.deepEqual(
    result.contributions.map((entry) => entry.revenue_credit),
    [500, 300, 200]
  );
  assert.ok(result.evidence.some((entry) => entry.source_event_ref === 'tracking:utm-entry'));
});

test('ATT-01: attribution only credits stitched anonymous activity after accepted identity linkage', () => {
  const { buildWeightedAttributionModel } = loadTsCommonJsModule(attributionPath);

  const result = buildWeightedAttributionModel({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    record_id: 'contact-001',
    revenue_amount: 400,
    timeline: [
      {
        activity_id: 'activity-web-accepted',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'web_activity',
        related_record_kind: 'contact',
        related_record_id: 'contact-001',
        anonymous_identity_id: 'anon-accepted',
        source_event_ref: 'tracking:accepted',
        payload_json: { page: '/demo' },
        occurred_at: '2026-04-02T10:00:00.000Z',
      },
      {
        activity_id: 'activity-web-review',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'web_activity',
        related_record_kind: 'contact',
        related_record_id: 'contact-001',
        anonymous_identity_id: 'anon-review',
        source_event_ref: 'tracking:review',
        payload_json: { page: '/pricing' },
        occurred_at: '2026-04-01T10:00:00.000Z',
      },
      {
        activity_id: 'activity-campaign',
        tenant_id: 'tenant-alpha-001',
        activity_family: 'campaign_touch',
        related_record_kind: 'contact',
        related_record_id: 'contact-001',
        source_event_ref: 'tracking:campaign',
        payload_json: { utm_campaign: 'spring-launch' },
        occurred_at: '2026-04-03T10:00:00.000Z',
      },
    ],
    identity_links: [
      {
        identity_link_id: 'identity-link-001',
        tenant_id: 'tenant-alpha-001',
        anonymous_identity_id: 'anon-accepted',
        known_record_kind: 'contact',
        known_record_id: 'contact-001',
        confidence: 0.9,
        link_status: 'accepted',
        source_event_ref: 'identity:accepted',
      },
      {
        identity_link_id: 'identity-link-002',
        tenant_id: 'tenant-alpha-001',
        anonymous_identity_id: 'anon-review',
        known_record_kind: 'contact',
        known_record_id: 'contact-001',
        confidence: 0.6,
        link_status: 'review',
        source_event_ref: 'identity:review',
      },
    ],
  });

  assert.deepEqual(result.weights.map((entry) => entry.source_event_ref), ['tracking:campaign', 'tracking:accepted']);
  assert.equal(result.weights.some((entry) => entry.source_event_ref === 'tracking:review'), false);
  assert.equal(result.uncredited_touch_count, 1);
  assert.match(result.readiness.reasons.join(' '), /review identity linkage excluded/i);
});