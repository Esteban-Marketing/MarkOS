# MarkOS v3 Acceptance Gates

## Phase 07 gate

Required evidence:
- RLS policy tests for tenant isolation
- RBAC policy tests for protected operations
- Security event logging for denied access

Gate result:
- Pass only if no cross-tenant leakage path remains.

## Phase 08 gate

Required evidence:
- White-label rendering tests
- Domain verification and fallback tests
- Branding rollback tests

Gate result:
- Pass only if tenant branding is isolated and reversible.

## Phase 09 gate

Required evidence:
- Agent lifecycle and retry tests
- Approval gate bypass negative tests
- MIR/MSP lineage and regeneration history tests

Gate result:
- Pass only if agent outcomes are policy-safe and auditable.

## Phase 10 gate

Required evidence:
- Billing and metering reconciliation tests
- Security and privacy workflow tests
- Incident simulation runbook evidence

Gate result:
- Pass only if monetization and enterprise controls are production-credible.

## Program completion gate

All phases accepted and:
- No unresolved critical severity defects
- Requirement traceability matrix fully satisfied
- Rollout and rollback playbooks approved
