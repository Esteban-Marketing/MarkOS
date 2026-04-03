# Technical Spec: MarkOS Agent Framework

## Objective

Implement a tenant-safe, auditable, and policy-controlled agent orchestration framework for strategy and plan workflows.

## Agent run lifecycle

1. Requested
2. Accepted
3. Context loaded
4. Executing
5. Awaiting approval (when policy requires)
6. Approved or rejected
7. Completed or failed
8. Archived

## Run envelope

Each run must include:
- run_id
- tenant_id
- workspace_id
- project_id
- actor_id
- workflow_id
- prompt_version
- model_provider
- model_name
- tool_policy_profile
- started_at and completed_at

## Tool and action policy

- Tools are allowlisted by workflow type and role.
- High-impact actions require policy gate and human reviewer approval.
- Tool outputs must be captured with structured event metadata.

## Failure handling

- Retries use bounded exponential backoff.
- Max attempts and timeout thresholds are workflow-specific.
- Terminal failures must include reason_code and remediation_hint.
- Partial side effects require compensating actions where possible.

## Cost and telemetry

Capture per run:
- input tokens
- output tokens
- cached tokens when available
- model latency
- tool latency
- total cost estimate
- final status

## Versioning and governance

- Prompt templates are versioned.
- Workflow policy profiles are versioned.
- Model selection policies are versioned.
- Any version change requires release notes and rollback instructions.

## Acceptance requirements

1. Every run is replay-auditable from metadata and event logs.
2. Approval-required actions cannot bypass policy gate.
3. Cross-tenant context access attempts are blocked and logged.
4. Cost telemetry reconciles with billing metering inputs.
