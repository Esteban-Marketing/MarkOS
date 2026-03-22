<ui_patterns>

Visual patterns for user-facing MGSD output. Orchestrators @-reference this file.

## Stage Banners

Use for major workflow transitions.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Stage names (uppercase):**
- `DISCOVERY`
- `RESEARCHING MARKET`
- `MIR GATE CHECK`
- `BRIEFING`
- `PLANNING CAMPAIGN {N}`
- `EXECUTING WAVE {N}`
- `CAMPAIGN LAUNCH ✓`
- `PERFORMANCE REVIEW`
- `VERIFYING`
- `PHASE {N} COMPLETE ✓`
- `MILESTONE COMPLETE 🎉`

---

## Checkpoint Boxes

User action required. 62-character width.

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝

{Content}

──────────────────────────────────────────────────────────────
→ {ACTION PROMPT}
──────────────────────────────────────────────────────────────
```

**Types:**
- `CHECKPOINT: Creative Approval` → `→ Approve creative or describe issues`
- `CHECKPOINT: Budget Decision` → `→ Select allocation: option-a / option-b`
- `CHECKPOINT: Platform Setup` → `→ Type "done" when platform configured`
- `CHECKPOINT: MIR Gate` → `→ Fill required MIR files before proceeding`

---

## Status Symbols

```
✓  Complete / Passed / Verified / Launched
✗  Failed / Missing / Blocked / Gate RED
◆  In Progress / Active Campaign
○  Pending / Scheduled
⚡ Auto-approved
⚠  Warning / Overpacing / Underpacing
🎉 Milestone complete (only in banner)
```

---

## Progress Display

**Phase/milestone level:**
```
Progress: ████████░░ 80%
```

**Campaign level:**
```
Campaigns: 2/4 launched
```

**MIR Gate:**
```
Gate 1 (Identity): ✓ GREEN
Gate 2 (Execution): ✗ RED — 3 files incomplete
```

---

## Spawning Indicators

```
◆ Spawning strategist...

◆ Spawning 3 agents in parallel...
  → Market research
  → Channel analysis
  → Competitive audit

✓ Strategist complete: CAMPAIGN.md drafted
```

---

## Next Up Block

Always at end of major completions.

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**{Identifier}: {Name}** — {one-line description}

`{copy-paste command}`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- `/mgsd-alternative-1` — description
- `/mgsd-alternative-2` — description

───────────────────────────────────────────────────────────────
```

---

## Error Box

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

{Error description}

**To fix:** {Resolution steps}
```

---

## Tables

```
| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1     | ✓      | 3/3   | 100%     |
| 2     | ◆      | 1/4   | 25%      |
| 3     | ○      | 0/2   | 0%       |
```

---

## Anti-Patterns

- Varying box/banner widths
- Mixing banner styles (`===`, `---`, `***`)
- Skipping `MGSD ►` prefix in banners
- Random emoji (`🚀`, `✨`, `💫`)
- Missing Next Up block after completions
- Using `GSD ►` in MGSD workflows

</ui_patterns>
