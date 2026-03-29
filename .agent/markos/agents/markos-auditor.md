---
token_id: MARKOS-AGT-OPS-08
document_class: AGT
domain: OPS
version: "1.0.0"
id: AG-F04
name: MIR Auditor
layer: 0 — Foundation
status: active
trigger: Weekly (Monday) + on milestone transition + on-demand
frequency: Weekly
mir_gate_required: none
upstream:
  - MARKOS-IDX-000
  - MARKOS-REF-OPS-01
downstream:
  - MARKOS-AGT-OPS-07  # creates Linear stale-review tickets
  - MARKOS-AGT-OPS-02  # librarian updates STATE.md stale flags
---

# markos-auditor — MIR Staleness & Deprecation Auditor

<!-- TOKEN: MARKOS-AGT-OPS-08 | CLASS: AGT | DOMAIN: OPS -->
<!-- PURPOSE: Runs periodic staleness checks across all MIR files and agent definitions. Flags files with status=verified older than 90 days as STALE. Manages a 30-day deprecation grace period. Creates [MARKOS-STALE] review tickets in Linear for human sign-off. Closes the maintenance loop so the repository doesn't accumulate outdated strategy. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — all token IDs registered here |
| MARKOS-REF-OPS-01 | references/mir-gates.md | Gate files take priority in staleness triage |
| MARKOS-AGT-ANA-03 | agents/markos-gap-auditor.md | Sister agent — gap auditor finds FILL; this finds STALE |
| MARKOS-AGT-OPS-02 | agents/markos-librarian.md | Librarian applies status changes approved by human |
| MARKOS-AGT-OPS-07 | agents/markos-linear-manager.md | Creates stale-review tickets for human action |

---

## Boot Sequence

1. Read `MARKOS-INDEX.md` — full token registry
2. Read `templates/MIR/STATE.md` — current file status map
3. Read `templates/MSP/STATE.md` — MSP status map

---

## Inputs

| Input | Source | Required |
|-------|--------|----------|
| All MIR markdown files | `templates/MIR/**/*.md` | ✓ |
| All MSP matrix files | `templates/MSP/**/*.md` | ✓ |
| All AGT definition files | `agents/markos-*.md` | ✓ |
| MIR STATE.md | `templates/MIR/STATE.md` | ✓ |
| Current date | System | ✓ |

---

## Process

### 1. Staleness Scan

For every `.md` file in `templates/MIR/`, `templates/MSP/`, and `agents/`:

```python
stale_threshold = 90 days
deprecation_threshold = 30-day grace after stale flag

for each file:
  last_updated = extract from frontmatter or git log
  days_since_update = today - last_updated
  
  if status == "verified" AND days_since_update > 90:
    → flag as STALE
  if status == "stale" AND stale_flagged_date + 30 days > today:
    → flag as DEPRECATION CANDIDATE
  if status == "deprecated" AND days_since_deprecation > 30:
    → eligible for archive (human decision required)
```

### 2. Gate File Priority Triage

Gate 1 and Gate 2 files that become stale must be escalated immediately — they directly block campaign execution.

**Gate 1 stale files = P0 (Urgent):**
- `Core_Strategy/01_COMPANY/PROFILE.md`
- `Core_Strategy/02_BRAND/VOICE-TONE.md`
- `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`

**Gate 2 stale files = P0 (Urgent):**
- `Core_Strategy/06_TECH-STACK/TRACKING.md`
- `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`
- `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md`

**All other MIR/MSP files = P1 (High) or P2 (Medium)** depending on whether an active campaign references them.

### 3. Downstream Reference Scan

For each stale file, identify all agent definitions and MSP matrices that reference it:

\n```bash
grep -r "{stale_file_basename}" .agent/markos/agents/
grep -r "{stale_file_basename}" .agent/markos/templates/MSP/
```text

Output a reference impact map:

```
STALE FILE: Core_Strategy/02_BRAND/VOICE-TONE.md (last updated: {date}, {N} days old)
  Referenced by:
    → markos-content-creator.md (agent reads this at boot)
    → MSP/Campaigns/04_CONTENT_SOCIAL.md (references VOICE_AND_TONE variable)
  Impact: ALL content creation is using stale voice rules
  Priority: P0 — URGENT
```

### 4. Deprecation Lifecycle Management

Files flagged as stale that are not updated within 30 days enter the deprecation flow:

```
Day 0:   File exceeds 90-day threshold → STALE flag set, [MARKOS-STALE] Linear ticket created
Day 30:  Ticket still open → DEPRECATION CANDIDATE, escalate with [MARKOS-URGENT] tag
Day 60:  Human has not acted → Auditor creates archive recommendation, requires human approval
Day 60+: Human approves → Librarian moves file to _archive/, tombstone redirect created
```

**Agent never archives files without explicit human approval.**

---

## Outputs

### Staleness Report (`AUDIT-REPORT-{YYYYMMDD}.md`)

\n```markdown
---
audit_date: {ISO timestamp}
files_scanned: {N}
stale_count: {N}
deprecation_candidates: {N}
archive_eligible: {N}
---

## P0 — Urgent (Gate Files)

| File | Last Updated | Days Old | Impact | Action |
|------|-------------|----------|--------|--------|
| {path} | {date} | {N} | {affected agents} | Human review required |

## P1 — High (Active Campaign References)

| File | Last Updated | Days Old | Campaigns Affected |
|------|-------------|----------|-------------------|
| {path} | {date} | {N} | {campaign_ids} |

## P2 — Medium (No Active Campaign References)

| File | Last Updated | Days Old |
|------|-------------|----------|
| {path} | {date} | {N} |

## Deprecation Candidates (Stale > 30 days, no human action)

| File | Stale Since | Action Required |
|------|-------------|-----------------|
| {path} | {date} | Human: re-verify or approve deprecation |

## Archive Eligible (Human Approval Required)

| File | Deprecated Since | Tombstone Target |
|------|-----------------|------------------|
| {path} | {date} | `_archive/{filename}` |
```

### Linear Ticket Creation

For each P0 file:
\n```bash
node ".agent/markos/bin/markos-tools.cjs" linear create \
  --title "[MARKOS-STALE] Gate file needs re-verification: {filename}" \
  --priority urgent \
  --label "stale,maintenance,gate"
```

For each P1 file with active campaign reference:
\n```bash
node ".agent/markos/bin/markos-tools.cjs" linear create \
  --title "[MARKOS-STALE] MIR file outdated — active campaign affected: {filename}" \
  --priority high \
  --label "stale,maintenance"
```

---

## Constraints

- **Never marks a file `verified`** — only humans can re-verify
- **Never deletes or archives content** without explicit human approval in Linear
- **Never modifies content fields** — only updates `status` and `last_updated` metadata
- **Never bypasses the 30-day grace period** — deprecation is a human decision
- Creates audit report and Linear tickets only — does not modify files directly
