# Phase 213 Research - Tenant 0 Dogfood and Compliance Validation

## Primary research question

What evidence is required for MarkOS to credibly claim it can run its own marketing loop and move toward enterprise/SaaS Suite readiness?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Tenant 0 setup | What tenant/org/brand/connector data is needed for real MarkOS dogfood? | Tenant 0 setup plan |
| First loop | Which marketing loop is safe and valuable enough to run first? | Dogfood loop proposal |
| Pricing | What Pricing Engine output is available, and where must placeholders remain? | Pricing proof policy |
| Evidence | What claims can be made publicly and what evidence is required? | Public proof checklist |
| Compliance | Which SOC2 controls and audit evidence must be present before enterprise positioning? | Compliance readiness map |
| Learning | How do dogfood outcomes feed TenantOverlay and literacy candidates? | Learning handoff |
| Vault/codebase | How should final compliance map requirements to implementation, tests, and GSD artifacts? | Validation matrix |
| Future strategy | What parts of doc 17 can be referenced as roadmap, and what must remain unclaimed? | SaaS growth claim boundary |

## Sources to inspect

- Tenant/org/brand/onboarding and connector setup code.
- Phases 205-212 outputs and verification artifacts.
- Pricing Engine and SaaS Marketing OS Strategy canon.
- GTM and Product Vision incoming docs.
- Existing public website/docs/copy and any pricing/enterprise claims.
- `.planning/REQUIREMENTS.md` and codebase compliance audit artifacts.

## Required research output

- Tenant 0 setup requirements.
- First-loop recommendation.
- Evidence and public-claim policy.
- Pricing placeholder policy.
- Compliance validation checklist.
- Go/no-go recommendation for phases 214-217.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `.planning/V4.0.0-VAULT-CODEBASE-COMPLIANCE-AUDIT.md`
- `.agent/markos/references/pricing-engine.md`
- `app/(marketing)/integrations/claude/page.tsx`
- `app/(marketing)/docs/[[...slug]]/page.tsx`
- `app/docs/llms-full.txt/route.ts`
- `lib/markos/governance/evidence-pack.ts`
- `lib/markos/crm/reporting.ts`
- `lib/markos/billing/usage-normalizer.ts`

### Existing support

- Public docs and `llms` routes exist as surfaces that can later host proof-backed content.
- Governance evidence packs can gather audit, billing, approval, identity, and provider evidence.
- CRM reporting can produce readiness, cockpit, and executive summaries.
- Billing usage normalization can provide cost evidence for dogfood runs.
- Pricing placeholder policy is documented in `.agent/markos/references/pricing-engine.md`.

### Gaps

- No dedicated Tenant 0 tenant, brand pack, connector setup, or dogfood instrumentation exists.
- No proof pack links MarkOS public claims to evidence, approval, and freshness status.
- No dogfood loop proves MarkOS can run its own strategy -> brief -> content -> approval -> publish/queue -> measure -> learn cycle.
- No public case-study gate separates roadmap ambition from supported claims.
- No final vault/codebase requirement matrix proves phases 205-212 achieved compliance.

### Tenant 0 setup requirements

- A real internal tenant/org/brand profile for MarkOS.
- Approved owner/admin actors and explicit dogfood roles.
- Pricing Engine status: either approved recommendation or `{{MARKOS_PRICING_ENGINE_PENDING}}`.
- At least one healthy connector path or an explicit recovery task if not connected.
- EvidenceMap and approval gates enabled for public claims.
- Cost and run telemetry enabled for dogfood AgentRuns.

### First dogfood loop

Recommended first loop: MarkOS public proof content. It should draft an evidence-backed content asset about one already implemented capability, audit every claim, require approval, queue/publish only through a healthy connector, measure traffic/engagement or CRM interest, and create a learning record.

### Public claim policy

- Implemented and verified features may be claimed with evidence and date.
- Planned agents, SaaS Suite features, doc 17 growth modules, and enterprise compliance must be described as roadmap until shipped and verified.
- Pricing, discounts, packages, and billing copy stay behind the Pricing Engine placeholder unless approved.
- SOC2 wording must distinguish designed controls, Type I readiness, auditor engagement, and completed audit.

### Tests implied

- Dogfood tenant setup test with tenant isolation and role checks.
- Public claim audit test that fails on unsupported or expired evidence.
- Pricing placeholder test for every public pricing-sensitive surface.
- Compliance matrix test mapping each v2 requirement family to implementation, tests, and evidence.
- Go/no-go artifact for phases 214-217.
