const test = require('node:test');
const assert = require('node:assert/strict');

const { compileTokenContract } = require('../../onboarding/backend/brand-design-system/token-compiler.cjs');
const { validateTokenContract } = require('../../onboarding/backend/brand-design-system/token-contract-schema.cjs');

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
            decision_id: 'D-01',
            source_node_ids: ['strategy:positioning:1', 'strategy:positioning:2'],
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
        heading: {
          family: 'IBM Plex Sans',
          size: '1.5rem',
          weight: '600',
          line_height: '1.25',
        },
        body: {
          family: 'IBM Plex Sans',
          size: '1rem',
          weight: '400',
          line_height: '1.5',
        },
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
        shadow_sm: '0 1px 2px rgba(16,24,40,0.08)',
        shadow_md: '0 8px 24px rgba(16,24,40,0.18)',
        shadow_lg: '0 16px 40px rgba(16,24,40,0.22)',
      },
      lineage: {
        decisions: [
          {
            decision_id: 'D-08',
            source_node_ids: ['identity:semantic-role-projection'],
          },
        ],
      },
    },
    metadata: {
      deterministic_fingerprint: 'identity-fp-001',
    },
  };
}

test('token compiler: fixed fixtures produce deterministic fingerprint and canonical ordering', async () => {
  const strategyFixture = buildStrategyFixture();
  const identityFixture = buildIdentityFixture();

  const first = compileTokenContract(strategyFixture, identityFixture);
  const second = compileTokenContract(strategyFixture, identityFixture);

  assert.equal(first.diagnostics.length, 0, JSON.stringify(first.diagnostics, null, 2));
  assert.equal(second.diagnostics.length, 0, JSON.stringify(second.diagnostics, null, 2));
  assert.equal(first.metadata.deterministic_fingerprint, second.metadata.deterministic_fingerprint);
  assert.deepEqual(first.token_contract, second.token_contract);

  assert.deepEqual(Object.keys(first.token_contract.categories), [
    'color',
    'motion',
    'radius',
    'shadow',
    'spacing',
    'typography',
  ]);
});

test('token compiler: canonical contract validates and includes lineage metadata', async () => {
  const result = compileTokenContract(buildStrategyFixture(), buildIdentityFixture());
  const schema = validateTokenContract(result.token_contract);

  assert.equal(schema.valid, true, JSON.stringify(schema.diagnostics, null, 2));
  assert.equal(result.token_contract.lineage.strategy_fingerprint, 'strategy-fp-001');
  assert.equal(result.token_contract.lineage.identity_fingerprint, 'identity-fp-001');
  assert.ok(Array.isArray(result.token_contract.lineage.decisions));
  assert.ok(result.token_contract.lineage.decisions.length >= 2);

  const mapping = result.token_contract.tailwind_v4;
  assert.equal(typeof mapping.css_variables['--color-brand-primary'], 'string');
  assert.equal(typeof mapping.theme_extensions.colors.brand.primary, 'string');
});

test('token compiler: missing identity sections fail with deterministic diagnostics', async () => {
  const strategyFixture = buildStrategyFixture();
  const identityFixture = {
    artifact: {
      typography_hierarchy: {
        body: { family: 'IBM Plex Sans' },
      },
      lineage: {
        decisions: [],
      },
    },
    metadata: {
      deterministic_fingerprint: 'identity-fp-001',
    },
  };

  const result = compileTokenContract(strategyFixture, identityFixture);

  assert.equal(result.token_contract, null);
  assert.ok(Array.isArray(result.diagnostics));
  assert.ok(result.diagnostics.some((item) => item.code === 'TOKEN_INPUT_INVALID' && item.path === 'identity.artifact.semantic_color_roles'));
  assert.ok(result.diagnostics.some((item) => item.code === 'TOKEN_INPUT_INVALID' && item.path === 'identity.artifact.spacing_intent'));
});
