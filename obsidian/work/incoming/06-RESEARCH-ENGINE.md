# MarkOS Research Engine
## Deep Research Architecture · Source Chains · Hallucination Defense · Agent Context Flow

---

## Why Research Gets Its Own Document

Every agent in MarkOS depends on research to some degree. The Content Strategist needs
keyword data. The Brand Pack Builder needs competitive positioning data. The Cold Outreach
Sequencer needs prospect intelligence. The Grand Strategist needs market context.

Research is not one agent with one job. It is a **substrate** — a layer of structured,
sourced, quality-scored intelligence that every other agent draws from. The difference
between MarkOS producing generic, forgettable content and producing authoritative,
specific, trust-building content is almost entirely determined by the quality of the
research layer underneath it.

This document covers three things the other documents don't:

1. **How research actually works** — the multi-step chain that turns a research question
   into a structured, cited, quality-scored knowledge object
2. **How hallucination is defended against** — the specific mechanisms that prevent
   the system from generating confident-sounding nonsense
3. **How research flows into other agents** — the context handoff patterns that prevent
   10 agents from independently re-researching the same facts

---

## Part 1: The Research Hierarchy

Not all research is the same. MarkOS runs five tiers of research with different depth,
speed, cost, and agent responsibility.

```
Tier 1: Connector data (instantaneous, structured, authoritative)
  Source: GA4, GSC, Google Ads, Meta Ads, SEMrush, etc.
  Format: Structured API responses
  Confidence: Very high (first-party or licensed data)
  Used by: Analytics agents, Paid agents, SEO agents
  No research chain needed — data pulled directly from connector layer

Tier 2: Context enrichment (seconds, targeted, reliable)
  Source: Apollo, Clearbit, BuiltWith, Hunter, LinkedIn
  Format: Enrichment records per entity (person, company, domain)
  Confidence: High (commercial data providers)
  Used by: Prospecting agents, Lead Scorer, Meeting Intelligence
  No research chain — single API call per entity

Tier 3: Shallow web research (2–5 min, targeted, moderate confidence)
  Source: Web search + selective page fetch
  Format: Extracted facts with source URLs
  Confidence: Moderate (unverified claims from public web)
  Used by: Most agents needing current context
  Chain: Query → Search → Select → Fetch → Extract → Cite

Tier 4: Deep research (10–40 min, multi-source, high confidence)
  Source: Multi-step web search + full document fetch + cross-source verification
  Format: Structured research report with evidence map
  Confidence: High (multi-source corroboration required)
  Used by: RES-01 Deep Researcher, RES-02 Competitive Monitor
  Chain: Plan → Query cluster → Search × N → Fetch × N → Synthesize → Verify → Structure → Cite

Tier 5: Primary research synthesis (hours to days, human-collected data)
  Source: Surveys, interviews, user-submitted transcripts, review corpora
  Format: Qualitative synthesis + verbatim corpus
  Confidence: High (first-party data)
  Used by: RES-04 VOC Researcher
  Chain: Corpus intake → Theme extraction → Pattern analysis → Quote selection → Synthesis
```

The Research Engine document primarily covers Tiers 3, 4, and 5.
Tiers 1 and 2 are handled by the Intelligence Layer (`04-INTELLIGENCE-LAYER.md`).

---

## Part 2: The Tier 3 Chain — Shallow Web Research

Tier 3 research is the workhorse of the system. It runs dozens of times per day across
many agents that need current context without a full deep research report.

### The chain

```
INPUT: research_question + context + depth_budget (number of sources to fetch)

Step 1: Query construction
  ↓
  Agent constructs 1–3 search queries from the research question
  Query rules:
    - Specific over general ("marketing attribution B2B SaaS 2026" not "marketing attribution")
    - Include recency signal when relevant ("2026", "latest", "recent")
    - Include source type signal when relevant (site:g2.com, site:techcrunch.com)
    - Never include the brand name in competitive research queries

Step 2: Search execution
  ↓
  web_search() called per query
  Returns: title, URL, snippet, domain, publish date (if extractable)

Step 3: Source selection
  ↓
  Source Quality Scorer evaluates each result (see Part 4)
  Top N results by quality score selected for fetch
  Typical depth_budget: 3–8 fetches per research question

Step 4: Page fetch and extraction
  ↓
  web_fetch() called per selected URL
  Full page content returned
  Extraction agent isolates: relevant passages, key claims, statistics, dates
  Irrelevant content stripped (nav, ads, boilerplate)

Step 5: Fact extraction and normalization
  ↓
  From each fetched page, extract structured facts:
    - Claim text (the assertion being made)
    - Claim type: statistic | opinion | definition | case_study | quote | methodology
    - Confidence markers: does the source qualify the claim? ("according to...", "approximately")
    - Source metadata: publication, author, date, URL
    - Contradiction flags: does this claim contradict another extracted claim?

Step 6: Citation assembly
  ↓
  Each extracted fact gets a citation record (see Part 5)
  Facts assembled into research_context object passed to requesting agent

OUTPUT: research_context {
  query: string
  facts: ExtractedFact[]
  sources: SourceRecord[]
  confidence_summary: string
  gaps_identified: string[]  // what could not be found
  research_timestamp: ISO8601
}
```

### What Tier 3 is NOT used for

Tier 3 is not appropriate when:
- The claim requires statistical rigor (use Tier 4 for multi-source verification)
- The topic is fast-moving and a single page may be outdated (check publish date)
- The research will be published verbatim in customer-facing content (Tier 4 minimum)
- The research involves legal, medical, or financial claims (Tier 4 + human review gate)

---

## Part 3: The Tier 4 Chain — Deep Research

Deep research is what MarkOS does that no human marketing team could afford to do at scale.
A proper competitive intelligence report or market analysis would take a senior analyst 3–5 days.
MarkOS produces the same quality output in 20–40 minutes, fully cited, every time.

Agent: RES-01 Deep Researcher

### The planning phase

Deep research does not start with a search. It starts with a **research plan**.

```
INPUT: research_brief {
  topic: string
  research_type: 'market_analysis' | 'competitive_intel' | 'voc' | 'tech_landscape' | 'benchmark'
  tenant_context: {brand, industry, ICP, current_stack}
  depth_budget: number  // estimated max sources
  output_format: ReportSpec
  deadline: ISO8601 | null
}

Step 1: Research plan generation
  ↓
  RES-01 generates a structured research plan:
  
  research_plan {
    primary_questions: string[]     // 5–10 core questions this research must answer
    secondary_questions: string[]   // nice-to-have depth questions
    source_strategy: {
      primary_sources: string[]     // types of sources to prioritize
      avoid_sources: string[]       // sources known to be low quality for this topic
      recency_requirement: string   // "last 6 months" | "last 2 years" | "any"
      geographic_scope: string      // "global" | "US" | "specific regions"
    }
    query_clusters: QueryCluster[]  // grouped search queries by sub-topic
    estimated_depth: number         // expected source count
    known_gaps: string[]            // known limitations before starting
  }
  
  → Research plan is logged but NOT shown to operator (internal scaffolding)
  → Plan is re-evaluated after 50% of sources are gathered (adapt if gaps found)
```

### The execution phase

```
Step 2: Parallel query execution
  ↓
  Query clusters run in parallel (up to 5 concurrent searches)
  Each cluster: 2–4 search queries targeting different facets of the same sub-question
  
  Per cluster:
    - Execute all queries
    - Deduplicate results (same URL from multiple queries counted once)
    - Rank by Source Quality Score
    - Select top results for fetch

Step 3: Source fetching and depth reading
  ↓
  Selected sources fetched in parallel batches
  Full document reading (not snippet-only)
  
  Special handling per source type:
    - Academic papers: abstract + methodology + findings section
    - Industry reports: executive summary + data tables + methodology
    - News articles: full text; extract quotes, statistics, named sources
    - Company websites: about page + product pages + case studies (competitive research)
    - Review sites (G2, Capterra): structured extraction of review themes and scores
    - Job listings: extract technology stack, team structure signals, growth signals
    - GitHub/technical docs: version history, feature list, technical architecture signals

Step 4: Cross-source synthesis
  ↓
  After all sources are fetched, RES-01 runs a synthesis pass:
  
  For each primary research question:
    - Gather all extracted facts that address this question
    - Identify consensus: claims made by multiple independent sources
    - Identify contradictions: claims in conflict across sources
    - Identify gaps: questions with no source covering them
    - Weight by source quality: high-quality sources anchor the synthesis
    - Produce a synthesis paragraph with inline citations

Step 5: Contradiction resolution
  ↓
  When sources contradict each other, explicit resolution logic applies:
  
  Resolution rules (in priority order):
    1. More recent source preferred (for time-sensitive claims like market size, pricing)
    2. Primary source preferred over secondary (company's own announcement vs press coverage)
    3. Methodologically rigorous source preferred (study with N>1000 vs blog post citing it)
    4. Named author with verifiable credentials preferred over anonymous
    5. If unresolvable: contradiction is NOTED in the output, not hidden
       → "Sources disagree on this point: [Source A] reports X while [Source B] reports Y"

Step 6: Gap filling
  ↓
  After synthesis, known gaps assessed:
    - Was the gap expected (known limitation of the topic)?
    - Is there a different query strategy that might fill it?
    - Should additional research runs be triggered?
  
  If gap-filling searches are run, their results feed back into synthesis.
  Maximum 2 rounds of gap filling before the report is produced regardless.

Step 7: Report structuring
  ↓
  Synthesis outputs structured into the requested report format (see Part 6)
  Every claim in the report linked to its citation record
  Confidence level annotated per section:
    - HIGH: Multiple independent sources agree, high source quality
    - MEDIUM: Single strong source or multiple moderate sources
    - LOW: Single source, limited corroboration available
    - ESTIMATED: Derived or inferred, no direct source (methodology disclosed)

OUTPUT: ResearchReport + EvidenceMap + SourceRegistry + ConfidenceAnnotations
```

### The adaptive re-planning trigger

If, after 60% of sources are gathered, the research plan has significant gaps:

```
gap_assessment = (unanswered_primary_questions / total_primary_questions)

if gap_assessment > 0.4:
  → Re-plan: generate new query clusters targeting gap areas
  → Fetch additional sources (up to depth_budget limit)
  → Log: "Research plan was adapted mid-execution — initial queries insufficient for [gap area]"

if gap_assessment > 0.6 after re-plan:
  → Surface to operator: "This research has significant data limitations. 
     [X] primary questions could not be answered from available public sources."
  → Offer: "I can run primary research (VOC synthesis / survey design) to fill these gaps."
```

---

## Part 4: Source Quality Scoring

This is the hallucination defense layer. Every source gets a quality score before
its content is trusted, and the quality score follows every claim that source makes
through the entire pipeline.

### The Source Quality Score (SQS)

```typescript
interface SourceQualityScore {
  url: string
  domain: string
  score: number                    // 0–100
  tier: 'authoritative' | 'reliable' | 'usable' | 'low' | 'blocked'
  dimensions: {
    domain_authority: number       // 0–25: domain-level credibility
    recency: number                // 0–20: how recent is this content
    author_credibility: number     // 0–20: named author + verifiable credentials
    methodology: number            // 0–20: is data collection method stated
    primary_vs_secondary: number   // 0–15: is this the original source
  }
  flags: SourceFlag[]
  blocked_reason: string | null
}

type SourceFlag =
  | 'paywalled'          // content behind paywall; snippet-only available
  | 'no_date'            // publish date not found; recency unknown
  | 'anonymous_author'   // no named author; credibility limited
  | 'ai_generated'       // detected as AI-generated content; treat with caution
  | 'promotional'        // commercial/marketing content; bias risk
  | 'aggregator'         // re-reports others' data; find primary source instead
  | 'outdated'           // publish date > recency threshold for this research type
  | 'domain_mismatch'    // domain doesn't match claimed expertise
```

### Domain authority tiers (pre-seeded, continuously updated)

```
TIER A — Authoritative (score: 20–25 / 25)
Academic: Google Scholar, JSTOR, PubMed, SSRN, Semantic Scholar
Government: .gov domains, official regulatory bodies
Primary industry research: Gartner, Forrester, IDC (full reports), McKinsey Global Institute
Platform documentation: Google, Meta, LinkedIn, TikTok official developer docs
Financial data: SEC filings, Crunchbase verified funding rounds, public earnings calls

TIER B — Reliable (score: 14–19 / 25)
Established trade publications: Harvard Business Review, MIT Sloan Review, Marketing Week
Major news: Reuters, AP, Bloomberg, WSJ, FT, NYT (verified byline)
Industry-specific publications: Search Engine Land, Marketing Brew, TechCrunch, The Verge
Platform benchmark reports: Google, Meta, HubSpot, Klaviyo official benchmark data
Community-verified content: G2 (aggregate scores), Capterra, Trustpilot (aggregate, not individual reviews)

TIER C — Usable (score: 7–13 / 25)
B-tier industry blogs: well-known blogs with named authors and cited sources
LinkedIn articles: from verified professionals with stated credentials
Mid-tier publications: Entrepreneur, Inc., Forbes (contributor network — quality varies)
Vendor-published research: when methodology is disclosed and data is specific
Conference presentations: from named speakers at recognized conferences

TIER D — Low (score: 1–6 / 25)
Anonymous blog posts
Vendor content without methodology
Press releases (promotional bias)
Forum posts, Reddit, Quora (useful for VOC only; never for statistics)
AI-generated content detected by classifier

BLOCKED — Score: 0 (not fetched)
Known misinformation domains
Scraped / aggregator sites with no original content
Sites with active legal disputes over data accuracy
Paywalled sites where no preview content is available
```

### The source quality algorithm

```
SQS calculation:

1. domain_authority (0–25):
   → Look up domain in pre-seeded tier table (above)
   → If not in table: run domain authority API check (Moz DA / Ahrefs DR)
   → Map to 0–25 scale

2. recency (0–20):
   → Extract publish date (meta tags, schema.org, byline, URL date pattern)
   → If no date found: score 5 / 20, flag: 'no_date'
   → Score by age relative to research type recency_requirement:
     - Within required recency window: 20
     - 1.5× the window: 15
     - 2× the window: 8
     - Beyond 2×: 3

3. author_credibility (0–20):
   → Named author present? (+8)
   → Author has LinkedIn / personal site with matching credentials? (+6)
   → Author has byline history on this domain? (+3)
   → Author credentials match topic expertise? (+3)
   → No named author: 0

4. methodology (0–20):
   → Is the data collection method described? (+8)
   → Is the sample size stated? (+6)
   → Is the data collection period stated? (+3)
   → Is data collection independent (not sponsored by interested party)? (+3)
   → Statistical claims with no methodology: 0–4

5. primary_vs_secondary (0–15):
   → Is this the original source of the data? (+15)
   → Is this citing the original source (verifiable)? (+10)
   → Is this aggregating without clear primary attribution? (+3)
   → Is this re-quoting a re-quote (chain of citation)? (+0)

FINAL: SQS = sum of all dimensions (0–100)

Tier mapping:
  80–100: authoritative
  60–79:  reliable
  40–59:  usable
  1–39:   low
  0:      blocked
```

### How SQS is used in practice

```
During source selection (post-search, pre-fetch):
  → Only fetch sources with SQS ≥ 40 unless depth budget not met
  → Never fetch blocked sources
  → Prioritize highest SQS sources within the depth budget
  → Flag 'low' sources in the research output (not hidden, but marked)

During synthesis:
  → Claims from 'authoritative' sources anchor the synthesis
  → Contradictions between 'authoritative' and 'low' sources: authoritative wins
  → Claims from 'low' sources only used if no better source found, always flagged
  → Statistics from sources without methodology: prefixed "According to [source]..."
    (never stated as plain fact)

In report output:
  → Each cited claim shows its SQS tier inline (visible in the evidence map)
  → Report confidence level (HIGH/MEDIUM/LOW) is partially derived from SQS distribution
  → Low-SQS heavy sections are explicitly noted: "This section relies primarily on 
    secondary sources. Findings should be validated with primary research."
```

---

## Part 5: Citation Architecture

Every claim in MarkOS research has a citation. Not as an afterthought — as a
first-class data structure that travels with the claim through the entire pipeline.

### The citation record

```typescript
interface Citation {
  citation_id: string              // uuid
  run_id: string                   // which research run created this
  tenant_id: string

  // The claim
  claim_text: string               // the exact assertion being cited
  claim_type: ClaimType
  claim_scope: 'global' | 'industry' | 'company_specific' | 'tenant_specific'

  // The source
  source_url: string
  source_title: string
  source_domain: string
  source_author: string | null
  source_publish_date: string | null
  source_access_date: string       // ISO8601 — when MarkOS fetched it
  source_quality_score: number     // SQS at time of access
  source_tier: 'authoritative' | 'reliable' | 'usable' | 'low'

  // The evidence
  evidence_text: string            // the exact passage from the source that supports the claim
  evidence_context: string         // surrounding paragraph for context
  evidence_page_location: string | null  // "paragraph 3" or section heading

  // Freshness tracking
  expires_at: string | null        // when this citation should be re-verified
  verified_at: string | null       // when it was last re-verified
  is_stale: boolean                // true if expires_at is passed

  // Chain tracking
  used_in_artifacts: string[]      // artifact_ids where this citation appears
  used_by_agents: string[]         // agent tokens that consumed this citation
}

type ClaimType =
  | 'statistic'        // a number or percentage
  | 'definition'       // what something is
  | 'methodology'      // how something works
  | 'opinion'          // a stated position or viewpoint
  | 'case_study'       // documented example of something happening
  | 'quote'            // direct attribution to a named person
  | 'product_fact'     // a verifiable fact about a product or company
  | 'benchmark'        // industry performance standard
```

### Citation freshness and decay

Not all citations age equally. The Research Engine tracks citation freshness:

| Claim type | Default TTL | Reason |
|------------|-------------|--------|
| Statistic (market size, growth rate) | 12 months | Markets change |
| Statistic (benchmark/average) | 6 months | Platforms change fast |
| Product fact (pricing, features) | 30 days | SaaS pricing changes constantly |
| Definition / methodology | 36 months | Concepts are stable |
| Case study | 24 months | Still relevant if company exists |
| Quote | 60 months | The person said it; rarely invalidates |
| Company-specific fact | 60 days | Funding, headcount, executive team change |

When a citation's `expires_at` is reached:
1. The citation is flagged `is_stale: true`
2. Any artifact using this citation gets a freshness flag in the content audit
3. Content Decay Management (from `05-CONTENT-ENGINE.md`) surfaces the stale citation
4. On next re-research, the claim is re-verified and the citation updated or replaced

### The evidence map

Every deep research report includes an evidence map — a structured audit trail of
every claim in the report and its supporting evidence:

```
EVIDENCE MAP — Market Analysis: AI Marketing Tools 2026

SECTION 2: Market Size
  Claim: "The AI marketing tools market is projected to reach $XX billion by 2028"
  Source: [Forrester Research, Feb 2026] — SQS: 87 (authoritative)
  Evidence: "The global market for AI-powered marketing technology..."
  Confidence: HIGH (primary research firm, recent, methodology disclosed)

  Claim: "YoY growth rate of 34% in 2025"
  Source: [Gartner Hype Cycle for Marketing Technology, 2025] — SQS: 91 (authoritative)
  Evidence: "Adoption of AI-native marketing platforms grew..."
  Confidence: HIGH

SECTION 3: Competitive Landscape
  Claim: "Jasper.ai reported ARR of $X in their 2024 funding announcement"
  Source: [TechCrunch, March 2024] — SQS: 72 (reliable)
  Evidence: "The company, which last raised at a $1.5B valuation..."
  Confidence: MEDIUM (secondary source; primary source is the funding announcement)
  Note: Verify against primary source (Jasper PR or SEC filing if available)
  
  Claim: "Average agency retainer for full-service B2B marketing: $15,000–$50,000/month"
  Source: [HubSpot Agency Survey 2025] — SQS: 68 (reliable)
  Evidence: "Of agencies surveyed, median retainer was..."
  Confidence: MEDIUM (methodology disclosed but sample is HubSpot ecosystem only)
```

---

## Part 6: Research Output Formats

Each research type has a canonical output schema. The schema enforces consistency —
every competitive intelligence report has the same sections in the same order,
making them comparable across time and useful for agents that consume them downstream.

### Research object schema

```typescript
interface ResearchReport {
  report_id: string
  tenant_id: string
  research_type: ResearchType
  run_id: string
  requested_by: string         // user_id or agent token
  topic: string
  scope: string                // what was and wasn't covered

  // Metadata
  source_count: number
  sources_attempted: number
  sources_blocked: number
  avg_source_quality_score: number
  confidence_distribution: {high: number, medium: number, low: number}
  research_duration_seconds: number
  total_tokens_consumed: number
  created_at: string

  // Content
  executive_summary: string    // 2–4 paragraphs, standalone readable
  sections: ReportSection[]
  evidence_map: Citation[]
  source_registry: SourceRecord[]
  known_gaps: string[]
  recommended_follow_up: string[]   // what further research would improve this

  // Downstream routing
  suggested_agents: string[]   // which agents should consume this report
  context_packages: AgentContextPackage[]  // pre-packaged subsets for specific agents
}

type ResearchType =
  | 'market_analysis'
  | 'competitive_intel'
  | 'voc_synthesis'
  | 'tech_landscape'
  | 'benchmark_report'
  | 'trend_report'
  | 'prospect_profile'
  | 'company_deep_dive'
```

---

## Part 7: Research Flow Into Other Agents

This is the most important section and the one most systems get wrong.

When RES-01 produces a market analysis, four other agents need parts of it:
- The Content Strategist needs the keyword/topic intelligence
- The Brand Pack Builder needs the competitive positioning data
- The Cold Outreach Sequencer needs the pain point language
- The Grand Strategist needs the market size and growth rate

The wrong architecture: each of those agents re-runs their own research, duplicating
cost, time, and hallucination risk.

The right architecture: RES-01 packages context specifically for each downstream
consumer and caches it in the research context store.

### The context package system

```typescript
interface AgentContextPackage {
  package_id: string
  source_report_id: string          // the research report it came from
  intended_agent: string            // agent token this is packaged for
  context_type: ContextType
  content: Record<string, unknown>  // agent-specific structured subset
  citations: string[]               // citation_ids included in this package
  confidence_level: 'high' | 'medium' | 'low'
  created_at: string
  expires_at: string                // TTL based on research type
}

type ContextType =
  | 'keyword_intelligence'      // for Content Strategist
  | 'competitive_positioning'   // for Brand Pack Builder, Grand Strategist
  | 'pain_point_language'       // for outreach agents, Copy Writer
  | 'market_context'            // for Grand Strategist, Campaign Planner
  | 'prospect_profile'          // for Prospector, Meeting Intelligence
  | 'technology_signals'        // for ABM Account Selector, Prospector
  | 'benchmark_data'            // for OKR Monitor, Performance Analyst
  | 'voc_corpus'                // for all content agents
```

### Context flow example: campaign launch

```
TRIGGER: Campaign Planner (STR-02) initiates "Q3 Pipeline Campaign" for SaaS CFO audience

Step 1: STR-02 requests research context
  → Checks research context store:
    "Is there a recent (< 30 days) research package for [CFO audience + SaaS finance pain points]?"
  → Cache hit: uses existing package
  → Cache miss: triggers RES-01 run

Step 2 (on cache miss): RES-01 runs deep research
  Topic: "CFO and finance leader pain points in SaaS operations 2026"
  Depth: 20 sources, Tier 4 chain
  Duration: ~18 minutes

  Packages produced from one research run:
    ├─ keyword_intelligence → CONT-01 (Content Strategist)
    │    "Keywords: 'SaaS financial operations', 'CFO dashboard', 'burn rate visibility'..."
    │    
    ├─ pain_point_language → CONT-04 (Short-Form Copy Writer) + LG-02 (Outreach Sequencer)
    │    "Verbatim language: 'we can't see cash position in real time', 
    │     'finance team is always the last to know', 'too many systems, no single source'..."
    │    
    ├─ competitive_positioning → STR-02 (Campaign Planner)
    │    "Competitors targeting this persona: [X], [Y]. 
    │     Gaps in their messaging: no one is addressing the board-reporting pain specifically."
    │    
    └─ market_context → STR-01 (Grand Strategist)
         "CFO-led software buying is up 34% YoY. Finance tech is the fastest-growing 
          budget category at Series B SaaS. Average deal cycle: 45 days."

Step 3: Context packages cached in research context store
  TTL: 30 days for this research type
  All downstream agents pull from cache, not from re-running research

Step 4: Downstream agents consume packages
  CONT-01 uses keyword_intelligence → content calendar targets CFO-relevant keywords
  CONT-04 uses pain_point_language → ad copy uses exact CFO language
  LG-02 uses pain_point_language → outreach email opens with a CFO-specific pain statement
  STR-02 uses competitive_positioning → campaign angles away from competitor messaging gaps
```

One research run. Four agents. Zero duplicated research. Zero contradictions between agents
(they all draw from the same sourced facts). This is the research flywheel.

### Research context store

```typescript
// Persisted in Supabase, vector-indexed in Upstash for semantic search

interface ResearchContextStore {
  // Exact lookup (by research type + topic hash)
  get(tenant_id: string, context_type: ContextType, topic_key: string): AgentContextPackage | null

  // Semantic lookup (find relevant research for a given agent task)
  search(tenant_id: string, agent_token: string, task_description: string, 
         max_results: number): AgentContextPackage[]

  // Staleness check
  isStale(package_id: string): boolean

  // Cache invalidation
  invalidate(tenant_id: string, context_type: ContextType, topic_key: string): void
}
```

Before any agent makes an external research call, it queries the context store:
1. Exact match lookup (same tenant, same topic, same context type, not stale)
2. Semantic match lookup (related research that might partially answer the need)
3. If neither: trigger new research run

This makes the system progressively cheaper to run as research accumulates. A tenant
who has been on MarkOS for 6 months has a deep research cache for their industry,
competitors, and audience. New agent runs pull from this cache. Marginal research
cost per campaign drops significantly over time.

---

## Part 8: The Hallucination Defense System

Research is where hallucination risk is highest. The agent has broad access to the
internet, a large context window, and produces claims that will appear in customer-facing
content. The defense system is multi-layered.

### Layer 1: Claim sourcing requirement

Every claim produced by a research agent must have an `evidence_text` — the actual
passage from the source that supports it. If a claim cannot be grounded in a fetched
source, it cannot be in the research output.

Implementation: the research agent's system prompt includes:

```
CLAIM GROUNDING RULE:
Every factual claim you include in this report must be followed by:
[SOURCE: {url} | EVIDENCE: {exact passage from source}]

If you find yourself writing a claim without a source passage to back it up,
you have two options only:
1. Find a source that supports it before including it
2. Explicitly label it: [AGENT INFERENCE: {reasoning}] — never presented as fact

There is no option 3. Confident-sounding claims without evidence are the primary
failure mode of AI research. Do not do this.
```

### Layer 2: The claim classifier

After research output is generated, a secondary pass runs on every claim:

```
Claim classifier evaluates each claim sentence for:

GROUNDED: claim is directly supported by evidence_text from a cited source ✓
INFERENCE: claim is a reasonable inference from cited sources — flagged, not blocked ⚠
UNSUPPORTED: claim is present with no source match — BLOCKED, agent must retry ✗
CONTRADICTED: claim conflicts with higher-quality source — FLAGGED for resolution ⚠

Any UNSUPPORTED claim blocks the research output from advancing until resolved.
```

### Layer 3: Statistic validation

Statistics are the highest-risk claim type. A misquoted statistic (e.g., "73% of
marketers say..." from a 2019 survey, lifted from a 2024 blog post that didn't check
the source) is the canonical AI research failure mode.

Statistic validation rules:
- Every percentage, dollar figure, or count must trace to a primary source within the TTL
- If the only source for a statistic is a secondary source (blog citing a study), the
  system attempts to find the primary source
- If primary source not found, the statistic is tagged: "According to [secondary source],
  which cites [original study name]" — the chain is made explicit
- Statistics older than the TTL for their claim type are blocked from new research output
  until re-verified

### Layer 4: Cross-agent fact consistency

When multiple agents produce content drawing from the same research base, a fact
consistency check runs before any content is published:

```
CONSISTENCY CHECK: Campaign "Q3 CFO Pipeline"

Claims made across campaign artifacts:
  Email sequence (CONT-05):  "CFO-led software buying grew 34% last year"
  LinkedIn post (CONT-06):   "Finance tech is the fastest growing budget category"
  Blog post (CONT-03):       "CFO-led software decisions are up 34% year over year"
  Ad copy (CONT-04):         "34% more CFOs are now the primary software buyer"

Citation consistency: ✓ All four claims trace to the same source (context package, citation_id: abc123)
Factual consistency: ✓ No contradictions across artifacts
Recency: ✓ Source is 4 months old, within TTL

CONSISTENCY CHECK: PASSED
```

If the consistency check fails — e.g., the blog post cites a different figure than the
email sequence — a task is created for the operator flagging the inconsistency before
any of the artifacts are published.

### Layer 5: The "I don't know" contract

Research agents are explicitly trained to acknowledge when they cannot find reliable
information. The failure mode to prevent: an agent that fills research gaps with
plausible-sounding generated text rather than acknowledging the gap.

All research agents operate under this contract:

```
GAP ACKNOWLEDGEMENT CONTRACT:

If a primary research question cannot be answered from available sources:
  → State clearly: "I was unable to find reliable data on [question]"
  → State what was found: "The closest available information is [source]
     which addresses [adjacent topic] but does not directly answer [question]"
  → State implications: "This gap means [what downstream agents cannot rely on]"
  → Suggest resolution: "This gap could be filled by [primary research method]"

This is not a failure. Acknowledged gaps are more valuable than hallucinated answers.
A research report that says "I don't know X" is far more trustworthy than one that
invents X and states it confidently.
```

---

## Part 9: The VOC Research Chain (Tier 5)

Voice of Customer research is different from all other research types because the
primary source is human language — reviews, interviews, support tickets, survey
responses, community posts. The goal is not fact extraction but **language extraction**.

Agent: RES-04 VOC Researcher

### What VOC research produces

The VOC corpus is a structured collection of exact human language organized by theme.
It is not a summary of what customers think. It is the actual words they use, which
content agents will draw from directly when writing copy, email subject lines, and
social posts.

### The VOC chain

```
Step 1: Source corpus assembly

  Public sources (no tenant permission required):
    - G2, Capterra, Trustpilot: structured review scraping via API
    - App Store / Google Play: review scraping (if applicable)
    - Reddit: keyword search in relevant subreddits
    - LinkedIn: public posts mentioning the product or category
    - YouTube: comment extraction from relevant videos

  Tenant-provided sources (operator uploads):
    - Customer interview transcripts
    - Support ticket text (exported from Zendesk/Intercom)
    - Survey responses (NPS verbatims, exit surveys)
    - Sales call transcripts (Gong/Chorus exports)
    - Onboarding call notes

Step 2: Language normalization
  ↓
  Remove: personally identifiable information, off-topic content, spam
  Normalize: fix obvious typos that would break pattern matching
  Segment: split long reviews into individual claims

Step 3: Theme extraction
  ↓
  Unsupervised clustering on all verbatims:
    - Initial clusters: identified by semantic similarity
    - Cluster labeling: "these reviews all express [theme]"
    - Cluster merging: clusters with high semantic overlap combined
    - Hierarchy: top-level themes → sub-themes

  Themes mapped to MarkOS pain taxonomy (from `brain/Pain-Point-Engine.md`):
    Each extracted theme assigned a pain_tag from the taxonomy
    If a theme has no matching pain_tag: flagged for taxonomy expansion

Step 4: Verbatim selection
  ↓
  For each theme cluster:
    Select 5–15 highest-quality verbatims:
      - Specificity: concrete over vague ("I can't see my Q3 numbers until mid-October"
        preferred over "reporting is slow")
      - Resonance: language that would resonate with ICP (not technical jargon
        unless ICP is technical)
      - Usability: can be lightly edited for copy without losing authenticity

Step 5: Language pattern extraction
  ↓
  From the verbatim corpus, extract:
    - Recurring phrases (bigrams + trigrams that appear 3+ times)
    - Metaphors customers use to describe the problem
    - Emotional language: frustration words, aspiration words
    - Jobs-to-be-done framing: "I'm trying to...", "I need to be able to..."
    - Objection language: "I wish it...", "The problem is...", "If only..."

Step 6: VOC corpus output
  ↓
  Structured corpus with:
    - Theme index (10–30 themes with pain_tag mapping)
    - Verbatim collection per theme (5–15 quotes each)
    - Language patterns (recurring phrases + emotional language)
    - JTBD map (jobs-to-be-done statements)
    - Objection library (objections + stated desire)
    - Recommended copy applications (which verbatims are best for ads, emails, landing pages)
```

### How VOC flows into content agents

The VOC corpus is the highest-value input a content agent can receive.

```
CONT-04 (Short-Form Copy Writer) consuming VOC corpus:

  System context includes:
    "The following are exact words your audience uses to describe this problem.
     Do not paraphrase them. Use these words verbatim or near-verbatim in copy.
     These are not examples to imitate — they are the actual language of the audience."

  Verbatims provided:
    "We can't see cash position in real time"
    "Finance team is always the last to know"
    "Too many systems, no single source of truth"
    "By the time I have the numbers, the decision is already made"
    "I'm flying blind on Q4 burn"

  Output ad copy:
    Headline: "Stop flying blind on Q4 burn"
    Sub: "Finance teams finally get real-time visibility — before the decision, not after"

  Why this works: "flying blind on Q4 burn" is not a copywriter's invention. It's the
  CFO's own language. It resonates because it IS them.
```

---

## Part 10: Research Agent Schedules and Triggers

Research agents run on three trigger types:

### Scheduled research (background intelligence)

| Agent | Cadence | What it refreshes |
|-------|---------|------------------|
| RES-02 Competitive Monitor | Weekly | Competitor positioning, product changes, content |
| RES-03 Market Scanner | Weekly | Industry trends, platform algorithm changes |
| RES-04 VOC Researcher | Monthly (public sources) | Review corpus refresh |
| RES-09 Benchmark Researcher | Monthly | Performance benchmarks |
| RES-05 Tech Stack Profiler | On prospect list refresh | Prospect tech stacks |

### Event-triggered research

| Trigger event | Research that fires |
|---------------|-------------------|
| Campaign launch initiated | Deep research on campaign audience + topic |
| New competitor detected (by RES-02) | Company deep-dive on new competitor |
| New design partner/client onboarded | Full market analysis for their industry |
| OKR miss detected (by STR-05) | Root cause research on the relevant channel |
| Content brief created | Shallow research on brief topic (Tier 3) |
| Cold outreach prospect added | Prospect profile (Tier 2 enrichment + Tier 3) |
| Demo booked | Meeting intelligence research (Tier 2 enrichment) |

### Operator-triggered research

Available as a UI action on any artifact, campaign, or question:

```
"Ask MarkOS to research this"
  ↓
Operator types a research question
  ↓
System classifies:
  - Is this answerable from context store? → Return cached package
  - Is this a Tier 3 question? → Shallow research, result in 3–5 min
  - Is this a Tier 4 question? → Deep research, result in 15–40 min, task created
  → Research runs, output delivered to task board when complete
```

This is the "research on demand" feature that positions MarkOS as an alternative to
asking a research agency for a quick brief. The response is not a ChatGPT-style answer.
It is a cited, quality-scored, evidence-backed research document — delivered in minutes.
