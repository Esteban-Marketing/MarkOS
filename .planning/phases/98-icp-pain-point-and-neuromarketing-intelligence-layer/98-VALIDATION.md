---
phase: 98
slug: icp-pain-point-and-neuromarketing-intelligence-layer
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-14
---

# Phase 98 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` |
| **Config file** | none — repo uses direct CLI commands |
| **Quick run command** | `node --test test/phase-98/*.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30-90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/phase-98/*.test.js`
- **After every plan wave:** Run `node --test test/phase-98/*.test.js test/phase-96/*.test.js test/example-resolver.test.js test/discipline-router.test.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 98-01-01 | 01 | 1 | NLI-05 | T-98-01 / T-98-02 | ICP inputs map deterministically to motivations, fears, trust, objections, and trigger candidates | unit | `node --test test/phase-98/icp-reasoning-ranking.test.js` | ❌ W0 | ⬜ pending |
| 98-01-02 | 01 | 1 | NLI-07 | T-98-02 / T-98-03 | Only governed B01-B10 signals and approved archetype mappings are accepted | unit / governance | `node --test test/phase-98/icp-governance-guardrails.test.js` | ❌ W0 | ⬜ pending |
| 98-02-01 | 02 | 2 | NLI-06 | T-98-03 / T-98-04 | Recommendation contract returns shortlist, winner, rationale, and confidence flag without opaque output | unit / contract | `node --test test/phase-98/icp-recommendation-contract.test.js` | ❌ W0 | ⬜ pending |
| 98-02-02 | 02 | 2 | NLI-05, NLI-06 | T-98-04 / T-98-05 | Same input yields portable, stable JSON output shape across surfaces | contract | `node --test test/phase-98/icp-portable-contract.test.js` | ⬜ Plan 02 | ⬜ pending |
| 98-03-01 | 03 | 3 | NLI-05, NLI-06, NLI-07 | T-98-05 / T-98-06 | Resolver/retrieval seam consumes the winner safely while existing Phase 96/97 behavior stays non-regressive | integration / regression | `node --test test/phase-98/*.test.js test/phase-96/*.test.js test/example-resolver.test.js test/discipline-router.test.js` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-98/icp-reasoning-ranking.test.js` — ranking and tie-break scaffolding for NLI-05
- [ ] `test/phase-98/icp-governance-guardrails.test.js` — governed-trigger and ethics guardrails for NLI-07
- [ ] `test/phase-98/icp-recommendation-contract.test.js` — shortlist/winner/confidence packaging for NLI-06

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review whether the recommended primary winner and runner-up reasons feel strategically sensible for a representative ICP | NLI-06 | Human product judgment is needed to assess commercial usefulness and clarity | Inspect one or two representative ranking outputs and confirm the explanation feels useful, non-generic, and not black-box |
| Confirm the phase stays inside the approved boundary | NLI-05, NLI-06, NLI-07 | Scope discipline cannot be fully automated | Verify the work adds reasoning and explanation logic only; no Phase 99 prompt rewiring or Phase 99.1 evaluation system is pulled forward |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
