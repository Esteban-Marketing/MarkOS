# Phase 226: Sales Enablement and Deal Execution - Discussion Log

> **Audit trail only.** Decisions in `226-CONTEXT.md`.

**Date:** 2026-04-24
**Phase:** 226-sales-enablement-deal-execution
**Mode:** discuss (--chain)

---

## Object model granularity

| Option | Selected |
|--------|----------|
| Full doc 24: 8 tables (Battlecard + DealBrief + ProofPack + DealRoom + ObjectionLibrary + ProposalSupport + WinLossRecord + ObjectionRecord) | ✓ |
| Minimal v1 (3 tables) | |
| Hybrid (defer DealRoom + ObjectionLibrary) | |

**User's choice:** Full doc 24 (Recommended).

---

## ProofPack assembly

| Option | Selected |
|--------|----------|
| Hybrid: snapshot at first approval; refresh on EvidenceMap claim TTL exceeded | ✓ |
| Pre-assembled, no refresh | |
| Computed on request, no snapshot | |

**User's choice:** Hybrid (Recommended).

---

## DealBrief generation

| Option | Selected |
|--------|----------|
| Hybrid: auto-draft on stage_change + operator approves | ✓ |
| Operator-only manual creation | |
| Auto-generated + auto-publish (no approval) | |

**User's choice:** Hybrid auto-draft + approval (Recommended).

---

## Battlecard freshness model

| Option | Selected |
|--------|----------|
| EvidenceMap claim_ref TTL inheritance + last_verified_at + auto-stale on competitor profile change | ✓ |
| Per-battlecard TTL (90 days) + manual review | |
| Manual operator review only | |

**User's choice:** EvidenceMap inheritance (Recommended).

---

## Proposal/quote boundary

| Option | Selected |
|--------|----------|
| ProposalSupport + Quote-as-Snapshot (immutable PricingRecommendation snapshot) | ✓ |
| ProposalSupport read-only consumer ONLY (no Quote object) | |
| Full Quote lifecycle with discount logic | |

**User's choice:** Quote-as-Snapshot (Recommended). Doc 24 rule 3 honored.

---

## Win/loss capture model

| Option | Selected |
|--------|----------|
| Structured WinLossRecord (reason_taxonomy + competitive_set + features_evaluated + objection_history + price_drivers + champion_id + decision_maker_id) | ✓ |
| Free-text + tags | |
| Hybrid structured + free-text | |

**User's choice:** Structured (Recommended). Free-text notes field still present.

---

## DealRoom scope

| Option | Selected |
|--------|----------|
| First-class deal_rooms + deal_room_artifacts + deal_room_views with stakeholder share-link + activity tracking | ✓ |
| Computed view (no SOR) | |
| Defer DealRoom UX to v2 | |

**User's choice:** First-class (Recommended). Public share endpoint with BotID + rate-limit (P224 pattern).

---

## Approval gates

| Option | Selected |
|--------|----------|
| Class-based: battlecard auto-approve internal; proposal/ProofPack/DealRoom share/Quote require approval; content classifier reuse P223 D-16 | ✓ |
| Every customer-facing material requires approval | |
| Threshold-based (count + content classifier) | |

**User's choice:** Class-based (Recommended).

---

## Forecast + risk explainability

| Option | Selected |
|--------|----------|
| deal_health_signals (stage_velocity + objection_density + champion_engagement + competitive_threat) + risk_explanation narrative; consumed by P225 forecast | ✓ |
| Defer forecast to P225 (P226 ships objection/proof only) | |
| Full forecast model in P226 (probability + commit/best-case/worst-case) | |

**User's choice:** deal_health_signals + P225 narrative (Recommended).

---

## Cross-team handoff

| Option | Selected |
|--------|----------|
| P222 lifecycle_transitions + DealBrief regeneration on owner_change + handoff_record per stage_transition | ✓ |
| Manual operator-driven handoff notes | |
| DealBrief regeneration only (no handoff_record) | |

**User's choice:** Full handoff_record + DealBrief regen (Recommended).

---

## API + MCP + UI surface

| Option | Selected |
|--------|----------|
| Read-write v1 /v1/sales/* + 8 MCP tools + 6 UI workspaces + public /share/dr/{token} | ✓ |
| Read-only v1 | |
| Minimal MCP (3 tools) | |

**User's choice:** Full surface (Recommended).

---

## Claude's Discretion

- Module boundary `lib/markos/sales/*`.
- LLM provider for DealBrief gen (Vercel AI Gateway + claude-sonnet-4-6).
- deal_health_signals composite weights (start equal-weighted; tune via P225 anomaly feedback).
- ISR cache TTL per artifact_kind.
- share_link_token format (HMAC-signed UUID with tenant prefix).

## Deferred Ideas

- Visual deal room builder → v2.
- AI live conversation coaching → defer.
- Customer-facing chat in DealRoom → defer.
- Full PDF proposal generation → v2.
- Multi-language sales materials → v2.
- Battlecard/ProofPack template marketplace → defer.
- Deal forecast probability ML → P225 forecast layer.
- Quote discount engine → P205 only.
- Sales call recording integration (Gong/Chorus) → defer.
- Predictive deal-loss ML → P225 + ML.
- ProofPack A/B testing → defer.
- Public DealRoom pricing display with competitor comparison → defer (security).
- Co-sell partner workflows → P227.
- Salesforce/HubSpot sync → P228.
