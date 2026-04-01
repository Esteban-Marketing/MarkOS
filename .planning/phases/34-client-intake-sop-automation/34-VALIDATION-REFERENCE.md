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
- ✅ "Acme Corp" — Valid
- ❌ "" — Empty string
- ❌ undefined/null — Missing
- ✅ 100-char name — At limit
- ❌ 101-char name — Over limit

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
- ✅ "pre-launch", "0-1M MRR", "1-10M MRR", "+10M MRR" — Valid
- ❌ "Series A", "PRE-LAUNCH" — Case sensitive, not in enum
- ❌ null — Missing

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
- ✅ ["Pain 1", "Pain 2"] — 2 items
- ✅ ["Pain 1", "Pain 2", "Pain 3"] — 3 items
- ❌ ["Pain 1"] — Only 1 item
- ❌ [] — Empty array
- ❌ null — Not an array

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
- ✅ [{name: "HubSpot", positioning: "CRM"}, {name: "Marketo", positioning: "B2B"}] — Valid
- ❌ [{name: "HubSpot", positioning: "CRM"}] — Only 1
- ❌ [{name: "HubSpot"}, {name: "Marketo"}] — Missing positioning
- ❌ [] — Empty

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
- ✅ ["AI adoption"] — 1 item
- ✅ ["AI adoption", "Privacy shift"] — 2 items
- ❌ [] — Empty array
- ❌ null — Missing

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
- ✅ "none", "basic", "moderate", "mature" — Valid
- ❌ "intermediate", "advanced" — Not in enum
- ❌ null — Missing

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
- ✅ "acme-corp", "acme-corp-2024" — Valid
- ✅ undefined — Optional; auto-generated if missing
- ❌ "Acme Corp", "acme_corp", "acme.corp" — Special chars not allowed

---

## Cross-Field Consistency

**Pre-Launch Companies:** If `stage === "pre-launch"` AND `market_trends` is empty → FAIL

Rationale: Pre-launch companies need market understanding for orchestrator to generate informed drafts.

---

## Implementation Checklist

- [x] Import rule definitions (8 rules)
- [x] Loop through each rule; check against seed data
- [x] Collect all errors in array (don't short-circuit)
- [x] Return `{ valid: errors.length === 0, errors: [...] }`
- [x] Match error messages EXACTLY
- [x] Test against fixtures: valid-seeds.json (valid), invalid-seeds.json (fail per rule)
- [x] Unit test file: test/intake-validation.test.js (9 tests)
