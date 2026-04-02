const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'literacy');
const PHASE44_FIXTURE_FILES = [
  path.join(FIXTURE_ROOT, 'paid_media', 'pm-attribution-baseline.md'),
  path.join(FIXTURE_ROOT, 'content_seo', 'seo-visibility-baseline.md'),
  path.join(FIXTURE_ROOT, 'lifecycle_email', 'email-retention-baseline.md'),
];

function parseFixtureFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(frontmatterMatch, `fixture missing frontmatter: ${filePath}`);
  const frontmatter = frontmatterMatch[1];

  const disciplineMatch = frontmatter.match(/^discipline:\s*(.+)$/m);
  const docIdMatch = frontmatter.match(/^doc_id:\s*(.+)$/m);
  const lastUpdatedMatch = frontmatter.match(/^last_updated:\s*(.+)$/m);

  const businessModels = [];
  const painPointTags = [];
  let activeList = null;
  for (const line of frontmatter.split(/\r?\n/)) {
    if (/^business_model:\s*$/.test(line)) {
      activeList = businessModels;
      continue;
    }
    if (/^pain_point_tags:\s*$/.test(line)) {
      activeList = painPointTags;
      continue;
    }
    const listMatch = line.match(/^\s*-\s*(.+)$/);
    if (listMatch && activeList) {
      activeList.push(listMatch[1].trim());
      continue;
    }
    activeList = null;
  }

  return {
    discipline: disciplineMatch ? disciplineMatch[1].trim() : '',
    doc_id: docIdMatch ? docIdMatch[1].trim() : '',
    last_updated: lastUpdatedMatch ? lastUpdatedMatch[1].trim() : '',
    business_models: businessModels,
    pain_point_tags: painPointTags,
  };
}

function loadFixtureCorpus() {
  return PHASE44_FIXTURE_FILES.map((filePath) => {
    assert.ok(fs.existsSync(filePath), `missing required fixture: ${filePath}`);
    return parseFixtureFrontmatter(filePath);
  });
}

test('Phase 44 literacy e2e contracts (Wave 0 stubs)', async (t) => {
  const fixtures = loadFixtureCorpus();

  await t.test('[44-01-03] fixture corpus includes deterministic docs for 3 disciplines', () => {
    assert.ok(fixtures.length >= 3, 'expected at least 3 literacy fixtures');
    const disciplines = new Set(fixtures.map((doc) => doc.discipline));
    assert.ok(disciplines.has('Paid_Media'));
    assert.ok(disciplines.has('Content_SEO'));
    assert.ok(disciplines.has('Lifecycle_Email'));
    for (const doc of fixtures) {
      assert.ok(doc.doc_id.length > 0);
      assert.ok(doc.last_updated.length > 0);
      assert.ok(doc.business_models.length > 0);
      assert.ok(doc.pain_point_tags.length > 0);
    }
  });

  await t.test('[44-01-01 LIT-16] lifecycle contract: ingest -> submit -> orchestrate -> standards_context', { todo: 'pending Wave 2 implementation in this file' }, async () => {
    assert.fail('Wave 2 lifecycle assertions not implemented yet');
  });

  await t.test('[44-01-02 LIT-17] coverage contract: GET /api/literacy/coverage returns shape and unconfigured branch', { todo: 'pending Wave 1 implementation in handlers/server' }, async () => {
    assert.fail('Wave 1 coverage endpoint assertions not implemented yet');
  });

  await t.test('[44-04-01 LIT-18] populated corpus must not produce zero retrieval hits', { todo: 'pending Wave 3 regression gate implementation' }, async () => {
    assert.fail('Wave 3 regression gate assertions not implemented yet');
  });

  await t.test('[44-04-03 LIT-18] zero-hit diagnostics include missing disciplines and fixture expectation', { todo: 'pending Wave 3 diagnostics implementation' }, async () => {
    assert.fail('Wave 3 diagnostics assertions not implemented yet');
  });
});
