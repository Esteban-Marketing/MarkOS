# Phase 211 Research - Content, Social, and Revenue Loop

## Primary research question

What is the smallest complete marketing loop MarkOS can run end-to-end with evidence, approval, dispatch, measurement, pricing safety, and learning?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current tools | Which MCP and app features already support strategy, brief, draft, audit, schedule, CRM, and attribution? | Capability map |
| Object model | What objects represent strategy, brief, artifact, audit, approval, dispatch, measurement, and learning? | Contract proposal |
| Pricing | How does Pricing Engine context enter briefs, copy, offers, and claims? | Pricing context rules |
| Evidence | How does EvidenceMap block or label claims before approval? | Evidence gate |
| Social | What social inbox/listening/DM/comment signal schema is needed for v1? | Social signal model |
| Dispatch | Which channel is safest for first approval-to-dispatch proof? | MVP channel decision |
| Revenue | Which CRM/pipeline/UTM/leading indicators prove impact? | Revenue feedback model |
| Future growth | Which loop primitives should later power PLG, ABM, referral, community, event, PR, partnership, and developer marketing? | Growth compatibility map |

## Sources to inspect

- MCP marketing tool code and contracts.
- CRM/outbound/reporting/attribution code.
- Existing approval and task surfaces.
- Phase 209 EvidenceMap research.
- Pricing Engine canon and Phase 205 plans.
- Incoming Content Engine, Social Deep Integration, Pipeline Modules, GTM, and SaaS Marketing OS Strategy docs.

## Required research output

- Current-code support.
- Object and state model.
- First-channel recommendation.
- Approval/evidence/pricing gates.
- Measurement and learning handoff.
- Acceptance tests and UAT criteria.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `lib/markos/mcp/tools/marketing/audit-claim.cjs`
- `lib/markos/mcp/tools/marketing/expand-claim-evidence.cjs`
- `lib/markos/mcp/tools/execution/schedule-post.cjs`
- `lib/markos/crm/execution.ts`
- `lib/markos/crm/copilot.ts`
- `lib/markos/crm/agent-actions.ts`
- `lib/markos/crm/attribution.ts`
- `lib/markos/outbound/scheduler.ts`
- `lib/markos/outbound/conversations.ts`

### Existing support

- Marketing MCP tools can audit and strengthen claims.
- `schedule_post` exists as a mutating MCP tool requiring approval tokens.
- CRM execution surfaces already compute priority, stalled work, success risk, inbound signals, ownership gaps, and recommended next actions.
- CRM copilot builds grounded bundles, missing-context lists, risk flags, and approval package recommendations.
- CRM agent actions require approvals for mutations and can record mutation outcomes.
- Attribution already handles campaign touches, web activity, outbound events, evidence references, and degraded readiness.
- Outbound scheduling and channel capability primitives exist for email, SMS, and WhatsApp.

### Gaps

- No complete operating loop object model exists for strategy -> brief -> draft -> audit -> approval -> dispatch -> measure -> learn.
- No canonical content artifact store with evidence state, pricing context, channel state, dispatch status, and measurement handoff exists.
- No social listening/inbox/DM/comment signal model exists.
- `schedule_post` queues an approved external action, but there is no connector-backed channel adapter and no dispatch result loop.
- Revenue feedback is not tied back to artifacts and learnings as a first-class loop.
- Pricing Engine context does not yet enter briefs, offers, copy, discounts, or pricing-sensitive claims.

### Proposed loop objects

- `MarketingStrategyRun`: objective, audience, offer, channel hypothesis, pricing context, evidence requirements.
- `ContentBrief`: claim inventory, target channel, source requirements, approval policy, revenue hypothesis.
- `MarketingArtifact`: draft, variants, channel, status, EvidenceMap refs, pricing refs, approval id.
- `ArtifactAudit`: claim support, brand fit, compliance risk, unsupported gaps, recommended edits.
- `DispatchAttempt`: channel, connector install, approved payload, provider receipt, rollback hint.
- `MeasurementSnapshot`: UTM/campaign touch, CRM/pipeline signal, social engagement, revenue attribution status.
- `LearningCandidate`: lesson, confidence, tenant overlay target, central promotion eligibility.

### First-channel recommendation

The safest first proof is an approval-gated content/social queue that stops at scheduled dispatch unless a ConnectorInstall is healthy. This lets MarkOS prove strategy, brief, draft, evidence audit, approval, task visibility, and measurement preparation before risking an external publish. Once Phase 210 supplies a healthy connector, `schedule_post` can become the first controlled dispatch path.

### Tests implied

- End-to-end loop test from strategy brief to approved artifact to queued dispatch to measurement placeholder.
- Evidence gate test: unsupported claim blocks approval.
- Pricing gate test: pricing-sensitive copy requires Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- Connector gate test: dispatch is blocked when required connector is missing/degraded and creates recovery work.
- Attribution test: campaign touch/revenue signal can attach back to the artifact.
