# MarkOS (MarkOS Protocol)

## Current State: v3.9.0 Planning — Vertical Plugin Literacy Libraries

**Goal:** MarkOS now aims to ship plug-and-play literacy library packs so every new workspace starts with business-model and industry-specific examples, starter templates, and initialization guidance instead of a blank slate.

**Recently shipped foundation:**
- governed CRM and customer-intelligence core from v3.8.0
- literacy, deep research, governance, and tenant-safety baselines from earlier milestones
- approval-aware AI and workspace hydration seams already present in the codebase

**Status:** v3.8.0 shipped on 2026-04-15. v3.9.0 planning is now active.

## Current Milestone State

**Current posture:** Active milestone planning is open for v3.9.0 Vertical Plugin Literacy Libraries.

## Next Milestone Goals

- productize composable starter libraries keyed by business model and industry
- hydrate ready-to-use literacy examples, skeletons, and discipline assets during project initialization
- let operators inspect and override library selection while preserving safety and audit posture

## What This Is
MarkOS is a governed marketing and revenue operating system. It combines onboarding, research, CRM, outbound execution, and approval-aware AI so human operators and AI agents can manage growth work from one consistent workflow surface while starting from stronger domain-specific defaults.

## Core Value
Give operators one trustworthy, auditable system for launching and running revenue work with AI support and domain-aware starter context.

## Requirements

### Validated

- [x] Literacy, deep research, and governance baselines are shipped and verified through v3.7.0.
- [x] Operator surfaces, onboarding automation, and installation readiness are already production-grade foundations.
- [x] Tenant-aware and approval-aware architecture patterns already exist and should be extended, not replaced.
- [x] v3.8.0 now ships tenant-safe CRM records, tracking, lifecycle timelines, pipeline execution, native outbound, and approval-aware AI assistance.
- [x] CRM-native reporting and attribution are now operational inside the same governed source of truth.

### Active

- [ ] Business-model starter packs resolve automatically from onboarding seed data.
- [ ] Industry overlays tailor the initial literacy bundle for priority verticals.
- [ ] Starter examples, skeletons, and discipline docs hydrate into the workspace during initialization.
- [ ] Operators can review or override selected packs before final approval when needed.
- [ ] Fallback and diagnostics keep the library system safe when coverage is partial.

### Out of Scope

- Supporting every business model and industry in one milestone.
- Replacing the existing MIR, MSP, onboarding, or approval architecture.
- Autonomous template selection with no operator visibility or override.
- A new parallel template engine that duplicates existing resolver and skeleton flows.

## Context
The repository already contains business-model-aware example resolution, starter skeleton generation, and plugin capability seams. The next milestone should unify those into a first-class library system so MarkOS can initialize tailored literacy packs for common business families and verticals such as B2B, B2C, SaaS, Ecommerce, Travel, IT, Marketing Services, and Professional Services.

## Constraints

- **Architecture:** Extend the current Node.js, Next.js, Supabase, and onboarding stack — avoid a platform rewrite.
- **Governance:** Preserve the current tenant-safety, approval, provenance, and review guarantees across all new library flows.
- **Scope:** Focus on initialization quality, literacy coverage, and plugin-style packaging only; defer broad ecosystem sprawl.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Open v3.9.0 as a template-library milestone | The repo already has the right seams to compound its literacy system into faster initialization value | ✓ Selected |
| Reuse the existing stack | Codebase inspection favors extension over replatforming for speed and continuity | ✓ Locked |
| Compose base family + industry overlay | This matches the desired specialization without exploding one-off templates | ✓ Locked |
| Keep operator visibility and fallback | Prevents governance, trust, and quality regressions | ✓ Locked |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
## Metadata

Last updated: 2026-04-15 after the v3.9.0 milestone discussion and draft setup.
