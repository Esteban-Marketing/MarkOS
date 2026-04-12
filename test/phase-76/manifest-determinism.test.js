const test = require('node:test');
const assert = require('node:assert/strict');

const { compileTokenContract } = require('../../onboarding/backend/brand-design-system/token-compiler.cjs');
const {
  compileComponentContractManifest,
} = require('../../onboarding/backend/brand-design-system/component-contract-compiler.cjs');
const {
  REQUIRED_PRIMITIVES,
  validateComponentContractManifest,
} = require('../../onboarding/backend/brand-design-system/component-contract-schema.cjs');

function buildStrategyFixture() {
  return {
    artifact: {
      voice_profile: {
        tone: 'pragmatic',
        formality: 'professional',
        energy: 'balanced',
      },
      lineage: {
        decisions: [
          {
            decision_id: 'D-04',
            source_node_ids: ['strategy:messaging:cta'],
          },
          {
            decision_id: 'D-06',
            source_node_ids: ['strategy:risk:alerts'],
          },
        ],
      },
    },
    metadata: {
      deterministic_fingerprint: 'strategy-fp-001',
    },
  };
}

function buildIdentityFixture() {
  return {
    artifact: {
      semantic_color_roles: {
        primary: { base: '#0a6cff' },
        accent: { base: '#3155c6' },
        surface: { default: '#ffffff', border: '#d7deef' },
        text: { primary: '#101828', inverse: '#ffffff' },
      },
      typography_hierarchy: {
        heading: { family: 'IBM Plex Sans', size: '1.5rem', weight: '600', line_height: '1.25' },
        body: { family: 'IBM Plex Sans', size: '1rem', weight: '400', line_height: '1.5' },
      },
      spacing_intent: {
        compact: '0.5rem',
        default: '1rem',
        relaxed: '1.5rem',
      },
      visual_constraints: {
        radius_sm: '0.375rem',
        radius_md: '0.5rem',
        radius_lg: '0.75rem',
      },
      lineage: {
        decisions: [
          {
            decision_id: 'D-05',
            source_node_ids: ['identity:type:body'],
          },
        ],
      },
    },
    metadata: {
      deterministic_fingerprint: 'identity-fp-001',
    },
  };
}

function buildTokenContract() {
  const tokenResult = compileTokenContract(buildStrategyFixture(), buildIdentityFixture());
  assert.equal(tokenResult.diagnostics.length, 0, JSON.stringify(tokenResult.diagnostics, null, 2));
  return tokenResult;
}

test('component contract compiler: fixed fixtures produce deterministic ordering and fingerprint', async () => {
  const tokenResult = buildTokenContract();

  const first = compileComponentContractManifest({
    token_contract: tokenResult.token_contract,
    strategy_result: buildStrategyFixture(),
    identity_result: buildIdentityFixture(),
    semantic_intent: {
      tone: 'neutral',
      emphasis: 'default',
      density: 'default',
      feedback_state: 'default',
      required_primitives: REQUIRED_PRIMITIVES,
      required_states: ['hover', 'focus-visible', 'active', 'disabled', 'loading'],
    },
  });

  const second = compileComponentContractManifest({
    token_contract: tokenResult.token_contract,
    strategy_result: buildStrategyFixture(),
    identity_result: buildIdentityFixture(),
    semantic_intent: {
      tone: 'neutral',
      emphasis: 'default',
      density: 'default',
      feedback_state: 'default',
      required_primitives: REQUIRED_PRIMITIVES,
      required_states: ['hover', 'focus-visible', 'active', 'disabled', 'loading'],
    },
  });

  assert.equal(first.diagnostics.length, 0, JSON.stringify(first.diagnostics, null, 2));
  assert.equal(second.diagnostics.length, 0, JSON.stringify(second.diagnostics, null, 2));
  assert.equal(first.metadata.deterministic_fingerprint, second.metadata.deterministic_fingerprint);
  assert.deepEqual(first.component_contract_manifest, second.component_contract_manifest);

  assert.deepEqual(
    first.component_contract_manifest.primitives.map((entry) => entry.component),
    REQUIRED_PRIMITIVES
  );
});

test('component contract compiler: manifest validates and carries rationale and lineage', async () => {
  const tokenResult = buildTokenContract();

  const result = compileComponentContractManifest({
    token_contract: tokenResult.token_contract,
    strategy_result: buildStrategyFixture(),
    identity_result: buildIdentityFixture(),
    semantic_intent: {
      tone: 'neutral',
      emphasis: 'strong',
      density: 'compact',
      feedback_state: 'default',
      required_primitives: REQUIRED_PRIMITIVES,
      required_states: ['hover', 'focus-visible', 'active', 'disabled', 'loading'],
    },
  });

  const schema = validateComponentContractManifest(result.component_contract_manifest);
  assert.equal(schema.valid, true, JSON.stringify(schema.diagnostics, null, 2));

  assert.equal(result.component_contract_manifest.lineage.strategy_fingerprint, 'strategy-fp-001');
  assert.equal(result.component_contract_manifest.lineage.identity_fingerprint, 'identity-fp-001');
  assert.ok(result.component_contract_manifest.primitives.every((entry) => typeof entry.mapping_rationale === 'string' && entry.mapping_rationale.length > 0));
  assert.ok(result.component_contract_manifest.primitives.every((entry) => entry.lineage && entry.lineage.decision_id));
});

test('component contract compiler: missing primitive/state coverage returns deterministic diagnostics', async () => {
  const tokenResult = buildTokenContract();

  const result = compileComponentContractManifest({
    token_contract: tokenResult.token_contract,
    strategy_result: buildStrategyFixture(),
    identity_result: buildIdentityFixture(),
    semantic_intent: {
      tone: 'neutral',
      required_primitives: ['button', 'input'],
      required_states: ['hover', 'focus-visible'],
    },
  });

  assert.equal(result.component_contract_manifest, null);
  assert.ok(Array.isArray(result.diagnostics));
  assert.ok(result.diagnostics.some((item) => item.code === 'COMPONENT_PRIMITIVE_MISSING' && item.path === 'semantic_intent.required_primitives.dialog'));
  assert.ok(result.diagnostics.some((item) => item.code === 'COMPONENT_STATE_COVERAGE_MISSING' && item.path === 'semantic_intent.required_states.loading'));
});
