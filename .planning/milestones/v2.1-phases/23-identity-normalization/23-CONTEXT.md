# Phase 23 Context — Identity Normalization

## Objective

Normalize the product identity across package metadata, runtime messages, manifests, local directories, and documentation while preserving backward compatibility for existing MARKOS installs.

This phase is the first execution phase of milestone v2.1. It is deliberately narrower than the old repo-wide rebrand roadmap: the goal is not to rename everything in one pass, but to make MarkOS the authoritative public identity while turning MARKOS-era identifiers into explicit compatibility surfaces.

## Phase Scope

### In Scope
- Audit all remaining MARKOS identifiers and classify them by execution importance.
- Normalize package/runtime copy and primary public-facing documentation to MarkOS-first language.
- Define the compatibility contract for legacy paths, manifests, environment variables, localStorage keys, and Vector Store namespaces.
- Add validation/guardrails that prevent accidental reintroduction of mixed identity strings in public-facing surfaces.

### Out of Scope
- Full directory rename of `.agent/markos/` to `.agent/markos/`.
- Full token-registry migration from `MARKOS-*` to `MARKOS-*`.
- Vector Store namespace rewrites that require production data migration.
- Broad runtime hardening across local/serverless flows beyond what is needed to support the identity contract.

## Locked Decisions

1. **Milestone priority:** v2.1 product hardening takes precedence over a rename-only execution path.
2. **Public product identity:** MarkOS is the primary external name.
3. **Compatibility policy:** MARKOS identifiers are allowed only when they are explicitly classified as compatibility-critical or historical.
4. **Migration style:** Compatibility-first. Add explicit contracts and validation before destructive renames.
5. **Immediate next phase:** Phase 24 runtime hardening follows Phase 23 once the identity contract is documented and enforced.

## Requirements Mapped

- **IDN-01**: Product-facing identity is consistently MarkOS across package metadata, install/update UX, onboarding copy, and primary documentation.
- **IDN-02**: Remaining MARKOS identifiers are intentionally classified as compatibility-only, historical-only, or migration targets.
- **IDN-03**: A compatibility map exists for legacy paths, manifests, env vars, localStorage keys, and Vector Store namespaces.

## Key Files and Surfaces

| Surface | Why It Matters | Likely Outputs |
|---------|----------------|----------------|
| `package.json`, `package-lock.json`, `VERSION` | Public package identity and install UX | MarkOS-first metadata, explicit legacy aliases |
| `README.md`, `CHANGELOG.md`, `.planning/PROJECT.md` | Primary operator-facing documentation | MarkOS-first messaging and milestone clarity |
| `bin/install.cjs`, `bin/update.cjs` | Installer and updater UX | MarkOS banners/messages, legacy compatibility notes |
| `onboarding/index.html`, `onboarding/onboarding.js`, `onboarding/backend/*.cjs` | User-facing onboarding language and runtime identifiers | MarkOS copy plus explicit compatibility handling |
| `.protocol-lore/*.md` | Agent boot and codebase navigation | Reduced ambiguity between MarkOS and MARKOS terms |
| `.markos-project.json`, `.markos-install-manifest.json`, `.markos-local/`, Vector Store collection names | Legacy state contract | Classified as compatibility-only or migration targets |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cosmetic edits hide compatibility-critical paths | High | Classify identifiers before editing anything public-facing |
| Public docs and runtime messages drift again | Medium | Add a validation plan and explicit contract file references |
| This phase bleeds into full rename work | High | Keep destructive renames and namespace migration out of scope |
| Mixed identity persists in key user journeys | Medium | Prioritize install/update UX, onboarding copy, and primary docs first |

## Deliverables

1. `23-CONTEXT.md` — this document.
2. `23-IDENTITY-AUDIT.md` — repo-wide audit and classification of remaining MARKOS identifiers.
3. `23-COMPATIBILITY-CONTRACT.md` — canonical versus compatibility-only identity contract for legacy surfaces.
4. `23-01-PLAN.md` — audit and classification of remaining MARKOS identifiers.
5. `23-02-PLAN.md` — normalize package/runtime copy and public-facing docs.
6. `23-03-PLAN.md` — define the compatibility contract across legacy surfaces.
7. `23-04-PLAN.md` — add validation and guardrails for future identity drift.

## Exit Criteria

Phase 23 is complete when MarkOS is clearly established as the public product identity, every remaining MARKOS identifier has an explicit reason to exist, and the repo contains a documented compatibility contract plus lightweight validation to keep the system from drifting back into mixed naming.
