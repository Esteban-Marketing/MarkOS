# Phase 208 - Human Operating Interface (Discussion)

> Refreshed on 2026-04-23 with `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md` as mandatory input. This phase is a migration of the existing `(markos)` shell into the operator cockpit the vault expects.

**Date:** 2026-04-23  
**Milestone:** v4.0.0 SaaS Readiness / MarkOS v2 compliance track  
**Depends on:** Phase 207 AgentRun v2 substrate  
**Quality baseline applies:** all 15 gates

## Goal

Turn the current generic control-plane shell into the decision-first human operating interface for MarkOS.

Phase 208 is not a greenfield dashboard phase. It must absorb the current app shell, operations route, task runner, CRM approval surfaces, and admin/settings patterns into one operator system for work, approvals, recovery, and narrative.

## Mandatory inputs

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/phases/208-human-operating-interface/208-CONTEXT.md`
- `.planning/phases/208-human-operating-interface/208-RESEARCH.md`
- `app/(markos)/layout-shell.tsx`
- `app/(markos)/operations/page.tsx`
- `app/(markos)/operations/tasks/page.tsx`
- `app/(markos)/crm/copilot/page.tsx`
- `app/(markos)/settings/mcp/page.tsx`
- `app/(markos)/settings/billing/page-shell.tsx`

## Current code evidence

- The current shell still brands itself as a "UI Control Plane".
- `app/(markos)/operations/page.tsx` is still a gated landing page for an older execution surface.
- `app/(markos)/operations/tasks/page.tsx` is explicitly fixture-backed.
- CRM already has approval-package style UI.
- MCP, billing, governance, and webhook pages already expose high-signal operator data that can feed the future cockpit.

## Codebase-specific gap

The repo already has many pieces of an operator interface, but they live as isolated pages:

- tasks
- approvals
- cost/budget
- billing evidence
- webhook health
- governance evidence

Phase 208 must unify them into one operating posture rather than add another disconnected dashboard.

## Scope (in)

- Morning Brief
- Task Board
- Approval Inbox
- Connector Recovery
- Weekly Narrative
- navigation and route strategy needed to make those first-class
- mobile-reactive operator flows

## Scope (out)

- parallel second shell or second dashboard application
- greenfield component system that ignores current pages
- passive metrics-only dashboards that do not create decisions or work

## Refreshed decisions

### D-208-01: Reuse the current `(markos)` shell

Phase 208 should evolve the existing shell instead of building a second one.

### D-208-02: Morning Brief should become the default operator landing experience

The current root/dashboard posture should move toward a daily decision surface, not remain a generic control panel.

### D-208-03: Operations is the migration anchor

`/markos/operations` and `/markos/operations/tasks` are the correct migration starting points because they already host authorization, task, and evidence concepts.

### D-208-04: Existing admin/settings pages are reusable signal sources

Billing, MCP, governance, and webhook surfaces should feed the cockpit rather than stay fully isolated forever.

### D-208-05: No hidden approvals

Approvals cannot stay buried in CRM-only or feature-specific pages. The inbox must centralize human decisions across domains.

## Threat-model focus

hidden approvals, stale work queues, connector failures with no owner, cost risk buried in settings pages, unsupported claims reaching humans without evidence, and mobile-invisible urgent work

## Success criteria

- Operators land in a decision-first experience.
- The task system is no longer fixture-only in planning terms.
- Approval work is centralized.
- Recovery work is visible with impacted workflows.
- Weekly narrative connects work to outcome rather than leaving insight scattered across pages.

## Open questions

- Should the Morning Brief fully own `/markos`, or should `/markos` redirect into `/markos/operations` after the shell migration?
- Which current feature pages should remain standalone versus becoming panels or drill-downs from the operating cockpit?
- What is the minimum mobile scope for approve/reject/recover behavior in the first implementation wave?

## Planning note

No new top-level phase is required. The deep audit confirms Phase 208 is the right home; it simply needs to be planned as a shell-and-surface migration, not a blank-screen dashboard build.

## References

- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `obsidian/work/incoming/10-HUMAN-INTERFACE-LAYER.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
