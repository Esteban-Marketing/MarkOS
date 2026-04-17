---
date: 2026-04-16
description: "Fillable <neuro_spec> XML block for campaign plans."
tags:
  - literacy
  - template
  - neuro
---

# Neuro Spec Template

> The `<neuro_spec>` block every campaign plan attaches. Validated by the Neuro Auditor (`MARKOS-AGT-NEU-01`). Canonical trigger catalog: [[Neuro Audit Canon]].

## Schema

```xml
<neuro_spec>
  <funnel_stage>awareness|interest|consideration|decision|retention|advocacy</funnel_stage>
  <primary_trigger code="B04" justification="..."/>
  <secondary_trigger code="B03" justification="..."/>
  <pre_conditions>
    <condition>...</condition>
  </pre_conditions>
  <anti_patterns_avoided>
    <pattern>fake scarcity</pattern>
    <pattern>authority bluff</pattern>
  </anti_patterns_avoided>
  <evidence_of_activation>
    <phrase>...</phrase>
  </evidence_of_activation>
</neuro_spec>
```

## Example (re-engagement email for trial lapsers)

```xml
<neuro_spec>
  <funnel_stage>retention</funnel_stage>
  <primary_trigger code="B02" justification="phantom ownership: 'your workspace is still here, untouched'"/>
  <secondary_trigger code="B04" justification="authority: product-team insight on reactivation rates"/>
  <pre_conditions>
    <condition>user created workspace during trial</condition>
  </pre_conditions>
  <anti_patterns_avoided>
    <pattern>fake scarcity</pattern>
    <pattern>guilt-trip opt-in</pattern>
  </anti_patterns_avoided>
  <evidence_of_activation>
    <phrase>your workspace is still here</phrase>
    <phrase>most teams reactivate within 72 hours</phrase>
  </evidence_of_activation>
</neuro_spec>
```

## Validation rules

1. `primary_trigger` must be in funnel-stage recommended set ([[Neuro Audit Canon]]).
2. `pre_conditions` verified against prior touch history.
3. `anti_patterns_avoided` explicitly listed — auditor checks draft for these.
4. `evidence_of_activation` phrases must appear in the draft copy.

## Related

- [[Neuro Audit Canon]] · [[Message Crafting Pipeline]] · [[MarkOS Canon]] · [[Agent Registry]]
