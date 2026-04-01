# Phase 34 Execution Checkpoint

**Date:** 2026-03-31  
**Status:** IN PROGRESS — Wave 0 complete, Waves 1-4 remaining  
**Velocity:** 1/5 waves completed

---

## ✅ Wave 0: Validation Schema & Fixtures (COMPLETE)

**Commit:** `d36eb31`  
**Deliverables:**
- ✅ `INTAKE_VALIDATION_RULES` schema (8 rules R001-R008) in [handlers.cjs](../../onboarding/backend/handlers.cjs)
- ✅ `validateIntake()` function implementing all 8 checks
- ✅ Validation wired into `POST /submit` before orchestration
- ✅ Returns 400 with `failed_rules` + `validation_errors` on failure
- ✅ Exported for test imports

**Rules Implemented:**
- R001: company.name (non-empty, max 100 chars)
- R002: company.stage (enum: pre-launch, 0-1M MRR, 1-10M MRR, +10M MRR)
- R003: product.name (non-empty, max 100 chars)
- R004: audience.pain_points (array, min 2 items)
- R005: market.competitors (array of objects, min 2 with name + positioning)
- R006: market.market_trends (array, min 1 item)
- R007: content.content_maturity (enum: none, basic, moderate, mature)
- R008: slug (alphanumeric + hyphens only, optional)

---

## ⏳ Wave 1: Validation Tests + Handler Response (PENDING)

**Scope:** Add 4 unit tests for validation rules  
**Files to modify:** `test/onboarding-server.test.js`

### Test Cases (to add after existing tests)

```javascript
await t.test('3.16 Phase 34: Intake Validation Rule R001 — company.name required', async () => {
  const handlers = require(handlersPath);
  
  // FAIL: missing company.name
  const failRes = createMockResponse();
  await handlers.handleSubmit(
    createJsonRequest({ company: { name: '', stage: 'pre-launch' }, product: { name: 'P' } }, '/submit'),
    failRes
  );
  assert.equal(failRes.statusCode, 400);
  assert.ok(JSON.parse(failRes.body).validation_errors.R001);
  
  // PASS: company.name provided
  // ... mock orchestrator ...
  const passRes = createMockResponse();
  await handlers.handleSubmit(
    createJsonRequest(validSeed(), '/submit'),
    passRes
  );
  assert.equal(passRes.statusCode, 200);
});

await t.test('3.17 Phase 34: Intake Validation Rule R002 — company.stage enum', async () => {
  // Similar structure, test invalid stage → fail, valid stage → pass
});

await t.test('3.18 Phase 34: Intake Validation Rule R004 — audience.pain_points (min 2)', async () => {
  // Test: pain_points missing → R004 fails
  // Test: pain_points = ['one'] → R004 fails  
  // Test: pain_points = ['one', 'two'] → R004 passes
});

await t.test('3.19 Phase 34: Intake Validation Rule R005 — market.competitors (min 2 with positioning)', async () => {
  // Test: competitors missing → R005 fails
  // Test: competitors = [{name: 'A'}] (no positioning) → R005 fails
  // Test: competitors = [{name: 'A', positioning: 'X'}, {name: 'B', positioning: 'Y'}] → R005 passes
});
```

**Files to create test fixtures:**
- Create `INTAKE_VALIDATION_FIXTURES` in setup.js (valid/invalid seed examples for each rule)

---

## ⏳ Wave 2: Linear Ticket Automation (PENDING)

**Scope:** Wire form validation → Linear `/linear/sync` auto-call  
**Files to modify:**
- `onboarding/backend/handlers.cjs` — modify `handleSubmit()` to call `/linear/sync` after validation passes
- Create new ITM tokens: `MARKOS-ITM-OPS-03` (Client Intake Received), `MARKOS-ITM-INT-01` (Intake Integration)

### Updated handleSubmit flow (after validation passes):

```javascript
// After validation passes, before orchestration:
if (validation.valid) {
  // Auto-create Linear tickets
  const linearResult = await autoCreateLinearTickets({
    slug,
    intakeSeed: seed,
    tokens: ['MARKOS-ITM-OPS-03', 'MARKOS-ITM-INT-01'],
  });
  
  // Continue with orchestration...
}
```

**Test:** Integration test for linear automation (2 tests)

---

## ⏳ Wave 3: MIR Seed Population (PENDING)

**Scope:** Auto-trigger orchestrator on valid intake; return drafts + Linear URLs  
**Files to modify:**
- `onboarding/backend/handlers.cjs` — wire orchestrator return to include linear_tickets + session_url

### Updated POST /submit response:

```javascript
{
  success: true,
  slug,
  validation: { valid: true, failed_rules: [] },
  linear_tickets: [ { token, identifier, url }, ... ],
  drafts: { company_profile, mission_values, ... },
  session_url: 'http://localhost:4242/?slug=...',
  seed_path
}
```

**Tests:** 
- E2E test: full form → validation → Linear → drafts → session response (1 test)

---

## ⏳ Wave 4: SOP Documentation (PENDING)

**Deliverable:** `34-SOP-RUNBOOK.md`

### Contents:
1. **Intake Workflow Diagram** (ASCII or markdown)
   ```
   FORM SUBMIT
     ↓ POST /submit
   VALIDATE (8 rules)
     ↓ PASS
   AUTO-CREATE LINEAR
     ↓ OPS-03 + INT-01
   ORCHESTRATE DRAFTS
     ↓ 6 sections
   RESPOND:
     - slug, validation, linear_tickets, drafts, session_url
   ```

2. **Validation Rules Reference Table**
   - All 8 rules with examples

3. **Beta Client Onboarding Checklist**
   - Step 1: Submit form with required fields
   - Step 2: Receive Linear tickets
   - Step 3: Review AI drafts
   - Step 4: Approve & execute

4. **ITM Template Registry** (2 new tokens)
   - MARKOS-ITM-OPS-03: Client Intake Received
   - MARKOS-ITM-INT-01: Intake Integration Setup

---

## Test Summary

**Total: 9 tests required**

| Test | Category | File | Status |
|------|----------|------|--------|
| 3.16 | Unit — R001 | onboarding-server.test.js | PENDING |
| 3.17 | Unit — R002 | onboarding-server.test.js | PENDING |
| 3.18 | Unit — R004 | onboarding-server.test.js | PENDING |
| 3.19 | Unit — R005 | onboarding-server.test.js | PENDING |
| 3.20 | Integration — Linear | onboarding-server.test.js | PENDING |
| 3.21 | Integration — Linear | onboarding-server.test.js | PENDING |
| 3.22 | Integration — Orchestration | onboarding-server.test.js | PENDING |
| 3.23 | Integration — Orchestration | onboarding-server.test.js | PENDING |
| 3.24 | E2E — Full intake flow | onboarding-server.test.js | PENDING |

---

## How to Continue

**For next session:**

### Wave 1 (4 unit tests) — 2 hours
1. Create `INTAKE_VALIDATION_FIXTURES` in `test/setup.js` with valid/invalid seed examples
2. Add 4 unit tests (3.16–3.19) to check each rule
3. Run `npm test` to verify all validation rules work
4. Commit: `feat(phase-34-wave-1): Add validation rule unit tests (4/9)`

### Wave 2 (2 integration tests) — 3 hours
1. Create Linear ticket auto-call function in `handlers.cjs`
2. Add ITM token definitions: OPS-03, INT-01
3. Wire into `handleSubmit()` post-validation
4. Add 2 integration tests (3.20–3.21)
5. Run `npm test`  
6. Commit: `feat(phase-34-wave-2): Wire Linear ticket automation (6/9 tests)`

### Wave 3 (2 integration tests) — 2 hours
1. Verify orchestrator call returns draft list
2.  Update response schema to include `linear_tickets` + `session_url`
3. Add 2 integration tests (3.22–3.23)
4. Run `npm test`
5. Commit: `feat(phase-34-wave-3): Auto-populate MIR seed + response schema (8/9 tests)`

### Wave 4 (1 E2E test + docs) — 2 hours
1. Add 1 E2E test (3.24) covering full form→Linear→MIR→response flow
2. Run `npm test` → all 64 tests passing
3. Create `34-SOP-RUNBOOK.md` with workflow diagrams, checklist, ITM registry
4. Commit: `docs(phase-34-wave-4): Add SOP runbook + E2E test (9/9 tests)`

**Total estimated time:** ~9 hours of focused implementation

---

## Phase 34 Success Criteria

✅ All 9 tests passing  
✅ `POST /submit` validates all 8 rules  
✅ Auto-creates Linear tickets on valid intake  
✅ Auto-calls orchestrator + returns drafts  
✅ Response includes: `validation`, `linear_tickets`, `drafts`, `session_url`  
✅ SOP documentation complete  
✅ Ready for v2.4 beta client onboarding

---

## Files Modified (to date)

- [onboarding/backend/handlers.cjs](../../onboarding/backend/handlers.cjs) — +140 lines (schema + validation + wiring)

## Files Pending

- test/onboarding-server.test.js — +120 lines (9 test cases)
- onboarding/backend/handlers.cjs — +80 lines (Linear automation, response schema)
- .planning/phases/34-client-intake-sop-automation/34-SOP-RUNBOOK.md — new file (200 lines)

---

**Next action: `/gsd:execute-phase 34` → Wave 1** or schedule next session if blocked
