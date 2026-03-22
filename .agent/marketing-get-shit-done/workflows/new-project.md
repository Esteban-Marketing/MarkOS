---
description: Initialize a new marketing project with MIR scaffolding, MSP discipline activation, and roadmap creation
---

# /mgsd-new-project

<purpose>
Initialize a new marketing project: gather business context, scaffold MIR repository, activate MSP disciplines, create PROJECT.md + ROADMAP.md + STATE.md.
</purpose>

## Process

### 1. Get Context

```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" init new-project --raw)
```

If `.planning/PROJECT.md` already exists → show warning, ask if user wants to reinitialize.

### 2. Discovery

@-reference `.agent/marketing-get-shit-done/references/questioning.md`

Use adaptive questioning to gather:
- Business identity (company, industry, target market)
- Marketing objective
- Budget
- Current channels and tech stack
- Brand voice (if exists)
- Target audience
- Previous campaign history

Continue until the context checklist in `questioning.md` is >80% covered.

### 3. MIR Scaffolding

The MIR templates exist at `.agent/marketing-get-shit-done/templates/MIR/`.
Copy the MIR structure to the project's marketing repository.

Key files to populate from discovery answers:
- `Core_Strategy/01_COMPANY/PROFILE.md` (business identity)
- `Core_Strategy/02_BRAND/VOICE-TONE.md` (brand voice if provided)
- `Market_Audiences/03_MARKET/AUDIENCES.md` (ICP definitions)
- `Products/04_PRODUCTS/CATALOG.md` (products/services)

### 4. MSP Discipline Activation

Present all 13 disciplines from `.agent/marketing-get-shit-done/templates/MSP/README.md`:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Discipline Activation                           ║
╚══════════════════════════════════════════════════════════════╝

Which marketing disciplines should be active for this project?

| # | Discipline | Recommendation |
|---|-----------|---------------|
| 01 | Advertising | [Based on discovery] |
| 02 | Content Marketing | [Based on discovery] |
| ... | ... | ... |

→ Confirm activation: list numbers (e.g., "1, 2, 6, 11")
```

Save selections to `.planning/config.json` → `discipline_activation`.

### 5. Create Planning Files

Using MGSD templates:

1. **PROJECT.md** — from `templates/project.md`, populated with discovery answers
2. **REQUIREMENTS.md** — from `templates/requirements.md`, with marketing requirements
3. **ROADMAP.md** — from `templates/roadmap.md`, with initial phases
4. **STATE.md** — from `templates/state.md`, with current gate status
5. **config.json** — from `templates/config.json`

### 6. MIR Gate Check

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" mir-audit
```

Display gate status:
```
Gate 1 (Identity): ✗ RED — 3 files need content
Gate 2 (Execution): ✗ RED — tracking not configured

→ MIR completion is Phase 1's recommended first task.
```

### 7. Commit and Next Steps

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(init): initialize marketing project"
```

Display Next Up block:
```
▶ Next Up

**Phase 1** — Start with /mgsd-discuss-phase 1

`/mgsd-discuss-phase 1`
```

<success_criteria>
- .planning/PROJECT.md exists with populated business identity
- .planning/ROADMAP.md exists with at least 3 phases
- .planning/STATE.md exists with current gate status
- .planning/config.json exists with discipline activation
- MIR gate status displayed
</success_criteria>
