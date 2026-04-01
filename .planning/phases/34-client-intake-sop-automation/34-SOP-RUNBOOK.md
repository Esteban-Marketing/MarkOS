# Phase 34 SOP Runbook

## Purpose
Standardize beta client intake from submission to session-ready response.

## Intake Flow

```text
Client submits onboarding form
  -> POST /submit
  -> Validate intake rules (R001-R008 when strict fields are present)
  -> Auto-create Linear intake tickets (OPS-03, INT-01)
  -> Run orchestrator draft generation
  -> Return session contract:
     - slug
     - validation
     - linear_tickets / linear_skipped
     - drafts
     - session_url
```

## Validation Rules (Strict Intake)

| Rule | Field | Requirement |
|---|---|---|
| R001 | company.name | Non-empty string, max 100 chars |
| R002 | company.stage | One of: pre-launch, 0-1M MRR, 1-10M MRR, +10M MRR |
| R003 | product.name | Non-empty string, max 100 chars |
| R004 | audience.pain_points | Array with at least 2 items |
| R005 | market.competitors | Array with at least 2 objects with name + positioning |
| R006 | market.market_trends | Array with at least 1 item |
| R007 | content.content_maturity | One of: none, basic, moderate, mature |
| R008 | project_slug (optional) | Alphanumeric + hyphen format |

## Linear Intake Automation

### Tokens
- MARKOS-ITM-OPS-03: Client intake received and queued.
- MARKOS-ITM-INT-01: Intake data quality check.

### Expected Outcomes
- On Linear configured environments: both issues created and returned in linear_tickets.
- On missing/failed Linear setups: submit continues; skipped tickets reported in linear_skipped.

## Response Contract

```json
{
  "success": true,
  "slug": "acme-corp-ab12cd34",
  "validation": {
    "applied": true,
    "valid": true,
    "failed_rules": []
  },
  "linear_tickets": [
    { "token": "MARKOS-ITM-OPS-03", "identifier": "MKT-101", "url": "..." },
    { "token": "MARKOS-ITM-INT-01", "identifier": "MKT-102", "url": "..." }
  ],
  "linear_skipped": [],
  "drafts": {
    "company_profile": "...",
    "mission_values": "...",
    "audience": "...",
    "competitive": "...",
    "brand_voice": "...",
    "channel_strategy": "..."
  },
  "session_url": "http://localhost:4242/?slug=acme-corp-ab12cd34"
}
```

## Beta Intake Checklist

1. Submit intake form with strict fields for autopilot validation.
2. Confirm validation.applied=true and validation.valid=true.
3. Confirm two Linear tickets are created or explicitly skipped.
4. Confirm six draft sections are returned.
5. Open session_url and review drafts with client.
6. Proceed to approve flow and execution readiness checks.

## Failure Handling

- Validation failure: return 400 with failed_rules and validation_errors.
- Linear failure: do not block submit; capture reason in linear_error and linear_skipped.
- Orchestrator failure: return 500 with success=false and error for operator follow-up.
