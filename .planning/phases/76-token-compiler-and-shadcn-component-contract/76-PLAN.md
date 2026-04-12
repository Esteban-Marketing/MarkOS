---
phase: 76-token-compiler-and-shadcn-component-contract
status: ready-for-execution
plan_count: 3
execution_order:
  - 76-01-PLAN.md
  - 76-02-PLAN.md
  - 76-03-PLAN.md
requirements:
  - BRAND-DS-01
  - BRAND-DS-02
---

# Phase 76 Plan Index

This file is an index only. Executable plans are split into parser-ready files:

- 76-01-PLAN.md - Wave 1: Wave 0 schema tests plus canonical token and component-contract schema validators.
- 76-02-PLAN.md - Wave 2: Deterministic token compiler and deterministic shadcn component contract compiler implementation.
- 76-03-PLAN.md - Wave 3: Additive onboarding-handler integration, diagnostics enforcement, and validation ledger closure.

## Decision Fidelity

All executable plans honor locked decisions D-01 through D-10 from 76-CONTEXT.md.

## Scope Guardrails

- Additive integration only on existing onboarding/backend surfaces.
- No standalone public token API or new external endpoint in this phase.
- Next.js starter descriptors and role handoff packs remain deferred to Phase 77.

## Requirement Coverage

- BRAND-DS-01: Covered in 76-01-PLAN.md, 76-02-PLAN.md, and 76-03-PLAN.md.
- BRAND-DS-02: Covered in 76-01-PLAN.md, 76-02-PLAN.md, and 76-03-PLAN.md.

## Wave and Dependencies

- 76-01-PLAN.md: wave 1, depends_on []
- 76-02-PLAN.md: wave 2, depends_on ["76-01"]
- 76-03-PLAN.md: wave 3, depends_on ["76-02"]

## Execution Command

Run: /gsd:execute-phase 76-token-compiler-and-shadcn-component-contract
