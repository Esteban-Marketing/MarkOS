const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');
const queuePath = path.join(root, 'components/markos/crm/execution-queue.tsx');
const detailPath = path.join(root, 'components/markos/crm/execution-detail.tsx');

test('CRM-04: execution queue UI makes personal and manager or team scopes first-class', () => {
  const source = fs.readFileSync(queuePath, 'utf8');
  assert.match(source, /Personal Queue/);
  assert.match(source, /Manager \/ Team Queue/);
  assert.match(source, /Due \/ Overdue/);
  assert.match(source, /Approval Needed/);
  assert.match(source, /Ownership \/ Data/);
});

test('CRM-06: execution detail UI exposes rationale and bounded action controls instead of a passive dashboard', () => {
  const source = fs.readFileSync(detailPath, 'utf8');
  assert.match(source, /Source Signals/);
  assert.match(source, /Bounded Actions/);
  assert.match(source, /create_task|Create Task/);
  assert.match(source, /append_note|Add Note/);
  assert.match(source, /update_record|Raise Priority/);
});