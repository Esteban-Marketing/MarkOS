---
phase: 35
phase_name: Smart One-Command Deployment
milestone: v2.5
status: COMPLETE
completed: 2026-04-01
summary_created: 2026-04-01T23:59:59Z
executed_by: GitHub Copilot
---

# Phase 35 Summary: Smart One-Command Deployment

**Phase:** 35  
**Status:** ✅ COMPLETE  
**Completed:** 2026-04-01

## Delivered Scope

### 35-01 Hybrid Install Contract
- Added shared CLI/runtime helpers in `bin/cli-runtime.cjs`.
- `npx markos` is now the primary install path with support for:
  - `--yes`
  - `--project-name <name>`
  - `--no-onboarding`
  - `--project`
  - `--global`
- Install and update now share runtime classification for Node support, interactivity, CI/headless handling, and existing-install handoff behavior.

### 35-02 Smart Defaults + Managed Artifact Hydration
- Installer now infers project-local install and project name from the working directory by default.
- Installer now writes `.markos-project.json` when missing.
- Install manifest now includes `project_slug` and continues to record file hashes for update safety.
- `.gitignore` protections remain idempotent across reruns.

### 35-03 Readiness Classification + Safe Handoff
- `bin/ensure-vector.cjs` now returns an actionable readiness next step when providers are not configured.
- Install completion now reports `ready`, `degraded`, or `blocked`.
- Missing AI keys and missing vector configuration degrade the install rather than forcing prompts or failing the base setup.
- Automatic onboarding launch is now mode-aware and only happens in interactive contexts when the handoff is not blocked.

### 35-04 Docs + Regression Coverage
- README now documents bare `npx markos` as the primary install command.
- TECH-MAP install flow now reflects default-first installer behavior and readiness classification.
- Installer tests now cover:
  - default no-prompt install path
  - explicit flag overrides
  - idempotent `.gitignore` behavior
  - existing-install auto-handoff to update
- Update tests now cover deterministic non-interactive conflict handling.
- Protocol tests now enforce the new README command contract.

## Files Updated

### Runtime / CLI
- `bin/cli-runtime.cjs`
- `bin/install.cjs`
- `bin/update.cjs`
- `bin/ensure-vector.cjs`

### Docs
- `README.md`
- `TECH-MAP.md`

### Tests
- `test/setup.js`
- `test/install.test.js`
- `test/update.test.js`
- `test/protocol.test.js`

## Verification

- `node --test test/install.test.js` → pass
- `node --test test/update.test.js` → pass
- `node --test test/protocol.test.js` → pass
- `npm test` → **99 pass, 0 fail**

## Outcome

Phase 35 delivered the installer/runtime contract needed to make the MarkOS one-command promise real in practice. The system now defaults intelligently, avoids hanging in non-interactive environments, keeps install and update behavior aligned, and surfaces readiness state clearly instead of treating file copy completion as operational success.
