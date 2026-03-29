# Phase 23 Compatibility Contract

## Purpose

Define the compatibility contract used while migrating to MarkOS-first identity surfaces.

## Contract Rules

1. MarkOS remains the canonical public identity for package, docs, and onboarding UI.
2. Legacy MARKOS paths are preserved where required for runtime/file compatibility.
3. No destructive migration of local state paths occurs during active runtime flows.
4. Prompts and protocol artifacts should prefer `.markos-local` anchors while runtime fallback remains available where implemented.

## Validation Expectations

- Required phase artifacts for identity normalization exist in `.planning/phases/23-identity-normalization/`.
- Protocol-level checks can assert presence of this contract document.
