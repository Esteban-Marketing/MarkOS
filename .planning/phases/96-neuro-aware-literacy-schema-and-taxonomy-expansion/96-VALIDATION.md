---
phase: 96
slug: neuro-aware-literacy-schema-and-taxonomy-expansion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 96 - Validation Strategy

> Per-phase validation contract for execution feedback sampling and non-regression control.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - direct `node --test` and repo scripts |
| **Quick run command** | `node --test test/phase-96/neuro-literacy-taxonomy.test.js test/phase-96/neuro-overlay-merge.test.js` |
| **Wave regression command** | `node --test test/phase-96/*.test.js` |
| **Full non-regression command** | `node --test test/phase-91/filter-taxonomy-v1.test.js test/phase-91/deep-research-envelope.test.js test/phase-93/context-pack-shape.test.js test/phase-95/evaluation-contract.test.js test/phase-95/personalization-lift-matrix.test.js test/vector-store-client.test.js test/phase-96/*.test.js` |
| **Estimated runtime** | quick checks <=45 seconds; phase slice <=180 seconds |

---

## Sampling Rate

- **After every task commit:** run the task-specific verification command from the map below.
- **After every plan wave:** run `node --test test/phase-96/*.test.js` plus the carried non-regression suite from Phases 91, 93, and 95.
- **Before verification / closeout:** run the full non-regression command above and then `npm test` if the execution scope widened beyond the phase slice.
- **Max feedback latency:** 45 seconds for contract checks; 180 seconds for the full phase slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 96-01-01 | 01 | 1 | NLI-01 | T-96-01 / T-96-02 | Canonical schema expresses pains, outcomes, objections, trust, emotional-state shifts, funnel nuance, and naturality using governed optional fields | unit/contract | `node --test test/phase-96/neuro-literacy-taxonomy.test.js test/phase-96/neuro-guardrails.test.js` | ❌ W0 | ⬜ pending |
| 96-01-02 | 01 | 1 | NLI-01, NLI-02 | T-96-03 / T-96-04 | Company baseline plus ICP and stage overlays merge deterministically and stay additive to the v3.6.0 baseline | unit/contract | `node --test test/phase-96/neuro-overlay-merge.test.js test/phase-96/neuro-literacy-taxonomy.test.js` | ❌ W0 | ⬜ pending |
| 96-02-01 | 02 | 2 | NLI-01 | T-96-05 / T-96-07 | Storage migration is non-destructive and legacy literacy docs remain valid without mandatory backfill | unit/integration | `node --test test/phase-96/literacy-ingest-compat.test.js` | ❌ W0 | ⬜ pending |
| 96-02-02 | 02 | 2 | NLI-01, NLI-02 | T-96-05 / T-96-06 | Relational and vector metadata round-trip the new optional tags and overlay blocks without drift | unit/integration | `node --test test/phase-96/vector-metadata-roundtrip.test.js test/vector-store-client.test.js` | ❌ W0 | ⬜ pending |
| 96-02-03 | 02 | 2 | NLI-01 | T-96-06 / T-96-07 | Ingest, chunking, and audience validation normalize new fields but keep existing required fields unchanged | unit/integration | `node --test test/phase-96/literacy-ingest-compat.test.js test/phase-96/neuro-literacy-taxonomy.test.js` | ❌ W0 | ⬜ pending |
| 96-03-01 | 03 | 3 | NLI-02 | T-96-08 / T-96-09 | Optional extension filters remain backward-compatible and preview-safe across retrieval contracts | contract/regression | `node --test test/phase-96/retrieval-filter-extensions.test.js test/phase-91/filter-taxonomy-v1.test.js test/phase-91/deep-research-envelope.test.js` | ❌ W0 | ⬜ pending |
| 96-03-02 | 03 | 3 | NLI-02 | T-96-08 / T-96-10 | The same company can yield meaningfully different context for different ICP overlays while approved-only retrieval stays intact | integration | `node --test test/phase-96/company-icp-differentiation.test.js test/phase-96/preview-safe-neuro-context.test.js test/phase-93/context-pack-shape.test.js` | ❌ W0 | ⬜ pending |
| 96-03-03 | 03 | 3 | NLI-01, NLI-02 | T-96-09 / T-96-10 | Full phase slice remains additive, portable, and non-regressive against v3.6.0 baselines | regression | `node --test test/phase-91/filter-taxonomy-v1.test.js test/phase-91/deep-research-envelope.test.js test/phase-93/context-pack-shape.test.js test/phase-95/evaluation-contract.test.js test/phase-95/personalization-lift-matrix.test.js test/vector-store-client.test.js test/phase-96/*.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-96/neuro-literacy-taxonomy.test.js` - allowed taxonomy values, normalization, and required vs optional field coverage
- [ ] `test/phase-96/neuro-overlay-merge.test.js` - company baseline + ICP overlay + funnel-stage precedence and deterministic merge coverage
- [ ] `test/phase-96/neuro-guardrails.test.js` - B01-B10 allow-list, ethical guardrails, and downgrade behavior for unsupported neuro tags
- [ ] `test/phase-96/literacy-ingest-compat.test.js` - legacy markdown ingest and optional-field compatibility coverage
- [ ] `test/phase-96/vector-metadata-roundtrip.test.js` - relational/vector parity for additive metadata blocks
- [ ] `test/phase-96/retrieval-filter-extensions.test.js` - filter extensions and backward-compatible retrieval envelope coverage
- [ ] `test/phase-96/company-icp-differentiation.test.js` - same-company / different-ICP differentiation coverage
- [ ] `test/phase-96/preview-safe-neuro-context.test.js` - preview-safe context-pack and deep-research portability coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review whether the taxonomy names feel commercially useful but not manipulative | NLI-01 | Requires human judgment about clarity, ethics, and brand safety | Inspect representative schema fixtures and confirm pains, objections, trust, and neuro hints are explicit, readable, and evidence-aware |
| Review whether company-level and ICP-level overlays feel meaningfully different without over-segmenting | NLI-02 | Requires product judgment about usefulness and granularity | Compare one company baseline with at least two ICP overlays and confirm the merged retrieval payload changes in a way that feels purposeful and natural |
| Review whether the phase stays inside its boundary | NLI-01, NLI-02 | Scope discipline cannot be fully automated | Confirm no universal template expansion, ICP reasoning engine, agent rewiring, or quality-governance closeout work was pulled in from Phases 97-99.1 |

---

## Validation Sign-Off

- [x] All plan tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across all three plans
- [x] Existing Phase 91, 93, and 95 baselines are preserved as non-regression gates
- [x] No watch-mode or long-running commands are required
- [x] Feedback latency stays under 180 seconds for the phase slice
- [ ] `nyquist_compliant: true` will be set after the Wave 0 files exist and the commands pass

**Approval:** pending execution
