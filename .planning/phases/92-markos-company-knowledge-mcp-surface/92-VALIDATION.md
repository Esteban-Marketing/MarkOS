---
phase: 92
slug: markos-company-knowledge-mcp-surface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 92 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - direct `node --test` and repo scripts |
| **Quick run command** | `node --test test/phase-92/mcp-search-fetch-contract.test.js test/phase-92/mcp-tenant-scope.test.js` |
| **Wave regression command** | `node --test test/phase-92/*.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | quick checks <=30 seconds; phase regression <=90 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific verification command from the map below.
- **After every plan wave:** Run `node --test test/phase-92/*.test.js` plus the existing retrieval and tenant-isolation regressions.
- **Before verification / closeout:** Full `npm test` must be green.
- **Max feedback latency:** 30 seconds for targeted checks; 90 seconds for the phase slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 92-01-01 | 01 | 1 | DRT-03, DRT-12 | T-92-02 / T-92-03 | Search remains snippet-first, explicit fetch returns full content only, and result metadata is citation-rich | unit/contract | `node --test test/phase-92/mcp-search-fetch-contract.test.js test/phase-92/mcp-result-metadata.test.js` | ❌ W0 | ⬜ pending |
| 92-01-02 | 01 | 1 | DRT-09, DRT-12 | T-92-01 / T-92-05 | Tenant-bound URIs and approved-only policy reject cross-tenant, raw-path, and draft requests | unit/security | `node --test test/phase-92/mcp-tenant-scope.test.js test/phase-92/mcp-uri-and-schema.test.js` | ❌ W0 | ⬜ pending |
| 92-01-03 | 01 | 1 | DRT-03, DRT-09, DRT-12 | T-92-01 / T-92-04 | Shared service stays read-only and transport-independent while preserving safe metadata | unit/integration | `node --test test/phase-92/mcp-search-fetch-contract.test.js test/phase-92/mcp-result-metadata.test.js test/phase-92/mcp-tenant-scope.test.js test/phase-92/mcp-uri-and-schema.test.js` | ❌ W0 | ⬜ pending |
| 92-02-01 | 02 | 2 | DRT-14, DRT-16 | T-92-06 / T-92-10 | Only the minimal public MCP/API/CLI surface is exposed and contract drift is blocked | unit/contract | `node --test test/phase-92/mcp-transport-adapter.test.js test/phase-92/mcp-readonly-guardrails.test.js` | ❌ W0 | ⬜ pending |
| 92-02-02 | 02 | 2 | DRT-12, DRT-16 | T-92-07 / T-92-08 | Thin transport adapter and parity wrappers reuse the same shared service with tenant-safe auth | unit/integration | `node --test test/phase-92/*.test.js` | ❌ W0 | ⬜ pending |
| 92-02-03 | 02 | 2 | DRT-09, DRT-16 | T-92-09 / T-92-10 | Operations docs and regression gates preserve auditable, read-only behavior | regression | `node --test test/phase-92/*.test.js && npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-92/mcp-search-fetch-contract.test.js` - contract tests for minimal search/fetch behavior
- [ ] `test/phase-92/mcp-result-metadata.test.js` - metadata lineage, freshness, authority, and implication checks
- [ ] `test/phase-92/mcp-tenant-scope.test.js` - cross-tenant denial and strict scope coverage
- [ ] `test/phase-92/mcp-uri-and-schema.test.js` - portable URI and schema validation coverage
- [ ] `test/phase-92/mcp-transport-adapter.test.js` - minimal public surface checks
- [ ] `test/phase-92/mcp-readonly-guardrails.test.js` - no-write and no-browse-heavy guardrail coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review the snippet-first response shape for deep-research usability | DRT-03, DRT-16 | Requires product judgment on readability across clients | Inspect sample search results and confirm they are compact, cited, and fetch-friendly |
| Review the exposed public tool set for scope discipline | DRT-12, DRT-16 | Requires human confirmation that the interface stayed minimal | Confirm the surface exposes only search/fetch and does not drift into write or catalog-heavy behavior |

---

## Validation Sign-Off

- [x] All plan tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across both plans
- [x] Wave 0 files are identified for every missing contract and guardrail test
- [x] No watch-mode flags are used
- [x] Feedback latency stays under 90 seconds for the phase slice
- [ ] `nyquist_compliant: true` will be set after Wave 0 files exist and the commands pass

**Approval:** pending execution
