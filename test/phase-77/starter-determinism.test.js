const test = require('node:test');
const assert = require('node:assert/strict');

const {
  compileStarterDescriptor,
} = require('../../onboarding/backend/brand-nextjs/starter-descriptor-compiler.cjs');
const {
  REASON_CODES,
} = require('../../onboarding/backend/brand-nextjs/handoff-diagnostics.cjs');

function createInput() {
  return {
    strategy_result: {
      metadata: {
        deterministic_fingerprint: 'strategy-fp-77',
      },
    },
    identity_result: {
      metadata: {
        deterministic_fingerprint: 'identity-fp-77',
      },
    },
    token_contract: {
      tailwind_v4: {
        css_variables: {
          '--color-brand-primary': '#0a6cff',
          '--space-4': '1rem',
        },
        theme_extensions: {
          colors: {
            brand: {
              primary: 'var(--color-brand-primary)',
            },
          },
        },
      },
      lineage: {
        strategy_fingerprint: 'token-fp-77',
      },
    },
    component_contract_manifest: {
      primitives: [
        {
          component: 'button',
          required_states: ['hover', 'focus-visible', 'disabled'],
          token_bindings: {
            background: 'color.brand.primary',
            text: 'color.text.inverse',
          },
        },
        {
          component: 'card',
          required_states: ['default'],
          token_bindings: {
            background: 'color.surface.default',
          },
        },
      ],
      lineage: {
        strategy_fingerprint: 'component-fp-77',
      },
    },
  };
}

test('starter descriptor determinism: fixed lineage input yields byte-stable fingerprint and ordering', async () => {
  const first = compileStarterDescriptor(createInput());
  const second = compileStarterDescriptor(createInput());

  assert.equal(first.diagnostics.length, 0, JSON.stringify(first.diagnostics, null, 2));
  assert.equal(second.diagnostics.length, 0, JSON.stringify(second.diagnostics, null, 2));
  assert.equal(first.metadata.deterministic_fingerprint, second.metadata.deterministic_fingerprint);
  assert.deepEqual(first.starter_descriptor, second.starter_descriptor);

  assert.deepEqual(Object.keys(first.starter_descriptor), [
    'app_shell',
    'component_bindings',
    'integration_metadata',
    'lineage',
    'theme_mappings',
  ]);

  assert.ok(first.starter_descriptor.app_shell);
  assert.ok(first.starter_descriptor.theme_mappings);
  assert.ok(first.starter_descriptor.component_bindings);
  assert.ok(first.starter_descriptor.integration_metadata);
  assert.ok(first.starter_descriptor.lineage);
});

test('starter descriptor determinism: missing required sections fail closed with stable reason codes', async () => {
  const brokenInput = createInput();
  delete brokenInput.token_contract.tailwind_v4;

  const result = compileStarterDescriptor(brokenInput);
  assert.equal(result.starter_descriptor, null);
  assert.equal(result.metadata.deterministic_fingerprint, null);
  assert.ok(result.diagnostics.some((item) => item.code === REASON_CODES.STARTER_SECTION_MISSING));
});
