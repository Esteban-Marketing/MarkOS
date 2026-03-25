# Marketing Get Shit Done (MGSD)

## Current Milestone: v1.1 MGSD Hardening & Scale

**Goal:** Fortify the MGSD protocol with strict execution boundaries and structural enforcement hooks, ensuring that all templates, logic vectors, and generation systems act as a flawlessly optimized system for hybrid human-agent marketing tracking. Build towards telemetry and cross-client multi-tenant configurations.

**Target features:**
- Protocol execution prerequisite checks (`project_valid`, `verification_passed`).
- ChromaDB vector memory auto-healing on initialization.
- Unified, strict tokenization taxonomy across all templates.
- Robust tracking telemetry.

## What This Is
A protocol for agentic marketing execution, built as a parallel system to the development-focused Get Shit Done (GSD) protocol. It enables human managers and AI marketing agents to collaborate on strategy, content, campaigns, and operations using standardized templates (MIR-TEMPLATE, MSP-TEMPLATE, .agents) while synchronizing tasks seamlessly with Linear.

## Core Value
Standardization and automation of marketing ideation, planning, and execution via robust agentic workflows and Linear issue tracking.

## Context
This project aims to instantiate the Marketing Get Shit Done (mgsd) protocol. Following the successful deployment of the core framework (v1.0), the protocol is now securely gating AI operations behind strict phase-check requirements to prevent hallucinatory drifts. All template footprints, research processes, and logic flows are unified, and the system is transitioning towards handling multiple distinct client vectors simultaneously.

## Requirements

### Active
- [ ] Centralize telemetry metrics mapping AI vs Human execution rates.
- [ ] Segregate vector databases and execution contexts for cross-client operations safely.
- [ ] Integrate deeper Neuromarketing psychology validation gates.

### Validated & Delivered (v1.0 & v1.1)
- [x] Defined the core `mgsd` workflow integrating MIR-TEMPLATE and MSP-TEMPLATE.
- [x] Implemented canonical `RESEARCH/` architectures and `mgsd-researcher` engine.
- [x] Supported dual-protocol execution natively on the repository.
- [x] Created NPX installer and patching engine for distribution.
- [x] Enforced gating hooks preventing agent misfires on unchecked Phase plans.

### Out of Scope
- Building our own task tracker (relies on Linear integration).
- Directly rewriting the `gsd` protocol's source code (mgsd will sit parallel).
- Auto-overwriting client `.mgsd-local/` files during patch updates.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Parallel protocol | Avoids corrupting developer `gsd` tools with marketing jargon | — Established |
| Linear integration | Standardizing on Linear for issue tracking since it supports agents well | — Maintained |
| Fail-Fast Engine | Strict logic gating implemented over `mgsd-execute-phase` | — Established |

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
*Last updated: 2026-03-25 after milestone v1.1 hardening resolution*
