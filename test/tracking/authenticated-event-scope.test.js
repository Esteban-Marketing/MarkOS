const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const trackingPath = path.join(root, 'lib/markos/crm/tracking.ts');

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

test('TRK-03: authenticated high-signal events remain CRM visible', () => {
  const { normalizeTrackedActivity } = loadTsCommonJsModule(trackingPath);
  const normalized = normalizeTrackedActivity({
    tenant_id: 'tenant-alpha-001',
    authenticated: true,
    actor_id: 'owner-001',
    event_name: 'approval_completed',
    source_event_ref: 'app:approval:1',
    payload: { readiness_status: 'ready' },
  });

  assert.equal(normalized.crm_visible, true);
  assert.equal(normalized.activity_family, 'agent_event');
  assert.equal(normalized.actor_id, 'owner-001');
});

test('TRK-03: low-signal authenticated UI noise is excluded from CRM timelines', () => {
  const { normalizeTrackedActivity, appendTrackedActivity } = loadTsCommonJsModule(trackingPath);
  const normalized = normalizeTrackedActivity({
    tenant_id: 'tenant-alpha-001',
    authenticated: true,
    actor_id: 'owner-001',
    event_name: 'sidebar_toggled',
    source_event_ref: 'app:ui:1',
  });
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const appended = appendTrackedActivity(store, normalized);

  assert.equal(normalized.crm_visible, false);
  assert.equal(normalized.excluded_reason, 'LOW_SIGNAL_EVENT');
  assert.equal(appended, null);
  assert.equal(store.activities.length, 0);
});