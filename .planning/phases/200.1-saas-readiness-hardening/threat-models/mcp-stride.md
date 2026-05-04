# STRIDE Threat Model - MCP

**Phase:** 200.1-saas-readiness-hardening
**Domain scope:** `api/mcp/*`, `lib/markos/mcp/*`, bearer-key issuance, rate limiting, cost events, and kill-switch enforcement
**Authored:** 2026-04-29
**Last reviewed:** 2026-04-29

## Trust boundaries

| Boundary | Description |
|----------|-------------|
| Claude Desktop -> MCP session | Untrusted client traffic proposes bearer credentials and tool requests. |
| MCP middleware -> tool adapters | Authenticated tenant metadata is attached to downstream tool execution. |
| tool handler -> AI gateway | Tool execution may trigger LLM calls with billable side effects. |
| tool handler -> cost and audit sinks | Billing and audit records must complete inline to keep evidence trustworthy. |
| billing hold state -> request path | Financial controls can deny otherwise-valid tenant requests. |

## Assumptions and scope notes

- Phase 200 MCP tooling exists already; this phase hardens auth, billing, and evidence paths.
- Claude Desktop cannot rely on hosted Supabase JWTs for production MCP calls.
- Per-tenant bearer auth is distinct from the marketplace OAuth flow and can coexist with it.
- Cost telemetry is treated as request-critical because downstream billing depends on it.
- Prompt-injection resistance for tool outputs is handled by evals and substrate guards, not by bearer auth alone.
- Follow-up scope enforcement beyond the initial safe tool set remains a later hardening phase.

## Threat register

### Spoofing

Scope notes:
- Primary surface: bearer tokens and session initialization.
- Primary mitigations: `200.1-07` plus existing OAuth fallbacks.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-mcp-S-01 | An anonymous client claims a tenant id without a valid bearer. | `200.1-07` adds `mks_` bearer issuance and server-side hash lookup before any session logic runs. | low | `200.1-07-PLAN.md` |
| T-200.1-mcp-S-02 | A forged bearer relies on naive string comparison to bypass auth checks. | `200.1-07` requires sha256 hashing and `timingSafeEqual` verification inside the auth-bearer layer. | low | `lib/markos/mcp/server.cjs` |
| T-200.1-mcp-S-03 | A demo or marketplace token is reused as a production MCP credential. | `200.1-10` isolates demo tokens behind a distinct audience and `200.1-07` keeps real MCP auth on the `mks_` bearer path only. | low | `200.1-10-PLAN.md` |

### Tampering

Scope notes:
- Primary surface: request volume counters, cost rows, and tool outputs.
- Primary mitigations: `200.1-07` and `200.1-08`.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-mcp-T-01 | Rate-limit state is corrupted by non-atomic increments under concurrency. | `200.1-07` introduces a SQL increment function so the current-minute window updates atomically. | low | `200.1-07-PLAN.md` |
| T-200.1-mcp-T-02 | Cost rows are dropped or edited after tool execution, breaking billing evidence. | `200.1-07` records cost events inline and fail-closed before the HTTP response completes. | low | `api/mcp/tools/[toolName].js` |
| T-200.1-mcp-T-03 | Tool prompts or responses drift away from brand and evidence requirements. | `200.1-08` adds deterministic eval-as-test coverage for all shipped MCP tools. | medium | `200.1-08-PLAN.md` |

### Repudiation

Scope notes:
- Primary surface: proving which tenant invoked which tool and when.
- Primary mitigations: inline audit rows and cost telemetry.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-mcp-R-01 | A tenant denies invoking a tool that caused side effects or cost. | `200.1-07` writes `tool.invoked` audit rows inline with tenant, session, and tool metadata. | low | `200.1-07-PLAN.md` |
| T-200.1-mcp-R-02 | A failed auth attempt leaves no trace for abuse investigation. | `200.1-07` emits `auth.failed` audit signals on bearer rejection. | low | `200.1-07-PLAN.md` |
| T-200.1-mcp-R-03 | Key management actions cannot be tied back to a user or tenant. | `200.1-07` adds create/list/revoke endpoints with dedicated audit actions for API-key lifecycle events. | low | `contracts/F-71.1-mcp-auth-bearer-v1.yaml (deferred)` |

### Information Disclosure

Scope notes:
- Primary surface: token material, tenant data returned by tools, and observability payloads.
- Primary mitigations: hash-only storage, evals, and attribute-only OTEL.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-mcp-I-01 | Plaintext API keys leak through storage or list endpoints. | `200.1-07` stores only sha256 hashes and returns plaintext tokens once on create. | low | `200.1-07-PLAN.md` |
| T-200.1-mcp-I-02 | Tool outputs expose unsupported claims or tenant-sensitive context. | `200.1-08` eval suites check claim grounding and tone discipline across the shipped tool set. | medium | `200.1-08-PLAN.md` |
| T-200.1-mcp-I-03 | OTEL spans accidentally include prompts, payloads, or secrets. | `200.1-09` limits span attributes to ids, tool name, cost, and status rather than payload bodies. | low | `200.1-09-PLAN.md` |

### Denial of Service

Scope notes:
- Primary surface: open-relay cost amplification and long-lived session abuse.
- Primary mitigations: `200.1-07`, `200.1-09`, and existing MCP cleanup.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-mcp-D-01 | Anonymous or weakly-authenticated traffic turns MCP into a cost sink. | `200.1-07` requires valid bearer auth before session start and before tool dispatch. | low | `api/mcp/session.js` |
| T-200.1-mcp-D-02 | A single tenant floods the endpoint and starves shared capacity. | `200.1-07` enforces a 100 req/min per-tenant limit with retry-after signaling. | low | `200.1-07-PLAN.md` |
| T-200.1-mcp-D-03 | Billing-hold state is ignored and abusive tenants continue spending. | `200.1-07` checks `markos_tenant_billing_holds` inline and returns 402 when tripped. | low | `200.1-07-PLAN.md` |

### Elevation of Privilege

Scope notes:
- Primary surface: tool scope, session carry-over, and cross-tenant data boundaries.
- Primary mitigations: bearer tenant binding and follow-up scope enforcement.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-mcp-E-01 | A bearer created for one tenant is used to access another tenant's data plane. | `200.1-07` binds keys to tenant rows and rehydrates tenant context from the hash lookup only. | low | `200.1-07-PLAN.md` |
| T-200.1-mcp-E-02 | Broad key scopes enable tools a tenant did not intend to allow. | `200.1-07` stores scopes on the key record and documents later per-tool enforcement as explicit follow-up, not hidden debt. | medium | `200.1-11-PLAN.md` |
| T-200.1-mcp-E-03 | Prompt injection convinces a tool to exceed its intended safe operating posture. | `200.1-08` deterministic evals and existing injection-denylist substrate reduce this path, but residual risk remains non-zero for future tools. | medium | `lib/markos/mcp/injection-denylist.cjs` |

## Control inventory

- `200.1-07` is the auth, rate-limit, cost-event, and kill-switch anchor plan.
- `200.1-08` is the tool-quality and prompt-discipline anchor plan.
- `200.1-09` is the observability anchor plan for MCP request traces.
- Existing session cleanup and marketplace logging stay in place beside the new controls.
- Future scope enforcement is documented as follow-up rather than implied complete.
- Tool invocation evidence is intentionally split between audit rows and billing rows.

## Residual risk acceptance

| Risk | Severity | Owner | Acceptance rationale | Re-review trigger |
|------|----------|-------|----------------------|-------------------|
| T-200.1-mcp-T-03 eval coverage can lag brand evolution | medium | platform | Deterministic evals lock today’s canon, but canon updates must intentionally refresh fixtures and scorers. | Any change to tool copy contracts or Brand Stance rubric |
| T-200.1-mcp-I-02 grounded-claim regressions on new tools | medium | platform | Current tool set gets eval coverage; new tools must adopt the same harness before release. | New MCP tool introduced or major tool rewrite |
| T-200.1-mcp-E-02 scope enforcement remains partial | medium | platform | The key schema is ready now, while deeper per-tool scope gates are explicitly tracked as follow-up work. | First request for delegated write-capable MCP scopes |

## Review cadence

- Review whenever MCP auth model or client onboarding changes.
- Review whenever a new MCP tool or tool category ships.
- Review whenever billing-hold semantics or retry-after policy changes.
- Review whenever demo, marketplace, and production auth paths intersect differently.
