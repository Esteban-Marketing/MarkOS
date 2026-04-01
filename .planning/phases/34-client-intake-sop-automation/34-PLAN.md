---
phase: 34
phase_name: Client Intake SOP Automation
milestone: v2.4
milestone_name: Beta Client Onboarding
plan_created: "2026-03-31"
type: execute
wave: 1
depends_on: []
files_modified:
  - onboarding/backend/server.cjs
  - onboarding/backend/handlers/submit.cjs
  - test/intake-validation.test.js
  - test/intake-linear.test.js
  - test/intake-orchestration.test.js
  - test/intake-e2e.test.js
  - test/fixtures/valid-seeds.json
  - test/fixtures/invalid-seeds.json
  - test/mocks/linear-client-mock.cjs
  - .agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-03.md
  - .agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-INT-01.md
  - .planning/codebase/INTAKE-SOP.md
  - .planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md
  - .planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md
  - .planning/phases/34-client-intake-sop-automation/34-LINEAR-CHECKLIST.md
autonomous: true
requirements: [BETA-01]
user_setup: []

must_haves:
  truths:
    - "Client form submission is validated against 8 rules (R001–R008) before acceptance"
    - "Valid intake automatically creates Linear tickets with MARKOS-ITM-OPS-03 + MARKOS-ITM-INT-01 tokens"
    - "Valid intake auto-triggers orchestrator, generating 6 MIR drafts in vector memory"
    - "Response includes slug, validation metadata, created Linear tickets, and session URL"
    - "Invalid intake returns 400 with specific validation error message (per rule)"
    - "Slug uniqueness checked before acceptance; auto-appended with timestamp+uuid on collision"
    - "SOP workflow diagram, intake checklist, and validation reference available for beta team"
  
  artifacts:
    - path: onboarding/backend/server.cjs
      provides: "Enhanced POST /submit handler with validated intake flow"
      exports: ["handleSubmit() with validation + linear + orchestration wiring"]
    - path: onboarding/backend/handlers/submit.cjs
      provides: "Extracted validation & Linear wiring logic (DRY pattern)"
      exports: ["validateIntakeSeed(), triggerLinearTickets(), ensureUniqueSlug()"]
    - path: test/intake-validation.test.js
      provides: "Unit tests for R001–R008 validation rules"
      tests: ["R001 company.name required", "R002 company.stage enum", "R004 pain_points min 2", "R005 competitors min 2", "R006 trends min 1", "R007 content_maturity enum", "R008 slug format", "Cross-field consistency"]
    - path: test/intake-linear.test.js
      provides: "Integration tests for Linear ticket creation"
      tests: ["LINK-01 form submission → /linear/sync", "LINK-02 ticket title format", "LINK-03 token validation guards"]
    - path: test/intake-orchestration.test.js
      provides: "Integration tests for MIR seed population"
      tests: ["ORCH-01 orchestrator invocation", "ORCH-02 vector memory upsert", "ORCH-03 error handling"]
    - path: test/intake-e2e.test.js
      provides: "End-to-end intake flow test"
      tests: ["SOP-01 complete form → validation → Linear → MIR → session"]
    - path: .agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-03.md
      provides: "ITM template for 'Client Intake Received' tickets"
      format: "Checklist + artifacts table (8 items)"
    - path: .agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-INT-01.md
      provides: "ITM template for 'Intake Validation: Data Quality Check' tickets"
      format: "Validation criteria + next steps"
    - path: .planning/codebase/INTAKE-SOP.md
      provides: "High-level intake workflow diagram + architecture summary"
      audience: "Beta team leads, ops"
    - path: .planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md
      provides: "Step-by-step runbook for beta onboarding flow"
      sections: ["Pre-intake checks", "Form submission", "Validation flow", "Linear tracking", "MIR seed population", "Session handoff", "Troubleshooting"]
    - path: .planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md
      provides: "Reference table for all 8 validation rules + examples"
      table: "R001–R008 with error messages, test cases, mitigation steps"
    - path: .planning/phases/34-client-intake-sop-automation/34-LINEAR-CHECKLIST.md
      provides: "Linear ticket checklist + guard rails for intake automation"
      items: "Allowed tokens, title format, description template, assignee rules"

  key_links:
    - from: "onboarding/backend/server.cjs::handleSubmit()"
      to: "onboarding/backend/handlers/submit.cjs::validateIntakeSeed()"
      via: "Call validation before processing"
      pattern: "if (!validated) { return 400 }"
    - from: "validateIntakeSeed()"
      to: "ensureUniqueSlug()"
      via: "Check slug uniqueness in vector store"
      pattern: "vectorStore.exists(slug) → append timestamp"
    - from: "handleSubmit() (valid seed)"
      to: "/linear/sync endpoint (Phase 29)"
      via: "POST with MARKOS-ITM-OPS-03 + MARKOS-ITM-INT-01 tasks"
      pattern: "fetch('/linear/sync', { phase: '34-intake', tasks: [...] })"
    - from: "POST /linear/sync response"
      to: "orchestrator.orchestrate(seed, slug)"
      via: "Async invoke orchestrator on successful validation"
      pattern: "orchestrator code: orchestrate(seed, slug) → 6 drafts"
    - from: "orchestra.orchestrate() complete"
      to: "Vector memory upsert"
      via: "Store drafted MIR files under {slug}/* namespace"
      pattern: "vectorMemory.upsert(slug, drafts)"
    - from: "Vector memory upsert complete"
      to: "POST /submit response"
      via: "Return slug, validation metadata, Linear ticket URLs, session URL"
      pattern: "response.json({ slug, validation, linear_tickets, onboarding_session_url })"
---

# Phase 34: Client Intake SOP Automation

**Objective**

Ship an autopilot client intake flow that consolidates form submission, validates against 8 rules, auto-creates Linear tickets for tracking, and seeds MIR/MSP generation—all in one POST `/submit` call. Target: zero-touch onboarding for beta agency clients.

**Purpose**

Phase 33 delivered canonical documentation; Phase 29 provided Linear integration. Phase 34 wires them together: takes client intake form data, validates it rigorously, creates Linear tracking tickets, and immediately seeds the MIR/MSP generation loop without manual intervention. This is the ops backbone of v2.4 beta onboarding.

**Output**

- Intake form validation schema (8 rules) + implementation
- Linear ticket automation wired to form submission
- MIR seed population rules + orchestrator trigger
- SOP documentation + runbook for beta team
- 9 tests (4 unit, 2 Linear integration, 2 MIR integration, 1 e2e) covering validation → Linear → orchestration flow

**Duration**

Target: 1 week (delivery by 2026-04-07)

---

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/34-client-intake-sop-automation/34-RESEARCH.md

## Key Source Files (Current Architecture)

From [onboarding/backend/server.cjs](onboarding/backend/server.cjs):
```javascript
// Current /submit handler — minimal validation
async function handleSubmit(req, res) {
  const { slug: bodySlug } = req.body;
  const slug = bodySlug || generateSlug(req.body.company?.name);
  
  // CURRENT: Only checks API key + slug resolution
  const secretCheck = process.env.ONBOARDING_SECRET_KEY ? true : null;
  
  // NO validation on seed structure
  const orchestration = await orchestrator.orchestrate(req.body, slug);
  
  res.json({ slug, orchestration });
}
```

This will be enhanced with:
1. Full seed schema validation (validateIntakeSeed + 8 rules)
2. Slug uniqueness check + auto-append on collision
3. Linear automation trigger (triggerLinearTickets via Phase 29 `/linear/sync`)
4. MIR seed population metadata

From [test/](test/):
- Running: 11 tests passing (all Phase 33 verification)
- Needed: 9 new tests (see Wave breakdown)

From [.agent/markos/templates/LINEAR-TASKS/](../.agent/markos/templates/LINEAR-TASKS/):
- Existing ITM templates: 20 active (include MARKOS-ITM-STR-01, MARKOS-ITM-OPS-01)
- New: MARKOS-ITM-OPS-03, MARKOS-ITM-INT-01 to be created

## Validation Rules (From Research)

| Rule | Field | Check | Error |
|------|-------|-------|-------|
| R001 | `company.name` | Present + non-empty + max 100 chars | "Company name is required (max 100 chars)" |
| R002 | `company.stage` | In enum: pre-launch, 0–1M, 1–10M, +10M | "Company stage must be one of: ..." |
| R003 | `product.name` | Present + non-empty + max 100 chars | "Product name is required (max 100 chars)" |
| R004 | `audience.pain_points` | Array of min 2 items | "At least 2 audience pain points required" |
| R005 | `market.competitors` | Array of min 2 objects w/ name + positioning | "At least 2 competitors with positioning required" |
| R006 | `market.market_trends` | Array of min 1 item | "At least 1 market trend required" |
| R007 | `content.content_maturity` | In enum: none, basic, moderate, mature | "Content maturity level required" |
| R008 | `slug` | Alphanumeric + hyphens only (if provided) | "Project slug must be alphanumeric with hyphens only" |

## Linear Ticket Format

Tickets created with ITM tokens MARKOS-ITM-OPS-03 (intake received) and MARKOS-ITM-INT-01 (data quality):
- Title: `[MARKOS] Intake: {company_name} — {company_stage}`
- Description: Template pulled from `.agent/markos/templates/LINEAR-TASKS/{token}.md`
- Linked to project slug in description

## MIR Population Pattern (Phase 29 Reference)

From Phase 29 SUMMARY: `/linear/sync` accepts `{ slug, phase, tasks: [{token, variables, assignee}] }` and creates issues. Phase 34 reuses this pattern for ticketing, then immediately calls orchestrator on validation pass.

## Constraints

- **Do NOT modify Phase 29** `/linear/sync` endpoint; reuse as-is
- **Do NOT change onboarding form schema**; only enhance validation
- **Auto-created tickets**: Limited to MARKOS-ITM-OPS-03 + MARKOS-ITM-INT-01 (no cascading)
- **Local + Hosted**: Must support both runtimes (env-specific Vector Store + Linear token handling)
- **Test coverage**: 9 tests required before phase complete (4 unit, 2 Linear, 2 orchestration, 1 e2e)

</context>

<interfaces>

### Vector Store (Upstash Redis) Interface

From Phase 32 + existing code:
```typescript
// Used for slug uniqueness check + seed/draft storage
vectorMemory.exists(key: string): Promise<boolean>
vectorMemory.upsert(key: string, value: object): Promise<void>
vectorMemory.get(key: string): Promise<object | null>
```

### Linear API Client (Phase 29)

From Phase 29 integration:
```typescript
POST /linear/sync
Body: {
  slug: string;
  phase: string;  // "34-intake"
  tasks: Array<{
    token: string;  // "MARKOS-ITM-OPS-03", "MARKOS-ITM-INT-01"
    variables: Record<string, string>;  // {client_name, company_stage, ...}
    assignee?: string;
  }>
}
Response: {
  tickets: Array<{
    token: string;
    identifier: string;  // "ENG-123"
    url: string;  // "https://linear.app/..."
  }>;
  errors?: Array<string>;
}
```

### Orchestrator (Phase 27+)

From existing code:
```typescript
orchestrator.orchestrate(seed: IntakeSeed, slug: string): Promise<{
  drafts: Record<string, string>;  // {company_profile, audience, competitive_landscape, ...}
  errors: Array<{phase: string, error: string}>;
  metadata: {processed_at, source, ...}
}>
```

### Intake Seed Schema

```typescript
interface IntakeSeed {
  company: {
    name: string;  // "Acme Corp"
    description: string;  // "B2B SaaS..."
    website_url?: string;
    stage: "pre-launch" | "0-1M MRR" | "1-10M MRR" | "+10M MRR";
    business_model: "SaaS" | "Services" | "Productized" | "Marketplace";
  };
  product: {
    name: string;
    description: string;
    primary_channel: "B2B" | "B2C" | "B2B2C";
  };
  audience: {
    segment_name: string;
    pain_points: string[];  // min 2
    buying_process: string;
  };
  market: {
    total_addressable_market?: string;
    competitors: Array<{name: string, positioning: string}>;  // min 2
    market_trends: string[];  // min 1
  };
  content: {
    existing_assets?: string[];
    content_maturity: "none" | "basic" | "moderate" | "mature";
  };
}
```

</interfaces>

<tasks>

## Wave 0: Test Fixtures & Mocks (Foundation)

<task type="auto" tdd="true">
  <name>Task 0: Create test fixtures and mocks for intake validation</name>
  <files>test/fixtures/valid-seeds.json, test/fixtures/invalid-seeds.json, test/mocks/linear-client-mock.cjs</files>
  <behavior>
    - Valid seed fixtures: 5 diverse companies (pre-launch, 1–10M MRR, +10M; SaaS, Services, Marketplace models)
    - Invalid seed fixtures: 8 company profiles, each failing exactly ONE of R001–R008 rules (e.g., company.name missing, stage invalid enum, pain_points has only 1 item, etc.)
    - Linear API mock: Responds to POST /linear/sync with deterministic issue IDs (ENG-000, ENG-001, ...) and URLs
    - Mock supports both successful (200 + tickets) and error responses (503, 401, 400)
  </behavior>
  <action>
    Create three fixture files:

    1. **test/fixtures/valid-seeds.json** — Array of 5 complete, valid IntakeSeed objects:
       - Company A (pre-launch, SaaS startup)
       - Company B (0–1M MRR, Services agency)
       - Company C (1–10M MRR, Productized SaaS)
       - Company D (+10M MRR, Marketplace)
       - Company E (edge case: minimal but valid data)
       Each seed must pass all R001–R008 checks.

    2. **test/fixtures/invalid-seeds.json** — Object with 8 arrays, one per rule:
       - `invalid_r001`: Seeds missing or empty company.name
       - `invalid_r002`: Seeds with invalid company.stage values
       - `invalid_r003`: Seeds missing product.name
       - `invalid_r004`: Seeds with audience.pain_points < 2 items
       - `invalid_r005`: Seeds with market.competitors < 2 items
       - `invalid_r006`: Seeds with empty market.market_trends
       - `invalid_r007`: Seeds with invalid content.content_maturity
       - `invalid_r008`: Seeds with invalid slug format (spaces, special chars)
       Each seed should fail exactly one rule; other fields valid.

    3. **test/mocks/linear-client-mock.cjs** — CommonJS mock for Linear API:
       - Export function `mockLinearClient(opts)` taking `{ returnSuccess, delay, errorCode }`
       - Intercept POST /linear/sync calls (use Node.js http mocking library or built-in mocking)
       - On success: return `{ tickets: [{token, identifier: 'ENG-XXX', url}, ...] }`
       - On error: return `{ error: 'Linear API error', code: errorCode }`
       - Support delay simulation for timeout testing
       - Default: success with 2 tickets (OPS-03, INT-01)

    Use existing fixtures from Phase 29/32 as reference patterns if available.

    All files use JSON/CommonJS only; no dependencies beyond Node builtin.
  </action>
  <verify>
    - Files created: test/fixtures/valid-seeds.json, test/fixtures/invalid-seeds.json, test/mocks/linear-client-mock.cjs
    - Valid seeds file: 5 entries, all pass manual validation check (no linter errors)
    - Invalid seeds file: 8 arrays with min 2 entries each
    - Linear mock exports mockLinearClient function; can be required and instantiated
    - npm test runs without syntax errors (fixtures + mock loaded successfully)
  </verify>
  <done>
    Test fixtures + mocks committed. Ready for task 1 (unit tests).
  </done>
</task>

## Wave 1: Test Suite Creation (4 Unit + 2 Integration Linear)

<task type="auto" tdd="true">
  <name>Task 1: Write unit tests for intake validation rules (R001–R008)</name>
  <files>test/intake-validation.test.js</files>
  <behavior>
    - Test R001: company.name required, non-empty, max 100 chars
    - Test R002: company.stage in enum (pre-launch, 0–1M MRR, 1–10M MRR, +10M MRR)
    - Test R003: product.name required, non-empty, max 100 chars
    - Test R004: audience.pain_points array, min 2 items
    - Test R005: market.competitors array, min 2 items, each with name + positioning
    - Test R006: market.market_trends array, min 1 item
    - Test R007: content.content_maturity in enum (none, basic, moderate, mature)
    - Test R008: slug format (alphanumeric + hyphens only, if provided)
    - Cross-field: If stage is "pre-launch", market_trends must be present (consistency check)
    - Return specific error message per rule; error object includes `rule_id` and `field`
  </behavior>
  <action>
    1. Create `test/intake-validation.test.js` file using Node.js native test runner.
    2. Import validation function (not yet created) and fixtures from task 0: `validateIntakeSeed(seed)` → `{ valid: boolean, errors: Array<{rule_id, message, field}> }`.
    3. Write 9 test cases (R001–R008 + cross-field):
       - Each test: Load invalid seed from fixtures (invalid-seeds.json), call validator, assert `valid === false` and `errors[0].rule_id === 'R00X'`
       - One positive test: Load valid seed from fixtures, assert `valid === true` and `errors === []`
       - Edge case tests: boundary conditions (string max length, array min length)
    4. Error messages must match RESEARCH.md exactly (e.g., "Company name is required (max 100 chars)")
    5. Use `test()` function from Node.js `node:test` module; assertions from `node:assert` or `assert/strict`.
    6. Mock validator for now (implement in task 3).

    Example test structure:
    ```javascript
    import test from 'node:test';
    import assert from 'assert/strict';
    import { validateIntakeSeed } from '../onboarding/backend/handlers/submit.cjs';
    import { invalid_seeds } from '../test/fixtures/invalid-seeds.json';

    test('R001: company.name required', () => {
      const seed = invalid_seeds.invalid_r001[0];
      const result = validateIntakeSeed(seed);
      assert.equal(result.valid, false);
      assert.equal(result.errors[0].rule_id, 'R001');
      assert.match(result.errors[0].message, /Company name/);
    });
    ```

    All 9 tests must pass (green) by end of task 1.
  </action>
  <verify>
    <automated>npm test -- test/intake-validation.test.js</automated>
  </verify>
  <done>
    File: test/intake-validation.test.js
    Tests passing: 9/9 (mock validator raises NotImplementedError; tests define expected behavior before implementation)
    Coverage: All 8 rules + 1 cross-field consistency check
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Write integration tests for Linear ticket automation</name>
  <files>test/intake-linear.test.js</files>
  <behavior>
    - Test LINK-01: POST /submit with valid seed triggers POST /linear/sync with MARKOS-ITM-OPS-03 + MARKOS-ITM-INT-01 tokens
    - Test LINK-02: Linear ticket title matches format `[MARKOS] Intake: {company_name} — {company_stage}`
    - Test LINK-03: Invalid tokens are filtered out (guard against cascading ticket creation)
    - Test LINK-04: Linear API error (503) is caught and returned to client with status 503 (not a 500 failure)
    - Test LINK-05: Linear response is parsed and included in POST /submit response under `linear_tickets` key
  </behavior>
  <action>
    1. Create `test/intake-linear.test.js` using Node.js native test runner.
    2. Mock the `/linear/sync` endpoint using the mock from task 0 (test/mocks/linear-client-mock.cjs).
    3. Write 5 test cases:

       - **LINK-01:** Call handleSubmit() with valid seed → mock /linear/sync is called exactly once; payload includes `phase: '34-intake'` and `tasks: [{token: 'MARKOS-ITM-OPS-03', ...}, {token: 'MARKOS-ITM-INT-01', ...}]`
       - **LINK-02:** Assert ticket title construction: `assert.include(title, '[MARKOS] Intake:'); assert.include(title, 'Acme Corp'); assert.include(title, 'pre-launch')`
       - **LINK-03:** Inject a third token (e.g., 'MARKOS-ITM-STR-01') into tasks list; verify only OPS-03 + INT-01 are sent to /linear/sync (guard whitelist applied)
       - **LINK-04:** Mock /linear/sync to return 503 error; call handleSubmit(); assert response status is 503, not 500
       - **LINK-05:** Mock /linear/sync success; call handleSubmit(); assert response.json() includes `linear_tickets` array with entries `{token, identifier, url}`

    4. Use the linear-client-mock from task 0 for mocking.
    5. All tests must be isolated (no shared state between tests).

    Example:
    ```javascript
    test('LINK-01: form submission triggers /linear/sync', async () => {
      const linearMock = mockLinearClient({ returnSuccess: true });
      const seed = valid_seeds[0];
      
      const response = await handleSubmit({ body: seed }, mockRes);
      
      assert.equal(linearMock.callCount, 1);
      assert.equal(linearMock.lastCall.phase, '34-intake');
      assert.equal(linearMock.lastCall.tasks.length, 2);
    });
    ```
  </action>
  <verify>
    <automated>npm test -- test/intake-linear.test.js</automated>
  </verify>
  <done>
    File: test/intake-linear.test.js
    Tests passing: 5/5
    Coverage: Form → /linear/sync wiring validated; error handling confirmed
  </done>
</task>

## Wave 2: Orchestration Integration Tests (2 Tests + Handler Implementation)

<task type="auto" tdd="true">
  <name>Task 3: Write integration tests for MIR seed population via orchestrator</name>
  <files>test/intake-orchestration.test.js</files>
  <behavior>
    - Test ORCH-01: POST /submit with valid seed triggers orchestrator.orchestrate(seed, slug) exactly once
    - Test ORCH-02: Orchestrator response (6 drafts + metadata) is stored in vector memory under slug namespace
    - Test ORCH-03: If orchestrator returns errors (partial drafts), response includes `errors` array so client sees what failed
    - Test ORCH-04: Slug uniqueness check: if slug already exists in vector store, new slug is generated with timestamp+uuid suffix
  </behavior>
  <action>
    1. Create `test/intake-orchestration.test.js` using Node.js native test runner.
    2. Mock orchestrator.orchestrate() and vector memory (Upstash client).
    3. Write 4 test cases:

       - **ORCH-01:** Call handleSubmit() with valid seed → assert `orchestrator.orchestrate()` called exactly once with `(seed, slug)` arguments; slug matches expected format
       - **ORCH-02:** After orchestrate() succeeds, assert `vectorMemory.upsert()` called with key `${slug}/*` and value containing all 6 draft keys: company_profile, mission_values, audience_profile, competitive_landscape, brand_voice, channel_strategy
       - **ORCH-03:** Mock orchestrator to return `errors: [{phase: 'company-profile', error: 'LLM timeout'}]`; call handleSubmit(); assert response includes `errors` array with same content; client can see partial failure
       - **ORCH-04:** Mock vectorMemory.exists(slug) to return true; call handleSubmit(); assert new slug is generated with format `{original}-{timestamp}-{uuid.slice(0,4)}`; assert new slug passed to orchestrator

    4. Mocks for orchestrator + vectorMemory use Node.js test utilities (Sinon or built-in stubs).
    5. All tests isolated; no shared mocks across tests.

    Example:
    ```javascript
    test('ORCH-02: drafts stored in vector memory', async () => {
      const vectorMock = mockVectorMemory({ exists: false });
      const orchestratorMock = mockOrchestrator({ 
        drafts: { company_profile: '...', audience: '...', ... } 
      });
      
      const response = await handleSubmit({ body: valid_seeds[0] }, mockRes);
      
      assert.equal(vectorMock.upsertCallCount, 1);
      const [key, value] = vectorMock.lastUpsertCall;
      assert(key.includes(response.slug));
      assert.deepEqual(Object.keys(value), ['company_profile', 'audience', ...]);
    });
    ```
  </action>
  <verify>
    <automated>npm test -- test/intake-orchestration.test.js</automated>
  </verify>
  <done>
    File: test/intake-orchestration.test.js
    Tests passing: 4/4
    Coverage: Orchestrator invocation + vector memory upsert + error handling + slug uniqueness all verified
  </done>
</task>

<task type="auto">
  <name>Task 4: Implement intake form validation handler (R001–R008 rules)</name>
  <files>onboarding/backend/handlers/submit.cjs</files>
  <action>
    1. Create new file `onboarding/backend/handlers/submit.cjs` to extract validation + Linear wiring logic from server.cjs (DRY pattern).
    2. Export function `validateIntakeSeed(seed)` implementing all 8 rules:
       - R001: company.name present, non-empty, max 100 chars
       - R002: company.stage in enum list
       - R003: product.name present, non-empty, max 100 chars
       - R004: audience.pain_points is array with min 2 items
       - R005: market.competitors is array with min 2 items, each with name + positioning
       - R006: market.market_trends is array with min 1 item
       - R007: content.content_maturity in enum list
       - R008: slug (if provided) contains only alphanumeric + hyphens
       - Cross-field: if stage === "pre-launch", market_trends must be present

       Return object: `{ valid: boolean, errors: Array<{rule_id, field, message}> }`
       - If valid: `{ valid: true, errors: [] }`
       - If invalid: `{ valid: false, errors: [{rule_id: 'R001', field: 'company.name', message: 'Company name is required (max 100 chars)'}, ...] }`

    3. Export function `ensureUniqueSlug(proposedSlug, vectorMemory)`:
       - Check if slug exists in vectorMemory (async)
       - If exists: append `-${Date.now()}-${crypto.randomUUID().slice(0, 4)}` to slug
       - Return final slug

    4. Export function `buildLinearTasks(seed, slug)` (used in task 5):
       - Build task array for `/linear/sync` with exactly 2 tokens: MARKOS-ITM-OPS-03, MARKOS-ITM-INT-01
       - MARKOS-ITM-OPS-03 variables: `{client_name: seed.company.name, company_stage: seed.company.stage}`
       - MARKOS-ITM-INT-01 variables: `{client_name: seed.company.name, validation_timestamp: new Date().toISOString()}`
       - Guard: only allow these 2 tokens; filter any others
       - Return: `[{token: 'MARKOS-ITM-OPS-03', variables: {...}, assignee: null}, {token: 'MARKOS-ITM-INT-01', ...}]`

    5. Use only Node.js builtins (crypto, assert); NO external deps beyond existing codebase imports.
    6. Match error messages EXACTLY from RESEARCH.md table.
    7. All validation logic is synchronous; async slug check is caller's responsibility.

    Example code structure:
    ```javascript
    const COMPANY_STAGES = ['pre-launch', '0-1M MRR', '1-10M MRR', '+10M MRR'];
    const CONTENT_MATURITY = ['none', 'basic', 'moderate', 'mature'];

    function validateIntakeSeed(seed) {
      const errors = [];
      
      // R001: company.name
      if (!seed?.company?.name || seed.company.name.trim() === '' || seed.company.name.length > 100) {
        errors.push({ rule_id: 'R001', field: 'company.name', message: 'Company name is required (max 100 chars)' });
      }
      
      // R002: company.stage
      if (!seed?.company?.stage || !COMPANY_STAGES.includes(seed.company.stage)) {
        errors.push({ rule_id: 'R002', field: 'company.stage', message: 'Company stage must be one of: pre-launch, 0-1M MRR, 1-10M MRR, +10M MRR' });
      }
      
      // ... other rules ...

      return { valid: errors.length === 0, errors };
    }

    module.exports = { validateIntakeSeed, ensureUniqueSlug, buildLinearTasks };
    ```

    All 9 unit tests (task 1) must pass immediately after implementation.
  </action>
  <verify>
    <automated>npm test -- test/intake-validation.test.js</automated>
  </verify>
  <done>
    File: onboarding/backend/handlers/submit.cjs created with validateIntakeSeed(), ensureUniqueSlug(), buildLinearTasks()
    Tests passing: 9/9 validation tests (R001–R008 + cross-field)
    Ready for task 5 (handler enhancement)
  </done>
</task>

## Wave 3: End-to-End Tests + Handler Wiring

<task type="auto" tdd="true">
  <name>Task 5: Write end-to-end intake flow test</name>
  <files>test/intake-e2e.test.js</files>
  <behavior>
    - Test SOP-01: POST /submit (valid seed) → validation ✅ → Linear tickets created → orchestrator invoked → response includes slug, validation metadata, linear_tickets array, onboarding_session_url
    - Test SOP-02: POST /submit (invalid seed) → validation ❌ → 400 response with errors array, NO Linear call, NO orchestrator call
    - Test SOP-03: POST /submit (valid seed, slug collision) → validation ✅ → slug auto-appended with timestamp → Linear + orchestrator called with new slug
    - Test SOP-04: POST /submit (valid seed, orchestrator error) → validation ✅ → Linear tickets created, orchestrator runs but returns partial drafts → response includes both linear_tickets AND errors
  </behavior>
  <action>
    1. Create `test/intake-e2e.test.js` using Node.js native test runner.
    2. This test mocks HTTP server + all downstream services (Linear, orchestrator, vectorMemory).
    3. Write 4 test cases simulating full flow:

       - **SOP-01 (Happy Path):**
         - Call POST /submit with valid seed
         - Assert: status 200
         - Assert: response.validation.status === 'PASSED'
         - Assert: response.linear_tickets array with 2 items (OPS-03, INT-01)
         - Assert: response.onboarding_session_url includes slug
         - Assert: vectorMemory.upsert called with 6 drafts

       - **SOP-02 (Validation Failure):**
         - Call POST /submit with invalid seed (missing company.name)
         - Assert: status 400
         - Assert: response.error (or response.errors) is present
         - Assert: Linear not called
         - Assert: vectorMemory not modified

       - **SOP-03 (Slug Collision):**
         - Mock vectorMemory.exists(slug) → true
         - Call POST /submit with valid seed
         - Assert: slug in response is NOT the original; includes timestamp+uuid
         - Assert: orchestrator called with NEW slug
         - Assert: Linear called with NEW slug

       - **SOP-04 (Orchestrator Error):**
         - Mock orchestrator to return `{drafts: {...}, errors: [{phase: 'company-profile', error: 'LLM timeout'}]}`
         - Call POST /submit with valid seed
         - Assert: status 200 (partial success)
         - Assert: response includes both `linear_tickets` AND `errors`
         - Assert: client can identify what succeeded vs failed

    4. Use test libraries (e.g., supertest for HTTP, sinon for mocking).
    5. All endpoints mocked; no real HTTP calls.

    Example:
    ```javascript
    test('SOP-01: valid seed → full flow', async () => {
      const req = { body: valid_seeds[0] };
      const res = await handleSubmit(req);
      
      assert.equal(res.status, 200);
      assert.equal(res.body.validation.status, 'PASSED');
      assert.equal(res.body.linear_tickets.length, 2);
      assert(res.body.onboarding_session_url);
    });
    ```
  </action>
  <verify>
    <automated>npm test -- test/intake-e2e.test.js</automated>
  </verify>
  <done>
    File: test/intake-e2e.test.js
    Tests passing: 4/4
    Coverage: Full intake flow validated (happy path, validation failure, slug collision, orchestrator error)
  </done>
</task>

<task type="auto">
  <name>Task 6: Wire enhanced submit handler into server.cjs</name>
  <files>onboarding/backend/server.cjs</files>
  <action>
    1. Update `onboarding/backend/server.cjs` POST /submit handler:
       - Import from `./handlers/submit.cjs`: `validateIntakeSeed, ensureUniqueSlug, buildLinearTasks`
       - Keep current orchestrator import + Linear client

    2. Replace handleSubmit() function with enhanced version:
    ```javascript
    async function handleSubmit(req, res) {
      try {
        const { seed } = req.body;  // or req.body itself as seed
        let slug = req.body.slug || generateSlug(seed.company?.name);

        // STEP 1: VALIDATE
        const validation = validateIntakeSeed(seed);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Intake validation failed',
            validation: { status: 'FAILED', errors: validation.errors }
          });
        }

        // STEP 2: ENSURE SLUG UNIQUENESS
        slug = await ensureUniqueSlug(slug, vectorMemory);

        // STEP 3: TRIGGER LINEAR TICKETS
        const linearTasks = buildLinearTasks(seed, slug);
        let linearTickets = [];
        let linearError = null;
        try {
          const linearResponse = await fetch('/linear/sync', {
            method: 'POST',
            body: JSON.stringify({
              slug,
              phase: '34-intake',
              tasks: linearTasks
            })
          });
          if (!linearResponse.ok) {
            linearError = `Linear API returned ${linearResponse.status}`;
          } else {
            linearTickets = (await linearResponse.json()).tickets || [];
          }
        } catch (err) {
          linearError = err.message;
          return res.status(503).json({ error: 'Linear API unavailable', details: linearError });
        }

        // STEP 4: TRIGGER ORCHESTRATOR
        const orchestration = await orchestrator.orchestrate(seed, slug);

        // STEP 5: STORE SEED + DRAFTS IN VECTOR MEMORY
        await vectorMemory.upsert(`${slug}/seed`, {
          ...seed,
          intake_date: new Date().toISOString(),
          validation_rules_passed: validation.errors.length === 0 ? 'R001-R008' : '',
          source: 'form'
        });
        if (orchestration.drafts) {
          await vectorMemory.upsert(`${slug}/drafts`, orchestration.drafts);
        }

        // STEP 6: RESPOND
        return res.status(200).json({
          slug,
          validation: { status: 'PASSED', errors: [] },
          linear_tickets: linearTickets.map(t => ({ token: t.token, identifier: t.identifier, url: t.url })),
          drafts: orchestration.drafts,
          errors: orchestration.errors || [],
          onboarding_session_url: `http://localhost:${process.env.ONBOARDING_PORT || 4242}?slug=${slug}&session=intake-complete`
        });

      } catch (err) {
        console.error('handleSubmit error:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
      }
    }
    ```

    3. Ensure:
       - Error handling for Linear 503 (retry logic is in `/linear/sync`, not here)
       - Vector memory upsert is awaited (don't fire-and-forget)
       - Response includes all required keys: slug, validation, linear_tickets, drafts, errors, onboarding_session_url
       - Backward compat: existing `/submit` calls still work

    4. Test manually: `npm test` should now run all 4+5+4+1=14 tests (prior + new), all passing.

    Constraints:
    - No breaking changes to existing code paths
    - Reuse Phase 29 `/linear/sync` endpoint (no modifications)
    - Support both local + hosted runtimes via env vars
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>
    File: onboarding/backend/server.cjs updated
    Tests passing: All 14 tests (prior + new)
    Manual test: curl POST http://localhost:4242/submit with valid seed → returns 200 with slug, linear_tickets, drafts
  </done>
</task>

## Wave 4: Linear ITM Templates + Documentation

<task type="auto">
  <name>Task 7: Create Linear ITM templates (MARKOS-ITM-OPS-03 and MARKOS-ITM-INT-01)</name>
  <files>.agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-03.md, .agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-INT-01.md</files>
  <action>
    Create two new ITM template files in `.agent/markos/templates/LINEAR-TASKS/`:

    **1. MARKOS-ITM-OPS-03.md** — "Client Intake Received"
    ```markdown
    ---
    token_id: MARKOS-ITM-OPS-03
    document_class: ITM
    domain: OPS
    version: 1.0.0
    status: active
    created: 2026-03-31
    ---

    # MARKOS-ITM-OPS-03 — Client Intake Received

    **Linear Title Template:** `[MARKOS] Intake: {client_name} — {company_stage}`

    **Description:**
    Client intake received and validated. Project `{client_name}` ready for onboarding.

    ---

    ## Intake Checklist

    - [ ] Seed JSON validated (R001–R008 checks passed)
    - [ ] Project slug: {project_slug}
    - [ ] MIR seed populated in vector store
    - [ ] MIR drafts generated:
      - [ ] Company Profile
      - [ ] Mission & Values
      - [ ] Audience Profile
      - [ ] Competitive Landscape
      - [ ] Brand Voice
      - [ ] Channel Strategy
    - [ ] Client onboarding session ready
    - [ ] Next phase ticket created: MARKOS-ITM-INT-01

    ---

    ## Related Artifacts

    | Type | Resource | Owner |
    |------|----------|-------|
    | Seed | `onboarding-seed.json` (namespace: {project_slug}) | Client submitted |
    | Drafts | Vector memory: {project_slug}/drafts | Orchestrator |
    | Runbook | `.planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md` | Team Lead |
    | Next Step | MARKOS-ITM-INT-01 (Data Quality Check) | Intake Team |

    ---

    ## Handoff to Next Phase

    If checklist complete: Assign to Audience Research lead for MARKOS-ITM-STR-01 (Audience Intent Mapping).

    If errors: See troubleshooting section in 34-RUNBOOK.md.
    ```

    **2. MARKOS-ITM-INT-01.md** — "Intake Validation: Data Quality Check"
    ```markdown
    ---
    token_id: MARKOS-ITM-INT-01
    document_class: ITM
    domain: INT
    version: 1.0.0
    status: active
    created: 2026-03-31
    ---

    # MARKOS-ITM-INT-01 — Intake Validation: Data Quality Check

    **Linear Title Template:** `[MARKOS] Intake Validation: {client_name} — Data Quality Check`

    **Description:**
    Data quality assurance gate for {client_name} intake. Verify seed completeness before drafts are finalized.

    ---

    ## Validation Gate Checklist

    - [ ] All 8 validation rules passed (R001–R008)
    - [ ] Company stage is realistic for business model
    - [ ] At least 2 competitors named with clear positioning
    - [ ] Audience pain points articulated (≥2 points)
    - [ ] Market trends are current and relevant
    - [ ] Existing content maturity aligns with company stage
    - [ ] Slug is clean (no collisions observed)

    ---

    ## Required Actions

    1. Review generated drafts (linked from MARKOS-ITM-OPS-03)
    2. If drafts have errors or gaps, note in comment and assign back to Orchestrator team for regeneration
    3. If drafts are acceptable, move to approval phase (MARKOS-ITM-OPS-01 Campaign Launch Ready)

    ---

    ## Reference

    See validation rules reference: `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md`
    ```

    Both files:
    - Use YAML frontmatter matching existing ITM format
    - Include title template with variable placeholders: `{client_name}`, `{company_stage}`, `{project_slug}`
    - Link to upstream/downstream phases
    - Include actionable checklists
    - Reference supporting docs (RUNBOOK, VALIDATION-REFERENCE)
  </action>
  <verify>
    - Files exist: `.agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-03.md` and `MARKOS-ITM-INT-01.md`
    - Frontmatter is valid YAML (parseable by Node.js yaml parser)
    - Token IDs match those used in buildLinearTasks() function (task 4)
    - Title templates include variable placeholders
    - No syntax errors; files are readable
  </verify>
  <done>
    Two ITM templates created. Ready for documentation (task 8).
  </done>
</task>

<task type="auto">
  <name>Task 8: Create SOP documentation: intake workflow diagram + runbook</name>
  <files>.planning/codebase/INTAKE-SOP.md, .planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md</files>
  <action>
    Create two documentation files:

    **1. .planning/codebase/INTAKE-SOP.md** — High-level architecture (for discovery/reference)
    ```markdown
    # Intake SOP Overview

    ## Workflow Diagram

    ```
    CLIENT FORM SUBMISSION
            ↓
        [1] VALIDATION (8 rules)
            ├─ R001: company.name (required, max 100)
            ├─ R002: company.stage (enum)
            ├─ R003: product.name (required, max 100)
            ├─ R004: audience.pain_points (min 2)
            ├─ R005: market.competitors (min 2)
            ├─ R006: market.market_trends (min 1)
            ├─ R007: content.content_maturity (enum)
            └─ R008: slug format (alphanumeric + hyphen)
            ↓
        ❌ INVALID → 400 response, list errors, STOP
            ↓
        ✅ VALID
            ↓
        [2] SLUG UNIQUENESS CHECK
            ├─ Query vector store for existing slug
            ├─ If collision: append {timestamp}-{uuid}
            └─ Return unique slug
            ↓
        [3] LINEAR TICKET CREATION
            ├─ POST /linear/sync (Phase 29)
            ├─ Create: MARKOS-ITM-OPS-03 (Intake Received)
            ├─ Create: MARKOS-ITM-INT-01 (Data Quality Check)
            └─ Return ticket IDs + URLs
            ↓
        [4] ORCHESTRATOR INVOCATION
            ├─ orchestrator.orchestrate(seed, slug)
            ├─ Generate 6 drafts: company_profile, mission, audience, competitive, voice, channel_strategy
            └─ Return drafts + error array
            ↓
        [5] VECTOR MEMORY STORAGE
            ├─ Upsert: {slug}/seed
            ├─ Upsert: {slug}/drafts
            └─ Upsert: {slug}/metadata (validation timestamp, source)
            ↓
        [6] RESPONSE TO CLIENT
            ├─ slug (unique identifier)
            ├─ validation: { status, errors }
            ├─ linear_tickets: [ {token, identifier, url}, ... ]
            ├─ drafts: { company_profile, audience, ... }
            ├─ errors: [ {phase, error}, ... ]
            └─ onboarding_session_url: "http://...?slug={slug}&session=intake-complete"
    ```

    ## Key Files

    | File | Purpose |
    |------|---------|
    | onboarding/backend/server.cjs | HTTP handler, orchestration entry point |
    | onboarding/backend/handlers/submit.cjs | Validation + Linear wiring functions |
    | test/intake-*.test.js | Unit + integration + e2e tests (9 tests) |
    | .agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-OPS-03.md | Linear ticket template (intake received) |
    | .agent/markos/templates/LINEAR-TASKS/MARKOS-ITM-INT-01.md | Linear ticket template (data quality) |

    ## Validation Rules (Quick Reference)

    See `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md` for detailed rule definitions + test cases.

    ## Dependencies

    - Phase 29: `/linear/sync` endpoint (no modifications)
    - Phase 32: Vector store (Upstash) for seed + draft storage
    - Existing orchestrator: Generate MIR drafts from seed

    ## Success Criteria

    - [x] All 8 validation rules enforced
    - [x] Linear tickets auto-created on intake submission
    - [x] MIR drafts auto-generated from validated seed
    - [x] Slug uniqueness guaranteed (collision detection + auto-append)
    - [x] 9 tests passing (4 unit + 2 linear + 2 orchestration + 1 e2e)
    - [x] SOP documented for beta team

    ## Risk Mitigations

    | Risk | Mitigation |
    |------|-----------|
    | Validation too strict (rejects valid clients) | Beta test with 5–10 sample companies; adjust rules pre-launch |
    | Linear ticket cascades | Guard token whitelist: OPS-03 + INT-01 only |
    | Slug collisions overwrite projects | Timestamp + UUID suffix; vector store uniqueness check |
    | Orchestrator fails mid-run | Error array in response; partial draft visibility to client |
    | Linear API unavailable | Return 503; client can retry or submit manually |
    ```

    **2. .planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md** — Operations runbook (for beta team)
    ```markdown
    # Phase 34 Intake SOP — Beta Runbook

    **Audience:** Intake team, campaign ops, client success leads

    ---

    ## Pre-Intake Checks (Daily)

    - [ ] Linear project is accessible (no auth errors)
    - [ ] Upstash Vector store is responding (health check: `npm run check-vector-store`)
    - [ ] Orchestrator (LLM service) is available (health check: `npm run check-orchestrator`)
    - [ ] Form server is running on port 4242: `node onboarding/backend/server.cjs`

    **Troubleshoot:** See section "Common Issues" below.

    ---

    ## Intake Submission Flow (Per Client)

    ### Step 1: Client Fills Form
    - Direct client to `http://localhost:4242` (or hosted URL)
    - User navigates multi-step form:
      1. Company (name, stage, business model)
      2. Product (name, description, primary channel)
      3. Audience (segment, pain points, buying process)
      4. Market (competitors, trends, TAM)
      5. Content (maturity level, existing assets)
    - User submits form

    ### Step 2: Form Data Validated
    - Server runs 8 validation rules (R001–R008)
    - If validation fails: Form returns error message (e.g., "Company name is required (max 100 chars)")
      - Client corrects and resubmits
      - No Linear tickets created yet
    - If validation passes: Proceed to step 3

    ### Step 3: Linear Tickets Auto-Created
    - Server checks slug uniqueness; if collision, appends timestamp
    - POST /linear/sync creates 2 tickets:
      1. **MARKOS-ITM-OPS-03** — Intake Received (title: `[MARKOS] Intake: {company_name} — {stage}`)
      2. **MARKOS-ITM-INT-01** — Data Quality Check (title: `[MARKOS] Intake Validation: {company_name} — Data Quality`)
    - Both tickets include project slug in description
    - If Linear API unavailable: Server returns 503; client retries (automatic retry in UI)

    ### Step 4: MIR Drafts Generated
    - Orchestrator invoked with validated seed
    - Generates 6 drafts:
      - Company Profile
      - Mission & Values
      - Audience Profile
      - Competitive Landscape
      - Brand Voice
      - Channel Strategy
    - Drafts stored in vector memory under `{slug}/drafts` namespace
    - If orchestrator errors: Drafts are partial; error details in response

    ### Step 5: Client Session Ready
    - Client receives response with:
      - Unique slug (save this!)
      - Validation status
      - Linear ticket URLs (both OPS-03 and INT-01)
      - Onboarding session URL: `http://localhost:4242?slug={slug}&session=intake-complete`
    - Client is now in onboarding dashboard (session URL)

    ---

    ## Intake Team Next Steps

    ### For Data Quality Lead (assigned MARKOS-ITM-INT-01)
    1. Open MARKOS-ITM-INT-01 ticket in Linear
    2. Review validation: All 8 rules passed?
      - If NO: Validation failed → intake team rejects in Linear, client notified to resubmit
      - If YES: Proceed to step 3
    3. Review generated drafts (linked from OPS-03 ticket):
      - Are company, audience, and competitive profiles reasonable?
      - Are there obvious gaps or errors (e.g., brand voice is placeholder text)?
      - If YES (errors): Comment on MARKOS-ITM-INT-01, assign back to Orchestrator team for regeneration
      - If NO (looks good): Proceed to step 4
    4. Approve or adjust: Mark MARKOS-ITM-INT-01 as complete; move client toMARKOS-ITM-OPS-01 for campaign launch readiness

    ### For Campaign Lead (assigned MARKOS-ITM-OPS-03)
    1. Open MARKOS-ITM-OPS-03 ticket in Linear
    2. Review intake metadata: Company stage, audience segment, market context
    3. Plan next phase: Campaign strategy, channel prioritization
    4. Assign MARKOS-ITM-STR-01 (Audience Intent Mapping) for further audience research
    5. Close OPS-03 once downstream work assigned

    ---

    ## Validation Rules Reference

    | Rule | Field | Validation | Error Message |
    |------|-------|-----------|---------------|
    | R001 | company.name | Required, non-empty, max 100 chars | "Company name is required (max 100 chars)" |
    | R002 | company.stage | In enum: pre-launch, 0–1M, 1–10M, +10M | "Company stage must be one of: ..." |
    | R003 | product.name | Required, non-empty, max 100 chars | "Product name is required (max 100 chars)" |
    | R004 | audience.pain_points | Array, min 2 items | "At least 2 audience pain points required" |
    | R005 | market.competitors | Array, min 2 objects (name+positioning) | "At least 2 competitors with positioning required" |
    | R006 | market.market_trends | Array, min 1 item | "At least 1 market trend required" |
    | R007 | content.content_maturity | In enum: none, basic, moderate, mature | "Content maturity level required" |
    | R008 | slug | (if provided) Alphanumeric + hyphens only | "Project slug must be alphanumeric with hyphens only" |

    Full reference: `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md`

    ---

    ## Common Issues & Troubleshooting

    ### Issue 1: Form Submission Returns 400 (Validation Failed)
    **Symptom:** Client sees "Company name is required (max 100 chars)" or similar.
    **Cause:** Seed data missing required field or invalid format.
    **Resolution:** 
    1. Check error message in form (e.g., "R001: Company name...").
    2. Client corrects the field and resubmits.
    3. If same error persists: Client may have used non-ASCII characters; try ASCII-only company name.

    ### Issue 2: Form Submission Returns 503 (Linear API Down)
    **Symptom:** "Linear API unavailable" message; no Linear tickets created.
    **Cause:** `/linear/sync` endpoint failed (Linear API down or auth error).
    **Resolution:**
    1. Check Linear API status: Visit linear.app/
    2. Check auth: Verify MARKOS_LINEAR_API_KEY is set in env
    3. Manual fallback: Client can submit intake form again (automatic retry in UI)
    4. If Linear down for >5 min: Post in Slack #incident; skip Linear step, process intake manually

    ### Issue 3: MIR Drafts Incomplete or Contain Errors
    **Symptom:** MARKOS-ITM-INT-01 ticket shows errors: `"errors": [{"phase": "company-profile", "error": "LLM timeout"}]`
    **Cause:** Orchestrator/LLM service had transient error; partial drafts generated.
    **Resolution:**
    1. Check orchestrator logs: `npm run logs -- onboarding/backend/orchestrator.cjs`
    2. If LLM timeout: Wait 2 min, click "Regenerate Drafts" in session (if available)
    3. If persistent: Orchestrator team investigates; client may resubmit intake

    ### Issue 4: Slug Collision (Same Company Name, Second Client)
    **Symptom:** MARKOS-ITM-OPS-03 ticket title includes slug with timestamp suffix (e.g., `acme-corp-1711900800000-a1b2`)
    **Cause:** Two clients with same company name submitted intake within same day.
    **Resolution:**
    1. This is expected behavior; slug is unique
    2. Both clients have separate projects in MIR/MSP
    3. No action needed; proceed with normal intake flow

    ### Issue 5: Linear Tickets Have Wrong Title/Description
    **Symptom:** Ticket title is blank or contains placeholder variables (e.g., `[MARKOS] Intake: {client_name}`)
    **Cause:** ITM template variables not substituted properly.
    **Resolution:**
    1. Check MARKOS-ITM-OPS-03.md template: Should have `{client_name}` placeholder
    2. Check Linear task builder: Should substitute `{client_name}` with actual company name
    3. If not substituted: Check server logs for variable substitution error
    4. Manual fallback: Edit Linear ticket title manually

    ---

    ## Health Checks

    Run before starting beta onboarding:

    ```bash
    # Check dependencies
    npm run check-dependencies

    # Check Linear auth
    npm run check-linear-auth

    # Check Vector Store
    npm run check-vector-store

    # Check Orchestrator
    npm run check-orchestrator

    # Run full test suite
    npm test
    ```

    Expected output: All checks green (✓), all 14 tests passing.

    ---

    ## Rollback Plan

    If Phase 34 has critical issues:
    1. Disable automatic Linear ticket creation: Comment out `/linear/sync` call in server.cjs
    2. Restore previous handleSubmit() (before Phase 34 changes)
    3. Manual intake: Collect seed via form, create Linear tickets manually
    4. Notify v2.4 team of rollback; investigate issue before re-enabling

    ---

    ## Success Metrics (Beta Phase)

    | Metric | Target | Frequency |
    |--------|--------|-----------|
    | Intake form submission success rate | ≥95% (no 400 errors) | Daily |
    | Linear ticket creation latency | <2 sec | Per intake |
    | MIR draft generation completeness | 6/6 drafts | Per intake |
    | End-to-end intake time (form → session) | <30 sec | Per intake |
    | Bug/rollback rate | 0 critical, ≤1 medium | Per week |

    Track in `.planning/phases/34-client-intake-sop-automation/34-VERIFICATION.md` (see task 9).
    ```

    Both files should:
    - Use clear headings + sections
    - Include diagrams (ASCII boxes for workflow)
    - Link to validation rules table + ITM templates
    - Provide troubleshooting steps
    - Be actionable for beta operations team
  </action>
  <verify>
    - Files exist: `.planning/codebase/INTAKE-SOP.md` and `.planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md`
    - Both files are readable Markdown (no syntax errors)
    - Diagrams render clearly (ASCII flow chart + tables)
    - Links to other docs are accurate (.md files exist)
    - Runbook includes troubleshooting section
  </verify>
  <done>
    Two SOP documentation files created. Intake team can now follow runbook for beta onboarding.
  </done>
</task>

<task type="auto">
  <name>Task 9: Create validation reference + Linear checklist documentation</name>
  <files>.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md, .planning/phases/34-client-intake-sop-automation/34-LINEAR-CHECKLIST.md</files>
  <action>
    Create two reference documents:

    **1. .planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md** — Detailed validation rules
    ```markdown
    # Phase 34 Validation Rules — Complete Reference

    **Last Updated:** 2026-03-31
    **Version:** 1.0.0

    ---

    ## Overview

    Phase 34 intake validation enforces 8 rules (R001–R008) + 1 cross-field consistency check. All rules are required unless marked OPTIONAL.

    ---

    ## Rule R001: Company Name

    | Property | Value |
    |----------|-------|
    | Rule ID | R001 |
    | Field | `seed.company.name` |
    | Type | string |
    | Required | Yes |
    | Validation | Non-empty, max 100 characters |
    | Error Message | "Company name is required (max 100 chars)" |

    ### Test Cases

    | Input | Expected | Notes |
    |-------|----------|-------|
    | `"Acme Corp"` | ✅ PASS | Valid company name |
    | `""` | ❌ FAIL | Empty string |
    | `undefined` / `null` | ❌ FAIL | Missing field |
    | `"A"` repeated 100 times | ✅ PASS | At limit (100 chars) |
    | `"A"` repeated 101 times | ❌ FAIL | Over limit |
    | `"Acme & Co."` | ✅ PASS | Special characters allowed |

    ### Implementation Note

    Trim whitespace before validation: `company.name.trim()` must be non-empty after trim.

    ---

    ## Rule R002: Company Stage

    | Property | Value |
    |----------|-------|
    | Rule ID | R002 |
    | Field | `seed.company.stage` |
    | Type | enum |
    | Required | Yes |
    | Valid Values | "pre-launch", "0-1M MRR", "1-10M MRR", "+10M MRR" |
    | Error Message | "Company stage must be one of: pre-launch, 0-1M MRR, 1-10M MRR, +10M MRR" |

    ### Test Cases

    | Input | Expected | Notes |
    |-------|----------|-------|
    | `"pre-launch"` | ✅ PASS | Valid stage |
    | `"0-1M MRR"` | ✅ PASS | Valid stage |
    | `"1-10M MRR"` | ✅ PASS | Valid stage |
    | `"+10M MRR"` | ✅ PASS | Valid stage |
    | `"Series A"` | ❌ FAIL | Not in enum |
    | `"PRE-LAUNCH"` | ❌ FAIL | Case sensitive |
    | `null` | ❌ FAIL | Missing |

    ### Implementation Note

    Exact string match (case-sensitive). No fuzzy matching.

    ---

    ## Rule R003: Product Name

    | Property | Value |
    |----------|-------|
    | Rule ID | R003 |
    | Field | `seed.product.name` |
    | Type | string |
    | Required | Yes |
    | Validation | Non-empty, max 100 characters |
    | Error Message | "Product name is required (max 100 chars)" |

    ### Test Cases

    | Input | Expected | Notes |
    |----------|----------|-------|
    | `"Acme Platform"` | ✅ PASS | Valid product |
    | `""` | ❌ FAIL | Empty |
    | `undefined` | ❌ FAIL | Missing |
    | `"A"` (100 times) | ✅ PASS | At limit |
    | `"A"` (101 times) | ❌ FAIL | Over limit |

    Same rules as R001 (company name).

    ---

    ## Rule R004: Audience Pain Points

    | Property | Value |
    |----------|-------|
    | Rule ID | R004 |
    | Field | `seed.audience.pain_points` |
    | Type | array of strings |
    | Required | Yes |
    | Validation | Array with min 2 items |
    | Error Message | "At least 2 audience pain points required" |

    ### Test Cases

    | Input | Expected | Notes |
    |-------|----------|-------|
    | `["Can't measure ROI", "Too many tools"]` | ✅ PASS | 2 items |
    | `["Can't measure ROI", "Too many tools", "Data silos"]` | ✅ PASS | 3 items |
    | `["Can't measure ROI"]` | ❌ FAIL | Only 1 item |
    | `[]` | ❌ FAIL | Empty array |
    | `null` | ❌ FAIL | Not an array |
    | `"Can't measure ROI"` | ❌ FAIL | String, not array |

    ### Implementation Note

    Array length check: `Array.isArray(pain_points) && pain_points.length >= 2`

    ---

    ## Rule R005: Market Competitors

    | Property | Value |
    |----------|-------|
    | Rule ID | R005 |
    | Field | `seed.market.competitors` |
    | Type | array of objects |
    | Required | Yes |
    | Validation | Array with min 2 objects, each with `name` + `positioning` |
    | Error Message | "At least 2 competitors with positioning required" |

    ### Test Cases

    | Input | Expected | Notes |
    |-------|----------|-------|
    | `[{name: "HubSpot", positioning: "All-in-one CRM"}, {name: "Marketo", positioning: "Enterprise B2B"}]` | ✅ PASS | 2 valid competitors |
    | `[{name: "HubSpot", positioning: "..."}]` | ❌ FAIL | Only 1 competitor |
    | `[]` | ❌ FAIL | Empty array |
    | `[{name: "HubSpot"}, {name: "Marketo"}]` | ❌ FAIL | Missing `positioning` field |
    | `null` | ❌ FAIL | Not an array |

    ### Implementation Note

    ```javascript
    Array.isArray(competitors) &&
    competitors.length >= 2 &&
    competitors.every(c => c.name && c.positioning)
    ```

    ---

    ## Rule R006: Market Trends

    | Property | Value |
    |----------|-------|
    | Rule ID | R006 |
    | Field | `seed.market.market_trends` |
    | Type | array of strings |
    | Required | Yes |
    | Validation | Array with min 1 item |
    | Error Message | "At least 1 market trend required" |

    ### Test Cases

    | Input | Expected | Notes |
    |-------|----------|-------|
    | `["AI adoption"]` | ✅ PASS | 1 item |
    | `["AI adoption", "Privacy shift"]` | ✅ PASS | 2 items |
    | `[]` | ❌ FAIL | Empty array |
    | `null` | ❌ FAIL | Missing |

    ---

    ## Rule R007: Content Maturity

    | Property | Value |
    |----------|-------|
    | Rule ID | R007 |
    | Field | `seed.content.content_maturity` |
    | Type | enum |
    | Required | Yes |
    | Valid Values | "none", "basic", "moderate", "mature" |
    | Error Message | "Content maturity level required" |

    ### Test Cases

    | Input | Expected | Notes |
    |-------|----------|-------|
    | `"none"` | ✅ PASS | Valid level |
    | `"basic"` | ✅ PASS | Valid level |
    | `"moderate"` | ✅ PASS | Valid level |
    | `"mature"` | ✅ PASS | Valid level |
    | `"intermediate"` | ❌ FAIL | Not in enum |
    | `null` | ❌ FAIL | Missing |

    ---

    ## Rule R008: Slug Format

    | Property | Value |
    |----------|-------|
    | Rule ID | R008 |
    | Field | `seed.slug` (if provided) |
    | Type | string |
    | Required | No (optional field) |
    | Validation | Alphanumeric + hyphens only; no spaces or special chars |
    | Error Message | "Project slug must be alphanumeric with hyphens only" |

    ### Test Cases

    | Input | Expected | Notes |
    |-------|----------|-------|
    | `"acme-corp"` | ✅ PASS | Valid slug |
    | `"acme-corp-2024"` | ✅ PASS | Numbers + hyphens allowed |
    | `undefined` | ✅ PASS | Optional field; auto-generated if missing |
    | `"Acme Corp"` | ❌ FAIL | Spaces not allowed |
    | `"acme_corp"` | ❌ FAIL | Underscores not allowed |
    | `"acme.corp"` | ❌ FAIL | Dots not allowed |
    | `"acme corp"` | ❌ FAIL | Spaces not allowed |

    ### Implementation Note

    Regex pattern: `/^[a-z0-9-]+$/` (lowercase alphanumeric + hyphens).

    If slug not provided by client: Auto-generate from `company.name` with sanitization: `company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')`

    ---

    ## Cross-Field Consistency: Pre-Launch Companies

    | Scenario | Validation | Error Message |
    |----------|-----------|---------------|
    | `stage: "pre-launch"` AND `market_trends: []` | ❌ FAIL | "Pre-launch companies must provide market trends" |
    | `stage: "pre-launch"` AND `market_trends: ["AI adoption"]` | ✅ PASS | Valid |

    ### Rationale

    Pre-launch companies are crucial; market understanding is critical. If no trends provided, orchestrator LLM agents fail to generate market-informed drafts.

    ---

    ## Implementation Checklist

    Use this list when implementing `validateIntakeSeed()`:

    - [ ] Import rule definitions (8 rules).
    - [ ] Loop through each rule; check against seed data.
    - [ ] Collect all errors in array (don't short-circuit).
    - [ ] Return `{ valid: errors.length === 0, errors: [ {rule_id, field, message}, ... ] }`.
    - [ ] Match error messages EXACTLY from table above (copy-paste to avoid typos).
    - [ ] Test against fixtures: `valid-seeds.json` should have all `valid: true`, `invalid-seeds.json` should have specific rule failures.
    - [ ] Unit test file: `test/intake-validation.test.js` should have 9 tests (8 rules + cross-field).

    ---

    ## Troubleshooting Validation Errors

    | Symptom | Debug Steps |
    |---------|-----------|
    | Client form returns 400 but error message is unclear | Check server logs: `console.error(validation.errors)` should show detailed errors with rule_ids |
    | Same input passes locally but fails in hosted env | Check env vars: hosted may have different seed schema structure or JSON parsing |
    | Test fixtures fail validation but shouldn't | Verify fixtures match exact schema structure (nested company.name, not company_name) |
    | Orchestrator fails after validation passes | Likely cross-field consistency not checked; ensure pre-launch companies have market_trends |

    ```

    **2. .planning/phases/34-client-intake-sop-automation/34-LINEAR-CHECKLIST.md** — Linear ticket automation checklist
    ```markdown
    # Phase 34 Linear Ticket Automation — Checklist & Guards

    **Version:** 1.0.0  
    **Created:** 2026-03-31  
    **Owner:** Intake automation team  

    ---

    ## Ticket Creation Guard Rails

    ### Allowed Tokens (Whitelist)

    **Only these 2 tokens auto-created on intake submission:**
    - ✅ `MARKOS-ITM-OPS-03` — Client Intake Received
    - ✅ `MARKOS-ITM-INT-01` — Intake Validation: Data Quality Check

    **NOT auto-created (require manual assignment):**
    - ❌ `MARKOS-ITM-STR-01` (Audience Intent Mapping) — created after intake approval
    - ❌ `MARKOS-ITM-CNT-*` (Content planning) — created during campaign planning
    - ❌ `MARKOS-ITM-OPS-01` (Campaign Launch Ready) — created after QA sign-off

    **Why the guard?** Prevent ticket cascade; keep intake flow focused on 2 gates (intake received + data QA).

    **Implementation:** In `buildLinearTasks()`, filter tasks:
    ```javascript
    const INTAKE_ALLOWED_TOKENS = ['MARKOS-ITM-OPS-03', 'MARKOS-ITM-INT-01'];
    const filteredTasks = tasks.filter(t => INTAKE_ALLOWED_TOKENS.includes(t.token));
    ```

    ---

    ## Ticket Template Checklist

    ### MARKOS-ITM-OPS-03 (Intake Received)

    | Item | To-Do | Status |
    |------|-------|--------|
    | Ticket exists in Linear | [ ] Create if missing | |
    | Title format | `[MARKOS] Intake: {company_name} — {company_stage}` | Template file: `MARKOS-ITM-OPS-03.md` |
    | Description includes | `## Intake Checklist` + checklist items | See `34-RUNBOOK.md` for checklist |
    | Project slug embedded | Description includes `slug: {project_slug}` | Used for traceability |
    | Related OPS-03 artifacts | Seed + drafts + vector memory links | See template |
    | Next step | Links to MARKOS-ITM-INT-01 | Data Quality Check ticket |
    | Priority | High (client onboarding) | Escalate if blocked |

    ### MARKOS-ITM-INT-01 (Data Quality Check)

    | Item | To-Do | Status |
    |------|-------|--------|
    | Ticket exists in Linear | [ ] Create if missing | |
    | Title format | `[MARKOS] Intake Validation: {client_name} — Data Quality Check` | Template file: `MARKOS-ITM-INT-01.md` |
    | Description includes | Validation gate checklist (7 items) | See template |
    | Assigned to | Data quality lead (intake team) | Manual assignment post-creation |
    | Due date | Next business day | Set manually in Linear |
    | Links | References OPS-03 ticket + seed/drafts | For traceability |
    | Success criteria | All 7 validation gates passed OR documented exceptions | Clear pass/fail |

    ---

    ## Ticket Creation Flow (Sequence)

    1. **Client submits form** → `POST /submit` called
    2. **Validation runs** → If fails: 400 response, STOP
    3. **Slug generated & checked** → If collision, append timestamp
    4. **Linear call triggered** → POST `/linear/sync` with 2 tasks (OPS-03, INT-01)
    5. **Linear API returns** → Ticket IDs (e.g., ENG-123, ENG-124) + URLs
    6. **Response to client** → Includes ticket URLs, slug, onboarding session URL
    7. **Intake team notified** → Linear notification; both tickets appear on dashboard

    ---

    ## Payload Example

    ### Request to `/linear/sync` (from Phase 29, reused)

    ```json
    {
      "slug": "acme-corp",
      "phase": "34-intake",
      "tasks": [
        {
          "token": "MARKOS-ITM-OPS-03",
          "variables": {
            "client_name": "Acme Corp",
            "company_stage": "1-10M MRR"
          },
          "assignee": null
        },
        {
          "token": "MARKOS-ITM-INT-01",
          "variables": {
            "client_name": "Acme Corp",
            "validation_timestamp": "2026-03-31T15:30:45Z"
          },
          "assignee": null
        }
      ]
    }
    ```

    ### Response from `/linear/sync`

    ```json
    {
      "tickets": [
        {
          "token": "MARKOS-ITM-OPS-03",
          "identifier": "ENG-123",
          "url": "https://linear.app/markos/issue/ENG-123/intake-acme-corp-1-10m-mrr"
        },
        {
          "token": "MARKOS-ITM-INT-01",
          "identifier": "ENG-124",
          "url": "https://linear.app/markos/issue/ENG-124/intake-validation-acme-corp-data-quality-check"
        }
      ]
    }
    ```

    ---

    ## Error Handling

    If `/linear/sync` returns error:

    | Error | Status | Action |
    |-------|--------|--------|
    | Linear API down | 503 | Return 503 to client; suggest retry in 1–2 minutes |
    | Auth error (bad token) | 401 | Ops team: check `MARKOS_LINEAR_API_KEY` in env |
    | Token not found | 404 | Ops team: verify `MARKOS-ITM-OPS-03` exists in registry |
    | Rate limit | 429 | Auto-retry (linear client handles); if persistent, throttle form submissions |
    | Invalid payload | 400 | Check variables (client_name, company_stage) are correctly substituted |

    ---

    ## Weekly Audit Checklist

    Every Monday, audit Linear ticket creation:

    - [ ] Count opened tickets this week: `filter: "Team = Markos AND created: this_week"`
    - [ ] Verify all have either OPS-03 or INT-01 token (no strays)
    - [ ] Check % with correct title format: `filter: "Title ~ '[MARKOS] Intake'"`
    - [ ] Spot-check variables: 2–3 random tickets, verify company_name + stage in title
    - [ ] No spam/duplicate tickets: If found, log issue + investigate

    **Target:** 100% tickets have correct OPS-03 or INT-01 token, correct title format, all variables substituted.

    ---

    ## Rollback Plan

    If Linear automation is broken:

    1. Comment out `/linear/sync` call in `server.cjs::handleSubmit()`
    2. Remove Linear tickets from response (keep validation + orchestrator)
    3. Manual fallback: Ops team creates MARKOS-ITM-OPS-03 + INT-01 tickets manually
    4. Notify intake team of rollback; investigate Linear integration issue
    5. Once fixed: Re-enable automatic ticket creation

    ```
  </action>
  <verify>
    - Files created: `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md` and `34-LINEAR-CHECKLIST.md`
    - Both files are readable Markdown (no syntax errors)
    - Validation reference includes all 8 rules + test cases + implementation notes
    - Linear checklist includes guard rails, template checklist, error handling, audit checklist
    - Links to ITM template files are correct
  </verify>
  <done>
    Two reference documents created. Intake team + ops have complete rule definitions + Linear automation guardrails.
  </done>
</task>

</tasks>

<verification>

## Phase 34 Completion Checklist

### Code Implementation
- [ ] `onboarding/backend/handlers/submit.cjs` — validateIntakeSeed(), ensureUniqueSlug(), buildLinearTasks() all exported
- [ ] `onboarding/backend/server.cjs` — handleSubmit() enhanced with validation + Linear + orchestration wiring
- [ ] All imports correct (no module not found errors)
- [ ] Backward compat preserved (existing /submit calls still work)

### Test Coverage
- [ ] `test/intake-validation.test.js` — 9 tests passing (R001–R008 + cross-field)
- [ ] `test/intake-linear.test.js` — 5 tests passing (LINK-01 through LINK-05)
- [ ] `test/intake-orchestration.test.js` — 4 tests passing (ORCH-01 through ORCH-04)
- [ ] `test/intake-e2e.test.js` — 4 tests passing (SOP-01 through SOP-04)
- [ ] `npm test` runs all 14 tests (prior + new), all passing
- [ ] No test file left with "MISSING" or placeholders
- [ ] Test fixtures exist and are valid JSON/CommonJS

### Linear Integration
- [ ] `MARKOS-ITM-OPS-03.md` created with correct frontmatter + checklists
- [ ] `MARKOS-ITM-INT-01.md` created with correct frontmatter + validation gate
- [ ] Both template files use `{client_name}`, `{company_stage}` placeholders
- [ ] No syntax errors in ITM templates (valid YAML + Markdown)

### Documentation
- [ ] `.planning/codebase/INTAKE-SOP.md` — High-level architecture + workflow diagram
- [ ] `.planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md` — Step-by-step intake flow + troubleshooting
- [ ] `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md` — All 8 rules with test cases
- [ ] `.planning/phases/34-client-intake-sop-automation/34-LINEAR-CHECKLIST.md` — Ticket guards + audit checklist
- [ ] All docs link to each other correctly (no broken links)

### Success Criteria
- [ ] Validation: 8 rules enforced; invalid seeds return 400 with specific error
- [ ] Linear: Valid seeds trigger auto-creation of OPS-03 + INT-01 tickets
- [ ] MIR: Valid seeds trigger orchestrator, 6 drafts generated + stored in vector memory
- [ ] Slug: Uniqueness checked; collisions auto-appended with timestamp+uuid
- [ ] Response: Includes slug, validation metadata, Linear ticket URLs, drafts, errors array, session URL
- [ ] Test coverage: 9 tests covering full flow (4 unit + 2 linear + 2 orchestration + 1 e2e)
- [ ] Backward compat: Existing `/submit` calls still work (no breaking changes)

### Ready for Beta
- [ ] Intake team can follow 34-RUNBOOK.md
- [ ] SOP workflow diagram clear (ASCII or Mermaid)
- [ ] Validation rules reference complete (copy-paste for debugging)
- [ ] Linear ticket guard rails documented (prevent spam/cascades)
- [ ] Health checks documented (pre-intake checklist)

</verification>

<success_criteria>

**Phase 34 Complete When:**

1. ✅ All 9 tests passing (`npm test`)
2. ✅ Intake validation schema (8 rules) implemented + tested
3. ✅ Linear automation wired (form submission → auto-create OPS-03 + INT-01)
4. ✅ MIR seed population (valid seed → orchestrator → 6 drafts in vector memory)
5. ✅ Slug uniqueness enforced (collision detection + auto-append)
6. ✅ SOP workflow documented (diagram + runbook + validation reference)
7. ✅ Linear templates created (MARKOS-ITM-OPS-03 + MARKOS-ITM-INT-01)
8. ✅ Intake form submission returns 200 with: slug, validation, linear_tickets, drafts, onboarding_session_url
9. ✅ Invalid intake returns 400 with specific validation error message
10. ✅ Beta team can onboard first client using runbook (zero manual intervention if form valid)

</success_criteria>

<output>

After completing all tasks, create `.planning/phases/34-client-intake-sop-automation/34-SUMMARY.md` with:

```markdown
# Phase 34 Summary: Client Intake SOP Automation

**Phase:** 34  
**Status:** COMPLETE  
**Completed:** 2026-04-07  
**Duration:** 1 week  

## Deliverables

1. **Intake Form Validation** (34-01)
   - Implemented: 8 validation rules (R001–R008)
   - File: `onboarding/backend/handlers/submit.cjs`
   - Tests: 9 passing (validation unit tests + cross-field checks)

2. **Linear Ticket Automation** (34-02)
   - Auto-creates OPS-03 (Intake Received) + INT-01 (Data Quality Check) on valid intake
   - Wired: POST /submit → POST /linear/sync (Phase 29 reused)
   - Tests: 5 passing (LINK-01 through LINK-05)

3. **MIR Seed Population** (34-03)
   - Valid intake triggers orchestrator.orchestrate()
   - Generates 6 drafts: company_profile, mission, audience, competitive_landscape, brand_voice, channel_strategy
   - Stores in vector memory under {slug}/* namespace
   - Tests: 4 passing (ORCH-01 through ORCH-04)

4. **SOP Documentation** (34-04)
   - Workflow diagram: `.planning/codebase/INTAKE-SOP.md`
   - Beta runbook: `.planning/phases/34-client-intake-sop-automation/34-RUNBOOK.md`
   - Validation reference: `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md`
   - Linear checklist: `.planning/phases/34-client-intake-sop-automation/34-LINEAR-CHECKLIST.md`
   - Linear templates: `MARKOS-ITM-OPS-03.md`, `MARKOS-ITM-INT-01.md`

## Test Coverage

| Category | Count | Details |
|----------|-------|---------|
| Unit (validation) | 4 | R001–R003, R004–R008 rules |
| Integration (Linear) | 2 | Form → /linear/sync wiring |
| Integration (orchestration) | 2 | Seed → drafts population |
| E2E | 1 | Full intake flow (happy path + error cases) |
| **Total** | **9** | All passing |

## Key Metrics

- **Validation success rate:** 100% for valid clients, 100% for invalid clients (correct error messages)
- **Linear ticket latency:** <2 sec (Phase 29 endpoint)
- **MIR draft generation:** 6 drafts per intake
- **Slug uniqueness:** Guaranteed (collision detection + append)
- **Backward compat:** Preserved (no breaking changes)

## Next Phase (v2.4 Roadmap)

- Phase 35: Beta Program Operations (weekly standups, rollout cohorts)
- Phase 36: Campaign Activation (first paid-media pilots)
- Phase 37: Build-in-Public (LinkedIn content)

## Known Limitations / Future Work

- Linear ticket assignment is manual (created with assignee: null; intake team assigns)
- Orchestrator errors are logged but not re-triggered automatically (manual regenerate)
- Vector store fallback not implemented (if Upstash down, intake fails gracefully with 503)

## Opening v2.4 Beta Channels

1. Intake form is live at `http://localhost:4242`
2. Beta team onboards first client using 34-RUNBOOK.md
3. Monitor Linear tickets for 8 rule enforcement
4. Collect feedback on validation strictness (adjust rules if too restrictive)
5. Target: 10 clients onboarded by 2026-04-30
```

This summary file should be committed to `.planning/phases/34-client-intake-sop-automation/34-SUMMARY.md` at phase completion.

</output>

---

## Phase 34 Execution Guide (For Claude Executor)

### Wave Structure (Dependency Order)

```
Wave 0 (Foundation):
  └─ Task 0: Test fixtures + mocks

Wave 1 (Unit + Integration Tests):
  ├─ Task 1: Validation unit tests (depends on Task 0)
  ├─ Task 2: Linear integration tests (depends on Task 0)
  └─ Task 4: Implement validation handler (implements Task 1)

Wave 2 (Orchestration Integration):
  ├─ Task 3: Orchestration integration tests (depends on Task 0)
  └─ Prepare for Task 5 (depends on Task 3)

Wave 3 (E2E + Handler Wiring):
  ├─ Task 5: E2E test (depends on Task 4 + Task 3)
  └─ Task 6: Wire server.cjs (depends on Task 4 + Task 5 passing)

Wave 4 (Support Documentation):
  ├─ Task 7: Linear ITM templates (parallel)
  ├─ Task 8: SOP documentation (parallel)
  └─ Task 9: Reference documentation (parallel)
```

### Critical Path

Task 0 (fixtures) → Task 1,2,4 (validation + Linear + handler) → Task 3 (orchestration) → Task 5,6 (e2e + server wiring) → Tasks 7,8,9 (documentation).

### Estimated Timeline

| Task | Duration | Cumulative |
|------|----------|-----------|
| Task 0 (fixtures) | 1 day | Day 1 |
| Task 1,2,4 (tests + handler) | 2 days | Day 3 |
| Task 3 (orchestration tests) | 1 day | Day 4 |
| Task 5,6 (e2e + wiring) | 1 day | Day 5 |
| Task 7,8,9 (docs) | 1 day | Day 6 |
| **Total** | **7 days** | **1 week** |

**Target delivery:** 2026-04-07 (ready for beta onboarding)

</instructions>
