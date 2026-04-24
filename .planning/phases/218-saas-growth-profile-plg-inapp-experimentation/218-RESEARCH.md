# Phase 218 Research - SaaS Growth Profile, PLG, In-App, and Experimentation

## Primary research question

How should MarkOS translate SaaS mode routing, PLG, in-app campaigns, and experimentation into governed product objects without bypassing Pricing Engine, approvals, evidence, or learning controls?

## Current-code support

- Phase 216 plans product usage, health, support, and PLG signal handoff.
- Phase 217 plans SaaS revenue metrics, APIs, MCP, UI, and SAS agent readiness.
- Existing CRM reporting, attribution, task, approval, and evidence foundations can support growth signals once prior phases land.

## Gaps to solve

- No `SaaSGrowthProfile`, `ActivationDefinition`, `PQLScore`, `UpgradeTrigger`, `InAppCampaign`, or `MarketingExperiment` model exists.
- No mode-based module routing exists.
- No in-app campaign suppression/frequency/approval contract exists.
- No experiment registry or growth decision record exists.

## Tests implied

- Mode routing tests for B2B, B2C, PLG B2B, PLG B2C, and B2B2C.
- PQL/activation tests with explainable inputs.
- In-app suppression and approval tests.
- Experiment guardrail, decision, and learning handoff tests.
