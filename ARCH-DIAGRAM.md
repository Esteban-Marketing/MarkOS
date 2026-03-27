# MGSD Architecture Diagram & Data Flow Specification

**Last Updated:** March 27, 2026  
**Version:** 1.1.0  

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MGSD SYSTEM TOPOLOGY                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌────────────────────┐
                              │   Human User       │
                              │  (Web Browser)     │
                              └─────────┬──────────┘
                                        │ HTTP
                                        ▼
                         ┌──────────────────────────────┐
                         │  Onboarding Server v2.0      │
                         │  (onboarding/backend/        │
                         │   server.cjs:4242)           │
                         └──────────┬───────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
        │   Handlers   │    │  Extractors  │   │   Parsers    │
        │  & Router    │    │  & Scrapers  │   │  (PDF, DOCX) │
        └───────┬──────┘    └──────┬───────┘   └────────┬─────┘
                │                  │                     │
                └──────────────────┼─────────────────────┘
                                   │ (Seed JSON)
                                   ▼
        ┌────────────────────────────────────────────────────┐
        │     AI Orchestrator with Retry Strategy            │
        │   (onboarding/backend/agents/orchestrator.cjs)    │
        └────────────┬───────────────────────────┬──────────┘
                     │                           │
         ┌───────────┴──────────┐       ┌────────┴──────────┐
         │                      │       │                   │
         ▼                      ▼       ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ MIR Filler   │    │ MSP Filler   │    │   Telemetry  │
    │(mir-fill...) │    │(msp-fill...) │    │ (PostHog)    │
    └────┬─────────┘    └─────┬────────┘    └──────────────┘
         │                    │
         └────────┬───────────┘
                  │ (All LLM calls)
                  ▼
         ┌──────────────────────────┐
         │  Unified LLM Adapter     │
         │  (llm-adapter.cjs)       │
         │ ┌─────────────────────┐  │
         │ │ OpenAI              │  │
         │ │ Anthropic           │  │
         │ │ Gemini 2.5 Flash    │  │
         │ │ Ollama (local)      │  │
         │ │ Fallback Template   │  │
         │ └─────────────────────┘  │
         └──────────────────────────┘
              │ (Draft Text) ▼
         ┌──────────────────────────┐
         │   ChromaDB Client        │
         │  (chroma-client.cjs)     │
         │ ┌─────────────────────┐  │
         │ │ Store Drafts        │  │
         │ │ Namespace: mgsd-{id}│  │
         │ │ (Vector Embeddings) │  │
         │ └─────────────────────┘  │
         └──────────┬───────────────┘
                    │
         ┌──────────┴─────────────┐
         │                        │
    ┌────▼─────────────┐   ┌──────▼───────────┐
    │ Local ChromaDB   │   │ Chroma Cloud     │
    │ localhost:8000   │   │ (Remote Service) │
    │ (Python daemon)  │   │ (via env var)    │
    └──────────────────┘   └──────────────────┘
```

---

## Layer Architecture

### 1. HTTP Request Flow

```
┌─────────────────────────────────────┐
│ Browser Form Submission             │
│ (index.html + onboarding.js)        │
└────────────┬────────────────────────┘
             │ POST /submit
             │ { seed JSON }
             ▼
┌─────────────────────────────────────┐
│ server.cjs Request Handler          │
│ 1. Parse body                       │
│ 2. Generate project_slug            │
│ 3. Call orchestrator.orchestrate()  │
└────────────┬────────────────────────┘
             │ async Promise
             ▼
┌─────────────────────────────────────────────┐
│ orchestrator.cjs                            │
│ 1. Store seed in ChromaDB                   │
│ 2. Execute MIR agents (batched)             │
│ 3. Execute MSP agents (batched)             │
│ 4. Store drafts in ChromaDB                 │
│ 5. Telemetry hooks                          │
└────────────┬────────────────────────────────┘
             │ { drafts, chromaResults, errors }
             ▼
┌─────────────────────────────────────┐
│ handlers.handleSubmit()             │
│ Format response JSON                │
└────────────┬────────────────────────┘
             │ 200 application/json
             ▼
┌─────────────────────────────────────┐
│ Browser receives drafts             │
│ UI displays for review/edit         │
└─────────────────────────────────────┘
```

### 2. Draft Generation Pipeline

```
┌──────────────────────────────────┐
│ Seed JSON Input                  │
│ company, product, audience,      │
│ market, competitive, content     │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ MIR Generators (Parallel)        │
├──────────────────────────────────┤
│ getCompanyProfile(seed)          │
│  ├─ Resolve example by model     │
│  ├─ Build system prompt          │
│  └─ Call LLM adapter             │
│                                  │
│ getMissionVisionValues(seed)     │
│  ├─ Resolve example by industry  │
│  └─ Call LLM adapter             │
│                                  │
│ getAudienceProfile(seed)         │
│ getCompetitiveLandscape(seed)    │
└────────┬───────────────────────┘
         │ [Batch 1: Wait ~2s]
         │ [Batch 2: Wait ~2s]
         ▼
┌──────────────────────────────────┐
│ MSP Generators (Sequential)      │
├──────────────────────────────────┤
│ getBrandVoice(seed)              │
│  ├─ Example: VOICE-TONE.example  │
│  └─ Call LLM adapter             │
│                                  │
│ getChannelStrategy(seed)         │
│  ├─ Example: CHANNEL-STRATEGY-{} │
│  └─ Call LLM adapter             │
│                                  │
│ getPaidAcquisition(seed)         │
└────────┬───────────────────────┘
         │ [Batch delay]
         ▼
┌──────────────────────────────────┐
│ Collect Drafts Map               │
│ {                                │
│   company_profile: "text",       │
│   mission_values: "text",        │
│   audience: "text",              │
│   competitive: "text",           │
│   brand_voice: "text",           │
│   channel_strategy: "text"       │
│ }                                │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ ChromaDB Persistence             │
│ For each draft section:          │
│ - storeDraft(slug, section, txt) │
│ - Save metadata + vectors        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Optional: Neuro-Auditor          │
│ (if skill file exists)           │
│ - Validate psychological triggers│
│ - 8-dimension audit (B01-B10)    │
│ - Return audit report            │
└──────────────────────────────────┘
```

### 3. Retry & Error Handling Flow

```
┌─────────────────────────────────────────┐
│ executeWithRetry(fn, name, slug)        │
└────────────┬────────────────────────────┘
             │
             ▼
        ┌────────────────────┐
        │ Attempt 1          │
        │ call llm-adapter() │
        └────┬───────────────┘
             │
         ┌───┴────────────────┬──────────────────┐
         │                    │                  │
      Success        Non-Retryable            Retryable
         │            Auth Error             429 Rate
         ▼            401/403                Limit
    Return OK           │                      │
                        │                   wait 1.5s
                        │                      │
                     Return                    ▼
                        │              ┌──────────────┐
                        │              │ Attempt 2    │
                        │              │ call llm()   │
                        │              └───┬──────────┘
                        │                  │
                        │              wait 3s on fail
                        │                  │
                        │                  ▼
                        │         ┌──────────────┐
                        │         │ Attempt 3    │
                        │         │ call llm()   │
                        │         └───┬──────────┘
                        │             │
                    ┌───┴─────────────┼─────────┐
                    │                 │         │
                 Success          All Failed   │
                    │                 │        │
                    └→ Return OK       │        │
                                      │     Return
                              Return Fallback   │
                              { isFallback: true}
                              "[DRAFT UNAVAILABLE]"
```

### 4. Vector Memory (ChromaDB) Integration

```
┌────────────────────────────────────────────────┐
│ Post-Onboarding Vector Memory State            │
└────────────────────────────────────────────────┘

ChromaDB Collection: mgsd-acme-corp-abc123

┌────────────────┐ ┌─────────────────────┐
│ Seed Sections  │ │ Draft Sections      │
├────────────────┤ ├─────────────────────┤
│ company        │ │ company_profile     │
│ product        │ │ mission_values      │
│ audience       │ │ audience_profile    │
│ market         │ │ competitive_analysis│
│ competitive    │ │ brand_voice         │
│ content        │ │ channel_strategy    │
└────────────────┘ └─────────────────────┘

Each stored as JSON with:
- text content
- embedding vector
- metadata tags
- timestamp

┌─────────────────────────────────────────────┐
│ Agent Queries (during execution phase)      │
├─────────────────────────────────────────────┤
│ mgsd-copy-drafter:                          │
│  "Query: failed email sequences"            │
│  → Return historic [FAILURE] classified     │
│  → Explicitly exclude those angles          │
│                                             │
│ mgsd-campaign-architect:                    │
│  "Query: similar B2B campaigns"             │
│  → Return structures tagged [SUCCESS]       │
│  → Adopt matching structure                 │
│                                             │
│ mgsd-data-scientist (post-execution):       │
│  "Store: Phase 5 CAC=$45, ROAS=2.3x"        │
│  → Tag as [SUCCESS] or [FAILURE]            │
│  → Embed with classified metadata           │
└─────────────────────────────────────────────┘
```

### 5. Data Persistence Flow

```
┌──────────────────────────────────┐
│ User Approves Drafts             │
│ POST /approve                    │
│ { slug, approvedDrafts }         │
└────────────┬───────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ write-mir.cjs:applyDrafts()      │
│ 1. Check .mgsd-local/MIR/        │
└────────────┬───────────────────┘
             │
       ┌─────┴──────────────────┐
       │                        │
     Exists?                  No
       │                        │
      Yes                       ▼
       │              ┌────────────────────┐
       │              │ JIT-Clone:         │
       │              │ Copy entire        │
       │              │ .agent/templates/  │
       │              │ MIR/ → .mgsd-local/│
       │              └────────┬───────────┘
       │                       │
       └───┬───────────────────┘
           │ (Now .mgsd-local/ exists)
           ▼
┌──────────────────────────────────┐
│ For each approved draft:          │
│ 1. Parse markdown headers (##)    │
│ 2. Find matching template headers │
│ 3. Fuzzy-merge draft into body    │
│ 4. Write to file                 │
└────────────┬───────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Stamp STATE.md                   │
│ Mark completed rows:             │
│ `(empty)` → `(complete)`         │
└────────────┬───────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Apply Disclaimer Timestamp       │
│ > 🤖 Generated by MGSD on 2026.. │
└────────────┬───────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Return:                          │
│ { written: [...], errors: [...] }│
└──────────────────────────────────┘
```

### 6. Template Resolution (Example Injection)

```
┌──────────────────────────────────────┐
│ generateBrandVoice(seed)             │
│ company.business_model = "SaaS"      │
└────────────┬───────────────────────┘
             │
             ▼
         Call resolveExample(
           templateName:   "BRAND-VOICE",
           businessModel:  "SaaS",
           basePath:       CORE_STRAT_DIR
         )
             │
             ▼
┌──────────────────────────────────────┐
│ resolveExample Logic:                │
│ Construct path:                      │
│ .../templates/MIR/Core_Strategy/     │
│   02_BRAND/_BRAND-VOICE-saas.ex.md   │
│                                      │
│ If exists: load it                   │
│ If not: try generic _BRAND-VOICE.md  │
│ If not: return empty block           │
└────────────┬───────────────────────┘
             │ (Example markdown text)
             ▼
    ┌──────────────────────────────┐
    │ Inject into LLM Prompt       │
    │                              │
    │ Your prompt:                 │
    │ "[...company context...]     │
    │                              │
    │ [EXAMPLE_BLOCK]              │
    │                              │
    │ Write: ..."                  │
    └──────────────────────────────┘
```

### 7. Multi-Model LLM Provider Selection

```
┌─────────────────────────────────────┐
│ llm.call(systemPrompt,              │
│          userPrompt,                │
│          options = {})              │
└────────────┬────────────────────────┘
             │
         ┌───┴───────────────────────────────────┐
         │                                       │
    explicit provider?           options.provider
         │ YES                    override?
         ▼                        │
      Use it                  ┌───────┐
                              │ YES   │
                              ▼
                          ┌────────────────┐
                          │ Use specified  │
                          │ provider       │
                          └────────────────┘
                                      
              │ NO (fallback to auto-detect)
              ▼
    ┌──────────────────────────────┐
    │  ANTHROPIC_API_KEY present?  │
    └──────────┬──────────────────┘
               │ YES          │ NO
               ▼              ▼
         ┌──────────┐  ┌──────────────────┐
         │ Anthropic│  │ OPENAI_API_KEY?  │
         │Claude    │  └────┬─────────┬───┘
         └──────────┘       │ YES     │ NO
                            ▼        ▼
                      ┌─────────┐ ┌──────────────┐
                      │ OpenAI  │ │ GEMINI_API_? │
                      │GPT-4o.. │ └────┬────┬───┘
                      └─────────┘      │ YES│ NO
                                       ▼   ▼
                                  ┌────────┐ ┌──────────┐
                                  │ Gemini │ │ OLLAMA?  │
                                  │2.5 Flsh│ └────┬┬───┘
                                  └────────┘      ││ YES
                                            ┌─────┘│
                                            │      ▼
                                            │   ┌──────┐
                                            │   │Local │
                                            │   │Ollama│
                                            │   └──────┘
                                            │
                                            │ NO (all failed)
                                            ▼
                                    ┌──────────────────┐
                                    │ Return Fallback  │
                                    │ Template Response│
                                    │ isFallback: true │
                                    └──────────────────┘
```

### 8. ChromaDB Boot Sequence

```
┌───────────────────────────────────┐
│ Any agent needs vector operation  │
│ Calls: bin/ensure-chroma.cjs()    │
└────────────┬────────────────────┘
             │
             ▼
┌───────────────────────────────────┐
│ ensureChroma()                    │
│ 1. Check .env                     │
└────────────┬────────────────────┘
             │
         ┌───┴──────────────────────┐
         │                          │
   CHROMA_CLOUD_URL   No CHROMA_CLOUD_URL
   set?                            │
         │ YES                      ▼
         │           ┌──────────────────────────┐
         │           │ Ping localhost:8000/api/v1/
         │           │ heartbeat (500ms timeout)
         │           └───┬──────────────────────┘
         │               │
         ▼               ├─ Alive? → Return True
    Return              │
    True                └─ Dead → Continue
    (Cloud                       │
    ready)                       ▼
                        ┌──────────────────────────┐
                        │ Spawn daemon:            │
                        │ python -m chromadb.cli   │
                        │            .cli run      │
                        │ (detached, unref'd)      │
                        └───────┬──────────────────┘
                                │
                                ▼
                        ┌──────────────────────────┐
                        │ Wait 2 seconds           │
                        │ (Daemon readiness)       │
                        └───────┬──────────────────┘
                                │
                                ▼
                        ┌──────────────────────────┐
                        │ Ping heartbeat again     │
                        │ → Confirm alive          │
                        │ Return True              │
                        └──────────────────────────┘
```

### 9. Confidence Scoring & Gap-Fill Interview

```
┌────────────────────────────────────┐
│ POST /api/extract-sources          │
│ (Tavily scraper + file parsers)    │
└────────────┬───────────────────────┘
             │ Extracted structured data
             ▼
┌────────────────────────────────────┐
│ POST /api/extract-and-score        │
│ Confidence Scorer                  │
│ Rates each field (R/Y/G)           │
└────────────┬───────────────────────┘
             │
    ┌────────┴────────────┐
    │                     │
     ▼                     ▼
 Red Fields           Yellow Fields
 (Confidence          (Confidence
  < 0.5)              0.5-0.8)
    │                     │
    └─ Gaps Detected ─┘
         │
         ▼
 ┌────────────────────────────────┐
 │ Trigger gap-fill interview     │
 │ For each low-confidence field: │
 │                                │
 │ POST /api/generate-question    │
 │ - Analyze field value          │
 │ - Generate follow-up Q         │
 │ - Suggest possible answers     │
 │ - User selects best answer     │
 │                                │
 │ Loop until all Green           │
 └────────────────────────────────┘
```

### 10. Data Flow: Seed → MIR → MSP → Execution

```
┌─────────────────────────────┐
│ 1. Onboarding Seed          │ (What we know)
│   ├─ company info           │
│   ├─ product specs          │
│   ├─ audience behavior      │
│   ├─ market landscape       │
│   └─ competitor positioning │
└────────────┬────────────────┘
             │ (stored in ChromaDB)
             ▼
┌─────────────────────────────┐
│ 2. MIR (Ground Truth)       │ (Intelligence layer)
│   ├─ Company Profile        │
│   ├─ Mission/Vision/Values  │
│   ├─ Audience Persona       │
│   ├─ Competitive Landscape  │
│   ├─ Brand Voice            │
│   ├─ Tech Stack             │
│   └─ Lean Canvas + JTBD     │
│ (Stored in .mgsd-local/MIR/)│
└────────────┬────────────────┘
             │ (human readable, version controlled)
             ▼
┌─────────────────────────────┐
│ 3. Agent Boots: Read MIR    │ (Execution phase)
│   Check overrides in:       │
│   .mgsd-local/MIR/          │
│   Apply local customization │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 4. MSP (Strategy Blueprint) │ (Tactical layer)
│   ├─ Channel Strategy       │
│   ├─ Campaign Plan          │
│   ├─ Content Calendars      │
│   ├─ Budget Allocation      │
│   ├─ Performance Dashboard  │
│   └─ Winners Catalog        │
└────────────┬────────────────┘
             │ (per-discipline execution)
             ▼
┌─────────────────────────────┐
│ 5. Agent Reads Winners Cat. │
│   .mgsd-local/MSP/          │
│   {discipline}/WINNERS/     │
│   _CATALOG.md               │
│   (Anchor to high-performers)
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 6. Execution: Generate New  │ (Operating layer)
│   Assets (copy, video, etc) │
│   Anchored to winners       │
│   Grounded in MIR context   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 7. Store Results in Chroma  │
│   Tag: [SUCCESS] or [FAILURE]│
│   For next phase learning   │
└─────────────────────────────┘
```

---

## Component Interaction Matrix

```
┌─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Component       │ Reads From   │ Writes To    │ Calls        │ Called By    │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ server.cjs      │ .env         │ .mgsd-proj.. │ handlers,    │ npm/user     │
│                 │ config.json  │ seed.json    │ orchestrator │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ handlers.cjs    │ req body     │ JSON res     │ orchestrator │ server.cjs   │
│                 │ request URI  │ Chroma       │ write-mir    │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ orchestrator    │ seed JSON    │ Chroma       │ mir/msp-fill │ handlers     │
│ .cjs            │              │ drafts       │ telemetry    │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ mir-filler      │ seed JSON    │ draft text   │ llm-adapter  │ orchestrator │
│ .cjs            │              │              │ ex-resolver  │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ msp-filler      │ seed JSON    │ draft text   │ llm-adapter  │ orchestrator │
│ .cjs            │              │              │ ex-resolver  │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ llm-adapter     │ .env         │ response obj │ OpenAI SDK   │ mir/msp- fill│
│ .cjs            │ system/user  │ or fallback  │ native fetch │              │
│                 │ prompts      │              │ (Anthropic..)│              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ chroma-client   │ .env         │ collections  │ fetch API    │ orchestrator │
│ .cjs            │ project_slug │ metadata     │              │ handlers     │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ write-mir.cjs   │ Chroma       │ .mgsd-local/ │  fs ops      │ handlers     │
│                 │ templates    │ STATE.md     │              │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ parsers/        │ file stream  │ text content │ -            │ handlers     │
│ (pdf, docx..)   │              │              │              │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ ensure-chroma   │ .env         │ daemon PID   │ spawn() exec │ install.cjs  │
│ .cjs            │              │ logs         │ http.get()   │ server.cjs   │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ ex-resolver     │ templates/   │ example text │ fs.readFile  │ mir/msp-fill │
│ .cjs            │ by model     │              │              │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ telemetry.cjs   │ PostHog cfg  │ event queue  │ PostHog API  │ orchestrator │
│                 │              │              │              │              │
└─────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## State Diagram: Project Lifecycle

```
┌──────────────────┐
│ NOT INSTALLED    │
└────────┬─────────┘
         │ npm install
         │ npx marketing-get-shit-done install
         ▼
┌──────────────────┐
│ INSTALLING       │
│ ├─ Detect GSD    │
│ ├─ Copy templates│
│ ├─ Chroma boot   │
│ └─ Write manifest│
└────────┬─────────┘
         │ Success
         ▼
┌──────────────────┐
│ INSTALLED        │
│ Ready for use    │
└────────┬─────────┘
         │ node onboarding/backend/server.cjs
         ▼
┌──────────────────┐
│ ONBOARDING       │
│ ├─ Start server  │
│ ├─ Browser opens │
│ └─ User submits  │
└────────┬─────────┘
         │ POST /submit
         ▼
┌──────────────────┐
│ EXTRACTING       │
│ ├─ Parse files   │
│ ├─ Score confid. │
│ └─ Gap interview │
└────────┬─────────┘
         │ Seed ready
         ▼
┌──────────────────┐
│ GENERATING       │
│ ├─ MIR drafts    │
│ ├─ MSP drafts    │
│ └─ Store Chroma  │
└────────┬─────────┘
         │ Drafts ready
         ▼
┌──────────────────┐
│ REVIEWING        │
│ User reviews &   │
│ edits drafts     │
└────────┬─────────┘
         │ POST /approve
         ▼
┌──────────────────┐
│ APPROVED         │
│ ├─ Clone local   │
│ ├─ Merge drafts  │
│ ├─ Update STATE  │
│ └─ Ready for exec│
└────────┬─────────┘
         │ Ready for execution phase
         │ (GSD agent takeover)
         ▼
┌──────────────────┐
│ EXECUTION        │
│ Marketing ops   │
│ begin via GSD    │
│ orchestration    │
└──────────────────┘
```

---

## Error Recovery Paths

### Path 1: ChromaDB Dead

```
┌──────────────────┐
│ Any operation    │
│ needs Chroma     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ pingLocalhost:   │
│ 8000/heartbeat   │
│ → No response    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Spawn daemon     │
│ python -m chroma │
│ db.cli.cli run   │
└────────┬─────────┘
         │
     ┌───┴───────────┐
     │               │
  Success         Failed
     │               │
     ▼               ▼
  Return       Return False
   True        (skip vector ops)
     
```

### Path 2: LLM Provider Failures

```
┌──────────────────┐
│ Call LLM Adapter │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Attempt 1        │
│ Anthropic:       │
│ [LLM call fails] │
└────────┬─────────┘
         │
    ┌────┴──────────────┐
    │                   │
   Auth Error      Network Error
   401/403          (Retryable)
    │                   │
    ▼                   ▼
 Fail Fast          Retry Attempt 2
 Return             (wait 1.5s)
 Fallback               │
                    ┌───┴────────────────┐
                    │                    │
                 Success             Fail Again
                    │                    │
                    ▼                 Retry Attempt 3
                 Return              (wait 3s)
                 Draft                  │
                                    ┌───┴────────────────┐
                                    │                    │
                                 Success             All Failed
                                    │                    │
                                    ▼                    ▼
                                 Return              Return Fallback
                                 Draft               "[DRAFT UNAVAILABLE]"
                                                     isFallback: true
```

### Path 3: Template File Missing

```
┌────────────────┐
│ write-mir.cjs  │
│ Apply drafts   │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ .mgsd-local/   │
│ MIR/ exists?   │
└────────┬───────┘
         │
      ┌──┴──┐
    No │    │ Yes
      │    ▼
      │  Open file
      │  for merge
      │
      ▼
┌──────────────────┐
│ JIT-Clone:       │
│ Copy entire      │
│ .agent/templates/│
│ MIR/ tree        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Now directories  │
│ exist, proceed   │
│ to merge         │
└──────────────────┘
```

---

## Security & Data Isolation

### Design Pattern: Separation of Concerns

```
┌────────────────────────────────────────────────┐
│ MIR/MSP = STATE (What is known)                │
│ Persistent, human-editable, ground truth       │
│ Location: .mgsd-local/                         │
│ Gitignored, client data never committed        │
└────────────────────────────────────────────────┘
      │
      │ (Read by agents)
      ▼
┌────────────────────────────────────────────────┐
│ .agent/prompts/* = LOGIC (How to execute)      │
│ Stateless, reusable, version-controlled        │
│ Location: .agent/marketing-get-shit-done/      │
│ Never write client data here                   │
└────────────────────────────────────────────────┘
      │
      │ (Read by executors)
      ▼
┌────────────────────────────────────────────────┐
│ Generated assets = OUTPUT (What was created)   │
│ Temporary, execution artifacts                 │
│ Location: execution phase specific             │
└────────────────────────────────────────────────┘
```

### Data Flow: Override Resolution

```
┌──────────────────────────────────────────┐
│ Agent reads: MIR/Core_Strategy/02_BRAND/ │
│             VOICE-TONE.md                │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Check .mgsd-local/MIR/02_BRAND/          │
│ VOICE-TONE.md                            │
└────────────┬─────────────────────────────┘
             │
         ┌───┴──────┐
    Exists│          │ Not exists
         ▼          ▼
    ┌────────┐  ┌──────────────────┐
    │ Use    │  │ Fall back to:     │
    │ Local  │  │ .agent/templates/ │
    │ Version│  │ MIR/02_BRAND/     │
    │        │  │ VOICE-TONE.md     │
    │ Log    │  └──────────────────┘
    │[override]
    └────────┘

Result: Agent has context-aware data
         with local overrides applied
```

---

## Performance Characteristics

### Request Timeline

```
POST /submit
├─ Parse body               : ~5ms
├─ Generate slug            : ~2ms
├─ Store seed in Chroma     : ~100ms
├─ MIR Generation Batch 1   : ~3000ms (parallel)
│  ├─ generateCompanyProfile
│  ├─ generateMissionVisionValues
│  └─ Rate limit delay      : ~2000ms
├─ MIR Generation Batch 2   : ~3000ms
│  ├─ generateAudienceProfile
│  ├─ generateCompetitiveLandscape
│  └─ Rate limit delay      : ~2000ms
├─ MSP Generation           : ~2000ms (sequential)
│  ├─ generateBrandVoice    : ~1000ms
│  └─ generateChannelStrategy : ~1000ms
├─ Store drafts in Chroma   : ~50ms
└───────────────────────────────────────
Total: ~10-12 seconds (typical)

Factors:
- LLM latency varies by provider
- Network latency to LLM service
- Chroma write efficiency
- Retry attempts increase time
```

### Throughput

```
Single Server Instance (server.cjs):
- Concurrent requests: Limited by Node.js event loop
- Typical capacity: 50-200 concurrent onboardings
- Bottleneck: LLM rate limits (429s)
- Solutions:
  ├─ Multiple server instances
  ├─ Load balancer
  ├─ Queue system (RabbitMQ, etc.)
  └─ Staggered LLM calls
```

### Storage Estimates

```
Per Project:
- Seed JSON: ~10-50 KB
- MIR files: ~50-100 KB
- MSP files: ~100-200 KB
- Chroma vectors (embeddings): ~5-10 MB
- Total per project: ~5-15 MB

Storage scaling:
- 1000 projects: ~5-15 GB
- Chroma DB: Vector index grows with projects
```

---

## Extension Points

### How to Add New LLM Provider

```
1. Edit: onboarding/backend/agents/llm-adapter.cjs
2. Add async function: callNewProvider(system, user, opts)
3. Implement HTTP request to service
4. Add detection in call() function provider priority
5. Add .env documentation
6. Test with orchestrator

Implementation Template:
async function callNewProvider(systemPrompt, userPrompt, options) {
  const model = options.model || 'default-model';
  const apiKey = process.env.NEWPROVIDER_API_KEY;
  if (!apiKey) throw new Error('API key not set');
  
  const payload = {
    model,
    max_tokens: options.max_tokens || 1200,
    messages: [...]
  };
  
  const res = await fetch('https://api.newprovider.com/v1/complete', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(payload)
  });
  
  return { text: data.content[0].text, ... };
}
```

### How to Add New Template Example

```
1. Locate: .agent/marketing-get-shit-done/templates/
2. Create: MSP/Strategy/_CHANNEL-STRATEGY-{business_model}.example.md
3. Follow structure of existing examples
4. Business model is auto-detected from seed
5. example-resolver.cjs will auto-load during generation
6. Test with generateChannelStrategy()

Business Models:
- saas, b2b, b2c, dtc, marketplace, agents-aas, b2b2c
```

### How to Add New Confidence Score Dimension

```
1. Edit: onboarding/backend/confidences/confidence-scorer.cjs
2. Add scoring function for new field dimension
3. Update score ranges (Red: <0.5, Yellow: 0.5-0.8, Green: >0.8)
4. Add gap-fill interview question in handlers.cjs
5. Test with POST /api/extract-and-score

Example:
scoreTeamSize(value) {
  if (!value) return { rating: 'R', confidence: 0 };
  if (value.match(/^\d+$/)) return { rating: 'G', confidence: 0.95 };
  if (value.match(/range/i)) return { rating: 'Y', confidence: 0.7 };
  return { rating: 'Y', confidence: 0.5 };
}
```

---

## Deployment Patterns

### Pattern 1: Single Node (Development)

```
npm install marketing-get-shit-done
npx marketing-get-shit-done install

node onboarding/backend/server.cjs
# Runs on localhost:4242
# Local ChromaDB daemon on localhost:8000
```

### Pattern 2: Multi-Instance with Load Balancer

```
      ┌────────────────────┐
      │ Nginx / HAProxy    │
      │ (Load Balancer)    │
      └─────────┬──────────┘
                │
        ┌───────┼───────┬──────────┐
        │       │       │          │
        ▼       ▼       ▼          ▼
    ┌────┐ ┌────┐ ┌────┐      ┌────┐
    │Srv1│ │Srv2│ │Srv3│      │SrvN│
    └─┬──┘ └─┬──┘ └─┬──┘      └─┬──┘
      │      │      │           │
      └──────┴──────┴───────────┘
              │
              ▼
      ┌──────────────────┐
      │ Chroma Cloud     │
      │ (Shared Vector DB)
      └──────────────────┘

Configuration:
- Each server instance: .env with CHROMA_CLOUD_URL
- Stateless HTTP layer (no file persistence needed)
- All projects store in single Chroma Cloud namespace
```

### Pattern 3: Containerized (Docker)

```
Dockerfile:
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 4242
CMD ["node", "onboarding/backend/server.cjs"]

docker-compose.yml:
services:
  server:
    build: .
    ports: ["4242:4242"]
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CHROMA_CLOUD_URL=${CHROMA_CLOUD_URL}
  chroma:
    image: chromadb/chroma:latest
    ports: ["8000:8000"]
```

---

## Protocol-Lore Integration Points

```
┌──────────────────────────────────────────────┐
│ .protocol-lore/ Agent Navigation Layer       │
└──────────────────────────────────────────────┘
         │
         ├→ QUICKSTART.md
         │  • Read first (mandatory boot)
         │  • Commands, key files, cheat sheet
         │
         ├→ ARCHITECTURE.md
         │  • Component design
         │  • MIR/MSP boundaries
         │  • System data flow
         │
         ├→ CONVENTIONS.md
         │  • Execution rules
         │  • Override logic
         │  • Path resolution
         │
         ├→ TEAM.md
         │  • Agent roster (25+)
         │  • Human+AI topology
         │  • Lifecycle stages
         │
         ├→ TEMPLATES.md
         │  • MIR/MSP structure
         │  • ITM task templates
         │  • Resolution protocol
         │
         ├→ WORKFLOWS.md
         │  • Onboarding loop
         │  • ChromaDB boot loop
         │  • DEFCON triggers
         │
         ├→ DEFCON.md
         │  • Risk management
         │  • Event-driven layer
         │  • Escalation rules
         │
         ├→ MEMORY.md
         │  • Vector memory mechanics
         │  • Chroma operations
         │  • RAG patterns
         │
         ├→ STATE.md
         │  • Current milestone
         │  • Active phases
         │  • Tech debt tracking
         │
         └→ CODEBASE-MAP.md
            • Full XML directory tree
            • File annotations
            • Deep navigation
```

---

## Key Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Separation of Concerns** | State (MIR/MSP) vs Logic (prompts) vs Output | Data isolation, upgrade safety |
| **JIT-Clone** | write-mir.cjs | Preserve templates, enable client overrides |
| **Fuzzy-Merge** | write-mir.cjs | Inject drafts by header matching |
| **Example Injection** | example-resolver.cjs | Context-aware LLM prompts by business model |
| **Retry with Backoff** | orchestrator.cjs | Handle transient LLM failures |
| **Multi-Model LLM** | llm-adapter.cjs | Graceful degradation, no single provider lock-in |
| **Vector Memory RAG** | chroma-client.cjs | Episodic learning, historical performance tracking |
| **Override Resolution** | path-constants + handlers | Local customization without forking base |
| **Auto-Healing Daemon** | ensure-chroma.cjs | ChromaDB resilience, transparent boot |
| **Telemetry Hooks** | orchestrator + agents | Post-execution learning, CAC tracking |
| **Gate System** | STATE.md | Progressive completion tracking |

---

*Architecture Specification Version: 1.0*  
*Effective Date: March 27, 2026*
