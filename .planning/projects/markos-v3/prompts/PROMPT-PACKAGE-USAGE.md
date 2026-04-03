# Prompt Package Usage Guide

## Goal

Use this guide to run the MarkOS v3 prompt package with minimal ambiguity and maximum implementation quality.

## Recommended execution flow

1. Load all files listed in UPLOAD-MANIFEST.md.
2. Run MASTER-IMPLEMENTATION-PROMPT.md to establish integrated plan.
3. Run ARCHITECT-PROMPT.md and BACKEND-PROMPT.md in sequence.
4. Run FRONTEND-PROMPT.md and AGENT-ORCHESTRATION-PROMPT.md.
5. Run SECURITY-COMPLIANCE-PROMPT.md.
6. Run QA-VALIDATION-PROMPT.md.
7. Re-run MASTER-IMPLEMENTATION-PROMPT.md asking for reconciliation of all role outputs.

## Prompting tips

- Ask for requirement ID mapping in every response.
- Ask for explicit assumptions and unresolved decisions.
- Ask for rollback and migration strategy in every implementation batch.
- Ask for evidence format before accepting completion.

## Acceptance checklist for external LLM outputs

1. Every v3 requirement is mapped to implementation work.
2. Tenant isolation controls are testable and complete.
3. Approval gates are explicit for high-impact actions.
4. Billing/metering and reconciliation are defined end-to-end.
5. Security and compliance controls include verification steps.
6. Phase execution order and dependencies are coherent.

## When to reject outputs

Reject and request revision if:
- Outputs are generic and not mapped to requirement IDs.
- No deterministic testing strategy is provided.
- Tenant safety is only described, not enforced.
- Prompt/model versioning is omitted for agent workflows.
