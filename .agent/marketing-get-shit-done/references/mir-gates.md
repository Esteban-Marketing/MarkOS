# MIR Gates — Readiness Check Logic

MIR gates enforce a knowledge-before-execution principle. No campaign launches without verified business identity and tracking infrastructure.

## Gate 1 — Identity (Must pass before strategy)

Required files with status `complete` or `verified`:

| File | What it provides |
|------|-----------------|
| `Core_Strategy/01_COMPANY/PROFILE.md` | Business identity, legal name, geography |
| `Core_Strategy/02_BRAND/VOICE-TONE.md` | Language rules, prohibited words, tone-by-context |
| `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` | Value props, objection responses, headline bank |

**Gate 1 RED means:** Agent cannot generate copy, briefs, or campaign drafts. The brand foundation is incomplete.

## Gate 2 — Execution (Must pass before campaign launch)

Required files with status `complete` or `verified`:

| File | What it provides |
|------|-----------------|
| `Core_Strategy/06_TECH-STACK/TRACKING.md` | PostHog events, CAPI params, pixel IDs |
| `Core_Strategy/06_TECH-STACK/AUTOMATION.md` | n8n workflows, webhook URLs, API keys |

**Gate 2 RED means:** Agent cannot validate tracking, generate UTM specs, or confirm pixel coverage. Campaigns launch blind.

## Check Logic

```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit)
```

Parse JSON `gate1.ready` and `gate2.ready`:
- Both `true` → proceed normally
- Gate 1 `false` → block creative and strategy agents
- Gate 2 `false` → allow planning but block launch verification

## Agent Enforcement

| Agent | Gate 1 Required | Gate 2 Required |
|-------|----------------|----------------|
| mgsd-strategist | ✓ | — |
| mgsd-content-creator | ✓ | — |
| mgsd-campaign-architect | ✓ | — |
| mgsd-tracking-spec | — | ✓ |
| mgsd-utm-architect | — | ✓ |
| mgsd-linear-manager | — | — |

## Override

If `mir_gate_enforcement: false` in `.planning/config.json`, gates are checked but not enforced. Warnings are still displayed.
