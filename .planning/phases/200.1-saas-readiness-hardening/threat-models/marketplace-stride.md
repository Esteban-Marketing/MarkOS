# STRIDE Threat Model - Marketplace and Demo Sandbox

**Phase:** 200.1-saas-readiness-hardening
**Domain scope:** marketplace listing surfaces, demo sandbox routes, and the public Claude integration landing path
**Authored:** 2026-04-29
**Last reviewed:** 2026-04-29

## Trust boundaries

| Boundary | Description |
|----------|-------------|
| public visitor -> demo issue-token route | Anonymous traffic requests a sandbox session. |
| demo client -> invoke route | Client-held demo token crosses back to server-side tool execution. |
| marketplace listing -> public readers | Public metadata must not expose staging hosts or internal-only routes. |
| demo sandbox -> synthetic tenant | Demo requests must never inherit real-tenant authority. |

## Assumptions and scope notes

- The sandbox is intentionally narrower than production MCP.
- UI restrictions are convenience only; server checks remain authoritative.
- BotID is a gate, not a rate-limit replacement.
- Demo activity is auditable separately from real tenant activity.
- Public marketplace metadata should remain safe for broad indexing.

## Threat register

### Spoofing

Scope notes:
- Primary mitigations: `200.1-10` and existing BotID substrate.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-marketplace-S-01 | A bot or proxy farm impersonates a normal visitor to mint demo sessions cheaply. | `200.1-10` requires BotID verification before issuing a demo token. | low | `lib/markos/auth/botid.cjs` |
| T-200.1-marketplace-S-02 | A forged demo token impersonates a valid sandbox session. | `200.1-10` signs a short-lived JWT with audience `demo-sandbox` and constant-time signature verification. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-S-03 | Public marketplace metadata impersonates a trusted production endpoint while pointing elsewhere. | Threat remains covered by manual public-host audits and later verification work; it is not silently accepted as closed. | medium | `200.1-11-PLAN.md` |

### Tampering

Scope notes:
- Primary mitigations: server-side tool allow-list and signed token claims.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-marketplace-T-01 | A client edits its local allow-list to invoke unsafe tools. | `200.1-10` validates tool membership server-side and only permits `draft_message` plus `audit_claim`. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-T-02 | A client tampers with cost-cap data to continue using an exhausted session. | `200.1-10` records cost server-side and rejects with 402 when the total exceeds the token cap. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-T-03 | Marketplace-facing copy or demo framing drifts away from safe product claims. | Existing review plus later eval and OTEL evidence make drift visible; public-surface claim discipline stays a live review concern. | medium | `app/(marketing)/integrations/claude/demo/page.tsx` |

### Repudiation

Scope notes:
- Primary mitigations: audit rows and hashed request metadata.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-marketplace-R-01 | A demo abuser denies starting a costly demo session. | `200.1-10` audit-emits `demo.session_started` with hashed IP and user-agent context. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-R-02 | A user disputes why a demo session was denied or capped. | Signed claims and server-side cost accumulation keep the denial reason reproducible. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-R-03 | The team cannot prove which hardening layer blocked a sandbox request. | `200.1-09` later adds endpoint-level OTEL spans so auth, tool, and cost-cap failures leave traceable evidence. | low | `200.1-09-PLAN.md` |

### Information Disclosure

Scope notes:
- Primary mitigations: synthetic tenant execution and public-host verification.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-marketplace-I-01 | Demo output leaks real tenant data into a public sandbox. | `200.1-10` routes sandbox execution through a synthetic tenant context rather than production bearer auth. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-I-02 | Marketplace metadata exposes staging hosts or internal-only routes. | The gap is tracked explicitly as a manual audit follow-up rather than treated as closed by default. | medium | `200.1-11-PLAN.md` |
| T-200.1-marketplace-I-03 | Client-visible error handling reveals signing or secret-management internals. | Demo verification returns bounded reason codes and never discloses raw signing material. | low | `lib/markos/marketing/demo-sandbox.cjs (deferred)` |

### Denial of Service

Scope notes:
- Primary mitigations: BotID, token TTL, and cost caps.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-marketplace-D-01 | Proxy rotation drives large-scale public LLM spend through the demo. | `200.1-10` combines BotID, 15-minute TTL, and a $0.50 per-token server-side cap. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-D-02 | A single session loops cheap requests to accumulate expensive tool work. | `200.1-10` restricts the sandbox to two read/propose-only tools with predictable cost envelopes. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-D-03 | Public-surface issues go unnoticed because no trace data exists. | `200.1-09` adds OTEL wrappers around public routes so cost-cap and token failures surface operationally. | low | `200.1-09-PLAN.md` |

### Elevation of Privilege

Scope notes:
- Primary mitigations: synthetic tenant boundary and audience-isolated tokens.

| Threat ID | Threat | Mitigation | Residual risk | Verifier |
|-----------|--------|------------|---------------|----------|
| T-200.1-marketplace-E-01 | A demo token is replayed against real MCP endpoints for production access. | `200.1-10` uses a distinct token audience while `200.1-07` production MCP accepts only `mks_` bearer credentials. | low | `200.1-07-PLAN.md` |
| T-200.1-marketplace-E-02 | Demo invocation reaches unsafe tools like scheduling or consent mutation. | `200.1-10` hardcodes the server-side allow-list to `draft_message` and `audit_claim` only. | low | `200.1-10-PLAN.md` |
| T-200.1-marketplace-E-03 | Marketplace install or landing traffic implicitly creates tenant-admin authority. | Install and signup remain separate flows; public discovery never maps directly to tenant admin privilege. | low | `200.1-10-PLAN.md` |

## Residual risk acceptance

| Risk | Severity | Owner | Acceptance rationale | Re-review trigger |
|------|----------|-------|----------------------|-------------------|
| T-200.1-marketplace-S-03 public-host audit is still partly manual | medium | marketing-platform | Public-metadata review exists, but stronger automation is deferred and documented. | Marketplace manifest shape or host list changes |
| T-200.1-marketplace-I-02 listing metadata exposure audit remains follow-up owned | medium | marketing-platform | The phase records the gap explicitly instead of assuming public files are safe. | Any marketplace.json or landing-route expansion |
| T-200.1-marketplace-T-03 copy drift on public demo surfaces | medium | marketing | Review and product verification catch most drift today; stronger eval coverage for public copy can follow. | Any major rewrite of demo or marketplace copy |

## Review cadence

- Review for every demo sandbox flow change.
- Review for every marketplace manifest update.
- Review for every tool added to the public demo allow-list.
