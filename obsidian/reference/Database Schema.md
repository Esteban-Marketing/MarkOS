---
date: 2026-04-16
description: "Supabase migrations grouped by theme — tenant foundation, CRM, billing, governance, identity federation, plugin runtime, UI control plane, MIR lineage, literacy metadata."
tags:
  - reference
  - database
  - supabase
  - schema
  - rls
---

# Database Schema

> `supabase/migrations/*.sql`. Forward-only. All tenant-scoped tables enable RLS. Child of [[MarkOS Codebase Atlas]].

## Phase map (chronological)

| Phase | Migration | Theme |
|---|---|---|
| 37 | `37_markos_ui_control_plane.sql` | UI control plane — workspace, company, MIR, MSP, ICPs, segments |
| 39 | `39_pain_point_tags.sql` | literacy chunks — pain-point tags column |
| 42 | `42_markos_migrations.sql` | migrations tracking |
| 47 | `47_operator_llm_management.sql` | BYOK LLM — preferences, keys, call events |
| 51 | `51_multi_tenant_foundation.sql` | tenants, memberships, tenant_id RLS on all upstream tables |
| 52 | `52_plugin_runtime_foundation.sql` | plugins, tenant config, capability grants, plan entitlements |
| 52 | `52_digital_agency_core.sql` | digital-agency plugin tables |
| 53 | `53_agent_run_lifecycle.sql` | agent runs, events, side effects (AGT-01/02) |
| 53 | `53_agent_approval_immutability.sql` | agent approval decisions (AGT-03 / IAM-03) |
| 53 | `53_mir_lineage.sql` | Gate 1 inits, discipline activation evidence, MIR versions + regenerations |
| 54 | `54_billing_foundation.sql` | periods, pricing snapshots, usage events, usage ledger, lineage |
| 54 | `54_billing_provider_sync.sql` | provider sync attempts, invoice projections |
| 54 | `54_entitlement_enforcement.sql` | subscriptions, holds, entitlement snapshots |
| 54 | `54_governance_evidence.sql` | evidence packs, access reviews, retention exports, vendor inventory |
| 54 | `54_identity_federation.sql` | SSO bindings, role-mapping rules + events |
| 55 | `55_billing_hold_lifecycle.sql` | billing hold events |
| 56 | `56_governance_deletion_workflow.sql` | retention/deletion workflows |
| 58 | `58_crm_core_entities.sql` | contacts, companies, accounts, customers, deals, tasks |
| 58 | `58_crm_activity_and_identity.sql` | activity ledger, identity links, merge decisions + lineage |
| 58 | `58_crm_custom_fields.sql` | custom field definitions + values |
| 60 | `60_crm_pipeline_workspace.sql` | pipelines, stages, workspace object definitions |
| 61 | `61_crm_execution_workspace.sql` | execution recommendations, queue prefs, draft suggestions |
| 62 | `62_crm_outbound_foundation.sql` | outbound sends, channel consent, conversations |
| 62 | `62_crm_outbound_execution.sql` | templates, sequences, queue, bulk sends |
| 63 | `63_crm_copilot_foundation.sql` | copilot summaries, approval packages, mutation outcomes |
| 64 | `64_crm_reporting_foundation.sql` | reporting snapshots, attribution snapshots |
| 96 | `96_neuro_literacy_metadata.sql` | neuro-aware literacy columns on `markos_literacy_chunks` |
| 100 | `100_crm_schema_identity_graph_hardening.sql` | identity review state + tenant-safe audit |

## Thematic grouping

### Tenant & UI control plane (37, 51)

- `markos_workspaces`, `markos_company`, `markos_mir_documents`, `markos_msp_plans`, `markos_icps`, `markos_segments` — created in 37, then gain `tenant_id` + RLS in 51.
- `markos_tenants`, `markos_tenant_memberships` — tenant-of-record + explicit membership contracts.

### Literacy corpus (39, 96 + external Upstash Vector)

- `markos_literacy_chunks` with `pain_point_tags` (39) and neuro-aware metadata (96).

### Operator LLM (47)

- `markos_operator_llm_preferences`, `markos_operator_api_keys` (encrypted at rest), `markos_llm_call_events`.

### Plugin runtime (52)

- `markos_plugins` · `plugin_tenant_config` · `plugin_tenant_capability_grants` · `plugin_entitlements_by_plan`.
- Plus `digital_agency_campaigns`, `digital_agency_campaign_approvals`, `digital_agency_campaign_schedules` for the first-party digital-agency plugin.

### Agent lifecycle (53)

- `markos_agent_runs`, `markos_agent_run_events`, `markos_agent_side_effects` — tenant-bound run envelopes with required policy metadata.
- `markos_agent_approval_decisions` — immutable approval ledger.

### MIR lineage (53)

- `markos_mir_gate1_initializations` (append-only), `markos_discipline_activation_evidence`, `markos_mir_versions`, `markos_mir_regenerations`.

### Billing (54, 55)

- Foundation: `billing_periods`, `billing_pricing_snapshots`, `billing_usage_events`, `billing_usage_ledger_rows`, `billing_usage_ledger_lineage`.
- Provider sync: `billing_provider_sync_attempts`, `billing_invoice_projections`.
- Enforcement: `tenant_billing_subscriptions`, `tenant_billing_holds`, `tenant_entitlement_snapshots`.
- Hold lifecycle: `billing_hold_events`.

### Governance (54, 56)

- `governance_evidence_packs`, `governance_access_reviews`, `governance_retention_exports`, `governance_vendor_inventory`.
- `governance_deletion_workflows`.

### Identity federation (54)

- `tenant_sso_bindings`, `identity_role_mapping_rules`, `identity_role_mapping_events`.

### CRM (58, 60–64, 100)

See [[CRM Domain]] table-by-table. Summary:

- **58 Wave 1** (core entities + custom fields): contacts, companies, accounts, customers, deals, tasks; custom field definitions + values.
- **58 Wave 2** (activity + identity): activity ledger (append-only) · identity links · merge decisions · merge lineage.
- **60**: pipelines + stages + workspace object definitions (6-view participation).
- **61**: execution recommendations + queue prefs + draft suggestions.
- **62**: outbound foundation (sends, consent, conversations) + execution (templates, sequences, queue, bulk).
- **63**: copilot summaries + approval packages + mutation outcomes.
- **64**: reporting snapshots + attribution snapshots.
- **100**: identity review state hardening + tenant-safe audit.

## RLS invariants

- Every tenant-scoped table enables RLS.
- Tenant context is resolved from Supabase JWT `active_tenant_id` claim or explicit `x-tenant-id` header (API layer).
- Verified in tests `test/tenant-auth/*.test.js` and `test/crm-schema/*.test.js`.

## Test coverage

- `test/rls-verifier.test.js` — RLS policy enforcement.
- `test/namespace-auditor.test.js` — cross-tenant query audits.
- `test/migration-runner.test.js` — migration execution order.
- `test/crm-schema/crm-core-entities.test.js` — CRM entity invariants.
- `test/tenant-auth/crm-tenant-isolation.test.js` — tenant isolation.

## v2 Schema Gap Overlay

The current schema already has useful substrate: agent run lifecycle tables, approval decisions, billing usage ledgers, governance evidence, CRM tasks, activity ledger, and literacy chunks. v2 should extend these where possible instead of inventing parallel storage.

Target v2 data objects that need schema research:

| Object | Reuse candidate | Gap to research |
|---|---|---|
| AgentRun v2 | `markos_agent_runs`, `markos_agent_run_events`, `markos_agent_side_effects` | priority, DAG edges, scheduled trigger, retry class, DLQ, cost estimate vs actual |
| Task | CRM tasks / execution recommendations | generic cross-domain task board for agent output, approval, connector recovery, social escalation |
| ApprovalGate | `markos_agent_approval_decisions`, CRM copilot approval packages | rendered artifact preview, edit/reject reason, rollback metadata, evidence/cost summary |
| ConnectorInstall | connector work from phases 210+ / webhook/MCP substrate | registry, scopes, status, sync cadence, retention, recovery and backfill |
| EvidenceMap | claim library, literacy chunks, research context | source quality score, claim TTL, citation text, known gaps |
| ArtifactPerformanceLog | telemetry/events, CRM attribution snapshots | performance envelope before publish, actual outcome, attribution evidence, channel/format/pain/funnel dimensions |
| TenantOverlay | `.markos-local/` overrides, literacy metadata | confidence, scope, expiry, review status, central promotion candidate |
| LiteracyUpdateCandidate | literacy/admin tools | admin review queue and central promotion workflow |
| SocialSignal | CRM activity ledger, outbound conversations | normalized social inbound event, sentiment/intent/topic/CRM match, escalation state |
| PricingKnowledgeObject | new Pricing Engine tables | own/competitor/market/strategic pricing records, source quality, diff/history, embeddings |
| TenantCostModel | billing usage, revenue connectors | SaaS/eCommerce/Services cost structures, pricing floor, confidence level |
| PricingRecommendation | approval/task substrate | options, impact, risk, evidence, assumptions, decision status |
| PriceTest | experimentation + approval substrate | control/test config, sample size, metrics, stop conditions, rollout decision |
| PricingWatchList | connector/research substrate | competitor domains, crawl frequency, pricing page URL, alerts |
| SaaSSuiteActivation | new SaaS Suite tables + tenant profile | business_type=saas gating, module enablement, processors, countries, accounting, legal billing, autonomy posture |
| SaaSPlan | Pricing Engine + billing substrate | operational plan catalog, value metric, features, cadence, country availability, approved pricing reference |
| SaaSSubscription | billing subscriptions + CRM customer/account | lifecycle state, trial/past_due/pause/cancel/reactivate events, processor IDs, plan history |
| SaaSInvoice | billing invoice projections + provider sync | legal invoice fields, processor status, tax, accounting sync, DIAN CUFE/QR/transmission fields |
| SaaSHealthScore | product usage/support/billing/CRM engagement | explainable health score, confidence, trend, intervention task |
| SaaSSupportTicket | CRM tasks/activity + support connector | ticket source, SLA, sentiment, topic, KB grounding, suggested response, approval state |
| SaaSMRRSnapshot | billing/accounting/revenue snapshots | MRR, ARR, NRR, GRR, churn, expansion, contraction, cohort, forecast |
| SaaSGrowthProfile | tenant profile + SaaS Suite activation | SaaS mode, active growth modules, sales/CS/developer posture, growth approval posture |
| ActivationDefinition | product analytics + SaaS Suite usage events | aha moment, event name, milestones, activation baseline metrics |
| PQLScore | product analytics, CRM, pricing, billing | usage, intent, fit, recommended action/channel/timing |
| ABMAccountPackage | CRM account/company/contact/activity, research connectors | account tier, buying committee, strategic signals, messaging, engagement |
| CustomerMarketingProgram | CRM tasks/campaigns, SaaS health/support/revenue | expansion, advocacy, retention, education, review, beta, advisory, co-marketing program state |
| ReferralProgram | tracking/identity, billing/pricing, CRM attribution | rewards, referral links, cookie window, fraud prevention, performance |
| InAppCampaign | product analytics, task/approval, email/outbound | trigger, format, suppression, frequency cap, goal, success event |
| CommunityProfile | community connector, support, health, CRM | platform, goals, member activity, health score, signals into product/CS/content |
| MarketingEvent | CRM/outbound/activity/attribution | event plan, promotion, reminders, attendees/no-shows, replay, pipeline attribution |
| MarketingExperiment | artifact performance, pricing tests, analytics | hypothesis, variants, sample, guardrails, result, decision, learning |
| AffiliateProgram | tracking, billing, pricing, partner CRM | commission, cookie window, payout method, approval, prohibited methods, performance |
| RevenueTeamConfig | CRM pipeline/reporting, PLG/PQL, CS | MQL/SQL/PQL definitions, SLA, feedback cadence, attribution, shared targets |

Schema planning gates:

- Every tenant-scoped table must have RLS before phase close.
- Raw connector/social data stays tenant-only.
- Cross-tenant aggregates contain no tenant_id or PII.
- Central literacy writes require admin-reviewed candidate records.
- Deletion/export workflows must cover new tenant data.

## Related

- [[SaaS Suite Canon]]
- [[MarkOS Codebase Atlas]] · [[CRM Domain]] · [[Core Lib]] · [[Contracts Registry]] · [[Infrastructure]]
