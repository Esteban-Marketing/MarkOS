# Phase 87: Dual Role Views (Operator + Agent) - Research

**Researched:** 2026-04-12
**Domain:** Role-view separation over unified artifact lineage
**Confidence:** High

## Locked Direction

- Supabase stores app/runtime operational data (roles, tenant-scoped audit and execution logs, retrieval traces, governance state).
- Obsidian Vault stores generated and organized content/documents as canonical bodies.
- Integration is metadata-linking via shared artifact identity (`artifact_id`, `tenant_id`, canonical path/checksum/provenance pointers).

## Architecture Recommendation

1. Keep content body ownership in Obsidian-bound ingest/sync flow.
2. Introduce Supabase-backed audit store adapter preserving current API shape (`append`, `getAll`, `size`, `clear`).
3. Add explicit role-view service boundaries:
   - Operator view: content lifecycle + management metadata actions.
   - Agent view: retrieval/execution contracts (reason/apply/iterate).
4. Enforce unified lineage by logging both operator lifecycle and agent retrieval/execution events under same artifact identity.

## Existing Reusable Runtime

- `onboarding/backend/vault/vault-retriever.cjs` (agent retrieval pipeline)
- `onboarding/backend/vault/visibility-scope.cjs` (role + tenant guards)
- `onboarding/backend/vault/sync-service.cjs` (operator-side sync entrypoint)
- `onboarding/backend/vault/audit-store.cjs` (stable interface to preserve)

## Planning Implications

- Phase 87 should deliver persistence foundation for ROLEV-04 now (not defer to Phase 88).
- Phase 88 remains hardening/verification/milestone closeout.
- Test strategy must include role isolation, tenant isolation, and lineage continuity checks.
