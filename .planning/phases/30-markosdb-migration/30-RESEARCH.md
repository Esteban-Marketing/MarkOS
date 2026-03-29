# Phase 30 Research Notes

## Architecture Baseline

1. Current runtime is local-first with compatibility namespaces and `.markos-local` persistence.
2. Vector Store metadata already tracks slug/section context and can be extended for outcome and discipline tags.
3. Existing runtime-context guards split local and hosted behavior, providing a stable place to add cloud-canonical routing.

## Migration Guardrails

- No in-request destructive migration of existing collections.
- Support phased rollout: local-only -> dual-write -> cloud-primary.
- Maintain compatibility reads for legacy namespace prefixes during v2.2.

## Evidence Targets

- Contract document linking `.markos-local` files to Supabase tables and Upstash vector tags.
- Replay-safe ingestion proof with checksum/version guards.
- Auth boundary proof for protected cloud endpoints.

