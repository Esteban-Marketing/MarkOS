---
phase: 97
slug: universal-template-and-business-model-coverage-upgrade
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-14
---

# Phase 97 - Validation Strategy

> Per-phase validation contract for universal template coverage, business-model mapping, stage-aware tone guidance, and deterministic fallback safety.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - direct `node --test` and repo scripts |
| **Quick run command** | `node --test test/phase-97/universal-template-family-map.test.js test/phase-97/template-metadata-completeness.test.js` |
| **Wave regression command** | `node --test test/phase-97/*.test.js test/example-resolver.test.js test/skeleton-generator.test.js` |
| **Full non-regression command** | `node --test test/skeleton-generator.test.js test/example-resolver.test.js test/phase-96/*.test.js test/phase-97/*.test.js` |
| **Estimated runtime** | quick checks <=60 seconds; full phase slice <=180 seconds |

---

## Sampling Rate

- **After every task commit:** run the task-specific verification command from the map below.
- **After every plan wave:** run `node --test test/phase-97/*.test.js test/example-resolver.test.js test/skeleton-generator.test.js`.
- **Before verification / closeout:** run the full non-regression command above and then `npm test` if the execution scope widens beyond the phase slice.
- **Max feedback latency:** 60 seconds for contract checks; 180 seconds for the full phase slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 97-01-01 | 01 | 1 | NLI-03 | T-97-01 / T-97-02 | Required model families and aliases resolve deterministically to supported universal template families | unit/contract | `node --test test/phase-97/universal-template-family-map.test.js` | ✅ yes | ✅ green |
| 97-01-02 | 01 | 1 | NLI-03, NLI-04 | T-97-02 / T-97-03 | Template contracts reject missing business-model, funnel-stage, buying-maturity, tone, proof, or naturality guidance | unit/contract | `node --test test/phase-97/template-metadata-completeness.test.js` | ✅ yes | ✅ green |
| 97-02-01 | 02 | 2 | NLI-03 | T-97-04 / T-97-05 | Shared and discipline-level template docs cover the required business-model families without bespoke sprawl | unit/content-audit | `node --test test/phase-97/template-metadata-completeness.test.js test/phase-97/stage-tone-naturality-guidance.test.js` | ✅ yes | ✅ green |
| 97-02-02 | 02 | 2 | NLI-04 | T-97-03 / T-97-05 | Template assets encode stage-aware tone, proof posture, naturality, and buying-maturity guidance in a brand-safe way | unit/content-audit | `node --test test/phase-97/stage-tone-naturality-guidance.test.js` | ✅ yes | ✅ green |
| 97-03-01 | 03 | 3 | NLI-03 | T-97-01 / T-97-06 | Resolver and skeleton fallback choose a non-empty family path before degrading to generic behavior | unit/integration | `node --test test/phase-97/resolver-fallbacks.test.js test/example-resolver.test.js test/skeleton-generator.test.js` | ✅ yes | ✅ green |
| 97-03-02 | 03 | 3 | NLI-04 | T-97-03 / T-97-06 | Newly authored template metadata survives chunking and ingest preparation without drift | unit/integration | `node --test test/phase-97/resolver-fallbacks.test.js test/phase-97/template-metadata-completeness.test.js test/skeleton-generator.test.js` | ✅ yes | ✅ green |
| 97-03-03 | 03 | 3 | NLI-03, NLI-04 | T-97-04 / T-97-06 | Full phase slice stays additive, deterministic, and non-regressive against the shipped Phase 96 baseline | regression | `node --test test/skeleton-generator.test.js test/example-resolver.test.js test/phase-96/*.test.js test/phase-97/*.test.js` | ✅ yes | ✅ green |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/phase-97/universal-template-family-map.test.js` - required family coverage, alias normalization, and deterministic fallback ordering
- [x] `test/phase-97/template-metadata-completeness.test.js` - frontmatter completeness for business model, stage, buying maturity, tone, proof, and naturality
- [x] `test/phase-97/stage-tone-naturality-guidance.test.js` - awareness through retention guidance quality and brand-safe posture checks
- [x] `test/phase-97/resolver-fallbacks.test.js` - example and skeleton resolver fallback behavior for alias and unknown model inputs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review whether the universal families feel tailored rather than generic across SaaS, services, agencies, info products, and ecommerce | NLI-03 | Requires product judgment on usefulness and specificity | Compare representative template outputs or source docs and confirm the same structure still feels materially different by business model |
| Review whether stage-aware tone and naturality guidance feels commercially natural and brand-safe | NLI-04 | Requires human judgment on voice quality and safety | Inspect awareness, consideration, decision, onboarding, and retention guidance and confirm each stage has a distinct but non-manipulative posture |
| Confirm Phase 97 stayed inside scope | NLI-03, NLI-04 | Scope discipline cannot be fully automated | Verify the work added reusable template families, business-model coverage, and deterministic fallback only; no Phase 98 reasoning or Phase 99 training alignment entered the phase |

---

## Validation Sign-Off

- [x] All plan tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across all three plans
- [x] Existing example resolver and skeleton generator baselines remain explicit non-regression gates
- [x] Phase 96 additive metadata support is preserved as a carried dependency baseline
- [x] No watch-mode or long-running commands are required
- [x] `nyquist_compliant: true` set after the Wave 0 files were created and the commands passed

**Approval:** automated execution verified on 2026-04-14; manual product judgment checks remain listed above
