# _DISCIPLINE-PLAN-TEMPLATE.md

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to `.mgsd-local/MSP/_DISCIPLINE-PLAN-TEMPLATE.md` to customize it safely.

> [!IMPORTANT]
> **AGENT LOGIC**: This template is used by `mgsd-planner` to create `PLAN.md` files. Consistency across disciplines is mandatory. Do not remove sections.

### Base Template — Copy this when creating any discipline PLAN.md

> **How to use:** Copy this file to the target discipline folder, rename to `PLAN.md`,
> and replace all `[DISCIPLINE_NAME]` and `[FILL]` placeholders.
> The structure is identical across all 13 disciplines intentionally —
> consistency lets agents and humans navigate any plan without relearning the format.

---

# [DISCIPLINE_NAME] Plan

```
file_purpose  : Define the strategy, goals, tactics, and roadmap for [DISCIPLINE_NAME].
                Derives from MARKETING-PLAN.md and MIR. Does not duplicate MIR content.
discipline    : [DISCIPLINE_NAME]
activation    : [ACTIVE | INACTIVE | FUTURE]
status        : empty
plan_period   : YYYY
budget        : $[FILL] (from BUDGET-ALLOCATION.md)
funnel_stages : [Which stages this discipline owns — from FUNNEL-OWNERSHIP-MAP.md]
last_updated  : YYYY-MM-DD
```

---

## Why This Discipline (or Why Not)

**Activation rationale:**
[FILL — If ACTIVE: Why is this discipline right for this business at this stage?
If INACTIVE: Why is it not being pursued, and what would trigger activation?
If FUTURE: What must be true before it is activated?]

**What this discipline does that no other does:**
[FILL — the unique role this discipline plays in the marketing program]

**Dependencies — what must be true for this discipline to work:**
[FILL — prerequisites in terms of budget, team, audience size, brand assets, or other disciplines]

---

## 1. Situation Analysis

### Current State

```yaml
current_investment    : "$[FILL] per month or NONE"
current_performance   : "[Brief description of what is or isn't happening]"
assets_available      : "[What exists today — content, lists, accounts, tools]"
gaps                  : "[What is missing to execute this discipline well]"
```

### Why Now

**The specific opportunity this discipline addresses at this moment:**
[FILL — market timing, business readiness, audience behavior, competitive gap]

---

## 2. Goals & KPIs

**This discipline's contribution to the north star metric:**
[FILL — how does this discipline's activity ultimately move the lead, revenue, or retention number]

| KPI | Baseline | Q1 Target | Q2 Target | Q3 Target | Q4 Target | Source |
|-----|----------|----------|----------|----------|----------|--------|
| [Primary KPI] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [PostHog / CRM / ESP / Platform] |
| [Secondary KPI] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |
| [Supporting KPI] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |

**What success looks like at the end of the plan period:**
[FILL — concrete, measurable description]

**What failure looks like (and the kill condition):**
[FILL — the specific conditions under which this discipline is paused or killed]

---

## 3. Target Audience

> Full audience definitions: MIR `Market_Audiences/03_MARKET/AUDIENCES.md`. Summarize discipline-specific focus here.

**Primary ICP targeted by this discipline:**
[FILL — which ICP, and what stage of the journey they are in when this discipline reaches them]

**Audience state at point of contact:**
[FILL — what does this person know, believe, and want when this discipline first reaches them]

**Audience segment IDs used:** [SEG-001, SEG-002, etc. from MIR AUDIENCES.md]

---

## 4. Strategy

### Core Strategic Approach

[FILL — 3–5 sentences. What is the strategic logic for this discipline?
What is the theory of change — how does this activity lead to the goal?]

### Key Strategic Bets

> The 2–3 specific bets this plan makes. Testable assumptions that, if true, make this plan work.

| Bet # | Assumption | If True → | If False → |
|-------|-----------|----------|----------|
| 1 | [FILL] | [Plan works] | [Kill condition or pivot] |
| 2 | [FILL] | [FILL] | [FILL] |
| 3 | [FILL] | [FILL] | [FILL] |

### Positioning Within This Discipline

[FILL — how will this business stand out within this specific channel/discipline?
What will make its content, ads, outreach, or presence different from competitors?]

---

## 5. Tactics & Initiatives

> Specific, actionable programs within this discipline.

| Initiative | Description | Owner | Budget | Timeline | KPI |
|-----------|-------------|-------|--------|---------|-----|
| [Name] | [What it is and why] | [{{LEAD_AGENT}} / Designer / External] | $[FILL] | [Q1–Q2] | [KPI] |
| [Name] | [FILL] | [FILL] | $[FILL] | [FILL] | [FILL] |
| [Name] | [FILL] | [FILL] | $[FILL] | [FILL] | [FILL] |

**Quarterly initiative roadmap:**

| Quarter | Active Initiatives | Milestone |
|---------|------------------|----------|
| Q1 | [FILL] | [FILL] |
| Q2 | [FILL] | [FILL] |
| Q3 | [FILL] | [FILL] |
| Q4 | [FILL] | [FILL] |

---

## 6. Content & Messaging Requirements

> Reference MIR `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` and `Core_Strategy/02_BRAND/VOICE-TONE.md`.
> This section captures discipline-specific messaging needs.

**Primary message used by this discipline:**
[FILL — which message from the messaging framework is this discipline's entry point]

**Tone for this discipline's context:**
[FILL — from VOICE-TONE.md tone-by-context table]

**Content formats required:**
[FILL — what assets does this discipline consume and at what volume]

**Content production dependencies:**
[FILL — what does this discipline need from Content Marketing or the Designer]

---

## 7. Technology Requirements

> Full stack in MIR `Core_Strategy/06_TECH-STACK/`. List discipline-specific tool needs here.

| Tool | Role | Status | Config Reference |
|------|------|--------|----------------|
| [e.g. PostHog] | Track [specific events] | [ACTIVE] | `Core_Strategy/06_TECH-STACK/TRACKING.md` |
| [e.g. n8n] | [Specific workflow] | [ACTIVE] | `Core_Strategy/06_TECH-STACK/AUTOMATION.md` |
| [Discipline-specific tool] | [FILL] | [FILL] | [FILL] |

**Events this discipline requires PostHog to track:**
[FILL — list specific events from TRACKING.md or new events needed]

---

## 8. Integration with Other Disciplines

**What this discipline receives from other disciplines:**

| From Discipline | What It Receives | How It Uses It |
|----------------|-----------------|---------------|
| [e.g. Content Marketing] | [Blog posts] | [Promoted as ads] |
| [e.g. Advertising] | [Leads] | [Entered into email sequence] |

**What this discipline provides to other disciplines:**

| To Discipline | What It Provides | Why It Matters |
|--------------|----------------|---------------|
| [e.g. Advertising] | [High-performing organic content] | [Used as social proof in retargeting] |
| [e.g. Email] | [Warm leads] | [Enters nurture sequence] |

---

## 9. Budget Detail

```yaml
total_discipline_budget : "$[FILL] for [YYYY]"
budget_source           : "From BUDGET-ALLOCATION.md — [discipline line]"
```

| Budget Line Item | Monthly | Q1 | Q2 | Q3 | Q4 | Annual |
|-----------------|---------|----|----|----|----|--------|
| [Item 1] | $[FILL] | | | | | |
| [Item 2] | $[FILL] | | | | | |
| [Item 3] | $[FILL] | | | | | |
| **TOTAL** | **$[FILL]** | | | | | |

---

## 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| [FILL] | [H/M/L] | [H/M/L] | [FILL] |
| [FILL] | [H/M/L] | [H/M/L] | [FILL] |

---

## 11. Review & Optimization Cadence

```yaml
review_frequency      : "[Weekly / Biweekly / Monthly]"
review_owner          : "{{LEAD_AGENT}}"
optimization_trigger  : "[Condition that causes a change in tactics]"
kill_condition        : "[Condition that causes this discipline to be paused]"
next_review_date      : "YYYY-MM-DD"
```
