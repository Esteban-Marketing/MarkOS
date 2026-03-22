---
description: Validate marketing deliverables through 7-dimension verification
---

# /mgsd-verify-work

<purpose>
Verify marketing phase work against 7 dimensions: MIR completeness, variable resolution, KPI baselines, tracking, creative compliance, budget alignment, and Linear sync.
</purpose>

## Arguments

- `{phase}` — Phase number (required)

## Process

### 1. Load Phase

```bash
PHASE=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" find-phase {phase} --raw)
```

Read phase summaries and plan files.

### 2. Display Header

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► VERIFYING — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Run 7-Dimension Checks

@-reference `.agent/marketing-get-shit-done/references/verification-patterns.md`

#### Dimension 1: MIR Completeness
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit
```

#### Dimension 2: Template Variable Resolution
Check all files modified by this phase for unresolved `{{VARIABLE}}` tokens.

#### Dimension 3: KPI Baseline Validation
Check `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` for baseline values.

#### Dimension 4: Tracking Verification
Check TRACKING.md for event definitions matching this phase's scope.

#### Dimension 5: Creative Compliance
Check any creative briefs against VOICE-TONE.md and VISUAL-GUIDELINES.md.

#### Dimension 6: Budget Alignment
Check campaign budgets against BUDGET-ALLOCATION.md.

#### Dimension 7: Linear Sync
Check if phase tasks are synced to Linear.

### 4. Generate Report

Write VERIFICATION.md using `templates/verification-report.md`.

### 5. Display Results

```
VERIFICATION RESULTS — Phase {N}
──────────────────────────────────────────────────────

| # | Dimension | Status |
|---|-----------|--------|
| 1 | MIR Completeness | ✓ |
| 2 | Variable Resolution | ✓ |
| 3 | KPI Baselines | ⚠ |
| 4 | Tracking | ✓ |
| 5 | Creative Compliance | ✓ |
| 6 | Budget Alignment | ✓ |
| 7 | Linear Sync | ✓ |

Overall: PASSED with warnings
```

### 6. Human Verification Items

If any dimension requires manual platform checks:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Manual Verification                             ║
╚══════════════════════════════════════════════════════════════╝

These items require manual verification:
1. [Check PostHog for event X firing]
2. [Verify Meta pixel on landing page Y]

→ Type "verified" when complete, or describe issues
```

### 7. Commit and Next Up

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(phase-{N}): verification report"
```

<success_criteria>
- VERIFICATION.md created with all 7 dimensions checked
- Human verification items surfaced if needed
- Overall status determined (PASSED / GAPS_FOUND / HUMAN_NEEDED)
</success_criteria>
