# MarkOS Technical Architecture Map

**Last Updated:** March 27, 2026  
**Version:** 1.1.0  
**Status:** Production-Ready  

---

## Executive Overview


The MarkOS protocol is a complete **agentic marketing execution system** that installs alongside GSD for unified AI-powered development + marketing teams. It provides:

- **MIR** (Marketing Intelligence Repository): Ground-truth brand, audience, and product data
- **MSP** (Marketing Strategy Plan): Tactical blueprints for all marketing channels
- **ITM** (Issue Task Templates): Pre-built Linear.app tickets for common marketing jobs
- **Agent Ecosystem**: 25+ specialized AI agents for strategy, execution, and verification
- **Onboarding Engine**: Web-based form â†’ AI draft generation â†’ Supabase \+ Upstash Vector persistence
- **Vector Memory**: Per-project Supabase \+ Upstash Vector collections for episodic learning and RAG

---

## Part 1: System Architecture Layers

### Layer 1: Entry Points & Installation

**CLI Binaries** â€” First-run installation and updates

| Component | Location | Purpose | Key Exports |
|-----------|----------|---------|-------------|
| **install.cjs** | `bin/install.cjs` | First-run interactive installer. Prompts user, detects GSD coexistence, copies templates, delegates Supabase \+ Upstash Vector boot. | `run()` â†’ calls `update.cjs` or boots protocol |
| **update.cjs** | `bin/update.cjs` | SHA256-idempotent updater. Preserves user patches in `.markos-local/`. Overrides base templates only. | Patches manifest, verifies integrity |
| **ensure-vector.cjs** | `bin/ensure-vector.cjs` | Auto-healing Supabase \+ Upstash Vector daemon. Pings localhost:8000, revives process if dead, or delegates to cloud. | `ensureVector()` â†’ Promise<boolean> |

**Installation Flow:**
```
1. npm install -g markos
2. npx markos install
3. bin/install.cjs detects GSD, prompts scope (project/global)
4. Copies .agent/markos/templates/ â†’ target
5. Calls bin/ensure-vector.cjs to boot local DB
6. Writes .markos-install-manifest.json (idempotent marker)
```

---

### Layer 2: Onboarding Engine (Smart Onboarding v2.0)

**Purpose:** Convert unstructured company data (URLs, PDFs, docs) â†’ AI-approved MIR/MSP drafts

**HTTP Server** â€” `onboarding/backend/server.cjs`

Serves the web form UI and orchestrates AI draft generation.

| Endpoint | Method | Handler | Purpose |
|----------|--------|---------|---------|
| `/` | GET | Static file serve | Serves `index.html` + onboarding UI |
| `/config` | GET | `handleConfig()` | Returns environment config, port, vector_endpoint |
| `/status` | GET | `handleStatus()` | Returns Supabase \+ Upstash Vector health + MIR completion gates |
| `/submit` | POST | `handleSubmit()` | **Core entry:** Accepts seed JSON, triggers orchestrator, stores drafts to Vector Store |
| `/regenerate` | POST | `handleRegenerate()` | Re-runs a single agent for a specific section (e.g., "brand_voice") |
| `/approve` | POST | `handleApprove()` | JIT-clones templates, writes approved drafts to `.markos-local/`, stamps STATE.md |
| `/linear/sync` | POST | `handleLinearSync()` | Creates Linear issues from ITM tokens with deterministic assignee mapping |
| `/campaign/result` | POST | `handleCampaignResult()` | Appends Winners Catalog rows and stores outcome classification metadata |
| `/api/extract-sources` | POST | `handleExtractSources()` | Tavily API scraper: extracts structured data from URLs/files |
| `/api/extract-and-score` | POST | `handleExtractAndScore()` | Confidence scorer: rates quality of extracted data (R/Y/G) |
| `/api/generate-question` | POST | `handleGenerateQuestion()` | Gap-fill interview: generates follow-up questions for missing data |
| `/api/spark-suggestion` | POST | `handleSparkSuggestion()` | AI sparkline: generates creative suggestions for fields |

**Boot Sequence:**
```
1. Load .env from PROJECT_ROOT
2. Load onboarding-config.json (or defaults)
3. Configure vector-store-client.cjs with UPSTASH_VECTOR_REST_URL or localhost:8000
4. Call bin/ensure-vector.cjs (guarantee DB is alive)
5. Listen on port 4242 (auto-fallback if in use)
6. Auto-open browser if config.auto_open_browser = true
```

**Configuration** â€” `onboarding-config.json`

```json
{
  "port": 4242,
  "auto_open_browser": true,
  "vector_endpoint": "http://localhost:8000",
  "project_slug": "markos-client",
  "mir_output_path": null,  // defaults to .markos-local/MIR
  "posthog_api_key": "phc_XYZ",
  "posthog_host": "https://us.i.posthog.com"
}
```

---

### Layer 3: AI Orchestration & Draft Generation

**Orchestrator** â€” `onboarding/backend/agents/orchestrator.cjs`

Coordinates parallel execution of all LLM-based draft generators and persists results.

**Execution Flow:**
```
1. Store raw seed in Supabase \+ Upstash Vector (RAG retrieval source)
2. Run MIR generators (batched to avoid 429 rate limits):
   - generateCompanyProfile()
   - generateMissionVisionValues()
   - generateAudienceProfile()
   - generateCompetitiveLandscape()
3. Run MSP generators:
   - generateBrandVoice()
   - generateChannelStrategy()
   - generatePaidAcquisition()
4. Optional: Run neuro-auditor validation (if skill file exists)
5. Collect all drafts into { section_key: text } map
6. Store each draft in Supabase \+ Upstash Vector under markos-{slug} collection
7. Return: { drafts, vectorStoreResults, errors }
```

**Interface:**
```javascript
// onboarding/backend/agents/orchestrator.cjs
orchestrate(seed, slug) 
  â†’ Promise<{
      drafts: {
        company_profile: string,
        mission_values: string,
        audience: string,
        competitive: string,
        brand_voice: string,
        channel_strategy: string
      },
      vectorStoreResults: array,
      errors: array
    }>
```

**Retry Strategy:**
- 3 attempts with exponential backoff (1.5s, 3s, 6s)
- On failure: returns `{ ok: false, text: "[DRAFT UNAVAILABLE...]" }`
- Non-retryable errors (auth, 401, 403) fail immediately
- Telemetry captured: agent_name, token_usage, generation_time_ms

---

### Layer 4: LLM Adapters & Multi-Model Support

**LLM Adapter** â€” `onboarding/backend/agents/llm-adapter.cjs`

Unified interface for OpenAI, Anthropic, Gemini, and Ollama.

**Provider Priority (auto-detected):**
1. `options.provider` â€” explicit override per call
2. `ANTHROPIC_API_KEY` â†’ Claude 3.5 Haiku (default model: `claude-3-5-haiku-20241022`)
3. `OPENAI_API_KEY` â†’ GPT-4o-mini (uses OpenAI SDK)
4. `GEMINI_API_KEY` â†’ Gemini 2.5 Flash (native fetch)
5. `OLLAMA_ENDPOINT` â†’ Local Ollama (fallback)

**Interface:**
```javascript
// onboarding/backend/agents/llm-adapter.cjs
call(systemPrompt, userPrompt, options = {})
  â†’ Promise<{
      ok: boolean,
      text: string,
      provider: 'openai' | 'anthropic' | 'gemini' | 'ollama',
      error?: string,
      isFallback?: boolean,
      usage?: { promptTokens, completionTokens, totalTokens },
      generationTimeMs?: number
    }>
```

**Options:**
- `provider`: Force specific provider
- `model`: Override default model name
- `max_tokens`: Default 1200
- `temperature`: Default 0.4

**Implementations:**

| Provider | Endpoint | Default Model | Headers |
|----------|----------|---------------|---------|
| Anthropic | `api.anthropic.com/v1/messages` | claude-3-5-haiku-20241022 | x-api-key, anthropic-version |
| OpenAI | SDK client | gpt-4o-mini | Authorization: Bearer |
| Gemini | `generativelanguage.googleapis.com/v1beta/models` | gemini-2.5-flash | x-goog-api-key |
| Ollama | `http://localhost:11434/api/generate` | (configurable) | None |

**Fallback Behavior:**
If all LLM calls fail, returns deterministic fallback template with known structure (prevents cascade failures).

---

### Layer 5: Draft Generators (MIR & MSP)

#### MIR Filler â€” `onboarding/backend/agents/mir-filler.cjs`

Generates Marketing Intelligence Repository drafts from seed data.

**Generators:**

| Function | Output File | Template Injection | Example Logic |
|----------|-------------|-------------------|----------------|
| `generateCompanyProfile()` | `Core_Strategy/01_COMPANY/PROFILE.md` | Examples: resolve by business_model | "What The Business Does" + "Key Differentiators" |
| `generateMissionVisionValues()` | `Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md` | Examples: resolve by industry | "Mission Statement", "Vision 10-Year", "Core Values" |
| `generateAudienceProfile()` | `Market_Audiences/03_MARKET/AUDIENCES.md` | Examples: resolve by job_title | Persona name, job title, pain points, motivations |
| `generateCompetitiveLandscape()` | `Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md` | Examples: resolve by market segment | Competitor analysis, positioning gaps, threats, opportunities |

**System Prompt (shared across all):**
```
You are an expert B2B and B2C marketing strategist. Your job is to fill in 
structured marketing intelligence documents (MIR) based on raw client onboarding data.

RULES:
1. Never fabricate specific data (revenue %, market share) unless explicitly given.
2. Write in third-person about the company (e.g., "The company...").
3. Output clean, professional markdown. No fluff, no buzzwords.
4. Keep sections concise. Dense, accurate, actionable.
5. If data missing: write "[REQUIRES HUMAN INPUT â€” describe]".
6. Never output JSON â€” output markdown content only.
```

**Input Schema** â€” `onboarding/onboarding-seed.schema.json`

```json
{
  "company": {
    "name": "string*",
    "industry": "string*",
    "business_model": "B2B | B2C | B2B2C | Marketplace | DTC | Agents-AAS*",
    "founded": "number or string",
    "country": "string*",
    "mission": "string*",
    "brand_values": "string[]",
    "tone_of_voice": "string*"
  },
  "product": {
    "name": "string*",
    "category": "string*",
    "primary_benefit": "string*",
    "top_features": "string[]",
    "price_range": "string"
  },
  "audience": {
    "segment_name": "string*",
    "job_title": "string*",
    "pain_points": "string[]",
    "online_hangouts": "string",
    "vocabulary": "string"
  },
  "market": {
    "maturity": "Nascent | Emerging | Growth | Mature",
    "biggest_trend": "string*"
  },
  "competitive": {
    "top_competitors": "string[]",
    "positioning_gap": "string"
  },
  "content": {}
}
```

#### MSP Filler â€” `onboarding/backend/agents/msp-filler.cjs`

Generates Marketing Strategy Plan drafts (tactical execution blueprints).

**Generators:**

| Function | Output File | Purpose |
|----------|-------------|---------|
| `generateBrandVoice()` | `Core_Strategy/02_BRAND/VOICE-TONE.md` | Brand voice dimensions, do/don't language, tone calibration by context |
| `generateChannelStrategy()` | `MSP/Strategy/00_MASTER-PLAN/CHANNEL-STRATEGY.md` | Channel priority ranking, audience behavior â†’ channel fit, budget allocation |
| `generatePaidAcquisition()` | `MSP/Campaigns/01_PAID_ACQUISITION.md` | Paid media channels (social, search, display), targeting strategies, CPA targets |

**Input** â€” Same seed + resolveExample() pattern:
- Reads `.agent/.../templates/MSP/Strategy/_CHANNEL-STRATEGY-{business_model}.example.md`
- Uses as context anchor for LLM generation
- Ensures output matches known-good structure

---

### Layer 6: Vector Memory & RAG

**Supabase \+ Upstash Vector Client** â€” `onboarding/backend/vector-store-client.cjs`

HTTP wrapper for Supabase \+ Upstash Vector vector storage.

**Collection Naming:**
```
markos-{project_slug}

Example: markos-acme-corp
Collection isolation ensures multi-tenant safety.
```

**Interface:**
```javascript
configure(host)                        // Set vector host endpoint at boot
healthCheck()                          // â†’ { ok: true/false, error?: string }
storeDraft(slug, section, text, meta)  // Store draft with metadata
getDrafts(slug)                        // â†’ { section: text, ... }
upsertSeed(slug, seed)                 // Store raw seed JSON by section
upsertProjectMeta(slug, meta)          // Store project metadata
```

**Sections (auto-stored):**
- `company`: company data
- `product`: product data
- `audience`: audience data
- `competition`: competitor data
- `market`: market data
- `content`: content assets

**Cloud Override:**
```env
UPSTASH_VECTOR_REST_URL=https://...        # e.g., Hosted Supabase \+ Upstash Vector
UPSTASH_VECTOR_REST_TOKEN=sk-...           # Auth token if required
```

If UPSTASH_VECTOR_REST_URL is set, local daemon is skipped entirely.

---

### Layer 7: Persistence & State Management

**Write-MIR** â€” `onboarding/backend/write-mir.cjs`

Converts approved AI drafts â†’ persistent MIR files in `.markos-local/`.

**Workflow:**
1. **JIT-Clone**: If `.markos-local/MIR/` missing, copies entire `.agent/.../templates/MIR/` structure
2. **Fuzzy Merge**: Uses header-matching regex to inject draft content into existing templates
3. **Fallback Append**: If no standard headers found, appends raw text with disclaimer
4. **STATE.md Stamping**: Scans STATE.md and updates rows from `(empty)` â†’ `(complete)`

**Section-to-File Mapping:**
```javascript
{
  company_profile:   'Core_Strategy/01_COMPANY/PROFILE.md',
  mission_values:    'Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md',
  audience:          'Market_Audiences/03_MARKET/AUDIENCES.md',
  competitive:       'Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md',
  brand_voice:       'Core_Strategy/02_BRAND/VOICE-TONE.md',
  channel_strategy:  '../MSP/Strategy/00_MASTER-PLAN/CHANNEL-STRATEGY.md'
}
```

**Disclaimer Applied:**
```markdown
> ðŸ¤– **Generated by MarkOS AI** on `2026-03-27`
<!-- status: complete -->
<!-- source: onboarding-agent -->
```

**Interface:**
```javascript
applyDrafts(slug, drafts, mirPath) 
  â†’ Promise<{ written: string[], errors: string[] }>
```

---

### Layer 8: Project Configuration & State

**Project Manifest** â€” `.markos-project.json`

Written **once** on first `POST /submit`. Never regenerated.

```json
{
  "project_slug": "acme-corp-abc123",
  "client_name": "Acme Corp",
  "installed_at": "2026-03-27T14:32:00Z",
  "vector_namespace": "markos-acme-corp-abc123"
}
```

**Override Layer** â€” `.markos-local/`

Client-specific data. Gitignored. NEVER committed.

```
.markos-local/
â”œâ”€â”€ .gitignore                    # /MIR, /MSP, /config
â”œâ”€â”€ MIR/                          # Client MIR overrides
â”‚   â”œâ”€â”€ Core_Strategy/
â”‚   â”œâ”€â”€ Market_Audiences/
â”‚   â””â”€â”€ Products/
â”œâ”€â”€ MSP/                          # Client MSP execution plans
â”‚   â”œâ”€â”€ Strategy/
â”‚   â”œâ”€â”€ Campaigns/
â”‚   â”œâ”€â”€ Social/
â”‚   â”œâ”€â”€ Outbound/
â”‚   â””â”€â”€ Inbound/
â””â”€â”€ config/                       # Local config overrides
  â””â”€â”€ .env.local
```

**Resolution Order:**
1. Check `.markos-local/{path}`
2. If exists: use it + log `[override]`
3. If missing: fallback to `.agent/templates/{path}`

---

### Layer 9: Supporting Services

#### File Parsers â€” `onboarding/backend/parsers/`

Converts non-text formats â†’ structured data for seed ingestion.

| Parser | Location | Input | Output |
|--------|----------|-------|--------|
| PDF | `pdf-parser.cjs` | `.pdf` files | Extracted text |
| DOCX | `docx-parser.cjs` | `.docx` files | Extracted text + structure |
| CSV | `csv-parser.cjs` | `.csv` files | Array of rows |
| Text | `text-parser.cjs` | `.txt`, `.md` files | Raw text |

**Usage in handlers.cjs:**
```javascript
if (file.originalFilename.endsWith('.pdf')) {
  content = await pdfParser.parse(file.filepath);
}
```

#### Scrapers â€” `onboarding/backend/scrapers/`

Extracts structured company data from live sources.

**Tavily Scraper** â€” `tavily-scraper.cjs`

```javascript
scrape(url) â†’ Promise<{
  title: string,
  description: string,
  company_overview: string,
  industry: string,
  products: string[],
  team_size_range: string,
  founded_year: string,
  location: string
}>
```

Uses Tavily API (LLM-powered web search) to extract structured company info.

#### Confidence Scorer â€” `onboarding/backend/confidences/confidence-scorer.cjs`

Rates quality of extracted/provided data.

**Rating System:**
- **ðŸŸ¢ Green**: High confidence (sourced, verified, complete)
- **ðŸŸ¡ Yellow**: Medium confidence (inferred, partial, reasonable)
- **ðŸ”´ Red**: Low confidence (missing, ambiguous, placeholder)

**Usage:**
```
POST /api/extract-and-score
â†’ Rates each extracted field â†’ Triggers gap-fill interview
```

#### Enrichers â€” `onboarding/backend/enrichers/`

Fills gaps in extracted data through secondary sources.

**Competitor Enricher** â€” `competitor-enricher.cjs`

```javascript
discoverCompetitors(company_name, industry) 
  â†’ Promise<{
      direct_competitors: {
        name: string,
        market_position: string,
        pricing: string
      }[],
      indirect_competitors: [...],
      market_gaps: string[]
    }>
```

---

#### Telemetry â€” `onboarding/backend/agents/telemetry.cjs`

Captures usage metrics via PostHog.

**Events Captured:**
- `agent_execution_started`: { agent_name, project_slug }
- `agent_execution_completed`: { agent_name, token_usage, generation_time_ms }
- `form_submission`: { client_name, business_model }
- `draft_approved`: { section, char_count }

**Control:**
```env
MARKOS_TELEMETRY=false              # Disable all telemetry
POSTHOG_API_KEY=phc_...           # PostHog project key
POSTHOG_HOST=https://...          # PostHog instance URL
```

---

### Layer 10: Example Resolution & Context Injection

**Example Resolver** â€” `onboarding/backend/agents/example-resolver.cjs`

Injects example context into LLM prompts for better outputs.

**Pattern:**
```javascript
resolveExample(templateName, businessModel, templateSubdir, basePath)
  â†’ string (markdown block from examples)
```

**Template Logic:**
- For `business_model = "SaaS"`: loads `.../templates/MSP/Strategy/_CHANNEL-STRATEGY-saas.example.md`
- For `business_model = "B2B"`: loads `.../templates/MSP/Strategy/_CHANNEL-STRATEGY-b2b.example.md`
- Fallback: uses generic template

**Directory Structure:**
```
.agent/markos/templates/
â”œâ”€â”€ MSP/Strategy/
â”‚   â”œâ”€â”€ _CHANNEL-STRATEGY-saas.example.md
â”‚   â”œâ”€â”€ _CHANNEL-STRATEGY-b2b.example.md
â”‚   â”œâ”€â”€ _CHANNEL-STRATEGY-b2c.example.md
â”‚   â”œâ”€â”€ _CHANNEL-STRATEGY-marketplace.example.md
â”‚   â””â”€â”€ ... (6+ more)
â”œâ”€â”€ MSP/Campaigns/
â”‚   â”œâ”€â”€ _PAID-ACQUISITION-saas.example.md
â”‚   â””â”€â”€ ... (6+ more)
â””â”€â”€ MIR/
    â””â”€â”€ (templated similarly)
```

**Usage in mir-filler.cjs & msp-filler.cjs:**
```javascript
const exampleBlock = resolveExample('BRAND-VOICE', company.business_model, '', CORE_STRAT_DIR);
const prompt = `[...] ${exampleBlock} Write:[...]`;
```

---

### Layer 11: Path Resolution & Central Authority

**Path Constants** â€” `onboarding/backend/path-constants.cjs`

Centralized path resolution to prevent "dot-hell" bugs.

```javascript
PROJECT_ROOT              // /workspaces/markos
ONBOARDING_DIR           // PROJECT_ROOT/onboarding
BACKEND_DIR              // ONBOARDING_DIR/backend
TEMPLATES_DIR            // PROJECT_ROOT/.agent/markos/templates
MIR_TEMPLATES            // TEMPLATES_DIR/MIR
MSP_TEMPLATES            // TEMPLATES_DIR/MSP
CONFIG_PATH              // ONBOARDING_DIR/onboarding-config.json
SCHEMA_PATH              // ONBOARDING_DIR/onboarding-seed.schema.json
```

**Rule:** All backend components use these constants instead of hardcoded relative paths.

---

### Layer 12: Utilities & Helpers

**Utils** â€” `onboarding/backend/utils.cjs`

```javascript
readBody(req)              // Parse JSON from HTTP request body
json(res, statusCode, data) // Send JSON response with CORS headers
```

**Handlers** â€” `onboarding/backend/handlers.cjs`

Route handlers for all HTTP endpoints.

**Key Handlers:**
- `handleConfig()`: Returns config + environment status
- `handleStatus()`: Returns DB health + MIR gate status
- `handleSubmit()`: Main entry â€” triggers orchestrator
- `handleRegenerate()`: Re-runs single agent
- `handleApprove()`: Triggers write-mir.cjs
- `handleExtractSources()`: Scraper integration
- `handleExtractAndScore()`: Confidence scoring
- `handleGenerateQuestion()`: Gap-fill interview
- `handleSparkSuggestion()`: Creative sparkline
- `handleCompetitorDiscovery()`: Competitor enrichment

---

## Part 2: Protocol-Lore (Agent Navigation Layer)

All agents must read protocol-lore files in priority order before any task execution.

### Protocol Files

| File | Purpose | Max Read Depth | Audience |
|------|---------|----------------|----------|
| **QUICKSTART.md** | Mandatory boot entry. Commands, key files, cheat sheet. | Full | All agents, developers |
| **ARCHITECTURE.md** | Component interactions, MIR/MSP boundaries. | Full | System designers |
| **STATE.md** | Current milestone, active phases, tech debt status. | Full | Project managers |
| **CONVENTIONS.md** | Execution rules, development guidelines, hardening rules. | Full | Developers, agents |
| **TEAM.md** | Hybrid human+AI role topology, agent roster, lifecycle. | Full | Team leads, orchestrators |
| **TEMPLATES.md** | Token-efficient MIR/MSP/ITM template mapping. | Full | Context-limited agents |
| **WORKFLOWS.md** | Machine-readable execution loops (onboarding, defcon, vector). | Full | Orchestrators |
| **DEFCON.md** | Risk management, event-driven defensive layer, escalation. | Full | Crisis managers |
| **MEMORY.md** | Vector memory (Supabase + Upstash Vector) mechanics and RAG patterns. | Full | Data scientists |
| **CODEBASE-MAP.md** | Full XML directory tree with file annotations. | On-demand | Deep explorers |
| **INDEX.md** | Architecture map overview (condensed). | Full | Quick reference |

---

## Part 3: Data Models

### MIR (Marketing Intelligence Repository)

**Structure:** Dual-engine strategy â€” Lean Canvas (Physics) + JTBD (Psychology)

**Gate 1 (Core Identity):**
- `01_COMPANY/PROFILE.md`
- `01_COMPANY/MISSION-VISION-VALUES.md`
- `02_BRAND/VOICE-TONE.md` (partial)
- `03_MARKET/AUDIENCES.md`
- `04_PRODUCTS/FEATURES.md`

**Gate 2 (Expansion):**
- `05_CHANNELS/DISTRIBUTION.md`
- `06_TECH-STACK/OPERATIONS.md`

**File Organization:**
```
.markos-local/MIR/                    (client data â€” gitignored)
â”œâ”€â”€ Core_Strategy/
â”‚   â”œâ”€â”€ 01_COMPANY/
â”‚   â”‚   â”œâ”€â”€ PROFILE.md
â”‚   â”‚   â”œâ”€â”€ MISSION-VISION-VALUES.md
â”‚   â”‚   â””â”€â”€ LEAN-CANVAS.md
â”‚   â”œâ”€â”€ 02_BRAND/
â”‚   â”‚   â”œâ”€â”€ VOICE-TONE.md
â”‚   â”‚   â””â”€â”€ VISUAL-IDENTITY.md
â”‚   â””â”€â”€ 02_BUSINESS/
â”‚       â”œâ”€â”€ LEAN-CANVAS.md (Physics: what-who-how)
â”‚       â””â”€â”€ JTBD-MATRIX.md (Psychology: why-what-when)
â”œâ”€â”€ Market_Audiences/
â”‚   â”œâ”€â”€ 03_MARKET/
â”‚   â”‚   â”œâ”€â”€ AUDIENCES.md
â”‚   â”‚   â””â”€â”€ COMPETITIVE-LANDSCAPE.md
â”‚   â””â”€â”€ 04_PRODUCTS/
â”‚       â”œâ”€â”€ FEATURES.md
â”‚       â””â”€â”€ PRICING.md
â”œâ”€â”€ Campaigns_Assets/
â”‚   â””â”€â”€ 05_CHANNELS/
â”‚       â””â”€â”€ DISTRIBUTION.md
â””â”€â”€ STATE.md                        (Progress tracker)
```

### MSP (Marketing Strategy Plan)

**Structure:** Tactical execution blueprints anchored to historical winners.

**Discipline Breakdown:**

| Discipline | Top-Level Path | Sub-Disciplines | Generator |
|-----------|-----------------|-----------------|-----------|
| **Strategy** | `MSP/Strategy/` | Master Plan, Channel Strategy | `generateChannelStrategy()` |
| **Inbound** | `MSP/Inbound/` | Content Marketing, SEO, CRO | Human-driven |
| **Outbound** | `MSP/Outbound/` | Paid Ads, Email, PR, Product Marketing | Human-driven |
| **Social** | `MSP/Social/` | Social Media, Influencers, Partnerships | Human-driven |
| **Campaigns** | `MSP/Campaigns/` | Paid Acquisition, Organic, Lifecycle Email | `generatePaidAcquisition()` |
| **Community** | `MSP/Community_Events/` | Events, Community Programs | Human-driven |

**Winners Catalog Pattern:**
```
.markos-local/MSP/Campaigns/01_PAID_ACQUISITION/WINNERS/
â”œâ”€â”€ _CATALOG.md           (Anchor: High-performing campaigns)
â”œâ”€â”€ facebook-ad-1.txt
â”œâ”€â”€ google-ads-2.txt
â””â”€â”€ linkedin-campaign-3.txt
```

**Anchoring Rule:**
All specialized agents MUST read `.markos-local/MSP/<discipline>/WINNERS/_CATALOG.md` before generating new assets. This ensures tone consistency and prevents regressions.

### ITM (Issue Task Templates)

**Structure:** Pre-baked Linear.app tickets for common marketing jobs.

**Location:** `.agent/markos/templates/LINEAR-TASKS/`

**Naming Pattern:** `MARKOS-ITM-{CATEGORY}-{SEQUENCE}.md`

| Category | Prefix | Examples |
|----------|--------|----------|
| Content | CNT | MARKOS-ITM-CNT-01 (Lead Magnet), MARKOS-ITM-CNT-02 (Ad Copy) |
| Acquisition | ACQ | MARKOS-ITM-ACQ-01 (Paid Social), MARKOS-ITM-ACQ-03 (LinkedIn Outbound) |
| Tracking | TRK | MARKOS-ITM-TRK-01 (UTM Tracking) |
| Operations | OPS | MARKOS-ITM-OPS-01 (Campaign Launch) |
| Analysis | ANA | MARKOS-ITM-ANA-01 (Performance Review) |
| Strategy | STR | MARKOS-ITM-STR-01 (Audience Research) |

**Auto-Mapping:**
During `markos-linear-sync`, ITM tokens map onto Linear issues. Updated via webhook when campaign completes.

---

## Part 4: Agent Ecosystem

### Strategy & Planning Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **markos-onboarder** | `.agent/.../agents/markos-onboarder.md` | Seed JSON | Initial MIR/MSP scaffolds | Bootstraps project |
| **markos-strategist** | `.agent/.../agents/markos-strategist.md` | MIR data | Gate 1 & 2 validation | Enforces MIR requirements |
| **markos-campaign-architect** | `.agent/.../agents/markos-campaign-architect.md` | MSP doc | Channel selection matrix | Designs campaign structure |

### Execution & Implementation Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **markos-planner** | `.agent/.../agents/markos-planner.md` | MIR+MSP | `.planning/PLAN.md` (waved tasks) | Converts strategy â†’ tasks |
| **markos-task-synthesizer** | `.agent/.../agents/markos-task-synthesizer.md` | MSP + COMPETITIVE-LANDSCAPE | Mutated task list | Injects competitor-exploiting work |
| **markos-plan-checker** | `.agent/.../agents/markos-plan-checker.md` | PLAN.md | Audit report | Pre-execution validation gate |
| **markos-executor** | `.agent/.../agents/markos-executor.md` | PLAN.md | Executed tasks + git commits | Runs tasks atomically |

### Content & Creative Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **markos-content-brief** | `.agent/.../agents/markos-content-brief.md` | MIR (Audience+Brand) | Content constraints + brief | Sets content guardrails |
| **markos-copy-drafter** | `.agent/.../agents/markos-copy-drafter.md` | Brand Voice + Audience | Long/short-form copy | Generates marketing text |
| **markos-creative-director** | `.agent/.../agents/markos-creative-director.md` | Generated assets | Brand alignment audit | Validates tone/UX |
| **markos-content-creator** | `.agent/.../agents/markos-content-creator.md` | Brief + brand voice | Channel-specific content | Posts to platforms |

### Intelligence & Reconnaissance Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **markos-behavioral-scraper** | `.agent/.../agents/markos-behavioral-scraper.md` | Reddit/X/Discord URLs | Embedded sentiment vectors | Monitors live sentiment |
| **markos-competitive-monitor** | `.agent/.../agents/markos-competitive-monitor.md` | Competitor URLs | Threat alerts | Triggers DEFCON events |
| **markos-data-scientist** | `.agent/.../agents/markos-data-scientist.md` | Post-execution CAC/LTV | Pivot phase injection | Force-halts & redirects on anomalies |

### Verification & Audit Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **markos-neuro-auditor** | `.agent/.../agents/markos-neuro-auditor.md` | Generated content | 8-dimension audit (B01-B10) | Validates psychological triggers |
| **markos-gap-auditor** | `.agent/.../agents/markos-gap-auditor.md` | MIR data | Missing elements report | Identifies MIR incomplete sections |
| **markos-verifier** | `.agent/.../agents/markos-verifier.md` | Post-execution artifacts | 7-dimension Nyquist verification | Post-phase capability gate |

### Full Agent Roster

**Complete List** â€” 25+ agents in `.agent/markos/agents/`:

- markos-onboarder, markos-strategist, markos-campaign-architect
- markos-planner, markos-plan-checker, markos-executor, markos-task-synthesizer
- markos-content-brief, markos-copy-drafter, markos-creative-director, markos-content-creator
- markos-social-drafter, markos-email-sequence, markos-seo-planner, markos-cro-hypothesis
- markos-behavioral-scraper, markos-competitive-monitor, markos-market-researcher, markos-audience-intel
- markos-data-scientist, markos-performance-monitor, markos-funnel-analyst, markos-lead-scorer
- markos-neuro-auditor, markos-gap-auditor, markos-verifier
- markos-linear-manager, markos-calendar-builder, markos-budget-monitor, markos-tracking-spec
- markos-auditor, markos-analyst, markos-report-compiler, markos-context-loader, markos-librarian

---

## Part 5: API Surface

### HTTP Endpoints (Complete Reference)

**Base URL:** `http://localhost:4242`

#### GET / (Static Files)

**Purpose:** Serve onboarding UI

```http
GET /
GET /onboarding.js
GET /onboarding.css
GET /favicon.ico

Response: 200 text/html (or application/javascript, text/css)
```

#### GET /config

**Purpose:** Get environment configuration

```http
GET /config

Response: 200 application/json
{
  "port": 4242,
  "auto_open_browser": true,
  "vector_endpoint": "http://localhost:8000",
  "project_slug": "markos-client",
  "mir_output_path": null,
  "posthog_api_key": "phc_...",
  "posthog_host": "https://us.i.posthog.com"
}
```

#### GET /status

**Purpose:** Health check + MIR progress

```http
GET /status

Response: 200 application/json
{
  "Supabase \+ Upstash Vector": {
    "ok": true,
    "message": "Connected"
  },
  "mir": {
    "total": 12,
    "complete": 8,
    "gate1Ready": true  // â‰¥ 5 complete
  }
}
```

#### POST /submit

**Purpose:** Main entry â€” accept seed, trigger orchestrator, store drafts

```http
POST /submit
Content-Type: application/json

Request Body:
{
  "seed": {
    "company": {
      "name": "Acme Corp",
      "industry": "SaaS",
      "business_model": "B2B",
      ...
    },
    "product": { ... },
    "audience": { ... },
    "market": { ... },
    "competitive": { ... }
  },
  "project_slug": "acme-corp"  (optional)
}

Response: 200 application/json
{
  "success": true,
  "seed_path": "/workspaces/markos/onboarding/onboarding-seed.json",
  "slug": "acme-corp-abc123",
  "drafts": {
    "company_profile": "[AI-generated markdown]",
    "mission_values": "[AI-generated markdown]",
    "audience": "[AI-generated markdown]",
    "competitive": "[AI-generated markdown]",
    "brand_voice": "[AI-generated markdown]",
    "channel_strategy": "[AI-generated markdown]"
  },
  "vector": [
    { "success": true, "collection": "markos-acme-corp" }
  ],
  "errors": []
}
```

**Behavior:**
1. Generates deterministic project_slug from config or client seed
2. Writes .markos-project.json (one-time, never overwritten)
3. Writes onboarding-seed.json to disk
4. Calls `orchestrator.orchestrate(seed, slug)`
5. Returns drafts for UI review

#### POST /regenerate

**Purpose:** Re-run a single agent for one section

```http
POST /regenerate
Content-Type: application/json

Request Body:
{
  "section": "brand_voice",  // or any other draft section
  "seed": { ... },
  "slug": "acme-corp-abc123"
}

Response: 200 application/json
{
  "success": true,
  "section": "brand_voice",
  "text": "[NEW AI-generated markdown]"
}
```

**Available Sections:**
- `company_profile`, `mission_values`, `audience`, `competitive`, `brand_voice`, `channel_strategy`

#### POST /approve

**Purpose:** Persist approved drafts to `.markos-local/MIR/`

```http
POST /approve
Content-Type: application/json

Request Body:
{
  "slug": "acme-corp-abc123",
  "approvedDrafts": {
    "company_profile": "[approved markdown]",
    "mission_values": "[approved markdown]",
    ...
  }
}

Response: 200 application/json
{
  "success": true,
  "written": [
    "Core_Strategy/01_COMPANY/PROFILE.md",
    "Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md",
    ...
  ],
  "errors": []
}
```

**Side Effects:**
1. JIT-clones `.agent/.../templates/MIR/` â†’ `.markos-local/MIR/` (if needed)
2. Fuzzy-merges approved drafts into target files
3. Stamps STATE.md: rows marked `(complete)`
4. Writes disclaimer timestamp

#### POST /linear/sync

**Purpose:** Create Linear issues from ITM tokens and deterministic assignee mapping.

```http
POST /linear/sync
Content-Type: application/json

Request Body:
{
  "slug": "acme-corp",
  "phase": "29",
  "team": "MKT",
  "assignee_map": { "OPS": "ops@acme.com", "CNT": "content@acme.com" },
  "tasks": [
    {
      "token": "MARKOS-ITM-OPS-01",
      "variables": { "campaign_name": "Q2 Launch" }
    }
  ]
}

Response: 200 application/json
{
  "success": true,
  "team_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "created": [
    {
      "token": "MARKOS-ITM-OPS-01",
      "identifier": "MKT-101",
      "url": "https://linear.app/..."
    }
  ],
  "skipped": []
}
```

**Setup errors:** Returns `503` with an explicit code such as `LINEAR_API_KEY_MISSING` or `LINEAR_TEAM_NOT_CONFIGURED`.

#### POST /campaign/result

**Purpose:** Append campaign outcomes to winners catalogs and persist retrieval metadata.

```http
POST /campaign/result
Content-Type: application/json

Request Body:
{
  "slug": "acme-corp",
  "discipline": "Paid_Media",
  "asset": "META-AD-001",
  "metric": "CTR",
  "value": "4.2%",
  "outcome": "success",
  "notes": "Strong CTR against benchmark"
}

Response: 200 application/json
{
  "success": true,
  "catalog_path": ".markos-local/MSP/Paid_Media/WINNERS/_CATALOG.md",
  "metadata": {
    "type": "campaign_result",
    "discipline": "Paid_Media",
    "outcome_classification": "SUCCESS"
  }
}
```

**Validation:** Returns `400` with `VALIDATION_ERROR` if required keys are missing.

#### Rollout Reliability SLO Contract (Phase 31)

| Endpoint | Tier | Availability SLO (30d) | p95 Latency Target | Error Budget Rule |
|----------|------|-------------------------|--------------------|-------------------|
| `POST /submit` | `critical` | >= 99.5% | <= 1500ms (excluding external LLM latency) | Trigger operational review at 25% budget burn; freeze non-critical deploys when exhausted |
| `POST /approve` | `critical` | >= 99.9% | <= 900ms | Any persistence regression blocks rollout promotion |
| `POST /linear/sync` | `standard` | >= 99.0% | <= 1200ms (excluding Linear API latency) | Setup/auth failures are incident-grade and must fail explicitly |
| `POST /campaign/result` | `standard` | >= 99.5% | <= 800ms | Winners-catalog write failures block progression to next rollout gate |

Runtime emits a stable `rollout_endpoint_observed` event with:
- `endpoint`, `endpoint_tier`, `slo_target_availability`, `slo_target_p95_ms`
- `outcome_state`, `status_code`, `duration_ms`, `runtime_mode`, `project_slug_hash`

#### Migration Mode Contract (Phase 31)

- `MARKOS_ROLLOUT_MODE` is the single source of truth and supports only: `dry-run`, `dual-write`, `cloud-primary`.
- Promotion order is strict: `dry-run -> dual-write -> cloud-primary`.
- `dry_run=true`: deterministic artifact projection only, no persistence side effects.
- `dry_run=false`: replay-safe idempotent upsert using deterministic `artifact_id`, but promotion checks must pass first.
- Promotion to `dual-write` or `cloud-primary` requires an approved transition in `.planning/phases/31-rollout-hardening/31-MIGRATION-CHECKPOINTS.json` for the same `project_slug` and with rollback metadata.

#### Security, Compliance, and Retention Boundaries (Phase 31)

- Hosted wrappers require scoped Supabase bearer auth for `config_read`, `status_read`, and `migration_write` operations, and fail fast when `MARKOS_SUPABASE_AUD` is missing.
- Handler operations use a centralized `REQUIRED_SECRET_MATRIX` for `config_read`, `status_read`, `migration_write`, `linear_sync_write`, `submit_write`, `approve_write`, `campaign_result_write`, and `telemetry_write`.
- Hosted approve/write persistence to local disk is intentionally blocked (`LOCAL_PERSISTENCE_UNAVAILABLE`).
- Sensitive fields are redacted as `[REDACTED]` before telemetry and error-path logging.
- Fixed retention policy: `server_logs_days=14`, `rollout_reports_days=30`, `migration_checkpoint_days=90`.
- Compatibility retirement remains an operator decision documented in `.planning/phases/31-rollout-hardening/31-COMPATIBILITY-DECISIONS.json`; no hard minimum evidence threshold is required.

#### POST /api/extract-sources

**Purpose:** Scrape structured data from URL or files

```http
POST /api/extract-sources
Content-Type: multipart/form-data

Form Data:
  url: "https://example.com"         (optional)
  files: [File, File, ...]            (optional â€” PDF, DOCX, CSV, TXT)

Response: 200 application/json
{
  "success": true,
  "extractions": [
    {
      "source": "https://example.com",
      "title": "Acme Corp - Enterprise Software",
      "company": { ... },
      "products": [ ... ],
      "market_position": "..."
    }
  ]
}
```

#### POST /api/extract-and-score

**Purpose:** Rate quality of extracted data (Confidence: R/Y/G)

```http
POST /api/extract-and-score
Content-Type: application/json

Request Body:
{
  "extracted_data": {
    "company_name": "Acme Corp",
    "industry": "SaaS",
    "founded_year": "2015",
    ...
  }
}

Response: 200 application/json
{
  "success": true,
  "scores": {
    "company_name": { "rating": "G", "confidence": 0.95 },
    "industry": { "rating": "G", "confidence": 0.92 },
    "founded_year": { "rating": "Y", "confidence": 0.70 },
    "revenue": { "rating": "R", "confidence": 0.10 }
  },
  "gaps": ["revenue", "market_share", "customer_count"]
}
```

#### POST /api/generate-question

**Purpose:** AI gap-fill interview â€” ask follow-up for missing data

```http
POST /api/generate-question
Content-Type: application/json

Request Body:
{
  "missing_field": "revenue",
  "context": {
    "company_name": "Acme Corp",
    "industry": "SaaS",
    "employee_count": 150
  }
}

Response: 200 application/json
{
  "success": true,
  "question": "What's your annual recurring revenue (ARR) range?",
  "suggested_answers": ["$0-1M", "$1-5M", "$5-10M", "$10M+"]
}
```

#### POST /api/spark-suggestion

**Purpose:** AI sparkline suggestions for form field values

```http
POST /api/spark-suggestion
Content-Type: application/json

Request Body:
{
  "field": "tone_of_voice",
  "company_context": { ... }
}

Response: 200 application/json
{
  "success": true,
  "suggestions": [
    "Conversational and approachable",
    "Professional with a touch of humor",
    "Technical and authoritative",
    "Enthusiastic and energetic"
  ]
}
```

#### POST /api/competitor-discovery

**Purpose:** Discover competitors for the company

```http
POST /api/competitor-discovery
Content-Type: application/json

Request Body:
{
  "company_name": "Acme Corp",
  "industry": "SaaS",
  "market_segment": "Enterprise Data Analytics"
}

Response: 200 application/json
{
  "success": true,
  "direct_competitors": [
    { "name": "DataCorp Pro", "positioning": "..." },
    { "name": "AnalyticsX", "positioning": "..." }
  ],
  "indirect_competitors": [ ... ],
  "market_gaps": [ ... ]
}
```

### CORS & Options

**All endpoints return CORS headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**OPTIONS preflight:** Always returns 200.

---

## Part 6: Configuration & Environment

### Environment Variables

```bash
# LLM Provider Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
OLLAMA_ENDPOINT=http://localhost:11434  # Local fallback

# Supabase \+ Upstash Vector
UPSTASH_VECTOR_REST_URL=https://...            # Optional
UPSTASH_VECTOR_REST_TOKEN=sk-...               # Optional

# Telemetry
MARKOS_TELEMETRY=true|false               # Default: true
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://us.i.posthog.com

# Project Meta
PROJECT_NAME=MyCompany
PROJECT_URL=https://mycompany.com
```

### Configuration Files

**onboarding-config.json** â€” Server-level settings

```json
{
  "port": 4242,
  "auto_open_browser": true,
  "output_path": "../onboarding-seed.json",
  "vector_endpoint": "http://localhost:8000",
  "project_slug": "markos-client",
  "mir_output_path": null
}
```

**.markos-project.json** â€” Generated once, persistent

```json
{
  "project_slug": "acme-corp-abc123",
  "client_name": "Acme Corp",
  "installed_at": "2026-03-27T14:32:00Z"
}
```

---

## Part 7: Execution Sequences

### Onboarding Flow (v2.0)

```
1. Human runs: node onboarding/backend/server.cjs
2. bin/ensure-vector.cjs heartbeat â†’ Supabase \+ Upstash Vector ready
3. Server boots on port 4242 â†’ Auto-opens http://localhost:4242
4. Frontend loads: index.html + onboarding.js
5. User submits form â†’ POST /submit

   6a. Extract sources (Omni-Input Gate):
       - Scrape URL via Tavily API
       - Parse files (PDF, DOCX, CSV, TXT)
       - Score confidence (R/Y/G)
       - Gap-fill interview for low-confidence fields

   6b. Store raw seed in Supabase \+ Upstash Vector (Project slug autogenerated or provided)
   
   6c. Run orchestrator in parallel:
       - MIR generators (company, mission, audience, competitive)
       - MSP generators (brand_voice, channel_strategy)
       - Batch delays to avoid LLM rate limits (429s)
       - Retry logic: 3 attempts with exponential backoff
   
  6d. Store drafts in Supabase \+ Upstash Vector: markos-{slug} collection
   
   6e. Return drafts to frontend for review

7. UI displays drafts with regenerate options
8. User approves â†’ POST /approve

  9a. JIT-clone: .agent/.../templates/MIR/ â†’ .markos-local/MIR/
   9b. Fuzzy-merge approved drafts into MIR files
   9c. Stamp STATE.md: mark rows as (complete)
  9d. Write .markos-install-manifest.json

10. Project ready for execution phase
```

### Supabase \+ Upstash Vector Boot Sequence

```
1. bin/ensure-vector.cjs called
2. Check UPSTASH_VECTOR_REST_URL in .env
   â†’ If set: use cloud, return True
3. Ping localhost:8000/api/v1/heartbeat (500ms timeout)
   â†’ If alive: return True
4. If dead:
   â†’ Spawn: python -m Supabase \+ Upstash Vector.cli.cli run (detached, unref'd)
   â†’ Wait 2s for daemon readiness
   â†’ Ping again â†’ return True
5. Resolve promise
```

### Draft Generation Retry Strategy

```
For each generator (company_profile, mission_values, etc.):

  Attempt 1:
    â†’ Call llm-adapter
    â†’ Success? Return result
    â†’ Failure? Check if retryable (not auth error)
    â†’ If retryable: wait 1.5s â†’ Attempt 2
    â†’ If not retryable: return { ok: false, text: "[DRAFT UNAVAILABLE]" }

  Attempt 2:
    â†’ Call llm-adapter
    â†’ Wait 3s on failure
    â†’ Attempt 3

  Attempt 3:
    â†’ Call llm-adapter
    â†’ If failure: return fallback response

Fallback Response:
  {
    ok: false,
    text: "[DRAFT UNAVAILABLE â€” {error_message}]",
    isFallback: true
  }

Telemetry captured at start + end (or on failure).
```

---

## Part 8: Directory Structure Reference

```
/workspaces/markos/
â”œâ”€â”€ bin/
â”‚   â”œâ”€â”€ install.cjs              â† First-run installer
â”‚   â”œâ”€â”€ update.cjs               â† Idempotent updater
â”‚   â””â”€â”€ ensure-vector.cjs        â† Supabase \+ Upstash Vector daemon auto-healer
â”œâ”€â”€ onboarding/
â”‚   â”œâ”€â”€ index.html               â† UI entry point
â”‚   â”œâ”€â”€ onboarding.js            â† UI logic (form handling, polling)
â”‚   â”œâ”€â”€ onboarding.css           â† UI styles
â”‚   â”œâ”€â”€ onboarding-seed.schema.json  â† Input validation schema
â”‚   â”œâ”€â”€ onboarding-config.json   â† Server config
â”‚   â””â”€â”€ backend/
â”‚       â”œâ”€â”€ server.cjs           â† HTTP server (port 4242)
â”‚       â”œâ”€â”€ handlers.cjs         â† Route handlers
â”‚       â”œâ”€â”€ write-mir.cjs        â† Draft persistence layer
â”‚       â”œâ”€â”€ vector-store-client.cjs    â† Vector DB HTTP wrapper
â”‚       â”œâ”€â”€ path-constants.cjs   â† Central path authority
â”‚       â”œâ”€â”€ utils.cjs            â† Shared utilities
â”‚       â”œâ”€â”€ agents/
â”‚       â”‚   â”œâ”€â”€ orchestrator.cjs    â† Parallel draft generation
â”‚       â”‚   â”œâ”€â”€ mir-filler.cjs      â† MIR generators (4 functions)
â”‚       â”‚   â”œâ”€â”€ msp-filler.cjs      â† MSP generators (3 functions)
â”‚       â”‚   â”œâ”€â”€ llm-adapter.cjs     â† Multi-model LLM wrapper
â”‚       â”‚   â”œâ”€â”€ example-resolver.cjs â† Template context injection
â”‚       â”‚   â””â”€â”€ telemetry.cjs       â† PostHog event tracking
â”‚       â”œâ”€â”€ confidences/
â”‚       â”‚   â””â”€â”€ confidence-scorer.cjs â† Quality rater (R/Y/G)
â”‚       â”œâ”€â”€ enrichers/
â”‚       â”‚   â””â”€â”€ competitor-enricher.cjs â† Competitor discovery
â”‚       â”œâ”€â”€ parsers/
â”‚       â”‚   â”œâ”€â”€ pdf-parser.cjs
â”‚       â”‚   â”œâ”€â”€ docx-parser.cjs
â”‚       â”‚   â”œâ”€â”€ csv-parser.cjs
â”‚       â”‚   â””â”€â”€ text-parser.cjs
â”‚       â”œâ”€â”€ scrapers/
â”‚       â”‚   â””â”€â”€ tavily-scraper.cjs  â† Web scraper (LLM-powered)
â”‚       â”œâ”€â”€ extractors/
â”‚       â”‚   â””â”€â”€ schema-extractor.cjs â† Schema validation
â”‚       â””â”€â”€ prompts/
â”‚           â”œâ”€â”€ extraction-prompt.js
â”‚           â”œâ”€â”€ enrichment-prompt.js
â”‚           â”œâ”€â”€ grouping-prompt.js
â”‚           â”œâ”€â”€ spark-prompt.js
â”‚           â””â”€â”€ partial-extraction-prompt.js
â”œâ”€â”€ .agent/
â”‚   â”œâ”€â”€ markos/     â† MarkOS protocol engine (version-controlled)
â”‚   â”‚   â”œâ”€â”€ VERSION
â”‚   â”‚   â”œâ”€â”€ MARKOS-INDEX.md
â”‚   â”‚   â”œâ”€â”€ agents/                  â† 25+ specialized agent definitions
â”‚   â”‚   â”‚   â”œâ”€â”€ markos-onboarder.md
â”‚   â”‚   â”‚   â”œâ”€â”€ markos-strategist.md
â”‚   â”‚   â”‚   â”œâ”€â”€ markos-campaign-architect.md
â”‚   â”‚   â”‚   â”œâ”€â”€ ... (22 more)
â”‚   â”‚   â”‚   â””â”€â”€ markos-verifier.md
â”‚   â”‚   â”œâ”€â”€ templates/               â† Base templates (never write client data here)
â”‚   â”‚   â”‚   â”œâ”€â”€ MIR/                â† Marketing Intelligence templates
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Core_Strategy/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 01_COMPANY/
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ PROFILE.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ MISSION-VISION-VALUES.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ LEAN-CANVAS.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 02_BRAND/
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ VOICE-TONE.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ VISUAL-IDENTITY.md
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ 02_BUSINESS/
â”‚   â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ LEAN-CANVAS.md
â”‚   â”‚   â”‚   â”‚   â”‚       â””â”€â”€ JTBD-MATRIX.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Market_Audiences/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 03_MARKET/
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ AUDIENCES.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ COMPETITIVE-LANDSCAPE.md
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ 04_PRODUCTS/
â”‚   â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ FEATURES.md
â”‚   â”‚   â”‚   â”‚   â”‚       â””â”€â”€ PRICING.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Campaigns_Assets/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ 05_CHANNELS/
â”‚   â”‚   â”‚   â”‚   â”‚       â””â”€â”€ DISTRIBUTION.md
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ STATE.md
â”‚   â”‚   â”‚   â”œâ”€â”€ MSP/                â† Marketing Strategy Plan templates
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Strategy/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 00_MASTER-PLAN/
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ CHANNEL-STRATEGY.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ STRATEGIC-GOALS.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ BUDGET-ALLOCATION.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ MARKETING-PLAN.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ _CHANNEL-STRATEGY-saas.example.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ _CHANNEL-STRATEGY-b2b.example.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ ... (5+ more by business model)
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ 01_STRATEGY.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Inbound/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Outbound/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Social/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Campaigns/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 01_PAID_ACQUISITION.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ _PAID-ACQUISITION-*.example.md (7+ models)
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 02_SEO_ORGANIC.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 03_LIFECYCLE_EMAIL.md
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ 04_CONTENT_SOCIAL.md
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ 05_AFFILIATE_INFLUENCER.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Paid_Media/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Lifecycle_Email/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Community_Events/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ SETUP.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ README.md
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ STATE.md
â”‚   â”‚   â”‚   â”œâ”€â”€ LINEAR-TASKS/        â† Pre-baked Linear.app ticket templates
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ MARKOS-ITM-CNT-01-lead-magnet.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ MARKOS-ITM-CNT-02-ad-copy.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ MARKOS-ITM-ACQ-01-paid-social-setup.md
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ ... (20+ more)
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ _SCHEMA.md
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ README.md
â”‚   â”‚   â”‚   â””â”€â”€ local-override/     â† Template for .markos-local/
â”‚   â”‚   â”‚       â”œâ”€â”€ .gitignore
â”‚   â”‚   â”‚       â”œâ”€â”€ MIR/
â”‚   â”‚   â”‚       â”œâ”€â”€ MSP/
â”‚   â”‚   â”‚       â””â”€â”€ config/
â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”‚   â”œâ”€â”€ pre-push
â”‚   â”‚   â”‚   â”œâ”€â”€ post-execution-sync.md
â”‚   â”‚   â”‚   â””â”€â”€ pre-campaign-check.md
â”‚   â”‚   â””â”€â”€ bin/
â”‚   â”‚       â””â”€â”€ lib/
â”‚   â”‚           â”œâ”€â”€ core.cjs
â”‚   â”‚           â”œâ”€â”€ config.cjs
â”‚   â”‚           â”œâ”€â”€ commands.cjs
â”‚   â”‚           â””â”€â”€ security.cjs
â”‚   â””â”€â”€ get-shit-done/              â† GSD protocol (separate repo)
â”œâ”€â”€ .protocol-lore/
â”‚   â”œâ”€â”€ QUICKSTART.md               â† Mandatory boot entry point
â”‚   â”œâ”€â”€ ARCHITECTURE.md             â† System design
â”‚   â”œâ”€â”€ STATE.md                    â† Project state + tech debt
â”‚   â”œâ”€â”€ CONVENTIONS.md              â† Execution rules + hardening
â”‚   â”œâ”€â”€ TEAM.md                     â† Agent roster + topology
â”‚   â”œâ”€â”€ TEMPLATES.md                â† Template mapping (token-efficient)
â”‚   â”œâ”€â”€ WORKFLOWS.md                â† Execution loops (onboarding, defcon, vector)
â”‚   â”œâ”€â”€ DEFCON.md                   â† Risk management + escalation
â”‚   â”œâ”€â”€ MEMORY.md                   â† Vector memory mechanics
â”‚   â”œâ”€â”€ CODEBASE-MAP.md             â† Full XML directory tree
â”‚   â””â”€â”€ INDEX.md                    â† Condensed overview
â”œâ”€â”€ .markos-local/                    â† Client override layer (gitignored)
â”‚   â”œâ”€â”€ .gitignore
â”‚   â”œâ”€â”€ MIR/                        â† Client MIR data
â”‚   â”œâ”€â”€ MSP/                        â† Client MSP data
â”‚   â”‚   â””â”€â”€ Campaigns/01_PAID_ACQUISITION/WINNERS/
â”‚   â”‚       â””â”€â”€ _CATALOG.md         â† Historical high-performers
â”‚   â””â”€â”€ config/
â”œâ”€â”€ .markos-project.json              â† Project metadata (written once)
â”œâ”€â”€ .markos-install-manifest.json     â† Installation markers
â”œâ”€â”€ .env                            â† Environment variables (gitignored)
â”œâ”€â”€ .env.example                    â† Example environment
â”œâ”€â”€ .markos-logs/
â”‚   â””â”€â”€ vector-daemon.log           â† Supabase \+ Upstash Vector daemon output
â”œâ”€â”€ test/
â”‚   â”œâ”€â”€ install.test.js
â”‚   â”œâ”€â”€ update.test.js
â”‚   â”œâ”€â”€ onboarding-server.test.js
â”‚   â”œâ”€â”€ protocol.test.js
â”‚   â”œâ”€â”€ write-mir.test.js
â”‚   â””â”€â”€ example-resolver.test.js
â”œâ”€â”€ package.json
â”œâ”€â”€ README.md
â”œâ”€â”€ CHANGELOG.md
â”œâ”€â”€ LICENSE
â””â”€â”€ VERSION
```

---

## Part 9: Quality Patterns & Error Handling

### Resilience Mechanisms

**Supabase \+ Upstash Vector Auto-Healing:**
- Every agent calls `bin/ensure-vector.cjs` before vector ops
- Daemon auto-revives if dead (2s readiness check)
- Cloud override: if UPSTASH_VECTOR_REST_URL set, skips local entirely

**LLM Provider Fallback:**
1. Try ANTHROPIC_API_KEY
2. Try OPENAI_API_KEY
3. Try GEMINI_API_KEY
4. Try OLLAMA_ENDPOINT
5. Return deterministic fallback template

**Retry Logic:**
- 3 attempts with exponential backoff (1.5s, 3s, 6s)
- Non-retryable errors fast-fail (auth, invalid API key)
- Transient failures (429 rate limits) retry

**Data Safety:**
- .markos-local/ is gitignored â€” client data never committed
- Base templates are read-only in `.agent/templates/`
- JIT-cloning prevents data loss during upgrades
- Fuzzy-merge header-matching prevents overwrites

### Error Handling Patterns

| Scenario | Handler | Response |
|----------|---------|----------|
| Supabase \+ Upstash Vector dead | `ensure-vector.cjs` | Spawn daemon + 2s wait |
| LLM API key missing | `llm-adapter.cjs` | Throw "API_KEY is not set" |
| No LLM providers available | `fallback response` | `"[DRAFT UNAVAILABLE]"` + isFallback flag |
| Template file missing | `write-mir.cjs` | Create dir + write file |
| Invalid seed JSON | `orchestrator` | Return error in response |
| Vector Store connection failed | `server.cjs /status` | Return `{ ok: false, error }` |
| File parse error (PDF/DOCX) | `handlers onExtract` | Log error, continue with partial data |

---

## Part 10: MarkOSDB Migration Contracts (Phase 30)

### Canonical Contract Layers

| Layer | Canonical Store | Contract Source | Notes |
|------|------------------|-----------------|-------|
| Relational truth | Supabase (`markos_projects`, `markos_artifacts`, `markos_campaign_outcomes`, `markos_sync_checkpoints`) | `onboarding/backend/markosdb-contracts.cjs` | Project-scoped keys and RLS-ready ownership boundaries |
| Vector retrieval | Upstash metadata schema (`slug`, `discipline`, `outcome`, `source_path`, `checksum_sha256`, `schema_version`) | `onboarding/backend/markosdb-contracts.cjs` | Metadata shape normalized before persistence |
| Compatibility state | `.markos-local/` + `.markos-local/` | `onboarding/backend/handlers.cjs` migration job | Source of truth during v2.2 staged rollout |

### Namespace and Read-Order Contract

- Canonical write prefix: `MARKOS_VECTOR_PREFIX` (default fallback: `markos`).
- Compatibility read order: canonical prefix, then `markos`, then `markos`.
- Collection projections:
  - Drafts: `{prefix}-{project_slug}-drafts`
  - Metadata: `{prefix}-{project_slug}-meta`
  - Phase 30 migration projection: `{prefix}-{project_slug}-markosdb`

### Local-to-Cloud Ingestion Job

- Endpoint: `POST /migrate/local-to-cloud`
- Handler: `handleMarkosdbMigration`
- Behavior:
  - Scans markdown artifacts under compatibility roots (`MIR/**`, `MSP/**`)
  - Computes deterministic SHA-256 checksums
  - Builds relational and vector contract objects per artifact
  - Supports `dry_run` for deterministic preview without persistence
  - Uses deterministic `artifact_id` (`{project_slug}:{relative_path}`) for replay-safe upserts

### Hosted Auth/RLS Boundary

- Hosted API wrappers now enforce Supabase bearer token checks:
  - `api/config.js` (`config_read`)
  - `api/status.js` (`status_read`)
  - `api/migrate.js` (`migration_write`)
- Authorization policy:
  - Requires bearer token in hosted mode
  - Requires `sub` claim and audience match (`authenticated` by default)
  - Enforces project scoping via `app_metadata.project_slugs` / `user_metadata.project_slugs`
  - Allows service-role tokens for operator workflows
- Status/config payloads expose `markosdb.access_matrix` and authenticated principal context for auditability.

---

## Part 10: Testing & Verification

### Test Files

| Test | Location | Coverage |
|------|----------|----------|
| Install flow | `test/install.test.js` | Template copying, GSD detection |
| Update flow | `test/update.test.js` | Manifest verification, SHA256 checks |
| Onboarding server | `test/onboarding-server.test.js` | HTTP endpoints, seed validation |
| Protocol integrity | `test/protocol.test.js` | .protocol-lore/ file validation |
| Write-mir | `test/write-mir.test.js` | Template cloning, fuzzy-merge |
| Example resolver | `test/example-resolver.test.js` | Business model â†’ example mapping |

**Run Tests:**
```bash
node --test test/
node --test test/onboarding-server.test.js
```

---

## Part 11: Known Limitations & Roadmap

### Current Constraints

| Constraint | Impact | Workaround |
|-----------|--------|-----------|
| Supabase \+ Upstash Vector local daemon disk space | Vector DB size â†’ local storage limits | Use UPSTASH_VECTOR_REST_URL for unlimited scale |
| LLM token limits (per request) | Long MIR context â†’ truncation | Increase max_tokens in config |
| Concurrent /submit requests | Single orchestrator instance | Deploy server.cjs with load balancer |
| File upload size | formidable 100MB default | Configure in server.cjs |

### Future Enhancements (v1.2+)

1. **Multi-language support** for generated content
2. **Streaming responses** for long draft generation
3. **Webhook integrations** with Linear, Slack, Salesforce
4. **Real-time collaboration** on MIR/MSP edits
5. **Advanced RAG** with source attribution in drafts

---

## Summary

This TECH-MAP documents every major system in MarkOS:

- **Layers 1-5**: Installation, onboarding engine, orchestration, LLM adapters, draft generators
- **Layers 6-12**: Vector memory, persistence, configuration, remote services, utilities
- **API Surface**: 11 HTTP endpoints with full contracts
- **Agent Ecosystem**: 25+ specialized agents for strategy, execution, content, intelligence, verification
- **Data Models**: MIR (intelligence), MSP (strategy), ITM (tasks)
- **Execution Sequences**: Onboarding flow, Supabase \+ Upstash Vector boot, retry strategies
- **Directory Structure**: Complete file organization with purposes
- **Error Handling**: Resilience, fallback, retry patterns

All file paths are annotated with their roles. This document is the source of truth for technical implementation.

---

*Document Version: 1.0*  
*Last Updated: March 27, 2026*  
*Maintainer: MarkOS Protocol Team*


