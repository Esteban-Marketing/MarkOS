---
description: Run MIR completeness audit across all domains
---

# /markos-mir-audit

<purpose>
Audit the Marketing Intelligence Repository for gaps, stale files, and gate readiness. Produces a prioritized remediation list.
</purpose>

## Process

### 1. Run Audit

```bash
AUDIT=$(node ".agent/markos/bin/markos-tools.cjs" mir-audit --raw)
```

### 2. Display Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► MIR AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gate 1 (Identity): {status}
Gate 2 (Execution): {status}

HIGH Priority ({count}):
  ⚠️ {file} — {fill_count} [FILL] placeholders
  ...

MEDIUM Priority ({count}):
  📝 {file} — {fill_count} [FILL] placeholders
  ...

LOW Priority ({count}):
  📋 {file} — {template_count} {{TEMPLATE}} tokens
  ...

TOTAL: {total_gaps} files with gaps, {total_fills} [FILL] placeholders
```

### 3. Remediation Recommendations

Based on gap analysis, recommend:
- Which files to fill first (Gate 1 files are highest priority)
- Estimated time to complete each
- Which agents can help populate data
