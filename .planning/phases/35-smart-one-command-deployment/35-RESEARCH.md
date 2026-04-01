---
phase: 35
phase_name: Smart One-Command Deployment
milestone: v2.5
milestone_name: Enhancement & Optimization Process
researched: "2026-04-01"
domain: Installer UX, deployment automation, onboarding readiness
confidence: HIGH
---

# Phase 35: Smart One-Command Deployment — Research

**Researched:** 2026-04-01  
**Domain:** CLI deployment optimization, installer automation, onboarding readiness  
**Confidence:** HIGH  

## Summary

Phase 35 should convert MarkOS from a prompt-first installer into a hybrid smart installer where `npx markos` is the primary entrypoint and manual input is only required when the system cannot infer a safe default. The repo already has the core pieces: `bin/install.cjs` as the primary CLI, `bin/update.cjs` for idempotent patching, `bin/ensure-vector.cjs` for provider readiness reporting, and `onboarding/backend/server.cjs` for the operational UI/runtime handoff. What is missing is orchestration quality: automatic environment discovery, deterministic non-interactive behavior, shared readiness checks, structured failure output, and tighter docs/runtime parity.

Comparable CLIs point to the right pattern. `create-next-app` uses recommended defaults plus `--yes` and explicit override flags. Vercel CLI distinguishes interactive login flows from CI token-based automation. Supabase CLI separates local-environment prerequisites from product initialization and is explicit about local runtime constraints. MarkOS should follow the same shape: auto-first in local interactive shells, explicit non-interactive rules in CI/headless mode, and no promise that unavailable dependencies can be silently invented.

**Current state:**
1. `npx markos` runs an interactive wizard and delegates `update` correctly.
2. Installer prompts for install location, project name, onboarding launch, and AI key entry.
3. Vector readiness only returns a degraded report; installer does not turn that into a clear operational decision tree.
4. Onboarding launch assumes a local runtime and directly requires `server.cjs`, which is useful but not yet validated through a post-install readiness contract.
5. README still leads with `npx markos install`, while the code already supports bare `npx markos` as the primary flow.

**Recommended phase outcome:** a one-command path where a typical local user can run `npx markos`, accept defaults, and land in a working onboarding environment with stable artifacts, actionable warnings, and idempotent reruns.

---

## Competitive Landscape

### 1. `create-next-app`

- Uses a recommended-defaults path instead of forcing the user through every branch.
- Supports `--yes` and explicit override flags so the same tool works for both interactive and automated usage.
- Separates default behavior from customization instead of making customization mandatory.

**Implication for MarkOS:** the installer should default to the common case, remember or infer safe values, and only prompt when a required decision cannot be derived.

### 2. Vercel CLI

- Treats interactive login as normal for humans but requires token-based explicitness in CI/CD.
- Exposes a broad command surface, but the default command still has predictable behavior.
- Makes telemetry, env management, and project linking explicit subflows rather than hidden side effects.

**Implication for MarkOS:** CI/headless mode must be first-class. Installer behavior should be deterministic when stdin is unavailable, and secrets/config should be surfaced as explicit prerequisites rather than buried in prompts.

### 3. Supabase CLI

- Clearly states local prerequisites for running the full local stack.
- Uses separate steps for initialize vs start, which keeps failure modes understandable.
- Documents local network safety constraints instead of pretending every machine can run the same stack automatically.

**Implication for MarkOS:** MarkOS should not imply it can provision every external dependency automatically. It should validate what exists, degrade cleanly where supported, and explain the missing step precisely.

### Strategic Readout

The winning pattern is not “zero prompts at all costs.” It is “zero unnecessary prompts, explicit prerequisites, deterministic fallbacks, and one obvious happy path.” MarkOS is already positioned as a one-command product, so the risk is not missing a feature; the risk is overpromising a magic install while still requiring several hidden operator choices.

---

## Audience Intelligence

### Primary User Types

1. **Solo founder / operator**
   Wants to run one command, answer as little as possible, and get to a working onboarding screen quickly.
2. **Agency operator / internal growth lead**
   Needs repeatable project-level setup, safe reruns, and compatibility with existing repo structure.
3. **Technical evaluator / AI-native developer**
   Expects flags, clear exit codes, non-interactive compatibility, and readable failure output.

### Observed User Expectations From Repo Positioning

- Product messaging already promises one-command deployment and low-friction setup.
- The onboarding backend is positioned as the operational handoff after install, not a separate advanced step.
- The update engine already assumes safe repeatability and conflict awareness, so install behavior now needs to reach the same bar.

### High-Value User Expectations For Phase 35

- No mandatory wizard branches for the common local path.
- Safe defaults for project-local install and onboarding launch behavior.
- Immediate explanation when a missing key or runtime requirement blocks full functionality.
- Rerunning the installer should converge, not create drift.
- The same command should be scriptable in CI/headless contexts.

---

## Channel Benchmarks

These are planning targets derived from current developer-tool UX norms and the observed behavior of comparable CLIs, not external survey medians.

| metric | industry avg | target |
|---|---|---|
| Commands to first working local experience | 2-4 commands | 1 command (`npx markos`) |
| Mandatory prompts on happy path | 3-8 prompts | 0 required prompts for typical local setup |
| Time to working onboarding environment | 2-10 minutes depending on config | under 90 seconds when prerequisites exist |
| Re-run behavior | mixed; manual cleanup often required | idempotent rerun with no duplicate managed artifacts |
| Non-interactive support | partial or command-specific | deterministic success/fail with explicit exit codes |
| Failure diagnosis quality | generic dependency errors common | single summary with exact missing prerequisite or next step |

---

## Recommended Approach

### Phase 35 Should Stay Single-Focus

This should remain one focused engineering phase, not a multi-phase milestone fragment. The objective is installer quality, not broader product expansion.

### Proposed Installer Contract

1. `npx markos`
   Primary command. Runs smart install flow.
2. `npx markos update`
   Remains the explicit patch/update path.
3. Recommended new flags for planning:
   - `--yes`
   - `--project-name <name>`
   - `--no-onboarding`
   - `--port <n>`
   - `--ci` or auto-detect CI
   - `--global` / `--project`

### Proposed Execution Stages

1. **Preflight**
   Detect Node version, shell interactivity, existing install, existing GSD, existing `.env`, and current project slug.
2. **Discovery**
   Infer safe defaults: project-local install, current directory project name, onboarding enabled for interactive shells, onboarding disabled in CI unless explicitly requested.
3. **Hydration**
   Create or repair managed artifacts such as `.markos-install-manifest.json`, `.markos-project.json`, and `.gitignore` block. Populate `.env` only when the user or environment provides enough information.
4. **Readiness**
   Run vector/provider checks and onboarding boot prerequisites; classify outcome as `ready`, `degraded`, or `blocked`.
5. **Handoff**
   Start onboarding only when readiness is sufficient and the mode allows it; otherwise print the exact next command and missing dependency.

### Architecture Direction

- Shared preflight/readiness utilities should be extracted so install and update use the same environment rules.
- Prompting should become a fallback mechanism, not the main control flow.
- The installer should produce a concise structured summary at the end, even in success cases.
- Docs should be aligned so `npx markos` is the primary path and `npx markos install` is either treated as an alias or removed from primary messaging.

---

## Platform Capabilities and Constraints

### Existing Capabilities

- `package.json` already exposes `markos` through `bin/install.cjs`.
- `bin/install.cjs` already detects existing installs and hands off to update.
- `bin/update.cjs` already has manifest-based idempotent patching and conflict detection.
- `bin/ensure-vector.cjs` already classifies provider readiness as `providers_ready` or `providers_degraded`.
- `onboarding/backend/server.cjs` already exposes `/config` and `/status`, which can anchor post-install health validation.

### Current Constraints

- Installer logic is still prompt-sequenced, so it cannot cleanly support automated or partially automated paths.
- AI key collection only happens during onboarding-selected installs, which couples configuration to a later branch in the flow.
- Vector readiness is reported but not converted into actionable operator modes.
- Browser launch and server startup are local-machine assumptions and should not run automatically in CI/headless contexts.
- README/runtime parity is weak: the code treats bare `npx markos` as valid, while docs still prioritize `npx markos install`.

### Hard Constraints To Respect

- Node `>=20.16.0` remains a hard gate.
- External providers cannot be silently provisioned by the installer today.
- Local server launch must stay bound to safe local defaults and avoid pretending remote deployment is complete.
- Any automated `.env` handling must avoid echoing or logging secrets.

---

## Tracking Requirements

Phase 35 should define a minimal install telemetry and diagnostics contract, even if the first implementation logs locally before any remote analytics hookup.

### Recommended Events / Status Records

| event | required properties | purpose |
|---|---|---|
| `markos_install_started` | mode, cwd_type, existing_install, has_gsd | Baseline install entrypoint visibility |
| `markos_install_preflight_completed` | node_ok, interactive, ci_detected | Confirms environment classification |
| `markos_install_defaults_applied` | install_scope, inferred_project_name, onboarding_default | Measures auto-configuration success |
| `markos_install_prompt_required` | prompt_type, reason | Detects where automation still breaks down |
| `markos_install_readiness_result` | readiness_status, vector_status, env_status | Captures blocked vs degraded vs ready outcomes |
| `markos_install_completed` | launched_onboarding, manifest_written, duration_ms | Core success record |
| `markos_install_failed` | stage, code, actionable_reason | Makes failures diagnosable |

### Operator-Facing Summary Contract

At the end of install, print a compact status block with:

- install mode
- detected project name / slug
- manifest status
- vector readiness status
- onboarding launch status
- exact next step if degraded or blocked

---

## Risks and Pitfalls

1. **Promise mismatch**
   Marketing says one-command deploy; runtime still behaves like a manual wizard. This is the largest trust risk.
2. **Hidden non-interactive failure**
   CI/headless runs will hang or misbehave if prompt-first control flow remains the default.
3. **Config drift on rerun**
   Install must not append duplicate blocks, rewrite values unnecessarily, or fork managed artifact state.
4. **Install/update divergence**
   If preflight logic lives only in install, update will become a second inconsistent control plane.
5. **Secret leakage**
   Any auto-hydration or summary output that prints tokens or raw env content is unacceptable.
6. **Local startup false positive**
   Printing success before validating onboarding availability will create a fragile “installed but unusable” state.
7. **Scope inflation**
   Phase 35 should not attempt full infrastructure provisioning for third-party providers; that would delay the actual UX win.

---

## Validation Architecture

### Required Verification Layers

1. **Installer unit/integration matrix**
   - clean install
   - existing install -> update handoff
   - GSD coexistence
   - missing Node version
   - missing keys in interactive mode
   - missing keys in CI/headless mode
   - degraded vector readiness
   - rerun idempotency

2. **Update parity tests**
   - shared preflight behavior
   - manifest integrity preserved
   - conflict handling unchanged

3. **Onboarding runtime checks**
   - boot server after install when allowed
   - verify `/config` and `/status`
   - ensure port fallback messaging remains actionable

4. **Docs parity checks**
   - README examples match actual CLI behavior
   - protocol docs describe the same primary command and fallback rules

### Acceptance Criteria For Planning

- `npx markos` is the documented and working happy path.
- Typical local setup requires no mandatory prompts beyond missing secrets or unsafe ambiguities.
- CI/headless behavior is deterministic and documented.
- Installer reruns do not create duplicate or conflicting managed artifacts.
- Success output distinguishes `ready` from `degraded` from `blocked`.

## RESEARCH COMPLETE
