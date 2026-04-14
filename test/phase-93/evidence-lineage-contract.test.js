const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeEvidenceItems } = require('../../onboarding/backend/research/evidence-merge-ranker.cjs');
const { detectEvidenceContradictions } = require('../../onboarding/backend/research/contradiction-reporter.cjs');

test('93-03 merged evidence preserves lineage and flags contradictions explicitly', () => {
  const merged = mergeEvidenceItems([
    {
      provider: 'internal',
      authority_class: 'approved_internal',
      claim: 'MarkOS is SMB-first.',
      citation: 'MIR / Canonical',
      freshness: '2026-04-10T00:00:00.000Z',
      confidence: 0.95,
      implication: 'Keep SMB framing.',
      lineage: { source_type: 'internal' },
      topic: 'positioning',
    },
    {
      provider: 'tavily',
      authority_class: 'external_official',
      claim: 'Current site messaging highlights enterprise RevOps buyers.',
      citation: 'https://example.com',
      freshness: '2026-04-14T00:00:00.000Z',
      confidence: 0.78,
      implication: 'Review current public positioning.',
      lineage: { source_type: 'external' },
      topic: 'positioning',
    },
  ]);

  assert.equal(merged.length, 2);
  assert.ok(merged.every((entry) => entry.citation && entry.freshness && typeof entry.confidence === 'number' && entry.implication));

  const contradictions = detectEvidenceContradictions(merged);
  assert.equal(contradictions.length, 1);
  assert.equal(contradictions[0].topic, 'positioning');
  assert.equal(contradictions[0].recommendation, 'surface_in_patch_preview');
});
