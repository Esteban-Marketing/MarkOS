---
date: 2026-04-22
description: "MarkOS v2 target ICP: growth-stage B2B marketing leaders first, agencies second, dev-native ecosystem as distribution and ergonomics rather than the paid launch ICP."
tags:
  - brain
  - icp
  - gtm
  - markos
  - v2
---

# Target ICP

> v2 supersedes the 2026-04-16 Q-A ICP for product and GTM planning. The launch ICP is **growth-stage B2B marketing leaders**. Agencies are the secondary expansion/partner ICP. Solopreneurs, vibe-coders, and DTC remain useful for distribution, community, and later product tracks, but they are no longer the paid launch center of gravity.

## Decision Status

This resolves the ICP conflict captured in [[MarkOS v2 Blueprint Intake]]:

| Prior posture | v2 posture | Resolution |
|---|---|---|
| Seed-to-A B2B SaaS + modern DTC + solopreneurs/vibe-coders | Growth-stage B2B marketing leaders first, agencies second | v2 becomes canonical for product/GTM |
| Developer-native tone as ICP proxy | Developer-native as product ergonomics and distribution habit | Keep docs/API/CLI quality, do not price or scope around solo users |
| DTC as launch wedge | B2C and DTC deferred | Revisit after B2B loop and attribution foundation work |
| SaaS B2B/B2C/PLG mode breadth | Document 17 defines broad SaaS modes | Treat as future product architecture in [[SaaS Marketing OS Strategy Canon]], not as launch ICP expansion |

## Primary ICP - Growth-Stage B2B Marketing Leader

Named archetype: **Growth Gina**.

- Works at a growth-stage B2B company with existing marketing motion, publication history, and paid/media data.
- Owns pipeline contribution, CAC, content quality, channel coordination, and reporting credibility.
- Has a small team or agency support, but still lives in tool fragmentation and approval bottlenecks.
- Uses HubSpot/Salesforce/Attio, GA4, GSC, paid media platforms, CMS, social platforms, email/lifecycle tools, and analytics.
- Feels that dashboards show what happened, agencies create handoff drag, and AI content tools create review debt.
- Pays for leverage when it creates pipeline, protects brand, and makes decisions easier.
- Needs evidence, auditability, approvals, budget controls, and executive-ready performance narratives.

### Primary Jobs

1. Prove what marketing is doing for pipeline.
2. Turn scattered data into decisions and tasks.
3. Produce brand-safe, sourced, channel-native content faster.
4. Coordinate social, content, paid, and lifecycle work without losing context.
5. Keep AI actions approval-gated and auditable.
6. Learn from performance without rebuilding the marketing system manually every week.

## Secondary ICP - B2B Agency Operator

Named archetype: **Agency Alex**.

- Manages multiple B2B clients with recurring strategy, content, social, reporting, and pipeline responsibilities.
- Needs repeatable operating loops, client-visible proof, and white-label reporting.
- Buys when MarkOS reduces coordination cost and makes client work more defensible.
- Becomes stronger after the single-tenant loop works, because multi-client workflow multiplies complexity.

Agency is important, but not allowed to pull the product into premature white-label or multi-tenant complexity before the foundation loop works for direct B2B teams.

## Design Partner Filter

The first 10 design partners should have:

- Existing GA4 and GSC data.
- At least one paid, organic, or social channel with real history.
- Published content or active campaigns to audit.
- A clear B2B pipeline motion.
- A marketing owner who can approve artifacts.
- Willingness to give written feedback on tasks, approvals, outputs, and weekly narratives.

Avoid design partners with no data, no publishing history, no pipeline definition, or no operator available to review the loop.

## Deferred or Non-Target for Launch

- **Solopreneurs and vibe-coders** - useful for community, CLI feedback, marketplace distribution, and dogfood ergonomics, but not the paid launch ICP.
- **Very early pre-revenue startups** - usually lack the data required for the v2 wow moment.
- **Modern DTC and B2C brands** - later track after B2B content/social/revenue loop, attribution foundations, Pricing Engine, SaaS Suite, and SaaS growth-mode routing are stable.
- **Large enterprise departments** - later Enterprise/OEM track once compliance, SSO, data residency, procurement, and security workflows mature.
- **Regulated-only verticals** - deferred until compliance packs and legal review flows are deep enough.

## Implications

| Decision axis | v2 ICP-driven choice |
|---|---|
| Distribution | Tenant 0 proof, design partner case studies, founder-led content, LinkedIn, SEO/GEO, B2B communities, targeted outbound |
| Pricing floor | `{{MARKOS_PRICING_ENGINE_PENDING}}` - public tiers and packaging must be created by [[Pricing Engine Canon]] |
| Onboarding | Under-30-minute guided setup with brand pack, max 3 connectors, live-data wow moment |
| Connectors | GA4, GSC, HubSpot/Salesforce/Attio, CMS, LinkedIn, Meta, Google Ads, email/lifecycle, social APIs, PostHog where relevant |
| UI priority | Morning Brief, Task Board, Approval Inbox, connector recovery, performance narrative |
| Docs + voice | Still developer-native and API-clear, but buyer copy speaks to marketing operators and revenue accountability |
| Feature order | Complete operating loop before broad agent catalog or marketplace breadth |
| SaaS mode breadth | Keep paid launch focused on B2B, but preserve future routing for `b2b`, `b2c`, `b2b2c`, `plg_b2b`, and `plg_b2c` through [[SaaS Marketing OS Strategy Canon]] |
| Community | Product proof, operator office hours, design partner advisory loop, public build-in-MarkOS case studies |
| Support | High-touch design partner onboarding first, then productized recovery tasks and usage visibility |

## What the ICP Needs in v1

- Brand Pack Wizard and claim library.
- GA4/GSC or equivalent live-data connector wow moment.
- Task Board and Approval Inbox.
- AgentRun/cost/provenance visibility.
- Content strategy, brief, draft, audit, approval, publish, measure loop.
- Social listening and response drafting with approval.
- Weekly narrative that explains performance, anomalies, and next actions.
- Usage and AI budget visibility.

## What the ICP Does Not Need First

- Full 80-agent network.
- Passive dashboard library.
- Marketplace before the core loop works.
- Fully autonomous publishing.
- Multi-client white-label as a launch blocker.
- Heavy enterprise procurement workflows.
- Consumer commerce specialization.

## Success Signals

- 10 design partners complete onboarding and connect live data.
- 85%+ brand pack completion among activated accounts.
- First connector live in under 10 minutes.
- First wow moment in under 30 minutes.
- First approved artifact in under 48 hours.
- A shipped agent type runs reliably for 7 consecutive days.
- Average voice score for shipped agent outputs is at least 82%.
- 3+ design partners provide written feedback on the loop.
- Weekly narrative connects work to pipeline or clear leading indicators.

## Related

- [[Marketing Operating System Foundation]]
- [[Pricing Engine Canon]]
- [[SaaS Marketing OS Strategy Canon]]
- [[MarkOS v2 Blueprint Intake]]
- [[Brand Stance]]
- [[Message Crafting Pipeline]]
- [[Pain-Point Engine]]
- [[Key Decisions]]
