# Marketing Get Shit Done (MGSD)

## Current Milestone: v1.0 MGSD Core & Template Overhaul

**Goal:** Completely design and augment the standard templates to excel across any company/industry/market/niche, align skills to these templates, and create an NPX command to install the mgsd protocol alongside GSD.

**Target features:**
- Standardized, lightweight, and deployable MIR and MSP templates.
- Re-architected `.agent/skills/mgsd-*` to map perfectly to the template folders.
- Separate `npx` install script for `mgsd`.

## What This Is
A protocol for agentic marketing execution, built as a parallel system to the development-focused Get Shit Done (GSD) protocol. It enables human managers and AI marketing agents to collaborate on strategy, content, campaigns, and operations using standardized templates (MIR-TEMPLATE, MSP-TEMPLATE, .agents) while synchronizing tasks seamlessly with Linear.

## Core Value
Standardization and automation of marketing ideation, planning, and execution via robust agentic workflows and Linear issue tracking.

## Context
This project aims to instantiate the Marketing Get Shit Done (mgsd) protocol. The repository contains marketing discipline templates (MIR-TEMPLATE for strategy/brand, MSP-TEMPLATE for specific marketing channels) and agent rosters. We need to unify these assets into actionable agent commands (`mgsd-new-project`, `mgsd-plan-phase`, `mgsd-linear-sync`, etc.) alongside the existing `gsd` commands. 

## Requirements

### Active
- [ ] Define the core `mgsd` workflow integrating MIR-TEMPLATE and MSP-TEMPLATE.
- [ ] Implement `mgsd-new-project` skill pointing to marketing templates.
- [ ] Implement `mgsd-plan-phase` skill pointing to marketing pipelines.
- [ ] Implement `mgsd-linear-sync` skill to automatically convert roadmap phases to Linear Tasks/Issues.
- [ ] Support dual-protocol execution natively on the repository (both `gsd` and `mgsd` run concurrently).
- [ ] Redesign MIR and MSP templates to be agnostic to any industry/market.
- [ ] Create NPX installer for the mgsd protocol.

### Out of Scope
- Building our own task tracker (relies on Linear integration).
- Directly rewriting the `gsd` protocol's source code (mgsd will sit parallel).

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Parallel protocol | Avoids corrupting developer `gsd` tools with marketing jargon | — Pending |
| Linear integration | Standardizing on Linear for issue tracking since it supports agents well | — Pending |

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
*Last updated: 2026-03-22 after milestone v1.0 initialization*
