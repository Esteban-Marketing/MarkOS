# Marketing Living System: Optimization & Enhancement Roadmap

**Version:** 1.0.0
**Protocols Covered:** `get-shit-done` (GSD), `marketing-get-shit-done` (MGSD)
**Scope:** Human-AI Agent collaboration enhancements at the protocol intersection
**Date:** 2026-03-22

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

### 1.2 MGSD (marketing-get-shit-done) — Structural Inventory

| Component | Path | Status |
|-----------|------|--------|
| Agents | `.agent/marketing-get-shit-done/agents/` | 3 deployed (strategist, content-creator, linear-manager) |
| CLI Entry | `.agent/marketing-get-shit-done/bin/mgsd-tools.cjs` | Stub routing |
| Workflows | `.agent/marketing-get-shit-done/workflows/` | 1 workflow (linear-sync) |
| References | `.agent/marketing-get-shit-done/references/` | This file only |
| MIR Templates | `.agent/marketing-get-shit-done/templates/MIR/` | 10 domains, 30+ files |
| MSP Campaigns | `.agent/marketing-get-shit-done/templates/MSP/Campaigns/` | 5 execution matrices |
| Hooks | `.agent/marketing-get-shit-done/hooks/` | Directory exists, empty |
| VERSION | `.agent/marketing-get-shit-done/VERSION` | `1.0.0` |

**Operational Model:** MGSD separates strategy (MIR) from execution (MSP). The MIR acts as a structured knowledge base with readiness gates (Gate 1: Identity, Gate 2: Execution). MSP campaign matrices translate strategy into `[ ]` checkbox tasks parseable by `mgsd-linear-manager` for Linear ticket generation. The `mgsd-strategist` enforces dependency validation; the `mgsd-content-creator` enforces tone and channel constraints.

### 1.3 Cross-Protocol Gaps

| Gap ID | Description | Severity |
|--------|-------------|----------|
| GAP-01 | No formal bridge between GSD phase execution and MGSD campaign execution. GSD `workflows/execute-phase.md` has no awareness of MGSD agent definitions. | High |
| GAP-02 | MGSD contains 1 workflow vs. GSD's 40+. Workflow parity is structurally absent. | High |
| GAP-03 | `references/` directory contains no operational context documents (brand guidelines, escalation matrices, KPI frameworks). | Medium |
| GAP-04 | `hooks/` directory is empty. No pre/post-execution hooks exist to enforce MIR readiness gates programmatically. | Medium |
| GAP-05 | No explicit agent handoff protocol exists. Human-to-AI and AI-to-Human transitions are implicit. | High |
| GAP-06 | `mgsd-linear-manager` lacks bidirectional sync. Linear → codebase status updates are not automated. | Medium |
| GAP-07 | No escalation or error-recovery protocol. If `mgsd-content-creator` receives an empty `VOICE-TONE.md`, the failure path is undefined beyond the strategist's own blocking rule. | Medium |

---

## 2. Structural Enhancements (Human-AI Integration)

### 2.1 Unified Command Router

**Current State:** GSD skills (`gsd-*`) and MGSD skills (`mgsd-*`) are registered independently. A user must explicitly know which protocol handles a given request.

**Enhancement:**

```
.agent/skills/gsd-do/SKILL.md  →  routes to MGSD when task.category === "marketing"
```

| Trigger Keyword | Routed To | Agent Assigned |
|-----------------|-----------|----------------|
| `campaign`, `funnel`, `ad spend` | MGSD | mgsd-strategist |
| `content`, `copy`, `creative brief` | MGSD | mgsd-content-creator |
| `sprint`, `deploy`, `refactor` | GSD | gsd-planner |
| `linear sync`, `ticket`, `issue` | MGSD | mgsd-linear-manager |

**Implementation:** Extend `gsd-do` SKILL.md with an MGSD keyword detection block that delegates to the appropriate MGSD skill or agent.

### 2.2 MIR Readiness Gate Enforcement via Hooks

**Current State:** Gate enforcement is documented in `MIR/README.md` but not programmatically enforced.

**Enhancement:** Create pre-execution hooks in `.agent/marketing-get-shit-done/hooks/`:

```
hooks/
├── pre-campaign-check.md     ← Validates Gate 1 + Gate 2 before MSP execution
├── pre-content-check.md      ← Validates VOICE-TONE.md and MESSAGING-FRAMEWORK.md exist and are non-empty
└── post-execution-sync.md    ← Triggers mgsd-linear-sync after any phase completion
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
| MIR Gate 1 files all reach `complete` status | `MIR/STATE.md` | `mgsd-strategist` | Begin MSP campaign matrix population autonomously |
| Human approves a `PLAN.md` (marks status = `approved`) | `.planning/phases/XX/PLAN.md` | GSD executor | Execute phase via wave-based parallelization |
| Human uploads raw brand assets to `07_CONTENT/CONTENT-LIBRARY/` | File system event | `mgsd-content-creator` | Generate channel-formatted derivatives |
| Human creates a Linear issue with prefix `[MGSD-REQ]` | Linear webhook | `mgsd-linear-manager` | Parse issue body, create corresponding `PLAN.md` tasks |
| Human updates `PRICING.md` or `OFFERS.md` | File system event | `mgsd-strategist` | Cascade pricing changes into active campaign matrices |

#### AI → Human Handoff Triggers

| Trigger Condition | Source Agent | Human Action Required | Escalation Path |
|--------------------|-------------|----------------------|-----------------|
| MIR Gate 1 file has status `empty` and is required for execution | `mgsd-strategist` | Populate the blocking file with verified business data | Agent blocks, creates Linear issue `[MGSD-BLOCK]` |
| Generated content violates brand constraints or receives negative-sentiment flag | `mgsd-content-creator` | Review flagged content, approve or reject | Agent pauses content pipeline for that campaign |
| Budget threshold exceeded (`daily_spend > {{DAILY_BUDGET}} * 1.5`) | `mgsd-strategist` | Approve budget increase or pause campaign | Agent pauses ad set, creates `[MGSD-URGENT]` ticket |
| Phase verification fails after 3 automated iterations | GSD verifier | Debug root cause manually | Agent generates `VERIFICATION.md` with failure details |
| Linear API authentication fails or rate limit is hit | `mgsd-linear-manager` | Rotate API key or adjust sync frequency | Agent logs error to `STATE.md`, retries after 60s × 3 |
| Legal/compliance review required (influencer contracts, FTCA tagging) | `mgsd-strategist` | Human legal review | Agent blocks `05_AFFILIATE_INFLUENCER` execution |

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
   - Create Linear issue with [MGSD-HANDOFF] prefix
   - Set STATE.md status to "awaiting_human_input"
   - Agent enters idle state for the blocked task only

3. If target = AI agent:
   - Write context to the receiving agent's expected input path
   - Update STATE.md with new agent assignment
   - Trigger the receiving agent's entry workflow
```

### 2.4 Workflow Parity Matrix

MGSD requires dedicated workflows to match GSD's execution rigor. The following workflows should be created:

| Workflow | File | Description |
|----------|------|-------------|
| `mgsd-plan-campaign` | `workflows/mgsd-plan-campaign.md` | Generate a campaign `PLAN.md` from MIR context + selected MSP matrix |
| `mgsd-execute-campaign` | `workflows/mgsd-execute-campaign.md` | Wave-execute campaign tasks across agents (strategist plans, creator executes) |
| `mgsd-verify-campaign` | `workflows/mgsd-verify-campaign.md` | Validate campaign outputs against KPI-FRAMEWORK.md targets |
| `mgsd-pause-campaign` | `workflows/mgsd-pause-campaign.md` | Freeze active campaign, snapshot state, create handoff context |
| `mgsd-report-campaign` | `workflows/mgsd-report-campaign.md` | Generate performance report from Linear ticket data + analytics |
| `mgsd-onboard-client` | `workflows/mgsd-onboard-client.md` | Clone MIR template, initialize STATE.md, begin Gate 1 questionnaire |

---

## 3. Automation & AI Agent Optimization Points

### 3.1 Agent Capability Extensions

#### mgsd-strategist

| Current Capability | Enhancement | Priority |
|--------------------|-------------|----------|
| Validates MIR → MSP dependency chains | Add cross-matrix dependency validation (e.g., `01_PAID_ACQUISITION` → `04_CONTENT_SOCIAL` asset readiness) | P1 |
| Blocks on empty Gate files | Auto-generate Gate 1 interview questionnaire and assign to human via Linear | P1 |
| Static funnel mapping | Dynamic funnel state tracking with weekly recalibration triggers | P2 |

#### mgsd-content-creator

| Current Capability | Enhancement | Priority |
|--------------------|-------------|----------|
| Reads VOICE-TONE.md before generation | Implement tone-drift detection: compare generated output against VOICE-TONE constraints numerically | P1 |
| Generates channel-specific formats | Add asset variant generation (3 copy lengths × 2 CTA variations per creative) | P2 |
| Single-pass generation | Implement A/B variant generation with pre-allocation to test groups | P2 |

#### mgsd-linear-manager

| Current Capability | Enhancement | Priority |
|--------------------|-------------|----------|
| One-way sync (codebase → Linear) | Bidirectional sync: Linear status changes propagate to `.planning/STATE.md` and `PLAN.md` checkboxes | P1 |
| Manual invocation via `/mgsd-linear-sync` | Event-driven invocation: trigger sync on git commit, file save, or cron schedule | P1 |
| Flat task creation | Hierarchical issue creation: Epic (Campaign) → Story (Matrix Section) → Task (Checkbox) | P2 |

### 3.2 New Agent Definitions Required

| Agent | File | Responsibility |
|-------|------|----------------|
| `mgsd-analyst` | `agents/mgsd-analyst.md` | Ingests `09_ANALYTICS/REPORTS/`, computes KPI variance, generates optimization recommendations |
| `mgsd-auditor` | `agents/mgsd-auditor.md` | Periodic MIR staleness checks (files with status `verified` older than 90 days → flag as `stale`) |

### 3.3 Automation Triggers

| Event | Automated Response |
|-------|-------------------|
| New file added to `08_CAMPAIGNS/ACTIVE/` | `mgsd-linear-manager` creates Epic in Linear, `mgsd-strategist` validates dependencies |
| `STATE.md` updated with `status: stale` on any file | `mgsd-auditor` creates review ticket assigned to `{{LEAD_AGENT}}` |
| All `[ ]` in a campaign matrix converted to `[x]` | `post-execution-sync` hook triggers `mgsd-verify-campaign` workflow |
| Git tag matching `v*-campaign-*` pushed | `mgsd-report-campaign` workflow auto-generates performance snapshot |

---

## 4. Scalability & Maintenance Framework

### 4.1 Multi-Client Architecture

**Current:** MIR template is designed for single-project clone (`P[N]-[client-slug]`). MGSD agents operate within a single `.agent/` directory.

**Enhancement:**

```
project-root/
├── .agent/
│   ├── get-shit-done/          ← Shared GSD protocol (unchanged)
│   └── marketing-get-shit-done/
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
2. `mgsd-auditor` flags all downstream references to the deprecated file.
3. 30-day grace period during which the file remains readable but generates warnings.
4. After 30 days, file is moved to `_archive/` with a tombstone redirect in the original path.

### 4.4 Monitoring & Health Checks

| Check | Frequency | Agent |
|-------|-----------|-------|
| MIR file staleness audit | Weekly | `mgsd-auditor` |
| Linear sync drift (codebase vs. Linear state mismatch) | Daily | `mgsd-linear-manager` |
| Agent definition schema validation | On commit | GSD pre-commit hook |
| Campaign matrix variable resolution (all `{{VAR}}` have values) | Pre-execution | `pre-campaign-check` hook |
| Workflow coverage (all ROADMAP phases have corresponding workflows) | On milestone transition | `mgsd-strategist` |

---

*Marketing Living System v1.0.0 — Protocol intersection document for GSD × MGSD.*
*Maintained as a living reference in `.agent/marketing-get-shit-done/references/`.*
