---
phase: 77-nextjs-starter-outputs-and-role-handoff-packs
status: ready-for-execution
plan_count: 3
execution_order:
  - 77-01-PLAN.md
  - 77-02-PLAN.md
  - 77-03-PLAN.md
requirements:
  - BRAND-NEXT-01
  - BRAND-ROLE-01
---

# Phase 77 Plan Index

This file is an index only. Executable plans are split into parser-ready files:

- 77-01-PLAN.md - Wave 1: Wave 0 schema tests plus canonical Next.js starter-descriptor and role-pack validators.
- 77-02-PLAN.md - Wave 2: Deterministic starter descriptor compiler and canonical-descriptor role-pack projector implementation.
- 77-03-PLAN.md - Wave 3: Additive onboarding-handler integration, deterministic persistence, diagnostics enforcement, and validation ledger closure.

## Decision Fidelity

All executable plans honor locked decisions D-01 through D-10 from 77-CONTEXT.md.

## Scope Guardrails

- Additive integration only on existing onboarding/backend submit and response surfaces.
- No standalone public API route for starter generation or role-pack generation in this phase.
- Governance publish or rollback controls remain deferred to Phase 78.

## Requirement Coverage

- BRAND-NEXT-01: Covered in 77-01-PLAN.md, 77-02-PLAN.md, and 77-03-PLAN.md.
- BRAND-ROLE-01: Covered in 77-01-PLAN.md, 77-02-PLAN.md, and 77-03-PLAN.md.

## Wave and Dependencies

- 77-01-PLAN.md: wave 1, depends_on []
- 77-02-PLAN.md: wave 2, depends_on ["77-01"]
- 77-03-PLAN.md: wave 3, depends_on ["77-02"]

## Execution Command

Run: /gsd:execute-phase 77-nextjs-starter-outputs-and-role-handoff-packs
