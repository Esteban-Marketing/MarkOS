# Phase 103: Sales and Success Execution Workspace - Research

**Researched:** 2026-04-14  
**Domain:** CRM-native execution queues, explainable next-best-action triage, and bounded operator playbooks  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The first version should use one unified execution workspace with clear tabs rather than separate sales and success products.
- **D-02:** Managers, owners, and tenant admins should land on the team queue by default while the personal-vs-team toggle remains first-class.
- **D-03:** Queue selection should open a detail, evidence, and action panel grounded in canonical CRM record and timeline context.
- **D-04:** The initial urgency bias should favor due or overdue work and approval gates before lower-signal suggestions.
- **D-05:** Success, renewal, and expansion risk must stay visible and explainable without displacing explicit unblockers.
- **D-06:** Safe next-best actions in this phase remain bounded to task creation, note append, and allowed field updates plus suggestion-only drafts.
- **D-07:** Playbooks should feel like guided checklists with rationale and evidence, not black-box automation.
- **D-08:** Human operators remain in control; AI support stays assistive and approval-aware rather than self-executing.

### Deferred Ideas (OUT OF SCOPE)
- Native outbound send, WhatsApp, SMS, or email execution belongs to Phase 104.
- Autonomous AI follow-through, copilot mutation flows, and reporting narratives belong to Phase 105.
- Warehouse-first analytics and detached BI dashboards remain outside the milestone boundary.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXEC-01 | Sales and customer-success teams work from role-aware queues, tasks, playbooks, and next-best-action surfaces. | Reuse the existing execution snapshot, queue ranking, safe action APIs, and shared client store rather than building a second workflow surface. |
| EXEC-02 | SLA, risk, renewal, and expansion signals remain visible, explainable, and auditable during execution. | Keep rationale summaries, source signals, evidence panel lineage, and draft boundaries anchored in canonical CRM activity and task state. |
</phase_requirements>

## Project Constraints (from milestone state)

- Keep the current Node.js, Next.js, Supabase, and contract-first CRM stack; do not replatform.
- Preserve tenant-safe, fail-closed mutation and queue access rules.
- Keep execution recommendation behavior explainable and auditable from CRM-native records, tasks, and activities.
- Do not expand into outbound delivery or autonomous AI actions during this phase.

## Summary

Phase 103 should be planned as a completion and hardening phase for an execution workspace foundation that already exists in the repository. The repo already contains queue ranking logic, role-aware personal and team scopes, a three-region execution page, bounded safe actions, immutable evidence grammar, and suggestion-only draft surfaces. The planning priority is therefore not greenfield construction; it is to formalize the phase boundary, tighten the due-or-overdue and approval-first triage posture, reinforce the operator guidance loop, and keep playbook steps explainable and safely bounded.

**Primary recommendation:** keep the current execution snapshot and recommendation engine authoritative, then harden the UI and validation around the user’s chosen queue posture, urgency bias, and guided playbook style.

## Current Verification Evidence

A fresh execution baseline run is already green:

- `node --test test/crm-execution/*.test.js`
- **Result:** 17 passing, 0 failing

That evidence confirms the repo already has a real execution-workspace substrate to build on for Phase 103.

## Existing Reusable Code

| Asset | What already exists | Planning implication |
|------|----------------------|----------------------|
| `lib/markos/crm/execution.ts` | canonical signal normalization, urgency scoring, queue tabs, recommendation ranking, draft suggestion artifacts, and workspace snapshot hydration | keep this as the execution truth layer |
| `app/(markos)/crm/execution/page.tsx` | unified three-region queue, detail, and evidence entrypoint with team-default behavior for manager-like roles | preserve the single cockpit posture |
| `app/(markos)/crm/execution/execution-store.tsx` | shared client state for scope, tab, selected recommendation, and action synchronization | extend centrally rather than per-panel |
| `components/markos/crm/execution-queue.tsx` | personal and manager-or-team scopes, tab switching, and actionable queue list grammar | keep one queue shell with tab-based triage |
| `components/markos/crm/execution-detail.tsx` | rationale-first detail panel and bounded actions for task, note, and safe record updates | harden as the main operator action loop |
| `components/markos/crm/execution-evidence-panel.tsx` | immutable evidence framing for rationale, signals, timeline, and allowed actions | preserve auditable explainability |
| `components/markos/crm/draft-suggestion-panel.tsx` | suggestion-only draft preview with send disabled and sequence disabled states | preserve the outbound boundary |
| `api/crm/execution/queues.js` | tenant-safe queue read seam | reuse for all execution list refreshes |
| `api/crm/execution/actions.js` | tenant-safe bounded action seam with explicit forbidden outbound actions | keep safe-action boundaries explicit |
| `lib/markos/crm/playbooks.ts` | approval-aware, replay-safe checklist step machinery for safe task, note, stage, owner, and enrichment actions | reuse checklist semantics without enabling autonomous execution |
| `contracts/F-61-*.yaml` | queue, recommendation, and draft suggestion contracts | treat these as the canonical execution boundary |
| `test/crm-execution/*.test.js` | queue ranking, workspace hydration, UI, audit, safe action, and draft-boundary coverage | use as the TDD rail for phase delivery |

## Verified Gaps to Address

1. **The foundation exists, but Phase 103 still needs formal closeout-grade execution planning.** The repo has the surface, yet the phase has not been explicitly packaged into a verified, execution-ready plan bundle.
2. **Due-or-overdue and approval-first posture should remain explicit in tests and plan language.** The current engine already prioritizes them, and Phase 103 should preserve that behavior as a locked product truth.
3. **Guided checklist playbooks are present as a safe backend seam but not yet framed as the primary planning target.** This phase should harden that posture without leaking into autonomous AI workflows.
4. **Signal visibility must remain operator-friendly, not just technically correct.** Risk, renewal, and ownership-data cues should remain visible beside explicit unblockers, not hidden in passive reporting.

## Architecture Patterns

### Pattern 1: One execution cockpit, multiple queue lenses
Keep one route and one shared store. Use scope and tab switches to express role-aware differences instead of duplicating sales and success experiences.

### Pattern 2: Explainable recommendations only
Every surfaced recommendation should continue to carry rationale, source signals, urgency, and bounded actions. No hidden scoring or invisible automation paths.

### Pattern 3: Safe mutations with explicit boundaries
Actions should stay limited to task creation, note append, safe field updates, and approval lifecycle changes. Outbound sends remain forbidden in this phase.

### Pattern 4: Guided playbooks over agentic automation
The playbook seam should behave like a checklist and evidence rail for humans, not a self-running autonomous agent layer.

## Likely Task Waves

### Wave 0: Regression-first execution guardrails
- keep red-path coverage for role-aware default scope, tab grammar, due-or-overdue ranking, approval gates, and safe-action boundaries
- preserve suggestion-only draft semantics and immutable evidence framing

### Wave 1: Queue and recommendation hardening
- reinforce the unified queue posture, team-first manager default, and urgency bias
- keep queue ranking and rationale grounded in canonical CRM state and linked tasks or activities

### Wave 2: Detail, evidence, and guided playbook loop
- ensure recommendation selection opens a clear rationale, evidence, task, note, and draft context
- keep playbook and checklist behavior approval-aware and replay-safe

### Wave 3: Final bounded-action coherence
- verify all permitted actions write canonical task, note, record, and audit lineage correctly
- keep outbound and autonomous behaviors explicitly blocked

## Recommended Implementation Order

1. Extend or confirm failing regressions around the queue posture, urgency ordering, and playbook guidance boundary.
2. Harden the central recommendation and ranking layer before touching UI-specific details.
3. Tighten the detail and evidence panes so operators can act with clear rationale and review context.
4. Re-run the full execution test slice before phase execution closeout.

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| queue-specific state | separate sales and success pages | the shared execution store and unified route | keeps triage behavior consistent |
| opaque prioritization | UI-only sorting | `execution.ts` urgency and rationale builders | keeps execution explainable |
| outbound follow-up | ad hoc send actions | suggestion-only draft artifacts | preserves the Phase 104 boundary |
| autonomous playbooks | self-running AI mutations | approval-aware checklist steps in `playbooks.ts` | preserves operator control |

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Scope leak into outbound execution | High | keep forbidden outbound actions explicit in contracts and API guards |
| Opaque ranking drift | High | preserve rationale summaries and source signal visibility in both tests and UI |
| Team scope crossing tenant boundaries | Critical | continue routing through tenant-safe queue and mutation seams only |
| Checklist behavior becoming agentic automation | High | keep playbooks approval-aware, human-triggered, and replay-safe |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Quick run command | `node --test test/crm-execution/crm-queue-ranking.test.js test/crm-execution/crm-team-queue-ui.test.js` |
| Full phase slice command | `node --test test/crm-execution/*.test.js` |
| Current fresh evidence | 17 pass / 0 fail |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXEC-01 | unified, role-aware queueing and bounded next-best actions | unit / integration | execution full phase slice | ✅ |
| EXEC-02 | visible, explainable, and auditable SLA or risk or renewal signals | unit / integration | execution full phase slice | ✅ |

## Sources

### Primary (HIGH confidence)
- current repo artifacts under `lib/markos/crm/`, `components/markos/crm/`, `app/(markos)/crm/execution/`, `api/crm/execution/`, `contracts/F-61-*.yaml`, and `test/crm-execution/`
- Phase 103 decisions captured in `103-CONTEXT.md`

## Metadata

**Confidence breakdown:**
- Architecture: HIGH — grounded in the live execution workspace and contract surfaces
- Validation: HIGH — the full execution regression slice is already green
- Risks: HIGH — derived from explicit product boundaries and tenant-safety rules

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14
