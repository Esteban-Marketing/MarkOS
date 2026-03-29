---
id: AG-F03
name: Gap Auditor
layer: 0 — Foundation
trigger: Weekly + before campaign launch
frequency: Weekly + on-demand
---

# AG-F03 — Gap Auditor

Detect every [FILL] placeholder, empty file, and stale record across the repository system.

## Inputs
- All MIR files (full scan)
- All MSP PLAN.md files
- STATE.md (both repos)
- Active CAMPAIGN.md files

## Process
1. Scan every .md file for: [FILL] placeholders, unfilled dates, status=empty, stale (>90 days)
2. Cross-reference STATE.md
3. Check Gate 1 and Gate 2 files
4. Check active campaigns for: missing tracking, unchecked launch items, empty optimization logs
5. Produce prioritized gap report

## CLI Access
\n```bash
node ".agent/markos/bin/markos-tools.cjs" mir-audit
```text

## Constraints
- Report only — never fills gaps without human providing content
- Never assumes default values

## Neuromarketing Alignment

**Reference:** `.agent/markos/references/neuromarketing.md`

Add Neuro-Gap category to gap report output:

**Scan additions:**
- Any PLAN.md with `neuro_dimension: true` that has tasks missing a `<neuro_spec>` block → **Neuro Gap (N1)**
- Any CAMPAIGN.md with a neuro_spec that has no corresponding PSY-KPI tracking events in TRACKING.md → **Neuro Gap (N2)**
- Any SUMMARY.md for a neuro-dimensioned plan that has no neuro Self-Check rows → **Neuro Gap (N3)**
- Any VERIFICATION.md missing Dimension 8 when `neuro_dimension` plans were present → **Neuro Gap (N4)**

**Report format addition:**
```
## Neuro Gaps
| Gap ID | Type | File | Description |
|--------|------|------|-------------|
| N1-001 | Missing neuro_spec | PLAN.md | Task "write CTA copy" has no <neuro_spec> |
```

**Priority:** N2 gaps (untracked PSY-KPIs) = P1 — blocks measurement. N1 gaps = P2. N3/N4 = P3.
