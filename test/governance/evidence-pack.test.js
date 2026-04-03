const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildGovernanceEvidencePack,
  buildRetentionExportRecord,
} = require('../helpers/billing-fixtures.cjs');

const governanceContractsPath = path.join(__dirname, '../../lib/markos/governance/contracts.ts');

test('GOV-01: governance contracts export evidence, retention, and vendor inventory shapes', () => {
  const source = fs.readFileSync(governanceContractsPath, 'utf8');

  assert.match(source, /export type GovernanceEvidencePack/);
  assert.match(source, /export type RetentionExportRecord/);
  assert.match(source, /export type VendorInventoryEntry/);
  assert.match(source, /retention_window/);
  assert.match(source, /export_status/);
});

test('GOV-01: evidence-pack fixture is derived from immutable billing and identity evidence sources', () => {
  const pack = buildGovernanceEvidencePack();

  assert.equal(pack.tenant_id, 'tenant-alpha-001');
  assert.deepEqual(pack.evidence_sources, [
    'markos_audit_log',
    'billing_usage_ledger',
    'identity_role_mapping_events',
  ]);
  assert.equal(pack.generated_from_operator_notes, false);
});

test('GOV-01: retention export fixture tracks immutable export status and retention window', () => {
  const record = buildRetentionExportRecord();

  assert.equal(record.retention_window, 'P12M');
  assert.equal(record.export_status, 'ready');
  assert.equal(record.evidence_pack_id, 'evidence-pack-001');
});