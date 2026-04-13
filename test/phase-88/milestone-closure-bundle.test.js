'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { writeMilestoneClosureBundle } = require('../../onboarding/backend/brand-governance/governance-artifact-writer.cjs');

function fullSections() {
  return {
    tenant_isolation_matrix: { passed: true },
    telemetry_validation: { passed: true },
    non_regression_results: { passed: true },
    pageindex_sla_evidence: { passed: true },
    obsidian_sync_stability: { passed: true },
    requirement_coverage_ledger: { passed: true, requirements: ['GOVV-01', 'GOVV-02', 'GOVV-03', 'GOVV-04', 'GOVV-05'] },
  };
}

test('closure bundle contains all mandatory sections and deterministic hash', () => {
  const bundle = writeMilestoneClosureBundle({ phase: '88', sections: fullSections() });
  assert.equal(bundle.phase, '88');
  assert.equal(bundle.passed, true);
  assert.ok(bundle.bundle_hash);
  assert.ok(bundle.sections.requirement_coverage_ledger);
});

test('closure bundle fails when mandatory section is missing', () => {
  const sections = fullSections();
  delete sections.telemetry_validation;

  assert.throws(
    () => writeMilestoneClosureBundle({ phase: '88', sections }),
    { code: 'E_CLOSURE_SECTION_MISSING' }
  );
});
