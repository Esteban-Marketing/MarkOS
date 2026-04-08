# Phase 64: Attribution, Reporting, and Verification Closure - Research

**Researched:** 2026-04-04
**Domain:** CRM-native weighted attribution, unified reporting cockpit, readiness and verification evidence, and controlled cross-tenant reporting rollups
**Confidence:** HIGH (recommendations are grounded in the locked decisions in `64-CONTEXT.md`, the Phase 58 CRM activity model, the Phase 59 tracking and identity-stitching recommendations, the Phase 60/61 workspace and execution-shell direction, the Phase 62 outbound history posture, and the current absence of real CRM reporting or attribution surfaces in the repo beyond billing-style evidence shells)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. Phase 64 must close the milestone for all reporting audiences in the first pass

The first pass must serve frontline operators, managers or team leads, tenant admins, controlled central operators, and executive readouts.

Implementation guidance:
- Do not optimize the phase only for power operators or only for executive summaries.
- Keep one shared reporting truth model with role-aware simplification, not separate products for each audience.
- Preserve tenant safety and explicit oversight boundaries in every reporting surface.

### 2. The reporting shell must cover the full closeout set

The first pass must include pipeline health and conversion, attribution views, SLA and risk reporting, agent productivity reporting, and milestone verification evidence.

Implementation guidance:
- Do not scope Phase 64 down to attribution alone.
- Do not ship isolated widgets that never become a coherent reporting cockpit.
- Treat product-facing views and closeout evidence as part of the same phase contract.

### 3. Attribution must be deeper than directional reporting but remain deterministic

The first pass should use weighted multi-touch attribution with fixed heuristic weights rather than stage-varying or highly adaptive modeling.

Implementation guidance:
- Keep weights explicit and inspectable.
- Ground attribution on canonical CRM activity and tracked campaign-touch history.
- Do not drift into MMM or opaque model-driven attribution in this phase.

### 4. Executive readouts must stay inside the CRM shell

The first pass must not create a detached analytics product or separate reporting brand.

Implementation guidance:
- Reuse the same reporting shell with simplified role-aware summaries.
- Keep drill-down paths connected to the same canonical record and evidence model.
- Avoid presentation divergence that creates multiple truths.

### 5. Cross-tenant reporting is allowed only through controlled central-operator rollups

Central operators may have cross-tenant reporting visibility, but deeper inspection stays governed.

Implementation guidance:
- Keep central rollups explicit and bounded.
- Preserve clear tenant attribution and approval-aware drill-down boundaries.
- Do not silently widen tenant-admin reporting into cross-tenant power.

### 6. Verification closure is a required product outcome of this phase

Phase 64 must produce operator-facing validation views, direct acceptance evidence artifacts, a live verification workflow, and backoffice readiness reporting.

Implementation guidance:
- Do not treat milestone closeout as only an internal document exercise.
- Preserve a live-check path and explicit evidence capture templates.
- Keep readiness and completeness reporting visible enough to support human verification.

### 7. MMM and a custom BI builder are deferred seeds, not removed ideas

The user wants both concepts preserved for future milestone or phase discussion.

Implementation guidance:
- Mark them explicitly as deferred follow-ons.
- Do not let them expand the first-pass implementation scope.
- Keep the Phase 64 architecture extensible enough that those later ideas are not blocked.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ATT-01 | Multi-touch attribution is operationally available at the CRM layer for contact, deal, and campaign reporting, even though full MMM remains deferred. | Recommends a deterministic fixed-weight multi-touch model grounded in CRM activity families, campaign-touch evidence, identity stitching lineage, and object-linked revenue contribution views inside the CRM. |
| REP-01 | Operators can view pipeline health, conversion, attribution, SLA risk, and agent productivity in one place without leaving the CRM. | Recommends a unified CRM-native reporting shell with operator, manager, tenant-admin, central-operator, and executive summary layers backed by one canonical reporting truth model plus readiness and evidence rails. |

</phase_requirements>

## Project Constraints (from repo state and current implementation)

- `.planning/STATE.md`, `.planning/ROADMAP.md`, and the phase artifacts remain the authoritative planning sources.
- `lib/markos/crm/timeline.ts` already reserves `web_activity`, `campaign_touch`, `agent_event`, `outbound_event`, and `attribution_update`, which means the CRM timeline vocabulary is already prepared to carry attribution inputs and attribution-state change evidence.
- `lib/markos/crm/identity.ts` already ships deterministic identity confidence scoring with explicit fixed thresholds for `accepted`, `review`, and `rejected`, which is a strong precedent for Phase 64’s fixed-weight attribution posture.
- Phase 59 research already locked a first-party tracking and enrichment model where campaign touches and stitched history become CRM-readable evidence rather than reporting-only analytics.
- Phase 60 research already defined the CRM workspace as the shell for detail, timeline, calendar, and simple funnel views, but the actual product routes are still mostly placeholders.
- Phase 61 research already defined REP-01 as an execution-hub complement, but the actual reporting cockpit has not yet been built.
- Phase 62 research already positioned outbound activity and reply/delivery history as CRM-visible evidence inputs, which Phase 64 should consume as attribution and productivity inputs.
- Phase 63 research already positioned copilot and playbook actions as durable `agent_event`/CRM audit evidence, which means productivity and AI-audit reporting should read those records instead of inventing separate telemetry truth.
- `app/(markos)/page.tsx` is still a simple scaffold rather than a real reporting dashboard, confirming the reporting-shell gap is real.
- `app/(markos)/settings/billing/page-shell.tsx`, `app/(markos)/admin/billing/page.tsx`, `api/billing/tenant-summary.js`, and `api/billing/operator-reconciliation.js` already demonstrate an evidence-first reporting pattern with translated operator language, left or center or evidence-rail layout, and tenant/admin reporting splits that Phase 64 can reuse.
- `api/governance/evidence.js` and the live-check artifacts under `.planning/milestones/v3.1.0-*` already provide proven closeout-evidence and human verification patterns that Phase 64 should extend rather than recreate.
- `lib/markos/telemetry/events.ts` still lacks Phase 64 reporting and attribution-specific telemetry names, which means dashboard usage, attribution inspection, and live-verification interactions are not yet captured canonically.
- Search across `app/**`, `api/**`, and `lib/markos/**` shows no existing CRM-native attribution model, reporting cockpit route family, or operator-facing revenue reporting APIs yet.

## Summary

Phase 64 should be implemented as a **CRM-native reporting and milestone-closeout layer that unifies attribution, operational reporting, readiness visibility, and acceptance evidence inside the MarkOS shell**, not as a detached analytics studio and not as a placeholder dashboard plus a few verification docs. The repo already has the right substrate to support this cleanly: canonical CRM activity families, first-party tracking and identity guidance from Phase 59, workspace and execution-shell direction from Phases 60 and 61, outbound and agent-event history from Phases 62 and 63, and evidence-first admin reporting precedents from the billing and governance surfaces.

The strongest implementation path is:

1. Define a fixed-weight multi-touch attribution model over canonical CRM activities, stitched identity links, campaign touches, and downstream revenue objects.
2. Build one CRM-native reporting shell that exposes pipeline health, conversion, attribution, SLA risk, and agent productivity for multiple roles using the same truth layer.
3. Reuse evidence-rail and translated-language patterns from the billing/admin surfaces so reporting stays operator-readable and audit-ready.
4. Add readiness and completeness reporting for attribution inputs, stitching quality, and reporting freshness rather than assuming the data is healthy.
5. Close the phase with a direct validation ledger, live-check workflow, and milestone-closeout artifact set rather than deferring verification to a separate effort.

This phase is therefore an **attribution-model + reporting-shell + readiness-signal + closeout-evidence** problem. It is not a full MMM phase, not a custom BI-builder phase, and not a new AI-reporting phase.

## Competitive Landscape

Phase 64 is not competing on generic dashboards. It is competing on whether MarkOS can make CRM-native reporting legible, attributable, and verification-ready without pushing operators into another tool.

### Product-pattern comparison

| Pattern | What it gets right | What MarkOS should take | What MarkOS should avoid |
|--------|---------------------|--------------------------|---------------------------|
| HubSpot-style revenue reporting | CRM-tied attribution and practical pipeline reporting | Contact, deal, and campaign attribution views inside the same CRM object model | Black-box influence math or attribution that cannot be tied back to visible timeline evidence |
| Salesforce-style RevOps dashboards | Cross-role reporting depth and executive rollups | Role-aware reporting layers and object-linked drill-downs | Enterprise dashboard sprawl and admin complexity that overwhelms first-pass closeout |
| Attio-style modern CRM analytics | Clean, record-adjacent insight layers | Reporting that feels attached to live CRM records rather than exported data marts | Elegant surfaces with weak audit or readiness evidence underneath |
| Gainsight or CS cockpit reporting | SLA, health, and customer-risk reporting | Risk and health views that complement revenue reporting without leaving the CRM | Post-sale dashboards detached from canonical activity and task evidence |
| BI tools like Looker or Metabase | Flexible metrics and arbitrary slicing | Future extensibility mindset for later deferred BI work | Opening Phase 64 into an open-ended analytics studio or custom report builder |

### Strategic conclusion

MarkOS should position Phase 64 as:

- **More CRM-native than separate BI dashboards**
- **More evidence-linked than opaque attribution tools**
- **More operational than executive-only scorecards**
- **More closeout-ready than placeholder reporting tabs**

The winning design is a **single CRM reporting shell with fixed-weight attribution, role-aware summaries, readiness evidence, and direct verification artifacts**.

## Audience Intelligence

The immediate audience for Phase 64 is every role that needs to trust the milestone is operationally complete, not just every role that wants another dashboard.

### Primary operator needs

1. See pipeline health, conversion, SLA risk, and productivity without assembling data manually.
2. Understand where revenue contribution and campaign influence came from using CRM-visible evidence.
3. Trust the numbers because attribution inputs, identity links, and reporting freshness are visible and explainable.
4. Review role-appropriate summaries without losing access to drill-down evidence.
5. Complete live checks and milestone-closeout verification with explicit evidence capture.

### Secondary implementation audience

1. Phase 64 planners who need decomposition into attribution, reporting APIs, cockpit routes, readiness surfaces, and validation work.
2. UI implementers who need to know which reporting and evidence patterns already exist in the repo.
3. Future milestone designers who may later revisit MMM or BI-builder scope and need a clean foundation rather than a dead-end phase artifact.

### Audience implications for research

- Reporting must optimize for **truth visibility and role clarity**, not dashboard density.
- Attribution must optimize for **inspectability and stable heuristics**, not model sophistication.
- Verification must optimize for **repeatable evidence capture**, not one-off milestone ceremony.
- Cross-tenant reporting must optimize for **governed oversight**, not broad admin convenience.

## Channel Benchmarks

These are planning heuristics for a first-pass CRM-native reporting and attribution closeout layer. They are validation targets for Phase 64, not claims about current production behavior.

| Metric | Industry Avg | Target |
|--------|--------------|--------|
| Weighted attribution coverage for eligible revenue records | Often partial in early CRM analytics rollouts | >=90% of eligible contact/deal/campaign records show fixed-weight attribution evidence |
| Attribution evidence traceability | Frequently opaque outside enterprise systems | 100% of reported attribution paths link back to CRM-visible touch or activity evidence |
| Reporting freshness for cockpit summaries | 15-60 min common in CRM analytics | <=5 min under healthy runtime conditions for core operational metrics |
| Pipeline health and conversion visibility | Often split across board views and reports | 100% of required pipeline health and conversion metrics accessible inside one CRM shell |
| SLA/risk reporting completeness | Often partial outside CS-specific tools | >=95% of in-scope records surface SLA/risk state when required inputs exist |
| Agent productivity visibility | Commonly fragmented between tasks and AI logs | 100% of in-scope productivity metrics derive from canonical task, agent-event, and outbound evidence |
| Readiness/data-completeness visibility | Frequently hidden from operators | 100% of attribution/reporting dashboards expose readiness or completeness state when inputs are degraded |
| Live verification artifact completeness | Often ad hoc and manual | 100% of required live checks mapped to explicit checklist/log fields and closeout artifacts |

### Benchmark interpretation

- Coverage matters because ATT-01 is not satisfied by a single influence widget.
- Traceability matters because the product is closing a milestone, not just launching a dashboard MVP.
- Freshness matters because operational reporting loses trust quickly when it lags behind the execution and outbound surfaces.
- Readiness visibility matters because operators need to distinguish bad data from bad performance.

## Recommended Approach

### 1. Define a deterministic fixed-weight multi-touch attribution model over canonical CRM evidence

Phase 64 should treat Phase 59 tracking and identity guidance as the core attribution substrate rather than inventing a separate analytics pipeline.

Recommended outcome:

- define an attribution ledger or derived-attribution model that reads `campaign_touch`, `web_activity`, `outbound_event`, and accepted identity-link lineage
- keep fixed heuristic weights explicit and queryable rather than hidden in code-only math
- tie attribution outcomes to contact, deal, and campaign views with visible influence and revenue-contribution fields
- write material attribution recalculations back as `attribution_update` evidence where appropriate so the CRM timeline can explain changes

### 2. Build one unified CRM-native reporting shell instead of scattered route-local reports

The current dashboard is still a scaffold, so Phase 64 should intentionally create the reporting shell rather than incrementally patch placeholders.

Recommended outcome:

- add a dedicated CRM reporting route family inside the existing MarkOS shell
- provide shared filters, time range, audience scope, and object or pipeline selectors across pipeline health, conversion, attribution, SLA risk, and productivity views
- keep tenant reporting, executive readouts, and central rollups on one truth layer with role-aware presentation differences only
- preserve drill-down paths back to records, timelines, queues, and evidence details

### 3. Reuse the billing evidence-rail pattern for reporting and verification detail

The billing pages already prove the repo has a strong evidence-first UI grammar for translated operator language plus secondary raw lineage.

Recommended outcome:

- use left-side summary/navigation, center metric or table detail, and right-side evidence or readiness rail where useful
- present operator-friendly labels first while keeping lineage, raw evidence refs, and touch attribution details available in secondary panels
- make milestone-closeout evidence visible inside the same reporting shell rather than only in markdown files

### 4. Add readiness and data-completeness reporting as first-class reporting dependencies

Phase 64 should not assume attribution is valid whenever a chart can render.

Recommended outcome:

- expose readiness metrics for tracked traffic coverage, identity-stitch completeness, outbound telemetry return rates, recommendation or agent-event availability, and reporting freshness
- show degraded-state messaging when attribution coverage is partial or confidence is weak
- reuse prior readiness-reporting patterns from literacy and billing surfaces where possible

### 5. Build productivity and risk reporting from canonical execution evidence, not new shadow metrics

Productivity and SLA views should aggregate what earlier phases already formalized.

Recommended outcome:

- derive productivity from `crm_tasks`, `agent_event` activity, recommendation follow-through, approval outcomes, and outbound execution artifacts
- derive SLA/risk from canonical record state, open tasks, inactivity/stall signals, and risk signals already defined in the execution and copilot phases
- avoid a second metrics store that diverges from CRM and activity truth

### 6. Keep cross-tenant reporting tightly bounded to central-operator rollups

The user wants cross-tenant visibility, but not a broad new admin control tower.

Recommended outcome:

- central operators can see aggregate rollups across tenants and request governed drill-downs where needed
- tenant admins remain tenant-scoped even if the reporting shell is structurally similar
- preserve explicit tenant labeling, role checks, and approval-aware deeper inspection boundaries

### 7. Close the phase with a direct verification package, not only working UI routes

Phase 64 owns milestone closure and must produce the artifact set to prove it.

Recommended outcome:

- add a direct Phase 64 validation ledger for ATT-01 and REP-01
- add a live-check checklist and execution log modeled on the existing milestone live-check artifacts
- include milestone-closeout summaries or closure-package references that promote the reporting and verification evidence into canonical planning state

## Platform Capabilities and Constraints

### Existing capabilities to build on

1. **CRM activity families already support attribution evidence.** `timeline.ts` already recognizes `campaign_touch`, `web_activity`, and `attribution_update`.
2. **Identity scoring is already deterministic.** `scoreIdentityCandidate()` already uses explicit fixed confidence increments and threshold semantics.
3. **Tenant-safe CRM routes already exist.** CRM APIs already enforce tenant context and can serve as the right base for reporting inputs.
4. **Evidence-first reporting precedent already exists.** Billing surfaces and endpoints already translate ledger evidence into operator-readable summaries with admin drill-down.
5. **Governance evidence packaging already exists.** `api/governance/evidence.js` proves the repo already supports evidence-pack style closeout endpoints.
6. **Live verification templates already exist.** `.planning/milestones/v3.1.0-LIVE-CHECKLIST.md` and `.planning/milestones/v3.1.0-LIVE-CHECK-LOG-TEMPLATE.md` provide a proven manual-check structure.

### Current capability gaps Phase 64 must close

1. **No CRM-native attribution model exists yet.** The activity vocabulary is ready, but no weighted attribution calculation or persistence layer is present.
2. **No real reporting cockpit exists yet.** `app/(markos)/page.tsx` remains a scaffold and there is no reporting route family implementing ATT-01 or REP-01 closure.
3. **No reporting-specific telemetry vocabulary exists yet.** `telemetry/events.ts` has no event names for dashboard views, attribution inspection, readiness panels, or live-check interactions.
4. **No cross-tenant rollup surface exists yet.** Central-operator reporting is still a design requirement, not a shipped route or API seam.
5. **No explicit readiness or completeness reporting exists for CRM attribution.** Earlier phases defined inputs, but not the Phase 64 health layer that explains when those inputs are incomplete.
6. **No milestone-closeout artifact family exists yet for v3.3 reporting closure.** The pattern exists from prior milestones, but the Phase 64-specific package still needs to be designed and written.

### Constraint implications

- Planning should prioritize truth-model definition before cockpit polish.
- Reporting APIs and evidence rails should be designed together so inspectability is built in from the start.
- The phase should deliberately avoid warehouse-first or export-first architecture drift.

## Tracking Requirements

Phase 64 should add tracking that proves the reporting shell is being used, that attribution is explainable, and that verification workflows are completing.

### Required event coverage

1. Reporting shell viewed, filtered, and role-switched.
2. Attribution panel viewed, drill-down opened, and evidence item inspected.
3. Executive summary viewed and expanded into record or pipeline detail.
4. Central rollup viewed and governed tenant drill-down requested or approved.
5. Readiness or completeness panel viewed when data is degraded.
6. Live-check workflow started, individual checks recorded, and closeout promoted.

### Required payload dimensions

- tenant_id
- actor_id
- actor_role
- reporting_view
- metric_family
- attribution_model_version or weighting profile
- record_kind and record_id when drilled into
- central_rollup_scope when cross-tenant
- readiness_state
- verification_check_id and outcome

### Tracking goals

- Measure whether operators trust and use the cockpit or still fall back to raw tables and timelines.
- Identify which attribution surfaces generate the most drill-down demand, indicating where transparency matters most.
- Support later MMM or BI-builder discovery with actual usage evidence rather than assumptions.

## Risks and Pitfalls

### 1. Dashboard sprawl without shared truth

If each reporting card invents its own data logic, Phase 64 will produce conflicting numbers instead of a milestone closeout.

Mitigation:
- centralize reporting and attribution derivation behind one truth layer before building role-specific views

### 2. Opaque fixed-weight attribution

Even deterministic weights will fail if operators cannot see why a deal or campaign received credit.

Mitigation:
- expose attribution evidence, contributing touches, and weighting logic in UI-accessible detail

### 3. Verification treated as paperwork

If closeout artifacts are detached from the product, operators will not trust that the reporting layer is truly live.

Mitigation:
- keep operator-facing validation views and live-check workflows inside the phase’s actual deliverables

### 4. Cross-tenant boundary drift

Cross-tenant reporting can become an accidental permissions expansion if rollups and drill-downs are not separated clearly.

Mitigation:
- make central rollups explicit, role-gated, and approval-aware for deeper inspection

### 5. Readiness blindness

Reporting quality will be misread as business performance if the cockpit hides missing tracking, stitching, or telemetry inputs.

Mitigation:
- surface data-completeness and freshness states alongside the metrics they affect

### 6. Deferred-scope leakage

MMM and custom BI-builder ideas can easily consume the phase if they are not held as explicit future seeds.

Mitigation:
- preserve them as deferred expansions only and keep the first pass focused on ATT-01/REP-01 closure

## Validation Architecture

Phase 64 validation should prove that attribution is deterministic and explainable, that reporting unifies the milestone truth, and that closeout evidence is repeatable.

### Test layers

1. **Attribution model tests**
   - verify fixed weights apply deterministically to eligible touch histories
   - verify incomplete or ambiguous evidence degrades to partial coverage instead of false certainty
   - verify attribution outputs remain linked to contact, deal, and campaign objects

2. **Reporting API and cockpit tests**
   - verify pipeline health, conversion, attribution, risk, and productivity endpoints return coherent, role-safe payloads
   - verify role-aware summaries do not widen data access silently
   - verify cross-tenant rollups remain limited to authorized central operators

3. **Readiness and completeness tests**
   - verify missing tracking, stitching, or outbound evidence produces visible degraded-state readiness output
   - verify freshness and completeness indicators update correctly from source data state

4. **Evidence and closeout tests**
   - verify live-check artifacts and closeout logs can be created with the required metadata fields
   - verify validation-ledger structure maps directly to ATT-01 and REP-01 requirement closure
   - verify acceptance evidence remains queryable and promotable into planning state

5. **UI workflow tests**
   - verify the reporting shell supports operator, manager, tenant-admin, executive, and central-rollup states
   - verify attribution drill-downs expose contributing evidence and weighting logic
   - verify readiness rails and evidence panels remain visible in degraded and healthy states

### Success conditions for planning

- ATT-01 is only considered covered when operators can inspect contact, deal, and campaign attribution directly in the CRM with visible evidence and deterministic weighting.
- REP-01 is only considered covered when pipeline health, conversion, attribution, SLA risk, and agent productivity are available through one coherent CRM shell rather than fragmented surfaces.
- Verification closure is only considered covered when Phase 64 produces both working product-facing validation views and explicit live-check and acceptance artifacts.

## Recommended Planning Shape

The cleanest Phase 64 execution breakdown is:

1. **Wave 1:** attribution truth model, reporting data contracts, telemetry expansion, and readiness/completeness signals
2. **Wave 2:** CRM-native reporting shell with operator, manager, tenant-admin, executive, and central-rollup surfaces
3. **Wave 3:** verification workflows, live-check artifacts, validation ledger closure, and milestone-closeout package promotion

That sequence keeps the phase honest: truth first, cockpit second, closeout proof last.
