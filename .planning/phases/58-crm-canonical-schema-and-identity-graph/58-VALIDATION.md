---
phase: 58
slug: crm-canonical-schema-and-identity-graph
status: verified
nyquist_compliant: true
created: 2026-04-04
updated: 2026-04-04
---

# Phase 58 - Validation Ledger

## Phase Goal

Establish the canonical CRM schema, unified activity timeline contract, identity-graph lineage model, and tenant-safe API seams that Phase 59 through Phase 64 will depend on.

## Verification Waves

| Plan | Wave | Requirement | Verification seam | Automated command | Status |
| --- | --- | --- | --- | --- | --- |
| 58-01 | 1 | CRM-01 | Canonical CRM entities, governed custom fields, and tenant-safe RLS exist as additive schema and shared contracts | `node --test test/crm-schema/crm-core-entities.test.js test/tenant-auth/crm-tenant-isolation.test.js` | PASS |
| 58-02 | 2 | CRM-02, TRK-04 foundation | Append-only activity ledger, identity links, merge decisions, and deterministic timeline assembly preserve lineage and tenant safety | `node --test test/crm-timeline/crm-timeline-assembly.test.js test/crm-identity/crm-identity-merge.test.js test/tenant-auth/crm-tenant-isolation.test.js` | PASS |
| 58-03 | 3 | CRM-01, CRM-02, TRK-04 foundation | Tenant-safe CRUD, timeline, and merge APIs expose the canonical CRM layer without bypassing shared contracts | `node --test test/crm-api/crm-api-contracts.test.js test/crm-api/crm-merge-api.test.js test/crm-timeline/crm-timeline-assembly.test.js test/crm-identity/crm-identity-merge.test.js test/tenant-auth/crm-tenant-isolation.test.js` | PASS |

## Portable Evidence Checks

1. `Select-String -Path "supabase/migrations/58_crm_core_entities.sql", "supabase/migrations/58_crm_custom_fields.sql" -Pattern "tenant_id", "ENABLE ROW LEVEL SECURITY", "contact", "company", "deal", "account", "customer", "custom field"` -> PASS
2. `Select-String -Path "supabase/migrations/58_crm_activity_and_identity.sql", "contracts/F-58-crm-timeline-query-v1.yaml", "contracts/F-58-crm-merge-dedupe-v1.yaml" -Pattern "activity_family", "source_event_ref", "anonymous", "identity", "merge", "lineage"` -> PASS
3. `Select-String -Path "api/crm/contacts.js", "api/crm/activities.js", "api/crm/merge.js", ".planning/phases/58-crm-canonical-schema-and-identity-graph/58-VALIDATION.md" -Pattern "tenant", "deny", "timeline", "merge", "validation"` -> PASS

## Manual Verification Items

1. Confirm the canonical CRM schema is additive and does not quietly repurpose legacy workspace tables as operational CRM truth.
2. Confirm unified timeline reads preserve source references and deterministic ordering for anonymous activity, converted contacts, and deal-stage events.
3. Confirm merge decisions remain append-only and preserve both accepted and rejected review evidence.
4. Confirm CRM mutation handlers fail closed when tenant context is missing or the caller lacks the required role.

## Evidence Expectations

- Wave 1 must leave direct evidence for first-class CRM entity families, governed custom fields, and tenant-safe RLS on the new CRM tables.
- Wave 2 must leave direct evidence for append-only activity ingestion shape, identity-link modeling, candidate scoring, merge lineage, and timeline ordering.
- Wave 3 must leave direct evidence for tenant-safe API seams, merge review endpoints, and a validation ledger that can be promoted into later verification without re-deriving the phase scope.

## Exit Condition

Phase 58 is complete because CRM-01 and CRM-02 now have direct Phase 58 evidence through schema, timeline, and API artifacts, and the identity-graph foundation for TRK-04 is visible in the activity and merge lineage model.