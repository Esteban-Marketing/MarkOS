const test = require('node:test');
const assert = require('node:assert/strict');

const runtimeContext = require('../onboarding/backend/runtime-context.cjs');

test('runtime config separates canonical vault metadata from legacy migration outputs', () => {
  const config = runtimeContext.loadRuntimeConfig({});

  assert.equal(config.bootstrap_model, 'vault-first');
  assert.equal(config.canonical_vault.root_path, config.vault_root_path);
  assert.equal(config.canonical_vault.home_note_path, config.vault_home_note_path);
  assert.equal(config.canonical_vault.canonical, true);
  assert.equal(config.canonical_vault.dependency_contract, 'obsidian-required');

  assert.equal(config.legacy_output_mode, 'migration-only');
  assert.equal(config.legacy_outputs.mode, 'migration-only');
  assert.equal(config.legacy_outputs.canonical, false);
  assert.equal(config.legacy_outputs.mir.output_path, config.mir_output_path);
  assert.equal(config.legacy_outputs.msp.output_path, config.msp_output_path);
  assert.equal(config.legacy_outputs.mir.classification, 'migration-only');
  assert.equal(config.legacy_outputs.msp.classification, 'migration-only');
});