# Milestones

## v3.2.0 Multi-Tenant Agency Runtime and Enterprise Governance (Started: 2026-04-03)

**Status:** Active

**Kickoff decisions:**

1. v3.2.0 focuses on agency-scale multi-tenancy, enterprise governance, and pluginized expansion.
2. Digital Agency is the first production plugin for MarkOS and the lead expansion track for this milestone.
3. Phase planning starts at Phase 51 with tenant foundations, then plugin runtime + Digital Agency, then orchestration governance, then billing/compliance operations.

---

## v2.4 Beta Client Onboarding (Shipped: 2026-04-01)

**Phases completed:** 5 phases, 11 plans, 0 tasks

**Key accomplishments:**

- Intake automation now enforces canonical submit validation with automatic Linear handoff metadata for onboarding operations (Phase 34).
- Beta program operations now run on a defined lifecycle model, weekly cadence, and KPI scorecard contracts (Phase 36).
- Build-in-public evidence loop is now integrated into weekly closeout outputs to support PLG signaling (Phase 36).
- MarkOS application control-plane scaffold shipped with route surfaces for company, MIR/MSP, ICPs, segments, campaigns, and theme settings (Phase 37).
- Governance foundations shipped for the app layer: contracts/snapshots, white-label token pipeline, RBAC policy helpers, telemetry contracts, and Supabase RLS baseline (Phase 37).

---

## v2.1 — Product Hardening & Identity Convergence (Shipped: 2026-03-28)

**Phases completed:** 5 phases (23â€“27), 20 plans
**Timeline:** 2026-03-27 → 2026-03-28 (single-session milestone)
**Git range:** `markos/init` → `markos/rebrand`

**Key accomplishments:**

1. Repository-wide identity audit classified all MarkOS vs MARKOS identifiers into compatibility-critical vs cosmetic/historical groups (Phase 23).
2. Public-facing identity consolidated to MarkOS across package metadata, onboarding UI, and primary documentation with explicit backward-compat map (Phase 23).
3. Shared onboarding handlers made consistent between local server mode and Vercel/API-wrapper mode with explicit env guards and centralized slug resolution (Phase 24).
4. Config precedence, path constants, and runtime-context isolation extracted and tested across handler paths (Phase 24).
5. Fixture-backed extraction/confidence routing tests added for URL-only, file-only, and mixed-source onboarding inputs (Phase 25).
6. Approved-draft merge safety hardened with write-mir fixture coverage and structured regenerate/approve outcome contracts (Phase 25).
7. Vector Store namespace rules formalized for project/draft isolation, with local and cloud operating modes explicitly documented (Phase 26).
8. Winner-anchor validation enforced as a prerequisite for all 5 creator prompt categories (Phase 27).
9. Onboarding-to-execution bridge defined as an explicit contract with checklist-based readiness state separating approval from execution readiness (Phase 27).
10. Actionable telemetry checkpoints deployed at approval, readiness, and major failure boundaries (Phase 27).

**Known Gaps (proceeding with yolo mode):**

- MMO-01, MMO-02, MMO-03 (Phase 26 REQUIREMENTS.md rows not checked off)
- EXE-01, EXE-02, TLM-02 (Phase 27 REQUIREMENTS.md rows not checked off)
- These were delivered (plans + summaries complete) but REQUIREMENTS.md was not updated during execution.

## v2.2 — Platform Engineering (Shipped: 2026-03-31)

**Phases completed:** 5 phases (28–32), 17 plans
**Timeline:** 2026-03-28 → 2026-03-31

**Key accomplishments:**

1. Crash-free approve-path write resolution with explicit local/hosted env guards and idempotent gitignore injection for private data (Phase 28).
2. Linear sync endpoint creating issues from ITM templates with deterministic assignee mapping; campaign result endpoint writing winners catalogs (Phase 29).
3. Interview flow capped at five questions with progress bar and auto-proceed after inactivity (Phase 29).
4. MarkOSDB contracts defined for Supabase + Upstash; idempotent local-to-cloud ingestion from `.markos-local` artifacts; Next.js + Supabase auth boundary for cloud operations (Phase 30).
5. Reliability/observability SLOs, migration dry-run/rollback safety, secrets/log guardrails, and compatibility retirement policy shipped and test-covered (Phase 31).
6. Marketing Literacy Base: vector-store literacy primitives, ingestion CLI (`ingest-literacy`), admin CLI (`literacy-admin`), and runtime orchestrator integration (Phase 32).

**Known Gaps (proceeding with yolo mode):**

- MIR Gate 1 and Gate 2 still RED at milestone close — gate intake files populated post-milestone via direct write (EST-55 bypass).

## v2.3 — Codebase Documentation Intelligence (Shipped: 2026-03-31)

**Phases completed:** 1 phase (33), 4 plans
**Timeline:** 2026-03-31 (single-session milestone)

**Key accomplishments:**

1. Canonical codebase map established under `.planning/codebase/` covering architecture, routes, folder structure, conventions, testing, and concerns (Phase 33).
2. Every runtime surface documented route-by-route across onboarding HTTP endpoints, API wrappers, and CLI entrypoints with handler files, side effects, and hosted/local constraints (Phase 33).
3. Repository documented folder-by-folder and file-by-file for all maintained surfaces (Phase 33).
4. Documentation freshness rules and verification checks defined for route additions, file moves, and topology changes (Phase 33).
5. Protocol-facing and human-facing docs updated to deep-link to canonical map rather than maintain independent drift-prone copies (Phase 33).

## v2.5 — Enhancement & Optimization Process (Shipped: 2026-04-01)

**Phases completed:** 1 phase (35), 1 plan
**Timeline:** 2026-04-01 (single-session milestone)

**Key accomplishments:**

1. Installer and updater runtime behavior consolidated through a shared CLI runtime contract to reduce drift risk.
2. Bare `npx markos` established as the real primary install command, with safe defaults applied before prompting.
3. Install completion now emits explicit `ready` / `degraded` / `blocked` states with actionable next-step guidance.
4. Non-interactive and CI/headless runs now resolve conflicts deterministically without prompt hangs.
5. Documentation and protocol tests now enforce one-command contract parity, with full suite green at milestone close (99/99).
