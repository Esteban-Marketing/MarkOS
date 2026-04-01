---
token_id: MARKOS-IDX-001
document_class: index
domain: ops
version: "1.2.0"
status: active
upstream:
  - MARKOS-IDX-000
downstream:
  - MARKOS-AGT-OPS-07
mir_gate_required: none
---

# MARKOS-ITM Master Catalog — Linear Issue Templates

<!-- TOKEN: MARKOS-IDX-001 | CLASS: IDX | DOMAIN: OPS -->
<!-- PURPOSE: Registers all MARKOS-ITM task templates. Consumed by markos-linear-manager when resolving which template to use for a given task category. Updated whenever a new template is added or deprecated. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MARKOS-IDX-000 | MARKOS-INDEX.md | Root index — ITM class registered there |
| MARKOS-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema all templates conform to |
| MARKOS-AGT-OPS-07 | agents/markos-linear-manager.md | Primary consumer of this catalog |

---

## Template Registry

| TOKEN_ID | File | Category | Triggers | Gate | Status |
|----------|------|----------|----------|------|--------|
| MARKOS-ITM-CNT-01 | `LINEAR-TASKS/MARKOS-ITM-CNT-01-lead-magnet.md` | Content Creation | B04, B05, B07 | Gate 1 | active |
| MARKOS-ITM-CNT-02 | `LINEAR-TASKS/MARKOS-ITM-CNT-02-ad-copy.md` | Ad Copywriting | B02, B05, B06, B09 | Gate 1 + Gate 2 | active |
| MARKOS-ITM-CNT-03 | `LINEAR-TASKS/MARKOS-ITM-CNT-03-email-sequence.md` | Email Sequence | B01, B02, B03, B07 | Gate 1 | active |
| MARKOS-ITM-STR-01 | `LINEAR-TASKS/MARKOS-ITM-STR-01-audience-research.md` | Audience Research | B08 | none | active |
| MARKOS-ITM-STR-02 | `LINEAR-TASKS/MARKOS-ITM-STR-02-funnel-architecture.md` | Funnel Build | B02, B05, B06, B09 | Gate 1 + Gate 2 | active |
| MARKOS-ITM-TRK-01 | `LINEAR-TASKS/MARKOS-ITM-TRK-01-utm-tracking.md` | Tracking & UTM Setup | N/A | Gate 2 | active |
| MARKOS-ITM-ANA-01 | `LINEAR-TASKS/MARKOS-ITM-ANA-01-performance-review.md` | Campaign Analytics | Diagnostic | Gate 2 | active |
| MARKOS-ITM-OPS-01 | `LINEAR-TASKS/MARKOS-ITM-OPS-01-campaign-launch.md` | Campaign Ops | N/A | Gate 1 + Gate 2 | active |
| MARKOS-ITM-CNT-04 | `LINEAR-TASKS/MARKOS-ITM-CNT-04-social-calendar.md` | Content Creation | B01, B03, B07, B08 | Gate 1 | active |
| MARKOS-ITM-CNT-05 | `LINEAR-TASKS/MARKOS-ITM-CNT-05-landing-page-copy.md` | Content Creation | B02, B03, B04, B05, B06, B09 | Gate 1 | active |
| MARKOS-ITM-CNT-06 | `LINEAR-TASKS/MARKOS-ITM-CNT-06-seo-article.md` | Content Creation | B04, B05, B07, B08 | Gate 1 | active |
| MARKOS-ITM-CNT-07 | `LINEAR-TASKS/MARKOS-ITM-CNT-07-case-study.md` | Content Creation | B03, B04, B05, B07 | Gate 1 | active |
| MARKOS-ITM-CNT-08 | `LINEAR-TASKS/MARKOS-ITM-CNT-08-video-script.md` | Content Creation | B02, B03, B05, B07, B10 | Gate 1 | active |
| MARKOS-ITM-ACQ-01 | `LINEAR-TASKS/MARKOS-ITM-ACQ-01-paid-social-setup.md` | Acquisition | B02, B03, B05, B06, B09 | Gate 1 + Gate 2 | active |
| MARKOS-ITM-ACQ-02 | `LINEAR-TASKS/MARKOS-ITM-ACQ-02-retargeting-setup.md` | Acquisition | B02, B03, B06, B09 | Gate 2 | active |
| MARKOS-ITM-ACQ-03 | `LINEAR-TASKS/MARKOS-ITM-ACQ-03-linkedin-outbound.md` | Acquisition | B03, B05, B07, B08 | Gate 1 | active |
| MARKOS-ITM-ACQ-04 | `LINEAR-TASKS/MARKOS-ITM-ACQ-04-affiliate-influencer.md` | Acquisition — Affiliate/Influencer | B03, B05 | Gate 1 + legal | active |
| MARKOS-ITM-COM-01 | `LINEAR-TASKS/MARKOS-ITM-COM-01-community-event.md` | Community & Events | B07 | Gate 1 | active |
| MARKOS-ITM-OPS-03 | `LINEAR-TASKS/MARKOS-ITM-OPS-03.md` | Intake Ops | R001-R008 | none | active |
| MARKOS-ITM-INT-01 | `LINEAR-TASKS/MARKOS-ITM-INT-01.md` | Intake Validation | R001-R008 | none | active |
| MARKOS-ITM-OPS-02 | `LINEAR-TASKS/MARKOS-ITM-ANA-02-ab-test.md` | Campaign Ops — Lifecycle Automation | B01, B02 | Gate 2 | active |
| MARKOS-ITM-ANA-02 | `LINEAR-TASKS/MARKOS-ITM-ANA-02-ab-test-config.md` | Campaign Analytics — A/B Test | B08, B09 | Gate 2 | active |

---

## Next Available SEQ by Domain

| Domain | Last Used SEQ | Next Available |
|--------|--------------|----------------|
| CNT | 08 | 09 |
| STR | 02 | 03 |
| TRK | 01 | 02 |
| ANA | 02 | 03 |
| OPS | 02 | 03 |
| ACQ | 04 | 05 |
| COM | 01 | 02 |

---

## Linear Title Formats

| TOKEN_ID | Linear Title Format |
|----------|-------------------|
| MARKOS-ITM-CNT-01 | `[MARKOS] Lead Magnet: {magnet_title} — {audience_segment}` |
| MARKOS-ITM-CNT-02 | `[MARKOS] Ad Copy: {platform} — {campaign_name} — {variant_id}` |
| MARKOS-ITM-CNT-03 | `[MARKOS] Email Sequence: {sequence_name} — {trigger_event} — {N}-email` |
| MARKOS-ITM-CNT-04 | `[MARKOS] Social Calendar: {channel} — {month}-{year}` |
| MARKOS-ITM-CNT-05 | `[MARKOS] Landing Page Copy: {offer_name} — {funnel_stage}` |
| MARKOS-ITM-CNT-06 | `[MARKOS] SEO Article: {primary_keyword} — {target_funnel_stage}` |
| MARKOS-ITM-CNT-07 | `[MARKOS] Case Study: {customer_name} — {outcome_metric}` |
| MARKOS-ITM-CNT-08 | `[MARKOS] Video Script: {format} — {offer_or_topic} — {duration}s` |
| MARKOS-ITM-STR-01 | `[MARKOS] Audience Intel: {segment_name} — {month}-{year}` |
| MARKOS-ITM-STR-02 | `[MARKOS] Funnel Build: {campaign_name} — {funnel_type}` |
| MARKOS-ITM-TRK-01 | `[MARKOS] Tracking Setup: {campaign_name} — {platform}` |
| MARKOS-ITM-ANA-01 | `[MARKOS] Performance Review: {campaign_name} — {period}` |
| MARKOS-ITM-OPS-01 | `[MARKOS] Launch: {campaign_name} — Go/No-Go` |
| MARKOS-ITM-ACQ-01 | `[MARKOS] Paid Social Setup: {platform} — {campaign_name} — {objective}` |
| MARKOS-ITM-ACQ-02 | `[MARKOS] Retargeting: {platform} — {audience_segment} — {campaign_name}` |
| MARKOS-ITM-ACQ-03 | `[MARKOS] LinkedIn Outbound: {segment_name} — {sequence_name} — {N}-touch` |
| MARKOS-ITM-ACQ-04 | `[MARKOS] Influencer Activation: {creator_name} — {platform} — {campaign_name}` |
| MARKOS-ITM-COM-01 | `[MARKOS] Community Event: {event_name} — {date}` |
| MARKOS-ITM-OPS-03 | `[MARKOS] Intake: {client_name} — {company_stage}` |
| MARKOS-ITM-INT-01 | `[MARKOS] Intake Validation: {client_name} — Data Quality Check` |
| MARKOS-ITM-OPS-02 | `[MARKOS] Lifecycle Automation: {sequence_name} — {trigger_event}` |
| MARKOS-ITM-ANA-02 | `[MARKOS] A/B Test: {element_tested} — {page_or_channel} — {hypothesis_slug}` |

---

## Deprecated Templates

| TOKEN_ID | File | Deprecated | Reason | Superseded By |
|----------|------|-----------|--------|---------------|
| _(none)_ | — | — | — | — |
