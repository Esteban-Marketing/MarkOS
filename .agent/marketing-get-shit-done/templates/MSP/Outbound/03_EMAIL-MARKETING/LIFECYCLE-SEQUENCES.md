# LIFECYCLE-SEQUENCES.md — Automated Email Sequences

<!-- mgsd-token: MSP -->
> [!NOTE] OVERRIDE PATH: Copy this file to .mgsd-local/MSP/Outbound/03_EMAIL-MARKETING/LIFECYCLE-SEQUENCES.md to customize it safely.


```
status      : empty
last_updated: YYYY-MM-DD
```

> Each sequence is a structured conversation with a specific person at a specific moment.
> Before writing any sequence, define: Who is this for? What do they believe now?
> What do we want them to believe / do at the end of this sequence?

---

## Sequence Index

| ID | Name | Trigger | Length | Goal | Status |
|----|------|---------|--------|------|--------|
| SEQ-01 | Welcome | New subscriber opt-in | 3 emails / 7 days | Build trust, deliver first value | [ACTIVE / DRAFT] |
| SEQ-02 | Lead Nurture | Post-welcome, pre-call | 7 emails / 14 days | Drive discovery call booking | [FILL] |
| SEQ-03 | Post-Call No-Show | Missed discovery call | 2 emails / 48h | Rebook the call | [FILL] |
| SEQ-04 | Client Onboarding | Contract signed (CRM stage change) | 4 emails / 14 days | First value moment, set expectations | [FILL] |
| SEQ-05 | Re-engagement | 90 days no open | 3 emails / 14 days | Re-activate or unsubscribe | [FILL] |
| SEQ-06 | Retention | Monthly — active clients | Ongoing | Proof, results, expansion | [FILL] |

---

## SEQ-01: Welcome Sequence

**Trigger:** New subscriber added to list (via n8n WF-001 or direct opt-in)
**Audience:** All new leads regardless of source
**Goal:** Orient the subscriber, deliver one piece of genuine value, establish voice

| Email # | Delay | Subject Line Direction | Content Purpose | CTA |
|---------|-------|----------------------|----------------|-----|
| 1 | Immediate | [Confirm + set expectations] | Welcome, what they'll get, who {{LEAD_AGENT}} is | [Low friction — consume a resource] |
| 2 | Day 3 | [One specific useful insight] | Teach something actionable. No pitch. | [Engage — reply or resource] |
| 3 | Day 7 | [Transition to offer] | Bridge from value to invitation | [Book a call or learn more] |

---

## SEQ-02: Lead Nurture Sequence

**Trigger:** Welcome sequence completed, no call booked
**Goal:** Address objections, build proof, convert to call booking

| Email # | Delay | Primary Objection Addressed | Proof Type | CTA |
|---------|-------|---------------------------|-----------|-----|
| 1 | Day 8 | [FILL] | [Case study / Testimonial] | [Book call] |
| 2 | Day 10 | [FILL] | [Process explanation] | [Book call] |
| 3 | Day 12 | [FILL] | [FAQ / Objection handler] | [Book call] |
| 4 | Day 14 | [FILL] | [Results data] | [Book call] |
| 5 | Day 17 | [FILL] | [Social proof] | [Book call] |
| 6 | Day 20 | [Urgency / Scarcity — only if real] | [FILL] | [Book call] |
| 7 | Day 25 | [Sunset warning] | [Final value] | [Book call or unsubscribe] |

---

## [Repeat structure for SEQ-03 through SEQ-06]
