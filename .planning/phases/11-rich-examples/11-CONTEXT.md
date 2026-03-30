# Phase 11: Rich Business-Model Examples — CONTEXT.md

> Generated from `/gsd-discuss-phase` session — 2026-03-25. All items are locked decisions for downstream planner and researcher agents.

---

## 1. What This Phase Builds

Enrich the MARKOS protocol so that every LLM agent executing a template fill or draft generation call receives a **concrete, model-specific reference example** alongside the client's own data. The example is selected automatically from the `business_model` field captured during onboarding, and injected into the LLM prompt in a standard markdown section format. Static example files live as **underscore-prefixed sibling files** next to each template.

---

## 2. Locked Decisions

### 2.1 File Naming Convention
**Decision:** Underscore-prefix sibling files next to each template.

```
templates/MIR/Market_Audiences/
  AUDIENCES.md                     â† template (unchanged)
  _AUDIENCES-b2b.example.md        â† reference example
  _AUDIENCES-b2c.example.md
  _AUDIENCES-saas.example.md
  ... (one per business_model)
```

**Rationale:** The `_` prefix clearly marks these as meta/reference files — they will never be confused with a real MIR file, sort visually separate, and survive update patches because they live under `.agent/` (not `.markos-local/`).

### 2.2 Business Model Values
**Decision:** `company.business_model` is a required enum in the seed schema with these valid values:

| Value | Label | Meaning |
|-------|-------|---------|
| `B2B` | Business-to-Business | Sells to companies, firmographic ICP, longer sales cycles |
| `B2C` | Business-to-Consumer | Sells to individuals, demographic persona, impulse-driven |
| `B2B2C` | Business-to-Business-to-Consumer | Sells to a business that deploys/resells to consumers |
| `DTC` | Direct-to-Consumer | E-commerce brand, owns the consumer relationship |
| `Marketplace` | Two-Sided Platform | Acquires both buyers and sellers/creators |
| `SaaS` | Software-as-a-Service | B2B + recurring subscription + product-led or sales-led |
| `Agents-aaS` | Agents-as-a-Service | Sells autonomous AI agent workflows; technical/exec buyer, consumption-based |

### 2.3 Conditional Seed Fields (added to onboarding-seed.schema.json + UI)

These fields are added to the schema and rendered conditionally in the onboarding UI based on `business_model`:

| Field | Path in seed | Shown when | Values |
|---|---|---|---|
| `company.business_model` | Always (Step 1, first question) | — | Enum above |
| `product.pricing_model` | `product.pricing_model` | Always | `One-time` / `Subscription` / `Usage-based` / `Freemium` / `Hybrid` |
| `product.sales_cycle` | `product.sales_cycle` | B2B, B2B2C, SaaS, Agents-aaS | `Short (<30d)` / `Medium (30-90d)` / `Long (90d+)` / `Enterprise (180d+)` |
| `audience.decision_maker` | `audience.decision_maker` | B2B, B2B2C, SaaS, Agents-aaS | e.g. `Economic Buyer`, `Champion`, `End User`, `Technical Evaluator` |
| `product.avg_order_value` | `product.avg_order_value` | B2C, DTC | `<$50` / `$50-$200` / `$200-$1000` / `$1000+` |
| `audience.purchase_frequency` | `audience.purchase_frequency` | B2C, DTC, Marketplace | `One-time` / `Occasional` / `Regular` / `Habitual` |
| `audience.lifestyle_triggers` | `audience.lifestyle_triggers` | B2C, DTC | Free text — life events or triggers that drive purchase |
| `product.consumption_metric` | `product.consumption_metric` | Agents-aaS, SaaS (Usage-based) | e.g. `API calls`, `tasks run`, `seats` |
| `audience.supply_side` | `audience.supply_side` | Marketplace | Description of the seller/creator side |
| `audience.demand_side` | `audience.demand_side` | Marketplace | Description of the buyer/consumer side |

### 2.4 Example File Scope (Templates Covered, Priority Order)

**Tier 1 — Highest ROI (all 7 business models):**
1. `templates/MIR/Market_Audiences/_AUDIENCES-{model}.example.md`
2. `templates/MIR/Market_Audiences/_ICPs-{model}.example.md`
3. `templates/MIR/Core_Strategy/_BRAND-VOICE-{model}.example.md`

**Tier 2 — High ROI (all 7 business models):**
4. `templates/MSP/Strategy/_CHANNEL-STRATEGY-{model}.example.md`
5. `templates/MSP/Campaigns/_PAID-ACQUISITION-{model}.example.md`

**Tier 3 — Future (separate phase):**
- RESEARCH files, remaining MSP disciplines

### 2.5 LLM Injection Format
**Decision:** Markdown section, Option 2. The example file content is appended to each filler prompt with this wrapper:

```markdown
## ðŸ“Œ Reference Example ({Business Model})
_This is a completed real-world example of the section below. Use it as a quality benchmark — length, depth, specificity, and structure. Do NOT copy it; generate equivalent quality for the client data above._

{file content}

---
Now fill the same template for THIS client using the data provided above.
```

**Implementation:** A shared `resolveExample(templateName, businessModel, examplesBasePath)` utility function reads the sibling file via `fs.readFileSync`, wraps it with the markdown header, and is imported into both `mir-filler.cjs` and `msp-filler.cjs`. If the example file doesn't exist, the prompt runs without injection (graceful degradation — no hard failure).

### 2.6 Supabase + Upstash Vector / Metadata
`business_model` is stored as a top-level metadata field on the Supabase + Upstash Vector namespace document for the project (alongside `slug`), enabling future cross-client queries by model type.

---

## 3. What Downstream Agents Should NOT Re-ask

- âœ… File naming convention — locked (`_TEMPLATE-model.example.md`)
- âœ… business_model enum values — locked (7 values)
- âœ… Which conditional fields to add — locked (table above)
- âœ… Which templates get examples — locked (Tier 1 & 2)
- âœ… Injection wrapper format — locked (markdown section, Option 2)
- âœ… Graceful degradation — if no example file exists, skip injection silently

---

## 4. Deferred / Out of Scope for This Phase

- CLI-based onboarding (non-web) does not get a new business_model prompt in this phase — captured as future todo
- RESEARCH template examples — Tier 3, separate phase
- Remaining MSP disciplines (SEO, Email, Social individual templates) — Tier 3
- business_model-aware LINEAR task template selection — future phase
- Auto-detection of business_model from seed data without user input — explicitly rejected; user input is required for correctness

---

## 5. Code Context

| File | Change |
|---|---|
| `onboarding/onboarding-seed.schema.json` | Add all new fields to `properties`, add `business_model` to `company` required |
| `onboarding/onboarding.js` | Add UI elements for all new fields + JS conditional show/hide logic |
| `onboarding/backend/agents/mir-filler.cjs` | Import `resolveExample`, inject into each prompt |
| `onboarding/backend/agents/msp-filler.cjs` | Same |
| `onboarding/backend/agents/example-resolver.cjs` | **NEW** — `resolveExample(templateName, businessModel)` utility |
| `onboarding/backend/vector-store-client.cjs` | Store `business_model` in project metadata on first submit |
| `.agent/markos/templates/MIR/Market_Audiences/` | Add 14 new `_*.example.md` files (AUDIENCES + ICPs Ã— 7 models) |
| `.agent/markos/templates/MIR/Core_Strategy/` | Add 7 new `_BRAND-VOICE-*.example.md` files |
| `.agent/markos/templates/MSP/Strategy/` | Add 7 new `_CHANNEL-STRATEGY-*.example.md` files |
| `.agent/markos/templates/MSP/Campaigns/` | Add 7 new `_PAID-ACQUISITION-*.example.md` files |

