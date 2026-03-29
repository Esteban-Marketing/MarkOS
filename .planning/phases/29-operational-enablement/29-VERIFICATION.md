# Phase 29 Verification - Operational Enablement

## Target Checks

1. `/linear/sync` creates Linear issues from valid ITM payloads.
2. Missing `LINEAR_API_KEY` returns clear setup response (`503`) without crashes.
3. `/campaign/result` appends rows to discipline winners catalogs and persists outcome tags.
4. Interview loop never exceeds 5 questions and auto-transitions to draft generation.

## Command Log Template

```bash
node --test test/onboarding-server.test.js
```

## Verification Evidence (2026-03-28)

- Command executed: `node --test test/onboarding-server.test.js`
- Result: pass (`13` passed, `0` failed)
- Included checks:
	- `3.11 Generate-question enforces five-question cap`
	- `3.12 Linear sync returns deterministic issues and setup errors`
	- `3.13 Campaign result appends winners catalog and stores classification metadata`

## Artifact Evidence

- Linear sync endpoint + setup errors: `onboarding/backend/handlers.cjs`, `onboarding/backend/linear-client.cjs`, `onboarding/backend/server.cjs`, `api/linear/sync.js`
- Campaign result loop + metadata tagging: `onboarding/backend/handlers.cjs`, `onboarding/backend/vector-store-client.cjs`, `api/campaign/result.js`
- Interview cap + progress + auto-transition: `onboarding/backend/handlers.cjs`, `onboarding/onboarding.js`, `onboarding/index.html`
- Documentation and env contract: `.env.example`, `TECH-MAP.md`

## Manual Validation Checklist

- Create at least one ticket per assignee mapping via `/linear/sync`.
- Submit one success and one failure campaign result to confirm tagging and catalog append behavior.
- Run onboarding with intentionally sparse input and verify question cap + auto-proceed.

## Exit Decision

Phase 29 requirements P1-01, P1-02, and P1-03 are complete and verified. Phase can transition.

