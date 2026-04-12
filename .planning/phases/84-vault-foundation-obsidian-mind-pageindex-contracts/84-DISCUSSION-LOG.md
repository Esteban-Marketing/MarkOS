# Phase 84: Vault Foundation (Obsidian Mind + PageIndex Contracts) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 84-vault-foundation-obsidian-mind-pageindex-contracts
**Areas discussed:** Vault Taxonomy Contract, PageIndex Adapter Contract, Migration Cutover Strategy, Tenant Isolation Boundaries

---

## Vault Taxonomy Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Discipline-first root + semantic index manifests | Root folders by discipline; separate index artifacts for audience, funnel, and concept maps | ✓ |
| Concept-first root + discipline aliases | Primary concept families; discipline paths generated as views | |
| Dual physical roots | Both discipline and concept trees materialized on disk (higher sync complexity) | |

**User's choice:** Discipline-first root + semantic index manifests
**Notes:** Aligns with prior locked decisions: discipline-first operator navigation with semantic cross-cut discovery.

---

## PageIndex Adapter Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Single query envelope with mode/filter fields | One endpoint supports reason/apply/iterate + audience/discipline filters via typed fields | ✓ |
| Separate endpoint per mode | Distinct contracts for each retrieval mode | |
| Pass-through adapter | Minimal wrapper around provider APIs; normalize later | |

**User's choice:** Single query envelope with mode/filter fields
**Notes:** Preserves one governed contract surface and keeps mode behavior typed rather than endpoint-fragmented.

---

## Migration Cutover Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Shadow-read only for validation, no production fallback | Run temporary comparison checks, then remove legacy read path at phase close | |
| Immediate hard cutover day one | Disable legacy path immediately with no comparison period | ✓ |
| Long dual-run fallback | Keep both paths active until late milestone | |

**User's choice:** Immediate hard cutover day one
**Notes:** Confirms full migration posture and avoids prolonged dual-runtime maintenance.

---

## Tenant Isolation Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| RLS + scoped query proof matrix (unit + integration) | Explicit tenant deny checks at Supabase and PageIndex scope boundaries | ✓ |
| RLS only in this phase | Defer PageIndex scope proof to later phase | |
| End-to-end smoke only | Single happy-path tenant isolation check | |

**User's choice:** RLS + scoped query proof matrix (unit + integration)
**Notes:** Isolation proof must be contractual and closeable in Phase 84, not deferred.

---

## the agent's Discretion

- Concrete JSON schema field names for the single query envelope.
- Module boundaries and test fixture organization while preserving selected contracts.

## Deferred Ideas

- None captured during this discussion run.
