# GSD Customization Boundary

## Purpose

This document is the canonical ownership guide for the dual-root GSD system in this repository. It explains which surfaces are shared framework content, which surfaces are localized runtime content, and which surfaces are client-owned overrides so future phases do not reopen the 64.2 and 64.3 ownership decisions.

## Shared Canonical Framework (`.github/**`)

| Surface | Ownership | Notes |
|---|---|---|
| `.github/get-shit-done/**` | Canonical shared GSD framework | Shared agents, skills, workflows, templates, tooling, and policy baselines live here. |
| `.github/gsd-file-manifest.json` | Canonical shared manifest inventory | Tracks the live shared GSD tree and is refreshed deterministically. |
| `.github/copilot-instructions.md` | Hidden shared-framework artifact | Framework-managed Copilot artifact only; it is not the project-root instruction contract. |

## Localized Runtime Layer (`.claude/**`)

| Surface | Ownership | Notes |
|---|---|---|
| `.claude/get-shit-done/**` | Localized Claude runtime and dispatch layer | Localized workflows, prompts, templates, and runtime wiring stay here. |
| `.claude/gsd-file-manifest.json` | Localized manifest inventory | Tracks the live localized GSD tree and is refreshed deterministically. |
| `.claude/skills/**` | Localized skill routing | These remain pointed at localized `.claude/get-shit-done/**` paths and are not repointed into `.github/**`. |

## Client Override Layer (`.markos-local/**`)

| Surface | Ownership | Notes |
|---|---|---|
| `.markos-local/**` | Client-owned override surface | Client-specific overrides live here only. |
| `.markos-local/**` content | Not framework-owned | This surface is not part of the canonical shared framework or localized runtime trees. |

## Root Instruction Artifacts

| Artifact | Role | Ownership |
|---|---|---|
| `copilot-instructions.md` | Shared project contract for the `.github` GSD and Copilot surface | Project-root shared contract |
| `CLAUDE.md` | Localized project contract for the `.claude` runtime | Project-root localized contract |
| `.github/copilot-instructions.md` | Hidden framework artifact generated for shared framework use | Shared framework artifact only, not a substitute for root `copilot-instructions.md` |

## Working Rule

When ownership questions arise, use this split without reinterpretation: `.github/**` is canonical shared framework content, `.claude/**` is the localized runtime and dispatch layer, `.markos-local/**` is client-owned override space, root `copilot-instructions.md` is the shared project contract, and root `CLAUDE.md` is the localized project contract.

## Refresh Trigger

Update this document when shared-versus-localized-versus-client ownership changes or when new root instruction artifacts are intentionally introduced.