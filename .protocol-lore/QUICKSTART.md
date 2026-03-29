# MarkOS Agent Quickstart (AGENT-BOOT)

> [!IMPORTANT]
> This is the mandatory first-read for all MarkOS sessions. If your context is low or you are in a NEW session, read this file immediately.

## 1. Context Recursive Search Map
If you are lost or memory is sparse, follow this search priority:
1. `.protocol-lore/QUICKSTART.md` (This file - Entry point)
2. `.protocol-lore/INDEX.md` (Architecture map)
3. `.planning/STATE.md` (Current mission progress)
4. `.agent/markos/MARKOS-INDEX.md` (Full token registry)

## 2. High-Frequency Commands
| Command | Purpose | When to use |
|---------|---------|-------------|
| `markos-progress` | Show dashboard & next action | Start of every turn |
| `markos-plan-phase` | Create a new PLAN.md | When STATE.md shows a new phase |
| `markos-execute-phase` | Run all tasks in current phase | After plan is approved |
| `markos-verify-work` | Run post-execution audit | After execution finishes |
| `markos-health` | Check for broken files/links | Periodically |

## 3. Boundary Definitions
- **MIR** (Marketing Intelligence): Ground truth. Brand, Audience, Product facts.
- **MSP** (Marketing Strategy): Tactical blueprints (SEO, Ads, Email).
- **ITM** (Task Templates): Pre-baked Linear tickets for common jobs.

## 4. Human-AI Handoff (DEFCON)
- AI completely owns the execution unless a task is tagged `[HUMAN]`.
- If an automated step fails, check `.protocol-lore/DEFCON.md` for escalation rules.
- Always commit with atomic messages before asking for human help.

## 5. Override Logic
Always check for overrides in `.markos-local/` before using protocol defaults. 
`[override]` logs are mandatory when a local file is detected.

## 6. Codebase File Map (Key Files)
| File | Purpose |
|------|---------|
| `bin/install.cjs` | First-run installer. Writes `.markos-install-manifest.json`. |
| `bin/update.cjs` | SHA256 idempotent updater. Preserves user-patched files. |
| `bin/ensure-vector.cjs` | Auto-healing Supabase \+ Upstash Vector daemon. Call before any vector op. |
| `onboarding/backend/server.cjs` | HTTP server. Ports: GET /, /config, /status; POST /submit, /approve, /regenerate. |
| `onboarding/backend/agents/orchestrator.cjs` | Runs all LLM draft generators â†’ stores in Vector Store. |
| `onboarding/backend/agents/mir-filler.cjs` | Generates MIR (Brand/Audience/Competitive) drafts. |
| `onboarding/backend/agents/msp-filler.cjs` | Generates MSP (Brand Voice / Channel Strategy) drafts. |
| `onboarding/backend/agents/llm-adapter.cjs` | Unified OpenAI/Anthropic/Gemini call wrapper. |
| `onboarding/backend/write-mir.cjs` | JIT clones templates â†’ fuzzy-merges drafts â†’ updates STATE.md. |
| `onboarding/backend/vector-store-client.cjs` | Supabase \+ Upstash Vector HTTP client. Namespace: `markos-{project_slug}`. |
| `.markos-project.json` | Persistent project slug (Supabase \+ Upstash Vector namespace). Written once on first submit. |
| `.markos-local/MIR/` | Client MIR override layer. NEVER commits to git. |
| `.protocol-lore/CODEBASE-MAP.md` | Full XML directory tree for deep LLM navigation. |

## 7. New-Session Cheat Sheet
```
# Start the onboarding server:
node onboarding/backend/server.cjs

# Run all tests:
node --test test/

# Check Supabase \+ Upstash Vector health:
node bin/ensure-vector.cjs

# Find client project slug:
cat .markos-project.json

# Find client MIR overrides:
ls .markos-local/MIR/
```


