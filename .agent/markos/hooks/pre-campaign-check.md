---
token_id: MGSD-HKP-OPS-01
document_class: HOOK
domain: OPS
version: "1.0.0"
status: active
hook_type: pre-execution
runs_before: [mgsd-execute-phase, mgsd-campaign-launch, mgsd-linear-sync]
upstream:
  - MGSD-REF-OPS-01  # mir-gates.md
  - MGSD-IDX-000
downstream:
  - MGSD-AGT-STR-01  # mgsd-strategist
  - MGSD-AGT-EXE-01  # mgsd-executor
---

# pre-campaign-check — MIR Gate Enforcement Hook

<!-- TOKEN: MGSD-HKP-OPS-01 | CLASS: HOOK | DOMAIN: OPS -->
<!-- PURPOSE: Validates Gate 1 (Identity) and Gate 2 (Execution) readiness before any campaign execution begins. Hard blocks if gates are RED. Must be run by orchestrators before spawning executor subagents. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-REF-OPS-01 | references/mir-gates.md | Authoritative gate definitions — this hook enforces them |
| MGSD-HKP-OPS-02 | hooks/pre-content-check.md | Content-specific gate check (runs after this hook for copy tasks) |
| MGSD-HKP-OPS-03 | hooks/post-execution-sync.md | Runs after execution to sync Linear |
| MGSD-AGT-OPS-01 | agents/mgsd-context-loader.md | Always runs before this hook |
| MGSD-SKL-CAM-03 | skills/mgsd-mir-audit/SKILL.md | Full MIR audit skill — run this for detailed gap output |

---

## Invocation

Run this hook at the start of every orchestrator workflow before spawning executors:

```bash
GATE_STATUS=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit --raw)
```

Parse JSON for: `gate1.ready`, `gate2.ready`, `gate1.missing[]`, `gate2.missing[]`.

---

## Gate 1 — Identity Check

**Purpose:** Verify brand foundation is complete before any strategy, copy, or creative task.

**Required files** — all must have `status: complete` or `status: verified`:

| File | What It Provides | Block Level |
|------|-----------------|-------------|
| `Core_Strategy/01_COMPANY/PROFILE.md` | Business identity, legal name, geography | HARD BLOCK |
| `Core_Strategy/02_BRAND/VOICE-TONE.md` | Language rules, prohibited words, tone-by-context | HARD BLOCK |
| `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` | Value props, objection map, headline bank | HARD BLOCK |
| `Market_Audiences/03_MARKET/AUDIENCES.md` | ICP definitions, psychographic data | HARD BLOCK |
| `Products/04_PRODUCTS/CATALOG.md` | Product/service definitions and offers | HARD BLOCK |

**If Gate 1 is RED:**
```
⛔ GATE 1 BLOCKED — Identity Foundation Incomplete

Missing required files:
  - {file} → status: {status}

Agent cannot generate copy, briefs, strategy, or campaign drafts.

REQUIRED HUMAN ACTION:
  1. Populate the missing files listed above with verified business data
  2. Run /mgsd-health to confirm gate status
  3. Re-run /mgsd-execute-phase {N} after Gate 1 is GREEN

Linear ticket created: [MGSD-BLOCK] Gate 1 — {missing_file_count} files required
```

**Create Linear block ticket:**
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" linear create-block \
  --type "gate1" \
  --missing "${GATE1_MISSING}" \
  --phase "${PHASE_NUMBER}"
```

Set `STATE.md` `status: awaiting_human_input` before halting.

---

## Gate 2 — Execution Check

**Purpose:** Verify tracking and operational infrastructure before any campaign launches.

**Required files** — all must have `status: complete` or `status: verified`:

| File | What It Provides | Block Level |
|------|-----------------|-------------|
| `Core_Strategy/06_TECH-STACK/TRACKING.md` | PostHog events, pixel IDs, CAPI params | HARD BLOCK |
| `Core_Strategy/06_TECH-STACK/AUTOMATION.md` | n8n workflows, webhook URLs | HARD BLOCK |
| `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md` | Ad account IDs, platform credentials, budget caps | HARD BLOCK |
| `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md` | KPI targets to verify campaign against | HARD BLOCK |

**If Gate 2 is RED:**
```
⚠️ GATE 2 BLOCKED — Execution Infrastructure Incomplete

Missing required files:
  - {file} → status: {status}

Agent can plan but CANNOT: validate tracking, generate UTM specs,
confirm pixel coverage, or approve campaign launch.

REQUIRED HUMAN ACTION:
  1. Complete the missing execution infrastructure files
  2. Run /mgsd-health to confirm Gate 2 status
  3. Re-run /mgsd-execute-phase {N} after Gate 2 is GREEN

Linear ticket created: [MGSD-BLOCK] Gate 2 — {missing_file_count} files required
```

**Gate 2 is allowed to be RED for planning-only phases.** Gate 2 blocks execution and launch, not research or strategy.

---

## Decision Logic

```
gate1.ready AND gate2.ready  → ✅ PROCEED — spawn executors normally
gate1.ready AND gate2.false  → ⚠️ PLAN-ONLY — allow planning, block launch
gate1.false                  → ⛔ FULL BLOCK — halt all execution
gate1.false AND gate2.false  → ⛔ FULL BLOCK — halt all execution
```

### Override

If `mir_gate_enforcement: false` in `.planning/config.json`:
- Gates are still checked and status printed
- Blocks are converted to warnings — execution proceeds
- Log: `⚡ Gate enforcement disabled via config — proceeding with warnings`

---

## Human Verification Requirement

Gate status changes always require human review. When a gate transitions:
- RED → GREEN: Human must have explicitly filled and saved the required files
- Agent must not auto-mark gate as GREEN

Human verifies gate readiness by running:
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit
```

**The gate check is non-bypassable without config override. No agent may skip it.**
