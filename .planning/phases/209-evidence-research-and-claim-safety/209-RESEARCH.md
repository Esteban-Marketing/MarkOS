# Phase 209 Research - Evidence, Research, and Claim Safety

## Primary research question

What central evidence model lets MarkOS safely create, review, approve, and dispatch claims across content, pricing, social, sales, PR, SaaS, and future growth motions?

## Questions to answer

| Area | Question | Output |
|---|---|---|
| Current tools | What do current claim-audit MCP tools support and where do they fall short? | Tool gap map |
| EvidenceMap | What fields are required for claims, sources, quality, confidence, TTL, freshness, known gaps, and inference labels? | Contract/schema proposal |
| Source quality | How should source types be scored across first-party, official, analyst, public web, social, community, and operator-provided sources? | Score rubric |
| Freshness | What TTL defaults apply to pricing, competitor, legal, product, revenue, and evergreen claims? | TTL policy |
| Approval UI | How should evidence and unsupported-claim blockers appear to humans? | UI requirements |
| Reuse | How do agents find and reuse fresh research context? | Reuse algorithm |
| Pricing | How does competitor pricing evidence flow into PricingRecommendation records? | Pricing evidence path |
| Future growth | What evidence is required for PR, reviews, events, ABM, referral, partnership, and developer-marketing claims? | Growth evidence matrix |

## Sources to inspect

- Existing MCP marketing tools and tests.
- Contracts/migrations for evidence, reports, CRM, governance, and claims.
- Pricing Engine canon and Phase 205 research.
- Current approval UI and task surfaces.
- Incoming Research Engine, Intelligence Layer, Content Engine, and SaaS Marketing OS Strategy docs.

## Required research output

- Existing support.
- EvidenceMap proposal.
- Source-quality rubric.
- TTL policy.
- Approval and blocking behavior.
- Acceptance tests and eval cases.

## Codebase Research Addendum - 2026-04-23

### Files inspected

- `lib/markos/mcp/tools/marketing/audit-claim.cjs`
- `lib/markos/mcp/tools/marketing/audit-claim-strict.cjs`
- `lib/markos/mcp/tools/marketing/expand-claim-evidence.cjs`
- `lib/markos/governance/evidence-pack.ts`
- `lib/markos/crm/reporting.ts`
- `lib/markos/crm/attribution.ts`
- `app/(markos)/operations/tasks/evidence-panel.tsx`

### Existing support

- Claim-audit MCP tools can check a claim against tenant canon and return support status, confidence, and evidence.
- Strict audit fails closed when no evidence rows exist.
- Evidence expansion can suggest claim-strengthening variants.
- Governance evidence packs already aggregate audit, billing, identity, approval, and provider evidence.
- CRM reporting and attribution already carry evidence references and readiness status.
- Task UI has a read-only evidence drawer with inputs, outputs, logs, timestamps, actors, retries, and latest errors.

### Gaps

- No central `EvidenceMap` object exists across content, pricing, social, sales, PR, support, SaaS, and public claims.
- No source-quality score, source class, source URL, provenance chain, extraction method, freshness TTL, or known-gap field is canonical.
- No claim TTL policy distinguishes volatile claims like pricing/legal/competitor facts from evergreen strategy guidance.
- No approval blocker connects unsupported claims to the Approval Inbox as a first-class decision.
- No reusable research context cache lets agents reuse fresh evidence while avoiding stale claims.
- No Pricing Engine evidence path exists for competitor price records and PricingRecommendation support.

### Proposed EvidenceMap fields

Minimum fields: `evidence_id`, `tenant_id`, `claim_text`, `claim_type`, `source_class`, `source_url`, `source_title`, `source_captured_at`, `source_published_at`, `extraction_method`, `confidence`, `source_quality_score`, `freshness_ttl_hours`, `expires_at`, `supported`, `known_gaps`, `inference_label`, `created_by_run_id`, `approval_id`, `related_object_type`, `related_object_id`, and `redaction_policy`.

### Source-quality rubric

- 5: first-party system of record or approved operator-provided source.
- 4: official vendor/product/government source.
- 3: reputable analyst, news, or marketplace profile with identifiable date.
- 2: public web source with unclear freshness or weak provenance.
- 1: social/community/operator note that needs corroboration.
- 0: unsupported, synthetic, expired, or contradicted.

### TTL policy

- Pricing, competitor, legal, payment, security, compliance: short TTL, default 24-168 hours depending on source class.
- Product feature, integration, package, availability, SaaS metrics: medium TTL, default 7-30 days.
- Brand, positioning, evergreen literacy, internal process: long TTL, default 90-365 days.
- Any expired volatile claim must re-audit before approval or publish.

### Tests implied

- Strict audit returns unsupported when evidence is missing, expired, or below source-quality threshold.
- Approval Inbox blocks external copy, pricing copy, public proof, and sales enablement with unsupported claims.
- PricingRecommendation cannot be approved without fresh pricing evidence and cost model evidence.
- Research reuse returns fresh evidence first and labels stale evidence as stale, not authoritative.
