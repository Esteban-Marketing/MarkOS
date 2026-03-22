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
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit
```

## Constraints
- Report only — never fills gaps without human providing content
- Never assumes default values
