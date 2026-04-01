Marketing Literacy Base — Technical Research
Research Type: Implementation Research
Phase: 32 — Marketing Literacy Base Infrastructure
Status: RESEARCH COMPLETE
Confidence: HIGH (primary sources verified against official docs)

Standard Stack
IMPORTANT

These are prescriptive — use these exact tools and patterns. Do not hand-roll alternatives.

Component	Tool	Why
Vector storage	Upstash Vector (existing index)	Already configured with auto-embedding model. Same @upstash/vector SDK already in package.json. Namespaces provide free logical isolation.
Relational metadata	Supabase PostgreSQL (existing project)	Already hosts markos_artifacts, markos_projects, markos_campaign_outcomes. RLS + service_role key = admin-only write pattern.
Embedding	Upstash built-in auto-embed (via data: parameter)	Current vector-store-client.cjs already uses data: String(content) — Upstash handles embedding server-side. No OpenAI embedding API calls needed.
Chunking	Custom heading-based splitter (Node.js, zero dependencies)	Files follow a strict ### Tactic Name template. A simple regex splitter is more reliable than LangChain for this structured format.
YAML frontmatter parsing	yaml npm package or built-in regex	Frontmatter is inside a ````yaml` code block (not standard YAML frontmatter). Needs custom extraction.
CLI framework	None (raw process.argv)	bin/ingest-literacy.cjs is an admin-only script. Keep it zero-dependency like existing bin/*.cjs files.

Architecture Patterns
Critical Decision: Single Index with Namespaces (not a separate index)
Use the SAME Upstash Vector index that already powers client MIR/MSP data. Reasons:

Upstash pricing is per-index — a second index doubles the fixed cost
The auto-embedding model is configured per-index at creation time — you can't mix models within one index, and the standards layer MUST use the same model as client data for consistent similarity semantics
Namespaces are free and unlimited — they provide logical isolation within a single index with zero cost or performance penalty
The existing vector-store-client.cjs already initializes getUpstashIndex() once — standards queries reuse the same connection
Namespace naming convention:

Client data (existing):     markos-{slug}-{section}     e.g. markos-acme-company
Standards data (new):        markos-standards-{discipline} e.g. markos-standards-paid_media
Standards namespaces are tenant-agnostic — they don't contain a {slug}. Every client's agents query the same standards namespaces. This is the isolation model: standards are global, client data is scoped.

Two-Layer Retrieval Pattern
Agent query: "Generate Facebook ad hook for B2B SaaS CTOs"
  │
  ├─ Layer 1: getLiteracyContext('paid_media', query, { business_model: 'B2B' })
  │   └─ Queries: markos-standards-paid_media
  │   └─ Filter: "business_model CONTAINS 'B2B' AND status = 'canonical'"
  │   └─ Returns: tactic chunks with evidence + benchmarks
  │
  └─ Layer 2: getContext(slug, 'audience', query)  [existing]
      └─ Queries: markos-{slug}-audience
      └─ Returns: client-specific CTO persona, pain points, voice
Both layers use the same @upstash/vector SDK, same index, different namespaces.

Metadata Schema → Upstash Metadata Mapping
The literacy spec defines a rich metadata schema. Here's what maps cleanly to Upstash metadata filtering vs. what should stay as retrieval-only metadata:

Filterable fields (used in filter: parameter):

javascript
// These go into Upstash metadata AND are used in filter expressions
{
  category: 'STANDARDS',           // string — = operator
  discipline: 'Paid_Media',        // string — = operator
  sub_discipline: 'Facebook_Ads',  // string — = operator
  business_model: ['B2B', 'SaaS'], // array — CONTAINS operator
  funnel_stage: 'Awareness',       // string — = operator
  content_type: 'tactic',          // string — = operator
  status: 'canonical',             // string — = operator
  evidence_level: 'study',         // string — = operator
}
// Example filter string for Upstash:
"category = 'STANDARDS' AND discipline = 'Paid_Media' AND business_model CONTAINS 'B2B' AND status = 'canonical'"

Non-filterable metadata (stored but only returned, not queried):

javascript
{
  doc_id: 'META-PAID-SOCIAL-META-B2B-SaaS-v1.2',
  chunk_id: 'META-PAID-SOCIAL-META-B2B-SaaS-v1.2::hook-formulas::003',
  company_size: ['SMB', 'Mid-Market'],   // could filter if needed
  industry_tags: ['Software'],            // could filter if needed
  source_ref: 'HubSpot State of Marketing 2024',
  last_validated: '2026-03-01',
  version: '1.2',
  ttl_days: 180,
  agent_use: ['markos-copy-drafter'],
  retrieval_keywords: ['hook', 'ad copy'],
}

WARNING
Upstash filtering budget limitation: If a metadata filter is highly selective (matches very few vectors out of thousands), the system may return fewer than topK results. This is documented behavior. Mitigation: keep topK generous (e.g., 10) and post-filter in application code. The standards namespace will have ~2,600 chunks total — small enough that this is unlikely to be a problem.

Supabase Table: Admin-Only via service_role
sql
-- The service_role key AUTOMATICALLY bypasses ALL RLS policies.
-- Client apps use anon key → see nothing.
-- Admin CLI uses service_role key → full read/write.
CREATE TABLE markos_literacy_chunks (
  chunk_id         TEXT PRIMARY KEY,
  doc_id           TEXT NOT NULL,
  category         TEXT NOT NULL,
  discipline       TEXT NOT NULL,
  sub_discipline   TEXT,
  business_model   TEXT[],        -- Postgres native array
  company_size     TEXT[],
  industry_tags    TEXT[],
  funnel_stage     TEXT,
  content_type     TEXT,
  evidence_level   TEXT,
  recency          TEXT,
  source_type      TEXT,
  source_ref       TEXT,
  last_validated   DATE,
  version          TEXT,
  ttl_days         INTEGER DEFAULT 180,
  status           TEXT DEFAULT 'canonical',
  agent_use        TEXT[],
  retrieval_keywords TEXT[],
  chunk_text       TEXT NOT NULL,
  vector_namespace TEXT NOT NULL,
  checksum_sha256  TEXT,
  conflict_note    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: deny everything to anon/authenticated users
ALTER TABLE markos_literacy_chunks ENABLE ROW LEVEL SECURITY;
-- No SELECT policy for 'authenticated' or 'anon' = invisible to client apps
-- service_role bypasses RLS automatically = admin CLI has full access
-- Optional: add a read-only policy for backend agents that use anon key
-- (only if you want agents to query Supabase directly, which is unlikely
--  since they should query Upstash Vector instead)
CREATE POLICY "agents_read_canonical" ON markos_literacy_chunks
  FOR SELECT USING (status IN ('canonical', 'superseded'));

Key insight from research: The service_role key automatically bypasses ALL RLS. No special policy needed for admin writes. The existing vector-store-client.cjs already reads from runtimeConfig.supabase_service_role_key || process.env.SUPABASE_SERVICE_ROLE_KEY. The admin CLI uses the same env var.

Chunking Strategy — Don't Hand-Roll Complex NLP
Why heading-based splitting is correct for these files
The sample files (CRO, SEO, Email, Paid, Cold Email) all follow an identical template structure:

markdown
# FILE TITLE
[Definition paragraph]
## EVIDENCE BASE
[bullet list]
## CORE TACTICS
### Tactic 1 Name
[2-4 paragraphs — one semantic concept]
### Tactic 2 Name
[2-4 paragraphs — one semantic concept]
## PERFORMANCE BENCHMARKS
[table]
## COUNTER-INDICATORS
[bullet list]
## VOCABULARY
[term definitions]
## RELATED FILES
[list]
## LAST VALIDATED
[date]

Splitting rules (prescriptive):
Content Type	Split On	Chunk Contains	Estimated Tokens
Definition	# FILE TITLE	Title + definition paragraph	100–200
Evidence base	## EVIDENCE BASE	Full bullet list	150–300
Each tactic	### Tactic Name	Everything from ### to next ### or ##	200–400
Benchmarks table	## PERFORMANCE BENCHMARKS	Full table	300–500
Counter-indicators	## COUNTER-INDICATORS	Full bullet list	150–300
Each vocabulary term	- **Term**	Single term + definition	30–80
Related files	## RELATED FILES	File list (low priority)	20–50

Do NOT split:
Mid-paragraph (within a ### Tactic section)
Inside the benchmarks table
Inside a vocabulary term definition

Implementation approach:
javascript
function chunkLiteracyFile(markdown, metadata) {
  const chunks = [];
  
  // 1. Extract definition (# heading to first ##)
  // 2. Extract evidence base (## EVIDENCE BASE to next ##)
  // 3. Split tactics: regex on ### headings within ## CORE TACTICS
  // 4. Extract benchmarks table as single chunk
  // 5. Extract counter-indicators as single chunk
  // 6. Split vocabulary: regex on each `- **Term**` line
  // 7. Skip RELATED FILES and LAST VALIDATED (not useful for retrieval)
  
  return chunks.map((chunk, i) => ({
    id: `${metadata.doc_id}::${chunk.section_slug}::${String(i).padStart(3, '0')}`,
    data: chunk.text,                 // Upstash auto-embeds this
    metadata: {
      ...metadata,                    // doc-level metadata from frontmatter
      chunk_id: `${metadata.doc_id}::${chunk.section_slug}::${String(i).padStart(3, '0')}`,
      content_type: chunk.type,       // 'definition', 'tactic', 'benchmark', 'vocabulary'
      section_title: chunk.title,
    }
  }));
}

Frontmatter extraction caveat
The sample files use a non-standard frontmatter format. The YAML is inside a fenced code block:

markdown
```yaml
---
artifact_id: ""
discipline: "Paid_Media"
business_model: ["B2B", "SaaS"]
---
```
This is NOT standard Jekyll/Hugo frontmatter (which uses bare --- delimiters at the top of the file). The chunker must:
Find the ````yaml` block
Extract the YAML between --- markers inside it
Parse with a YAML parser (or simple key-value regex for flat fields)
Handle array fields like business_model: ["B2B", "SaaS"]
Additionally, the files have a Perplexity header image and preamble text BEFORE the YAML block. The chunker should skip everything before the # FILE TITLE heading.

Common Pitfalls
1. Upstash data field is NOT filterable
From official docs: "Data is not structured and cannot be used for filtering; it is intended only for retrieval during query responses."
This means:
✅ Use data: for the chunk text (Upstash auto-embeds it)
✅ Use metadata: for all filterable attributes
❌ Do NOT put filterable fields only in data: — they won't be queryable

2. Upstash CONTAINS on arrays works — but only for top-level elements
Filter business_model CONTAINS 'B2B' works when business_model is ['B2B', 'SaaS']. This is confirmed in official docs: economy.major_industries CONTAINS 'Tourism'
But nested array access (business_model[0] = 'B2B') is positional — only matches exact index. Use CONTAINS for "any element matches" semantics.

3. Namespace creation is implicit
Upstash namespaces are created automatically on first upsert. No pre-creation step needed. The first time ingest-literacy.cjs upserts to markos-standards-paid_media, the namespace just appears.

4. Upstash metadata must be a flat-ish object
From docs: metadata supports string, number, boolean, object, and array. Nested objects work with dot notation for filtering (geography.continent = 'Asia'). The literacy metadata schema is already flat — no issues.

5. Supabase TEXT[] vs Upstash array handling
Supabase uses native Postgres TEXT[] arrays (e.g., business_model TEXT[]). Upstash metadata arrays are JSON arrays (e.g., business_model: ['B2B', 'SaaS']).
When the ingestion script writes to both, it must:
For Supabase: use {B2B,SaaS} array literal or pass a JS array via the SDK (handled automatically)
For Upstash: pass a JS array in the metadata object (handled automatically)
No manual conversion needed — both SDKs handle native arrays transparently.

6. Don't duplicate chunks across multiple discipline namespaces
A file like META-PAID-SOCIAL-META-B2B.md maps to ONE namespace: markos-standards-paid_media. Don't put it in both paid_media and social. The metadata sub_discipline: 'Facebook_Ads' and discipline: 'Paid_Media' fields handle cross-referencing. Agents that need cross-discipline results query multiple namespaces in parallel.

7. The "filtering budget" can return fewer than topK
Official docs: "If the budget is exceeded, the system falls back to post-filtering, which may result in fewer than topK results."
For ~2,600 total chunks spread across ~16 namespaces, each namespace has ~160 chunks on average. With topK: 5-10, this is well within budget. Not a practical concern at this scale.

8. Version management — never delete, always supersede
The literacy spec requires that old chunks are tagged status: superseded, NOT deleted. This is critical because:
Agents default to status = 'canonical' filter
Historical analysis can query status = 'superseded'
Contradiction resolution keeps both versions until human resolves
Implementation: on re-ingestion of an updated file, the script must:
Query existing chunks by doc_id
Mark all existing chunks as status: superseded (in both Supabase and Upstash metadata)
Upsert new chunks with status: canonical
Never call namespace.delete()

Code Examples — Integration with Existing Codebase
New function: getLiteracyContext() in vector-store-client.cjs
javascript
const STANDARDS_NAMESPACE_PREFIX = 'markos-standards';
function buildStandardsNamespaceName(discipline) {
  return `${STANDARDS_NAMESPACE_PREFIX}-${discipline.toLowerCase().replace(/\s+/g, '_')}`;
}
async function getLiteracyContext(discipline, query, filters = {}, topK = 5) {
  const index = getUpstashIndex();
  if (!index) return [];
  const namespaceName = buildStandardsNamespaceName(discipline);
  const namespace = index.namespace(namespaceName);
  // Build Upstash filter string
  const filterParts = ["status = 'canonical'"];
  if (filters.business_model) {
    filterParts.push(`business_model CONTAINS '${filters.business_model}'`);
  }
  if (filters.funnel_stage) {
    filterParts.push(`funnel_stage = '${filters.funnel_stage}'`);
  }
  if (filters.content_type) {
    filterParts.push(`content_type = '${filters.content_type}'`);
  }
  try {
    const matches = await namespace.query({
      data: String(query || ''),        // auto-embedded by Upstash
      topK,
      includeData: true,
      includeMetadata: true,
      filter: filterParts.join(' AND '),
    });
    if (!Array.isArray(matches) || matches.length === 0) return [];
    return matches.map((entry) => ({
      text: entry.data || '',
      metadata: entry.metadata || {},
      score: entry.score || 0,
    }));
  } catch {
    return [];
  }
}

New function: upsertLiteracyChunk() — admin ingestion path
javascript
async function upsertLiteracyChunk(chunk) {
  // 1. Upsert to Upstash Vector (standards namespace)
  const index = getUpstashIndex();
  let vector = { ok: false, error: 'UPSTASH_UNCONFIGURED' };
  if (index) {
    try {
      const namespace = index.namespace(chunk.vector_namespace);
      await namespace.upsert({
        id: chunk.chunk_id,
        data: chunk.chunk_text,         // auto-embedded
        metadata: chunk.metadata,
      });
      vector = { ok: true, namespace: chunk.vector_namespace, id: chunk.chunk_id };
    } catch (error) {
      vector = { ok: false, error: error.message };
    }
  }
  // 2. Upsert to Supabase (relational record)
  const client = getSupabaseClient();
  let relational = { ok: false, error: 'SUPABASE_UNCONFIGURED' };
  if (client) {
    const { error } = await client
      .from('markos_literacy_chunks')
      .upsert({
        chunk_id: chunk.chunk_id,
        doc_id: chunk.doc_id,
        category: chunk.metadata.category,
        discipline: chunk.metadata.discipline,
        sub_discipline: chunk.metadata.sub_discipline || null,
        business_model: chunk.metadata.business_model || [],
        company_size: chunk.metadata.company_size || [],
        industry_tags: chunk.metadata.industry_tags || [],
        funnel_stage: chunk.metadata.funnel_stage || null,
        content_type: chunk.metadata.content_type || null,
        evidence_level: chunk.metadata.evidence_level || null,
        status: chunk.metadata.status || 'canonical',
        version: chunk.metadata.version || '1.0',
        ttl_days: chunk.metadata.ttl_days || 180,
        chunk_text: chunk.chunk_text,
        vector_namespace: chunk.vector_namespace,
        checksum_sha256: createChecksum(chunk.chunk_text),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'chunk_id' });
    relational = error ? { ok: false, error: error.message } : { ok: true };
  }
  return { ok: vector.ok || relational.ok, vector, relational };
}

Orchestrator integration pattern
javascript
// In orchestrator.cjs — when generating any marketing content
async function buildAgentContext(slug, discipline, query, seedData) {
  const [clientContext, standardsContext] = await Promise.all([
    vectorStore.getContext(slug, discipline, query, 3),
    vectorStore.getLiteracyContext(discipline, query, {
      business_model: seedData.company?.business_model || null,
    }, 5),
  ]);
  return {
    client_context: clientContext.join('\n\n'),
    standards_context: standardsContext.map(c => c.text).join('\n\n'),
  };
}

Pricing & Capacity Analysis
Upstash Vector
Metric	Value	Source
Free tier daily ops	10,000 queries + upserts	Upstash pricing page
Pay-as-you-go	$0.40 / 100K requests	Upstash pricing page
Storage	~$0.25 / GB	Upstash pricing page
Namespace cost	FREE (logical partitioning)	Upstash docs
Auto-embedding cost	Included in Upstash (no OpenAI API cost)	Upstash docs
Literacy base total chunks	~2,600	Spec: 330 files × 8 avg chunks
One-time ingestion cost	2,600 upsert ops (~$0.01 on pay-as-you-go)	Calculated
Daily agent query overhead	~50-200 queries/day (estimated for active usage)	Estimated
Verdict: The literacy base adds negligible cost. The 2,600 chunks are a one-time upsert. Daily queries are within free tier for most usage patterns.

Supabase
Metric	Value
Free tier rows	500MB database, unlimited rows
2,600 rows with ~500 bytes metadata + ~1KB text each	~4MB total
RLS overhead	Zero (service_role bypasses)
Verdict: Fits comfortably in free tier. No scaling concern.

Open Architecture Questions (Research-Informed Answers)
Q1: Where do literacy .md files live?
Recommended: Option A — Private path in the MarkOS monorepo, gitignored from npm.
Rationale:
The admin team already works in this repo
bin/ingest-literacy.cjs can reference ./literacy/ relative to repo root
.gitignore excludes literacy/ from the npm package (same pattern as .markos-local/)
Future upgrade: Supabase Storage (Option C) adds unnecessary Edge Function complexity for this scale

Q2: Embedding model?
Answer: Use Upstash's built-in auto-embed (the data: parameter).
The existing vector-store-client.cjs already uses data: String(content) for all upserts and queries. The Upstash index was configured with an embedding model at creation time. The standards layer MUST use the same model (same index), so there's no choice to make — it automatically uses whatever model the index was created with.
Do NOT add OpenAI embedding calls. This would create a model mismatch with the existing client data and add unnecessary API cost and latency.

Q3: Sprint scope?
Recommended: Option A — Infrastructure + Sprint 1 (25 files).
The 5 sample files already exist in Downloads/. Infrastructure without any ingested data is untestable. Sprint 1 provides the minimum viable proof that the two-layer retrieval works end-to-end.

Q4: Contradiction resolution UI?
Answer: CLI-only for now. The literacy-admin.cjs --deprecate and --conflict-note flags are sufficient. A GUI adds scope without value until there are enough files to create actual contradictions (Sprint 2+).

Dual Human/AI Documentation Architecture
The answer is simpler than expected
The .md source files are the human documentation. No reformatting, no bi-directional sync, no separate doc system needed.

literacy/*.md files
    │
    ├── Read by humans → GitHub file viewer, or future admin CMS
    │   (Markdown renders natively — already readable)
    │
    └── Processed by bin/ingest-literacy.cjs → Upstash Vector
        (same text, chunked, embedded, filtered by metadata)

For the app GUI (future admin panel):
Admin users query markos_literacy_chunks Supabase table
The chunk_text column contains the original markdown
Render with any markdown-to-HTML library
Filter/search by discipline, business_model, status, last_validated
This is a read-only view of what's already in Supabase

For client GUI:
No route exposes markos_literacy_chunks table
Client users see their MIR/MSP data through existing routes
Literacy knowledge surfaces only through agent-generated outputs (never raw)

The sync is unidirectional:
Human edits .md → re-runs ingestion CLI → Supabase + Upstash updated
There is never a path from the vector DB back to the .md files. The .md files are the canonical source. The vector DB is a derivative optimized for AI retrieval.

Build Sequence (Revised from Research)
32.1 — Supabase migration: CREATE TABLE markos_literacy_chunks + RLS
32.2 — vector-store-client.cjs: add getLiteracyContext(), upsertLiteracyChunk(),
        buildStandardsNamespaceName(), export them
32.3 — bin/ingest-literacy.cjs: YAML parser, heading-based chunker, batch upsert,
        checksum dedup, version management (supersede old, canonical new)
32.4 — bin/literacy-admin.cjs: --query, --ttl-report, --deprecate
32.5 — Orchestrator integration: wire getLiteracyContext() into agent context building
32.6 — Admin endpoints: /admin/literacy/health, /admin/literacy/query (gated by secret)
32.7 — Sprint 1 ingestion: process the 5 existing sample files, verify retrieval
32.8 — Tests: chunker unit tests, getLiteracyContext integration tests, RLS verification

Confidence Assessment
Domain	Confidence	Notes
Upstash namespaces	HIGH	Verified against official docs. SDK patterns match existing codebase.
Upstash metadata filtering	HIGH	CONTAINS for arrays confirmed. SQL-like syntax documented.
Upstash auto-embedding	HIGH	Already used in current codebase via data: parameter.
Supabase RLS + service_role	HIGH	service_role bypass is documented and well-known pattern.
Chunking strategy	HIGH	Files follow a strict template. Heading-based splitting is correct approach per RAG best practices.
Pricing impact	HIGH	2,600 chunks is trivial at any Upstash tier.
Dual doc/AI architecture	HIGH	One-directional sync from .md → vector DB is the established pattern.
Frontmatter parsing	MEDIUM	Non-standard format (YAML inside code fences) needs custom extraction — straightforward but needs careful regex.
