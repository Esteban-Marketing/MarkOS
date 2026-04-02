---
phase: 35
phase_name: Smart One-Command Deployment
milestone: v2.5
milestone_name: Enhancement & Optimization Process
plan_created: "2026-04-01"
type: execute
wave: 1
depends_on:
  - 34-client-intake-sop-automation
files_modified:
  - bin/install.cjs
  - bin/update.cjs
  - bin/ensure-vector.cjs
  - onboarding/backend/server.cjs
  - README.md
  - TECH-MAP.md
  - test/install.test.js
  - test/update.test.js
  - test/onboarding-server.test.js
autonomous: true
requirements:
  - DX-01
  - DX-02
  - DX-03
  - OPS-READY-01
  - CI-01
user_setup: []

must_haves:
  truths:
    - "`npx markos` is the primary installer path and works as the happy path without mandatory prompts in a typical local setup."
    - "Installer behavior is deterministic across interactive, non-interactive, and update-handoff modes."
    - "Rerunning install converges cleanly without duplicate managed artifacts or manifest drift."
    - "Readiness is explicit: install ends in `ready`, `degraded`, or `blocked` with actionable next steps."
    - "Docs, runtime behavior, and tests agree on the primary command and supported flags."

  artifacts:
    - path: bin/install.cjs
      provides: "Hybrid smart installer with preflight, default inference, fallback prompting, and structured completion summary"
      behaviors:
        - "bare `npx markos` runs the primary install flow"
        - "existing installs hand off reliably to update or an explicit reinstall path"
        - "interactive prompts appear only when required values cannot be inferred safely"
    - path: bin/update.cjs
      provides: "Update flow aligned with shared preflight and environment classification rules"
      behaviors:
        - "uses the same runtime guards and mode detection as install"
        - "preserves existing conflict and override protections"
    - path: bin/ensure-vector.cjs
      provides: "Readiness report detailed enough for install summary and onboarding launch gating"
      fields:
        - status
        - providers
        - message
        - actionable_next_step
    - path: onboarding/backend/server.cjs
      provides: "Operational boot surface verified by installer handoff"
      endpoints:
        - GET /config
        - GET /status
    - path: README.md
      provides: "Primary command and fallback behavior documentation aligned to runtime"
      must_show:
        - "`npx markos` as the main install command"
        - "when to use `npx markos update`"
        - "what happens in degraded or blocked readiness modes"
    - path: test/install.test.js
      provides: "Installer coverage for hybrid defaults, prompt fallbacks, non-interactive handling, and rerun idempotency"
    - path: test/update.test.js
      provides: "Regression checks proving update remains compatible with new shared flow rules"
    - path: test/onboarding-server.test.js
      provides: "Smoke-level verification of onboarding boot and status/config contract"

  key_links:
    - from: bin/install.cjs
      to: bin/update.cjs
      via: "explicit update handoff when install detects an existing MarkOS install or user requests update"
      pattern: "shared preflight -> branch to install or update"
    - from: bin/install.cjs
      to: bin/ensure-vector.cjs
      via: "readiness evaluation before onboarding launch"
      pattern: "preflight -> readiness report -> launch gate"
    - from: bin/install.cjs
      to: onboarding/backend/server.cjs
      via: "local onboarding handoff only when readiness and mode allow it"
      pattern: "ready interactive mode -> boot server"
    - from: README.md
      to: test/install.test.js
      via: "docs/runtime parity"
      pattern: "documented primary command and flags must match tested behavior"
---

# Phase 35: Smart One-Command Deployment

## Objective

Turn MarkOS into a genuinely smart one-command local deployment flow so a typical operator can run `npx markos`, accept safe defaults, and reach a working onboarding environment without unnecessary prompts or manual cleanup.

## Purpose

The product promise is already one-command deployment, but the current installer is still prompt-first and only partially mode-aware. Phase 35 closes that gap by upgrading installer orchestration quality rather than adding new product surface area.

## Output

- Hybrid install contract for interactive and non-interactive execution
- Shared preflight and readiness rules across install/update flows
- Explicit readiness summary (`ready`, `degraded`, `blocked`) with next steps
- Docs parity update for `npx markos` as the primary command
- Test coverage for defaults, fallback prompts, reruns, and onboarding boot

## Duration

Target: 1 focused execution wave

---

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/milestones/v2.5-REQUIREMENTS.md
@.planning/phases/35-smart-one-command-deployment/35-RESEARCH.md
@bin/install.cjs
@bin/update.cjs
@bin/ensure-vector.cjs
@onboarding/backend/server.cjs
@README.md
@TECH-MAP.md
@test/install.test.js
@test/update.test.js
@test/onboarding-server.test.js

## Current Constraints

- `bin/install.cjs` already supports bare `npx markos`, but still forces a prompt sequence for the common path.
- `bin/update.cjs` has good manifest/conflict behavior, but does not share a central environment contract with install.
- `bin/ensure-vector.cjs` returns provider status, but installer logic does not yet use it to classify final state.
- `onboarding/backend/server.cjs` is the operational handoff, but installer success is not validated against a post-install boot contract.
- README still prioritizes `npx markos install`, which mismatches runtime reality.

## Planning Guardrails

- Keep scope focused on installer quality and operational readiness. Do not add unrelated onboarding features.
- Do not attempt full third-party infrastructure provisioning inside this phase.
- Preserve existing update conflict protections and `.markos-local/` safety guarantees.
- Never log or echo secret values while improving env/config automation.

</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Define the hybrid install contract and shared preflight rules</name>
  <read_first>
    - bin/install.cjs
    - bin/update.cjs
    - .planning/phases/35-smart-one-command-deployment/35-RESEARCH.md
    - README.md
  </read_first>
  <files>bin/install.cjs, bin/update.cjs, README.md</files>
  <action>Create a shared runtime classification path used by both install and update. It must detect Node compatibility, interactivity, CI/headless mode, existing install state, existing GSD state, and whether onboarding should default on or off. Bare `npx markos` must remain the primary entrypoint. Add explicit flag handling for the minimum approved contract: `--yes`, `--project-name`, `--no-onboarding`, plus one explicit scope override (`--project` or `--global`).</action>
  <acceptance_criteria>
    - Install and update use the same environment classification rules.
    - The common local path can proceed without mandatory prompts when safe defaults exist.
    - CI/headless mode never hangs waiting for interactive input.
    - README names the same primary command and core flags that runtime supports.
  </acceptance_criteria>
  <done>The CLI contract is explicit enough to implement and test without ambiguous operator branches.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement smart defaults and managed artifact hydration</name>
  <read_first>
    - bin/install.cjs
    - test/install.test.js
  </read_first>
  <files>bin/install.cjs, test/install.test.js</files>
  <action>Refactor install flow into clear stages: preflight, default inference, artifact hydration, install/write actions, and completion summary. Safely infer project-local install, project name from cwd when not supplied, and onboarding launch default based on mode. Ensure managed artifacts converge on rerun: `.markos-install-manifest.json`, `.gitignore` protections, and `.markos-project.json` if installer owns that artifact. Prompt only when a required value cannot be inferred safely.</action>
  <acceptance_criteria>
    - Re-running install does not duplicate `.gitignore` blocks or break manifest state.
    - Project name can be inferred or overridden explicitly.
    - Prompt count drops for the happy path while preserving safety on ambiguous inputs.
    - `test/install.test.js` covers default inference, forced overrides, and rerun idempotency.
  </acceptance_criteria>
  <done>Installer writes and re-writes managed files predictably instead of behaving like a one-shot wizard.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add readiness classification and onboarding handoff validation</name>
  <read_first>
    - bin/ensure-vector.cjs
    - onboarding/backend/server.cjs
    - test/onboarding-server.test.js
  </read_first>
  <files>bin/ensure-vector.cjs, bin/install.cjs, onboarding/backend/server.cjs, test/onboarding-server.test.js</files>
  <action>Expand readiness reporting so install can distinguish `ready`, `degraded`, and `blocked` outcomes with one actionable next step per failure mode. Use the report to gate onboarding launch. Validate that local onboarding startup remains compatible with the server contract (`/config`, `/status`) and that blocked/degraded states report the next operator action without falsely claiming success.</action>
  <verify>
    <automated>node --test test/onboarding-server.test.js</automated>
  </verify>
  <acceptance_criteria>
    - Vector and env checks feed a single operator-facing readiness summary.
    - Interactive local runs can launch onboarding only when readiness allows it.
    - Non-interactive or blocked runs exit clearly without boot-side ambiguity.
    - Onboarding tests still validate the server contract after installer changes.
  </acceptance_criteria>
  <done>Install completion status now reflects actual operational readiness instead of just file copy completion.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Lock docs and regression tests to the new install behavior</name>
  <read_first>
    - README.md
    - TECH-MAP.md
    - test/install.test.js
    - test/update.test.js
  </read_first>
  <files>README.md, TECH-MAP.md, test/install.test.js, test/update.test.js</files>
  <action>Align the docs with the implemented CLI contract so `npx markos` is the documented happy path, `npx markos update` remains the update path, and degraded/blocked behaviors are described honestly. Extend test coverage so future regressions catch prompt hangs, docs/runtime drift, and update/install contract divergence.</action>
  <verify>
    <automated>node --test test/install.test.js</automated>
    <automated>node --test test/update.test.js</automated>
  </verify>
  <acceptance_criteria>
    - README and TECH-MAP describe the same primary command semantics the tests assert.
    - Install and update suites remain green after contract changes.
    - The repo has one obvious, durable explanation of how MarkOS is installed and updated.
  </acceptance_criteria>
  <done>Product promise, CLI behavior, and regression coverage are synchronized.</done>
</task>

</tasks>

<verification>
Run `node --test test/install.test.js`, `node --test test/update.test.js`, and the relevant onboarding boot/status coverage in `test/onboarding-server.test.js`. If the CLI contract changes materially, run `npm test` before phase completion.
</verification>

<success_criteria>
- Bare `npx markos` is the working happy path for a typical local setup.
- Install behavior is deterministic for interactive, non-interactive, and update-handoff flows.
- Readiness state is explicit and actionable.
- Reruns are idempotent for installer-owned artifacts.
- Docs and tests enforce the same contract the runtime implements.
</success_criteria>

<output>
After completion, create `.planning/phases/35-smart-one-command-deployment/35-01-SUMMARY.md`.
</output>

