const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { withMockedModule } = require('./setup.js');

const chunkerPath = path.resolve(__dirname, '../onboarding/backend/literacy-chunker.cjs');
const ingestPath = path.resolve(__dirname, '../bin/ingest-literacy.cjs');

function loadChunker() {
  delete require.cache[require.resolve(chunkerPath)];
  return require(chunkerPath);
}

test('Literacy chunker parses fenced yaml arrays', () => {
  const chunker = loadChunker();
  const sample = [
    '```yaml',
    '---',
    'doc_id: "DOC-1"',
    'discipline: "Paid_Media"',
    'business_model: ["B2B", "SaaS"]',
    'retrieval_keywords: ["hooks", "copy"]',
    '---',
    '```',
    '',
    '# Test Document',
  ].join('\n');

  const parsed = chunker.parseLiteracyFrontmatter(sample);
  assert.equal(parsed.doc_id, 'DOC-1');
  assert.deepEqual(parsed.business_model, ['B2B', 'SaaS']);
  assert.deepEqual(parsed.retrieval_keywords, ['hooks', 'copy']);
});

test('Literacy chunker splits tactics and vocabulary deterministically', () => {
  const chunker = loadChunker();
  const sample = [
    '```yaml',
    '---',
    'doc_id: "DOC-2"',
    'discipline: "Paid_Media"',
    '---',
    '```',
    '',
    '# Paid Social Hooks',
    'Definition paragraph.',
    '',
    '## EVIDENCE BASE',
    '- Data point',
    '',
    '## CORE TACTICS',
    '### Pattern Interrupt',
    'Lead with a contrarian opener.',
    '### Specificity Anchor',
    'Use quantified claims.',
    '',
    '## PERFORMANCE BENCHMARKS',
    '| metric | value |',
    '| --- | --- |',
    '| ctr | 2.1 |',
    '',
    '## COUNTER-INDICATORS',
    '- Rising CPL',
    '',
    '## VOCABULARY',
    '- **Hook**: Opening line.',
    '- **Proof**: Validation element.',
  ].join('\n');

  const metadata = chunker.parseLiteracyFrontmatter(sample);
  const chunksA = chunker.chunkLiteracyFile(sample, metadata);
  const chunksB = chunker.chunkLiteracyFile(sample, metadata);

  assert.ok(Array.isArray(chunksA));
  assert.deepEqual(chunksA.map((c) => c.chunk_id), chunksB.map((c) => c.chunk_id));
});

test('Ingest CLI script exists and is executable entrypoint', () => {
  const script = require('fs').readFileSync(ingestPath, 'utf8');
  assert.match(script, /#!\/usr\/bin\/env node/);
  assert.match(script, /--dry-run/);
});
