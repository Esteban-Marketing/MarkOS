# MGSD Agent Quickstart (AGENT-BOOT)

> [!IMPORTANT]
> This is the mandatory first-read for all MGSD sessions. If your context is low or you are in a NEW session, read this file immediately.

## 1. Context Recursive Search Map
If you are lost or memory is sparse, follow this search priority:
1. `.protocol-lore/QUICKSTART.md` (This file - Entry point)
2. `.protocol-lore/INDEX.md` (Architecture map)
3. `.planning/STATE.md` (Current mission progress)
4. `.agent/marketing-get-shit-done/MGSD-INDEX.md` (Full token registry)

## 2. High-Frequency Commands
| Command | Purpose | When to use |
|---------|---------|-------------|
| `mgsd-progress` | Show dashboard & next action | Start of every turn |
| `mgsd-plan-phase` | Create a new PLAN.md | When STATE.md shows a new phase |
| `mgsd-execute-phase` | Run all tasks in current phase | After plan is approved |
| `mgsd-verify-work` | Run post-execution audit | After execution finishes |
| `mgsd-health` | Check for broken files/links | Periodically |

## 3. Boundary Definitions
- **MIR** (Marketing Intelligence): Ground truth. Brand, Audience, Product facts.
- **MSP** (Marketing Strategy): Tactical blueprints (SEO, Ads, Email).
- **ITM** (Task Templates): Pre-baked Linear tickets for common jobs.

## 4. Human-AI Handoff (DEFCON)
- AI completely owns the execution unless a task is tagged `[HUMAN]`.
- If an automated step fails, check `.protocol-lore/DEFCON.md` for escalation rules.
- Always commit with atomic messages before asking for human help.

## 5. Override Logic
Always check for overrides in `.mgsd-local/` before using protocol defaults. 
`[override]` logs are mandatory when a local file is detected.
