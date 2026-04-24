# Phase 221: CDP Identity, Audience, and Consent Substrate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `221-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 221-cdp-identity-audience-consent-substrate
**Mode:** discuss (--chain)
**Areas discussed:** Profile layering, Event substrate, Consent ledger, Audience snapshot, Identity graph scope, Merge policy, Trait materialization, Deletion/export, Downstream consumption, API/MCP surface, Observability

---

## Area selection

**Question:** Which gray areas to discuss for Phase 221?
**User selected (all 8):** Profile layering, Event substrate shape, Consent ledger scope, Audience snapshot semantics, Identity graph scope, Merge policy evolution, Trait materialization, Deletion/export posture.

---

## Profile layering

| Option | Description | Selected |
|--------|-------------|----------|
| Two-layer (CDP profile feeds CRM) | New IdentityProfile/UnifiedProfile is CDP SOR with canonical_identity_id. CRM entity carries FK. CDP raw+computed; CRM operational overlay. Matches doc 20 + research. | ✓ |
| Extend CRM entity with CDP traits | Single SOR = CRM record; add profile_mode/lifecycle/traits columns. Lighter, less migration. Risk: drifts for anonymous/workspace/household. | |
| Hybrid: separate profile only for anonymous/account/workspace | Dual write-path. | |

**User's choice:** Two-layer (Recommended).
**Notes:** Matches RESEARCH.md "additive not replacement-heavy" + doc 20 doctrine rule 6 (every engine reads from one canonical substrate).

---

## Event substrate

| Option | Description | Selected |
|--------|-------------|----------|
| Append-only cdp_events + crm_activity as derived view | EventEnvelope SOR; HIGH_SIGNAL filter becomes projection. Public ingest API unchanged. | ✓ |
| Keep crm_activity as event truth, add event_domain/envelope columns | Single table. Risk: raw/low-signal mixed with operator-facing activity. | |
| Two-stage raw buffer → cdp_events → crm_activity | Most robust, 3-write fan-out. Too heavy for P221. | |

**User's choice:** Append-only cdp_events (Recommended).
**Notes:** Preserves P101 D-01 high-signal-only CRM timeline rule. Dual-write during transition, projection-only post-P222.

---

## Consent ledger

| Option | Description | Selected |
|--------|-------------|----------|
| New ConsentState SOR + outbound shim | ConsentState per profile: email/sms/whatsapp/push/in_app + legal_basis + jurisdiction + preference_tags + quiet_hours. outbound.consent.ts reads ConsentState first, legacy fallback. P223 full cutover. | ✓ |
| Extend outboundConsentRecords with new columns | Less migration. Channels stay email/sms/whatsapp; push/in_app/launches need new table anyway. | |
| Dual-write ConsentState + keep outboundConsentRecords authoritative | Highest migration safety, highest drift risk. | |

**User's choice:** New ConsentState SOR + shim (Recommended).
**Notes:** Doc 20 rule 3 + doc 20 Part 3: downstream engines must consume this instead of inventing their own. Shim preserves P104 D-04 fail-closed posture during transition.

---

## Audience snapshot semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Frozen snapshot + re-validate suppression/consent at dispatch | Immutable membership frozen at compute. Downstream re-evaluates consent/jurisdiction/quiet-hours at send. Double-gate. | ✓ |
| Live-query membership only | No snapshot storage. Risk: no measurement cohort, no audit, no explainability. | |
| Frozen snapshot only (no re-validate) | Simpler. Risk: consent changes between snapshot and send = illegal outreach. | |

**User's choice:** Frozen + re-validate (Recommended).
**Notes:** Satisfies RESEARCH.md "activation from frozen snapshots, not live query state" + P104 D-04 fail-closed at send.

---

## Identity graph scope

| Option | Description | Selected |
|--------|-------------|----------|
| Person + Account (B2B + B2C) | profile_type = person \| account. Matches current CRM contact/company. | ✓ |
| Person only v1 | Simplest. Blocks SaaS customer identity bridge (P214) + account analytics. | |
| Person + Account + Workspace + Household (full doc 20) | Complete but too broad for P221; workspace needed for PLG (P218), household rarely for B2B-first ICP. | |

**User's choice:** Person + Account (Recommended).
**Notes:** Enum accepts extension for workspace/household; ingest doesn't emit them in v1.

---

## Merge policy evolution

| Option | Description | Selected |
|--------|-------------|----------|
| Evolve: hard-match auto-resolve + soft-match review, preserve current weights as soft-match floor | Hard: verified email, user_id, billing_customer_id, subscription_id, workspace_id → auto at 1.0. Soft: existing weights + 0.8/0.4 thresholds. Reversible lineage preserved. | ✓ |
| Keep current scoring as-is | authenticated user_id doesn't auto-resolve even with perfect evidence. | |
| Full doc 20 rewrite | Breaks P101 regression tests; more churn than needed. | |

**User's choice:** Evolve + preserve (Recommended).
**Notes:** Respects doc 20 Part 2 deterministic-first + preserves P100 D-05 governance posture.

---

## Trait materialization

| Option | Description | Selected |
|--------|-------------|----------|
| Materialized TraitSnapshot + recompute cadence per trait family | Rows per profile with computed_at + source_event_ref[] + freshness_mode. real_time intent, hourly lifecycle, daily fit. | ✓ |
| On-read computation only | Always fresh. No freshness audit. Performance tanks. | |
| Hybrid (core materialized, derived on-read) | More complex boundary. | |

**User's choice:** Materialized (Recommended).
**Notes:** Matches doc 20 Part 4 + P209 claim TTL/freshness rules.

---

## Deletion/export posture

| Option | Description | Selected |
|--------|-------------|----------|
| Tombstone profile + cascade purge events/traits/audience + retain ConsentRecord | PII scrubbed, identity_id retained. ConsentState retained with deletion_evidence_ref (legal defensibility). Export = full bundle per DSR. | ✓ |
| Hard delete everything including consent | Lose suppression evidence; re-contact possible. | |
| Defer to later phase | CDP deployment before deletion = compliance gap. | |

**User's choice:** Tombstone + retain consent (Recommended).
**Notes:** Satisfies GDPR right-to-erasure + suppression-must-survive-deletion precedent from P104.

---

## Downstream consumption (CRM + attribution + timeline)

| Option | Description | Selected |
|--------|-------------|----------|
| Read-through adapter: CRM reads via CDP adapter, no CRM schema change | New lib/markos/cdp/adapters/crm-projection.ts. CDP backfills canonical_identity_id. CRM 360 deferred to P222. | ✓ |
| Dual-write CRM + CDP | 2x write amplification + drift risk. | |
| Full CRM migration in phase 221 | Bleeds into P222 scope; breaks boundary. | |

**User's choice:** Read-through adapter (Recommended).
**Notes:** Preserves phase 221/222 boundary. Additive.

---

## API + MCP surface

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only v1: profiles GET + consent GET + audiences GET + get_unified_profile + get_consent_state MCP | Mutations via tenant-operator UI + review flows. Write APIs land with consuming engine. | ✓ |
| Full doc 20 surface (6 API families + 6 MCP tools) | Scope explosion; write paths need downstream engine contracts first. | |
| Internal-only adapters, no public API/MCP | SaaS agents (P217) + analytics (P225) + T0 (P213) need profile reads soon. | |

**User's choice:** Read-only v1 (Recommended).
**Notes:** Contracts written with consuming engine so dispatch semantics match.

---

## Observability + operator posture

| Option | Description | Selected |
|--------|-------------|----------|
| Merge review inbox + consent drift audit + audience snapshot log | Reuse P100 merge UX; cron-based consent diff emits operator task; append-only audience compute log. | ✓ |
| Merge review only, defer consent/audience | Silent consent drift = P104 fail-closed violation. | |
| Full CDP dashboard (identity graph viewer, trait explorer, segment builder UI) | Scope creep into P222/P225. | |

**User's choice:** Merge inbox + consent drift + audience log (Recommended).
**Notes:** No new dashboards. Reuses P201 markos_audit_log + P100 review queue. Full UI explorers deferred.

---

## Claude's Discretion

- Module boundary under `lib/markos/cdp/` (identity vs profiles vs adapters vs audiences).
- Trait recompute infrastructure (cron vs AgentRun vs Vercel Queue) — align with P207 AgentRun v2 patterns at plan time.
- Audience logic_json DSL (JSON Logic vs custom AST) — evaluate at plan time.
- Exact contract IDs + migration numbers + test file names per repo convention.

## Deferred Ideas

- P222 CRM 360 timeline-first workspace.
- P223 native dispatch consuming ConsentState + AudienceSnapshot (full consent shim cutover).
- P224 conversion/launch reading audiences.
- P225 semantic attribution + journey + narrative layer on cdp_events.
- P226 sales enablement reading profile + intent traits.
- P227 ecosystem/partner/affiliate workflows.
- P228 commercial OS integration closure.
- Workspace + household profile_type.
- Full doc 20 API (6 families) + 6 MCP tools.
- Full CDP dashboard UX (identity graph viewer, trait explorer, preference center).
- Doc 20 agent family registration (Identity Resolver, Trait Compiler, Audience Builder, Consent Guardian) — readiness registry P217-style.
