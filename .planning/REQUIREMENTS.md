# Requirements: MarkOS v3.8.0 Revenue CRM and Customer Intelligence Core

**Defined:** 2026-04-14
**Status:** Milestone initialized and ready for phase planning
**Core Value:** Give operators one trustworthy, auditable system for customer intelligence, revenue execution, and AI-assisted follow-through.

## Active Requirements (v3.8.0)

### CRM Data and Identity

- [ ] **CRM-01**: Canonical contacts, companies, accounts, customers, deals, tasks, and activities exist as tenant-safe first-class records with audit history and custom fields.
- [ ] **CRM-02**: Identity resolution supports dedupe, merge review, reversible lineage, and confidence-aware stitch decisions.
- [ ] **CRM-03**: Every CRM record exposes a unified lifecycle timeline that combines task, note, stage, campaign, and communication activity.
- [ ] **CRM-04**: CRM-native reporting exposes revenue health, attribution, and lifecycle state from the same operational source of truth.

### Tracking and Intelligence

- [ ] **TRK-01**: First-party web and campaign activity is normalized into the CRM activity ledger with tenant-safe event contracts.
- [ ] **TRK-02**: Anonymous sessions can stitch to known contacts or accounts with reviewable confidence controls and preserved pre-conversion history.

### Pipeline and Execution Workspace

- [ ] **PIP-01**: Operators can manage custom pipelines and stages through table, Kanban, detail, timeline, calendar, and forecast views.
- [ ] **PIP-02**: Saved filters, rollups, and workspace metadata expose record health, ownership, and workload clearly.
- [ ] **EXEC-01**: Sales and customer-success teams work from role-aware queues, tasks, playbooks, and next-best-action surfaces.
- [ ] **EXEC-02**: SLA, risk, renewal, and expansion signals remain visible, explainable, and auditable during execution.

### Outbound and AI Governance

- [ ] **OUT-01**: Native email, SMS, and WhatsApp execution is consent-safe with suppression, opt-out, and channel-policy enforcement.
- [ ] **OUT-02**: Delivery, reply, and conversation telemetry writes back into CRM timelines and reporting views.
- [ ] **AI-CRM-01**: AI copilots can summarize, draft, recommend, and enrich using grounded CRM and MarkOS context.
- [ ] **AI-CRM-02**: AI-assisted actions remain approval-aware, explainable, and non-destructive with full audit evidence.

## Deferred Requirements (Future Expansion)

### Expansion Track

- **REVX-01**: Social publishing and ad-platform execution from inside the CRM workspace.
- **REVX-02**: Warehouse-first BI, MMM, or advanced commission workflows.
- **REVX-03**: Open-ended external CRM sync as the primary source of truth.
- **REVX-04**: Autonomous outbound sends with no human approval boundary.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Separate graph database or CDP replatform | Not needed for the first CRM milestone iteration |
| Social or ads execution sprawl | Deferred until the core revenue workspace is stable |
| Autonomous external sending | Violates governance and compliance guarantees |
| Warehouse-first reporting stack | CRM-native reporting is sufficient for this milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRM-01 | Phase 100 | Pending |
| CRM-02 | Phase 100 | Pending |
| CRM-03 | Phase 101 | Pending |
| TRK-01 | Phase 101 | Pending |
| TRK-02 | Phase 101 | Pending |
| PIP-01 | Phase 102 | Pending |
| PIP-02 | Phase 102 | Pending |
| EXEC-01 | Phase 103 | Pending |
| EXEC-02 | Phase 103 | Pending |
| OUT-01 | Phase 104 | Pending |
| OUT-02 | Phase 104 | Pending |
| CRM-04 | Phase 105 | Pending |
| AI-CRM-01 | Phase 105 | Pending |
| AI-CRM-02 | Phase 105 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after the v3.8.0 milestone initialization workflow*
