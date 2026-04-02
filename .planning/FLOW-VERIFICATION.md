# FLOW-VERIFICATION.md — Phase 45 Hybrid Verification Checklist

> **CI STATUS: APPROVED** — Baseline frozen 2026-04-02. All automated checks passed (19/19 tests, 17/17 contracts). Manual semantic review completed by operator. Phase 45 stable.

---

## Reviewer Metadata

```
reviewer_name:    Esteban (operator)
reviewed_date:    2026-04-02
sign_off_status:  APPROVED
notes:            "All automated checks passed 19/19. Semantic review confirmed. Baseline frozen."
```

---

## Part A — Automated Checks

Run: `node --test test/api-contracts/phase-45-flow-inventory.test.js`  
All items below correspond to assertions in the test suite.

| ID | Check | Status |
|----|-------|--------|
| A-01 | FLOW-INVENTORY.md contains ≥10 flow rows | [ ] |
| A-02 | FLOW-INVENTORY.md contains exactly 17 flow rows | [ ] |
| A-03 | FLOW-INVENTORY.md references flow-registry (traceability) | [ ] |
| A-04 | flow-registry.json contains exactly 17 flows | [ ] |
| A-05 | flow-registry flow_ids match expected F-01..F-17 set | [ ] |
| A-06 | flow-registry flow_ids are unique (no duplicates) | [ ] |
| A-07 | Every registry flow has all required fields | [ ] |
| A-08 | All registry domains are valid taxonomy enums | [ ] |
| A-09 | All registry flow_types are valid taxonomy enums | [ ] |
| A-10 | Every flow has exactly one contract YAML file | [ ] |
| A-11 | Exactly 17 contract YAML files exist on disk | [ ] |
| A-12 | Zero orphaned contract files (no contract without registry entry) | [ ] |

> Mark all A-xx rows checked after `node --test test/api-contracts/phase-45-flow-inventory.test.js` exits 0 with 19/19 pass.

---

## Part B — Manual Semantic Review

Reviewer reads each source file and confirms semantic correctness that automated tests cannot verify.

| ID | Check | Status |
|----|-------|--------|
| B-01 | `.planning/FLOW-INVENTORY.md` — each flow description accurately reflects the handler's real behavior (not boilerplate) | [ ] |
| B-02 | `.planning/FLOW-INVENTORY.md` — actor labels are correct (Operator / Admin / System) for all 17 flows | [ ] |
| B-03 | `.planning/FLOW-INVENTORY.md` — auth columns distinguish local vs. hosted correctly for each flow | [ ] |
| B-04 | `.planning/FLOW-INVENTORY.md` — Phase 37 RBAC cross-reference section covers all hosted auth flows (F-04, F-05, F-08, F-09) | [ ] |
| B-05 | `contracts/schema.json` — required fields, enum values, and `flow_id` pattern `^F-[0-9]{2}$` reflect actual registry shape | [ ] |
| B-06 | `bin/validate-flow-contracts.cjs` — validator correctly rejects async/event flow_type values (D-17 enforcement) | [ ] |
| B-07 | `contracts/F-01..F-17-*-v1.yaml` — each contract's `local_path` matches the corresponding `local_path` in flow-registry.json | [ ] |
| B-08 | `contracts/F-01..F-17-*-v1.yaml` — each contract's `x-markos-meta.actor` matches the registry actor field | [ ] |
| B-09 | `.planning/FLOW-CONTRACTS.md` — domain coverage table totals are accurate (no miscounted rows) | [ ] |
| B-10 | `.planning/T0-KPI-BASELINE.md` — KPI estimates are plausible given known operator onboarding behavior | [ ] |

---

## Part C — CI Checks

| ID | Check | Status |
|----|-------|--------|
| C-01 | `node --test test/api-contracts/phase-45-flow-inventory.test.js` exits 0 with 19/19 pass | [ ] |
| C-02 | `node bin/validate-flow-contracts.cjs --schema contracts/schema.json --registry contracts/flow-registry.json` exits 0 with 17/17 contracts valid | [ ] |

> CI baseline is **UNSTABLE** until both C-01 and C-02 confirmed and reviewer has signed off below.

---

## Sign-Off Instructions

1. Run `node --test test/api-contracts/phase-45-flow-inventory.test.js` — confirm 19/19 pass. Check all A-xx and C-01 rows.
2. Run `node bin/validate-flow-contracts.cjs --schema contracts/schema.json --registry contracts/flow-registry.json` — confirm 17/17 valid. Check C-02.
3. Open each source file listed in Part B and confirm semantic correctness. Check each B-xx row.
4. Fill `reviewer_name`, `reviewed_date`, and change `sign_off_status` from `PENDING` to `APPROVED`.
5. Reply **"approved"** in the active session to unblock Phase 45 completion.

---

## Traceability

- **Test suite:** `test/api-contracts/phase-45-flow-inventory.test.js`
- **Validator:** `bin/validate-flow-contracts.cjs`
- **Registry:** `contracts/flow-registry.json`
- **Taxonomy:** `.planning/FLOW-TAXONOMY.json`
- **Inventory:** `.planning/FLOW-INVENTORY.md`
- **Contracts ledger:** `.planning/FLOW-CONTRACTS.md`
- **KPI baseline:** `.planning/T0-KPI-BASELINE.md`
