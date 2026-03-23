# 📥 {{COMPANY_NAME}} - Inbound Marketing Pipeline

**Dependencies:** MIR Core Strategy (`{{MIR_STRATEGY_FILE}}`), MIR Gate 1 required
**Assigned Agents:** `{{LEAD_AGENT}}` (mgsd-strategist, mgsd-content-creator, mgsd-seo-planner)
**Linear Project Manager:** `mgsd-linear-manager`

## Inbound Parameters
- **Primary Inbound Goal:** `{{INBOUND_GOAL}}` (e.g., 50 organic leads / month)
- **Content Cadence:** `{{CONTENT_CADENCE}}` (e.g., 2 SEO articles + 12 social posts / week)
- **CTA Destination:** `{{PRIMARY_CTA_URL}}`
- **Lead Magnet:** `{{LEAD_MAGNET_TITLE}}`

---

## 1. Inbound Foundation Setup

- [ ] Verify `Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md` has content pillar definitions.
- [ ] Verify `Campaigns_Assets/07_CONTENT/CONTENT-STRATEGY.md` has pillar ratio and format mix.
- [ ] Confirm `Core_Strategy/06_TECH-STACK/AUTOMATION.md` has lead capture form and CRM flow configured.
- [ ] Set up lead magnet in `Products/04_PRODUCTS/CATALOG.md` as entry offer.

## 2. SEO Foundation

- [ ] Run keyword research for primary ICP job-title intent queries (`{{TARGET_KEYWORDS_CLUSTER}}`).
- [ ] Produce keyword strategy using `mgsd-seo-planner`.
- [ ] Map keywords to content pillars (awareness / consideration / decision).
- [ ] Populate `MSP/Inbound/SEO/KEYWORD-STRATEGY.md` with ranked target list.
- [ ] Identify top 3 quick-win pages for on-page optimization.

## 3. Lead Magnet Pipeline

- [ ] Design lead magnet from `MGSD-ITM-CNT-01` (Lead Magnet template).
- [ ] Write lead magnet copy using `mgsd-content-creator` with VOICE-TONE constraints.
- [ ] Build lead capture page — spec in `MGSD-ITM-CNT-05` (Landing Page Copy).
- [ ] Configure automation: form submission → CRM entry → email sequence trigger.
- [ ] Track conversion: `{{LEAD_CAPTURE_EVENT}}` PostHog event fires on submit.

## 4. Content Calendar Execution

- [ ] Build monthly content calendar via `mgsd-calendar-builder`.
- [ ] Produce SEO article briefs for target keyword slots (use `MGSD-ITM-CNT-06`).
- [ ] Draft long-form articles using `mgsd-content-creator`.
- [ ] Human approves all articles before publication.
- [ ] Publish schedule: `{{PUBLISH_DAYS}}`. Track organic traffic in weekly reports.

## 5. Email Nurture Sequence

- [ ] Design welcome/nurture sequence (5-email minimum) using `MGSD-ITM-CNT-03`.
- [ ] Map each email to a funnel stage and B0N trigger (see `neuromarketing.md`).
- [ ] Configure sequence in `{{EMAIL_PLATFORM}}` automation linked to lead capture.
- [ ] A/B test subject lines on emails 1 and 3: `{{SUBJECT_LINE_A}}` vs `{{SUBJECT_LINE_B}}`.
- [ ] Track: open rate target `{{EMAIL_OPEN_RATE_TARGET}}`, click rate target `{{EMAIL_CTR_TARGET}}`.

## 6. CRO Foundation

- [ ] Identify top 2 conversion pages (home, demo/contact page).
- [ ] Generate CRO hypothesis via `mgsd-cro-hypothesis`: `{{CRO_HYPOTHESIS_01}}`.
- [ ] Human approves hypothesis before implementing change.
- [ ] Run test for minimum `{{AB_TEST_RUNTIME}}` days. Track CVR vs `{{CVR_TARGET}}`.

## 7. Inbound QA Loop

- [ ] Weekly: check top-5 inbound keywords for ranking movement.
- [ ] Weekly: check lead magnet download count vs. target `{{LEAD_MAGNET_TARGET}}`.
- [ ] Bi-weekly: email sequence open rates vs. target.
- [ ] Monthly: organic traffic vs. `{{ORGANIC_TRAFFIC_TARGET}}`. Report to `mgsd-analyst`.
