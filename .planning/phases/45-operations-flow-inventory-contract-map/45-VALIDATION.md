---
phase: 45
slug: operations-flow-inventory-contract-map
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
---

# Phase 45 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — built-in Node test runner |
| **Quick run command** | `node -e "const fs=require('fs');['.planning/FLOW-INVENTORY.md','.planning/FLOW-CONTRACTS.md','contracts/schema.json'].forEach(p=>{if(!fs.existsSync(p))process.exit(1)});"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2-10 seconds (quick), ~3-8 minutes (full suite) |

---

## Sampling Rate

- **After every task commit:** Run quick smoke command (sub-30s)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds for quick checks

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 45-01-01 | 01 | 1 | API-01 | structural | `node bin/extract-flows.cjs --out contracts/flow-registry.json` | ✅ | ⬜ pending |
| 45-01-02 | 01 | 1 | API-01 | structural | `node -e "const fs=require('fs');if(!fs.existsSync('.planning/FLOW-TAXONOMY.json'))process.exit(1);"` | ✅ | ⬜ pending |
| 45-02-01 | 02 | 2 | API-01 | integration | `node -e "const fs=require('fs');const t=fs.readFileSync('.planning/FLOW-INVENTORY.md','utf8');const m=t.match(/^\| F-\d+/gm)||[];const refs=['Phase 37 RBAC and RLS Cross-Reference','config_read','status_read','migration_write'];if(m.length!==17||!refs.every(x=>t.includes(x)))process.exit(1);"` | ✅ | ⬜ pending |
| 45-02-02 | 02 | 2 | API-01 | structural | `node -e "const fs=require('fs');const t=fs.readFileSync('.planning/FLOW-INVENTORY-MOCKUP.md','utf8');const req=['Loading','Ready','Empty','Validation error','Review pending','Approved baseline'];if(!req.every(s=>t.includes(s)))process.exit(1);"` | ✅ | ⬜ pending |
| 45-03-01 | 03 | 3 | API-02 (partial) | structural | `node -e "JSON.parse(require('fs').readFileSync('contracts/schema.json','utf8'));" && node bin/validate-flow-contracts.cjs --help` | ❌ W0 | ⬜ pending |
| 45-03-02 | 03 | 3 | API-01 | integration | `node bin/validate-flow-contracts.cjs --schema contracts/schema.json --registry contracts/flow-registry.json --subset F-01,F-02,F-03,F-04,F-05,F-06,F-07,F-08` | ❌ W0 | ⬜ pending |
| 45-06-01 | 06 | 4 | API-01, API-02 (partial) | integration | `node bin/validate-flow-contracts.cjs --schema contracts/schema.json --registry contracts/flow-registry.json` | ❌ W0 | ⬜ pending |
| 45-06-02 | 06 | 4 | API-01 | structural | `node bin/validate-flow-contracts.cjs --schema contracts/schema.json --registry contracts/flow-registry.json && node -e "const fs=require('fs');const t=fs.readFileSync('.planning/FLOW-CONTRACTS.md','utf8');if(!t.includes('total_flows=17')||!t.includes('orphaned_flows=0')||!t.includes('flows_without_contracts=0'))process.exit(1);"` | ❌ W0 | ⬜ pending |
| 45-04-01 | 04 | 5 | API-01 | unit/integration | `node --test test/api-contracts/phase-45-flow-inventory.test.js` | ❌ W0 | ⬜ pending |
| 45-04-02 | 04 | 5 | API-01, API-02 (partial) | structural | `node -e "const fs=require('fs');const t=fs.readFileSync('.planning/FLOW-VERIFICATION.md','utf8');const ids=['A-01','A-12','B-01','B-10','C-01','C-02'];if(!ids.every(i=>t.includes(i)))process.exit(1);"` | ❌ W0 | ⬜ pending |
| 45-05-01 | 05 | 3 | API-01 | structural | `node -e "const fs=require('fs');const m=fs.readFileSync('.planning/T0-KPI-BASELINE.md','utf8');const k=['time_to_first_task','evidence_capture_rate','operator_self_service_rate','flow_coverage','telemetry query/export attempt'];if(!k.every(x=>m.includes(x)))process.exit(1);const j=JSON.parse(fs.readFileSync('.planning/phases/45-operations-flow-inventory-contract-map/45-KPI-CAPTURE.json','utf8'));if(!Array.isArray(j.source_events)||j.source_events.length===0||j.telemetry_query_attempted!==true||!j.telemetry_query_status)process.exit(1);"` | ❌ W0 | ⬜ pending |
| 45-05-02 | 05 | 3 | API-01 | manual+structural | `node -e "const fs=require('fs');const t=fs.readFileSync('.planning/T0-KPI-BASELINE.md','utf8');if(!t.includes('APPROVED'))process.exit(1);const j=JSON.parse(fs.readFileSync('.planning/phases/45-operations-flow-inventory-contract-map/45-KPI-CAPTURE.json','utf8'));if(j.reviewer_status!=='APPROVED'||j.telemetry_query_attempted!==true||!j.telemetry_query_status)process.exit(1);"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `contracts/` — create canonical contract directory in Plan 45-03
- [ ] `contracts/schema.json` — canonical schema in Plan 45-03
- [ ] `contracts/F-*.yaml` — per-flow contract stubs in Plan 45-03
- [ ] `test/api-contracts/` — create test folder in Plan 45-04
- [ ] `test/api-contracts/phase-45-flow-inventory.test.js` — coverage gate tests in Plan 45-04
- [ ] `bin/validate-flow-contracts.cjs` — validator CLI in Plan 45-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Semantic contract correctness for non-HTTP/internal flows | API-02 (partial) | Internal semantics use extension fields and require reviewer interpretation | Compare each flow's `x-markos-meta` against `.planning/FLOW-INVENTORY.md` and confirm handler/path/auth alignment |
| Human approval gate for verification baseline | API-01 | D-12 requires reviewer sign-off before baseline considered stable | Complete all checklist rows in `.planning/FLOW-VERIFICATION.md`, then set reviewer metadata and approval |
| T0 baseline confidence marking | API-01 | Two KPI signals may be estimate-anchored | Confirm confidence levels and data-source notes are documented before freeze |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 30s for quick checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-02
