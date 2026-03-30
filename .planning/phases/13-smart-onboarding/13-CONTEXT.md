# Phase 13 — Smart Onboarding Engine v2.0
## CONTEXT.md — Locked Decisions for Research & Planning Agents

**Phase:** 13  
**Status:** Context locked — ready for research and planning  
**Created:** 2026-03-26  
**Derived from:** `/gsd-discuss-phase` session with product owner  
**Target milestone:** v1.2.0 — Future Integrations  

---

## Phase Objective

Transform the existing 7-step batch onboarding form into a **magic, intelligent 0-party data pipeline** that collects the richest possible company/product/audience context with minimum user effort. The system scrapes, parses, maps to schema, gap-fills via a conversational AI interview, and produces a fully reviewed `onboarding-seed.json v2.1` ready to drive all MIR/MSP agent generation.

---

## Area A — Crawl/Scrape UX: "The Omni-Input Gate" (Step 0)

### Locked Decisions

**A1. Entry architecture — Step 0 as the true starting point.**
The scraper and file drop zone are NOT optional mid-flow choices. They are the **absolute first screen** of every onboarding session. There is no "choose your path" option — instead:
- A single, clean, Google-esque unified input accepts **either** a website URL **or** a drag-and-drop file upload (or both).
- Copy: *"Give us your website URL, or drop your company docs here. We'll figure out the rest."*
- If neither is provided (user skips), the system falls through directly to the conversational interview with zero pre-filled data.

**A2. Background processing UX — terminal-style trust-building screen.**
While Tavily scrapes and file parsers extract, the user sees a **terminal/skeleton loading screen** (not a spinner, not a generic bar) showing active progress:
```
> Connecting to your website...             [Done]
> Extracting core value proposition...      [Done]
> Identifying target audience signals...    [Done]
> Mapping competitive landscape...          [Done]
> Detecting business model...               [Done]
> Scoring field confidence...               Running...
```
This is NOT decorative — each line corresponds to a real backend step. The terminal output builds trust and excitement. After completion, the system transitions automatically to the conversational interview.

**A3. Crawl depth — homepage + key internal pages.**
Tavily crawls: homepage, `/about`, `/pricing`, `/product`, `/features`, `/blog` (first 3 posts only), and any page linked from the homepage nav. Maximum crawl depth = **2 levels**. Enforced limit: max 15 pages total, 30-second timeout.

**A4. Failure handling — explicit recovery, no silent fallbacks.**
If scraping fails (timeout, blocked, Tavily error) or a file is corrupted:
- Show an explicit inline error with recovery action: *"We couldn't read [domain]. You can try another URL, drop files instead, or skip to the manual interview."*
- **Never** silently fall through to the full form without user awareness.
- Partial results (e.g., scrape succeeded but 1 of 3 files failed) are allowed — process what worked, flag what failed.

---

## Area B — Conversational Gap-Fill: "The Interview Engine"

### Locked Decisions

**B1. Business model selection — first question in the conversational flow.**
Business model is NOT scraped from the website (ambiguous, often wrong). It is the **first explicit question** asked after Step 0 completes, even if scraping returned strong data. Reason: it gates all downstream question routing logic.

**B2. Confidence scoring system — Red/Yellow/Green per schema field.**
After Step 0, the LLM maps all extracted data to `onboarding-seed.schema.json v2.1` fields and assigns a confidence score:
- ðŸŸ¢ **Green (â‰¥85%)** — field is populated, skip silently.
- ðŸŸ¡ **Yellow (50â€“84%)** — field has low-confidence data, ask user to confirm or enrich.
- ðŸ”´ **Red (<50% / missing)** — field absent, must ask.

Only Red and Yellow fields surface in the conversational interview. A user who provides a comprehensive website with docs in Step 0 may only see 3-5 questions total. A user who skips Step 0 sees the full interview.

**B3. Conversational grouping — LLM splits natural answers into schema fields.**
Questions are NOT asked 1-to-1 against schema fields. The LLM composes **natural language group questions** that extract multiple fields at once from a single free-text response. Examples:
- *"I see you're in B2B SaaS. Who are your top 1-2 competitors, and what's your biggest differentiator against them?"* → splits into `competition.competitors[].name`, `competition.competitors[].differentiator`
- *"What's the #1 outcome your customers achieve with your product, and what do prospects most often object to?"* → splits into `product.primary_benefit`, `product.main_objection`

**B4. LLM parsing of natural language → JSON fields.**
After each conversational answer, the LLM runs a **structured extraction pass** that maps the free-text answer to specific schema fields with a strict JSON output format. This parsed output is immediately stored as a partial seed, shown to the user as a live "data card" (confidence meter updating in real time).

**B5. Business-model-based route customization.**
After business model is confirmed, the interview dynamically adjusts:
- **B2B / SaaS / Agents-aaS**: Asks decision_maker, sales_cycle, ICP job titles, LinkedIn presence
- **B2C / DTC**: Asks avg_order_value, purchase_frequency, lifestyle_triggers, emotional drivers
- **Marketplace**: Asks supply_side, demand_side, monetization model
- **B2B2C**: Hybrid path, asks both partner channel and end-consumer profile

If business model changes (user corrects it), the system **re-evaluates and re-flags** previous answers as Yellow until re-confirmed. No silent carryover of stale B2B answers into a B2C flow.

**B6. Auto-enrichment — competitor detection via AI-powered web search.**
After Step 0 + business model confirmed, if competitor data is missing or low-confidence, the backend runs a **targeted web search** (Tavily) to auto-suggest competitors and market trends:
- *"Based on your space, your competitors might be [X] and [Y]. Does that sound right? What makes you different from them?"*
This is an AI-proposed suggestion the user confirms/edits — not auto-filled into the seed.

---

## Area C — File Drop Zone & UI/UX Design

### Locked Decisions

**C1. File drop zone — Step 0 dedicated screen, persistent access thereafter.**
The drop zone lives in Step 0 as its primary purpose. After Step 0 is complete, a **persistent "add more files" affordance** (small icon/button in the corner) remains accessible throughout the interview in case the user remembers additional assets.

**C2. Supported file formats.**
```
PDF    → pdf-parse (Node.js, zero native deps)
DOCX   → mammoth (Node.js, battle-tested)
TXT    → raw fs.readFile(), UTF-8
MD     → raw fs.readFile(), strip markdown syntax
CSV    → csv-parse (column-aware, smart header detection)
```
**Limits:** 5 files maximum, 10MB total, 50MB single file hard cap. These limits balance processing speed with real-world use (pitch decks, brand guidelines, whitepapers).

**C3. File processing feedback — per-file status indicators.**
Each uploaded file gets its own **processing card** showing:
```
ðŸ“„ brand-guidelines.pdf     Parsing...   → âœ“ Extracted 4,200 tokens
ðŸ“Š customer-research.csv    Parsing...   → âœ“ Mapped 3 audience signals  
ðŸ“ company-overview.docx    Parsing...   → âš  Partial (table extraction limited)
```
Files are processed in parallel. UI shows status per file, not a single batch spinner.

**C4. Hierarchy of Truth — conflict resolution.**
When the same field is populated from multiple sources, this priority order wins:
```
1st. User's direct conversational answer (highest trust)
2nd. Dropped files (explicit human-curated content)
3rd. Website scrape (inferred content, lowest trust)
```
Conflicts from lower-priority sources are shown in the Step 7 Review dashboard as `[Source: Web]` or `[Source: File]` badges so users know what was inferred vs. stated directly.

**C5. UI design language — premium dark-mode with attention-managed accents.**
- Default theme: **dark mode** with a configurable accent color (from `onboarding-config.json`)
- Design references: Linear-level polish, Vercel-style terminal aesthetics for scraping screen
- Rage click prevention: buttons disable immediately on first click, re-enable with loading state
- Dead click prevention: all interactive areas have clear affordance (hover states, cursor changes)
- Attention management: color accent is used **only** on CTAs and confidence indicators — not decoratively
- Micro-animations: field entry feels alive (gentle slide-in, typing indicator on AI responses)
- White-label override: all colors/copy/logos remain configurable via `onboarding-config.json`

---

## Area D — LLM Strategy: The Fallback Cascade

### Locked Decisions

**D1. Three-tier LLM routing cascade.**
```
Tier 1 — BYOK (Bring Your Own Key)
  If OpenAI / Anthropic / Gemini key found in .env → route all LLM calls there
  via existing llm-adapter.cjs (already implemented)
  → Fastest, highest quality, recommended for agencies

Tier 2 — Local Inference via Ollama
  If no API keys → check if Ollama is installed and running
  Default model: Llama 3 8B (quality/speed balance) or Phi-3 (lower RAM)
  → Node.js calls Ollama REST API at localhost:11434

Tier 3 — Manual fallback
  If neither BYOK nor Ollama → disable AI spark, disable extraction
  → All fields must be filled manually via traditional form
  → Show prominent banner: "Add an API key or install Ollama to enable AI features"
```

**D2. Strict JSON output enforcement.**
Every LLM extraction call uses a **system prompt that enforces strict JSON output matching `onboarding-seed.schema.json v2.1`**. The prompt template is:
```
System: You are an extraction engine. Output ONLY valid JSON matching this schema: [SCHEMA].
Do not add keys not present in the schema. If a field is unknown, output null.
Never explain. Never wrap in markdown.
```
The backend validates output with the existing schema before writing to seed file. Invalid JSON triggers a retry with a clarification prompt (max 2 retries, then fall through to null for that field).

**D3. AI Spark icon — per-field generation with popover alternatives.**
The âœ¨ spark icon appears on every text input and textarea. On click:
- Opens a **small popover** with **2-3 generated alternatives** (not auto-replace)
- Each alternative is selectable; selecting it fills the field (user can still edit after)
- Context used for generation (priority order):
  1. Scraped website data (highest specificity)
  2. Uploaded file content
  3. Previously answered form fields in current session
  4. Business model + Tier 1/2 example library (fallback context)
- If Tier 3 (no LLM): spark icon shows as disabled with tooltip: *"Enable AI: add an API key or install Ollama"*

**D4. Prompts are system-authored, not user-facing.**
Users never write or see prompts. All extraction, grouping, and generation prompts are **maintained in a dedicated `onboarding/backend/prompts/` directory** as `.js` template files. This makes them easy to iterate without touching business logic.

---

## Extra Strategic Enhancements (Locked for Phase 13 Scope)

### E1 — Auto-Enrichment: Magic Competitor Discovery
After website is scraped and business model confirmed, backend runs a **Tavily search** for:
- `"[company name] competitors"`  
- `"[industry] market leaders [year]"`

Results are presented as a **confirmation card** in the interview:  
*"We found that your likely competitors are [X], [Y], [Z]. Does this look right? What's your biggest differentiator against each?"*  
User confirms/edits → populates `competition.competitors[]` with high confidence.

### E2 — "Skip Chat" Bailout Button
A **persistent, always-visible button** throughout the conversational interview:  
`"Skip chat → Show full form"`  
Clicking immediately renders all 30+ fields as a traditional multi-step form (the current Step 1-6 form, but enhanced with the new data already pre-filled from scraping). This respects power users who prefer direct database control.  
The bailout is **non-destructive**: any data gathered in the conversational phase is pre-populated in the form.

### E3 — Step 7 Enhanced: Full Schema Review Dashboard
Step 7 is no longer just AI Draft Review. It becomes a **full schema review dashboard** showing:
- All ~30 fields organized by section (Company, Product, Audience, Competition, Market, Content)
- Each field shows: current value + source badge (`[Chat]`, `[File]`, `[Web]`, `[AI]`, `[Manual]`)
- Every field is **inline-editable** before final submission
- Confidence indicators remain visible (Green/Yellow/Red) so users know what's solid vs. guessed
- "Regenerate" button per section triggers a re-extraction from all available data
- Existing AI Draft Review cards (MIR/MSP previews) remain as a **second tab** in Step 7

---

## Data Flow Summary

```
Step 0: Omni-Input Gate
  â”œâ”€â”€ URL provided → Tavily scrape (depth 2, max 15 pages)
  â”œâ”€â”€ Files dropped → pdf-parse / mammoth / csv-parse
  â”œâ”€â”€ Both → parallel processing, results merged per Hierarchy of Truth
  â””â”€â”€ Neither → proceed with empty context

Terminal Screen: Live extraction progress display

Business Model Selection: First explicit question (gates routing)

Confidence Scoring: LLM maps extracted data → schema fields → R/Y/G scores

Conversational Interview:
  â”œâ”€â”€ Only Red + Yellow fields surface
  â”œâ”€â”€ LLM composes grouped natural-language questions
  â”œâ”€â”€ User answers free-text → LLM extracts → partial seed updates live
  â”œâ”€â”€ Auto-enrichment: competitor discovery via Tavily
  â””â”€â”€ "Skip Chat" button available at all times

Step 7: Full Schema Review Dashboard
  â”œâ”€â”€ Tab 1: 30-field inline-editable schema (all sources + badges)
  â””â”€â”€ Tab 2: AI Draft Review (MIR/MSP previews, approve/regenerate)

Submit → onboarding-seed.json v2.1 → orchestrator.cjs → MIR/MSP generation
```

---

## Integration Points (Codebase Awareness)

| Existing Asset | How Phase 13 Uses It |
|----------------|----------------------|
| `onboarding/backend/server.cjs` | Add new routes: `POST /scrape`, `POST /parse-files`, `POST /extract-fields`, `GET /scrape-status` |
| `onboarding/backend/agents/llm-adapter.cjs` | Used for all LLM calls (BYOK tier 1). Extend to support Ollama at tier 2. |
| `onboarding/backend/agents/orchestrator.cjs` | Remains as final step; receives completed seed, unchanged |
| `onboarding/onboarding-seed.schema.json` | Target schema v2.1 — no changes needed, this is the extraction target |
| `onboarding/onboarding-config.json` | Add `accent_color`, `ollama_model`, `tavily_api_key`, `max_crawl_depth` fields |
| `onboarding/index.html` | Full rebuild of Step 0 + conversational flow. Steps 1-6 reformatted as bailout form. Step 7 expanded. |
| `onboarding/onboarding.js` | Full rebuild to support new state machine (Step 0 → scrape → interview → bailout → review) |

---

## New Files to Create

```
onboarding/backend/
â”œâ”€â”€ scrapers/
â”‚   â””â”€â”€ tavily-scraper.cjs       # Tavily API wrapper, depth-limited crawler
â”œâ”€â”€ parsers/
â”‚   â”œâ”€â”€ pdf-parser.cjs           # pdf-parse wrapper
â”‚   â”œâ”€â”€ docx-parser.cjs          # mammoth wrapper
â”‚   â”œâ”€â”€ csv-parser.cjs           # csv-parse wrapper
â”‚   â””â”€â”€ text-parser.cjs          # TXT + MD handler
â”œâ”€â”€ extractors/
â”‚   â””â”€â”€ schema-extractor.cjs     # LLM call: raw text → schema JSON
â”œâ”€â”€ confidences/
â”‚   â””â”€â”€ confidence-scorer.cjs    # Field confidence scoring R/Y/G
â”œâ”€â”€ enrichers/
â”‚   â””â”€â”€ competitor-enricher.cjs  # Tavily competitor discovery search
â””â”€â”€ prompts/
    â”œâ”€â”€ extraction-prompt.js     # Strict JSON extraction system prompt
    â”œâ”€â”€ grouping-prompt.js       # Conversational question grouping prompt
    â”œâ”€â”€ spark-prompt.js          # Per-field AI spark generation prompt
    â””â”€â”€ enrichment-prompt.js     # Competitor/market discovery prompt
```

---

## Requirements for Phase 13

| ID | Requirement | Priority |
|----|-------------|----------|
| ONB-13-01 | Step 0 Omni-Input Gate: unified URL + file drop as first screen | P0 |
| ONB-13-02 | Tavily web scraper with depth-2 crawl, 15-page/30s limits | P0 |
| ONB-13-03 | File parsers: PDF (pdf-parse), DOCX (mammoth), TXT/MD (fs), CSV (csv-parse) | P0 |
| ONB-13-04 | Terminal-style live extraction progress screen | P0 |
| ONB-13-05 | LLM confidence scorer mapping extracted data to schema fields (R/Y/G) | P0 |
| ONB-13-06 | Conversational gap-fill interview: only Red/Yellow fields surfaced | P0 |
| ONB-13-07 | LLM natural-language grouping: multi-field answers split to schema fields | P0 |
| ONB-13-08 | Business model routing: dynamic question set per model type | P0 |
| ONB-13-09 | LLM cascade: BYOK (tier 1) → Ollama (tier 2) → manual (tier 3) | P0 |
| ONB-13-10 | Strict JSON output enforcement with schema validation + retry | P0 |
| ONB-13-11 | AI Spark âœ¨ icon on all text inputs: popover with 2-3 alternatives | P1 |
| ONB-13-12 | Hierarchy of Truth conflict resolution: Chat > File > Web | P0 |
| ONB-13-13 | Auto-enrichment: competitor discovery via Tavily post-scrape | P1 |
| ONB-13-14 | "Skip Chat" bailout → traditional pre-filled form at any time | P0 |
| ONB-13-15 | Step 7 full schema review dashboard with inline editing + source badges | P0 |
| ONB-13-16 | Step 7 tab 2: existing AI Draft Review cards (MIR/MSP) preserved | P1 |
| ONB-13-17 | Premium dark-mode UI with configurable accent, rage/dead click prevention | P0 |
| ONB-13-18 | Per-file processing cards with status indicators during parsing | P1 |
| ONB-13-19 | Prompts maintained in `onboarding/backend/prompts/` as iterable JS templates | P1 |
| ONB-13-20 | `onboarding-config.json` extended with Tavily key, Ollama model, accent color | P1 |

---

## Out of Scope for Phase 13

- Multi-user / team collaboration on the same onboarding session
- Real-time sync (WebSockets) — polling or SSE for scrape progress is acceptable
- Custom domain scraper (not Tavily) — Tavily is the locked choice
- Supabase + Upstash Vector changes — vectorization of onboarding content is Phase 14+ territory
- MIR/MSP template changes — orchestrator.cjs receives the same seed format v2.1

---

## Deferred Ideas (Captured, Not Acted On)

- **Voice input**: User speaks their answers instead of typing → STT → LLM extraction
- **Real-time collaborative editing**: Multiple team members fill different sections simultaneously
- **Onboarding templates**: Pre-filled seed templates for common archetypes (e.g., "B2B SaaS startup", "DTC skincare brand")
- **LinkedIn/social scraping**: Pull company page, follower count, recent posts as additional signal
- **Historical onboarding diff**: Show what changed between onboarding runs (re-onboarding flow)

---

*Context locked. Downstream agents (researcher, planner) should use this document as the single source of truth for Phase 13 implementation decisions.*  
*Do not ask the user to re-clarify any decision documented above.*

