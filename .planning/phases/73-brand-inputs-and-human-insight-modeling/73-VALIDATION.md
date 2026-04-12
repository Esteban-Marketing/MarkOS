---
phase: 73
slug: brand-inputs-and-human-insight-modeling
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
completed: 2026-04-11T15:45:00Z
---

# Phase 73 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test |
| **Config file** | package.json |
| **Quick run command** | `node --test test/**/*.test.js --test-name-pattern="(onboarding|vault|import|runtime)"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/**/*.test.js --test-name-pattern="(onboarding|vault|import|runtime)"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 73-01-01 | 01 | 1 | BRAND-INP-01 | T-73-01 | Reject invalid input schema and enforce required rationale fields | unit | `node --test test/**/*.test.js --test-name-pattern="onboarding|schema"` | ✅ W0 | ✅ green |
| 73-01-02 | 01 | 1 | BRAND-INP-01 | T-73-02 | Enforce bounded arrays and segment-count limits (2-5) | unit | `node --test test/**/*.test.js --test-name-pattern="onboarding|schema"` | ✅ W0 | ✅ green |
| 73-02-01 | 02 | 2 | BRAND-INP-02 | T-73-03 | Deterministic canonicalization and stable fingerprinting for identical inputs | unit | `node --test test/**/*.test.js --test-name-pattern="normalize|fingerprint|deterministic"` | ✅ W0 | ✅ green |
| 73-02-02 | 02 | 2 | BRAND-INP-02 | T-73-04 | Tenant-scoped idempotent upsert prevents cross-tenant collisions | integration | `node --test test/**/*.test.js --test-name-pattern="tenant|idempotent|graph"` | ✅ W0 | ✅ green |
| 73-03-01 | 03 | 3 | BRAND-INP-02 | T-73-05 | Raw-plus-canonical hybrid node persistence retains lineage without leaking secrets | integration | `node --test test/**/*.test.js --test-name-pattern="lineage|redaction|retention"` | ✅ W0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/phase-73/brand-input-schema.test.js` — strict typed schema, bounded arrays, rationale validation
- [x] `test/phase-73/brand-normalization-determinism.test.js` — canonicalization and stable hash determinism
- [x] `test/phase-73/brand-evidence-tenant-safety.test.js` — tenant isolation and idempotent upsert behavior
- [x] `test/phase-73/brand-retention-redaction.test.js` — minimal retention and secret redaction boundaries

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator review of validation error clarity in onboarding UX | BRAND-INP-01 | Error semantics and copy quality are UX-judgment dependent | Run onboarding flow with invalid segment/rationale payloads, verify remediation guidance is actionable and non-ambiguous. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ APPROVED — 2026-04-11T15:45:00Z

### Verification Notes (73-03 Closure)

**D-07 & D-08 Enforcement:** Retention/redaction policy boundaries implemented and verified:
- Minimal-text retention with metadata-first evidence trails via canonical node structure
- Secret redaction patterns enforce masking of API keys, tokens, secrets, emails, phones, SSNs, credit cards
- Lineage tracking preserves tenant scope without bulk raw-text retention
- Redacted content provides audit trail without exposing PII or secrets
- Integration with onboarding handlers and runtime-context confirmed

**Scope Guardrails Confirmed:**
- D-05 intake boundary maintained: no standalone brand-input API surface, all extension via onboarding/handlers
- No segment-cap regression: D-01 bounds (2-5 segments) enforced in validation
- No API surface changes beyond Phase 73 contract

**Phase-73 Core Assertions:** 41/41 tests passing (determinism + tenant-safety + schema + retention)
- Deterministic normalization and fingerprinting verified (D-06)
- Tenant-scoped idempotent graph writes with no cross-tenant collisions verified (D-05, D-06)
- Hybrid normalization with canonical + redacted forms (D-04)
- Metadata-first evidence trails with minimal raw storage (D-07, D-08)
