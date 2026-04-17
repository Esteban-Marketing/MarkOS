---
date: 2026-04-16
description: "Identity resolution 2026 — post-IDFA/cookieless stitching across devices and identifiers via deterministic + probabilistic + privacy-preserving methods."
tags:
  - literacy
  - identity
  - resolution
  - privacy
  - frontier
---

# Identity Resolution 2026

> Linking a user's signals (email, phone, device, cookie, hashed ID, household) into a single person-level record so marketing can personalize, measure, and suppress consistently. In 2026 this is a multi-layer privacy-preserving problem, not a single cookie-sync.

## Types of identity

| Layer | Example IDs |
|---|---|
| **1P deterministic** | user_id, email, phone, loyalty ID |
| **Hashed deterministic** | SHA-256 email, MD5 phone |
| **Publisher-provided** | UID2, ID5, RampID, Mozilla Account ID |
| **Platform IDs** | Meta FBP + FBC, Google gclid + GA user_id, TikTok ttclid |
| **Device** | IDFA (iOS), GAID (Android) — consented only |
| **Cookie** (1P / 3P) | 1P in own domain; 3P deprecating |
| **Probabilistic** | device fingerprint, IP + UA heuristic |
| **Household** | IP + location + accounts on same network |

## Graph model

1. **Match keys** — email (hashed), phone (hashed), user_id, loyalty ID, device ID.
2. **Merge rules** — deterministic keys always merge; probabilistic links flagged for review (mirrors CRM pattern in [[CRM Domain]]).
3. **Review state** — `accepted` / `review` / `rejected` — never silently merge. See [[MarkOS Codebase Atlas]] and migration `100_crm_schema_identity_graph_hardening.sql`.
4. **Lineage** — every merge records evidence (who, when, why) for audit and reversal.
5. **Consent propagation** — opt-outs cascade to all linked identities.

## 2026 tools

| Tool | Flavor |
|---|---|
| **LiveRamp RampID** | deterministic + probabilistic hybrid; widespread in walled gardens |
| **The Trade Desk UID2** | open deterministic standard |
| **ID5** | universal ID alternative |
| **Snowflake ID Graph (Natively Apps)** | warehouse-native |
| **Hightouch Match Booster** | adds match rate on top of warehouse identity |
| **Merkury (Merkle)**, **Neustar (TransUnion)**, **Acxiom** | legacy full-file providers |
| **Meta Advanced Matching**, **Google Enhanced Conversions** | platform-specific hashed-PII match |

## Practical pattern

1. **Collect deterministic IDs** at every logged-in touchpoint.
2. **Hash and send server-side** to platforms via Conversions API, Enhanced Conversions, Events API.
3. **Warehouse stitching** — merge across source tables with deterministic rules; flag probabilistic.
4. **Review + human approval** on high-impact merges (customer records, financial).
5. **Clean room** for cross-company joins — never share raw PII.

## Pitfalls

- **Silent probabilistic merges** — damage trust and attribution; always require evidence + review.
- **Consent drift** — opt-out on one identity fails to cascade. Build propagation tests.
- **Over-matching** — linking everything inflates reach counts + hurts suppression.
- **Hashing without salting** — SHA-256 email is predictable; some jurisdictions treat it as PII.
- **Cross-device via 3P cookies** — breaking; migrate to first-party + logged-in signals.

## Related

- [[CDP · Data Warehouse · Reverse ETL]] · [[Warehouse-Native CDP]] · [[Data Clean Rooms]] · [[Cookie Deprecation Status 2026]] · [[Privacy, Consent & Compliance]] · [[CRM Domain]]
