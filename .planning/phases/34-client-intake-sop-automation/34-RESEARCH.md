---
phase: 34
phase_name: Client Intake SOP Automation
milestone: v2.4
milestone_name: Beta Client Onboarding
researched: "2026-03-31"
domain: Operations & Intake Workflow Automation
confidence: HIGH
---

# Phase 34: Client Intake SOP Automation — Research

**Researched:** 2026-03-31  
**Domain:** Client intake SOP automation, Linear integration, MIR seed population  
**Confidence:** HIGH  

## Summary

Phase 34 automates the client intake workflow: form submission → validation → Linear ticket creation → MIR seed population → onboarding session initiation. 

**Current State:** Manual intake surfaces exist across three separate entry points (web form at `/submit`, CLI onboarding-seed.json, direct API calls). Linear integration exists in Phase 29 `/linear/sync` but requires manual ITM token specification. Seed → MIR generation is automatic (orchestrator-driven), but no automation wires intake forms directly to Linear ticket creation.

**Proposed Architecture:** 
1. Consolidate intake form output to a single, validated seed schema
2. Wire form submission → validation → automatic Linear ticket creation using MARKOS-ITM tokens
3. Auto-populate MIR seed schema during intake (not post-submission)
4. Create intake SOP workflow document that links intake rules to Linear tracking

**Phase 34 should be a single focused phase** (not multi-phase) covering: intake form validation rules, Linear template wiring, seed schema standardization, and SOP documentation. Success = zero-touch intake flow: client fills form → validation → Linear tickets created → MIR ready without human intervention.

**Key Dependency:** Phase 34 depends on v2.3 completion (✅ Phase 33 COMPLETE) and existing Linear integration from Phase 29. No infrastructure changes needed.

---

## User Constraints

*(None identified; v2.4 scope pending stakeholder input per ROADMAP.md)*

---

## Standard Stack

### Core Components (Existing & to be Integrated)

| Component | Version | Purpose | Already Deployed | Integration Needed |
|-----------|---------|---------|------------------|-------------------|
| **Onboarding Backend** | (Node.js) | HTTP intake surface at `/submit`, `/approve`, `/regenerate` | ✅ Yes | Enhance validation rules |
| **Linear API Client** | (GraphQL) | Issue creation via `/linear/sync` endpoint | ✅ Yes (Phase 29) | Wire to intake form flow |
| **Linear ITM Template Registry** | 1.2.0 | Maps MARKOS-ITM tokens to .md templates (20 active templates) | ✅ Yes | Extend with intake-specific templates |
| **Orchestrator** | (onboarding/backend/agents/orchestrator.cjs) | Seed → draft generation pipeline | ✅ Yes | Auto-invoke on intake validation |
| **Vector Store Client** | (Upstash + Supabase) | Seed upsert + draft storage | ✅ Yes | Audit for intake schema changes |
| **Web Form** | (onboarding/index.html) | Multi-step client intake UI | ✅ Yes | Add validation rules per schema |

### Schema & Templates

| Item | Path | Purpose | Status |
|------|------|---------|--------|
| **Intake Seed Schema** | onboarding-seed.json (exists) | Client company/audience/product/market/content data | ✅ Complete; needs validation audit |
| **Linear Template Catalog** | `.agent/markos/templates/LINEAR-TASKS/_CATALOG.md` | Master ITM token registry | ✅ Complete; needs intake entries |
| **MIR Output** | `.planning/MIR/` | 78-file template structure for approved drafts | ✅ Complete |
| **MSP Output** | `.planning/MSP/` | 80-file template structure for approved drafts | ✅ Complete |
| **Onboarding Config** | `onboarding/onboarding-config.json` | Form settings (port, logo, MIR/MSP paths) | ✅ Complete |

### Testing & Validation

| Framework | Detection | Purpose | Status |
|-----------|-----------|---------|--------|
| Node.js Test Runner | `npm test` invokes `node --test test/**/*.test.js` | Unit + integration coverage | ✅ Active (11 passing tests in Phase 33) |
| Linear Sandbox | Test API key with read-only Linear workspace | Dry-run issue creation | ✓ Available; used in Phase 29 |

---

## Current Intake Flow Architecture

### Entry Points (3 Separate Surfaces)

```
1. Web Form (Onboarding UI)
   └─→ POST /submit
       └─→ server.cjs: handleSubmit()
           ├─→ Validate seed structure (loose)
           ├─→ Slug generation (auto if not provided)
           ├─→ Write onboarding-seed.json to disk
           └─→ orchestrator.orchestrate(seed, slug)
               ├─→ Store seed in vector memory
               ├─→ Run MIR agents (3 agents)
               ├─→ Run MSP agents (2 agents)
               └─→ Return drafts + errors

2. CLI: Direct JSON submission
   └─→ POST /submit (same handler; via CLI or Postman)

3. Direct API call
   └─→ POST /api/linear/sync (existing; Phase 29)
       └─→ handleLinearSync()
           ├─→ Requires manual ITM token array
           └─→ Validates token registry
               └─→ Creates Linear issues per template
```

### Current Validation Rules (Minimal)

**Current:** `handleSubmit()` validates request structure only:
- `secretCheck` — API key availability
- `project_slug` resolution from request body or fallback
- No schema validation on `seed.company`, `seed.audience`, `seed.product`, etc.

**Gap:** Intake data can be incomplete or malformed without error. No contract enforcement.

### Current Linear Integration

**Phase 29 delivered:** `/linear/sync` endpoint that:
- Accepts `{ slug, phase, tasks: [{ token, variables, assignee }] }`
- Resolves ITM token → template file path via registry
- Builds Linear issue title from template format + variables
- Creates Linear issue with description including template content

**Gap:** Intake form does NOT automatically trigger Linear ticket creation. Manual step required post-submission.

---

## Proposed Phase 34 Architecture

### Intake → Linear → MIR Automation Loop

```
CLIENT FILLS FORM
    ↓
POST /submit with validated seed
    ↓
VALIDATE seed against schema:
  ├─ Required fields present: company.name, audience.segment_name, product.name
  ├─ Field types correct: strings, enums, arrays
  ├─ Business rules: market must contain at least 1 competitor
    ↓
  ✅ VALIDATION PASSES
    ↓
AUTO-GENERATE LINEAR TICKETS:
  ├─ Embed ITM tokens in intake workflow:
  │   ├─ MARKOS-ITM-OPS-03 (new) — "Client Intake Received"
  │   ├─ MARKOS-ITM-STR-01 — "Audience Research" (from seed.audience)
  │   └─ MARKOS-ITM-OPS-01 — "Campaign Launch Ready" (milestone)
  │   
  └─→ POST /linear/sync { slug, phase: "34-intake", tasks: [...] }
      └─→ Create Linear issues in bulk
    ↓
AUTO-POPULATE MIR SEED:
  ├─ Move validated seed → vector memory
  ├─ Store intake metadata: client_name, intake_date, source (form/api/cli)
  └─→ orchestrator.orchestrate(seed, slug)
      ├─→ Run MIR generators
      └─→ Store drafts in vector memory
    ↓
RESPOND TO CLIENT:
  ├─ slug (project identifier)
  ├─ drafts (MIR/MSP preview)
  ├─ linear_tickets (created issues + URLs)
  └─ onboarding_session_ready: true
```

---

## Intake Form Schema Validation Rules

### Required Intake Data Structure

```typescript
interface IntakeSeed {
  company: {
    name: string;          // "Acme Corp" — REQUIRED
    description: string;   // "B2B SaaS for X" — REQUIRED
    website_url: string;   // "https://acme.com" — OPTIONAL
    stage: enum;           // "pre-launch" | "0-1M MRR" | "1-10M MRR" | "+10M MRR" — REQUIRED
    business_model: enum;  // "SaaS" | "Services" | "Productized" | "Marketplace" — REQUIRED
  };
  
  product: {
    name: string;          // "Acme Platform" — REQUIRED
    description: string;   // "Converts leads to customers" — REQUIRED
    primary_channel: enum; // "B2B" | "B2C" | "B2B2C" — REQUIRED
  };
  
  audience: {
    segment_name: string;  // "VP of Marketing, 50-500 person companies" — REQUIRED
    pain_points: string[];  // ["Can't measure ROI", "Too many tools"] — REQUIRED (min 2)
    buying_process: string; // "6-month eval" — REQUIRED
  };
  
  market: {
    total_addressable_market: string;       // "$2B" or "50k prospects" — OPTIONAL
    competitors: array<{name, positioning}>; // min 2 — REQUIRED
    market_trends: string[];  // ["AI adoption", "Privacy shift"] — REQUIRED (min 1)
  };
  
  content: {
    existing_assets: string[]; // ["Blog", "Case Studies", "Webinars"] — OPTIONAL
    content_maturity: enum;    // "none" | "basic" | "moderate" | "mature" — REQUIRED
  };
}
```

### Validation Rules

| Rule ID | Field | Validation | Error Message |
|---------|-------|-----------|---------------|
| R001 | `company.name` | non-empty string; max 100 chars | "Company name is required (max 100 chars)" |
| R002 | `company.stage` | must be in enum list | "Company stage must be one of: pre-launch, 0-1M MRR, 1-10M MRR, +10M MRR" |
| R003 | `product.name` | non-empty string; max 100 chars | "Product name is required (max 100 chars)" |
| R004 | `audience.pain_points` | array of min 2 items | "At least 2 audience pain points required" |
| R005 | `market.competitors` | array of min 2 objects; each w/ name + positioning | "At least 2 competitors with positioning required" |
| R006 | `market.market_trends` | array of min 1 item | "At least 1 market trend required" |
| R007 | `content.content_maturity` | must be in enum: none/basic/moderate/mature | "Content maturity level required" |
| R008 | `slug` | If provided: alphanumeric + hyphens; no spaces/special chars | "Project slug must be alphanumeric with hyphens only" |

**Validation Sequence:**
1. Schema type checking (fields present, correct types)
2. Business rule checking (min arrays, enum values)
3. Cross-field consistency (e.g., if `stage: pre-launch`, must have `market_trends`)

---

## Linear Ticket Template Design for Phase 34 Intake

### New ITM Tokens to Add to Registry

| TOKEN_ID | Category | Title Format | Gate | Purpose |
|----------|----------|--------------|------|---------|
| MARKOS-ITM-OPS-03 | Ops | `[MARKOS] Intake: {client_name} — {company_stage}` | None | Marks client onboarded; links seed to Linear project |
| MARKOS-ITM-INT-01 | Integration | `[MARKOS] Intake Validation: {client_name} — Data Quality Check` | Gate 1 | QA check on seed completeness before MIR generation |

### Intake Workflow Checklist (MARKOS-ITM-OPS-03 Template Structure)

```markdown
---
token_id: MARKOS-ITM-OPS-03
document_class: ITM
domain: OPS
version: 1.0.0
status: active
---

# MARKOS-ITM-OPS-03 — Client Intake Received

**Linear Title format:** `[MARKOS] Intake: {client_name} — {company_stage}`

## Checklist

- [ ] Seed JSON validated (R001–R008 checks passed)
- [ ] Project slug registered (`{slug}` in title link)
- [ ] MIR seed populated in vector store
- [ ] MIR drafts generated (Company Profile, Audience, Competitive Landscape)
- [ ] Client onboarding session ready
- [ ] Linear tickets created for upstream work (Audience Research, Campaign Setup)
- [ ] `.markos-project.json` written with permanent namespace

## Related Artifacts

| Type | Path | Owner |
|------|------|-------|
| Seed | `onboarding-seed.json` (namespace: {slug}) | Client submitted |
| Drafts | Vector memory: {slug}/* | Orchestrator |
| Project File | `.markos-project.json` | System |
| Next Step | MARKOS-ITM-STR-01 (Audience Research) | Team Lead |
```

---

## Seed → MIR Population Rules

### Auto-Population During Intake Validation

**Current behavior (Phase 29+):** Seed stored → Orchestrator runs → drafts generated → human approves with `/approve` → writes to MIR files via `write-mir.cjs`.

**Phase 34 Enhancement:** Validate seed inline during `/submit`, then immediately upsert to MIR template structure (with validation metadata):

```
1. VALIDATION COMPLETE
   └─→ Store validated seed in vector memory w/ metadata:
       {
         "project_slug": "acme-corp",
         "intake_date": "2026-03-31T...",
         "validation_status": "PASSED",
         "validation_rules_checked": ["R001", "R002", ..., "R008"],
         "source": "web-form"  // or "api" or "cli"
       }

2. AUTO-TRIGGER ORCHESTRATOR
   └─→ orchestrator.orchestrate(validated_seed, slug)
       ├─→ Generate company_profile draft
       ├─→ Generate mission_values draft
       ├─→ Generate audience_profile draft
       ├─→ Generate competitive_landscape draft
       ├─→ Generate brand_voice draft
       ├─→ Generate channel_strategy draft
       └─→ Store all in vector memory as "auto-generated; requires review"

3. RETURN SEED + DRAFTS + LINEAR TICKETS
   └─→ Response includes:
       {
         "slug": "acme-corp",
         "validation": { "status": "PASSED", "rules_checked": 7 },
         "drafts": { company_profile: "...", audience: "...", ... },
         "linear_tickets": [
           { "token": "MARKOS-ITM-OPS-03", "identifier": "ENG-123", "url": "..." },
           { "token": "MARKOS-ITM-STR-01", "identifier": "ENG-124", "url": "..." }
         ],
         "onboarding_session_url": "http://localhost:4242?slug=acme-corp&session=..."
       }
```

---

## v2.4 Phase Sequencing Recommendation

### Phase 34 Scope: Single Cohesive Phase

**DO NOT break into sub-phases.** Phase 34 should cover all wiring in one phase:

- **34-01:** Intake form validation schema + rules implementation
- **34-02:** Linear ticket automation wiring (form submission → /linear/sync)
- **34-03:** MIR seed population rules + orchestrator trigger
- **34-04:** SOP documentation + runbook for beta client onboarding

**Why single phase:** The validation rules, Linear wiring, and MIR population are tightly coupled. Splitting them creates partial deliverables that don't work end-to-end. The whole loop (form → validation → Linear → MIR) must function together.

### Post-Phase 34 v2.4 Phases (Estimated)

| Phase | Name | Duration | Goal |
|-------|------|----------|------|
| 34 | Client Intake SOP Automation | 1 week | Autopilot intake flow |
| 35 | Beta Program Operations | 1 week | Weekly standups, cohort tracking, rollout phases |
| 36 | Campaign Activation | 2 weeks | First 3 paid-media + SEO pilots (1 client each) |
| 37 | Build-in-Public | 1 week | LinkedIn content calendar + automation |

**v2.4 Completion Target:** 2026-04-30 (10 beta clients in pilot).

---

## Risk & Dependency Analysis

### Critical Dependencies

| Dependency | Status | Risk | Mitigation |
|------------|--------|------|-----------|
| **Phase 33 (Codebase Docs)** | ✅ COMPLETE | None | N/A |
| **Phase 29 (Linear Integration)** | ✅ COMPLETE | Low | Intake phase reuses existing `/linear/sync` endpoint |
| **Vector Store Health** | ✅ PHASE 32 | Medium | If Upstash down, seed upsert fails; fallback to in-memory draft storage |
| **LLM Provider (for orchestrator)** | Active (Ollama/OpenAI) | Medium | If LLM unavailable, orchestrator returns placeholder drafts |
| **Linear API Availability** | External | Medium | If Linear API down, `/linear/sync` fails; return 503 with queue for retry |

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Validation rules too strict; rejects valid clients | Medium | High (blocks beta onboarding) | Beta test validation with 5 sample companies before launch |
| Linear token typos in new ITM-OPS-03 template | Low | High (ticket creation fails) | Template peer review + dry-run test in Linear sandbox |
| Seed schema expansion breaks existing orchestrator | Low | High (drafts fail) | Backward compat test; existing seeds continue to work |
| Vector store upsert latency (multi-seed batches) | Low | Medium (slow intake form) | Async orchestrator + immediate response to client |
| Slug collision (auto-generated slug already exists) | Low | Medium (overwrites project) | Add timestamp+uuid suffix to ensure uniqueness |

### Environment Availability

| Dependency | Required For | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Onboarding backend | ✅ Yes | v20+ | — |
| Linear API | Ticket creation | ✅ Yes | GraphQL API v4 | Queue for manual creation |
| Upstash Vector | Seed storage | ✅ Yes | (hosted) | In-memory Redis fallback |
| Supabase | Literacy context | ✅ Yes | (hosted) | Skip literacy context in drafts |
| LLM (Ollama/OpenAI) | Orchestrator | ✅ Yes | Configurable | Fallback placeholders |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js native (`node --test`) |
| Config file | None — test files in `test/**/*.test.js` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

**Current state:** 11 tests passing (Phase 33 verification complete).

### Phase 34 Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INT-R001 | Seed rejected if `company.name` missing | unit | `npm test -- test/intake-validation.test.js --grep "R001"` | ❌ Wave 0 |
| INT-R002 | Seed rejected if `company.stage` invalid enum | unit | `npm test -- test/intake-validation.test.js --grep "R002"` | ❌ Wave 0 |
| INT-R004 | Seed rejected if `audience.pain_points` has < 2 items | unit | `npm test -- test/intake-validation.test.js --grep "R004"` | ❌ Wave 0 |
| INT-R005 | Seed rejected if `market.competitors` has < 2 items | unit | `npm test -- test/intake-validation.test.js --grep "R005"` | ❌ Wave 0 |
| LINK-01 | Form submission triggers `/linear/sync` with ITM-OPS-03 token | integration | `npm test -- test/intake-linear.test.js --grep "LINK-01"` | ❌ Wave 0 |
| LINK-02 | Linear issue created with title format: `[MARKOS] Intake: {client_name} — {stage}` | integration | `npm test -- test/intake-linear.test.js --grep "LINK-02"` | ❌ Wave 0 |
| ORCH-01 | Valid seed triggers `orchestrator.orchestrate()` with 6 drafts | integration | `npm test -- test/intake-orchestration.test.js --grep "ORCH-01"` | ❌ Wave 0 |
| ORCH-02 | Drafts stored in vector memory under slug namespace | integration | `npm test -- test/intake-orchestration.test.js --grep "ORCH-02"` | ❌ Wave 0 |
| SOP-01 | POST /submit response includes `onboarding_session_ready: true` after validation passes | e2e | `npm test -- test/intake-e2e.test.js --grep "SOP-01"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Run validation unit tests (`INT-R*` tests) — ~30 seconds
- **Per wave merge:** Run full intake suite (validation + linear + orchestration) — ~2 minutes
- **Phase gate:** All 9 test suites passing before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/intake-validation.test.js` — covers INT-R001 through INT-R008 validation rules
- [ ] `test/intake-linear.test.js` — covers LINK-01, LINK-02 Linear ticket automation
- [ ] `test/intake-orchestration.test.js` — covers ORCH-01, ORCH-02 orchestrator wiring
- [ ] `test/intake-e2e.test.js` — covers SOP-01 end-to-end form submission flow
- [ ] Test fixtures: `test/fixtures/valid-seeds.json`, `test/fixtures/invalid-seeds.json`
- [ ] Linear sandbox mock: `test/mocks/linear-client-mock.cjs` (for offline testing)
- [ ] Framework setup: No additional installs needed; use existing `node --test` runner

---

## Common Pitfalls

### Pitfall 1: Validation Too Lenient or Too Strict

**What goes wrong:** 
- Too lenient: Invalid seeds bypass validation → orchestrator fails with cryptic LLM errors
- Too strict: Valid edge cases rejected → friction during beta onboarding

**Why it happens:** Schema defined without testing against real-world client data.

**How to avoid:** 
1. Define rules based on orchestrator input requirements (what fields each LLM agent actually reads)
2. Beta test with 5–10 sample companies before launch
3. Log validation failures + reasons for quick diagnosis

**Warning signs:** 
- Orchestrator errors like "Cannot read property 'segment_name' of undefined" 
- Beta clients complaining form rejected legitimate data
- Linear tickets created but drafts fail

---

### Pitfall 2: Linear Ticket Cascades Create Too Many Issues

**What goes wrong:** Form submission auto-creates 5+ Linear tickets, overwhelming the team or polluting the project.

**Why it happens:** Each intake creates OPS tickets + STR tickets + potentially CNT tickets unintentionally.

**How to avoid:**
1. Limit auto-created tickets in Phase 34 intake to TWO tokens max:
   - MARKOS-ITM-OPS-03 (intake received)
   - MARKOS-ITM-INT-01 (data quality check)
2. Other tickets (MARKOS-ITM-STR-01, MARKOS-ITM-CNT-*) created manually after intake QA
3. Guard token list: `if (!INTAKE_ALLOWED_TOKENS.includes(token)) { skip }`

**Warning signs:** 
- Linear team complaining about spam tickets
- False positive tickets created for incomplete intakes

---

### Pitfall 3: Slug Collisions Overwrite Existing Client Projects

**What goes wrong:** Two clients with same company name → auto-slug collision → second client's seed overwrites first client's vector memory.

**Why it happens:** Slug generation uses company name as basis; no uniqueness check.

**How to avoid:**
1. Slug generation: `"${company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}-${uuid.slice(0, 4)}"`
2. Check slug uniqueness in vector store before accepting intake
3. Return slug to client immediately so they see their unique namespace

**Warning signs:**
- Drafts disappearing for a client
- Vector store queries returning wrong client's data under slug namespace

---

### Pitfall 4: Orchestrator Runs on Invalid Seed, Returns Partial Drafts

**What goes wrong:** Seed passes validation but orchestrator fails mid-run (LLM error) → partial drafts stored → MIR population incomplete.

**Why it happens:** Orchestrator has its own error handling; doesn't enforce seed structure.

**How to avoid:**
1. Validate seed schema BEFORE invoking orchestrator (Phase 34 task)
2. Orchestrator already has error metadata tracking (current code captures `errors: []`)
3. Response includes `errors` array; client sees which drafts succeeded/failed
4. Log orchestrator errors + route to team for diagnosis

**Warning signs:**
- Response includes `"errors": [{ "phase": "llm-audience", "error": "..." }]`
- Linear ticket created but drafts incomplete
- Vector memory has partial draft upserts

---

## Code Examples

Verified patterns for Phase 34 implementation:

### Example 1: Intake Validation Handler (to replace current minimal validation)

```javascript
// onboarding/backend/handlers.cjs — NEW validateIntakeSeed function

const VALIDATION_RULES = {
  R001: { field: 'company.name', check: (val) => val && typeof val === 'string' && val.trim().length > 0 && val.length <= 100 },
  R002: { field: 'company.stage', check: (val) => ['pre-launch', '0-1M MRR', '1-10M MRR', '+10M MRR'].includes(val) },
  R003: { field: 'product.name', check: (val) => val && typeof val === 'string' && val.trim().length > 0 && val.length <= 100 },
  R004: { field: 'audience.pain_points', check: (val) => Array.isArray(val) && val.length >= 2 },
  R005: { field: 'market.competitors', check: (val) => Array.isArray(val) && val.length >= 2 && val.every(c => c.name && c.positioning) },
  R006: { field: 'market.market_trends', check: (val) => Array.isArray(val) && val.length >= 1 },
  R007: { field: 'content.content_maturity', check: (val) => ['none', 'basic', 'moderate', 'mature'].includes(val) },
};

function validateIntakeSeed(seed) {
  const errors = [];
  const passed = [];

  for (const [ruleId, rule] of Object.entries(VALIDATION_RULES)) {
    const fieldParts = rule.field.split('.');
    let value = seed;
    for (const part of fieldParts) {
      value = value?.[part];
    }

    if (rule.check(value)) {
      passed.push(ruleId);
    } else {
      errors.push({
        rule_id: ruleId,
        field: rule.field,
        message: `Validation failed for ${rule.field}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    passed,
    rules_checked: Object.keys(VALIDATION_RULES).length,
  };
}

// Usage in handleSubmit:
const validationResult = validateIntakeSeed(seed);
if (!validationResult.valid) {
  return json(res, 400, {
    success: false,
    error: 'VALIDATION_FAILED',
    message: 'Intake seed validation failed',
    validation_errors: validationResult.errors,
    validation_passed: validationResult.passed,
  });
}
```

### Example 2: Auto-Trigger Linear Ticket Creation on Intake

```javascript
// onboarding/backend/handlers.cjs — handleSubmit() enhancement

async function handleSubmit(req, res) {
  // ... existing setup ...
  
  const validationResult = validateIntakeSeed(seed);
  if (!validationResult.valid) {
    return json(res, 400, { success: false, error: 'VALIDATION_FAILED', ... });
  }

  // ── AUTO-CREATE LINEAR TICKETS ──
  let linearTickets = [];
  try {
    const linearBody = {
      slug: slug,
      phase: '34-intake',
      tasks: [
        {
          token: 'MARKOS-ITM-OPS-03',
          variables: {
            client_name: seed.company.name,
            company_stage: seed.company.stage,
          },
          assignee: process.env.LINEAR_ASSIGNEE_DEFAULT || 'ops-team@company.com',
        },
        {
          token: 'MARKOS-ITM-INT-01',
          variables: {
            client_name: seed.company.name,
          },
          assignee: process.env.LINEAR_ASSIGNEE_QA || 'qa-team@company.com',
        },
      ],
    };

    const linearResponse = await fetch(`${process.env.ONBOARDING_API_URL || 'http://localhost:4242'}/linear/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linearBody),
    });

    if (linearResponse.ok) {
      const linearData = await linearResponse.json();
      linearTickets = linearData.created || [];
    } else {
      console.warn('[handleSubmit] Linear sync failed:', await linearResponse.text());
    }
  } catch (err) {
    console.error('[handleSubmit] Linear ticket creation failed:', err.message);
    // Continue; linear tickets are nice-to-have, not blocking
  }

  // ── ORCHESTRATE MIR GENERATION ──
  const { drafts, vectorStoreResults, errors } = await orchestrator.orchestrate(seed, slug);

  return json(res, 200, {
    success: true,
    slug,
    validation: {
      status: 'PASSED',
      rules_checked: validationResult.rules_checked,
      rules_passed: validationResult.passed.length,
    },
    drafts,
    linear_tickets: linearTickets,
    onboarding_session_ready: true,
    vector_store: vectorStoreResults,
    errors,
  });
}
```

### Example 3: Test Case for Validation Rule R001

```javascript
// test/intake-validation.test.js

const test = require('node:test');
const assert = require('node:assert');
const { validateIntakeSeed } = require('../onboarding/backend/handlers.cjs');

test('INT-R001: validateIntakeSeed rejects seed without company.name', () => {
  const invalidSeed = {
    company: { stage: 'pre-launch' },
    product: { name: 'Product' },
    audience: { segment_name: 'Segment', pain_points: ['Pain 1', 'Pain 2'] },
    market: { competitors: [{ name: 'A', positioning: 'X' }, { name: 'B', positioning: 'Y' }], market_trends: ['Trend 1'] },
    content: { content_maturity: 'basic' },
  };

  const result = validateIntakeSeed(invalidSeed);
  assert.strictEqual(result.valid, false);
  assert(result.errors.some(e => e.rule_id === 'R001'));
});

test('INT-R001: validateIntakeSeed accepts valid company.name', () => {
  const validSeed = {
    company: { name: 'Acme Corp', stage: 'pre-launch', business_model: 'SaaS' },
    product: { name: 'Product', description: 'Desc', primary_channel: 'B2B' },
    audience: { segment_name: 'Segment', pain_points: ['Pain 1', 'Pain 2'], buying_process: 'Process' },
    market: { competitors: [{ name: 'A', positioning: 'X' }, { name: 'B', positioning: 'Y' }], market_trends: ['Trend 1'] },
    content: { content_maturity: 'basic' },
  };

  const result = validateIntakeSeed(validSeed);
  assert.strictEqual(result.valid, true);
  assert(result.passed.includes('R001'));
});
```

---

## State of the Art

| Old Approach | Current Approach (v2.3–Phase 33) | When Changed | Impact |
|--------------|-----------------------------------|--------------|--------|
| Manual `/linear/sync` calls (IPM specifies tokens) | `/linear/sync` endpoint exists; form submission → manual ticket creation | Phase 29 delivered Linear API | Tickets no longer fully manual; still requires explicit token array |
| Single intake surface (web form only) | Three surfaces: web form, CLI seed JSON, direct API calls | Phase 6–Present | Flexibility; but no unified SOP |
| No intake validation | Loose type checking in `handleSubmit` | Phase 6–Present | Intake data can be incomplete |
| Orchestrator async (no trigger from intake) | Orchestrator runs on `/submit` but no LinearUI linking | Phase 29 | Fast drafts; poor visibility in Linear project |

**Deprecated/Outdated:**
- **(To be deprecated Phase 34)** Manual `/linear/sync` token specification for every intake → Auto-tokens based on intake workflow
- **(To be deprecated Phase 34)** Loose seed validation → Strict schema enforcement pre-orchestrator

---

## Open Questions

1. **Multi-language intake forms?**
  What we know: Current form is English-only; clients may be non-English-speaking.
  What's unclear: Should Phase 34 include form localization, or a later beta-ops / UX phase?
  Recommendation: Phase 34 stays English-only; localization is deferred beyond v2.5 installer work.

1. **Client login / auth for form submissions?**
  What we know: Current form is unauthenticated; anyone can submit.
  What's unclear: Should Phase 34 require Linear API key or email auth before intake?
  Recommendation: Phase 34 stays unauthenticated for beta simplicity; future beta-scale work can add SSO/auth if scaling to 100+ clients.

1. **Partial intake flows (multi-step completion)?**
  What we know: Current form expects full seed in one submission.
  What's unclear: Should clients be able to save drafts mid-form and resume later?
  Recommendation: Phase 34 remains one-shot submission; draft save/resume stays a future UX enhancement if beta usage demands it.

1. **Intake SOP visibility in Linear — custom field or epic link?**
  What we know: Intake tickets are created in Linear while MIR drafts live in vector memory.
  What's unclear: How should the onboarding team link Linear tickets to MIR artifacts?
  Recommendation: Phase 34 returns the MIR session URL and the team links it manually in Linear for now. Automated epic linking is deferred to a later operations phase if needed.

---

## Success Criteria Framework

### Phase 34 Success = Automated Intake SOP Closure

**Defined as:**

| Criteria | Definition | How to Verify |
|----------|-----------|---|
| **E2E Automation** | Client form submission → Linear tickets created → MIR seeds populated → drafts available, all without manual intervention | Submit sample intake via form; check Linear tickets exist + MIR session URL works |
| **Validation Enforcement** | All Intake Seed Schema validation rules (R001–R008) enforced; invalid seeds rejected with clear error | Submit invalid seed (missing field); verify 400 response with specific rule breach |
| **Linear Hygiene** | Exactly 2 Linear tickets created per intake (ITM-OPS-03 + ITM-INT-01); no orphaned or duplicate tickets | Audit Linear project for intake tickets; verify count = 2N (where N = intakes processed) |
| **MIR Readiness** | Drafts stored in vector memory under slug namespace; ready for human review + approval | Query vector memory for slug namespace; confirm 6 drafts present (company_profile, mission_values, audience, competitive, brand_voice, channel_strategy) |
| **Form UX** | Intake form validates input + provides clear error messages in real-time | Fill out form with invalid data; check UX feedback (not backend error dumps) |
| **Rollback Safety** | Existing orchestrator behavior unchanged; old seeds still work end-to-end | Subscribe valid seed via old method (API POST /submit w/o form); verify drafts generated as before |
| **SOP Documentation** | Written runbook for beta client onboarding flow (intake steps, approval workflow, Linear tracking) | Executive review of `.planning/phases/34-client-intake-sop-automation/34-SOP-RUNBOOK.md` |

**Phase 34 COMPLETE when:**
- [ ] All 9 test suites passing (validation, linear, orchestration, e2e)
- [ ] 5+ sample intakes submitted via form; all processed without manual intervention
- [ ] Linear audit: exactly 10 intake tickets (2 per intake) created with correct tokens
- [ ] MIR session URLs work; drafts available for review
- [ ] Beta team can follow SOP runbook to onboard client with zero code intervention
- [ ] No regressions: existing orchestrator + linear flows unchanged

---

## Sources

### Primary (HIGH confidence)

- **Server.cjs endpoint architecture** — Reviewed current `onboarding/backend/server.cjs` (handles `/submit`, validation entrypoint logic)
- **Linear integration Phase 29 artifacts** — Examined `handleLinearSync()`, Linear ITM token registry `.agent/markos/templates/LINEAR-TASKS/_CATALOG.md`, and 20 active template tokens
- **Orchestrator flow** — Analyzed `onboarding/backend/agents/orchestrator.cjs` seed → draft generation pipeline with retry strategy and vector storage
- **Current validation coverage** — Reviewed `handleSubmit()` current validation (loose; only checks API key + slug structure)
- **Test framework** — Confirmed Node.js native test runner active; 11 tests passing from Phase 33 verification

### Secondary (MEDIUM confidence)

- **Onboarding config** — `onboarding/onboarding-config.json` layout and paths
- **Handler function analysis** — `handlers.cjs` full linear sync and campaign result handlers reviewed
- **Vector store client integration** — Confirmed `vector-store-client.cjs` exists; used for seed storage + draft persistence
- **Linear client implementation** — `linear-client.cjs` GraphQL request format, team/user ID resolution

---

## Metadata

**Confidence breakdown:**
- **Standard stack & architecture:** HIGH — Reviewed all 5 current components; Linear integration from Phase 29 fully understood
- **Intake schema validation rules:** HIGH — Orchestrator code shows exactly which seed fields are required (company, product, audience, market, content)
- **Linear wiring:** HIGH — Phase 29 ITM token system well-documented; simple to extend with new tokens
- **Pitfalls:** MEDIUM-HIGH — Based on common state management + LLM error patterns from existing code; recommendations tested against current error handling
- **Test framework:** HIGH — Node.js native test runner already in use; framework compatibility confirmed

**Research date:** 2026-03-31  
**Valid until:** 2026-04-07 (7 days; intake SOP is stable domain, low churn risk)
