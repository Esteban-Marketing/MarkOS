const test = require('node:test');
const assert = require('node:assert/strict');

const {
  compileStarterDescriptor,
} = require('../../onboarding/backend/brand-nextjs/starter-descriptor-compiler.cjs');
const {
  projectRoleHandoffPacks,
} = require('../../onboarding/backend/brand-nextjs/role-handoff-pack-projector.cjs');
const {
  REASON_CODES,
} = require('../../onboarding/backend/brand-nextjs/handoff-diagnostics.cjs');

function createCompilerInput() {
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

function compileDescriptor() {
  const descriptorResult = compileStarterDescriptor(createCompilerInput());
  assert.equal(descriptorResult.diagnostics.length, 0, JSON.stringify(descriptorResult.diagnostics, null, 2));
  assert.ok(descriptorResult.starter_descriptor);
  return descriptorResult.starter_descriptor;
}

test('role pack determinism: repeated projection from one descriptor is byte-stable', async () => {
  const descriptor = compileDescriptor();
  const first = projectRoleHandoffPacks(descriptor);
  const second = projectRoleHandoffPacks(descriptor);

  assert.equal(first.diagnostics.length, 0, JSON.stringify(first.diagnostics, null, 2));
  assert.equal(second.diagnostics.length, 0, JSON.stringify(second.diagnostics, null, 2));
  assert.equal(first.metadata.deterministic_fingerprint, second.metadata.deterministic_fingerprint);
  assert.deepEqual(first.role_pack_contract, second.role_pack_contract);

  assert.deepEqual(Object.keys(first.role_pack_contract.role_packs), [
    'content_marketing',
    'designer',
    'founder_operator',
    'frontend_engineer',
    'strategist',
  ]);
});

test('role pack determinism: all role actions and checks preserve lineage pointers', async () => {
  const descriptor = compileDescriptor();
  const result = projectRoleHandoffPacks(descriptor);

  assert.equal(result.diagnostics.length, 0, JSON.stringify(result.diagnostics, null, 2));

  Object.values(result.role_pack_contract.role_packs).forEach((rolePack) => {
    rolePack.immediate_next_actions.forEach((entry) => {
      assert.ok(entry.lineage);
      assert.ok(Array.isArray(entry.lineage.source_artifacts));
      assert.ok(entry.lineage.source_artifacts.length > 0);
    });

    rolePack.acceptance_checks.forEach((entry) => {
      assert.ok(entry.lineage);
      assert.ok(Array.isArray(entry.lineage.source_artifacts));
      assert.ok(entry.lineage.source_artifacts.length > 0);
    });
  });
});

test('role pack determinism: invalid starter descriptor fails with explicit diagnostics', async () => {
  const invalidDescriptor = {
    app_shell: {
      framework: 'nextjs',
    },
  };

  const result = projectRoleHandoffPacks(invalidDescriptor);
  assert.equal(result.role_pack_contract, null);
  assert.equal(result.metadata.deterministic_fingerprint, null);
  assert.ok(result.diagnostics.some((item) => item.code === REASON_CODES.ROLE_PROJECTOR_INPUT_INVALID));
});
