---
token_id: MARKOS-REF-OPS-02
document_class: REF
domain: OPS
version: "1.0.0"
status: active
upstream:
  - MARKOS-IDX-000   # MARKOS-INDEX.md — master registry
  - MARKOS-REF-OPS-01 # mir-gates.md — gate enforcement
downstream:
  - MARKOS-AGT-STR-01 # markos-strategist.md
  - MARKOS-AGT-EXE-01 # markos-executor.md
  - MARKOS-AGT-EXE-02 # markos-verifier.md
mir_gate_required: false
---

# Marketing Living System: Optimization & Enhancement Roadmap

<!-- TOKEN: MARKOS-REF-OPS-02 | CLASS: REF | DOMAIN: OPS -->
<!-- PURPOSE: Cross-protocol structural audit identifying gaps between GSD and MARKOS. Used by agents to understand protocol integration points. -->

**Version:** 1.0.0
**Protocols Covered:** `get-shit-done` (GSD), `markos` (MARKOS)
**Scope:** Human-AI Agent collaboration enhancements at the protocol intersection

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Entry point — indexes this document |
| MARKOS-REF-OPS-01 | mir-gates.md | Gate enforcement rules referenced in GAP analysis |
| MARKOS-REF-NEU-01 | neuromarketing.md | Biological trigger layer referenced in gap proposals |
| MARKOS-AGT-STR-01 | agents/markos-strategist.md | Primary consumer of cross-protocol gap data |
| MARKOS-REF-OPS-03 | verification-patterns.md | Verification standards cited in this document |

---

---

## 1. Protocol Audit Summaries

### 1.1 GSD (get-shit-done) — Structural Inventory

| Component | Path | Status |
|-----------|------|--------|
| CLI Entry | `.agent/get-shit-done/bin/` | Operational |
| Workflows | `.agent/get-shit-done/workflows/` | 40+ workflows (plan, execute, verify, discuss, ship) |
| Skills | `.agent/skills/gsd-*` | 50+ skill manifests registered |
| References | `.agent/get-shit-done/references/` | UI brand guide, codebase context |
| Templates | `.agent/get-shit-done/templates/` | Phase scaffolding, plan structures |
| State Mgmt | `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` | Centralized |
| VERSION | `.agent/get-shit-done/VERSION` | Semantic versioning active |

**Operational Model:** GSD operates as a phase-serial executor. Humans define milestones and requirements. AI agents plan phases, execute plans via wave-based parallelization, and verify outputs through automated checker loops. The protocol enforces strict gates: discuss → plan → execute → verify → ship.

### 1.2 MARKOS (markos) — Structural Inventory

| Component | Path | Status |
|-----------|------|--------|
| Agents | `.agent/markos/agents/` | 3 deployed (strategist, content-creator, linear-manager) |
| CLI Entry | `.agent/markos/bin/markos-tools.cjs` | Stub routing |
| Workflows | `.agent/markos/workflows/` | 1 workflow (linear-sync) |
| References | `.agent/markos/references/` | This file only |
| MIR Templates | `.agent/markos/templates/MIR/` | 10 domains, 30+ files |
| MSP Campaigns | `.agent/markos/templates/MSP/Campaigns/` | 5 execution matrices |
| Hooks | `.agent/markos/hooks/` | Directory exists, empty |
| VERSION | `.agent/markos/VERSION` | `1.0.0` |

**Operational Model:** MARKOS separates strategy (MIR) from execution (MSP). The MIR acts as a structured knowledge base with readiness gates (Gate 1: Identity, Gate 2: Execution). MSP campaign matrices translate strategy into `[ ]` checkbox tasks parseable by `markos-linear-manager` for Linear ticket generation. The `markos-strategist` enforces dependency validation; the `markos-content-creator` enforces tone and channel constraints.

### 1.3 Cross-Protocol Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| GAP-01 | No formal bridge between GSD phase execution and MARKOS campaign execution. GSD `workflows/execute-phase.md` has no awareness of MARKOS agent definitions. | High |
| GAP-02 | MARKOS contains 1 workflow vs. GSD's 40+. Workflow parity is structurally absent. | High |
| GAP-03 | `references/` directory contains no operational context documents (brand guidelines, escalation matrices, KPI frameworks). | Medium |
| GAP-04 | `hooks/` directory is empty. No pre/post-execution hooks exist to enforce MIR readiness gates programmatically. | Medium |
| GAP-05 | No explicit agent handoff protocol exists. Human-to-AI and AI-to-Human transitions are implicit. | High |
| GAP-06 | `markos-linear-manager` lacks bidirectional sync. Linear → codebase status updates are not automated. | Medium |
| GAP-07 | No escalation or error-recovery protocol. If `markos-content-creator` receives an empty `VOICE-TONE.md`, the failure path is undefined beyond the strategist's own blocking rule. | Medium |

---

## 2. Structural Enhancements (Human-AI Integration)

### 2.1 Unified Command Router

**Current State:** GSD skills (`gsd-*`) and MARKOS skills (`markos-*`) are registered independently. A user must explicitly know which protocol handles a given request.

**Enhancement:**

```
.agent/skills/gsd-do/SKILL.md  →  routes to MARKOS when task.category === "marketing"
```

| Trigger Keyword | Routed To | Agent Assigned |
|-----------------|-----------|----------------|
| `campaign`, `funnel`, `ad spend` | MARKOS | markos-strategist |
| `content`, `copy`, `creative brief` | MARKOS | markos-content-creator |
| `sprint`, `deploy`, `refactor` | GSD | gsd-planner |
| `linear sync`, `ticket`, `issue` | MARKOS | markos-linear-manager |

**Implementation:** Extend `gsd-do` SKILL.md with an MARKOS keyword detection block that delegates to the appropriate MARKOS skill or agent.

### 2.2 MIR Readiness Gate Enforcement via Hooks

**Current State:** Gate enforcement is documented in `MIR/README.md` but not programmatically enforced.

**Enhancement:** Create pre-execution hooks in `.agent/markos/hooks/`:

```
hooks/
├── pre-campaign-check.md     ← Validates Gate 1 + Gate 2 before MSP execution
├── pre-content-check.md      ← Validates VOICE-TONE.md and MESSAGING-FRAMEWORK.md exist and are non-empty
└── post-execution-sync.md    ← Triggers markos-linear-sync after any phase completion
```

**Gate 1 Files (Block if status = `empty`):**
- `Core_Strategy/01_COMPANY/PROFILE.md`
- `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md`
- `Core_Strategy/02_BRAND/VOICE-TONE.md`
- `Market_Audiences/03_MARKET/AUDIENCES.md`
- `Products/04_PRODUCTS/CATALOG.md`

**Gate 2 Files (Block if status = `empty`):**
- `Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md`
- `Core_Strategy/06_TECH-STACK/TRACKING.md`
- `Core_Strategy/06_TECH-STACK/AUTOMATION.md`
- `Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md`

### 2.3 Agent Handoff Triggers

This section defines the explicit conditions under which task ownership transfers between human operators and AI agents.

#### Human → AI Handoff Triggers

| Trigger Condition | Source Artifact | Receiving Agent | Action |
|--------------------|----------------|-----------------|--------|
| MIR Gate 1 files all reach `complete` status | `MIR/STATE.md` | `markos-strategist` | Begin MSP campaign matrix population autonomously |
| Human approves a `PLAN.md` (marks status = `approved`) | `.planning/phases/XX/PLAN.md` | GSD executor | Execute phase via wave-based parallelization |
| Human uploads raw brand assets to `07_CONTENT/CONTENT-LIBRARY/` | File system event | `markos-content-creator` | Generate channel-formatted derivatives |
| Human creates a Linear issue with prefix `[MARKOS-REQ]` | Linear webhook | `markos-linear-manager` | Parse issue body, create corresponding `PLAN.md` tasks |
| Human updates `PRICING.md` or `OFFERS.md` | File system event | `markos-strategist` | Cascade pricing changes into active campaign matrices |

#### AI → Human Handoff Triggers

| Trigger Condition | Source Agent | Human Action Required | Escalation Path |
|--------------------|-------------|----------------------|-----------------|
| MIR Gate 1 file has status `empty` and is required for execution | `markos-strategist` | Populate the blocking file with verified business data | Agent blocks, creates Linear issue `[MARKOS-BLOCK]` |
| Generated content violates brand constraints or receives negative-sentiment flag | `markos-content-creator` | Review flagged content, approve or reject | Agent pauses content pipeline for that campaign |
| Budget threshold exceeded (`daily_spend > {{DAILY_BUDGET}} * 1.5`) | `markos-strategist` | Approve budget increase or pause campaign | Agent pauses ad set, creates `[MARKOS-URGENT]` ticket |
| Phase verification fails after 3 automated iterations | GSD verifier | Debug root cause manually | Agent generates `VERIFICATION.md` with failure details |
| Linear API authentication fails or rate limit is hit | `markos-linear-manager` | Rotate API key or adjust sync frequency | Agent logs error to `STATE.md`, retries after 60s × 3 |
| Legal/compliance review required (influencer contracts, FTCA tagging) | `markos-strategist` | Human legal review | Agent blocks `05_AFFILIATE_INFLUENCER` execution |

#### Handoff Protocol

```
1. Triggering agent writes to `.planning/HANDOFF.md`:
   - timestamp
   - source_agent
   - target (human | agent_name)
   - reason
   - blocking_artifact (file path)
   - severity (low | medium | urgent)

2. If target = human:
   - Create Linear issue with [MARKOS-HANDOFF] prefix
   - Set STATE.md status to "awaiting_human_input"
   - Agent enters idle state for the blocked task only

3. If target = AI agent:
   - Write context to the receiving agent's expected input path
   - Update STATE.md with new agent assignment
   - Trigger the receiving agent's entry workflow
```

### 2.4 Workflow Parity Matrix

MARKOS requires dedicated workflows to match GSD's execution rigor. The following workflows should be created:

| Workflow | File | Description |
|----------|------|-------------|
| `markos-plan-campaign` | `workflows/markos-plan-campaign.md` | Generate a campaign `PLAN.md` from MIR context + selected MSP matrix |
| `markos-execute-campaign` | `workflows/markos-execute-campaign.md` | Wave-execute campaign tasks across agents (strategist plans, creator executes) |
| `markos-verify-campaign` | `workflows/markos-verify-campaign.md` | Validate campaign outputs against KPI-FRAMEWORK.md targets |
| `markos-pause-campaign` | `workflows/markos-pause-campaign.md` | Freeze active campaign, snapshot state, create handoff context |
| `markos-report-campaign` | `workflows/markos-report-campaign.md` | Generate performance report from Linear ticket data + analytics |
| `markos-onboard-client` | `workflows/markos-onboard-client.md` | Clone MIR template, initialize STATE.md, begin Gate 1 questionnaire |

---

## 3. Automation & AI Agent Optimization Points

### 3.1 Agent Capability Extensions

#### markos-strategist

| Current Capability | Enhancement | Priority |
|--------------------|-------------|----------|
| Validates MIR → MSP dependency chains | Add cross-matrix dependency validation (e.g., `01_PAID_ACQUISITION` → `04_CONTENT_SOCIAL` asset readiness) | P1 |
| Blocks on empty Gate files | Auto-generate Gate 1 interview questionnaire and assign to human via Linear | P1 |
| Static funnel mapping | Dynamic funnel state tracking with weekly recalibration triggers | P2 |

#### markos-content-creator

| Current Capability | Enhancement | Priority |
|--------------------|-------------|----------|
| Reads VOICE-TONE.md before generation | Implement tone-drift detection: compare generated output against VOICE-TONE constraints numerically | P1 |
| Generates channel-specific formats | Add asset variant generation (3 copy lengths × 2 CTA variations per creative) | P2 |
| Single-pass generation | Implement A/B variant generation with pre-allocation to test groups | P2 |

#### markos-linear-manager

| Current Capability | Enhancement | Priority |
|--------------------|-------------|----------|
| One-way sync (codebase → Linear) | Bidirectional sync: Linear status changes propagate to `.planning/STATE.md` and `PLAN.md` checkboxes | P1 |
| Manual invocation via `/markos-linear-sync` | Event-driven invocation: trigger sync on git commit, file save, or cron schedule | P1 |
| Flat task creation | Hierarchical issue creation: Epic (Campaign) → Story (Matrix Section) → Task (Checkbox) | P2 |

### 3.2 New Agent Definitions Required

| Agent | File | Responsibility |
|-------|------|----------------|
| `markos-analyst` | `agents/markos-analyst.md` | Ingests `09_ANALYTICS/REPORTS/`, computes KPI variance, generates optimization recommendations |
| `markos-auditor` | `agents/markos-auditor.md` | Periodic MIR staleness checks (files with status `verified` older than 90 days → flag as `stale`) |

### 3.3 Automation Triggers

| Event | Automated Response |
|-------|-------------------|
| New file added to `08_CAMPAIGNS/ACTIVE/` | `markos-linear-manager` creates Epic in Linear, `markos-strategist` validates dependencies |
| `STATE.md` updated with `status: stale` on any file | `markos-auditor` creates review ticket assigned to `{{LEAD_AGENT}}` |
| All `[ ]` in a campaign matrix converted to `[x]` | `post-execution-sync` hook triggers `markos-verify-campaign` workflow |
| Git tag matching `v*-campaign-*` pushed | `markos-report-campaign` workflow auto-generates performance snapshot |

---

## 4. Scalability & Maintenance Framework

### 4.1 Multi-Client Architecture

**Current:** MIR template is designed for single-project clone (`P[N]-[client-slug]`). MARKOS agents operate within a single `.agent/` directory.

**Enhancement:**

```
project-root/
├── .agent/
│   ├── get-shit-done/          ← Shared GSD protocol (unchanged)
│   └── markos/
│       ├── agents/             ← Shared agent definitions
│       ├── workflows/          ← Shared workflow definitions
│       └── templates/          ← Master templates (cloned per client)
│
├── clients/
│   ├── P1-acme-corp/
│   │   ├── MIR/                ← Client-specific MIR instance
│   │   ├── MSP/                ← Client-specific MSP campaigns
│   │   └── STATE.md            ← Client-specific state
│   └── P2-brand-name/
│       ├── MIR/
│       ├── MSP/
│       └── STATE.md
│
└── .planning/                  ← Protocol-level planning (not client-specific)
```

### 4.2 Template Versioning

| Component | Versioning Strategy |
|-----------|-------------------|
| MIR Template | `MIR/README.md` header contains `Template v[X.Y]`. Changes to file structure increment minor. Changes to domain logic increment major. |
| MSP Matrices | Each matrix file contains a `version` field in YAML frontmatter. Breaking changes to variable names require major increment. |
| Agent Definitions | YAML frontmatter `version` field. Capability additions = minor. Behavioral changes = major. |
| Workflows | Filename-based versioning not required. `CHANGELOG.md` tracks workflow modifications. |

### 4.3 Deprecation Protocol

1. File to be removed receives status `deprecated` in `STATE.md`.
2. `markos-auditor` flags all downstream references to the deprecated file.
3. 30-day grace period during which the file remains readable but generates warnings.
4. After 30 days, file is moved to `_archive/` with a tombstone redirect in the original path.

### 4.4 Monitoring & Health Checks

| Check | Frequency | Agent |
|-------|-----------|-------|
| MIR file staleness audit | Weekly | `markos-auditor` |
| Linear sync drift (codebase vs. Linear state mismatch) | Daily | `markos-linear-manager` |
| Agent definition schema validation | On commit | GSD pre-commit hook |
| Campaign matrix variable resolution (all `{{VAR}}` have values) | Pre-execution | `pre-campaign-check` hook |
| Workflow coverage (all ROADMAP phases have corresponding workflows) | On milestone transition | `markos-strategist` |

---

*Marketing Living System v1.0.0 — Protocol intersection document for GSD × MARKOS.*
*Maintained as a living reference in `.agent/markos/references/`.*
