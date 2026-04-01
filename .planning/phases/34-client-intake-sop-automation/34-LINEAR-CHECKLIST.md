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
- ❌ `MARKOS-ITM-STR-01` (Audience Intent Mapping) — after intake approval
- ❌ `MARKOS-ITM-CNT-*` (Content planning) — during campaign planning
- ❌ Others — no cascade

**Implementation:** In `buildLinearTasks()`, filter tasks by whitelist.

---

## Ticket Template Checklist

### MARKOS-ITM-OPS-03 (Intake Received)

| Item | Status |
|------|--------|
| Ticket created in Linear | Template file: `MARKOS-ITM-OPS-03.md` |
| Title format | `[MARKOS] Intake: {company_name} — {company_stage}` |
| Description includes | Checklist + project slug |
| Related artifacts | Seed + drafts links |
| Next step | Links to MARKOS-ITM-INT-01 |

### MARKOS-ITM-INT-01 (Data Quality Check)

| Item | Status |
|------|--------|
| Ticket created in Linear | Template file: `MARKOS-ITM-INT-01.md` |
| Title format | `[MARKOS] Intake Validation: {client_name} — Data Quality Check` |
| Description includes | 7-item validation gate checklist |
| Assigned to | Data quality lead (manual) |
| Upstream link | References OPS-03 ticket |

---

## Payload Example

### Request to `/linear/sync`

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
      "url": "https://linear.app/markos/issue/ENG-123/..."
    },
    {
      "token": "MARKOS-ITM-INT-01",
      "identifier": "ENG-124",
      "url": "https://linear.app/markos/issue/ENG-124/..."
    }
  ]
}
```

---

## Error Handling

| Error | Status | Action |
|-------|--------|--------|
| Linear API down | 503 | Return 503; suggest retry |
| Auth error | 401 | Verify MARKOS_LINEAR_API_KEY in env |
| Token not found | 404 | Verify ITM template exists |
| Rate limit | 429 | Auto-retry; throttle if persistent |
| Invalid payload | 400 | Check variables are substituted |

---

## Weekly Audit Checklist

Every Monday, audit Linear ticket creation:

- [ ] Count opened tickets this week
- [ ] Verify all have OPS-03 or INT-01 token
- [ ] Check % with correct title format: `filter: "Title ~ '[MARKOS] Intake'"`
- [ ] Spot-check 2–3 random tickets: company_name + stage in title
- [ ] No spam/duplicate tickets: log if found

**Target:** 100% tickets have correct token, correct title format, all variables substituted.

---

## Rollback Plan

If Linear automation is broken:

1. Comment out `/linear/sync` call in server.cjs
2. Remove Linear tickets from response
3. Manual fallback: Ops team creates tickets manually
