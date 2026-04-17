---
phase: 200-saas-readiness-wave-0
plan: "02"
subsystem: cli-generate
tags: [cli, generate, brief, llm, audit]
dependency_graph:
  requires: [200-01]
  provides:
    - bin/generate.cjs
    - bin/lib/brief-parser.cjs
    - bin/lib/generate-runner.cjs
  affects: []
tech_stack:
  added: []
  patterns: [pluggable-llm-stub, yaml-subset-parser, dispatch-via-command-alias]
key_files:
  created:
    - bin/generate.cjs
    - bin/lib/brief-parser.cjs
    - bin/lib/generate-runner.cjs
    - test/cli-generate.test.js
  modified:
    - bin/install.cjs
    - bin/cli-runtime.cjs
decisions:
  - "Deferred wiring to lib/markos/crm/copilot.ts#buildCopilotGroundingBundle: that needs a crmStore + tenant_id that a standalone CLI brief doesn't have. Kept CLI freestanding with a pluggable llm function; copilot grounding belongs in the full workspace runtime."
  - "No new dep (minimist/yargs) — reused existing hand-rolled flag parser pattern."
  - "Stub LLM default keeps smoke tests deterministic without API keys. Real adapter (lib/markos/llm/adapter.ts#call) wires via options.llm at call sites."
  - "Audit tiered: error-severity issues flip status=fail and force exit 1; warn/info leave status=pass."
metrics:
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 2
  tests_passing: 14
---

# Phase 200 Plan 02: CLI `markos generate` Summary

Shipped `npx markos generate` one-shot drafting CLI. Accepts a YAML/JSON brief file
or inline `--channel= --audience= --pain= --promise= --brand=` flags; produces a
single draft + audit report to stdout as JSON. Non-zero exit on invalid brief or
audit fail so it composes cleanly in CI.

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Brief parser (YAML + JSON + validation) | ✓ |
| 2 | CLI entry + runner + dispatch wiring | ✓ |
| 3 | Test suite (unit + CLI smoke) | ✓ 14/14 |

## Verification

- `node --test test/cli-generate.test.js` → 14/14 pass (parse, validate, audit, run, 3 CLI smoke tests)
- `node bin/generate.cjs <brief.yaml>` returns success JSON + exit 0
- Invalid brief exits 1 with `INVALID_BRIEF`

## Commits

- `feat(200-02): add markos generate CLI one-shot mode (14 tests pass)`

## Follow-up (200-02.1)

- Swap stub LLM for `lib/markos/llm/adapter.ts#call` once runtime has provider keys
- Integrate copilot grounding bundle when CLI has access to a crmStore context
- Voice-classifier integration for richer audit (currently audit only checks length, promise presence, brand mention)

## Self-Check: PASSED (14/14 tests, dispatch wired, 1 atomic commit)
