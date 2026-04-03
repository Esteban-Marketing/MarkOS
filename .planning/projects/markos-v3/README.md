# MarkOS v3 LLM Handoff Package

## Purpose

This package is the implementation handoff for building MarkOS v3 as an enterprise-ready B2B SaaS platform for digital marketing teams.

Target users:
- Solopreneurs
- Freelancers
- Startup teams
- SMB marketing teams
- Marketing agencies
- Vibe coders operating service businesses

Core platform characteristics:
- AI-first
- Agentic-ready
- Multi-tenant
- White-label enabled
- Enterprise governance and compliance ready

## How to use this package

1. Start with `HANDOFF-SUMMARY.md`.
2. Continue with `UPLOAD-MANIFEST.md`.
3. Load `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and `ARCHITECTURE.md`.
4. Load all ADRs in `decisions/`.
5. Load technical specs in `technical-specs/`.
6. Run `prompts/MASTER-IMPLEMENTATION-PROMPT.md` with the supporting context files.
7. Use role prompts in `prompts/` for deep implementation passes.
8. Execute phase starter plans in `phases/` and verify with `checklists/`.

## Package index

### Core
- `HANDOFF-SUMMARY.md`
- `PROJECT.md`
- `REQUIREMENTS.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `UPLOAD-MANIFEST.md`

### Architecture decisions
- `decisions/ADR-001-tenant-isolation.md`
- `decisions/ADR-002-authorization-model.md`
- `decisions/ADR-003-saas-deployment.md`
- `decisions/ADR-004-llm-provider-abstraction.md`

### Technical specifications
- `technical-specs/TENANT-ISOLATION.md`
- `technical-specs/AUTHORIZATION-MODEL.md`
- `technical-specs/MARKOS-AGENT-FRAMEWORK.md`
- `technical-specs/MIR-MSP-SCHEMA.md`
- `technical-specs/BILLING-METERING.md`
- `technical-specs/OBSERVABILITY-RUNBOOK.md`
- `technical-specs/SECURITY-COMPLIANCE.md`

### Prompt package
- `prompts/MARKOS-V3-MEGA-PROMPT.md`
- `prompts/MASTER-IMPLEMENTATION-PROMPT.md`
- `prompts/ARCHITECT-PROMPT.md`
- `prompts/BACKEND-PROMPT.md`
- `prompts/FRONTEND-PROMPT.md`
- `prompts/AGENT-ORCHESTRATION-PROMPT.md`
- `prompts/SECURITY-COMPLIANCE-PROMPT.md`
- `prompts/QA-VALIDATION-PROMPT.md`
- `prompts/PROMPT-PACKAGE-USAGE.md`

### Phase starters
- `phases/07-multi-tenant-foundation/`
- `phases/08-white-label-and-tenant-experience/`
- `phases/09-agentic-markos-orchestration/`
- `phases/10-billing-compliance-enterprise-ops/`

### Checklists
- `checklists/READINESS-CHECKLIST.md`
- `checklists/ACCEPTANCE-GATES.md`

## Quality bar

All outputs from the coding LLM must be:
- Testable
- Observable
- Auditable
- Rollback-safe
- Tenant-safe by default

## Notes

- This package is intentionally strict to reduce ambiguity and implementation drift.
- Where tradeoffs exist, ADR decisions take precedence over prompt-level assumptions.
