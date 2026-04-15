# Requirements: MarkOS v3.9.0 Vertical Plugin Literacy Libraries

**Defined:** 2026-04-15
**Status:** Drafted for milestone planning.
**Core Value:** Give every new MarkOS workspace a tailored, ready-to-use literacy baseline based on business model and industry.

## Active Requirements (v3.9.0)

### Library Taxonomy and Coverage

- [ ] **LIB-01**: MarkOS can resolve a canonical starter library from onboarding seed data based on business model family.
- [ ] **LIB-02**: MarkOS supports industry overlays for at least Travel, IT, Marketing Services, and Professional Services in the first milestone cut.
- [ ] **LIB-03**: Each supported library includes discipline-aware literacy examples, starter skeletons, and initialization docs for the core operating disciplines.
- [ ] **LIB-04**: Library assets are versioned and composable using one base family plus one vertical overlay without duplicating the existing template architecture.

### Initialization and Operator Experience

- [ ] **INIT-01**: New project initialization hydrates the selected starter library automatically into the local workspace and agent context.
- [ ] **INIT-02**: Operators can inspect which model and industry pack was selected and override it before final approval when needed.
- [ ] **INIT-03**: Starter packs reduce blank-state setup by producing immediately usable examples, prompts, and templates at onboarding time.

### Governance and Quality

- [ ] **GOV-01**: Unsupported or partial combinations degrade gracefully to safe fallback templates with visible diagnostics rather than hard failure.
- [ ] **GOV-02**: Pack selection and generated artifacts remain tenant-safe, auditable, and compatible with current approval-aware flows.

## Deferred Requirements (Future Expansion)

### Expansion Track

- **LIBX-01**: Broader industry catalog beyond the initial priority verticals.
- **LIBX-02**: Multi-overlay composition for mixed business profiles or sub-niches.
- **LIBX-03**: External marketplace or import flow for third-party template packs.
- **LIBX-04**: Autonomous recommendation of pack upgrades from live CRM or performance data.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full rewrite of MIR, MSP, onboarding, or approval flows | This milestone should extend existing systems, not replace them |
| Support for every business model and every industry | Too broad for a first cut and would weaken quality coverage |
| Invisible or non-reviewable pack selection | Operator trust and governance must remain explicit |
| A second parallel template engine | Existing resolver and skeleton seams already provide the right base |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LIB-01 | Phase 106 | Planned |
| LIB-04 | Phase 106 | Planned |
| LIB-02 | Phase 108 | Planned |
| LIB-03 | Phase 107 | Planned |
| INIT-01 | Phase 109 | Planned |
| INIT-02 | Phase 106 | Planned |
| INIT-03 | Phase 109 | Planned |
| GOV-01 | Phase 110 | Planned |
| GOV-02 | Phase 110 | Planned |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after the v3.9.0 milestone discussion and roadmap draft*
