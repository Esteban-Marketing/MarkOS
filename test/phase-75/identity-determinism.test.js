const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeBrandInput } = require('../../onboarding/backend/brand-inputs/normalize-brand-input.cjs');
const { synthesizeStrategyArtifact } = require('../../onboarding/backend/brand-strategy/strategy-synthesizer.cjs');
const {
  compileIdentityArtifact,
  IDENTITY_RULESET_VERSION,
} = require('../../onboarding/backend/brand-identity/identity-compiler.cjs');
const {
  persistIdentityArtifact,
  queryIdentityArtifactsByTenant,
  resetIdentityArtifactStore,
} = require('../../onboarding/backend/brand-identity/identity-artifact-writer.cjs');

function buildBrandInput() {
  return {
    brand_profile: {
      primary_name: 'Identity Stability Lab',
      mission_statement: 'Produce deterministic identity contracts from deterministic strategy.',
    },
    audience_segments: [
      {
        segment_id: 'seg-ops',
        segment_name: 'Operations leaders',
        pains: [
          { pain: 'Inconsistent visual language by team', rationale: 'Teams reinterpret briefs differently.' },
        ],
        needs: [
          { need: 'Stable semantic design contracts', rationale: 'Execution lanes need deterministic inputs.' },
        ],
        expectations: [
          { expectation: 'Clear accessibility defaults', rationale: 'Launch approvals need objective checks.' },
        ],
        desired_outcomes: ['Faster review cycles'],
      },
      {
        segment_id: 'seg-design',
        segment_name: 'Design systems maintainers',
        pains: [
          { pain: 'Ad hoc palette decisions', rationale: 'Palette drift causes regressions.' },
        ],
        needs: [
          { need: 'Traceable lineage from strategy', rationale: 'Identity decisions must be auditable.' },
        ],
        expectations: [
          { expectation: 'Predictable role outputs', rationale: 'Token pipelines rely on stable role keys.' },
        ],
        desired_outcomes: ['Lower design-system churn'],
      },
    ],
  };
}

test.beforeEach(() => {
  resetIdentityArtifactStore();
});

test('identity compiler: repeated compilation yields same artifact and fingerprint', async () => {
  const tenantId = 'tenant-identity-determinism';
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());
  const synthesized = synthesizeStrategyArtifact(tenantId, normalized);

  const run1 = compileIdentityArtifact(synthesized);
  const run2 = compileIdentityArtifact(synthesized);

  assert.equal(run1.metadata.ruleset_version, IDENTITY_RULESET_VERSION);
  assert.deepEqual(run1.artifact, run2.artifact);
  assert.equal(run1.metadata.deterministic_fingerprint, run2.metadata.deterministic_fingerprint);
  assert.equal(run1.metadata.strategy_fingerprint, synthesized.metadata.deterministic_fingerprint);
});

test('identity compiler: canonical role structure and lineage are present', async () => {
  const tenantId = 'tenant-identity-structure';
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());
  const synthesized = synthesizeStrategyArtifact(tenantId, normalized);
  const compiled = compileIdentityArtifact(synthesized);

  assert.ok(compiled.artifact.semantic_color_roles['brand.primary']);
  assert.ok(compiled.artifact.semantic_color_roles['text.primary']);
  assert.ok(compiled.artifact.typography_hierarchy['type.body']);
  assert.ok(Array.isArray(compiled.artifact.spacing_intent.scale));
  assert.equal(compiled.artifact.lineage.ruleset_version, IDENTITY_RULESET_VERSION);
  assert.ok(Array.isArray(compiled.artifact.lineage.decisions));
  assert.ok(compiled.artifact.lineage.decisions.length > 0);
  assert.ok(compiled.artifact.lineage.decisions[0].strategy_node_ids.length > 0);
});

test('identity writer: tenant-scoped additive upsert is replay-safe', async () => {
  const tenantId = 'tenant-identity-write';
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());
  const synthesized = synthesizeStrategyArtifact(tenantId, normalized);
  const compiled = compileIdentityArtifact(synthesized);

  const first = persistIdentityArtifact(tenantId, compiled);
  const second = persistIdentityArtifact(tenantId, compiled);
  const rows = queryIdentityArtifactsByTenant(tenantId);

  assert.equal(first.created, true);
  assert.equal(first.committed, true);
  assert.equal(second.created, false);
  assert.equal(second.committed, false);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].upsert_count, 2);
  assert.ok(rows[0].artifact_id.startsWith(`${tenantId}:identity:`));
});
