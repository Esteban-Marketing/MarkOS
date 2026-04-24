# Phase 227 Research - Ecosystem, Partner, Community, and Developer Growth

## Primary research question

How can MarkOS turn its current plugin, pack, MCP, and integration substrate into a governed ecosystem operating layer for marketplace listings, partners, referrals, affiliates, community, and developer growth?

## Standard Stack

- Reuse the existing plugin registry/loader/contract patterns.
- Reuse marketplace-style and MCP distribution surfaces where available.
- Keep ecosystem operations tenant-scoped and trust-governed instead of opening third-party install or payout surfaces too early.

## Architecture Patterns

- Registry-driven listings and partner profiles with explicit states.
- Trust/certification workflow rather than open-ended publishing.
- Referral and affiliate programs as governed objects tied to pricing and attribution.
- Community and developer signals feed analytics, CRM, and launches.

## Don't Hand-Roll

- New distribution registries that ignore the existing plugin registry and manifest patterns.
- Informal referral or affiliate logic outside audit, attribution, and pricing control.
- Community signal capture that never produces tasks, product feedback, or GTM action.

## Common Pitfalls

- Confusing plugin runtime substrate with ecosystem business workflows.
- Opening third-party marketplace mechanics before trust and certification states exist.
- Treating partner count as success instead of partner quality and attributable outcomes.

## Codebase Findings

### Files inspected

- `lib/markos/plugins/registry.js`
- `lib/markos/plugins/loader.js`
- `lib/markos/plugins/contracts.js`
- `lib/markos/packs/pack-loader.cjs`
- `app/(markos)/plugins/digital-agency/page.tsx`
- `.planning/codebase/INTEGRATIONS.md`

### Existing support

- Plugin registry and loader already provide deterministic, fail-closed runtime registration.
- Plugin contracts already define capabilities, IAM roles, and route ownership.
- Pack loading already demonstrates registry/selection/alias patterns useful for listing and certification state.
- Integrations inventory already names MCP, plugin, Resend/Twilio, PageIndex, and other ecosystem-adjacent systems.

### Missing capabilities

- No `IntegrationListing`, `PartnerProfile`, `ReferralProgram`, or `CommunitySignal` objects.
- No partner certification or marketplace review workflow.
- No referral/affiliate payout-safe logic or fraud controls.
- No community/developer signal ingestion as a first-class business object.
- No ecosystem attribution layer tied back to CRM and analytics.

## Recommended Implementation Path

1. Reuse registry patterns, but separate runtime plugin manifests from ecosystem business objects.
2. Start with read-heavy governance objects: listings, partner profiles, certification states, community signals.
3. Add referral and affiliate programs only after pricing and attribution hooks are explicit.
4. Keep external publishing and partner actions approval-aware by default.
5. Route community and developer signals into analytics, CRM, launches, and learning.

## Tests Implied

- Registry/certification-state tests.
- Partner/referral/affiliate policy and fraud tests.
- Attribution and payout gating tests.
- Community/developer signal routing tests.
- Browser tests for listing review, partner approval, and blocked-fraud flows.

## Research Decisions

- Phase 227 should treat the current plugin/runtime substrate as a technical base, not as the finished ecosystem product.
- Trust states and attribution must arrive before payout or open-listing flows.
- Community and developer signals should be modeled as operational inputs, not just content metrics.
