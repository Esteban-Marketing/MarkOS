---
phase: 200-saas-readiness-wave-0
plan: "08"
subsystem: marketing-landing
tags: [marketing, claude-marketplace, demo-sandbox, mcp]
dependency_graph:
  requires: [200-06]
  provides:
    - app/(marketing)/integrations/claude/page.tsx
    - app/(marketing)/integrations/claude/demo/page.tsx
    - app/(marketing)/integrations/claude/demo/api/route.ts
  affects: []
tech_stack:
  added: []
  patterns: [allow-list-proxy, ip-rate-limit, heuristic-voice-classifier]
key_files:
  created:
    - app/(marketing)/integrations/claude/page.tsx
    - app/(marketing)/integrations/claude/demo/page.tsx
    - app/(marketing)/integrations/claude/demo/api/route.ts
    - test/marketing/claude-landing.test.js
  modified: []
decisions:
  - "No runtime Canon pipeline call: archetypes + pains are documented in a header comment, and the copy is hand-written to the same target. runDraft-from-Canon integration would need a crmStore context that standalone marketing pages don't have."
  - "Voice classifier is a deterministic heuristic in the test, not a backend service. Matches the existing ui-a11y/accessibility.test.js source-level pattern and runs in <200ms."
  - "Demo sandbox proxy uses an ALLOWED_TOOLS allow-list to prevent anonymous visitors from invoking tools with side effects (schedule_post, rank_execution_queue against tenant data). Only read-only or draft tools are exposed: draft_message, run_neuro_audit, list_pain_points, explain_literacy."
  - "Rate limit is in-memory per-ip (20/min). Real durable rate-limit via Upstash or Vercel KV tracked for 200-08.1; current shape is a best-effort on single-instance Fluid Compute."
  - "OG image binary deferred: file path is referenced in Metadata; CI or asset-gen pipeline writes the PNG separately."
metrics:
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  tests_passing: 13
---

# Phase 200 Plan 08: Claude Marketplace Landing + Demo Summary

Shipped `/integrations/claude` landing page + `/integrations/claude/demo`
sandbox. Demo invokes draft_message (and 3 other read-only MCP tools) via a
rate-limited proxy. Hand-crafted copy scores 100 on the heuristic voice
classifier (≥85 threshold).

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Landing page + Metadata export + 10-tool grid | ✓ |
| 2 | Demo sandbox client + allow-listed proxy | ✓ |
| 3 | a11y + voice + security tests | ✓ 13/13 |

## Verification

- `node --test test/marketing/claude-landing.test.js` → 13/13 pass
- Covers: file existence, single h1, aria-labelledby on sections, Metadata shape,
  htmlFor binding, role=alert, no dangerouslySetInnerHTML, no inline script,
  allow-list + rate-limit presence, voice score ≥ 85

## Commits

- `feat(200-08): add Claude Marketplace landing + demo sandbox (13 tests pass)`

## Deferred (follow-up)

- **200-08.1** — OG image asset generation (scripts/assets/build-og.cjs)
- **200-08.2** — Durable rate-limit via Upstash / Vercel KV (replace per-process Map)
- **200-08.3** — Real browser axe scan once Playwright runner lands in devDeps
- **200-08.4** — Replace hand-crafted copy with a Canon pipeline call once a server-side rendered tenant context is available

## Self-Check: PASSED (13/13 tests, 1 atomic commit, allow-listed proxy, voice ≥85)
