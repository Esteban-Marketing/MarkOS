# MGSD — CLAUDE MASTER CONTEXT

> Read at session start. Source of truth for project orientation.
> For expanded context: read the specific files referenced below, not this file.

---

## IDENTITY

**Project:** MGSD (Marketing Get Shit Done) — an open-source agentic marketing protocol.
**Purpose:** Standardize marketing execution across any company/industry/niche using Human-AI Agent collaboration. Parallel system to the development-focused GSD protocol.
**Owner:** esteban.marketing
**State:** v1.0 Milestone — Phases 1-3 complete. Next: Skill Alignment (Phase 4), NPX Installer (Phase 5).

---

## STRUCTURE

```
.agent/
├── get-shit-done/              ← GSD protocol (development/coding execution)
│   ├── bin/gsd-tools.cjs       ← CLI entry point
│   ├── workflows/              ← 40+ execution workflows
│   ├── references/             ← Operational context docs
│   └── templates/              ← Phase scaffolding
│
├── marketing-get-shit-done/    ← MGSD protocol (marketing execution)
│   ├── agents/                 ← 3 deployed: strategist, content-creator, linear-manager
│   ├── bin/mgsd-tools.cjs      ← CLI stub router
│   ├── workflows/              ← mgsd-linear-sync.md
│   ├── references/             ← marketing-living-system.md
│   └── templates/
│       ├── MIR/                ← Marketing Intelligence Repository (10 domains, 30+ files)
│       └── MSP/Campaigns/      ← 5 execution matrices (Paid, SEO, Email, Social, Affiliates)
│
└── skills/                     ← gsd-* and mgsd-* skill manifests

.planning/
├── PROJECT.md                  ← Project identity and requirements
├── ROADMAP.md                  ← Phase sequence (5 phases mapped)
├── REQUIREMENTS.md             ← Tracked requirement IDs (TPL, SKL, NPX, AGT)
├── STATE.md                    ← Current phase position
└── phases/                     ← Per-phase PLAN.md, VERIFICATION.md
```

---

## HOW IT WORKS

**Dual-protocol execution:** GSD handles development phases (plan → execute → verify → ship). MGSD handles marketing phases using the same lifecycle but with marketing-specific agents and templates.

**MIR (strategy layer):** Structured knowledge base. Gate 1 (Identity) and Gate 2 (Execution) must pass before campaigns launch. See `templates/MIR/README.md`.

**MSP (execution layer):** Campaign matrices with `[ ]` checkbox tasks. `mgsd-linear-manager` converts these into Linear tickets. See `templates/MSP/Campaigns/`.

**Agent roster:** `mgsd-strategist` (funnel logic, dependency validation), `mgsd-content-creator` (brand-aligned content), `mgsd-linear-manager` (Linear PM sync). Definitions in `agents/`.

---

## COMMANDS

```bash
# GSD phase workflow
/gsd-plan-phase <N>           # Plan a phase
/gsd-execute-phase <N>        # Execute a planned phase
/gsd-verify-work              # Validate completed work

# MGSD-specific
/mgsd-linear-sync             # Sync roadmap → Linear tickets
/mgsd-plan-phase              # Plan marketing phase with MSP context
/mgsd-new-project             # Initialize MIR + MSP for a new client
```

---

## RULES

1. **Dual protocol awareness.** GSD and MGSD coexist. GSD skills handle development; MGSD skills handle marketing. Route to the correct protocol based on task domain.
2. **MIR gates are mandatory.** Never generate campaign content without verifying that `Core_Strategy/02_BRAND/VOICE-TONE.md` and `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` are populated.
3. **Template variables must resolve.** All `{{VARIABLE}}` tokens in MSP matrices must map to populated MIR files. Unresolved variables block execution.
4. **Linear prefix convention.** All marketing tickets use `[MGSD]` prefix. Template-related tickets use `[TPL]`.
5. **STATE.md is always current.** Update `.planning/STATE.md` after every phase transition.

---

## CONTEXT FILES — READ ON DEMAND

| When working on | Read first |
|-----------------|------------|
| Marketing strategy or MIR | `templates/MIR/README.md` |
| Campaign execution matrices | `templates/MSP/Campaigns/*.md` |
| Agent behavior or handoffs | `agents/*.md` + `references/marketing-living-system.md` |
| Project roadmap or requirements | `.planning/ROADMAP.md` + `.planning/REQUIREMENTS.md` |
| GSD workflows or skills | `.agent/get-shit-done/workflows/` + `.agent/skills/gsd-*/SKILL.md` |
| Linear integration | `workflows/mgsd-linear-sync.md` |

---

*MGSD Protocol v1.0 — esteban.marketing*
