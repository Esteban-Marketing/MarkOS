# MarkOS v3

## What this is

MarkOS v3 is an AI-first and agentic-ready B2B SaaS platform for digital marketing teams that need predictable campaign execution with governance, quality controls, and brand safety.

It combines:
- Tenant workspaces for agencies, SMB teams, and solo operators
- White-label brand customization for customer-facing delivery
- MIR and MSP strategic intelligence foundations
- Human-in-the-loop approval for high-impact outputs
- Metered AI usage and enterprise-grade auditability

## Core value

A team can move from onboarding and strategy inputs to approved, branded, and execution-ready marketing plans with full tenant isolation, traceability, and operational control.

## User segments

- Solopreneurs running client marketing services
- Freelancers delivering campaigns and content systems
- Startup teams needing fast GTM planning and execution support
- SMB internal marketing teams with limited headcount
- Marketing agencies managing multiple client accounts and brands

## Product principles

1. Tenant safety first: no cross-tenant leakage, ever.
2. Human control on critical outputs: no irreversible autonomous actions without approval.
3. Traceability by default: every material action is auditable.
4. Branded delivery: white-label support is a core product capability.
5. Provider portability: LLM provider lock-in must be avoided.
6. Operational clarity: meter usage, control costs, and expose health metrics.

## Scope for v3

In scope:
- Multi-tenant architecture and RBAC
- White-label configuration and domain strategy
- Agent orchestration framework with approval gates
- MIR/MSP tenant-aware schema and lifecycle
- Billing, metering, and subscription controls
- Enterprise operations baseline (security, observability, compliance)

Out of scope for v3:
- Full social inbox and DM execution platform
- Full CRM replacement suite
- Fully autonomous campaign publishing without human gates
- Deep attribution/MMM beyond baseline event correlation

## Constraints

- Supabase remains canonical data system unless explicitly superseded by an ADR.
- Row-level security and tenant context are mandatory for all tenant data paths.
- Every plan must include acceptance tests and rollback notes.
- Any AI action affecting customer-visible assets must support approval checkpoints.

## Success definition

MarkOS v3 is successful when:
1. At least one tenant can run end-to-end onboarding to approved plan flow in isolation.
2. White-label branding and custom domain capabilities are operational for tenant-facing experiences.
3. Agent orchestration supports deterministic retries, approvals, and auditable runs.
4. Billing and metering map usage to tenant invoices with no unresolved reconciliation gaps.
5. Security and observability controls satisfy enterprise onboarding due diligence.
