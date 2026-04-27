# Phase 211 Research - Content, Social, and Revenue Loop

## Primary research question

What is the smallest complete operating loop MarkOS can prove end to end with real pricing posture, evidence posture, approval posture, dispatch honesty, social routing, revenue attribution, and downstream learning handoff?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current tools | Which existing MCP, CRM, outbound, and approval surfaces already support the loop? | Capability map |
| Ownership | Which requirement families belong to Phase 211 directly, and which must stay upstream or downstream? | Ownership boundary |
| Object model | What contracts represent strategy, brief, artifact, audit, dispatch, social signal, revenue feedback, and measurement handoff? | Contract proposal |
| Pricing | How does Pricing Engine context enter briefs, copy, offers, and pricing-sensitive claims? | Pricing context rules |
| Evidence | How does EvidenceMap block or label claims before approval and dispatch? | Evidence gate |
| Dispatch | Which channel is safest for the first approval-to-dispatch proof? | MVP channel decision |
| Social | What schema is needed for comments, mentions, DMs, and escalation without unsafe automation? | Social signal model |
| Revenue | Which CRM, timeline, outbound, or leading-indicator signals prove impact honestly? | Revenue feedback model |
| Learning handoff | What exact output should Phase 211 send into Phase 212? | Measurement handoff contract |
| Future growth | Which loop primitives should later power PLG, ABM, referral, community, events, PR, partnerships, and developer marketing? | Growth compatibility map |

## Files inspected

- `lib/markos/mcp/tools/marketing/audit-claim.cjs`
- `lib/markos/mcp/tools/marketing/expand-claim-evidence.cjs`
- `lib/markos/mcp/tools/execution/schedule-post.cjs`
- `lib/markos/crm/copilot.ts`
- `lib/markos/crm/agent-actions.ts`
- `lib/markos/crm/attribution.ts`
- `lib/markos/outbound/scheduler.ts`
- `lib/markos/outbound/conversations.ts`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`
- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `.planning/phases/211-content-social-revenue-loop/211-CONTEXT.md`
- `.planning/phases/211-content-social-revenue-loop/211-REVIEWS.md`
- `.planning/phases/205-pricing-engine-foundation/205-RESEARCH.md`
- `.planning/phases/206-soc2-type1-foundation/206-RESEARCH.md`
- `.planning/phases/208-human-operating-interface/208-RESEARCH.md`
- `.planning/phases/209-evidence-research-and-claim-safety/209-RESEARCH.md`
- `.planning/phases/210-connector-wow-loop-and-recovery/210-RESEARCH.md`
- `.planning/phases/212-learning-literacy-evolution/212-RESEARCH.md`

## Ownership boundary

### Direct ownership

- `LOOP-01..08`
- `QA-01..15`

### Upstream integrations, not primary ownership

- Phase 205 pricing and placeholder policy
- Phase 206 compliance and approval-risk posture
- Phase 207 AgentRun and failure visibility
- Phase 208 task board, approval inbox, and weekly narrative substrate
- Phase 209 EvidenceMap and source-quality posture
- Phase 210 connector health, recovery, and wow-loop substrate

### Downstream consumer, not dependency

- Phase 212 learning and literacy evolution consumes Phase 211 measurement outputs and expected performance envelopes

## Current-code support

### 1. Claim audit and strengthening already exist

- `audit_claim` loads tenant canon and returns `supported`, `confidence`, and `evidence`.
- `expand_claim_evidence` returns `canon_evidence` plus `strengthening_variants`.
- This is enough substrate to anchor artifact audits in real claim evidence rather than generic copy review.

### 2. Approval-aware mutation packaging already exists

- `assertAgentMutationAllowed` enforces tenant scope, role checks, and explicit approval-required mutation packaging.
- `buildApprovalPackage` creates immutable approval payloads with rationale, evidence, and proposed changes.
- `recordAgentMutationOutcome` records mutation outcomes back into CRM activity lineage.
- This gives Phase 211 a real approval substrate instead of inventing a new one.

### 3. A controlled dispatch primitive already exists

- `schedule_post` is already a mutating tool with an `approval_token` round-trip.
- It writes tenant-scoped queue state and returns `post_id`, `channel`, `scheduled_at`, and `status`.
- Supported channels already include `email`, `x`, `linkedin`, and `sms`.
- This means the first dispatch proof should be an approval-aware queued action, not a brand-new publishing engine.

### 4. Revenue attribution substrate already exists

- `buildWeightedAttributionModel` computes touch weights, revenue contributions, evidence, and degraded readiness reasons.
- It already distinguishes `ready` versus `degraded` attribution posture and exposes missing-family and identity-linkage gaps.
- This is strong substrate for honest revenue feedback rather than vanity measurement.

### 5. Conversation and outbound state already exist

- `buildSequenceExecutionPlan` and `selectDueOutboundWork` provide scheduled outbound sequencing.
- `appendConversationProviderEvent`, `buildOutboundConversation`, and `listOutboundConversations` already normalize provider events into thread state.
- This is enough to model conversation-aware dispatch and social or outbound follow-up without pretending the whole inbox layer already exists.

### 6. CRM copilot context can ground loop actions

- `buildCopilotGroundingBundle` builds contextual bundles from record, timeline, notes, tasks, and conversation history.
- `generateCopilotSummaryModel` already outputs source classes, missing context, risk flags, and recommendations.
- This is useful substrate for brief grounding, approval evidence, and next-task generation.

## Gaps

- No canonical `MarketingStrategyRun` or `ContentBrief` contract exists yet.
- No first-class `MarketingArtifact` and `ArtifactAudit` records exist with evidence, pricing, and compliance blocking states.
- No explicit `DispatchAttempt` state machine links approval, connector health, provider receipt, and rollback hints.
- No `SocialSignal` schema exists for comment, mention, DM, escalation, and route policy.
- No artifact-linked revenue feedback object exists even though attribution primitives are present.
- No measurement handoff contract exists that cleanly feeds Weekly Narrative, next tasks, and Phase 212.
- No validation contract exists for the phase, despite the test matrix already defining the business truths.

## Recommendation

Phase 211 should be replanned as a six-wave executable phase with a Wave 0.5 preflight at the front:

1. Hard-gate upstream readiness across pricing, compliance, approvals, evidence, and connectors.
2. Create explicit loop objects instead of relying on loose coupling between existing tools.
3. Use `schedule_post` as the first controlled dispatch surface, but only after approval and connector checks.
4. Treat social as routed work first, not auto-response automation.
5. Reuse `buildWeightedAttributionModel` for revenue truth instead of inventing a new scoring model.
6. Produce a named measurement handoff contract for Phase 212 and a future-growth compatibility map for doc 17 consumers.

## Domain 0 - Upstream readiness and architecture lock

Phase 211 depends on Phases 205-210 in practice, so Plan 01 should create a Wave 0.5 gate that checks:

- Pricing Engine placeholder posture exists and is authoritative
- compliance and approval-risk posture exist for external mutations
- AgentRun lineage is available for loop records
- task and approval surfaces exist as integration targets
- EvidenceMap and source-quality posture exist for claim blocking
- connector health and recovery posture exist before external dispatch

The architecture lock should also reject unsafe phase shortcuts such as:

- `silent auto-publish`
- `dispatch without approval`
- `hard-coded public price`
- `unsupported claim publish`

## Domain 1 - Strategy and brief object model

Recommended contracts:

- `MarketingStrategyRun`
  - `strategy_run_id`
  - `tenant_id`
  - `objective`
  - `audience_segment`
  - `pain_tag`
  - `offer_ref`
  - `channel_hypothesis`
  - `pricing_context_ref`
  - `proof_requirement_refs`
  - `success_target`
  - `owner_role`
  - `agent_run_id`
  - `created_at`
  - `updated_at`

- `ContentBrief`
  - `brief_id`
  - `strategy_run_id`
  - `artifact_family`
  - `channel`
  - `claim_inventory`
  - `evidence_requirement_refs`
  - `pricing_requirement`
  - `approval_policy`
  - `revenue_hypothesis`
  - `dispatch_goal`
  - `measurement_window_days`
  - `created_at`
  - `updated_at`

Recommended `pricing_requirement` literals:

- `approved_pricing`
- `placeholder_allowed`
- `not_pricing_sensitive`

## Domain 2 - Draft generation and audit pipeline

Recommended contracts:

- `MarketingArtifact`
  - `artifact_id`
  - `brief_id`
  - `artifact_family`
  - `channel`
  - `draft_body`
  - `variant_count`
  - `evidence_refs`
  - `pricing_context_ref`
  - `approval_status`
  - `artifact_status`
  - `created_at`
  - `updated_at`

- `ArtifactAudit`
  - `audit_id`
  - `artifact_id`
  - `voice_status`
  - `claim_status`
  - `compliance_status`
  - `channel_fit_status`
  - `pricing_status`
  - `evidence_status`
  - `blocking_reasons`
  - `recommended_edits`
  - `created_at`

Recommended `artifact_status` literals:

- `draft`
- `audited`
- `blocked`
- `approval_ready`
- `rejected`

Recommended blocking reasons:

- `evidence_blocked`
- `pricing_blocked`
- `compliance_blocked`
- `channel_blocked`

## Domain 3 - Approval-to-dispatch path

The safest first proof path is an approval-gated `linkedin` queue path using `schedule_post`, with connector state checked before any external dispatch attempt.

Recommended `DispatchAttempt` fields:

- `dispatch_attempt_id`
- `tenant_id`
- `artifact_id`
- `channel`
- `connector_install_id`
- `approval_package_id`
- `approval_mode`
- `provider_receipt_ref`
- `queue_status`
- `dispatch_status`
- `rollback_hint`
- `agent_run_id`
- `created_at`
- `updated_at`

Recommended `approval_mode` literals:

- `human_approved`
- `earned_autonomy`

Recommended `dispatch_status` literals:

- `blocked`
- `queued`
- `dispatched`
- `failed`
- `retry_pending`

## Domain 4 - Social signals and escalation

Phase 211 should model social routing, not pretend the entire social inbox is already built.

Recommended `SocialSignal` fields:

- `social_signal_id`
- `tenant_id`
- `source_platform`
- `signal_type`
- `signal_text`
- `sentiment`
- `urgency`
- `revenue_relevance`
- `approval_needed`
- `route_kind`
- `crm_record_ref`
- `task_ref`
- `created_at`
- `updated_at`

Recommended `route_kind` literals:

- `read_only`
- `task_only`
- `approval_queue`
- `crm_linked`
- `spam`

## Domain 5 - Revenue feedback and weekly narrative

Recommended `RevenueFeedbackLink` fields:

- `feedback_id`
- `tenant_id`
- `artifact_id`
- `campaign_ref`
- `crm_record_kind`
- `crm_record_id`
- `revenue_amount`
- `currency`
- `attribution_status`
- `weighted_evidence_refs`
- `leading_indicator_kind`
- `narrative_ready`
- `created_at`
- `updated_at`

Recommended `attribution_status` literals:

- `ready`
- `degraded`
- `missing_identity`
- `missing_touches`

This domain should reuse `buildWeightedAttributionModel` rather than replacing it.

## Domain 6 - Measurement handoff and growth compatibility

Phase 211 must create the exact output that Phase 212 later consumes.

Recommended `MeasurementHandoff` fields:

- `handoff_id`
- `tenant_id`
- `artifact_id`
- `expected_outcome`
- `actual_outcome`
- `outcome_delta`
- `attribution_status`
- `lesson_candidate`
- `next_task_kind`
- `next_task_ref`
- `weekly_narrative_ref`
- `learning_ready`
- `created_at`
- `updated_at`

Recommended `next_task_kind` literals:

- `brief_refresh`
- `evidence_refresh`
- `pricing_review`
- `connector_recovery`
- `social_follow_up`
- `experiment_candidate`

The growth compatibility map should explicitly list these future consumers:

- `plg`
- `abm`
- `referral`
- `community`
- `events`
- `pr`
- `partnerships`
- `developer_marketing`

Each row should be marked `future_consumer`, not treated as active execution scope.

## Validation architecture

The phase needs a `211-VALIDATION.md` that covers:

- Wave 0.5 upstream readiness and architecture lock
- strategy and brief contracts
- draft and audit blocking states
- approval-to-dispatch state machine
- social routing and escalation policy
- revenue feedback and weekly narrative inputs
- measurement handoff and future-growth compatibility map

## Risks

- If Phase 211 re-owns pricing, evidence, connector, or task systems, later phases can hide upstream incompleteness behind the loop phase.
- If dispatch is planned without explicit Phase 206 compliance posture, external mutation safety becomes ambiguous.
- If measurement handoff is vague, Phase 212 can later "learn" from ungrounded or incomplete loop outputs.
- If social routing is treated as a dashboard instead of routed work, the loop proves observation instead of action.

## Phase implications

- Phase 212 should inherit exact measurement outputs from Phase 211, not redefine them.
- Phase 213 should validate that the Phase 211 loop can run on Tenant 0 without silent gaps.
- Phases 218-220 should consume the compatibility map rather than reopening basic loop design questions.

## Acceptance tests implied

- End-to-end loop test from strategy brief to approved artifact to queued dispatch to measurement handoff
- Evidence gate test: unsupported claim blocks approval and dispatch
- Pricing gate test: pricing-sensitive copy requires Pricing Engine context or `{{MARKOS_PRICING_ENGINE_PENDING}}`
- Compliance gate test: external mutations cannot bypass approval-aware posture
- Connector gate test: dispatch is blocked when the required connector is missing, degraded, or stale
- Social routing test: urgent or revenue-relevant signals create the correct task, CRM link, or approval item
- Attribution test: campaign or outbound signals attach back to the artifact with `ready` or explicit `degraded` posture
- Measurement test: every dispatched artifact produces expected performance envelopes, actual outcomes, and next-task recommendations
