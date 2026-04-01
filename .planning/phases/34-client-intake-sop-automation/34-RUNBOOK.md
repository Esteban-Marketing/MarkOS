# Phase 34 Intake SOP — Beta Runbook

**Audience:** Intake team, campaign ops, client success leads

---

## Pre-Intake Checks (Daily)

- [ ] Linear project is accessible (no auth errors)
- [ ] Upstash Vector store is responding (health check)
- [ ] Orchestrator (LLM service) is available
- [ ] Form server is running on port 4242: `node onboarding/backend/server.cjs`

---

## Intake Submission Flow (Per Client)

### Step 1: Client Fills Form
- Direct client to onboarding form (local: `http://localhost:4242`)
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
- If Linear API unavailable: Server returns 503; client retries

### Step 4: MIR Drafts Generated
- Orchestrator invoked with validated seed
- Generates 6 drafts: company_profile, mission, audience, competitive, voice, channel_strategy
- Drafts stored in vector memory under `{slug}/drafts` namespace
- If orchestrator errors: Drafts are partial; error details in response

### Step 5: Client Session Ready
- Client receives response with:
  - Unique slug (save this!)
  - Validation status
  - Linear ticket URLs (both OPS-03 and INT-01)
  - Onboarding session URL: `http://localhost:4242?slug={slug}&session=intake-complete`
- Client is now in onboarding dashboard

---

## Intake Team Next Steps

### For Data Quality Lead (assigned MARKOS-ITM-INT-01)
1. Open MARKOS-ITM-INT-01 ticket in Linear
2. Review validation: All 8 rules passed?
3. Review generated drafts (linked from OPS-03 ticket)
4. If errors exist: Comment on MARKOS-ITM-INT-01, assign back for regeneration
5. If looks good: Mark complete; move client to next phase

---

## Validation Rules Reference

| Rule | Field | Check |
|------|-------|-------|
| R001 | company.name | Required, non-empty, max 100 chars |
| R002 | company.stage | In enum: pre-launch, 0–1M, 1–10M, +10M |
| R003 | product.name | Required, non-empty, max 100 chars |
| R004 | audience.pain_points | Array, min 2 items |
| R005 | market.competitors | Array, min 2 objects (name+positioning) |
| R006 | market.market_trends | Array, min 1 item |
| R007 | content.content_maturity | In enum: none, basic, moderate, mature |
| R008 | slug | Alphanumeric + hyphens only (if provided) |

Full reference: `.planning/phases/34-client-intake-sop-automation/34-VALIDATION-REFERENCE.md`

---

## Common Issues & Troubleshooting

### Issue 1: Form Returns 400 (Validation Failed)
**Cause:** Seed data missing required field or invalid format.
**Resolution:** Client corrects the field shown in error message and resubmits.

### Issue 2: Form Returns 503 (Linear API Down)
**Cause:** `/linear/sync` endpoint failed.
**Resolution:** Check Linear API status; verify MARKOS_LINEAR_API_KEY in env.

### Issue 3: MIR Drafts Incomplete or Have Errors
**Cause:** Orchestrator/LLM service had transient error; partial drafts generated.
**Resolution:** Check orchestrator logs; client can regenerate from session dashboard.

---

## Health Checks

```bash
npm test                    # All 14 tests passing
npm run check-vector-store  # Vector memory responding
npm run check-linear-auth   # Linear API auth valid
```

---

## Rollback Plan

If critical issues: Comment out Linear call in server.cjs, restore previous handleSubmit, process intakes manually.
