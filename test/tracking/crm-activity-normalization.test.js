const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const trackingPath = path.join(root, 'lib/markos/crm/tracking.ts');
const ingestContractPath = path.join(root, 'contracts/F-59-tracking-activity-ingest-v1.yaml');

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

test('TRK-03: normalization translates raw tracked events into MarkOS CRM activity families', () => {
  const { normalizeTrackedActivity, appendTrackedActivity } = loadTsCommonJsModule(trackingPath);
  const normalized = normalizeTrackedActivity({
    tenant_id: 'tenant-alpha-001',
    event_name: 'posthog.$pageview',
    source_event_ref: 'ingest:pageview:1',
    payload: { page_url: 'https://example.com/pricing' },
  });
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const appended = appendTrackedActivity(store, normalized);

  assert.equal(normalized.activity_family, 'web_activity');
  assert.equal(normalized.payload_json.event_name, 'posthog.$pageview');
  assert.notEqual(normalized.activity_family, 'posthog.$pageview');
  assert.equal(appended.activity_family, 'web_activity');
  assert.equal(store.activities.length, 1);
});

test('TRK-03: tracked entry payload preserves destination and UTM evidence', () => {
  const { buildTrackedEntryPayload } = loadTsCommonJsModule(trackingPath);
  const payload = buildTrackedEntryPayload({
    destination: 'https://example.com/pricing',
    utm_source: 'linkedin',
    utm_campaign: 'q2-launch',
    affiliate_id: 'partner-9',
    attribution_state: 'preserved',
  });

  assert.equal(payload.destination, 'https://example.com/pricing');
  assert.equal(payload.utm_source, 'linkedin');
  assert.equal(payload.utm_campaign, 'q2-launch');
  assert.equal(payload.affiliate_id, 'partner-9');
  assert.equal(payload.attribution_state, 'preserved');
});

test('TRK-03: tracking ingest contract names normalized activity families explicitly', () => {
  const contract = fs.readFileSync(ingestContractPath, 'utf8');

  assert.match(contract, /supported_activity_families:/);
  assert.match(contract, /required_ledger_fields:/);
  assert.match(contract, /tenant_id/);
  assert.match(contract, /source_event_ref/);
  assert.match(contract, /occurred_at/);
  assert.match(contract, /web_activity/);
  assert.match(contract, /campaign_touch/);
  assert.match(contract, /attribution_update/);
});