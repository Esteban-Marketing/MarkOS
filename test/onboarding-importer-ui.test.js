const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

test('importer page exposes scan/apply controls and links the dedicated client script', () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'onboarding', 'importer.html'), 'utf8');

  assert.match(html, /id="btnScanImport"/);
  assert.match(html, /id="btnApplyImport"/);
  assert.match(html, /id="summaryGrid"/);
  assert.match(html, /src="importer\.js"/);
  assert.match(html, /Back to Onboarding/);
});

test('importer client targets the scan and apply backend routes', () => {
  const script = fs.readFileSync(path.join(process.cwd(), 'onboarding', 'importer.js'), 'utf8');

  assert.match(script, /\/api\/importer\/scan/);
  assert.match(script, /\/api\/importer\/apply/);
  assert.match(script, /function renderResult/);
  assert.match(script, /projectSlugInput/);
});