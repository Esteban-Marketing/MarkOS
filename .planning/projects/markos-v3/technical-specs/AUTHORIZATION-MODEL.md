# Technical Spec: Authorization Model

## Objective

Define enforceable permissions for user and agent actions across tenant, workspace, and project boundaries.

## Role matrix

- owner: full tenant administration, billing, security policy, and emergency controls.
- tenant-admin: team management, workspace/project governance, approval delegation.
- manager: project operations, review workflow management, non-billing configuration.
- contributor: content and plan collaboration, no privileged approvals.
- reviewer: approval and rejection authority for policy-gated outputs.
- billing-admin: subscription and invoice operations, no content governance actions.
- readonly: read-only access to permitted tenant resources.

## Permission model

1. Permissions are denied by default.
2. All approval actions require reviewer, manager, tenant-admin, or owner role.
3. Billing actions require billing-admin or owner role.
4. Security and policy changes require tenant-admin or owner role.

## Enforcement points

- API handlers and service methods
- Background worker job handlers
- Agent tool invocation permissions
- Admin UI action endpoints

## Audit requirements

Every privileged action captures:
- actor_id
- tenant_id
- role_at_action_time
- action_name
- target_resource
- decision_outcome
- timestamp
- correlation_id

## Validation requirements

1. Unit tests for policy checks per role.
2. Integration tests for endpoint access control.
3. Negative tests for privilege escalation attempts.
4. Snapshot tests for permission matrix stability.
