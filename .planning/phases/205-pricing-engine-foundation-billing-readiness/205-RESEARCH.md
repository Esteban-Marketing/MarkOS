# Phase 205 Research — Pricing Engine Foundation + Billing Readiness

**Phase:** 205 — Pricing Engine Foundation + Billing Readiness
**Status:** Prescriptive implementation analysis (rewritten 2026-04-23)
**Downstream consumer:** `/gsd-plan-phase 205 --research` and the 8 existing plans (205-01 through 205-08)
**Doctrine precedence:** `obsidian/brain/Pricing Engine Canon.md` wins on product shape. `207-01-CONTRACT-LOCK.md` wins on AgentRun/cost integration shape. REQUIREMENTS.md wins on PRC-01..09, BILL-01, BILL-02, QA-01..15 coverage.

This document is not a scaffold of open questions. It is a set of locked decisions for downstream plans to consume verbatim. Open items are consolidated at the end under `## Open Decisions (Require Sign-off)`.

---

## Standard Stack

Downstream plans MUST use these libraries / constants and nothing else for the listed concerns. No competing choices.

| Concern | Locked choice | Notes |
|---|---|---|
| Schema definition + runtime validation | `zod@^3.22` | Same version already used in `lib/markos/contracts/*.ts`; matches 207-01 AgentRun v2 pattern. |
| Currency arithmetic | Integer `usd_micro` (1 USD = 1_000_000 micro) | Mirrors `estimated_cost_usd_micro` / `actual_cost_usd_micro` in 207-01. Never `number` for money. |
| Contract format | OpenAPI 3.0.3 + `x-markos-meta` block | Per `obsidian/reference/Contracts Registry.md`. Generated via `bin/extract-flows.cjs` + `bin/validate-flow-contracts.cjs`. |
| DB | Supabase Postgres + RLS policies + append-only history tables | Mirrors migrations 51 (`multi_tenant_foundation`), 54 (`billing_foundation`), 82 (`audit_log_hash_chain`). |
| Approval pattern | Redis-backed one-time token (GETDEL, 5-min TTL) via `lib/markos/mcp/approval.cjs` | Do not invent a second approval store. Pricing mutations reuse the existing token pattern and plumb `task_id` handoff through `markos_agent_tasks` (owned by Phase 207 Plan 04). |
| Billing ledger reuse | `lib/markos/billing/usage-normalizer.ts` + `usage-ledger.ts` + `pricing-catalog.ts` | Extend, do not fork. `pricing-catalog.ts` becomes a read-adapter fed by Pricing Engine, not a source of truth. |
| Stripe SDK | `stripe@^17` (Node SDK) **only in 205-07** | Stripe is a handoff target, not a foundation dependency. 205-01..06 ship without importing `stripe`. |
| Stripe shapes | Product + Price + Meter (2024 metered-billing GA API) | Use `stripe.billing.meters` + `stripe.prices.create({billing_scheme:'per_unit', recurring:{usage_type:'metered'}})`. Do not use legacy `usage_records`. |
| Crawler cadence | pg_cron job enqueuing async work via Vercel Queues (Phase 207 queue substrate) | Do not hand-roll a cron loop in Next server routes. Tier-1 daily, tier-2 weekly per Pricing Engine Canon §Four Data Layers. |
| Pricing test experimentation framework | Hand-defined Zod schema + stop-conditions, NO third-party experimentation SaaS | Rationale: 2026 SOC2-readiness track (Phase 206) forbids routing pricing decisions through a vendor we don't control. |
| Test runner | `vitest` for unit/contract/state-machine; `playwright` for operator flows; `node --test` for legacy | Per `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`. |
| Placeholder literal | `{{MARKOS_PRICING_ENGINE_PENDING}}` (exact string) | Per Pricing Engine Canon §Canonical Placeholder. Treated as a sentinel — lint rule must not rewrite it. |

---

## Architecture Patterns

### Pattern 1: Approval-Gated Recommendation Record (mirrors F-87 tenant-switcher + F-100 webhook-breaker)

Every `PricingRecommendation` and `PriceTest` write MUST follow this ladder:

```text
draft (no approval) -> proposed (operator review) -> approved|rejected|modified|deferred (terminal-in-decision-state)
                                                 \\-> activated (only after `approved` AND approval token consumed)
```

Skeleton (mirrors `lib/markos/mcp/approval.cjs` call pattern):

```ts
// 1. Agent/operator writes proposal; state=proposed, no provider mutation.
const rec = await insertPricingRecommendation(supabase, tenantId, {
  state: 'proposed',
  evidence: [...],
  options: [...],
  projected_impact: {...},
  risk: 'medium',
  reversibility: 'reversible',
});

// 2. Operator clicks "Approve". Route requires an issued approval token bound to (session.id, 'pricing.recommendation.approve').
const approved = await checkApprovalToken(redis, token, session, 'pricing.recommendation.approve');
if (!approved) return { error: 'approval_required' };

// 3. Transition. Any state change emits an immutable audit row keyed on (tenant_id, recommendation_id, seq).
await transitionRecommendation(supabase, rec.recommendation_id, { to: 'approved', actor_id, reason });

// 4. Only on `approved` may the downstream billing/Stripe effect fire.
//    The effect itself is an `AgentSideEffect` (207-01 §Side-effect idempotency) with effect_type='price.change'.
```

### Pattern 2: Placeholder-Safe Read Models

Any pricing read surface (API, MCP tool, UI card, billing copy) MUST return one of:
- a frozen snapshot of an **approved** `PricingRecommendation`, OR
- the literal string `{{MARKOS_PRICING_ENGINE_PENDING}}`.

Reads NEVER return in-flight `proposed` recommendations, and NEVER return a hard-coded public tier price. Lint rule (Plan 205-06 Task): grep `/Growth Monthly|Starter|Professional|\$\d+/` in `app/(markos)/settings/billing/**` and `api/billing/**` must return zero occurrences after this phase.

### Pattern 3: AgentRun v2 Cost Context Write

Per 207-01 §8: the JSONB column `markos_agent_runs.pricing_engine_context` accepts either `{}` (default), `{"placeholder":"{{MARKOS_PRICING_ENGINE_PENDING}}"}`, or a full `PricingEngineContext` blob (schema below). Pricing Engine approval emit path writes the blob; no other code may mutate this column. This is the downstream contract 207 expects from 205.

### Pattern 4: Source-Quality-Scored Evidence Records

Every row in `markos_pricing_knowledge` must carry `source_url`, `capture_method`, `captured_at`, `extraction_confidence ∈ [0,1]`, `source_quality_score ∈ [0,1]`, and `evidence_gaps text[]`. Raw scrape output is stored as `raw_payload_ref` (content-addressed hash) and NEVER exposed to the product surface or agent prompts directly. Phase 209's `EvidenceMap` table will later reference these records by `(tenant_id, knowledge_id)`; the foreign key is pre-declared nullable in 205-01 so 209 does not require an ALTER.

### Pattern 5: PRC Agent Stub Pattern

PRC agents (`MARKOS-AGT-PRC-01..06`) are REGISTERED (in `lib/markos/agents/registry-v2.ts`, schema from 207-01) but remain `status: planned` through Phase 205. They emit markdown recommendation drafts via existing `run-engine.cjs` adapter, feeding into `PricingRecommendation` inserts. Autonomous execution (bounded auto-approve for `PRC-02`) is explicitly **deferred to Phase 213+**.

---

## Don't Hand-Roll

These are traps. Each one has cost another team weeks somewhere.

1. **Do not hand-roll currency arithmetic.** Use integer `usd_micro` on every field. Floats silently lose cents; decimals lose locale context. Helper: `fromUsdMicro(n)` / `toUsdMicro(str)` in a new `lib/markos/pricing/money.ts`.
2. **Do not hand-roll an approval token store.** Reuse `lib/markos/mcp/approval.cjs` — the Redis GETDEL + session+tool binding is already hardened. A parallel store would split audit truth.
3. **Do not hand-roll competitor web scraping.** Use scheduled pg_cron → Vercel Queue → typed fetch + structured-extraction pass (LLM via existing MCP `cost-meter` budget). Write extraction output through the same `source_quality_score` gate as manual entry.
4. **Do not hand-roll Stripe metered-usage plumbing.** `stripe.billing.meters` (2024 GA) replaces the deprecated `UsageRecord` API. Attempting to reimplement the old flow against the new Meter resource causes silent double-counting.
5. **Do not hand-roll a price-test stats library.** Ship explicit stop-conditions (`min_sample_size`, `max_duration_days`, `margin_floor_breach`, `conversion_lift_threshold`) as declarative Zod, not inline math. Significance testing can wait for Phase 213 dogfood.
6. **Do not hand-roll Zod schema composition for pricing objects.** Import all base Zod types (money, tenant_id, timestamps, audit envelope) from `lib/markos/contracts/common.ts` — same module the AgentRun v2 schemas use. Duplicating these creates shape drift.
7. **Do not hand-roll competitor page diffing.** Use `crypto.createHash('sha256')` content fingerprints with a separately-stored extracted-field diff. Semantic diff is out of scope for 205; byte-fingerprint + field-level diff is enough for the alert gate.
8. **Do not hand-roll an experimentation framework.** No ProfitWell / Price Intelligently SDK. No Optimizely. A declarative `PriceTest` Zod record + existing approval pattern is the entire MVP.

---

## Common Pitfalls

Every verification step in the 8 plans should explicitly check for these.

1. **Overwriting active-subscriber prices without a grace period.** An approved `PricingRecommendation` affecting `line_item_type='subscription_base'` must snapshot the previous price into `superseded_pricing_snapshot_id` and apply only to new subscriptions unless the recommendation explicitly flags `affects_existing_subscribers=true` with a secondary approval. Plan 205-07 verification.
2. **Leaking competitor raw payload into invoice UI.** Invoice renderers must explicitly reject any field sourced from `pricing_subject='competitor'`. Plan 205-07 + 205-06 verification.
3. **Cross-tenant pricing knowledge bleed.** Every `markos_pricing_*` table ships with RLS `USING (tenant_id = current_setting('app.tenant_id'))`. Plan 205-01 verification includes a cross-tenant isolation test (mirrors 203 webhook tests).
4. **Cost-model absence silently producing a recommendation.** If `markos_cost_models.status != 'ready'` for the tenant, `PricingRecommendation` insert MUST be rejected with error `PRICING_COST_MODEL_MISSING`. Plan 205-02 verification.
5. **Floating-point margin drift.** Margin math on BYOK, token cost, and overage must stay in `usd_micro`. Converting to float for display is allowed; storing it as float is forbidden. Plan 205-02 verification.
6. **Approval token replay across pricing surfaces.** The token binding includes the exact tool name (`pricing.recommendation.approve` vs `pricing.test.activate` vs `pricing.page.publish`). Do not share a single `pricing.mutate` token namespace. Plan 205-04 / 205-05 verification.
7. **Stripe price object created from a `proposed` (unapproved) recommendation.** Plan 205-07 MUST refuse if `recommendation.state !== 'approved'` AND `recommendation.decision.actor_id !== null`.
8. **Static pricing residue surviving the migration.** A grep gate in CI (Plan 205-06 Task) must show zero hard-coded tier names or dollar amounts outside `obsidian/**`, `docs/**` (historical), and `test/**/fixtures/**`.
9. **Scraping in violation of target site terms.** Phase 205 ships with an allowlist + robots.txt respect + manual-entry fallback. No bulk crawl is enabled in 205; only tenant-initiated, per-URL, rate-limited fetch. Plan 205-03 verification.
10. **Pricing MCP tools exposed before RLS proof.** Plan 205-05 ships the 6 MCP tools as read-only first, with tenant isolation tests landing before mutating endpoints are wired (Plan 205-07). Do not merge 205-07 before 205-05 green.

---

## Code Examples

### Example 1: `PricingRecommendation` Zod schema (locked shape, 205-01)

```ts
// lib/markos/contracts/pricing.ts — produced by 205-01
import { z } from 'zod';

export const PricingSubject = z.enum(['own', 'competitor', 'market', 'strategic']);
export const BusinessType = z.enum(['saas', 'ecommerce', 'services']);
export const RecommendationState = z.enum([
  'draft', 'proposed', 'approved', 'rejected', 'modified', 'deferred', 'activated', 'archived',
]);
export const RecommendationType = z.enum([
  'price_change', 'packaging_change', 'strategy_shift', 'test_design', 'monitoring_alert',
]);
export const RiskLevel = z.enum(['low', 'medium', 'high', 'margin_destroying']);
export const Reversibility = z.enum(['reversible', 'bounded_reversible', 'irreversible']);

export const PricingEvidence = z.object({
  evidence_id: z.string(),
  knowledge_id: z.string().nullable(),       // FK markos_pricing_knowledge
  source_url: z.string().url().nullable(),
  source_quality_score: z.number().min(0).max(1),
  extraction_confidence: z.number().min(0).max(1),
  captured_at: z.string().datetime(),
  note: z.string().nullable(),
});

export const PricingOption = z.object({
  option_id: z.string(),
  label: z.string(),
  proposed_unit_price_usd_micro: z.number().int().nonnegative(),
  proposed_value_metric: z.string().nullable(),
  projected_impact_usd_micro_per_month: z.number().int(),
  projected_margin_bps: z.number().int(),   // basis points; 1% = 100
  notes: z.string().nullable(),
});

export const PricingRecommendation = z.object({
  recommendation_id: z.string(),
  tenant_id: z.string(),
  business_type: BusinessType,
  recommendation_type: RecommendationType,
  state: RecommendationState,
  cost_model_snapshot_id: z.string(),        // FK markos_cost_models.snapshot_id (required)
  current_state: z.record(z.unknown()),
  market_context: z.record(z.unknown()),
  cost_context: z.record(z.unknown()),
  options: z.array(PricingOption).min(1),
  chosen_option_id: z.string().nullable(),
  projected_impact: z.record(z.unknown()),
  risk: RiskLevel,
  confidence: z.number().min(0).max(1),
  reversibility: Reversibility,
  evidence: z.array(PricingEvidence),
  assumptions: z.array(z.string()),
  affects_existing_subscribers: z.boolean().default(false),
  superseded_pricing_snapshot_id: z.string().nullable(),
  decision: z.object({
    actor_id: z.string().nullable(),
    decided_at: z.string().datetime().nullable(),
    reason: z.string().nullable(),
  }),
  approval_token_consumed: z.string().nullable(),  // which token authorized activation
  generated_by_agent_token: z.string().nullable(), // e.g. 'MARKOS-AGT-PRC-04'
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type PricingRecommendation = z.infer<typeof PricingRecommendation>;
```

### Example 2: Stripe 2024 metered billing emit (Plan 205-07 only)

```ts
// lib/markos/billing/stripe-sync.ts — extended by 205-07
// New: createStripePriceFromApprovedRecommendation()
import Stripe from 'stripe';

export async function createStripePriceFromApprovedRecommendation(
  stripe: Stripe,
  rec: PricingRecommendation,
): Promise<{ price_id: string; meter_id?: string }> {
  if (rec.state !== 'approved') throw new Error('PRICING_RECOMMENDATION_NOT_APPROVED');
  if (!rec.decision.actor_id) throw new Error('PRICING_RECOMMENDATION_NO_DECISION_ACTOR');
  const option = rec.options.find((o) => o.option_id === rec.chosen_option_id);
  if (!option) throw new Error('PRICING_RECOMMENDATION_NO_CHOSEN_OPTION');

  // Metered? create a Meter first (2024 GA API).
  let meter_id: string | undefined;
  if (option.proposed_value_metric) {
    const meter = await stripe.billing.meters.create({
      display_name: option.label,
      event_name: `markos_${rec.tenant_id}_${option.option_id}`,
      default_aggregation: { formula: 'sum' },
      customer_mapping: { event_payload_key: 'stripe_customer_id', type: 'by_id' },
    });
    meter_id = meter.id;
  }

  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: Math.round(option.proposed_unit_price_usd_micro / 10_000), // micro -> cents
    recurring: { interval: 'month', usage_type: meter_id ? 'metered' : 'licensed', meter: meter_id },
    metadata: {
      markos_recommendation_id: rec.recommendation_id,
      markos_approval_token: rec.approval_token_consumed ?? '',
    },
  });
  return { price_id: price.id, meter_id };
}
```

### Example 3: Approval-gated transition (reuses existing approval.cjs)

```ts
// lib/markos/pricing/approval-bridge.ts — produced by 205-04
import { checkApprovalToken } from '../mcp/approval.cjs';

export async function activatePriceTest({
  supabase, redis, session, token, test_id,
}: {...}): Promise<{ ok: true } | { ok: false; error: string }> {
  const authorized = await checkApprovalToken(redis, token, session, 'pricing.test.activate');
  if (!authorized) return { ok: false, error: 'approval_required' };

  // Emit AgentSideEffect for idempotency (207-01 §7 uniqueness key preserved).
  // effect_type='price.change' — same category 207-01 reserves for pricing mutations.
  return await supabase.rpc('markos_activate_price_test', { test_id, actor_id: session.actor_id });
}
```

---

## Codebase Research Addendum

Grounded inspection of each relevant file. Every claim references a real path that exists on disk (verified 2026-04-23).

### `lib/markos/billing/contracts.ts`
- **Current behavior:** Defines `BillingUsageEvent`, `BillingUsageLedgerRow`, `EntitlementSnapshot`, `InvoiceLineItem`. No pricing-strategy types.
- **Gap:** No import path for `PricingRecommendation`, `PricingEngineContext`, or `PricingKnowledge`. Ledger types reference `pricing_snapshot_id` but there is no pricing-owned table it can point to — only the billing-owned `billing_pricing_snapshots` in migration 54.
- **Proposed contract:** New sibling module `lib/markos/contracts/pricing.ts` (205-01) exports the 5 Zod schemas below. `contracts.ts` adds `pricing_recommendation_id: string | null` on `BillingUsageLedgerRow` and `InvoiceLineItem` so lineage back to a strategy decision is preserved (ALTER via migration 113).

### `lib/markos/billing/usage-normalizer.ts`
- **Current behavior:** `buildUsageDedupeKey`, `normalizePluginUsageEvent`, agent-run normalization. Already captures provider/model/tokens/cost.
- **Gap:** Does not emit `pricing_engine_context` for agent runs, and 207-01 §8 requires it.
- **Proposed contract:** Add `normalizeAgentRunCost(run, pricingContext?)` that accepts an optional `PricingEngineContext` blob and writes it onto the billing event. The export becomes the single call site 207-05 depends on.

### `lib/markos/billing/pricing-catalog.ts`
- **Current behavior:** `buildPricingSnapshot`, `resolvePricingCatalogUnitPrice` — a strict validator over `unit_prices` dict. Used by billing to explain per-unit prices on invoices.
- **Gap:** It is a billing-side lookup table, not a strategic pricing engine. Treated as authoritative by invoice code today.
- **Proposed contract:** Keep as an adapter. Plan 205-06 + 205-07 retarget it to read from the latest `PricingRecommendation` snapshot (approved state) per `pricing_key`, with `{{MARKOS_PRICING_ENGINE_PENDING}}` fallback when no approval exists. No public API change.

### `lib/markos/billing/invoice-line-items.ts`
- **Current behavior:** Produces line items from ledger rows. No linkage to pricing strategy.
- **Gap:** Invoice does not explain **why** this price.
- **Proposed contract:** Add nullable `pricing_recommendation_id` and `pricing_engine_context_ref` columns on `markos_billing_invoice_line_items` (migration 113). Render in operator invoice UI (Plan 205-06) only; never on tenant-facing invoice.

### `lib/markos/billing/stripe-sync.ts`
- **Current behavior:** `recordStripeSyncAttempt`, `syncBillingProjectionToStripe` — preview-only stubs, no real Stripe client call.
- **Gap:** No path from approved recommendation to Stripe Product/Price/Meter.
- **Proposed contract:** Plan 205-07 adds `createStripePriceFromApprovedRecommendation` (see Example 2) and `reconcileApprovedRecommendationToStripe`. Real Stripe SDK import lives here and only here.

### `lib/markos/mcp/cost-table.cjs`
- **Current behavior:** Hard-coded tool cost table + free/paid tier caps (`FREE_TIER_CAP_CENTS=100`, `PAID_TIER_CAP_CENTS=10000`). Has TODO referencing "Phase 205 Stripe metering".
- **Gap:** Caps are static; not sourced from approved pricing.
- **Proposed contract:** Plan 205-05 adds a `resolveTenantDailyCap(tenantId)` that reads `markos_pricing_recommendations` (state=approved, type=packaging_change) and falls back to the current static caps if none exists. Placeholder-safe.

### `lib/markos/mcp/cost-meter.cjs`
- **Current behavior:** Per-session cost accounting with daily cap admission.
- **Gap:** Does not distinguish tenant pricing tier vs default tier.
- **Proposed contract:** Same as above — consumes `resolveTenantDailyCap` when available. No schema change.

### `lib/markos/mcp/approval.cjs`
- **Current behavior:** Redis-backed one-time approval token with GETDEL + session+tool binding. 5-min TTL.
- **Gap:** None. Pricing reuses as-is.
- **Proposed contract:** 205-04 registers 4 new approval-protected tool names: `pricing.recommendation.approve`, `pricing.test.activate`, `pricing.page.publish`, `pricing.billing.sync`. Token issuance lives in API routes (Plan 205-05) not in this module.

### `api/billing/tenant-summary.js`
- **Current behavior:** Returns static sample `Growth Monthly` summary.
- **Gap:** Confidently presents static pricing truth. Read by UI page-shell.
- **Proposed contract:** Plan 205-06 rewrites to return engine-backed snapshot OR `{{MARKOS_PRICING_ENGINE_PENDING}}` with explicit `summary_source: 'engine' | 'placeholder'`.

### `api/billing/operator-reconciliation.js`, `api/billing/holds.js`
- **Current behavior:** Reconciliation + hold-state evidence surfaces. Already evidence-first.
- **Gap:** Recovery evidence should reference the pricing decision history when a price change triggered the hold.
- **Proposed contract:** Plan 205-07 adds optional `linked_pricing_recommendation_id` field to both payloads.

### `app/(markos)/settings/billing/page-shell.tsx`
- **Current behavior:** Renders hard-coded `Growth Monthly` title, static `usageRows` array, static `invoices` array, static `$150.00` total. Title is the marketing-facing plan name.
- **Gap:** Canonical pricing residue the Pricing Engine Canon and CONTEXT.md explicitly call out.
- **Proposed contract:** Plan 205-06 replaces in three steps: (1) prop-drive from `tenant-summary.js`; (2) render `{{MARKOS_PRICING_ENGINE_PENDING}}` labeled clearly as placeholder state when no approved recommendation exists; (3) preserve hold-state copy and evidence language. Storybook fixtures become placeholder-state + approved-state variants, not a baked `Growth Monthly`.

### `app/(markos)/admin/billing/page.tsx`
- **Current behavior:** Operator-facing billing admin page; reconciliation language is good.
- **Gap:** No operator view of pricing decision history driving this invoice.
- **Proposed contract:** Plan 205-06 adds a collapsible "Pricing decision lineage" panel fed by `PricingRecommendation.recommendation_id` on linked invoice rows.

### `supabase/migrations/54_billing_foundation.sql`
- **Current behavior:** Creates `billing_periods`, `billing_pricing_snapshots`, `billing_usage_events`, `billing_usage_ledger_rows`. Tenant-scoped, RLS-ready.
- **Gap:** `billing_pricing_snapshots` is billing-owned, not strategy-owned; no FK to a pricing recommendation.
- **Proposed contract:** Migration 113 adds nullable `source_pricing_recommendation_id uuid references markos_pricing_recommendations(recommendation_id)` to `billing_pricing_snapshots`. No backfill; historical rows stay NULL.

### `lib/markos/governance/evidence-pack.ts`
- **Current behavior:** Aggregates billing/approval/identity/audit/provider-sync evidence for governance exports.
- **Gap:** No pricing evidence family yet.
- **Proposed contract:** Plan 205-01 reserves a `pricing` slot in the evidence-pack schema returning an empty array until 205-04 lands. 209 (EvidenceMap) can later promote.

---

## Proposed Contract Direction

All 5 primary objects, Zod-shaped in AgentRun v2 style. Downstream plans import from `lib/markos/contracts/pricing.ts` and MUST NOT redefine locally.

### `PricingCostModel`

```ts
export const PricingCostModelStatus = z.enum(['missing', 'partial', 'ready', 'stale']);

export const PricingCostModel = z.object({
  cost_model_id: z.string(),
  snapshot_id: z.string(),             // append-only; one row per significant change
  tenant_id: z.string(),
  business_type: BusinessType,
  status: PricingCostModelStatus,
  // SaaS fields (null for non-saas)
  saas_infra_usd_micro_per_month: z.number().int().nonnegative().nullable(),
  saas_llm_api_usd_micro_per_run: z.number().int().nonnegative().nullable(),
  saas_support_usd_micro_per_tenant_month: z.number().int().nonnegative().nullable(),
  saas_payment_fee_bps: z.number().int().nonnegative().nullable(),
  saas_target_gross_margin_bps: z.number().int().nonnegative().nullable(),
  saas_breakeven_arpu_usd_micro: z.number().int().nonnegative().nullable(),
  // eCommerce fields
  ecom_cogs_usd_micro_per_unit: z.number().int().nonnegative().nullable(),
  ecom_fulfillment_usd_micro_per_unit: z.number().int().nonnegative().nullable(),
  ecom_returns_bps: z.number().int().nonnegative().nullable(),
  ecom_platform_fee_bps: z.number().int().nonnegative().nullable(),
  // Services fields
  svc_fully_loaded_labor_usd_micro_per_hour: z.number().int().nonnegative().nullable(),
  svc_utilization_bps: z.number().int().nonnegative().nullable(),
  svc_overhead_multiplier_bps: z.number().int().nonnegative().nullable(),
  // Derived
  pricing_floor_usd_micro: z.number().int().nonnegative(),
  pricing_floor_confidence: z.number().min(0).max(1),
  byok_discount_posture: z.enum(['not_applicable', 'reduce_price', 'reduce_margin_risk', 'recommendation_input']),
  missing_inputs: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
```

### `PricingKnowledgeObject`

```ts
export const PricingChangeMagnitude = z.enum(['none', 'cosmetic', 'minor', 'major']);

export const PricingKnowledge = z.object({
  knowledge_id: z.string(),
  tenant_id: z.string(),
  subject: PricingSubject,              // own|competitor|market|strategic
  business_type: BusinessType,
  subject_name: z.string(),             // e.g. "Attio"
  pricing_model: z.string(),            // "tiered", "per_seat", "usage_based", "hybrid", ...
  tiers: z.array(z.record(z.unknown())), // normalized tier shape
  value_metric: z.string().nullable(),
  feature_gates: z.record(z.unknown()),
  discounts: z.record(z.unknown()),
  freemium_shape: z.record(z.unknown()).nullable(),
  // Evidence
  source_url: z.string().url().nullable(),
  source_quality_score: z.number().min(0).max(1),
  capture_method: z.enum(['manual', 'crawler', 'operator_link', 'screenshot', 'partner_feed']),
  extraction_confidence: z.number().min(0).max(1),
  captured_at: z.string().datetime(),
  raw_payload_ref: z.string().nullable(),  // content hash; never exposed on product surface
  evidence_gaps: z.array(z.string()),
  // Change detection
  previous_knowledge_id: z.string().nullable(),
  changed_fields: z.array(z.string()),
  change_magnitude: PricingChangeMagnitude,
  created_at: z.string().datetime(),
});
```

### `PricingRecommendation` — see Example 1 above. Locked.

### `PriceTest`

```ts
export const PriceTestState = z.enum([
  'draft', 'proposed', 'approved', 'rejected', 'active', 'stopped', 'completed', 'rolled_back',
]);

export const PriceTestStopCondition = z.object({
  kind: z.enum(['min_sample_size', 'max_duration_days', 'margin_floor_breach', 'conversion_lift_threshold', 'churn_threshold']),
  value: z.number(),
  breached: z.boolean().default(false),
});

export const PriceTest = z.object({
  test_id: z.string(),
  tenant_id: z.string(),
  source_recommendation_id: z.string(),
  state: PriceTestState,
  control: z.record(z.unknown()),         // pricing snapshot for control arm
  test: z.record(z.unknown()),            // pricing snapshot for test arm
  sample_size_target: z.number().int().positive(),
  duration_days: z.number().int().positive(),
  metrics: z.array(z.enum(['conversion', 'arpu', 'ltv', 'cac', 'gross_margin', 'churn', 'pipeline', 'win_rate'])),
  stop_conditions: z.array(PriceTestStopCondition),
  rollback_plan: z.record(z.unknown()),
  results: z.record(z.unknown()).nullable(),
  decision: z.object({
    actor_id: z.string().nullable(),
    decided_at: z.string().datetime().nullable(),
    reason: z.string().nullable(),
  }),
  approval_token_consumed: z.string().nullable(),
  activated_at: z.string().datetime().nullable(),
  stopped_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
```

### `PricingEngineContext` (the JSONB blob 207-01 reserves)

```ts
export const PricingEngineContext = z.object({
  schema_version: z.literal('2026-04-23-r1'),
  pricing_recommendation_id: z.string().nullable(),
  cost_model_snapshot_id: z.string().nullable(),
  pricing_floor_usd_micro: z.number().int().nonnegative().nullable(),
  projected_margin_bps: z.number().int().nullable(),
  source_agent_token: z.string().nullable(),      // 'MARKOS-AGT-PRC-04' etc.
  placeholder: z.literal('{{MARKOS_PRICING_ENGINE_PENDING}}').optional(),
});
```

Downstream (207-05) write contract: `pricing_engine_context` on `markos_agent_runs` accepts either `{}` or a `PricingEngineContext`-shaped object. `placeholder` and real fields are mutually exclusive — validated by a CHECK constraint in migration 113.

---

## Recommended Adoption Sequence

Execution order for the 8 plans, with gate criteria. Do not execute out of order.

1. **205-01 (contracts + migrations + RLS)** — ships `lib/markos/contracts/pricing.ts`, migrations 107-113, evidence-pack slot, F-112..F-119 YAML scaffolds (declarative-only), and cross-tenant RLS tests. **Gate:** all RLS tests green; no F-ID collision.
2. **205-02 (Cost Model + pricing floor)** — ships `lib/markos/pricing/cost-model.ts` + wizard state machine + BYOK posture. **Gate:** SaaS/eCommerce/Services unit coverage; recommendation insert blocks without ready cost model.
3. **205-03 (Pricing Knowledge Store + Watch List)** — ships `markos_pricing_knowledge` writes, change-magnitude classifier, alert table, manual-entry path + tenant-initiated single-URL fetch. **No bulk crawler in 205.**
4. **205-04 (Recommendation + PriceTest approval)** — ships state machines, 4 approval-token tool names, `activatePriceTest`, task handoff into `markos_agent_tasks`.
5. **205-05 (API + MCP)** — ships 8 API routes + 6 MCP tools, all read-only initially. Adds guardrail: agent content-generation path must query a pricing MCP tool OR emit `{{MARKOS_PRICING_ENGINE_PENDING}}`; content-audit regression test enforces this.
6. **205-06 (Operator UI)** — ships dashboard, competitor matrix, cost model wizard UI, recommendation cards, price-tests/watch-list/alerts; rewrites `settings/billing/page-shell.tsx` and Storybook fixtures. **Gate:** grep `/Growth Monthly|Starter Professional|\$\d+/` in `app/(markos)/settings/billing/**` returns zero.
7. **205-07 (Billing/Stripe handoff)** — ships real `stripe` import, `createStripePriceFromApprovedRecommendation`, reconciliation linkage. **Gate:** refuses unapproved; preserves grace period for active subscribers; invoice UI never exposes competitor fields.
8. **205-08 (Tenant 0 dogfood)** — ships Tenant 0 cost model, first competitor matrix, first approved `PricingRecommendation`, linked to Phase 213 readiness.

---

## Tests Implied

Per `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`.

### Vitest (unit + contract + state machine)
- `test/vitest/pricing/cost-model.test.ts` — SaaS/eCommerce/Services pricing-floor math; missing-input degradation; BYOK posture branches; `usd_micro` integer invariant.
- `test/vitest/pricing/recommendation-state.test.ts` — legal transitions only; rejects `draft -> activated`, `proposed -> activated`; approval-token binding for each approved transition; `affects_existing_subscribers` requires secondary approval.
- `test/vitest/pricing/price-test-stop-conditions.test.ts` — stop-condition evaluation + margin-floor breach + rollback envelope.
- `test/vitest/pricing/knowledge-change-magnitude.test.ts` — field-level diff yields the right magnitude class.
- `test/vitest/pricing/rls-isolation.test.ts` — cross-tenant read/write rejection for all 6 new tables.
- `test/vitest/pricing/mcp-tools.test.ts` — each of the 6 MCP tools returns tenant-scoped data; budget admission + approval gates on mutating endpoints.
- `test/vitest/pricing/agent-run-context.test.ts` — `pricing_engine_context` write path from approved recommendation; placeholder + real payload are mutually exclusive per CHECK.
- `test/vitest/pricing/placeholder-residue.test.ts` — repo-wide grep assertion (excluded paths: `obsidian/**`, `docs/**` historical, `test/**/fixtures/**`).
- `test/vitest/pricing/stripe-handoff.test.ts` — refuses unapproved; creates `stripe.billing.meters` + `stripe.prices.create` with correct metadata; rollback receipt path. Uses `nock` or Stripe mock.

### Playwright (operator flows)
- `test/playwright/pricing/cost-model-wizard.spec.ts` — operator completes SaaS wizard in under 10 minutes; warning UI on missing inputs.
- `test/playwright/pricing/recommendation-approval.spec.ts` — approve / reject / modify / defer; rejected recommendation blocks Stripe handoff; browser-visible evidence of decision actor.
- `test/playwright/pricing/price-test-activation.spec.ts` — approval token required; stop-conditions + rollback controls visible.
- `test/playwright/pricing/competitor-matrix-evidence.spec.ts` — every row shows source URL + SQS + captured_at; raw payload not exposed.
- `test/playwright/billing/placeholder-state.spec.ts` — billing settings page renders `{{MARKOS_PRICING_ENGINE_PENDING}}` state clearly when no approved recommendation exists.

### Chromatic (visual regression)
- Storybook variants per recommendation state (draft/proposed/approved/rejected/modified/deferred).
- Billing page: healthy / hold / pricing-pending.
- Operator invoice lineage panel: empty / single / multi.
- Price-test card: draft / pending-approval / active / stopped / rolled-back.

---

## F-ID + Migration Allocation

**Highest F-ID on disk:** F-100 (`contracts/F-100-webhook-breaker-v1.yaml`). Phase 204 allocates F-101..F-105. Phase 207 claims F-106..F-111. **Phase 205 claims F-112..F-119 (8 contracts, one per plan).**

| F-ID | File | Purpose | Owning Plan |
|---|---|---|---|
| F-112 | `contracts/F-112-pricing-contracts-v1.yaml` | Shared pricing schemas registry (declarative) | 205-01 |
| F-113 | `contracts/F-113-pricing-cost-model-v1.yaml` | Cost model CRUD + pricing floor read | 205-02 |
| F-114 | `contracts/F-114-pricing-knowledge-v1.yaml` | Pricing Knowledge store + watch list + alerts | 205-03 |
| F-115 | `contracts/F-115-pricing-recommendation-v1.yaml` | Recommendation + PriceTest CRUD + decision | 205-04 |
| F-116 | `contracts/F-116-pricing-matrix-api-v1.yaml` | Competitive matrix + position read API + MCP tool registry | 205-05 |
| F-117 | `contracts/F-117-pricing-operator-ui-v1.yaml` | UI-facing read contracts for dashboard/matrix/cards | 205-06 |
| F-118 | `contracts/F-118-pricing-stripe-handoff-v1.yaml` | Approved-recommendation to Stripe Product/Price/Meter | 205-07 |
| F-119 | `contracts/F-119-pricing-tenant0-dogfood-v1.yaml` | Tenant 0 seed evidence + first recommendation link | 205-08 |

Rule: No 205 plan introduces an F-ID outside this range. Phase 208+ allocates F-120+.

**Highest migration on disk:** `100_crm_schema_identity_graph_hardening.sql`. Phase 207 claims 101-106. **Phase 205 claims 107-113 (7 contiguous migrations).**

| Migration | File | Owning Plan |
|---|---|---|
| 107 | `supabase/migrations/107_markos_pricing_knowledge.sql` | 205-03 (table created by 205-01 scaffold) |
| 108 | `supabase/migrations/108_markos_pricing_cost_models.sql` | 205-02 |
| 109 | `supabase/migrations/109_markos_pricing_recommendations.sql` | 205-04 |
| 110 | `supabase/migrations/110_markos_pricing_price_tests.sql` | 205-04 |
| 111 | `supabase/migrations/111_markos_pricing_watch_list.sql` | 205-03 |
| 112 | `supabase/migrations/112_markos_pricing_alerts.sql` | 205-03 |
| 113 | `supabase/migrations/113_markos_billing_link_to_pricing.sql` | 205-07 (ALTERs `billing_pricing_snapshots`, `invoice_line_items`) |

Every migration ships with `supabase/migrations/rollback/<N>_*.down.sql`. RLS policies are declared in the same file.

---

## Dependencies

### Upstream (must be ready before 205 executes)
- **Phase 201 Tenancy/RLS** — pre-existing `markos_tenants`, tenant-scoped RLS primitives; every 205 table reuses the `app.tenant_id` session setting pattern.
- **Phase 202 MCP substrate** — `lib/markos/mcp/approval.cjs`, `cost-meter.cjs`, `pipeline.cjs` MUST be live. Plan 205-05 registers new tools into this substrate.
- **Phase 204 CLI surfaces** — `markos status` (Plan 204-08) MAY render `pricing_engine_context` placeholder for a run. Plan 204-13 (v2 compliance guardrails) already references the placeholder policy.

### Downstream (expects 205 contracts)
- **Phase 206 SOC2** — Plan 206-03 maps Pricing Engine controls; expects approval audit trail + decision actor on every state transition.
- **Phase 207 AgentRun v2** — Plan 207-05 expects Pricing Engine to write `PricingEngineContext`-shaped blobs to `markos_agent_runs.pricing_engine_context`. Contract locked at 207-01 §8.
- **Phase 209 Evidence** — `markos_pricing_knowledge.evidence_gaps` + FK nullable slot into a future `EvidenceMap` table. No ALTER required when 209 lands.
- **Phases 214-217 SaaS Suite** — SaaS plan catalog, save offers, annual discounts, churn retention pricing all consume `PricingRecommendation` records.
- **Phases 218-220 SaaS Marketing OS Strategy** — referral rewards, affiliate commissions, pricing-page experiments, G2 sync, PLG upgrade prompts all query Pricing Engine or emit placeholder.
- **Phase 211 Content/Social/Revenue Loop** — pricing-sensitive copy generation queries MCP tools or emits placeholder. Guardrail shipped in 205-05.
- **Phase 213 Tenant 0 dogfood** — consumes 205-08 output; final compliance validation gate.

### Zero known contract contradictions with upstream/downstream plans — the pricing migration range (107-113) does not collide with 204 (73-76 + reserved 77-80, 90-95) or 207 (101-106)

---

## PRC Agent Allocation (per directive #7)

| Token | Agent role | Registry in Phase 205? | Which 205 plan | Runtime status |
|---|---|---|---|---|
| `MARKOS-AGT-PRC-01` | SaaS Pricing Strategist | yes — registry stub only | 205-04 | `planned` |
| `MARKOS-AGT-PRC-02` | eCommerce Pricing Monitor | yes — registry stub only | 205-04 | `planned` |
| `MARKOS-AGT-PRC-03` | Services Pricing Strategist | yes — registry stub only | 205-04 | `planned` |
| `MARKOS-AGT-PRC-04` | Pricing Recommendation Agent | yes — basic markdown generator into `PricingRecommendation.draft` | 205-04 | `experimental` |
| `MARKOS-AGT-PRC-05` | Pricing Page Optimizer | deferred to Phase 211 (content loop) | — | not registered in 205 |
| `MARKOS-AGT-PRC-06` | Competitive Price Watcher | yes — triggers `PricingAlert` rows | 205-03 | `experimental` (monitor only) |

Autonomous/bounded-auto-approve is explicitly deferred. All PRC output flows through `proposed -> approved` gate in 205.

---

## QA-01..15 Coverage Map (per directive #8)

| Requirement | Owning Plan in 205 | Notes |
|---|---|---|
| QA-01 accessibility | 205-06 | Operator UI; delegated to `axe-playwright` Storybook run. |
| QA-02 performance budgets | 205-05 | Pricing MCP tools must meet MCP tool SLO (Phase 202 baseline). |
| QA-03 privacy boundaries | 205-03, 205-07 | No competitor raw payload leaks to tenant UI/invoice. |
| QA-04 security review | 205-04, 205-07 | Approval token reuse + Stripe key handling. |
| QA-05 error handling | 205-05 | OpenAPI error envelopes per F-112..F-119. |
| QA-06 audit logging | 205-01, 205-04 | Every state transition emits an audit row (uses migration 82 hash chain). |
| QA-07 tenant isolation | 205-01 | RLS tests on all 6 new tables. |
| QA-08 data retention | 205-01 | Append-only history + 7-year retention on recommendations; knowledge TTL per source. |
| QA-09 observability | 205-05, 205-07 | Structured logs + MCP cost meter visibility. |
| QA-10 deterministic tests | All | `vitest` default; no time-dependent assertions. |
| QA-11 release gating | 205-06, 205-07 | Grep-residue gate + Stripe refusal test. |
| QA-12 docs & lineage | 205-01, 205-06 | Every contract has `x-markos-meta`; operator UI renders lineage. |
| QA-13 rollback | 205-04, 205-07 | PriceTest rollback envelope; Stripe price deactivation flow. |
| QA-14 agent output attribution | 205-04, 205-05 | `generated_by_agent_token` on every recommendation. |
| QA-15 cross-phase testing matrix compliance | All | `vitest`/`playwright`/`chromatic` roles per testing plan. |

---

## Open Decisions (Require Sign-off)

Consolidated — the plans should NOT proceed to execution until these are answered.

1. **First execution slice.** Recommendation: **MarkOS Tenant 0 (SaaS business_type)**. Smallest blast radius, dogfood gate already exists via Plan 205-08. Operator sign-off required to confirm.
2. **Source-quality-score admissibility threshold.** Recommendation: `source_quality_score >= 0.7 AND extraction_confidence >= 0.6` admits a knowledge record as recommendation evidence. Lower scores are stored but not surfaced on Recommendation cards. Sign-off on threshold numbers.
3. **`pricing-catalog.ts` long-term fate.** Recommendation: keep as compatibility adapter; retarget to read approved `PricingRecommendation` snapshots. Alternative (rejected here): rip out entirely in 205-07. Sign-off needed before 205-07.
4. **Crawler policy.** Recommendation: 205 ships manual-entry + tenant-initiated single-URL fetch only. Bulk scheduled crawl is deferred to a dedicated phase (likely 212 or later) that includes legal/TOS review. Sign-off: no bulk crawl in 205.
5. **BYOK pricing posture.** Recommendation: `byok_discount_posture = 'recommendation_input'` by default. Actual price/margin effect is a per-recommendation decision, not a global rule. Sign-off on default.
6. **Public pricing activation policy for Tenant 0.** Recommendation: 205-08 generates a recommendation but does NOT unresolve the `{{MARKOS_PRICING_ENGINE_PENDING}}` placeholder on public docs until Phase 213 readiness validation. Sign-off on keeping public pricing placeholder through 205.
7. **PRC-05 (Pricing Page Optimizer) phase home.** Recommendation: Phase 211 content loop. Sign-off to defer.

---

## RESEARCH COMPLETE (status marker)

This document is the gate input for re-planning / verifying plans 205-01 through 205-08. Plans consuming this research must import schemas verbatim from `lib/markos/contracts/pricing.ts` once produced by 205-01, and may NOT redefine shapes locally. Any drift forces a RESEARCH refresh, not an ad-hoc plan fix.
