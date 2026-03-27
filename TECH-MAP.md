# MGSD Technical Architecture Map

**Last Updated:** March 27, 2026  
**Version:** 1.1.0  
**Status:** Production-Ready  

---

## Executive Overview

The Marketing Get Shit Done (MGSD) protocol is a complete **agentic marketing execution system** that installs alongside GSD for unified AI-powered development + marketing teams. It provides:

- **MIR** (Marketing Intelligence Repository): Ground-truth brand, audience, and product data
- **MSP** (Marketing Strategy Plan): Tactical blueprints for all marketing channels
- **ITM** (Issue Task Templates): Pre-built Linear.app tickets for common marketing jobs
- **Agent Ecosystem**: 25+ specialized AI agents for strategy, execution, and verification
- **Onboarding Engine**: Web-based form → AI draft generation → ChromaDB persistence
- **Vector Memory**: Per-project ChromaDB collections for episodic learning and RAG

---

## Part 1: System Architecture Layers

### Layer 1: Entry Points & Installation

**CLI Binaries** — First-run installation and updates

| Component | Location | Purpose | Key Exports |
|-----------|----------|---------|-------------|
| **install.cjs** | `bin/install.cjs` | First-run interactive installer. Prompts user, detects GSD coexistence, copies templates, delegates ChromaDB boot. | `run()` → calls `update.cjs` or boots protocol |
| **update.cjs** | `bin/update.cjs` | SHA256-idempotent updater. Preserves user patches in `.mgsd-local/`. Overrides base templates only. | Patches manifest, verifies integrity |
| **ensure-chroma.cjs** | `bin/ensure-chroma.cjs` | Auto-healing ChromaDB daemon. Pings localhost:8000, revives process if dead, or delegates to cloud. | `ensureChroma()` → Promise<boolean> |

**Installation Flow:**
```
1. npm install -g marketing-get-shit-done
2. npx marketing-get-shit-done install
3. bin/install.cjs detects GSD, prompts scope (project/global)
4. Copies .agent/marketing-get-shit-done/templates/ → target
5. Calls bin/ensure-chroma.cjs to boot local DB
6. Writes .mgsd-install-manifest.json (idempotent marker)
```

---

### Layer 2: Onboarding Engine (Smart Onboarding v2.0)

**Purpose:** Convert unstructured company data (URLs, PDFs, docs) → AI-approved MIR/MSP drafts

**HTTP Server** — `onboarding/backend/server.cjs`

Serves the web form UI and orchestrates AI draft generation.

| Endpoint | Method | Handler | Purpose |
|----------|--------|---------|---------|
| `/` | GET | Static file serve | Serves `index.html` + onboarding UI |
| `/config` | GET | `handleConfig()` | Returns environment config, port, chroma_host |
| `/status` | GET | `handleStatus()` | Returns ChromaDB health + MIR completion gates |
| `/submit` | POST | `handleSubmit()` | **Core entry:** Accepts seed JSON, triggers orchestrator, stores drafts to Chroma |
| `/regenerate` | POST | `handleRegenerate()` | Re-runs a single agent for a specific section (e.g., "brand_voice") |
| `/approve` | POST | `handleApprove()` | JIT-clones templates, writes approved drafts to `.mgsd-local/`, stamps STATE.md |
| `/api/extract-sources` | POST | `handleExtractSources()` | Tavily API scraper: extracts structured data from URLs/files |
| `/api/extract-and-score` | POST | `handleExtractAndScore()` | Confidence scorer: rates quality of extracted data (R/Y/G) |
| `/api/generate-question` | POST | `handleGenerateQuestion()` | Gap-fill interview: generates follow-up questions for missing data |
| `/api/spark-suggestion` | POST | `handleSparkSuggestion()` | AI sparkline: generates creative suggestions for fields |

**Boot Sequence:**
```
1. Load .env from PROJECT_ROOT
2. Load onboarding-config.json (or defaults)
3. Configure chroma-client.cjs with CHROMA_CLOUD_URL or localhost:8000
4. Call bin/ensure-chroma.cjs (guarantee DB is alive)
5. Listen on port 4242 (auto-fallback if in use)
6. Auto-open browser if config.auto_open_browser = true
```

**Configuration** — `onboarding-config.json`

```json
{
  "port": 4242,
  "auto_open_browser": true,
  "chroma_host": "http://localhost:8000",
  "project_slug": "mgsd-client",
  "mir_output_path": null,  // defaults to .mgsd-local/MIR
  "posthog_api_key": "phc_XYZ",
  "posthog_host": "https://us.i.posthog.com"
}
```

---

### Layer 3: AI Orchestration & Draft Generation

**Orchestrator** — `onboarding/backend/agents/orchestrator.cjs`

Coordinates parallel execution of all LLM-based draft generators and persists results.

**Execution Flow:**
```
1. Store raw seed in ChromaDB (RAG retrieval source)
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
6. Store each draft in ChromaDB under mgsd-{slug} collection
7. Return: { drafts, chromaResults, errors }
```

**Interface:**
```javascript
// onboarding/backend/agents/orchestrator.cjs
orchestrate(seed, slug) 
  → Promise<{
      drafts: {
        company_profile: string,
        mission_values: string,
        audience: string,
        competitive: string,
        brand_voice: string,
        channel_strategy: string
      },
      chromaResults: array,
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

**LLM Adapter** — `onboarding/backend/agents/llm-adapter.cjs`

Unified interface for OpenAI, Anthropic, Gemini, and Ollama.

**Provider Priority (auto-detected):**
1. `options.provider` — explicit override per call
2. `ANTHROPIC_API_KEY` → Claude 3.5 Haiku (default model: `claude-3-5-haiku-20241022`)
3. `OPENAI_API_KEY` → GPT-4o-mini (uses OpenAI SDK)
4. `GEMINI_API_KEY` → Gemini 2.5 Flash (native fetch)
5. `OLLAMA_ENDPOINT` → Local Ollama (fallback)

**Interface:**
```javascript
// onboarding/backend/agents/llm-adapter.cjs
call(systemPrompt, userPrompt, options = {})
  → Promise<{
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

#### MIR Filler — `onboarding/backend/agents/mir-filler.cjs`

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
5. If data missing: write "[REQUIRES HUMAN INPUT — describe]".
6. Never output JSON — output markdown content only.
```

**Input Schema** — `onboarding/onboarding-seed.schema.json`

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

#### MSP Filler — `onboarding/backend/agents/msp-filler.cjs`

Generates Marketing Strategy Plan drafts (tactical execution blueprints).

**Generators:**

| Function | Output File | Purpose |
|----------|-------------|---------|
| `generateBrandVoice()` | `Core_Strategy/02_BRAND/VOICE-TONE.md` | Brand voice dimensions, do/don't language, tone calibration by context |
| `generateChannelStrategy()` | `MSP/Strategy/00_MASTER-PLAN/CHANNEL-STRATEGY.md` | Channel priority ranking, audience behavior → channel fit, budget allocation |
| `generatePaidAcquisition()` | `MSP/Campaigns/01_PAID_ACQUISITION.md` | Paid media channels (social, search, display), targeting strategies, CPA targets |

**Input** — Same seed + resolveExample() pattern:
- Reads `.agent/.../templates/MSP/Strategy/_CHANNEL-STRATEGY-{business_model}.example.md`
- Uses as context anchor for LLM generation
- Ensures output matches known-good structure

---

### Layer 6: Vector Memory & RAG

**ChromaDB Client** — `onboarding/backend/chroma-client.cjs`

HTTP wrapper for ChromaDB vector storage.

**Collection Naming:**
```
mgsd-{project_slug}

Example: mgsd-acme-corp
Collection isolation ensures multi-tenant safety.
```

**Interface:**
```javascript
configure(host)                        // Set chromaHost at boot
healthCheck()                          // → { ok: true/false, error?: string }
storeDraft(slug, section, text, meta)  // Store draft with metadata
getDrafts(slug)                        // → { section: text, ... }
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
CHROMA_CLOUD_URL=https://...        # e.g., Hosted ChromaDB
CHROMA_CLOUD_TOKEN=sk-...           # Auth token if required
```

If CHROMA_CLOUD_URL is set, local daemon is skipped entirely.

---

### Layer 7: Persistence & State Management

**Write-MIR** — `onboarding/backend/write-mir.cjs`

Converts approved AI drafts → persistent MIR files in `.mgsd-local/`.

**Workflow:**
1. **JIT-Clone**: If `.mgsd-local/MIR/` missing, copies entire `.agent/.../templates/MIR/` structure
2. **Fuzzy Merge**: Uses header-matching regex to inject draft content into existing templates
3. **Fallback Append**: If no standard headers found, appends raw text with disclaimer
4. **STATE.md Stamping**: Scans STATE.md and updates rows from `(empty)` → `(complete)`

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
> 🤖 **Generated by MGSD AI** on `2026-03-27`
<!-- status: complete -->
<!-- source: onboarding-agent -->
```

**Interface:**
```javascript
applyDrafts(slug, drafts, mirPath) 
  → Promise<{ written: string[], errors: string[] }>
```

---

### Layer 8: Project Configuration & State

**Project Manifest** — `.mgsd-project.json`

Written **once** on first `POST /submit`. Never regenerated.

```json
{
  "project_slug": "acme-corp-abc123",
  "client_name": "Acme Corp",
  "installed_at": "2026-03-27T14:32:00Z",
  "chroma_namespace": "mgsd-acme-corp-abc123"
}
```

**Override Layer** — `.mgsd-local/`

Client-specific data. Gitignored. NEVER committed.

```
.mgsd-local/
├── .gitignore                    # /MIR, /MSP, /config
├── MIR/                          # Client MIR overrides
│   ├── Core_Strategy/
│   ├── Market_Audiences/
│   └── Products/
├── MSP/                          # Client MSP execution plans
│   ├── Strategy/
│   ├── Campaigns/
│   ├── Social/
│   ├── Outbound/
│   └── Inbound/
└── config/                       # Local config overrides
    └── .env.local
```

**Resolution Order:**
1. Check `.mgsd-local/{path}`
2. If exists: use it + log `[override]`
3. If missing: fallback to `.agent/templates/{path}`

---

### Layer 9: Supporting Services

#### File Parsers — `onboarding/backend/parsers/`

Converts non-text formats → structured data for seed ingestion.

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

#### Scrapers — `onboarding/backend/scrapers/`

Extracts structured company data from live sources.

**Tavily Scraper** — `tavily-scraper.cjs`

```javascript
scrape(url) → Promise<{
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

#### Confidence Scorer — `onboarding/backend/confidences/confidence-scorer.cjs`

Rates quality of extracted/provided data.

**Rating System:**
- **🟢 Green**: High confidence (sourced, verified, complete)
- **🟡 Yellow**: Medium confidence (inferred, partial, reasonable)
- **🔴 Red**: Low confidence (missing, ambiguous, placeholder)

**Usage:**
```
POST /api/extract-and-score
→ Rates each extracted field → Triggers gap-fill interview
```

#### Enrichers — `onboarding/backend/enrichers/`

Fills gaps in extracted data through secondary sources.

**Competitor Enricher** — `competitor-enricher.cjs`

```javascript
discoverCompetitors(company_name, industry) 
  → Promise<{
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

#### Telemetry — `onboarding/backend/agents/telemetry.cjs`

Captures usage metrics via PostHog.

**Events Captured:**
- `agent_execution_started`: { agent_name, project_slug }
- `agent_execution_completed`: { agent_name, token_usage, generation_time_ms }
- `form_submission`: { client_name, business_model }
- `draft_approved`: { section, char_count }

**Control:**
```env
MGSD_TELEMETRY=false              # Disable all telemetry
POSTHOG_API_KEY=phc_...           # PostHog project key
POSTHOG_HOST=https://...          # PostHog instance URL
```

---

### Layer 10: Example Resolution & Context Injection

**Example Resolver** — `onboarding/backend/agents/example-resolver.cjs`

Injects example context into LLM prompts for better outputs.

**Pattern:**
```javascript
resolveExample(templateName, businessModel, templateSubdir, basePath)
  → string (markdown block from examples)
```

**Template Logic:**
- For `business_model = "SaaS"`: loads `.../templates/MSP/Strategy/_CHANNEL-STRATEGY-saas.example.md`
- For `business_model = "B2B"`: loads `.../templates/MSP/Strategy/_CHANNEL-STRATEGY-b2b.example.md`
- Fallback: uses generic template

**Directory Structure:**
```
.agent/marketing-get-shit-done/templates/
├── MSP/Strategy/
│   ├── _CHANNEL-STRATEGY-saas.example.md
│   ├── _CHANNEL-STRATEGY-b2b.example.md
│   ├── _CHANNEL-STRATEGY-b2c.example.md
│   ├── _CHANNEL-STRATEGY-marketplace.example.md
│   └── ... (6+ more)
├── MSP/Campaigns/
│   ├── _PAID-ACQUISITION-saas.example.md
│   └── ... (6+ more)
└── MIR/
    └── (templated similarly)
```

**Usage in mir-filler.cjs & msp-filler.cjs:**
```javascript
const exampleBlock = resolveExample('BRAND-VOICE', company.business_model, '', CORE_STRAT_DIR);
const prompt = `[...] ${exampleBlock} Write:[...]`;
```

---

### Layer 11: Path Resolution & Central Authority

**Path Constants** — `onboarding/backend/path-constants.cjs`

Centralized path resolution to prevent "dot-hell" bugs.

```javascript
PROJECT_ROOT              // /workspaces/mgsd
ONBOARDING_DIR           // PROJECT_ROOT/onboarding
BACKEND_DIR              // ONBOARDING_DIR/backend
TEMPLATES_DIR            // PROJECT_ROOT/.agent/marketing-get-shit-done/templates
MIR_TEMPLATES            // TEMPLATES_DIR/MIR
MSP_TEMPLATES            // TEMPLATES_DIR/MSP
CONFIG_PATH              // ONBOARDING_DIR/onboarding-config.json
SCHEMA_PATH              // ONBOARDING_DIR/onboarding-seed.schema.json
```

**Rule:** All backend components use these constants instead of hardcoded relative paths.

---

### Layer 12: Utilities & Helpers

**Utils** — `onboarding/backend/utils.cjs`

```javascript
readBody(req)              // Parse JSON from HTTP request body
json(res, statusCode, data) // Send JSON response with CORS headers
```

**Handlers** — `onboarding/backend/handlers.cjs`

Route handlers for all HTTP endpoints.

**Key Handlers:**
- `handleConfig()`: Returns config + environment status
- `handleStatus()`: Returns DB health + MIR gate status
- `handleSubmit()`: Main entry — triggers orchestrator
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
| **WORKFLOWS.md** | Machine-readable execution loops (onboarding, defcon, chroma). | Full | Orchestrators |
| **DEFCON.md** | Risk management, event-driven defensive layer, escalation. | Full | Crisis managers |
| **MEMORY.md** | Vector memory (Chroma DB) mechanics and RAG patterns. | Full | Data scientists |
| **CODEBASE-MAP.md** | Full XML directory tree with file annotations. | On-demand | Deep explorers |
| **INDEX.md** | Architecture map overview (condensed). | Full | Quick reference |

---

## Part 3: Data Models

### MIR (Marketing Intelligence Repository)

**Structure:** Dual-engine strategy — Lean Canvas (Physics) + JTBD (Psychology)

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
.mgsd-local/MIR/                    (client data — gitignored)
├── Core_Strategy/
│   ├── 01_COMPANY/
│   │   ├── PROFILE.md
│   │   ├── MISSION-VISION-VALUES.md
│   │   └── LEAN-CANVAS.md
│   ├── 02_BRAND/
│   │   ├── VOICE-TONE.md
│   │   └── VISUAL-IDENTITY.md
│   └── 02_BUSINESS/
│       ├── LEAN-CANVAS.md (Physics: what-who-how)
│       └── JTBD-MATRIX.md (Psychology: why-what-when)
├── Market_Audiences/
│   ├── 03_MARKET/
│   │   ├── AUDIENCES.md
│   │   └── COMPETITIVE-LANDSCAPE.md
│   └── 04_PRODUCTS/
│       ├── FEATURES.md
│       └── PRICING.md
├── Campaigns_Assets/
│   └── 05_CHANNELS/
│       └── DISTRIBUTION.md
└── STATE.md                        (Progress tracker)
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
.mgsd-local/MSP/Campaigns/01_PAID_ACQUISITION/WINNERS/
├── _CATALOG.md           (Anchor: High-performing campaigns)
├── facebook-ad-1.txt
├── google-ads-2.txt
└── linkedin-campaign-3.txt
```

**Anchoring Rule:**
All specialized agents MUST read `.mgsd-local/MSP/<discipline>/WINNERS/_CATALOG.md` before generating new assets. This ensures tone consistency and prevents regressions.

### ITM (Issue Task Templates)

**Structure:** Pre-baked Linear.app tickets for common marketing jobs.

**Location:** `.agent/marketing-get-shit-done/templates/LINEAR-TASKS/`

**Naming Pattern:** `MGSD-ITM-{CATEGORY}-{SEQUENCE}.md`

| Category | Prefix | Examples |
|----------|--------|----------|
| Content | CNT | MGSD-ITM-CNT-01 (Lead Magnet), MGSD-ITM-CNT-02 (Ad Copy) |
| Acquisition | ACQ | MGSD-ITM-ACQ-01 (Paid Social), MGSD-ITM-ACQ-03 (LinkedIn Outbound) |
| Tracking | TRK | MGSD-ITM-TRK-01 (UTM Tracking) |
| Operations | OPS | MGSD-ITM-OPS-01 (Campaign Launch) |
| Analysis | ANA | MGSD-ITM-ANA-01 (Performance Review) |
| Strategy | STR | MGSD-ITM-STR-01 (Audience Research) |

**Auto-Mapping:**
During `mgsd-linear-sync`, ITM tokens map onto Linear issues. Updated via webhook when campaign completes.

---

## Part 4: Agent Ecosystem

### Strategy & Planning Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **mgsd-onboarder** | `.agent/.../agents/mgsd-onboarder.md` | Seed JSON | Initial MIR/MSP scaffolds | Bootstraps project |
| **mgsd-strategist** | `.agent/.../agents/mgsd-strategist.md` | MIR data | Gate 1 & 2 validation | Enforces MIR requirements |
| **mgsd-campaign-architect** | `.agent/.../agents/mgsd-campaign-architect.md` | MSP doc | Channel selection matrix | Designs campaign structure |

### Execution & Implementation Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **mgsd-planner** | `.agent/.../agents/mgsd-planner.md` | MIR+MSP | `.planning/PLAN.md` (waved tasks) | Converts strategy → tasks |
| **mgsd-task-synthesizer** | `.agent/.../agents/mgsd-task-synthesizer.md` | MSP + COMPETITIVE-LANDSCAPE | Mutated task list | Injects competitor-exploiting work |
| **mgsd-plan-checker** | `.agent/.../agents/mgsd-plan-checker.md` | PLAN.md | Audit report | Pre-execution validation gate |
| **mgsd-executor** | `.agent/.../agents/mgsd-executor.md` | PLAN.md | Executed tasks + git commits | Runs tasks atomically |

### Content & Creative Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **mgsd-content-brief** | `.agent/.../agents/mgsd-content-brief.md` | MIR (Audience+Brand) | Content constraints + brief | Sets content guardrails |
| **mgsd-copy-drafter** | `.agent/.../agents/mgsd-copy-drafter.md` | Brand Voice + Audience | Long/short-form copy | Generates marketing text |
| **mgsd-creative-director** | `.agent/.../agents/mgsd-creative-director.md` | Generated assets | Brand alignment audit | Validates tone/UX |
| **mgsd-content-creator** | `.agent/.../agents/mgsd-content-creator.md` | Brief + brand voice | Channel-specific content | Posts to platforms |

### Intelligence & Reconnaissance Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **mgsd-behavioral-scraper** | `.agent/.../agents/mgsd-behavioral-scraper.md` | Reddit/X/Discord URLs | Embedded sentiment vectors | Monitors live sentiment |
| **mgsd-competitive-monitor** | `.agent/.../agents/mgsd-competitive-monitor.md` | Competitor URLs | Threat alerts | Triggers DEFCON events |
| **mgsd-data-scientist** | `.agent/.../agents/mgsd-data-scientist.md` | Post-execution CAC/LTV | Pivot phase injection | Force-halts & redirects on anomalies |

### Verification & Audit Team

| Agent | Location | Input | Output | Role |
|-------|----------|-------|--------|------|
| **mgsd-neuro-auditor** | `.agent/.../agents/mgsd-neuro-auditor.md` | Generated content | 8-dimension audit (B01-B10) | Validates psychological triggers |
| **mgsd-gap-auditor** | `.agent/.../agents/mgsd-gap-auditor.md` | MIR data | Missing elements report | Identifies MIR incomplete sections |
| **mgsd-verifier** | `.agent/.../agents/mgsd-verifier.md` | Post-execution artifacts | 7-dimension Nyquist verification | Post-phase capability gate |

### Full Agent Roster

**Complete List** — 25+ agents in `.agent/marketing-get-shit-done/agents/`:

- mgsd-onboarder, mgsd-strategist, mgsd-campaign-architect
- mgsd-planner, mgsd-plan-checker, mgsd-executor, mgsd-task-synthesizer
- mgsd-content-brief, mgsd-copy-drafter, mgsd-creative-director, mgsd-content-creator
- mgsd-social-drafter, mgsd-email-sequence, mgsd-seo-planner, mgsd-cro-hypothesis
- mgsd-behavioral-scraper, mgsd-competitive-monitor, mgsd-market-researcher, mgsd-audience-intel
- mgsd-data-scientist, mgsd-performance-monitor, mgsd-funnel-analyst, mgsd-lead-scorer
- mgsd-neuro-auditor, mgsd-gap-auditor, mgsd-verifier
- mgsd-linear-manager, mgsd-calendar-builder, mgsd-budget-monitor, mgsd-tracking-spec
- mgsd-auditor, mgsd-analyst, mgsd-report-compiler, mgsd-context-loader, mgsd-librarian

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
  "chroma_host": "http://localhost:8000",
  "project_slug": "mgsd-client",
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
  "chromadb": {
    "ok": true,
    "message": "Connected"
  },
  "mir": {
    "total": 12,
    "complete": 8,
    "gate1Ready": true  // ≥ 5 complete
  }
}
```

#### POST /submit

**Purpose:** Main entry — accept seed, trigger orchestrator, store drafts

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
  "seed_path": "/workspaces/mgsd/onboarding/onboarding-seed.json",
  "slug": "acme-corp-abc123",
  "drafts": {
    "company_profile": "[AI-generated markdown]",
    "mission_values": "[AI-generated markdown]",
    "audience": "[AI-generated markdown]",
    "competitive": "[AI-generated markdown]",
    "brand_voice": "[AI-generated markdown]",
    "channel_strategy": "[AI-generated markdown]"
  },
  "chroma": [
    { "success": true, "collection": "mgsd-acme-corp" }
  ],
  "errors": []
}
```

**Behavior:**
1. Generates deterministic project_slug from config or client seed
2. Writes .mgsd-project.json (one-time, never overwritten)
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

**Purpose:** Persist approved drafts to `.mgsd-local/MIR/`

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
1. JIT-clones `.agent/.../templates/MIR/` → `.mgsd-local/MIR/` (if needed)
2. Fuzzy-merges approved drafts into target files
3. Stamps STATE.md: rows marked `(complete)`
4. Writes disclaimer timestamp

#### POST /api/extract-sources

**Purpose:** Scrape structured data from URL or files

```http
POST /api/extract-sources
Content-Type: multipart/form-data

Form Data:
  url: "https://example.com"         (optional)
  files: [File, File, ...]            (optional — PDF, DOCX, CSV, TXT)

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

**Purpose:** AI gap-fill interview — ask follow-up for missing data

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

# ChromaDB
CHROMA_CLOUD_URL=https://...            # Optional
CHROMA_CLOUD_TOKEN=sk-...               # Optional

# Telemetry
MGSD_TELEMETRY=true|false               # Default: true
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://us.i.posthog.com

# Project Meta
PROJECT_NAME=MyCompany
PROJECT_URL=https://mycompany.com
```

### Configuration Files

**onboarding-config.json** — Server-level settings

```json
{
  "port": 4242,
  "auto_open_browser": true,
  "output_path": "../onboarding-seed.json",
  "chroma_host": "http://localhost:8000",
  "project_slug": "mgsd-client",
  "mir_output_path": null
}
```

**.mgsd-project.json** — Generated once, persistent

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
2. bin/ensure-chroma.cjs heartbeat → ChromaDB ready
3. Server boots on port 4242 → Auto-opens http://localhost:4242
4. Frontend loads: index.html + onboarding.js
5. User submits form → POST /submit

   6a. Extract sources (Omni-Input Gate):
       - Scrape URL via Tavily API
       - Parse files (PDF, DOCX, CSV, TXT)
       - Score confidence (R/Y/G)
       - Gap-fill interview for low-confidence fields

   6b. Store raw seed in ChromaDB (Project slug autogenerated or provided)
   
   6c. Run orchestrator in parallel:
       - MIR generators (company, mission, audience, competitive)
       - MSP generators (brand_voice, channel_strategy)
       - Batch delays to avoid LLM rate limits (429s)
       - Retry logic: 3 attempts with exponential backoff
   
   6d. Store drafts in ChromaDB: mgsd-{slug} collection
   
   6e. Return drafts to frontend for review

7. UI displays drafts with regenerate options
8. User approves → POST /approve

   9a. JIT-clone: .agent/.../templates/MIR/ → .mgsd-local/MIR/
   9b. Fuzzy-merge approved drafts into MIR files
   9c. Stamp STATE.md: mark rows as (complete)
   9d. Write .mgsd-install-manifest.json

10. Project ready for execution phase
```

### ChromaDB Boot Sequence

```
1. bin/ensure-chroma.cjs called
2. Check CHROMA_CLOUD_URL in .env
   → If set: use cloud, return True
3. Ping localhost:8000/api/v1/heartbeat (500ms timeout)
   → If alive: return True
4. If dead:
   → Spawn: python -m chromadb.cli.cli run (detached, unref'd)
   → Wait 2s for daemon readiness
   → Ping again → return True
5. Resolve promise
```

### Draft Generation Retry Strategy

```
For each generator (company_profile, mission_values, etc.):

  Attempt 1:
    → Call llm-adapter
    → Success? Return result
    → Failure? Check if retryable (not auth error)
    → If retryable: wait 1.5s → Attempt 2
    → If not retryable: return { ok: false, text: "[DRAFT UNAVAILABLE]" }

  Attempt 2:
    → Call llm-adapter
    → Wait 3s on failure
    → Attempt 3

  Attempt 3:
    → Call llm-adapter
    → If failure: return fallback response

Fallback Response:
  {
    ok: false,
    text: "[DRAFT UNAVAILABLE — {error_message}]",
    isFallback: true
  }

Telemetry captured at start + end (or on failure).
```

---

## Part 8: Directory Structure Reference

```
/workspaces/mgsd/
├── bin/
│   ├── install.cjs              ← First-run installer
│   ├── update.cjs               ← Idempotent updater
│   └── ensure-chroma.cjs        ← ChromaDB daemon auto-healer
├── onboarding/
│   ├── index.html               ← UI entry point
│   ├── onboarding.js            ← UI logic (form handling, polling)
│   ├── onboarding.css           ← UI styles
│   ├── onboarding-seed.schema.json  ← Input validation schema
│   ├── onboarding-config.json   ← Server config
│   └── backend/
│       ├── server.cjs           ← HTTP server (port 4242)
│       ├── handlers.cjs         ← Route handlers
│       ├── write-mir.cjs        ← Draft persistence layer
│       ├── chroma-client.cjs    ← Vector DB HTTP wrapper
│       ├── path-constants.cjs   ← Central path authority
│       ├── utils.cjs            ← Shared utilities
│       ├── agents/
│       │   ├── orchestrator.cjs    ← Parallel draft generation
│       │   ├── mir-filler.cjs      ← MIR generators (4 functions)
│       │   ├── msp-filler.cjs      ← MSP generators (3 functions)
│       │   ├── llm-adapter.cjs     ← Multi-model LLM wrapper
│       │   ├── example-resolver.cjs ← Template context injection
│       │   └── telemetry.cjs       ← PostHog event tracking
│       ├── confidences/
│       │   └── confidence-scorer.cjs ← Quality rater (R/Y/G)
│       ├── enrichers/
│       │   └── competitor-enricher.cjs ← Competitor discovery
│       ├── parsers/
│       │   ├── pdf-parser.cjs
│       │   ├── docx-parser.cjs
│       │   ├── csv-parser.cjs
│       │   └── text-parser.cjs
│       ├── scrapers/
│       │   └── tavily-scraper.cjs  ← Web scraper (LLM-powered)
│       ├── extractors/
│       │   └── schema-extractor.cjs ← Schema validation
│       └── prompts/
│           ├── extraction-prompt.js
│           ├── enrichment-prompt.js
│           ├── grouping-prompt.js
│           ├── spark-prompt.js
│           └── partial-extraction-prompt.js
├── .agent/
│   ├── marketing-get-shit-done/     ← MGSD protocol engine (version-controlled)
│   │   ├── VERSION
│   │   ├── MGSD-INDEX.md
│   │   ├── agents/                  ← 25+ specialized agent definitions
│   │   │   ├── mgsd-onboarder.md
│   │   │   ├── mgsd-strategist.md
│   │   │   ├── mgsd-campaign-architect.md
│   │   │   ├── ... (22 more)
│   │   │   └── mgsd-verifier.md
│   │   ├── templates/               ← Base templates (never write client data here)
│   │   │   ├── MIR/                ← Marketing Intelligence templates
│   │   │   │   ├── Core_Strategy/
│   │   │   │   │   ├── 01_COMPANY/
│   │   │   │   │   │   ├── PROFILE.md
│   │   │   │   │   │   ├── MISSION-VISION-VALUES.md
│   │   │   │   │   │   └── LEAN-CANVAS.md
│   │   │   │   │   ├── 02_BRAND/
│   │   │   │   │   │   ├── VOICE-TONE.md
│   │   │   │   │   │   └── VISUAL-IDENTITY.md
│   │   │   │   │   └── 02_BUSINESS/
│   │   │   │   │       ├── LEAN-CANVAS.md
│   │   │   │   │       └── JTBD-MATRIX.md
│   │   │   │   ├── Market_Audiences/
│   │   │   │   │   ├── 03_MARKET/
│   │   │   │   │   │   ├── AUDIENCES.md
│   │   │   │   │   │   └── COMPETITIVE-LANDSCAPE.md
│   │   │   │   │   └── 04_PRODUCTS/
│   │   │   │   │       ├── FEATURES.md
│   │   │   │   │       └── PRICING.md
│   │   │   │   ├── Campaigns_Assets/
│   │   │   │   │   └── 05_CHANNELS/
│   │   │   │   │       └── DISTRIBUTION.md
│   │   │   │   └── STATE.md
│   │   │   ├── MSP/                ← Marketing Strategy Plan templates
│   │   │   │   ├── Strategy/
│   │   │   │   │   ├── 00_MASTER-PLAN/
│   │   │   │   │   │   ├── CHANNEL-STRATEGY.md
│   │   │   │   │   │   ├── STRATEGIC-GOALS.md
│   │   │   │   │   │   ├── BUDGET-ALLOCATION.md
│   │   │   │   │   │   └── MARKETING-PLAN.md
│   │   │   │   │   ├── _CHANNEL-STRATEGY-saas.example.md
│   │   │   │   │   ├── _CHANNEL-STRATEGY-b2b.example.md
│   │   │   │   │   ├── ... (5+ more by business model)
│   │   │   │   │   └── 01_STRATEGY.md
│   │   │   │   ├── Inbound/
│   │   │   │   ├── Outbound/
│   │   │   │   ├── Social/
│   │   │   │   ├── Campaigns/
│   │   │   │   │   ├── 01_PAID_ACQUISITION.md
│   │   │   │   │   ├── _PAID-ACQUISITION-*.example.md (7+ models)
│   │   │   │   │   ├── 02_SEO_ORGANIC.md
│   │   │   │   │   ├── 03_LIFECYCLE_EMAIL.md
│   │   │   │   │   ├── 04_CONTENT_SOCIAL.md
│   │   │   │   │   └── 05_AFFILIATE_INFLUENCER.md
│   │   │   │   ├── Paid_Media/
│   │   │   │   ├── Lifecycle_Email/
│   │   │   │   ├── Community_Events/
│   │   │   │   ├── SETUP.md
│   │   │   │   ├── README.md
│   │   │   │   └── STATE.md
│   │   │   ├── LINEAR-TASKS/        ← Pre-baked Linear.app ticket templates
│   │   │   │   ├── MGSD-ITM-CNT-01-lead-magnet.md
│   │   │   │   ├── MGSD-ITM-CNT-02-ad-copy.md
│   │   │   │   ├── MGSD-ITM-ACQ-01-paid-social-setup.md
│   │   │   │   ├── ... (20+ more)
│   │   │   │   ├── _SCHEMA.md
│   │   │   │   └── README.md
│   │   │   └── local-override/     ← Template for .mgsd-local/
│   │   │       ├── .gitignore
│   │   │       ├── MIR/
│   │   │       ├── MSP/
│   │   │       └── config/
│   │   ├── hooks/
│   │   │   ├── pre-push
│   │   │   ├── post-execution-sync.md
│   │   │   └── pre-campaign-check.md
│   │   └── bin/
│   │       └── lib/
│   │           ├── core.cjs
│   │           ├── config.cjs
│   │           ├── commands.cjs
│   │           └── security.cjs
│   └── get-shit-done/              ← GSD protocol (separate repo)
├── .protocol-lore/
│   ├── QUICKSTART.md               ← Mandatory boot entry point
│   ├── ARCHITECTURE.md             ← System design
│   ├── STATE.md                    ← Project state + tech debt
│   ├── CONVENTIONS.md              ← Execution rules + hardening
│   ├── TEAM.md                     ← Agent roster + topology
│   ├── TEMPLATES.md                ← Template mapping (token-efficient)
│   ├── WORKFLOWS.md                ← Execution loops (onboarding, defcon, chroma)
│   ├── DEFCON.md                   ← Risk management + escalation
│   ├── MEMORY.md                   ← Vector memory mechanics
│   ├── CODEBASE-MAP.md             ← Full XML directory tree
│   └── INDEX.md                    ← Condensed overview
├── .mgsd-local/                    ← Client override layer (gitignored)
│   ├── .gitignore
│   ├── MIR/                        ← Client MIR data
│   ├── MSP/                        ← Client MSP data
│   │   └── Campaigns/01_PAID_ACQUISITION/WINNERS/
│   │       └── _CATALOG.md         ← Historical high-performers
│   └── config/
├── .mgsd-project.json              ← Project metadata (written once)
├── .mgsd-install-manifest.json     ← Installation markers
├── .env                            ← Environment variables (gitignored)
├── .env.example                    ← Example environment
├── .mgsd-logs/
│   └── chroma-daemon.log           ← ChromaDB daemon output
├── test/
│   ├── install.test.js
│   ├── update.test.js
│   ├── onboarding-server.test.js
│   ├── protocol.test.js
│   ├── write-mir.test.js
│   └── example-resolver.test.js
├── package.json
├── README.md
├── CHANGELOG.md
├── LICENSE
└── VERSION
```

---

## Part 9: Quality Patterns & Error Handling

### Resilience Mechanisms

**ChromaDB Auto-Healing:**
- Every agent calls `bin/ensure-chroma.cjs` before vector ops
- Daemon auto-revives if dead (2s readiness check)
- Cloud override: if CHROMA_CLOUD_URL set, skips local entirely

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
- .mgsd-local/ is gitignored — client data never committed
- Base templates are read-only in `.agent/templates/`
- JIT-cloning prevents data loss during upgrades
- Fuzzy-merge header-matching prevents overwrites

### Error Handling Patterns

| Scenario | Handler | Response |
|----------|---------|----------|
| ChromaDB dead | `ensure-chroma.cjs` | Spawn daemon + 2s wait |
| LLM API key missing | `llm-adapter.cjs` | Throw "API_KEY is not set" |
| No LLM providers available | `fallback response` | `"[DRAFT UNAVAILABLE]"` + isFallback flag |
| Template file missing | `write-mir.cjs` | Create dir + write file |
| Invalid seed JSON | `orchestrator` | Return error in response |
| Chroma connection failed | `server.cjs /status` | Return `{ ok: false, error }` |
| File parse error (PDF/DOCX) | `handlers onExtract` | Log error, continue with partial data |

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
| Example resolver | `test/example-resolver.test.js` | Business model → example mapping |

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
| ChromaDB local daemon disk space | Vector DB size → local storage limits | Use CHROMA_CLOUD_URL for unlimited scale |
| LLM token limits (per request) | Long MIR context → truncation | Increase max_tokens in config |
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

This TECH-MAP documents every major system in MGSD:

- **Layers 1-5**: Installation, onboarding engine, orchestration, LLM adapters, draft generators
- **Layers 6-12**: Vector memory, persistence, configuration, remote services, utilities
- **API Surface**: 11 HTTP endpoints with full contracts
- **Agent Ecosystem**: 25+ specialized agents for strategy, execution, content, intelligence, verification
- **Data Models**: MIR (intelligence), MSP (strategy), ITM (tasks)
- **Execution Sequences**: Onboarding flow, ChromaDB boot, retry strategies
- **Directory Structure**: Complete file organization with purposes
- **Error Handling**: Resilience, fallback, retry patterns

All file paths are annotated with their roles. This document is the source of truth for technical implementation.

---

*Document Version: 1.0*  
*Last Updated: March 27, 2026*  
*Maintainer: MGSD Protocol Team*
