# FUNNEL-OWNERSHIP-MAP.md — Discipline × Funnel Stage Ownership

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Strategy/00_MASTER-PLAN/FUNNEL-OWNERSHIP-MAP.md to customize it safely.


```
file_purpose  : Declare which marketing discipline owns each stage of the
                customer funnel. Eliminates confusion, gaps, and duplication
                across disciplines. Every stage must have exactly one owner.
status        : empty
plan_period   : YYYY
last_updated  : YYYY-MM-DD
```

> **Rule:** Every funnel stage has exactly one primary owner and may have contributing disciplines.
> The owner is accountable for the KPI at that stage. Contributors support but do not own.

---

## 1. Funnel Stage Definitions

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

> Stages where marketing currently has NO owner or tool.

| Stage | Gap | Plan to Address | Timeline |
|-------|-----|----------------|---------|
| [FILL] | [FILL] | [FILL] | [FILL] |

---

## 5. Funnel Visualization

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

**% of marketing budget allocated to each funnel zone:**

| Funnel Zone | Disciplines | Budget % |
|------------|------------|---------|
| Top of Funnel (Unaware + Aware) | Content, SEO, Social, PR, Brand | [%] |
| Middle of Funnel (Considering + Deciding) | Advertising, Email, CRO | [%] |
| Bottom of Funnel (Purchasing) | Email, Sales support | [%] |
| Post-Purchase (Onboarding → Advocating) | Email, Community, Events | [%] |

**Strategic rationale for this split:**
[FILL — e.g. "60% mid-funnel because lead generation is the primary constraint. Will rebalance to 40% TOF once lead volume target is achieved."]
