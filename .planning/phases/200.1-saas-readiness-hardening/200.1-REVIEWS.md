---
phase: 200
phase_name: saas-readiness-wave-0
reviewers: [claude-cli-separate-session]
reviewers_attempted: [gemini, claude, codex, opencode]
reviewers_skipped:
  - gemini: not installed
  - codex: usage limit hit until 2026-05-02 (returned `You've hit your usage limit. Upgrade to Plus to continue using Codex`)
  - opencode: not installed
reviewer_note: |
  Workflow rule says skip the current runtime (Claude Code) for independence. In this
  environment NO truly independent CLI was reachable (gemini/opencode missing, codex
  usage-limited). Best available substitute: a fresh `claude -p` invocation, which is
  same model family but runs as a separate process with no shared context. Treat this
  as second-pass adversarial review, not a true cross-AI review. Re-run after 2026-05-02
  with codex restored, or after installing gemini/opencode, for a true 3+-model consensus.
reviewed_at: 2026-04-27
plans_reviewed:
  - 200-01-openapi-PLAN.md
  - 200-02-cli-generate-PLAN.md
  - 200-03-webhooks-PLAN.md
  - 200-04-preset-onboarding-PLAN.md
  - 200-05-llms-txt-PLAN.md
  - 200-06-mcp-server-PLAN.md
  - 200-07-sdk-ci-PLAN.md
  - 200-08-claude-landing-PLAN.md
overall_risk: HIGH
high_concerns: 7
medium_concerns: 10
low_concerns: 5
---

# Cross-AI Plan Review — Phase 200 (SaaS Readiness Wave 0)

> Cross-AI workflow could not assemble independent reviewers in this environment.
> Codex returned a hard usage-limit error until 2026-05-02. Gemini and OpenCode are
> not installed. The reviewer below is `claude -p` running as a fresh, context-free
> CLI session — same model family as the orchestrator, but no shared conversation
> state. This is NOT a true multi-model adversarial review. Treat the findings as a
> second-pass internal challenge.

---

## Claude (separate-session) Review

### 1. Summary

Plan-set is well-decomposed (8 atomic plans, clean dep graph, sensible wave split) and matches the stated 0-day shortlist intent. However, it ships meaningful gaps against its own 15-gate quality baseline — most acutely on threat modeling, secret handling, MCP/webhook authentication, and observability/cost telemetry. Several plans push verification ("output shape passes test") in place of the eval/load/threat duties the baseline mandates. The 2-week budget is aggressive given that Phase 201 already consumes Phase 200 substrate while no `200-VERIFICATION.md` exists — strongly suggests execute-then-verify, which the baseline explicitly bans. Recommend gating Wave 2/3 on remediation of HIGH items below before declaring Phase 200 done.

### 2. Strengths

- **Clean dependency graph.** 200-01 is correctly identified as the chokepoint; wave order respects it.
- **Contract-first discipline mostly held.** F-71/F-72/F-73 added in same plan as endpoints (gates 1+3).
- **Atomic-commit shape + per-plan `must_haves.truths` machine-checkable.** Good GSD hygiene.
- **Fluid Compute + Vercel Queues + AI Gateway choices align with platform 2026 best practice.**
- **Preset cap at 5 explicit** — scope-creep guardrail visible.
- **OpenAPI as single source of truth for SDK + MCP + Zapier downstream — correct architectural choice.**
- **Determinism test for OpenAPI build (200-01 task 4) is unusual and right.**

### 3. Concerns (severity-ranked)

#### HIGH

**H1. Webhook URL SSRF — no validation specified (200-03).**
`engine.subscribe()` stores arbitrary user-supplied URL; `delivery.processDelivery()` POSTs to it from Vercel function. No mention of: deny-list (`169.254.169.254` cloud metadata, RFC1918, `127.0.0.0/8`, `::1`, `file://`, `gopher://`), DNS rebinding mitigation (resolve-then-connect-by-IP + re-validate), or redirect-follow cap. Classic webhook SSRF — direct path from untrusted tenant input to internal network egress on platform infra.

**H2. HMAC replay window undefined (200-03).**
Signing scheme says "HMAC-SHA256 hex with timestamp header + constant-time verify" but no freshness window (e.g., reject `|now - ts| > 300s`) and no nonce/idempotency-key store. Captured deliveries can be replayed indefinitely.

**H3. HMAC secret stored plaintext in DB (200-03).**
Migration 70 lists `secret` column. Quality-baseline anti-pattern: "no secrets in code / env only; Vault (HCP) + rotation policy." Webhook signing keys are secrets — need envelope encryption (KMS) or Vault reference, plus rotation endpoint. Not in plan.

**H4. MCP session has no documented auth (200-06).**
`api/mcp/session.js` Fluid Compute SSE — DISCUSS.md constraint says "All new endpoints JWT-protected via `requireHostedSupabaseAuth`," but Claude Desktop won't carry a Supabase JWT. Needs explicit per-tenant API-key bearer scheme (or OAuth dynamic client registration per MCP 2025-03). Without it: open-relay LLM cost vector, tenant data leakage. Same gap on `api/mcp/tools/[toolName].js`. No per-tenant rate-limit or cost-meter mentioned either → gate 10 violation (kill-switch).

**H5. Demo sandbox abuse vector (200-08).**
"Guest rate-limit per IP" trivially defeated by residential proxy pools. Demo proxies into MCP server (200-06) which itself has no auth (H4). Net: unauthenticated, IP-rate-limited LLM endpoint published on `markos.dev`. LLM-cost DoS waiting to happen. Quality baseline gate 12 mandates BotID on public ingress — not specified here. Tool subset for demo also undefined: `schedule_post` and `consent.changed` exposure to anonymous = blast radius.

**H6. Threat models absent (gate 11 violation).**
Baseline: "STRIDE per new domain — api-keys · MCP · webhooks · connectors · plugins · finetune · agency · signup written in phase DISCUSS.md." DISCUSS.md has a 5-row Risks table — that is not STRIDE. Three new domains (MCP, webhooks, marketplace surface) ship with no formal threat model. This is a baseline gate that *every* phase from 200 onward inherits.

**H7. 2-week budget vs. baseline cost.**
Investment allocation: 20% feature scope = roughly 2 dev-days per plan for feature, with 25% tests + 15% security + 15% observability. 200-06 alone (10 tool adapters wiring existing primitives + MCP server + SSE + marketplace.json + F-71 + per-tool eval per gate 8) is not 2 days — closer to 5 with discipline. Combined with H1–H6 remediation, calendar slips. ROADMAP still "Planned" + Phase 201 already consuming 200 substrate strongly implies execute-then-verify currently in flight — which is the explicit `ship-then-test` anti-pattern.

#### MEDIUM

**M1. OpenAPI merge determinism + collision policy (200-01).**
js-yaml load + JSON serialize without explicit `sortKeys`, stable key ordering, and Date-string normalization → diff churn on every regen → spurious SDK semver bumps (200-07 publishes on `contracts/openapi.json` change). Also: F-NN collision rule undefined (two contracts defining same path or component name → silent overwrite or merge?). Spectral ruleset `.spectral.yaml` content not in plan.

**M2. SDK semver race + supply-chain depth (200-07).**
`info.version` source-of-truth ownership unclear — hand-edited or auto-bumped? Two PRs landing same version → npm publish 409 or worse. No `npm audit` / `pip-audit` gate, no SBOM, lockfile commit policy unspecified. Trusted publishers solves cred rotation only.

**M3. Migration rollback missing (gate 13 violation, 200-03).**
Baseline mandates `supabase/migrations/rollback/` script per migration. Plan 200-03 task 1 lists forward only.

**M4. Eval-as-test absent for 10 MCP tools (gate 8 violation, 200-06).**
Task 2 verify: "output shape" only. Baseline requires deterministic eval scoring brand voice + claim check + neuro spec on every agent output. 10 tools, zero eval files in plan.

**M5. OTEL + cost telemetry not wired (gates 9+10, 200-03/06).**
Trace fields `mcp_session_id`, `webhook_subscription_id` mandated by gate 9 — no plan task instruments Sentry/Vercel Observability. Per-tenant cost meter (`markos_tenant_billing_holds` integration) not in any plan; webhook egress + LLM-via-MCP both billable per tenant.

**M6. CLI tenant/auth model undefined (200-02).**
`markos generate --brief=brief.yaml` — runs against what tenant? Local self-hosted, hosted SaaS, or pure-local? Where credentials come from (`markos login`?) not in scope. Without resolution, audit pipeline + billing untracked.

**M7. llms.txt + .md mirror leak risk (200-05).**
"Walks the docs MDX source, concatenates" with no allow-list. Risk: drafts, internal-only, paywalled-future, or already-published-but-noindexed pages become public and AI-trainable. `.md` catch-all on `app/(marketing)/docs/[[...slug]]/` exposes every slug regardless of `noindex` meta.

**M8. Test-fire endpoint event-injection risk (200-03).**
`test-fire.js` takes `event_name` arbitrary. Tenant-scoped consumer code may treat `consent.revoked` or `approval.resolved` as authoritative → test fires can poison downstream automations. Need: payload field `test: true` enforced + receiver-side documentation contract.

**M9. .agent/markos/templates/presets ↔ bin/lib/presets drift (200-04).**
"Mirrors exactly" with no CI check. Same risk class as the `.cjs/.ts twin export drift` anti-pattern that *does* have a CI gate per baseline.

**M10. Verification gate underspecified.**
OVERVIEW closes with "test baseline maintained (no regressions vs 257/301 pass)" — accepts a ~15% failing suite as baseline. That contradicts gate 4 (coverage floor). Either fix existing failures pre-200 or carve out a documented exclusion list.

#### LOW

**L1. Fluid Compute SSE backpressure + concurrency cap (200-06)** — instance reuse great for cold-starts, but long-lived SSE × marketplace traffic could pin instances. Gate 7 (load test before GA) not satisfied; if marketplace launch ≠ GA, document explicitly.

**L2. marketplace.json data exposure (200-06)** — verify support email, demo URL, icon URL contain no staging/internal hosts.

**L3. GDPR — webhook URL persistence (200-03)** — subscription URL may itself encode tenant identifier or secret in path; stored + logged on every delivery. Erasure policy ownership unclear.

**L4. TTFD < 90s on CI runner is flaky (200-04)** — wall-clock SLA in CI = false-fail risk. Use multi-run p95 or move to local dev-loop check.

**L5. Robots.txt change scope (200-05)** — verify allow-list scoped to `/docs/*` + `/llms-full.txt` only, not `/api/*`, `/admin/*`, draft routes.

### 4. Suggestions (concrete)

1. **Add 200-09: Threat model + auth pre-work.** STRIDE for MCP, webhooks, marketplace; specify per-tenant API-key model for MCP bearer; defer Wave 2 start until merged.
2. **200-03 webhook hardening** — add tasks: (a) URL validator with deny-list + DNS-pin, (b) timestamp window 300s + nonce store, (c) `secret_kms_id` instead of plaintext, (d) rollback SQL, (e) test-fire `test=true` enforcement, (f) per-tenant queue-cost meter.
3. **200-06 MCP hardening** — add tasks: (a) per-tenant API-key issuance + bearer auth on `/api/mcp/*`, (b) per-tool eval suite under `lib/markos/evals/mcp/`, (c) OTEL instrumentation with `mcp_session_id`, (d) cost meter per session.
4. **200-08 demo hardening** — BotID gate, ephemeral signed token (server-side), restricted tool subset (`draft_message` + `audit_claim` only — no scheduling/consent), per-token total-cost cap, not just per-IP rate.
5. **200-01 determinism** — explicit canonicalization spec: sortKeys deep, ISO-string dates, LF line endings; defined collision policy with CI fail.
6. **200-05 doc allow-list** — explicit `docs.manifest.json` curated list, not file-walker; `.md` route gated on manifest membership.
7. **200-07 supply chain** — `npm audit --audit-level=high` + `pip-audit` blocking gate; commit lockfiles; SBOM artifact published with each release.
8. **Phase verification** — author `200-VERIFICATION.md` retroactively *now* before Wave 3 ships, not after; explicitly score 15 gates yes/no with evidence per `QUALITY-BASELINE.md` scorecard.
9. **Calendar realism** — either (a) extend to 3 weeks, (b) defer 200-08 to Phase 201, or (c) cut MCP tools from 10 → 5 (`draft_message, audit_claim, list_pain_points, generate_brief, explain_literacy` — read/propose-only matches Decision 9 tier).

### 5. Risk Assessment

**Overall: HIGH.**

Justification: SSRF (H1) + plaintext webhook secrets (H3) + unauthenticated MCP + open demo (H4/H5) constitute a compound exposure that, if any single one ships, lets an attacker drive cost or extract data on day-1 of the SaaS launch. Threat model absence (H6) = baseline gate-11 fail before any code lands. Calendar/verification gap (H7 + M10) suggests current trajectory is execute-then-verify, which the baseline lists as banned anti-pattern #1.

Architecturally the plan-set is sound. Security + observability discipline is the gap. Reopen as **200.1 (Hardening Wave)** — same pattern Phase 201 used for the 201-REVIEWS findings (per recent commit `c05b533`) — before promoting to v4.0.0 milestone close.

---

## Codex Review

> **SKIPPED — usage limit.** `codex exec` returned `You've hit your usage limit.
> Upgrade to Plus to continue using Codex (<https://chatgpt.com/explore/plus>), or
> try again at May 2nd, 2026 9:44 AM.` No review produced.

---

## Gemini Review

> **SKIPPED — not installed.** `gemini` CLI unavailable on this host.

---

## OpenCode Review

> **SKIPPED — not installed.** `opencode` CLI unavailable on this host.

---

## Consensus Summary

Only one reviewer (Claude separate session) returned content, so a true consensus
cannot be computed.

### Single-Pass Headline Concerns

1. **H1+H2+H3 Webhook surface (200-03):** SSRF (no URL deny-list / DNS-pin), no HMAC freshness window or nonce store, plaintext secrets in DB. Treat as a single hardening cluster.
2. **H4+H5 MCP+Demo authentication & cost (200-06+200-08):** Open-relay LLM endpoint risk; gate-10 (per-tenant kill-switch) not implemented; demo IP rate-limit defeated by residential proxies.
3. **H6 STRIDE threat models absent.** Baseline gate-11 fails before any code ships.
4. **H7+M10 Execute-then-verify drift.** Phase 201 already consumes Phase 200 substrate while ROADMAP marks 200 "Planned" and no 200-VERIFICATION.md exists — exact `ship-then-test` anti-pattern the baseline bans.

### Cross-Phase Pattern (mirrors Phase 201)

Same risk shape that Phase 201's review surfaced (just resolved by adding Phase 201.1
in commit `c05b533`): substrate looks shipped + tests green, but quality-gate
discipline is post-hoc. Recommend the same pattern: open **Phase 200.1 (Hardening
Wave)** scoped to H1–H7 + M3 + M4 + M5 + M9 + M10. Defer Phase 200 closeout (i.e.
200-VERIFICATION.md PASS verdict + v4.0.0 promotion) until 200.1 ships.

### Recommended Next Move

1. Author `.planning/phases/200-saas-readiness-wave-0/200-VERIFICATION.md` retroactively. Score every quality-baseline gate with concrete code/test evidence — HIGH/MEDIUM concerns above are pre-marked GAPS, not unknowns.
2. Open **Phase 200.1** via `/gsd-insert-phase 200.1` then `/gsd-plan-phase 200.1 --reviews` (mirrors the 201 → 201.1 pattern landed earlier today).
3. Re-run `/gsd-review --phase 200 --all` after 2026-05-02 with codex restored AND/OR after gemini/opencode install for a true 3+-model consensus before v4.0.0 sign-off.

Until that lands: do **not** treat Phase 200 as authorization to ship v4.0.0.
The substrate works (Phase 201 proves it), but the security + observability +
verification discipline that the 15-gate baseline declared mandatory is not yet
in evidence.
