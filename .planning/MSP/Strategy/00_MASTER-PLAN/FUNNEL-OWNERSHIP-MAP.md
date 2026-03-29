
# MarkOS Funnel Ownership Map (Discipline × Funnel Stage)

<!-- markos-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/MSP/Strategy/00_MASTER-PLAN/FUNNEL-OWNERSHIP-MAP.md to customize it safely.

---

## LLM-Optimized Summary

This document defines which marketing discipline owns each stage of the customer funnel in MarkOS. It eliminates confusion, gaps, and duplication across disciplines, and is structured for LLM chunking and cross-referencing. All legacy “MARKOS”/“markos” names have been replaced with “MarkOS” except in historical or compatibility contexts.

**See also:**
- [MIR Products/04_PRODUCTS/CUSTOMER-JOURNEY.md](../../../../MIR/Products/04_PRODUCTS/CUSTOMER-JOURNEY.md)
- [v2.2-MILESTONE-AUDIT.md](../../../../.planning/v2.2-MILESTONE-AUDIT.md)
- [README.md](../../../../README.md)



---

**File Purpose:**
Declare which marketing discipline owns each stage of the customer funnel. Every stage must have exactly one owner. Updated for MarkOS v2.2.

**Status:** [FILL]
**Plan Period:** [FILL]
**Last Updated:** 2026-03-28

---


> **Rule:** Every funnel stage has exactly one primary owner and may have contributing disciplines. The owner is accountable for the KPI at that stage. Contributors support but do not own.

---


## 1. Funnel Stage Definitions

**Summary:**
Defines each funnel stage, aligned with MIR and MarkOS v2.2. See [CUSTOMER-JOURNEY.md](../../../../MIR/Products/04_PRODUCTS/CUSTOMER-JOURNEY.md).

> Align with stages defined in MIR `Products/04_PRODUCTS/CUSTOMER-JOURNEY.md`.

| Stage | Definition | Entry Condition | Exit Condition |
|-------|-----------|----------------|---------------|
| **UNAWARE** | Has the problem but doesn't know us | — | Sees/interacts with any brand content |
| **AWARE** | Knows we exist, beginning to learn | First brand touchpoint | Visits website or engages with content |
| **CONSIDERING** | Actively evaluating us vs. alternatives | Site visit / content engagement | Submits lead form or books a call |
| **DECIDING** | Has indicated purchase intent | Lead captured | Discovery call completed |
| **PURCHASING** | In active sales conversation | Call completed | Contract signed |
| **ONBOARDING** | New customer, early stages | Contract signed | First value moment delivered |
| **RETAINED** | Active client, seeing results | First value moment | Ongoing — measured at 90d, 6m, 12m |
| **EXPANDING** | Ready for upsell or additional services | Retention established | New service/tier signed |
| **ADVOCATING** | Referring others, producing social proof | Satisfied client | Referral given or case study produced |

---


## 2. Funnel Ownership Assignment

**Summary:**
Assigns primary and contributing disciplines, KPIs, and targets for each funnel stage. Use this as a reference for accountability and planning.

| Funnel Stage | Primary Owner (Discipline) | Contributing Disciplines | Primary KPI | KPI Target |
|-------------|--------------------------|------------------------|-------------|-----------|
| UNAWARE | [e.g. Content Marketing] | [Advertising, Social Media, PR] | [Reach / Impressions] | [FILL] |
| AWARE | [e.g. Content Marketing + SEO] | [Advertising, Email] | [Sessions, Email subscribers] | [FILL] |
| CONSIDERING | [e.g. Advertising (retargeting)] | [Email Marketing, Content] | [Lead form views, CTA clicks] | [FILL] |
| DECIDING | [e.g. Advertising (conversion)] | [Email Marketing] | [Leads generated, CPL] | [FILL] |
| PURCHASING | [Sales — not marketing] | [Email Marketing (post-call)] | [Call-to-close rate] | [FILL] |
| ONBOARDING | [e.g. Email Marketing] | [Content Marketing] | [Onboarding completion rate] | [FILL] |
| RETAINED | [e.g. Email Marketing] | [Community, Events] | [90-day retention rate] | [FILL] |
| EXPANDING | [e.g. Email Marketing] | [Product Marketing] | [Upsell rate] | [FILL] |
| ADVOCATING | [e.g. Community / Partnerships] | [Content Marketing, Email] | [Referrals/month, case studies] | [FILL] |

---


## 3. Handoff Points

**Summary:**
Defines explicit handoff triggers and ownership transitions between disciplines at each funnel stage boundary. Ensures clarity in MarkOS workflows.

> Define exactly where one discipline's job ends and another begins.

**AWARE → CONSIDERING handoff:**
```yaml
trigger       : "[e.g. Lead visits pricing page OR watches >50% of a video]"
signal_source : "[PostHog event: pricing_page_viewed or video_watched_50pct]"
what_happens  : "[PostHog cohort updated → Advertising retargeting audience refreshes]"
owned_by      : "Advertising takes over from Content Marketing"
```

**CONSIDERING → DECIDING handoff:**
```yaml
trigger       : "[e.g. Lead submits form on landing page]"
signal_source : "[PostHog: lead_submitted → n8n WF-001 fires]"
what_happens  : "[CRM record created, CAPI Lead event fired, Email nurture triggered]"
owned_by      : "Email Marketing takes over — nurture sequence activates"
```

**DECIDING → PURCHASING handoff:**
```yaml
trigger       : "[e.g. Discovery call completed]"
signal_source : "[CRM stage: 'Discovery Call Completed']"
what_happens  : "[Marketing hands off to {{LEAD_AGENT}} for sales conversation. Email pauses aggressive nurture.]"
owned_by      : "{{LEAD_AGENT}} — no longer marketing-owned"
```

**PURCHASING → ONBOARDING handoff:**
```yaml
trigger       : "[Contract signed]"
signal_source : "[CRM stage: 'Closed Won']"
what_happens  : "[Email onboarding sequence triggers via n8n WF-002]"
owned_by      : "Email Marketing — onboarding sequence"
```

---


## 4. Coverage Gaps

**Summary:**
Identifies funnel stages with no current owner or tool. Use this section to track and resolve gaps in MarkOS coverage.

> Stages where marketing currently has NO owner or tool.

| Stage | Gap | Plan to Address | Timeline |
|-------|-----|----------------|---------|
| [FILL] | [FILL] | [FILL] | [FILL] |

---


## 5. Funnel Visualization

**Summary:**
Visualizes discipline ownership across the funnel. Use as a quick reference for onboarding and planning.

```
UNAWARE
  ↓  [Owner: Content / SEO / PR — reach and discovery]
AWARE
  ↓  [Owner: Content + Advertising — engagement and capture]
CONSIDERING
  ↓  [Owner: Advertising retargeting — conversion push]
DECIDING          ← Lead captured here. PostHog `lead_submitted` fires.
  ↓  [Owner: Email Marketing — nurture to call]
PURCHASING        ← Discovery call. Sales takes over.
  ↓  [Owner: Email — onboarding sequence]
ONBOARDING
  ↓  [Owner: Email + Community — retention loops]
RETAINED
  ↓  [Owner: Email + Product Marketing — expansion signals]
EXPANDING
  ↓  [Owner: Community + Partnerships — advocacy programs]
ADVOCATING
```

---


## 6. Coverage by Marketing Investment

**Summary:**
Shows % of marketing budget allocated to each funnel zone and the rationale for the split. Aligns with MarkOS v2.2 strategy.

---

## LLM-Optimized Reference & Cross-Links

**For further details and implementation context:**
- [v2.2-MILESTONE-AUDIT.md](../../../../.planning/v2.2-MILESTONE-AUDIT.md): Full audit of v2.2 milestone, including rollout hardening and MarkOSDB migration.
- [README.md](../../../../README.md): Quickstart, install, and onboarding instructions.
- [onboarding/backend/](../../../../onboarding/backend/): All backend agent, skill, and utility modules.

**MarkOS replaces all legacy MARKOS/markos names.**
If you find any remaining legacy references, treat them as historical or for compatibility only.

**% of marketing budget allocated to each funnel zone:**

| Funnel Zone | Disciplines | Budget % |
|------------|------------|---------|
| Top of Funnel (Unaware + Aware) | Content, SEO, Social, PR, Brand | [%] |
| Middle of Funnel (Considering + Deciding) | Advertising, Email, CRO | [%] |
| Bottom of Funnel (Purchasing) | Email, Sales support | [%] |
| Post-Purchase (Onboarding → Advocating) | Email, Community, Events | [%] |

**Strategic rationale for this split:**
[FILL — e.g. "60% mid-funnel because lead generation is the primary constraint. Will rebalance to 40% TOF once lead volume target is achieved."]
