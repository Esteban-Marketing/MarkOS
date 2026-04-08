---
phase: 37
slug: markos-ui-control-plane
status: reconstructed
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 37 — Validation Strategy Backfill

> Historical reconstruction of the missing Phase 37 validation contract. This file reflects the planned validation architecture preserved in `37-RESEARCH.md` and `37-PLAN.md`; the original phase artifacts do not retain a dedicated execution-time validation ledger.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Mixed: application contract tests, Supabase policy checks, accessibility checks, and route performance checks |
| **Quick run command** | `npm test` |
| **Primary validation sequence** | `npm test` followed by entity contract, RLS, accessibility, performance, and publish-flow checks described below |
| **Historical evidence state** | Planning-level validation architecture preserved; explicit command transcripts not preserved in Phase 37 summary |

---

## Planned Validation Layers

| Layer | Expected Coverage |
|-------|-------------------|
| Contract validation | Company, MIR, MSP, ICP, Segment, and Campaign schemas; backward compatibility against intake/orchestrator contracts; AI twin snapshot contract checks |
| Security and leakage validation | Supabase RLS policy tests, cross-tenant denial checks, publish/audit log integrity |
| UX quality validation | WCAG AA checks, workflow task scripts, instrumented funnel quality thresholds |
| Performance validation | Dashboard/editor route budgets for LCP, TTI, and server response times |
| AI interoperability validation | UI edit -> contract snapshot -> retrieval/read-back round trip |

---

## Manual-Only Verifications

| Behavior | Why Manual | Instructions |
|----------|------------|--------------|
| White-label token propagation across the app shell | Requires visual confirmation across multiple routes and themes | Apply a tenant theme pack and confirm semantic tokens, not hardcoded styles, control all major surfaces. |
| End-to-end publish and retrieval flow | Requires the app shell, persistence layer, and agent snapshot generation working together | Edit a core artifact, publish it, verify a canonical snapshot is generated, then confirm it is retrievable through the agent-facing path. |

---

## Historical Evidence

| Artifact | What it proves |
|----------|----------------|
| `37-01-SUMMARY.md` | Route scaffold, contracts, theming, RBAC, telemetry, and Supabase migration baseline were delivered |
| `37-RESEARCH.md` | The required validation architecture and release-readiness gates were defined before execution |
| `37-PLAN.md` | Validation order and acceptance criteria were explicitly locked |

---

## Sign-Off

- [x] Missing VALIDATION artifact backfilled from preserved planning evidence
- [ ] Execution-time command evidence preserved in phase-local artifacts
- [ ] Nyquist closure can be asserted retroactively from a dedicated validation run

**Validation verdict:** ⚠️ Reconstructed strategy only. Phase 37 now has an explicit validation artifact, but it should not be treated as a stronger historical audit than the source artifacts support.