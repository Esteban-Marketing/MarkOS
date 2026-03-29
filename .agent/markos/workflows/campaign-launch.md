---
description: Campaign launch checklist and pre-flight verification
---

# /markos-campaign-launch

<purpose>
Pre-flight verification before a campaign goes live. Validates tracking, creative, budget, and audience setup. Produces launch confirmation.
</purpose>

## Arguments

- `{campaign_id}` — Campaign ID (required)

## Process

### 1. Load Campaign

Read `CAMPAIGN.md` for the specified campaign.

### 2. Pre-Flight Checks

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► CAMPAIGN PRE-FLIGHT — {campaign_id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| # | Check | Status |
|---|-------|--------|
| 1 | Brief approved | [✓/✗] |
| 2 | Creative assets delivered | [✓/✗] |
| 3 | Copy brand-checked | [✓/✗] |
| 4 | Tracking verified | [✓/✗] |
| 5 | UTM parameters set | [✓/✗] |
| 6 | Budget confirmed | [✓/✗] |
| 7 | Landing page live | [✓/✗] |
| 8 | Linear ticket created | [✓/✗] |
| 9 | Kill conditions defined | [✓/✗] |
```

### 3. Gate Check

If any check fails → display remediation steps.
If all pass → proceed to launch confirmation.

### 4. Launch Confirmation

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Campaign Launch                                 ║
╚══════════════════════════════════════════════════════════════╝

All pre-flight checks passed.
Campaign: {campaign_id}
Budget: ${budget}/month
Platform: {platform}
Audience: {segment}

→ Type "launch" to confirm, or "hold" to delay
```

### 5. Post-Launch

On "launch":
- Update campaign status to ACTIVE
- Create optimization log entry
- Sync to Linear
- Set 48-hour first review reminder

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MARKOS ► CAMPAIGN LAUNCH ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{campaign_id} is LIVE
First performance review: {date + 48h}
```
