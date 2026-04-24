# Quality Baseline — Day-0 Non-Negotiables

> Ratified 2026-04-16 under operator directive: "invest the most in early stages to build with quality since day 0." Every phase from 200 onward inherits these gates. Any phase that degrades the baseline must explicitly justify in DISCUSS.md and propose a remediation plan.

## The 15 gates

### Contracts + API hygiene

1. **Contract-first**. No new endpoint without an OpenAPI 3.1 contract (`contracts/F-NN-*.yaml`) merged into the public spec before code ships. Spectral lint blocks PRs.
2. **Typed HTTP boundary**. Every `api/*` handler validates request + response with Zod schemas derived from the contract. No untyped body access.
3. **Semver-on-contract**. Contract versions drive SDK + public docs. Breaking change = new major + deprecation window ≥ 12 months.

### Testing

4. **Coverage floor**. ≥ 80% statement coverage on new `lib/markos/**` code. **100%** on: tenant-isolation paths, auth/authz, billing enforcement, consent gates, approval packages, migration scripts.
5. **Integration-real**. Tenant + CRM + billing tests run against real Supabase, not mocks. Mock = banned for boundary tests ([[Gotchas]]).
6. **E2E smoke**. Playwright suite runs critical paths on every PR: signup → onboarding preset → first draft → first approval → first dispatch → first webhook delivery.
7. **Load tests before GA**. MCP + webhook + connector-event ingest get k6 or Artillery load tests with published SLO report before any GA label.
8. **Eval-as-test**. Every agent has a deterministic eval suite (`lib/markos/evals/`). LLM outputs scored on brand voice + claim check + neuro spec before merge.

### Observability

9. **OTEL from day 0**. All `api/**` emit OpenTelemetry (OTLP) to Sentry + Vercel Observability. Traces include `tenant_id`, `agent_run_id`, `mcp_session_id`, `webhook_subscription_id`.
10. **Per-tenant cost telemetry + kill-switch**. Every LLM call, agent run, connector event, and webhook delivery is metered per tenant. Hard budget + circuit breaker (`markos_tenant_billing_holds`). No runaway spend possible.

### Security

11. **Threat model per new domain**. api-keys · MCP · webhooks · connectors · plugins · finetune · agency · signup each get a written threat model (STRIDE) in phase DISCUSS.md before implementation.
12. **Platform baseline**. CSP nonce · HSTS · Referrer-Policy · Permissions-Policy · SRI · rate-limit per-key · Vercel BotID on signup + public ingress · signed cookies · OWASP ASVS L2 on new surfaces.

### Data + compliance

13. **Idempotent migrations + rollback**. Every SQL migration has a named rollback script in `supabase/migrations/rollback/` and a dry-run test case. Forward-only in prod; rollback tested in staging.
14. **Accessibility AA-min**. axe-playwright runs on every UI PR. WCAG 2.2 AA hard fails. AAA for marketing critical paths.

### Docs

15. **Docs-as-code + live**. Every contract ships with docs pages. Docs deploy blocks code deploy. `llms.txt` + markdown mirror updated by the same CI.

## Per-phase gate review

At `/gsd-verify-work <phase>` every phase verifier confirms all 15 gates for the phase. Failure to meet → VERIFICATION.md captures with justification or rework plan.

## Operationalization for phases 204-220

For the active and reserved v4.0.0/v4.1.0 phase family, execution should now read this baseline together with:

- `.planning/V4.0.0-TESTING-ENVIRONMENT-PLAN.md`
- `.planning/V4.0.0-PHASE-TEST-REQUIREMENTS-MATRIX.md`

Those artifacts translate the baseline into concrete `Vitest`, `Playwright`, and `Chromatic` duties for each planned phase.

## Investment budget allocation

User directive: quality-first, not feature-first.

| Investment area | Allocation (of wave-0 effort) |
|---|---|
| Contracts + typed boundaries | 15% |
| Tests (unit + integration + e2e + load) | 25% |
| Observability + cost telemetry | 15% |
| Security (threat models + platform baseline) | 15% |
| Docs + developer experience | 10% |
| Feature scope | 20% |

Feature scope intentionally capped at 20% in wave-0. Subsequent waves rebalance once baseline is in place.

## Anti-patterns explicitly banned

- **Ship then test** — no.
- **"Temporary" mocks in integration tests** — no.
- **Unversioned public endpoints** — no.
- **Silent feature flags** — every flag in a registry, telemetry'd.
- **Background migrations without rollback** — no.
- **Tenant-scoped tables without RLS** — no.
- **New secrets in code / env only** — no; Vault (HCP) + Vercel env + rotation policy.
- **"Quick fix" that bypasses the Message Crafting Pipeline** — no.
- **Agent mutations without approval package** — no. F-63A is law ([[Key Decisions]]).
- **Unlogged LLM calls** — no; every call in `markos_llm_call_events`.
- **Drift between `.cjs` + `.ts` twin exports** — no; CI check.

## Platform choices (Vercel stack)

Align with Vercel 2026 best practice:

- **Fluid Compute** default for `api/**` — instance reuse cuts cold-start cost, allows graceful shutdown of MCP sessions + agent runs.
- **Vercel AI Gateway** — default LLM routing; provider markup transparent in billing.
- **Vercel Queues** — all async work (webhook delivery, evals, fine-tune prep, connector ingest).
- **Vercel Sandbox** — all user-submitted code (locale rules, marketplace agents) runs in sandbox.
- **Rolling Releases** — tenancy + autonomy changes roll out gradually.
- **Routing Middleware** — tenant subdomain resolution + residency routing.
- **BotID** — signup + public API protection.
- **Vercel Agent** — AI code review on all PRs.
- **vercel.ts** — configuration-as-TypeScript (replaces vercel.json).

## Quality scorecard

Every phase closes with a scorecard:

```yaml
phase: 200
wave: 0
gates:
  contracts_first:        { status: pass, evidence: F-71,F-72,F-73 }
  typed_boundary:         { status: pass }
  coverage_lib:           { status: pass, value: 0.84 }
  coverage_critical:      { status: pass, value: 1.0 }
  integration_real:       { status: pass }
  e2e_smoke:              { status: pass, runs: 412 }
  load_tests:             { status: pass, p95_mcp_ms: 180 }
  evals:                  { status: pass, drift_score: 0.02 }
  otel:                   { status: pass, coverage_endpoints: 1.0 }
  cost_telemetry:         { status: pass }
  threat_model:           { status: pass, doc: DISCUSS.md#threat-model }
  platform_baseline:      { status: pass }
  migrations_rollback:    { status: pass, tested_staging: true }
  accessibility:          { status: pass, axe_violations: 0 }
  docs_live:              { status: pass, coverage_contracts: 1.0 }
```

Every gate pass = phase clear. Any fail = phase blocked until remediation.

## Related

- [MarkOS Canon](../../../obsidian/brain/MarkOS%20Canon.md) · [Key Decisions](../../../obsidian/brain/Key%20Decisions.md) · [Patterns](../../../obsidian/brain/Patterns.md) · [Gotchas](../../../obsidian/brain/Gotchas.md)
- [LLM Observability for Marketing](../../../obsidian/Literacy/Marketing%20Literacy/20%20AI%20&%20Agentic%20Marketing%20(2026%20Frontier)/LLM%20Observability%20for%20Marketing.md)
- Roadmap: `obsidian/thinking/2026-04-16-markos-saas-roadmap.md`
