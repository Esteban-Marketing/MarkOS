const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { withMockedModule } = require('./setup.js');

const chunkerPath = path.resolve(__dirname, '../onboarding/backend/literacy-chunker.cjs');
const ingestPath = path.resolve(__dirname, '../bin/ingest-literacy.cjs');
const vectorClientPath = path.resolve(__dirname, '../onboarding/backend/vector-store-client.cjs');

function loadChunker() {
  delete require.cache[require.resolve(chunkerPath)];
  return require(chunkerPath);
}

function loadVectorClient() {
  delete require.cache[require.resolve(vectorClientPath)];
  return require(vectorClientPath);
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

test('Literacy chunker parses pain_point_tags as an array', () => {
  const chunker = loadChunker();
  const fixturePath = path.resolve(__dirname, 'fixtures/literacy/Paid_Media/LIT-PM-001.md');
  const markdown = require('fs').readFileSync(fixturePath, 'utf8');
  const parsed = chunker.parseLiteracyFrontmatter(markdown);
  assert.ok(Array.isArray(parsed.pain_point_tags), 'pain_point_tags should be an array');
  assert.deepEqual(parsed.pain_point_tags, ['high_acquisition_cost', 'paid_media:high_cpr']);
});

test('Literacy chunker propagates pain_point_tags onto each chunk', () => {
  const chunker = loadChunker();
  const fixturePath = path.resolve(__dirname, 'fixtures/literacy/Paid_Media/LIT-PM-001.md');
  const markdown = require('fs').readFileSync(fixturePath, 'utf8');
  const metadata = chunker.parseLiteracyFrontmatter(markdown);
  const chunks = chunker.chunkLiteracyFile(markdown, metadata);
  assert.ok(chunks.length >= 6, `fixture should produce multiple section chunks, got ${chunks.length}`);
  assert.ok(chunks.some((chunk) => chunk.content_type === 'evidence'), 'fixture should produce an evidence chunk');
  assert.ok(chunks.some((chunk) => chunk.content_type === 'tactic'), 'fixture should produce tactic chunks');
  assert.ok(chunks.some((chunk) => chunk.content_type === 'benchmark'), 'fixture should produce a benchmark chunk');
  assert.ok(chunks.some((chunk) => chunk.content_type === 'counter-indicators'), 'fixture should produce a counter-indicators chunk');
  assert.ok(chunks.some((chunk) => chunk.content_type === 'vocabulary'), 'fixture should produce vocabulary chunks');
  for (const chunk of chunks) {
    assert.deepEqual(
      chunk.pain_point_tags,
      ['high_acquisition_cost', 'paid_media:high_cpr'],
      `chunk ${chunk.chunk_id} should carry pain_point_tags`
    );
  }
});

test('buildLiteracyFilter adds pain_point_tags CONTAINS clause', () => {
  const client = loadVectorClient();
  const filter = client.buildLiteracyFilter({ pain_point_tag: 'paid_media:high_cpr' });
  assert.ok(
    filter.includes("pain_point_tags CONTAINS 'paid_media:high_cpr'"),
    `filter should contain pain_point_tags clause, got: ${filter}`
  );
  assert.ok(filter.includes("status = 'canonical'"), 'filter should always include canonical status');
});

test('ingest-literacy script contains pain_point_tags validation error string', () => {
  const script = require('fs').readFileSync(ingestPath, 'utf8');
  assert.match(
    script,
    /MISSING_REQUIRED_FIELD:pain_point_tags/,
    'ingest-literacy.cjs must contain validation throw for missing pain_point_tags'
  );
  assert.match(
    script,
    /pain_point_tags.*Array\.isArray|Array\.isArray.*pain_point_tags/,
    'ingest-literacy.cjs must map pain_point_tags in payload'
  );
});
