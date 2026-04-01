# Phase 39: Pain-Points-First Content Corpus — Research

**Researched:** 2026-04-01
**Domain:** Literacy corpus content authoring + frontmatter schema extension + ingestion pipeline validation
**Confidence:** HIGH (all findings verified directly against source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-39-01:** Two-tier pain-point taxonomy: 6-8 coarse parent categories + 2-3 discipline-specific sub-tags per discipline. Parents drive Phase 40 discipline routing; sub-tags sharpen within-discipline filter precision.
- **D-39-02:** Production-complete documents only. All 6 chunk types fully written with citable benchmarks, real evidence, tactic variants, counter-indicators per business model. No stub documents, no `[FILL]` markers.
- **D-39-03:** Hybrid business-model annotation. Universal tactics tagged `business_model: ["all"]`; model-specific supplements tagged explicitly (e.g., `["B2B", "SaaS"]`).
- **D-39-04:** Corpus lives at `.agent/markos/literacy/{discipline}/`. Co-located with agent template assets. Canonical invocation: `node bin/ingest-literacy.cjs --path .agent/markos/literacy/Paid_Media`.

### Claude's Discretion

- Exact set of 6-8 parent pain-point categories and sub-tag values.
- Which 3 documents to author per discipline (start with highest-frequency pain points per discipline).
- Exact frontmatter field name casing and validation error message copy in `ingest-literacy.cjs`.
- Whether taxonomy artifact is JSON, markdown table, or inline constant (Phase 40 determines final form; Phase 39 only needs to define the content).

### Deferred Ideas (OUT OF SCOPE)

- Phase 40 multi-discipline retrieval, discipline router, or `pain_point_tags CONTAINS ANY` filter — that is Phase 40 work.
- Dynamic skeleton generator — Phase 41.
- Secure DB provisioning flow — Phase 42.
- Onboarding→literacy activation hook — Phase 43.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIT-01 | Corpus coverage: ≥3 production-complete docs per discipline × 5 disciplines | §Corpus Design, §Document Template, §Pain-Point Taxonomy |
| LIT-02 | Pain-point taxonomy: two-tier (parent + discipline sub-tags), machine-readable artifact | §Pain-Point Taxonomy, §Taxonomy Artifact |
| LIT-03 | Business-model annotations: hybrid universal + model-specific supplement strategy | §Business-Model Annotation, §Model Profiles |
</phase_requirements>

---

## Summary

Phase 39 is a content-authoring and schema-extension phase. The Phase 32 plumbing (vector store, ingestion CLI, chunker, Supabase table) is production-ready and fully functional. The gap is threefold: (1) no content files exist yet, (2) the `pain_point_tags` field is not in the ingestion payload or Upstash metadata, and (3) there is no validation that rejects documents missing `pain_point_tags`.

The `parseLiteracyFrontmatter()` parser in `literacy-chunker.cjs` is generic — it reads any YAML key from the fenced block. Adding `pain_point_tags: ["low_conversions"]` to a document's frontmatter will be parsed automatically without parser code changes. However, three code changes are required: (1) `ingest-literacy.cjs` must validate `pain_point_tags` presence and map it to the payload, (2) `upsertLiteracyChunk()` in `vector-store-client.cjs` must include `pain_point_tags` in the Upstash metadata object and Supabase row, and (3) `buildLiteracyFilter()` must support `pain_point_tags CONTAINS '...'` filter conditions. A Supabase migration adding `pain_point_tags TEXT[]` to `markos_literacy_chunks` is also required.

**Primary recommendation:** Start with the taxonomy definition and Supabase migration (they unblock all downstream work), then extend the ingestion pipeline, then author corpus documents, then ingest and verify.

---

## Standard Stack

### Core (inherited from Phase 32 — no new installs)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| `literacy-chunker.cjs` | `onboarding/backend/literacy-chunker.cjs` | ✅ Existing | Frontmatter parser + heading-based chunker |
| `ingest-literacy.cjs` | `bin/ingest-literacy.cjs` | ✅ Existing (extend) | CLI ingestion pipeline with validation |
| `vector-store-client.cjs` | `onboarding/backend/vector-store-client.cjs` | ✅ Existing (extend) | `getLiteracyContext`, `upsertLiteracyChunk`, `buildLiteracyFilter` |
| Upstash Vector | existing index | ✅ Configured | Standards namespaces (`markos-standards-{discipline}`) |
| Supabase | existing project | ✅ Configured (extend) | `markos_literacy_chunks` table — ADD `pain_point_tags TEXT[]` column |

**No new npm installs required.** All dependencies already in `package.json`.

---

## Architecture Patterns

### Corpus Directory Structure

```
.agent/markos/literacy/
├── taxonomy.json                        ← machine-readable two-tier taxonomy (D-39-01)
├── Paid_Media/
│   ├── LIT-PM-001-high-cpr.md
│   ├── LIT-PM-002-low-roas.md
│   └── LIT-PM-003-attribution-fragmentation.md
├── Content_SEO/
│   ├── LIT-SEO-001-low-rankings.md
│   ├── LIT-SEO-002-thin-content.md
│   └── LIT-SEO-003-low-organic-ctr.md
├── Lifecycle_Email/
│   ├── LIT-EMAIL-001-low-open-rate.md
│   ├── LIT-EMAIL-002-high-churn-signals.md
│   └── LIT-EMAIL-003-weak-nurture-sequences.md
├── Social/
│   ├── LIT-SOCIAL-001-low-engagement.md
│   ├── LIT-SOCIAL-002-audience-growth-plateau.md
│   └── LIT-SOCIAL-003-brand-awareness.md
└── Landing_Pages/
    ├── LIT-LP-001-low-cvr.md
    ├── LIT-LP-002-high-bounce.md
    └── LIT-LP-003-form-abandonment.md
```

### Document Template Structure (6 required chunk types)

```markdown
```yaml
---
doc_id: "LIT-PM-001-high-cpr"
discipline: "Paid_Media"
sub_discipline: "Performance_Advertising"
business_model: ["all"]
pain_point_tags: ["high_acquisition_cost", "paid_media:high_cpr"]
funnel_stage: "Acquisition"
category: "STANDARDS"
status: "canonical"
evidence_level: "study"
source_ref: "Meta Ads Benchmark Report 2024"
version: "1.0"
last_validated: "2026-04-01"
ttl_days: 180
retrieval_keywords: ["CPR", "cost per result", "paid social", "ad efficiency"]
agent_use: ["markos-copy-drafter", "markos-campaign-planner"]
---
```

# [Document Title — the pain point, stated directly]
[Definition paragraph — 2-4 sentences. What this pain point is and why it degrades business outcomes.]

## EVIDENCE BASE
- [Statistic with source: "X% of advertisers see CPR increase after Y months without creative refresh — Meta 2024"]
- [Benchmark: "Industry median CPR for B2B SaaS LinkedIn = $45–$110 — Metadata.io 2024"]
- [Pattern: "Top quartile performers rotate creatives every 14–21 days"]

## CORE TACTICS
### [Tactic 1 Name]
[2-4 paragraphs describing the tactic, when to use it, how to execute it, and expected outcome.]

### [Tactic 2 Name]
[2-4 paragraphs.]

### [Tactic 3 Name]
[2-4 paragraphs.]

## PERFORMANCE BENCHMARKS
| Metric | Poor | Median | Top Quartile | Source |
|--------|------|--------|--------------|--------|
| [metric] | [val] | [val] | [val] | [source] |

## COUNTER-INDICATORS
- **[Business model or scenario]:** [When NOT to apply this document's core tactic — and what to do instead.]
- **[Scenario]:** [Counter-indicator description.]

## VOCABULARY
- **[Term]**: [Definition]
- **[Term]**: [Definition]
```

**Critical:** The `## CORE TACTICS` heading is exact — the chunker uses `findSection(text, 'CORE TACTICS')` with a case-insensitive exact match. Same for `## EVIDENCE BASE`, `## PERFORMANCE BENCHMARKS`, `## COUNTER-INDICATORS`, `## VOCABULARY`. Misspelling any of these headings will cause that chunk type to be silently skipped.

### Pain-Point Taxonomy Design

**Parent categories (8 — span all 5 disciplines):**

| Parent Tag | Definition | Primary Disciplines |
|------------|------------|---------------------|
| `high_acquisition_cost` | CAC / CPL / CPR trending above benchmark; budget efficiency degrading | Paid_Media, Content_SEO |
| `low_conversions` | Low CVR at key funnel moments — ad to landing page, landing page to lead, lead to trial | Paid_Media, Landing_Pages |
| `poor_retention_churn` | MRR churn, subscriber loss, repeat purchase rate declining | Lifecycle_Email |
| `low_organic_visibility` | Search rankings declining or stagnant; organic traffic share shrinking | Content_SEO |
| `attribution_measurement` | Cannot accurately attribute revenue to channel; data fragmentation across touchpoints | Paid_Media, Social |
| `audience_mismatch` | Reaching wrong ICP; poor segmentation; high bounce from irrelevant audiences | All disciplines |
| `pipeline_velocity` | Leads stalling in mid-funnel; follow-up gaps; nurture sequences not converting | Lifecycle_Email, Landing_Pages |
| `content_engagement` | Content published but not driving interaction, shares, comments, return visits | Social, Content_SEO |

**Discipline-specific sub-tags (2-3 per discipline):**

| Discipline | Sub-tag | Meaning |
|------------|---------|---------|
| Paid_Media | `paid_media:high_cpr` | Cost-per-result above benchmark for ad format / objective |
| Paid_Media | `paid_media:low_roas` | Return on ad spend below profitable threshold |
| Paid_Media | `paid_media:attribution_gap` | Multi-touch attribution fragmented across platforms |
| Content_SEO | `content_seo:low_rankings` | Target keywords not ranking in top 20 |
| Content_SEO | `content_seo:thin_content` | Pages lacking depth, E-E-A-T signals, or citable evidence |
| Content_SEO | `content_seo:low_organic_ctr` | Ranking but not driving clicks — title/meta optimization gap |
| Lifecycle_Email | `lifecycle_email:low_open_rate` | Open rates below channel benchmark; deliverability / subject line issues |
| Lifecycle_Email | `lifecycle_email:high_unsubscribe` | List churn driven by frequency, irrelevance, or list hygiene |
| Lifecycle_Email | `lifecycle_email:weak_nurture` | Mid-funnel sequences not progressing leads to qualified stage |
| Social | `social:low_engagement` | Content receiving near-zero interaction relative to reach |
| Social | `social:audience_growth_plateau` | Follower growth stalled; organic reach declining |
| Social | `social:poor_brand_awareness` | Low unaided recall; brand not associating with category problem |
| Landing_Pages | `landing_pages:low_cvr` | Page visitor to form-fill below benchmark (< 2.5% for B2B) |
| Landing_Pages | `landing_pages:high_bounce` | Visitors leave without scrolling or engaging — message/offer mismatch |
| Landing_Pages | `landing_pages:poor_form_completion` | Form started but abandoned; friction, length, or trust issue |

### Taxonomy Artifact Format

`taxonomy.json` at `.agent/markos/literacy/taxonomy.json` — referenced by Phase 40's discipline router:

```json
{
  "version": "1.0",
  "parents": [
    { "tag": "high_acquisition_cost", "disciplines": ["Paid_Media", "Content_SEO"] },
    { "tag": "low_conversions", "disciplines": ["Paid_Media", "Landing_Pages"] },
    { "tag": "poor_retention_churn", "disciplines": ["Lifecycle_Email"] },
    { "tag": "low_organic_visibility", "disciplines": ["Content_SEO"] },
    { "tag": "attribution_measurement", "disciplines": ["Paid_Media", "Social"] },
    { "tag": "audience_mismatch", "disciplines": ["Paid_Media", "Content_SEO", "Lifecycle_Email", "Social", "Landing_Pages"] },
    { "tag": "pipeline_velocity", "disciplines": ["Lifecycle_Email", "Landing_Pages"] },
    { "tag": "content_engagement", "disciplines": ["Social", "Content_SEO"] }
  ],
  "sub_tags": {
    "Paid_Media": ["paid_media:high_cpr", "paid_media:low_roas", "paid_media:attribution_gap"],
    "Content_SEO": ["content_seo:low_rankings", "content_seo:thin_content", "content_seo:low_organic_ctr"],
    "Lifecycle_Email": ["lifecycle_email:low_open_rate", "lifecycle_email:high_unsubscribe", "lifecycle_email:weak_nurture"],
    "Social": ["social:low_engagement", "social:audience_growth_plateau", "social:poor_brand_awareness"],
    "Landing_Pages": ["landing_pages:low_cvr", "landing_pages:high_bounce", "landing_pages:poor_form_completion"]
  }
}
```

---

## Code Change Inventory

### Change 1: `ingest-literacy.cjs` — Add required field validation + payload mapping

**Where:** After `const metadata = parseLiteracyFrontmatter(markdown)` in the `main()` loop, before `chunkLiteracyFile()`.

**What to add (validation block):**
```javascript
// Validate required fields
const REQUIRED_FIELDS = ['doc_id', 'discipline', 'business_model', 'pain_point_tags'];
for (const field of REQUIRED_FIELDS) {
  const val = metadata[field];
  const missing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
  if (missing) {
    throw new Error(`MISSING_REQUIRED_FIELD:${field} in ${filePath}`);
  }
}
```

**What to add to payload object (after `retrieval_keywords` line):**
```javascript
pain_point_tags: Array.isArray(metadata.pain_point_tags) ? metadata.pain_point_tags : [],
```

### Change 2: `vector-store-client.cjs` — `buildLiteracyFilter()` extension

**Current signature:**
```javascript
function buildLiteracyFilter(filters = {}) {
  const parts = ["status = 'canonical'"];
  if (filters.business_model) { parts.push(`business_model CONTAINS '${escapeFilterValue(filters.business_model)}'`); }
  if (filters.funnel_stage)   { parts.push(`funnel_stage = '${escapeFilterValue(filters.funnel_stage)}'`); }
  if (filters.content_type)   { parts.push(`content_type = '${escapeFilterValue(filters.content_type)}'`); }
  return parts.join(' AND ');
}
```

**Add after `content_type` block:**
```javascript
if (filters.pain_point_tag) {
  parts.push(`pain_point_tags CONTAINS '${escapeFilterValue(filters.pain_point_tag)}'`);
}
```

> Note: Phase 39 adds single-value filter support (`filters.pain_point_tag` as string). Phase 40 will extend to multi-value `CONTAINS ANY` if needed. This keeps Phase 39 minimal.

### Change 3: `vector-store-client.cjs` — `upsertLiteracyChunk()` metadata and Supabase row

**In the `metadata` object (Upstash):**
```javascript
pain_point_tags: Array.isArray(chunk.pain_point_tags) ? chunk.pain_point_tags : [],
```

**In the `row` object (Supabase), after `retrieval_keywords`:**
```javascript
pain_point_tags: Array.isArray(chunk.pain_point_tags) ? chunk.pain_point_tags : [],
```

### Change 4: Supabase migration — add `pain_point_tags TEXT[]` column

```sql
-- Migration: add pain_point_tags to markos_literacy_chunks
ALTER TABLE markos_literacy_chunks
  ADD COLUMN IF NOT EXISTS pain_point_tags TEXT[] DEFAULT '{}';
```

Non-destructive. Existing rows get an empty array default. Migration file lands in `supabase/migrations/`.

---

## Business-Model Annotation Strategy

The 7 business models (from Phase 12 `example-resolver.cjs` and the model profiles reference):

| Model | Key differentiators |
|-------|---------------------|
| `B2B` | ABM, account progression, enterprise pipeline, sales cycle length, committee buyers |
| `SaaS` | Trial conversion, PLG, in-app re-engagement, MRR churn, expansion revenue |
| `DTC` | ROAS efficiency, LTV maximization, post-purchase sequences, influencer co-creation |
| `B2C` | Seasonal calendar, broad creative, social proof at scale, awareness-heavy funnel |
| `Nonprofit` | Mission-based messaging, donor LTV, grant-period seasonality |
| `Marketplace` | Dual-sided acquisition, supply-side friction, liquidity mechanics |
| `Agency` | Case study ROI proof, category authority, retainer conversion |

**Universal (tag `["all"]`):** Brand voice discipline, creative rotation cadence, A/B test methodology, benchmark tracking, audience segmentation hygiene, copy framework (problem–agitate–solve). Any tactic applicable to all 7 models with no meaningful model-specific variation.

**Model-specific supplement documents (NOT tagged `["all"]`):**

| Tag subset | Examples |
|------------|---------|
| `["B2B", "SaaS"]` | ABM ad targeting, LinkedIn account list upload, enterprise deal acceleration sequences |
| `["SaaS"]` | Trial-to-paid conversion optimization, in-app re-engagement sequences, churn risk signals |
| `["DTC", "B2C"]` | ROAS scaling via lookalike suppression, LTV-based bid strategy, post-purchase upsell flows |
| `["DTC"]` | Influencer UGC brief, SMS cart abandonment, collection launch email sequence |
| `["Nonprofit"]` | Donor acquisition via cause-aligned content, seasonal giving campaign structure |
| `["Marketplace"]` | Supply-side SEO content, demand-side retargeting, platform trust signal optimization |

**Rule for applying the hybrid model:** If a tactic is effective and appropriate for ≥5 of the 7 models, tag `["all"]`. If it only adds value for a subset of 3 or fewer models, tag explicitly. When in doubt, start with `["all"]` and narrow in a future revision — over-filtering is worse than over-including at corpus bootstrap time.

---

## Chunker Behavior — Exact Facts

Verified in `literacy-chunker.cjs` source:

| Chunk type | Trigger | Content type value | ID suffix pattern |
|------------|---------|-------------------|-------------------|
| Definition | `# TITLE` heading (H1) to first `##` | `definition` | `::definition::000` |
| Evidence | `## EVIDENCE BASE` (exact, case-insensitive) | `evidence` | `::evidence-base::001` |
| Tactic (×N) | `### Tactic Name` inside `## CORE TACTICS` | `tactic` | `::tactic-{slug}::00N` |
| Benchmark | `## PERFORMANCE BENCHMARKS` (exact) | `benchmark` | `::performance-benchmarks::00N` |
| Counter-indicators | `## COUNTER-INDICATORS` (exact) | `counter-indicators` | `::counter-indicators::00N` |
| Vocabulary (×N) | `- **Term**: definition` lines in `## VOCABULARY` | `vocabulary` | `::vocab-{slug}::00N` |

**`doc_id` resolution order** (from `chunkLiteracyFile`): `metadata.doc_id` → `metadata.artifact_id` → `metadata.document_id` → `'literacy-doc'`. Always set `doc_id` in frontmatter — do not rely on fallback.

**`findSection()` matching:** `^##\\s+{HEADING}\\s*$` — exact heading text match, any surrounding whitespace on the same line is ignored. The heading match is case-insensitive (`im` flag). Multi-word headings must match exactly: `EVIDENCE BASE` not `Evidence Base` or `EVIDENCE-BASE`.

**`parseLiteracyFrontmatter()` is generic** — no code change needed for it to parse `pain_point_tags`. The parser reads all key-value pairs from the fenced YAML block. Array fields with inline syntax `["a", "b"]` are parsed correctly by `parseSimpleYamlValue()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML array parsing in frontmatter | Custom multi-line YAML parser | Existing `parseSimpleYamlValue()` in `literacy-chunker.cjs` | Already handles `["a", "b"]` inline array syntax |
| Field validation in ingest | Separate validation module | Inline guard in `ingest-literacy.cjs` main loop | Consistent with existing zero-dependency bin pattern |
| Pain-point filter queries | New query function | Extend `buildLiteracyFilter()` | Filter function is designed to be extended by appending to `parts[]` |
| Supabase column add | ORM migration | Raw `ALTER TABLE ADD COLUMN IF NOT EXISTS` SQL | Same pattern used in all existing Phase 32 migrations |
| Taxonomy storage | Database table | `taxonomy.json` flat file | Phase 40 reads it; no query API needed at Phase 39 scope |

---

## Common Pitfalls

### Pitfall 1: Missing `pain_point_tags` in Upstash metadata — silently unfilterable
**What goes wrong:** New corpus is ingested. `pain_point_tags` is in frontmatter and parsed by `parseLiteracyFrontmatter()`. But if `upsertLiteracyChunk()` doesn't include `pain_point_tags` in the `metadata` object passed to Upstash, the field is not stored as a filterable vector metadata field. `buildLiteracyFilter()` with `pain_point_tag` filter will produce zero hits even though documents conceptually match.
**Why it happens:** The `metadata` object in `upsertLiteracyChunk()` is hand-built (not spread from chunk) — adding a new field requires explicitly listing it.
**How to avoid:** Verify the Upstash metadata object in `upsertLiteracyChunk()` includes `pain_point_tags` before running live ingest.

### Pitfall 2: Supabase column missing — silent upsert failure
**What goes wrong:** `upsertLiteracyChunk()` tries to insert a row with `pain_point_tags` but the column doesn't exist in `markos_literacy_chunks`. Supabase returns an error, but `ingest-literacy.cjs` swallows individual chunk errors into `summary.errors[]` and continues. The script exits with code 1, but ingest appears partially successful.
**How to avoid:** Run the Supabase migration BEFORE any live ingest run. Always check `summary.errors` in ingest output.

### Pitfall 3: Heading casing mismatch silences chunk types
**What goes wrong:** Document uses `## Evidence Base` instead of `## EVIDENCE BASE`. `findSection()` uses case-insensitive regex — but the regex looks for `^##\\s+EVIDENCE BASE\\s*$` (the string comes from the consumer call in `chunkLiteracyFile`: `findSection(text, 'EVIDENCE BASE')`). Because the regex is case-insensitive (`im` flag), `## Evidence Base` WILL match. However, heading capitalization must match or the author will be confused by missing chunks. **Safe:** use ALL CAPS headings to match the template and existing test fixtures.

### Pitfall 4: `business_model: ["all"]` won't match a `business_model CONTAINS 'B2B'` filter
**What goes wrong:** A document tagged `["all"]` is intended to be universal. But if a Phase 40 filter passes `business_model: 'B2B'`, Upstash evaluates `business_model CONTAINS 'B2B'` — which returns false for `["all"]`.
**How to avoid at Phase 39 scope:** Phase 39 does NOT add a `business_model` filter to `buildLiteracyFilter()` calls in production retrieval. The existing Phase 40 design handles this via application-layer fan-out. Documents tagged `["all"]` will be retrieved with NO `business_model` filter condition. The `["all"]` tag is informational at Phase 39; the filter logic is Phase 40 work.
**Action for corpus authors:** Do NOT add a `business_model` constraint to retrieval tests in Phase 39. Test retrieval with only `pain_point_tag` filter.

### Pitfall 5: `doc_id` naming collision across disciplines
**What goes wrong:** Two documents in different discipline folders use the same `doc_id`. `supersedeLiteracyDoc(doc_id)` marks ALL chunks across disciplines as superseded on re-ingest.
**How to avoid:** Use discipline prefix in `doc_id`: `LIT-PM-001-...`, `LIT-SEO-001-...`, etc. The naming convention in the corpus structure above enforces this.

### Pitfall 6: Taxonomy parent tags that are too abstract — useless for Phase 40 routing
**What goes wrong:** Parent tag `"marketing_issue"` is too broad to power discipline routing. Phase 40's router maps parent tags to ranked discipline lists. If tags don't distinguish disciplines, the router returns all disciplines with equal weight — defeating the purpose.
**How to avoid:** Parent tags must have clear discipline affinity (e.g., `poor_retention_churn` → Lifecycle_Email primary, Social secondary). The 8 parent tags in this research are designed with routing specificity in mind.

---

## Validation Architecture

**nyquist_validation is enabled** (verified in `.planning/config.json`: `"nyquist_validation": true`)

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert/strict` |
| Config file | None — test files discovered by glob |
| Quick run command | `node --test test/literacy-ingest.test.js` |
| Full suite command | `npm test` (runs `node --test test/**/*.test.js`) |
| Existing test file | `test/literacy-ingest.test.js` (3 tests — extend this file) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIT-02 | `parseLiteracyFrontmatter()` parses `pain_point_tags` array from fenced YAML | unit | `node --test test/literacy-ingest.test.js` | ✅ Extend existing |
| LIT-02 | `pain_point_tags` is included in `chunkLiteracyFile()` output metadata per chunk | unit | `node --test test/literacy-ingest.test.js` | ✅ Extend existing |
| LIT-01 | `ingest-literacy.cjs --dry-run` succeeds on a valid corpus document with `pain_point_tags` | unit | `node --test test/literacy-ingest.test.js` | ✅ Extend existing |
| LIT-01 | `ingest-literacy.cjs` throws/records error for document missing `pain_point_tags` | unit | `node --test test/literacy-ingest.test.js` | ✅ Extend existing |
| LIT-02 | `buildLiteracyFilter({ pain_point_tag: 'low_conversions' })` produces correct Upstash filter string | unit | `node --test test/literacy-ingest.test.js` | ✅ Extend existing |
| LIT-01 | Round-trip retrieval: `getLiteracyContext('Paid_Media', query, { pain_point_tag: 'high_acquisition_cost' })` returns ≥1 hit | integration | manual / live env | ❌ Manual only |
| LIT-03 | At least one B2B-specific supplement document exists in corpus with explicit business model tags | corpus audit | `node bin/ingest-literacy.cjs --path .agent/markos/literacy --dry-run` | ❌ New dry-run step |

### Unit Tests to Add to `test/literacy-ingest.test.js`

**Test 1: `parseLiteracyFrontmatter` parses `pain_point_tags`**
```javascript
test('parseLiteracyFrontmatter parses pain_point_tags array', () => {
  const chunker = loadChunker();
  const sample = [
    '```yaml',
    '---',
    'doc_id: "LIT-PM-001"',
    'discipline: "Paid_Media"',
    'business_model: ["all"]',
    'pain_point_tags: ["high_acquisition_cost", "paid_media:high_cpr"]',
    '---',
    '```',
    '',
    '# Test Doc',
  ].join('\n');
  const parsed = chunker.parseLiteracyFrontmatter(sample);
  assert.deepEqual(parsed.pain_point_tags, ['high_acquisition_cost', 'paid_media:high_cpr']);
});
```

**Test 2: `pain_point_tags` flows through to chunk metadata**
```javascript
test('chunkLiteracyFile propagates pain_point_tags into every chunk metadata', () => {
  const chunker = loadChunker();
  // minimal valid doc with all 6 sections...
  const metadata = chunker.parseLiteracyFrontmatter(sample);
  const chunks = chunker.chunkLiteracyFile(sample, metadata);
  assert.ok(chunks.length > 0);
  for (const chunk of chunks) {
    assert.deepEqual(chunk.metadata.pain_point_tags, ['high_acquisition_cost', 'paid_media:high_cpr']);
  }
});
```

**Test 3: `ingest-literacy.cjs` validation rejects missing `pain_point_tags`**
```javascript
test('ingest CLI dry-run errors on doc missing pain_point_tags', async () => {
  // write temp file without pain_point_tags, run ingest --dry-run, assert errors[]
  // Use withMockedModule pattern from setup.js if needed for isolation
  // OR spawn the CLI process and check stdout JSON errors array
});
```

**Test 4: `buildLiteracyFilter` pain_point_tag clause**
```javascript
test('buildLiteracyFilter includes pain_point_tags CONTAINS clause when pain_point_tag is set', () => {
  const vsClient = require('../onboarding/backend/vector-store-client.cjs');
  // Access buildLiteracyFilter — note it may not be exported currently
  // Check exports and add to module.exports if needed
  const filter = vsClient.buildLiteracyFilter({ pain_point_tag: 'low_conversions' });
  assert.match(filter, /pain_point_tags CONTAINS 'low_conversions'/);
  assert.match(filter, /status = 'canonical'/);
});
```

> **Gap:** `buildLiteracyFilter` is NOT currently exported from `vector-store-client.cjs`. Check `module.exports` and add it for testability.

### Sampling Rate

- **Per task commit:** `node --test test/literacy-ingest.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + dry-run ingest of all 15 docs exits code 0

### Wave 0 Gaps

- [x] `test/literacy-ingest.test.js` — exists, extend in place
- [ ] Export `buildLiteracyFilter` from `vector-store-client.cjs` (currently not in `module.exports`) — needed for unit test isolation
- [ ] Supabase migration file `supabase/migrations/YYYYMMDD_add_pain_point_tags.sql`

---

## Environment Availability

No new external dependencies introduced by Phase 39. Existing Upstash Vector and Supabase credentials are pre-configured (same as Phase 32 live ingest).

| Dependency | Required By | Available | Note |
|------------|------------|-----------|------|
| Node.js ≥18 | Ingest CLI, tests | ✅ Existing | `node:test` built-in |
| Upstash Vector | Live ingest + round-trip test | ✅ Existing | Credentials in env / runtime-context |
| Supabase | Live ingest + Supabase row writes | ✅ Existing | Requires migration before live run |

**Round-trip retrieval test** (LIT-01 integration) cannot be automated without live credentials. It is a manual verification step: run dry-run for CI, run live round-trip test once in dev/staging environment.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Content corpus: none | Phase 32 infrastructure; Phase 39 adds corpus | Phase 32 completed 2026-03-31 | Infrastructure ready; Phase 39 fills it |
| `buildLiteracyFilter`: supports `business_model`, `funnel_stage`, `content_type` | Add `pain_point_tag` in Phase 39 | Phase 39 | Enables pain-point-gated retrieval |
| `markos_literacy_chunks`: no `pain_point_tags` column | Add `TEXT[]` column via migration | Phase 39 | Enables Supabase row-level pain-point queries |

**Not deprecated:** All Phase 32 filter conditions (`business_model`, `funnel_stage`, `content_type`) remain. Phase 39 adds `pain_point_tag` as an additive extension.

---

## Open Questions

1. **`buildLiteracyFilter` not exported**
   - What we know: `module.exports` at bottom of `vector-store-client.cjs` does not include `buildLiteracyFilter`.
   - What's unclear: Whether testing should white-box via `require()` with internal access, or whether exporting it is appropriate.
   - Recommendation: Export `buildLiteracyFilter` — it is a pure utility function with no side effects. Adding it to `module.exports` is safe and enables clean unit testing.

2. **Taxonomy artifact format — JSON vs markdown table**
   - What we know: CONTEXT.md defers format choice to Phase 39 researcher/planner.
   - Recommendation: Use `taxonomy.json` in the corpus root. Phase 40's discipline router can `require()` it directly from Node.js without a file parser. Markdown table would require parsing. JSON is the correct call.

3. **Corpus minimum vs. recommended count**
   - What we know: CONTEXT.md requires ≥3 docs per discipline = 15 minimum.
   - Recommendation: Author exactly 3 per discipline for Phase 39 (15 total). Quality over quantity. Phase 44 (corpus growth) can add depth.

---

## Sources

### Primary (HIGH confidence — verified against source files)

- `onboarding/backend/literacy-chunker.cjs` — exact `parseLiteracyFrontmatter()` and `chunkLiteracyFile()` implementation, heading patterns
- `bin/ingest-literacy.cjs` — exact ingestion payload fields, validation absence, CLI interface
- `onboarding/backend/vector-store-client.cjs` — `buildLiteracyFilter()`, `upsertLiteracyChunk()`, `getLiteracyContext()` signatures
- `test/literacy-ingest.test.js` — existing test patterns, `withMockedModule` setup
- `.planning/phases/32-marketing-literacy-base/32-RESEARCH.md` — architecture decisions, Upstash CONTAINS operator behavior, namespace pattern
- `.planning/milestones/v3.0-LITERACY-SYSTEM-ROADMAP.md` — Phase 40 design constraints that Phase 39 must not prematurely implement
- `.planning/config.json` — `nyquist_validation: true` confirmed

### Secondary (MEDIUM confidence — based on Phase 32 research, which verified against Upstash docs)

- Upstash Vector CONTAINS operator for arrays: `business_model CONTAINS 'B2B'` — verified in Phase 32 research against official docs
- Supabase `TEXT[]` array handling with SDK: auto-converts JS arrays — verified in Phase 32 research

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| Code change inventory | HIGH | Read source files directly; all 3 changes are precise line-level edits |
| Six chunk type patterns | HIGH | Verified against `chunkLiteracyFile()` source |
| Taxonomy design | MEDIUM | Derived from marketing practitioner knowledge + Phase 32/40 design context; specific tag names are Claude's discretion per CONTEXT.md |
| Business-model annotation | HIGH | 7-model list verified in `example-resolver.cjs` lineage; hybrid rule is logical given Phase 40 constraints |
| Upstash filter extension | HIGH | Pattern identical to existing `business_model CONTAINS` — same code structure |
| Supabase migration | HIGH | Non-destructive `ADD COLUMN IF NOT EXISTS` pattern used in all Phase 32 migrations |

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable infrastructure; taxonomy values are fixed for Phase 39 scope)
