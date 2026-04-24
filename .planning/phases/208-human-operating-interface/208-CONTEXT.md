# Phase 208 Context - Human Operating Interface

**Status:** refreshed from the 2026-04-23 deep codebase-vault audit

## Why this phase exists

MarkOS already has an app shell and several operator-facing pages, but they do not yet behave like one operating system for human decisions. Phase 208 exists to consolidate those surfaces around work, approvals, recovery, and narrative.

## Canonical inputs

- `obsidian/work/incoming/10-HUMAN-INTERFACE-LAYER.md`
- `obsidian/reference/MarkOS v2 Operating Loop Spec.md`
- `.planning/V4.0.0-CODEBASE-VAULT-DEEP-AUDIT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/207-agentrun-v2-orchestration-substrate/207-CONTEXT.md`

## Existing implementation substrate to inspect

- `app/(markos)/layout-shell.tsx`
- `app/(markos)/page.tsx`
- `app/(markos)/operations/page.tsx`
- `app/(markos)/operations/tasks/*`
- `app/(markos)/crm/copilot/*`
- `app/(markos)/settings/mcp/page.tsx`
- `app/(markos)/settings/billing/page-shell.tsx`
- `app/(markos)/admin/governance/page.tsx`
- `components/markos/*`

## Required phase shape

1. Shift the current shell from "control plane" posture to operating-cockpit posture.
2. Define the default landing experience for daily decisions.
3. Replace fixture task state with persisted run/task/approval-backed state.
4. Centralize approvals across content, CRM, pricing, billing, connector, and public-claim decisions.
5. Make recovery and blocked work visible with owners and impacted workflows.
6. Turn existing signal pages into usable inputs for the Morning Brief and Weekly Narrative.
7. Keep mobile operator actions in-scope for the smallest critical workflows.

## Codebase-specific constraints

- The shell and route map already exist; Phase 208 should not ignore them.
- Current operations auth is still placeholder-oriented and will need real substrate backing.
- Current task UI already models evidence, retries, approvals, and step state, so it should be treated as a migration asset.
- Billing, MCP, governance, and webhook pages already contain operator-grade signal and evidence patterns that should be reused.

## Recommended route strategy

- `/markos` should evolve toward the Morning Brief
- `/markos/operations` should become the workboard/recovery cluster
- approvals should become a first-class centralized experience rather than remain embedded only in domain pages

## Non-negotiables

- No parallel second dashboard product inside the app.
- No hidden approvals in isolated feature pages.
- No recovery-critical failure without visible operator ownership.
- No pricing or claim approval flow without evidence visibility.
- No passive dashboard that fails to produce decisions or work items.

## Done means

The app shell, task model, approval experience, recovery experience, and weekly narrative feel like one operating system for humans rather than separate control pages.
