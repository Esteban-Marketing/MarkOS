# Phase 105: Approval-Aware AI Copilot and Reporting Closeout - Research

**Researched:** 2026-04-15  
**Domain:** grounded CRM copilots, approval-aware AI actions, CRM-native reporting, attribution rollups, and milestone closeout evidence  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The flagship copilot experience for this phase is the record brief.
- **D-02:** Copilot output should default to a concise operator brief rather than long-form analysis.
- **D-03:** Every copilot summary must visibly include evidence and rationale.
- **D-04:** Conversation summaries and next-step packages should reinforce the record brief.
- **D-05:** The copilot remains advisory first by default.
- **D-06:** Durable or externally visible actions must stay packaged for explicit review.
- **D-07:** Existing approval-package and playbook-run patterns remain the governing mechanism.
- **D-08:** Reporting, attribution, and verification should stay CRM-native and evidence-forward.
- **D-09:** Milestone closeout should emphasize trustworthy lineage and readiness visibility.

### Deferred Ideas (OUT OF SCOPE)
- open-ended autonomous agent behavior
- freeform external sending or background AI follow-through
- detached warehouse-first BI replatforming
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-04 | CRM-native reporting exposes revenue health, attribution, and lifecycle state from the same operational source of truth. | Reuse the existing reporting cockpit, executive summary, attribution drilldown, and verification shell rather than building a separate analytics product. |
| AI-CRM-01 | AI copilots can summarize, draft, recommend, and enrich using grounded CRM and MarkOS context. | Reuse the current grounding bundle, record and conversation summary model, evidence entries, and recommendation packaging seams. |
| AI-CRM-02 | AI-assisted actions remain approval-aware, explainable, and non-destructive with full audit evidence. | Reuse approval packages, playbook pause or resume lifecycle, role gates, and immutable activity lineage already present in the repo. |
</phase_requirements>

## Project Constraints

- Keep the current Next.js, Node.js, and contract-first CRM stack; do not replatform.
- Preserve tenant-safe, approval-aware, and fail-closed behavior from earlier phases.
- Keep AI assistance grounded in canonical CRM state and recent outbound evidence.
- Keep reporting, readiness, and verification inside the CRM shell rather than a detached BI layer.

## Summary

Phase 105 should be planned as a closeout and hardening phase on top of an already substantial CRM AI and reporting foundation. The repository already contains grounded copilot summary generation, recommendation packaging, approval packages, governed playbook lifecycles, CRM-native reporting dashboards, attribution APIs, readiness panels, central rollups, and verification checklist surfaces. The core planning need is therefore not to invent a new AI product, but to formalize the launch posture: record-first concise operator briefs, inline evidence and rationale, approval-aware action packaging, and trustworthy reporting or closeout evidence that proves the milestone works as one governed system.

**Primary recommendation:** treat the current CRM copilot and reporting shell as the canonical foundation and focus planning on regression-locked operator clarity, approval continuity, and final requirement verification rather than building new autonomous behaviors.

## Current Verification Evidence

A fresh Phase 105 baseline run is already green:

- `node --test test/crm-ai/*.test.js test/crm-reporting/*.test.js test/tenant-auth/crm-copilot-tenant-isolation.test.js test/tenant-auth/crm-reporting-tenant-isolation.test.js`
- **Result:** 40 passing, 0 failing

That confirms the repo already has a real copilot and reporting substrate ready for Phase 105 planning.

## Existing Reusable Code

| Asset | What already exists | Planning implication |
|------|----------------------|----------------------|
| `lib/markos/crm/copilot.ts` | tenant-scoped grounding bundles, concise summary model, risk flags, and approval-ready recommendation packaging | keep this as the copilot truth layer |
| `api/crm/copilot/recommendations.js` | grounded summary and recommendation API seam with approval-package creation | reuse and harden this instead of creating a new assistant endpoint |
| `api/crm/copilot/playbooks.js` | approval-aware playbook creation, review, and resume lifecycle | preserve explicit operator review and non-destructive execution |
| `app/(markos)/crm/copilot/page.tsx` and copilot components | CRM-native record, conversation, recommendation, and approval-package shell | keep the experience record-first and evidence-forward |
| `lib/markos/crm/reporting.ts` | readiness, cockpit, executive summary, and central rollup model logic | use as the reporting source of truth |
| `api/crm/reporting/dashboard.js`, `attribution.js`, `verification.js` | tenant-safe reporting, attribution, and closeout API seams | preserve one governed reporting lane |
| `app/(markos)/crm/reporting/page.tsx` and verification route | CRM-native reporting cockpit with evidence rail and verification checklist | use as the closeout shell for CRM-04 proof |
| `test/crm-ai/*.test.js` and `test/crm-reporting/*.test.js` | strong regression rail for grounding, approvals, playbooks, dashboard, attribution, readiness, and verification | use as the TDD and verification backbone for the phase |

## Verified Gaps to Address

1. **The code foundation is already real, but the phase still needs an execution-ready planning and closeout bundle.**
2. **The record brief needs to remain the explicit flagship experience rather than drifting toward a generic chatbox.**
3. **Evidence and rationale need to stay highly visible on AI suggestions so operator trust remains fast and grounded.**
4. **Reporting and verification should remain obviously CRM-native, tenant-safe, and ready for milestone proof.**

## Architecture Patterns

### Pattern 1: Record-first operator briefing
The copilot should start from the CRM record and produce a concise briefing with what matters, why it matters, and what to do next.

### Pattern 2: Advisory-first AI with explicit approval envelopes
AI can prepare and package actions, but approval remains a visible human control point for anything durable or externally visible.

### Pattern 3: One reporting truth layer
Revenue health, attribution, lifecycle risk, productivity, readiness, and verification should stay in one CRM reporting shell.

### Pattern 4: Evidence-forward closeout
Every meaningful AI or reporting surface should make lineage, reasons, and degraded-state context visible enough for verification.

## Likely Task Waves

### Wave 0: Regression-first guardrails
- keep red-path coverage for grounded summaries, approval packaging, playbook governance, and reporting truth-layer integrity

### Wave 1: Copilot experience hardening
- keep the record brief concise, evidence-forward, and operator-centric
- preserve conversation context and next-step packages without drifting into a detached assistant product

### Wave 2: Reporting and closeout continuity
- keep attribution, readiness, and verification evidence coherent enough for milestone closeout
- preserve tenant-safety and explicit central-rollup governance

## Recommended Implementation Order

1. Lock the chosen copilot posture in focused regressions.
2. Harden the approval-aware recommendation and playbook seams without expanding scope.
3. Tighten the reporting and verification lane so CRM-04 closes cleanly.
4. Re-run the full AI and reporting regression slice before phase closeout.

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| generic assistant interface | detached chat-first product | record and conversation panels in the CRM shell | keeps AI help operational and grounded |
| silent AI mutation | direct writes without review | approval packages and governed playbook lifecycle | preserves auditability and safety |
| second analytics source | warehouse-only or BI-only dashboard layer | CRM reporting cockpit and attribution APIs | keeps one operational source of truth |
| opaque AI outputs | rationale hidden behind extra clicks | inline evidence and rationale entries | preserves fast operator trust |

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Copilot drift into a chat toy | High | keep record brief and evidence-forward posture explicit in tests and UI copy |
| Silent or destructive AI actions | Critical | preserve approval-required packaging and replay-safe playbook execution |
| Reporting fragmentation | High | keep dashboard, attribution, readiness, and verification inside the CRM shell |
| Weak closeout proof | High | preserve verification checklist and evidence packaging for final milestone sign-off |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Quick run command | `node --test test/crm-ai/crm-conversation-summary.test.js test/crm-ai/crm-recommendation-packaging.test.js test/crm-reporting/crm-reporting-shell.test.js` |
| Mid-suite command | `node --test test/crm-ai/crm-copilot-workspace.test.js test/crm-ai/crm-playbook-run-lifecycle.test.js test/crm-reporting/crm-reporting-readiness.test.js` |
| Full phase slice command | `node --test test/crm-ai/*.test.js test/crm-reporting/*.test.js test/tenant-auth/crm-copilot-tenant-isolation.test.js test/tenant-auth/crm-reporting-tenant-isolation.test.js` |
| Current fresh evidence | 40 pass / 0 fail |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-CRM-01 | grounded summaries, record briefs, conversation context, and recommendation packaging stay CRM-native | unit / integration | CRM AI quick or full slice | ✅ |
| AI-CRM-02 | approval-aware playbooks and reviewable AI actions remain fail-closed and auditable | unit / integration | CRM AI mid or full slice | ✅ |
| CRM-04 | reporting cockpit, attribution, readiness, and verification remain in one source-of-truth shell | unit / integration | CRM reporting mid or full slice | ✅ |

## Sources

### Primary (HIGH confidence)
- current repo artifacts under `app/(markos)/crm/copilot/`, `components/markos/crm/`, `api/crm/copilot/`, `api/crm/reporting/`, `lib/markos/crm/`, and the associated test suites
- Phase 105 decisions captured in `105-CONTEXT.md`

## Metadata

**Confidence breakdown:**
- Architecture: HIGH — grounded in the live copilot and reporting seams already in the repo
- Validation: HIGH — the full AI and reporting regression slice is green
- Risks: HIGH — directly supported by approval, evidence, and tenant-isolation tests already present

**Research date:** 2026-04-15  
**Valid until:** 2026-05-15
