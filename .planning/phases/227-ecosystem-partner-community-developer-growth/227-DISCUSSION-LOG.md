# Phase 227: Ecosystem, Partner, Community, Developer Growth - Discussion Log

> **Audit trail only.** Decisions in `227-CONTEXT.md`.

**Date:** 2026-04-25
**Phase:** 227-ecosystem-partner-community-developer-growth
**Mode:** discuss (--chain)

---

## Object model granularity
| Option | Selected |
|--------|----------|
| Full doc 25: 9 tables (IntegrationListing + PartnerProfile + ReferralProgram + AffiliateProgram + CommunitySignal + DeveloperEvent + CertificationRecord + CoSellOpportunity + EcosystemAttribution metadata) | ✓ |
| Minimal v1 (4 tables) | |
| Hybrid (defer DeveloperEvent + CoSellOpportunity) | |

**Choice:** Full doc 25 (Recommended).

---

## Plugin registry ↔ IntegrationListing
| Option | Selected |
|--------|----------|
| Separate IntegrationListing SOR + plugin_manifest_id read-through adapter; plugin registry runtime-only | ✓ |
| Extend plugin registry with marketplace columns | |
| Bidirectional sync via cron | |

**Choice:** Read-through adapter (Recommended). P221 D-20 pattern.

---

## P220 overlap (Referral + Community + Partnership)
| Option | Selected |
|--------|----------|
| Extend P220 schema with business_mode discriminator + scope; preserve SAS rows | ✓ |
| New commerce-wide tables with cross-reference | |
| Deprecate P220 tables; migrate to P227 | |

**Choice:** Extend P220 (Recommended). Single source of truth.

---

## Certification workflow
| Option | Selected |
|--------|----------|
| First-class state machine + criteria_checks JSONB + recertification cron + operator review queue | ✓ |
| Static certification_level (no state machine) | |
| External certification body API | |

**Choice:** First-class state machine (Recommended). 12-month expiry.

---

## Fraud + payout model (Referral/Affiliate)
| Option | Selected |
|--------|----------|
| fraud_signals + rule engine + manual review queue + internal credit + manual CSV export | ✓ |
| Full Stripe Connect | |
| Threshold-block + audit-only | |

**Choice:** Internal credit + manual CSV (Recommended). KYC/tax post-P228.

---

## CommunitySignal ingestion
| Option | Selected |
|--------|----------|
| Webhook adapters per source + signed verification + dedupe + ConsentState gate | ✓ |
| API-only ingestion | |
| Scheduled poll | |

**Choice:** Webhooks-primary + poll-fallback (Recommended).

---

## Partner co-sell workflow
| Option | Selected |
|--------|----------|
| First-class CoSellOpportunity (links P222 Opportunity + PartnerProfile + LaunchSurface partner_pack + DealRoom + handoff_record) | ✓ |
| opportunity.partner_id FK only | |
| partner_attribution_touches in P225 only | |

**Choice:** First-class CoSellOpportunity (Recommended).

---

## Ecosystem attribution
| Option | Selected |
|--------|----------|
| Extend P225 attribution_touches with ecosystem metadata FK columns | ✓ |
| Separate ecosystem_attribution table | |
| ecosystem_signals + nightly join | |

**Choice:** Extend P225 (Recommended). One ledger; doc 22 + doc 25 honored.

---

## Marketplace listing + install workflow
| Option | Selected |
|--------|----------|
| Read-heavy v1: discovery + listing detail + install_request operator-mediated | ✓ |
| Self-serve install for all certified | |
| Defer install to v2 | |

**Choice:** Read-heavy + operator-mediated install (Recommended).

---

## API + MCP + UI surface
| Option | Selected |
|--------|----------|
| Read-write v1 /v1/ecosystem/* + 8 MCP tools + 7 UI workspaces + public /marketplace/* | ✓ |
| Read-only v1 | |
| Minimal MCP (3 tools) | |

**Choice:** Full surface (Recommended).

---

## Public marketplace + dev-portal delivery
| Option | Selected |
|--------|----------|
| Next.js dynamic /marketplace/[...slug] + /developers/[...slug] + ISR cacheTag + BotID + rate-limit + sitemap + structured data | ✓ |
| Server-rendered every request | |
| Static export at build | |

**Choice:** ISR + BotID + rate-limit (Recommended). Carry P224/P226 patterns.

---

## Claude's Discretion
- Module boundary `lib/markos/ecosystem/*`.
- Webhook signature scheme per source (HMAC-SHA256 default).
- Fraud rule weights + thresholds.
- listing.view_count aggregation cadence.
- Marketplace search engine (Postgres FTS v1).
- Per-tenant Edge Config namespace for webhook keys.

## Deferred Ideas
- Full Stripe Connect (KYC/1099/tax) → post-P228.
- Self-serve third-party install → defer (security).
- External cert body API → defer.
- Customer-facing marketplace billing → P228+.
- Real-time community signal streaming → defer.
- ML fraud detection → defer.
- Public ecosystem leaderboards → defer.
- ML affiliate attribution → defer.
- SDK auto-publish to npm/PyPI → defer.
- Visual partner directory builder → v2.
- Partner SSO federation → defer.
- Embeddable marketplace widget → defer.
- Localized marketplace per region → v2.
- LLM auto-routing for community signals → v2.
- Partner deal registration with conflict resolution → defer.
- Cookie-less affiliate attribution → defer.
- Doc 17 SaaS growth foundations stay in P218-P220.
- Core analytics stays in P225.
- Commercial-stack closure stays in P228.
