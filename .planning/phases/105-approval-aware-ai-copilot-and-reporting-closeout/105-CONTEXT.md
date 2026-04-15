# Phase 105: Approval-Aware AI Copilot and Reporting Closeout - Context

**Gathered:** 2026-04-15  
**Status:** Ready for planning

## Phase Boundary

This phase ships the grounded CRM copilot layer, approval-aware recommendation packaging, attribution rollups, CRM-native reporting dashboards, and the evidence bundle needed to close the milestone with confidence. It should feel like one governed intelligence layer inside the existing CRM shell, not a separate chat product or detached BI stack. It does not include autonomous AI execution, freeform outbound sending, or a warehouse-first analytics replatform.

## Implementation Decisions

### Copilot launch posture
- **D-01:** The flagship copilot experience for this phase is the **record brief** — operators should be able to open a deal, customer, or account and immediately get a grounded summary.
- **D-02:** Copilot output should default to a **concise operator brief** that is short, skimmable, and action-first rather than long-form analysis.
- **D-03:** Every copilot summary must visibly include **evidence and rationale** so operators can see why the system is suggesting something without hunting through extra layers.
- **D-04:** Conversation summaries, next-step packages, and draft recommendations remain part of the experience, but they should reinforce the record brief rather than compete with it.

### Governance and action posture
- **D-05:** The copilot remains **advisory first** by default. It helps operators understand the record, spot risk, and prepare the next move.
- **D-06:** Durable or externally visible actions must stay **packaged for explicit review** rather than running automatically.
- **D-07:** Existing approval-package and playbook-run patterns should remain the governing mechanism instead of introducing a second approval model.

### Reporting and closeout posture
- **D-08:** Reporting, attribution, and verification should stay **CRM-native and evidence-forward**, reusing the existing dashboard, rollup, and evidence-rail posture already present in the repo.
- **D-09:** Milestone closeout should emphasize trustworthy lineage, readiness visibility, and proof that AI assistance remains bounded and reviewable.

### the agent's Discretion
- Exact section order, card density, labels, and secondary copilot outputs can follow repo-native CRM patterns as long as the main experience stays concise, grounded, and approval-aware.

## Specific Ideas

- The copilot should feel like a **crisp operator briefing**, not a chat toy.
- The most important pattern is: **what matters, why it matters, and what to do next**.
- Evidence should remain inline enough that an operator can trust the suggestion quickly.
- Reporting and verification should remain part of the same CRM truth layer rather than splitting into a separate analytics product.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase sources
- `.planning/ROADMAP.md` — Defines the Phase 105 boundary and the dependency on the verified CRM, execution, and outbound phases.
- `.planning/REQUIREMENTS.md` — CRM-04, AI-CRM-01, and AI-CRM-02 are the completion targets for this phase.
- `.planning/phases/103-sales-and-success-execution-workspace/103-CONTEXT.md` — Locks the explainable, approval-aware execution posture that copilot actions must preserve.
- `.planning/phases/104-native-outbound-execution/104-CONTEXT.md` — Locks the human-controlled outbound and evidence-first posture that AI suggestions must build on.

### Copilot surfaces and services
- `app/(markos)/crm/copilot/page.tsx` — Main CRM copilot workspace route and shell.
- `app/(markos)/crm/copilot/playbooks/page.tsx` — Approval-review and governed playbook execution surface.
- `app/(markos)/crm/copilot/copilot-store.tsx` — Shared state for summaries, recommendations, evidence, and approval packages.
- `components/markos/crm/copilot-record-panel.tsx` — Record-centric summary and recommendation presentation seam.
- `components/markos/crm/copilot-conversation-panel.tsx` — Grounded conversation context and evidence trail seam.
- `components/markos/crm/copilot-approval-package.tsx` — Approval envelope UI seam for reviewable AI-assisted actions.
- `lib/markos/crm/copilot.ts` — Grounding bundle, summary model, recommendation packaging, and workspace snapshot logic.
- `api/crm/copilot/recommendations.js` — Tenant-safe copilot recommendation and package API seam.
- `api/crm/copilot/playbooks.js` — Approval-aware playbook lifecycle and resume flow.

### Reporting and verification surfaces
- `app/(markos)/crm/reporting/page.tsx` — CRM reporting cockpit shell.
- `app/(markos)/crm/reporting/verification/page.tsx` — Verification and closeout evidence workflow shell.
- `components/markos/crm/reporting-dashboard.tsx` — Pipeline, attribution, productivity, and readiness cockpit seam.
- `components/markos/crm/reporting-central-rollup.tsx` — Governed central rollup seam.
- `components/markos/crm/reporting-evidence-rail.tsx` — Evidence and degraded-state explanation seam.
- `components/markos/crm/reporting-verification-checklist.tsx` — Readiness and closeout checklist seam.
- `lib/markos/crm/reporting.ts` — Readiness, cockpit, executive summary, and central rollup model logic.
- `api/crm/reporting/dashboard.js` — Tenant-safe reporting data API seam.
- `api/crm/reporting/attribution.js` — Attribution rollup and governed drill-down seam.
- `api/crm/reporting/verification.js` — Live verification and closeout promotion seam.

### Regression coverage
- `test/crm-ai/crm-copilot-grounding.test.js` — Grounded summary input and CRM context coverage.
- `test/crm-ai/crm-copilot-workspace.test.js` — Copilot workspace composition and evidence coverage.
- `test/crm-ai/crm-conversation-summary.test.js` — Conversation-summary and recommendation coverage.
- `test/crm-ai/crm-recommendation-packaging.test.js` — Approval-package creation and lineage coverage.
- `test/crm-ai/crm-playbook-run-lifecycle.test.js` — Approval pause and resume lifecycle coverage.
- `test/crm-ai/crm-ai-audit-lineage.test.js` — AI-originated action lineage and audit evidence coverage.
- `test/crm-reporting/crm-reporting-shell.test.js` — CRM-native reporting cockpit shell coverage.
- `test/crm-reporting/crm-reporting-readiness.test.js` — Reporting readiness and evidence posture coverage.

## Existing Code Insights

### Reusable Assets
- `lib/markos/crm/copilot.ts` already builds a tenant-scoped grounding bundle, concise summary model, risk flags, and approval-ready recommendations.
- `api/crm/copilot/recommendations.js` and `api/crm/copilot/playbooks.js` already provide reviewable packaging and governed playbook execution seams.
- The reporting shell already exposes dashboard, executive summary, central rollup, evidence rail, and verification checklist surfaces inside the CRM route tree.

### Established Patterns
- Copilot recommendations are bounded, evidence-backed, and marked approval-required rather than silently mutating CRM state.
- Playbooks pause for review and resume only through explicit lifecycle actions.
- Reporting keeps tenant-safe drill-downs, explicit role layers, and degraded-state explanations visible when signal quality drops.

### Integration Points
- Phase 105 should consume the execution recommendations from Phase 103 and outbound evidence from Phase 104 rather than creating a parallel intelligence system.
- Copilot summaries should make queue, record, and conversation context easier to act on without bypassing the existing governance model.
- Reporting closeout should provide the final evidence bridge showing the milestone behaves as one governed CRM system.

## Deferred Ideas

- Open-ended autonomous agent behavior remains out of scope.
- Full freeform chat orchestration or a general assistant persona can wait for a later phase if still needed.
- Separate warehouse-first BI tooling or broader external automation sprawl remains deferred.

---

*Phase: 105-approval-aware-ai-copilot-and-reporting-closeout*  
*Context gathered: 2026-04-15*