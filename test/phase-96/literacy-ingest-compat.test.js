const test = require('node:test');
const assert = require('node:assert/strict');

const { parseLiteracyFrontmatter, chunkLiteracyFile } = require('../../onboarding/backend/literacy-chunker.cjs');

test('96-02 legacy literacy docs still parse and chunk without new fields', () => {
  const markdown = [
    '```yaml',
    '---',
    'doc_id: LEGACY-001',
    'discipline: Paid_Media',
    'business_model: [B2B]',
    'pain_point_tags: [high_cac]',
    '---',
    '```',
    '# Paid Media Baseline',
    '',
    'Definition copy.',
    '',
    '## EVIDENCE BASE',
    'Evidence copy.',
  ].join('\n');

  const metadata = parseLiteracyFrontmatter(markdown);
  const chunks = chunkLiteracyFile(markdown, metadata);

  assert.equal(metadata.doc_id, 'LEGACY-001');
  assert.ok(chunks.length >= 1);
  assert.deepEqual(chunks[0].pain_point_tags, ['high_cac']);
  assert.deepEqual(chunks[0].neuro_trigger_tags, []);
});

test('96-02 enriched literacy docs propagate additive neuro-aware metadata to each chunk', () => {
  const markdown = [
    '```yaml',
    '---',
    'doc_id: ENRICHED-001',
    'discipline: Paid_Media',
    'business_model: [B2B]',
    'pain_point_tags: [high_cac]',
    'desired_outcome_tags: [more_pipeline]',
    'neuro_trigger_tags: [B01, b03]',
    'icp_segment_tags: [revops_leader]',
    'company_tailoring_profile: {"proof_posture":"evidence_first"}',
    '---',
    '```',
    '# Paid Media Enriched',
    '',
    'Definition copy.',
    '',
    '## EVIDENCE BASE',
    'Evidence copy.',
  ].join('\n');

  const metadata = parseLiteracyFrontmatter(markdown);
  const chunks = chunkLiteracyFile(markdown, metadata);

  assert.deepEqual(metadata.neuro_trigger_tags, ['B01', 'B03']);
  assert.equal(metadata.company_tailoring_profile.proof_posture, 'evidence_first');
  assert.ok(chunks.length >= 1);
  for (const chunk of chunks) {
    assert.deepEqual(chunk.desired_outcome_tags, ['more_pipeline']);
    assert.deepEqual(chunk.neuro_trigger_tags, ['B01', 'B03']);
    assert.deepEqual(chunk.icp_segment_tags, ['revops_leader']);
    assert.equal(chunk.company_tailoring_profile.proof_posture, 'evidence_first');
  }
});
