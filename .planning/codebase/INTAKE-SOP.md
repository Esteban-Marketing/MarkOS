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
| onboarding/backend/handlers.cjs | Main request handlers |
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
