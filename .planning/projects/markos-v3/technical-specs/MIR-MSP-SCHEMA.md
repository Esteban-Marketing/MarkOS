# Technical Spec: MIR and MSP Tenant-Aware Schema

## Objective

Define tenant-safe and versioned schema contracts for MIR, MSP, MarkOS plans, approvals, and update reports.

## Core entities

### Tenant and workspace
- tenants
- tenant_memberships
- workspaces
- projects

### MIR entities
- mir_profile
- mir_messaging
- mir_voice_tone
- mir_audiences
- mir_catalog

### MSP entities
- msp_disciplines
- msp_plan_versions
- msp_activation_state

### MarkOS entities
- markos_plans
- markos_plan_approvals
- markos_update_reports
- markos_insight_events
- markos_agent_runs

## Schema rules

1. Every tenant-scoped table includes tenant_id.
2. Every mutable strategic artifact supports versioning.
3. Approvals and update reports are append-only.
4. Soft-delete behavior must preserve audit integrity where needed.

## Versioning semantics

- Plan version increments per project.
- MIR component updates include revision_number and updated_by metadata.
- MSP updates reference source MIR revision lineage.
- Regeneration events reference prior plan version id.

## Critical edit processing

1. Detect critical dimension changes.
2. Capture original and proposed values.
3. Persist clarification answers.
4. Update MIR and/or MSP scoped records.
5. Trigger regeneration with linked update_report_id.

## Query requirements

- Latest approved plan by project.
- Full revision history for MIR and MSP per project.
- Approval decisions and reviewer notes by plan version.
- Regeneration lineage chain from initial draft to approved plan.

## Data retention

- Keep strategic history by default.
- Apply tenant-configurable retention only to non-critical transient logs.
- Never drop records needed for billing, security, or contractual traceability.
