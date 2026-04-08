const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildGovernanceEvidencePack,
  buildDeletionWorkflowRecord,
  buildRetentionExportRecord,
} = require('../helpers/billing-fixtures.cjs');

const governanceContractsPath = path.join(__dirname, '../../lib/markos/governance/contracts.ts');
const governanceHandlerPath = path.join(__dirname, '../../api/governance/evidence.js');

test('GOV-01: governance contracts export evidence, retention, and vendor inventory shapes', () => {
  const source = fs.readFileSync(governanceContractsPath, 'utf8');

  assert.match(source, /export type GovernanceEvidencePack/);
  assert.match(source, /export type GovernancePrivilegedActionFamily/);
  assert.match(source, /export type DeletionWorkflowRecord/);
  assert.match(source, /export type RetentionExportRecord/);
  assert.match(source, /export type VendorInventoryEntry/);
  assert.match(source, /privileged_action_families/);
  assert.match(source, /retention_window/);
  assert.match(source, /export_status/);
  assert.match(source, /workflow_status/);
  assert.match(source, /export_before_delete_status/);
});

test('GOV-01: evidence-pack fixture is derived from immutable billing and identity evidence sources', () => {
  const pack = buildGovernanceEvidencePack();

  assert.equal(pack.tenant_id, 'tenant-alpha-001');
  assert.deepEqual(pack.evidence_sources, [
    'markos_audit_log',
    'billing_usage_ledger',
    'identity_role_mapping_events',
    'billing_provider_sync_log',
    'agent_approval_decision_log',
    'tenant_configuration_change_log',
  ]);
  assert.deepEqual(
    pack.privileged_action_families.map((family) => family.action_family),
    ['authentication_authorization', 'approvals', 'billing_administration', 'tenant_configuration']
  );
  assert.ok(pack.privileged_action_families.every((family) => family.immutable_provenance_fields.length > 0));
  assert.equal(pack.generated_from_operator_notes, false);
});

test('GOV-01: retention export fixture tracks immutable export status and retention window', () => {
  const record = buildRetentionExportRecord();

  assert.equal(record.retention_window, 'P12M');
  assert.equal(record.export_status, 'ready');
  assert.equal(record.evidence_pack_id, 'evidence-pack-001');
});

test('SEC-02: deletion workflow fixture captures request, export-before-delete, and resulting evidence', () => {
  const workflow = buildDeletionWorkflowRecord();

  assert.equal(workflow.request_scope, 'tenant_workspace_data');
  assert.equal(workflow.export_before_delete_status, 'completed');
  assert.equal(workflow.export_record_id, 'retention-export-001');
  assert.equal(workflow.workflow_status, 'completed');
  assert.equal(workflow.resulting_evidence_ref, 'evidence-pack-001');
});

test('SEC-02: governance evidence endpoint exposes deletion workflow beside retention export', () => {
  const source = fs.readFileSync(governanceHandlerPath, 'utf8');

  assert.match(source, /buildDeletionWorkflowRecord/);
  assert.match(source, /deletion_workflow/);
  assert.match(source, /retention_export/);
});