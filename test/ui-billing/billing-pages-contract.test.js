const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const tenantPagePath = path.join(__dirname, '../../app/(markos)/settings/billing/page.tsx');
const tenantActionsPath = path.join(__dirname, '../../app/(markos)/settings/billing/actions.ts');
const operatorPagePath = path.join(__dirname, '../../app/(markos)/admin/billing/page.tsx');
const storyPath = path.join(__dirname, '../../app/(markos)/admin/billing/reconciliation.stories.tsx');

test('BIL-03 billing UI: tenant billing page follows the required module order and billing vocabulary', () => {
  assert.equal(fs.existsSync(tenantPagePath), true, 'tenant billing page must exist');
  const source = fs.readFileSync(tenantPagePath, 'utf8');

  const billingStatusIndex = source.indexOf('Billing status summary');
  const currentPlanIndex = source.indexOf('Current plan and included usage');
  const invoiceListIndex = source.indexOf('Invoice list');
  const entitlementIndex = source.indexOf('Entitlement and premium-feature availability');
  const evidenceIndex = source.indexOf('Billing evidence drawer trigger');

  assert.ok(billingStatusIndex >= 0);
  assert.ok(currentPlanIndex > billingStatusIndex);
  assert.ok(invoiceListIndex > currentPlanIndex);
  assert.ok(entitlementIndex > invoiceListIndex);
  assert.ok(evidenceIndex > entitlementIndex);
  assert.match(source, /billing period/i);
  assert.match(source, /included usage/i);
  assert.match(source, /current invoice/i);
  assert.match(source, /hold/i);
  assert.match(source, /\/api\/billing\/tenant-summary/);
});

test('BIL-03 billing UI: tenant billing actions read from the shared tenant summary API', () => {
  assert.equal(fs.existsSync(tenantActionsPath), true, 'tenant billing actions must exist');
  const source = fs.readFileSync(tenantActionsPath, 'utf8');

  assert.match(source, /reviewCurrentInvoice/);
  assert.match(source, /reviewBillingDetails/);
  assert.match(source, /\/api\/billing\/tenant-summary/);
});

test('BIL-03 billing UI: operator billing page renders reconciliation queue, detail panel, and evidence rail', () => {
  assert.equal(fs.existsSync(operatorPagePath), true, 'operator billing page must exist');
  const source = fs.readFileSync(operatorPagePath, 'utf8');

  assert.match(source, /Needs review/);
  assert.match(source, /On hold/);
  assert.match(source, /Sync failures/);
  assert.match(source, /Ready to close/);
  assert.match(source, /Invoice line-item preview panel/);
  assert.match(source, /Evidence rail/);
  assert.match(source, /Review Billing Evidence/);
  assert.match(source, /Place Hold/);
  assert.match(source, /Release Hold/);
  assert.match(source, /Retry Provider Sync/);
  assert.match(source, /\/api\/billing\/operator-reconciliation/);
  assert.match(source, /\/api\/billing\/holds/);
});

test('BIL-03 billing UI: reconciliation stories cover healthy, hold, and sync-failure states', () => {
  assert.equal(fs.existsSync(storyPath), true, 'billing reconciliation stories must exist');
  const source = fs.readFileSync(storyPath, 'utf8');

  assert.match(source, /Healthy/);
  assert.match(source, /Hold/);
  assert.match(source, /SyncFailure/);
});