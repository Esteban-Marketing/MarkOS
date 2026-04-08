# Phase 55: Tenant Quota and Billing Failure Closure - Research

**Researched:** 2026-04-03  
**Domain:** Billing entitlements, tenant quota enforcement, billing-failure degradation and recovery  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### 1. Quota model direction

Phase 55 will treat TEN-04 as a hybrid plan-control problem rather than a single hard cap.

Locked product direction:
- Plan pricing should combine prepaid consumption with explicit project capacity.
- Consumption should be tied primarily to token usage and secondarily to agent-run volume.
- Project count remains a first-class plan allowance and a requirement-facing control, not just an internal metric.

Implementation guidance for research and planning:
- Use `allowances.projects` as the hard capacity control for project creation or expansion paths.
- Use `allowances.token_budget` versus `usage_to_date.token_budget` as the primary prepaid consumption budget.
- Keep `agent_runs` as an explicit tracked allowance and enforcement seam, but treat it as a supporting control unless research shows it should become the dominant prepaid limiter.

### 2. Over-limit behavior

When a tenant is over limit, MarkOS should preserve:
- read surfaces
- evidence and invoice visibility
- billing and settings surfaces required for recovery

MarkOS should block:
- protected write actions
- protected execution actions
- premium plugin capabilities that depend on prepaid consumption headroom

This means Phase 55 should extend the current read-safe degradation model into an admin-recoverable over-limit model, rather than a full lockout model.

### 3. Billing failure recovery

Billing-failure holds should restore automatically after successful provider sync.

Guardrail:
- Recovery must still be explicit and auditable in evidence surfaces.
- Automatic restore should not be silent; the hold lifecycle must show failure, degraded or held interval, and restoration event.

### 4. Pricing and margin guidance

Current repository fixture prices are contract placeholders and must not be treated as market-ready public pricing.

Pricing direction locked for downstream research:
- Tie plan economics to a blended gross-margin target of roughly 80% to 90%, not raw pass-through billing.
- Treat project count as the structural platform fee component.
- Treat prepaid token budget as the primary consumption reserve.
- Treat agent-run volume as a supporting fairness or abuse guardrail and possible secondary overage dimension.

Research requirement:
- Derive exact Starter, Growth, and Enterprise quotas from actual provider cost assumptions and observed run shapes before public pricing or overage math is finalized.
- Do not reuse the sample `agent_run.base` fixture value as the customer-facing pricing anchor.

Suggested planning baseline:
- Starter: low project allowance, modest prepaid token budget, strict execution ceiling.
- Growth: higher project allowance, materially larger prepaid token budget, normal production agent usage.
- Enterprise: negotiated project allowance, negotiated prepaid budget, custom overage or top-up policy.

### 5. What Phase 55 must prove

To close TEN-04 and BIL-04, the phase must leave named evidence for:
- project-cap enforcement
- prepaid token-budget exhaustion semantics
- agent or plugin denial semantics under over-limit conditions
- automatic but auditable restoration after provider recovery

### Claude's Discretion

## Open research questions for planning

- Which action family should consume the first explicit prepaid budget: all agent executions, only token-producing executions, or both with different evidence rules?
- Should project-cap exhaustion block only new project creation, or also project reactivation or duplication flows?
- Should over-limit recovery be immediate on first successful sync, or only after a stable success window is recorded?
- What exact internal cost reserve per project is needed to maintain the chosen margin target across Starter, Growth, and Enterprise plans?

### Deferred Ideas (OUT OF SCOPE)

- None stated in `55-CONTEXT.md`.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEN-04 | Tenant-level quotas and rate limits are enforceable per plan tier. | Recommends an explicit hybrid contract: project-cap hard stop, token-budget primary prepaid enforcement, and agent-run secondary fairness throttle with reason-code-specific deny behavior at agent, API, and plugin seams. |
| BIL-04 | Billing failures trigger dunning workflow and entitlement-safe degradation. | Recommends an auditable hold lifecycle: failed provider sync -> hold record + degraded snapshot -> successful sync -> explicit release event + active snapshot, with no silent restore. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Treat `.planning/STATE.md` as the canonical live planning state.
- Keep GSD planning concerns under `.planning/` and MarkOS protocol concerns under `.agent/markos/`; do not mix client overrides outside `.markos-local/`.
- Use existing project test entrypoints: `npm test` or `node --test test/**/*.test.js`.
- Local onboarding runtime remains `node onboarding/backend/server.cjs`.
- Prefer extending existing billing, runtime-context, and test seams instead of introducing parallel enforcement paths.

## Summary

Phase 54 already delivered the hard parts of the billing substrate: MarkOS-owned usage normalization, priced ledger rows, entitlement snapshots, provider-sync attempt persistence, shared request-time entitlement checks, and read-safe degradation for billing evidence. The gap is not missing infrastructure. The gap is missing contract specificity. TEN-04 is still partial because the current evaluator only understands generic status and restricted action arrays, not explicit project-cap, token-budget, or agent-run exhaustion semantics. BIL-04 is still partial because provider sync failure currently collapses to a binary failed-or-active outcome without an explicit lifecycle that proves failure, degraded interval, and release.

The first requirement-facing move should be to make quotas dimensioned, not generic. Project count should be the hard structural cap for net-new project capacity. Token budget should be the first prepaid consumption gate for protected execution and premium plugin actions. Agent runs should remain explicit, but as a narrower secondary fairness control that throttles execution surfaces before it becomes a general billing-policy surrogate. For BIL-04, MarkOS should record a hold lifecycle immediately on sync failure, materialize a degraded entitlement snapshot for runtime gating, and release automatically on the first successful provider sync for the same tenant and billing period, with explicit evidence artifacts for both the failure and the release.

**Primary recommendation:** implement TEN-04 as a combined contract of `projects` hard-cap + `token_budget` primary prepaid enforcement + `agent_runs` secondary execution throttle, and implement BIL-04 as an explicit hold-lifecycle state machine that restores immediately on first successful provider sync but always emits release evidence.

## What Is Already Implemented vs. What Is Missing

| Area | Already implemented | Missing for Phase 55 closure |
|------|---------------------|------------------------------|
| Usage metering | `usage-normalizer.ts`, `usage-ledger.ts`, and reconciliation paths normalize agent and plugin usage into MarkOS-owned priced ledger rows. | No quota evaluator compares `allowances` versus `usage_to_date` by dimension to produce requirement-facing exhaustion semantics. |
| Entitlement runtime | `entitlements.cjs`, `runtime-context.cjs`, onboarding handlers, plugin guards, and orchestrator already share one billing-policy vocabulary. | The vocabulary is too generic: `PLAN_CAP_EXCEEDED`, `ENTITLEMENT_RESTRICTED`, and `BILLING_HOLD_ACTIVE` do not distinguish project, token, and agent-run exhaustion. |
| Protected-action blocking | Agent execution and plugin capability checks already fail closed at runtime. | No explicit deny matrix maps each limit condition to exact protected action families. |
| Billing-failure capture | `billing_provider_sync_attempts`, `tenant_billing_holds`, and `tenant_entitlement_snapshots` tables exist; `provider-sync.cjs` can derive a failed hold outcome. | No explicit degraded/hold/release lifecycle, no release trigger linkage, and no operator-facing proof of automatic restoration. |
| Billing UI evidence | Tenant/operator billing APIs expose ledger-derived invoice and evidence vocabulary. | Operator and tenant surfaces do not yet expose a stable failure -> degraded interval -> release chain specific to BIL-04. |
| Pricing baseline | Fixture and test pricing primitives exist: `agent_run.base`, token input keys, and run-cost telemetry primitives. | Fixture values are contradictory placeholders and cannot be reused as public pricing without a real provider-cost catalog. |

## Standard Stack

### Core

| Library / Module | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/markos/billing/contracts.ts` | in-repo | Canonical billing and entitlement types | This is the contract source of truth for snapshot and invoice vocabulary. |
| `lib/markos/billing/entitlements.ts` + `entitlements.cjs` | in-repo | Runtime entitlement evaluation | These files already drive API, plugin, and agent gating and should remain the single quota-policy source. |
| `onboarding/backend/runtime-context.cjs` | in-repo | Shared execution-context and entitlement resolution | This is the bridge from auth/request context into billing-policy checks. |
| `onboarding/backend/agents/orchestrator.cjs` | in-repo | Protected execution entrypoint | This is the clearest TEN-04 execution seam and a direct BIL-04 proof point. |
| `api/billing/*.js` | in-repo | Tenant/operator billing evidence surfaces | These files must expose BIL-04 lifecycle evidence, not just current state. |

### Supporting

| Module | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lib/markos/plugins/digital-agency/plugin-guard.js` | in-repo | Premium plugin capability denial | Use for token-budget and billing-hold premium-capability enforcement. |
| `test/helpers/billing-fixtures.cjs` | in-repo | Billing contract fixtures | Use to extend quota-state and hold-lifecycle fixtures without inventing test-only vocabularies elsewhere. |
| `supabase/migrations/54_*.sql` | existing | Current billing schema baseline | Use as the baseline; Phase 55 should add new migrations rather than rewriting Phase 54 history. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Central quota evaluation in `entitlements.*` | Per-route quota checks | Faster locally, but it would fragment the billing-policy vocabulary and fail TEN-04 traceability. |
| Token-budget-primary enforcement | Agent-run-primary enforcement | Simpler counter, but contradicts the locked product direction that prepaid consumption should key off token budget first. |
| Immediate restore with explicit evidence | Stable-success window | Slightly more conservative, but adds state-machine complexity without any current repo evidence of flapping or retry storms that justify it. |

**Installation:** no new external dependencies are recommended for this phase.

## Architecture Patterns

### Recommended Project Structure for This Phase

```text
lib/markos/billing/
  contracts.ts              # snapshot and evidence contract extensions
  entitlements.ts           # canonical quota and hold evaluator
  entitlements.cjs          # CommonJS runtime export for existing seams
  enforcement.cjs           # thin wrapper used by tests
  provider-sync.cjs         # hold/release lifecycle derivation
  reconciliation.cjs        # provider sync + evidence stitching
api/billing/
  holds.js                  # hold lifecycle surface
  tenant-summary.js         # tenant-facing recovery visibility
  operator-reconciliation.js# operator-facing hold and release evidence
onboarding/backend/
  runtime-context.cjs       # request-time billing-policy resolution
  handlers.cjs              # submit/regenerate enforcement
  agents/orchestrator.cjs   # execute-task enforcement
lib/markos/plugins/digital-agency/
  plugin-guard.js           # premium capability denial
test/billing/
  *.test.js                 # requirement-specific proof
```

### Pattern 1: Single-source entitlement evaluation
**What:** one evaluator computes status, reason code, and denied surfaces from snapshot allowances and usage.
**When to use:** all request-time or plugin-time quota checks.
**Example:**
```js
const decision = evaluateEntitlementAccess({
  snapshot,
  action: 'execute_task',
  actor_role: 'manager',
});

if (!decision.allowed) {
  throw Object.assign(new Error(decision.reason_code), {
    code: decision.reason_code,
    statusCode: 403,
    decision,
  });
}
```

### Pattern 2: Reason-code-first denial surfaces
**What:** deny behavior is explained by explicit, dimension-specific reason codes rather than generic restricted state.
**When to use:** any action denied because of quota or billing failure.
**Example:**
```js
{
  status: 'restricted',
  reason_code: 'TOKEN_BUDGET_EXHAUSTED',
  restricted_actions: ['execute_task'],
  restricted_capabilities: ['write_campaigns', 'publish_campaigns'],
  quota_state: {
    projects: { used: 2, allowed: 2, exhausted: false },
    token_budget: { used: 500321, allowed: 500000, exhausted: true },
    agent_runs: { used: 201, allowed: 250, exhausted: false },
  },
}
```

### Pattern 3: Append-only evidence chain for billing recovery
**What:** provider sync attempts, hold intervals, entitlement snapshots, and release events form a time-ordered evidence chain.
**When to use:** BIL-04 failure and recovery handling.
**Example:**
```js
failed_sync -> hold_applied -> degraded_snapshot -> succeeded_sync -> hold_released -> active_snapshot
```

### Anti-Patterns to Avoid
- **Generic restriction-only semantics:** `restricted` without a quota dimension or explicit reason code will not close TEN-04.
- **Provider-truth restoration:** restoring access because Stripe says “active” without a linked MarkOS sync attempt and entitlement snapshot breaks the MarkOS-owned billing truth model.
- **Full lockout on over-limit:** blocking billing/settings/evidence surfaces contradicts the locked recovery contract.
- **Editing Phase 54 migrations in place:** add Phase 55 migrations instead; keep the billing evidence trail historically honest.

## Codebase Seam Map

### Wave 1: TEN-04 explicit quota contract

| File | Change | Why this file |
|------|--------|---------------|
| `lib/markos/billing/contracts.ts` | Extend `EntitlementSnapshot` with explicit quota-state metadata and reason-code vocabulary. | Canonical type layer must name the new enforcement contract. |
| `lib/markos/billing/entitlements.ts` | Implement project-cap, token-budget, and agent-run evaluation; generate explicit deny codes and action/capability restrictions. | Canonical TypeScript implementation seam. |
| `lib/markos/billing/entitlements.cjs` | Mirror the same evaluator for existing CommonJS runtime consumers. | Current runtime imports this file directly. |
| `lib/markos/billing/enforcement.cjs` | Keep wrapper behavior aligned with the new evaluator surface. | Current tests import this seam. |
| `onboarding/backend/runtime-context.cjs` | Return the expanded entitlement decision and preserve deny reason propagation. | Shared request bridge into billing policy. |
| `onboarding/backend/handlers.cjs` | Enforce new deny semantics for submit/regenerate paths. | `execute_task` is already checked here. |
| `onboarding/backend/agents/orchestrator.cjs` | Preserve explicit quota-denial behavior for orchestrated execution. | Direct agent runtime TEN-04 evidence seam. |
| `api/tenant-plugin-settings.js` | Allow billing/settings recovery writes, but deny premium-enabling changes when token headroom is exhausted. | Recovery surfaces must stay open while premium-capability expansion closes. |
| `lib/markos/plugins/digital-agency/plugin-guard.js` | Deny premium capabilities by token-budget exhaustion while preserving read routes. | Direct premium plugin seam required by the locked over-limit behavior. |
| `test/billing/entitlement-enforcement.test.js` | Add quota-dimension tests and read-safe preservation proofs. | Primary TEN-04 test family. |
| `test/billing/plugin-entitlement-runtime.test.js` | Prove premium plugin denial semantics under token-budget exhaustion. | Existing plugin entitlement contract test should become dimension-specific. |
| `test/plugin-control.test.js` | Prove settings recovery surfaces remain usable while premium-enabling writes are blocked. | Needed to distinguish settings recovery from premium capability expansion. |
| `test/digital-agency.test.js` | Prove write/publish plugin routes fail with the new quota reason codes. | Existing premium route tests already cover the route families Phase 55 cares about. |
| `test/agents/provider-policy-runtime.test.js` | Prove quota-denied execution surfaces preserve explicit reason codes into orchestrator/runtime calls. | Existing agent runtime seam should remain shared and deterministic. |

**Wave 1 note:** the codebase does not expose an existing project-creation or project-reactivation API seam in the files reviewed. Planning should include one discovery task first. If the route does not exist, Phase 55 should add one canonical project-cap enforcement seam rather than scattering project-cap checks across future surfaces.

### Wave 2: BIL-04 hold and recovery lifecycle

| File | Change | Why this file |
|------|--------|---------------|
| `lib/markos/billing/provider-sync.cjs` | Derive explicit hold-application and hold-release outcomes, not just failed/active binaries. | Current provider sync logic is too shallow for BIL-04 evidence. |
| `lib/markos/billing/reconciliation.cjs` | Stitch provider sync attempts and ledger lineage into recovery-ready operator evidence. | Operator evidence should explain the recovery event from MarkOS lineage. |
| `api/billing/holds.js` | Expose failure, degraded interval, and release information for BIL-04. | Direct lifecycle evidence surface. |
| `api/billing/operator-reconciliation.js` | Show failed sync, active hold, and released hold evidence to operators. | BIL-04 must be auditable from operator surfaces. |
| `api/billing/tenant-summary.js` | Show tenants current hold/recovery status without hiding invoice/evidence surfaces. | Recovery UX must remain visible to the tenant. |
| `supabase/migrations/55_billing_hold_lifecycle.sql` | Add lifecycle linkage fields or append-only hold events for failed sync -> hold -> release evidence. | Current schema lacks explicit release linkage and billing-period correlation for clean audit chains. |
| `test/billing/provider-sync-failure.test.js` | Prove failure-to-hold and success-to-release behavior explicitly. | Primary BIL-04 test family. |
| `test/billing/entitlement-enforcement.test.js` | Prove billing-failure degraded state preserves read surfaces while blocking protected actions, and that restore returns runtime status to active. | BIL-04 runtime surface proof. |
| `test/ui-billing/billing-pages-contract.test.js` | Prove UI evidence rails can show hold history and recovery, not just current invoice state. | Requirement-specific evidence must be visible on billing surfaces. |

### Wave 3: Evidence and closure artifacts

| File | Change | Why this file |
|------|--------|---------------|
| `.planning/phases/55-tenant-quota-and-billing-failure-closure/55-VALIDATION.md` | Replace stub with targeted commands and outcome records. | Phase-specific proof should live in Phase 55, not only by back-editing older artifacts. |
| `.planning/phases/55-tenant-quota-and-billing-failure-closure/55-SUMMARY.md` | Replace stub with actual TEN-04 and BIL-04 outcomes. | Direct evidence summary for closure matrix references. |
| `.planning/projects/markos-v3/CLOSURE-MATRIX.md` | Promote TEN-04 and BIL-04 to requirement-specific evidence references. | Closure artifact must cite direct proof. |
| `.planning/projects/markos-v3/REQUIREMENTS.md` | Refresh traceability notes from partial to satisfied or name exact remaining blocker. | Requirement ledger parity. |
| `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md` | Add a cross-reference only if needed; do not treat this as the primary Phase 55 evidence home. | Phase 54 should remain historically accurate while acknowledging Phase 55 closure. |

## TEN-04 Contract Recommendation

### Recommended first explicit contract

Use a **combination contract**, not a single limiter:

1. **Project cap (`allowances.projects`) is the hard structural cap.**
   - This closes plan-tier tenant capacity.
   - It should deny only net-new project-slot consumption.
   - It should not block reads, billing recovery, invoice visibility, or work inside already-active projects.

2. **Token budget (`allowances.token_budget` vs `usage_to_date.token_budget`) is the primary prepaid budget.**
   - This is the first consumption-facing limiter.
   - It should drive premium feature and execution denials.
   - This is the quota dimension that should carry the primary requirement-facing evidence for TEN-04.

3. **Agent runs (`allowances.agent_runs` vs `usage_to_date.agent_runs`) remain explicit but secondary.**
   - This is a fairness and abuse seam.
   - It should throttle protected execution actions only.
   - It should not become the dominant commercial quota while token budget is still the locked primary prepaid reserve.

### Recommended action-family deny matrix

| Condition | Status | Reason code | Deny | Preserve |
|----------|--------|-------------|------|----------|
| Project cap exhausted | `restricted` | `PROJECT_CAP_EXCEEDED` | project create, project duplicate, project reactivate, any explicit net-new project-slot action | existing project reads, existing project settings, billing/settings recovery, evidence, invoices |
| Token budget exhausted | `restricted` | `TOKEN_BUDGET_EXHAUSTED` | `execute_task`, `regenerate`, token-producing agent actions, premium plugin write/publish actions, premium-enabling plugin settings changes | reads, billing/settings, evidence, invoices, non-premium recovery writes |
| Agent runs exhausted | `restricted` | `AGENT_RUN_LIMIT_EXCEEDED` | `execute_task`, `regenerate`, other explicit agent execution triggers | billing/settings, invoices, evidence, non-execution project administration |
| Billing hold active | `degraded` or `hold` | `BILLING_HOLD_ACTIVE` | protected write actions, protected execution, premium plugin capabilities | reads, billing/settings, evidence, invoices |

### Recommendation on entitlement state shape

Keep the existing `status`, `restricted_actions`, `restricted_capabilities`, and `reason_code`, but add an explicit `quota_state` object. The planner should treat this as a required contract extension.

Recommended shape:

```js
quota_state: {
  projects: {
    used: 2,
    allowed: 2,
    exhausted: true,
    reason_code: 'PROJECT_CAP_EXCEEDED',
  },
  token_budget: {
    used: 500321,
    allowed: 500000,
    exhausted: true,
    reason_code: 'TOKEN_BUDGET_EXHAUSTED',
  },
  agent_runs: {
    used: 201,
    allowed: 250,
    exhausted: false,
    reason_code: null,
  },
}
```

### Recommendation on reason codes

Do not use `PLAN_CAP_EXCEEDED` as the primary Phase 55 contract. Keep it only as a backward-compatible fallback.

Recommended first-class codes:
- `PROJECT_CAP_EXCEEDED`
- `TOKEN_BUDGET_EXHAUSTED`
- `AGENT_RUN_LIMIT_EXCEEDED`
- `BILLING_HOLD_ACTIVE`
- `BILLING_HOLD_RELEASED` as an evidence event or operator-surface lifecycle marker, not necessarily as a runtime deny code

## BIL-04 Hold and Recovery Lifecycle Recommendation

### Recommended state model

Use the existing schema layers for distinct purposes instead of overloading one field:

| Layer | Purpose | Recommended meaning |
|-------|---------|---------------------|
| `billing_provider_sync_attempts` | Raw provider sync evidence | Every failure and success attempt is recorded, keyed to tenant and billing period or invoice context. |
| `tenant_billing_holds` | Administrative hold interval | A hold row represents the failure interval, not merely a current boolean. It should carry failure reason, applied time, and release linkage. |
| `tenant_entitlement_snapshots` | Runtime enforcement state | Runtime should usually materialize `degraded` for billing failure, preserving read surfaces while blocking protected writes/execution. Reserve `hold` for cases that truly require a stronger operator-imposed hold. |

### Recommended lifecycle

1. Provider sync fails for a tenant and billing period.
2. MarkOS records the failed sync attempt.
3. MarkOS opens or updates a billing hold interval.
4. MarkOS materializes a new entitlement snapshot with status `degraded`, explicit `reason_code`, and blocked protected actions/capabilities.
5. Tenant and operator billing surfaces expose the failed sync and degraded snapshot as current recovery state.
6. A later provider sync succeeds for the same tenant and relevant failing billing period.
7. MarkOS records the successful sync attempt.
8. MarkOS releases the hold interval explicitly.
9. MarkOS materializes a new `active` entitlement snapshot.
10. Tenant and operator billing surfaces expose the release event and restored access state.

### Restoration trigger recommendation

**Immediate restore on the first successful provider sync is the right default.**

Rationale:
- It matches the locked discuss-phase decision.
- The current repo has no evidence of flapping behavior that justifies a stable-success window.
- MarkOS already owns the evidence chain; explicit failure and explicit release records are enough to keep the restoration auditable.
- A stable-success window would add more state-machine complexity than the current product surface needs.

### Stable-success window recommendation

**Do not require a stable-success window in Phase 55.**

Add one only if later live evidence shows repeated fail-success-fail oscillation from the billing provider. Phase 55 should optimize for explicitness and auditable recovery, not defensive complexity.

### Audit evidence expectations

BIL-04 should not be considered closed until operator evidence can show this full chain:
- `billing_provider_sync_attempts`: failed attempt with `reason_code`
- `tenant_billing_holds`: hold applied with `applied_at`
- `tenant_entitlement_snapshots`: degraded snapshot with blocked action/capability vocabulary
- `billing_provider_sync_attempts`: later successful attempt
- `tenant_billing_holds`: release with `released_at` and linkage to the successful sync
- `tenant_entitlement_snapshots`: new active snapshot

Operator and tenant surfaces should both preserve invoice and evidence visibility during the degraded interval.

## Pricing and Margin Analysis

### Internal modeling inputs from the current repo

| Primitive | Current repo value | How to interpret it |
|-----------|--------------------|---------------------|
| Token-cost reserve in orchestrator | `ESTIMATED_COST_PER_TOKEN_USD = 0.000001` | This is the only consistent internal runtime cost primitive in code and is suitable for directional planning only. |
| Observed provider-attempt shape in billing tests | `120 input + 45 output = 165 tokens` | Use as the only concrete non-trivial run-shape example currently in repo tests. |
| Orchestrator section count | 6 sequential draft generators | A full onboarding orchestration likely emits multiple provider attempts per high-level run. |
| Fixture `agent_run.base` price | `12.5` USD | Placeholder contract data only. Do not reuse as public pricing. |
| Test fixture run costs | `cost_usd: 0.18` provider attempt, `0.41` run close | Also placeholder contract data; inconsistent with the orchestrator token-cost primitive. |

### Derived planning math

Using only the current runtime cost primitive and the observed 165-token provider-attempt shape:

- One provider attempt at 165 tokens costs approximately **$0.000165** internally.
- A six-section orchestration at one similar attempt per section costs approximately **$0.00099** internally.
- One million tokens costs approximately **$1.00** internally under the current repo primitive.

That creates an important conclusion: **the repo’s billing primitives are currently useful for quota ratios and enforcement design, but not yet trustworthy for launch pricing.** The fixture and test prices are intentionally placeholder contract values, and the internal token-cost primitive is too low to act as a public-price anchor by itself. Public pricing must wait for a real provider-cost catalog and actual usage telemetry. Phase 55 can still recommend a baseline tier structure for planning and enforcement.

### Pricing conclusion

Use **project capacity as the primary subscription-value anchor**, **token budget as the prepaid reserve**, and **agent runs as the fairness guard**.

Do **not** use:
- `agent_run.base = 12.5` as launch pricing,
- `cost_usd: 0.18` or `0.41` test fixtures as actual unit economics,
- agent runs alone as the main commercial meter.

### Recommended baseline tier structure for planning

These are **internal planning baselines**, not market-ready public prices.

| Tier | Suggested monthly baseline | Projects | Token budget | Agent runs | Why this shape |
|------|----------------------------|----------|--------------|------------|----------------|
| Starter | `$39/mo` planning baseline | 2 | 500,000 | 250 | Keeps project capacity tight, gives enough prepaid headroom for real usage, and uses agent runs as a strict but secondary anti-abuse ceiling. |
| Growth | `$129/mo` planning baseline | 10 | 3,000,000 | 1,500 | Makes project count the real step-up, gives materially larger prepaid reserve, and supports normal production agent usage without making agent runs the dominant limiter. |
| Enterprise | `$499+/mo` starting baseline, then negotiated | 25 included, higher by contract | 15,000,000 starting reserve, negotiated higher | 10,000 soft guard, negotiable | Keeps capacity and prepaid budget contract-driven while preserving a concrete enforcement floor in the shared entitlement model. |

### Margin rationale

At the current in-repo token-cost primitive, these tiers all produce extremely high gross margin, which is another signal that the repo’s internal cost assumptions are incomplete for final public pricing. That is acceptable for Phase 55 because the goal is not final price publication. The goal is to make plan-tier quota semantics explicit and internally coherent. The practical planning recommendation is:

- Use the tier table above to wire enforcement and UI copy now.
- Treat public overage math as deferred until a real provider-cost catalog replaces placeholder pricing snapshots.
- If a top-up model is needed before public launch pricing is finalized, use manual or operator-approved top-ups keyed to token budget only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Quota enforcement | Route-by-route custom counters | `entitlements.*` + `runtime-context.cjs` shared evaluation | Prevents quota vocabulary drift across plugin, API, and agent seams. |
| Billing recovery truth | Provider-only “active again” checks | MarkOS-owned sync attempt + hold interval + new entitlement snapshot | Preserves auditable recovery and MarkOS-owned billing truth. |
| Commercial pricing | Public plan prices from fixture unit amounts | Internal baseline tiers now, real provider-cost catalog later | Current fixtures are explicitly placeholder and contradictory. |

**Key insight:** Phase 55 is a contract-closure phase, not a new infrastructure phase. The correct implementation is to make the current substrate explicit, shared, and auditable rather than building separate quota or dunning subsystems.

## Common Pitfalls

### Pitfall 1: Treating all restriction states as equivalent
**What goes wrong:** quota exhaustion, billing hold, and generic restriction all collapse to the same runtime behavior.
**Why it happens:** current `reason_code` and status semantics are too generic.
**How to avoid:** add dimension-specific reason codes and `quota_state`; reserve `degraded` for billing-failure recovery semantics.
**Warning signs:** responses only return `PLAN_CAP_EXCEEDED` or `ENTITLEMENT_RESTRICTED` with no dimensional explanation.

### Pitfall 2: Blocking recovery surfaces when over limit
**What goes wrong:** tenants cannot reach billing, invoices, evidence, or settings needed to recover.
**Why it happens:** developers reuse full-lockout logic for quota enforcement.
**How to avoid:** distinguish protected writes/execution from read/evidence/recovery surfaces.
**Warning signs:** `manage_plugin_settings` or billing routes are denied for downgrade/recovery paths.

### Pitfall 3: Silent restoration on provider success
**What goes wrong:** access returns, but there is no explicit proof of why or when.
**Why it happens:** code treats the latest provider success as enough without writing a release artifact.
**How to avoid:** require a release event or release-linked hold update plus a new active snapshot.
**Warning signs:** operator surfaces show current active state but no prior failure/release chain.

### Pitfall 4: Using agent runs as the commercial primary limiter
**What goes wrong:** TEN-04 technically passes, but the product contract contradicts the locked token-budget-first model.
**Why it happens:** agent runs are easier to count than token usage.
**How to avoid:** make token budget the primary prepaid limiter and keep agent runs narrower in denied action scope.
**Warning signs:** plugin premium capability denial is keyed to agent-run count instead of token headroom.

### Pitfall 5: Reusing Phase 54 fixture values as launch pricing
**What goes wrong:** plan pricing becomes anchored to placeholder contract values that do not reflect real provider cost or margin design.
**Why it happens:** the fixtures are the only explicit numbers in repo today.
**How to avoid:** keep fixture numbers for contract tests only and document planning-baseline pricing separately.
**Warning signs:** any pricing doc or UI copy uses `12.5` as a real public unit rate.

## Code Examples

### Recommended quota-aware deny evaluation

```js
function mapQuotaDecision(snapshot, action, capability) {
  const projectExceeded = snapshot.usage_to_date.projects > snapshot.allowances.projects;
  const tokenExceeded = snapshot.usage_to_date.token_budget > snapshot.allowances.token_budget;
  const runsExceeded = snapshot.usage_to_date.agent_runs > snapshot.allowances.agent_runs;

  if (projectExceeded && action === 'create_project') {
    return { allowed: false, reason_code: 'PROJECT_CAP_EXCEEDED' };
  }

  if (tokenExceeded && (
    action === 'execute_task' ||
    action === 'regenerate' ||
    capability === 'write_campaigns' ||
    capability === 'publish_campaigns'
  )) {
    return { allowed: false, reason_code: 'TOKEN_BUDGET_EXHAUSTED' };
  }

  if (runsExceeded && (action === 'execute_task' || action === 'regenerate')) {
    return { allowed: false, reason_code: 'AGENT_RUN_LIMIT_EXCEEDED' };
  }

  return { allowed: true, reason_code: null };
}
```

### Recommended BIL-04 recovery chain

```js
if (syncAttempt.sync_status === 'failed') {
  writeHoldApplied(syncAttempt);
  writeEntitlementSnapshot({ status: 'degraded', reason_code: 'BILLING_HOLD_ACTIVE' });
}

if (syncAttempt.sync_status === 'succeeded' && matchesOpenHold(syncAttempt)) {
  writeHoldReleased(syncAttempt);
  writeEntitlementSnapshot({ status: 'active', reason_code: null });
}
```

## State of the Art

| Old Approach | Current Recommended Approach | Impact |
|--------------|------------------------------|--------|
| Generic entitlement restriction based on status plus arrays | Dimension-specific quota-state and reason-code evaluation | Makes TEN-04 defensible directly from code and tests. |
| Binary failed-or-active provider sync outcome | Explicit failed -> degraded -> released lifecycle with evidence chain | Makes BIL-04 auditable instead of inferred. |
| Fixture-based price interpretation | Internal baseline tiers plus deferred public pricing | Prevents placeholder values from leaking into commercial commitments. |

**Deprecated/outdated for this phase:**
- Generic `PLAN_CAP_EXCEEDED` as the first-class quota contract.
- Provider-only restoration logic without release evidence.
- Treating `agent_run.base` fixture pricing as customer-facing economics.

## Open Questions

1. **Where is the canonical project-creation or project-reactivation seam?**
   - What we know: reviewed Phase 55 runtime files and did not find an existing project-create API or handler in the billing-facing seams.
   - What's unclear: whether project creation lives in an app-route/UI path outside the current phase inputs, or whether it still needs to be introduced.
   - Recommendation: start Wave 1 with a short discovery task; if absent, add one canonical project-cap seam and test it explicitly.

2. **Should premium plugin enablement remain available on Starter when token headroom exists?**
   - What we know: the locked decision says premium plugin capabilities tied to prepaid headroom must be blocked when over limit.
   - What's unclear: whether plan-tier packaging itself should gate premium plugins independent of quota headroom.
   - Recommendation: keep Phase 55 focused on prepaid-headroom gating only; defer packaging strategy beyond quota enforcement.

3. **When should public pricing be finalized?**
   - What we know: current repo fixture numbers are placeholders and the internal token-cost primitive is not enough for launch pricing.
   - What's unclear: true provider mix, support cost, infra overhead, and run-shape distribution in live usage.
   - Recommendation: ship Phase 55 with internal baseline tiers only, then re-run tier math after a real provider-cost catalog and live usage telemetry land.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified beyond the existing project runtime and Node test runner).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | none |
| Quick run command | `node --test test/billing/entitlement-enforcement.test.js test/billing/provider-sync-failure.test.js test/billing/plugin-entitlement-runtime.test.js test/plugin-control.test.js test/digital-agency.test.js test/agents/provider-policy-runtime.test.js` |
| Full suite command | `node --test test/billing/*.test.js test/plugin-control.test.js test/digital-agency.test.js test/agents/provider-policy-runtime.test.js test/ui-billing/billing-pages-contract.test.js` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEN-04 | Project cap denies net-new project-slot consumption | unit / contract | `node --test test/billing/entitlement-enforcement.test.js` | ❌ Wave 1 addition needed |
| TEN-04 | Token budget exhaustion blocks execution and premium plugin capabilities | unit / contract | `node --test test/billing/entitlement-enforcement.test.js test/billing/plugin-entitlement-runtime.test.js test/plugin-control.test.js test/digital-agency.test.js` | ✅ / expand |
| TEN-04 | Agent-run exhaustion throttles execution but preserves recovery surfaces | unit / contract | `node --test test/billing/entitlement-enforcement.test.js test/agents/provider-policy-runtime.test.js` | ✅ / expand |
| BIL-04 | Failed provider sync produces degraded runtime state and hold evidence | unit / contract | `node --test test/billing/provider-sync-failure.test.js test/billing/entitlement-enforcement.test.js` | ✅ / expand |
| BIL-04 | Successful provider sync releases hold and restores active snapshot explicitly | unit / contract | `node --test test/billing/provider-sync-failure.test.js test/billing/entitlement-enforcement.test.js` | ❌ Wave 2 addition needed |
| BIL-04 | Billing UI evidence rails expose failure and release lifecycle | contract | `node --test test/ui-billing/billing-pages-contract.test.js` | ✅ / expand |

### Sampling Rate

- **Per task commit:** `node --test test/billing/entitlement-enforcement.test.js test/billing/provider-sync-failure.test.js test/billing/plugin-entitlement-runtime.test.js`
- **Per wave merge:** `node --test test/billing/*.test.js test/plugin-control.test.js test/digital-agency.test.js test/agents/provider-policy-runtime.test.js test/ui-billing/billing-pages-contract.test.js`
- **Phase gate:** Full suite green before updating closure artifacts

### Wave 0 Gaps

- [ ] Add explicit project-cap test coverage to `test/billing/entitlement-enforcement.test.js` or a new focused project-cap contract test.
- [ ] Add explicit successful-sync release coverage to `test/billing/provider-sync-failure.test.js`.
- [ ] Add tenant/operator billing UI evidence assertions for restored state in `test/ui-billing/billing-pages-contract.test.js`.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/55-tenant-quota-and-billing-failure-closure/55-CONTEXT.md` - locked discuss-phase decisions and closure expectations
- `.planning/projects/markos-v3/REQUIREMENTS.md` - TEN-04 and BIL-04 requirement wording and current status
- `.planning/projects/markos-v3/CLOSURE-MATRIX.md` - current partial-closure rationale
- `.planning/projects/markos-v3/technical-specs/BILLING-METERING.md` - billing model and dunning requirement baseline
- `.planning/phases/54-billing-metering-and-enterprise-governance/54-VERIFICATION.md` - what Phase 54 already proved
- `lib/markos/billing/contracts.ts` - canonical billing and entitlement contract types
- `lib/markos/billing/entitlements.ts` and `lib/markos/billing/entitlements.cjs` - current shared billing-policy evaluator
- `lib/markos/billing/provider-sync.cjs` and `lib/markos/billing/reconciliation.cjs` - current provider-sync and reconciliation behavior
- `api/billing/holds.js`, `api/billing/operator-reconciliation.js`, `api/billing/tenant-summary.js` - current billing evidence surfaces
- `api/tenant-plugin-settings.js`, `onboarding/backend/runtime-context.cjs`, `onboarding/backend/handlers.cjs`, `onboarding/backend/agents/orchestrator.cjs`, `lib/markos/plugins/digital-agency/plugin-guard.js` - live enforcement seams
- `test/billing/*.test.js`, `test/plugin-control.test.js`, `test/digital-agency.test.js`, `test/agents/provider-policy-runtime.test.js` - current proof surface and gap map
- `supabase/migrations/54_billing_foundation.sql`, `54_entitlement_enforcement.sql`, `54_billing_provider_sync.sql` - schema capabilities and current lifecycle limits

### Secondary (MEDIUM confidence)
- `.planning/phases/55-tenant-quota-and-billing-failure-closure/55-01-PLAN.md`, `55-02-PLAN.md`, `55-03-PLAN.md` - existing planning intent and wave decomposition

### Tertiary (LOW confidence)
- None. No external-web claims were needed for this phase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all recommendations are based on existing in-repo runtime and schema seams.
- Architecture: HIGH - the shared evaluator, hold tables, runtime-context bridge, and plugin/agent entrypoints are all directly present in code.
- Pitfalls: HIGH - each pitfall comes from current contract gaps visible in code or current closure artifacts.
- Pricing and margin baseline: MEDIUM - the repo contains enough primitives for directional tier design, but current unit prices and cost numbers are clearly placeholders and internally inconsistent.

**Research date:** 2026-04-03  
**Valid until:** 2026-04-10
