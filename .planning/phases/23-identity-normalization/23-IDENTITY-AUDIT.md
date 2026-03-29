# Phase 23 Identity Audit

## Scope

This artifact records the identity-normalization audit outcomes completed in Phase 23.

## Canonical Identity

- Public identity: `MarkOS`
- Compatibility surfaces retained for transition:
  - `.agent/markos/`
  - `.markos-local/`
  - `.markos-project.json`
  - `.markos-install-manifest.json`
  - `MARKOS_TELEMETRY`
  - `markos-*` Chroma namespaces

## Audit Outcome

- MarkOS-first naming is enforced on public onboarding and package surfaces.
- Compatibility-only surfaces remain explicit for backward compatibility.
- Runtime behavior remains dual-compatible during transition windows.
