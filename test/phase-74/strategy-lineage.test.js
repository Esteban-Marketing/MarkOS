const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { validateStrategyArtifact } = require('../../onboarding/backend/brand-strategy/strategy-artifact-schema.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

test('lineage: every strategy and messaging claim has non-empty evidence_node_ids', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').strategy_artifact;
  const result = validateStrategyArtifact(payload);

  assert.equal(result.valid, true, result.errors.join('; '));
});

test('lineage: missing evidence_node_ids is rejected', async () => {
  const payload = loadFixture('strategy-evidence-conflict.json').strategy_artifact;
  const result = validateStrategyArtifact(payload);

  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((entry) => entry.includes('evidence_node_ids must be a non-empty string array')),
    `Expected evidence lineage failure, got: ${result.errors.join('; ')}`
  );
});

test('lineage: empty evidence arrays are rejected even when claim text exists', async () => {
  const payload = loadFixture('strategy-evidence-valid.json').strategy_artifact;
  payload.disallowed_claims[0].evidence_node_ids = [];

  const result = validateStrategyArtifact(payload);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((entry) => entry.includes('disallowed_claims[0].evidence_node_ids')),
    `Expected disallowed claim lineage failure, got: ${result.errors.join('; ')}`
  );
});
