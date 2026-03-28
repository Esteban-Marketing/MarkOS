# Milestones

## v2.1 — Product Hardening & Identity Convergence (Shipped: 2026-03-28)

**Phases completed:** 5 phases (23–27), 20 plans
**Timeline:** 2026-03-27 → 2026-03-28 (single-session milestone)
**Git range:** `markos/init` → `markos/rebrand`

**Key accomplishments:**

1. Repository-wide identity audit classified all MarkOS vs MGSD identifiers into compatibility-critical vs cosmetic/historical groups (Phase 23).
2. Public-facing identity consolidated to MarkOS across package metadata, onboarding UI, and primary documentation with explicit backward-compat map (Phase 23).
3. Shared onboarding handlers made consistent between local server mode and Vercel/API-wrapper mode with explicit env guards and centralized slug resolution (Phase 24).
4. Config precedence, path constants, and runtime-context isolation extracted and tested across handler paths (Phase 24).
5. Fixture-backed extraction/confidence routing tests added for URL-only, file-only, and mixed-source onboarding inputs (Phase 25).
6. Approved-draft merge safety hardened with write-mir fixture coverage and structured regenerate/approve outcome contracts (Phase 25).
7. Chroma namespace rules formalized for project/draft isolation, with local and cloud operating modes explicitly documented (Phase 26).
8. Winner-anchor validation enforced as a prerequisite for all 5 creator prompt categories (Phase 27).
9. Onboarding-to-execution bridge defined as an explicit contract with checklist-based readiness state separating approval from execution readiness (Phase 27).
10. Actionable telemetry checkpoints deployed at approval, readiness, and major failure boundaries (Phase 27).

**Known Gaps (proceeding with yolo mode):**
- MMO-01, MMO-02, MMO-03 (Phase 26 REQUIREMENTS.md rows not checked off)
- EXE-01, EXE-02, TLM-02 (Phase 27 REQUIREMENTS.md rows not checked off)
- These were delivered (plans + summaries complete) but REQUIREMENTS.md was not updated during execution.
