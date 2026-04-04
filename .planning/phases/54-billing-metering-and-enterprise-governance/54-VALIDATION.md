---
phase: 54
slug: billing-metering-and-enterprise-governance
status: human_needed
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 54 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` |
| **Config file** | none - command-driven |
| **Quick run command** | `node --test test/agents/run-close-telemetry.test.js test/plugin-telemetry.test.js test/tenant-auth/iam-role-matrix.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the targeted `node --test` command for the affected requirement family.
- **After every plan wave:** Run the phase-specific billing/auth/governance suite for the completed wave.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 120 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 54-01 | 01 | 1 | Wave 0 / all Phase 54 families | unit + integration | `node --test test/billing/entitlement-enforcement.test.js test/billing/plugin-entitlement-runtime.test.js test/billing/usage-normalization.test.js test/billing/usage-ledger-aggregation.test.js test/billing/invoice-reconciliation.test.js test/billing/provider-sync-failure.test.js test/auth/sso-role-mapping.test.js test/auth/sso-negative-path.test.js test/governance/evidence-pack.test.js test/governance/vendor-inventory.test.js` | ✅ | ✅ green |
| 54-02 | 02 | 2 | BIL-02 | unit + integration | `node --test test/billing/usage-normalization.test.js test/billing/usage-ledger-aggregation.test.js` | ✅ | ✅ green |
| 54-03 | 03 | 3 | IAM-04 | unit + integration | `node --test test/tenant-auth/ui-authorization-negative-path.test.js test/auth/sso-role-mapping.test.js test/auth/sso-negative-path.test.js` | ✅ | ✅ green |
| 54-04 | 04 | 4 | BIL-01 | unit + integration | `node --test test/billing/entitlement-enforcement.test.js test/billing/plugin-entitlement-runtime.test.js test/plugin-control.test.js test/agents/provider-policy-runtime.test.js` | ✅ | ✅ green |
| 54-05 | 05 | 4 | BIL-03 | integration + UI contract | `node --test test/billing/invoice-reconciliation.test.js test/billing/provider-sync-failure.test.js test/ui-billing/billing-pages-contract.test.js` | ✅ | ✅ green |
| 54-06 | 06 | 5 | GOV-01 + IAM-04 governance slice | integration + UI contract | `node --test test/governance/evidence-pack.test.js test/governance/vendor-inventory.test.js test/ui-governance/governance-pages-contract.test.js` | ✅ | ✅ green |

Status legend: ✅ green · ❌ red · ⚠️ flaky

---

## Broader Regression Gate

- `node --test test/billing/*.test.js test/auth/sso-role-mapping.test.js test/auth/sso-negative-path.test.js test/governance/*.test.js test/ui-billing/billing-pages-contract.test.js test/ui-governance/governance-pages-contract.test.js test/tenant-auth/ui-authorization-negative-path.test.js test/plugin-control.test.js test/agents/provider-policy-runtime.test.js` -> 77/77 PASS
- `npm run build:llm` -> PASS

---

## Wave 0 Requirements

- [x] `test/billing/entitlement-enforcement.test.js` — covers BIL-01 runtime entitlement snapshot enforcement.
- [x] `test/billing/plugin-entitlement-runtime.test.js` — covers BIL-01 plugin/runtime gating behavior.
- [x] `test/billing/usage-normalization.test.js` — covers BIL-02 normalization and dedupe.
- [x] `test/billing/usage-ledger-aggregation.test.js` — covers BIL-02 billing-period aggregation.
- [x] `test/billing/invoice-reconciliation.test.js` — covers BIL-03 invoice evidence and reconciliation.
- [x] `test/billing/provider-sync-failure.test.js` — covers BIL-03 hold/dunning and fail-closed sync behavior.
- [x] `test/auth/sso-role-mapping.test.js` — covers IAM-04 canonical role mapping.
- [x] `test/auth/sso-negative-path.test.js` — covers IAM-04 escalation denial and audit evidence.
- [x] `test/governance/evidence-pack.test.js` — covers GOV-01 evidence bundle generation.
- [x] `test/governance/vendor-inventory.test.js` — covers GOV-01 vendor/subprocessor evidence.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tenant billing UX language and evidence readability | BIL-03 | Final wording and operator/tenant clarity still need human review beyond structural tests | Start the app, navigate tenant billing and operator billing surfaces, confirm billed units are rendered in plain billing vocabulary with ledger-backed drilldowns. |
| SSO/SAML provider setup against a real enterprise IdP | IAM-04 | Requires live provider metadata, callback URLs, and enterprise auth environment | Configure a non-production SAML IdP, complete login, verify mapped canonical role and denial behavior for an escalation claim. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency < 120s.
- [x] `nyquist_compliant: true` set in frontmatter.

Approval: automated verification complete; human_needed pending the two live checks above
