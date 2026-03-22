---
token_id: MGSD-IDX-001
document_class: index
domain: ops
version: "1.2.0"
status: active
upstream:
  - MGSD-IDX-000
downstream:
  - MGSD-AGT-OPS-07
mir_gate_required: none
---

# MGSD-ITM Master Catalog — Linear Issue Templates

<!-- TOKEN: MGSD-IDX-001 | CLASS: IDX | DOMAIN: OPS -->
<!-- PURPOSE: Registers all MGSD-ITM task templates. Consumed by mgsd-linear-manager when resolving which template to use for a given task category. Updated whenever a new template is added or deprecated. -->

## See Also

| TOKEN_ID | File | Relationship |
|----------|------|--------------|
| MGSD-IDX-000 | MGSD-INDEX.md | Root index — ITM class registered there |
| MGSD-TPL-OPS-16 | templates/LINEAR-TASKS/_SCHEMA.md | Schema all templates conform to |
| MGSD-AGT-OPS-07 | agents/mgsd-linear-manager.md | Primary consumer of this catalog |

---

## Template Registry

| TOKEN_ID | File | Category | Triggers | Gate | Status |
|----------|------|----------|----------|------|--------|
| MGSD-ITM-CNT-01 | `LINEAR-TASKS/MGSD-ITM-CNT-01-lead-magnet.md` | Content Creation | B04, B05, B07 | Gate 1 | active |
| MGSD-ITM-CNT-02 | `LINEAR-TASKS/MGSD-ITM-CNT-02-ad-copy.md` | Ad Copywriting | B02, B05, B06, B09 | Gate 1 + Gate 2 | active |
| MGSD-ITM-CNT-03 | `LINEAR-TASKS/MGSD-ITM-CNT-03-email-sequence.md` | Email Sequence | B01, B02, B03, B07 | Gate 1 | active |
| MGSD-ITM-STR-01 | `LINEAR-TASKS/MGSD-ITM-STR-01-audience-research.md` | Audience Research | B08 | none | active |
| MGSD-ITM-STR-02 | `LINEAR-TASKS/MGSD-ITM-STR-02-funnel-architecture.md` | Funnel Build | B02, B05, B06, B09 | Gate 1 + Gate 2 | active |
| MGSD-ITM-TRK-01 | `LINEAR-TASKS/MGSD-ITM-TRK-01-utm-tracking.md` | Tracking & UTM Setup | N/A | Gate 2 | active |
| MGSD-ITM-ANA-01 | `LINEAR-TASKS/MGSD-ITM-ANA-01-performance-review.md` | Campaign Analytics | Diagnostic | Gate 2 | active |
| MGSD-ITM-OPS-01 | `LINEAR-TASKS/MGSD-ITM-OPS-01-campaign-launch.md` | Campaign Ops | N/A | Gate 1 + Gate 2 | active |
| MGSD-ITM-CNT-04 | `LINEAR-TASKS/MGSD-ITM-CNT-04-social-calendar.md` | Content Creation | B01, B03, B07, B08 | Gate 1 | active |
| MGSD-ITM-CNT-05 | `LINEAR-TASKS/MGSD-ITM-CNT-05-landing-page-copy.md` | Content Creation | B02, B03, B04, B05, B06, B09 | Gate 1 | active |
| MGSD-ITM-CNT-06 | `LINEAR-TASKS/MGSD-ITM-CNT-06-seo-article.md` | Content Creation | B04, B05, B07, B08 | Gate 1 | active |
| MGSD-ITM-CNT-07 | `LINEAR-TASKS/MGSD-ITM-CNT-07-case-study.md` | Content Creation | B03, B04, B05, B07 | Gate 1 | active |
| MGSD-ITM-CNT-08 | `LINEAR-TASKS/MGSD-ITM-CNT-08-video-script.md` | Content Creation | B02, B03, B05, B07, B10 | Gate 1 | active |
| MGSD-ITM-ACQ-01 | `LINEAR-TASKS/MGSD-ITM-ACQ-01-paid-social-setup.md` | Acquisition | B02, B03, B05, B06, B09 | Gate 1 + Gate 2 | active |
| MGSD-ITM-ACQ-02 | `LINEAR-TASKS/MGSD-ITM-ACQ-02-retargeting-setup.md` | Acquisition | B02, B03, B06, B09 | Gate 2 | active |
| MGSD-ITM-ACQ-03 | `LINEAR-TASKS/MGSD-ITM-ACQ-03-linkedin-outbound.md` | Acquisition | B03, B05, B07, B08 | Gate 1 | active |

---

## Next Available SEQ by Domain

| Domain | Last Used SEQ | Next Available |
|--------|--------------|----------------|
| CNT | 08 | 09 |
| STR | 02 | 03 |
| TRK | 01 | 02 |
| ANA | 01 | 02 |
| OPS | 01 | 02 |
| ACQ | 03 | 04 |

---

## Linear Title Formats

| TOKEN_ID | Linear Title Format |
|----------|-------------------|
| MGSD-ITM-CNT-01 | `[MGSD] Lead Magnet: {magnet_title} — {audience_segment}` |
| MGSD-ITM-CNT-02 | `[MGSD] Ad Copy: {platform} — {campaign_name} — {variant_id}` |
| MGSD-ITM-CNT-03 | `[MGSD] Email Sequence: {sequence_name} — {trigger_event} — {N}-email` |
| MGSD-ITM-CNT-04 | `[MGSD] Social Calendar: {channel} — {month}-{year}` |
| MGSD-ITM-CNT-05 | `[MGSD] Landing Page Copy: {offer_name} — {funnel_stage}` |
| MGSD-ITM-CNT-06 | `[MGSD] SEO Article: {primary_keyword} — {target_funnel_stage}` |
| MGSD-ITM-CNT-07 | `[MGSD] Case Study: {customer_name} — {outcome_metric}` |
| MGSD-ITM-CNT-08 | `[MGSD] Video Script: {format} — {offer_or_topic} — {duration}s` |
| MGSD-ITM-STR-01 | `[MGSD] Audience Intel: {segment_name} — {month}-{year}` |
| MGSD-ITM-STR-02 | `[MGSD] Funnel Build: {campaign_name} — {funnel_type}` |
| MGSD-ITM-TRK-01 | `[MGSD] Tracking Setup: {campaign_name} — {platform}` |
| MGSD-ITM-ANA-01 | `[MGSD] Performance Review: {campaign_name} — {period}` |
| MGSD-ITM-OPS-01 | `[MGSD] Launch: {campaign_name} — Go/No-Go` |
| MGSD-ITM-ACQ-01 | `[MGSD] Paid Social Setup: {platform} — {campaign_name} — {objective}` |
| MGSD-ITM-ACQ-02 | `[MGSD] Retargeting: {platform} — {audience_segment} — {campaign_name}` |
| MGSD-ITM-ACQ-03 | `[MGSD] LinkedIn Outbound: {segment_name} — {sequence_name} — {N}-touch` |

---

## Deprecated Templates

| TOKEN_ID | File | Deprecated | Reason | Superseded By |
|----------|------|-----------|--------|---------------|
| _(none)_ | — | — | — | — |
