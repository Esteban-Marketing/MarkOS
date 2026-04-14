const test = require('node:test');
const assert = require('node:assert/strict');

const { appendOverrideNote } = require('../../onboarding/backend/research/evaluation-override-log.cjs');

test('95-03 manual overrides remain explicit and append-only', () => {
  const entry = appendOverrideNote({
    actor_id: 'operator-1',
    rationale: 'Reviewed with supporting evidence and approved for manual follow-up.',
    evidence_refs: ['ev-1', 'ev-2'],
    blockers: ['GROUNDING_BLOCKED'],
  });

  assert.equal(entry.actor_id, 'operator-1');
  assert.equal(entry.rationale.includes('Reviewed'), true);
  assert.deepEqual(entry.evidence_refs, ['ev-1', 'ev-2']);
  assert.deepEqual(entry.blockers, ['GROUNDING_BLOCKED']);
  assert.equal(typeof entry.timestamp, 'string');
});
