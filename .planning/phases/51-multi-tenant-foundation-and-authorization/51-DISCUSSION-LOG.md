# Phase 51: Multi-Tenant Foundation and Authorization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `51-CONTEXT.md`.

**Date:** 2026-04-03
**Phase:** 51-multi-tenant-foundation-and-authorization
**Mode:** Auto (`--auto` equivalent defaults selected)
**Areas discussed:** Tenant identity and partitioning, tenant context propagation, IAM role model and enforcement, security events and auditability

---

## Tenant Identity and Partitioning

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical `tenant_id` with compatibility reads | Make `tenant_id` canonical and keep temporary compatibility adapters for legacy `workspaceId` fields during migration | Yes |
| Keep workspace-centric identity | Continue using workspace keys as primary multi-tenant partition key | |
| Dual canonical keys | Treat both `tenant_id` and `workspaceId` as first-class canonical keys | |

**User's choice:** Canonical `tenant_id` with compatibility reads (auto-selected recommended default)
**Notes:** Aligns with TEN-01 and minimizes long-term ambiguity while avoiding abrupt breakage.

---

## Tenant Context Propagation

| Option | Description | Selected |
|--------|-------------|----------|
| Auth-boundary resolution + fail-closed propagation | Resolve tenant context at auth boundary and require it through all protected paths; deny when missing | Yes |
| Per-handler best-effort resolution | Let each handler infer tenant context independently, allowing graceful fallback | |
| Route-only tenant check | Enforce tenant context only at route layer and trust downstream services | |

**User's choice:** Auth-boundary resolution + fail-closed propagation (auto-selected recommended default)
**Notes:** Best fit for TEN-02/TEN-03 and existing hosted wrapper enforcement pattern.

---

## IAM Role Model and Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical v3.2 roles + compatibility mapping | Introduce new IAM roles now and map legacy roles during transition | Yes |
| Keep legacy RBAC roles only | Delay IAM role expansion to a future phase | |
| Hard cutover to new roles only | Replace all legacy role handling immediately without compatibility mapping | |

**User's choice:** Canonical v3.2 roles + compatibility mapping (auto-selected recommended default)
**Notes:** Delivers IAM-01/IAM-02 without destabilizing existing role-gated surfaces.

---

## Security Events and Auditability

| Option | Description | Selected |
|--------|-------------|----------|
| Structured immutable deny events with sanitized payloads | Emit explicit cross-tenant deny events with actor/tenant/reason/correlation id and redacted payloads | Yes |
| Minimal denial logging | Log only HTTP status and route name on denial | |
| Deferred deny-event instrumentation | Implement deny-event telemetry in a later phase | |

**User's choice:** Structured immutable deny events with sanitized payloads (auto-selected recommended default)
**Notes:** Required to satisfy TEN-03 and future SEC-01 traceability.

---

## the agent's Discretion

- Exact migration sequencing order (schema-first vs middleware-first) may be optimized during planning if fail-closed semantics hold.
- Utility/module decomposition can follow existing repository conventions.

## Deferred Ideas

- Plugin capability-level permission overlays (belongs to Phase 52/53).
- Enterprise SSO/SAML bootstrapping edge cases (belongs to Phase 54).