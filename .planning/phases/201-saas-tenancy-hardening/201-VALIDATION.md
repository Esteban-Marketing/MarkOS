---
phase: 201
slug: saas-tenancy-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 201 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Fills from 201-RESEARCH.md §Validation Architecture during planner run.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (node:test — already in use across project) |
| **Config file** | none — node:test needs no config |
| **Quick run command** | `node --test test/<domain>/*.test.js` (per-plan domain) |
| **Full suite command** | `node --test test/**/*.test.js` (project-wide regression sweep) |
| **Estimated runtime** | ~5–15 seconds per domain; ~60s full sweep |

---

## Sampling Rate

- **After every task commit:** Run the plan's `<automated>` verify command (domain-scoped)
- **After every plan wave:** Run `node --test test/**/*.test.js` full regression
- **Before `/gsd:verify-work`:** Full suite green + new-surface smoke tests green
- **Max feedback latency:** ~15 seconds per task, ~60s per wave

---

## Per-Task Verification Map

*Populated by gsd-planner during PLAN.md generation. Each task in each 201-XX-PLAN.md MUST map to a verifier row here.*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| (pending planner) | — | — | API-02 / QA-01..15 | — | — | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Populated by planner. Minimum expected:*

- [ ] `test/auth/signup.test.js` — signup + magic-link + passkey stubs
- [ ] `test/tenancy/org-model.test.js` — markos_orgs schema + RLS stubs
- [ ] `test/tenancy/middleware.test.js` — subdomain resolver stubs
- [ ] `test/tenancy/byod.test.js` — CNAME + SSL + vanity-login stubs
- [ ] `test/tenancy/lifecycle.test.js` — soft-delete + GDPR export stubs
- [ ] `test/audit/hash-chain.test.js` — hash-chain verifier stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wildcard DNS propagation + Vercel Domains API end-to-end | API-02 | External DNS timing + Vercel platform integration can't run in CI | Deploy to staging, `dig` + `curl` the subdomain and a BYOD CNAME, verify auto-SSL cert issuance |
| Real magic-link email delivery + double opt-in click-through | QA-01..15 | Depends on Supabase Auth + outbound email provider | Sign up with a real mailbox, click link, confirm session lands on correct tenant |
| BotID token issuance + server verification in production | QA-01..15 | Vercel BotID requires live platform attestation | Attempt signup without BotID token, expect 403; then with valid token, expect 200 |
| GDPR export zip content correctness | QA-01..15 | Zip shape + signed URL expiry integration with S3/R2 | Trigger offboarding, download zip, verify every domain JSON present + URL expires at 7d |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
