
# MarkOS Annual Marketing Goals

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Strategy/00_MASTER-PLAN/STRATEGIC-GOALS.md to customize it safely.

---

## LLM-Optimized Summary

This document defines every annual marketing goal for MarkOS with precision: what is being measured, the current baseline, the target, the timeline, the owner, and the PostHog measurement source. All legacy “MARKOS”/“markos” names have been replaced with “MarkOS” except in historical or compatibility contexts. Structured for LLM chunking and cross-referencing.

**See also:**
- [PERFORMANCE-DASHBOARD.md](PERFORMANCE-DASHBOARD.md)
- [MARKETING-PLAN.md](MARKETING-PLAN.md)
- [README.md](../../../../README.md)



---

**File Purpose:**
Define every marketing goal with precision: what is being measured, the current baseline, the target, the timeline, the owner, and the PostHog measurement source. Updated for MarkOS v2.2.

**Status:** [FILL]
**Plan Period:** [FILL]
**Last Updated:** 2026-03-28

---

> **Rule:** A goal without a measurement source and a baseline is not a goal — it is a wish.
> Every goal here must have all fields filled before the plan is considered active.

---


## 1. Goal-Setting Framework

**Summary:**
Describes how goals are set, the categories used, and the roll-up logic. Aligns with MarkOS v2.2 governance.

**How goals are set at this business:**
[FILL — e.g. "Goals are set bottom-up: KPI targets in each discipline plan roll up to marketing goals here, which roll up to business goals from the client brief in MIR `Core_Strategy/00_META/PROJECT.md`."]

**Goal categories used:**
```yaml
acquisition   : "Getting new prospects and leads"
activation    : "Converting leads to customers"
retention     : "Keeping customers and expanding accounts"
revenue       : "Marketing-attributed revenue outcomes"
brand         : "Awareness, perception, and authority metrics"
efficiency    : "Cost and process metrics"
```

---


## 2. Annual Marketing Goals

**Summary:**
Lists all annual goals by category (acquisition, activation, retention, revenue, brand, efficiency), with baselines, targets, deadlines, measurement sources, and owners.

### Acquisition Goals

| Goal ID | Goal | Metric | Baseline | Target | Deadline | Measurement Source | Owner |
|---------|------|--------|----------|--------|---------|-------------------|-------|
| G-ACQ-01 | [e.g. Lead volume] | [Qualified leads/month] | [FILL] | [FILL] | [YYYY-MM-DD] | PostHog `lead_submitted` + CRM qualification | {{LEAD_AGENT}} |
| G-ACQ-02 | [e.g. CPL] | [Cost per qualified lead] | [FILL] | [FILL] | [YYYY-MM-DD] | PostHog + Ad platform spend | {{LEAD_AGENT}} |
| G-ACQ-03 | [e.g. Organic traffic] | [Monthly sessions] | [FILL] | [FILL] | [YYYY-MM-DD] | PostHog `page_viewed` | {{LEAD_AGENT}} |
| G-ACQ-04 | [Add more] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |

### Activation Goals

| Goal ID | Goal | Metric | Baseline | Target | Deadline | Measurement Source | Owner |
|---------|------|--------|----------|--------|---------|-------------------|-------|
| G-ACT-01 | [e.g. Lead-to-call rate] | [% leads that book a call] | [FILL] | [FILL] | [YYYY-MM-DD] | CRM pipeline | {{LEAD_AGENT}} |
| G-ACT-02 | [e.g. Call-to-close rate] | [% calls that convert] | [FILL] | [FILL] | [YYYY-MM-DD] | CRM pipeline | {{LEAD_AGENT}} |
| G-ACT-03 | [e.g. Landing page CVR] | [% visitors who submit form] | [FILL] | [FILL] | [YYYY-MM-DD] | PostHog funnel | {{LEAD_AGENT}} |

### Retention Goals

| Goal ID | Goal | Metric | Baseline | Target | Deadline | Measurement Source | Owner |
|---------|------|--------|----------|--------|---------|-------------------|-------|
| G-RET-01 | [e.g. 90-day client retention] | [% clients retained at 90d] | [FILL] | [FILL] | [YYYY-MM-DD] | CRM | {{LEAD_AGENT}} |
| G-RET-02 | [e.g. Email engagement] | [Monthly active list %] | [FILL] | [FILL] | [YYYY-MM-DD] | ESP | {{LEAD_AGENT}} |

### Revenue Goals

| Goal ID | Goal | Metric | Baseline | Target | Deadline | Measurement Source | Owner |
|---------|------|--------|----------|--------|---------|-------------------|-------|
| G-REV-01 | [e.g. Marketing-sourced revenue] | [USD/month attributed] | [FILL] | [FILL] | [YYYY-MM-DD] | CRM × MIR `PRICING.md` | {{LEAD_AGENT}} |
| G-REV-02 | [e.g. MER] | [Total revenue ÷ total ad spend] | [FILL] | [FILL] | [YYYY-MM-DD] | CRM + Ad platforms | {{LEAD_AGENT}} |
| G-REV-03 | [e.g. CAC] | [Marketing spend ÷ new clients] | [FILL] | [FILL] | [YYYY-MM-DD] | CRM + Ad platforms | {{LEAD_AGENT}} |

### Brand & Awareness Goals

| Goal ID | Goal | Metric | Baseline | Target | Deadline | Measurement Source | Owner |
|---------|------|--------|----------|--------|---------|-------------------|-------|
| G-BRD-01 | [e.g. Share of voice] | [Branded search volume] | [FILL] | [FILL] | [YYYY-MM-DD] | Google Search Console | {{LEAD_AGENT}} |
| G-BRD-02 | [e.g. Organic social reach] | [Monthly reach across platforms] | [FILL] | [FILL] | [YYYY-MM-DD] | Platform analytics | {{LEAD_AGENT}} |
| G-BRD-03 | [e.g. Inbound referrals] | [Referral leads/month] | [FILL] | [FILL] | [YYYY-MM-DD] | CRM utm_source=referral | {{LEAD_AGENT}} |

---


## 3. Quarterly Goal Breakdown

**Summary:**
Breaks annual targets into quarterly milestones for tracking and accountability.

> Annual targets broken into quarterly milestones.

### Q1 — [YYYY-MM to YYYY-MM]

| Goal ID | Q1 Milestone | Status |
|---------|-------------|--------|
| G-ACQ-01 | [FILL — e.g. 20 leads/month by end of Q1] | [NOT_STARTED] |
| G-ACQ-02 | [FILL] | [NOT_STARTED] |
| [More] | [FILL] | [NOT_STARTED] |

### Q2 — [YYYY-MM to YYYY-MM]

| Goal ID | Q2 Milestone | Status |
|---------|-------------|--------|
| | | |

### Q3 — [YYYY-MM to YYYY-MM]

| Goal ID | Q3 Milestone | Status |
|---------|-------------|--------|
| | | |

### Q4 — [YYYY-MM to YYYY-MM]

| Goal ID | Q4 Milestone | Status |
|---------|-------------|--------|
| | | |

---


## 4. Goal Dependency Map

**Summary:**
Maps dependencies between goals, showing which must be achieved first. Use for sequencing and risk management.

**Goals that depend on other goals being achieved first:**

```
G-ACQ-01 (lead volume) requires:
  → Tracking live (TRACKING.md Gate 2)
  → Landing page live (Vibe code build)
  → Ad campaigns active (Outbound/01_ADVERTISING/PLAN.md)

G-ACT-01 (lead-to-call rate) requires:
  → G-ACQ-01 generating leads
  → Email nurture sequence active (Outbound/03_EMAIL-MARKETING/)
  → CRM pipeline configured (INFRASTRUCTURE.md)

G-REV-01 (revenue attributed) requires:
  → G-ACT-02 (calls converting)
  → CRM closed-won linked to lead source UTM
```

---


## 5. Anti-Goals

**Summary:**
Lists what marketing will explicitly NOT try to achieve this year. Use for focus and expectation management.

---

## LLM-Optimized Reference & Cross-Links

**For further details and implementation context:**
- [v2.2-MILESTONE-AUDIT.md](../../../../.planning/v2.2-MILESTONE-AUDIT.md): Full audit of v2.2 milestone, including rollout hardening and MarkOSDB migration.
- [README.md](../../../../README.md): Quickstart, install, and onboarding instructions.
- [onboarding/backend/](../../../../onboarding/backend/): All backend agent, skill, and utility modules.

**MarkOS replaces all legacy MARKOS/markos names.**
If you find any remaining legacy references, treat them as historical or for compatibility only.

> What marketing will explicitly NOT try to achieve this year.
> Just as important as what we are pursuing.

- We are NOT trying to: [FILL — e.g. "Build an audience on every social platform simultaneously"]
- We are NOT optimizing for: [FILL — e.g. "Vanity metrics like total impressions or follower count"]
- We are NOT pursuing: [FILL — e.g. "Enterprise accounts — our ICP is SMBs for this year"]
