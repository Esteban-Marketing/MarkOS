---
phase: 90
slug: retrieval-verification-backfill-and-audit-normalization
status: in_progress
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-13
---

# Phase 90 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - CLI and package scripts |
| **Quick run command** | `node --test test/phase-86/retrieval-filter.test.js` |
| **Wave regression command** | `node --test test/phase-86/*.test.js` |
| **Full suite command** | `node --test test/**/*.test.js` |
| **Estimated runtime** | task smoke <=30 seconds; wave regression ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific automated command from the verification map, using the fastest targeted smoke check for that task
- **After every plan wave:** Run `node --test test/phase-86/*.test.js; node --test test/phase-89/*.test.js`
- **Before `/gsd-verify-work`:** Phase 86 retrieval suite plus Phase 90 closure checks must be green
- **Max feedback latency:** 30 seconds for per-task smoke checks; ~90 seconds allowed for end-of-wave regression sampling

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 90-01-01 | 01 | 1 | ROLEV-01 | T-90-01 | Retrieval modes evidence re-verified with tenant-safe behavior and mode-correct payload contracts | integration | `node --test test/phase-86/vault-retriever.test.js` | ✅ | ✅ green |
| 90-01-02 | 01 | 1 | ROLEV-02 | T-90-02 | Discipline/audience filter semantics re-verified and linked to closure evidence | unit/integration | `node --test test/phase-86/retrieval-filter.test.js test/phase-86/vault-retriever.test.js` | ✅ | ✅ green |
| 90-01-03 | 01 | 1 | ROLEV-03 | T-90-03 | Handoff payload determinism and verification context re-verified for closure normalization | unit/integration | `node --test test/phase-86/handoff-pack.test.js test/phase-86/vault-retriever.test.js` | ✅ | ✅ green |
| 90-02-01 | 02 | 2 | ROLEV-01 | T-90-05 | Requirement status promotion is blocked unless each ROLEV row has complete state plus fresh evidence-link anchors to Phase 90 artifacts | docs/audit | `node -e "const fs=require('fs'); const text=fs.readFileSync('.planning/REQUIREMENTS.md','utf8'); const patterns=[/\| ROLEV-01 \| 90 \| Complete \|.*90-VERIFICATION\.md#.*90-NORMALIZATION\.md#/m,/\| ROLEV-02 \| 90 \| Complete \|.*90-VERIFICATION\.md#.*90-NORMALIZATION\.md#/m,/\| ROLEV-03 \| 90 \| Complete \|.*90-VERIFICATION\.md#.*90-NORMALIZATION\.md#/m]; const failed=patterns.map((pattern,index)=>pattern.test(text)?null:'ROLEV-0'+(index+1)).filter(Boolean); if(failed.length){console.error('Missing evidence-linked requirements rows: '+failed.join(', ')); process.exit(1);} "` | ✅ | ⬜ pending |
| 90-02-02 | 02 | 2 | ROLEV-02 | T-90-06 | Milestone audit receives append-only corrective update with explicit references to fresh verification/normalization evidence | docs/audit | `node -e "const fs=require('fs'); const text=fs.readFileSync('.planning/v3.5.0-MILESTONE-AUDIT.md','utf8'); const checks=['Phase 90 corrective update','ROLEV-01','ROLEV-02','ROLEV-03','90-VERIFICATION','90-NORMALIZATION','status:']; const missing=checks.filter(token=>!text.includes(token)); if(missing.length){console.error('Missing milestone audit markers: '+missing.join(', ')); process.exit(1);} "` | ✅ | ⬜ pending |
| 90-02-03 | 02 | 2 | ROLEV-03 | T-90-07 | Roadmap plan inventory remains aligned with closure artifacts and phase requirements without unrelated churn | docs/audit | `node -e "const fs=require('fs'); const text=fs.readFileSync('.planning/ROADMAP.md','utf8'); const match=text.match(/### Phase 90:[\s\S]*?(?=\n### Phase \d+:|\n## Milestone|$)/); if(!match){console.error('Phase 90 roadmap block not found.'); process.exit(1);} const block=match[0]; const checks=['**Plans:** 2 plans','90-01-PLAN.md','90-02-PLAN.md','ROLEV-01','ROLEV-02','ROLEV-03']; const missing=checks.filter(token=>!block.includes(token)); if(missing.length){console.error('Missing Phase 90 roadmap markers: '+missing.join(', ')); process.exit(1);} "` | ✅ | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `.planning/phases/90-retrieval-verification-backfill-and-audit-normalization/90-VERIFICATION.md` - rerun evidence and requirement matrix captured from fresh Phase 90 execution
- [x] `.planning/phases/90-retrieval-verification-backfill-and-audit-normalization/90-NORMALIZATION.md` - append-only corrective artifact linking old and new evidence created
- [ ] REQUIREMENTS traceability update from Pending to Complete only after evidence is recorded
- [ ] Milestone audit refresh after Phase 90 evidence and normalization writes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audit artifact provenance and append-only correction integrity | ROLEV-01, ROLEV-02, ROLEV-03 | Requires artifact review across planning docs, not code-only assertion | Confirm 90-NORMALIZATION links prior conflicting artifacts and references new verification outputs without destructive rewrite |

---

## Validation Sign-Off

- [x] All Plan 01 tasks have automated verification or Wave 0 dependencies
- [x] Sampling continuity maintained for the in-scope Plan 01 work
- [x] Wave 0 evidence artifacts now cover the missing verification references for Plan 01
- [x] No watch-mode flags
- [x] Per-task feedback latency <= 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** Plan 01 evidence and normalization complete; Phase 90 remains open for Plan 02 traceability updates.



