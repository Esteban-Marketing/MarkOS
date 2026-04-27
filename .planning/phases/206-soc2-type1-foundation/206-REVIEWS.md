---
phase: 206
phase_name: soc2-type1-foundation
reviewers: [codex-runtime-only]
reviewers_attempted: [gemini, claude, codex]
reviewers_skipped:
  - gemini: not installed
  - claude: not installed
  - codex: current runtime only; not independent for cross-AI review
reviewer_note: |
  Fallback single-reviewer pass created because no independent local AI CLI was available.
  This is useful planning feedback, but it is not a true cross-AI review.
reviewed_at: 2026-04-27
plans_reviewed:
  - 206-01-PLAN.md
  - 206-02-PLAN.md
  - 206-03-PLAN.md
  - 206-04-PLAN.md
  - 206-05-PLAN.md
  - 206-06-PLAN.md
  - 206-07-PLAN.md
overall_risk: HIGH
high_concerns: 2
medium_concerns: 2
low_concerns: 0
---

# Review - Phase 206

> Cross-AI workflow blocked in this environment. Only the current Codex runtime was available, so this file captures a local fallback review rather than an independent multi-model review.

## Summary

Phase 206 has the right strategic intent: SOC 2 design has to cover the real v2 risk profile, not just generic SaaS controls. The research also correctly recognizes that this phase should define control placeholders for later execution phases instead of waiting for every subsystem to ship. But the actual plan set is still in stub form, there is no executable validation contract, and the roadmap is claiming ownership of downstream requirement families that should stay with the phases that implement them. As written, this phase contains strong compliance direction, but it still cannot pass executable GSD flow and can overstate how much of the product has been "covered" by compliance planning alone.

## Strengths

- `206-RESEARCH.md` identifies the right control families for v2: access isolation, agent governance, pricing governance, connector privacy, evidence and claims, learning governance, incidents, and Tenant 0 proof.
- The phase correctly treats existing audit, billing, MCP approval, and governance evidence patterns as reuse targets instead of proposing a parallel compliance system.
- The seven-plan split is sensible at a domain level: inventory, governance, pricing, connectors, evidence automation, incident readiness, and auditor packaging.

## Concerns

### HIGH

- The plan files are still stubs and do not satisfy the current executable GSD schema. A repo-local validation pass on `206-01-PLAN.md` via `node .agent/get-shit-done/bin/gsd-tools.cjs frontmatter validate ... --schema plan` reports every required field missing (`phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`). The same stub shape repeats across `206-02` through `206-07`, so this phase cannot move through the normal plan-check or execute flow as written.

- Requirement ownership is severely overclaimed in the roadmap. Phase 206 should directly own `COMP-01` and quality enforcement, then define control placeholders for downstream product families. Instead, `ROADMAP.md` maps `RUN-01..08`, `TASK-01..05`, `PRC-01..09`, `CONN-01..06`, `EVD-01..06`, `LRN-01..05`, and `T0-01..05` into Phase 206 even though `.planning/REQUIREMENTS.md` assigns those families to Phases 205 and 207-213. If left unchanged, the compliance phase can appear to satisfy implementation families that should remain visibly owned by the phases that build them.

### MEDIUM

- The phase has no `206-VALIDATION.md`, even though research already defines the proof surface: control registry coverage, evidence-pack behavior, RLS and audit tests, approval-governance tests, and auditor-export tests. That leaves no Nyquist verification map, no sampling cadence, and no explicit runner contract for one of the highest-stakes phases in the roadmap.

- The compatibility horizon is narrower than the scope the phase claims to govern. Research says Phase 206 must define control placeholders for `207-217`, and the context expands the required shape into SaaS Suite and future post-217 growth modules. But the roadmap only says design must stay compatible with `207-213`. Without widening the compatibility or translation model, the phase can underspec control doctrine for the SaaS and growth surfaces its own scope says it should cover.

## Suggestions

- Replan Phase 206 into the executable format used by the replanned later phases:
  - add executable frontmatter
  - add `must_haves`
  - assign waves and dependencies
  - add task blocks with `read_first`, `action`, `acceptance_criteria`, `verify`, and `done`

- Restrict direct ownership to `COMP-01` and `QA-01..15`, then convert the rest to explicit control-coverage integrations or future translation gates:
  - `PRC-01..09`, `BILL-02` from P205
  - `RUN-01..08` from P207
  - `TASK-01..05` from P208
  - `EVD-01..06` from P209
  - `CONN-01..06` from P210
  - `LRN-01..05` from P212
  - `T0-01..05` from P213

- Add `206-VALIDATION.md` with a Node `--test` sampling plan and domain suites for:
  - control registry coverage
  - governance and approval enforcement
  - pricing and billing evidence
  - connector privacy and vendor controls
  - evidence automation and export safety
  - incident, BCP/DR, and auditor package verification

- Make Plan 01 own a Wave 0.5 compatibility lock that clearly separates:
  - current upstream substrate that already exists
  - downstream phases whose controls are placeholders only
  - future SaaS and growth surfaces that must inherit the same doctrine later

## Risk Assessment

**Overall risk: HIGH**

Phase 206 is the compliance phase that later orchestration, UI, evidence, connector, learning, Tenant 0, and SaaS work will lean on for enterprise credibility. If it stays stubbed and keeps claiming downstream requirement families as owned work, later planning can inherit a false sense that security, governance, and audit coverage are already executable when they are still only described at a narrative level.

## Suggested next move

`/gsd-plan-phase 206 --research`
