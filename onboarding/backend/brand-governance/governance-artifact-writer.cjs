'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Recursively stable-sort an object's keys (alphabetical).
 * Mirrors the pattern in closure-gates.cjs and bundle-registry.cjs for deterministic hashing.
 */
function stableSortObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableSortObject(value[key]);
      return acc;
    }, {});
}

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Write governance evidence envelope: a machine-readable, deterministic artifact
 * containing gate results, drift evidence, and machine-readable audit trail per D-08 and D-10.
 *
 * Returns an immutable envelope with: tenant_id, bundle_id, gate_results, drift_summary,
 * evidence_hash (sha256 of stableSort), written_at (ISO timestamp).
 *
 * The evidence_hash is deterministic and can be used as verification_evidence_hash
 * in the bundle registry to prove verification per D-03.
 *
 * @param {string} tenant_id - Tenant identifier
 * @param {string} bundle_id - Bundle identifier
 * @param {object} gateResults - Result from runClosureGates({ passed, gates: {...} })
 * @param {object} driftSummary - Result from auditDrift({ tenant_id, has_drift, expected_fingerprint, ... })
 * @returns {{
 *   tenant_id: string,
 *   bundle_id: string,
 *   gate_results: object,
 *   drift_summary: object,
 *   evidence_hash: string,
 *   written_at: string
 * }}
 */
function writeGovernanceEvidence(tenant_id, bundle_id, gateResults, driftSummary) {
  // Build deterministic payload for evidence hash per D-08
  const evidencePayload = {
    tenant_id,
    bundle_id,
    gate_results: gateResults,
    drift_summary: driftSummary,
  };

  // Compute evidence hash using stableSort for determinism
  const sortedPayload = stableSortObject(evidencePayload);
  const evidence_hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(sortedPayload))
    .digest('hex');

  const envelope = Object.freeze({
    tenant_id,
    bundle_id,
    gate_results: Object.freeze(gateResults),
    drift_summary: Object.freeze(driftSummary),
    evidence_hash,
    written_at: new Date().toISOString(),
  });

  return envelope;
}

const MANDATORY_CLOSURE_SECTIONS = [
  'tenant_isolation_matrix',
  'telemetry_validation',
  'non_regression_results',
  'pageindex_sla_evidence',
  'obsidian_sync_stability',
  'requirement_coverage_ledger',
];

function writeMilestoneClosureBundle({ phase, sections }) {
  const normalizedPhase = String(phase || '').trim();
  if (!normalizedPhase) {
    throw createError('E_CLOSURE_PHASE_REQUIRED', 'phase is required for milestone closure bundle');
  }

  const payloadSections = sections && typeof sections === 'object' ? sections : {};
  const missing = MANDATORY_CLOSURE_SECTIONS.filter((name) => !(name in payloadSections));
  if (missing.length > 0) {
    throw createError(
      'E_CLOSURE_SECTION_MISSING',
      `Missing mandatory closure sections: ${missing.join(', ')}`
    );
  }

  const sectionPasses = MANDATORY_CLOSURE_SECTIONS.every((name) => {
    const entry = payloadSections[name];
    return Boolean(entry && entry.passed === true);
  });

  const hashPayload = stableSortObject({
    phase: normalizedPhase,
    sections: payloadSections,
  });
  const bundle_hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex');

  return Object.freeze({
    phase: normalizedPhase,
    passed: sectionPasses,
    sections: Object.freeze(payloadSections),
    bundle_hash,
    written_at: new Date().toISOString(),
  });
}

function persistMilestoneClosureBundle({ phase, sections, outputDir, now }) {
  const bundle = writeMilestoneClosureBundle({ phase, sections });
  const writeRoot = String(outputDir || path.join(process.cwd(), '.markos-local', 'governance', 'closure-bundles')).trim();
  if (!writeRoot) {
    throw createError('E_CLOSURE_OUTPUT_DIR_REQUIRED', 'outputDir is required for milestone closure persistence');
  }

  fs.mkdirSync(writeRoot, { recursive: true });

  const filename = `phase-${bundle.phase}-${bundle.bundle_hash}.json`;
  const bundlePath = path.join(writeRoot, filename);
  const writtenAt = String(now || bundle.written_at);

  fs.writeFileSync(
    bundlePath,
    JSON.stringify(
      {
        phase: bundle.phase,
        passed: bundle.passed,
        sections: bundle.sections,
        bundle_hash: bundle.bundle_hash,
        written_at: writtenAt,
      },
      null,
      2
    ),
    'utf8'
  );

  const bundleLocator = path.relative(process.cwd(), bundlePath).replace(/\\/g, '/');

  return Object.freeze({
    ...bundle,
    written_at: writtenAt,
    bundle_path: bundlePath,
    bundle_locator: bundleLocator,
  });
}

module.exports = {
  writeGovernanceEvidence,
  writeMilestoneClosureBundle,
  persistMilestoneClosureBundle,
  MANDATORY_CLOSURE_SECTIONS,
};
