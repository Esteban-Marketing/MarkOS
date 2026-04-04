const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const governancePagePath = path.join(__dirname, '../../app/(markos)/admin/governance/page.tsx');
const governanceStoryPath = path.join(__dirname, '../../app/(markos)/admin/governance/governance.stories.tsx');

test('GOV-01 governance UI: governance page exposes the four required sections', () => {
  assert.equal(fs.existsSync(governancePagePath), true, 'governance page must exist');
  const source = fs.readFileSync(governancePagePath, 'utf8');

  assert.match(source, /Identity Federation/);
  assert.match(source, /Access Reviews/);
  assert.match(source, /Retention and Export/);
  assert.match(source, /Vendor Inventory/);
  assert.match(source, /\/api\/governance\/evidence/);
  assert.match(source, /\/api\/governance\/vendor-inventory/);
});

test('GOV-01 governance UI: identity federation detail rail keeps denied mappings visible', () => {
  const source = fs.readFileSync(governancePagePath, 'utf8');

  assert.match(source, /Source claim/);
  assert.match(source, /Matched rule/);
  assert.match(source, /Mapped role/);
  assert.match(source, /Denial reason/);
  assert.match(source, /EXTERNAL_ROLE_ESCALATION_DENIED/);
});

test('GOV-01 governance UI: governance stories cover default, denied mapping, and export-ready states', () => {
  assert.equal(fs.existsSync(governanceStoryPath), true, 'governance stories must exist');
  const source = fs.readFileSync(governanceStoryPath, 'utf8');

  assert.match(source, /Default/);
  assert.match(source, /DeniedMapping/);
  assert.match(source, /ExportReady/);
});