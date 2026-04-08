const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const panelPath = path.join(__dirname, '../../components/markos/crm/reporting-readiness-panel.tsx');

test('REP-01: readiness panel makes degraded and healthy data states visible inside the reporting shell', () => {
  assert.equal(fs.existsSync(panelPath), true, 'readiness panel component must exist');
  const source = fs.readFileSync(panelPath, 'utf8');

  assert.match(source, /attribution coverage/i);
  assert.match(source, /identity quality/i);
  assert.match(source, /reporting freshness/i);
  assert.match(source, /degraded-state explanations/i);
  assert.match(source, /healthy and degraded states/i);
});