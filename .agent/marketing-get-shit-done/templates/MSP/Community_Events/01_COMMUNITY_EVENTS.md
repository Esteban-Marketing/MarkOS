# 🎪 {{COMPANY_NAME}} - Community & Events Pipeline

**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`), MIR Gate 1 required
**Assigned Agents:** `{{LEAD_AGENT}}` (mgsd-strategist, mgsd-content-creator, mgsd-calendar-builder)
**Linear Project Manager:** `mgsd-linear-manager`

## Community & Events Parameters
- **Primary Community Goal:** `{{COMMUNITY_GOAL}}` (e.g., build LinkedIn community of 500 engaged followers)
- **Event Type:** `{{EVENT_TYPE}}` (e.g., webinar / live demo / IRL meetup / partner event)
- **Target Attendees per Event:** `{{ATTENDEE_TARGET}}`
- **Community Platform:** `{{COMMUNITY_PLATFORM}}` (LinkedIn / Slack / Circle / Discord)
- **Event Cadence:** `{{EVENT_CADENCE}}` (e.g., monthly webinar)

---

## 1. Community Foundation

- [ ] Define community purpose statement: `{{COMMUNITY_PURPOSE}}` (one sentence — who it's for and what they get).
- [ ] Set up community platform: `{{COMMUNITY_PLATFORM}}` workspace/group.
- [ ] Create onboarding sequence for new members (3-messages: welcome → value → first ask).
- [ ] Configure community tracking event in `TRACKING.md`: `{{COMMUNITY_JOIN_EVENT}}`.
- [ ] Human approves community guidelines and onboarding messages before launch.

## 2. Community Content Calendar

- [ ] Define content categories for community: Education / Inspiration / Discussion / Promotion (80/10/5/5 ratio).
- [ ] Build monthly community content calendar via `mgsd-calendar-builder`.
- [ ] Weekly post cadence: `{{COMMUNITY_POST_CADENCE}}` posts per week.
- [ ] Engagement posts: 1x question / poll per week to drive interaction.
- [ ] Human reviews weekly batch of posts before scheduling.

## 3. Event Production — Webinar / Live

- [ ] Define event theme aligned to ICP-1 pain point from `AUDIENCES.md`: `{{EVENT_TOPIC}}`.
- [ ] Build event registration page copy using `MGSD-ITM-CNT-05` (Landing Page Copy template).
- [ ] Create promotional sequence: Announcement (3 weeks out) → Reminder (1 week) → Last chance (48h) → Day-of.
- [ ] Produce event script / slide deck using `mgsd-content-creator` with B07/B03 trigger mapping.
- [ ] Human approves: topic, registration page, promo sequence, and slide deck.
- [ ] Launch registration. Track sign-up rate vs. target: `{{SIGNUP_RATE_TARGET}}`.

## 4. Event Promotion

- [ ] Social promotion: 3 posts per week in 3-week run-up. Mix: benefit-framing / social proof / urgency.
- [ ] Email promotion to existing list: registration invite + 2 reminder emails.
- [ ] Community promotion: announce in `{{COMMUNITY_PLATFORM}}` with member-exclusive benefit.
- [ ] Partner co-promotion (if applicable): `{{PARTNER_ORGANIZATION}}` cross-promotes to their audience.
- [ ] Paid amplification (if Gate 2 GREEN): boost top-performing organic event post. Budget: `{{EVENT_AD_BUDGET}}`.

## 5. Event Execution

- [ ] Pre-event checklist (48h before):
  - [ ] Tech stack tested: `{{WEBINAR_PLATFORM}}` session, recording, Q&A
  - [ ] Slides reviewed and approved by human
  - [ ] Day-of reminder email queued
  - [ ] CRM integration live: attendee registration → lead tag
- [ ] Day-of: welcome frame + intro / content / Q&A / CTA (soft or hard per `{{EVENT_CTA}}`).
- [ ] Record event for replay asset (use in content library).

## 6. Post-Event Nurture

- [ ] Send post-event email sequence (3 emails): Thank you + replay → Key takeaway + next step → Hard CTA.
- [ ] Tag attendees in CRM: `event-attendee-{{EVENT_SLUG}}`.
- [ ] Non-attendees who registered: send replay email within 24h.
- [ ] Track: show-up rate vs. `{{SHOW_UP_RATE_TARGET}}`, post-event conversion rate vs. `{{POST_EVENT_CVR}}`.

## 7. Community Health QA Loop

- [ ] Weekly: community engagement rate (comments + reactions per post) vs. `{{ENGAGEMENT_RATE_TARGET}}`.
- [ ] Monthly: new member growth rate vs. `{{COMMUNITY_GROWTH_TARGET}}`.
- [ ] Per event: attendee count, show-up rate, NPS score (1-question post-event survey), leads generated.
- [ ] Quarterly: community review — prune inactive channels, add new content categories if needed.
- [ ] Report metrics to `mgsd-analyst` for KPI variance computation.
