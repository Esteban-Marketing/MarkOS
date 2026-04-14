# MarkOS (MarkOS Protocol)

## Current State: v3.8.0 Initialized — Revenue CRM and Customer Intelligence Core

**Goal:** MarkOS is now opening its next milestone as a governed revenue workspace that unifies CRM truth, behavioral intelligence, pipeline execution, outbound delivery, and approval-aware AI.

**Target milestone outcomes:**
- tenant-safe CRM schema and identity graph foundations
- stitched behavioral tracking and lifecycle timelines
- multi-view pipeline and execution workspace for sales and success
- consent-safe native outbound across email, SMS, and WhatsApp
- approval-aware copilot actions and CRM-native attribution reporting

**Status:** v3.8.0 initialized on 2026-04-14 after the successful v3.7.0 archive and verification closeout.

## Current Milestone: v3.8.0 — Revenue CRM and Customer Intelligence Core

**Current posture:** Requirements and roadmap are now locked. Phase planning starts at Phase 100.

## Next Milestone Goals

- make MarkOS the governed system of record for contacts, companies, deals, activities, and revenue workflows
- unify behavioral tracking, identity stitching, and customer intelligence inside the CRM timeline
- preserve the shipped v3.7.0 literacy, governance, and evaluation stack as the intelligence layer behind the CRM surfaces

## What This Is
MarkOS is a governed marketing and revenue operating system. It combines onboarding, research, CRM, outbound execution, and approval-aware AI so human operators and AI agents can manage growth work from one consistent workflow surface.

## Core Value
Give operators one trustworthy, auditable system for planning, executing, and improving revenue work with AI support that stays grounded and controlled.

## Requirements

### Validated

- [x] Literacy, deep research, and governance baselines are shipped and verified through v3.7.0.
- [x] Operator surfaces, onboarding automation, and installation readiness are already production-grade foundations.
- [x] Tenant-aware and approval-aware architecture patterns already exist and should be extended, not replaced.

### Active

- [ ] Canonical CRM records and identity lineage are tenant-safe and auditable.
- [ ] Behavioral tracking and stitched customer timelines become first-class CRM signals.
- [ ] Pipelines, views, queues, and next-best actions support both sales and customer success execution.
- [ ] Native outbound on email, SMS, and WhatsApp remains consent-safe and fully traceable.
- [ ] AI copilots stay grounded, explainable, and approval-aware while accelerating CRM work.

### Out of Scope

- Autonomous external sending with no approval boundary — violates governance guarantees.
- A separate warehouse, graph database, or CDP replatform — not needed for this milestone.
- Social publishing or ad-platform execution sprawl — deferred to a later expansion track.

## Context
The repository already contains strong foundations across onboarding, deep research, literacy, governance, and contract-driven execution. Earlier CRM-related work also exists historically, but the new milestone reopens that product lane on top of the modern v3.7.0 quality and safety baseline so the next planning cycle can move forward cleanly from the current codebase reality.

Research for this milestone points to an additive path: keep Supabase as the operational source of truth, keep PostHog as the behavioral signal layer, keep Next.js for workspace surfaces, and keep AI actions bounded by approval and audit evidence.

## Constraints

- **Architecture:** Extend the current Node.js, Next.js, Supabase, and PostHog stack — avoid a platform rewrite.
- **Governance:** Preserve the v3.7.0 safety, provenance, and review guarantees across all new CRM surfaces.
- **Scope:** Focus on CRM, tracking, outbound, and AI-assisted operations only; defer broader platform sprawl.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Open v3.8.0 as a CRM milestone | The repo is between milestones and the next highest-value product lane is governed customer and revenue operations | — Pending |
| Continue phase numbering at 100 | Keeps chronology clean after Phase 99.1 closeout | — Pending |
| Reuse the existing stack | Research favors extension over replatforming for speed, continuity, and safety | — Pending |
| Keep outbound approval-aware | Prevents compliance, trust, and audit regressions | — Pending |
| Keep CRM-native reporting in-product | Avoids unnecessary warehouse-first complexity in the first iteration | — Pending |

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

Last updated: 2026-04-14 after the v3.8.0 milestone initialization workflow.
