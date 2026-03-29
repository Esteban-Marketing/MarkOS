---
description: Generate marketing session report with work summary and outcomes
---

# /mgsd-session-report

<purpose>
Generate a session summary with work completed, decisions made, campaigns impacted, and next steps.
</purpose>

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► SESSION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: {date}
Duration: ~{estimate}

## Work Completed
- {action_1}
- {action_2}

## Decisions Made
| Decision | Rationale |
|----------|-----------|

## Campaigns Impacted
| Campaign | Change |
|----------|--------|

## MIR Changes
| File | Update |
|------|--------|

## Next Session
1. {next_action}
2. {next_action}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
