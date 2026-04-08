# ROADMAP: MarkOS v3

Last updated: 2026-04-04
Milestone: MarkOS v3
Granularity: fine

## Phases

- [~] Phase 07: Multi-tenant Foundation and Authorization
- [~] Phase 08: White-label and Tenant Experience
- [x] Phase 09: Agentic MarkOS Orchestration and MIR/MSP Intelligence
- [~] Phase 10: Billing, Compliance, and Enterprise Operations
- [ ] Phase 11: Revenue CRM and Customer Intelligence Core

Legend: `[x]` satisfied in current repo state, `[~]` partially satisfied with remaining live checks or evidence gaps.

## Phase details

### Phase 07: Multi-tenant Foundation and Authorization
Goal: establish tenant-safe data architecture and enforceable identity boundaries.
Depends on: existing v1-v2 baseline and Supabase canonical data model.
Requirements: TEN-01, TEN-02, TEN-03, TEN-04, IAM-01, IAM-02
Live mapping: Phase 51 primary, with TEN-04 partially covered by Phase 54 entitlement enforcement.
Current status: Partially satisfied. TEN-01 through TEN-03 and IAM-01 through IAM-02 are verified in live Phase 51; TEN-04 still lacks explicit quota/rate-limit closure evidence.
Success criteria:
1. Tenant context is deterministic and enforced across all services.
2. RLS policies block cross-tenant reads and writes.
3. RBAC roles and permissions are active and tested.
4. Security logs capture denied cross-tenant access attempts.

### Phase 08: White-label and Tenant Experience
Goal: deliver branded tenant experiences without breaking shared platform integrity.
Depends on: Phase 07.
Requirements: WL-01, WL-02, WL-03, WL-04
Live mapping: Phase 52.
Current status: Partially satisfied. Automated verification is green, but the package still depends on two live-environment checks before white-label delivery can be treated as fully closed.
Success criteria:
1. Tenant branding renders correctly in UI and communications.
2. Custom domains can be configured with verification and fallback.
3. White-label changes are versioned and rollback-safe.
4. Tenant-level theme errors fail safely to defaults.

### Phase 09: Agentic MarkOS Orchestration and MIR/MSP Intelligence
Goal: implement tenant-aware AI orchestration with controlled autonomy and strategic memory.
Depends on: Phase 07 and 08.
Requirements: AGT-01, AGT-02, AGT-03, AGT-04, MIR-01, MIR-02, MIR-03, MIR-04, IAM-03
Live mapping: Phase 53.
Current status: Satisfied. Live Phase 53 verification closes all mapped AGT, MIR, and IAM-03 requirements.
Success criteria:
1. Agent runs are tenant-isolated and audit-complete.
2. Human approval gates enforce policy before high-impact actions.
3. MIR to MSP to plan lifecycle is versioned, append-only, and deterministic.
4. Regeneration and rejection loops preserve history and rationale.

### Phase 10: Billing, Compliance, and Enterprise Operations
Goal: operationalize monetization and enterprise trust controls.
Depends on: Phase 07, 08, and 09.
Requirements: BIL-01, BIL-02, BIL-03, BIL-04, SEC-01, SEC-02, SEC-03, OPS-01, OPS-02, IAM-04
Live mapping: Phase 54.
Current status: Partially satisfied. Billing, entitlement, SSO role-mapping, and governance evidence are implemented, but live Phase 54 still has two human checks open and several security/operations requirements remain only partially evidenced.
Success criteria:
1. Billing plans, metering, and reconciliation are production viable.
2. Compliance controls and deletion workflows are documented and tested.
3. Monitoring and incident runbooks provide tenant-aware operations.
4. Enterprise onboarding checklist is passable with evidence.

### Phase 11: Revenue CRM and Customer Intelligence Core
Goal: make MarkOS the CRM-native operational source of truth for relationship state, behavioral timelines, pipeline progression, next-best action, outbound execution, and revenue reporting.
Depends on: Phase 07 through 10.
Requirements: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, TRK-01, TRK-02, TRK-03, TRK-04, ATT-01, AI-CRM-01, AI-CRM-02, REP-01
Live mapping: Phases 58 through 64.
Current status: In progress. Phase 58 execution is complete with direct schema, timeline, identity, and API evidence; Phase 59 is the next planned execution target.
Success criteria:
1. CRM entities and timelines are canonical, tenant-safe, and audit-complete.
2. Tracking and identity stitching preserve behavior history from anonymous visit to customer state.
3. Pipelines and outbound execution support human and AI operators from first touch through success workflows.
4. Attribution and reporting are available from CRM-native surfaces without requiring separate analyst tooling.

## Readiness gates

Before moving between phases:
1. Requirement coverage proof exists for all mapped IDs.
2. Security and tenant-safety regression tests pass.
3. Rollback path is documented for every schema and API change.
4. Operational telemetry is present for new critical paths.
