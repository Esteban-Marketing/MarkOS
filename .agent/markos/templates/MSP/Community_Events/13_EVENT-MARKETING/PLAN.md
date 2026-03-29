# Event Marketing Plan

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Community_Events/13_EVENT-MARKETING/PLAN.md to customize it safely.


```
discipline    : Event Marketing
activation    : [ACTIVE | INACTIVE | FUTURE]
funnel_stages : Unaware → Aware + Considering → Deciding (high-intent touchpoints)
status        : empty
plan_period   : YYYY
budget        : $[FILL]
last_updated  : YYYY-MM-DD
```

> Events compress the trust timeline. A prospect who attends a live session where you demonstrate
> expertise moves from cold to warm in 60 minutes. Events also generate content (recordings),
> social proof (attendee testimonials), and backlinks (event listings).
> The ROI on events is highest when they are precisely targeted — not general brand awareness plays.

---

## Why This Discipline

[FILL — what role do events play here: lead generation via webinars, industry networking
via conference presence, client retention via exclusive workshops, or brand authority via speaking?
Which event format serves the ICP and the business stage best?]

---

## 1. Event Types

**Event formats this business will use:**

| Type | Format | Audience | Goal | Frequency |
|------|--------|---------|------|-----------|
| [e.g. Webinar] | [Online, 45–60 min] | [Prospects — ICP-1] | [Lead capture + nurture acceleration] | [Monthly] |
| [e.g. Workshop] | [Online, 90 min, interactive] | [Warm leads + clients] | [Conversion + upsell] | [Quarterly] |
| [e.g. Conference speaking] | [In-person, 20-30 min talk] | [Industry audience] | [Brand authority + leads] | [2–3/year] |
| [e.g. Virtual roundtable] | [Online, 8–12 people] | [High-value prospects] | [Relationship + pipeline] | [Quarterly] |
| [e.g. Client-only event] | [In-person or online] | [Active clients] | [Retention + expansion] | [Annual] |

---

## 2. Goals & KPIs

| KPI | Baseline | Annual Target | Source |
|-----|----------|--------------|--------|
| Event-attributed leads | 0 | [FILL] | PostHog utm_source=event |
| CPL via events | — | $[FILL] | Cost ÷ PostHog leads |
| Event registrations/year | 0 | [FILL] | Registration platform |
| Attendance rate | — | [FILL]% | Registrants ÷ attendees |
| Post-event conversion rate | — | [FILL]% | Leads ÷ attendees |
| Speaking engagements secured | 0 | [FILL] | Manual count |

---

## 3. Event Calendar

> Detail in `EVENT-CALENDAR.md`.

| Event Name | Type | Date | Platform/Venue | Target Audience | Budget | Status |
|-----------|------|------|----------------|----------------|--------|--------|
| [FILL] | [Webinar] | [YYYY-MM-DD] | [Zoom / StreamYard] | [ICP-1] | $[FILL] | [PLANNING / CONFIRMED] |

---

## 4. Webinar Strategy (if applicable)

**Webinar topic framework:**
[FILL — what topics drive registration from ICP-1? Specific how-to, case study reveal,
live audit, panel discussion, tool walkthrough?]

**Webinar structure:**
```
[5 min]   Welcome + credibility frame
[30 min]  Core content — teach one actionable thing
[10 min]  Case study or demo
[10 min]  Offer or CTA (workshop, discovery call, resource)
[10 min]  Q&A
```

**Post-webinar follow-up sequence:**

| Email | Timing | Subject | Purpose |
|-------|--------|---------|---------|
| 1 | +1h | Thank you + recording | Deliver value, re-engage no-shows |
| 2 | +24h | Key takeaway + resource | Nurture with related value |
| 3 | +3d | CTA email | Convert interested attendees |

---

## 5. Speaking Strategy (if applicable)

**Target speaking venues:**

| Venue / Conference | Audience | Deadline | Topic Proposed | Status |
|------------------|---------|---------|---------------|--------|
| [FILL] | [FILL] | [CFP date] | [FILL] | [PROSPECTING / APPLIED / CONFIRMED] |

**Speaker positioning:**
[FILL — what angle does {{LEAD_AGENT}} speak from? What is the talk that only he can give?
What is the outcome for the audience? What is the outcome for the business?]

---

## 6. Event Operations

> Standard procedures in `EVENT-PLAYBOOK.md`.

**Pre-event checklist:**
- [ ] Registration page live (Vibe code) with PostHog tracking
- [ ] Confirmation email and reminder sequence configured
- [ ] n8n webhook: registration → CRM → PostHog
- [ ] CAPI event: CompleteRegistration fires on signup
- [ ] UTM parameters on all promotion links
- [ ] Tech rehearsal completed (streaming / platform test)
- [ ] Slide deck reviewed and approved

**Post-event checklist:**
- [ ] Recording processed and uploaded
- [ ] Follow-up email sequence triggered
- [ ] Attendee list exported → CRM tagged as "attended-[event-name]"
- [ ] PostHog cohort updated
- [ ] Performance review: registration rate, attendance rate, conversion rate

---

## 7. Event Budget Detail

| Line Item | Per Event | Annual |
|-----------|----------|--------|
| Streaming / platform tools | $[FILL] | $[FILL] |
| Promotion (paid ads to event) | $[FILL] | $[FILL] |
| Speaker honorarium (if applicable) | $[FILL] | $[FILL] |
| Travel / venue (in-person only) | $[FILL] | $[FILL] |
| Design (event assets) | $[FILL] | $[FILL] |
| **TOTAL** | **$[FILL]** | **$[FILL]** |
