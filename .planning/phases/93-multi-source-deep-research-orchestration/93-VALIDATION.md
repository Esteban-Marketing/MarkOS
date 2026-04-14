---
phase: 93
slug: multi-source-deep-research-orchestration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 93 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - direct `node --test` and repo scripts |
| **Quick run command** | `node --test test/phase-93/routing-policy.test.js test/phase-93/context-pack-shape.test.js` |
| **Wave regression command** | `node --test test/phase-93/*.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | quick checks <=45 seconds; phase regression <=120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific verification command from the map below.
- **After every plan wave:** Run `node --test test/phase-93/*.test.js` plus the relevant retrieval and tenant-isolation regressions.
- **Before verification / closeout:** Full `npm test` must be green.
- **Max feedback latency:** 45 seconds for targeted checks; 120 seconds for the phase slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 93-01-01 | 01 | 1 | DRT-11, DRT-15, DRT-16 | T-93-01 / T-93-02 | Staged internal-first escalation and deep-path gating are locked before provider wiring | unit/contract | `node --test test/phase-93/routing-policy.test.js test/phase-93/complexity-thresholds.test.js test/phase-93/context-pack-shape.test.js test/phase-93/orchestration-pipeline.test.js` | ❌ W0 | ⬜ pending |
| 93-01-02 | 01 | 1 | DRT-11, DRT-15, DRT-16 | T-93-03 / T-93-04 | Shared orchestration contract stays portable and preview-safe with no write path | unit/contract | `node --test test/phase-93/routing-policy.test.js test/phase-93/context-pack-shape.test.js test/phase-93/orchestration-pipeline.test.js test/phase-91/provider-routing-policy.test.js` | ❌ W0 | ⬜ pending |
| 93-02-01 | 02 | 2 | DRT-03, DRT-09, DRT-11, DRT-13 | T-93-05 / T-93-06 | Provider outputs normalize cleanly and degrade safely when credentials or providers are missing | unit/contract | `node --test test/phase-93/provider-normalization.test.js test/phase-93/degraded-fallback.test.js` | ❌ W0 | ⬜ pending |
| 93-02-02 | 02 | 2 | DRT-03, DRT-11, DRT-13 | T-93-06 / T-93-07 | Internal, Tavily, Firecrawl, and OpenAI adapters stay selective and authority-aware | unit/integration | `node --test test/phase-93/provider-normalization.test.js test/phase-93/degraded-fallback.test.js test/phase-92/mcp-search-fetch-contract.test.js` | ❌ W0 | ⬜ pending |
| 93-02-03 | 02 | 2 | DRT-09, DRT-13 | T-93-05 / T-93-08 | Provider attempts record skip, degrade, and latency details without collapsing the request | unit/integration | `node --test test/phase-93/provider-normalization.test.js test/phase-93/degraded-fallback.test.js test/phase-91/provider-routing-policy.test.js` | ❌ W0 | ⬜ pending |
| 93-03-01 | 03 | 3 | DRT-02, DRT-03, DRT-08, DRT-16 | T-93-09 / T-93-10 | Merged evidence keeps lineage and produces portable context-pack output | unit/contract | `node --test test/phase-93/evidence-lineage-contract.test.js test/phase-93/cross-surface-envelope.test.js` | ❌ W0 | ⬜ pending |
| 93-03-02 | 03 | 3 | DRT-02, DRT-03, DRT-08 | T-93-09 / T-93-11 | Contradictions are explicit and review-friendly instead of silently resolved | unit/integration | `node --test test/phase-93/evidence-lineage-contract.test.js test/phase-93/cross-surface-envelope.test.js test/phase-93/provider-normalization.test.js` | ❌ W0 | ⬜ pending |
| 93-03-03 | 03 | 3 | DRT-08, DRT-09, DRT-16 | T-93-10 / T-93-12 | Final orchestrator is output-only, auditable, and resilient under degraded conditions | regression | `node --test test/phase-93/*.test.js test/llm-adapter/fallback-chain.test.js test/phase-84/retrieval-envelope.test.js test/phase-86/retrieval-filter.test.js test/phase-88/tenant-isolation-matrix.test.js && npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-93/routing-policy.test.js` - staged escalation and skip-reason coverage
- [ ] `test/phase-93/complexity-thresholds.test.js` - deep research gating and complexity scoring coverage
- [ ] `test/phase-93/context-pack-shape.test.js` - portable context-pack envelope coverage
- [ ] `test/phase-93/orchestration-pipeline.test.js` - end-to-end routing contract coverage
- [ ] `test/phase-93/provider-normalization.test.js` - provider metadata normalization coverage
- [ ] `test/phase-93/degraded-fallback.test.js` - partial outage and internal-only fallback coverage
- [ ] `test/phase-93/evidence-lineage-contract.test.js` - merge and provenance preservation coverage
- [ ] `test/phase-93/cross-surface-envelope.test.js` - MCP/API/CLI envelope parity coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review contradiction payload readability for operator review | DRT-08 | Requires human judgment on whether conflicts are clear and actionable | Inspect sample contradiction objects and confirm both the internal truth and external challenge are visible and understandable |
| Review the short summary for cross-client usefulness | DRT-16 | Requires product judgment across Copilot, CLI, and automation use cases | Inspect sample outputs and confirm the summary is concise while the structured pack remains complete |

---

## Validation Sign-Off

- [x] All plan tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across all three plans
- [x] Wave 0 files are identified for every missing orchestration, adapter, and envelope test
- [x] No watch-mode flags are used
- [x] Feedback latency stays under 120 seconds for the phase slice
- [ ] `nyquist_compliant: true` will be set after Wave 0 files exist and the commands pass

**Approval:** pending execution
