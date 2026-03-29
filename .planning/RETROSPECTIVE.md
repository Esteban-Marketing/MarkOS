# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v2.1 â€” Product Hardening & Identity Convergence

**Shipped:** 2026-03-28
**Phases:** 5 (23â€“27) | **Plans:** 20 | **Timeline:** 1 day (single-session milestone)
**Git range:** `markos/init` â†’ `markos/rebrand`

### What Was Built

- **Identity audit and normalization** (Phase 23): Repository-wide classification of MarkOS vs MARKOS identifiers into compatibility-critical and cosmetic groups. Public-facing identity fully consolidated to MarkOS with a formal compatibility contract for paths, manifests, env vars, and Vector Store namespaces.
- **Runtime parity** (Phase 24): Shared handler contracts made consistent between local `server.cjs` and Vercel/API-wrapper mode. Centralized `runtime-context.cjs` and `path-constants.cjs` extracted. Explicit env guards isolate hosted-path assumptions.
- **Fixture-backed onboarding quality** (Phase 25): Extraction/confidence routing tests added for URL-only, file-only, and mixed-source inputs. Approved-draft merge safety hardened with write-mir fixture coverage. Regenerate/approve outcome contracts structured as explicit states (success/warning/degraded/failure).
- **Vector Store memory formalization** (Phase 26): Namespace rules for project/draft/compatibility reads codified. Local and cloud operating modes documented and exercised. Migration-safe collection handling added. Multi-project slug isolation test coverage added.
- **Onboarding-to-execution contract** (Phase 27): Execution readiness defined as a separate checklist-gated state from onboarding completion. Winner-anchor validation added as prerequisite across all 5 creator prompt categories. Actionable telemetry checkpoints deployed at approval, readiness, and major failure boundaries.

### What Worked

- **Phase sequencing** â€” Hardening phases flowed cleanly (Identity â†’ Runtime â†’ Quality â†’ Memory â†’ Execution). Each phase built on preserved contracts from the prior one with zero rework loops.
- **Fixture-driven testing strategy** â€” Extraction and merge tests anchored to representative fixtures rather than inline payloads reduced test brittleness significantly.
- **Compatibility-first identity policy** â€” Treating MARKOS paths as explicit compat surfaces (rather than simply renaming) prevented breakage while still advancing the MarkOS public identity.
- **SUMMARY.md-based closure pattern** â€” Frontmatter `provides:` fields on phase summaries map cleanly to REQUIREMENTS.md REQ-IDs, enabling traceability without extra process.
- **Single-session milestone** â€” All 20 execution plans completed in one intensified session, enabled by tight phase dependencies and well-scoped plans.

### What Was Inefficient

- **REQUIREMENTS.md not updated during execution**: Phases 26 and 27 delivered all their requirements (MMO-01â€“03, EXE-01, EXE-02, TLM-02) but the REQUIREMENTS.md rows weren't checked off. Caught at milestone close, not at execution time.
- **Phase summary placeholder backfill**: Phases 23, 24, and 26 SUMMARY.md files were never written during execution â€” they were backfilled at milestone close in a metadata normalization pass. Summary authoring should be a hard execution gate, not a retroactive step.
- **STATE.md metadata drift**: Duplicate frontmatter blocks and `.protocol-lore/STATE.md` falling 10 phases behind required a separate normalization session before the milestone close could run correctly.
- **Global `progress bar` dilution**: The `progress bar` command counts all phase directories globally including pre-v2.1 phases that never had summaries. Causes 49% display when the active milestone is at 100%. Confusing signal â€” should filter to current milestone.

### Patterns Established

- **Execution readiness â‰  onboarding completion** â€” These are now separate, checklist-gated contract states in the codebase and documentation.
- **Residual behavior should be documented, not silenced** â€” Phase 25 explicitly cataloged known fallback behaviors (hosted write limitations, fuzzy-header appends, provider-outage degradation) rather than trying to remove them.
- **Compatibility surfaces are first-class artifacts** â€” The Phase 23 compatibility contract (IDENTITY-AUDIT.md + COMPATIBILITY-CONTRACT.md) is now the canonical migration planning input for when v2.0 rebrand phases resume.

### Key Lessons

1. **Write summaries at execution time, not at milestone close.** Missing summaries block tooling and require a retroactive metadata pass that adds cleanup debt.
2. **Check REQUIREMENTS.md rows as part of each plan's self-check.** Add a `- [ ] REQUIREMENTS.md row checked off for provided REQ-IDs` item to every plan's verification gate.
3. **STATE.md frontmatter must be write-protected by convention.** Multiple agents appending to it without reading the existing block produces duplicate/conflicting YAML. The only valid STATE.md write is a full frontmatter replace.
4. **Scoped milestones outperform sprawling ones.** 5 tightly scoped hardening phases with clear dependencies completed faster and more cleanly than the deferred 6-phase rebrand track.

### Cost Observations

- Model mix: executor = sonnet, planner = opus (per config.json)
- Sessions: 1 execution session + 1 metadata normalization session
- Notable: All 20 plans executed without blocking deviations. No mid-phase backtracking.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Key Change |
|-----------|--------|------------|
| v1.0 | 7 | Core protocol architecture established |
| v1.1 | 2 | Protocol hardening and gating hooks |
| v1.2 | 7 | Feature execution (onboarding engine, telemetry, examples) |
| v2.1 | 5 | Product hardening and explicit contracts |

### Cumulative Quality

| Milestone | Test Files | Key Coverage Added |
|-----------|-----------|-------------------|
| v1.0â€“v1.2 | 4 | example-resolver, vector-client, install, protocol |
| v2.1 | 6 | onboarding-server (fixture-backed), write-mir, update |

### Top Lessons (Verified Across Milestones)

1. **Gating hooks matter** â€” Fail-fast at unchecked plan gates (established v1.1) prevented execution on incomplete phase plans throughout v2.1.
2. **Write summaries during execution** â€” Missing summaries break tooling and create retroactive cleanup burden (learned v2.1, should be enforced in all future milestones).
3. **Compatibility-first reduces rework** â€” When identity or structure changes are staged through explicit compat surfaces rather than hard cuts, downstream breakage is avoided.

