---
phase: 99
slug: agent-and-skill-training-alignment-for-tailored-generation
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-14
---

# Phase 99 — Validation Strategy

> Per-phase validation contract for shared tailoring alignment, anti-generic rewrite enforcement, and cross-surface portability.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` |
| **Config file** | none — repo uses direct CLI commands |
| **Quick run command** | `node --test test/phase-99/*.test.js` |
| **Wave regression command** | `node --test test/phase-99/*.test.js test/phase-98/*.test.js test/phase-95/cross-surface-review-envelope.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | quick checks <= 90 seconds; focused regression <= 180 seconds |

---

## Sampling Rate

- **After every task commit:** run the task-specific verification command from the map below.
- **After every plan wave:** run `node --test test/phase-99/*.test.js test/phase-98/*.test.js test/phase-95/cross-surface-review-envelope.test.js`.
- **Before verification / closeout:** run the focused regression command above and then `npm test` if the execution scope widens beyond the phase slice.
- **Max feedback latency:** 90 seconds for focused checks; 180 seconds for the carried regression slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 99-01-01 | 01 | 1 | NLI-08, NLI-10 | T-99-01 / T-99-02 | One shared tailoring envelope carries tailoring signals, reasoning winner, confidence, and review state across all surfaces | unit / contract | `node --test test/phase-99/shared-tailoring-alignment.test.js test/phase-99/cross-surface-tailoring-portability.test.js` | ✅ yes | ✅ green |
| 99-01-02 | 01 | 1 | NLI-09 | T-99-03 / T-99-04 | Generic or template-sounding samples map cleanly to rewrite-required blocking semantics | unit / review gate | `node --test test/phase-99/rewrite-required-gates.test.js` | ✅ yes | ✅ green |
| 99-02-01 | 02 | 2 | NLI-08, NLI-09 | T-99-05 / T-99-07 | Planner, checker, and reviewer surfaces reject vague or ungrounded tailoring behavior with exact blocker codes and fixes | unit / integration | `node --test test/phase-99/planner-review-enforcement.test.js` | ✅ yes | ✅ green |
| 99-03-01 | 03 | 3 | NLI-08, NLI-09, NLI-10 | T-99-09 / T-99-10 | Generator prompts and review packagers preserve identical decision semantics across API, MCP, CLI, editor, and automation | integration / portability | `node --test test/phase-99/generator-alignment-regression.test.js test/phase-99/*.test.js test/phase-98/*.test.js test/phase-95/cross-surface-review-envelope.test.js` | ✅ yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/phase-99/shared-tailoring-alignment.test.js` — shared envelope and required-field contract coverage
- [x] `test/phase-99/rewrite-required-gates.test.js` — blocking semantics for shallow or generic output
- [x] `test/phase-99/cross-surface-tailoring-portability.test.js` — one-payload portability across surfaces
- [x] `test/phase-99/fixtures/generic-vs-tailored-fixtures.cjs` — realistic fixtures for generic-vs-tailored assertions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Confirm that rewrite-required outputs feel commercially justified rather than overly strict | NLI-09 | Requires human quality judgment | Review one tailored sample and one generic sample and confirm the blocker reasons feel specific, fair, and actionable |
| Confirm cross-surface wording differs only in presentation, not in decision meaning | NLI-10 | Semantic parity needs human inspection | Compare API, MCP, CLI, editor, and automation payloads for the same review result and confirm the status and required fixes match |
| Confirm the phase stays inside the approved scope | NLI-08, NLI-09, NLI-10 | Scope discipline cannot be fully automated | Verify the work aligns instructions, skills, prompts, and review gates only; no Phase 99.1 scorecards, dashboards, or governance closeout logic appear |

---

## Validation Sign-Off

- [x] All planned tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across all three plans
- [x] Wave 0 coverage is explicitly defined for the new phase-99 tests
- [x] No watch-mode or long-running commands are required
- [x] `nyquist_compliant: true` is set in frontmatter
- [x] Execution evidence is captured in the focused Phase 99 and carried regression runs

**Approval:** focused phase regression is green; broader `npm test` still reports unrelated repository failures outside the Phase 99 slice.
