---
phase: 202
slug: mcp-server-ga-claude-marketplace
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 202 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Full detail lives in 202-RESEARCH.md §"Validation Architecture". This file is the
> orchestrator-facing Nyquist contract.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node --test` (built-in), configured via `package.json:"test": "node --test test/**/*.test.js"` |
| **Config file** | None — uses node test runner defaults |
| **Quick run command** | `node --test test/mcp/**/*.test.js` |
| **Full suite command** | `npm test` |
| **Coverage tool** | `node --test --experimental-test-coverage test/mcp/**/*.test.js` |
| **Estimated runtime** | ~45 seconds for MCP suite; ~4 minutes full repo |

---

## Sampling Rate

- **After every task commit:** `node --test test/mcp/**/*.test.js`
- **After every plan wave:** `npm test` + `npm run openapi:build`
- **Before `/gsd:verify-work`:** Full suite green + coverage ≥80% `lib/markos/mcp/` + 100% cost/auth modules
- **Max feedback latency:** 45 seconds (MCP-only quick run)

---

## Per-Requirement Verification Map

| Req ID | Behavior | Test Type | Automated Command | Wave 0 Needed | Status |
|--------|----------|-----------|-------------------|---------------|--------|
| MCP-01 | 30 tools registered with valid schemas | unit | `node --test test/mcp/server.test.js` | extend existing | ⬜ pending |
| MCP-01 | Each of 30 tools has live backend (no stubs) | integration | `node --test test/mcp/tools/*.test.js` | ✅ 20 new files | ⬜ pending |
| MCP-01 | OAuth 2.1 + PKCE flow round-trips | integration | `node --test test/mcp/oauth.test.js` | ✅ | ⬜ pending |
| MCP-01 | Session token opaque + rolling TTL extends on tool call | integration | `node --test test/mcp/session.test.js` | ✅ | ⬜ pending |
| MCP-01 | Resources list + read + subscribe + notification push | integration | `node --test test/mcp/resources.test.js` + `notifications.test.js` | ✅ | ⬜ pending |
| MCP-01 | VS Code cert — `.vscode/mcp.json` snippet works | manual + docs smoke | `node scripts/marketplace/validate-manifest.mjs` | ✅ | ⬜ pending |
| MCP-01 | Claude Marketplace manifest valid | unit | `node --test test/mcp/marketplace-manifest.test.js` | ✅ | ⬜ pending |
| QA-01 | Every new endpoint has F-contract | grep + openapi-build | `npm run openapi:build && node --test test/openapi/openapi-build.test.js` | existing | ⬜ pending |
| QA-02 | Every tool input + output validated | unit (AJV harness) | `node --test test/mcp/ajv-validation.test.js` | ✅ | ⬜ pending |
| QA-03 | Migration idempotent forward + rollback | SQL smoke | `node --test test/mcp/migration-idempotency.test.js` | ✅ | ⬜ pending |
| QA-04 | Coverage ≥80% `lib/markos/mcp/` + 100% auth/cost | coverage | `node --test --experimental-test-coverage test/mcp/**/*.test.js` | ✅ | ⬜ pending |
| QA-05 | Structured log emitted per tool call (req_id, duration, status) | integration | `node --test test/mcp/observability.test.js` | ✅ | ⬜ pending |
| QA-06 | Playwright E2E smoke — **DEFERRED** per Phase 201 non-applicability precedent | — | — | ❌ | ➖ non-applicable |
| QA-07 | Load test MCP endpoint (sustains 600 rpm/tenant) | k6 / Artillery | `node scripts/load/mcp-smoke.mjs` OR `k6 run scripts/load/mcp.k6.js` | ✅ | ⬜ pending |
| QA-08 | LLM-backed tool eval suite (plan_campaign, draft, audit) | eval | `node --test test/mcp/evals/*.test.js` | ✅ | ⬜ pending |
| QA-09 | OTEL span per handler + `mcp-req-<uuid>` correlation | integration | `node --test test/mcp/observability.test.js` | ✅ | ⬜ pending |
| QA-10 | Cost meter enforces 402 on breach (atomic check-and-charge) | integration | `node --test test/mcp/cost-meter.test.js` + `402-breach.test.js` | ✅ | ⬜ pending |
| QA-11 | Prompt-injection deny-list catches ≥10 patterns (ASCII + Unicode) | unit | `node --test test/mcp/injection-denylist.test.js` | ✅ | ⬜ pending |
| QA-12 | Rate-limit blocks after 60 rpm session / 600 rpm tenant | integration | `node --test test/mcp/rate-limit.test.js` + `429-breach.test.js` | ✅ | ⬜ pending |
| QA-13 | Per-tenant RLS enforced on `markos_mcp_sessions` + `markos_mcp_cost_window` | integration | `node --test test/mcp/rls.test.js` | ✅ | ⬜ pending |
| QA-14 | `/settings/mcp` WCAG 2.2 AA (grep-shape per Phase 201 precedent) | grep-shape | `node --test test/mcp/ui-a11y.test.js` | ✅ | ⬜ pending |
| QA-15 | Docs + `llms.txt` updated with Phase 202 entries | grep | `node --test test/mcp/docs-mirror.test.js` | ✅ | ⬜ pending |

*Status key: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ➖ non-applicable*

---

## Wave 0 Requirements (test files to create)

New test files required before Wave 1 code lands. Each file is a Wave-0 gap that must exist by phase end.

- [ ] `test/mcp/oauth.test.js` — PKCE round-trip, DCR, `/oauth/token`, revoke, redirect_uri whitelist
- [ ] `test/mcp/session.test.js` — opaque token sha256 hash, rolling 24h TTL extend, revoke via `revoked_at`, cross-tenant 403
- [ ] `test/mcp/cost-table.test.js` — pricing arithmetic, avg-token estimates, Claude Sonnet/Opus/Haiku rates
- [ ] `test/mcp/cost-meter.test.js` — atomic `check_and_charge_mcp_budget` SQL function, 24h hourly window
- [ ] `test/mcp/402-breach.test.js` — budget exhaustion → JSON-RPC `-32001` + HTTP 402 + `{ reset_at, spent_cents, cap_cents }`
- [ ] `test/mcp/rate-limit.test.js` — Upstash sliding window at session + tenant scope
- [ ] `test/mcp/429-breach.test.js` — JSON-RPC `-32002` + HTTP 429 + `Retry-After` header
- [ ] `test/mcp/ajv-validation.test.js` — strict input + output validation edges, $ref resolution against YAML contracts
- [ ] `test/mcp/injection-denylist.test.js` — 10+ patterns (ASCII + Unicode NFKC lookalikes)
- [ ] `test/mcp/pipeline.test.js` — end-to-end middleware chain (auth → rate-limit → validate → inject-filter → free-gate → approval → cost-check → invoke → output-validate → true-up → log + audit)
- [ ] `test/mcp/resources.test.js` — `resources/list`, `resources/read`, `resources/subscribe`, `resources/unsubscribe` for 3 URIs
- [ ] `test/mcp/notifications.test.js` — `notifications/resources/updated` broadcast on canon/literacy/tenant-status write
- [ ] `test/mcp/streaming.test.js` — SSE progress events for LLM tools (draft_message, plan_campaign, audit_claim)
- [ ] `test/mcp/approval-token.test.js` — mutating tools require approval_token; 5-min TTL; single-use (Redis GETDEL)
- [ ] `test/mcp/marketplace-manifest.test.js` — `.claude-plugin/marketplace.json` AJV against Anthropic schema
- [ ] `test/mcp/observability.test.js` — `mcp-req-<uuid>` propagated into Vercel log line + audit row + Sentry tag
- [ ] `test/mcp/migration-idempotency.test.js` — migration 88 + 89 forward + rollback
- [ ] `test/mcp/rls.test.js` — RLS on `markos_mcp_sessions` + `markos_mcp_cost_window`
- [ ] `test/mcp/docs-mirror.test.js` — `docs/mcp-tools.md` references all 30 tools; `llms.txt` appended with Phase 202
- [ ] `test/mcp/ui-a11y.test.js` — `/settings/mcp` + `/oauth/consent` grep-shape (aria-labelledby, `<table><caption>`, #0d9488 focus ring)
- [ ] `test/mcp/tools/*.test.js` — one fixture test per new tool (20 files: 8 stubs-wired + 12 net-new)
- [ ] `test/mcp/evals/*.test.js` — LLM eval fixtures for `plan_campaign`, `draft_message`, `audit_claim`

**Total new test surface: ~22 suite files, ~100–120 tests.**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Claude Marketplace review approval | MCP-01 | External (Anthropic) workflow — not scriptable | Submit listing via Anthropic marketplace portal; capture approval email + live URL into `202-SUBMISSION.md` |
| VS Code live connection smoke | MCP-01 | Requires human VS Code instance + MCP host | Install `.vscode/mcp.json` from `docs/vscode-mcp-setup.md`, run `tools/list` + `plan_campaign`, record transcript |
| Weekly KPI digest email | D-23 | Sendgrid/Resend integration not in phase scope | Manual CRON review on first fire post-launch |
| Prompt-injection red-team | QA-11 | Creative attacks beyond static deny-list | Run through `docs/mcp-redteam-checklist.md` before submission |
| Real LLM cost-table verification | QA-10 | Requires live API keys + real Claude calls | Run `scripts/mcp/verify-cost-table.mjs` against Anthropic prod on one call per model |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (22 new test files)
- [ ] No watch-mode flags (`node --test` is single-run)
- [ ] Feedback latency < 45s for MCP quick run
- [ ] `nyquist_compliant: true` set in frontmatter after plan-checker verifies coverage
- [ ] QA-06 explicitly non-applicable (no Playwright harness in 202 — matches Phase 201 precedent)

**Approval:** pending (set to `approved YYYY-MM-DD` by plan-checker after step 10)
