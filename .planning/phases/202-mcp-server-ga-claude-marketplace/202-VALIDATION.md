---
phase: 202
slug: mcp-server-ga-claude-marketplace
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-17
last_updated: 2026-04-27
---

# Phase 202 - Validation Strategy

> Historical validation contract reconciled with executed code and the verified shipped scope. Phase 202 is closed for the Claude Marketplace launch package plus VS Code cert-ready scope; broader client certifications and external marketplace approval remain outside the phase gate.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (built-in), configured via `package.json` |
| **Config file** | none - uses Node test runner defaults |
| **Quick run command** | `node --test test/mcp/**/*.test.js` |
| **Full suite command** | `npm test` |
| **Coverage tool** | `node --test --experimental-test-coverage test/mcp/**/*.test.js` |
| **Estimated runtime** | ~45 seconds for MCP suite / ~4 minutes full repo |

## Historical Sampling Rate

- After every task commit: run the MCP-targeted suite.
- After every plan wave: run `npm test` plus `npm run openapi:build`.
- Before `/gsd:verify-work`: full suite green, coverage floor met, and contract build checked.
- Max quick-feedback target: 45 seconds.

## Current Reconciliation Status

| Surface | Evidence | Status |
|---------|----------|--------|
| Wave 1 session persistence and cost-window substrate | `202-01-SUMMARY.md`, `202-03-SUMMARY.md` | complete |
| Wave 2 OAuth + pipeline safety | `202-02-SUMMARY.md`, `202-04-SUMMARY.md` | complete |
| Wave 3 observability, tool graduation, and resources | `202-05-SUMMARY.md`, `202-06-SUMMARY.md`, `202-08-SUMMARY.md` | complete |
| Wave 4 net-new tool surface and `/settings/mcp` UI | `202-07-SUMMARY.md`, `202-09-SUMMARY.md` | complete |
| Wave 5 marketplace package, docs, evals, and KPI digest | `202-10-SUMMARY.md`, `202-VERIFICATION.md` | complete |
| External operational submission steps | `202-VERIFICATION.md`, `deferred-items.md` | informational only |

## Reconciled Verification Map

| Plan | Wave | Requirement Focus | Automated Evidence | Status |
|------|------|-------------------|--------------------|--------|
| `202-01` | 1 | `MCP-01`, `QA-03`, `QA-13` | `node --test test/mcp/session.test.js test/mcp/rls.test.js test/mcp/migration-idempotency.test.js` | complete |
| `202-02` | 2 | `MCP-01`, `QA-01`, `QA-14` | `node --test test/mcp/oauth.test.js test/mcp/consent-ui-a11y.test.js` | complete |
| `202-03` | 1 | `MCP-01`, `QA-10` | `node --test test/mcp/cost-table.test.js test/mcp/cost-meter.test.js test/mcp/402-breach.test.js` | complete |
| `202-04` | 2 | `MCP-01`, `QA-02`, `QA-09`, `QA-11`, `QA-12` | `node --test test/mcp/rate-limit.test.js test/mcp/429-breach.test.js test/mcp/ajv-validation.test.js test/mcp/injection-denylist.test.js test/mcp/approval-token.test.js test/mcp/pipeline.test.js` | complete |
| `202-05` | 3 | `MCP-01`, `QA-05`, `QA-09` | `node --test test/mcp/observability.test.js` | complete |
| `202-06` | 3 | `MCP-01`, tool graduation | `node --test test/mcp/tools/plan-campaign.test.js test/mcp/tools/research-audience.test.js test/mcp/tools/generate-brief.test.js test/mcp/tools/audit-claim.test.js test/mcp/tools/list-pain-points.test.js test/mcp/tools/rank-execution-queue.test.js test/mcp/tools/schedule-post.test.js test/mcp/tools/explain-literacy.test.js` | complete |
| `202-07` | 4 | `MCP-01`, marketing/CRM/literacy/tenancy expansion | `node --test test/mcp/tools/marketing-net-new.test.js test/mcp/tools/crm-net-new.test.js test/mcp/tools/literacy-net-new.test.js test/mcp/tools/tenancy-net-new.test.js test/mcp/server.test.js` | complete |
| `202-08` | 3 | `MCP-01`, resources and notifications | `node --test test/mcp/resources.test.js test/mcp/notifications.test.js test/mcp/streaming.test.js` | complete |
| `202-09` | 4 | `MCP-01`, `QA-14`, tenant admin surface | `node --test test/mcp/mcp-usage-api.test.js test/mcp/mcp-settings-ui-a11y.test.js` | complete |
| `202-10` | 5 | `MCP-01`, `QA-01`, `QA-07`, `QA-08`, `QA-15` | `node --test test/mcp/marketplace-manifest.test.js test/mcp/docs-mirror.test.js test/mcp/evals/plan-campaign-eval.test.js test/mcp/evals/draft-message-eval.test.js test/mcp/evals/audit-claim-eval.test.js test/openapi/openapi-build.test.js` | complete |

The verification artifact records `362` passing MCP assertions, `25` passing Phase 201 regression assertions, and an OpenAPI build suite that improved but still carries one pre-existing deferred `tags:` failure. That deferred contract-metadata item is informational and not a Phase 202 regression.

## Operational Post-Submission Checks (Not Phase Gates)

| Check | Why It Exists | Gate Status |
|-------|---------------|-------------|
| Claude Marketplace approval workflow | External Anthropic process after submission | informational only |
| VS Code live connection smoke | Useful launch confidence once deployed | informational only |
| Manual red-team walkthrough from `docs/mcp-redteam-checklist.md` | Sensible operational hygiene before public promotion | informational only |
| Live `verify-cost-table.mjs` against production provider pricing | Drift check for future rate changes | informational only |

## Validation Sign-Off

- [x] All executed plans now have explicit automated evidence.
- [x] Wave 0 is reconciled as complete.
- [x] `nyquist_compliant: true` is justified by the reconciled map.
- [x] Manual approval-style checks are clearly separated from true phase gates.
- [x] Validation metadata matches the verified shipped scope.
- [x] QA-06 remains explicitly deferred rather than silently dropped.

**Approval:** reconciled on 2026-04-27 against `202-VERIFICATION.md`, `202-REVIEWS.md`, the 10 plan summaries, and `deferred-items.md`.
